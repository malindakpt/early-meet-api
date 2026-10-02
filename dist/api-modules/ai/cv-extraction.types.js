"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CV_EXTRACTION_SERVICE = exports.extractedCvDataSchema = void 0;
const zod_1 = require("zod");
const nullableText = zod_1.z.string().trim().min(1).max(2_000).nullable();
const dateText = zod_1.z.string().trim().min(1).max(100).nullable();
exports.extractedCvDataSchema = zod_1.z.object({
    candidate: zod_1.z.object({
        fullName: nullableText,
        email: nullableText,
        phone: nullableText,
        location: nullableText,
        linkedInUrl: nullableText,
        portfolioUrl: nullableText,
    }),
    summary: nullableText,
    skills: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string().trim().min(1).max(255),
        category: nullableText,
        yearsOfExperience: zod_1.z.number().finite().min(0).max(100).nullable(),
    })),
    workExperience: zod_1.z.array(zod_1.z.object({
        company: nullableText,
        jobTitle: nullableText,
        location: nullableText,
        startDate: dateText,
        endDate: dateText,
        isCurrent: zod_1.z.boolean(),
        description: nullableText,
        technologies: zod_1.z.array(zod_1.z.string().trim().min(1).max(255)),
    })),
    education: zod_1.z.array(zod_1.z.object({
        institution: nullableText,
        degree: nullableText,
        fieldOfStudy: nullableText,
        startDate: dateText,
        endDate: dateText,
    })),
    certifications: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string().trim().min(1).max(255),
        issuer: nullableText,
        issueDate: dateText,
    })),
});
exports.CV_EXTRACTION_SERVICE = Symbol('CV_EXTRACTION_SERVICE');
//# sourceMappingURL=cv-extraction.types.js.map