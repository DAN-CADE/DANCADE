import { NextRequest, NextResponse } from "next/server";
import { GameResultService } from "@/lib/services/gameResultService";
import { SaveGameResultRequest } from "@/game/types/gameSessionData";

// =====================================================================
/**
 * POST /api/game-result
 * - Socket.IO 서버에서 호출
 * - 게임 결과 저장 및 통계 업데이트
 */
// =====================================================================

export async function POST(request: NextRequest) {
  try {
    // 요청 데이터 파싱
    const body: SaveGameResultRequest = await request.json();

    // 필수 필드 검증
    const { room_id, game_type, winner_user_id, loser_user_id } = body;

    if (!room_id || !game_type || !winner_user_id || !loser_user_id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "[api/game-result] 필수 필드 누락: room_id, game_type, winner_user_id, loser_user_id",
        },
        { status: 400 }
      );
    }

    console.log("[API] 게임 결과 저장 요청:", body);

    // 서비스 호출
    const service = new GameResultService();
    const result = await service.saveGameResult(body);

    // 성공 응답
    return NextResponse.json(result, { status: 200 });
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

// =====================================================================
/**
 * GET /api/game-result?userId=xxx&gameType=omok
 * - 유저 통계 조회
 */
// =====================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    // const gameType = searchParams.get("gameType") || undefined;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId 필수" },
        { status: 400 }
      );
    }

    const service = new GameResultService();
    const stats = await service.getUserStats(userId);

    if (!stats) {
      return NextResponse.json(
        { success: false, error: "통계 없음" },
        { status: 404 }
      );
    }

    // const history = await service.getGameHistory(userId, gameType, 10);

    return NextResponse.json({
      success: true,
      stats,
      history,
    });
  } catch (error) {
    console.error("[API] 통계 조회 실패:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}
