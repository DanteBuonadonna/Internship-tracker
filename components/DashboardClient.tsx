'use client';

import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase-client';
import { LayoutDashboard, Search, Kanban, Users, Settings, LogOut, CheckCircle2, RefreshCw, Plus, Download } from 'lucide-react';
import SearchTab from './SearchTab';
import PipelineTab from './PipelineTab';
import ContactsTab from './ContactsTab';
import SettingsTab from './SettingsTab';
import OverviewTab from './OverviewTab';

export type Profile = {
  id: string; full_name: string; school: string; year: string;
  major: string; dream_role: string; background: string; skills: string;
};
export type Contact = {
  id: string;
  user_id: string;
  contact_name: string;
  contact_email: string;
  contact_role: string;
  company: string;
  job_title: string;
  job_url: string;
  job_location: string;
  job_description: string;
  email_subject: string;
  email_body: string;
  status: 'draft' | 'sent' | 'replied' | 'interview' | 'offer' | 'rejected';
  sent_at: string | null;
  last_reply_at: string | null;
  reply_text: string;
  gmail_thread_id: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
  timeline_events: { id: string; event: string; created_at: string }[];
};

const TABS = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'search', label: 'Find', icon: Search },
  { id: 'pipeline', label: 'Pipeline', icon: Kanban },
  { id: 'contacts', label: 'Contacts', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

export default function DashboardClient({
  user, initialProfile, initialContacts,
}: {
  user: { id: string; email: string };
  initialProfile: Profile;
  initialContacts: Contact[];
}) {
  const [tab, setTab] = useState<typeof TABS[number]['id']>('overview');
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [checking, setChecking] = useState(false);

  async function refresh() {
    const supabase = createClient();
    const { data } = await supabase
      .from('contacts')
      .select('*, timeline_events(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setContacts(data as Contact[]);
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  async function checkReplies() {
    setChecking(true);
    try {
      const res = await fetch('/api/check-replies', { method: 'POST' });
      const data = await res.json();
      alert(`Checked ${data.checked || 0} threads. Found ${data.found || 0} new replies.`);
      await refresh();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
    setChecking(false);
  }

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Top nav */}
      <nav className="border-b border-ink-200 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-medium text-ink-800">Internship Tracker</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-ink-500">
            <button onClick={checkReplies} disabled={checking} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-ink-100 transition disabled:opacity-50">
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Checking...' : 'Check replies'}
            </button>
            <span>{user.email}</span>
            <button onClick={signOut} className="p-1.5 rounded-lg hover:bg-ink-100" title="Sign out">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Tab buttons */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-full transition whitespace-nowrap ${
                  tab === t.id
                    ? 'bg-ink-800 text-ink-50'
                    : 'text-ink-500 hover:bg-ink-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === 'overview' && <OverviewTab contacts={contacts} />}
        {tab === 'search' && <SearchTab profile={profile} onAdded={refresh} />}
        {tab === 'pipeline' && <PipelineTab contacts={contacts} onChange={refresh} />}
        {tab === 'contacts' && <ContactsTab contacts={contacts} profile={profile} userEmail={user.email} onChange={refresh} />}
        {tab === 'settings' && <SettingsTab profile={profile} onChange={setProfile} />}
      </div>
    </div>
  );
}
