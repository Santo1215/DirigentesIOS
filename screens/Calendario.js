import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  TouchableWithoutFeedback,
  TextInput,
  Alert,
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import DateTimePicker from '@react-native-community/datetimepicker';
import { API_URL } from '../api';
import { UserContext } from '../context/UserContext'; 
import SectionTitle from '../components/TituloSeccion';
import BottomNav from '../components/navbar';
import WaveBackground from '../components/WaveBackground';

// Configurar el calendario en español
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
  const [modalDetalleVisible, setModalDetalleVisible] = useState(false);
  const [actividadSeleccionada, setActividadSeleccionada] = useState(null);
  const [modalActividadVisible, setModalActividadVisible] = useState(false);
  const [actividadesFormateadas, setActividadesFormateadas] = useState({});
  
  // Nuevo estado para el menú desplegable del tipo de actividad
  const [modalTipoVisible, setModalTipoVisible] = useState(false);
  const opcionesTipo = ['Redes', 'Integración', 'Religioso', 'Reunión', 'Otro'];
  
  const abrirModalCrear = () => {
    const fechaBase = diaSeleccionado ? new Date(`${diaSeleccionado}T12:00:00`) : new Date();
    setNuevaActividad({
      titulo: '',
      descripcion: '',
      fechaObj: fechaBase,
      responsable: user?.dirigente ? `${user.dirigente.nombre} ${user.dirigente.apellido}` : '',
      tipo: user?.dirigente?.comite || 'Otro'
    });
    setModalActividadVisible(true);
  };

  const obtenerColorPorTipo = (tipo) => {
    switch (tipo?.toLowerCase()) {
      case 'redes':
        return '#FF9800'; // Naranja
      case 'reunión':
        return '#E50F0F'; // Rojo
      case 'religioso':
        return '#2196F3'; // Azul
      case 'integración':
        return '#4CAF50'; // Verde
      default:
        return '#9C27B0'; // Morado (Otro u otros comités)
    }
  };

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [nuevaActividad, setNuevaActividad] = useState({
    titulo: '',
    descripcion: '',
    fechaObj: new Date(), 
    responsable: user?.dirigente ? `${user.dirigente.nombre} ${user.dirigente.apellido}` : '', 
    tipo: user?.dirigente?.comite || 'Otro'     
  });

  // Cargar actividades desde la base de datos
  const fetchActividades = async () => {
    try {
      const response = await fetch(`${API_URL}/actividades`);
      const data = await response.json();
      
      const formatted = {};
      const arrayActividades = Array.isArray(data) ? data : (data.actividades || []);
      arrayActividades.forEach((act) => {
        
        const dateStr = String(act.fecha).substring(0, 10);
        if (!formatted[dateStr]) formatted[dateStr] = [];
        const colorAsignado = obtenerColorPorTipo(act.tipo);
        
        formatted[dateStr].push({ 
          key: act.id_actividad.toString(), 
          color: colorAsignado,
          ...act
        });
      });
      setActividadesFormateadas(formatted);
    } catch (error) {
      console.error('Error al cargar actividades:', error);
    }
  };

  useEffect(() => {
    fetchActividades();
  }, []);

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || nuevaActividad.fechaObj;
    setShowDatePicker(Platform.OS === 'ios'); // En iOS el picker se queda abierto, en Android se cierra solo
    setNuevaActividad({ ...nuevaActividad, fechaObj: currentDate });
  };

  const handleDayPress = (day) => {
    setDiaSeleccionado(day.dateString);
  };

  const handleGuardarActividad = async () => {
    if (!nuevaActividad.titulo) {
      Alert.alert('Error', 'El título es obligatorio');
      return;
    }

    const year = nuevaActividad.fechaObj.getFullYear();
    const month = String(nuevaActividad.fechaObj.getMonth() + 1).padStart(2, '0');
    const day = String(nuevaActividad.fechaObj.getDate()).padStart(2, '0');
    const fechaFormateada = `${year}-${month}-${day}`;

    const payload = {
      titulo: nuevaActividad.titulo,
      descripcion: nuevaActividad.descripcion,
      fecha: fechaFormateada,
      responsable: nuevaActividad.responsable,
      tipo: nuevaActividad.tipo
    };

    try {
      const response = await fetch(`${API_URL}/actividades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        Alert.alert('Éxito', 'Actividad guardada correctamente');
        setModalActividadVisible(false);
        fetchActividades(); 
      } else {
        Alert.alert('Error', 'Hubo un problema al guardar');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Error de red al guardar la actividad');
    }
  };

  return (
    <View style={styles.container}>
      <WaveBackground style={{ pointerEvents: 'none' }} />
      <SectionTitle title="Calendario" showBackButton={true} 
          onBackPress={() => navigation.goBack()} />
      
      {/* CALENDARIO MENSUAL */}
      <View style={styles.calendarContainer}>
        <Calendar
          markedDates={actividadesFormateadas}
          onDayPress={(day) => handleDayPress(day)}
          dayComponent={({ date, state }) => {
            const dayEvents = actividadesFormateadas[date.dateString] || [];
            return (
              <TouchableOpacity 
                style={styles.dayCell}
                onPress={() => handleDayPress(date)}
              >
                <Text style={{ 
                  textAlign: 'center', 
                  color: state === 'disabled' ? '#ccc' : '#222',
                  fontWeight: state === 'today' ? 'bold' : 'normal',
                }}>
                  {date.day}
                </Text>
                <View style={styles.eventsContainer}>
                  {dayEvents.map((ev, index) => (
                    <View key={index} style={[styles.eventPill, { backgroundColor: ev.color }]} />
                  ))}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <Modal
        visible={modalActividadVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalActividadVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#fff', width: '90%' }]}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' }}>
              Nueva Actividad
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Título de la actividad"
              value={nuevaActividad.titulo}
              onChangeText={(text) => setNuevaActividad({ ...nuevaActividad, titulo: text })}
            />

            {/* SECCIÓN DEL DATE PICKER */}
            <View style={styles.datePickerContainer}>
              <Text style={{ color: '#555', marginBottom: 5 }}>Fecha de la actividad:</Text>
              {Platform.OS === 'android' && (
                <TouchableOpacity 
                  style={[styles.input, { justifyContent: 'center' }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text>{nuevaActividad.fechaObj.toISOString().split('T')[0]}</Text>
                </TouchableOpacity>
              )}
              
              {(showDatePicker || Platform.OS === 'ios') && (
                <DateTimePicker
                  value={nuevaActividad.fechaObj}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onChangeDate}
                />
              )}
            </View>

            <Text style={{ color: '#555', marginBottom: 5 }}>Responsable:</Text>
            <TextInput
              style={[styles.input, { backgroundColor: '#e9ecef' }]}
              placeholder="Responsable"
              value={nuevaActividad.responsable}
              editable={false}
            />
            
            <Text style={{ color: '#555', marginBottom: 5 }}>Tipo de Actividad:</Text>
            <TouchableOpacity 
              style={[styles.input, { justifyContent: 'center', backgroundColor: rol === 'Coordinación' ? '#fff' : '#e9ecef' }]}
              onPress={() => {
                if (rol === 'Coordinación') {
                  setModalTipoVisible(true);
                }
              }}
              disabled={rol !== 'Coordinación'}
            >
              <Text style={{ color: nuevaActividad.tipo ? '#333' : '#888' }}>
                {nuevaActividad.tipo || 'Seleccione un tipo'}
              </Text>
            </TouchableOpacity>

            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Descripción"
              multiline
              value={nuevaActividad.descripcion}
              onChangeText={(text) => setNuevaActividad({ ...nuevaActividad, descripcion: text })}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: '#ccc' }]}
                onPress={() => setModalActividadVisible(false)}
              >
                <Text style={{ color: '#333', fontWeight: 'bold' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: '#FFA726' }]}
                onPress={handleGuardarActividad}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL DESPLEGABLE PARA EL TIPO DE ACTIVIDAD */}
      <Modal
        visible={modalTipoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalTipoVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setModalTipoVisible(false)}
        >
          <View style={[styles.modalContent, { width: '70%', padding: 10 }]}>
            {opcionesTipo.map((opcion, index) => (
              <TouchableOpacity
                key={index}
                style={{
                  paddingVertical: 15,
                  borderBottomWidth: index === opcionesTipo.length - 1 ? 0 : 1,
                  borderBottomColor: '#eee',
                  alignItems: 'center'
                }}
                onPress={() => {
                  setNuevaActividad({ ...nuevaActividad, tipo: opcion });
                  setModalTipoVisible(false);
                }}
              >
                <Text style={{ fontSize: 16, color: '#333' }}>{opcion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* LEYENDA INFERIOR DE CATEGORÍAS */}
      <View style={styles.legendContainer}>
        <View style={styles.legendColorBar}>
          <View style={[styles.colorSegment, { backgroundColor: '#E50F0F' }]} />
          <View style={[styles.colorSegment, { backgroundColor: '#2196F3' }]} />
          <View style={[styles.colorSegment, { backgroundColor: '#4CAF50' }]} />
          <View style={[styles.colorSegment, { backgroundColor: '#FF9800' }]} />
          <View style={[styles.colorSegment, { backgroundColor: '#9C27B0' }]} />
        </View>
        <View style={styles.legendLabels}>
          <Text style={styles.legendText}>Reunión</Text>
          <Text style={styles.legendText}>Religioso</Text>
          <Text style={styles.legendText}>Integración</Text>
          <Text style={styles.legendText}>Redes</Text>
          <Text style={styles.legendText}>Otro</Text>
        </View>
      </View>

      {(comite === 'Redes' || comite === 'Integración' ||comite === 'Religioso' || rol === 'Coordinación') && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={abrirModalCrear}
        > 
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      )}

      {/* VISTA PREVIA DE ACTIVIDADES DEL DÍA SELECCIONADO */}
      {diaSeleccionado && (
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>Actividades del {diaSeleccionado}</Text>
            <TouchableOpacity onPress={() => setDiaSeleccionado(null)}>
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {(!actividadesFormateadas[diaSeleccionado] || actividadesFormateadas[diaSeleccionado].length === 0) ? (
            <Text style={styles.noPreviewText}>No hay actividades para este día.</Text>
          ) : (
            actividadesFormateadas[diaSeleccionado].map((item) => (
              <TouchableOpacity 
                key={item.key} 
                style={[styles.previewCard, { borderLeftColor: item.color }]}
                onPress={() => {
                  setActividadSeleccionada(item);
                  setModalDetalleVisible(true);
                }}
              >
                <Text style={styles.previewCardTitle}>{item.titulo}</Text>
                <Text style={styles.previewCardSub} numberOfLines={1}>
                {item.tipo || 'N/A'}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {/* MODAL DE DETALLES DE LA ACTIVIDAD */}
      <Modal
        visible={modalDetalleVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalDetalleVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#fff', width: '90%', maxHeight: '80%' }]}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: '#333' }}>
              Detalles de la Actividad
            </Text>

            {actividadSeleccionada && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 15 }}>
                <Text style={styles.detailLabel}>Título:</Text>
                <Text style={styles.detailValue}>{actividadSeleccionada.titulo}</Text>

                <Text style={styles.detailLabel}>Fecha:</Text>
                <Text style={styles.detailValue}>{actividadSeleccionada.fecha?.substring(0, 10)}</Text>

                <Text style={styles.detailLabel}>Tipo / Comité:</Text>
                <Text style={styles.detailValue}>{actividadSeleccionada.tipo || 'N/A'}</Text>
                
                {/* SOLO COORDINACIÓN */}
                {rol === 'Coordinación' && (
                  <>
                    <Text style={styles.detailLabel}>Responsable:</Text>
                    <Text style={styles.detailValue}>{actividadSeleccionada.responsable || 'N/A'}</Text>
                  </>
                )}
                
                <Text style={styles.detailLabel}>Descripción:</Text>
                <Text style={styles.detailValue}>
                  {actividadSeleccionada.descripcion || 'Sin descripción registrada.'}
                </Text>
              </ScrollView>
            )}

            <TouchableOpacity 
              style={{ 
                backgroundColor: '#FFA726', 
                padding: 15, 
                borderRadius: 8, 
                alignItems: 'center', 
                marginTop: 5,
                width: '100%'
              }}
              onPress={() => setModalDetalleVisible(false)}
            >
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>
                Cerrar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BottomNav navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6f8', paddingTop: 50 },
  topHeader: { paddingHorizontal: 20, marginBottom: 10, zIndex: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 25, paddingHorizontal: 15, paddingVertical: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  searchText: { marginLeft: 10, color: '#888', fontSize: 16 },
  headerIcon: { marginLeft: 15 },
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
  datePickerContainer: { marginBottom: 10 },
  radioRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#777', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFA726' },
  radioLabel: { fontSize: 16, color: '#333' },
  modalDivider: { height: 1, backgroundColor: '#e0d4c8', marginVertical: 15 },
  sliderMockup: { paddingVertical: 10 },
  sliderTimeText: { fontSize: 12, color: '#555', marginBottom: 5 },
  sliderBarContainer: { justifyContent: 'center', height: 20 },
  sliderLine: { height: 4, backgroundColor: '#d8caba', borderRadius: 2 },
  sliderKnob: { position: 'absolute', left: '30%', width: 14, height: 14, borderRadius: 7, backgroundColor: '#FFA726' },
  sliderDaysText: { fontSize: 12, color: '#555', textAlign: 'right', marginTop: 5 },
  
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    backgroundColor: '#fafafa'
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5
  },
  previewContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 12,
    padding: 15,
    maxHeight: 180,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  noPreviewText: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 10,
  },
  previewCard: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
    borderLeftWidth: 4,
  },
  previewCardTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#222',
  },
  previewCardSub: {
    fontSize: 12,
    color: '#666',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#888',
    marginTop: 8,
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 6,
    marginTop: 2,
  },
});