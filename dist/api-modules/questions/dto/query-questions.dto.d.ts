import { Difficulty, QuestionStatus } from '@prisma/client';
export declare class QueryQuestionsDto {
    technologyId?: string;
    technologyIds?: string[];
    technologySegmentId?: string;
    difficulty?: Difficulty;
    questionType?: string;
    status?: QuestionStatus;
    search?: string;
    page?: number;
    pageSize?: number;
}
