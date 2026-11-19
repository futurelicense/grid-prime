"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CaseId, Role, WorkspacePayload } from "@/lib/types";

type WorkspaceContextValue = {
  payload: WorkspacePayload | null;
  zone: string;
  error: string | null;
  setZone: (zone: string) => void;
  refresh: () => Promise<void>;
  mutate: (url: string, body?: unknown, method?: "POST" | "DELETE") => Promise<void>;
  setSession: (next: { role?: Role; caseId?: CaseId }) => Promise<void>;
  leave: () => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("Workspace provider missing");
  return value;
}

function inWorkspace(pathname: string) {
  return ["/case", "/model", "/predict", "/optimize", "/deliver", "/brief"].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active = inWorkspace(pathname);
  const [payload, setPayload] = useState<WorkspacePayload | null>(null);
  const [zone, setZone] = useState("all");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/v2/workspace", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "The case could not be opened.");
    setPayload(data as WorkspacePayload);
    setZone((current) =>
      current !== "all" && !(data.workspace.regions as string[]).includes(current) ? "all" : current,
    );
    setError(null);
  }, []);

  useEffect(() => {
    if (!active) return;
    refresh().catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : "The case could not be opened.");
    });
  }, [active, refresh]);

  const mutate = useCallback(
    async (url: string, body?: unknown, method: "POST" | "DELETE" = "POST") => {
      const response = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "The case could not be updated.");
      await refresh();
    },
    [refresh],
  );

  const setSession = useCallback(
    async (next: { role?: Role; caseId?: CaseId }) => {
      await mutate("/api/v2/session", next);
      if (next.caseId) setZone("all");
    },
    [mutate],
  );

  const leave = useCallback(async () => {
    await fetch("/api/v2/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leave: true }),
    });
    window.location.href = "/";
  }, []);

  const value = useMemo(
    () => ({ payload, zone, error, setZone, refresh, mutate, setSession, leave }),
    [payload, zone, error, refresh, mutate, setSession, leave],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
