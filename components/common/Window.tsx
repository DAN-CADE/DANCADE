// 공통 윈도우 디자인 창

import Image from "next/image";
import windowClose from "@/public/assets/icons/window-close.svg";
import windowMaximize from "@/public/assets/icons/window-maximize.svg";
import back from "@/public/assets/icons/back.svg";
import { useRouter } from "next/navigation";

interface WindowProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  showMaximize?: boolean;
  variant?: "page" | "modal"; // ✅ 추가
}

export default function Window({
  title,
  children,
  className = "",
  showMaximize = true,
  variant = "page", // ✅ 기본값
}: WindowProps) {
  const router = useRouter();
  const isModal = variant === "modal";

  return (
    <section
      className={`
        relative font-neo
        ${isModal ? "" : "min-h-screen py-12 px-5"}
        drop-shadow-[0_0_14px_rgba(108,173,247,0.55)]
      `}
    >
      {/* ✅ 페이지에서만 배경 */}
      {!isModal && (
        <div className="absolute inset-0 bg-[url('/assets/background/common.png')] bg-cover bg-center bg-no-repeat opacity-15 -z-10" />
      )}

      <div
        className={`
          ${isModal ? "w-[420px]" : "max-w-[1400px] w-full"}
          m-auto
          border border-[var(--color-navy)]
          ${className}
        `}
      >
        {/* 핑크색 타이틀바 */}
        <div className="window-header bg-[var(--color-pink)] flex items-center justify-between px-4 py-3">
          {/* 좌측 아이콘 */}
          <button
            className="window-icon"
            onClick={isModal ? undefined : () => router.back()}
          >
            <Image src={windowClose} alt="" />
          </button>

          {/* 중앙 타이틀 */}
          <h2 className="text-black font-neo text-xl">{title}</h2>

          {/* 우측 아이콘 */}
          <div className="flex gap-2">
            {showMaximize && !isModal && (
              <button className="window-btn">
                <Image src={windowMaximize} alt="" />
              </button>
            )}
          </div>
        </div>

        {/* 컨텐츠 영역 */}
        <div
          className={`
            window-content relative 
            bg-[var(--color-dark-blue)]
            flex flex-col items-center justify-center gap-8
            ${isModal
              ? "p-6"
              : "py-15 px-8 min-h-[800px] lg:max-h-[800px]"}
          `}
        >
          {/* ✅ 페이지에서만 뒤로가기 */}
          {!isModal && (
            <Image
              src={back}
              alt="뒤로가기"
              className="absolute left-5 top-5 cursor-pointer"
              onClick={() => router.back()}
            />
          )}

          {children}
        </div>
      </div>
    </section>
  );
}
