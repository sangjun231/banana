import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export function getGeminiModel(modelName = "gemini-2.5-flash-image") {
  return genAI.getGenerativeModel({ model: modelName });
}

export async function generatePortrait(imageBase64: string, prompt: string) {
  const model = getGeminiModel();

  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType: "image/jpeg",
    },
  };

  const result = await model.generateContent([prompt, imagePart]);
  const response = result.response;
  return response.text();
}
