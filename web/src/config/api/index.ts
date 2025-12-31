import axios, {
  type AxiosResponse,
  type CancelTokenSource,
  type InternalAxiosRequestConfig,
} from "axios"

const AUTH_EXPIRED_EVENT = "auth-expired"
let isDispatchingAuthExpired = false

// 扩展Axios请求配置类型
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  requestId?: string
  skipAuthExpiredHandler?: boolean
}

// 定义 API 响应的数据格式
export interface ApiResponse<T = Record<string, any>> {
  success: boolean
  message?: string
  data?: T | null
}

// 创建 axios 实例
const api = axios.create({
  baseURL: "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // 依赖 HttpOnly Cookie 自动携带认证信息
})

// 请求取消令牌管理
const cancelTokenSources: Map<string, CancelTokenSource> = new Map()

// 请求拦截器 - 添加请求取消功能
api.interceptors.request.use(
  (config: CustomAxiosRequestConfig) => {
    // 生成更精确的请求ID，包含URL、方法和参数
    const params = new URLSearchParams()

    // 添加查询参数
    if (config.params) {
      Object.keys(config.params).forEach((key) => {
        const value = config.params[key]
        if (value !== undefined && value !== null) {
          params.set(key, String(value))
        }
      })
    }

    // 添加请求体数据（仅对GET请求，避免重复）
    let bodyData = ""
    if (config.method === "get" && config.data) {
      try {
        bodyData = typeof config.data === "string" ? config.data : JSON.stringify(config.data)
      } catch {
        bodyData = String(config.data)
      }
    }

    const requestId = `${config.method}_${config.url}_${params.toString()}_${bodyData}`

    // 只有完全相同的请求才取消（防止误判）
    if (cancelTokenSources.has(requestId)) {
      const source = cancelTokenSources.get(requestId)
      source?.cancel(`取消重复请求: ${requestId}`)
    }

    // 创建新的取消令牌
    const source = axios.CancelToken.source()
    config.cancelToken = source.token
    cancelTokenSources.set(requestId, source)

    config.requestId = requestId // 保存requestId到config中
    return config
  },
  (error) => {
    console.error("❌ Request Error:", error)
    return Promise.reject(error)
  },
)

// 响应拦截器 - 清理已完成请求的取消令牌
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // 请求成功完成，清理取消令牌
    const config = response.config as CustomAxiosRequestConfig
    const requestId = config.requestId
    if (requestId && cancelTokenSources.has(requestId)) {
      cancelTokenSources.delete(requestId)
    }

    // 根据你的后端返回格式调整
    // 后端返回格式：{ success: boolean, message?: string, data?: any }
    if (response.data.success !== undefined) {
      if (response.data.success) {
        return response.data as ApiResponse
      } else {
        return Promise.reject(new Error(response.data.message || "请求失败"))
      }
    }

    return response.data
  },
  (error: any) => {
    // 清理取消令牌
    if (error.config) {
      const config = error.config as CustomAxiosRequestConfig
      const requestId = config.requestId
      if (requestId && cancelTokenSources.has(requestId)) {
        cancelTokenSources.delete(requestId)
      }
    }

    // 处理取消请求 - 静默处理，不显示错误信息
    if (axios.isCancel(error)) {
      // 对于取消的请求，返回一个特殊的错误对象，让上层可以识别
      const cancelError = new Error("REQUEST_CANCELLED")
      cancelError.name = "REQUEST_CANCELLED"
      cancelError.isCancelled = true
      return Promise.reject(cancelError)
    }

    console.error("❌ Response Error:", error.response?.status, error.config?.url)

    // 统一错误处理 - 增强版：添加用户友好的提示
    let errorMessage = "操作失败，请稍后重试"

    // 处理超时错误
    if (error.code === "ECONNABORTED") {
      errorMessage = "请求超时，请检查网络连接或稍后重试"
      console.error("请求超时:", error.message)
      alert(errorMessage)

      const enhancedError = {
        ...error,
        userMessage: errorMessage,
        timestamp: new Date().toISOString(),
      }
      return Promise.reject(enhancedError)
    }

    if (error.response) {
      const status = error.response.status
      const message = error.response.data?.message || ""
      const requestConfig = error.config as CustomAxiosRequestConfig | undefined

      switch (status) {
        case 401:
          errorMessage = "登录已过期，请重新登录"
          console.error("认证失败:", message)
          // 触发统一的登录过期处理（由应用层监听）
          if (
            typeof window !== "undefined" &&
            !isDispatchingAuthExpired &&
            !requestConfig?.skipAuthExpiredHandler
          ) {
            isDispatchingAuthExpired = true
            window.dispatchEvent(
              new CustomEvent(AUTH_EXPIRED_EVENT, {
                detail: {
                  source: requestConfig?.url,
                  timestamp: Date.now(),
                },
              }),
            )
            // 允许后续新的401再次触发
            setTimeout(() => {
              isDispatchingAuthExpired = false
            }, 300)
          }
          break
        case 403:
          errorMessage = "您没有权限执行此操作"
          console.error("权限不足:", message)
          break
        case 404:
          errorMessage = "请求的资源不存在"
          console.error("资源不存在:", message)
          break
        case 422:
          errorMessage = message || "输入数据验证失败，请检查您的输入"
          console.error("验证失败:", message)
          break
        case 500:
          errorMessage = "服务器出现故障，请稍后重试"
          console.error("服务器错误:", message)
          break
        default:
          errorMessage = message || `请求失败 (状态码: ${status})`
          console.error(`错误状态码 ${status}:`, message)
      }

      // 在开发环境中显示错误详情
      if (import.meta.env.DEV) {
        console.error("错误详情:", error.response.data)
      }

      // 401 登录过期交由全局处理，其余错误给出提示
      if (status !== 401 || requestConfig?.skipAuthExpiredHandler) {
        alert(errorMessage)
      }
    } else if (error.request) {
      errorMessage = "网络连接失败，请检查网络"
      console.error("网络错误:", error.request)
      alert(errorMessage)
    } else {
      errorMessage = "请求配置错误"
      console.error("配置错误:", error.message)
      alert(errorMessage)
    }

    // 包装错误对象，添加上下文信息
    const enhancedError = {
      ...error,
      userMessage: errorMessage,
      timestamp: new Date().toISOString(),
    }

    return Promise.reject(enhancedError)
  },
)

// 手动取消请求的函数
export const cancelRequest = (requestId: string): boolean => {
  if (cancelTokenSources.has(requestId)) {
    const source = cancelTokenSources.get(requestId)
    source?.cancel(`手动取消请求: ${requestId}`)
    cancelTokenSources.delete(requestId)
    return true
  }
  return false
}

export default api
// 在 src/config/api/index.ts 文件末尾添加

// 扩展 axios 类型定义，让所有请求自动返回 ApiResponse 格式
declare module "axios" {
  export interface AxiosInstance {
    get<T = any>(url: string, config?: any): Promise<ApiResponse<T>>
    post<T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>>
    put<T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>>
    patch<T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>>
    delete<T = any>(url: string, config?: any): Promise<ApiResponse<T>>
  }
}
