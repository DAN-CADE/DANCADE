"use client";

import { useState } from "react";

interface InventoryItemCardProps {
  id: number;
  label: string;
  isEquipped: boolean;
  onToggle: (id: number) => void;
}

export default function InventoryItemCard({   id,
  label,
  isEquipped,
  onToggle, }: InventoryItemCardProps) {
  const [equipped, setEquipped] = useState(false);

  const handleDoubleClick = () => {
    setEquipped((prev) => !prev);
  };

  return (
    <div
      onDoubleClick={() => onToggle(id)}
      className={`
        h-[72px]
        rounded
        flex
        items-center
        justify-center
        text-xs
        cursor-pointer
        transition
        select-none
        ${
          isEquipped
            ? "bg-green-500 text-black"
            : "bg-white/10 text-white/60 hover:bg-white/20"
        }
      `}
    >
      {isEquipped ? "Equipped" : label}
    </div>
  );
}
