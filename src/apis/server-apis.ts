import { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { PUBLIC_URL } from "@/constants/consts";

export async function postUserServer(): Promise<User | null> {
  const url = `${PUBLIC_URL}/api/auth/user`;
  try {
    // 서버 사이드에서 내부 API를 호출할 때는 현재 요청의 쿠키를 명시적으로 전달해야 함
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
      .join("; ");

    const data = await fetch(url, {
      method: "GET",
      headers: {
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
    });

    if (!data.ok) {
      return null;
    }

    return data.json();
  } catch (error: unknown) {
    // console.error("error in post user server ===>", error);
    return null;
  }
}
