import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { DoseRecord, MedicationPlan } from '../types';
import { dateAtTime } from '../utils/date';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const CHANNEL_ID = 'pill-reminders';

export async function prepareNotifications(requestPermission: boolean) {
  if (Platform.OS === 'web') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Lembretes da pílula',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 250, 180, 250],
    });
  }

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

export async function schedulePlanNotifications(
  plan: MedicationPlan,
  doses: DoseRecord[],
  requestPermission = false
) {
  if (Platform.OS === 'web') return false;
  await cancelPillNotifications();
  if (!plan.notifications_enabled) return false;

  const allowed = await prepareNotifications(requestPermission);
  if (!allowed) return false;

  const now = Date.now();
  for (const dose of doses) {
    if (dose.kind !== 'pill' || dose.deleted_at || dose.status === 'taken') continue;

    const mainDate = dateAtTime(dose.scheduled_date, dose.scheduled_time);
    if (mainDate.getTime() > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💊 Hora da pílula',
          body: `Dose de hoje programada para ${dose.scheduled_time}.`,
          sound: 'default',
          data: { doseId: dose.id, scheduledDate: dose.scheduled_date },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: mainDate,
          channelId: CHANNEL_ID,
        },
      });
    }

    if (plan.reminder_minutes > 0) {
      const reminderDate = dateAtTime(
        dose.scheduled_date,
        dose.scheduled_time,
        plan.reminder_minutes
      );
      if (reminderDate.getTime() > now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '💊 Lembrete',
            body: 'Se você ainda não registrou a dose, abra o app para confirmar.',
            sound: 'default',
            data: { doseId: dose.id, scheduledDate: dose.scheduled_date },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: reminderDate,
            channelId: CHANNEL_ID,
          },
        });
      }
    }
  }

  return true;
}
