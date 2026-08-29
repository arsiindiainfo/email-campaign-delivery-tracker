// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { ConfigService } from '@nestjs/config';
import { Params } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import { AppConfig } from './configuration';

export function buildLoggerOptions(
  configService: ConfigService<AppConfig>,
): Params {
  const nodeEnv = configService.get('nodeEnv', { infer: true });
  const isProduction = nodeEnv === 'production';

  return {
    pinoHttp: {
      level: isProduction ? 'info' : 'debug',
      genReqId: (req: { headers: Record<string, unknown> }) =>
        (req.headers['x-correlation-id'] as string | undefined) ?? randomUUID(),
      redact: ['req.headers.authorization', 'req.headers.cookie'],
      autoLogging: nodeEnv !== 'test',
      transport: isProduction
        ? undefined
        : {
            target: 'pino-pretty',
            options: { singleLine: true, translateTime: 'HH:MM:ss' },
          },
    },
  };
}
