import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { CharacterState } from "@/components/avatar/utils/LpcTypes";
import { supabase } from "@/lib/supabase/server";


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, characterSkin } = body as {
      userId: string;
      characterSkin: CharacterState;
    };

    if (!userId || !characterSkin) {
      return NextResponse.json(
        { message: "Invalid payload" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("user_characters")
      .upsert({
        user_id: userId,
        character_skin: characterSkin,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error(error);
      return NextResponse.json(
        { message: "DB update failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
