"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureApplication = configureApplication;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
async function configureApplication(app) {
    const config = app.get((config_1.ConfigService));
    const configuredOrigins = config.getOrThrow('CORS_ORIGIN');
    const origins = configuredOrigins
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0);
    app.use((0, helmet_1.default)());
    app.use((0, cookie_parser_1.default)());
    app.enableCors({
        origin: origins,
        credentials: true,
        allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-Id'],
        exposedHeaders: ['X-Request-Id'],
    });
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        validationError: { target: false, value: false },
    }));
}
//# sourceMappingURL=app.setup.js.map