"use client";

import { useEffect, useState } from "react";
import Link from "next/navigation"; // wait, next/link is safer for navigation than next/navigation Link, let's keep next/link
import LinkNext from "next/link";
import { pbClient } from "@/lib/pocketbase-client";
import LoginGate from "../admin/LoginGate";
import ProfitabilitySimulator from "@/components/roadmap/ProfitabilitySimulator";
import ProgressTracker from "@/components/roadmap/ProgressTracker";
import CopyGenerator from "@/components/roadmap/CopyGenerator";
import SetupGuides from "@/components/roadmap/SetupGuides";
import { T, type Lang } from "@/lib/translations";

export default function RoadmapPage() {
  const [session, setSession] = useState<unknown>(null);
  const [checking, setChecking] = useState(true);
  const [lang, setLang] = useState<Lang>("es");

  useEffect(() => {
    const saved = localStorage.getItem("admin_lang") as Lang;
    if (saved && ["es", "ca", "en"].includes(saved)) {
      setLang(saved);
    }
  }, []);

  const handleLangChange = (l: Lang) => {
    setLang(l);
    localStorage.setItem("admin_lang", l);
  };

  useEffect(() => {
    setSession(pbClient.authStore.isValid ? pbClient.authStore.model : null);
    setChecking(false);

    // Listener para detectar cambios en la sesión de PocketBase
    const unsubscribe = pbClient.authStore.onChange((token, model) => {
      setSession(model);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-700 border-t-blue-400 rounded-full animate-spin" />
      </div>
    );
  }

  // Si no está autenticado, mostramos la pantalla de login existente
  if (!session) return <LoginGate lang={lang} />;

  const t = T(lang).roadmap;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-sm border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            {t.title}
          </h1>
          <p className="text-slate-500 text-xs">
            {t.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Selector de idioma */}
          <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 mr-2">
            {(["es", "ca", "en"] as Lang[]).map((code) => (
              <button
                key={code}
                onClick={() => handleLangChange(code)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  lang === code
                    ? "bg-blue-500 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>

          <LinkNext
            href="/admin"
            className="px-4 py-2 text-sm text-slate-300 hover:text-white border border-white/10 hover:border-white/30 rounded-xl transition-all flex items-center gap-2 bg-white/5 active:scale-[0.98]"
          >
            {t.backAdmin}
          </LinkNext>
        </div>
      </header>

      {/* Main Container */}
      <main className="p-6 max-w-7xl mx-auto space-y-8 mt-4">
        {/* Fila superior: Progreso y Simulador Financiero */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7">
            <ProgressTracker lang={lang} />
          </div>
          <div className="lg:col-span-5">
            <ProfitabilitySimulator lang={lang} />
          </div>
        </div>

        {/* Fila inferior: Copiloto de Textos y Guías de Configuración */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7">
            <CopyGenerator lang={lang} />
          </div>
          <div className="lg:col-span-5">
            <SetupGuides lang={lang} />
          </div>
        </div>
      </main>
    </div>
  );
}
