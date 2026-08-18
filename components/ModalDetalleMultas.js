import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../api';
import { UserContext } from '../context/UserContext';

export default function ModalDetalleMultas({ visible, dirigente, token, onClose, onRefresh }) {
  const [multas, setMultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  const { user } = useContext(UserContext);
  const rol = user?.dirigente?.rol;
  const comite = user?.dirigente?.comite;

  useEffect(() => {
    if (!dirigente) return;
    const cargarMultas = async () => {
      setLoading(true);
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
        setErrorMsg('No se pudo eliminar la multa');
        setConfirmId(null);
        return;
      }

      setMultas((prev) => prev.filter((m) => m.id_multa !== confirmId));
      setConfirmId(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      setErrorMsg('Error de conexión');
      setConfirmId(null);
    }
  };

  const formatearFecha = (fechaCruda) => {
    if (!fechaCruda) return '';
    const partes = fechaCruda.split('T')[0].split('-');
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
    ];
    const dia = parseInt(partes[2], 10);
    const mes = meses[parseInt(partes[1], 10) - 1];
    const año = partes[0];
    return `${dia} de ${mes} de ${año}`;
  };

  // Filtrado correcto según el rol o comité
  const multasFiltradas = multas.filter(m => {
    const motivoLower = m.motivo ? m.motivo.toLowerCase() : '';
    const esIntegracionMotivo = motivoLower.includes('integración') || motivoLower.includes('integracion');

    if (comite === 'Integración' || rol === 'Integración') {
      // El comité de integración solo debe ver multas de integración
      return esIntegracionMotivo;
    }
    
    if (rol === 'Coordinación' || rol === 'ADMIN') {
      // Coordinación ve las multas generales (excluyendo las de integración si corresponden a otro comité)
      return !esIntegracionMotivo;
    }

    return true;
  });

  const puedeEliminar = (item) => {
    const motivoLower = item.motivo ? item.motivo.toLowerCase() : '';
    const esIntegracionMotivo = motivoLower.includes('integración') || motivoLower.includes('integracion');
    
    if (comite === 'Integración' || rol === 'Integración') {
      return esIntegracionMotivo;
    }
    
    if (rol === 'Coordinación' || rol === 'ADMIN') {
      return !esIntegracionMotivo;
    }

    return false;
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>
            Multas de {dirigente.nombre} {dirigente.apellido}
          </Text>

          {loading ? (
            <ActivityIndicator size="small" color="#4F46E5" style={{ marginVertical: 30 }} />
          ) : multasFiltradas.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#10B981" />
              <Text style={styles.emptyText}>No hay multas que mostrar para este rol</Text>
            </View>
          ) : (
            <FlatList
              data={multasFiltradas}
              keyExtractor={(item) => item.id_multa.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.multaRow}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.motivo}>{item.motivo}</Text>
                    <Text style={styles.monto}>
                      ${Number(item.monto).toLocaleString()}
                    </Text>
                    <Text style={styles.fecha}>
                      Fecha: {formatearFecha(item.fecha)}
                    </Text>
                    {item.detalle ? (
                      <Text style={styles.detalle}>{item.detalle}</Text>
                    ) : null}
                  </View>

                  {puedeEliminar(item) && (
                    <TouchableOpacity 
                      style={styles.deleteBtn}
                      onPress={() => setConfirmId(item.id_multa)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            />
          )}

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.closeText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal transparent animationType="fade" visible={!!confirmId} onRequestClose={() => setConfirmId(null)}>
        <View style={styles.overlay}>
          <View style={styles.confirmBox}>
            <Ionicons name="alert-circle" size={40} color="#EF4444" style={{ marginBottom: 10 }} />
            <Text style={styles.confirmTitle}>¿Eliminar multa?</Text>
            <Text style={styles.confirmText}>Esta acción es irreversible y actualizará el balance.</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: '#F1F5F9' }]}
                onPress={() => setConfirmId(null)}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#475569', fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: '#EF4444' }]}
                onPress={confirmarEliminacion}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Eliminar</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    color: '#0F172A',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  multaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  motivo: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  monto: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  fecha: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
  },
  detalle: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
    fontStyle: 'italic',
  },
  deleteBtn: {
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
  },
  closeBtn: {
    marginTop: 20,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  closeText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 15,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  confirmBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    color: '#0F172A',
  },
  confirmText: {
    color: '#64748B',
    fontSize: 13,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 18,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
});