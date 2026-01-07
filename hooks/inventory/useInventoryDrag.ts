// hooks/inventory/useInventoryDrag.ts
// 인벤토리 드래그 기능 훅

import { useState, useEffect, useCallback } from "react";
import { INVENTORY_CONFIG } from "@/constants/inventory";

interface Position {
  top: number;
  left: number;
}

interface UseInventoryDragProps {
  position: Position | null;
  setPosition: React.Dispatch<React.SetStateAction<Position | null>>;
  onDragStart?: () => void;
}

interface UseInventoryDragReturn {
  isDragging: boolean;
  hasUserDragged: boolean;
  handleMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  resetDragState: () => void;
}

/**
 * 인벤토리 드래그 기능 훅
 * - 헤더 드래그로 이동
 * - 화면 경계 제한
 * - 드래그 상태 관리
 */
export function useInventoryDrag({
  position,
  setPosition,
  onDragStart,
}: UseInventoryDragProps): UseInventoryDragReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [hasUserDragged, setHasUserDragged] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(
    null
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!position) return;

      const offsetX = e.clientX - position.left;
      const offsetY = e.clientY - position.top;

      setDragOffset({ x: offsetX, y: offsetY });
      setIsDragging(true);
      setHasUserDragged(true);
      onDragStart?.();
    },
    [position, onDragStart]
  );

  const resetDragState = useCallback(() => {
    setHasUserDragged(false);
    setIsDragging(false);
    setDragOffset(null);
  }, []);

  useEffect(() => {
    if (!isDragging || !dragOffset || !position) return;

    const {
      WIDTH: inventoryWidth,
      HEIGHT: inventoryHeight,
      BOUNDARY_PADDING,
    } = INVENTORY_CONFIG;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      // 화면 경계 체크
      let adjustedX = newX;
      let adjustedY = newY;

      if (adjustedX < BOUNDARY_PADDING) adjustedX = BOUNDARY_PADDING;
      if (adjustedX + inventoryWidth > windowWidth - BOUNDARY_PADDING) {
        adjustedX = windowWidth - inventoryWidth - BOUNDARY_PADDING;
      }
      if (adjustedY < BOUNDARY_PADDING) adjustedY = BOUNDARY_PADDING;
      if (adjustedY + inventoryHeight > windowHeight - BOUNDARY_PADDING) {
        adjustedY = windowHeight - inventoryHeight - BOUNDARY_PADDING;
      }

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
  }, [isDragging, dragOffset, position, setPosition]);

  return {
    isDragging,
    hasUserDragged,
    handleMouseDown,
    resetDragState,
  };
}
