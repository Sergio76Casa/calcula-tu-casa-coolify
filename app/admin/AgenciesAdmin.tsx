"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { pbClient } from "@/lib/pocketbase-client";
import { T, type Lang } from "@/lib/translations";

interface Agencia {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  estado: boolean;
}

interface Zona {
  id: string;
  codigo_postal: string;
  inmobiliaria_id: string;
  expand?: {
    inmobiliaria_id?: Agencia;
  };
}

interface CityBanner {
  id: string;
  location_name: string;
  postal_codes: string[] | string;
}

interface AgenciesAdminProps {
  lang?: Lang;
}

function parsePostalCodes(raw: string[] | string | undefined): string[] {
  if (Array.isArray(raw)) return raw.filter((c) => /^\d{5}$/.test(String(c).trim()));
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((c) => /^\d{5}$/.test(String(c).trim()));
    } catch {
      return [];
    }
  }
  return [];
}

export default function AgenciesAdmin({ lang = "es" }: AgenciesAdminProps) {
  const [tab, setTab] = useState<"agencias" | "zonas">("agencias");
  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [cities, setCities] = useState<CityBanner[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingZones, setSavingZones] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  // Form states - Agencia
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");

  // Form states - Zona (Ciudad + CPs o Manual)
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedCps, setSelectedCps] = useState<string[]>([]);
  const [manualCp, setManualCp] = useState("");
  const [selectedAgencia, setSelectedAgencia] = useState("");

  const t = T(lang).admin.agencies;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [inmos, zns, banners] = await Promise.all([
        pbClient.collection("inmobiliarias").getFullList<Agencia>({ sort: "nombre" }),
        pbClient.collection("zonas_inmobiliarias").getFullList<Zona>({
          expand: "inmobiliaria_id",
          sort: "codigo_postal",
        }),
        pbClient.collection("social_proof_banners").getFullList<CityBanner>({
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

  const cityCpsMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const c of cities) {
      const cps = parsePostalCodes(c.postal_codes);
      if (cps.length > 0) {
        map.set(c.location_name, cps);
      }
    }
    return map;
  }, [cities]);

  const assignedCpMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const z of zonas) {
      if (z.expand?.inmobiliaria_id?.nombre) {
        map.set(z.codigo_postal, z.expand.inmobiliaria_id.nombre);
      }
    }
    return map;
  }, [zonas]);

  const activeCityCps = useMemo(() => {
    if (!selectedCity || selectedCity === "__manual__") return [];
    return cityCpsMap.get(selectedCity) ?? [];
  }, [selectedCity, cityCpsMap]);

  function handleCityChange(cityName: string) {
    setSelectedCity(cityName);
    if (cityName && cityName !== "__manual__") {
      const cps = cityCpsMap.get(cityName) ?? [];
      setSelectedCps(cps);
    } else {
      setSelectedCps([]);
    }
  }

  function toggleCp(cpCode: string) {
    setSelectedCps((prev) =>
      prev.includes(cpCode) ? prev.filter((c) => c !== cpCode) : [...prev, cpCode]
    );
  }

  async function handleAddAgencia(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !telefono.trim() || !email.trim()) return;
    try {
      await pbClient.collection("inmobiliarias").create({
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        email: email.trim(),
        estado: true,
      });
      setNombre("");
      setTelefono("");
      setEmail("");
      fetchData();
    } catch {
      alert(t.errorSave);
    }
  }

  async function handleAddZona(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAgencia) return;

    const cpsToAssign =
      selectedCity === "__manual__" || !selectedCity
        ? manualCp.trim() ? [manualCp.trim()] : []
        : selectedCps;

    if (cpsToAssign.length === 0) return;

    setSavingZones(true);
    try {
      const existingByCp = new Map(zonas.map((z) => [z.codigo_postal, z]));

      for (const code of cpsToAssign) {
        const existing = existingByCp.get(code);
        if (existing) {
          if (existing.inmobiliaria_id !== selectedAgencia) {
            await pbClient.collection("zonas_inmobiliarias").update(existing.id, {
              inmobiliaria_id: selectedAgencia,
            });
          }
        } else {
          await pbClient.collection("zonas_inmobiliarias").create({
            codigo_postal: code,
            inmobiliaria_id: selectedAgencia,
          });
        }
      }

      setManualCp("");
      setSelectedCity("");
      setSelectedCps([]);
      setSelectedAgencia("");
      fetchData();
    } catch {
      alert(t.errorAssign);
    } finally {
      setSavingZones(false);
    }
  }

  async function handleToggleEstado(agencia: Agencia) {
    try {
      await pbClient.collection("inmobiliarias").update(agencia.id, {
        estado: !agencia.estado,
      });
      fetchData();
    } catch {
      alert(t.errorToggle);
    }
  }

  async function handleDelete(collection: "inmobiliarias" | "zonas_inmobiliarias", id: string) {
    if (!confirm(t.deleteConfirm)) return;
    try {
      await pbClient.collection(collection).delete(id);
      fetchData();
    } catch {
      alert(t.errorDelete);
    }
  }

  const canSubmitZone =
    Boolean(selectedAgencia) &&
    (selectedCity === "__manual__" || !selectedCity
      ? /^\d{5}$/.test(manualCp.trim())
      : selectedCps.length > 0);

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

          {/* Tab Directorio Agencias */}
          {tab === "agencias" && (
            <div className="grid lg:grid-cols-12 gap-6">
              <form onSubmit={handleAddAgencia} className="lg:col-span-4 bg-slate-950/40 p-4 border border-white/5 rounded-xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">{t.addAgency}</h3>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">{t.nameLabel}</label>
                  <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} required placeholder={t.namePlaceholder} className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">{t.phoneLabel}</label>
                  <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} required placeholder={t.phonePlaceholder} className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">{t.emailLabel}</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder={t.emailPlaceholder} className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-blue-400" />
                </div>
                <button type="submit" className="w-full py-2.5 bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold rounded-lg transition-colors">{t.saveAgency}</button>
              </form>

              <div className="lg:col-span-8 overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                      <th className="py-2">{t.tblName}</th>
                      <th>{t.tblContact}</th>
                      <th>{t.tblStatus}</th>
                      <th className="text-right">{t.tblActions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {agencias.map(a => (
                      <tr key={a.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 font-semibold text-white">{a.nombre}</td>
                        <td>
                          <div>{a.telefono}</div>
                          <div className="text-[10px] text-slate-500">{a.email}</div>
                        </td>
                        <td>
                          <button onClick={() => handleToggleEstado(a)} className={`px-2 py-1 rounded-full text-[9px] font-bold ${a.estado ? "bg-emerald-500/10 text-emerald-400 border border-emerald-400/20" : "bg-red-500/10 text-red-400 border border-red-400/20"}`}>
                            {a.estado ? t.active : t.paused}
                          </button>
                        </td>
                        <td className="text-right">
                          <button onClick={() => handleDelete("inmobiliarias", a.id)} className="text-red-400 hover:text-red-300 transition-colors">{t.delete}</button>
                        </td>
                      </tr>
                    ))}
                    {agencias.length === 0 && (
                      <tr><td colSpan={4} className="py-4 text-center text-slate-500">{t.emptyAgencies}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab Asignación de Zonas */}
          {tab === "zonas" && (
            <div className="grid lg:grid-cols-12 gap-6">
              <form onSubmit={handleAddZona} className="lg:col-span-5 bg-slate-950/40 p-4 border border-white/5 rounded-xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">{t.addZone}</h3>

                {/* Selector de Ciudad */}
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Ciudad / Municipio</label>
                  <select
                    value={selectedCity}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-blue-400"
                  >
                    <option value="">Selecciona una ciudad o CP manual...</option>
                    {Array.from(cityCpsMap.keys()).map((cityName) => (
                      <option key={cityName} value={cityName}>
                        {cityName} ({cityCpsMap.get(cityName)?.length} CPs)
                      </option>
                    ))}
                    <option value="__manual__">✍️ Introducir un CP manual (5 dígitos)</option>
                  </select>
                </div>

                {/* CPs de la ciudad seleccionada */}
                {activeCityCps.length > 0 && (
                  <div className="bg-slate-900/70 border border-white/10 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">
                        CPs de {selectedCity} ({selectedCps.length}/{activeCityCps.length})
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedCps(activeCityCps)}
                          className="text-blue-400 hover:text-blue-300 font-semibold"
                        >
                          Todos
                        </button>
                        <span className="text-slate-600">·</span>
                        <button
                          type="button"
                          onClick={() => setSelectedCps([])}
                          className="text-slate-400 hover:text-white"
                        >
                          Ninguno
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pt-1">
                      {activeCityCps.map((code) => {
                        const checked = selectedCps.includes(code);
                        const existingOwner = assignedCpMap.get(code);
                        return (
                          <button
                            key={code}
                            type="button"
                            onClick={() => toggleCp(code)}
                            title={existingOwner ? `Actualmente en: ${existingOwner}` : "Libre"}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all flex items-center gap-1 ${
                              checked
                                ? "bg-blue-500/20 border-blue-400/50 text-blue-200"
                                : "bg-slate-800/70 border-white/10 text-slate-400 hover:text-white"
                            }`}
                          >
                            <span>{checked ? "☑" : "☐"}</span>
                            <span>{code}</span>
                            {existingOwner && <span className="text-[9px] text-amber-400">●</span>}
                          </button>
                        );
                      })}
                    </div>
                    {activeCityCps.some((c) => assignedCpMap.has(c)) && (
                      <p className="text-[10px] text-amber-400/80">
                        ● Indica que ese CP ya tiene inmobiliaria (si lo marcas, se reasignará a la nueva).
                      </p>
                    )}
                  </div>
                )}

                {/* Input manual si elige manual o no hay ciudad */}
                {(selectedCity === "__manual__" || !selectedCity) && (
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">{t.cpLabel}</label>
                    <input
                      type="text"
                      value={manualCp}
                      onChange={e => setManualCp(e.target.value)}
                      placeholder={t.cpPlaceholder}
                      maxLength={5}
                      className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-blue-400"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">{t.assignedAgencyLabel}</label>
                  <select value={selectedAgencia} onChange={e => setSelectedAgencia(e.target.value)} required className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-blue-400">
                    <option value="">{t.selectPrompt}</option>
                    {agencias.filter(a => a.estado).map(a => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={!canSubmitZone || savingZones}
                  className="w-full py-2.5 bg-blue-500 hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-colors"
                >
                  {savingZones
                    ? "Asignando zonas..."
                    : activeCityCps.length > 0
                      ? `Asignar ${selectedCps.length} CP${selectedCps.length === 1 ? "" : "s"} de ${selectedCity}`
                      : t.assignZoneBtn}
                </button>
              </form>

              <div className="lg:col-span-7 overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="sticky top-0 bg-slate-900">
                    <tr className="border-b border-white/10 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                      <th className="py-2">{t.tblCp}</th>
                      <th>{t.tblRelatedAgency}</th>
                      <th>{t.tblContactDest}</th>
                      <th className="text-right">{t.tblActions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {zonas.map(z => (
                      <tr key={z.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 font-bold text-white tracking-wider">📍 {z.codigo_postal}</td>
                        <td>{z.expand?.inmobiliaria_id?.nombre || <span className="text-red-400">{t.deletedAgency}</span>}</td>
                        <td className="text-slate-500">{z.expand?.inmobiliaria_id?.telefono || "—"}</td>
                        <td className="text-right">
                          <button onClick={() => handleDelete("zonas_inmobiliarias", z.id)} className="text-red-400 hover:text-red-300 transition-colors">{t.delete}</button>
                        </td>
                      </tr>
                    ))}
                    {zonas.length === 0 && (
                      <tr><td colSpan={4} className="py-4 text-center text-slate-500">{t.emptyZones}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
