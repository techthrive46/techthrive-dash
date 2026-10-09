"use client";

import { cn } from "@/lib/utils";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { Placeholder } from "@tiptap/extensions";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor, type Extensions } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef } from "react";

/*
 * Rich text that is stored as Markdown. Typing Markdown syntax formats as you
 * type ("- " → bullet list, "1. " → numbered list, "# " → heading,
 * "[ ] " → checklist, **bold**, `code`, "> " → quote), and the saved value is
 * still plain Markdown, so older plain-text content loads unchanged.
 */

function buildExtensions({
  placeholder,
  readOnly = false,
  checkableTasks = false,
}: { placeholder?: string; readOnly?: boolean; checkableTasks?: boolean } = {}): Extensions {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      // The trailing empty paragraph lets you click below a list to keep typing,
      // but in read-only views it's just blank space.
      trailingNode: readOnly ? false : undefined,
      link: {
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { target: "_blank", rel: "noopener noreferrer nofollow" },
      },
    }),
    TaskList,
    TaskItem.configure({
      nested: true,
      // In a read-only view this only keeps the box ticked; MarkdownView updates the document.
      ...(checkableTasks ? { onReadOnlyChecked: () => true } : {}),
    }),
    // `breaks` keeps single newlines from older plain-text content as line breaks.
    Markdown.configure({ markedOptions: { gfm: true, breaks: true } }),
    ...(placeholder ? [Placeholder.configure({ placeholder })] : []),
  ];
}

interface MarkdownEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  /** Called on Ctrl/Cmd+Enter. */
  onSubmit?: () => void;
  /** Called on Escape. */
  onCancel?: () => void;
  "aria-label"?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  autoFocus = false,
  className,
  onSubmit,
  onCancel,
  "aria-label": ariaLabel,
}: MarkdownEditorProps) {
  const editor = useEditor({
    extensions: buildExtensions({ placeholder }),
    content: value,
    contentType: "markdown",
    immediatelyRender: false,
    autofocus: autoFocus ? "end" : false,
    editorProps: {
      attributes: {
        class: "md-content min-h-[4.5rem] px-3.5 py-2.5 outline-none",
        role: "textbox",
        "aria-multiline": "true",
        ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
      },
      handleKeyDown: (_view, event) => {
        if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && onSubmit) {
          event.preventDefault();
          onSubmit();
          return true;
        }
        if (event.key === "Escape" && onCancel) {
          event.preventDefault();
          onCancel();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange(current.isEmpty ? "" : current.getMarkdown());
    },
  });

  // Follow external resets (e.g. clearing the comment box after posting).
  useEffect(() => {
    if (!editor) return;
    const current = editor.isEmpty ? "" : editor.getMarkdown();
    if (value !== current) {
      editor.commands.setContent(value, { contentType: "markdown", emitUpdate: false });
    }
  }, [editor, value]);

  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] text-sm text-[var(--foreground)] transition-all focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/15",
        className,
      )}
    >
      <EditorContent editor={editor} />
    </div>
  );
}

export function MarkdownView({
  value,
  className,
  onChange,
}: {
  value: string;
  className?: string;
  /** When set, checklist boxes can be ticked and the updated Markdown is reported here. */
  onChange?: (markdown: string) => void;
}) {
  const editor = useEditor({
    extensions: buildExtensions({ readOnly: true, checkableTasks: Boolean(onChange) }),
    content: value,
    contentType: "markdown",
    editable: false,
    immediatelyRender: false,
    editorProps: { attributes: { class: "md-content outline-none" } },
    onUpdate: ({ editor: current }) => onChange?.(current.getMarkdown()),
  });

  // A read-only editor only lets a checklist box *look* ticked, so apply the
  // change to the document here; that fires onUpdate, which reports it. This
  // is a native listener because ProseMirror creates these checkboxes, and
  // React's onChange never fires for inputs it didn't render.
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !editor || !onChange) return;

    function handleChange(event: Event) {
      const target = event.target;
      if (!editor || !(target instanceof HTMLInputElement) || target.type !== "checkbox") return;
      // Task items render as <li data-checked>; the node-type check below confirms it.
      const item = target.closest("li[data-checked]");
      if (!item) return;
      const pos = editor.view.posAtDOM(item, 0) - 1;
      const node = editor.state.doc.nodeAt(pos);
      if (node?.type.name !== "taskItem") return;
      editor.view.dispatch(
        editor.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, checked: target.checked }),
      );
    }

    container.addEventListener("change", handleChange);
    return () => container.removeEventListener("change", handleChange);
  }, [editor, onChange]);

  useEffect(() => {
    if (editor && !editor.isDestroyed && value !== editor.getMarkdown()) {
      editor.commands.setContent(value, { contentType: "markdown", emitUpdate: false });
    }
  }, [editor, value]);

  // Until the editor mounts on the client, show the raw text so there's no layout jump.
  if (!editor) {
    return <div className={cn("whitespace-pre-wrap text-sm", className)}>{value}</div>;
  }
  return (
    <div ref={containerRef}>
      <EditorContent editor={editor} className={cn("text-sm", className)} />
    </div>
  );
}

export function MarkdownHint() {
  return (
    <p className="font-mono text-[10px] text-[var(--muted-light)]">
      Markdown: <code>-</code> list · <code>1.</code> numbered · <code>[ ]</code> checklist ·{" "}
      <code>#</code> heading · <code>**bold**</code> · <code>`code`</code> · <code>&gt;</code> quote
    </p>
  );
}
