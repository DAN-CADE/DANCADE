// app/api/rooms/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";

// ===================================================================
/**
 * POST /api/rooms
 * - 게임 서버(Socket.IO)에서 호출
 * - 생성된 멀티플레이 방 정보를 DB에 저장
 */
// ===================================================================

export async function POST(request: NextRequest) {
  const supabase = createServerClient();
  try {
    const body = await request.json();
    console.log("[API /api/rooms] 요청 수신:", body);

    const {
      id, // room_id
      room_name,
      game_type,
      host_user_id, // host_user_id (UUID)
      status,
      is_private,
      password,
      max_players,
    } = body;

    // 필수 필드 검증
    if (!id || !game_type || !host_user_id) {
      return NextResponse.json(
        {
          error:
            "[API /api/rooms]: 필수 필드 누락: id, game_type, host_user_id",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.from("multi_rooms").insert({
      id: id,
      host_user_id: host_user_id,
      game_type: game_type,
      room_name: room_name,
      is_private: is_private || false,
      password: password || null,
      status: status || "waiting",
      max_players: max_players || 2,
    });

    if (error) {
      console.error("[API /api/rooms] DB 삽입 오류:", error);
      throw error;
    }

    console.log("[API /api/rooms] DB 저장 성공");
    return NextResponse.json({ success: true, data: data }, { status: 201 });
  } catch (error) {
    console.error("[API /api/rooms] 처리 중 예외 발생:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
