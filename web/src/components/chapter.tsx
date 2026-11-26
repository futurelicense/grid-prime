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
  const active = sections.find((section) => section.id === current);
  return (
    <div>
      <p className="kicker">Step {number} of 4</p>
      <h1 className="mt-2 font-serif text-5xl leading-none">{title}</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8">{lede}</p>
      {sections.length > 1 ? (
        <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label={title}>
          {sections.map((section) => {
            const selected = current === section.id;
            return (
              <button
                key={section.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onChange(section.id)}
                className={selected ? "btn" : "btn quiet"}
              >
                {section.label}
              </button>
            );
          })}
        </div>
      ) : null}
      {active ? <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{active.detail}</p> : null}
      <div className="mt-8 min-w-0">{children}</div>
    </div>
  );
}
