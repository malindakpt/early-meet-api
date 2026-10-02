import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type Technology } from '@prisma/client';

import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import type { CreateTechnologyDto } from './dto/create-technology.dto.js';
import type { UpdateTechnologyDto } from './dto/update-technology.dto.js';

@Injectable()
export class TechnologyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTechnologyDto): Promise<Technology> {
    try {
      return await this.prisma.technology.create({ data: dto });
    } catch (error: unknown) {
      this.rethrowDuplicateName(error);
    }
  }

  async findAll(): Promise<Technology[]> {
    return this.prisma.technology.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(technologyId: string): Promise<Technology> {
    const technology = await this.prisma.technology.findUnique({ where: { id: technologyId } });
    if (technology === null) {
      throw new NotFoundException('Technology not found.');
    }
    return technology;
  }

  async update(technologyId: string, dto: UpdateTechnologyDto): Promise<Technology> {
    await this.findOne(technologyId);
    try {
      return await this.prisma.technology.update({ where: { id: technologyId }, data: dto });
    } catch (error: unknown) {
      this.rethrowDuplicateName(error);
    }
  }

  private rethrowDuplicateName(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('A technology with this name already exists.');
    }
    throw error;
  }
}
