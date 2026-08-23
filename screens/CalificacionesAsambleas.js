import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../api';
import SectionTitle from '../components/TituloSeccion';
import WaveBackground from '../components/WaveBackground';
import BottomNav from '../components/navbar';
import { UserContext } from '../context/UserContext';
import BotonCalificarAsamblea from '../components/BotonCalificarAsamblea';

export default function CalificacionesAsambleas({ navigation }) {
  const { user } = useContext(UserContext);
  const idUsuarioActual = user?.dirigente?.id_dirigente || user?.dirigente?.id || 1;

  const [asambleas, setAsambleas] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // Estado para el modal de detalles y reseñas
  const [modalVisible, setModalVisible] = useState(false);
  const [asambleaSeleccionada, setAsambleaSeleccionada] = useState(null);
  const [reseñas, setReseñas] = useState([]);
  const [cargandoReseñas, setCargandoReseñas] = useState(false);

  useEffect(() => {
    cargarAsambleas();
  }, []);

  const cargarAsambleas = async () => {
    setCargando(true);
    try {
      const res = await fetch(`${API_URL}/asambleas`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setAsambleas(data);
      } else if (data.asambleas && Array.isArray(data.asambleas)) {
        setAsambleas(data.asambleas);
      }
    } catch (err) {
      console.error('Error cargando asambleas:', err);
    } finally {
      setCargando(false);
    }
  };

  const abrirModalReseñas = async (asamblea) => {
    setAsambleaSeleccionada(asamblea);
    setModalVisible(true);
    setCargandoReseñas(true);
    try {
      const res = await fetch(`${API_URL}/asambleas/${asamblea.id_asamblea}/calificaciones`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setReseñas(data);
      } else if (data.calificaciones && Array.isArray(data.calificaciones)) {
        setReseñas(data.calificaciones);
      } else {
        setReseñas([]);
      }
    } catch (err) {
      console.error('Error cargando reseñas:', err);
      setReseñas([]);
    } finally {
      setCargandoReseñas(false);
    }
  };

  const renderEstrellasMini = (promedio) => {
    const valor = Number(promedio) || 0;
    return (
      <View style={styles.promedioRow}>
        <Ionicons name="star" size={16} color="#FFA726" />
        <Text style={styles.promedioTexto}>{valor > 0 ? valor.toFixed(1) : 'Sin calificar'}</Text>
      </View>
    );
  };

  const renderItemAsamblea = ({ item }) => {
    const promedio = Number(item.promedio_estrellas || item.calificacion_promedio || 0);
    const totalCalificaciones = item.total_calificaciones || item.cantidad_calificaciones || 0;

    return (
      <TouchableOpacity
        style={styles.cardAsamblea}
        activeOpacity={0.8}
        onPress={() => abrirModalReseñas(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <Ionicons name="flame-outline" size={20} color="#D97706" />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.cardTitulo} numberOfLines={2}>
              {item.titulo}
            </Text>
            <Text style={styles.cardSubFecha}>
              {item.fecha ? new Date(item.fecha).toLocaleDateString() : 'Fecha no programada'}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          {renderEstrellasMini(promedio)}
          <Text style={styles.totalVotosTexto}>
            {totalCalificaciones} {totalCalificaciones === 1 ? 'opinión' : 'opiniones'}
          </Text>
        </View>

        <View style={{ marginTop: 10 }}>
          <BotonCalificarAsamblea 
            asamblea={item} 
            idDirigente={idUsuarioActual}
            yaCalificado={item.calificaciones?.some(c => c.id_dirigente === idUsuarioActual)}
            onCalificado={() => cargarAsambleas()} 
          />
        </View>
      </TouchableOpacity>
    );
  };

  // Parsear encargados de la asamblea seleccionada
  const principalNombre = asambleaSeleccionada?.encargado_nombre
    ? `${asambleaSeleccionada.encargado_nombre} ${asambleaSeleccionada.encargado_apellido || ''}`.trim()
    : asambleaSeleccionada?.dirigente || 'Sin asignar';
  const principalFoto = asambleaSeleccionada?.encargado_foto || asambleaSeleccionada?.foto_encargado || null;

  const otrosEncargadosList = (() => {
    try {
      const raw = asambleaSeleccionada?.otros_encargados;
      const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  })();

  return (
    <SafeAreaView style={styles.container}>
      <WaveBackground style={{ pointerEvents: 'none' }} />
      <SectionTitle title="Calificación Asambleas" showBackButton={true} onBackPress={() => navigation.goBack()}/>
      <View style={styles.screenHeader}>
        <Text style={styles.screenSubtitle}>Revisa el promedio y las reseñas detalladas por dirigente</Text>
      </View>

      {cargando ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FFA726" />
          <Text style={styles.cargandoText}>Cargando asambleas...</Text>
        </View>
      ) : (
        <FlatList
          data={asambleas}
          keyExtractor={(item) => String(item.id_asamblea || item.id)}
          renderItem={renderItemAsamblea}
          contentContainerStyle={styles.listaContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No hay asambleas registradas</Text>
            </View>
          }
        />
      )}

      {/* MODAL DE DETALLES Y RESEÑAS */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {/* MODAL HEADER */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Detalle de Calificaciones</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {asambleaSeleccionada && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                
                {/* TÍTULO ASAMBLEA */}
                <View style={styles.modalTituloBox}>
                  <Text style={styles.modalTituloAsamblea}>{asambleaSeleccionada.titulo}</Text>
                </View>

                {/* ENCARGADOS */}
                <View style={styles.seccionModal}>
                  <Text style={styles.seccionTitulo}>Encargado principal</Text>
                  <View style={styles.encargadoItemCard}>
                    <View style={styles.avatarBox}>
                      {principalFoto ? (
                        <Image source={{ uri: principalFoto }} style={styles.avatarImg} />
                      ) : (
                        <Ionicons name="person" size={20} color="#94A3B8" />
                      )}
                    </View>
                    <Text style={styles.encargadoNombreTexto}>{principalNombre}</Text>
                  </View>

                  {otrosEncargadosList.length > 0 && (
                    <>
                      <Text style={[styles.seccionTitulo, { marginTop: 10 }]}>Otros encargados</Text>
                      <View style={styles.otrosGrid}>
                        {otrosEncargadosList.map((item, index) => {
                          const esObj = typeof item === 'object' && item !== null;
                          const nom = esObj ? `${item.nombre} ${item.apellido || ''}`.trim() : item;
                          const fotoItem = esObj ? item.foto : null;
                          return (
                            <View key={index} style={styles.otroChipCard}>
                              <View style={styles.miniAvatarBox}>
                                {fotoItem ? (
                                  <Image source={{ uri: fotoItem }} style={styles.miniAvatarImg} />
                                ) : (
                                  <Ionicons name="person" size={12} color="#64748B" />
                                )}
                              </View>
                              <Text style={styles.otroChipTexto}>{nom}</Text>
                            </View>
                          );
                        })}
                      </View>
                    </>
                  )}
                </View>

                <View style={styles.divider} />

                {/* LISTA DE RESEÑAS DE DIRIGENTES */}
                <View style={styles.seccionModal}>
                  <Text style={styles.seccionTitulo}>Reseñas de los dirigentes</Text>

                  {cargandoReseñas ? (
                    <ActivityIndicator size="small" color="#FFA726" style={{ marginVertical: 20 }} />
                  ) : reseñas.length === 0 ? (
                    <View style={styles.emptyReseñasBox}>
                      <Ionicons name="chatbubbles-outline" size={32} color="#CBD5E1" />
                      <Text style={styles.emptyReseñasText}>Aún no hay reseñas registradas para esta asamblea.</Text>
                    </View>
                  ) : (
                    reseñas.map((res, idx) => {
                      const nombreDirigente = res.nombre
                        ? `${res.nombre} ${res.apellido || ''}`.trim()
                        : res.dirigente_nombre
                        ? `${res.dirigente_nombre} ${res.dirigente_apellido || ''}`.trim()
                        : res.nombre_dirigente || 'Dirigente';
                      const fotoDirigente = res.dirigente_foto || res.foto || null;
                      const puntuacion = Number(res.estrellas) || 0;

                      return (
                        <View key={idx} style={styles.reseñaCard}>
                          <View style={styles.reseñaHeaderRow}>
                            <View style={styles.dirigenteInfoRow}>
                              <View style={styles.dirigenteAvatarBox}>
                                {fotoDirigente ? (
                                  <Image source={{ uri: fotoDirigente }} style={styles.dirigenteAvatarImg} />
                                ) : (
                                  <Ionicons name="person" size={14} color="#64748B" />
                                )}
                              </View>
                              <Text style={styles.dirigenteNombreText}>{nombreDirigente}</Text>
                            </View>

                            <View style={styles.badgeEstrellasReseña}>
                              <Ionicons name="star" size={12} color="#D97706" />
                              <Text style={styles.badgeEstrellasTexto}>{puntuacion.toFixed(1)}</Text>
                            </View>
                          </View>

                          <Text style={styles.reseñaTextoComentario}>
                            {res.resena || res.comentario || 'Sin reseña escrita.'}
                          </Text>
                        </View>
                      );
                    })
                  )}
                </View>

              </ScrollView>
            )}

          </View>
        </View>
      </Modal>

    <BottomNav navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  screenHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  screenSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  listaContainer: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cargandoText: {
    marginTop: 10,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
  cardAsamblea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  cardTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  cardSubFecha: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  promedioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  promedioTexto: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D97706',
  },
  totalVotosTexto: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  modalTituloBox: {
    backgroundColor: '#FFF8F0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  modalTituloAsamblea: {
    fontSize: 15,
    fontWeight: '700',
    color: '#D97706',
  },
  seccionModal: {
    marginBottom: 12,
  },
  seccionTitulo: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  encargadoItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  avatarBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  encargadoNombreTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  otrosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  otroChipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  miniAvatarBox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  miniAvatarImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  otroChipTexto: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  emptyReseñasBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emptyReseñasText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
  },
  reseñaCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reseñaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dirigenteInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dirigenteAvatarBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dirigenteAvatarImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  dirigenteNombreText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  badgeEstrellasReseña: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  badgeEstrellasTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  reseñaTextoComentario: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
});