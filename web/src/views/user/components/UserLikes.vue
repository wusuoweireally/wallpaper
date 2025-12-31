<template>
  <UserWallpaperList
    title="我的点赞"
    :empty-title="'暂无点赞的壁纸'"
    :empty-description="'为你喜欢的壁纸点赞，支持创作者'"
    :empty-action="{
      text: '去发现壁纸',
      handler: () => $router.push('/wallpapers'),
    }"
    :show-uploader="true"
    :show-actions="true"
    :fetch-function="fetchUserLikes"
  />
</template>

<script lang="ts" setup>
import UserWallpaperList from "./UserWallpaperList.vue";
import { useUserStore } from "@/stores";

const userStore = useUserStore();

// 获取用户点赞壁纸的API
const fetchUserLikes = async (
  page: number = 1,
  limit: number = 20,
  search: string = "",
) => {
  try {
    const response = await userStore.fetchUserWallpapers(
      "likes",
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
    console.error("获取用户点赞壁纸失败:", error);
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
