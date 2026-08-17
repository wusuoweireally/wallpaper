/** 与 wallhaven 类似的壁纸上传硬门槛（前后端共用语义） */
export const WALLPAPER_MIN_WIDTH = 1280;
export const WALLPAPER_MIN_HEIGHT = 800;
export const WALLPAPER_MAX_BYTES = 32 * 1024 * 1024;
export const WALLPAPER_ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export function resolutionTooSmall(width: number, height: number): boolean {
  return width < WALLPAPER_MIN_WIDTH || height < WALLPAPER_MIN_HEIGHT;
}

export function resolutionRequirementMessage(): string {
  return `图片分辨率至少 ${WALLPAPER_MIN_WIDTH}×${WALLPAPER_MIN_HEIGHT}（宽≥${WALLPAPER_MIN_WIDTH} 且 高≥${WALLPAPER_MIN_HEIGHT}）`;
}
