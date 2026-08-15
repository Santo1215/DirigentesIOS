import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function SectionTitle({ title, showBackButton = false, onBackPress }) {
  return (
    <View style={styles.sectionTitle}>
      {showBackButton && (
        <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      )}
      <Text style={[styles.sectionText, !showBackButton && { marginRight: 0 }]}>
        {title}
      </Text>
    </View>
  );
}
export default SectionTitle;

const styles = StyleSheet.create({
  sectionTitle: {
    backgroundColor: '#22335D',
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    margin: 10,
  },
  backButton: {
    marginRight: 10,
    padding: 4,
  },
  sectionText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginRight: 24, // Compensa el espacio del botón para mantener centrado el texto
  },
});