import { z } from "zod";
import { exchangeRate } from "../lib/money.ts";
import type { ExchangeRate } from "../lib/money.ts";

const MEP_URL = "https://dolarapi.com/v1/dolares/bolsa";
const REQUEST_TIMEOUT_MS = 5_000;

const mepResponseSchema = z.object({
  venta: z.number().positive(),
});

type FetchFunction = (input: string, init?: { signal?: AbortSignal }) => Promise<Response>;

const fetchMepRate = async (fetchFunction: FetchFunction = fetch): Promise<ExchangeRate> => {
  const response = await fetchFunction(MEP_URL, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`dolarapi responded with status ${response.status}`);
  }
  const body: unknown = await response.json();
  return exchangeRate(mepResponseSchema.parse(body).venta);
};

export { fetchMepRate };
export type { FetchFunction };
