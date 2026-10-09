import type { PhaseStatus, ProjectPhaseSummary, SdlcPhaseKey } from "@/lib/types";

export interface SdlcPhaseMeta {
  key: SdlcPhaseKey;
  number: string;
  label: string;
  description: string;
  color: string;
}

// Blue → violet sweep around the cycle, closing back to blue at Maintenance.
export const SDLC_PHASES: SdlcPhaseMeta[] = [
  {
    key: "requirements",
    number: "01",
    label: "Requirements",
    description: "Gather and analyze user requirements and define scope.",
    color: "#2f6bff",
  },
  {
    key: "design",
    number: "02",
    label: "Design",
    description: "Create system architecture and detailed design.",
    color: "#4a63f7",
  },
  {
    key: "development",
    number: "03",
    label: "Development",
    description: "Build the application by writing clean, efficient code.",
    color: "#6a5cf6",
  },
  {
    key: "testing",
    number: "04",
    label: "Testing",
    description: "Test the application for bugs, errors and ensure quality.",
    color: "#8b55f2",
  },
  {
    key: "deployment",
    number: "05",
    label: "Deployment",
    description: "Release the application to the production environment.",
    color: "#a052ee",
  },
  {
    key: "maintenance",
    number: "06",
    label: "Maintenance",
    description: "Monitor, support and update the application regularly.",
    color: "#3d66fa",
  },
];

export const SDLC_PHASE_BY_KEY = Object.fromEntries(
  SDLC_PHASES.map((phase) => [phase.key, phase]),
) as Record<SdlcPhaseKey, SdlcPhaseMeta>;

export const PHASE_STATUS_LABELS: Record<PhaseStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  done: "Done",
};

export const PHASE_STATUS_VARIANTS: Record<PhaseStatus, "muted" | "default" | "success"> = {
  not_started: "muted",
  in_progress: "default",
  done: "success",
};

/** The phase the project is "in": first in-progress, else first not started, else the last. */
export function getCurrentPhaseKey(phases: ProjectPhaseSummary[]): SdlcPhaseKey | null {
  if (phases.length === 0) return null;
  const inProgress = phases.find((phase) => phase.status === "in_progress");
  if (inProgress) return inProgress.key;
  const next = phases.find((phase) => phase.status === "not_started");
  return (next ?? phases[phases.length - 1]).key;
}

export function countDonePhases(phases: ProjectPhaseSummary[]): number {
  return phases.filter((phase) => phase.status === "done").length;
}
