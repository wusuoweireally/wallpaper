const UNIT_SECONDS = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
  w: 604800,
} as const;

export const parseDurationSeconds = (value: string): number => {
  const match = /^(\d+)([smhdw])$/.exec(value.trim().toLowerCase());
  if (!match) {
    throw new Error("JWT_EXPIRES_IN 格式无效，应为 30d、12h 等格式");
  }

  const seconds =
    Number(match[1]) * UNIT_SECONDS[match[2] as keyof typeof UNIT_SECONDS];
  if (seconds === 0) {
    throw new Error("JWT_EXPIRES_IN 必须大于 0");
  }

  return seconds;
};

export const getJwtCookieMaxAge = (): number =>
  parseDurationSeconds(process.env.JWT_EXPIRES_IN ?? "30d") * 1000;
