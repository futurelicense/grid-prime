import { datasetVersions } from "@/lib/case";
import { handle, readSession } from "@/lib/http";
import { readWorkspace } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handle(async () => {
    const session = await readSession();
    const workspace = readWorkspace(session.caseId);
    return { sourceId: id, versions: datasetVersions(workspace, id) };
  });
}
