import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const filters = await req.json();
  const APIFY = process.env.APIFY_API_TOKEN;
  if (!APIFY) return NextResponse.json({ error: 'Apify not configured' }, { status: 500 });

  // Build the search query, optionally appending a term (e.g. "summer 2027") so
  // LinkedIn's own ranking surfaces term-matched listings first.
  const term: string | undefined = filters.term && filters.term !== 'any' ? filters.term : undefined;
  const queryParts = [filters.keywords, filters.industry, term].filter(Boolean);

  const input: any = {
    queries: queryParts.join(' '),
    location: filters.location || 'United States',
    count: filters.limit || 20,
  };
  if (filters.posted && filters.posted !== 'any') input.publishedAt = filters.posted;
  if (filters.workType && filters.workType !== 'any') input.workType = filters.workType;
  if (filters.expLevel && filters.expLevel !== 'any') input.experienceLevel = filters.expLevel;
  if (filters.companySize && filters.companySize !== 'any') input.companySize = filters.companySize;

  try {
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/curious_coder~linkedin-jobs-scraper/runs?token=${APIFY}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }
    );
    if (!runRes.ok) throw new Error(`Apify ${runRes.status}`);
    const runData = await runRes.json();
    const runId = runData.data?.id;
    if (!runId) throw new Error('No run id');

    // Poll until done
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const s = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY}`);
      const sd = await s.json();
      if (sd.data?.status === 'SUCCEEDED') break;
      if (['FAILED','ABORTED','TIMED-OUT'].includes(sd.data?.status)) throw new Error('Apify run failed');
    }

    const dataRes = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${APIFY}&limit=${filters.limit || 20}`
    );
    let jobs = await dataRes.json();

    if (filters.exclude) {
      const ex = filters.exclude.toLowerCase().split(',').map((s: string) => s.trim()).filter(Boolean);
      jobs = jobs.filter((j: any) => {
        const text = ((j.title || '') + ' ' + (j.description || '')).toLowerCase();
        return !ex.some((e: string) => text.includes(e));
      });
    }

    // Term filter: keep only jobs whose title/description mentions both the year and the season.
    if (term) {
      const t = term.toLowerCase();
      const yearMatch = t.match(/\b(20\d{2})\b/);
      const seasonMatch = t.match(/\b(summer|fall|autumn|spring|winter)\b/);
      const year = yearMatch?.[1];
      const season = seasonMatch?.[1];
      jobs = jobs.filter((j: any) => {
        const text = ((j.title || '') + ' ' + (j.description || '')).toLowerCase();
        if (year && !text.includes(year)) return false;
        if (season) {
          // Treat "fall" and "autumn" as equivalent.
          const altSeason = season === 'fall' ? 'autumn' : season === 'autumn' ? 'fall' : null;
          if (!text.includes(season) && !(altSeason && text.includes(altSeason))) return false;
        }
        return true;
      });
    }

    // Annotate jobs with whether the user already has a contact at this company,
    // so the UI can disable "Generate + add" for duplicates.
    const { data: existing } = await supabase
      .from('contacts')
      .select('company, contact_email, status')
      .eq('user_id', user.id);
    const existingCompanies = new Map<string, { status: string; contact_email: string }>();
    (existing || []).forEach((c) => {
      const key = (c.company || '').trim().toLowerCase();
      if (key && !existingCompanies.has(key)) {
        existingCompanies.set(key, { status: c.status, contact_email: c.contact_email });
      }
    });
    const annotated = jobs.map((j: any) => {
      const companyKey = (j.companyName || j.company || '').trim().toLowerCase();
      const dup = companyKey ? existingCompanies.get(companyKey) : undefined;
      return { ...j, alreadyInPipeline: !!dup, existingStatus: dup?.status || null };
    });

    return NextResponse.json({ jobs: annotated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
