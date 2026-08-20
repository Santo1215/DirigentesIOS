import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';

export default function FechaPicker({ fechaObj, onFechaChange }) {
  const [modalVisible, setModalVisible] = useState(false);

  // Formatea la fecha de forma segura a YYYY-MM-DD
  const fechaString = fechaObj instanceof Date && !isNaN(fechaObj) 
    ? fechaObj.toISOString().split('T')[0] 
    : new Date().toISOString().split('T')[0];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Fecha:</Text>
      
      {/* Botón que simula un input y abre el mini calendario */}
      <TouchableOpacity 
        style={styles.inputTouchable} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.inputText}>
          {fechaString}
        </Text>
      </TouchableOpacity>

      {/* Modal con el Mini Calendario Interactivo */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModalContent}>
            <Text style={styles.modalTitle}>Selecciona una fecha</Text>
            
            <Calendar
              current={fechaString}
              onDayPress={(day) => {
                onFechaChange(new Date(day.dateString + 'T12:00:00'));
                setModalVisible(false);
              }}
              markedDates={{
                [fechaString]: { selected: true, selectedColor: '#FFA726' }
              }}
              theme={{
                selectedDayBackgroundColor: '#FFA726',
                todayTextColor: '#FFA726',
                arrowColor: '#FFA726',
              }}
            />

            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  label: {
    color: '#555',
    marginBottom: 5,
    fontWeight: '500',
  },
  inputTouchable: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fafafa',
    justifyContent: 'center',
  },
  inputText: {
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModalContent: {
    width: '90%',
    maxWidth: 350,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  closeButton: {
    marginTop: 15,
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
});