## Next.js Instrumentation 정리

### 📌 Instrumentation이란?

**Instrumentation**은 Next.js 13.2부터 도입된 기능으로, 앱이 **시작될 때 딱 한 번** 실행되는 초기화 코드를 위한 특별한 파일입니다.

```typescript
// app/instrumentation.ts 또는 src/instrumentation.ts
export async function register() {
  // 서버가 부팅될 때 실행되는 코드
  console.log('Next.js 앱이 시작됩니다!');
}
```

### 🎯 주요 특징

1. **실행 시점**
    
    - 서버가 처음 시작될 때
    - Cold start 시 (서버리스 환경)
    - 모든 환경(Node.js, Edge, Client)에서 각각 한 번씩
2. **실행 환경 구분**
    
    ```typescript
    export async function register() {
      // 서버 사이드 (Node.js)
      if (process.env.NEXT_RUNTIME === 'nodejs') {
        console.log('Node.js 서버 시작!');
      }
      
      // Edge Runtime (Middleware, Edge API)
      if (process.env.NEXT_RUNTIME === 'edge') {
        console.log('Edge Runtime 시작!');
      }
    }
    ```
    
3. **클라이언트 사이드 분리**
    
    ```typescript
    // instrumentation.ts - 서버용
    // instrumentation-client.ts - 브라우저용 (별도 파일!)
    ```
    

### 💡 활용 사례

#### 1. **모니터링 도구 초기화** (가장 일반적)

```typescript
// instrumentation.ts
import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      // Node.js 특화 설정
    });
  }
}
```

#### 2. **데이터베이스 연결 풀 설정**

```typescript
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // 글로벌 Prisma 인스턴스 생성
    globalThis.prisma = new PrismaClient();
    await globalThis.prisma.$connect();
    console.log('DB 연결 완료');
  }
}
```

#### 3. **OpenTelemetry 설정**

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const sdk = new NodeSDK({
      serviceName: 'my-nextjs-app',
      // 트레이싱 설정
    });
    
    sdk.start();
  }
}
```

#### 4. **환경 변수 검증**

```typescript
export async function register() {
  const requiredEnvVars = [
    'DATABASE_URL',
    'API_SECRET_KEY',
    'REDIS_URL'
  ];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`필수 환경 변수 누락: ${envVar}`);
    }
  }
  
  console.log('✅ 환경 변수 검증 완료');
}
```

### ⚙️ 설정 방법

1. **next.config.js에서 활성화**

```javascript
// next.config.js
module.exports = {
  experimental: {
    instrumentationHook: true, // 활성화!
  },
};
```

2. **파일 생성 위치**

```
프로젝트/
├── app/
│   └── instrumentation.ts        // App Router
├── src/
│   ├── instrumentation.ts        // 서버/Edge
│   └── instrumentation-client.ts // 클라이언트
└── instrumentation.ts            // Pages Router
```

### 🔍 일반 초기화와의 차이

#### ❌ 기존 방법의 문제점

```typescript
// app/layout.tsx
import { initSentry } from './sentry';

// 문제: 모든 요청마다 실행됨!
initSentry();

export default function RootLayout() {
  // ...
}
```

#### ✅ Instrumentation 장점

```typescript
// instrumentation.ts
export async function register() {
  // 서버 생명주기당 한 번만 실행!
  await initSentry();
  await connectDatabase();
  await warmupCache();
}
```

### 📊 실행 흐름 다이어그램

```
서버 시작
    ↓
instrumentation.ts register() 실행
    ↓
런타임 체크 (nodejs/edge)
    ↓
해당 환경 초기화 코드 실행
    ↓
서버 준비 완료
    ↓
요청 처리 시작

브라우저 로드
    ↓
instrumentation-client.ts 실행
    ↓
클라이언트 초기화
```

### 🚀 실전 팁

1. **무거운 작업은 비동기로**

```typescript
export async function register() {
  // 병렬 처리로 부팅 시간 단축
  await Promise.all([
    initDatabase(),
    initCache(),
    initMonitoring(),
  ]);
}
```

2. **에러 처리 필수**

```typescript
export async function register() {
  try {
    await riskyInitialization();
  } catch (error) {
    console.error('초기화 실패:', error);
    // 앱이 시작되지 않도록 할 수도 있음
    process.exit(1);
  }
}
```

3. **개발/프로덕션 분기**

```typescript
export async function register() {
  if (process.env.NODE_ENV === 'development') {
    // 개발 전용 도구
    const { setupDevTools } = await import('./dev-tools');
    setupDevTools();
  }
}
```