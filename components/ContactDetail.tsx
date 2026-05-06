'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import type { Contact, Profile } from './DashboardClient';
import { X, Send, Copy, Trash2 } from 'lucide-react';

export default function ContactDetail({
  contact, profile, userEmail, onClose, onChange,
}: {
  contact: Contact;
  profile?: Profile;
  userEmail?: string;
  onClose: () => void;
  onChange: () => void;
}) {
  const [c, setC] = useState(contact);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');

  async function update(field: keyof Contact, val: string) {
    setC(prev => ({ ...prev, [field]: val }));
    const supabase = createClient();
    await supabase.from('contacts').update({ [field]: val, updated_at: new Date().toISOString() }).eq('id', c.id);
  }

  async function changeStatus(newStatus: Contact['status']) {
    setC(prev => ({ ...prev, status: newStatus }));
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('contacts').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', c.id);
    if (user) {
      await supabase.from('timeline_events').insert({
        contact_id: c.id, user_id: user.id, event: `Moved to ${newStatus}`,
      });
    }
    setStatus(`Moved to ${newStatus}`);
    onChange();
  }

  async function deleteContact() {
    if (!confirm('Delete this contact?')) return;
    const supabase = createClient();
    await supabase.from('contacts').delete().eq('id', c.id);
    onChange();
  }

  async function send() {
    if (!c.contact_email) { setStatus('Add recipient email first.'); return; }
    if (!profile?.full_name) { setStatus('Fill profile in Settings first.'); return; }
    setSending(true);
    setStatus('Sending...');
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: c.id,
          to: c.contact_email,
          subject: c.email_subject,
          body: c.email_body,
          fromName: profile.full_name,
          fromEmail: userEmail,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStatus('Sent!');
      onChange();
    } catch (e: any) {
      setStatus('Error: ' + e.message);
    }
    setSending(false);
  }

  function copyBody() {
    navigator.clipboard.writeText(c.email_body);
    setStatus('Copied!');
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-20 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-ink-200 p-5 flex items-start justify-between">
          <div>
            <div className="text-lg font-medium">{c.company}</div>
            <div className="text-sm text-ink-500">{c.job_title}</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-ink-100"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Hiring manager / contact name">
              <input value={c.contact_name} onChange={e => update('contact_name', e.target.value)} className={inp} />
            </Field>
            <Field label="Their email">
              <input value={c.contact_email} onChange={e => update('contact_email', e.target.value)} className={inp} placeholder="hiring@company.com" />
            </Field>
          </div>
          <Field label="Their role / title">
            <input value={c.contact_role} onChange={e => update('contact_role', e.target.value)} className={inp} placeholder="e.g. Engineering Manager" />
          </Field>

          <Field label="Email subject">
            <input value={c.email_subject} onChange={e => update('email_subject', e.target.value)} className={inp} />
          </Field>
          <Field label="Email body">
            <textarea
              value={c.email_body}
              onChange={e => update('email_body', e.target.value)}
              className={inp + ' min-h-[200px] leading-relaxed'}
            />
          </Field>

          <div className="flex flex-wrap gap-2">
            {c.status === 'draft' && profile && (
              <button onClick={send} disabled={sending} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink-800 text-ink-50 text-xs font-medium hover:bg-ink-700 disabled:opacity-50">
                <Send className="w-3 h-3" /> {sending ? 'Sending...' : 'Send via Gmail'}
              </button>
            )}
            <button onClick={copyBody} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-ink-200 text-xs hover:bg-ink-50">
              <Copy className="w-3 h-3" /> Copy
            </button>
            <button onClick={() => changeStatus('replied')} className="px-3 py-1.5 rounded-lg border border-ink-200 text-xs hover:bg-ink-50">Mark replied</button>
            <button onClick={() => changeStatus('interview')} className="px-3 py-1.5 rounded-lg border border-ink-200 text-xs hover:bg-ink-50">→ Interview</button>
            <button onClick={() => changeStatus('offer')} className="px-3 py-1.5 rounded-lg border border-ink-200 text-xs hover:bg-ink-50">→ Offer</button>
            <button onClick={() => changeStatus('rejected')} className="px-3 py-1.5 rounded-lg border border-ink-200 text-xs hover:bg-ink-50">→ Rejected</button>
            <button onClick={deleteContact} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-700 text-xs hover:bg-red-50 ml-auto">
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </div>
          {status && <div className="text-xs text-ink-500">{status}</div>}

          <div className="pt-4 border-t border-ink-200">
            <div className="text-xs uppercase tracking-wide font-medium text-ink-500 mb-2">Notes</div>
            <textarea value={c.notes} onChange={e => update('notes', e.target.value)} className={inp + ' min-h-[80px]'} placeholder="Anything to remember..." />
          </div>

          {c.reply_text && (
            <div className="pt-4 border-t border-ink-200">
              <div className="text-xs uppercase tracking-wide font-medium text-ink-500 mb-2">Their reply</div>
              <div className="p-3 bg-ink-50 rounded-lg text-sm whitespace-pre-wrap">{c.reply_text}</div>
            </div>
          )}

          <div className="pt-4 border-t border-ink-200">
            <div className="text-xs uppercase tracking-wide font-medium text-ink-500 mb-2">Timeline</div>
            <div className="space-y-1.5">
              {(c.timeline_events || []).map(t => (
                <div key={t.id} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" />
                  <div className="flex-1">
                    <div>{t.event}</div>
                    <div className="text-xs text-ink-400">{new Date(t.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const inp = 'w-full px-3 py-2 text-sm rounded-lg border border-ink-200 bg-white focus:outline-none focus:border-ink-400';
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-ink-500 mb-1">{label}</label>
      {children}
    </div>
  );
}
