import type { Difficulty, Prisma } from '@prisma/client';

export interface IQuestionCsvImportRow {
  allowFollowUp: boolean;
  difficulty: Difficulty;
  estimatedAnswerTimeSeconds: number;
  evaluationCriteria: Prisma.InputJsonObject;
  question: string;
  row: number;
  technology: string;
  technologySegment: string;
}

export interface IQuestionCsvImportRowError {
  field?: string;
  message: string;
  row: number;
}

export interface IQuestionCsvImportPreview {
  errors: IQuestionCsvImportRowError[];
  rows: IQuestionCsvImportRow[];
  totalRows: number;
  validRows: number;
}

export interface IQuestionCsvImportResult {
  importedCount: number;
}
