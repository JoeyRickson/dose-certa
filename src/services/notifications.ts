import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AlarmPreferences, DoseRecord, MedicationPlan } from '../types';
import { dateAtTime } from '../utils/date';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

const NORMAL_CHANNEL_ID = 'pill-reminders';
const ALARM_CHANNEL_ID = 'pill-alarm-v1';
const ALARM_CATEGORY_ID = 'PILL_ALARM';
const ALARM_SOUND = 'pill_alarm.wav';

export const ALARM_ACTION_TAKEN = 'PILL_TAKEN';
export const ALARM_ACTION_SNOOZE = 'PILL_SNOOZE';

export const DEFAULT_ALARM_PREFERENCES: AlarmPreferences = {
  mode: 'notification',
  repeatMinutes: 5,
  repeatCount: 5,
};

async function ensureChannelsAndActions() {
  if (Platform.OS === 'web') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(NORMAL_CHANNEL_ID, {
      name: 'Lembretes da pílula',
      description: 'Avisos normais do Dose Certa.',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 250, 180, 250],
      enableVibrate: true,
      showBadge: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });

    await Notifications.setNotificationChannelAsync(ALARM_CHANNEL_ID, {
      name: 'Alarme da pílula',
      description: 'Alarmes fortes e repetidos para o horário da pílula.',
      importance: Notifications.AndroidImportance.MAX,
      sound: ALARM_SOUND,
      enableVibrate: true,
      vibrationPattern: [0, 700, 250, 700, 250, 900, 350, 900],
      showBadge: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      audioAttributes: {
        usage: Notifications.AndroidAudioUsage.ALARM,
        contentType: Notifications.AndroidAudioContentType.SONIFICATION,
        flags: {
          enforceAudibility: true,
          requestHardwareAudioVideoSynchronization: false,
        },
      },
    });
  }

  await Notifications.setNotificationCategoryAsync(ALARM_CATEGORY_ID, [
    {
      identifier: ALARM_ACTION_TAKEN,
      buttonTitle: 'Tomei',
      options: {
        opensAppToForeground: true,
        isAuthenticationRequired: false,
        isDestructive: false,
      },
    },
    {
      identifier: ALARM_ACTION_SNOOZE,
      buttonTitle: 'Adiar 5 min',
      options: {
        opensAppToForeground: true,
        isAuthenticationRequired: false,
        isDestructive: false,
      },
    },
  ]);
}

export async function prepareNotifications(requestPermission: boolean) {
  if (Platform.OS === 'web') return false;

  await ensureChannelsAndActions();

  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return true;
  if (!requestPermission) return false;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}

export async function cancelPillNotifications() {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function cancelScheduledForDose(doseId: number) {
  if (Platform.OS === 'web') return;

  const [scheduled, presented] = await Promise.all([
    Notifications.getAllScheduledNotificationsAsync(),
    Notifications.getPresentedNotificationsAsync(),
  ]);

  const scheduledMatches = scheduled.filter(
    (request) => Number(request.content.data?.doseId) === doseId
  );
  const presentedMatches = presented.filter(
    (notification) => Number(notification.request.content.data?.doseId) === doseId
  );

  await Promise.all([
    ...scheduledMatches.map((request) =>
      Notifications.cancelScheduledNotificationAsync(request.identifier)
    ),
    ...presentedMatches.map((notification) =>
      Notifications.dismissNotificationAsync(notification.request.identifier)
    ),
  ]);
}

function notificationContent(dose: DoseRecord, title: string, body: string, alarm: boolean) {
  return {
    title,
    body,
    sound: alarm ? ALARM_SOUND : 'default',
    categoryIdentifier: alarm ? ALARM_CATEGORY_ID : undefined,
    priority: alarm ? Notifications.AndroidNotificationPriority.MAX : undefined,
    sticky: alarm ? true : undefined,
    autoDismiss: alarm ? false : undefined,
    data: {
      doseId: dose.id,
      scheduledDate: dose.scheduled_date,
      source: alarm ? 'pill-alarm' : 'pill-reminder',
    },
  } as Notifications.NotificationContentInput;
}

async function scheduleAlarmSequence(
  dose: DoseRecord,
  firstDate: Date,
  repeatMinutes: number,
  repeatCount: number
) {
  const safeMinutes = Math.max(1, Math.min(30, Math.trunc(repeatMinutes)));
  const safeCount = Math.max(1, Math.min(8, Math.trunc(repeatCount)));

  for (let index = 0; index < safeCount; index += 1) {
    const alarmDate = new Date(firstDate.getTime() + index * safeMinutes * 60_000);
    if (alarmDate.getTime() <= Date.now()) continue;

    await Notifications.scheduleNotificationAsync({
      content: notificationContent(
        dose,
        index === 0 ? '⏰ Hora da sua pílula' : '⏰ Você ainda não confirmou',
        index === 0
          ? `Dose programada para ${dose.scheduled_time}. Toque em “Tomei” ao concluir.`
          : 'O alarme está repetindo porque a dose ainda não foi confirmada.',
        true
      ),
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: alarmDate,
        channelId: ALARM_CHANNEL_ID,
      },
    });
  }
}

export async function schedulePlanNotifications(
  plan: MedicationPlan,
  doses: DoseRecord[],
  requestPermission = false,
  preferences: AlarmPreferences = DEFAULT_ALARM_PREFERENCES
) {
  if (Platform.OS === 'web') return false;
  await cancelPillNotifications();
  if (!plan.notifications_enabled) return false;

  const allowed = await prepareNotifications(requestPermission);
  if (!allowed) return false;

  const now = Date.now();
  const futureDoses = doses
    .filter((dose) => {
      if (dose.kind !== 'pill' || dose.deleted_at || dose.status === 'taken') return false;
      return dateAtTime(dose.scheduled_date, dose.scheduled_time).getTime() > now;
    })
    .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));

  // O modo alarme cria vários avisos por dose. Limitamos aos próximos 30 dias
  // para evitar centenas de alarmes agendados de uma só vez.
  const schedulePool = preferences.mode === 'alarm' ? futureDoses.slice(0, 30) : futureDoses;

  for (const dose of schedulePool) {
    const mainDate = dateAtTime(dose.scheduled_date, dose.scheduled_time);

    if (preferences.mode === 'alarm') {
      await scheduleAlarmSequence(
        dose,
        mainDate,
        preferences.repeatMinutes,
        preferences.repeatCount
      );
      continue;
    }

    await Notifications.scheduleNotificationAsync({
      content: notificationContent(
        dose,
        '💊 Hora da pílula',
        `Dose de hoje programada para ${dose.scheduled_time}.`,
        false
      ),
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: mainDate,
        channelId: NORMAL_CHANNEL_ID,
      },
    });

    if (plan.reminder_minutes > 0) {
      const reminderDate = dateAtTime(
        dose.scheduled_date,
        dose.scheduled_time,
        plan.reminder_minutes
      );
      if (reminderDate.getTime() > now) {
        await Notifications.scheduleNotificationAsync({
          content: notificationContent(
            dose,
            '💊 Lembrete',
            'Se você ainda não registrou a dose, abra o app para confirmar.',
            false
          ),
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: reminderDate,
            channelId: NORMAL_CHANNEL_ID,
          },
        });
      }
    }
  }

  return true;
}

export async function scheduleSnoozeNotification(
  dose: DoseRecord,
  preferences: AlarmPreferences
) {
  if (Platform.OS === 'web') return false;
  const allowed = await prepareNotifications(true);
  if (!allowed) return false;

  await cancelScheduledForDose(dose.id);
  const firstDate = new Date(Date.now() + 5 * 60_000);
  await scheduleAlarmSequence(
    dose,
    firstDate,
    preferences.repeatMinutes,
    preferences.repeatCount
  );
  return true;
}

export async function testAlarmNotification() {
  if (Platform.OS === 'web') return false;
  const allowed = await prepareNotifications(true);
  if (!allowed) return false;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⏰ Teste do alarme',
      body: 'Este é o som forte do Dose Certa.',
      sound: ALARM_SOUND,
      categoryIdentifier: ALARM_CATEGORY_ID,
      priority: Notifications.AndroidNotificationPriority.MAX,
      sticky: true,
      autoDismiss: false,
      data: { source: 'alarm-test' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 10,
      channelId: ALARM_CHANNEL_ID,
    },
  });
  return true;
}
