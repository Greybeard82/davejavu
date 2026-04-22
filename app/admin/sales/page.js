'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

const TIER_LABELS = { web_small: 'Small', full_res: 'Full Res' };

function fmt(date) {
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminSalesPage() {
  const router = useRouter();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/sales');
    if (res.status === 401) { router.push('/admin'); return; }
    const data = await res.json();
    setSales(data.sales || []);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => sales.filter((s) => {
    if (search) {
      const q = search.toLowerCase();
      if (!s.buyer_name?.toLowerCase().includes(q) &&
          !s.buyer_email?.toLowerCase().includes(q) &&
          !s.photo_title?.toLowerCase().includes(q)) return false;
    }
    if (tierFilter !== 'all' && s.license_tier !== tierFilter) return false;
    if (dateFrom && new Date(s.purchase_date) < new Date(dateFrom)) return false;
    if (dateTo && new Date(s.purchase_date) > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  }), [sales, search, tierFilter, dateFrom, dateTo]);

  const total = filtered.reduce((sum, s) => sum + (s.price_paid || 0), 0);

  const inputCls = 'border border-[#d1d1d1] px-3 py-2 text-xs text-charcoal focus:outline-none focus:border-charcoal bg-white';

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <main className="max-w-6xl mx-auto px-8 py-10">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-700 text-charcoal tracking-tight">Sales</h1>
            <p className="text-sm text-mid-gray mt-1">
              {filtered.length} sale{filtered.length !== 1 ? 's' : ''} · Total: <strong className="text-charcoal">€{total.toFixed(2)}</strong>
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            placeholder="Search name, email or photo…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} w-64`}
          />
          <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} className={inputCls}>
            <option value="all">All sizes</option>
            <option value="web_small">Small (€19)</option>
            <option value="full_res">Full Res (€49)</option>
          </select>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputCls} title="From date" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputCls} title="To date" />
          {(search || tierFilter !== 'all' || dateFrom || dateTo) && (
            <button onClick={() => { setSearch(''); setTierFilter('all'); setDateFrom(''); setDateTo(''); }}
              className="text-xs uppercase tracking-widest text-mid-gray hover:text-charcoal transition-colors px-2">
              Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="border border-[#e8e8e8] rounded bg-white overflow-hidden">
          {loading ? (
            <p className="text-sm text-mid-gray text-center py-16">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-mid-gray text-center py-16">No sales found.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e8e8e8] bg-[#fafaf8]">
                  {['Date', 'Buyer', 'Photo', 'Size', 'Price', 'PayPal'].map((h) => (
                    <th key={h} className="text-left text-[10px] uppercase tracking-widest text-mid-gray px-5 py-3 font-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-[#f0f0f0] hover:bg-[#fafaf8] transition-colors">
                    <td className="px-5 py-4 text-xs text-mid-gray whitespace-nowrap">{fmt(s.purchase_date)}</td>
                    <td className="px-5 py-4">
                      <p className="text-xs font-600 text-charcoal">{s.buyer_name || '—'}</p>
                      <p className="text-[11px] text-mid-gray">{s.buyer_email}</p>
                    </td>
                    <td className="px-5 py-4 text-xs text-charcoal max-w-[200px] truncate">{s.photo_title || '—'}</td>
                    <td className="px-5 py-4">
                      <span className="text-[10px] uppercase tracking-widest px-2 py-1 bg-[#f4f3ef] text-charcoal">
                        {TIER_LABELS[s.license_tier] || s.license_tier}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-700 text-charcoal">€{s.price_paid}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Confirmed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#e8e8e8] bg-[#fafaf8]">
                  <td colSpan={4} className="px-5 py-4 text-xs uppercase tracking-widest text-mid-gray">
                    {filtered.length} sale{filtered.length !== 1 ? 's' : ''}
                  </td>
                  <td className="px-5 py-4 text-sm font-700 text-charcoal">€{total.toFixed(2)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
