/**
 * 权限守卫 Composable
 * 在 Layout 或页面中调用，检查用户是否已登录。
 * 未登录时自动跳转到登录页，并记录当前页面路径用于登录后回跳。
 *
 * 采用「同步检查 + onShow 兜底」双重机制：
 * - 同步检查在组件 setup 阶段执行（渲染前），消除页面闪现
 * - onShow 兜底处理从后台切回等场景
 *
 * @example
 * // 在 layout 中使用
 * <script setup lang="ts">
 * useAuthGuard()
 * </script>
 */
export function useAuthGuard() {
  const authStore = useAuthStore()

  /**
   * 执行跳转到登录页
   */
  function redirectToLogin() {
    // 获取当前页面路径
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    let redirectPath = '/pages/index'

    if (currentPage) {
      // 通过类型断言访问 route 属性
      const route = (currentPage as any).route as string | undefined
      if (route) {
        redirectPath = `/${route}`
      }
    }

    // 保存重定向路径到本地存储，供登录页读取
    uni.setStorageSync('auth_redirect', redirectPath)

    // 跳转到登录页，携带 redirect 参数
    uni.redirectTo({
      url: `/pages/login/index?redirect=${encodeURIComponent(redirectPath)}`,
    })
  }

  // ===== 同步检查（渲染前执行，消除闪现） =====
  // App.onLaunch 已在此时同步执行完 initAuth，authStore 状态已就绪
  if (!authStore.isAuthenticated) {
    redirectToLogin()
  }

  // ===== onShow 兜底（处理从后台切回等场景） =====
  onShow(() => {
    if (!authStore.isAuthenticated) {
      redirectToLogin()
    }
  })
}
