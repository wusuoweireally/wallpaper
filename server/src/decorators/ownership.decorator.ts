import { ForbiddenException } from "@nestjs/common";
import { isAdminRole, UserRole } from "../entities/user.entity";

/**
 * 在 Service/Controller 中复用：检查当前用户是否可操作目标资源。
 * 替代手写的 `resource.uploaderId !== currentUser.userId && !isAdminRole(...)` 模式。
 */
export function verifyOwnership(
  resourceOwnerId: number,
  currentUser: { userId: number; role?: UserRole },
  action = "操作此资源",
): void {
  if (
    resourceOwnerId !== currentUser.userId &&
    !isAdminRole(currentUser.role)
  ) {
    throw new ForbiddenException(`无权${action}`);
  }
}
