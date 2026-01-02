  // app/api/items/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";

// export async function GET() {
//   const { data, error } = await supabase
//     .from("items")
//     .select("id, name, price, category, image_url, style_key")
//     .eq("is_available", true)
//     .order("created_at", { ascending: false });

//   if (error) {
//     console.error("[GET /api/items]", error);
//     return NextResponse.json(
//       { message: "Failed to fetch items" },
//       { status: 500 }
//     );
//   }

//   return NextResponse.json(data, { status: 200 });
// }


export async function POST(req: Request) {
  try {
    const { gender } = await req.json();

    let query = supabase
      .from("items")
      .select("id, name, price, category, image_url, style_key, available_genders,description")
      .eq("is_available", true)
      .order("created_at", { ascending: false });

    // 🔑 성별 필터 (hair만)
    if (gender === "male" || gender === "female") {
      query = query.or(
        `category.neq.hair,available_genders.cs.{${gender}}`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("[POST /api/items]", error);
      return NextResponse.json(
        { message: "Failed to fetch items" },
        { status: 500 }
      );
    }

    console.log(data,"data 상점아이템")
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("[POST /api/items] exception", err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}