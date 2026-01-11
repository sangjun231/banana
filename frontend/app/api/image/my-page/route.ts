import { NextResponse } from "next/server";
import { TABLE_NAME } from "@/constants/consts";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  try {
    const { data: user, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 사용자의 모든 이미지 조회 (최신순)
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .eq("user_id", user.user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }

    return NextResponse.json(data || [], { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
