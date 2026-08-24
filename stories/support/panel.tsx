import type { ReactNode } from "react";

/**
 * A labelled read-only panel shown next to a component, so what the component
 * reports through its callbacks is visible while clicking around.
 *
 * The label is a styled `div` rather than a heading: it names showcase chrome,
 * and a heading here would inject structure into a story whose subject may be
 * a Markdown document with headings of its own.
 */
export function Panel({
  title,
  testId,
  children,
}: {
  readonly title: string;
  readonly testId: string;
  readonly children: ReactNode;
}) {
  return (
    <section aria-label={title} className="flex min-w-0 flex-col gap-2">
      <div className="font-heading text-oe-dark text-xs font-semibold tracking-wide uppercase">
        {title}
      </div>
      <pre
        data-testid={testId}
        className="bg-muted/40 text-foreground min-h-[120px] overflow-x-auto rounded-md border p-3 font-mono text-xs whitespace-pre-wrap"
      >
        {children}
      </pre>
    </section>
  );
}

/** Two-column layout pairing a component with its {@link Panel}. */
export function SplitLayout({ children }: { readonly children: ReactNode }) {
  return <div className="grid items-start gap-6 md:grid-cols-2">{children}</div>;
}
