import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  TextInput, Alert, ScrollView, Image, Switch, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { API_URL } from '../api';
import { UserContext } from '../context/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNav from '../components/navbar';
import FechaPicker from '../components/FechaPicker';
import ModalCalificacionAsamblea from '../components/ModalCalificacionAsamblea';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CELL_SIZE = Math.floor((SCREEN_WIDTH - 40) / 7);

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

  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [actividadesFormateadas, setActividadesFormateadas] = useState({});
  const [todosLosDirigentes, setTodosLosDirigentes] = useState([]);
  const [token, setToken] = useState(null);

  const [modalDetalleVisible, setModalDetalleVisible] = useState(false);
  const [actividadSeleccionada, setActividadSeleccionada] = useState(null);
  const [asistentes, setAsistentes] = useState([]);
  const [miEstadoAsistencia, setMiEstadoAsistencia] = useState(null);

  const [modalActividadVisible, setModalActividadVisible] = useState(false);
  const [modalTipoVisible, setModalTipoVisible] = useState(false);
  const [nuevaActividad, setNuevaActividad] = useState({
    titulo: '', descripcion: '', fechaObj: new Date(),
    responsable: user?.dirigente ? `${user.dirigente.nombre} ${user.dirigente.apellido}` : '',
    tipo: user?.dirigente?.comite || 'Otro',
    verificarAsistencia: true
  });

  const [asambleaACalificar, setAsambleaACalificar] = useState(null);
  const [actualizandoVerificacion, setActualizandoVerificacion] = useState(false);

  const obtenerTiposPermitidos = () => {
    const todos = ['Integración', 'Redes', 'Religioso', 'Reunión', 'Otro'];
    if (rol === 'Coordinación' || comite === 'Coordinación') return todos;
    if (comite === 'Integración') return ['Integración', 'Otro'];
    if (comite === 'Redes') return ['Redes', 'Otro'];
    if (comite === 'Religioso') return ['Religioso', 'Otro'];
    return ['Otro'];
  };

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

      const arrAct = Array.isArray(dataAct) ? dataAct : (dataAct.actividades || []);
      arrAct.forEach((act) => {
        const dateStr = String(act.fecha).substring(0, 10);
        if (!formatted[dateStr]) formatted[dateStr] = [];
        const color = coloresTipos[act.tipo?.toLowerCase()] || coloresTipos['otro'];
        formatted[dateStr].push({ key: `act_${act.id_actividad}`, color, ...act });
      });

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
    const tipos = obtenerTiposPermitidos();
    setNuevaActividad({
      titulo: '', descripcion: '', fechaObj: fechaBase,
      responsable: user?.dirigente ? `${user.dirigente.nombre} ${user.dirigente.apellido}` : '',
      tipo: tipos[0],
      verificarAsistencia: true
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
          tipo: nuevaActividad.tipo,
          verificar_asistencia: nuevaActividad.verificarAsistencia !== false
        })
      });

      if (response.ok) {
        Alert.alert('Éxito', 'Actividad guardada correctamente');
        setModalActividadVisible(false);
        fetchEventos();
      }
    } catch (error) { console.error('Error guardando actividad:', error); }
  };

  const toggleVerificarAsistencia = async (nuevoValor) => {
    if (!actividadSeleccionada) return;
    try {
      setActualizandoVerificacion(true);
      const response = await fetch(`${API_URL}/actividades/${actividadSeleccionada.id_actividad}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificar_asistencia: nuevoValor })
      });
      if (response.ok) {
        setActividadSeleccionada({ ...actividadSeleccionada, verificar_asistencia: nuevoValor });
        fetchEventos();
      } else {
        Alert.alert('Error', 'No se pudo actualizar la verificación de asistencia.');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo conectar con el servidor.');
    } finally {
      setActualizandoVerificacion(false);
    }
  };

  const losQueVan = asistentes.filter(a => a.estado === 'si');
  const losQueNoVan = asistentes.filter(a => a.estado === 'no');
  const sinConfirmar = todosLosDirigentes.filter(
    d => !asistentes.some(a => a.id_dirigente === d.id_dirigente)
  );

  const verificarAsistencia = actividadSeleccionada ? actividadSeleccionada.verificar_asistencia !== false : true;
  const puedeGestionarActividad = rol === 'Coordinación' || comite === actividadSeleccionada?.tipo;

  const coloresLeyenda = [
    { color: '#FF9800', label: 'Asamblea' },
    { color: '#4CAF50', label: 'Reunión' },
    { color: '#E50F0F', label: 'Religioso' },
    { color: '#2196F3', label: 'Integración' },
    { color: '#FFFF00', label: 'Redes' },
    { color: '#9C27B0', label: 'Otro' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calendario</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.calendarContainer}>
          <Calendar
            markedDates={actividadesFormateadas}
            onDayPress={(day) => setDiaSeleccionado(day.dateString)}
            dayComponent={({ date, state }) => {
              const dayEvents = actividadesFormateadas[date.dateString] || [];
              const isSelected = diaSeleccionado === date.dateString;
              const isToday = state === 'today';
              return (
                <TouchableOpacity
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                    isToday && styles.dayCellToday,
                  ]}
                  onPress={() => setDiaSeleccionado(date.dateString)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.dayText,
                    state === 'disabled' && styles.dayTextDisabled,
                    isSelected && styles.dayTextSelected,
                    isToday && styles.dayTextToday,
                  ]}>
                    {date.day}
                  </Text>
                  <View style={styles.eventsRow}>
                    {dayEvents.slice(0, 3).map((ev, i) => (
                      <View key={i} style={[styles.eventDot, { backgroundColor: ev.color }]} />
                    ))}
                  </View>
                </TouchableOpacity>
              );
            }}
            theme={{
              calendarBackground: '#fff',
              textDayFontWeight: '500',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 11,
              arrowColor: '#FFA726',
              todayTextColor: '#FFA726',
              selectedDayBackgroundColor: '#FFA726',
              selectedDayTextColor: '#fff',
              monthTextColor: '#22335D',
              textDisabledColor: '#ccc',
              dayTextColor: '#333',
            }}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.legendScroll}
          contentContainerStyle={styles.legendContent}
        >
          {coloresLeyenda.map((item, idx) => (
            <View key={idx} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendLabel}>{item.label}</Text>
            </View>
          ))}
        </ScrollView>

        {diaSeleccionado && (
          <View style={styles.previewContainer}>
            <View style={styles.previewHeader}>
              <View>
                <Text style={styles.previewTitle}>Actividades</Text>
                <Text style={styles.previewDate}>{diaSeleccionado}</Text>
              </View>
              <TouchableOpacity
                style={styles.closePreviewBtn}
                onPress={() => setDiaSeleccionado(null)}
              >
                <Ionicons name="close" size={18} color="#666" />
              </TouchableOpacity>
            </View>
            {(!actividadesFormateadas[diaSeleccionado] || actividadesFormateadas[diaSeleccionado].length === 0) ? (
              <View style={styles.noActivitiesContainer}>
                <Ionicons name="calendar-outline" size={28} color="#ccc" />
                <Text style={styles.noPreviewText}>No hay actividades</Text>
              </View>
            ) : (
              actividadesFormateadas[diaSeleccionado].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.previewCard, { borderLeftColor: item.color }]}
                  onPress={() => { setActividadSeleccionada(item); cargarAsistentes(item); setModalDetalleVisible(true); }}
                  activeOpacity={0.7}
                >
                  <View style={styles.previewCardContent}>
                    <Text style={styles.previewCardTitle} numberOfLines={1}>{item.titulo}</Text>
                    <Text style={styles.previewCardSub}>{item.tipo}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#999" />
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={abrirModalCrear} activeOpacity={0.8}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalDetalleVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Detalles de la Actividad</Text>

            {actividadSeleccionada && (
              <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                <Text style={styles.detailLabel}>Título</Text>
                <Text style={styles.detailValue}>{actividadSeleccionada.titulo}</Text>

                <Text style={styles.detailLabel}>Fecha</Text>
                <Text style={styles.detailValue}>{actividadSeleccionada.fecha?.substring(0, 10)}</Text>

                <Text style={styles.detailLabel}>Tipo / Comité</Text>
                <Text style={styles.detailValue}>{actividadSeleccionada.tipo}</Text>

                {(rol === 'Coordinación' || actividadSeleccionada.esAsamblea) && (
                  <>
                    <Text style={styles.detailLabel}>Responsable / Encargado</Text>
                    <Text style={styles.detailValue}>
                      {actividadSeleccionada.esAsamblea
                        ? (actividadSeleccionada.encargado_nombre
                          ? `${actividadSeleccionada.encargado_nombre} ${actividadSeleccionada.encargado_apellido || ''}`.trim()
                          : 'Sin asignar')
                        : actividadSeleccionada.responsable}
                    </Text>
                  </>
                )}

                <Text style={styles.detailLabel}>Descripción</Text>
                <Text style={styles.detailValue}>{actividadSeleccionada.descripcion || 'Sin descripción'}</Text>

                {actividadSeleccionada.esAsamblea && (
                  <View style={styles.asambleaCardContainer}>
                    {(() => {
                      const yaCalifico = actividadSeleccionada.calificaciones?.some(c => c.id_dirigente === user.dirigente.id_dirigente);
                      return (
                        <TouchableOpacity
                          style={[
                            styles.calificarBtn,
                            yaCalifico ? styles.calificarBtnVer : styles.calificarBtnCalificar
                          ]}
                          onPress={() => setAsambleaACalificar(actividadSeleccionada)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name={yaCalifico ? 'eye' : 'star'} size={16} color={yaCalifico ? '#10B981' : '#FFF'} />
                          <Text style={[styles.calificarBtnText, yaCalifico && styles.calificarBtnTextVer]}>
                            {yaCalifico ? 'Ver calificación' : 'Calificar'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })()}
                  </View>
                )}

                <View style={styles.asistenciaSection}>
                  {puedeGestionarActividad && (
                    <View style={styles.verificarRow}>
                      <Text style={styles.verificarLabel}>Verificar asistencia</Text>
                      <Switch
                        value={verificarAsistencia}
                        onValueChange={(v) => toggleVerificarAsistencia(v)}
                        disabled={actualizandoVerificacion}
                        trackColor={{ false: '#CBD5E1', true: '#FFA726' }}
                        thumbColor="#FFF"
                        ios_backgroundColor="#CBD5E1"
                      />
                    </View>
                  )}

                  {verificarAsistencia && (
                    <>
                      {estaBloqueadaConfirmacion(actividadSeleccionada.fecha) && (
                        <Text style={styles.blockedText}>
                          Ya no puedes cancelar tu asistencia (quedan 2 días o menos).
                        </Text>
                      )}
                      <Text style={styles.detailLabel}>¿Asistirás a esta actividad?</Text>
                      <View style={styles.asistenciaBotonesRow}>
                        <TouchableOpacity
                          style={[
                            styles.btnAsistencia,
                            styles.btnAsistenciaSi,
                            miEstadoAsistencia === 'si' && styles.btnAsistenciaSiActivo
                          ]}
                          onPress={() => registrarAsistencia('si')}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name={miEstadoAsistencia === 'si' ? "checkmark-circle" : "checkmark-circle-outline"}
                            size={18}
                            color={miEstadoAsistencia === 'si' ? "#FFF" : "#10B981"}
                          />
                          <Text style={[styles.btnAsistenciaText, miEstadoAsistencia === 'si' && styles.textActivo]}>
                            Sí Asistiré
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.btnAsistencia,
                            styles.btnAsistenciaNo,
                            miEstadoAsistencia === 'no' && styles.btnAsistenciaNoActivo
                          ]}
                          onPress={() => registrarAsistencia('no')}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name={miEstadoAsistencia === 'no' ? "close-circle" : "close-circle-outline"}
                            size={18}
                            color={miEstadoAsistencia === 'no' ? "#FFF" : "#EF4444"}
                          />
                          <Text style={[styles.btnAsistenciaText, miEstadoAsistencia === 'no' && styles.textActivo]}>
                            No Asistiré
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>

                {(() => {
                  if (!verificarAsistencia) return null;
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
                      } catch (e) { }
                    }
                    mostrarAsistentes = rol === 'Coordinación' || esEncargado;
                  } else {
                    mostrarAsistentes = rol === 'Coordinación' || comite === actividadSeleccionada.tipo;
                  }

                  if (mostrarAsistentes) {
                    return (
                      <View style={styles.listaAsistentes}>
                        <Text style={styles.listaTitle}>
                          <Ionicons name="checkmark-circle" size={14} color="#10B981" /> Asisten ({losQueVan.length})
                        </Text>
                        {losQueVan.map(a => (
                          <View key={a.id_dirigente} style={styles.dirigenteItemRow}>
                            <View style={[styles.avatarContainer, { backgroundColor: '#DCFCE7' }]}>
                              {a.foto ? <Image source={{ uri: a.foto }} style={styles.avatarImage} /> : <Ionicons name="person" size={12} color="#10B981" />}
                            </View>
                            <Text style={[styles.detailValueInline, { color: '#10B981' }]}>{a.nombre} {a.apellido}</Text>
                          </View>
                        ))}

                        <Text style={[styles.listaTitle, { marginTop: 12 }]}>
                          <Ionicons name="close-circle" size={14} color="#EF4444" /> No asisten ({losQueNoVan.length})
                        </Text>
                        {losQueNoVan.map(a => (
                          <View key={a.id_dirigente} style={styles.dirigenteItemRow}>
                            <View style={[styles.avatarContainer, { backgroundColor: '#FEE2E2' }]}>
                              {a.foto ? <Image source={{ uri: a.foto }} style={styles.avatarImage} /> : <Ionicons name="person" size={12} color="#EF4444" />}
                            </View>
                            <Text style={[styles.detailValueInline, { color: '#EF4444' }]}>{a.nombre} {a.apellido}</Text>
                          </View>
                        ))}

                        <Text style={[styles.listaTitle, { marginTop: 12 }]}>
                          <Ionicons name="help-circle" size={14} color="#94A3B8" /> Sin confirmar ({sinConfirmar.length})
                        </Text>
                        {sinConfirmar.map(d => (
                          <View key={d.id_dirigente} style={styles.dirigenteItemRow}>
                            <View style={[styles.avatarContainer, { backgroundColor: '#F1F5F9' }]}>
                              {d.foto ? <Image source={{ uri: d.foto }} style={styles.avatarImage} /> : <Ionicons name="person" size={12} color="#94A3B8" />}
                            </View>
                            <Text style={[styles.detailValueInline, { color: '#94A3B8' }]}>{d.nombre} {d.apellido}</Text>
                          </View>
                        ))}
                      </View>
                    );
                  }
                  return null;
                })()}
              </ScrollView>
            )}

            <TouchableOpacity style={styles.cerrarModalBtn} onPress={() => setModalDetalleVisible(false)}>
              <Text style={styles.cerrarModalText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ModalCalificacionAsamblea
        visible={!!asambleaACalificar}
        asamblea={asambleaACalificar}
        idDirigente={user.dirigente.id_dirigente}
        onClose={() => setAsambleaACalificar(null)}
        onCalificado={() => {
          fetchEventos();
          if (actividadSeleccionada && asambleaACalificar && actividadSeleccionada.id_asamblea === asambleaACalificar.id_asamblea) {
            cargarAsistentes(actividadSeleccionada);
          }
        }}
      />

      <Modal visible={modalActividadVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Nueva Actividad</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              <Text style={styles.inputLabel}>Título</Text>
              <TextInput
                style={styles.input}
                placeholder="Título de la actividad"
                placeholderTextColor="#999"
                value={nuevaActividad.titulo}
                onChangeText={(text) => setNuevaActividad({ ...nuevaActividad, titulo: text })}
              />

              <FechaPicker
                fechaObj={nuevaActividad.fechaObj}
                onFechaChange={(nuevaFecha) => setNuevaActividad({ ...nuevaActividad, fechaObj: nuevaFecha })}
              />

              <Text style={styles.inputLabel}>Responsable</Text>
              <View style={styles.inputDisabled}>
                <Text style={styles.inputDisabledText}>{nuevaActividad.responsable}</Text>
              </View>

              <Text style={styles.inputLabel}>Tipo</Text>
              <TouchableOpacity
                style={styles.inputTouchable}
                onPress={() => setModalTipoVisible(true)}
              >
                <Text style={{ color: nuevaActividad.tipo ? '#333' : '#999' }}>
                  {nuevaActividad.tipo || 'Seleccione Tipo'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#999" />
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Descripción</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Descripción (opcional)"
                placeholderTextColor="#999"
                multiline
                value={nuevaActividad.descripcion}
                onChangeText={(text) => setNuevaActividad({ ...nuevaActividad, descripcion: text })}
              />

              <View style={styles.verificarRow}>
                <Text style={styles.verificarLabel}>¿Verificar asistencia?</Text>
                <Switch
                  value={nuevaActividad.verificarAsistencia !== false}
                  onValueChange={(v) => setNuevaActividad({ ...nuevaActividad, verificarAsistencia: v })}
                  trackColor={{ false: '#CBD5E1', true: '#FFA726' }}
                  thumbColor="#FFF"
                  ios_backgroundColor="#CBD5E1"
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.btnModal, styles.btnCancelar]}
                onPress={() => setModalActividadVisible(false)}
              >
                <Text style={styles.btnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnModal, styles.btnGuardar]}
                onPress={handleGuardarActividad}
              >
                <Text style={styles.btnGuardarText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalTipoVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalTipoVisible(false)}>
          <View style={styles.tipoModalContent}>
            <Text style={styles.tipoModalTitle}>Selecciona un tipo</Text>
            {obtenerTiposPermitidos().map((opcion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.tipoOption}
                onPress={() => { setNuevaActividad({ ...nuevaActividad, tipo: opcion }); setModalTipoVisible(false); }}
              >
                <Text style={styles.tipoOptionText}>{opcion}</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#22335D',
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    margin: 10,
    marginTop: 40,
  },
  backBtn: {
    marginRight: 10,
    padding: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginRight: 24,
  },
  headerSpacer: {
    width: 0,
  },
  scrollContent: {
    flex: 1,
  },
  calendarContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE + 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  dayCellSelected: {
    backgroundColor: '#FFA726',
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: '#FFA726',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  dayTextDisabled: {
    color: '#ccc',
  },
  dayTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dayTextToday: {
    color: '#FFA726',
    fontWeight: 'bold',
  },
  eventsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 2,
    gap: 2,
  },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  legendScroll: {
    marginTop: 10,
    maxHeight: 36,
  },
  legendContent: {
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 10,
    color: '#666',
  },
  previewContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  previewTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#22335D',
  },
  previewDate: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  closePreviewBtn: {
    padding: 4,
  },
  noActivitiesContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  noPreviewText: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 6,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
    borderLeftWidth: 3,
  },
  previewCardContent: {
    flex: 1,
  },
  previewCardTitle: {
    fontWeight: '600',
    fontSize: 13,
    color: '#222',
  },
  previewCardSub: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  bottomSpacer: {
    height: 70,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 75,
    backgroundColor: '#FFA726',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 10,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#22335D',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalScroll: {
    maxHeight: 400,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888',
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  asambleaCardContainer: {
    marginTop: 14,
  },
  calificarBtn: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  calificarBtnCalificar: {
    backgroundColor: '#22335D',
  },
  calificarBtnVer: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  calificarBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  calificarBtnTextVer: {
    color: '#10B981',
  },
  asistenciaSection: {
    marginTop: 14,
  },
  verificarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  verificarLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  blockedText: {
    color: '#EF4444',
    fontSize: 11,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  asistenciaBotonesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  btnAsistencia: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 5,
  },
  btnAsistenciaSi: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  btnAsistenciaNo: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
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
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  textActivo: {
    color: '#FFFFFF',
  },
  listaAsistentes: {
    marginTop: 16,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    paddingTop: 12,
  },
  listaTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  dirigenteItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 6,
    borderRadius: 6,
    marginTop: 3,
  },
  avatarContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  detailValueInline: {
    fontSize: 13,
    fontWeight: '500',
  },
  cerrarModalBtn: {
    backgroundColor: '#22335D',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  cerrarModalText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
    fontSize: 14,
    color: '#333',
  },
  inputMultiline: {
    height: 70,
    textAlignVertical: 'top',
  },
  inputDisabled: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#F1F5F9',
  },
  inputDisabledText: {
    color: '#64748B',
    fontSize: 14,
  },
  inputTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  btnModal: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnCancelar: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  btnCancelarText: {
    color: '#64748B',
    fontWeight: 'bold',
    fontSize: 14,
  },
  btnGuardar: {
    backgroundColor: '#FFA726',
  },
  btnGuardarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tipoModalContent: {
    width: '75%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 10,
  },
  tipoModalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#22335D',
  },
  tipoOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center',
  },
  tipoOptionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});