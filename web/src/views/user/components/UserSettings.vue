<template>
  <div class="settings-page">
    <header class="settings-header">
      <div>
        <p class="eyebrow">ACCOUNT</p>
        <h1>账号设置</h1>
        <p class="subtitle">管理资料、安全信息以及账号使用状态。</p>
      </div>
      <div class="header-meta">
        <div>
          <p class="meta-label">用户名</p>
          <p class="meta-value">{{ userStore.user?.username || "未填写" }}</p>
        </div>
        <div>
          <p class="meta-label">邮箱</p>
          <p class="meta-value">{{ userStore.user?.email || "未绑定" }}</p>
        </div>
      </div>
    </header>

    <section class="summary-grid">
      <div class="summary-card">
        <p class="summary-label">基础资料</p>
        <p class="summary-value">{{ userStore.user?.username || "未设置" }}</p>
        <span class="summary-desc">头像与简介将展示在公开主页中。</span>
      </div>
      <div class="summary-card">
        <p class="summary-label">联系邮箱</p>
        <p class="summary-value">{{ userStore.user?.email || "暂无" }}</p>
        <span class="summary-desc">建议绑定常用邮箱保障账号安全。</span>
      </div>
      <div class="summary-card">
        <p class="summary-label">安全状态</p>
        <p class="summary-value">密码可更新</p>
        <span class="summary-desc">定期修改密码可减少安全风险。</span>
      </div>
    </section>

    <section class="settings-grid">
      <div class="settings-row">
        <div class="settings-column">
          <ProfileSettings />
        </div>
        <div class="settings-column">
          <PasswordSettings />
        </div>
      </div>
      <div class="settings-row">
        <div class="settings-column account-settings-column">
          <AccountSettings />
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { useUserStore } from "@/stores";
import { ref, onMounted, onUnmounted } from "vue";
import ProfileSettings from "./settings/ProfileSettings.vue";
import PasswordSettings from "./settings/PasswordSettings.vue";
import AccountSettings from "./settings/AccountSettings.vue";

const userStore = useUserStore();

// 组件挂载状态
const isMounted = ref(false);

onMounted(() => {
  isMounted.value = true;
});

onUnmounted(() => {
  isMounted.value = false;

  // 清理任何可能的 Teleport 残留元素
  if (typeof document !== 'undefined') {
    const teleportElements = document.querySelectorAll('[data-teleport]');
    teleportElements.forEach(el => el.remove());

    // 清理任何可能的模态框背景
    const modals = document.querySelectorAll('[data-modal-backdrop]');
    modals.forEach(el => el.remove());

    // 恢复 body 样式
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');
  }
});
</script>

<style scoped>
.settings-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.settings-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1rem;
}

.eyebrow {
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  color: #94a3b8;
  margin-bottom: 0.4rem;
}

.settings-header h1 {
  font-size: 2rem;
  font-weight: 600;
  color: #0f172a;
}

.subtitle {
  color: #64748b;
  margin-top: 0.35rem;
}

.header-meta {
  display: flex;
  gap: 1.5rem;
}

.meta-label {
  font-size: 0.85rem;
  color: #94a3b8;
}

.meta-value {
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem;
}

.summary-card {
  background: #fff;
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.05);
  padding: 1rem 1.25rem;
  box-shadow: 0 12px 25px rgba(15, 23, 42, 0.05);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.summary-label {
  font-size: 0.85rem;
  color: #94a3b8;
}

.summary-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #0f172a;
}

.summary-desc {
  font-size: 0.85rem;
  color: #94a3b8;
}

.settings-grid {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.settings-row {
  display: flex;
  gap: 2rem;
}

/* 基础列设置 */
.settings-column {
  width: 100%;
}

/* 注销账号组件特殊设置 */
.account-settings-column {
  max-width: 640px;
  margin: 0 auto;
  width: 100%;
}

/* 大屏幕 (≥1400px) */
@media (min-width: 1400px) {
  .settings-row:first-child {
    justify-content: center;
  }
  .settings-column {
    max-width: 480px;
  }
}

/* 中等屏幕 (1024px-1399px) */
@media (min-width: 1024px) and (max-width: 1399px) {
  .settings-row:first-child {
    justify-content: center;
  }
  .settings-column {
    max-width: 440px;
  }
  .account-settings-column {
    max-width: 600px;
  }
}

/* 小型桌面 (768px-1023px) */
@media (min-width: 768px) and (max-width: 1023px) {
  .settings-row {
    flex-direction: column;
    gap: 1.5rem;
  }
  .settings-column {
    max-width: none;
  }
  .account-settings-column {
    max-width: 560px;
    margin: 0 auto;
  }
}

/* 移动端 (≤767px) */
@media (max-width: 767px) {
  .settings-row {
    flex-direction: column;
    gap: 1rem;
  }
  .settings-column {
    max-width: none;
  }
  .account-settings-column {
    max-width: none;
  }
  .header-meta {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
