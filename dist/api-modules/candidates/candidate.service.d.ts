import type { Candidate } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import type { CreateCandidateDto } from './dto/create-candidate.dto.js';
import type { UpdateCandidateDto } from './dto/update-candidate.dto.js';
export declare class CandidateService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateCandidateDto): Promise<Candidate>;
    findOne(candidateId: string): Promise<Candidate>;
    update(candidateId: string, dto: UpdateCandidateDto): Promise<Candidate>;
    findOrCreate(dto: CreateCandidateDto): Promise<Candidate>;
}
