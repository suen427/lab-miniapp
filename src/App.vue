<script setup lang="ts">
/**
 * 应用根组件
 * 启动时从本地存储恢复登录状态，未登录时立即跳转登录页
 */
onLaunch(() => {
  const authStore = useAuthStore()
  // 同步恢复登录状态（含设置 ready 标记）
  authStore.initAuth()

  if (!authStore.isAuthenticated) {
    // 未登录：保存默认重定向路径，跳转登录页
    uni.setStorageSync('auth_redirect', '/pages/index')

    // 使用 nextTick 确保导航系统就绪
    nextTick(() => {
      uni.redirectTo({
        url: '/pages/login/index',
      })
    })
  }
})
</script>

<!-- 全局样式 -->
<style lang="scss">
/**
 * 引入 uni-app 内置组件样式重置
 * 覆盖所有内置组件的默认样式，使其与 uni.scss 设计令牌保持一致
 */
@import '@/styles/uni-reset.scss';
</style>
