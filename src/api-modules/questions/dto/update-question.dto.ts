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

export class UpdateQuestionDto {
  @IsOptional()
  @IsUUID()
  technologyId?: string;

  @IsOptional()
  @IsUUID()
  technologySegmentId?: string;

  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(30)
  @Max(900)
  estimatedAnswerTimeSeconds?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  questionType?: string;

  @IsOptional()
  @IsBoolean()
  followUpAllowed?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(1)
  questionText?: string;

  @IsOptional()
  @IsObject()
  evaluationCriteria?: Prisma.InputJsonObject;

  @IsOptional()
  @IsObject()
  metaData?: Prisma.InputJsonObject;
}
