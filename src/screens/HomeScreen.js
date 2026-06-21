import { useCallback, useState } from 'react';
import {
  FlatList, StyleSheet, Text, TouchableOpacity, View, Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { deleteEvent, loadEvents } from '../storage/events';

export default function HomeScreen({ navigation }) {
  const [events, setEvents] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadEvents().then(setEvents);
    }, [])
  );

  function handleDelete(event) {
    Alert.alert('Excluir evento', `Excluir "${event.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: () => deleteEvent(event.id).then(() => setEvents(e => e.filter(x => x.id !== event.id))),
      },
    ]);
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  return (
    <View style={styles.container}>
      {events.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🧾</Text>
          <Text style={styles.emptyText}>Nenhum evento ainda</Text>
          <Text style={styles.emptySubtext}>Crie um evento para começar a dividir as contas</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
              onLongPress={() => handleDelete(item)}
            >
              <View style={styles.cardLeft}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
                <Text style={styles.cardInfo}>
                  {item.participants.length} pessoa{item.participants.length !== 1 ? 's' : ''}
                  {' · '}
                  {item.payments.length} pagamento{item.payments.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <Text style={styles.cardArrow}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateEvent')}
      >
        <Text style={styles.fabText}>+ Novo Evento</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLeft: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cardDate: { fontSize: 12, color: '#9CA3AF', marginBottom: 4 },
  cardInfo: { fontSize: 13, color: '#6B7280' },
  cardArrow: { fontSize: 24, color: '#D1D5DB', marginLeft: 8 },
  fab: {
    margin: 16,
    backgroundColor: '#22C55E',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  fabText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
