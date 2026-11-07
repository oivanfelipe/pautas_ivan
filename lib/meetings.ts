import { createClient } from "@/lib/supabase/client";

export type Meeting = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  status: "confirmed" | "cancelled";
  meet_url: string | null;
  total: number; // itens do checklist
  done: number; // itens marcados
};

type Row = Omit<Meeting, "total" | "done"> & {
  pautas_checklist_items: { done: boolean }[];
};

// Lê as reuniões do período direto do Supabase (o RLS garante que só vêm as suas).
export async function fetchMeetings(from: Date, to: Date): Promise<Meeting[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pautas_meetings")
    .select("id,title,starts_at,ends_at,status,meet_url,pautas_checklist_items(done)")
    .gte("starts_at", from.toISOString())
    .lt("starts_at", to.toISOString())
    .order("starts_at");

  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown as Row[]).map(({ pautas_checklist_items, ...m }) => ({
    ...m,
    total: pautas_checklist_items.length,
    done: pautas_checklist_items.filter((i) => i.done).length,
  }));
}

export class ReconnectError extends Error {
  constructor() {
    super("reconnect");
    this.name = "ReconnectError";
  }
}

// Pede ao servidor para puxar o período do Google. Quem decide a frequência é a consulta
// que chama esta função (staleTime de 5 minutos) e o botão de atualizar.
export async function syncPeriod(from: Date, to: Date): Promise<void> {
  const res = await fetch("/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from: from.toISOString(), to: to.toISOString() }),
  });

  if (res.status === 409) throw new ReconnectError();
  if (!res.ok) throw new Error(`sync ${res.status}`);
}
