import React, { useState, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { API_URL } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

  const handleLogin = async () => {
    if (!usuario || !contrasena) {
      Alert.alert('Error', 'Completa todos los campos');
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
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Spacer flexible */}
        <View style={{ flex: 1 }} />

        {/* Ola inline */}
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

        {/* Formulario */}
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
    width: '700',
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
});