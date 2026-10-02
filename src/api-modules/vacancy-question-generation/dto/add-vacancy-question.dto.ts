import { IsUUID } from 'class-validator';

export class AddVacancyQuestionDto {
  @IsUUID()
  questionId!: string;
}
