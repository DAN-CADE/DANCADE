/**
 * 섹션 컴포넌트 - 각 커스터마이징 옵션을 감싸는 컨테이너
 */
export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-[30px]">
      <h3 className="text-lg mb-[15px] text-[#ffff00]">{title}</h3>
      {children}
    </div>
  );
}
