import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { createServiceClient } = await import("@/lib/supabase/service");
    const supabase = createServiceClient();
    const result = await supabase.from("venues").select("id, name, city").order("name");
    if (result.error) {
      return NextResponse.json({ venues: [], error: result.error.message });
    }

    const rows = (result.data ?? [])
      .map((row) => ({
        id: String(row.id),
        name: String(row.name ?? ""),
        city: row.city ? String(row.city) : null,
      }))
      .filter((row) => row.name);

    return NextResponse.json({ venues: rows });
  } catch (err) {
    return NextResponse.json({
      venues: [],
      error: err instanceof Error ? err.message : "Supabase non disponibile",
    });
  }
}
