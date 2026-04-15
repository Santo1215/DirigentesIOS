import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import BottomNav from '../components/navbar';
import SectionTitle from '../components/TituloSeccion';
import TotalCard from '../components/TotalCard';
import Row from '../components/Fila';
import WaveBackground from '../components/WaveBackground';
import ModalAsignarMulta from '../components/ModalAsignarMulta';
import ModalDetalleMultas from '../components/ModalDetalleMultas';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useContext } from 'react';
import { UserContext } from '../context/UserContext'; 
import { useEffect, useState } from 'react';
import { API_URL } from '../api';

export default function Multas({ navigation }) {
  const { user } = useContext(UserContext);
  const [resumen, setResumen] = useState([]);
  const [dirigentes, setDirigentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const rol = user?.dirigente?.rol;
  const [modalVisible, setModalVisible] = useState(false);
  const [modalDetalleVisible, setModalDetalleVisible] = useState(false);
  const [dirigenteSeleccionado, setDirigenteSeleccionado] = useState(null);


  const [multasDirigente, setMultasDirigente] = useState([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const totalconFormato = `${Number(resumen.reduce((acc, r) => acc + Number(r.monto), 0)).toLocaleString()}`;
  const [token, setToken] = useState(null);
  useEffect(() => {
    AsyncStorage.getItem('token').then(setToken);
  }, []);

  const multasPorMotivo = resumen.reduce((acc, multa) => {
    const motivo = multa.motivo;
    const monto = Number(multa.monto);

    if (!acc[motivo]) {
      acc[motivo] = 0;
    }

    acc[motivo] += monto;
    return acc;
  }, {});
  
  const multasAgrupadas = Object.entries(multasPorMotivo).map(
    ([motivo, monto]) => ({
      motivo,
      monto,
    })
  );
  
  const multasPorDirigente = dirigentes.reduce((acc, item) => {
    const id = item.id_dirigente;

    if (!acc[id]) {
      acc[id] = {
        id_dirigente: id,
        nombre: `${item.nombre} ${item.apellido}`,
        total: 0,
      };
    }

    acc[id].total += Number(item.monto || 0);
    return acc;
  }, {});

  const dirigentesAgrupados = Object.values(multasPorDirigente);


  // 🔥 FUNCIÓN PARA CARGAR DETALLE DE MULTAS
  const cargarMultasDirigente = async (dirigente) => {
    if (!dirigente?.id_dirigente) return;
    
    setLoadingDetalle(true);
    try {
      const res = await fetch(`${API_URL}/multas/dirigente/${dirigente.id_dirigente}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      if (res.ok) {
        setMultasDirigente(data);
        setDirigenteSeleccionado(dirigente);
        setModalDetalleVisible(true);
      }
    } catch (err) {
      console.error('Error cargando detalle:', err);
    } finally {
      setLoadingDetalle(false);
    }
  };

  // FUNCIÓN PARA CERRAR MODAL
  const cerrarModalDetalle = () => {
    setModalDetalleVisible(false);
    setDirigenteSeleccionado(null);
    setMultasDirigente([]);
  };

  useEffect(() => {
    if (!user || !token || !user.dirigente) return;
    
    const cargarMultas = async () => {
      try {
        const res = await fetch(`${API_URL}/multas/dirigente/${user.dirigente.id_dirigente}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (res.ok) setResumen(data);
      } catch (err) {
        console.error(err);
      }
    };

    const cargarDirigentes = async () => {
      if (rol !== 'Coordinación' && rol !== 'ADMIN') return;

      try {
        const res = await fetch(`${API_URL}/multas`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        const data = await res.json();
        if (res.ok) setDirigentes(data);
      } catch (err) {
        console.error(err);
      }
    };

    Promise.all([cargarMultas(), cargarDirigentes()]).finally(() =>
      setLoading(false)
    );
  }, [user, token]);
  
  return (
    <View style={styles.container}>
      <WaveBackground />
      <SectionTitle title="Multas" />
      
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* ===== MULTAS ===== */}
        <TouchableOpacity onPress={() => cargarMultasDirigente(user.dirigente)}>
          <TotalCard total={totalconFormato}/>
        </TouchableOpacity>

        {multasAgrupadas.map((item, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => cargarMultasDirigente(user.dirigente)}
          >
            <Row
              left={item.motivo}
              right={`$${item.monto.toLocaleString()}`}
            />
          </TouchableOpacity>
        ))}

        {/* ===== DIRIGENTES ===== */}
        {rol === 'Coordinación' && (
  <View>
    <SectionTitle title="Dirigentes" />

    {dirigentesAgrupados.map((d) => (
      <TouchableOpacity
        key={d.id_dirigente}
        onPress={() => {
          cargarMultasDirigente(d);
        }}
      >
        <View style={styles.rowContainer}>
          <Text>{d.nombre}</Text>
          <Text>${d.total.toLocaleString()}</Text>
        </View>
      </TouchableOpacity>
    ))}

        <TouchableOpacity
          style={styles.manageBtn}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.manageText}>Gestionar multas</Text>
        </TouchableOpacity>
      </View>
    )}  
      </ScrollView>

      {/* MODAL DE DETALLE */}
      {modalDetalleVisible && dirigenteSeleccionado && (
        <ModalDetalleMultas
          visible={modalDetalleVisible}
          dirigente={dirigenteSeleccionado}
          multas={multasDirigente}
          loading={loadingDetalle}
          token={token}
          onClose={cerrarModalDetalle}
          onRefresh={() => { cargarMultasDirigente(dirigenteSeleccionado); }}
        />
      )}

      <BottomNav navigation={navigation} />

      
      <ModalAsignarMulta
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        dirigentes={dirigentes}
        token={token}
        onSuccess={() => { 
          setLoading(true);
          // Recargar datos después de asignar multa
          const cargarDatos = async () => {
            try {
              const [resMultas, resDirigentes] = await Promise.all([
                fetch(`${API_URL}/multas/dirigente/${user.dirigente.id_dirigente}`, {
                  headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${API_URL}/multas`, {
                  headers: { Authorization: `Bearer ${token}` }
                })
              ]);
              
              if (resMultas.ok) setResumen(await resMultas.json());
              if (resDirigentes.ok) setDirigentes(await resDirigentes.json());
            } catch (err) {
              console.error(err);
            } finally {
              setLoading(false);
            }
          };
          
          cargarDatos();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
    marginTop: 30
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },

  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  rowLeft: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  rowRight: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  manageBtn: {
    marginTop: 20,
    backgroundColor: '#0E1525',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  manageText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  rowTouchable: {
    marginVertical: 4,
  },

});