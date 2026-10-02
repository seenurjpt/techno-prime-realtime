# Techno Prime — Realtime Admin & Client apps

Two separate Next.js 15 applications sharing one MongoDB database. Admins manage users and top up balances; users see changes on their dashboard the instant they happen, without refreshing.

| App | URL | Who can sign in |
| --- | --- | --- |
| Admin | http://localhost:3001 | Admin accounts only |
| Client | http://localhost:3000 | User accounts only |

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Material UI 7 · Tailwind CSS 4 · MongoDB + Mongoose · JWT (jose) · Server-Sent Events · Zod

## Quick start

Requires Node.js 20.6+ and a MongoDB Atlas cluster (free tier works). Atlas clusters run as replica sets, which change streams, and so the realtime updates, need.

```bash
npm install
cp .env.example .env          # then set MONGODB_URI (your Atlas connection string) and JWT_SECRET

npm run seed                  # creates the admin + 3 demo users
npm run dev                   # starts both apps
```

Generate a JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

**Seeded logins**

- Admin app: `admin@technoprime.dev` / `Admin@123` (change in `.env`)
- Client app: `aarav@example.com`, `diya@example.com`, `kabir@example.com` / `User@123`

## What it does

**Admin app**
- Create, edit and delete users (name, city, email, mobile, password)
- Add amount to any user: the value is **added to** their existing balance
- Live table: changes made by another admin, in another tab, appear instantly with a highlight
- Search across name, city, email and mobile; running total of all balances

**Client app**
- Dashboard with balance, account details and recent credits
- When an admin adds an amount, the balance counts up live and shows "+₹X added just now"
- When an admin edits the user, details update live
- When an admin deletes the user, they're signed out immediately

**Access rules**
- Admins can sign in only to the admin app; users only to the client app
- Each app checks only its own collection at login (`Admin` vs `User`), signs tokens with a role-specific audience, and verifies role in middleware **and** in every API route

## Architecture

```
apps/
  admin/          Next.js app, port 3001
  client/         Next.js app, port 3000
packages/
  shared/         DB connection, Mongoose models, JWT, validation, realtime hub, SSE
  ui/             MUI theme, providers, login form, live-stream hook, toasts
```

### Realtime flow

```
Admin action ──► API route ──► MongoDB
                                  │  change stream
                                  ▼
                       UserChangeHub (1 per server)
                         │ fan-out (EventEmitter)
            ┌────────────┴─────────────┐
     /api/stream (admin)        /api/stream (client)
     all users                  filtered to own _id, server-side
            │ SSE                       │ SSE
            ▼                           ▼
     Admin table updates         Dashboard updates
```

## Design decisions worth noting

- **Atomic top-ups.** Amounts are added with MongoDB `$inc`, not read-then-write, so two admins adding money at the same moment both land. The balance update and its ledger entry (`transactions` collection) are written in a single MongoDB transaction.
- **Exact money.** `amount` is stored as `Decimal128`, so repeated top-ups like 0.10 + 0.20 never drift into 0.30000000000000004.
- **One change stream per server, not per tab.** `UserChangeHub` opens a single change stream and fans events out to every connected browser. It opens on the first subscriber and closes when the last one disconnects.
- **SSE over WebSockets.** Updates only flow server → browser, so SSE is enough: plain HTTP, automatic reconnection built into `EventSource`, no extra server. After a reconnect, the apps refetch once so nothing missed while offline is lost.
- **Idempotent client state.** A change can arrive twice (API response + stream echo). State is upserted by id and guarded by `updatedAt`, so duplicates are no-ops and older snapshots never overwrite newer ones.
- **Separate session cookies.** Browsers share cookies across ports on `localhost`, so each app uses its own cookie name (`tp_admin_session` / `tp_client_session`). Tokens also carry a role-specific JWT audience, so one app's token is rejected by the other even if copied across.
- **Password hashes never leave the server.** `passwordHash` is `select: false` and every outgoing user goes through a whitelist serializer, including change-stream payloads.
- **Login timing.** Unknown emails are still checked against a dummy bcrypt hash, so response time doesn't reveal which emails exist.
- **Performance.** Server-rendered first paint, memoised table rows (a live update re-renders one row), dialogs code-split with `next/dynamic`, deferred search filtering, MUI and icon imports tree-shaken.
- **MUI + Tailwind together.** MUI renders into a `mui` CSS cascade layer ordered before Tailwind's `utilities`, so Tailwind classes override MUI styles predictably.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Both apps in dev mode |
| `npm run build` | Production build of both apps |
| `npm start` | Run both production builds |
| `npm run seed` | Create/refresh the admin and demo users |
| `npm run typecheck` | TypeScript check for both apps |

## Troubleshooting

- **"Live updates off" badge:** the app couldn't open a change stream. Check that `MONGODB_URI` points at your Atlas cluster.
- **"Users could not be loaded":** check `MONGODB_URI` in the root `.env`.
- **Deploying:** SSE needs a long-lived Node.js server (Railway, Render, Fly.io, a VPS). Serverless platforms like Vercel cut connections after a time limit; there, swap the SSE route for a hosted pub/sub such as Pusher or Ably.

## Demo recording checklist

1. Admin and client side by side, both showing the **Live** badge
2. Add amount to the signed-in user: balance counts up on the client
3. Add again: the balance sums, and the credit appears in Recent credits
4. Edit the user's city: the client updates live
5. Try admin credentials on the client app, and user credentials on the admin app: both rejected
6. Delete the user: the client is signed out immediately
