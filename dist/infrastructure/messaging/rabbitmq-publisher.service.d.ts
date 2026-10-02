import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { IEnvironmentVariables } from '../config/environment.validation.js';
export interface IBrokerMessage {
    correlationId: string | null;
    eventId: string;
    eventType: string;
    exchange: string;
    payload: unknown;
    routingKey: string;
}
/**
 * Thin RabbitMQ producer used only by the outbox publisher; business code never publishes
 * directly (it writes outbox rows instead).
 *
 * A publish succeeds only when the broker has *confirmed* the message (publisher confirms) and
 * routed it to at least one queue (`mandatory`). Otherwise it throws and the outbox row stays
 * pending, so a broker outage or a not-yet-declared consumer queue never loses a message.
 * The connection is opened lazily and rebuilt on the next publish after any failure.
 */
export declare class RabbitMqPublisher implements OnModuleDestroy {
    private readonly config;
    private channel;
    private connection;
    private readonly declaredExchanges;
    constructor(config: ConfigService<IEnvironmentVariables, true>);
    publish(message: IBrokerMessage): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private getChannel;
    private open;
    private reset;
}
