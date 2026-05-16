<script setup lang="ts">
/**
 * 默认布局
 * 集成权限守卫 + 启动遮罩，防止未登录时闪现页面内容
 */
const authStore = useAuthStore()

// 同步检查（渲染前执行），未登录时立即跳转
useAuthGuard()
</script>

<template>
  <!-- 认证未就绪或未登录：显示启动遮罩，防止闪现 -->
  <view v-if="!authStore.ready || !authStore.isAuthenticated" class="splash-overlay">
    <view class="splash-content">
      <image class="splash-logo" src="/static/logo.svg" mode="aspectFit" />
      <text class="splash-text">
        加载中...
      </text>
    </view>
  </view>

  <!-- 认证就绪且已登录：正常内容 -->
  <view v-else class="px-10 py-20 text-center">
    <slot />
    <app-footer />
    <view class="mx-auto mt-5 text-center text-sm opacity-25">
      [Default Layout]
    </view>
  </view>
</template>

<style>
.splash-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  z-index: 99999;
}

.splash-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
}

.splash-logo {
  width: 160rpx;
  height: 160rpx;
  border-radius: 40rpx;
  background: rgba(255, 255, 255, 0.95);
  padding: 30rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
}

.splash-text {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 4rpx;
}
</style>
