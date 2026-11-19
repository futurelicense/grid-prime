import { explainRun, localExplanation } from "@/lib/explain";
import { ApiError, bodyFrom, handle, readSession, textField } from "@/lib/http";
import { readWorkspace, updateWorkspace } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const input = await bodyFrom<{ runId?: string }>(request);
  return handle(async () => {
    const session = await readSession();
    const runId = textField(input.runId, "Run");
    const workspace = readWorkspace(session.caseId);
    const run = workspace.runs.find((item) => item.id === runId);
    if (!run) throw new ApiError(404, "That run is not on this case.");
    if (session.role === "Viewer") return { explanation: localExplanation(run) };
    const explanation = await explainRun(run);
    await updateWorkspace(session.caseId, (item) => {
      const stored = item.runs.find((candidate) => candidate.id === runId);
      if (stored) stored.reading = explanation;
      item.audit.unshift({
        time: new Date().toISOString(),
        role: session.role,
        event: `Explanation ${explanation.mode} for ${runId}`,
      });
    });
    return { explanation };
  });
}
