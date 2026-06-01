import { NextResponse } from "next/server";
import { pbList } from "@/lib/pocketbase";

const FALLBACK_NAMES = [
  "Antonio", "María", "Carlos", "Laura", "Jordi",
  "Marta",   "David", "Elena",  "Sergio", "Ana",
  "Miguel",  "Sara",  "Javier", "Lucía",  "Pablo",
  "Núria",   "Marc",  "Isabel", "Álvaro", "Rosa",
  "Josep",   "Montserrat", "Albert", "Sílvia", "Xavier",
  "Mireia",  "Joan",  "Daniela", "Oriol",  "Cristina"
];

export async function GET() {
  try {
    const records = await pbList("social_proof_names");
    if (records.length > 0) {
      const names = records.map((r: any) => r.name).filter(Boolean);
      return NextResponse.json(names);
    }
  } catch (err) {
    console.error("[api/names]", err);
  }
  return NextResponse.json(FALLBACK_NAMES);
}
