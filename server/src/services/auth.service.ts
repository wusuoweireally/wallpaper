import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserService } from "./user.service";
import { User } from "../entities/user.entity";

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(account: string, password: string): Promise<User | null> {
    return await this.userService.validateUser(account, password);
  }

  login(user: User) {
    // tv = 凭证版本：改密后 +1，旧 token 在 JwtStrategy 校验不过即失效
    const payload = {
      username: user.username,
      sub: user.id,
      role: user.role,
      tv: user.tokenVersion ?? 0,
    };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        status: user.status,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }
}
