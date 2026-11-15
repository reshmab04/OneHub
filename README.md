# OneHub — Everything. One Platform.

An integrated digital workspace that brings GitHub Trending, AI Models, and File Management together in one dashboard.

## What It Does

- **GitHub Trending** — Browse trending repos with search, language filters, and auto-refresh
- **AI Models Directory** — Compare 10 AI models across Writing, Coding, Reasoning, and more
- **File Manager** — Browse local files and sync them to the cloud via Supabase Storage
- **Auth & Security** — User registration, role-based access, account lockout, rate limiting, and security headers

## Tech Stack

React 19 | TypeScript | Vite 8 | Tailwind CSS 4 | shadcn/ui | Node.js 22 | Express 4 | Supabase Storage

## Quick Start

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your values

# Run (two terminals)
cd backend && npx tsx src/server.ts
cd frontend && npx vite --host
```

Open **http://localhost:5173** in Chrome/Edge/Brave.
