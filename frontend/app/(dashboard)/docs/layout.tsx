import { RequireAuth } from "@/components/auth/auth-guard";

export default function DocsAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAuth>{children}</RequireAuth>;
}
