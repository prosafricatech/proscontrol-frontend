import { AfterHydration } from '@/components/supportLayout/AfterHydration';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AfterHydration>{children}</AfterHydration>;
}
