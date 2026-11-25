"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { pbClient } from "@/lib/pocketbase-client";

export interface ProspectItem {
  id: string;
  nombre_agencia: string;
  persona_contacto?: string;
  telefono?: string;
  email?: string;
  web?: string;
  ciudad?: string;
  codigo_postal?: string;
  origen?: string;
  estado?: "pendiente" | "contactada" | "prueba_enviada" | "cliente" | "descartada";
  notas?: string;
  created: string;
}

type TemplateKey = "trojan" | "cold" | "followup";
type MsgLang = "es" | "ca" | "en";

const STATUS_META: Record<
  NonNullable<ProspectItem["estado"]>,
  { label: string; cls: string }
> = {
  pendiente: {
    label: "Pendiente",
    cls: "bg-slate-800 text-slate-300 border-white/10",
  },
  contactada: {
    label: "Contactada",
    cls: "bg-blue-500/15 text-blue-300 border-blue-400/30",
  },
  prueba_enviada: {
    label: "Prueba enviada",
    cls: "bg-amber-500/15 text-amber-300 border-amber-400/30",
  },
  cliente: {
    label: "Cliente activo",
    cls: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  },
  descartada: {
    label: "Descartada",
    cls: "bg-red-500/10 text-red-400 border-red-400/20",
  },
};

function isMobilePhone(phone?: string): boolean {
  if (!phone) return false;
  const digits = phone.replace(/[^\d]/g, "");
  if (!digits) return false;
  const local = digits.replace(/^34(?=\d{9}$)/, "");
  // En España, 8xx y 9xx son teléfonos fijos -> no tienen WhatsApp
  if (/^[89]\d{8}$/.test(local)) return false;
  // Móviles de España (6xx y 7xx de 9 dígitos)
  if (/^[67]\d{8}$/.test(local)) return true;
  // Otros móviles internacionales
  return digits.length >= 10 && !/^34[89]/.test(digits);
}

function cleanWaPhone(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.length === 9 && /^[67]/.test(digits)) {
    return `34${digits}`;
  }
  return digits;
}

function buildMessage(
  template: TemplateKey,
  msgLang: MsgLang,
  p: ProspectItem
): { subject: string; body: string } {
  const nombre = p.persona_contacto || p.nombre_agencia;
  const fallbackZona = msgLang === "ca" ? "la teva zona" : msgLang === "en" ? "your area" : "tu zona";
  const zona = [p.codigo_postal, p.ciudad].filter(Boolean).join(" ") || fallbackZona;
  const landingUrl = `https://calculatucasa.com/inmobiliarias?lang=${msgLang}`;

  if (msgLang === "ca") {
    if (template === "trojan") {
      return {
        subject: `Propietari interessat a vendre a ${zona}`,
        body:
          `Hola ${nombre}, t'escric des de CalculaTuCasa.com.\n\n` +
          `Tenim un propietari a ${zona} que acaba de valorar el seu habitatge i ha indicat intenció de vendre en 1-3 mesos.\n\n` +
          `Us interessa que us passi la seva fitxa completa (telèfon, adreça, m² i valoració) gratis com a prova perquè comproveu com treballem?\n\n` +
          `Més info: ${landingUrl}`,
      };
    }
    if (template === "followup") {
      return {
        subject: `Última plaça exclusiva per a ${zona}`,
        body:
          `Hola ${nombre}, aquesta setmana tanquem l'exclusivitat de leads de propietaris per a ${zona} a CalculaTuCasa.com.\n\n` +
          `Si voleu rebre un lead de prova sense compromís abans d'assignar-lo a una altra immobiliària de la zona, podeu veure-ho aquí: ${landingUrl}`,
      };
    }
    return {
      subject: `Propietaris que volen vendre a ${zona}`,
      body:
        `Hola ${nombre}, sóc de CalculaTuCasa.com.\n\n` +
        `Captem propietaris a ${zona} que taxen el seu habitatge amb IA i filtrem la seva urgència de venda. Treballem en exclusiva per codi postal i entreguem la fitxa a l'instant per Telegram o WhatsApp.\n\n` +
        `Aquí pots veure un exemple i demanar 1 lead de prova gratis: ${landingUrl}`,
    };
  }

  if (msgLang === "en") {
    if (template === "trojan") {
      return {
        subject: `Homeowner looking to sell in ${zona}`,
        body:
          `Hi ${nombre}, I'm reaching out from CalculaTuCasa.com.\n\n` +
          `We have a homeowner in ${zona} who just valued their property and indicated they want to sell within 1-3 months.\n\n` +
          `Would you like us to send you their full profile (phone, address, sqm and valuation) as a free trial lead so you can see how we work?\n\n` +
          `More info: ${landingUrl}`,
      };
    }
    if (template === "followup") {
      return {
        subject: `Last exclusive spot for ${zona}`,
        body:
          `Hi ${nombre}, this week we are closing the postal code exclusivity for homeowner leads in ${zona} at CalculaTuCasa.com.\n\n` +
          `If you'd like to receive a free trial lead with no obligation before we assign the area to another agency, check it out here: ${landingUrl}`,
      };
    }
    return {
      subject: `Homeowners looking to sell in ${zona}`,
      body:
        `Hi ${nombre}, I'm from CalculaTuCasa.com.\n\n` +
        `We capture homeowners in ${zona} who value their property with our AI and qualify their selling urgency. We work with postal code exclusivity and deliver the full profile instantly via Telegram or WhatsApp.\n\n` +
        `See a sample and request 1 free trial lead here: ${landingUrl}`,
    };
  }

  // Default: Español ("es")
  if (template === "trojan") {
    return {
      subject: `Propietario interesado en vender en ${zona}`,
      body:
        `Hola ${nombre}, te escribo desde CalculaTuCasa.com.\n\n` +
        `Tenemos un propietario en ${zona} que acaba de valorar su vivienda y ha indicado intención de vender en 1-3 meses.\n\n` +
        `¿Os interesa que os pase su ficha completa (teléfono, dirección, m² y valoración) gratis como prueba para que comprobéis cómo trabajamos?\n\n` +
        `Más info: ${landingUrl}`,
    };
  }
  if (template === "followup") {
    return {
      subject: `Última plaza exclusiva para ${zona}`,
      body:
        `Hola ${nombre}, esta semana cerramos la exclusividad de leads de propietarios para ${zona} en CalculaTuCasa.com.\n\n` +
        `Si queréis recibir un lead de prueba sin compromiso antes de asignarlo a otra inmobiliaria de la zona, podéis verlo aquí: ${landingUrl}`,
    };
  }
  return {
    subject: `Propietarios que quieren vender en ${zona}`,
    body:
      `Hola ${nombre}, soy de CalculaTuCasa.com.\n\n` +
      `Captamos propietarios en ${zona} que tasan su vivienda con IA y filtramos su urgencia de venta. Trabajamos en exclusiva por código postal y entregamos la ficha al instante por Telegram o WhatsApp.\n\n` +
      `Aquí puedes ver un ejemplo y pedir 1 lead de prueba gratis: ${landingUrl}`,
  };
}

export default function ProspectsAdmin() {
  const [collapsed, setCollapsed] = useState(true);
  const [prospects, setProspects] = useState<ProspectItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [template, setTemplate] = useState<TemplateKey>("trojan");
  const [msgLang, setMsgLang] = useState<MsgLang>("ca");

  // Form manual / lote / auto-buscador
  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [showAutoSearch, setShowAutoSearch] = useState(false);
  const [autoCiudad, setAutoCiudad] = useState("Sabadell");
  const [autoCp, setAutoCp] = useState("08201");
  const [autoSearching, setAutoSearching] = useState(false);
  const [autoResultMsg, setAutoResultMsg] = useState<string | null>(null);
  const [bulkText, setBulkText] = useState("");
  const [nombreAgencia, setNombreAgencia] = useState("");
  const [personaContacto, setPersonaContacto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [web, setWeb] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [notas, setNotas] = useState("");

  const fetchProspects = useCallback(async () => {
    setLoading(true);
    try {
      const list = await pbClient
        .collection("prospectos_inmobiliarias")
        .getFullList<ProspectItem>({ sort: "-created" });
      setProspects(list);
    } catch (err) {
      console.error("Error al cargar prospectos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProspects();
  }, [fetchProspects]);

  const pendingCount = useMemo(
    () => prospects.filter((p) => (p.estado || "pendiente") === "pendiente").length,
    [prospects]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return prospects.filter((p) => {
      const st = p.estado || "pendiente";
      if (filterStatus !== "all" && st !== filterStatus) return false;
      if (!q) return true;
      return (
        p.nombre_agencia.toLowerCase().includes(q) ||
        (p.ciudad || "").toLowerCase().includes(q) ||
        (p.codigo_postal || "").toLowerCase().includes(q) ||
        (p.telefono || "").toLowerCase().includes(q) ||
        (p.email || "").toLowerCase().includes(q)
      );
    });
  }, [prospects, filterStatus, search]);

  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreAgencia.trim()) return;
    try {
      await pbClient.collection("prospectos_inmobiliarias").create({
        nombre_agencia: nombreAgencia.trim(),
        persona_contacto: personaContacto.trim(),
        telefono: telefono.trim(),
        email: email.trim(),
        web: web.trim(),
        ciudad: ciudad.trim(),
        codigo_postal: codigoPostal.trim(),
        origen: "manual",
        estado: "pendiente",
        notas: notas.trim(),
      });
      setNombreAgencia("");
      setPersonaContacto("");
      setTelefono("");
      setEmail("");
      setWeb("");
      setCiudad("");
      setCodigoPostal("");
      setNotas("");
      setShowAdd(false);
      await fetchProspects();
    } catch (err: any) {
      alert("Error al guardar prospecto: " + err.message);
    }
  };

  const handleBulkImport = async () => {
    const lines = bulkText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    let created = 0;
    for (const line of lines) {
      const parts = line.split(/[;,|\t]/).map((s) => s.trim());
      if (!parts[0]) continue;
      try {
        await pbClient.collection("prospectos_inmobiliarias").create({
          nombre_agencia: parts[0],
          telefono: parts[1] || "",
          email: parts[2] || "",
          ciudad: parts[3] || "",
          codigo_postal: parts[4] || "",
          origen: "importado",
          estado: "pendiente",
        });
        created++;
      } catch (err) {
        console.error("Error importando línea:", line, err);
      }
    }
    setBulkText("");
    setShowBulk(false);
    await fetchProspects();
    alert(`Se importaron ${created} inmobiliarias.`);
  };

  const handleAutoSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!autoCiudad.trim() && !autoCp.trim()) return;
    setAutoSearching(true);
    setAutoResultMsg(null);
    try {
      const res = await fetch("/api/inmobiliarias/buscar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ciudad: autoCiudad.trim(),
          codigo_postal: autoCp.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al buscar agencias");
      }
      setAutoResultMsg(
        `✅ Encontradas ${data.found} agencias verificadas en ${[autoCiudad, autoCp].filter(Boolean).join(" ")}: ${data.inserted} nuevas guardadas, ${data.skipped} duplicadas omitidas.`
      );
      await fetchProspects();
    } catch (err: any) {
      setAutoResultMsg(`❌ Error: ${err.message}`);
    } finally {
      setAutoSearching(false);
    }
  };

  const handleStatusChange = async (
    id: string,
    newStatus: NonNullable<ProspectItem["estado"]>
  ) => {
    try {
      await pbClient
        .collection("prospectos_inmobiliarias")
        .update(id, { estado: newStatus });
      setProspects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, estado: newStatus } : p))
      );
    } catch (err: any) {
      alert("Error al actualizar estado: " + err.message);
    }
  };

  const handleConvertToAgency = async (p: ProspectItem) => {
    if (
      !confirm(
        `¿Dar de alta a "${p.nombre_agencia}" como Agencia Activa en el CRM y marcarla como cliente?`
      )
    ) {
      return;
    }
    try {
      await pbClient.collection("inmobiliarias").create({
        nombre: p.nombre_agencia,
        persona_contacto: p.persona_contacto || "",
        telefono: p.telefono || "Sin teléfono",
        email: p.email || "sin-email@pendiente.com",
        direccion: [p.ciudad, p.codigo_postal].filter(Boolean).join(" "),
        pais: "España",
        idioma: "Español",
        acuerdo: "Prueba gratuita",
        notas: p.notas || `Captada desde ${p.origen || "prospección"}`,
        estado: true,
      });
      await handleStatusChange(p.id, "cliente");
      alert(
        `✅ "${p.nombre_agencia}" añadida a Agencias Activas. Ya puedes asignarle sus Códigos Postales en "Agencias Inmobiliarias" -> "Asignación por Zonas".`
      );
    } catch (err: any) {
      alert("Error al convertir a agencia activa: " + err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar el prospecto "${name}"?`)) return;
    try {
      await pbClient.collection("prospectos_inmobiliarias").delete(id);
      setProspects((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert("Error al eliminar: " + err.message);
    }
  };

  return (
    <section className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-lg">
      {/* Header */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        className="px-6 py-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">🎯</span>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Captación de Agencias (Prospección B2B)
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10">
                {prospects.length}
              </span>
              {pendingCount > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
                  {pendingCount} pendientes
                </span>
              )}
            </h2>
            <p className="text-[11px] text-slate-400">
              Solicitudes desde /inmobiliarias y prospección por código postal con WhatsApp / Email en 1 clic
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <a
            href="/inmobiliarias"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold transition-colors"
          >
            Ver /inmobiliarias ↗
          </a>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="text-xs text-slate-400 hover:text-white px-2 py-1"
          >
            {collapsed ? "▼ Expandir" : "▲ Ocultar"}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="px-6 pb-6 pt-2 border-t border-white/10 space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar agencia, ciudad o CP..."
                className="px-3 py-1.5 bg-slate-950 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-emerald-400 w-56"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-white/10 rounded-lg text-xs text-slate-200 outline-none"
              >
                <option value="all">Todos los estados</option>
                <option value="pendiente">Pendientes</option>
                <option value="contactada">Contactadas</option>
                <option value="prueba_enviada">Prueba enviada</option>
                <option value="cliente">Clientes activos</option>
                <option value="descartada">Descartadas</option>
              </select>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value as TemplateKey)}
                title="Plantilla usada al pulsar WhatsApp o Email"
                className="px-3 py-1.5 bg-slate-950 border border-blue-400/30 rounded-lg text-xs text-blue-200 outline-none"
              >
                <option value="trojan">Plantilla: Tengo 1 lead en tu CP</option>
                <option value="cold">Plantilla: Primer contacto frío</option>
                <option value="followup">Plantilla: Último aviso exclusividad</option>
              </select>
              <select
                value={msgLang}
                onChange={(e) => setMsgLang(e.target.value as MsgLang)}
                title="Idioma del mensaje y del enlace a /inmobiliarias"
                className="px-3 py-1.5 bg-slate-950 border border-emerald-400/30 rounded-lg text-xs text-emerald-200 font-semibold outline-none"
              >
                <option value="ca">Idioma msg: Català (CA)</option>
                <option value="es">Idioma msg: Castellano (ES)</option>
                <option value="en">Idioma msg: English (EN)</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAutoSearch(!showAutoSearch);
                  setShowBulk(false);
                  setShowAdd(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-xs font-bold text-blue-300 border border-blue-400/40 cursor-pointer"
              >
                🔍 Auto-Buscar Agencias
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowBulk(!showBulk);
                  setShowAdd(false);
                  setShowAutoSearch(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-white/10 cursor-pointer"
              >
                📥 Importar lote
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAdd(!showAdd);
                  setShowBulk(false);
                  setShowAutoSearch(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-slate-950 cursor-pointer"
              >
                + Añadir agencia
              </button>
            </div>
          </div>

          {/* Auto-Buscador de Agencias (Flujo A integrado) */}
          {showAutoSearch && (
            <form
              onSubmit={handleAutoSearch}
              className="bg-blue-950/30 border border-blue-400/30 rounded-xl p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-blue-200">
                    🤖 Buscador Automático de Inmobiliarias (Flujo A integrado)
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Rastrea webs de inmobiliarias reales de la zona, extrae sus teléfonos y emails corporativos y las guarda sin duplicados.
                  </p>
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  value={autoCiudad}
                  onChange={(e) => setAutoCiudad(e.target.value)}
                  placeholder="Ciudad (ej. Sabadell o Terrassa)"
                  className="px-3 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-blue-400"
                />
                <input
                  type="text"
                  value={autoCp}
                  onChange={(e) => setAutoCp(e.target.value)}
                  placeholder="Código Postal (ej. 08201)"
                  className="px-3 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-blue-400"
                />
                <button
                  type="submit"
                  disabled={autoSearching}
                  className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white font-bold text-xs cursor-pointer transition-colors"
                >
                  {autoSearching
                    ? "⏳ Buscando webs y contactos (~6s)..."
                    : "🚀 Buscar y Guardar Agencias"}
                </button>
              </div>
              {autoResultMsg && (
                <p className="text-xs text-slate-200 bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2">
                  {autoResultMsg}
                </p>
              )}
            </form>
          )}

          {/* Form Añadir individual */}
          {showAdd && (
            <form
              onSubmit={handleAddSingle}
              className="bg-slate-950/70 border border-white/10 rounded-xl p-4 grid sm:grid-cols-4 gap-3"
            >
              <input
                type="text"
                required
                value={nombreAgencia}
                onChange={(e) => setNombreAgencia(e.target.value)}
                placeholder="Nombre inmobiliaria *"
                className="px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white"
              />
              <input
                type="text"
                value={personaContacto}
                onChange={(e) => setPersonaContacto(e.target.value)}
                placeholder="Persona contacto"
                className="px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white"
              />
              <input
                type="text"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Teléfono / WhatsApp"
                className="px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white"
              />
              <input
                type="text"
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                placeholder="Ciudad"
                className="px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white"
              />
              <input
                type="text"
                value={codigoPostal}
                onChange={(e) => setCodigoPostal(e.target.value)}
                placeholder="Códigos postales (08201, 08202)"
                className="px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white"
              />
              <input
                type="text"
                value={web}
                onChange={(e) => setWeb(e.target.value)}
                placeholder="Web"
                className="px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
              >
                Guardar prospecto
              </button>
            </form>
          )}

          {/* Importar lote */}
          {showBulk && (
            <div className="bg-slate-950/70 border border-white/10 rounded-xl p-4 space-y-2">
              <p className="text-xs text-slate-300 font-semibold">
                Pega una agencia por línea con formato: <code>Nombre;Teléfono;Email;Ciudad;CP</code>
              </p>
              <textarea
                rows={4}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={"Fincas Sabadell;600111222;info@fincassabadell.com;Sabadell;08201\nInmo Terrassa;611222333;hola@inmoterrassa.es;Terrassa;08221"}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white font-mono"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulk(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleBulkImport}
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                >
                  Importar líneas
                </button>
              </div>
            </div>
          )}

          {/* Tabla */}
          {loading ? (
            <p className="text-xs text-slate-400 py-4 text-center">Cargando prospectos...</p>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No hay inmobiliarias en esta vista todavía.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px]">
                    <th className="py-2.5 pr-3">Agencia</th>
                    <th className="py-2.5 px-3">Zona / CP</th>
                    <th className="py-2.5 px-3">Contacto</th>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 pl-3 text-right">Acciones rápidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((p) => {
                    const st = p.estado || "pendiente";
                    const meta = STATUS_META[st] || STATUS_META.pendiente;
                    const msg = buildMessage(template, msgLang, p);
                    const hasMobile = isMobilePhone(p.telefono);
                    const waHref =
                      p.telefono && hasMobile
                        ? `https://wa.me/${cleanWaPhone(p.telefono)}?text=${encodeURIComponent(msg.body)}`
                        : null;
                    const mailHref = p.email
                      ? `mailto:${p.email}?subject=${encodeURIComponent(msg.subject)}&body=${encodeURIComponent(msg.body)}`
                      : null;

                    return (
                      <tr key={p.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 pr-3 align-top">
                          <div className="font-bold text-white">{p.nombre_agencia}</div>
                          {p.persona_contacto && (
                            <div className="text-[11px] text-slate-400">{p.persona_contacto}</div>
                          )}
                          <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
                            {p.origen === "landing_inmobiliarias"
                              ? "🌐 Landing B2B"
                              : p.origen === "auto_buscador"
                              ? "🤖 Auto-Buscador"
                              : p.origen || "Manual"}
                          </span>
                          {p.notas && (
                            <p className="text-[11px] text-slate-400 mt-1 max-w-xs truncate" title={p.notas}>
                              {p.notas}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-3 align-top text-slate-200">
                          <div>{p.ciudad || "—"}</div>
                          {p.codigo_postal && (
                            <div className="text-[11px] text-emerald-300 font-mono">
                              CP: {p.codigo_postal}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 align-top text-slate-300 space-y-0.5">
                          {p.telefono && (
                            <div>
                              {hasMobile ? "📱" : "☎️"} {p.telefono}
                              {!hasMobile && (
                                <span className="ml-1 text-[10px] text-slate-500">(fijo)</span>
                              )}
                            </div>
                          )}
                          {p.email && <div className="text-[11px] text-slate-400">✉️ {p.email}</div>}
                          {p.web && (
                            <a
                              href={p.web.startsWith("http") ? p.web : `https://${p.web}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-blue-400 hover:underline block"
                            >
                              {p.web}
                            </a>
                          )}
                        </td>
                        <td className="py-3 px-3 align-top">
                          <select
                            value={st}
                            onChange={(e) =>
                              handleStatusChange(
                                p.id,
                                e.target.value as NonNullable<ProspectItem["estado"]>
                              )
                            }
                            className={`px-2 py-1 rounded-lg border text-[11px] font-semibold outline-none cursor-pointer ${meta.cls}`}
                          >
                            <option value="pendiente">Pendiente</option>
                            <option value="contactada">Contactada</option>
                            <option value="prueba_enviada">Prueba enviada</option>
                            <option value="cliente">Cliente activo</option>
                            <option value="descartada">Descartada</option>
                          </select>
                        </td>
                        <td className="py-3 pl-3 align-top">
                          <div className="flex flex-wrap justify-end gap-1.5">
                            {waHref && (
                              <a
                                href={waHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => {
                                  if (st === "pendiente") {
                                    handleStatusChange(p.id, "contactada");
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 font-semibold"
                              >
                                💬 WhatsApp
                              </a>
                            )}
                            {mailHref && (
                              <a
                                href={mailHref}
                                onClick={() => {
                                  if (st === "pendiente") {
                                    handleStatusChange(p.id, "contactada");
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-400/30 text-blue-300 font-semibold"
                              >
                                ✉️ Email
                              </a>
                            )}
                            {st !== "cliente" && (
                              <button
                                type="button"
                                onClick={() => handleConvertToAgency(p)}
                                className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 text-amber-300 font-semibold cursor-pointer"
                              >
                                ✅ Activar
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDelete(p.id, p.nombre_agencia)}
                              className="px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer"
                              title="Eliminar"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
