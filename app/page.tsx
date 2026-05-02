import { cookies } from "next/headers";
import HomeClient from "./HomeClient";
import { type Variant } from "@/lib/translations";

// ─── Server component: lee la cookie de variante y pasa al cliente ────────────

export default function Home() {
  const cookieStore = cookies();
  const variant = (cookieStore.get("ab_variant")?.value ?? "A") as Variant;
  return <HomeClient variant={variant} />;
}
