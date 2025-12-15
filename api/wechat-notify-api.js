/**
 * 微信模板消息通知API
 * 用于发送各种停车相关的微信通知
 */

const BASE_URL = 'https://www.xuerparking.cn:8543/api/wechat/send';

/**
 * 发送违规停车告警通知
 * @param {Object} params - 通知参数
 * @param {string} params.plateNumber - 车牌号
 * @param {string} params.parkName - 停车场名称
 * @param {string} params.violationLocation - 违规地点
 * @param {string} params.parkingDuration - 停车时长
 * @param {string} params.managerNickname - 管家昵称
 * @returns {Promise} 发送结果
 */
export function sendViolationNotification(params) {
  return uni.request({
    url: `${BASE_URL}/violation-notification`,
    method: 'POST',
    header: {
      'Content-Type': 'application/json'
    },
    data: {
      plateNumber: params.plateNumber,
      parkName: params.parkName,
      violationLocation: params.violationLocation,
      parkingDuration: params.parkingDuration,
      managerNickname: params.managerNickname
    }
  }).then(response => {
    console.log('🔔 违规停车告警通知发送结果:', response);
    
    // 处理响应数据，返回统一格式
    if (response.statusCode === 200 && response.data) {
      return {
        success: response.data.success !== false,
        message: response.data.message || '通知发送成功',
        data: response.data
      };
    } else {
      return {
        success: false,
        message: '网络请求失败',
        data: response
      };
    }
  }).catch(error => {
    console.error('❌ 违规停车告警通知发送失败:', error);
    return {
      success: false,
      message: error.message || '发送失败',
      error: error
    };
  });
}

/**
 * 发送预约车辆待审核提醒
 * @param {Object} params - 通知参数
 * @param {string} params.plateNumber - 车牌号
 * @param {string} params.parkName - 停车场名称
 * @param {string} params.bookerName - 预约人姓名
 * @param {string} params.contactPhone - 联系电话
 * @param {string} params.managerNickname - 管家昵称
 * @returns {Promise} 发送结果
 */
export function sendBookingPendingNotification(params) {
  return uni.request({
    url: `${BASE_URL}/booking-pending-notification`,
    method: 'POST',
    header: {
      'Content-Type': 'application/json'
    },
    data: {
      plateNumber: params.plateNumber,
      parkName: params.parkName,
      bookerName: params.bookerName,
      contactPhone: params.contactPhone,
      managerNickname: params.managerNickname
    }
  }).then(response => {
    console.log('🔔 预约待审核提醒发送结果:', response);
    
    // 处理响应数据，返回统一格式
    if (response.statusCode === 200 && response.data) {
      return {
        success: response.data.success !== false,
        message: response.data.message || '通知发送成功',
        data: response.data
      };
    } else {
      return {
        success: false,
        message: '网络请求失败',
        data: response
      };
    }
  }).catch(error => {
    console.error('❌ 预约待审核提醒发送失败:', error);
    return {
      success: false,
      message: error.message || '发送失败',
      error: error
    };
  });
}

/**
 * 发送停车进场通知
 * @param {Object} params - 通知参数
 * @param {string} params.plateNumber - 车牌号
 * @param {string} params.parkName - 停车场名称
 * @param {string} params.enterChannel - 进场通道
 * @param {string} params.enterTime - 进场时间
 * @param {string} params.managerNickname - 管家昵称
 * @returns {Promise} 发送结果
 */
export function sendParkingEnterNotification(params) {
  return uni.request({
    url: `${BASE_URL}/parking-enter-notification`,
    method: 'POST',
    header: {
      'Content-Type': 'application/json'
    },
    data: {
      plateNumber: params.plateNumber,
      parkName: params.parkName,
      enterChannel: params.enterChannel,
      enterTime: params.enterTime,
      managerNickname: params.managerNickname
    }
  }).then(response => {
    console.log('🔔 停车进场通知发送结果:', response);
    
    // 处理响应数据，返回统一格式
    if (response.statusCode === 200 && response.data) {
      return {
        success: response.data.success !== false,
        message: response.data.message || '通知发送成功',
        data: response.data
      };
    } else {
      return {
        success: false,
        message: '网络请求失败',
        data: response
      };
    }
  }).catch(error => {
    console.error('❌ 停车进场通知发送失败:', error);
    return {
      success: false,
      message: error.message || '发送失败',
      error: error
    };
  });
}

/**
 * 发送停车离场通知
 * @param {Object} params - 通知参数
 * @param {string} params.plateNumber - 车牌号
 * @param {string} params.parkName - 停车场名称
 * @param {string} params.leaveTime - 离场时间
 * @param {string} params.enterTime - 进场时间
 * @param {string} params.managerNickname - 管家昵称
 * @param {string} params.leaveChannel - 离场通道
 * @returns {Promise} 发送结果
 */
export function sendParkingLeaveNotification(params) {
  return uni.request({
    url: `${BASE_URL}/parking-leave-notification`,
    method: 'POST',
    header: {
      'Content-Type': 'application/json'
    },
    data: {
      plateNumber: params.plateNumber,
      parkName: params.parkName,
      leaveTime: params.leaveTime,
      enterTime: params.enterTime,
      managerNickname: params.managerNickname,
      leaveChannel: params.leaveChannel
    }
  }).then(response => {
    console.log('🔔 停车离场通知发送结果:', response);
    
    // 处理响应数据，返回统一格式
    if (response.statusCode === 200 && response.data) {
      return {
        success: response.data.success !== false,
        message: response.data.message || '通知发送成功',
        data: response.data
      };
    } else {
      return {
        success: false,
        message: '网络请求失败',
        data: response
      };
    }
  }).catch(error => {
    console.error('❌ 停车离场通知发送失败:', error);
    return {
      success: false,
      message: error.message || '发送失败',
      error: error
    };
  });
}

/**
 * 发送停车即将超时提醒
 * @param {Object} params - 通知参数
 * @param {string} params.plateNumber - 车牌号
 * @param {string} params.parkName - 停车场名称
 * @param {string} params.enterTime - 进场时间
 * @param {string} params.managerNickname - 管家昵称
 * @param {number} params.overtimeMinutes - 超时分钟数
 * @returns {Promise} 发送结果
 */
export function sendParkingTimeoutNotification(params) {
  return uni.request({
    url: `${BASE_URL}/parking-timeout-notification`,
    method: 'POST',
    header: {
      'Content-Type': 'application/json'
    },
    data: {
      plateNumber: params.plateNumber,
      parkName: params.parkName,
      enterTime: params.enterTime,
      managerNickname: params.managerNickname,
      overtimeMinutes: params.overtimeMinutes
    }
  }).then(response => {
    console.log('🔔 停车超时提醒发送结果:', response);
    
    // 处理响应数据，返回统一格式
    if (response.statusCode === 200 && response.data) {
      return {
        success: response.data.success !== false,
        message: response.data.message || '通知发送成功',
        data: response.data
      };
    } else {
      return {
        success: false,
        message: '网络请求失败',
        data: response
      };
    }
  }).catch(error => {
    console.error('❌ 停车超时提醒发送失败:', error);
    return {
      success: false,
      message: error.message || '发送失败',
      error: error
    };
  });
}

/**
 * 通用的微信通知发送函数
 * @param {string} notificationType - 通知类型
 * @param {Object} params - 通知参数
 * @returns {Promise} 发送结果
 */
export function sendWeChatNotification(notificationType, params) {
  switch (notificationType) {
    case 'violation':
      return sendViolationNotification(params);
    case 'booking-pending':
      return sendBookingPendingNotification(params);
    case 'parking-enter':
      return sendParkingEnterNotification(params);
    case 'parking-leave':
      return sendParkingLeaveNotification(params);
    case 'parking-timeout':
      return sendParkingTimeoutNotification(params);
    default:
      return Promise.reject(new Error(`不支持的通知类型: ${notificationType}`));
  }
}

/**
 * 批量发送微信通知
 * @param {Array} notifications - 通知列表
 * @returns {Promise} 批量发送结果
 */
export function sendBatchWeChatNotifications(notifications) {
  const promises = notifications.map(notification => {
    return sendWeChatNotification(notification.type, notification.params);
  });
  
  return Promise.allSettled(promises).then(results => {
    const successful = results.filter(result => result.status === 'fulfilled');
    const failed = results.filter(result => result.status === 'rejected');
    
    console.log(`📊 批量发送结果: 成功 ${successful.length} 个, 失败 ${failed.length} 个`);
    
    return {
      successful: successful.length,
      failed: failed.length,
      results: results
    };
  });
} 