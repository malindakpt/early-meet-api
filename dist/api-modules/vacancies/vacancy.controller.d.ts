import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { CreateVacancyDto } from './dto/create-vacancy.dto.js';
import { UpdateVacancyDto } from './dto/update-vacancy.dto.js';
import { type IVacancyResponse, VacancyService } from './vacancy.service.js';
export declare class VacancyController {
    private readonly vacancyService;
    constructor(vacancyService: VacancyService);
    create(user: IAuthenticatedUser, dto: CreateVacancyDto): Promise<IVacancyResponse>;
    findAll(user: IAuthenticatedUser): Promise<IVacancyResponse[]>;
    findOne(user: IAuthenticatedUser, vacancyId: string): Promise<IVacancyResponse>;
    update(user: IAuthenticatedUser, vacancyId: string, dto: UpdateVacancyDto): Promise<IVacancyResponse>;
    remove(user: IAuthenticatedUser, vacancyId: string): Promise<void>;
}
