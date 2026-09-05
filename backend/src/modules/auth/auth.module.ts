// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppConfig } from '../../config/configuration';
import { RecaptchaService } from '../../common/recaptcha/recaptcha.service';
import { OrganizationsModule } from '../organizations/organizations.module';
import { SendingModule } from '../sending/sending.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig>) => ({
        secret: configService.get('jwt.accessSecret', { infer: true }),
        signOptions: {
          expiresIn: configService.get('jwt.accessTtl', { infer: true }),
        },
      }),
    }),
    OrganizationsModule,
    UsersModule,
    SendingModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RecaptchaService],
})
export class AuthModule {}
