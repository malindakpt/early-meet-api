import { IsEmail, IsString, Matches, MaxLength } from 'class-validator';

import { CANDIDATE_CV_MAX_EXTRACTED_TEXT_LENGTH } from './upload-candidate-cvs.dto.js';

export class PublicApplicationTokenParamsDto {
  @IsString()
  @Matches(/^[a-f0-9]{64}$/)
  token!: string;
}

// A single applicant CV. Unlike the HR upload, no keyword score is accepted from the client;
// it is computed server-side.
export class SubmitPublicApplicationDto {
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MaxLength(255)
  @Matches(/\.pdf$/i, { message: 'Upload your CV as a PDF file.' })
  fileName!: string;

  @IsString()
  @MaxLength(CANDIDATE_CV_MAX_EXTRACTED_TEXT_LENGTH)
  @Matches(/\S/)
  extractedText!: string;
}
