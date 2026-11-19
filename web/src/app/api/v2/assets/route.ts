import { addAsset } from "@/lib/case";
import { assertWritable, bodyFrom, handle, numberField, textField } from "@/lib/http";
import { writeCase } from "@/lib/mutate";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const input = await bodyFrom<{ region?: string; name?: string; mw?: number }>(request);
  return handle(() =>
    writeCase(assertWritable, (workspace, role) => {
      addAsset(
        workspace,
        role,
        textField(input.region, "Zone"),
        textField(input.name, "Resource"),
        numberField(input.mw, "Capacity"),
      );
    }),
  );
}
