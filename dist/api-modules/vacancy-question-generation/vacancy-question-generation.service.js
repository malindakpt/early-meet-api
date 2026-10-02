"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VacancyQuestionGenerationService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const configuration_values_js_1 = require("../../infrastructure/config/configuration-values.js");
const prisma_service_js_1 = require("../../infrastructure/prisma/prisma.service.js");
const question_service_js_1 = require("../questions/question.service.js");
const vacancy_technology_service_js_1 = require("../vacancy-technologies/vacancy-technology.service.js");
const vacancy_service_js_1 = require("../vacancies/vacancy.service.js");
let VacancyQuestionGenerationService = class VacancyQuestionGenerationService {
    prisma;
    vacancyService;
    vacancyTechnologyService;
    questionService;
    constructor(prisma, vacancyService, vacancyTechnologyService, questionService) {
        this.prisma = prisma;
        this.vacancyService = vacancyService;
        this.vacancyTechnologyService = vacancyTechnologyService;
        this.questionService = questionService;
    }
    async generate(user, vacancyId) {
        const vacancy = await this.vacancyService.findOne(user, vacancyId);
        const configuredTechnologies = await this.vacancyTechnologyService.findAll(user, vacancyId);
        if (configuredTechnologies.length === 0) {
            throw new common_1.UnprocessableEntityException('Configure at least one vacancy technology first.');
        }
        const questions = await this.questionService.findEligibleForVacancyGeneration(configuredTechnologies.map(({ technologyId }) => technologyId), vacancy.difficulty);
        const selectedQuestions = this.orderQuestions(questions, configuredTechnologies);
        try {
            const generatedQuestions = await this.prisma.$transaction(async (transaction) => {
                const existingQuestion = await transaction.vacancyQuestion.findFirst({
                    where: { vacancyId },
                    select: { id: true },
                });
                if (existingQuestion !== null) {
                    throw new common_1.ConflictException('Questions have already been generated for this vacancy.');
                }
                const snapshots = [];
                for (const [index, question] of selectedQuestions.entries()) {
                    snapshots.push(await transaction.vacancyQuestion.create({
                        data: {
                            vacancyId,
                            questionId: question.id,
                            sequence: index + 1,
                            questionText: question.questionText,
                            difficulty: question.difficulty,
                            questionType: question.questionType,
                            followUpAllowed: question.followUpAllowed,
                            evaluationCriteria: this.toInputJsonValue(question.evaluationCriteria),
                        },
                    }));
                }
                return snapshots;
            });
            return {
                vacancyId,
                generatedCount: generatedQuestions.length,
                questions: generatedQuestions.map(({ id, questionId, sequence }) => ({
                    id,
                    questionId,
                    sequence,
                })),
            };
        }
        catch (error) {
            this.rethrowConcurrentGeneration(error);
        }
    }
    orderQuestions(questions, configuredTechnologies) {
        const buckets = new Map();
        for (const question of questions) {
            const requirementType = this.findRequirementType(question, configuredTechnologies);
            if (requirementType === undefined) {
                continue;
            }
            const key = `${question.technologyId}:${question.technologySegmentId}`;
            const bucket = buckets.get(key) ?? {
                technologyId: question.technologyId,
                technologySegmentId: question.technologySegmentId,
                requirementType,
                questions: [],
            };
            bucket.questions.push(question);
            buckets.set(key, bucket);
        }
        return [client_1.RequirementType.REQUIRED, client_1.RequirementType.PREFERRED].flatMap((requirementType) => {
            const questionsPerTechnology = requirementType === client_1.RequirementType.REQUIRED
                ? configuration_values_js_1.configurationValues.technicalQuestionGeneration.requiredQuestionsPerTechnology
                : configuration_values_js_1.configurationValues.technicalQuestionGeneration.preferredQuestionsPerTechnology;
            const ordered = this.roundRobin([...buckets.values()]
                .filter((bucket) => bucket.requirementType === requirementType)
                .sort((left, right) => left.technologyId.localeCompare(right.technologyId) ||
                left.technologySegmentId.localeCompare(right.technologySegmentId)));
            const selectedPerTechnology = new Map();
            return ordered.filter((question) => {
                const selected = selectedPerTechnology.get(question.technologyId) ?? 0;
                if (selected >= questionsPerTechnology)
                    return false;
                selectedPerTechnology.set(question.technologyId, selected + 1);
                return true;
            });
        });
    }
    findRequirementType(question, configuredTechnologies) {
        for (const requirementType of [client_1.RequirementType.REQUIRED, client_1.RequirementType.PREFERRED]) {
            if (configuredTechnologies.some((configuration) => configuration.requirementType === requirementType &&
                configuration.technologyId === question.technologyId &&
                (configuration.segmentSelections.includes('ALL') ||
                    configuration.segmentSelections.includes(question.technologySegmentId)))) {
                return requirementType;
            }
        }
        return undefined;
    }
    roundRobin(buckets) {
        const ordered = [];
        for (let questionIndex = 0;; questionIndex += 1) {
            let foundQuestion = false;
            for (const bucket of buckets) {
                const question = bucket.questions[questionIndex];
                if (question !== undefined) {
                    ordered.push(question);
                    foundQuestion = true;
                }
            }
            if (!foundQuestion) {
                return ordered;
            }
        }
    }
    toInputJsonValue(value) {
        return value === null ? client_1.Prisma.JsonNull : structuredClone(value);
    }
    rethrowConcurrentGeneration(error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            throw new common_1.ConflictException('Questions have already been generated for this vacancy.');
        }
        throw error;
    }
};
exports.VacancyQuestionGenerationService = VacancyQuestionGenerationService;
exports.VacancyQuestionGenerationService = VacancyQuestionGenerationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        vacancy_service_js_1.VacancyService,
        vacancy_technology_service_js_1.VacancyTechnologyService,
        question_service_js_1.QuestionService])
], VacancyQuestionGenerationService);
//# sourceMappingURL=vacancy-question-generation.service.js.map