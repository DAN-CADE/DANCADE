interface SelectButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  size?: "sm" | "md"; // 크기 선택
}

/**
 * 버튼 그룹 컴포넌트 - 옵션 버튼들을 배치
 */
export function ButtonGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2.5">{children}</div>;
}

export function SelectButton({
  active,
  onClick,
  children,
  size = "md",
}: SelectButtonProps) {
  const sizeClasses =
    size === "sm" ? "px-2 py-2 text-xs" : "px-5 py-2.5 text-sm";

  return (
    <button
      onClick={onClick}
      className={`
        ${sizeClasses}
        inline-flex justify-center
        rounded cursor-pointer transition-all border-2
        ${
          active
            ? "font-medium bg-[#ffff00] text-black border-[#ffff00]"
            : "font-normal bg-[#444] text-white border-[#666]"
        }
      `}
    >
      {children}
    </button>
  );
}

/**
 * 액션 버튼 컴포넌트 - 주요 액션 버튼 (랜덤, 게임 시작 등)
 */
export function ActionButton({
  onClick,
  children,
  className,
}: {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      className={`px-6 py-3 text-lg font-bold border-none rounded-lg cursor-pointer ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
