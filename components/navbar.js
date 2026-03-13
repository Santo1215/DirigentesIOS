import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BottomNav({ navigation }) {
  const { user } = useContext(UserContext);
  const insets = useSafeAreaInsets();

  if (!user) return null;
  const { rol, comite } = user.dirigente;

  return (
    <View style={[styles.navbar, { paddingBottom: Math.max(insets.bottom, 8) }]}>

      <NavItem icon="home" label="Inicio" onPress={() => navigation.navigate('Home')} />

      <NavItem icon="flag" label="Tribu" onPress={() => navigation.navigate('Tribu')} />
      {/* SOLO COMITÉ ASISTENCIA */}
      {comite === 'Asistencia' && (
        <NavItem icon="bookmark" label="Asistencia" onPress={() => navigation.navigate('AsistenciaTribus')} />
      )}
      {/* SOLO COMITÉ DE PUNTOS */}
      {comite === 'Puntos' && (
        <NavItem icon="star" label="Puntos" onPress={() => navigation.navigate('Puntos')} />
      )}

      <NavItem icon="wallet" label="Multas" onPress={() => navigation.navigate('Multas')} />

      {/* SOLO COORDINACIÓN*/}
      {rol === 'Coordinación' && (
        <NavItem icon="man" label="Diris" onPress={() => navigation.navigate('Diris')} />
      )}

      <NavItem icon="menu" label="Menú" onPress={() => navigation.navigate('Menu')} />

    </View>
  );
}

function NavItem({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <Ionicons name={icon} size={24} color="#000" />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    paddingHorizontal: 8,
    backgroundColor: '#FFA24C',
  },
  item: {
    alignItems: 'center',
    paddingBottom: 4,
  },
  label: {
    fontSize: 12,
  },
});
