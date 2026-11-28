# KrishiSetu — full-stack development project

Requires Node.js 22.13 or newer. No dependencies to install. Open this folder in VS Code and run `npm start` (or `node server.js`), then visit http://localhost:3000. Register separate Farmer, Distributor and Transporter accounts. Use separate browser profiles/private windows to keep distinct sessions, or log out between roles.

## Workflow
1. Farmer creates product and sets pickup location, price and stock.
2. Distributor opens marketplace, orders available stock, selects shipping and payment preference.
3. Farmer accepts or rejects (rejection restores reserved stock).
4. Company shipping: transporter refreshes, accepts available trip, marks picked up and delivered. Self shipping: farmer marks sent.
5. Distributor confirms receipt. All roles can send messages and submit support tickets. Distributor can post demand.

## Paths
- `server.js`: HTTP entry point
- `frontend/pages/`: landing page and three role dashboards
- `frontend/assets/css/`, `frontend/assets/js/`: separated styles and scripts
- `backend/routes/auth.js`: signup/login/logout/current user
- `backend/routes/market.js`: product, order, demand, message, ticket APIs
- `backend/middleware/http.js`: JSON and validation helpers
- `backend/database/store.js`: SQLite persistence; creates krishisetu.sqlite on startup
- `original-designs/`: untouched original HTML files, not served by the app

The landing page is preserved; dashboard UI was simplified to replace browser-local mock interactions with shared data. No real payment processing, shipping fees, vehicle capacity validation, live GPS, admin/support portal or external agricultural supplier integrations. Payment choices are preferences only. No existing browser-local data is migrated. Sessions reset on server restart. Local development only; before public deployment use HTTPS, secure cookies, database access review, rate limits, CSRF protections and security review. Never publish database files.

## SQLite
The schema is in `backend/database/schema.sql`. Six relational tables store users, products, orders, messages, tickets and demands. Orders retain product snapshots even if products are deleted. Existing JSON data is imported when the database is empty and no migration marker exists. Keep the old JSON as a backup. The route compatibility layer uses in-memory arrays and writes a transactional snapshot on mutations; run only one server process and do not edit the database externally while running. Sessions are still in memory. SQLite is built into Node.js 22.13+; no npm install needed. The experimental SQLite warning on some Node versions is normal.

## Security upgrade (1.2)
Sessions now persist in SQLite with hashed tokens and a 24-hour expiry. Logout revokes the token. Account security forms change passwords and revoke all sessions. Authentication endpoints are limited to 20 requests per IP per 15 minutes per endpoint. Browser cross-origin writes are rejected, and security headers are enabled. Behind an HTTPS reverse proxy set APP_ORIGIN to the public HTTPS origin and SECURE_COOKIE=1. Rate limits are process-local; use a single server. Email recovery, MFA, full security audit and public deployment are not included. This supersedes the earlier README notes about in-memory sessions.

## Local pilot upgrade
Community price reports, suggested collection centres, transporter vehicle directory and harvest/sell-by details are available in the Local section of each dashboard. All persist in SQLite. Prices and centres are user-submitted and unverified; no live market feed or booking/vehicle matching is included. Use public business contacts only. Suggested pilot: Dhankuta, Dharan, Itahari. Example data must be entered manually; no fictional records are seeded. Existing SQLite files are upgraded on startup. Run npm start with Node 22.13+.

## Live chat and notifications (v1.4)
Authenticated Server-Sent Events (`GET /api/events`) send changed snapshots about once per second; chat sends via existing `POST /api/messages`. Notifications persist in SQLite and can be marked read with `POST /api/notifications/read`. `GET /api/notifications` provides a snapshot. Order alerts go to involved users and available transporter accounts when a company shipment is accepted. The dashboard shows the latest 100 notifications and latest 500 messages per user. Order tables refresh via the Refresh orders button. Browser tabs must be open for live delivery; no SMS, background push or end-to-end encryption. Single-server local deployment only.

## Updated dashboard edition
The three uploaded dashboard designs supply the original CSS, logo and hero artwork. Their local demo scripts are replaced by shared API-backed panels with sidebar navigation, chat, alerts, stock summaries and order history. Distributor stock totals represent received quantities, not a warehouse ledger. Original uploaded pages are archived under original-designs. Mock farm supply purchasing, fake payment completion and browser-local profiles are not enabled in the live dashboards. To upgrade an existing installation, stop the server, back up the SQLite database (and any WAL/SHM files), and copy updated source files over without deleting the database. Start with npm start.

## v1.6 Clean edition
Responsive scrollable data tables, explicit empty states, simpler form panels, clearer payment disclaimer and navigation accessibility. Fixed blank inventory-edit inputs and a stale-reference case during password changes. Existing SQLite schema is retained. Optional regression test: `python tests/smoke.py` (Python 3, port 3939 free); it uses a temporary database. Passed API workflow including all three roles, stock deduction, delivery, receipt, private chat, SSE, notification read status, vehicle registration and restart persistence. Browser automation was blocked by the execution environment; manually verify desktop/mobile layouts and click flows. Stop the old server and back up/copy its database before switching versions, including any SQLite WAL/SHM files if present. Do not copy test data. Payments remain preferences only.

## Farm shop and crop photos (v1.7)
Farmers can upload JPEG, PNG or WebP files up to 2 MB when listing produce, and replace/remove photos later. Images are stored in SQLite and visible to authenticated marketplace users. The farmer supplies shop has 12 illustrative products, category filtering, request history and cancellation. Prices are examples, not live quotes; requests do not reach suppliers and do not process payments. Existing SQLite files are extended automatically by CREATE TABLE IF NOT EXISTS. Back up your database before upgrading. Backend smoke tests include image upload, ownership checks, supply request and cancellation. Browser testing remains outstanding.
