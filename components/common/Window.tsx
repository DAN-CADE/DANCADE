// 공통 윈도우 디자인 창

import Image from "next/image";
import windowClose from "@/public/assets/icons/window-close.svg";
import windowMaximize from "@/public/assets/icons/window-maximize.svg";

interface WindowProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  showMaximize?: boolean;
}

export default function Window({
  title,
  children,
  className = "",
  showMaximize = true,
}: WindowProps) {
  return (
    <section className="drop-shadow-[0_0_14px_rgba(108,173,247,0.55)]">
      <div
        className={`w-[1400px] m-auto border border-[var(--color-navy)] ${className}`}
      >
        {/* 핑크색 타이틀바 */}
        <div className="window-header bg-[var(--color-pink)] flex items-center justify-between px-4 py-3">
          {/* 좌측 아이콘 */}
          <button className="window-icon">
            <Image src={windowClose} alt="" />
          </button>

          {/* 중앙 타이틀 */}
          <h2 className="text-black font-pixel text-2xl">{title}</h2>

          {/* 우측 아이콘 */}
          <div className="flex gap-2">
            {showMaximize && (
              <button className="window-btn">
                <Image src={windowMaximize} alt="" />
              </button>
            )}
          </div>
        </div>

        {/* 컨텐츠 영역 */}
        <div className="window-content bg-[var(--color-dark-blue)] p-8 h-full min-h-[800px] flex flex-col items-center justify-center gap-8">
          {children}
        </div>
      </div>
    </section>
  );
}
