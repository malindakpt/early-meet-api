import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateVacancyCandidateDto {
  @IsOptional()
  @IsString()
  @MaxLength(10_000)
  notes?: string;
}
