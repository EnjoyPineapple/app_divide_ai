import { useCallback, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { loadEvents, updateEvent } from '../storage/events';
import Avatar from '../components/Avatar';
import FamilySection from '../components/FamilySection';
import { getColor } from '../utils/colors';
import { getPalette } from '../utils/palettes';

export default function EventDetailScreen({ route, navigation }) {
  const { eventId } = route.params;
  const [event, setEvent] = useState(null);
  const [palette, setPalette] = useState(getPalette('fintech'));
  const [payerIndex, setPayerIndex] = useState(0);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadEvents().then(events => {
        const found = events.find(e => e.id === eventId);
        if (found) {
          setEvent(found);
          const p = getPalette(found.paletteId);
          setPalette(p);
          navigation.setOptions({
            title: found.name,
            headerStyle: { backgroundColor: p.headerBg },
            headerTintColor: p.headerText,
            headerTitleStyle: { color: p.headerText, fontWeight: '700' },
          });
        }
      });
    }, [eventId])
  );

  async function saveEvent(updated) {
    await updateEvent(updated);
    setEvent(updated);
  }

  function handleAmountChange(text) {
    const digits = text.replace(/\D/g, '');
    if (!digits) { setAmount(''); return; }
    const cents = parseInt(digits, 10);
    const reais = Math.floor(cents / 100);
    const centavos = String(cents % 100).padStart(2, '0');
    setAmount(`${reais},${centavos}`);
  }

  async function addPayment() {
    const value = parseFloat(amount.replace(',', '.'));
    if (isNaN(value) || value <= 0) {
      Alert.alert('Atenção', 'Informe um valor válido.');
      return;
    }
    const payer = event.participants[payerIndex];
    const payment = {
      id: Date.now().toString(),
      participantId: payer.id,
      participantName: payer.name,
      participantIndex: payerIndex,
      amount: value,
      description: description.trim() || null,
    };
    await saveEvent({ ...event, payments: [...event.payments, payment] });
    setAmount('');
    setDescription('');
  }

  async function removePayment(paymentId) {
    await saveEvent({ ...event, payments: event.payments.filter(p => p.id !== paymentId) });
  }

  async function handleFamiliesUpdate(families) {
    await saveEvent({ ...event, families });
  }

  if (!event) return null;

  const total = event.payments.reduce((s, p) => s + p.amount, 0);
  const selectedColor = getColor(payerIndex);
  const families = event.families || [];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">

        {/* Participantes + Grupos Familiares */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Participantes</Text>
          <View style={styles.avatarGrid}>
            {event.participants.map((p, idx) => {
              const family = families.find(f => f.headId === p.id || f.memberIds.includes(p.id));
              const isHead = family?.headId === p.id;
              const isMember = family && !isHead;
              return (
                <View key={p.id} style={styles.avatarItem}>
                  <View style={[styles.avatarWrap, isMember && styles.avatarWrapCovered]}>
                    <Avatar name={p.name} index={idx} size={44} />
                    {isHead && <View style={styles.headBadge}><Text style={styles.headBadgeText}>★</Text></View>}
                    {isMember && <View style={styles.coveredBadge}><Text style={styles.coveredBadgeText}>♥</Text></View>}
                  </View>
                  <Text style={styles.avatarLabel} numberOfLines={1}>{p.name.split(' ')[0]}</Text>
                  {isMember && (
                    <Text style={styles.coveredLabel} numberOfLines={1}>
                      {event.participants.find(x => x.id === family.headId)?.name.split(' ')[0]}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>

          <FamilySection
            participants={event.participants}
            families={families}
            onUpdate={handleFamiliesUpdate}
          />
        </View>

        {/* Adicionar pagamento */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Registrar Pagamento</Text>

          <Text style={styles.label}>Quem pagou?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            <View style={styles.payerRow}>
              {event.participants.map((p, idx) => {
                const color = getColor(idx);
                const selected = payerIndex === idx;
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => setPayerIndex(idx)}
                    style={styles.payerItem}
                  >
                    <View style={[
                      styles.payerAvatarWrap,
                      selected && { borderColor: palette.primary, backgroundColor: palette.highlightBg },
                    ]}>
                      <Avatar name={p.name} index={idx} size={34} />
                    </View>
                    <Text style={[styles.payerName, selected && { color: palette.highlightText, fontWeight: '700' }]}
                      numberOfLines={1}>
                      {p.name.split(' ')[0].slice(0, 6)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <Text style={styles.label}>Valor (R$)</Text>
          <TextInput
            style={[styles.input, { borderColor: palette.highlightBorder }]}
            placeholder="0,00"
            value={amount}
            onChangeText={handleAmountChange}
            keyboardType="number-pad"
          />

          <Text style={styles.label}>Descrição (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Carne, bebidas..."
            value={description}
            onChangeText={setDescription}
          />

          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: palette.primary }]}
            onPress={addPayment}
          >
            <Text style={styles.addBtnText}>Adicionar Pagamento</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de pagamentos */}
        {event.payments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pagamentos ({event.payments.length})</Text>
            {event.payments.map(p => {
              const pIdx = event.participants.findIndex(x => x.id === p.participantId);
              return (
                <View key={p.id} style={styles.paymentRow}>
                  <Avatar name={p.participantName} index={pIdx >= 0 ? pIdx : 0} size={36} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.paymentName}>{p.participantName}</Text>
                    {p.description && <Text style={styles.paymentDesc}>{p.description}</Text>}
                  </View>
                  <Text style={[styles.paymentAmount, { color: palette.primary }]}>R$ {p.amount.toFixed(2)}</Text>
                  <TouchableOpacity onPress={() => removePayment(p.id)} style={styles.removeBtn}>
                    <Text style={styles.removeBtnText}>×</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>R$ {total.toFixed(2)}</Text>
            </View>
          </View>
        )}

        {event.payments.length > 0 && (
          <TouchableOpacity
            style={[styles.resultBtn, { backgroundColor: palette.headerBg }]}
            onPress={() => navigation.navigate('Results', { eventId: event.id })}
          >
            <Text style={styles.resultBtnText}>Ver Resultado 💰</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  section: {
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
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 4 },
  avatarItem: { alignItems: 'center', gap: 2 },
  avatarWrap: { position: 'relative' },
  avatarWrapCovered: { opacity: 0.85 },
  headBadge: {
    position: 'absolute', bottom: -2, right: -2,
    backgroundColor: '#F59E0B', borderRadius: 8, width: 16, height: 16,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff',
  },
  headBadgeText: { fontSize: 8, color: '#fff', fontWeight: '800' },
  coveredBadge: {
    position: 'absolute', bottom: -2, right: -2,
    backgroundColor: '#3B82F6', borderRadius: 8, width: 16, height: 16,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff',
  },
  coveredBadgeText: { fontSize: 8, color: '#fff', fontWeight: '800' },
  avatarLabel: { fontSize: 11, color: '#6B7280', fontWeight: '500', maxWidth: 48, textAlign: 'center' },
  coveredLabel: { fontSize: 9, color: '#3B82F6', fontWeight: '600', maxWidth: 48, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 8 },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginBottom: 4,
  },
  payerRow: { flexDirection: 'row', gap: 10, paddingBottom: 4 },
  payerItem: { alignItems: 'center', gap: 4, width: 48 },
  payerAvatarWrap: {
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: 'transparent',
    padding: 2,
  },
  payerName: { fontSize: 10, color: '#6B7280', fontWeight: '500', textAlign: 'center' },
  addBtn: {
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  paymentName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  paymentDesc: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  paymentAmount: { fontSize: 15, fontWeight: '700', marginRight: 8 },
  removeBtn: { padding: 4 },
  removeBtnText: { fontSize: 20, color: '#EF4444' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, marginTop: 4 },
  totalLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
  totalValue: { fontSize: 15, fontWeight: '700', color: '#111827' },
  resultBtn: { margin: 16, borderRadius: 14, padding: 16, alignItems: 'center' },
  resultBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
