import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
function SectionTitle({ title }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionText}>{title}</Text>
    </View>
  );
}
export default SectionTitle;    
const styles = StyleSheet.create({
    sectionTitle: {
    backgroundColor: '#22335D',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 15,
    margin:10,
  },

  sectionText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  },
});