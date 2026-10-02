"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationException = void 0;
const common_1 = require("@nestjs/common");
class AuthenticationException extends common_1.HttpException {
    code;
    constructor(status, code, detail, options) {
        super({ code, detail }, status, options);
        this.code = code;
    }
}
exports.AuthenticationException = AuthenticationException;
//# sourceMappingURL=auth.exception.js.map