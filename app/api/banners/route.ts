import { NextResponse } from "next/server";
import { pbList } from "@/lib/pocketbase";

export async function GET() {
  try {
    const banners = await pbList("social_proof_banners", "is_active = true");
    
    const formatted = banners.map((b: any) => {
      let postalCodes: string[] = [];
      if (Array.isArray(b.postal_codes)) {
        postalCodes = b.postal_codes;
      } else if (typeof b.postal_codes === "string") {
        try {
          postalCodes = JSON.parse(b.postal_codes);
        } catch {
          postalCodes = b.postal_codes.split(",").map((s: string) => s.trim());
        }
      }
      return {
        location_name: b.location_name,
        postal_codes: postalCodes,
      };
    });

    return NextResponse.json(formatted);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error interno";
    console.error("[api/banners]", msg);
    // Retornamos un array vacío por seguridad para que la landing no falle si PocketBase no está configurado
    return NextResponse.json([]);
  }
}
