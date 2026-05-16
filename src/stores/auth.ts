/**
 * 认证状态管理 Store
 * 管理用户登录状态、Token 持久化、登录/登出操作
 */
export const useAuthStore = defineStore('auth', () => {
  // ===== 状态 =====
  const token = ref<string | null>(null)
  const userInfo = ref<{ nickname: string, avatar: string } | null>(null)
  const loginMethod = ref<'password' | 'wechat' | null>(null)

  // 认证就绪标记：initAuth 完成后置为 true，Layout 据此决定是否显示遮罩
  const ready = ref(false)

  // ===== 计算属性 =====
  const isAuthenticated = computed(() => !!token.value)

  // ===== 方法 =====

  /**
   * 从本地存储恢复登录状态（应用启动时调用）
   */
  function initAuth() {
    const savedToken = uni.getStorageSync('auth_token')
    const savedUserInfo = uni.getStorageSync('auth_userInfo')
    const savedMethod = uni.getStorageSync('auth_method')
    if (savedToken) {
      token.value = savedToken
      userInfo.value = savedUserInfo || null
      loginMethod.value = savedMethod || null
    }
    // 标记认证检查已完成
    ready.value = true
  }

  /**
   * 账号密码登录（Mock 实现）
   * @param account 账号
   * @param password 密码
   * @returns 是否登录成功
   */
  function loginWithPassword(account: string, password: string): Promise<boolean> {
    return new Promise((resolve) => {
      // 模拟网络请求延迟
      setTimeout(() => {
        // Mock 校验：admin/123456 或 user/123456
        if (
          (account === 'admin' && password === '123456')
          || (account === 'user' && password === '123456')
        ) {
          const mockToken = `mock_token_${Date.now()}`
          const mockUserInfo = {
            nickname: account === 'admin' ? '管理员' : '普通用户',
            avatar: 'https://via.placeholder.com/100',
          }
          token.value = mockToken
          userInfo.value = mockUserInfo
          loginMethod.value = 'password'

          // 持久化到本地存储
          uni.setStorageSync('auth_token', mockToken)
          uni.setStorageSync('auth_userInfo', mockUserInfo)
          uni.setStorageSync('auth_method', 'password')

          resolve(true)
        }
        else {
          resolve(false)
        }
      }, 800)
    })
  }

  /**
   * 微信授权登录（Mock 实现）
   * 模拟微信授权弹窗，获取用户昵称和头像
   * @returns 是否登录成功
   */
  function loginWithWechat(): Promise<boolean> {
    return new Promise((resolve) => {
      // 模拟微信授权弹窗
      uni.showModal({
        title: '微信授权',
        content: '将获取您的微信昵称和头像信息',
        success: (res) => {
          if (res.confirm) {
            // 模拟授权成功后获取用户信息
            setTimeout(() => {
              const mockToken = `mock_wechat_token_${Date.now()}`
              const mockUserInfo = {
                nickname: '微信用户',
                avatar: 'https://via.placeholder.com/100',
              }
              token.value = mockToken
              userInfo.value = mockUserInfo
              loginMethod.value = 'wechat'

              // 持久化到本地存储
              uni.setStorageSync('auth_token', mockToken)
              uni.setStorageSync('auth_userInfo', mockUserInfo)
              uni.setStorageSync('auth_method', 'wechat')

              resolve(true)
            }, 500)
          }
          else {
            // 用户拒绝授权
            resolve(false)
          }
        },
      })
    })
  }

  /**
   * 退出登录，清除所有认证信息并跳转到登录页
   */
  function logout() {
    token.value = null
    userInfo.value = null
    loginMethod.value = null

    // 清除本地存储的认证信息
    uni.removeStorageSync('auth_token')
    uni.removeStorageSync('auth_userInfo')
    uni.removeStorageSync('auth_method')
    uni.removeStorageSync('auth_redirect')

    // 跳转到登录页
    uni.redirectTo({
      url: '/pages/login/index',
    })
  }

  return {
    token,
    userInfo,
    loginMethod,
    ready,
    isAuthenticated,
    initAuth,
    loginWithPassword,
    loginWithWechat,
    logout,
  }
})
