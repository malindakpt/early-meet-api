import { Difficulty, EmploymentType, InterviewType, VacancyStatus, WorkType } from '@prisma/client';
export declare class UpdateVacancyDto {
    title?: string;
    location?: string;
    employmentType?: EmploymentType;
    workType?: WorkType;
    jobDescription?: string;
    experienceMin?: number;
    experienceMax?: number;
    deadline?: Date;
    interviewType?: InterviewType;
    difficulty?: Difficulty;
    status?: VacancyStatus;
    notes?: string;
}
