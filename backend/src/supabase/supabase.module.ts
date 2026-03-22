// ============================================
// SupabaseModule - Supabase 클라이언트 제공 모듈
// ============================================
// 역할: Supabase 연결을 관리하고, 다른 모듈에서 사용할 수 있도록 제공
// @Global() 데코레이터로 전역 모듈로 설정되어 있어서
// 다른 모듈에서 별도 import 없이 SupabaseService를 주입받을 수 있습니다.

import { Global, Module } from "@nestjs/common";
import { SupabaseService } from "./supabase.service";

@Global() // 전역 모듈: 한 번 import하면 모든 모듈에서 사용 가능
@Module({
  providers: [SupabaseService], // 이 모듈이 제공하는 서비스
  exports: [SupabaseService], // 외부 모듈에서 사용할 수 있도록 내보내기
})
export class SupabaseModule {}
