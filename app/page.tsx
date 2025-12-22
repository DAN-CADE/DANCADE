"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import logo from "@/public/assets/logos/logo.svg";
import Window from "@/components/common/Window";
import {
  generateGuestId,
  generateGuestNickname,
} from "@/lib/utils/guestNickname";

export default function Home() {
  const router = useRouter();

  const LOGIN_BUTTONS = [
    {
      id: "email",
      label: "아이디 로그인",
      style: "bg-[var(--color-cyan)]",
      type: "email" as const,
    },
    {
      id: "guest",
      label: "게스트 로그인",
      style: "border border-[var(--color-cyan)]",
      type: "guest" as const,
    },
  ] as const;

  const handleLogin = (type: "email" | "guest") => {
    switch (type) {
      case "email":
        router.push("/auth/login/id");
        break;
      case "guest":
        // 기존 게스트 정보가 있는지 확인
        const existingUserData = localStorage.getItem("user");
        let guestData;

        if (existingUserData) {
          try {
            const parsedData = JSON.parse(existingUserData);
            if (parsedData.isGuest) {
              // 기존 게스트 정보 재사용
              guestData = parsedData;
              console.log(
                `기존 게스트로 로그인 - 닉네임: ${parsedData.nickname}`
              );
            } else {
              // 기존 데이터가 게스트가 아닌 경우 새로 생성
              throw new Error("Not a guest user");
            }
          } catch {
            // 파싱 오류 또는 게스트가 아닌 경우 새로 생성
            guestData = null;
          }
        }

        if (!guestData) {
          // 새로운 게스트 정보 생성
          const guestId = generateGuestId();
          const nickname = generateGuestNickname();

          guestData = {
            userId: guestId,
            nickname: nickname,
            isGuest: true,
            createdAt: new Date().toISOString(),
          };

          console.log(`새 게스트 생성 - ID: ${guestId}, 닉네임: ${nickname}`);
        }

        // localStorage에 게스트 정보 저장
        localStorage.setItem("user", JSON.stringify(guestData));

        // 캐릭터 선택창으로 이동
        router.push("/character-select");
        break;
    }
  };

  return (
    <main className="login-page relative min-h-screen">
      <div className="absolute inset-0 bg-[url('/assets/background/common.png')] bg-cover bg-center bg-no-repeat opacity-15 -z-10" />
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
    </main>
  );
}
