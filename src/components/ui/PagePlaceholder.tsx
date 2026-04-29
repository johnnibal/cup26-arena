type PagePlaceholderProps = {
  title: string;
  description: string;
  step?: string;
};

/** Simple placeholder for routes still under construction (e.g. admin stubs). */
export function PagePlaceholder({ title, description, step }: PagePlaceholderProps) {
  return (
    <section className="rounded-xl border border-surface-border bg-surface p-8 shadow-sm backdrop-blur-sm">
      {step ? (
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-brand-accent">{step}</p>
      ) : null}
      <h1 className="text-2xl font-bold text-heading">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">{description}</p>
    </section>
  );
}
