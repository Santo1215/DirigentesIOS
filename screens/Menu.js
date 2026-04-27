import { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, TouchableWithoutFeedback } from 'react-native';
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
  const [errorMsg, setErrorMsg] = useState('');

  const actualizarContrasena = async () => {
    setErrorMsg('');
    if (!contrasenaActual || !contrasenaNueva || !contrasenaConfirmar) {
      setErrorMsg('Completa todos los campos');
      return;
    }
    if (!validarContrasena(contrasenaNueva)) {
      setErrorMsg('Debe tener al menos 9 caracteres, una mayúscula, una minúscula y un número');
      return;
    }

    if (contrasenaNueva !== contrasenaConfirmar) {
      setErrorMsg('Las contraseñas no coinciden');
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
        setErrorMsg(data.message || 'Error al actualizar');
        return;
      }

      setModalPassVisible(false);
      setContrasenaActual('');
      setContrasenaNueva('');
      setContrasenaConfirmar('');
      setErrorMsg('');
      Alert.alert('Éxito', data.message);
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de conexión');
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
          <MenuItem icon="document-text-outline" label="Actas" onPress={() => Linking.openURL('https://drive.google.com/drive/folders/1lzrdK3J9b7JVNWCG8GT0Njuz2-LogfOB')} />
          <MenuItem icon="calendar-outline" label="Cronogramas" onPress={() => { }} />
          <MenuItem icon="time-outline" label="Asambleas" onPress={() => Linking.openURL('https://drive.google.com/drive/folders/17cBGA5hulhUl53DNrEYgMAtbbtq-AGpW')} />
          <MenuItem icon="folder-open-outline" label="Carpeta General" onPress={() => Linking.openURL('https://drive.google.com/drive/folders/1xU_t1-8voZRPcwhQWz5_U38-D7liQzD-?usp=drive_link')} />
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
        onRequestClose={() => { setModalPassVisible(false); setErrorMsg(''); }}
      >
        {/* TOCAR AFUERA CIERRA */}
        <TouchableWithoutFeedback onPress={() => { setModalPassVisible(false); setErrorMsg(''); }}>
          <View style={styles.modalOverlay}>

            {/* CONTENIDO NO CIERRA */}
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Cambiar contraseña</Text>

                {/* Campo: Contraseña actual */}
                <View style={styles.inputRow}>
                  <TextInput
                    placeholder="Contraseña actual"
                    secureTextEntry={!mostrarContrasena}
                    value={contrasenaActual}
                    onChangeText={setContrasenaActual}
                    style={styles.inputFlex}
                  />
                  <TouchableOpacity
                    onPress={() => setMostrarContrasena(!mostrarContrasena)}
                    style={styles.eyeBtn}
                  >
                    <Ionicons
                      name={mostrarContrasena ? 'eye-off' : 'eye'}
                      size={22}
                      color="#555"
                    />
                  </TouchableOpacity>
                </View>

                {/* Campo: Nueva contraseña */}
                <View style={styles.inputRow}>
                  <TextInput
                    placeholder="Nueva contraseña"
                    secureTextEntry={!mostrarContrasena}
                    value={contrasenaNueva}
                    onChangeText={setContrasenaNueva}
                    style={styles.inputFlex}
                  />
                </View>

                {/* Campo: Confirmar nueva contraseña */}
                <View style={styles.inputRow}>
                  <TextInput
                    placeholder="Confirmar nueva contraseña"
                    secureTextEntry={!mostrarContrasena}
                    value={contrasenaConfirmar}
                    onChangeText={setContrasenaConfirmar}
                    style={styles.inputFlex}
                  />
                </View>


                {/* BOTONES */}
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => { setModalPassVisible(false); setErrorMsg(''); }}
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

                {/* Mensaje de error inline */}
                {errorMsg ? (
                  <Text style={styles.errorText}>{errorMsg}</Text>
                ) : null}
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

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginTop: 10,
  },

  inputFlex: {
    flex: 1,
    paddingVertical: 10,
  },

  eyeBtn: {
    paddingLeft: 8,
    paddingVertical: 10,
  },

  errorText: {
    color: '#c0392b',
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
  },

});