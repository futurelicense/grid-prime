import { runOptimization, submitPlan } from "@/lib/case";
import { ApiError, assertWritable, bodyFrom, handle, numberField, textField } from "@/lib/http";
import { writeCase } from "@/lib/mutate";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const input = await bodyFrom<Record<string, unknown>>(request);
  return handle(() =>
    writeCase(assertWritable, (workspace, role) => {
      if (typeof input.runId === "string") {
        submitPlan(workspace, role, input.runId);
        return;
      }
      if (input.region == null) throw new ApiError(400, "Choose a zone or a saved portfolio.");
      runOptimization(workspace, role, textField(input.region, "Zone"), {
        budget: numberField(input.budget, "Budget"),
        base: numberField(input.base, "Existing capacity"),
        peak: numberField(input.peak, "Peak demand"),
        reserve: numberField(input.reserve, "Planning margin"),
      });
    }),
  );
}
