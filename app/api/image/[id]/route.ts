import { NextRequest, NextResponse } from "next/server";
import { TABLE_NAME } from "@/constants/consts";
import { createClient } from "@/lib/supabase/server";

const ERROR_MESSAGE = {
  INTERNAL_SERVER_ERROR: "Internal Server Error",
  UNAUTHORIZED: "Unauthorized",
  INVALID_CATEGORY: "Invalid category",
  NOT_FOUND: "Not found",
};

interface ParamOptions {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: ParamOptions) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get("category");

  if (!category) {
    return NextResponse.json(
      { error: ERROR_MESSAGE.INVALID_CATEGORY },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  try {
    // 1. getUser
    const { data: user, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error(userError);
      return NextResponse.json(
        { error: ERROR_MESSAGE.INTERNAL_SERVER_ERROR },
        { status: 500 },
      );
    }

    // 2. 테이블에서 user_id 와 gen_category와 id 가 일치하는 데이터 조회
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .eq("id", id)
      .eq("user_id", user.user.id)
      .eq("gen_category", category)
      .single();

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: ERROR_MESSAGE.INTERNAL_SERVER_ERROR },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: ERROR_MESSAGE.NOT_FOUND },
        { status: 404 },
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
