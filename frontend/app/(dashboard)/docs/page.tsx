"use client";

import { DocIcon } from "@/components/docs/doc-icons";
import { SearchIcon } from "@/components/kanban/jira-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { DocListItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const SEARCH_DEBOUNCE_MS = 250;

function formatEdited(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return formatDate(iso);
}

export default function DocsHomePage() {
  const router = useRouter();
  const [docs, setDocs] = useState<DocListItem[] | null>(null);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let active = true;
    const handle = setTimeout(() => {
      api.getDocs(query).then((data) => active && setDocs(data));
    }, query ? SEARCH_DEBOUNCE_MS : 0);
    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [query]);

  async function handleCreate() {
    setCreating(true);
    try {
      const doc = await api.createDoc();
      router.push(`/docs/${doc.id}`);
    } catch {
      setCreating(false);
    }
  }

  async function handleDelete(doc: DocListItem) {
    if (!confirm(`Delete "${doc.title}"? This can't be undone.`)) return;
    await api.deleteDoc(doc.id);
    setDocs((prev) => prev?.filter((item) => item.id !== doc.id) ?? null);
  }

  return (
    <div className="min-h-full">
      {/* Top bar */}
      <header className="flex flex-wrap items-center gap-4 px-6 pb-4 pt-6 md:px-8">
        <div className="flex items-center gap-2.5">
          <DocIcon className="h-8 w-6" />
          <h1 className="text-xl text-[var(--foreground)]">Docs</h1>
        </div>
        <label className="relative ml-auto w-full max-w-xl sm:w-auto sm:flex-1">
          <span className="sr-only">Search documents</span>
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="h-11 w-full rounded-full border border-transparent bg-[var(--surface-hover)] pl-11 pr-4 text-sm text-[var(--foreground)] outline-none transition-all placeholder:text-[var(--muted)] focus:border-[var(--border)] focus:bg-[var(--surface)] focus:shadow-md"
          />
        </label>
      </header>

      {/* Start a new document */}
      <section className="border-y border-[var(--border)] bg-[var(--surface-muted)] px-6 py-5 md:px-8">
        <h2 className="text-sm text-[var(--foreground)]">Start a new document</h2>
        <button
          type="button"
          onClick={handleCreate}
          disabled={creating}
          className="group mt-3 block text-left disabled:cursor-wait disabled:opacity-60"
        >
          <span className="flex h-40 w-32 items-center justify-center rounded border border-[var(--border)] bg-[var(--surface)] transition-colors group-hover:border-[var(--accent)]">
            <svg viewBox="0 0 40 40" className="h-14 w-14" aria-hidden>
              <path d="M17 6h6v28h-6z" fill="#34a853" />
              <path d="M6 17h28v6H6z" fill="#4285f4" />
              <path d="M17 17h6v6h-6z" fill="#fbbc04" />
              <path d="M17 23h6v11h-6z" fill="#ea4335" />
            </svg>
          </span>
          <span className="mt-2 block text-sm font-medium text-[var(--foreground)]">
            {creating ? "Creating..." : "Blank document"}
          </span>
        </button>
      </section>

      {/* Recent documents */}
      <section className="px-6 py-6 md:px-8">
        <h2 className="text-sm font-medium text-[var(--foreground)]">
          {query.trim() ? `Results for "${query.trim()}"` : "Recent documents"}
        </h2>

        {docs === null ? (
          <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : docs.length === 0 ? (
          <p className="mt-6 text-sm text-[var(--muted)]">
            {query.trim()
              ? "No documents match your search."
              : "No documents yet. Start one with a blank document above."}
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-5">
            {docs.map((doc) => (
              <li
                key={doc.id}
                className="group relative rounded-md border border-[var(--border)] bg-[var(--surface)] transition-colors hover:border-[var(--accent)]"
              >
                <Link href={`/docs/${doc.id}`} className="block">
                  <div className="h-44 overflow-hidden rounded-t-md border-b border-[var(--border)] bg-[var(--surface-muted)] px-4 pt-4">
                    <div className="h-full bg-[var(--surface)] px-3 py-3 shadow-sm">
                      <p className="line-clamp-[10] text-[7px] leading-[1.45] text-[var(--muted)]">
                        {doc.excerpt || " "}
                      </p>
                    </div>
                  </div>
                  <div className="px-3 pb-3 pt-2.5">
                    <p className="truncate pr-6 text-sm font-medium text-[var(--foreground)]">{doc.title}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--muted)]">
                      <DocIcon className="h-4 w-3 shrink-0" />
                      Edited {formatEdited(doc.updated_at)}
                    </p>
                  </div>
                </Link>
                <div className="absolute bottom-2 right-1.5">
                  <DropdownMenu>
                    <DropdownMenuTrigger variant="ghost" aria-label={`Options for ${doc.title}`} />
                    <DropdownMenuContent className="min-w-[160px]">
                      <DropdownMenuItem onClick={() => router.push(`/docs/${doc.id}`)}>Open</DropdownMenuItem>
                      <DropdownMenuItem destructive onClick={() => handleDelete(doc)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
