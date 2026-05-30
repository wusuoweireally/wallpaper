import { createParamDecorator, ExecutionContext, ForbiddenException } from "@nestjs/common";
import { isAdminRole } from "../entities/user.entity";

/**
 * 资源所有权检查装饰器。
 *
 * 检查当前登录用户是否拥有目标资源的所有权（如 uploaderId === userId），
 * 管理员（ADMIN/SUPER_ADMIN）自动放行。
 *
 * 用法：
 *   @CheckOwnership('uploaderId')
 *   async update(@Param('id') id: number, @CurrentUser() user: CurrentUserType) {
 *     // 已通过所有权检查，直接执行业务逻辑
 *   }
 */
export const CheckOwnership = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

/**
 * 在 Service/Controller 中复用：检查当前用户是否可操作目标资源。
 * 替代手写的 `resource.uploaderId !== currentUser.userId && !isAdminRole(...)` 模式。
 */
export function verifyOwnership(
  resourceOwnerId: number,
  currentUser: { userId: number; role?: string },
  action = "操作此资源",
): void {
  if (resourceOwnerId !== currentUser.userId && !isAdminRole(currentUser.role as any)) {
    throw new ForbiddenException(`无权${action}`);
  }
}
