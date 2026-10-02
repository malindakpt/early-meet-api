import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

import { TechnologySegmentStatus } from '@prisma/client';

export class CreateTechnologySegmentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsEnum(TechnologySegmentStatus)
  status!: TechnologySegmentStatus;
}
