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

## How it works

Both apps read and write the same MongoDB database. The admin app changes users, MongoDB reports every change, and both apps push it to any open browser window straight away. Neither app needs a page refresh.

### 1. Signing in

1. An admin opens the admin app (port 3001) and signs in. The admin app checks the email and password against the `admins` collection **only**.
2. A user opens the client app (port 3000) and signs in. The client app checks against the `users` collection **only**.
3. On success, the app sets a session token (JWT, valid for 8 hours) in an HTTP-only cookie. Each app uses its own cookie name, and each token is stamped with its role (`admin` or `user`).
4. Middleware checks the session on every page and API request, and every API route checks it again. A token from the other app is rejected, so:
   - admin credentials on the client app → "Email or password is incorrect."
   - user credentials on the admin app → "Email or password is incorrect."
5. A visitor without a valid session is sent to the login page, and back to the page they asked for after signing in.

### 2. Admin creates a user

1. The admin clicks **Add user** and fills in name, city, email, mobile and a password. The user signs in to the client app with that email and password.
2. Each field is checked as soon as the admin leaves it, and again on the server with the same rules (`packages/shared/src/validation.ts`):
   - **Name / City:** 2+ characters; letters (any language), spaces and `. ' -` only.
   - **Email:** trimmed and lowercased. It must have exactly one `@` and no spaces. The part before the `@` uses only letters, numbers and `. _ % + -`, with no leading, trailing or double dots. The domain needs valid labels and a real ending (`.com`, `.in` …). Common typos like `gmail.con` or `gmial.com` get a "Did you mean …?" message. The same email can't be used twice, whatever the capitalisation.
   - **Mobile:** 10–13 digits with an optional leading `+`. Spaces, dashes and brackets are accepted and stripped. Numbers made of one repeated digit are rejected.
   - **Password:** 6–72 characters, not only spaces, no leading or trailing space.
3. The server saves the user with a hashed password and a starting amount of **₹0.00**.
4. The new row appears at the top of the admin table, highlighted. Any other admin with the console open sees it appear too.
5. The user can now sign in to the client app.

### 3. Admin adds an amount

1. The admin clicks **Add amount** on a user's row, enters an amount (or picks a quick amount) and an optional note. The amount must be a plain number greater than 0, with at most 2 decimal places, up to ₹1,00,00,000. The note can be up to 140 characters.
2. The server **adds** the amount to the user's current balance rather than replacing it: ₹500 plus ₹250 becomes ₹750.
3. MongoDB does the addition in a single step (`$inc`), so two admins adding at the same moment both count. In the same database transaction, a record of the credit is saved to the `transactions` collection.
4. In the admin app, the user's amount and the total across all users update.
5. In the client app, if that user is signed in:
   - the balance counts up to the new value
   - a "+₹250.00 added just now" badge shows for a few seconds
   - the credit, its note and the resulting balance appear at the top of **Recent credits**

### 4. Admin edits a user

1. The admin clicks **Edit** and changes any of name, city, email or mobile. They can also set a new password; left blank, the current one is kept.
2. The amount isn't edited here. Balances only change through **Add amount**, so every balance change has a matching credit record.
3. If the user is signed in, their **Account details** update live with the message "Your details were updated by an administrator".

### 5. Admin deletes a user

1. The admin clicks **Delete** and confirms.
2. The user and their credit history are removed, and the row disappears from every open admin console.
3. If the user is signed in, the client app immediately shows "Your account was removed", then signs them out to the login page. Their old session stops working and they can't sign in again.

### 6. How changes reach the browser live

1. Each app keeps one connection open from the browser to its `/api/stream` route (Server-Sent Events).
2. On the server, a single MongoDB **change stream** watches the `users` collection and passes every insert, update and delete to all open connections.
3. The admin stream carries changes to every user. The client stream carries only the signed-in user's own changes; the server does the filtering, so a user never receives anyone else's data.
4. Password hashes are removed before anything is sent.
5. The badge next to the page title shows the connection state: *Connecting*, *Live*, *Reconnecting* or *Live updates off*.
6. If the connection drops, the browser reconnects automatically within about 3 seconds and reloads the latest data, so changes made while it was disconnected aren't missed.

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