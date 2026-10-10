"use client";

import { MilestoneProgressBar } from "@/components/projects/milestone-progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { SDLC_PHASES, SDLC_PHASE_BY_KEY, getCurrentPhaseKey } from "@/lib/sdlc";
import type { Project, ProjectPhaseSummary, ProjectStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

const statusVariant: Record<ProjectStatus, "default" | "success" | "warning" | "muted"> = {
  planning: "muted",
  active: "default",
  on_hold: "warning",
  completed: "success",
};

const statusLabel: Record<ProjectStatus, string> = {
  planning: "planning",
  active: "active",
  on_hold: "on_hold",
  completed: "done",
};

function PhaseStrip({ phases }: { phases: ProjectPhaseSummary[] }) {
  const statusByKey = new Map(phases.map((phase) => [phase.key, phase.status]));
  const currentKey = getCurrentPhaseKey(phases);
  const current = currentKey ? SDLC_PHASE_BY_KEY[currentKey] : null;

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="tech-label">sdlc</span>
        {current && (
          <span className="font-mono text-[10px] font-medium" style={{ color: current.color }}>
            {current.number} · {current.label}
          </span>
        )}
      </div>
      <div className="mt-1.5 flex gap-1" aria-hidden>
        {SDLC_PHASES.map((phase) => {
          const status = statusByKey.get(phase.key) ?? "not_started";
          return (
            <span
              key={phase.key}
              title={`${phase.label}: ${status.replace("_", " ")}`}
              className="h-1.5 flex-1 rounded-full"
              style={{
                backgroundColor:
                  status === "not_started" ? "var(--surface-subtle)" : phase.color,
                opacity: status === "in_progress" ? 0.45 : 1,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export function ProjectCard({
  project,
  index = 0,
}: {
  project: Project;
  index?: number;
}) {
  const milestoneCount = project.milestone_count ?? 0;
  const counts = {
    total: milestoneCount,
    todo: project.todo_milestone_count ?? 0,
    in_progress: project.in_progress_milestone_count ?? 0,
    done: project.done_milestone_count ?? project.completed_milestone_count ?? 0,
  };

  return (
    <Link href={`/dashboard/projects/${project.id}`}>
      <Card hover delay={index * 0.05} className="tech-frame">
        <div className="flex items-start justify-between gap-3">
          <CardTitle>{project.name}</CardTitle>
          <div className="flex shrink-0 gap-1.5">
            {project.is_owner === false && (
              <Badge variant="muted" title={`Shared by ${project.owner?.email ?? "another user"}`}>
                shared
              </Badge>
            )}
            <Badge variant={statusVariant[project.status]}>
              {statusLabel[project.status]}
            </Badge>
          </div>
        </div>
        {project.description && (
          <CardDescription className="line-clamp-2 normal-case">
            {project.description}
          </CardDescription>
        )}

        {project.phases && project.phases.length > 0 && (
          <div className="mt-4">
            <PhaseStrip phases={project.phases} />
          </div>
        )}

        <div className="mt-4">
          {milestoneCount > 0 ? (
            <MilestoneProgressBar counts={counts} showLegend />
          ) : (
            <p className="font-mono text-[10px] text-[var(--muted)]">No milestones yet</p>
          )}
        </div>

        <p className="mt-3 font-mono text-[10px] text-[var(--muted-light)]">
          due::{formatDate(project.due_date)}
        </p>
      </Card>
    </Link>
  );
}
