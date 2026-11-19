import { ApiError, handle, readSession } from "@/lib/http";
import { readWorkspace } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await readSession();
    const { id } = await context.params;
    const run = readWorkspace(session.caseId).runs.find((item) => item.id === id);
    if (!run) throw new ApiError(404, "That run is not on this case.");
    return { run };
  });
}
