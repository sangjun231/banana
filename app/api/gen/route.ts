import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// Gemini API가 요구하는 형식으로 파일을 변환하는 헬퍼 함수
async function fileToGenerativePart(file: File): Promise<Part> {
  const base64EncodedData = await file
    .arrayBuffer()
    .then((bytes) => Buffer.from(bytes).toString("base64"));
  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    // 1. API 키 확인
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY is not set in environment variables.");
    }

    // 2. Multipart/form-data 파싱 및 이미지 파일 가져오기
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided." },
        { status: 400 },
      );
    }

    // 3. Gemini API 클라이언트 초기화
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-image",
    });

    // 4. 프롬프트 및 이미지 데이터 준비
    const prompt = `
      Transform this portrait photo into a Korean standard memorial portrait style.
      IMPORTANT: You MUST generate and return an IMAGE, not text.
      
      Requirements:
      - Background: Change to a solid, calm sky blue or gray color
      - Clothing: Dress in black or dark navy formal suit. Tie is optional
      - Face and expression: Maintain the original person's facial features and expression as much as possible, while making it look natural and dignified
      - Quality: Generate a high-resolution, clear image
      
      DO NOT respond with text. ONLY return the transformed image.
    `;
    const imagePart = await fileToGenerativePart(file);

    // 5. Gemini API 호출
    const result = await model.generateContent([prompt, imagePart]);

    // 6. 결과 처리 및 응답
    const response = result.response;
    const parts = response.candidates?.[0]?.content?.parts;

    if (!parts || parts.length === 0) {
      console.error("No parts returned from Gemini API");
      return NextResponse.json(
        { error: "AI가 응답을 생성하지 못했습니다. 다시 시도해주세요." },
        { status: 500 },
      );
    }

    // 이미지 데이터 찾기
    for (const part of parts) {
      if (part.text) {
        console.log("AI 텍스트 응답:", part.text);
      }
      if (part.inlineData) {
        const { mimeType, data } = part.inlineData as {
          mimeType: string;
          data: string;
        };
        const base64Image = `data:${mimeType};base64,${data}`;
        return NextResponse.json({ base64Image }, { status: 200 });
      }
    }

    // 이미지를 찾지 못한 경우
    console.error("No image data returned from Gemini API");
    return NextResponse.json(
      {
        error: "AI가 이미지 대신 텍스트를 반환했습니다. 다시 시도해주세요.",
      },
      { status: 500 },
    );
  } catch (error) {
    console.error("Error in image generation route:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 },
    );
  }
}
