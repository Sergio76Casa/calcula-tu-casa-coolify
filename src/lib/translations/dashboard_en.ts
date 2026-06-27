export const dashboardEn = {
  dashboard: {
    header: {
      unlocked: "Report unlocked",
      ready: "Your valuation is ready!"
    },
    priceBanner: {
      estimated: "Estimated market value",
      calculated: "Calculated with Gemini 2.5 Flash · real market data",
      range: "📊 Market range",
      suggested: "Suggested price",
      minimum: "Minimum",
      maximum: "Maximum",
      rent: "🏠 Rent ~{price} €/month",
      yield: "📈 Yield {pct}%",
      score: "⭐ Investment score: {score}/10",
      trendUp: "↑ {pct}% in 12 months",
      trendDown: "↓ {pct}% in 12 months"
    },
    highlights: {
      titlePros: "✅ Strengths",
      titleCons: "⚠️ Areas to consider",
      noPros: "No highlights.",
      noCons: "No areas to improve.",
      nuevo_pro: "Property **fully renovated** — maximum appeal",
      bueno_pro: "**Good condition** — ready to move in",
      reformar_con: "Requires **full renovation** — reduces entry price",
      habs_pro: "**{hab} bedrooms** — highly demanded distribution",
      habs_con: "**{hab} bedroom** — smaller target market",
      m2_pro: "**{m2} sqm** built — surface especially valued",
      m2_con: "**{m2} sqm** — tight surface area compared to average",
      lift_pro: "**With lift** — adds between 5 and 8% in value",
      lift_con: "**Without lift** — can penalise price by up to 8%",
      garden_pro: "**Garden or plot** — increases value by 10–25%",
      garden_con: "No garden — **improvement potential** in house type"
    },
    geminiBlock: {
      strengths: "Strengths · Gemini AI",
      concerns: "Areas to Consider · Gemini AI",
      energy: "Energy Analysis · Gemini AI"
    },
    waButton: "Request confirmation visit with an expert",
    waText: "Hello, I just valued my property on CalculaTuCasa.com and would like to request a visit for a professional valuation. The address is: {address}",
    sellButton: "I want to sell for this price",
    resetButton: "Value another property",
    generatingPdf: "Generating PDF..."
  },
  sellModal: {
    step0: {
      title: "Sell with experts",
      desc: "Our local specialized agents can help you **sell at the best possible price**, hassle-free.",
      bullets: ["Free physical valuation", "Access to qualified buyers", "Complete sales management"],
      btn: "I want to sell my property →",
      info: "No obligation · Free consultation"
    },
    stepTitles: ["When do you want to sell?", "Property condition", "Confirm contact info"],
    stepDone: "All done!",
    successTitle: "Request sent!",
    successDesc: "An expert will contact you in the next few hours to coordinate your sale.",
    successBtn: "Perfect, thanks",
    urgencia: {
      menos_3_meses: { label: "Less than 3 months", sub: "Urgent sale" },
      "3_6_meses": { label: "3 – 6 months", sub: "With margin" },
      solo_info: { label: "Information only", sub: "No obligation" }
    },
    estado: {
      original: { label: "Original", sub: "Unrenovated" },
      reformada: { label: "Renovated", sub: "In perfect condition" },
      a_reformar: { label: "Needs renovation", sub: "Needs work" }
    },
    step3: {
      perfect: "Perfect!",
      usePhone: "We will use your phone {phone} to contact you and coordinate the visit.",
      confirmPhone: "Confirm the phone number to call you to coordinate the valuation visit.",
      phonePlaceholder: "+34 600 000 000"
    },
    back: "← Back",
    next: "Next →",
    confirmSend: "Confirm and send",
    wantToSell: "I want to sell 🚀",
    sending: "Sending...",
    errorPhone: "Please enter your contact phone number",
    errorApi: "Could not save. Please try again."
  },
  informe: {
    loader: {
      generating: "Generating your valuation report...",
      preparing: "We are gathering details about your property and preparing your custom PDF report."
    },
    error: {
      title: "Download error",
      back: "Back to main website",
      noId: "No report identifier has been provided.",
      notFound: "The requested report was not found.",
      noValuation: "The valuation for the property was not found."
    },
    ready: {
      title: "Your report is ready!",
      desc: "If the download didn't start automatically on your device, click the button below to download it manually.",
      downloadAgain: "Download again",
      downloadBtn: "Download PDF report",
      footer: "CalculaTuCasa.com · Intelligent Home Valuation"
    },
    preparingText: "Preparing download..."
  }
};
