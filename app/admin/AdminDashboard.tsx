"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import LoginGate   from "./LoginGate";
import MetricsRow, { type Metrics } from "./MetricsRow";
import LeadsTable,  { type LeadRow }  from "./LeadsTable";
import BannersAdmin from "./BannersAdmin";

const AdminMap = dynamic(() => import("./AdminMap"), { ssr: false });

// ─── Tipos respuesta Supabase ─────────────────────────────────────────────────

interface RawLead {
  id: string; created_at: string;
  nombre: string; telefono: string; telefono_final: string | null; email: string;
  test_variant: string | null; utm_source: string | null; utm_campaign: string | null;
  pdf_downloaded: boolean; lang: string | null; propiedad_id: string;
  venta_urgencia: string | null; venta_estado: string | null; quiere_vender: boolean;
  propiedades: {
    direccion_completa: string;
    valoraciones: Array<{ precio_estimado: number }>;
  } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function flattenLead(r: RawLead): LeadRow {
  return {
    id: r.id, created_at: r.created_at,
    nombre: r.nombre, telefono: r.telefono, telefono_final: r.telefono_final, email: r.email,
    test_variant: r.test_variant, utm_source: r.utm_source, utm_campaign: r.utm_campaign,
    pdf_downloaded: r.pdf_downloaded, lang: r.lang,
    venta_urgencia: r.venta_urgencia, venta_estado: r.venta_estado, quiere_vender: r.quiere_vender,
    direccion: r.propiedades?.direccion_completa,
    precio:    r.propiedades?.valoraciones?.[0]?.precio_estimado,
  };
}

function computeMetrics(leads: LeadRow[]): Metrics {
  const total    = leads.length;
  const pdfCount = leads.filter(l => l.pdf_downloaded).length;
  const aCount   = leads.filter(l => l.test_variant === "A").length;
  const bCount   = leads.filter(l => l.test_variant === "B").length;
  const sources: Record<string, number> = {};
  leads.forEach(l => {
    const s = l.utm_source || "directo";
    sources[s] = (sources[s] ?? 0) + 1;
  });
  const topSource = Object.entries(sources).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  return {
    total,
    pdfPct:   total > 0 ? Math.round(pdfCount / total * 100) : 0,
    variantA: total > 0 ? Math.round(aCount   / total * 100) : 0,
    variantB: total > 0 ? Math.round(bCount   / total * 100) : 0,
    topSource,
  };
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [session,  setSession]  = useState<unknown>(null);
  const [checking, setChecking] = useState(true);
  const [leads,    setLeads]    = useState<LeadRow[]>([]);
  const [metrics,  setMetrics]  = useState<Metrics | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("leads")
      .select(`
        id, created_at, nombre, telefono, telefono_final, email,
        test_variant, utm_source, utm_campaign,
        pdf_downloaded, lang, propiedad_id,
        venta_urgencia, venta_estado, quiere_vender,
        propiedades (
          direccion_completa,
          valoraciones ( precio_estimado )
        )
      `)
      .order("created_at", { ascending: false });

    if (err) { setError("Error cargando datos: " + err.message); setLoading(false); return; }
    const flat = (data as unknown as RawLead[]).map(flattenLead);
    setLeads(flat);
    setMetrics(computeMetrics(flat));
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
      if (data.session) fetchLeads();
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
      setSession(s);
      if (s) fetchLeads();
      else { setLeads([]); setMetrics(null); }
    });
    return () => subscription.unsubscribe();
  }, [fetchLeads]);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-700 border-t-blue-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return <LoginGate />;

  const mapPins = leads
    .filter(l => l.direccion)
    .map(l => ({ address: l.direccion! }));

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-sm border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-white tracking-tight">ValorExacto Admin</h1>
          <p className="text-slate-500 text-xs">Panel de control · Leads en tiempo real</p>
        </div>
        <button onClick={handleLogout}
          className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-white/10 hover:border-white/30 rounded-xl transition-colors">
          Cerrar sesión
        </button>
      </header>

      <main className="p-6 space-y-6 max-w-7xl mx-auto">

        {/* Metrics */}
        {metrics && <MetricsRow metrics={metrics} />}

        {/* Social Proof Banners */}
        <BannersAdmin />

        {/* Map */}
        {mapPins.length > 0 && (
          <section>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              🗺 Valoraciones por zona · {mapPins.length} dirección{mapPins.length !== 1 ? "es" : ""}
            </p>
            <AdminMap pins={mapPins} />
          </section>
        )}

        {/* Leads Table */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              📋 Leads registrados
            </p>
            {loading && (
              <div className="w-4 h-4 border-2 border-slate-700 border-t-blue-400 rounded-full animate-spin" />
            )}
          </div>
          {error ? (
            <div className="p-6 text-center text-red-400 text-sm bg-red-500/5 border border-red-500/20 rounded-2xl">
              {error}
            </div>
          ) : (
            <LeadsTable leads={leads} onRefresh={fetchLeads} />
          )}
        </section>

      </main>
    </div>
  );
}
