// app/api/games/brick-breaker/score/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase/server";

// ✅ 게임 설정 (GameManager와 동일하게 유지)
const GAME_CONFIG = {
  cols: 10,
  rows: 5,
  pointsPerBrick: 10,
  maxScore: 500, // 10 * 5 * 10
  minElapsedTime: 5, // 최소 5초
  maxScorePerSecond: 50, // 초당 최대 50점 (치트 방지)
};

interface BrickBreakerScoreRequest {
  userId?: string; // 클라이언트에서 보낸 사용자 ID (게스트 포함)
  score: number;
  elapsedTime: number;
  bricksDestroyed: number;
  isWin: boolean;
  lives: number;
  sessionId?: string; // 중복 제출 방지용
}

/**
 * POST /api/games/brick-breaker/score
 * - 벽돌깨기 게임 결과 저장 및 포인트 지급
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 요청 데이터 파싱
    const body: BrickBreakerScoreRequest = await request.json();
    const {
      userId: bodyUserId,
      score,
      elapsedTime,
      bricksDestroyed,
      isWin,
      lives,
      sessionId,
    } = body;

    // 2. 사용자 ID 확인 (body에서 받거나, auth()에서 가져오기)
    const { userId: clerkUserId } = await auth();
    const userIdToUse = bodyUserId || clerkUserId;

    if (!userIdToUse) {
      return NextResponse.json(
        {
          success: false,
          error: "사용자 ID를 확인할 수 없습니다",
        },
        { status: 401 }
      );
    }

    // 3. 필수 필드 검증
    if (
      typeof score !== "number" ||
      typeof elapsedTime !== "number" ||
      typeof bricksDestroyed !== "number" ||
      typeof isWin !== "boolean"
    ) {
      console.warn("[API] 필수 필드 누락 또는 타입 오류:", body);
      return NextResponse.json(
        {
          success: false,
          error: "필수 필드 누락 또는 타입 오류",
        },
        { status: 400 }
      );
    }

    console.log("[API] 게임 결과 수신:", {
      userId: userIdToUse,
      score,
      elapsedTime,
      bricksDestroyed,
      isWin,
    });

    // 4. 게스트인 경우 users 테이블에서 UUID 조회 또는 생성
    let userUUID: string | null = userIdToUse;

    // UUID 형식 확인 (게스트는 "guest" 형식)
    if (!isValidUUID(userIdToUse)) {
      userUUID = await getOrCreateGuestUser(userIdToUse);
    }

    if (!userUUID) {
      return NextResponse.json(
        {
          success: false,
          error: "사용자 생성/조회 실패",
        },
        { status: 500 }
      );
    }

    // 4. ✅ 점수 유효성 검증
    const validation = validateScore({
      score,
      elapsedTime,
      bricksDestroyed,
      isWin,
    });

    if (!validation.isValid) {
      console.warn("[API] 점수 검증 실패:", validation.reason);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid score",
          reason: validation.reason,
        },
        { status: 400 }
      );
    }

    // 5. ✅ 중복 제출 방지 (회원 + sessionId 있을 때)
    if (userUUID && sessionId && isValidUUID(userUUID)) {
      const isDuplicate = await checkDuplicateSubmission(userUUID, sessionId);
      if (isDuplicate) {
        console.warn("[API] 중복 제출 감지:", { userUUID, sessionId });
        return NextResponse.json(
          {
            success: false,
            error: "Duplicate submission detected",
          },
          { status: 429 }
        );
      }
    }

    // 6. ✅ 포인트 지급 (회원만)
    let pointsAwarded = 0;
    if (userUUID && isValidUUID(userUUID)) {
      pointsAwarded = await awardPoints(userUUID, score);
    }

    // 7. ✅ DB 저장 (포인트 계산 후)
    const gameResult = await saveGameResult({
      userId: userUUID,
      score,
      elapsedTime,
      bricksDestroyed,
      isWin,
      lives,
      sessionId,
      pointsAwarded,
    });

    console.log("[API] 게임 결과 저장 성공:", {
      gameResultId: gameResult.id,
      pointsAwarded,
    });

    // 8. 성공 응답
    return NextResponse.json(
      {
        success: true,
        message: "게임 결과가 저장되었습니다",
        data: {
          gameResult,
          pointsAwarded,
          isGuest: !isValidUUID(userUUID),
        },
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

/**
 * ✅ UUID 형식 검증
 */
function isValidUUID(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * ✅ 게스트 사용자 조회 또는 생성
 */
async function getOrCreateGuestUser(guestId: string): Promise<string | null> {
  try {
    // 1. 먼저 조회
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("userid", guestId)
      .maybeSingle();

    if (existing) {
      console.log("[Guest] 기존 게스트 사용자 조회:", existing.id);
      return existing.id;
    }

    // 2. 없으면 생성
    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        userid: guestId,
        nickname: `Guest_${guestId.slice(-6)}`,
        total_points: 0,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[Guest] 생성 실패:", error);
      return null;
    }

    console.log("[Guest] 새 게스트 사용자 생성:", newUser.id);
    return newUser.id;
  } catch (error) {
    console.error("[Guest] 조회/생성 오류:", error);
    return null;
  }
}

/**
 * ✅ 점수 유효성 검증
 */
function validateScore({
  score,
  elapsedTime,
  bricksDestroyed,
  isWin,
}: {
  score: number;
  elapsedTime: number;
  bricksDestroyed: number;
  isWin: boolean;
}): { isValid: boolean; reason?: string } {
  // 1. 점수 범위 체크 (0 ~ 최대점수)
  if (score < 0 || score > GAME_CONFIG.maxScore) {
    return {
      isValid: false,
      reason: `점수가 유효 범위(0-${GAME_CONFIG.maxScore})를 벗어남`,
    };
  }

  // 2. ✅ 점수와 파괴된 벽돌 수 일치 확인
  const expectedScore = bricksDestroyed * GAME_CONFIG.pointsPerBrick;
  if (score !== expectedScore) {
    return {
      isValid: false,
      reason: `점수 불일치: 예상 ${expectedScore}점, 실제 ${score}점`,
    };
  }

  // 3. 파괴된 벽돌 수 범위 체크
  const maxBricks = GAME_CONFIG.cols * GAME_CONFIG.rows;
  if (bricksDestroyed < 0 || bricksDestroyed > maxBricks) {
    return {
      isValid: false,
      reason: `파괴된 벽돌 수가 유효 범위(0-${maxBricks})를 벗어남`,
    };
  }

  // 4. ✅ 플레이 시간 최소값 체크
  if (elapsedTime < GAME_CONFIG.minElapsedTime) {
    return {
      isValid: false,
      reason: `플레이 시간이 너무 짧음 (최소 ${GAME_CONFIG.minElapsedTime}초)`,
    };
  }

  // 5. 승리 조건 확인
  if (isWin && bricksDestroyed !== maxBricks) {
    return {
      isValid: false,
      reason: "승리했지만 모든 벽돌을 파괴하지 않음",
    };
  }

  // 6. 시간당 점수 비율 체크 (치트 방지)
  const scorePerSecond = score / elapsedTime;
  if (scorePerSecond > GAME_CONFIG.maxScorePerSecond) {
    return {
      isValid: false,
      reason: `점수 획득 속도가 비정상적으로 빠름 (${scorePerSecond.toFixed(
        1
      )}점/초)`,
    };
  }

  return { isValid: true };
}

/**
 * ✅ 게임 결과 DB 저장
 */
async function saveGameResult({
  userId,
  score,
  elapsedTime,
  bricksDestroyed,
  isWin,
  lives,
  sessionId,
  pointsAwarded,
}: {
  userId: string | null;
  score: number;
  elapsedTime: number;
  bricksDestroyed: number;
  isWin: boolean;
  lives: number;
  sessionId?: string;
  pointsAwarded: number;
}) {
  const insertData = {
    game_type: "brick-breaker",
    play_mode: "single",
    user_id: userId,
    opponent_id: null,
    winner_id: isWin ? userId : null,
    is_win: isWin,
    score,
    game_duration: elapsedTime,
    room_id: null,
    points_awarded: pointsAwarded,
    is_ranked: true,
    metadata: {
      bricks_destroyed: bricksDestroyed,
      lives_remaining: lives,
      session_id: sessionId,
    },
  };

  const { data, error } = await supabase
    .from("game_results")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("[DB] 저장 실패:", error);
    throw new Error(`DB 저장 실패: ${error.message}`);
  }

  return data;
}

/**
 * ✅ 포인트 지급 (회원만)
 */
async function awardPoints(userId: string, score: number): Promise<number> {
  // 점수에 비례한 포인트 계산 (예: 점수의 10%)
  const pointsToAward = Math.floor(score * 0.1);

  if (pointsToAward <= 0) {
    return 0;
  }

  try {
    // ⭐ RPC 함수 호출 시도
    const { data, error } = await supabase.rpc("award_points", {
      p_user_id: userId,
      p_points: pointsToAward,
      p_reason: "brick_breaker_game",
    });

    if (error) {
      console.warn(
        "[Points] RPC 호출 실패, 직접 업데이트 시도:",
        error.message
      );

      // RPC 실패 시 직접 업데이트
      const { error: updateError } = await supabase
        .from("users")
        .update({
          total_points: supabase.rpc("coalesce(total_points, 0) +", [
            pointsToAward,
          ]),
        })
        .eq("id", userId);

      if (updateError) {
        console.error("[Points] 직접 업데이트도 실패:", updateError);
        return 0;
      }
    }

    console.log("[Points] 지급 성공:", { userId, points: pointsToAward });
    return pointsToAward;
  } catch (error) {
    console.error("[Points] 지급 오류:", error);
    return 0;
  }
}

/**
 * ✅ 중복 제출 방지
 */
async function checkDuplicateSubmission(
  userId: string,
  sessionId: string
): Promise<boolean> {
  // 최근 10초 내 같은 sessionId로 제출된 기록 확인
  const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();

  const { data, error } = await supabase
    .from("game_results")
    .select("id")
    .eq("user_id", userId)
    .eq("metadata->>session_id", sessionId)
    .gte("created_at", tenSecondsAgo)
    .limit(1);

  if (error) {
    console.error("[Duplicate Check] 오류:", error);
    return false;
  }

  return (data?.length ?? 0) > 0;
}
