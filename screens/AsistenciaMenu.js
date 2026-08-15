import { useContext, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  Alert, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNav from '../components/navbar';
import { UserContext } from '../context/UserContext';
import SectionTitle from '../components/TituloSeccion';
import WaveBackground from '../components/WaveBackground';
import { API_URL } from '../api';
import ModalProximamente from '../components/ModalProximamente';

let DateTimePicker = null;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

/* ─── date helpers ──────────────────────────────────────────── */
function hoy() {
  return new Date().toISOString().slice(0, 10);
}
function hace30Dias() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}
function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

const MEDAL = ['🥇', '🥈', '🥉', '4°', '5°'];

/* ─── Barra de porcentaje ───────────────────────────────────── */
function BarraPorcentaje({ pct, color }) {
  return (
    <View style={styles.barraFondo}>
      <View
        style={[
          styles.barraRelleno,
          { width: `${pct}%`, backgroundColor: color || '#FFA726' },
        ]}
      />
    </View>
  );
}

/* ─── Campo de fecha cross-platform ────────────────────────── */
/* ─── Campo de fecha cross-platform ────────────────────────── */
function DateField({ label, value, onChange }) {
  const isWeb = Platform.OS === 'web';
  const [mostrarPicker, setMostrarPicker] = useState(false);

  // Función para convertir el string 'YYYY-MM-DD' a un objeto Date
  const parseFecha = (fechaStr) => {
    const [y, m, d] = fechaStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const handleNativeChange = (event, selectedDate) => {
    setMostrarPicker(false);
    if (selectedDate) {
      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const d = String(selectedDate.getDate()).padStart(2, '0');
      onChange(`${y}-${m}-${d}`);
    }
  };

  return (
    <View style={styles.dateField}>
      <Text style={styles.dateLabel}>{label}</Text>
      {isWeb ? (
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            border: '1.5px solid #ddd',
            borderRadius: 10,
            padding: '8px 12px',
            fontSize: 14,
            color: '#222',
            outline: 'none',
            fontFamily: 'inherit',
            width: '100%',
            boxSizing: 'border-box',
          }}
        />
      ) : (
        <>
          <TouchableOpacity 
            style={styles.nativeDateInput} 
            onPress={() => setMostrarPicker(true)}
          >
            <Text style={{ color: '#555', fontSize: 14 }}>{value}</Text>
          </TouchableOpacity>
          
          {mostrarPicker && DateTimePicker && (
            <DateTimePicker
              value={parseFecha(value)}
              mode="date"
              maximumDate={new Date()}
              onChange={handleNativeChange}
            />
          )}
        </>
      )}
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SCREEN PRINCIPAL
═══════════════════════════════════════════════════════════════ */
export default function AsistenciaMenu({ navigation }) {
  const { user, setUser } = useContext(UserContext);
  const [token, setToken] = useState(null);
  const [modalProximamenteVisible, setModalProximamenteVisible] = useState(false);
  /* Notificación */
  const [enviandoNotif, setEnviandoNotif] = useState(false);
  const [notifModal, setNotifModal] = useState(false);

  /* Reporte */
  const [reporteModal, setReporteModal] = useState(false);
  const [desde, setDesde] = useState(hace30Dias());
  const [hasta, setHasta] = useState(hoy());
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('token').then(setToken);
  }, []);

  /* ── Enviar recordatorio ──────────────────────────────── */
  const enviarRecordatorio = async () => {
    setEnviandoNotif(true);
    try {
      const res = await fetch(`${API_URL}/notificacion/recordatorio-tribu`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (!res.ok) {
        const errorMsg = json.error || 'Error al enviar notificación';
        Platform.OS === 'web' ? alert(errorMsg) : Alert.alert('Error', errorMsg);
        return;
      }
      const msg = `Notificación enviada a ${json.enviados} dispositivo(s)`;
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Enviado', msg);
    } catch {
      const errorMsg = 'Error de conexión al enviar notificación';
      Platform.OS === 'web' ? alert(errorMsg) : Alert.alert('Error', errorMsg);
    } finally {
      setEnviandoNotif(false);
      setNotifModal(false);
    }
  };

  /* ── Generar reporte ─────────────────────────────────── */
  const generarReporte = async () => {
    if (!desde || !hasta) {
      const msg = 'Por favor selecciona ambas fechas';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Atención', msg);
      return;
    }
    if (desde > hasta) {
      const msg = 'La fecha de inicio no puede ser mayor que la fecha final';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Fechas inválidas', msg);
      return;
    }
    setCargando(true);
    setResultado(null);
    try {
      const res = await fetch(
        `${API_URL}/asistencia/reporte-tribus?desde=${desde}&hasta=${hasta}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error del servidor');
      setResultado(json);
    } catch (err) {
      const msg = err.message || 'Error al obtener el reporte';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Error', msg);
    } finally {
      setCargando(false);
    }
  };

  const cerrarReporte = () => {
    setReporteModal(false);
    setResultado(null);
    setDesde(hace30Dias());
    setHasta(hoy());
  };

  /* ── Render ──────────────────────────────────────────── */
  return (
    <View style={styles.container}>
      <WaveBackground style={{ pointerEvents: 'none' }} />
      <SectionTitle title="Asistencia" />
      <View style={styles.contentWrapper}>
        <MenuItem label="Asistencia" onPress={() => navigation.navigate('AsistenciaTribus')} />
        <MenuItem label="Reporte" onPress={() => setReporteModal(true)} />
        <MenuItem label="Buscar" proximamente={true} onOpenProximamente={() => setModalProximamenteVisible(true)} />
        <MenuItem label="Enviar Recordatorio" onPress={() => setNotifModal(true)} />
      </View>

      <BottomNav navigation={navigation} />

      {/* ── Modal confirmación notificación ── */}
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
            <TouchableOpacity style={{ marginTop: 12, paddingVertical: 10 }} onPress={() => setNotifModal(false)}>
              <Text style={{ color: '#666' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Modal Reporte ── */}
      <Modal transparent animationType="slide" visible={reporteModal} onRequestClose={cerrarReporte}>
        <View style={styles.modalOverlay}>
          <View style={styles.reporteBox}>
            {/* Encabezado */}
            <View style={styles.reporteHeader}>
              <Text style={styles.reporteTitulo}>Reporte de Asistencia</Text>
              <TouchableOpacity onPress={cerrarReporte} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={22} color="#555" />
              </TouchableOpacity>
            </View>

            <Text style={styles.reporteSubtitulo}>
              Top 5 tribus con mayor porcentaje de asistencia global
            </Text>

            {/* Selector de fechas */}
            <View style={styles.fechasRow}>
              <DateField label="Desde" value={desde} onChange={setDesde} />
              <View style={{ width: 12 }} />
              <DateField label="Hasta" value={hasta} onChange={setHasta} />
            </View>

            {/* Botón generar */}
            <TouchableOpacity
              style={[styles.generarBtn, cargando && { opacity: 0.6 }]}
              onPress={generarReporte}
              disabled={cargando}
            >
              {cargando
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.generarBtnText}>Generar reporte</Text>
              }
            </TouchableOpacity>

            {/* Resultados */}
            {resultado && (
              <ScrollView style={styles.resultadosScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.periodoText}>
                  {formatDate(resultado.desde)} — {formatDate(resultado.hasta)}
                </Text>

                {resultado.tribus.length === 0 ? (
                  <Text style={styles.sinDatosText}>
                    No hay registros de asistencia en ese período.
                  </Text>
                ) : (
                  resultado.tribus.map((t, i) => {
                    const pct = parseFloat(t.porcentaje) || 0;
                    const color = t.color_hex || '#FFA726';
                    return (
                      <View key={t.id_tribu} style={styles.tribCard}>
                        <View style={styles.tribRow}>
                          <Text style={styles.medal}>{MEDAL[i]}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.tribNombre}>{t.nombre}</Text>
                            <Text style={styles.tribDetalle}>
                              {t.total_presentes} / {t.total_posibles} presentes
                            </Text>
                          </View>
                          <View style={[styles.pctBadge, { backgroundColor: color + '22' }]}>
                            <Text style={[styles.pctText, { color }]}>{pct}%</Text>
                          </View>
                        </View>
                        <BarraPorcentaje pct={pct} color={color} />
                      </View>
                    );
                  })
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <ModalProximamente 
              visible={modalProximamenteVisible} 
              onClose={() => setModalProximamenteVisible(false)} 
            />  

    </View>
  );
}

/* ─── MenuItem ──────────────────────────────────────────────── */
function MenuItem({ label, onPress, proximamente, onOpenProximamente }) {
  return (
    <TouchableOpacity
      style={styles.item}
      onPress={proximamente ? onOpenProximamente : onPress}
    >
      <Text style={styles.itemText}>{label}</Text>
      {proximamente && (
        <View style={styles.proximamenteOverlay}>
          <Text style={styles.proximamenteText}>Próximamente</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}



/* ─── Styles ────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 40 },

  contentWrapper: {
    flex: 1, zIndex: 10, alignItems: 'center', justifyContent: 'center',
  },

  item: {
    width: '90%', height: 70, backgroundColor: '#ffa34cbb',
    borderRadius: 30, marginBottom: 20, alignItems: 'center',
    justifyContent: 'center', position: 'relative', overflow: 'hidden',
  },
  itemText: { marginTop: 6, fontSize: 16, fontWeight: '500', color: '#222' },

  proximamenteOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
  },
  proximamenteText: {
    color: '#fff', fontWeight: 'bold', fontSize: 13,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },

  /* ── Modales ── */
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff', borderRadius: 16,
    padding: 24, width: '80%', alignItems: 'center',
  },
  notifConfirmBtn: {
    backgroundColor: '#FFA726', paddingVertical: 12,
    paddingHorizontal: 30, borderRadius: 25, width: '100%', alignItems: 'center',
  },

  /* ── Reporte modal ── */
  reporteBox: {
    backgroundColor: '#fff', borderRadius: 20, padding: 22,
    width: '92%', maxHeight: '85%',
  },
  reporteHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 4,
  },
  reporteTitulo: { fontSize: 17, fontWeight: '700', color: '#222' },
  reporteSubtitulo: { fontSize: 12, color: '#888', marginBottom: 16 },

  fechasRow: { flexDirection: 'row', marginBottom: 14 },
  dateField: { flex: 1 },
  dateLabel: { fontSize: 12, color: '#666', marginBottom: 4, fontWeight: '600' },
  nativeDateInput: {
    borderWidth: 1.5, borderColor: '#ddd', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
  },

  generarBtn: {
    backgroundColor: '#FFA726', borderRadius: 25,
    paddingVertical: 12, alignItems: 'center', marginBottom: 16,
  },
  generarBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  resultadosScroll: { maxHeight: 340 },
  periodoText: {
    fontSize: 12, color: '#888', textAlign: 'center',
    marginBottom: 12, fontStyle: 'italic',
  },
  sinDatosText: { color: '#999', textAlign: 'center', marginTop: 20, fontSize: 14 },

  tribCard: {
    backgroundColor: '#fafafa', borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: '#f0f0f0',
  },
  tribRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  medal: { fontSize: 22, marginRight: 10 },
  tribNombre: { fontWeight: '700', fontSize: 14, color: '#222' },
  tribDetalle: { fontSize: 12, color: '#888', marginTop: 2 },

  pctBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8 },
  pctText: { fontWeight: '800', fontSize: 15 },

  barraFondo: { height: 6, backgroundColor: '#eee', borderRadius: 4, overflow: 'hidden' },
  barraRelleno: { height: 6, borderRadius: 4 },
});