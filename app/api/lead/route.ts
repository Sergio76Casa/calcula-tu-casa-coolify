import { NextResponse } from "next/server";
import { pbCreate, pbUpdate, pbList } from "@/lib/pocketbase";
import { cleanPhone, sendTelegramAlert } from "@/lib/telegram";

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

    let valoracion: any = null;
    try {
      const vals = await pbList("valoraciones", `propiedad_id = '${propiedadId}'`);
      if (vals.length > 0) valoracion = vals[vals.length - 1];
    } catch {
      // silencioso
    }

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

    const tipoLabel = propiedad.tipo_propiedad || "Vivienda";
    const habLabel = propiedad.habitaciones ? `${propiedad.habitaciones} hab.` : "No indicado";
    const ascLabel = propiedad.ascensor === true ? "Sí" : propiedad.ascensor === false ? "No" : "No indicado";
    const jarLabel = propiedad.jardin === true ? "Sí" : propiedad.jardin === false ? "No" : "No indicado";
    const garTitle = propiedad.tipo_propiedad === "piso" ? "Plaza de parking" : "Garaje";
    const garLabel = propiedad.garaje === true ? "Sí" : propiedad.garaje === false ? "No" : "No indicado";
    const certLabel = propiedad.certificado_energetico
      ? propiedad.certificado_energetico === "pending"
        ? "Pendiente"
        : propiedad.certificado_energetico.toUpperCase()
      : "No indicado";
    const precioLabel = valoracion?.precio_sugerido
      ? `${Number(valoracion.precio_sugerido).toLocaleString("es-ES")} €`
      : "No disponible";

    leadDetails += `\n📍 *Propiedad:*\n`;
    leadDetails += `• *Dirección:* ${propiedad.direccion_completa}\n`;
    leadDetails += `• *Código Postal:* ${cp || "No detectado"}\n`;
    leadDetails += `• *Tipo:* ${tipoLabel} | *Superficie:* ${propiedad.m2_construidos} m²\n`;
    leadDetails += `• *Habitaciones:* ${habLabel} | *Estado:* ${propiedad.estado_conservacion}\n`;
    leadDetails += `• *Ascensor:* ${ascLabel} | *Jardín/Terraza:* ${jarLabel}\n`;
    leadDetails += `• *${garTitle}:* ${garLabel}\n`;
    leadDetails += `• *Cert. Energético:* ${certLabel}\n`;
    leadDetails += `• *Valoración IA:* ${precioLabel}\n`;
    if (lead.utm_source || lead.utm_campaign) {
      leadDetails += `\n📣 *Campaña:* ${lead.utm_source || "directo"}${lead.utm_campaign ? ` · \`${lead.utm_campaign}\`` : ""}\n`;
    }

    if (!agency) {
      await sendTelegramAlert(
        `${leadDetails}\n⚠️ *Sin agencia asignada para el CP ${cp || "desconocido"}.*`
      );
      return;
    }

    const waLines = [
      `Hola ${agency.nombre}, tenemos un nuevo propietario interesado en tu zona (${cp}).`,
      ``,
      `👤 *Datos del Propietario:*`,
      `- Nombre: ${lead.nombre}`,
      `- Teléfono: ${contactPhone}`,
      lead.email ? `- Email: ${lead.email}` : null,
      urgencia || lead.utm_campaign ? `- Urgencia/Intención: ${urgencia || lead.utm_campaign}` : null,
      estadoVenta ? `- Situación venta: ${estadoVenta}` : null,
      ``,
      `🏠 *Datos de la Vivienda:*`,
      `- Dirección: ${propiedad.direccion_completa}`,
      `- Tipo: ${tipoLabel}`,
      `- Superficie: ${propiedad.m2_construidos} m²`,
      `- Habitaciones: ${habLabel}`,
      `- Estado: ${propiedad.estado_conservacion}`,
      `- Ascensor: ${ascLabel}`,
      `- Jardín/Terraza: ${jarLabel}`,
      `- ${garTitle}: ${garLabel}`,
      `- Cert. Energético: ${certLabel}`,
      `- Valoración estimada IA: ${precioLabel}`,
    ].filter((line) => line !== null);

    const waText = waLines.join("\n");
    const waLink = `https://wa.me/${cleanPhone(agency.telefono)}?text=${encodeURIComponent(waText)}`;

    // Modo Automático y la agencia tiene Telegram Chat ID configurado
    if (deliveryMode === "auto" && agency.telegram_chat_id) {
      const agencySent = await sendTelegramAlert(
        `🏠 *Nuevo Propietario en tu Zona (${cp}) — CalculaTuCasa.com*\n\n` +
        `👤 *Nombre:* ${lead.nombre}\n` +
        `📞 *Teléfono:* ${contactPhone}\n` +
        (lead.email ? `✉️ *Email:* ${lead.email}\n` : "") +
        `\n📋 *Ficha del Inmueble:*\n` +
        `• *Dirección:* ${propiedad.direccion_completa}\n` +
        `• *Tipo:* ${tipoLabel} | *Superficie:* ${propiedad.m2_construidos} m²\n` +
        `• *Habitaciones:* ${habLabel} | *Estado:* ${propiedad.estado_conservacion}\n` +
        `• *Ascensor:* ${ascLabel} | *Jardín/Terraza:* ${jarLabel}\n` +
        `• *${garTitle}:* ${garLabel}\n` +
        `• *Cert. Energético:* ${certLabel}\n` +
        `• *Valoración IA:* ${precioLabel}` +
        (isHotLead || lead.utm_campaign ? `\n🔥 *Urgencia:* ${urgencia || lead.utm_campaign}` : "") +
        (estadoVenta ? `\n📌 *Situación:* ${estadoVenta}` : ""),
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
    adminMsg += `• *Email:* ${agency.email}`;

    await sendTelegramAlert(adminMsg, undefined, [
      [{ text: `💬 Enviar lead por WhatsApp a ${agency.nombre}`, url: waLink }],
    ]);
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
      consentimiento,
      consentimiento_texto,
    } = body;

    if (consentimiento !== true) {
      return NextResponse.json(
        { error: "Es necesario aceptar la política de privacidad para continuar." },
        { status: 400 }
      );
    }

    const data = await pbCreate("leads", {
      propiedad_id,
      nombre,
      telefono,
      email,
      test_variant,
      utm_source,
      utm_campaign,
      lang,
      consentimiento: true,
      consentimiento_fecha: new Date().toISOString(),
      consentimiento_texto: typeof consentimiento_texto === "string" ? consentimiento_texto.slice(0, 600) : "",
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
