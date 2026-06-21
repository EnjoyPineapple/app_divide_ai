import { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { createEvent } from '../storage/events';

export default function CreateEventScreen({ navigation }) {
  const [eventName, setEventName] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [participants, setParticipants] = useState([]);

  function addParticipant() {
    const name = participantName.trim();
    if (!name) return;
    if (participants.find(p => p.name.toLowerCase() === name.toLowerCase())) {
      Alert.alert('Atenção', 'Já tem alguém com esse nome.');
      return;
    }
    setParticipants(prev => [...prev, { id: Date.now().toString(), name }]);
    setParticipantName('');
  }

  function removeParticipant(id) {
    setParticipants(prev => prev.filter(p => p.id !== id));
  }

  async function handleCreate() {
    if (!eventName.trim()) {
      Alert.alert('Atenção', 'Dá um nome para o evento.');
      return;
    }
    if (participants.length < 2) {
      Alert.alert('Atenção', 'Adicione pelo menos 2 pessoas.');
      return;
    }
    const event = await createEvent(eventName.trim());
    event.participants = participants;
    const { updateEvent } = await import('../storage/events');
    await updateEvent(event);
    navigation.replace('EventDetail', { eventId: event.id });
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Nome do evento</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Churrasco do final de ano"
          value={eventName}
          onChangeText={setEventName}
          autoFocus
        />

        <Text style={styles.label}>Participantes</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Nome da pessoa"
            value={participantName}
            onChangeText={setParticipantName}
            onSubmitEditing={addParticipant}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addBtn} onPress={addParticipant}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {participants.map(p => (
          <View key={p.id} style={styles.chip}>
            <Text style={styles.chipText}>{p.name}</Text>
            <TouchableOpacity onPress={() => removeParticipant(p.id)}>
              <Text style={styles.chipRemove}>×</Text>
            </TouchableOpacity>
          </View>
        ))}

        {participants.length > 0 && (
          <Text style={styles.count}>{participants.length} pessoa{participants.length !== 1 ? 's' : ''} adicionada{participants.length !== 1 ? 's' : ''}</Text>
        )}

        <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
          <Text style={styles.createBtnText}>Criar Evento →</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 20 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  row: { flexDirection: 'row', gap: 8 },
  addBtn: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 24, fontWeight: '600' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  chipText: { fontSize: 14, color: '#065F46', fontWeight: '500' },
  chipRemove: { fontSize: 20, color: '#065F46', marginLeft: 8, lineHeight: 20 },
  count: { fontSize: 13, color: '#6B7280', marginTop: 12 },
  createBtn: {
    backgroundColor: '#22C55E',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 40,
  },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
