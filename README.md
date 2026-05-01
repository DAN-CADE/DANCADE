# 🎮 DANCADE - 아케이드 게임 플랫폼

> 벽돌깨기, 오목, 탁구 등 다양한 아케이드 게임을 즐길 수 있는 멀티플레이어 웹 기반 게임 플랫폼

![Next.js](https://img.shields.io/badge/Next.js-16.0.7-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)
![Phaser](https://img.shields.io/badge/Phaser-3.90.0-8B5CF6?logo=phaser)
![Socket.io](https://img.shields.io/badge/Socket.io-4.8.1-010101?logo=socket.io)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
![Redis](https://img.shields.io/badge/Redis-Adapter-DC382D?logo=redis)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?logo=openai)

## 📋 목차

- [프로젝트 소개](#-프로젝트-소개)
- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [프로젝트 구조](#-프로젝트-구조)
- [시작하기](#-시작하기)
- [환경 변수 설정](#-환경-변수-설정)
- [스크립트](#-스크립트)
- [게임 목록](#-게임-목록)
- [API 엔드포인트](#-api-엔드포인트)

---

## 🎯 프로젝트 소개

**DANCADE**는 Next.js와 Phaser 게임 엔진을 기반으로 한 웹 아케이드 게임 플랫폼입니다. 사용자는 게스트 또는 회원으로 로그인하여 다양한 아케이드 게임을 플레이하고, 캐릭터를 커스터마이징하며, 실시간 채팅과 랭킹 시스템을 이용할 수 있습니다.

### ✨ 하이라이트

- 🎨 **LPC 기반 캐릭터 커스터마이징** - 헤어, 상의, 하의, 신발 등 다양한 파츠 조합
- 🎮 **Phaser 3 게임 엔진** - 부드러운 2D 게임 경험
- 🌐 **실시간 멀티플레이어** - Socket.io 기반 대전 게임
- 💬 **실시간 채팅** - 로비 및 인게임 채팅 지원
- 🏪 **상점 시스템** - 포인트로 아이템 구매
- 🏆 **랭킹 시스템** - TOP 100 리더보드

---

## 🚀 주요 기능

### 🔐 인증 시스템

- **회원 로그인** - 이메일/비밀번호 기반 회원 인증
- **게스트 로그인** - 랜덤 닉네임으로 즉시 플레이 가능
- 게스트 데이터 localStorage 저장 및 복원

### 🧑‍🎤 캐릭터 시스템

- **LPC (Liberated Pixel Cup) 스프라이트** 기반 캐릭터
- 성별 선택 (남/여)
- 파츠별 커스터마이징: 헤어, 상의, 하의, 신발
- 컬러 변경 지원
- 랜덤 캐릭터 생성

### 🎮 게임

| 게임         | 설명                 | 모드             |
| ------------ | -------------------- | ---------------- |
| **벽돌깨기** | 클래식 브릭 브레이커 | 싱글플레이       |
| **오목**     | 15x15 바둑판 오목    | AI / 온라인 대전 |
| **탁구**     | 핑퐁 게임            | 멀티플레이어     |

### 🗺️ 맵 시스템

- Tiled 맵 에디터 기반 타일맵
- 아케이드 오락실 테마 맵
- 캐릭터 이동 및 충돌 처리

### 💬 채팅 시스템

- Socket.io 기반 실시간 채팅
- 로비 전체 채팅
- 게스트용 퀵 메시지 패널
- GPT-4o-mini 연동 AI 분석

### 🏪 상점 & 인벤토리

- 포인트로 아이템 구매
- 카테고리별 필터링 (헤어, 상의, 하의, 신발)
- 구매한 아이템 인벤토리 관리
- 장착/해제 기능

### 🏆 랭킹

- 게임별 TOP 100 랭킹
- 자동 페이지 전환 (5초)
- 메달 표시 (🥇🥈🥉)

---

## 🛠 기술 스택

### Frontend

| 기술                    | 버전   | 용도                      |
| ----------------------- | ------ | ------------------------- |
| **Next.js**             | 16.0.7 | React 프레임워크 (App Router) |
| **React**               | 19.2.0 | UI 라이브러리             |
| **TypeScript**          | 5.x    | 타입 안정성               |
| **Tailwind CSS**        | 4.x    | 스타일링                  |
| **Zustand**             | 5.0.9  | 전역 상태 관리            |
| **Phaser**              | 3.90.0 | 2D 게임 엔진              |
| **GSAP**                | 3.14.2 | 애니메이션                |
| **react-hook-form**     | 7.x    | 폼 상태 관리              |
| **Zod**                 | 3.x    | 스키마 기반 유효성 검사   |
| **axios**               | 1.x    | HTTP 클라이언트           |
| **unique-names-generator** | 4.7.1 | 게스트 닉네임 생성       |

### Backend

| 기술                        | 버전   | 용도                        |
| --------------------------- | ------ | --------------------------- |
| **Express**                 | 4.18.2 | HTTP 서버                   |
| **Socket.io**               | 4.8.1  | 실시간 통신 (WebSocket)     |
| **@socket.io/redis-adapter**| -      | Socket.io 수평 확장 어댑터  |
| **Redis**                   | -      | Socket.io 어댑터 & 세션 공유 |
| **Supabase**                | 2.86.2 | PostgreSQL DB & 인증        |
| **bcryptjs**                | 3.0.3  | 비밀번호 해싱               |
| **OpenAI API**              | -      | GPT-4o-mini AI 분석         |

### 개발 도구

| 기술                          | 용도                     |
| ----------------------------- | ------------------------ |
| **Vitest**                    | 테스트 프레임워크        |
| **@testing-library/react**    | React 컴포넌트 테스트    |
| **ESLint**                    | 코드 린팅                |
| **Concurrently**              | 멀티 프로세스 동시 실행  |

---

## 📁 프로젝트 구조

```
arcade-platform/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── chat/             # 채팅 API
│   │   ├── game-result/      # 게임 결과 저장
│   │   ├── gpt/              # GPT 연동
│   │   ├── inventory/        # 인벤토리 API
│   │   ├── items/            # 아이템 API
│   │   ├── points/           # 포인트 API
│   │   ├── purchase/         # 구매 API
│   │   ├── rankings/         # 랭킹 API
│   │   ├── rooms/            # 방 관리 API
│   │   └── users/            # 유저 API
│   ├── auth/                 # 인증 페이지
│   │   ├── login/            # 로그인
│   │   └── register/         # 회원가입
│   ├── character-select/     # 캐릭터 선택
│   ├── chat/                 # 채팅 페이지
│   ├── game/                 # 게임 플레이
│   ├── map/                  # 맵 페이지
│   └── shop/                 # 상점 페이지
│
├── components/               # React 컴포넌트
│   ├── auth/                 # 인증 관련
│   ├── avatar/               # 아바타 렌더링
│   │   ├── core/             # 코어 로직
│   │   ├── ui/               # UI 컴포넌트
│   │   └── utils/            # 유틸리티
│   ├── character-select/     # 캐릭터 선택 UI
│   ├── chat/                 # 채팅 컴포넌트
│   ├── common/               # 공통 컴포넌트
│   ├── game/                 # 게임 컴포넌트
│   ├── inventory/            # 인벤토리
│   ├── map/                  # 맵 렌더러
│   ├── ranking/              # 랭킹 보드
│   └── shop/                 # 상점 UI
│
├── game/                     # Phaser 게임 로직
│   ├── config/               # 게임 설정
│   ├── managers/             # 게임 매니저들
│   │   ├── base/             # 기본 매니저
│   │   ├── games/            # 게임별 매니저
│   │   └── global/           # 전역 매니저
│   ├── scenes/               # Phaser 씬
│   │   ├── base/             # 기본 씬
│   │   ├── core/             # 코어 씬
│   │   └── games/            # 게임 씬
│   │       ├── BrickBreakerScene.ts
│   │       ├── OmokScene.ts
│   │       └── PingPongScene.ts
│   ├── types/                # 게임 타입
│   └── utils/                # 게임 유틸리티
│
├── handlers/                 # Socket 이벤트 핸들러
│   ├── ai/                   # AI 핸들러
│   ├── base/                 # 기본 핸들러
│   └── games/                # 게임별 핸들러
│       ├── omok/
│       └── pingpong/
│
├── hooks/                    # React Hooks
│   ├── auth/                 # 인증 훅
│   ├── character/            # 캐릭터 훅
│   ├── chat/                 # 채팅 훅
│   ├── inventory/            # 인벤토리 훅
│   ├── shop/                 # 상점 훅
│   └── user/                 # 유저 훅
│
├── lib/                      # 라이브러리
│   ├── api/                  # API 클라이언트
│   ├── domain/               # 도메인 로직
│   ├── services/             # 서비스 레이어
│   ├── supabase/             # Supabase 클라이언트
│   ├── utils/                # 유틸리티
│   └── validations/          # 유효성 검사
│
├── public/                   # 정적 파일
│   ├── assets/               # 게임 에셋
│   ├── maps/                 # Tiled 맵 파일
│   └── tilesets/             # 타일셋
│
├── types/                    # TypeScript 타입
│
├── server.js                 # Socket.io 서버
└── constants/                # 상수 정의
```

---

## 🏁 시작하기

### 사전 요구 사항

- Node.js 18.x 이상
- npm 또는 yarn
- Supabase 계정

### 설치

```bash
# 저장소 클론
git clone https://github.com/your-username/arcade-platform.git
cd arcade-platform

# 의존성 설치
npm install
```

### 개발 서버 실행

```bash
# Next.js + Socket.io 서버 동시 실행
npm run dev:all

# 또는 개별 실행
npm run dev      # Next.js 개발 서버 (포트 3000)
npm run server   # Socket.io 서버 (포트 3001)
```

### 접속

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

---

## 🔧 환경 변수 설정

프로젝트 루트에 `.env.local` 파일 생성:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Socket.io 서버
PORT=3001

# OpenAI (GPT-4o-mini AI 분석)
OPENAI_API_KEY=your_openai_key
```

---

## 📜 스크립트

| 명령어                  | 설명                          |
| ----------------------- | ----------------------------- |
| `npm run dev`           | Next.js 개발 서버 실행        |
| `npm run server`        | Socket.io 서버 실행           |
| `npm run dev:all`       | Next.js + Socket.io 동시 실행 |
| `npm run build`         | 프로덕션 빌드                 |
| `npm run start`         | 프로덕션 서버 시작            |
| `npm run lint`          | ESLint 실행                   |
| `npm run test`          | Vitest 테스트 실행            |
| `npm run test:ui`       | Vitest UI 모드                |
| `npm run test:coverage` | 테스트 커버리지 리포트        |

---

## 🎮 게임 목록

### 🧱 벽돌깨기 (Brick Breaker)

- **모드**: 싱글플레이
- **조작**: 마우스 좌우 이동, 스페이스바 시작
- **점수**: 벽돌 파괴 시 점수 획득
- **랭킹**: 점수 기반 랭킹 등록

### ⚫ 오목 (Omok/Gomoku)

- **모드**: AI 대전 / 온라인 대전
- **규칙**: 15x15 보드, 5목 승리
- **온라인**: 방 생성/참가, 실시간 대전

### 🏓 탁구 (Ping Pong)

- **모드**: 멀티플레이어
- **조작**: 키보드 상하 이동

---

## 📡 API 엔드포인트

### 유저

| Method | Endpoint         | 설명      |
| ------ | ---------------- | --------- |
| POST   | `/api/users`     | 유저 생성 |
| GET    | `/api/users/:id` | 유저 조회 |

### 게임

| Method | Endpoint                  | 설명           |
| ------ | ------------------------- | -------------- |
| POST   | `/api/game-result`        | 게임 결과 저장 |
| GET    | `/api/rankings/:gameType` | 랭킹 조회      |
| GET    | `/api/rooms/:gameType`    | 방 목록 조회   |

### 상점

| Method | Endpoint         | 설명          |
| ------ | ---------------- | ------------- |
| GET    | `/api/items`     | 아이템 목록   |
| POST   | `/api/purchase`  | 아이템 구매   |
| GET    | `/api/inventory` | 인벤토리 조회 |
| GET    | `/api/points`    | 포인트 조회   |

### Socket.io 이벤트

```javascript
// 클라이언트 → 서버
socket.emit('player:join', { userId, username, ... })
socket.emit('player:move', { x, y })
socket.emit('lobby:chat', { username, message })

// 서버 → 클라이언트
socket.on('players:update', (players) => { ... })
socket.on('player:moved', ({ socketId, x, y }) => { ... })
socket.on('lobby:chatMessage', ({ username, message, timestamp }) => { ... })
```

---

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

---

## 👥 개발팀

**DANCADE Team**

---

<p align="center">
  Made with ❤️ using Next.js & Phaser
</p>
