<template>
  <div class="github-callback-container">
    <div class="callback-card">
      <!-- 加载状态 -->
      <div v-if="status === 'loading'" class="loading-state">
        <div class="spinner"></div>
        <h2 class="title">正在完成 GitHub 登录...</h2>
        <p class="message">请稍候，我们正在验证您的身份</p>
      </div>

      <!-- 成功状态 -->
      <div v-else-if="status === 'success'" class="success-state">
        <div class="icon success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 class="title">登录成功！</h2>
        <p class="message">欢迎回来，{{ user?.username }}</p>
        <p class="countdown">{{ countdown }} 秒后自动跳转...</p>
        <button @click="handleNavigate" class="action-btn">立即跳转</button>
      </div>

      <!-- 失败状态 -->
      <div v-else-if="status === 'error'" class="error-state">
        <div class="icon error-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h2 class="title">登录失败</h2>
        <p class="message">{{ errorMessage || 'GitHub 登录过程中出现错误' }}</p>
        <button @click="handleRetry" class="action-btn">返回登录页</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

type CallbackStatus = 'loading' | 'success' | 'error';
const status = ref<CallbackStatus>('loading');
const errorMessage = ref('');
const countdown = ref(3);
let countdownTimer: number | null = null;

const user = computed(() => userStore.user);

/**
 * 处理页面跳转
 */
const handleNavigate = () => {
  // 清除倒计时
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }

  // 获取保存的重定向路径
  const redirectPath =
    sessionStorage.getItem('github_login_redirect') ||
    sessionStorage.getItem('redirect') ||
    '/';

  // 清除存储的路径
  sessionStorage.removeItem('github_login_redirect');
  sessionStorage.removeItem('redirect');

  // 跳转到目标页面
  router.replace(redirectPath);
};

/**
 * 重试：返回登录页
 */
const handleRetry = () => {
  router.replace({ name: 'Login' });
};

/**
 * 初始化认证状态
 */
const initializeAuth = async () => {
  try {
    // GitHub OAuth 回调后不依赖 localStorage，直接向后端拉取当前用户
    await userStore.fetchCurrentUser();

    // 检查用户是否登录成功
    if (user.value) {
      status.value = 'success';

      // 启动倒计时
      countdownTimer = window.setInterval(() => {
        countdown.value--;
        if (countdown.value <= 0) {
          handleNavigate();
        }
      }, 1000);
    } else {
      status.value = 'error';
      errorMessage.value = '未能获取登录信息，请重试';
    }
  } catch (error: any) {
    console.error('GitHub 登录验证失败:', error);
    status.value = 'error';
    errorMessage.value = error.message || '登录验证失败';
  }
};

/**
 * 组件挂载时处理回调
 */
onMounted(async () => {
  // 检查 URL 参数中的错误信息
  const error = route.query.error as string | undefined;
  if (error) {
    status.value = 'error';
    errorMessage.value = decodeURIComponent(error);
    return;
  }

  // 初始化认证状态
  await initializeAuth();
});

/**
 * 组件卸载时清理定时器
 */
onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
});
</script>

<style scoped>
.github-callback-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fdf6ed, #f7f1e8 55%, #f4efe7);
  padding: 1.5rem;
}

.callback-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 2rem;
  padding: 3rem 2.5rem;
  box-shadow: 0 40px 80px rgba(15, 23, 42, 0.12);
  max-width: 480px;
  width: 100%;
  text-align: center;
}

/* 加载状态 */
.spinner {
  width: 64px;
  height: 64px;
  margin: 0 auto 2rem;
  border: 4px solid #e2e8f0;
  border-top-color: #0f766e;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 图标 */
.icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.success-icon {
  background: linear-gradient(135deg, #10b981, #34d399);
  color: white;
}

.error-icon {
  background: linear-gradient(135deg, #ef4444, #f87171);
  color: white;
}

.icon svg {
  width: 48px;
  height: 48px;
}

/* 标题和消息 */
.title {
  font-size: 2rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 1rem;
  font-family: 'Fraunces', 'Noto Serif SC', serif;
}

.message {
  font-size: 1.125rem;
  color: #64748b;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.countdown {
  font-size: 0.95rem;
  color: #0f766e;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

/* 操作按钮 */
.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.875rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(120deg, #0f766e, #f59e0b);
  border: none;
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(15, 118, 110, 0.3);
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(15, 118, 110, 0.4);
}

.action-btn:active {
  transform: translateY(0);
}

/* 响应式 */
@media (max-width: 640px) {
  .callback-card {
    padding: 2rem 1.5rem;
  }

  .title {
    font-size: 1.5rem;
  }

  .message {
    font-size: 1rem;
  }

  .icon {
    width: 64px;
    height: 64px;
  }

  .icon svg {
    width: 36px;
    height: 36px;
  }
}
</style>
