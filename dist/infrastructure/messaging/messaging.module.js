"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagingModule = void 0;
const common_1 = require("@nestjs/common");
const structured_logger_service_js_1 = require("../logging/structured-logger.service.js");
const outbox_publisher_service_js_1 = require("./outbox-publisher.service.js");
const outbox_service_js_1 = require("./outbox.service.js");
const rabbitmq_publisher_service_js_1 = require("./rabbitmq-publisher.service.js");
// Asynchronous integration messaging for the modular monolith. Domain modules only see
// OutboxService (transactional writes); the publisher and the RabbitMQ client stay internal.
let MessagingModule = class MessagingModule {
};
exports.MessagingModule = MessagingModule;
exports.MessagingModule = MessagingModule = __decorate([
    (0, common_1.Module)({
        providers: [outbox_service_js_1.OutboxService, outbox_publisher_service_js_1.OutboxPublisherService, rabbitmq_publisher_service_js_1.RabbitMqPublisher, structured_logger_service_js_1.StructuredLogger],
        exports: [outbox_service_js_1.OutboxService],
    })
], MessagingModule);
//# sourceMappingURL=messaging.module.js.map