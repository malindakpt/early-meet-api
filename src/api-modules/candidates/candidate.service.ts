import { Injectable, NotFoundException } from '@nestjs/common';
import type { Candidate } from '@prisma/client';

import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import type { CreateCandidateDto } from './dto/create-candidate.dto.js';
import type { UpdateCandidateDto } from './dto/update-candidate.dto.js';

@Injectable()
export class CandidateService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCandidateDto): Promise<Candidate> {
    return this.prisma.candidate.create({ data: dto });
  }

  async findOne(candidateId: string): Promise<Candidate> {
    const candidate = await this.prisma.candidate.findUnique({ where: { id: candidateId } });
    if (candidate === null) {
      throw new NotFoundException('Candidate not found.');
    }
    return candidate;
  }

  async update(candidateId: string, dto: UpdateCandidateDto): Promise<Candidate> {
    await this.findOne(candidateId);
    return this.prisma.candidate.update({ where: { id: candidateId }, data: dto });
  }

  async findOrCreate(dto: CreateCandidateDto): Promise<Candidate> {
    const candidate = await this.prisma.candidate.findFirst({
      where: { email: dto.email },
      orderBy: { createdAt: 'asc' },
    });
    return candidate ?? this.create(dto);
  }
}
