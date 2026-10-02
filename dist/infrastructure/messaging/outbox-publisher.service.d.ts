import { OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { IEnvironmentVariables } from '../config/environment.validation.js';
import { StructuredLogger } from '../logging/structured-logger.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RabbitMqPublisher } from './rabbitmq-publisher.service.js';
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
export declare class OutboxPublisherService implements OnApplicationBootstrap, OnApplicationShutdown {
    private readonly config;
    private readonly prisma;
    private readonly publisher;
    private readonly logger;
    private timer;
    private running;
    private stopped;
    constructor(config: ConfigService<IEnvironmentVariables, true>, prisma: PrismaService, publisher: RabbitMqPublisher, logger: StructuredLogger);
    onApplicationBootstrap(): void;
    onApplicationShutdown(): Promise<void>;
    /** Claims and publishes one batch. Returns the number of rows claimed. */
    publishBatch(): Promise<number>;
    private schedule;
    private tick;
    private claimBatch;
    private publishOne;
}
