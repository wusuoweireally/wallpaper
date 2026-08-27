import { RequestMethod } from "@nestjs/common";
import { METHOD_METADATA, PATH_METADATA } from "@nestjs/common/constants";
import { CommentController } from "./comment.controller";
import { PostController } from "./post.controller";

function getGetPaths(controller: new (...args: never[]) => unknown): string[] {
  return Object.getOwnPropertyNames(controller.prototype)
    .map((name) => {
      const handler = (
        controller.prototype as Record<string, (...args: unknown[]) => unknown>
      )[name];
      if (typeof handler !== "function") return null;
      const method = Reflect.getMetadata(METHOD_METADATA, handler) as
        RequestMethod | undefined;
      if (method !== RequestMethod.GET) return null;
      const path = Reflect.getMetadata(PATH_METADATA, handler) as
        string | undefined;
      return String(path ?? "");
    })
    .filter((path): path is string => path !== null);
}

/** 第一段是字面量的 GET，必须声明在第一段为 :param 的 GET 之前 */
function assertStaticGetsBeforeParamGets(paths: string[]) {
  const firstParam = paths.findIndex((path) =>
    path.split("/")[0].startsWith(":"),
  );
  if (firstParam === -1) return;
  const laterStatic = paths
    .slice(firstParam)
    .filter((path) => path && !path.split("/")[0].startsWith(":"));
  expect(laterStatic).toEqual([]);
}

describe("forum GET route order", () => {
  it("declares PostController static paths before :id", () => {
    const paths = getGetPaths(PostController);
    expect(paths).toEqual(expect.arrayContaining([":id"]));
    assertStaticGetsBeforeParamGets(paths);
  });

  it("declares CommentController static paths before :id", () => {
    const paths = getGetPaths(CommentController);
    expect(paths).toEqual(expect.arrayContaining(["post/:postId"]));
    assertStaticGetsBeforeParamGets(paths);
  });
});
