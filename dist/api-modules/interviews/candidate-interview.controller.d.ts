import { CandidateInterviewTokenParamsDto } from './dto/candidate-interview-token-params.dto.js';
import { SubmitInterviewAnswerDto } from './dto/submit-interview-answer.dto.js';
import { InterviewService, type ICandidateInterviewProgressResponse } from './interview.service.js';
export declare class CandidateInterviewController {
    private readonly interviewService;
    constructor(interviewService: InterviewService);
    getProgress(params: CandidateInterviewTokenParamsDto): Promise<ICandidateInterviewProgressResponse>;
    start(params: CandidateInterviewTokenParamsDto): Promise<ICandidateInterviewProgressResponse>;
    submitAnswer(params: CandidateInterviewTokenParamsDto, dto: SubmitInterviewAnswerDto): Promise<ICandidateInterviewProgressResponse>;
}
