"use client";

export function Chapter({
  number,
  title,
  lede,
  sections,
  current,
  onChange,
  children,
}: {
  number: string;
  title: string;
  lede: string;
  sections: { id: string; label: string; detail: string }[];
  current: string;
  onChange: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="grid items-start gap-12 lg:grid-cols-[240px_minmax(0,1fr)]">
      <div>
        <p className="kicker">Stage {number}</p>
        <h1 className="mt-2 font-serif text-5xl leading-none">{title}</h1>
        <p className="mt-4 text-sm leading-6 text-muted">{lede}</p>
        <div className="mt-8 border-t border-line">
          {sections.map((section, index) => (
            <button
              key={section.id}
              type="button"
              onClick={() => onChange(section.id)}
              className={`block w-full border-b border-line py-3 text-left ${current === section.id ? "text-pine" : ""}`}
            >
              <div className="text-xs text-muted">0{index + 1}</div>
              <div className="font-serif text-xl">{section.label}</div>
              <div className="text-sm text-muted">{section.detail}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
