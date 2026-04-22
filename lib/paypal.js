export const PRICES = {
  web_small: parseFloat(process.env.PRICE_WEB_SMALL_EUR || '15.00'),
  full_res:  parseFloat(process.env.PRICE_FULL_RES_EUR  || '49.00'),
};

export const TIER_LABELS = {
  web_small: 'Web / Small Print (2000px)',
  full_res:  'Full Resolution',
};

export async function getPayPalToken() {
  const res = await fetch(`${process.env.PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('PayPal auth failed');
  return data.access_token;
}
