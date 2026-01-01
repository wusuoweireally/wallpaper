/**
 * 获取错误消息
 * 安全地从错误对象中提取消息
 *
 * @param error - 错误对象
 * @param defaultMessage - 默认错误消息
 * @returns 错误消息字符串
 */
export function getErrorMessage(
  error: unknown,
  defaultMessage: string = "操作失败",
): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }

  return defaultMessage;
}

/**
 * 判断是否为错误对象
 *
 * @param error - 待判断的对象
 * @returns 是否为错误对象
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}
