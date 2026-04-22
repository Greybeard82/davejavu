export const BASKET_KEY = 'davejavu_basket';

export function getBasket() {
  try { return JSON.parse(localStorage.getItem(BASKET_KEY) || '[]'); }
  catch { return []; }
}

export function saveBasket(items) {
  try {
    localStorage.setItem(BASKET_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('basket-updated'));
  } catch {}
}

export function addToBasket(item) {
  const basket = getBasket();
  if (basket.some((i) => i.photoId === item.photoId)) return false;
  saveBasket([...basket, { ...item, tier: 'full_res' }]);
  return true;
}

export function removeFromBasket(photoId) {
  saveBasket(getBasket().filter((i) => i.photoId !== photoId));
}

export function updateTier(photoId, tier) {
  saveBasket(getBasket().map((i) => i.photoId === photoId ? { ...i, tier } : i));
}

export function clearBasket() {
  try {
    localStorage.removeItem(BASKET_KEY);
    window.dispatchEvent(new Event('basket-updated'));
  } catch {}
}

export function isInBasket(photoId) {
  return getBasket().some((i) => i.photoId === photoId);
}
