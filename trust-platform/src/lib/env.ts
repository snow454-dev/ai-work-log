import "server-only";

import { parseServerEnv, type ServerEnv } from "./env-schema";

let cachedEnv: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  cachedEnv ??= parseServerEnv(process.env);
  return cachedEnv;
}

export const env = new Proxy({} as ServerEnv, {
  get(_target, property) {
    if (typeof property !== "string") {
      return undefined;
    }

    return getServerEnv()[property as keyof ServerEnv];
  },
});
