"use client";

import { useState } from "react";

type Focus = "ia" | "energy" | "direct";
type Channel = "meta" | "reel" | "whatsapp";

const SCRIPTS: Record<Focus, Record<Channel, { title: string; content: string; desc: string }>> = {
  ia: {
    meta: {
      title: "Meta Ads Post (Copia Principal)",
      content: `🤖 ¿Estás pensando en vender tu casa y no sabes qué precio fijar?\n\nNo dejes miles de euros sobre la mesa ni pierdas meses esperando. Nuestra Inteligencia Artificial analiza al instante los precios de cierre y testigos reales de tu misma calle en Sabadell / Terrassa para darte una tasación precisa.\n\n✅ 100% Gratis y online\n✅ Informe detallado en PDF en 1 minuto\n✅ Sin llamadas molestas de inmobiliarias comerciales\n\n👉 Introduce tu dirección ahora y descárgalo: CalculaTuCasa.com`,
      desc: "Ideal para publicar en anuncios de Meta (Facebook/Instagram) optimizados para generación de leads."
    },
    reel: {
      title: "Guion de Vídeo Reel (Voz en off IA)",
      content: `[0:00 - 0:03] GANCHO VISUAL:\n(Círculo rojo en mapa local animado) \nVOZ: "¿Vives en Sabadell y estás pensando en vender tu casa?"\n\n[0:03 - 0:10] CUERPO:\n(Grabación de pantalla del móvil usando calculatucasa.com a cámara rápida)\nVOZ: "No dejes que te malvendan. Entra en calculatucasa.com, pon tu dirección y nuestra IA tasará tu piso gratis con datos reales del mercado."\n\n[0:10 - 0:15] CTA:\n(Se muestra el PDF del reporte descargándose)\nVOZ: "Haz clic abajo, introduce los datos y descarga tu informe de valoración hoy mismo."`,
      desc: "Crea este vídeo en CapCut. Puedes generar la voz usando ElevenLabs con un tono natural de tasador profesional."
    },
    whatsapp: {
      title: "Mensaje Rompehielos (Idealista / WhatsApp)",
      content: `Hola, he visto tu anuncio en Idealista. Soy de una PropTech local y hemos pasado los datos de tu vivienda por nuestro nuevo motor de valoración con IA. El informe indica que podrías defender un precio mejor si destacas ciertos puntos. Te lo he generado gratis en PDF, ¿te lo paso por aquí por si te sirve para la venta?`,
      desc: "Envíalo a particulares que venden en Idealista o Fotocasa para captar su teléfono e introducirlos en tu embudo."
    }
  },
  energy: {
    meta: {
      title: "Meta Ads Post (Copia Principal)",
      content: `⚡ ¿Sabías que una calificación energética A o B puede subir el valor de tu casa hasta un 7%?\n\nMuchos particulares pierden dinero al vender porque no saben cómo influye la eficiencia energética en su tasación real. CalculaTuCasa.com analiza las características de tu inmueble mediante Inteligencia Artificial y te entrega un informe completo.\n\n📥 Obtén tu valoración en PDF gratis en menos de 1 minuto.`,
      desc: "Excelente para conectar con un ángulo técnico que aporta mucha autoridad y despierta curiosidad."
    },
    reel: {
      title: "Guion de Vídeo Reel (Voz en off IA)",
      content: `[0:00 - 0:03] GANCHO VISUAL:\n(Gráfico con escala energética de la A a la G parpadeando)\nVOZ: "¿Cuánto influye la eficiencia energética en el precio de tu casa?"\n\n[0:03 - 0:10] CUERPO:\n(Muestra el termómetro de certificado energético subiendo)\nVOZ: "Un certificado A o B puede incrementar su valor hasta un siete por ciento. En nuestra web tasamos tu vivienda gratis con IA teniendo en cuenta la energía."\n\n[0:10 - 0:15] CTA:\n(Captura del PDF descargándose)\nVOZ: "Toca el enlace, pon tu dirección y obtén el informe de tasación gratis."`,
      desc: "Graba este reel usando clips de stock de casas modernas e iluminación LED. Usa ElevenLabs para la voz."
    },
    whatsapp: {
      title: "Mensaje Rompehielos (Idealista / WhatsApp)",
      content: `Buenas tardes, he visto tu casa publicada. Me dedico a la consultoría inmobiliaria y he notado que no mencionas el impacto de la eficiencia energética en el precio final. He sacado una valoración profesional detallada donde desglosamos cómo influye esto en el mercado actual. ¿Te interesa que te mande el informe gratuito?`,
      desc: "Enfoque técnico de alta conversión para propietarios pragmáticos."
    }
  },
  direct: {
    meta: {
      title: "Meta Ads Post (Copia Principal)",
      content: `🏡 ¿Quieres vender tu propiedad al precio correcto?\n\nObtén una tasación de mercado real al instante de forma totalmente gratuita. Sin rodeos y sin intermediarios comerciales llamándote a todas horas. Descubre el precio mínimo y máximo sugerido en segundos.\n\n👇 Entra aquí y obtén tu PDF:\nCalculaTuCasa.com`,
      desc: "Un enfoque simple y directo al grano, diseñado para maximizar clics de personas calientes."
    },
    reel: {
      title: "Guion de Vídeo Reel (Voz en off IA)",
      content: `[0:00 - 0:03] GANCHO VISUAL:\n(Texto grande: '¿Cuánto vale mi casa?' sobre fondo oscuro premium)\nVOZ: "¿Quieres saber el valor real de tu casa hoy mismo?"\n\n[0:03 - 0:10] CUERPO:\n(Pantalla navegando por la web, mostrando el candado verde y el desbloqueo)\nVOZ: "Olvídate de tasaciones caras y llamadas infinitas. Entra en calculatucasa.com, escribe tu calle y obtén un precio real en segundos."\n\n[0:10 - 0:15] CTA:\n(Flecha apuntando al botón de descarga)\nVOZ: "Entra ya y descarga tu informe de tasación gratuito."`,
      desc: "El vídeo más simple de crear. Graba la pantalla de tu propio móvil interactuando con la web en 15 segundos."
    },
    whatsapp: {
      title: "Mensaje Rompehielos (Idealista / WhatsApp)",
      content: `Hola, soy de CalculaTuCasa.com. He visto tu anuncio de venta y he generado una valoración de mercado actualizada de tu calle con nuestra plataforma para comparar con otros cierres recientes en la zona. Si quieres, dime un WhatsApp y te mando el PDF ahora mismo para que tengas el dato real.`,
      desc: "Mensaje idóneo para captar teléfonos de particulares directamente de los portales inmobiliarios."
    }
  }
};

export default function CopyGenerator() {
  const [focus, setFocus] = useState<Focus>("ia");
  const [channel, setChannel] = useState<Channel>("meta");
  const [copied, setCopied] = useState(false);

  const activeScript = SCRIPTS[focus][channel];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeScript.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-800/80 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
      <h2 className="text-xl font-extrabold text-white mb-1.5 flex items-center gap-2">
        ✍️ Generador de Textos y Guiones de Anuncios
      </h2>
      <p className="text-slate-400 text-xs mb-6">
        Selecciona la temática y el canal de publicación. Copia el guion con un solo clic y úsalo en Canva, CapCut o redes sociales.
      </p>

      {/* Selectores de Temática */}
      <div className="flex flex-wrap gap-2 mb-4 border-b border-white/5 pb-4">
        <button
          onClick={() => setFocus("ia")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            focus === "ia" ? "bg-blue-500 text-white" : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"
          }`}
        >
          🤖 Enfoque Inteligencia Artificial
        </button>
        <button
          onClick={() => setFocus("energy")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            focus === "energy" ? "bg-blue-500 text-white" : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"
          }`}
        >
          ⚡ Enfoque Eficiencia Energética
        </button>
        <button
          onClick={() => setFocus("direct")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            focus === "direct" ? "bg-blue-500 text-white" : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"
          }`}
        >
          🎯 Enfoque Directo y Simple
        </button>
      </div>

      {/* Selectores de Canal */}
      <div className="flex gap-2 mb-5">
        {(["meta", "reel", "whatsapp"] as Channel[]).map((c) => (
          <button
            key={c}
            onClick={() => setChannel(c)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all ${
              channel === c
                ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-400"
                : "border-white/5 bg-slate-900/40 text-slate-400 hover:border-white/10"
            }`}
          >
            {c === "meta" ? "Meta Ads (Post)" : c === "reel" ? "Reel / Vídeo script" : "WhatsApp Chat"}
          </button>
        ))}
      </div>

      {/* Contenedor del Script */}
      <div className="bg-slate-900/80 border border-white/5 rounded-xl p-5 relative">
        <div className="flex justify-between items-start gap-4 mb-3">
          <div>
            <h3 className="text-white font-bold text-sm">{activeScript.title}</h3>
            <p className="text-slate-500 text-[11px] mt-0.5">{activeScript.desc}</p>
          </div>
          <button
            onClick={handleCopy}
            className="flex-shrink-0 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-medium rounded-lg border border-white/10 transition-colors flex items-center gap-1.5 active:scale-[0.98]"
          >
            {copied ? "✅ ¡Copiado!" : "📋 Copiar Texto"}
          </button>
        </div>

        <pre className="text-slate-300 text-xs font-mono leading-relaxed whitespace-pre-wrap select-all bg-black/30 p-4 rounded-lg overflow-x-auto max-h-72 overflow-y-auto">
          {activeScript.content}
        </pre>
      </div>
    </div>
  );
}
