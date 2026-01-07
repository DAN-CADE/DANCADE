// game/managers/global/RealtimeSubscriptionManager.ts
import { supabase } from "@/lib/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import { UIManager } from "@/game/managers/global/UIManager";

export class RealtimeSubscriptionManager {
  private subscriptions: RealtimeChannel[] = [];

  constructor(private uiManager: UIManager) {}

  // =====================================================================
  // 랭킹 보드 구독
  // =====================================================================

  subscribeToRankings(): void {
    const rankingChannel = supabase
      .channel("realtime_rankings")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "leaderboards",
        },
        (payload) => {
          console.log("📊 새로운 랭킹 데이터:", payload);
          this.uiManager.showNotice("랭킹 게시판이 갱신되었습니다.");
        }
      )
      .subscribe();

    this.subscriptions.push(rankingChannel);
    console.log("✅ 랭킹 보드 실시간 구독 시작");
  }

  // =====================================================================
  // 채팅 메시지 구독 (예시)
  // =====================================================================

  subscribeToChatMessages(): void {
    const chatChannel = supabase
      .channel("realtime_chat")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          console.log("💬 새로운 채팅 메시지:", payload);
          // 채팅 UI 업데이트 로직
        }
      )
      .subscribe();

    this.subscriptions.push(chatChannel);
    console.log("✅ 채팅 메시지 실시간 구독 시작");
  }

  // =====================================================================
  // 이벤트 구독 (예시)
  // =====================================================================

  subscribeToEvents(): void {
    const eventChannel = supabase
      .channel("realtime_events")
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE 모두 감지
          schema: "public",
          table: "events",
        },
        (payload) => {
          console.log("🎉 이벤트 변경:", payload);

          if (payload.eventType === "INSERT") {
            const newEvent = payload.new as any;
            this.uiManager.showNotice(`새로운 이벤트: ${newEvent.title}`);
          }
        }
      )
      .subscribe();

    this.subscriptions.push(eventChannel);
    console.log("✅ 이벤트 실시간 구독 시작");
  }

  // =====================================================================
  // 특정 구독 해제
  // =====================================================================

  unsubscribe(channelName: string): void {
    const channel = this.subscriptions.find((sub) => sub.topic === channelName);

    if (channel) {
      supabase.removeChannel(channel);
      this.subscriptions = this.subscriptions.filter(
        (sub) => sub.topic !== channelName
      );
      console.log(`✅ ${channelName} 구독 해제`);
    }
  }

  // =====================================================================
  // 모든 구독 상태 확인
  // =====================================================================

  getSubscriptionStatus(): { channel: string; status: string }[] {
    return this.subscriptions.map((sub) => ({
      channel: sub.topic,
      status: sub.state,
    }));
  }

  // =====================================================================
  // 정리
  // =====================================================================

  cleanup(): void {
    console.log("🧹 실시간 구독 정리 시작...");

    this.subscriptions.forEach((subscription) => {
      supabase.removeChannel(subscription);
    });

    this.subscriptions = [];
    console.log("✅ 모든 실시간 구독 해제 완료");
  }

  destroy(): void {
    this.cleanup();
  }
}
