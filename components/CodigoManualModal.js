import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useState } from 'react';
import { API_URL } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Devuelve la hora local en formato HH:MM:SS (Colombia UTC-5)
const getHoraLocal = () => {
  const ahora = new Date();
  const offsetMs = -5 * 60 * 60 * 1000; // UTC-5 Colombia
  const local = new Date(ahora.getTime() + offsetMs);
  return local.toISOString().split('T')[1].split('.')[0]; // "HH:MM:SS"
};

// Devuelve la fecha local en formato YYYY-MM-DD (Colombia UTC-5)
const getFechaLocal = () => {
  const ahora = new Date();
  const offsetMs = -5 * 60 * 60 * 1000;
  const local = new Date(ahora.getTime() + offsetMs);
  return local.toISOString().split('T')[0]; // "YYYY-MM-DD"
};

export default function CodigoManualModal({ visible, onClose, user }) {
  const [codigo, setCodigo] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const registrarAsistencia = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!codigo.trim()) {
      setErrorMsg('Ingrese el código');
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
        body: JSON.stringify({
          codigo: codigo,
          hora_llegada: getHoraLocal(),
          fecha: getFechaLocal(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Error al registrar');
        return;
      }

      setSuccessMsg('Asistencia registrada');
      setCodigo('');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1200);
    } catch {
      setErrorMsg('Error de conexión');
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
            onChangeText={v => { setCodigo(v); setErrorMsg(''); }}
            keyboardType="numeric"
          />

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
          {successMsg ? <Text style={styles.successText}>{successMsg}</Text> : null}

          <TouchableOpacity style={styles.btn} onPress={registrarAsistencia}>
            <Text style={{ fontWeight: 'bold' }}>Registrar</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setCodigo(''); setErrorMsg(''); onClose(); }}>
            <Text style={{ marginTop: 10, textAlign: 'center' }}>Cancelar</Text>
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
    marginBottom: 10,
  },
  btn: {
    backgroundColor: '#FFD685',
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 5,
  },
  errorText: {
    color: '#c0392b',
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'center',
  },
  successText: {
    color: '#27ae60',
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
});
