import type { Request, Response } from "express";
import { OAuthStateStore } from "./oauth-state.store";

describe("OAuthStateStore", () => {
  const store = new OAuthStateStore();

  const createRequest = (cookies: Record<string, string> = {}) => {
    const setCookie = jest.fn();
    const clearCookie = jest.fn();
    const response = {
      cookie: setCookie,
      clearCookie,
    } as unknown as Response;
    const request = {
      cookies,
      headers: {},
      secure: false,
      res: response,
    } as Request;

    return { request, setCookie, clearCookie };
  };

  it("creates a short-lived HttpOnly state cookie", () => {
    const { request, setCookie } = createRequest();
    let state = "";

    store.store(request, (error, storedState) => {
      expect(error).toBeNull();
      state = storedState as string;
    });

    expect(state).toHaveLength(43);
    expect(setCookie).toHaveBeenCalledWith(
      expect.stringMatching(/^OAuthState_[A-Za-z0-9_-]{22}$/),
      state,
      expect.objectContaining({
        httpOnly: true,
        maxAge: 600000,
        path: "/",
        sameSite: "lax",
      }),
    );
  });

  it("keeps parallel authorization attempts independent", () => {
    const first = createRequest();
    let firstState = "";
    store.store(first.request, (_error, state) => {
      firstState = state as string;
    });
    const [firstCookieName] = first.setCookie.mock.calls[0] as [string, string];

    const second = createRequest({ [firstCookieName]: firstState });
    let secondState = "";
    store.store(second.request, (_error, state) => {
      secondState = state as string;
    });
    const [secondCookieName] = second.setCookie.mock.calls[0] as [
      string,
      string,
    ];
    const cookies = {
      [firstCookieName]: firstState,
      [secondCookieName]: secondState,
    };

    const firstCallback = jest.fn();
    const firstVerification = createRequest(cookies);
    store.verify(firstVerification.request, firstState, firstCallback);
    expect(firstCallback).toHaveBeenCalledWith(null, true, undefined);
    expect(firstVerification.clearCookie).toHaveBeenCalledWith(
      firstCookieName,
      expect.any(Object),
    );

    const secondCallback = jest.fn();
    store.verify(createRequest(cookies).request, secondState, secondCallback);
    expect(secondCallback).toHaveBeenCalledWith(null, true, undefined);
  });

  it("rejects a missing or changed state without consuming another attempt", () => {
    const missingCallback = jest.fn();
    store.verify(createRequest().request, "", missingCallback);
    expect(missingCallback).toHaveBeenCalledWith(
      null,
      false,
      expect.objectContaining({ message: "OAuth state 缺失" }),
    );

    const stored = createRequest();
    let validState = "";
    store.store(stored.request, (_error, state) => {
      validState = state as string;
    });
    const [cookieName] = stored.setCookie.mock.calls[0] as [string, string];
    const replacement = validState.endsWith("x") ? "y" : "x";
    const changedState = `${validState.slice(0, -1)}${replacement}`;
    const changedRequest = createRequest({ [cookieName]: validState });
    const changedCallback = jest.fn();
    store.verify(changedRequest.request, changedState, changedCallback);
    expect(changedCallback).toHaveBeenCalledWith(
      null,
      false,
      expect.objectContaining({ message: "OAuth state 无效" }),
    );
    expect(changedRequest.clearCookie).not.toHaveBeenCalled();
  });

  it("limits pending state cookies", () => {
    const cookies = Object.fromEntries(
      Array.from({ length: 5 }, (_, index) => [
        `OAuthState_${String(index).padStart(22, "0")}`,
        String(index),
      ]),
    );
    const request = createRequest(cookies);

    store.store(request.request, jest.fn());

    expect(request.clearCookie).toHaveBeenCalledTimes(1);
  });
});
