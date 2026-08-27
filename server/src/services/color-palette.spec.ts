import { extractColorPalette, samplePaletteFromImage } from "./color-palette";
import sharp from "sharp";

function fillRgb(
  width: number,
  height: number,
  paint: (x: number, y: number) => [number, number, number],
): Uint8Array {
  const out = new Uint8Array(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3;
      const [r, g, b] = paint(x, y);
      out[i] = r;
      out[i + 1] = g;
      out[i + 2] = b;
    }
  }
  return out;
}

describe("extractColorPalette", () => {
  it("returns a single hex for a solid color", () => {
    const rgb = fillRgb(8, 8, () => [255, 0, 0]);
    expect(extractColorPalette(rgb)).toEqual(["#ff0000"]);
  });

  it("keeps two spatially equal colors", () => {
    const rgb = fillRgb(8, 8, (x) => (x < 4 ? [255, 0, 0] : [0, 0, 255]));
    const palette = extractColorPalette(rgb);
    expect(palette).toHaveLength(2);
    expect(palette).toEqual(expect.arrayContaining(["#ff0000", "#0000ff"]));
  });

  it("collapses nearby shades into one swatch", () => {
    const rgb = fillRgb(8, 8, (x) => (x < 4 ? [20, 40, 180] : [28, 48, 188]));
    expect(extractColorPalette(rgb)).toHaveLength(1);
  });

  it("falls back when the buffer is empty", () => {
    expect(extractColorPalette(new Uint8Array())).toEqual(["#808080"]);
  });
});

describe("samplePaletteFromImage", () => {
  it("reads multiple regions from a real image buffer", async () => {
    const image = await sharp({
      create: {
        width: 64,
        height: 32,
        channels: 3,
        background: "#ff0000",
      },
    })
      .composite([
        {
          input: await sharp({
            create: {
              width: 32,
              height: 32,
              channels: 3,
              background: "#0000ff",
            },
          })
            .png()
            .toBuffer(),
          left: 32,
          top: 0,
        },
      ])
      .png()
      .toBuffer();

    const palette = await samplePaletteFromImage(image);
    expect(palette.length).toBeGreaterThanOrEqual(2);
    expect(palette.every((hex) => /^#[0-9a-f]{6}$/i.test(hex))).toBe(true);
  });

  it("composites transparent regions onto white instead of counting invisible pixels", async () => {
    // 左半不透明红、右半全透明：libvips 缩放后透明像素 RGB 归零（纯黑），
    // 不做 flatten 白底合成的话黑色会 dominate 直方图
    const width = 64;
    const height = 32;
    const raw = Buffer.alloc(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        if (x < width / 2) {
          raw[i] = 255;
          raw[i + 1] = 0;
          raw[i + 2] = 0;
          raw[i + 3] = 255;
        } // 右半保持 alpha=0
      }
    }
    const png = await sharp(raw, {
      raw: { width, height, channels: 4 },
    })
      .png()
      .toBuffer();

    const palette = await samplePaletteFromImage(png);
    expect(palette).toContain("#ff0000");
    expect(palette.map((hex) => hex.toLowerCase())).not.toContain("#000000");
  });
});
