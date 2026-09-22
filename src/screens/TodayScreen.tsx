import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProgressRing } from '../components/ProgressRing';
import { useAppTheme } from '../ThemeContext';
import { AppColors, getShadow } from '../theme';
import { DoseRecord, MedicationPlan } from '../types';
import { formatDateLong, parseISODate, todayISO } from '../utils/date';

interface Props {
  pageBackground: string;
  plan: MedicationPlan;
  dose: DoseRecord | null;
  monthDoses: DoseRecord[];
  today: string;
  onTaken: () => Promise<void>;
  onMissed: () => Promise<void>;
  onEdit: () => void;
  onOpenCalendar: () => void;
}

export function TodayScreen({ pageBackground, plan, dose, monthDoses, today, onTaken, onMissed, onEdit, onOpenCalendar }: Props) {
  const theme = useAppTheme();
  const c = theme.colors;
  const styles = useMemo(() => createStyles(c), [c]);
  const intro = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(1)).current;
  const { width, height } = useWindowDimensions();
  const compact = width < 390;
  const veryCompact = width < 350;
  const shortScreen = height < 700;

  useEffect(() => {
    Animated.timing(intro, { toValue: 1, duration: 420, useNativeDriver: true }).start();
  }, [intro]);

  useEffect(() => {
    if (dose?.status !== 'taken') return;
    Animated.sequence([
      Animated.timing(successScale, { toValue: 1.08, duration: 180, useNativeDriver: true }),
      Animated.spring(successScale, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
  }, [dose?.status, successScale]);

  const displayName = plan.name.trim() || 'Sua pílula';
  const greeting = getGreeting();
  const answered = monthDoses.filter((item) => item.kind === 'pill' && (item.status === 'taken' || item.status === 'missed'));
  const taken = answered.filter((item) => item.status === 'taken').length;
  const adherence = answered.length ? Math.round((taken / answered.length) * 100) : 100;
  const pillNumber = dose?.pill_number ?? 0;
  const progress = dose?.kind === 'pill' && pillNumber ? pillNumber / Math.max(1, plan.pill_count) : dose?.kind === 'break' ? 1 : 0;
  const remaining = dose?.kind === 'pill' && pillNumber ? Math.max(0, plan.pill_count - pillNumber) : 0;

  const weekItems = useMemo(() => {
    const current = parseISODate(today);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(current);
      date.setDate(current.getDate() + index - 3);
      const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const record = monthDoses.find((item) => item.scheduled_date === iso) ?? null;
      return { iso, date, record };
    });
  }, [monthDoses, today]);

  return (
    <ScrollView contentContainerStyle={[styles.outer, { backgroundColor: pageBackground, paddingHorizontal: compact ? 12 : 16 }]} showsVerticalScrollIndicator={false}>
      <Animated.View style={[styles.shell, { opacity: intro, transform: [{ translateY: intro.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>
        <View style={[styles.topBar, compact && { gap: 9 }]}>
          <View style={[styles.brandMark, compact && { width: 42, height: 42, borderRadius: 15 }]}><Text style={[styles.brandEmoji, compact && { fontSize: 22 }]}>💊</Text></View>
          <View style={styles.topText}>
            <Text style={[styles.greeting, compact && { fontSize: 18 }]}>{greeting}</Text>
            <Text style={[styles.date, compact && { fontSize: 10 }]} numberOfLines={1} adjustsFontSizeToFit>{formatDateLong(today)}</Text>
          </View>
          <View style={[styles.streakBadge, compact && { paddingHorizontal: 8, paddingVertical: 7 }]}><Text style={styles.streakIcon}>♡</Text><Text style={[styles.streakText, compact && { fontSize: 11 }]}>{adherence}%</Text></View>
        </View>

        <LinearGradient colors={theme.heroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.heroCard, compact && { padding: 16, borderRadius: 26 }, getShadow(theme)]}>
          <View style={styles.heroHeader}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.heroKicker}>HOJE • {displayName.toUpperCase()}</Text>
              <Text style={[styles.heroTitle, compact && { fontSize: 21 }]}>{dose?.kind === 'break' ? 'Dia de pausa' : 'Sua dose de hoje'}</Text>
            </View>
            {dose?.pill_number ? <View style={styles.pillBadge}><Text style={styles.pillBadgeText}>{dose.pill_number}/{plan.pill_count}</Text></View> : null}
          </View>

          <View style={styles.heroContent}>
            <ProgressRing
              size={veryCompact || shortScreen ? 136 : 150}
              stroke={veryCompact || shortScreen ? 11 : 12}
              progress={progress}
              mainText={dose?.kind === 'break' ? 'Pausa' : dose?.scheduled_time ?? plan.medication_time}
              subText={dose?.kind === 'break' ? `${plan.break_days} dias configurados` : dose?.status === 'taken' ? 'dose registrada' : 'horário programado'}
            />

            <View style={[styles.heroInfo, compact && { minWidth: '100%', maxWidth: '100%' }]}>
              {dose?.kind === 'break' ? (
                <>
                  <Text style={styles.heroBigText}>Hoje não há comprimido programado.</Text>
                  <Text style={styles.heroBody}>O calendário continua acompanhando sua cartela normalmente.</Text>
                </>
              ) : dose?.status === 'taken' ? (
                <Animated.View style={{ transform: [{ scale: successScale }] }}>
                  <Text style={styles.successCheck}>✓</Text>
                  <Text style={styles.heroBigText}>Registrado!</Text>
                  <Text style={styles.heroBody}>Tomado às {dose.taken_at ? new Date(dose.taken_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—'}.</Text>
                </Animated.View>
              ) : dose?.status === 'missed' ? (
                <>
                  <Text style={styles.missedIcon}>!</Text>
                  <Text style={styles.heroBigText}>Marcado como não tomado</Text>
                  <Text style={styles.heroBody}>Você pode corrigir esse registro quando quiser.</Text>
                </>
              ) : (
                <>
                  <Text style={styles.heroBigText}>Faltam {remaining} comprimido{remaining === 1 ? '' : 's'} depois de hoje.</Text>
                  <Text style={styles.heroBody}>Toque em “Tomei” quando concluir a dose.</Text>
                </>
              )}
            </View>
          </View>

          {dose?.kind === 'pill' && dose.status === 'pending' ? (
            <View style={[styles.actionRow, compact && { flexDirection: 'column' }]}>
              <Pressable onPress={onTaken} style={({ pressed }) => [styles.primaryAction, compact && { width: '100%', minWidth: 0 }, pressed && styles.pressed]}>
                <Text style={styles.primaryActionText}>✓  Tomei</Text>
              </Pressable>
              <Pressable onPress={onMissed} style={({ pressed }) => [styles.secondaryAction, compact && { width: '100%', minWidth: 0 }, pressed && styles.pressed]}>
                <Text style={styles.secondaryActionText}>Não tomei</Text>
              </Pressable>
            </View>
          ) : dose ? (
            <Pressable onPress={onEdit} style={styles.editLink}><Text style={styles.editLinkText}>Editar registro de hoje</Text></Pressable>
          ) : null}
        </LinearGradient>

        <View style={[styles.weekCard, compact && { padding: 14, borderRadius: 22 }]}>
          <View style={styles.sectionHeader}>
            <View><Text style={styles.sectionKicker}>VISÃO RÁPIDA</Text><Text style={styles.sectionTitle}>Sua semana</Text></View>
            <Pressable onPress={onOpenCalendar}><Text style={styles.link}>Ver calendário</Text></Pressable>
          </View>
          <View style={[styles.weekRow, compact && { gap: 2 }]}>
            {weekItems.map(({ iso, date, record }) => {
              const active = iso === todayISO();
              return (
                <View key={iso} style={[styles.dayMini, active && styles.dayMiniActive]}>
                  <Text style={[styles.dayMiniWeek, active && styles.dayMiniTextActive]}>{date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').slice(0, 3)}</Text>
                  <Text style={[styles.dayMiniNumber, active && styles.dayMiniTextActive]}>{date.getDate()}</Text>
                  <View style={[styles.statusDot, statusDot(record, c), active && record ? { borderWidth: 1, borderColor: c.white } : null]} />
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard icon="◎" value={`${adherence}%`} label="Adesão registrada" tone="primary" />
          <MetricCard icon="✓" value={`${taken}`} label="Tomadas no mês" tone="success" />
          <MetricCard icon="⏰" value={plan.medication_time} label="Horário diário" tone="secondary" />
        </View>

        <View style={styles.infoStrip}>
          <Text style={styles.infoIcon}>i</Text>
          <Text style={styles.infoText}>Este app acompanha somente cartela, horário e registros. Não calcula ovulação ou período fértil.</Text>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

function MetricCard({ icon, value, label, tone }: { icon: string; value: string; label: string; tone: 'primary' | 'success' | 'secondary' }) {
  const { colors: c } = useAppTheme();
  const bg = tone === 'success' ? c.successSoft : tone === 'secondary' ? c.surfaceLavender : c.surfaceSoft;
  const iconColor = tone === 'success' ? c.success : tone === 'secondary' ? c.secondary : c.primaryDark;
  return (
    <View style={[metricStyles.card, { backgroundColor: bg, borderColor: c.border }]}>
      <Text style={[metricStyles.icon, { color: iconColor }]}>{icon}</Text>
      <Text style={[metricStyles.value, { color: c.text }]}>{value}</Text>
      <Text style={[metricStyles.label, { color: c.muted }]}>{label}</Text>
    </View>
  );
}

const metricStyles = StyleSheet.create({
  card: { flex: 1, minWidth: 145, borderRadius: 22, padding: 16, minHeight: 125, justifyContent: 'space-between', borderWidth: 1 },
  icon: { fontSize: 19, fontWeight: '900' },
  value: { fontSize: 24, fontWeight: '900', marginTop: 10 },
  label: { fontSize: 11, fontWeight: '700', marginTop: 2 },
});

function statusDot(record: DoseRecord | null, c: AppColors) {
  if (!record) return { backgroundColor: c.border };
  if (record.kind === 'break') return { backgroundColor: c.break };
  if (record.status === 'taken') return { backgroundColor: c.success };
  if (record.status === 'missed') return { backgroundColor: c.danger };
  return { backgroundColor: c.pending };
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    outer: { flexGrow: 1, backgroundColor: c.backdrop, padding: 16, paddingBottom: 28 },
    shell: { width: '100%', maxWidth: 760, alignSelf: 'center', gap: 16 },
    topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 2, paddingTop: 2 },
    brandMark: { width: 46, height: 46, borderRadius: 17, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border },
    brandEmoji: { fontSize: 24 },
    topText: { flex: 1, minWidth: 0 },
    greeting: { color: c.text, fontSize: 20, fontWeight: '900' },
    date: { color: c.muted, fontSize: 11, marginTop: 2, textTransform: 'capitalize' },
    streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8 },
    streakIcon: { color: c.primary, fontWeight: '900' },
    streakText: { color: c.primaryDark, fontSize: 12, fontWeight: '900' },
    heroCard: { borderRadius: 30, padding: 20, borderWidth: 1, borderColor: c.border },
    heroHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' },
    heroKicker: { color: c.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.15 },
    heroTitle: { color: c.text, fontSize: 23, fontWeight: '900', marginTop: 4 },
    pillBadge: { backgroundColor: c.surface, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7, borderWidth: 1, borderColor: c.border },
    pillBadgeText: { color: c.primaryDark, fontSize: 11, fontWeight: '900' },
    heroContent: { marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 20 },
    heroInfo: { flex: 1, minWidth: 210, maxWidth: 340 },
    heroBigText: { color: c.text, fontSize: 19, fontWeight: '900', lineHeight: 25 },
    heroBody: { color: c.muted, fontSize: 13, lineHeight: 19, marginTop: 6 },
    successCheck: { width: 36, height: 36, textAlign: 'center', lineHeight: 36, borderRadius: 18, overflow: 'hidden', backgroundColor: c.successSoft, color: c.success, fontSize: 20, fontWeight: '900', marginBottom: 7 },
    missedIcon: { width: 36, height: 36, textAlign: 'center', lineHeight: 36, borderRadius: 18, overflow: 'hidden', backgroundColor: c.dangerSoft, color: c.danger, fontSize: 20, fontWeight: '900', marginBottom: 7 },
    actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
    primaryAction: { flex: 1, minWidth: 160, minHeight: 54, borderRadius: 18, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' },
    primaryActionText: { color: c.white, fontSize: 16, fontWeight: '900' },
    secondaryAction: { minWidth: 130, minHeight: 54, borderRadius: 18, borderWidth: 1, borderColor: c.danger, backgroundColor: c.dangerSoft, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
    secondaryActionText: { color: c.danger, fontWeight: '900' },
    editLink: { minHeight: 46, alignSelf: 'flex-start', justifyContent: 'center', marginTop: 10 },
    editLinkText: { color: c.primaryDark, fontWeight: '900' },
    pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
    weekCard: { backgroundColor: c.surface, borderRadius: 26, borderWidth: 1, borderColor: c.border, padding: 18 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 },
    sectionKicker: { color: c.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
    sectionTitle: { color: c.text, fontSize: 19, fontWeight: '900', marginTop: 2 },
    link: { color: c.primary, fontSize: 12, fontWeight: '900' },
    weekRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 5, marginTop: 16 },
    dayMini: { flex: 1, minWidth: 0, alignItems: 'center', gap: 5, paddingVertical: 9, borderRadius: 16 },
    dayMiniActive: { backgroundColor: c.primary },
    dayMiniWeek: { color: c.muted, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
    dayMiniNumber: { color: c.text, fontSize: 15, fontWeight: '900' },
    dayMiniTextActive: { color: c.white },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    infoStrip: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 6 },
    infoIcon: { width: 24, height: 24, borderRadius: 12, overflow: 'hidden', backgroundColor: c.surfaceLavender, textAlign: 'center', lineHeight: 24, color: c.secondary, fontWeight: '900' },
    infoText: { flex: 1, color: c.muted, fontSize: 10, lineHeight: 15 },
  });
}
