const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const os = require("os");

const app = express();
const server = http.createServer(app);

// TODO: 프로덕션 배포 시 다음 수정 필요
// 1. CORS를 환경변수로 특정 도메인만 허용
// 2. 로컬 IP 자동 감지 제거
// 예시:
// const allowedOrigins = process.env.SOCKET_ALLOWED_ORIGINS?.split(",") || [
//   "https://yourdomain.com",
//   "https://www.yourdomain.com"
// ];
// 현재는 개발/테스트 환경에서만 모든 로컬 IP 허용

// 동적 CORS 설정 (개발 환경용 - 모든 로컬 IP 허용)
const getLocalIPs = () => {
  const interfaces = os.networkInterfaces();
  const ips = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // IPv4 주소만 필터링
      if (iface.family === "IPv4") {
        ips.push(iface.address);
      }
    }
  }

  return ips;
};

const localIPs = getLocalIPs();
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  ...localIPs.map((ip) => `http://${ip}:3000`),
];

console.log("🔐 CORS 허용 오리진:", allowedOrigins);

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// 온라인 플레이어 저장소 (메모리)
const players = new Map();

// ============================================
// Socket.io 이벤트
// ============================================

io.on("connection", (socket) => {
  console.log("✅ 플레이어 접속:", socket.id);

  // 1. 플레이어 입장
  socket.on("player:join", (data) => {
    const { userId, username, gender, avatarId, customization, x, y } = data;

    players.set(socket.id, {
      socketId: socket.id,
      userId,
      username,
      gender,
      avatarId,
      customization, // 아바타 커스텀 정보 저장
      x,
      y,
      joinedAt: Date.now(),
    });

    console.log("👤 입장:", username);

    // 모든 클라이언트에게 플레이어 목록 전송
    io.emit("players:update", Array.from(players.values()));
  });

  // 2. 플레이어 위치 업데이트
  socket.on("player:move", (data) => {
    const { x, y } = data;
    const player = players.get(socket.id);

    if (player) {
      player.x = x;
      player.y = y;

      // 모든 클라이언트에게 위치 업데이트 전송
      io.emit("player:moved", {
        socketId: socket.id,
        x,
        y,
      });
    }
  });

  // 2-1. 플레이어 애니메이션 상태 업데이트
  socket.on("player:animation", (data) => {
    const { direction, isMoving } = data;
    const player = players.get(socket.id);

    if (player) {
      player.direction = direction;
      player.isMoving = isMoving;

      // 모든 클라이언트에게 애니메이션 상태 전송
      io.emit("player:animationUpdate", {
        socketId: socket.id,
        direction,
        isMoving,
      });
    }
  });

  // 3. 플레이어 퇴장
  socket.on("disconnect", () => {
    const player = players.get(socket.id);
    if (player) {
      console.log("❌ 퇴장:", player.username);
      players.delete(socket.id);

      // 모든 클라이언트에게 업데이트
      io.emit("players:update", Array.from(players.values()));
    }
  });
});

// ============================================
// REST API (DB 저장용 - 선택사항)
// ============================================

app.post("/api/player/save", (req, res) => {
  const { userId, x, y } = req.body;
  console.log("💾 플레이어 저장:", userId, x, y);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
