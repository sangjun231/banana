import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export function getGeminiModel(modelName = "gemini-2.5-flash-image") {
  return genAI.getGenerativeModel({ model: modelName });
}

export interface PortraitResult {
  generatedImage: string; // base64
  description: string;
  prompt: string;
}

export async function generatePortrait(
  imageBase64: string,
  prompt: string,
  referenceImageBase64?: string, // 참조 이미지 (배경 통일용)
): Promise<PortraitResult> {
  const model = getGeminiModel();

  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType: "image/jpeg",
    },
  };

  // 참조 이미지가 있으면 함께 전달
  const parts: any[] = [];

  if (referenceImageBase64) {
    // 프롬프트 수정: 배경 스타일만 참조하도록 명확히 지시
    parts.push(
      `You are an expert photo editor. You will receive TWO images:
1. REFERENCE image (first) - Use ONLY its background style/atmosphere/colors
2. TARGET image (second) - Keep THIS person's face, body, and pose EXACTLY as they are

YOUR TASK:
- Study the background style (colors, lighting, setting, mood) from the REFERENCE image
- Apply that SAME background style to the TARGET image
- CRITICAL: Keep the person in the TARGET image completely unchanged
- Only replace the background, never change or copy the person

${prompt}`,
    );
    parts.push({
      inlineData: {
        data: referenceImageBase64,
        mimeType: "image/jpeg",
      },
    });
  } else {
    parts.push(prompt);
  }

  parts.push(imagePart);

  const result = await model.generateContent(parts);
  const response = result.response;

  // 디버깅: 전체 응답 구조 로깅
  console.log(
    "🔍 Gemini API Response:",
    JSON.stringify(
      {
        candidates: response.candidates?.length,
        promptFeedback: response.promptFeedback,
        usageMetadata: response.usageMetadata,
      },
      null,
      2,
    ),
  );

  // 응답 구조 검증
  if (!response.candidates || response.candidates.length === 0) {
    console.error("❌ No candidates in response");
    throw new Error("API 응답에 candidates가 없습니다.");
  }

  const candidate = response.candidates[0];
  console.log(
    "🔍 Candidate structure:",
    JSON.stringify(
      {
        finishReason: candidate.finishReason,
        hasContent: !!candidate.content,
        hasParts: !!candidate.content?.parts,
        partsCount: candidate.content?.parts?.length,
      },
      null,
      2,
    ),
  );

  if (!candidate?.content?.parts) {
    console.error("❌ No content.parts in candidate");
    throw new Error("API 응답에 content.parts가 없습니다.");
  }

  // 응답에서 이미지 데이터 추출
  for (let i = 0; i < candidate.content.parts.length; i++) {
    const part = candidate.content.parts[i];
    console.log(`🔍 Part ${i}:`, {
      hasInlineData: !!part.inlineData,
      hasText: !!part.text,
      keys: Object.keys(part),
    });

    if (part.inlineData) {
      console.log("✅ Found image in part", i);
      return {
        generatedImage: part.inlineData.data,
        description: "AI 생성 포트레이트",
        prompt: prompt,
      };
    }
  }

  console.error("❌ No image found in any part");
  console.error(
    "Parts detail:",
    JSON.stringify(candidate.content.parts, null, 2),
  );
  throw new Error("이미지 생성 결과를 찾을 수 없습니다.");
}
