import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Local-only scheduling — no push server, no remote token, nothing leaves
// the device. This exists because Daily's streak (docs/DAILY_CHALLENGE_SPEC.md)
// has no reminder of its own today; the player has to remember on their own.
//
// Placeholder copy below is NOT reviewed Polly dialogue — POLLY_DIALOGUE_BANK.md
// governs her voice and this hasn't gone through that process. Swap before
// treating it as final.
const REMINDER_TITLE = 'Your Daily streak is waiting';
const REMINDER_BODY = "Polly's got today's word ready. Don't let the streak slip.";

const REMINDER_ID_KEY = 'polywords_daily_reminder_id';
const REMINDER_DELAY_SECONDS = 20 * 60 * 60; // 20h after completion — comfortably inside "tomorrow" for most play times without needing to know the player's actual schedule.
const ANDROID_CHANNEL_ID = 'daily-reminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Daily reminder',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

async function getStoredReminderId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(REMINDER_ID_KEY);
  } catch {
    return null;
  }
}

async function setStoredReminderId(id: string | null): Promise<void> {
  try {
    if (id) await AsyncStorage.setItem(REMINDER_ID_KEY, id);
    else await AsyncStorage.removeItem(REMINDER_ID_KEY);
  } catch {}
}

export async function cancelDailyReminder(): Promise<void> {
  const id = await getStoredReminderId();
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {}
  await setStoredReminderId(null);
}

async function scheduleReminder(): Promise<void> {
  await cancelDailyReminder();
  await ensureAndroidChannel();
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: REMINDER_TITLE,
      body: REMINDER_BODY,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: REMINDER_DELAY_SECONDS,
      repeats: false,
    },
  });
  await setStoredReminderId(id);
}

// Settings toggle turning the reminder ON. Requests permission if needed;
// returns false (and schedules nothing) if the player declines — the caller
// is responsible for reverting the toggle's stored state on false.
export async function requestAndScheduleDailyReminder(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  let granted = existing.granted;
  if (!granted && existing.canAskAgain) {
    const requested = await Notifications.requestPermissionsAsync();
    granted = requested.granted;
  }
  if (!granted) return false;
  await scheduleReminder();
  return true;
}

// Called after every Daily completion (win or loss) while the setting is on
// — replaces the prior scheduled reminder with a fresh +20h one, so a player
// who plays every day never actually receives a reminder (the old one is
// cancelled before it can fire); only a missed day lets one through.
export async function rescheduleDailyReminderAfterCompletion(): Promise<void> {
  const existing = await Notifications.getPermissionsAsync();
  if (!existing.granted) return;
  await scheduleReminder();
}
