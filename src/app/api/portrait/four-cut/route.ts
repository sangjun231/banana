import { NextRequest, NextResponse } from "next/server";
import { generatePortrait } from "@/lib/gemini/client";

const moodPrompts: Record<string, string> = {
  bright:
    "밝고 화사한 분위기의 인생네컷 스타일 포트레이트를 만들어주세요. 따뜻한 햇살과 생동감 넘치는 색감으로 표현해주세요.",
  vintage:
    "빈티지 감성의 인생네컷 스타일 포트레이트를 만들어주세요. 레트로한 필름 카메라로 찍은 것 같은 느낌을 살려주세요.",
  dramatic:
    "드라마틱하고 강렬한 인생네컷 스타일 포트레이트를 만들어주세요. 명암 대비가 뚜렷하고 극적인 분위기를 연출해주세요.",
  soft: "부드럽고 몽환적인 인생네컷 스타일 포트레이트를 만들어주세요. 파스텔 톤의 은은하고 꿈결 같은 분위기를 만들어주세요.",
  cool: "쿨톤 감성의 인생네컷 스타일 포트레이트를 만들어주세요. 시원하고 모던한 느낌의 색감을 사용해주세요.",
  warm: "따뜻한 감성의 인생네컷 스타일 포트레이트를 만들어주세요. 포근하고 아늑한 분위기를 연출해주세요.",
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
    const fullPrompt = `
      ${prompt}
      
      이미지를 분석하고 다음 사항들을 설명해주세요:
      1. 인물의 특징과 표정
      2. 선택한 분위기(${mood})에 맞는 색감과 조명 제안
      3. 인생네컷 스타일로 만들 때 어떤 포즈와 구도가 좋을지
      4. 추천하는 배경과 소품
      
      친근하고 따뜻한 톤으로 설명해주세요.
    `;

    const result = await generatePortrait(image, fullPrompt);

    return NextResponse.json({
      success: true,
      result,
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
