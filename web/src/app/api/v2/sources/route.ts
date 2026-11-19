import { handle, readSession } from "@/lib/http";
import { listSources } from "@/lib/sources";
import { readWorkspace } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    const session = await readSession();
    const workspace = readWorkspace(session.caseId);
    const capabilities = {
      eia: Boolean(process.env.EIA_API_KEY),
      groq: Boolean(process.env.GROQ_API_KEY),
    };
    return { sources: listSources(workspace, capabilities) };
  });
}
