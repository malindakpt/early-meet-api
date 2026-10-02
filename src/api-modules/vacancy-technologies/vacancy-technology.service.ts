import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { Prisma, type TechnologySegment } from '@prisma/client';

import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { TechnologyService } from '../technologies/technology.service.js';
import { TechnologySegmentService } from '../technology-segments/technology-segment.service.js';
import { VacancyService } from '../vacancies/vacancy.service.js';
import type { IKeywordMatchTechnology } from '../vacancy-candidates/keyword-cv-match.js';
import type { CreateVacancyTechnologyDto } from './dto/create-vacancy-technology.dto.js';
import type { UpdateVacancyTechnologyDto } from './dto/update-vacancy-technology.dto.js';

const technologySelect = {
  id: true,
  name: true,
  description: true,
  status: true,
} as const;
type IVacancyTechnologyRecord = Prisma.VacancyTechnologyGetPayload<{
  include: {
    technology: { select: typeof technologySelect };
  };
}>;

export interface IVacancyTechnologyResponse extends IVacancyTechnologyRecord {
  segments: Array<Pick<TechnologySegment, 'id' | 'name'>>;
}

@Injectable()
export class VacancyTechnologyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vacancyService: VacancyService,
    private readonly technologyService: TechnologyService,
    private readonly technologySegmentService: TechnologySegmentService,
  ) {}

  async create(
    user: IAuthenticatedUser,
    vacancyId: string,
    dto: CreateVacancyTechnologyDto,
  ): Promise<IVacancyTechnologyResponse> {
    await this.vacancyService.findOne(user, vacancyId);
    await this.technologyService.findOne(dto.technologyId);
    const segmentSelections = await this.normalizeSegmentSelections(
      dto.technologyId,
      dto.segmentSelections,
    );
    try {
      const relationship = await this.prisma.vacancyTechnology.create({
        data: { ...dto, segmentSelections, vacancyId },
        include: { technology: { select: technologySelect } },
      });
      return this.toResponse(relationship);
    } catch (error: unknown) {
      this.rethrowDuplicateTechnology(error);
    }
  }

  async findAll(
    user: IAuthenticatedUser,
    vacancyId: string,
  ): Promise<IVacancyTechnologyResponse[]> {
    await this.vacancyService.findOne(user, vacancyId);
    const relationships = await this.prisma.vacancyTechnology.findMany({
      where: { vacancyId },
      include: { technology: { select: technologySelect } },
      orderBy: { createdAt: 'asc' },
    });
    return Promise.all(relationships.map((relationship) => this.toResponse(relationship)));
  }

  async update(
    user: IAuthenticatedUser,
    vacancyId: string,
    vacancyTechnologyId: string,
    dto: UpdateVacancyTechnologyDto,
  ): Promise<IVacancyTechnologyResponse> {
    await this.vacancyService.findOne(user, vacancyId);
    const relationship = await this.findRelationship(vacancyId, vacancyTechnologyId);
    const segmentSelections =
      dto.segmentSelections === undefined
        ? undefined
        : await this.normalizeSegmentSelections(relationship.technologyId, dto.segmentSelections);
    const updated = await this.prisma.vacancyTechnology.update({
      where: { id: vacancyTechnologyId },
      data: { ...dto, segmentSelections },
      include: { technology: { select: technologySelect } },
    });
    return this.toResponse(updated);
  }

  async remove(
    user: IAuthenticatedUser,
    vacancyId: string,
    vacancyTechnologyId: string,
  ): Promise<void> {
    await this.vacancyService.findOne(user, vacancyId);
    await this.findRelationship(vacancyId, vacancyTechnologyId);
    await this.prisma.vacancyTechnology.delete({ where: { id: vacancyTechnologyId } });
  }

  // Internal read for server-side keyword matching; callers must have authorized access to the
  // vacancy (e.g. via its public application token) before calling this.
  async findKeywordMatchTechnologies(vacancyId: string): Promise<IKeywordMatchTechnology[]> {
    const relationships = await this.prisma.vacancyTechnology.findMany({
      where: { vacancyId },
      include: { technology: { select: technologySelect } },
      orderBy: { createdAt: 'asc' },
    });
    return Promise.all(
      relationships.map(async (relationship) => ({
        requirementType: relationship.requirementType,
        segments: (
          await this.resolveSegments(relationship.technologyId, relationship.segmentSelections)
        ).map(({ name }) => ({ name })),
        technology: { name: relationship.technology.name },
      })),
    );
  }

  async resolveSegments(
    technologyId: string,
    segmentSelections: string[],
  ): Promise<Array<Pick<TechnologySegment, 'id' | 'name'>>> {
    if (segmentSelections.includes('ALL')) {
      return this.technologySegmentService.findAll(technologyId);
    }
    return Promise.all(
      segmentSelections.map((segmentId) =>
        this.technologySegmentService.findOne(technologyId, segmentId),
      ),
    );
  }

  private async findRelationship(
    vacancyId: string,
    vacancyTechnologyId: string,
  ): Promise<{ technologyId: string }> {
    const relationship = await this.prisma.vacancyTechnology.findFirst({
      where: { id: vacancyTechnologyId, vacancyId },
      select: { technologyId: true },
    });
    if (relationship === null) throw new NotFoundException('Vacancy technology not found.');
    return relationship;
  }

  private async normalizeSegmentSelections(
    technologyId: string,
    segmentSelections: string[],
  ): Promise<string[]> {
    const normalizedSelections = [...new Set(segmentSelections)];
    if (normalizedSelections.includes('ALL')) {
      if (normalizedSelections.length > 1) {
        throw new UnprocessableEntityException(
          'All segment selection cannot be combined with individual technology segments.',
        );
      }
      return ['ALL'];
    }
    if (normalizedSelections.some((segmentId) => !isUUID(segmentId))) {
      throw new UnprocessableEntityException('Technology segment selections must be UUIDs or ALL.');
    }
    await Promise.all(
      normalizedSelections.map((segmentId) =>
        this.technologySegmentService.findOne(technologyId, segmentId),
      ),
    );
    return normalizedSelections;
  }

  private async toResponse(
    relationship: IVacancyTechnologyRecord,
  ): Promise<IVacancyTechnologyResponse> {
    return {
      ...relationship,
      segments: await this.resolveSegments(
        relationship.technologyId,
        relationship.segmentSelections,
      ),
    };
  }

  private rethrowDuplicateTechnology(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException(
        'This technology is already configured for the vacancy and requirement type.',
      );
    }
    throw error;
  }
}
