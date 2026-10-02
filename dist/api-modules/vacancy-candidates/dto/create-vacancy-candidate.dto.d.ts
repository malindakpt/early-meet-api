import { CandidateStatus } from '@prisma/client';
export declare class CreateVacancyCandidateDto {
    name: string;
    email: string;
    phone: string;
    status: CandidateStatus;
}
