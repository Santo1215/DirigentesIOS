import React, { useState, useContext } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import ExoditoItem from '../components/ExoditoItem';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNav from '../components/navbar';
import { UserContext } from '../context/UserContext';
import SectionTitle from '../components/TituloSeccion';
import { Ionicons } from '@expo/vector-icons';
import WaveBackground from '../components/WaveBackground';
import { API_URL } from '../api';
import { useEffect } from 'react';

export default function Tribu({ navigation }) {
  const { user } = useContext(UserContext);
  const [modalNuevoVisible, setModalNuevoVisible] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoApellido, setNuevoApellido] = useState('');
  const [exoditos, setExoditos] = useState([]);
  const idTribu = user.dirigente.id_tribu;
  const CARGOS = ['Exodito', 'Líder', 'Subjefe', 'Jefe'];
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [exoditoSeleccionado, setExoditoSeleccionado] = useState(null);
  const [modo, setModo] = useState('vista');
  const [presentes, setPresentes] = useState([]);
  const [token, setToken] = useState(null);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [exoditoAEliminar, setExoditoAEliminar] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('error'); // 'error' | 'success'

  const showToast = (msg, type = 'error') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 3000);
  };
  useEffect(() => {
    AsyncStorage.getItem('token').then(setToken);
  }, []);

  const cambiarCargo = async (exodito, direccion) => {
    const indexActual = CARGOS.indexOf(exodito.cargo);
    if (indexActual === -1) return;

    const nuevoIndex =
      direccion === 'subir' ? indexActual + 1 : indexActual - 1;

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
          cargo: nuevoCargo
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || 'No se pudo actualizar el cargo');
        return;
      }

      setExoditos(prev =>
        prev.map(e =>
          e.id_exodito === exodito.id_exodito
            ? { ...e, cargo: nuevoCargo }
            : e
        )
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || 'No se pudo eliminar el exodito');
        return;
      }
      setExoditos(prev =>
        prev.filter(e => e.id_exodito !== exoditoAEliminar.id_exodito)
      );
      showToast(`${exoditoAEliminar.nombre} ha sido eliminado`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Error de conexión');
    } finally {
      setExoditoAEliminar(null);
    }
  };

  const togglePresente = (id) => {
    setPresentes((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const enviarAsistencia = async () => {
    const payload = exoditos.map(e => ({
      id_exodito: e.id_exodito,
      estado: presentes.includes(e.id_exodito) ? 'Presente' : 'Ausente',
    }));


    try {
      const res = await fetch(`${API_URL}/asistencia/exoditos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          asistencias: payload,
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
    setModalNuevoVisible(true);
  };

  const renderModoButton = (tipo, icono, label) => {
    const activo = modo === tipo;
    return (
      <TouchableOpacity
        style={[styles.modoBtn, activo && styles.modoBtnActivo]}
        onPress={() => setModo(tipo)}
      >
        <Ionicons name={icono} size={22} color={activo ? '#fff' : '#555'} />
        <Text style={[styles.modoBtnText, activo && { color: '#fff' }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };
  useEffect(() => {
    if (!idTribu || !token) return;

    const cargarExoditos = async () => {
      try {
        const res = await fetch(
          `${API_URL}/exoditos/tribu/${idTribu}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        console.log('EXODITOS CARGADOS:', data);

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


  return (
    <View style={styles.container}>
      <SectionTitle title={user?.dirigente?.tribu || 'Tribu'} />

      {/* Selector de modos */}
      <View style={styles.modosContainer}>
        {renderModoButton('vista', 'eye-outline', 'Vista')}
        {renderModoButton('editar', 'pencil', 'Editar')}
        {renderModoButton('asistencia', 'checkmark-circle-outline', 'Asistencia')}
      </View>

      <WaveBackground />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Leyenda */}
        {(modo === 'vista' || modo === 'editar') && (
          <View style={styles.leyenda}>
            <Text style={styles.leyendaText}>
              <Ionicons name="triangle" size={20} color="#000" /> Jefe
            </Text>
            <Text style={styles.leyendaText}>
              <Ionicons name="triangle-outline" size={20} color="#000" /> Subjefe
            </Text>
            <Text style={styles.leyendaText}>
              <Ionicons name="ellipse-outline" size={20} color="#000" /> Líder
            </Text>
          </View>
        )}

        {/* Info modo asistencia */}
        {modo === 'asistencia' && (
          <View style={styles.infoAsistencia}>
            <Ionicons name="information-circle-outline" size={20} color="#555" />
            <Text style={styles.infoText}>
              Toca para marcar/quitar presente • {presentes.length} presentes
            </Text>
          </View>
        )}

        {/* Lista de miembros */}
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

              <Text style={{ marginBottom: 20 }}>
                Cargo actual: <Text style={{ fontWeight: 'bold' }}>
                  {exoditoSeleccionado.cargo}
                </Text>
              </Text>

              {/* PROMOVER */}
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

              {/* DEGRADAR */}
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

              {/* ELIMINAR */}
              <TouchableOpacity
                style={[styles.modalActionBtn, { marginTop: 10 }]}
                onPress={() => {
                  setModalEditarVisible(false);
                  eliminarExodito(exoditoSeleccionado);
                }}
              >
                <Ionicons name="trash" size={22} color="#e74c3c" />
                <Text style={[styles.modalActionText, { color: '#e74c3c' }]}>
                  Eliminar
                </Text>
              </TouchableOpacity>

              {/* CANCELAR */}
              <TouchableOpacity
                style={styles.cancelBtnModal}
                onPress={() => setModalEditarVisible(false)}
              >
                <Text style={{ fontWeight: '600', color: 'black' }}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}


      {/* Botones flotantes según modo */}
      {modo === 'asistencia' && (
        <TouchableOpacity style={styles.btnFlotante} onPress={enviarAsistencia}>
          <Ionicons name="send" size={24} color="#fff" />
          <Text style={styles.btnFlotanteText}>Enviar Asistencia</Text>
        </TouchableOpacity>
      )}

      {modo === 'editar' && (
        <TouchableOpacity style={styles.btnFlotante} onPress={agregarNuevoExodito}>
          <Ionicons name="add" size={28} color="#fff" />
          <Text style={styles.btnFlotanteText}>Nuevo</Text>
        </TouchableOpacity>
      )}

      {/* Toast de feedback */}
      {toastMsg ? (
        <View style={[styles.toast, toastType === 'success' ? styles.toastSuccess : styles.toastError]}>
          <Text style={styles.toastText}>{toastMsg}</Text>
        </View>
      ) : null}

      <BottomNav navigation={navigation} />
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
              value={nuevoNombre}
              onChangeText={setNuevoNombre}
              autoFocus
            />
            <TextInput
              style={styles.input}
              placeholder="Apellido"
              value={nuevoApellido}
              onChangeText={setNuevoApellido}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                activeOpacity={0.8}
                onPress={() => setModalNuevoVisible(false)}
              >
                <Text style={[styles.modalBtnText, { color: '#333' }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>


              <TouchableOpacity
                style={[styles.modalBtn, styles.confirmBtn]}
                onPress={async () => {
                  if (!nuevoNombre.trim() || !nuevoApellido.trim()) {
                    showToast('Nombre y apellido son obligatorios');
                    return;
                  }

                  try {
                    console.log({
                      nombre: nuevoNombre,
                      apellido: nuevoApellido,
                      id_tribu: idTribu,
                    });

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
            <Ionicons name="warning" size={36} color="#e74c3c" style={{ marginBottom: 12 }} />
            <Text style={styles.modalTitle}>¿Eliminar exodito?</Text>
            <Text style={{ textAlign: 'center', color: '#555', marginBottom: 24 }}>
              ¿Estás seguro de eliminar a{' '}
              <Text style={{ fontWeight: 'bold' }}>
                {exoditoAEliminar?.nombre} {exoditoAEliminar?.apellido}
              </Text>?{'\n'}Esta acción no se puede deshacer.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => { setConfirmDeleteVisible(false); setExoditoAEliminar(null); }}
              >
                <Text style={[styles.modalBtnText, { color: '#333' }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#e74c3c' }]}
                onPress={confirmarEliminacion}
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
    backgroundColor: '#fff',
    marginTop: 30,
  },

  modosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  modoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 30,
    backgroundColor: '#eee',
    gap: 8,
  },

  modoBtnActivo: {
    backgroundColor: '#FF8C42',
  },

  modoBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },

  content: {
    padding: 20,
    paddingBottom: 140,
  },

  leyenda: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 20,
  },

  leyendaText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },

  infoAsistencia: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f4ff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    gap: 8,
  },

  infoText: {
    fontSize: 14,
    color: '#0066cc',
    flex: 1,
  },

  btnFlotante: {
    marginBottom: 100,
    backgroundColor: '#FF8C42',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 50,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    gap: 8,
  },

  btnFlotanteText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    marginHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: '#E0E0E0',
  },
  confirmBtn: {
    backgroundColor: '#FF8C42',
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  modalActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },

  modalActionText: {
    fontSize: 16,
    fontWeight: '500',
  },

  cancelBtnModal: {
    marginTop: 20,
    paddingVertical: 12,
    alignItems: 'center',
    color: 'black',
    borderRadius: 10,
  },

  toast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    zIndex: 999,
    elevation: 10,
  },
  toastSuccess: {
    backgroundColor: '#2ecc71',
  },
  toastError: {
    backgroundColor: '#e74c3c',
  },
  toastText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },

});