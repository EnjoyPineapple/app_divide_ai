import { useCallback, useState } from 'react';
import {
  FlatList, Image, StyleSheet, Text, TouchableOpacity, View, Alert, StatusBar
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { deleteEvent, loadEvents, updateEvent } from '../storage/events';
import { loadUser, clearUser } from '../storage/user';
import Avatar from '../components/Avatar';
import { getPalette } from '../utils/palettes';

export default function HomeScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [user, setUser] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadEvents().then(setEvents);
      loadUser().then(setUser);
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

  function handleToggleComplete(event) {
    const action = event.completed ? 'Reabrir' : 'Encerrar';
    const msg = event.completed
      ? `Reabrir "${event.name}"?`
      : `Encerrar "${event.name}"? Ele ficará na seção "Concluídos" aqui na tela inicial.`;
    Alert.alert(`${action} Evento`, msg, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: action,
        onPress: async () => {
          const updated = { ...event, completed: !event.completed };
          await updateEvent(updated);
          setEvents(prev => prev.map(e => e.id === event.id ? updated : e));
        },
      },
    ]);
  }

  function handleProfilePress() {
    if (user?.name) {
      Alert.alert(user.name, user.email || '', [
        { text: 'Sair da conta', style: 'destructive', onPress: () => clearUser().then(() => setUser(null)) },
        { text: 'Fechar', style: 'cancel' },
      ]);
    } else {
      navigation.navigate('Login');
    }
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function getTotal(event) {
    return event.payments.reduce((s, p) => s + p.amount, 0);
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A7A3C" />

      {/* Header customizado */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('../../assets/icon.png')} style={styles.appLogo} />
          <View>
            <Text style={styles.headerTitle}>Divide Aí</Text>
            <Text style={styles.headerSub}>by Enjoy Pineapple</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('History')} style={styles.historyBtn}>
          <Text style={styles.historyBtnText}>📋</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleProfilePress} style={styles.profileBtn}>
          {user?.photo ? (
            <Image source={{ uri: user.photo }} style={styles.profilePhoto} />
          ) : user?.name ? (
            <View style={styles.profileInitial}>
              <Text style={styles.profileInitialText}>{user.name[0].toUpperCase()}</Text>
            </View>
          ) : (
            <View style={styles.profileGuest}>
              <Text style={styles.profileGuestText}>👤</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {events.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🧾</Text>
          <Text style={styles.emptyText}>Nenhum evento ainda</Text>
          <Text style={styles.emptySubtext}>Crie um evento para começar a dividir as contas</Text>
        </View>
      ) : (
        <FlatList
          data={events.filter(e => !e.completed)}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          ListEmptyComponent={
            <View style={styles.allDoneBox}>
              <Text style={styles.allDoneIcon}>🎉</Text>
              <Text style={styles.allDoneText}>Todos os eventos concluídos!</Text>
              <Text style={styles.allDoneSub}>Veja o histórico completo no 📋</Text>
            </View>
          }
          renderItem={({ item }) => {
            const total = getTotal(item);
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
                onLongPress={() => handleDelete(item)}
                activeOpacity={0.75}
              >
                <View style={[styles.cardAccent, { backgroundColor: getPalette(item.paletteId).primary }]} />
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                  {total > 0 && (
                    <View style={[styles.totalBadge, { backgroundColor: getPalette(item.paletteId).badgeBg }]}>
                      <Text style={[styles.totalBadgeText, { color: getPalette(item.paletteId).badgeText }]}>
                        R$ {total.toFixed(2)}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
                <View style={styles.cardBottom}>
                  <View style={styles.avatarRow}>
                    {item.participants.slice(0, 5).map((p, idx) => (
                      <View key={p.id} style={[styles.avatarWrap, { zIndex: 10 - idx, marginLeft: idx === 0 ? 0 : -10 }]}>
                        <Avatar name={p.name} index={idx} size={28} />
                      </View>
                    ))}
                    {item.participants.length > 5 && (
                      <View style={styles.avatarMore}>
                        <Text style={styles.avatarMoreText}>+{item.participants.length - 5}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.encerrarBtn}
                      onPress={() => handleToggleComplete(item)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.encerrarBtnText}>✓ Encerrar</Text>
                    </TouchableOpacity>
                    <Text style={styles.cardArrow}>›</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateEvent')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+ Novo Evento</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#22C55E',
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingTop: 50,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  appLogo: { width: 40, height: 40, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '600', marginTop: -1 },
  historyBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  historyBtnText: { fontSize: 18 },
  profileBtn: { padding: 2 },
  profilePhoto: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: '#fff' },
  profileInitial: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#D1FAE5',
  },
  profileInitialText: { fontSize: 16, fontWeight: '800', color: '#22C55E' },
  profileGuest: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center',
  },
  profileGuestText: { fontSize: 18 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    paddingTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#111827', flex: 1, marginRight: 8 },
  totalBadge: { backgroundColor: '#F0FDF4', borderRadius: 10, paddingVertical: 3, paddingHorizontal: 10 },
  totalBadgeText: { fontSize: 13, fontWeight: '700', color: '#16A34A' },
  cardDate: { fontSize: 12, color: '#9CA3AF', marginBottom: 10 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  avatarWrap: { borderWidth: 2, borderColor: '#fff', borderRadius: 20 },
  avatarMore: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center',
    marginLeft: -10, borderWidth: 2, borderColor: '#fff',
  },
  avatarMoreText: { fontSize: 10, fontWeight: '700', color: '#6B7280' },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  encerrarBtn: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  encerrarBtnText: { fontSize: 12, fontWeight: '700', color: '#16A34A' },
  cardArrow: { fontSize: 24, color: '#D1D5DB' },
  allDoneBox: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  allDoneIcon: { fontSize: 48, marginBottom: 12 },
  allDoneText: { fontSize: 16, color: '#111827', fontWeight: '700', marginBottom: 6 },
  allDoneSub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
  fab: {
    margin: 16,
    backgroundColor: '#22C55E',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  fabText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
