'use client';
import { useState } from 'react';
import type { Contact, Profile } from './DashboardClient';
import { createClient } from '@/lib/supabase-client';
import ContactDetail from './ContactDetail';
import { Plus, Download } from 'lucide-react';

const FILTERS = ['all', 'draft', 'sent', 'replied', 'interview', 'offer', 'rejected'] as const;

export default function ContactsTab({
  contacts, profile, userEmail, onChange,
}: {
  contacts: Contact[]; profile: Profile; userEmail: string; onChange: () => void;
}) {
  const [filter, setFilter] = useState<typeof FILTERS[number]>('all');
  const [selected, setSelected] = useState<Contact | null>(null);

  const filtered = filter === 'all' ? contacts : contacts.filter(c => c.status === filter);

  async function addManual() {
    const company = prompt('Company name:');
    if (!company) return;
    const role = prompt('Role / internship title:') || '';
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: contact } = await supabase.from('contacts').insert({
      user_id: user.id,
      company, job_title: role,
      status: 'draft',
    }).select().single();
    if (contact) {
      await supabase.from('timeline_events').insert({
        contact_id: contact.id, user_id: user.id, event: 'Manually added',
      });
      onChange();
    }
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(contacts, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `internship-tracker-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="bg-white border border-ink-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium">All contacts</div>
          <div className="flex gap-2">
            <button onClick={addManual} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-ink-200 hover:bg-ink-50">
              <Plus className="w-3 h-3" /> Add
            </button>
            <button onClick={exportData} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-ink-200 hover:bg-ink-50">
              <Download className="w-3 h-3" /> Export
            </button>
          </div>
        </div>

        <div className="flex gap-1.5 flex-wrap mb-4">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1 rounded-full border capitalize ${
                filter === f
                  ? 'bg-ink-800 text-ink-50 border-ink-800'
                  : 'border-ink-200 text-ink-500 hover:bg-ink-50'
              }`}
            >
              {f} {f !== 'all' && <span className="opacity-60">({contacts.filter(c => c.status === f).length})</span>}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-10 text-sm text-ink-400">No contacts here.</div>
        ) : (
          <div className="space-y-2">
            {filtered.map(c => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-ink-200 hover:bg-ink-50 transition text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-ink-800 truncate">{c.company} — {c.job_title}</div>
                  <div className="text-xs text-ink-500 mt-0.5 truncate">
                    {c.contact_name ? `${c.contact_name} · ` : ''}
                    {c.contact_email || 'no email yet'}
                    {c.sent_at ? ` · sent ${new Date(c.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                  </div>
                </div>
                <Badge status={c.status} />
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <ContactDetail
          contact={selected}
          profile={profile}
          userEmail={userEmail}
          onClose={() => setSelected(null)}
          onChange={() => { onChange(); setSelected(null); }}
        />
      )}
    </div>
  );
}

function Badge({ status }: { status: Contact['status'] }) {
  const colors: Record<Contact['status'], string> = {
    draft: 'bg-ink-100 text-ink-500',
    sent: 'bg-blue-50 text-blue-700',
    replied: 'bg-emerald-50 text-emerald-700',
    interview: 'bg-amber-50 text-amber-700',
    offer: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-red-50 text-red-700',
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[status]}`}>{status}</span>;
}
