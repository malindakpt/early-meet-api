import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { AssessmentAreaImportance } from '@prisma/client';

export class SaveExperienceCompetencyQuestionDto {
  @IsString()
  @MaxLength(1_000)
  questionText!: string;
}

export class SaveExperienceCompetencyAreaDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsEnum(AssessmentAreaImportance)
  importance?: AssessmentAreaImportance;

  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => SaveExperienceCompetencyQuestionDto)
  questions!: SaveExperienceCompetencyQuestionDto[];
}

export class SaveExperienceCompetencyConfigurationDto {
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => SaveExperienceCompetencyAreaDto)
  areas!: SaveExperienceCompetencyAreaDto[];
}
