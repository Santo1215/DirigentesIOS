import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ExoditoItem({
  exodito,
  modo = 'vista',
  presente = false,
  onPress,
  navigation
}) {
  const cargo = exodito?.cargo || 'Exodito';

  const icono = {
    Jefe: 'triangle',
    Subjefe: 'triangle-outline',
    Líder: 'ellipse-outline',
  }[cargo];

  return (
    <TouchableOpacity
      disabled={modo === 'vista'}
      onPress={onPress}
      style={[
        styles.item,
        modo === 'asistencia' && presente && styles.presente,
      ]}
    >
      <Text style={styles.nombre}>{exodito.nombre} {exodito.apellido}</Text>

      <Ionicons
        name={icono}
        size={20}
        color="#000"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    backgroundColor: '#9CA0A6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nombre: {
    color: '#000',
    fontWeight: '500',
    textAlign: 'right',
    fontSize: 16,

  },
  presente: {
    backgroundColor: '#9BE29B',
  },
});
