# 🎮 game_results 테이블 스키마 분석 및 개선안

## 📊 현재 스키마

```sql
create table public.game_results (
  id uuid not null default gen_random_uuid (),
  game_type character varying(50) not null,
  score integer not null,
  game_duration integer null,
  bricks_destroyed integer null,
  is_win boolean null,
  lives integer null,
  created_at timestamp with time zone null default now(),
  metadata jsonb null default '{}'::jsonb,
  constraint game_results_pkey primary key (id)
)
```

---

## 🎮 프로젝트 게임 분석

### 1. **Brick Breaker** (벽돌깨기)
**핵심 데이터:**
- ✅ `score` - 수집한 포인트
- ✅ `game_duration` (elapsedTime) - 게임 시간
- ✅ `bricks_destroyed` - 파괴한 벽돌 수 
- ✅ `lives` - 남은 목숨
- ✅ `is_win` - 승리 여부
- ❌ **미수집**: 라이프 수, 최대 연속 벽돌 파괴 수

### 2. **Ping Pong** (탁구)
**핵심 데이터:**
- ✅ `score` - 플레이어 점수
- ✅ `game_duration` (elapsedTime) - 게임 시간
- ✅ `is_win` - 승리 여부
- ❌ **미수집**: 상대 점수, 최장 랠리, 완벽한 타격 횟수, 총 랠리 수

### 3. **Omok** (오목) - 멀티플레이
**핵심 데이터:**
- ✅ `is_win` - 승리 여부
- ✅ `game_duration` - 게임 시간
- ❌ **미수집**: 보드 크기, 이동 수, 게임 기록(moves), 플레이어 vs AI 여부

---

## 🚨 현재 스키마의 문제점

### 1. **게임별 메타데이터가 너무 분산됨**
| 문제 | 예시 | 영향 |
|------|------|------|
| 게임 특화 컬럼이 고정됨 | `bricks_destroyed` (Brick Breaker 전용) | 다른 게임에는 불필요한 컬럼 포함 |
| 중요 데이터가 누락됨 | Ping Pong의 `opponent_score`, `longest_rally` | 통계 분석 불가 |
| Metadata 활용도가 낮음 | 거의 비어있음 | 구조화된 데이터 저장 불가 |

### 2. **멀티플레이 게임 지원 미흡**
| 게임 | 문제점 |
|------|--------|
| Ping Pong | `opponent_score` 저장 불가 |
| Omok | 상대방 정보, 이동 기록 저장 불가 |
| 공통 | `player_id`, `opponent_id` 필드 없음 |

### 3. **점수 체계의 추상화 부족**
- 게임마다 `score`의 의미가 다름
  - Brick Breaker: 포인트 (누적)
  - Ping Pong: 점수 (0~N)
  - Omok: 의미 없음 (승/패만 있음)
- 일관된 순위 계산 불가능

### 4. **분석 및 통계 기능 제약**
| 기능 | 문제 |
|------|------|
| 게임 통계 | 게임별 메타데이터 구조가 다름 |
| 플레이어 분석 | 게임별 성능 비교 어려움 |
| 게임 밸런스 | 게임별 난이도 분석 불가 |
| 리더보드 | 게임 간 점수 정규화 필요 |

---

## ✅ 개선안

### **옵션 1: Metadata JSONB 활용 (권장)**

```sql
-- 기존 테이블 유지, metadata 구조 정의

-- metadata 예시 (Brick Breaker)
{
  "lives_remaining": 2,
  "max_consecutive_bricks": 5,
  "ball_hits": 45,
  "ai_difficulty": "normal"
}

-- metadata 예시 (Ping Pong)
{
  "opponent_score": 15,
  "longest_rally": 23,
  "perfect_hits": 8,
  "total_rallies": 42,
  "mode": "single",  -- single, local, online
  "serve_start": "player"
}

-- metadata 예시 (Omok)
{
  "board_size": 19,
  "move_count": 47,
  "moves": [[9,9], [10,9], ...],  -- 게임 기록
  "opponent_type": "ai",  -- ai, online
  "opponent_id": "uuid",
  "match_duration_ms": 245000
}
```

**장점:**
- ✅ 기존 테이블 구조 유지
- ✅ 게임별 유연한 데이터 저장
- ✅ 쿼리 최적화 가능 (JSONB 인덱싱)
- ✅ 향후 새 게임 추가 용이

**단점:**
- ⚠️ JSONB 쿼리가 복잡할 수 있음
- ⚠️ 타입 안정성 낮음

---

### **옵션 2: 정규화된 스키마 (확장성 최고)**

```sql
-- game_results 테이블 (핵심만)
create table public.game_results (
  id uuid not null default gen_random_uuid(),
  game_type varchar(50) not null,
  player_id uuid not null,
  opponent_id uuid null,  -- 멀티플레이용
  is_win boolean not null,
  duration_seconds integer,
  created_at timestamp with time zone default now(),
  constraint game_results_pkey primary key (id),
  constraint fk_player foreign key (player_id) references public.users(id),
  constraint fk_opponent foreign key (opponent_id) references public.users(id)
);

-- 게임별 상세 테이블들
-- 1. Brick Breaker 결과
create table public.brick_breaker_results (
  id uuid not null default gen_random_uuid(),
  game_result_id uuid not null,
  score integer not null,
  bricks_destroyed integer not null,
  lives_remaining integer,
  max_consecutive_bricks integer,
  difficulty varchar(20),
  constraint brick_breaker_results_pkey primary key (id),
  constraint fk_game_result foreign key (game_result_id) 
    references public.game_results(id) on delete cascade
);

-- 2. Ping Pong 결과
create table public.ping_pong_results (
  id uuid not null default gen_random_uuid(),
  game_result_id uuid not null,
  player_score integer not null,
  opponent_score integer not null,
  longest_rally integer,
  perfect_hits integer,
  total_rallies integer,
  mode varchar(20),  -- single, local, online
  constraint ping_pong_results_pkey primary key (id),
  constraint fk_game_result foreign key (game_result_id) 
    references public.game_results(id) on delete cascade
);

-- 3. Omok 결과
create table public.omok_results (
  id uuid not null default gen_random_uuid(),
  game_result_id uuid not null,
  board_size integer not null,
  move_count integer not null,
  moves jsonb,  -- [[9,9], [10,9], ...]
  opponent_type varchar(20),  -- ai, online
  difficulty varchar(20),
  constraint omok_results_pkey primary key (id),
  constraint fk_game_result foreign key (game_result_id) 
    references public.game_results(id) on delete cascade
);

-- 인덱스 추가
create index idx_game_results_player_id on game_results(player_id);
create index idx_game_results_game_type on game_results(game_type);
create index idx_game_results_created_at on game_results(created_at);
create index idx_brick_breaker_game_result_id on brick_breaker_results(game_result_id);
create index idx_ping_pong_game_result_id on ping_pong_results(game_result_id);
create index idx_omok_game_result_id on omok_results(game_result_id);
```

**장점:**
- ✅ 완벽한 타입 안정성
- ✅ 강력한 데이터 검증
- ✅ 복잡한 쿼리 최적화 용이
- ✅ 외래 키 제약으로 데이터 무결성 보장
- ✅ 게임별 정렬/필터링 효율적

**단점:**
- ⚠️ 초기 구현 복잡
- ⚠️ 조인 쿼리 필요

---

### **옵션 3: 하이브리드 (추천) ⭐**

```sql
-- 기존 테이블에 필수 컬럼 추가만
alter table public.game_results add column if not exists (
  player_id uuid,  -- 멀티플레이 지원
  opponent_id uuid,  -- 상대방 ID
  opponent_score integer  -- Ping Pong, 경쟁 게임용
);

-- player_id에 인덱스 추가
create index idx_game_results_player_id on game_results(player_id);
create index idx_game_results_opponent_id on game_results(opponent_id);

-- metadata 구조화 (각 게임 타입별로)
-- JSONB로 저장하되, 필요한 정보는 SELECT 쿼리에서 추출 가능
```

**metadata 저장 가이드:**

```typescript
// Brick Breaker
const metadata = {
  type: "brick_breaker",
  lives_remaining: 2,
  max_consecutive_bricks: 5,
  difficulty: "normal"
};

// Ping Pong
const metadata = {
  type: "ping_pong",
  longest_rally: 23,
  perfect_hits: 8,
  total_rallies: 42,
  mode: "single"
};

// Omok
const metadata = {
  type: "omok",
  board_size: 19,
  move_count: 47,
  opponent_type: "ai",
  difficulty: "hard"
};
```

---

## 📋 각 게임에서 수집해야 할 데이터

### **Brick Breaker**
| 데이터 | 현재 | 개선 | 저장 위치 |
|--------|------|------|---------|
| score | ✅ | 그대로 | `score` |
| game_duration | ✅ | 그대로 | `game_duration` |
| bricks_destroyed | ✅ | 그대로 | `bricks_destroyed` |
| lives_remaining | ❌ | **추가** | `metadata.lives_remaining` |
| max_consecutive_bricks | ❌ | **추가** | `metadata.max_consecutive_bricks` |
| is_win | ✅ | 그대로 | `is_win` |
| difficulty | ❌ | **추가** | `metadata.difficulty` |

```typescript
// PingPongGameManager.getGameResult() 개선
getGameResult(): PingPongGameResult {
  return {
    playerScore: this.gameState.playerScore,
    aiScore: this.gameState.aiScore,
    elapsedTime: this.gameState.elapsedTime,
    totalRallies: this.gameState.totalRallies,
    longestRally: this.gameState.longestRally,
    perfectHits: this.gameState.perfectHits,
    isWin: this.gameState.playerScore > this.gameState.aiScore,
  };
}
```

### **Ping Pong**
| 데이터 | 현재 | 개선 | 저장 위치 |
|--------|------|------|---------|
| score (player_score) | ❌ | **추가** | `score` |
| opponent_score | ❌ | **필수** | `opponent_score` |
| game_duration | ✅ | 그대로 | `game_duration` |
| longest_rally | ❌ | **필수** | `metadata.longest_rally` |
| perfect_hits | ❌ | **필수** | `metadata.perfect_hits` |
| total_rallies | ❌ | **필수** | `metadata.total_rallies` |
| is_win | ✅ | 그대로 | `is_win` |
| mode | ❌ | **추가** | `metadata.mode` |

```typescript
// Ping Pong 결과 저장 (개선)
const gameResult = gameManager.getGameResult();
const metadata = {
  longest_rally: gameResult.longestRally,
  perfect_hits: gameResult.perfectHits,
  total_rallies: gameResult.totalRallies,
  mode: "single"  // 또는 "online", "local"
};

// DB 저장
await gameResultService.saveGameResult({
  game_type: "ping-pong",
  score: gameResult.playerScore,
  opponent_score: gameResult.aiScore,  // 추가
  game_duration: Math.floor(gameResult.elapsedTime),
  is_win: gameResult.isWin,
  metadata: metadata
});
```

### **Omok** (오목)
| 데이터 | 현재 | 개선 | 저장 위치 |
|--------|------|------|---------|
| is_win | ✅ | 그대로 | `is_win` |
| game_duration | ✅ | 그대로 | `game_duration` |
| player_id | ❌ | **필수** | `player_id` |
| opponent_id | ❌ | **필수** | `opponent_id` |
| board_size | ❌ | **필수** | `metadata.board_size` |
| move_count | ❌ | **필수** | `metadata.move_count` |
| moves (game record) | ❌ | **필수** | `metadata.moves` |
| opponent_type | ❌ | **필수** | `metadata.opponent_type` |

```typescript
// Omok 결과 저장 (개선)
const metadata = {
  board_size: 19,
  move_count: omokManager.gameState.board.flat().filter(v => v !== 0).length,
  opponent_type: "ai",  // 또는 "online"
  difficulty: "hard"
};

await gameResultService.saveGameResult({
  game_type: "omok",
  player_id: currentUserId,
  opponent_id: opponentUserId,  // AI인 경우 특정 UUID
  is_win: playerWon,
  game_duration: elapsedTime,
  metadata: metadata
});
```

---

## 🔄 마이그레이션 전략

### **Phase 1: 즉시 적용 (하이브리드 방식)**
1. ✅ `game_results` 테이블에 `player_id`, `opponent_id`, `opponent_score` 컬럼 추가
2. ✅ 각 게임에서 수집하는 데이터를 metadata에 저장
3. ✅ 기존 데이터는 그대로 유지

```sql
-- 마이그레이션 SQL
alter table public.game_results 
add column player_id uuid,
add column opponent_id uuid,
add column opponent_score integer;

-- 기본 메타데이터 구조 업데이트
update public.game_results 
set metadata = metadata || '{
  "migration_version": "1.0",
  "data_structure": "hybrid"
}'::jsonb 
where metadata is null or metadata = '{}'::jsonb;

-- 인덱스 추가
create index idx_game_results_player_id on public.game_results(player_id);
create index idx_game_results_opponent_id on public.game_results(opponent_id);
```

### **Phase 2: 게임별 데이터 수집 강화**
1. ✅ Brick Breaker: `lives_remaining`, `max_consecutive_bricks` 추가
2. ✅ Ping Pong: `longest_rally`, `perfect_hits`, `total_rallies` 추가
3. ✅ Omok: `board_size`, `move_count`, `opponent_type` 추가

### **Phase 3: 통계 및 분석 쿼리 작성**
```sql
-- 게임별 플레이어 통계
select 
  game_type,
  player_id,
  count(*) as games_played,
  sum(case when is_win then 1 else 0 end) as wins,
  round(100.0 * sum(case when is_win then 1 else 0 end) / count(*), 2) as win_rate,
  round(avg((metadata->>'game_duration')::int), 0) as avg_duration
from public.game_results
where player_id = $1
group by game_type, player_id
order by games_played desc;

-- Ping Pong 통계
select 
  player_id,
  count(*) as games,
  round(avg(score::numeric), 2) as avg_player_score,
  round(avg(opponent_score::numeric), 2) as avg_opponent_score,
  round(avg((metadata->>'longest_rally')::int), 1) as avg_longest_rally
from public.game_results
where game_type = 'ping-pong' and player_id = $1
group by player_id;
```

---

## 📊 권장 사항 정리

| 항목 | 권장 방식 | 이유 |
|------|---------|------|
| **테이블 구조** | 하이브리드 (Option 3) | 최소한의 변경으로 확장성 확보 |
| **필수 추가 컬럼** | `player_id`, `opponent_id`, `opponent_score` | 멀티플레이, 통계 지원 |
| **게임 특화 데이터** | `metadata` JSONB | 유연성과 확장성 최적화 |
| **데이터 검증** | 애플리케이션 레이어 | 게임별로 다른 요구사항 처리 |
| **쿼리 최적화** | JSONB 인덱싱 추가 | 자주 쿼리하는 필드에 인덱스 |
| **게임 추가 방식** | metadata 스키마 확장 | 테이블 변경 없이 새 게임 지원 |

---

## 🎯 액션 아이템

- [ ] Phase 1: 마이그레이션 SQL 실행
- [ ] Phase 2: 각 게임의 GameManager 업데이트 (metadata 확대)
- [ ] Phase 3: gameResultService.ts 업데이트
- [ ] Phase 4: 통계 쿼리 추가
- [ ] Phase 5: 리더보드 시스템 구현
- [ ] Phase 6: 게임 밸런스 분석 대시보드 구축
