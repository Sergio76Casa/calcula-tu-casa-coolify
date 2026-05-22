"use client";

import { useState, useEffect, useCallback } from "react";
import { pbClient } from "@/lib/pocketbase-client";
import BannerForm from "./BannerForm";

export interface SocialBanner {
  id: string;
  location_name: string;
  postal_codes: string[];
  is_active: boolean;
}

export default function BannersAdmin() {
  const [banners,    setBanners]    = useState<SocialBanner[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<SocialBanner | "new" | null>(null);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await pbClient.collection("social_proof_banners").getFullList({ sort: "location_name" });
      setBanners((data as unknown as SocialBanner[]) ?? []);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  async function toggleActive(banner: SocialBanner) {
    await pbClient.collection("social_proof_banners").update(banner.id, { is_active: !banner.is_active });
    fetchBanners();
  }

  async function deleteBanner(id: string) {
    if (!confirm("¿Eliminar este banner permanentemente?")) return;
    await pbClient.collection("social_proof_banners").delete(id);
    fetchBanners();
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
          📢 Social Proof · Zonas activas
        </p>
        <button
          onClick={() => setEditTarget("new")}
          className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors"
        >
          + Nueva zona
        </button>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-slate-700 border-t-blue-400 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {banners.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-8">
              No hay banners configurados. Añade la primera zona.
            </p>
          )}
          {banners.map(b => (
            <div
              key={b.id}
              className="flex items-center gap-4 bg-slate-900 border border-white/10 rounded-2xl px-4 py-3"
            >
              <button
                onClick={() => toggleActive(b)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                  b.is_active ? "bg-emerald-500" : "bg-slate-700"
                }`}
                aria-label={b.is_active ? "Desactivar" : "Activar"}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    b.is_active ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{b.location_name}</p>
                <p className="text-xs text-slate-500 truncate">
                  {b.postal_codes.length > 0
                    ? b.postal_codes.join(", ")
                    : "Sin códigos postales · Fallback genérico"}
                </p>
              </div>

              <span
                className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                  b.is_active
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-slate-700/50 text-slate-500"
                }`}
              >
                {b.is_active ? "Activo" : "Inactivo"}
              </span>

              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => setEditTarget(b)}
                  className="px-2 py-1 text-xs text-slate-400 hover:text-white border border-white/10 hover:border-white/30 rounded-lg transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => deleteBanner(b.id)}
                  className="px-2 py-1 text-xs text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 rounded-lg transition-colors"
                >
                  Borrar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editTarget !== null && (
        <BannerForm
          banner={editTarget === "new" ? null : editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => { setEditTarget(null); fetchBanners(); }}
        />
      )}
    </section>
  );
}
