"use client";

import { useState } from "react";
import Link from "next/link";

export default function InmobiliariasClient() {
  const [nombreAgencia, setNombreAgencia] = useState("");
  const [personaContacto, setPersonaContacto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [web, setWeb] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [notas, setNotas] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/inmobiliarias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_agencia: nombreAgencia,
          persona_contacto: personaContacto,
          telefono,
          email,
          web,
          ciudad,
          codigo_postal: codigoPostal,
          notas,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo enviar la solicitud.");
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Error de conexión. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500/30">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-emerald-500/10 blur-[130px] rounded-full" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-blue-500/10 blur-[130px] rounded-full" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-slate-950/70 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20">
              C
            </div>
            <div>
              <span className="font-bold text-white tracking-tight">CalculaTuCasa</span>
              <span className="ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Para Agencias
              </span>
            </div>
          </Link>
          <a
            href="#solicitar-prueba"
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition-colors shadow-lg shadow-emerald-500/20"
          >
            Pedir lead de prueba gratis
          </a>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-5 py-12 sm:py-16 space-y-20">
        {/* Hero */}
        <section className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Exclusividad por Código Postal · Sin permanencia
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Propietarios reales de tu zona{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                que quieren vender su vivienda
              </span>
            </h1>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
              Captamos propietarios en tu ciudad que acaban de tasar su piso o casa con nuestra IA,
              filtramos su plazo de venta y te enviamos la ficha completa al instante por{" "}
              <strong className="text-white">Telegram o WhatsApp</strong>. Sin compartir el contacto con otras agencias.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <a
                href="#solicitar-prueba"
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all"
              >
                Solicitar 1 lead de prueba gratis →
              </a>
              <a
                href="#como-funciona"
                className="px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm transition-all"
              >
                Ver ejemplo de ficha
              </a>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10 text-center sm:text-left">
              <div>
                <p className="text-xl sm:text-2xl font-extrabold text-white">100%</p>
                <p className="text-xs text-slate-400">Exclusivo en tu CP</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-extrabold text-emerald-400">&lt; 5 seg</p>
                <p className="text-xs text-slate-400">Entrega en tiempo real</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-extrabold text-white">0 €</p>
                <p className="text-xs text-slate-400">Primer lead de prueba</p>
              </div>
            </div>
          </div>

          {/* Mockup ficha de lead */}
          <div id="como-funciona" className="bg-slate-900/90 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 text-sm font-bold">
                  🤖
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Así recibes cada propietario</p>
                  <p className="text-[11px] text-emerald-400">Entrega instantánea por Telegram o WhatsApp</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[11px] font-bold">
                🔥 Venta 1–3 meses
              </span>
            </div>

            <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 text-xs sm:text-sm space-y-2 text-slate-200 font-mono leading-relaxed">
              <p className="text-emerald-300 font-bold">🏠 Nuevo Propietario en tu Zona (08201)</p>
              <p>👤 <span className="text-slate-400">Nombre:</span> Laura Martínez</p>
              <p>📞 <span className="text-slate-400">Teléfono:</span> 612 345 678</p>
              <div className="border-t border-white/10 my-2 pt-2 space-y-1">
                <p>📍 <span className="text-slate-400">Dirección:</span> Rambla d&apos;Ègara, Sabadell (08201)</p>
                <p>🏢 <span className="text-slate-400">Tipo:</span> Piso | <span className="text-slate-400">Superficie:</span> 98 m²</p>
                <p>🛏️ <span className="text-slate-400">Habitaciones:</span> 3 hab. | <span className="text-slate-400">Estado:</span> Buen estado</p>
                <p>🛗 <span className="text-slate-400">Ascensor:</span> Sí | 🅿️ <span className="text-slate-400">Parking:</span> Sí</p>
                <p>💶 <span className="text-slate-400">Valoración IA:</span> 268.000 €</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 text-center">
              Llamas al propietario en los primeros minutos mientras tiene fresca su valoración.
            </p>
          </div>
        </section>

        {/* 3 pasos */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Cómo funciona para tu inmobiliaria</h2>
            <p className="text-sm text-slate-400">Sin portales saturados ni subastas entre 10 agencias.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                num: "01",
                title: "Captamos en tu código postal",
                desc: "Nuestras campañas segmentadas atraen a propietarios de tu zona que buscan saber cuánto vale su vivienda hoy.",
              },
              {
                num: "02",
                title: "Cualificamos el inmueble y la urgencia",
                desc: "Recogemos m², habitaciones, ascensor, parking, estado y el plazo en el que piensan vender.",
              },
              {
                num: "03",
                title: "Exclusividad en tu móvil",
                desc: "El lead entra directo a tu Telegram o WhatsApp. Solo una agencia activa por cada código postal.",
              },
            ].map((item) => (
              <div
                key={item.num}
                className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-3 hover:border-emerald-500/30 transition-colors"
              >
                <span className="inline-block text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  PASO {item.num}
                </span>
                <h3 className="text-lg font-bold text-white">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Formulario B2B */}
        <section id="solicitar-prueba" className="max-w-2xl mx-auto">
          <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Solicita tu primer lead de prueba gratis
              </h2>
              <p className="text-sm text-slate-400">
                Comprueba si tus códigos postales siguen disponibles y recibe un propietario de prueba sin compromiso.
              </p>
            </div>

            {submitted ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-3">
                <div className="text-3xl">✅</div>
                <h3 className="text-lg font-bold text-emerald-300">¡Solicitud recibida!</h3>
                <p className="text-sm text-slate-300">
                  Hemos registrado a <strong className="text-white">{nombreAgencia}</strong>. Revisaremos la
                  disponibilidad en <strong className="text-white">{codigoPostal || ciudad}</strong> y te contactaremos
                  por WhatsApp en breve.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Nombre de la inmobiliaria *
                    </label>
                    <input
                      type="text"
                      required
                      value={nombreAgencia}
                      onChange={(e) => setNombreAgencia(e.target.value)}
                      placeholder="Ej. Fincas Vallès"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Persona de contacto
                    </label>
                    <input
                      type="text"
                      value={personaContacto}
                      onChange={(e) => setPersonaContacto(e.target.value)}
                      placeholder="Ej. Carlos Ruiz"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="Ej. 600 123 456"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Email comercial
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="info@tuagencia.com"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Ciudad / Zona principal *
                    </label>
                    <input
                      type="text"
                      required
                      value={ciudad}
                      onChange={(e) => setCiudad(e.target.value)}
                      placeholder="Ej. Sabadell / Terrassa"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Códigos Postales de interés
                    </label>
                    <input
                      type="text"
                      value={codigoPostal}
                      onChange={(e) => setCodigoPostal(e.target.value)}
                      placeholder="Ej. 08201, 08202, 08205"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Web o comentarios (opcional)
                  </label>
                  <input
                    type="text"
                    value={web}
                    onChange={(e) => setWeb(e.target.value)}
                    placeholder="https://tuagencia.com"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-emerald-400 mb-2"
                  />
                  <textarea
                    rows={2}
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Indícanos si prefieres recibir los leads por Telegram o WhatsApp..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-emerald-400 resize-none"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  {submitting ? "Enviando solicitud..." : "Solicitar lead de prueba gratis"}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-6 text-center text-xs text-slate-500">
        <p>
          CalculaTuCasa.com ·{" "}
          <Link href="/" className="text-slate-400 hover:text-white underline">
            Ir a la calculadora de propietarios
          </Link>
        </p>
      </footer>
    </div>
  );
}
