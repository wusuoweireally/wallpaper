import { getJwtCookieMaxAge, parseDurationSeconds } from "./duration";

describe("duration", () => {
  const originalValue = process.env.JWT_EXPIRES_IN;

  afterEach(() => {
    if (originalValue === undefined) {
      delete process.env.JWT_EXPIRES_IN;
    } else {
      process.env.JWT_EXPIRES_IN = originalValue;
    }
  });

  it("parses supported duration units", () => {
    expect(parseDurationSeconds("30d")).toBe(2_592_000);
    expect(parseDurationSeconds("12h")).toBe(43_200);
    expect(parseDurationSeconds("2w")).toBe(1_209_600);
  });

  it("rejects ambiguous values", () => {
    expect(() => parseDurationSeconds("30 days")).toThrow("格式无效");
  });

  it("uses JWT_EXPIRES_IN for the cookie lifetime", () => {
    process.env.JWT_EXPIRES_IN = "12h";
    expect(getJwtCookieMaxAge()).toBe(43_200_000);
  });
});
