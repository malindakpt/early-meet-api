import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type { Question as QuestionModel } from '@prisma/client';

import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { AuthenticationGuard } from '../auth/guards/authentication.guard.js';
import { PlatformAdminGuard } from '../auth/guards/platform-admin.guard.js';
import { AuthService } from '../auth/auth.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { CreateQuestionDto } from './dto/create-question.dto.js';
import { QuestionCsvImportDto, QuestionCsvPreviewDto } from './dto/question-csv-import.dto.js';
import { QueryQuestionsDto } from './dto/query-questions.dto.js';
import { UpdateQuestionDto } from './dto/update-question.dto.js';
import type {
  IQuestionCsvImportPreview,
  IQuestionCsvImportResult,
} from './question-csv-import.types.js';
import { QuestionService, type IQuestionManagementResponse } from './question.service.js';

@Controller('questions')
@UseGuards(AuthenticationGuard)
export class QuestionController {
  constructor(
    private readonly questionService: QuestionService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  @UseGuards(PlatformAdminGuard)
  async create(
    @CurrentUser() user: IAuthenticatedUser,
    @Body() dto: CreateQuestionDto,
  ): Promise<QuestionModel> {
    return this.questionService.create(user, dto);
  }

  @Post('import/preview')
  @UseGuards(PlatformAdminGuard)
  async previewImport(@Body() dto: QuestionCsvPreviewDto): Promise<IQuestionCsvImportPreview> {
    return this.questionService.previewCsvImport(dto.csv);
  }

  @Post('import')
  @UseGuards(PlatformAdminGuard)
  async import(
    @Body() dto: QuestionCsvImportDto,
    @CurrentUser() user: IAuthenticatedUser,
  ): Promise<IQuestionCsvImportResult> {
    await this.authService.verifyCurrentPassword(user.id, dto.password);
    return this.questionService.importCsv(user, dto.csv);
  }

  @Get()
  async findAll(
    @CurrentUser() user: IAuthenticatedUser,
    @Query() query: QueryQuestionsDto,
  ): Promise<IQuestionManagementResponse[]> {
    return this.questionService.findAll(user, query);
  }

  @Get(':id')
  async findOne(@Param('id') questionId: string): Promise<QuestionModel> {
    return this.questionService.findOne(questionId);
  }

  @Patch(':id')
  @UseGuards(PlatformAdminGuard)
  async update(
    @Param('id') questionId: string,
    @Body() dto: UpdateQuestionDto,
  ): Promise<QuestionModel> {
    return this.questionService.update(questionId, dto);
  }

  @Post(':id/approve')
  @UseGuards(PlatformAdminGuard)
  async approve(@Param('id') questionId: string): Promise<QuestionModel> {
    return this.questionService.approve(questionId);
  }

  @Post(':id/archive')
  @UseGuards(PlatformAdminGuard)
  async archive(@Param('id') questionId: string): Promise<QuestionModel> {
    return this.questionService.archive(questionId);
  }
}
