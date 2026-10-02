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
exports.OutboxPublisherService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const error_serializer_js_1 = require("../logging/error-serializer.js");
const structured_logger_service_js_1 = require("../logging/structured-logger.service.js");
const prisma_service_js_1 = require("../prisma/prisma.service.js");
const rabbitmq_publisher_service_js_1 = require("./rabbitmq-publisher.service.js");
// A claimed row is invisible to other publishers for this long. It must comfortably exceed the
// time needed to publish a batch; if the process dies mid-batch the rows become claimable again.
const CLAIM_LEASE_SECONDS = 60;
const MAX_RETRY_DELAY_MS = 5 * 60 * 1000;
/**
 * Polls the outbox and publishes committed events to RabbitMQ.
 *
 * Concurrency: every API instance runs this loop. Rows are claimed with
 * `FOR UPDATE SKIP LOCKED` and their `availableAt` is pushed forward by a lease in the same
 * statement, so instances never publish the same row concurrently and no extra locking
 * infrastructure is required.
 *
 * Delivery guarantee: at-least-once. If the process crashes after RabbitMQ confirmed a message
 * but before the row is marked PUBLISHED, the row is published again after its lease expires.
 * Consumers deduplicate by eventId.
 */
let OutboxPublisherService = class OutboxPublisherService {
    config;
    prisma;
    publisher;
    logger;
    timer;
    running;
    stopped = false;
    constructor(config, prisma, publisher, logger) {
        this.config = config;
        this.prisma = prisma;
        this.publisher = publisher;
        this.logger = logger;
    }
    onApplicationBootstrap() {
        if (!this.config.getOrThrow('OUTBOX_PUBLISHER_ENABLED'))
            return;
        this.schedule(0);
    }
    async onApplicationShutdown() {
        this.stopped = true;
        clearTimeout(this.timer);
        await this.running;
    }
    /** Claims and publishes one batch. Returns the number of rows claimed. */
    async publishBatch() {
        const events = await this.claimBatch();
        for (const event of events) {
            await this.publishOne(event);
        }
        return events.length;
    }
    schedule(delayMs) {
        if (this.stopped)
            return;
        this.timer = setTimeout(() => {
            this.running = this.tick().finally(() => {
                this.running = undefined;
            });
        }, delayMs);
    }
    async tick() {
        const batchSize = this.config.getOrThrow('OUTBOX_BATCH_SIZE');
        let claimed = 0;
        try {
            claimed = await this.publishBatch();
        }
        catch (error) {
            // Typically the database is unavailable; the loop keeps running and tries again.
            this.logger.error('Outbox publisher cycle failed', {
                event: 'outbox.publisher.cycle_failed',
                error: (0, error_serializer_js_1.serializeError)(error),
            });
        }
        // A full batch suggests a backlog: drain it without waiting for the next poll.
        this.schedule(claimed >= batchSize ? 0 : this.config.getOrThrow('OUTBOX_POLL_INTERVAL_MS'));
    }
    claimBatch() {
        const batchSize = this.config.getOrThrow('OUTBOX_BATCH_SIZE');
        return this.prisma.$queryRaw `
      UPDATE "OutboxEvent"
      SET "attempts" = "attempts" + 1,
          "availableAt" = now() + make_interval(secs => ${CLAIM_LEASE_SECONDS}),
          "updatedAt" = now()
      WHERE "id" IN (
        SELECT "id" FROM "OutboxEvent"
        WHERE "status" = 'PENDING' AND "availableAt" <= now()
        ORDER BY "availableAt"
        LIMIT ${batchSize}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING "id", "eventId", "eventType", "exchange", "routingKey", "payload",
                "correlationId", "attempts", "createdAt"`;
    }
    async publishOne(event) {
        const logContext = {
            eventId: event.eventId,
            eventType: event.eventType,
            correlationId: event.correlationId,
            exchange: event.exchange,
            routingKey: event.routingKey,
            attempt: event.attempts,
        };
        try {
            await this.publisher.publish({
                eventId: event.eventId,
                eventType: event.eventType,
                correlationId: event.correlationId,
                exchange: event.exchange,
                routingKey: event.routingKey,
                payload: event.payload,
            });
        }
        catch (error) {
            const retryInMs = Math.min(MAX_RETRY_DELAY_MS, 1000 * 2 ** Math.max(0, event.attempts - 1));
            const serialized = (0, error_serializer_js_1.serializeError)(error);
            // Conditional on PENDING: if a slower duplicate claim already published it, keep that.
            await this.prisma.outboxEvent.updateMany({
                where: { id: event.id, status: client_1.OutboxEventStatus.PENDING },
                data: {
                    lastError: `${serialized.name}: ${serialized.message}`.slice(0, 2000),
                    availableAt: new Date(Date.now() + retryInMs),
                },
            });
            this.logger.warn('Outbox event publish failed; will retry', {
                event: 'outbox.event.publish_failed',
                ...logContext,
                retryInMs,
                error: serialized,
            });
            return;
        }
        await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: { status: client_1.OutboxEventStatus.PUBLISHED, publishedAt: new Date(), lastError: null },
        });
        this.logger.log('Outbox event published', {
            event: 'outbox.event.published',
            ...logContext,
            outboxLatencyMs: Date.now() - new Date(event.createdAt).getTime(),
        });
    }
};
exports.OutboxPublisherService = OutboxPublisherService;
exports.OutboxPublisherService = OutboxPublisherService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_js_1.PrismaService,
        rabbitmq_publisher_service_js_1.RabbitMqPublisher,
        structured_logger_service_js_1.StructuredLogger])
], OutboxPublisherService);
//# sourceMappingURL=outbox-publisher.service.js.map