import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

import { RequirementType } from '@prisma/client';

export class UpdateVacancyTechnologyDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  segmentSelections?: string[];

  @IsOptional()
  @IsEnum(RequirementType)
  requirementType?: RequirementType;
}
