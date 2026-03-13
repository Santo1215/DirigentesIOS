import { Modal, View, Text, TouchableOpacity, StyleSheet, Button, Alert } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useEffect, useState } from 'react';
import { API_URL } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function QrScannerModal({ visible, onClose, user }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);



const onScan = async ({ data }) => {
  if (scanned) return;
  setScanned(true);

  try {
    const token = await AsyncStorage.getItem('token');

    if (!token) {
      Alert.alert('Error', 'Token no encontrado');
      setScanned(false);
      return;
    }

    const res = await fetch(`${API_URL}/asistencia/qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        codigo_qr: data,
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      Alert.alert('Error', JSON.stringify(result));
      setScanned(false);
      return;
    }

    Alert.alert('Éxito', 'Asistencia registrada correctamente');
    onClose();
  } catch (error) {
    Alert.alert('Error', 'Error de conexión');
    setScanned(false);
  }
};



  if (hasPermission === null) {
    return <Text>Solicitando permisos…</Text>;
  }

  if (hasPermission === false) {
    return <Text>No hay permiso para la cámara</Text>;
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <Text style={styles.title}>Escanear QR</Text>

        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={scanned ? undefined : onScan}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />

        {scanned && (
          <Button title="Escanear de nuevo" onPress={() => setScanned(false)} />
        )}

        <TouchableOpacity style={styles.btnClose} onPress={onClose}>
          <Text style={{ color: '#fff' }}>Cerrar</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#fff',
    zIndex: 1,
  },
  btnClose: {
    top:300,
    bottom: 0,
    backgroundColor: '#F5A300',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    zIndex: 1,
  },
});
