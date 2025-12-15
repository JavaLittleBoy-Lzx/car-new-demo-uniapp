/**
 * 时间工具类 - 用于自动生成最近的模拟时间数据
 * @author 雪人停车团队
 */

class TimeUtils {
  constructor() {
    this.baseTime = new Date(); // 当前时间作为基准
    this.timeCounter = 0; // 时间计数器，确保每个时间都不同
  }

  /**
   * 格式化时间为指定格式
   * @param {Date} date 日期对象
   * @param {string} format 格式 'YYYY-MM-DD HH:mm:ss' | 'YYYY-MM-DD' | 'HH:mm'
   * @returns {string} 格式化后的时间字符串
   */
  formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    switch (format) {
      case 'YYYY-MM-DD HH:mm:ss':
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'HH:mm':
        return `${hours}:${minutes}`;
      case 'YYYY-MM-DD HH:mm':
        return `${year}-${month}-${day} ${hours}:${minutes}`;
      default:
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
  }

  /**
   * 生成最近N天内的随机时间
   * @param {number} daysAgo 几天前 (0=今天, 1=昨天, 2=前天...)
   * @param {string} format 时间格式
   * @returns {string} 格式化的时间字符串
   */
  getRecentTime(daysAgo = 0, format = 'YYYY-MM-DD HH:mm:ss') {
    const targetDate = new Date(this.baseTime);
    targetDate.setDate(targetDate.getDate() - daysAgo);
    
    // 添加随机的小时和分钟，让时间更真实
    const randomHour = Math.floor(Math.random() * 24);
    const randomMinute = Math.floor(Math.random() * 60);
    const randomSecond = Math.floor(Math.random() * 60);
    
    targetDate.setHours(randomHour, randomMinute, randomSecond);
    
    // 加上计数器确保每次调用的时间都不同
    targetDate.setSeconds(targetDate.getSeconds() + this.timeCounter);
    this.timeCounter++;
    
    return this.formatDate(targetDate, format);
  }

  /**
   * 生成一组连续的时间数据
   * @param {number} count 需要生成的时间数量
   * @param {string} format 时间格式
   * @param {number} maxDaysAgo 最多几天前
   * @returns {Array<string>} 时间字符串数组
   */
  generateTimeList(count, format = 'YYYY-MM-DD HH:mm:ss', maxDaysAgo = 10) {
    const timeList = [];
    for (let i = 0; i < count; i++) {
      const daysAgo = Math.floor(Math.random() * maxDaysAgo);
      timeList.push(this.getRecentTime(daysAgo, format));
    }
    return timeList.sort((a, b) => new Date(b) - new Date(a)); // 按时间倒序排列
  }

  /**
   * 生成成对的时间（如创建时间和支付时间）
   * @param {number} count 需要生成几对时间
   * @param {string} format 时间格式
   * @param {number} intervalMinutes 两个时间之间的间隔分钟数
   * @returns {Array<{createTime: string, paidTime: string}>}
   */
  generateTimePairs(count, format = 'YYYY-MM-DD HH:mm:ss', intervalMinutes = 5) {
    const pairs = [];
    for (let i = 0; i < count; i++) {
      const createTime = this.getRecentTime(i, format);
      const createDate = new Date(createTime);
      const paidDate = new Date(createDate.getTime() + intervalMinutes * 60 * 1000);
      const paidTime = this.formatDate(paidDate, format);
      
      pairs.push({
        createTime,
        paidTime
      });
    }
    return pairs;
  }

  /**
   * 自动更新对象中的时间字段
   * @param {Object|Array} data 要更新的数据
   * @param {Array<string>} timeFields 时间字段名数组，如 ['createTime', 'paidTime']
   * @param {string} format 时间格式
   * @returns {Object|Array} 更新后的数据
   */
  updateTimeFields(data, timeFields = ['createTime', 'paidTime'], format = 'YYYY-MM-DD HH:mm:ss') {
    if (Array.isArray(data)) {
      // 如果是数组，递归处理每个元素
      return data.map((item, index) => this.updateTimeFields(item, timeFields, format));
    } else if (typeof data === 'object' && data !== null) {
      // 如果是对象，更新时间字段
      const updatedData = { ...data };
      
      timeFields.forEach((field, index) => {
        if (updatedData.hasOwnProperty(field)) {
          updatedData[field] = this.getRecentTime(index, format);
        }
      });
      
      return updatedData;
    }
    
    return data;
  }

  /**
   * 预设的时间模板生成器
   */
  presets = {
    // 订单时间模板
    orderTimes: (count = 10) => {
      return this.generateTimePairs(count, 'YYYY-MM-DD HH:mm:ss', 3);
    },
    
    // 预约时间模板  
    appointmentTimes: (count = 10) => {
      const times = [];
      for (let i = 0; i < count; i++) {
        times.push({
          appointmentTime: this.getRecentTime(i, 'YYYY-MM-DD HH:mm'),
          createTime: this.getRecentTime(i, 'YYYY-MM-DD HH:mm:ss'),
          time: this.getRecentTime(i, 'YYYY-MM-DD HH:mm:ss')
        });
      }
      return times;
    },
    
    // 违规记录时间模板
    violationTimes: (count = 10) => {
      const times = [];
      for (let i = 0; i < count; i++) {
        const baseTime = this.getRecentTime(i, 'YYYY-MM-DD HH:mm:ss');
        const baseDate = new Date(baseTime);
        const appointmentDate = new Date(baseDate.getTime() - 30 * 60 * 1000); // 预约时间早30分钟
        const leaveDate = new Date(baseDate.getTime() + 2 * 60 * 60 * 1000); // 离开时间晚2小时
        
        times.push({
          time: baseTime,
          appointmentTime: this.formatDate(appointmentDate, 'YYYY-MM-DD HH:mm'),
          enterTime: baseTime,
          leaveTime: this.formatDate(leaveDate, 'YYYY-MM-DD HH:mm:ss')
        });
      }
      return times;
    }
  };

  /**
   * 重置时间计数器
   */
  reset() {
    this.timeCounter = 0;
    this.baseTime = new Date();
  }
}

// 创建单例实例
const timeUtils = new TimeUtils();

// 导出常用方法
export default timeUtils;

// 导出便捷方法
export const getRecentTime = (daysAgo = 0, format = 'YYYY-MM-DD HH:mm:ss') => {
  return timeUtils.getRecentTime(daysAgo, format);
};

export const updateTimeFields = (data, timeFields = ['createTime', 'paidTime'], format = 'YYYY-MM-DD HH:mm:ss') => {
  return timeUtils.updateTimeFields(data, timeFields, format);
};

export const generateOrderTimes = (count = 10) => {
  return timeUtils.presets.orderTimes(count);
};

export const generateAppointmentTimes = (count = 10) => {
  return timeUtils.presets.appointmentTimes(count);
};

export const generateViolationTimes = (count = 10) => {
  return timeUtils.presets.violationTimes(count);
}; 