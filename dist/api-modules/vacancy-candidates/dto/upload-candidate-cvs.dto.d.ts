export declare const CANDIDATE_CV_MAX_EXTRACTED_TEXT_LENGTH = 200000;
export declare const CANDIDATE_CV_UPLOAD_MAX_ITEMS = 10;
export declare class UploadCandidateCvItemDto {
    fileName: string;
    email?: string;
    extractedText: string;
    keywordMatchScore: number;
    keywordMatchBreakdown?: Record<string, unknown>;
}
export declare class UploadCandidateCvsDto {
    candidates: UploadCandidateCvItemDto[];
}
