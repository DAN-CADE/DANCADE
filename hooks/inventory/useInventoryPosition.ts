// hooks/inventory/useInventoryPosition.ts
// 인벤토리 위치 계산 및 캐릭터 추적 로직

import { useState, useEffect, useCallback } from "react";
import { INVENTORY_CONFIG } from "@/constants/inventory";

interface Position {
  top: number;
  left: number;
}

interface AvatarManager {
  getPosition: () => { x: number; y: number } | null;
}

interface UseInventoryPositionProps {
  isOpen: boolean;
  avatarManager: AvatarManager | null;
  isDragging: boolean;
  hasUserDragged: boolean;
}

interface UseInventoryPositionReturn {
  position: Position | null;
  setPosition: React.Dispatch<React.SetStateAction<Position | null>>;
}

/**
 * 인벤토리 위치 계산 및 캐릭터 추적 훅
 * - 캐릭터 위치 기반 인벤토리 배치
 * - 화면 경계 체크
 * - 캐릭터 겹침 방지
 */
export function useInventoryPosition({
  isOpen,
  avatarManager,
  isDragging,
  hasUserDragged,
}: UseInventoryPositionProps): UseInventoryPositionReturn {
  const [position, setPosition] = useState<Position | null>(null);

  useEffect(() => {
    if (!isOpen || !avatarManager) return;

    // 사용자가 드래그를 했다면 자동 위치 추적 비활성화
    if (hasUserDragged) return;

    const {
      WIDTH: inventoryWidth,
      HEIGHT: inventoryHeight,
      CHARACTER_WIDTH: characterWidth,
      CHARACTER_HEIGHT: characterHeight,
      BOUNDARY_PADDING,
      MIN_DISTANCE_OFFSET,
      MAX_DISTANCE_OFFSET,
    } = INVENTORY_CONFIG;

    // 안전한 최소/최대 거리 계산
    const inventoryDiagonal = Math.sqrt(
      inventoryWidth * inventoryWidth + inventoryHeight * inventoryHeight
    );
    const characterDiagonal = Math.sqrt(
      characterWidth * characterWidth + characterHeight * characterHeight
    );
    const minDistance = inventoryDiagonal / 2 + characterDiagonal / 2 + MIN_DISTANCE_OFFSET;
    const maxDistance = minDistance + MAX_DISTANCE_OFFSET;

    // 랜덤 각도와 거리 (인벤토리 열릴 때 한 번만)
    const randomAngle = Math.random() * Math.PI * 2;
    const randomDistance = minDistance + Math.random() * (maxDistance - minDistance);

    const updatePosition = () => {
      try {
        const mainScene = (window as Window & { __mainScene?: { cameras: { main: { zoom: number; scrollX: number; scrollY: number } } } }).__mainScene;
        if (!mainScene || !mainScene.cameras) return;

        const playerPos = avatarManager.getPosition();
        if (!playerPos) return;

        const camera = mainScene.cameras.main;
        const zoom = camera.zoom || 1;

        // 월드 좌표를 화면 좌표로 변환
        const playerScreenX = (playerPos.x - camera.scrollX) * zoom;
        const playerScreenY = (playerPos.y - camera.scrollY) * zoom;

        const gameContainer = document.getElementById("game-container");
        if (!gameContainer) return;

        const rect = gameContainer.getBoundingClientRect();
        const playerX = rect.left + playerScreenX;
        const playerY = rect.top + playerScreenY;

        // 캐릭터 중심으로 원형 배치
        const offsetX = Math.cos(randomAngle) * randomDistance;
        const offsetY = Math.sin(randomAngle) * randomDistance;

        const inventoryCenterX = playerX + offsetX;
        const inventoryCenterY = playerY + offsetY;

        let finalX = inventoryCenterX - inventoryWidth / 2;
        let finalY = inventoryCenterY - inventoryHeight / 2;

        // 화면 경계 체크
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        finalX = clampToBoundary(finalX, windowWidth - inventoryWidth, BOUNDARY_PADDING);
        finalY = clampToBoundary(finalY, windowHeight - inventoryHeight, BOUNDARY_PADDING);

        // 캐릭터 겹침 검사 및 조정
        const adjusted = adjustForCharacterOverlap(
          finalX,
          finalY,
          playerX,
          playerY,
          inventoryWidth,
          inventoryHeight,
          characterWidth,
          characterHeight,
          minDistance,
          windowWidth,
          windowHeight,
          BOUNDARY_PADDING
        );

        setPosition({ top: adjusted.y, left: adjusted.x });
      } catch (error) {
        console.error("인벤토리 위치 업데이트 오류:", error);
      }
    };

    updatePosition();

    const positionInterval = setInterval(() => {
      if (!isDragging) {
        updatePosition();
      }
    }, INVENTORY_CONFIG.UPDATE_INTERVAL);

    return () => clearInterval(positionInterval);
  }, [isOpen, avatarManager, isDragging, hasUserDragged]);

  return { position, setPosition };
}

/**
 * 경계 내로 값 제한
 */
function clampToBoundary(value: number, max: number, padding: number): number {
  if (value < padding) return padding;
  if (value > max - padding) return max - padding;
  return value;
}

/**
 * 캐릭터 겹침 조정
 */
function adjustForCharacterOverlap(
  finalX: number,
  finalY: number,
  playerX: number,
  playerY: number,
  inventoryWidth: number,
  inventoryHeight: number,
  characterWidth: number,
  characterHeight: number,
  minDistance: number,
  windowWidth: number,
  windowHeight: number,
  padding: number
): { x: number; y: number } {
  // AABB 충돌 검사
  const inventoryLeft = finalX;
  const inventoryRight = finalX + inventoryWidth;
  const inventoryTop = finalY;
  const inventoryBottom = finalY + inventoryHeight;

  const characterLeft = playerX - characterWidth / 2;
  const characterRight = playerX + characterWidth / 2;
  const characterTop = playerY - characterHeight / 2;
  const characterBottom = playerY + characterHeight / 2;

  const isOverlapping = !(
    inventoryRight < characterLeft ||
    inventoryLeft > characterRight ||
    inventoryBottom < characterTop ||
    inventoryTop > characterBottom
  );

  const inventoryCenterX = finalX + inventoryWidth / 2;
  const inventoryCenterY = finalY + inventoryHeight / 2;
  const distanceFromPlayer = Math.sqrt(
    Math.pow(inventoryCenterX - playerX, 2) +
    Math.pow(inventoryCenterY - playerY, 2)
  );

  if (!isOverlapping && distanceFromPlayer >= minDistance) {
    return { x: finalX, y: finalY };
  }

  // 겹치거나 너무 가까우면 이동
  const angleToPlayer = Math.atan2(
    inventoryCenterY - playerY,
    inventoryCenterX - playerX
  );

  let newX = playerX + Math.cos(angleToPlayer) * minDistance - inventoryWidth / 2;
  let newY = playerY + Math.sin(angleToPlayer) * minDistance - inventoryHeight / 2;

  newX = clampToBoundary(newX, windowWidth - inventoryWidth, padding);
  newY = clampToBoundary(newY, windowHeight - inventoryHeight, padding);

  // 여전히 너무 가까우면 반대 방향 시도
  const adjustedCenterX = newX + inventoryWidth / 2;
  const adjustedCenterY = newY + inventoryHeight / 2;
  const adjustedDistance = Math.sqrt(
    Math.pow(adjustedCenterX - playerX, 2) +
    Math.pow(adjustedCenterY - playerY, 2)
  );

  if (adjustedDistance < minDistance * 0.9) {
    const oppositeAngle = angleToPlayer + Math.PI;
    newX = playerX + Math.cos(oppositeAngle) * minDistance - inventoryWidth / 2;
    newY = playerY + Math.sin(oppositeAngle) * minDistance - inventoryHeight / 2;

    newX = clampToBoundary(newX, windowWidth - inventoryWidth, padding);
    newY = clampToBoundary(newY, windowHeight - inventoryHeight, padding);
  }

  return { x: newX, y: newY };
}
