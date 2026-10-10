"use client";

import { Avatar } from "@/components/kanban/jira-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queries";
import type { Project, User } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";

interface ProjectMembersProps {
  project: Project;
  currentUser: User | null;
  /** Called after the current user removes themselves from the project. */
  onLeft: () => void;
}

export function ProjectMembers({ project, currentUser, onLeft }: ProjectMembersProps) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const projectKey = queryKeys.projects.detail(project.id);
  const members = project.members ?? [];
  const isOwner = Boolean(project.is_owner);

  function setMembers(update: (members: User[]) => User[]) {
    queryClient.setQueryData<Project>(projectKey, (prev) =>
      prev && { ...prev, members: update(prev.members ?? []) },
    );
    // Membership decides who sees the linked board and can be assigned on it.
    void queryClient.invalidateQueries({ queryKey: queryKeys.boards.all, refetchType: "none" });
  }

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setError(null);
    setAdding(true);
    try {
      const member = await api.addProjectMember(project.id, trimmed);
      setMembers((prev) => [...prev.filter((user) => user.id !== member.id), member]);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add that person.");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(member: User) {
    const leaving = member.id === currentUser?.id;
    const prompt = leaving
      ? "Leave this project? You'll lose access to it and its board."
      : `Remove ${member.email} from this project? They'll lose access to its board too.`;
    if (!confirm(prompt)) return;
    await api.removeProjectMember(project.id, member.id);
    if (leaving) {
      onLeft();
      return;
    }
    setMembers((prev) => prev.filter((user) => user.id !== member.id));
  }

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)]">
        {project.owner && (
          <li className="flex items-center gap-3 px-3 py-2.5">
            <Avatar email={project.owner.email} size={28} />
            <span className="min-w-0 flex-1 truncate text-sm text-[var(--foreground)]">
              {project.owner.email}
            </span>
            <Badge variant="default">owner</Badge>
          </li>
        )}
        {members.map((member) => {
          const isSelf = member.id === currentUser?.id;
          return (
            <li key={member.id} className="flex items-center gap-3 px-3 py-2.5">
              <Avatar email={member.email} size={28} />
              <span className="min-w-0 flex-1 truncate text-sm text-[var(--foreground)]">
                {member.email}
                {isSelf && <span className="ml-1.5 text-xs text-[var(--muted)]">(you)</span>}
              </span>
              {(isOwner || isSelf) && (
                <Button
                  variant="ghost"
                  onClick={() => void handleRemove(member)}
                  className="shrink-0 px-2 py-1 text-xs text-red-600"
                >
                  {isSelf ? "Leave" : "Remove"}
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      {members.length === 0 && (
        <p className="font-mono text-xs text-[var(--muted)]">
          {isOwner ? "Only you can see this project so far." : "No other members yet."}
        </p>
      )}

      {isOwner && (
        <form onSubmit={handleAdd} className="flex flex-wrap items-start gap-2">
          <div className="min-w-[220px] flex-1">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@domain.com"
              aria-label="Member email"
              error={error ?? undefined}
            />
          </div>
          <Button type="submit" disabled={adding || !email.trim()}>
            {adding ? "Adding..." : "Add member"}
          </Button>
        </form>
      )}
      {isOwner && (
        <p className="font-mono text-[10px] text-[var(--muted)]">
          Members can work on this project and see its linked board. They need an account first.
        </p>
      )}
    </div>
  );
}
