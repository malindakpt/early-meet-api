import { CandidateStatus } from '@prisma/client';
export declare class UpdateCandidateDto {
    name?: string;
    email?: string;
    phone?: string;
    status?: CandidateStatus;
}
