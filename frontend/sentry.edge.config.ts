// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 성능 모니터링 비활성화 (로그 스팸 방지)
  // tracesSampleRate: 0, // 원본: 1
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
  // sendDefaultPii: true, // Enable sending user PII
});

