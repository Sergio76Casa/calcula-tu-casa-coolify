import type { Metadata } from "next";
import InmobiliariasClient from "./InmobiliariasClient";

export const metadata: Metadata = {
  title: "Captación de Propietarios para Inmobiliarias | CalculaTuCasa.com",
  description:
    "Recibe propietarios reales en exclusiva por código postal que acaban de valorar su vivienda para vender. Solicita tu primer lead de prueba gratuito.",
};

export default function InmobiliariasPage() {
  return <InmobiliariasClient />;
}
