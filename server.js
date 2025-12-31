// server.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const baseGameHandler = require("./handlers/base/baseGameHandler");
const omokHandler = require("./handlers/games/omok/omokHandler");

app.use(cors());
app.use(express.json());

// 공유 데이터
const players = new Map();
const rooms = new Map();

// =====================================================================
// Socket.io 연결
// =====================================================================

io.on("connection", (socket) => {
  console.log("플레이어 접속:", socket.id);

  // ✅ 오목 핸들러 등록 (설정 주입)
  const omokDisconnectHandler = baseGameHandler(io, socket, rooms, "omok", {
    maxPlayers: 2, // 오목은 2명
    minPlayers: 2, // 최소 2명
    autoStart: false, // 수동 시작
  });
  omokHandler(io, socket, rooms);

  // 채팅 이벤트
  socket.on("lobby:chat", (data) => {
    const { username, message } = data;

    // 로비 전체에 브로드캐스트
    io.emit("lobby:chatMessage", {
      username,
      message,
      timestamp: Date.now(),
    });
  });
  // ✅ 미래 확장: 핑퐁 (예시)
  // const pingPongDisconnectHandler = baseGameHandler(io, socket, rooms, "pingpong", {
  //   maxPlayers: 2,
  //   minPlayers: 2,
  //   autoStart: true,  // 자동 시작
  // });
  // pingPongHandler(io, socket, rooms);

  // ✅ 미래 확장: 배틀로얄 (예시)
  // const battleRoyaleDisconnectHandler = baseGameHandler(io, socket, rooms, "battleroyale", {
  //   maxPlayers: 100,
  //   minPlayers: 10,
  //   autoStart: true,
  //   allowSpectators: true,
  // });
  // battleRoyaleHandler(io, socket, rooms);

  // =====================================================================
  // 연결 해제
  // =====================================================================
  socket.on("disconnect", () => {
    // 로비 플레이어 정리
    const player = players.get(socket.id);
    if (player) {
      console.log("❌ 퇴장:", player.username);
      players.delete(socket.id);
      io.emit("players:update", Array.from(players.values()));
    }

    // 게임별 방 정리
    omokDisconnectHandler.handleDisconnect();
    // pingPongDisconnectHandler.handleDisconnect();
    // battleRoyaleDisconnectHandler.handleDisconnect();
  });

  // =====================================================================
  // 로비 이벤트
  // =====================================================================

  socket.on("player:join", (data) => {
    const { userId, username, gender, avatarId, customization, x, y } = data;

    players.set(socket.id, {
      socketId: socket.id,
      userId,
      username,
      gender,
      avatarId,
      customization,
      x,
      y,
      joinedAt: Date.now(),
    });

    console.log("👤 입장:", username);
    io.emit("players:update", Array.from(players.values()));
  });

  socket.on("player:move", (data) => {
    const { x, y } = data;
    const player = players.get(socket.id);

    if (player) {
      player.x = x;
      player.y = y;
      io.emit("player:moved", { socketId: socket.id, x, y });
    }
  });

  socket.on("player:animation", (data) => {
    const { direction, isMoving } = data;
    const player = players.get(socket.id);

    if (player) {
      player.direction = direction;
      player.isMoving = isMoving;
      io.emit("player:animationUpdate", {
        socketId: socket.id,
        direction,
        isMoving,
      });
    }
  });
});

// =====================================================================
// REST API
// =====================================================================

app.post("/api/player/save", (req, res) => {
  const { userId, x, y } = req.body;
  console.log("💾 플레이어 저장:", userId, x, y);
  res.json({ success: true });
});

app.get("/api/rooms/:gameType", (req, res) => {
  const { gameType } = req.params;

  const roomList = Array.from(rooms.values())
    .filter(
      (room) =>
        room.gameType === gameType &&
        room.status === "waiting" &&
        !room.isPrivate
    )
    .map((room) => ({
      roomId: room.roomId,
      roomName: room.roomName,
      hostUsername: room.players[0]?.username,
      playerCount: room.players.length,
      maxPlayers: room.maxPlayers,
    }));

  res.json({ rooms: roomList });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
