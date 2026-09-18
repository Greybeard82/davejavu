import { createServerClient } from '@supabase/ssr';

// Parse ADMIN_USER_IDS: comma-separated Supabase user UUIDs.
// Whitespace trimmed, compared case-insensitively, empties dropped.
function getAdminIds() {
  return (process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map((id) => id.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * The single source of truth for admin authorisation. Used by both the
 * middleware (page protection) and requireAdmin (API protection) so the two
 * cannot drift apart.
 *
 * Authentication uses supabase.auth.getUser(), which calls the Auth server and
 * verifies the JWT signature — a fabricated or hand-edited cookie fails here.
 * (The old session-only check merely parsed the cookie locally and checked
 * expiry, so any correctly-shaped cookie passed — that was SEC-01.)
 *
 * Authorisation requires the verified user's id to be present in
 * ADMIN_USER_IDS. Fails closed: if the allowlist is unset or empty, every
 * request is denied and a clear error is logged server-side.
 *
 * @param {Request} request - carries the cookies to authenticate.
 * @param {(cookies: {name,value,options}[]) => void} [setAll] - optional sink
 *   for refreshed auth cookies (middleware writes these onto its response).
 * @returns {Promise<{ok: boolean, reason: null|'no-config'|'no-user'|'not-allowlisted', user: object|null}>}
 */
export async function verifyAdmin(request, setAll) {
  const adminIds = getAdminIds();
  if (adminIds.length === 0) {
    console.error(
      '[admin-auth] ADMIN_USER_IDS is unset or empty — denying all admin access. ' +
        'Set ADMIN_USER_IDS to a comma-separated list of admin user UUIDs.'
    );
    return { ok: false, reason: 'no-config', user: null };
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: setAll || (() => {}),
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return { ok: false, reason: 'no-user', user: null };
  }
  if (!adminIds.includes(String(user.id).toLowerCase())) {
    return { ok: false, reason: 'not-allowlisted', user };
  }
  return { ok: true, reason: null, user };
}
