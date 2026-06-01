"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams }   from "next/navigation";
import HeroSection           from "@/components/landing/HeroSection";
import PropertyDetailsStep,  { type PropertyDetails } from "@/components/landing/PropertyDetailsStep";
import LoadingValuationStep, { type ValuationInput, type ValuationResult } from "@/components/landing/LoadingValuationStep";
import LeadCaptureStep       from "@/components/landing/LeadCaptureStep";
import ValuationDashboard    from "@/components/landing/ValuationDashboard";
import LanguageSelector      from "@/components/LanguageSelector";
import SocialProofToast      from "@/components/SocialProofToast";
import { type Lang, type Variant } from "@/lib/translations";
import { trackPixelEvent }   from "@/components/MetaPixel";

// ─── Tipos y helpers ──────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5;

function detectLang(): Lang {
  if (typeof navigator === "undefined") return "es";
  const code = navigator.language.toLowerCase();
  if (code.startsWith("ca")) return "ca";
  if (code.startsWith("en")) return "en";
  return "es";
}

// ─── Inner component (necesita useSearchParams → dentro de Suspense) ──────────

function HomeInner({ variant }: { variant: Variant }) {
  const [step,    setStep]    = useState<Step>(1);
  const [lang,    setLang]    = useState<Lang>("es");
  const [address, setAddress] = useState("");
  const [details, setDetails] = useState<PropertyDetails | null>(null);
  const [result,  setResult]  = useState<ValuationResult  | null>(null);
  const [leadId,  setLeadId]  = useState<string | null>(null);
  const [telefonoInicial, setTelefonoInicial] = useState<string | null>(null);
  const [leadNombre, setLeadNombre] = useState<string | null>(null);

  const searchParams  = useSearchParams();
  const utmSource     = searchParams.get("utm_source")   ?? "";
  const utmCampaign   = searchParams.get("utm_campaign") ?? "";

  useEffect(() => { setLang(detectLang()); }, []);

  function reset() { 
    setStep(1); 
    setAddress(""); 
    setDetails(null); 
    setResult(null); 
    setLeadId(null); 
    setTelefonoInicial(null);
    setLeadNombre(null);
  }

  const valuationInput: ValuationInput | null =
    address && details
      ? { address, m2: details.m2, estado: details.estado,
          tipo: details.tipo, habitaciones: details.habitaciones,
          ascensor: details.ascensor, jardin: details.jardin, lang,
          energyCertificate: details.energyCertificate }
      : null;

  return (
    <>
      <LanguageSelector lang={lang} onChange={setLang} />
      <SocialProofToast lang={lang} currentAddress={address} />

      {step === 1 && (
        <HeroSection
          lang={lang}
          variant={variant}
          onNext={(addr) => {
            setAddress(addr);
            setStep(2);
            trackPixelEvent("IniciarValoracion", { address: addr });
          }}
        />
      )}
      {step === 2 && (
        <PropertyDetailsStep
          lang={lang}
          address={address}
          onBack={() => setStep(1)}
          onCalculate={(d) => { setDetails(d); setStep(3); }}
        />
      )}
      {step === 3 && valuationInput && (
        <LoadingValuationStep
          input={valuationInput}
          onComplete={(res) => { setResult(res); setStep(4); }}
          onRetry={() => setStep(2)}
        />
      )}
      {step === 4 && result && (
        <LeadCaptureStep
          lang={lang}
          variant={variant}
          utmSource={utmSource}
          utmCampaign={utmCampaign}
          result={result}
          onBack={() => setStep(2)}
          onFinish={(id, tel, name) => { 
            console.log("DEBUG - HomeClient recibiendo onFinish:", { id, tel, name });
            setLeadId(id); 
            setTelefonoInicial(tel);
            setLeadNombre(name);
            setStep(5); 
            trackPixelEvent("Lead", { id, name });
          }}
        />
      )}
      {step === 5 && result && details && (
        <ValuationDashboard
          result={result}
          details={details}
          address={address}
          lang={lang}
          leadId={leadId}
          telefonoInicial={telefonoInicial}
          leadNombre={leadNombre}
          onReset={reset}
        />
      )}
    </>
  );
}

// ─── Export envuelto en Suspense ──────────────────────────────────────────────

export default function HomeClient({ variant }: { variant: Variant }) {
  return (
    <Suspense fallback={null}>
      <HomeInner variant={variant} />
    </Suspense>
  );
}
