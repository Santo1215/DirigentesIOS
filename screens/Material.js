import { useEffect, useState, useContext } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Platform, Alert, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../api';
import BottomNav from '../components/navbar';
import WaveBackground from '../components/WaveBackground';
import SectionTitle from '../components/TituloSeccion';
import { UserContext } from '../context/UserContext';

export default function InventarioScreen({ navigation }) {
  const { user } = useContext(UserContext);
  const [inventario, setInventario] = useState([]);
  const [dirigentes, setDirigentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Modal para agregar nuevo material
  const [modalVisible, setModalVisible] = useState(false);
  const [nombreMaterial, setNombreMaterial] = useState('');
  const [cantidad, setCantidad] = useState('');

  // Modal para acciones sobre material existente
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [cantEdit, setCantEdit] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem('token').then(setToken);
  }, []);

  useEffect(() => {
    if (token) {
      cargarInventario();
      cargarDirigentes();
    }
  }, [token]);

  const cargarInventario = async () => {
    try {
      const res = await fetch(`${API_URL}/materiales`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setInventario(data);
      } else {
        setInventario([]);
      }
    } catch (error) {
      console.error('Error al cargar inventario:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarDirigentes = async () => {
    try {
      const res = await fetch(`${API_URL}/dirigentes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setDirigentes(data);
    } catch (error) {
      console.error('Error al cargar dirigentes:', error);
    }
  };

  const guardarMaterial = async () => {
    const cantNum = parseInt(cantidad, 10);
    if (!nombreMaterial || isNaN(cantNum)) {
      const msg = 'Ingresa un nombre y una cantidad válida';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Error', msg);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/materiales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre_material: nombreMaterial,
          cantidad: cantNum,
          id_dirigente: user?.dirigente?.id_dirigente || null
        })
      });

      if (!res.ok) throw new Error('Error al registrar material');

      setNombreMaterial('');
      setCantidad('');
      setModalVisible(false);
      cargarInventario();
    } catch (error) {
      const msg = 'Error al registrar el material';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Error', msg);
    }
  };

const abrirAcciones = (item) => {
  const dirigenteActualId = user?.dirigente?.id_dirigente;

  // Si no hay un dirigente asignado o el ID no coincide con el usuario actual
  if (!dirigenteActualId || Number(item.id_dirigente) !== Number(dirigenteActualId)) {
    const msg = 'Solo el dirigente responsable puede gestionar este material';
    Platform.OS === 'web' ? alert(msg) : Alert.alert('Permiso denegado', msg);
    return;
  }

  setSelectedMaterial(item);
  setCantEdit(item.cantidad || 0);
  setActionModalVisible(true);
};

  const actualizarCantidad = async (nuevaCant) => {
    if (nuevaCant < 0) return;
    try {
      const res = await fetch(`${API_URL}/materiales/${selectedMaterial.id_material}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ cantidad: nuevaCant })
      });

      if (!res.ok) throw new Error();
      setCantEdit(nuevaCant);
      cargarInventario();
    } catch (error) {
      const msg = 'No se pudo actualizar la cantidad';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Error', msg);
    }
  };

  const transferirMaterial = async (idDirigenteNuevo) => {
    try {
      const res = await fetch(`${API_URL}/materiales/${selectedMaterial.id_material}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id_dirigente: idDirigenteNuevo })
      });

      if (!res.ok) throw new Error();
      setActionModalVisible(false);
      cargarInventario();
    } catch (error) {
      const msg = 'Error al reasignar el dirigente';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Error', msg);
    }
  };

  const eliminarMaterial = async () => {
    const ejecutarEliminacion = async () => {
      try {
        const res = await fetch(`${API_URL}/materiales/${selectedMaterial.id_material}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error();
        setActionModalVisible(false);
        cargarInventario();
      } catch (error) {
        const msg = 'No se pudo eliminar el material';
        Platform.OS === 'web' ? alert(msg) : Alert.alert('Error', msg);
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('¿Deseas eliminar este material del inventario?')) ejecutarEliminacion();
    } else {
      Alert.alert(
        'Eliminar Material',
        '¿Deseas eliminar este material del inventario?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: ejecutarEliminacion }
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <WaveBackground />

      <View style={{ marginTop: Platform.OS === 'ios' ? 40 : 15 }}>
        <SectionTitle 
          title="Inventario de Materiales" 
          showBackButton={true}
          onBackPress={() => navigation.goBack()} 
        />
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.addBtnText}>Agregar Material</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={inventario}
        keyExtractor={(item) => item.id_material?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => abrirAcciones(item)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.materialName}>{item.nombre_material}</Text>
              <Text style={styles.responsableText}>
                Responsable: {item.responsable && item.responsable.trim() !== '' ? item.responsable : 'No asignado'}
              </Text>
            </View>
            <View style={styles.badgeCantidad}>
              <Text style={styles.badgeText}>{item.cantidad} un.</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Modal para crear material */}
      <Modal transparent animationType="fade" visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Nuevo Material</Text>

            <TextInput
              style={styles.input}
              placeholder="Nombre del material"
              placeholderTextColor="#888"
              value={nombreMaterial}
              onChangeText={setNombreMaterial}
            />

            <TextInput
              style={styles.input}
              placeholder="Cantidad"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={cantidad}
              onChangeText={setCantidad}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={guardarMaterial}>
              <Text style={styles.saveBtnText}>Guardar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de acciones (Agregar/Quitar, Transferir, Eliminar) */}
      <Modal transparent animationType="slide" visible={actionModalVisible} onRequestClose={() => setActionModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>{selectedMaterial?.nombre_material}</Text>

            {/* Ajustar Cantidad */}
            <Text style={styles.subTitle}>Modificar Cantidad</Text>
            <View style={styles.counterRow}>
              <TouchableOpacity style={styles.counterBtn} onPress={() => actualizarCantidad(cantEdit - 1)}>
                <Ionicons name="remove" size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.counterValue}>{cantEdit}</Text>
              <TouchableOpacity style={styles.counterBtn} onPress={() => actualizarCantidad(cantEdit + 1)}>
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Reasignar Dirigente */}
            <Text style={[styles.subTitle, { marginTop: 15 }]}>Reasignar Dirigente</Text>
            <ScrollView style={styles.dirigenteList}>
              {dirigentes.map((dir) => (
                <TouchableOpacity
                  key={dir.id_dirigente}
                  style={[
                    styles.dirigenteItem,
                    selectedMaterial?.id_dirigente === dir.id_dirigente && styles.dirigenteSelected
                  ]}
                  onPress={() => transferirMaterial(dir.id_dirigente)}
                >
                  <Text style={styles.dirigenteName}>{dir.nombre} {dir.apellido}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Eliminar Material */}
            <TouchableOpacity style={styles.deleteBtn} onPress={eliminarMaterial}>
              <Ionicons name="trash-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.deleteBtnText}>Eliminar Material</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setActionModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BottomNav navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  actionRow: { paddingHorizontal: 16, marginBottom: 10 },
  addBtn: {
    backgroundColor: '#FFA726',
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  listContainer: { paddingHorizontal: 16, paddingBottom: 90 },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 2,
  },
  materialName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  responsableText: { fontSize: 13, color: '#666', marginTop: 3 },
  badgeCantidad: {
    backgroundColor: '#22335D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  badgeText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '88%',
    alignItems: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#22335D' },
  subTitle: { fontSize: 14, fontWeight: 'bold', color: '#555', alignSelf: 'flex-start', marginBottom: 8 },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  counterBtn: {
    backgroundColor: '#22335D',
    padding: 10,
    borderRadius: 10,
  },
  counterValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 20,
    color: '#333',
  },
  dirigenteList: {
    width: '100%',
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    marginBottom: 14,
  },
  dirigenteItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dirigenteSelected: {
    backgroundColor: '#e3f2fd',
  },
  dirigenteName: { fontSize: 14, color: '#333' },
  saveBtn: {
    backgroundColor: '#FFA726',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 6,
  },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  deleteBtn: {
    backgroundColor: '#e53935',
    flexDirection: 'row',
    width: '100%',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  deleteBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  cancelBtn: { marginTop: 10, paddingVertical: 6 },
  cancelBtnText: { color: '#666', fontSize: 14 },
});