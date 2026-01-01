# GitHub OAuth 安全修复

## 问题描述

**严重安全漏洞**：用户退出登录后，其他用户可以通过 GitHub 快捷登录直接获得前一个用户的账户访问权限。

### 漏洞场景

```
1. 用户A 在公共电脑上使用 GitHub 登录
2. 用户A 点击"退出登录"
   - ✅ 清除了 Cookie 中的 JWT token
   - ❌ GitHub 的 OAuth session 仍然有效
3. 用户B 在同一台电脑上点击"GitHub登录"
4. GitHub 检测到之前的授权记录，直接授权
5. 系统使用用户A 的GitHub账户登录
6. ❌ 用户B 获得了用户A 的账户访问权限！
```

## 修复方案

### 1. 添加 `prompt=login` 参数

**文件**: `server/src/auth/github.strategy.ts`

```typescript
constructor(private configService: ConfigService) {
  super({
    clientID: configService.get<string>("GITHUB_CLIENT_ID") || "",
    clientSecret: configService.get<string>("GITHUB_CLIENT_SECRET") || "",
    callbackURL: configService.get<string>("GITHUB_CALLBACK_URL") || "",
    scope: ["user:email"],
    // 安全性改进：每次都强制用户在GitHub上确认账户
    prompt: "login",
  });
}
```

### 2. `prompt=login` 的作用

根据 [GitHub OAuth 文档](https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps#parameter-2)：

- **默认行为** (`prompt=consent`):
  - 如果用户之前授权过，GitHub会自动跳过授权页面
  - 适合单用户设备，但存在安全隐患

- **安全行为** (`prompt=login`):
  - 每次都强制用户在GitHub上确认登录
  - 用户可以选择不同的GitHub账户
  - 防止会话固定攻击

### 3. 用户体验变化

#### 修复前（不安全）：
```
用户A登录 → 退出登录 → 用户B点击GitHub登录
→ 直接使用用户A的账户登录 ❌
```

#### 修复后（安全）：
```
用户A登录 → 退出登录 → 用户B点击GitHub登录
→ 跳转到GitHub登录页面
→ 用户B可以选择自己的账户或用户A的账户
→ 输入密码确认后登录 ✅
```

## 测试验证

### 测试步骤：

1. **用户A 登录**
   - 访问登录页面
   - 点击"使用 GitHub 登录"
   - 在GitHub上授权并登录

2. **用户A 退出登录**
   - 点击"退出登录"按钮
   - 确认退出成功

3. **用户B 尝试登录**
   - 点击"使用 GitHub 登录"
   - ✅ **应该跳转到GitHub登录页面**
   - ✅ **需要用户B输入密码确认**
   - ✅ **用户B可以选择自己的GitHub账户**

## 其他安全建议

### 1. 前端安全提示

建议在登录页面添加安全提示：

```vue
<div class="security-notice">
  <p>⚠️ 安全提示：</p>
  <ul>
    <li>在公共设备上使用后，请务必退出登录</li>
    <li>退出登录会清除您的登录凭证</li>
    <li>建议定期更换密码</li>
  </ul>
</div>
```

### 2. 添加"切换账户"功能

如果用户想切换GitHub账户，可以：

1. 先退出登录
2. 再点击"使用 GitHub 登录"
3. 在GitHub登录页面选择其他账户

### 3. 监控异常登录

建议添加以下安全监控：
- 检测短时间内从不同IP地址登录的账户
- 检测账户信息突然变更
- 记录所有GitHub登录尝试

## 参考资料

- [GitHub OAuth 最佳实践](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [OAuth 2.0 安全最佳实践](https://datatracker.ietf.org/doc/html/rfc6819)
- [OWASP 会话固定攻击防护](https://owasp.org/www-community/attacks/Session_fixation)

## 修复历史

- **2026-01-01**: 添加 `prompt=login` 参数，修复会话固定攻击漏洞
- **影响范围**: 所有使用 GitHub OAuth 登录的用户
- **兼容性**: 完全向后兼容，不影响现有功能
