import { NextResponse } from "next/server";
import { pbCreate, pbUpdate, pbList } from "@/lib/pocketbase";

function cleanPhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
}

async function sendTelegramAlert(message: string, targetChatId?: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = targetChatId || process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.log("[Telegram Alert Mocked - Missing env variables]:", message);
    return false;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      console.error("[Telegram Error response]", await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Telegram Exception]", err);
    return false;
  }
}

async function getDeliveryMode(): Promise<"manual" | "auto"> {
  try {
    const cfg = await pbList("app_config", `key = 'lead_delivery_mode'`);
    if (cfg.length > 0 && cfg[0].value === "auto") {
      return "auto";
    }
  } catch (err) {
    console.error("[getDeliveryMode Error]", err);
  }
  return "manual";
}

async function extractOrLookupPostalCode(address: string): Promise<string> {
  const cpMatch = address.match(/\b\d{5}\b/);
  if (cpMatch) return cpMatch[0];

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=1&countrycodes=es`;
    const res = await fetch(url, {
      headers: { "User-Agent": "CalculaTuCasa/1.2" },
      signal: AbortSignal.timeout(1800),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data[0]) {
        const postcode = data[0].address?.postcode;
        if (postcode && /^\d{5}$/.test(postcode)) return postcode;
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

    const deliveryMode = await getDeliveryMode();
    const contactPhone = lead.telefono_final || lead.telefono;

    let leadDetails = "";
    if (isHotLead) {
      leadDetails += `🔥 *¡LEAD INTERESADO EN VENDER!* (Hot Lead)\n\n`;
      leadDetails += `👤 *Datos del Propietario:*\n`;
      leadDetails += `• *Nombre:* ${lead.nombre}\n`;
      leadDetails += `• *Teléfono:* ${contactPhone}\n`;
      if (lead.email) leadDetails += `• *Email:* ${lead.email}\n`;
      leadDetails += `\n📋 *Detalles de Venta:*\n`;
      leadDetails += `• *Urgencia:* ${urgencia || "No especificada"}\n`;
      leadDetails += `• *Estado del inmueble:* ${estadoVenta || "No especificado"}\n`;
    } else {
      leadDetails += `🔔 *Nuevo Lead Registrado*\n\n`;
      leadDetails += `👤 *Datos del Propietario:*\n`;
      leadDetails += `• *Nombre:* ${lead.nombre}\n`;
      leadDetails += `• *Teléfono:* ${contactPhone}\n`;
      if (lead.email) leadDetails += `• *Email:* ${lead.email}\n`;
    }

    leadDetails += `\n📍 *Propiedad:*\n`;
    leadDetails += `• *Dirección:* ${propiedad.direccion_completa}\n`;
    leadDetails += `• *Código Postal:* ${cp || "No detectado"}\n`;
    leadDetails += `• *Superficie:* ${propiedad.m2_construidos} m²\n`;
    leadDetails += `• *Conservación:* ${propiedad.estado_conservacion}\n`;

    if (!agency) {
      await sendTelegramAlert(
        `${leadDetails}\n⚠️ *Sin agencia asignada para el CP ${cp || "desconocido"}.*`
      );
      return;
    }

    const waText = `Hola ${agency.nombre}, tenemos un nuevo propietario en tu zona (${cp}).\n\nDetalles:\n- Propietario: ${lead.nombre} (${contactPhone})\n- Dirección: ${propiedad.direccion_completa}\n- Superficie: ${propiedad.m2_construidos} m²`;
    const waLink = `https://wa.me/${cleanPhone(agency.telefono)}?text=${encodeURIComponent(waText)}`;

    // Modo Automático y la agencia tiene Telegram Chat ID configurado
    if (deliveryMode === "auto" && agency.telegram_chat_id) {
      const agencySent = await sendTelegramAlert(
        `🏠 *Nuevo Propietario en tu Zona (${cp}) — CalculaTuCasa.com*\n\n` +
        `👤 *Nombre:* ${lead.nombre}\n` +
        `📞 *Teléfono:* ${contactPhone}\n` +
        (lead.email ? `✉️ *Email:* ${lead.email}\n` : "") +
        `📍 *Dirección:* ${propiedad.direccion_completa}\n` +
        `📐 *Superficie:* ${propiedad.m2_construidos} m² (${propiedad.estado_conservacion})` +
        (isHotLead ? `\n🔥 *Urgencia:* ${urgencia || "Alta"}` : ""),
        agency.telegram_chat_id.trim()
      );

      if (agencySent) {
        await sendTelegramAlert(
          `✅ *Lead enviado automáticamente a ${agency.nombre}* (CP ${cp})\n\n` +
          `👤 ${lead.nombre} (${contactPhone})\n📍 ${propiedad.direccion_completa}`
        );
        return;
      }
    }

    // Modo Manual (o Automático sin Telegram Chat ID en la agencia)
    let adminMsg = leadDetails;
    if (deliveryMode === "auto" && !agency.telegram_chat_id) {
      adminMsg += `\n⚠️ *Modo Automático activo*, pero *${agency.nombre}* no tiene *Telegram Chat ID* configurado.\n`;
    }
    adminMsg += `\n🏢 *Agencia Asignada (CP ${cp}):*\n`;
    adminMsg += `• *Nombre:* ${agency.nombre}\n`;
    adminMsg += `• *Teléfono:* ${agency.telefono}\n`;
    adminMsg += `• *Email:* ${agency.email}\n\n`;
    adminMsg += `💬 [Enviar lead por WhatsApp a ${agency.nombre}](${waLink})`;

    await sendTelegramAlert(adminMsg);
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
