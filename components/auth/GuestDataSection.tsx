// components/auth/GuestDataSection.tsx
// 게스트 데이터 불러오기 섹션 컴포넌트

interface GuestDataSectionProps {
  hasGuestData: boolean;
  guestDataSelected: boolean;
  shouldLoadGuestData: boolean;
  guestNickname: string;
  guestPoints: number;
  onSelectLoadData: (load: boolean) => void;
  onReselect: () => void;
}

/**
 * 게스트 데이터 불러오기 UI
 * - 불러오기/아니요 선택
 * - 선택 완료 후 확인 메시지
 */
export function GuestDataSection({
  hasGuestData,
  guestDataSelected,
  shouldLoadGuestData,
  guestNickname,
  guestPoints,
  onSelectLoadData,
  onReselect,
}: GuestDataSectionProps) {
  if (!hasGuestData) return null;

  // 아직 선택하지 않은 상태
  if (!guestDataSelected) {
    return (
      <div className="bg-[var(--color-pink)]/10 border-2 border-[var(--color-pink)]/60 rounded-lg px-5 py-4 mb-6">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm text-[var(--color-pink)] font-bold mb-2">
              ✨ 게스트 데이터 불러오기
            </p>
            {guestPoints > 0 && (
              <p className="text-sm text-[var(--color-navy)]">
                <span className="font-bold">{guestNickname}</span>
                <span className="mx-2 text-[var(--color-pink)]">•</span>
                <span className="font-bold text-[var(--color-pink)]">
                  {guestPoints}P
                </span>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <GuestDataButton
              selected={!shouldLoadGuestData}
              onClick={() => onSelectLoadData(false)}
            >
              아니요
            </GuestDataButton>
            <GuestDataButton
              selected={shouldLoadGuestData}
              onClick={() => onSelectLoadData(true)}
            >
              불러오기
            </GuestDataButton>
          </div>
        </div>
      </div>
    );
  }

  // 선택 완료 상태
  return (
    <div className="bg-green-100 border-2 border-green-500 rounded-lg px-5 py-4 mb-6">
      <div className="flex flex-col gap-3 items-center">
        <p className="text-sm text-green-700 font-bold text-center">
          ✓{" "}
          {shouldLoadGuestData
            ? "게스트 정보가 적용되었습니다"
            : "새로운 계정으로 진행합니다"}
        </p>
        <button
          type="button"
          onClick={onReselect}
          className="text-sm text-green-700 font-bold underline hover:text-green-900 transition-colors"
        >
          다시 선택하기
        </button>
      </div>
    </div>
  );
}

// 내부 버튼 컴포넌트
function GuestDataButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 px-4 py-2 font-bold rounded-lg text-sm transition-all duration-200 ${
        selected
          ? "bg-[var(--color-pink)] text-white shadow-lg hover:shadow-xl hover:translate-y-[-2px]"
          : "bg-[var(--color-pink)]/20 text-[var(--color-pink)] hover:bg-[var(--color-pink)]/30"
      }`}
    >
      {children}
    </button>
  );
}
