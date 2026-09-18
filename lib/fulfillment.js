import { PRICES } from './paypal';

// Pure, side-effect-free fulfilment logic extracted from
// app/api/basket/complete/route.js so it can be unit-tested without touching
// Supabase, PayPal, or any network. The route calls these with identical
// inputs; behaviour is unchanged.

// Basket total, recomputed server-side from PRICES. Returns NaN if any item
// carries a tier not in PRICES (so callers can reject an unknown tier).
export function basketTotal(items, prices = PRICES) {
  return (items || []).reduce((sum, i) => sum + (prices[i.tier] ?? NaN), 0);
}

// Binds a PayPal order to a basket. Returns an array of human-readable mismatch
// reasons; an empty array means the payment is verified against this basket.
// Mirrors the checks in basket/complete exactly (order/capture status,
// custom_id, basket.paypal_order_id, unknown tier, currency, and an amount that
// must equal the server-recomputed total).
export function bindingErrors({ order, basket, orderId, basketId, prices = PRICES }) {
  const unit = order?.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];
  const expectedTotal = basketTotal(basket?.items, prices);
  const amountPaid = Number(capture?.amount?.value);
  const errors = [];
  if (order?.status !== 'COMPLETED') errors.push(`order status=${order?.status}`);
  if (capture?.status !== 'COMPLETED') errors.push(`capture status=${capture?.status}`);
  if (unit?.custom_id !== `basket:${basketId}`) errors.push(`custom_id=${unit?.custom_id}`);
  if (basket?.paypal_order_id !== orderId) errors.push(`basket.paypal_order_id=${basket?.paypal_order_id}`);
  if (!Number.isFinite(expectedTotal)) errors.push('basket has an unknown tier');
  if (capture?.amount?.currency_code !== 'EUR') errors.push(`currency=${capture?.amount?.currency_code}`);
  if (!Number.isFinite(amountPaid) || amountPaid !== Number(expectedTotal.toFixed(2)))
    errors.push(`amount=${capture?.amount?.value} expected=${Number.isFinite(expectedTotal) ? expectedTotal.toFixed(2) : '?'}`);
  return errors;
}

// Basket state machine. Given the basket's current status on entry, decides
// what the request does. Only 'pending' proceeds to claim + fulfilment; any
// already-owned status creates nothing.
export function entryBranch(status) {
  switch (status) {
    case 'completed': return 'completed';   // return existing links
    case 'processing': return 'processing'; // another call owns it -> 202
    case 'failed': return 'failed';         // fulfilment failed -> preparing
    default: return 'proceed';              // 'pending' -> verify, claim, fulfil
  }
}
