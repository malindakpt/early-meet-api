import { Difficulty, EmploymentType, InterviewType, WorkType } from '@prisma/client';
export declare class CreateVacancyDto {
    title: string;
    location: string;
    employmentType: EmploymentType;
    workType: WorkType;
    jobDescription: string;
    experienceMin: number;
    experienceMax: number;
    deadline: Date;
    interviewType: InterviewType;
    difficulty: Difficulty;
    notes: string;
}
