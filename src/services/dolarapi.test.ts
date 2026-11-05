import { describe, expect, it } from "vitest";
import { fetchMepRate } from "./dolarapi.ts";
import type { FetchFunction } from "./dolarapi.ts";

const respondWith = (body: unknown, status = 200): FetchFunction => async () =>
  new Response(JSON.stringify(body), { status });

describe("fetchMepRate", () => {
  it("returns the sell price of the MEP dollar", async () => {
    const rate = await fetchMepRate(respondWith({ casa: "bolsa", compra: 1575.7, venta: 1588.6 }));
    expect(rate).toBe(1588.6);
  });

  it("fails on non successful responses", async () => {
    await expect(fetchMepRate(respondWith({}, 503))).rejects.toThrow("status 503");
  });

  it("fails on unexpected payloads", async () => {
    await expect(fetchMepRate(respondWith({ venta: "abc" }))).rejects.toThrow();
    await expect(fetchMepRate(respondWith({ venta: 0 }))).rejects.toThrow();
  });

  it("propagates network errors", async () => {
    const failing: FetchFunction = async () => {
      throw new TypeError("fetch failed");
    };
    await expect(fetchMepRate(failing)).rejects.toThrow("fetch failed");
  });
});
