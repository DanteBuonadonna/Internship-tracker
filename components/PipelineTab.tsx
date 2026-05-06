'use client';
import type { Contact } from './DashboardClient';
import ContactDetail from './ContactDetail';
import { useState } from 'react';

export default function PipelineTab({ contacts, onChange }: { contacts: Contact[]; onChange: () => void }) {
  const [selected, setSelected] = useState<Contact | null>(null);

  const cols = {
    draft: contacts.filter(c => c.status === 'draft'),
    sent: contacts.filter(c => c.status === 'sent'),
    replied: contacts.filter(c => ['replied','offer','rejected'].includes(c.status)),
    interview: contacts.filter(c => c.status === 'interview'),
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(Object.entries(cols) as [keyof typeof cols, Contact[]][]).map(([key, items]) => (
          <div key={key} className="bg-white border border-ink-200 rounded-xl p-3 min-h-[200px]">
            <div className="flex justify-between items-center mb-3 px-1">
              <span className="text-xs uppercase tracking-wide font-medium text-ink-500 capitalize">{key}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-ink-100 text-ink-500">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.length === 0 ? (
                <div className="text-xs text-ink-400 px-1 py-2">Empty</div>
              ) : (
                items.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className="w-full text-left bg-ink-50 hover:bg-ink-100 border border-ink-200 rounded-lg p-2.5 transition"
                  >
                    <div className="text-xs font-medium text-ink-800 truncate">{c.company}</div>
                    <div className="text-[10px] text-ink-500 truncate mt-0.5">{c.job_title}</div>
                    {c.contact_name && <div className="text-[10px] text-ink-500 mt-0.5">→ {c.contact_name}</div>}
                  </button>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <ContactDetail
          contact={selected}
          onClose={() => setSelected(null)}
          onChange={() => { onChange(); setSelected(null); }}
        />
      )}
    </>
  );
}
