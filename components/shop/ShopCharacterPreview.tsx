"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import dynamic from "next/dynamic";
import type { CharacterState } from "@/components/avatar/utils/LpcTypes";

const AvatarPreview = dynamic(
  () => import("@/components/avatar/ui/AvatarPreview"),
  { ssr: false }
);

interface Props {
  character: CharacterState;
}

export default function ShopCharacterPreview({ character }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
  if (!wrapperRef.current) return;

  gsap.fromTo(
    wrapperRef.current,
    { scale: 0.95 },
    { scale: 1, duration: 0.3, ease: "power2.out" }
  );
}, [character]);



  useEffect(() => {
    if (!wrapperRef.current || !glowRef.current) return;

    // 캐릭터 살짝 떠 있는 느낌
    gsap.to(wrapperRef.current, {
      y: -4,
      duration: 1.8,
      repeat: -2,
      yoyo: true,
      ease: "sine.inOut",
    });

    // 발밑 glow 펄스
    gsap.fromTo(
      glowRef.current,
      { scale: 0.9, opacity: 0.2 },
      {
        scale: 1.05,
        opacity: 0.9,
        duration: 1.6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      }
    );
  }, []);

  return (
    <div className="relative flex flex-col items-center">
      {/* 발밑 glow */}
      <div
        ref={glowRef}
        className="
          absolute bottom-[-10px]
          w-28 h-4
          rounded-full
          bg-cyan-400
          blur-2xl
          opacity-30
        "
      />

      {/* 캐릭터 */}
      <div ref={wrapperRef}  className="relative top-[50px]" >
        <AvatarPreview customization={character} />
      </div>
    </div>
  );
}
