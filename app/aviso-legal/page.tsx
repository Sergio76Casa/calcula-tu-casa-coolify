import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Aviso Legal | CalculaTuCasa.com",
  robots: { index: true, follow: true },
};

export default function AvisoLegalPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-300 px-5 py-12">
      <div className="max-w-3xl mx-auto space-y-6 text-sm leading-relaxed">
        <Link href="/" className="text-blue-400 underline text-xs">← Volver</Link>
        <h1 className="text-3xl font-extrabold text-white">Aviso Legal</h1>
        <p className="text-slate-500 text-xs">Última actualización: {LEGAL.actualizado}</p>

        <h2 className="text-lg font-bold text-white pt-2">Titular del sitio web</h2>
        <p>
          {LEGAL.titular} · {LEGAL.nif} · {LEGAL.domicilio} · Email: {LEGAL.email} · Web: {LEGAL.web}
        </p>

        <h2 className="text-lg font-bold text-white pt-2">Objeto</h2>
        <p>
          CalculaTuCasa.com ofrece una valoración orientativa de inmuebles generada con inteligencia artificial y,
          con el consentimiento del usuario, pone en contacto a propietarios con inmobiliarias colaboradoras.
        </p>

        <h2 className="text-lg font-bold text-white pt-2">Limitación de responsabilidad</h2>
        <p>
          Las valoraciones son estimaciones y no constituyen una tasación oficial ni garantizan un precio de venta.
          No nos responsabilizamos de las decisiones tomadas a partir de ellas ni de la actuación de las inmobiliarias
          colaboradoras, que son independientes.
        </p>

        <h2 className="text-lg font-bold text-white pt-2">Propiedad intelectual</h2>
        <p>
          Los contenidos, diseño y marca del sitio son del titular. Queda prohibida su reproducción sin autorización.
        </p>

        <h2 className="text-lg font-bold text-white pt-2">Protección de datos</h2>
        <p>
          Consulta nuestra <Link href="/privacidad" className="text-blue-400 underline">Política de Privacidad</Link>.
        </p>
      </div>
    </main>
  );
}
