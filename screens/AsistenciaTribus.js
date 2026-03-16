import { useEffect, useState } from 'react';
import {
  View, Text, SectionList, ActivityIndicator,
  StyleSheet, TouchableOpacity, Modal, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../api';
import BottomNav from '../components/navbar';
import WaveBackground from '../components/WaveBackground';

let DateTimePicker = null;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

const getFechaLocal = () => {
  const ahora = new Date();
  const y = ahora.getFullYear();
  const m = String(ahora.getMonth() + 1).padStart(2, '0');
  const d = String(ahora.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const parseFechaLocal = (fechaStr) => {
  const [y, m, d] = fechaStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export default function AsistenciaTribusScreen({ navigation }) {
  const [fecha, setFecha] = useState(getFechaLocal());
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarPicker, setMostrarPicker] = useState(false);
  const [token, setToken] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('token').then(setToken);
  }, []);

  useEffect(() => {
    if (token) cargarAsistencia();
  }, [fecha, token]);

  /* ===============================
     Helpers
  =============================== */

  const estadoColor = (estado) => {
    if (estado === 'Presente') return '#4CAF50';
    if (estado === 'Ausente') return '#F44336';
    return '#F44336';
  };
  const TRIBU_COLORS = {
    Judá: { bg: '#57B9FF', text: 'black' },
    Levi: { bg: '#ED2100', text: 'black' },
    Zabulón: { bg: '#002A85', text: 'white' },
    Dan: { bg: '#000000', text: 'white' },
    Aser:{bg:'#88E788',text:'black'},
    Gad:{bg:'#0F3D3E',text:'white'},
    Simeón:{bg:'#40E0D0',text:'black'},
    Neftalí:{bg:'#FF891B',text:'black'},
    Benjamín:{bg:'#960D32',text:'white'},
    José:{bg:'#D7D7D7',text:'black'},
    Isacar:{bg:'#A745D6',text:'white'},
    Rubén:{bg:'#06402B',text:'white'},
  };

  const getTribuColors = (tribu) => {
    return TRIBU_COLORS[tribu] || { bg: '#EEEEEE', text: '#333' };
  };


  /* ===============================
     Backend
  =============================== */

  const cargarAsistencia = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/asistencia/exoditos/${fecha}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const json = await res.json();

      // Agrupar por tribu → SectionList
      const agrupado = {};
      json.forEach(item => {
        if (!agrupado[item.tribu]) agrupado[item.tribu] = [];
        agrupado[item.tribu].push(item);
      });

      const sectionsFormateadas = Object.keys(agrupado).map(tribu => ({
        title: tribu,
        data: agrupado[tribu],
      }));

      setSections(sectionsFormateadas);
    } finally {
      setLoading(false);
    }
  };
  // ===============================
  // Stats globales
  // ===============================

  const todos = sections.flatMap(s => s.data);

  const presentes = todos.filter(e => e.estado === 'Presente').length;
  const ausentes = todos.filter(e => e.estado ==='Ausente').length;
  const total = presentes;

  /* ===============================
     Loading
  =============================== */

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FFA726" />
        <Text style={styles.loadingText}>Cargando asistencia...</Text>
      </View>
    );
  }

  /* ===============================
     UI
  =============================== */

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Asistencia por tribu</Text>
          <Text style={styles.date}>{fecha}</Text>

          <TouchableOpacity onPress={() => setMostrarPicker(true)}>
            <Text style={{ color: '#fff', marginTop: 5 }}>
              Cambiar fecha
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{presentes}</Text>
          <Text style={styles.statLabel}>Presentes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, styles.absentNumber]}>
            {ausentes}
          </Text>
          <Text style={styles.statLabel}>Ausentes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {/* Lista por tribu */}
      <SectionList
        style={{zIndex: 2}}
        sections={sections}
        keyExtractor={(item) => item.id_exodito.toString()}
        contentContainerStyle={{ paddingBottom: 80 }}
        renderSectionHeader={({ section }) => {
          const { bg, text } = getTribuColors(section.title);

          const presentes = section.data.filter(e => e.estado === 'Presente').length;
          const ausentes = section.data.filter(e => e.estado === 'Ausente').length;
          const total = section.data.length;

          return (
            <View style={[
              styles.tribuHeader,
              { backgroundColor: bg }
            ]}>
              <Text style={[
                styles.tribuTitle,
                { color: text }
              ]}>
                {section.title}
              </Text>

              <View style={styles.tribuStats}>
                <Text style={[styles.tribuStat, { color: text }]}>Presentes: {presentes}</Text>
                <Text style={[styles.tribuStat, { color: text }]}>Ausentes: {ausentes}</Text>
                <Text style={[styles.tribuStat, { color: text }]}>Total: {total}</Text>
              </View>
            </View>
          );
        }}


        renderItem={({ item }) => (
          <View style={[ styles.card, 
            item.estado === 'Presente' ? styles.cardPresent: styles.cardAbsent]}>

            <Text style={styles.name}>
              {item.nombre} {item.apellido}
            </Text>

            <View style={styles.presentContainer}>
              <View style={[
                styles.statusBadge,
                { backgroundColor: estadoColor(item.estado) }
              ]}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                  {item.estado ? item.estado.toUpperCase() : 'AUSENTE'}
                </Text>
              </View>
            </View>
          </View>
        )}
      />

      {mostrarPicker && Platform.OS !== 'web' && DateTimePicker && (
        <DateTimePicker
          value={parseFechaLocal(fecha)}
          mode="date"
          maximumDate={new Date()}
          onChange={(e, d) => {
            setMostrarPicker(false);
            if (d) {
              const y = d.getFullYear();
              const m = String(d.getMonth() + 1).padStart(2, '0');
              const dd = String(d.getDate()).padStart(2, '0');
              setFecha(`${y}-${m}-${dd}`);
            }
          }}
        />
      )}
      {mostrarPicker && Platform.OS === 'web' && (
        <Modal transparent animationType="fade" visible={mostrarPicker} onRequestClose={() => setMostrarPicker(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 14 }}>Seleccionar fecha</Text>
              <input
                type="date"
                value={fecha}
                max={getFechaLocal()}
                onChange={(e) => { if (e.target.value) setFecha(e.target.value); }}
                style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid #ccc', marginBottom: 16 }}
              />
              <TouchableOpacity
                style={{ backgroundColor: '#FFA726', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25 }}
                onPress={() => setMostrarPicker(false)}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
      <WaveBackground />
      <BottomNav  navigation={navigation}/>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    backgroundColor: '#FFA726',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  date: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -10,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statCard: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  absentNumber: {
    color: '#F44336',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  cardPresent: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  cardAbsent: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  role: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  presentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  absentContainer: {
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  absentBadge: {
    backgroundColor: '#FFEBEE',
    marginBottom: 12,
  },
  statusText: {
    color: '#2E7D32',
    fontWeight: '500',
  },
  absentText: {
    color: '#C62828',
    fontWeight: '500',
  },
  details: {
    alignItems: 'flex-end',
  },
  detailText: {
    fontSize: 12,
    color: '#666',
  },
  listContent: {
    paddingBottom: 80,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  footerNote: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 8,
  },
  tribuHeader: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
    padding: 16,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  tribuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  tribuStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  tribuStat: {
    fontSize: 14,
    fontWeight: '600',
  },

tribuStatPresentes: {
  color: '#4CAF50',
  fontWeight: 'bold',
},

tribuStatAusentes: {
  color: '#F44336',
  fontWeight: 'bold',
},

tribuStatTotal: {
  color: '#555',
  fontWeight: 'bold',
},
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center',
  alignItems: 'center',
},
modalBox: {
  backgroundColor: '#fff',
  borderRadius: 16,
  padding: 24,
  width: '80%',
  alignItems: 'center',
},
}