"use client";

import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function TestSentryPage() {
  const handleClientError = async () => {
    console.log("클라이언트 에러 함수 호출됨");
    try {
      throw new Error("클라이언트 테스트 에러입니다!");
    } catch (error) {
      console.log("에러 캐치됨:", error);
      console.log("Sentry.captureException 호출 중...");

      const eventId = Sentry.captureException(error);
      console.log("Sentry Event ID:", eventId);
      console.log("Sentry DSN:", process.env.NEXT_PUBLIC_SENTRY_DSN);

      // Sentry 이벤트 강제 전송 (2초 타임아웃)
      console.log("Sentry 이벤트 전송 중...");
      try {
        const flushed = await Sentry.flush(2000);
        console.log("Sentry 이벤트 전송 결과:", flushed);
      } catch (err) {
        console.error("Sentry 이벤트 전송 실패:", err);
      }

      alert("클라이언트 에러가 Sentry로 전송되었습니다!");
    }
  };

  const handleServerError = async () => {
    try {
      const response = await fetch("/api/sentry/test-sentry");
      const data = await response.json();
      alert(data.message);
    } catch (error) {
      console.error("서버 에러 ====>", error);
      alert("서버 에러 발생!");
    }
  };

  const handleRealError = () => {
    // 실제 에러를 발생시켜 Sentry가 자동으로 캡처하는지 확인
    throw new Error("실제 처리되지 않은 에러입니다!");
  };

  const handleCustomContext = () => {
    Sentry.setUser({
      id: "test-user-123",
      email: "test@example.com",
      username: "테스트유저",
    });

    Sentry.setContext("test_info", {
      feature: "sentry-test",
      timestamp: new Date().toISOString(),
    });

    Sentry.setTag("test_type", "custom_context");

    Sentry.captureMessage("커스텀 컨텍스트 테스트", "info");
    alert("커스텀 컨텍스트와 함께 메시지가 전송되었습니다!");
  };

  const handleBreadcrumb = () => {
    Sentry.addBreadcrumb({
      category: "user_action",
      message: "사용자가 브레드크럼 테스트 버튼 클릭",
      level: "info",
    });

    Sentry.addBreadcrumb({
      category: "navigation",
      message: "테스트 페이지로 이동",
      level: "info",
    });

    Sentry.captureMessage("브레드크럼 테스트 (Slack에서 History 확인)", "info");
    alert(
      "브레드크럼과 함께 메시지가 전송되었습니다! Sentry에서 Breadcrumbs 탭을 확인하세요.",
    );
  };

  const handlePerformanceTest = async () => {
    // Sentry v10의 올바른 API 사용
    Sentry.startSpan(
      {
        name: "Test Performance Transaction",
        op: "test.performance",
      },
      async (span) => {
        try {
          // 가짜 비동기 작업 (1초 대기)
          await new Promise((resolve) => setTimeout(resolve, 1000));

          span.setStatus({ code: 0, message: "ok" });
          alert(
            "성능 모니터링 트랜잭션이 기록되었습니다! Sentry Performance 탭에서 확인하세요.",
          );
        } catch (error) {
          span.setStatus({ code: 2, message: "internal_error" });
          Sentry.captureException(error);
        }
      },
    );
  };

  return (
    <div className="container mx-auto max-w-4xl p-8">
      <h1 className="mb-6 font-bold text-3xl">Sentry 테스트 페이지</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>기본 에러 테스트</CardTitle>
            <CardDescription>
              Sentry로 에러를 전송하고 Slack 알림을 확인하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handleClientError}
              className="w-full"
              variant="default"
            >
              클라이언트 에러 발생
            </Button>
            <Button
              onClick={handleServerError}
              className="w-full"
              variant="secondary"
            >
              서버 에러 발생
            </Button>
            <Button
              onClick={handleRealError}
              className="w-full"
              variant="destructive"
            >
              실제 에러 발생 (처리 안됨)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>고급 기능 테스트</CardTitle>
            <CardDescription>
              컨텍스트, 브레드크럼, 성능 모니터링 테스트
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handleCustomContext}
              className="w-full"
              variant="outline"
            >
              커스텀 컨텍스트 테스트
            </Button>
            <Button
              onClick={handleBreadcrumb}
              className="w-full"
              variant="outline"
            >
              브레드크럼 테스트
            </Button>
            <Button
              onClick={handlePerformanceTest}
              className="w-full"
              variant="outline"
            >
              성능 모니터링 테스트
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>확인 사항</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-inside list-decimal space-y-2 text-muted-foreground text-sm">
            <li>버튼 클릭 후 Slack 채널에 알림이 오는지 확인</li>
            <li>Sentry 대시보드 → Issues에서 에러 확인</li>
            <li>
              에러 상세 페이지에서 스택 트레이스, 브레드크럼, 컨텍스트 확인
            </li>
            <li>Performance 탭에서 트랜잭션 확인</li>
            <li>Session Replay로 사용자 행동 재생 (활성화한 경우)</li>
          </ol>
        </CardContent>
      </Card>

      <Card className="mt-6 bg-blue-50 dark:bg-blue-950">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">
            💡 학습 팁
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-blue-800 text-sm dark:text-blue-200">
          <p>1. 각 버튼을 클릭할 때마다 Slack과 Sentry를 동시에 확인하세요</p>
          <p>
            2. 같은 에러를 여러 번 발생시켜 Sentry가 어떻게 그룹화하는지
            관찰하세요
          </p>
          <p>
            3. Sentry에서 에러를 Resolve 처리한 후, 다시 발생시켜 Regression
            알림을 확인하세요
          </p>
          <p>4. 브레드크럼으로 사용자의 행동 흐름을 추적하는 연습을 하세요</p>
        </CardContent>
      </Card>
    </div>
  );
}
