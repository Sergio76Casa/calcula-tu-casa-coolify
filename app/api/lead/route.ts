import { NextResponse } from "next/server";
import { pbCreate, pbUpdate, pbList } from "@/lib/pocketbase";

function cleanPhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

async function sendTelegramAlert(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.log("[Telegram Alert Mocked - Missing env variables]:", message);
    return;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
      }),
    });
    if (!res.ok) {
      console.error("[Telegram Error response]", await res.text());
    }
  } catch (err) {
    console.error("[Telegram Exception]", err);
  }
}

async function extractOrLookupPostalCode(address: string): Promise<string> {
  const cpMatch = address.match(/\b\d{5}\b/);
  if (cpMatch) return cpMatch[0];

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=1&countrycodes=es`;
    const res = await fetch(url, { 
      headers: { "User-Agent": "CalculaTuCasa/1.0" },
      signal: AbortSignal.timeout(1800)
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data[0]) {
        const postcode = data[0].address?.postcode;
        if (postcode && /^\d{5}$/.test(postcode)) {
          return postcode;
        }
        const dispMatch = data[0].display_name?.match(/\b\d{5}\b/);
        if (dispMatch) return dispMatch[0];
      }
    }
  } catch (err) {
    console.error("[Postal Code Lookup Error]", err);
  }
  return "";
}

async function handleRoutingAndNotification(
  lead: any,
  propiedadId: string,
  isHotLead = false,
  urgencia?: string,
  estadoVenta?: string
) {
  try {
    const props = await pbList("propiedades", `id = '${propiedadId}'`);
    if (props.length === 0) return;
    const propiedad = props[0];

    const cp = await extractOrLookupPostalCode(propiedad.direccion_completa);

    let agency: any = null;
    if (cp) {
      const zones = await pbList("zonas_inmobiliarias", `codigo_postal = '${cp}'`);
      if (zones.length > 0) {
        const zone = zones[0];
        const agencies = await pbList("inmobiliarias", `id = '${zone.inmobiliaria_id}'`);
        if (agencies.length > 0 && agencies[0].estado) {
          agency = agencies[0];
        }
      }
    }

    let message = "";
    if (isHotLead) {
      message += `🔥 *¡LEAD INTERESADO EN VENDER!* (Hot Lead)\n\n`;
      message += `👤 *Datos del Propietario:*\n`;
      message += `• *Nombre:* ${lead.nombre}\n`;
      message += `• *Teléfono:* ${lead.telefono_final || lead.telefono}\n`;
      message += `• *Email:* ${lead.email}\n\n`;
      message += `📋 *Detalles de Venta:*\n`;
      message += `• *Urgencia:* ${urgencia || "No especificada"}\n`;
      message += `• *Estado del inmueble:* ${estadoVenta || "No especificado"}\n\n`;
      message += `📍 *Propiedad:*\n`;
      message += `• *Dirección:* ${propiedad.direccion_completa}\n`;
      message += `• *Código Postal:* ${cp || "No detectado"}\n`;
    } else {
      message += `🔔 *Nuevo Lead Registrado*\n\n`;
      message += `👤 *Datos del Propietario:*\n`;
      message += `• *Nombre:* ${lead.nombre}\n`;
      message += `• *Teléfono:* ${lead.telefono}\n`;
      message += `• *Email:* ${lead.email}\n\n`;
      message += `📍 *Propiedad:*\n`;
      message += `• *Dirección:* ${propiedad.direccion_completa}\n`;
      message += `• *Código Postal:* ${cp || "No detectado"}\n`;
      message += `• *Superficie:* ${propiedad.m2_construidos} m²\n`;
      message += `• *Conservación:* ${propiedad.estado_conservacion}\n`;
    }

    if (agency) {
      message += `\n🏢 *Agencia Asignada:*\n`;
      message += `• *Nombre:* ${agency.nombre}\n`;
      message += `• *Teléfono:* ${agency.telefono}\n`;
      message += `• *Email:* ${agency.email}\n\n`;

      const waText = `Hola ${agency.nombre}, tenemos un nuevo lead en tu zona asignada (${cp}).\nDetalles:\n- Dirección: ${propiedad.direccion_completa}\n- Contacto: ${lead.nombre} (${lead.telefono_final || lead.telefono})`;
      const waLink = `https://wa.me/${cleanPhone(agency.telefono)}?text=${encodeURIComponent(waText)}`;
      message += `💬 [Enviar lead por WhatsApp a la agencia](${waLink})`;
    } else {
      message += `\n⚠️ *Sin agencia asignada para el CP ${cp || "desconocido"}.*`;
    }

    await sendTelegramAlert(message);
  } catch (err) {
    console.error("[handleRoutingAndNotification Error]", err);
  }
}

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

    // Run routing and alerts asynchronously
    handleRoutingAndNotification(data, propiedad_id).catch(console.error);

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
      const updatedLead = await pbUpdate("leads", leadId, {
        quiere_vender: true,
        venta_urgencia: urgencia,
        venta_estado: estado,
        telefono_final: telefono ? telefono.trim() : null,
      });

      // Send hot lead notifications
      handleRoutingAndNotification(updatedLead, updatedLead.propiedad_id, true, urgencia, estado).catch(console.error);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error interno";
    console.error("[api/lead/PATCH]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
