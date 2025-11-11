import { NextRequest, NextResponse } from "next/server";
import { generatePortrait } from "@/lib/gemini/client";
import { createClient } from "@/lib/supabase/server";

// 첫 번째 이미지 배경 변환용 프롬프트 (배경 스타일 생성)
const backgroundFirstPrompts: Record<string, string> = {
  bright:
    "Transform this photo with a bright and cheerful atmosphere. Replace the background with a professional studio with warm natural lighting and vibrant colors. Keep the person's face and pose exactly as they are. Focus on creating a consistent, professional background.",
  vintage:
    "Transform this photo with a vintage retro feeling. Replace the background with a vintage studio setting using film camera aesthetics and warm sepia tones. Keep the person's face and pose exactly as they are.",
  dramatic:
    "Transform this photo with dramatic mood. Replace the background with a theatrical setting using strong contrast and dramatic spotlights. Keep the person's face and pose exactly as they are.",
  soft: "Transform this photo with soft dreamy atmosphere. Replace the background with soft gradient using pastel tones and gentle lighting. Keep the person's face and pose exactly as they are.",
  cool: "Transform this photo with cool-toned modern aesthetic. Replace the background with modern minimalist studio using cool colors. Keep the person's face and pose exactly as they are.",
  warm: "Transform this photo with warm cozy feeling. Replace the background with warm comfortable setting using orange and brown tones. Keep the person's face and pose exactly as they are.",
};

// 나머지 이미지 배경 변환용 프롬프트 (첫 번째와 동일한 배경 적용)
const backgroundRestPrompts: Record<string, string> = {
  bright:
    "Replace the background of this photo to match EXACTLY the same bright professional studio background as the reference. Use identical lighting, colors, and setting. Keep the person's face and pose. The background must be perfectly consistent with the reference image.",
  vintage:
    "Replace the background of this photo to match EXACTLY the same vintage studio background as the reference. Use identical retro aesthetics, colors, and setting. Keep the person's face and pose. The background must be perfectly consistent with the reference image.",
  dramatic:
    "Replace the background of this photo to match EXACTLY the same dramatic background as the reference. Use identical lighting, contrast, and setting. Keep the person's face and pose. The background must be perfectly consistent with the reference image.",
  soft: "Replace the background of this photo to match EXACTLY the same soft dreamy background as the reference. Use identical pastel tones and gradient. Keep the person's face and pose. The background must be perfectly consistent with the reference image.",
  cool: "Replace the background of this photo to match EXACTLY the same cool-toned modern background as the reference. Use identical colors and minimalist setting. Keep the person's face and pose. The background must be perfectly consistent with the reference image.",
  warm: "Replace the background of this photo to match EXACTLY the same warm cozy background as the reference. Use identical warm tones and setting. Keep the person's face and pose. The background must be perfectly consistent with the reference image.",
};

// 프레임 추가 프롬프트 (4장 합친 후 여백에 배경 추가)
const frameAddPrompts: Record<string, string> = {
  bright:
    "Fill ONLY the white margins/borders with bright and cheerful background (warm sunlight, vibrant colors, decorative patterns). Keep the 4 photos in the center completely untouched.",
  vintage:
    "Fill ONLY the white margins/borders with vintage retro background (sepia tones, film aesthetics, nostalgic patterns). Keep the 4 photos in the center completely untouched.",
  dramatic:
    "Fill ONLY the white margins/borders with dramatic background (strong contrast, theatrical mood, bold patterns). Keep the 4 photos in the center completely untouched.",
  soft: "Fill ONLY the white margins/borders with soft dreamy background (pastel tones, gentle colors, delicate patterns). Keep the 4 photos in the center completely untouched.",
  cool: "Fill ONLY the white margins/borders with cool-toned modern background (cool colors, minimalist design, clean patterns). Keep the 4 photos in the center completely untouched.",
  warm: "Fill ONLY the white margins/borders with warm cozy background (warm orange and brown tones, comfortable patterns). Keep the 4 photos in the center completely untouched.",
};

export async function POST(request: NextRequest) {
  try {
    const { images, mood, styleType, combinedImage } = await request.json();

    if (!images || images.length === 0 || !mood || !styleType) {
      return NextResponse.json(
        { error: "이미지, 분위기, 스타일 타입을 모두 선택해주세요" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    console.log(
      `🎨 Style Type: ${
        styleType === "background-change" ? "배경 변환" : "프레임 추가"
      }`
    );
    console.log(`🎭 Mood: ${mood}`);
    console.log(`📸 Images count: ${images.length}`);

    const generatedImages: string[] = [];

    if (styleType === "frame-add") {
      // 프레임 추가 모드: 클라이언트에서 합친 이미지에 1번만 AI 적용
      if (!combinedImage) {
        return NextResponse.json(
          { error: "합쳐진 이미지가 필요합니다" },
          { status: 400 }
        );
      }

      console.log("🖼️ Processing combined layout with frame...");
      const prompt = frameAddPrompts[mood] || frameAddPrompts.bright;
      const result = await generatePortrait(combinedImage, prompt);

      // 프레임 모드는 이미 합쳐진 1장의 결과만 반환
      return NextResponse.json({
        success: true,
        generatedImage: result.generatedImage, // 단일 이미지
        isCombined: true, // 이미 합쳐진 결과임을 표시
        mood,
        styleType,
      });
    } else {
      // 배경 변환 모드: 첫 번째 이미지로 배경 생성 → 나머지에 동일 배경 적용
      console.log("🎨 Step 1: Generating background from first image...");
      const firstPrompt =
        backgroundFirstPrompts[mood] || backgroundFirstPrompts.bright;
      const firstResult = await generatePortrait(images[0], firstPrompt);
      generatedImages.push(firstResult.generatedImage);

      console.log("🎨 Step 2: Applying same background to remaining images...");
      const restPrompt =
        backgroundRestPrompts[mood] || backgroundRestPrompts.bright;

      // 나머지 이미지들을 첫 번째 결과를 참조로 변환
      for (let i = 1; i < images.length; i++) {
        console.log(`🎨 Processing image ${i + 1}/${images.length}...`);

        // Gemini에 첫 번째 결과를 참조로 제공
        const result = await generatePortrait(
          images[i],
          restPrompt,
          firstResult.generatedImage // 참조 이미지로 전달
        );
        generatedImages.push(result.generatedImage);
      }

      console.log(`✅ All ${generatedImages.length} images generated`);

      return NextResponse.json({
        success: true,
        generatedImages, // 배열로 반환
        isCombined: false,
        mood,
        styleType,
        count: generatedImages.length,
      });
    }
  } catch (error) {
    console.error("Error generating portrait:", error);
    return NextResponse.json(
      {
        error: "포트레이트 생성 중 오류가 발생했습니다",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
