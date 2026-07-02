import "server-only";

import { randomUUID } from "node:crypto";

import type { EmailTransport } from "./types";

export function createManualTransport(): EmailTransport {
  return {
    async send() {
      return { id: `manual-${randomUUID()}` };
    },
  };
}
