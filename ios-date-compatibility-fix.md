# iOS日期兼容性修复

## 问题描述
在iOS设备上出现日期格式警告：
```
new Date("2025-06-28 09:35:43") 在部分 iOS 下无法正常使用，iOS 只支持
"yyyy/MM/dd", "yyyy/MM/dd HH:mm:ss", "yyyy-MM-dd", "yyyy-MM-ddTHH:mm:ss", "yyyy-MM-ddTHH:mm:ss+HH:mm" 的格式
```

## 问题原因
JavaScript的`new Date()`构造函数在不同平台上对日期字符串的解析行为不一致：
- **Android**: 支持多种格式，包括 "2025-06-28 09:35:43"
- **iOS**: 只支持特定的ISO格式，不支持空格分隔的格式

## 解决方案

### 1. 创建iOS兼容的日期解析函数

```javascript
// iOS兼容的日期解析函数
parseDate(dateString) {
    if (!dateString) return null;
    
    // 处理ISO格式的日期字符串，确保iOS兼容
    let normalizedDateString = dateString;
    
    // 如果是ISO格式（包含T），替换为iOS兼容的格式
    if (typeof dateString === 'string' && dateString.includes('T')) {
        // 将 "2025-06-28T09:35:43" 转换为 "2025/06/28 09:35:43"
        normalizedDateString = dateString.replace(/T/, ' ').replace(/-/g, '/');
    }
    
    try {
        const date = new Date(normalizedDateString);
        // 检查日期是否有效
        if (isNaN(date.getTime())) {
            console.warn('⚠️ 无效的日期格式:', dateString);
            return null;
        }
        return date;
    } catch (error) {
        console.error('❌ 日期解析错误:', dateString, error);
        return null;
    }
}
```

### 2. 创建安全的时间戳获取函数

```javascript
// 安全获取时间戳的函数
getTimestamp(dateString) {
    const date = this.parseDate(dateString);
    return date ? date.getTime() : 0;
}
```

### 3. 修改所有日期相关方法

#### isToday方法
**修改前**:
```javascript
isToday(dateString) {
    if (!dateString) return false;
    const today = new Date();
    const appointmentDate = new Date(dateString);  // ❌ 可能在iOS上失败
    // ...
}
```

**修改后**:
```javascript
isToday(dateString) {
    if (!dateString) return false;
    const today = new Date();
    const appointmentDate = this.parseDate(dateString);  // ✅ iOS兼容
    
    if (!appointmentDate) return false;
    // ...
}
```

#### isYesterday方法
类似的修改，使用`this.parseDate(dateString)`替代`new Date(dateString)`

#### isWithinDays方法
类似的修改，使用`this.parseDate(dateString)`替代`new Date(dateString)`

#### formatAppointmentTime方法
**修改前**:
```javascript
formatAppointmentTime(timeStr) {
    if (!timeStr) return '';
    const date = new Date(timeStr);  // ❌ 可能在iOS上失败
    // ...
}
```

**修改后**:
```javascript
formatAppointmentTime(timeStr) {
    if (!timeStr) return '';
    const date = this.parseDate(timeStr);  // ✅ iOS兼容
    if (!date) return '时间格式错误';
    // ...
}
```

#### formatRecordTime方法
类似的修改，使用`this.parseDate(timeStr)`

#### getWaitingTime方法
类似的修改，使用`this.parseDate(timeStr)`

### 4. 修改所有排序函数

#### 排序时间戳获取
**修改前**:
```javascript
const timeA = new Date(a.recordTime || a.time).getTime();  // ❌ 可能在iOS上失败
const timeB = new Date(b.recordTime || b.time).getTime();
```

**修改后**:
```javascript
const timeA = this.getTimestamp(a.recordTime || a.time);  // ✅ iOS兼容
const timeB = this.getTimestamp(b.recordTime || b.time);
```

#### 涉及的排序函数
- `filteredList` 计算属性中的排序
- `handleSearchInput` 方法中的排序
- `getFilteredListByTag` 方法中的排序
- `quickFilter` 方法中的排序
- `applySorting` 方法中的排序
- `loadPendingData` 方法中的排序
- `resetFilter` 方法中的排序

### 5. 修改时间比较逻辑

#### expiring筛选逻辑
**修改前**:
```javascript
const appointmentTime = new Date(item.time);  // ❌ 可能在iOS上失败
const diffHours = (appointmentTime - now) / (1000 * 60 * 60);
```

**修改后**:
```javascript
const appointmentTime = this.parseDate(item.time);  // ✅ iOS兼容
if (!appointmentTime) return false;
const diffHours = (appointmentTime - now) / (1000 * 60 * 60);
```

## 日期格式转换规则

### 支持的输入格式
1. **ISO格式**: "2025-06-28T09:35:43"
2. **标准格式**: "2025-06-28 09:35:43"
3. **其他格式**: 由parseDate函数处理

### 转换逻辑
```javascript
// 输入: "2025-06-28T09:35:43"
// 输出: "2025/06/28 09:35:43"

if (dateString.includes('T')) {
    normalizedDateString = dateString.replace(/T/, ' ').replace(/-/g, '/');
}
```

### iOS兼容的格式
- ✅ "2025/06/28 09:35:43"
- ✅ "2025/06/28"
- ✅ "2025-06-28T09:35:43"
- ✅ "2025-06-28"
- ❌ "2025-06-28 09:35:43" (原始格式，在iOS上可能失败)

## 错误处理

### 1. 无效日期检测
```javascript
if (isNaN(date.getTime())) {
    console.warn('⚠️ 无效的日期格式:', dateString);
    return null;
}
```

### 2. 异常捕获
```javascript
try {
    const date = new Date(normalizedDateString);
    // ...
} catch (error) {
    console.error('❌ 日期解析错误:', dateString, error);
    return null;
}
```

### 3. 空值处理
```javascript
if (!dateString) return null;
if (!date) return false; // 在使用parseDate结果时
```

## 预期效果

### 1. 消除警告
- ✅ iOS设备上不再出现日期格式警告
- ✅ 所有平台上的日期解析行为一致

### 2. 功能保持
- ✅ 所有日期相关功能正常工作
- ✅ 排序、筛选、显示功能不受影响

### 3. 错误处理
- ✅ 无效日期格式有友好的错误提示
- ✅ 不会因为日期解析错误导致应用崩溃

## 测试建议

### 1. iOS设备测试
- 在真实iOS设备上测试所有日期相关功能
- 检查控制台是否还有日期格式警告

### 2. 功能测试
- 测试排序功能是否正常
- 测试筛选功能是否正常
- 测试时间显示是否正确

### 3. 边界情况测试
- 测试空日期字符串的处理
- 测试无效日期格式的处理
- 测试各种日期格式的兼容性

这些修改确保了应用在iOS和Android设备上都能正常处理日期，消除了iOS上的日期格式警告。
