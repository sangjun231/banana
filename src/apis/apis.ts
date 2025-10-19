import { User } from "@supabase/supabase-js";
import { ApiConfig } from "@/types/api-types";
import { NanoBanana } from "@/types/types";
import { BaseApiClient } from "./base-axios-client";

class ApiClient extends BaseApiClient {
  constructor() {
    // 환경별 설정
    const config: ApiConfig = {
      apiUrl:
        process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
        "/",
      timeout: 15000,
      retryAttempts: 3,
      enableLogging: process.env.NODE_ENV === "development",
    };

    if (!config.apiUrl) {
      throw new Error("API_URL과 ADMIN_API_URL이 설정되지 않았습니다.");
    }

    super(config);
  }

  // == 도메인 메서드 (AbortSignal 지원) ==
  // 여기에 계속 추가...
  public getUser = () => {
    return this.get<User>("/api/auth/user");
  };

  public logOut = () => {
    return this.delete<void>("/api/auth/logout");
  };

  // 이미지 생성
  public postGenMemorialPhoto = (image: File) => {
    const formData = new FormData();
    formData.append("image", image);

    return this.post<{ base64Image: string }>("/api/gen", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 120000, // 이미지 생성은 오래 걸릴 수 있으므로 타임아웃을 2분으로 설정
    });
  };

  // 생성된 이미지 저장
  public postSaveMemorialPhoto = (image: File, category: string) => {
    const formData = new FormData();
    formData.append("image", image);

    return this.post<{ base64Image: string }>("/api/image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      params: {
        category,
      },
    });
  };

  // 하나의 특정한 이미지 조회
  public getMemorialPhoto = (id: string, category: string) => {
    return this.get<NanoBanana>(`/api/image/${id}`, {
      params: {
        category,
      },
    });
  };

  // 유저의 모든 이미지 조회
  public getMemorialPhotos = (category: string) => {
    return this.get<NanoBanana[]>(`/api/image`, {
      params: {
        category,
      },
    });
  };
}

const api = new ApiClient();
export default api;
