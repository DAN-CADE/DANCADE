// game/config/network.ts

/**
 * 네트워크 설정
 * - 소켓 URL, 연결 옵션 등 네트워크 관련 설정 중앙 관리
 */
export const NETWORK_CONFIG = {
  /**
   * Socket.IO 서버 URL
   */
  SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001/",

  /**
   * Socket.IO 기본 연결 옵션
   */
  DEFAULT_OPTIONS: {
    transports: ["websocket", "polling"] as const,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  },

  /**
   * 타임아웃 설정 (ms)
   */
  TIMEOUTS: {
    CONNECTION: 5000, // 연결 대기 시간
    RECONNECTION: 1000, // 재연결 간격
    RESPONSE: 3000, // 응답 대기 시간
  },

  /**
   * 재시도 정책
   */
  RETRY: {
    MAX_ATTEMPTS: 5, // 최대 재시도 횟수
    DELAY: 1000, // 재시도 간격 (ms)
  },
} as const;

/**
 * 환경별 설정 확인 (디버깅용)
 */
export const getNetworkInfo = () => {
  return {
    environment: process.env.NODE_ENV,
    socketUrl: NETWORK_CONFIG.SOCKET_URL,
    isProduction: process.env.NODE_ENV === "production",
  };
};
