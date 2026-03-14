// ============================================
// AppModule - NestJS 애플리케이션의 루트 모듈
// ============================================
// 역할: 모든 모듈을 하나로 묶어주는 최상위 모듈
// NestJS 앱이 시작될 때 이 모듈을 기준으로 의존성을 로드합니다.

import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ChatModule } from "./chat/chat.module";
import { SupabaseModule } from "./supabase/supabase.module";

@Module({
  imports: [
    // ConfigModule: 환경변수(.env 파일)를 로드하는 모듈
    // isGlobal: true → 다른 모듈에서 별도 import 없이 ConfigService 사용 가능
    // envFilePath: 루트의 .env.local 파일에서 환경변수 로드
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: "../.env.local",
    }),

    // SupabaseModule: Supabase 클라이언트를 제공하는 모듈 (전역)
    SupabaseModule,

    // ChatModule: 채팅 기능을 담당하는 모듈
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
