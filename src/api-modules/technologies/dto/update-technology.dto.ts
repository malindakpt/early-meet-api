import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { TechnologyStatus } from '@prisma/client';

export class UpdateTechnologyDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string;

  @IsOptional()
  @IsEnum(TechnologyStatus)
  status?: TechnologyStatus;
}
