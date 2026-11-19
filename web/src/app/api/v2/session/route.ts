import { cookies } from "next/headers";
import { ApiError, bodyFrom, handle } from "@/lib/http";
import { CASES, ROLES, type CaseId, type Role } from "@/lib/types";

export const dynamic = "force-dynamic";

const cookie = { httpOnly: true, sameSite: "lax" as const, path: "/" };

export async function POST(request: Request) {
  return handle(async () => {
    const input = await bodyFrom<{ role?: Role; caseId?: CaseId; name?: string; enter?: boolean; leave?: boolean }>(request);
    const jar = await cookies();
    if (input.leave) {
      jar.delete("gp_entered");
      jar.delete("gp_name");
      jar.delete("gp_role");
      jar.delete("gp_case");
      return { ok: true };
    }
    if (input.enter) {
      if (!input.role || !ROLES.includes(input.role)) throw new ApiError(400, "Choose a role.");
      if (!input.caseId || !CASES.includes(input.caseId)) throw new ApiError(400, "Choose a case.");
      const name = cleanName(input.name);
      jar.set("gp_role", input.role, cookie);
      jar.set("gp_case", input.caseId, cookie);
      jar.set("gp_name", name, cookie);
      jar.set("gp_entered", "1", cookie);
      return { ok: true };
    }
    if (input.role) {
      if (!ROLES.includes(input.role)) throw new ApiError(400, "Unknown session role.");
      jar.set("gp_role", input.role, cookie);
    }
    if (input.caseId) {
      if (!CASES.includes(input.caseId)) throw new ApiError(400, "Unknown case.");
      jar.set("gp_case", input.caseId, cookie);
    }
    return { ok: true };
  });
}

function cleanName(value: unknown) {
  if (typeof value !== "string") throw new ApiError(400, "Enter your name.");
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 60) throw new ApiError(400, "Use a name between 2 and 60 characters.");
  return name;
}
