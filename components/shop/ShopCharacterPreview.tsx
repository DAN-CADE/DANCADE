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

    gsap.to(wrapperRef.current, {
      y: -4,
      duration: 1.8,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    gsap.fromTo(
      glowRef.current,
      { scale: 0.9, opacity: 0.25 },
      {
        scale: 1.05,
        opacity: 0.8,
        duration: 1.6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      }
    );
  }, []);

  return (
    <div className="relative flex items-center justify-center">
      <div
        ref={wrapperRef}
        className="relative isolate flex items-center justify-center"
      >
        {/* glow (뒤 레이어) */}
        <div
          ref={glowRef}
          className="
            absolute
            z-0
            left-1/2
            -translate-x-1/2
            bottom-[-6px]
            w-28 h-4
            rounded-full
            bg-cyan-400
            blur-2xl
            opacity-30
            pointer-events-none
          "
        />

        {/* 캐릭터 (앞 레이어) */}
        <div className="relative z-10">
          <AvatarPreview customization={character} />
        </div>
      </div>
    </div>
  );
}
