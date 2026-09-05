// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectConnection } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { Connection } from 'mongoose';
import { AppConfig } from '../../config/configuration';
import { RecaptchaService } from '../../common/recaptcha/recaptcha.service';
import {
  AccountBlockedException,
  EmailNotVerifiedException,
  InvalidVerificationTokenException,
  RecaptchaVerificationFailedException,
} from '../../shared/exceptions/domain.exception';
import { OrganizationResponseDto } from '../organizations/dto/organization-response.dto';
import { OrganizationsService } from '../organizations/organizations.service';
import { EMAIL_PROVIDER } from '../sending/email-provider.interface';
import type { EmailProvider } from '../sending/email-provider.interface';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { UsersRepository } from '../users/users.repository';
import { UsersService } from '../users/users.service';
import { AuthResponseDto, TokenPairDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import {
  AuthenticatedUser,
  JwtPayload,
} from './interfaces/authenticated-user.interface';
import {
  buildOwnerNotificationEmail,
  buildVerificationEmail,
  SYSTEM_FROM_EMAIL,
  SYSTEM_FROM_NAME,
} from './registration-mailer';

const DEMO_OWNER_NOTIFICATION_EMAIL = 'arsi.india.info@gmail.com';
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

const BCRYPT_COST = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfig>,
    private readonly organizationsService: OrganizationsService,
    private readonly usersService: UsersService,
    private readonly usersRepository: UsersRepository,
    private readonly recaptchaService: RecaptchaService,
    @Inject(EMAIL_PROVIDER) private readonly emailProvider: EmailProvider,
  ) {}

  /**
   * `skipRecaptcha`/`skipNotificationEmails`/`skipEmailVerification` exist
   * only for trusted server-side callers that never go through the public
   * HTTP controller (e.g. `database/seed.ts`) — none is reachable from any
   * request DTO, so none can be used to bypass anything from outside.
   */
  async register(
    dto: RegisterDto,
    {
      skipRecaptcha = false,
      skipNotificationEmails = false,
      skipEmailVerification = false,
    }: {
      skipRecaptcha?: boolean;
      skipNotificationEmails?: boolean;
      skipEmailVerification?: boolean;
    } = {},
  ): Promise<RegisterResponseDto> {
    if (!skipRecaptcha && !(await this.recaptchaService.verify(dto.recaptchaToken))) {
      throw new RecaptchaVerificationFailedException();
    }
    if (await this.usersRepository.emailExists(dto.email)) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST);
    const session = await this.connection.startSession();
    try {
      const { organization, user } = await session.withTransaction(async () => {
        const org = await this.organizationsService.createOrganization(
          dto.organizationName,
          session,
        );
        const owner = await this.usersService.createOwner(
          org.id as string,
          dto.name,
          dto.email,
          passwordHash,
          session,
        );
        return { organization: org, user: owner };
      });

      let verificationToken: string | undefined;
      if (skipEmailVerification) {
        await this.usersRepository.markEmailVerified(user.id as string);
      } else {
        verificationToken = randomBytes(32).toString('hex');
        await this.usersRepository.setVerificationToken(
          user.id as string,
          verificationToken,
          new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
        );
      }

      if (!skipNotificationEmails && verificationToken) {
        await this.sendRegistrationEmails(
          dto.name,
          dto.email,
          organization.name,
          verificationToken,
        );
      }

      return {
        user: UserResponseDto.fromDocument(user),
        organization: OrganizationResponseDto.fromDocument(organization),
        message: skipEmailVerification
          ? 'Account created.'
          : 'Account created — check your email to verify it before signing in.',
      };
    } finally {
      await session.endSession();
    }
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    if (!(await this.recaptchaService.verify(dto.recaptchaToken))) {
      throw new RecaptchaVerificationFailedException();
    }
    const user = await this.usersRepository.findByEmailWithPassword(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (user.isBlocked) {
      throw new AccountBlockedException();
    }
    if (!user.emailVerified) {
      throw new EmailNotVerifiedException();
    }

    const organization = await this.organizationsService.getById(
      user.organizationId.toString(),
    );
    const tokens = await this.issueTokenPair({
      userId: user.id as string,
      organizationId: user.organizationId.toString(),
      role: user.role,
      isPlatformAdmin: user.isPlatformAdmin,
    });
    await this.persistRefreshToken(user.id as string, tokens.refreshToken);

    return {
      user: UserResponseDto.fromDocument(user),
      organization: OrganizationResponseDto.fromDocument(organization),
      ...tokens,
    };
  }

  async verifyEmail(token: string): Promise<{ verified: true }> {
    const user = await this.usersRepository.findByVerificationToken(token);
    if (
      !user?.emailVerificationExpiresAt ||
      user.emailVerificationExpiresAt.getTime() < Date.now()
    ) {
      throw new InvalidVerificationTokenException();
    }
    await this.usersRepository.markEmailVerified(user.id as string);
    return { verified: true };
  }

  async refresh(refreshToken: string): Promise<TokenPairDto> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.get('jwt.refreshSecret', { infer: true }),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersRepository.findByIdWithRefreshToken(
      payload.sub,
    );
    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }
    const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!matches) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }
    if (user.isBlocked) {
      throw new AccountBlockedException();
    }

    const tokens = await this.issueTokenPair({
      userId: user.id as string,
      organizationId: user.organizationId.toString(),
      role: user.role,
      isPlatformAdmin: user.isPlatformAdmin,
    });
    await this.persistRefreshToken(user.id as string, tokens.refreshToken);
    return tokens;
  }

  async logout(user: AuthenticatedUser): Promise<void> {
    await this.usersRepository.setRefreshTokenHash(user.userId, undefined);
  }

  private async issueTokenPair(
    claims: AuthenticatedUser,
  ): Promise<TokenPairDto> {
    const payload: JwtPayload = {
      sub: claims.userId,
      organizationId: claims.organizationId,
      role: claims.role,
      isPlatformAdmin: claims.isPlatformAdmin,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.accessSecret', { infer: true }),
        expiresIn: this.configService.get('jwt.accessTtl', { infer: true }),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.refreshSecret', { infer: true }),
        expiresIn: this.configService.get('jwt.refreshTtl', { infer: true }),
      }),
    ]);
    return { accessToken, refreshToken };
  }

  /** Best-effort: a transient email failure must never fail a registration that already succeeded. */
  private async sendRegistrationEmails(
    name: string,
    email: string,
    organizationName: string,
    verificationToken: string,
  ): Promise<void> {
    try {
      const owner = buildOwnerNotificationEmail({ name, email, organizationName });
      await this.emailProvider.send({
        to: DEMO_OWNER_NOTIFICATION_EMAIL,
        fromName: SYSTEM_FROM_NAME,
        fromEmail: SYSTEM_FROM_EMAIL,
        subject: 'New demo registration',
        html: owner.html,
        text: owner.text,
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Failed to send owner registration notification: ${err.message}`,
        err.stack,
      );
    }

    try {
      const appBaseUrl = this.configService.get('appBaseUrl', { infer: true });
      const verifyUrl = `${appBaseUrl}/verify-email/${verificationToken}`;
      const verification = buildVerificationEmail({ name, verifyUrl });
      await this.emailProvider.send({
        to: email,
        fromName: SYSTEM_FROM_NAME,
        fromEmail: SYSTEM_FROM_EMAIL,
        subject: 'Verify your email — demo sending limits inside',
        html: verification.html,
        text: verification.text,
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Failed to send verification email: ${err.message}`,
        err.stack,
      );
    }
  }

  private async persistRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const refreshTokenHash = await bcrypt.hash(refreshToken, BCRYPT_COST);
    await this.usersRepository.setRefreshTokenHash(userId, refreshTokenHash);
  }
}
