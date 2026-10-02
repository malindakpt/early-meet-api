import { type Prisma } from '@prisma/client';
import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import type { CreateVacancyDto } from './dto/create-vacancy.dto.js';
import type { UpdateVacancyDto } from './dto/update-vacancy.dto.js';
declare const vacancyInclude: {
    readonly createdByUser: {
        readonly select: {
            readonly name: true;
        };
    };
};
export type IVacancyResponse = Prisma.VacancyGetPayload<{
    include: typeof vacancyInclude;
}>;
declare const publicApplicationSelect: {
    readonly deadline: true;
    readonly employmentType: true;
    readonly experienceMax: true;
    readonly experienceMin: true;
    readonly jobDescription: true;
    readonly location: true;
    readonly status: true;
    readonly title: true;
    readonly workType: true;
    readonly organization: {
        readonly select: {
            readonly name: true;
        };
    };
};
type IPublicApplicationRecord = Prisma.VacancyGetPayload<{
    select: typeof publicApplicationSelect;
}>;
export interface IPublicApplicationResponse extends Omit<IPublicApplicationRecord, 'organization' | 'status'> {
    acceptingApplications: boolean;
    companyName: string;
}
export declare class VacancyService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(user: IAuthenticatedUser, dto: CreateVacancyDto): Promise<IVacancyResponse>;
    findAll(user: IAuthenticatedUser): Promise<IVacancyResponse[]>;
    findOne(user: IAuthenticatedUser, vacancyId: string): Promise<IVacancyResponse>;
    update(user: IAuthenticatedUser, vacancyId: string, dto: UpdateVacancyDto): Promise<IVacancyResponse>;
    remove(user: IAuthenticatedUser, vacancyId: string): Promise<void>;
    findPublicApplication(token: string): Promise<IPublicApplicationResponse>;
    findAcceptingPublicApplication(token: string): Promise<{
        id: string;
    }>;
    private isAcceptingApplications;
    private findOwnedVacancy;
}
export {};
