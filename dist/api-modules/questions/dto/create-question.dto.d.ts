import { Difficulty, type Prisma } from '@prisma/client';
export declare class CreateQuestionDto {
    technologyId: string;
    technologySegmentId: string;
    difficulty: Difficulty;
    estimatedAnswerTimeSeconds: number;
    questionType: string;
    followUpAllowed: boolean;
    questionText: string;
    evaluationCriteria: Prisma.InputJsonObject;
    metaData: Prisma.InputJsonObject;
}
