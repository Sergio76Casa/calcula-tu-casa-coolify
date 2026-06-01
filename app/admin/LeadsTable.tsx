"use client";

import { useState } from "react";

export interface LeadRow {
  id:                     string;
  created_at:             string;
  nombre:                 string;
  telefono:               string;
  telefono_final?:        string | null;
  email:                  string;
  test_variant:           string | null;
  utm_source:             string | null;
  utm_campaign:           string | null;
  pdf_downloaded:         boolean;
  lang:                   string | null;
  venta_urgencia?:        string | null;
  venta_estado?:          string | null;
  quiere_vender?:         boolean;
  direccion?:             string;
  precio?:                number;
  certificado_energetico?: string | null;
  raw_propiedad?:         any;
  raw_valoracion?:        any;
  assigned_agency?:       string | null;
  sent_status?:           string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

const URGENCIA_LABEL: Record<string, string> = {
  menos_3_meses: "< 3 meses",
  "3_6_meses":   "3–6 meses",
  solo_info:     "Info",
};

const ENERGY_BADGE_CLASSES: Record<string, string> = {
  A: "bg-green-800/30 text-green-400 border border-green-500/20",
  B: "bg-green-700/30 text-green-300 border border-green-500/20",
  C: "bg-lime-700/30 text-lime-300 border border-lime-500/20",
  D: "bg-yellow-700/30 text-yellow-300 border border-yellow-500/20",
  E: "bg-orange-700/30 text-orange-300 border border-orange-500/20",
  F: "bg-red-700/30 text-red-300 border border-red-500/20",
  G: "bg-red-950/40 text-red-400 border border-red-900/30",
  PENDING: "bg-blue-900/20 text-blue-300 border border-blue-500/20",
};

function Badge({ text, cls }: { text: string; cls: string }) {
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${cls}`}>
      {text}
    </span>
  );
}

function Cell({ children, className = "", title }: { children: React.ReactNode; className?: string; title?: string }) {
  return <td className={`px-2 py-1.5 text-xs ${className}`} title={title}>{children}</td>;
}

function exportCSV(rows: LeadRow[]) {
  const headers = [
    "Fecha","Nombre","Email","Tel. 1","Tel. Final","Dirección","Cert. Energético","Valoración €",
    "A/B","UTM Source","UTM Campaign","PDF","Urgencia","Estado venta","Estado Envío","Agencia Asignada","Fecha Envío"
  ];
  const body = rows.map(l => [
    fmt(l.created_at), l.nombre, l.email, l.telefono, l.telefono_final ?? "",
    l.direccion ?? "",
    l.certificado_energetico === "pending" ? "Pendiente" : (l.certificado_energetico ?? ""),
    l.precio ? l.precio.toLocaleString("es-ES") : "",
    l.lang ?? "", l.test_variant ?? "",
    l.utm_source ?? "", l.utm_campaign ?? "",
    l.pdf_downloaded ? "Sí" : "No",
    URGENCIA_LABEL[l.venta_urgencia ?? ""] ?? l.venta_urgencia ?? "",
    l.venta_estado ?? "",
    l.sent_status ?? "No enviado",
    l.assigned_agency ?? "—",
    l.sent_status === "Enviado" ? fmt(l.created_at) : "—"
  ]);
  const csv = "﻿" + [headers, ...body]
    .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(";"))
    .join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  a.download = `leads_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

// ─── Columnas visibles ────────────────────────────────────────────────────────

const HEADERS = ["Fecha","Nombre","Email","Tel. 1","Tel. Final","Dirección","Cert.","€","A/B","PDF","Urgencia","Envío"];

// ─── Componente ───────────────────────────────────────────────────────────────

export default function LeadsTable({ leads, onRefresh }: { leads: LeadRow[]; onRefresh: () => void }) {
  const [q, setQ] = useState("");

  async function handleDownloadPDF(lead: LeadRow) {
    if (!lead.raw_propiedad || !lead.raw_valoracion) return;
    try {
      const { generatePDF } = await import("@/lib/generatePDF");
      await generatePDF(
        lead.raw_valoracion as any,
        lead.raw_propiedad as any,
        lead.direccion || "",
        (lead.lang as any) || "es",
        lead.nombre
      );
    } catch (err) {
      console.error("Error generating PDF from admin:", err);
    }
  }

  const filtered = q.trim()
    ? leads.filter(l =>
        [l.nombre, l.email, l.telefono, l.direccion, l.utm_source]
          .some(f => f?.toLowerCase().includes(q.toLowerCase()))
      )
    : leads;

  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden">

      {/* Toolbar */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10 flex-wrap">
        <input
          type="search" value={q} onChange={e => setQ(e.target.value)}
          placeholder="Buscar por nombre, email, dirección..."
          className="flex-1 min-w-0 px-3 py-2 bg-slate-800 border border-white/10 rounded-xl text-white text-xs placeholder-slate-500 outline-none focus:border-blue-400 transition-colors"
        />
        <button onClick={onRefresh}
          className="px-3 py-2 bg-slate-800 border border-white/10 hover:border-white/30 rounded-xl text-slate-400 hover:text-white text-xs transition-colors">
          ↻
        </button>
        <button onClick={() => exportCSV(leads)}
          className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 rounded-xl text-slate-900 font-bold text-xs transition-colors">
          ↓ CSV
        </button>
      </div>

      {/* Table — con overflow-x-auto para permitir scroll horizontal en móviles sin romper el layout */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-xs table-fixed min-w-[940px]">
          <colgroup>
            <col className="w-[82px]" />   {/* Fecha */}
            <col className="w-[90px]" />   {/* Nombre */}
            <col className="w-[125px]" />  {/* Email */}
            <col className="w-[85px]" />   {/* Tel. 1 */}
            <col className="w-[85px]" />   {/* Tel. Final */}
            <col className="w-[110px]" />  {/* Dirección */}
            <col className="w-[42px]" />   {/* Cert. */}
            <col className="w-[66px]" />   {/* Valoración */}
            <col className="w-[36px]" />   {/* A/B */}
            <col className="w-[36px]" />   {/* PDF */}
            <col className="w-[66px]" />   {/* Urgencia */}
            <col className="w-[110px]" />  {/* Envío */}
          </colgroup>
          <thead>
            <tr className="border-b border-white/10 text-left">
              {HEADERS.map(h => (
                <th key={h} className="px-2 py-2 text-slate-500 font-medium text-[10px] uppercase tracking-wide truncate">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-4 py-10 text-center text-slate-600 text-xs">
                  {q ? "Sin resultados." : "Aún no hay leads registrados."}
                </td>
              </tr>
            ) : filtered.map(l => (
              <tr key={l.id} className="hover:bg-white/[0.03] transition-colors">
                <Cell className="text-slate-500 whitespace-nowrap">{fmt(l.created_at)}</Cell>
                <Cell className="text-white font-medium truncate">{l.nombre}</Cell>
                <Cell className="text-slate-300 truncate">{l.email}</Cell>
                <Cell className="text-slate-300 whitespace-nowrap">{l.telefono}</Cell>
                <Cell className="text-emerald-400 font-medium whitespace-nowrap">{l.telefono_final ?? "—"}</Cell>
                <Cell className="text-slate-400 truncate" title={l.direccion}>{l.direccion ?? "—"}</Cell>
                <Cell className="text-center">
                  {l.certificado_energetico
                    ? <Badge
                        text={l.certificado_energetico === "pending" ? "Pend." : l.certificado_energetico.toUpperCase()}
                        cls={ENERGY_BADGE_CLASSES[l.certificado_energetico.toUpperCase()] || "bg-slate-800 text-slate-400"}
                      />
                    : <span className="text-slate-600">—</span>}
                </Cell>
                <Cell className="text-emerald-400 font-semibold whitespace-nowrap text-right">
                  {l.precio ? `${l.precio.toLocaleString("es-ES")} €` : "—"}
                </Cell>
                <Cell className="text-center">
                  {l.test_variant
                    ? <Badge text={l.test_variant} cls={l.test_variant === "A" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"} />
                    : <span className="text-slate-600">—</span>}
                </Cell>
                <Cell className="text-center">
                  {l.raw_propiedad && l.raw_valoracion ? (
                    <button
                      onClick={() => handleDownloadPDF(l)}
                      className={`inline-flex items-center justify-center p-1 rounded-lg border transition-colors ${
                        l.pdf_downloaded
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                          : "bg-slate-800 text-slate-400 border-white/5 hover:bg-slate-700 hover:text-white"
                      }`}
                      title="Descargar PDF del informe"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                      </svg>
                    </button>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </Cell>
                <Cell className="text-center">
                  {l.venta_urgencia
                    ? <Badge text={URGENCIA_LABEL[l.venta_urgencia] ?? l.venta_urgencia} cls="bg-amber-500/20 text-amber-400" />
                    : <span className="text-slate-600">—</span>}
                </Cell>
                <Cell className="text-left py-1">
                  {l.sent_status === "Enviado" ? (
                    <div className="space-y-0.5">
                      <Badge text="Enviado" cls="bg-emerald-500/10 text-emerald-400 border border-emerald-400/20" />
                      <div className="text-[10px] text-white truncate font-medium" title={l.assigned_agency || ""}>
                        {l.assigned_agency}
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">
                        {fmt(l.created_at)}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <Badge text="No enviado" cls="bg-slate-800 text-slate-400 border border-white/5" />
                      <div className="text-[10px] text-slate-500 truncate">
                        Sin agencia
                      </div>
                    </div>
                  )}
                </Cell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-2 border-t border-white/10 text-[10px] text-slate-600">
        {filtered.length} de {leads.length} registros
      </div>
    </div>
  );
}
