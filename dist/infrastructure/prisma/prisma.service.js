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
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("@prisma/client");
const error_serializer_js_1 = require("../logging/error-serializer.js");
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    logger = new common_1.Logger(PrismaService_1.name);
    constructor(config) {
        const connectionString = config.getOrThrow('DATABASE_URL');
        super({ adapter: new adapter_pg_1.PrismaPg({ connectionString }) });
    }
    // Verifies connectivity at startup without making it fatal: the API still boots (health
    // endpoints report the outage) and Prisma reconnects lazily once the database is reachable.
    async onModuleInit() {
        try {
            await this.$queryRaw `SELECT 1`;
        }
        catch (error) {
            this.logger.error('Database is not connected', {
                event: 'database.connection_failed',
                error: (0, error_serializer_js_1.serializeError)(error),
            });
            printDatabaseUnavailableBanner(error);
        }
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PrismaService);
// Structured logs are easy to miss in a dev terminal, so also print a highlighted banner to
// stderr. ANSI colours are only used on a TTY to keep container/CI logs clean.
function printDatabaseUnavailableBanner(error) {
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
//# sourceMappingURL=prisma.service.js.map