import { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, TouchableWithoutFeedback, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNav from '../components/navbar';
import { UserContext } from '../context/UserContext';
import SectionTitle from '../components/TituloSeccion';
import WaveBackground from '../components/WaveBackground';
import { API_URL } from '../api';
import { CommonActions } from '@react-navigation/native';
import { Linking } from 'react-native';

export default function AsistenciaMenu({ navigation }) {
  const { user, setUser } = useContext(UserContext);
  const [token, setToken] = useState(null);
  const [enviandoNotif, setEnviandoNotif] = useState(false);
  const [notifModal, setNotifModal] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('token').then(setToken);
  }, []);

  /* ===============================
     Enviar notificación recordatorio
  =============================== */

  const enviarRecordatorio = async () => {
    setEnviandoNotif(true);
    try {
      const res = await fetch(
        `${API_URL}/notificacion/recordatorio-tribu`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const json = await res.json();

      if (!res.ok) {
        const errorMsg = json.error || 'Error al enviar notificación';
        if (Platform.OS === 'web') {
          alert(errorMsg);
        } else {
          Alert.alert('Error', errorMsg);
        }
        return;
      }

      const msg = `Notificación enviada a ${json.enviados} dispositivo(s)`;
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('Enviado', msg);
      }
    } catch (err) {
      const errorMsg = 'Error de conexión al enviar notificación';
      if (Platform.OS === 'web') {
        alert(errorMsg);
      } else {
        Alert.alert('Error', errorMsg);
      }
    } finally {
      setEnviandoNotif(false);
      setNotifModal(false);
    }
  };

  return (
    <View style={styles.container}>
      <WaveBackground style={{ pointerEvents: 'none' }} />
      <SectionTitle title="Asistencia" />
      <View style={styles.contentWrapper}>
        
        <MenuItem label="Asistencia" onPress={() => navigation.navigate('AsistenciaTribus')} />
        <MenuItem label="Reporte" proximamente />
        <MenuItem label="Buscar" proximamente />
        <MenuItem label="Enviar Recordatorio" onPress={() => setNotifModal(true)} />
      </View>

      <BottomNav navigation={navigation} />

      {/* Modal confirmación notificación */}
      <Modal transparent animationType="fade" visible={notifModal} onRequestClose={() => setNotifModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>🔔</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, textAlign: 'center' }}>
              Enviar recordatorio
            </Text>
            <Text style={{ color: '#666', fontSize: 14, marginBottom: 20, textAlign: 'center' }}>
              Se enviará una notificación a TODOS los dirigentes con el mensaje:{"\n\n"}"RECUERDA TOMAR LA ASISTENCIA DE LA TRIBU"
            </Text>
            <TouchableOpacity
              style={[styles.notifConfirmBtn, enviandoNotif && { opacity: 0.6 }]}
              onPress={enviarRecordatorio}
              disabled={enviandoNotif}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                {enviandoNotif ? 'Enviando...' : 'Sí, enviar'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginTop: 12, paddingVertical: 10 }}
              onPress={() => setNotifModal(false)}
            >
              <Text style={{ color: '#666' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function MenuItem({ label, onPress, proximamente }) {
  return (
    <TouchableOpacity
      style={styles.item}
      onPress={onPress}
      disabled={proximamente}
      activeOpacity={proximamente ? 1 : 0.7}
    >
      <Text style={styles.itemText}>{label}</Text>

      {proximamente && (
        <View style={styles.proximamenteOverlay}>
          <Text style={styles.proximamenteText}>Próximamente</Text>
        </View>
      )}
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
    alignItems:'center',
    justifyContent: 'center',
  },

  item: {
    width: '90%',
    height: 70,
    backgroundColor: '#ffa34cbb',
    borderRadius: 30,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },

  itemText: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '500',
    color: '#222',
  },

  proximamenteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  proximamenteText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  notifConfirmBtn: {
    backgroundColor: '#FFA726',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
});