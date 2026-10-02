import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { AssessmentAreaImportance } from '@prisma/client';

export class CreateExperienceCompetencyQuestionDto {
  @IsString()
  @MaxLength(1_000)
  questionText!: string;
}

export class CreateExperienceCompetencyAreaDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsEnum(AssessmentAreaImportance)
  importance!: AssessmentAreaImportance;

  @IsString()
  @MaxLength(500)
  reason!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  whatToEstablish!: string[];

  @IsArray()
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => CreateExperienceCompetencyQuestionDto)
  questions!: CreateExperienceCompetencyQuestionDto[];
}