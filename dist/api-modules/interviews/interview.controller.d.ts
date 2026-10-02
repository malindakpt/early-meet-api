import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { UpdateInterviewInvitationDto } from './dto/update-interview-invitation.dto.js';
import { SubmitInterviewAnswerDto } from './dto/submit-interview-answer.dto.js';
import { InterviewAnswerEvaluationService, type IInterviewAnswerEvaluationResponse } from './interview-answer-evaluation.service.js';
import { InterviewFollowUpService, type IInterviewFollowUpResponse } from './interview-follow-up.service.js';
import { InterviewOverallEvaluationService, type IInterviewOverallEvaluationResponse } from './interview-overall-evaluation.service.js';
import { InterviewService, type IInterviewProgressResponse, type IInterviewResponse } from './interview.service.js';
export declare class InterviewController {
    private readonly interviewService;
    private readonly interviewAnswerEvaluationService;
    private readonly interviewFollowUpService;
    private readonly interviewOverallEvaluationService;
    constructor(interviewService: InterviewService, interviewAnswerEvaluationService: InterviewAnswerEvaluationService, interviewFollowUpService: InterviewFollowUpService, interviewOverallEvaluationService: InterviewOverallEvaluationService);
    create(user: IAuthenticatedUser, vacancyId: string, vacancyCandidateId: string): Promise<IInterviewResponse>;
    findAll(user: IAuthenticatedUser, vacancyId: string, vacancyCandidateId: string): Promise<IInterviewResponse[]>;
    findOne(user: IAuthenticatedUser, vacancyId: string, vacancyCandidateId: string, interviewId: string): Promise<IInterviewResponse>;
    update(user: IAuthenticatedUser, vacancyId: string, vacancyCandidateId: string, interviewId: string, dto: UpdateInterviewInvitationDto): Promise<IInterviewResponse>;
    start(user: IAuthenticatedUser, vacancyId: string, vacancyCandidateId: string, interviewId: string): Promise<IInterviewProgressResponse>;
    getProgress(user: IAuthenticatedUser, vacancyId: string, vacancyCandidateId: string, interviewId: string): Promise<IInterviewProgressResponse>;
    submitAnswer(user: IAuthenticatedUser, vacancyId: string, vacancyCandidateId: string, interviewId: string, dto: SubmitInterviewAnswerDto): Promise<IInterviewProgressResponse>;
    evaluateAnswer(user: IAuthenticatedUser, vacancyId: string, vacancyCandidateId: string, interviewId: string, answerId: string): Promise<IInterviewAnswerEvaluationResponse>;
    decideFollowUp(user: IAuthenticatedUser, vacancyId: string, vacancyCandidateId: string, interviewId: string, answerId: string): Promise<IInterviewFollowUpResponse>;
    evaluateOverall(user: IAuthenticatedUser, vacancyId: string, vacancyCandidateId: string, interviewId: string): Promise<IInterviewOverallEvaluationResponse>;
    findOverallEvaluation(user: IAuthenticatedUser, vacancyId: string, vacancyCandidateId: string, interviewId: string): Promise<IInterviewOverallEvaluationResponse>;
}
