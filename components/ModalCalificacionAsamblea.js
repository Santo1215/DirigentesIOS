import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../api';

export default function ModalCalificacionAsamblea({
  visible,
  asamblea,
  idDirigente,
  onClose,
  onCalificado,
}) {
  const [estrellas, setEstrellas] = useState(0);
  const [resena, setResena] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [cargandoPrev, setCargandoPrev] = useState(false);
  const [calificacionPrevia, setCalificacionPrevia] = useState(null);

  // Refs de animación para cada estrella
  const starAnims = useRef([...Array(5)].map(() => new Animated.Value(1))).current;

  useEffect(() => {
    if (visible && asamblea && idDirigente) {
      cargarCalificacionPrevia();
    }
    if (!visible) {
      setEstrellas(0);
      setResena('');
      setCalificacionPrevia(null);
    }
  }, [visible, asamblea]);

  const cargarCalificacionPrevia = async () => {
    setCargandoPrev(true);
    try {
      const res = await fetch(
        `${API_URL}/asambleas/${asamblea.id_asamblea}/mi-calificacion?id_dirigente=${idDirigente}`
      );
      const data = await res.json();
      if (data.calificacion) {
        setCalificacionPrevia(data.calificacion);
        setEstrellas(data.calificacion.estrellas);
        setResena(data.calificacion.resena);
      }
    } catch (err) {
      console.error('Error cargando calificación previa:', err);
    } finally {
      setCargandoPrev(false);
    }
  };

  const animarEstrella = (index) => {
    Animated.sequence([
      Animated.spring(starAnims[index], {
        toValue: 1.3,
        useNativeDriver: true,
        speed: 40,
        bounciness: 10,
      }),
      Animated.spring(starAnims[index], {
        toValue: 1,
        useNativeDriver: true,
        speed: 30,
        bounciness: 6,
      }),
    ]).start();
  };

  const seleccionarEstrellaConMitades = (valorEntero, event) => {
    if (calificacionPrevia) return;

    // Calculamos si se presionó la mitad izquierda o derecha de la estrella
    const { locationX } = event.nativeEvent;
    const esMitad = locationX < 20; 
    const valorFinal = esMitad ? valorEntero - 0.5 : valorEntero;

    setEstrellas(valorFinal);
    
    const indexAnim = Math.floor(valorFinal) - (esMitad ? 1 : 0);
    if (indexAnim >= 0 && indexAnim < starAnims.length) {
      animarEstrella(indexAnim);
    }
  };

  const guardarCalificacion = async () => {
    if (estrellas === 0) {
      Alert.alert('Calificación requerida', 'Por favor selecciona al menos 1 estrella.');
      return;
    }
    if (!resena.trim() || resena.trim().length < 10) {
      Alert.alert(
        'Reseña obligatoria',
        'La reseña es obligatoria y debe tener al menos 10 caracteres para justificar tu calificación.'
      );
      return;
    }

    setGuardando(true);
    try {
      const res = await fetch(
        `${API_URL}/asambleas/${asamblea.id_asamblea}/calificaciones`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_dirigente: idDirigente,
            estrellas,
            resena: resena.trim(),
          }),
        }
      );

      const data = await res.json();

      if (res.status === 409) {
        Alert.alert('Ya calificaste', data.error || 'Ya enviaste una calificación para esta asamblea.');
        return;
      }
      if (!res.ok) {
        Alert.alert('Error', data.error || 'No se pudo guardar la calificación.');
        return;
      }

      Alert.alert('Calificación Guardada', 'Tu calificación fue registrada exitosamente.', [
        {
          text: 'Aceptar',
          onPress: () => {
            onClose();
            if (onCalificado) onCalificado();
          },
        },
      ]);
    } catch (err) {
      console.error('Error guardando calificación:', err);
      Alert.alert('Error', 'No se pudo conectar con el servidor.');
    } finally {
      setGuardando(false);
    }
  };

  // Obtener nombre del encargado principal
  const encargadoNombre = asamblea?.encargado_nombre
    ? `${asamblea.encargado_nombre} ${asamblea.encargado_apellido || ''}`.trim()
    : asamblea?.dirigente || 'Sin asignar';

  // Obtener foto del encargado principal
  const encargadoFoto = asamblea?.encargado_foto || asamblea?.foto_encargado || asamblea?.foto || null;

  // Parsear otros encargados
  const otrosEncargadosList = (() => {
    try {
      const raw = asamblea?.otros_encargados;
      const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  })();

  const textosEstrellas = ['', 'Muy deficiente', 'Deficiente', 'Aceptable', 'Bueno', 'Excelente'];

  if (!asamblea) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>

          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="star" size={20} color="#FFA726" />
            </View>
            <Text style={styles.headerTitle}>
              {calificacionPrevia ? 'Calificación Registrada' : 'Calificar Asamblea'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>

            {/* TÍTULO DE LA ASAMBLEA */}
            <View style={styles.tituloBox}>
              <Ionicons name="bookmark-outline" size={16} color="#FFA726" />
              <Text style={styles.tituloAsamblea} numberOfLines={2}>
                {asamblea.titulo}
              </Text>
            </View>

            {/* ENCARGADO PRINCIPAL CON FOTO */}
            <View style={styles.seccion}>
              <Text style={styles.seccionLabel}>Encargado principal</Text>
              <View style={styles.encargadoCard}>
                <View style={styles.avatarContainer}>
                  {encargadoFoto ? (
                    <Image source={{ uri: encargadoFoto }} style={styles.avatarImg} />
                  ) : (
                    <Ionicons name="person" size={22} color="#94A3B8" />
                  )}
                </View>
                <View style={styles.encargadoInfo}>
                  <Text style={styles.encargadoNombre}>{encargadoNombre}</Text>
                  <Text style={styles.encargadoRol}>Organizador</Text>
                </View>
              </View>
            </View>

            {/* OTROS ENCARGADOS */}
            {otrosEncargadosList.length > 0 && (
              <View style={styles.seccion}>
                <Text style={styles.seccionLabel}>Otros encargados</Text>
                <View style={styles.otrosChips}>
                  {otrosEncargadosList.map((item, i) => {
                    const esObjeto = typeof item === 'object' && item !== null;
                    const nombre = esObjeto ? `${item.nombre} ${item.apellido || ''}`.trim() : item;
                    const foto = esObjeto ? item.foto : null;

                    return (
                      <View key={i} style={styles.chip}>
                        <View style={styles.miniAvatar}>
                          {foto ? (
                            <Image source={{ uri: foto }} style={styles.miniAvatarImg} />
                          ) : (
                            <Ionicons name="person" size={10} color="#64748B" />
                          )}
                        </View>
                        <Text style={styles.chipText}>{nombre}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={styles.divisor} />

            {/* BANNER YA CALIFICADO / NO EDITABLE */}
            {cargandoPrev ? (
              <ActivityIndicator size="small" color="#FFA726" style={{ marginVertical: 10 }} />
            ) : calificacionPrevia ? (
              <View style={styles.yaCalificadoBanner}>
                <Ionicons name="information-circle-outline" size={18} color="#0284C7" />
                <Text style={styles.yaCalificadoText}>
                  Ya has calificado esta asamblea. Esta calificación no se puede editar ni modificar posteriormente.
                </Text>
              </View>
            ) : null}

            {/* SELECTOR DE ESTRELLAS PARCIALES */}
            <View style={styles.seccion}>
              <Text style={styles.seccionLabel}>Puntuación</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((val) => {
                  let nombreIcono = 'star-outline';
                  if (estrellas >= val) {
                    nombreIcono = 'star';
                  } else if (estrellas >= val - 0.5) {
                    nombreIcono = 'star-half';
                  }

                  return (
                    <TouchableOpacity
                      key={val}
                      onPress={(e) => seleccionarEstrellaConMitades(val, e)}
                      activeOpacity={calificacionPrevia ? 1 : 0.7}
                      disabled={!!calificacionPrevia}
                      style={{ padding: 4 }}
                    >
                      <Animated.View style={{ transform: [{ scale: starAnims[val - 1] }] }}>
                        <Ionicons
                          name={nombreIcono}
                          size={38}
                          color={nombreIcono !== 'star-outline' ? '#FFA726' : '#CBD5E1'}
                          style={styles.starIcon}
                        />
                      </Animated.View>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {estrellas > 0 && (
                <View style={styles.badgeEstrella}>
                  <Text style={styles.etiquetaEstrella}>
                    {estrellas} / 5 - {textosEstrellas[Math.ceil(estrellas)] || 'Excelente'}
                  </Text>
                </View>
              )}
            </View>

            {/* RESEÑA */}
            <View style={styles.seccion}>
              <View style={styles.labelRow}>
                <Text style={styles.seccionLabel}>Reseña o justificación</Text>
                {!calificacionPrevia && <Text style={styles.obligatorio}>* Requerida</Text>}
              </View>
              <TextInput
                style={[
                  styles.textArea,
                  calificacionPrevia && styles.textAreaReadOnly,
                  !calificacionPrevia && resena.trim().length > 0 && resena.trim().length < 10 && styles.textAreaError,
                ]}
                placeholder="Escribe aquí los motivos de tu calificación (mín. 10 caracteres)..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                value={resena}
                onChangeText={setResena}
                editable={!calificacionPrevia}
                textAlignVertical="top"
              />
              {!calificacionPrevia && (
                <Text style={[
                  styles.charCount,
                  resena.trim().length > 0 && resena.trim().length < 10 && { color: '#EF4444' }
                ]}>
                  {resena.trim().length} / 10 caracteres mín.
                </Text>
              )}
            </View>

          </ScrollView>

          {/* ACCIONES */}
          {!calificacionPrevia ? (
            <View style={styles.botonesRow}>
              <TouchableOpacity style={styles.btnCancelar} onPress={onClose} activeOpacity={0.8}>
                <Text style={styles.btnCancelarText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.btnGuardar,
                  (guardando || estrellas === 0) && styles.btnGuardarDisabled,
                ]}
                onPress={guardarCalificacion}
                disabled={guardando || estrellas === 0}
                activeOpacity={0.8}
              >
                {guardando ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.btnGuardarText}>Guardar Calificación</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.btnSoloLectura} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.btnCancelarText}>Cerrar</Text>
            </TouchableOpacity>
          )}

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    maxHeight: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  tituloBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    gap: 8,
  },
  tituloAsamblea: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#D97706',
  },
  seccion: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seccionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  encargadoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  avatarContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  encargadoInfo: {
    justifyContent: 'center',
  },
  encargadoNombre: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  encargadoRol: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  otrosChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  miniAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
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
  chipText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  divisor: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 6,
    marginBottom: 14,
  },
  yaCalificadoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 8,
  },
  yaCalificadoText: {
    fontSize: 12,
    color: '#0369A1',
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  starIcon: {
    marginHorizontal: 4,
  },
  badgeEstrella: {
    alignSelf: 'center',
    backgroundColor: '#FFF8F0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  etiquetaEstrella: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  obligatorio: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#1E293B',
    backgroundColor: '#FAFAFA',
    minHeight: 90,
    lineHeight: 18,
  },
  textAreaReadOnly: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    color: '#64748B',
  },
  textAreaError: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  charCount: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'right',
  },
  botonesRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  btnCancelar: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  btnCancelarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  btnGuardar: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFA726',
    shadowColor: '#FFA726',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  btnGuardarDisabled: {
    backgroundColor: '#FFCC80',
    shadowOpacity: 0,
    elevation: 0,
  },
  btnGuardarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnSoloLectura: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
});