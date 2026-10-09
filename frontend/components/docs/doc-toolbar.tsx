"use client";

import { ToolbarIcons } from "@/components/docs/doc-icons";
import { cn } from "@/lib/utils";
import { useEditorState, type Editor } from "@tiptap/react";
import { FormEvent, useState, type ReactNode } from "react";

type BlockStyle = "paragraph" | "h1" | "h2" | "h3";

const BLOCK_STYLES: { value: BlockStyle; label: string }[] = [
  { value: "paragraph", label: "Normal text" },
  { value: "h1", label: "Heading 1" },
  { value: "h2", label: "Heading 2" },
  { value: "h3", label: "Heading 3" },
];

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const MOD = isMac ? "⌘" : "Ctrl";

function ToolButton({
  label,
  shortcut,
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  const title = shortcut ? `${label} (${shortcut})` : label;
  return (
    <button
      type="button"
      title={title}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      // Keep the editor's selection while clicking toolbar buttons.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded px-1 text-[var(--foreground)] transition-colors disabled:opacity-35",
        active ? "bg-[var(--accent-light)] text-[var(--accent)]" : "hover:bg-[var(--surface-hover)]",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px shrink-0 bg-[var(--border-strong)]" aria-hidden />;
}

function LinkControl({ editor, active }: { editor: Editor; active: boolean }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

  function openPopover() {
    setUrl(editor.getAttributes("link").href ?? "");
    setOpen(true);
  }

  function apply(event: FormEvent) {
    event.preventDefault();
    const trimmed = url.trim();
    const chain = editor.chain().focus().extendMarkRange("link");
    if (!trimmed) {
      chain.unsetLink().run();
    } else {
      const href = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
      chain.setLink({ href }).run();
    }
    setOpen(false);
  }

  return (
    <div className="relative">
      <ToolButton label="Insert link" active={active} onClick={openPopover}>
        <ToolbarIcons.link className="h-[18px] w-[18px]" />
      </ToolButton>
      {open && (
        <form
          onSubmit={apply}
          className="absolute left-0 top-9 z-30 flex w-72 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 shadow-lg"
        >
          <input
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
            onBlur={() => setOpen(false)}
            placeholder="Paste a link"
            aria-label="Link URL"
            className="h-8 flex-1 rounded border border-[var(--border-strong)] bg-[var(--surface)] px-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
          />
          <button
            type="submit"
            onMouseDown={(e) => e.preventDefault()}
            className="h-8 rounded px-3 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent-light)]"
          >
            {active && !url.trim() ? "Remove" : "Apply"}
          </button>
        </form>
      )}
    </div>
  );
}

export function DocToolbar({ editor }: { editor: Editor | null }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) return null;
      const block: BlockStyle = e.isActive("heading", { level: 1 })
        ? "h1"
        : e.isActive("heading", { level: 2 })
          ? "h2"
          : e.isActive("heading", { level: 3 })
            ? "h3"
            : "paragraph";
      return {
        block,
        canUndo: e.can().undo(),
        canRedo: e.can().redo(),
        bold: e.isActive("bold"),
        italic: e.isActive("italic"),
        underline: e.isActive("underline"),
        strike: e.isActive("strike"),
        highlight: e.isActive("highlight"),
        link: e.isActive("link"),
        alignLeft: e.isActive({ textAlign: "left" }),
        alignCenter: e.isActive({ textAlign: "center" }),
        alignRight: e.isActive({ textAlign: "right" }),
        alignJustify: e.isActive({ textAlign: "justify" }),
        bulletList: e.isActive("bulletList"),
        orderedList: e.isActive("orderedList"),
        taskList: e.isActive("taskList"),
        blockquote: e.isActive("blockquote"),
        codeBlock: e.isActive("codeBlock"),
      };
    },
  });

  if (!editor || !state) {
    return <div className="h-10 rounded-full bg-[var(--surface-muted)]" />;
  }

  const run = () => editor.chain().focus();

  function setBlock(value: BlockStyle) {
    if (value === "paragraph") run().setParagraph().run();
    else run().setHeading({ level: Number(value.slice(1)) as 1 | 2 | 3 }).run();
  }

  const icon = "h-[18px] w-[18px]";

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="flex items-center gap-0.5 overflow-x-auto rounded-full bg-[var(--surface-muted)] px-3 py-1.5 ring-1 ring-[var(--border)]"
    >
      <ToolButton label="Undo" shortcut={`${MOD}+Z`} disabled={!state.canUndo} onClick={() => run().undo().run()}>
        <ToolbarIcons.undo className={icon} />
      </ToolButton>
      <ToolButton label="Redo" shortcut={`${MOD}+Y`} disabled={!state.canRedo} onClick={() => run().redo().run()}>
        <ToolbarIcons.redo className={icon} />
      </ToolButton>
      <Divider />
      <select
        value={state.block}
        onChange={(e) => setBlock(e.target.value as BlockStyle)}
        aria-label="Paragraph style"
        title="Styles"
        className="h-7 shrink-0 rounded bg-transparent px-1.5 text-sm text-[var(--foreground)] outline-none hover:bg-[var(--surface-hover)]"
      >
        {BLOCK_STYLES.map((style) => (
          <option key={style.value} value={style.value}>
            {style.label}
          </option>
        ))}
      </select>
      <Divider />
      <ToolButton label="Bold" shortcut={`${MOD}+B`} active={state.bold} onClick={() => run().toggleBold().run()}>
        <span className="text-[15px] font-bold">B</span>
      </ToolButton>
      <ToolButton label="Italic" shortcut={`${MOD}+I`} active={state.italic} onClick={() => run().toggleItalic().run()}>
        <span className="font-serif text-[15px] italic">I</span>
      </ToolButton>
      <ToolButton label="Underline" shortcut={`${MOD}+U`} active={state.underline} onClick={() => run().toggleUnderline().run()}>
        <span className="text-[15px] underline underline-offset-2">U</span>
      </ToolButton>
      <ToolButton label="Strikethrough" shortcut={`${MOD}+Shift+S`} active={state.strike} onClick={() => run().toggleStrike().run()}>
        <span className="text-[15px] line-through">S</span>
      </ToolButton>
      <ToolButton label="Highlight" shortcut={`${MOD}+Shift+H`} active={state.highlight} onClick={() => run().toggleHighlight().run()}>
        <ToolbarIcons.highlight className={icon} />
      </ToolButton>
      <Divider />
      <LinkControl editor={editor} active={state.link} />
      <Divider />
      <ToolButton label="Left align" shortcut={`${MOD}+Shift+L`} active={state.alignLeft} onClick={() => run().setTextAlign("left").run()}>
        <ToolbarIcons.alignLeft className={icon} />
      </ToolButton>
      <ToolButton label="Center align" shortcut={`${MOD}+Shift+E`} active={state.alignCenter} onClick={() => run().setTextAlign("center").run()}>
        <ToolbarIcons.alignCenter className={icon} />
      </ToolButton>
      <ToolButton label="Right align" shortcut={`${MOD}+Shift+R`} active={state.alignRight} onClick={() => run().setTextAlign("right").run()}>
        <ToolbarIcons.alignRight className={icon} />
      </ToolButton>
      <ToolButton label="Justify" shortcut={`${MOD}+Shift+J`} active={state.alignJustify} onClick={() => run().setTextAlign("justify").run()}>
        <ToolbarIcons.alignJustify className={icon} />
      </ToolButton>
      <Divider />
      <ToolButton label="Checklist" shortcut={`${MOD}+Shift+9`} active={state.taskList} onClick={() => run().toggleTaskList().run()}>
        <ToolbarIcons.checklist className={icon} />
      </ToolButton>
      <ToolButton label="Bulleted list" shortcut={`${MOD}+Shift+8`} active={state.bulletList} onClick={() => run().toggleBulletList().run()}>
        <ToolbarIcons.bulletList className={icon} />
      </ToolButton>
      <ToolButton label="Numbered list" shortcut={`${MOD}+Shift+7`} active={state.orderedList} onClick={() => run().toggleOrderedList().run()}>
        <ToolbarIcons.orderedList className={icon} />
      </ToolButton>
      <Divider />
      <ToolButton label="Quote" shortcut={`${MOD}+Shift+B`} active={state.blockquote} onClick={() => run().toggleBlockquote().run()}>
        <ToolbarIcons.quote className={icon} />
      </ToolButton>
      <ToolButton label="Code block" shortcut={`${MOD}+Alt+C`} active={state.codeBlock} onClick={() => run().toggleCodeBlock().run()}>
        <ToolbarIcons.codeBlock className={icon} />
      </ToolButton>
      <ToolButton label="Horizontal line" onClick={() => run().setHorizontalRule().run()}>
        <ToolbarIcons.horizontalRule className={icon} />
      </ToolButton>
      <Divider />
      <ToolButton label="Clear formatting" onClick={() => run().unsetAllMarks().clearNodes().run()}>
        <ToolbarIcons.clearFormat className={icon} />
      </ToolButton>
    </div>
  );
}
