'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import type { Profile } from './DashboardClient';

export default function SearchTab({ profile, onAdded }: { profile: Profile; onAdded: () => void }) {
  const [keywords, setKeywords] = useState('Software Engineering Intern');
  const [location, setLocation] = useState('');
  const [posted, setPosted] = useState('r604800');
  const [workType, setWorkType] = useState('any');
  const [expLevel, setExpLevel] = useState('1');
  const [companySize, setCompanySize] = useState('any');
  const [industry, setIndustry] = useState('');
  const [exclude, setExclude] = useState('');
  const [limit, setLimit] = useState(20);
  const [term, setTerm] = useState('any');
  const [searching, setSearching] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  const [generating, setGenerating] = useState<number | null>(null);

  async function search() {
    setSearching(true);
    setStatus('Searching LinkedIn... this can take 30–90 seconds.');
    setJobs([]);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords, location, posted, workType, expLevel, companySize, industry, exclude, limit, term }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setJobs(data.jobs || []);
      setStatus(`Found ${data.jobs?.length || 0} internships.`);
    } catch (e: any) {
      setStatus('Error: ' + e.message);
    }
    setSearching(false);
  }

  async function generateAndAdd(job: any, idx: number) {
    if (!profile.full_name) {
      alert('Fill in your profile in Settings first.');
      return;
    }
    setGenerating(idx);
    try {
      const res = await fetch('/api/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job: {
            company: job.companyName || job.company,
            jobTitle: job.title || job.jobTitle,
            description: job.description || '',
          },
          profile,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Defensive dedup: block adding a second contact at the same company.
      const companyName = job.companyName || job.company || 'Unknown';
      const { data: existing } = await supabase
        .from('contacts')
        .select('id, status')
        .eq('user_id', user.id)
        .ilike('company', companyName)
        .limit(1);
      if (existing && existing.length > 0) {
        alert(`You already have a contact at ${companyName} (status: ${existing[0].status}). Skipping to avoid duplicate outreach.`);
        setGenerating(null);
        return;
      }

      const { data: contact, error } = await supabase.from('contacts').insert({
        user_id: user.id,
        company: companyName,
        job_title: job.title || job.jobTitle || '',
        job_url: job.applyUrl || job.jobUrl || '',
        job_location: job.location || '',
        job_description: (job.description || '').substring(0, 2000),
        email_subject: data.subject,
        email_body: data.body,
        status: 'draft',
      }).select().single();
      if (error) throw error;

      await supabase.from('timeline_events').insert({
        contact_id: contact.id,
        user_id: user.id,
        event: 'Email drafted',
      });

      onAdded();
      setStatus(`Added ${contact.company} to pipeline!`);
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
    setGenerating(null);
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-ink-200 rounded-xl p-5">
        <div className="text-sm font-medium mb-4">Search LinkedIn for internships</div>

        <div className="space-y-3">
          <Field label="Internship role / keywords">
            <input value={keywords} onChange={e => setKeywords(e.target.value)} className={inputCls} placeholder="e.g. Product Management Intern" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Location">
              <input value={location} onChange={e => setLocation(e.target.value)} className={inputCls} placeholder="New York, Remote" />
            </Field>
            <Field label="Posted within">
              <select value={posted} onChange={e => setPosted(e.target.value)} className={inputCls}>
                <option value="any">Any time</option>
                <option value="r86400">Past 24 hours</option>
                <option value="r604800">Past week</option>
                <option value="r2592000">Past month</option>
              </select>
            </Field>
          </div>

          <Field label="Work type">
            <ChipGroup value={workType} setValue={setWorkType} options={[
              { v: 'any', l: 'Any' },
              { v: '1', l: 'On-site' },
              { v: '2', l: 'Remote' },
              { v: '3', l: 'Hybrid' },
            ]} />
          </Field>

          <Field label="Experience level">
            <ChipGroup value={expLevel} setValue={setExpLevel} options={[
              { v: '1', l: 'Internship' },
              { v: '2', l: 'Entry level' },
              { v: 'any', l: 'Both' },
            ]} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Company size">
              <select value={companySize} onChange={e => setCompanySize(e.target.value)} className={inputCls}>
                <option value="any">Any size</option>
                <option value="A,B,C">Startup (1-50)</option>
                <option value="D,E">Mid (51-500)</option>
                <option value="F,G">Large (501-5k)</option>
                <option value="H,I">Enterprise (5k+)</option>
              </select>
            </Field>
            <Field label="Max results">
              <select value={limit} onChange={e => setLimit(parseInt(e.target.value))} className={inputCls}>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
              </select>
            </Field>
          </div>

          <Field label="Term (year + season)">
            <select value={term} onChange={e => setTerm(e.target.value)} className={inputCls}>
              <option value="any">Any term</option>
              <option value="summer 2026">Summer 2026</option>
              <option value="fall 2026">Fall 2026</option>
              <option value="spring 2027">Spring 2027</option>
              <option value="summer 2027">Summer 2027</option>
              <option value="fall 2027">Fall 2027</option>
              <option value="spring 2028">Spring 2028</option>
              <option value="summer 2028">Summer 2028</option>
            </select>
          </Field>

          <Field label="Industry filter (optional)">
            <input value={industry} onChange={e => setIndustry(e.target.value)} className={inputCls} placeholder="e.g. fintech, AI, healthcare" />
          </Field>

          <Field label="Exclude keywords (optional, comma-separated)">
            <input value={exclude} onChange={e => setExclude(e.target.value)} className={inputCls} placeholder="e.g. unpaid, sales, senior" />
          </Field>

          <button
            onClick={search}
            disabled={searching}
            className="px-4 py-2 rounded-lg bg-ink-800 text-ink-50 text-sm font-medium hover:bg-ink-700 disabled:opacity-50"
          >
            {searching ? 'Searching...' : 'Search internships'}
          </button>
          {status && <div className="text-xs text-ink-500 mt-2">{status}</div>}
        </div>
      </div>

      {jobs.length > 0 && (
        <div className="space-y-2">
          {jobs.map((j, i) => {
            const dup = j.alreadyInPipeline;
            return (
              <div key={i} className={`bg-white border rounded-xl p-4 ${dup ? 'border-ink-200 opacity-60' : 'border-ink-200'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-sm">{j.title || j.jobTitle}</div>
                    <div className="text-xs text-ink-500 mt-0.5 mb-3">{j.companyName || j.company} · {j.location}</div>
                  </div>
                  {dup && (
                    <span className="shrink-0 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-ink-100 text-ink-600 border border-ink-200">
                      Already in pipeline{j.existingStatus ? ` · ${j.existingStatus}` : ''}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => generateAndAdd(j, i)}
                    disabled={generating === i || dup}
                    title={dup ? 'A contact at this company already exists in your pipeline.' : ''}
                    className="px-3 py-1.5 rounded-lg bg-ink-800 text-ink-50 text-xs font-medium hover:bg-ink-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generating === i ? 'Generating...' : dup ? 'Already in pipeline' : 'Generate email + add'}
                  </button>
                  {(j.applyUrl || j.jobUrl) && (
                    <a href={j.applyUrl || j.jobUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg border border-ink-200 text-xs hover:bg-ink-50">
                      View
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 text-sm rounded-lg border border-ink-200 bg-white focus:outline-none focus:border-ink-400';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-ink-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

function ChipGroup({ value, setValue, options }: { value: string; setValue: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map(o => (
        <button
          key={o.v}
          onClick={() => setValue(o.v)}
          className={`text-xs px-3 py-1 rounded-full border ${
            value === o.v ? 'bg-ink-800 text-ink-50 border-ink-800' : 'border-ink-200 text-ink-500 hover:bg-ink-50'
          }`}
        >{o.l}</button>
      ))}
    </div>
  );
}
