import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  InterviewEvaluationStatus,
  InterviewQuestionStatus,
  InterviewSessionStatus,
  RequirementType,
  type Prisma,
} from '@prisma/client';

import {
  INTERVIEW_OVERALL_EVALUATION_LLM_SERVICE,
  interviewAssessmentLevelSchema,
  type IInterviewOverallEvaluation,
  type IInterviewOverallEvaluationInput,
  type IInterviewOverallEvaluationLlmService,
} from '../ai/interview-overall-evaluation.types.js';
import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { StructuredLogger } from '../../infrastructure/logging/structured-logger.service.js';
import { serializeError } from '../../infrastructure/logging/error-serializer.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { VacancyCandidateService } from '../vacancy-candidates/vacancy-candidate.service.js';

const sessionInclude = {
  vacancy: {
    select: {
      difficulty: true,
      interviewType: true,
      jobDescription: true,
      title: true,
      technologies: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          requirementType: true,
          segmentSelections: true,
          technology: { select: { name: true } },
        },
      },
    },
  },
  answers: {
    orderBy: [{ sequence: 'asc' }, { createdAt: 'asc' }],
    include: {
      followUpFrom: { select: { id: true } },
      vacancyQuestion: {
        select: {
          difficulty: true,
          evaluationCriteria: true,
          questionType: true,
          question: {
            select: {
              technology: { select: { name: true } },
              technologySegment: { select: { name: true } },
            },
          },
        },
      },
      vacancyCustomQuestion: { select: { evaluationCriteria: true } },
    },
  },
} satisfies Prisma.InterviewSessionInclude;

type IInterviewSessionRecord = Prisma.InterviewSessionGetPayload<{
  include: typeof sessionInclude;
}>;
type IAssessmentLevel = ReturnType<typeof interviewAssessmentLevelSchema.parse>;

export interface IInterviewSkillAssessment {
  evidence: string;
  level: IAssessmentLevel;
  technology: string;
  technologySegment: string | null;
  vacancyTechnologyId: string;
}

export interface ICandidateIntelligenceData {
  areasToProbe: IInterviewOverallEvaluation['areasToProbe'];
  competencies: IInterviewOverallEvaluation['competencies'];
  preferredSkills: { coverage: number; skills: IInterviewSkillAssessment[] };
  requiredSkills: { coverage: number; skills: IInterviewSkillAssessment[] };
  strengths: IInterviewOverallEvaluation['strengths'];
}

export interface IInterviewOverallEvaluationResponse {
  candidateIntelligence: ICandidateIntelligenceData;
  evaluatedAt: Date | null;
  interviewId: string;
  overallScore: number;
  summary: string;
}

const levelWeights: Record<IAssessmentLevel, number> = {
  STRONG: 1,
  GOOD: 0.75,
  MODERATE: 0.5,
  WEAK: 0.25,
  NO_EVIDENCE: 0,
};

@Injectable()
export class InterviewOverallEvaluationService {
  constructor(
    @Inject(INTERVIEW_OVERALL_EVALUATION_LLM_SERVICE)
    private readonly overallEvaluationLlmService: IInterviewOverallEvaluationLlmService,
    private readonly prisma: PrismaService,
    private readonly vacancyCandidateService: VacancyCandidateService,
    private readonly logger: StructuredLogger,
  ) {}

  async evaluate(
    user: IAuthenticatedUser,
    vacancyId: string,
    vacancyCandidateId: string,
    interviewId: string,
  ): Promise<IInterviewOverallEvaluationResponse> {
    const vacancyCandidate = await this.vacancyCandidateService.findOne(
      user,
      vacancyId,
      vacancyCandidateId,
    );
    const session = await this.findSession(interviewId);
    if (session.vacancyId !== vacancyId || session.candidateId !== vacancyCandidate.candidateId) {
      throw new NotFoundException('Interview session not found.');
    }
    return this.evaluateSession(session);
  }

  async evaluateForInterview(interviewId: string): Promise<void> {
    await this.evaluateSession(await this.findSession(interviewId));
  }

  async findOne(
    user: IAuthenticatedUser,
    vacancyId: string,
    vacancyCandidateId: string,
    interviewId: string,
  ): Promise<IInterviewOverallEvaluationResponse> {
    const vacancyCandidate = await this.vacancyCandidateService.findOne(
      user,
      vacancyId,
      vacancyCandidateId,
    );
    const session = await this.findSession(interviewId);
    if (session.vacancyId !== vacancyId || session.candidateId !== vacancyCandidate.candidateId) {
      throw new NotFoundException('Interview session not found.');
    }
    if (
      session.evaluationStatus !== InterviewEvaluationStatus.EVALUATED ||
      session.overallScore === null ||
      session.summary === null ||
      session.candidateIntelligence === null
    ) {
      throw new NotFoundException('Overall interview evaluation not found.');
    }
    return this.toStoredResponse(session);
  }

  private async evaluateSession(
    session: IInterviewSessionRecord,
  ): Promise<IInterviewOverallEvaluationResponse> {
    if (session.evaluationStatus === InterviewEvaluationStatus.EVALUATED)
      return this.toStoredResponse(session);
    this.assertReadyForEvaluation(session);
    const claim = await this.prisma.interviewSession.updateMany({
      where: {
        id: session.id,
        status: InterviewSessionStatus.COMPLETED,
        evaluationStatus: {
          in: [InterviewEvaluationStatus.NOT_STARTED, InterviewEvaluationStatus.FAILED],
        },
      },
      data: {
        evaluationStartedAt: new Date(),
        evaluationStatus: InterviewEvaluationStatus.EVALUATING,
      },
    });
    if (claim.count !== 1)
      throw new ConflictException('Interview evaluation is already in progress.');

    try {
      const evaluation = await this.overallEvaluationLlmService.evaluate(
        this.toEvaluationInput(session),
      );
      const candidateIntelligence = this.toCandidateIntelligence(session, evaluation);
      const overallScore = this.calculateOverallScore(candidateIntelligence);
      const evaluatedAt = new Date();
      const result = await this.prisma.interviewSession.updateMany({
        where: { id: session.id, evaluationStatus: InterviewEvaluationStatus.EVALUATING },
        data: {
          candidateIntelligence: candidateIntelligence as unknown as Prisma.InputJsonValue,
          evaluatedAt,
          evaluationStatus: InterviewEvaluationStatus.EVALUATED,
          overallScore,
          summary: evaluation.summary,
        },
      });
      if (result.count !== 1)
        throw new Error('Interview evaluation state changed before persistence.');
      this.logger.log('Whole interview evaluation completed', {
        event: 'interview.evaluation.completed',
        interviewId: session.invitationId,
        sessionId: session.id,
      });
      return {
        candidateIntelligence,
        evaluatedAt,
        interviewId: session.invitationId,
        overallScore,
        summary: evaluation.summary,
      };
    } catch (error: unknown) {
      await this.prisma.interviewSession.updateMany({
        where: { id: session.id, evaluationStatus: InterviewEvaluationStatus.EVALUATING },
        data: { evaluationStatus: InterviewEvaluationStatus.FAILED },
      });
      this.logger.error('Whole interview evaluation failed', {
        event: 'interview.evaluation.failed',
        interviewId: session.invitationId,
        sessionId: session.id,
        error: serializeError(error),
      });
      throw error;
    }
  }

  private assertReadyForEvaluation(session: IInterviewSessionRecord): void {
    if (session.status !== InterviewSessionStatus.COMPLETED) {
      throw new ConflictException('Only a completed interview can receive an overall evaluation.');
    }
    const coreAnswers = session.answers.filter((answer) => answer.followUpFromId === null);
    if (
      coreAnswers.length === 0 ||
      coreAnswers.some(
        (answer) =>
          answer.status !== InterviewQuestionStatus.ANSWERED || answer.answerText === null,
      )
    ) {
      throw new ConflictException('All core interview answers must be completed first.');
    }
  }

  private toEvaluationInput(session: IInterviewSessionRecord): IInterviewOverallEvaluationInput {
    return {
      vacancy: {
        description: session.vacancy.jobDescription,
        difficulty: session.vacancy.difficulty,
        interviewType: session.vacancy.interviewType,
        skills: session.vacancy.technologies.map((skill) => ({
          name: skill.technology.name,
          requirementType: skill.requirementType,
          segmentName: this.toSegmentLabel(skill.segmentSelections),
          vacancyTechnologyId: skill.id,
        })),
        title: session.vacancy.title,
      },
      coreAnswers: session.answers
        .filter((answer) => answer.followUpFromId === null && answer.answerText !== null)
        .map((answer) => ({
          answerText: answer.answerText as string,
          questionId: answer.id,
          sequence: answer.sequence,
          question: {
            difficulty: answer.vacancyQuestion?.difficulty ?? session.vacancy.difficulty,
            evaluationCriteria:
              answer.vacancyQuestion?.evaluationCriteria ??
              answer.vacancyCustomQuestion?.evaluationCriteria ??
              null,
            questionText: answer.questionText,
            questionType: answer.vacancyQuestion?.questionType ?? 'CUSTOM',
            technology: answer.vacancyQuestion?.question.technology.name ?? null,
            technologySegment: answer.vacancyQuestion?.question.technologySegment.name ?? null,
          },
        })),
      followUpAnswers: session.answers
        .filter(
          (answer) =>
            answer.followUpFromId !== null &&
            answer.answerText !== null &&
            answer.status === InterviewQuestionStatus.ANSWERED,
        )
        .map((answer) => ({
          answerText: answer.answerText as string,
          parentCoreQuestionId: answer.followUpFrom?.id ?? (answer.followUpFromId as string),
          questionId: answer.id,
          questionText: answer.questionText,
        })),
    };
  }

  private toCandidateIntelligence(
    session: IInterviewSessionRecord,
    evaluation: IInterviewOverallEvaluation,
  ): ICandidateIntelligenceData {
    const validQuestionIds = new Set(session.answers.map((answer) => answer.id));
    if (
      evaluation.strengths.some((item) =>
        item.questionIds.some((id) => !validQuestionIds.has(id)),
      ) ||
      evaluation.areasToProbe.some((item) =>
        item.questionIds.some((id) => !validQuestionIds.has(id)),
      )
    ) {
      throw new ConflictException('Interview evaluation referenced an unknown question.');
    }
    const configuredSkills = new Map(
      session.vacancy.technologies.map((skill) => [skill.id, skill]),
    );
    if (
      evaluation.skills.length !== configuredSkills.size ||
      new Set(evaluation.skills.map((skill) => skill.vacancyTechnologyId)).size !==
        configuredSkills.size ||
      evaluation.skills.some((skill) => !configuredSkills.has(skill.vacancyTechnologyId))
    ) {
      throw new ConflictException('Interview evaluation did not match configured vacancy skills.');
    }
    const assessments = evaluation.skills.map((assessment) => {
      const skill = configuredSkills.get(assessment.vacancyTechnologyId);
      if (skill === undefined)
        throw new ConflictException('Interview evaluation referenced an unconfigured skill.');
      return {
        ...assessment,
        technology: skill.technology.name,
        technologySegment: this.toSegmentLabel(skill.segmentSelections),
      };
    });
    return {
      areasToProbe: evaluation.areasToProbe,
      competencies: evaluation.competencies,
      preferredSkills: this.toSkillCoverage(assessments, session, RequirementType.PREFERRED),
      requiredSkills: this.toSkillCoverage(assessments, session, RequirementType.REQUIRED),
      strengths: evaluation.strengths,
    };
  }

  private toSkillCoverage(
    assessments: IInterviewSkillAssessment[],
    session: IInterviewSessionRecord,
    requirementType: RequirementType,
  ): { coverage: number; skills: IInterviewSkillAssessment[] } {
    const ids = new Set(
      session.vacancy.technologies
        .filter((skill) => skill.requirementType === requirementType)
        .map((skill) => skill.id),
    );
    const skills = assessments.filter((assessment) => ids.has(assessment.vacancyTechnologyId));
    const coverage =
      skills.length === 0
        ? 0
        : (skills.reduce((total, skill) => total + levelWeights[skill.level], 0) / skills.length) *
          100;
    return { coverage: Number(coverage.toFixed(2)), skills };
  }

  private toSegmentLabel(segmentSelections: string[]): string | null {
    if (segmentSelections.includes('ALL')) return 'All Segments';
    if (segmentSelections.length === 0) return null;
    return `${segmentSelections.length} segments selected`;
  }

  private calculateOverallScore(intelligence: ICandidateIntelligenceData): number {
    return intelligence.requiredSkills.skills.length > 0
      ? intelligence.requiredSkills.coverage
      : intelligence.preferredSkills.coverage;
  }

  private async findSession(interviewId: string): Promise<IInterviewSessionRecord> {
    const session = await this.prisma.interviewSession.findFirst({
      where: { invitationId: interviewId },
      include: sessionInclude,
    });
    if (session === null) throw new NotFoundException('Interview session not found.');
    return session;
  }

  private toStoredResponse(session: IInterviewSessionRecord): IInterviewOverallEvaluationResponse {
    return {
      candidateIntelligence: session.candidateIntelligence as unknown as ICandidateIntelligenceData,
      evaluatedAt: session.evaluatedAt,
      interviewId: session.invitationId,
      overallScore: Number(session.overallScore),
      summary: session.summary as string,
    };
  }
}
