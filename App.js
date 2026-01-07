import React, { useState } from 'react';
import { API_URL } from './api';
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
   ScrollView
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const App = ({navigation}) => {
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const handleLogin = async () => {
  if (!usuario || !password) {
    alert('Completa todos los campos');
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
        usuario,
        password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || 'Error al iniciar sesión');
      return;
    }
    navigation.replace('Home', {
      nombre: data.usuario.nombre,
      apellido: data.usuario.apellido,
    });
    console.log('LOGIN OK:', data);

  } catch (error) {
    console.error(error);
    alert('Error de conexión');
  } finally {
    setCargando(false);
  }
};

  const wavePath = "M0 305L30 337.7C60 370.3 120 435.7 180 451.7C240 467.7 300 434.3 360 400C420 365.7 480 330.3 510 312.7L540 295L540 961L510 961C480 961 420 961 360 961C300 961 240 961 180 961C120 961 60 961 30 961L0 961Z";

  return (
    
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
  >
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
        {/* Fondo principal */}
        <View style={styles.backgroundContainer}>
          <Image
            source={require('./assets/fondo.jpg')}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
          {/* Overlay oscuro */}
          <View style={styles.overlay} />
        </View>

        {/* Logo flotante */}
        <Image
          source={require('./assets/logo.png')}
          style={styles.logo}
        />

        {/* Contenedor principal con ola SVG */}
        <View style={styles.mainContainer}>
          {/* SVG de ola MÁS GRANDE y MENOS OPACO */}
          <View style={styles.waveContainer}>
            <Svg
              width={width}
              height={height*0.85}
              viewBox="0 100 540 960"
              preserveAspectRatio="xMidYMid slice"
              style={styles.waveSvg}
            >
              <Path
                d={wavePath}
                fill="#212121"
                fillOpacity="0.85" 
              />
            </Svg>
          </View>

          {/* Contenido sobre la ola */}
          <View style={styles.contentOverWave}>
            {/* Card de login */}
            <View style={styles.loginCard}>
              <Text style={styles.title}>Bienvenido</Text>

              {/* Campo de usuario */}
              <TextInput
                placeholder="Usuario"
                placeholderTextColor="#aaa"
                style={styles.input}
                value={usuario}
                onChangeText={setUsuario}
              />

              {/* Campo de contraseña */}
              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="Contraseña"
                  placeholderTextColor="#aaa"
                  secureTextEntry={!mostrarPassword}
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setMostrarPassword(!mostrarPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={mostrarPassword ? 'eye-off' : 'eye'}
                    size={24}
                    color="#aaa"
                  />
                </TouchableOpacity>
              </View>

              {/* Botón de ingreso */}
              <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Ingresar</Text>
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

  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    paddingHorizontal: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  passwordInput: {
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

export default App;