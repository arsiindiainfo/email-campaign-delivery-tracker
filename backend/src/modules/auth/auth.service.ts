// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectConnection } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Connection } from 'mongoose';
import { AppConfig } from '../../config/configuration';
import { OrganizationResponseDto } from '../organizations/dto/organization-response.dto';
import { OrganizationsService } from '../organizations/organizations.service';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { UsersRepository } from '../users/users.repository';
import { UsersService } from '../users/users.service';
import { AuthResponseDto, TokenPairDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  AuthenticatedUser,
  JwtPayload,
} from './interfaces/authenticated-user.interface';

const BCRYPT_COST = 12;

@Injectable()
export class AuthService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfig>,
    private readonly organizationsService: OrganizationsService,
    private readonly usersService: UsersService,
    private readonly usersRepository: UsersRepository,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
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

      const tokens = await this.issueTokenPair({
        userId: user.id as string,
        organizationId: organization.id as string,
        role: user.role,
      });
      await this.persistRefreshToken(user.id as string, tokens.refreshToken);

      return {
        user: UserResponseDto.fromDocument(user),
        organization: OrganizationResponseDto.fromDocument(organization),
        ...tokens,
      };
    } finally {
      await session.endSession();
    }
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
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

    const organization = await this.organizationsService.getById(
      user.organizationId.toString(),
    );
    const tokens = await this.issueTokenPair({
      userId: user.id as string,
      organizationId: user.organizationId.toString(),
      role: user.role,
    });
    await this.persistRefreshToken(user.id as string, tokens.refreshToken);

    return {
      user: UserResponseDto.fromDocument(user),
      organization: OrganizationResponseDto.fromDocument(organization),
      ...tokens,
    };
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

    const tokens = await this.issueTokenPair({
      userId: user.id as string,
      organizationId: user.organizationId.toString(),
      role: user.role,
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

  private async persistRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const refreshTokenHash = await bcrypt.hash(refreshToken, BCRYPT_COST);
    await this.usersRepository.setRefreshTokenHash(userId, refreshTokenHash);
  }
}
