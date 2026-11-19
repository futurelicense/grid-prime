import { reviewDecision } from "@/lib/case";
import { ApiError, assertReviewer, bodyFrom, handle, textField } from "@/lib/http";
import { writeCase } from "@/lib/mutate";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const input = await bodyFrom<{ decisionId?: string; status?: string; reason?: string }>(request);
  return handle(() =>
    writeCase(assertReviewer, (workspace, role) => {
      if (input.status !== "Approved" && input.status !== "Returned") {
        throw new ApiError(400, "Review status must be approved or returned.");
      }
      reviewDecision(workspace, role, textField(input.decisionId, "Decision"), input.status, textField(input.reason, "Rationale"));
    }),
  );
}
