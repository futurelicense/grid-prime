import { cookies } from "next/headers";
import { CASES, ROLES, type CaseId, type Role } from "./types";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function readSession(): Promise<{ role: Role; caseId: CaseId; name: string; entered: boolean }> {
  const jar = await cookies();
  const roleValue = jar.get("gp_role")?.value;
  const caseValue = jar.get("gp_case")?.value;
  const role = ROLES.find((item) => item === roleValue) ?? "Analyst";
  const caseId = CASES.find((item) => item === caseValue) ?? "reference";
  const rawName = jar.get("gp_name")?.value ?? "";
  const name = rawName.trim() || "Planner";
  return { role, caseId, name, entered: jar.get("gp_entered")?.value === "1" };
}

export async function bodyFrom<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiError(400, "Expected a JSON body.");
  }
}

export function assertWritable(role: Role) {
  if (role === "Viewer") throw new ApiError(403, "This session can read the case. It cannot change it.");
}

export function assertReviewer(role: Role) {
  if (role !== "Reviewer") throw new ApiError(403, "A reviewer session is required to accept or return a plan.");
}

export function assertManager(role: Role) {
  if (role !== "Program manager") {
    throw new ApiError(403, "A program manager session is required to record an outcome.");
  }
}

export async function handle(fn: () => Promise<unknown>) {
  try {
    return Response.json(await fn());
  } catch (error) {
    if (error instanceof ApiError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return Response.json({ error: "The case service failed." }, { status: 500 });
  }
}

export function numberField(value: unknown, label: string) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) throw new ApiError(400, `${label} must be a number.`);
  return parsed;
}

export function textField(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) throw new ApiError(400, `${label} is required.`);
  return value.trim();
}
