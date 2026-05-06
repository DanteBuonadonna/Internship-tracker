import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const providerToken = session.provider_token;
  if (!providerToken) {
    return NextResponse.json({ error: 'No Gmail token. Sign out and back in to refresh permissions.' }, { status: 400 });
  }

  const { contactId, to, subject, body, fromName, fromEmail } = await req.json();

  const lines = [
    `From: ${fromName} <${fromEmail}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    body,
  ].join('\r\n');

  const encoded = Buffer.from(lines).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  try {
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${providerToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: encoded }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || `Gmail ${res.status}`);
    }
    const result = await res.json();

    // Update contact in DB
    const now = new Date().toISOString();
    await supabase
      .from('contacts')
      .update({ status: 'sent', sent_at: now, gmail_thread_id: result.threadId, updated_at: now })
      .eq('id', contactId);
    await supabase
      .from('timeline_events')
      .insert({ contact_id: contactId, user_id: session.user.id, event: 'Email sent' });

    return NextResponse.json({ success: true, threadId: result.threadId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
