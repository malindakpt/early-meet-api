import { IsEmail, IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

import { CandidateStatus } from '@prisma/client';

export class CreateVacancyCandidateDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  phone!: string;

  @IsEnum(CandidateStatus)
  status!: CandidateStatus;
}
