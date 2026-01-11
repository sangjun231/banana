import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS 설정 (Next.js와 통신하기 위해)
  const rawOrigins = process.env.FRONTEND_URL;
  const originList = rawOrigins
    ? rawOrigins
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    : ["http://localhost:3000"];

  app.enableCors({
    origin: originList,
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 Backend server is running on: http://localhost:${port}`);
}

bootstrap();
