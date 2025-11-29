/**
 * 停车超时监控API接口
 * 基于统一的API配置，提供完整的错误处理、重试机制和用户信息传递
 */
import { timeoutMonitoringAPI } from '@/config/api.js'

/**
 * 获取2小时内活跃车辆数量
 * @returns {Promise} 接口响应
 */
export const getRecentActiveCount = () => {
  return timeoutMonitoringAPI.getRecentActiveCount()
}

/**
 * 检查2小时内超时车辆
 * @returns {Promise} 接口响应
 */
export const checkRecentTimeout = () => {
  return timeoutMonitoringAPI.checkRecentTimeout()
}

/**
 * 🆕 检查5分钟内即将超时的车辆
 * @returns {Promise} 接口响应
 */
export const checkTimeout5Minutes = () => {
  return timeoutMonitoringAPI.checkTimeout5Minutes()
}

/**
 * 🆕 检查1分钟内即将超时的车辆  
 * @returns {Promise} 接口响应
 */
export const checkTimeout1Minute = () => {
  return timeoutMonitoringAPI.checkTimeout1Minute()
}

/**
 * 🆕 检查指定分钟数内即将超时的车辆
 * @param {number} minutes - 剩余分钟数
 * @returns {Promise} 接口响应
 */
export const checkTimeoutByMinutes = (minutes) => {
  return timeoutMonitoringAPI.checkTimeoutByMinutes(minutes)
}

/**
 * 发送超时通知
 * @param {Object} vehicle - 超时车辆信息
 * @param {string} vehicle.plateNumber - 车牌号
 * @param {string} vehicle.visitorName - 访客姓名
 * @param {number} vehicle.remainingMinutes - 剩余分钟数
 * @param {number} vehicle.overtimeMinutes - 超时分钟数
 * @param {string} vehicle.parkName - 停车场名称
 * @param {string} vehicle.notificationType - 通知类型
 * @returns {Promise} 接口响应
 */
export const sendTimeoutNotification = (vehicle) => {
  return timeoutMonitoringAPI.sendTimeoutNotification(vehicle)
}

// 为了保持向后兼容，同时导出 API 对象
export { timeoutMonitoringAPI } from '@/config/api.js' 