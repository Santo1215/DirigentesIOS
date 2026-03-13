import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert  } from 'react-native';
import { useState } from 'react';
import { API_URL } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CodigoManualModal({ visible, onClose, user }) {
  const [codigo, setCodigo] = useState('');

  const registrarAsistencia = async () => {
    if (!codigo.trim()) {
      Alert.alert('Error', 'Ingrese el código');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/asistencia/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ codigo: codigo }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert('Error', data.error);
        return;
      }

      Alert.alert('OK', 'Asistencia registrada');
      setCodigo('');
      onClose();
    } catch {
      Alert.alert('Error', 'Error de conexión');
    }
  };


  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.bg}>
        <View style={styles.card}>
          <Text style={styles.title}>Ingresar código</Text>

          <TextInput
            placeholder="Código"
            style={styles.input}
            value={codigo}
            onChangeText={setCodigo}
            keyboardType="numeric"
          />

          <TouchableOpacity style={styles.btn} onPress={registrarAsistencia}>
            <Text style={{ fontWeight: 'bold' }}>Registrar</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose}>
            <Text style={{ marginTop: 10 }}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },
  btn: {
    backgroundColor: '#FFD685',
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
});
