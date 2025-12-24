"use client";

interface TransparentFrameProps {
  children: React.ReactNode;
  className?: string;
}

export default function TransparentFrame({
  children,
  className = "",
}: TransparentFrameProps) {
  return (
    <section className="relative min-h-screen py-12 px-5 font-neo">
      <div className="absolute inset-0 bg-[url('/assets/background/common.png')] bg-cover bg-center bg-no-repeat opacity-15 -z-10" />

      {/* 중앙 투명 프레임 */}
      <div
        className={`relative max-w-[1400px] w-full mx-auto min-h-[800px] ${className}`}
      >
        {children}
      </div>
    </section>
  );
}
