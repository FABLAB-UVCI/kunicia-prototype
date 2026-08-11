import { NextResponse } from "next/server";
import { exigerSession } from "@/lib/server/auth";

export async function GET() {
  const resultat = await exigerSession();
  if (resultat instanceof NextResponse) {
    return resultat;
  }
  return NextResponse.json(resultat);
}
