import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DatePickerModal } from './DatePickerModal';
import { NumberStepper } from './NumberStepper';
import { TimePickerModal } from './TimePickerModal';
import { useAppTheme } from '../ThemeContext';
import { AppColors, getShadow } from '../theme';
import { MedicationPlan, PlanInput } from '../types';
import { formatDateBR, todayISO } from '../utils/date';

interface Props {
  pageBackground: string;
  initial?: MedicationPlan | null;
  onSave: (input: PlanInput) => Promise<void>;
  onCancel?: () => void;
}

type DateTarget = 'start' | 'end' | null;

export function PlanForm({ pageBackground, initial, onSave, onCancel }: Props) {
  const theme = useAppTheme();
  const c = theme.colors;
  const styles = useMemo(() => createStyles(c), [c]);
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initial?.name ?? '');
  const [startDate, setStartDate] = useState(initial?.start_date ?? todayISO());
  const [endDate, setEndDate] = useState<string | null>(initial?.end_date ?? null);
  const [pillCount, setPillCount] = useState(initial?.pill_count ?? 21);
  const [breakDays, setBreakDays] = useState(initial?.break_days ?? 7);
  const [time, setTime] = useState(initial?.medication_time ?? '21:00');
  const [reminder, setReminder] = useState(initial?.reminder_minutes ?? 30);
  const [notifications, setNotifications] = useState((initial?.notifications_enabled ?? 1) === 1);
  const [saving, setSaving] = useState(false);
  const [dateTarget, setDateTarget] = useState<DateTarget>(null);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;

  const steps = useMemo(() => initial ? ['Dados', 'Cartela', 'Lembretes'] : ['Começar', 'Cartela', 'Lembretes', 'Revisar'], [initial]);
  const lastStep = steps.length - 1;

  function animateStep(next: number) {
    Animated.timing(fade, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setStep(next);
      Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
  }

  function next() { if (step < lastStep) animateStep(step + 1); }
  function back() { if (step > 0) animateStep(step - 1); else onCancel?.(); }

  async function submit() {
    if (endDate && endDate < startDate) {
      Alert.alert('Período inválido', 'A data final precisa ser posterior à data inicial.');
      return;
    }
    if (pillCount < 1 || pillCount > 365) return Alert.alert('Cartela inválida', 'Use entre 1 e 365 comprimidos.');
    if (breakDays < 0 || breakDays > 60) return Alert.alert('Pausa inválida', 'Use entre 0 e 60 dias.');
    if (reminder < 0 || reminder > 720) return Alert.alert('Lembrete inválido', 'Use entre 0 e 720 minutos.');

    setSaving(true);
    try {
      await onSave({
        name,
        startDate,
        endDate,
        pillCount,
        breakDays,
        medicationTime: time,
        reminderMinutes: reminder,
        notificationsEnabled: notifications,
      });
    } finally {
      setSaving(false);
    }
  }

  const currentDateValue = dateTarget === 'start' ? startDate : dateTarget === 'end' ? endDate : null;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={[styles.outer, { backgroundColor: pageBackground }]} keyboardShouldPersistTaps="handled">
        <View style={styles.shell}>
          <LinearGradient colors={theme.heroGradient} style={styles.hero}>
            <View style={styles.heroIcon}><Text style={styles.heroEmoji}>💊</Text></View>
            <View style={styles.heroText}>
              <Text style={styles.heroKicker}>{initial ? 'AJUSTAR CONTROLE' : 'BEM-VINDA'}</Text>
              <Text style={styles.title}>{initial ? 'Editar seu lembrete' : 'Dose Certa'}</Text>
              <Text style={styles.subtitle}>{initial ? 'Ajuste o que precisar sem perder o histórico anterior.' : 'Configure em poucos passos. Sem ciclo menstrual, sem excesso de informação.'}</Text>
            </View>
          </LinearGradient>

          <View style={styles.stepRow}>
            {steps.map((label, index) => (
              <View key={label} style={styles.stepItem}>
                <View style={[styles.stepDot, index <= step && styles.stepDotActive]}><Text style={[styles.stepNumber, index <= step && styles.stepNumberActive]}>{index + 1}</Text></View>
                <Text numberOfLines={1} style={[styles.stepLabel, index === step && styles.stepLabelActive]}>{label}</Text>
              </View>
            ))}
          </View>

          <Animated.View style={[styles.panel, getShadow(theme), { opacity: fade, transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}>
            {renderStep()}
          </Animated.View>

          <View style={styles.footerRow}>
            {(step > 0 || onCancel) ? (
              <Pressable onPress={back} style={styles.backButton}><Text style={styles.backText}>{step === 0 ? 'Cancelar' : 'Voltar'}</Text></Pressable>
            ) : <View />}
            {step < lastStep ? (
              <Pressable onPress={next} style={styles.nextButton}><Text style={styles.nextText}>Continuar  →</Text></Pressable>
            ) : (
              <Pressable disabled={saving} onPress={submit} style={[styles.nextButton, saving && styles.disabled]}>
                <Text style={styles.nextText}>{saving ? 'Salvando...' : initial ? 'Salvar alterações' : 'Criar meu controle'}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>

      <DatePickerModal
        visible={!!dateTarget}
        value={currentDateValue}
        title={dateTarget === 'end' ? 'Data final' : 'Data de início'}
        allowClear={dateTarget === 'end'}
        onClose={() => setDateTarget(null)}
        onConfirm={(value) => {
          if (dateTarget === 'start' && value) setStartDate(value);
          if (dateTarget === 'end') setEndDate(value);
          setDateTarget(null);
        }}
      />
      <TimePickerModal visible={timePickerOpen} value={time} onClose={() => setTimePickerOpen(false)} onConfirm={(value) => { setTime(value); setTimePickerOpen(false); }} />
    </KeyboardAvoidingView>
  );

  function renderStep() {
    if (step === 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionKicker}>{initial ? 'DADOS PRINCIPAIS' : 'PASSO 1'}</Text>
          <Text style={styles.sectionTitle}>{initial ? 'Dados do tratamento' : 'Vamos começar'}</Text>
          <Text style={styles.sectionText}>O nome é opcional. As datas servem apenas para organizar o período do controle.</Text>

          <Text style={styles.label}>Nome da pílula (opcional)</Text>
          <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Ex.: nome do anticoncepcional" placeholderTextColor={c.muted} />

          <View style={styles.dateGrid}>
            <PickerCard icon="📅" label="Início" value={formatDateBR(startDate)} onPress={() => setDateTarget('start')} />
            <PickerCard icon="🏁" label="Fim" value={endDate ? formatDateBR(endDate) : 'Sem data final'} onPress={() => setDateTarget('end')} />
          </View>
        </View>
      );
    }

    if (step === 1) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionKicker}>CARTELA</Text>
          <Text style={styles.sectionTitle}>Como é a cartela?</Text>
          <Text style={styles.sectionText}>Escolha um formato comum ou ajuste manualmente.</Text>

          <View style={styles.chips}>
            {[21, 24, 28].map((value) => (
              <Pressable key={value} onPress={() => setPillCount(value)} style={[styles.chip, pillCount === value && styles.chipActive]}>
                <Text style={[styles.chipNumber, pillCount === value && styles.chipNumberActive]}>{value}</Text>
                <Text style={[styles.chipCaption, pillCount === value && styles.chipCaptionActive]}>comprimidos</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.stepperGrid}>
            <NumberStepper label="Comprimidos" value={pillCount} min={1} max={365} onChange={setPillCount} />
            <NumberStepper label="Dias de pausa" value={breakDays} min={0} max={60} suffix="dias" onChange={setBreakDays} />
          </View>

          <View style={styles.tipBox}><Text style={styles.tipIcon}>✨</Text><Text style={styles.tipText}>O app alterna automaticamente os dias de comprimido e os dias de pausa conforme essa configuração.</Text></View>
        </View>
      );
    }

    if (step === 2) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionKicker}>LEMBRETES</Text>
          <Text style={styles.sectionTitle}>Que horas lembrar?</Text>
          <Text style={styles.sectionText}>O horário fica em destaque na tela inicial e é usado para as notificações do celular.</Text>

          <Pressable onPress={() => setTimePickerOpen(true)} style={styles.timeCard}>
            <View style={styles.timeIcon}><Text style={styles.timeEmoji}>⏰</Text></View>
            <View style={styles.timeText}><Text style={styles.timeLabel}>Horário diário</Text><Text style={styles.timeValue}>{time}</Text></View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <NumberStepper label="Segundo lembrete" value={reminder} min={0} max={720} suffix="min" onChange={setReminder} />

          <View style={styles.switchCard}>
            <View style={styles.switchIcon}><Text style={styles.switchEmoji}>🔔</Text></View>
            <View style={styles.switchText}>
              <Text style={styles.switchTitle}>Notificações com som</Text>
              <Text style={styles.switchSubtitle}>No Android, o sistema pedirá permissão quando necessário.</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: c.border, true: c.primarySoft }}
              thumbColor={notifications ? c.primary : c.muted}
            />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionKicker}>TUDO CERTO</Text>
        <Text style={styles.sectionTitle}>Revise seu controle</Text>
        <Text style={styles.sectionText}>Você poderá alterar essas informações depois.</Text>

        <View style={styles.summaryCard}>
          <SummaryRow icon="💊" label="Pílula" value={name.trim() || 'Sem nome'} />
          <SummaryRow icon="📅" label="Início" value={formatDateBR(startDate)} />
          <SummaryRow icon="🗓️" label="Fim" value={endDate ? formatDateBR(endDate) : 'Sem data final'} />
          <SummaryRow icon="◉" label="Cartela" value={`${pillCount} comprimidos + ${breakDays} dias de pausa`} />
          <SummaryRow icon="⏰" label="Horário" value={time} />
          <SummaryRow icon="🔔" label="Lembrete extra" value={reminder > 0 ? `+${reminder} min` : 'Desativado'} />
        </View>

        <View style={styles.infoBox}><Text style={styles.infoText}>O aplicativo é um lembrete e histórico de uso. Ele não calcula período fértil, ovulação ou orientação de dose em caso de esquecimento.</Text></View>
      </View>
    );
  }
}

function PickerCard({ icon, label, value, onPress }: { icon: string; label: string; value: string; onPress: () => void }) {
  const { colors: c } = useAppTheme();
  return (
    <Pressable onPress={onPress} style={[helper.pickerCard, { backgroundColor: c.background, borderColor: c.border }]}>
      <Text style={helper.pickerIcon}>{icon}</Text>
      <View style={helper.pickerText}><Text style={[helper.pickerLabel, { color: c.muted }]}>{label}</Text><Text style={[helper.pickerValue, { color: c.text }]}>{value}</Text></View>
      <Text style={[helper.chevron, { color: c.primary }]}>›</Text>
    </Pressable>
  );
}

function SummaryRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  const { colors: c } = useAppTheme();
  return (
    <View style={[helper.summaryRow, { borderBottomColor: c.border }]}>
      <Text style={helper.summaryIcon}>{icon}</Text>
      <View style={helper.summaryText}><Text style={[helper.summaryLabel, { color: c.muted }]}>{label}</Text><Text style={[helper.summaryValue, { color: c.text }]}>{value}</Text></View>
    </View>
  );
}

const helper = StyleSheet.create({
  pickerCard: { flex: 1, minWidth: 230, minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 20, padding: 14 },
  pickerIcon: { fontSize: 23 },
  pickerText: { flex: 1 },
  pickerLabel: { fontSize: 11, fontWeight: '800' },
  pickerValue: { fontSize: 16, fontWeight: '900', marginTop: 3 },
  chevron: { fontSize: 28, lineHeight: 30 },
  summaryRow: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1 },
  summaryIcon: { fontSize: 21 },
  summaryText: { flex: 1 },
  summaryLabel: { fontSize: 10, fontWeight: '800' },
  summaryValue: { fontSize: 14, fontWeight: '900', marginTop: 2 },
});

function createStyles(c: AppColors) {
  return StyleSheet.create({
    flex: { flex: 1 },
    outer: { flexGrow: 1, backgroundColor: c.backdrop, padding: 18, paddingBottom: 40 },
    shell: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: 18 },
    hero: { borderRadius: 28, padding: 22, flexDirection: 'row', gap: 16, alignItems: 'center', borderWidth: 1, borderColor: c.border },
    heroIcon: { width: 68, height: 68, borderRadius: 24, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
    heroEmoji: { fontSize: 34 },
    heroText: { flex: 1, minWidth: 0 },
    heroKicker: { color: c.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
    title: { color: c.text, fontSize: 27, fontWeight: '900', marginTop: 2 },
    subtitle: { color: c.muted, fontSize: 13, lineHeight: 19, marginTop: 5 },
    stepRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 5, paddingHorizontal: 4 },
    stepItem: { flex: 1, alignItems: 'center', gap: 5, minWidth: 0 },
    stepDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: c.border, alignItems: 'center', justifyContent: 'center' },
    stepDotActive: { backgroundColor: c.primary },
    stepNumber: { color: c.muted, fontSize: 11, fontWeight: '900' },
    stepNumberActive: { color: c.white },
    stepLabel: { color: c.muted, fontSize: 10, fontWeight: '700' },
    stepLabelActive: { color: c.primaryDark, fontWeight: '900' },
    panel: { backgroundColor: c.surface, borderRadius: 28, borderWidth: 1, borderColor: c.border, padding: 22 },
    section: { gap: 16 },
    sectionKicker: { color: c.primary, fontWeight: '900', fontSize: 11, letterSpacing: 1.3 },
    sectionTitle: { color: c.text, fontSize: 24, fontWeight: '900', marginTop: -8 },
    sectionText: { color: c.muted, fontSize: 13, lineHeight: 20, marginTop: -8 },
    label: { color: c.text, fontSize: 13, fontWeight: '900' },
    input: { minHeight: 54, borderWidth: 1, borderColor: c.border, borderRadius: 18, paddingHorizontal: 16, backgroundColor: c.background, color: c.text, fontSize: 16 },
    dateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chevron: { color: c.primary, fontSize: 28, lineHeight: 30 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chip: { flex: 1, minWidth: 105, minHeight: 76, borderRadius: 20, borderWidth: 1, borderColor: c.border, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center' },
    chipActive: { borderColor: c.primary, backgroundColor: c.primarySoft },
    chipNumber: { color: c.text, fontSize: 22, fontWeight: '900' },
    chipNumberActive: { color: c.primaryDark },
    chipCaption: { color: c.muted, fontSize: 10, fontWeight: '700' },
    chipCaptionActive: { color: c.primaryDark },
    stepperGrid: { gap: 12 },
    tipBox: { flexDirection: 'row', gap: 10, backgroundColor: c.surfaceLavender, borderRadius: 18, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: c.border },
    tipIcon: { fontSize: 20 },
    tipText: { flex: 1, color: c.secondary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
    timeCard: { flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: c.surfaceSoft, borderRadius: 22, padding: 16, borderWidth: 1, borderColor: c.border },
    timeIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
    timeEmoji: { fontSize: 24 },
    timeText: { flex: 1 },
    timeLabel: { color: c.muted, fontSize: 11, fontWeight: '800' },
    timeValue: { color: c.primaryDark, fontSize: 26, fontWeight: '900' },
    switchCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: c.border, borderRadius: 20, backgroundColor: c.background, padding: 15 },
    switchIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: c.surfaceSoft, alignItems: 'center', justifyContent: 'center' },
    switchEmoji: { fontSize: 20 },
    switchText: { flex: 1 },
    switchTitle: { color: c.text, fontWeight: '900', fontSize: 14 },
    switchSubtitle: { color: c.muted, fontSize: 11, lineHeight: 16, marginTop: 2 },
    summaryCard: { backgroundColor: c.background, borderRadius: 20, borderWidth: 1, borderColor: c.border, paddingHorizontal: 15 },
    infoBox: { backgroundColor: c.warningSoft, padding: 14, borderRadius: 17, borderWidth: 1, borderColor: c.border },
    infoText: { color: c.warning, fontSize: 12, lineHeight: 18, fontWeight: '600' },
    footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    backButton: { minHeight: 50, paddingHorizontal: 18, borderRadius: 16, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' },
    backText: { color: c.muted, fontWeight: '900' },
    nextButton: { minHeight: 52, paddingHorizontal: 24, borderRadius: 17, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 1 },
    nextText: { color: c.white, fontWeight: '900', fontSize: 15 },
    disabled: { opacity: 0.55 },
  });
}
