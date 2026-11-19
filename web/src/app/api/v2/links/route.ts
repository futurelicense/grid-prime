import { addLink } from "@/lib/case";
import { assertWritable, bodyFrom, handle, textField } from "@/lib/http";
import { writeCase } from "@/lib/mutate";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const input = await bodyFrom<{ from?: string; to?: string; note?: string }>(request);
  return handle(() =>
    writeCase(assertWritable, (workspace, role) => {
      addLink(workspace, role, textField(input.from, "From"), textField(input.to, "To"), textField(input.note, "Note"));
    }),
  );
}
