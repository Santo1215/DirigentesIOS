import React, { useState, useContext, useEffect } from 'react';
import { UserContext } from '../context/UserContext';
import { API_URL } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import {
  StyleSheet, Text, View, TextInput,
  TouchableOpacity, Image, Dimensions,
  KeyboardAvoidingView, Platform, ScrollView, Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

// Llave pública VAPID (segura de exponer en el cliente, es la mitad "pública" del par)
const VAPID_PUBLIC_KEY = 'BBCbXwhvuOh9cpxMTD5ziRvW1uykMUCVGrmLK_Tnf4MkjkkkTVtc2kUtaeWDJN_TUtPw4A5HUck6Wogq9EvFZAI';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/* Registrar suscripción de notificaciones push del navegador (versión web) */
const registrarPushTokenWeb = async (authToken) => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('⚠️ Este navegador no soporta notificaciones push');
    return;
  }

  try {
    const permiso = await Notification.requestPermission();
    if (permiso !== 'granted') return;

    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    await fetch(`${API_URL}/push-token/web`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ subscription }),
    });
    console.log('✅ Suscripción web registrada');
  } catch (err) {
    console.log('⚠️ No se pudo registrar la suscripción web:', err.message);
  }
};

/* Registrar push token en el backend (silencioso, no bloquea login) */
const registrarPushToken = async (authToken) => {
  if (Platform.OS === 'web') return registrarPushTokenWeb(authToken);
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '74f86b79-7475-4aa0-8400-9c6253e2095e',
    });
    const pushToken = tokenData.data;

    await fetch(`${API_URL}/push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ token: pushToken }),
    });
    console.log('✅ Push token registrado:', pushToken);
  } catch (err) {
    console.log('⚠️ No se pudo registrar push token:', err.message);
  }
};

const { width } = Dimensions.get('window');

function LoginContent({ navigation }) {
  const insets = useSafeAreaInsets();
  const { setUser } = useContext(UserContext);

  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [biometriaDisponible, setBiometriaDisponible] = useState(false);
  const [tieneCreds, setTieneCreds] = useState(false);

  useEffect(() => {
    verificarBiometria();
  }, []);

  const verificarBiometria = async () => {
    if (Platform.OS === 'web') return;
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    const usuarioGuardado = await SecureStore.getItemAsync('usuario');

    if (compatible && enrolled && usuarioGuardado) {
      setBiometriaDisponible(true);
      setTieneCreds(true);
      // Intentar biometría automáticamente al abrir
      loginConBiometria();
    }
  };

  const loginConBiometria = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Ingresa con tu huella o Face ID',
      fallbackLabel: 'Usar contraseña',
      cancelLabel: 'Cancelar',
    });

    if (result.success) {
      const usuarioGuardado = await SecureStore.getItemAsync('usuario');
      const contrasenaGuardada = await SecureStore.getItemAsync('contrasena');
      if (usuarioGuardado && contrasenaGuardada) {
        await realizarLogin(usuarioGuardado, contrasenaGuardada);
      }
    }
  };

  const realizarLogin = async (user, pass) => {
    try {
      setCargando(true);
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario: user.trim(),
          contrasena: pass.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || 'Error al iniciar sesión');
        return;
      }
      await AsyncStorage.setItem('token', data.token);
      setUser({ dirigente: data.dirigente });
      registrarPushToken(data.token);
      navigation.replace('Home');
    } catch (error) {
      setErrorMsg('Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  const handleLogin = async () => {
    setErrorMsg('');
    if (!usuario || !contrasena) {
      setErrorMsg('Completa todos los campos');
      return;
    }

    try {
      setCargando(true);
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario: usuario.trim(),
          contrasena: contrasena.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || 'Error al iniciar sesión');
        return;
      }

      await AsyncStorage.setItem('token', data.token);
      setUser({ dirigente: data.dirigente });
      registrarPushToken(data.token);

      // Preguntar biometría ANTES de navegar, solo en móvil
      if (Platform.OS !== 'web') {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        const yaGuardado = await SecureStore.getItemAsync('usuario');

        if (compatible && enrolled && !yaGuardado) {
          Alert.alert(
            '¿Activar biometría?',
            'La próxima vez podrás ingresar con huella o Face ID',
            [
              {
                text: 'No',
                style: 'cancel',
                onPress: () => navigation.replace('Home'),
              },
              {
                text: 'Sí, activar',
                onPress: async () => {
                  await SecureStore.setItemAsync('usuario', usuario.trim());
                  await SecureStore.setItemAsync('contrasena', contrasena.trim());
                  setBiometriaDisponible(true);
                  setTieneCreds(true);
                  navigation.replace('Home');
                },
              },
            ]
          );
          return;
        }
      }

      navigation.replace('Home');

    } catch (error) {
      setErrorMsg('Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Fondo */}
      <View style={StyleSheet.absoluteFill}>
        <Image
          source={require('../assets/fondo.jpg')}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        <View style={styles.overlay} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }
        ]}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={{ flex: 1 }} />

        <Svg
          width={width}
          height={80}
          viewBox="0 0 800 200"
          preserveAspectRatio="none"
          style={{ display: 'block' }}
        >
          <Path
            d="M 0,200 L 0,-10 C 200,0 200,160 400,160 C 600,160 600,40 800,100 L 800,200 Z"
            fill="#212121"
            fillOpacity={0.85}
          />
        </Svg>

        <View style={styles.form}>
          <Text style={styles.title}>Bienvenido</Text>

          <TextInput
            placeholder="Usuario"
            placeholderTextColor="#aaa"
            style={styles.input}
            value={usuario}
            onChangeText={setUsuario}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />

          <View style={styles.passwordRow}>
            <TextInput
              placeholder="Contraseña"
              placeholderTextColor="#aaa"
              secureTextEntry={!mostrarContrasena}
              style={styles.passwordInput}
              value={contrasena}
              onChangeText={setContrasena}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity
              onPress={() => setMostrarContrasena(v => !v)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={mostrarContrasena ? 'eye-off' : 'eye'}
                size={22}
                color="#aaa"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, cargando && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={cargando}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {cargando ? 'Ingresando...' : 'Ingresar'}
            </Text>
          </TouchableOpacity>

          {/* Mensaje de error inline */}
          {errorMsg ? (
            <Text style={styles.errorText}>{errorMsg}</Text>
          ) : null}

          {/* Botón biometría */}
          {biometriaDisponible && tieneCreds && (
            <TouchableOpacity
              style={styles.biometriaBtn}
              onPress={loginConBiometria}
              activeOpacity={0.7}
            >
              <Ionicons
                name={Platform.OS === 'ios' ? 'scan' : 'finger-print'}
                size={32}
                color="#F5A300"
              />
              <Text style={styles.biometriaText}>Ingresar con biometría</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function Login({ navigation }) {
  return (
    <SafeAreaProvider>
      <LoginContent navigation={navigation} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    width: '100%',
    height: '110%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  scroll: {
    flexGrow: 1,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: width * 0.45,
    height: width * 0.45,
    maxWidth: 200,
    maxHeight: 200,
  },
  form: {
    backgroundColor: 'rgba(33,33,33,0.85)',
    paddingHorizontal: width * 0.07,
    paddingTop: 28,
    paddingBottom: 36,
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingHorizontal: 18,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#F5A300',
    paddingVertical: 15,
    borderRadius: 50,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: 17,
    fontWeight: '700',
  },
  biometriaBtn: {
    marginTop: 20,
    alignItems: 'center',
    gap: 8,
  },
  biometriaText: {
    color: '#F5A300',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
});