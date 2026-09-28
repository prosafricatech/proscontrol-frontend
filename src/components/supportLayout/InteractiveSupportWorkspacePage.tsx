'use client';

import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { SupportLayout } from '@/components/supportLayout/SupportLayout';
import SupportReports from '@/components/supportLayout/SupportReports';
import { useT } from '@/lib/i18n/useT';
import { useRouter } from 'next/navigation';
import { useEffect, type ComponentType } from 'react';
import ActivityLogsPage from './workspace/ActivityLogsPage';
import CreateTicketPage from './workspace/CreateTicketPage';
import CustomerProfilePage from './workspace/CustomerProfilePage';
import KnowledgeBasePage from './workspace/KnowledgeBasePage';
import NotificationCenterPage from './workspace/NotificationCenterPage';
import SavedRepliesPage from './workspace/SavedRepliesPage';
import SettingsPage from './workspace/SettingsPage';
import StaffDirectoryPage from './workspace/StaffDirectoryPage';

type View =
  | 'staff'
  | 'customerProfile'
  | 'settings'
  | 'create'
  | 'knowledge'
  | 'reports'
  | 'activity'
  | 'notifications'
  | 'replies';

const PAGES: Record<View, ComponentType> = {
  staff: StaffDirectoryPage,
  customerProfile: CustomerProfilePage,
  settings: SettingsPage,
  create: CreateTicketPage,
  knowledge: KnowledgeBasePage,
  reports: SupportReports,
  activity: ActivityLogsPage,
  notifications: NotificationCenterPage,
  replies: SavedRepliesPage,
};

/** Views customers may also open; everything else is staff-only. */
const SHARED_VIEWS: View[] = ['create', 'notifications'];

/**
 * Shell for the workspace pages (/create-ticket, /reports, /settings, …):
 * picks the page for `view` and keeps customers out of staff-only views.
 * The middleware already redirects them server-side; this guard avoids a
 * flash of staff UI during client-side navigation.
 */
export default function InteractiveSupportWorkspacePage({
  view,
}: {
  view: View;
}) {
  const t = useT();
  const lang = useLanguage();
  const router = useRouter();
  const { authData } = useJumboAuth();

  const authUser = authData.authUser?.user;
  const isStaff = authUser?.is_staff === true;
  const isStaffOnlyView = !SHARED_VIEWS.includes(view);
  const role = isStaff ? 'staff' : 'customer';

  useEffect(() => {
    if (!authData.isLoading && !isStaff && isStaffOnlyView) {
      router.replace(`/${lang}/support/customer`);
    }
  }, [authData.isLoading, isStaff, isStaffOnlyView, lang, router]);

  if (isStaffOnlyView && (authData.isLoading || !isStaff)) return null;

  const roleLabel = isStaff
    ? t('portal.common.staff', 'Staff')
    : t('portal.common.customer', 'Customer');
  const Page = PAGES[view];

  return (
    <SupportLayout
      userRole={role}
      userName={authUser?.name || roleLabel}
      userRoleLabel={roleLabel}
    >
      <Page />
    </SupportLayout>
  );
}
