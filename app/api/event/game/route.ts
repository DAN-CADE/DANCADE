import { supabase } from "@/lib/supabase/server";

export async function GET(request: Request) {
    // 쿼리 실행 [이벤트 게임 조회]
    let query = supabase.from("event_games")
    .select("*")
    .gt("end_at", new Date().toISOString())
    .order("end_at", { ascending: false })
    .limit(1)
    .maybeSingle();

    const { data: eventGames, error: getError } = await query;

    if (getError) {
        console.error("Error fetching event games:", getError);
        return Response.json({ error: getError.message }, { status: 500 });
    }
    const result = {
        data: eventGames
    };

    // 결과 반환
    return Response.json(result);
}