/**
 * 批量种子标签：补全首页标签云 / 标签页数据
 * 用法（在 server 目录）:
 *   pnpm exec ts-node -r tsconfig-paths/register scripts/seed-tags.ts
 *
 * 已存在同 slug 的标签：仅补 usage_count（取较大值），不改名。
 */
import "reflect-metadata";
import { AppDataSource } from "../src/config/data-source";
import { Tag } from "../src/entities/tag.entity";

type SeedTag = { name: string; usage: number };

/** slug 与 TagService.generateSlug 一致 */
const toSlug = (name: string) => name.trim().toLowerCase().replace(/\s+/g, "-");

/**
 * 壁纸站常见标签（中英混合），usage 人为拉开档位方便标签云字号差异
 */
const SEED_TAGS: SeedTag[] = [
  // 风格 / 氛围
  { name: "nature", usage: 320 },
  { name: "风景", usage: 280 },
  { name: "anime", usage: 300 },
  { name: "动漫", usage: 290 },
  { name: "abstract", usage: 180 },
  { name: "抽象", usage: 120 },
  { name: "minimal", usage: 160 },
  { name: "极简", usage: 110 },
  { name: "dark", usage: 240 },
  { name: "暗色", usage: 150 },
  { name: "black background", usage: 200 },
  { name: "dark background", usage: 170 },
  { name: "city", usage: 190 },
  { name: "城市", usage: 160 },
  { name: "space", usage: 210 },
  { name: "星空", usage: 185 },
  { name: "宇宙", usage: 140 },
  { name: "fantasy art", usage: 175 },
  { name: "奇幻", usage: 130 },
  { name: "illustration", usage: 155 },
  { name: "插画", usage: 145 },
  { name: "pixel art", usage: 95 },
  { name: "vector art", usage: 80 },
  { name: "digital art", usage: 165 },
  { name: "油画", usage: 70 },
  { name: "oil painting", usage: 65 },
  { name: "watercolor", usage: 60 },
  { name: "赛博朋克", usage: 125 },
  { name: "cyberpunk", usage: 135 },
  { name: "复古", usage: 90 },
  { name: "retro", usage: 85 },
  { name: "neon", usage: 100 },
  { name: "霓虹", usage: 75 },

  // 场景
  { name: "mountain", usage: 140 },
  { name: "山脉", usage: 100 },
  { name: "forest", usage: 150 },
  { name: "森林", usage: 120 },
  { name: "ocean", usage: 145 },
  { name: "海", usage: 130 },
  { name: "beach", usage: 95 },
  { name: "sunset", usage: 170 },
  { name: "日落", usage: 125 },
  { name: "sunrise", usage: 90 },
  { name: "night", usage: 160 },
  { name: "夜景", usage: 135 },
  { name: "rain", usage: 85 },
  { name: "雨", usage: 70 },
  { name: "snow", usage: 80 },
  { name: "雪", usage: 75 },
  { name: "autumn", usage: 70 },
  { name: "秋天", usage: 65 },
  { name: "flowers", usage: 100 },
  { name: "花", usage: 90 },
  { name: "architecture", usage: 110 },
  { name: "建筑", usage: 95 },
  { name: "interior", usage: 55 },
  { name: "cars", usage: 105 },
  { name: "汽车", usage: 80 },
  { name: "飞机", usage: 40 },
  { name: "动物", usage: 115 },
  { name: "animals", usage: 100 },
  { name: "猫", usage: 130 },
  { name: "狗", usage: 90 },
  { name: "鸟", usage: 50 },

  // 人物 / 作品向
  { name: "人物", usage: 200 },
  { name: "女人", usage: 180 },
  { name: "男人", usage: 90 },
  { name: "girl", usage: 170 },
  { name: "portrait", usage: 120 },
  { name: "manga", usage: 140 },
  { name: "漫画", usage: 110 },
  { name: "game", usage: 150 },
  { name: "游戏", usage: 145 },
  { name: "电影", usage: 100 },
  { name: "movie", usage: 95 },
  { name: "Japan", usage: 160 },
  { name: "日本", usage: 140 },
  { name: "中国风", usage: 85 },
  { name: "landscape", usage: 200 },
  { name: "4K", usage: 220 },
  { name: "8K", usage: 90 },
  { name: "超清", usage: 100 },
  { name: "高清", usage: 250 },
  { name: "ultrawide", usage: 70 },
  { name: "超宽屏", usage: 55 },
  { name: "desktop", usage: 130 },
  { name: "手机壁纸", usage: 110 },
  { name: "竖屏", usage: 80 },
  { name: "横屏", usage: 150 },

  // 颜色
  { name: "blue", usage: 120 },
  { name: "蓝", usage: 100 },
  { name: "red", usage: 90 },
  { name: "绿", usage: 95 },
  { name: "green", usage: 110 },
  { name: "purple", usage: 85 },
  { name: "紫", usage: 75 },
  { name: "pink", usage: 100 },
  { name: "粉", usage: 80 },
  { name: "orange", usage: 60 },
  { name: "金", usage: 50 },
  { name: "黑白", usage: 90 },
  { name: "monochrome", usage: 70 },

  // 更多内容向（丰富标签云）
  { name: "Studio Ghibli", usage: 95 },
  { name: "吉卜力", usage: 80 },
  { name: "原神", usage: 115 },
  { name: "Genshin", usage: 90 },
  { name: "One Piece", usage: 75 },
  { name: "海贼王", usage: 70 },
  { name: "柯南", usage: 65 },
  { name: "名侦探柯南", usage: 50 },
  { name: "赛博", usage: 55 },
  { name: "机甲", usage: 60 },
  { name: "mecha", usage: 55 },
  { name: "科幻", usage: 125 },
  { name: "sci-fi", usage: 115 },
  { name: "魔法", usage: 70 },
  { name: "武士", usage: 45 },
  { name: "武士刀", usage: 35 },
  { name: "和风", usage: 75 },
  { name: "樱花", usage: 105 },
  { name: "cherry blossom", usage: 85 },
  { name: "月球", usage: 70 },
  { name: "moon", usage: 95 },
  { name: "云", usage: 80 },
  { name: "clouds", usage: 90 },
  { name: "沙漠", usage: 40 },
  { name: "瀑布", usage: 75 },
  { name: "waterfall", usage: 70 },
  { name: "湖", usage: 60 },
  { name: "公路", usage: 55 },
  { name: "road", usage: 50 },
  { name: "桥", usage: 40 },
  { name: "天空", usage: 140 },
  { name: "sky", usage: 130 },
  { name: "云海", usage: 55 },
  { name: "aurora", usage: 65 },
  { name: "极光", usage: 70 },
  { name: "银河", usage: 85 },
  { name: "galaxy", usage: 90 },
  { name: "technology", usage: 70 },
  { name: "科技", usage: 80 },
  { name: "coding", usage: 45 },
  { name: "Linux", usage: 50 },
  { name: "wallpaper", usage: 60 },
  { name: "艺术", usage: 100 },
  { name: "art", usage: 110 },
  { name: "concept art", usage: 75 },
  { name: "概念艺术", usage: 55 },
  { name: "3D", usage: 95 },
  { name: "render", usage: 70 },
  { name: "写真", usage: 85 },
  { name: "photography", usage: 100 },
  { name: "街景", usage: 65 },
  { name: "street", usage: 70 },
  { name: "雨夜", usage: 55 },
  { name: "lonely", usage: 40 },
  { name: "治愈", usage: 90 },
  { name: "清新", usage: 85 },
  { name: "唯美", usage: 95 },
  { name: "梦幻", usage: 80 },
  { name: "dreamy", usage: 70 },
  { name: "可爱", usage: 75 },
  { name: "cute", usage: 80 },
  { name: "酷", usage: 50 },
  { name: "cool", usage: 65 },
];

async function main() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Tag);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const item of SEED_TAGS) {
    const name = item.name.trim();
    if (!name || name.length > 50) {
      skipped++;
      continue;
    }
    const slug = toSlug(name);
    const existing = await repo.findOne({ where: { slug } });

    if (existing) {
      // 已有标签：usage 取较大值，让云看起来有热度
      if ((existing.usageCount ?? 0) < item.usage) {
        await repo.update({ id: existing.id }, { usageCount: item.usage });
        updated++;
      } else {
        skipped++;
      }
      continue;
    }

    await repo.insert({
      name,
      slug,
      usageCount: item.usage,
    });
    inserted++;
  }

  const total = await repo.count();
  console.log(
    `[seed-tags] done: inserted=${inserted}, usage_bumped=${updated}, skipped=${skipped}, total_tags=${total}`,
  );

  await AppDataSource.destroy();
}

main().catch(async (err) => {
  console.error("[seed-tags] failed:", err);
  if (AppDataSource.isInitialized) await AppDataSource.destroy();
  process.exit(1);
});
