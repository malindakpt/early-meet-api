"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeError = serializeError;
const MAX_CAUSE_DEPTH = 5;
// Turns any thrown value into a JSON-safe log payload, following `cause` chains so wrapped
// errors (e.g. an InternalServerErrorException around an OpenAI or Prisma failure) keep the
// original reason in the server logs.
function serializeError(error, depth = 0) {
    if (!(error instanceof Error)) {
        return { message: typeof error === 'string' ? error : JSON.stringify(error), name: typeof error };
    }
    const serialized = {
        message: error.message,
        name: error.name,
        stack: error.stack,
    };
    if ('code' in error && (typeof error.code === 'string' || typeof error.code === 'number')) {
        serialized.code = String(error.code);
    }
    if (error.cause !== undefined) {
        serialized.cause =
            depth >= MAX_CAUSE_DEPTH ? 'Cause chain truncated.' : serializeError(error.cause, depth + 1);
    }
    return serialized;
}
//# sourceMappingURL=error-serializer.js.map