import { Test, TestingModule } from "@nestjs/testing";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

describe("AppController", () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe("getHello", () => {
    it('should return "Hello from NestJS Backend!"', () => {
      expect(appController.getHello()).toBe("Hello from NestJS Backend!");
    });
  });

  describe("getHealth", () => {
    it("should return health status", () => {
      const result = appController.getHealth();
      expect(result.status).toBe("ok");
      expect(result.message).toBe("Backend is running!");
      expect(result.timestamp).toBeDefined();
    });
  });
});
