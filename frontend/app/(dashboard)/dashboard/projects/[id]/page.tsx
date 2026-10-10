"use client";

import { PageHeader } from "@/components/layout/page-header";
import { MilestoneList } from "@/components/projects/milestone-list";
import { PhasePanel } from "@/components/projects/phase-panel";
import { ProjectForm } from "@/components/projects/project-form";
import { SdlcCycle } from "@/components/projects/sdlc-cycle";
import { KanbanIcon } from "@/components/icons/nav-icons";
import { SdlcPhaseIcon } from "@/components/projects/sdlc-icons";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { CollapsibleText } from "@/components/ui/collapsible-text";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import { queryKeys, useBoards, useCurrentUser, useProject } from "@/lib/queries";
import { SDLC_PHASE_BY_KEY, countDonePhases, getCurrentPhaseKey } from "@/lib/sdlc";
import type {
  CurrentPhase,
  Milestone,
  Project,
  ProjectPhase,
  ProjectStatus,
  SdlcPhaseKey,
} from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

const STATUS_VARIANTS: Record<ProjectStatus, "default" | "success" | "warning" | "muted"> = {
  planning: "muted",
  active: "default",
  on_hold: "warning",
  completed: "success",
};

const BACK_TO_PROJECTS = { href: "/dashboard/projects", label: "Back to projects" };

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectKey = queryKeys.projects.detail(params.id);
  const { data: project, isPending: loading } = useProject(params.id);
  const { data: boards = [] } = useBoards();
  const { data: currentUser = null } = useCurrentUser();
  const [editOpen, setEditOpen] = useState(false);
  const [selectedPhaseKey, setSelectedPhaseKey] = useState<SdlcPhaseKey | null>(null);

  // Open on the project's current phase once it has loaded; after that the
  // selection only changes when the user picks a phase.
  const initialPhaseKey = project
    ? getCurrentPhaseKey((project.phases ?? []) as ProjectPhase[])
    : null;
  if (selectedPhaseKey === null && initialPhaseKey) {
    setSelectedPhaseKey(initialPhaseKey);
  }

  // Milestones show up as cards on a linked board, and project changes feed
  // the projects list and dashboard, so mark those stale too, without
  // refetching them now. Only the project itself is refetched.
  function markRelatedStale() {
    for (const queryKey of [queryKeys.projects.list(), queryKeys.boards.all, queryKeys.dashboard]) {
      void queryClient.invalidateQueries({ queryKey, refetchType: "none" });
    }
  }

  async function refreshProject() {
    markRelatedStale();
    await queryClient.invalidateQueries({ queryKey: projectKey });
  }

  async function handleUpdate(data: {
    name: string;
    description: string;
    current_phase: CurrentPhase;
    due_date: string | null;
    board: string | null;
  }) {
    await api.updateProject(params.id, data);
    setEditOpen(false);
    await refreshProject();
  }

  async function handleDelete() {
    if (!confirm("Delete this project?")) return;
    await api.deleteProject(params.id);
    queryClient.removeQueries({ queryKey: projectKey });
    markRelatedStale();
    router.push("/dashboard/projects");
  }

  async function handleCreateMilestone(data: {
    title: string;
    target_date: string | null;
    phase: string | null;
  }) {
    await api.createMilestone(params.id, data);
    await refreshProject();
  }

  async function handleToggleMilestone(milestone: Milestone) {
    await api.updateMilestone(params.id, milestone.id, {
      completed: !milestone.completed,
    });
    await refreshProject();
  }

  function handlePhaseUpdated(updated: ProjectPhase) {
    const previous = ((project?.phases ?? []) as ProjectPhase[]).find(
      (phase) => phase.key === updated.key,
    );
    queryClient.setQueryData<Project>(projectKey, (prev) =>
      prev && {
        ...prev,
        phases: ((prev.phases ?? []) as ProjectPhase[]).map((phase) =>
          phase.key === updated.key ? updated : phase,
        ),
      },
    );
    // Project status and current phase are derived from the phases server-side.
    if (updated.status !== previous?.status) {
      void refreshProject();
    }
  }

  async function handleDeleteMilestone(milestoneId: string) {
    await api.deleteMilestone(params.id, milestoneId);
    await refreshProject();
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Project" back={BACK_TO_PROJECTS} />
        <div className="px-6 pb-10 font-mono text-sm text-[var(--muted)] md:px-8">
          loading...
        </div>
      </>
    );
  }

  if (!project) {
    return (
      <>
        <PageHeader title="Project" back={BACK_TO_PROJECTS} />
        <div className="px-6 pb-10 text-sm text-red-500 md:px-8">Project not found.</div>
      </>
    );
  }

  const phases = (project.phases ?? []) as ProjectPhase[];
  const milestones = project.milestones ?? [];
  const selectedPhase = phases.find((phase) => phase.key === selectedPhaseKey) ?? null;
  const currentPhaseKey = getCurrentPhaseKey(phases);
  const currentPhaseMeta = currentPhaseKey ? SDLC_PHASE_BY_KEY[currentPhaseKey] : null;
  const overdue =
    Boolean(project.due_date) &&
    project.status !== "completed" &&
    new Date(`${project.due_date}T23:59:59`) < new Date();

  return (
    <>
      <PageHeader
        back={BACK_TO_PROJECTS}
        title={project.name}
        tags={
          <>
            <Badge variant={STATUS_VARIANTS[project.status]}>
              {project.status.replace("_", " ")}
            </Badge>
            {currentPhaseMeta && (
              <button
                type="button"
                onClick={() => setSelectedPhaseKey(currentPhaseMeta.key)}
                title="Show current phase"
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide ring-1 transition-opacity hover:opacity-80"
                style={{
                  color: currentPhaseMeta.color,
                  backgroundColor: `color-mix(in srgb, ${currentPhaseMeta.color} 14%, transparent)`,
                  ["--tw-ring-color" as string]: `color-mix(in srgb, ${currentPhaseMeta.color} 30%, transparent)`,
                }}
              >
                <SdlcPhaseIcon phase={currentPhaseMeta.key} className="h-3 w-3" />
                {currentPhaseMeta.label}
                <span className="opacity-70">
                  {countDonePhases(phases)}/{phases.length}
                </span>
              </button>
            )}
            {project.due_date && (
              <Badge variant={overdue ? "danger" : "muted"}>
                {overdue ? "overdue · " : "due "}
                {formatDate(project.due_date)}
              </Badge>
            )}
            {project.board_id && (
              <Link href={`/dashboard/kanban/${project.board_id}`} title="Open linked board">
                <Badge variant="muted" className="gap-1.5 hover:text-[var(--accent)]">
                  <KanbanIcon className="h-3 w-3" />
                  {project.board_title || "Board"}
                </Badge>
              </Link>
            )}
          </>
        }
        description={<CollapsibleText text={project.description || "Project details"} />}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger aria-label="Project actions" />
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setEditOpen(true)}>Edit project</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onClick={handleDelete}>
                Delete project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />
      <div className="space-y-6 px-6 pb-10 md:px-8">
        <Card>
          <CardTitle>Lifecycle</CardTitle>
          <CardDescription>
            Click a phase to see its notes, milestones and updates.
          </CardDescription>
          <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <div className="xl:sticky xl:top-6 xl:self-start">
              <SdlcCycle
                phases={phases}
                selectedKey={selectedPhaseKey}
                onSelect={setSelectedPhaseKey}
              />
            </div>
            <div className="border-t border-[var(--border)] pt-6 xl:border-l xl:border-t-0 xl:pl-8 xl:pt-0">
              <AnimatePresence mode="wait">
                {selectedPhase && (
                  <motion.div
                    key={selectedPhase.key}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <PhasePanel
                      projectId={params.id}
                      phase={selectedPhase}
                      milestones={milestones.filter(
                        (milestone) => milestone.phase === selectedPhase.id,
                      )}
                      currentUser={currentUser}
                      onPhaseUpdated={handlePhaseUpdated}
                      onCreateMilestone={handleCreateMilestone}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>Milestones</CardTitle>
          <CardDescription>Track key deliverables for this project.</CardDescription>
          <div className="mt-4">
            <MilestoneList
              projectId={params.id}
              milestones={milestones}
              phases={phases}
              currentUser={currentUser}
              boardLinked={Boolean(project.board_id)}
              onCreate={handleCreateMilestone}
              onToggle={project.board_id ? undefined : handleToggleMilestone}
              onDelete={handleDeleteMilestone}
            />
          </div>
        </Card>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit project">
        <ProjectForm
          initial={project}
          boards={boards}
          onSubmit={handleUpdate}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>
    </>
  );
}
