import { IsArray, IsEnum, IsString, IsUUID } from 'class-validator';

import { RequirementType } from '@prisma/client';

export class CreateVacancyTechnologyDto {
  @IsUUID()
  technologyId!: string;

  @IsArray()
  @IsString({ each: true })
  segmentSelections!: string[];

  @IsEnum(RequirementType)
  requirementType!: RequirementType;
}
