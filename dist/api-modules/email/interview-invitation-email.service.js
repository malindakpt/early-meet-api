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
exports.InterviewInvitationEmailService = exports.INTERVIEW_INVITATION_NOTIFICATION_SERVICE = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const verification_email_service_js_1 = require("./verification-email.service.js");
exports.INTERVIEW_INVITATION_NOTIFICATION_SERVICE = Symbol('INTERVIEW_INVITATION_NOTIFICATION_SERVICE');
let InterviewInvitationEmailService = class InterviewInvitationEmailService {
    config;
    transport;
    constructor(config, transport) {
        this.config = config;
        this.transport = transport;
    }
    async send(notification) {
        const interviewUrl = new URL(`/interview/${encodeURIComponent(notification.token)}`, this.config.getOrThrow('INTERVIEW_APP_URL'));
        try {
            await this.transport.sendMail({
                from: this.config.getOrThrow('EMAIL_FROM'),
                to: notification.candidateEmail,
                subject: `Interview Invitation - ${notification.vacancyTitle}`,
                text: `Hello ${notification.candidateName},\n\nYou have been invited to complete an interview for ${notification.vacancyTitle}. Estimated interview time: ${formatEstimatedInterviewTime(notification.estimatedInterviewTimeSeconds)}.\n\nStart your interview: ${interviewUrl.toString()}`,
            });
        }
        catch (error) {
            throw new common_1.InternalServerErrorException('Unable to send the interview invitation email.', {
                cause: error,
            });
        }
    }
};
exports.InterviewInvitationEmailService = InterviewInvitationEmailService;
exports.InterviewInvitationEmailService = InterviewInvitationEmailService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(verification_email_service_js_1.SMTP_EMAIL_TRANSPORT)),
    __metadata("design:paramtypes", [config_1.ConfigService, Object])
], InterviewInvitationEmailService);
function formatEstimatedInterviewTime(seconds) {
    return `about ${Math.max(1, Math.round(seconds / 60))} minute${Math.round(seconds / 60) === 1 ? '' : 's'}`;
}
//# sourceMappingURL=interview-invitation-email.service.js.map