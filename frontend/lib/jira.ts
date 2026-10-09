import type { CardPriority, IssueType, KanbanCard } from "@/lib/types";

export const ISSUE_TYPES: { key: IssueType; label: string; color: string }[] = [
  { key: "task", label: "Task", color: "#4bade8" },
  { key: "story", label: "Story", color: "#63ba3c" },
  { key: "bug", label: "Bug", color: "#e5493a" },
];

export const ISSUE_TYPE_BY_KEY = Object.fromEntries(
  ISSUE_TYPES.map((type) => [type.key, type]),
) as Record<IssueType, (typeof ISSUE_TYPES)[number]>;

// Highest first, matching Jira's priority picker.
export const PRIORITIES: { key: CardPriority; label: string; color: string }[] = [
  { key: "highest", label: "Highest", color: "#cd1317" },
  { key: "high", label: "High", color: "#e9494a" },
  { key: "medium", label: "Medium", color: "#e97f33" },
  { key: "low", label: "Low", color: "#2d8738" },
  { key: "lowest", label: "Lowest", color: "#57a55a" },
];

export const PRIORITY_BY_KEY = Object.fromEntries(
  PRIORITIES.map((priority) => [priority.key, priority]),
) as Record<CardPriority, (typeof PRIORITIES)[number]>;

export const STORY_POINT_OPTIONS = [1, 2, 3, 5, 8, 13, 21];

const LABEL_PALETTE = ["#0c66e4", "#1f845a", "#a54800", "#6e5dc6", "#ae2e24", "#206a83", "#943d73"];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Chip colors for a tinted label: text is pulled toward the theme foreground so it stays readable in dark mode. */
export function tintedChipStyle(color: string) {
  return {
    color: `color-mix(in srgb, ${color} 55%, var(--foreground))`,
    backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`,
  };
}

/** Stable color per label text, so a label looks the same on every card. */
export function labelColor(label: string): string {
  return LABEL_PALETTE[hashString(label.toLowerCase()) % LABEL_PALETTE.length];
}

export function avatarInitials(email: string): string {
  const name = email.split("@")[0];
  const parts = name.split(/[._-]+/).filter(Boolean);
  const initials =
    parts.length >= 2 ? parts[0][0] + parts[1][0] : name.slice(0, 2);
  return initials.toUpperCase();
}

export function avatarColor(email: string): string {
  return LABEL_PALETTE[hashString(email) % LABEL_PALETTE.length];
}

export const RECENTLY_UPDATED_DAYS = 7;

export interface BoardFilters {
  search: string;
  onlyMine: boolean;
  recentlyUpdated: boolean;
  types: IssueType[];
  labels: string[];
}

export const EMPTY_FILTERS: BoardFilters = {
  search: "",
  onlyMine: false,
  recentlyUpdated: false,
  types: [],
  labels: [],
};

export function hasActiveFilters(filters: BoardFilters): boolean {
  return (
    filters.search.trim() !== "" ||
    filters.onlyMine ||
    filters.recentlyUpdated ||
    filters.types.length > 0 ||
    filters.labels.length > 0
  );
}

export function matchesFilters(
  card: KanbanCard,
  filters: BoardFilters,
  currentUserId: number | null,
): boolean {
  const query = filters.search.trim().toLowerCase();
  if (
    query &&
    !card.title.toLowerCase().includes(query) &&
    !card.issue_key.toLowerCase().includes(query)
  ) {
    return false;
  }
  if (filters.onlyMine && (currentUserId === null || card.assignee !== currentUserId)) {
    return false;
  }
  if (filters.recentlyUpdated) {
    const cutoff = Date.now() - RECENTLY_UPDATED_DAYS * 86400000;
    if (new Date(card.updated_at).getTime() < cutoff) return false;
  }
  if (filters.types.length > 0 && !filters.types.includes(card.issue_type)) {
    return false;
  }
  if (
    filters.labels.length > 0 &&
    !card.labels.some((label) => filters.labels.includes(label))
  ) {
    return false;
  }
  return true;
}
