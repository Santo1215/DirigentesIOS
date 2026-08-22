import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ModalCalificacionAsamblea from './ModalCalificacionAsamblea'; // Ajusta la ruta si es necesario

export default function BotonCalificarAsamblea({ asamblea, idDirigente, onCalificado, style }) {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={[styles.botonCalificar, style]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="star" size={16} color="#FFF" style={{ marginRight: 6 }} />
        <Text style={styles.textoBoton}>Calificar</Text>
      </TouchableOpacity>

      <ModalCalificacionAsamblea
        visible={modalVisible}
        asamblea={asamblea}
        idDirigente={idDirigente}
        onClose={() => setModalVisible(false)}
        onCalificado={() => {
          if (onCalificado) onCalificado();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  botonCalificar: {
    flexDirection: 'row',
    backgroundColor: '#2660ffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  textoBoton: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});