import { recordOutcome } from "@/lib/case";
import { assertManager, bodyFrom, handle, textField } from "@/lib/http";
import { writeCase } from "@/lib/mutate";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const input = await bodyFrom<{ id?: string; outcome?: string }>(request);
  return handle(() =>
    writeCase(assertManager, (workspace, role) => {
      recordOutcome(workspace, role, textField(input.id, "Action"), textField(input.outcome, "Outcome"));
    }),
  );
}
