import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsString, MaxLength, Min, MinLength } from 'class-validator';

import { Difficulty, EmploymentType, InterviewType, WorkType } from '@prisma/client';

export class CreateVacancyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  location!: string;

  @IsEnum(EmploymentType)
  employmentType!: EmploymentType;

  @IsEnum(WorkType)
  workType!: WorkType;

  @IsString()
  @MinLength(1)
  jobDescription!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  experienceMin!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  experienceMax!: number;

  @Type(() => Date)
  @IsDate()
  deadline!: Date;

  @IsEnum(InterviewType)
  interviewType!: InterviewType;

  @IsEnum(Difficulty)
  difficulty!: Difficulty;

  @IsString()
  notes!: string;
}
