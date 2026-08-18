import React, { useState, useContext, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  FlatList, 
  Linking 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ExoditoItem from '../components/ExoditoItem';
import BottomNav from '../components/navbar';
import SectionTitle from '../components/TituloSeccion';
import WaveBackground from '../components/WaveBackground';
import { UserContext } from '../context/UserContext';
import { API_URL } from '../api';

export default function Tribu({ navigation }) {
  const { user } = useContext(UserContext);
  const rol = user?.dirigente?.rol;
  const esCoordinacion = rol === 'Coordinación';

  const [modalNuevoVisible, setModalNuevoVisible] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoApellido, setNuevoApellido] = useState('');
  const [exoditos, setExoditos] = useState([]);
  const idTribuSecundariaUsuario = user?.dirigente?.id_tribu_secundaria || null;
  const tieneSecundaria = !esCoordinacion && !!idTribuSecundariaUsuario;

  const [tribuSeleccionada, setTribuSeleccionada] = useState(
    esCoordinacion && user?.dirigente?.id_tribu
      ? { id_tribu: user.dirigente.id_tribu, nombre: user.dirigente.tribu }
      : null
  );

  const [tribuActivaNormal, setTribuActivaNormal] = useState(
    tieneSecundaria
      ? { id_tribu: user.dirigente.id_tribu, nombre: user.dirigente.tribu, drive: user.dirigente.drive }
      : null
  );
  const [todasLasTribus, setTodasLasTribus] = useState([]);
  const [modalTribusVisible, setModalTribusVisible] = useState(false);

  const idTribu = esCoordinacion
    ? tribuSeleccionada?.id_tribu
    : tieneSecundaria
      ? tribuActivaNormal?.id_tribu
      : user?.dirigente?.id_tribu;

  const nombreTribu = esCoordinacion
    ? (tribuSeleccionada?.nombre || 'Selecciona una tribu')
    : tieneSecundaria
      ? (tribuActivaNormal?.nombre || user?.dirigente?.tribu || 'Tribu')
      : (user?.dirigente?.tribu || 'Tribu');

  const driveUrl = esCoordinacion
    ? (tribuSeleccionada?.drive || null)
    : tieneSecundaria
      ? (tribuActivaNormal?.drive || null)
      : (user?.dirigente?.drive || null);

  const CARGOS = ['Exodito', 'Líder', 'Subjefe', 'Jefe'];
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [exoditoSeleccionado, setExoditoSeleccionado] = useState(null);
  const [modo, setModo] = useState('vista');
  const [presentes, setPresentes] = useState([]);
  const [token, setToken] = useState(null);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [exoditoAEliminar, setExoditoAEliminar] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('error');

  const showToast = (msg, type = 'error') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Cargar token inicial y peticiones de tribus de forma centralizada
  useEffect(() => {
    const inicializar = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        setToken(storedToken);

        if (!storedToken) return;

        if (esCoordinacion || tieneSecundaria) {
          const res = await fetch(`${API_URL}/tribus`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          const data = await res.json();
          
          if (res.ok) {
            if (esCoordinacion) {
              setTodasLasTribus(data);
            } else if (tieneSecundaria) {
              const tribuPrincipal = data.find(t => Number(t.id_tribu) === Number(user.dirigente.id_tribu));
              const tribuSecundaria = data.find(t => Number(t.id_tribu) === Number(idTribuSecundariaUsuario));
              if (tribuPrincipal) setTribuActivaNormal(tribuPrincipal);
              setTodasLasTribus([tribuPrincipal, tribuSecundaria].filter(Boolean));
            }
          }
        }
      } catch (err) {
        console.error('Error al inicializar datos:', err);
      }
    };
    inicializar();
  }, [esCoordinacion, tieneSecundaria]);

  // Cargar exoditos de la tribu activa
  useEffect(() => {
    if (!idTribu || !token) return;
    setExoditos([]);
    setPresentes([]);
    setModo('vista');

    const cargarExoditos = async () => {
      try {
        const res = await fetch(`${API_URL}/exoditos/tribu/${idTribu}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setExoditos(data);
        } else {
          console.warn('Error backend:', data);
        }
      } catch (err) {
        console.error('Error cargando exoditos:', err);
      }
    };

    cargarExoditos();
  }, [idTribu, token]);

  const cambiarCargo = async (exodito, direccion) => {
    const indexActual = CARGOS.indexOf(exodito.cargo);
    if (indexActual === -1) return;

    const nuevoIndex = direccion === 'subir' ? indexActual + 1 : indexActual - 1;
    if (nuevoIndex < 0 || nuevoIndex >= CARGOS.length) {
      showToast('No se puede cambiar más el cargo', 'error');
      return;
    }

    const nuevoCargo = CARGOS[nuevoIndex];

    try {
      const res = await fetch(`${API_URL}/exodito/${exodito.id_exodito}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: exodito.nombre,
          apellido: exodito.apellido,
          id_tribu: idTribu,
          cargo: nuevoCargo,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || 'No se pudo actualizar el cargo');
        return;
      }

      setExoditos(prev =>
        prev.map(e => (e.id_exodito === exodito.id_exodito ? { ...e, cargo: nuevoCargo } : e))
      );
      showToast(`${exodito.nombre} ahora es ${nuevoCargo}`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Error de conexión');
    }
  };

  const eliminarExodito = (exodito) => {
    setExoditoAEliminar(exodito);
    setConfirmDeleteVisible(true);
  };

  const confirmarEliminacion = async () => {
    if (!exoditoAEliminar) return;
    setConfirmDeleteVisible(false);
    try {
      const res = await fetch(`${API_URL}/exodito/${exoditoAEliminar.id_exodito}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || 'No se pudo eliminar el exodito');
        return;
      }
      setExoditos(prev => prev.filter(e => e.id_exodito !== exoditoAEliminar.id_exodito));
      showToast(`${exoditoAEliminar.nombre} ha sido eliminado`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Error de conexión');
    } finally {
      setExoditoAEliminar(null);
    }
  };

  const togglePresente = (id) => {
    setPresentes(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const enviarAsistencia = async () => {
    const payload = exoditos.map(e => ({
      id_exodito: e.id_exodito,
      estado: presentes.includes(e.id_exodito) ? 'Presente' : 'Ausente',
    }));

    try {
      const ahora = new Date();
      const fechaLocal = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;

      const res = await fetch(`${API_URL}/asistencia/exoditos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          asistencias: payload,
          fecha: fechaLocal,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'No se pudo registrar la asistencia');
        return;
      }

      showToast(`Asistencia registrada (${data.total} exoditos)`, 'success');
      setPresentes([]);
      setModo('vista');
    } catch (err) {
      console.error(err);
      showToast('Error de conexión con el servidor');
    }
  };

  const agregarNuevoExodito = () => {
    setNuevoNombre('');
    setNuevoApellido('');
    setModalNuevoVisible(true);
  };

  const renderModoButton = (tipo, icono, label) => {
    const activo = modo === tipo;
    return (
      <TouchableOpacity
        style={[styles.modoBtn, activo && styles.modoBtnActivo]}
        onPress={() => setModo(tipo)}
        activeOpacity={0.7}
      >
        <Ionicons name={icono} size={20} color={activo ? '#fff' : '#666'} />
        <Text style={[styles.modoBtnText, activo && styles.modoBtnTextActivo]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <SectionTitle title={nombreTribu} />

      {/* Selector de tribu para coordinación */}
      {esCoordinacion && (
        <TouchableOpacity
          style={styles.selectorTribu}
          onPress={() => setModalTribusVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="people-outline" size={20} color="#FF8C42" />
          <Text style={styles.selectorTribuText}>
            {tribuSeleccionada ? tribuSeleccionada.nombre : 'Elige una tribu'}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#888" />
        </TouchableOpacity>
      )}

      {/* Selector de tribu para dirigentes con tribu secundaria */}
      {tieneSecundaria && (
        <View style={styles.tribuTabsRow}>
          {todasLasTribus.map(t => {
            const activa = Number(t.id_tribu) === Number(tribuActivaNormal?.id_tribu);
            return (
              <TouchableOpacity
                key={t.id_tribu}
                style={[styles.tribuTab, activa && styles.tribuTabActiva]}
                onPress={() => setTribuActivaNormal(t)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tribuTabText, activa && styles.tribuTabTextActiva]}>
                  {t.nombre}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Selector de modos */}
      {(!esCoordinacion || tribuSeleccionada) && (!tieneSecundaria || tribuActivaNormal) && (
        <View style={styles.modosContainer}>
          {renderModoButton('vista', 'eye-outline', 'Vista')}
          {renderModoButton('editar', 'create-outline', 'Editar')}
          {renderModoButton('asistencia', 'checkmark-circle-outline', 'Asistencia')}
        </View>
      )}

      {/* Botón Drive */}
      {driveUrl && (!esCoordinacion || tribuSeleccionada) && (
        <TouchableOpacity
          style={styles.driveBtn}
          onPress={() => Linking.openURL(driveUrl)}
          activeOpacity={0.8}
        >
          <Ionicons name="folder-open-outline" size={20} color="#fff" />
          <Text style={styles.driveBtnText}>Abrir Google Drive</Text>
        </TouchableOpacity>
      )}

      <WaveBackground />

      <ScrollView contentContainerStyle={styles.content}>
        {esCoordinacion && !tribuSeleccionada && (
          <View style={styles.placeholderContainer}>
            <Ionicons name="people-circle-outline" size={72} color="#FFD5B0" />
            <Text style={styles.placeholderTitle}>Selecciona una tribu</Text>
            <Text style={styles.placeholderSub}>
              Elige una tribu arriba para ver y registrar su asistencia.
            </Text>
          </View>
        )}

        {(!esCoordinacion || tribuSeleccionada) && (modo === 'vista' || modo === 'editar') && (
          <View style={styles.leyenda}>
            <View style={styles.leyendaItem}>
              <Ionicons name="triangle" size={14} color="#333" />
              <Text style={styles.leyendaText}>Jefe</Text>
            </View>
            <View style={styles.leyendaItem}>
              <Ionicons name="triangle-outline" size={14} color="#333" />
              <Text style={styles.leyendaText}>Subjefe</Text>
            </View>
            <View style={styles.leyendaItem}>
              <Ionicons name="ellipse-outline" size={14} color="#333" />
              <Text style={styles.leyendaText}>Líder</Text>
            </View>
          </View>
        )}

        {(!esCoordinacion || tribuSeleccionada) && modo === 'asistencia' && (
          <View style={styles.infoAsistencia}>
            <Ionicons name="information-circle-outline" size={20} color="#0066cc" />
            <Text style={styles.infoText}>
              Toca para marcar/quitar presente • <Text style={{ fontWeight: 'bold' }}>{presentes.length}</Text> presentes
            </Text>
          </View>
        )}

        {exoditos.map((exodito) => (
          <ExoditoItem
            key={exodito.id_exodito}
            exodito={exodito}
            modo={modo}
            presente={presentes.includes(exodito.id_exodito)}
            onPress={() => {
              if (modo === 'asistencia') {
                togglePresente(exodito.id_exodito);
              }
              if (modo === 'editar') {
                setExoditoSeleccionado(exodito);
                setModalEditarVisible(true);
              }
            }}
          />
        ))}
      </ScrollView>

      {/* Botones Flotantes */}
      {modo === 'asistencia' && (
        <TouchableOpacity style={styles.btnFlotante} onPress={enviarAsistencia} activeOpacity={0.85}>
          <Ionicons name="send" size={20} color="#fff" />
          <Text style={styles.btnFlotanteText}>Enviar Asistencia</Text>
        </TouchableOpacity>
      )}

      {modo === 'editar' && (
        <TouchableOpacity style={styles.btnFlotante} onPress={agregarNuevoExodito} activeOpacity={0.85}>
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.btnFlotanteText}>Nuevo Exodito</Text>
        </TouchableOpacity>
      )}

      {/* Toast */}
      {toastMsg ? (
        <View style={[styles.toast, toastType === 'success' ? styles.toastSuccess : styles.toastError]}>
          <Text style={styles.toastText}>{toastMsg}</Text>
        </View>
      ) : null}

      <BottomNav navigation={navigation} />

      {/* MODAL EDITAR EXODITO */}
      {modalEditarVisible && exoditoSeleccionado && (
        <Modal
          transparent
          animationType="fade"
          visible={modalEditarVisible}
          onRequestClose={() => setModalEditarVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {exoditoSeleccionado.nombre} {exoditoSeleccionado.apellido}
              </Text>

              <Text style={styles.modalSubTitle}>
                Cargo actual: <Text style={{ fontWeight: 'bold', color: '#FF8C42' }}>{exoditoSeleccionado.cargo}</Text>
              </Text>

              <TouchableOpacity
                style={styles.modalActionBtn}
                onPress={() => {
                  cambiarCargo(exoditoSeleccionado, 'subir');
                  setModalEditarVisible(false);
                }}
              >
                <Ionicons name="arrow-up-circle" size={22} color="#2ecc71" />
                <Text style={styles.modalActionText}>Promover</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalActionBtn}
                onPress={() => {
                  cambiarCargo(exoditoSeleccionado, 'bajar');
                  setModalEditarVisible(false);
                }}
              >
                <Ionicons name="arrow-down-circle" size={22} color="#f39c12" />
                <Text style={styles.modalActionText}>Degradar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalActionBtn}
                onPress={() => {
                  setModalEditarVisible(false);
                  eliminarExodito(exoditoSeleccionado);
                }}
              >
                <Ionicons name="trash-outline" size={22} color="#e74c3c" />
                <Text style={[styles.modalActionText, { color: '#e74c3c' }]}>Eliminar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtnModal}
                onPress={() => setModalEditarVisible(false)}
              >
                <Text style={{ fontWeight: '600', color: '#666' }}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* MODAL SELECTOR DE TRIBUS */}
      <Modal
        transparent
        animationType="slide"
        visible={modalTribusVisible}
        onRequestClose={() => setModalTribusVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '70%' }]}>
            <Text style={styles.modalTitle}>Seleccionar Tribu</Text>
            <FlatList
              data={todasLasTribus}
              keyExtractor={(item) => item.id_tribu.toString()}
              contentContainerStyle={{ width: '100%', paddingBottom: 10 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.tribusListItem,
                    tribuSeleccionada?.id_tribu === item.id_tribu && styles.tribusListItemActivo,
                  ]}
                  onPress={() => {
                    setTribuSeleccionada(item);
                    setModalTribusVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.tribusListItemText,
                      tribuSeleccionada?.id_tribu === item.id_tribu && { color: '#fff', fontWeight: 'bold' },
                    ]}
                  >
                    {item.nombre}
                  </Text>
                  {tribuSeleccionada?.id_tribu === item.id_tribu && (
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.cancelBtnModal}
              onPress={() => setModalTribusVisible(false)}
            >
              <Text style={{ fontWeight: '600', color: '#666' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL NUEVO EXODITO */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalNuevoVisible}
        onRequestClose={() => setModalNuevoVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nuevo Exodito</Text>

            <TextInput
              style={styles.input}
              placeholder="Nombre"
              placeholderTextColor="#999"
              value={nuevoNombre}
              onChangeText={setNuevoNombre}
              autoFocus
            />
            <TextInput
              style={styles.input}
              placeholder="Apellido"
              placeholderTextColor="#999"
              value={nuevoApellido}
              onChangeText={setNuevoApellido}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                activeOpacity={0.8}
                onPress={() => setModalNuevoVisible(false)}
              >
                <Text style={[styles.modalBtnText, { color: '#333' }]}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.confirmBtn]}
                activeOpacity={0.8}
                onPress={async () => {
                  if (!nuevoNombre.trim() || !nuevoApellido.trim()) {
                    showToast('Nombre y apellido son obligatorios');
                    return;
                  }

                  try {
                    const res = await fetch(`${API_URL}/exoditos`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        nombre: nuevoNombre.trim(),
                        apellido: nuevoApellido.trim(),
                        cargo: 'Exodito',
                        id_tribu: idTribu,
                      }),
                    });

                    const data = await res.json();
                    if (!res.ok) {
                      showToast(data.error || 'No se pudo crear el exodito');
                      return;
                    }

                    setExoditos([...exoditos, data.exodito]);
                    setNuevoNombre('');
                    setNuevoApellido('');
                    setModalNuevoVisible(false);
                    showToast('Exodito agregado con éxito', 'success');
                  } catch (err) {
                    console.error(err);
                    showToast('Error de conexión con el servidor');
                  }
                }}
              >
                <Text style={styles.modalBtnText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL CONFIRMAR ELIMINACIÓN */}
      <Modal
        transparent
        animationType="fade"
        visible={confirmDeleteVisible}
        onRequestClose={() => setConfirmDeleteVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.warningIconContainer}>
              <Ionicons name="warning-outline" size={36} color="#e74c3c" />
            </View>
            <Text style={styles.modalTitle}>¿Eliminar exodito?</Text>
            <Text style={styles.modalSubTitleCenter}>
              ¿Estás seguro de eliminar a{' '}
              <Text style={{ fontWeight: 'bold', color: '#333' }}>
                {exoditoAEliminar?.nombre} {exoditoAEliminar?.apellido}
              </Text>?{'\n'}Esta acción no se puede deshacer.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => { setConfirmDeleteVisible(false); setExoditoAEliminar(null); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalBtnText, { color: '#333' }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#e74c3c' }]}
                onPress={confirmarEliminacion}
                activeOpacity={0.8}
              >
                <Text style={styles.modalBtnText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: 30,
  },
  selectorTribu: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#FFE5D0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    gap: 10,
  },
  selectorTribuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  tribuTabsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    gap: 10,
  },
  tribuTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FFF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tribuTabActiva: {
    backgroundColor: '#FF8C42',
    borderColor: '#FF8C42',
  },
  tribuTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tribuTabTextActiva: {
    color: '#fff',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#475569',
  },
  placeholderSub: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginHorizontal: 30,
  },
  tribusListItem: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tribusListItemActivo: {
    backgroundColor: '#FF8C42',
    borderColor: '#FF8C42',
  },
  tribusListItemText: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '500',
  },
  modosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    gap: 6,
  },
  modoBtnActivo: {
    backgroundColor: '#FF8C42',
  },
  modoBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  modoBtnTextActivo: {
    color: '#fff',
  },
  content: {
    padding: 16,
    paddingBottom: 130,
  },
  leyenda: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 6,
    padding: 10,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  leyendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  leyendaText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  infoAsistencia: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#0369A1',
    flex: 1,
  },
  btnFlotante: {
    position: 'absolute',
    bottom: 85,
    alignSelf: 'center',
    backgroundColor: '#FF8C42',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 30,
    elevation: 6,
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    gap: 8,
    zIndex: 10,
  },
  btnFlotanteText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 20,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubTitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalSubTitleCenter: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  warningIconContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 50,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginBottom: 14,
    fontSize: 15,
    color: '#1E293B',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
  },
  confirmBtn: {
    backgroundColor: '#FF8C42',
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  modalActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    width: '100%',
    paddingHorizontal: 16,
    borderRadius: 10,
    marginVertical: 2,
  },
  modalActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  cancelBtnModal: {
    marginTop: 16,
    paddingVertical: 8,
    alignItems: 'center',
    width: '100%',
  },
  toast: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    zIndex: 999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  toastSuccess: {
    backgroundColor: '#10B981',
  },
  toastError: {
    backgroundColor: '#EF4444',
  },
  toastText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  driveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  driveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});