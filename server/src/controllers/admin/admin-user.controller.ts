import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { UserService } from "../../services/user.service";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { Roles } from "../../decorators/roles.decorator";
import { UserRole } from "../../entities/user.entity";
import {
  AdminCreateUserDto,
  AdminUpdateUserDto,
  AdminUserQueryDto,
  UpdateUserStatusDto,
} from "../../dto/admin.dto";
import { RolesGuard } from "../../guards/roles.guard";
import { CurrentUser } from "../../decorators/current-user.decorator";
import type { CurrentUserType } from "../../decorators/current-user.decorator";
import { buildPaginationMeta } from "../../common/pagination";
import { omitPasswordHash } from "../../utils/sanitize";

@Controller("admin/users")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async list(@Query() query: AdminUserQueryDto) {
    const result = await this.userService.adminQueryUsers(query);

    const users = result.data.map(omitPasswordHash);

    return {
      success: true,
      data: users,
      pagination: buildPaginationMeta(result),
    };
  }

  @Get(":id")
  async detail(@Param("id", ParseIntPipe) id: number) {
    const user = await this.userService.findById(id);
    const rest = omitPasswordHash(user);
    return {
      success: true,
      data: rest,
    };
  }

  @Post()
  async create(
    @Body() dto: AdminCreateUserDto,
    @CurrentUser() actor: CurrentUserType,
  ) {
    const user = await this.userService.create(
      dto,
      dto.role ?? UserRole.USER,
      actor,
    );
    const rest = omitPasswordHash(user);
    return {
      success: true,
      message: "创建用户成功",
      data: rest,
    };
  }

  @Patch(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: AdminUpdateUserDto,
    @CurrentUser() actor: CurrentUserType,
  ) {
    const user = await this.userService.adminUpdateUser(id, dto, actor);
    const rest = omitPasswordHash(user);
    return {
      success: true,
      message: "更新用户信息成功",
      data: rest,
    };
  }

  @Patch(":id/status")
  async updateStatus(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() actor: CurrentUserType,
  ) {
    const user = await this.userService.setStatus(id, dto.status, actor);
    const rest = omitPasswordHash(user);
    return {
      success: true,
      message: dto.status === 1 ? "用户已启用" : "用户已禁用",
      data: rest,
    };
  }

  @Delete(":id")
  async remove(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() actor: CurrentUserType,
  ) {
    await this.userService.remove(id, actor);
    return {
      success: true,
      message: "用户已注销，历史内容已匿名保留",
    };
  }
}
