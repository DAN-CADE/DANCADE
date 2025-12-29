  // app/api/items/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";

export async function GET() {
  const { data, error } = await supabase
    .from("items")
    .select("id, name, price, category, image_url, style_key")
    .eq("is_available", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[GET /api/items]", error);
    return NextResponse.json(
      { message: "Failed to fetch items" },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 200 });
}
