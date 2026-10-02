"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxService = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const request_context_js_1 = require("../../common/context/request-context.js");
/**
 * Writes integration events into the transactional outbox.
 *
 * `add` must be called with the Prisma transaction client of the business operation, so the
 * business rows and the outbox row are committed (or rolled back) atomically. Nothing is sent to
 * RabbitMQ here: OutboxPublisherService publishes committed rows asynchronously.
 */
let OutboxService = class OutboxService {
    async add(transaction, input) {
        const event = {
            eventId: (0, node_crypto_1.randomUUID)(),
            type: input.type,
            version: input.version,
            occurredAt: new Date().toISOString(),
            correlationId: (0, request_context_js_1.currentRequestId)() ?? null,
            data: input.data,
        };
        await transaction.outboxEvent.create({
            data: {
                eventId: event.eventId,
                eventType: event.type,
                exchange: input.exchange,
                routingKey: input.routingKey,
                payload: event,
                correlationId: event.correlationId,
            },
        });
        return event;
    }
};
exports.OutboxService = OutboxService;
exports.OutboxService = OutboxService = __decorate([
    (0, common_1.Injectable)()
], OutboxService);
//# sourceMappingURL=outbox.service.js.map