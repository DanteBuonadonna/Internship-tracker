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

  const input: any = {
    queries: filters.industry ? `${filters.keywords} ${filters.industry}` : filters.keywords,
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

    return NextResponse.json({ jobs });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
