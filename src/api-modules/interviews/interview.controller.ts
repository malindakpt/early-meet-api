import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AuthenticationGuard } from '../auth/guards/authentication.guard.js';
import { UpdateInterviewInvitationDto } from './dto/update-interview-invitation.dto.js';
import { SubmitInterviewAnswerDto } from './dto/submit-interview-answer.dto.js';
import {
  InterviewAnswerEvaluationService,
  type IInterviewAnswerEvaluationResponse,
} from './interview-answer-evaluation.service.js';
import {
  InterviewFollowUpService,
  type IInterviewFollowUpResponse,
} from './interview-follow-up.service.js';
import {
  InterviewOverallEvaluationService,
  type IInterviewOverallEvaluationResponse,
} from './interview-overall-evaluation.service.js';
import {
  InterviewService,
  type IInterviewProgressResponse,
  type IInterviewResponse,
} from './interview.service.js';

@Controller('vacancies/:vacancyId/candidates/:vacancyCandidateId/interviews')
@UseGuards(AuthenticationGuard)
export class InterviewController {
  constructor(
    private readonly interviewService: InterviewService,
    private readonly interviewAnswerEvaluationService: InterviewAnswerEvaluationService,
    private readonly interviewFollowUpService: InterviewFollowUpService,
    private readonly interviewOverallEvaluationService: InterviewOverallEvaluationService,
  ) {}

  @Post()
  async create(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
    @Param('vacancyCandidateId') vacancyCandidateId: string,
  ): Promise<IInterviewResponse> {
    return this.interviewService.sendInvitation(user, vacancyId, vacancyCandidateId);
  }

  @Get()
  async findAll(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
    @Param('vacancyCandidateId') vacancyCandidateId: string,
  ): Promise<IInterviewResponse[]> {
    return this.interviewService.findAll(user, vacancyId, vacancyCandidateId);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
    @Param('vacancyCandidateId') vacancyCandidateId: string,
    @Param('id') interviewId: string,
  ): Promise<IInterviewResponse> {
    return this.interviewService.findOne(user, vacancyId, vacancyCandidateId, interviewId);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
    @Param('vacancyCandidateId') vacancyCandidateId: string,
    @Param('id') interviewId: string,
    @Body() dto: UpdateInterviewInvitationDto,
  ): Promise<IInterviewResponse> {
    return this.interviewService.update(user, vacancyId, vacancyCandidateId, interviewId, dto);
  }

  @Post(':id/start')
  async start(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
    @Param('vacancyCandidateId') vacancyCandidateId: string,
    @Param('id') interviewId: string,
  ): Promise<IInterviewProgressResponse> {
    return this.interviewService.start(user, vacancyId, vacancyCandidateId, interviewId);
  }

  @Get(':id/progress')
  async getProgress(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
    @Param('vacancyCandidateId') vacancyCandidateId: string,
    @Param('id') interviewId: string,
  ): Promise<IInterviewProgressResponse> {
    return this.interviewService.getProgress(user, vacancyId, vacancyCandidateId, interviewId);
  }

  @Post(':id/answers')
  async submitAnswer(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
    @Param('vacancyCandidateId') vacancyCandidateId: string,
    @Param('id') interviewId: string,
    @Body() dto: SubmitInterviewAnswerDto,
  ): Promise<IInterviewProgressResponse> {
    return this.interviewService.submitAnswer(
      user,
      vacancyId,
      vacancyCandidateId,
      interviewId,
      dto,
    );
  }

  @Post(':id/answers/:answerId/evaluate')
  async evaluateAnswer(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
    @Param('vacancyCandidateId') vacancyCandidateId: string,
    @Param('id') interviewId: string,
    @Param('answerId') answerId: string,
  ): Promise<IInterviewAnswerEvaluationResponse> {
    return this.interviewAnswerEvaluationService.evaluate(
      user,
      vacancyId,
      vacancyCandidateId,
      interviewId,
      answerId,
    );
  }

  @Post(':id/answers/:answerId/follow-up')
  async decideFollowUp(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
    @Param('vacancyCandidateId') vacancyCandidateId: string,
    @Param('id') interviewId: string,
    @Param('answerId') answerId: string,
  ): Promise<IInterviewFollowUpResponse> {
    return this.interviewFollowUpService.decide(
      user,
      vacancyId,
      vacancyCandidateId,
      interviewId,
      answerId,
    );
  }

  @Post(':id/evaluate')
  async evaluateOverall(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
    @Param('vacancyCandidateId') vacancyCandidateId: string,
    @Param('id') interviewId: string,
  ): Promise<IInterviewOverallEvaluationResponse> {
    return this.interviewOverallEvaluationService.evaluate(
      user,
      vacancyId,
      vacancyCandidateId,
      interviewId,
    );
  }

  @Get(':id/evaluation')
  async findOverallEvaluation(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
    @Param('vacancyCandidateId') vacancyCandidateId: string,
    @Param('id') interviewId: string,
  ): Promise<IInterviewOverallEvaluationResponse> {
    return this.interviewOverallEvaluationService.findOne(
      user,
      vacancyId,
      vacancyCandidateId,
      interviewId,
    );
  }
}
