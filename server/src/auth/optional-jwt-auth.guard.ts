import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT guard that attaches user info when token is valid,
 * but does not block requests when the token is missing or expired.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  handleRequest(err: any, user: any, info: any, context: any): any {
    if (err || info) {
      return null;
    }
    return user || null;
  }
}
