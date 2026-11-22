"use client";

import { useState, useMemo } from "react";
import { pbClient } from "@/lib/pocketbase-client";

export interface AgenciaItem {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  estado: boolean;
  persona_contacto?: string;
  direccion?: string;
  pais?: string;
  idioma?: string;
  acuerdo?: string;
  notas?: string;
  telegram_chat_id?: string;
}

export interface ZonaItem {
  id: string;
  codigo_postal: string;
  inmobiliaria_id: string;
  expand?: {
    inmobiliaria_id?: AgenciaItem;
  };
}

export interface CityBannerItem {
  id: string;
  location_name: string;
  postal_codes: string[] | string;
}

interface ZonesTabProps {
  agencias: AgenciaItem[];
  zonas: ZonaItem[];
  cities: CityBannerItem[];
  labels: {
    addZone: string;
    cpLabel: string;
    cpPlaceholder: string;
    assignedAgencyLabel: string;
    selectPrompt: string;
    assignZoneBtn: string;
    deletedAgency: string;
    emptyZones: string;
    deleteConfirm: string;
    errorAssign: string;
    errorDelete: string;
  };
  onRefresh: () => void;
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

export default function ZonesTab({ agencias, zonas, cities, labels, onRefresh }: ZonesTabProps) {
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCps, setSelectedCps] = useState<string[]>([]);
  const [manualCp, setManualCp] = useState("");
  const [selectedAgencia, setSelectedAgencia] = useState("");
  const [savingZones, setSavingZones] = useState(false);

  // Estado de tabla agrupada por inmobiliaria
  const [expandedAgencies, setExpandedAgencies] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useState<"name_asc" | "name_desc" | "cps_desc">("name_asc");

  const cityCpsMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const c of cities) {
      const cps = parsePostalCodes(c.postal_codes);
      if (cps.length > 0) map.set(c.location_name, cps);
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

  // Agrupar zonas por inmobiliaria
  const groupedAgencies = useMemo(() => {
    const groups = new Map<
      string,
      { agencyId: string; nombre: string; telefono: string; deleted: boolean; items: ZonaItem[] }
    >();

    for (const z of zonas) {
      const ag = z.expand?.inmobiliaria_id;
      const key = z.inmobiliaria_id || "__deleted__";
      if (!groups.has(key)) {
        groups.set(key, {
          agencyId: key,
          nombre: ag?.nombre || labels.deletedAgency,
          telefono: ag?.telefono || "—",
          deleted: !ag,
          items: [],
        });
      }
      groups.get(key)!.items.push(z);
    }

    const list = Array.from(groups.values());
    list.sort((a, b) => {
      if (sortBy === "name_asc") return a.nombre.localeCompare(b.nombre, "es");
      if (sortBy === "name_desc") return b.nombre.localeCompare(a.nombre, "es");
      return b.items.length - a.items.length;
    });
    return list;
  }, [zonas, sortBy, labels.deletedAgency]);

  function handleCityChange(cityName: string) {
    setSelectedCity(cityName);
    setSelectedCps(cityName && cityName !== "__manual__" ? cityCpsMap.get(cityName) ?? [] : []);
  }

  function toggleCp(code: string) {
    setSelectedCps((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  }

  function toggleExpand(agencyId: string) {
    setExpandedAgencies((prev) => ({ ...prev, [agencyId]: !prev[agencyId] }));
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
      onRefresh();
    } catch {
      alert(labels.errorAssign);
    } finally {
      setSavingZones(false);
    }
  }

  async function handleDeleteSingle(id: string) {
    if (!confirm(labels.deleteConfirm)) return;
    try {
      await pbClient.collection("zonas_inmobiliarias").delete(id);
      onRefresh();
    } catch {
      alert(labels.errorDelete);
    }
  }

  async function handleDeleteAgencyZones(items: ZonaItem[], agencyName: string) {
    if (!confirm(`¿Eliminar los ${items.length} CPs asignados a "${agencyName}"?`)) return;
    try {
      await Promise.all(items.map((z) => pbClient.collection("zonas_inmobiliarias").delete(z.id)));
      onRefresh();
    } catch {
      alert(labels.errorDelete);
    }
  }

  const canSubmitZone =
    Boolean(selectedAgencia) &&
    (selectedCity === "__manual__" || !selectedCity
      ? /^\d{5}$/.test(manualCp.trim())
      : selectedCps.length > 0);

  return (
    <div className="grid lg:grid-cols-12 gap-6 items-start">
      <form onSubmit={handleAddZona} className="lg:col-span-5 bg-slate-950/40 p-4 border border-white/5 rounded-xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">{labels.addZone}</h3>

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

        {activeCityCps.length > 0 && (
          <div className="bg-slate-900/70 border border-white/10 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium">
                CPs de {selectedCity} ({selectedCps.length}/{activeCityCps.length})
              </span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setSelectedCps(activeCityCps)} className="text-blue-400 hover:text-blue-300 font-semibold">
                  Todos
                </button>
                <span className="text-slate-600">·</span>
                <button type="button" onClick={() => setSelectedCps([])} className="text-slate-400 hover:text-white">
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
                ● Ya asignado (si lo marcas, se reasignará a la nueva agencia).
              </p>
            )}
          </div>
        )}

        {(selectedCity === "__manual__" || !selectedCity) && (
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">{labels.cpLabel}</label>
            <input
              type="text"
              value={manualCp}
              onChange={(e) => setManualCp(e.target.value)}
              placeholder={labels.cpPlaceholder}
              maxLength={5}
              className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-blue-400"
            />
          </div>
        )}

        <div>
          <label className="block text-[11px] text-slate-500 mb-1">{labels.assignedAgencyLabel}</label>
          <select
            value={selectedAgencia}
            onChange={(e) => setSelectedAgencia(e.target.value)}
            required
            className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-blue-400"
          >
            <option value="">{labels.selectPrompt}</option>
            {agencias.filter((a) => a.estado).map((a) => (
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
              : labels.assignZoneBtn}
        </button>
      </form>

      {/* Lista agrupada por inmobiliaria (plegada por defecto) + ordenación */}
      <div className="lg:col-span-7 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400">
            {groupedAgencies.length} inmobiliaria{groupedAgencies.length === 1 ? "" : "s"} · {zonas.length} CPs totales
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "name_asc" | "name_desc" | "cps_desc")}
            className="px-2.5 py-1.5 bg-slate-800 border border-white/10 rounded-lg text-slate-300 text-[11px] outline-none focus:border-blue-400"
          >
            <option value="name_asc">Ordenar: Nombre (A-Z)</option>
            <option value="name_desc">Ordenar: Nombre (Z-A)</option>
            <option value="cps_desc">Ordenar: Más CPs primero</option>
          </select>
        </div>

        <div className="divide-y divide-white/5 border border-white/10 rounded-xl bg-slate-950/30 overflow-hidden">
          {groupedAgencies.map((group) => {
            const isOpen = !!expandedAgencies[group.agencyId];
            return (
              <div key={group.agencyId}>
                <div className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors gap-3">
                  <button
                    type="button"
                    onClick={() => toggleExpand(group.agencyId)}
                    className="flex items-center gap-2.5 text-left flex-1 min-w-0 cursor-pointer"
                  >
                    <span className="text-[10px] text-slate-400 w-3">{isOpen ? "▼" : "▶"}</span>
                    <div className="min-w-0">
                      <p className={`text-xs font-bold truncate ${group.deleted ? "text-red-400" : "text-white"}`}>
                        {group.nombre}
                      </p>
                      <p className="text-[11px] text-slate-500">{group.telefono}</p>
                    </div>
                  </button>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleExpand(group.agencyId)}
                      className="px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-[11px] font-semibold hover:bg-blue-500/25 transition-colors cursor-pointer"
                    >
                      {group.items.length} CP{group.items.length === 1 ? "" : "s"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAgencyZones(group.items, group.nombre)}
                      className="text-red-400 hover:text-red-300 text-[11px] transition-colors cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="px-4 pb-3 pt-1 bg-slate-900/50 border-t border-white/5 flex flex-wrap gap-1.5">
                    {group.items.map((z) => (
                      <span
                        key={z.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-white/10 text-slate-200 text-[11px] font-medium"
                      >
                        <span>📍 {z.codigo_postal}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteSingle(z.id)}
                          title={`Quitar CP ${z.codigo_postal}`}
                          className="text-slate-400 hover:text-red-400 font-bold leading-none cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {groupedAgencies.length === 0 && (
            <div className="py-6 text-center text-xs text-slate-500">{labels.emptyZones}</div>
          )}
        </div>
      </div>
    </div>
  );
}
