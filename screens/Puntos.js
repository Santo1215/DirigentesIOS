import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useEffect, useState, useContext } from 'react';
import TribuCard from '../components/TribuCard';
import BottomNav from '../components/navbar';
import { API_URL } from '../api';
import WaveBackground from '../components/WaveBackground';
import { UserContext } from '../context/UserContext';
import ModalProximamente from '../components/ModalProximamente';

export default function Puntos({ navigation }) {
  const { user } = useContext(UserContext);
  const [tribus, setTribus] = useState([]);
  const [cantidad, setCantidad] = useState(5);
  const [modalProximamenteVisible, setModalProximamenteVisible] = useState(false);
  
  if (!user) return null;
  const { rol, comite, id_dirigente } = user.dirigente;
  const canEdit = comite === 'Puntos';
  

  const sumarPuntos = async (idTribu) => {
    const puntosFinales = await actualizarPuntosBD(idTribu, cantidad);
    if (puntosFinales === null) return;
    setTribus(prev =>
      prev.map(t =>
        t.id_tribu === idTribu
          ? { ...t, puntos: puntosFinales }
          : t
      )
    );
  };


  const restarPuntos = async (idTribu) => {
    const puntosFinales = await actualizarPuntosBD(idTribu, -cantidad);
    if (puntosFinales === null) return;
    setTribus(prev =>
      prev.map(t =>
        t.id_tribu === idTribu
          ? { ...t, puntos: Math.max(0, t.puntos - cantidad) }
          : t
      )
    );
  };


  useEffect(() => {
    cargarTribus();
  }, []);

  const cargarTribus = async () => {
    const res = await fetch(`${API_URL}/tribus`);
    const data = await res.json();
    setTribus(data);
  };
  const actualizarPuntosBD = async (idTribu, puntos) => {
    try {
      const res = await fetch(`${API_URL}/tribu/puntos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_tribu: idTribu,
          puntos,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Error al actualizar puntos');
        return null;
      }

      return data.puntos;
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
      return null;
    }
  };


  return (
    <View style={styles.container}>
      <WaveBackground />
      <View style={styles.titleBox}>
        <Text style={styles.title}>Puntos</Text>
      </View>

      {/* Selector cantidad - solo comité Puntos */}
      {canEdit && (
        <View style={styles.selector}>
          <TouchableOpacity onPress={() => setCantidad(Math.max(1, cantidad - 1))}>
            <Text style={styles.selectorBtn}>−</Text>
          </TouchableOpacity>

          <Text style={styles.selectorText}>{cantidad}</Text>

          <TouchableOpacity onPress={() => setCantidad(cantidad + 1)}>
            <Text style={styles.selectorBtn}>+</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.grid}>
        {tribus.map((tribu) => (
          <TribuCard
            key={tribu.id_tribu}
            tribu={tribu}
            onSumar={canEdit ? () => sumarPuntos(tribu.id_tribu) : null}
            onRestar={canEdit ? () => restarPuntos(tribu.id_tribu) : null}
          />
        ))}
      </ScrollView>
      {comite != 'Puntos' && (
      <View style={styles.contenedorsugerir}>
                <TouchableOpacity onPress={() => setModalProximamenteVisible(true)}>
                  <Text style={styles.sugerir}>Sugerir Puntos</Text>
                </TouchableOpacity>
        </View>
      )}

        <ModalProximamente 
        visible={modalProximamenteVisible} 
        onClose={() => setModalProximamenteVisible(false)} 
      />  
      <BottomNav navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  titleBox: {
    backgroundColor: '#1E2F57',
    borderRadius: 30,
    margin: 20,
    paddingVertical: 14,
  },
  title: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },

  selector: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignItems: 'center',
    marginBottom: 10,
  },
  selectorBtn: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 10,
  },
  selectorText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  grid: {
    padding: 20,
    paddingBottom: 100,
  },
  contenedorsugerir: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop:2,
    marginBottom: 2,
  },
  sugerir: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 20,
    backgroundColor: '#22335D',
    padding: 10,
    paddingHorizontal: 30,
    borderRadius: 50,
  },
});
