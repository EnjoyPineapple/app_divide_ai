import { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { createEvent, updateEvent } from '../storage/events';
import Avatar from '../components/Avatar';
import { PALETTES, DEFAULT_PALETTE_ID } from '../utils/palettes';

export default function CreateEventScreen({ navigation }) {
  const [eventName, setEventName] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [participants, setParticipants] = useState([]);
  const [selectedPalette, setSelectedPalette] = useState(DEFAULT_PALETTE_ID);

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
    event.paletteId = selectedPalette;
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

        <Text style={styles.label}>Estilo visual</Text>
        <View style={styles.paletteRow}>
          {Object.values(PALETTES).map(p => {
            const selected = selectedPalette === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.paletteCard, selected && { borderColor: p.primary, borderWidth: 2.5 }]}
                onPress={() => setSelectedPalette(p.id)}
                activeOpacity={0.8}
              >
                <View style={styles.paletteSwatches}>
                  <View style={[styles.swatch, { backgroundColor: p.preview[0], flex: 1.2 }]} />
                  <View style={[styles.swatch, { backgroundColor: p.preview[1], flex: 1 }]} />
                </View>
                <Text style={styles.paletteEmoji}>{p.emoji}</Text>
                <Text style={styles.paletteName} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.paletteDesc} numberOfLines={2}>{p.description}</Text>
                {selected && (
                  <View style={[styles.paletteCheck, { backgroundColor: p.primary }]}>
                    <Text style={styles.paletteCheckText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

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

        {participants.length > 0 && (
          <View style={styles.participantList}>
            {participants.map((p, idx) => (
              <View key={p.id} style={styles.participantRow}>
                <Avatar name={p.name} index={idx} size={38} />
                <Text style={styles.participantName}>{p.name}</Text>
                <TouchableOpacity onPress={() => removeParticipant(p.id)} style={styles.removeBtn}>
                  <Text style={styles.removeBtnText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {participants.length > 0 && (
          <Text style={styles.count}>{participants.length} pessoa{participants.length !== 1 ? 's' : ''} adicionada{participants.length !== 1 ? 's' : ''}</Text>
        )}

        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: PALETTES[selectedPalette].primary }]}
          onPress={handleCreate}
        >
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
  paletteRow: { flexDirection: 'row', gap: 8 },
  paletteCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    position: 'relative',
  },
  paletteSwatches: { flexDirection: 'row', height: 44 },
  swatch: { height: '100%' },
  paletteEmoji: { fontSize: 18, marginTop: 10, textAlign: 'center' },
  paletteName: { fontSize: 11, fontWeight: '800', color: '#111827', textAlign: 'center', marginTop: 4, paddingHorizontal: 4 },
  paletteDesc: { fontSize: 10, color: '#6B7280', textAlign: 'center', marginTop: 2, paddingHorizontal: 6, marginBottom: 10, lineHeight: 13 },
  paletteCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paletteCheckText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  participantList: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  participantName: { flex: 1, fontSize: 15, fontWeight: '500', color: '#111827' },
  removeBtn: { padding: 4 },
  removeBtnText: { fontSize: 22, color: '#9CA3AF', lineHeight: 22 },
  count: { fontSize: 13, color: '#6B7280', marginTop: 10 },
  createBtn: {
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 40,
  },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
