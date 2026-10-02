import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Prisma, UserStatus, type User, type UserCredentials } from '@prisma/client';

import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { AuthenticationException } from './auth.exception.js';
import { AuthTokenService } from './auth-token.service.js';
import { BusinessEmailDomainService } from './business-email-domain.service.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegisterDto } from './dto/register.dto.js';
import { PasswordService } from './password.service.js';
import {
  VERIFICATION_NOTIFICATION_SERVICE,
  type IVerificationNotificationService,
} from './verification-notification.service.js';

type UserWithCredentials = User & { credentials: UserCredentials | null };

export interface IAuthUserResponse {
  email: string;
  emailVerified: boolean;
  id: string;
  name: string;
  organizationId: string;
  role: User['role'];
}

export interface IAuthenticationResult {
  accessToken: string;
  refreshToken: string;
  user: IAuthUserResponse;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly domainService: BusinessEmailDomainService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: AuthTokenService,
    @Inject(VERIFICATION_NOTIFICATION_SERVICE)
    private readonly notificationService: IVerificationNotificationService,
  ) {}

  async register(
    dto: RegisterDto,
  ): Promise<{ user: IAuthUserResponse; verificationRequired: boolean }> {
    const email = this.domainService.normalizeEmail(dto.email);
    const domain = this.domainService.getDomain(email);
    if (this.domainService.isPersonalDomain(domain)) {
      throw new AuthenticationException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'PERSONAL_EMAIL_NOT_ALLOWED',
        'A company or business email address is required.',
      );
    }

    const verificationToken = this.tokenService.createOpaqueToken();
    const passwordHash = await this.passwordService.hash(dto.password);

    try {
      const user = await this.prisma.$transaction(async (transaction) => {
        // The domain is a stable organization identity, so later registrations cannot rename it.
        const organization = await transaction.organization.upsert({
          where: { emailDomain: domain },
          create: { name: dto.organizationName, emailDomain: domain, status: 'ACTIVE' },
          update: {},
        });
        return transaction.user.create({
          data: {
            name: dto.name,
            email,
            role: 'HR',
            emailVerified: false,
            status: 'ACTIVE',
            organizationId: organization.id,
            credentials: {
              create: {
                passwordHash,
                verificationTokenHash: this.tokenService.hashOpaqueToken(verificationToken),
                verificationTokenExpiresAt: this.tokenService.getVerificationTokenExpiration(),
              },
            },
          },
        });
      });
      await this.notificationService.send({ email, token: verificationToken });
      return { user: this.toUserResponse(user), verificationRequired: true };
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AuthenticationException(
          HttpStatus.CONFLICT,
          'EMAIL_ALREADY_REGISTERED',
          'An account with this email address already exists.',
        );
      }
      throw error;
    }
  }

  async verifyEmail(token: string): Promise<{ verified: boolean }> {
    const credentials = await this.prisma.userCredentials.findUnique({
      where: { verificationTokenHash: this.tokenService.hashOpaqueToken(token) },
      include: { user: true },
    });
    if (credentials === null) {
      throw new AuthenticationException(
        HttpStatus.UNAUTHORIZED,
        'INVALID_VERIFICATION_TOKEN',
        'The verification token is invalid.',
      );
    }
    if (credentials.user.emailVerified) {
      throw new AuthenticationException(
        HttpStatus.CONFLICT,
        'EMAIL_ALREADY_VERIFIED',
        'This email address is already verified.',
      );
    }
    if (
      credentials.verificationTokenExpiresAt === null ||
      credentials.verificationTokenExpiresAt <= new Date()
    ) {
      throw new AuthenticationException(
        HttpStatus.UNAUTHORIZED,
        'VERIFICATION_TOKEN_EXPIRED',
        'The verification token has expired.',
      );
    }
    await this.prisma.user.update({
      where: { id: credentials.userId },
      data: { emailVerified: true },
    });
    await this.prisma.userCredentials.update({
      where: { id: credentials.id },
      data: { verificationTokenExpiresAt: null },
    });
    return { verified: true };
  }

  async resendVerification(emailInput: string): Promise<{ verificationRequired: boolean }> {
    const email = this.domainService.normalizeEmail(emailInput);
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { credentials: true },
    });
    if (user === null || user.emailVerified || user.credentials === null) {
      return { verificationRequired: true };
    }
    const token = this.tokenService.createOpaqueToken();
    await this.prisma.userCredentials.update({
      where: { id: user.credentials.id },
      data: {
        verificationTokenHash: this.tokenService.hashOpaqueToken(token),
        verificationTokenExpiresAt: this.tokenService.getVerificationTokenExpiration(),
      },
    });
    await this.notificationService.send({ email: user.email, token });
    return { verificationRequired: true };
  }

  async login(dto: LoginDto): Promise<IAuthenticationResult> {
    const email = this.domainService.normalizeEmail(dto.email);
    // Domain policy is onboarding-only so existing verified accounts are not locked out by later policy changes.
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { credentials: true },
    });
    if (
      user === null ||
      user.credentials === null ||
      !(await this.passwordService.verify(dto.password, user.credentials.passwordHash))
    ) {
      throw new AuthenticationException(
        HttpStatus.UNAUTHORIZED,
        'INVALID_CREDENTIALS',
        'Email or password is incorrect.',
      );
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new AuthenticationException(
        HttpStatus.FORBIDDEN,
        'ACCOUNT_DISABLED',
        'This account is not active.',
      );
    }
    if (!user.emailVerified) {
      throw new AuthenticationException(
        HttpStatus.FORBIDDEN,
        'EMAIL_NOT_VERIFIED',
        'Verify your email address before signing in.',
      );
    }
    return this.issueAuthentication(user);
  }

  async refresh(refreshToken: string | undefined): Promise<IAuthenticationResult> {
    if (refreshToken === undefined) {
      throw new AuthenticationException(
        HttpStatus.UNAUTHORIZED,
        'INVALID_REFRESH_TOKEN',
        'The refresh token is invalid.',
      );
    }
    const credentials = await this.prisma.userCredentials.findUnique({
      where: { refreshTokenHash: this.tokenService.hashOpaqueToken(refreshToken) },
      include: { user: true },
    });
    if (
      credentials === null ||
      credentials.refreshTokenExpiresAt === null ||
      credentials.refreshTokenExpiresAt <= new Date() ||
      credentials.user.status !== UserStatus.ACTIVE ||
      !credentials.user.emailVerified
    ) {
      throw new AuthenticationException(
        HttpStatus.UNAUTHORIZED,
        'INVALID_REFRESH_TOKEN',
        'The refresh token is invalid.',
      );
    }
    return this.issueAuthentication({ ...credentials.user, credentials });
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (refreshToken !== undefined) {
      await this.prisma.userCredentials.updateMany({
        where: { refreshTokenHash: this.tokenService.hashOpaqueToken(refreshToken) },
        data: { refreshTokenHash: null, refreshTokenExpiresAt: null },
      });
    }
  }

  async getAuthenticatedUser(userId: string): Promise<IAuthenticatedUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user === null || user.status !== UserStatus.ACTIVE || !user.emailVerified) {
      return null;
    }
    return { id: user.id, organizationId: user.organizationId, role: user.role };
  }

  async getMe(userId: string): Promise<IAuthUserResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user === null) {
      throw new AuthenticationException(
        HttpStatus.UNAUTHORIZED,
        'UNAUTHORIZED',
        'Authentication is required.',
      );
    }
    return this.toUserResponse(user);
  }

  async verifyCurrentPassword(userId: string, password: string): Promise<void> {
    const credentials = await this.prisma.userCredentials.findUnique({ where: { userId } });
    if (
      credentials === null ||
      !(await this.passwordService.verify(password, credentials.passwordHash))
    ) {
      throw new AuthenticationException(
        HttpStatus.UNAUTHORIZED,
        'INVALID_CREDENTIALS',
        'Incorrect password.',
      );
    }
  }

  private async issueAuthentication(user: UserWithCredentials): Promise<IAuthenticationResult> {
    const refreshToken = this.tokenService.createOpaqueToken();
    await this.prisma.userCredentials.update({
      where: { userId: user.id },
      data: {
        refreshTokenHash: this.tokenService.hashOpaqueToken(refreshToken),
        refreshTokenExpiresAt: this.tokenService.getRefreshTokenExpiration(),
      },
    });
    const identity: IAuthenticatedUser = {
      id: user.id,
      organizationId: user.organizationId,
      role: user.role,
    };
    return {
      accessToken: await this.tokenService.createAccessToken(identity),
      refreshToken,
      user: this.toUserResponse(user),
    };
  }

  private toUserResponse(user: User): IAuthUserResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role,
      emailVerified: user.emailVerified,
    };
  }
}
