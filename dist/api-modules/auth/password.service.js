"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordService = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const node_util_1 = require("node:util");
const scrypt = (0, node_util_1.promisify)(node_crypto_1.scrypt);
const KEY_LENGTH = 64;
let PasswordService = class PasswordService {
    async hash(password) {
        const salt = (0, node_crypto_1.randomBytes)(16).toString('base64url');
        const derivedKey = (await scrypt(password, salt, KEY_LENGTH));
        return `scrypt$${salt}$${derivedKey.toString('base64url')}`;
    }
    async verify(password, encodedHash) {
        const [algorithm, salt, encodedKey] = encodedHash.split('$');
        if (algorithm !== 'scrypt' || salt === undefined || encodedKey === undefined) {
            return false;
        }
        const expectedKey = Buffer.from(encodedKey, 'base64url');
        const derivedKey = (await scrypt(password, salt, expectedKey.length));
        return expectedKey.length === derivedKey.length && (0, node_crypto_1.timingSafeEqual)(expectedKey, derivedKey);
    }
};
exports.PasswordService = PasswordService;
exports.PasswordService = PasswordService = __decorate([
    (0, common_1.Injectable)()
], PasswordService);
//# sourceMappingURL=password.service.js.map