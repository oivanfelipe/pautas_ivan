import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptToken } from "@/lib/crypto";

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?erro=login`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/login?erro=login`);
  }

  const { session } = data;
  const admin = createAdminClient();
  const refreshToken = session.provider_refresh_token;

  if (refreshToken) {
    // Primeiro login (ou novo consentimento): guarda o refresh token criptografado.
    const { error: saveError } = await admin.from("pautas_google_accounts").upsert({
      user_id: session.user.id,
      refresh_token_enc: encryptToken(refreshToken),
      scopes: CALENDAR_SCOPE,
      needs_reconnect: false,
      updated_at: new Date().toISOString(),
    });

    if (saveError) {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login?erro=login`);
    }
  } else {
    // Sem refresh token novo: só serve se já existe um guardado e válido.
    const { data: existing } = await admin
      .from("pautas_google_accounts")
      .select("needs_reconnect")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!existing || existing.needs_reconnect) {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login?erro=token`);
    }
  }

  return NextResponse.redirect(`${origin}/`);
}
