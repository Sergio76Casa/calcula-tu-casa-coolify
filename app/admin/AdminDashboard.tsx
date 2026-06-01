"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { pbClient } from "@/lib/pocketbase-client";
import LoginGate   from "./LoginGate";
import MetricsRow, { type Metrics } from "./MetricsRow";
import LeadsTable,  { type LeadRow }  from "./LeadsTable";
import BannersAdmin from "./BannersAdmin";
import NamesAdmin from "./NamesAdmin";
import AgenciesAdmin from "./AgenciesAdmin";

const AdminMap = dynamic(() => import("./AdminMap"), { ssr: false });

// Helpers for Leads are handled directly in fetchLeads now

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
  const [abMode,   setAbMode]   = useState("random");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const leadsData = await pbClient.collection("leads").getFullList({
        expand: "propiedad_id",
        sort: "-created"
      });
      const valData = await pbClient.collection("valoraciones").getFullList();
      const valMap = new Map();
      valData.forEach(v => valMap.set(v.propiedad_id, v));

      // Obtener asignación de zonas e inmobiliarias
      const zonesData = await pbClient.collection("zonas_inmobiliarias").getFullList({
        expand: "inmobiliaria_id"
      });
      const zonesMap = new Map();
      zonesData.forEach((z: any) => {
        const agency = z.expand?.inmobiliaria_id;
        if (agency && agency.estado) {
          zonesMap.set(z.codigo_postal, agency);
        }
      });
      
      const flat: LeadRow[] = leadsData.map((r: any) => {
        const val = valMap.get(r.propiedad_id);
        const prop = r.expand?.propiedad_id;
        
        // Extraer CP de la dirección completa
        const cpMatch = prop?.direccion_completa?.match(/\b\d{5}\b/);
        const cp = cpMatch ? cpMatch[0] : null;
        const assignedAgency = cp ? zonesMap.get(cp) : null;

        return {
          id: r.id, created_at: r.created,
          nombre: r.nombre, telefono: r.telefono, telefono_final: r.telefono_final, email: r.email,
          test_variant: r.test_variant, utm_source: r.utm_source, utm_campaign: r.utm_campaign,
          pdf_downloaded: r.pdf_downloaded, lang: r.lang,
          venta_urgencia: r.venta_urgencia, venta_estado: r.venta_estado, quiere_vender: r.quiere_vender,
          direccion: prop?.direccion_completa,
          certificado_energetico: prop?.certificado_energetico,
          precio: val?.precio_sugerido,
          assigned_agency: assignedAgency ? assignedAgency.nombre : null,
          sent_status: assignedAgency ? "Enviado" : "No enviado",
          raw_propiedad: prop ? {
            m2: prop.m2_construidos,
            estado: prop.estado_conservacion,
            tipo: prop.tipo_propiedad,
            habitaciones: prop.habitaciones,
            ascensor: prop.ascensor,
            jardin: prop.jardin,
            energyCertificate: prop.certificado_energetico
          } : null,
          raw_valoracion: val ? {
            precio_sugerido: val.precio_sugerido,
            rango_precios: { minimo: val.rango_minimo, maximo: val.rango_maximo },
            argumentario_venta: val.argumentario_venta
          } : null
        };
      });

      setLeads(flat);
      setMetrics(computeMetrics(flat));
      setLoading(false);
    } catch (err: any) {
      setError("Error cargando datos: " + err.message);
      setLoading(false);
    }
  }, []);

  async function handleAbModeChange(newMode: string) {
    setAbMode(newMode);
    alert("El modo A/B está desactivado en la versión de PocketBase.");
  }

  useEffect(() => {
    setSession(pbClient.authStore.isValid ? pbClient.authStore.model : null);
    setChecking(false);
    if (pbClient.authStore.isValid) fetchLeads();
    
    // Auth state listener for PocketBase
    pbClient.authStore.onChange((token, model) => {
      setSession(model);
      if (model) fetchLeads();
      else { setLeads([]); setMetrics(null); }
    });
  }, [fetchLeads]);

  async function handleLogout() {
    pbClient.authStore.clear();
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
          <h1 className="text-lg font-black text-white tracking-tight">CalculaTuCasa Admin</h1>
          <p className="text-slate-500 text-xs">Panel de control · Leads en tiempo real</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/roadmap"
            className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-1.5"
          >
            🧭 Ver Roadmap
          </Link>
          <button onClick={handleLogout}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-white/10 hover:border-white/30 rounded-xl transition-colors">
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="p-6 space-y-6 max-w-7xl mx-auto">

        {/* Metrics */}
        {metrics && (
          <MetricsRow 
            metrics={metrics} 
            abMode={abMode} 
            onModeChange={handleAbModeChange} 
          />
        )}

        {/* Social Proof Banners */}
        <BannersAdmin />

        {/* Social Proof Names */}
        <NamesAdmin />

        {/* Agencies Administration */}
        <AgenciesAdmin />

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
