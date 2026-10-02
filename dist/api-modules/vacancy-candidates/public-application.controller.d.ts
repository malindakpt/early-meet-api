import { type IPublicApplicationResponse, VacancyService } from '../vacancies/vacancy.service.js';
import { PublicApplicationTokenParamsDto, SubmitPublicApplicationDto } from './dto/submit-public-application.dto.js';
import { VacancyCandidateService } from './vacancy-candidate.service.js';
export declare class PublicApplicationController {
    private readonly vacancyCandidateService;
    private readonly vacancyService;
    constructor(vacancyCandidateService: VacancyCandidateService, vacancyService: VacancyService);
    findOne(params: PublicApplicationTokenParamsDto): Promise<IPublicApplicationResponse>;
    submit(params: PublicApplicationTokenParamsDto, dto: SubmitPublicApplicationDto): Promise<{
        message: string;
    }>;
}
