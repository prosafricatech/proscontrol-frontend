import { redirect } from "next/navigation";

interface LegacyResetPasswordPageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
}

export default async function LegacyResetPasswordPage({
  params,
  searchParams,
}: LegacyResetPasswordPageProps) {
  const { lang } = await params;
  const { token } = await searchParams;
  const safeToken = Array.isArray(token) ? token[0] : token;
  const query = safeToken ? `?token=${encodeURIComponent(safeToken)}` : "";

  redirect(`/${lang}/auth/reset-password${query}`);
}
