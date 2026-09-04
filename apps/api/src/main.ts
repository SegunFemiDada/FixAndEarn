//path: apps/api/src/main.ts
import "reflect-metadata";
import {
  Logger,
  ValidationPipe,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import * as express from "express";
import { join } from "path";
import cookieParser = require("cookie-parser");
import { randomUUID } from "crypto";
import { AllExceptionsFilter } from "./common/http/all-exceptions.filter";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    rawBody: true,
  });
  app.use(cookieParser());
      app.use(
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      const incomingRequestId =
  req.headers["x-request-id"];

const isValidRequestId =
  typeof incomingRequestId === "string" &&
  /^[A-Za-z0-9._:-]{1,128}$/.test(
    incomingRequestId,
  );

const requestId =
  isValidRequestId
    ? incomingRequestId
    : randomUUID();

      req.headers["x-request-id"] = requestId;
      res.setHeader(
        "X-Request-Id",
        requestId,
      );

      (req as express.Request & {
        requestId?: string;
      }).requestId = requestId;

      next();
    },
  );
  const uploadsPath = join(process.cwd(), 'apps/api/uploads');
app.use('/uploads', express.static(uploadsPath));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );
    app.useGlobalFilters(
    new AllExceptionsFilter(),
  );
app.enableCors({
  origin: [
    "https://fixandearn.com",
    "https://www.fixandearn.com",
  ],
  methods: [
    "GET",
    "HEAD",
    "PUT",
    "PATCH",
    "POST",
    "DELETE",
    "OPTIONS",
  ],
  credentials: true,
});

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

void bootstrap().catch((error) => {
  const logger = new Logger("Bootstrap");

  logger.error(
    "Failed to start FixAndEarn API",
    error instanceof Error
      ? error.stack
      : String(error),
  );

  process.exit(1);
});