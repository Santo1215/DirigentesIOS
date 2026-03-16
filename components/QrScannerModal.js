import { Modal, View, Text, TouchableOpacity, StyleSheet, Button, Alert, Platform } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { API_URL } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Solo se importa en móvil para evitar errores en web
let CameraView, Camera;
if (Platform.OS !== 'web') {
  const expoCamera = require('expo-camera');
  CameraView = expoCamera.CameraView;
  Camera = expoCamera.Camera;
}

export default function QrScannerModal({ visible, onClose, user }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const html5QrRef = useRef(null);
  const scannerStarted = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      (async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
      })();
    } else {
      setHasPermission(true);
    }
  }, []);

  // Iniciar / detener escáner web cuando el modal abre o cierra
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    if (visible) {
      setTimeout(() => iniciarEscanerWeb(), 300);
    } else {
      detenerEscanerWeb();
    }

    return () => {
      detenerEscanerWeb();
    };
  }, [visible]);

  const iniciarEscanerWeb = async () => {
    if (scannerStarted.current) return;
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      html5QrRef.current = new Html5Qrcode('qr-reader');
      await html5QrRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (!scannerStarted.current) return;
          onScan({ data: decodedText });
        },
        () => {}
      );
      scannerStarted.current = true;
    } catch (err) {
      console.error('Error iniciando escáner web:', err);
    }
  };

  const detenerEscanerWeb = async () => {
    if (!scannerStarted.current || !html5QrRef.current) return;
    try {
      await html5QrRef.current.stop();
      html5QrRef.current.clear();
    } catch (_) {}
    scannerStarted.current = false;
    setScanned(false);
  };

  const onScan = async ({ data }) => {
    if (scanned) return;
    setScanned(true);
    if (Platform.OS === 'web') detenerEscanerWeb();

    try {
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        mostrarError('Token no encontrado');
        setScanned(false);
        return;
      }

      const res = await fetch(`${API_URL}/asistencia/qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ codigo_qr: data }),
      });

      const result = await res.json();
      if (!res.ok) {
        mostrarError(JSON.stringify(result));
        setScanned(false);
        if (Platform.OS === 'web') iniciarEscanerWeb();
        return;
      }

      mostrarExito('Asistencia registrada correctamente');
      onClose();
    } catch (error) {
      mostrarError('Error de conexión');
      setScanned(false);
      if (Platform.OS === 'web') iniciarEscanerWeb();
    }
  };

  const mostrarError = (msg) => {
    if (Platform.OS === 'web') {
      window.alert('Error: ' + msg);
    } else {
      Alert.alert('Error', msg);
    }
  };

  const mostrarExito = (msg) => {
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Éxito', msg);
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

        {/* ESCÁNER MÓVIL */}
        {Platform.OS !== 'web' && CameraView && (
          <CameraView
            style={StyleSheet.absoluteFillObject}
            onBarcodeScanned={scanned ? undefined : onScan}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          />
        )}

        {/* ESCÁNER WEB */}
        {Platform.OS === 'web' && (
          <View style={styles.webScannerWrapper}>
            <div id="qr-reader" style={{ width: 300, height: 300 }} />
            {scanned && (
              <TouchableOpacity
                style={styles.btnRescan}
                onPress={() => {
                  setScanned(false);
                  iniciarEscanerWeb();
                }}
              >
                <Text style={{ color: '#000', fontWeight: 'bold' }}>
                  Escanear de nuevo
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Botón "escanear de nuevo" en móvil */}
        {Platform.OS !== 'web' && scanned && (
          <Button title="Escanear de nuevo" onPress={() => setScanned(false)} />
        )}

        <TouchableOpacity
          style={styles.btnClose}
          onPress={() => {
            if (Platform.OS === 'web') detenerEscanerWeb();
            onClose();
          }}
        >
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
    backgroundColor: '#000',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#fff',
    zIndex: 1,
  },
  webScannerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  btnRescan: {
    marginTop: 12,
    backgroundColor: '#FFD685',
    padding: 12,
    borderRadius: 20,
  },
  btnClose: {
    marginTop: 20,
    backgroundColor: '#F5A300',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    zIndex: 1,
    minWidth: 120,
  },
});
