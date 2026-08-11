import { ExecutionContext, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthGuard } from "@nestjs/passport";
import type { Request, Response } from "express";
import { getSafeFrontendUrl } from "../utils/frontend-url";

@Injectable()
export class GitHubAuthGuard extends AuthGuard("github") {
  private readonly logger = new Logger(GitHubAuthGuard.name);

  constructor(private readonly config: ConfigService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return (await super.canActivate(context)) as boolean;
    } catch (error: unknown) {
      const request = context.switchToHttp().getRequest<Request>();
      const err = error as Error & {
        status?: number;
        oauthError?: string;
        message?: string;
      };
      // 仅打服务端日志，不把内部细节回传给前端
      this.logger.error(
        `GitHub OAuth 失败 path=${request.path} query=${JSON.stringify({
          error: request.query?.error,
          error_description: request.query?.error_description,
          hasCode: Boolean(request.query?.code),
          hasState: Boolean(request.query?.state),
        })} message=${err?.message ?? String(error)} status=${err?.status ?? ""} oauthError=${err?.oauthError ?? ""}`,
        err instanceof Error ? err.stack : undefined,
      );

      const response = context.switchToHttp().getResponse<Response>();
      const message = encodeURIComponent("GitHub 登录失败，请重试");
      response.redirect(
        `${getSafeFrontendUrl(this.config)}/auth/github/failure?error=${message}`,
      );
      return true;
    }
  }
}
