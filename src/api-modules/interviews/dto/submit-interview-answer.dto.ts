import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class SubmitInterviewAnswerDto {
  @IsUUID()
  interviewQuestionId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10_000)
  answerText!: string;
}
