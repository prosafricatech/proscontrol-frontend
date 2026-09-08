export const dynamic = "force-dynamic";
import AssetBookingCalendar from '@/components/assetBookings/AssetBookingCalendarClientOnly'

// This calendar is fully client-side and auth/org-gated (JumboAuth context,
// react-query loading state, moment-based "today") — none of that can match
// between the server's render pass and the client's first paint, which was
// causing a hydration mismatch. React's recovery from that mismatch discards
// and rebuilds the subtree, which was wiping react-big-calendar's internal
// (uncontrolled) navigation state — the calendar's Next/Prev buttons would
// silently reset right after moving. Skipping SSR for this component avoids
// the mismatch entirely; there's no SEO/SSR benefit to lose here anyway.
// (`ssr: false` for next/dynamic requires a Client Component, so that part
// lives in AssetBookingCalendarClientOnly.tsx — this file stays a Server
// Component so the `force-dynamic` route config above still applies.)

function page() {
  return (
    <AssetBookingCalendar/>
  )
}

export default page
