# Next.js 15 테스트 환경 구축 가이드

## 0단계: 조합

- 유닛테스트: Vitest
- 통합테스트: React Testing Library + MSW
- E2E테스트: Playwright

## 1단계: 테스트 환경 구축

### 1️⃣ Vitest 설정 (유닛 테스트)

```bash
pnpm add -D vitest @vitejs/plugin-react jsdom
pnpm add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

**vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**tests/setup.ts**

```typescript
import '@testing-library/jest-dom'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})
```

### 2️⃣ MSW 설정 (API 모킹)

```bash
pnpm add -D msw@latest
```

**tests/mocks/handlers.ts**

```typescript
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.post('*/auth/v1/token*', () => {
    return HttpResponse.json({
      access_token: 'mock-token',
      user: { id: 'user-1', email: 'test@example.com' },
    })
  }),
]
```

**tests/mocks/server.ts**

```typescript
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

**tests/setup.ts에 추가**

```typescript
import { server } from './mocks/server'
import { beforeAll, afterAll, afterEach } from 'vitest'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

### 3️⃣ Playwright 설정 (E2E)

```bash
pnpm add -D @playwright/test
pnpm dlx playwright install
```

**playwright.config.ts**

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### 4️⃣ 디렉토리 구조

```
project/
├── tests/
│   ├── setup.ts
│   ├── mocks/
│   │   ├── handlers.ts
│   │   └── server.ts
│   ├── helpers/
│   │   └── test-utils.tsx
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── src/
│   └── app/
```

### 5️⃣ package.json 스크립트

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

## 2단계: TDD로 테스트 작성하기

### TDD 사이클

1. **Red**: 실패하는 테스트 작성
2. **Green**: 최소한의 코드로 테스트 통과
3. **Refactor**: 코드 개선

### 유닛 테스트 작성

**위치**: `tests/unit/` 또는 `src/**/__tests__/`

#### 예시 1: 유틸 함수

```typescript
// tests/unit/format-price.test.ts
import { describe, it, expect } from 'vitest'
import { formatPrice } from '@/lib/format-price'

describe('formatPrice', () => {
  it('숫자를 통화 형식으로 변환한다', () => {
    expect(formatPrice(10000)).toBe('10,000원')
  })

  it('0을 올바르게 처리한다', () => {
    expect(formatPrice(0)).toBe('0원')
  })
})
```

#### 예시 2: 컴포넌트

```typescript
// tests/unit/button.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('클릭 이벤트를 처리한다', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick}>클릭</Button>)
    await user.click(screen.getByRole('button'))
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('disabled 상태에서는 클릭이 동작하지 않는다', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick} disabled>클릭</Button>)
    await user.click(screen.getByRole('button'))
    
    expect(handleClick).not.toHaveBeenCalled()
  })
})
```

#### 예시 3: Next.js 컴포넌트 모킹

```typescript
// tests/unit/product-card.test.tsx
import { vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Next.js 모킹
vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>
}))

describe('ProductCard', () => {
  it('상품 정보를 렌더링한다', () => {
    const product = { id: '1', name: '상품', price: 10000 }
    render(<ProductCard product={product} />)
    
    expect(screen.getByText('상품')).toBeInTheDocument()
  })
})
```

**실행**:

```bash
pnpm test                          # 전체 테스트
pnpm test --watch                  # watch 모드
pnpm test tests/unit/button        # 특정 파일
```

### 통합 테스트 작성

**위치**: `tests/integration/`

#### 테스트 헬퍼 작성

```typescript
// tests/helpers/test-utils.tsx
import { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

export function renderWithProviders(ui: ReactElement) {
  const queryClient = createTestQueryClient()
  
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}
```

#### 예시: 로그인 폼 통합 테스트

```typescript
// tests/integration/login-form.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'
import { renderWithProviders } from '../helpers/test-utils'
import { LoginForm } from '@/components/auth/login-form'

describe('LoginForm 통합 테스트', () => {
  it('로그인에 성공한다', async () => {
    const onSuccess = vi.fn()
    const user = userEvent.setup()
    
    renderWithProviders(<LoginForm onSuccess={onSuccess} />)
    
    await user.type(screen.getByLabelText(/이메일/i), 'test@example.com')
    await user.type(screen.getByLabelText(/비밀번호/i), 'password123')
    await user.click(screen.getByRole('button', { name: /로그인/i }))
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('잘못된 credentials는 에러를 표시한다', async () => {
    server.use(
      http.post('*/auth/v1/token*', () => {
        return HttpResponse.json(
          { error: '인증 실패' },
          { status: 401 }
        )
      })
    )
    
    const user = userEvent.setup()
    renderWithProviders(<LoginForm />)
    
    await user.type(screen.getByLabelText(/이메일/i), 'wrong@example.com')
    await user.type(screen.getByLabelText(/비밀번호/i), 'wrong')
    await user.click(screen.getByRole('button', { name: /로그인/i }))
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('인증 실패')
    })
  })
})
```

**실행**:

```bash
pnpm test tests/integration
```

### E2E 테스트 작성

**위치**: `tests/e2e/`

#### 예시: 로그인 플로우

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('인증 플로우', () => {
  test('사용자가 로그인하고 대시보드로 이동한다', async ({ page }) => {
    // API 모킹
    await page.route('**/auth/v1/token**', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          access_token: 'token',
          user: { email: 'test@example.com' }
        })
      })
    })

    await page.goto('/login')
    
    await page.getByLabel('이메일').fill('test@example.com')
    await page.getByLabel('비밀번호').fill('password123')
    await page.getByRole('button', { name: '로그인' }).click()
    
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByText('test@example.com')).toBeVisible()
  })

  test('잘못된 credentials로는 로그인할 수 없다', async ({ page }) => {
    await page.route('**/auth/v1/token**', async route => {
      await route.fulfill({
        status: 401,
        body: JSON.stringify({ error: '인증 실패' })
      })
    })

    await page.goto('/login')
    
    await page.getByLabel('이메일').fill('wrong@example.com')
    await page.getByLabel('비밀번호').fill('wrong')
    await page.getByRole('button', { name: '로그인' }).click()
    
    await expect(page.getByRole('alert')).toContainText('인증 실패')
    await expect(page).toHaveURL('/login')
  })
})
```

**실행**:

```bash
pnpm test:e2e                    # 전체 E2E 테스트
pnpm test:e2e --headed           # 브라우저 보면서 실행
pnpm test:e2e --debug            # 디버그 모드
pnpm test:e2e --ui               # UI 모드
```

## 3단계: 테스트 실행과 유지보수

### 일상적인 워크플로우

**개발 중**:

```bash
pnpm test --watch                # 유닛/통합 테스트 watch
```

**커밋 전**:

```bash
pnpm test                        # 전체 유닛/통합 테스트
pnpm test:e2e                    # 주요 플로우 변경 시
```

**CI/CD**:

```bash
pnpm test:coverage               # 커버리지 리포트
pnpm test:e2e                    # 전체 E2E 테스트
```

### MSW 핸들러 관리

새로운 API 추가 시:

```typescript
// tests/mocks/handlers.ts
export const handlers = [
  // 기본 핸들러
  http.get('/api/users', () => {
    return HttpResponse.json({ users: [] })
  }),
]
```

특정 테스트에서 오버라이드:

```typescript
server.use(
  http.get('/api/users', () => {
    return HttpResponse.json({ users: [/* ... */] })
  })
)
```

### 커버리지 확인

```bash
pnpm test:coverage
```

- 수치보다는 **누락된 시나리오**에 집중
- 특히 에러 케이스, 경계 조건 확인

### 회귀 방지

버그 발견 시:

1. 버그를 재현하는 테스트 작성 (실패 확인)
2. 버그 수정
3. 테스트 통과 확인
4. 테스트를 코드베이스에 유지

### 테스트 작성 팁

- **유닛**: 순수 함수, 단일 컴포넌트
- **통합**: 여러 컴포넌트 + API 상호작용
- **E2E**: 실제 사용자 시나리오

**Given-When-Then 구조 활용**:

```typescript
it('사용자가 장바구니에 상품을 추가한다', async () => {
  // Given: 상품 페이지에서
  renderWithProviders(<ProductPage />)
  
  // When: 장바구니 버튼을 클릭하면
  await user.click(screen.getByRole('button', { name: '장바구니' }))
  
  // Then: 성공 메시지가 표시된다
  expect(screen.getByText('추가되었습니다')).toBeInTheDocument()
})
```

### 자주 하는 실수

❌ **너무 많은 것을 한 번에 테스트**

```typescript
// 나쁜 예
it('전체 앱이 동작한다', () => { /* ... */ })
```

✅ **작고 집중된 테스트**

```typescript
// 좋은 예
it('이메일 유효성 검사를 수행한다', () => { /* ... */ })
it('로그인 API를 호출한다', () => { /* ... */ })
```

❌ **구현 세부사항 테스트**

```typescript
// 나쁜 예
expect(component.state.isLoading).toBe(true)
```

✅ **사용자가 보는 것 테스트**

```typescript
// 좋은 예
expect(screen.getByText('로딩 중...')).toBeInTheDocument()
```

### 유용한 명령어 모음

```bash
# 특정 테스트만 실행
pnpm test button

# 변경된 파일만 테스트
pnpm test --changed

# 실패한 테스트만 재실행
pnpm test --reporter=verbose --bail=1

# Playwright 특정 브라우저
pnpm test:e2e --project=chromium

# Playwright 트레이스 보기
npx playwright show-trace trace.zip
```