import api from "@/config/api";
import type { ApiResponse } from "@/config/api";

/**
 * 用户角色枚举
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

/**
 * 用户信息接口
 */
export interface User {
  id: number;
  username: string;
  email: string;
  avatarUrl: string;
  bio: string;
  status: number;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

/**
 * 登录DTO接口
 */
export interface LoginDto {
  id: number;
  password: string;
}

/**
 * 注册DTO接口
 */
export interface RegisterDto {
  id: number;
  username: string;
  password: string;
}

/**
 * 更新用户信息DTO接口
 */
export interface UpdateUserDto {
  username?: string;
  email?: string;
  bio?: string;
  password?: string;
}

/**
 * 分页响应接口
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface LoginResponse {
  user: User;
  token: string;
}

/**
 * 用户服务类
 */
class UserService {
  /**
   * 用户注册
   */
  async register(registerDto: RegisterDto) {
    try {
      const response = await api.post("/users/register", {
        id: registerDto.id,
        username: registerDto.username,
        password: registerDto.password,
      });
      return response as unknown as ApiResponse<User>;
    } catch (error) {
      console.error("注册失败:", error);
      throw error;
    }
  }

  /**
   * 用户登录
   */
  async login(loginDto: LoginDto) {
    try {
      const response = await api.post("/users/login", loginDto);
      return response as unknown as ApiResponse<LoginResponse>;
    } catch (error) {
      console.error("登录失败:", error);
      throw error;
    }
  }

  /**
   * 用户登出
   */
  async logout() {
    try {
      const response = await api.post(
        "/users/logout",
        undefined,
        { skipAuthExpiredHandler: true },
      );
      return response as unknown as ApiResponse;
    } catch (error) {
      console.error("登出失败:", error);
      throw error;
    }
  }

  /**
   * 获取当前用户信息
   */
  async getProfile() {
    try {
      const response = await api.get("/users/profile");
      return response;
    } catch (error) {
      console.error("获取用户信息失败:", error);
      throw error;
    }
  }

  /**
   * 根据ID获取用户信息
   */
  async getUserById(id: number) {
    try {
      const response = await api.get(`/users/${id}`);
      return response;
    } catch (error) {
      console.error("获取用户信息失败:", error);
      throw error;
    }
  }

  /**
   * 更新用户信息
   */
  async updateUser(id: number, updateData: UpdateUserDto) {
    try {
      const response = await api.patch(`/users/${id}`, updateData);
      return response;
    } catch (error) {
      console.error("更新用户信息失败:", error);
      throw error;
    }
  }

  /**
   * 上传用户头像
   */
  async uploadAvatar(id: number, file: File) {
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await api.post(`/users/${id}/avatar`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response as unknown as ApiResponse<{
        avatarUrl: string;
        user: User;
      }>;
    } catch (error) {
      console.error("上传头像失败:", error);
      throw error;
    }
  }

  /**
   * 获取用户点赞的壁纸列表
   */
  async getUserLikes(page: number = 1, limit: number = 20) {
    try {
      const response = await api.get("/users/likes", {
        params: { page, limit },
      });
      return response as unknown as ApiResponse<PaginatedResponse<any>>;
    } catch (error) {
      console.error("获取用户点赞列表失败:", error);
      throw error;
    }
  }

  /**
   * 获取用户收藏的壁纸列表
   */
  async getUserFavorites(page: number = 1, limit: number = 20) {
    try {
      const response = await api.get("/users/favorites", {
        params: { page, limit },
      });
      return response;
    } catch (error) {
      console.error("获取用户收藏列表失败:", error);
      throw error;
    }
  }

  /**
   * 获取用户上传的壁纸列表
   */
  async getUserWallpapers(page: number = 1, limit: number = 20) {
    try {
      const response = await api.get("/users/wallpapers", {
        params: { page, limit },
      });
      return response;
    } catch (error) {
      console.error("获取用户上传壁纸列表失败:", error);
      throw error;
    }
  }

  /**
   * 获取用户浏览记录
   */
  async getUserViewHistory(page: number = 1, limit: number = 20) {
    try {
      const response = await api.get("/users/view-history", {
        params: { page, limit },
      });
      return response;
    } catch (error) {
      console.error("获取用户浏览记录失败:", error);
      throw error;
    }
  }
}

// 导出单例实例
export const userService = new UserService();

export default userService;
