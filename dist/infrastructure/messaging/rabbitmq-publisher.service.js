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
exports.RabbitMqPublisher = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const amqplib_1 = require("amqplib");
const CONFIRM_TIMEOUT_MS = 10_000;
/**
 * Thin RabbitMQ producer used only by the outbox publisher; business code never publishes
 * directly (it writes outbox rows instead).
 *
 * A publish succeeds only when the broker has *confirmed* the message (publisher confirms) and
 * routed it to at least one queue (`mandatory`). Otherwise it throws and the outbox row stays
 * pending, so a broker outage or a not-yet-declared consumer queue never loses a message.
 * The connection is opened lazily and rebuilt on the next publish after any failure.
 */
let RabbitMqPublisher = class RabbitMqPublisher {
    config;
    channel;
    connection;
    declaredExchanges = new Set();
    constructor(config) {
        this.config = config;
    }
    async publish(message) {
        const channel = await this.getChannel();
        if (!this.declaredExchanges.has(message.exchange)) {
            // Idempotent, and must match the consumer's declaration. Declaring it here means the first
            // publish works even if the Email Service has never started; the message is then returned
            // as unroutable (no queue yet) and retried from the outbox.
            await channel.assertExchange(message.exchange, 'direct', { durable: true });
            this.declaredExchanges.add(message.exchange);
        }
        await publishConfirmed(channel, message);
    }
    async onModuleDestroy() {
        const connection = this.connection;
        this.reset();
        await connection?.close().catch(() => undefined);
    }
    getChannel() {
        this.channel ??= this.open().catch((error) => {
            this.reset();
            throw error;
        });
        return this.channel;
    }
    async open() {
        const connection = await (0, amqplib_1.connect)({
            hostname: this.config.getOrThrow('RABBITMQ_HOST'),
            port: this.config.getOrThrow('RABBITMQ_PORT'),
            username: this.config.getOrThrow('RABBITMQ_USERNAME'),
            password: this.config.getOrThrow('RABBITMQ_PASSWORD'),
            vhost: this.config.getOrThrow('RABBITMQ_VHOST'),
            heartbeat: 30,
        }, { clientProperties: { connection_name: 'api-outbox-publisher' } });
        this.connection = connection;
        // Errors are also surfaced as a rejected publish; the listener only prevents an unhandled
        // 'error' event from crashing the process.
        connection.on('error', () => undefined);
        connection.on('close', () => {
            if (this.connection === connection)
                this.reset();
        });
        const channel = await connection.createConfirmChannel();
        channel.on('error', () => undefined);
        channel.on('close', () => {
            if (this.connection === connection) {
                this.reset();
                void connection.close().catch(() => undefined);
            }
        });
        return channel;
    }
    reset() {
        this.channel = undefined;
        this.connection = undefined;
        this.declaredExchanges.clear();
    }
};
exports.RabbitMqPublisher = RabbitMqPublisher;
exports.RabbitMqPublisher = RabbitMqPublisher = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RabbitMqPublisher);
// basic.return (unroutable) always arrives before the basic.ack for the same publish, so a
// return observed for this messageId turns the confirm into a failure.
function publishConfirmed(channel, message) {
    let returned = false;
    const onReturn = (returnedMessage) => {
        if (returnedMessage.properties.messageId === message.eventId)
            returned = true;
    };
    channel.on('return', onReturn);
    let timeout;
    return new Promise((resolve, reject) => {
        timeout = setTimeout(() => reject(new Error(`RabbitMQ did not confirm the publish within ${CONFIRM_TIMEOUT_MS}ms.`)), CONFIRM_TIMEOUT_MS);
        channel.publish(message.exchange, message.routingKey, Buffer.from(JSON.stringify(message.payload)), {
            persistent: true,
            mandatory: true,
            contentType: 'application/json',
            messageId: message.eventId,
            type: message.eventType,
            timestamp: Math.floor(Date.now() / 1000),
            appId: 'api',
            ...(message.correlationId === null ? {} : { correlationId: message.correlationId }),
        }, (error) => {
            if (error)
                reject(error instanceof Error ? error : new Error(String(error)));
            else if (returned) {
                reject(new Error(`Message was unroutable: no queue is bound to ${message.exchange} with routing key ${message.routingKey}.`));
            }
            else
                resolve();
        });
    }).finally(() => {
        clearTimeout(timeout);
        channel.off('return', onReturn);
    });
}
//# sourceMappingURL=rabbitmq-publisher.service.js.map