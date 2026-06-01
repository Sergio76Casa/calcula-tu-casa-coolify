"use client";

import { useState, useEffect } from "react";

interface Task {
  id: string;
  text: string;
}

interface Day {
  day: number;
  title: string;
  tasks: Task[];
}

const ROADMAP_DAYS: Day[] = [
  {
    day: 1,
    title: "Configuración de Entornos y Cuentas",
    tasks: [
      { id: "d1-t1", text: "Configurar el entorno paralelo de Staging (Local o subdominio en Coolify) para pruebas seguras." },
      { id: "d1-t2", text: "Crear una cuenta en ManyChat y vincularla a la cuenta profesional de Instagram." },
      { id: "d1-t3", text: "Crear el Píxel de Meta desde el Administrador de Anuncios y guardar el ID del píxel." }
    ]
  },
  {
    day: 2,
    title: "Creación del Roadmap y Enlace en Admin",
    tasks: [
      { id: "d2-t1", text: "Diseñar e implementar la ruta /roadmap privada con el simulador de ROI y guiones de texto." },
      { id: "d2-t2", text: "Añadir botón de acceso seguro al Roadmap y el CRUD de inmobiliarias en el panel de /admin." }
    ]
  },
  {
    day: 3,
    title: "Integración de Meta Pixel y API Endpoint",
    tasks: [
      { id: "d3-t1", text: "Insertar el código de Meta Pixel en layout.tsx para registrar visitas a la web de forma automática." },
      { id: "d3-t2", text: "Habilitar la integración en HomeClient.tsx para que lance el evento 'LeadCapturado' al finalizar el paso 4." },
      { id: "d3-t3", text: "Habilitar la API de valoraciones en /api/valorar para responder a las llamadas de webhook de ManyChat." }
    ]
  },
  {
    day: 4,
    title: "Mapeo de Códigos Postales e Inmobiliarias",
    tasks: [
      { id: "d4-t1", text: "Comprobar las tablas relacionales de 'inmobiliarias' y 'zonas_inmobiliarias' en PocketBase." },
      { id: "d4-t2", text: "Implementar en el panel de admin las pestañas CRUD para asociar códigos postales con agencias." },
      { id: "d4-t3", text: "Modificar la API de leads para enrutar los nuevos contactos y enviar Telegrams al Admin y agencias." }
    ]
  },
  {
    day: 5,
    title: "Automatización de ManyChat (Instagram / WA)",
    tasks: [
      { id: "d5-t1", text: "Configurar en ManyChat el flujo de preguntas (Calle, m2, estado) y vincular la llamada API externa." },
      { id: "d5-t2", text: "Testear desde un móvil que ManyChat devuelva la tasación real de Gemini y registre el lead en PocketBase." }
    ]
  },
  {
    day: 6,
    title: "Creación de Creativos y Lanzamiento",
    tasks: [
      { id: "d6-t1", text: "Editar 2 Reels dinámicos en CapCut usando ganchos locales, capturas del móvil y voz de ElevenLabs." },
      { id: "d6-t2", text: "Lanzar en Meta Ads una campaña dual: Campaña A (a Web con Pixel) y Campaña B (a Chat con ManyChat)." }
    ]
  },
  {
    day: 7,
    title: "Despliegue a Producción y Cierre B2B",
    tasks: [
      { id: "d7-t1", text: "Subir a producción (Coolify) todas las modificaciones verificadas en el entorno Staging." },
      { id: "d7-t2", text: "Revisar los primeros leads de prueba, y proponer los leads calificados a las agencias inmobiliarias." }
    ]
  }
];

export default function ProgressTracker() {
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});
  const [activeDay, setActiveDay] = useState<number>(1);

  // Cargar estado inicial desde LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("calculatucasa_roadmap_checked");
    if (saved) {
      try {
        setCheckedTasks(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleToggle = (taskId: string) => {
    setCheckedTasks((prev) => {
      const updated = { ...prev, [taskId]: !prev[taskId] };
      localStorage.setItem("calculatucasa_roadmap_checked", JSON.stringify(updated));
      return updated;
    });
  };

  // Calcular Progreso Total
  const totalTasks = ROADMAP_DAYS.reduce((sum, d) => sum + d.tasks.length, 0);
  const completedTasks = Object.values(checkedTasks).filter(Boolean).length;
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="bg-slate-800/80 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            🚀 Plan de Acción Diario (Roadmap de 7 Días)
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Marca las casillas conforme completes cada fase para monitorizar tu avance hacia el sistema 100% automático.
          </p>
        </div>
        {/* Progreso Circular o Barra */}
        <div className="flex items-center gap-3 bg-slate-900/60 border border-white/5 rounded-xl px-4 py-2 flex-shrink-0 w-full sm:w-auto">
          <div className="text-left">
            <p className="text-[9px] uppercase tracking-wider text-slate-500">Progreso Total</p>
            <p className="text-lg font-black text-emerald-400">{progressPct}% completado</p>
          </div>
          <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-400" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* Navegación por Días */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 mb-6 scrollbar-thin border-b border-white/5">
        {ROADMAP_DAYS.map((d) => {
          const dayTasks = d.tasks.map(t => t.id);
          const dayCompleted = dayTasks.every(id => checkedTasks[id]);
          const dayStarted = dayTasks.some(id => checkedTasks[id]);

          return (
            <button
              key={d.day}
              onClick={() => setActiveDay(d.day)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeDay === d.day
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                  : "bg-slate-900/40 text-slate-400 border border-white/5 hover:border-white/10"
              }`}
            >
              <span>Día {d.day}</span>
              {dayCompleted ? (
                <span className="text-emerald-400">✓</span>
              ) : dayStarted ? (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Día Activo */}
      {ROADMAP_DAYS.filter(d => d.day === activeDay).map((d) => (
        <div key={d.day} className="space-y-4 animate-fadeIn">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              📅 Día {d.day}: {d.title}
            </h3>
          </div>

          <ul className="space-y-3">
            {d.tasks.map((task) => {
              const isChecked = !!checkedTasks[task.id];
              return (
                <li
                  key={task.id}
                  onClick={() => handleToggle(task.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-4 ${
                    isChecked
                      ? "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10"
                      : "border-white/10 bg-slate-900/20 hover:border-white/20"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}} // Manejado por el onClick del li
                    className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-emerald-400 focus:ring-emerald-400/50 cursor-pointer mt-0.5"
                  />
                  <span className={`text-sm leading-relaxed ${isChecked ? "text-slate-400 line-through" : "text-slate-200"}`}>
                    {task.text}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
