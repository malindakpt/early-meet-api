"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMAIL_REQUESTED_VERSION = exports.EMAIL_REQUESTED_EVENT_TYPE = void 0;
// Producer-side definition of the EmailRequested v1 message published to RabbitMQ and consumed
// by the Email Service (apps/email-service/src/contracts/email-requested.message.ts holds the
// consumer's validating copy). Only add optional fields; a breaking change needs version 2.
//
// The message carries only what the Email Service needs to deliver without calling back into
// this API: recipient, template identifier and small template data (including the fully built
// action URL, because application routing is owned here). SMTP settings, sender address and
// the wording of each email belong to the Email Service.
exports.EMAIL_REQUESTED_EVENT_TYPE = 'EmailRequested';
exports.EMAIL_REQUESTED_VERSION = 1;
//# sourceMappingURL=email-requested.message.js.map