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
): Promise<PortraitResult> {
  const model = getGeminiModel();

  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType: "image/jpeg",
    },
  };

  const result = await model.generateContent([prompt, imagePart]);
  const response = result.response;

  // 응답 구조 검증
  if (!response.candidates || response.candidates.length === 0) {
    throw new Error("API 응답에 candidates가 없습니다.");
  }

  const candidate = response.candidates[0];
  if (!candidate?.content?.parts) {
    throw new Error("API 응답에 content.parts가 없습니다.");
  }

  // 응답에서 이미지 데이터 추출
  for (const part of candidate.content.parts) {
    if (part.inlineData) {
      return {
        generatedImage: part.inlineData.data,
        description: "AI 생성 포트레이트",
        prompt: prompt,
      };
    }
  }

  throw new Error("이미지 생성 결과를 찾을 수 없습니다.");
}
