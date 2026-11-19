import { handle, readSession } from "@/lib/http";
import { readWorkspace } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    const session = await readSession();
    return { events: readWorkspace(session.caseId).audit };
  });
}
