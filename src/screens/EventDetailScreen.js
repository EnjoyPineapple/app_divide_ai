import { useCallback, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { loadEvents, updateEvent } from '../storage/events';

export default function EventDetailScreen({ route, navigation }) {
  const { eventId } = route.params;
  const [event, setEvent] = useState(null);
  const [payerIndex, setPayerIndex] = useState(0);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadEvents().then(events => {
        const found = events.find(e => e.id === eventId);
        if (found) {
          setEvent(found);
          navigation.setOptions({ title: found.name });
        }
      });
    }, [eventId])
  );

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
      amount: value,
      description: description.trim() || null,
    };
    const updated = { ...event, payments: [...event.payments, payment] };
    await updateEvent(updated);
    setEvent(updated);
    setAmount('');
    setDescription('');
  }

  async function removePayment(paymentId) {
    const updated = { ...event, payments: event.payments.filter(p => p.id !== paymentId) };
    await updateEvent(updated);
    setEvent(updated);
  }

  if (!event) return null;

  const total = event.payments.reduce((s, p) => s + p.amount, 0);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">

        {/* Participantes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Participantes</Text>
          <View style={styles.chips}>
            {event.participants.map(p => (
              <View key={p.id} style={styles.chip}>
                <Text style={styles.chipText}>{p.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Adicionar pagamento */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Registrar Pagamento</Text>

          <Text style={styles.label}>Quem pagou?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <View style={styles.chips}>
              {event.participants.map((p, idx) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => setPayerIndex(idx)}
                  style={[styles.chip, payerIndex === idx && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, payerIndex === idx && styles.chipTextSelected]}>
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Text style={styles.label}>Valor (R$)</Text>
          <TextInput
            style={styles.input}
            placeholder="0,00"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Descrição (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Carne, bebidas..."
            value={description}
            onChangeText={setDescription}
          />

          <TouchableOpacity style={styles.addBtn} onPress={addPayment}>
            <Text style={styles.addBtnText}>Adicionar</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de pagamentos */}
        {event.payments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pagamentos ({event.payments.length})</Text>
            {event.payments.map(p => (
              <View key={p.id} style={styles.paymentRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentName}>{p.participantName}</Text>
                  {p.description && <Text style={styles.paymentDesc}>{p.description}</Text>}
                </View>
                <Text style={styles.paymentAmount}>R$ {p.amount.toFixed(2)}</Text>
                <TouchableOpacity onPress={() => removePayment(p.id)} style={styles.removeBtn}>
                  <Text style={styles.removeBtnText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>R$ {total.toFixed(2)}</Text>
            </View>
          </View>
        )}

        {/* Botão ver resultado */}
        {event.payments.length > 0 && (
          <TouchableOpacity
            style={styles.resultBtn}
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
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 8 },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 4,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  chipSelected: { backgroundColor: '#D1FAE5', borderColor: '#22C55E' },
  chipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  chipTextSelected: { color: '#065F46', fontWeight: '700' },
  addBtn: {
    backgroundColor: '#22C55E',
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
  paymentAmount: { fontSize: 15, fontWeight: '700', color: '#22C55E', marginRight: 12 },
  removeBtn: { padding: 4 },
  removeBtnText: { fontSize: 20, color: '#EF4444' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
  totalValue: { fontSize: 15, fontWeight: '700', color: '#111827' },
  resultBtn: {
    margin: 16,
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  resultBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
