import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { job, profile } = await req.json();
  const KEY = process.env.ANTHROPIC_API_KEY;
  if (!KEY) return NextResponse.json({ error: 'Anthropic not configured' }, { status: 500 });

  const client = new Anthropic({ apiKey: KEY });

  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `Write a short, warm, personalized cold email from a STUDENT seeking an INTERNSHIP at ${job.company} for the role "${job.jobTitle}".

Student profile:
- Name: ${profile.full_name}
- School: ${profile.school}, ${profile.year}
- Major: ${profile.major}
- Background: ${profile.background}
- Skills: ${profile.skills}

Job description: ${(job.description || '').substring(0, 500)}

Rules:
- Max 130 words
- Sound like a student, not a corporate exec
- Reference 1 specific thing about the company or role
- Genuine and curious, not desperate
- End with a low-pressure CTA (e.g., "would love to learn more if you have 15 min")
- Just the email body, no subject
- Sign off as ${profile.full_name}`
      }]
    });

    const body = msg.content[0].type === 'text' ? msg.content[0].text : '';
    const subject = `${profile.full_name} — interest in your ${job.jobTitle} role`;
    return NextResponse.json({ subject, body });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
