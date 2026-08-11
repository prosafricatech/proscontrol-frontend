import { redirect } from "next/navigation";

interface ResetPasswordEntryPageProps {
  searchParams: Promise<{ token?: string | string[] }>;
}

export default async function ResetPasswordEntryPage({
  searchParams,
}: ResetPasswordEntryPageProps) {
  const { token } = await searchParams;
  const safeToken = Array.isArray(token) ? token[0] : token;
  const query = safeToken ? `?token=${encodeURIComponent(safeToken)}` : "";

  redirect(`/en-US/auth/reset-password${query}`);
}
