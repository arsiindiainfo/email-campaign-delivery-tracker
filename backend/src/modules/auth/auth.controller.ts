// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { AuthResponseDto, TokenPairDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  @Post('register')
  @ApiOperation({
    summary: 'Create a new organization and its first (OWNER) user — issues no tokens, requires email verification first',
  })
  register(@Body() dto: RegisterDto): Promise<RegisterResponseDto> {
    return this.authService.register(dto);
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 3_600_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('verify-email/:token')
  @ApiOperation({ summary: 'Verify an email address using the token from the verification email' })
  verifyEmail(@Param('token') token: string): Promise<{ verified: true }> {
    return this.authService.verifyEmail(token);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({
    summary: 'Authenticate and issue an access/refresh token pair',
  })
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @ApiOperation({ summary: 'Rotate an access/refresh token pair' })
  refresh(@Body() dto: RefreshTokenDto): Promise<TokenPairDto> {
    return this.authService.refresh(dto.refreshToken);
  }

  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @ApiOperation({ summary: 'Revoke the current refresh token' })
  async logout(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ loggedOut: true }> {
    await this.authService.logout(user);
    return { loggedOut: true };
  }
}
