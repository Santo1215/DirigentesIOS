import { useEffect, useState } from 'react';
import {
  View, Text, SectionList, ActivityIndicator,
  StyleSheet, TouchableOpacity, Modal, Platform, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../api';
import BottomNav from '../components/navbar';
import WaveBackground from '../components/WaveBackground';

let DateTimePicker = null;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

const getFechaLocal = () => {
  const ahora = new Date();
  const y = ahora.getFullYear();
  const m = String(ahora.getMonth() + 1).padStart(2, '0');
  const d = String(ahora.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const parseFechaLocal = (fechaStr) => {
  const [y, m, d] = fechaStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export default function AsistenciaTribusScreen({ navigation }) {
  const [fecha, setFecha] = useState(getFechaLocal());
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarPicker, setMostrarPicker] = useState(false);
  const [token, setToken] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ visible: false, tipo: null });
  const [enviandoNotif, setEnviandoNotif] = useState(false);
  const [notifModal, setNotifModal] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('token').then(setToken);
  }, []);

  useEffect(() => {
    if (token) cargarAsistencia();
  }, [fecha, token]);

  /* ===============================
     Helpers
  =============================== */

  const estadoColor = (estado) => {
    if (estado === 'Presente') return '#4CAF50';
    if (estado === 'Ausente') return '#F44336';
    return '#F44336';
  };
  const TRIBU_COLORS = {
    Judá: { bg: '#57B9FF', text: 'black' },
    Levi: { bg: '#ED2100', text: 'black' },
    Zabulón: { bg: '#002A85', text: 'white' },
    Dan: { bg: '#000000', text: 'white' },
    Aser: { bg: '#88E788', text: 'black' },
    Gad: { bg: '#0F3D3E', text: 'white' },
    Simeón: { bg: '#40E0D0', text: 'black' },
    Neftalí: { bg: '#FF891B', text: 'black' },
    Benjamín: { bg: '#960D32', text: 'white' },
    José: { bg: '#D7D7D7', text: 'black' },
    Isacar: { bg: '#A745D6', text: 'white' },
    Rubén: { bg: '#06402B', text: 'white' },
  };

  const getTribuColors = (tribu) => {
    return TRIBU_COLORS[tribu] || { bg: '#EEEEEE', text: '#333' };
  };


  /* ===============================
     Backend
  =============================== */

  const cargarAsistencia = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/asistencia/exoditos/${fecha}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const json = await res.json();

      // Agrupar por tribu → SectionList
      const agrupado = {};
      json.forEach(item => {
        if (!agrupado[item.tribu]) agrupado[item.tribu] = [];
        agrupado[item.tribu].push(item);
      });

      const sectionsFormateadas = Object.keys(agrupado).map(tribu => ({
        title: tribu,
        data: agrupado[tribu],
      }));

      setSections(sectionsFormateadas);
    } finally {
      setLoading(false);
    }
  };
  // ===============================
  // Stats globales
  // ===============================

  const todos = sections.flatMap(s => s.data);

  const presentes = todos.filter(e => e.estado === 'Presente').length;
  const ausentes = todos.filter(e => e.estado === 'Ausente').length;
  const total = ((presentes / (presentes + ausentes)) * 100).toFixed(1) || 0;

  /* ===============================
     Eliminar asistencia
  =============================== */

  const eliminarAsistencia = async (tipo) => {
    const endpoint = tipo === 'exoditos'
      ? `${API_URL}/asistencia/exoditos`
      : `${API_URL}/asistencia/dirigentes`;

    try {
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();

      if (!res.ok) {
        if (Platform.OS === 'web') {
          alert(json.error || 'Error al eliminar');
        } else {
          Alert.alert('Error', json.error || 'Error al eliminar');
        }
        return;
      }

      const msg = `${json.mensaje} (${json.eliminados} registros)`;
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('Éxito', msg);
      }

      cargarAsistencia();
    } catch (err) {
      const errorMsg = 'Error de conexión al eliminar';
      if (Platform.OS === 'web') {
        alert(errorMsg);
      } else {
        Alert.alert('Error', errorMsg);
      }
    }
  };

  /* ===============================
     Enviar notificación recordatorio
  =============================== */

  const enviarRecordatorio = async () => {
    setEnviandoNotif(true);
    try {
      const res = await fetch(
        `${API_URL}/notificacion/recordatorio-tribu`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const json = await res.json();

      if (!res.ok) {
        const errorMsg = json.error || 'Error al enviar notificación';
        if (Platform.OS === 'web') {
          alert(errorMsg);
        } else {
          Alert.alert('Error', errorMsg);
        }
        return;
      }

      const msg = `Notificación enviada a ${json.enviados} dispositivo(s)`;
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('Enviado', msg);
      }
    } catch (err) {
      const errorMsg = 'Error de conexión al enviar notificación';
      if (Platform.OS === 'web') {
        alert(errorMsg);
      } else {
        Alert.alert('Error', errorMsg);
      }
    } finally {
      setEnviandoNotif(false);
      setNotifModal(false);
    }
  };

  /* ===============================
     Loading
  =============================== */

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FFA726" />
        <Text style={styles.loadingText}>Cargando asistencia...</Text>
      </View>
    );
  }

  /* ===============================
     UI
  =============================== */

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Asistencia por tribu</Text>
          <Text style={styles.date}>{fecha}</Text>

          <TouchableOpacity onPress={() => setMostrarPicker(true)}>
            <Text style={{ color: '#fff', marginTop: 5 }}>
              Cambiar fecha
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Botones: eliminar + notificación */}
      <View style={styles.deleteButtonsRow}>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => setConfirmModal({ visible: true, tipo: 'exoditos' })}
        >
          <Text style={styles.deleteBtnText}>Eliminar asist. exoditos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => setNotifModal(true)}
        >
          <Text style={styles.notifBtnText}>Enviar recordatorio</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{presentes}</Text>
          <Text style={styles.statLabel}>Presentes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, styles.absentNumber]}>
            {ausentes}
          </Text>
          <Text style={styles.statLabel}>Ausentes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{total}%</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {/* Lista por tribu */}
      <SectionList
        style={{ zIndex: 2 }}
        sections={sections}
        keyExtractor={(item) => item.id_exodito.toString()}
        contentContainerStyle={{ paddingBottom: 80 }}
        renderSectionHeader={({ section }) => {
          const { bg, text } = getTribuColors(section.title);

          const presentes = section.data.filter(e => e.estado === 'Presente').length;
          const ausentes = section.data.filter(e => e.estado === 'Ausente').length;
          const total = (presentes + ausentes) > 0 ? ((presentes / (presentes + ausentes)) * 100).toFixed(1) : 0;

          return (
            <View style={[
              styles.tribuHeader,
              { backgroundColor: bg }
            ]}>
              <Text style={[
                styles.tribuTitle,
                { color: text }
              ]}>
                {section.title}
              </Text>

              <View style={styles.tribuStats}>
                <Text style={[styles.tribuStat, { color: text }]}>Presentes: {presentes}</Text>
                <Text style={[styles.tribuStat, { color: text }]}>Ausentes: {ausentes}</Text>
                <Text style={[styles.tribuStat, { color: text }]}>Total: {total}%</Text>
              </View>
            </View>
          );
        }}


        renderItem={({ item }) => (
          <View style={[styles.card,
          item.estado === 'Presente' ? styles.cardPresent : styles.cardAbsent]}>

            <Text style={styles.name}>
              {item.nombre} {item.apellido}
            </Text>

            <View style={styles.presentContainer}>
              <View style={[
                styles.statusBadge,
                { backgroundColor: estadoColor(item.estado) }
              ]}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                  {item.estado ? item.estado.toUpperCase() : 'AUSENTE'}
                </Text>
              </View>
            </View>
          </View>
        )}
      />

      {mostrarPicker && Platform.OS !== 'web' && DateTimePicker && (
        <DateTimePicker
          value={parseFechaLocal(fecha)}
          mode="date"
          maximumDate={new Date()}
          onChange={(e, d) => {
            setMostrarPicker(false);
            if (d) {
              const y = d.getFullYear();
              const m = String(d.getMonth() + 1).padStart(2, '0');
              const dd = String(d.getDate()).padStart(2, '0');
              setFecha(`${y}-${m}-${dd}`);
            }
          }}
        />
      )}
      {mostrarPicker && Platform.OS === 'web' && (
        <Modal transparent animationType="fade" visible={mostrarPicker} onRequestClose={() => setMostrarPicker(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 14 }}>Seleccionar fecha</Text>
              <input
                type="date"
                value={fecha}
                max={getFechaLocal()}
                onChange={(e) => { if (e.target.value) setFecha(e.target.value); }}
                style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid #ccc', marginBottom: 16 }}
              />
              <TouchableOpacity
                style={{ backgroundColor: '#FFA726', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25 }}
                onPress={() => setMostrarPicker(false)}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
      {/* Modal confirmación eliminar */}
      <Modal transparent animationType="fade" visible={confirmModal.visible} onRequestClose={() => setConfirmModal({ visible: false, tipo: null })}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>⚠️</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, textAlign: 'center' }}>
              Eliminar asistencia de {confirmModal.tipo}
            </Text>
            <Text style={{ color: '#666', fontSize: 14, marginBottom: 20, textAlign: 'center' }}>
              Se eliminarán TODOS los registros de asistencia de {confirmModal.tipo}. Esta acción no se puede deshacer.
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: '#F44336', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, width: '100%', alignItems: 'center' }}
              onPress={() => {
                eliminarAsistencia(confirmModal.tipo);
                setConfirmModal({ visible: false, tipo: null });
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Sí, eliminar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginTop: 12, paddingVertical: 10 }}
              onPress={() => setConfirmModal({ visible: false, tipo: null })}
            >
              <Text style={{ color: '#666' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal confirmación notificación */}
      <Modal transparent animationType="fade" visible={notifModal} onRequestClose={() => setNotifModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>🔔</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, textAlign: 'center' }}>
              Enviar recordatorio
            </Text>
            <Text style={{ color: '#666', fontSize: 14, marginBottom: 20, textAlign: 'center' }}>
              Se enviará una notificación a TODOS los dirigentes con el mensaje:{"\n\n"}"RECUERDA TOMAR LA ASISTENCIA DE LA TRIBU"
            </Text>
            <TouchableOpacity
              style={[styles.notifConfirmBtn, enviandoNotif && { opacity: 0.6 }]}
              onPress={enviarRecordatorio}
              disabled={enviandoNotif}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                {enviandoNotif ? 'Enviando...' : 'Sí, enviar'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginTop: 12, paddingVertical: 10 }}
              onPress={() => setNotifModal(false)}
            >
              <Text style={{ color: '#666' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <WaveBackground />
      <BottomNav navigation={navigation} />
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    backgroundColor: '#FFA726',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  date: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -10,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statCard: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  absentNumber: {
    color: '#F44336',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  cardPresent: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  cardAbsent: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  role: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  presentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  absentContainer: {
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  absentBadge: {
    backgroundColor: '#FFEBEE',
    marginBottom: 12,
  },
  statusText: {
    color: '#2E7D32',
    fontWeight: '500',
  },
  absentText: {
    color: '#C62828',
    fontWeight: '500',
  },
  details: {
    alignItems: 'flex-end',
  },
  detailText: {
    fontSize: 12,
    color: '#666',
  },
  listContent: {
    paddingBottom: 80,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  footerNote: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 8,
  },
  tribuHeader: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
    padding: 16,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  tribuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  tribuStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  tribuStat: {
    fontSize: 14,
    fontWeight: '600',
  },

  tribuStatPresentes: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },

  tribuStatAusentes: {
    color: '#F44336',
    fontWeight: 'bold',
  },

  tribuStatTotal: {
    color: '#555',
    fontWeight: 'bold',
  },
  deleteButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 10,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: '#F44336',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  deleteBtnDirigentes: {
    backgroundColor: '#FF7043',
  },
  deleteBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
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
    width: '80%',
    alignItems: 'center',
  },
  notifBtn: {
    flex: 1,
    backgroundColor: '#FFA726',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  notifBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  notifConfirmBtn: {
    backgroundColor: '#FFA726',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
}