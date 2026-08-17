import { createRouter, createWebHistory } from "vue-router"
import type { RouteRecordRaw } from "vue-router"
import "./types" // 导入路由类型扩展
import { useUserStore } from "@/stores/user"
import { useGlobalToast } from "@/composables/useToast"
import { storeToRefs } from "pinia"

// 路由配置
const routes: RouteRecordRaw[] = [
  // 首页
  {
    path: "/",
    name: "Home",
    component: () => import("@/views/Index.vue"),
    meta: {
      title: "Wallbay - 首页",
      requiresAuth: false,
      showNavBar: true,
    },
  },

  // 壁纸浏览路由 - 统一使用 wallpaperViews 组件
  {
    path: "/wallpapers",
    name: "Wallpapers",
    component: () => import("@/views/wallpaper/wallpaperViews.vue"),
    meta: {
      title: "壁纸列表",
      requiresAuth: false,
      showNavBar: true,
    },
  },
  // 旧路径重定向到统一路由并携带查询参数
  {
    path: "/latest",
    redirect: () => ({ path: "/wallpapers", query: { sort: "latest" } }),
  },
  {
    path: "/top",
    redirect: () => ({ path: "/wallpapers", query: { sort: "popular" } }),
  },
  {
    path: "/hot",
    redirect: () => ({ path: "/wallpapers", query: { sort: "popular" } }),
  },
  {
    path: "/random",
    redirect: () => ({ path: "/wallpapers", query: { sort: "random" } }),
  },
  {
    path: "/wallpaper/:id",
    name: "WallpaperDetail",
    component: () => import("@/views/wallpaper/wallpaperDetail.vue"),
    meta: {
      title: "壁纸详情",
      requiresAuth: false,
      showNavBar: true,
    },
  },
  {
    path: "/upload",
    name: "WallpaperUpload",
    component: () => import("@/views/wallpaper/uploads.vue"),
    meta: {
      title: "上传壁纸",
      requiresAuth: true,
      showNavBar: true,
      hideFooter: true,
    },
  },

  // 用户相关路由
  {
    path: "/auth",
    name: "Auth",
    redirect: "/auth/login",
    children: [
      {
        path: "login",
        name: "Login",
        component: () => import("@/views/user/Auth.vue"),
        meta: {
          title: "用户登录",
          requiresAuth: false,
          hideForAuth: true, // 已登录用户隐藏
          showNavBar: false, // 登录页面不显示导航栏
        },
      },
      {
        path: "register",
        name: "Register",
        component: () => import("@/views/user/Auth.vue"),
        meta: {
          title: "用户注册",
          requiresAuth: false,
          hideForAuth: true,
          showNavBar: false, // 注册页面不显示导航栏
        },
      },
    ],
  },

  // GitHub OAuth 回调路由
  {
    path: "/auth/github/success",
    name: "GitHubSuccess",
    component: () => import("@/views/user/GitHubCallback.vue"),
    meta: {
      title: "GitHub登录成功",
      requiresAuth: false,
      showNavBar: false,
    },
  },
  {
    path: "/auth/github/failure",
    name: "GitHubFailure",
    component: () => import("@/views/user/GitHubCallback.vue"),
    meta: {
      title: "GitHub登录失败",
      requiresAuth: false,
      showNavBar: false,
    },
  },

  // 公开用户主页
  {
    path: "/u/:id",
    name: "PublicProfile",
    component: () => import("@/views/user/PublicProfile.vue"),
    meta: {
      title: "用户主页",
      requiresAuth: false,
      showNavBar: true,
    },
  },

  // 用户中心路由
  {
    path: "/user",
    name: "UserCenter",
    redirect: "/user/favorites",
    component: () => import("@/views/user/userCenter.vue"),
    meta: {
      title: "个人中心",
      requiresAuth: true,
      showNavBar: true,
    },
    children: [
      {
        path: "uploads",
        name: "UserUploads",
        component: () => import("@/views/user/components/UserWallpaperList.vue"),
        props: { type: "uploads" },
        meta: {
          title: "我的上传",
          requiresAuth: true,
          showNavBar: true,
        },
      },
      {
        path: "favorites",
        name: "UserFavorites",
        component: () => import("@/views/user/components/UserWallpaperList.vue"),
        props: { type: "favorites" },
        meta: {
          title: "我的收藏",
          requiresAuth: true,
          showNavBar: true,
        },
      },
      {
        path: "history",
        name: "UserHistory",
        component: () => import("@/views/user/components/UserViewHistory.vue"),
        meta: {
          title: "浏览记录",
          requiresAuth: true,
          showNavBar: true,
        },
      },
      {
        // 点赞已下线：旧链接重定向到收藏，避免 404
        path: "likes",
        redirect: "/user/favorites",
      },
      {
        path: "collections",
        name: "UserCollections",
        component: () => import("@/views/user/components/UserCollections.vue"),
        meta: {
          title: "我的合集",
          requiresAuth: true,
          showNavBar: true,
        },
      },
      {
        path: "settings",
        name: "UserSettings",
        component: () => import("@/views/user/components/UserSettings.vue"),
        meta: {
          title: "账号设置",
          requiresAuth: true,
          showNavBar: true,
        },
      },
    ],
  },
  // 标签相关路由
  {
    path: "/tags",
    name: "Tags",
    component: () => import("@/views/Tags.vue"),
    meta: {
      title: "标签库",
      requiresAuth: false,
      showNavBar: true,
    },
  },
  {
    path: "/tag/:id",
    name: "TagDetail",
    component: () => import("@/views/TagDetail.vue"),
    meta: {
      title: "标签详情",
      requiresAuth: false,
      showNavBar: true,
    },
  },

  // 论坛相关路由
  {
    path: "/forums",
    name: "Forums",
    component: () => import("@/views/forums/index.vue"),
    meta: {
      title: "社区论坛",
      requiresAuth: false,
      showNavBar: true,
    },
  },
  {
    path: "/forums/new",
    name: "ForumNewPost",
    component: () => import("@/views/forums/NewPost.vue"),
    meta: {
      title: "发布新帖",
      requiresAuth: true,
      showNavBar: true,
    },
  },
  {
    path: "/forums/post/:id",
    name: "ForumPostDetail",
    component: () => import("@/views/forums/PostDetail.vue"),
    meta: {
      title: "帖子详情",
      requiresAuth: false,
      showNavBar: true,
    },
  },
  {
    path: "/forums/edit/:id",
    name: "ForumPostEdit",
    component: () => import("@/views/forums/EditPost.vue"),
    meta: {
      title: "编辑帖子",
      requiresAuth: true,
      showNavBar: true,
    },
  },

  // 管理后台路由
  {
    path: "/admin",
    name: "AdminLayout",
    component: () => import("@/views/admin/AdminLayout.vue"),
    redirect: "/admin/dashboard",
    meta: {
      title: "管理后台",
      requiresAuth: true,
      roles: ["ADMIN"],
      showNavBar: false,
    },
    children: [
      {
        path: "dashboard",
        name: "AdminDashboard",
        component: () => import("@/views/admin/Dashboard.vue"),
        meta: {
          title: "仪表盘",
          requiresAuth: true,
          roles: ["ADMIN"],
          showNavBar: false,
        },
      },
      {
        path: "users",
        name: "AdminUsers",
        component: () => import("@/views/admin/Users.vue"),
        meta: {
          title: "用户管理",
          requiresAuth: true,
          roles: ["ADMIN"],
          showNavBar: false,
        },
      },
      {
        path: "wallpapers",
        name: "AdminWallpapers",
        component: () => import("@/views/admin/Wallpapers.vue"),
        meta: {
          title: "壁纸管理",
          requiresAuth: true,
          roles: ["ADMIN"],
          showNavBar: false,
        },
      },
      {
        path: "reports",
        name: "AdminReports",
        component: () => import("@/views/admin/Reports.vue"),
        meta: {
          title: "举报管理",
          requiresAuth: true,
          roles: ["ADMIN"],
          showNavBar: false,
        },
      },
      {
        path: "tags",
        name: "AdminTags",
        component: () => import("@/views/admin/Tags.vue"),
        meta: {
          title: "标签管理",
          requiresAuth: true,
          roles: ["ADMIN"],
          showNavBar: false,
        },
      },
    ],
  },

  // 404 页面
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("@/views/NotFound.vue"),
    meta: {
      title: "页面未找到",
      showNavBar: true, // 404页面显示导航栏
    },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // 路由滚动行为
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    // 同路径仅改查询参数（列表筛选/翻页）时保留当前滚动位置
    if (to.path === from.path) {
      return false
    }
    return { top: 0 }
  },
})

// 路由守卫
router.beforeEach(async (to, _from, next) => {
  // 在路由切换前清理可能的DOM残留
  if (typeof document !== "undefined") {
    // 清理所有可能的 Teleport 元素
    const teleportElements = document.querySelectorAll("[data-teleport]")
    teleportElements.forEach((el) => el.remove())

    // 清理所有可能的模态框背景
    const modals = document.querySelectorAll("[data-modal-backdrop]")
    modals.forEach((el) => el.remove())

    // 清理所有固定定位的可能残留元素
    const fixedElements = document.querySelectorAll(".fixed.z-\\[9999\\]")
    fixedElements.forEach((el) => {
      const elAny = el as HTMLElement & { _v_isTeleport?: boolean; __vteleport?: boolean }
      if (elAny._v_isTeleport || elAny.__vteleport) {
        el.remove()
      }
    })

    // 恢复 body 样式
    document.body.style.overflow = ""
    document.body.classList.remove("modal-open")
  }

  // 设置页面标题（统一后缀品牌名）
  if (to.meta.title) {
    const title = to.meta.title as string
    document.title = title.includes("Wallbay") ? title : `${title} - Wallbay`
  }

  // 检查登录状态 - 使用Pinia store中的用户状态来判断登录状态
  const userStore = useUserStore()
  const { isLoggedIn, currentUser } = storeToRefs(userStore)

  // 需要登录的路由
  if (to.meta.requiresAuth && !isLoggedIn.value) {
    // 避免在登录页之间无限重定向
    if (to.name === "Login" || to.name === "Register") {
      next()
      return
    }

    // 本地缓存缺失时先等服务端校验（cookie 可能仍有效），再决定是否踢登录页
    await userStore.initializeAuth()
    if (!isLoggedIn.value) {
      next({
        name: "Login",
        query: { redirect: to.fullPath }, // 保存重定向路径
      })
      return
    }
  }

  // 已登录用户访问登录/注册页面，重定向到首页
  if (to.meta.hideForAuth && isLoggedIn.value) {
    // 避免在首页之间无限重定向
    if (to.name === "Home") {
      next()
      return
    }

    next({ name: "Home" })
    return
  }

  // 检查管理员权限
  if (to.meta.roles && isLoggedIn.value) {
    const requiredRoles = to.meta.roles as string[]
    const userRole = currentUser.value?.role

    if (requiredRoles.includes("ADMIN") && userRole !== "admin" && userRole !== "super_admin") {
      useGlobalToast().error("该页面仅对管理员开放")
      next({ name: "Home" })
      return
    }
  }

  next()
})

// 路由错误处理
router.onError((error) => {
  // 新版本发布后旧 chunk 加载失败：提示并自动刷新拉取新资源；
  // sessionStorage 防循环——持续失败时只刷新一次
  if (
    /Failed to fetch dynamically imported module|Importing a module script failed/i.test(
      error.message,
    )
  ) {
    if (!sessionStorage.getItem("wb-chunk-reloaded")) {
      sessionStorage.setItem("wb-chunk-reloaded", "1")
      useGlobalToast().info("站点已更新，正在刷新…")
      setTimeout(() => window.location.reload(), 800)
      return
    }
  }
  console.error("路由错误:", error)
})

// 空闲时预取懒加载路由 chunk：避免点击导航时现场编译/下载造成切换白屏（admin 需鉴权，跳过）
if (typeof window !== "undefined") {
  const prefetchRoutes = () => {
    for (const record of router.getRoutes()) {
      if (record.path.startsWith("/admin")) continue
      try {
        const comp = record.components?.default
        if (typeof comp === "function") {
          void Promise.resolve((comp as () => unknown)()).catch(() => {})
        }
      } catch {
        // 预取失败不影响正常访问
      }
    }
  }
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(() => prefetchRoutes(), { timeout: 3000 })
  } else {
    window.setTimeout(prefetchRoutes, 2000)
  }
}

export default router
