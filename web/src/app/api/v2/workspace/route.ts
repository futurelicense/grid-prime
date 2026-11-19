import { assertWritable, handle, readSession } from "@/lib/http";
import { listSources } from "@/lib/sources";
import { readWorkspace, resetWorkspace } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    const session = await readSession();
    const workspace = readWorkspace(session.caseId);
    const capabilities = {
      eia: Boolean(process.env.EIA_API_KEY),
      groq: Boolean(process.env.GROQ_API_KEY),
    };
    return {
      workspace,
      session,
      sources: listSources(workspace, capabilities),
      capabilities,
    };
  });
}

export async function DELETE() {
  return handle(async () => {
    const session = await readSession();
    assertWritable(session.role);
    const workspace = await resetWorkspace(session.caseId, session.role);
    return { workspace };
  });
}
