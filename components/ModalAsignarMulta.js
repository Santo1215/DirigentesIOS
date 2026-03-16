import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { API_URL } from '../api';
import { Picker } from '@react-native-picker/picker';

export default function ModalAsignarMulta({
  visible,
  onClose,
  token,
  onSuccess,
}) {
  const [dirigentes, setDirigentes] = useState([]);
  const [dirigenteId, setDirigenteId] = useState(null);
  const [monto, setMonto] = useState('');
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!visible) return;

    const cargarDirigentes = async () => {
      try {
        const res = await fetch(`${API_URL}/dirigentes`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (res.ok) setDirigentes(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    cargarDirigentes();
  }, [visible]);

  const asignarMulta = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!dirigenteId || !monto || !motivo) {
      setErrorMsg('Todos los campos son obligatorios');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/multas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id_dirigente: dirigenteId,
          monto: Number(monto),
          motivo,
        }),
      });

      if (!res.ok) {
        setErrorMsg('No se pudo asignar la multa');
        return;
      }

      setSuccessMsg('Multa asignada correctamente');
      setTimeout(() => {
        setSuccessMsg('');
        onSuccess();
        onClose();
      }, 1200);
    } catch {
      setErrorMsg('No se pudo asignar la multa');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Asignar multa</Text>

          {loading && <Text>Cargando dirigentes...</Text>}

        <View style={styles.pickerContainer}>
            <Picker
                selectedValue={dirigenteId}
                onValueChange={(value) => setDirigenteId(value)}>
                <Picker.Item label="Selecciona un dirigente" value={null} />

                {dirigentes.map((d) => (
                <Picker.Item
                    key={d.id_dirigente}
                    label={`${d.nombre} ${d.apellido}`}
                    value={d.id_dirigente}
                />
                ))}
            </Picker>
        </View>

        <Picker selectedValue={motivo} onValueChange={setMotivo}>
            <Picker.Item label="Seleccionar motivo" value="" />
            <Picker.Item label="Retraso" value="Retraso" />
            <Picker.Item label="Inasistencia injustificada" value="Inasistencia injustificada" />
            <Picker.Item label="Símbolos" value="Símbolos" />
            <Picker.Item label="Incumplimiento de tareas" value="Incumplimiento de tareas" />
        </Picker>       
         
          <TextInput
            style={styles.input}
            placeholder="Monto"
            keyboardType="numeric"
            value={monto}
            onChangeText={setMonto}
          />

          

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
          {successMsg ? <Text style={styles.successText}>{successMsg}</Text> : null}

          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancel}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={asignarMulta}>
              <Text style={styles.confirm}>Asignar</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    },
    modal: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    },
    title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    },
    dirigenteBtn: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    },
    dirigenteActivo: {
    backgroundColor: '#D3DBEE',
    },
    input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
    },
    actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    },
    cancel: {
    color: 'red',
    fontWeight: 'bold',
    },
    confirm: {
    color: 'green',
    fontWeight: 'bold',
    },
    errorText: {
    color: '#e74c3c',
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
    },
    successText: {
    color: '#27ae60',
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
    fontWeight: '600',
    },
});