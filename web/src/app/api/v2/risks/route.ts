import { addRisk } from "@/lib/case";
import { assertWritable, bodyFrom, handle, numberField, textField } from "@/lib/http";
import { writeCase } from "@/lib/mutate";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const input = await bodyFrom<{ region?: string; name?: string; p?: number; loss?: number }>(request);
  return handle(() =>
    writeCase(assertWritable, (workspace, role) => {
      addRisk(
        workspace,
        role,
        textField(input.region, "Zone"),
        textField(input.name, "Event"),
        numberField(input.p, "Probability"),
        numberField(input.loss, "Consequence"),
      );
    }),
  );
}
