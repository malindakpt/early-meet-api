import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

import { TechnologyStatus } from '@prisma/client';

export class CreateTechnologyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsEnum(TechnologyStatus)
  status!: TechnologyStatus;
}
