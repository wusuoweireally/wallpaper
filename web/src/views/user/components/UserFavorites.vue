<template>
  <UserWallpaperList
    title="我的收藏"
    :empty-title="'暂无收藏的壁纸'"
    :empty-description="'收藏你喜欢的壁纸，方便随时查看'"
    :empty-action="{
      text: '去发现壁纸',
      handler: () => $router.push('/latest'),
    }"
    :show-uploader="true"
    :show-actions="true"
    :fetch-function="fetchUserFavorites"
  />
</template>

<script lang="ts" setup>
import UserWallpaperList from "./UserWallpaperList.vue";
import { useUserStore } from "@/stores";

const userStore = useUserStore();

// 获取用户收藏壁纸的API
const fetchUserFavorites = async (
  page: number = 1,
  limit: number = 20,
  search: string = "",
) => {
  try {
    const response = await userStore.fetchUserWallpapers(
      "favorites",
      page,
      limit,
      search,
    );
    if (response && response.data) {
      return {
        data: response.data || [],
        pagination: response.pagination || {
          page,
          limit,
          total: 0,
          pages: 0,
        },
      };
    }

    // 如果API返回失败，返回空数据
    return {
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        pages: 0,
      },
    };
  } catch (error) {
    console.error("获取用户收藏壁纸失败:", error);
    // 返回空数据
    return {
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        pages: 0,
      },
    };
  }
};
</script>
