import Link from "next/link";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
  /** Small chips rendered inline after the title. */
  tags?: ReactNode;
}

export function PageHeader({ title, description, actions, back, tags }: PageHeaderProps) {
  return (
    <header className="px-6 pb-2 pt-8 md:px-8">
      {back && (
        <Link
          href={back.href}
          className="group mb-4 inline-flex items-center gap-1.5 font-mono text-xs text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
        >
          <span aria-hidden className="transition-transform group-hover:-translate-x-0.5">
            ←
          </span>
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="tech-label">{title.toLowerCase().replace(/\s+/g, "_")}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              {title}
            </h1>
            {tags && <div className="flex flex-wrap items-center gap-1.5">{tags}</div>}
          </div>
          {description && (
            <div className="mt-1 max-w-4xl text-sm text-[var(--muted)]">{description}</div>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
