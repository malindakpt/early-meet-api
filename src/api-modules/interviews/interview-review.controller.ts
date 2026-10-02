import { Controller, Delete, Get, HttpCode, Param, UseGuards } from '@nestjs/common';

import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AuthenticationGuard } from '../auth/guards/authentication.guard.js';
import {
  InterviewService,
  type IInterviewReviewDetailResponse,
  type IInterviewReviewListItem,
} from './interview.service.js';

@Controller('interviews')
@UseGuards(AuthenticationGuard)
export class InterviewReviewController {
  constructor(private readonly interviewService: InterviewService) {}

  @Get()
  async findAll(@CurrentUser() user: IAuthenticatedUser): Promise<IInterviewReviewListItem[]> {
    return this.interviewService.findAllForReview(user);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('id') interviewId: string,
  ): Promise<IInterviewReviewDetailResponse> {
    return this.interviewService.findOneForReview(user, interviewId);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('id') interviewId: string,
  ): Promise<void> {
    await this.interviewService.removeForReview(user, interviewId);
  }
}
