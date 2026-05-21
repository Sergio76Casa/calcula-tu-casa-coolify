import { NextResponse } from "next/server";
import { pbCreate, pbUpdate } from "@/lib/pocketbase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      propiedad_id,
      nombre,
      telefono,
      email,
      test_variant,
      utm_source,
      utm_campaign,
      lang,
    } = body;

    const data = await pbCreate("leads", {
      propiedad_id,
      nombre,
      telefono,
      email,
      test_variant,
      utm_source,
      utm_campaign,
      lang,
      pdf_downloaded: false,
      quiere_vender: false,
    });

    return NextResponse.json({ success: true, lead: { id: data.id } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error interno";
    console.error("[api/lead/POST]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { leadId, action } = body;

    if (!leadId) {
      return NextResponse.json({ error: "Falta leadId" }, { status: 400 });
    }

    if (action === "download") {
      await pbUpdate("leads", leadId, { pdf_downloaded: true });
      return NextResponse.json({ success: true });
    }

    if (action === "sell") {
      const { urgencia, estado, telefono } = body;
      await pbUpdate("leads", leadId, {
        quiere_vender: true,
        venta_urgencia: urgencia,
        venta_estado: estado,
        telefono_final: telefono ? telefono.trim() : null,
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error interno";
    console.error("[api/lead/PATCH]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
