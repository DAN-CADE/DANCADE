// app/api/user-character/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { userId, characterSkin } = await req.json();

    // 1️⃣ 유효성 검사
    if (!userId || !characterSkin) {
      return NextResponse.json(
        { message: "userId or characterSkin is missing" },
        { status: 400 }
      );
    }

    // 2️⃣ 캐릭터 저장 (생성 + 덮어쓰기)
    const { error } = await supabase
      .from("user_characters")
      .upsert({
        user_id: userId,
        character_skin: characterSkin,
      });

    if (error) {
      console.error("user_characters upsert error:", error);
      return NextResponse.json(
        { message: "database error" },
        { status: 500 }
      );
    }

    // 3️⃣ 성공
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("api error:", err);
    return NextResponse.json(
      { message: "server error" },
      { status: 500 }
    );
  }
}
