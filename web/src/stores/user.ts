import { defineStore } from "pinia"
import { ref, computed } from "vue"
import userService, {
  type User,
  type LoginDto,
  type RegisterDto,
  type UpdateUserDto,
  type LoginResponse,
} from "@/services/user"
import type { Wallpaper } from "@/services/wallpaper"
import type { ApiResponse } from "@/config/api"

type ServiceError = Error & { response?: { data?: { message?: string } }; message?: string }

// ==================== localStorage 工具函数 ====================
// 注意：认证 token 通过 HttpOnly Cookie 自动处理，前端只需保存用户信息

const STORAGE_KEY = "currentUser"

/**
 * 从 localStorage 读取用户信息
 */
const getUserFromStorage = (): User | null => {
  try {
    const savedUser = localStorage.getItem(STORAGE_KEY)
    if (!savedUser) return null
    return JSON.parse(savedUser) as User
  } catch (e) {
    console.warn("读取用户信息失败:", e)
    return null
  }
}

/**
 * 保存用户信息到 localStorage
 */
const saveUserToStorage = (userData: User): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
  } catch (e) {
    console.warn("保存用户信息失败:", e)
  }
}

/**
 * 从 localStorage 清除用户信息
 */
const clearUserFromStorage = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) {
    console.warn("清除用户信息失败:", e)
  }
}

// ==================== Store 定义 ====================

export const useUserStore = defineStore("user", () => {
  // ==================== 状态 ====================
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 用户统计数据
  const userStats = ref({
    uploads: 0,
    favorites: 0,
    likes: 0,
    likesReceived: 0,
  })

  // 缓存数据
  const cache = ref<Record<string, ApiResponse<unknown>>>({})

  // ==================== 计算属性 ====================
  const isLoggedIn = computed(() => !!user.value)

  const currentUser = computed(() => user.value)

  const userAvatar = computed(() => {
    // 如果没有头像，或者头像就是默认头像，返回默认头像
    if (!user.value?.avatarUrl || user.value?.avatarUrl === "defaultAvatar.png" || user.value?.avatarUrl === "defaultAvatar.webp")
      return "/uploads/profile-pictures/defaultAvatar.png"
    // 如果是完整的 HTTP(S) URL，直接返回
    if (user.value.avatarUrl.startsWith("http")) return user.value.avatarUrl
    // 如果已经是完整路径（以 /uploads/ 开头），直接返回
    if (user.value.avatarUrl.startsWith("/uploads/")) return user.value.avatarUrl
    // 否则拼接相对路径
    return `/uploads/profile-pictures/${user.value.avatarUrl}`
  })

  // ==================== 用户状态管理 ====================

  /**
   * 设置用户信息
   */
  const setUser = (userData: User) => {
    user.value = userData
    saveUserToStorage(userData)
  }

  /**
   * 清除用户信息
   */
  const clearUser = () => {
    user.value = null
    error.value = null
    clearUserFromStorage()
  }

  /**
   * 设置错误信息
   */
  const setError = (errorMessage: string) => {
    error.value = errorMessage
  }

  /**
   * 清除错误信息
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * 统一错误处理
   */
  const handleError = (err: ServiceError, defaultMessage: string) => {
    const errorMessage = err.response?.data?.message || err.message || defaultMessage
    setError(errorMessage)
    throw new Error(errorMessage)
  }

  // ==================== 认证相关方法 ====================

  /**
   * 用户登录
   * Cookie 由后端自动设置，前端只需保存用户信息
   */
  const login = async (loginData: LoginDto) => {
    try {
      loading.value = true
      clearError()

      const response = await userService.login(loginData)

      if (response.success && response.data) {
        const { user: loginUser } = response.data as LoginResponse
        // Cookie 由后端自动设置，无需前端处理 token
        setUser(loginUser)
        return response
      } else {
        throw new Error(response.message || "登录失败")
      }
    } catch (err: unknown) {
      return handleError(err as ServiceError, "登录失败")
    } finally {
      loading.value = false
    }
  }

  /**
   * 用户注册
   */
  const register = async (payload: RegisterDto) => {
    try {
      loading.value = true
      clearError()

      const response = await userService.register(payload)

      if (response.success && response.data) {
        return response
      } else {
        throw new Error(response.message || "注册失败")
      }
    } catch (err: unknown) {
      return handleError(err as ServiceError, "注册失败")
    } finally {
      loading.value = false
    }
  }

  /**
   * 用户登出
   * Cookie 由后端清除，前端只需清除用户信息
   */
  const logout = async () => {
    try {
      loading.value = true
      await userService.logout()
    } catch (err) {
      console.warn("登出请求失败:", err)
    } finally {
      // 无论登出请求是否成功，都清除本地用户信息
      clearUser()
      loading.value = false
    }
  }

  /**
   * 初始化用户认证状态（应用启动时调用）
   * Cookie 会自动随请求发送，只需从 localStorage 恢复用户信息并验证
   */
  const initializeAuth = async () => {
    // 从 localStorage 恢复用户信息
    const savedUser = getUserFromStorage()

    if (savedUser) {
      user.value = savedUser
    }

    // 始终尝试用 Cookie 验证登录态（即使 localStorage 为空）
    try {
      await fetchCurrentUser()
    } catch (error: unknown) {
      // 只有在 localStorage 有数据时才需要清除（说明 cookie 过期了）
      if (savedUser) {
        console.warn("用户认证验证失败，清除本地登录态:", error)
        clearUser()
      }
    }
  }

  // ==================== 用户信息相关方法 ====================

  /**
   * 获取当前用户信息（从服务器验证）
   */
  const fetchCurrentUser = async () => {
    try {
      loading.value = true
      clearError()

      const response = await userService.getProfile()

      if (response.success && response.data) {
        setUser(response.data)
        return response.data
      } else {
        console.warn("服务器返回成功但没有用户数据")
        return null
      }
    } catch (err: unknown) {
      const serviceErr = err as ServiceError
      const status = serviceErr.response?.status
      // 只有 401（未授权）才清除用户状态，其他错误（如网络问题）保留登录态
      if (status === 401) {
        clearUser()
      }
      const errorMessage = serviceErr.response?.data?.message || serviceErr.message || "获取用户信息失败"
      if (status !== 401) {
        setError(errorMessage)
      }
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新用户信息
   */
  const updateUserInfo = async (updateData: UpdateUserDto) => {
    try {
      loading.value = true
      clearError()

      const currentUser = user.value
      if (!currentUser) {
        throw new Error("用户未登录")
      }

      const response = await userService.updateUser(currentUser.id, updateData)

      if (response.success && response.data) {
        setUser(response.data)
        return response
      } else {
        throw new Error(response.message || "更新失败")
      }
    } catch (err: unknown) {
      return handleError(err as ServiceError, "更新用户信息失败")
    } finally {
      loading.value = false
    }
  }

  /** 修改密码：PATCH /users/password */
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      loading.value = true
      clearError()
      if (!user.value) {
        throw new Error("用户未登录")
      }
      const response = await userService.changePassword({ currentPassword, newPassword })
      if (!response.success) {
        throw new Error(response.message || "密码修改失败")
      }
      return response
    } catch (err: unknown) {
      return handleError(err as ServiceError, "密码修改失败")
    } finally {
      loading.value = false
    }
  }

  /**
   * 上传用户头像
   */
  const uploadAvatar = async (file: File) => {
    try {
      loading.value = true
      clearError()

      const currentUser = user.value
      if (!currentUser) {
        throw new Error("用户未登录")
      }

      const response = await userService.uploadAvatar(currentUser.id, file)

      if (response.success && response.data) {
        // 更新用户信息中的头像URL
        if (response.data.user) {
          setUser(response.data.user)
        } else if (response.data.avatarUrl && user.value) {
          // 如果只返回头像URL，更新当前用户的头像
          setUser({ ...user.value, avatarUrl: response.data.avatarUrl })
        }
        return response
      } else {
        throw new Error(response.message || "上传头像失败")
      }
    } catch (err: unknown) {
      return handleError(err as ServiceError, "上传头像失败")
    } finally {
      loading.value = false
    }
  }

  // ==================== 用户数据相关方法 ====================

  /**
   * 获取用户统计数据
   */
  const fetchUserStats = async () => {
    try {
      loading.value = true
      clearError()

      if (!user.value) {
        throw new Error("用户未登录")
      }

      const [uploadsResp, favoritesResp, likesResp] = await Promise.all([
        userService.getUserWallpapers(1, 100),
        userService.getUserFavorites(1, 1),
        userService.getUserLikes(1, 1),
      ])

      const uploadsTotal = uploadsResp?.pagination?.total ?? 0
      const favoritesTotal = favoritesResp?.pagination?.total ?? 0
      const likesTotal = likesResp?.pagination?.total ?? 0
      const uploadsList = Array.isArray(uploadsResp?.data) ? uploadsResp.data : []
      const likesReceived = uploadsList.reduce(
        (sum: number, wallpaper: Wallpaper) => sum + (wallpaper?.likeCount || 0),
        0,
      )

      userStats.value = {
        uploads: uploadsTotal,
        favorites: favoritesTotal,
        likes: likesTotal,
        likesReceived,
      }

      return userStats.value
    } catch (err: unknown) {
      return handleError(err as ServiceError, "获取用户统计数据失败")
    } finally {
      loading.value = false
    }
  }

  /**
   * 统一获取用户壁纸列表
   */
  const fetchUserWallpapers = async (
    type: "uploads" | "favorites" | "likes",
    page: number = 1,
    limit: number = 20,
    search: string = "",
  ) => {
    try {
      loading.value = true
      clearError()

      // 生成缓存键
      const cacheKey = `${type}_${page}_${limit}_${search}`

      // 检查缓存
      if (cache.value[cacheKey]) {
        return cache.value[cacheKey]
      }

      let response
      switch (type) {
        case "uploads":
          response = await userService.getUserWallpapers(page, limit)
          break
        case "favorites":
          response = await userService.getUserFavorites(page, limit)
          break
        case "likes":
          response = await userService.getUserLikes(page, limit)
          break
        default:
          throw new Error("不支持的壁纸类型")
      }

      // 缓存结果
      cache.value[cacheKey] = response

      return response
    } catch (err: unknown) {
      return handleError(err as ServiceError, `获取用户${getTypeName(type)}列表失败`)
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取类型名称
   */
  const getTypeName = (type: string) => {
    const typeMap = {
      uploads: "上传",
      favorites: "收藏",
      likes: "点赞",
    }
    return typeMap[type as keyof typeof typeMap] || type
  }

  /**
   * 获取用户点赞的壁纸列表
   */
  const getUserLikes = async (page: number = 1, limit: number = 20) => {
    return await fetchUserWallpapers("likes", page, limit)
  }

  /**
   * 获取用户收藏的壁纸列表
   */
  const getUserFavorites = async (page: number = 1, limit: number = 20) => {
    return await fetchUserWallpapers("favorites", page, limit)
  }

  /**
   * 获取用户上传的壁纸列表
   */
  const getUserWallpapers = async (page: number = 1, limit: number = 20) => {
    return await fetchUserWallpapers("uploads", page, limit)
  }

  /**
   * 获取用户浏览记录
   */
  const getUserViewHistory = async (page: number = 1, limit: number = 20) => {
    try {
      loading.value = true
      clearError()
      return await userService.getUserViewHistory(page, limit)
    } catch (err: unknown) {
      return handleError(err as ServiceError, "获取用户浏览记录失败")
    } finally {
      loading.value = false
    }
  }

  /**
   * 清除缓存
   */
  const clearCache = (type?: string) => {
    if (type) {
      // 清除特定类型的缓存
      Object.keys(cache.value).forEach((key) => {
        if (key.startsWith(type)) {
          delete cache.value[key]
        }
      })
    } else {
      // 清除所有缓存
      cache.value = {}
    }
  }

  // ==================== 缓存相关方法 ====================

  /**
   * 从 localStorage 恢复用户信息（不验证服务器）
   */
  const restoreFromStorage = () => {
    const savedUser = getUserFromStorage()
    if (savedUser) {
      user.value = savedUser
      return savedUser
    }
    return null
  }

  // ==================== 导出 ====================
  return {
    // 状态
    user,
    loading,
    error,
    userStats,

    // 计算属性
    isLoggedIn,
    currentUser,
    userAvatar,

    // 用户状态管理
    setUser,
    clearUser,
    setError,
    clearError,

    // 认证相关
    login,
    register,
    logout,
    initializeAuth,

    // 用户信息相关
    changePassword,
    fetchCurrentUser,
    updateUserInfo,
    uploadAvatar,

    // 用户数据相关
    fetchUserStats,
    fetchUserWallpapers,
    getUserLikes,
    getUserFavorites,
    getUserWallpapers,
    getUserViewHistory,

    // 缓存相关
    restoreFromStorage,
    clearCache,
  }
})

// 导出类型，方便外部使用
export type { User, LoginDto, RegisterDto }
