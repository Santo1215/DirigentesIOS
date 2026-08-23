import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Image } from 'react-native';
import BottomNav from '../components/navbar';
import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../context/UserContext';
import { API_URL } from '../api';
import DirigenteModal from '../components/DirigenteModal';
import SectionTitle from '../components/TituloSeccion';
import WaveBackground from '../components/WaveBackground';
import QrScannerModal from '../components/QrScannerModal';
import CodigoManualModal from '../components/CodigoManualModal';
import AsistenciaDirisModal from '../components/AsistenciaDirisModal';
import { Ionicons } from '@expo/vector-icons';

export default function Diris({ navigation }) {
  const { user } = useContext(UserContext);
  const [dirigentes, setDirigentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDirigente, setSelectedDirigente] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);
  const [codigoVisible, setCodigoVisible] = useState(false);
  const [asistenciaModalVisible, setAsistenciaModalVisible] = useState(false);
  const [errorCarga, setErrorCarga] = useState('');

  useEffect(() => {
    cargarDirigentes();
  }, []);

  const cargarDirigentes = async () => {
    try {
      const res = await fetch(`${API_URL}/dirigentes`);
      const data = await res.json();
      if (!res.ok) throw new Error('Error al cargar');
      setDirigentes(data);
    } catch (error) {
      console.error(error);
      setErrorCarga('No se pudieron cargar los dirigentes');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const nombreCompleto = item.segundo_nombre 
      ? `${item.nombre} ${item.segundo_nombre} ${item.apellido}`
      : `${item.nombre} ${item.apellido}`;

    return (
      <TouchableOpacity
        style={styles.itemCard}
        onPress={() => {
          setSelectedDirigente(item);
          setModalVisible(true);
        }}
        activeOpacity={0.85}
      >
        {/* Contenedor de la foto o icono por defecto */}
        <View style={styles.itemIconWrapper}>
          {item.foto ? (
            <Image source={{ uri: item.foto }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person-outline" size={20} color="#D97706" />
          )}
        </View>

        <View style={styles.itemTextContainer}>
          <Text style={styles.nombre}>{nombreCompleto}</Text>
          <Text style={styles.rol}>{item.rol}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <WaveBackground style={{ pointerEvents: 'none' }} />
      <SectionTitle title='Dirigentes' />

      {errorCarga ? (
        <Text style={styles.errorText}>{errorCarga}</Text>
      ) : null}

      <View style={styles.listContainer}>
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#D97706" />
          </View>
        ) : (
          <FlatList
            data={dirigentes}
            keyExtractor={(item) => item.id_dirigente.toString()}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
          />
        )}

        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={styles.btnAgregar} 
            onPress={() => navigation.navigate('CrearDiri')}
            activeOpacity={0.85}
          >
            <Ionicons name="person-add-outline" size={18} color="#1E293B" />
            <Text style={styles.btnTextDark}>Agregar dirigente</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={styles.btnAbrirModal} 
            onPress={() => setAsistenciaModalVisible(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="calendar-outline" size={18} color="#B45309" />
            <Text style={styles.btnTextOrange}>Gestionar Asistencia</Text>
          </TouchableOpacity>
        </View>
      </View>

      <DirigenteModal 
        visible={modalVisible} 
        dirigente={selectedDirigente}
        onClose={() => setModalVisible(false)} 
        onSaved={cargarDirigentes} 
      />

      <AsistenciaDirisModal
        visible={asistenciaModalVisible}
        onClose={() => setAsistenciaModalVisible(false)}
        onOpenQr={() => setQrVisible(true)}
        onOpenCodigo={() => setCodigoVisible(true)}
        onGoToAsistenciaDiris={() => navigation.navigate('AsistenciaDiris')}
      />

      <QrScannerModal visible={qrVisible} onClose={() => setQrVisible(false)} user={user} />
      <CodigoManualModal visible={codigoVisible} onClose={() => setCodigoVisible(false)} user={user} />
      
      <BottomNav user={user} navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC', 
    paddingTop: 30 
  },
  card: {
    margin: 20,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    color: '#1E293B',
    textAlign: 'center',
  },
  btnAbrirModal: {
    flex: 1,
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
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    marginBottom: 6,
  },
  btnAgregar: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  btnTextDark: {
    textAlign: 'center',
    color: '#1E293B',
    fontWeight: '700',
    fontSize: 14,
  },
  btnTextOrange: {
    textAlign: 'center',
    color: '#B45309',
    fontWeight: '700',
    fontSize: 14,
  },
  listContainer: {
    marginHorizontal: 20,
    marginTop: 5,
    flex: 1,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  itemIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  itemTextContainer: {
    flex: 1,
  },
  nombre: {
    fontWeight: '700',
    fontSize: 15,
    color: '#1E293B',
    marginBottom: 2,
  },
  rol: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '400',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginHorizontal: 20,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
});