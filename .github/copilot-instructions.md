# Vitesse-Uni 项目开发指南

## 项目概述

基于 **Vitesse-Uni**（unibest 框架）的小程序项目，底层使用 Vue 3 + uni-app 3.x + TypeScript，默认构建平台为微信小程序（mp-weixin）。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3 + uni-app 3.x（`@dcloudio/uni-app`） |
| 语言 | TypeScript |
| 构建 | Vite + `@uni-helper/unh`（`unh` CLI） |
| 页面路由 | `@uni-helper/vite-plugin-uni-pages`（自动扫描 `src/pages/`） |
| 布局系统 | `@uni-helper/vite-plugin-uni-layouts` |
| 状态管理 | Pinia |
| 样式方案 | UnoCSS + `@uni-helper/unocss-preset-uni` |
| 图标库 | Carbon Icons（`@iconify-json/carbon`） |
| UI 组件库 | uni-ui（`@dcloudio/uni-ui`），通过插件自动导入 |
| 自动导入 | `unplugin-auto-import`（vue/pinia/@vueuse/core/uni-app） |
| 测试 | Vitest + `vitest-environment-uniapp` |
| 代码规范 | ESLint（`@uni-helper/eslint-config`） |
| 包管理 | pnpm |

## 项目结构

```
src/
  App.vue              # 应用根组件（onLaunch 初始化认证等）
  main.ts              # 应用入口（SSR 模式 + Pinia 安装）
  pages.json           # 【自动生成】页面配置（由插件自动生成，不手动编辑）
  manifest.json        # 【自动生成】应用配置
  pages.config.ts      # 页面全局配置源文件
  manifest.config.ts   # manifest 配置源文件
  unh.config.ts        # unh 构建配置
  uno.config.ts        # UnoCSS 配置
  vite.config.ts       # Vite 配置（含 AutoImport 等）
  pages/               # 页面目录（自动扫描）
    index.vue          # 首页
    hi.vue             # 示例页（home 布局）
    login/index.vue    # 登录页（blank 布局）
    demo/index.vue     # 示例页
  layouts/             # 布局组件
    default.vue        # 默认布局（含权限守卫 + 启动遮罩）
    home.vue           # Home 布局（含权限守卫 + 启动遮罩）
    blank.vue          # 空白布局（无守卫，用于登录页）
  components/          # 组件（自动导入）
    AppFooter.vue
    AppLogos.vue
    HiCounter.vue
    InputEntry.vue
  composables/         # 组合式函数（自动导入）
    useQuery.ts        # 获取页面 URL 参数
    useCount.ts        # 计数器示例
    useAuthGuard.ts    # 权限守卫
  stores/              # Pinia Store（自动导入）
    counter.ts         # 计数器示例
    auth.ts            # 认证状态管理
  utils/               # 工具函数目录（自动导入）
  static/              # 静态资源
  test/                # 测试
```

## 编码规范

### 通用原则

- 全程使用**中文注释**（代码语法本身保持英文）
- 类、函数、组件需添加 JSDoc 注释，说明用途、参数、返回值
- 复杂逻辑需添加行内注释，解释实现思路

### 注释风格

```typescript
/**
 * 认证状态管理 Store
 * 管理用户登录状态、Token 持久化、登录/登出操作
 */
export const useAuthStore = defineStore('auth', () => {
  // ===== 状态 =====
  const token = ref<string | null>(null)

  // ===== 计算属性 =====
  const isAuthenticated = computed(() => !!token.value)

  // ===== 方法 =====

  /**
   * 从本地存储恢复登录状态（应用启动时调用）
   */
  function initAuth() { ... }

  return { ... }
})
```

## 页面开发规范

### 创建新页面

在 `src/pages/` 下创建 `.vue` 文件，文件路径即页面路由。

使用 `definePage()` 配置页面元信息（位于 `<script setup>` 首行）：

```html
<script setup lang="ts">
definePage({
  layout: 'default',        // 使用的布局：default / home / blank
  style: {                  // uni-app 原生配置（导航栏等）
    navigationBarTitleText: '页面标题',
    navigationStyle: 'default', // 'default' 或 'custom'
  },
})

// 页面逻辑...
</script>
```

### 页面级导航样式

微信小程序中隐藏导航栏需通过 `style.navigationStyle` 配置：

```html
definePage({
  layout: 'blank',
  style: {
    navigationStyle: 'custom',  // 隐藏原生导航栏
  },
})
```

不要将 `navigationStyle` 直接写在 `definePage` 顶层，必须嵌套在 `style` 对象内。

### 页面路由跳转

使用 `uni-app` 的导航 API：
- `uni.navigateTo({ url })` — 推入新页面
- `uni.redirectTo({ url })` — 替换当前页面
- `uni.reLaunch({ url })` — 重新启动
- `uni.switchTab({ url })` — 切换 Tab

## 布局系统

布局文件位于 `src/layouts/`，通过 `definePage({ layout: 'xxx' })` 指定。

| 布局 | 说明 |
|------|------|
| `default` | 默认布局，含页脚 + 权限守卫 + 启动遮罩 |
| `home` | Home 布局，含页脚 + 权限守卫 + 启动遮罩 |
| `blank` | 空白布局，仅渲染页面内容，无守卫（用于登录页） |

### 权限守卫

`default` 和 `home` 布局已集成 `useAuthGuard()`，未登录时自动跳转登录页：

```typescript
// src/composables/useAuthGuard.ts
export function useAuthGuard() {
  const authStore = useAuthStore()

  // 同步检查（渲染前执行）：此时 App.onLaunch 已执行完 initAuth
  if (!authStore.isAuthenticated) {
    redirectToLogin()
  }

  // onShow 兜底：处理从后台切回等场景
  onShow(() => {
    if (!authStore.isAuthenticated) {
      redirectToLogin()
    }
  })
}
```

`blank` 布局**不包含**权限守卫，用于登录页等公开页面。

### 启动遮罩

布局中使用 `authStore.ready && authStore.isAuthenticated` 控制显示：
- 认证未就绪或未登录 → 显示全屏遮罩（渐变背景 + Logo）
- 认证就绪且已登录 → 显示正常页面内容

## 认证系统

### 认证 Store（`src/stores/auth.ts`）

```typescript
export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const userInfo = ref<{ nickname: string; avatar: string } | null>(null)
  const loginMethod = ref<'password' | 'wechat' | null>(null)
  const ready = ref(false)          // initAuth 完成后置 true
  const isAuthenticated = computed(() => !!token.value)

  function initAuth()               // 从 storage 恢复登录态
  function loginWithPassword(userName, password): Promise<boolean>  // Mock 登录
  function loginWithWechat(): Promise<boolean>                      // Mock 微信授权
  function logout()                  // 清除状态并跳转登录页
})
```

### 登录流程

```
App.onLaunch → initAuth() → ready=true
                              ↓
Layout setup → useAuthGuard 同步检查
                              ↓
                 ┌─ 已登录 → template v-else → 正常内容
                 │
                 └─ 未登录 → template v-if → 遮罩显示
                             → redirectTo 登录页（携带 redirect 参数）
```

### 登录页（`src/pages/login/index.vue`）

- 支持「账号密码」和「微信授权登录」两种方式
- 登录成功后读取 `redirect` 参数回跳目标页
- Mock 测试账号：`admin/123456`（管理员）、`user/123456`（普通用户）

## 状态管理

### Pinia Store

Store 文件放在 `src/stores/`，自动导入 `defineStore`：

```typescript
export const useExampleStore = defineStore('example', () => {
  const state = ref('')
  const computedState = computed(() => ...)

  function action() { ... }

  return { state, computedState, action }
})
```

### 在组件中使用

Store 自动导入，无需手动 import：

```typescript
const authStore = useAuthStore()
const { count } = storeToRefs(useCounterStore())
```

## 样式规范

### UnoCSS

使用 UnoCSS utility class，项目已预设 `@uni-helper/unocss-preset-uni`：

```html
<view class="px-10 py-20 text-center text-sm text-white bg-teal-600" />
<view class="flex items-center justify-center gap-3" />
<view class="m-3 mx-auto w-220rpx rounded" />
```

### UnoCSS 属性化编写

项目已启用 `presetAttributify`，支持将 utility class 写为 HTML 属性，使模板更简洁直观。

**基础写法对照：**

```html
<!-- 传统 class 写法 -->
<view class="flex items-center justify-center gap-3 text-center" />

<!-- 属性化写法 -->
<view flex items-center justify-center gap-3 text-center />
```

**带参数的属性化：**

```html
<!-- class 写法 -->
<view class="m-3 p-4 w-200rpx h-100rpx text-sm bg-teal-600 text-white rounded" />

<!-- 属性化写法 -->
<view m-3 p-4 w-200rpx h-100rpx text-sm bg-teal-600 text-white rounded />
```

**响应式与状态变体：**

```html
<!-- 属性化 + 变体 -->
<button hover:bg-teal-700 hover:scale-98 active:opacity-90 />
<view sm:text-lg md:text-xl lg:text-2xl />
```

**注意事项：**

- 属性化与 `class` 可混合使用，同一元素中使用两者时 class 优先级更高
- 小程序中部分自定义组件可能无法识别属性化语法，此时回退使用 `class` 写法
- 带特殊字符（如 `/`、`:`、`%`）的规则需使用 `class` 写法或加引号

### 图标

使用 Carbon 图标，两种引用方式均可：

```html
<!-- 带冒号格式 -->
<view class="i-carbon:user-avatar" />
<view class="i-carbon:locked" />
<view class="i-carbon:logo-wechat" />

<!-- 短横线格式（旧） -->
<view class="i-carbon-add" />
<view class="i-carbon-subtract" />
```

常用 Carbon 图标映射：
- `i-carbon:user-avatar` — 用户头像
- `i-carbon:locked` — 锁（密码）
- `i-carbon:logo-wechat` — 微信
- `i-carbon:logo-github` — GitHub
- `i-carbon:add` / `i-carbon:subtract` — 加/减
- `i-carbon:campsite` — 首页

## uni-ui 组件库

项目集成了 `@dcloudio/uni-ui` 官方组件库，所有 uni-ui 组件均已配置自动导入，在模板中直接使用即可，无需手动 import。

### 自动导入配置

已在 `vite.config.ts` 的 `UniHelperComponents` 插件中配置 `UniUIResolver()`：

```typescript
UniHelperComponents({
  dts: 'src/components.d.ts',
  directoryAsNamespace: true,
  resolvers: [UniUIResolver()],
})
```

### 组件使用示例

```html
<!-- 表单组件 -->
<uni-easyinput v-model="value" placeholder="请输入内容" />
<uni-forms ref="formRef" :modelValue="formData">
  <uni-forms-item label="用户名" name="username">
    <uni-easyinput v-model="formData.username" placeholder="请输入用户名" />
  </uni-forms-item>
</uni-forms>

<!-- 反馈组件 -->
<uni-popup ref="popup" type="center">
  <text>弹窗内容</text>
</uni-popup>

<!-- 数据展示 -->
<uni-card title="卡片标题" is-full>
  <text>卡片内容</text>
</uni-card>

<uni-list>
  <uni-list-item title="列表项一" />
  <uni-list-item title="列表项二" />
</uni-list>

<!-- 导航组件 -->
<uni-nav-bar left-icon="back" title="导航标题" />

<!-- 加载组件 -->
<uni-load-more status="more" />
```

### 注意事项

- uni-ui 组件无需 import，直接在模板中使用即可
- 部分 uni-ui 组件需接收 ref 手动调用方法（如 `uni-popup`）
- 组件 `v-model` 用法与 Vue 3 标准一致
- 跨平台兼容性请参考 [uni-ui 官方文档](https://uniapp.dcloud.net.cn/component/uni-ui/uni-ui.html)

### UI 单位

使用 `rpx` 作为尺寸单位（小程序适配）：

```css
.login-page {
  padding: 0 40rpx;
}
.logo-wrapper {
  width: 160rpx;
  height: 160rpx;
  border-radius: 40rpx;
}
```

## 自动导入清单

以下 API 在项目中**自动导入**，无需手动 import：

| 来源 | 自动导入内容 |
|------|------------|
| `vue` | ref, computed, watch, onMounted, onLoad, onShow, nextTick, defineComponent, reactive 等 |
| `pinia` | defineStore, storeToRefs, acceptHMRUpdate |
| `@dcloudio/uni-ui` | 所有 uni-ui 组件（通过 `UniUIResolver` 自动导入） |
| `@vueuse/core` | useStorage, useDebounceFn 等全部 VueUse API |
| `uni-app` | onLaunch, onShow, onHide, onLoad, getCurrentPages 等生命周期 |
| `src/composables/` | 所有 composable（useAuthGuard, useQuery, useCount 等） |
| `src/stores/` | 所有 Store（useAuthStore, useCounterStore 等） |
| `src/utils/` | 所有工具函数 |

## 构建与运行

```bash
# 启动 H5 开发
pnpm dev

# 构建微信小程序
pnpm build:mp-weixin

# 类型检查
pnpm type-check

# 运行测试
pnpm test
pnpm test:run

# 代码检查
pnpm lint
pnpm lint:fix
```

## 配置文件说明

| 文件 | 用途 |
|------|------|
| `pages.config.ts` | 全局页面样式配置（导航栏、主题色等） |
| `unh.config.ts` | unh 构建工具配置（平台、自动生成开关） |
| `manifest.config.ts` | 应用 manifest 配置（名称、AppID、权限等） |
| `uno.config.ts` | UnoCSS 预设与插件配置 |
| `vite.config.ts` | Vite 插件配置（含 AutoImport 规则、UniUIResolver 自动导入 uni-ui 组件） |

## 微信小程序注意事项

- `pages.json` 和 `manifest.json` 由插件在构建时自动生成，在 `.gitignore` 中排除
- 页面级原生配置（navigationStyle 等）需在 `definePage({ style: { ... } })` 中设置
- 全局配置在 `pages.config.ts` 的 `globalStyle` 中定义
- `unh.config.ts` 中 `autoGenerate: { pages: true, manifest: true }` 控制自动生成

## 认证系统架构（关键依赖关系）

```
App.vue
  └─ onLaunch → authStore.initAuth()
       └─ 未登录 → nextTick → redirectTo /pages/login

Layout (default.vue / home.vue)
  ├─ useAuthGuard()
  │    ├─ 同步检查（setup 阶段，渲染前）
  │    └─ onShow 兜底
  └─ template
       ├─ v-if="!ready || !isAuthenticated" → splash-overlay
       └─ v-else → slot（页面内容）

Login Page (blank layout)
  ├─ definePage({ layout: 'blank', style: { navigationStyle: 'custom' } })
  ├─ handlePasswordLogin() → authStore.loginWithPassword()
  ├─ handleWechatLogin() → authStore.loginWithWechat()
  └─ navigateAfterLogin() → 回跳 redirect 目标页
```
