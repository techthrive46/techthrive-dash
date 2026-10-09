"use client";

import { DocToolbar } from "@/components/docs/doc-toolbar";
import { DocIcon } from "@/components/docs/doc-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import type { Doc } from "@/lib/types";
import { cn } from "@/lib/utils";
import Highlight from "@tiptap/extension-highlight";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import TextAlign from "@tiptap/extension-text-align";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type SaveStatus = "saved" | "pending" | "saving" | "error";
type DocPatch = Parameters<typeof api.updateDoc>[1];

const AUTOSAVE_DELAY_MS = 800;

export function DocEditor({ doc }: { doc: Doc }) {
  const router = useRouter();
  const [title, setTitle] = useState(doc.title);
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [lastSavedAt, setLastSavedAt] = useState(doc.updated_at);

  // Saves are serialized through a promise chain so an older request can
  // never land after (and overwrite) a newer one.
  const pending = useRef<DocPatch>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chain = useRef<Promise<void>>(Promise.resolve());

  const flush = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    chain.current = chain.current.then(async () => {
      const payload = pending.current;
      if (Object.keys(payload).length === 0) return;
      pending.current = {};
      setStatus("saving");
      try {
        const saved = await api.updateDoc(doc.id, payload);
        setLastSavedAt(saved.updated_at);
        setStatus(Object.keys(pending.current).length ? "pending" : "saved");
      } catch {
        // Keep the failed changes so the next edit (or retry) sends them again.
        pending.current = { ...payload, ...pending.current };
        setStatus("error");
      }
    });
    return chain.current;
  }, [doc.id]);

  const queue = useCallback(
    (patch: DocPatch) => {
      pending.current = { ...pending.current, ...patch };
      setStatus("pending");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), AUTOSAVE_DELAY_MS);
    },
    [flush],
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { target: "_blank", rel: "noopener noreferrer nofollow" },
        },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight,
      TaskList,
      TaskItem.configure({ nested: true }),
      CharacterCount,
      Placeholder.configure({ placeholder: "Start typing..." }),
    ],
    content: Object.keys(doc.content).length ? doc.content : "",
    immediatelyRender: false,
    autofocus: Object.keys(doc.content).length ? false : "start",
    editorProps: {
      attributes: {
        class: "md-content doc-content outline-none",
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": "Document body",
      },
    },
    onUpdate: ({ editor: current }) => {
      queue({ content: current.getJSON(), content_text: current.getText() });
    },
  });

  const words = useEditorState({
    editor,
    selector: ({ editor: current }) => current?.storage.characterCount.words() ?? 0,
  });

  // Flush on unmount (e.g. navigating back to the docs list).
  useEffect(() => {
    return () => {
      void flush();
    };
  }, [flush]);

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (status === "pending" || status === "saving" || status === "error") {
        event.preventDefault();
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [status]);

  useEffect(() => {
    document.title = `${title || "Untitled document"} · Docs`;
  }, [title]);

  async function handleDelete() {
    if (!confirm(`Delete "${title || "Untitled document"}"? This can't be undone.`)) return;
    pending.current = {};
    if (timer.current) clearTimeout(timer.current);
    await api.deleteDoc(doc.id);
    router.push("/docs");
  }

  const statusLabel =
    status === "saving"
      ? "Saving..."
      : status === "pending"
        ? "Unsaved changes"
        : status === "error"
          ? "Couldn't save. Retrying on next edit."
          : `All changes saved`;

  return (
    <div className="flex min-h-full flex-col bg-[var(--background)]">
      <div className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface)]">
        {/* Title bar */}
        <div className="flex items-center gap-3 px-4 pb-1 pt-3">
          <Link href="/docs" title="Docs home" className="shrink-0 transition-opacity hover:opacity-80">
            <DocIcon className="h-9 w-9" />
          </Link>
          <div className="min-w-0 flex-1">
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                queue({ title: e.target.value });
              }}
              onBlur={() => {
                if (!title.trim()) setTitle("Untitled document");
                void flush();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  editor?.commands.focus("start");
                }
              }}
              aria-label="Document title"
              placeholder="Untitled document"
              maxLength={255}
              className="w-full max-w-md truncate rounded border border-transparent bg-transparent px-1.5 py-0.5 text-lg text-[var(--foreground)] outline-none hover:border-[var(--border-strong)] focus:border-[var(--accent)]"
            />
            <div className="flex items-center gap-3 px-1.5 text-xs text-[var(--muted)]">
              <Link href="/docs" className="hover:text-[var(--foreground)] hover:underline">
                Docs
              </Link>
              <span
                role="status"
                aria-live="polite"
                className={cn(status === "error" && "text-red-500")}
                title={status === "saved" ? `Last saved ${new Date(lastSavedAt).toLocaleString()}` : undefined}
              >
                {statusLabel}
              </span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger aria-label="Document options" />
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => router.push("/docs")}>All documents</DropdownMenuItem>
              <DropdownMenuItem destructive onClick={handleDelete}>
                Delete document
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="px-3 pb-2">
          <DocToolbar editor={editor} />
        </div>
      </div>

      {/* Page canvas */}
      <div className="flex-1 px-0 py-6 sm:px-6">
        <div
          className="doc-page mx-auto w-full max-w-[816px] bg-[var(--surface)] px-6 py-10 shadow-[0_1px_3px_rgba(60,64,67,0.15),0_4px_8px_3px_rgba(60,64,67,0.08)] sm:min-h-[1056px] sm:px-[72px] sm:py-[72px] md:px-24 md:py-24"
          onMouseDown={(e) => {
            // Clicking the page margin focuses the end of the document, as in Google Docs.
            if (e.target === e.currentTarget && editor) {
              e.preventDefault();
              editor.commands.focus("end");
            }
          }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      <div className="pointer-events-none sticky bottom-3 flex justify-end px-4">
        <span className="pointer-events-auto rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 font-mono text-[11px] text-[var(--muted)] shadow-sm">
          {words} {words === 1 ? "word" : "words"}
        </span>
      </div>
    </div>
  );
}
