import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function TribuCard({ tribu, onSumar, onRestar }) {
  const tribusTextoBlanco = [
  'Zabulón',
  'Dan',
  'Gad',
  'Benjamín',
  'Isacar',
  'Rubén',
];
const textoBlanco = tribusTextoBlanco.includes(tribu.nombre);

  return (
    <View style={[styles.card, { backgroundColor: tribu.color_hex }]}>
      <TouchableOpacity onPress={onRestar}>
        <Text style={[styles.btn, { color: textoBlanco ? '#fff' : '#000' }]}>−</Text>
      </TouchableOpacity>

      <View style={styles.center}>
        <Text style={[styles.nombre, { color: textoBlanco ? '#fff' : '#000' }]}>{tribu.nombre}</Text>
        <Text style={[styles.puntos, { color: textoBlanco ? '#fff' : '#000' }]}>{tribu.puntos}</Text>
      </View>

      <TouchableOpacity onPress={onSumar}>
        <Text style={[styles.btn, { color: textoBlanco ? '#fff' : '#000' }]}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  center: {
    alignItems: 'center',
  },
  nombre: {
    color: '#ff0000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  puntos: {
    color: '#ff0000',
    fontSize: 14,
  },
  btn: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
  },
});
