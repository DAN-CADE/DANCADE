import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";

export async function GET() {
  try {
    /**
     * TODO:
     * 나중에 로그인 붙이면
     * - session / auth 에서 userId 추출
     */
    const DEV_USER_ID = "cab8399d-2411-4845-acce-dca3ba6093a5";

    const { data: user, error } = await supabase
      .from("users")
      .select("total_points")
      .eq("id", DEV_USER_ID)
      .single();

    if (error || !user) {
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
    console.error("[GET /api/users/points]", error);

    return NextResponse.json(
      { message: "서버 오류" },
      { status: 500 }
    );
  }
}
