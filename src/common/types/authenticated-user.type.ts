import type { UserRole } from '@prisma/client';

export interface IAuthenticatedUser {
  id: string;
  organizationId: string;
  role: UserRole;
}
