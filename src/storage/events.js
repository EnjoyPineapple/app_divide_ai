import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@divide_ai_events';

export async function loadEvents() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveEvents(events) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export async function createEvent(name) {
  const events = await loadEvents();
  const event = {
    id: Date.now().toString(),
    name,
    createdAt: new Date().toISOString(),
    participants: [],
    payments: [],
  };
  await saveEvents([event, ...events]);
  return event;
}

export async function updateEvent(updatedEvent) {
  const events = await loadEvents();
  const updated = events.map(e => e.id === updatedEvent.id ? updatedEvent : e);
  await saveEvents(updated);
}

export async function deleteEvent(eventId) {
  const events = await loadEvents();
  await saveEvents(events.filter(e => e.id !== eventId));
}
