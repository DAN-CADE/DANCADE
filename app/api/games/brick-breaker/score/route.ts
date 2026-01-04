// app/api/games/brick-breaker/score/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";

interface BrickBreakerScoreRequest {
  score: number;
  elapsedTime: number;
  bricksDestroyed: number;
  isWin: boolean;
  lives: number;
}

/**
 * POST /api/games/brick-breaker/score
 * - 싱글플레이 벽돌깨기 게임 결과 저장
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 요청 데이터 파싱
    const body: BrickBreakerScoreRequest = await request.json();

    // 2. 필수 필드 검증
    const { score, elapsedTime, bricksDestroyed, isWin, lives } = body;

    if (
      score === undefined ||
      elapsedTime === undefined ||
      bricksDestroyed === undefined ||
      isWin === undefined ||
      lives === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "필수 필드 누락",
        },
        { status: 400 }
      );
    }

    console.log("[API] BrickBreaker 게임 결과 저장 시작:", body);

    // 3. 게임 결과 저장 (game_results 테이블)
    // 인증 없이 저장 (익명 사용자도 저장 가능)
    const insertData = {
      game_type: "brick_breaker",
      score: score,
      game_duration: elapsedTime,
      bricks_destroyed: bricksDestroyed,
      is_win: isWin,
      lives: lives,
    };

    console.log("[API] 저장할 데이터:", JSON.stringify(insertData, null, 2));

    const { data, error } = await supabase
      .from("game_results")
      .insert(insertData)
      .select();

    if (error) {
      console.error("[API] DB 저장 실패:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: error.details,
          code: error.code,
        },
        { status: 500 }
      );
    }

    console.log("[API] DB 저장 성공:", data);

    // 4. 성공 응답
    return NextResponse.json(
      {
        success: true,
        message: "게임 결과가 저장되었습니다",
        data: data[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] 게임 결과 저장 실패:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}
