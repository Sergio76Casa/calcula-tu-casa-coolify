"use client";

import { useState } from "react";

export interface LeadRow {
  id:             string;
  created_at:     string;
  nombre:         string;
  telefono:       string;
  email:          string;
  test_variant:   string | null;
  utm_source:     string | null;
  utm_campaign:   string | null;
  pdf_downloaded: boolean;
  lang:           string | null;
  direccion?:     string;
  precio?:        number;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit", month: "short", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function Badge({ text, cls }: { text: string; cls: string }) {
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{text}</span>;
}

function exportCSV(rows: LeadRow[]) {
  const headers = ["Fecha","Nombre","Email","Teléfono","Dirección","Valoración €","Idioma","A/B","UTM Source","UTM Campaign","PDF"];
  const body = rows.map((l) => [
    fmt(l.created_at), l.nombre, l.email, l.telefono,
    l.direccion ?? "",
    l.precio ? l.precio.toLocaleString("es-ES") : "",
    l.lang ?? "", l.test_variant ?? "",
    l.utm_source ?? "", l.utm_campaign ?? "",
    l.pdf_downloaded ? "Sí" : "No",
  ]);
  const csv = "﻿" + [headers, ...body]
    .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(";"))
    .join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  a.download = `leads_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

export default function LeadsTable({ leads, onRefresh }: { leads: LeadRow[]; onRefresh: () => void }) {
  const [q, setQ] = useState("");

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
          type="search" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, email, dirección..."
          className="flex-1 min-w-0 px-4 py-2 bg-slate-800 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 outline-none focus:border-blue-400 transition-colors"
        />
        <button onClick={onRefresh}
          className="px-4 py-2 bg-slate-800 border border-white/10 hover:border-white/30 rounded-xl text-slate-400 hover:text-white text-sm transition-colors">
          ↻ Actualizar
        </button>
        <button onClick={() => exportCSV(leads)}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 rounded-xl text-slate-900 font-bold text-sm transition-colors">
          ↓ CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="border-b border-white/10 text-left">
              {["Fecha","Nombre","Email","Teléfono","Dirección","Valoración","Idioma","A/B","UTM Source","UTM Camp.","PDF"].map(h => (
                <th key={h} className="px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-12 text-center text-slate-600 text-sm">
                  {q ? "Sin resultados para esa búsqueda." : "Aún no hay leads registrados."}
                </td>
              </tr>
            ) : filtered.map((l) => (
              <tr key={l.id} className="hover:bg-white/[0.03] transition-colors">
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">{fmt(l.created_at)}</td>
                <td className="px-4 py-3 text-white font-medium whitespace-nowrap">{l.nombre}</td>
                <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{l.email}</td>
                <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{l.telefono}</td>
                <td className="px-4 py-3 text-slate-400 max-w-[160px] truncate text-xs" title={l.direccion}>
                  {l.direccion ?? "—"}
                </td>
                <td className="px-4 py-3 text-emerald-400 font-semibold whitespace-nowrap">
                  {l.precio ? `${l.precio.toLocaleString("es-ES")} €` : "—"}
                </td>
                <td className="px-4 py-3 text-slate-400 uppercase text-xs">{l.lang ?? "—"}</td>
                <td className="px-4 py-3">
                  {l.test_variant
                    ? <Badge text={l.test_variant} cls={l.test_variant === "A" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"} />
                    : <span className="text-slate-600">—</span>
                  }
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{l.utm_source ?? "—"}</td>
                <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{l.utm_campaign ?? "—"}</td>
                <td className="px-4 py-3 text-center">
                  {l.pdf_downloaded
                    ? <Badge text="✓ Sí" cls="bg-emerald-500/20 text-emerald-400" />
                    : <Badge text="No"   cls="bg-slate-700/40 text-slate-500" />
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-white/10 text-xs text-slate-600">
        {filtered.length} de {leads.length} registros
      </div>
    </div>
  );
}
