# Turbopack 간접 의존성 경고와 해결법

## 문제 상황 타임라인

### 1️⃣ 초기 상황

**프로젝트 환경:**

- Next.js 15.5.4 + Turbopack
- Sentry + OpenTelemetry 설정 완료
- 개발 서버 실행 중

### 2️⃣ 경고 발생

```bash
⚠ ./node_modules/.pnpm/@opentelemetry+instrumentation@0.204.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/instrumentation/build/esm/platform/node
Package require-in-the-middle can't be external
The request require-in-the-middle matches serverExternalPackages (or the default list).
The request could not be resolved by Node.js from the project directory.
Packages that should be external need to be installed in the project directory, so they can be resolved from the output files.
Try to install it into the project directory by running npm install require-in-the-middle from the project directory.
```

### 3️⃣ 문제 파악

- `import-in-the-middle`, `require-in-the-middle` 패키지가 문제
- 직접 설치한 패키지가 아닌 **간접 의존성**
- Sentry와 OpenTelemetry가 내부적으로 사용

## 문제 발생 원인

### 의존성 구조 분석

```
your-project/
├── package.json (직접 의존성)
│   ├── @sentry/nextjs
│   └── @opentelemetry/instrumentation
│
└── node_modules/ (설치된 패키지들)
    ├── @sentry/
    │   └── (내부 어딘가)/
    │       └── node_modules/
    │           └── import-in-the-middle/  ← 간접 의존성!
    │
    └── @opentelemetry/
        └── (내부 어딘가)/
            └── node_modules/
                └── require-in-the-middle/  ← 간접 의존성!
```

### Turbopack의 동작 원리

1. **번들링 시도**: Turbopack이 코드를 번들링하려 함
2. **External 판단**: 특정 패키지를 "external"로 처리하기로 결정
3. **경로 확인**: 프로젝트 루트 (`/your-project/node_modules/`)에서 패키지 찾기 시도
4. **실패**: 간접 의존성이라 루트에 없음 → ⚠️ 경고!

### 왜 이 패키지들이 문제인가?

```javascript
// import-in-the-middle과 require-in-the-middle의 역할
// Node.js의 모듈 로딩 시스템을 가로채서(hook) 
// 런타임에 코드를 주입하는 특수한 패키지들

// Sentry/OpenTelemetry가 이걸 사용하는 이유:
// → 자동으로 에러 추적, 성능 모니터링 코드를 주입하기 위해
```

## 해결 방법

### next.config.ts 수정

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  // OpenTelemetry instrumentation이 사용하는 패키지들을 external로 처리
  // 이 패키지들은 Sentry와 OpenTelemetry의 의존성으로 사용되며,
  // Node.js 런타임에서 모듈을 동적으로 instrument하기 위해 필요합니다.
  serverExternalPackages: [
    "import-in-the-middle",
    "require-in-the-middle",
  ],
};

export default nextConfig;
```

## 해결 원리 이해하기

### serverExternalPackages가 하는 일

```javascript
// Before: Turbopack의 기본 동작
{
  번들링_시도: true,
  프로젝트_루트에서_찾기: true,  // 실패! → 경고
  런타임_동작: "Node.js가 알아서 찾음"  // 정상 작동
}

// After: serverExternalPackages 설정 후
{
  번들링_시도: false,  // 아예 시도 안 함!
  프로젝트_루트에서_찾기: false,  // 확인할 필요 없음
  런타임_동작: "Node.js가 알아서 찾음"  // 정상 작동
}
```

### Node.js 모듈 해석 알고리즘

```javascript
// require('import-in-the-middle') 호출 시 Node.js의 탐색 순서:
[
  '/your-project/node_modules/import-in-the-middle',  // ❌ 없음
  '/your-project/node_modules/@sentry/.../node_modules/import-in-the-middle',  // ✅ 찾음!
  // 상위 디렉토리로 계속 올라가며 탐색...
]
```

## 핵심 개념 정리

### External Package란?

- **번들에 포함 안 함**: 빌드 결과물에 패키지 코드를 넣지 않음
- **런타임 로드**: 실행 시점에 `require()`로 동적 로드
- **용도**: Native 모듈, Node.js 특화 기능, 큰 바이너리 파일 등

### 간접 의존성 (Transitive Dependencies)

- **정의**: 내가 설치한 패키지가 의존하는 다른 패키지
- **위치**: 중첩된 node_modules 폴더에 존재
- **문제점**: 번들러가 찾기 어려울 수 있음

## 📚 기억해 둘 것!

### 🚨 경고 신호 인식하기

다음 패턴을 보면 즉시 간접 의존성 문제 의심:

```
⚠ Package [패키지명] can't be external
The request could not be resolved by Node.js from the project directory.
```

### 🔍 문제 패키지 유형

**1. Instrumentation/Monitoring 도구**

```typescript
serverExternalPackages: [
  // APM, 모니터링
  "import-in-the-middle",
  "require-in-the-middle", 
  "dd-trace",
  "elastic-apm-node",
  "@newrelic/native-metrics"
]
```

**2. Native 바인딩 패키지**

```typescript
serverExternalPackages: [
  // 이미지, 암호화, 캔버스
  "sharp",
  "bcrypt", 
  "canvas",
  "node-gyp"
]
```

**3. Database 드라이버**

```typescript
serverExternalPackages: [
  // DB 관련
  "@prisma/engines",
  "pg-native",
  "oracledb"
]
```

### 🛠 디버깅 명령어

```bash
# 1. 패키지가 어디서 오는지 확인 (pnpm)
pnpm why [패키지명]

# 2. 의존성 트리 확인
pnpm list --depth=3 | grep [패키지명]

# 3. node_modules 구조 직접 확인
find node_modules -name "[패키지명]" -type d
```

### ✅ 프로-액티브하게 해결하기

```typescript
// next.config.ts - 종합 템플릿
import { NextConfig } from 'next';

// 프로젝트 시작 시 미리 설정해두면 좋은 패키지들
const commonExternalPackages = [
  // === Instrumentation ===
  "import-in-the-middle",
  "require-in-the-middle",
  
  // === Native Modules ===
  "sharp",
  "canvas", 
  "bcrypt",
  
  // === Database ===
  "@prisma/engines",
  "pg-native",
  
  // === Monitoring ===
  "dd-trace",
  "pino-pretty",
  
  // === 프로젝트별 추가 ===
  // ...여기에 프로젝트 특수 패키지 추가
];

const nextConfig: NextConfig = {
  serverExternalPackages: process.env.NODE_ENV === 'development' 
    ? commonExternalPackages 
    : commonExternalPackages.filter(pkg => 
        // 프로덕션에서는 필요한 것만
        !pkg.includes('pretty')
      ),
};

export default nextConfig;
```

## 핵심 교훈

> **"Turbopack은 Webpack보다 엄격하다"**
> 
> - Webpack: 암묵적으로 많은 것을 처리
> - Turbopack: 명시적 선언 필요

> **"간접 의존성은 숨어있다"**
> 
> - 직접 설치하지 않은 패키지도 문제를 일으킬 수 있음
> - 특히 Native 모듈, Instrumentation 도구 주의

> **"경고는 무시하지 말자"**
> 
> - 당장은 작동해도 프로덕션 빌드에서 문제될 수 있음
> - 개발 환경을 깨끗하게 유지하는 것이 중요

## 📎 참고 자료

- [Next.js serverExternalPackages 문서](https://nextjs.org/docs/app/api-reference/next-config-js/serverExternalPackages)
- [Turbopack 공식 문서](https://turbo.build/pack/docs)
- [Node.js 모듈 해석 알고리즘](https://nodejs.org/api/modules.html#modules_all_together)

---

💡 **Quick Fix 요약**

```typescript
// 문제 발생 시 즉시 적용:
// 1. 경고 메시지에서 패키지명 확인
// 2. next.config.ts에 추가
serverExternalPackages: ["문제의-패키지-이름"]
// 3. 개발 서버 재시작
```