import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

export default async function Home() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/dashboard');

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full bg-ink-100 border border-ink-200 text-xs text-ink-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> AI-powered internship hunting
        </div>
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-ink-800 mb-4">
          Land internships <br /> on autopilot.
        </h1>
        <p className="text-ink-500 text-lg mb-8 leading-relaxed">
          Scrape LinkedIn for internships, generate personalized outreach with AI,
          send through your Gmail, and track every reply in one dashboard.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-ink-800 text-ink-50 text-sm font-medium hover:bg-ink-700 transition"
        >
          Get started — free
        </Link>
      </div>

      <div className="mt-20 grid md:grid-cols-3 gap-4 max-w-4xl text-sm">
        <Feature title="Smart search" body="Filter by role, work type, company size, posted date, and exclude keywords like 'unpaid'." />
        <Feature title="AI emails" body="Claude writes personalized outreach for every role using your background." />
        <Feature title="Reply tracking" body="Pipeline view: drafted → sent → replied → interview → offer." />
      </div>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="p-5 rounded-xl bg-white border border-ink-200">
      <div className="font-medium text-ink-800 mb-1">{title}</div>
      <div className="text-ink-500 leading-relaxed">{body}</div>
    </div>
  );
}
