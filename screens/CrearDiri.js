import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Platform
} from 'react-native';
import { API_URL } from '../api';

export default function CrearDiri({ navigation }) {

  const [form, setForm] = useState({
    nombre: '',
    segundo_nombre:'',
    apellido: '',
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [credsModal, setCredsModal] = useState(false);
  const [credsData, setCredsData] = useState(null);

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const crearDirigente = async () => {
    setErrorMsg('');
    if (!form.nombre || !form.apellido) {
      setErrorMsg('Completa todos los campos');
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
        setErrorMsg(data.message || 'Error al crear dirigente');
        return;
      }

      setCredsData(data.dirigente);
      setCredsModal(true);
      setForm({ nombre: '', segundo_nombre: '', apellido: '' });

    } catch (error) {
      console.error(error);
      setErrorMsg('Error de conexión');
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

        {errorMsg ? (
          <Text style={styles.errorText}>{errorMsg}</Text>
        ) : null}

      </ScrollView>

      {/* MODAL CREDENCIALES */}
      <Modal transparent animationType="fade" visible={credsModal} onRequestClose={() => setCredsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>✅ Dirigente creado</Text>
            <Text style={styles.modalLabel}>Usuario</Text>
            <Text style={styles.modalValue}>{credsData?.usuario}</Text>
            <Text style={styles.modalLabel}>Contraseña</Text>
            <Text style={styles.modalValue}>{credsData?.contrasena}</Text>
            <Text style={styles.modalLabel}>Rol</Text>
            <Text style={styles.modalValue}>Levitando</Text>
            <Text style={[styles.modalLabel, { marginTop: 10, color: '#888', fontSize: 12 }]}>
              QR generado automáticamente
            </Text>
            <TouchableOpacity style={styles.modalBtn} onPress={() => setCredsModal(false)}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  errorText: {
    color: '#c0392b',
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 12,
    color: '#888',
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  modalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0E1525',
    alignSelf: 'flex-start',
    letterSpacing: 1,
  },
  modalBtn: {
    marginTop: 20,
    backgroundColor: '#F5A300',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
});