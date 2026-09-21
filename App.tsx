import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { DoseEditor } from './src/components/DoseEditor';
import { PlanForm } from './src/components/PlanForm';
import {
  countDeletedDoses,
  deleteAllData,
  ensureDoseRecords,
  getActivePlan,
  getAppSetting,
  getDoseByDate,
  getMonthDoses,
  getRecentDoses,
  initDatabase,
  rebuildFutureRecords,
  restoreDeletedDoses,
  savePlan,
  setAppSetting,
  softDeleteDose,
  updateDose,
} from './src/db/database';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { TodayScreen } from './src/screens/TodayScreen';
import { cancelPillNotifications, schedulePlanNotifications } from './src/services/notifications';
import { ThemeProvider } from './src/ThemeContext';
import { AppTheme, ThemeKey, appThemes, getTheme } from './src/theme';
import { DoseRecord, DoseStatus, MedicationPlan, PlanInput } from './src/types';
import { addDaysISO, dateAtTime, todayISO } from './src/utils/date';

type Tab = 'today' | 'calendar' | 'history' | 'settings';

export default function App() {
  const [ready, setReady] = useState(false);
  const [plan, setPlan] = useState<MedicationPlan | null>(null);
  const [todayDose, setTodayDose] = useState<DoseRecord | null>(null);
  const [tab, setTab] = useState<Tab>('today');
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [monthDoses, setMonthDoses] = useState<DoseRecord[]>([]);
  const [recentDoses, setRecentDoses] = useState<DoseRecord[]>([]);
  const [editingDose, setEditingDose] = useState<DoseRecord | null>(null);
  const [editingPlan, setEditingPlan] = useState(false);
  const [deletedCount, setDeletedCount] = useState(0);
  const [themeKey, setThemeKey] = useState<ThemeKey>('rose');
  const [quickThemeOpen, setQuickThemeOpen] = useState(false);

  const today = useMemo(() => todayISO(), []);
  const theme = useMemo(() => getTheme(themeKey), [themeKey]);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const pageBackground = theme.colors.backdrop;

  const reloadData = useCallback(async (activePlan?: MedicationPlan | null) => {
    const currentPlan = activePlan === undefined ? await getActivePlan() : activePlan;
    setPlan(currentPlan);
    if (!currentPlan) {
      setTodayDose(null);
      setMonthDoses([]);
      setRecentDoses([]);
      setDeletedCount(0);
      return;
    }

    await ensureDoseRecords(
      currentPlan,
      currentPlan.start_date < addDaysISO(today, -90) ? addDaysISO(today, -90) : currentPlan.start_date,
      500
    );

    const [dose, month, recent, deleted] = await Promise.all([
      getDoseByDate(currentPlan.id, today),
      getMonthDoses(currentPlan.id, monthDate.getFullYear(), monthDate.getMonth()),
      getRecentDoses(currentPlan.id, 90),
      countDeletedDoses(currentPlan.id),
    ]);

    setTodayDose(dose);
    setMonthDoses(month);
    setRecentDoses(recent);
    setDeletedCount(deleted);
  }, [monthDate, today]);

  const reschedule = useCallback(async (activePlan: MedicationPlan, requestPermission = false) => {
    await ensureDoseRecords(activePlan, today, 90);
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 3, 1, 12);
    const pool: DoseRecord[] = [];

    for (
      let cursor = new Date(now.getFullYear(), now.getMonth(), 1, 12);
      cursor <= end;
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1, 12)
    ) {
      const rows = await getMonthDoses(activePlan.id, cursor.getFullYear(), cursor.getMonth());
      pool.push(...rows);
    }

    await schedulePlanNotifications(activePlan, pool, requestPermission);
  }, [today]);

  useEffect(() => {
    (async () => {
      try {
        await initDatabase();
        const savedTheme = await getAppSetting('app_theme');
        const legacyTheme = savedTheme ?? await getAppSetting('background_theme');
        setThemeKey(getTheme(legacyTheme).key);
        const activePlan = await getActivePlan();
        await reloadData(activePlan);
        if (activePlan) await reschedule(activePlan, false);
      } catch (error) {
        console.error(error);
        Alert.alert('Erro ao iniciar', 'Não foi possível abrir o banco local do aplicativo.');
      } finally {
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!ready || !plan) return;
    (async () => {
      const month = await getMonthDoses(plan.id, monthDate.getFullYear(), monthDate.getMonth());
      setMonthDoses(month);
    })();
  }, [monthDate, ready, plan]);

  async function handleSavePlan(input: PlanInput) {
    const existingId = plan?.id;
    const id = await savePlan(input, existingId);
    const updated = await getActivePlan();
    if (!updated || updated.id !== id) throw new Error('Plano não encontrado após salvar.');

    if (existingId) await rebuildFutureRecords(updated, addDaysISO(today, 1));
    else await ensureDoseRecords(updated, updated.start_date, 500);

    await reloadData(updated);
    await reschedule(updated, input.notificationsEnabled);
    setEditingPlan(false);
    setTab('today');
  }

  async function quickUpdate(status: DoseStatus) {
    if (!todayDose) return;
    await updateDose(todayDose.id, status, status === 'taken' ? new Date().toISOString() : null, todayDose.notes);
    await reloadData(plan);
    if (plan) await reschedule(plan, false);
  }

  async function saveEditedDose(status: DoseStatus, takenTime: string | null, notes: string | null) {
    if (!editingDose) return;
    let takenAt: string | null = null;
    if (status === 'taken') {
      takenAt = takenTime && /^\d{2}:\d{2}$/.test(takenTime)
        ? dateAtTime(editingDose.scheduled_date, takenTime).toISOString()
        : new Date().toISOString();
    }
    await updateDose(editingDose.id, status, takenAt, notes);
    setEditingDose(null);
    await reloadData(plan);
    if (plan) await reschedule(plan, false);
  }

  async function deleteEditedDose() {
    if (!editingDose) return;
    await softDeleteDose(editingDose.id);
    setEditingDose(null);
    await reloadData(plan);
    if (plan) await reschedule(plan, false);
  }

  async function restoreDeleted() {
    if (!plan) return;
    await restoreDeletedDoses(plan.id);
    await reloadData(plan);
  }

  async function changeTheme(nextTheme: ThemeKey) {
    setThemeKey(nextTheme);
    await setAppSetting('app_theme', nextTheme);
  }

  async function quickChangeTheme(nextTheme: ThemeKey) {
    await changeTheme(nextTheme);
    setQuickThemeOpen(false);
  }

  async function wipeAll() {
    await cancelPillNotifications();
    await deleteAllData();
    setPlan(null);
    setTodayDose(null);
    setMonthDoses([]);
    setRecentDoses([]);
    setDeletedCount(0);
    setEditingDose(null);
    setEditingPlan(false);
    setThemeKey('rose');
    setTab('today');
  }

  if (!ready) {
    return (
      <ThemeProvider theme={theme}>
        <SafeAreaView style={styles.loading}>
          <StatusBar style={theme.dark ? 'light' : 'dark'} />
          <View style={styles.loadingMark}><Text style={styles.loadingEmoji}>💊</Text></View>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingTitle}>Pílula em Dia</Text>
          <Text style={styles.loadingText}>Abrindo seu controle...</Text>
        </SafeAreaView>
      </ThemeProvider>
    );
  }

  if (!plan) {
    return (
      <ThemeProvider theme={theme}>
        <SafeAreaView style={styles.safe}>
          <StatusBar style={theme.dark ? 'light' : 'dark'} />
          <PlanForm pageBackground={pageBackground} onSave={handleSavePlan} />
        </SafeAreaView>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <SafeAreaView style={styles.safe}>
        <StatusBar style={theme.dark ? 'light' : 'dark'} />
        <View style={styles.content}>
          {tab === 'today' ? (
            <TodayScreen
              pageBackground={pageBackground}
              plan={plan}
              dose={todayDose}
              monthDoses={monthDoses}
              today={today}
              onTaken={() => quickUpdate('taken')}
              onMissed={() => quickUpdate('missed')}
              onEdit={() => todayDose && setEditingDose(todayDose)}
              onOpenCalendar={() => { setMonthDate(new Date()); setTab('calendar'); }}
            />
          ) : tab === 'calendar' ? (
            <CalendarScreen
              pageBackground={pageBackground}
              plan={plan}
              doses={monthDoses}
              monthDate={monthDate}
              onMonthChange={setMonthDate}
              onSelectDose={setEditingDose}
            />
          ) : tab === 'history' ? (
            <HistoryScreen pageBackground={pageBackground} plan={plan} doses={recentDoses} onSelectDose={setEditingDose} />
          ) : (
            <SettingsScreen
              themeKey={themeKey}
              onThemeChange={changeTheme}
              plan={plan}
              deletedCount={deletedCount}
              onEditPlan={() => setEditingPlan(true)}
              onRestoreDeleted={restoreDeleted}
              onDeleteAll={wipeAll}
            />
          )}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Trocar tema do aplicativo"
          onPress={() => setQuickThemeOpen(true)}
          style={({ pressed }) => [styles.quickThemeButton, pressed && styles.quickThemeButtonPressed]}
        >
          <Text style={styles.quickThemeIcon}>🎨</Text>
          <View style={[styles.quickThemeDot, { backgroundColor: theme.colors.primary }]} />
        </Pressable>

        <View style={styles.navBackdrop} pointerEvents="box-none">
          <View style={styles.nav}>
            <TabButton theme={theme} icon="⌂" label="Hoje" active={tab === 'today'} onPress={() => { setMonthDate(new Date()); setTab('today'); }} />
            <TabButton theme={theme} icon="▦" label="Calendário" active={tab === 'calendar'} onPress={() => setTab('calendar')} />
            <TabButton theme={theme} icon="≡" label="Histórico" active={tab === 'history'} onPress={() => setTab('history')} />
            <TabButton theme={theme} icon="⚙" label="Ajustes" active={tab === 'settings'} onPress={() => setTab('settings')} />
          </View>
        </View>

        <Modal
          visible={quickThemeOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setQuickThemeOpen(false)}
        >
          <Pressable style={styles.themeModalBackdrop} onPress={() => setQuickThemeOpen(false)}>
            <Pressable style={styles.themeModalCard} onPress={() => {}}>
              <View style={styles.themeModalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.themeModalKicker}>APARÊNCIA</Text>
                  <Text style={styles.themeModalTitle}>Trocar tema</Text>
                  <Text style={styles.themeModalSubtitle}>Escolha uma cor e o app muda na hora.</Text>
                </View>
                <Pressable onPress={() => setQuickThemeOpen(false)} style={styles.themeModalClose}>
                  <Text style={styles.themeModalCloseText}>×</Text>
                </Pressable>
              </View>

              <View style={styles.themeQuickGrid}>
                {Object.values(appThemes).map((item) => {
                  const selected = item.key === themeKey;
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => quickChangeTheme(item.key)}
                      style={({ pressed }) => [
                        styles.themeQuickOption,
                        selected && styles.themeQuickOptionActive,
                        pressed && { opacity: 0.78 },
                      ]}
                    >
                      <View style={[styles.themeQuickPreview, { backgroundColor: item.colors.backdrop, borderColor: item.colors.border }]}>
                        <View style={[styles.themeQuickSurface, { backgroundColor: item.colors.surface }]}>
                          <View style={[styles.themeQuickAccent, { backgroundColor: item.colors.primary }]} />
                          <View style={[styles.themeQuickLine, { backgroundColor: item.colors.muted }]} />
                        </View>
                        {selected ? (
                          <View style={[styles.themeQuickCheck, { backgroundColor: item.colors.primary }]}>
                            <Text style={styles.themeQuickCheckText}>✓</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={[styles.themeQuickLabel, selected && styles.themeQuickLabelActive]} numberOfLines={2}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <DoseEditor
          dose={editingDose}
          visible={!!editingDose}
          onClose={() => setEditingDose(null)}
          onSave={saveEditedDose}
          onDelete={deleteEditedDose}
        />

        <Modal visible={editingPlan} animationType="slide" onRequestClose={() => setEditingPlan(false)}>
          <SafeAreaView style={styles.safe}>
            <PlanForm pageBackground={pageBackground} initial={plan} onSave={handleSavePlan} onCancel={() => setEditingPlan(false)} />
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </ThemeProvider>
  );
}

function TabButton({ theme, icon, label, active, onPress }: { theme: AppTheme; icon: string; label: string; active: boolean; onPress: () => void }) {
  const c = theme.colors;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        tabStyles.button,
        active && { backgroundColor: c.primarySoft },
        pressed && { opacity: 0.75 },
      ]}
    >
      <Text style={[tabStyles.icon, { color: active ? c.primaryDark : c.muted }]}>{icon}</Text>
      <Text style={[tabStyles.label, { color: active ? c.primaryDark : c.muted }]}>{label}</Text>
    </Pressable>
  );
}

const tabStyles = StyleSheet.create({
  button: { flex: 1, minHeight: 55, alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: 17 },
  icon: { fontSize: 20, fontWeight: '900' },
  label: { fontSize: 9, fontWeight: '900' },
});

function createStyles(theme: AppTheme) {
  const c = theme.colors;
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.backdrop },
    content: { flex: 1 },
    loading: { flex: 1, backgroundColor: c.backdrop, alignItems: 'center', justifyContent: 'center', gap: 10 },
    loadingMark: { width: 72, height: 72, borderRadius: 26, backgroundColor: c.surfaceSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 4, borderWidth: 1, borderColor: c.border },
    loadingEmoji: { fontSize: 34 },
    loadingTitle: { color: c.text, fontSize: 20, fontWeight: '900' },
    loadingText: { color: c.muted, fontSize: 12, fontWeight: '700' },
    quickThemeButton: {
      position: 'absolute', right: 18, bottom: 88, width: 52, height: 52, borderRadius: 18,
      backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center',
      shadowColor: c.shadow, shadowOpacity: theme.dark ? 0.35 : 0.14, shadowRadius: 14,
      shadowOffset: { width: 0, height: 7 }, elevation: 8, zIndex: 20,
    },
    quickThemeButtonPressed: { opacity: 0.78, transform: [{ scale: 0.96 }] },
    quickThemeIcon: { fontSize: 22 },
    quickThemeDot: { position: 'absolute', right: 6, bottom: 6, width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: c.surface },
    themeModalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.52)', justifyContent: 'flex-end', padding: 14 },
    themeModalCard: {
      width: '100%', maxWidth: 760, alignSelf: 'center', backgroundColor: c.surface, borderRadius: 28,
      borderWidth: 1, borderColor: c.border, padding: 18, paddingBottom: 22,
    },
    themeModalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
    themeModalKicker: { color: c.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
    themeModalTitle: { color: c.text, fontSize: 21, fontWeight: '900', marginTop: 3 },
    themeModalSubtitle: { color: c.muted, fontSize: 11, marginTop: 4 },
    themeModalClose: { width: 38, height: 38, borderRadius: 14, backgroundColor: c.surfaceSoft, alignItems: 'center', justifyContent: 'center' },
    themeModalCloseText: { color: c.text, fontSize: 25, lineHeight: 27, fontWeight: '600' },
    themeQuickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    themeQuickOption: { width: 92, minHeight: 96, borderRadius: 18, borderWidth: 1, borderColor: c.border, backgroundColor: c.background, padding: 8, alignItems: 'center', justifyContent: 'center', gap: 7 },
    themeQuickOptionActive: { borderColor: c.primary, backgroundColor: c.primarySoft },
    themeQuickPreview: { width: 62, height: 50, borderRadius: 13, borderWidth: 1, overflow: 'hidden', padding: 5, justifyContent: 'center', position: 'relative' },
    themeQuickSurface: { height: 34, borderRadius: 8, padding: 6, justifyContent: 'space-between' },
    themeQuickAccent: { height: 8, width: '68%', borderRadius: 5 },
    themeQuickLine: { height: 4, width: '45%', borderRadius: 3, opacity: 0.55 },
    themeQuickCheck: { position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    themeQuickCheckText: { color: c.white, fontSize: 11, fontWeight: '900' },
    themeQuickLabel: { color: c.muted, fontSize: 10, fontWeight: '800', textAlign: 'center' },
    themeQuickLabelActive: { color: c.primaryDark },
    navBackdrop: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', paddingHorizontal: 12, paddingBottom: 10 },
    nav: {
      width: '100%', maxWidth: 760, flexDirection: 'row', borderWidth: 1, borderColor: c.border,
      backgroundColor: c.surface, borderRadius: 24, padding: 7,
      shadowColor: c.shadow, shadowOpacity: theme.dark ? 0.34 : 0.12, shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 }, elevation: 8,
    },
  });
}
