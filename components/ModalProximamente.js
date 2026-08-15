import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../api';
import { useContext } from 'react';
import { UserContext } from '../context/UserContext';

export default function ModalProximamente({ visible, onClose }) {
  const { user } = useContext(UserContext);
  const { rol } = user.dirigente;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>
            Próximamente
          </Text>
          <Image
            source={require('../assets/ingeniero.jpg')}
            style={styles.trabajando}
            resizeMode="cover"
          />
          <Text style={styles.texto}>
            ¡Trabajando duro para algo increíble!
          </Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Entendido</Text>
          </TouchableOpacity>
        </View>
      </View>

    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#e67e22',
  },
  fecha: {
    color: '#555',
    marginTop: 4,
  },
  texto: {
    color: '#888',
    fontSize: 13,
    marginTop: 4,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  closeBtn: {
    marginTop: 20,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FFA726',
    borderRadius: 12,
  },
  trabajando: {
    width: 200,
    height: 250,
    alignSelf: 'center',
  }
});
