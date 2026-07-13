import { validateEnvironment } from "./env.validation";

describe("validateEnvironment", () => {
  it("accepts a valid development configuration", () => {
    const config = { JWT_SECRET: "development-secret" };

    expect(validateEnvironment(config)).toBe(config);
  });

  it("rejects placeholder secrets", () => {
    expect(() =>
      validateEnvironment({ JWT_SECRET: "your_jwt_secret_here" }),
    ).toThrow("占位值");
  });

  it("requires stronger production secrets", () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: "production",
        JWT_SECRET: "development-secret",
      }),
    ).toThrow("32");
  });

  it("requires database settings in production", () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: "production",
        JWT_SECRET: "a-secure-production-secret-over-32-characters",
      }),
    ).toThrow("DB_HOST");
  });

  it("requires HTTPS for the production frontend", () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: "production",
        JWT_SECRET: "a-secure-production-secret-over-32-characters",
        DB_HOST: "mysql",
        DB_USERNAME: "wallpaper",
        DB_PASSWORD: "database-password",
        DB_DATABASE: "wallpaper",
        FRONTEND_URL: "http://example.com",
      }),
    ).toThrow("HTTPS");
  });

  it("requires admin credentials in pairs", () => {
    expect(() =>
      validateEnvironment({
        JWT_SECRET: "development-secret",
        ADMIN_USER_ID: "10001",
      }),
    ).toThrow("ADMIN_USER_PASSWORD");
  });

  it("rejects unsupported cross-site authentication cookies", () => {
    expect(() =>
      validateEnvironment({
        JWT_SECRET: "development-secret",
        COOKIE_SAMESITE: "none",
      }),
    ).toThrow("同站点部署");
  });
});
