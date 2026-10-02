import { IsString, MaxLength, MinLength } from 'class-validator';

export class QuestionCsvPreviewDto {
  @IsString()
  @MinLength(1)
  @MaxLength(65_536)
  csv!: string;
}

export class QuestionCsvImportDto extends QuestionCsvPreviewDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  password!: string;
}
