/**
 * 停车超时监控工具类
 * 实现全局的、按需的、智能的超时检查
 */
import * as timeoutAPI from '@/api/timeout-monitoring.js'
import AuthUtils from '@/utils/auth.js'

class TimeoutMonitoringUtils {
  
  constructor() {
    this.monitoringTimer = null
    this.isMonitoring = false
    this.recentActiveCount = 0
    this.lastCheckTime = null
    this.checkInterval = 1 * 60 * 1000 // 默认1分钟检查一次
    this.maxRetryCount = 3
    this.retryCount = 0
    this.autoMode = true // 🔄 设置为自动运行模式
    
    console.log('🔄 [TimeoutMonitoring] 监控工具类初始化完成 - 自动运行模式')
  }

  /**
   * 检查是否需要启动监控
   */
  async shouldStartMonitoring() {
    try {
      // 1. 检查用户角色权限
      if (!this.hasMonitoringPermission()) {
        console.log('🚫 [TimeoutMonitoring] 用户无监控权限')
        return false
      }

      // 2. 检查网络状态
      const networkStatus = await this.checkNetworkStatus()
      if (!networkStatus) {
        console.log('📡 [TimeoutMonitoring] 网络不可用，暂停监控')
        return false
      }

      // 3. 查询2小时内活跃车辆数量
      const response = await timeoutAPI.getRecentActiveCount()
      console.log("response",response)
      if (response.data.code === "0") {
        this.recentActiveCount = response.data.data || 0
        console.log(`📊 [TimeoutMonitoring] 2小时内活跃车辆: ${this.recentActiveCount}辆`)
        return this.recentActiveCount > 0
      } else {
        console.warn('⚠️ [TimeoutMonitoring] 获取活跃车辆数量失败:', response.data.data.message)
        return false
      }
      
    } catch (error) {
      console.error('❌ [TimeoutMonitoring] 检查监控条件失败:', error)
      return false
    }
  }

  /**
   * 检查用户是否有监控权限
   */
  hasMonitoringPermission() {
    const currentRole = AuthUtils.getCurrentRole()
    console.log('🔍 [TimeoutMonitoring] 检查用户角色权限:', currentRole)
    
    // 🔧 修复：正确处理null角色
    if (!currentRole) {
      console.log('🚫 [TimeoutMonitoring] 用户未登录或角色信息缺失')
      return false
    }
    
    // 只有管家和业主有监控权限
    const hasPermission = ['manager', 'owner'].includes(currentRole)
    console.log(`🔍 [TimeoutMonitoring] 角色权限检查结果: ${currentRole} -> ${hasPermission}`)
    return hasPermission
  }

  /**
   * 检查网络状态
   */
  async checkNetworkStatus() {
    return new Promise((resolve) => {
      uni.getNetworkType({
        success: (res) => {
          resolve(res.networkType !== 'none')
        },
        fail: () => {
          resolve(false)
        }
      })
    })
  }

  /**
   * 启动监控
   */
  async startMonitoring() {
    console.log('🟡 [TimeoutMonitoring] 尝试启动监控...')
    
    if (this.monitoringTimer) {
      console.log('🟡 [TimeoutMonitoring] 清除现有定时器')
      clearInterval(this.monitoringTimer)
    }

    const shouldStart = await this.shouldStartMonitoring()
    console.log(`🔍 [TimeoutMonitoring] 监控启动条件检查: ${shouldStart}`)
    
    if (!shouldStart) {
      console.log('🔴 [TimeoutMonitoring] 不满足监控启动条件')
      return false
    }

    // 动态调整检查频率
    this.checkInterval = this.calculateCheckInterval()
    
    this.isMonitoring = true
    this.retryCount = 0
    
    console.log(`🟢 [TimeoutMonitoring] 启动超时监控 - 检查频率: ${this.checkInterval/60000}分钟`)
    console.log(`📊 [TimeoutMonitoring] 活跃车辆数量: ${this.recentActiveCount}辆`)

    // 立即执行一次检查
    console.log('🔍 [TimeoutMonitoring] 立即执行首次检查')
    this.performTimeoutCheck()

    // 设置定时器
    this.monitoringTimer = setInterval(() => {
      console.log('⏰ [TimeoutMonitoring] 定时器触发，执行检查')
      this.performTimeoutCheck()
    }, this.checkInterval)
    
    console.log(`✅ [TimeoutMonitoring] 监控已启动，定时器ID: ${this.monitoringTimer}`)

    return true
  }

  /**
   * 停止监控
   */
  stopMonitoring() {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer)
      this.monitoringTimer = null
    }
    
    this.isMonitoring = false
    this.recentActiveCount = 0
    
    console.log('🔴 [TimeoutMonitoring] 停止超时监控')
  }

  /**
   * 执行超时检查
   */
  async performTimeoutCheck() {
    try {
      console.log(`🔍 [TimeoutMonitoring] 执行超时检查 - 活跃车辆: ${this.recentActiveCount}辆`)

      // 检查网络状态
      const networkStatus = await this.checkNetworkStatus()
      if (!networkStatus) {
        console.log('📡 [TimeoutMonitoring] 网络不可用，跳过此次检查')
        return
      }

      // 执行超时检查
      const response = await timeoutAPI.checkRecentTimeout()
      
      if (response.code === 200) {
        const result = response.data || {}
        this.lastCheckTime = new Date()
        this.retryCount = 0 // 重置重试计数

        // 🆕 处理后端返回的数据结构
        const almostTimeoutVehicles = result.almostTimeoutVehicles || []
        const timeoutVehicles = result.timeoutVehicles || []
        const allVehicles = [...almostTimeoutVehicles, ...timeoutVehicles]

        console.log(`📊 [TimeoutMonitoring] 检查结果 - 即将超时: ${almostTimeoutVehicles.length}辆, 已超时: ${timeoutVehicles.length}辆`)
        console.log(`📊 [TimeoutMonitoring] 通知发送统计 - 成功: ${result.successCount || 0}, 失败: ${result.failCount || 0}`)

        if (allVehicles.length > 0) {
          console.log(`⚠️ [TimeoutMonitoring] 发现${allVehicles.length}辆需要关注的车辆`)
          await this.handleTimeoutVehicles(allVehicles)
        } else {
          console.log('✅ [TimeoutMonitoring] 暂无超时车辆')
        }

        // 更新活跃车辆数量
        this.recentActiveCount = result.totalActive || 0
        
        // 如果没有活跃车辆了，停止监控
        if (this.recentActiveCount === 0) {
          this.stopMonitoring()
          console.log('🔴 [TimeoutMonitoring] 无活跃车辆，停止监控')
        }
        
      } else {
        console.warn('⚠️ [TimeoutMonitoring] 超时检查失败:', response.message)
        this.handleCheckFailure()
      }
      
    } catch (error) {
      console.error('❌ [TimeoutMonitoring] 超时检查异常:', error)
      this.handleCheckFailure()
    }
  }

  /**
   * 处理检查失败情况
   */
  handleCheckFailure() {
    this.retryCount++
    
    if (this.retryCount >= this.maxRetryCount) {
      console.log('❌ [TimeoutMonitoring] 连续失败次数过多，暂时停止监控')
      this.stopMonitoring()
      
      // 2分钟后重新尝试启动监控
      setTimeout(() => {
        console.log('🔄 [TimeoutMonitoring] 重新尝试启动监控')
        this.checkAndStartMonitoring()
      }, 2 * 60 * 1000)
    }
  }

  /**
   * 更新活跃车辆数量
   */
  async updateActiveCount() {
    try {
      const response = await timeoutAPI.getRecentActiveCount()
      if (response.code === 200) {
        this.recentActiveCount = response.data || 0
      }
    } catch (error) {
      console.warn('⚠️ [TimeoutMonitoring] 更新活跃车辆数量失败:', error)
    }
  }

  /**
   * 处理超时车辆
   */
  async handleTimeoutVehicles(timeoutVehicles) {
    for (const vehicle of timeoutVehicles) {
      try {
        // 🔄 后端已在检查接口中自动发送通知，这里只显示用户提醒
        console.log(`📱 [TimeoutMonitoring] 处理超时车辆: ${vehicle.plateNumber || vehicle.platenumber}`);
        
        // 显示用户提醒
        await this.showTimeoutAlert(vehicle, timeoutVehicles.length)
        
        // 🆕 如果需要额外的前端通知发送，可以调用
        // const notificationSent = vehicle.notificationSent;
        // if (!notificationSent) {
        //   await this.sendTimeoutNotification(vehicle);
        // }
        
      } catch (error) {
        console.error('❌ [TimeoutMonitoring] 处理超时车辆失败:', error)
      }
    }
  }

  /**
   * 发送超时通知
   */
  async sendTimeoutNotification(vehicle) {
    try {
      // 🆕 构造符合后端接口格式的数据
      const notificationData = {
        plateNumber: vehicle.plateNumber || vehicle.platenumber,
        visitorName: vehicle.visitorName || vehicle.visitorname,
        parkName: vehicle.parkName || vehicle.community || vehicle.venue,
        remainingMinutes: vehicle.remainingMinutes,
        overtimeMinutes: vehicle.overtimeMinutes,
        enterTime: vehicle.enterTime || vehicle.arrivedate,
        notificationType: this.determineNotificationType(vehicle)
      }

      console.log(`📤 [TimeoutMonitoring] 发送超时通知:`, notificationData)
      
      const response = await timeoutAPI.sendTimeoutNotification(notificationData)
      
      if (response.code === 200) {
        console.log(`📤 [TimeoutMonitoring] 超时通知发送成功: ${notificationData.plateNumber}`)
        return true
      } else {
        console.warn(`⚠️ [TimeoutMonitoring] 超时通知发送失败: ${notificationData.plateNumber}`, response.message)
        return false
      }
      
    } catch (error) {
      console.error('❌ [TimeoutMonitoring] 发送超时通知异常:', error)
      return false
    }
  }

  /**
   * 🆕 判断通知类型
   */
  determineNotificationType(vehicle) {
    if (vehicle.remainingMinutes <= 1) {
      return "urgent_1min" // 紧急提醒(1分钟)
    } else if (vehicle.remainingMinutes <= 5) {
      return "important_5min" // 重要提醒(5分钟)  
    } else if (vehicle.remainingMinutes <= 15) {
      return "normal_15min" // 普通提醒(15分钟)
    } else if (vehicle.overtimeMinutes > 0) {
      return "overtime" // 已超时
    } else {
      return "almost_timeout" // 即将超时
    }
  }

  /**
   * 显示超时提醒
   */
  async showTimeoutAlert(vehicle, totalCount) {
    return new Promise((resolve) => {
      const plateNumber = vehicle.plateNumber || vehicle.platenumber
      const parkName = vehicle.parkName || vehicle.community || vehicle.venue || '停车场'
      
      if (totalCount <= 3) {
        // 车辆较少时显示详细信息
        let title, content, alertType
        
        if (vehicle.remainingMinutes > 0) {
          // 即将超时车辆
          title = '⏰ 即将超时提醒'
          const timeText = vehicle.remainingMinutes > 60 ? 
            `${Math.floor(vehicle.remainingMinutes / 60)}小时${vehicle.remainingMinutes % 60}分钟` : 
            `${vehicle.remainingMinutes}分钟`
          content = `车牌：${plateNumber}\n停车场：${parkName}\n剩余时间：${timeText}\n${vehicle.notificationSent ? '✅ 已发送提醒' : '⚠️ 通知发送失败'}`
          alertType = 'warning'
        } else if (vehicle.overtimeMinutes > 0) {
          // 已超时车辆
          title = '🚨 停车超时警告'
          const overtimeHours = Math.floor(vehicle.overtimeMinutes / 60)
          const overtimeMinutes = vehicle.overtimeMinutes % 60
          const overtimeText = overtimeHours > 0 ? 
            `${overtimeHours}小时${overtimeMinutes}分钟` : 
            `${overtimeMinutes}分钟`
          content = `车牌：${plateNumber}\n停车场：${parkName}\n超时时长：${overtimeText}\n请尽快处理！`
          alertType = 'error'
        } else {
          // 通用提醒
          title = '🔔 停车提醒'
          content = `车牌：${plateNumber}\n停车场：${parkName}\n请注意停车时间`
          alertType = 'info'
        }

        uni.showModal({
          title: title,
          content: content,
          confirmText: '查看详情',
          cancelText: '知道了',
          success: (res) => {
            if (res.confirm) {
              // 可以跳转到超时管理页面
              this.navigateToTimeoutManagement()
            }
            resolve()
          }
        })
      } else {
        // 车辆较多时显示汇总信息
        const almostTimeoutCount = totalCount // 这里可以根据实际情况区分
        const icon = vehicle.overtimeMinutes > 0 ? 'error' : 'none'
        
        uni.showToast({
          title: `${totalCount}辆车需要关注`,
          icon: icon,
          duration: 3000
        })
        resolve()
      }
    })
  }

  /**
   * 跳转到超时管理页面
   */
  navigateToTimeoutManagement() {
    // 这里可以跳转到专门的超时管理页面
    // uni.navigateTo({
    //   url: '/pages/timeout-management/index'
    // })
    console.log('💡 [TimeoutMonitoring] 可以在这里跳转到超时管理页面')
  }

  /**
   * 计算检查间隔
   */
  calculateCheckInterval() {
    // 固定1分钟检查一次
    return 1 * 60 * 1000 // 1分钟
  }

  /**
   * 检查并启动监控（对外接口）
   */
  async checkAndStartMonitoring() {
    const needsMonitoring = await this.shouldStartMonitoring()
    
    if (needsMonitoring && !this.isMonitoring) {
      return await this.startMonitoring()
    } else if (!needsMonitoring && this.isMonitoring) {
      this.stopMonitoring()
      return false
    }
    
    return this.isMonitoring
  }

  /**
   * 获取监控状态
   */
  getMonitoringStatus() {
    return {
      isMonitoring: this.isMonitoring,
      recentActiveCount: this.recentActiveCount,
      lastCheckTime: this.lastCheckTime,
      checkInterval: this.checkInterval,
      retryCount: this.retryCount,
      autoMode: this.autoMode // 🔄 包含自动运行模式状态
    }
  }

  /**
   * 强制执行一次检查
   */
  async forceCheck() {
    if (!this.hasMonitoringPermission()) {
      uni.showToast({
        title: '无检查权限',
        icon: 'none'
      })
      return
    }

    uni.showLoading({
      title: '检查中...'
    })

    try {
      await this.performTimeoutCheck()
      uni.showToast({
        title: '检查完成',
        icon: 'success'
      })
    } catch (error) {
      uni.showToast({
        title: '检查失败',
        icon: 'none'
      })
    } finally {
      uni.hideLoading()
    }
  }

  /**
   * 🆕 调试监控状态（详细信息）
   */
  debugMonitoringStatus() {
    const status = this.getMonitoringStatus()
    console.log('📋 [TimeoutMonitoring] 详细监控状态:')
    console.log(`  - 是否监控中: ${status.isMonitoring}`)
    console.log(`  - 活跃车辆数: ${status.recentActiveCount}辆`)
    console.log(`  - 上次检查时间: ${status.lastCheckTime ? new Date(status.lastCheckTime).toLocaleString() : '未检查'}`)
    console.log(`  - 检查间隔: ${status.checkInterval/60000}分钟`)
    console.log(`  - 重试次数: ${status.retryCount}/${this.maxRetryCount}`)
    console.log(`  - 定时器ID: ${this.monitoringTimer}`)
    console.log(`  - 用户权限: ${this.hasMonitoringPermission()}`)
    console.log(`  - 当前角色: ${AuthUtils.getCurrentRole()}`)
    
    return status
  }

  /**
   * 🆕 强制重启监控（调试用）
   */
  async forceRestartMonitoring() {
    console.log('🔄 [TimeoutMonitoring] 强制重启监控')
    this.stopMonitoring()
    
    // 等待1秒后重新启动
    setTimeout(async () => {
      const started = await this.checkAndStartMonitoring()
      console.log(`🔄 [TimeoutMonitoring] 重启结果: ${started}`)
    }, 1000)
  }

  /**
   * 🆕 强制执行健康检查（调试用）
   */
  async forceHealthCheck() {
    console.log('🔧 [TimeoutMonitoring] 强制执行健康检查');
    
    try {
      if (this.isMonitoring) {
        console.log('✅ [Debug] 监控当前正在运行');
      } else {
        console.log('⚠️ [Debug] 监控已停止，检查是否需要重新启动');
        
        const needsRestart = await this.shouldStartMonitoring();
        if (needsRestart) {
          console.log('🟢 [Debug] 发现需要监控的车辆，尝试启动');
          const started = await this.checkAndStartMonitoring();
          return { restarted: true, success: started };
        } else {
          console.log('⚪ [Debug] 暂无需要监控的车辆');
          return { restarted: false, reason: 'no_active_vehicles' };
        }
      }
      
      return { restarted: false, reason: 'already_running' };
      
    } catch (error) {
      console.error('❌ [Debug] 健康检查失败:', error);
      throw error;
    }
  }

  /**
   * 🆕 检查5分钟内即将超时的车辆
   */
  async check5MinutesTimeout() {
    try {
      console.log('⏰ [TimeoutMonitoring] 检查5分钟内即将超时的车辆');
      const response = await timeoutAPI.checkTimeout5Minutes();
      
      if (response.code === 200) {
        const vehicles = response.data || [];
        console.log(`📊 [TimeoutMonitoring] 5分钟内即将超时: ${vehicles.length}辆`);
        
        if (vehicles.length > 0) {
          await this.handleTimeoutVehicles(vehicles);
        }
        
        return vehicles;
      } else {
        console.warn('⚠️ [TimeoutMonitoring] 5分钟超时检查失败:', response.message);
        return [];
      }
    } catch (error) {
      console.error('❌ [TimeoutMonitoring] 5分钟超时检查异常:', error);
      return [];
    }
  }

  /**
   * 🆕 检查1分钟内即将超时的车辆
   */
  async check1MinuteTimeout() {
    try {
      console.log('⏰ [TimeoutMonitoring] 检查1分钟内即将超时的车辆');
      const response = await timeoutAPI.checkTimeout1Minute();
      
      if (response.code === 200) {
        const vehicles = response.data || [];
        console.log(`📊 [TimeoutMonitoring] 1分钟内即将超时: ${vehicles.length}辆`);
        
        if (vehicles.length > 0) {
          await this.handleTimeoutVehicles(vehicles);
        }
        
        return vehicles;
      } else {
        console.warn('⚠️ [TimeoutMonitoring] 1分钟超时检查失败:', response.message);
        return [];
      }
    } catch (error) {
      console.error('❌ [TimeoutMonitoring] 1分钟超时检查异常:', error);
      return [];
    }
  }

  /**
   * 🆕 检查指定分钟数内即将超时的车辆
   * @param {number} minutes - 剩余分钟数
   */
  async checkTimeoutByMinutes(minutes) {
    try {
      console.log(`⏰ [TimeoutMonitoring] 检查${minutes}分钟内即将超时的车辆`);
      const response = await timeoutAPI.checkTimeoutByMinutes(minutes);
      
      if (response.code === 200) {
        const vehicles = response.data || [];
        console.log(`📊 [TimeoutMonitoring] ${minutes}分钟内即将超时: ${vehicles.length}辆`);
        
        if (vehicles.length > 0) {
          await this.handleTimeoutVehicles(vehicles);
        }
        
        return vehicles;
      } else {
        console.warn(`⚠️ [TimeoutMonitoring] ${minutes}分钟超时检查失败:`, response.message);
        return [];
      }
    } catch (error) {
      console.error(`❌ [TimeoutMonitoring] ${minutes}分钟超时检查异常:`, error);
      return [];
    }
  }

  /**
   * 🆕 分级检查超时车辆（先检查1分钟，再检查5分钟，最后检查15分钟）
   */
  async performTieredTimeoutCheck() {
    try {
      console.log('🔍 [TimeoutMonitoring] 开始分级超时检查');
      
      const results = {
        '1min': [],
        '5min': [],
        '15min': [],
        total: 0
      };

      // 检查网络状态
      const networkStatus = await this.checkNetworkStatus();
      if (!networkStatus) {
        console.log('📡 [TimeoutMonitoring] 网络不可用，跳过分级检查');
        return results;
      }

      // 1. 检查1分钟内即将超时（最紧急）
      results['1min'] = await this.check1MinuteTimeout();
      
      // 2. 检查5分钟内即将超时
      results['5min'] = await this.check5MinutesTimeout();
      
      // 3. 检查15分钟内即将超时
      results['15min'] = await this.checkTimeoutByMinutes(15);
      
      results.total = results['1min'].length + results['5min'].length + results['15min'].length;
      
      console.log(`📊 [TimeoutMonitoring] 分级检查完成 - 1分钟: ${results['1min'].length}, 5分钟: ${results['5min'].length}, 15分钟: ${results['15min'].length}, 总计: ${results.total}`);
      
      return results;
      
    } catch (error) {
      console.error('❌ [TimeoutMonitoring] 分级超时检查异常:', error);
      return { '1min': [], '5min': [], '15min': [], total: 0 };
    }
  }
}

// 创建单例
const timeoutMonitoring = new TimeoutMonitoringUtils()

export default timeoutMonitoring 