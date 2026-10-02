import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

import type { IEnvironmentVariables } from '../config/environment.validation.js';
import { serializeError } from '../logging/error-serializer.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService<IEnvironmentVariables, true>) {
    const connectionString = config.getOrThrow<string>('DATABASE_URL');

    super({ adapter: new PrismaPg({ connectionString }) });
  }

  // Verifies connectivity at startup without making it fatal: the API still boots (health
  // endpoints report the outage) and Prisma reconnects lazily once the database is reachable.
  async onModuleInit(): Promise<void> {
    try {
      await this.$queryRaw`SELECT 1`;
    } catch (error: unknown) {
      this.logger.error('Database is not connected', {
        event: 'database.connection_failed',
        error: serializeError(error),
      });
      printDatabaseUnavailableBanner(error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

// Structured logs are easy to miss in a dev terminal, so also print a highlighted banner to
// stderr. ANSI colours are only used on a TTY to keep container/CI logs clean.
function printDatabaseUnavailableBanner(error: unknown): void {
  // Prisma messages are multi-line with the actual cause on the last line.
  const message = error instanceof Error ? error.message : String(error);
  const reason = message.trim().split('\n').at(-1)?.trim() ?? 'Unknown error';
  const lines = [
    'DATABASE NOT CONNECTED',
    'The API started, but database-backed endpoints will fail until the database is reachable.',
    `Reason: ${reason}`,
  ];
  const width = Math.max(...lines.map((line) => line.length)) + 4;
  const border = '!'.repeat(width);
  const body = lines.map((line) => `! ${line.padEnd(width - 4)} !`);
  const banner = [border, ...body, border].join('\n');
  const output = process.stderr.isTTY ? `\x1b[1;37;41m${banner}\x1b[0m` : banner;

  process.stderr.write(`\n${output}\n\n`);
}
