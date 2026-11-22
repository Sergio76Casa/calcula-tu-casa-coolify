import { NextResponse } from "next/server";
import { pbCreate } from "@/lib/pocketbase";
import { cleanPhone, sendTelegramAlert } from "@/lib/telegram";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const nombre_agencia = (body.nombre_agencia || "").trim();
    const persona_contacto = (body.persona_contacto || "").trim();
    const telefono = (body.telefono || "").trim();
    const email = (body.email || "").trim();
    const web = (body.web || "").trim();
    const ciudad = (body.ciudad || "").trim();
    const codigo_postal = (body.codigo_postal || "").trim();
    const notas = (body.notas || "").trim();

    if (!nombre_agencia || !telefono || (!ciudad && !codigo_postal)) {
      return NextResponse.json(
        { error: "Nombre de la inmobiliaria, teléfono y ciudad/código postal son obligatorios." },
        { status: 400 }
      );
    }

    const record = await pbCreate("prospectos_inmobiliarias", {
      nombre_agencia,
      persona_contacto,
      telefono,
      email,
      web,
      ciudad,
      codigo_postal,
      origen: "landing_inmobiliarias",
      estado: "pendiente",
      notas,
    });

    const waText = [
      `Hola${persona_contacto ? ` ${persona_contacto}` : ""}, gracias por solicitar tu lead de prueba en CalculaTuCasa.com para ${nombre_agencia}.`,
      `Hemos visto vuestro interés en la zona ${codigo_postal || ciudad}. ¿Preferís recibir los propietarios por Telegram o por WhatsApp?`,
    ].join("\n\n");

    const waUrl = `https://wa.me/${cleanPhone(telefono)}?text=${encodeURIComponent(waText)}`;

    const telegramMsg =
      `🏢 *Nueva Inmobiliaria Interesada (Landing B2B)*\n\n` +
      `• *Agencia:* ${nombre_agencia}\n` +
      (persona_contacto ? `• *Contacto:* ${persona_contacto}\n` : "") +
      `• *Teléfono:* ${telefono}\n` +
      (email ? `• *Email:* ${email}\n` : "") +
      (web ? `• *Web:* ${web}\n` : "") +
      `• *Ciudad:* ${ciudad || "No indicada"}\n` +
      `• *Códigos Postales:* ${codigo_postal || "No indicados"}\n` +
      (notas ? `• *Notas:* ${notas}\n` : "");

    await sendTelegramAlert(telegramMsg, undefined, [
      [{ text: `💬 Responder por WhatsApp a ${nombre_agencia}`, url: waUrl }],
    ]);

    return NextResponse.json({ success: true, id: record.id });
  } catch (err: any) {
    console.error("[POST /api/inmobiliarias Error]", err);
    return NextResponse.json(
      { error: err.message || "Error al guardar la solicitud" },
      { status: 500 }
    );
  }
}
