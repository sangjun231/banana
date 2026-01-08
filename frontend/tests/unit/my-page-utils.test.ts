import { describe, it, expect } from "vitest";
import { filterImagesWithUrl } from "@/features/gen/utils/image-filters";
import { getImageAltText } from "@/features/gen/utils/image-helpers";
import { Portrait } from "@/types/types";

describe("filterImagesWithUrl", () => {
  it("image_url이 있는 이미지만 필터링해야 한다", () => {
    // Given: image_url이 있는 이미지와 없는 이미지가 섞인 배열
    const images: Portrait[] = [
      {
        id: "1",
        image_url: "https://example.com/image1.jpg",
        gen_category: "memorial",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: null,
        user_id: "user-1",
      },
      {
        id: "2",
        image_url: null,
        gen_category: "memorial",
        created_at: "2024-01-02T00:00:00Z",
        updated_at: null,
        user_id: "user-1",
      },
      {
        id: "3",
        image_url: "https://example.com/image3.jpg",
        gen_category: "memorial",
        created_at: "2024-01-03T00:00:00Z",
        updated_at: null,
        user_id: "user-1",
      },
    ];

    // When: 필터링 함수를 실행하면
    const result = filterImagesWithUrl(images);

    // Then: image_url이 있는 이미지만 반환된다
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("1");
    expect(result[1].id).toBe("3");
    expect(result.every((img) => img.image_url !== null)).toBe(true);
  });

  it("빈 배열을 받으면 빈 배열을 반환해야 한다", () => {
    // Given: 빈 배열
    const images: Portrait[] = [];

    // When: 필터링 함수를 실행하면
    const result = filterImagesWithUrl(images);

    // Then: 빈 배열을 반환한다
    expect(result).toHaveLength(0);
  });

  it("모든 이미지가 image_url이 없으면 빈 배열을 반환해야 한다", () => {
    // Given: image_url이 모두 null인 이미지 배열
    const images: Portrait[] = [
      {
        id: "1",
        image_url: null,
        gen_category: "memorial",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: null,
        user_id: "user-1",
      },
      {
        id: "2",
        image_url: null,
        gen_category: "memorial",
        created_at: "2024-01-02T00:00:00Z",
        updated_at: null,
        user_id: "user-1",
      },
    ];

    // When: 필터링 함수를 실행하면
    const result = filterImagesWithUrl(images);

    // Then: 빈 배열을 반환한다
    expect(result).toHaveLength(0);
  });
});

describe("getImageAltText", () => {
  it("gen_category가 있으면 gen_category를 반환해야 한다", () => {
    // Given: gen_category가 있는 이미지
    const image: Portrait = {
      id: "1",
      image_url: "https://example.com/image1.jpg",
      gen_category: "memorial",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: null,
      user_id: "user-1",
    };

    // When: alt 텍스트를 가져오면
    const result = getImageAltText(image);

    // Then: gen_category가 반환된다
    expect(result).toBe("memorial");
  });

  it('gen_category가 null이면 기본값 "이미지"를 반환해야 한다', () => {
    // Given: gen_category가 null인 이미지
    const image: Portrait = {
      id: "1",
      image_url: "https://example.com/image1.jpg",
      gen_category: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: null,
      user_id: "user-1",
    };

    // When: alt 텍스트를 가져오면
    const result = getImageAltText(image);

    // Then: 기본값 "이미지"가 반환된다
    expect(result).toBe("이미지");
  });

  it('gen_category가 빈 문자열이면 기본값 "이미지"를 반환해야 한다', () => {
    // Given: gen_category가 빈 문자열인 이미지
    const image: Portrait = {
      id: "1",
      image_url: "https://example.com/image1.jpg",
      gen_category: "",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: null,
      user_id: "user-1",
    };

    // When: alt 텍스트를 가져오면
    const result = getImageAltText(image);

    // Then: 기본값 "이미지"가 반환된다
    expect(result).toBe("이미지");
  });
});
