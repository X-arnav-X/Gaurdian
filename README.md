# Safe Space Companion

A digital safety companion for older adults and their families.

## Run locally

Install [Bun](https://bun.sh) and run:

```sh
bun install
bun run dev
```

Vite prints the local address when the server is ready. Copy `.env.example` to `.env` and fill in the Supabase settings to use account and family features. Set `AI_API_KEY` to enable AI checks and voice answers; `AI_API_URL` and `AI_MODEL` can point to any OpenAI-compatible chat completions service. Without these settings, the app uses its built-in safe fallback responses.

## Other commands

```sh
bun run build
bun run lint
```
