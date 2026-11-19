import { assignAction } from "@/lib/case";
import { assertWritable, bodyFrom, handle, textField } from "@/lib/http";
import { writeCase } from "@/lib/mutate";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const input = await bodyFrom<{ id?: string; owner?: string; due?: string; progress?: string }>(request);
  return handle(() =>
    writeCase(assertWritable, (workspace, role) => {
      assignAction(
        workspace,
        role,
        textField(input.id, "Action"),
        textField(input.owner, "Owner"),
        textField(input.due, "Due date"),
        textField(input.progress, "Progress"),
      );
    }),
  );
}
