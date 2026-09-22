import React, { useMemo, useState } from 'react';
import { Alert, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../ThemeContext';
import { AppColors, ThemeKey, appThemes, backgroundThemes } from '../theme';
import { MedicationPlan, ReminderMode } from '../types';
import { formatDateBR } from '../utils/date';

interface Props {
  themeKey: ThemeKey;
  onThemeChange: (theme: ThemeKey) => Promise<void>;
  plan: MedicationPlan;
  deletedCount: number;
  onEditPlan: () => void;
  onRestoreDeleted: () => Promise<void>;
  onDeleteAll: () => Promise<void>;
  reminderMode: ReminderMode;
  alarmRepeatMinutes: number;
  alarmRepeatCount: number;
  onReminderModeChange: (mode: ReminderMode) => Promise<void>;
  onAlarmRepeatMinutesChange: (minutes: number) => Promise<void>;
  onAlarmRepeatCountChange: (count: number) => Promise<void>;
  onTestAlarm: () => Promise<void>;
}

export function SettingsScreen({
  themeKey,
  onThemeChange,
  plan,
  deletedCount,
  onEditPlan,
  onRestoreDeleted,
  onDeleteAll,
  reminderMode,
  alarmRepeatMinutes,
  alarmRepeatCount,
  onReminderModeChange,
  onAlarmRepeatMinutesChange,
  onAlarmRepeatCountChange,
  onTestAlarm,
}: Props) {
  const theme = useAppTheme();
  const c = theme.colors;
  const styles = useMemo(() => createStyles(c), [c]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [testingAlarm, setTestingAlarm] = useState(false);

  function confirmRestore() {
    Alert.alert('Restaurar registros?', `Existem ${deletedCount} registro(s) apagado(s).`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Restaurar', onPress: onRestoreDeleted },
    ]);
  }

  function confirmDeleteAll() {
    setDeleteModalVisible(true);
  }

  async function handleDeleteAll() {
    try {
      setDeleting(true);
      await onDeleteAll();
      setDeleteModalVisible(false);
    } catch (error) {
      console.error(error);
      Alert.alert('Não foi possível apagar', 'Ocorreu um erro ao limpar os dados locais. Tente novamente.');
    } finally {
      setDeleting(false);
    }
  }

  async function handleTestAlarm() {
    try {
      setTestingAlarm(true);
      await onTestAlarm();
    } finally {
      setTestingAlarm(false);
    }
  }

  async function openAlarmSettings() {
    try {
      if (Platform.OS === 'android') {
        await Linking.sendIntent('android.settings.REQUEST_SCHEDULE_EXACT_ALARM');
        return;
      }
      await Linking.openSettings();
    } catch (error) {
      console.warn('Não foi possível abrir diretamente Alarmes e lembretes.', error);
      await Linking.openSettings();
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.outer} showsVerticalScrollIndicator={false}>
      <View style={styles.shell}>
        <View>
          <Text style={styles.eyebrow}>AJUSTES</Text>
          <Text style={styles.title}>Seu controle</Text>
          <Text style={styles.subtitle}>Personalize a aparência e altere seu tratamento sem perder o histórico.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardKicker}>APARÊNCIA</Text>
          <Text style={styles.cardTitle}>Tema do aplicativo</Text>
          <Text style={styles.body}>O tema altera fundo, cards, botões, textos e navegação de uma vez.</Text>
          <View style={styles.themeGrid}>
            {backgroundThemes.map((option) => {
              const active = themeKey === option.key;
              const preview = appThemes[option.key];
              return (
                <Pressable
                  key={option.key}
                  onPress={() => { void onThemeChange(option.key); }}
                  style={({ pressed }) => [styles.themeOption, active && styles.themeOptionActive, pressed && { opacity: 0.78 }]}
                >
                  <View style={[styles.previewCard, { backgroundColor: preview.colors.surface, borderColor: preview.colors.border }]}>
                    <View style={[styles.previewTop, { backgroundColor: preview.colors.backdrop }]} />
                    <View style={styles.previewBottom}>
                      <View style={[styles.previewButton, { backgroundColor: preview.colors.primary }]} />
                      <View style={[styles.previewDot, { backgroundColor: preview.colors.secondary }]} />
                    </View>
                    {active ? <View style={[styles.checkBadge, { backgroundColor: c.primary }]}><Text style={styles.checkText}>✓</Text></View> : null}
                  </View>
                  <Text style={[styles.themeLabel, active && styles.themeLabelActive]} numberOfLines={2}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardKicker}>LEMBRETE</Text>
          <Text style={styles.cardTitle}>Como o aviso toca</Text>
          <Text style={styles.body}>Escolha entre uma notificação normal ou um modo de alarme mais forte e repetitivo.</Text>

          <View style={styles.modeRow}>
            <Pressable
              onPress={() => { void onReminderModeChange('notification'); }}
              style={({ pressed }) => [styles.modeButton, reminderMode === 'notification' && styles.modeButtonActive, pressed && { opacity: 0.78 }]}
            >
              <Text style={styles.modeEmoji}>🔔</Text>
              <Text style={[styles.modeTitle, reminderMode === 'notification' && styles.modeTitleActive]}>Notificação</Text>
              <Text style={styles.modeCaption}>Aviso curto</Text>
            </Pressable>
            <Pressable
              onPress={() => { void onReminderModeChange('alarm'); }}
              style={({ pressed }) => [styles.modeButton, reminderMode === 'alarm' && styles.modeButtonActive, pressed && { opacity: 0.78 }]}
            >
              <Text style={styles.modeEmoji}>⏰</Text>
              <Text style={[styles.modeTitle, reminderMode === 'alarm' && styles.modeTitleActive]}>Modo alarme</Text>
              <Text style={styles.modeCaption}>Som forte + vibração</Text>
            </Pressable>
          </View>

          {reminderMode === 'alarm' ? (
            <>
              <View style={styles.alarmInfo}>
                <Text style={styles.alarmInfoIcon}>⏰</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alarmInfoTitle}>Alarme reforçado</Text>
                  <Text style={styles.alarmInfoText}>Toca um som de alarme de aproximadamente 18 segundos, vibra e volta a tocar pelo número de repetições configurado enquanto a dose não for confirmada.</Text>
                </View>
              </View>

              <Text style={styles.choiceLabel}>Repetir a cada</Text>
              <View style={styles.choiceRow}>
                {[1, 2, 5, 10].map((minutes) => (
                  <Pressable
                    key={minutes}
                    onPress={() => { void onAlarmRepeatMinutesChange(minutes); }}
                    style={[styles.choiceChip, alarmRepeatMinutes === minutes && styles.choiceChipActive]}
                  >
                    <Text style={[styles.choiceChipText, alarmRepeatMinutes === minutes && styles.choiceChipTextActive]}>{minutes} min</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.choiceLabel}>Quantidade de toques</Text>
              <View style={styles.choiceRow}>
                {[3, 5, 8].map((count) => (
                  <Pressable
                    key={count}
                    onPress={() => { void onAlarmRepeatCountChange(count); }}
                    style={[styles.choiceChip, alarmRepeatCount === count && styles.choiceChipActive]}
                  >
                    <Text style={[styles.choiceChipText, alarmRepeatCount === count && styles.choiceChipTextActive]}>{count}x</Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.alarmActions}>
                <Pressable
                  disabled={testingAlarm}
                  onPress={() => { void handleTestAlarm(); }}
                  style={[styles.testAlarmButton, testingAlarm && styles.disabled]}
                >
                  <Text style={styles.testAlarmText}>{testingAlarm ? 'Agendando...' : 'Testar alarme em 10 s'}</Text>
                </Pressable>
                {Platform.OS === 'android' ? (
                  <Pressable onPress={() => { void openAlarmSettings(); }} style={styles.systemSettingsButton}>
                    <Text style={styles.systemSettingsText}>Permitir alarmes exatos</Text>
                  </Pressable>
                ) : null}
              </View>

              <Text style={styles.alarmFootnote}>No Android 12 ou superior, permita “Alarmes e lembretes” para maior precisão. O volume e o modo Não Perturbe continuam sujeitos às configurações do aparelho.</Text>
            </>
          ) : null}
        </View>

        <LinearGradient colors={theme.heroGradient} style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}><Text style={styles.heroEmoji}>💊</Text></View>
            <View style={styles.heroText}>
              <Text style={styles.heroLabel}>TRATAMENTO ATIVO</Text>
              <Text style={styles.heroTitle}>{plan.name || 'Pílula anticoncepcional'}</Text>
            </View>
          </View>
          <View style={styles.heroGrid}>
            <MiniInfo label="Horário" value={plan.medication_time} />
            <MiniInfo label="Cartela" value={`${plan.pill_count}`} />
            <MiniInfo label="Pausa" value={`${plan.break_days} dias`} />
          </View>
          <Pressable onPress={onEditPlan} style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.82 }]}>
            <Text style={styles.primaryText}>Editar tratamento</Text>
          </Pressable>
        </LinearGradient>

        <View style={styles.card}>
          <Text style={styles.cardKicker}>DETALHES</Text>
          <Text style={styles.cardTitle}>Configuração atual</Text>
          <SettingRow icon="📅" label="Data de início" value={formatDateBR(plan.start_date)} />
          <SettingRow icon="🏁" label="Data final" value={plan.end_date ? formatDateBR(plan.end_date) : 'Sem data final'} />
          <SettingRow icon="⏰" label="Modo do aviso" value={reminderMode === 'alarm' ? 'Alarme' : 'Notificação'} />
          <SettingRow icon="🔔" label="Segundo lembrete" value={reminderMode === 'alarm' ? 'Substituído pelo alarme' : (plan.reminder_minutes > 0 ? `+${plan.reminder_minutes} min` : 'Desativado')} />
          <SettingRow icon="🔊" label="Notificações" value={plan.notifications_enabled ? 'Ativadas' : 'Desativadas'} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardKicker}>DADOS LOCAIS</Text>
          <Text style={styles.cardTitle}>Armazenamento</Text>
          <Text style={styles.body}>O histórico fica salvo no SQLite do aparelho. Fechar ou reiniciar o app não apaga os registros.</Text>
          <View style={styles.deletedRow}>
            <View><Text style={styles.deletedLabel}>Registros apagados</Text><Text style={styles.deletedValue}>{deletedCount}</Text></View>
            <Text style={styles.deletedIcon}>↺</Text>
          </View>
          <Pressable disabled={deletedCount === 0} onPress={confirmRestore} style={[styles.secondaryButton, deletedCount === 0 && styles.disabled]}>
            <Text style={styles.secondaryText}>Restaurar registros apagados</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardKicker}>COMO FUNCIONA</Text>
          <Text style={styles.cardTitle}>Uso do aplicativo</Text>
          <HowItWorksRow number="1" title="Configure a cartela" text="Informe data de início, quantidade de comprimidos, dias de pausa e horário diário." />
          <HowItWorksRow number="2" title="Receba o lembrete" text="Use notificação normal ou Modo Alarme. No alarme, o app usa som forte, vibração e repetições configuráveis até você confirmar ou adiar." />
          <HowItWorksRow number="3" title="Registre a dose" text="Marque como tomada ou não tomada. O horário real, observações e correções ficam salvos no histórico." />
          <HowItWorksRow number="4" title="Acompanhe sem perder dados" text="Calendário e histórico usam o banco local do aparelho. Editar o tratamento preserva os registros anteriores." />
        </View>

        <View style={styles.noticeCard}>
          <Text style={styles.noticeIcon}>i</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.noticeTitle}>Observações importantes</Text>
            <Text style={styles.noticeText}>O Dose Certa é um lembrete e registro de uso. Ele não calcula ovulação, período fértil nem define conduta para doses esquecidas. Em caso de atraso ou esquecimento, consulte a bula específica do medicamento e/ou orientação profissional.</Text>
          </View>
        </View>

        <View style={styles.creditCard}>
          <View style={styles.creditMark}><Text style={styles.creditEmoji}>💊</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.creditKicker}>CRÉDITOS</Text>
            <Text style={styles.creditTitle}>Idealizado e desenvolvido por</Text>
            <Text style={styles.creditName}>Joey Rickson Guimarães Oliveira</Text>
            <Text style={styles.creditMeta}>Dose Certa • Projeto pessoal</Text>
          </View>
        </View>

        <Pressable onPress={confirmDeleteAll} style={styles.deleteButton}><Text style={styles.deleteText}>Apagar todos os dados</Text></Pressable>
      </View>

      <Modal transparent visible={deleteModalVisible} animationType="fade" onRequestClose={() => !deleting && setDeleteModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalDangerIcon}><Text style={styles.modalDangerText}>!</Text></View>
            <Text style={styles.modalTitle}>Apagar todos os dados?</Text>
            <Text style={styles.modalText}>O tratamento, histórico, registros apagados e preferências serão removidos deste aparelho. Esta ação não pode ser desfeita.</Text>
            <View style={styles.modalActions}>
              <Pressable disabled={deleting} onPress={() => setDeleteModalVisible(false)} style={[styles.modalCancel, deleting && styles.disabled]}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable disabled={deleting} onPress={() => { void handleDeleteAll(); }} style={[styles.modalDelete, deleting && styles.disabled]}>
                <Text style={styles.modalDeleteText}>{deleting ? 'Apagando...' : 'Apagar tudo'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  const { colors: c } = useAppTheme();
  return (
    <View style={[helper.miniInfo, { backgroundColor: c.surface, borderColor: c.border }]}>
      <Text style={[helper.miniLabel, { color: c.muted }]}>{label}</Text>
      <Text style={[helper.miniValue, { color: c.text }]}>{value}</Text>
    </View>
  );
}

function SettingRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  const { colors: c } = useAppTheme();
  return (
    <View style={[helper.settingRow, { borderTopColor: c.border }]}>
      <View style={[helper.settingIcon, { backgroundColor: c.background, borderColor: c.border }]}><Text>{icon}</Text></View>
      <Text style={[helper.settingLabel, { color: c.muted }]}>{label}</Text>
      <Text style={[helper.settingValue, { color: c.text }]}>{value}</Text>
    </View>
  );
}

function HowItWorksRow({ number, title, text }: { number: string; title: string; text: string }) {
  const { colors: c } = useAppTheme();
  return (
    <View style={[helper.howRow, { borderTopColor: c.border }]}>
      <View style={[helper.howNumber, { backgroundColor: c.primarySoft, borderColor: c.border }]}>
        <Text style={[helper.howNumberText, { color: c.primaryDark }]}>{number}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[helper.howTitle, { color: c.text }]}>{title}</Text>
        <Text style={[helper.howText, { color: c.muted }]}>{text}</Text>
      </View>
    </View>
  );
}

const helper = StyleSheet.create({
  miniInfo: { flex: 1, borderRadius: 16, padding: 12, borderWidth: 1 },
  miniLabel: { fontSize: 9, fontWeight: '800' },
  miniValue: { fontSize: 14, fontWeight: '900', marginTop: 2 },
  settingRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1 },
  settingIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  settingLabel: { fontSize: 12, flex: 1 },
  settingValue: { fontWeight: '900', fontSize: 12, textAlign: 'right', maxWidth: '45%' },
  howRow: { flexDirection: 'row', gap: 12, paddingVertical: 13, borderTopWidth: 1, alignItems: 'flex-start' },
  howNumber: { width: 30, height: 30, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  howNumberText: { fontWeight: '900', fontSize: 12 },
  howTitle: { fontSize: 12, fontWeight: '900' },
  howText: { fontSize: 11, lineHeight: 17, marginTop: 3 },
});

function createStyles(c: AppColors) {
  return StyleSheet.create({
    outer: { flexGrow: 1, backgroundColor: c.backdrop, padding: 16, paddingBottom: 28 },
    shell: { width: '100%', maxWidth: 760, alignSelf: 'center', gap: 16 },
    eyebrow: { color: c.primary, fontWeight: '900', fontSize: 10, letterSpacing: 1.3 },
    title: { color: c.text, fontSize: 25, fontWeight: '900', marginTop: 3 },
    subtitle: { color: c.muted, fontSize: 12, marginTop: 4 },
    card: { backgroundColor: c.surface, borderRadius: 26, borderWidth: 1, borderColor: c.border, padding: 18, gap: 9 },
    cardKicker: { color: c.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
    cardTitle: { color: c.text, fontSize: 18, fontWeight: '900', marginBottom: 3 },
    body: { color: c.muted, lineHeight: 19, fontSize: 12, marginBottom: 4 },
    modeRow: { flexDirection: 'row', gap: 10, marginTop: 5 },
    modeButton: { flex: 1, minHeight: 104, borderRadius: 20, borderWidth: 1, borderColor: c.border, backgroundColor: c.background, padding: 12, justifyContent: 'center', alignItems: 'center' },
    modeButtonActive: { borderColor: c.primary, backgroundColor: c.primarySoft },
    modeEmoji: { fontSize: 23, marginBottom: 5 },
    modeTitle: { color: c.text, fontSize: 12, fontWeight: '900', textAlign: 'center' },
    modeTitleActive: { color: c.primaryDark },
    modeCaption: { color: c.muted, fontSize: 9, marginTop: 3, textAlign: 'center' },
    alarmInfo: { flexDirection: 'row', gap: 11, backgroundColor: c.surfaceSoft, borderRadius: 18, borderWidth: 1, borderColor: c.border, padding: 13, marginTop: 5 },
    alarmInfoIcon: { fontSize: 23 },
    alarmInfoTitle: { color: c.text, fontSize: 12, fontWeight: '900' },
    alarmInfoText: { color: c.muted, fontSize: 10, lineHeight: 16, marginTop: 3 },
    choiceLabel: { color: c.muted, fontSize: 10, fontWeight: '800', marginTop: 4 },
    choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    choiceChip: { minWidth: 58, minHeight: 38, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center' },
    choiceChipActive: { borderColor: c.primary, backgroundColor: c.primarySoft },
    choiceChipText: { color: c.muted, fontSize: 10, fontWeight: '900' },
    choiceChipTextActive: { color: c.primaryDark },
    alarmActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    testAlarmButton: { flexGrow: 1, minWidth: 150, minHeight: 46, borderRadius: 15, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
    testAlarmText: { color: c.white, fontSize: 11, fontWeight: '900' },
    systemSettingsButton: { flexGrow: 1, minWidth: 150, minHeight: 46, borderRadius: 15, borderWidth: 1, borderColor: c.border, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
    systemSettingsText: { color: c.primaryDark, fontSize: 11, fontWeight: '900' },
    alarmFootnote: { color: c.muted, fontSize: 9, lineHeight: 14, marginTop: 2 },
    themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 7 },
    themeOption: { width: 92, minHeight: 96, borderRadius: 18, borderWidth: 1, borderColor: c.border, backgroundColor: c.background, padding: 8, alignItems: 'center', justifyContent: 'center', gap: 7 },
    themeOptionActive: { borderColor: c.primary, backgroundColor: c.primarySoft },
    previewCard: { width: 62, height: 50, borderRadius: 13, borderWidth: 1, overflow: 'hidden', padding: 5, gap: 4, position: 'relative' },
    previewTop: { flex: 1, borderRadius: 6 },
    previewBottom: { height: 12, flexDirection: 'row', alignItems: 'center', gap: 4 },
    previewButton: { flex: 1, height: 8, borderRadius: 4 },
    previewDot: { width: 8, height: 8, borderRadius: 4 },
    checkBadge: { position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    checkText: { color: c.white, fontSize: 11, fontWeight: '900' },
    themeLabel: { color: c.muted, fontSize: 10, fontWeight: '800', textAlign: 'center' },
    themeLabelActive: { color: c.primaryDark },
    heroCard: { borderRadius: 28, borderWidth: 1, borderColor: c.border, padding: 18, gap: 15 },
    heroTop: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    heroIcon: { width: 50, height: 50, borderRadius: 18, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
    heroEmoji: { fontSize: 25 },
    heroText: { flex: 1 },
    heroLabel: { color: c.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
    heroTitle: { color: c.text, fontSize: 19, fontWeight: '900', marginTop: 2 },
    heroGrid: { flexDirection: 'row', gap: 8 },
    primaryButton: { minHeight: 50, borderRadius: 17, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' },
    primaryText: { color: c.white, fontWeight: '900' },
    deletedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.background, borderWidth: 1, borderColor: c.border, borderRadius: 18, padding: 14, marginTop: 4 },
    deletedLabel: { color: c.muted, fontSize: 10, fontWeight: '800' },
    deletedValue: { color: c.text, fontSize: 22, fontWeight: '900', marginTop: 2 },
    deletedIcon: { color: c.primary, fontSize: 25, fontWeight: '900' },
    secondaryButton: { minHeight: 46, borderRadius: 15, borderWidth: 1, borderColor: c.border, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center' },
    secondaryText: { color: c.primaryDark, fontWeight: '900', fontSize: 12 },
    disabled: { opacity: 0.4 },
    noticeCard: { flexDirection: 'row', gap: 12, backgroundColor: c.warningSoft, borderRadius: 22, padding: 16, borderWidth: 1, borderColor: c.border },
    noticeIcon: { width: 28, height: 28, borderRadius: 14, overflow: 'hidden', backgroundColor: c.surface, textAlign: 'center', lineHeight: 28, color: c.warning, fontWeight: '900' },
    noticeTitle: { color: c.warning, fontWeight: '900', fontSize: 12 },
    noticeText: { color: c.warning, fontSize: 11, lineHeight: 17, marginTop: 3 },
    creditCard: { flexDirection: 'row', gap: 13, alignItems: 'center', backgroundColor: c.surface, borderRadius: 22, padding: 16, borderWidth: 1, borderColor: c.border },
    creditMark: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primarySoft, borderWidth: 1, borderColor: c.border },
    creditEmoji: { fontSize: 24 },
    creditKicker: { color: c.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
    creditTitle: { color: c.muted, fontSize: 10, marginTop: 2 },
    creditName: { color: c.text, fontSize: 14, fontWeight: '900', marginTop: 2 },
    creditMeta: { color: c.muted, fontSize: 9, marginTop: 3 },
    deleteButton: { minHeight: 50, borderRadius: 17, borderWidth: 1, borderColor: c.danger, backgroundColor: c.dangerSoft, alignItems: 'center', justifyContent: 'center' },
    deleteText: { color: c.danger, fontWeight: '900', fontSize: 12 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.58)', alignItems: 'center', justifyContent: 'center', padding: 20 },
    modalCard: { width: '100%', maxWidth: 430, backgroundColor: c.surface, borderRadius: 26, padding: 20, borderWidth: 1, borderColor: c.border, alignItems: 'center' },
    modalDangerIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: c.dangerSoft, borderWidth: 1, borderColor: c.danger, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    modalDangerText: { color: c.danger, fontSize: 25, fontWeight: '900' },
    modalTitle: { color: c.text, fontSize: 20, fontWeight: '900', textAlign: 'center' },
    modalText: { color: c.muted, fontSize: 12, lineHeight: 19, textAlign: 'center', marginTop: 8 },
    modalActions: { width: '100%', flexDirection: 'row', gap: 10, marginTop: 18 },
    modalCancel: { flex: 1, minHeight: 48, borderRadius: 16, borderWidth: 1, borderColor: c.border, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center' },
    modalCancelText: { color: c.text, fontWeight: '900', fontSize: 12 },
    modalDelete: { flex: 1, minHeight: 48, borderRadius: 16, backgroundColor: c.danger, alignItems: 'center', justifyContent: 'center' },
    modalDeleteText: { color: c.white, fontWeight: '900', fontSize: 12 },
  });
}
