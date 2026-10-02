import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AuthTokenService } from './auth-token.service.js';
import { BusinessEmailDomainService } from './business-email-domain.service.js';
import { AuthenticationGuard } from './guards/authentication.guard.js';
import { PlatformAdminGuard } from './guards/platform-admin.guard.js';
import { PasswordService } from './password.service.js';
import { EmailModule } from '../email/email.module.js';

@Module({
  imports: [EmailModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthTokenService,
    AuthenticationGuard,
    PlatformAdminGuard,
    BusinessEmailDomainService,
    PasswordService,
  ],
  exports: [AuthService, AuthTokenService, AuthenticationGuard, PlatformAdminGuard],
})
export class AuthModule {}
