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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CV_EXTRACTION_SERVICE = exports.OpenAiCvExtractionService = exports.OPENAI_CV_MODEL = exports.OPENAI_CLIENT = void 0;
const common_1 = require("@nestjs/common");
const zod_1 = require("openai/helpers/zod");
const cv_extraction_types_js_1 = require("./cv-extraction.types.js");
Object.defineProperty(exports, "CV_EXTRACTION_SERVICE", { enumerable: true, get: function () { return cv_extraction_types_js_1.CV_EXTRACTION_SERVICE; } });
exports.OPENAI_CLIENT = Symbol('OPENAI_CLIENT');
exports.OPENAI_CV_MODEL = Symbol('OPENAI_CV_MODEL');
const CV_EXTRACTION_INSTRUCTIONS = `Extract structured candidate CV information from the supplied CV text only.

Never invent, infer, or guess facts. Use null when a scalar value is unavailable and [] when a list has no supported entries. Do not use placeholders such as "Unknown", "N/A", or "Not provided" unless they are factual and meaningful CV content. Preserve dates exactly as stated. Do not evaluate, rank, score, or match the candidate to a vacancy. Do not infer skills, employment, education, certifications, or contact details that are absent from the CV.`;
let OpenAiCvExtractionService = class OpenAiCvExtractionService {
    client;
    model;
    constructor(client, model) {
        this.client = client;
        this.model = model;
    }
    async extract(extractedText) {
        try {
            const response = await this.client.responses.parse({
                model: this.model,
                instructions: CV_EXTRACTION_INSTRUCTIONS,
                input: extractedText,
                text: {
                    format: (0, zod_1.zodTextFormat)(cv_extraction_types_js_1.extractedCvDataSchema, 'extracted_cv_data'),
                },
            });
            return cv_extraction_types_js_1.extractedCvDataSchema.parse(response.output_parsed);
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(`Unable to extract structured candidate CV data.: ${String(error)}`, { cause: error });
        }
    }
};
exports.OpenAiCvExtractionService = OpenAiCvExtractionService;
exports.OpenAiCvExtractionService = OpenAiCvExtractionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(exports.OPENAI_CLIENT)),
    __param(1, (0, common_1.Inject)(exports.OPENAI_CV_MODEL)),
    __metadata("design:paramtypes", [Function, String])
], OpenAiCvExtractionService);
//# sourceMappingURL=openai-cv-extraction.service.js.map