import AsyncStorage from '@react-native-async-storage/async-storage';

const STREAK_KEY      = 'xmobile_streak';
const LAST_ACTIVE_KEY = 'xmobile_streak_last';

export interface StreakData {
  current: number;
  best: number;
  lastActive: string; // ISO date string YYYY-MM-DD
}

const today = () => new Date().toISOString().slice(0, 10);
const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

export async function streakOku(): Promise<StreakData> {
  try {
    const raw = await AsyncStorage.getItem(STREAK_KEY);
    if (!raw) return { current: 0, best: 0, lastActive: '' };
    return JSON.parse(raw);
  } catch {
    return { current: 0, best: 0, lastActive: '' };
  }
}

export async function streakGuncelle(): Promise<StreakData> {
  const data = await streakOku();
  const bugun = today();

  if (data.lastActive === bugun) return data; // already counted today

  let newCurrent = 1;
  if (data.lastActive === yesterday()) {
    newCurrent = data.current + 1; // consecutive day
  }

  const updated: StreakData = {
    current: newCurrent,
    best: Math.max(data.best, newCurrent),
    lastActive: bugun,
  };
  await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(updated));
  return updated;
}

export async function streakSifirla(): Promise<void> {
  await AsyncStorage.removeItem(STREAK_KEY);
}
