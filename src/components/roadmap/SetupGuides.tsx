"use client";

import { useState } from "react";

type GuideTab = "pixel" | "manychat";

export default function SetupGuides() {
  const [activeTab, setActiveTab] = useState<GuideTab>("pixel");

  return (
    <div className="bg-slate-800/80 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
      <h2 className="text-xl font-extrabold text-white mb-2 flex items-center gap-2">
        ⚙️ Manual de Configuración Técnica
      </h2>
      <p className="text-slate-400 text-xs mb-6">
        Sigue los pasos técnicos para conectar el Meta Pixel en el código y ManyChat en las redes sociales.
      </p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/5 pb-4">
        <button
          onClick={() => setActiveTab("pixel")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "pixel"
              ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
              : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"
          }`}
        >
          🔵 Conexión de Meta Pixel
        </button>
        <button
          onClick={() => setActiveTab("manychat")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "manychat"
              ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
              : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"
          }`}
        >
          💬 Conexión de ManyChat
        </button>
      </div>

      {activeTab === "pixel" ? (
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <p className="text-slate-400 text-xs">
            El Meta Pixel registrará los eventos clave del embudo para optimizar tus anuncios. Estos son los eventos configurados:
          </p>
          <div className="space-y-3">
            <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1">Evento 1</span>
              <h4 className="text-white font-bold text-sm">PageView (Entrada a la Web)</h4>
              <p className="text-slate-400 text-xs mt-1">Se dispara automáticamente en cuanto un usuario carga la Landing. Sirve para crear audiencias personalizadas.</p>
            </div>
            <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1">Evento 2</span>
              <h4 className="text-white font-bold text-sm">IniciarValoracion (Paso 2)</h4>
              <p className="text-slate-400 text-xs mt-1">Se dispara cuando el usuario introduce su dirección e inicia el Paso 2. Muestra interés.</p>
            </div>
            <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">Evento 3</span>
              <h4 className="text-white font-bold text-sm">Lead (Paso 4 Completado)</h4>
              <p className="text-slate-400 text-xs mt-1">El evento más importante. Se dispara al guardar los datos de contacto y desbloquear la valoración. Es el evento de optimización de tu campaña.</p>
            </div>
          </div>
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-xs text-blue-200 mt-2">
            💡 **Prueba de Funcionamiento:** Descárgate la extensión **Meta Pixel Helper** para Chrome. Abre tu web y comprueba que los eventos cambian de gris a verde al avanzar de paso.
          </div>
        </div>
      ) : (
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <p className="text-slate-400 text-xs">
            Configura ManyChat para hacer tasaciones directamente en los chats de Instagram y WhatsApp:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-xs text-slate-300">
            <li>
              Crea un flujo de conversación (Automation) que empiece al recibir una palabra clave como <strong className="text-white">"VALORAR"</strong>.
            </li>
            <li>
              Configura preguntas para capturar:
              <ul className="list-disc pl-5 mt-1 text-slate-400 space-y-1">
                <li><code className="text-slate-300">direccion</code> (Dirección de la casa)</li>
                <li><code className="text-slate-300">m2</code> (Metros cuadrados, número entero)</li>
                <li><code className="text-slate-300">estado</code> (Opciones: nuevo, bueno, regular, a_reformar)</li>
              </ul>
            </li>
            <li>
              Añade un bloque de acción <strong className="text-blue-400">"External Request"</strong> (Llamada HTTP POST) en ManyChat:
              <ul className="list-disc pl-5 mt-1 text-slate-400">
                <li>URL: <code className="text-slate-300">https://calculatucasa.com/api/valorar</code></li>
                <li>Body (JSON): envía las variables de dirección, m2, estado y el idioma "es".</li>
              </ul>
            </li>
            <li>
              La llamada devolverá un JSON con el <code className="text-emerald-400">precio_sugerido</code> y el enlace al informe. Envíalo al chat.
            </li>
            <li>
              Pide su Teléfono/Email final para guardar el contacto llamando al endpoint <code className="text-slate-300">/api/lead</code>.
            </li>
          </ol>
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-xs text-emerald-300">
            ✅ **Resultado:** El usuario obtiene la tasación en 10 segundos directamente en Instagram sin salir de la app.
          </div>
        </div>
      )}
    </div>
  );
}
