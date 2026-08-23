import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../api';
import { UserContext } from '../context/UserContext';
import SectionTitle from '../components/TituloSeccion';
import BottomNav from '../components/navbar';
import WaveBackground from '../components/WaveBackground';
import FechaPicker from '../components/FechaPicker';
import BotonCalificarAsamblea from '../components/BotonCalificarAsamblea';

export default function MisAsambleas({ navigation }) {
  const { user } = useContext(UserContext);

  const idUsuarioActual = user?.dirigente?.id_dirigente || user?.dirigente?.id || 1;
  const nombreUsuarioActual = user?.dirigente ? `${user.dirigente.nombre} ${user.dirigente.apellido}` : 'Usuario';

  // Validar rol para el botón de calificación
  const rolUsuario = (user?.dirigente?.rol || user?.dirigente?.cargo || '').toLowerCase();
  const esCoordinacionONombrado = rolUsuario.includes('coordinación') || rolUsuario.includes('coord') || rolUsuario.includes('nombrado');

  const [asambleas, setAsambleas] = useState([]);
  const [dirigentes, setDirigentes] = useState([]);
  const [materialesDB, setMaterialesDB] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalDirigentesVisible, setModalDirigentesVisible] = useState(false);
  const [modalOtrosEncargadosVisible, setModalOtrosEncargadosVisible] = useState(false);
  const [campoSeleccion, setCampoSeleccion] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idAsambleaEditando, setIdAsambleaEditando] = useState(null);

  const [nuevaAsamblea, setNuevaAsamblea] = useState({
    titulo: '', encargadoPitar: null, encargadoTiempo: null, otrosEncargados: [], fecha: new Date(), descripcion: ''
  });

  const [materialesSeleccionados, setMaterialesSeleccionados] = useState({});
  const [opcionOtroActiva, setOpcionOtroActiva] = useState(false);
  const [textoOtroMaterial, setTextoOtroMaterial] = useState('');

  useEffect(() => {
    cargarAsambleas();
    cargarDirigentes();
    cargarMateriales();
  }, []);

  const cargarAsambleas = async () => {
    try {
      const response = await fetch(`${API_URL}/asambleas`);
      if (response.ok) setAsambleas(await response.json());
    } catch (error) { console.error('Error cargando asambleas:', error); }
  };

  const cargarDirigentes = async () => {
    try {
      const response = await fetch(`${API_URL}/dirigentes`);
      if (response.ok) {
        const data = await response.json();
        setDirigentes(data.filter(d => (d.id_dirigente || d.id) !== idUsuarioActual));
      }
    } catch (error) { console.error('Error cargando dirigentes:', error); }
  };

  const cargarMateriales = async () => {
    try {
      const response = await fetch(`${API_URL}/materiales`);
      if (response.ok) setMaterialesDB(await response.json());
    } catch (error) { console.error('Error cargando materiales:', error); }
  };

  const toggleMaterial = (id, nombreMaterial) => {
    setMaterialesSeleccionados(prev => {
      const nuevoEstado = { ...prev };
      if (nuevoEstado[id]) delete nuevoEstado[id];
      else nuevoEstado[id] = { nombre: nombreMaterial, cantidad: 1 };
      return nuevoEstado;
    });
  };

  const incrementarCantidad = (id) => setMaterialesSeleccionados(prev => ({ ...prev, [id]: { ...prev[id], cantidad: prev[id].cantidad + 1 } }));
  const decrementarCantidad = (id) => setMaterialesSeleccionados(prev => prev[id].cantidad <= 1 ? prev : { ...prev, [id]: { ...prev[id], cantidad: prev[id].cantidad - 1 } });

  const toggleOtroEncargado = (dirigente) => {
    setNuevaAsamblea(prev => {
      const idDirigente = dirigente.id_dirigente || dirigente.id;
      const existe = prev.otrosEncargados.find(d => (d.id_dirigente || d.id) === idDirigente);
      return existe
        ? { ...prev, otrosEncargados: prev.otrosEncargados.filter(d => (d.id_dirigente || d.id) !== idDirigente) }
        : { ...prev, otrosEncargados: [...prev.otrosEncargados, dirigente] };
    });
  };

  const abrirModalCrear = () => {
    setModoEdicion(false); setIdAsambleaEditando(null);
    setNuevaAsamblea({ titulo: '', encargadoPitar: null, encargadoTiempo: null, otrosEncargados: [], fecha: new Date(), descripcion: '' });
    setMaterialesSeleccionados({}); setOpcionOtroActiva(false); setTextoOtroMaterial('');
    setModalVisible(true);
  };

  const abrirModalEditar = (asamblea) => {
    setModoEdicion(true);
    setIdAsambleaEditando(asamblea.id_asamblea);

    const encargadoPitarPrefill = asamblea.id_encargado_pitar ? {
      id_dirigente: asamblea.id_encargado_pitar,
      nombre: asamblea.pitar_nombre,
      apellido: asamblea.pitar_apellido,
      foto: asamblea.pitar_foto || null
    } : null;

    const encargadoTiempoPrefill = asamblea.id_encargado_tiempo ? {
      id_dirigente: asamblea.id_encargado_tiempo,
      nombre: asamblea.tiempo_nombre,
      apellido: asamblea.tiempo_apellido,
      foto: asamblea.tiempo_foto || null
    } : null;

    let otrosEncargadosPrefill = [];
    try {
      const raw = asamblea.otros_encargados;
      const nombresGuardados = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (Array.isArray(nombresGuardados)) {
        otrosEncargadosPrefill = dirigentes.filter(d =>
          nombresGuardados.includes(`${d.nombre} ${d.apellido}`)
        );
      }
    } catch (_) { }

    const materialesSelPrefill = {};
    let textoPrefill = '';
    const materialesStr = asamblea.materiales || '';
    if (materialesStr && materialesStr !== 'Sin materiales especificados') {
      const partes = materialesStr.split(', ');
      const partidasMatcheadas = new Set();

      for (const mat of materialesDB) {
        const idMat = mat.id_material || mat.id;
        const nombreMat = mat.nombre_material || mat.nombre || 'Material';
        for (const parte of partes) {
          const regex = new RegExp(`^${nombreMat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\((\\d+)\\)$`);
          const match = parte.match(regex);
          if (match) {
            materialesSelPrefill[idMat] = { nombre: nombreMat, cantidad: parseInt(match[1]) };
            partidasMatcheadas.add(parte);
            break;
          }
        }
      }
      const noMatchadas = partes.filter(p => !partidasMatcheadas.has(p));
      textoPrefill = noMatchadas.join(', ');
    }

    setNuevaAsamblea({
      titulo: asamblea.titulo,
      encargadoPitar: encargadoPitarPrefill,
      encargadoTiempo: encargadoTiempoPrefill,
      otrosEncargados: otrosEncargadosPrefill,
      fecha: new Date(asamblea.fecha),
      descripcion: asamblea.descripcion || ''
    });

    setMaterialesSeleccionados(materialesSelPrefill);
    setOpcionOtroActiva(textoPrefill.length > 0);
    setTextoOtroMaterial(textoPrefill);
    setModalVisible(true);
  };

  const abrirSeleccionDirigente = (campo) => { setCampoSeleccion(campo); setModalDirigentesVisible(true); };
  const seleccionarDirigente = (dirigente) => { setNuevaAsamblea({ ...nuevaAsamblea, [campoSeleccion]: dirigente }); setModalDirigentesVisible(false); };

  const guardarAsamblea = async () => {
    if (!nuevaAsamblea.titulo.trim()) { Alert.alert('Error', 'El título es obligatorio'); return; }

    const fObj = nuevaAsamblea.fecha instanceof Date ? nuevaAsamblea.fecha : new Date();
    const fechaStr = fObj.toISOString().split('T')[0];

    let listaMats = Object.values(materialesSeleccionados).map(m => `${m.nombre} (${m.cantidad})`).join(', ');
    if (opcionOtroActiva && textoOtroMaterial.trim()) listaMats += listaMats ? `, ${textoOtroMaterial}` : textoOtroMaterial;

    const otrosEncargadosNombres = nuevaAsamblea.otrosEncargados.map(d => `${d.nombre} ${d.apellido}`);

    const payload = {
      titulo: nuevaAsamblea.titulo,
      id_encargado: idUsuarioActual,
      id_encargado_pitar: nuevaAsamblea.encargadoPitar ? (nuevaAsamblea.encargadoPitar.id_dirigente || nuevaAsamblea.encargadoPitar.id) : null,
      id_encargado_tiempo: nuevaAsamblea.encargadoTiempo ? (nuevaAsamblea.encargadoTiempo.id_dirigente || nuevaAsamblea.encargadoTiempo.id) : null,
      otros_encargados: otrosEncargadosNombres,
      materiales: listaMats || 'Sin materiales especificados',
      fecha: fechaStr,
      descripcion: nuevaAsamblea.descripcion
    };

    try {
      const url = modoEdicion ? `${API_URL}/asambleas/${idAsambleaEditando}` : `${API_URL}/asambleas`;
      const method = modoEdicion ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });

      if (res.ok) {
        cargarAsambleas();
        setModalVisible(false);
      } else {
        const errData = await res.json().catch(() => ({}));
        Alert.alert('Error', errData.error || 'No se pudo guardar la asamblea');
      }
    } catch (e) { Alert.alert("Error", "No se pudo guardar la asamblea"); }
  };

  const eliminarAsamblea = (id) => {
    Alert.alert("Eliminar Asamblea", "¿Estás seguro de que deseas eliminarla?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar", style: "destructive", onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/asambleas/${id}`, { method: 'DELETE' });
            if (res.ok) cargarAsambleas();
          } catch (e) { console.error(e); }
        }
      }
    ]);
  };

  const dirigentesMostrar = campoSeleccion === 'encargadoPitar'
    ? dirigentes.filter(d => (d.rol || '').toLowerCase().includes('nombrado') || (d.rol || '').toLowerCase().includes('coordinación'))
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
              let otrosNombres = [];
              try {
                const raw = asamblea.otros_encargados;
                const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                if (Array.isArray(parsed)) otrosNombres = parsed;
              } catch (_) { }

              const esMía = asamblea.id_encargado === idUsuarioActual
                || otrosNombres.includes(nombreUsuarioActual);

              return (
                <View
                  key={asamblea.id_asamblea}
                  style={[styles.asambleaCard, esMía && styles.asambleaCardMia]}
                >
                  {esMía && (
                    <View style={styles.badgeMia}>
                      <Text style={styles.badgeMiaText}>🌟 Tu Asamblea</Text>
                    </View>
                  )}

                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{asamblea.titulo}</Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>

                      {/* Botones de acción visibles SOLO si es tu asamblea */}
                      {esMía && (
                        <>
                          <TouchableOpacity style={{ marginRight: 12 }} onPress={() => abrirModalEditar(asamblea)}>
                            <Ionicons name="pencil-outline" size={20} color="#FFA726" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => eliminarAsamblea(asamblea.id_asamblea)}>
                            <Ionicons name="trash-outline" size={20} color="#E50F0F" />
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>

                  <View style={styles.cardRow}>
                    <Ionicons name="person-outline" size={18} color="#666" />
                    <Text style={styles.cardLabel}>Organiza:</Text>
                    <Text style={styles.cardValue}>
                      {asamblea.encargado_nombre ? `${asamblea.encargado_nombre} ${asamblea.encargado_apellido}` : asamblea.dirigente || 'Sin asignar'}
                    </Text>
                  </View>

                  <View style={styles.cardRow}>
                    <Ionicons name="megaphone-outline" size={18} color="#666" />
                    <Text style={styles.cardLabel}>Pitar:</Text>
                    <Text style={styles.cardValue}>
                      {asamblea.pitar_nombre ? `${asamblea.pitar_nombre} ${asamblea.pitar_apellido}` : 'No asignado'}
                    </Text>
                  </View>

                  <View style={styles.cardRow}>
                    <Ionicons name="time-outline" size={18} color="#666" />
                    <Text style={styles.cardLabel}>Tiempo:</Text>
                    <Text style={styles.cardValue}>
                      {asamblea.tiempo_nombre ? `${asamblea.tiempo_nombre} ${asamblea.tiempo_apellido}` : 'No asignado'}
                    </Text>
                  </View>

                  <View style={styles.cardRow}>
                    <Ionicons name="people-outline" size={18} color="#666" />
                    <Text style={styles.cardLabel}>Otros Enc.:</Text>
                    <Text style={styles.cardValue} numberOfLines={2}>
                      {(() => {
                        try {
                          const raw = asamblea.otros_encargados;
                          const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
                          return Array.isArray(arr) && arr.length > 0 ? arr.join(', ') : 'Ninguno';
                        } catch { return 'Ninguno'; }
                      })()}
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
                  {/* Validar rol para mostrar el botón */}
                    {esCoordinacionONombrado && (
                      <View style={{ marginTop: 10 }}>
                        <BotonCalificarAsamblea 
                          asamblea={asamblea} 
                          idDirigente={idUsuarioActual}
                          yaCalificado={asamblea.calificaciones?.some(c => c.id_dirigente === idUsuarioActual)}
                          onCalificado={() => cargarAsambleas()} 
                        />
                      </View>
                    )}
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
                placeholder="Ej: Asamblea del mejor amigo"
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