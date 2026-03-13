import { StyleSheet, Text, View } from 'react-native';
function TotalCard({ total }) {
  return (
    <View style={styles.totalCard}>
      <Text style={styles.totalLabel}>Total</Text>
      <Text style={styles.totalAmount}>$ {total.toLocaleString()}</Text>
    </View>
  );
}
export default TotalCard;

const styles = StyleSheet.create({
    totalCard: {
    backgroundColor: '#E0E0E0',
    borderRadius: 30,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 16,
    color: '#000',
  },

  totalAmount: {
    fontSize: 22,
    fontWeight: 'bold',
  },
});