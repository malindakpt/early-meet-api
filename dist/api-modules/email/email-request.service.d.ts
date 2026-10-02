import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';
import type { IEnvironmentVariables } from '../../infrastructure/config/environment.validation.js';
import { OutboxService } from '../../infrastructure/messaging/outbox.service.js';
import { type IEmailRequest } from './email-requested.message.js';
export declare class EmailRequestService {
    private readonly config;
    private readonly outbox;
    constructor(config: ConfigService<IEnvironmentVariables, true>, outbox: OutboxService);
    request(transaction: Prisma.TransactionClient, email: IEmailRequest): Promise<string>;
}
