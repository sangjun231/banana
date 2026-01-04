"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/features/auth";

export default function Home() {
  const { user, logOut } = useAuth();

  const handleLogout = () => {
    logOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-4xl text-gray-800">인생네컷 AI 🎨</h1>
            <p className="mt-2 text-gray-600">
              AI로 특별한 순간을 포트레이트로 만들어보세요
            </p>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <p className="text-gray-600 text-sm">{user.email}</p>
                <Button variant="outline" type="button" onClick={handleLogout}>
                  로그아웃
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button>로그인</Button>
              </Link>
            )}
          </div>
        </header>

        {/* Main Content */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* 인생네컷 카드 */}
          <Link
            href="/four-cut"
            className="transition-transform hover:scale-105"
          >
            <Card className="h-full border-2 border-purple-200 bg-gradient-to-br from-purple-100 to-pink-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  📸 인생네컷
                </CardTitle>
                <CardDescription>
                  4컷 스타일의 포트레이트를 생성하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  사진을 업로드하고 원하는 분위기를 선택하면 AI가 멋진 인생네컷
                  스타일 포트레이트를 만들어드립니다.
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* 포트레이트 카드 (준비중) */}
          <Link href="/sentry-example-page">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  🎭 공식 sentry
                </CardTitle>
                <CardDescription>원본 상태</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  프론트엔드, api에러 sentry 로그 확인
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* 웨딩 사진 카드 (준비중) */}
          <Link href="/test-sentry">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  💒 임의 sentry
                </CardTitle>
                <CardDescription>sentry 대쉬보드 기록 가능</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  클라이언트, 서버 테스트에러로 sentry 로그 확인
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Works (스켈레톤) */}
        <div className="mt-12">
          <h2 className="mb-6 font-bold text-2xl text-gray-800">최근 작업</h2>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-200"></div>
                <CardContent className="pt-4">
                  <div className="h-4 w-3/4 rounded bg-gray-200"></div>
                  <div className="mt-2 h-3 w-1/2 rounded bg-gray-200"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
