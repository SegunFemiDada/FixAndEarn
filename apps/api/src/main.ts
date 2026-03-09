//path: apps/api/src/main.ts
import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import * as express from "express";
import * as path from "path";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { cors: true });

  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>("API_PORT", 3000);

  const swaggerConfig = new DocumentBuilder()
    .setTitle("FixAndEarn API")
    .setDescription("FixAndEarn REST API (backend-first)")
    .setVersion("0.0.1")
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document);

  await app.listen(port);
}

void bootstrap();