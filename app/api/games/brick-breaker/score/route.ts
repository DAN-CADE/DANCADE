import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
import { DB_TABLES } from "@/constants/tables";

// =====================================================================
/**
 * POST /api/games/brick-breaker/score
 * - 벽돌깨기 싱글플레이어 게임 결과 저장
 */
// =====================================================================

interface BrickBreakerScoreRequest {
  userId: string;
  sessionId: string;
  score: number;
  elapsedTime: number;
  bricksDestroyed: number;
  isWin: boolean;
  lives: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: BrickBreakerScoreRequest = await request.json();

    const {
      userId,
      sessionId,
      score,
      elapsedTime,
      bricksDestroyed,
      isWin,
      lives,
    } = body;

    // 필수 필드 검증
    if (!userId || !sessionId) {
      return NextResponse.json(
        { success: false, error: "userId와 sessionId는 필수입니다" },
        { status: 400 }
      );
    }

    console.log("[API] 벽돌깨기 결과 저장:", { userId, score, isWin });

    // 중복 제출 체크는 간소화 (sessionId는 metadata에서 확인)
    // 기존 중복 체크 로직 제거

    // 게임 결과 저장 시도
    // 참고: game_rankings 테이블에 필요한 컬럼이 없을 수 있음
    // 테이블 구조에 맞게 수정 필요
    let savedData = null;

    try {
      const { data, error } = await supabase
        .from(DB_TABLES.GAME_RANKINGS)
        .insert({
          user_id: userId,
          game_type: "brick_breaker",
          score,
          metadata: {
            session_id: sessionId,
            elapsed_time: elapsedTime,
            bricks_destroyed: bricksDestroyed,
            is_win: isWin,
            lives_remaining: lives,
          },
        })
        .select()
        .single();

      if (error) {
        console.warn(
          "[API] game_rankings 저장 실패, 대체 방식 시도:",
          error.message
        );
      } else {
        savedData = data;
      }
    } catch (dbError) {
      console.warn("[API] DB 저장 스킵:", dbError);
    }

    // 유저 포인트 추가 (점수 기반)
    const earnedPoints = Math.floor(score / 10);
    if (earnedPoints > 0) {
      try {
        await supabase.rpc("add_user_points", {
          p_user_id: userId,
          p_points: earnedPoints,
          p_reason: `벽돌깨기 게임 완료 (점수: ${score})`,
        });
      } catch {
        console.warn("[API] 포인트 추가 실패");
      }
    }

    return NextResponse.json({
      success: true,
      data: savedData,
      earnedPoints,
      message: isWin ? "축하합니다! 게임 클리어!" : "게임 오버",
    });
  } catch (error) {
    console.error("[API] 벽돌깨기 점수 저장 오류:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// =====================================================================
/**
 * GET /api/games/brick-breaker/score?userId=xxx
 * - 벽돌깨기 랭킹 조회
 */
// =====================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "10");

    // 전체 랭킹 조회
    const { data: rankings, error: rankingError } = await supabase
      .from(DB_TABLES.GAME_RANKINGS)
      .select(
        `
        id,
        user_id,
        score,
        elapsed_time,
        bricks_destroyed,
        is_win,
        played_at,
        users:user_id (nickname)
      `
      )
      .eq("game_type", "brick_breaker")
      .order("score", { ascending: false })
      .limit(limit);

    if (rankingError) {
      throw rankingError;
    }

    // 유저별 최고 점수 조회
    let userBest = null;
    if (userId) {
      const { data } = await supabase
        .from(DB_TABLES.GAME_RANKINGS)
        .select("score, played_at")
        .eq("game_type", "brick_breaker")
        .eq("user_id", userId)
        .order("score", { ascending: false })
        .limit(1)
        .single();

      userBest = data;
    }

    return NextResponse.json({
      success: true,
      rankings,
      userBest,
    });
  } catch (error) {
    console.error("[API] 랭킹 조회 오류:", error);
    return NextResponse.json(
      { success: false, error: "랭킹 조회 실패" },
      { status: 500 }
    );
  }
}

// =====================================================================
// 최고 점수 업데이트 헬퍼 (향후 사용 예정)
// =====================================================================

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function updateHighScore(userId: string, newScore: number) {
  try {
    // 현재 최고 점수 조회
    const { data: stats } = await supabase
      .from(DB_TABLES.USER_STATS)
      .select("brick_breaker_high_score")
      .eq("user_id", userId)
      .single();

    const currentHighScore = stats?.brick_breaker_high_score || 0;

    // 새 점수가 더 높으면 업데이트
    if (newScore > currentHighScore) {
      await supabase.from(DB_TABLES.USER_STATS).upsert(
        {
          user_id: userId,
          brick_breaker_high_score: newScore,
        },
        { onConflict: "user_id" }
      );

      console.log(`[API] 최고 점수 갱신: ${currentHighScore} → ${newScore}`);
    }
  } catch (error) {
    // 최고 점수 업데이트 실패는 무시 (메인 기능에 영향 없음)
    console.warn("[API] 최고 점수 업데이트 실패:", error);
  }
}
