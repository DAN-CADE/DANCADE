import { getEventGame } from "@/lib/supabase/event";
import { NextResponse } from "next/server";

// =====================================================================
/**
 * GET - 활성 이벤트 게임 조회
 */
// =====================================================================

export async function GET() {
  const eventGame = await getEventGame();

  if (eventGame === null) {
    // 에러가 발생했거나 결과가 없음
    return NextResponse.json(
      { error: "이벤트 게임을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: eventGame });
}
