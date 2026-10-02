import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Matches,
  Min,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export const CANDIDATE_CV_MAX_EXTRACTED_TEXT_LENGTH = 200_000;

export const CANDIDATE_CV_UPLOAD_MAX_ITEMS = 10;

export class UploadCandidateCvItemDto {
  @IsString()
  @MaxLength(255)
  fileName!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsString()
  @MaxLength(CANDIDATE_CV_MAX_EXTRACTED_TEXT_LENGTH)
  @Matches(/\S/)
  extractedText!: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  keywordMatchScore!: number;

  @IsOptional()
  @IsObject()
  keywordMatchBreakdown?: Record<string, unknown>;
}

export class UploadCandidateCvsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(CANDIDATE_CV_UPLOAD_MAX_ITEMS, {
    message: 'You can upload a maximum of 10 CVs at a time.',
  })
  @ValidateNested({ each: true })
  @Type(() => UploadCandidateCvItemDto)
  candidates!: UploadCandidateCvItemDto[];
}
