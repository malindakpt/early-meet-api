import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

import { Difficulty, type Prisma } from '@prisma/client';

export class CreateQuestionDto {
  @IsUUID()
  technologyId!: string;

  @IsUUID()
  technologySegmentId!: string;

  @IsEnum(Difficulty)
  difficulty!: Difficulty;

  @Type(() => Number)
  @IsInt()
  @Min(30)
  @Max(900)
  estimatedAnswerTimeSeconds!: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  questionType!: string;

  @IsBoolean()
  followUpAllowed!: boolean;

  @IsString()
  @MinLength(1)
  questionText!: string;

  @IsObject()
  evaluationCriteria!: Prisma.InputJsonObject;

  @IsObject()
  metaData!: Prisma.InputJsonObject;
}
