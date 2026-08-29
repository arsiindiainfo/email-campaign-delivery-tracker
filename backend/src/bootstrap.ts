// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import {
  INestApplication,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppConfig } from './config/configuration';

/**
 * Shared between main.ts (real server) and e2e tests, so a test app exercises
 * the exact same global prefix, pipes, and middleware production traffic hits
 * — nothing here is main.ts-only.
 */
export function configureApp(app: INestApplication): void {
  const configService = app.get(ConfigService<AppConfig>);

  app.use(helmet());
  app.use(
    (
      _req: unknown,
      res: { setHeader: (name: string, value: string) => void },
      next: () => void,
    ) => {
      res.setHeader('X-Powered-By', 'Arsi-India-Info');
      next();
    },
  );

  app.enableCors({
    origin: configService.get('corsOrigins', { infer: true }),
    credentials: true,
  });

  app.setGlobalPrefix('api/v1', {
    exclude: [
      { path: 't/o/:token', method: RequestMethod.GET },
      { path: 't/c/:token', method: RequestMethod.GET },
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (configService.get('nodeEnv', { infer: true }) !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Email Campaign & Delivery Tracking Platform API')
      .setDescription(
        'Campaign authoring, delivery tracking and analytics API — Arsi India Info',
      )
      .setVersion('1.0')
      .setContact(
        'Arsi India Info',
        'https://arsiindiainfo.com',
        'hello@arsiindiainfo.com',
      )
      .setLicense(
        'MIT (code) + TRADEMARK.md (name & logo)',
        'https://github.com/arsiindiainfo/email-campaign-delivery-tracker/blob/main/LICENSE',
      )
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }
}
