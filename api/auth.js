/**
 * 认证相关API接口
 */
import { http } from '@/util/request/index.js'

/**
 * 微信手机号授权登录
 * @param {Object} params - 授权参数
 * @param {string} params.code - 微信登录凭证
 * @param {string} params.encryptedData - 加密手机号数据
 * @param {string} params.iv - 加密初始向量
 * @returns {Promise} 接口响应
 */
export const phoneAuth = (params) => {
  return http({
    url: '/parking/wechat/phoneAuth',
    method: 'POST',
    data: params
  })
}

/**
 * 检查用户权限
 * @param {string} openid - 用户openid
 * @returns {Promise} 接口响应
 */
export const checkPermission = (openid) => {
  return http({
    url: `/parking/wechat/checkPermission?openid=${openid}`,
    method: 'GET'
  })
}

/**
 * 管家二维码验证（可选）
 * @param {Object} params - 验证参数
 * @param {string} params.butlerId - 管家ID
 * @param {string} params.timestamp - 时间戳
 * @param {string} params.applyKind - 申请类型
 * @returns {Promise} 接口响应
 */
export const verifyManagerCode = (params) => {
  return http({
    url: '/parking/wechat/verifyManagerCode',
    method: 'POST',
    data: params
  })
}

/**
 * 获取用户角色信息
 * @param {string} phone - 手机号
 * @returns {Promise} 接口响应
 */
export const getUserRole = (phone) => {
  return http({
    url: `/parking/wechat/getUserRole?phone=${phone}`,
    method: 'GET'
  })
}

/**
 * 更新用户信息
 * @param {Object} params - 用户信息
 * @returns {Promise} 接口响应
 */
export const updateUserInfo = (params) => {
  return http({
    url: '/parking/wechat/updateUserInfo',
    method: 'POST',
    data: params
  })
}

/**
 * 刷新用户权限
 * @param {string} openid - 用户openid
 * @returns {Promise} 接口响应
 */
export const refreshPermissions = (openid) => {
  return http({
    url: `/parking/wechat/refreshPermissions?openid=${openid}`,
    method: 'GET'
  })
} 