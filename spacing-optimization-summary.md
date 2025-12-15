# 搜索框间距优化总结

## 问题描述
用户反馈待审核列表搜索框的上下间距太大，需要缩小以获得更紧凑的布局。

## 优化调整

### 1. 搜索容器间距调整
**文件位置**: `pages/site/facility.vue` - `.filter-container`

**调整内容**:
- 内边距：`24rpx 16rpx` → `16rpx 16rpx` (减少8rpx)
- 外边距：`20rpx 8rpx` → `12rpx 8rpx` (减少8rpx)

### 2. 快捷筛选标签间距调整
**文件位置**: `pages/site/facility.vue` - `.quick-filter`

**调整内容**:
- 标签间距：`16rpx` → `12rpx` (减少4rpx)
- 上边距：`16rpx` → `12rpx` (减少4rpx)
- 上内边距：`16rpx` → `12rpx` (减少4rpx)

### 3. 审核列表区域间距调整
**文件位置**: `pages/site/facility.vue` - `.audit-list`

**调整内容**:
- 上边距：`-15px` → `0` (移除负边距)

### 4. 标题与搜索框间距调整
**调整内容**:
- 移除了"待审核列表"标题和搜索框之间的多余空行
- 为待审核列表标题添加特殊样式类 `audit-list-title`
- 重置标题的上边距和下边距

## 具体代码变更

### CSS样式调整
```scss
/* 搜索区域整体优化 */
.filter-container {
    padding: 16rpx 16rpx;  // 原: 24rpx 16rpx
    margin: 12rpx 8rpx;    // 原: 20rpx 8rpx
}

/* 快捷筛选标签区域 */
.quick-filter {
    gap: 12rpx;           // 原: 16rpx
    margin-top: 12rpx;    // 原: 16rpx
    padding-top: 12rpx;   // 原: 16rpx
}

/* 卡片列表紧凑化 */
.audit-list {
    margin-top: 0;        // 原: -15px
}

/* 待审核列表标题特殊样式 */
.audit-list-title {
    margin-top: 0 !important;
    margin-bottom: 8rpx !important;
}
```

### HTML结构调整
```vue
<!-- 移除多余空行，添加特殊样式类 -->
<tui-section title="待审核列表" 
             class="tui-section-box audit-list-title">
</tui-section>

<view class="audit-list">
    <!-- 搜索区域 -->
</view>
```

## 优化效果

### 之前
- ❌ 搜索框上下间距过大
- ❌ 标题与搜索框距离过远
- ❌ 快捷筛选标签间距过宽
- ❌ 整体布局松散

### 之后
- ✅ 搜索框间距更紧凑
- ✅ 标题与搜索框距离适中
- ✅ 快捷筛选标签排列更紧密
- ✅ 整体布局更加紧凑美观

## 总体减少的间距
- 搜索容器上下间距减少约 16rpx
- 快捷筛选区域间距减少约 8rpx
- 标题与搜索框间距减少约 20rpx
- 总计减少约 44rpx 的垂直间距

这些调整让页面布局更加紧凑，提升了空间利用率，同时保持了良好的视觉层次。
