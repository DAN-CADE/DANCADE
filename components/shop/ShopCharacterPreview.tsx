"use client";

import dynamic from "next/dynamic";
import type { CharacterState } from "@/components/avatar/utils/LpcTypes";

const AvatarPreview = dynamic(
  () => import("@/components/avatar/ui/AvatarPreview"),
  { ssr: false }
);

interface ShopCharacterPreviewProps {
  character: CharacterState;
}

export default function ShopCharacterPreview({
  character,
}: ShopCharacterPreviewProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-[260px] h-[260px] border-2 border-[#00f5d4] rounded-md bg-black flex items-center justify-center">
        <AvatarPreview customization={character} />
      </div>

      <p className="text-sm text-gray-400">
        아이템을 클릭하면 미리 입어볼 수 있어요
      </p>
    </div>
  );
}
