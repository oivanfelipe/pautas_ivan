import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncRange } from "@/lib/sync";

const DAY = 86_400_000;

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

// Sync diário (Vercel Cron): de 7 dias atrás até 30 dias à frente, para quem está conectado.
export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: accounts, error } = await admin
    .from("pautas_google_accounts")
    .select("user_id")
    .eq("needs_reconnect", false);
  if (error) return NextResponse.json({ error: "accounts_failed" }, { status: 500 });

  const from = new Date(Date.now() - 7 * DAY);
  const to = new Date(Date.now() + 30 * DAY);

  let ok = 0;
  let failed = 0;
  for (const { user_id } of accounts ?? []) {
    try {
      await syncRange(user_id, from, to);
      ok++;
    } catch (err) {
      failed++;
      console.error("cron sync falhou para um usuário", err);
    }
  }

  return NextResponse.json({ ok, failed });
}
