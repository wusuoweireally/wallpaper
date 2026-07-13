import type { Request } from "express";
import {
  getAuthCookieOptions,
  getCookieDomain,
  getCookieSameSite,
  getCookieSecure,
} from "./cookie";

describe("cookie options", () => {
  const originalEnvironment = process.env;

  beforeEach(() => {
    process.env = { ...originalEnvironment };
    delete process.env.COOKIE_DOMAIN;
    delete process.env.COOKIE_SAMESITE;
    delete process.env.COOKIE_SECURE;
    delete process.env.NODE_ENV;
  });

  afterAll(() => {
    process.env = originalEnvironment;
  });

  it("uses host-only and Lax cookies by default", () => {
    expect(getCookieDomain()).toBeUndefined();
    expect(getCookieSameSite()).toBe("lax");
    expect(getAuthCookieOptions()).toMatchObject({
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
    });
  });

  it("honors an explicitly configured cookie domain", () => {
    process.env.COOKIE_DOMAIN = ".example.com";

    expect(getCookieDomain()).toBe(".example.com");
    expect(getAuthCookieOptions().domain).toBe(".example.com");
  });

  it("detects HTTPS behind a trusted proxy", () => {
    const request = {
      headers: { "x-forwarded-proto": "https" },
      secure: false,
    } as unknown as Request;

    expect(getCookieSecure(request)).toBe(true);
  });

  it("never emits SameSite=None without Secure", () => {
    process.env.COOKIE_SAMESITE = "none";
    process.env.COOKIE_SECURE = "false";

    expect(getAuthCookieOptions().sameSite).toBe("lax");
  });
});
