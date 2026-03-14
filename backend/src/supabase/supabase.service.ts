// ============================================
// SupabaseService - Supabase 클라이언트 서비스
// ============================================
// 역할: Supabase 클라이언트 인스턴스를 생성하고 관리
// 다른 서비스에서 this.supabaseService.getClient()로 클라이언트를 가져와 사용

import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

@Injectable()
export class SupabaseService implements OnModuleInit {
  // Supabase 클라이언트 인스턴스 (초기화 전까지 undefined)
  private supabase!: SupabaseClient;

  // ConfigService: 환경변수를 읽어오는 NestJS 내장 서비스
  constructor(private readonly configService: ConfigService) {}

  // onModuleInit: 모듈이 초기화될 때 자동으로 호출되는 라이프사이클 훅
  // 여기서 Supabase 클라이언트를 생성합니다.
  onModuleInit() {
    // 환경변수에서 Supabase URL 가져오기 (프론트엔드와 공유)
    const supabaseUrl = this.configService.get<string>(
      "NEXT_PUBLIC_SUPABASE_URL",
    );

    // 환경변수에서 Service Role Key 가져오기
    // ※ Service Role Key는 RLS를 우회할 수 있는 관리자 키입니다.
    // ※ 백엔드에서는 반드시 Service Role Key를 사용해야 합니다.
    const supabaseKey = this.configService.get<string>(
      "SUPABASE_SERVICE_ROLE_KEY",
    );

    // 필수 환경변수가 없으면 에러 발생
    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in .env.local",
      );
    }

    // Supabase 클라이언트 생성
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // 다른 서비스에서 Supabase 클라이언트를 가져갈 때 사용하는 메서드
  getClient(): SupabaseClient {
    return this.supabase;
  }
}
