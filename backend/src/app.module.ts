import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { RtcModule } from "./rtc/rtc.module";

@Module({
  imports: [RtcModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
