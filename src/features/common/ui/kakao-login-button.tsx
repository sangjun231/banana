"use client";

import { useRouter } from "next/navigation";
import { RiKakaoTalkFill } from "react-icons/ri";
import { Button } from "@/components/ui/button";

interface KakaoLoginButtonProps {
  next: string;
}

function KakaoLoginButton({ next }: KakaoLoginButtonProps) {
  const router = useRouter();

  const logInStartWithProvider = (
    provider: string = "kakao",
    next: string = "/",
  ): void => {
    const url = `/api/auth/provider?provider=${provider}&next=${next}`;
    router.push(url);
  };

  return (
    <Button
      className="cursor-pointer"
      onClick={() => logInStartWithProvider("kakao", next)}
    >
      <RiKakaoTalkFill />
      <span>카카오로 시작하기</span>
    </Button>
  );
}

export default KakaoLoginButton;
