import React, { useState, useContext, useEffect } from 'react';
import { UserContext } from '../context/UserContext';
import { API_URL } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import {
  StyleSheet, Text, View, TextInput,
  TouchableOpacity, Image, Dimensions,
  KeyboardAvoidingView, Platform, ScrollView, Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

function LoginContent({ navigation }) {
  const insets = useSafeAreaInsets();
  const { setUser } = useContext(UserContext);

  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [biometriaDisponible, setBiometriaDisponible] = useState(false);
  const [tieneCreds, setTieneCreds] = useState(false);

  // Al montar, verificar si hay biometría y credenciales guardadas
  useEffect(() => {
    verificarBiometria();
  }, []);

  const verificarBiometria = async () => {
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
        Alert.alert('Error', data.message || 'Error al iniciar sesión');
        return;
      }
      await AsyncStorage.setItem('token', data.token);
      setUser({ dirigente: data.dirigente });
      navigation.replace('Home');
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  const handleLogin = async () => {
    if (!usuario || !contrasena) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }

    await realizarLogin(usuario, contrasena);

    // Si el login fue exitoso, preguntar si guardar credenciales
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (compatible && enrolled) {
      Alert.alert(
        '¿Activar biometría?',
        'La próxima vez podrás ingresar con huella o Face ID',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Sí, activar',
            onPress: async () => {
              await SecureStore.setItemAsync('usuario', usuario.trim());
              await SecureStore.setItemAsync('contrasena', contrasena.trim());
              setTieneCreds(true);
              setBiometriaDisponible(true);
            },
          },
        ]
      );
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
});