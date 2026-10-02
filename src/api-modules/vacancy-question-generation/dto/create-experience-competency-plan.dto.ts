import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, ValidateNested } from 'class-validator';

import { CreateExperienceCompetencyAreaDto } from './create-experience-competency-area.dto.js';

export class CreateExperienceCompetencyPlanDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CreateExperienceCompetencyAreaDto)
  areas!: CreateExperienceCompetencyAreaDto[];
}