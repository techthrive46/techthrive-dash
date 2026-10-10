"use client";

import { DocEditor } from "@/components/docs/doc-editor";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import { useDoc } from "@/lib/queries";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function DocPage() {
  const params = useParams<{ id: string }>();
  const { data: doc, error: loadError } = useDoc(params.id);
  const error = loadError
    ? loadError instanceof ApiError && loadError.status === 404
      ? "Document not found."
      : "Couldn't load this document."
    : null;

  if (error) {
    return (
      <div className="px-6 py-10 md:px-8">
        <p className="text-sm text-red-500">{error}</p>
        <Link href="/docs" className="mt-3 inline-block text-sm text-[var(--accent)] hover:underline">
          ← Back to docs
        </Link>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex flex-col items-center gap-4 px-6 py-10">
        <Skeleton className="h-10 w-full max-w-4xl rounded-full" />
        <Skeleton className="h-[70vh] w-full max-w-[816px]" />
      </div>
    );
  }

  // Keyed by id so switching documents never reuses another doc's editor state.
  return <DocEditor key={doc.id} doc={doc} />;
}
