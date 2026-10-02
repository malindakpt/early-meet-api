import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

import { CandidateDecision, CandidateProcessingStatus, CandidateStatus } from '@prisma/client';

export enum VacancyCandidateSortBy {
  AI_INTERVIEW_SCORE = 'aiInterviewScore',
  AI_MATCH_SCORE = 'aiMatchScore',
  CREATED_AT = 'createdAt',
  KEYWORD_MATCH_SCORE = 'keywordMatchScore',
  MATCH_SCORE = 'matchScore',
  UPDATED_AT = 'updatedAt',
}

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export class VacancyCandidateListQueryDto {
  @IsOptional()
  @IsEnum(CandidateStatus)
  status?: CandidateStatus;

  @IsOptional()
  @IsEnum(CandidateProcessingStatus)
  processingStatus?: CandidateProcessingStatus;

  @IsOptional()
  @IsEnum(CandidateDecision)
  decision?: CandidateDecision;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  minMatchScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  maxMatchScore?: number;

  @IsOptional()
  @IsEnum(VacancyCandidateSortBy)
  sortBy?: VacancyCandidateSortBy;

  @IsOptional()
  @IsEnum(SortDirection)
  sortDirection?: SortDirection;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
