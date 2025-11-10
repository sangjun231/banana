import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 서버 사이드에서 의도적으로 에러 발생
    Sentry.captureException(new Error("서버 API 테스트 에러입니다!"), {
      tags: {
        api: "test-sentry",
        environment: process.env.NODE_ENV,
      },
      contexts: {
        test_context: {
          message: "서버 API에서 발생한 테스트 에러",
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      message: "서버 에러가 Sentry로 전송되었습니다!",
      success: true,
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { message: "서버 에러 발생", error: String(error) },
      { status: 500 },
    );
  }
}
