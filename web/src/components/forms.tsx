"use client";

import { useState } from "react";

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Submit({
  children,
  disabled,
}: {
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button className="btn" type="submit" disabled={disabled}>
      {children}
    </button>
  );
}

export function QuietButton({
  children,
  onClick,
  type = "button",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button className="btn quiet" type={type} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="text-sm text-clay">{message}</p>;
}

export function useFormError() {
  const [message, setMessage] = useState<string | null>(null);
  return {
    message,
    async run(action: () => Promise<void>) {
      setMessage(null);
      try {
        await action();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "That could not be filed.");
      }
    },
  };
}
