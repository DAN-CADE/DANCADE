import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    // 🔐 최소 가드
    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("total_points")
      .eq("id", userId)
      .single();

    if (error || !user) {
      console.error("[POINT_FETCH_ERROR]", error);
      return NextResponse.json(
        { message: "유저 포인트 조회 실패" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        total_points: user.total_points,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/users/points]", error);

    return NextResponse.json(
      { message: "서버 오류" },
      { status: 500 }
    );
  }
}
