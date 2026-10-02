import { IsArray, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { AssessmentAreaImportance } from '@prisma/client';

export class UpdateExperienceCompetencyAreaDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsEnum(AssessmentAreaImportance)
  importance?: AssessmentAreaImportance;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  whatToEstablish?: string[];
}