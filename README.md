# Internship Tracker

AI-powered internship outreach. Search LinkedIn → Claude writes personalized emails → send via Gmail → track every reply in a dashboard.

Built with Next.js, Supabase, Anthropic API, and Apify.

---

## What you'll deploy

A multi-user webapp where students sign in with Google and get:
- LinkedIn internship search with rich filters
- AI-generated personalized outreach emails (Claude Sonnet 4)
- Send emails directly through their Gmail account
- Pipeline view: Drafted → Sent → Replied → Interview → Offer
- Auto-detection of replies via Gmail thread polling
- Per-contact timeline, notes, and stats

Total time to deploy: ~30-45 minutes following this guide.

---

## Prerequisites

- A computer with Node.js 18+ ([download](https://nodejs.org))
- A GitHub account
- A Google account
- Credit card for Apify (free tier is enough; takes ~$5 of free credits)

---

## Setup steps

### 1. Get the code

Clone or download this folder, then:

```bash
cd internship-tracker
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → sign in → New project
2. Name: `internship-tracker`, choose a strong DB password, pick a region
3. Wait ~1 minute for setup
4. Go to **SQL Editor** → New query → paste the contents of `supabase/schema.sql` → Run
5. Go to **Settings → API** → copy:
   - `Project URL` (will be `NEXT_PUBLIC_SUPABASE_URL`)
   - `anon public` key (will be `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### 3. Set up Google OAuth (for Gmail sending)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. **APIs & Services → Library** → search "Gmail API" → Enable
4. **APIs & Services → OAuth consent screen**:
   - Choose **External**
   - App name: `Internship Tracker`
   - User support email + developer email: your email
   - Add scopes: `gmail.send`, `gmail.readonly`
   - Add yourself as a test user (until you publish)
5. **APIs & Services → Credentials → + Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - Name: `Internship Tracker`
   - Authorized JavaScript origins: `http://localhost:3000` and your production URL (add later)
   - Authorized redirect URIs: copy from Supabase (next step)
6. Copy the **Client ID** and **Client Secret**

### 4. Connect Google to Supabase

1. In Supabase: **Authentication → Providers → Google**
2. Enable, paste your Client ID and Client Secret
3. **Copy the "Callback URL"** Supabase shows you (looks like `https://xxxx.supabase.co/auth/v1/callback`)
4. Go back to Google Cloud Console → your OAuth client → add that callback URL to **Authorized redirect URIs**
5. Save in both places

### 5. Get an Anthropic API key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Settings → API Keys → Create Key
3. Add credits ($5 minimum to start)
4. Copy the key

### 6. Get an Apify API token

1. Go to [apify.com](https://apify.com) → sign up
2. Settings → Integrations → copy your **API token**
3. New users get $5 free credits — enough for ~500-1000 jobs scraped

### 7. Configure environment variables

Create a file called `.env.local` in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
APIFY_API_TOKEN=apify_api_xxxxx
```

### 8. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in with Google, fill in your profile in Settings, then go to Find and search for internships!

---

## Deploy to production

### Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/internship-tracker.git
git push -u origin main
```

### Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → import your GitHub repo
2. **Environment variables** — add all four from your `.env.local`
3. Deploy
4. Once you get your URL (e.g. `internship-tracker.vercel.app`), go back to:
   - **Google Cloud Console** → your OAuth client → add `https://internship-tracker.vercel.app` to JavaScript origins
   - **Supabase** → Authentication → URL Configuration → add your Vercel URL to Site URL and Redirect URLs

Done — share the URL with friends!

---

## How it works

| Layer | Tech | Role |
|---|---|---|
| Frontend | Next.js 14 + Tailwind | The app you see |
| Auth | Supabase Auth + Google OAuth | Sign in, gets Gmail token |
| Database | Supabase Postgres | Stores contacts, timeline, profile |
| Job scraping | Apify (LinkedIn Jobs Scraper) | Finds internship listings |
| Email writing | Anthropic Claude Sonnet 4 | Personalized outreach |
| Email sending | Gmail API | Sends from user's actual Gmail |
| Hosting | Vercel | Free-tier serverless |

---

## Costs

- **Supabase**: Free tier (500MB DB, plenty for personal use)
- **Vercel**: Free tier (100GB bandwidth)
- **Anthropic**: ~$0.01–0.03 per email generated (Sonnet pricing)
- **Apify**: ~$0.50 per 100 jobs scraped on free credits, then ~$0.005 per scrape

For a typical 100-internship search campaign: **~$5 total**.

---

## Troubleshooting

**"No Gmail token"** when sending emails → Sign out and back in. The Google OAuth scope must include `gmail.send`. If it persists, check that you added the scopes correctly in Google Cloud Console.

**Apify run failed** → Check your token, make sure you have free credits left, and that the LinkedIn Jobs Scraper actor is available (occasionally LinkedIn updates break scrapers temporarily).

**Hiring manager emails not auto-found** → That's expected — LinkedIn doesn't expose them. You'll need to find them via tools like [Hunter.io](https://hunter.io), [Apollo.io](https://apollo.io), or company websites, then paste them into the contact detail.

---

## Roadmap ideas

- Auto-find hiring manager emails via Apollo/Hunter API
- Bulk send (with rate limiting)
- Follow-up sequences ("send if no reply in 7 days")
- A/B test different email templates
- Calendar integration for interview scheduling

PRs welcome!
