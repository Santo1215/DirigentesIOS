import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { API_URL } from '../api';

export default function CrearDiri({ navigation }) {

  const [form, setForm] = useState({
    nombre: '',
    segundo_nombre:'',
    apellido: '',
  });

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const crearDirigente = async () => {
    if (!form.nombre || !form.apellido) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/dirigente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre,
          segundo_nombre: form.segundo_nombre || '',
          apellido: form.apellido,
          rol: 'Levitando',
          comite: null,
          id_tribu: null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert('Error', data.message || 'Error al crear dirigente');
        return;
      }

      Alert.alert(
        'Dirigente creado',
        `Usuario: ${data.dirigente.usuario}
        \nContraseña: ${data.dirigente.contrasena}
        \nRol: Levitando
        \nQR generado automáticamente`
      );

      setForm({
        nombre: '',
        segundo_nombre: '',
        apellido: '',
      });

    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Error de conexión');
    }
  };

  return (
    <View style={styles.contendor}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Botón de volver simple */}
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Crear Dirigente</Text>

        <TextInput
          placeholder="Nombre"
          style={styles.input}
          value={form.nombre}
          onChangeText={(v) => handleChange('nombre', v)}
        />
        <TextInput
          placeholder="Segundo nombre (Opcional)"
          style={styles.input}
          value={form.segundo_nombre}
          onChangeText={(v) => handleChange('segundo_nombre', v)}
        />

        <TextInput
          placeholder="Apellido"
          style={styles.input}
          value={form.apellido}
          onChangeText={(v) => handleChange('apellido', v)}
        />

        {/* INFO CLARA */}
        <Text style={styles.info}>
          El dirigente se crea con rol <Text style={{ fontWeight: 'bold' }}>Levitando</Text>.
          Comité y tribu se asignan posteriormente.
        </Text>

        <TouchableOpacity style={styles.button} onPress={crearDirigente}>
          <Text style={styles.buttonText}>Crear Dirigente</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contendor: { flex: 1 },
  container: {
    padding: 20,
    paddingBottom: 40,
    flex:1,
  },
  // Botón de volver
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 0,
    padding: 10,
  },
  backIcon: {
    fontSize: 40,
    color: '#F5A300',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },
  info: {
    fontSize: 13,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#F5A300',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#fff',
  },
});