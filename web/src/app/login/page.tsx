import { LoginForm } from "@/components/login-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sign in · GRID-PRIME",
};

function safeNext(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/login")) return "/case";
  return value;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; switch?: string }>;
}) {
  const query = await searchParams;
  return <LoginForm nextPath={safeNext(query.next)} switching={query.switch === "1"} />;
}
