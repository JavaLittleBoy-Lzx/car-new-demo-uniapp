# 🚗 停车超时监控功能使用指南

## 📖 功能概述

停车超时监控是一个智能化的车辆停车时长监控系统，能够实时检测车辆停车时间，当超过预设阈值时自动触发通知提醒，帮助管理员和车主及时处理超时停车问题。

## ✨ 主要特性

### 🔧 核心功能
- ⏰ **实时监控**: 定期检查车辆停车时长
- 🚨 **超时提醒**: 自动触发超时通知
- 📱 **前后台运行**: 支持小程序前台和后台监控
- 🔄 **自动重启**: 应用重启后自动恢复监控
- 📊 **状态管理**: 完整的监控状态跟踪

### 🎯 智能特性
- 🧠 **智能启动**: 检测到在场车辆时自动启动
- 💤 **智能休眠**: 无车辆时自动停止节省资源
- 🔄 **动态调整**: 根据应用状态调整检查频率
- 📈 **性能优化**: 最小化系统资源占用

## 🛠️ 技术架构

### 📁 文件结构
```
utils/
├── timeoutMonitoring.js          # 核心监控逻辑
├── parkingDataManager.js         # 停车数据管理
└── notificationManager.js        # 通知管理

pages/
├── test/timeout-monitoring.vue   # 测试页面
└── site/parking_log.vue          # 停车记录页面

App.vue                           # 应用入口集成
```

### 🏗️ 架构设计
```
┌─────────────────────────────────────────┐
│                App.vue                  │
│  ┌─────────────────────────────────────┐ │
│  │      超时监控集成                    │ │
│  │  ┌─────────────┐  ┌─────────────────┐ │ │
│  │  │ 生命周期管理 │  │   事件监听      │ │ │
│  │  └─────────────┘  └─────────────────┘ │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│         TimeoutMonitoring               │
│  ┌─────────────────────────────────────┐ │
│  │           核心监控逻辑               │ │
│  │  ┌───────────┐  ┌─────────────────┐ │ │
│  │  │  定时器   │  │   状态管理      │ │ │
│  │  └───────────┘  └─────────────────┘ │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│    ParkingDataManager + NotificationManager
│  ┌─────────────────────────────────────┐ │
│  │        数据获取 + 通知发送           │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## 🚀 快速开始

### 📦 安装部署

1. **文件部署**: 将相关文件放置到正确位置
```bash
# 核心文件
utils/timeoutMonitoring.js
utils/parkingDataManager.js  
utils/notificationManager.js

# 测试页面（可选）
pages/test/timeout-monitoring.vue
```

2. **App.vue集成**: 确保App.vue已包含监控逻辑

### ⚡ 启动使用

#### 自动启动（推荐）
监控系统会在以下情况自动启动：
- 用户登录且有在场车辆时
- 导航到停车相关页面时
- 应用从后台恢复到前台时

#### 手动控制
```javascript
// 启动监控
const started = await TimeoutMonitoring.checkAndStartMonitoring();

// 停止监控  
TimeoutMonitoring.stopMonitoring();

// 获取状态
const status = TimeoutMonitoring.getMonitoringStatus();
```

## 🔧 配置说明

### ⚙️ 基础配置
```javascript
// 在 timeoutMonitoring.js 中修改配置
const CONFIG = {
    // 超时阈值（小时）
    TIMEOUT_THRESHOLD_HOURS: 3,
    
    // 检查间隔（毫秒）
    CHECK_INTERVAL_MS: 5 * 60 * 1000,  // 5分钟
    
    // 后台检查间隔（毫秒）
    BACKGROUND_CHECK_INTERVAL_MS: 10 * 60 * 1000,  // 10分钟
    
    // 通知间隔（毫秒）
    NOTIFICATION_INTERVAL_MS: 30 * 60 * 1000,  // 30分钟
    
    // 最大重试次数
    MAX_RETRIES: 3
};
```

### 🎨 自定义配置示例
```javascript
// 自定义超时阈值
TimeoutMonitoring.updateConfig({
    timeoutThreshold: 2.5  // 2.5小时
});

// 自定义检查间隔
TimeoutMonitoring.updateConfig({
    checkInterval: 3 * 60 * 1000  // 3分钟
});
```

## 📱 页面集成

### 🌟 停车记录页面集成
```javascript
// 在停车相关页面的 mounted 或 onShow 中
mounted() {
    // 触发导航事件
    uni.$emit('navigate-to-parking', {
        page: 'parking_log',
        hasInParkingVehicles: this.hasVehiclesInParking(),
        timestamp: new Date().getTime()
    });
}

// 车辆状态变化时
onVehicleStatusChange(oldStatus, newStatus) {
    uni.$emit('parking-status-changed', {
        vehicleId: 'vehicle_123',
        licensePlate: '粤B12345',
        oldStatus: oldStatus,
        newStatus: newStatus,
        timestamp: new Date().getTime()
    });
}
```

### 🎯 事件系统
监控系统通过uni事件系统进行通信：

| 事件名 | 触发时机 | 参数说明 |
|-------|---------|---------|
| `navigate-to-parking` | 导航到停车页面时 | `{page, hasInParkingVehicles, timestamp}` |
| `parking-status-changed` | 车辆状态变化时 | `{vehicleId, licensePlate, oldStatus, newStatus, timestamp}` |
| `user-logout` | 用户登出时 | 无参数 |

## 🧪 测试调试

### 🔍 测试页面使用
1. 导航到测试页面: `/pages/test/timeout-monitoring`
2. 使用测试页面功能：
   - **启动/停止监控**: 手动控制监控状态
   - **添加测试车辆**: 创建模拟停车数据
   - **模拟超时**: 添加已超时的测试车辆
   - **测试通知**: 验证通知功能
   - **查看日志**: 实时监控运行状态

### 🐛 调试技巧
```javascript
// 启用详细日志
TimeoutMonitoring.setDebugMode(true);

// 获取详细状态信息
const detailedStatus = TimeoutMonitoring.getDetailedStatus();

// 手动执行检查
TimeoutMonitoring.performTimeoutCheck();
```

### 📊 性能监控
```javascript
// 获取性能指标
const metrics = TimeoutMonitoring.getPerformanceMetrics();
console.log('检查次数:', metrics.checkCount);
console.log('平均检查耗时:', metrics.averageCheckTime);
console.log('内存使用:', metrics.memoryUsage);
```

## 🚨 故障排除

### ❓ 常见问题

#### Q1: 监控没有自动启动
**A1: 检查以下几点**
- 确认用户已登录
- 确认有在场车辆数据
- 检查控制台是否有错误信息
- 验证数据获取接口是否正常

#### Q2: 通知没有触发
**A2: 排查步骤**
- 检查是否真的有超时车辆
- 确认通知间隔设置
- 验证小程序权限设置
- 查看通知管理器日志

#### Q3: 后台监控不工作
**A3: 注意事项**
- 小程序后台运行有时间限制
- 系统可能会暂停后台定时器
- 建议采用前台提醒 + 后台辅助的策略

### 🔧 故障解决流程
```
1. 检查监控状态
   ↓
2. 查看控制台日志
   ↓
3. 验证数据源
   ↓
4. 测试单个功能
   ↓
5. 重置监控状态
```

### 📞 技术支持
如遇到无法解决的问题，请：
1. 收集详细错误日志
2. 记录复现步骤
3. 提供设备和环境信息
4. 联系技术支持团队

## 📈 性能优化

### ⚡ 最佳实践
1. **合理设置检查间隔**: 平衡实时性和性能
2. **智能启停**: 无车辆时及时停止监控
3. **数据缓存**: 减少重复的数据请求
4. **异常处理**: 确保监控的稳定性
5. **资源清理**: 及时清理定时器和事件监听

### 🎯 性能指标
- **内存占用**: < 5MB
- **CPU使用**: < 1%（非检查时段）
- **电池影响**: 最小化
- **网络请求**: 按需获取

## 🔄 版本更新

### 📅 版本历史
- **v1.0.0**: 基础监控功能
- **v1.1.0**: 添加智能启停
- **v1.2.0**: 优化性能和稳定性
- **v1.3.0**: 增加测试页面和调试功能

### 🚀 升级指南
1. 备份现有配置
2. 替换核心文件
3. 检查配置兼容性
4. 测试验证功能
5. 部署到生产环境

---

## 📝 总结

停车超时监控功能为停车管理提供了智能化的解决方案，通过实时监控、智能提醒和灵活配置，帮助提升停车管理效率。

如有任何问题或建议，欢迎反馈！ 🚗✨ 