export async function combineImagesVertically(
  base64Images: string[],
  addPadding = false, // 프레임용 여백 추가 옵션
): Promise<string> {
  if (base64Images.length === 0) {
    throw new Error("이미지가 없습니다");
  }

  if (base64Images.length === 1) {
    return `data:image/png;base64,${base64Images[0]}`;
  }

  // Canvas 생성
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas context를 가져올 수 없습니다");
  }

  // 첫 번째 이미지로 크기 결정
  const firstImg = await loadImage(`data:image/png;base64,${base64Images[0]}`);
  const width = firstImg.width;
  const height = firstImg.height;

  // 여백 설정 (프레임 모드일 때)
  const padding = addPadding ? 60 : 0; // 상하좌우 60px 여백
  const innerSpacing = addPadding ? 10 : 0; // 이미지 간 간격

  // Canvas 크기 설정
  const totalInnerSpacing = innerSpacing * (base64Images.length - 1);
  canvas.width = width + padding * 2;
  canvas.height =
    height * base64Images.length + padding * 2 + totalInnerSpacing;

  // 흰 배경
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 각 이미지를 세로로 배치
  for (let i = 0; i < base64Images.length; i++) {
    const img = await loadImage(`data:image/png;base64,${base64Images[i]}`);
    const y = padding + i * (height + innerSpacing);
    ctx.drawImage(img, padding, y, width, height);
  }

  // Canvas를 base64로 변환
  return canvas.toDataURL("image/png");
}

/**
 * 이미지 로드 헬퍼
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error("이미지 로드 실패"));
    img.src = src;
  });
}

/**
 * base64를 Blob으로 변환
 */
export function base64ToBlob(base64: string, contentType = "image/png"): Blob {
  const base64Data = base64.split(",")[1] || base64;
  const byteCharacters = atob(base64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
}
