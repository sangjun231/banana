This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Features

- 🎨 AI 포트레이트 생성 (Gemini API)
- 🔐 사용자 인증 (Supabase)
- 🐛 에러 모니터링 (Sentry + Slack 연동)
- 🧪 테스트 환경 (Vitest, React Testing Library, Playwright)

## Getting Started

### 1. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수를 추가하세요:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google AI (Gemini)
GOOGLE_AI_API_KEY=your_google_ai_api_key

# Sentry (필수)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn

# Sentry (소스맵 업로드용 - 선택)
SENTRY_ORG=your_org_slug
SENTRY_PROJECT=your_project_slug
SENTRY_AUTH_TOKEN=your_auth_token
```

**Sentry 설정 방법**: [SENTRY_SETUP.md](./SENTRY_SETUP.md) 참고

### 2. 개발 서버 실행

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Sentry 테스트

Sentry가 제대로 작동하는지 테스트하려면:

1. 개발 서버 실행 후 [http://localhost:3000/test-sentry](http://localhost:3000/test-sentry) 방문
2. 각 버튼을 클릭하여 에러 발생
3. Slack 채널과 Sentry 대시보드에서 알림 확인

자세한 사용법은 [SENTRY_SETUP.md](./SENTRY_SETUP.md)를 참고하세요.

## 테스트

### 유닛 테스트 및 통합 테스트

```bash
pnpm test
pnpm test:unit
pnpm test:integration
pnpm test:watch
pnpm test:ui
```

### E2E 테스트

```bash
pnpm test:e2e
pnpm test:e2e:ui
```

자세한 테스트 가이드는 [docs/how-to-test.md](./docs/how-to-test.md)를 참고하세요.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
