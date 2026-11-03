# Safe Space Companion

A digital safety companion for older adults and their families. Seniors can check a suspicious message, ask a question by voice, and send a daily check-in. Family members see check-ins and summaries without seeing the messages themselves.

## Features

- Senior and family accounts linked by a safety code
- Scam checks for pasted text and message screenshots
- Voice questions with spoken answers
- Daily check-ins and a family activity dashboard
- Public scam reports map and usage insights
- Local demo with example accounts and canned answers

## Run locally

You need Node.js 22 or newer.

```sh
npm install
cp .env.example .env
npm run dev
```

Vite prints the local URL when the server starts. The home page and built-in demo work without external credentials.

## Configure services

Add credentials to `.env`. This file is git-ignored and must not be committed.

### Supabase

Set `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, and `SUPABASE_JWKS_URL` using your Supabase project settings. Also set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to the same project URL and publishable key for the browser client. Keep the secret key server-side; never use a `VITE_` prefix for it.

For account creation and saved activity, apply the database schema in `drizzle/migrations`. Set `DATABASE_URL` to your project's Postgres connection string, then run:

```sh
npx drizzle-kit migrate
```

### AI provider

Set `AI_API_KEY` to enable real scam checks and voice answers. Gemini keys are detected automatically and use Gemini 3.8 Flash by default. For another OpenAI-compatible provider, set `AI_API_URL` to its chat completions endpoint and `AI_MODEL` to a model it supports. Without an AI key, requests return the app's safe fallback responses. The built-in demo uses local example answers and does not send messages to an AI provider.

## Commands

```sh
npm run dev       # start the development server
npm run build     # build for production
npm run preview   # preview the production build
npm run lint      # check source formatting and rules
```
