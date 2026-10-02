import { Injectable } from '@nestjs/common';
import { InterviewEvaluationStatus, InterviewSessionStatus, type Prisma } from '@prisma/client';

import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { VacancyService } from '../vacancies/vacancy.service.js';
import type { CandidateRankingQueryDto } from './dto/candidate-ranking-query.dto.js';

const toRankingInclude = (vacancyId: string) =>
  ({
    candidate: {
      select: {
        id: true,
        email: true,
        name: true,
        invitations: {
          where: { vacancyId, status: { not: 'CANCELLED' } },
          include: {
            session: {
              include: {
                answers: {
                  where: { followUpFromId: null },
                  orderBy: { sequence: 'asc' },
                  include: {
                    vacancyQuestion: {
                      select: {
                        question: {
                          select: {
                            technology: { select: { name: true } },
                            technologySegment: { select: { name: true } },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  }) as const;

type ICandidateRankingRecord = Prisma.VacancyCandidateGetPayload<{
  include: ReturnType<typeof toRankingInclude>;
}>;

type IRankedInterviewSession = NonNullable<
  ICandidateRankingRecord['candidate']['invitations'][number]['session']
>;

export interface ICandidateQuestionScore {
  questionId: string | null;
  questionText: string;
  score: number;
  sequence: number;
}

export interface ICandidateTechnologyScore {
  technology: string;
  averageScore: number;
  evaluatedCoreQuestionCount: number;
}

export interface IRankedCandidate {
  candidate: { id: string; email: string; name: string };
  candidateId: string;
  coreQuestionCount: number;
  evaluatedCoreAnswerCount: number;
  interviewId: string;
  interviewStatus: InterviewSessionStatus;
  overallScore: number;
  preferredSkillCoverage: number | null;
  questionScores: ICandidateQuestionScore[];
  rank: number;
  requiredSkillCoverage: number | null;
  technologyScores: ICandidateTechnologyScore[];
  vacancyCandidateId: string;
}

export interface INotEvaluatedCandidate {
  evaluationStatus: InterviewEvaluationStatus | null;
  candidate: { id: string; email: string; name: string };
  candidateId: string;
  interviewId: string | null;
  interviewStatus: InterviewSessionStatus | null;
  reason:
    | 'EVALUATION_FAILED'
    | 'INTERVIEW_INCOMPLETE'
    | 'INTERVIEW_NOT_STARTED'
    | 'OVERALL_EVALUATION_PENDING';
  vacancyCandidateId: string;
}

export interface ICandidateRankingResponse {
  notEvaluatedCandidates: INotEvaluatedCandidate[];
  pagination: { limit: number; page: number; total: number; totalPages: number };
  rankedCandidates: IRankedCandidate[];
}

@Injectable()
export class CandidateRankingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vacancyService: VacancyService,
  ) {}

  async findAll(
    user: IAuthenticatedUser,
    vacancyId: string,
    query: CandidateRankingQueryDto,
  ): Promise<ICandidateRankingResponse> {
    await this.vacancyService.findOne(user, vacancyId);
    const candidates = await this.prisma.vacancyCandidate.findMany({
      where: { vacancyId },
      include: toRankingInclude(vacancyId),
      orderBy: { id: 'asc' },
    });
    const rankedCandidates: IRankedCandidate[] = [];
    const notEvaluatedCandidates: INotEvaluatedCandidate[] = [];
    for (const candidate of candidates) {
      const evaluation = this.findLatestEvaluation(candidate);
      if (evaluation !== null) {
        rankedCandidates.push(this.toRankedCandidate(candidate, evaluation));
      } else {
        notEvaluatedCandidates.push(this.toNotEvaluatedCandidate(candidate));
      }
    }
    rankedCandidates.sort(
      (left, right) =>
        right.overallScore - left.overallScore ||
        left.vacancyCandidateId.localeCompare(right.vacancyCandidateId),
    );
    this.assignCompetitionRanks(rankedCandidates);
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const total = rankedCandidates.length;
    return {
      rankedCandidates: rankedCandidates.slice((page - 1) * limit, page * limit),
      notEvaluatedCandidates,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  private findLatestEvaluation(candidate: ICandidateRankingRecord) {
    return (
      candidate.candidate.invitations
        .filter(
          (invitation) =>
            invitation.session?.status === InterviewSessionStatus.COMPLETED &&
            invitation.session.overallScore !== null &&
            invitation.session.summary !== null &&
            invitation.session.evaluatedAt !== null,
        )
        .sort(
          (left, right) =>
            (right.session?.evaluatedAt?.getTime() ?? 0) -
              (left.session?.evaluatedAt?.getTime() ?? 0) || left.id.localeCompare(right.id),
        )[0] ?? null
    );
  }

  private toRankedCandidate(
    candidate: ICandidateRankingRecord,
    invitation: NonNullable<ReturnType<CandidateRankingService['findLatestEvaluation']>>,
  ): IRankedCandidate {
    const session = invitation.session;
    if (session === null || session.overallScore === null) {
      throw new Error('A persisted interview evaluation must include a completed session score.');
    }
    const questionScores = session.answers
      .filter((answer) => answer.score !== null)
      .map((answer) => ({
        questionId: answer.vacancyQuestionId,
        questionText: answer.questionText,
        sequence: answer.sequence,
        score: Number(answer.score),
      }));
    return {
      candidate: { ...candidate.candidate, email: candidate.candidate.email ?? '' },
      candidateId: candidate.candidateId,
      vacancyCandidateId: candidate.id,
      interviewId: invitation.id,
      interviewStatus: session.status,
      overallScore: Number(session.overallScore),
      preferredSkillCoverage: this.getPersistedCoverage(
        session.candidateIntelligence,
        'preferredSkills',
      ),
      rank: 0,
      requiredSkillCoverage: this.getPersistedCoverage(
        session.candidateIntelligence,
        'requiredSkills',
      ),
      coreQuestionCount: session.answers.length,
      evaluatedCoreAnswerCount: questionScores.length,
      questionScores,
      technologyScores: this.toTechnologyScores(session.answers),
    };
  }

  private toNotEvaluatedCandidate(candidate: ICandidateRankingRecord): INotEvaluatedCandidate {
    const latestInvitation = candidate.candidate.invitations.sort(
      (left, right) =>
        right.createdAt.getTime() - left.createdAt.getTime() || left.id.localeCompare(right.id),
    )[0];
    const session = latestInvitation?.session ?? null;
    return {
      candidate: { ...candidate.candidate, email: candidate.candidate.email ?? '' },
      candidateId: candidate.candidateId,
      vacancyCandidateId: candidate.id,
      interviewId: latestInvitation?.id ?? null,
      interviewStatus: session?.status ?? null,
      evaluationStatus: session?.evaluationStatus ?? null,
      reason:
        latestInvitation === undefined
          ? 'INTERVIEW_NOT_STARTED'
          : session?.status !== InterviewSessionStatus.COMPLETED
            ? 'INTERVIEW_INCOMPLETE'
            : session?.evaluationStatus === InterviewEvaluationStatus.FAILED
              ? 'EVALUATION_FAILED'
              : 'OVERALL_EVALUATION_PENDING',
    };
  }

  private toTechnologyScores(
    answers: IRankedInterviewSession['answers'],
  ): ICandidateTechnologyScore[] {
    const scoresByTechnology = new Map<string, number[]>();
    for (const answer of answers) {
      const technology = answer.vacancyQuestion?.question.technology.name;
      if (technology !== undefined && answer.score !== null) {
        const scores = scoresByTechnology.get(technology) ?? [];
        scores.push(Number(answer.score));
        scoresByTechnology.set(technology, scores);
      }
    }
    return [...scoresByTechnology.entries()]
      .map(([technology, scores]) => ({
        technology,
        averageScore: Number(
          (scores.reduce((total, score) => total + score, 0) / scores.length).toFixed(2),
        ),
        evaluatedCoreQuestionCount: scores.length,
      }))
      .sort((left, right) => left.technology.localeCompare(right.technology));
  }

  private assignCompetitionRanks(candidates: IRankedCandidate[]): void {
    let previousScore: number | null = null;
    let rank = 0;
    for (const [index, candidate] of candidates.entries()) {
      if (candidate.overallScore !== previousScore) {
        rank = index + 1;
        previousScore = candidate.overallScore;
      }
      candidate.rank = rank;
    }
  }

  private getPersistedCoverage(
    candidateIntelligence: Prisma.JsonValue | null,
    requirementType: 'preferredSkills' | 'requiredSkills',
  ): number | null {
    if (
      candidateIntelligence === null ||
      typeof candidateIntelligence !== 'object' ||
      Array.isArray(candidateIntelligence) ||
      !(requirementType in candidateIntelligence)
    ) {
      return null;
    }
    const requirement = candidateIntelligence[requirementType];
    if (
      requirement === null ||
      typeof requirement !== 'object' ||
      Array.isArray(requirement) ||
      !('coverage' in requirement) ||
      typeof requirement.coverage !== 'number'
    ) {
      return null;
    }
    return requirement.coverage;
  }
}
