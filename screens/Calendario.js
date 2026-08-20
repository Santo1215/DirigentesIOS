import React, { useState, useEffect, useContext } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Modal, 
  TextInput, Alert, ScrollView, Image 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { API_URL } from '../api';
import { UserContext } from '../context/UserContext'; 
import SectionTitle from '../components/TituloSeccion';
import BottomNav from '../components/navbar';
import WaveBackground from '../components/WaveBackground';
import FechaPicker from '../components/FechaPicker'; // <-- Importamos el componente

LocaleConfig.locales['es'] = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
  today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

export default function Calendario({ navigation }) {
  const { user } = useContext(UserContext);
  const { rol, comite } = user.dirigente;

  // Estados Generales
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [actividadesFormateadas, setActividadesFormateadas] = useState({});
  const [todosLosDirigentes, setTodosLosDirigentes] = useState([]);
  
  // Estados para Modal de Detalles y Asistencia
  const [modalDetalleVisible, setModalDetalleVisible] = useState(false);
  const [actividadSeleccionada, setActividadSeleccionada] = useState(null);
  const [asistentes, setAsistentes] = useState([]);
  const [miEstadoAsistencia, setMiEstadoAsistencia] = useState(null); 

  // Estados para Crear Actividad
  const [modalActividadVisible, setModalActividadVisible] = useState(false);
  const [modalTipoVisible, setModalTipoVisible] = useState(false);
  const [nuevaActividad, setNuevaActividad] = useState({
    titulo: '', descripcion: '', fechaObj: new Date(), 
    responsable: user?.dirigente ? `${user.dirigente.nombre} ${user.dirigente.apellido}` : '', 
    tipo: user?.dirigente?.comite || 'Otro'     
  });

  const opcionesTipo = ['Redes', 'Integración', 'Religioso', 'Reunión', 'Otro'];

  // Cargas de la Base de Datos
  const cargarTodosLosDirigentes = async () => {
    try {
      const response = await fetch(`${API_URL}/dirigentes`);
      if (response.ok) setTodosLosDirigentes(await response.json());
    } catch (error) { console.error('Error cargando dirigentes:', error); }
  };

  const fetchActividades = async () => {
    try {
      const response = await fetch(`${API_URL}/actividades`);
      const data = await response.json();
      const formatted = {};
      const arr = Array.isArray(data) ? data : (data.actividades || []);
      
      const coloresTipos = { 
        'redes': '#FF9800', 
        'reunión': '#E50F0F', 
        'religioso': '#2196F3', 
        'integración': '#4CAF50' 
      };

      arr.forEach((act) => {
        const dateStr = String(act.fecha).substring(0, 10);
        if (!formatted[dateStr]) formatted[dateStr] = [];
        
        const color = coloresTipos[act.tipo?.toLowerCase()] || '#9C27B0';
        formatted[dateStr].push({ key: act.id_actividad.toString(), color, ...act });
      });
      setActividadesFormateadas(formatted);
    } catch (error) { console.error('Error cargando actividades:', error); }
  };

  const cargarAsistentes = async (idActividad) => {
    try {
      const response = await fetch(`${API_URL}/actividades/${idActividad}/asistentes`);
      const data = await response.json();
      
      const listaAsistentes = Array.isArray(data) ? data : [];
      setAsistentes(listaAsistentes);
      
      const miRegistro = listaAsistentes.find(d => d.id_dirigente === user.dirigente.id_dirigente);
      setMiEstadoAsistencia(miRegistro ? miRegistro.estado : null);
    } catch (error) { 
      console.error('Error cargando asistentes:', error);
      setAsistentes([]); 
    }
  };

  useEffect(() => {
    fetchActividades();
    cargarTodosLosDirigentes();
  }, []);

  const estaBloqueadaConfirmacion = (fechaActividadStr) => {
    if (!fechaActividadStr) return false;
    const fechaAct = new Date(`${fechaActividadStr.substring(0, 10)}T00:00:00`);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((fechaAct.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 2;
  };

  const registrarAsistencia = async (estado) => {
    if (!actividadSeleccionada) return;

    if (estado === 'no' && estaBloqueadaConfirmacion(actividadSeleccionada.fecha)) {
      Alert.alert('Plazo vencido', 'Ya no puedes cancelar tu asistencia a menos de 2 días de la actividad.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/actividades/${actividadSeleccionada.id_actividad}/confirmar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id_dirigente: user.dirigente.id_dirigente,
          estado 
        })
      });
      
      if (response.ok) {
        cargarAsistentes(actividadSeleccionada.id_actividad);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar tu respuesta.');
    }
  };

  const abrirModalCrear = () => {
    const fechaBase = diaSeleccionado ? new Date(`${diaSeleccionado}T12:00:00`) : new Date();
    setNuevaActividad({
      titulo: '', descripcion: '', fechaObj: fechaBase,
      responsable: user?.dirigente ? `${user.dirigente.nombre} ${user.dirigente.apellido}` : '',
      tipo: user?.dirigente?.comite || 'Otro'
    });
    setModalActividadVisible(true);
  };

  const handleGuardarActividad = async () => {
    if (!nuevaActividad.titulo) {
      Alert.alert('Error', 'El título es obligatorio');
      return;
    }

    const year = nuevaActividad.fechaObj.getFullYear();
    const month = String(nuevaActividad.fechaObj.getMonth() + 1).padStart(2, '0');
    const day = String(nuevaActividad.fechaObj.getDate()).padStart(2, '0');
    
    try {
      const response = await fetch(`${API_URL}/actividades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: nuevaActividad.titulo,
          descripcion: nuevaActividad.descripcion,
          fecha: `${year}-${month}-${day}`,
          responsable: nuevaActividad.responsable,
          tipo: nuevaActividad.tipo
        })
      });

      if (response.ok) {
        Alert.alert('Éxito', 'Actividad guardada correctamente');
        setModalActividadVisible(false);
        fetchActividades(); 
      }
    } catch (error) { console.error('Error guardando actividad:', error); }
  };

  const losQueVan = asistentes.filter(a => a.estado === 'si');
  const losQueNoVan = asistentes.filter(a => a.estado === 'no');
  const sinConfirmar = todosLosDirigentes.filter(
    d => !asistentes.some(a => a.id_dirigente === d.id_dirigente)
  );

  return (
    <View style={styles.container}>
      <WaveBackground style={{ pointerEvents: 'none' }} />
      <SectionTitle title="Calendario" showBackButton={true} onBackPress={() => navigation.goBack()} />
      
      {/* CALENDARIO */}
      <View style={styles.calendarContainer}>
        <Calendar
          markedDates={actividadesFormateadas}
          onDayPress={(day) => setDiaSeleccionado(day.dateString)}
          dayComponent={({ date, state }) => {
            const dayEvents = actividadesFormateadas[date.dateString] || [];
            return (
              <TouchableOpacity style={styles.dayCell} onPress={() => setDiaSeleccionado(date.dateString)}>
                <Text style={{ textAlign: 'center', color: state === 'disabled' ? '#ccc' : '#222', fontWeight: state === 'today' ? 'bold' : 'normal' }}>
                  {date.day}
                </Text>
                <View style={styles.eventsContainer}>
                  {dayEvents.map((ev, i) => <View key={i} style={[styles.eventPill, { backgroundColor: ev.color }]} />)}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* LEYENDA */}
      <View style={styles.legendContainer}>
        <View style={styles.legendColorBar}>
          <View style={[styles.colorSegment, { backgroundColor: '#E50F0F' }]} /><View style={[styles.colorSegment, { backgroundColor: '#2196F3' }]} /><View style={[styles.colorSegment, { backgroundColor: '#4CAF50' }]} /><View style={[styles.colorSegment, { backgroundColor: '#FF9800' }]} /><View style={[styles.colorSegment, { backgroundColor: '#9C27B0' }]} />
        </View>
        <View style={styles.legendLabels}>
          <Text style={styles.legendText}>Reunión</Text><Text style={styles.legendText}>Religioso</Text><Text style={styles.legendText}>Integración</Text><Text style={styles.legendText}>Redes</Text><Text style={styles.legendText}>Otro</Text>
        </View>
      </View>

      {/* BOTÓN FLOTANTE CREAR ACTIVIDAD */}
      {(comite === 'Redes' || comite === 'Integración' || comite === 'Religioso' || rol === 'Coordinación') && (
        <TouchableOpacity style={styles.fab} onPress={abrirModalCrear}> 
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      )}

      {/* VISTA PREVIA DEL DÍA */}
      {diaSeleccionado && (
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>Actividades del {diaSeleccionado}</Text>
            <TouchableOpacity onPress={() => setDiaSeleccionado(null)}><Ionicons name="close" size={20} color="#666" /></TouchableOpacity>
          </View>
          {(!actividadesFormateadas[diaSeleccionado] || actividadesFormateadas[diaSeleccionado].length === 0) ? (
            <Text style={styles.noPreviewText}>No hay actividades.</Text>
          ) : (
            actividadesFormateadas[diaSeleccionado].map((item) => (
              <TouchableOpacity key={item.key} style={[styles.previewCard, { borderLeftColor: item.color }]} onPress={() => { setActividadSeleccionada(item); cargarAsistentes(item.id_actividad); setModalDetalleVisible(true); }}>
                <Text style={styles.previewCardTitle}>{item.titulo}</Text>
                <Text style={styles.previewCardSub} numberOfLines={1}>{item.tipo}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {/* MODAL DETALLES DE ACTIVIDAD */}
      <Modal visible={modalDetalleVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#fff', width: '90%', maxHeight: '85%' }]}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: '#333' }}>Detalles de la Actividad</Text>
            
            {actividadSeleccionada && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 15 }}>
                <Text style={styles.detailLabel}>Título:</Text><Text style={styles.detailValue}>{actividadSeleccionada.titulo}</Text>
                <Text style={styles.detailLabel}>Fecha:</Text><Text style={styles.detailValue}>{actividadSeleccionada.fecha?.substring(0, 10)}</Text>
                <Text style={styles.detailLabel}>Tipo / Comité:</Text><Text style={styles.detailValue}>{actividadSeleccionada.tipo}</Text>
                {rol === 'Coordinación' && (<><Text style={styles.detailLabel}>Responsable:</Text><Text style={styles.detailValue}>{actividadSeleccionada.responsable}</Text></>)}
                <Text style={styles.detailLabel}>Descripción:</Text><Text style={styles.detailValue}>{actividadSeleccionada.descripcion}</Text>

                {estaBloqueadaConfirmacion(actividadSeleccionada.fecha) && (
                  <Text style={{ color: '#E50F0F', fontSize: 12, marginTop: 10, textAlign: 'center', fontWeight: 'bold' }}>
                    Ya no puedes cancelar tu asistencia (quedan 2 días o menos).
                  </Text>
                )}

                <View style={{ marginTop: 15 }}>
                  <Text style={styles.detailLabel}>¿Asistirás a esta actividad?:</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                    <TouchableOpacity 
                      style={[styles.button, { backgroundColor: miEstadoAsistencia === 'si' ? '#4CAF50' : '#e0e0e0' }]} 
                      onPress={() => registrarAsistencia('si')}
                    >
                      <Text style={{ color: miEstadoAsistencia === 'si' ? '#fff' : '#333', fontWeight: 'bold' }}>Sí Asistiré</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.button, { 
                        backgroundColor: miEstadoAsistencia === 'no' ? '#F44336' : '#e0e0e0',
                        opacity: estaBloqueadaConfirmacion(actividadSeleccionada.fecha) ? 0.6 : 1
                      }]} 
                      onPress={() => registrarAsistencia('no')}
                      disabled={estaBloqueadaConfirmacion(actividadSeleccionada.fecha)}
                    >
                      <Text style={{ color: miEstadoAsistencia === 'no' ? '#fff' : '#333', fontWeight: 'bold' }}>No Asistiré</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {(rol === 'Coordinación' || comite === actividadSeleccionada.tipo) && (
                  <View style={{ marginTop: 25, borderTopWidth: 1, borderColor: '#eee', paddingTop: 10 }}>
                    <Text style={styles.detailLabel}>Confirmaron Asistencia ({losQueVan.length}):</Text>
                    {losQueVan.map(a => (
                      <View key={a.id_dirigente} style={styles.dirigenteItemRow}>
                        <View style={styles.avatarContainer}>
                          {a.foto ? <Image source={{ uri: a.foto }} style={styles.avatarImage} /> : <Ionicons name="person" size={14} color="#2e7d32" />}
                        </View>
                        <Text style={[styles.detailValueInline, { color: '#2e7d32' }]}>{a.nombre} {a.apellido}</Text>
                      </View>
                    ))}

                    <Text style={[styles.detailLabel, { marginTop: 10 }]}>No Asistirán ({losQueNoVan.length}):</Text>
                    {losQueNoVan.map(a => (
                      <View key={a.id_dirigente} style={styles.dirigenteItemRow}>
                        <View style={styles.avatarContainer}>
                          {a.foto ? <Image source={{ uri: a.foto }} style={styles.avatarImage} /> : <Ionicons name="person" size={14} color="#d32f2f" />}
                        </View>
                        <Text style={[styles.detailValueInline, { color: '#d32f2f' }]}>{a.nombre} {a.apellido}</Text>
                      </View>
                    ))}

                    <Text style={[styles.detailLabel, { marginTop: 10 }]}>Sin Confirmar ({sinConfirmar.length}):</Text>
                    {sinConfirmar.map(d => (
                      <View key={d.id_dirigente} style={styles.dirigenteItemRow}>
                        <View style={styles.avatarContainer}>
                          {d.foto ? <Image source={{ uri: d.foto }} style={styles.avatarImage} /> : <Ionicons name="person" size={14} color="#888" />}
                        </View>
                        <Text style={[styles.detailValueInline, { color: '#888' }]}>{d.nombre} {d.apellido}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            )}

            <TouchableOpacity style={{ backgroundColor: '#FFA726', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 5 }} onPress={() => setModalDetalleVisible(false)}>
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL CREAR ACTIVIDAD */}
      <Modal visible={modalActividadVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#fff', width: '90%' }]}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' }}>Nueva Actividad</Text>
            
            <TextInput style={styles.input} placeholder="Título" value={nuevaActividad.titulo} onChangeText={(text) => setNuevaActividad({ ...nuevaActividad, titulo: text })} />
            
            {/* AQUÍ IMPLEMENTAMOS NUESTRO COMPONENTE FECHAPICKER */}
            <FechaPicker 
              fechaObj={nuevaActividad.fechaObj}
              onFechaChange={(nuevaFecha) => setNuevaActividad({ ...nuevaActividad, fechaObj: nuevaFecha })}
            />

            <TextInput style={[styles.input, { backgroundColor: '#e9ecef' }]} placeholder="Responsable" value={nuevaActividad.responsable} editable={false} />
            
            <TouchableOpacity style={[styles.input, { justifyContent: 'center', backgroundColor: rol === 'Coordinación' ? '#fff' : '#e9ecef' }]} onPress={() => { if (rol === 'Coordinación') setModalTipoVisible(true); }} disabled={rol !== 'Coordinación'}>
              <Text style={{ color: nuevaActividad.tipo ? '#333' : '#888' }}>{nuevaActividad.tipo || 'Seleccione Tipo'}</Text>
            </TouchableOpacity>
            
            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Descripción" multiline value={nuevaActividad.descripcion} onChangeText={(text) => setNuevaActividad({ ...nuevaActividad, descripcion: text })} />
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
              <TouchableOpacity style={[styles.button, { backgroundColor: '#ccc' }]} onPress={() => setModalActividadVisible(false)}>
                <Text style={{ color: '#333', fontWeight: 'bold' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, { backgroundColor: '#FFA726' }]} onPress={handleGuardarActividad}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL TIPO */}
      <Modal visible={modalTipoVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalTipoVisible(false)}>
          <View style={[styles.modalContent, { width: '70%', padding: 10 }]}>
            {opcionesTipo.map((opcion, index) => (
              <TouchableOpacity key={index} style={{ paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' }} onPress={() => { setNuevaActividad({ ...nuevaActividad, tipo: opcion }); setModalTipoVisible(false); }}>
                <Text style={{ fontSize: 16, color: '#333' }}>{opcion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <BottomNav navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6f8', paddingTop: 50 },
  calendarContainer: { flex: 1, backgroundColor: '#fff', marginHorizontal: 15, borderRadius: 15, padding: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  dayCell: { width: 32, height: 45, alignItems: 'center' },
  eventsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 2, width: '100%' },
  eventPill: { width: '90%', height: 4, borderRadius: 2, marginTop: 2 },
  legendContainer: { paddingHorizontal: 20, paddingBottom: 10, paddingTop: 10, marginTop:20,backgroundColor:'rgba(255, 255, 255, 0.7)', borderRadius:80 ,margin:10 },
  legendColorBar: { flexDirection: 'row', height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 8 },
  colorSegment: { flex: 1 },
  legendLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  legendText: { fontSize: 10, color: '#666' },
  fab: { position: 'absolute', right: 20, bottom: 100, backgroundColor: '#FFA726', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#fef1e6', borderRadius: 16, padding: 20, elevation: 10 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 15, backgroundColor: '#fafafa' },
  button: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  previewContainer: { backgroundColor: '#fff', marginHorizontal: 15, marginTop: 10, borderRadius: 12, padding: 15, maxHeight: 180, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  previewTitle: { fontWeight: 'bold', fontSize: 14, color: '#333' },
  noPreviewText: { color: '#888', fontSize: 13, textAlign: 'center', marginVertical: 10 },
  previewCard: { backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8, marginBottom: 6, borderLeftWidth: 4 },
  previewCardTitle: { fontWeight: 'bold', fontSize: 14, color: '#222' },
  previewCardSub: { fontSize: 12, color: '#666' },
  detailLabel: { fontSize: 12, fontWeight: 'bold', color: '#888', marginTop: 8 },
  detailValue: { fontSize: 15, color: '#333', backgroundColor: '#f5f5f5', padding: 8, borderRadius: 6, marginTop: 2 },
  dirigenteItemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', padding: 6, borderRadius: 6, marginTop: 4 },
  avatarContainer: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center', marginRight: 8, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  detailValueInline: { fontSize: 14, fontWeight: '500' },
});