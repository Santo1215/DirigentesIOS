import React, { useState, useEffect, useContext } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Modal, 
  TextInput, Alert, ScrollView, Image 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { API_URL } from '../api';
import { UserContext } from '../context/UserContext'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import SectionTitle from '../components/TituloSeccion';
import BottomNav from '../components/navbar';
import WaveBackground from '../components/WaveBackground';
import FechaPicker from '../components/FechaPicker';
import BotonCalificarAsamblea from '../components/BotonCalificarAsamblea';

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
  const [token, setToken] = useState(null);
  
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

const fetchEventos = async () => {
  try {
    const [resAct, resAsam] = await Promise.all([
      fetch(`${API_URL}/actividades`),
      fetch(`${API_URL}/asambleas`)
    ]);
    
    const dataAct = await resAct.json();
    const dataAsam = await resAsam.json();
    
    const formatted = {};
    const coloresTipos = { 
      'redes': '#FFFF00', 
      'reunión': '#4CAF50', 
      'religioso': '#E50F0F', 
      'integración': '#2196F3',
      'asamblea': '#FF9800', 
      'otro': '#9C27B0'
    };

      // Procesar Actividades
      const arrAct = Array.isArray(dataAct) ? dataAct : (dataAct.actividades || []);
    arrAct.forEach((act) => {
    const dateStr = String(act.fecha).substring(0, 10);
    if (!formatted[dateStr]) formatted[dateStr] = [];
    
    // Busca el color, si no existe usa el de 'otro'
    const color = coloresTipos[act.tipo?.toLowerCase()] || coloresTipos['otro'];
    
    formatted[dateStr].push({ key: `act_${act.id_actividad}`, color, ...act });
  });
      
   // Procesar Asambleas
    const arrAsam = Array.isArray(dataAsam) ? dataAsam : (dataAsam.asambleas || []);
    arrAsam.forEach((asm) => {
      const dateStr = String(asm.fecha).substring(0, 10);
      if (!formatted[dateStr]) formatted[dateStr] = [];
      formatted[dateStr].push({ 
        key: `asm_${asm.id_asamblea}`, 
        color: coloresTipos['asamblea'], 
        tipo: 'Asamblea',
        esAsamblea: true,
        ...asm
      });
    });

    setActividadesFormateadas(formatted);
  } catch (error) { console.error('Error:', error); }
};

  const cargarAsistentes = async (actividad) => {
    try {
      let url = `${API_URL}/actividades/${actividad.id_actividad}/asistentes`;
      if (actividad.esAsamblea) {
         url = `${API_URL}/asistencia/fecha/${actividad.fecha.substring(0, 10)}`;
      }
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      let listaAsistentes = Array.isArray(data) ? data : [];

      if (actividad.esAsamblea) {
        listaAsistentes = listaAsistentes
          .filter(a => a.estado === 'Presente' || a.estado === 'Asistirá' || a.estado === 'No asistirá')
          .map(a => ({
            ...a,
            estado: (a.estado === 'Presente' || a.estado === 'Asistirá') ? 'si' : 'no'
          }));
      }

      setAsistentes(listaAsistentes);
      
      const miRegistro = listaAsistentes.find(d => d.id_dirigente === user.dirigente.id_dirigente);
      setMiEstadoAsistencia(miRegistro ? miRegistro.estado : null);
    } catch (error) { 
      console.error('Error cargando asistentes:', error);
      setAsistentes([]); 
    }
  };

  useEffect(() => {
    fetchEventos();
    cargarTodosLosDirigentes();
    AsyncStorage.getItem('token').then(setToken);
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
      let url = `${API_URL}/actividades/${actividadSeleccionada.id_actividad}/confirmar`;
      let bodyData = { 
        id_dirigente: user.dirigente.id_dirigente,
        estado 
      };
      let method = 'POST';

      if (actividadSeleccionada.esAsamblea) {
        url = `${API_URL}/asistencia`;
        method = 'PUT';
        bodyData = {
          id_dirigente: user.dirigente.id_dirigente,
          fecha: actividadSeleccionada.fecha.substring(0, 10),
          estado: estado === 'si' ? 'Asistirá' : 'No asistirá'
        };
      }

      const response = await fetch(url, {
        method: method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      });
      
      if (response.ok) {
        cargarAsistentes(actividadSeleccionada);
      } else {
        Alert.alert('Error', 'Hubo un problema al guardar tu asistencia.');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo conectar con el servidor.');
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
          <View style={[styles.colorSegment, { backgroundColor: '#FF9800' }]} /><View style={[styles.colorSegment, { backgroundColor: '#4CAF50' }]} /><View style={[styles.colorSegment, { backgroundColor: '#E50F0F' }]} /><View style={[styles.colorSegment, { backgroundColor: '#2196F3' }]} /><View style={[styles.colorSegment, { backgroundColor: '#FFFF00' }]} /><View style={[styles.colorSegment, { backgroundColor: '#9C27B0' }]} />
        </View>
        <View style={styles.legendLabels}>
          <Text style={styles.legendText}>Asambleas</Text><Text style={styles.legendText}>Reunión</Text><Text style={styles.legendText}>Religioso</Text><Text style={styles.legendText}>Integración</Text><Text style={styles.legendText}>Redes</Text><Text style={styles.legendText}>Otro</Text>
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
              <TouchableOpacity key={item.key} style={[styles.previewCard, { borderLeftColor: item.color }]} onPress={() => { setActividadSeleccionada(item); cargarAsistentes(item); setModalDetalleVisible(true); }}>
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
                {(rol === 'Coordinación' || actividadSeleccionada.esAsamblea) && (
                  <>
                    <Text style={styles.detailLabel}>Responsable / Encargado:</Text>
                    <Text style={styles.detailValue}>
                      {actividadSeleccionada.esAsamblea 
                        ? (actividadSeleccionada.encargado_nombre 
                            ? `${actividadSeleccionada.encargado_nombre} ${actividadSeleccionada.encargado_apellido || ''}`.trim() 
                            : 'Sin asignar')
                        : actividadSeleccionada.responsable}
                    </Text>
                  </>
                )}
                <Text style={styles.detailLabel}>Descripción:</Text><Text style={styles.detailValue}>{actividadSeleccionada.descripcion}</Text>

                

                {actividadSeleccionada.esAsamblea && (
                  <View style={styles.asambleaCardContainer}>
                  {(rol === 'Coordinación' || rol === 'Nombrado') && (
                    <BotonCalificarAsamblea 
                      asamblea={actividadSeleccionada} 
                      idDirigente={user.dirigente.id_dirigente} 
                      yaCalificado={actividadSeleccionada.calificaciones?.some(c => c.id_dirigente === user.dirigente.id_dirigente)}
                      onCalificado={() => fetchEventos()} 
                    />
                  )}
                  </View>
                )}

                <View style={{ marginTop: 15 }}>
                  {estaBloqueadaConfirmacion(actividadSeleccionada.fecha) && (
                    <Text style={{ color: '#E50F0F', fontSize: 12, marginTop: 10, textAlign: 'center', fontWeight: 'bold' }}>
                      Ya no puedes cancelar tu asistencia (quedan 2 días o menos).
                    </Text>
                  )}
                  <Text style={styles.detailLabel}>¿Asistirás a esta actividad?</Text>
                  <View style={styles.asistenciaBotonesRow}>
                    <TouchableOpacity 
                      style={[
                        styles.btnAsistencia, 
                        miEstadoAsistencia === 'si' && styles.btnAsistenciaSiActivo
                      ]} 
                      onPress={() => registrarAsistencia('si')}
                      activeOpacity={0.8}
                    >
                      <Ionicons 
                        name={miEstadoAsistencia === 'si' ? "checkmark-circle" : "checkmark-circle-outline"} 
                        size={18} 
                        color={miEstadoAsistencia === 'si' ? "#FFF" : "#475569"} 
                      />
                      <Text style={[styles.btnAsistenciaText, miEstadoAsistencia === 'si' && styles.textActivo]}>
                        Sí Asistiré
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[
                        styles.btnAsistencia, 
                        miEstadoAsistencia === 'no' && styles.btnAsistenciaNoActivo
                      ]} 
                      onPress={() => registrarAsistencia('no')}
                      activeOpacity={0.8}
                    >
                      <Ionicons 
                        name={miEstadoAsistencia === 'no' ? "close-circle" : "close-circle-outline"} 
                        size={18} 
                        color={miEstadoAsistencia === 'no' ? "#FFF" : "#475569"} 
                      />
                      <Text style={[styles.btnAsistenciaText, miEstadoAsistencia === 'no' && styles.textActivo]}>
                        No Asistiré
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {(() => {
                  let mostrarAsistentes = false;
                  if (actividadSeleccionada.esAsamblea) {
                    const idUser = user.dirigente.id_dirigente;
                    let esEncargado = idUser === actividadSeleccionada.id_encargado || 
                                      idUser === actividadSeleccionada.id_encargado_pitar || 
                                      idUser === actividadSeleccionada.id_encargado_tiempo;
                    if (actividadSeleccionada.otros_encargados) {
                      try {
                        const otros = typeof actividadSeleccionada.otros_encargados === 'string' ? JSON.parse(actividadSeleccionada.otros_encargados) : actividadSeleccionada.otros_encargados;
                        if (Array.isArray(otros) && otros.includes(idUser)) {
                          esEncargado = true;
                        }
                      } catch (e) {
                        // ignore
                      }
                    }
                    mostrarAsistentes = rol === 'Coordinación' || esEncargado;
                  } else {
                    mostrarAsistentes = rol === 'Coordinación' || comite === actividadSeleccionada.tipo;
                  }

                  if (mostrarAsistentes) {
                    return (
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
                    );
                  }
                  return null;
                })()}
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
  asambleaCardContainer: {
    marginTop: 15,
  },
  asistenciaBotonesRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  btnAsistencia: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  btnAsistenciaSiActivo: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  btnAsistenciaNoActivo: {
    backgroundColor: '#EF4444',
    borderColor: '#DC2626',
  },
  btnAsistenciaText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  textActivo: {
    color: '#FFFFFF',
  },
});