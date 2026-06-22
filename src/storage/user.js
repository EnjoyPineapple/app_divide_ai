import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@divide_ai_user';

export async function loadUser() {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function saveUser(data) {
  const current = (await loadUser()) || {};
  await AsyncStorage.setItem(KEY, JSON.stringify({ ...current, ...data, seenOnboarding: true }));
}

export async function markOnboardingDone() {
  const current = (await loadUser()) || {};
  await AsyncStorage.setItem(KEY, JSON.stringify({ ...current, seenOnboarding: true }));
}

export async function clearUser() {
  const current = (await loadUser()) || {};
  await AsyncStorage.setItem(KEY, JSON.stringify({ seenOnboarding: current.seenOnboarding }));
}
