"use server";

import { cookies } from "next/headers";

export async function getSupabaseCookies() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  // Supabase 세션 쿠키는 `sb-<projectRef>-...` 형태로 시작함. 환경변수 의존 없이 접두사만 확인
  const supabaseCookies = allCookies.filter((cookie) =>
    cookie.name.startsWith(`sb-${process.env.SUPABASE_PROJECT_ID}`),
  );
  return supabaseCookies;
}
