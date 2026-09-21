# ProsControl Support Portal

This repository includes a standalone support portal built into the existing Next.js app without the Jumbo shell. The portal is isolated behind the locale route group at [src/app/[lang]/(support)/support](src/app/[lang]/(support)/support).

## Included features

- Customer support dashboard and ticket detail flow
- Staff dashboard, queue, and ticket detail flow
- Support layout with a sidebar and top-level navigation
- Locale-aware support labels in the existing dictionary system
- Mock ticket data and stub API routes for local prototyping

## Local development

```bash
npm install
npm run dev
```

Open the portal in the browser at:

- /en-US/support
- /en-US/support/customer
- /en-US/support/staff
- /en-US/support/staff/queue

## Route structure

- [src/app/[lang]/(support)/support](src/app/[lang]/(support)/support) — support entry and redirect logic
- [src/app/[lang]/(support)/support/customer](src/app/[lang]/(support)/support/customer) — customer ticket list and thread views
- [src/app/[lang]/(support)/support/staff](src/app/[lang]/(support)/support/staff) — staff dashboard and queue views
- [src/components/supportLayout](src/components/supportLayout) — reusable support UI components
- [src/lib/support/mockData.ts](src/lib/support/mockData.ts) — mock ticket data and helpers
- [src/app/api/support](src/app/api/support) — stub endpoints for the portal frontend

## Backend integration

The portal currently uses in-memory mock data so it runs without a backend. To connect it to a real support backend:

1. Replace the mock helpers in [src/lib/support/mockData.ts](src/lib/support/mockData.ts) with real API calls or database access.
2. Update the handlers under [src/app/api/support](src/app/api/support) to call your backend service.
3. Keep the response format consistent with JSON objects such as { data: ... } and { success: true }.
4. Add authentication and role checks where needed for customer and staff-only access.

## Notes

- The support portal intentionally avoids the Jumbo app shell to match the requirement for a standalone support experience.
- All support-facing strings are driven by the dictionary namespace under support in the locale files.
- The route group and data layer are designed to be replaced with a real service without disturbing the UI structure.
