import "server-only";
import type { GoogleEvent } from "./events";

export class ReconnectRequiredError extends Error {
  constructor() {
    super("O acesso ao Google foi revogado ou expirou. É preciso entrar de novo.");
    this.name = "ReconnectRequiredError";
  }
}

// Troca o refresh token por um access token de curta duração.
export async function getAccessToken(refreshToken: string): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET não configurados");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    if (body.error === "invalid_grant") throw new ReconnectRequiredError();
    throw new Error(`Falha ao renovar o acesso ao Google (${res.status}, ${body.error ?? "sem detalhe"})`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

// Lista as ocorrências do calendário principal no intervalo, uma por evento (singleEvents).
export async function listEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string,
): Promise<GoogleEvent[]> {
  const events: GoogleEvent[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "250",
      fields:
        "nextPageToken,items(id,status,summary,start,end,attendees(email,self,resource,responseStatus),hangoutLink,conferenceData/entryPoints(entryPointType,uri),recurringEventId)",
    });
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" },
    );

    if (res.status === 401) throw new ReconnectRequiredError();
    if (!res.ok) throw new Error(`Falha ao ler a agenda do Google (${res.status})`);

    const data = (await res.json()) as { items?: GoogleEvent[]; nextPageToken?: string };
    events.push(...(data.items ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return events;
}
