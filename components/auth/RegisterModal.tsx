"use client";

import React from "react";
import Window from "@/components/common/Window";
import RegisterForm from "@/components/auth/RegisterForm";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RegisterModal({
  isOpen,
  onClose,
  onSuccess,
}: RegisterModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-[540px]">
        <Window
          title="SIGNUP"
          variant="modal"
          onClose={onClose}
          className="bg-[var(--color-white)]"
          showMaximize={false}
        >
          <div className="w-full bg-[var(--color-white)] p-6">
            <RegisterForm onSuccess={onSuccess} onCancel={onClose} isModal />
          </div>
        </Window>
      </div>
    </div>
  );
}
