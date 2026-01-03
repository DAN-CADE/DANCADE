// components/common/ToastContainer.tsx
"use client";

import { Toast } from "./toast";

export default function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-8 right-8 z-[9999] flex flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            px-4 py-3 rounded-md text-sm shadow-lg
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
