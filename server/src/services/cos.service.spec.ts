import { CosService } from "./cos.service";

/**
 * 仅验证纯函数 keyFromUrl（构造实例要读环境变量，但不发起任何网络调用）。
 * 回归背景：曾按 COS_PUBLIC_BASE 前缀反解 key，桶域名切换后历史对象 URL 失配，
 * 整串 URL 被当成 key，转私有/删除静默失败——下架内容拿直链仍可访问。
 */
const buildService = (): CosService => {
  process.env.COS_BUCKET = "wallpaper-prod-1332722494";
  process.env.COS_REGION = "ap-beijing";
  process.env.COS_PUBLIC_BASE =
    "https://wallpaper-prod-1332722494.cos.ap-beijing.myqcloud.com";
  process.env.COS_SECRET_ID = "test-secret-id";
  process.env.COS_SECRET_KEY = "test-secret-key";
  return new CosService();
};

describe("CosService.keyFromUrl", () => {
  const service = buildService();

  it("提取当前桶 URL 的 key", () => {
    expect(
      service.keyFromUrl(
        "https://wallpaper-prod-1332722494.cos.ap-beijing.myqcloud.com/wallpapers/a.jpg",
      ),
    ).toBe("wallpapers/a.jpg");
  });

  it("历史桶域名同样能反解，不回退成整串 URL", () => {
    expect(
      service.keyFromUrl(
        "https://wallpaper-1332722494.cos.ap-beijing.myqcloud.com/previews/b.webp",
      ),
    ).toBe("previews/b.webp");
  });

  it("剥掉查询串（无 previewUrl 的老数据会拼现场 CI 参数）", () => {
    expect(
      service.keyFromUrl(
        "https://wallpaper-prod-1332722494.cos.ap-beijing.myqcloud.com/wallpapers/a.jpg?imageMogr2/thumbnail/1600x1600",
      ),
    ).toBe("wallpapers/a.jpg");
  });
});
