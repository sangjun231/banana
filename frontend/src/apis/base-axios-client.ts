import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { ApiConfig, ApiError, ApiErrorResponse } from "@/types/api-types";

export abstract class BaseApiClient {
  protected readonly apiInstance: AxiosInstance;
  private readonly config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;

    // 원하는 만큼 인스턴스 생성 (환경별 설정 적용)
    this.apiInstance = axios.create({
      baseURL: config.apiUrl,
      timeout: config.timeout || 10000,
    });

    this.applyRequestInterceptor(this.apiInstance);
    this.applyResponseInterceptor(this.apiInstance);
  }

  private applyRequestInterceptor(instance: AxiosInstance): void {
    // 요청시 로컬스토리지에 토큰 있으면 자동 적용
    instance.interceptors.request.use((config) => {
      return config;
    });
  }

  private applyResponseInterceptor(instance: AxiosInstance): void {
    instance.interceptors.response.use(
      (response) => {
        return response.data;
      },
      (error: AxiosError<ApiErrorResponse>) => {
        return this.handleApiError(error);
      },
    );
  }

  // 통합 에러 처리
  private handleApiError(error: AxiosError<ApiErrorResponse>): never {
    // console.error("error in handleApiError ===========>", error);
    const { status = 500, data } = error.response || {};
    const message = data?.message || error.message;

    // 로깅 (개발 환경에서만)
    if (this.config.enableLogging && process.env.NODE_ENV === "development") {
      console.error(`API Error [${status}]:`, message, data);
    }

    // 상태별 처리
    switch (status) {
      case 400:
        throw new ApiError(status, message || "잘못된 요청입니다.", data);
      case 401:
        throw new ApiError(status, message || "인증이 필요합니다.", data);
      case 403:
        throw new ApiError(status, message || "접근 권한이 없습니다.", data);
      case 404:
        throw new ApiError(
          status,
          message || "요청한 리소스를 찾을 수 없습니다.",
          data,
        );
      case 500:
        throw new ApiError(
          status,
          message || "서버 오류가 발생했습니다.",
          data,
        );
      default:
        throw new ApiError(
          status,
          message || "알 수 없는 오류가 발생했습니다.",
          data,
        );
    }
  }

  // 재시도 로직
  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = this.config.retryAttempts || 3,
  ): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        if (
          i === maxRetries - 1 ||
          (error instanceof ApiError && (error as ApiError).status < 500)
        ) {
          throw error;
        }
        // 지수 백오프 (1초, 2초, 4초...)
        await this.delay(1000 * 2 ** i);
      }
    }
    throw new Error("Max retries reached");
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // HTTP 메서드 (타입 안전성 및 요청 취소 지원)
  protected get<T = unknown>(
    url: string,
    config?: AxiosRequestConfig & { signal?: AbortSignal },
  ): Promise<T> {
    return this.retryRequest(
      () => this.apiInstance.get(url, config) as Promise<T>,
    );
  }

  protected delete<T = unknown>(
    url: string,
    config?: AxiosRequestConfig & { signal?: AbortSignal },
  ): Promise<T> {
    return this.retryRequest(
      () => this.apiInstance.delete(url, config) as Promise<T>,
    );
  }

  protected post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig & { signal?: AbortSignal },
  ): Promise<T> {
    return this.retryRequest(
      () => this.apiInstance.post(url, data, config) as Promise<T>,
    );
  }

  protected put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig & { signal?: AbortSignal },
  ): Promise<T> {
    return this.retryRequest(
      () => this.apiInstance.put(url, data, config) as Promise<T>,
    );
  }

  protected patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig & { signal?: AbortSignal },
  ): Promise<T> {
    return this.retryRequest(
      () => this.apiInstance.patch(url, data, config) as Promise<T>,
    );
  }
}
