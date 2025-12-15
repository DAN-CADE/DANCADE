/**
 * 에러 화면 컴포넌트
 */
export function ErrorScreen({ error }: { error: Error | null }) {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-[#1a1a1a] text-white gap-2.5">
      <p>데이터 로드에 실패했습니다.</p>
      {error && <p style={{ color: "#ff6b6b" }}>{error.message}</p>}
    </div>
  );
}
