import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AsistenciaDirisModal({
  visible,
  onClose,
  onOpenQr,
  onOpenCodigo,
  onGoToAsistenciaDiris,
}) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          
          <View style={styles.headerRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="checkbox-outline" size={24} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalBoxTitle}>Asistencia de Dirigentes</Text>
              <Text style={styles.modalBoxSub}>Toma o verifica el registro actual</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeIconBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#475569" />
            </TouchableOpacity>
          </View>

          {/* Opciones de tomar asistencia (QR / Código) */}
          <View style={styles.qrCodeRow}>
            <TouchableOpacity 
              style={styles.btnQR} 
              onPress={() => {
                onClose();
                onOpenQr();
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="qr-code-outline" size={22} color="#B45309" />
              <Text style={styles.btnTextOrange}>Escanear QR</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.btnCodigo} 
              onPress={() => {
                onClose();
                onOpenCodigo();
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="keypad-outline" size={22} color="#1E293B" />
              <Text style={styles.btnTextDark}>Ingresar código</Text>
            </TouchableOpacity>
          </View>

          {/* Botón para ver/verificar asistencia general de diris */}
          <TouchableOpacity 
            style={styles.btnVerAsistencia} 
            onPress={() => {
              onClose();
              onGoToAsistenciaDiris();
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="calendar-outline" size={18} color="#B45309" />
            <Text style={styles.btnTextOrange}>Asistencia Dirigentes</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1, 
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#FFFFFF', 
    borderRadius: 20,
    padding: 22, 
    width: '100%', 
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalBoxTitle: { 
    fontWeight: '700', 
    fontSize: 16, 
    color: '#1E293B',
  },
  modalBoxSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeIconBtn: {
    backgroundColor: '#F1F5F9',
    padding: 6,
    borderRadius: 10,
  },
  qrCodeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  btnQR: {
    flex: 1,
    backgroundColor: '#FEF3C7',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  btnCodigo: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  btnVerAsistencia: {
    width: '100%',
    backgroundColor: '#FEF3C7',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  btnTextDark: {
    textAlign: 'center',
    color: '#1E293B',
    fontWeight: '700',
    fontSize: 13,
  },
  btnTextOrange: {
    textAlign: 'center',
    color: '#B45309',
    fontWeight: '700',
    fontSize: 13,
  },
});