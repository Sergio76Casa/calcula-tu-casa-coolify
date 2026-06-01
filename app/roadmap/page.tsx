"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { pbClient } from "@/lib/pocketbase-client";
import LoginGate from "../admin/LoginGate";
import ProfitabilitySimulator from "@/components/roadmap/ProfitabilitySimulator";
import ProgressTracker from "@/components/roadmap/ProgressTracker";
import CopyGenerator from "@/components/roadmap/CopyGenerator";
import SetupGuides from "@/components/roadmap/SetupGuides";

export default function RoadmapPage() {
  const [session, setSession] = useState<unknown>(null);
  const [checking, setChecking] = useState(true);

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
  if (!session) return <LoginGate />;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-sm border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            🧭 Roadmap de Lanzamiento y Automatización
          </h1>
          <p className="text-slate-500 text-xs">
            Guía de acción interactiva y herramientas publicitarias para CalculaTuCasa
          </p>
        </div>
        <Link
          href="/admin"
          className="px-4 py-2 text-sm text-slate-300 hover:text-white border border-white/10 hover:border-white/30 rounded-xl transition-all flex items-center gap-2 bg-white/5 active:scale-[0.98]"
        >
          ← Volver a Admin
        </Link>
      </header>

      {/* Main Container */}
      <main className="p-6 max-w-7xl mx-auto space-y-8 mt-4">
        {/* Fila superior: Progreso y Simulador Financiero */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7">
            <ProgressTracker />
          </div>
          <div className="lg:col-span-5">
            <ProfitabilitySimulator />
          </div>
        </div>

        {/* Fila inferior: Copiloto de Textos y Guías de Configuración */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7">
            <CopyGenerator />
          </div>
          <div className="lg:col-span-5">
            <SetupGuides />
          </div>
        </div>
      </main>
    </div>
  );
}
