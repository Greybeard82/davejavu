import { describe, it, expect } from 'vitest';
import { basketTotal, bindingErrors, entryBranch } from '../lib/fulfillment.js';

// Prices are injected explicitly so the tests are deterministic regardless of
// PRICE_* env vars. These match lib/paypal.js defaults.
const PRICES = { web_small: 19, full_res: 49 };
const ORDER_ID = 'ORDER-1';
const BASKET_ID = 'BASKET-1';

// A fresh, fully-valid (order, basket) pair for a 2x full_res basket = €98.00.
// Each test builds one and mutates exactly one field, so a failure isolates to
// a single binding check.
function validInputs() {
  return {
    orderId: ORDER_ID,
    basketId: BASKET_ID,
    prices: PRICES,
    basket: {
      paypal_order_id: ORDER_ID,
      items: [{ tier: 'full_res' }, { tier: 'full_res' }],
    },
    order: {
      status: 'COMPLETED',
      payer: { email_address: 'x@example.com' },
      purchase_units: [
        {
          custom_id: `basket:${BASKET_ID}`,
          payments: {
            captures: [{ status: 'COMPLETED', amount: { currency_code: 'EUR', value: '98.00' } }],
          },
        },
      ],
    },
  };
}
const capture = (i) => i.order.purchase_units[0].payments.captures[0];

describe('basketTotal', () => {
  it('sums known tiers', () => {
    expect(basketTotal([{ tier: 'full_res' }, { tier: 'full_res' }], PRICES)).toBe(98);
    expect(basketTotal([{ tier: 'web_small' }], PRICES)).toBe(19);
    expect(basketTotal([{ tier: 'full_res' }, { tier: 'web_small' }], PRICES)).toBe(68);
  });
  it('is 0 for an empty basket', () => {
    expect(basketTotal([], PRICES)).toBe(0);
  });
  it('is NaN when any tier is unknown', () => {
    expect(Number.isNaN(basketTotal([{ tier: 'gold' }], PRICES))).toBe(true);
    expect(Number.isNaN(basketTotal([{ tier: 'full_res' }, { tier: 'gold' }], PRICES))).toBe(true);
  });
});

describe('bindingErrors — a legitimate order binds cleanly', () => {
  it('returns no errors for a valid, fully-matching order', () => {
    expect(bindingErrors(validInputs())).toEqual([]);
  });
});

describe('bindingErrors — each mismatch shape fails independently', () => {
  it('rejects a wrong amount (underpayment)', () => {
    const i = validInputs();
    capture(i).amount.value = '19.00'; // paid for one, basket is 98.00
    const errs = bindingErrors(i);
    expect(errs.some((e) => e.startsWith('amount='))).toBe(true);
  });

  it('rejects a wrong currency', () => {
    const i = validInputs();
    capture(i).amount.currency_code = 'USD';
    const errs = bindingErrors(i);
    expect(errs.some((e) => e.startsWith('currency='))).toBe(true);
  });

  it('rejects a custom_id pointing at another basket', () => {
    const i = validInputs();
    i.order.purchase_units[0].custom_id = 'basket:SOMEONE-ELSE';
    const errs = bindingErrors(i);
    expect(errs.some((e) => e.startsWith('custom_id='))).toBe(true);
  });

  it('rejects a basket.paypal_order_id that does not match the order', () => {
    const i = validInputs();
    i.basket.paypal_order_id = 'ORDER-OTHER';
    const errs = bindingErrors(i);
    expect(errs.some((e) => e.startsWith('basket.paypal_order_id='))).toBe(true);
  });

  it('rejects an order that is not COMPLETED', () => {
    const i = validInputs();
    i.order.status = 'CREATED';
    const errs = bindingErrors(i);
    expect(errs.some((e) => e.startsWith('order status='))).toBe(true);
  });

  it('rejects a capture that is not COMPLETED', () => {
    const i = validInputs();
    capture(i).status = 'PENDING';
    const errs = bindingErrors(i);
    expect(errs.some((e) => e.startsWith('capture status='))).toBe(true);
  });

  it('rejects a basket containing an unknown tier', () => {
    const i = validInputs();
    i.basket.items = [{ tier: 'gold' }];
    const errs = bindingErrors(i);
    expect(errs).toContain('basket has an unknown tier');
  });
});

describe('entryBranch — basket state machine', () => {
  it('a pending basket proceeds (the one status that claims + fulfils)', () => {
    expect(entryBranch('pending')).toBe('proceed');
  });

  it('once claimed (processing) a second call creates nothing', () => {
    // First caller sees 'pending' -> proceed -> the CAS flips it to 'processing'.
    // Any subsequent caller sees 'processing' and must not proceed.
    expect(entryBranch('processing')).toBe('processing');
    expect(entryBranch('processing')).not.toBe('proceed');
  });

  it('completed returns the completed branch (existing links)', () => {
    expect(entryBranch('completed')).toBe('completed');
  });

  it('failed returns the failed branch (preparing response)', () => {
    expect(entryBranch('failed')).toBe('failed');
  });

  it('an unknown/pre-claim status defaults to proceed', () => {
    expect(entryBranch(undefined)).toBe('proceed');
  });
});
