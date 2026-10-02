import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import type { IEnvironmentVariables } from '../../infrastructure/config/environment.validation.js';
import { AuthService, type IAuthenticationResult, type IAuthUserResponse } from './auth.service.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { ResendVerificationDto } from './dto/resend-verification.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { AuthenticationGuard } from './guards/authentication.guard.js';

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService<IEnvironmentVariables, true>,
  ) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
  ): Promise<{ user: IAuthUserResponse; verificationRequired: boolean }> {
    return this.authService.register(dto);
  }

  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<{ verified: boolean }> {
    return this.authService.verifyEmail(dto.token);
  }

  @Post('resend-verification')
  @HttpCode(202)
  async resendVerification(
    @Body() dto: ResendVerificationDto,
  ): Promise<{ verificationRequired: boolean }> {
    return this.authService.resendVerification(dto.email);
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ user: IAuthUserResponse }> {
    const result = await this.authService.login(dto);
    this.setAuthenticationCookies(response, result);
    return { user: result.user };
  }

  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ user: IAuthUserResponse }> {
    const result = await this.authService.refresh(this.getCookie(request, REFRESH_COOKIE));
    this.setAuthenticationCookies(response, result);
    return { user: result.user };
  }

  @Post('logout')
  @HttpCode(204)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.logout(this.getCookie(request, REFRESH_COOKIE));
    response.clearCookie(ACCESS_COOKIE, this.accessCookieOptions());
    response.clearCookie(REFRESH_COOKIE, this.refreshCookieOptions());
  }

  @Get('me')
  @UseGuards(AuthenticationGuard)
  async me(@CurrentUser() user: IAuthenticatedUser): Promise<{ user: IAuthUserResponse }> {
    return { user: await this.authService.getMe(user.id) };
  }

  private getCookie(request: Request, name: string): string | undefined {
    const value = request.cookies?.[name];
    return typeof value === 'string' ? value : undefined;
  }

  private setAuthenticationCookies(response: Response, result: IAuthenticationResult): void {
    response.cookie(ACCESS_COOKIE, result.accessToken, {
      ...this.accessCookieOptions(),
      maxAge: 1000 * 60 * 15,
    });
    response.cookie(REFRESH_COOKIE, result.refreshToken, {
      ...this.refreshCookieOptions(),
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });
  }

  private accessCookieOptions(): {
    httpOnly: boolean;
    path: string;
    sameSite: 'lax';
    secure: boolean;
  } {
    return {
      httpOnly: true,
      secure: this.config.getOrThrow('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/api/v1',
    };
  }

  private refreshCookieOptions(): {
    httpOnly: boolean;
    path: string;
    sameSite: 'lax';
    secure: boolean;
  } {
    return {
      ...this.accessCookieOptions(),
      path: '/api/v1/auth',
    };
  }
}
