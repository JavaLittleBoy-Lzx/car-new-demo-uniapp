# 排序功能和搜索优化

## 需求描述
1. 最左边的"新→旧"按钮点击后可以切换成"旧→新"，再次点击时按照预约时间正序排序（预约晚的靠后）
2. 移除右侧的搜索按钮，改为实时搜索

## 主要修改

### 1. 排序功能增强

#### 修改toggleSort方法
**文件位置**: `pages/site/facility.vue` - `toggleSort`方法

**修改前**:
```javascript
toggleSort() {
    // 显示当前排序状态提示（固定为倒序排序）
    uni.showToast({
        title: '当前按预约时间倒序排序（最新的在前）',
        icon: 'none',
        duration: 2000
    });
}
```

**修改后**:
```javascript
toggleSort() {
    // 切换排序方向
    this.sortConfig.desc = !this.sortConfig.desc;
    
    // 重新排序当前列表
    this.applySorting();
    
    // 显示排序状态提示
    uni.showToast({
        title: this.sortConfig.desc ? '按预约时间倒序排序（新→旧）' : '按预约时间正序排序（旧→新）',
        icon: 'none',
        duration: 2000
    });
}
```

#### 新增applySorting方法
```javascript
// 应用排序到当前列表
applySorting() {
    if (this.pendingList.length === 0) return;
    
    this.pendingList.sort((a, b) => {
        const timeA = new Date(a.recordTime || a.time).getTime();
        const timeB = new Date(b.recordTime || b.time).getTime();
        
        if (this.sortConfig.desc) {
            return timeB - timeA; // 倒序：新→旧
        } else {
            return timeA - timeB; // 正序：旧→新
        }
    });
}
```

### 2. 统一排序逻辑

#### 修改quickFilter方法
**修改前**:
```javascript
// 按记录创建时间倒序排序（记录创建时间越晚的越靠前）
this.pendingList = filteredData.sort((a, b) => {
    const timeA = new Date(a.recordTime || a.time).getTime();
    const timeB = new Date(b.recordTime || b.time).getTime();
    return timeB - timeA; // 倒序排序，时间越晚的越靠前
});
```

**修改后**:
```javascript
// 应用当前排序设置
this.pendingList = filteredData.sort((a, b) => {
    const timeA = new Date(a.recordTime || a.time).getTime();
    const timeB = new Date(b.recordTime || b.time).getTime();
    
    if (this.sortConfig.desc) {
        return timeB - timeA; // 倒序：新→旧
    } else {
        return timeA - timeB; // 正序：旧→新
    }
});
```

#### 修改getFilteredListByTag方法
类似的排序逻辑修改，确保所有筛选都应用当前排序设置。

#### 修改loadPendingData方法
确保数据加载后也应用当前排序设置。

#### 修改resetFilter方法
确保重置筛选后也应用当前排序设置。

### 3. 移除搜索按钮

#### 移除HTML结构
**修改前**:
```vue
<view class="search-button" @click="handleSearch">
    <text class="button-emoji">🔍</text>
    <text class="search-text">搜索</text>
</view>
```

**修改后**:
移除整个搜索按钮结构

#### 移除CSS样式
移除以下CSS类：
- `.search-button`
- `.search-button::before`
- `.search-button:hover`
- `.search-button:hover::before`
- `.search-button:active`
- `.button-emoji`
- `.search-text`

#### 移除handleSearch方法
移除不再需要的搜索按钮点击处理方法。

### 4. 排序状态管理

#### sortConfig配置
```javascript
sortConfig: {
    desc: true  // true: 新→旧（倒序），false: 旧→新（正序）
}
```

#### 排序按钮显示
```vue
<text class="tooltip-text">{{ sortConfig.desc ? '新→旧' : '旧→新' }}</text>
```

## 功能特性

### 排序功能
1. **默认状态**: 新→旧（倒序排序）
2. **点击切换**: 旧→新（正序排序）
3. **再次点击**: 新→旧（倒序排序）
4. **排序基准**: 基于recorddate字段（预约记录创建时间）

### 搜索功能
1. **实时搜索**: 输入时即时过滤结果
2. **无需按钮**: 移除搜索按钮，简化界面
3. **保持排序**: 搜索结果也会应用当前排序设置

### 筛选功能
1. **标签筛选**: 今日、昨日、近三天等筛选保持排序
2. **组合筛选**: 搜索+标签筛选+排序可以组合使用
3. **状态保持**: 切换排序不会影响当前筛选条件

## 用户体验提升

### 界面简化
- ✅ 移除搜索按钮，界面更简洁
- ✅ 实时搜索响应更快
- ✅ 排序切换更直观

### 功能增强
- ✅ 排序方向可切换
- ✅ 所有操作保持排序一致性
- ✅ 搜索和筛选结果都遵循排序设置

### 操作流畅性
- ✅ 点击排序按钮立即生效
- ✅ 输入搜索关键词立即过滤
- ✅ 所有操作都有相应的提示反馈

## 技术实现

### 排序算法
```javascript
// 统一的排序逻辑
const sortFunction = (a, b) => {
    const timeA = new Date(a.recordTime || a.time).getTime();
    const timeB = new Date(b.recordTime || b.time).getTime();
    
    if (this.sortConfig.desc) {
        return timeB - timeA; // 倒序：新→旧
    } else {
        return timeA - timeB; // 正序：旧→新
    }
};
```

### 状态管理
- 排序状态存储在`sortConfig.desc`中
- 所有排序操作都检查这个状态
- 确保整个应用的排序行为一致

这些修改让排序功能更加灵活，搜索体验更加流畅，整体界面更加简洁高效。
