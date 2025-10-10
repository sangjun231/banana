import { NextRequest, NextResponse } from "next/server";
import { generatePortrait } from "@/lib/gemini/client";
import { createClient } from "@/lib/supabase/server";

const moodPrompts: Record<string, string> = {
  bright:
    "life photo style with bright and cheerful atmosphere. Use warm sunlight and vibrant colors. Keep the person's face and pose, only change the background to professional studio with natural lighting.",
  vintage:
    "life photo style with vintage retro feeling. Apply film camera aesthetics with warm sepia tones. Keep the person's face and pose, only change the background to vintage studio setting.",
  dramatic:
    "life photo style with dramatic mood. Use strong contrast and theatrical lighting. Keep the person's face and pose, only change the background to dramatic setting with spotlights.",
  soft: "life photo style with soft dreamy atmosphere. Use pastel tones and gentle lighting. Keep the person's face and pose, only change the background to soft gradient background.",
  cool: "life photo style with cool-toned modern aesthetic. Use cool colors and modern minimalist setting. Keep the person's face and pose, only change the background to modern studio.",
  warm: "life photo style with warm cozy feeling. Use warm orange and brown tones. Keep the person's face and pose, only change the background to warm comfortable setting.",
};

export async function POST(request: NextRequest) {
  try {
    const { images, mood } = await request.json();

    if (!images || images.length === 0 || !mood) {
      return NextResponse.json(
        { error: "이미지와 분위기를 선택해주세요" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 },
      );
    }

    const prompt = moodPrompts[mood] || moodPrompts.bright;
    const generatedImages: string[] = [];

    // 각 이미지를 Gemini로 변환
    for (let i = 0; i < images.length; i++) {
      console.log(`🎨 Processing image ${i + 1}/${images.length}`);
      const result = await generatePortrait(images[i], prompt);
      generatedImages.push(result.generatedImage);
    }

    console.log(`✅ All ${generatedImages.length} images generated`);

    return NextResponse.json({
      success: true,
      generatedImages, // 배열로 반환
      mood,
      count: generatedImages.length,
    });
  } catch (error) {
    console.error("Error generating portrait:", error);
    return NextResponse.json(
      {
        error: "포트레이트 생성 중 오류가 발생했습니다",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
