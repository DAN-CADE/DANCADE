import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { message: "userId is missing" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("user_characters")
      .select("character_skin")
      .eq("user_id", userId)
      .single();

    // ❗ 없는 경우도 정상 흐름
    if (error || !data) {
      return NextResponse.json(
        { characterSkin: null },
        { status: 200 }
      );
    }

    return NextResponse.json({
      characterSkin: data.character_skin,
    });
  } catch (err) {
    console.error("api error:", err);
    return NextResponse.json(
      { message: "server error" },
      { status: 500 }
    );
  }
}
