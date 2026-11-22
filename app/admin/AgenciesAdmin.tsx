"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { pbClient } from "@/lib/pocketbase-client";
import { T, type Lang } from "@/lib/translations";
import ZonesTab, { type AgenciaItem, type ZonaItem, type CityBannerItem } from "./ZonesTab";

interface AgenciesAdminProps {
  lang?: Lang;
}

const LANGUAGES = ["Español", "Català", "English", "Français", "Português", "Deutsch", "Italiano"];
const PLANS = ["Prueba gratuita", "Pago por Lead (35€)", "Pago por Lead (50€)", "Exclusiva CP (200€/mes)", "Híbrido + 10% comisión"];

export default function AgenciesAdmin({ lang = "es" }: AgenciesAdminProps) {
  const [tab, setTab] = useState<"agencias" | "zonas">("agencias");
  const [agencias, setAgencias] = useState<AgenciaItem[]>([]);
  const [zonas, setZonas] = useState<ZonaItem[]>([]);
  const [cities, setCities] = useState<CityBannerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [agencySort, setAgencySort] = useState<"name_asc" | "name_desc" | "country" | "status">("name_asc");

  // Form states - Agencia (crear / editar)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [personaContacto, setPersonaContacto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [direccion, setDireccion] = useState("");
  const [pais, setPais] = useState("España");
  const [idioma, setIdioma] = useState("Español");
  const [acuerdo, setAcuerdo] = useState("Prueba gratuita");
  const [notas, setNotas] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");

  const t = T(lang).admin.agencies;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [inmos, zns, banners] = await Promise.all([
        pbClient.collection("inmobiliarias").getFullList<AgenciaItem>({ sort: "nombre" }),
        pbClient.collection("zonas_inmobiliarias").getFullList<ZonaItem>({
          expand: "inmobiliaria_id",
          sort: "codigo_postal",
        }),
        pbClient.collection("social_proof_banners").getFullList<CityBannerItem>({
          sort: "location_name",
        }),
      ]);
      setAgencias(inmos);
      setZonas(zns);
      setCities(banners);
    } catch (err) {
      console.error("Error al cargar inmobiliarias/zonas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sortedAgencias = useMemo(() => {
    const copy = [...agencias];
    copy.sort((a, b) => {
      if (agencySort === "name_asc") return a.nombre.localeCompare(b.nombre, "es");
      if (agencySort === "name_desc") return b.nombre.localeCompare(a.nombre, "es");
      if (agencySort === "country") return (a.pais || "").localeCompare(b.pais || "", "es") || a.nombre.localeCompare(b.nombre, "es");
      return Number(b.estado) - Number(a.estado) || a.nombre.localeCompare(b.nombre, "es");
    });
    return copy;
  }, [agencias, agencySort]);

  function resetForm() {
    setEditingId(null);
    setNombre("");
    setPersonaContacto("");
    setTelefono("");
    setEmail("");
    setDireccion("");
    setPais("España");
    setIdioma("Español");
    setAcuerdo("Prueba gratuita");
    setNotas("");
    setTelegramChatId("");
  }

  function startEdit(a: AgenciaItem) {
    setEditingId(a.id);
    setNombre(a.nombre || "");
    setPersonaContacto(a.persona_contacto || "");
    setTelefono(a.telefono || "");
    setEmail(a.email || "");
    setDireccion(a.direccion || "");
    setPais(a.pais || "España");
    setIdioma(a.idioma || "Español");
    setAcuerdo(a.acuerdo || "Prueba gratuita");
    setNotas(a.notas || "");
    setTelegramChatId(a.telegram_chat_id || "");
  }

  async function handleSaveAgencia(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !telefono.trim() || !email.trim()) return;
    const payload = {
      nombre: nombre.trim(),
      persona_contacto: personaContacto.trim(),
      telefono: telefono.trim(),
      email: email.trim(),
      direccion: direccion.trim(),
      pais: pais.trim() || "España",
      idioma: idioma.trim() || "Español",
      acuerdo: acuerdo.trim(),
      notas: notas.trim(),
      telegram_chat_id: telegramChatId.trim(),
    };
    try {
      if (editingId) {
        await pbClient.collection("inmobiliarias").update(editingId, payload);
      } else {
        await pbClient.collection("inmobiliarias").create({ ...payload, estado: true });
      }
      resetForm();
      fetchData();
    } catch {
      alert(t.errorSave);
    }
  }

  async function handleToggleEstado(agencia: AgenciaItem) {
    try {
      await pbClient.collection("inmobiliarias").update(agencia.id, { estado: !agencia.estado });
      fetchData();
    } catch {
      alert(t.errorToggle);
    }
  }

  async function handleDeleteAgencia(id: string) {
    if (!confirm(t.deleteConfirm)) return;
    try {
      await pbClient.collection("inmobiliarias").delete(id);
      if (editingId === id) resetForm();
      fetchData();
    } catch {
      alert(t.errorDelete);
    }
  }

  return (
    <section className="bg-slate-900 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
        >
          <span className="text-[10px]">{collapsed ? "▶" : "▼"}</span>
          <span>{t.title}</span>
        </button>

        {!collapsed && (
          <div className="flex bg-slate-800 rounded-xl p-1">
            <button
              onClick={() => setTab("agencias")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                tab === "agencias" ? "bg-blue-500 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {t.tabAgencies}
            </button>
            <button
              onClick={() => setTab("zonas")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                tab === "zonas" ? "bg-blue-500 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {t.tabZones}
            </button>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="mt-6 space-y-6">
          <p className="text-slate-500 text-xs">{t.info}</p>
          {loading && <div className="text-slate-400 text-xs mb-4">Cargando datos...</div>}

          {tab === "agencias" && (
            <div className="grid lg:grid-cols-12 gap-6 items-start">
              <form onSubmit={handleSaveAgencia} className="lg:col-span-4 bg-slate-950/40 p-4 border border-white/5 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    {editingId ? "✏️ Editar Inmobiliaria" : t.addAgency}
                  </h3>
                  {editingId && (
                    <button type="button" onClick={resetForm} className="text-[11px] text-slate-400 hover:text-white">
                      Cancelar
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">{t.nameLabel} *</label>
                  <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} required placeholder={t.namePlaceholder} className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-blue-400" />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Persona de Contacto</label>
                  <input type="text" value={personaContacto} onChange={e => setPersonaContacto(e.target.value)} placeholder="Ej. Carlos Martínez (Director)" className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-blue-400" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">{t.phoneLabel} *</label>
                    <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} required placeholder="+34 600..." className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">{t.emailLabel} *</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="agencia@web.com" className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-blue-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Dirección Comercial</label>
                  <input type="text" value={direccion} onChange={e => setDireccion(e.target.value)} placeholder="Rambla 45, Local 2, Sabadell" className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-blue-400" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">País</label>
                    <input type="text" value={pais} onChange={e => setPais(e.target.value)} placeholder="España" className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Idioma</label>
                    <select value={idioma} onChange={e => setIdioma(e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-blue-400">
                      {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Acuerdo / Tarifa</label>
                  <select value={acuerdo} onChange={e => setAcuerdo(e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-blue-400">
                    {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Telegram Chat ID (opcional · envío automático)</label>
                  <input type="text" value={telegramChatId} onChange={e => setTelegramChatId(e.target.value)} placeholder="Ej. -1001234567890 o 1576271198" className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-blue-400" />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Notas Internas</label>
                  <input type="text" value={notas} onChange={e => setNotas(e.target.value)} placeholder="Horario, preferencias, etc." className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-blue-400" />
                </div>

                <button type="submit" className="w-full py-2.5 bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold rounded-lg transition-colors">
                  {editingId ? "Guardar Cambios" : t.saveAgency}
                </button>
              </form>

              <div className="lg:col-span-8 space-y-3">
                <div className="flex justify-end">
                  <select
                    value={agencySort}
                    onChange={(e) => setAgencySort(e.target.value as "name_asc" | "name_desc" | "country" | "status")}
                    className="px-2.5 py-1.5 bg-slate-800 border border-white/10 rounded-lg text-slate-300 text-[11px] outline-none focus:border-blue-400"
                  >
                    <option value="name_asc">Ordenar: Nombre (A-Z)</option>
                    <option value="name_desc">Ordenar: Nombre (Z-A)</option>
                    <option value="country">Ordenar: País (A-Z)</option>
                    <option value="status">Ordenar: Activas primero</option>
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                        <th className="py-2">Inmobiliaria / Contacto</th>
                        <th>Datos / Dirección</th>
                        <th>País · Idioma · Acuerdo</th>
                        <th>{t.tblStatus}</th>
                        <th className="text-right">{t.tblActions}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {sortedAgencias.map(a => (
                        <tr key={a.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 pr-3">
                            <div className="font-semibold text-white">{a.nombre}</div>
                            {a.persona_contacto && <div className="text-[11px] text-blue-300">👤 {a.persona_contacto}</div>}
                            {a.notas && <div className="text-[10px] text-slate-500 italic truncate max-w-[180px]">{a.notas}</div>}
                          </td>
                          <td className="pr-3">
                            <div>{a.telefono}</div>
                            <div className="text-[10px] text-slate-400">{a.email}</div>
                            {a.direccion && <div className="text-[10px] text-slate-500 truncate max-w-[180px]">📍 {a.direccion}</div>}
                          </td>
                          <td className="pr-3">
                            <div className="flex flex-wrap gap-1">
                              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-200">{a.pais || "España"}</span>
                              <span className="px-1.5 py-0.5 rounded bg-indigo-500/15 text-[10px] text-indigo-300">{a.idioma || "Español"}</span>
                              {a.telegram_chat_id && <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-[10px] text-sky-300">✈️ Telegram</span>}
                            </div>
                            {a.acuerdo && <div className="text-[10px] text-emerald-400 mt-1">{a.acuerdo}</div>}
                          </td>
                          <td>
                            <button onClick={() => handleToggleEstado(a)} className={`px-2 py-1 rounded-full text-[9px] font-bold ${a.estado ? "bg-emerald-500/10 text-emerald-400 border border-emerald-400/20" : "bg-red-500/10 text-red-400 border border-red-400/20"}`}>
                              {a.estado ? t.active : t.paused}
                            </button>
                          </td>
                          <td className="text-right space-x-2 whitespace-nowrap">
                            <button onClick={() => startEdit(a)} className="text-blue-400 hover:text-blue-300 transition-colors">Editar</button>
                            <button onClick={() => handleDeleteAgencia(a.id)} className="text-red-400 hover:text-red-300 transition-colors">{t.delete}</button>
                          </td>
                        </tr>
                      ))}
                      {sortedAgencias.length === 0 && (
                        <tr><td colSpan={5} className="py-4 text-center text-slate-500">{t.emptyAgencies}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === "zonas" && (
            <ZonesTab
              agencias={agencias}
              zonas={zonas}
              cities={cities}
              labels={{
                addZone: t.addZone,
                cpLabel: t.cpLabel,
                cpPlaceholder: t.cpPlaceholder,
                assignedAgencyLabel: t.assignedAgencyLabel,
                selectPrompt: t.selectPrompt,
                assignZoneBtn: t.assignZoneBtn,
                deletedAgency: t.deletedAgency,
                emptyZones: t.emptyZones,
                deleteConfirm: t.deleteConfirm,
                errorAssign: t.errorAssign,
                errorDelete: t.errorDelete,
              }}
              onRefresh={fetchData}
            />
          )}
        </div>
      )}
    </section>
  );
}
