import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../api';

export default function ModalDetalleMultas({ visible, dirigente, token, onClose }) {
  const [multas, setMultas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dirigente) return;

    const cargarMultas = async () => {
      try {
        const res = await fetch(
          `${API_URL}/multas/dirigente/${dirigente.id_dirigente}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        if (res.ok) setMultas(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    cargarMultas();
  }, [dirigente]);

  const eliminarMulta = async (id_multa) => {
    Alert.alert(
      'Eliminar multa',
      '¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/multa/${id_multa}`, {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (!res.ok) {
                Alert.alert('Error', 'No se pudo eliminar');
                return;
              }

              setMultas(prev => prev.filter(m => m.id_multa !== id_multa));
            } catch (err) {
              Alert.alert('Error', 'Error de conexión');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>
            Multas de {dirigente.nombre} {dirigente.apellido}
          </Text>

          {loading ? (
            <Text>Cargando...</Text>
          ) : multas.length === 0 ? (
            <Text style={{ marginTop: 20 }}>No tiene multas</Text>
          ) : (
            <FlatList
              data={multas}
              keyExtractor={(item) => item.id_multa.toString()}
              renderItem={({ item }) => (
                <View style={styles.multaRow}>
                  <View>
                    <Text style={styles.motivo}>{item.motivo}</Text>
                    <Text style={styles.fecha}>
                      ${Number(item.monto).toLocaleString()}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => eliminarMulta(item.id_multa)}
                  >
                    <Ionicons name="trash" size={22} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              )}
            />
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={{ fontWeight: 'bold' }}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  multaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  motivo: {
    fontSize: 15,
    fontWeight: '500',
  },
  fecha: {
    color: '#555',
    marginTop: 4,
  },
  closeBtn: {
    marginTop: 20,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#eee',
    borderRadius: 12,
  },
});
