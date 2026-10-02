import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { CandidateInterviewTokenParamsDto } from './dto/candidate-interview-token-params.dto.js';
import { SubmitInterviewAnswerDto } from './dto/submit-interview-answer.dto.js';
import { InterviewService, type ICandidateInterviewProgressResponse } from './interview.service.js';

@Controller('candidate-interviews')
export class CandidateInterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  @Get(':token')
  async getProgress(
    @Param() params: CandidateInterviewTokenParamsDto,
  ): Promise<ICandidateInterviewProgressResponse> {
    return this.interviewService.getCandidateProgress(params.token);
  }

  @Post(':token/start')
  async start(
    @Param() params: CandidateInterviewTokenParamsDto,
  ): Promise<ICandidateInterviewProgressResponse> {
    return this.interviewService.startCandidateInterview(params.token);
  }

  @Post(':token/answers')
  async submitAnswer(
    @Param() params: CandidateInterviewTokenParamsDto,
    @Body() dto: SubmitInterviewAnswerDto,
  ): Promise<ICandidateInterviewProgressResponse> {
    return this.interviewService.submitCandidateAnswer(params.token, dto);
  }
}
