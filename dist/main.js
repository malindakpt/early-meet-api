"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const app_module_js_1 = require("./app.module.js");
const app_setup_js_1 = require("./app.setup.js");
const error_serializer_js_1 = require("./infrastructure/logging/error-serializer.js");
const structured_logger_service_js_1 = require("./infrastructure/logging/structured-logger.service.js");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_js_1.AppModule, { bufferLogs: true });
    const logger = app.get(structured_logger_service_js_1.StructuredLogger);
    app.useLogger(logger);
    // Safety net for failures outside the request pipeline (e.g. a background job whose error
    // handling itself fails), so no error disappears without a console log.
    process.on('unhandledRejection', (reason) => {
        logger.error('Unhandled promise rejection', {
            event: 'process.unhandled_rejection',
            error: (0, error_serializer_js_1.serializeError)(reason),
        });
    });
    process.on('uncaughtException', (error) => {
        logger.fatal('Uncaught exception', {
            event: 'process.uncaught_exception',
            error: (0, error_serializer_js_1.serializeError)(error),
        });
        // Keep Node's default crash-on-uncaught-exception behaviour; only the logging is added.
        process.exit(1);
    });
    await (0, app_setup_js_1.configureApplication)(app);
    app.enableShutdownHooks();
    const config = app.get((config_1.ConfigService));
    const port = config.getOrThrow('PORT');
    await app.listen(port, '0.0.0.0');
    logger.log('API server started', { event: 'server.started', port });
}
void bootstrap().catch((error) => {
    const message = error instanceof Error ? error.message : 'Unknown bootstrap failure';
    process.stderr.write(`${JSON.stringify({ level: 'error', message })}\n`);
    process.exitCode = 1;
});
//# sourceMappingURL=main.js.map