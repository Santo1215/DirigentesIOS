import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../context/UserContext';
import BottomNav from '../components/navbar';
import QRCode from 'react-native-qrcode-svg';
import { API_URL } from '../api';

const AVATAR_FALLBACK = `${API_URL}/uploads/dirigentes/Avatar.jpg`;

function Avatar({ foto }) {

  let uri = AVATAR_FALLBACK;

  if (foto) {

    const fotoParsed = foto.replace(/\\/g, '/');

    if (fotoParsed.startsWith('http')) {
      uri = fotoParsed;
    } else {
      uri = `${API_URL}/${fotoParsed.replace(/^\/+/, '')}`;
    }

  }
  
  return (
    <Image
      source={{ uri }}
      style={styles.avatar}
      resizeMode="cover"
      onError={() => console.log("Error cargando imagen")}
    />
  );
}

export default function Home({ route, navigation }) {
  const { user } = useContext(UserContext);
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarQR = async () => {
      try {
        const res = await fetch(`${API_URL}/dirigente/${user.dirigente.id_dirigente}/qr`);
        const data = await res.json();
        if (res.ok) setQr(data.codigo_qr);
      } catch (error) {
        console.error('Error cargando QR:', error);
      } finally {
        setLoading(false);
      }
    };
    cargarQR();
  }, [user]);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Éxodo Juan Pablo II</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{user.dirigente.codigo}</Text>
        </View>
      </View>

      {/* FONDO CURVO */}
      <View style={styles.curvedBackground}>
        {user.dirigente.segundo_nombre !== null && (
          <Text style={styles.nombre}>
            {user.dirigente.nombre} {user.dirigente.segundo_nombre} {user.dirigente.apellido}
          </Text>)}
        {user.dirigente.segundo_nombre === null && (
          <Text style={styles.nombre}>
            {user.dirigente.nombre} {user.dirigente.apellido}
          </Text>)}
        <Text style={styles.roleText}>{user.dirigente.rol}</Text>
        <Text style={styles.comiteText}>Comité {user.dirigente.comite || 'N/A'}</Text>
        <View style={styles.rectangle} />
      </View>

      {/* CONTENIDO PRINCIPAL */}
      <View style={styles.content}>
        <Avatar foto={user.dirigente.foto} />


        {/* QR */}
        <View style={styles.qrContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#F5A300" />
          ) : qr ? (
            <QRCode
              value={qr}
              size={180}
              backgroundColor="white"
              color="#000"
            />
          ) : (
            <Text style={styles.noQRText}>No hay QR disponible</Text>
          )}
        </View>
      </View>

      {/* NAVBAR */}
      <BottomNav user={user} navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#FFA24C',
    height: 80,
    justifyContent: 'center',
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  badge: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Fondo curvo
  curvedBackground: {
    position: 'absolute',
    top: 60, // Justo debajo del header
    left: 0,
    right: 0,
    height: 200,
    zIndex: 0,
    overflow: 'hidden',
    marginTop: 20,
  },
  rectangle: {
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    backgroundColor: '#FFA24C',
  },
  // Contenido
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
    zIndex: 2,
  },
  avatar: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 10,
    borderColor: '#fff',
    marginTop: 80,
    marginBottom: 15,
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  nombre: {
    fontSize: 30,
    fontWeight: 'bold',
    backgroundColor: '#FFA24C',
    textAlign: 'center',
  },
  roleText: {
    fontSize: 20,
    backgroundColor: '#FFA24C',
    textAlign: 'center',
  },
  comiteText: {
    fontSize: 20,
    backgroundColor: '#FFA24C',
    textAlign: 'center',
  },
  qrContainer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  noQRText: {
    color: '#999',
    fontSize: 16,
  },
});