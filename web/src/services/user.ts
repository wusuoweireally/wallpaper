import api from "@/config/api"
import type { ApiResponse } from "@/config/api"
import type { Wallpaper } from "@/services/wallpaper"

/**
 * 用户角色枚举
 */
export const UserRole = {
  USER: "user",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin",
} as const

export type UserRole = (typeof UserRole)[keyof typeof UserRole]

/**
 * 用户信息接口
 */
export type User = {
  id: number
  username: string
  email: string
  avatarUrl: string
  bio: string
  status: number
  role: UserRole
  createdAt: string
  updatedAt: string
}

/**
 * 登录DTO接口
 */
export interface LoginDto {
  account: string
  password: string
}

/**
 * 注册DTO接口
 */
export interface RegisterDto {
  username: string
  password: string
  email?: string
}

/**
 * 更新用户信息DTO接口
 */
export interface UpdateUserDto {
  username?: string
  email?: string
  bio?: string
}

/** 修改密码：对齐 PATCH /users/password */
export interface ChangePasswordDto {
  currentPassword: string
  newPassword: string
}

/** 登录成功体：token 在 HttpOnly Cookie，响应里只有 user */
export interface LoginResponse {
  user: User
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
        username: registerDto.username,
        password: registerDto.password,
        email: registerDto.email,
      })
      return response as unknown as ApiResponse<User>
    } catch (error) {
      console.error("注册失败:", error)
      throw error
    }
  }

  /**
   * 用户登录
   */
  async login(loginDto: LoginDto) {
    try {
      const response = await api.post("/users/login", loginDto, {
        skipAuthExpiredHandler: true,
      } as import("axios").AxiosRequestConfig)
      return response as unknown as ApiResponse<LoginResponse>
    } catch (error) {
      console.error("登录失败:", error)
      throw error
    }
  }

  /**
   * 用户登出
   */
  async logout() {
    try {
      const config = { skipAuthExpiredHandler: true }
      const response = await api.post(
        "/users/logout",
        undefined,
        config as import("axios").AxiosRequestConfig,
      )
      return response as unknown as ApiResponse
    } catch (error) {
      console.error("登出失败:", error)
      throw error
    }
  }

  /**
   * 获取当前用户信息
   */
  async getProfile(): Promise<ApiResponse<User>> {
    try {
      const response = await api.get("/users/profile")
      return response as ApiResponse<User>
    } catch (error) {
      console.error("获取用户信息失败:", error)
      throw error
    }
  }

  /**
   * 根据ID获取用户信息
   */
  async getUserById(id: number): Promise<ApiResponse<User>> {
    try {
      const response = await api.get(`/users/${id}`)
      return response as ApiResponse<User>
    } catch (error) {
      console.error("获取用户信息失败:", error)
      throw error
    }
  }

  /**
   * 更新用户信息（不含密码）
   */
  async updateUser(id: number, updateData: UpdateUserDto): Promise<ApiResponse<User>> {
    try {
      const response = await api.patch(`/users/${id}`, updateData)
      return response as ApiResponse<User>
    } catch (error) {
      console.error("更新用户信息失败:", error)
      throw error
    }
  }

  /**
   * 修改当前登录用户密码
   */
  async changePassword(dto: ChangePasswordDto): Promise<ApiResponse> {
    try {
      return (await api.patch("/users/password", dto)) as ApiResponse
    } catch (error) {
      console.error("修改密码失败:", error)
      throw error
    }
  }

  /**
   * 上传用户头像
   */
  async uploadAvatar(id: number, file: File) {
    try {
      const formData = new FormData()
      formData.append("avatar", file)

      const response = await api.post(`/users/${id}/avatar`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      return response as unknown as ApiResponse<{
        avatarUrl: string
        user: User
      }>
    } catch (error) {
      console.error("上传头像失败:", error)
      throw error
    }
  }

  /**
   * 获取用户点赞的壁纸列表
   */
  /** 后端信封：{ success, data: Wallpaper[], pagination } */
  async getUserLikes(page: number = 1, limit: number = 20) {
    try {
      return (await api.get<Wallpaper[]>("/users/likes", {
        params: { page, limit },
      })) as ApiResponse<Wallpaper[]>
    } catch (error) {
      console.error("获取用户点赞列表失败:", error)
      throw error
    }
  }

  /**
   * 获取用户收藏的壁纸列表
   */
  async getUserFavorites(
    page: number = 1,
    limit: number = 20,
  ): Promise<ApiResponse<Wallpaper[]>> {
    try {
      return (await api.get<Wallpaper[]>("/users/favorites", {
        params: { page, limit },
      })) as ApiResponse<Wallpaper[]>
    } catch (error) {
      console.error("获取用户收藏列表失败:", error)
      throw error
    }
  }

  /**
   * 获取用户上传的壁纸列表
   */
  async getUserWallpapers(
    page: number = 1,
    limit: number = 20,
  ): Promise<ApiResponse<Wallpaper[]>> {
    try {
      return (await api.get<Wallpaper[]>("/users/wallpapers", {
        params: { page, limit },
      })) as ApiResponse<Wallpaper[]>
    } catch (error) {
      console.error("获取用户上传壁纸列表失败:", error)
      throw error
    }
  }

  /**
   * 获取用户浏览记录
   */
  async getUserViewHistory(page: number = 1, limit: number = 20) {
    try {
      const response = await api.get("/users/view-history", {
        params: { page, limit },
      })
      return response
    } catch (error) {
      console.error("获取用户浏览记录失败:", error)
      throw error
    }
  }
}

// 导出单例实例
export const userService = new UserService()

export default userService
