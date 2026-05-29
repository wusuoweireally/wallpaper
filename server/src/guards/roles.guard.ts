import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { UserRole, ROLE_RANK } from "../entities/user.entity";
import { CurrentUserType } from "../decorators/current-user.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: CurrentUserType;
    }>();
    const user = request.user;

    // 未认证 → 401（区别于权限不足的 403），便于前端精准处理
    if (!user || !user.role) {
      throw new UnauthorizedException("登录状态无效或已过期");
    }

    // 角色层级判断：用户权重 >= 所需角色的最低权重即可通过
    // 例如 SUPER_ADMIN(2) 自动满足 @Roles(ADMIN)(1) 的要求
    const minRequiredRank = Math.min(
      ...requiredRoles.map(
        (role) => ROLE_RANK[role] ?? Number.MAX_SAFE_INTEGER,
      ),
    );

    if ((ROLE_RANK[user.role] ?? -1) < minRequiredRank) {
      throw new ForbiddenException("当前账号无权执行该操作");
    }

    return true;
  }
}
