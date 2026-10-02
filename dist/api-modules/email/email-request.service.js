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
exports.EmailRequestService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const outbox_service_js_1 = require("../../infrastructure/messaging/outbox.service.js");
const email_requested_message_js_1 = require("./email-requested.message.js");
// The API no longer sends email. Requesting one means writing an EmailRequested outbox row in
// the caller's transaction; delivery happens asynchronously in the Email Service.
let EmailRequestService = class EmailRequestService {
    config;
    outbox;
    constructor(config, outbox) {
        this.config = config;
        this.outbox = outbox;
    }
    async request(transaction, email) {
        const event = await this.outbox.add(transaction, {
            type: email_requested_message_js_1.EMAIL_REQUESTED_EVENT_TYPE,
            version: email_requested_message_js_1.EMAIL_REQUESTED_VERSION,
            exchange: this.config.getOrThrow('EMAIL_EXCHANGE'),
            routingKey: this.config.getOrThrow('EMAIL_ROUTING_KEY'),
            data: email,
        });
        return event.eventId;
    }
};
exports.EmailRequestService = EmailRequestService;
exports.EmailRequestService = EmailRequestService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        outbox_service_js_1.OutboxService])
], EmailRequestService);
//# sourceMappingURL=email-request.service.js.map