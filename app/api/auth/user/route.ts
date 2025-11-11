import { NextResponse } from "next/server";
import { getSupabaseCookies } from "@/lib/supabase/get-supbase-cookies";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const supabaseCookies = await getSupabaseCookies();

  // if (supabaseCookies.length === 0) {
  //   // 쿠키가 없으면 그냥 401 리턴
  //   return NextResponse.json({ error: "Cookie not found" }, { status: 401 });
  // }
  //
  // const { data: user, error } = await supabase.auth.getUser();
  //
  // if (error) {
  //   if (error.message === "Auth session missing!") {
  //     await supabase.auth.signOut();
  //
  //     await supabase.auth.setSession({
  //       access_token: "",
  //       refresh_token: "",
  //     });
  //
  //     return NextResponse.json(
  //       { user: null, error: "Auth session missing!" },
  //       { status: 401 }
  //     );
  //   }
  //
  //   if (error.message === "refresh_token_not_found") {
  //     await supabase.auth.signOut();
  //
  //     await supabase.auth.setSession({
  //       access_token: "",
  //       refresh_token: "",
  //     });
  //
  //     return NextResponse.json(
  //       { user: null, error: "Refresh token not found" },
  //       { status: 401 }
  //     );
  //   }
  //   return NextResponse.json({ error: error.message }, { status: 500 });
  // }
  //
  // return NextResponse.json(user.user, { status: 200 });

  // 세션이 없거나 만료된 경우 200 + null 을 반환해 React Query 캐시가 정상 갱신되도록 한다.
  if (supabaseCookies.length === 0) {
    return NextResponse.json(null, { status: 200 });
  }

  const { data: user, error } = await supabase.auth.getUser();

  if (error) {
    if (
      error.message === "Auth session missing!" ||
      error.message === "refresh_token_not_found"
    ) {
      await supabase.auth.signOut();
      await supabase.auth.setSession({
        access_token: "",
        refresh_token: "",
      });

      return NextResponse.json(null, { status: 200 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(user.user, { status: 200 });
}
