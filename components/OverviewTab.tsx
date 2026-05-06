'use client';
import type { Contact } from './DashboardClient';

export default function OverviewTab({ contacts }: { contacts: Contact[] }) {
  const total = contacts.length;
  const sent = contacts.filter(c => c.status !== 'draft').length;
  const replies = contacts.filter(c => ['replied','interview','offer','rejected'].includes(c.status)).length;
  const interviews = contacts.filter(c => ['interview','offer'].includes(c.status)).length;
  const offers = contacts.filter(c => c.status === 'offer').length;
  const replyRate = sent ? Math.round(replies/sent*100) : 0;

  const stats = [
    { label: 'Reached out', value: sent, sub: 'total emails' },
    { label: 'Replies', value: replies, sub: `${replyRate}% rate` },
    { label: 'Interviews', value: interviews, sub: 'scheduled' },
    { label: 'Offers', value: offers, sub: 'received' },
  ];

  const stages = [
    { label: 'Drafted', n: total },
    { label: 'Sent', n: sent },
    { label: 'Replied', n: replies },
    { label: 'Interview', n: interviews },
    { label: 'Offer', n: offers },
  ];
  const max = Math.max(stages[0].n, 1);

  // Activity feed
  const events = contacts.flatMap(c =>
    (c.timeline_events || []).map(t => ({ ...t, company: c.company, name: c.contact_name }))
  ).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-white border border-ink-200 rounded-xl p-4">
            <div className="text-xs uppercase tracking-wide text-ink-400 mb-1">{s.label}</div>
            <div className="text-3xl font-medium text-ink-800">{s.value}</div>
            <div className="text-xs text-ink-400 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-ink-200 rounded-xl p-5">
        <div className="text-sm font-medium mb-4">Funnel</div>
        <div className="space-y-2">
          {stages.map(s => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="text-xs text-ink-500 w-20">{s.label}</div>
              <div className="flex-1 h-5 bg-ink-100 rounded-md overflow-hidden">
                <div
                  className="h-full bg-ink-800 rounded-md transition-all"
                  style={{ width: `${(s.n/max)*100}%` }}
                />
              </div>
              <div className="text-xs font-medium w-6 text-right">{s.n}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-ink-200 rounded-xl p-5">
        <div className="text-sm font-medium mb-4">Recent activity</div>
        {events.length === 0 ? (
          <div className="text-center py-6 text-sm text-ink-400">
            No activity yet — head to Find to get started.
          </div>
        ) : (
          <div className="space-y-2">
            {events.map(e => (
              <div key={e.id} className="flex items-start gap-3 text-sm py-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2" />
                <div className="flex-1">
                  <div className="text-ink-700">{e.event} — <span className="text-ink-500">{e.name || ''} at {e.company}</span></div>
                  <div className="text-xs text-ink-400 mt-0.5">{new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
