# 테스트 가이드

이 프로젝트는 포괄적인 테스트 환경을 제공합니다.

## 테스트 구조

```
tests/
├── unit/           # 단위 테스트
├── integration/   # 통합 테스트  
├── e2e/           # E2E 테스트
├── mocks/         # Mock 설정
├── fixtures/      # 테스트용 파일들
└── setup.ts       # 테스트 설정
```

## 테스트 실행

### 모든 테스트 실행
```bash
pnpm test
```

### 단위 테스트만 실행
```bash
pnpm test tests/unit
```

### 통합 테스트만 실행
```bash
pnpm test tests/integration
```

### E2E 테스트 실행
```bash
pnpm test:e2e
```

### 테스트 UI 실행
```bash
pnpm test:ui
```

### 커버리지 리포트 생성
```bash
pnpm coverage
```

## 테스트 작성 가이드

### 1. 단위 테스트 (Unit Tests)
- 개별 함수나 컴포넌트를 독립적으로 테스트
- Mock을 사용하여 외부 의존성 제거
- 빠른 실행과 명확한 실패 원인 파악

### 2. 통합 테스트 (Integration Tests)
- 여러 컴포넌트나 모듈 간의 상호작용 테스트
- API 호출과 상태 관리 포함
- MSW를 사용한 API 모킹

### 3. E2E 테스트 (End-to-End Tests)
- 실제 사용자 시나리오 테스트
- Playwright를 사용한 브라우저 자동화
- 핵심 사용자 플로우 검증

## 테스트 작성 모범 사례

### 1. 테스트 명명 규칙
- `describe`: 테스트 대상 설명
- `it`: 구체적인 테스트 케이스 설명
- 한국어로 명확하고 구체적으로 작성

### 2. 테스트 구조 (AAA 패턴)
```typescript
it('should do something when condition is met', () => {
  // Arrange: 테스트 데이터 준비
  const input = 'test data'
  
  // Act: 테스트 대상 실행
  const result = functionUnderTest(input)
  
  // Assert: 결과 검증
  expect(result).toBe('expected result')
})
```

### 3. Mock 사용
- 외부 의존성은 Mock으로 대체
- MSW를 사용한 API 모킹
- vi.fn()을 사용한 함수 모킹

### 4. 비동기 테스트
- `waitFor`를 사용한 비동기 상태 대기
- `userEvent`를 사용한 사용자 상호작용 시뮬레이션

## 테스트 커버리지 목표

- **단위 테스트**: 80% 이상
- **통합 테스트**: 핵심 기능 100%
- **E2E 테스트**: 주요 사용자 플로우 100%

## 디버깅 팁

### 테스트 실패 시
1. 에러 메시지와 스택 트레이스 확인
2. `console.log` 추가하여 중간 상태 확인
3. `test.only()`를 사용하여 특정 테스트만 실행

### 성능 최적화
1. 불필요한 테스트 제거
2. 병렬 실행 활용
3. Mock 사용으로 외부 의존성 제거
