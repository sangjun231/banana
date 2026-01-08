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

export async function DELETE(request: NextRequest, { params }: ParamOptions) {
  const { id } = await params;
  const supabase = await createClient();

  try {
    const { data: user, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. 테이블에서 이미지 정보 조회
    const { data: imageData, error: fetchError } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .eq("id", id)
      .eq("user_id", user.user.id)
      .single();

    if (fetchError || !imageData) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // 2. Storage에서 파일 삭제 (image_url에서 경로 추출)
    // image_url 예: https://xxx.supabase.co/storage/v1/object/public/users/portrait_memorial/...
    if (!imageData.image_url) {
      return NextResponse.json(
        { error: "Image URL not found" },
        { status: 400 },
      );
    }

    const urlParts = imageData.image_url.split("/");
    const storagePath = urlParts.slice(urlParts.indexOf("users")).join("/");

    const { error: storageError } = await supabase.storage
      .from("users")
      .remove([storagePath]);

    if (storageError) {
      console.error("Storage delete error:", storageError);
      // Storage 삭제 실패해도 DB는 삭제 진행
    }

    // 3. 테이블에서 레코드 삭제
    const { error: deleteError } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq("id", id)
      .eq("user_id", user.user.id);

    if (deleteError) {
      console.error(deleteError);
      return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
