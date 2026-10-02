import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { CreateVacancyTechnologyDto } from './dto/create-vacancy-technology.dto.js';
import { UpdateVacancyTechnologyDto } from './dto/update-vacancy-technology.dto.js';
import { VacancyTechnologyService, type IVacancyTechnologyResponse } from './vacancy-technology.service.js';
export declare class VacancyTechnologyController {
    private readonly vacancyTechnologyService;
    constructor(vacancyTechnologyService: VacancyTechnologyService);
    create(user: IAuthenticatedUser, vacancyId: string, dto: CreateVacancyTechnologyDto): Promise<IVacancyTechnologyResponse>;
    findAll(user: IAuthenticatedUser, vacancyId: string): Promise<IVacancyTechnologyResponse[]>;
    update(user: IAuthenticatedUser, vacancyId: string, vacancyTechnologyId: string, dto: UpdateVacancyTechnologyDto): Promise<IVacancyTechnologyResponse>;
    remove(user: IAuthenticatedUser, vacancyId: string, vacancyTechnologyId: string): Promise<void>;
}
