"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { CaseId, Role } from "@/lib/types";

const ROLES: { id: Role; text: string }[] = [
  { id: "Analyst", text: "File series, forecasts, stress cases, and portfolios." },
  { id: "Reviewer", text: "Accept or return a plan and write the reason." },
  { id: "Program manager", text: "Record what happened after acceptance." },
  { id: "Viewer", text: "Read only. The case will refuse every change." },
];

export function LoginForm({ nextPath, switching }: { nextPath: string; switching: boolean }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("Analyst");
  const [caseId, setCaseId] = useState<CaseId>("reference");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/v2/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enter: true, name, role, caseId }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Sign-in did not complete.");
      router.push(nextPath);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Sign-in did not complete.");
      setPending(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <aside className="flex flex-col justify-between bg-ink px-8 py-8 text-[#f6f3ec] sm:px-12 sm:py-12">
        <Link href="/" className="font-serif text-2xl">
          Grid Prime
        </Link>
        <div className="max-w-md py-12">
          <p className="kicker text-[#c8bfb0]">Sign in</p>
          <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">Take a seat on the case.</h1>
          <p className="mt-4 text-sm leading-6 text-[#d9d0c3]">
            Your name stays on the session. Your role decides what the case will accept. The reference file is ready to
            read; an empty file starts with nothing on it.
          </p>
        </div>
        <p className="text-sm text-[#c8bfb0]">Planning review. No operational authority.</p>
      </aside>

      <main className="flex items-center bg-paper px-6 py-10 sm:px-10">
        <form onSubmit={submit} className="mx-auto grid w-full max-w-lg gap-6">
          <div className="lg:hidden">
            <Link href="/" className="text-sm text-pine">
              Back
            </Link>
          </div>
          <div>
            <h2 className="font-serif text-4xl">{switching ? "Change your seat" : "Welcome in"}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              This is a research workstation. The sign-in names you and your role. It is not a utility credential.
            </p>
          </div>

          <label className="field">
            <span>Your name</span>
            <input
              className="control-box"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              placeholder="Avery Chen"
              required
            />
          </label>

          <fieldset className="grid gap-2">
            <legend className="text-sm text-muted">Role</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {ROLES.map((item) => {
                const selected = role === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRole(item.id)}
                    className={`border p-3 text-left ${selected ? "border-pine bg-moss" : "border-line bg-sheet"}`}
                    aria-pressed={selected}
                  >
                    <div className="font-serif text-xl">{item.id}</div>
                    <p className="mt-1 text-sm leading-5 text-muted">{item.text}</p>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="grid gap-2">
            <legend className="text-sm text-muted">Case</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <CaseChoice
                selected={caseId === "reference"}
                title="Reference"
                text="Three zones and a synthetic hourly series are already filed."
                onClick={() => setCaseId("reference")}
              />
              <CaseChoice
                selected={caseId === "empty"}
                title="Empty"
                text="No zones, no hours. You file the first record."
                onClick={() => setCaseId("empty")}
              />
            </div>
          </fieldset>

          {error ? <p className="text-sm text-clay">{error}</p> : null}

          <button className="btn w-fit" type="submit" disabled={pending}>
            {pending ? "Opening…" : "Enter the case file"}
          </button>
        </form>
      </main>
    </div>
  );
}

function CaseChoice({
  selected,
  title,
  text,
  onClick,
}: {
  selected: boolean;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`border p-3 text-left ${selected ? "border-pine bg-moss" : "border-line bg-sheet"}`}
    >
      <div className="font-serif text-xl">{title}</div>
      <p className="mt-1 text-sm leading-5 text-muted">{text}</p>
    </button>
  );
}
