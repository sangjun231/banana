import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import { STORAGE_BUCKET, TABLE_NAME } from "@/constants/consts";
import { createClient } from "@/lib/supabase/server";

const ERROR_MESSAGE = {
  UNAUTHORIZED: "Unauthorized",
  INTERNAL_SERVER_ERROR: "Internal Server Error",
  FAILED_TO_UPLOAD_IMAGE: "Failed to upload image",
  FAILED_TO_GET_PUBLIC_URL: "Failed to get public URL for the uploaded image.",
  FAILED_TO_INSERT_TABLE_NANO_BANANA: "Failed to insert table nano-banana",
  INVALID_CATEGORY: "Invalid category",
  NOT_FOUND: "Not found",
};

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const image = formData.get("image") as File;
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get("category");

  if (!category) {
    return NextResponse.json(
      { error: ERROR_MESSAGE.INVALID_CATEGORY },
      { status: 400 },
    );
  }

  let filePath = "";
  const uploadId = uuidv4();

  try {
    // 1. getUser
    const { data: user, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error(userError);
      return NextResponse.json(
        { error: ERROR_MESSAGE.UNAUTHORIZED },
        { status: 401 },
      );
    }

    // 2. File 을 Buffer 로 변환
    const buffer = await image.arrayBuffer();
    const imageBuffer = Buffer.from(buffer);

    // 3. File 을 Sharp 를 이용하여 webp 로 변환
    const webpBuffer = await sharp(imageBuffer)
      .webp({ quality: 100 }) // Adjust quality as needed (0-100)
      .toBuffer();

    // 4. 고유 파일 경로 생성
    filePath = `gen/${Date.now()}-${user.user.email}-${uuidv4()}.webp`;

    // 5. webpBuffer 를 supabase.storage.from("images").upload 로 업로드
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, webpBuffer, {
        // Use webpBuffer
        contentType: "image/webp", // Changed contentType to image/webp
        upsert: true,
      });

    if (uploadError) {
      console.error(uploadError);
      throw new Error(ERROR_MESSAGE.FAILED_TO_UPLOAD_IMAGE);
    }

    // 6. 공개 URL 가져오기
    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      console.error(ERROR_MESSAGE.FAILED_TO_GET_PUBLIC_URL);
      throw new Error(ERROR_MESSAGE.FAILED_TO_GET_PUBLIC_URL);
    }

    const imageUrl = publicUrlData.publicUrl;

    const uploadObject = {
      id: uploadId,
      image_url: imageUrl,
      user_id: user.user.id,
      gen_category: category,
      updated_at: new Date().toISOString(),
    };

    // 7. insert nano-banana
    const { data: insertResult, error: insertError } = await supabase
      .from(TABLE_NAME)
      .insert(uploadObject)
      .select()
      .single();

    if (insertError) {
      console.error(insertError);
      throw new Error(ERROR_MESSAGE.FAILED_TO_INSERT_TABLE_NANO_BANANA);
    }

    return NextResponse.json(insertResult, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
      if (error.message === ERROR_MESSAGE.FAILED_TO_INSERT_TABLE_NANO_BANANA) {
        // 실패시 이미지 객체 및 파일 삭제
        const { error: imageDelError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([filePath]);

        if (imageDelError) {
          console.error(imageDelError);
        }

        // 추가로 table 삭제
        const { error: tableDelError } = await supabase
          .from(TABLE_NAME)
          .delete()
          .eq("id", uploadId);

        if (tableDelError) {
          console.error(tableDelError);
        }

        return NextResponse.json(
          { error: ERROR_MESSAGE.FAILED_TO_INSERT_TABLE_NANO_BANANA },
          { status: 500 },
        );
      } else if (
        error.message === ERROR_MESSAGE.FAILED_TO_UPLOAD_IMAGE ||
        error.message === ERROR_MESSAGE.FAILED_TO_GET_PUBLIC_URL
      ) {
        // 테이블 인서트까지 가지 않았으므로 실패시 이미지 객체 및 파일만 삭제
        const { error: imageDelError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([filePath]);

        if (imageDelError) {
          console.error(imageDelError);
        }

        return NextResponse.json(
          {
            error:
              ERROR_MESSAGE.FAILED_TO_UPLOAD_IMAGE ||
              ERROR_MESSAGE.FAILED_TO_GET_PUBLIC_URL,
          },
          { status: 500 },
        );
      }
    } else {
      console.error(error);
    }

    return NextResponse.json(
      { error: ERROR_MESSAGE.INTERNAL_SERVER_ERROR },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get("category");

  if (!category) {
    return NextResponse.json(
      { error: ERROR_MESSAGE.INVALID_CATEGORY },
      { status: 400 },
    );
  }

  try {
    // 1. getUser
    const { data: user, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error(userError);
      return NextResponse.json(
        { error: ERROR_MESSAGE.UNAUTHORIZED },
        { status: 401 },
      );
    }

    // 2. 테이블에서 user_id 와 gen_category 가 일치하는 데이터 조회
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .eq("user_id", user.user.id)
      .eq("gen_category", category);

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
      { error: ERROR_MESSAGE.INTERNAL_SERVER_ERROR },
      { status: 500 },
    );
  }
}
