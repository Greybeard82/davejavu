import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

// Guard for admin API routes. Returns a 401 JSON response to deny (never a
// redirect, never a stack trace), or null to allow. Callers do:
//   const deny = await requireAdmin(request);
//   if (deny) return deny;
export async function requireAdmin(request) {
  const { ok } = await verifyAdmin(request);
  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
