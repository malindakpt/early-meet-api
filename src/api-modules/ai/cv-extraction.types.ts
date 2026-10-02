import { z } from 'zod';

const nullableText = z.string().trim().min(1).max(2_000).nullable();
const dateText = z.string().trim().min(1).max(100).nullable();

export const extractedCvDataSchema = z.object({
  candidate: z.object({
    fullName: nullableText,
    email: nullableText,
    phone: nullableText,
    location: nullableText,
    linkedInUrl: nullableText,
    portfolioUrl: nullableText,
  }),
  summary: nullableText,
  skills: z.array(
    z.object({
      name: z.string().trim().min(1).max(255),
      category: nullableText,
      yearsOfExperience: z.number().finite().min(0).max(100).nullable(),
    }),
  ),
  workExperience: z.array(
    z.object({
      company: nullableText,
      jobTitle: nullableText,
      location: nullableText,
      startDate: dateText,
      endDate: dateText,
      isCurrent: z.boolean(),
      description: nullableText,
      technologies: z.array(z.string().trim().min(1).max(255)),
    }),
  ),
  education: z.array(
    z.object({
      institution: nullableText,
      degree: nullableText,
      fieldOfStudy: nullableText,
      startDate: dateText,
      endDate: dateText,
    }),
  ),
  certifications: z.array(
    z.object({
      name: z.string().trim().min(1).max(255),
      issuer: nullableText,
      issueDate: dateText,
    }),
  ),
});

export type IExtractedCvData = z.infer<typeof extractedCvDataSchema>;

export interface ICvExtractionService {
  extract(extractedText: string): Promise<IExtractedCvData>;
}

export const CV_EXTRACTION_SERVICE = Symbol('CV_EXTRACTION_SERVICE');
