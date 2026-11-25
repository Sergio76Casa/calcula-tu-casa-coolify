import { NextResponse } from "next/server";
import { pbCreate, pbList } from "@/lib/pocketbase";

const SKIP_HOSTS = [
  "idealista.com", "fotocasa.es", "habitaclia.com", "pisos.com", "yaencontre.com",
  "indomio.es", "milanuncios.com", "paginasamarillas.es", "cylex.es", "einforma.com",
  "empresite.eleconomista.es", "infocif.es", "axesor.es", "facebook.com", "instagram.com",
  "linkedin.com", "youtube.com", "twitter.com", "x.com", "tiktok.com", "wikipedia.org",
  "google.com", "google.es", "mapquest.com", "yelp.es", "yelp.com", "tripadvisor.es",
  "lainmobiliaria.org", "inmobiliarias.es", "realadvisor.es", "housfy.com", "clicpiso.com",
  "mundoinmobiliarias.es", "cronoshare.com", "trustpilot.com", "glassdoor.es", "infojobs.net",
  "infobiliaria.es", "prensasemanal.es", "vulka.es", "guiaempresas.universia.es", "iberinform.es"
];

const VALID_TLDS = new Set(["es", "com", "cat", "net", "org", "eu", "info", "co", "biz"]);
const GENERIC_TITLES = /^(home|inicio|inici|index|portada|bienvenidos|benvinguts|welcome|pisos.*|casas.*|inmobiliarias?\s+.*)$/i;

function getRootDomain(hostname: string): string {
  const parts = hostname.replace(/^www\./, "").toLowerCase().split(".");
  if (parts.length >= 2) return parts.slice(-2).join(".");
  return hostname.toLowerCase();
}

function cleanAgencyName(rawTitle: string, rootDomain: string): string {
  const segments = rawTitle
    .split(/\s+[-|–—:·•]\s+/)
    .map((s) =>
      s
        .replace(/,?\s*inmobiliaria en .*/i, "")
        .replace(/:\s*tel[ée]fono.*/i, "")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean);

  const goodSegment = segments.find((s) => !GENERIC_TITLES.test(s) && s.length >= 3);
  if (goodSegment) {
    return goodSegment.replace(/\s*\(.*?\)\s*/g, "").slice(0, 65).trim();
  }
  const base = rootDomain.split(".")[0].replace(/[-_]+/g, " ");
  return base.replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractEmailsAndPhones(html: string): { email: string; phone: string } {
  const rawEmails = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}/g) || [];
  const validEmails = rawEmails
    .map((e) => e.toLowerCase().trim())
    .filter((e) => {
      const [local, domain] = e.split("@");
      if (!local || !domain || local.length > 32) return false;
      const domParts = domain.split(".");
      const tld = domParts[domParts.length - 1];
      if (!VALID_TLDS.has(tld)) return false;
      if (domParts.some((p) => p.length > 26)) return false;
      if (
        ["sentry.io", "wixpress.com", "example.com", "schema.org", "w3.org", "wordpress.org", "godaddy.com"].some((b) =>
          domain.endsWith(b)
        )
      ) {
        return false;
      }
      return true;
    });

  const uniqueEmails = Array.from(new Set(validEmails));
  const bestEmail =
    uniqueEmails.find((e) =>
      /^(info|contacto|contacte|hola|comercial|sabadell|terrassa|ventas|recepcio|recepcion|oficina|agencia)@/.test(e)
    ) ||
    uniqueEmails[0] ||
    "";

  const phones: string[] = [];
  const telRegex = /href=["']tel:([^"']+)["']/gi;
  let tm: RegExpExecArray | null;
  while ((tm = telRegex.exec(html)) !== null) {
    const d = tm[1].replace(/[^\d]/g, "").replace(/^34(?=\d{9}$)/, "");
    if (/^[6789]\d{8}$/.test(d)) phones.push(d);
  }

  const textNoTags = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  const phoneRegex = /(?:\+34[\s.-]?)?\b([6789]\d{2}[\s.-]?\d{2,3}[\s.-]?\d{2,3}(?:[\s.-]?\d{2})?)\b/g;
  let pm: RegExpExecArray | null;
  while ((pm = phoneRegex.exec(textNoTags)) !== null) {
    const d = pm[1].replace(/[^\d]/g, "");
    if (/^[6789]\d{8}$/.test(d)) phones.push(d);
  }

  const uniquePhones = Array.from(new Set(phones));
  const mobile = uniquePhones.find((p) => /^[67]/.test(p));
  const bestPhone = mobile || uniquePhones[0] || "";

  return { email: bestEmail, phone: bestPhone };
}

async function searchDuckDuckGo(query: string): Promise<{ title: string; url: string }[]> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "es-ES,es;q=0.9",
      },
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) return [];
    const html = await res.text();
    const results: { title: string; url: string }[] = [];
    const regex = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(html)) !== null) {
      let href = m[1];
      const uddg = href.match(/[?&]uddg=([^&]+)/);
      if (uddg) href = decodeURIComponent(uddg[1]);
      const title = m[2].replace(/<[^>]+>/g, "").trim();
      results.push({ title, url: href });
    }
    return results;
  } catch {
    return [];
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ciudad = (body.ciudad || "").trim();
    const codigo_postal = (body.codigo_postal || "").trim();

    if (!ciudad && !codigo_postal) {
      return NextResponse.json(
        { error: "Indica al menos una ciudad o un código postal." },
        { status: 400 }
      );
    }

    const locQuery = [ciudad, codigo_postal].filter(Boolean).join(" ");
    const [q1, q2] = await Promise.all([
      searchDuckDuckGo(`inmobiliaria ${locQuery} contacto telefono`),
      searchDuckDuckGo(`finques immobiliaria ${locQuery}`),
    ]);

    const candidates: { item: { title: string; url: string }; u: URL; root: string }[] = [];
    const seenRoots = new Set<string>();

    for (const item of [...q1, ...q2]) {
      try {
        if (/\b(mejores|top\s+\d+|ranking|listado|directorio)\b/i.test(item.title)) continue;
        const u = new URL(item.url);
        const root = getRootDomain(u.hostname);
        if (seenRoots.has(root)) continue;
        if (SKIP_HOSTS.some((sh) => root === sh || root.endsWith("." + sh))) continue;
        seenRoots.add(root);
        candidates.push({ item, u, root });
      } catch {
        // invalid URL
      }
    }

    const scraped = (
      await Promise.all(
        candidates.slice(0, 15).map(async ({ item, u, root }) => {
          try {
            const origin = `${u.protocol}//${u.hostname}`;
            const r = await fetch(item.url, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0",
              },
              signal: AbortSignal.timeout(4500),
            });
            if (!r.ok) return null;
            const html = await r.text();
            let { email, phone } = extractEmailsAndPhones(html);

            if (!email || !phone) {
              const contactMatch = html.match(
                /href=["']([^"']*(?:contact|contacte|contacto)[^"']*)["']/i
              );
              if (contactMatch) {
                try {
                  const contactUrl = new URL(contactMatch[1], origin).toString();
                  const cr = await fetch(contactUrl, {
                    headers: {
                      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0",
                    },
                    signal: AbortSignal.timeout(3500),
                  });
                  if (cr.ok) {
                    const extra = extractEmailsAndPhones(await cr.text());
                    if (!email && extra.email) email = extra.email;
                    if (!phone && extra.phone) phone = extra.phone;
                  }
                } catch {
                  // ignore contact page timeout
                }
              }
            }

            if (!phone && !email) return null;

            return {
              nombre_agencia: cleanAgencyName(item.title, root),
              telefono: phone,
              email,
              web: `https://${root}`,
              ciudad: ciudad || "No indicada",
              codigo_postal,
            };
          } catch {
            return null;
          }
        })
      )
    ).filter((x): x is NonNullable<typeof x> => x !== null);

    // Consultar existentes en PocketBase para evitar duplicados
    const existing = await pbList("prospectos_inmobiliarias").catch(() => []);
    const existingPhones = new Set<string>();
    const existingWebs = new Set<string>();
    const existingNames = new Set<string>();

    for (const rec of existing) {
      if (rec.telefono) existingPhones.add(String(rec.telefono).replace(/[^\d]/g, ""));
      if (rec.web) {
        try {
          existingWebs.add(getRootDomain(new URL(rec.web).hostname));
        } catch {
          existingWebs.add(String(rec.web).toLowerCase());
        }
      }
      if (rec.nombre_agencia) existingNames.add(String(rec.nombre_agencia).toLowerCase().trim());
    }

    let inserted = 0;
    let skipped = 0;

    for (const ag of scraped) {
      const cleanPh = ag.telefono.replace(/[^\d]/g, "");
      const rootWeb = getRootDomain(new URL(ag.web).hostname);
      const normName = ag.nombre_agencia.toLowerCase().trim();

      if (
        (cleanPh && existingPhones.has(cleanPh)) ||
        existingWebs.has(rootWeb) ||
        existingNames.has(normName)
      ) {
        skipped++;
        continue;
      }

      try {
        await pbCreate("prospectos_inmobiliarias", {
          nombre_agencia: ag.nombre_agencia,
          persona_contacto: "",
          telefono: ag.telefono,
          email: ag.email,
          web: ag.web,
          ciudad: ag.ciudad,
          codigo_postal: ag.codigo_postal,
          origen: "auto_buscador",
          estado: "pendiente",
          notas: `Extraída automáticamente (${locQuery})`,
        });
        if (cleanPh) existingPhones.add(cleanPh);
        existingWebs.add(rootWeb);
        existingNames.add(normName);
        inserted++;
      } catch (e) {
        console.error("[Auto-Buscador pbCreate error]", e);
      }
    }

    return NextResponse.json({
      success: true,
      found: scraped.length,
      inserted,
      skipped,
    });
  } catch (err: any) {
    console.error("[POST /api/inmobiliarias/buscar Error]", err);
    return NextResponse.json(
      { error: err.message || "Error al buscar inmobiliarias" },
      { status: 500 }
    );
  }
}
