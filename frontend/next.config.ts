import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// ES 모듈에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 로컬 개발 시에만 루트의 .env.local 로드 (Vercel에서는 환경변수가 자동 주입됨)
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  const { config } = await import("dotenv");
  config({ path: resolve(__dirname, "../.env.local") });
}

const nextConfig: NextConfig = {
  /* config options here */
  // Next.js 15.5.4에서는 instrumentationHook이 기본값이므로 제거
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fvfkehhaxxhaapfajddv.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

const isProd = process.env.NODE_ENV === "production";

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "sangjun-shin",

  project: "abc",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.

  // 개발 환경에서는 로컬 서버에 /monitoring 엔드포인트가 없으므로 끄고,
  // 프로덕션에서만 활성화하여 광고 차단 등을 우회합니다.
  ...(isProd ? { tunnelRoute: "/monitoring" } : {}),

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});
