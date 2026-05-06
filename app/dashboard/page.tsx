import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import DashboardClient from '@/components/DashboardClient';

export default async function Dashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: contacts } = await supabase
    .from('contacts')
    .select('*, timeline_events(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <DashboardClient
      user={{ id: user.id, email: user.email || '' }}
      initialProfile={profile || { id: user.id, full_name: '', school: '', year: '', major: '', dream_role: '', background: '', skills: '' }}
      initialContacts={contacts || []}
    />
  );
}
