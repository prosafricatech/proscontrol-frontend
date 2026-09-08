'use client';

import dynamic from 'next/dynamic';

// `ssr: false` is only allowed from a Client Component, so this thin wrapper
// exists purely to host it — see asset-bookings/page.tsx for why SSR is
// skipped for this calendar (hydration mismatch was resetting react-big-calendar's
// internal navigation state on every Next/Prev click).
const AssetBookingCalendar = dynamic(() => import('./AssetBookingCalendar'), { ssr: false });

export default AssetBookingCalendar;
