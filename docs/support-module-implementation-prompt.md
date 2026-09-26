# Prompt: Implement support tickets, messaging and notifications

You are implementing a **customer-support module** (tickets, ticket chat with attachments, and in-app notifications) in an existing system, with both a backend and a frontend. The design below is a working reference implementation (Laravel 13 + Next.js 16 / React 19 / MUI 7). **Adapt it to the target codebase's own stack, folder structure, naming, auth and conventions** — read the existing code first and match it. Keep the behaviour and rules described here; the exact code shape is yours.

Before writing code: explore the target repo, identify how auth, API responses, users/roles, file storage, mail and routing work there, and state your plan (files to add/change) before implementing.

---

## 1. Domain and rules

Two kinds of people:
- **Customer** — opens tickets and chats about their own tickets.
- **Staff** — handles tickets. Staff status comes from the system's existing role/permission model (reference: a user is staff when they hold any permission). Treat only an explicit `true` as staff; anything else is a customer.

Ticket lifecycle — a fixed enum, **no reopening**:

```
new  --(staff activates: assigns self)-->  active  --(assigned staff closes)-->  closed
                                              |
                                              +--(any staff reassigns to another staff; stays active)
```

- A closed ticket stays closed. A new issue = a new ticket.
- Messages can only be sent while the ticket is `active`.
- The "other party" of a conversation is always derived from the ticket (`user_id` vs current `attended_by_user_id`) — **never store a receiver on the message**, because reassignment would break it.

### Data model

`support_tickets`
| column | type | notes |
|---|---|---|
| id | pk | |
| user_id | fk users | the customer |
| subject | string(255) | required |
| organization_name | string, nullable | free text, optional context |
| notes | text, nullable | the customer's description |
| status | enum `new`/`active`/`closed`, default `new` | |
| attended_by_user_id | fk users, nullable | current staff owner; null while `new` |
| closed_at | timestamp, nullable | |
| created_at / updated_at | timestamps | |

`ticket_reassignments` (audit trail; the ticket keeps only the current owner)
| column | type | notes |
|---|---|---|
| id | pk | |
| ticket_id | fk | |
| from_user_id | fk users, nullable | null on first assignment (activation) |
| to_user_id | fk users | |
| reassigned_by | fk users | who did it |
| reason | string, nullable | |
| created_at | timestamp | |

`support_messages`
| column | type | notes |
|---|---|---|
| id | pk | |
| ticket_id | fk | |
| sender_id | fk users | no receiver column (see rules) |
| type | enum `message`/`system` | `system` for lifecycle lines in the thread |
| body | text | |
| sent_at | datetime | |
| read_at | datetime, nullable | set when the recipient reads it |
| created_at / updated_at | timestamps | |

`support_attachments`
| column | type | notes |
|---|---|---|
| id | pk | |
| ticket_id | fk | denormalized for per-ticket queries/authorization |
| message_id | fk support_messages | |
| uploaded_by | fk users | |
| filename, mime_type | string | original name and client MIME type |
| size | unsigned int | bytes |
| disk, path | string | storage location (private disk, never public) |
| created_at / updated_at | timestamps | |

Add indexes on foreign keys and on `support_tickets(status)`, `support_tickets(attended_by_user_id)`, `support_messages(ticket_id, id)`.

---

## 2. Backend

### Structure
Reference uses folder modules (`Tickets`, `Messaging` with attachments inside it, later `Notifications`), each with Controllers / Models / Services / Requests (validation) / Resources (response shape) / Policies / Events / Listeners / Routes. Rules worth keeping regardless of stack:
- Controllers only orchestrate: validate → call service → return a resource.
- Business rules live in services (e.g. "only active tickets accept messages").
- One module never queries another module's models directly; it calls that module's service. Example: Messaging asks `TicketService::participantsFor($ticketId)` for `{id, status, user_id, attended_by_user_id}` instead of loading the Ticket model.
- Every response goes through a resource/serializer (never raw models). Never expose passwords or internal IDs to customers.

### Response envelope (all endpoints, success and error)
```json
{ "code": 200, "message": "Success", "data": { ... } }
```
- `code` mirrors the HTTP status.
- `422` → `data` holds field errors `{ "field": ["message"] }`.
- Lists → `data: { items: [...], meta: { current_page, last_page, per_page, total } }` (paginated, 15 per page).
- File downloads are raw streams, not enveloped.
If the target system already has an envelope convention, use that instead — but keep lists paginated with a total count (the frontend derives counts from `meta.total`).

### Endpoints (all require auth)

| Action | Method & path | Who | Request | Response |
|---|---|---|---|---|
| Create ticket | `POST /tickets` | any user | `{ subject, organization_name?, notes? }` | 201 `{ ticket }` — status `new`, fires `TicketCreated` |
| List tickets | `GET /tickets` | customer: own only; staff: all | query `status?` (`new`/`active`/`closed`), `mine_only?` (staff: tickets they attend), `page?` | paginated, newest first (`id desc`) |
| Ticket detail | `GET /tickets/{id}` | owner or any staff | — | `{ ticket }` / 403 |
| Activate | `POST /tickets/{id}/activate` | any staff | — | `{ ticket }`; 422 unless `new`; sets `active` + `attended_by = me`; writes reassignment row (`from=null, to=me, by=me`); fires `TicketActivated` |
| Reassign | `POST /tickets/{id}/reassign` | any staff | `{ to_user_id, reason? }` (`to_user_id` must be staff) | `{ ticket }`; 422 unless `active`; writes reassignment row (`from=previous`) |
| Close | `POST /tickets/{id}/close` | staff **currently attending** | — | `{ ticket }`; 422 unless `active`; sets `closed`, `closed_at`; fires `TicketClosed` |
| Reassignment history | `GET /tickets/{id}/reassignments` | staff | — | paginated, newest first |
| List messages | `GET /tickets/{id}/messages` | owner or attending staff\* | query `after_id?` (only messages with id > after_id), `page?` | paginated, **oldest first** (`sent_at, id`), each with nested `attachments` |
| Send message | `POST /tickets/{id}/messages` | owner or **attending** staff | multipart `body` (required), `attachments[]` (files, max 10 MB each) | 201 `{ message }`; 422 unless ticket `active`; fires `MessageSent` |
| Mark read | `PATCH /messages/{id}/read` | only the recipient | — | `{ message }` (sets `read_at`) |
| Download attachment | `GET /attachments/{id}` | owner or attending staff\* | — | file stream with original filename |

\* Decide explicitly whether **any** staff may read any thread (useful for supervisors) or only the attending one. The reference API contract says "any staff", but the reference code only allows the attending staff — pick one and make contract, code and frontend agree.

Resource shapes (the frontend depends on these fields):
- `ticket`: `id, subject, organization_name, notes, status, user{id,name,email,is_staff}, attended_by{…}|null, closed_at, created_at, updated_at`
- `message`: `id, ticket_id, sender{id,name,…}, type, body, sent_at, read_at, attachments[{id, filename, mime_type, size, uploaded_by, created_at}], created_at`
- `reassignment`: `id, from_user|null, to_user, reassigned_by, reason, created_at`

Recipient rule for "mark read" and notifications: if `sender_id == ticket.user_id` the recipient is `attended_by_user_id`, otherwise it's `user_id`.

### Events → side effects (email now, DB notifications later)
| Event | Fired from | Notify |
|---|---|---|
| `TicketCreated` | create | all staff (email) |
| `TicketActivated` | activate | the customer |
| `MessageSent` | send message | the other participant |
| `TicketClosed` | close | the customer |

Make listeners **queued** (`ShouldQueue` or equivalent) — sending mail inside the request slows down or breaks ticket creation/sending when mail is slow. The reference does it synchronously; don't copy that.

Wrap state changes that touch two tables (activate/reassign: update ticket + insert reassignment; send: insert message + attachments) in a **transaction**, and guard activation against two staff activating at once (conditional update `WHERE status = 'new'` or a row lock).

### Notifications module (build this; the reference only planned it)
Use the framework's database notifications (Laravel: `notifications` table + `Notifiable` on User; each listener above also writes a DB notification). Endpoints:
| Action | Method & path | Response |
|---|---|---|
| List mine | `GET /notifications?unread_only=` | paginated `{ id, kind, title, detail, ticket_id, read_at, created_at }` |
| Mark one read | `PATCH /notifications/{id}/read` | `{ notification }` |
| Mark all read | `PATCH /notifications/read-all` | `null` |

Kinds used by the frontend: `new_ticket` (staff), `assigned` (staff; skip when you assigned yourself), `activated` (customer), `closed` (customer), `messages` (both). For message notifications, collapse per ticket ("3 new messages from X") and clear them when the recipient opens the thread (messages marked read).

Also add while you're there:
- `GET /tickets/stats` → `{ total, new, active, closed, unassigned (= new), mine, created_per_day[] }` (so dashboards need one request).
- `GET /reports?from=&to=` → opened/closed per day, avg & median resolution (`closed_at − created_at`), backlog, closed per staff.
- `GET /staff` (staff only) → list of staff users for the reassign picker.

### Operational pitfalls (learned the hard way)
- **Upload limits**: PHP defaults (`upload_max_filesize=2M`, `post_max_size=8M`) reject files before validation runs. Set them above your validation limit (e.g. 10M / 50M) in every environment, or files 2–10 MB fail with a confusing error.
- **Rate limiting behind a proxy/BFF**: if the frontend calls the API from its server, every user shares the server's IP. Configure trusted proxies (`X-Forwarded-For`) or per-user limits, otherwise login/verify throttles apply to the whole user base at once.
- Store attachments on a private disk; only serve them through the authorized download endpoint.

---

## 3. Frontend

### Architecture: a thin server-side proxy (BFF)
The browser never calls the backend directly. Each feature has a server route in the frontend app (reference: Next.js route handlers under `/api/support/*`) that:
1. reads the user's API token from the server-side session (never exposed to the browser),
2. forwards the call to the backend,
3. **normalizes** the backend shape into the UI's types (snake_case → camelCase, `notes` → `description`, `attended_by` → `handledBy/handledById`, etc.).

Rules for the proxy:
- Don't force `Content-Type: application/json` when forwarding `FormData` — let fetch set the multipart boundary, or uploads arrive without files.
- Stream file downloads through (copy `content-type`, `content-length`, `content-disposition`).
- When the backend returns a non-JSON error (e.g. 413 from the web server), return a proper error envelope with a readable message instead of `null`.

Proxy routes used by the UI:
| UI route | Backend |
|---|---|
| `GET /api/support/tickets?status=&mine_only=&page=` | one page of `/tickets`; `status=open` = new + active merged (only used for a customer's own list) |
| `GET /api/support/tickets/mine` | same with `mine_only=1` |
| `POST /api/support/tickets` | create |
| `GET /api/support/tickets/{id}` | detail |
| `POST /api/support/tickets/{id}/activate` \| `/close` \| `/reassign` | actions |
| `GET /api/support/tickets/{id}/reassignments` | history |
| `GET/POST /api/support/tickets/{id}/messages` | list (`after_id`) / send (FormData passthrough) |
| `PATCH /api/support/messages/{id}/read` | mark read |
| `GET /api/support/attachments/{id}` | download stream |
| `GET /api/support/stats` | counts from `meta.total` of small requests (until the backend stats endpoint exists) |
| `GET /api/support/notifications` | see Notifications below |

### UI types
```ts
type TicketStatus = 'new' | 'active' | 'closed';
interface Ticket { id; subject; description; status; customerId; customerName; customerEmail;
  handledBy?; handledById?; organizationName?; closedAt?; createdAt; updatedAt }
interface TicketMessage { id; senderId; senderName; body; type: 'message'|'system'; readAt;
  attachments: { id; name; url /* proxy download URL */; mimeType; size }[]; createdAt }
```
Compare user IDs as strings everywhere (backend IDs are numbers, session IDs may be strings).

### Pages
- **Customer**: My tickets (tabs Open / Closed / All, paginated), ticket chat, create ticket (subject, optional organization, description → opens the new ticket).
- **Staff**: Dashboard (stat cards + charts from stats), Queue (filters All/New/Active/Mine/Closed with counts, per-card action: **Activate** on `new`, **Close** on `active` tickets I attend), All tickets (paginated), ticket chat with a side panel (status steps, people, ticket info, actions, reassignment history).
- **Role guard**: enforce staff-only pages on the server/middleware using the backend's live user (`/auth/me`), redirecting non-staff to the customer area. Client-side checks alone flash staff UI and can be bypassed.

### Ticket chat (both roles)
Layout:
- Header (back, subject, status) fixed at top; request card + messages in a scroll area; composer **pinned to the bottom of the viewport**.
- Open scrolled to the newest message. Follow new messages only while the reader is near the bottom (~120px); always scroll after the user sends.

Composer:
- Enter sends, Shift+Enter new line; attach button (multiple files, client-side 10 MB check); chips for selected files; show backend errors inline.
- Replace the composer with an explanation when sending isn't allowed:
  - `new` → customer: "waiting for an agent"; staff: "activate to start".
  - `closed` → "ticket is closed".
  - staff who isn't the attending one → "only the handling agent can reply".
- Report "has unsent draft" upward.

Message bubbles: mine on the right (blue), others left; attachments as download links (proxy URL); `system` messages centered; read tick when `readAt` is set.

Read receipts: when a message from the other participant with no `readAt` appears and I am the recipient (I'm the customer, or I'm the attending staff), `PATCH …/read` once per message.

Staff actions: Activate (new), Close (active + attending), Reassign (active; staff picker once `GET /staff` exists — until then an ID field), history list. Show backend 422/403 messages.

Esc leaves the chat — but not while there is an unsent draft, and not when a dialog/menu is open (check `event.defaultPrevented`). "Back" should go to the previous page only if it was inside the app; otherwise go to the ticket list (track in-app page views), so users arriving from an email link don't leave the app.

### Real-time: adaptive polling (no websocket in v1)
Polling runs **only on an open chat page** — load scales with open conversations, not with the number of tickets.

```
on open: load ticket, full thread, (staff) reassignment history
loop (setTimeout chain, not setInterval):
  if ticket.status == 'closed': stop            # closed is final
  if tab hidden: wait 30s, skip fetching
  newFromOthers = GET messages?after_id=<last id>
  if newFromOthers > 0: step = 0; refresh ticket
  else if no typing in last 15s: step = min(step+1, last)
  if now - lastTicketFetch >= 30s: refresh ticket (status/assignee)
  wait STEPS[step]                              # STEPS = [5s, 10s, 15s, 30s]
wake-ups (step = 0 and fetch now): tab becomes visible, user starts typing (only if backed off), after sending
```
Measured: idle chat → requests at 5s, 15s, 30s, 60s…; typing → one immediate check then steady 5s (never one request per keystroke); closed ticket → zero polling. React StrictMode double-runs effects in development only.

Upgrade path: broadcast `MessageSent`/ticket events on a private per-ticket channel (Laravel Reverb/Pusher + Echo); subscribe in the same hook and keep polling as a slow fallback.

### Lists and counts
- Always request one page (15) from the backend with filters; render a pagination bar ("1–15 of 120" + page buttons). Never download all pages to filter or count on the client — it's slow and was capped (tickets silently disappeared past the cap).
- Counts come from `meta.total` of filtered one-page requests, or from `/tickets/stats` once it exists.

### Notifications (bell + page)
UI: bell with unread badge in the top bar → dropdown with the latest 8 (mark all as read, view all), and a Notifications page with the full list. Clicking an item marks it read and opens the ticket (staff vs customer URL). One poller for the whole app (a provider at the layout level), every **60s**, only while the tab is visible, plus immediately when the bell opens or the tab regains focus.

With the backend notifications endpoint: list from `GET /notifications`, read state from `read_at`, actions call the PATCH endpoints.

Interim (no backend endpoint) — derive them in the proxy route from existing data:
- Staff: `new_ticket` per `status=new` ticket; for my active tickets (cap 10): unread messages from the customer, and `assigned` when the newest reassignment was done by someone else.
- Customer: `activated` for active tickets (id includes the handler so a reassignment re-notifies), unread staff messages, `closed` for recently closed tickets (14-day window).
- Unread messages = newest page of the thread, `read_at == null`, sender ≠ me; id `messages:{ticketId}:{latestUnreadId}` so a later message re-notifies.
- Read state for non-message items is kept in browser storage per user (message items clear automatically once the thread is opened). Note this doesn't sync across devices — that's why the backend endpoint is the real fix.

---

## 4. Build order
1. Migrations + models + enums; factories.
2. Tickets service/policies/endpoints + tests (create, list filters, detail 403, activate/reassign/close rules, history).
3. Messaging service/endpoints + attachments + tests (send only when active, only participants, mark-read only by recipient, `after_id`, download auth).
4. Events + queued listeners (mail) + DB notifications + notifications endpoints + tests.
5. Stats/reports/staff-list endpoints.
6. Frontend proxy routes + normalizers.
7. Lists (paginated) → ticket chat (layout, composer, attachments, read receipts, adaptive polling) → staff actions → notifications bell/page → role guard.

## 5. Acceptance checks (run them end to end with one customer and two staff accounts)
- Customer can't message a `new` ticket (422) and can't activate/close/see history (403).
- Staff A activates → customer is notified; A and customer exchange messages with a text file and a ~5 MB file; downloads are byte-identical.
- Read tick appears for the sender after the recipient opens the chat; the recipient's "new messages" notification disappears.
- Staff A reassigns to staff B → B gets "assigned to you by A"; A can no longer reply or close; B can.
- B closes → customer notified; composer shows "closed"; polling stops (no requests after load).
- A thread with more than 15 messages loads completely; lists with more than 15 tickets paginate with correct totals.
- A customer opening a staff URL is redirected server-side without seeing staff UI.
- Two staff activating the same `new` ticket at the same moment: exactly one succeeds.
