import { isEmail } from 'class-validator';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AiMatchStatus,
  CandidateDecision,
  CandidateProcessingStatus,
  Prisma,
} from '@prisma/client';

import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { CandidateService } from '../candidates/candidate.service.js';
import { VacancyService } from '../vacancies/vacancy.service.js';
import type { CreateVacancyCandidateDto } from './dto/create-vacancy-candidate.dto.js';
import type { UploadCandidateCvsDto } from './dto/upload-candidate-cvs.dto.js';
import type { SubmitPublicApplicationDto } from './dto/submit-public-application.dto.js';
import { VacancyTechnologyService } from '../vacancy-technologies/vacancy-technology.service.js';
import { calculateKeywordMatch } from './keyword-cv-match.js';
import { extractedCvDataSchema, type IExtractedCvData } from '../ai/cv-extraction.types.js';
import {
  SortDirection,
  VacancyCandidateSortBy,
  type VacancyCandidateListQueryDto,
} from './dto/vacancy-candidate-list-query.dto.js';

const interviewInvitationSummarySelect = {
  createdAt: true,
  expiresAt: true,
  id: true,
  sentAt: true,
  status: true,
} as const;

const candidateInclude = (vacancyId: string) =>
  ({
    candidate: {
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        processingStatus: true,
        cvFileName: true,
        cvProcessingError: true,
        invitations: {
          where: { vacancyId },
          orderBy: { createdAt: 'desc' },
          select: interviewInvitationSummarySelect,
          take: 1,
        },
        sessions: {
          where: { vacancyId },
          orderBy: { createdAt: 'desc' },
          select: {
            evaluationStatus: true,
            evaluatedAt: true,
            invitationId: true,
            overallScore: true,
            status: true,
          },
          take: 1,
        },
      },
    },
  }) as const;

type IVacancyCandidateRecord = Prisma.VacancyCandidateGetPayload<{
  include: ReturnType<typeof candidateInclude>;
}>;

export type IVacancyCandidateResponse = IVacancyCandidateRecord;

export interface ICvIngestResult {
  candidateId?: string;
  fileName: string;
  message?: string;
  status: 'CREATED' | 'DUPLICATE';
}

// Everything the single AI CV match call produced, persisted together on completion.
export interface IAiMatchResult {
  extractedData: IExtractedCvData;
  gaps: string[];
  preferredTechnologiesMet: string[];
  requiredTechnologiesMet: string[];
  score: number;
  strengths: string[];
  summary: string;
  vacancyMatchScore: number;
}

export interface IVacancyCandidateListResponse {
  items: IVacancyCandidateResponse[];
  pagination: { limit: number; page: number; total: number; totalPages: number };
}

@Injectable()
export class VacancyCandidateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vacancyService: VacancyService,
    private readonly candidateService: CandidateService,
    private readonly vacancyTechnologyService: VacancyTechnologyService,
  ) {}

  async uploadCvs(
    user: IAuthenticatedUser,
    vacancyId: string,
    dto: UploadCandidateCvsDto,
  ): Promise<{ items: ICvIngestResult[] }> {
    await this.vacancyService.findOne(user, vacancyId);
    const seenEmails = new Set<string>();
    const items: ICvIngestResult[] = [];
    for (const item of dto.candidates) {
      const email = item.email?.trim().toLowerCase();
      if (email !== undefined && seenEmails.has(email)) {
        items.push({
          fileName: item.fileName,
          message: 'Candidate already exists for this vacancy.',
          status: 'DUPLICATE',
        });
        continue;
      }
      if (email !== undefined) seenEmails.add(email);
      items.push(await this.ingestCv(vacancyId, { ...item, email }));
    }
    return { items };
  }

  // Anonymous CV submission via a vacancy's public application link. The keyword score is
  // computed here because the request comes from an untrusted, unauthenticated browser.
  async submitPublicApplication(token: string, dto: SubmitPublicApplicationDto): Promise<void> {
    const vacancy = await this.vacancyService.findAcceptingPublicApplication(token);
    const technologies = await this.vacancyTechnologyService.findKeywordMatchTechnologies(
      vacancy.id,
    );
    const { score, ...breakdown } = calculateKeywordMatch(dto.extractedText, technologies);
    const result = await this.ingestCv(vacancy.id, {
      email: dto.email.trim().toLowerCase(),
      extractedText: dto.extractedText,
      fileName: dto.fileName,
      keywordMatchBreakdown: breakdown,
      keywordMatchScore: score,
    });
    if (result.status === 'DUPLICATE') {
      throw new ConflictException('You have already applied for this position.');
    }
  }

  private async ingestCv(
    vacancyId: string,
    item: {
      email?: string;
      extractedText: string;
      fileName: string;
      keywordMatchBreakdown?: object;
      keywordMatchScore?: number;
    },
  ): Promise<ICvIngestResult> {
    const { email } = item;
    try {
      const candidate = await this.prisma.$transaction(async (transaction) => {
        if (email !== undefined) {
          await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${vacancyId}:${email}`}))`;
          const existingAssociation = await transaction.vacancyCandidate.findFirst({
            where: { vacancyId, candidate: { is: { email } } },
            select: { id: true },
          });
          if (existingAssociation !== null) throw new DuplicateCandidateForVacancyError();
        }
        // No AI runs at upload: the browser already supplied the email, CV text and keyword
        // match. The name is provisional until HR calculates the AI CV match, which extracts it.
        const uploadedAt = new Date();
        const createdCandidate = await transaction.candidate.create({
          data: {
            name: email ?? toUploadTimestampName(uploadedAt),
            email,
            phone: '',
            status: 'ACTIVE',
            processingStatus: CandidateProcessingStatus.READY,
            cvFileName: this.toFileName(item.fileName),
            cvExtractedText: item.extractedText,
          },
        });
        await transaction.vacancyCandidate.create({
          data: {
            candidateId: createdCandidate.id,
            vacancyId,
            vacancyMatchScore: 0,
            keywordMatchScore: item.keywordMatchScore,
            keywordMatchCalculatedAt: new Date(),
            keywordMatchBreakdown: item.keywordMatchBreakdown as Prisma.InputJsonValue,
            requiredTechnologiesMet: [],
            preferredTechnologiesMet: [],
            strengths: [],
            gaps: [],
            decision: CandidateDecision.KEEP_IN_REVIEW,
            summary: '',
            notes: '',
          },
        });
        return createdCandidate;
      });
      return { candidateId: candidate.id, fileName: item.fileName, status: 'CREATED' };
    } catch (error: unknown) {
      if (
        error instanceof DuplicateCandidateForVacancyError ||
        (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
      ) {
        return {
          fileName: item.fileName,
          message: 'Candidate already exists for this vacancy.',
          status: 'DUPLICATE',
        };
      }
      throw error;
    }
  }

  async retryCvProcessing(
    user: IAuthenticatedUser,
    vacancyId: string,
    vacancyCandidateId: string,
  ): Promise<IVacancyCandidateResponse> {
    const association = await this.findOne(user, vacancyId, vacancyCandidateId);
    if (association.candidate.processingStatus !== CandidateProcessingStatus.FAILED) {
      throw new ConflictException('Only failed CV processing can be retried.');
    }
    // CV extraction now happens in the AI CV match, so a failed legacy intake only needs to be
    // released; HR then calculates the AI match to extract the CV.
    await this.prisma.candidate.update({
      where: { id: association.candidateId },
      data: { cvProcessingError: null, processingStatus: CandidateProcessingStatus.READY },
    });
    return this.findOne(user, vacancyId, vacancyCandidateId);
  }

  async queueAiMatches(
    user: IAuthenticatedUser,
    vacancyId: string,
    vacancyCandidateIds: string[],
  ): Promise<string[]> {
    await this.vacancyService.findOne(user, vacancyId);
    const uniqueIds = [...new Set(vacancyCandidateIds)];
    const associations = await this.prisma.vacancyCandidate.findMany({
      where: { id: { in: uniqueIds }, vacancyId },
      select: { candidate: { select: { processingStatus: true } }, id: true },
    });
    if (associations.length !== uniqueIds.length) {
      throw new NotFoundException('One or more vacancy candidates were not found.');
    }
    if (
      associations.some(
        (association) => association.candidate.processingStatus !== CandidateProcessingStatus.READY,
      )
    ) {
      throw new ConflictException('AI matching requires completed CV processing.');
    }
    const eligibleIds = associations.map((association) => association.id);
    // COMPLETED is re-queued for recalculation: the existing row's AI result is replaced on
    // completion. QUEUED/PROCESSING rows are left alone so a match never runs twice at once.
    await this.prisma.vacancyCandidate.updateMany({
      where: {
        id: { in: eligibleIds },
        aiMatchStatus: {
          in: [AiMatchStatus.NOT_REQUESTED, AiMatchStatus.FAILED, AiMatchStatus.COMPLETED],
        },
      },
      data: {
        aiMatchError: null,
        aiMatchStartedAt: null,
        aiMatchCompletedAt: null,
        aiMatchStatus: AiMatchStatus.QUEUED,
      },
    });
    const queued = await this.prisma.vacancyCandidate.findMany({
      where: { id: { in: eligibleIds }, aiMatchStatus: AiMatchStatus.QUEUED },
      select: { id: true },
    });
    return queued.map((association) => association.id);
  }

  async claimAiMatch(vacancyCandidateId: string): Promise<boolean> {
    const claim = await this.prisma.vacancyCandidate.updateMany({
      where: { id: vacancyCandidateId, aiMatchStatus: AiMatchStatus.QUEUED },
      data: { aiMatchStartedAt: new Date(), aiMatchStatus: AiMatchStatus.PROCESSING },
    });
    return claim.count === 1;
  }

  async completeAiMatch(vacancyCandidateId: string, result: IAiMatchResult): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      // Guarded by PROCESSING so a result never lands on a match that was not claimed.
      const completed = await transaction.vacancyCandidate.updateMany({
        where: { id: vacancyCandidateId, aiMatchStatus: AiMatchStatus.PROCESSING },
        data: {
          aiMatchCompletedAt: new Date(),
          aiMatchError: null,
          aiMatchScore: result.score,
          aiMatchStatus: AiMatchStatus.COMPLETED,
          gaps: result.gaps,
          preferredTechnologiesMet: result.preferredTechnologiesMet,
          requiredTechnologiesMet: result.requiredTechnologiesMet,
          strengths: result.strengths,
          summary: result.summary,
          vacancyMatchScore: result.vacancyMatchScore,
        },
      });
      if (completed.count === 0) return;
      const association = await transaction.vacancyCandidate.findUniqueOrThrow({
        where: { id: vacancyCandidateId },
        select: { candidate: { select: { email: true, id: true } }, vacancyId: true },
      });
      const { candidate } = result.extractedData;
      await transaction.candidate.update({
        where: { id: association.candidate.id },
        data: {
          ...(candidate.fullName === null ? {} : { name: candidate.fullName }),
          ...(candidate.phone === null ? {} : { phone: candidate.phone.slice(0, 50) }),
          ...(association.candidate.email === null
            ? await this.findAvailableExtractedEmail(
                transaction,
                association.vacancyId,
                candidate.email,
              )
            : {}),
          cvExtractedData: result.extractedData,
        },
      });
    });
  }

  // The browser-extracted email is authoritative and is never replaced. Only when the upload had
  // no email is the AI-extracted one adopted, and only if no other candidate already uses it.
  private async findAvailableExtractedEmail(
    transaction: Prisma.TransactionClient,
    vacancyId: string,
    extractedEmail: string | null,
  ): Promise<{ email?: string }> {
    const email = extractedEmail?.trim().toLowerCase();
    if (email === undefined || !isEmail(email) || email.length > 255) return {};
    await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${vacancyId}:${email}`}))`;
    const existing = await transaction.candidate.findFirst({
      where: { email },
      select: { id: true },
    });
    return existing === null ? { email } : {};
  }

  async failAiMatch(vacancyCandidateId: string): Promise<void> {
    await this.prisma.vacancyCandidate.updateMany({
      where: { id: vacancyCandidateId, aiMatchStatus: AiMatchStatus.PROCESSING },
      data: {
        aiMatchError: 'We could not calculate the AI match score.',
        aiMatchStatus: AiMatchStatus.FAILED,
      },
    });
  }

  async getPersistedCvExtractedData(vacancyCandidateId: string): Promise<IExtractedCvData> {
    const vacancyCandidate = await this.prisma.vacancyCandidate.findUnique({
      where: { id: vacancyCandidateId },
      select: {
        candidate: {
          select: { cvExtractedData: true, processingStatus: true },
        },
      },
    });
    if (vacancyCandidate === null) throw new NotFoundException('Vacancy candidate not found.');
    if (vacancyCandidate.candidate.cvExtractedData === null) {
      throw new ConflictException('Candidate CV processing has not completed.');
    }
    if (vacancyCandidate.candidate.processingStatus !== CandidateProcessingStatus.READY) {
      throw new ConflictException('Candidate CV processing has not completed.');
    }
    const parsed = extractedCvDataSchema.safeParse(vacancyCandidate.candidate.cvExtractedData);
    if (!parsed.success) throw new BadRequestException('Candidate CV extracted data is invalid.');
    return parsed.data;
  }

  async getCvTextForAiMatch(vacancyCandidateId: string): Promise<string> {
    const vacancyCandidate = await this.prisma.vacancyCandidate.findUnique({
      where: { id: vacancyCandidateId },
      select: { candidate: { select: { cvExtractedText: true } } },
    });
    if (vacancyCandidate === null) throw new NotFoundException('Vacancy candidate not found.');
    const cvText = vacancyCandidate.candidate.cvExtractedText;
    if (cvText === null || cvText.trim().length === 0) {
      throw new ConflictException('The candidate has no uploaded CV text.');
    }
    return cvText;
  }

  async create(
    user: IAuthenticatedUser,
    vacancyId: string,
    dto: CreateVacancyCandidateDto,
  ): Promise<IVacancyCandidateResponse> {
    await this.vacancyService.findOne(user, vacancyId);
    const candidate = await this.candidateService.findOrCreate(dto);
    try {
      return this.toResponse(
        await this.prisma.vacancyCandidate.create({
          data: {
            candidateId: candidate.id,
            vacancyId,
            vacancyMatchScore: 0,
            requiredTechnologiesMet: [],
            preferredTechnologiesMet: [],
            strengths: [],
            gaps: [],
            decision: CandidateDecision.KEEP_IN_REVIEW,
            summary: '',
            notes: '',
          },
          include: candidateInclude(vacancyId),
        }),
      );
    } catch (error: unknown) {
      this.rethrowDuplicateAssociation(error);
    }
  }

  async findAll(
    user: IAuthenticatedUser,
    vacancyId: string,
    query: VacancyCandidateListQueryDto,
  ): Promise<IVacancyCandidateListResponse> {
    await this.vacancyService.findOne(user, vacancyId);
    this.validateScoreRange(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const where = this.toListWhere(vacancyId, query);
    const isInterviewScoreSort = query.sortBy === VacancyCandidateSortBy.AI_INTERVIEW_SCORE;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.vacancyCandidate.findMany({
        where,
        include: candidateInclude(vacancyId),
        orderBy: isInterviewScoreSort
          ? { createdAt: SortDirection.DESC }
          : this.toListOrderBy(query),
        ...(isInterviewScoreSort ? {} : { skip: (page - 1) * limit, take: limit }),
      }),
      this.prisma.vacancyCandidate.count({ where }),
    ]);
    const pageItems = isInterviewScoreSort
      ? this.sortByInterviewScore(items, query.sortDirection ?? SortDirection.DESC).slice(
          (page - 1) * limit,
          page * limit,
        )
      : items;
    return {
      items: pageItems.map((item) => this.toResponse(item)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(
    user: IAuthenticatedUser,
    vacancyId: string,
    vacancyCandidateId: string,
  ): Promise<IVacancyCandidateResponse> {
    await this.vacancyService.findOne(user, vacancyId);
    return this.toResponse(await this.findAssociation(vacancyId, vacancyCandidateId));
  }

  async update(
    user: IAuthenticatedUser,
    vacancyId: string,
    vacancyCandidateId: string,
    dto: Prisma.VacancyCandidateUpdateInput,
  ): Promise<IVacancyCandidateResponse> {
    await this.vacancyService.findOne(user, vacancyId);
    await this.findAssociation(vacancyId, vacancyCandidateId);
    return this.toResponse(
      await this.prisma.vacancyCandidate.update({
        where: { id: vacancyCandidateId },
        data: dto,
        include: candidateInclude(vacancyId),
      }),
    );
  }

  async remove(
    user: IAuthenticatedUser,
    vacancyId: string,
    vacancyCandidateId: string,
  ): Promise<void> {
    await this.vacancyService.findOne(user, vacancyId);
    const association = await this.findAssociation(vacancyId, vacancyCandidateId);
    await this.prisma.$transaction(async (transaction) => {
      await this.deleteInterviewData(transaction, association.candidateId, vacancyId);
      await transaction.vacancyCandidate.delete({ where: { id: association.id } });
      const remainingAssociations = await transaction.vacancyCandidate.count({
        where: { candidateId: association.candidateId },
      });
      if (remainingAssociations === 0) {
        await transaction.candidate.delete({ where: { id: association.candidateId } });
      }
    });
  }

  private async findAssociation(
    vacancyId: string,
    vacancyCandidateId: string,
  ): Promise<IVacancyCandidateRecord> {
    const association = await this.prisma.vacancyCandidate.findFirst({
      where: { id: vacancyCandidateId, vacancyId },
      include: candidateInclude(vacancyId),
    });
    if (association === null) {
      throw new NotFoundException('Vacancy candidate not found.');
    }
    return association;
  }

  private async deleteInterviewData(
    transaction: Prisma.TransactionClient,
    candidateId: string,
    vacancyId: string,
  ): Promise<void> {
    const sessions = await transaction.interviewSession.findMany({
      where: { candidateId, vacancyId },
      select: { id: true },
    });
    const sessionIds = sessions.map((session) => session.id);
    if (sessionIds.length > 0) {
      await transaction.interviewQuestionAnswer.updateMany({
        where: { interviewSessionId: { in: sessionIds }, followUpFromId: { not: null } },
        data: { followUpFromId: null },
      });
      await transaction.interviewQuestionAnswer.deleteMany({
        where: { interviewSessionId: { in: sessionIds } },
      });
      await transaction.interviewSession.deleteMany({ where: { id: { in: sessionIds } } });
    }
    await transaction.interviewInvitation.deleteMany({ where: { candidateId, vacancyId } });
  }

  private toFileName(originalName: string): string {
    const fileName = originalName.replaceAll('\\', '/').split('/').at(-1) ?? '';
    if (
      fileName.length === 0 ||
      fileName.length > 255 ||
      !fileName.toLowerCase().endsWith('.pdf')
    ) {
      throw new BadRequestException('The CV filename is invalid.');
    }
    return fileName;
  }

  private rethrowDuplicateAssociation(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('This candidate is already associated with the vacancy.');
    }
    throw error;
  }

  private toListWhere(
    vacancyId: string,
    query: VacancyCandidateListQueryDto,
  ): Prisma.VacancyCandidateWhereInput {
    return {
      vacancyId,
      ...(query.status === undefined && query.processingStatus === undefined
        ? {}
        : {
            candidate: {
              is: {
                ...(query.status === undefined ? {} : { status: query.status }),
                ...(query.processingStatus === undefined
                  ? {}
                  : { processingStatus: query.processingStatus }),
              },
            },
          }),
      ...(query.decision === undefined ? {} : { decision: query.decision }),
      ...(query.minMatchScore === undefined && query.maxMatchScore === undefined
        ? {}
        : {
            vacancyMatchScore: {
              ...(query.minMatchScore === undefined ? {} : { gte: query.minMatchScore }),
              ...(query.maxMatchScore === undefined ? {} : { lte: query.maxMatchScore }),
            },
          }),
    };
  }

  private toListOrderBy(
    query: VacancyCandidateListQueryDto,
  ): Prisma.VacancyCandidateOrderByWithRelationInput[] {
    const direction = query.sortDirection ?? SortDirection.DESC;
    const sortBy = query.sortBy ?? VacancyCandidateSortBy.CREATED_AT;
    if (sortBy === VacancyCandidateSortBy.AI_MATCH_SCORE) {
      return [
        { aiMatchScore: { nulls: 'last', sort: direction } },
        { createdAt: SortDirection.DESC },
      ];
    }
    if (sortBy === VacancyCandidateSortBy.KEYWORD_MATCH_SCORE) {
      return [
        { keywordMatchScore: { nulls: 'last', sort: direction } },
        { createdAt: SortDirection.DESC },
      ];
    }
    const field =
      sortBy === VacancyCandidateSortBy.MATCH_SCORE
        ? 'vacancyMatchScore'
        : sortBy === VacancyCandidateSortBy.UPDATED_AT
          ? 'updatedAt'
          : 'createdAt';
    return [{ [field]: direction }, { createdAt: SortDirection.DESC }];
  }

  private sortByInterviewScore(
    candidates: IVacancyCandidateRecord[],
    direction: SortDirection,
  ): IVacancyCandidateRecord[] {
    return [...candidates].sort((first, second) => {
      const firstScore = this.getCompletedInterviewScore(first);
      const secondScore = this.getCompletedInterviewScore(second);
      if (firstScore === null && secondScore === null) {
        return second.createdAt.getTime() - first.createdAt.getTime();
      }
      if (firstScore === null) return 1;
      if (secondScore === null) return -1;
      if (firstScore === secondScore) return second.createdAt.getTime() - first.createdAt.getTime();
      return direction === SortDirection.ASC ? firstScore - secondScore : secondScore - firstScore;
    });
  }

  private getCompletedInterviewScore(candidate: IVacancyCandidateRecord): number | null {
    const session = candidate.candidate.sessions[0];
    return session?.evaluationStatus === 'EVALUATED' && session.overallScore !== null
      ? Number(session.overallScore)
      : null;
  }

  private validateScoreRange(query: VacancyCandidateListQueryDto): void {
    if (
      query.minMatchScore !== undefined &&
      query.maxMatchScore !== undefined &&
      query.minMatchScore > query.maxMatchScore
    ) {
      throw new BadRequestException('minMatchScore must not exceed maxMatchScore.');
    }
  }

  private toResponse(candidate: IVacancyCandidateRecord): IVacancyCandidateResponse {
    return candidate;
  }
}

class DuplicateCandidateForVacancyError extends Error {}

// Provisional name for a CV uploaded without an email, e.g. "2026-09-28 14:05:31 UTC". UTC keeps
// it independent of the server's time zone and matches the backfill in the migration.
export function toUploadTimestampName(uploadedAt: Date): string {
  return `${uploadedAt.toISOString().slice(0, 19).replace('T', ' ')} UTC`;
}
