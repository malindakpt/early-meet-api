import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type TechnologySegment } from '@prisma/client';

import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { TechnologyService } from '../technologies/technology.service.js';
import type { CreateTechnologySegmentDto } from './dto/create-technology-segment.dto.js';
import type { UpdateTechnologySegmentDto } from './dto/update-technology-segment.dto.js';

@Injectable()
export class TechnologySegmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly technologyService: TechnologyService,
  ) {}

  async create(technologyId: string, dto: CreateTechnologySegmentDto): Promise<TechnologySegment> {
    await this.technologyService.findOne(technologyId);
    try {
      return await this.prisma.technologySegment.create({ data: { ...dto, technologyId } });
    } catch (error: unknown) {
      this.rethrowDuplicateName(error);
    }
  }

  async findAll(technologyId: string): Promise<TechnologySegment[]> {
    await this.technologyService.findOne(technologyId);
    return this.prisma.technologySegment.findMany({
      where: { technologyId },
      orderBy: { name: 'asc' },
    });
  }

  async findAllAcrossTechnologies(): Promise<TechnologySegment[]> {
    return this.prisma.technologySegment.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(technologyId: string, segmentId: string): Promise<TechnologySegment> {
    await this.technologyService.findOne(technologyId);
    return this.findSegmentForTechnology(technologyId, segmentId);
  }

  async update(
    technologyId: string,
    segmentId: string,
    dto: UpdateTechnologySegmentDto,
  ): Promise<TechnologySegment> {
    await this.technologyService.findOne(technologyId);
    await this.findSegmentForTechnology(technologyId, segmentId);
    try {
      return await this.prisma.technologySegment.update({ where: { id: segmentId }, data: dto });
    } catch (error: unknown) {
      this.rethrowDuplicateName(error);
    }
  }

  private async findSegmentForTechnology(
    technologyId: string,
    segmentId: string,
  ): Promise<TechnologySegment> {
    const segment = await this.prisma.technologySegment.findFirst({
      where: { id: segmentId, technologyId },
    });
    if (segment === null) {
      throw new NotFoundException('Technology segment not found.');
    }
    return segment;
  }

  private rethrowDuplicateName(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('A segment with this name already exists for this technology.');
    }
    throw error;
  }
}
