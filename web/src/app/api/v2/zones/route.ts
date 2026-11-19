import { addZone } from "@/lib/case";
import { assertWritable, bodyFrom, handle, textField } from "@/lib/http";
import { writeCase } from "@/lib/mutate";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const input = await bodyFrom<{ region?: string }>(request);
  return handle(() =>
    writeCase(assertWritable, (workspace, role) => {
      addZone(workspace, role, textField(input.region, "Zone"));
    }),
  );
}
