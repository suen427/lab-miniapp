/**
 * 认证相关 API 接口
 * 包含登录、登出等认证相关的接口调用
 */

/** 登录请求参数 */
export interface LoginRequest {
  /** 账号 */
  userName: string
  /** 密码 */
  password: string
}

/** 登录响应中的数据部分 */
export interface LoginResult {
  /** 认证 Token */
  access_token: string
  /** Token 有效时间 */
  expires_in: number
}

/** 登录响应结构 */
export interface LoginResponse {
  /** 业务状态码（0 表示成功） */
  code: number
  /** 响应消息 */
  message: string
  /** 响应数据 */
  data: LoginResult
}

/**
 * 当前登录用户信息
 */
export interface UserInfoData {
  /** 用户 ID */
  id: string
  /** 账号 */
  userName: string
  /** 姓名 */
  fullName: string
  /** 角色名称 */
  roleName: string
  /** 手机号 */
  phoneNumber: string | null
  /** 邮箱 */
  email: string | null
  /** 部门 ID */
  departmentId: string | null
  /** 部门名称 */
  departmentName: string | null
  /** 描述 */
  description: string | null
  /** 角色 ID 列表 */
  roleIds: string[]
}

/** 获取当前登录用户信息响应结构 */
export interface GetLoginUserResponse {
  /** 业务状态码（0 表示成功） */
  code: number
  /** 响应消息 */
  message: string
  /** 响应数据 */
  data: UserInfoData
}

/**
 * 账号密码登录
 * @param params 登录参数（账号、密码）
 * @returns 登录响应
 */
export function loginApi(params: LoginRequest) {
  return http.post<LoginResponse>('/api/Account/login', params)
}

/**
 * 获取当前登录用户信息
 * @returns 当前登录用户信息
 */
export function getLoginUserApi() {
  return http.get<GetLoginUserResponse>('/api/Account/getloginuser')
}
