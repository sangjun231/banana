## OpenTelemetry 가이드 🔍

### 📌 OpenTelemetry란?

**OpenTelemetry**(줄여서 OTel)는 앱의 **성능과 동작을 추적**하는 오픈소스 관측성(Observability) 프레임워크입니다. 
쉽게 말해, "내 앱이 어떻게 돌아가고 있는지" 실시간으로 X-ray 찍듯이 들여다보는 도구!

### 🎯 핵심 개념: 3대 Pillar

#### 1. **Traces (추적)**

사용자 요청이 시스템을 통과하는 전체 여정을 추적

```typescript
// 예: 사용자가 상품 구매 버튼 클릭
[브라우저] 2ms → [API Gateway] 10ms → [주문 서비스] 50ms → [결제 서비스] 200ms → [DB] 30ms      
총 소요 시간: 292ms
```

#### 2. **Metrics (지표)**

시스템 상태를 숫자로 측정

```typescript
// 예시 지표들
- 초당 요청 수: 1,234 req/s
- 평균 응답 시간: 145ms
- CPU 사용률: 67%
- 메모리 사용량: 2.3GB
- 에러율: 0.02%
```

#### 3. **Logs (로그)**

이벤트 기록 (하지만 구조화된 방식으로)

```typescript
{
  timestamp: "2024-01-20T10:30:45Z",
  level: "ERROR",
  traceId: "abc123",  // Trace와 연결!
  spanId: "def456",
  message: "Payment failed",
  userId: "user_789",
  amount: 50000
}
```

### 💡 실제 사용 예시

#### Next.js에서 OpenTelemetry 설정

```typescript
// instrumentation.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const sdk = new NodeSDK({
      // 서비스 정보
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'my-shop-frontend',
        [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
      }),
      
      // 자동 계측 (자동으로 추적!)
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': {
            enabled: false, // 파일 시스템은 제외
          },
        }),
      ],
    });

    sdk.start();
    console.log('OpenTelemetry 시작!');
  }
}
```

### 🔍 실전 활용: 전자상거래 시나리오

#### 1. **Distributed Tracing (분산 추적)**

```typescript
// API Route: app/api/checkout/route.ts
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('checkout-service');

export async function POST(request: Request) {
  // 전체 체크아웃 프로세스 추적 시작
  return tracer.startActiveSpan('checkout', async (span) => {
    try {
      // 1. 재고 확인
      await tracer.startActiveSpan('check-inventory', async (inventorySpan) => {
        const hasStock = await checkInventory(items);
        inventorySpan.setAttribute('items.count', items.length);
        inventorySpan.setAttribute('has.stock', hasStock);
        inventorySpan.end();
      });

      // 2. 결제 처리
      await tracer.startActiveSpan('process-payment', async (paymentSpan) => {
        const result = await processPayment(amount);
        paymentSpan.setAttribute('payment.amount', amount);
        paymentSpan.setAttribute('payment.status', result.status);
        paymentSpan.end();
      });

      span.setStatus({ code: SpanStatusCode.OK });
      return NextResponse.json({ success: true });
      
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  });
}
```

#### 2. **Custom Metrics (커스텀 지표)**

```typescript
import { metrics } from '@opentelemetry/api';

// 미터 생성
const meter = metrics.getMeter('ecommerce-metrics');

// 카운터: 판매 수량
const salesCounter = meter.createCounter('sales_total', {
  description: '총 판매 수량',
  unit: 'items',
});

// 히스토그램: 결제 시간
const paymentDuration = meter.createHistogram('payment_duration', {
  description: '결제 처리 시간',
  unit: 'ms',
});

// 사용 예
export async function processOrder(order: Order) {
  const startTime = Date.now();
  
  try {
    await processPayment(order);
    
    // 지표 기록
    salesCounter.add(order.items.length, {
      category: order.category,
      paymentMethod: order.paymentMethod,
    });
    
    paymentDuration.record(Date.now() - startTime, {
      status: 'success',
    });
    
  } catch (error) {
    paymentDuration.record(Date.now() - startTime, {
      status: 'failed',
    });
    throw error;
  }
}
```

### 📊 시각화: 실제로 보이는 것

OpenTelemetry 데이터는 다양한 백엔드로 전송되어 시각화됩니다:

#### **Jaeger UI에서 보는 Trace**

```
[GET /api/products] ──────────────────── 245ms
  ├─[DB Query: products] ───── 89ms
  ├─[Cache Check] ─── 5ms
  ├─[Image CDN] ────────── 120ms
  └─[Response Format] ── 31ms
```

#### **Grafana에서 보는 Metrics**

```
┌─────────────────────────────────┐
│   Response Time (p99)           
│   📈 145ms → 189ms → 134ms      
└─────────────────────────────────┘

┌─────────────────────────────────┐
│   Error Rate                    
│   📊 0.1% ═══════════           
└─────────────────────────────────┘
```

### 🚀 Next.js 전용 설정 예시

```typescript
// lib/telemetry.ts
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerOTel } from '@vercel/otel';

export function initTelemetry() {
  // Vercel의 OpenTelemetry 헬퍼 사용
  registerOTel({
    serviceName: 'my-nextjs-app',
    
    // Trace를 어디로 보낼지
    traceExporter: new OTLPTraceExporter({
      url: 'https://api.honeycomb.io/v1/traces',
      headers: {
        'x-honeycomb-team': process.env.HONEYCOMB_API_KEY,
      },
    }),
    
    // 샘플링 (모든 요청 추적하면 비용↑)
    tracesSampleRate: process.env.NODE_ENV === 'production' 
      ? 0.1  // 프로덕션: 10%만
      : 1.0, // 개발: 전부
  });
}
```

### 🎯 왜 OpenTelemetry를 쓰는가?

#### **문제 상황**

```typescript
// 사용자: "결제가 너무 느려요!" 😤

// 개발자: "어디가 느린거지?" 🤔
// - Next.js API Route?
// - 외부 결제 API?
// - 데이터베이스 쿼리?
// - Redis 캐시?
```

#### **OpenTelemetry로 해결**

```typescript
// Trace 결과:
checkout-process (총 3.2초) 😱
  ├─ validate-cart: 50ms ✅
  ├─ check-inventory: 200ms ✅
  ├─ payment-api-call: 2,800ms ❌ (여기가 문제!)
  └─ send-confirmation: 150ms ✅
```

### 💰 인기 있는 백엔드 서비스

1. **오픈소스 (무료)**
    
    - Jaeger
    - Zipkin
    - Grafana Tempo
2. **상용 서비스**
    
    - Datadog
    - New Relic
    - Honeycomb
    - AWS X-Ray

### 🔥 Sentry vs OpenTelemetry

```typescript
// Sentry: 에러 중심
"앱이 터졌어요!" → 에러 추적, 스택트레이스

// OpenTelemetry: 성능 중심
"앱이 느려요!" → 병목 구간 찾기, 성능 최적화

// 함께 사용하면 최고! 
Sentry + OpenTelemetry = 완벽한 모니터링
```

---

## Vercel의 OpenTelemetry 통합

Vercel이 `@vercel/otel` 패키지로 Next.js 전용 OpenTelemetry 설정을 쉽게 해줌
Vercel이 이렇게 간편한 통합을 제공하는 이유는 **서버리스 환경의 복잡성**을 숨기고, 개발자가 비즈니스 로직에 집중할 수 있게 하기 위해서이다.
특히 Edge Functions, ISR, 동적 렌더링 등 Next.js의 다양한 기능을 모두 추적할 수 있는 것이 장점!

### 📦 @vercel/otel 패키지

#### 기본 설정 (공식 문서 예시)

```typescript
// instrumentation.ts
import { registerOTel } from '@vercel/otel';

export function register() {
  registerOTel({ 
    serviceName: 'my-nextjs-app' 
  });
}
```

이 한 줄이면 자동으로:

- ✅ Next.js 라우트 추적
- ✅ fetch 요청 추적
- ✅ 데이터베이스 쿼리 추적
- ✅ 서버/클라이언트 컴포넌트 구분

### 🔍 실제 프로덕션 설정

```typescript
// instrumentation.ts
import { registerOTel } from '@vercel/otel';

export function register() {
  registerOTel({
    serviceName: 'ecommerce-frontend',
    
    // 1. 어디로 데이터를 보낼까?
    traceExporter: process.env.VERCEL_ENV === 'production'
      ? 'auto' // Vercel 자동 감지 (Datadog, New Relic 등)
      : 'console', // 개발 환경: 콘솔 출력
    
    // 2. 얼마나 추적할까? (비용 관리!)
    tracesSampleRate: process.env.VERCEL_ENV === 'production'
      ? 0.1  // 프로덕션: 10%만 (비용 절감)
      : 1.0, // 개발/프리뷰: 100%
    
    // 3. 추가 정보 포함
    resourceAttributes: {
      'environment': process.env.VERCEL_ENV || 'development',
      'region': process.env.VERCEL_REGION || 'unknown',
      'deployment.id': process.env.VERCEL_DEPLOYMENT_ID,
    },
  });
}
```

### 🎯 Vercel 플랫폼 특화 기능

#### 1. **자동 환경 감지**

```typescript
registerOTel({
  serviceName: 'my-app',
  // Vercel이 자동으로 감지!
  // - Development: 콘솔 출력
  // - Preview: Vercel 대시보드
  // - Production: 연결된 APM 서비스
});
```

#### 2. **Edge Runtime 지원**

```typescript
export function register() {
  // Edge와 Node.js 모두 지원!
  if (process.env.NEXT_RUNTIME === 'edge') {
    registerOTel({
      serviceName: 'edge-api',
      // Edge Runtime에서도 작동!
    });
  }
}
```

### 💡 실전 활용 예시

#### 1. **App Router 성능 추적**

```typescript
// app/products/[id]/page.tsx
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('product-page');

export default async function ProductPage({ params }) {
  return tracer.startActiveSpan('render-product-page', async (span) => {
    try {
      // 자동으로 추적되는 것들:
      const product = await fetch(`/api/products/${params.id}`); // ← 자동 추적!
      
      // 커스텀 속성 추가
      span.setAttribute('product.id', params.id);
      span.setAttribute('product.category', product.category);
      
      return <ProductView product={product} />;
      
    } finally {
      span.end();
    }
  });
}
```

#### 2. **API Route 모니터링**

```typescript
// app/api/checkout/route.ts
export async function POST(request: Request) {
  // @vercel/otel이 자동으로:
  // - 요청 시작/종료 시간 기록
  // - HTTP 상태 코드 추적
  // - 에러 자동 캡처
  
  const data = await request.json();
  
  // 커스텀 이벤트 추가
  const span = trace.getActiveSpan();
  span?.addEvent('checkout-started', {
    userId: data.userId,
    cartValue: data.total,
  });
  
  // DB, 외부 API 호출도 자동 추적됨
  const result = await processCheckout(data);
  
  return NextResponse.json(result);
}
```

### 📊 Vercel 대시보드 통합

```typescript
// Vercel 프로젝트 설정에서 연결 가능한 서비스들:

registerOTel({
  serviceName: 'my-app',
  // VERCEL_OBSERVABILITY_PROVIDER 환경 변수로 자동 설정
});

// 지원하는 Providers:
// - Datadog (자동 연동!)
// - New Relic
// - Axiom
// - Honeycomb
// - Grafana Cloud
```

### 🚀 고급 설정: 멀티 서비스 추적

```typescript
// instrumentation.ts - 마이크로서비스 아키텍처
import { registerOTel } from '@vercel/otel';
import { W3CTraceContextPropagator } from '@opentelemetry/core';

export function register() {
  registerOTel({
    serviceName: 'frontend-gateway',
    
    // 다른 서비스로 전파
    propagators: [new W3CTraceContextPropagator()],
    
    // 서비스 간 추적을 위한 헤더
    instrumentationConfig: {
      fetch: {
        propagateTraceHeaderCorsUrls: [
          'https://api.myapp.com/*',
          'https://auth.myapp.com/*',
        ],
      },
    },
  });
}

// API 호출 시 자동으로 trace 전파
const response = await fetch('https://api.myapp.com/orders', {
  // traceparent 헤더가 자동 추가됨!
});
```

### 🎨 실제 Trace 시각화 예시

```
[Vercel Dashboard / Datadog APM에서 보이는 모습]

GET /products/123 ────────────────────── 312ms
 ├─ getServerSideProps ──────────────── 287ms
 │   ├─ fetch: GET /api/products/123 ── 145ms
 │   │   └─ Prisma: findUnique ──────── 89ms
 │   ├─ fetch: GET /api/reviews ─────── 98ms
 │   └─ generateMetadata ────────────── 44ms
 └─ React SSR ───────────────────────── 25ms
```

### 💰 비용 최적화 팁

```typescript
registerOTel({
  serviceName: 'my-app',
  
  // 1. 스마트 샘플링
  tracesSampler: (samplingContext) => {
    // 에러는 항상 추적
    if (samplingContext.attributes?.['http.status_code'] >= 500) {
      return 1.0;
    }
    // 느린 요청 추적
    if (samplingContext.attributes?.['http.duration'] > 1000) {
      return 0.5;
    }
    // 나머지는 1%만
    return 0.01;
  },
  
  // 2. 불필요한 span 제외
  instrumentationConfig: {
    '@opentelemetry/instrumentation-fs': {
      enabled: false, // 파일 시스템 제외
    },
  },
});
```

### 🔥 Vercel + OpenTelemetry 베스트 프랙티스

```typescript
// instrumentation.ts - 완벽한 설정
import { registerOTel } from '@vercel/otel';

export function register() {
  // 개발/프로덕션 자동 구분
  const isDev = process.env.NODE_ENV === 'development';
  
  registerOTel({
    serviceName: `${process.env.VERCEL_PROJECT_NAME || 'nextjs-app'}`,
    
    // 환경별 설정
    traceExporter: isDev ? 'console' : 'auto',
    metricsExporter: isDev ? 'console' : 'auto',
    
    // 샘플링 전략
    tracesSampleRate: isDev ? 1.0 : 
      parseFloat(process.env.OTEL_SAMPLE_RATE || '0.1'),
    
    // Vercel 메타데이터 자동 포함
    resourceAttributes: {
      'vercel.env': process.env.VERCEL_ENV,
      'vercel.region': process.env.VERCEL_REGION,
      'vercel.git.commit': process.env.VERCEL_GIT_COMMIT_SHA,
      'vercel.git.branch': process.env.VERCEL_GIT_COMMIT_REF,
    },
  });
  
  console.log('📡 OpenTelemetry 초기화 완료');
}
```

---


## OpenTelemetry의 대시보드 구조 이해하기 📊

OpenTelemetry는 **대시보드를 제공하지 않습니다**.

### 🎯 OpenTelemetry vs Sentry 구조

```
📊 Sentry (All-in-One)
┌──────────────────────────────┐
│  SDK → Sentry 서버 → 대시보드   
│       (전부 Sentry가 제공)      
└──────────────────────────────┘

🔧 OpenTelemetry (레고 블록)
┌──────────────────────────────────────┐
│  SDK → 수집 → 저장 → 시각화     
│  (OTel)  ?     ?      ?         
│         직접 선택해야 함!       
└──────────────────────────────────────┘
```

### 📦 OpenTelemetry = "데이터 수집 표준"

OpenTelemetry는 **데이터를 수집하고 전송하는 방법**만 제공합니다:

```typescript
// OpenTelemetry가 하는 일
const telemetryData = {
  traceId: "abc123",
  spanId: "def456",
  operationName: "checkout",
  duration: 245,
  attributes: { userId: "user_789" }
};

// 이제 이 데이터를 어디로 보낼까? 🤔
```

### 🎨 대시보드 옵션들

#### 1. **오픈소스 (무료, 직접 호스팅)**

```yaml
# docker-compose.yml 예시
services:
  # Jaeger - Uber가 만든 추적 시스템
  jaeger:
    image: jaegertracing/all-in-one
    ports:
      - "16686:16686"  # UI 대시보드
      - "4318:4318"    # OTLP 수신
  
  # Grafana Stack
  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"  # 대시보드
  
  tempo:  # Trace 저장소
    image: grafana/tempo
  
  prometheus:  # Metrics 저장소
    image: prom/prometheus
```

#### 2. **상용 서비스 (관리형)**

```typescript
// 각 서비스별 설정 예시

// 1. Datadog
registerOTel({
  traceExporter: new OTLPTraceExporter({
    url: 'https://trace.agent.datadoghq.com',
    headers: { 'DD-API-KEY': process.env.DD_API_KEY }
  })
});

// 2. New Relic
registerOTel({
  traceExporter: new OTLPTraceExporter({
    url: 'https://otlp.nr-data.net',
    headers: { 'api-key': process.env.NEW_RELIC_LICENSE_KEY }
  })
});

// 3. Honeycomb
registerOTel({
  traceExporter: new OTLPTraceExporter({
    url: 'https://api.honeycomb.io',
    headers: { 'x-honeycomb-team': process.env.HONEYCOMB_API_KEY }
  })
});
```

### 💰 비용 비교

```typescript
// 🆓 Sentry (간단한 에러 추적)
월 5,000 에러 무료
→ 설정 5분, 바로 사용

// 🆓 Jaeger (오픈소스, 직접 호스팅)
무료 (서버 비용만)
→ 설정 2-3시간, 유지보수 필요

// 💵 Datadog (엔터프라이즈)
월 $15/호스트부터
→ 설정 30분, 풀 관리형

// 💵 Vercel + Datadog 통합
Vercel Pro ($20) + Datadog APM
→ 설정 10분, 자동 연동
```

### 🔍 실제 대시보드 비교

#### **Sentry 대시보드**
```
주요 기능:
- 에러 목록 & 상세 스택트레이스
- 에러 발생 추이 그래프
- 사용자 세션 재현
- 릴리즈별 에러율
```

#### **Jaeger 대시보드**
```
주요 기능:
- Trace 타임라인 (Gantt 차트)
- 서비스 의존성 그래프
- 지연 시간 히트맵
- Span 상세 정보
```

#### **Grafana + Tempo**
```
주요 기능:
- 커스텀 대시보드 제작
- 메트릭 + 트레이스 통합
- 알림 규칙 설정
- 로그 연계 분석
```

### 🚀 실전 추천 조합

#### **1. 스타트업 (비용 최소화)**
```typescript
// Sentry (에러) + Vercel Analytics (성능)
// instrumentation.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({ dsn: '...' });

// next.config.js
module.exports = {
  analytics: true,  // Vercel Web Analytics
};
```

#### **2. 성장 단계 (균형)**
```typescript
// Sentry (에러) + Jaeger (추적)
import { registerOTel } from '@vercel/otel';

registerOTel({
  serviceName: 'my-app',
  traceExporter: new OTLPTraceExporter({
    url: 'http://my-jaeger:4318/v1/traces',
  })
});

// Sentry는 별도로 계속 사용
Sentry.init({ ... });
```

#### **3. 엔터프라이즈 (완전 통합)**
```typescript
// Datadog 올인원
import { registerOTel } from '@vercel/otel';
import { DatadogTraceExporter } from '@datadog/opentelemetry-exporter-datadog';

registerOTel({
  traceExporter: new DatadogTraceExporter({
    // Datadog이 에러, 트레이스, 메트릭, 로그 전부 처리
  })
});
```

### 📊 언제 뭘 써야 할까?

```typescript
// 상황별 선택 가이드

if (주요_관심사 === "에러 추적") {
  return "Sentry만으로 충분";
}

if (주요_관심사 === "성능 병목") {
  return "OpenTelemetry + 시각화 도구 필요";
}

if (서비스_규모 === "마이크로서비스") {
  return "OpenTelemetry 필수 (분산 추적)";
}

if (예산 === "제한적") {
  return "Sentry Free + Jaeger 직접 호스팅";
}

if (예산 === "충분") {
  return "Datadog 또는 New Relic 올인원";
}
```

### 🎯 우리의 프로젝트에는?

OpenTelemetry는 "미래를 위한 투자"라고 볼 수 있다.
나중에 어떤 모니터링 도구로 갈아타더라도 코드 수정 없이 설정만 바꾸면 됨!

1. **현재**: Sentry (에러 추적) ✅
2. **다음 단계**: Vercel Web Analytics 추가 (기본 성능)
3. **성능 이슈 시**: Jaeger 도입 (무료 추적)
4. **스케일 업**: 상용 서비스 검토