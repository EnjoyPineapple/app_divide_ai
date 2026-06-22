import { useCallback, useRef, useState } from 'react';
import { Alert, Image, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { loadEvents, updateEvent } from '../storage/events';
import { calculateResults } from '../utils/calculate';
import { getPalette } from '../utils/palettes';
import Avatar from '../components/Avatar';

export default function ResultsScreen({ route, navigation }) {
  const { eventId } = route.params;
  const [event, setEvent] = useState(null);
  const [results, setResults] = useState(null);
  const [palette, setPalette] = useState(getPalette('fintech'));
  const shareRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      loadEvents().then(events => {
        const found = events.find(e => e.id === eventId);
        if (found) {
          setEvent(found);
          setResults(calculateResults(found.participants, found.payments, found.families || []));
          const p = getPalette(found.paletteId);
          setPalette(p);
          navigation.setOptions({
            headerStyle: { backgroundColor: p.headerBg },
            headerTintColor: p.headerText,
            headerTitleStyle: { color: p.headerText, fontWeight: '700' },
          });
        }
      });
    }, [eventId])
  );

  if (!event || !results) return null;

  const { total, share, balances, transactions } = results;

  async function handleShareText() {
    const lines = [
      `🧾 *${event.name}* — Divide Aí`,
      '',
      `Total: R$ ${total.toFixed(2)}`,
      `Cota por pessoa: R$ ${share.toFixed(2)}`,
      '',
      '💸 *Quem paga quem:*',
      ...transactions.map(t => `• ${t.from} → paga R$ ${t.amount.toFixed(2)} para ${t.to}`),
      transactions.length === 0 ? '• Ninguém deve nada! 🎉' : '',
      '',
      '_Divide Aí — feito pela Enjoy Pineapple_',
      '_enjoypineapple.com.br_',
    ].filter(l => l !== undefined);
    Share.share({ message: lines.join('\n') });
  }

  async function handleComplete() {
    const action = event.completed ? 'Reabrir' : 'Concluir';
    const msg = event.completed
      ? 'Reabrir este evento para edições?'
      : 'Marcar evento como concluído? Ele ficará arquivado na Home.';
    Alert.alert(`${action} Evento`, msg, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: action, style: event.completed ? 'default' : 'destructive',
        onPress: async () => {
          const updated = { ...event, completed: !event.completed };
          await updateEvent(updated);
          setEvent(updated);
          if (!event.completed) navigation.navigate('Home');
        },
      },
    ]);
  }

  async function handleSharePhoto() {
    try {
      const uri = await captureRef(shareRef, { format: 'png', quality: 0.95 });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Compartilhar resultado' });
      } else {
        await handleShareText();
      }
    } catch {
      await handleShareText();
    }
  }

  return (
    <ScrollView style={styles.container}>

      {/* Card capturável para foto */}
      <View ref={shareRef} collapsable={false} style={styles.shareCard}>
        <View style={[styles.shareCardHeader, { backgroundColor: palette.headerBg }]}>
          <Text style={[styles.shareCardApp, { color: palette.headerText, opacity: 0.75 }]}>🧾 Divide Aí</Text>
          <Text style={[styles.shareCardEvent, { color: palette.headerText }]}>{event.name}</Text>
          <Text style={[styles.shareCardPalette, { color: palette.headerText, opacity: 0.6 }]}>
            {getPalette(event.paletteId).emoji} {getPalette(event.paletteId).name}
          </Text>
        </View>

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
          <View style={[styles.summaryRow, styles.summaryHighlight, { backgroundColor: palette.highlightBg, borderRadius: 10 }]}>
            <Text style={[styles.summaryLabelBold, { color: palette.highlightText }]}>Cota por pessoa</Text>
            <Text style={[styles.summaryValueBold, { color: palette.primary }]}>R$ {share.toFixed(2)}</Text>
          </View>
        </View>

        {/* Quem paga quem */}
        {transactions.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Quem paga quem 💸</Text>
            {transactions.map((t, i) => {
              const fromIdx = event.participants.findIndex(p => p.name === t.from);
              const toIdx = event.participants.findIndex(p => p.name === t.to);
              return (
                <View key={i} style={styles.transactionRow}>
                  <Avatar name={t.from} index={fromIdx >= 0 ? fromIdx : i} size={34} />
                  <View style={styles.transactionMiddle}>
                    <Text style={styles.transactionFrom}>{t.from}</Text>
                    <Text style={styles.transactionArrow}>paga para</Text>
                    <Text style={[styles.transactionTo, { color: palette.primary }]}>{t.to}</Text>
                  </View>
                  <View style={styles.transactionRight}>
                    <Avatar name={t.to} index={toIdx >= 0 ? toIdx : i + 1} size={34} />
                    <Text style={styles.transactionAmount}>R$ {t.amount.toFixed(2)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.allGoodText}>🎉 Tudo certo! Ninguém deve nada.</Text>
          </View>
        )}

        {/* Detalhes por pessoa */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Detalhes por pessoa</Text>
          {balances.map((b, idx) => {
            const isCreditor = b.balance > 0.01;
            const isDebtor = b.balance < -0.01;

            if (b.isCovered) {
              return (
                <View key={b.id} style={[styles.balanceRow, styles.coveredRow]}>
                  <Avatar name={b.name} index={idx} size={36} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.balanceName}>{b.name}</Text>
                    <Text style={styles.coveredByText}>coberto por {b.coveredByName}</Text>
                  </View>
                  <View style={styles.coveredBadge}>
                    <Text style={styles.coveredBadgeText}>♥ família</Text>
                  </View>
                </View>
              );
            }

            return (
              <View key={b.id} style={styles.balanceRow}>
                <Avatar name={b.name} index={idx} size={40} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.balanceName}>
                    {b.name}{b.isHead ? ' ★' : ''}
                  </Text>
                  <Text style={styles.balancePaid}>Pagou: R$ {b.paid.toFixed(2)}</Text>
                  {b.coveredMembers?.length > 0 && (
                    <Text style={styles.coversText}>
                      paga por: {b.coveredMembers.join(', ')}
                    </Text>
                  )}
                </View>
                <View style={[styles.balanceBadge, isCreditor && styles.badgeGreen, isDebtor && styles.badgeRed]}>
                  <Text style={[styles.balanceBadgeText, isCreditor && styles.badgeTextGreen, isDebtor && styles.badgeTextRed]}>
                    {isCreditor ? '+' : ''}{b.balance.toFixed(2)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.shareCardFooter}>
          <Image source={require('../../assets/icon.png')} style={styles.footerLogo} />
          <View style={styles.footerTexts}>
            <Text style={styles.footerAppName}>Divide Aí</Text>
            <Text style={styles.footerBy}>feito pela Enjoy Pineapple • enjoypineapple.com.br</Text>
          </View>
        </View>
      </View>

      {/* Botões de compartilhar */}
      <View style={styles.shareRow}>
        <TouchableOpacity
          style={[styles.sharePhotoBtn, { backgroundColor: palette.primary }]}
          onPress={handleSharePhoto}
        >
          <Text style={styles.shareBtnText}>📸 Compartilhar foto</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareTextBtn} onPress={handleShareText}>
          <Text style={styles.shareTextBtnText}>📤 Texto</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.completeBtn, event.completed && styles.completeBtnDone]}
        onPress={handleComplete}
      >
        <Text style={[styles.completeBtnText, event.completed && styles.completeBtnTextDone]}>
          {event.completed ? '↩ Reabrir Evento' : '✓ Concluir Evento'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backBtnText}>← Voltar ao Evento</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  shareCard: { backgroundColor: '#F9FAFB' },
  shareCardHeader: {
    padding: 16,
    paddingTop: 20,
    alignItems: 'center',
    margin: 16,
    marginBottom: 0,
    borderRadius: 16,
  },
  shareCardApp: { fontSize: 13, fontWeight: '600' },
  shareCardEvent: { fontSize: 20, fontWeight: '800', marginTop: 4 },
  shareCardPalette: { fontSize: 11, fontWeight: '600', marginTop: 6 },
  shareCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  footerLogo: { width: 36, height: 36, borderRadius: 8 },
  footerTexts: { alignItems: 'flex-start' },
  footerAppName: { fontSize: 13, fontWeight: '800', color: '#111827' },
  footerBy: { fontSize: 10, color: '#9CA3AF', fontWeight: '500' },
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
  summaryHighlight: { paddingHorizontal: 12, marginTop: 4 },
  summaryLabel: { fontSize: 14, color: '#6B7280' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  summaryLabelBold: { fontSize: 15, fontWeight: '700' },
  summaryValueBold: { fontSize: 15, fontWeight: '700' },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    borderRadius: 10,
    gap: 10,
    paddingHorizontal: 4,
  },
  transactionMiddle: { flex: 1, alignItems: 'center' },
  transactionFrom: { fontSize: 13, fontWeight: '700', color: '#EF4444' },
  transactionArrow: { fontSize: 11, color: '#9CA3AF', marginVertical: 2 },
  transactionTo: { fontSize: 13, fontWeight: '700' },
  transactionRight: { alignItems: 'center', gap: 4 },
  transactionAmount: { fontSize: 13, fontWeight: '700', color: '#111827' },
  allGoodText: { fontSize: 16, color: '#065F46', textAlign: 'center', paddingVertical: 8 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  balanceName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  balancePaid: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  balanceBadge: { backgroundColor: '#F3F4F6', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10 },
  badgeGreen: { backgroundColor: '#D1FAE5' },
  badgeRed: { backgroundColor: '#FEE2E2' },
  balanceBadgeText: { fontSize: 13, fontWeight: '700', color: '#374151' },
  badgeTextGreen: { color: '#065F46' },
  badgeTextRed: { color: '#DC2626' },
  coveredRow: { backgroundColor: '#EFF6FF', borderRadius: 10, paddingHorizontal: 8 },
  coveredByText: { fontSize: 12, color: '#2563EB', marginTop: 2, fontWeight: '500' },
  coveredBadge: { backgroundColor: '#DBEAFE', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10 },
  coveredBadgeText: { fontSize: 12, color: '#1D4ED8', fontWeight: '700' },
  coversText: { fontSize: 11, color: '#D97706', marginTop: 2, fontWeight: '600' },
  shareRow: { flexDirection: 'row', margin: 16, marginBottom: 0, gap: 10 },
  sharePhotoBtn: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  shareTextBtn: { backgroundColor: '#F3F4F6', borderRadius: 14, padding: 14, paddingHorizontal: 20, alignItems: 'center' },
  shareBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  shareTextBtnText: { color: '#374151', fontSize: 14, fontWeight: '700' },
  backBtn: { margin: 16, marginBottom: 0, borderRadius: 14, padding: 16, alignItems: 'center', backgroundColor: '#F3F4F6' },
  backBtnText: { color: '#374151', fontSize: 15, fontWeight: '600' },
  completeBtn: {
    margin: 16,
    marginBottom: 0,
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  completeBtnDone: { backgroundColor: '#F3F4F6' },
  completeBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  completeBtnTextDone: { color: '#374151' },
});
