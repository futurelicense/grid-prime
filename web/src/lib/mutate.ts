import { readSession } from "./http";
import { updateWorkspace } from "./store";
import type { Role, Workspace } from "./types";

export async function writeCase(check: (role: Role) => void, change: (workspace: Workspace, role: Role) => void) {
  const session = await readSession();
  check(session.role);
  const workspace = await updateWorkspace(session.caseId, (workspace) => change(workspace, session.role));
  return { workspace };
}
