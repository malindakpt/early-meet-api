"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StructuredLogger = void 0;
const common_1 = require("@nestjs/common");
let StructuredLogger = class StructuredLogger {
    log(message, ...optionalParams) {
        this.write('info', message, optionalParams);
    }
    error(message, ...optionalParams) {
        this.write('error', message, optionalParams);
    }
    warn(message, ...optionalParams) {
        this.write('warn', message, optionalParams);
    }
    debug(message, ...optionalParams) {
        this.write('debug', message, optionalParams);
    }
    verbose(message, ...optionalParams) {
        this.write('verbose', message, optionalParams);
    }
    fatal(message, ...optionalParams) {
        this.write('fatal', message, optionalParams);
    }
    write(level, message, optionalParams) {
        const payload = {
            level,
            timestamp: new Date().toISOString(),
            message: message instanceof Error ? message.message : message,
        };
        if (optionalParams.length > 0) {
            payload.context = optionalParams;
        }
        process.stdout.write(`${JSON.stringify(payload)}\n`);
    }
};
exports.StructuredLogger = StructuredLogger;
exports.StructuredLogger = StructuredLogger = __decorate([
    (0, common_1.Injectable)()
], StructuredLogger);
//# sourceMappingURL=structured-logger.service.js.map