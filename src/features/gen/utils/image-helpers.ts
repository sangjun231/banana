import { Portrait } from "@/types/types";

/**
 * 이미지의 alt 텍스트를 생성하는 함수
 * gen_category가 있으면 사용하고, 없으면 기본값 "이미지"를 반환
 * @param image - 이미지 객체
 * @returns alt 텍스트
 */
export function getImageAltText(image: Portrait): string {
  // gen_category가 있고 빈 문자열이 아니면 사용
  if (image.gen_category && image.gen_category.trim() !== "") {
    return image.gen_category;
  }
  // 그렇지 않으면 기본값 반환
  return "이미지";
}
