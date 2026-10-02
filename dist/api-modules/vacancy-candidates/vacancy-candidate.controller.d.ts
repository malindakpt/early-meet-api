import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { CreateVacancyCandidateDto } from './dto/create-vacancy-candidate.dto.js';
import { CandidateRankingQueryDto } from './dto/candidate-ranking-query.dto.js';
import { UploadCandidateCvsDto } from './dto/upload-candidate-cvs.dto.js';
import { UpdateVacancyCandidateDto } from './dto/update-vacancy-candidate.dto.js';
import { VacancyCandidateListQueryDto } from './dto/vacancy-candidate-list-query.dto.js';
import { type IVacancyCandidateListResponse, type IVacancyCandidateResponse, VacancyCandidateService } from './vacancy-candidate.service.js';
import { CandidateRankingService, type ICandidateRankingResponse } from './candidate-ranking.service.js';
export declare class VacancyCandidateController {
    private readonly candidateRankingService;
    private readonly vacancyCandidateService;
    constructor(candidateRankingService: CandidateRankingService, vacancyCandidateService: VacancyCandidateService);
    uploadCvs(user: IAuthenticatedUser, vacancyId: string, dto: UploadCandidateCvsDto): Promise<{
        items: Array<{
            candidateId?: string;
            fileName: string;
            message?: string;
            status: 'CREATED' | 'DUPLICATE';
        }>;
    }>;
    retryCvProcessing(user: IAuthenticatedUser, vacancyId: string, vacancyCandidateId: string): Promise<IVacancyCandidateResponse>;
    create(user: IAuthenticatedUser, vacancyId: string, dto: CreateVacancyCandidateDto): Promise<IVacancyCandidateResponse>;
    findAll(user: IAuthenticatedUser, vacancyId: string, query: VacancyCandidateListQueryDto): Promise<IVacancyCandidateListResponse>;
    findRanking(user: IAuthenticatedUser, vacancyId: string, query: CandidateRankingQueryDto): Promise<ICandidateRankingResponse>;
    findOne(user: IAuthenticatedUser, vacancyId: string, vacancyCandidateId: string): Promise<IVacancyCandidateResponse>;
    update(user: IAuthenticatedUser, vacancyId: string, vacancyCandidateId: string, dto: UpdateVacancyCandidateDto): Promise<IVacancyCandidateResponse>;
    remove(user: IAuthenticatedUser, vacancyId: string, vacancyCandidateId: string): Promise<void>;
}
