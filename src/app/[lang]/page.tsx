import { redirect } from 'next/navigation';

interface LocaleHomeProps {
  params: Promise<{ lang: string }>;
}

/**
 * `/en-US` on its own has no content. Opening the site root lands here (the
 * locale middleware turns `/` into `/en-US`), and so does signing in after
 * that, so send people on to the portal, which picks the staff or customer
 * view. Signed-out visitors never reach this: the auth middleware sends them
 * to sign-in first.
 */
export default async function LocaleHome({ params }: LocaleHomeProps) {
  const { lang } = await params;

  redirect(`/${lang}/support`);
}
