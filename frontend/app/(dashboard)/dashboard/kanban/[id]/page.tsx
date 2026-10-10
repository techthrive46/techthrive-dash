"use client";

import { KanbanBoard } from "@/components/kanban/kanban-board";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queries";
import { useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";

export default function KanbanBoardPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  async function handleDelete() {
    if (!confirm("Delete this board and all its cards?")) return;
    await api.deleteBoard(params.id);
    queryClient.removeQueries({ queryKey: queryKeys.boards.detail(params.id) });
    // Projects linked to this board lose their link.
    void queryClient.invalidateQueries({ queryKey: queryKeys.boards.list() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    router.push("/dashboard/kanban");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <KanbanBoard boardId={params.id} onDeleteBoard={handleDelete} />
    </div>
  );
}
