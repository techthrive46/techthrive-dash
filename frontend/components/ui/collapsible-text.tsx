"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

/** Clamps text to a couple of lines, with a toggle shown only when it actually overflows. */
export function CollapsibleText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      if (!expanded) setOverflowing(el.scrollHeight > el.clientHeight + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, expanded]);

  return (
    <div className={className}>
      <p ref={ref} className={cn("whitespace-pre-line", !expanded && "line-clamp-2")}>
        {text}
      </p>
      {(overflowing || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="mt-1 font-mono text-xs text-[var(--accent)] underline-offset-4 hover:underline"
        >
          {expanded ? "show less" : "show more"}
        </button>
      )}
    </div>
  );
}
