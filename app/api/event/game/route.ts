import { getActiveEventGame, createEventGame } from "@/lib/supabase/eventGames";
import { NextResponse } from "next/server";

// =====================================================================
/**
 * GET - 활성 이벤트 게임 조회
 */
// =====================================================================

export async function GET() {
  const eventGame = await getActiveEventGame();

  if (eventGame === null) {
    // 에러가 발생했거나 결과가 없음
    return NextResponse.json(
      { error: "이벤트 게임을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: eventGame });
}

// =====================================================================
/**
 * POST - 이벤트 게임 생성
 */
// =====================================================================

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gameType, content, details } = body;

    // 유효성 검사
    if (!gameType || !content) {
      return NextResponse.json(
        { error: "gameType과 content는 필수입니다." },
        { status: 400 }
      );
    }

    // 이벤트 게임 생성
    const newEventGame = await createEventGame({
      game_type: gameType,
      title: content,
      details: details,
    });

    if (!newEventGame) {
      return NextResponse.json(
        { error: "이벤트 게임 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: newEventGame }, { status: 201 });
  } catch (error) {
    console.error("POST /api/event-games 에러:", error);
    return NextResponse.json(
      { error: "서버 에러가 발생했습니다." },
      { status: 500 }
    );
  }
}
