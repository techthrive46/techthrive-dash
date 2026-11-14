"use client";

import { UsersIcon } from "@/components/icons/nav-icons";
import { Avatar } from "@/components/kanban/jira-icons";
import { PAGE_CONTAINER, PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError } from "@/lib/api";
import { queryKeys, useCurrentUser, useManagedUsers } from "@/lib/queries";
import type { ManagedUser, UserStatus } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

type Filter = UserStatus | "all";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

const STATUS_BADGE: Record<UserStatus, { label: string; variant: "warning" | "success" | "danger" }> = {
  pending: { label: "Pending", variant: "warning" },
  approved: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "danger" },
};

const EMPTY_MESSAGES: Record<Filter, string> = {
  pending: "Nobody is waiting for approval.",
  approved: "No approved accounts.",
  rejected: "No rejected accounts.",
  all: "No accounts yet.",
};

function isFilter(value: string | null): value is Filter {
  return FILTERS.some((filter) => filter.key === value);
}

export default function UsersPage() {
  // useSearchParams needs a Suspense boundary on statically rendered pages.
  return (
    <Suspense>
      <UsersPageContent />
    </Suspense>
  );
}

function UsersPageContent() {
  const { data: me, isPending: loadingMe } = useCurrentUser();
  const isAdmin = Boolean(me?.is_staff);

  const router = useRouter();
  const pathname = usePathname();
  const statusParam = useSearchParams().get("status");
  const filter: Filter = isFilter(statusParam) ? statusParam : "pending";

  const { data, isPending: loadingUsers, error } = useManagedUsers(filter, { enabled: isAdmin });
  const users = data?.results ?? [];
  const counts = data?.counts;

  function selectFilter(next: Filter) {
    router.replace(`${pathname}?status=${next}`, { scroll: false });
  }

  return (
    <>
      <PageHeader
        title="Users"
        description="Everyone who signs up waits here until an admin approves them. Approve your teammates; reject anyone you don't recognise."
      />
      <div className={cn(PAGE_CONTAINER, "pb-12")}>
        {loadingMe ? (
          <Skeleton className="h-64 rounded-[22px]" />
        ) : !isAdmin ? (
          <div className="panel flex flex-col items-center justify-center border-dashed py-20 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--ink)] text-[var(--ink-fg)]">
              <UsersIcon className="h-5 w-5" />
            </span>
            <p className="mt-4 text-lg font-semibold">Admins only</p>
            <p className="mt-1 max-w-sm text-sm text-[var(--muted)]">
              Ask a workspace admin if you need to manage who has access.
            </p>
          </div>
        ) : (
          <>
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
              {FILTERS.map(({ key, label }) => {
                const active = filter === key;
                const count =
                  counts && (key === "all" ? counts.pending + counts.approved + counts.rejected : counts[key]);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => selectFilter(key)}
                    aria-pressed={active}
                    className={cn(
                      "chip shrink-0",
                      active && "border-transparent bg-[var(--ink)] text-[var(--ink-fg)] hover:text-[var(--ink-fg)]",
                    )}
                  >
                    {key === "pending" && counts && counts.pending > 0 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                    )}
                    {label}
                    {counts !== undefined && (
                      <span className={cn("font-mono text-[10px]", active ? "opacity-70" : "text-[var(--muted-light)]")}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {error ? (
              <p className="panel mt-4 py-12 text-center text-sm text-red-500">
                {error instanceof ApiError ? error.message : "Couldn't load users."}
              </p>
            ) : loadingUsers ? (
              <div className="mt-4 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-[72px] rounded-[18px]" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <p className="panel mt-4 py-12 text-center text-sm text-[var(--muted)]">
                {EMPTY_MESSAGES[filter]}
              </p>
            ) : (
              <ul className="panel mt-4 divide-y divide-[var(--border)] overflow-hidden p-0">
                {users.map((user) => (
                  <UserRow key={user.id} user={user} isSelf={user.id === me?.id} />
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </>
  );
}

function reviewNote(user: ManagedUser): string | null {
  if (!user.reviewed_at) return null;
  const verb = user.status === "approved" ? "Approved" : "Rejected";
  const by = user.reviewed_by ? ` by ${user.reviewed_by.email}` : "";
  return `${verb}${by} · ${formatDateTime(user.reviewed_at)}`;
}

function UserRow({ user, isSelf }: { user: ManagedUser; isSelf: boolean }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState<"approved" | "rejected" | null>(null);
  const [error, setError] = useState("");
  const badge = STATUS_BADGE[user.status];
  const note = reviewNote(user);

  async function review(status: "approved" | "rejected") {
    if (
      status === "rejected" &&
      user.status === "approved" &&
      !window.confirm(`Remove ${user.email}'s access? They'll be signed out right away.`)
    ) {
      return;
    }
    setSaving(status);
    setError("");
    try {
      await api.reviewUser(user.id, status);
      await queryClient.invalidateQueries({ queryKey: queryKeys.managedUsers.all });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update this account.");
    } finally {
      setSaving(null);
    }
  }

  // Admins can't lock themselves (or other admins) out from here.
  const canReject = !isSelf && !user.is_staff && user.status !== "rejected";
  const canApprove = !isSelf && user.status !== "approved";

  return (
    <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 md:px-5">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar email={user.email} size={36} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-medium text-[var(--foreground)]">{user.email}</span>
            <Badge variant={badge.variant}>{badge.label}</Badge>
            {user.is_staff && <Badge>Admin</Badge>}
            {isSelf && <Badge variant="muted">You</Badge>}
          </div>
          <p className="mt-0.5 font-mono text-[11px] text-[var(--muted)]">
            Signed up {formatDateTime(user.date_joined)}
            {note && <span className="text-[var(--muted-light)]"> · {note}</span>}
          </p>
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
      </div>

      {(canApprove || canReject) && (
        <div className="flex shrink-0 gap-2 sm:justify-end">
          {canApprove && (
            <Button
              variant={user.status === "pending" ? "primary" : "secondary"}
              onClick={() => review("approved")}
              disabled={saving !== null}
            >
              {saving === "approved" ? "Approving…" : "Approve"}
            </Button>
          )}
          {canReject && (
            <Button
              variant={user.status === "pending" ? "secondary" : "ghost"}
              onClick={() => review("rejected")}
              disabled={saving !== null}
              className="text-red-500 hover:text-red-600"
            >
              {saving === "rejected"
                ? "Saving…"
                : user.status === "pending"
                  ? "Reject"
                  : "Remove access"}
            </Button>
          )}
        </div>
      )}
    </li>
  );
}
