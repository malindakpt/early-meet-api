import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { InterviewService, type IInterviewReviewDetailResponse, type IInterviewReviewListItem } from './interview.service.js';
export declare class InterviewReviewController {
    private readonly interviewService;
    constructor(interviewService: InterviewService);
    findAll(user: IAuthenticatedUser): Promise<IInterviewReviewListItem[]>;
    findOne(user: IAuthenticatedUser, interviewId: string): Promise<IInterviewReviewDetailResponse>;
    remove(user: IAuthenticatedUser, interviewId: string): Promise<void>;
}
