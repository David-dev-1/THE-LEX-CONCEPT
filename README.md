# THE LEX CONCEPT — Portfolio

A one-page portfolio site for Alexandra Fajemirokun (brand identity, logo,
flyer, and print design), with a real, database-backed admin dashboard and
a private client-proofing tool.

Built with Next.js 14 (App Router), Prisma, and vanilla CSS (no Tailwind —
the design system lives in `src/app/globals.css`).

**Genuinely tested before delivery:** this version's database schema was
applied to a real, live Postgres server and its core logic (account
creation, password verification, content storage) was run end-to-end
against it before being sent to you — not just checked for compiling code.
The one thing that couldn't be tested in that environment is the Prisma
CLI itself (its installer is blocked in the sandbox this was built in) —
that part only gets proven on your machine, where it isn't blocked. If
`npx prisma migrate dev` gives you any trouble, that's the one piece to
send me the exact output of.

---

## What this project includes

- A one-page public portfolio — Hero, Work gallery (with filters), About,
  Contact — all fully editable from the admin, not hardcoded
- An admin dashboard: manage portfolio works, edit site content, read
  contact messages, view real visitor activity/stats, account settings
- **Client Proofing**: a private, PIN-protected link a designer can send a
  client to review watermarked work-in-progress and leave pinned feedback
  before final files are delivered — built to protect against a client
  taking finished work and refusing to pay
- Dark/light theme (visitor's choice, saved locally, never affects the
  admin's own view)
- Real security: bcrypt password hashing, signed session cookies, CSRF
  protection, rate limiting, input validation — see Section 4

---

## 1. Local setup

### Step 0 — Get a free Postgres database (~2 minutes)
This project uses **one single Postgres database**, for both local
development and production — not SQLite, and not a separate
pooled/unpooled pair of connection strings. Both of those seemed like
reasonable ideas and both caused real, hours-long problems in earlier
versions of this project. One connection string, one database engine,
used identically everywhere, removes that entire category of mistake.

1. Go to [neon.tech](https://neon.tech), sign up (no credit card), create
   a project.
2. On the project dashboard, click **Connect**. If you see a "Connection
   pooling" toggle, **turn it off** — copy the connection string shown
   without it.
3. Open the `.env.example` file in this project, **save a copy of it as
   `.env`** (same folder, just remove `.example` from the name), and paste
   your connection string in as `DATABASE_URL`.

### Step 1 — Install and initialize
```bash
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Then open **http://localhost:3000** for the public site, and
**http://localhost:3000/admin** for the admin login, using the
`ADMIN_EMAIL` / `ADMIN_PASSWORD` you set in `.env`.

> Before deploying live, generate a real `JWT_SECRET` with
> `openssl rand -base64 32` and use a real, unique admin password — the
> `.env` defaults are for local development only.

### Replacing the placeholder content
- Sample "works" are seeded with placeholder images. Log into
  `/admin/dashboard/works` and replace them with real projects.
- The About section photo can be uploaded from
  `/admin/dashboard/content` → About Section.
- Social links, headline text, and stats are all editable from the same
  Site Content page.

---

## 2. How the admin dashboard is reached

The public site's footer has a quiet **"Studio Login"** link to `/admin`.
It's intentionally low-emphasis (not in the main nav) since it's a
staff-only entry point — but it's a real, working link. Adjust its
visibility in `src/components/Footer.js` if you'd like.

---

## 3. Deploying to production (GitHub + Vercel)

### Step A — Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
```
Create an empty repository at [github.com/new](https://github.com/new) —
**use a name with hyphens, not spaces** (e.g. `thelexconcept-portfolio`,
not `THE LEX CONCEPT`) — leave every checkbox on that page unchecked, then:
```bash
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git branch -M main
git push -u origin main
```
Copy the exact URL GitHub gives you after creating the repo — don't
retype it by hand.

### Step B — Import into Vercel (deploy once, expect it to fail)
1. [vercel.com/new](https://vercel.com/new) → import your GitHub repo →
   click **Deploy**.
2. It will very likely fail here, because there's no database connected
   yet — that's expected. This step only exists to create the project so
   the next steps become available.

### Step C — Add a production database
1. Open your new project → **Storage** tab → **Marketplace** → **Neon** →
   **Install** → **Create New Neon Account** (simplest option, bills
   through Vercel).
2. This automatically adds several environment variables to your
   project — `DATABASE_URL` among them.
3. Go to **Settings → Environment Variables** and check the `DATABASE_URL`
   Vercel just added. This project's `schema.prisma` expects exactly that
   name, so nothing further should be needed here.

### Step D — Add image storage
Same **Storage** tab → **Marketplace** → **Blob** → **Install**. Vercel
adds `BLOB_READ_WRITE_TOKEN` automatically — `src/app/api/upload/route.js`
already checks for this and switches from local disk to Blob storage the
moment it's present, no code changes needed.

### Step E — Add your remaining variables
**Settings → Environment Variables → Add New**, one at a time:

| Name | Value |
|---|---|
| `JWT_SECRET` | a long random string — `openssl rand -base64 32` |
| `ADMIN_EMAIL` | your real admin email |
| `ADMIN_PASSWORD` | a strong, unique password |
| `ADMIN_NAME` | the name shown in the admin dashboard |

### Step F — Redeploy
**Deployments** tab → **⋯** on the latest one → **Redeploy**. The build
command (`prisma generate && prisma migrate deploy && next build`) creates
your database tables automatically — no separate manual migration step.

### Step G — Create your real admin account
This is the one step that always needs running by hand, since it only
happens when explicitly called — a normal deploy doesn't run it for you.
```bash
npm install -g vercel
vercel login
vercel link
vercel env pull .env.production.local --environment=production
npm run db:seed:prod
```
This should print `✓ Admin account created:` followed by your real email.
(`db:seed:prod` reads directly from `.env.production.local` — nothing
needs to be typed or pasted into the terminal by hand, which is what
caused real problems in earlier attempts at this step.)

### Step H — Go live
Visit `your-project.vercel.app/admin`, log in, and you're done. Every
future `git push` to `main` automatically redeploys the site.

---

## 4. Security, honestly

**Authentication & sessions**
- Passwords hashed with bcrypt — never stored in plain text
- Sessions are signed JWTs in httpOnly, sameSite=strict, secure (in
  production) cookies
- `/admin/dashboard/*` is blocked at the server level (middleware) without
  a valid session
- Generic "incorrect email or password" on login — never reveals which
  part was wrong
- Rate limiting on login, password/email changes, and the contact form

**Attack surface**
- **SQL injection:** not possible through normal use — every query goes
  through Prisma, which parameterizes automatically
- **XSS:** React escapes all rendered content by default; there is no
  `dangerouslySetInnerHTML` anywhere in this app
- **Stored XSS via admin content:** social-link fields are validated
  server-side to only accept `http://`/`https://` URLs
- **CSRF:** two independent layers — `sameSite=strict` cookies, plus an
  Origin-header check on every state-changing API route
- **File uploads:** validated by type and size, then fully re-encoded
  through `sharp` (strips anything hidden in image metadata, since the
  output is a freshly generated file, not a copy of the original bytes)
- Every admin-editable text field has a server-side length cap

**Client Proofing specifics**
- PINs are hashed with bcrypt, exactly like the admin password
- PIN attempts are rate-limited per link (8 attempts / 15 minutes)
- A client's session cookie for one proof cannot be reused against a
  different proof, even by the same client
- The watermark and disabled right-click are real deterrents, but — being
  honest — nothing running in a browser can make a screenshot technically
  impossible. This raises friction and removes any "I didn't know this
  wasn't final" excuse; it isn't a lock.

**What to know before going live**
- The in-memory rate limiter resets on server restart and doesn't share
  state across multiple serverless instances — fine for stopping casual
  abuse, not bulletproof at scale. For stricter protection under real
  traffic, swap `src/lib/rateLimit.js` for `@upstash/ratelimit`.
- Always set a real `JWT_SECRET` before deploying.
- Run `npm audit` periodically and keep dependencies updated.
- If any real secret (a database password, an API token) ever ends up
  pasted somewhere it shouldn't — a chat, a public repo, a screenshot —
  treat it as compromised and rotate it immediately, even if you're fairly
  sure no one else saw it.

---

## 5. Adding, renaming, or removing portfolio categories

Categories live in one place: **`src/lib/categories.js`**.
```js
export const CATEGORIES = [
  { value: 'brand', label: 'Brand Designs' },
  { value: 'logo', label: 'Logo Designs' },
  { value: 'flyer', label: 'Fliers & Posters' },
  { value: 'print', label: 'Print' },
  { value: 'mockup', label: 'Mockup Design' },
  { value: 'news', label: 'News Design' },
  { value: 'web3', label: 'Web3' },
  { value: 'ui', label: 'UI Design' },
];
```
Add a line, save — it shows up in the admin upload form, passes API
validation, and appears as a public filter button automatically. No
database migration needed (category is stored as plain text).

---

## 6. Client Proofing — how it works

1. Admin → **Client Proofs** → **+ New Client Proof** → title, optional
   client name/email, a PIN (or auto-generate one).
2. You get a private link and the PIN, shown once. **Send these two
   separately** (e.g. link by email, PIN by text) so the link alone can't
   get anyone in.
3. Upload images — each one is automatically watermarked and resized; this
   is a review copy, never the file you'd actually deliver.
4. The client enters the PIN, and can click anywhere on an image to drop a
   pinned comment — exact spot, a message, their name.
5. You see every comment in the admin, mark each resolved as you address
   it. The client can mark the whole proof **Approved** or
   **Request Changes**.

---

## 7. Project structure

```
src/
  app/
    page.js                    → homepage (fetches real works + content from the DB)
    globals.css                 → the entire design system
    admin/                      → login + protected dashboard
    proof/[token]/               → the private client-facing proofing page
    api/                        → every backend route
  components/                  → homepage sections + admin-only components
  lib/
    db.js                       → Prisma client singleton
    jwt.js / password.js         → session tokens / password hashing (kept separate -
                                    password.js uses Node APIs that can't run in
                                    Edge middleware, jwt.js can)
    session.js                  → reads the admin session
    proofAuth.js                 → PIN-based session handling for client proofs
    rateLimit.js                 → abuse protection
    stats.js                    → real dashboard statistics
    categories.js                → the one place to edit portfolio categories
    validation.js / csrf.js       → shared input/URL validation and CSRF checks
    watermark.js                 → proof image watermarking
    apiClient.js                 → safe JSON parsing for every fetch() call in the UI
  middleware.js                 → protects /admin/dashboard/*
prisma/
  schema.prisma                 → all database models
  seed.js                       → creates the local admin account + sample content
  seed-production.js             → same, but reads .env.production.local directly
```

---

## 8. Useful commands

```bash
npm run dev          # local development
npm run build         # production build (also runs migrations)
npm run db:studio     # visual database browser
npm run db:seed       # (re-)seed local database
npm run db:seed:prod  # seed production (after `vercel env pull`)
```
