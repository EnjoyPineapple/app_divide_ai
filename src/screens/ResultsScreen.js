import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { loadEvents } from '../storage/events';
import { calculateResults } from '../utils/calculate';

export default function ResultsScreen({ route, navigation }) {
  const { eventId } = route.params;
  const [event, setEvent] = useState(null);
  const [results, setResults] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadEvents().then(events => {
        const found = events.find(e => e.id === eventId);
        if (found) {
          setEvent(found);
          setResults(calculateResults(found.participants, found.payments));
        }
      });
    }, [eventId])
  );

  if (!event || !results) return null;

  const { total, share, balances, transactions } = results;

  return (
    <ScrollView style={styles.container}>
      {/* Resumo */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Resumo</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total gasto</Text>
          <Text style={styles.summaryValue}>R$ {total.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Pessoas</Text>
          <Text style={styles.summaryValue}>{event.participants.length}</Text>
        </View>
        <View style={[styles.summaryRow, styles.summaryHighlight]}>
          <Text style={styles.summaryLabelBold}>Cota por pessoa</Text>
          <Text style={styles.summaryValueBold}>R$ {share.toFixed(2)}</Text>
        </View>
      </View>

      {/* Quem deve pagar quem */}
      {transactions.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quem paga quem 💸</Text>
          {transactions.map((t, i) => (
            <View key={i} style={styles.transactionRow}>
              <View style={styles.transactionLeft}>
                <Text style={styles.transactionFrom}>{t.from}</Text>
                <Text style={styles.transactionArrow}>→ paga para →</Text>
                <Text style={styles.transactionTo}>{t.to}</Text>
              </View>
              <Text style={styles.transactionAmount}>R$ {t.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.allGoodText}>🎉 Tudo certo! Ninguém deve nada.</Text>
        </View>
      )}

      {/* Detalhes por pessoa */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Detalhes por pessoa</Text>
        {balances.map(b => {
          const isCreditor = b.balance > 0.01;
          const isDebtor = b.balance < -0.01;
          return (
            <View key={b.id} style={styles.balanceRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.balanceName}>{b.name}</Text>
                <Text style={styles.balancePaid}>Pagou: R$ {b.paid.toFixed(2)}</Text>
              </View>
              <View style={[
                styles.balanceBadge,
                isCreditor && styles.badgeGreen,
                isDebtor && styles.badgeRed,
              ]}>
                <Text style={[
                  styles.balanceBadgeText,
                  isCreditor && styles.badgeTextGreen,
                  isDebtor && styles.badgeTextRed,
                ]}>
                  {isCreditor ? '+' : ''}{b.balance.toFixed(2)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backBtnText}>← Voltar ao Evento</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  summaryHighlight: {
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  summaryLabel: { fontSize: 14, color: '#6B7280' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  summaryLabelBold: { fontSize: 15, fontWeight: '700', color: '#065F46' },
  summaryValueBold: { fontSize: 15, fontWeight: '700', color: '#22C55E' },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  transactionLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  transactionFrom: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
  transactionArrow: { fontSize: 12, color: '#9CA3AF' },
  transactionTo: { fontSize: 14, fontWeight: '700', color: '#22C55E' },
  transactionAmount: { fontSize: 15, fontWeight: '700', color: '#111827' },
  allGoodText: { fontSize: 16, color: '#065F46', textAlign: 'center', paddingVertical: 8 },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  balanceName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  balancePaid: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  balanceBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeGreen: { backgroundColor: '#D1FAE5' },
  badgeRed: { backgroundColor: '#FEE2E2' },
  balanceBadgeText: { fontSize: 13, fontWeight: '700', color: '#374151' },
  badgeTextGreen: { color: '#065F46' },
  badgeTextRed: { color: '#DC2626' },
  backBtn: {
    margin: 16,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  backBtnText: { color: '#374151', fontSize: 15, fontWeight: '600' },
});
