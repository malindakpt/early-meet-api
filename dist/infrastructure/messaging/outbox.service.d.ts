import type { Prisma } from '@prisma/client';
export interface IIntegrationEvent<TType extends string, TData> {
    correlationId: string | null;
    data: TData;
    eventId: string;
    occurredAt: string;
    type: TType;
    version: number;
}
export interface IOutboxEventInput<TType extends string, TData> {
    data: TData;
    exchange: string;
    routingKey: string;
    type: TType;
    version: number;
}
/**
 * Writes integration events into the transactional outbox.
 *
 * `add` must be called with the Prisma transaction client of the business operation, so the
 * business rows and the outbox row are committed (or rolled back) atomically. Nothing is sent to
 * RabbitMQ here: OutboxPublisherService publishes committed rows asynchronously.
 */
export declare class OutboxService {
    add<TType extends string, TData>(transaction: Prisma.TransactionClient, input: IOutboxEventInput<TType, TData>): Promise<IIntegrationEvent<TType, TData>>;
}
