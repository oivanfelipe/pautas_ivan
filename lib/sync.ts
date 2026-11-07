import "server-only";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptToken } from "@/lib/crypto";
import {
  getAccessToken,
  listEvents,
  ReconnectRequiredError,
} from "@/lib/google/calendar";
import { mapEvent, type MeetingRow } from "@/lib/google/events";

export type SyncResult = {
  created: number;
  updated: number;
  cancelled: number;
  skipped: number;
  templateItems: number;
};

export class NoAccountError extends Error {
  constructor() {
    super("Conta Google não conectada.");
    this.name = "NoAccountError";
  }
}

// Sincroniza as reuniões de um usuário no intervalo [from, to].
// Nunca mexe em `notes` nem nos itens do checklist de reuniões que já existem.
export async function syncRange(userId: string, from: Date, to: Date): Promise<SyncResult> {
  const admin = createAdminClient();

  const { data: account, error: accountError } = await admin
    .from("pautas_google_accounts")
    .select("refresh_token_enc")
    .eq("user_id", userId)
    .maybeSingle();

  if (accountError) throw new Error(`Falha ao ler a conta Google: ${accountError.message}`);
  if (!account) throw new NoAccountError();

  let events;
  try {
    const accessToken = await getAccessToken(decryptToken(account.refresh_token_enc));
    events = await listEvents(accessToken, from.toISOString(), to.toISOString());
  } catch (err) {
    if (err instanceof ReconnectRequiredError) {
      await admin
        .from("pautas_google_accounts")
        .update({ needs_reconnect: true, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
    }
    throw err;
  }

  const meetings: MeetingRow[] = [];
  let skipped = 0;
  for (const event of events) {
    const mapped = mapEvent(event);
    if (mapped.kind === "meeting") meetings.push(mapped.meeting);
    else skipped++;
  }

  // Quais já existiam, para saber o que é novo (e merece o modelo da série).
  const { data: existingRows, error: existingError } = await admin
    .from("pautas_meetings")
    .select("google_event_id, status")
    .eq("user_id", userId)
    .gte("starts_at", from.toISOString())
    .lte("starts_at", to.toISOString());
  if (existingError) throw new Error(`Falha ao ler reuniões: ${existingError.message}`);

  const existing = new Map((existingRows ?? []).map((r) => [r.google_event_id, r.status]));
  const now = new Date().toISOString();

  let created = 0;
  let updated = 0;
  let templateItems = 0;

  if (meetings.length > 0) {
    const { data: saved, error: upsertError } = await admin
      .from("pautas_meetings")
      .upsert(
        meetings.map((m) => ({ ...m, user_id: userId, synced_at: now })),
        { onConflict: "user_id,google_event_id" },
      )
      .select("id, google_event_id, title_key");
    if (upsertError) throw new Error(`Falha ao gravar reuniões: ${upsertError.message}`);

    const fresh = (saved ?? []).filter((m) => !existing.has(m.google_event_id));
    created = fresh.length;
    updated = (saved?.length ?? 0) - created;

    // Pauta nova nasce com os itens do modelo (mesmo título), uma única vez.
    if (fresh.length > 0) {
      const keys = [...new Set(fresh.map((m) => m.title_key))];
      const { data: templates, error: templateError } = await admin
        .from("pautas_template_items")
        .select("title_key, text, position")
        .eq("user_id", userId)
        .in("title_key", keys)
        .order("position");
      if (templateError) throw new Error(`Falha ao ler modelos: ${templateError.message}`);

      const items = fresh.flatMap((m) =>
        (templates ?? [])
          .filter((t) => t.title_key === m.title_key)
          .map((t) => ({
            id: randomUUID(),
            meeting_id: m.id,
            user_id: userId,
            text: t.text,
            position: t.position,
          })),
      );
      if (items.length > 0) {
        const { error: itemsError } = await admin.from("pautas_checklist_items").insert(items);
        if (itemsError) throw new Error(`Falha ao aplicar o modelo: ${itemsError.message}`);
        templateItems = items.length;
      }
    }
  }

  // Reuniões que estavam confirmadas no intervalo e não vieram mais do Google
  // (canceladas, removidas ou recusadas): ficam como "cancelled". Nada é apagado.
  const returned = new Set(meetings.map((m) => m.google_event_id));
  const gone = (existingRows ?? [])
    .filter((r) => r.status === "confirmed" && !returned.has(r.google_event_id))
    .map((r) => r.google_event_id);

  if (gone.length > 0) {
    const { error: cancelError } = await admin
      .from("pautas_meetings")
      .update({ status: "cancelled", synced_at: now })
      .eq("user_id", userId)
      .in("google_event_id", gone);
    if (cancelError) throw new Error(`Falha ao marcar canceladas: ${cancelError.message}`);
  }

  await admin
    .from("pautas_google_accounts")
    .update({ last_sync_at: now, needs_reconnect: false, updated_at: now })
    .eq("user_id", userId);

  return { created, updated, cancelled: gone.length, skipped, templateItems };
}
