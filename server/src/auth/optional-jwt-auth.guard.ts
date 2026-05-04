import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * Optional JWT guard that attaches user info when token is valid,
 * but does not block requests when the token is missing or expired.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleRequest(_err: any, user: any): any {
    // Silently return null if no user (missing/invalid token)
    return user || null;
  }
}
