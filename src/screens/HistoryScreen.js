import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { loadEvents } from '../storage/events';
import Avatar from '../components/Avatar';
import { getPalette } from '../utils/palettes';

export default function HistoryScreen({ navigation }) {
  const [events, setEvents] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadEvents().then(all => {
        const sorted = [...all].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setEvents(sorted);
      });
    }, [])
  );

  const active = events.filter(e => !e.completed);
  const completed = events.filter(e => e.completed);

  const stats = useMemo(() => {
    const totalGasto = events.reduce(
      (sum, e) => sum + e.payments.reduce((s, p) => s + p.amount, 0), 0
    );
    const uniquePeople = new Set(events.flatMap(e => e.participants.map(p => p.name))).size;
    return { totalGasto, uniquePeople };
  }, [events]);

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function getTotal(event) {
    return event.payments.reduce((s, p) => s + p.amount, 0);
  }

  function renderCard(item) {
    const total = getTotal(item);
    const palette = getPalette(item.paletteId);
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.card, item.completed && styles.cardDone]}
        onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
        activeOpacity={0.75}
      >
        <View style={[styles.cardAccent, { backgroundColor: item.completed ? '#D1D5DB' : palette.primary }]} />
        <View style={styles.cardTop}>
          <View style={styles.cardTitleRow}>
            {item.completed && <Text style={styles.cardCheck}>✓ </Text>}
            <Text style={[styles.cardName, item.completed && styles.cardNameDone]} numberOfLines={1}>
              {item.name}
            </Text>
          </View>
          {total > 0 && (
            <View style={[
              styles.totalBadge,
              { backgroundColor: item.completed ? '#F3F4F6' : palette.badgeBg }
            ]}>
              <Text style={[
                styles.totalBadgeText,
                { color: item.completed ? '#9CA3AF' : palette.badgeText }
              ]}>
                R$ {total.toFixed(2)}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
        <View style={styles.cardBottom}>
          <View style={styles.avatarRow}>
            {item.participants.slice(0, 6).map((p, idx) => (
              <View key={p.id} style={[styles.avatarWrap, { zIndex: 10 - idx, marginLeft: idx === 0 ? 0 : -10 }]}>
                <Avatar name={p.name} index={idx} size={26} />
              </View>
            ))}
            {item.participants.length > 6 && (
              <View style={styles.avatarMore}>
                <Text style={styles.avatarMoreText}>+{item.participants.length - 6}</Text>
              </View>
            )}
          </View>
          <Text style={styles.cardParticipants}>
            {item.participants.length} pessoa{item.participants.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  const listData = [
    { type: 'stats' },
    ...(active.length > 0 ? [{ type: 'section', label: `Em andamento (${active.length})` }] : []),
    ...active.map(e => ({ type: 'event', event: e })),
    ...(completed.length > 0 ? [{ type: 'section', label: `Concluídos (${completed.length})` }] : []),
    ...completed.map(e => ({ type: 'event', event: e })),
  ];

  if (events.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>📭</Text>
        <Text style={styles.emptyTitle}>Nenhum evento ainda</Text>
        <Text style={styles.emptySubtext}>Crie um evento na tela inicial para começar.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={listData}
      keyExtractor={(item, i) => item.type + (item.event?.id ?? item.label ?? i)}
      contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}
      renderItem={({ item }) => {
        if (item.type === 'stats') {
          return (
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{events.length}</Text>
                <Text style={styles.statLabel}>eventos</Text>
              </View>
              <View style={[styles.statBox, styles.statBoxMid]}>
                <Text style={styles.statValue}>R$ {stats.totalGasto.toFixed(2)}</Text>
                <Text style={styles.statLabel}>total gasto</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.uniquePeople}</Text>
                <Text style={styles.statLabel}>pessoas</Text>
              </View>
            </View>
          );
        }
        if (item.type === 'section') {
          return <Text style={styles.sectionLabel}>{item.label}</Text>;
        }
        return renderCard(item.event);
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  statBoxMid: { flex: 1.6 },
  statValue: { fontSize: 15, fontWeight: '800', color: '#111827', textAlign: 'center' },
  statLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 2, fontWeight: '500' },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14, paddingTop: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2, overflow: 'hidden',
  },
  cardDone: { opacity: 0.6 },
  cardAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 4 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  cardCheck: { fontSize: 13, color: '#22C55E', fontWeight: '800' },
  cardName: { fontSize: 16, fontWeight: '700', color: '#111827', flex: 1 },
  cardNameDone: { color: '#6B7280' },
  totalBadge: { borderRadius: 10, paddingVertical: 3, paddingHorizontal: 10 },
  totalBadgeText: { fontSize: 13, fontWeight: '700' },
  cardDate: { fontSize: 12, color: '#9CA3AF', marginBottom: 10 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  avatarWrap: { borderWidth: 2, borderColor: '#fff', borderRadius: 20 },
  avatarMore: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center', marginLeft: -10, borderWidth: 2, borderColor: '#fff',
  },
  avatarMoreText: { fontSize: 9, fontWeight: '700', color: '#6B7280' },
  cardParticipants: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
});
