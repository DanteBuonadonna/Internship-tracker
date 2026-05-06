'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import type { Profile } from './DashboardClient';

export default function SettingsTab({ profile, onChange }: { profile: Profile; onChange: (p: Profile) => void }) {
  const [p, setP] = useState(profile);
  const [status, setStatus] = useState('');

  function update<K extends keyof Profile>(key: K, val: Profile[K]) {
    setP(prev => ({ ...prev, [key]: val }));
  }

  async function save() {
    setStatus('Saving...');
    const supabase = createClient();
    const { error } = await supabase.from('profiles').upsert({
      ...p,
      id: p.id,
    });
    if (error) {
      setStatus('Error: ' + error.message);
    } else {
      setStatus('Saved!');
      onChange(p);
      setTimeout(() => setStatus(''), 2000);
    }
  }

  return (
    <div className="bg-white border border-ink-200 rounded-xl p-5 space-y-4">
      <div className="text-sm font-medium">Your profile</div>
      <p className="text-xs text-ink-500">Used by Claude to write personalized internship outreach emails.</p>

      <Field label="Full name">
        <input value={p.full_name || ''} onChange={e => update('full_name', e.target.value)} className={inp} placeholder="Jane Smith" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="School">
          <input value={p.school || ''} onChange={e => update('school', e.target.value)} className={inp} placeholder="Bucknell University" />
        </Field>
        <Field label="Year / graduation">
          <input value={p.year || ''} onChange={e => update('year', e.target.value)} className={inp} placeholder="Junior, Class of 2027" />
        </Field>
      </div>

      <Field label="Major / focus">
        <input value={p.major || ''} onChange={e => update('major', e.target.value)} className={inp} placeholder="Computer Science" />
      </Field>

      <Field label="Dream internship type">
        <input value={p.dream_role || ''} onChange={e => update('dream_role', e.target.value)} className={inp} placeholder="SWE intern at a fintech startup" />
      </Field>

      <Field label="Background (relevant experience, projects)">
        <textarea
          value={p.background || ''}
          onChange={e => update('background', e.target.value)}
          className={inp + ' min-h-[100px] leading-relaxed'}
          placeholder="e.g. Built a React app used by 200 students, did research with Prof. X on ML, worked as TA for intro programming..."
        />
      </Field>

      <Field label="Top skills">
        <input value={p.skills || ''} onChange={e => update('skills', e.target.value)} className={inp} placeholder="Python, React, SQL, data analysis" />
      </Field>

      <div className="flex items-center gap-3">
        <button onClick={save} className="px-4 py-2 rounded-lg bg-ink-800 text-ink-50 text-sm font-medium hover:bg-ink-700">
          Save profile
        </button>
        {status && <span className="text-xs text-ink-500">{status}</span>}
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
