import { getDatabase } from "../db/instance.ts";
import { getCurrentRate } from "../services/exchange-rate-service.ts";
import type { CurrentRate } from "../services/exchange-rate-service.ts";

const loadRate = async (): Promise<CurrentRate | null> => {
  try {
    return await getCurrentRate({ database: getDatabase() });
  } catch {
    return null;
  }
};

export { loadRate };
