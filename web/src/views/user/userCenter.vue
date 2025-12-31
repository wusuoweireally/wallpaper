<template>
  <div class="uc-layout">
    <div class="uc-shell">
      <section class="uc-hero">
        <div class="uc-hero-left">
          <div class="uc-avatar">
            <img :src="userStore.userAvatar" :alt="userStore.user?.username" />
            <span class="presence-dot"></span>
          </div>
          <div>
            <div class="uc-hero-title">
              <h1>{{ userStore.user?.username }}</h1>
            </div>
            <p class="uc-email">
              <i class="i-mdi-email-outline"></i>
              {{ userStore.user?.email }}
            </p>
            <p v-if="userStore.user?.bio" class="uc-bio">
              {{ userStore.user.bio }}
            </p>
          </div>
        </div>
        <div class="uc-hero-right">
          <button class="ghost-btn ghost-muted" type="button" @click="$router.push('/')">
            <i class="i-mdi-arrow-left"></i>
            返回首页
          </button>
          <button class="ghost-btn ghost-info" type="button" @click="$router.push('/user/settings')">
            <i class="i-mdi-cog"></i>
            编辑资料
          </button>
          <button class="primary-btn" type="button" @click="$router.push('/user/uploads')">
            <i class="i-mdi-upload mr-1"></i>
            上传壁纸
          </button>
        </div>
      </section>

      <section class="uc-stats-row">
        <button type="button" class="uc-stat-card" @click="$router.push('/user/uploads')">
          <p class="label">上传壁纸</p>
          <div class="value">{{ userStore.userStats.uploads }}</div>
          <span>本周新增 {{ userStore.userStats.uploads || 0 }}</span>
        </button>
        <button type="button" class="uc-stat-card" @click="$router.push('/user/favorites')">
          <p class="label">我的收藏</p>
          <div class="value">{{ userStore.userStats.favorites }}</div>
          <span>灵感速览</span>
        </button>
        <button type="button" class="uc-stat-card" @click="$router.push('/user/likes')">
          <p class="label">我的点赞</p>
          <div class="value">{{ userStore.userStats.likes }}</div>
          <span>喜欢的作品</span>
        </button>
        <div class="uc-stat-card">
          <p class="label">获赞数</p>
          <div class="value">{{ userStore.userStats.likesReceived }}</div>
          <span>社区认可</span>
        </div>
      </section>

      <nav class="uc-nav">
        <router-link to="/user/uploads" class="uc-nav-link" active-class="is-active">
          <i class="i-mdi-image-multiple"></i>
          我的上传
        </router-link>
        <router-link to="/user/favorites" class="uc-nav-link" active-class="is-active">
          <i class="i-mdi-star"></i>
          我的收藏
        </router-link>
        <router-link to="/user/likes" class="uc-nav-link" active-class="is-active">
          <i class="i-mdi-heart"></i>
          我的点赞
        </router-link>
        <router-link to="/user/settings" class="uc-nav-link" active-class="is-active">
          <i class="i-mdi-cog"></i>
          账号设置
        </router-link>
        <router-link v-if="userStore.user?.role === 'admin'" to="/admin/dashboard" class="uc-nav-link admin-nav-link" active-class="is-active">
          <i class="i-mdi-shield-crown"></i>
          管理后台
        </router-link>
      </nav>

      <section class="uc-content">
        <router-view />
      </section>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import { useUserStore } from "@/stores";

const userStore = useUserStore();

onMounted(() => {
  fetchUserData();
});

const fetchUserData = async () => {
  try {
    await userStore.fetchUserStats();
  } catch (error) {
    console.error("获取用户数据失败:", error);
  }
};
</script>

<style scoped>
.uc-layout {
  min-height: 100vh;
  background: #f7f8fb;
  padding: 2.5rem 1rem 3rem;
}

.uc-shell {
  max-width: 1140px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.uc-hero {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.1rem;
  background: #fff;
  border-radius: 22px;
  border: 1px solid rgba(15, 23, 42, 0.05);
  box-shadow: 0 12px 25px rgba(15, 23, 42, 0.06);
  padding: 1.1rem 1.6rem;
}

.uc-hero-left {
  display: flex;
  gap: 1.25rem;
}

.uc-avatar {
  position: relative;
  width: 74px;
  height: 74px;
  border-radius: 999px;
  padding: 3px;
  background: linear-gradient(140deg, rgba(99, 102, 241, 0.25), rgba(14, 165, 233, 0.1));
}

.uc-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 999px;
  object-fit: cover;
}

.presence-dot {
  position: absolute;
  bottom: 5px;
  right: 5px;
  width: 12px;
  height: 12px;
  border-radius: 999px;
  border: 2px solid #fff;
  background: #22c55e;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
}

.uc-hero-title {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.uc-hero-title h1 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #0f172a;
}

.uc-email {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.4rem;
  color: #475569;
  font-size: 0.95rem;
}

.uc-email i {
  font-size: 1rem;
}

.uc-bio {
  margin-top: 0.4rem;
  color: #64748b;
  font-size: 0.9rem;
  max-width: 520px;
}

.uc-stats-row {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.uc-stat-card {
  text-align: left;
  padding: 0.85rem 1.1rem;
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.05);
  background: #fff;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.06);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.uc-stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 15px 30px rgba(15, 23, 42, 0.1);
}

.uc-stat-card .label {
  font-size: 0.95rem;
  color: #475569;
}

.uc-stat-card .value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #0f172a;
}

.uc-stat-card span {
  font-size: 0.8rem;
  color: #94a3b8;
}

.uc-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.uc-nav-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.55rem 1.25rem;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  color: #475569;
  font-weight: 600;
  background: #fff;
  transition: color 0.2s ease, border 0.2s ease, box-shadow 0.2s ease;
}

.uc-nav-link:hover {
  color: #0f172a;
  border-color: rgba(99, 102, 241, 0.4);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
}

.uc-nav-link.is-active {
  color: #0f172a;
  border-color: rgba(99, 102, 241, 0.45);
  background: linear-gradient(120deg, rgba(99, 102, 241, 0.15), rgba(14, 165, 233, 0.12));
  box-shadow: 0 14px 28px rgba(99, 102, 241, 0.15);
}

.uc-nav-link.admin-nav-link {
  border-color: rgba(244, 63, 94, 0.4);
  background: linear-gradient(120deg, rgba(244, 63, 94, 0.1), rgba(251, 113, 133, 0.08));
  color: #be123c;
}

.uc-nav-link.admin-nav-link:hover {
  color: #9f1239;
  border-color: rgba(244, 63, 94, 0.6);
  box-shadow: 0 10px 22px rgba(244, 63, 94, 0.15);
}

.uc-nav-link.admin-nav-link.is-active {
  color: #9f1239;
  border-color: rgba(244, 63, 94, 0.6);
  background: linear-gradient(120deg, rgba(244, 63, 94, 0.18), rgba(251, 113, 133, 0.15));
  box-shadow: 0 14px 28px rgba(244, 63, 94, 0.25);
}

.uc-content {
  background: #fff;
  border-radius: 22px;
  border: 1px solid rgba(15, 23, 42, 0.05);
  padding: 1.25rem;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
}

.uc-hero-right {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.4rem;
}

.ghost-btn,
.primary-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.8rem;
  padding: 0.35rem 1rem;
  transition: color 0.2s ease, border 0.2s ease, background 0.2s ease;
}

.ghost-btn {
  border: 1px solid transparent;
  color: #475569;
  background: rgba(226, 232, 240, 0.4);
}

.ghost-btn:hover {
  color: #0f172a;
  border-color: rgba(15, 23, 42, 0.12);
  background: rgba(226, 232, 240, 0.7);
}

.ghost-muted {
  color: #475569;
  background: rgba(241, 245, 249, 0.9);
}

.ghost-info {
  color: #0369a1;
  background: rgba(191, 219, 254, 0.45);
}

.primary-btn {
  border: 1px solid rgba(99, 102, 241, 0.5);
  color: #4338ca;
  background: rgba(99, 102, 241, 0.15);
}

.primary-btn:hover {
  border-color: rgba(99, 102, 241, 0.7);
  background: rgba(99, 102, 241, 0.25);
}

@media (max-width: 768px) {
  .uc-hero {
    padding: 0.85rem 1rem;
  }

  .uc-hero-right {
    justify-content: flex-start;
  }

  .uc-nav-link {
    width: calc(50% - 0.4rem);
    justify-content: center;
  }
}
</style>
