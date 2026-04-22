'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';


function ReplyModal({ msg, onClose, onSent }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch(`/api/messages/${msg.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replyText: text,
          toEmail: msg.email,
          toName: msg.name,
          originalSubject: msg.subject,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      onSent();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-600 text-charcoal text-sm">{msg.name}</p>
            <p className="text-xs text-mid-gray">{msg.email}</p>
          </div>
          <button onClick={onClose} className="text-mid-gray hover:text-charcoal text-xl leading-none px-1">×</button>
        </div>

        <div className="bg-[#f4f3ef] rounded p-4 mb-4 text-sm text-charcoal leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
          {msg.message}
        </div>

        <textarea
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your reply…"
          className="w-full border border-[#d1d1d1] px-4 py-3 text-sm text-charcoal placeholder:text-mid-gray focus:outline-none focus:border-charcoal resize-none"
          autoFocus
        />
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="text-xs uppercase tracking-widest text-mid-gray hover:text-charcoal px-4 py-2">
            Cancel
          </button>
          <button
            onClick={send}
            disabled={sending || !text.trim()}
            className="px-6 py-2 bg-charcoal text-white text-xs uppercase tracking-widest hover:bg-orange transition-colors disabled:opacity-40"
          >
            {sending ? 'Sending…' : 'Send reply'}
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageRow({ msg, onDelete, onReply, onToggleRead }) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm(`Delete message from ${msg.name}?`)) return;
    setDeleting(true);
    await onDelete(msg.id);
  };

  return (
    <div className={`border-b border-[#e8e8e8] ${msg.read ? 'bg-white' : 'bg-[#fffbf7]'}`}>
      <div
        className="flex items-start gap-4 px-6 py-4 cursor-pointer hover:bg-[#f9f9f7] transition-colors"
        onClick={() => { setExpanded((v) => !v); if (!msg.read) onToggleRead(msg.id, true); }}
      >
        {/* Unread dot */}
        <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${msg.read ? 'bg-transparent' : 'bg-orange'}`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-sm ${msg.read ? 'font-400 text-charcoal' : 'font-700 text-charcoal'}`}>{msg.name}</span>
            {msg.replied && (
              <span className="text-[10px] uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Replied</span>
            )}
            {msg.subject && (
              <span className="text-xs text-mid-gray truncate">{msg.subject}</span>
            )}
          </div>
          <p className="text-xs text-mid-gray mt-0.5 truncate">{msg.email}</p>
          {!expanded && (
            <p className="text-xs text-mid-gray mt-1 truncate">{msg.message}</p>
          )}
        </div>

        <span className="text-[11px] text-mid-gray shrink-0 mt-0.5">
          {new Date(msg.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>

      {expanded && (
        <div className="px-6 pb-5 ml-6">
          {msg.photos_interest && (
            <p className="text-xs text-mid-gray mb-3">
              <span className="uppercase tracking-widest">Photos: </span>{msg.photos_interest}
            </p>
          )}
          <p className="text-sm text-charcoal leading-relaxed whitespace-pre-wrap mb-5">{msg.message}</p>

          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={() => onReply(msg)}
              className="px-5 py-2 bg-charcoal text-white text-xs uppercase tracking-widest hover:bg-orange transition-colors"
            >
              Reply
            </button>
            <button
              onClick={() => onToggleRead(msg.id, !msg.read)}
              className="text-xs uppercase tracking-widest text-mid-gray hover:text-charcoal transition-colors"
            >
              Mark as {msg.read ? 'unread' : 'read'}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors disabled:opacity-40 ml-auto"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminMessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyTarget, setReplyTarget] = useState(null);
  const [filter, setFilter] = useState('all'); // all | unread | replied

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/messages');
      if (res.status === 401) { router.push('/admin'); return; }
      const data = await res.json();
      setMessages(data.messages || []);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    await fetch(`/api/messages/${id}`, { method: 'DELETE' });
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const handleToggleRead = async (id, read) => {
    await fetch(`/api/messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read }),
    });
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, read } : m));
  };

  const filtered = messages.filter((m) => {
    if (filter === 'unread') return !m.read;
    if (filter === 'replied') return m.replied;
    return true;
  });

  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <div className="min-h-screen bg-[#fafaf8]">


      <main className="max-w-4xl mx-auto px-8 py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-2xl font-700 text-charcoal tracking-tight">Messages</h1>
            <p className="text-sm text-mid-gray mt-1">{messages.length} total · {unreadCount} unread</p>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 border border-[#d1d1d1] p-1 bg-white">
            {[['all', 'All'], ['unread', 'Unread'], ['replied', 'Replied']].map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)}
                className={`text-[10px] uppercase tracking-widest px-4 py-1.5 transition-colors ${filter === val ? 'bg-charcoal text-white' : 'text-mid-gray hover:text-charcoal'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="border border-[#e8e8e8] rounded bg-white overflow-hidden">
          {loading ? (
            <p className="text-sm text-mid-gray text-center py-16">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-mid-gray text-center py-16">
              {filter === 'all' ? 'No messages yet.' : `No ${filter} messages.`}
            </p>
          ) : (
            filtered.map((msg) => (
              <MessageRow
                key={msg.id}
                msg={msg}
                onDelete={handleDelete}
                onReply={setReplyTarget}
                onToggleRead={handleToggleRead}
              />
            ))
          )}
        </div>
      </main>

      {replyTarget && (
        <ReplyModal
          msg={replyTarget}
          onClose={() => setReplyTarget(null)}
          onSent={() => {
            setMessages((prev) => prev.map((m) => m.id === replyTarget.id ? { ...m, replied: true, read: true } : m));
          }}
        />
      )}
    </div>
  );
}
