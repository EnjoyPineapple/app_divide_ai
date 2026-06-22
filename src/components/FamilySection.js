import { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Avatar from './Avatar';

export default function FamilySection({ participants, families, onUpdate }) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null); // family being edited
  const [headId, setHeadId] = useState(null);
  const [memberIds, setMemberIds] = useState([]);

  // ids already in a family (excluding the one being edited)
  const usedIds = new Set(
    families
      .filter(f => !editing || f.id !== editing.id)
      .flatMap(f => [f.headId, ...f.memberIds])
  );

  function openCreate() {
    setEditing(null);
    setHeadId(null);
    setMemberIds([]);
    setShowModal(true);
  }

  function openEdit(family) {
    setEditing(family);
    setHeadId(family.headId);
    setMemberIds([...family.memberIds]);
    setShowModal(true);
  }

  function toggleMember(id) {
    if (id === headId || usedIds.has(id)) return;
    setMemberIds(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  }

  function save() {
    if (!headId) { Alert.alert('Atenção', 'Selecione o responsável.'); return; }
    if (memberIds.length === 0) { Alert.alert('Atenção', 'Selecione pelo menos um dependente.'); return; }

    const entry = { id: editing?.id ?? Date.now().toString(), headId, memberIds };
    const updated = editing
      ? families.map(f => f.id === editing.id ? entry : f)
      : [...families, entry];

    onUpdate(updated);
    setShowModal(false);
  }

  function remove(familyId) {
    Alert.alert('Remover família', 'Remover este grupo familiar?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => onUpdate(families.filter(f => f.id !== familyId)) },
    ]);
  }

  function getP(id) {
    const idx = participants.findIndex(p => p.id === id);
    return { p: participants[idx], idx };
  }

  return (
    <View style={styles.wrapper}>
      {families.length > 0 && (
        <View style={styles.familiesList}>
          {families.map(family => {
            const { p: head, idx: hIdx } = getP(family.headId);
            if (!head) return null;
            return (
              <TouchableOpacity
                key={family.id}
                style={styles.familyCard}
                onPress={() => openEdit(family)}
                onLongPress={() => remove(family.id)}
                activeOpacity={0.75}
              >
                <View style={styles.familyLeft}>
                  <Avatar name={head.name} index={hIdx} size={36} />
                  <View>
                    <Text style={styles.headName}>{head.name.split(' ')[0]}</Text>
                    <Text style={styles.headLabel}>paga por</Text>
                  </View>
                </View>
                <View style={styles.membersRow}>
                  {family.memberIds.map((mId, i) => {
                    const { p: m, idx: mIdx } = getP(mId);
                    if (!m) return null;
                    return (
                      <View key={mId} style={[styles.memberWrap, { marginLeft: i === 0 ? 0 : -8 }]}>
                        <Avatar name={m.name} index={mIdx} size={30} />
                      </View>
                    );
                  })}
                  <Text style={styles.membersNames}>
                    {' '}{family.memberIds.map(id => getP(id).p?.name.split(' ')[0]).filter(Boolean).join(', ')}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
        <Text style={styles.addBtnText}>👨‍👩‍👧 Criar Grupo Familiar</Text>
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{editing ? 'Editar Família' : 'Novo Grupo Familiar'}</Text>
            <Text style={styles.sheetDesc}>
              O responsável paga por todos do grupo — cada um continua com sua cota individual, mas a dívida vai para o responsável.
            </Text>

            <Text style={styles.fieldLabel}>Quem é o responsável?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
              <View style={styles.chipRow}>
                {participants.map((p, idx) => {
                  const taken = usedIds.has(p.id);
                  const selected = headId === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.chip, selected && styles.chipSelectedGreen, taken && styles.chipDisabled]}
                      disabled={taken}
                      onPress={() => {
                        setHeadId(p.id);
                        setMemberIds(prev => prev.filter(m => m !== p.id));
                      }}
                    >
                      <Avatar name={p.name} index={idx} size={30} />
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                        {p.name.split(' ')[0]}
                      </Text>
                      {selected && <Text style={styles.checkmark}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <Text style={styles.fieldLabel}>Quem está incluído no grupo? (dependentes)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
              <View style={styles.chipRow}>
                {participants.filter(p => p.id !== headId).map(p => {
                  const idx = participants.findIndex(x => x.id === p.id);
                  const taken = usedIds.has(p.id);
                  const selected = memberIds.includes(p.id);
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.chip, selected && styles.chipSelectedBlue, taken && styles.chipDisabled]}
                      disabled={taken}
                      onPress={() => toggleMember(p.id)}
                    >
                      <Avatar name={p.name} index={idx} size={30} />
                      <Text style={[styles.chipText, selected && { color: '#1D4ED8', fontWeight: '700' }]}>
                        {p.name.split(' ')[0]}
                      </Text>
                      {selected && <Text style={[styles.checkmark, { color: '#2563EB' }]}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {headId && memberIds.length > 0 && (
              <View style={styles.preview}>
                <Text style={styles.previewText}>
                  {participants.find(p => p.id === headId)?.name.split(' ')[0]} vai pagar por{' '}
                  {memberIds.map(id => participants.find(p => p.id === id)?.name.split(' ')[0]).join(', ')}
                </Text>
              </View>
            )}

            <View style={styles.sheetButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={save}>
                <Text style={styles.saveText}>Salvar Grupo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: 16 },
  familiesList: { gap: 8, marginBottom: 8 },
  familyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 10,
  },
  familyLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 110 },
  headName: { fontSize: 13, fontWeight: '700', color: '#92400E' },
  headLabel: { fontSize: 10, color: '#B45309' },
  membersRow: { flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  memberWrap: { borderWidth: 2, borderColor: '#FFFBEB', borderRadius: 20 },
  membersNames: { fontSize: 12, color: '#6B7280', fontWeight: '500', marginLeft: 4 },
  addBtn: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  addBtnText: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 44,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 6 },
  sheetDesc: { fontSize: 13, color: '#6B7280', lineHeight: 18, marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 10, marginTop: 4 },
  chipRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  chip: {
    alignItems: 'center',
    gap: 4,
    padding: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#F3F4F6',
    minWidth: 64,
  },
  chipSelectedGreen: { borderColor: '#22C55E', backgroundColor: '#F0FDF4' },
  chipSelectedBlue: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  chipDisabled: { opacity: 0.3 },
  chipText: { fontSize: 11, fontWeight: '600', color: '#374151', textAlign: 'center' },
  chipTextSelected: { color: '#065F46' },
  checkmark: { fontSize: 11, color: '#22C55E', fontWeight: '800' },
  preview: { backgroundColor: '#FEF3C7', borderRadius: 10, padding: 10, marginTop: 12 },
  previewText: { fontSize: 13, color: '#92400E', fontWeight: '600', textAlign: 'center' },
  sheetButtons: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12, padding: 14, alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  saveBtn: { flex: 1, backgroundColor: '#22C55E', borderRadius: 12, padding: 14, alignItems: 'center' },
  saveText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
