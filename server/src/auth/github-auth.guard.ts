import { ExecutionContext, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthGuard } from "@nestjs/passport";
import type { Response } from "express";
import { getSafeFrontendUrl } from "../utils/frontend-url";

@Injectable()
export class GitHubAuthGuard extends AuthGuard("github") {
  constructor(private readonly config: ConfigService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return (await super.canActivate(context)) as boolean;
    } catch {
      const response = context.switchToHttp().getResponse<Response>();
      const message = encodeURIComponent("GitHub 登录失败，请重试");
      response.redirect(
        `${getSafeFrontendUrl(this.config)}/auth/github/failure?error=${message}`,
      );
      return true;
    }
  }
}
