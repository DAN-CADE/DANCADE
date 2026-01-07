// components/common/ToastContainer.tsx
"use client";

import { Toast } from "../../game/types/toast";

export default function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-8 right-8 z-[9999] flex flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
                min-w-[360px]          /* ✅ 가로 크기 */
                px-6 py-4              /* ✅ 패딩 키움 */
                rounded-lg
                text-base              /* ✅ 글자 크기 */
                font-medium
                shadow-[0_0_18px_rgba(0,255,220,0.35)]
                transition-all
            ${
              toast.type === "success" &&
              "bg-teal-400 text-black"
            }
            ${
              toast.type === "error" &&
              "bg-red-500 text-white"
            }
            ${
              toast.type === "info" &&
              "bg-black/80 text-white border border-white/30"
            }
          `}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
