import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { TechnologySegmentStatus } from '@prisma/client';

export class UpdateTechnologySegmentDto {
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
  @IsEnum(TechnologySegmentStatus)
  status?: TechnologySegmentStatus;
}
