import {
  aspectRatioBounds,
  matchesWallpaperFilters,
  normalizeColorFilter,
  parseResolutionList,
  parseResolutionToken,
  resolveTopRangeSince,
  rgbToColorBucket,
  rgbToHex,
} from "./wallpaper-filters";

describe("wallpaper-filters (shipped query semantics)", () => {
  const fixtures = [
    {
      id: 1,
      width: 1920,
      height: 1080,
      aspectRatio: 1.78,
      category: "general",
      colorBucket: "blue",
      dominantColor: "#1a4d8c",
      createdAt: new Date("2026-08-01T00:00:00Z"),
      tagNames: ["sky", "ocean"],
      status: 1,
    },
    {
      id: 2,
      width: 3840,
      height: 2160,
      aspectRatio: 1.78,
      category: "anime",
      colorBucket: "red",
      dominantColor: "#cc2233",
      createdAt: new Date("2026-01-01T00:00:00Z"),
      tagNames: ["city", "night"],
      status: 1,
    },
    {
      id: 3,
      width: 1080,
      height: 1920,
      aspectRatio: 0.56,
      category: "people",
      colorBucket: "green",
      dominantColor: "#228B22",
      createdAt: new Date("2026-08-10T12:00:00Z"),
      tagNames: ["portrait"],
      status: 1,
    },
    {
      id: 4,
      width: 2560,
      height: 1440,
      aspectRatio: 1.78,
      category: "general",
      colorBucket: "blue",
      createdAt: new Date("2026-08-11T00:00:00Z"),
      tagNames: ["sky"],
      status: 0, // pending
    },
  ];

  const now = new Date("2026-08-12T00:00:00Z").getTime();

  it("filters by min resolution", () => {
    const rows = fixtures.filter((wp) =>
      matchesWallpaperFilters(wp, { minWidth: 3000, minHeight: 1600 }),
    );
    expect(rows.map((r) => r.id)).toEqual([2]);
    rows.forEach((r) => {
      expect(r.width).toBeGreaterThanOrEqual(3000);
      expect(r.height).toBeGreaterThanOrEqual(1600);
    });
  });

  it("filters by exact resolution list", () => {
    const rows = fixtures.filter((wp) =>
      matchesWallpaperFilters(wp, { resolutions: ["1920x1080", "1080x1920"] }),
    );
    expect(rows.map((r) => r.id).sort()).toEqual([1, 3]);
    rows.forEach((r) => {
      expect(
        (r.width === 1920 && r.height === 1080) ||
          (r.width === 1080 && r.height === 1920),
      ).toBe(true);
    });
  });

  it("filters by aspect ratio with tolerance", () => {
    const target = 16 / 9;
    const { min, max } = aspectRatioBounds(target);
    const rows = fixtures.filter((wp) =>
      matchesWallpaperFilters(wp, { aspectRatio: target }),
    );
    expect(rows.every((r) => (r.aspectRatio ?? 0) >= min)).toBe(true);
    expect(rows.every((r) => (r.aspectRatio ?? 0) <= max)).toBe(true);
    expect(rows.map((r) => r.id)).toContain(1);
    expect(rows.map((r) => r.id)).not.toContain(3);
  });

  it("filters by toplist time window", () => {
    const rows = fixtures.filter((wp) =>
      matchesWallpaperFilters(wp, { topRange: "1w", now }),
    );
    // since ~ 2026-08-05：fixture 1 在 8/01 之外，3 在 8/10 之内
    expect(rows.map((r) => r.id).sort()).toEqual([3]);
    const since = resolveTopRangeSince("1w", now)!;
    rows.forEach((r) => {
      expect(new Date(r.createdAt).getTime()).toBeGreaterThanOrEqual(
        since.getTime(),
      );
    });
  });

  it("requires ALL tags (AND) for multi-tag filter", () => {
    const rows = fixtures.filter((wp) =>
      matchesWallpaperFilters(wp, { tags: ["sky", "ocean"] }),
    );
    expect(rows.map((r) => r.id)).toEqual([1]);
  });

  it("filters by color bucket", () => {
    const rows = fixtures.filter((wp) =>
      matchesWallpaperFilters(wp, { color: "blue" }),
    );
    // id 4 is pending status=0 → excluded
    expect(rows.map((r) => r.id)).toEqual([1]);
  });

  it("normalizes hex color to bucket", () => {
    expect(normalizeColorFilter("#cc2233")).toBe("red");
    expect(normalizeColorFilter("blue")).toBe("blue");
  });

  it("parses resolution tokens", () => {
    expect(parseResolutionToken("1920x1080")).toEqual({
      width: 1920,
      height: 1080,
    });
    expect(parseResolutionList(["1920×1080", "bad", "800x600"])).toEqual([
      { width: 1920, height: 1080 },
      { width: 800, height: 600 },
    ]);
  });

  it("maps solid red sample to red bucket", () => {
    expect(rgbToColorBucket(220, 20, 20)).toBe("red");
    expect(rgbToHex(255, 0, 0)).toBe("#ff0000");
  });
});
