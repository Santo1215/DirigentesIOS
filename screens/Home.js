import { View, Text, StyleSheet } from 'react-native';

export default function Home({ route }) {
  const { nombre, apellido } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Bienvenido</Text>
      <Text style={styles.name}>{nombre} {apellido}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#aaa',
    fontSize: 22,
  },
  name: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 10,
  },
});
