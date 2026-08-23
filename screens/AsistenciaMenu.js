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
import AsistenciaDirisModal from '../components/AsistenciaDirisModal';
import QrScannerModal from '../components/QrScannerModal';
import CodigoManualModal from '../components/CodigoManualModal';

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
          { width: `${pct}%`, backgroundColor: color || '#F59E0B' },
        ]}
      />
    </View>
  );
}

/* ─── Campo de fecha cross-platform ────────────────────────── */
function DateField({ label, value, onChange }) {
  const isWeb = Platform.OS === 'web';
  const [mostrarPicker, setMostrarPicker] = useState(false);

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
            border: '1.5px solid #E2E8F0',
            borderRadius: 12,
            padding: '10px 14px',
            fontSize: 14,
            color: '#1E293B',
            outline: 'none',
            fontFamily: 'inherit',
            width: '100%',
            boxSizing: 'box-border',
            backgroundColor: '#F8FAFC',
          }}
        />
      ) : (
        <>
          <TouchableOpacity 
            style={styles.nativeDateInput} 
            onPress={() => setMostrarPicker(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={16} color="#64748B" style={{ marginRight: 8 }} />
            <Text style={{ color: '#334155', fontSize: 14, fontWeight: '500' }}>{value}</Text>
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

export default function AsistenciaMenu({ navigation }) {
  const { user } = useContext(UserContext);
  const [token, setToken] = useState(null);
  const [modalProximamenteVisible, setModalProximamenteVisible] = useState(false);
  
  /* Estados para los modales de asistencia de Diris */
  const [asistenciaDirisModalVisible, setAsistenciaDirisModalVisible] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);
  const [codigoVisible, setCodigoVisible] = useState(false);
  
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

  return (
    <View style={styles.container}>
      <WaveBackground style={{ pointerEvents: 'none' }} />
      <SectionTitle title="Asistencia" />
      
      <ScrollView contentContainerStyle={styles.contentWrapper} showsVerticalScrollIndicator={false}>
        
        <MenuItem 
          icon="checkbox-outline" 
          label="Asistencia de Tribus" 
          subtitle="Verificar asistencia de todas las tribus"
          onPress={() => navigation.navigate('AsistenciaTribus')} 
        />
        <MenuItem 
          icon="bar-chart-outline" 
          label="Reporte" 
          subtitle="Estadísticas de las tribus"
          onPress={() => setReporteModal(true)} 
        />
        <MenuItem 
          icon="search-outline" 
          label="Buscar" 
          subtitle="Consultar registros pasados"
          proximamente={true} 
          onOpenProximamente={() => setModalProximamenteVisible(true)} 
        />
        <MenuItem 
          icon="qr-code-outline" 
          label="Asistencia de Dirigentes" 
          subtitle="Escanear QR o ingresar código"
          onPress={() => setAsistenciaDirisModalVisible(true)} 
        />
        <MenuItem 
          icon="notifications-outline" 
          label="Enviar Recordatorio" 
          subtitle="Avisar a los dirigentes"
          onPress={() => setNotifModal(true)} 
        />
      </ScrollView>

      <BottomNav navigation={navigation} />

      <AsistenciaDirisModal
        visible={asistenciaDirisModalVisible}
        onClose={() => setAsistenciaDirisModalVisible(false)}
        onOpenQr={() => setQrVisible(true)}
        onOpenCodigo={() => setCodigoVisible(true)}
        onGoToAsistenciaDiris={() => navigation.navigate('AsistenciaDiris')}
      />

      <QrScannerModal visible={qrVisible} onClose={() => setQrVisible(false)} user={user} />
      <CodigoManualModal visible={codigoVisible} onClose={() => setCodigoVisible(false)} user={user} />

      {/* ── Modal confirmación notificación ── */}
      <Modal transparent animationType="fade" visible={notifModal} onRequestClose={() => setNotifModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.iconContainerNotif}>
              <Ionicons name="notifications" size={28} color="#D97706" />
            </View>
            <Text style={styles.modalBoxTitle}>Enviar recordatorio</Text>
            <Text style={styles.modalBoxText}>
              Se enviará una notificación a TODOS los dirigentes con el mensaje:{"\n\n"}
              <Text style={{ fontWeight: '600', color: '#1E293B' }}>"RECUERDA TOMAR LA ASISTENCIA DE LA TRIBU"</Text>
            </Text>
            <TouchableOpacity
              style={[styles.notifConfirmBtn, enviandoNotif && { opacity: 0.6 }]}
              onPress={enviarRecordatorio}
              disabled={enviandoNotif}
              activeOpacity={0.85}
            >
              {enviandoNotif ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.notifConfirmText}>Sí, enviar</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setNotifModal(false)}>
              <Text style={styles.cancelModalText}>Cancelar</Text>
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
              <View>
                <Text style={styles.reporteTitulo}>Reporte de Asistencia</Text>
                <Text style={styles.reporteSubtitulo}>Top 5 tribus con mayor asistencia global</Text>
              </View>
              <TouchableOpacity 
                style={styles.closeIconBtn} 
                onPress={cerrarReporte} 
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color="#475569" />
              </TouchableOpacity>
            </View>

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
              activeOpacity={0.85}
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
                  Período: {formatDate(resultado.desde)} — {formatDate(resultado.hasta)}
                </Text>

                {resultado.tribus.length === 0 ? (
                  <Text style={styles.sinDatosText}>
                    No hay registros de asistencia en ese período.
                  </Text>
                ) : (
                  resultado.tribus.map((t, i) => {
                    const pct = parseFloat(t.porcentaje) || 0;
                    const color = t.color_hex || '#F59E0B';
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
                          <View style={[styles.pctBadge, { backgroundColor: color + '20' }]}>
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

/* ─── MenuItem Modernizado ──────────────────────────────────── */
function MenuItem({ icon, label, subtitle, onPress, proximamente, onOpenProximamente }) {
  return (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={proximamente ? onOpenProximamente : onPress}
      activeOpacity={0.85}
    >
      <View style={styles.iconWrapper}>
        <Ionicons name={icon} size={24} color="#D97706" />
      </View>
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemTitle}>{label}</Text>
        <Text style={styles.itemSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#94A3B8" />

      {proximamente && (
        <View style={styles.proximamenteOverlay}>
          <View style={styles.badgeProximamente}>
            <Text style={styles.proximamenteText}>Próximamente</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

/* ─── Styles Mejorados ──────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC', 
    paddingTop: 30 
  },

  contentWrapper: {
    padding: 20,
    paddingBottom: 110,
    zIndex: 10, 
  },

  itemCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },

  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },

  itemTextContainer: {
    flex: 1,
  },

  itemTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#1E293B',
    marginBottom: 2,
  },

  itemSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '400',
  },

  proximamenteOverlay: {
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.85)', 
    alignItems: 'center', 
    justifyContent: 'flex-end',
    flexDirection: 'row',
    paddingRight: 20,
  },

  badgeProximamente: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },

  proximamenteText: {
    color: '#B45309', 
    fontWeight: '700', 
    fontSize: 12,
    textTransform: 'uppercase', 
    letterSpacing: 0.5,
  },

  /* ── Modales ── */
  modalOverlay: {
    flex: 1, 
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center', 
    alignItems: 'center',
  },

  modalBox: {
    backgroundColor: '#FFFFFF', 
    borderRadius: 20,
    padding: 24, 
    width: '85%', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },

  iconContainerNotif: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },

  modalBoxTitle: { 
    fontWeight: '700', 
    fontSize: 18, 
    marginBottom: 8, 
    textAlign: 'center',
    color: '#1E293B',
  },

  modalBoxText: { 
    color: '#64748B', 
    fontSize: 14, 
    marginBottom: 24, 
    textAlign: 'center',
    lineHeight: 20,
  },

  notifConfirmBtn: {
    backgroundColor: '#D97706', 
    paddingVertical: 14,
    borderRadius: 12, 
    width: '100%', 
    alignItems: 'center',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },

  notifConfirmText: { 
    color: '#FFFFFF', 
    fontWeight: '700',
    fontSize: 15,
  },

  cancelModalBtn: { 
    marginTop: 12, 
    paddingVertical: 8,
  },

  cancelModalText: { 
    color: '#64748B',
    fontWeight: '600',
    fontSize: 14,
  },

  /* ── Reporte modal ── */
  reporteBox: {
    backgroundColor: '#FFFFFF', 
    borderRadius: 20, 
    padding: 22,
    width: '92%', 
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },

  reporteHeader: {
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'flex-start', 
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },

  reporteTitulo: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#1E293B',
    marginBottom: 2,
  },

  reporteSubtitulo: { 
    fontSize: 13, 
    color: '#64748B' 
  },

  closeIconBtn: {
    backgroundColor: '#F1F5F9',
    padding: 6,
    borderRadius: 10,
  },

  fechasRow: { 
    flexDirection: 'row', 
    marginBottom: 16 
  },

  dateField: { 
    flex: 1 
  },

  dateLabel: { 
    fontSize: 13, 
    color: '#475569', 
    marginBottom: 6, 
    fontWeight: '600' 
  },

  nativeDateInput: {
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    borderRadius: 12,
    paddingHorizontal: 14, 
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
  },

  generarBtn: {
    backgroundColor: '#D97706', 
    borderRadius: 12,
    paddingVertical: 14, 
    alignItems: 'center', 
    marginBottom: 16,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },

  generarBtnText: { 
    color: '#FFFFFF', 
    fontWeight: '700', 
    fontSize: 15 
  },

  resultadosScroll: { 
    maxHeight: 320 
  },

  periodoText: {
    fontSize: 13, 
    color: '#64748B', 
    textAlign: 'center',
    marginBottom: 14, 
    fontWeight: '500',
  },

  sinDatosText: { 
    color: '#94A3B8', 
    textAlign: 'center', 
    marginTop: 20, 
    fontSize: 14 
  },

  tribCard: {
    backgroundColor: '#FFFFFF', 
    borderRadius: 14, 
    padding: 14,
    marginBottom: 10, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
  },

  tribRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10 
  },

  medal: { 
    fontSize: 22, 
    marginRight: 10 
  },

  tribNombre: { 
    fontWeight: '700', 
    fontSize: 15, 
    color: '#1E293B' 
  },

  tribDetalle: { 
    fontSize: 12, 
    color: '#64748B', 
    marginTop: 2 
  },

  pctBadge: { 
    borderRadius: 10, 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    marginLeft: 8 
  },

  pctText: { 
    fontWeight: '800', 
    fontSize: 14 
  },

  barraFondo: { 
    height: 6, 
    backgroundColor: '#F1F5F9', 
    borderRadius: 4, 
    overflow: 'hidden' 
  },

  barraRelleno: { 
    height: 6, 
    borderRadius: 4 
  },
});