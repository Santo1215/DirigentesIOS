import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../api';
import { useContext } from 'react';
import { UserContext } from '../context/UserContext';

export default function ModalDetalleMultas({ visible, dirigente, token, onClose }) {
  const [multas, setMultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState(null); // id de multa a eliminar
  const [errorMsg, setErrorMsg] = useState('');
  const { user } = useContext(UserContext);
  const { rol } = user.dirigente;

  useEffect(() => {
    if (!dirigente) return;

    const cargarMultas = async () => {
      try {
        const res = await fetch(
          `${API_URL}/multas/dirigente/${dirigente.id_dirigente}`,
          { headers: { Authorization: `Bearer ${token}` } }
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

  const confirmarEliminacion = async () => {
    if (!confirmId) return;
    setErrorMsg('');
    try {
      const res = await fetch(`${API_URL}/multa/${confirmId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setErrorMsg('No se pudo eliminar');
        setConfirmId(null);
        return;
      }

      setMultas(prev => prev.filter(m => m.id_multa !== confirmId));
      setConfirmId(null);
    } catch (err) {
      setErrorMsg('Error de conexión');
      setConfirmId(null);
    }
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
                  <View style={{ flex: 1 }}>
                    <Text style={styles.motivo}>{item.motivo}</Text>
                    <Text style={styles.fecha}>
                      ${Number(item.monto).toLocaleString()}
                    </Text>
                    {item.detalle ? (
                      <Text style={styles.detalle}>{item.detalle}</Text>
                    ) : null}
                  </View>
                  {rol === 'Coordinación' && (
                    <TouchableOpacity onPress={() => setConfirmId(item.id_multa)}>
                      <Ionicons name="trash" size={22} color="#e74c3c" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            />
          )}

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={{ fontWeight: 'bold' }}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* MODAL CONFIRMAR ELIMINACIÓN */}
      <Modal transparent animationType="fade" visible={!!confirmId} onRequestClose={() => setConfirmId(null)}>
        <View style={styles.overlay}>
          <View style={styles.confirmBox}>
            <Ionicons name="warning" size={32} color="#e74c3c" style={{ marginBottom: 10 }} />
            <Text style={styles.confirmTitle}>¿Eliminar multa?</Text>
            <Text style={styles.confirmText}>Esta acción no se puede deshacer.</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: '#eee' }]}
                onPress={() => setConfirmId(null)}
              >
                <Text style={{ color: '#333', fontWeight: '600' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: '#e74c3c' }]}
                onPress={confirmarEliminacion}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  detalle: {
    color: '#888',
    fontSize: 13,
    marginTop: 4,
    fontStyle: 'italic',
  },
  closeBtn: {
    marginTop: 20,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#eee',
    borderRadius: 12,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  confirmBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  confirmText: {
    color: '#666',
    fontSize: 13,
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
});
