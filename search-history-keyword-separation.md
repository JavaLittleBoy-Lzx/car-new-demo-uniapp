# 搜索历史和关键词搜索分离优化

## 问题描述
用户反馈：搜索页面的历史记录和关键词搜索不要同时出现，需要进行分离显示。

## 解决方案

### 1. ✅ 修改显示条件逻辑

#### 问题分析
原来的逻辑允许搜索历史和关键词搜索同时显示：
- 搜索历史显示条件：`showSearchHistory && searchHistory && searchHistory.length > 0`
- 关键词搜索显示条件：`showHotSearch`

这两个条件可能同时为true，导致两个区域同时出现。

#### 优化方案
修改显示条件，确保两者互斥显示：

**搜索历史显示条件：**
```vue
<!-- 修改前 -->
<view class="search-history" v-if="showSearchHistory && searchHistory && searchHistory.length > 0">

<!-- 修改后 -->
<view class="search-history" v-if="showSearchHistory && searchHistory && searchHistory.length > 0 && !showHotSearch">
```

**关键词搜索显示条件：**
```vue
<!-- 修改前 -->
<view class="hot-search-tags" v-if="showHotSearch">

<!-- 修改后 -->
<view class="hot-search-tags" v-if="showHotSearch && (!showSearchHistory || !searchHistory || searchHistory.length === 0)">
```

### 2. ✅ 修改控制逻辑

#### 优先级策略
实现"搜索历史优先"的显示策略：
1. **有搜索历史时**：只显示搜索历史，隐藏关键词搜索
2. **无搜索历史时**：显示关键词搜索，隐藏搜索历史

#### 核心逻辑修改

**搜索框输入监听：**
```javascript
// 修改前
if (trimmedKeyword.length === 0) {
  this.showSearchHistory = this.searchHistory && this.searchHistory.length > 0;
  this.showHotSearch = true;
}

// 修改后
if (trimmedKeyword.length === 0) {
  // 优先显示搜索历史，如果没有历史记录则显示关键词搜索
  if (this.searchHistory && this.searchHistory.length > 0) {
    this.showSearchHistory = true;
    this.showHotSearch = false;
  } else {
    this.showSearchHistory = false;
    this.showHotSearch = true;
  }
}
```

**搜索框焦点事件：**
```javascript
// 修改前
if (!this.searchKeyword.trim()) {
  this.showSearchHistory = this.searchHistory.length > 0;
  this.showHotSearch = true;
}

// 修改后
if (!this.searchKeyword.trim()) {
  // 优先显示搜索历史，如果没有历史记录则显示关键词搜索
  if (this.searchHistory && this.searchHistory.length > 0) {
    this.showSearchHistory = true;
    this.showHotSearch = false;
  } else {
    this.showSearchHistory = false;
    this.showHotSearch = true;
  }
}
```

**搜索框失焦事件：**
```javascript
// 修改前
if (!this.searchKeyword.trim()) {
  this.showSearchHistory = this.searchHistory.length > 0;
  this.showHotSearch = true;
}

// 修改后
if (!this.searchKeyword.trim()) {
  // 优先显示搜索历史，如果没有历史记录则显示关键词搜索
  if (this.searchHistory && this.searchHistory.length > 0) {
    this.showSearchHistory = true;
    this.showHotSearch = false;
  } else {
    this.showSearchHistory = false;
    this.showHotSearch = true;
  }
}
```

**清空搜索：**
```javascript
// 修改前
clearSearch() {
  this.showSearchHistory = this.searchHistory.length > 0;
  this.showHotSearch = true;
}

// 修改后
clearSearch() {
  // 优先显示搜索历史，如果没有历史记录则显示关键词搜索
  if (this.searchHistory && this.searchHistory.length > 0) {
    this.showSearchHistory = true;
    this.showHotSearch = false;
  } else {
    this.showSearchHistory = false;
    this.showHotSearch = true;
  }
}
```

**返回首页：**
```javascript
// 修改前
backToWelcome() {
  this.showSearchHistory = this.searchHistory.length > 0;
  this.showHotSearch = true;
}

// 修改后
backToWelcome() {
  // 优先显示搜索历史，如果没有历史记录则显示关键词搜索
  if (this.searchHistory && this.searchHistory.length > 0) {
    this.showSearchHistory = true;
    this.showHotSearch = false;
  } else {
    this.showSearchHistory = false;
    this.showHotSearch = true;
  }
}
```

### 3. ✅ 代码清理

#### 删除重复方法
发现并删除了重复的`backToWelcome`方法，保留了功能完整的版本。

## 优化效果

### 用户体验改进
1. **界面更清晰**：不再出现两个搜索区域同时显示的情况
2. **逻辑更直观**：用户明确知道当前显示的是历史记录还是关键词搜索
3. **操作更简洁**：减少了界面元素的冗余，提升了使用效率

### 显示逻辑
1. **有搜索历史时**：
   - ✅ 显示搜索历史区域
   - ❌ 隐藏关键词搜索区域

2. **无搜索历史时**：
   - ❌ 隐藏搜索历史区域
   - ✅ 显示关键词搜索区域

3. **有输入内容时**：
   - ❌ 隐藏搜索历史区域
   - ❌ 隐藏关键词搜索区域
   - ✅ 显示搜索建议

### 技术实现
1. **条件渲染优化**：通过v-if条件确保两个区域不会同时显示
2. **状态管理统一**：所有相关方法都使用统一的优先级逻辑
3. **代码一致性**：确保所有触发点都遵循相同的显示规则

## 测试建议

### 功能测试
1. **初始状态**：
   - 有历史记录时，确认只显示搜索历史
   - 无历史记录时，确认只显示关键词搜索

2. **搜索过程**：
   - 输入内容时，确认两个区域都隐藏，只显示搜索建议
   - 清空输入时，确认按优先级显示对应区域

3. **交互操作**：
   - 点击历史记录项，确认功能正常
   - 点击关键词标签，确认功能正常
   - 返回首页，确认显示逻辑正确

### 边界测试
1. **历史记录变化**：
   - 清空历史记录后，确认自动切换到关键词搜索
   - 添加历史记录后，确认自动切换到搜索历史

2. **状态切换**：
   - 搜索框焦点切换时，确认显示状态正确
   - 页面刷新后，确认初始状态正确

## 后续优化建议

1. **可考虑添加切换按钮**：让用户手动选择显示历史记录还是关键词搜索
2. **可优化历史记录管理**：提供更丰富的历史记录分类和管理功能
3. **可增强搜索建议**：结合历史记录和关键词提供更智能的搜索建议
