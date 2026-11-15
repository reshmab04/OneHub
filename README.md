# OneHub — Everything. One Platform.

An integrated digital workspace that brings GitHub AI, DevOps / Operations, and File Manager together in one centralized platform.

## Features

### GitHub Trending
- Browse trending repositories created in the last 7 days via GitHub Search API
- Filter by programming language (20+ languages)
- Debounced search with 400ms delay
- Auto-refresh every 30 minutes with server-side caching (30min TTL)
- Star count, fork count, and creation date for each repo

### AI Models Directory & Comparison
- 10 AI models with benchmark scores across Writing, Coding, Reasoning, Text Generation, and Image Generation
- Category filter tabs (All, Writing, Coding, Thinking & Reasoning, Text Generation, Image Generation)
- Select up to 4 models for side-by-side comparison in a modal
- Score source attribution on every card — no invented benchmarks

### Local File Manager with Cloud Sync
- Browse local folders using the Browser File System Access API (Chromium-based browsers)
- Recursive folder tree with expand/collapse
- Create, view, and edit files in-browser
- Upload files to Supabase Storage for cloud synchronization
- Cloud files panel with download and delete
- Sync history log with timestamps and status indicators

### Authentication & Security
- User registration with full name, email, and strong password validation
- Admin and regular user roles with role-based access control
- bcrypt password hashing (cost factor 12) — never stored in plain text
- JWT-based sessions via httpOnly, SameSite cookies (24h expiry)
- Forgot password / reset password flow with cryptographic tokens
- Account lockout after 5 failed login attempts (15-minute cooldown)
- Rate limiting on all auth endpoints (express-rate-limit)
- Security headers via Helmet (CSP, HSTS, X-Frame-Options, etc.)
- CORS restricted to allowed origins
- HTTP parameter pollution protection
- Input validation and sanitization on all endpoints
- Security event logging (login, registration, password changes, failed attempts)
- Backend API protection — all data routes require authentication
- Frontend route guards prevent direct URL access

### UI / UX
- Dark and light theme with system preference support
- Collapsible sidebar with icon-only mode
- Responsive mobile layout with slide-out navigation drawer
- Skip-to-content link for keyboard accessibility
- ARIA labels on all interactive controls

## Tech Stack

| Layer    | Technology |
|----------|-----------|
| Frontend | React 19, TypeScript 7, Vite 8, Tailwind CSS 4, shadcn/ui (base-nova) |
| Backend  | Node.js 22, Express 4, TypeScript 5 |
| State    | TanStack React Query (server state), React hooks (local state) |
| APIs     | GitHub Search API, Supabase Storage |
| Icons    | Lucide React |

## Project Structure

```
FirstMiniProject/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── files/        # FolderTree, FileViewer, CloudFilesPanel, SyncHistory, CreateFileDialog
│   │   │   ├── github/       # RepoCard, LanguageFilter
│   │   │   ├── models/       # ModelCard, CompareModal, ScoreBar
│   │   │   └── ui/           # shadcn/ui components
│   │   ├── hooks/            # useTheme, useFileSystem, useAuth
│   │   ├── layouts/          # DashboardLayout (sidebar + header + outlet)
│   │   ├── pages/            # Login, Register, ForgotPassword, ResetPassword, GithubTrending, AIModels, FileManager
│   │   ├── services/         # Axios API client
│   │   └── types/            # TypeScript interfaces
│   └── vite.config.ts
├── backend/
│   ├── src/
│   │   ├── controllers/      # auth, github, models, files
│   │   ├── routes/           # Express route definitions
│   │   ├── services/         # GitHub API client, models data, Supabase storage
│   │   ├── data/             # models.json (10 AI models)
│   │   ├── config/           # Environment config
│   │   ├── database/          # JSON file-based user store, security logging
│   │   └── middleware/        # Auth (JWT), security headers, rate limiting, validation
│   └── .env.example
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 22+ and npm
- A Chromium-based browser (Chrome, Edge, or Brave) for the File Manager tab

### Installation

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Environment Variables

Copy the example file and fill in your values:

```bash
cp backend/.env.example backend/.env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Backend port (default: 3001) |
| `GITHUB_TOKEN` | No | GitHub personal access token — raises rate limit from 60 to 5,000 requests/hour |
| `SUPABASE_URL` | No | Supabase project URL (enables cloud sync) |
| `SUPABASE_SERVICE_KEY` | No | Supabase service role key |
| `SUPABASE_BUCKET` | No | Storage bucket name (default: `onehub-files`) |
| `ADMIN_EMAIL` | No | Admin email (seeded on first run if no admin exists) |
| `ADMIN_PASSWORD` | No | Admin password (seeded on first run; must meet strength requirements) |
| `JWT_SECRET` | No | JWT signing secret (auto-generated in dev; must be ≥32 chars in production) |

Cloud sync features are disabled gracefully when Supabase is not configured.

#### Supabase Setup (for cloud file sync)

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **Settings → API Keys** and copy the **Project URL** and **secret key**
3. Go to **Storage → New Bucket**, create a bucket named `onehub-files` (keep it private)
4. Add the URL and key to your `backend/.env` file

User data is stored in `backend/data/onehub.json` (auto-created on first run, excluded from git).

### Running

Start both servers in separate terminals:

```bash
# Terminal 1 — backend (port 3001)
cd backend
npx tsx src/server.ts

# Terminal 2 — frontend (port 5173)
cd frontend
npx vite --host
```

Open http://localhost:5173 in a Chromium-based browser. Log in with the admin credentials configured in your `.env` file (default: `admin@onehub.app` / `Admin@2024!`).

The frontend proxies `/api` requests to the backend at `http://localhost:3001` via Vite's dev server.

### Building for Production

```bash
# Backend
cd backend
npm run build          # outputs to dist/

# Frontend
cd frontend
npm run build          # outputs to dist/
npm run preview        # serve the production build locally
```

## Security Notes

### Authentication & Authorization

- Passwords are hashed with **bcrypt** (cost factor 12) — never stored or transmitted in plain text
- JWT tokens are stored in **httpOnly, SameSite cookies** — inaccessible to JavaScript
- Role-based access control: **admin** and **user** roles with middleware enforcement
- All backend API routes require authentication via JWT middleware (`requireAuth`, `requireAdmin`)
- Frontend routes are protected via `ProtectedRoute` — direct URL access redirects to login
- Admin credentials are configured via environment variables — never hardcoded
- Password reset uses cryptographically random tokens (32 bytes) with 1-hour expiry

### Account Protection

- **Account lockout**: 5 failed login attempts → 15-minute lockout period
- **Rate limiting**: 100 req/15min global, 20 req/15min auth endpoints, 5 req/hour password reset
- Identical error messages for wrong email and wrong password (prevents email enumeration)
- Forgot password returns the same response regardless of whether the email exists

### Security Headers & CORS

- **Helmet** security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **CORS** restricted to `localhost:5173` and `localhost:3001`
- **Origin check** middleware blocks cross-origin state-changing requests
- **HPP** (HTTP Parameter Pollution) protection enabled

### Input Validation

- Email format validation with regex
- Strong password requirements: 8+ characters, uppercase, lowercase, number, special character
- HTML entity sanitization on all text inputs
- Full name validation (2–100 characters, letters/spaces/hyphens only)
- JSON body size limit: 1 MB

### Data Protection

- Cloud credentials (Supabase keys) are stored in backend environment variables only — never exposed in frontend code
- JWT secret auto-generated in development; requires ≥32 characters in production
- Security event logging: login attempts, account lockouts, password changes, unauthorized access
- File path inputs are validated against path traversal patterns (`..`, absolute paths, null bytes)
- Cloud files are never deleted automatically — explicit user action required
- AI model benchmark scores cite their source — no invented or estimated scores
