import { type ClassValue, clsx } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function downloadImageMO(finalPoster: string, fileName: string) {
  try {
    // base64 문자열을 Blob으로 변환
    const response = await fetch(finalPoster);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `generated-${fileName || "user"}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("모바일 이미지 다운로드 중 오류:", error);
    toast.error("이미지를 길게 눌러 저장하세요!");
  }
}

export function downloadImagePC(finalPoster: string, fileName: string) {
  try {
    const link = document.createElement("a");
    link.download = `generated-${fileName || "user"}.png`;

    // base64 문자열을 직접 사용
    link.href = finalPoster;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Html2Canvas 이미지 다운로드 중 오류 발생:", error);
    const fallbackMessage =
      "대안 방법으로도 이미지 다운로드에 실패했습니다.\n\n" +
      "수동 저장 방법:\n" +
      "화면을 스크린샷으로 저장해주세요\n" +
      "- PC: Ctrl+Shift+S 또는 Print Screen\n" +
      "- Mac: Cmd+Shift+4\n" +
      "- 모바일: 스크린샷 기능 사용";
    toast.error(fallbackMessage);
  }
}

export function base64ToFile(
  base64Image: string,
  fileName: string,
  fileType: string,
) {
  // 1. base64 문자열을 Blob으로 변환
  const base64Data = base64Image.split(",")[1]; // "data:image/webp;base64," 제거
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: fileType });

  // 2. Blob을 File로 변환
  const file = new File([blob], fileName, {
    type: fileType,
  });

  return file;
}
