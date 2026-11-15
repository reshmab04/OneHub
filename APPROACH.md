# OneHub — APPROACH Document

## 9.1 Project Understanding

OneHub is an integrated digital workspace with three core modules:

1. **GitHub Trending** — Discover trending repositories with search, filters, and auto-refresh.
2. **AI Models Directory** — Browse, search, and compare AI models across categories.
3. **File Manager** — Access local files via the browser File System Access API and synchronize them to cloud storage (Supabase).

**Target users:** Developers who want a unified dashboard for tracking technologies, evaluating AI models, and managing files.

**Problems solved:** Eliminates the need to visit multiple sites (GitHub trending, model leaderboards, cloud consoles) by consolidating information into one interface.

## 9.2 Technical Architecture

- **Frontend:** React 19 + TypeScript 7 + Vite 8 + Tailwind CSS v4 + shadcn/ui (base-nova style)
- **Backend:** Node.js 22 + Express 4 + TypeScript 5 with REST APIs
- **APIs:** GitHub Search API (with server-side caching), curated AI model JSON data
- **File access:** Browser File System Access API (Chromium only, requires user permission)
- **Cloud sync:** Supabase Storage (S3-compatible) via backend upload endpoints
- **State management:** React Query for server state, React hooks for local UI state
- **Routing:** React Router with 7 routes (`/login`, `/register`, `/forgot-password`, `/reset-password`, `/trending`, `/models`, `/files`)
- **Authentication:** bcrypt password hashing (cost 12), JWT tokens in httpOnly SameSite cookies, role-based access (admin/user), account lockout, Express middleware (`requireAuth`, `requireAdmin`)
- **Security:** Helmet security headers (CSP, HSTS), rate limiting (global + auth + strict), CORS restricted to localhost, origin checking, HPP protection, input validation/sanitization, security event logging, API keys in backend env vars only, path traversal validation
- **Database:** JSON file-based store (`backend/data/onehub.json`) with atomic writes

**Architecture flow:**
```
Browser (React SPA on port 5173)
    │
    │  /api/*  (Vite dev proxy → localhost:3001)
    ▼
Express Backend (port 3001)
    ├── /api/auth/*           → Login, register, logout, forgot/reset password, change password
    ├── /api/github/trending  → GitHub Search API (30min cache) [requires auth]
    ├── /api/models           → Static models.json (10 AI models) [requires auth]
    └── /api/files/*          → Supabase Storage (upload, list, download, delete) [requires auth]
```

**Key limitations:**
- No official GitHub "trending" endpoint — uses Search API with `created:>date` filters
- File System Access API only works in Chromium browsers (Chrome, Edge, Brave)
- Browser-based sync requires the dashboard to remain open
- AI model scores are illustrative ratings based on public benchmarks, not verified benchmarks

## 9.3 Development Steps

### Phase 1 — Requirements Analysis
- Analyzed the master prompt PDF
- Identified API limitations (no official trending endpoint, Chromium-only File System Access API)
- Proposed the client-server architecture with backend proxying for all external calls

### Phase 2 — Project Scaffolding
- Set up backend: Express + TypeScript with routes, controllers, services for GitHub/Models/Files
- Set up frontend: Vite + React + TypeScript + Tailwind v4 + shadcn/ui
- Created dashboard layout with sidebar navigation and three page stubs
- Seeded AI models data (10 models across 5 categories with sourced scores)
- Created environment configuration and .env.example

### Phase 3 — Dashboard Layout Polish
- Branded sidebar with OneHub logo, "Platform" section label, collapsible to icon-only mode
- Top header bar with dynamic page title based on route
- Dark/light theme toggle stored in localStorage
- Mobile responsive layout with Sheet drawer for navigation
- Proper skeleton loading states for all pages

### Phase 4 — GitHub Trending Tab
- Integrated GitHub Search API with server-side caching (30-minute TTL)
- Built RepoCard component with avatar, links, star/fork counts, language dot
- Language filter dropdown with 23 languages
- Debounced search (400ms) triggering new API calls
- Auto-refresh every 30 minutes via React Query refetchInterval
- Loading skeletons, error state with retry, empty state

### Phase 5 — AI Models Directory & Comparison
- 10 model cards with provider-colored category badges and score bars
- ScoreBar component with color coding (green 90+, blue 80+, amber 70+)
- Category filter tabs (All, Writing, Coding, Thinking & Reasoning, Text Generation, Image Generation)
- Client-side search by name, provider, or description
- Compare modal: select up to 4 models for side-by-side score/capability comparison
- Score source disclaimer on every card

### Phase 6 — File Manager Core
- Browser File System Access API hook (`useFileSystem`) for folder browsing
- Recursive FolderTree component with expand/collapse
- FileViewer with syntax-aware editing and save
- CreateFileDialog for creating new files in any folder
- Browser support detection with clear messaging for unsupported browsers

### Phase 7 — Cloud Synchronization
- Supabase Storage integration: upload, list, download, delete operations
- Backend endpoints with multer for file uploads and path traversal prevention
- CloudFilesPanel showing all cloud files with download/delete actions
- SyncHistory component with timestamped log of sync operations
- SyncStatus badge showing connection state, file count, and total size
- Graceful degradation when Supabase is not configured (503 → "Not configured" badge)

### Phase 8 — Responsive & Accessibility Polish
- Skip-to-content link for keyboard navigation
- ARIA labels on all interactive controls (search inputs, buttons, filter triggers)
- Fixed nested `<button>` elements caused by base-ui's `asChild` behavior
- Mobile File Manager: conditional tree/viewer layout with back button
- Toolbar with wrapping buttons and hidden text labels on small screens

### Phase 9 — Testing & Bug Fixes
- Tested all three tabs end-to-end in the browser
- Verified search debounce, language filter, manual refresh on GitHub Trending
- Verified model comparison modal, category filtering on AI Models
- Verified file manager permission state, cloud badge on File Manager
- Tested navigation, theme toggle, sidebar collapse/expand
- Tested mobile layout at 375px: hamburger drawer, responsive card stacking
- Confirmed zero nested-button DOM issues via JavaScript DOM inspection
- No bugs found during testing

### Phase 10 — Documentation
- README.md with setup instructions, feature list, project structure, security notes
- APPROACH.md (this document) with architecture decisions and development log

### Phase 11 — Login Authentication
- Backend: auth controller (login with bcrypt.compare, logout, session check), JWT middleware (requireAuth), auth routes
- All data routes (`/api/github`, `/api/models`, `/api/files`) protected with requireAuth middleware
- Frontend: AuthProvider context with login/logout/checkAuth, ProtectedRoute component, Login page
- Login page with OneHub branding, show/hide password toggle, error messages, loading state
- DashboardLayout updated with username badge in header and Sign out button in sidebar
- Admin credentials via environment variables (ADMIN_USERNAME, ADMIN_PASSWORD_HASH, JWT_SECRET)
- httpOnly cookie-based JWT sessions (token never accessible to JavaScript)

### Phase 12 — Secure Auth System & Security Hardening
- Replaced default admin credentials with configurable email/password via environment variables
- Switched from SQLite to JSON file-based database (better-sqlite3 segfaulted on prebuilt Node.js binary)
- User registration: full name, email, password with strength validation, confirm password
- Forgot password: crypto-random 32-byte token, 1-hour expiry, prevents email enumeration
- Reset password: token validation, password update, token invalidation
- Change password: current password verification, new password validation
- Role-based access control: admin and user roles, `requireAdmin` middleware
- Account lockout: 5 failed attempts → 15-minute lockout with automatic unlock
- Rate limiting: global (100/15min), auth endpoints (20/15min), password reset (5/hour)
- Helmet security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- CORS restricted to localhost:5173 and localhost:3001
- Origin check middleware for state-changing requests
- HPP (HTTP Parameter Pollution) protection
- Input validation: email format, strong password rules, HTML entity sanitization, name validation
- Security event logging: login attempts, lockouts, password changes, unauthorized access
- JWT secret auto-generated in dev, requires ≥32 chars in production
- Admin account seeded from env vars on first startup when no admin exists

## 9.4 Exact Claude Code Prompts

1. User provided OneHub master prompt PDF — Phase 1 analysis requested
2. "Start Phase 2" — Project scaffolding
3. "Start Phase 3" — Dashboard layout polish and shared design system
4. "Start Phase 4" — GitHub Trending tab implementation
5. "Start Phase 5" — AI Models Directory & Comparison
6. "Start Phase 6" — File Manager core functionality
7. "Start Phase 7" — Cloud synchronization with Supabase
8. "Start Phase 8" — Responsive UI polish and accessibility
9. "Start Phase 9" — Testing all modules and fixing bugs
10. "Start Phase 10" — Documentation (README.md and APPROACH.md)
11. User provided login authentication requirements — Phase 11 implementation
12. User provided secure auth system & security hardening requirements — Phase 12 implementation

## 9.5 AI Mistakes and Corrections

### Phase 2 — Node.js Installation
- **Issue:** Node.js was not installed. Homebrew install failed (no sudo access). nvm install failed (no Xcode CLT).
- **Resolution:** Downloaded prebuilt Node.js v22.11.0 binary directly and installed to `~/.local/`. Added to PATH via `.zshrc`.

### Phase 3 — Dark Mode CSS Conflicts
- **Issue:** Dark mode not applying — conflicting variable systems between HSL-based `@theme` block and shadcn's oklch system.
- **Resolution:** Removed duplicate `@theme` block, kept only `:root` (light) and `.dark` (dark) with oklch values plus the `@theme inline` mapping block.

### Phase 3 — Missing Lucide Icon
- **Issue:** `Github` icon export doesn't exist in the installed lucide-react version.
- **Resolution:** Replaced with `TrendingUp` icon in sidebar navigation and page components.

### Phase 8 — Nested Button Elements
- **Issue:** shadcn/ui base-nova style uses `@base-ui/react` primitives where `asChild` doesn't work like Radix's. Using `asChild` with a `Button` child on `SheetTrigger`, `DropdownMenuTrigger`, and `TooltipTrigger` created nested `<button>` elements.
- **Resolution:** Removed `asChild` from all trigger components and styled them directly with Tailwind classes. Removed Tooltip wrappers from sidebar buttons entirely.

### Phase 8 — Mobile Navigation Layout
- **Issue:** Nav items in the mobile drawer displayed inline as button elements instead of stacking vertically, because Tooltip wrappers changed the display model.
- **Resolution:** Removed Tooltip wrappers and used `flex flex-col gap-1` on the nav container for proper vertical layout.

### Phase 12 — better-sqlite3 Segfault
- **Issue:** `better-sqlite3` native module caused segfaults (exit code 139) on the prebuilt Node.js v22.11.0 binary.
- **Resolution:** Replaced with a pure-JavaScript JSON file-based database store with atomic writes.

### Phase 12 — express-rate-limit IPv6 Error
- **Issue:** Custom `keyGenerator` in rate limiter threw `ValidationError: Custom keyGenerator appears to use request IP without calling the ipKeyGenerator helper function for IPv6 addresses`.
- **Resolution:** Removed the custom `keyGenerator` and used express-rate-limit's built-in default.

## 9.6 Testing and Validation

### GitHub Trending
- Loads 30 trending repos with star counts, fork counts, language indicators
- Search debounce: typed "rust" → results filtered to Rust-related repos after 400ms
- Language filter: selected "Python" → showed only Python repos
- Refresh button: fetches fresh data from GitHub API
- Stats bar shows last update time, auto-refresh badge, repository count

### AI Models
- 10 model cards displayed in a responsive grid
- Category filter: "Coding" tab showed 7 matching models
- Compare: selected GPT-4o, Claude 3.5 Sonnet, Gemini 2.0 Flash → modal showed side-by-side scores, categories, capabilities, use cases
- Score source attribution present on every card

### File Manager
- Browser support check: shows clear error in unsupported browsers
- Permission request state: shows "Allow Folder Access" button with explanation
- Cloud status badge: "Cloud: Not configured" when Supabase env vars not set
- Cloud panel and sync history tabs visible on desktop (lg+ breakpoint)

### Authentication & Security (Phase 12)
**Backend API Tests:**
- Admin login with correct credentials returns success with role "admin"
- User registration creates account and auto-logs in with role "user"
- Duplicate email registration returns 409 error
- Wrong password returns "Invalid email or password" (no email enumeration)
- Protected routes return 401 without authentication
- Weak password rejected with specific requirement messages
- Password mismatch rejected during registration
- Change password works with valid current password
- Forgot password returns success regardless of email existence (anti-enumeration)
- Logout clears cookie and returns success

**Browser Tests:**
- Login page renders with OneHub branding and "Sign in to your account" heading
- Registration page with Full Name, Email, Password, Confirm Password fields
- Admin login shows "Admin" role badge in header
- Regular user login shows "User" role badge in header
- Forgot password flow shows success state with "Check your email" message
- Reset password page renders with token from URL
- Security headers present (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, CSP)
- No credentials or tokens in localStorage, sessionStorage, or document.cookie
- Session persists across page refresh (httpOnly cookie maintained)
- Direct URL access after logout redirects to login

### Cross-Cutting
- Navigation between all 3 pages via sidebar links and mobile drawer
- Dark/light theme toggle with correct variable switching
- Sidebar collapse/expand with icon-only mode
- Mobile layout (375px): hamburger menu, Sheet drawer with nav items, responsive cards
- Skip-to-content link present
- ARIA labels on search inputs, buttons, filter triggers
- Zero nested `<button>` elements confirmed via DOM inspection

## 9.7 Final Outcome

OneHub is a fully functional integrated workspace with three modules. All 12 development phases completed successfully:

- **GitHub Trending** pulls live data from the GitHub Search API with caching, search, and language filtering
- **AI Models** provides a curated directory of 10 models with benchmark comparison, category filtering, and source-attributed scores
- **File Manager** enables local file browsing via the File System Access API with optional Supabase cloud synchronization
- **UI/UX** is responsive across desktop and mobile, accessible with ARIA labels and keyboard navigation, and supports dark/light themes
- **Authentication** protects all routes with role-based access control (admin/user), bcrypt-hashed passwords, JWT tokens in httpOnly SameSite cookies, user registration, forgot/reset password, and account lockout
- **Security** is OWASP-aligned with Helmet security headers, rate limiting, CORS, origin checking, input validation/sanitization, HPP protection, and security event logging

The application runs as two processes (frontend on port 5173, backend on port 3001) and requires only Node.js 22+ and a Chromium browser. Cloud sync is optional and degrades gracefully when not configured.
