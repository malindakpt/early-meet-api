import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateVacancyCustomQuestionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(10_000)
  questionText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10_000)
  evaluationCriteria?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  displayOrder?: number;
}
