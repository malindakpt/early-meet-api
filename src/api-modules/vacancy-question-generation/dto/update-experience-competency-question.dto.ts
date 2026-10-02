import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateExperienceCompetencyQuestionDto {
  @IsOptional()
  @IsString()
  @MaxLength(1_000)
  questionText?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sequence?: number;
}