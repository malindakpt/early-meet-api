import { CandidateDecision, CandidateProcessingStatus, CandidateStatus } from '@prisma/client';
export declare enum VacancyCandidateSortBy {
    AI_INTERVIEW_SCORE = "aiInterviewScore",
    AI_MATCH_SCORE = "aiMatchScore",
    CREATED_AT = "createdAt",
    KEYWORD_MATCH_SCORE = "keywordMatchScore",
    MATCH_SCORE = "matchScore",
    UPDATED_AT = "updatedAt"
}
export declare enum SortDirection {
    ASC = "asc",
    DESC = "desc"
}
export declare class VacancyCandidateListQueryDto {
    status?: CandidateStatus;
    processingStatus?: CandidateProcessingStatus;
    decision?: CandidateDecision;
    minMatchScore?: number;
    maxMatchScore?: number;
    sortBy?: VacancyCandidateSortBy;
    sortDirection?: SortDirection;
    page?: number;
    limit?: number;
}
