/**
 * 统一 HTTP 请求工具
 * 基于 uni.request 封装，支持请求/响应拦截器、自动携带 Token、统一错误处理
 *
 * @example
 * ```typescript
 * // 默认实例（自动携带 auth token）
 * const res = await http.get('/api/user/info')
 *
 * // 自定义实例
 * const myHttp = createRequest({ baseURL: 'https://api.example.com' })
 * const res = await myHttp.post('/login', { userName, password })
 * ```
 */

// ============================================================
// 类型定义
// ============================================================

/** HTTP 请求方法 */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

/** 请求拦截器 */
interface RequestInterceptor {
  /** 请求发送前处理（可修改 config 或返回新的 config） */
  onFulfilled?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>
  /** 请求发送前出错时的处理 */
  onRejected?: (error: any) => any
}

/** 响应拦截器 */
interface ResponseInterceptor<T = any> {
  /** 请求成功后处理响应数据 */
  onFulfilled?: (response: T) => T | Promise<T>
  /** 请求失败后处理错误 */
  onRejected?: (error: any) => any
}

/** 请求配置 */
interface RequestConfig {
  /** 请求地址（完整 URL 或路径，与 baseURL 拼接） */
  url: string
  /** 请求方法，默认 GET */
  method?: HttpMethod
  /** 请求体数据（POST/PUT 时使用） */
  data?: Record<string, any>
  /** URL 查询参数（会拼接到 URL 上） */
  params?: Record<string, any>
  /** 请求头 */
  header?: Record<string, string>
  /** 超时时间（毫秒），默认 10000 */
  timeout?: number
  /** 自定义 baseURL，覆盖实例级别 baseURL */
  baseURL?: string
  /** 响应数据类型，默认 json */
  dataType?: 'json' | 'text'
  /** 响应编码，默认 utf-8 */
  responseType?: 'text' | 'arraybuffer'
  /** 是否自动携带 Token，默认 true */
  withToken?: boolean
}

/** 成功响应结构（uni.request 原始响应） */
interface UniSuccessResult {
  data: any
  statusCode: number
  header: Record<string, string>
  cookies: string[]
}

/** 统一响应结构（经过拦截器处理后的最终返回值） */
interface HttpResponse<T = any> {
  /** 响应数据 */
  data: T
  /** HTTP 状态码 */
  statusCode: number
  /** 响应头 */
  header: Record<string, string>
  /** 业务状态码（从响应体中提取，需根据实际接口调整） */
  code?: number
  /** 业务消息 */
  message?: string
  /** 是否成功（状态码 200-299 且业务 code 为 0/success） */
  success: boolean
}

/** 创建请求实例的选项 */
interface CreateRequestOptions {
  /** 基础 URL */
  baseURL?: string
  /** 默认超时时间（毫秒） */
  timeout?: number
  /** 默认请求头 */
  header?: Record<string, string>
  /** 请求拦截器数组 */
  requestInterceptors?: RequestInterceptor[]
  /** 响应拦截器数组 */
  responseInterceptors?: ResponseInterceptor[]
}

// ============================================================
// 工具函数
// ============================================================

/**
 * 拼接 URL 查询参数
 * @param url 原始 URL
 * @param params 查询参数对象
 * @returns 拼接后的 URL
 */
function stringifyParams(url: string, params?: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0)
    return url

  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')

  if (!query)
    return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}${query}`
}

/**
 * 判断 HTTP 状态码是否表示成功
 */
function isSuccessStatus(statusCode: number): boolean {
  return statusCode >= 200 && statusCode < 300
}

// ============================================================
// 默认拦截器
// ============================================================

/**
 * 默认请求拦截器：注入 Token
 * 在将请求发送出去之前，自动从 authStore 读取 token 并附加到请求头
 */
const defaultRequestInterceptor: RequestInterceptor = {
  onFulfilled: (config: RequestConfig) => {
    // 默认带 token，可通过 withToken: false 关闭
    if (config.withToken !== false) {
      try {
        const authStore = useAuthStore()
        if (authStore.isAuthenticated && authStore.token) {
          config.header = {
            ...config.header,
            Authorization: `Bearer ${authStore.token}`,
          }
        }
      }
      catch {
        // useAuthStore 可能不在 setup 上下文中，忽略
      }
    }
    return config
  },
}

/**
 * 默认响应拦截器：统一提取数据、处理业务错误
 */
const defaultResponseInterceptor: ResponseInterceptor = {
  onFulfilled: (response: UniSuccessResult) => {
    const { statusCode, data } = response

    // 构造统一响应结构
    const httpResponse: HttpResponse = {
      data,
      statusCode,
      header: response.header,
      success: isSuccessStatus(statusCode),
    }

    // 提取常见业务状态码（根据后端接口规范调整字段名）
    if (data && typeof data === 'object') {
      httpResponse.code = data.code ?? data.status ?? data.errCode
      httpResponse.message = data.message ?? data.msg ?? data.errMsg
    }

    // 401 未授权，可能 token 过期或无效，触发登出流程
    if (statusCode === 401) {
      try {
        const authStore = useAuthStore()
        authStore.logout()
        const pages = getCurrentPages()
        const currentPageRoute = pages[pages.length - 1]?.route
        if (currentPageRoute && currentPageRoute !== 'pages/login/index') {
          uni.setStorageSync('auth_redirect', `/${currentPageRoute}`)
        }
      }
      catch {
        // useAuthStore 可能不在 setup 上下文中，忽略
      }
    }

    return httpResponse
  },
  onRejected: (error: any) => {
    // 网络错误或请求异常
    const httpResponse: HttpResponse = {
      data: null as any,
      statusCode: 0,
      header: {},
      success: false,
      code: -1,
      message: error?.errMsg || '网络连接失败，请检查网络后重试',
    }
    return httpResponse
  },
}

// ============================================================
// 请求实例
// ============================================================

/**
 * 创建请求实例
 * 每个实例拥有独立的拦截器链和基础配置
 *
 * @param options 创建选项
 * @returns 请求实例对象（包含 get/post/put/delete 等方法）
 *
 * @example
 * ```typescript
 * const api = createRequest({ baseURL: 'https://api.example.com' })
 * const res = await api.get('/user', { id: 1 })
 * ```
 */
export function createRequest(options: CreateRequestOptions = {}) {
  const {
    baseURL = '',
    timeout = 30000,
    header = {},
    requestInterceptors = [],
    responseInterceptors = [],
  } = options

  // 合并拦截器（默认拦截器在前，用户自定义拦截器在后）
  const reqInterceptors = [defaultRequestInterceptor, ...requestInterceptors]
  const resInterceptors = [defaultResponseInterceptor, ...responseInterceptors]

  /**
   * 执行请求拦截器链
   */
  async function runRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let currentConfig = { ...config }
    for (const interceptor of reqInterceptors) {
      try {
        if (interceptor.onFulfilled) {
          currentConfig = await interceptor.onFulfilled(currentConfig)
        }
      }
      catch (error) {
        if (interceptor.onRejected) {
          return interceptor.onRejected(error)
        }
        throw error
      }
    }
    return currentConfig
  }

  /**
   * 执行响应拦截器链
   */
  async function runResponseInterceptors(response: any): Promise<any> {
    let currentResponse = response
    for (const interceptor of resInterceptors) {
      try {
        if (interceptor.onFulfilled) {
          currentResponse = await interceptor.onFulfilled(currentResponse)
        }
      }
      catch (error) {
        if (interceptor.onRejected) {
          return interceptor.onRejected(error)
        }
        throw error
      }
    }
    return currentResponse
  }

  /**
   * 核心请求方法
   * 封装 uni.request，串联拦截器链
   */
  async function request<T = any>(config: RequestConfig): Promise<HttpResponse<T>> {
    // 合并配置：实例级别配置 + 单次请求配置
    const mergedConfig: RequestConfig = {
      ...config,
      header: { ...header, ...config.header },
      timeout: config.timeout ?? timeout,
    }

    // 执行请求拦截器链
    const finalConfig = await runRequestInterceptors(mergedConfig)

    // 拼接完整 URL
    const finalBaseURL = finalConfig.baseURL || baseURL
    const fullURL = `${finalBaseURL}${finalConfig.url}`
    const requestURL = stringifyParams(fullURL, finalConfig.params)

    // 发起请求（使用 uni.request 的 Promise 包装）
    return new Promise((resolve, reject) => {
      uni.request({
        url: requestURL,
        method: (finalConfig.method || 'GET') as any,
        data: finalConfig.data,
        header: finalConfig.header || {},
        timeout: finalConfig.timeout || 10000,
        dataType: finalConfig.dataType || 'json',
        responseType: finalConfig.responseType || 'text',
        success: async (res) => {
          try {
            // 执行响应拦截器链
            const result = await runResponseInterceptors(res)
            resolve(result)
          }
          catch (error) {
            reject(error)
          }
        },
        fail: async (err) => {
          try {
            // 即使请求失败也走拦截器（让拦截器统一格式化错误）
            const result = await runResponseInterceptors(err)
            resolve(result)
          }
          catch (error) {
            reject(error)
          }
        },
      })
    })
  }

  // ===== 快捷方法 =====

  /**
   * 发送 GET 请求
   * @param url 请求地址
   * @param params URL 查询参数
   * @param config 额外请求配置
   */
  function get<T = any>(
    url: string,
    params?: Record<string, any>,
    config?: Partial<RequestConfig>,
  ): Promise<HttpResponse<T>> {
    return request<T>({ ...config, url, method: 'GET', params })
  }

  /**
   * 发送 POST 请求
   * @param url 请求地址
   * @param data 请求体数据
   * @param config 额外请求配置
   */
  function post<T = any>(
    url: string,
    data?: Record<string, any>,
    config?: Partial<RequestConfig>,
  ): Promise<HttpResponse<T>> {
    return request<T>({ ...config, url, method: 'POST', data })
  }

  /**
   * 发送 PUT 请求
   * @param url 请求地址
   * @param data 请求体数据
   * @param config 额外请求配置
   */
  function put<T = any>(
    url: string,
    data?: Record<string, any>,
    config?: Partial<RequestConfig>,
  ): Promise<HttpResponse<T>> {
    return request<T>({ ...config, url, method: 'PUT', data })
  }

  /**
   * 发送 DELETE 请求
   * @param url 请求地址
   * @param params URL 查询参数
   * @param config 额外请求配置
   */
  function del<T = any>(
    url: string,
    params?: Record<string, any>,
    config?: Partial<RequestConfig>,
  ): Promise<HttpResponse<T>> {
    return request<T>({ ...config, url, method: 'DELETE', params })
  }

  return {
    request,
    get,
    post,
    put,
    del,
  }
}

// ============================================================
// 默认请求实例（导出单例）
// ============================================================

/**
 * 默认 HTTP 请求实例
 * - baseURL: 默认 API 基础地址
 * - 自动注入 auth token
 * - 统一处理响应格式和错误
 *
 * 可通过 .env / .env.development / .env.production 文件配置环境变量
 * 如果后端有固定 baseURL，可使用 createRequest 创建自定义实例
 */
export const http = createRequest({
  baseURL: 'http://192.168.20.252:9999',
})

export type { CreateRequestOptions, HttpMethod, HttpResponse, RequestConfig, RequestInterceptor, ResponseInterceptor }
