"use client";

import { CheckIcon, SdlcPhaseIcon } from "@/components/projects/sdlc-icons";
import {
  PHASE_STATUS_LABELS,
  SDLC_PHASES,
  countDonePhases,
  getCurrentPhaseKey,
} from "@/lib/sdlc";
import type { PhaseStatus, ProjectPhaseSummary, SdlcPhaseKey } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useId } from "react";

interface SdlcCycleProps {
  phases: ProjectPhaseSummary[];
  selectedKey: SdlcPhaseKey | null;
  onSelect: (key: SdlcPhaseKey) => void;
}

// Geometry in % of the (square) diagram. Nodes sit on a ring, clockwise from 12 o'clock.
const RING_RADIUS = 36;
const NODE_SIZE = 24;
const ARROW_GAP_DEG = 22;

function polar(angleDeg: number, radius = RING_RADIUS) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: 50 + radius * Math.cos(rad), y: 50 + radius * Math.sin(rad) };
}

function nodeAngle(index: number) {
  return -90 + index * 60;
}

function phaseRingColor(color: string, status: PhaseStatus) {
  return status === "not_started"
    ? `color-mix(in srgb, ${color} 35%, var(--border))`
    : color;
}

export function SdlcCycle({ phases, selectedKey, onSelect }: SdlcCycleProps) {
  const markerPrefix = `sdlc-arrow-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  const statusByKey = new Map(phases.map((phase) => [phase.key, phase.status]));
  const currentKey = getCurrentPhaseKey(phases);
  const doneCount = countDonePhases(phases);

  return (
    <div className="@container">
      {/* Circular diagram */}
      <div className="relative mx-auto hidden aspect-square w-full max-w-[560px] [container-type:inline-size] @md:block">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          <defs>
            {SDLC_PHASES.map((phase) => (
              <marker
                key={phase.key}
                id={`${markerPrefix}-${phase.key}`}
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="3"
                markerHeight="3"
                orient="auto"
              >
                <path d="M0 0 L10 5 L0 10 Z" fill={phase.color} />
              </marker>
            ))}
          </defs>

          <circle
            cx="50"
            cy="50"
            r={RING_RADIUS}
            fill="none"
            stroke="var(--border-strong)"
            strokeWidth="0.25"
            strokeDasharray="0.8 1.2"
          />

          {SDLC_PHASES.map((phase, index) => {
            const start = polar(nodeAngle(index) + ARROW_GAP_DEG);
            const end = polar(nodeAngle(index + 1) - ARROW_GAP_DEG);
            const done = statusByKey.get(phase.key) === "done";
            return (
              <g key={phase.key} opacity={done ? 1 : 0.35}>
                <path
                  d={`M ${start.x} ${start.y} A ${RING_RADIUS} ${RING_RADIUS} 0 0 1 ${end.x} ${end.y}`}
                  fill="none"
                  stroke={phase.color}
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  markerEnd={`url(#${markerPrefix}-${phase.key})`}
                />
              </g>
            );
          })}
        </svg>

        {/* Center label */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 w-[34%] -translate-x-1/2 -translate-y-1/2 text-center">
          <p className="text-[clamp(28px,9cqw,52px)] font-bold leading-none tracking-tight text-[var(--foreground)]">
            SDLC
          </p>
          <p className="mt-[1.5cqw] font-mono text-[clamp(8px,1.8cqw,11px)] uppercase tracking-widest text-[var(--muted)]">
            Software development life cycle
          </p>
          <div className="mt-[2.5cqw] flex justify-center gap-[1cqw]">
            {SDLC_PHASES.map((phase) => (
              <span
                key={phase.key}
                className="h-[3px] w-[3.5cqw] rounded-full transition-opacity"
                style={{
                  backgroundColor: phase.color,
                  opacity: statusByKey.get(phase.key) === "done" ? 1 : 0.25,
                }}
              />
            ))}
          </div>
          <p className="mt-[2cqw] font-mono text-[clamp(9px,1.9cqw,12px)] text-[var(--muted)]">
            {doneCount}/{SDLC_PHASES.length} phases done
          </p>
        </div>

        {/* Phase nodes */}
        {SDLC_PHASES.map((phase, index) => {
          const status = statusByKey.get(phase.key) ?? "not_started";
          const selected = selectedKey === phase.key;
          const center = polar(nodeAngle(index));
          const ringColor = phaseRingColor(phase.color, status);

          return (
            <motion.button
              key={phase.key}
              type="button"
              onClick={() => onSelect(phase.key)}
              aria-pressed={selected}
              aria-label={`${phase.label}: ${PHASE_STATUS_LABELS[status]}`}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: selected ? 1.06 : 1 }}
              whileHover={{ scale: selected ? 1.06 : 1.04 }}
              transition={{ duration: 0.3, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
              className="absolute flex aspect-square flex-col items-center justify-center rounded-full bg-[var(--surface)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
              style={{
                left: `${center.x - NODE_SIZE / 2}%`,
                top: `${center.y - NODE_SIZE / 2}%`,
                width: `${NODE_SIZE}%`,
                border: `2px solid ${ringColor}`,
                boxShadow: selected
                  ? `0 0 0 5px color-mix(in srgb, ${phase.color} 18%, transparent), 0 12px 32px -12px ${phase.color}`
                  : "0 4px 14px -6px rgba(12, 18, 34, 0.15)",
              }}
            >
              {status === "in_progress" && (
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-full"
                  style={{ border: `2px solid ${phase.color}` }}
                  animate={{ scale: [1, 1.14], opacity: [0.6, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                />
              )}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-[6%] rounded-full border border-dashed border-[var(--border)]"
              />
              <SdlcPhaseIcon
                phase={phase.key}
                className="h-[28%] w-[28%]"
                style={{ color: status === "not_started" ? "var(--muted)" : phase.color }}
              />
              <span
                className="mt-[5%] text-[clamp(9px,2.1cqw,13px)] font-bold uppercase tracking-wide"
                style={{ color: status === "not_started" ? "var(--muted)" : phase.color }}
              >
                {phase.label}
              </span>
              <span className="mt-[2%] font-mono text-[clamp(8px,1.6cqw,10px)] text-[var(--muted)]">
                {PHASE_STATUS_LABELS[status]}
              </span>
            </motion.button>
          );
        })}

        {/* Number badges, on each node's outer edge (facing away from the center) */}
        {SDLC_PHASES.map((phase, index) => {
          const status = statusByKey.get(phase.key) ?? "not_started";
          const position = polar(nodeAngle(index), RING_RADIUS + NODE_SIZE / 2);
          return (
            <span
              key={phase.key}
              aria-hidden
              className="pointer-events-none absolute flex h-[6cqw] max-h-8 min-h-6 w-[6cqw] min-w-6 max-w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-mono text-[clamp(9px,1.9cqw,12px)] font-bold text-white ring-[3px] ring-[var(--surface)]"
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                backgroundColor: phaseRingColor(phase.color, status),
              }}
            >
              {status === "done" ? <CheckIcon className="h-1/2 w-1/2" /> : phase.number}
            </span>
          );
        })}
      </div>

      {/* Compact stepper for narrow containers */}
      <ol className="space-y-1.5 @md:hidden">
        {SDLC_PHASES.map((phase) => {
          const status = statusByKey.get(phase.key) ?? "not_started";
          const selected = selectedKey === phase.key;
          return (
            <li key={phase.key}>
              <button
                type="button"
                onClick={() => onSelect(phase.key)}
                aria-pressed={selected}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                  selected
                    ? "bg-[var(--surface-hover)]"
                    : "border-[var(--border)] hover:bg-[var(--surface-hover)]",
                )}
                style={selected ? { borderColor: phase.color } : undefined}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold text-white"
                  style={{ backgroundColor: phaseRingColor(phase.color, status) }}
                >
                  {status === "done" ? <CheckIcon className="h-4 w-4" /> : phase.number}
                </span>
                <SdlcPhaseIcon
                  phase={phase.key}
                  className="h-5 w-5 shrink-0"
                  style={{ color: status === "not_started" ? "var(--muted)" : phase.color }}
                />
                <span className="min-w-0 flex-1 text-sm font-semibold text-[var(--foreground)]">
                  {phase.label}
                  {currentKey === phase.key && (
                    <span className="ml-2 font-mono text-[10px] font-normal uppercase tracking-wider text-[var(--accent)]">
                      current
                    </span>
                  )}
                </span>
                <span className="font-mono text-[10px] text-[var(--muted)]">
                  {PHASE_STATUS_LABELS[status]}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
