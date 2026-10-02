import { IsEnum } from 'class-validator';

import { InvitationStatus } from '@prisma/client';

export class UpdateInterviewInvitationDto {
  @IsEnum(InvitationStatus)
  status!: InvitationStatus;
}
