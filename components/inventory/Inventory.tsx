"use client";

import { useEffect, useState } from "react";
import InventoryItemCard from "@/components/inventory/InventoryItemCard";
import { useInventoryList } from "@/hooks/inventory/useInventoryList";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  applyAvatarState,
  buildNextColorState,
  buildNextPartState,
} from "@/game/utils/avatarCustomization";
import { updateCharacterSkin } from "@/lib/api/inventory/character";
import { equipItemParts } from "@/lib/api/inventory/equipItemParts";
import { useToast } from "../common/ToastProvider";

const COLOR_CATEGORY_TO_PART = {
  Skin: ["body", "head", "nose"],
  Eyes: ["eyes"],
  Hair: ["hair"],
  Top: ["torso"],
  Bottom: ["legs"],
  Feet: ["feet"],
} as const;

const PART_CATEGORY_TO_PART = {
  hair: "hair",
  top: "torso",
  bottom: "legs",
  feet: "feet",
} as const;

/* =========================
 * 파츠 카테고리 (상단)
 * ========================= */
const PART_CATEGORIES = ["Hair", "Top", "Bottom", "Feet"] as const;
type PartCategory = (typeof PART_CATEGORIES)[number];

/* =========================
 * 색상 카테고리 (하단)
 * ========================= */
const COLOR_CATEGORIES = [
  "Skin",
  "Eyes",
  "Hair",
  "Top",
  "Bottom",
  "Feet",
] as const;
type ColorCategory = (typeof COLOR_CATEGORIES)[number];

/* =========================
 * 색상 팔레트 (JSON 기준)
 * ========================= */
const COLOR_PALETTES: Record<ColorCategory, string[]> = {
  Skin: ["light", "amber", "bronze", "green", "zombie", "blue"],
  Eyes: ["gray", "red", "orange", "yellow", "brown", "green", "blue", "purple"],
  Hair: ["black", "red", "pink", "orange", "blonde", "green", "blue", "purple"],
  Top: [
    "white",
    "gray",
    "black",
    "red",
    "pink",
    "orange",
    "brown",
    "green",
    "blue",
    "purple",
  ],
  Bottom: [
    "white",
    "gray",
    "black",
    "red",
    "pink",
    "orange",
    "brown",
    "green",
    "blue",
    "purple",
  ],
  Feet: [
    "white",
    "gray",
    "black",
    "red",
    "pink",
    "orange",
    "brown",
    "green",
    "blue",
    "purple",
  ],
};

/* =========================
 * UI용 컬러 HEX (임시)
 * ========================= */
const COLOR_HEX: Record<string, string> = {
  black: "#000000",
  gray: "#888888",
  white: "#ffffff",
  red: "#e74c3c",
  pink: "#ff7eb6",
  orange: "#f39c12",
  blonde: "#f5e6a1",
  brown: "#8e5a2b",
  green: "#2ecc71",
  blue: "#3498db",
  purple: "#9b59b6",
  yellow: "#f1c40f",
  light: "#f1d7c6",
  amber: "#e0b07c",
  bronze: "#b87333",
  zombie: "#7fae7a",
};

/* =========================
 * Inventory Component
 * ========================= */
export default function Inventory() {
  const [, forceRender] = useState(0);
  const [avatarDataManager, setAvatarDataManager] = useState<any>(null);
  const [avatarManager, setAvatarManager] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<PartCategory>("Hair");
  const [activeColorCategory, setActiveColorCategory] =
    useState<ColorCategory>("Skin");
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(
    null
  );
  const [hasUserDragged, setHasUserDragged] = useState(false); // 사용자가 드래그했는지 여부
  const { getCurrentUser } = useAuth();
  const user = getCurrentUser();
  const userId = user?.id ?? null;
  const { items, loading, fetchInventory } = useInventoryList(userId);
  const { showToast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      const adm = (window as any).__avatarDataManager;
      const am = (window as any).__avatarManager;

      if (adm && am) {
        setAvatarDataManager(adm);
        setAvatarManager(am);
        console.log("✅ Avatar managers connected in Inventory", {
          avatarDataManager: !!adm,
          avatarManager: !!am,
        });
        clearInterval(interval);
      }
    }, 300);

    return () => clearInterval(interval);
  }, []);

  /* =========================
   * 캐릭터 위치 추적 및 인벤토리 위치 업데이트
   * ========================= */
  useEffect(() => {
    if (!isOpen || !avatarManager) {
      // 인벤토리가 닫히면 드래그 상태 초기화
      setHasUserDragged(false);
      return;
    }

    // 사용자가 드래그를 했다면 자동 위치 추적 비활성화
    if (hasUserDragged) return;

    // 인벤토리창 크기
    const inventoryWidth = 400;
    const inventoryHeight = 520;

    // 캐릭터 크기 (물리 바디 32x32 + 이름표 높이 약 20px + 여유 공간)
    const characterWidth = 64; // 보수적으로 계산
    const characterHeight = 80; // 물리 바디 + 이름표 + 여유

    // 인벤토리 대각선 길이 (가장 긴 거리)
    const inventoryDiagonal = Math.sqrt(
      inventoryWidth * inventoryWidth + inventoryHeight * inventoryHeight
    );
    // 캐릭터 대각선 길이
    const characterDiagonal = Math.sqrt(
      characterWidth * characterWidth + characterHeight * characterHeight
    );

    // 안전한 최소 거리: (인벤토리 대각선/2) + (캐릭터 대각선/2) + 여유 공간
    const minDistance = inventoryDiagonal / 2 + characterDiagonal / 2 + 80;
    // 최대 거리
    const maxDistance = minDistance + 150;

    // 캐릭터 중심으로 원형 배치를 위한 랜덤 각도와 거리 생성
    // 인벤토리가 열릴 때마다 새로운 위치 생성 (useEffect가 isOpen 변경 시 재실행됨)
    const randomAngle = Math.random() * Math.PI * 2; // 0 ~ 2π (전체 원)
    const randomDistance =
      minDistance + Math.random() * (maxDistance - minDistance);

    // 이 값들은 이 useEffect 실행 동안 고정됨 (인벤토리가 닫혔다가 다시 열릴 때까지)

    const updatePosition = () => {
      try {
        const mainScene = (window as any).__mainScene;
        if (!mainScene || !mainScene.cameras) return;

        // 플레이어 월드 좌표 가져오기
        const playerPos = avatarManager.getPosition();
        if (!playerPos) return;

        // 카메라를 통해 월드 좌표를 화면 좌표로 변환
        const camera = mainScene.cameras.main;

        // Phaser 카메라 좌표 변환: 월드 좌표 -> 화면 좌표
        const zoom = camera.zoom || 1;

        // 월드 좌표를 화면 좌표로 변환
        const playerScreenX = (playerPos.x - camera.scrollX) * zoom;
        const playerScreenY = (playerPos.y - camera.scrollY) * zoom;

        // 게임 컨테이너의 위치를 고려하여 화면 좌표 계산
        const gameContainer = document.getElementById("game-container");
        if (gameContainer) {
          const rect = gameContainer.getBoundingClientRect();

          // 캐릭터 화면 좌표 (게임 컨테이너 기준)
          const playerX = rect.left + playerScreenX;
          const playerY = rect.top + playerScreenY;

          // 캐릭터 중심으로 원형 배치
          // 인벤토리 중앙이 캐릭터로부터 randomDistance만큼 떨어진 위치
          const offsetX = Math.cos(randomAngle) * randomDistance;
          const offsetY = Math.sin(randomAngle) * randomDistance;

          // 인벤토리 중앙 좌표 계산
          const inventoryCenterX = playerX + offsetX;
          const inventoryCenterY = playerY + offsetY;

          // 인벤토리 왼쪽 상단 좌표 (중앙에서 왼쪽 상단으로 이동)
          let finalX = inventoryCenterX - inventoryWidth / 2;
          let finalY = inventoryCenterY - inventoryHeight / 2;

          // 화면 경계 체크 및 조정
          const windowWidth = window.innerWidth;
          const windowHeight = window.innerHeight;

          // 화면 밖으로 나가지 않도록 조정
          if (finalX < 0) finalX = 10;
          if (finalX + inventoryWidth > windowWidth)
            finalX = windowWidth - inventoryWidth - 10;
          if (finalY < 0) finalY = 10;
          if (finalY + inventoryHeight > windowHeight)
            finalY = windowHeight - inventoryHeight - 10;

          // 캐릭터와 겹치는지 최종 확인 (AABB 충돌 검사)
          const playerCenterX = playerX;
          const playerCenterY = playerY;
          const inventoryCenterFinalX = finalX + inventoryWidth / 2;
          const inventoryCenterFinalY = finalY + inventoryHeight / 2;

          // 인벤토리와 캐릭터의 AABB (Axis-Aligned Bounding Box) 계산
          const inventoryLeft = finalX;
          const inventoryRight = finalX + inventoryWidth;
          const inventoryTop = finalY;
          const inventoryBottom = finalY + inventoryHeight;

          const characterLeft = playerCenterX - characterWidth / 2;
          const characterRight = playerCenterX + characterWidth / 2;
          const characterTop = playerCenterY - characterHeight / 2;
          const characterBottom = playerCenterY + characterHeight / 2;

          // AABB 충돌 검사
          const isOverlapping = !(
            inventoryRight < characterLeft ||
            inventoryLeft > characterRight ||
            inventoryBottom < characterTop ||
            inventoryTop > characterBottom
          );

          // 중심 간 거리 계산
          const distanceFromPlayer = Math.sqrt(
            Math.pow(inventoryCenterFinalX - playerCenterX, 2) +
              Math.pow(inventoryCenterFinalY - playerCenterY, 2)
          );

          // 캐릭터와 겹치거나 너무 가까우면 더 멀리 이동
          if (isOverlapping || distanceFromPlayer < minDistance) {
            // 현재 인벤토리 중심에서 캐릭터 중심으로의 각도
            const angleToPlayer = Math.atan2(
              inventoryCenterFinalY - playerCenterY,
              inventoryCenterFinalX - playerCenterX
            );

            // 캐릭터로부터 안전한 거리만큼 떨어진 위치 계산
            const newCenterX =
              playerCenterX + Math.cos(angleToPlayer) * minDistance;
            const newCenterY =
              playerCenterY + Math.sin(angleToPlayer) * minDistance;

            finalX = newCenterX - inventoryWidth / 2;
            finalY = newCenterY - inventoryHeight / 2;

            // 다시 화면 경계 체크
            if (finalX < 0) finalX = 10;
            if (finalX + inventoryWidth > windowWidth)
              finalX = windowWidth - inventoryWidth - 10;
            if (finalY < 0) finalY = 10;
            if (finalY + inventoryHeight > windowHeight)
              finalY = windowHeight - inventoryHeight - 10;

            // 화면 경계 조정 후에도 다시 충돌 검사
            const adjustedInventoryCenterX = finalX + inventoryWidth / 2;
            const adjustedInventoryCenterY = finalY + inventoryHeight / 2;
            const adjustedDistance = Math.sqrt(
              Math.pow(adjustedInventoryCenterX - playerCenterX, 2) +
                Math.pow(adjustedInventoryCenterY - playerCenterY, 2)
            );

            // 여전히 너무 가까우면 반대 방향으로 이동 시도
            if (adjustedDistance < minDistance * 0.9) {
              const oppositeAngle = angleToPlayer + Math.PI; // 반대 방향
              const newCenterX2 =
                playerCenterX + Math.cos(oppositeAngle) * minDistance;
              const newCenterY2 =
                playerCenterY + Math.sin(oppositeAngle) * minDistance;

              finalX = newCenterX2 - inventoryWidth / 2;
              finalY = newCenterY2 - inventoryHeight / 2;

              // 다시 화면 경계 체크
              if (finalX < 0) finalX = 10;
              if (finalX + inventoryWidth > windowWidth)
                finalX = windowWidth - inventoryWidth - 10;
              if (finalY < 0) finalY = 10;
              if (finalY + inventoryHeight > windowHeight)
                finalY = windowHeight - inventoryHeight - 10;
            }
          }

          setPosition({ top: finalY, left: finalX });
        }
      } catch (error) {
        console.error("인벤토리 위치 업데이트 오류:", error);
      }
    };

    // 초기 위치 설정
    updatePosition();

    // 주기적으로 위치 업데이트 (플레이어 이동 추적) - 드래그 중이 아닐 때만
    const positionInterval = setInterval(() => {
      if (!isDragging) {
        updatePosition();
      }
    }, 100);

    return () => clearInterval(positionInterval);
  }, [isOpen, avatarManager, isDragging, hasUserDragged]);

  /* =========================
   * 인벤토리 토글
   * ========================= */
  useEffect(() => {
    const handleToggle = () => {
      // ❌ 게스트면 토스트만
      if (!user) {
        showToast({
          type: "info",
          message: "게스트는 인벤토리를 사용할 수 없습니다",
        });
        return;
      }

      // ✅ 로그인 유저만 열기
      setIsOpen((prev) => !prev);
    };

    window.addEventListener("inventory-toggle", handleToggle);
    return () => window.removeEventListener("inventory-toggle", handleToggle);
  }, [user, showToast]);

  /* =========================
   * 인벤토리 열릴 때 fetch
   * ========================= */
  useEffect(() => {
    if (isOpen && user) {
      fetchInventory();
    }
  }, [isOpen, userId, fetchInventory]);

  /* =========================
   * 드래그 기능
   * ========================= */
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // 헤더 영역에서만 드래그 가능
    if (position) {
      const startX = e.clientX;
      const startY = e.clientY;
      const offsetX = startX - position.left;
      const offsetY = startY - position.top;

      setDragOffset({ x: offsetX, y: offsetY });
      setIsDragging(true);
      setHasUserDragged(true); // 사용자가 드래그를 시작했음을 표시
    }
  };

  useEffect(() => {
    if (!isDragging || !dragOffset || !position) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // 화면 경계 체크
      const inventoryWidth = 400;
      const inventoryHeight = 520;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      let adjustedX = newX;
      let adjustedY = newY;

      // 화면 밖으로 나가지 않도록 조정
      if (adjustedX < 0) adjustedX = 10;
      if (adjustedX + inventoryWidth > windowWidth)
        adjustedX = windowWidth - inventoryWidth - 10;
      if (adjustedY < 0) adjustedY = 10;
      if (adjustedY + inventoryHeight > windowHeight)
        adjustedY = windowHeight - inventoryHeight - 10;

      setPosition({ top: adjustedY, left: adjustedX });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragOffset(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset, position]);

  if (!isOpen || !user) return null;

  const filtered = items.filter(
    (it) => it.category === activeCategory.toLowerCase()
  );

  // 파츠 장착
  async function onEquipPart(item: any) {
    if (!avatarDataManager || !avatarManager) return;
    const current = avatarDataManager.customization;
    if (!current) return;

    const partKey =
      PART_CATEGORY_TO_PART[
        item.category as keyof typeof PART_CATEGORY_TO_PART
      ];
    if (!partKey) return;

    const next = buildNextPartState(current, partKey, item.styleKey);
    // ✅ 1. 즉시 반영 (UX)

    applyAvatarState(next, avatarDataManager, avatarManager);
    // ✅ 2. 서버 저장 (비동기)
    try {
      await updateCharacterSkin(user!.id, next);
      await equipItemParts(user!.id, item.itemId);
      await fetchInventory();
    } catch (e) {
      console.error("❌ 서버 저장 실패", e);
      // (선택) 토스트 / 롤백 가능
    }
  }

  // 색상 장착
  async function onEquipColor(category: ColorCategory, color: string) {
    if (!avatarDataManager || !avatarManager) return;
    const current = avatarDataManager.customization;
    if (!current) return;

    const targetParts = COLOR_CATEGORY_TO_PART[category];
    if (!targetParts) return;

    const next = buildNextColorState(current, targetParts, color);

    applyAvatarState(next, avatarDataManager, avatarManager);
    forceRender((v) => v + 1);

    // ✅ 2. 서버 저장 (비동기)
    try {
      await updateCharacterSkin(user!.id, next);
    } catch (e) {
      console.error("❌ 서버 저장 실패", e);
      // (선택) 토스트 / 롤백 가능
    }
  }

  function isColorEquipped(category: ColorCategory, color: string) {
    const customization = avatarDataManager?.customization;
    if (!customization) return false;

    const parts = customization.parts;
    if (!parts) return false;

    const targetParts = COLOR_CATEGORY_TO_PART[category];
    if (!targetParts) return false;

    // 해당 카테고리의 파츠 중
    // 하나라도 이 색을 쓰고 있으면 장착 중
    return targetParts.some((part) => {
      return parts[part]?.color === color;
    });
  }

  // 위치가 설정되지 않았으면 기본 위치 사용
  const style = position
    ? { top: `${position.top}px`, left: `${position.left}px` }
    : { top: "24px", right: "24px" };

  return (
    <div
      className={`fixed w-[400px] h-[520px] bg-[rgba(10,15,30,0.85)] border border-white/20 rounded-lg backdrop-blur z-50 flex flex-col ${
        isDragging ? "cursor-move" : ""
      }`}
      style={style}
    >
      {/* ================= Header ================= */}
      <div
        className="h-12 px-4 flex items-center justify-between border-b border-white/10 cursor-move select-none"
        onMouseDown={handleMouseDown}
        style={{ userSelect: "none" }}
      >
        <span className="text-white text-sm font-bold">Inventory</span>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white/60 text-xs hover:text-white"
          onMouseDown={(e) => e.stopPropagation()} // 닫기 버튼 클릭 시 드래그 방지
        >
          ✕
        </button>
      </div>

      {/* ================= 파츠 탭 ================= */}
      <div className="flex gap-2 px-3 py-2 border-b border-white/10">
        {PART_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 text-xs rounded ${
              activeCategory === cat
                ? "bg-white text-black"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ================= 아이템 그리드 ================= */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="text-white/60 text-xs">Loading...</div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {filtered.map((item) => (
              <InventoryItemCard
                key={item.userItemId}
                name={item.name}
                imageUrl={item.imageUrl}
                isEquipped={item.isEquipped}
                onDoubleClick={() => onEquipPart(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ================= 색상 탭 ================= */}
      <div className="pt-3 pb-3 px-3 py-2 border-t border-white/10">
        <div className="flex gap-2 flex-wrap">
          {COLOR_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveColorCategory(cat)}
              className={` px-3 py-1 text-xs rounded ${
                activeColorCategory === cat
                  ? "bg-white text-black"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ================= 색상 Picker ================= */}
      <div className="px-3 pb-3">
        <div className="pl-2 flex gap-2 flex-wrap">
          {COLOR_PALETTES[activeColorCategory].map((color) => (
            <button
              key={color}
              title={color}
              onDoubleClick={() => onEquipColor(activeColorCategory, color)}
              className={`
                w-6 h-6 rounded-full
                transition
                ${
                  isColorEquipped(activeColorCategory, color)
                    ? "ring-2 ring-white-400 scale-110"
                    : "border border-white/40 hover:scale-110"
                }
              `}
              style={{ backgroundColor: COLOR_HEX[color] }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
