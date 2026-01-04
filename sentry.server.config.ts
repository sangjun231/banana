// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 성능 모니터링 설정
  // tracesSampleRate: 0, // 로그 스팸 방지 (원본: 1)
  // 원본 (Wizard 기본값):
  // tracesSampleRate: 1,

  // 성능 모니터링 설정 (추가)
  // 개발 환경에서는 낮은 샘플링, 프로덕션에서는 더 높은 샘플링 사용 가능
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0, // 프로덕션: 10%, 개발: 100%

  // 디버그 모드 비활성화
  debug: false,

  // 환경 설정
  environment: process.env.NODE_ENV,

  // 원본 (Wizard 기본값):
  // sendDefaultPii: true, // Enable sending user PII (Personally Identifiable Information)

  // 서버 에러 필터링 (커스텀 추가)
  beforeSend(event, hint) {
    // 개발 환경에서는 터미널에도 출력
    if (process.env.NODE_ENV === "development") {
      console.error(
        "Sentry Server Error:",
        hint.originalException || hint.syntheticException
      );
    }
    return event;
  },
});
