import { Module } from "@nestjs/common";
import { RtcGateway } from "./rtc.gateway";
import { RtcService } from "./rtc.service";

@Module({
  providers: [RtcGateway, RtcService],
})
export class RtcModule {}
