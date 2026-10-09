import { ISSUE_TYPE_BY_KEY, PRIORITY_BY_KEY, avatarColor, avatarInitials } from "@/lib/jira";
import type { CardPriority, IssueType } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function IssueTypeIcon({ type, className, ...props }: IconProps & { type: IssueType }) {
  const { color, label } = ISSUE_TYPE_BY_KEY[type];
  return (
    <svg viewBox="0 0 16 16" className={cn("h-4 w-4 shrink-0", className)} role="img" aria-label={label} {...props}>
      <rect width="16" height="16" rx="3" fill={color} />
      {type === "task" && (
        <path d="m4.5 8.2 2.3 2.3 4.7-5" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {type === "story" && <path d="M5 3.5h6v9l-3-2.2-3 2.2v-9Z" fill="#fff" />}
      {type === "bug" && <circle cx="8" cy="8" r="3.3" fill="#fff" />}
    </svg>
  );
}

export function PriorityIcon({ priority, className, ...props }: IconProps & { priority: CardPriority }) {
  const { color, label } = PRIORITY_BY_KEY[priority];
  const stroke = {
    fill: "none",
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg viewBox="0 0 16 16" className={cn("h-4 w-4 shrink-0", className)} role="img" aria-label={`${label} priority`} {...props}>
      {priority === "highest" && (
        <>
          <path d="m3.5 8 4.5-4 4.5 4" {...stroke} />
          <path d="m3.5 12.5 4.5-4 4.5 4" {...stroke} />
        </>
      )}
      {priority === "high" && <path d="m3.5 10.5 4.5-4.5 4.5 4.5" {...stroke} />}
      {priority === "medium" && (
        <>
          <path d="M3.5 6.5h9" {...stroke} />
          <path d="M3.5 10h9" {...stroke} />
        </>
      )}
      {priority === "low" && <path d="m3.5 6 4.5 4.5 4.5-4.5" {...stroke} />}
      {priority === "lowest" && (
        <>
          <path d="m3.5 3.5 4.5 4 4.5-4" {...stroke} />
          <path d="m3.5 8 4.5 4 4.5-4" {...stroke} />
        </>
      )}
    </svg>
  );
}

export function Avatar({
  email,
  size = 24,
  className,
}: {
  email: string | null;
  size?: number;
  className?: string;
}) {
  if (!email) {
    return (
      <span
        title="Unassigned"
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full border border-dashed border-[var(--border-strong)] text-[var(--muted-light)]",
          className,
        )}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 16 16" className="h-[60%] w-[60%]" fill="currentColor" aria-hidden>
          <circle cx="8" cy="5.5" r="3" />
          <path d="M2.5 14a5.5 5.5 0 0 1 11 0Z" />
        </svg>
      </span>
    );
  }
  return (
    <span
      title={email}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.42),
        backgroundColor: avatarColor(email),
      }}
    >
      {avatarInitials(email)}
    </span>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <circle cx="7" cy="7" r="4.5" />
      <path strokeLinecap="round" d="m10.5 10.5 3 3" />
    </svg>
  );
}

export function CommentIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path strokeLinejoin="round" d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2v-7Z" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <circle cx="8" cy="8" r="5.5" />
      <path strokeLinecap="round" d="M8 5v3l2 1.5" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4 6 4 4 4-4" />
    </svg>
  );
}
