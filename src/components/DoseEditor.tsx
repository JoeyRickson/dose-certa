import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { TimePickerModal } from './TimePickerModal';
import { useAppTheme } from '../ThemeContext';
import { AppColors, getShadow } from '../theme';
import { DoseRecord, DoseStatus } from '../types';
import { formatDateBR, nowTime } from '../utils/date';

interface Props {
  dose: DoseRecord | null;
  visible: boolean;
  onClose: () => void;
  onSave: (status: DoseStatus, takenTime: string | null, notes: string | null) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function DoseEditor({ dose, visible, onClose, onSave, onDelete }: Props) {
  const theme = useAppTheme();
  const c = theme.colors;
  const styles = useMemo(() => createStyles(c), [c]);
  const [status, setStatus] = useState<DoseStatus>('pending');
  const [takenTime, setTakenTime] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);

  useEffect(() => {
    if (!dose) return;
    setStatus(dose.status);
    setTakenTime(dose.taken_at ? new Date(dose.taken_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : nowTime());
    setNotes(dose.notes ?? '');
  }, [dose]);

  if (!dose) return null;

  async function save() {
    setSaving(true);
    try {
      await onSave(status, status === 'taken' ? takenTime : null, notes || null);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert('Apagar registro?', `O registro de ${formatDateBR(dose.scheduled_date)} ficará oculto do histórico.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: async () => { await onDelete(); onClose(); } },
    ]);
  }

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.backdrop}>
          <View style={[styles.card, getShadow(theme)]}>
            <View style={styles.header}>
              <View style={styles.headerIcon}><Text style={styles.headerEmoji}>{dose.kind === 'break' ? '○' : '💊'}</Text></View>
              <View style={styles.headerText}>
                <Text style={styles.kicker}>EDITAR REGISTRO</Text>
                <Text style={styles.title}>{formatDateBR(dose.scheduled_date)}</Text>
                <Text style={styles.subtitle}>{dose.kind === 'break' ? 'Dia de pausa' : `Previsto ${dose.scheduled_time}${dose.pill_number ? ` • comprimido ${dose.pill_number}` : ''}`}</Text>
              </View>
              <Pressable onPress={onClose} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable>
            </View>

            {dose.kind === 'break' ? (
              <View style={styles.breakBox}><Text style={styles.breakText}>Este dia faz parte da pausa configurada da cartela.</Text></View>
            ) : (
              <>
                <Text style={styles.label}>Status</Text>
                <View style={styles.statusRow}>
                  <StatusButton label="Pendente" active={status === 'pending'} tone="pending" onPress={() => setStatus('pending')} />
                  <StatusButton label="Tomei" active={status === 'taken'} tone="taken" onPress={() => setStatus('taken')} />
                  <StatusButton label="Não tomei" active={status === 'missed'} tone="missed" onPress={() => setStatus('missed')} />
                </View>

                {status === 'taken' ? (
                  <>
                    <Text style={styles.label}>Horário em que tomou</Text>
                    <Pressable onPress={() => setTimeOpen(true)} style={styles.timeCard}>
                      <Text style={styles.timeIcon}>⏰</Text>
                      <View style={{ flex: 1 }}><Text style={styles.timeLabel}>Horário registrado</Text><Text style={styles.timeValue}>{takenTime}</Text></View>
                      <Text style={styles.chevron}>›</Text>
                    </Pressable>
                  </>
                ) : null}
              </>
            )}

            <Text style={styles.label}>Observação</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              style={[styles.input, styles.notes]}
              placeholder="Opcional"
              placeholderTextColor={c.muted}
              multiline
            />

            <Pressable disabled={saving} onPress={save} style={[styles.saveButton, saving && styles.disabled]}>
              <Text style={styles.saveText}>{saving ? 'Salvando...' : 'Salvar alteração'}</Text>
            </Pressable>
            <View style={styles.secondaryRow}>
              <Pressable onPress={confirmDelete} style={styles.deleteButton}><Text style={styles.deleteText}>Apagar registro</Text></Pressable>
              <Pressable onPress={onClose} style={styles.cancelButton}><Text style={styles.cancelText}>Cancelar</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <TimePickerModal visible={timeOpen} value={takenTime || nowTime()} title="Horário em que tomou" onClose={() => setTimeOpen(false)} onConfirm={(value) => { setTakenTime(value); setTimeOpen(false); }} />
    </>
  );
}

function StatusButton({ label, active, tone, onPress }: { label: string; active: boolean; tone: 'pending' | 'taken' | 'missed'; onPress: () => void }) {
  const { colors: c } = useAppTheme();
  const activeBg = tone === 'taken' ? c.successSoft : tone === 'missed' ? c.dangerSoft : c.pendingSoft;
  const activeColor = tone === 'taken' ? c.success : tone === 'missed' ? c.danger : c.pending;
  return (
    <Pressable
      onPress={onPress}
      style={[small.statusButton, { borderColor: active ? activeColor : c.border, backgroundColor: active ? activeBg : c.background }]}
    >
      <Text style={[small.statusText, { color: active ? activeColor : c.muted }]}>{label}</Text>
    </Pressable>
  );
}

const small = StyleSheet.create({
  statusButton: { flex: 1, minWidth: 100, minHeight: 46, borderWidth: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  statusText: { fontWeight: '800', fontSize: 11 },
});

function createStyles(c: AppColors) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.64)', justifyContent: 'center', alignItems: 'center', padding: 18 },
    card: { width: '100%', maxWidth: 500, backgroundColor: c.surface, borderRadius: 28, padding: 20, gap: 13, borderWidth: 1, borderColor: c.border },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerIcon: { width: 50, height: 50, borderRadius: 17, backgroundColor: c.surfaceSoft, alignItems: 'center', justifyContent: 'center' },
    headerEmoji: { fontSize: 24 },
    headerText: { flex: 1, minWidth: 0 },
    kicker: { color: c.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
    title: { color: c.text, fontSize: 20, fontWeight: '900', marginTop: 2 },
    subtitle: { color: c.muted, fontSize: 11, marginTop: 2 },
    close: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center' },
    closeText: { color: c.primaryDark, fontSize: 26, lineHeight: 28 },
    label: { color: c.text, fontWeight: '900', fontSize: 12, marginTop: 2 },
    statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    timeCard: { minHeight: 64, borderWidth: 1, borderColor: c.border, borderRadius: 18, backgroundColor: c.surfaceSoft, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 14 },
    timeIcon: { fontSize: 21 },
    timeLabel: { color: c.muted, fontSize: 9, fontWeight: '800' },
    timeValue: { color: c.primaryDark, fontSize: 20, fontWeight: '900' },
    chevron: { color: c.primary, fontSize: 27 },
    input: { minHeight: 48, borderWidth: 1, borderColor: c.border, borderRadius: 16, paddingHorizontal: 14, backgroundColor: c.background, color: c.text, fontSize: 15 },
    notes: { minHeight: 82, textAlignVertical: 'top', paddingTop: 12 },
    breakBox: { backgroundColor: c.breakSoft, padding: 14, borderRadius: 17 },
    breakText: { color: c.break, fontWeight: '700', fontSize: 12, lineHeight: 18 },
    saveButton: { minHeight: 50, borderRadius: 17, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
    saveText: { color: c.white, fontWeight: '900', fontSize: 13 },
    secondaryRow: { flexDirection: 'row', gap: 8 },
    deleteButton: { flex: 1, minHeight: 44, borderRadius: 15, backgroundColor: c.dangerSoft, borderWidth: 1, borderColor: c.danger, alignItems: 'center', justifyContent: 'center' },
    deleteText: { color: c.danger, fontWeight: '900', fontSize: 11 },
    cancelButton: { flex: 1, minHeight: 44, borderRadius: 15, backgroundColor: c.background, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
    cancelText: { color: c.muted, fontWeight: '900', fontSize: 11 },
    disabled: { opacity: 0.55 },
  });
}
