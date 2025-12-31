// 扩展路由元信息的类型
declare module "vue-router" {
	interface RouteMeta {
		// 页面标题
		title?: string;
		// 是否需要登录
		requiresAuth?: boolean;
		// 已登录用户是否隐藏（如登录页面）
		hideForAuth?: boolean;
		// 页面图标
		icon?: string;
		// 是否在导航中隐藏
		hideInNav?: boolean;
		// 权限要求
		roles?: string[];
		// 页面描述
		description?: string;
		// 是否缓存页面
		keepAlive?: boolean;
		// 是否显示导航栏
		showNavBar?: boolean;
	}
}

export {};
