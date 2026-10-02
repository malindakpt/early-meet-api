"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWithRequestContext = runWithRequestContext;
exports.currentRequestId = currentRequestId;
const node_async_hooks_1 = require("node:async_hooks");
// Carries the HTTP request ID through the async call chain so code far from the controller (for
// example the outbox writer) can stamp it on integration events without threading it through
// every method signature. Outside an HTTP request (background jobs) there is no context.
const storage = new node_async_hooks_1.AsyncLocalStorage();
function runWithRequestContext(context, work) {
    return storage.run(context, work);
}
function currentRequestId() {
    return storage.getStore()?.requestId;
}
//# sourceMappingURL=request-context.js.map