"use client";

import Image from "next/image";
import logo from "@/public/assets/logos/logo.svg";
import google from "@/public/assets/icons/google.svg";
import Window from "@/components/common/Window";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const LOGIN_BUTTONS = [
    {
      id: "email",
      label: "아이디 로그인",
      style: "bg-[var(--color-cyan)]",
      type: "email" as const,
    },
    {
      id: "google",
      label: "구글 로그인",
      style: "bg-[var(--color-blue)]",
      type: "google" as const,
    },
    {
      id: "guest",
      label: "게스트 로그인",
      style: "border border-[var(--color-cyan)]",
      type: "guest" as const,
    },
  ] as const;

  const handleLogin = (type: "email" | "google" | "guest") => {
    switch (type) {
      case "email":
        router.push("/login/id");
        return;
        break;
      case "google":
        console.log("구글 로그인");
        // 구글 OAuth 처리
        break;
      case "guest":
        console.log("게스트 로그인");
        // 게스트 로그인 처리
        break;
    }
  };

  return (
    <div className="login-page">
      <Window title="LOGIN">
        <Image src={logo} alt="DAN-CADE 로고" width={262} height={185} />
        <div className="text-black flex flex-col gap-4 w-full items-center">
          {LOGIN_BUTTONS.map((button) => (
            <button
              key={button.id}
              onClick={() => handleLogin(button.type)}
              className={`${
                button.style
              } py-5 max-w-[320px] w-full cursor-pointer ${
                button.type === "guest" ? "text-white" : ""
              } ${button.type === "google" ? "relative" : ""}`}
            >
              {button.type === "google" && (
                <span className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 inline-block bg-white rounded-md">
                  <Image src={google} alt="Google" width={24} height={24} />
                </span>
              )}
              {button.label}
            </button>
          ))}
        </div>
      </Window>
    </div>
  );
}
