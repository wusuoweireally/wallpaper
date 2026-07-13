/**
 * 登录/注册/改密请求体构造，与后端 DTO 对齐：
 * - LoginDto: account + password
 * - CreateUserDto: username + password (+ optional email)，无数字账号 id
 * - ChangePasswordDto: currentPassword + newPassword
 */

export interface LoginPayload {
  account: string
  password: string
}

export interface RegisterPayload {
  username: string
  password: string
  email?: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export function buildLoginPayload(account: string, password: string): LoginPayload {
  return {
    account: account.trim(),
    password,
  }
}

export function buildRegisterPayload(
  username: string,
  password: string,
  email?: string,
): RegisterPayload {
  const payload: RegisterPayload = {
    username: username.trim(),
    password,
  }
  const normalizedEmail = email?.trim()
  if (normalizedEmail) {
    payload.email = normalizedEmail
  }
  return payload
}

export function buildChangePasswordPayload(
  currentPassword: string,
  newPassword: string,
): ChangePasswordPayload {
  return {
    currentPassword,
    newPassword,
  }
}

/** 与后端 CreateUserDto / ChangePasswordDto 密码长度一致 */
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 64

export function isPasswordLengthValid(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH
}
