// Redis 버전 [아직 작성중]
require('dotenv').config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const { createClient: createRedisClient } = require('redis');
const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
const { createAdapter } = require("@socket.io/redis-adapter");

const app = express();
const server = http.createServer(app);

// const baseGameHandler = require("./handlers/base/baseGameHandler");
// const omokHandler = require("./handlers/games/omok/omokHandler");
const path = require('path'); // 상단에 추가

const baseGameHandler = require(path.join(__dirname, "handlers", "base", "BaseGameHandler"));
const omokHandler = require(path.join(__dirname, "handlers", "games", "omok", "OmokHandler"));

// =====================================================================
// [1] Redis 설정
// =====================================================================
const REDIS_HOST = "172.31.31.157";
const REDIS_PASSWORD = "dandadan";

const pubClient = createRedisClient({ 
  url: `redis://${REDIS_HOST}:6379`,
  password: REDIS_PASSWORD 
});
const subClient = pubClient.duplicate();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createSupabaseClient(supabaseUrl, supabaseKey);

// Redis 연결
Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
  console.log("✅ Redis Adapter connected");
}).catch(err => {
  console.error("❌ Redis Connection Error:", err);
});

// =====================================================================
// [2] Rooms Redis 어댑터 (global_players와 동일한 방식)
// =====================================================================
// 기존 Map 대신, Redis 명령어를 사용하는 객체로 정의합니다.
const rooms = {
  get: async (roomId) => {
    const data = await pubClient.hGet("global_rooms", roomId);
    return data ? JSON.parse(data) : null;
  },
  set: async (roomId, roomData) => {
    await pubClient.hSet("global_rooms", roomId, JSON.stringify(roomData));
  },
  delete: async (roomId) => {
    await pubClient.hDel("global_rooms", roomId);
  },
  // 모든 방 목록을 가져오는 헬퍼 함수
  getAll: async () => {
    const allData = await pubClient.hGetAll("global_rooms");
    return Object.values(allData).map(val => JSON.parse(val));
  }
};

// =====================================================================
// [3] Socket.io 설정
// =====================================================================
const io = new Server(server, {
  cors: {
    origin: ["http://3.25.232.135:3000","http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["websocket"],
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.status(200).send("ok"));

// =====================================================================
// Socket.io 연결 로직
// =====================================================================
io.on("connection", (socket) => {

  // 오목 핸들러 등록 (Map 대신 Redis 객체 rooms 전달)
  const omokDisconnectHandler = baseGameHandler(io, socket, rooms, "omok", {
    maxPlayers: 2,
    minPlayers: 2,
    autoStart: false,
  });
  omokHandler(io, socket, rooms, supabase);

  socket.on("player:join", async (data) => {
    const { userId, username, gender, avatarId, customization, x, y } = data;
    const playerData = { socketId: socket.id, userId, username, gender, avatarId, customization, x, y, joinedAt: Date.now() };

    // Redis에 플레이어 정보 저장
    await pubClient.hSet("global_players", socket.id, JSON.stringify(playerData));

    const allPlayersData = await pubClient.hGetAll("global_players");
    const allPlayers = Object.values(allPlayersData).map(p => JSON.parse(p));

    io.emit("players:update", allPlayers);
    io.emit("createNotice", { data: { content: `${username}님 환영합니다` } });
  });

  socket.on("disconnect", async () => {
    // 1. Redis에서 플레이어 삭제
    await pubClient.hDel("global_players", socket.id);
    
    // 2. 최신 목록 전송
    const allPlayersData = await pubClient.hGetAll("global_players");
    const allPlayers = Object.values(allPlayersData).map(p => JSON.parse(p));
    io.emit("players:update", allPlayers);
    
    // 3. 오목 연결 해제 처리 (Redis 작업을 위해 await 추가)
    if (omokDisconnectHandler && omokDisconnectHandler.handleDisconnect) {
        await omokDisconnectHandler.handleDisconnect();
    }
    console.log(`❌ 퇴장: ${socket.id}`);
  });

  // player:move 등 기타 이벤트들... (유저님의 기존 Redis 코드 유지)
  socket.on("player:move", async (data) => {
    const { x, y } = data;
    const rawData = await pubClient.hGet("global_players", socket.id);
    if (rawData) {
      const player = JSON.parse(rawData);
      player.x = x; player.y = y;
      await pubClient.hSet("global_players", socket.id, JSON.stringify(player));
      socket.broadcast.emit("player:moved", { socketId: socket.id, x, y });
    }
  });
});

// =====================================================================
// API 서버 - 방 목록 조회
// =====================================================================
app.get("/api/rooms/:gameType", async (req, res) => {
  try {
    const { gameType } = req.params;
    
    // Redis에서 모든 방 데이터 가져오기
    const allRooms = await rooms.getAll();

    const roomList = allRooms
      .filter(room => room.gameType === gameType && room.status === "waiting" && !room.isPrivate)
      .map(room => ({
        roomId: room.roomId,
        roomName: room.roomName,
        hostUsername: room.players[0]?.username,
        playerCount: room.players.length,
        maxPlayers: room.maxPlayers,
      }));
      
    res.json({ rooms: roomList });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "조회 중 오류 발생" });
  }
});

const PORT = process.env.PORT || 3001; 
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
