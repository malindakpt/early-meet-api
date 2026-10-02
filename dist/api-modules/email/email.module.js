"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer_1 = require("nodemailer");
const verification_notification_service_js_1 = require("../auth/verification-notification.service.js");
const interview_invitation_email_service_js_1 = require("./interview-invitation-email.service.js");
const verification_email_service_js_1 = require("./verification-email.service.js");
let EmailModule = class EmailModule {
};
exports.EmailModule = EmailModule;
exports.EmailModule = EmailModule = __decorate([
    (0, common_1.Module)({
        providers: [
            {
                provide: verification_email_service_js_1.SMTP_EMAIL_TRANSPORT,
                inject: [config_1.ConfigService],
                useFactory: (config) => (0, nodemailer_1.createTransport)({
                    host: config.getOrThrow('SMTP_HOST'),
                    port: config.getOrThrow('SMTP_PORT'),
                    secure: config.getOrThrow('SMTP_PORT') === 465,
                    auth: {
                        user: config.getOrThrow('SMTP_USERNAME'),
                        pass: config.getOrThrow('SMTP_PASSWORD'),
                    },
                }),
            },
            verification_email_service_js_1.VerificationEmailService,
            interview_invitation_email_service_js_1.InterviewInvitationEmailService,
            {
                provide: interview_invitation_email_service_js_1.INTERVIEW_INVITATION_NOTIFICATION_SERVICE,
                useExisting: interview_invitation_email_service_js_1.InterviewInvitationEmailService,
            },
            {
                provide: verification_notification_service_js_1.VERIFICATION_NOTIFICATION_SERVICE,
                useExisting: verification_email_service_js_1.VerificationEmailService,
            },
        ],
        exports: [interview_invitation_email_service_js_1.INTERVIEW_INVITATION_NOTIFICATION_SERVICE, verification_notification_service_js_1.VERIFICATION_NOTIFICATION_SERVICE],
    })
], EmailModule);
//# sourceMappingURL=email.module.js.map