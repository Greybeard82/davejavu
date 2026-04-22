import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/admin-guard';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const deny = await requireAdmin(request);
  if (deny) return deny;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .order('purchase_date', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sales: data });
}
