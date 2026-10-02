import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InterviewQuestionStatus, InterviewSessionStatus, type Prisma } from '@prisma/client';

import {
  INTERVIEW_FOLLOW_UP_LLM_SERVICE,
  type IInterviewFollowUpInput,
  type IInterviewFollowUpLlmService,
} from '../ai/interview-follow-up.types.js';
import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { StructuredLogger } from '../../infrastructure/logging/structured-logger.service.js';
import { serializeError } from '../../infrastructure/logging/error-serializer.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { VacancyCandidateService } from '../vacancy-candidates/vacancy-candidate.service.js';

const coreAnswerInclude = {
  interviewSession: { select: { status: true } },
  vacancyQuestion: { select: { evaluationCriteria: true, followUpAllowed: true } },
  vacancyCustomQuestion: { select: { id: true } },
  followUps: { select: { id: true } },
} as const;

type ICoreAnswerRecord = Prisma.InterviewQuestionAnswerGetPayload<{
  include: typeof coreAnswerInclude;
}>;

export interface IInterviewFollowUpResponse {
  followUpQuestion: { id: string; questionText: string; sequence: number } | null;
  reason: string;
  shouldFollowUp: boolean;
}

@Injectable()
export class InterviewFollowUpService {
  constructor(
    @Inject(INTERVIEW_FOLLOW_UP_LLM_SERVICE)
    private readonly followUpLlmService: IInterviewFollowUpLlmService,
    private readonly prisma: PrismaService,
    private readonly vacancyCandidateService: VacancyCandidateService,
    private readonly logger: StructuredLogger,
  ) {}

  async decide(
    user: IAuthenticatedUser,
    vacancyId: string,
    vacancyCandidateId: string,
    interviewId: string,
    answerId: string,
  ): Promise<IInterviewFollowUpResponse> {
    const vacancyCandidate = await this.vacancyCandidateService.findOne(
      user,
      vacancyId,
      vacancyCandidateId,
    );
    const coreAnswer = await this.findCoreAnswer(
      vacancyId,
      vacancyCandidate.candidateId,
      interviewId,
      answerId,
    );
    if (coreAnswer.score === null || coreAnswer.explanation === null) {
      throw new ConflictException(
        'Evaluate the core answer before requesting a follow-up decision.',
      );
    }
    if (
      (coreAnswer.vacancyQuestion === null && coreAnswer.vacancyCustomQuestion === null) ||
      coreAnswer.answerText === null
    ) {
      throw new ConflictException('Only answered core questions can receive a follow-up.');
    }
    if (coreAnswer.followUps.length > 0) {
      throw new ConflictException('A follow-up has already been generated for this core question.');
    }
    if (coreAnswer.interviewSession.status !== InterviewSessionStatus.IN_PROGRESS) {
      throw new ConflictException('The interview is not available for a follow-up.');
    }
    const currentQuestion = await this.prisma.interviewQuestionAnswer.findFirst({
      where: {
        interviewSessionId: coreAnswer.interviewSessionId,
        status: InterviewQuestionStatus.ASKED,
      },
      select: { id: true },
    });
    if (currentQuestion !== null) {
      throw new ConflictException(
        'The interview has already progressed beyond this core question.',
      );
    }
    if (coreAnswer.vacancyQuestion === null || !coreAnswer.vacancyQuestion.followUpAllowed) {
      await this.continueToNextCoreQuestion(interviewId, answerId);
      return {
        shouldFollowUp: false,
        reason: 'Follow-ups are disabled for this core question.',
        followUpQuestion: null,
      };
    }

    let decision;
    try {
      decision = await this.followUpLlmService.decide(this.toFollowUpInput(coreAnswer));
    } catch (error: unknown) {
      await this.continueToNextCoreQuestion(interviewId, answerId);
      this.logger.error('Interview follow-up decision failed', {
        event: 'interview_follow_up.decision.failed',
        vacancyId,
        vacancyCandidateId,
        interviewId,
        answerId,
        error: serializeError(error),
      });
      return {
        shouldFollowUp: false,
        reason: 'A follow-up could not be generated.',
        followUpQuestion: null,
      };
    }
    if (!decision.shouldFollowUp) {
      await this.continueToNextCoreQuestion(interviewId, answerId);
      return { ...decision, followUpQuestion: null };
    }
    const followUp = await this.prisma.$transaction(async (transaction) => {
      const session = await transaction.interviewSession.findFirst({
        where: { invitationId: interviewId, vacancyId, candidateId: vacancyCandidate.candidateId },
      });
      if (session === null || session.status !== InterviewSessionStatus.IN_PROGRESS) {
        throw new ConflictException('The interview is not available for a follow-up.');
      }
      const unresolvedQuestion = await transaction.interviewQuestionAnswer.findFirst({
        where: { interviewSessionId: session.id, status: InterviewQuestionStatus.ASKED },
      });
      if (unresolvedQuestion !== null) {
        throw new ConflictException(
          'The interview has already progressed beyond this core question.',
        );
      }
      const existingFollowUp = await transaction.interviewQuestionAnswer.findFirst({
        where: { followUpFromId: answerId },
        select: { id: true },
      });
      if (existingFollowUp !== null) {
        throw new ConflictException(
          'A follow-up has already been generated for this core question.',
        );
      }
      return transaction.interviewQuestionAnswer.create({
        data: {
          interviewSessionId: session.id,
          followUpFromId: answerId,
          sequence: coreAnswer.sequence,
          status: InterviewQuestionStatus.ASKED,
          questionText: decision.followUpQuestion,
          askedAt: new Date(),
        },
      });
    });
    this.logger.log('Interview follow-up generated', {
      event: 'interview_follow_up.generated',
      vacancyId,
      vacancyCandidateId,
      interviewId,
      answerId,
      followUpId: followUp.id,
    });
    return {
      shouldFollowUp: true,
      reason: decision.reason,
      followUpQuestion: {
        id: followUp.id,
        questionText: followUp.questionText,
        sequence: followUp.sequence,
      },
    };
  }

  private async findCoreAnswer(
    vacancyId: string,
    candidateId: string,
    interviewId: string,
    answerId: string,
  ): Promise<ICoreAnswerRecord> {
    const answer = await this.prisma.interviewQuestionAnswer.findFirst({
      where: {
        id: answerId,
        status: InterviewQuestionStatus.ANSWERED,
        followUpFromId: null,
        interviewSession: { invitationId: interviewId, vacancyId, candidateId },
      },
      include: coreAnswerInclude,
    });
    if (answer === null) {
      throw new NotFoundException('Answered core interview question not found.');
    }
    return answer;
  }

  private toFollowUpInput(coreAnswer: ICoreAnswerRecord): IInterviewFollowUpInput {
    if (
      coreAnswer.vacancyQuestion === null ||
      coreAnswer.answerText === null ||
      coreAnswer.score === null ||
      coreAnswer.explanation === null
    ) {
      throw new ConflictException('Only evaluated core questions can receive a follow-up.');
    }
    return {
      question: {
        questionText: coreAnswer.questionText,
        evaluationCriteria: coreAnswer.vacancyQuestion.evaluationCriteria,
      },
      answer: {
        text: coreAnswer.answerText,
        evaluation: { score: Number(coreAnswer.score), explanation: coreAnswer.explanation },
      },
    };
  }

  private async continueToNextCoreQuestion(interviewId: string, answerId: string): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const coreAnswer = await transaction.interviewQuestionAnswer.findFirst({
        where: { id: answerId, interviewSession: { invitationId: interviewId } },
      });
      if (coreAnswer === null) {
        throw new NotFoundException('Answered core interview question not found.');
      }
      const unresolvedQuestion = await transaction.interviewQuestionAnswer.findFirst({
        where: {
          interviewSessionId: coreAnswer.interviewSessionId,
          status: InterviewQuestionStatus.ASKED,
        },
      });
      if (unresolvedQuestion !== null) {
        throw new ConflictException(
          'The interview has already progressed beyond this core question.',
        );
      }
      const nextCoreQuestion = await transaction.interviewQuestionAnswer.findFirst({
        where: {
          interviewSessionId: coreAnswer.interviewSessionId,
          followUpFromId: null,
          status: InterviewQuestionStatus.PENDING,
        },
        orderBy: { sequence: 'asc' },
      });
      if (nextCoreQuestion !== null) {
        await transaction.interviewQuestionAnswer.update({
          where: { id: nextCoreQuestion.id },
          data: { status: InterviewQuestionStatus.ASKED, askedAt: new Date() },
        });
      } else {
        await transaction.interviewSession.update({
          where: { id: coreAnswer.interviewSessionId },
          data: { status: InterviewSessionStatus.COMPLETED, completedAt: new Date() },
        });
        await transaction.interviewInvitation.update({
          where: { id: interviewId },
          data: { status: 'COMPLETED' },
        });
      }
    });
  }
}
