import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../ThemeContext';
import { AppColors, getShadow } from '../theme';
import { parseISODate, toISODate, todayISO } from '../utils/date';

interface Props {
  visible: boolean;
  value: string | null;
  title: string;
  allowClear?: boolean;
  onClose: () => void;
  onConfirm: (value: string | null) => void;
}

const week = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function DatePickerModal({ visible, value, title, allowClear, onClose, onConfirm }: Props) {
  const theme = useAppTheme();
  const c = theme.colors;
  const styles = useMemo(() => createStyles(c), [c]);
  const initial = value ? parseISODate(value) : parseISODate(todayISO());
  const [cursor, setCursor] = useState(initial);
  const [selected, setSelected] = useState<string | null>(value);

  useEffect(() => {
    if (!visible) return;
    const next = value ? parseISODate(value) : parseISODate(todayISO());
    setCursor(next);
    setSelected(value);
  }, [visible, value]);

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstWeekday = new Date(year, month, 1, 12).getDay();
    const daysInMonth = new Date(year, month + 1, 0, 12).getDate();
    const result: Array<number | null> = [];
    for (let i = 0; i < firstWeekday; i += 1) result.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) result.push(day);
    while (result.length % 7 !== 0) result.push(null);
    return result;
  }, [cursor]);

  const monthTitle = cursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  function moveMonth(delta: number) {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1, 12));
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, getShadow(theme)]}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.kicker}>SELECIONAR DATA</Text>
              <Text style={styles.title}>{title}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable>
          </View>

          <View style={styles.monthRow}>
            <Pressable onPress={() => moveMonth(-1)} style={styles.arrow}><Text style={styles.arrowText}>‹</Text></Pressable>
            <Text style={styles.monthTitle}>{monthTitle}</Text>
            <Pressable onPress={() => moveMonth(1)} style={styles.arrow}><Text style={styles.arrowText}>›</Text></Pressable>
          </View>

          <View style={styles.weekRow}>
            {week.map((day, index) => <Text key={`${day}-${index}`} style={styles.weekText}>{day}</Text>)}
          </View>

          <View style={styles.grid}>
            {cells.map((day, index) => {
              if (!day) return <View key={`empty-${index}`} style={styles.dayCell} />;
              const iso = toISODate(new Date(cursor.getFullYear(), cursor.getMonth(), day, 12));
              const active = selected === iso;
              const isToday = iso === todayISO();
              return (
                <Pressable key={iso} onPress={() => setSelected(iso)} style={[styles.dayCell, active && styles.dayActive, isToday && !active && styles.dayToday]}>
                  <Text style={[styles.dayText, active && styles.dayTextActive]}>{day}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.actions}>
            {allowClear ? (
              <Pressable onPress={() => onConfirm(null)} style={styles.clearButton}>
                <Text style={styles.clearText}>Sem data final</Text>
              </Pressable>
            ) : <View />}
            <Pressable disabled={!selected} onPress={() => selected && onConfirm(selected)} style={[styles.confirmButton, !selected && styles.disabled]}>
              <Text style={styles.confirmText}>Confirmar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', alignItems: 'center', justifyContent: 'center', padding: 18 },
    card: { width: '100%', maxWidth: 430, backgroundColor: c.surface, borderRadius: 28, padding: 20, borderWidth: 1, borderColor: c.border },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerText: { flex: 1 },
    kicker: { color: c.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
    title: { color: c.text, fontSize: 22, fontWeight: '900', marginTop: 3 },
    close: { width: 42, height: 42, borderRadius: 21, backgroundColor: c.surfaceSoft, alignItems: 'center', justifyContent: 'center' },
    closeText: { color: c.primaryDark, fontSize: 28, lineHeight: 30 },
    monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 12 },
    arrow: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center' },
    arrowText: { color: c.text, fontSize: 28, lineHeight: 30 },
    monthTitle: { color: c.text, textTransform: 'capitalize', fontSize: 16, fontWeight: '900' },
    weekRow: { flexDirection: 'row', marginBottom: 4 },
    weekText: { width: '14.2857%', textAlign: 'center', color: c.muted, fontSize: 11, fontWeight: '900' },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCell: { width: '14.2857%', aspectRatio: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    dayActive: { backgroundColor: c.primary },
    dayToday: { borderWidth: 1, borderColor: c.primary },
    dayText: { color: c.text, fontWeight: '800', fontSize: 14 },
    dayTextActive: { color: c.white },
    actions: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 18, alignItems: 'center' },
    clearButton: { minHeight: 46, paddingHorizontal: 8, justifyContent: 'center' },
    clearText: { color: c.muted, fontWeight: '800' },
    confirmButton: { minHeight: 48, paddingHorizontal: 22, borderRadius: 16, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' },
    confirmText: { color: c.white, fontWeight: '900' },
    disabled: { opacity: 0.45 },
  });
}
