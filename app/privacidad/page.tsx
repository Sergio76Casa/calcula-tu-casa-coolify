import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de Privacidad | CalculaTuCasa.com",
  robots: { index: true, follow: true },
};

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-300 px-5 py-12">
      <div className="max-w-3xl mx-auto space-y-6 text-sm leading-relaxed">
        <Link href="/" className="text-blue-400 underline text-xs">← Volver</Link>
        <h1 className="text-3xl font-extrabold text-white">Política de Privacidad</h1>
        <p className="text-slate-500 text-xs">Última actualización: {LEGAL.actualizado}</p>

        <h2 className="text-lg font-bold text-white pt-2">1. Responsable del tratamiento</h2>
        <p>
          {LEGAL.titular} · {LEGAL.nif} · {LEGAL.domicilio} · Email: {LEGAL.email} · Web: {LEGAL.web}
        </p>

        <h2 className="text-lg font-bold text-white pt-2">2. Datos que tratamos</h2>
        <p>
          Nombre, teléfono, email (opcional), dirección y características del inmueble que nos
          facilitas (superficie, habitaciones, estado, ascensor, garaje, etc.), la valoración
          estimada generada, tu idioma y datos de origen de la campaña publicitaria (parámetros UTM).
        </p>

        <h2 className="text-lg font-bold text-white pt-2">3. Finalidades y base jurídica</h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong className="text-white">Generar tu valoración e informe</strong> y atender tu solicitud.
            Base: ejecución de tu petición y tu consentimiento (art. 6.1.a y 6.1.b RGPD).
          </li>
          <li>
            <strong className="text-white">Cederlos a una inmobiliaria colaboradora de tu zona</strong> para
            que te contacte en relación con la venta de tu vivienda. Base: tu consentimiento expreso,
            que prestas marcando la casilla del formulario (art. 6.1.a RGPD). Es voluntario y puedes retirarlo en cualquier momento.
          </li>
          <li>
            <strong className="text-white">Medir la eficacia de las campañas</strong> (UTM, Píxel de Meta). Base: tu
            consentimiento a las cookies/tecnologías de seguimiento.
          </li>
        </ul>

        <h2 className="text-lg font-bold text-white pt-2">4. Destinatarios</h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong className="text-white">Inmobiliaria colaboradora</strong> asignada a tu código postal, únicamente
            si has aceptado la cesión. Esta pasa a ser responsable del tratamiento de los datos que recibe.
          </li>
          <li>
            <strong className="text-white">Proveedores (encargados del tratamiento):</strong> alojamiento en servidores
            (Hetzner, UE), valoración mediante IA (Google Gemini), mensajería (Telegram, Meta/ManyChat) y publicidad (Meta).
            Algunos pueden implicar transferencias internacionales amparadas en cláusulas contractuales tipo o decisión de adecuación.
          </li>
        </ul>

        <h2 className="text-lg font-bold text-white pt-2">5. Conservación</h2>
        <p>
          Conservamos tus datos mientras sea necesario para las finalidades indicadas y, después, bloqueados durante
          los plazos legales de prescripción de responsabilidades. Si retiras tu consentimiento, dejaremos de tratarlos.
        </p>

        <h2 className="text-lg font-bold text-white pt-2">6. Tus derechos</h2>
        <p>
          Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad, y
          retirar tu consentimiento, escribiendo a {LEGAL.email}. Si consideras que no hemos atendido tus derechos,
          puedes reclamar ante la Agencia Española de Protección de Datos (<a className="text-blue-400 underline" href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">www.aepd.es</a>).
        </p>

        <h2 className="text-lg font-bold text-white pt-2">7. Valoración orientativa</h2>
        <p>
          La valoración es una estimación automática generada con inteligencia artificial y no sustituye a una tasación oficial.
        </p>
      </div>
    </main>
  );
}
