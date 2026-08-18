import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, ActivityIndicator,
  StyleSheet, TouchableOpacity, Platform, Modal, Alert, Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../api';
import QrScannerModal from '../components/QrScannerModal';
import CodigoManualModal from '../components/CodigoManualModal';
import SectionTitle from '../components/TituloSeccion';
import { Ionicons } from '@expo/vector-icons';

let DateTimePicker = null;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

const getFechaLocal = () => {
  const ahora = new Date();
  const local = new Date(ahora.getTime() + (-5 * 60 * 60 * 1000));
  return local.toISOString().split('T')[0];
};

const parseFechaLocal = (fechaStr) => {
  const [y, m, d] = fechaStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export default function AsistenciaScreen({ navigation }) {
  const [fecha, setFecha] = useState(getFechaLocal());
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrVisible, setQrVisible] = useState(false);
  const [codigoVisible, setCodigoVisible] = useState(false);
  const [dirigenteSeleccionado, setDirigenteSeleccionado] = useState(null);
  const [mostrarPicker, setMostrarPicker] = useState(false);

  const [token, setToken] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [accionModal, setAccionModal] = useState(false);
  const [editarModal, setEditarModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ visible: false, tipo: null });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  useEffect(() => {
    AsyncStorage.getItem('token').then(setToken);
  }, []);

  useEffect(() => {
    if (token) cargarAsistencia();
  }, [fecha, token]);

  const estadoColor = (estado) => {
    if (estado === 'Presente') return '#4CAF50';
    if (estado === 'Tarde') return '#FF9800';
    return '#F44336';
  };

  const cambiarDia = (dias) => {
    const fechaActual = parseFechaLocal(fecha);
    fechaActual.setDate(fechaActual.getDate() + dias);
    
    const y = fechaActual.getFullYear();
    const m = String(fechaActual.getMonth() + 1).padStart(2, '0');
    const d = String(fechaActual.getDate()).padStart(2, '0');
    
    const nuevaFechaStr = `${y}-${m}-${d}`;
    const hoyStr = getFechaLocal();

    if (nuevaFechaStr <= hoyStr) {
      setFecha(nuevaFechaStr);
    }
  };

  const eliminarAsistencia = async (tipo) => {
    const endpoint = tipo === 'dirigentes'
      ? `${API_URL}/asistencia/dirigentes`
      : `${API_URL}/asistencia/exoditos`;

    try {
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();

      if (!res.ok) {
        if (Platform.OS === 'web') alert(json.error || 'Error al eliminar');
        else Alert.alert('Error', json.error || 'Error al eliminar');
        return;
      }

      const msg = `${json.mensaje} (${json.eliminados} registros)`;
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Éxito', msg);
    } catch (err) {
      const errorMsg = 'Error de conexión';
      if (Platform.OS === 'web') alert(errorMsg);
      else Alert.alert('Error', errorMsg);
    } finally {
      setConfirmModal({ visible: false, tipo: null });
      cargarAsistencia();
    }
  };

  const cargarAsistencia = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/asistencia/fecha/${fecha}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();

      if (!res.ok) {
        showToast(json.error || 'No se pudo cargar asistencia');
        return;
      }

      setData(json);
    } catch (err) {
      showToast('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const guardar = async (id_dirigente, estado) => {
    try {
      await fetch(`${API_URL}/asistencia`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id_dirigente, fecha, estado }),
      });
      cargarAsistencia();
    } catch {
      showToast('No se pudo actualizar asistencia');
    }
  };

  const onPressDirigente = (item) => {
    setDirigenteSeleccionado(item);
    if (!item.estado) {
      setAccionModal(true);
      return;
    }
    setEditarModal(true);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FFA726" />
        <Text style={styles.loadingText}>Cargando asistencia...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{ marginTop: Platform.OS === 'ios' ? 40 : 15 }}>
        <SectionTitle 
          title="Asistencia" 
          showBackButton={true} 
          onBackPress={() => navigation.goBack()} 
        />
      </View>
      
      <View style={styles.dateBarContainer}>
        <TouchableOpacity style={styles.dateArrowBtn} onPress={() => cambiarDia(-1)}>
          <Ionicons name="chevron-back" size={20} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.dateDisplayBtn} onPress={() => setMostrarPicker(true)}>
          <Ionicons name="calendar-outline" size={16} color="#FFA726" style={{ marginRight: 6 }} />
          <Text style={styles.dateText}>{fecha}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.dateArrowBtn, fecha >= getFechaLocal() && { opacity: 0.4 }]} 
          onPress={() => cambiarDia(1)}
          disabled={fecha >= getFechaLocal()}
        >
          <Ionicons name="chevron-forward" size={20} color="#333" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.reloadContainer}>
        <TouchableOpacity style={styles.reloadBtn} onPress={cargarAsistencia}>
          <Ionicons name="refresh" size={18} color="#fff" />
          <Text style={styles.reloadBtnText}>Recargar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {data.filter(d => d.estado === 'Presente').length}
          </Text>
          <Text style={styles.statLabel}>Presentes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, styles.absentNumber]}>
            {data.filter(d => !d.estado).length}
          </Text>
          <Text style={styles.statLabel}>Ausentes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{data.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id_dirigente.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => onPressDirigente(item)}>
            <View style={[
              styles.card,
              item.estado ? styles.cardPresent : styles.cardAbsent
            ]}>
              <View style={styles.cardHeader}>
                {/* Contenedor de la foto del dirigente o icono predeterminado */}
                <View style={styles.avatarContainer}>
                  {item.foto ? (
                    <Image source={{ uri: item.foto }} style={styles.avatarImage} />
                  ) : (
                    <Ionicons name="person" size={18} color="#FFA726" />
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>
                    {item.nombre} {item.apellido}
                  </Text>
                  <Text style={styles.role}>{item.rol}</Text>
                </View>
              </View>

              <View style={styles.presentContainer}>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: estadoColor(item.estado) }
                ]}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                    {item.estado ? item.estado.toUpperCase() : 'AUSENTE'}
                  </Text>
                </View>

                {item.estado && (
                  <View style={styles.details}>
                    <Text style={styles.detailText}>
                      Método: {item.metodo_registro}
                    </Text>
                    <Text style={styles.detailText}>
                      Hora: {item.hora_llegada}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.deleteBtn, styles.deleteBtnDirigentes]}
          onPress={() => setConfirmModal({ visible: true, tipo: 'dirigentes' })}
        >
          <Text style={styles.deleteBtnText}>Eliminar asist. dirigentes</Text>
        </TouchableOpacity>
      </View>
      
      <QrScannerModal visible={qrVisible}
        onClose={() => {
          setQrVisible(false);
          setDirigenteSeleccionado(null);
          cargarAsistencia();
        }}
        dirigente={dirigenteSeleccionado}
      />

      <CodigoManualModal visible={codigoVisible}
        onClose={() => {
          setCodigoVisible(false);
          setDirigenteSeleccionado(null);
          cargarAsistencia();
        }}
      />

      {mostrarPicker && Platform.OS !== 'web' && DateTimePicker && (
        <DateTimePicker
          value={parseFechaLocal(fecha)}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={(event, selectedDate) => {
            setMostrarPicker(false);
            if (selectedDate) {
              const y = selectedDate.getFullYear();
              const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
              const d = String(selectedDate.getDate()).padStart(2, '0');
              setFecha(`${y}-${m}-${d}`);
            }
          }}
        />
      )}
      {mostrarPicker && Platform.OS === 'web' && (
        <Modal transparent animationType="fade" visible={mostrarPicker} onRequestClose={() => setMostrarPicker(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Seleccionar fecha</Text>
              <input
                type="date"
                value={fecha}
                max={getFechaLocal()}
                onChange={(e) => {
                  if (e.target.value) setFecha(e.target.value);
                }}
                style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid #ccc', marginBottom: 16 }}
              />
              <TouchableOpacity style={styles.modalBtn} onPress={() => setMostrarPicker(false)}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      <Modal transparent animationType="fade" visible={accionModal} onRequestClose={() => setAccionModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              Registrar asistencia{dirigenteSeleccionado ? ` — ${dirigenteSeleccionado.nombre}` : ''}
            </Text>
            <TouchableOpacity style={styles.modalBtn} onPress={() => { setAccionModal(false); setQrVisible(true); }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Escanear QR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#D3DBEE', marginTop: 10 }]}
              onPress={() => { setAccionModal(false); setCodigoVisible(true); }}>
              <Text style={{ color: '#000', fontWeight: 'bold' }}>Ingresar código</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setAccionModal(false); setDirigenteSeleccionado(null); }}>
              <Text style={{ color: '#666' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal transparent animationType="fade" visible={editarModal} onRequestClose={() => setEditarModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {dirigenteSeleccionado ? `${dirigenteSeleccionado.nombre} ${dirigenteSeleccionado.apellido}` : ''}
            </Text>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#FF9800' }]}
              onPress={() => {
                if (dirigenteSeleccionado) guardar(dirigenteSeleccionado.id_dirigente, 'Tarde');
                setEditarModal(false);
              }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Marcar Tarde</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setEditarModal(false); setDirigenteSeleccionado(null); }}>
              <Text style={{ color: '#666' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal transparent animationType="fade" visible={confirmModal.visible} onRequestClose={() => setConfirmModal({ visible: false, tipo: null })}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>⚠️</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, textAlign: 'center' }}>
              Eliminar asistencia de {confirmModal.tipo}
            </Text>
            <Text style={{ color: '#666', fontSize: 14, marginBottom: 20, textAlign: 'center' }}>
              Se eliminarán TODOS los registros de asistencia. Esta acción no se puede deshacer.
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: '#F44336', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, width: '100%', alignItems: 'center' }}
              onPress={() => eliminarAsistencia(confirmModal.tipo)}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Sí, eliminar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setConfirmModal({ visible: false, tipo: null })}>
              <Text style={{ color: '#666' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {toastMsg ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toastMsg}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
  dateBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 15,
    paddingVertical: 8,
    paddingHorizontal: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  dateArrowBtn: { padding: 6 },
  dateDisplayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  dateText: {
    fontSize: 15,
    color: '#333',
    fontWeight: 'bold',
  },
  reloadContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  reloadBtn: {
    flexDirection: 'row',
    backgroundColor: '#22335D',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  reloadBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statCard: { alignItems: 'center' },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  absentNumber: { color: '#F44336' },
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
  cardPresent: { borderLeftWidth: 4, borderLeftColor: '#4CAF50' },
  cardAbsent: { borderLeftWidth: 4, borderLeftColor: '#F44336' },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  role: {
    fontSize: 13,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  presentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  details: { alignItems: 'flex-end' },
  detailText: {
    fontSize: 12,
    color: '#666',
  },
  listContent: { paddingBottom: 80 },
  footer: {
    position: 'relative',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 8,
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
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalBtn: {
    backgroundColor: '#FFA726',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  cancelBtn: {
    marginTop: 12,
    paddingVertical: 10,
  },
  toast: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    backgroundColor: '#333',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    zIndex: 999,
  },
  toastText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  deleteBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  deleteBtnDirigentes: { backgroundColor: '#FF7043' },
  deleteBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
  },
});