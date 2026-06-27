export const dashboardCa = {
  dashboard: {
    header: {
      unlocked: "Informe de valoració desbloquejat",
      ready: "La teva valoració està llesta!"
    },
    priceBanner: {
      estimated: "Valor de mercat estimat",
      calculated: "Calculat amb Gemini 2.5 Flash · dades reals del mercat",
      range: "📊 Rang de mercat",
      suggested: "Preu suggerit",
      minimum: "Mínim",
      maximum: "Màxim",
      rent: "🏠 Lloguer ~{price} €/mes",
      yield: "📈 Rentab. {pct}%",
      score: "⭐ Score inversió: {score}/10",
      trendUp: "↑ {pct}% en 12 mesos",
      trendDown: "↓ {pct}% en 12 mesos"
    },
    highlights: {
      titlePros: "✅ Punts forts",
      titleCons: "⚠️ Punts a considerar",
      noPros: "Sense punts destacats.",
      noCons: "Sense punts a millorar.",
      nuevo_pro: "Propietat **completament reformada** — màxim atractiu",
      bueno_pro: "**Bon estat** de conservació — llesta per entrar a viure",
      reformar_con: "Requereix **reforma integral** — redueix el preu d'entrada",
      habs_pro: "**{hab} habitacions** — distribució molt demanada",
      habs_con: "**{hab} habitació** — mercat objectiu més reduït",
      m2_pro: "**{m2} m²** construïts — superfície especialment valorada",
      m2_con: "**{m2} m²** — superfície ajustada respecte a la mitjana",
      lift_pro: "**Amb ascensor** — afegeix entre un 5 i 8% de valor",
      lift_con: "**Sense ascensor** — pot penalitzar fins a un 8% el preu",
      garden_pro: "**Jardí o parcel·la** — incrementa el valor un 10–25%",
      garden_con: "Sense jardí — **recorregut de millora** en tipologia casa"
    },
    geminiBlock: {
      strengths: "Punts Forts · Gemini IA",
      concerns: "Punts a Considerar · Gemini IA",
      energy: "Anàlisi Energètic · Gemini IA"
    },
    waButton: "Sol·licitar visita de confirmación amb un expert",
    waText: "Hola, acabo de valorar la meva propietat a CalculaTuCasa.com i em gustaria sol·licitar una visita per a una valoració física professional. L'adreça és: {address}",
    sellButton: "Vull vendre per aquest preu",
    resetButton: "Valorar una altra propietat",
    generatingPdf: "Generant PDF..."
  },
  sellModal: {
    step0: {
      title: "Ven amb experts",
      desc: "Els nostres agents especialitzats a la teva zona poden ajudar-te a **vendre al millor preu possible**, sense complicacions.",
      bullets: ["Valoració física gratuïta", "Accés a compradors qualificats", "Gestió completa de la venda"],
      btn: "Vull vendre la meva propietat →",
      info: "Sense compromís · El contacte és gratuït"
    },
    stepTitles: ["Quan vols vendre?", "Estat de l'habitatge", "Confirma el teu contacte"],
    stepDone: "Tot llest!",
    successTitle: "Sol·licitud enviada!",
    successDesc: "Un expert es posarà en contacte amb tu en les properes hores per coordinar la teva venda.",
    successBtn: "Perfecte, gràcies",
    urgencia: {
      menos_3_meses: { label: "Menys de 3 mesos", sub: "Venda urgent" },
      "3_6_meses": { label: "3 – 6 mesos", sub: "Amb marge" },
      solo_info: { label: "Només informació", sub: "Sense compromís" }
    },
    estado: {
      original: { label: "Original", sub: "Sense reformar" },
      reformada: { label: "Reformada", sub: "En perfecte estat" },
      a_reformar: { label: "A reformar", sub: "Requereix obres" }
    },
    step3: {
      perfect: "Perfecte!",
      usePhone: "Utilitzarem el teu telèfon {phone} per contactar amb tu i coordinar la visita.",
      confirmPhone: "Confirma el telèfon al qual trucar-te per coordinar la visita de valoració.",
      phonePlaceholder: "+34 600 000 000"
    },
    back: "← Enrere",
    next: "Següent →",
    confirmSend: "Confirmar i enviar",
    wantToSell: "Vull vendre 🚀",
    sending: "Enviant...",
    errorPhone: "Introdueix el teu telèfon de contacte",
    errorApi: "No s'ha pogut guardar. Torna-ho a intentar."
  },
  informe: {
    loader: {
      generating: "Generant el teu informe de taxació...",
      preparing: "Estem recopilant les dades del teu habitatge i preparant el document PDF personalitzat."
    },
    error: {
      title: "Error en descarregar",
      back: "Tornar a la web principal",
      noId: "No s'ha proporcionat cap identificador d'informe.",
      notFound: "No s'ha trobat l'informe sol·licitat.",
      noValuation: "No s'ha trobat la valoració de la propietat."
    },
    ready: {
      title: "El teu info està llest!",
      desc: "Si la descàrrega no s'ha iniciat automàticament al teu dispositiu, fes clic al botó de sota per descarregar-lo manualment.",
      downloadAgain: "Descarregar de nou",
      downloadBtn: "Descarregar informe PDF",
      footer: "CalculaTuCasa.com · Valoració Intel·ligent d'Habitatges"
    },
    preparingText: "Preparant descàrrega..."
  }
};
