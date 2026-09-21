import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../ThemeContext';
import { AppColors } from '../theme';
import { DoseRecord, MedicationPlan } from '../types';
import { formatDateBR, toISODate, todayISO } from '../utils/date';

interface Props {
  pageBackground: string;
  plan: MedicationPlan;
  doses: DoseRecord[];
  monthDate: Date;
  onMonthChange: (date: Date) => void;
  onSelectDose: (dose: DoseRecord) => void;
}

const week = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function CalendarScreen({ pageBackground, plan, doses, monthDate, onMonthChange, onSelectDose }: Props) {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  useEffect(() => {
    const now = new Date();
    if (year !== now.getFullYear() || month !== now.getMonth()) setSelectedDate(toISODate(new Date(year, month, 1, 12)));
    else setSelectedDate(todayISO());
  }, [year, month]);

  const doseMap = useMemo(() => new Map(doses.map((d) => [d.scheduled_date, d])), [doses]);
  const selected = doseMap.get(selectedDate) ?? null;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const cells = Array.from({ length: firstWeekday + daysInMonth }, (_, index) => index < firstWeekday ? null : index - firstWeekday + 1);
  while (cells.length % 7 !== 0) cells.push(null);

  const monthPills = doses.filter((item) => item.kind === 'pill' && (item.status === 'taken' || item.status === 'missed'));
  const taken = monthPills.filter((item) => item.status === 'taken').length;
  const adherence = monthPills.length ? Math.round((taken / monthPills.length) * 100) : 100;

  function shiftMonth(delta: number) {
    onMonthChange(new Date(year, month + delta, 1, 12));
  }

  return (
    <ScrollView contentContainerStyle={[styles.outer, { backgroundColor: pageBackground }]} showsVerticalScrollIndicator={false}>
      <View style={styles.shell}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>CALENDÁRIO</Text>
            <Text style={styles.title}>Seu mês</Text>
            <Text style={styles.subtitle}>Toque em um dia para consultar ou corrigir.</Text>
          </View>
          <View style={styles.score}><Text style={styles.scoreValue}>{adherence}%</Text><Text style={styles.scoreLabel}>adesão</Text></View>
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.monthHeader}>
            <Pressable onPress={() => shiftMonth(-1)} style={styles.arrowButton}><Text style={styles.arrowText}>‹</Text></Pressable>
            <View><Text style={styles.monthTitle}>{monthDate.toLocaleDateString('pt-BR', { month: 'long' })}</Text><Text style={styles.yearText}>{year}</Text></View>
            <Pressable onPress={() => shiftMonth(1)} style={styles.arrowButton}><Text style={styles.arrowText}>›</Text></Pressable>
          </View>

          <View style={styles.weekRow}>{week.map((day, i) => <Text key={`${day}-${i}`} style={styles.weekText}>{day}</Text>)}</View>
          <View style={styles.grid}>
            {cells.map((day, index) => {
              if (!day) return <View key={`empty-${index}`} style={styles.dayCell} />;
              const iso = toISODate(new Date(year, month, day, 12));
              const dose = doseMap.get(iso);
              const isToday = iso === todayISO();
              const isSelected = iso === selectedDate;
              return (
                <Pressable key={iso} onPress={() => setSelectedDate(iso)} style={[styles.dayCell, isSelected && styles.daySelected, isToday && !isSelected && styles.dayToday]}>
                  <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{day}</Text>
                  {dose ? <View style={[styles.dot, dotStyle(dose, c), isSelected && { backgroundColor: c.white }]} /> : <View style={styles.dotPlaceholder} />}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.legend}>
            <Legend label="Tomado" color={c.success} textColor={c.muted} />
            <Legend label="Não tomado" color={c.danger} textColor={c.muted} />
            <Legend label="Pendente" color={c.pending} textColor={c.muted} />
            <Legend label="Pausa" color={c.break} textColor={c.muted} />
          </View>
        </View>

        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View><Text style={styles.detailKicker}>DIA SELECIONADO</Text><Text style={styles.detailDate}>{formatDateBR(selectedDate)}</Text></View>
            {selected ? <View style={[styles.statusPill, statusBackground(selected, c)]}><Text style={[styles.statusPillText, statusTextStyle(selected, c)]}>{statusLabel(selected)}</Text></View> : null}
          </View>

          {!selected ? (
            <View style={styles.emptyDetail}><Text style={styles.emptyIcon}>○</Text><Text style={styles.detailEmpty}>Nenhum registro ativo nesta data.</Text></View>
          ) : selected.kind === 'break' ? (
            <>
              <Text style={styles.detailTitle}>Pausa da cartela</Text>
              <Text style={styles.detailText}>Não há comprimido programado para este dia.</Text>
              <Pressable onPress={() => onSelectDose(selected)} style={styles.editButton}><Text style={styles.editText}>Editar registro</Text></Pressable>
            </>
          ) : (
            <>
              <View style={styles.infoGrid}>
                <InfoBox label="Comprimido" value={`${selected.pill_number ?? '—'}/${plan.pill_count}`} />
                <InfoBox label="Previsto" value={selected.scheduled_time} />
                <InfoBox label="Tomado às" value={selected.taken_at ? new Date(selected.taken_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—'} />
              </View>
              {selected.notes ? <View style={styles.notesBox}><Text style={styles.notesLabel}>Observação</Text><Text style={styles.notes}>{selected.notes}</Text></View> : null}
              <Pressable onPress={() => onSelectDose(selected)} style={styles.editButton}><Text style={styles.editText}>Corrigir / editar registro</Text></Pressable>
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  const { colors: c } = useAppTheme();
  return <View style={[mini.infoBox, { backgroundColor: c.background, borderColor: c.border }]}><Text style={[mini.infoLabel, { color: c.muted }]}>{label}</Text><Text style={[mini.infoValue, { color: c.text }]}>{value}</Text></View>;
}
function dotStyle(dose: DoseRecord, c: AppColors) {
  if (dose.kind === 'break') return { backgroundColor: c.break };
  if (dose.status === 'taken') return { backgroundColor: c.success };
  if (dose.status === 'missed') return { backgroundColor: c.danger };
  return { backgroundColor: c.pending };
}
function statusLabel(dose: DoseRecord) {
  if (dose.kind === 'break') return 'Pausa';
  if (dose.status === 'taken') return 'Tomado';
  if (dose.status === 'missed') return 'Não tomado';
  return 'Pendente';
}
function statusTextStyle(dose: DoseRecord, c: AppColors) {
  if (dose.kind === 'break') return { color: c.break };
  if (dose.status === 'taken') return { color: c.success };
  if (dose.status === 'missed') return { color: c.danger };
  return { color: c.pending };
}
function statusBackground(dose: DoseRecord, c: AppColors) {
  if (dose.kind === 'break') return { backgroundColor: c.breakSoft };
  if (dose.status === 'taken') return { backgroundColor: c.successSoft };
  if (dose.status === 'missed') return { backgroundColor: c.dangerSoft };
  return { backgroundColor: c.pendingSoft };
}
function Legend({ label, color, textColor }: { label: string; color: string; textColor: string }) {
  return <View style={mini.legendItem}><View style={[mini.legendDot, { backgroundColor: color }]} /><Text style={[mini.legendText, { color: textColor }]}>{label}</Text></View>;
}

const mini = StyleSheet.create({
  infoBox: { flex: 1, minWidth: 110, borderRadius: 18, padding: 13, borderWidth: 1 },
  infoLabel: { fontSize: 9, fontWeight: '800' },
  infoValue: { fontSize: 15, fontWeight: '900', marginTop: 3 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontSize: 10, fontWeight: '700' },
});

function createStyles(c: AppColors) {
  return StyleSheet.create({
    outer: { flexGrow: 1, backgroundColor: c.backdrop, padding: 16, paddingBottom: 110 },
    shell: { width: '100%', maxWidth: 760, alignSelf: 'center', gap: 16 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 },
    eyebrow: { color: c.primary, fontWeight: '900', fontSize: 10, letterSpacing: 1.3 },
    title: { color: c.text, fontSize: 25, fontWeight: '900', marginTop: 3 },
    subtitle: { color: c.muted, fontSize: 12, marginTop: 4 },
    score: { width: 64, height: 64, borderRadius: 22, backgroundColor: c.surfaceSoft, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
    scoreValue: { color: c.primaryDark, fontSize: 17, fontWeight: '900' },
    scoreLabel: { color: c.muted, fontSize: 9, fontWeight: '800' },
    calendarCard: { backgroundColor: c.surface, borderRadius: 28, borderWidth: 1, borderColor: c.border, padding: 18 },
    monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
    arrowButton: { width: 44, height: 44, borderRadius: 15, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background },
    arrowText: { color: c.text, fontSize: 28, lineHeight: 30 },
    monthTitle: { color: c.text, textTransform: 'capitalize', fontWeight: '900', fontSize: 19, textAlign: 'center' },
    yearText: { color: c.muted, fontSize: 10, fontWeight: '800', textAlign: 'center', marginTop: 1 },
    weekRow: { flexDirection: 'row', marginBottom: 5 },
    weekText: { width: '14.2857%', textAlign: 'center', color: c.muted, fontSize: 10, fontWeight: '900' },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCell: { width: '14.2857%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 15, gap: 4 },
    daySelected: { backgroundColor: c.primary },
    dayToday: { borderWidth: 1, borderColor: c.primary },
    dayText: { color: c.text, fontWeight: '800', fontSize: 13 },
    dayTextSelected: { color: c.white },
    dot: { width: 6, height: 6, borderRadius: 3 },
    dotPlaceholder: { width: 6, height: 6 },
    legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: c.border },
    detailCard: { backgroundColor: c.surface, borderRadius: 26, borderWidth: 1, borderColor: c.border, padding: 18, gap: 12 },
    detailHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center' },
    detailKicker: { color: c.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
    detailDate: { color: c.text, fontWeight: '900', fontSize: 18, marginTop: 2 },
    statusPill: { borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7 },
    statusPillText: { fontSize: 10, fontWeight: '900' },
    detailTitle: { color: c.text, fontSize: 17, fontWeight: '900' },
    detailText: { color: c.muted, fontSize: 12, lineHeight: 18 },
    detailEmpty: { color: c.muted, fontSize: 12 },
    emptyDetail: { alignItems: 'center', paddingVertical: 12, gap: 5 },
    emptyIcon: { color: c.muted, fontSize: 24 },
    infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    notesBox: { backgroundColor: c.surfaceLavender, borderRadius: 17, padding: 13, borderWidth: 1, borderColor: c.border },
    notesLabel: { color: c.secondary, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
    notes: { color: c.text, fontSize: 12, lineHeight: 18, marginTop: 4 },
    editButton: { minHeight: 46, borderRadius: 16, backgroundColor: c.primarySoft, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
    editText: { color: c.primaryDark, fontWeight: '900', fontSize: 12 },
  });
}
