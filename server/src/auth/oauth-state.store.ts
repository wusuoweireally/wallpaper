import { createHash, randomBytes, timingSafeEqual } from "crypto";
import type { Request } from "express";
import { getAuthCookieOptions } from "../utils/cookie";

const STATE_COOKIE_PREFIX = "OAuthState_";
const STATE_MAX_AGE = 10 * 60 * 1000;
const MAX_PENDING_STATES = 5;
const STATE_PATTERN = /^[A-Za-z0-9_-]{43}$/;

type StoreCallback = (error: Error | null, state: unknown) => void;
type VerifyCallback = (
  error: Error | null,
  valid: boolean,
  state: unknown,
) => void;

export class OAuthStateStore {
  private getCookieName(state: string): string {
    const id = createHash("sha256")
      .update(state)
      .digest("base64url")
      .slice(0, 22);
    return `${STATE_COOKIE_PREFIX}${id}`;
  }

  private removeOverflowCookies(request: Request): void {
    const pendingCookies = Object.keys(request.cookies ?? {}).filter(
      (name) =>
        name.startsWith(STATE_COOKIE_PREFIX) &&
        name.length === STATE_COOKIE_PREFIX.length + 22,
    );
    const overflow = pendingCookies.length - MAX_PENDING_STATES + 1;

    pendingCookies.slice(0, Math.max(0, overflow)).forEach((name) => {
      request.res?.clearCookie(name, getAuthCookieOptions(request));
    });
  }

  store(request: Request, callback: StoreCallback): void;
  store(request: Request, metadata: unknown, callback: StoreCallback): void;
  store(
    request: Request,
    metadataOrCallback: unknown,
    callback?: StoreCallback,
  ): void {
    const done =
      typeof metadataOrCallback === "function"
        ? (metadataOrCallback as StoreCallback)
        : callback;
    if (!done) {
      return;
    }

    if (!request.res) {
      done(new Error("无法写入 OAuth state Cookie"), null);
      return;
    }

    const state = randomBytes(32).toString("base64url");
    this.removeOverflowCookies(request);
    request.res.cookie(this.getCookieName(state), state, {
      ...getAuthCookieOptions(request),
      maxAge: STATE_MAX_AGE,
    });
    done(null, state);
  }

  verify(
    request: Request,
    providedState: string,
    callback: VerifyCallback,
  ): void;
  verify(
    request: Request,
    providedState: string,
    metadata: unknown,
    callback: VerifyCallback,
  ): void;
  verify(
    request: Request,
    providedState: string,
    metadataOrCallback: unknown,
    callback?: VerifyCallback,
  ): void {
    const done =
      typeof metadataOrCallback === "function"
        ? (metadataOrCallback as VerifyCallback)
        : callback;
    if (!done) {
      return;
    }

    if (!providedState) {
      done(null, false, { message: "OAuth state 缺失" });
      return;
    }
    if (!STATE_PATTERN.test(providedState)) {
      done(null, false, { message: "OAuth state 无效" });
      return;
    }

    const cookieName = this.getCookieName(providedState);
    const storedState = request.cookies?.[cookieName] as string | undefined;
    if (!storedState) {
      done(null, false, { message: "OAuth state 无效" });
      return;
    }

    request.res?.clearCookie(cookieName, getAuthCookieOptions(request));

    const stored = Buffer.from(storedState);
    const provided = Buffer.from(providedState);
    const valid =
      stored.length === provided.length && timingSafeEqual(stored, provided);

    done(null, valid, valid ? undefined : { message: "OAuth state 无效" });
  }
}
