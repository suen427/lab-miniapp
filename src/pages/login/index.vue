<script setup lang="ts">
/**
 * 登录页
 * 支持「账号密码登录」和「微信授权登录」两种方式
 * 登录成功后根据 redirect 参数跳转到目标页面
 */
definePage({
  layout: 'blank',
  style: {
    navigationStyle: 'custom',
  },
})

const authStore = useAuthStore()

// ===== 登录方式切换 =====
const activeTab = ref<'password' | 'wechat'>('password')

// ===== 表单状态 =====
const account = ref('')
const password = ref('')
const loginLoading = ref(false)
const wechatLoading = ref(false)
const errorMsg = ref('')

// ===== 路由参数中的重定向路径 =====
const redirectParam = ref('')

// ===== 已登录时直接跳转 =====
onLoad((query) => {
  redirectParam.value = (query?.redirect as string) || ''
  if (authStore.isAuthenticated) {
    navigateAfterLogin()
  }
})

/**
 * 获取登录成功后的跳转路径
 */
function getRedirectPath(): string {
  // 优先使用 URL 参数中的 redirect
  if (redirectParam.value) {
    return decodeURIComponent(redirectParam.value)
  }
  // 其次使用 storage 中保存的路径
  const savedRedirect = uni.getStorageSync('auth_redirect')
  if (savedRedirect) {
    return savedRedirect
  }
  // 默认跳转到首页
  return '/pages/index'
}

/**
 * 登录成功后执行跳转
 */
function navigateAfterLogin() {
  const target = getRedirectPath()
  // 清除已保存的重定向路径
  uni.removeStorageSync('auth_redirect')
  // 使用 redirectTo 而非 navigateTo，避免用户按返回回到登录页
  uni.redirectTo({ url: target })
}

/**
 * 账号密码登录
 */
async function handlePasswordLogin() {
  // 表单校验
  if (!account.value.trim()) {
    errorMsg.value = '请输入账号'
    uni.showToast({ icon: 'none', title: '请输入账号' })
    return
  }
  if (!password.value.trim()) {
    errorMsg.value = '请输入密码'
    uni.showToast({ icon: 'none', title: '请输入密码' })
    return
  }

  loginLoading.value = true
  errorMsg.value = ''

  try {
    const success = await authStore.loginWithPassword(account.value.trim(), password.value.trim())
    if (success) {
      uni.showToast({ icon: 'success', title: '登录成功' })
      navigateAfterLogin()
    }
    else {
      errorMsg.value = '账号或密码错误'
      uni.showToast({ icon: 'error', title: '账号或密码错误' })
    }
  }
  catch {
    errorMsg.value = '登录失败，请稍后重试'
    uni.showToast({ icon: 'none', title: '登录失败' })
  }
  finally {
    loginLoading.value = false
  }
}

/**
 * 微信授权登录
 */
async function handleWechatLogin() {
  wechatLoading.value = true
  errorMsg.value = ''

  try {
    const success = await authStore.loginWithWechat()
    if (success) {
      uni.showToast({ icon: 'success', title: '登录成功' })
      navigateAfterLogin()
    }
    // 用户拒绝授权时不提示错误
  }
  catch {
    errorMsg.value = '授权失败，请稍后重试'
    uni.showToast({ icon: 'none', title: '授权失败' })
  }
  finally {
    wechatLoading.value = false
  }
}
</script>

<template>
  <!-- 登录页容器 -->
  <view class="login-page">
    <!-- 背景装饰 -->
    <view class="bg-decoration" />

    <!-- Logo 与标题区域 -->
    <view class="header">
      <view class="logo-wrapper">
        <image class="logo" src="/static/logo.svg" mode="aspectFit" />
      </view>
      <text class="app-name">
        Lab MiniApp
      </text>
      <text class="app-desc">
        欢迎回来，请登录您的账号
      </text>
    </view>

    <!-- 登录卡片 -->
    <view class="login-card">
      <!-- Tab 切换 -->
      <view class="tab-bar">
        <view
          class="tab-item"
          :class="{ active: activeTab === 'password' }"
          @click="activeTab = 'password'"
        >
          账号密码
        </view>
        <view
          class="tab-item"
          :class="{ active: activeTab === 'wechat' }"
          @click="activeTab = 'wechat'"
        >
          微信登录
        </view>
        <!-- 滑动指示器 -->
        <view
          class="tab-indicator"
          :class="activeTab === 'wechat' ? 'indicator-right' : 'indicator-left'"
        />
      </view>

      <!-- 账号密码登录表单 -->
      <view v-show="activeTab === 'password'" class="form-container">
        <!-- 账号输入 -->
        <view class="input-group">
          <view class="input-icon i-carbon:user-avatar" />
          <input
            v-model="account"
            class="form-input"
            type="text"
            placeholder="请输入账号"
            placeholder-class="input-placeholder"
            :maxlength="20 as any"
            autocomplete="off"
          >
        </view>

        <!-- 密码输入 -->
        <view class="input-group">
          <view class="input-icon i-carbon:locked" />
          <!-- 密码输入框：使用 password 属性启用密码模式 -->
          <input
            v-model="password"
            class="form-input"
            :password="true"
            placeholder="请输入密码"
            placeholder-class="input-placeholder"
            :maxlength="32 as any"
          >
        </view>

        <!-- 错误提示 -->
        <view v-if="errorMsg" class="error-tip">
          {{ errorMsg }}
        </view>

        <!-- 登录按钮 -->
        <button
          class="login-btn"
          :loading="loginLoading"
          :disabled="loginLoading"
          @click="handlePasswordLogin"
        >
          {{ loginLoading ? '登录中...' : '登 录' }}
        </button>

        <!-- 提示信息 -->
        <view class="hint-text">
          <text>测试账号：admin / 123456</text>
        </view>
      </view>

      <!-- 微信授权登录 -->
      <view v-show="activeTab === 'wechat'" class="form-container wechat-container">
        <view class="wechat-icon-wrapper">
          <view class="wechat-icon i-carbon:logo-wechat" />
        </view>
        <text class="wechat-desc">
          点击下方按钮，使用微信授权登录
        </text>

        <!-- 错误提示 -->
        <view v-if="errorMsg" class="error-tip">
          {{ errorMsg }}
        </view>

        <!-- 微信授权按钮 -->
        <button
          class="wechat-btn"
          :loading="wechatLoading"
          :disabled="wechatLoading"
          @click="handleWechatLogin"
        >
          {{ wechatLoading ? '授权中...' : '微信授权登录' }}
        </button>
      </view>
    </view>
  </view>
</template>

<style scoped>
/* ===== 页面容器 ===== */
.login-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 40rpx;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
}

/* ===== 背景装饰 ===== */
.bg-decoration {
  position: absolute;
  top: -100rpx;
  right: -150rpx;
  width: 500rpx;
  height: 500rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  pointer-events: none;
}

/* ===== 头部 Logo 区域 ===== */
.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 80rpx;
  padding-top: 120rpx;
  padding-bottom: 60rpx;
}

.logo-wrapper {
  width: 160rpx;
  height: 160rpx;
  border-radius: 40rpx;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
}

.logo {
  width: 100rpx;
  height: 100rpx;
}

.app-name {
  margin-top: 24rpx;
  font-size: 44rpx;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 2rpx;
}

.app-desc {
  margin-top: 12rpx;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.75);
}

/* ===== 登录卡片 ===== */
.login-card {
  width: 100%;
  max-width: 600rpx;
  background: #ffffff;
  border-radius: 32rpx;
  padding: 40rpx 48rpx;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.12);
  box-sizing: border-box;
}

/* ===== Tab 切换栏 ===== */
.tab-bar {
  position: relative;
  display: flex;
  margin-bottom: 40rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding-bottom: 20rpx;
  font-size: 28rpx;
  color: #999;
  transition: color 0.3s;
  cursor: pointer;
}

.tab-item.active {
  color: #667eea;
  font-weight: 600;
}

.tab-indicator {
  position: absolute;
  bottom: -2rpx;
  width: 50%;
  height: 4rpx;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2rpx;
  transition: transform 0.3s ease;
}

.indicator-left {
  transform: translateX(0);
}

.indicator-right {
  transform: translateX(100%);
}

/* ===== 表单容器 ===== */
.form-container {
  display: flex;
  flex-direction: column;
}

/* ===== 输入框组 ===== */
.input-group {
  display: flex;
  align-items: center;
  height: 96rpx;
  padding: 0 24rpx;
  margin-bottom: 28rpx;
  border: 2rpx solid #e8e8e8;
  border-radius: 16rpx;
  background: #fafafa;
  transition: border-color 0.3s;
}

.input-group:focus-within {
  border-color: #667eea;
  background: #ffffff;
}

.input-icon {
  width: 36rpx;
  height: 36rpx;
  font-size: 36rpx;
  color: #bbb;
  margin-right: 16rpx;
  flex-shrink: 0;
}

/* 聚焦时图标变色 */
.input-group:focus-within .input-icon {
  color: #667eea;
}

.form-input {
  flex: 1;
  height: 100%;
  font-size: 28rpx;
  color: #333;
  background: transparent;
  border: none;
  outline: none;
}

.input-placeholder {
  color: #c0c0c0;
  font-size: 28rpx;
}

/* ===== 错误提示 ===== */
.error-tip {
  font-size: 24rpx;
  color: #ff4d4f;
  margin-bottom: 16rpx;
  padding-left: 8rpx;
}

/* ===== 登录按钮 ===== */
.login-btn {
  height: 88rpx;
  margin-top: 12rpx;
  line-height: 88rpx;
  text-align: center;
  font-size: 32rpx;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 44rpx;
  border: none;
  cursor: pointer;
  transition: opacity 0.3s, transform 0.2s;
}

.login-btn:active {
  opacity: 0.9;
  transform: scale(0.98);
}

.login-btn[disabled] {
  opacity: 0.6;
}

/* ===== 提示文字 ===== */
.hint-text {
  margin-top: 24rpx;
  text-align: center;
  font-size: 24rpx;
  color: #bbb;
}

/* ===== 微信登录区域 ===== */
.wechat-container {
  align-items: center;
  padding: 20rpx 0;
}

.wechat-icon-wrapper {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #07c160 0%, #06ad56 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28rpx;
  box-shadow: 0 8rpx 24rpx rgba(7, 193, 96, 0.3);
}

.wechat-icon {
  width: 72rpx;
  height: 72rpx;
  font-size: 72rpx;
  color: #ffffff;
}

.wechat-desc {
  font-size: 26rpx;
  color: #888;
  margin-bottom: 32rpx;
}

.wechat-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  font-size: 30rpx;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, #07c160 0%, #06ad56 100%);
  border-radius: 44rpx;
  border: none;
  cursor: pointer;
  transition: opacity 0.3s, transform 0.2s;
}

.wechat-btn:active {
  opacity: 0.9;
  transform: scale(0.98);
}

.wechat-btn[disabled] {
  opacity: 0.6;
}
</style>
