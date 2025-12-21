const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// 온라인 플레이어 저장소 (메모리)
const players = new Map();

// ============================================
// Socket.io 이벤트
// ============================================

io.on('connection', (socket) => {
  console.log('✅ 플레이어 접속:', socket.id);

  // 1. 플레이어 입장
  socket.on('player:join', (data) => {
    const { userId, username, avatarId, x, y } = data;
    
    players.set(socket.id, {
      socketId: socket.id,
      userId,
      username,
      avatarId,
      x,
      y,
      joinedAt: Date.now(),
    });

    console.log('👤 입장:', username);
    
    // 모든 클라이언트에게 플레이어 목록 전송
    io.emit('players:update', Array.from(players.values()));
  });

  // 2. 플레이어 위치 업데이트
  socket.on('player:move', (data) => {
    const { x, y } = data;
    const player = players.get(socket.id);
    
    if (player) {
      player.x = x;
      player.y = y;
      
      // 모든 클라이언트에게 위치 업데이트 전송
      io.emit('player:moved', {
        socketId: socket.id,
        x,
        y,
      });
    }
  });

  // 3. 플레이어 퇴장
  socket.on('disconnect', () => {
    const player = players.get(socket.id);
    if (player) {
      console.log('❌ 퇴장:', player.username);
      players.delete(socket.id);
      
      // 모든 클라이언트에게 업데이트
      io.emit('players:update', Array.from(players.values()));
    }
  });
});

// ============================================
// REST API (DB 저장용 - 선택사항)
// ============================================

app.post('/api/player/save', (req, res) => {
  const { userId, x, y } = req.body;
  console.log('💾 플레이어 저장:', userId, x, y);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
