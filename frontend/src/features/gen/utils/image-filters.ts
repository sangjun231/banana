import { Portrait } from "@/types/types";

/**
 * image_url이 있는 이미지만 필터링하는 함수
 * @param images - 필터링할 이미지 배열
 * @returns image_url이 있는 이미지 배열
 */
export function filterImagesWithUrl(
  images: Portrait[],
): (Portrait & { image_url: string })[] {
  return images.filter(
    (image): image is Portrait & { image_url: string } => !!image.image_url,
  );
}
