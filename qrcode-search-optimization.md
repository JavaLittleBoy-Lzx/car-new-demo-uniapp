# 二维码生成页面搜索框优化

## 优化需求
用户反馈在业主数量较少时，搜索框显得冗余，希望只在业主数量较多时才显示搜索框。

## 优化方案
当业主数量超过5条时才显示搜索框，5条及以下时隐藏搜索框并显示提示信息。

## 具体修改

### 1. 搜索框条件显示
```vue
<!-- 修改前：始终显示搜索框 -->
<view class="owner-search">
  <u-search v-model="ownerSearchKeyword" ...></u-search>
</view>

<!-- 修改后：只有当业主数量超过5条时才显示 -->
<view class="owner-search" v-if="ownerList.length > 5">
  <u-search v-model="ownerSearchKeyword" ...></u-search>
</view>
```

### 2. 添加友好提示
```vue
<view class="title-right" v-if="ownerList.length > 0">
  <text class="owner-count">共{{ ownerList.length }}位业主</text>
  <text class="search-tip" v-if="ownerList.length <= 5">（数量较少，无需搜索）</text>
</view>
```

### 3. 搜索状态管理优化
在业主数据更新时自动清除搜索关键词，确保搜索框显示逻辑正确：

```javascript
// 在 searchOwnersForCurrentAddress 方法中
this.ownerList = ownerData;
this.filteredOwnerList = ownerData.slice();
this.ownerSearched = true;
// 清除之前的搜索关键词，确保搜索框显示逻辑正确
this.ownerSearchKeyword = '';
```

### 4. 样式优化
为提示文本添加合适的样式：

```css
.search-tip {
  font-size: 22rpx;
  color: #999;
  margin-left: 8rpx;
}
```

## 优化效果

### 业主数量 ≤ 5 条时
- ✅ 隐藏搜索框，界面更简洁
- ✅ 显示"（数量较少，无需搜索）"提示
- ✅ 用户可以直接浏览选择业主

### 业主数量 > 5 条时  
- ✅ 显示搜索框，方便快速查找
- ✅ 保持原有的搜索功能完整性
- ✅ 实时搜索和清除功能正常工作

## 测试场景

### 测试用例1：少量业主（≤5条）
1. 选择一个业主较少的地址
2. 验证搜索框不显示
3. 验证显示"（数量较少，无需搜索）"提示
4. 验证可以正常选择业主

### 测试用例2：大量业主（>5条）
1. 选择一个业主较多的地址  
2. 验证搜索框正常显示
3. 验证搜索功能正常工作
4. 验证清除搜索功能正常

### 测试用例3：地址切换
1. 从少量业主地址切换到大量业主地址
2. 验证搜索框显示状态正确切换
3. 验证搜索关键词被正确清除
4. 验证业主列表正确更新

## 用户体验提升
- 🎯 **界面简洁**：少量数据时不显示不必要的搜索框
- 🎯 **功能完整**：大量数据时保持搜索功能
- 🎯 **提示友好**：明确告知用户为什么没有搜索框
- 🎯 **状态一致**：地址切换时搜索状态正确重置
