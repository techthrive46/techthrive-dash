"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SDLC_PHASES } from "@/lib/sdlc";
import type { Board, CurrentPhase, Project } from "@/lib/types";
import { FormEvent, useState } from "react";

interface ProjectFormProps {
  initial?: Partial<Project>;
  boards?: Board[];
  /** Only a project's owner can change which board it shares with members. */
  canChangeBoard?: boolean;
  onSubmit: (data: {
    name: string;
    description: string;
    current_phase: CurrentPhase;
    due_date: string | null;
    board: string | null;
  }) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export function ProjectForm({
  initial,
  boards = [],
  canChangeBoard = true,
  onSubmit,
  onCancel,
  submitLabel = "Save",
}: ProjectFormProps) {
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [currentPhase, setCurrentPhase] = useState<CurrentPhase>(
    initial?.current_phase || "requirements",
  );
  const [dueDate, setDueDate] = useState(initial?.due_date || "");
  const [boardId, setBoardId] = useState(initial?.board || "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        name,
        description,
        current_phase: currentPhase,
        due_date: dueDate || null,
        board: boardId || null,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Textarea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
      />
      <div className="space-y-1.5">
        <Select
          label="SDLC phase"
          value={currentPhase}
          onChange={(e) => setCurrentPhase(e.target.value as CurrentPhase)}
        >
          {SDLC_PHASES.map((phase) => (
            <option key={phase.key} value={phase.key}>
              {phase.number} · {phase.label}
            </option>
          ))}
          <option value="completed">All phases complete</option>
        </Select>
        <p className="font-mono text-[10px] text-[var(--muted)]">
          Earlier phases are marked done, this one in progress.
        </p>
      </div>
      <Input
        label="Due date"
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />
      {boards.length > 0 && (
        <div className="space-y-1.5">
          <Select
            label="Linked board"
            value={boardId}
            onChange={(e) => setBoardId(e.target.value)}
            disabled={!canChangeBoard}
          >
            <option value="">None</option>
            {boards.map((board) => (
              <option key={board.id} value={board.id}>
                {board.title}
              </option>
            ))}
          </Select>
          <p className="font-mono text-[10px] text-[var(--muted)]">
            {canChangeBoard
              ? "Project members can also see the linked board."
              : "Only the project owner can change the linked board."}
          </p>
        </div>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
