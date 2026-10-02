import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';
import { configureApplication } from './app.setup.js';
import type { IEnvironmentVariables } from './infrastructure/config/environment.validation.js';
import { serializeError } from './infrastructure/logging/error-serializer.js';
import { StructuredLogger } from './infrastructure/logging/structured-logger.service.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = app.get(StructuredLogger);

  app.useLogger(logger);
  // Safety net for failures outside the request pipeline (e.g. a background job whose error
  // handling itself fails), so no error disappears without a console log.
  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('Unhandled promise rejection', {
      event: 'process.unhandled_rejection',
      error: serializeError(reason),
    });
  });
  process.on('uncaughtException', (error: Error) => {
    logger.fatal('Uncaught exception', {
      event: 'process.uncaught_exception',
      error: serializeError(error),
    });
    // Keep Node's default crash-on-uncaught-exception behaviour; only the logging is added.
    process.exit(1);
  });
  await configureApplication(app);
  app.enableShutdownHooks();

  const config = app.get(ConfigService<IEnvironmentVariables, true>);
  const port = config.getOrThrow('PORT');
  await app.listen(port, '0.0.0.0');
  logger.log('API server started', { event: 'server.started', port });
}

void bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown bootstrap failure';
  process.stderr.write(`${JSON.stringify({ level: 'error', message })}\n`);
  process.exitCode = 1;
});
