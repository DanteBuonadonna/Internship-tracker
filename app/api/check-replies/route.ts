import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  const userEmail = session.user.email || '';

  const providerToken = session.provider_token;
  if (!providerToken) return NextResponse.json({ error: 'No Gmail token' }, { status: 400 });

  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, gmail_thread_id, status')
    .eq('user_id', userId)
    .eq('status', 'sent')
    .not('gmail_thread_id', 'is', null);

  if (!contacts?.length) return NextResponse.json({ checked: 0, found: 0 });

  let found = 0;
  for (const c of contacts) {
    try {
      const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${c.gmail_thread_id}`, {
        headers: { 'Authorization': `Bearer ${providerToken}` },
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (data.messages && data.messages.length > 1) {
        const last = data.messages[data.messages.length - 1];
        const fromHeader = (last.payload?.headers || []).find((h: any) => h.name === 'From')?.value || '';
        if (!fromHeader.includes(userEmail)) {
          const replyTime = new Date(parseInt(last.internalDate)).toISOString();
          await supabase.from('contacts').update({
            status: 'replied',
            last_reply_at: replyTime,
            reply_text: last.snippet || '',
            updated_at: new Date().toISOString(),
          }).eq('id', c.id);
          await supabase.from('timeline_events').insert({
            contact_id: c.id, user_id: userId, event: 'Reply received',
          });
          found++;
        }
      }
    } catch {}
  }

  return NextResponse.json({ checked: contacts.length, found });
}
