import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateVacancyCustomQuestionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10_000)
  questionText!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10_000)
  evaluationCriteria?: string;
}
