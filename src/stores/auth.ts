/**
 * 认证状态管理 Store
 * 管理用户登录状态、Token 持久化、登录/登出操作
 */
export const useAuthStore = defineStore('auth', () => {
  // ===== 状态 =====
  const token = ref<string | null>(null)
  const userInfo = ref<UserInfoData | null>(null)
  const loginMethod = ref<'password' | 'wechat' | null>(null)

  // 认证就绪标记：initAuth 完成后置为 true，Layout 据此决定是否显示遮罩
  const ready = ref(false)

  // ===== 计算属性 =====
  const isAuthenticated = computed(() => !!token.value)

  // ===== 方法 =====

  /**
   * 从本地存储恢复登录状态（应用启动时调用）
   * 仅恢复 Token，用户信息始终从服务端获取
   */
  function initAuth() {
    const savedToken = uni.getStorageSync('auth_token')
    const savedMethod = uni.getStorageSync('auth_method')
    if (savedToken) {
      token.value = savedToken
      loginMethod.value = savedMethod || null
      // token 存在时异步拉取最新用户信息
      fetchUserInfo()
    }
    // 标记认证检查已完成（无论是否登录都能渲染界面）
    ready.value = true
  }

  /**
   * 账号密码登录
   * 调用后端 /api/Account/login 接口进行认证
   * @param userName 账号
   * @param password 密码
   * @returns 是否登录成功
   */
  async function loginWithPassword(userName: string, password: string): Promise<boolean> {
    // 调用登录 API
    const res = await loginApi({ userName, password })

    // HTTP 请求失败（网络错误等）
    if (!res.success) {
      throw new Error(res.message || '网络请求失败')
    }

    // 业务状态码不为 0 表示登录失败
    if (res.code !== 0) {
      return false
    }

    // 提取登录结果数据（res.data 为 LoginResponse，其 data 字段为 LoginResult）
    const loginData = res.data?.data
    if (!loginData?.access_token) {
      return false
    }

    // 更新 store 状态
    token.value = loginData.access_token
    loginMethod.value = 'password'

    // 持久化到本地存储
    uni.setStorageSync('auth_token', loginData.access_token)
    uni.setStorageSync('auth_method', 'password')

    // 登录成功后获取用户信息
    await fetchUserInfo()

    return true
  }

  /**
   * 获取当前登录用户信息
   * 登录成功后自动调用，也可在需要刷新用户信息时手动调用
   */
  async function fetchUserInfo() {
    try {
      const res = await getLoginUserApi()
      if (res.success && res.code === 0 && res.data?.data) {
        userInfo.value = res.data.data
      }
    }
    catch {
      // 获取用户信息失败不影响登录状态
      console.error('获取用户信息失败')
    }
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
              const mockUserInfo: UserInfoData = {
                id: `mock_${Date.now()}`,
                userName: 'wechat_user',
                fullName: '微信用户',
                roleName: '普通用户',
                phoneNumber: null,
                email: null,
                departmentId: null,
                departmentName: null,
                description: null,
                roleIds: [],
              }
              token.value = mockToken
              userInfo.value = mockUserInfo
              loginMethod.value = 'wechat'

              // 持久化到本地存储
              uni.setStorageSync('auth_token', mockToken)
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
    fetchUserInfo,
  }
})
