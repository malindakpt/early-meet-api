import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import type { IEnvironmentVariables } from '../config/environment.validation.js';
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    constructor(config: ConfigService<IEnvironmentVariables, true>);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
