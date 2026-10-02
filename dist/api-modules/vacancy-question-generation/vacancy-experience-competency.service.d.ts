import { Prisma, type VacancyExperienceQuestion } from '@prisma/client';
import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { VacancyService } from '../vacancies/vacancy.service.js';
import type { CreateExperienceCompetencyAreaDto } from './dto/create-experience-competency-area.dto.js';
import type { CreateExperienceCompetencyPlanDto } from './dto/create-experience-competency-plan.dto.js';
import type { SaveExperienceCompetencyConfigurationDto } from './dto/save-experience-competency-configuration.dto.js';
import type { UpdateExperienceCompetencyAreaDto } from './dto/update-experience-competency-area.dto.js';
import type { UpdateExperienceCompetencyQuestionDto } from './dto/update-experience-competency-question.dto.js';
declare const areaInclude: {
    readonly questions: {
        readonly orderBy: {
            readonly sequence: "asc";
        };
    };
};
export type IExperienceCompetencyAreaResponse = Prisma.VacancyExperienceAreaGetPayload<{
    include: typeof areaInclude;
}>;
export type IGeneratedExperienceCompetencyArea = Pick<CreateExperienceCompetencyAreaDto, 'importance' | 'name' | 'reason' | 'whatToEstablish' | 'questions'>;
interface IGeneratedAreaInput {
    importance: 'HIGH' | 'MEDIUM' | 'LOW';
    name: string;
}
export declare class VacancyExperienceCompetencyService {
    private readonly prisma;
    private readonly vacancyService;
    constructor(prisma: PrismaService, vacancyService: VacancyService);
    findAll(user: IAuthenticatedUser, vacancyId: string): Promise<IExperienceCompetencyAreaResponse[]>;
    createPlan(user: IAuthenticatedUser, vacancyId: string, dto: CreateExperienceCompetencyPlanDto): Promise<IExperienceCompetencyAreaResponse[]>;
    createGeneratedPlan(vacancyId: string, areas: IGeneratedExperienceCompetencyArea[]): Promise<void>;
    replaceGeneratedAreas(vacancyId: string, areas: IGeneratedAreaInput[]): Promise<void>;
    saveConfiguration(user: IAuthenticatedUser, vacancyId: string, dto: SaveExperienceCompetencyConfigurationDto): Promise<IExperienceCompetencyAreaResponse[]>;
    updateArea(user: IAuthenticatedUser, vacancyId: string, areaId: string, dto: UpdateExperienceCompetencyAreaDto): Promise<IExperienceCompetencyAreaResponse>;
    removeArea(user: IAuthenticatedUser, vacancyId: string, areaId: string): Promise<void>;
    updateQuestion(user: IAuthenticatedUser, vacancyId: string, questionId: string, dto: UpdateExperienceCompetencyQuestionDto): Promise<VacancyExperienceQuestion>;
    removeQuestion(user: IAuthenticatedUser, vacancyId: string, questionId: string): Promise<void>;
    private createAreaRecord;
    private createStandardQuestions;
    private synchronizeExperienceAreaNames;
    private findArea;
    private findQuestion;
    private reorderQuestions;
    private replaceAreaSequences;
    private replaceQuestionSequences;
    private toInputJsonValue;
}
export {};
