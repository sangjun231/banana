import { NextRequest, NextResponse } from "next/server";
import { generatePortrait } from "@/lib/gemini/client";

const moodPrompts: Record<string, string> = {
  bright:
    "Transform this portrait into a 4-cut life photo style with bright and cheerful atmosphere. Use warm sunlight and vibrant colors. Keep the person's face and pose, only change the background to professional studio with natural lighting.",
  vintage:
    "Transform this portrait into a 4-cut life photo style with vintage retro feeling. Apply film camera aesthetics with warm sepia tones. Keep the person's face and pose, only change the background to vintage studio setting.",
  dramatic:
    "Transform this portrait into a 4-cut life photo style with dramatic mood. Use strong contrast and theatrical lighting. Keep the person's face and pose, only change the background to dramatic setting with spotlights.",
  soft: "Transform this portrait into a 4-cut life photo style with soft dreamy atmosphere. Use pastel tones and gentle lighting. Keep the person's face and pose, only change the background to soft gradient background.",
  cool: "Transform this portrait into a 4-cut life photo style with cool-toned modern aesthetic. Use cool colors and modern minimalist setting. Keep the person's face and pose, only change the background to modern studio.",
  warm: "Transform this portrait into a 4-cut life photo style with warm cozy feeling. Use warm orange and brown tones. Keep the person's face and pose, only change the background to warm comfortable setting.",
};

export async function POST(request: NextRequest) {
  try {
    const { image, mood } = await request.json();

    if (!image || !mood) {
      return NextResponse.json(
        { error: "이미지와 분위기를 선택해주세요" },
        { status: 400 },
      );
    }

    const prompt = moodPrompts[mood] || moodPrompts.bright;
    const result = await generatePortrait(image, prompt);

    return NextResponse.json({
      success: true,
      generatedImage: result.generatedImage, // base64 이미지
      description: result.description,
      prompt: result.prompt,
      mood,
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
