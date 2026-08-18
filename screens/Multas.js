import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../components/navbar';
import SectionTitle from '../components/TituloSeccion';
import TotalCard from '../components/TotalCard';
import Row from '../components/Fila';
import WaveBackground from '../components/WaveBackground';
import ModalAsignarMulta from '../components/ModalAsignarMulta';
import ModalDetalleMultas from '../components/ModalDetalleMultas';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserContext } from '../context/UserContext';
import { API_URL } from '../api';

export default function Multas({ navigation }) {
  const { user } = useContext(UserContext);
  const [resumen, setResumen] = useState([]);
  const [dirigentes, setDirigentes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const rol = user?.dirigente?.rol;
  const comite = user?.dirigente?.comite;
  const idDirigenteActual = user?.dirigente?.id_dirigente;

  const [modalVisible, setModalVisible] = useState(false);
  const [modalDetalleVisible, setModalDetalleVisible] = useState(false);
  const [dirigenteSeleccionado, setDirigenteSeleccionado] = useState(null);

  const [multasDirigente, setMultasDirigente] = useState([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [token, setToken] = useState(null);

  const totalConFormato = `${Number(resumen.reduce((acc, r) => acc + Number(r.monto), 0)).toLocaleString()}`;

  useEffect(() => {
    AsyncStorage.getItem('token').then(setToken);
  }, []);

  const multasPorMotivo = resumen.reduce((acc, multa) => {
    const motivo = multa.motivo;
    const monto = Number(multa.monto);
    if (!acc[motivo]) acc[motivo] = 0;
    acc[motivo] += monto;
    return acc;
  }, {});

  const multasAgrupadas = Object.entries(multasPorMotivo).map(([motivo, monto]) => ({
    motivo,
    monto,
  }));

  const multasPorDirigente = dirigentes.reduce((acc, item) => {
    const id = item.id_dirigente;
    const motivoLower = item.motivo ? item.motivo.toLowerCase() : '';
    const esIntegracion = motivoLower.includes('integraci') || (item.comite && item.comite.toLowerCase().includes('integraci'));

    if (!acc[id]) {
      acc[id] = {
        id_dirigente: id,
        nombre: `${item.nombre} ${item.apellido}`,
        comite: item.comite || '',
        total: 0,
        tieneMultaIntegracion: false,
      };
    }
    acc[id].total += Number(item.monto || 0);
    if (esIntegracion) {
      acc[id].tieneMultaIntegracion = true;
    }
    return acc;
  }, {});

  let dirigentesAgrupados = dirigentes.filter(d => Number(d.total) > 0);

  if (comite === 'Integración' || rol === 'Integración') {
    dirigentesAgrupados = dirigentesAgrupados.filter(d => 
      d.tieneMultaIntegracion || 
      (d.comite && d.comite.toLowerCase().includes('integraci')) ||
      d.id_dirigente === idDirigenteActual
    );
  }

  const cargarMultasDirigente = async (dirigente) => {
    if (!dirigente?.id_dirigente) return;
    setLoadingDetalle(true);
    try {
      const res = await fetch(`${API_URL}/multas/dirigente/${dirigente.id_dirigente}`, {
        headers: { Authorization: `Bearer ${token}` }
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

  const cerrarModalDetalle = () => {
    setModalDetalleVisible(false);
    setDirigenteSeleccionado(null);
    setMultasDirigente([]);
  };

  const cargarDatos = async () => {
    if (!token || !idDirigenteActual) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const resMultas = await fetch(`${API_URL}/multas/dirigente/${idDirigenteActual}`, { headers });
      const resMultasGlobal = await fetch(`${API_URL}/multas`, { headers });
      const resDirigentes = await fetch(`${API_URL}/dirigentes`, { headers });

      if (resMultas.ok) setResumen(await resMultas.json());
      
      if (resMultasGlobal.ok && resDirigentes.ok) {
        const listadoMultas = await resMultasGlobal.json();
        const listadoDirigentes = await resDirigentes.json();

        const esIntegracionRol = comite === 'Integración' || rol === 'Integración';

        const conMontos = listadoDirigentes.map(dir => {
          const multasDelDirigente = listadoMultas.filter(m => m.id_dirigente === dir.id_dirigente);
          
          const multasValidas = multasDelDirigente.filter(m => {
            const motivo = m.motivo ? m.motivo.toLowerCase() : '';
            const esIntegracionMotivo = motivo.includes('integración') || motivo.includes('integracion');

            if (esIntegracionRol) {
              return esIntegracionMotivo;
            } else {
              return !esIntegracionMotivo;
            }
          });

          const totalMonto = multasValidas.reduce((sum, m) => sum + Number(m.monto), 0);
          
          const tieneIntegracion = multasDelDirigente.some(m => {
            const motivo = m.motivo ? m.motivo.toLowerCase() : '';
            return motivo.includes('integración') || motivo.includes('integracion');
          });

          return { 
            ...dir, 
            multas: multasDelDirigente, 
            monto: totalMonto,
            total: totalMonto,
            tieneMultaIntegracion: tieneIntegracion 
          };
        });

        setDirigentes(conMontos);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      cargarDatos();
    }
  }, [token]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WaveBackground />
      <SectionTitle title="Multas" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <TouchableOpacity style={styles.cardContainer} activeOpacity={0.9} onPress={() => cargarMultasDirigente(user.dirigente)}>
          <TotalCard total={totalConFormato} />
        </TouchableOpacity>

        {multasAgrupadas.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No tienes multas registradas.</Text>
          </View>
        ) : (
          multasAgrupadas.map((item, i) => (
            <TouchableOpacity key={i} activeOpacity={0.8} onPress={() => cargarMultasDirigente(user.dirigente)}>
              <Row left={item.motivo} right={`$${item.monto.toLocaleString()}`} />
            </TouchableOpacity>
          ))
        )}

        {(rol === 'Coordinación' || rol === 'ADMIN' || comite === 'Integración' || rol === 'Integración') && (
          <View style={styles.sectionContainer}>
            <SectionTitle title={(comite === 'Integración') ? "Multas de Integración" : "Gestión de Dirigentes"} />

            {dirigentesAgrupados.map((d) => (
              <TouchableOpacity
                key={d.id_dirigente}
                style={styles.dirigenteRow}
                activeOpacity={0.8}
                onPress={() => cargarMultasDirigente(d)}
              >
                <View style={styles.dirigenteInfo}>
                  {/* Foto del dirigente o icono predeterminado */}
                  <View style={styles.avatarContainer}>
                    {d.foto ? (
                      <Image source={{ uri: d.foto }} style={styles.avatarImage} />
                    ) : (
                      <Ionicons name="person" size={16} color="#0F172A" />
                    )}
                  </View>
                  <Text style={styles.dirigenteNombre}>{d.nombre} {d.apellido}</Text>
                </View>
                <Text style={styles.dirigenteTotal}>${Number(d.total || 0).toLocaleString()}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.manageBtn}
              activeOpacity={0.85}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.manageText}>Asignar Nueva Multa</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {modalDetalleVisible && dirigenteSeleccionado && (
        <ModalDetalleMultas
          visible={modalDetalleVisible}
          dirigente={dirigenteSeleccionado}
          token={token}
          onClose={cerrarModalDetalle}
          onRefresh={cargarDatos}
        />
      )}

      <BottomNav navigation={navigation} />

      <ModalAsignarMulta
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        token={token}
        onSuccess={cargarDatos}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    marginTop: 30,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
    paddingBottom: 110,
  },
  cardContainer: {
    marginBottom: 10,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  sectionContainer: {
    marginTop: 20,
  },
  dirigenteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dirigenteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  dirigenteNombre: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  dirigenteTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  manageBtn: {
    flexDirection: 'row',
    marginTop: 15,
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  manageText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});