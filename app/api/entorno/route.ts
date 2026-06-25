import { NextResponse } from "next/server";
import { fetchEntorno } from "@/lib/entorno";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { lat, lon } = body as { lat: number; lon: number };

    if (typeof lat !== "number" || typeof lon !== "number") {
      return NextResponse.json(
        { error: "Se requieren lat y lon como números" },
        { status: 400 }
      );
    }

    const data = await fetchEntorno(lat, lon);
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error interno";
    console.error("[api/entorno]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
