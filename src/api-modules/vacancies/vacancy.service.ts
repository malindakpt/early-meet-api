import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { VacancyStatus, type Prisma } from '@prisma/client';

import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import type { CreateVacancyDto } from './dto/create-vacancy.dto.js';
import type { UpdateVacancyDto } from './dto/update-vacancy.dto.js';

const vacancyInclude = {
  createdByUser: { select: { name: true } },
} as const;

export type IVacancyResponse = Prisma.VacancyGetPayload<{ include: typeof vacancyInclude }>;

// Job-posting fields safe to expose to anonymous applicants. Never add internal fields
// (notes, ids, question set, interview configuration) here.
const publicApplicationSelect = {
  deadline: true,
  employmentType: true,
  experienceMax: true,
  experienceMin: true,
  jobDescription: true,
  location: true,
  status: true,
  title: true,
  workType: true,
  organization: { select: { name: true } },
} as const;

type IPublicApplicationRecord = Prisma.VacancyGetPayload<{
  select: typeof publicApplicationSelect;
}>;

export interface IPublicApplicationResponse
  extends Omit<IPublicApplicationRecord, 'organization' | 'status'> {
  acceptingApplications: boolean;
  companyName: string;
}

const closedVacancyStatuses: VacancyStatus[] = [VacancyStatus.CLOSED, VacancyStatus.ARCHIVED];
const DEADLINE_DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class VacancyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: IAuthenticatedUser, dto: CreateVacancyDto): Promise<IVacancyResponse> {
    return this.prisma.vacancy.create({
      data: {
        ...dto,
        organizationId: user.organizationId,
        createdBy: user.id,
        status: VacancyStatus.DRAFT,
      },
      include: vacancyInclude,
    });
  }

  async findAll(user: IAuthenticatedUser): Promise<IVacancyResponse[]> {
    return this.prisma.vacancy.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' },
      include: vacancyInclude,
    });
  }

  async findOne(user: IAuthenticatedUser, vacancyId: string): Promise<IVacancyResponse> {
    return this.findOwnedVacancy(vacancyId, user.organizationId);
  }

  async update(
    user: IAuthenticatedUser,
    vacancyId: string,
    dto: UpdateVacancyDto,
  ): Promise<IVacancyResponse> {
    await this.findOwnedVacancy(vacancyId, user.organizationId);
    return this.prisma.vacancy.update({
      where: { id: vacancyId },
      data: dto,
      include: vacancyInclude,
    });
  }

  async remove(user: IAuthenticatedUser, vacancyId: string): Promise<void> {
    await this.findOwnedVacancy(vacancyId, user.organizationId);
    await this.prisma.$transaction(async (transaction) => {
      const associations = await transaction.vacancyCandidate.findMany({
        where: { vacancyId },
        select: { candidateId: true },
      });
      const sessions = await transaction.interviewSession.findMany({
        where: { vacancyId },
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
      await transaction.interviewInvitation.deleteMany({ where: { vacancyId } });
      await transaction.vacancyQuestion.deleteMany({ where: { vacancyId } });
      await transaction.vacancyCustomQuestion.deleteMany({ where: { vacancyId } });
      await transaction.experienceCompetencyGeneration.deleteMany({ where: { vacancyId } });
      await transaction.vacancyExperienceQuestion.deleteMany({
        where: { area: { vacancyId } },
      });
      await transaction.vacancyExperienceArea.deleteMany({ where: { vacancyId } });
      await transaction.vacancyTechnology.deleteMany({ where: { vacancyId } });
      await transaction.vacancyCandidate.deleteMany({ where: { vacancyId } });
      for (const association of associations) {
        const remainingAssociations = await transaction.vacancyCandidate.count({
          where: { candidateId: association.candidateId },
        });
        if (remainingAssociations === 0) {
          await transaction.candidate.delete({ where: { id: association.candidateId } });
        }
      }
      await transaction.vacancy.delete({ where: { id: vacancyId } });
    });
  }

  async findPublicApplication(token: string): Promise<IPublicApplicationResponse> {
    const vacancy = await this.prisma.vacancy.findUnique({
      where: { publicApplicationToken: token },
      select: publicApplicationSelect,
    });
    if (vacancy === null) throw new NotFoundException('Application link not found.');
    const { organization, status, ...posting } = vacancy;
    return {
      ...posting,
      acceptingApplications: this.isAcceptingApplications(status, vacancy.deadline),
      companyName: organization.name,
    };
  }

  // Vacancies stay DRAFT until explicitly closed (no activation step exists), so applications
  // are accepted unless the vacancy is closed/archived or its deadline has passed.
  async findAcceptingPublicApplication(token: string): Promise<{ id: string }> {
    const vacancy = await this.prisma.vacancy.findUnique({
      where: { publicApplicationToken: token },
      select: { deadline: true, id: true, status: true },
    });
    if (vacancy === null) throw new NotFoundException('Application link not found.');
    if (!this.isAcceptingApplications(vacancy.status, vacancy.deadline)) {
      throw new ConflictException('Applications for this position are closed.');
    }
    return { id: vacancy.id };
  }

  // Deadlines are stored as midnight UTC of the chosen date; the whole deadline day stays open.
  private isAcceptingApplications(status: VacancyStatus, deadline: Date): boolean {
    return (
      !closedVacancyStatuses.includes(status) &&
      deadline.getTime() + DEADLINE_DAY_MS > Date.now()
    );
  }

  private async findOwnedVacancy(
    vacancyId: string,
    organizationId: string,
  ): Promise<IVacancyResponse> {
    const vacancy = await this.prisma.vacancy.findFirst({
      where: { id: vacancyId, organizationId },
      include: vacancyInclude,
    });
    if (vacancy === null) {
      throw new NotFoundException('Vacancy not found.');
    }
    return vacancy;
  }
}
