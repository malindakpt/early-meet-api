import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
export declare class HealthService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getHealth(): Promise<{
        database: 'connected';
        status: 'ok';
    }>;
    getLiveness(): {
        status: 'ok';
    };
}
