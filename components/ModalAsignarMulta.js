import React, { useEffect, useState, useContext } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../api';
import { Picker } from '@react-native-picker/picker';
import { UserContext } from '../context/UserContext';

export default function ModalAsignarMulta({
  visible,
  onClose,
  token,
  onSuccess,
}) {
  const [dirigentes, setDirigentes] = useState([]);
  const [dirigenteId, setDirigenteId] = useState(null);
  const [monto, setMonto] = useState('');
  const [motivo, setMotivo] = useState('');
  const [detalle, setDetalle] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const { user } = useContext(UserContext);
  const {rol,comite} = user.dirigente;

  useEffect(() => {
    if (!visible) return;
    const cargarDirigentes = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/dirigentes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setDirigentes(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    cargarDirigentes();
  }, [visible]);

  const asignarMulta = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!dirigenteId || !monto || !motivo) {
      setErrorMsg('Todos los campos principales son obligatorios');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/multas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id_dirigente: dirigenteId,
          monto: Number(monto),
          motivo,
          Detalle: detalle || null,
        }),
      });

      if (!res.ok) {
        setErrorMsg('No se pudo asignar la multa');
        return;
      }

      setSuccessMsg('¡Multa asignada correctamente!');
      setTimeout(() => {
        setSuccessMsg('');
        setMonto('');
        setMotivo('');
        setDetalle('');
        setDirigenteId(null);
        onSuccess();
        onClose();
      }, 1200);
    } catch {
      setErrorMsg('Error de conexión al asignar multa');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Asignar Multa</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color="#4F46E5" style={{ marginVertical: 20 }} />
          ) : (
            <>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={dirigenteId}
                  onValueChange={(value) => setDirigenteId(value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Selecciona un dirigente..." value={null} color="#94A3B8" />
                  {dirigentes.map((d) => (
                    <Picker.Item
                      key={d.id_dirigente}
                      label={`${d.nombre} ${d.apellido}`}
                      value={d.id_dirigente}
                      color="#1E293B"
                    />
                  ))}
                </Picker>
              </View>

              <View style={styles.pickerWrapper}>
                <Picker 
                  selectedValue={motivo} 
                  onValueChange={setMotivo}
                  style={styles.picker}
                >
                  <Picker.Item label="Seleccionar motivo..." value="" color="#94A3B8" />
                  {(rol === 'Coordinación') && (
                  <Picker.Item label="Retraso" value="Retraso" color="#1E293B" />
                  )}
                  {(rol === 'Coordinación') && (
                  <Picker.Item label="Inasistencia injustificada" value="Inasistencia injustificada" color="#1E293B" />
                  )}
                  {(rol === 'Coordinación') && (
                    <Picker.Item label="Símbolos" value="Símbolos" color="#1E293B" />
                  )}

                  {(rol === 'Coordinación') && (
                    <Picker.Item label="Incumplimiento de tareas" value="Incumplimiento de tareas" color="#1E293B" />
                  )}

                  {comite === 'Integración' && (
                    <Picker.Item label="Incumplimiento de Integración" value="Incumplimiento de Integración" color="#1E293B" />
                  )}
                </Picker>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Monto ($)"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={monto}
                onChangeText={setMonto}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descripción o información relevante..."
                placeholderTextColor="#94A3B8"
                value={detalle}
                onChangeText={setDetalle}
                multiline
              />
            </>
          )}

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
          {successMsg ? <Text style={styles.successText}>{successMsg}</Text> : null}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmBtn} onPress={asignarMulta} activeOpacity={0.8}>
              <Text style={styles.confirmText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 10,
    fontSize: 15,
    backgroundColor: '#F8FAFC',
    color: '#1E293B',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 15,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FFA726',
    alignItems: 'center',
  },
  confirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
  successText: {
    color: '#10B981',
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
});