import React, { useState, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { API_URL } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';

import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

export default function Login({ navigation }) {
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario: usuario.trim(),
          contrasena: contrasena.trim(),
        }),
      });

      const data = await res.json();
      console.log('DATA DEL BACKEND:', data);

      if (!res.ok) {
        Alert.alert('Error', data.message || 'Error al iniciar sesión');
        return;
      }
      await AsyncStorage.setItem('token', data.token);
      setUser({ dirigente: data.dirigente});

      navigation.replace('Home');

    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  const wavePath =
    "M0 305L30 337.7C60 370.3 120 435.7 180 451.7C240 467.7 300 434.3 360 400C420 365.7 480 330.3 510 312.7L540 295L540 961L510 961C480 961 420 961 360 961C300 961 240 961 180 961C120 961 60 961 30 961L0 961Z";

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>

            <View style={styles.backgroundContainer}>
              <Image
                source={require('../assets/fondo.jpg')}
                style={styles.backgroundImage}
              />
              <View style={styles.overlay} />
            </View>

            <Image
              source={require('../assets/logo.png')}
              style={styles.logo}
            />

            <View style={styles.mainContainer}>
              <View style={styles.waveContainer}>
                <Svg
                  width={width}
                  height={height * 0.85}
                  viewBox="0 100 540 960"
                >
                  <Path d={wavePath} fill="#212121" fillOpacity="0.85" />
                </Svg>
              </View>

              <View style={styles.contentOverWave}>
                <View style={styles.loginCard}>
                  <Text style={styles.title}>Bienvenido</Text>

                  <TextInput
                    placeholder="Usuario"
                    placeholderTextColor="#aaa"
                    style={styles.input}
                    value={usuario}
                    onChangeText={setUsuario}
                  />

                  <View style={styles.contrasenaContainer}>
                    <TextInput
                      placeholder="Contraseña"
                      placeholderTextColor="#aaa"
                      secureTextEntry={!mostrarContrasena}
                      style={styles.contrasenaInput}
                      value={contrasena}
                      onChangeText={setContrasena}
                    />
                    <TouchableOpacity
                      onPress={() => setMostrarContrasena(!mostrarContrasena)}
                    >
                      <Ionicons
                        name={mostrarContrasena ? 'eye-off' : 'eye'}
                        size={24}
                        color="#aaa"
                      />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.button}
                    onPress={handleLogin}
                    disabled={cargando}
                  >
                    <Text style={styles.buttonText}>
                      {cargando ? 'Ingresando...' : 'Ingresar'}
                    </Text>
                  </TouchableOpacity>

                </View>
              </View>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  
  // Fondo principal
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundImage: {
    width: 700,
    height: '110%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)', // Más claro
  },

  // Logo
logo: {
  width: 200,
  height: 200,
  resizeMode: 'contain',
  alignSelf: 'center',
  zIndex: 3,
},


  // Contenedor principal
  mainContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  // Contenedor del SVG - MÁS GRANDE
  waveContainer: {
    position: 'absolute',
    bottom: 0,
    width: width,
    height: height * 0.8,
    zIndex: 1,
  },
  waveSvg: {
    width: '100%',
    height: '100%',
  },

  // Contenido sobre la ola - MÁS ARRIBA
  contentOverWave: {
    bottom: height * 0.25, // 25% desde abajo (más arriba)
    width: width,
    zIndex: 2,
    alignItems: 'center',
  },

  // Card de login
  loginCard: {
    position: 'absolute',
    bottom: height * -0.15,
    width: width * 0.9, // Más ancho
    borderRadius: 25,
    paddingHorizontal: 30,
    paddingVertical: 35,
  },

  // Título
  title: {
    color: '#fff',
    fontSize: 30, // Más grande
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },

  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    color: '#fff',
    fontSize: 17,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  contrasenaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    paddingHorizontal: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  contrasenaInput: {
    flex: 1,
    paddingVertical: 15,
    color: '#fff',
    fontSize: 17,
  },

  eyeIcon: {
    padding: 5,
  },

  button: {
    backgroundColor: '#F5A300',
    paddingVertical: 10, // Más alto
    borderRadius: 50,
    alignItems: 'center',
  },

  buttonText: {
    color: '#000',
    fontSize: 19, // Más grande
    fontWeight: 'bold',
  },
});