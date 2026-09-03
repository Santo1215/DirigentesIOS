import { useContext, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  Alert, Platform, ScrollView, ActivityIndicator, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNav from '../components/navbar';
import { UserContext } from '../context/UserContext';
import SectionTitle from '../components/TituloSeccion';
import WaveBackground from '../components/WaveBackground';
import { API_URL } from '../api';
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
  const datePart = String(iso).split('T')[0].split(' ')[0];
  const [y, m, d] = datePart.split('-');
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
  /* Estados para los modales de asistencia de Diris */
  const [asistenciaDirisModalVisible, setAsistenciaDirisModalVisible] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);
  const [codigoVisible, setCodigoVisible] = useState(false);

  /* Búsqueda */
  const [buscarModalVisible, setBuscarModalVisible] = useState(false);
  const [buscarTab, setBuscarTab] = useState('exodito');
  const [exoditos, setExoditos] = useState([]);
  const [tribus, setTribus] = useState([]);
  const [exoditoSeleccionado, setExoditoSeleccionado] = useState(null);
  const [tribuSeleccionada, setTribuSeleccionada] = useState(null);
  const [tribuSeleccionadaBusqueda, setTribuSeleccionadaBusqueda] = useState(null);
  const [desdeBusqueda, setDesdeBusqueda] = useState(hace30Dias());
  const [hastaBusqueda, setHastaBusqueda] = useState(hoy());
  const [desdeGrupo, setDesdeGrupo] = useState(hace30Dias());
  const [hastaGrupo, setHastaGrupo] = useState(hoy());
  const [resultadoExodito, setResultadoExodito] = useState(null);
  const [resultadoGrupo, setResultadoGrupo] = useState(null);
  const [resultadoTodasTribus, setResultadoTodasTribus] = useState(null);
  const [cargandoExodito, setCargandoExodito] = useState(false);
  const [cargandoGrupo, setCargandoGrupo] = useState(false);
  const [cargandoTodasTribus, setCargandoTodasTribus] = useState(false);
  const [token, setToken] = useState(null);
  
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

  const cargarDatosBusqueda = async () => {
    if (!token) return;
    try {
      const [resExo, resTrib] = await Promise.all([
        fetch(`${API_URL}/exoditos`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/tribus`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      if (resExo.ok) setExoditos(await resExo.json());
      if (resTrib.ok) setTribus(await resTrib.json());
    } catch (e) { console.error('Error cargando datos de búsqueda:', e); }
  };

  const buscarExodito = async () => {
    if (!exoditoSeleccionado) return;
    if (!desdeBusqueda || !hastaBusqueda) {
      Platform.OS === 'web' ? alert('Selecciona ambas fechas') : Alert.alert('Atención', 'Selecciona ambas fechas');
      return;
    }
    if (desdeBusqueda > hastaBusqueda) {
      Platform.OS === 'web' ? alert('Fecha inicio > fecha fin') : Alert.alert('Fechas inválidas', 'La fecha de inicio no puede ser mayor que la final');
      return;
    }
    setCargandoExodito(true);
    setResultadoExodito(null);
    try {
      const res = await fetch(
        `${API_URL}/asistencia/exodito/${exoditoSeleccionado.id_exodito}/buscar?desde=${desdeBusqueda}&hasta=${hastaBusqueda}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error del servidor');
      setResultadoExodito(json);
    } catch (err) {
      const msg = err.message || 'Error al buscar exodito';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Error', msg);
    } finally {
      setCargandoExodito(false);
    }
  };

  const buscarTribu = async () => {
    if (!tribuSeleccionada && tribuSeleccionada !== 'todas') return;
    if (!desdeGrupo || !hastaGrupo) {
      Platform.OS === 'web' ? alert('Selecciona ambas fechas') : Alert.alert('Atención', 'Selecciona ambas fechas');
      return;
    }
    if (desdeGrupo > hastaGrupo) {
      Platform.OS === 'web' ? alert('Fecha inicio > fecha fin') : Alert.alert('Fechas inválidas', 'La fecha de inicio no puede ser mayor que la final');
      return;
    }

    if (tribuSeleccionada === 'todas') {
      setCargandoTodasTribus(true);
      setResultadoTodasTribus(null);
      try {
        const res = await fetch(
          `${API_URL}/asistencia/tribus/todas?desde=${desdeGrupo}&hasta=${hastaGrupo}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Error del servidor');
        setResultadoTodasTribus(json);
      } catch (err) {
        const msg = err.message || 'Error al buscar todas las tribus';
        Platform.OS === 'web' ? alert(msg) : Alert.alert('Error', msg);
      } finally {
        setCargandoTodasTribus(false);
      }
      return;
    }

    setCargandoGrupo(true);
    setResultadoGrupo(null);
    try {
      const res = await fetch(
        `${API_URL}/asistencia/tribu/${tribuSeleccionada.id_tribu}?desde=${desdeGrupo}&hasta=${hastaGrupo}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error del servidor');
      setResultadoGrupo(json);
    } catch (err) {
      const msg = err.message || 'Error al buscar tribu';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Error', msg);
    } finally {
      setCargandoGrupo(false);
    }
  };

  const cerrarBuscar = () => {
    setBuscarModalVisible(false);
    setBuscarTab('exodito');
    setExoditoSeleccionado(null);
    setTribuSeleccionada(null);
    setTribuSeleccionadaBusqueda(null);
    setResultadoExodito(null);
    setResultadoGrupo(null);
    setResultadoTodasTribus(null);
    setDesdeBusqueda(hace30Dias());
    setHastaBusqueda(hoy());
    setDesdeGrupo(hace30Dias());
    setHastaGrupo(hoy());
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
          onPress={() => {
            setBuscarModalVisible(true);
            cargarDatosBusqueda();
          }} 
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
                <Text style={styles.reporteSubtitulo}>Top 3 tribus con mayor asistencia global</Text>
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

      {/* ── Modal Búsqueda ── */}
      <Modal transparent animationType="slide" visible={buscarModalVisible} onRequestClose={cerrarBuscar}>
        <View style={styles.modalOverlay}>
          <View style={styles.buscarBox}>
            <View style={styles.buscarHeader}>
              <View>
                <Text style={styles.buscarTitulo}>Buscar Asistencia</Text>
                <Text style={styles.buscarSubtitulo}>Exodito o tribu</Text>
              </View>
              <TouchableOpacity 
                style={styles.closeIconBtn} 
                onPress={cerrarBuscar} 
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            <View style={styles.buscarTabs}>
              <TouchableOpacity
                style={[styles.buscarTab, buscarTab === 'exodito' && styles.buscarTabActive]}
                onPress={() => { setBuscarTab('exodito'); setResultadoExodito(null); setResultadoGrupo(null); setResultadoTodasTribus(null); setExoditoSeleccionado(null); setTribuSeleccionada(null); setTribuSeleccionadaBusqueda(null); }}
                activeOpacity={0.85}
              >
                <Ionicons name="person-outline" size={18} color={buscarTab === 'exodito' ? '#B45309' : '#64748B'} />
                <Text style={[styles.buscarTabText, buscarTab === 'exodito' && styles.buscarTabTextActive]}>Exodito</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.buscarTab, buscarTab === 'tribu' && styles.buscarTabActive]}
                onPress={() => { setBuscarTab('tribu'); setResultadoExodito(null); setResultadoGrupo(null); setResultadoTodasTribus(null); setExoditoSeleccionado(null); setTribuSeleccionada(null); setTribuSeleccionadaBusqueda(null); }}
                activeOpacity={0.85}
              >
                <Ionicons name="people-outline" size={18} color={buscarTab === 'tribu' ? '#B45309' : '#64748B'} />
                <Text style={[styles.buscarTabText, buscarTab === 'tribu' && styles.buscarTabTextActive]}>Tribu</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.buscarContent} showsVerticalScrollIndicator={false}>
              {buscarTab === 'exodito' ? (
                <View>
                  <Text style={styles.buscarLabel}>Seleccionar Tribu</Text>
                  <ScrollView style={styles.tribuLista} nestedScrollEnabled>
                    {tribus.map(t => (
                      <TouchableOpacity
                        key={t.id_tribu}
                        style={[styles.tribuItem, tribuSeleccionadaBusqueda?.id_tribu === t.id_tribu && styles.tribuItemSelected]}
                        onPress={() => { setTribuSeleccionadaBusqueda(t); setExoditoSeleccionado(null); setResultadoExodito(null); }}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.tribuColorDot, { backgroundColor: t.color_hex || '#F59E0B' }]} />
                        <Text style={[styles.tribuNombreItem, tribuSeleccionadaBusqueda?.id_tribu === t.id_tribu && styles.tribuNombreItemSelected]}>{t.nombre}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {tribuSeleccionadaBusqueda && (
                    <View style={{ marginTop: 12 }}>
                      <Text style={styles.buscarLabel}>Seleccionar Exodito</Text>
                      <ScrollView style={styles.exoditoLista} nestedScrollEnabled>
                        {exoditos
                          .filter(e => e.id_tribu === tribuSeleccionadaBusqueda.id_tribu)
                          .map(e => (
                            <TouchableOpacity
                              key={e.id_exodito}
                              style={[styles.exoditoItem, exoditoSeleccionado?.id_exodito === e.id_exodito && styles.exoditoItemSelected]}
                              onPress={() => { setExoditoSeleccionado(e); setResultadoExodito(null); }}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.exoditoNombre}>{e.nombre} {e.apellido}</Text>
                              <Text style={styles.exoditoTribu}>{e.cargo}</Text>
                            </TouchableOpacity>
                          ))}
                        {exoditos.filter(e => e.id_tribu === tribuSeleccionadaBusqueda.id_tribu).length === 0 && (
                          <Text style={styles.sinResultadosText}>No hay exoditos en esta tribu</Text>
                        )}
                      </ScrollView>
                    </View>
                  )}

                  {exoditoSeleccionado && (
                    <View style={styles.seleccionCard}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View>
                          <Text style={styles.seleccionNombre}>{exoditoSeleccionado.nombre} {exoditoSeleccionado.apellido}</Text>
                          <Text style={styles.seleccionTribu}>{exoditoSeleccionado.tribu} · {exoditoSeleccionado.cargo}</Text>
                        </View>
                        <TouchableOpacity onPress={() => { setExoditoSeleccionado(null); setResultadoExodito(null); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                          <Ionicons name="close-circle" size={22} color="#94A3B8" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  <View style={styles.fechasRow}>
                    <DateField label="Desde" value={desdeBusqueda} onChange={setDesdeBusqueda} />
                    <View style={{ width: 12 }} />
                    <DateField label="Hasta" value={hastaBusqueda} onChange={setHastaBusqueda} />
                  </View>

                  <TouchableOpacity
                    style={[styles.buscarBtn, cargandoExodito && { opacity: 0.6 }]}
                    onPress={buscarExodito}
                    disabled={cargandoExodito || !exoditoSeleccionado}
                    activeOpacity={0.85}
                  >
                    {cargandoExodito
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Ionicons name="search" size={18} color="#fff" /><Text style={styles.buscarBtnText}>Buscar</Text></View>
                    }
                  </TouchableOpacity>

                  {resultadoExodito && (
                    <View style={styles.resultadoCard}>
                      <Text style={styles.resultadoTitulo}>Resultados</Text>
                      <Text style={styles.resultadoSubtitulo}>
                        Período: {formatDate(resultadoExodito.desde)} — {formatDate(resultadoExodito.hasta)}
                      </Text>

                      <View style={styles.statRow}>
                        <Text style={styles.statLabel}>Total asistencias</Text>
                        <Text style={styles.statValue}>{resultadoExodito.total_asistencias}</Text>
                      </View>
                      <View style={styles.statRow}>
                        <Text style={styles.statLabel}>Asistencia global</Text>
                        <Text style={styles.statValue}>{resultadoExodito.porcentaje_global}%</Text>
                      </View>
                      <BarraPorcentaje pct={resultadoExodito.porcentaje_global} color="#F59E0B" />

                      {resultadoExodito.desde && resultadoExodito.hasta && (
                        <View>
                          <View style={[styles.statRow, { marginTop: 12 }]}>
                            <Text style={styles.statLabel}>En el período</Text>
                            <Text style={styles.statValue}>{resultadoExodito.porcentaje_rango}%</Text>
                          </View>
                          <BarraPorcentaje pct={resultadoExodito.porcentaje_rango} color="#10B981" />
                          <Text style={styles.statDetail}>{resultadoExodito.rango_presentes} / {resultadoExodito.rango_posibles} posibles</Text>
                        </View>
                      )}

                      <Text style={[styles.statLabel, { marginTop: 12 }]}>Días de asistencia</Text>
                      {resultadoExodito.fechas_asistencia.length === 0 ? (
                        <Text style={styles.sinDadosText}>Sin registros</Text>
                      ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fechasScroll}>
                          <View style={styles.fechasChips}>
                            {resultadoExodito.fechas_asistencia.map(f => (
                              <View key={f} style={styles.fechaChip}>
                                <Text style={styles.fechaChipText}>{formatDate(f)}</Text>
                              </View>
                            ))}
                          </View>
                        </ScrollView>
                      )}
                    </View>
                  )}
                </View>
              ) : (
                <View>
                  <Text style={styles.buscarLabel}>Seleccionar Tribu</Text>
                  <ScrollView style={styles.tribuLista} nestedScrollEnabled>
                    <TouchableOpacity
                      style={[styles.tribuItem, tribuSeleccionada === 'todas' && styles.tribuItemSelected]}
                      onPress={() => { setTribuSeleccionada('todas'); setResultadoGrupo(null); setResultadoTodasTribus(null); }}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.tribuColorDot, { backgroundColor: '#F59E0B' }]} />
                      <Text style={[styles.tribuNombreItem, tribuSeleccionada === 'todas' && styles.tribuNombreItemSelected]}>Todas</Text>
                    </TouchableOpacity>
                    {tribus.map(t => (
                      <TouchableOpacity
                        key={t.id_tribu}
                        style={[styles.tribuItem, tribuSeleccionada?.id_tribu === t.id_tribu && styles.tribuItemSelected]}
                        onPress={() => { setTribuSeleccionada(t); setResultadoGrupo(null); setResultadoTodasTribus(null); }}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.tribuColorDot, { backgroundColor: t.color_hex || '#F59E0B' }]} />
                        <Text style={[styles.tribuNombreItem, tribuSeleccionada?.id_tribu === t.id_tribu && styles.tribuNombreItemSelected]}>{t.nombre}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <View style={styles.fechasRow}>
                    <DateField label="Desde" value={desdeGrupo} onChange={setDesdeGrupo} />
                    <View style={{ width: 12 }} />
                    <DateField label="Hasta" value={hastaGrupo} onChange={setHastaGrupo} />
                  </View>

                  {tribuSeleccionada === 'todas' ? (
                    <TouchableOpacity
                      style={[styles.buscarBtn, cargandoTodasTribus && { opacity: 0.6 }]}
                      onPress={buscarTribu}
                      disabled={cargandoTodasTribus}
                      activeOpacity={0.85}
                    >
                      {cargandoTodasTribus
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Ionicons name="search" size={18} color="#fff" /><Text style={styles.buscarBtnText}>Buscar todas</Text></View>
                      }
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.buscarBtn, cargandoGrupo && { opacity: 0.6 }]}
                      onPress={buscarTribu}
                      disabled={cargandoGrupo || !tribuSeleccionada}
                      activeOpacity={0.85}
                    >
                      {cargandoGrupo
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Ionicons name="search" size={18} color="#fff" /><Text style={styles.buscarBtnText}>Buscar</Text></View>
                      }
                    </TouchableOpacity>
                  )}

                  {resultadoTodasTribus && (
                    <View style={styles.resultadoCard}>
                      <Text style={styles.resultadoTitulo}>Resultados — Todas las tribus</Text>
                      <Text style={styles.resultadoSubtitulo}>
                        Período: {formatDate(resultadoTodasTribus.desde)} — {formatDate(resultadoTodasTribus.hasta)}
                      </Text>
                      {resultadoTodasTribus.tribus.map(tribu => (
                        <View key={tribu.id_tribu} style={styles.tribCard}>
                          <View style={styles.tribRow}>
                            <Text style={styles.tribNombre}>{tribu.nombre}</Text>
                            <View style={[styles.pctBadge, { backgroundColor: (tribu.color_hex || '#F59E0B') + '20' }]}>
                            <Text style={[styles.pctText, { color: tribu.color_hex || '#F59E0B' }]}>
                              {tribu.porcentaje ?? 0}%
                            </Text>
                            </View>
                          </View>
                          {tribu.exoditos.map(e => (
                            <View key={e.id_exodito} style={styles.resultadoItem}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View>
                                  <Text style={styles.exoditoNombre}>{e.nombre} {e.apellido}</Text>
                                  <Text style={styles.exoditoTribu}>{e.cargo}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                  <Text style={styles.statValue}>{e.asistencias_rango} asistencias</Text>
                                  <Text style={styles.statDetail}>Total: {e.total_asistencias}</Text>
                                </View>
                              </View>
                            </View>
                          ))}
                        </View>
                      ))}
                    </View>
                  )}

                  {resultadoGrupo && tribuSeleccionada !== 'todas' && (
                    <View style={styles.resultadoCard}>
                      <Text style={styles.resultadoTitulo}>Resultados — {resultadoGrupo.tribu.nombre}</Text>
                      <Text style={styles.resultadoSubtitulo}>
                        Período: {formatDate(resultadoGrupo.desde)} — {formatDate(resultadoGrupo.hasta)}
                      </Text>

                      <View style={styles.statRow}>
                        <Text style={styles.statLabel}>Presentes</Text>
                        <Text style={styles.statValue}>{resultadoGrupo.tribu.total_presentes} / {resultadoGrupo.tribu.total_posibles}</Text>
                      </View>
                      <View style={styles.statRow}>
                        <Text style={styles.statLabel}>Asistencia</Text>
                        <Text style={styles.statValue}>{resultadoGrupo.tribu.porcentaje}%</Text>
                      </View>
                      <BarraPorcentaje pct={resultadoGrupo.tribu.porcentaje} color={resultadoGrupo.tribu.color_hex || '#F59E0B'} />
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ─── MenuItem Modernizado ──────────────────────────────────── */
function MenuItem({ icon, label, subtitle, onPress }) {
  return (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={onPress}
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

  /* ── Búsqueda modal ── */
  buscarBox: {
    backgroundColor: '#FFFFFF', 
    borderRadius: 20, 
    padding: 22,
    width: '94%', 
    maxHeight: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },

  buscarHeader: {
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'flex-start', 
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },

  buscarTitulo: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#1E293B',
    marginBottom: 2,
  },

  buscarSubtitulo: { 
    fontSize: 13, 
    color: '#64748B' 
  },

  buscarTabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },

  buscarTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },

  buscarTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },

  buscarTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },

  buscarTabTextActive: {
    color: '#B45309',
    fontWeight: '700',
  },

  buscarContent: {
    maxHeight: 420,
  },

  buscarLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  buscarInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
    fontSize: 14,
    color: '#1E293B',
    marginBottom: 8,
  },

  exoditoLista: {
    maxHeight: 160,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#fff',
  },

  exoditoItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  exoditoNombre: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },

  exoditoTribu: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  sinResultadosText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 13,
    padding: 16,
  },

  seleccionCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },

  seleccionNombre: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },

  seleccionTribu: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  tribuLista: {
    maxHeight: 180,
    marginBottom: 12,
  },

  tribuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },

  tribuItemSelected: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },

  tribuColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  tribuNombreItem: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
  },

  tribuNombreItemSelected: {
    color: '#B45309',
    fontWeight: '700',
  },

  buscarBtn: {
    backgroundColor: '#D97706', 
    borderRadius: 12,
    paddingVertical: 14, 
    alignItems: 'center', 
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },

  buscarBtnText: { 
    color: '#FFFFFF', 
    fontWeight: '700',
    fontSize: 15 
  },

  resultadoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  resultadoTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },

  resultadoSubtitulo: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },

  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },

  statLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },

  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },

  statDetail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },

  fechasScroll: {
    marginTop: 8,
  },

  fechasChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },

  fechaChip: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },

  fechaChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B45309',
  },

  exoditoItemSelected: {
    backgroundColor: '#FEF3C7',
    borderLeftWidth: 3,
    borderLeftColor: '#D97706',
  },

  resultadoItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});