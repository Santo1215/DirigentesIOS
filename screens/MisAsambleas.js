import React, { useState, useEffect, useContext } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Modal, 
  TextInput, Alert, ScrollView, Image 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../api';
import { UserContext } from '../context/UserContext'; 
import SectionTitle from '../components/TituloSeccion';
import BottomNav from '../components/navbar';
import WaveBackground from '../components/WaveBackground';
// Asegúrate de que esta ruta coincida con la ubicación de tu archivo ModalProximamente
import ModalProximamente from '../components/ModalProximamente'; 

export default function MisAsambleas({ navigation }) {
  const { user } = useContext(UserContext);
  
  // Estados principales
  const [asambleas, setAsambleas] = useState([]);
  const [dirigentes, setDirigentes] = useState([]);
  const [materialesDB, setMaterialesDB] = useState([]);
  
  // Estados para Modales
  const [modalVisible, setModalVisible] = useState(false);
  const [modalDirigentesVisible, setModalDirigentesVisible] = useState(false);
  const [modalOtrosEncargadosVisible, setModalOtrosEncargadosVisible] = useState(false);
  const [modalProximamenteVisible, setModalProximamenteVisible] = useState(false);
  const [campoSeleccion, setCampoSeleccion] = useState('');

  // Estados del Formulario
  const [nuevaAsamblea, setNuevaAsamblea] = useState({
    titulo: '',
    encargadoPitar: null, 
    encargadoTiempo: null,
    otrosEncargados: [], 
  });

  // Estados para Checklist de Materiales
  const [materialesSeleccionados, setMaterialesSeleccionados] = useState({});
  const [opcionOtroActiva, setOpcionOtroActiva] = useState(false);
  const [textoOtroMaterial, setTextoOtroMaterial] = useState('');

  // Cargar datos de la BD al iniciar
  useEffect(() => {
    cargarDirigentes();
    cargarMateriales();
  }, []);

  const cargarDirigentes = async () => {
    try {
      const response = await fetch(`${API_URL}/dirigentes`);
      if (response.ok) {
        const data = await response.json();
        
        // FILTRO: Excluir al usuario que está creando la asamblea
        const idUsuarioActual = user?.dirigente?.id_dirigente || user?.dirigente?.id;
        const dirigentesDisponibles = data.filter(d => {
          const idD = d.id_dirigente || d.id;
          return idD !== idUsuarioActual;
        });
        
        setDirigentes(dirigentesDisponibles);
      }
    } catch (error) { console.error('Error cargando dirigentes:', error); }
  };

  const cargarMateriales = async () => {
    try {
      const response = await fetch(`${API_URL}/materiales`);
      if (response.ok) setMaterialesDB(await response.json());
    } catch (error) { console.error('Error cargando materiales:', error); }
  };

  // --- Lógica del Checklist de Materiales ---
  const toggleMaterial = (id, nombreMaterial) => {
    setMaterialesSeleccionados(prev => {
      const nuevoEstado = { ...prev };
      if (nuevoEstado[id]) {
        delete nuevoEstado[id]; 
      } else {
        nuevoEstado[id] = { nombre: nombreMaterial, cantidad: 1 };
      }
      return nuevoEstado;
    });
  };

  const incrementarCantidad = (id) => {
    setMaterialesSeleccionados(prev => ({
      ...prev, [id]: { ...prev[id], cantidad: prev[id].cantidad + 1 }
    }));
  };

  const decrementarCantidad = (id) => {
    setMaterialesSeleccionados(prev => {
      const cantidadActual = prev[id].cantidad;
      if (cantidadActual <= 1) return prev; 
      return { ...prev, [id]: { ...prev[id], cantidad: cantidadActual - 1 } };
    });
  };

  // --- Lógica de Selección Múltiple de Otros Encargados ---
  const toggleOtroEncargado = (dirigente) => {
    setNuevaAsamblea(prev => {
      const idDirigente = dirigente.id_dirigente || dirigente.id;
      const existe = prev.otrosEncargados.find(d => (d.id_dirigente || d.id) === idDirigente);
      
      if (existe) {
        return { 
          ...prev, 
          otrosEncargados: prev.otrosEncargados.filter(d => (d.id_dirigente || d.id) !== idDirigente) 
        };
      } else {
        return { 
          ...prev, 
          otrosEncargados: [...prev.otrosEncargados, dirigente] 
        };
      }
    });
  };

  const abrirModal = () => {
    setNuevaAsamblea({ 
      titulo: '', encargadoPitar: null, encargadoTiempo: null, otrosEncargados: [] 
    });
    setMaterialesSeleccionados({});
    setOpcionOtroActiva(false);
    setTextoOtroMaterial('');
    setModalVisible(true);
  };

  const abrirSeleccionDirigente = (campo) => {
    setCampoSeleccion(campo);
    setModalDirigentesVisible(true);
  };

  const seleccionarDirigente = (dirigente) => {
    setNuevaAsamblea({ ...nuevaAsamblea, [campoSeleccion]: dirigente });
    setModalDirigentesVisible(false);
  };

  const guardarAsamblea = () => {
    if (!nuevaAsamblea.titulo.trim()) {
      Alert.alert('Error', 'El título es obligatorio');
      return;
    }

    // ACCIÓN GUARDAR: Cierra este modal y abre el de Próximamente
    setModalVisible(false);
    setModalProximamenteVisible(true);
  };

  const eliminarAsamblea = (id) => {
    setAsambleas(asambleas.filter(a => a.id !== id));
  };

  const dirigentesMostrar = campoSeleccion === 'encargadoPitar'
    ? dirigentes.filter(d => {
        const rol = (d.rol || d.cargo || d.tipo || '').toLowerCase();
        return rol.includes('nombrado') || rol.includes('coordinación') || rol.includes('coordinacion');
      })
    : dirigentes;

  return (
    <View style={styles.container}>
      <WaveBackground style={{ pointerEvents: 'none' }} />
      <SectionTitle title="Mi Asamblea" showBackButton={true} onBackPress={() => navigation.goBack()} />
      
      {/* SECCION MIS ASAMBLEAS */}
      <View style={styles.listaContainer}>
        <Text style={styles.tituloSeccion}>Mis asambleas</Text>
        
        {asambleas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No hay asambleas registradas</Text>
            <Text style={styles.emptySubtext}>Presiona el botón + para agregar una nueva asamblea</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {asambleas.map((asamblea) => (
              <View key={asamblea.id} style={styles.asambleaCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{asamblea.titulo}</Text>
                  <TouchableOpacity onPress={() => eliminarAsamblea(asamblea.id)}>
                    <Ionicons name="trash-outline" size={20} color="#E50F0F" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.cardRow}>
                  <Ionicons name="person-outline" size={18} color="#666" />
                  <Text style={styles.cardLabel}>Dirigente:</Text>
                  <Text style={styles.cardValue}>{asamblea.dirigente}</Text>
                </View>
                
                <View style={styles.cardRow}>
                  <Ionicons name="time-outline" size={18} color="#666" />
                  <Text style={styles.cardLabel}>Pitar/Tiempo:</Text>
                  <Text style={styles.cardValue}>{asamblea.encargadoPitar || 'No asignado'} / {asamblea.encargadoTiempo || 'No asignado'}</Text>
                </View>

                <View style={styles.cardRow}>
                  <Ionicons name="people-outline" size={18} color="#666" />
                  <Text style={styles.cardLabel}>Otros Enc.:</Text>
                  <Text style={styles.cardValue} numberOfLines={2}>
                    {asamblea.otrosEncargados || 'Ninguno'}
                  </Text>
                </View>
                
                <View style={[styles.cardRow, { alignItems: 'flex-start', marginTop: 4 }]}>
                  <Ionicons name="cube-outline" size={18} color="#666" style={{ marginTop: 2 }} />
                  <Text style={styles.cardLabel}>Materiales:</Text>
                </View>
                <Text style={styles.cardMateriales}>{asamblea.materiales || 'Sin materiales especificados'}</Text>
                
                <View style={styles.cardFooter}>
                  <Text style={styles.cardDate}>📅 {asamblea.fecha}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* BOTON FLOTANTE */}
      <TouchableOpacity style={styles.fab} onPress={abrirModal}> 
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* MODAL CREAR ASAMBLEA */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#fff', width: '90%', maxHeight: '90%' }]}>
            <Text style={styles.modalTitle}>Nueva Asamblea</Text>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              
              <Text style={styles.label}>Título de la asamblea:</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Asamblea del mejor amigo"
                value={nuevaAsamblea.titulo}
                onChangeText={(text) => setNuevaAsamblea({ ...nuevaAsamblea, titulo: text })}
              />

              {/* SECCIÓN OTROS ENCARGADOS */}
              <Text style={styles.label}>Otros encargados de la asamblea (Selección múltiple):</Text>
              <TouchableOpacity 
                style={styles.selectorEncargado} 
                onPress={() => setModalOtrosEncargadosVisible(true)}
              >
                {nuevaAsamblea.otrosEncargados.length > 0 ? (
                  <Text style={{ color: '#333', flex: 1 }} numberOfLines={1}>
                    {nuevaAsamblea.otrosEncargados.map(d => d.nombre).join(', ')}
                  </Text>
                ) : (
                  <Text style={{ color: '#999' }}>Seleccionar otros...</Text>
                )}
                <Ionicons name="people" size={20} color="#999" />
              </TouchableOpacity>

              <Text style={styles.label}>Encargado de pitar (Solo Nombrados/Coord.):</Text>
              <TouchableOpacity style={styles.selectorEncargado} onPress={() => abrirSeleccionDirigente('encargadoPitar')}>
                {nuevaAsamblea.encargadoPitar ? (
                  <View style={styles.encargadoSeleccionadoRow}>
                    <View style={styles.avatarMini}>
                      {nuevaAsamblea.encargadoPitar.foto ? (
                        <Image source={{ uri: nuevaAsamblea.encargadoPitar.foto }} style={styles.avatarImageMini} />
                      ) : (<Ionicons name="person" size={12} color="#666" />)}
                    </View>
                    <Text style={{ color: '#333' }}>{nuevaAsamblea.encargadoPitar.nombre} {nuevaAsamblea.encargadoPitar.apellido}</Text>
                  </View>
                ) : (<Text style={{ color: '#999' }}>Seleccionar dirigente...</Text>)}
                <Ionicons name="chevron-down" size={20} color="#999" />
              </TouchableOpacity>

              <Text style={styles.label}>Encargado de llevar el tiempo:</Text>
              <TouchableOpacity style={styles.selectorEncargado} onPress={() => abrirSeleccionDirigente('encargadoTiempo')}>
                {nuevaAsamblea.encargadoTiempo ? (
                  <View style={styles.encargadoSeleccionadoRow}>
                    <View style={styles.avatarMini}>
                      {nuevaAsamblea.encargadoTiempo.foto ? (
                        <Image source={{ uri: nuevaAsamblea.encargadoTiempo.foto }} style={styles.avatarImageMini} />
                      ) : (<Ionicons name="person" size={12} color="#666" />)}
                    </View>
                    <Text style={{ color: '#333' }}>{nuevaAsamblea.encargadoTiempo.nombre} {nuevaAsamblea.encargadoTiempo.apellido}</Text>
                  </View>
                ) : (<Text style={{ color: '#999' }}>Seleccionar dirigente...</Text>)}
                <Ionicons name="chevron-down" size={20} color="#999" />
              </TouchableOpacity>

              {/* SECCIÓN DE MATERIALES (CHECKLIST) */}
              <Text style={[styles.label, { marginTop: 10, borderTopWidth: 1, paddingTop: 10, borderColor: '#eee' }]}>Materiales necesarios:</Text>
              
              <View style={styles.checklistContainer}>
                {materialesDB.map((mat) => {
                  const itemId = mat.id_material || mat.id; 
                  const nombreMaterial = mat.nombre || mat.nombre_material || mat.descripcion || 'Material sin nombre';
                  const isChecked = !!materialesSeleccionados[itemId];

                  return (
                    <View key={itemId} style={styles.checkItemRow}>
                      <TouchableOpacity style={styles.checkboxTouch} onPress={() => toggleMaterial(itemId, nombreMaterial)}>
                        <Ionicons name={isChecked ? "checkbox" : "square-outline"} size={24} color={isChecked ? "#FFA726" : "#aaa"} />
                        <Text style={styles.checkItemText}>{nombreMaterial}</Text>
                      </TouchableOpacity>
                      
                      {isChecked && (
                        <View style={styles.stepperContainer}>
                          <TouchableOpacity style={styles.stepperBtn} onPress={() => decrementarCantidad(itemId)}>
                            <Ionicons name="remove" size={16} color="#555" />
                          </TouchableOpacity>
                          <Text style={styles.stepperValue}>{materialesSeleccionados[itemId].cantidad}</Text>
                          <TouchableOpacity style={styles.stepperBtn} onPress={() => incrementarCantidad(itemId)}>
                            <Ionicons name="add" size={16} color="#555" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}

                <View style={styles.checkItemRow}>
                  <TouchableOpacity style={styles.checkboxTouch} onPress={() => setOpcionOtroActiva(!opcionOtroActiva)}>
                    <Ionicons name={opcionOtroActiva ? "checkbox" : "square-outline"} size={24} color={opcionOtroActiva ? "#FFA726" : "#aaa"} />
                    <Text style={[styles.checkItemText, { fontWeight: 'bold' }]}>Otro / Por Comprar</Text>
                  </TouchableOpacity>
                </View>

                {opcionOtroActiva && (
                  <TextInput
                    style={[styles.input, styles.textArea, { marginTop: 8 }]}
                    placeholder="Especifique los materiales a comprar..."
                    multiline
                    numberOfLines={3}
                    value={textoOtroMaterial}
                    onChangeText={setTextoOtroMaterial}
                  />
                )}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.button, { backgroundColor: '#ccc' }]} onPress={() => setModalVisible(false)}>
                  <Text style={{ color: '#333', fontWeight: 'bold' }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, { backgroundColor: '#FFA726' }]} onPress={guardarAsamblea}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Guardar</Text>
                </TouchableOpacity>
              </View>

            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* SUB-MODAL SELECCIONAR DIRIGENTE (Único) */}
      <Modal visible={modalDirigentesVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: '85%', maxHeight: '70%', padding: 15 }]}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 5, textAlign: 'center' }}>Seleccionar Dirigente</Text>
            {campoSeleccion === 'encargadoPitar' && (
               <Text style={{ fontSize: 12, color: '#888', textAlign: 'center', marginBottom: 15 }}>*Solo Nombrado o Coordinación</Text>
            )}
            <ScrollView showsVerticalScrollIndicator={false}>
              {dirigentesMostrar.length === 0 ? (
                <Text style={{ textAlign: 'center', color: '#999', marginTop: 20 }}>No hay dirigentes disponibles.</Text>
              ) : (
                dirigentesMostrar.map(d => (
                  <TouchableOpacity key={d.id_dirigente || d.id} style={styles.dirigenteOptionRow} onPress={() => seleccionarDirigente(d)}>
                    <View style={styles.avatarList}>
                      {d.foto ? (<Image source={{ uri: d.foto }} style={styles.avatarImage} />) : (<Ionicons name="person" size={20} color="#666" />)}
                    </View>
                    <View>
                      <Text style={styles.dirigenteOptionText}>{d.nombre} {d.apellido}</Text>
                      <Text style={{ fontSize: 12, color: '#888' }}>{d.rol || d.cargo || 'Sin cargo'}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <TouchableOpacity style={{ padding: 12, backgroundColor: '#eee', borderRadius: 8, marginTop: 10, alignItems: 'center' }} onPress={() => setModalDirigentesVisible(false)}>
              <Text style={{ fontWeight: 'bold', color: '#555' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* SUB-MODAL SELECCION MULTIPLE (Otros Encargados) */}
      <Modal visible={modalOtrosEncargadosVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: '90%', maxHeight: '75%', padding: 15 }]}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' }}>
              Seleccionar Otros Encargados
            </Text>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {dirigentes.map(d => {
                const idDirigente = d.id_dirigente || d.id;
                const isChecked = nuevaAsamblea.otrosEncargados.some(enc => (enc.id_dirigente || enc.id) === idDirigente);

                return (
                  <TouchableOpacity 
                    key={idDirigente} 
                    style={styles.dirigenteOptionRow} 
                    onPress={() => toggleOtroEncargado(d)}
                  >
                    <Ionicons 
                      name={isChecked ? "checkbox" : "square-outline"} 
                      size={24} 
                      color={isChecked ? "#FFA726" : "#aaa"} 
                      style={{ marginRight: 10 }}
                    />
                    <View style={styles.avatarList}>
                      {d.foto ? (
                        <Image source={{ uri: d.foto }} style={styles.avatarImage} />
                      ) : (
                        <Ionicons name="person" size={20} color="#666" />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dirigenteOptionText}>{d.nombre} {d.apellido}</Text>
                      <Text style={{ fontSize: 12, color: '#888' }}>{d.rol || d.cargo || 'Sin cargo'}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity 
              style={{ padding: 12, backgroundColor: '#FFA726', borderRadius: 8, marginTop: 10, alignItems: 'center' }} 
              onPress={() => setModalOtrosEncargadosVisible(false)}
            >
              <Text style={{ fontWeight: 'bold', color: '#fff' }}>Confirmar Selección</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL PRÓXIMAMENTE */}
      <ModalProximamente 
        visible={modalProximamenteVisible} 
        onClose={() => setModalProximamenteVisible(false)} 
      />

      <BottomNav navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6f8', paddingTop: 50 },
  listaContainer: { flex: 1, paddingHorizontal: 15 },
  tituloSeccion: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15, marginTop: 10 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, color: '#666', marginTop: 15, fontWeight: '500' },
  emptySubtext: { fontSize: 14, color: '#999', marginTop: 5, textAlign: 'center' },
  
  asambleaCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  cardLabel: { fontSize: 14, color: '#666', marginLeft: 8, fontWeight: '500' },
  cardValue: { fontSize: 14, color: '#333', marginLeft: 5, flex: 1 },
  cardMateriales: { fontSize: 14, color: '#333', marginLeft: 26, marginBottom: 8, fontStyle: 'italic' },
  cardFooter: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  cardDate: { fontSize: 12, color: '#888' },
  
  fab: { position: 'absolute', right: 20, bottom: 100, backgroundColor: '#FFA726', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fef1e6', borderRadius: 16, padding: 20, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: '#333' },
  label: { color: '#555', marginBottom: 5, fontSize: 14, fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 15, backgroundColor: '#fafafa', fontSize: 14 },
  textArea: { height: 80, textAlignVertical: 'top' },
  
  button: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },

  selectorEncargado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 15, backgroundColor: '#fafafa' },
  encargadoSeleccionadoRow: { flexDirection: 'row', alignItems: 'center' },
  avatarMini: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#ddd', alignItems: 'center', justifyContent: 'center', marginRight: 8, overflow: 'hidden' },
  avatarImageMini: { width: '100%', height: '100%', resizeMode: 'cover' },
  
  dirigenteOptionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  avatarList: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ddd', alignItems: 'center', justifyContent: 'center', marginRight: 15, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  dirigenteOptionText: { fontSize: 16, color: '#333' },

  checklistContainer: { backgroundColor: '#fff', borderRadius: 8, padding: 10, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
  checkItemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  checkboxTouch: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  checkItemText: { marginLeft: 10, fontSize: 15, color: '#333', flex: 1 },
  
  stepperContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fafafa', borderRadius: 6, borderWidth: 1, borderColor: '#ddd' },
  stepperBtn: { padding: 5, backgroundColor: '#eee', borderRadius: 4 },
  stepperValue: { fontSize: 15, fontWeight: 'bold', width: 30, textAlign: 'center', color: '#333' },
});