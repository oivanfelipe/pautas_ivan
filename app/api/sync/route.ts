import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncRange, NoAccountError } from "@/lib/sync";
import { ReconnectRequiredError } from "@/lib/google/calendar";

const MAX_DAYS = 62;

// Sincroniza o intervalo que o usuário está vendo (dia, semana ou mês).
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { from?: string; to?: string } | null;
  const from = body?.from ? new Date(body.from) : null;
  const to = body?.to ? new Date(body.to) : null;

  if (!from || !to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to) {
    return NextResponse.json({ error: "invalid_range" }, { status: 400 });
  }
  if ((to.getTime() - from.getTime()) / 86_400_000 > MAX_DAYS) {
    return NextResponse.json({ error: "range_too_large", maxDays: MAX_DAYS }, { status: 400 });
  }

  try {
    const result = await syncRange(user.id, from, to);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof ReconnectRequiredError || err instanceof NoAccountError) {
      return NextResponse.json({ error: "reconnect" }, { status: 409 });
    }
    console.error("sync falhou", err);
    return NextResponse.json({ error: "sync_failed" }, { status: 502 });
  }
}
