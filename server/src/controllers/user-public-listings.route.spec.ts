import { PATH_METADATA } from "@nestjs/common/constants";
import { UserController } from "./user.controller";

function getPaths(controller: new (...args: never[]) => unknown): string[] {
  return Object.getOwnPropertyNames(controller.prototype)
    .map((name) => {
      const handler = (
        controller.prototype as Record<string, (...args: unknown[]) => unknown>
      )[name];
      if (typeof handler !== "function") return null;
      const path = Reflect.getMetadata(PATH_METADATA, handler) as
        string | undefined;
      return path === undefined ? null : path;
    })
    .filter((path): path is string => path !== null);
}

describe("UserController public listings", () => {
  it("does not expose favorites or collections on public profiles", () => {
    const paths = getPaths(UserController);
    expect(paths).toContain(":id/uploads");
    expect(paths).not.toContain(":id/favorites");
    expect(paths).not.toContain(":id/collections");
    expect(paths).not.toContain(":id/collections/:collectionId");
  });
});
