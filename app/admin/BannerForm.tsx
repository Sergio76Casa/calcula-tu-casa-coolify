"use client";

import { useState } from "react";
import { pbClient } from "@/lib/pocketbase-client";
import type { SocialBanner } from "./BannersAdmin";

interface Props {
  banner:  SocialBanner | null;
  onClose: () => void;
  onSaved: () => void;
}

// ─── Postal code lookup: OpenDataSoft geonames ───────────────────────────────

async function fetchPostalCodesForCity(cityName: string): Promise<string[]> {
  const url =
    `https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/` +
    `geonames-postal-code/records` +
    `?where=place_name%3D"${encodeURIComponent(cityName)}" AND country_code%3D"ES"` +
    `&select=postal_code&limit=100`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error de red: ${res.status} ${res.statusText}`);

  const json = await res.json();
  const results: Array<{ postal_code?: string }> = json.results ?? [];

  const codes = new Set(
    results.map(r => r.postal_code).filter((c): c is string => Boolean(c))
  );

  if (codes.size === 0) throw new Error("No se encontraron códigos postales para esa zona");
  return Array.from(codes).sort();
}



// ─── Component ────────────────────────────────────────────────────────────────

export default function BannerForm({ banner, onClose, onSaved }: Props) {
  const [name,      setName]      = useState(banner?.location_name ?? "");
  const [codes,     setCodes]     = useState(Array.isArray(banner?.postal_codes) ? banner.postal_codes.join(", ") : "");
  const [active,    setActive]    = useState(banner?.is_active ?? true);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [cpLoading, setCpLoading] = useState(false);
  const [cpError,   setCpError]   = useState<string | null>(null);

  async function handleAutocomplete() {
    if (!name.trim()) { setCpError("Escribe primero el nombre de la zona"); return; }
    setCpLoading(true);
    setCpError(null);
    try {
      const found = await fetchPostalCodesForCity(name.trim());
      setCodes(found.join(", "));
    } catch (e) {
      console.error("[Autocompletar CPs]", e);
      setCpError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setCpLoading(false);
    }
  }

  async function handleSave() {
    if (!name.trim()) { setError("El nombre de la zona es obligatorio"); return; }
    setSaving(true);
    setError(null);

    const payload = {
      location_name: name.trim(),
      postal_codes:  codes.split(",").map(c => c.trim()).filter(Boolean),
      is_active:     active,
    };

    try {
      if (banner) {
        await pbClient.collection("social_proof_banners").update(banner.id, payload);
      } else {
        await pbClient.collection("social_proof_banners").create(payload);
      }
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 space-y-5 shadow-2xl">

        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">
            {banner ? "Editar zona" : "Nueva zona"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors text-xl leading-none"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
            {error}
          </div>
        )}

        <div className="space-y-4">

          {/* Nombre + botón Autocompletar */}
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Nombre de la zona
            </span>
            <div className="flex gap-2 mt-1.5">
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setCpError(null); }}
                placeholder="Ej: Eixample, Gracia, Chamberí..."
                className="flex-1 min-w-0 bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
              <button
                type="button"
                onClick={handleAutocomplete}
                disabled={cpLoading}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-white/10 hover:border-white/25 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {cpLoading
                  ? <><span className="w-3 h-3 border border-slate-500 border-t-slate-200 rounded-full animate-spin" />Buscando...</>
                  : "Autocompletar CPs"}
              </button>
            </div>
            {cpError && (
              <p className="text-xs text-red-400 mt-1.5">{cpError}</p>
            )}
          </div>

          {/* Códigos postales */}
          <label className="block">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Códigos postales (separados por coma)
            </span>
            <input
              type="text"
              value={codes}
              onChange={e => setCodes(e.target.value)}
              placeholder="08001, 08002, 08003"
              className="mt-1.5 w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
            <p className="text-xs text-slate-600 mt-1.5">
              Sin códigos postales → actúa como fallback genérico para cualquier IP
            </p>
          </label>

          {/* Toggle Activo */}
          <div className="flex items-center justify-between bg-slate-800 border border-white/10 rounded-xl px-4 py-3">
            <div>
              <p className="text-sm text-white font-medium">Activo</p>
              <p className="text-xs text-slate-500">Visible en la landing page</p>
            </div>
            <button
              type="button"
              onClick={() => setActive(v => !v)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                active ? "bg-emerald-500" : "bg-slate-700"
              }`}
              aria-label={active ? "Desactivar" : "Activar"}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                active ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm text-slate-400 hover:text-white border border-white/10 hover:border-white/30 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
          >
            {saving ? "Guardando..." : "Guardar zona"}
          </button>
        </div>
      </div>
    </div>
  );
}
