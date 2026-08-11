import { NextResponse } from "next/server";

// Réponses d'erreur au même format que l'API NestJS d'origine :
// { statusCode, message, error } — le client (lib/api/client.ts) lit
// data.message (string ou tableau), donc on garde ce contrat.
const LIBELLES_HTTP: Record<number, string> = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
  422: "Unprocessable Entity",
  503: "Service Unavailable",
};

export function erreurApi(
  status: number,
  message: string | string[],
): NextResponse {
  return NextResponse.json(
    {
      statusCode: status,
      message,
      error: LIBELLES_HTTP[status] ?? "Error",
    },
    { status },
  );
}
