import { NextResponse } from "next/server";
import { pbList } from "@/lib/pocketbase";

export const revalidate = 60;

export async function GET() {
  try {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const todayISO = todayStart.toISOString().replace("T", " ").slice(0, 19);

    const [todayItems, allItems] = await Promise.all([
      pbList("valoraciones", `created >= "${todayISO}"`),
      pbList("valoraciones"),
    ]);

    return NextResponse.json({
      today: todayItems.length,
      total: allItems.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error interno";
    console.error("[api/stats]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
