import { fileEia, importSynthetic } from "@/lib/case";
import { pullEiaDemand } from "@/lib/eia";
import { ApiError, assertWritable, bodyFrom, handle, readSession, textField } from "@/lib/http";
import { updateWorkspace } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const input = await bodyFrom<{ mode?: string; label?: string; observations?: unknown; respondent?: string }>(request);
  return handle(async () => {
    const session = await readSession();
    assertWritable(session.role);
    if (input.mode === "eia") {
      const pulled = await pullEiaDemand(textField(input.respondent, "Respondent"));
      const workspace = await updateWorkspace(session.caseId, (item) => fileEia(item, session.role, pulled));
      return { workspace };
    }
    if (input.mode !== "synthetic") throw new ApiError(400, "Choose a synthetic import or an EIA pull.");
    const label = textField(input.label, "Label");
    const workspace = await updateWorkspace(session.caseId, (item) => {
      importSynthetic(item, session.role, input.observations, label);
    });
    return { workspace };
  });
}
