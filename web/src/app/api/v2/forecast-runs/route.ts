import { runForecast } from "@/lib/case";
import { assertWritable, bodyFrom, handle, numberField, textField } from "@/lib/http";
import { writeCase } from "@/lib/mutate";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const input = await bodyFrom<{ region?: string; method?: string; horizon?: number }>(request);
  return handle(async () => {
    let runId = "";
    const { workspace } = await writeCase(assertWritable, (current, role) => {
      runId = runForecast(
        current,
        role,
        textField(input.region, "Zone"),
        textField(input.method, "Method"),
        numberField(input.horizon, "Horizon"),
      );
    });
    void workspace;
    return { runId };
  });
}
