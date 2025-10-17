// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 성능 모니터링 비활성화 (로그 스팸 방지)
  tracesSampleRate: 0, // 원본: 1
  // 원본 (Wizard 기본값):
  // tracesSampleRate: 1,

  // 디버그 모드 비활성화
  debug: false,

  // 환경 설정
  environment: process.env.NODE_ENV,

  // 원본 (Wizard 기본값):
  // sendDefaultPii: true, // Enable sending user PII

  // 클라이언트 에러 필터링 (커스텀 추가)
  beforeSend(event, hint) {
    // 개발 환경에서는 콘솔에도 출력
    console.error(
      "Sentry Client Error:",
      hint.originalException || hint.syntheticException,
    );
    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
