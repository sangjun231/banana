# Sentry 설정 가이드

## 1. Sentry 프로젝트 생성 및 DSN 가져오기

1. [https://sentry.io](https://sentry.io)에 로그인
2. **Projects** → **Create Project** 클릭
3. **Next.js** 플랫폼 선택
4. 프로젝트 이름 입력 후 생성
5. **DSN (Data Source Name)** 복사
   - 예: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`

## 2. 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 추가하세요:

```env
# Sentry - 필수
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# Sentry - 빌드/배포시 소스맵 업로드용 (선택)
SENTRY_ORG=your-organization-slug
SENTRY_PROJECT=your-project-slug
SENTRY_AUTH_TOKEN=your-auth-token
```

### 환경 변수 가져오기

- **DSN**: Sentry 프로젝트 → Settings → Client Keys (DSN)
- **ORG**: Sentry 조직명 (URL에서 확인: sentry.io/organizations/`org-slug`)
- **PROJECT**: 프로젝트 슬러그 (프로젝트 설정에서 확인)
- **AUTH_TOKEN**: Settings → Account → Auth Tokens → Create New Token
  - 권한: `project:releases`, `org:read`

## 3. Slack 연동 확인 및 설정

### 기존 연동 확인

1. Sentry 웹사이트 로그인
2. **Settings** → **Integrations** → **Slack** 클릭
3. 연결된 워크스페이스 확인

### 알림 규칙 설정

1. 프로젝트 → **Settings** → **Alerts** 클릭
2. **New Alert Rule** 생성:
   - **When**: `An event occurs` 또는 `An issue is first seen`
   - **Then**: `Send a notification via Slack`
   - **Channel**: 원하는 Slack 채널 선택

### 추천 알림 규칙 (학습용)

- ✅ **First seen**: 새로운 에러가 처음 발생했을 때
- ✅ **Regression**: 해결된 에러가 다시 발생했을 때
- ✅ **High volume**: 같은 에러가 짧은 시간에 많이 발생했을 때 (임계값: 10분에 10번)

## 4. Sentry 테스트

### 클라이언트 에러 테스트

페이지나 컴포넌트에 임시로 다음 코드 추가:

```tsx
import * as Sentry from "@sentry/nextjs";

// 버튼 클릭시 에러 발생
<button
  onClick={() => {
    Sentry.captureException(new Error("테스트 에러입니다!"));
  }}
>
  Sentry 테스트
</button>;
```

### 서버 에러 테스트

API Route에 추가:

```typescript
// app/api/test-sentry/route.ts
import * as Sentry from "@sentry/nextjs";

export async function GET() {
  Sentry.captureException(new Error("서버 테스트 에러"));
  return Response.json({ message: "Sentry 테스트 완료" });
}
```

### 실제 에러 테스트

```tsx
<button
  onClick={() => {
    throw new Error("의도적인 클라이언트 에러");
  }}
>
  실제 에러 발생
</button>
```

## 5. Sentry와 테스트 환경 통합

### Vitest 설정

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
  },
});
```

```typescript
// tests/setup.ts
import * as Sentry from "@sentry/nextjs";

// 테스트 환경에서 Sentry 비활성화
beforeAll(() => {
  Sentry.init({
    enabled: false, // 테스트시 Sentry 비활성화
  });
});
```

### Playwright E2E 테스트

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    // E2E 테스트시 실제 에러를 Sentry로 보내지 않도록
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL,
  },
  webServer: {
    env: {
      NEXT_PUBLIC_SENTRY_DSN: "", // E2E 테스트시 Sentry 비활성화
    },
  },
});
```

## 6. Sentry 활용 팁 (학습용)

### 커스텀 컨텍스트 추가

```typescript
import * as Sentry from "@sentry/nextjs";

// 사용자 정보 추가
Sentry.setUser({
  id: user.id,
  email: user.email,
});

// 추가 컨텍스트
Sentry.setContext("character", {
  type: "portrait",
  style: "anime",
});

// 태그 추가 (필터링 가능)
Sentry.setTag("page_locale", "ko");
```

### 브레드크럼 (사용자 행동 추적)

```typescript
Sentry.addBreadcrumb({
  category: "auth",
  message: "User logged in",
  level: "info",
});
```

### 성능 모니터링

```typescript
const transaction = Sentry.startTransaction({
  name: "Generate Portrait",
  op: "ai.generation",
});

try {
  // AI 작업 수행
  const result = await generatePortrait(image, prompt);
  transaction.setStatus("ok");
} catch (error) {
  transaction.setStatus("error");
  throw error;
} finally {
  transaction.finish();
}
```

### 에러 무시하기

```typescript
// sentry.client.config.ts
beforeSend(event, hint) {
  // 특정 에러 무시
  if (event.exception?.values?.[0]?.value?.includes("Network Error")) {
    return null; // 이벤트 전송 안함
  }
  return event;
}
```

## 7. 대시보드 활용

### Issues 페이지

- 발생한 모든 에러 확인
- 에러 빈도, 영향받은 사용자 수 확인
- 스택 트레이스로 원인 파악

### Performance 페이지

- 페이지 로딩 속도
- API 응답 시간
- 느린 트랜잭션 확인

### Releases 페이지

- 배포별 에러 추적
- 새 배포 후 에러 증가 여부 확인

## 8. 학습 목표 체크리스트

- [ ] Sentry 프로젝트 생성 및 DSN 설정
- [ ] Slack 연동 확인 및 알림 규칙 설정
- [ ] 클라이언트 에러 발생 및 Slack 알림 확인
- [ ] 서버 에러 발생 및 대시보드 확인
- [ ] Session Replay로 사용자 행동 재생
- [ ] 커스텀 컨텍스트 및 태그 활용
- [ ] 성능 모니터링 트랜잭션 생성
- [ ] 테스트 환경에서 Sentry 비활성화
- [ ] Release 생성 및 추적

## 9. 다음 단계

1. **Vitest 설치**: 유닛 테스트 환경 구축
2. **React Testing Library**: 통합 테스트 작성
3. **Playwright**: E2E 테스트 작성
4. **Sentry와 CI/CD 통합**: GitHub Actions에서 자동 릴리스 생성

## 참고 자료

- [Sentry Next.js 공식 문서](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Slack 연동](https://docs.sentry.io/product/integrations/notification-incidents/slack/)
- [Sentry 성능 모니터링](https://docs.sentry.io/product/performance/)
