"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/translations";

function detectLang(): Lang {
  if (typeof window !== "undefined") {
    const param = new URLSearchParams(window.location.search).get("lang")?.toLowerCase();
    if (param === "ca" || param === "es" || param === "en") return param;
  }
  if (typeof navigator === "undefined") return "es";
  const code = navigator.language.toLowerCase();
  if (code.startsWith("ca")) return "ca";
  if (code.startsWith("en")) return "en";
  return "es";
}

const COPY: Record<
  Lang,
  {
    badgeHeader: string;
    ctaHeader: string;
    heroPill: string;
    heroTitle1: string;
    heroTitleHighlight: string;
    heroDescBefore: string;
    heroDescStrong: string;
    heroDescAfter: string;
    heroCtaPrimary: string;
    heroCtaSecondary: string;
    stat1Label: string;
    stat2Label: string;
    stat3Label: string;
    mockTitle: string;
    mockSub: string;
    mockBadge: string;
    mockLeadHeader: string;
    mockName: string;
    mockPhone: string;
    mockAddress: string;
    mockType: string;
    mockTypeVal: string;
    mockArea: string;
    mockRooms: string;
    mockRoomsVal: string;
    mockStatus: string;
    mockStatusVal: string;
    mockElevator: string;
    mockYes: string;
    mockParking: string;
    mockAiVal: string;
    mockNote: string;
    stepsTitle: string;
    stepsSub: string;
    stepPrefix: string;
    steps: { num: string; title: string; desc: string }[];
    formTitle: string;
    formSub: string;
    submittedTitle: string;
    submittedDesc1: string;
    submittedDesc2: string;
    submittedDesc3: string;
    lblAgency: string;
    phAgency: string;
    lblContact: string;
    phContact: string;
    lblPhone: string;
    phPhone: string;
    lblEmail: string;
    phEmail: string;
    lblCity: string;
    phCity: string;
    lblCp: string;
    phCp: string;
    lblWebNotes: string;
    phWeb: string;
    phNotes: string;
    errGeneric: string;
    errConn: string;
    btnSending: string;
    btnSubmit: string;
    footerLink: string;
  }
> = {
  es: {
    badgeHeader: "Para Agencias",
    ctaHeader: "Pedir lead de prueba gratis",
    heroPill: "Exclusividad por Código Postal · Sin permanencia",
    heroTitle1: "Propietarios reales de tu zona ",
    heroTitleHighlight: "que quieren vender su vivienda",
    heroDescBefore:
      "Captamos propietarios en tu ciudad que acaban de tasar su piso o casa con nuestra IA, filtramos su plazo de venta y te enviamos la ficha completa al instante por ",
    heroDescStrong: "Telegram o WhatsApp",
    heroDescAfter: ". Sin compartir el contacto con otras agencias.",
    heroCtaPrimary: "Solicitar 1 lead de prueba gratis →",
    heroCtaSecondary: "Ver ejemplo de ficha",
    stat1Label: "Exclusivo en tu CP",
    stat2Label: "Entrega en tiempo real",
    stat3Label: "Primer lead de prueba",
    mockTitle: "Así recibes cada propietario",
    mockSub: "Entrega instantánea por Telegram o WhatsApp",
    mockBadge: "🔥 Venta 1–3 meses",
    mockLeadHeader: "🏠 Nuevo Propietario en tu Zona (08201)",
    mockName: "Nombre:",
    mockPhone: "Teléfono:",
    mockAddress: "Dirección:",
    mockType: "Tipo:",
    mockTypeVal: "Piso",
    mockArea: "Superficie:",
    mockRooms: "Habitaciones:",
    mockRoomsVal: "3 hab.",
    mockStatus: "Estado:",
    mockStatusVal: "Buen estado",
    mockElevator: "Ascensor:",
    mockYes: "Sí",
    mockParking: "Parking:",
    mockAiVal: "Valoración IA:",
    mockNote: "Llamas al propietario en los primeros minutos mientras tiene fresca su valoración.",
    stepsTitle: "Cómo funciona para tu inmobiliaria",
    stepsSub: "Sin portales saturados ni subastas entre 10 agencias.",
    stepPrefix: "PASO",
    steps: [
      {
        num: "01",
        title: "Captamos en tu código postal",
        desc: "Nuestras campañas segmentadas atraen a propietarios de tu zona que buscan saber cuánto vale su vivienda hoy.",
      },
      {
        num: "02",
        title: "Cualificamos el inmueble y la urgencia",
        desc: "Recogemos m², habitaciones, ascensor, parking, estado y el plazo en el que piensan vender.",
      },
      {
        num: "03",
        title: "Exclusividad en tu móvil",
        desc: "El lead entra directo a tu Telegram o WhatsApp. Solo una agencia activa por cada código postal.",
      },
    ],
    formTitle: "Solicita tu primer lead de prueba gratis",
    formSub:
      "Comprueba si tus códigos postales siguen disponibles y recibe un propietario de prueba sin compromiso.",
    submittedTitle: "¡Solicitud recibida!",
    submittedDesc1: "Hemos registrado a ",
    submittedDesc2: ". Revisaremos la disponibilidad en ",
    submittedDesc3: " y te contactaremos por WhatsApp en breve.",
    lblAgency: "Nombre de la inmobiliaria *",
    phAgency: "Ej. Fincas Vallès",
    lblContact: "Persona de contacto",
    phContact: "Ej. Carlos Ruiz",
    lblPhone: "Teléfono / WhatsApp *",
    phPhone: "Ej. 600 123 456",
    lblEmail: "Email comercial",
    phEmail: "info@tuagencia.com",
    lblCity: "Ciudad / Zona principal *",
    phCity: "Ej. Sabadell / Terrassa",
    lblCp: "Códigos Postales de interés",
    phCp: "Ej. 08201, 08202, 08205",
    lblWebNotes: "Web o comentarios (opcional)",
    phWeb: "https://tuagencia.com",
    phNotes: "Indícanos si prefieres recibir los leads por Telegram o WhatsApp...",
    errGeneric: "No se pudo enviar la solicitud.",
    errConn: "Error de conexión. Inténtalo de nuevo.",
    btnSending: "Enviando solicitud...",
    btnSubmit: "Solicitar lead de prueba gratis",
    footerLink: "Ir a la calculadora de propietarios",
  },
  ca: {
    badgeHeader: "Per a Agències",
    ctaHeader: "Demanar lead de prova gratis",
    heroPill: "Exclusivitat per Codi Postal · Sense permanència",
    heroTitle1: "Propietaris reals de la teva zona ",
    heroTitleHighlight: "que volen vendre el seu habitatge",
    heroDescBefore:
      "Captem propietaris a la teva ciutat que acaben de taxar el seu pis o casa amb la nostra IA, filtrem el termini de venda i t'enviem la fitxa completa a l'instant per ",
    heroDescStrong: "Telegram o WhatsApp",
    heroDescAfter: ". Sense compartir el contacte amb altres agències.",
    heroCtaPrimary: "Sol·licitar 1 lead de prova gratis →",
    heroCtaSecondary: "Veure exemple de fitxa",
    stat1Label: "Exclusiu al teu CP",
    stat2Label: "Entrega en temps real",
    stat3Label: "Primer lead de prova",
    mockTitle: "Així reps cada propietari",
    mockSub: "Entrega instantània per Telegram o WhatsApp",
    mockBadge: "🔥 Venda 1–3 mesos",
    mockLeadHeader: "🏠 Nou Propietari a la teva Zona (08201)",
    mockName: "Nom:",
    mockPhone: "Telèfon:",
    mockAddress: "Adreça:",
    mockType: "Tipus:",
    mockTypeVal: "Pis",
    mockArea: "Superfície:",
    mockRooms: "Habitacions:",
    mockRoomsVal: "3 hab.",
    mockStatus: "Estat:",
    mockStatusVal: "Bon estat",
    mockElevator: "Ascensor:",
    mockYes: "Sí",
    mockParking: "Pàrquing:",
    mockAiVal: "Valoració IA:",
    mockNote: "Truques al propietari en els primers minuts mentre té fresca la seva valoració.",
    stepsTitle: "Com funciona per a la teva immobiliària",
    stepsSub: "Sense portals saturats ni subhastes entre 10 agències.",
    stepPrefix: "PAS",
    steps: [
      {
        num: "01",
        title: "Captem al teu codi postal",
        desc: "Les nostres campanyes segmentades atreuen propietaris de la teva zona que volen saber quant val el seu habitatge avui.",
      },
      {
        num: "02",
        title: "Qualifiquem l'immoble i la urgència",
        desc: "Recollim m², habitacions, ascensor, pàrquing, estat i el termini en què pensen vendre.",
      },
      {
        num: "03",
        title: "Exclusivitat al teu mòbil",
        desc: "El lead entra directe al teu Telegram o WhatsApp. Només una agència activa per cada codi postal.",
      },
    ],
    formTitle: "Sol·licita el teu primer lead de prova gratis",
    formSub:
      "Comprova si els teus codis postals segueixen disponibles i rep un propietari de prova sense compromís.",
    submittedTitle: "Sol·licitud rebuda!",
    submittedDesc1: "Hem registrat ",
    submittedDesc2: ". Revisarem la disponibilitat a ",
    submittedDesc3: " i et contactarem per WhatsApp ben aviat.",
    lblAgency: "Nom de la immobiliària *",
    phAgency: "Ex. Finques Vallès",
    lblContact: "Persona de contacte",
    phContact: "Ex. Carles Puig",
    lblPhone: "Telèfon / WhatsApp *",
    phPhone: "Ex. 600 123 456",
    lblEmail: "Email comercial",
    phEmail: "info@tevaagencia.com",
    lblCity: "Ciutat / Zona principal *",
    phCity: "Ex. Sabadell / Terrassa",
    lblCp: "Codis Postals d'interès",
    phCp: "Ex. 08201, 08202, 08205",
    lblWebNotes: "Web o comentaris (opcional)",
    phWeb: "https://tevaagencia.com",
    phNotes: "Indica'ns si prefereixes rebre els leads per Telegram o WhatsApp...",
    errGeneric: "No s'ha pogut enviar la sol·licitud.",
    errConn: "Error de connexió. Torna-ho a intentar.",
    btnSending: "Enviant sol·licitud...",
    btnSubmit: "Sol·licitar lead de prova gratis",
    footerLink: "Anar a la calculadora de propietaris",
  },
  en: {
    badgeHeader: "For Agencies",
    ctaHeader: "Request free trial lead",
    heroPill: "Postal Code Exclusivity · No lock-in",
    heroTitle1: "Real homeowners in your area ",
    heroTitleHighlight: "looking to sell their property",
    heroDescBefore:
      "We capture homeowners in your city who just valued their flat or house with our AI, qualify their selling timeline, and send the full profile instantly via ",
    heroDescStrong: "Telegram or WhatsApp",
    heroDescAfter: ". Never shared with competing agencies.",
    heroCtaPrimary: "Request 1 free trial lead →",
    heroCtaSecondary: "See lead sample",
    stat1Label: "Exclusive in your zip",
    stat2Label: "Real-time delivery",
    stat3Label: "First trial lead",
    mockTitle: "How you receive each homeowner",
    mockSub: "Instant delivery via Telegram or WhatsApp",
    mockBadge: "🔥 Selling in 1–3 months",
    mockLeadHeader: "🏠 New Homeowner in Your Area (08201)",
    mockName: "Name:",
    mockPhone: "Phone:",
    mockAddress: "Address:",
    mockType: "Type:",
    mockTypeVal: "Apartment",
    mockArea: "Area:",
    mockRooms: "Bedrooms:",
    mockRoomsVal: "3 beds",
    mockStatus: "Condition:",
    mockStatusVal: "Good condition",
    mockElevator: "Elevator:",
    mockYes: "Yes",
    mockParking: "Parking:",
    mockAiVal: "AI Valuation:",
    mockNote: "Call the homeowner within minutes while their valuation is still fresh.",
    stepsTitle: "How it works for your agency",
    stepsSub: "No saturated portals or bidding wars against 10 agencies.",
    stepPrefix: "STEP",
    steps: [
      {
        num: "01",
        title: "We capture in your postal code",
        desc: "Our targeted campaigns attract local homeowners looking to find out what their property is worth today.",
      },
      {
        num: "02",
        title: "We qualify property & urgency",
        desc: "We collect sqm, bedrooms, elevator, parking, condition, and their expected selling timeframe.",
      },
      {
        num: "03",
        title: "Exclusivity on your phone",
        desc: "The lead lands directly in your Telegram or WhatsApp. Only one active agency per postal code.",
      },
    ],
    formTitle: "Request your first free trial lead",
    formSub:
      "Check if your postal codes are still available and receive a trial homeowner lead with zero commitment.",
    submittedTitle: "Request received!",
    submittedDesc1: "We have registered ",
    submittedDesc2: ". We will check availability in ",
    submittedDesc3: " and reach out via WhatsApp shortly.",
    lblAgency: "Agency name *",
    phAgency: "e.g. Prime Estates",
    lblContact: "Contact person",
    phContact: "e.g. Alex Smith",
    lblPhone: "Phone / WhatsApp *",
    phPhone: "e.g. +34 600 123 456",
    lblEmail: "Business email",
    phEmail: "info@youragency.com",
    lblCity: "Main city / area *",
    phCity: "e.g. Sabadell / Terrassa",
    lblCp: "Target postal codes",
    phCp: "e.g. 08201, 08202, 08205",
    lblWebNotes: "Website or comments (optional)",
    phWeb: "https://youragency.com",
    phNotes: "Let us know if you prefer receiving leads via Telegram or WhatsApp...",
    errGeneric: "Could not submit your request.",
    errConn: "Connection error. Please try again.",
    btnSending: "Sending request...",
    btnSubmit: "Request free trial lead",
    footerLink: "Go to homeowner calculator",
  },
};

export default function InmobiliariasClient() {
  const [lang, setLang] = useState<Lang>("es");
  const [nombreAgencia, setNombreAgencia] = useState("");
  const [personaContacto, setPersonaContacto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [web, setWeb] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [notas, setNotas] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLang(detectLang());
  }, []);

  const c = COPY[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/inmobiliarias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_agencia: nombreAgencia,
          persona_contacto: personaContacto,
          telefono,
          email,
          web,
          ciudad,
          codigo_postal: codigoPostal,
          notas,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || c.errGeneric);
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || c.errConn);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500/30">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-emerald-500/10 blur-[130px] rounded-full" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-blue-500/10 blur-[130px] rounded-full" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-slate-950/70 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20">
              C
            </div>
            <div>
              <span className="font-bold text-white tracking-tight">CalculaTuCasa</span>
              <span className="ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {c.badgeHeader}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
              {(["es", "ca", "en"] as Lang[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    lang === code
                      ? "bg-blue-500 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {code.toUpperCase()}
                </button>
              ))}
            </div>
            <a
              href="#solicitar-prueba"
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition-colors shadow-lg shadow-emerald-500/20"
            >
              {c.ctaHeader}
            </a>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-5 py-12 sm:py-16 space-y-20">
        {/* Hero */}
        <section className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {c.heroPill}
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              {c.heroTitle1}
              <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                {c.heroTitleHighlight}
              </span>
            </h1>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
              {c.heroDescBefore}
              <strong className="text-white">{c.heroDescStrong}</strong>
              {c.heroDescAfter}
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <a
                href="#solicitar-prueba"
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all"
              >
                {c.heroCtaPrimary}
              </a>
              <a
                href="#como-funciona"
                className="px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm transition-all"
              >
                {c.heroCtaSecondary}
              </a>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10 text-center sm:text-left">
              <div>
                <p className="text-xl sm:text-2xl font-extrabold text-white">100%</p>
                <p className="text-xs text-slate-400">{c.stat1Label}</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-extrabold text-emerald-400">&lt; 5 seg</p>
                <p className="text-xs text-slate-400">{c.stat2Label}</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-extrabold text-white">0 €</p>
                <p className="text-xs text-slate-400">{c.stat3Label}</p>
              </div>
            </div>
          </div>

          {/* Mockup ficha de lead */}
          <div id="como-funciona" className="bg-slate-900/90 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 text-sm font-bold">
                  🤖
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{c.mockTitle}</p>
                  <p className="text-[11px] text-emerald-400">{c.mockSub}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[11px] font-bold">
                {c.mockBadge}
              </span>
            </div>

            <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 text-xs sm:text-sm space-y-2 text-slate-200 font-mono leading-relaxed">
              <p className="text-emerald-300 font-bold">{c.mockLeadHeader}</p>
              <p>👤 <span className="text-slate-400">{c.mockName}</span> Laura Martínez</p>
              <p>📞 <span className="text-slate-400">{c.mockPhone}</span> 612 345 678</p>
              <div className="border-t border-white/10 my-2 pt-2 space-y-1">
                <p>📍 <span className="text-slate-400">{c.mockAddress}</span> Rambla d&apos;Ègara, Sabadell (08201)</p>
                <p>🏢 <span className="text-slate-400">{c.mockType}</span> {c.mockTypeVal} | <span className="text-slate-400">{c.mockArea}</span> 98 m²</p>
                <p>🛏️ <span className="text-slate-400">{c.mockRooms}</span> {c.mockRoomsVal} | <span className="text-slate-400">{c.mockStatus}</span> {c.mockStatusVal}</p>
                <p>🛗 <span className="text-slate-400">{c.mockElevator}</span> {c.mockYes} | 🅿️ <span className="text-slate-400">{c.mockParking}</span> {c.mockYes}</p>
                <p>💶 <span className="text-slate-400">{c.mockAiVal}</span> 268.000 €</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 text-center">{c.mockNote}</p>
          </div>
        </section>

        {/* 3 pasos */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">{c.stepsTitle}</h2>
            <p className="text-sm text-slate-400">{c.stepsSub}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {c.steps.map((item) => (
              <div
                key={item.num}
                className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-3 hover:border-emerald-500/30 transition-colors"
              >
                <span className="inline-block text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {c.stepPrefix} {item.num}
                </span>
                <h3 className="text-lg font-bold text-white">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Formulario B2B */}
        <section id="solicitar-prueba" className="max-w-2xl mx-auto">
          <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">{c.formTitle}</h2>
              <p className="text-sm text-slate-400">{c.formSub}</p>
            </div>

            {submitted ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-3">
                <div className="text-3xl">✅</div>
                <h3 className="text-lg font-bold text-emerald-300">{c.submittedTitle}</h3>
                <p className="text-sm text-slate-300">
                  {c.submittedDesc1}
                  <strong className="text-white">{nombreAgencia}</strong>
                  {c.submittedDesc2}
                  <strong className="text-white">{codigoPostal || ciudad}</strong>
                  {c.submittedDesc3}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {c.lblAgency}
                    </label>
                    <input
                      type="text"
                      required
                      value={nombreAgencia}
                      onChange={(e) => setNombreAgencia(e.target.value)}
                      placeholder={c.phAgency}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {c.lblContact}
                    </label>
                    <input
                      type="text"
                      value={personaContacto}
                      onChange={(e) => setPersonaContacto(e.target.value)}
                      placeholder={c.phContact}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {c.lblPhone}
                    </label>
                    <input
                      type="tel"
                      required
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder={c.phPhone}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {c.lblEmail}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={c.phEmail}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {c.lblCity}
                    </label>
                    <input
                      type="text"
                      required
                      value={ciudad}
                      onChange={(e) => setCiudad(e.target.value)}
                      placeholder={c.phCity}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {c.lblCp}
                    </label>
                    <input
                      type="text"
                      value={codigoPostal}
                      onChange={(e) => setCodigoPostal(e.target.value)}
                      placeholder={c.phCp}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {c.lblWebNotes}
                  </label>
                  <input
                    type="text"
                    value={web}
                    onChange={(e) => setWeb(e.target.value)}
                    placeholder={c.phWeb}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-emerald-400 mb-2"
                  />
                  <textarea
                    rows={2}
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder={c.phNotes}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-emerald-400 resize-none"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  {submitting ? c.btnSending : c.btnSubmit}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-6 text-center text-xs text-slate-500">
        <p>
          CalculaTuCasa.com ·{" "}
          <Link href="/" className="text-slate-400 hover:text-white underline">
            {c.footerLink}
          </Link>
        </p>
      </footer>
    </div>
  );
}
