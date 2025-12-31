<template>
  <UserWallpaperList
    title="我的上传"
    :empty-title="'暂无上传的壁纸'"
    :empty-description="'开始分享你的精彩壁纸吧'"
    :empty-action="{
      text: '开始上传',
      handler: () => $router.push('/upload'),
    }"
    :show-uploader="false"
    :show-actions="true"
    :fetch-function="fetchUserUploads"
  />
</template>

<script lang="ts" setup>
import UserWallpaperList from "./UserWallpaperList.vue";
import { useUserStore } from "@/stores";

const userStore = useUserStore();

// 获取用户上传壁纸的API
const fetchUserUploads = async (
  page: number = 1,
  limit: number = 20,
  search: string = "",
) => {
  try {
    const response = await userStore.fetchUserWallpapers(
      "uploads",
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
    console.error("获取用户上传壁纸失败:", error);
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
