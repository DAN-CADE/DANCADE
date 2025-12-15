// LPC 데이터 로딩 훅
import { LPC_ASSETS_PATH } from "@/constants/character";
import { LPCData } from "@/types/lpc";
import { useEffect, useState } from "react";

export function useLPCData() {
  const [lpcData, setLpcData] = useState<LPCData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch(LPC_ASSETS_PATH)
      .then((res) => {
        if (!res.ok) throw new Error("LPC를 가져오지 못했습니다.");
        return res.json();
      })
      .then((data: LPCData) => {
        setLpcData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("LPC 설정을 불러오지 못했습니다:", err);
        setError(err);
        setIsLoading(false);
      });
  }, []);

  return { lpcData, isLoading, error };
}
