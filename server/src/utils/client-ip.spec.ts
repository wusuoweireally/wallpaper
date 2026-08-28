import type { Request } from "express";
import { getClientIp, normalizeClientIp } from "./client-ip";

const asRequest = (partial: {
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
}): Request => partial as unknown as Request;

describe("normalizeClientIp", () => {
  it("keeps a plain IPv4", () => {
    expect(normalizeClientIp("203.0.113.10")).toBe("203.0.113.10");
  });

  it("collapses IPv4-mapped IPv6 to IPv4", () => {
    expect(normalizeClientIp("::ffff:203.0.113.10")).toBe("203.0.113.10");
  });

  it("rejects garbage", () => {
    expect(normalizeClientIp("unknown")).toBe("");
    expect(normalizeClientIp("")).toBe("");
  });
});

describe("getClientIp", () => {
  it("prefers CF-Connecting-IP over req.ip (Cloudflare edge)", () => {
    expect(
      getClientIp(
        asRequest({
          ip: "104.16.1.1",
          headers: { "cf-connecting-ip": "203.0.113.10" },
        }),
      ),
    ).toBe("203.0.113.10");
  });

  it("uses the first CF-Connecting-IP when the header is a list", () => {
    expect(
      getClientIp(
        asRequest({
          ip: "10.0.0.8",
          headers: { "cf-connecting-ip": "203.0.113.10, 10.0.0.8" },
        }),
      ),
    ).toBe("203.0.113.10");
  });

  it("falls back to leftmost X-Forwarded-For when req.ip is empty", () => {
    expect(
      getClientIp(
        asRequest({
          ip: "",
          headers: {
            "x-forwarded-for": "203.0.113.99, 10.0.0.8, 172.18.0.1",
          },
        }),
      ),
    ).toBe("203.0.113.99");
  });

  it("falls back to leftmost X-Forwarded-For when req.ip is private", () => {
    expect(
      getClientIp(
        asRequest({
          ip: "10.0.0.8",
          headers: { "x-forwarded-for": "198.51.100.7, 172.18.0.1" },
        }),
      ),
    ).toBe("198.51.100.7");
  });

  it("uses a public req.ip when no forwarding headers exist", () => {
    expect(getClientIp(asRequest({ ip: "198.51.100.2", headers: {} }))).toBe(
      "198.51.100.2",
    );
  });

  it("ignores an empty CF header and uses req.ip", () => {
    expect(
      getClientIp(
        asRequest({
          ip: "198.51.100.2",
          headers: { "cf-connecting-ip": "" },
        }),
      ),
    ).toBe("198.51.100.2");
  });
});
