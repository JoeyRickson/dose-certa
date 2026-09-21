import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../ThemeContext';
import { AppColors, getShadow } from '../theme';
import { pad2 } from '../utils/date';

interface Props {
  visible: boolean;
  value: string;
  title?: string;
  onClose: () => void;
  onConfirm: (value: string) => void;
}

const quickTimes = ['07:00', '08:00', '12:00', '18:00', '21:00', '22:00'];

export function TimePickerModal({ visible, value, title = 'Horário diário', onClose, onConfirm }: Props) {
  const theme = useAppTheme();
  const c = theme.colors;
  const styles = useMemo(() => createStyles(c), [c]);
  const parsed = useMemo(() => {
    const [h, m] = value.split(':').map(Number);
    return { hour: Number.isFinite(h) ? h : 21, minute: Number.isFinite(m) ? m : 0 };
  }, [value]);
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);

  useEffect(() => {
    if (!visible) return;
    setHour(parsed.hour);
    setMinute(parsed.minute);
  }, [visible, parsed.hour, parsed.minute]);

  function bumpHour(delta: number) { setHour((current) => (current + delta + 24) % 24); }
  function bumpMinute(delta: number) { setMinute((current) => (current + delta + 60) % 60); }
  function chooseQuick(time: string) {
    const [h, m] = time.split(':').map(Number);
    setHour(h); setMinute(m);
  }

  const selected = `${pad2(hour)}:${pad2(minute)}`;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, getShadow(theme)]}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.kicker}>LEMBRETE</Text>
              <Text style={styles.title}>{title}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable>
          </View>

          <View style={styles.clockRow}>
            <NumberColumn label="Hora" value={pad2(hour)} onMinus={() => bumpHour(-1)} onPlus={() => bumpHour(1)} />
            <Text style={styles.colon}>:</Text>
            <NumberColumn label="Min" value={pad2(minute)} onMinus={() => bumpMinute(-5)} onPlus={() => bumpMinute(5)} />
          </View>

          <Text style={styles.quickLabel}>Horários rápidos</Text>
          <View style={styles.quickRow}>
            {quickTimes.map((time) => (
              <Pressable key={time} onPress={() => chooseQuick(time)} style={[styles.quickChip, selected === time && styles.quickChipActive]}>
                <Text style={[styles.quickText, selected === time && styles.quickTextActive]}>{time}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable onPress={() => onConfirm(selected)} style={styles.confirmButton}>
            <Text style={styles.confirmText}>Usar {selected}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function NumberColumn({ label, value, onMinus, onPlus }: { label: string; value: string; onMinus: () => void; onPlus: () => void }) {
  const { colors: c } = useAppTheme();
  return (
    <View style={small.numberColumn}>
      <Text style={[small.numberLabel, { color: c.muted }]}>{label}</Text>
      <Pressable onPress={onPlus} style={[small.stepButton, { borderColor: c.border, backgroundColor: c.background }]}><Text style={[small.stepText, { color: c.primaryDark }]}>+</Text></Pressable>
      <Text style={[small.numberValue, { color: c.text, backgroundColor: c.surfaceSoft }]}>{value}</Text>
      <Pressable onPress={onMinus} style={[small.stepButton, { borderColor: c.border, backgroundColor: c.background }]}><Text style={[small.stepText, { color: c.primaryDark }]}>−</Text></Pressable>
    </View>
  );
}

const small = StyleSheet.create({
  numberColumn: { alignItems: 'center', gap: 10 },
  numberLabel: { fontSize: 12, fontWeight: '800' },
  numberValue: { minWidth: 88, textAlign: 'center', fontSize: 42, fontWeight: '900', borderRadius: 22, paddingVertical: 12, overflow: 'hidden' },
  stepButton: { width: 46, height: 40, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 23, fontWeight: '900', lineHeight: 25 },
});

function createStyles(c: AppColors) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', alignItems: 'center', justifyContent: 'center', padding: 18 },
    card: { width: '100%', maxWidth: 430, backgroundColor: c.surface, borderRadius: 28, padding: 20, borderWidth: 1, borderColor: c.border },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    kicker: { color: c.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
    title: { color: c.text, fontSize: 22, fontWeight: '900', marginTop: 3 },
    close: { width: 42, height: 42, borderRadius: 21, backgroundColor: c.surfaceSoft, alignItems: 'center', justifyContent: 'center' },
    closeText: { color: c.primaryDark, fontSize: 28, lineHeight: 30 },
    clockRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginVertical: 20 },
    colon: { color: c.primary, fontSize: 42, fontWeight: '900', marginTop: 22 },
    quickLabel: { color: c.text, fontWeight: '900', fontSize: 13, marginBottom: 10 },
    quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    quickChip: { borderWidth: 1, borderColor: c.border, backgroundColor: c.background, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9 },
    quickChipActive: { backgroundColor: c.primarySoft, borderColor: c.primary },
    quickText: { color: c.muted, fontWeight: '800', fontSize: 12 },
    quickTextActive: { color: c.primaryDark },
    confirmButton: { minHeight: 52, borderRadius: 17, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
    confirmText: { color: c.white, fontWeight: '900', fontSize: 15 },
  });
}
