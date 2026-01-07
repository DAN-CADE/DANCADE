// app/auth/register/page.tsx
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import signupLogo from "@/public/assets/logos/signup-logo.svg";
import Window from "@/components/common/Window";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/character-select");
  };

  return (
    <main className="signup-page font-neo">
      <Window title="SIGNUP">
        <section className="signup-section flex flex-col justify-center items-center gap-12 w-full mb-9 px-4 lg:px-0">
          {/* 헤더 */}
          <header className="signup-header">
            <Image
              src={signupLogo}
              alt="DAN-CADE 회원가입 로고"
              className="w-[320px] lg:w-[340px] h-auto"
              priority
            />
          </header>

          {/* 회원가입 폼 */}
          <RegisterForm onSuccess={handleSuccess} />
        </section>
      </Window>
    </main>
  );
}
