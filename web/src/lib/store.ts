import { mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import path from "path";
import { seedWorkspace } from "./seed";
import type { CaseId, Role, Workspace } from "./types";

type Database = { workspaces: Record<CaseId, Workspace> };

const file = path.join(process.cwd(), ".data", "cases.json");
let chain: Promise<unknown> = Promise.resolve();

function emptyDb(): Database {
  return {
    workspaces: {
      reference: seedWorkspace("reference"),
      empty: seedWorkspace("empty"),
    },
  };
}

function hydrate(workspace: Workspace) {
  if (!Array.isArray(workspace.links)) workspace.links = seedWorkspace(workspace.id).links;
  if (!Array.isArray(workspace.actions)) workspace.actions = [];
  return workspace;
}

function readDb(): Database {
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8")) as Database;
    if (!parsed.workspaces?.reference || !parsed.workspaces?.empty) return emptyDb();
    hydrate(parsed.workspaces.reference);
    hydrate(parsed.workspaces.empty);
    return parsed;
  } catch {
    return emptyDb();
  }
}

function writeDb(db: Database) {
  mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.tmp`;
  writeFileSync(temp, JSON.stringify(db));
  renameSync(temp, file);
}

export function readWorkspace(id: CaseId): Workspace {
  return structuredClone(readDb().workspaces[id]);
}

export function updateWorkspace(id: CaseId, change: (workspace: Workspace) => void) {
  const run = chain.then(() => {
    const db = readDb();
    change(db.workspaces[id]);
    writeDb(db);
    return structuredClone(db.workspaces[id]);
  });
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function resetWorkspace(id: CaseId, role: Role) {
  return updateWorkspace(id, (workspace) => {
    const next = seedWorkspace(id);
    Object.assign(workspace, next);
    workspace.audit = [
      { time: new Date().toISOString(), role, event: "Case reset" },
    ];
  });
}
