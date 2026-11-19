import { Landing } from "@/components/landing";
import { readSession } from "@/lib/http";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await readSession();
  return <Landing entered={session.entered} name={session.name} />;
}
