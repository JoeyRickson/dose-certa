import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../ThemeContext';
import { AppColors } from '../theme';
import { DoseRecord, MedicationPlan } from '../types';
import { formatDateBR } from '../utils/date';

interface Props {
  pageBackground: string;
  plan: MedicationPlan;
  doses: DoseRecord[];
  onSelectDose: (dose: DoseRecord) => void;
}

export function HistoryScreen({ pageBackground, plan, doses, onSelectDose }: Props) {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const pastPills = useMemo(() => doses.filter((item) => item.kind === 'pill' && item.status !== 'pending'), [doses]);
  const taken = pastPills.filter((item) => item.status === 'taken').length;
  const missed = pastPills.filter((item) => item.status === 'missed').length;
  const adherence = pastPills.length ? Math.round((taken / pastPills.length) * 100) : 100;
  const recent = doses.slice(0, 30);

  return (
    <ScrollView contentContainerStyle={[styles.outer, { backgroundColor: pageBackground }]} showsVerticalScrollIndicator={false}>
      <View style={styles.shell}>
        <View>
          <Text style={styles.eyebrow}>HISTÓRICO</Text>
          <Text style={styles.title}>Seu acompanhamento</Text>
          <Text style={styles.subtitle}>Últimos registros salvos no aparelho.</Text>
        </View>

        <View style={styles.statsRow}>
          <Stat value={`${adherence}%`} label="Adesão registrada" tone="primary" />
          <Stat value={`${taken}`} label="Tomadas" tone="success" />
          <Stat value={`${missed}`} label="Não tomadas" tone="danger" />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View><Text style={styles.cardKicker}>REGISTROS</Text><Text style={styles.cardTitle}>{plan.name || 'Pílula anticoncepcional'}</Text></View>
            <View style={styles.countBadge}><Text style={styles.countText}>{recent.length}</Text></View>
          </View>

          {recent.length === 0 ? (
            <View style={styles.empty}><Text style={styles.emptyIcon}>🗂️</Text><Text style={styles.emptyTitle}>Ainda sem histórico</Text><Text style={styles.emptyText}>Os registros aparecerão aqui conforme você usar o app.</Text></View>
          ) : recent.map((dose, index) => (
            <Pressable key={dose.id} onPress={() => onSelectDose(dose)} style={[styles.recordRow, index !== recent.length - 1 && styles.recordBorder]}>
              <View style={[styles.statusIcon, statusBackground(dose, c)]}><Text style={[styles.statusSymbol, statusColor(dose, c)]}>{statusSymbol(dose)}</Text></View>
              <View style={styles.recordText}>
                <Text style={styles.recordDate}>{formatDateBR(dose.scheduled_date)}</Text>
                <Text style={styles.recordMeta}>{dose.kind === 'break' ? 'Pausa da cartela' : `Comprimido ${dose.pill_number ?? '—'} • previsto ${dose.scheduled_time}`}</Text>
              </View>
              <View style={styles.recordRight}>
                <Text style={[styles.recordStatus, statusColor(dose, c)]}>{statusLabel(dose)}</Text>
                {dose.taken_at ? <Text style={styles.recordTime}>{new Date(dose.taken_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text> : null}
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function Stat({ value, label, tone }: { value: string; label: string; tone: 'primary' | 'success' | 'danger' }) {
  const { colors: c } = useAppTheme();
  const bg = tone === 'success' ? c.successSoft : tone === 'danger' ? c.dangerSoft : c.surfaceSoft;
  return (
    <View style={[statStyles.stat, { backgroundColor: bg, borderColor: c.border }]}>
      <Text style={[statStyles.value, { color: c.text }]}>{value}</Text>
      <Text style={[statStyles.label, { color: c.muted }]}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  stat: { flex: 1, minWidth: 145, borderRadius: 22, padding: 16, minHeight: 108, justifyContent: 'flex-end', borderWidth: 1 },
  value: { fontSize: 26, fontWeight: '900' },
  label: { fontSize: 11, fontWeight: '700', marginTop: 4 },
});

function statusLabel(dose: DoseRecord) {
  if (dose.kind === 'break') return 'Pausa';
  if (dose.status === 'taken') return 'Tomado';
  if (dose.status === 'missed') return 'Não tomado';
  return 'Pendente';
}
function statusSymbol(dose: DoseRecord) {
  if (dose.kind === 'break') return '–';
  if (dose.status === 'taken') return '✓';
  if (dose.status === 'missed') return '!';
  return '•';
}
function statusColor(dose: DoseRecord, c: AppColors) {
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

function createStyles(c: AppColors) {
  return StyleSheet.create({
    outer: { flexGrow: 1, backgroundColor: c.backdrop, padding: 16, paddingBottom: 28 },
    shell: { width: '100%', maxWidth: 760, alignSelf: 'center', gap: 16 },
    eyebrow: { color: c.primary, fontWeight: '900', fontSize: 10, letterSpacing: 1.3 },
    title: { color: c.text, fontSize: 25, fontWeight: '900', marginTop: 3 },
    subtitle: { color: c.muted, fontSize: 12, marginTop: 4 },
    statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    card: { backgroundColor: c.surface, borderRadius: 26, borderWidth: 1, borderColor: c.border, padding: 18 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 8 },
    cardKicker: { color: c.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
    cardTitle: { color: c.text, fontSize: 18, fontWeight: '900', marginTop: 2 },
    countBadge: { minWidth: 34, height: 34, borderRadius: 17, backgroundColor: c.primarySoft, alignItems: 'center', justifyContent: 'center' },
    countText: { color: c.primaryDark, fontWeight: '900' },
    recordRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
    recordBorder: { borderBottomWidth: 1, borderBottomColor: c.border },
    statusIcon: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    statusSymbol: { fontSize: 17, fontWeight: '900' },
    recordText: { flex: 1, minWidth: 0 },
    recordDate: { color: c.text, fontSize: 14, fontWeight: '900' },
    recordMeta: { color: c.muted, fontSize: 10, marginTop: 3 },
    recordRight: { alignItems: 'flex-end', gap: 2 },
    recordStatus: { fontSize: 11, fontWeight: '900' },
    recordTime: { color: c.muted, fontSize: 10, fontWeight: '700' },
    empty: { alignItems: 'center', paddingVertical: 30, gap: 6 },
    emptyIcon: { fontSize: 30 },
    emptyTitle: { color: c.text, fontSize: 17, fontWeight: '900' },
    emptyText: { color: c.muted, fontSize: 12, textAlign: 'center' },
  });
}
