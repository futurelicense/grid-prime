import { runScenario } from "@/lib/case";
import { assertWritable, bodyFrom, handle, numberField, textField } from "@/lib/http";
import { writeCase } from "@/lib/mutate";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const input = await bodyFrom<Record<string, unknown>>(request);
  return handle(() =>
    writeCase(assertWritable, (workspace, role) => {
      runScenario(workspace, role, textField(input.region, "Zone"), {
        demand: numberField(input.demand, "Demand"),
        capacity: numberField(input.capacity, "Available capacity"),
        growth: numberField(input.growth, "Demand growth"),
        derate: numberField(input.derate, "Capacity derating"),
        noise: numberField(input.noise, "Demand noise"),
        duration: numberField(input.duration, "Duration"),
        seed: numberField(input.seed, "Seed"),
      });
    }),
  );
}
