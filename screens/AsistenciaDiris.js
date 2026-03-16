import { useEffect, useState } from 'react';
import { 
  View, Text, FlatList, Button, ActivityIndicator, 
  StyleSheet, TouchableOpacity, Platform, TextInput, Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../api';
import QrScannerModal from '../components/QrScannerModal';
import CodigoManualModal from '../components/CodigoManualModal';

// DateTimePicker solo en móvil
let DateTimePicker = null;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}


// Devuelve fecha local Colombia (UTC-5) como "YYYY-MM-DD"
const getFechaLocal = () => {
  const ahora = new Date();
  const local = new Date(ahora.getTime() + (-5 * 60 * 60 * 1000));
  return local.toISOString().split('T')[0];
};

// Parsea "YYYY-MM-DD" como fecha local evitando el bug UTC
const parseFechaLocal = (fechaStr) => {
  const [y, m, d] = fechaStr.split('-').map(Number);
  return new Date(y, m - 1, d); // sin zona horaria → local
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
  const [accionModal, setAccionModal] = useState(false); // modal elegir QR o código
  const [editarModal, setEditarModal] = useState(false); // modal marcar Tarde

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

  /* ===============================
      Helpers visuales
  =============================== */

  const estadoColor = (estado) => {
    if (estado === 'Presente') return '#4CAF50';
    if (estado === 'Tarde') return '#FF9800';
    return '#F44336';
  };

  /* ===============================
     Backend
  =============================== */

  const cargarAsistencia = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/asistencia/fecha/${fecha}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
        body: JSON.stringify({
          id_dirigente,
          fecha,
          estado,
        }),
      });

      cargarAsistencia();
    } catch {
      showToast('No se pudo actualizar asistencia');
    }
  };
  const onPressDirigente = (item) => {
    setDirigenteSeleccionado(item);

    // AUSENTE → elegir método
    if (!item.estado) {
      setAccionModal(true);
      return;
    }

    // YA REGISTRADO → editar
    setEditarModal(true);
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
          <Text style={styles.title}>Asistencia</Text>
          <Text style={styles.date}>{fecha}</Text>
          <TouchableOpacity onPress={() => setMostrarPicker(true)}>
            <Text style={{ color: '#fff', marginTop: 5 }}>
               Cambiar fecha
            </Text>
          </TouchableOpacity>

        </View>
      </View>

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>

      {/* Stats */}
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

      {/* Lista */}
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
                <Text style={styles.name}>
                  {item.nombre} {item.apellido}
                </Text>
                <Text style={styles.role}>{item.rol}</Text>
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
        <Button title="Recargar" onPress={cargarAsistencia} />
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

      {/* PICKER DE FECHA: nativo en móvil, input en web */}
      {mostrarPicker && Platform.OS !== 'web' && DateTimePicker && (
        <DateTimePicker
          value={parseFechaLocal(fecha)}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={(event, selectedDate) => {
            setMostrarPicker(false);
            if (selectedDate) {
              // Formatear manualmente para evitar bug UTC
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

      {/* MODAL: elegir método registro (ausente) */}
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

      {/* MODAL: editar asistencia (ya registrado) */}
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

      {/* Toast */}
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
  mockBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  mockBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
  mockIndicator: {
    fontSize: 12,
    color: '#FF9800',
    marginTop: 8,
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
});