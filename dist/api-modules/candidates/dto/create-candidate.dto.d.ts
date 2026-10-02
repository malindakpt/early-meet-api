import { CandidateStatus } from '@prisma/client';
export declare class CreateCandidateDto {
    name: string;
    email: string;
    phone: string;
    status: CandidateStatus;
}
