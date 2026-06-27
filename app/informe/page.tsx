"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { pbClient } from "@/lib/pocketbase-client";
import { generatePDF } from "@/lib/generatePDF";
import { T, type Lang } from "@/lib/translations";

function InformeLoader() {
  const searchParams = useSearchParams();
  const leadId = searchParams.get("leadId");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);
  const [data, setData] = useState<any>(null);
  const [lang, setLang] = useState<Lang>("es");

  useEffect(() => {
    if (!leadId) {
      setError("No se ha proporcionado ningún identificador de informe.");
      setLoading(false);
      return;
    }

    async function loadLeadAndDownload() {
      try {
        // 1. Obtener los datos del lead y su propiedad asociada
        const lead = await pbClient.collection("leads").getOne(leadId!, {
          expand: "propiedad_id",
        });

        if (!lead || !lead.propiedad_id) {
          throw new Error("No se encontró el informe solicitado.");
        }

        const prop = lead.expand?.propiedad_id;

        // 2. Obtener la última valoración asociada a la propiedad
        const vals = await pbClient.collection("valoraciones").getList(1, 1, {
          filter: `propiedad_id = "${lead.propiedad_id}"`,
          sort: "-created",
        });

        if (vals.items.length === 0) {
          throw new Error("No se encontró la valoración de la propiedad.");
        }

        const val = vals.items[0];

        // Parsear campos JSON guardados en PocketBase
        let entorno = null;
        let analisisBarrio = null;
        let puntosFuertes: string[] = [];
        let puntosAMejorar: string[] = [];

        try { entorno = prop.entorno_json ? JSON.parse(prop.entorno_json) : null; } catch {}
        try { analisisBarrio = val.analisis_barrio_json ? JSON.parse(val.analisis_barrio_json) : null; } catch {}
        try { puntosFuertes = val.puntos_fuertes ? JSON.parse(val.puntos_fuertes) : []; } catch {}
        try { puntosAMejorar = val.puntos_a_mejorar ? JSON.parse(val.puntos_a_mejorar) : []; } catch {}

        const resultObj = {
          valoracion_id:              val.id,
          propiedad_id:               lead.propiedad_id,
          precio_sugerido:            val.precio_sugerido,
          rango_precios:              { minimo: val.rango_minimo, maximo: val.rango_maximo },
          argumentario_venta:         val.argumentario_venta,
          precio_por_m2_zona:         val.precio_por_m2_zona ?? undefined,
          ajuste_aplicado_pct:        val.ajuste_aplicado_pct ?? undefined,
          puntos_fuertes:             puntosFuertes,
          puntos_a_mejorar:           puntosAMejorar,
          recomendacion_precio_salida: val.recomendacion_precio_salida ?? undefined,
          precio_alquiler_estimado:   val.precio_alquiler_estimado ?? undefined,
          rentabilidad_bruta_pct:     val.rentabilidad_bruta_pct ?? undefined,
          tiempo_venta_estimado_dias: val.tiempo_venta_estimado_dias ?? undefined,
          tendencia_mercado_12m:      val.tendencia_mercado_12m ?? undefined,
          score_inversion:            val.score_inversion ?? undefined,
          entorno,
          analisis_barrio:            analisisBarrio,
        };

        const detailsObj = {
          m2:               prop.m2_construidos,
          estado:           prop.estado_conservacion,
          tipo:             prop.tipo_propiedad || "piso",
          habitaciones:     prop.habitaciones || 3,
          ascensor:         prop.ascensor,
          jardin:           prop.jardin,
          energyCertificate: prop.certificado_energetico,
        };

        const addressStr = prop.direccion_completa;
        const langCode   = (lead.lang as Lang) || "es";
        const clientName = lead.nombre;

        setLang(langCode);

        const reportData = { resultObj, detailsObj, addressStr, langCode, clientName, entorno, analisisBarrio };
        setData(reportData);
        setLoading(false);

        // 3. Registrar descarga en BD (PATCH api/lead)
        try {
          await fetch("/api/lead", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ leadId, action: "download" }),
          });
        } catch (patchErr) {
          console.error("Error al registrar descarga en BD:", patchErr);
        }

        // 4. Generar y descargar el PDF automáticamente con todos los datos
        await generatePDF(resultObj, detailsObj, addressStr, langCode, clientName, entorno, analisisBarrio);
        setDownloaded(true);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Ocurrió un error al procesar el informe.";
        console.error("Error al cargar informe:", err);
        setError(msg);
        setLoading(false);
      }
    }

    loadLeadAndDownload();
  }, [leadId]);

  async function triggerManualDownload() {
    if (!data) return;
    try {
      await generatePDF(
        data.resultObj,
        data.detailsObj,
        data.addressStr,
        data.langCode,
        data.clientName,
        data.entorno ?? null,
        data.analisisBarrio ?? null,
      );
      setDownloaded(true);
    } catch (err) {
      console.error("Error descarga manual:", err);
    }
  }

  const t = T(lang).informe;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-slate-700 border-t-emerald-400 rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">{t.loader.generating}</h2>
        <p className="text-slate-400 text-sm max-w-sm">
          {t.loader.preparing}
        </p>
      </div>
    );
  }

  if (error) {
    // Map backend error messages to translations if possible
    let errorText = error;
    if (error === "No se ha proporcionado ningún identificador de informe.") {
      errorText = t.error.noId;
    } else if (error === "No se encontró el informe solicitado.") {
      errorText = t.error.notFound;
    } else if (error === "No se encontró la valoración de la propiedad.") {
      errorText = t.error.noValuation;
    }

    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center max-w-md">
        <span className="text-4xl mb-4 block">⚠️</span>
        <h2 className="text-lg font-bold text-red-400 mb-2">{t.error.title}</h2>
        <p className="text-slate-400 text-sm mb-6">{errorText}</p>
        <a
          href="/"
          className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition-colors inline-block"
        >
          {t.error.back}
        </a>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 text-center max-w-md shadow-2xl backdrop-blur-md">
      <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
        ✨
      </div>
      <h2 className="text-2xl font-black text-white tracking-tight mb-2">{t.ready.title}</h2>
      <p className="text-slate-400 text-sm mb-6">
        {t.ready.desc}
      </p>
      
      <button
        onClick={triggerManualDownload}
        className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 mb-4"
      >
        <span>📄</span> {downloaded ? t.ready.downloadAgain : t.ready.downloadBtn}
      </button>

      <p className="text-xs text-slate-500">
        {t.ready.footer}
      </p>
    </div>
  );
}

export default function InformePage() {
  // Use Spanish as a default initial translation for page wrapper suspense, which is fine
  const t = T("es").informe;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 border-4 border-slate-700 border-t-emerald-400 rounded-full animate-spin mb-4" />
            <h2 className="text-xl font-bold text-white">{t.preparingText}</h2>
          </div>
        }
      >
        <InformeLoader />
      </Suspense>
    </div>
  );
}
