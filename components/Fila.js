import { StyleSheet, Text, View } from 'react-native';
function Row({ left, right }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLeft}>{left}</Text>
      <Text style={styles.rowRight}>{right}</Text>
    </View>
  );
}
export default Row;

const styles = StyleSheet.create({
     row: {
    backgroundColor: '#DADADA',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  rowLeft: {
    fontSize: 14,
    color: '#000',
  },

  rowRight: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});