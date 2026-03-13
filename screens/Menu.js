import { useContext, useState } from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../components/navbar';
import { UserContext } from '../context/UserContext';
import SectionTitle from '../components/TituloSeccion';
import WaveBackground from '../components/WaveBackground';
import { API_URL } from '../api';
import { CommonActions } from '@react-navigation/native';
import { Linking } from 'react-native';


export default function Menu({ navigation }) {
  const { user, setUser } = useContext(UserContext);
  const [modalPassVisible, setModalPassVisible] = useState(false);
  const [contrasenaActual, setContrasenaActual] = useState('');
  const [contrasenaNueva, setContrasenaNueva] = useState('');
  const [contrasenaConfirmar, setContrasenaConfirmar] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);

  const actualizarContrasena = async () => {
      if (!contrasenaActual || !contrasenaNueva || !contrasenaConfirmar) {
        Alert.alert('Error', 'Completa todos los campos');
        return;
      }
       if (!validarContrasena(contrasenaNueva)) {
        Alert.alert(
          'Contraseña insegura',
          'Debe tener al menos 9 caracteres, una mayúscula, una minúscula y un número'
        );
        return;
      }

      if (contrasenaNueva !== contrasenaConfirmar) {
        Alert.alert('Error', 'Las contraseñas no coinciden');
        return;
      }
      try {
        const res = await fetch(
          `${API_URL}/dirigente/${user.dirigente.id_dirigente}/contrasena`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${user.token}`,
            },
            body: JSON.stringify({
              contrasenaActual,
              contrasenaNueva,
            }),
          }
        );

        const data = await res.json();

        if (!res.ok) {
          Alert.alert('Error', data.message);
          return;
        }

        Alert.alert('Éxito', data.message);
        setModalPassVisible(false);
        setContrasenaActual('');
        setContrasenaNueva('');
        setContrasenaConfirmar('');
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Error de conexión');
      }
    };
  const validarContrasena = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{9,}$/;
    return regex.test(password);
  };
  const cerrarSesion = async () => {
    console.log('Intentando cerrar sesión...');

    try {
      setUser(null);

      // Reset completo de la navegación para evitar re-renders en otras pestañas
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      );
    } catch (error) {
      console.error('Error en logout:', error);
    }
  };

  return (
    <View style={styles.container}>
      <WaveBackground style={{ pointerEvents: 'none' }} />

      <View style={styles.contentWrapper}>
        <SectionTitle title="Menú" />

        <View style={styles.grid}>
          <MenuItem icon="document-text-outline" label="Actas" onPress={() => Linking.openURL('https://stly.link/8DVWF')} />
          <MenuItem icon="calendar-outline" label="Cronogramas" onPress={() => {}} />
          <MenuItem icon="time-outline" label="Asambleas" onPress={() => Linking.openURL('https://stly.link/8DVWm')} />
          <MenuItem
            icon="lock-closed-outline"
            label="Contraseña"
            onPress={() => setModalPassVisible(true)}
          />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={cerrarSesion}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    {/* MODAL CAMBIAR CONTRASEÑA */}
      <Modal
        visible={modalPassVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalPassVisible(false)} // Android back
      >
        {/* TOCAR AFUERA CIERRA */}
        <TouchableWithoutFeedback onPress={() => setModalPassVisible(false)}>
          <View style={styles.modalOverlay}>
            
            {/* CONTENIDO NO CIERRA */}
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Cambiar contraseña</Text>

                <View style={styles.contraseñaContainer}>
                <TextInput
                  placeholder="Contraseña actual"
                  secureTextEntry={!mostrarContrasena}
                  value={contrasenaActual}
                  onChangeText={setContrasenaActual}
                  style={styles.input}
                  
                />
                <TouchableOpacity
                  onPress={() => setMostrarContrasena(!mostrarContrasena)}
                  style={{ position: 'absolute', right: 10, top: 12 }}
                >
                  <Ionicons
                    name={mostrarContrasena ? 'eye-off' : 'eye'}
                    size={24}
                    color="#000"
                  />
                </TouchableOpacity>
                </View>
            
                <TextInput
                  placeholder="Nueva contraseña"
                  secureTextEntry={!mostrarContrasena}
                  value={contrasenaNueva}
                  onChangeText={setContrasenaNueva}
                  style={styles.input}
                />
                
                <TextInput
                  placeholder="Confirmar nueva contraseña"
                  secureTextEntry={!mostrarContrasena}
                  value={contrasenaConfirmar}
                  onChangeText={setContrasenaConfirmar}
                  style={styles.input}
                />
              

                {/* BOTONES */}
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setModalPassVisible(false)}
                  >
                    <Text style={styles.cancelText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={actualizarContrasena}
                  >
                    <Text style={{ color: '#fff' }}>Actualizar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>

          </View>
        </TouchableWithoutFeedback>
      </Modal>


      <BottomNav navigation={navigation} />
    </View>
  );
}

function MenuItem({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <Ionicons name={icon} size={28} color="#222" />
      <Text style={styles.itemText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
  },

  contentWrapper: {
    flex: 1,
    zIndex: 10,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    flex: 1,
    marginTop: 30,
  },

  item: {
    width: '47%',
    height: 90,
    backgroundColor: '#E0E0E0',
    borderRadius: 30,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  itemText: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#222',
  },

  logoutBtn: {
    marginHorizontal: 40,
    marginTop: 10,
    backgroundColor: '#F2C066',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
  },

  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },  
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
  },
  confirmBtn: {
    flex: 1, 
    marginTop: 20,
    backgroundColor: '#0E1525',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },

  cancelBtn: {
    flex: 1,
    marginTop: 20,
    backgroundColor: '#ccc',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginRight: 20,
  },

  cancelText: {
    color: '#000',
    fontWeight: '500',
  },

  contrasenaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    paddingHorizontal: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

});