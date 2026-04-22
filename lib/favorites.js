export const FAV_KEY = 'davejavu_favorites';

export function getFavorites() {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); } catch { return []; }
}

export function saveFavorites(favs) {
  localStorage.setItem(FAV_KEY, JSON.stringify(favs));
  window.dispatchEvent(new StorageEvent('storage', { key: FAV_KEY }));
}
