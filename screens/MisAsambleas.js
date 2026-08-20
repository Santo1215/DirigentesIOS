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
import FechaPicker from '../components/FechaPicker';
import ModalProximamente from '../components/ModalProximamente'; 

export default function MisAsambleas({ navigation }) {
  const { user } = useContext(UserContext);
  
  const idUsuarioActual = user?.dirigente?.id_dirigente || user?.dirigente?.id || 1;
  const nombreUsuarioActual = user?.dirigente ? `${user.dirigente.nombre} ${user.dirigente.apellido}` : 'Alan Turing';

  // Mock data actualizado con nombres de pioneros de la computación
  const [asambleas, setAsambleas] = useState([
    {
      id: 1,
      titulo: 'Asamblea General de Inicio de semestre',
      creadorId: idUsuarioActual, // Creada por mí (Alan Turing)
      dirigente: nombreUsuarioActual,
      encargadoPitar: 'Ada Lovelace',
      encargadoTiempo: 'Grace Hopper',
      otrosEncargados: 'Linus Torvalds, Margaret Hamilton',
      materiales: 'Campana (1), Cronómetro (1)',
      fecha: '2026-08-22',
      descripcion: 'Asamblea para presentar a los nuevos dirigentes, constará de 6 bases dinamicas y principalmente de juegos para atraer más gente nueva.'
    },
    {
      id: 2,
      titulo: 'Asamblea del Mejor Amigo',
      creadorId: 999, // Creada por otro usuario (Steve Jobs)
      dirigente: 'Steve Jobs',
      encargadoPitar: 'Steve Wozniak',
      encargadoTiempo: 'Bill Gates',
      otrosEncargados: 'Tim Berners-Lee',
      materiales: 'Proyector (1)',
      fecha: '2026-08-25',
      descripcion: 'Presentación de prototipos visuales.'
    },
    {
      id: 3,
      titulo: 'Precampamento',
      creadorId: idUsuarioActual, // Creada por mí
      dirigente: nombreUsuarioActual,
      encargadoPitar: 'Margaret Hamilton',
      encargadoTiempo: nombreUsuarioActual,
      otrosEncargados: 'Ninguno',
      materiales: 'Megáfono (1), Hojas de registro (50)',
      fecha: '2026-09-02',
      descripcion: 'Este precampamento tiene como finalidad introducir a los chicos al campamento dandoles los fundamentos de esta.'
    }
  ]);

  const [dirigentes, setDirigentes] = useState([]);
  const [materialesDB, setMaterialesDB] = useState([]);
  
  // Estados para Modales
  const [modalVisible, setModalVisible] = useState(false);
  const [modalDirigentesVisible, setModalDirigentesVisible] = useState(false);
  const [modalOtrosEncargadosVisible, setModalOtrosEncargadosVisible] = useState(false);
  const [modalProximamenteVisible, setModalProximamenteVisible] = useState(false);
  const [campoSeleccion, setCampoSeleccion] = useState('');

  // Control de modo Edición
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idAsambleaEditando, setIdAsambleaEditando] = useState(null);

  // Estados del Formulario
  const [nuevaAsamblea, setNuevaAsamblea] = useState({
    titulo: '',
    encargadoPitar: null, 
    encargadoTiempo: null,
    otrosEncargados: [],
    fecha: new Date(),
    descripcion: ''
  });

  // Estados para Checklist de Materiales
  const [materialesSeleccionados, setMaterialesSeleccionados] = useState({});
  const [opcionOtroActiva, setOpcionOtroActiva] = useState(false);
  const [textoOtroMaterial, setTextoOtroMaterial] = useState('');

  useEffect(() => {
    cargarDirigentes();
    cargarMateriales();
  }, []);

  const cargarDirigentes = async () => {
    try {
      const response = await fetch(`${API_URL}/dirigentes`);
      if (response.ok) {
        const data = await response.json();
        const dirigentesDisponibles = data.filter(d => {
          const idD = d.id_dirigente || d.id;
          return idD !== idUsuarioActual;
        });
        setDirigentes(dirigentesDisponibles);
      }
    } catch (error) { 
      // Mock de respaldo por si falla la API
      setDirigentes([
        { id: 101, nombre: 'Ada', apellido: 'Lovelace', rol: 'Nombrado' },
        { id: 102, nombre: 'Grace', apellido: 'Hopper', rol: 'Coordinación' },
        { id: 103, nombre: 'Linus', apellido: 'Torvalds', rol: 'Colaborador' },
        { id: 104, nombre: 'Margaret', apellido: 'Hamilton', rol: 'Nombrado' }
      ]);
    }
  };

  const cargarMateriales = async () => {
    try {
      const response = await fetch(`${API_URL}/materiales`);
      if (response.ok) setMaterialesDB(await response.json());
    } catch (error) { 
      // Mock de respaldo para materiales
      setMaterialesDB([
        { id_material: 1, nombre_material: 'Campana' },
        { id_material: 2, nombre_material: 'Cronómetro' },
        { id_material: 3, nombre_material: 'Proyector' },
        { id_material: 4, nombre_material: 'Megáfono' }
      ]);
    }
  };

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

  const abrirModalCrear = () => {
    setModoEdicion(false);
    setIdAsambleaEditando(null);
    setNuevaAsamblea({ 
      titulo: '', encargadoPitar: null, encargadoTiempo: null, otrosEncargados: [], fecha: new Date(), descripcion: '' 
    });
    setMaterialesSeleccionados({});
    setOpcionOtroActiva(false);
    setTextoOtroMaterial('');
    setModalVisible(true);
  };

  const abrirModalEditar = (asamblea) => {
    setModoEdicion(true);
    setIdAsambleaEditando(asamblea.id);
    setNuevaAsamblea({
      titulo: asamblea.titulo,
      encargadoPitar: null, // Podría mapearse si se guardan objetos completos
      encargadoTiempo: null,
      otrosEncargados: [],
      fecha: new Date(asamblea.fecha),
      descripcion: asamblea.descripcion || ''
    });
    setMaterialesSeleccionados({});
    setOpcionOtroActiva(false);
    setTextoOtroMaterial(asamblea.materiales);
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

    const fObj = nuevaAsamblea.fecha instanceof Date ? nuevaAsamblea.fecha : new Date();
    const fechaStr = fObj.toISOString().split('T')[0];

    let listaMats = Object.values(materialesSeleccionados).map(m => `${m.nombre} (${m.cantidad})`).join(', ');
    if (opcionOtroActiva && textoOtroMaterial.trim()) {
      listaMats += listaMats ? `, ${textoOtroMaterial}` : textoOtroMaterial;
    }

    if (modoEdicion) {
      // Actualizar asamblea existente
      setAsambleas(prev => prev.map(a => {
        if (a.id === idAsambleaEditando) {
          return {
            ...a,
            titulo: nuevaAsamblea.titulo,
            encargadoPitar: nuevaAsamblea.encargadoPitar ? `${nuevaAsamblea.encargadoPitar.nombre} ${nuevaAsamblea.encargadoPitar.apellido}` : a.encargadoPitar,
            encargadoTiempo: nuevaAsamblea.encargadoTiempo ? `${nuevaAsamblea.encargadoTiempo.nombre} ${nuevaAsamblea.encargadoTiempo.apellido}` : a.encargadoTiempo,
            otrosEncargados: nuevaAsamblea.otrosEncargados.length > 0 ? nuevaAsamblea.otrosEncargados.map(d => d.nombre).join(', ') : a.otrosEncargados,
            materiales: listaMats || a.materiales,
            fecha: fechaStr,
            descripcion: nuevaAsamblea.descripcion
          };
        }
        return a;
      }).sort((a, b) => new Date(a.fecha) - new Date(b.fecha)));
    } else {
      // Crear nueva asamblea
      const nuevaCreada = {
        id: Date.now(),
        titulo: nuevaAsamblea.titulo,
        creadorId: idUsuarioActual,
        dirigente: nombreUsuarioActual,
        encargadoPitar: nuevaAsamblea.encargadoPitar ? `${nuevaAsamblea.encargadoPitar.nombre} ${nuevaAsamblea.encargadoPitar.apellido}` : 'No asignado',
        encargadoTiempo: nuevaAsamblea.encargadoTiempo ? `${nuevaAsamblea.encargadoTiempo.nombre} ${nuevaAsamblea.encargadoTiempo.apellido}` : 'No asignado',
        otrosEncargados: nuevaAsamblea.otrosEncargados.length > 0 ? nuevaAsamblea.otrosEncargados.map(d => d.nombre).join(', ') : 'Ninguno',
        materiales: listaMats || 'Sin materiales especificados',
        fecha: fechaStr,
        descripcion: nuevaAsamblea.descripcion
      };

      setAsambleas(prev => [...prev, nuevaCreada].sort((a, b) => new Date(a.fecha) - new Date(b.fecha)));
    }

    setModalVisible(false);
    setModalProximamenteVisible(true);
  };

  const eliminarAsamblea = (id) => {
    Alert.alert(
      "Eliminar Asamblea",
      "¿Estás seguro de que deseas eliminar esta asamblea?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: () => setAsambleas(asambleas.filter(a => a.id !== id)) }
      ]
    );
  };

  const dirigentesMostrar = campoSeleccion === 'encargadoPitar'
    ? dirigentes.filter(d => {
        const rol = (d.rol || d.cargo || d.tipo || '').toLowerCase();
        return rol.includes('nombrado') || rol.includes('coordinación') || rol.includes('coordinacion');
      })
    : dirigentes;

  const asambleasOrdenadas = [...asambleas].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  return (
    <View style={styles.container}>
      <WaveBackground style={{ pointerEvents: 'none' }} />
      <SectionTitle title="Asambleas" showBackButton={true} onBackPress={() => navigation.goBack()} />
      
      <View style={styles.listaContainer}>
        <Text style={styles.tituloSeccion}>Listado de Asambleas</Text>
        
        {asambleasOrdenadas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No hay asambleas registradas</Text>
            <Text style={styles.emptySubtext}>Presiona el botón + para agregar una nueva asamblea</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {asambleasOrdenadas.map((asamblea) => {
              const esMía = asamblea.creadorId === idUsuarioActual;

              return (
                <View 
                  key={asamblea.id} 
                  style={[styles.asambleaCard, esMía && styles.asambleaCardMia]}
                >
                  {esMía && (
                    <View style={styles.badgeMia}>
                      <Text style={styles.badgeMiaText}>🌟 Tu Asamblea</Text>
                    </View>
                  )}

                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{asamblea.titulo}</Text>
                    
                    {/* Botones de acción visibles SOLO si es tu asamblea */}
                    {esMía && (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity style={{ marginRight: 12 }} onPress={() => abrirModalEditar(asamblea)}>
                          <Ionicons name="pencil-outline" size={20} color="#FFA726" />
                        </TouchableOpacity> 
                        <TouchableOpacity onPress={() => eliminarAsamblea(asamblea.id)}>
                          <Ionicons name="trash-outline" size={20} color="#E50F0F" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.cardRow}>
                    <Ionicons name="person-outline" size={18} color="#666" />
                    <Text style={styles.cardLabel}>Organiza:</Text>
                    <Text style={styles.cardValue}>{asamblea.dirigente}</Text>
                  </View>
                  
                  <View style={styles.cardRow}>
                    <Ionicons name="time-outline" size={18} color="#666" />
                    <Text style={styles.cardLabel}>Pitar/Tiempo:</Text>
                    <Text style={styles.cardValue}>{asamblea.encargadoPitar} / {asamblea.encargadoTiempo}</Text>
                  </View>

                  <View style={styles.cardRow}>
                    <Ionicons name="people-outline" size={18} color="#666" />
                    <Text style={styles.cardLabel}>Otros Enc.:</Text>
                    <Text style={styles.cardValue} numberOfLines={2}>
                      {asamblea.otrosEncargados}
                    </Text>
                  </View>
                  
                  <View style={[styles.cardRow, { alignItems: 'flex-start', marginTop: 4 }]}>
                    <Ionicons name="cube-outline" size={18} color="#666" style={{ marginTop: 2 }} />
                    <Text style={styles.cardLabel}>Materiales:</Text>
                  </View>
                  <Text style={styles.cardMateriales}>{asamblea.materiales}</Text>
                  
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardDate}>📅 {asamblea.fecha}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>

      <TouchableOpacity style={styles.fab} onPress={abrirModalCrear}> 
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* MODAL CREAR / EDITAR ASAMBLEA */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#fff', width: '90%', maxHeight: '90%' }]}>
            <Text style={styles.modalTitle}>{modoEdicion ? 'Editar Asamblea' : 'Nueva Asamblea'}</Text>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              
              <Text style={styles.label}>Título de la asamblea:</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Asamblea de Algoritmos"
                value={nuevaAsamblea.titulo}
                onChangeText={(text) => setNuevaAsamblea({ ...nuevaAsamblea, titulo: text })}
              />

              <Text style={styles.label}>Otros encargados (Selección múltiple):</Text>
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

              <FechaPicker fechaObj={nuevaAsamblea.fecha} onFechaChange={(fecha) => setNuevaAsamblea({ ...nuevaAsamblea, fecha })} />
              
              <Text style={styles.label}>Descripción:</Text>  
              <TextInput
                style={[styles.input, styles.textArea, { marginTop: 8 }]}
                placeholder="Especifique detalles..."
                multiline
                numberOfLines={3}
                value={nuevaAsamblea.descripcion}
                onChangeText={(text) => setNuevaAsamblea({ ...nuevaAsamblea, descripcion: text })}
              />

              <Text style={styles.label}>Encargado de pitar (Solo Nombrado/Coord.):</Text>
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

              <Text style={[styles.label, { marginTop: 10, borderTopWidth: 1, paddingTop: 10, borderColor: '#eee' }]}>Materiales necesarios:</Text>
              
              <View style={styles.checklistContainer}>
                {materialesDB.map((mat) => {
                  const itemId = mat.id_material || mat.id; 
                  const nombreMaterial = mat.nombre_material || mat.nombre || 'Material';
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
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>{modoEdicion ? 'Actualizar' : 'Guardar'}</Text>
                </TouchableOpacity>
              </View>

            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* SUB-MODAL SELECCIONAR DIRIGENTE */}
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
  
  asambleaCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, borderWidth: 1, borderColor: '#eee' },
  asambleaCardMia: { borderColor: '#FFA726', backgroundColor: '#fffdf9', borderWidth: 1.5 },
  
  badgeMia: { position: 'absolute', top: -10, right: 15, backgroundColor: '#FFA726', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeMiaText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  cardLabel: { fontSize: 14, color: '#666', marginLeft: 8, fontWeight: '500' },
  cardValue: { fontSize: 14, color: '#333', marginLeft: 5, flex: 1 },
  cardMateriales: { fontSize: 14, color: '#333', marginLeft: 26, marginBottom: 8, fontStyle: 'italic' },
  cardFooter: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  cardDate: { fontSize: 12, color: '#888', fontWeight: '600' },
  
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