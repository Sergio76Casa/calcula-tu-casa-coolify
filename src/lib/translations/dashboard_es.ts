export const dashboardEs = {
  dashboard: {
    header: {
      unlocked: "Informe de valoración desbloqueado",
      ready: "¡Tu valoración de vivienda está lista!"
    },
    priceBanner: {
      estimated: "Valor de mercado estimado",
      calculated: "Calculado con Gemini 2.5 Flash · datos reales del mercado",
      range: "📊 Rango de mercado",
      suggested: "Precio sugerido",
      minimum: "Mínimo",
      maximum: "Máximo",
      rent: "🏠 Alquiler ~{price} €/mes",
      yield: "📈 Rentab. {pct}%",
      score: "⭐ Score inversión: {score}/10",
      trendUp: "↑ {pct}% en 12 meses",
      trendDown: "↓ {pct}% en 12 meses"
    },
    highlights: {
      titlePros: "✅ Puntos fuertes",
      titleCons: "⚠️ Puntos a considerar",
      noPros: "Sin puntos destacados.",
      noCons: "Sin puntos a mejorar.",
      nuevo_pro: "Propiedad **completamente reformada** — máximo atractivo",
      bueno_pro: "**Buen estado** de conservación — lista para entrar a vivir",
      reformar_con: "Requiere **reforma integral** — reduce el precio de entrada",
      habs_pro: "**{hab} habitaciones** — distribución muy demandada",
      habs_con: "**{hab} habitación** — mercado objetivo más reducido",
      m2_pro: "**{m2} m²** construidos — superficie especialmente valorada",
      m2_con: "**{m2} m²** — superficie ajustada respecto a la media",
      lift_pro: "**Con ascensor** — añade entre un 5 y 8% de valor",
      lift_con: "**Sin ascensor** — puede penalizar hasta un 8% el precio",
      garden_pro: "**Jardín o parcela** — incrementa el valor un 10–25%",
      garden_con: "Sin jardín — **recorrido de mejora** en tipología casa"
    },
    geminiBlock: {
      strengths: "Puntos Fuertes · Gemini IA",
      concerns: "Puntos a Considerar · Gemini IA",
      energy: "Análisis Energético · Gemini IA"
    },
    waButton: "Solicitar visita de confirmación con un experto",
    waText: "Hola, acabo de valorar mi propiedad en CalculaTuCasa.com y me gustaría solicitar una visita para una valoración física profesional. La dirección es: {address}",
    sellButton: "Quiero vender por este precio",
    resetButton: "Valorar otra propiedad",
    generatingPdf: "Generando PDF..."
  },
  sellModal: {
    step0: {
      title: "Vende con expertos",
      desc: "Nuestros agentes especializados en tu zona pueden ayudarte a **vender al mejor precio posible**, sin complicaciones.",
      bullets: ["Valoración física gratuita", "Acceso a compradores cualificados", "Gestión completa de la venta"],
      btn: "Quiero vender mi propiedad →",
      info: "Sin compromiso · El contacto es gratuito"
    },
    stepTitles: ["¿Cuándo quieres vender?", "Estado de la vivienda", "Confirma tu contacto"],
    stepDone: "¡Todo listo!",
    successTitle: "¡Solicitud enviada!",
    successDesc: "Un experto se pondrá en contacto contigo en las próximas horas para coordinar tu venta.",
    successBtn: "Perfecto, gracias",
    urgencia: {
      menos_3_meses: { label: "Menos de 3 meses", sub: "Venta urgente" },
      "3_6_meses": { label: "3 – 6 meses", sub: "Con margen" },
      solo_info: { label: "Solo información", sub: "Sin compromiso" }
    },
    estado: {
      original: { label: "Original", sub: "Sin reformar" },
      reformada: { label: "Reformada", sub: "En perfecto estado" },
      a_reformar: { label: "A reformar", sub: "Requiere obras" }
    },
    step3: {
      perfect: "¡Perfecto!",
      usePhone: "Usaremos tu teléfono {phone} para contactarte y coordinar la visita.",
      confirmPhone: "Confirma el teléfono al que llamarte para coordinar la visita de valoración.",
      phonePlaceholder: "+34 600 000 000"
    },
    back: "← Atrás",
    next: "Siguiente →",
    confirmSend: "Confirmar y enviar",
    wantToSell: "Quiero vender 🚀",
    sending: "Enviando...",
    errorPhone: "Introduce tu teléfono de contacto",
    errorApi: "No se pudo guardar. Inténtalo de nuevo."
  },
  informe: {
    loader: {
      generating: "Generando tu informe de tasación...",
      preparing: "Estamos recopilando los datos de tu vivienda y preparando el documento PDF personalizado."
    },
    error: {
      title: "Error al descargar",
      back: "Volver a la web principal",
      noId: "No se ha proporcionado ningún identificador de informe.",
      notFound: "No se encontró el informe solicitado.",
      noValuation: "No se encontró la valoración de la propiedad."
    },
    ready: {
      title: "¡Tu informe está listo!",
      desc: "Si la descarga no se ha iniciado automáticamente en tu dispositivo, haz clic en el botón de abajo para descargarlo manualmente.",
      downloadAgain: "Descargar de nuevo",
      downloadBtn: "Descargar informe PDF",
      footer: "CalculaTuCasa.com · Valoración Inteligente de Viviendas"
    },
    preparingText: "Preparando descarga..."
  }
};
