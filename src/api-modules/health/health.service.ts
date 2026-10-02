import { Injectable, ServiceUnavailableException } from '@nestjs/common';

import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealth(): Promise<{ database: 'connected'; status: 'ok' }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error: unknown) {
      throw new ServiceUnavailableException(
        {
          code: 'DATABASE_UNAVAILABLE',
          detail: 'The database is unavailable.',
          title: 'Service unavailable',
        },
        { cause: error },
      );
    }

    return { status: 'ok', database: 'connected' };
  }

  getLiveness(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
