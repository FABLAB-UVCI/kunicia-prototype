import { NextResponse } from "next/server";
import { supprimerCookieSession } from "@/lib/server/auth";

export async function POST() {
  await supprimerCookieSession();
  return NextResponse.json({ ok: true });
}
