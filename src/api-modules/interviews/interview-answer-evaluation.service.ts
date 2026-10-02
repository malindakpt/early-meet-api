import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InterviewQuestionStatus, type Prisma } from '@prisma/client';

import {
  INTERVIEW_ANSWER_EVALUATION_LLM_SERVICE,
  type IInterviewAnswerEvaluationInput,
  type IInterviewAnswerEvaluationLlmService,
} from '../ai/interview-answer-evaluation.types.js';
import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { StructuredLogger } from '../../infrastructure/logging/structured-logger.service.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { VacancyCandidateService } from '../vacancy-candidates/vacancy-candidate.service.js';

const answerInclude = {
  vacancyQuestion: {
    select: {
      difficulty: true,
      evaluationCriteria: true,
      questionType: true,
    },
  },
  vacancyCustomQuestion: { select: { evaluationCriteria: true } },
  followUpFrom: {
    select: {
      vacancyQuestion: {
        select: {
          difficulty: true,
          evaluationCriteria: true,
          questionType: true,
        },
      },
    },
  },
} as const;

type IInterviewAnswerRecord = Prisma.InterviewQuestionAnswerGetPayload<{
  include: typeof answerInclude;
}>;

export interface IInterviewAnswerEvaluationResponse {
  answerId: string;
  explanation: string;
  score: number;
}

@Injectable()
export class InterviewAnswerEvaluationService {
  constructor(
    @Inject(INTERVIEW_ANSWER_EVALUATION_LLM_SERVICE)
    private readonly evaluationLlmService: IInterviewAnswerEvaluationLlmService,
    private readonly prisma: PrismaService,
    private readonly vacancyCandidateService: VacancyCandidateService,
    private readonly logger: StructuredLogger,
  ) {}

  async evaluate(
    user: IAuthenticatedUser,
    vacancyId: string,
    vacancyCandidateId: string,
    interviewId: string,
    answerId: string,
  ): Promise<IInterviewAnswerEvaluationResponse> {
    const vacancyCandidate = await this.vacancyCandidateService.findOne(
      user,
      vacancyId,
      vacancyCandidateId,
    );
    const answer = await this.findAnsweredAnswer(
      vacancyId,
      vacancyCandidate.candidateId,
      interviewId,
      answerId,
    );
    if (answer.score !== null || answer.explanation !== null) {
      throw new ConflictException('This interview answer has already been evaluated.');
    }
    if (
      (answer.vacancyQuestion === null &&
        answer.vacancyCustomQuestion === null &&
        answer.followUpFrom?.vacancyQuestion === null) ||
      answer.answerText === null
    ) {
      throw new ConflictException('Only answered interview questions can be evaluated.');
    }
    const evaluation = await this.evaluationLlmService.evaluate(this.toEvaluationInput(answer));
    const result = await this.prisma.interviewQuestionAnswer.updateMany({
      where: { id: answer.id, score: null, explanation: null },
      data: { score: evaluation.score, explanation: evaluation.explanation },
    });
    if (result.count !== 1) {
      throw new ConflictException('This interview answer has already been evaluated.');
    }
    this.logger.log('Interview answer evaluation completed', {
      event: 'interview_answer.evaluation.completed',
      vacancyId,
      vacancyCandidateId,
      interviewId,
      answerId,
    });
    return { answerId, score: evaluation.score, explanation: evaluation.explanation };
  }

  private async findAnsweredAnswer(
    vacancyId: string,
    candidateId: string,
    interviewId: string,
    answerId: string,
  ): Promise<IInterviewAnswerRecord> {
    const answer = await this.prisma.interviewQuestionAnswer.findFirst({
      where: {
        id: answerId,
        status: InterviewQuestionStatus.ANSWERED,
        interviewSession: { invitationId: interviewId, vacancyId, candidateId },
      },
      include: answerInclude,
    });
    if (answer === null) {
      throw new NotFoundException('Answered interview question not found.');
    }
    return answer;
  }

  private toEvaluationInput(answer: IInterviewAnswerRecord): IInterviewAnswerEvaluationInput {
    const vacancyQuestion = answer.vacancyQuestion ?? answer.followUpFrom?.vacancyQuestion;
    if (
      (vacancyQuestion === null || vacancyQuestion === undefined) &&
      answer.vacancyCustomQuestion === null
    ) {
      throw new ConflictException('Only answered interview questions can be evaluated.');
    }
    if (answer.answerText === null) throw new ConflictException('Only answered interview questions can be evaluated.');
    return {
      answerText: answer.answerText,
      question: {
        questionText: answer.questionText,
        difficulty: vacancyQuestion?.difficulty ?? 'CUSTOM',
        questionType: vacancyQuestion?.questionType ?? 'CUSTOM',
        evaluationCriteria:
          vacancyQuestion?.evaluationCriteria ?? answer.vacancyCustomQuestion?.evaluationCriteria ?? null,
      },
    };
  }
}
