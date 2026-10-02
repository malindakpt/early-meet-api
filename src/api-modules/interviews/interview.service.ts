import {
  ConflictException,
  GoneException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CandidateProcessingStatus,
  InterviewEvaluationStatus,
  InterviewQuestionStatus,
  InterviewSessionStatus,
  InvitationStatus,
  type InterviewQuestionAnswer,
  type InterviewSession,
  type Prisma,
} from '@prisma/client';

import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { AuthTokenService } from '../auth/auth-token.service.js';
import {
  INTERVIEW_INVITATION_NOTIFICATION_SERVICE,
  type IInterviewInvitationNotificationService,
} from '../email/interview-invitation-email.service.js';
import { VacancyCandidateService } from '../vacancy-candidates/vacancy-candidate.service.js';
import type { SubmitInterviewAnswerDto } from './dto/submit-interview-answer.dto.js';
import type { UpdateInterviewInvitationDto } from './dto/update-interview-invitation.dto.js';
import { InterviewEvaluationScheduler } from './interview-evaluation-scheduler.service.js';

const invitationInclude = {
  candidate: { select: { id: true, name: true, email: true, phone: true, status: true } },
  vacancy: { select: { id: true, title: true, status: true } },
} as const;

type IInterviewInvitationRecord = Prisma.InterviewInvitationGetPayload<{
  include: typeof invitationInclude;
}>;

export type IInterviewResponse = Omit<IInterviewInvitationRecord, 'tokenHash'>;

export interface ICreatedInterviewResponse extends IInterviewResponse {
  token: string;
}

export interface IInterviewQuestionResponse {
  id: string;
  questionText: string;
  sequence: number;
}

export interface IInterviewProgressResponse {
  answeredQuestionCount: number;
  currentQuestion: IInterviewQuestionResponse | null;
  interviewId: string;
  isComplete: boolean;
  sessionId: string;
  status: InterviewSessionStatus;
  totalCoreQuestionCount: number;
}

export interface ICandidateInterviewProgressResponse {
  answeredQuestionCount: number;
  currentQuestion: IInterviewQuestionResponse | null;
  estimatedInterviewTimeSeconds: number;
  isComplete: boolean;
  status: InterviewSessionStatus;
  totalCoreQuestionCount: number;
  vacancyTitle: string;
}

export interface IInterviewReviewQuestionResponse {
  answerText: string | null;
  explanation: string | null;
  followUpFromId: string | null;
  id: string;
  questionText: string;
  score: number | null;
  sequence: number;
  status: InterviewQuestionStatus;
}

export interface IInterviewReviewListItem {
  candidate: { email: string; name: string };
  completedAt: Date | null;
  createdAt: Date;
  id: string;
  overallScore: number | null;
  sentAt: Date | null;
  status: InvitationStatus;
  vacancy: { id: string; title: string };
  vacancyCandidateId: string;
}

export interface IInterviewReviewDetailResponse extends IInterviewReviewListItem {
  evaluation: {
    candidateIntelligence: Prisma.JsonValue;
    evaluatedAt: Date;
    overallScore: number;
    summary: string;
  } | null;
  evaluationStatus: InterviewEvaluationStatus | null;
  questions: IInterviewReviewQuestionResponse[];
  sessionStatus: InterviewSessionStatus | null;
  startedAt: Date | null;
}

const reviewInclude = {
  candidate: { select: { email: true, name: true } },
  vacancy: {
    select: {
      id: true,
      title: true,
      candidates: { select: { candidateId: true, id: true } },
    },
  },
  session: {
    select: {
      candidateIntelligence: true,
      completedAt: true,
      evaluationStatus: true,
      evaluatedAt: true,
      overallScore: true,
      startedAt: true,
      status: true,
      summary: true,
      answers: {
        orderBy: [{ sequence: 'asc' }, { createdAt: 'asc' }],
        select: {
          answerText: true,
          explanation: true,
          followUpFromId: true,
          id: true,
          questionText: true,
          score: true,
          sequence: true,
          status: true,
        },
      },
    },
  },
} satisfies Prisma.InterviewInvitationInclude;

type IInterviewReviewRecord = Prisma.InterviewInvitationGetPayload<{
  include: typeof reviewInclude;
}>;

@Injectable()
export class InterviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vacancyCandidateService: VacancyCandidateService,
    private readonly authTokenService: AuthTokenService,
    @Inject(INTERVIEW_INVITATION_NOTIFICATION_SERVICE)
    private readonly invitationNotificationService: IInterviewInvitationNotificationService,
    private readonly interviewEvaluationScheduler?: InterviewEvaluationScheduler,
  ) {}

  async create(
    user: IAuthenticatedUser,
    vacancyId: string,
    vacancyCandidateId: string,
  ): Promise<ICreatedInterviewResponse> {
    const vacancyCandidate = await this.vacancyCandidateService.findOne(
      user,
      vacancyId,
      vacancyCandidateId,
    );
    const token = this.authTokenService.createOpaqueToken();
    const invitation = await this.prisma.interviewInvitation.create({
      data: {
        candidateId: vacancyCandidate.candidateId,
        vacancyId,
        createdBy: user.id,
        tokenHash: this.authTokenService.hashOpaqueToken(token),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        status: InvitationStatus.PENDING,
      },
      include: invitationInclude,
    });
    return { ...this.toResponse(invitation), token };
  }

  async sendInvitation(
    user: IAuthenticatedUser,
    vacancyId: string,
    vacancyCandidateId: string,
  ): Promise<IInterviewResponse> {
    const vacancyCandidate = await this.vacancyCandidateService.findOne(
      user,
      vacancyId,
      vacancyCandidateId,
    );
    if (vacancyCandidate.candidate.status !== 'ACTIVE') {
      throw new ConflictException('Only active candidates can be invited to an interview.');
    }
    if (vacancyCandidate.candidate.processingStatus !== CandidateProcessingStatus.READY) {
      throw new ConflictException(
        'Process the candidate CV before sending an interview invitation.',
      );
    }
    if (vacancyCandidate.candidate.email === null) {
      throw new ConflictException('Add a candidate email before sending an interview invitation.');
    }
    const candidateEmail = vacancyCandidate.candidate.email;
    const vacancy = await this.prisma.vacancy.findUnique({
      where: { id: vacancyId },
      select: { title: true },
    });
    if (vacancy === null) {
      throw new ConflictException('The vacancy is unavailable.');
    }
    const [technicalQuestionCount, customQuestionCount] = await Promise.all([
      this.prisma.vacancyQuestion.count({ where: { vacancyId } }),
      this.prisma.vacancyCustomQuestion.count({ where: { vacancyId } }),
    ]);
    if (technicalQuestionCount + customQuestionCount === 0) {
      throw new ConflictException('An interview requires at least one vacancy question.');
    }
    const existingInvitation = await this.prisma.interviewInvitation.findFirst({
      where: {
        candidateId: vacancyCandidate.candidateId,
        vacancyId,
        status: { in: [InvitationStatus.PENDING, InvitationStatus.SENT, InvitationStatus.OPENED] },
      },
    });
    if (existingInvitation !== null) {
      throw new ConflictException(
        'An active interview invitation already exists for this candidate.',
      );
    }

    const estimatedInterviewTimeSeconds = await this.getEstimatedInterviewTimeSeconds(vacancyId);
    const token = this.authTokenService.createOpaqueToken();
    const invitation = await this.prisma.interviewInvitation.create({
      data: {
        candidateId: vacancyCandidate.candidateId,
        vacancyId,
        createdBy: user.id,
        tokenHash: this.authTokenService.hashOpaqueToken(token),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        status: InvitationStatus.PENDING,
      },
      include: invitationInclude,
    });
    try {
      await this.invitationNotificationService.send({
        candidateEmail,
        candidateName: invitation.candidate.name,
        estimatedInterviewTimeSeconds,
        token,
        vacancyTitle: vacancy.title,
      });
    } catch (error: unknown) {
      await this.prisma.interviewInvitation.delete({ where: { id: invitation.id } });
      throw error;
    }
    return this.toResponse(
      await this.prisma.interviewInvitation.update({
        where: { id: invitation.id },
        data: { sentAt: new Date(), status: InvitationStatus.SENT },
        include: invitationInclude,
      }),
    );
  }

  async findAll(
    user: IAuthenticatedUser,
    vacancyId: string,
    vacancyCandidateId: string,
  ): Promise<IInterviewResponse[]> {
    const vacancyCandidate = await this.vacancyCandidateService.findOne(
      user,
      vacancyId,
      vacancyCandidateId,
    );
    const invitations = await this.prisma.interviewInvitation.findMany({
      where: { vacancyId, candidateId: vacancyCandidate.candidateId },
      include: invitationInclude,
      orderBy: { createdAt: 'desc' },
    });
    return invitations.map((invitation) => this.toResponse(invitation));
  }

  async findAllForReview(user: IAuthenticatedUser): Promise<IInterviewReviewListItem[]> {
    const interviews = await this.prisma.interviewInvitation.findMany({
      where: { vacancy: { organizationId: user.organizationId } },
      include: reviewInclude,
      orderBy: { createdAt: 'desc' },
    });
    return interviews.map((interview) => this.toReviewListItem(interview));
  }

  async findOneForReview(
    user: IAuthenticatedUser,
    interviewId: string,
  ): Promise<IInterviewReviewDetailResponse> {
    const interview = await this.prisma.interviewInvitation.findFirst({
      where: { id: interviewId, vacancy: { organizationId: user.organizationId } },
      include: reviewInclude,
    });
    if (interview === null) throw new NotFoundException('Interview not found.');
    const listItem = this.toReviewListItem(interview);
    const session = interview.session;
    return {
      ...listItem,
      completedAt: session?.completedAt ?? null,
      evaluation:
        session?.overallScore === null ||
        session?.overallScore === undefined ||
        session.summary === null ||
        session.evaluatedAt === null ||
        session.candidateIntelligence === null
          ? null
          : {
              candidateIntelligence: session.candidateIntelligence,
              evaluatedAt: session.evaluatedAt,
              overallScore: Number(session.overallScore),
              summary: session.summary,
            },
      evaluationStatus: session?.evaluationStatus ?? null,
      questions:
        session?.answers.map((answer) => ({
          ...answer,
          score: answer.score === null ? null : Number(answer.score),
        })) ?? [],
      sessionStatus: session?.status ?? null,
      startedAt: session?.startedAt ?? null,
    };
  }

  async removeForReview(user: IAuthenticatedUser, interviewId: string): Promise<void> {
    const interview = await this.prisma.interviewInvitation.findFirst({
      where: { id: interviewId, vacancy: { organizationId: user.organizationId } },
      select: { id: true },
    });
    if (interview === null) throw new NotFoundException('Interview not found.');
    await this.prisma.$transaction(async (transaction) => {
      const session = await transaction.interviewSession.findUnique({
        where: { invitationId: interview.id },
        select: { id: true },
      });
      if (session !== null) {
        await transaction.interviewQuestionAnswer.updateMany({
          where: { interviewSessionId: session.id, followUpFromId: { not: null } },
          data: { followUpFromId: null },
        });
        await transaction.interviewQuestionAnswer.deleteMany({
          where: { interviewSessionId: session.id },
        });
        await transaction.interviewSession.delete({ where: { id: session.id } });
      }
      await transaction.interviewInvitation.delete({ where: { id: interview.id } });
    });
  }

  async findOne(
    user: IAuthenticatedUser,
    vacancyId: string,
    vacancyCandidateId: string,
    interviewId: string,
  ): Promise<IInterviewResponse> {
    const vacancyCandidate = await this.vacancyCandidateService.findOne(
      user,
      vacancyId,
      vacancyCandidateId,
    );
    return this.toResponse(
      await this.findInvitation(vacancyId, vacancyCandidate.candidateId, interviewId),
    );
  }

  async update(
    user: IAuthenticatedUser,
    vacancyId: string,
    vacancyCandidateId: string,
    interviewId: string,
    dto: UpdateInterviewInvitationDto,
  ): Promise<IInterviewResponse> {
    const vacancyCandidate = await this.vacancyCandidateService.findOne(
      user,
      vacancyId,
      vacancyCandidateId,
    );
    const invitation = await this.findInvitation(
      vacancyId,
      vacancyCandidate.candidateId,
      interviewId,
    );
    if (
      dto.status !== InvitationStatus.CANCELLED ||
      invitation.status !== InvitationStatus.PENDING
    ) {
      throw new ConflictException('Only a pending interview invitation can be cancelled by HR.');
    }
    return this.toResponse(
      await this.prisma.interviewInvitation.update({
        where: { id: interviewId },
        data: { status: InvitationStatus.CANCELLED },
        include: invitationInclude,
      }),
    );
  }

  async start(
    user: IAuthenticatedUser,
    vacancyId: string,
    vacancyCandidateId: string,
    interviewId: string,
  ): Promise<IInterviewProgressResponse> {
    const vacancyCandidate = await this.vacancyCandidateService.findOne(
      user,
      vacancyId,
      vacancyCandidateId,
    );
    const invitation = await this.findInvitation(
      vacancyId,
      vacancyCandidate.candidateId,
      interviewId,
    );
    return this.startInvitation(invitation);
  }

  async getCandidateProgress(token: string): Promise<ICandidateInterviewProgressResponse> {
    const invitation = await this.findCandidateInvitation(token);
    const session = await this.prisma.interviewSession.findUnique({
      where: { invitationId: invitation.id },
    });
    if (session === null) {
      return this.toCandidateProgress(invitation, null, []);
    }
    const questions = await this.prisma.interviewQuestionAnswer.findMany({
      where: { interviewSessionId: session.id },
      orderBy: { sequence: 'asc' },
    });
    return this.toCandidateProgress(invitation, session, questions);
  }

  async startCandidateInterview(token: string): Promise<ICandidateInterviewProgressResponse> {
    const invitation = await this.findCandidateInvitation(token);
    const progress = await this.startInvitation(invitation);
    return this.toCandidateProgressFromProgress(invitation, progress);
  }

  async submitCandidateAnswer(
    token: string,
    dto: SubmitInterviewAnswerDto,
  ): Promise<ICandidateInterviewProgressResponse> {
    const invitation = await this.findCandidateInvitation(token);
    const progress = await this.submitAnswerForInvitation(invitation, dto);
    return this.toCandidateProgressFromProgress(invitation, progress);
  }

  private async startInvitation(
    invitation: IInterviewInvitationRecord,
  ): Promise<IInterviewProgressResponse> {
    if (
      invitation.status !== InvitationStatus.PENDING &&
      invitation.status !== InvitationStatus.SENT
    ) {
      throw new ConflictException('Only a sent interview invitation can be started.');
    }
    const vacancyQuestions = await this.prisma.vacancyQuestion.findMany({
      where: { vacancyId: invitation.vacancyId },
      orderBy: { sequence: 'asc' },
    });
    const customQuestions = await this.prisma.vacancyCustomQuestion.findMany({
      where: { vacancyId: invitation.vacancyId },
      orderBy: { displayOrder: 'asc' },
    });
    if (vacancyQuestions.length + customQuestions.length === 0) {
      throw new ConflictException('An interview requires at least one vacancy question.');
    }
    return this.prisma.$transaction(async (transaction) => {
      const existingSession = await transaction.interviewSession.findUnique({
        where: { invitationId: invitation.id },
        select: { id: true },
      });
      if (existingSession !== null) {
        throw new ConflictException('The interview has already started.');
      }
      const startedAt = new Date();
      const session = await transaction.interviewSession.create({
        data: {
          invitationId: invitation.id,
          candidateId: invitation.candidateId,
          vacancyId: invitation.vacancyId,
          status: InterviewSessionStatus.IN_PROGRESS,
          startedAt,
          answers: {
            create: [
              ...vacancyQuestions.map((question) => ({
                vacancyQuestionId: question.id,
                sequence: question.sequence,
                status:
                  question.sequence === 1
                    ? InterviewQuestionStatus.ASKED
                    : InterviewQuestionStatus.PENDING,
                questionText: question.questionText,
                askedAt: question.sequence === 1 ? startedAt : null,
              })),
              ...customQuestions.map((question, index) => ({
                vacancyCustomQuestionId: question.id,
                sequence: vacancyQuestions.length + index + 1,
                status:
                  vacancyQuestions.length === 0 && index === 0
                    ? InterviewQuestionStatus.ASKED
                    : InterviewQuestionStatus.PENDING,
                questionText: question.questionText,
                askedAt: vacancyQuestions.length === 0 && index === 0 ? startedAt : null,
              })),
            ],
          },
        },
      });
      await transaction.interviewInvitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.OPENED },
      });
      const questions = await transaction.interviewQuestionAnswer.findMany({
        where: { interviewSessionId: session.id },
        orderBy: { sequence: 'asc' },
      });
      return this.toProgress(invitation.id, session, questions);
    });
  }

  async getProgress(
    user: IAuthenticatedUser,
    vacancyId: string,
    vacancyCandidateId: string,
    interviewId: string,
  ): Promise<IInterviewProgressResponse> {
    const vacancyCandidate = await this.vacancyCandidateService.findOne(
      user,
      vacancyId,
      vacancyCandidateId,
    );
    await this.findInvitation(vacancyId, vacancyCandidate.candidateId, interviewId);
    const session = await this.findSession(vacancyId, vacancyCandidate.candidateId, interviewId);
    const questions = await this.prisma.interviewQuestionAnswer.findMany({
      where: { interviewSessionId: session.id },
      orderBy: { sequence: 'asc' },
    });
    return this.toProgress(interviewId, session, questions);
  }

  async submitAnswer(
    user: IAuthenticatedUser,
    vacancyId: string,
    vacancyCandidateId: string,
    interviewId: string,
    dto: SubmitInterviewAnswerDto,
  ): Promise<IInterviewProgressResponse> {
    const vacancyCandidate = await this.vacancyCandidateService.findOne(
      user,
      vacancyId,
      vacancyCandidateId,
    );
    const invitation = await this.findInvitation(
      vacancyId,
      vacancyCandidate.candidateId,
      interviewId,
    );
    return this.submitAnswerForInvitation(invitation, dto);
  }

  private async submitAnswerForInvitation(
    invitation: IInterviewInvitationRecord,
    dto: SubmitInterviewAnswerDto,
  ): Promise<IInterviewProgressResponse> {
    const result = await this.prisma.$transaction(async (transaction) => {
      const session = await transaction.interviewSession.findFirst({
        where: {
          invitationId: invitation.id,
          vacancyId: invitation.vacancyId,
          candidateId: invitation.candidateId,
        },
      });
      if (session === null) {
        throw new NotFoundException('Interview session not found.');
      }
      if (session.status !== InterviewSessionStatus.IN_PROGRESS) {
        throw new ConflictException('Only an in-progress interview can accept answers.');
      }
      const submittedQuestion = await transaction.interviewQuestionAnswer.findFirst({
        where: { id: dto.interviewQuestionId, interviewSessionId: session.id },
      });
      if (submittedQuestion === null) {
        throw new NotFoundException('Interview question not found.');
      }
      if (submittedQuestion.status === InterviewQuestionStatus.ANSWERED) {
        throw new ConflictException('This interview question has already been answered.');
      }
      const currentQuestion = await transaction.interviewQuestionAnswer.findFirst({
        where: { interviewSessionId: session.id, status: InterviewQuestionStatus.ASKED },
        orderBy: { sequence: 'asc' },
      });
      if (currentQuestion === null || currentQuestion.id !== submittedQuestion.id) {
        throw new ConflictException('Answers must be submitted in question order.');
      }
      await transaction.interviewQuestionAnswer.update({
        where: { id: submittedQuestion.id },
        data: {
          answerText: dto.answerText,
          status: InterviewQuestionStatus.ANSWERED,
          answeredAt: new Date(),
        },
      });
      const nextQuestion = await transaction.interviewQuestionAnswer.findFirst({
        where: {
          interviewSessionId: session.id,
          followUpFromId: null,
          status: InterviewQuestionStatus.PENDING,
        },
        orderBy: { sequence: 'asc' },
      });
      const updatedSession =
        nextQuestion === null
          ? await transaction.interviewSession.update({
              where: { id: session.id },
              data: { status: InterviewSessionStatus.COMPLETED, completedAt: new Date() },
            })
          : session;
      if (nextQuestion === null) {
        await transaction.interviewInvitation.update({
          where: { id: invitation.id },
          data: { status: InvitationStatus.COMPLETED },
        });
      } else {
        await transaction.interviewQuestionAnswer.update({
          where: { id: nextQuestion.id },
          data: { status: InterviewQuestionStatus.ASKED, askedAt: new Date() },
        });
      }
      const questions = await transaction.interviewQuestionAnswer.findMany({
        where: { interviewSessionId: session.id },
        orderBy: { sequence: 'asc' },
      });
      return {
        progress: this.toProgress(invitation.id, updatedSession, questions),
        shouldScheduleEvaluation: nextQuestion === null,
      };
    });
    if (result.shouldScheduleEvaluation) this.interviewEvaluationScheduler?.schedule(invitation.id);
    return result.progress;
  }

  private async findCandidateInvitation(token: string): Promise<IInterviewInvitationRecord> {
    const invitation = await this.prisma.interviewInvitation.findFirst({
      where: { tokenHash: this.authTokenService.hashOpaqueToken(token) },
      include: invitationInclude,
    });
    if (invitation === null || invitation.status === InvitationStatus.CANCELLED) {
      throw new NotFoundException('Interview invitation not found.');
    }
    if (
      invitation.expiresAt.getTime() <= Date.now() ||
      invitation.status === InvitationStatus.EXPIRED
    ) {
      throw new GoneException('This interview invitation has expired.');
    }
    return invitation;
  }

  private async findInvitation(
    vacancyId: string,
    candidateId: string,
    interviewId: string,
  ): Promise<IInterviewInvitationRecord> {
    const invitation = await this.prisma.interviewInvitation.findFirst({
      where: { id: interviewId, vacancyId, candidateId },
      include: invitationInclude,
    });
    if (invitation === null) {
      throw new NotFoundException('Interview invitation not found.');
    }
    return invitation;
  }

  private async findSession(
    vacancyId: string,
    candidateId: string,
    interviewId: string,
  ): Promise<InterviewSession> {
    const session = await this.prisma.interviewSession.findFirst({
      where: { invitationId: interviewId, vacancyId, candidateId },
    });
    if (session === null) {
      throw new NotFoundException('Interview session not found.');
    }
    return session;
  }

  private toProgress(
    interviewId: string,
    session: InterviewSession,
    questions: InterviewQuestionAnswer[],
  ): IInterviewProgressResponse {
    const currentQuestion = questions.find(
      (question) => question.status === InterviewQuestionStatus.ASKED,
    );
    return {
      interviewId,
      sessionId: session.id,
      status: session.status,
      totalCoreQuestionCount: questions.filter((question) => question.followUpFromId === null)
        .length,
      answeredQuestionCount: questions.filter(
        (question) => question.status === InterviewQuestionStatus.ANSWERED,
      ).length,
      isComplete: session.status === InterviewSessionStatus.COMPLETED,
      currentQuestion:
        currentQuestion === undefined
          ? null
          : {
              id: currentQuestion.id,
              sequence: currentQuestion.sequence,
              questionText: currentQuestion.questionText,
            },
    };
  }

  private toReviewListItem(interview: IInterviewReviewRecord): IInterviewReviewListItem {
    const vacancyCandidate = interview.vacancy.candidates.find(
      (candidate) => candidate.candidateId === interview.candidateId,
    );
    if (vacancyCandidate === undefined) {
      throw new NotFoundException('Vacancy candidate not found.');
    }
    return {
      candidate: { ...interview.candidate, email: interview.candidate.email ?? '' },
      completedAt: interview.session?.completedAt ?? null,
      createdAt: interview.createdAt,
      id: interview.id,
      overallScore:
        interview.session?.overallScore === null || interview.session?.overallScore === undefined
          ? null
          : Number(interview.session.overallScore),
      sentAt: interview.sentAt,
      status: interview.status,
      vacancy: { id: interview.vacancy.id, title: interview.vacancy.title },
      vacancyCandidateId: vacancyCandidate.id,
    };
  }

  private async toCandidateProgress(
    invitation: IInterviewInvitationRecord,
    session: InterviewSession | null,
    questions: InterviewQuestionAnswer[],
  ): Promise<ICandidateInterviewProgressResponse> {
    const estimatedInterviewTimeSeconds = await this.getEstimatedInterviewTimeSeconds(
      invitation.vacancyId,
    );
    if (session === null) {
      return {
        answeredQuestionCount: 0,
        currentQuestion: null,
        estimatedInterviewTimeSeconds,
        isComplete: false,
        status: InterviewSessionStatus.NOT_STARTED,
        totalCoreQuestionCount: 0,
        vacancyTitle: invitation.vacancy.title,
      };
    }
    return this.toCandidateProgressFromProgress(
      invitation,
      this.toProgress(invitation.id, session, questions),
      estimatedInterviewTimeSeconds,
    );
  }

  private async toCandidateProgressFromProgress(
    invitation: IInterviewInvitationRecord,
    progress: IInterviewProgressResponse,
    estimatedInterviewTimeSeconds?: number,
  ): Promise<ICandidateInterviewProgressResponse> {
    return {
      answeredQuestionCount: progress.answeredQuestionCount,
      currentQuestion: progress.currentQuestion,
      estimatedInterviewTimeSeconds:
        estimatedInterviewTimeSeconds ??
        (await this.getEstimatedInterviewTimeSeconds(invitation.vacancyId)),
      isComplete: progress.isComplete,
      status: progress.status,
      totalCoreQuestionCount: progress.totalCoreQuestionCount,
      vacancyTitle: invitation.vacancy.title,
    };
  }

  private async getEstimatedInterviewTimeSeconds(vacancyId: string): Promise<number> {
    const questions = await this.prisma.vacancyQuestion.findMany({
      where: { vacancyId },
      select: { question: { select: { estimatedAnswerTimeSeconds: true } } },
    });
    return questions.reduce(
      (total, vacancyQuestion) => total + vacancyQuestion.question.estimatedAnswerTimeSeconds,
      0,
    );
  }

  private toResponse(invitation: IInterviewInvitationRecord): IInterviewResponse {
    const response: IInterviewResponse & { tokenHash?: string } = { ...invitation };
    delete response.tokenHash;
    return response;
  }
}
