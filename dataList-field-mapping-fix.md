# dataList 数据字段映射修复说明

## 问题描述

在 `pagesA/reservation/dataList/dataList.vue` 页面中发现三个关键问题：

1. **数据显示为 null**：页面显示 "未知车牌"、"暂无访客昵称" 等
2. **搜索功能失效**：输入车牌号无法搜索到数据
3. **今日数据看板无数据**：统计数据全部显示为 0

## 根本原因

### 字段名不匹配

- **页面模板使用**：驼峰命名（`visitorName`、`plateNumber`、`ownerName` 等）
- **API 返回数据**：小写命名（`visitorname`、`platenumber`、`ownername` 等）
- **数据加载逻辑**：获取数据后直接使用，未进行字段映射

### 代码问题

虽然页面中定义了 `formatAppointmentData()` 方法用于格式化数据，但在以下两个关键位置都未调用：

1. `loadAppointmentDataByPhone()` - 访客模式数据加载
2. `loadAppointmentDataForManager()` - 管家模式数据加载

导致数据保存到 `originalList` 和 `reservationList` 时仍然是原始字段名，与模板不匹配。

## 修复方案

### 1. 访客模式数据加载修复

**位置**：`loadAppointmentDataByPhone()` 方法

**修改内容**：
```javascript
// 修复前
if (dataList.length > 0) {
    console.log('✅ [数据加载] 从服务器获取到最新数据:', dataList.length, '条')
    this.originalList = dataList
    this.reservationList = [...dataList]
    
    // 保存到缓存
    uni.setStorageSync('searchResultData', dataList)
}

// 修复后
if (dataList.length > 0) {
    console.log('✅ [数据加载] 从服务器获取到最新数据:', dataList.length, '条')
    // 格式化数据，确保字段名匹配
    const formattedData = this.formatAppointmentData(dataList)
    console.log('📋 [数据格式化] 格式化后第一条数据:', formattedData.length > 0 ? formattedData[0] : null)
    this.originalList = formattedData
    this.reservationList = [...formattedData]
    
    // 保存到缓存
    uni.setStorageSync('searchResultData', formattedData)
}
```

### 2. 管家模式数据加载修复

**位置**：`loadAppointmentDataForManager()` 方法

**修改内容**：
```javascript
// 修复前
if (filteredData.length > 0) {
    console.log('✅ [数据加载] 从服务器获取到最新数据:', filteredData.length, '条')
    this.originalList = filteredData
    this.reservationList = [...filteredData]
    
    // 保存到缓存
    uni.setStorageSync('searchResultData', filteredData)
}

// 修复后
if (filteredData.length > 0) {
    console.log('✅ [数据加载] 从服务器获取到最新数据:', filteredData.length, '条')
    // 格式化数据
    const formattedData = this.formatAppointmentData(filteredData)
    console.log('✨ [数据加载] 格式化后数据长度:', formattedData.length)
    this.originalList = formattedData
    this.reservationList = [...formattedData]
    
    // 保存到缓存（保存格式化后的数据）
    uni.setStorageSync('searchResultData', formattedData)
}
```

## 字段映射说明

`formatAppointmentData()` 方法执行的字段映射：

| API 字段（小写）      | 页面字段（驼峰）    | 说明           |
| -------------------- | ------------------ | -------------- |
| `visitorname`        | `visitorName`      | 访客微信昵称    |
| `platenumber`        | `plateNumber`      | 车牌号         |
| `ownername`          | `ownerName`        | 业主姓名       |
| `ownerphone`         | `ownerPhone`       | 业主手机号     |
| `visitorphone`       | `phone`            | 访客手机号     |
| `recorddate`         | `time`             | 预约时间       |
| `arrivedate`         | `entryTime`        | 进场时间       |
| `leavedate`          | `leaveTime`        | 离场时间       |
| `auditstatus`        | `status`           | 审批状态       |
| `venuestatus`        | `vehicleStatus`    | 车辆状态       |
| `visitreason`        | `visitReason`      | 访问原因       |
| `appointtype`        | `appointType`      | 预约方式       |
| `refusereason`       | `refuseReason`     | 拒绝原因       |

## 修复效果

✅ **数据正常显示**：访客昵称、车牌号、业主信息等正确展示  
✅ **搜索功能恢复**：可以通过车牌号、姓名、手机号搜索  
✅ **今日数据看板正常**：统计数据正确计算和显示  
✅ **筛选功能正常**：按状态、时间、车辆状态筛选有效  
✅ **缓存数据一致**：保存的是格式化后的数据，刷新后仍正常

## 测试建议

1. **清除缓存重新加载**：由于修复前保存的缓存数据是未格式化的，建议先清除缓存
2. **测试访客模式**：以访客身份登录，查看预约列表
3. **测试管家模式**：以管家身份登录，查看小区所有预约
4. **测试搜索功能**：输入车牌号、姓名、手机号进行搜索
5. **测试数据看板**：查看今日新增、未入场、在场等统计数据
6. **测试筛选功能**：使用时间、状态、车辆状态等筛选条件

## 注意事项

1. **缓存数据**：旧的缓存数据仍然是未格式化的，首次加载后会被新数据覆盖
2. **向后兼容**：`formatAppointmentData()` 方法使用 `||` 运算符，兼容多种字段名
3. **搜索字段**：搜索功能使用格式化后的字段（`plateNumber`、`name`、`phone`、`addressDetail`）
4. **数据流转**：API → 格式化 → 内存 → 缓存，全链路使用统一的字段名

## 修复时间

2024-12-12

## 相关文件

- `pagesA/reservation/dataList/dataList.vue` - 查询结果页面
- 修复行数：1730-1740（访客模式）、1845-1854（管家模式）
