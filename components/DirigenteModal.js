import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform, Image } from 'react-native';
import { useState, useEffect } from 'react';
import { API_URL } from '../api';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function DirigenteModal({ visible, dirigente, onClose, onSaved }) {
  const [rol, setRol] = useState('');
  const [comite, setComite] = useState('');
  const [idTribu, setIdTribu] = useState(0);
  const [idTribuSecundaria, setIdTribuSecundaria] = useState(0);
  const [tribus, setTribus] = useState([]);
  const [tribusOrdenadas, setTribusOrdenadas] = useState([]);

  useEffect(() => {
    const tribusOrdenadas = [...tribus].sort((a, b) => a.id_tribu - b.id_tribu);
    setTribusOrdenadas(tribusOrdenadas);
  }, [tribus]);

  useEffect(() => {
    if (["Coordinación"].includes(rol)) {
      setComite('Económico');
    }
  }, [rol]);

  useEffect(() => {
    fetch(`${API_URL}/tribus`)
      .then(res => res.json())
      .then(setTribus)
      .catch(() => alert('Error cargando tribus'));
  }, []);

  useEffect(() => {
    if (dirigente) {
      setRol(dirigente.rol || '');
      setComite(dirigente.comite || '');
      setIdTribu(dirigente.id_tribu ? Number(dirigente.id_tribu) : 0);
      setIdTribuSecundaria(dirigente.id_tribu_secundaria ? Number(dirigente.id_tribu_secundaria) : 0);
    }
  }, [dirigente]);

  const guardarCambios = async () => {
    try {
      const res = await fetch(`${API_URL}/dirigente/${dirigente.id_dirigente}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rol, comite, id_tribu: idTribu, id_tribu_secundaria: idTribuSecundaria || null }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Error al guardar');
        return;
      }

      onSaved();
      onClose();
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    }
  };

  const eliminarDirigente = () => {
    if (Platform.OS === 'web') {
      const confirmar = window.confirm(
        '¿Estás seguro? Esta acción no se puede deshacer.'
      );
      if (confirmar) confirmarEliminacion();
    } else {
      Alert.alert(
        'Eliminar dirigente',
        '¿Estás seguro? Esta acción no se puede deshacer.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: confirmarEliminacion,
          },
        ]
      );
    }
  };

  const confirmarEliminacion = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/dirigente/${dirigente.id_dirigente}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let data = {};
      const text = await res.text();
      if (text) {
        try { data = JSON.parse(text); } catch (_) { }
      }

      if (!res.ok) {
        if (Platform.OS === 'web') {
          window.alert(data.message || 'Error al eliminar');
        } else {
          Alert.alert('Error', data.message || 'Error al eliminar');
        }
        return;
      }

      if (Platform.OS === 'web') {
        window.alert(`${dirigente.nombre} ${dirigente.apellido} fue eliminado correctamente.`);
        onSaved();
        onClose();
      } else {
        Alert.alert(
          'Dirigente eliminado',
          `${dirigente.nombre} ${dirigente.apellido} fue eliminado correctamente.`,
          [{ text: 'Aceptar', onPress: () => { onSaved(); onClose(); } }]
        );
      }
    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert('Error de conexión');
      } else {
        Alert.alert('Error', 'Error de conexión');
      }
    }
  };

  if (!dirigente) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>

          {/* Contenedor de la foto del dirigente */}
          <View style={styles.avatarContainer}>
            {dirigente.foto ? (
              <Image source={{ uri: dirigente.foto }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={32} color="#FFA726" />
            )}
          </View>

          <Text style={styles.title}>
            {dirigente.nombre} {dirigente.apellido}
          </Text>

          <Picker selectedValue={rol} onValueChange={setRol}>
            <Picker.Item label="Seleccionar rol" value="" />
            <Picker.Item label="Coordinación" value="Coordinación" />
            <Picker.Item label="Nombrado" value="Nombrado" />
            <Picker.Item label="En servicio" value="En servicio" />
            <Picker.Item label="Dirigente" value="Dirigente" />
            <Picker.Item label="Levitando" value="Levitando" />
          </Picker>

          {rol === "Coordinación" && (
            <Text style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>
              El comité es automático para este rol
            </Text>
          )}

          <Picker selectedValue={comite} onValueChange={setComite}
            enabled={!["Coordinación"].includes(rol)}>
            <Picker.Item label="Seleccionar comité" value="" />
            <Picker.Item label="Asistencia" value="Asistencia" />
            <Picker.Item label="Religioso" value="Religioso" />
            <Picker.Item label="Puntos" value="Puntos" />
            <Picker.Item label="Integración" value="Integración" />
            <Picker.Item label="Redes" value="Redes" />
          </Picker>

          <Picker selectedValue={idTribu} onValueChange={value => setIdTribu(value)}>
            <Picker.Item label="Seleccionar tribu" value={0} />
            {tribusOrdenadas.map(t => (
              <Picker.Item
                key={t.id_tribu}
                label={t.nombre}
                value={Number(t.id_tribu)}
              />
            ))}
          </Picker>

          <Text style={styles.pickerLabel}>Tribu secundaria</Text>
          <Picker selectedValue={idTribuSecundaria} onValueChange={value => setIdTribuSecundaria(value)}>
            <Picker.Item label="Ninguna" value={0} />
            {tribusOrdenadas
              .filter(t => Number(t.id_tribu) !== idTribu)
              .map(t => (
                <Picker.Item
                  key={t.id_tribu}
                  label={t.nombre}
                  value={Number(t.id_tribu)}
                />
              ))}
          </Picker>

          <View style={styles.buttons}>
            <TouchableOpacity onPress={onClose} style={styles.cancel}>
              <Text>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={guardarCambios} style={styles.save}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Guardar</Text>
            </TouchableOpacity>

            {/* ELIMINAR */}
            <TouchableOpacity onPress={eliminarDirigente} style={styles.delete}>
              <Text style={styles.deleteText}>Eliminar dirigente</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFF3E0',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFA726',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  cancel: {
    marginTop: 20,
    padding: 10,
  },
  save: {
    padding: 10,
    backgroundColor: '#FFA726',
    borderRadius: 10,
    marginTop: 20,
  },
  delete: {
    marginTop: 20,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FFE5E5',
    alignItems: 'center',
  },
  deleteText: {
    color: '#C0392B',
    fontWeight: 'bold',
  },
  pickerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginTop: 4,
    marginBottom: 2,
    marginLeft: 2,
  },
});