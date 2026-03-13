import { View, Text, TouchableOpacity, StyleSheet, Alert, FlatList } from 'react-native';
import BottomNav from '../components/navbar';
import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../context/UserContext';
import { API_URL } from '../api';
import DirigenteModal from '../components/DirigenteModal';
import SectionTitle from '../components/TituloSeccion';
import WaveBackground from '../components/WaveBackground';
import QrScannerModal from '../components/QrScannerModal';
import CodigoManualModal from '../components/CodigoManualModal';

export default function Diris({ navigation }) {
  const { user } = useContext(UserContext);
  const [dirigentes, setDirigentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDirigente, setSelectedDirigente] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);
  const [codigoVisible, setCodigoVisible] = useState(false);


  useEffect(() => {
    cargarDirigentes();
  }, []);
  

  const cargarDirigentes = async () => {
    try {
      const res = await fetch(`${API_URL}/dirigentes`);
      const data = await res.json();
      setDirigentes(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron cargar los dirigentes');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
  <TouchableOpacity
    style={styles.item}
    onPress={() => {
      setSelectedDirigente(item);
      setModalVisible(true);
    }}
  >
    {item.segundo_nombre !== null && (
            <Text style={styles.nombre}>
              {item.nombre} {item.segundo_nombre} {item.apellido}
            </Text>)}
            {item.segundo_nombre === null && (
            <Text style={styles.nombre}>
              {item.nombre} {item.apellido}
            </Text>)}
    <Text style={styles.rol}>{item.rol}</Text>
  </TouchableOpacity>
);


  return (
    <View style={styles.container}>
      <WaveBackground />
      {/* LISTA DIRIGENTES */}
      <SectionTitle title='Dirigentes' />
      <View style={styles.listContainer}>
        

        {loading ? (
          <Text>Cargando...</Text>
        ) : (
          <FlatList
            data={dirigentes}
            keyExtractor={(item) => item.id_dirigente.toString()}
            renderItem={renderItem}
          />
        )}
        <TouchableOpacity style={styles.btnAgregar} onPress={() =>  navigation.navigate('CrearDiri')}>
            <Text style={styles.btnText}>Agregar dirigente</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnAgregar, {backgroundColor: '#FFD685'}]} onPress={() =>  navigation.navigate('AsistenciaDiris')}>
            <Text style={styles.btnText}>Asistencia</Text>
          </TouchableOpacity>
      </View>
      {/* CARD ASISTENCIA */}
      <View style={styles.card}>
        <Text style={styles.title}>Tomar asistencia</Text>

        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity style={styles.btnQR} onPress={() => setQrVisible(true)}>
            <Text style={styles.btnText}>Escanear QR</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnCodigo} onPress={()=> setCodigoVisible(true)}>
            <Text style={styles.btnText}>Ingresar código</Text>
          </TouchableOpacity>
        </View>
      </View>

      
      <DirigenteModal visible={modalVisible} dirigente={selectedDirigente}
        onClose={() => setModalVisible(false)} onSaved={cargarDirigentes}/>
      <QrScannerModal visible={qrVisible} onClose={() => setQrVisible(false) }  user={user}/>
      <CodigoManualModal visible={codigoVisible} onClose={() => setCodigoVisible(false)} user={user}/>
      <BottomNav user={user} navigation={navigation} />
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', marginTop: 30 },
  card: {
    margin: 10,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  btnQR: {
    backgroundColor: '#FFD685',
    padding: 15,
    borderRadius: 30,
    width: '50%',
    marginBottom: 10,
  },
  btnCodigo: {
    backgroundColor: '#D3DBEE',
    padding: 15,
    borderRadius: 30,
    width: '50%',
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    
  },
  btnAgregar: {
    backgroundColor: '#D3DBEE',
    padding: 15,
    borderRadius: 30,
    width: '100%',
    marginBottom: 5,
    justifyContent: 'center',
    alignItems: 'center',
    
  },
  btnText: {
    textAlign: 'center',
    color: 'black',
    fontWeight: 'bold',
  },
  listContainer: {
  marginHorizontal: 20,
  marginTop: 5,
  flex: 1,
},
listTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  marginBottom: 10,
},
item: {
  backgroundColor: '#e0e0e0',
  padding: 15,
  borderRadius: 20,
  marginBottom: 10,
  flexDirection: 'row',
  justifyContent: 'space-between',
},
nombre: {
  fontWeight: 'bold',
},
rol: {
  color: '#555',
},

});
