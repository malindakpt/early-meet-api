import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { CreateExperienceCompetencyPlanDto } from './dto/create-experience-competency-plan.dto.js';
import { SaveExperienceCompetencyConfigurationDto } from './dto/save-experience-competency-configuration.dto.js';
import { UpdateExperienceCompetencyAreaDto } from './dto/update-experience-competency-area.dto.js';
import { UpdateExperienceCompetencyQuestionDto } from './dto/update-experience-competency-question.dto.js';
import { VacancyExperienceCompetencyService, type IExperienceCompetencyAreaResponse } from './vacancy-experience-competency.service.js';
export declare class VacancyExperienceCompetencyController {
    private readonly vacancyExperienceCompetencyService;
    constructor(vacancyExperienceCompetencyService: VacancyExperienceCompetencyService);
    findAll(user: IAuthenticatedUser, vacancyId: string): Promise<IExperienceCompetencyAreaResponse[]>;
    createPlan(user: IAuthenticatedUser, vacancyId: string, dto: CreateExperienceCompetencyPlanDto): Promise<IExperienceCompetencyAreaResponse[]>;
    saveConfiguration(user: IAuthenticatedUser, vacancyId: string, dto: SaveExperienceCompetencyConfigurationDto): Promise<IExperienceCompetencyAreaResponse[]>;
    updateArea(user: IAuthenticatedUser, vacancyId: string, areaId: string, dto: UpdateExperienceCompetencyAreaDto): Promise<IExperienceCompetencyAreaResponse>;
    removeArea(user: IAuthenticatedUser, vacancyId: string, areaId: string): Promise<void>;
    updateQuestion(user: IAuthenticatedUser, vacancyId: string, questionId: string, dto: UpdateExperienceCompetencyQuestionDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        sequence: number;
        questionText: string;
        areaId: string;
    }>;
    removeQuestion(user: IAuthenticatedUser, vacancyId: string, questionId: string): Promise<void>;
}
