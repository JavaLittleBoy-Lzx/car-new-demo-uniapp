<template>
	<view class="container" @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd">
		<!-- 搜索栏 -->
		<!-- 智能搜索栏区域 -->
		<view class="smart-search-container">
			<view class="search-wrapper">
				<!-- 搜索输入框 -->
				<view class="search-input-box" :class="{ focused: searchFocused, hasText: searchKeyword.length > 0 }">
					<input class="search-input" v-model="searchKeyword" placeholder="搜索车牌号/手机号/姓名"
						@focus="handleSearchFocus" @blur="handleSearchBlur" @input="handleSearchInput"
						@confirm="performSearch" :focus="searchFocused" />
					<view class="search-clear" v-if="searchKeyword.length > 0" @click="clearSearch">
						<text class="icon-emoji" style="color: #999">×</text>
					</view>
				</view>

				<!-- 搜索建议下拉框 -->
				<view class="search-suggestions" v-if="showSuggestions && searchSuggestions.length > 0">
					<scroll-view scroll-y class="suggestions-scroll">
						<view class="suggestion-item" v-for="(suggestion, index) in searchSuggestions" :key="index"
							@click="selectSuggestion(suggestion)">
							<view class="suggestion-icon">
								<text class="icon-emoji">
									{{ suggestion.type === 'plate' ? '🚗' : suggestion.type === 'phone' ? '📱' : '👤' }}
								</text>
							</view>
							<view class="suggestion-content">
								<text class="suggestion-text">{{ suggestion.text }}</text>
								<text class="suggestion-type">{{ getSuggestionTypeText(suggestion.type) }}</text>
							</view>
							<view class="suggestion-arrow">
								<text class="icon-emoji">➡️</text>
							</view>
						</view>
					</scroll-view>
					<view class="suggestions-footer">
						<text class="footer-text">找到 {{ searchSuggestions.length }} 个匹配项</text>
					</view>
				</view>
			</view>

			<!-- 右侧操作按钮组 -->
			<view class="action-buttons">
				<!-- 搜索历史按钮 -->
				<view class="action-btn history-btn" @click="toggleSearchHistory" :class="{ active: showSearchHistory }">
					<view class="btn-content">
						<text class="icon-emoji" :style="{ color: showSearchHistory ? '#f5a623' : '#d4922a' }">📜</text>
						<text class="btn-label" :style="{ color: showSearchHistory ? '#f5a623' : '#d4922a' }">历史</text>
					</view>
				</view>

				<!-- 筛选按钮 -->
				<view class="action-btn filter-btn" @click="openQuickFilter">
					<view class="btn-content">
						<text class="icon-emoji" style="color: #4caf50">🔽</text>
						<text class="btn-label" style="color: #4caf50">筛选</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 搜索历史面板 -->
		<view class="search-history-panel" v-if="showSearchHistory">
			<view class="history-header">
				<view class="header-title">
					<text class="icon-emoji" style="color: #409eff; margin-right: 6rpx">📜</text>
					<text class="title-text">搜索历史</text>
				</view>
				<view class="header-actions">
					<text class="clear-all" @click="clearSearchHistory">清空</text>
				</view>
			</view>
			<view class="history-content" v-if="searchHistory.length > 0">
				<view class="history-item" v-for="(item, index) in recentSearchHistory" :key="index"
					@click="useHistorySearch(item)">
					<view class="history-icon">
						<text class="icon-emoji">{{ item.type === 'plate' ? '🚗' : item.type === 'phone' ? '📱' :
							item.type === 'name' ? '👤' : '🔍' }}</text>
					</view>
					<text class="history-text">{{ item.keyword }}</text>
					<view class="history-time">{{ formatHistoryTime(item.time) }}</view>
					<view class="history-delete" @click.stop="removeSearchHistory(index)">
						<text class="icon-emoji" style="color: #999">×</text>
					</view>
				</view>
			</view>
			<view class="history-empty" v-else>
				<text class="icon-emoji" style="font-size: 48rpx; color: #e0e3e6">🔍</text>
				<text class="empty-text">暂无搜索历史</text>
			</view>
		</view>

		<!-- 热门搜索标签 -->
		<view class="hot-search-tags" v-if="!searchFocused && !showSearchHistory && searchKeyword.length === 0">
			<view class="tags-header">
				<text class="icon-emoji" style="color: #ff6b35; margin-right: 6rpx">🔥</text>
				<text class="tags-title">热门搜索</text>
			</view>
			<view class="tags-container">
				<view class="hot-tag" v-for="(tag, index) in hotSearchTags" :key="index" @click="useHotSearch(tag)">
					<text class="tag-text">{{ tag.text }}</text>
					<view class="tag-count" v-if="tag.count">{{ tag.count }}</view>
				</view>
			</view>
		</view>
		<!-- 1. 增加加载状态提示 -->
		<u-loading-page :loading="loading" bgColor="#f5f7fa"></u-loading-page>
		<!-- 智能筛选栏 - 双行布局方案 -->
		<view class="smart-filter-container">
			<!-- 第一行：时间相关筛选 -->
			<view class="filter-row time-filters">
				<text class="filter-label">时间:</text>
				<view class="filter-chips">
					<view class="filter-chip" :class="{ active: currentPreset === 'todayPending' }"
						@click="applyPresetFilter('todayPending')">
						<text class="chip-text">今日待审</text>
						<text class="chip-count">{{ getTodayPendingCount() }}</text>
					</view>
					<view class="filter-chip" :class="{ active: currentPreset === 'weekApproved' }"
						@click="applyPresetFilter('weekApproved')">
						<text class="chip-text">本周通过</text>
						<text class="chip-count">{{ getWeekApprovedCount() }}</text>
					</view>
					<view class="filter-chip" :class="{ active: currentPreset === 'allRecords' }"
						@click="applyPresetFilter('allRecords')">
						<text class="chip-text">全部记录</text>
						<text class="chip-count">{{ getAllRecordsCount() }}</text>
					</view>
				</view>

				<!-- 高级筛选按钮 -->
				<view class="advanced-filter-btn" @click="toggleAdvancedFilter">
					<text class="btn-icon">⚙️</text>
				</view>
			</view>

			<!-- 第二行：状态相关筛选 -->
			<view class="filter-row status-filters">
				<text class="filter-label">状态:</text>
				<view class="filter-chips">
					<view class="filter-chip" :class="{ active: current1 === 0 }" @click="quickFilterByStatus('全部')">
						<text class="chip-text">全部</text>
						<text class="chip-count">{{ statistics.total }}</text>
					</view>
					<view class="filter-chip" :class="{ active: current1 === 1 }" @click="quickFilterByStatus('待审批')" v-if="statistics.pending > 0">
						<text class="chip-icon">⏳</text>
						<text class="chip-text">待审</text>
						<text class="chip-count">{{ statistics.pending }}</text>
					</view>
					<view class="filter-chip" @click="quickFilterByVehicleStatus('已进场')" v-if="statistics.entered > 0">
						<text class="chip-icon">🚗</text>
						<text class="chip-text">在场</text>
						<text class="chip-count">{{ statistics.entered }}</text>
					</view>
					<view class="filter-chip" @click="handleTodayFilter">
						<text class="chip-icon">📅</text>
						<text class="chip-text">今日专项</text>
					</view>
				</view>
			</view>

			<!-- 当前筛选状态显示 -->
			<view class="current-filter-status" v-if="hasActiveFilters">
				<text class="status-text">当前筛选: {{ getCurrentFilterDescription() }}</text>
				<view class="clear-filter-btn" @click="clearAllFilters">
					<text class="clear-text">清除</text>
				</view>
			</view>
		</view>

		<!-- 高级筛选面板 -->
		<view class="advanced-filter-panel" v-if="showAdvancedFilter" :class="{ 'panel-show': showAdvancedFilter }">
			<view class="panel-header">
				<text class="panel-title">🔍 高级筛选</text>
				<view class="panel-close" @click="toggleAdvancedFilter">
					<text class="close-icon">▲</text>
				</view>
			</view>
			
			<view class="panel-content">
				<!-- 状态筛选区域 -->
				<view class="filter-section">
					<view class="section-title">
						<text class="title-text">状态筛选</text>
						<text class="title-desc">可多选</text>
					</view>
					<view class="status-checkboxes">
											<view class="checkbox-item" v-for="(status, index) in statusFilterOptions" :key="index"
						@click="toggleAdvancedStatusFilter(status.value)">
							<view class="checkbox-icon" :class="{ checked: status.checked }">
								<text class="check-mark" v-if="status.checked">✓</text>
							</view>
							<text class="checkbox-label">{{ status.label }}</text>
							<text class="checkbox-count">({{ getStatusCount(status.value) }})</text>
						</view>
					</view>
				</view>
				
				<!-- 时间筛选区域 -->
				<view class="filter-section">
					<view class="section-title">
						<text class="title-text">时间筛选</text>
						<text class="title-desc">单选</text>
					</view>
					<view class="time-radios">
						<view class="radio-item" v-for="(time, index) in timeFilterOptions" :key="index"
							@click="selectTimeFilter(time.value)">
							<view class="radio-icon" :class="{ checked: selectedTimeFilter === time.value }">
								<view class="radio-dot" v-if="selectedTimeFilter === time.value"></view>
							</view>
							<text class="radio-label">{{ time.label }}</text>
							<text class="radio-count">({{ getTimeCount(time.value) }})</text>
						</view>
					</view>
				</view>
				
				<!-- 预设方案区域 -->
				<view class="filter-section">
					<view class="section-title">
						<text class="title-text">预设方案</text>
						<text class="title-desc">一键筛选</text>
					</view>
					<view class="preset-schemes">
						<view class="scheme-item" v-for="(scheme, index) in presetSchemes" :key="index"
							@click="applyPresetScheme(scheme)">
							<text class="scheme-icon">{{ scheme.icon }}</text>
							<text class="scheme-name">{{ scheme.name }}</text>
							<text class="scheme-count">({{ getSchemeCount(scheme) }})</text>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 面板底部操作按钮 -->
			<view class="panel-actions">
				<view class="action-btn reset-btn" @click="resetAdvancedFilter">
					<text class="btn-text">重置</text>
				</view>
				<view class="action-btn apply-btn" @click="applyAdvancedFilter">
					<text class="btn-text">应用筛选</text>
				</view>
			</view>
		</view>
		<!-- 添加审批记录提示信息 -->
		<!-- <view class="approval-tips">
			<view class="tips-header">
				<text class="icon-emoji" style="color: #409eff">📋</text>
				<text class="tips-title">审批记录</text>
			</view>
			<view class="tips-content">
				<text class="tip-item">• 今日预约重点显示</text>
				<text class="tip-item">• 左滑快速操作</text>
			</view>
		</view> -->

		<!-- 智能数据统计卡片 -->
		<view class="smart-stats-panel">
			<view class="stats-header">
				<view class="stats-title">
					<text class="icon-emoji" style="color: #409eff; margin-right: 8rpx">📋</text>
					<text>📈 今日数据</text>
					<text class="vs-text">vs 昨日</text>
				</view>
				<u-tag text="实时更新" type="primary" size="mini" plain
					:custom-style="{ fontSize: '20rpx', padding: '2rpx 8rpx' }"></u-tag>
			</view>

			<!-- 核心指标网格 -->
			<view class="core-metrics-grid">
				<view class="metric-item" @click="quickFilterByStatus('全部')">
					<view class="metric-value">{{ statistics.total }}</view>
					<view class="metric-label">新增</view>
					<view class="metric-trend" :class="totalTrendClass">
						<text class="trend-icon">{{ totalTrendIcon }}</text>
						<text class="trend-text">+{{ totalTrendValue }}</text>
					</view>
				</view>

				<view class="metric-item" @click="quickFilterByStatus('待审批')">
					<view class="metric-value">{{ statistics.pending }}</view>
					<view class="metric-label">待审</view>
					<view class="metric-trend urgent" v-if="statistics.urgent > 0">
						<text class="trend-icon">⚡</text>
						<text class="trend-text">急{{ statistics.urgent }}</text>
					</view>
					<view class="metric-trend normal" v-else>
						<text class="trend-icon">📋</text>
						<text class="trend-text">正常</text>
					</view>
				</view>

				<view class="metric-item" @click="quickFilterByStatus('已通过')">
					<view class="metric-value">{{ statistics.approved }}</view>
					<view class="metric-label">通过</view>
					<view class="metric-trend" :class="approvedTrendClass">
						<text class="trend-icon">✅</text>
						<text class="trend-text">+{{ approvedTrendValue }}</text>
					</view>
				</view>

				<view class="metric-item efficiency" @click="showEfficiencyDetail">
					<view class="metric-value">{{ processingRate }}%</view>
					<view class="metric-label">处理率</view>
					<view class="metric-trend" :class="efficiencyTrendClass">
						<text class="trend-icon">📊</text>
						<text class="trend-text">{{ efficiencyTrendText }}</text>
					</view>
				</view>
			</view>

			<!-- 今日进度条 -->
			<view class="progress-section">
				<view class="progress-wrapper">
					<view class="progress-bar">
						<view class="progress-fill" :style="{ width: progressWidth + '%' }"></view>
						<view class="progress-segments">
							<view class="segment approved" :style="{ width: approvedPercent + '%' }"></view>
							<view class="segment rejected" :style="{ width: rejectedPercent + '%' }"></view>
						</view>
					</view>
					<view class="progress-label">
						<text class="progress-text">今日进度 {{ statistics.approved + statistics.rejected }}/{{
							statistics.total }}</text>
						<text class="progress-percentage">{{ Math.round(progressWidth) }}%</text>
					</view>
				</view>
			</view>


		</view>

		<!-- 数据可视化增强面板 -->
		<view class="data-visualization-panel" v-if="showDataVisualization">
			<view class="visualization-header">
				<view class="header-title">
					<text class="title-text">数据可视化</text>
				</view>
				<view class="header-actions">
					<view class="view-mode-toggle">
						<view class="mode-btn" :class="{ active: visualMode === 'chart' }"
							@click="switchVisualMode('chart')">
							<text class="icon-emoji"
								:style="{ color: visualMode === 'chart' ? '#ffffff' : '#722ed1' }">📊</text>
						</view>

						<view class="mode-btn" :class="{ active: visualMode === 'heatmap' }"
							@click="switchVisualMode('heatmap')">
							<text class="icon-emoji"
								:style="{ color: visualMode === 'heatmap' ? '#ffffff' : '#fa8c16' }">🔥</text>
						</view>
					</view>
					<view class="collapse-btn" @click="toggleDataVisualization">
						<text class="icon-emoji" style="color: #999">−</text>
					</view>
				</view>
			</view>

			<!-- 图表展示 -->
			<view class="chart-section" v-if="visualMode === 'chart'">
				<!-- 审批状态饼状图 -->
				<view class="chart-item full-width">
					<view class="chart-title">📊 审批状态统计</view>
					<view class="pie-chart-container">
						<view class="pie-chart">
							<!-- SVG 饼状图 -->
							<view class="pie-svg-container">
								<view class="pie-slice pending-slice" :style="{
									'--start-angle': '0deg',
									'--end-angle': getPendingAngle() + 'deg'
								}"></view>
								<view class="pie-slice approved-slice" :style="{
									'--start-angle': getPendingAngle() + 'deg',
									'--end-angle': (getPendingAngle() + getApprovedAngle()) + 'deg'
								}"></view>
								<view class="pie-slice rejected-slice" :style="{
									'--start-angle': (getPendingAngle() + getApprovedAngle()) + 'deg',
									'--end-angle': '360deg'
								}"></view>
								<view class="pie-center">
									<text class="center-number">{{ statistics.total }}</text>
									<text class="center-label">总数</text>
								</view>
							</view>
						</view>
						<view class="pie-legend">
							<view class="legend-item">
								<view class="legend-dot pending-dot"></view>
								<text class="legend-text">待审批 {{ statistics.pending }}</text>
							</view>
							<view class="legend-item">
								<view class="legend-dot approved-dot"></view>
								<text class="legend-text">已通过 {{ statistics.approved }}</text>
							</view>
							<view class="legend-item">
								<view class="legend-dot rejected-dot"></view>
								<text class="legend-text">未通过 {{ statistics.rejected }}</text>
							</view>
						</view>
					</view>
				</view>

				<!-- 车辆状态垂直柱状图 -->
				<view class="chart-item full-width">
					<view class="chart-title">🚗 车辆状态统计</view>
					<view class="vertical-bar-chart">
						<view class="bars-container">
							<view class="bar-column">
								<view class="bar-wrapper">
									<view class="vertical-bar entered-bar"
										:style="{ height: getVehicleBarHeight(statistics.entered) + '%' }">
										<view class="bar-value">{{ statistics.entered }}</view>
									</view>
								</view>
								<text class="bar-label">🟢 已进场</text>
							</view>
							<view class="bar-column">
								<view class="bar-wrapper">
									<view class="vertical-bar exited-bar"
										:style="{ height: getVehicleBarHeight(statistics.exited) + '%' }">
										<view class="bar-value">{{ statistics.exited }}</view>
									</view>
								</view>
								<text class="bar-label">🔴 已离场</text>
							</view>
							<view class="bar-column">
								<view class="bar-wrapper">
									<view class="vertical-bar unentered-bar"
										:style="{ height: getVehicleBarHeight(getUnenteredCount()) + '%' }">
										<view class="bar-value">{{ getUnenteredCount() }}</view>
									</view>
								</view>
								<text class="bar-label">⚪ 未进场</text>
							</view>
						</view>
						<view class="y-axis">
							<view class="y-label" v-for="i in 5" :key="i">{{ getMaxVehicleCount() * (5 - i + 1) / 5 }}
							</view>
						</view>
					</view>
				</view>
			</view>



			<!-- 数据对比视图 -->
			<view class="comparison-section" v-if="visualMode === 'heatmap'">
				<view class="chart-item full-width">
					<view class="chart-title">📊 数据对比分析</view>
					<view class="comparison-chart">
						<view class="comparison-item">
							<view class="comparison-header">
								<text class="comparison-title">今日 vs 昨日</text>
							</view>
							<view class="comparison-bars">
								<view class="comparison-bar">
									<text class="bar-label">今日新增</text>
									<view class="bar-container">
										<view class="bar-fill today-fill" :style="{ width: getTodayWidth() + '%' }">
										</view>
										<text class="bar-text">{{ getTodayCount() }}</text>
									</view>
								</view>
								<view class="comparison-bar">
									<text class="bar-label">昨日新增</text>
									<view class="bar-container">
										<view class="bar-fill yesterday-fill"
											:style="{ width: getYesterdayWidth() + '%' }"></view>
										<text class="bar-text">{{ getYesterdayCount() }}</text>
									</view>
								</view>
							</view>
						</view>
						<view class="comparison-summary">
							<text class="summary-text">
								📈 {{ getTrendText() }}
							</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 数据可视化切换按钮 -->
		<view class="data-viz-toggle" v-if="!showDataVisualization" @click="toggleDataVisualization">
			<text class="icon-emoji" style="color: #722ed1; margin-right: 6rpx">📊</text>
			<text class="toggle-text">数据可视化</text>
			<text class="icon-emoji" style="color: #666">⬆️</text>
		</view>

		<!-- 审批记录标题 -->
		<view class="records-title-section">
			<view class="records-title-content">
				<view class="title-left">
					<text class="icon-emoji" style="color: #409eff; margin-right: 12rpx">📋</text>
					<text class="title-text">审批记录</text>
					<view class="title-badge">
						<text class="badge-number">{{ validPendingList.length }}</text>
					</view>
				</view>
				<view class="title-right">
					<text class="icon-emoji" style="color: #909399" @click="refreshList">🔄</text>
				</view>
			</view>
			<view class="title-line"></view>
		</view>

		<!-- 手势操作提示 -->
		<view class="gesture-tips" v-if="!showGestureTips && validPendingList.length > 0">
			<view class="tips-content">
				<text class="icon-emoji" style="color: #409eff; margin-right: 6rpx">💡</text>
				<text class="tips-text">左滑操作，长按多选</text>
				<view class="tips-close" @click="showGestureTips = true">
					<text class="icon-emoji" style="color: #999">×</text>
				</view>
			</view>
		</view>

		<!-- 多选操作栏 -->
		<view class="multi-select-bar" v-if="isMultiSelectMode" :class="{ active: selectedItems.length > 0 }">
			<view class="select-info">
				<text class="select-count">已选择 {{ selectedItems.length }} 项</text>
				<text class="select-all" @click="toggleSelectAll">
					{{ selectedItems.length === pendingList.length ? '取消全选' : '全选' }}
				</text>
			</view>
			<view class="select-actions">
				<view class="action-item" @click="batchApprove" v-if="canBatchApprove">
					<text class="icon-emoji" style="color: #52c41a">✅</text>
					<text class="action-text">批量通过</text>
				</view>
				<view class="action-item" @click="batchReject" v-if="canBatchReject">
					<text class="icon-emoji" style="color: #f5222d">❌</text>
					<text class="action-text">批量拒绝</text>
				</view>
				<view class="action-item" @click="batchExport">
					<text class="icon-emoji" style="color: #409eff">📥</text>
					<text class="action-text">导出</text>
				</view>
			</view>
			<view class="select-close" @click="exitMultiSelectMode">
				<text class="icon-emoji" style="color: #999">×</text>
			</view>
		</view>

		<!-- 优化后的列表项 - 参考facility.vue的简洁实现 -->
		<u-swipe-action ref="uSwipeAction">
			<u-swipe-action-item v-for="(item, index) in validPendingList" :key="item.id" :options="getSwipeOptions(item)"
				:index="index" :name="index" @click="handleSwipeAction">
				
				<!-- 多选复选框 -->
				<view class="multi-select-checkbox" v-if="isMultiSelectMode" @click.stop="toggleItemSelection(item)">
					<view class="checkbox-icon" :class="{ checked: selectedItems.includes(item.id) }">
						<text class="icon-emoji" style="color: #fff" v-if="selectedItems.includes(item.id)">✓</text>
					</view>
				</view>

				<!-- 卡片内容 -->
				<view class="list-item" :class="{
					selected: selectedItems.includes(item.id),
					multiSelectMode: isMultiSelectMode
				}" @longpress="handleLongPress(index)">
					<!-- 精简版卡片设计 -->
					<view class="simplified-card" :class="{ 'today-card': item.appointmentTime && isToday(item.appointmentTime) }">
						<view class="card-content">
							<!-- 左侧信息区域 -->
							<view class="left-content">
								<!-- 预约类型图标 -->
								<view class="type-icon">
									<text class="icon-emoji" style="color: #409eff; font-size: 32rpx">
										{{ (item.appointmentTime && isToday(item.appointmentTime)) ? '🔥' : (item.appointmentTime && isYesterday(item.appointmentTime)) ? '🕐' : '📅' }}
									</text>
									<text class="type-text">
										{{ (item.appointmentTime && isToday(item.appointmentTime)) ? '今日预约' : (item.appointmentTime && isYesterday(item.appointmentTime)) ? '昨日预约' : '预约' }}
									</text>
								</view>

								<!-- 车牌号 -->
								<view class="plate-row">
									<text class="icon-emoji" style="color: #2196F3; margin-right: 8rpx">🚗</text>
									<text class="plate-text" :class="(item.plateNumber && item.plateNumber.length === 8) ? 'green-plate' : 'blue-plate'">
										{{ item.plateNumber || '未知' }}
									</text>
								</view>

								<!-- 联系信息 -->
								<view class="contact-row">
									<view class="contact-item">
										<text class="icon-emoji" style="color: #666; margin-right: 6rpx">👤</text>
										<text class="contact-text">{{ item.name || '未知' }}</text>
									</view>
									<view class="contact-item">
										<text class="icon-emoji" style="color: #666; margin-right: 6rpx">📱</text>
										<text class="contact-text">{{ item.phone || '未知' }}</text>
									</view>
								</view>

								<!-- 地址信息 -->
								<view class="address-row">
									<text class="icon-emoji" style="color: #FF5722; margin-right: 6rpx">📍</text>
									<text class="address-text">{{ item.addressDetail || '未知地址' }}</text>
								</view>
							</view>

							<!-- 右侧状态区域 -->
							<view class="right-content">
								<!-- 时间信息 -->
								<view class="time-info">
									<text class="icon-emoji" style="color: #666; margin-right: 4rpx">⏰</text>
									<text class="time-text">{{ item.appointmentTime ? formatAppointmentTime(item.appointmentTime) : '未知时间' }}</text>
								</view>

								<!-- Status tags -->
								<view class="status-info">
									<view class="status-tag" :class="{
										'status-pending': (item.status || '未知') === '待审批',
										'status-approved': (item.status || '未知') === '已通过',
										'status-rejected': (item.status || '未知') === '未通过',
										'status-unknown': (item.status || '未知') === '未知'
									}">
										<text class="status-icon">{{ getStatusIcon(item.status || '未知') }}</text>
										<text class="status-text">{{ item.status || '未知' }}</text>
									</view>
								</view>
							</view>
						</view>
					</view>
				</view>
			</u-swipe-action-item>
		</u-swipe-action>
		<!-- 4. 空状态处理 -->

		<!-- 快速筛选侧滑面板 -->
		<view class="quick-filter-overlay" :class="{ active: showQuickFilter }" @touchmove.stop.prevent
			@click="closeQuickFilter">
		</view>

		<view class="quick-filter-panel" :class="{ active: showQuickFilter }" @touchmove.stop.prevent>
			<!-- 面板头部 -->
			<view class="panel-header">
				<view class="header-title">
					<text class="icon-emoji" style="color: #409eff; margin-right: 8rpx">🔽</text>
					<text class="title-text">快速筛选</text>
				</view>
				<view class="header-close" @click="closeQuickFilter">
					<text class="icon-emoji" style="color: #999">×</text>
				</view>
			</view>

			<!-- 时间范围选择 -->
			<view class="filter-section">
				<view class="section-header">
					<text class="section-title">时间范围</text>
				</view>
				<view class="time-range-options">
					<view class="range-option" :class="{ active: quickTimeRange === null }"
						@click="setQuickTimeRange(null)">
						<view class="option-radio" :class="{ checked: quickTimeRange === null }"></view>
						<text class="option-text">全部时间</text>
					</view>
					<view class="range-option" :class="{ active: quickTimeRange === 1 }" @click="setQuickTimeRange(1)">
						<view class="option-radio" :class="{ checked: quickTimeRange === 1 }"></view>
						<text class="option-text">今日</text>
					</view>
					<view class="range-option" :class="{ active: quickTimeRange === 3 }" @click="setQuickTimeRange(3)">
						<view class="option-radio" :class="{ checked: quickTimeRange === 3 }"></view>
						<text class="option-text">近三天</text>
					</view>
					<view class="range-option" :class="{ active: quickTimeRange === 7 }" @click="setQuickTimeRange(7)">
						<view class="option-radio" :class="{ checked: quickTimeRange === 7 }"></view>
						<text class="option-text">近一周</text>
					</view>
				</view>
			</view>

			<!-- 状态筛选 -->
			<view class="filter-section">
				<view class="section-header">
					<text class="section-title">状态筛选</text>
				</view>
				<view class="status-checkboxes">
					<view class="checkbox-item" :class="{ active: quickStatusFilter.includes('待审批') }"
						@click="toggleStatusFilter('待审批')">
						<view class="checkbox" :class="{ checked: quickStatusFilter.includes('待审批') }">
							<text class="icon-emoji" style="color: #fff"
								v-if="quickStatusFilter.includes('待审批')">✓</text>
						</view>
						<text class="checkbox-text">⏳ 待审批</text>
						<view class="status-count">{{ statistics.pending }}</view>
					</view>
					<view class="checkbox-item" :class="{ active: quickStatusFilter.includes('已通过') }"
						@click="toggleStatusFilter('已通过')">
						<view class="checkbox" :class="{ checked: quickStatusFilter.includes('已通过') }">
							<text class="icon-emoji" style="color: #fff"
								v-if="quickStatusFilter.includes('已通过')">✓</text>
						</view>
						<text class="checkbox-text">✅ 已通过</text>
						<view class="status-count">{{ statistics.approved }}</view>
					</view>
					<view class="checkbox-item" :class="{ active: quickStatusFilter.includes('未通过') }"
						@click="toggleStatusFilter('未通过')">
						<view class="checkbox" :class="{ checked: quickStatusFilter.includes('未通过') }">
							<text class="icon-emoji" style="color: #fff"
								v-if="quickStatusFilter.includes('未通过')">✓</text>
						</view>
						<text class="checkbox-text">❌ 未通过</text>
						<view class="status-count">{{ statistics.rejected }}</view>
					</view>
				</view>
			</view>

			<!-- 车辆状态 -->
			<view class="filter-section">
				<view class="section-header">
					<text class="section-title">车辆状态</text>
				</view>
				<view class="vehicle-checkboxes">
					<view class="checkbox-item" :class="{ active: quickVehicleFilter.includes('已进场') }"
						@click="toggleVehicleFilter('已进场')">
						<view class="checkbox" :class="{ checked: quickVehicleFilter.includes('已进场') }">
							<text class="icon-emoji" style="color: #fff"
								v-if="quickVehicleFilter.includes('已进场')">✓</text>
						</view>
						<text class="checkbox-text">🟢 已进场</text>
						<view class="status-count">{{ statistics.entered }}</view>
					</view>
					<view class="checkbox-item" :class="{ active: quickVehicleFilter.includes('已离场') }"
						@click="toggleVehicleFilter('已离场')">
						<view class="checkbox" :class="{ checked: quickVehicleFilter.includes('已离场') }">
							<text class="icon-emoji" style="color: #fff"
								v-if="quickVehicleFilter.includes('已离场')">✓</text>
						</view>
						<text class="checkbox-text">🔴 已离场</text>
						<view class="status-count">{{ statistics.exited }}</view>
					</view>
					<view class="checkbox-item" :class="{ active: quickVehicleFilter.includes('未进场') }"
						@click="toggleVehicleFilter('未进场')">
						<view class="checkbox" :class="{ checked: quickVehicleFilter.includes('未进场') }">
							<text class="icon-emoji" style="color: #fff"
								v-if="quickVehicleFilter.includes('未进场')">✓</text>
						</view>
						<text class="checkbox-text">⚪ 未进场</text>
						<view class="status-count">{{ getUnenteredCount() }}</view>
					</view>
				</view>
			</view>

			<!-- 操作按钮 -->
			<view class="panel-actions">
				<view class="action-button reset-btn" @click="resetQuickFilter">
					<text class="btn-text">重置</text>
				</view>
				<view class="action-button apply-btn" @click="applyQuickFilter">
					<text class="btn-text">应用筛选</text>
				</view>
			</view>
		</view>

		<!-- 原有的筛选弹窗保留 -->
		<u-popup :show="showFilter" mode="top" :round="16" @close="showFilter = false">
			<view class="filter-panel">
				<!-- 时间选择 -->
				<view class="section-title">按时间选择</view>
				<!-- 时间选择行 -->
				<view class="time-row">
					<view class="time-item" @click="showStartPicker = true">
						<text class="time-label">预约开始时间</text>
						<view class="time-value">
							{{ formattedStartTime || '选择日期' }}
							<text class="icon-emoji" style="color: #909399">📅</text>
						</view>
					</view>

					<view class="time-item" @click="showEndPicker = true">
						<text class="time-label">预约结束时间</text>
						<view class="time-value">
							{{ formattedEndTime || '选择日期' }}
							<text class="icon-emoji" style="color: #909399">📅</text>
						</view>
					</view>
				</view>

				<!-- 状态选择 -->
				<view class="section-title">按状态选择</view>
				<view class="status-btns">
					<u-button v-for="(item, index) in statusOptions" :key="index"
						:custom-style="getStatusBtnStyle(item.value)" @click="selectedStatus = item.value">
						{{ item.label }}
					</u-button>
				</view>

				<!-- 时间选择器 -->
				<u-datetime-picker :show="showStartPicker" v-model="startTimestamp" mode="date"
					@confirm="handleDateConfirm('start')" @cancel="showStartPicker = false" />
				<u-datetime-picker :show="showEndPicker" v-model="endTimestamp" mode="date"
					@confirm="handleDateConfirm('end')" @cancel="showEndPicker = false" />

				<!-- 操作按钮 -->
				<view class="action-bar">
					<u-button shape="circle" @click="resetFilter" :custom-style="resetBtnStyle">
						重置
					</u-button>
					<u-button type="primary" shape="circle" @click="confirmFilter" :custom-style="confirmBtnStyle">
						确定
					</u-button>
				</view>
			</view>
		</u-popup>
		
		<!-- 详情弹窗 -->
		<u-popup :show="showDetailPopup" mode="center" :round="12" @close="closeDetailModal" width="98%" height="88%">
			<view class="detail-popup" v-if="currentDetailItem">
				<!-- 弹窗头部 -->
				<view class="detail-header">
					<text class="detail-title">📋 审批记录详情</text>
					<view class="detail-close" @click="closeDetailModal">
						<text class="icon-emoji" style="color: #999">✕</text>
					</view>
				</view>
				
				<!-- 详情内容 -->
				<scroll-view scroll-y class="detail-content">
					<!-- 基本信息 -->
					<view class="detail-section">
						<view class="section-title">🔍 基本信息</view>
						<view class="info-card">
							<view class="info-row">
								<text class="info-label">🚗 车牌号码：</text>
								<text class="info-value">{{ currentDetailItem.plateNumber }}</text>
							</view>
							<view class="info-row">
								<text class="info-label">👤 申请人员：</text>
								<text class="info-value">{{ currentDetailItem.name }}</text>
							</view>
							<view class="info-row">
								<text class="info-label">📱 联系电话：</text>
								<text class="info-value">{{ currentDetailItem.phone }}</text>
							</view>
							<view class="info-row">
								<text class="info-label">⏰ 预约时间：</text>
								<text class="info-value">{{ currentDetailItem.appointmentTime }}</text>
							</view>
							<view class="info-row">
								<text class="info-label">📋 审批状态：</text>
								<text class="info-value" :class="{
									'status-pending': currentDetailItem.status === '待审批',
									'status-approved': currentDetailItem.status === '已通过',
									'status-rejected': currentDetailItem.status === '未通过'
								}">
									{{ getStatusIcon(currentDetailItem.status) }} {{ currentDetailItem.status }}
								</text>
							</view>
							<view class="info-row">
								<text class="info-label">🆔 记录编号：</text>
								<text class="info-value">{{ currentDetailItem.id }}</text>
							</view>
						</view>
					</view>
					
					<!-- 详细地址 -->
					<view class="detail-section">
						<view class="section-title">📍 详细地址</view>
						<view class="info-card">
							<view class="info-row">
								<text class="info-label">🏠 具体地址：</text>
								<text class="info-value">{{ currentDetailItem.addressDetail }}</text>
							</view>
						</view>
					</view>
					
					<!-- 申请说明 - 始终显示 -->
					<view class="detail-section">
						<view class="section-title">💼 申请说明</view>
						<view class="info-card">
							<view class="info-row">
								<text class="info-label">💡 申请描述：</text>
								<text class="info-value">{{ currentDetailItem.description || '暂无申请说明' }}</text>
							</view>
						</view>
					</view>
					
					<!-- 车辆进出记录 - 始终显示 -->
					<view class="detail-section">
						<view class="section-title">🚗 车辆进出记录</view>
						<view class="info-card">
							<view class="info-row">
								<text class="info-label">📊 当前状态：</text>
								<text class="info-value" :class="{
									'vehicle-status-entered': currentDetailItem.vehicleStatus === '已进场',
									'vehicle-status-exited': currentDetailItem.vehicleStatus === '已离场',
									'vehicle-status-not-entered': (currentDetailItem.vehicleStatus === '未进场' || !currentDetailItem.vehicleStatus)
								}">
									{{ getVehicleStatusIcon(currentDetailItem.vehicleStatus || '未进场') }} {{ currentDetailItem.vehicleStatus || '未进场' }}
								</text>
							</view>
							
							<!-- 时间轴 - 始终显示，但根据数据显示不同内容 -->
							<view class="timeline">
								<view class="timeline-title">🕐 时间轴：</view>
								<view class="timeline-line">●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●</view>
								
								<!-- 根据不同状态显示不同内容 -->
								<template v-if="currentDetailItem.status === '待审批'">
									<view class="timeline-item">
										<text class="timeline-label">⏳ 当前状态：</text>
										<text class="timeline-value">等待审批中...</text>
									</view>
									<view class="timeline-item">
										<text class="timeline-label">📝 申请时间：</text>
										<text class="timeline-value">{{ currentDetailItem.appointmentTime }}</text>
									</view>
								</template>
								
								<template v-else-if="currentDetailItem.status === '未通过'">
									<view class="timeline-item">
										<text class="timeline-label">❌ 审批结果：</text>
										<text class="timeline-value">申请未通过</text>
									</view>
									<view class="timeline-item">
										<text class="timeline-label">📝 申请时间：</text>
										<text class="timeline-value">{{ currentDetailItem.appointmentTime }}</text>
									</view>
								</template>
								
								<template v-else-if="currentDetailItem.status === '已通过'">
									<view class="timeline-item" v-if="currentDetailItem.entryTime">
										<text class="timeline-label">🟢 进场时间：</text>
										<text class="timeline-value">{{ currentDetailItem.entryTime }}</text>
									</view>
									<view class="timeline-item" v-else>
										<text class="timeline-label">⏳ 进场状态：</text>
										<text class="timeline-value">尚未进场</text>
									</view>
									
									<view class="timeline-item" v-if="currentDetailItem.exitTime">
										<text class="timeline-label">🔴 离场时间：</text>
										<text class="timeline-value">{{ currentDetailItem.exitTime }}</text>
									</view>
									<view class="timeline-item" v-else-if="currentDetailItem.entryTime">
										<text class="timeline-label">🚗 离场状态：</text>
										<text class="timeline-value">车辆在场中</text>
									</view>
									
									<view class="timeline-item" v-if="currentDetailItem.entryTime && currentDetailItem.exitTime">
										<text class="timeline-label">⏱️ 停留时长：</text>
										<text class="timeline-value">{{ calcDuration(currentDetailItem.entryTime, currentDetailItem.exitTime) }}</text>
									</view>
								</template>
							</view>
						</view>
					</view>
				</scroll-view>
				
				<!-- 底部操作按钮 -->
				<view class="detail-actions">
					<view class="action-btn share-btn" @click="shareRecord(currentDetailItem)">
						<text class="btn-icon">📤</text>
						<text class="btn-text">分享记录</text>
					</view>
					<view class="action-btn note-btn" @click="addNote(currentDetailItem)">
						<text class="btn-icon">📝</text>
						<text class="btn-text">添加备注</text>
					</view>
				</view>
			</view>
		</u-popup>
	</view>
</template>

<script>
import dayjs from 'dayjs'
import TimeUtils from '@/utils/timeUtils.js'

export default {
	data() {
		return {
			originalList: [],
			hasClickedPending: false,
			swipeOptions: [{
				text: '删除',
				style: {
					backgroundColor: '#fa3534'
				}
			}],
			showDeletePopup: null,
			timeRanges: [{
				label: '近三天',
				value: 3
			},
			{
				label: '近五天',
				value: 5
			},
			{
				label: '近一周',
				value: 7
			}
			],
			startTimestamp: null,
			endTimestamp: null,
			showStartPicker: false,
			showEndPicker: false,
			selectedRange: null,
			// 状态相关
			statusOptions: [{
				label: '待审批',
				value: '待审批'
			},
			{
				label: '已通过',
				value: '已通过'
			},
			{
				label: '未通过',
				value: '未通过'
			}
			],
			selectedStatus: null,
			current1: 0,
			listSubsection: ["全部", "待审批", "已通过", "未通过"],
			
			// 方案三：抽屉式筛选相关数据
			showAdvancedFilter: false, // 是否显示高级筛选面板
			currentPreset: null, // 当前选中的预设筛选
			
			// 状态筛选选项（支持多选）
			statusFilterOptions: [
				{ label: '待审批', value: '待审批', checked: false },
				{ label: '已通过', value: '已通过', checked: false },
				{ label: '未通过', value: '未通过', checked: false }
			],
			
			// 时间筛选选项（单选）
			timeFilterOptions: [
				{ label: '近三天', value: 3 },
				{ label: '近五天', value: 5 },
				{ label: '近一周', value: 7 },
				{ label: '全部时间', value: null }
			],
			selectedTimeFilter: null, // 当前选中的时间筛选
			
			// 预设方案
			presetSchemes: [
				{ 
					name: '今日待审批', 
					icon: '🔥', 
					status: ['待审批'], 
					timeRange: 0, // 今日
					key: 'todayPending' 
				},
				{ 
					name: '本周已通过', 
					icon: '✅', 
					status: ['已通过'], 
					timeRange: 7, 
					key: 'weekApproved' 
				},
				{ 
					name: '全部未通过', 
					icon: '❌', 
					status: ['未通过'], 
					timeRange: null, 
					key: 'allRejected' 
				},
				{ 
					name: '紧急处理', 
					icon: '⚡', 
					status: ['待审批'], 
					timeRange: 0, 
					key: 'urgent' 
				}
			],
			
			// 初始化选中状态
			urgencyOptions: [{
				label: '普通',
				value: 1,
				checked: false
			},
			{
				label: '紧急',
				value: 2,
				checked: true
			}
			],
			statusColorMap: {
				'紧急': {
					bg: '#fff1f0',
					color: '#ff4d4f',
					border: '#ffccc7'
				},
				'高': {
					bg: '#fff7e6',
					color: '#fa8c16',
					border: '#ffe7ba'
				},
				'普通': {
					bg: '#e6f7ff',
					color: '#1890ff',
					border: '#91d5ff'
				}
			},
			options: [{
				text: '查看详情',
				style: {
					backgroundColor: '#0081ff'
				},
				type: 'approve' // 新增类型标识
			},
			{
				text: '删除记录',
				style: {
					backgroundColor: '#ff2b18'
				},
				type: 'reject' // 新增类型标识
			}
			],
			pendingList: [{
				id: '20230316101',
				name: '张先生',
				plateNumber: "黑A11111",
				phone: "13578458529",
				appointmentTime: '2025-04-16 09:30',
				description: '老人外出就医申请',
				status: '已通过',
				addressDetail: "3栋2单元302",
				entryTime: '2025-04-16 14:30',
				exitTime: '2025-04-16 16:30',
				vehicleStatus: "已离场",
				showAction: false
			},
			{
				id: '20230316201',
				name: '李女士',
				plateNumber: "黑A22222",
				phone: "13812345678",
				appointmentTime: '2025-04-18 09:30',
				description: '看病预约',
				addressDetail: "5栋3单元702",
				status: '已通过',
				entryTime: '2025-04-18 14:30',
				vehicleStatus: "已进场",
				showAction: false
			}, {
				id: '20230316301',
				name: '王经理',
				plateNumber: "黑A33333",
				phone: "13987654321",
				appointmentTime: '2025-04-19 09:30',
				description: '商务拜访',
				addressDetail: "20栋5单元102",
				status: '待审批',
				showAction: false
			}, {
				id: '20230316302',
				name: '陈师傅',
				plateNumber: "黑A12201",
				phone: "13567890123",
				appointmentTime: '2025-04-19 09:30',
				description: '维修服务',
				addressDetail: "20栋5单元102",
				status: '未通过',
				showAction: false
			}, {
				id: '20230316303',
				name: '张工',
				plateNumber: "黑A12111",
				phone: "13456789012",
				appointmentTime: '2025-04-19 09:30',
				description: '技术支持',
				addressDetail: "15栋4单元102",
				status: '待审批',
				showAction: false
			}, {
				id: '20230316304',
				name: '刘总',
				plateNumber: "黑A112211",
				phone: "13345678901",
				appointmentTime: '2025-04-19 09:30',
				description: '业务洽谈',
				addressDetail: "5栋3单元702",
				status: '待审批',
				showAction: false
			}, {
				id: '20230316305',
				name: '张小姐',
				plateNumber: "黑A55555",
				phone: "13234567890",
				appointmentTime: '2025-04-14 09:30',
				description: '探亲访友',
				status: '已通过',
				addressDetail: "3栋2单元302",
				entryTime: '2025-04-14 14:30',
				exitTime: '2025-04-14 16:30',
				vehicleStatus: "已离场",
				showAction: false
			}
			],

			showFilter: false,
			showTimePicker: false,
			timeParams: {
				year: true,
				month: true,
				day: true,
				hour: true,
				minute: true
			},
			urgencyValue: [], // 必须声明
			urgencyOptions: [{
				label: '普通',
				value: 1
			},
			{
				label: '紧急',
				value: 2
			}
			],
			top: 0, //标题图标距离顶部距离
			opacity: 0,
			scrollTop: 0.5,
			keyword: '',
			list: [
				'TuniaoUI现已发布V1.0.0',
				'今天天气晴朗，适合处理bug',
				'TuniaoUIV2.0.0即将发布',
				'今天想提前下班，领导不允许："你提前走人就算你是旷工了啊！"'
			],
			searchKeyword: '',
			currentTab: 0,
			selectedTimeRange: null, // 新增：跟踪当前选中的时间范围
			isFiltering: false, // 添加过滤状态标记
			loading: false, // 确保有loading状态变量
			// 统计数据
			statistics: {
				total: 0,
				pending: 0,
				approved: 0,
				rejected: 0,
				entered: 0,
				exited: 0,
				urgent: 0 // 紧急待审数量
			},
			// 昨日数据对比
			yesterdayStats: {
				total: 5,
				pending: 2,
				approved: 3,
				rejected: 0
			},
			// 趋势数据
			trendData: {
				total: 2,
				approved: 1,
				efficiency: 12
			},

			// 快速筛选面板
			showQuickFilter: false,
			quickTimeRange: null, // 快速时间范围筛选
			quickStatusFilter: [], // 快速状态筛选
			quickVehicleFilter: [], // 快速车辆状态筛选
			// 手势识别
			touchStartX: 0,
			touchStartY: 0,
			touchStartTime: 0,
			isSwiping: false,
			// 智能搜索相关
			searchFocused: false,
			showSuggestions: false,
			searchSuggestions: [],
			showSearchHistory: false,
			searchHistory: [],
			searchTimeout: null,
			// 热门搜索标签
			hotSearchTags: [
				{ text: '黑A', count: 12 },
				{ text: '张', count: 8 },
				{ text: '李女士', count: 6 },
				{ text: '135', count: 5 },
				{ text: '待审批', count: 15 },
				{ text: '已通过', count: 8 }
			],
			// 手势操作相关
			showGestureTips: false, // 是否已显示手势提示
			isMultiSelectMode: false, // 是否处于多选模式
			selectedItems: [], // 已选择的项目ID列表

			// 数据可视化
			showDataVisualization: false,
			visualMode: 'chart', // chart, heatmap
			// 对比数据
			todayCount: 7,
			yesterdayCount: 5,
			
			// 详情弹窗
			showDetailPopup: false,
			currentDetailItem: null,
			
			// 用户引导
			showButtonGuide: false,
			hasSeenGuide: false
		}
	},
	filters: {
		dateFormat(timestamp) {
			if (!timestamp) return '';
			const date = new Date(timestamp);
			return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
		}
	},

	computed: {
		// 过滤有效的待处理列表项，确保索引匹配
		validPendingList() {
			return this.pendingList.filter(item => item && typeof item === 'object' && item.id);
		},
		formattedStartTime() {
			return this.formatDate(this.startTimestamp);
		},
		formattedEndTime() {
			return this.formatDate(this.endTimestamp);
		},
		resetBtnStyle() {
			return {
				flex: 1,
				height: '70rpx',
				background: '#f8f9fa',
				color: '#666666',
				border: '1px solid #e0e3e6',
				fontSize: '26rpx',
				borderRadius: '35rpx'
			}
		},
		confirmBtnStyle() {
			return {
				flex: 1,
				height: '70rpx',
				marginLeft: '16rpx',
				background: '#2979ff',
				color: '#ffffff',
				fontSize: '26rpx',
				borderRadius: '35rpx'
			}
		},
		// 处理率计算
		processingRate() {
			if (this.statistics.total === 0) return 0;
			return Math.round(((this.statistics.approved + this.statistics.rejected) / this.statistics.total) * 100);
		},
		// 进度条宽度
		progressWidth() {
			if (this.statistics.total === 0) return 0;
			return ((this.statistics.approved + this.statistics.rejected) / this.statistics.total) * 100;
		},
		// 通过百分比
		approvedPercent() {
			if (this.statistics.total === 0) return 0;
			return (this.statistics.approved / this.statistics.total) * 100;
		},
		// 拒绝百分比
		rejectedPercent() {
			if (this.statistics.total === 0) return 0;
			return (this.statistics.rejected / this.statistics.total) * 100;
		},
		// 趋势样式类计算属性
		totalTrendClass() {
			const value = this.trendData.total || 0;
			if (value > 0) return 'trend-up';
			if (value < 0) return 'trend-down';
			return 'trend-stable';
		},
		approvedTrendClass() {
			const value = this.trendData.approved || 0;
			if (value > 0) return 'trend-up';
			if (value < 0) return 'trend-down';
			return 'trend-stable';
		},
		efficiencyTrendClass() {
			const efficiency = this.trendData.efficiency || 0;
			if (efficiency > 0) return 'trend-up';
			if (efficiency < 0) return 'trend-down';
			return 'trend-stable';
		},
		// 趋势图标计算属性
		totalTrendIcon() {
			const value = this.trendData.total || 0;
			if (value > 0) return '↗️';
			if (value < 0) return '↘️';
			return '➡️';
		},
		approvedTrendIcon() {
			const value = this.trendData.approved || 0;
			if (value > 0) return '↗️';
			if (value < 0) return '↘️';
			return '➡️';
		},
		// 趋势数值计算属性
		totalTrendValue() {
			return this.trendData.total || 0;
		},
		approvedTrendValue() {
			return this.trendData.approved || 0;
		},
		efficiencyTrendText() {
			const efficiency = this.trendData.efficiency || 0;
			if (efficiency > 0) return `+${efficiency}%`;
			if (efficiency < 0) return `${efficiency}%`;
			return '持平';
		},
		// 最近搜索历史（限制显示数量）
		recentSearchHistory() {
			return this.searchHistory.slice(0, 6);
		},
		// 是否可以批量通过
		canBatchApprove() {
			return this.selectedItems.some(id => {
				const item = this.validPendingList.find(item => item.id === id);
				return item && item.status === '待审批';
			});
		},
		// 是否可以批量拒绝
		canBatchReject() {
			return this.selectedItems.some(id => {
				const item = this.validPendingList.find(item => item.id === id);
				return item && item.status === '待审批';
			});
		},
		
		// 方案三：抽屉式筛选计算属性
		// 检查是否有活跃的筛选条件
		hasActiveFilters() {
			const hasStatusFilter = this.statusFilterOptions.some(item => item.checked);
			const hasTimeFilter = this.selectedTimeFilter !== null;
			const hasPreset = this.currentPreset !== null;
			return hasStatusFilter || hasTimeFilter || hasPreset;
		},
		


	},
	mounted() {
		// 自动更新时间数据
		this.updateTimes();
		// 初始化备份和统计数据
		this.originalList = [...this.pendingList];
		this.updateStatistics();
		// 初始化搜索历史
		this.loadSearchHistory();
		// 初始化可视化数据
		this.initializeVisualizationData();
	},
	methods: {
		// 更新时间数据
		updateTimes() {
			console.log('🕒 更新审批搜索时间...');
			try {
				TimeUtils.reset();

				// 更新待处理列表时间
				this.pendingList = this.pendingList.map((item, index) => {
					const appointmentTime = TimeUtils.getRecentTime(index % 7, 'YYYY-MM-DD HH:mm');
					const appointmentDate = new Date(appointmentTime);

					// 如果有进场时间，设置为预约时间后几小时
					let entryTime = item.entryTime;
					if (entryTime) {
						const entryDate = new Date(appointmentDate.getTime() + (4 + Math.random() * 2) * 60 *
							60 * 1000);
						entryTime = TimeUtils.formatDate(entryDate, 'YYYY-MM-DD HH:mm');
					}

					// 如果有离场时间，设置为进场时间后几小时
					let exitTime = item.exitTime;
					if (exitTime && entryTime) {
						const exitDate = new Date(new Date(entryTime).getTime() + (1 + Math.random() * 3) *
							60 * 60 * 1000);
						exitTime = TimeUtils.formatDate(exitDate, 'YYYY-MM-DD HH:mm');
					}

					return {
						...item,
						appointmentTime: appointmentTime,
						...(entryTime && {
							entryTime: entryTime
						}),
						...(exitTime && {
							exitTime: exitTime
						})
					};
				});

				// 更新统计数据
				this.updateStatistics();

				console.log('✅ 审批搜索时间更新完成');
			} catch (error) {
				console.error('❌ 更新审批搜索时间失败:', error);
			}
		},
		statusType(status) {
			const map = {
				'待审批': 'warning',
				'已通过': 'success',
				'未通过': 'error'
			}
			return map[status] || 'info';
		},
		getStatusColor(status) {
			const colorMap = {
				'已进场': '#4CAF50',
				'已离场': '#FF9800',
				'未进场': '#2196F3'
			};
			return colorMap[status] || '#F44336';
		},
		// 车辆状态类型映射
		vehicleStatusType(status) {
			const map = {
				'已进场': 'success',
				'已离场': 'warning',
				'未进场': 'info'
			}
			return map[status] || 'error';
		},

		// 时间格式化
		formatTime(timeStr) {
			return dayjs(timeStr).format('YYYY-MM-DD HH:mm');
		},

		// 计算时间差
		calcDuration(start, end) {
			const diff = dayjs(end).diff(dayjs(start), 'minute')
			const hours = Math.floor(diff / 60);
			const minutes = diff % 60;
			return `${hours}小时${minutes}分钟`;
		},
		getStatusClass(item) {
			if (item.exitTime) return 'exited';
			if (item.entryTime) return 'entered';
			return 'pending';
		},
		getStatusText(item) {
			if (item.exitTime) return '已离场';
			if (item.entryTime) return '已进场';
			return '待入场';
		},
		statusIcon(item) {
			const map = {
				'exited': 'checkmark-circle',
				'entered': 'clock',
				'pending': 'close-circle'
			}
			return map[this.getStatusClass(item)];
		},
		statusStyle(item) {
			const styleMap = {
				'exited': {
					background: '#fef0f0',
					color: '#f56c6c'
				},
				'entered': {
					background: '#f0f9eb',
					color: '#67c23a'
				},
				'pending': {
					background: '#f4f4f5',
					color: '#909399'
				}
			};
			return styleMap[this.getStatusClass(item)];
		},
		// 保留原来的导航方法，备用
		navigateToDetail(id, status) {
			console.log(status)
			// 跳转到查看详情页面
			uni.navigateTo({
				url: `/pages/site/approve_detail?id=${id}&status=${status}`
			})
		},
		// 切换tab
		changeTab(index) {
			this.currentTab = index
		},
		pad(num) {
			return num.toString().padStart(2, '0');
		},
		// 删除确认弹窗
		toggleDeletePopup(id) {
			this.showDeletePopup = this.showDeletePopup === id ? null : id
		},
		// 审核操作
		handleAudit(item) {
			// 提新用户审核成功
			uni.showToast({
				title: '审核成功',
				icon: 'success'
			})
			this.toggleDeletePopup(item.id)
		},
		// 格式化日期
		formatDate(timestamp) {
			if (!timestamp) return '';
			const date = new Date(timestamp);
			return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
		},

		// 快捷时间选择
		handleQuickTime(days) {
			this.selectedRange = days
			const end = new Date()
			const start = new Date()
			start.setDate(start.getDate() - days)

			// 仅设置时间范围，不更新显示值
			this.startTimestamp = start.getTime()
			this.endTimestamp = end.getTime()
		},

		// 时间按钮样式
		getTimeBtnStyle(value) {
			const isActive = this.selectedRange === value
			return {
				height: '64rpx',
				lineHeight: '64rpx',
				fontSize: '28rpx',
				background: isActive ? '#e8f4ff' : '#f5f5f5',
				color: isActive ? '#2979ff' : '#606266',
				border: `1px solid ${isActive ? '#2979ff' : '#e4e7ed'}`,
				transition: 'all 0.3s'
			}
		},

		// 状态按钮样式
		getStatusBtnStyle(value) {
			const isActive = this.selectedStatus === value
			return {
				height: '56rpx',
				lineHeight: '56rpx',
				fontSize: '24rpx',
				padding: '0 20rpx',
				background: isActive ? '#e8f4ff' : '#f8f9fa',
				color: isActive ? '#2979ff' : '#666666',
				border: `1px solid ${isActive ? '#2979ff' : '#e0e3e6'}`,
				borderRadius: '28rpx',
				transition: 'all 0.3s'
			}
		},

		// 日期选择确认
		handleDateConfirm(type) {
			this[`show${type.charAt(0).toUpperCase() + type.slice(1)}Picker`] = false
			this.selectedRange = null // 清除快捷选择状态
		},

		// 重置筛选
		resetFilter() {
			this.startTimestamp = null
			this.endTimestamp = null
			this.selectedRange = null
			this.selectedStatus = null
		},
		handleStartConfirm(time) {
			this.startTime = time;
			this.showStartPicker = false;
			if (this.endTime && this.endTime < time) {
				this.endTime = '';
			}
		},
		handleEndConfirm(time) {
			this.endTime = time;
			this.showEndPicker = false;
			if (this.startTime && this.startTime > time) {
				this.startTime = '';
			}
		},
		change1(index) {
			// 防止重复操作
			if (this.isFiltering) return;
			this.isFiltering = true;

			// 显示微小的加载提示
			this.loading = true;

			const statusMap = {
				0: "全部",
				1: '待审批',
				2: '已通过',
				3: '未通过'
			};

			// 保存当前index到current1
			this.current1 = index;

			// 延迟执行过滤操作，避免UI阻塞
			setTimeout(() => {
				// 先根据状态筛选
				let filteredList = this.originalList.filter(item => {
					if (this.current1 === 1) {
						return item.status === '待审批';
					} else if (this.current1 === 2) {
						return item.status === '已通过';
					} else if (this.current1 === 3) {
						return item.status === '未通过';
					} else if (this.current1 === 0) {
						return true;
					}
				});

				// 如果有时间筛选，再应用时间筛选
				if (this.selectedTimeRange !== null) {
					const end = new Date();
					const start = new Date();
					start.setDate(start.getDate() - this.selectedTimeRange);

					filteredList = filteredList.filter(item => {
						const itemTime = new Date(item.appointmentTime).getTime();
						return itemTime >= start.getTime() && itemTime <= end.getTime();
					});
				}

				// 有序地更新列表
				this.pendingList = filteredList;
				this.hasClickedPending = true;

				// 操作完成，重置状态
				this.loading = false;
				this.isFiltering = false;
			}, 50);
		},
		confirmFilter() {
			this.$emit('filter', this.urgencyValue)
			if (this.startTimestamp != null && this.endTimestamp != null && this.selectedStatus == null) {
				this.pendingList = this.originalList.filter(item => {
					const itemTime = new Date(item.appointmentTime).getTime();
					return itemTime >= this.startTimestamp && itemTime <= this.endTimestamp;
				});
			} else if (this.startTimestamp != null && this.endTimestamp != null && this.selectedStatus != null) {
				// 通过筛选的时间范围和审核状态进行查询筛选数据
				console.log("测试：", this.selectedStatus)
				this.pendingList = this.originalList.filter(item => {
					const itemTime = new Date(item.appointmentTime).getTime();
					return itemTime >= this.startTimestamp && itemTime <= this.endTimestamp && item.status ===
						this.selectedStatus;
				});
			} else if (this.selectedStatus != null && this.startTimestamp == null && this.endTimestamp == null) {
				console.log("测试1：", this.selectedStatus)
				this.pendingList = this.originalList.filter(item => {
					return item.status === this.selectedStatus;
				});
			} else {
				this.pendingList = this.originalList;
			}

			this.showFilter = false
		},
		resetFilter() {
			this.urgencyValue = []
			this.$emit('filter', [])
			this.showFilter = false
		},
		handlePopupClose() {
			// 关闭时恢复原始值
			this.urgencyValue = this.cachedValue
		},
		urgencyChange(values) {
			console.log('当前选中值:', values)
			// 此处可进行筛选逻辑处理
		},

		// 提交审核接口
		async submitAudit(id, type) {
			// 调用后端接口逻辑...
		},

		confirmTime(time) {
			console.log('筛选时间:', time)
			this.showTimePicker = false
		},
		// handleAudit(item) {
		// 	console.log('审核:', item);
		// 	// 这里可以添加审核逻辑
		// },
		initNavigation(e) {
			this.opacity = e.opacity;
			this.top = e.top;
		},
		opacityChange(e) {
			this.opacity = e.opacity;
		},
		back() {
			uni.navigateBack();
		},
		onPageScroll(e) {
			this.scrollTop = e.scrollTop;
		},
		getTimeTagStyle(value) {
			const isActive = this.selectedTimeRange === value
			return {
				backgroundColor: isActive ? '#e8f4ff' : '#fff',
				color: isActive ? '#2979ff' : '#606266',
				borderColor: isActive ? '#2979ff' : '#dcdfe6',
				marginRight: '16rpx',
				marginBottom: '16rpx',
				fontWeight: isActive ? 'bold' : 'normal'
			}
		},
		handleTimeTagClick(days) {
			if (this.isFiltering) return;
			this.isFiltering = true;

			this.loading = true;

			setTimeout(() => {
				if (this.selectedTimeRange === days) {
					// 再次点击已选中的标签则取消筛选
					this.selectedTimeRange = null;
					this.pendingList = [...this.originalList];

					// 如果有状态筛选，则应用状态筛选
					if (this.current1 !== 0) {
						// 直接调用状态筛选逻辑，不再调用change1避免重复loading
						this.pendingList = this.originalList.filter(item => {
							if (this.current1 === 1) {
								return item.status === '待审批';
							} else if (this.current1 === 2) {
								return item.status === '已通过';
							} else if (this.current1 === 3) {
								return item.status === '未通过';
							}
							return true;
						});
					}

					this.loading = false;
					this.isFiltering = false;
					return;
				}

				this.selectedTimeRange = days;

				if (days === null) {
					// 点击"全部时间"，仅应用状态筛选
					if (this.current1 !== 0) {
						// 直接应用状态筛选逻辑
						this.pendingList = this.originalList.filter(item => {
							if (this.current1 === 1) {
								return item.status === '待审批';
							} else if (this.current1 === 2) {
								return item.status === '已通过';
							} else if (this.current1 === 3) {
								return item.status === '未通过';
							}
							return true;
						});
					} else {
						this.pendingList = [...this.originalList];
					}

					this.loading = false;
					this.isFiltering = false;
					return;
				}

				// 计算时间范围
				const end = new Date();
				const start = new Date();
				start.setDate(start.getDate() - days);

				// 根据当前选中的状态标签和时间范围筛选数据
				this.pendingList = this.originalList.filter(item => {
					const itemTime = new Date(item.appointmentTime).getTime();
					const inTimeRange = itemTime >= start.getTime() && itemTime <= end.getTime();

					// 结合状态筛选
					if (this.current1 === 0) {
						return inTimeRange;
					} else if (this.current1 === 1) {
						return inTimeRange && item.status === '待审批';
					} else if (this.current1 === 2) {
						return inTimeRange && item.status === '已通过';
					} else if (this.current1 === 3) {
						return inTimeRange && item.status === '未通过';
					}
					return inTimeRange;
				});

				this.loading = false;
				this.isFiltering = false;
			}, 50);
		},
		formatAppointmentTime(timeStr) {
			const date = new Date(timeStr);
			const today = new Date();

			if (this.isToday(timeStr)) {
				// 今日预约添加醒目的前缀和具体时间
				const hours = date.getHours().toString().padStart(2, '0');
				const minutes = date.getMinutes().toString().padStart(2, '0');
				return `今日 ${hours}:${minutes}`;
			} else if (this.isYesterday(timeStr)) {
				// 昨日预约
				const hours = date.getHours().toString().padStart(2, '0');
				const minutes = date.getMinutes().toString().padStart(2, '0');
				return `昨日 ${hours}:${minutes}`;
			}

			const diffDays = Math.floor((date - today) / (24 * 60 * 60 * 1000));

			let prefix = '';
			if (diffDays === 1) {
				prefix = '明天 ';
			} else if (diffDays > 1 && diffDays < 7) {
				prefix = `${diffDays}天后 `;
			}

			return prefix + dayjs(timeStr).format('MM-DD HH:mm');
		},
		isToday(dateString) {
			const today = new Date();
			const appointmentDate = new Date(dateString);
			return today.getFullYear() === appointmentDate.getFullYear() &&
				today.getMonth() === appointmentDate.getMonth() &&
				today.getDate() === appointmentDate.getDate();
		},
		isYesterday(dateString) {
			const today = new Date();
			const yesterday = new Date(today);
			yesterday.setDate(yesterday.getDate() - 1);

			const appointmentDate = new Date(dateString);
			return yesterday.getFullYear() === appointmentDate.getFullYear() &&
				yesterday.getMonth() === appointmentDate.getMonth() &&
				yesterday.getDate() === appointmentDate.getDate();
		},
		// 检查日期是否在指定天数范围内（不含今天和昨天）
		isWithinDays(dateString, days) {
			const date = new Date(dateString);
			const today = new Date();
			const diffTime = date.getTime() - today.getTime();
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

			// 确保不包括今天和昨天，且在指定天数范围内
			return diffDays > 1 && diffDays <= days;
		},
		// 更新统计数据
		updateStatistics() {
			// 根据当前显示的列表或原始列表计算统计数据
			const list = this.isFiltering ? this.validPendingList : this.originalList.filter(item => item && typeof item === 'object' && item.id);

			this.statistics.total = list.length;
			this.statistics.pending = list.filter(item => item.status === '待审批').length;
			this.statistics.approved = list.filter(item => item.status === '已通过').length;
			this.statistics.rejected = list.filter(item => item.status === '未通过').length;
			this.statistics.entered = list.filter(item => item.vehicleStatus === '已进场').length;
			this.statistics.exited = list.filter(item => item.vehicleStatus === '已离场').length;

			// 计算紧急待审数量（今日预约的待审批）
			this.statistics.urgent = list.filter(item =>
				item.status === '待审批' && item.appointmentTime && this.isToday(item.appointmentTime)
			).length;
		},
		// 按申请状态快速筛选
		quickFilterByStatus(status) {
			this.loading = true;

			setTimeout(() => {
				if (status === '全部') {
					this.pendingList = [...this.originalList];
					this.current1 = 0; // 更新选中的标签
				} else {
					this.pendingList = this.originalList.filter(item => item.status === status);

					// 更新对应的标签索引
					const statusMap = {
						'待审批': 1,
						'已通过': 2,
						'未通过': 3
					};
					this.current1 = statusMap[status] || 0;
				}

				this.updateStatistics();
				this.loading = false;
			}, 50);
		},
		// 按车辆状态快速筛选
		quickFilterByVehicleStatus(vehicleStatus) {
			this.loading = true;

			setTimeout(() => {
				this.pendingList = this.originalList.filter(item => item.vehicleStatus === vehicleStatus);
				// 已通过状态下才有车辆状态
				this.current1 = 2; // 设置为已通过标签

				this.updateStatistics();
				this.loading = false;
			}, 50);
		},

		// 判断是否是新能源车牌
		isNewEnergyPlate(plateNumber) {
			return plateNumber && plateNumber.length === 8;
		},

		// 获取时间摘要
		getTimeSummary(item) {
			if (item.entryTime && item.exitTime) {
				return '已完成';
			} else if (item.entryTime) {
				return '已进场';
			} else {
				return '待进场';
			}
		},

		// 格式化紧凑时间显示
		formatCompactTime(timeStr) {
			const date = new Date(timeStr);
			const now = new Date();
			const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			const timeDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

			const hours = date.getHours().toString().padStart(2, '0');
			const minutes = date.getMinutes().toString().padStart(2, '0');
			const timeDisplay = `${hours}:${minutes}`;

			if (timeDate.getTime() === today.getTime()) {
				return timeDisplay;
			} else {
				const month = (date.getMonth() + 1).toString().padStart(2, '0');
				const day = date.getDate().toString().padStart(2, '0');
				return `${month}-${day} ${timeDisplay}`;
			}
		},

		// 刷新列表
		refreshList() {
			this.loading = true;

			// 模拟刷新数据
			setTimeout(() => {
				// 重新更新时间数据
				this.updateTimes();

				// 重置到全部状态
				this.current1 = 0;
				this.selectedTimeRange = null;
				this.pendingList = [...this.originalList];

				// 更新统计数据
				this.updateStatistics();

				this.loading = false;

				// 显示刷新成功提示
				uni.showToast({
					title: '刷新成功',
					icon: 'success',
					duration: 1500
				});
			}, 800);
		},



		// 显示效率详情
		showEfficiencyDetail() {
			const message = `今日处理效率：${this.processingRate}%\n较昨日提升：${this.trendData.efficiency}%\n建议：继续保持高效处理节奏`;
			uni.showModal({
				title: '📊 效率分析',
				content: message,
				showCancel: false,
				confirmText: '知道了'
			});
		},

		// 今日专项筛选
		handleTodayFilter() {
			this.loading = true;

			setTimeout(() => {
				// 筛选今日的数据
				this.pendingList = this.originalList.filter(item => {
					return this.isToday(item.appointmentTime);
				});

				// 更新标签状态
				this.current1 = 0;
				this.selectedTimeRange = null;

				this.loading = false;

				uni.showToast({
					title: `找到${this.pendingList.length}条今日记录`,
					icon: 'success',
					duration: 1500
				});
			}, 300);
		},

		// 手势识别 - 触摸开始
		handleTouchStart(e) {
			this.touchStartX = e.touches[0].clientX;
			this.touchStartY = e.touches[0].clientY;
			this.touchStartTime = Date.now();
			this.isSwiping = false;
		},

		// 手势识别 - 触摸移动
		handleTouchMove(e) {
			if (this.showQuickFilter) return; // 面板已打开时不处理手势

			const currentX = e.touches[0].clientX;
			const currentY = e.touches[0].clientY;
			const deltaX = currentX - this.touchStartX;
			const deltaY = currentY - this.touchStartY;

			// 判断是否为右滑手势（从左边缘开始）
			if (this.touchStartX < 50 && deltaX > 80 && Math.abs(deltaY) < 100) {
				this.isSwiping = true;

				// 如果滑动距离足够，预览式打开面板
				if (deltaX > 120) {
					this.showQuickFilter = true;
					uni.vibrateShort(); // 震动反馈
				}
			}
		},

		// 手势识别 - 触摸结束
		handleTouchEnd(e) {
			if (this.isSwiping) {
				const deltaX = e.changedTouches[0].clientX - this.touchStartX;
				const deltaTime = Date.now() - this.touchStartTime;

				// 快速右滑或者滑动距离足够远时打开面板
				if ((deltaX > 150) || (deltaX > 80 && deltaTime < 300)) {
					this.openQuickFilter();
				}
			}

			this.isSwiping = false;
		},

		// 打开快速筛选面板
		openQuickFilter() {
			this.showQuickFilter = true;
			uni.vibrateShort(); // 震动反馈
		},

		// 关闭快速筛选面板
		closeQuickFilter() {
			this.showQuickFilter = false;
		},

		// 设置快速时间范围
		setQuickTimeRange(days) {
			this.quickTimeRange = days;
		},

		// 方案三：抽屉式筛选方法
		
		// 获取当前筛选描述
		getCurrentFilterDescription() {
			let description = [];
			
			// 状态筛选描述
			const activeStatus = this.statusFilterOptions.filter(item => item.checked);
			if (activeStatus.length > 0) {
				description.push(activeStatus.map(item => item.label).join('、'));
			}
			
			// 时间筛选描述
			if (this.selectedTimeFilter !== null) {
				const timeOption = this.timeFilterOptions.find(item => item.value === this.selectedTimeFilter);
				if (timeOption) {
					description.push(timeOption.label);
				}
			}
			
			// 预设筛选描述
			if (this.currentPreset) {
				const preset = this.presetSchemes.find(item => item.key === this.currentPreset);
				if (preset) {
					description.push(preset.name);
				}
			}
			
			return description.join(' × ') + ` = ${this.validPendingList.length}条记录`;
		},
		
		// 切换高级筛选面板
		toggleAdvancedFilter() {
			this.showAdvancedFilter = !this.showAdvancedFilter;
		},
		
		// 应用预设筛选
		applyPresetFilter(presetKey) {
			this.loading = true;
			this.currentPreset = this.currentPreset === presetKey ? null : presetKey;
			
			setTimeout(() => {
				this.executePresetFilter(presetKey);
				this.loading = false;
			}, 100);
		},
		
		// 执行预设筛选逻辑
		executePresetFilter(presetKey) {
			let filteredList = [...this.originalList];
			
			switch(presetKey) {
				case 'todayPending':
					filteredList = filteredList.filter(item => {
						return item.status === '待审批' && this.isToday(item.appointmentTime);
					});
					break;
				case 'weekApproved':
					const weekAgo = new Date();
					weekAgo.setDate(weekAgo.getDate() - 7);
					filteredList = filteredList.filter(item => {
						const itemDate = new Date(item.appointmentTime);
						return item.status === '已通过' && itemDate >= weekAgo;
					});
					break;
				case 'allRecords':
					// 显示全部记录，不做筛选
					break;
				default:
					this.currentPreset = null;
					break;
			}
			
			this.pendingList = filteredList;
			this.updateStatistics();
		},
		
		// 切换状态筛选（多选）
		toggleAdvancedStatusFilter(statusValue) {
			const statusOption = this.statusFilterOptions.find(item => item.value === statusValue);
			if (statusOption) {
				statusOption.checked = !statusOption.checked;
			}
		},
		
		// 选择时间筛选（单选）
		selectTimeFilter(timeValue) {
			this.selectedTimeFilter = this.selectedTimeFilter === timeValue ? null : timeValue;
		},
		
		// 应用预设方案
		applyPresetScheme(scheme) {
			this.loading = true;
			
			// 重置其他筛选条件
			this.currentPreset = null;
			this.statusFilterOptions.forEach(item => item.checked = false);
			this.selectedTimeFilter = null;
			
			// 应用方案的状态筛选
			scheme.status.forEach(status => {
				const statusOption = this.statusFilterOptions.find(item => item.value === status);
				if (statusOption) {
					statusOption.checked = true;
				}
			});
			
			// 应用方案的时间筛选
			this.selectedTimeFilter = scheme.timeRange;
			
			setTimeout(() => {
				this.applyAdvancedFilter();
				this.loading = false;
			}, 100);
		},
		
		// 应用高级筛选
		applyAdvancedFilter() {
			this.loading = true;
			
			setTimeout(() => {
				let filteredList = [...this.originalList];
				
				// 应用状态筛选
				const selectedStatuses = this.statusFilterOptions
					.filter(item => item.checked)
					.map(item => item.value);
				
				if (selectedStatuses.length > 0) {
					filteredList = filteredList.filter(item => selectedStatuses.includes(item.status));
				}
				
				// 应用时间筛选
				if (this.selectedTimeFilter !== null) {
					const now = new Date();
					
					if (this.selectedTimeFilter === 0) {
						// 今日
						filteredList = filteredList.filter(item => this.isToday(item.appointmentTime));
					} else {
						// 指定天数内
						const startDate = new Date();
						startDate.setDate(startDate.getDate() - this.selectedTimeFilter);
						filteredList = filteredList.filter(item => {
							const itemDate = new Date(item.appointmentTime);
							return itemDate >= startDate && itemDate <= now;
						});
					}
				}
				
				this.pendingList = filteredList;
				this.updateStatistics();
				this.loading = false;
				
				// 关闭高级筛选面板
				this.showAdvancedFilter = false;
				
				uni.showToast({
					title: `筛选完成，共${this.pendingList.length}条记录`,
					icon: 'success',
					duration: 1500
				});
			}, 100);
		},
		
		// 重置高级筛选
		resetAdvancedFilter() {
			// 重置所有筛选条件
			this.statusFilterOptions.forEach(item => item.checked = false);
			this.selectedTimeFilter = null;
			this.currentPreset = null;
		},
		
		// 清除所有筛选
		clearAllFilters() {
			this.loading = true;
			
			// 重置所有筛选状态
			this.resetAdvancedFilter();
			
			setTimeout(() => {
				this.pendingList = [...this.originalList];
				this.updateStatistics();
				this.loading = false;
				
				uni.showToast({
					title: '已清除所有筛选',
					icon: 'success',
					duration: 1000
				});
			}, 100);
		},
		
		// 获取各种计数方法
		getTodayPendingCount() {
			return this.originalList.filter(item => 
				item.status === '待审批' && this.isToday(item.appointmentTime)
			).length;
		},
		
		getWeekApprovedCount() {
			const weekAgo = new Date();
			weekAgo.setDate(weekAgo.getDate() - 7);
			return this.originalList.filter(item => {
				const itemDate = new Date(item.appointmentTime);
				return item.status === '已通过' && itemDate >= weekAgo;
			}).length;
		},
		
		getAllRecordsCount() {
			return this.originalList.length;
		},
		
		getStatusCount(statusValue) {
			return this.originalList.filter(item => item.status === statusValue).length;
		},
		
		getTimeCount(timeValue) {
			if (timeValue === null) return this.originalList.length;
			
			const now = new Date();
			const startDate = new Date();
			startDate.setDate(startDate.getDate() - timeValue);
			
			return this.originalList.filter(item => {
				const itemDate = new Date(item.appointmentTime);
				return itemDate >= startDate && itemDate <= now;
			}).length;
		},
		
		getSchemeCount(scheme) {
			let count = this.originalList;
			
			// 按状态筛选
			if (scheme.status && scheme.status.length > 0) {
				count = count.filter(item => scheme.status.includes(item.status));
			}
			
			// 按时间筛选
			if (scheme.timeRange !== null) {
				if (scheme.timeRange === 0) {
					// 今日
					count = count.filter(item => this.isToday(item.appointmentTime));
				} else {
					// 指定天数内
					const startDate = new Date();
					startDate.setDate(startDate.getDate() - scheme.timeRange);
					count = count.filter(item => {
						const itemDate = new Date(item.appointmentTime);
						return itemDate >= startDate;
					});
				}
			}
			
			return count.length;
		},
		
		// 切换状态筛选
		toggleStatusFilter(status) {
			const index = this.quickStatusFilter.indexOf(status);
			if (index > -1) {
				this.quickStatusFilter.splice(index, 1);
			} else {
				this.quickStatusFilter.push(status);
			}
		},

		// 切换车辆状态筛选
		toggleVehicleFilter(vehicleStatus) {
			const index = this.quickVehicleFilter.indexOf(vehicleStatus);
			if (index > -1) {
				this.quickVehicleFilter.splice(index, 1);
			} else {
				this.quickVehicleFilter.push(vehicleStatus);
			}
		},

		// 重置快速筛选
		resetQuickFilter() {
			this.quickTimeRange = null;
			this.quickStatusFilter = [];
			this.quickVehicleFilter = [];

			uni.showToast({
				title: '筛选条件已重置',
				icon: 'none',
				duration: 1000
			});
		},

		// 应用快速筛选
		applyQuickFilter() {
			this.loading = true;

			setTimeout(() => {
				let filteredList = [...this.originalList];

				// 应用时间范围筛选
				if (this.quickTimeRange !== null) {
					const end = new Date();
					const start = new Date();

					if (this.quickTimeRange === 1) {
						// 今日
						start.setHours(0, 0, 0, 0);
						end.setHours(23, 59, 59, 999);
					} else {
						// 近N天
						start.setDate(start.getDate() - this.quickTimeRange);
					}

					filteredList = filteredList.filter(item => {
						const itemTime = new Date(item.appointmentTime);
						return itemTime >= start && itemTime <= end;
					});
				}

				// 应用状态筛选
				if (this.quickStatusFilter.length > 0) {
					filteredList = filteredList.filter(item => {
						return this.quickStatusFilter.includes(item.status);
					});
				}

				// 应用车辆状态筛选
				if (this.quickVehicleFilter.length > 0) {
					filteredList = filteredList.filter(item => {
						return this.quickVehicleFilter.includes(item.vehicleStatus || '未进场');
					});
				}

				this.pendingList = filteredList;
				this.isFiltering = true;

				// 关闭面板
				this.closeQuickFilter();

				// 重置其他筛选状态
				this.current1 = 0;
				this.selectedTimeRange = null;

				this.loading = false;

				const filterCount = this.quickStatusFilter.length + this.quickVehicleFilter.length + (this.quickTimeRange !== null ? 1 : 0);

				uni.showToast({
					title: `应用${filterCount}个筛选条件，找到${this.pendingList.length}条记录`,
					icon: 'success',
					duration: 2000
				});
			}, 300);
		},

		// 获取未进场数量
		getUnenteredCount() {
			return this.originalList.filter(item => !item.vehicleStatus || item.vehicleStatus === '未进场').length;
		},

		// ==================== 智能搜索相关方法 ====================

		// 搜索框聚焦事件
		handleSearchFocus() {
			this.searchFocused = true;
			this.showSearchHistory = false;
			if (this.searchKeyword.length > 0) {
				this.generateSearchSuggestions();
			}
		},

		// 搜索框失焦事件
		handleSearchBlur() {
			// 延迟隐藏，确保点击建议项能正常触发
			setTimeout(() => {
				this.searchFocused = false;
				this.showSuggestions = false;
			}, 200);
		},

		// 搜索输入事件
		handleSearchInput(e) {
			const value = e.detail.value || e.target.value;
			this.searchKeyword = value;

			// 清除之前的搜索定时器
			if (this.searchTimeout) {
				clearTimeout(this.searchTimeout);
			}

			if (value.length > 0) {
				// 延迟搜索，避免频繁触发
				this.searchTimeout = setTimeout(() => {
					this.generateSearchSuggestions();
					this.showSuggestions = true;
				}, 300);
			} else {
				this.showSuggestions = false;
				this.searchSuggestions = [];
			}
		},

		// 生成搜索建议
		generateSearchSuggestions() {
			if (!this.searchKeyword || this.searchKeyword.length === 0) {
				this.searchSuggestions = [];
				return;
			}

			const keyword = this.searchKeyword.toLowerCase();
			const suggestions = [];

			// 搜索车牌号 - 显示具体车牌号
			const plateMatches = new Set();
			this.originalList.forEach(item => {
				if (item.plateNumber && item.plateNumber.toLowerCase().includes(keyword)) {
					if (!plateMatches.has(item.plateNumber)) {
						plateMatches.add(item.plateNumber);
						suggestions.push({
							text: item.plateNumber,
							type: 'plate',
							data: item
						});
					}
				}
			});

			// 搜索手机号 - 显示具体手机号
			const phoneMatches = new Set();
			this.originalList.forEach(item => {
				if (item.phone && item.phone.includes(keyword)) {
					if (!phoneMatches.has(item.phone)) {
						phoneMatches.add(item.phone);
						suggestions.push({
							text: item.phone,
							type: 'phone',
							data: item
						});
					}
				}
			});

			// 搜索姓名 - 显示具体姓名
			const nameMatches = new Set();
			this.originalList.forEach(item => {
				if (item.name && item.name.toLowerCase().includes(keyword)) {
					if (!nameMatches.has(item.name)) {
						nameMatches.add(item.name);
						suggestions.push({
							text: item.name,
							type: 'name',
							data: item
						});
					}
				}
			});

			// 限制数量并排序（车牌号优先）
			const sortedSuggestions = suggestions.sort((a, b) => {
				const typeOrder = { 'plate': 1, 'name': 2, 'phone': 3 };
				return typeOrder[a.type] - typeOrder[b.type];
			}).slice(0, 8);

			this.searchSuggestions = sortedSuggestions;
		},

		// 选择搜索建议
		selectSuggestion(suggestion) {
			this.searchKeyword = suggestion.text;
			this.showSuggestions = false;
			this.searchFocused = false;

			// 添加到搜索历史
			this.addToSearchHistory(suggestion.text, suggestion.type);

			// 执行搜索
			this.performSearch();
		},

		// 执行搜索
		performSearch() {
			if (!this.searchKeyword || this.searchKeyword.trim().length === 0) {
				// 如果搜索关键词为空，恢复原始列表
				this.pendingList = [...this.originalList];
				this.updateStatistics();
				return;
			}

			const keyword = this.searchKeyword.toLowerCase().trim();

			// 搜索匹配项
			const filteredList = this.originalList.filter(item => {
				return (
					(item.plateNumber && item.plateNumber.toLowerCase().includes(keyword)) ||
					(item.phone && item.phone.includes(keyword)) ||
					(item.name && item.name.toLowerCase().includes(keyword)) ||
					(item.addressDetail && item.addressDetail.toLowerCase().includes(keyword))
				);
			});

			this.pendingList = filteredList;
			this.updateStatistics();

			// 添加到搜索历史
			this.addToSearchHistory(this.searchKeyword, this.detectSearchType(this.searchKeyword));

			// 隐藏建议
			this.showSuggestions = false;
			this.searchFocused = false;

			// 显示搜索结果提示
			uni.showToast({
				title: `找到${filteredList.length}条记录`,
				icon: 'success',
				duration: 1500
			});
		},

		// 清除搜索
		clearSearch() {
			this.searchKeyword = '';
			this.showSuggestions = false;
			this.searchSuggestions = [];
			this.pendingList = [...this.originalList];
			this.updateStatistics();
		},



		// 切换搜索历史面板
		toggleSearchHistory() {
			this.showSearchHistory = !this.showSearchHistory;
			if (this.showSearchHistory) {
				this.searchFocused = false;
				this.showSuggestions = false;
			}
		},

		// 使用历史搜索
		useHistorySearch(historyItem) {
			this.searchKeyword = historyItem.keyword;
			this.showSearchHistory = false;
			this.performSearch();
		},

		// 使用热门搜索
		useHotSearch(tag) {
			this.searchKeyword = tag.text;
			this.performSearch();
		},

		// 添加到搜索历史
		addToSearchHistory(keyword, type) {
			if (!keyword || keyword.trim().length === 0) return;

			// 检查是否已存在
			const existingIndex = this.searchHistory.findIndex(item => item.keyword === keyword);
			if (existingIndex > -1) {
				// 如果已存在，移到最前面并更新时间
				const existingItem = this.searchHistory.splice(existingIndex, 1)[0];
				existingItem.time = Date.now();
				this.searchHistory.unshift(existingItem);
			} else {
				// 添加新的搜索记录
				this.searchHistory.unshift({
					keyword: keyword,
					type: type,
					time: Date.now()
				});
			}

			// 限制历史记录数量
			if (this.searchHistory.length > 20) {
				this.searchHistory = this.searchHistory.slice(0, 20);
			}

			// 保存到本地存储
			this.saveSearchHistory();
		},

		// 移除搜索历史项
		removeSearchHistory(index) {
			this.searchHistory.splice(index, 1);
			this.saveSearchHistory();
		},

		// 清空搜索历史
		clearSearchHistory() {
			uni.showModal({
				title: '确认清空',
				content: '确定要清空所有搜索历史吗？',
				success: (res) => {
					if (res.confirm) {
						this.searchHistory = [];
						this.saveSearchHistory();
						uni.showToast({
							title: '已清空搜索历史',
							icon: 'success',
							duration: 1500
						});
					}
				}
			});
		},

		// 保存搜索历史到本地
		saveSearchHistory() {
			try {
				uni.setStorageSync('search_history_approve', JSON.stringify(this.searchHistory));
			} catch (e) {
				console.warn('保存搜索历史失败:', e);
			}
		},

		// 加载搜索历史
		loadSearchHistory() {
			try {
				const saved = uni.getStorageSync('search_history_approve');
				if (saved) {
					this.searchHistory = JSON.parse(saved);
				}
			} catch (e) {
				console.warn('加载搜索历史失败:', e);
				this.searchHistory = [];
			}
		},

		// 检测搜索类型
		detectSearchType(keyword) {
			if (/^[\u4e00-\u9fa5][A-Z0-9]{5,7}$/.test(keyword)) {
				return 'plate'; // 车牌号格式
			} else if (/^1[3-9]\d{9}$/.test(keyword)) {
				return 'phone'; // 手机号格式
			} else if (/^[\u4e00-\u9fa5]{2,4}$/.test(keyword)) {
				return 'name'; // 中文姓名格式
			}
			return 'keyword'; // 其他关键词
		},

		// 高亮匹配文本
		highlightMatch(text, keyword) {
			if (!keyword || !text) return text;
			const regex = new RegExp(`(${keyword})`, 'gi');
			return text.replace(regex, '<span style="color: #409eff; font-weight: bold;">$1</span>');
		},

		// 获取建议图标颜色
		getSuggestionIconColor(type) {
			const colorMap = {
				'plate': '#2979ff',
				'phone': '#52c41a',
				'name': '#fa8c16'
			};
			return colorMap[type] || '#666';
		},

		// 获取建议类型文本
		getSuggestionTypeText(type) {
			const textMap = {
				'plate': '车牌号',
				'phone': '手机号',
				'name': '姓名'
			};
			return textMap[type] || '关键词';
		},

		// 获取历史图标
		getHistoryIcon(type) {
			const iconMap = {
				'plate': 'car',
				'phone': 'phone',
				'name': 'account',
				'keyword': 'search'
			};
			return iconMap[type] || 'search';
		},

		// 获取历史图标颜色
		getHistoryIconColor(type) {
			const colorMap = {
				'plate': '#2979ff',
				'phone': '#52c41a',
				'name': '#fa8c16',
				'keyword': '#666'
			};
			return colorMap[type] || '#666';
		},

		// 格式化历史时间
		formatHistoryTime(timestamp) {
			const now = Date.now();
			const diff = now - timestamp;
			const minutes = Math.floor(diff / (1000 * 60));
			const hours = Math.floor(diff / (1000 * 60 * 60));
			const days = Math.floor(diff / (1000 * 60 * 60 * 24));

			if (minutes < 1) {
				return '刚刚';
			} else if (minutes < 60) {
				return `${minutes}分钟前`;
			} else if (hours < 24) {
				return `${hours}小时前`;
			} else {
				return `${days}天前`;
			}
		},

		// ==================== 手势操作相关方法 ====================

		// 获取滑动按钮配置 - 参考facility.vue
		getSwipeOptions(item) {
			const options = [];
			
			// 根据状态显示不同按钮
			if (item.status === '待审批') {
				options.push({
					text: '通过',
					style: {
						backgroundColor: '#19be6b',
						width: '120rpx',
						height: '100%',
						fontSize: '28rpx',
						fontWeight: 'bold'
					},
					type: 'approve'
				});
				options.push({
					text: '拒绝',
					style: {
						backgroundColor: '#f5222d',
						width: '120rpx',
						height: '100%',
						fontSize: '28rpx',
						fontWeight: 'bold',
						borderLeft: '2rpx solid #fff'
					},
					type: 'reject'
				});
			}
			
			// 联系按钮 - 始终显示
			options.push({
				text: '联系',
				style: {
					backgroundColor: '#fa8c16',
					width: '120rpx',
					height: '100%',
					fontSize: '28rpx',
					fontWeight: 'bold',
					borderLeft: '2rpx solid #fff'
				},
				type: 'contact'
			});
			
			// 详情按钮 - 始终显示
			options.push({
				text: '详情',
				style: {
					backgroundColor: '#409eff',
					width: '120rpx',
					height: '100%',
					fontSize: '28rpx',
					fontWeight: 'bold',
					borderLeft: '2rpx solid #fff'
				},
				type: 'detail'
			});
			
			return options;
		},



		// 统一的滑动操作处理
		async handleSwipeAction(e) {
			console.log("=== 滑动操作事件详情 ===");
			console.log("原始事件对象:", e);
			
			// 根据uview源码分析：
			// e.index 是按钮索引（从buttonClickHandler传递）
			// e.name 是组件的name属性（我们设置为行索引）
			let rowIndex = parseInt(e.name); // 行索引（从name属性获取）
			let buttonIndex = e.index; // 按钮索引（从事件对象获取）

			console.log("📋 行索引:", rowIndex, "🔘 按钮索引:", buttonIndex);
			
			// 验证索引的有效性
			if (isNaN(rowIndex) || rowIndex < 0 || rowIndex >= this.validPendingList.length) {
				console.error('无效的行索引:', rowIndex, '有效范围: 0-' + (this.validPendingList.length - 1));
				return;
			}
			
			if (buttonIndex === undefined || buttonIndex === null) {
				console.log("⚠️ 按钮索引未定义，可能点击的是卡片主体");
				console.log("点击卡片主体，显示详情");
				if (this.isMultiSelectMode) {
					const item = this.validPendingList[rowIndex];
					if (item) {
						this.toggleItemSelection(item);
					}
				} else {
					const item = this.validPendingList[rowIndex];
					if (item) {
						this.showDetailModal(item);
					}
				}
				return;
			}

			// 获取对应的数据项
			const item = this.validPendingList[rowIndex];
			if (!item) {
				console.error('获取列表项失败:', rowIndex);
				return;
			}

			console.log("📝 当前项目数据:", item.plateNumber, item.status);

			// 如果没有按钮索引，说明点击的是卡片主体
			if (buttonIndex === undefined || buttonIndex === null) {
				console.log("点击卡片主体，显示详情");
				if (this.isMultiSelectMode) {
					this.toggleItemSelection(item);
				} else {
					this.showDetailModal(item);
				}
				return;
			}

			// 获取当前项的按钮配置来确定操作
			const options = this.getSwipeOptions(item);
			console.log("按钮配置:", options.map(opt => opt.type), "点击按钮索引:", buttonIndex);

			// 根据按钮索引和配置确定操作类型
			if (buttonIndex >= options.length) {
				console.error('按钮索引超出范围:', buttonIndex, '最大索引:', options.length - 1);
				return;
			}

			const selectedOption = options[buttonIndex];
			const actionType = selectedOption.type;
			const actionName = selectedOption.text;

			console.log("🎯 执行操作:", actionType, actionName, "对应数据:", item.plateNumber);

			try {
				// 关闭滑动面板
				if (this.$refs.uSwipeAction?.closeOther) {
					this.$refs.uSwipeAction.closeOther(rowIndex);
				}

				// 根据操作类型执行对应操作
				switch (actionType) {
					case 'approve':
						const approveResult = await uni.showModal({
							title: '审核通过确认',
							content: `确定通过车牌号为【${item.plateNumber}】的申请吗？\n申请人：${item.name}\n住址：${item.addressDetail}`,
							confirmText: '确认通过',
							confirmColor: '#19be6b',
							cancelColor: '#909399'
						});

						if (approveResult.confirm) {
							uni.showLoading({
								title: '审核通过中...',
								mask: true
							});

							// 模拟API请求
							await new Promise(resolve => setTimeout(resolve, 1000));

							// 更新状态
							item.status = '已通过';
							this.updateStatistics();

							uni.hideLoading();
							uni.showToast({
								title: '审核通过成功',
								icon: 'success',
								duration: 2000
							});
						}
						break;

					case 'reject':
						const rejectResult = await uni.showModal({
							title: '驳回申请确认',
							content: `确定要驳回车牌号为【${item.plateNumber}】的申请吗？\n申请人：${item.name}\n住址：${item.addressDetail}`,
							confirmText: '确认拒绝',
							confirmColor: '#f5222d',
							cancelColor: '#909399'
						});

						if (rejectResult.confirm) {
							uni.showLoading({
								title: '申请拒绝中...',
								mask: true
							});

							// 模拟API请求
							await new Promise(resolve => setTimeout(resolve, 1000));

							// 更新状态
							item.status = '未通过';
							this.updateStatistics();

							uni.hideLoading();
							uni.showToast({
								title: '申请已拒绝',
								icon: 'error',
								duration: 2000
							});
						}
						break;

					case 'contact':
						console.log("📞 拨打电话:", item.phone);
						if (!item.phone) {
							uni.showToast({
								title: '该记录无联系电话',
								icon: 'none',
								duration: 2000
							});
							return;
						}
						
						uni.makePhoneCall({
							phoneNumber: item.phone,
							success: () => {
								console.log("📞 通话发起成功");
								uni.showToast({
									title: '已发起通话',
									icon: 'success',
									duration: 1500
								});
							},
							fail: (error) => {
								console.error('拨号失败:', error);
								uni.showToast({
									title: '拨号失败，请检查权限',
									icon: 'none',
									duration: 2000
								});
							}
						});
						break;

					case 'detail':
						console.log("📋 显示详情:", item.plateNumber);
						this.showDetailModal(item);
						break;

					default:
						console.warn('❌ 未知的操作类型:', actionType, '按钮索引:', buttonIndex);
						// 默认显示详情
						this.showDetailModal(item);
						break;
				}

			} catch (error) {
				console.error('处理操作时出错:', error);
				uni.hideLoading();
				uni.showToast({
					title: `${actionName}失败，请重试`,
					icon: 'none',
					duration: 3000
				});
			}
		},

		// 处理长按事件
		handleLongPress(index) {
			const item = this.validPendingList[index];
			if (!item) {
				console.error('无效的列表项索引:', index);
				return;
			}
			
			if (!this.isMultiSelectMode) {
				// 进入多选模式
				this.enterMultiSelectMode();
				this.toggleItemSelection(item);

				// 震动反馈
				uni.vibrateShort();

				uni.showToast({
					title: '已进入多选模式',
					icon: 'none',
					duration: 1500
				});
			}
		},



		// 确认通过
		confirmApprove(item, index) {
			return new Promise((resolve, reject) => {
				uni.showModal({
					title: '确认通过',
					content: `确定要通过 ${item.plateNumber} 的申请吗？`,
					confirmText: '确认通过',
					confirmColor: '#19be6b',
					cancelColor: '#909399',
					success: (res) => {
						if (res.confirm) {
							// 更新状态
							item.status = '已通过';
							this.updateStatistics();
							
							uni.showToast({
								title: '审核通过成功',
								icon: 'success',
								duration: 2000
							});
							resolve();
						} else {
							resolve(); // 用户取消也视为正常完成
						}
					},
					fail: (error) => {
						reject(error);
					}
				});
			});
		},

		// 确认拒绝
		confirmReject(item, index) {
			return new Promise((resolve, reject) => {
				uni.showModal({
					title: '确认拒绝',
					content: `确定要拒绝 ${item.plateNumber} 的申请吗？`,
					confirmText: '确认拒绝',
					confirmColor: '#f5222d',
					cancelColor: '#909399',
					success: (res) => {
						if (res.confirm) {
							// 更新状态
							item.status = '未通过';
							this.updateStatistics();
							
							uni.showToast({
								title: '申请已拒绝',
								icon: 'error',
								duration: 2000
							});
							resolve();
						} else {
							resolve(); // 用户取消也视为正常完成
						}
					},
					fail: (error) => {
						reject(error);
					}
				});
			});
		},

		// 显示详情弹窗
		showDetailModal(item) {
			this.currentDetailItem = item;
			this.showDetailPopup = true;
		},

		// 关闭详情弹窗
		closeDetailModal() {
			this.showDetailPopup = false;
			this.currentDetailItem = null;
		},
		
		// 获取状态图标
		getStatusIcon(status) {
			const iconMap = {
				'待审批': '⏳',
				'已通过': '✅',
				'未通过': '❌'
			};
			return iconMap[status] || '📋';
		},
		
		// 获取车辆状态图标
		getVehicleStatusIcon(status) {
			const iconMap = {
				'已进场': '🟢',
				'已离场': '🔴',
				'未进场': '⚪'
			};
			return iconMap[status] || '⚪';
		},
		

		
		// 分享记录
		shareRecord(item) {
			console.log('📤 分享记录:', item.plateNumber);
			
			const shareContent = this.generateShareContent(item);
			
			// 尝试使用系统分享功能
			uni.share({
				provider: 'system',
				type: 'text',
				summary: shareContent,
				success: (res) => {
					console.log('分享成功:', res);
					uni.showToast({
						title: '分享成功',
						icon: 'success',
						duration: 1500
					});
				},
				fail: (error) => {
					console.warn('系统分享失败，使用复制功能:', error);
					// 如果分享失败，则复制到剪贴板
					uni.setClipboardData({
						data: shareContent,
						success: () => {
							uni.showToast({
								title: '记录已复制到剪贴板',
								icon: 'success',
								duration: 2000
							});
						},
						fail: () => {
							uni.showToast({
								title: '分享失败，请重试',
								icon: 'none',
								duration: 2000
							});
						}
					});
				}
			});
		},
		
		// 生成分享内容
		generateShareContent(item) {
			let content = '🚗 车辆审批记录详情\n\n';
			content += `📋 车牌号码：${item.plateNumber}\n`;
			content += `👤 申请人：${item.name}\n`;
			content += `📱 联系电话：${item.phone}\n`;
			content += `⏰ 预约时间：${item.appointmentTime}\n`;
			content += `📍 详细地址：${item.addressDetail}\n`;
			content += `📊 审批状态：${item.status}\n`;
			
			if (item.description) {
				content += `💡 申请说明：${item.description}\n`;
			}
			
			if (item.vehicleStatus) {
				content += `🚗 车辆状态：${item.vehicleStatus}\n`;
			}
			
			if (item.entryTime) {
				content += `🟢 进场时间：${item.entryTime}\n`;
			}
			
			if (item.exitTime) {
				content += `🔴 离场时间：${item.exitTime}\n`;
			}
			
			content += `\n🆔 记录编号：${item.id}`;
			content += `\n📅 生成时间：${new Date().toLocaleString()}`;
			
			return content;
		},
		
		// 添加备注
		addNote(item) {
			console.log('📝 添加备注:', item.plateNumber);
			
			uni.showModal({
				title: '添加备注',
				content: '请输入备注信息',
				editable: true,
				placeholderText: '请输入备注内容...',
				success: (res) => {
					if (res.confirm && res.content) {
						const noteContent = res.content.trim();
						if (noteContent) {
							// 如果记录没有notes数组，则创建一个
							if (!item.notes) {
								item.notes = [];
							}
							
							// 添加新备注
							const newNote = {
								id: Date.now(),
								content: noteContent,
								operator: '管理员', // 可以从用户信息获取
								createTime: new Date().toISOString(),
								formatTime: new Date().toLocaleString()
							};
							
							item.notes.unshift(newNote);
							
							console.log('新增备注:', newNote);
							
							uni.showToast({
								title: '备注添加成功',
								icon: 'success',
								duration: 2000
							});
							
							// 这里可以调用API保存备注到后端
							// this.saveNoteToServer(item.id, newNote);
						} else {
							uni.showToast({
								title: '备注内容不能为空',
								icon: 'none',
								duration: 1500
							});
						}
					} else if (res.confirm && !res.content) {
						uni.showToast({
							title: '备注内容不能为空',
							icon: 'none',
							duration: 1500
						});
					}
				}
			});
		},

		// 生成详情内容
		generateDetailContent(item) {
			let content = '';
			
			// 基本信息
			content += `🔍 基本信息\n`;
			content += `🚗 车牌号码：${item.plateNumber}\n`;
			content += `👤 申请人员：${item.name}\n`;
			content += `📱 联系电话：${item.phone}\n`;
			content += `⏰ 预约时间：${item.appointmentTime}\n`;
			content += `📋 审批状态：${item.status}\n`;
			content += `🆔 记录编号：${item.id}\n\n`;
			
			// 地址信息
			content += `📍 详细地址\n`;
			content += `🏠 具体地址：${item.addressDetail}\n\n`;
			
			// 申请说明
			if (item.description) {
				content += `💼 申请说明\n`;
				content += `💡 申请描述：${item.description}\n\n`;
			}
			
			// 车辆状态信息
			if (item.vehicleStatus) {
				content += `🚗 车辆进出记录\n`;
				content += `📊 当前状态：${item.vehicleStatus}\n`;
				
				if (item.entryTime) {
					content += `🟢 进场时间：${item.entryTime}\n`;
				}
				
				if (item.exitTime) {
					content += `🔴 离场时间：${item.exitTime}\n`;
				}
				
				if (item.entryTime && item.exitTime) {
					const duration = this.calcDuration(item.entryTime, item.exitTime);
					content += `⏱️ 停留时长：${duration}\n`;
				}
			}
			
			return content;
		},

		// 拨打电话 (已废弃，保留以备后用)
		// makePhoneCall(item) {
		// 	uni.makePhoneCall({
		// 		phoneNumber: item.phone,
		// 		success: () => {
		// 			uni.showToast({
		// 				title: '已发起通话',
		// 				icon: 'success',
		// 				duration: 1500
		// 			});
		// 		},
		// 		fail: (error) => {
		// 			console.error('拨号失败:', error);
		// 			uni.showToast({
		// 				title: '拨号失败，请检查权限',
		// 				icon: 'none',
		// 				duration: 2000
		// 			});
		// 		}
		// 	});
		// },

		// 记录通话记录
		recordPhoneCall(item) {
			const callRecord = {
				itemId: item.id,
				plateNumber: item.plateNumber,
				name: item.name,
				phone: item.phone,
				callTime: new Date().toISOString(),
				operator: '管理员' // 可以从用户信息获取
			};

			console.log('通话记录:', callRecord);

			// 这里可以调用后端API保存通话记录
			// this.savePhoneCallRecord(callRecord);
		},

		// 进入多选模式
		enterMultiSelectMode() {
			this.isMultiSelectMode = true;
			this.selectedItems = [];
			this.swipingItemId = null; // 关闭滑动状态
		},

		// 退出多选模式
		exitMultiSelectMode() {
			this.isMultiSelectMode = false;
			this.selectedItems = [];
		},

		// 切换项目选择状态
		toggleItemSelection(item) {
			const index = this.selectedItems.indexOf(item.id);
			if (index > -1) {
				this.selectedItems.splice(index, 1);
			} else {
				this.selectedItems.push(item.id);
			}
		},

		// 切换全选状态
		toggleSelectAll() {
			if (this.selectedItems.length === this.validPendingList.length) {
				// 取消全选
				this.selectedItems = [];
			} else {
				// 全选
				this.selectedItems = this.validPendingList.map(item => item.id);
			}
		},

		// 批量通过
		batchApprove() {
			const approveItems = this.selectedItems.filter(id => {
				const item = this.validPendingList.find(item => item.id === id);
				return item && item.status === '待审批';
			});

			if (approveItems.length === 0) {
				uni.showToast({
					title: '没有可通过的申请',
					icon: 'none',
					duration: 1500
				});
				return;
			}

			uni.showModal({
				title: '批量通过',
				content: `确定要通过选中的 ${approveItems.length} 个申请吗？`,
				success: (res) => {
					if (res.confirm) {
						approveItems.forEach(id => {
							const item = this.validPendingList.find(item => item.id === id);
							if (item) {
								item.status = '已通过';
							}
						});

						this.updateStatistics();
						this.exitMultiSelectMode();

						uni.showToast({
							title: `已通过 ${approveItems.length} 个申请`,
							icon: 'success',
							duration: 2000
						});
					}
				}
			});
		},

		// 批量拒绝
		batchReject() {
			const rejectItems = this.selectedItems.filter(id => {
				const item = this.validPendingList.find(item => item.id === id);
				return item && item.status === '待审批';
			});

			if (rejectItems.length === 0) {
				uni.showToast({
					title: '没有可拒绝的申请',
					icon: 'none',
					duration: 1500
				});
				return;
			}

			uni.showModal({
				title: '批量拒绝',
				content: `确定要拒绝选中的 ${rejectItems.length} 个申请吗？`,
				success: (res) => {
					if (res.confirm) {
						rejectItems.forEach(id => {
							const item = this.validPendingList.find(item => item.id === id);
							if (item) {
								item.status = '未通过';
							}
						});

						this.updateStatistics();
						this.exitMultiSelectMode();

						uni.showToast({
							title: `已拒绝 ${rejectItems.length} 个申请`,
							icon: 'success',
							duration: 2000
						});
					}
				}
			});
		},

		// 批量导出
		batchExport() {
			if (this.selectedItems.length === 0) {
				uni.showToast({
					title: '请选择要导出的项目',
					icon: 'none',
					duration: 1500
				});
				return;
			}

			// 模拟导出功能
			uni.showLoading({
				title: '正在导出...'
			});

			setTimeout(() => {
				uni.hideLoading();
				uni.showToast({
					title: `已导出 ${this.selectedItems.length} 条记录`,
					icon: 'success',
					duration: 2000
				});
				this.exitMultiSelectMode();
			}, 2000);
		},



		// ==================== 数据可视化相关方法 ====================

		// 切换数据可视化面板
		toggleDataVisualization() {
			this.showDataVisualization = !this.showDataVisualization;
			if (this.vibrationEnabled) {
				uni.vibrateShort();
			}
		},

		// 切换可视化模式
		switchVisualMode(mode) {
			this.visualMode = mode;
			if (this.vibrationEnabled) {
				uni.vibrateShort();
			}
		},

		// 初始化可视化数据
		initializeVisualizationData() {
			// 简化的初始化，不需要复杂的数据生成
			console.log('📊 数据可视化初始化完成');
		},



		// ==================== 新图表相关方法 ====================

		// 计算审批状态柱状图宽度
		getBarWidth(value) {
			if (this.statistics.total === 0) return 0;
			return (value / this.statistics.total) * 100;
		},

		// 计算车辆状态柱状图宽度（水平）
		getVehicleBarWidth(value) {
			const maxCount = Math.max(this.statistics.entered, this.statistics.exited, this.getUnenteredCount()) || 1;
			return (value / maxCount) * 100;
		},

		// 饼状图角度计算
		getPendingAngle() {
			if (this.statistics.total === 0) return 0;
			return (this.statistics.pending / this.statistics.total) * 360;
		},

		getApprovedAngle() {
			if (this.statistics.total === 0) return 0;
			return (this.statistics.approved / this.statistics.total) * 360;
		},

		getRejectedAngle() {
			if (this.statistics.total === 0) return 0;
			return (this.statistics.rejected / this.statistics.total) * 360;
		},

		// 垂直柱状图高度计算
		getVehicleBarHeight(value) {
			const maxCount = this.getMaxVehicleCount() || 1;
			return Math.max((value / maxCount) * 100, 5); // 最小5%高度
		},

		getMaxVehicleCount() {
			return Math.max(this.statistics.entered, this.statistics.exited, this.getUnenteredCount(), 1);
		},

		// 折线图相关方法


		// 获取今日数据
		getTodayCount() {
			return this.todayCount;
		},

		// 获取昨日数据
		getYesterdayCount() {
			return this.yesterdayCount;
		},

		// 计算今日对比图宽度
		getTodayWidth() {
			const maxCount = Math.max(this.todayCount, this.yesterdayCount) || 1;
			return (this.todayCount / maxCount) * 100;
		},

		// 计算昨日对比图宽度
		getYesterdayWidth() {
			const maxCount = Math.max(this.todayCount, this.yesterdayCount) || 1;
			return (this.yesterdayCount / maxCount) * 100;
		},

		// 获取趋势文本
		getTrendText() {
			const diff = this.todayCount - this.yesterdayCount;
			if (diff > 0) {
				return `较昨日增加 ${diff} 个申请`;
			} else if (diff < 0) {
				return `较昨日减少 ${Math.abs(diff)} 个申请`;
			} else {
				return '与昨日持平';
			}
		},


	},
	watch: {
		pendingList: {
			handler() {
				this.updateStatistics();
			},
			deep: true
		}
	}
}
</script>

<style lang="scss" scoped>
/* 状态标签 */
.status-row {
	/deep/ .u-tag {
		&--success {
			// 已进场
			background: linear-gradient(135deg, #67c23a, #85ce61);
			color: #fff !important;
			box-shadow: 0 4rpx 12rpx rgba(103, 194, 58, 0.3);
		}

		&--warning {
			// 已离场
			background: linear-gradient(135deg, #e6a23c, #f0a020);
			color: #fff !important;
			box-shadow: 0 4rpx 12rpx rgba(230, 162, 60, 0.3);
		}

		&--info {
			// 未进场
			background: linear-gradient(135deg, #409eff, #66b1ff);
			color: #fff !important;
			box-shadow: 0 4rpx 12rpx rgba(64, 158, 255, 0.3);
		}
	}
}

/* 时间信息样式已更新为 time-records */

/* 3. 可视化增强样式 */
.status-bar {
	position: absolute;
	left: 0;
	top: 0;
	width: 8rpx;
	height: 100%;

	&.exited {
		background: #f56c6c;
	}

	&.entered {
		background: #67c23a;
	}

	&.pending {
		background: #909399;
	}
}

.timeline-container {
	margin: 30rpx 0;

	.timeline-node {
		padding: 16rpx;
		border-radius: 8rpx;
		background: #f8f9fa;

		&.entry {
			border-left: 4rpx solid #67c23a;
		}

		&.exit {
			border-left: 4rpx solid #f56c6c;
		}

		.time-label {
			font-size: 24rpx;
			color: #909399;
		}

		.time-value {
			display: block;
			font-size: 28rpx;
			color: #333;
			margin-top: 8rpx;
		}

		.duration {
			color: #409eff;
			font-weight: bold;
		}
	}
}

/* 旧样式已清理 */

/* 精简版列表样式 */
.u-swipe-action {
	padding: 16rpx;
	border-radius: 20rpx 20rpx 0 0;
	background: linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
	backdrop-filter: blur(10rpx);
}

.list-item {
	margin: 8rpx 0;
	border-radius: 16rpx;
	overflow: hidden;
	position: relative;
	/* 固定高度确保与左滑操作区匹配 */
	min-height: 180rpx;

	/* 添加硬件加速和平滑过渡 */
	transform: translateZ(0);
	will-change: transform, opacity;
	transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);

	/* 悬停效果 */
	&:hover {
		transform: translateY(-4rpx) scale(1.01);
	}

	/* 点击效果 */
	&:active {
		transform: translateY(-1rpx) scale(0.99);
		transition: all 0.1s ease;
	}

	/* 滑动状态 */
	&.swiping {
		.card-container {
			transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
		}
	}

	/* 多选模式 */
	&.multiSelectMode {
		.card-container {
			transform: translateX(60rpx) !important;
		}
	}

	/* 选中状态 */
	&.selected {
		.simplified-card {
			border-color: #409eff;
			box-shadow: 0 8rpx 24rpx rgba(64, 158, 255, 0.2);
		}
	}
}

.container {
	padding: 24rpx;
	background:
		radial-gradient(ellipse at top, rgba(64, 158, 255, 0.1) 0%, transparent 50%),
		radial-gradient(ellipse at bottom, rgba(103, 194, 58, 0.05) 0%, transparent 50%),
		linear-gradient(180deg, #f8fafe 0%, #ffffff 50%, #fafbff 100%);
	min-height: 100vh;
	position: relative;

	&::before {
		content: '';
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background:
			radial-gradient(circle at 20% 20%, rgba(64, 158, 255, 0.03) 0%, transparent 50%),
			radial-gradient(circle at 80% 80%, rgba(230, 162, 60, 0.02) 0%, transparent 50%),
			radial-gradient(circle at 40% 60%, rgba(103, 194, 58, 0.02) 0%, transparent 50%);
		pointer-events: none;
		z-index: 0;
	}

	&::after {
		content: '';
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image:
			repeating-linear-gradient(45deg,
				transparent,
				transparent 200rpx,
				rgba(255, 255, 255, 0.01) 200rpx,
				rgba(255, 255, 255, 0.01) 202rpx);
		pointer-events: none;
		z-index: 0;
	}

	/* 确保所有子元素在背景之上 */
	>* {
		position: relative;
		z-index: 1;
	}
}

.time-filter {
	background: #fff;
	border-radius: 16rpx;
	padding: 20rpx;
	margin-bottom: 24rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

/* ==================== 双行筛选布局样式 ==================== */
.smart-filter-container {
	margin: 24rpx 0;
	padding: 0 24rpx;
}

/* 筛选行样式 */
.filter-row {
	display: flex;
	align-items: center;
	background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
	border-radius: 16rpx;
	padding: 16rpx 20rpx;
	box-shadow: 0 4rpx 16rpx rgba(64, 158, 255, 0.1);
	border: 1rpx solid rgba(64, 158, 255, 0.1);
	margin-bottom: 12rpx;
	gap: 16rpx;
}

.filter-row:last-of-type {
	margin-bottom: 16rpx;
}

/* 筛选标签容器 */
.filter-chips {
	display: flex;
	flex: 1;
	gap: 10rpx;
	overflow-x: auto;
	align-items: center;
}

/* 筛选标签样式 */
.filter-chip {
	display: flex;
	align-items: center;
	gap: 4rpx;
	background: #fff;
	border: 1rpx solid #e0e6ed;
	border-radius: 18rpx;
	padding: 8rpx 12rpx;
	white-space: nowrap;
	transition: all 0.3s ease;
	cursor: pointer;
	flex-shrink: 0;

	&.active {
		background: linear-gradient(135deg, #409eff, #66b3ff);
		border-color: #409eff;
		color: #fff;
		transform: translateY(-2rpx);
		box-shadow: 0 6rpx 20rpx rgba(64, 158, 255, 0.3);
	}

	&:active {
		transform: scale(0.95);
	}
}

.chip-icon {
	font-size: 20rpx;
}

.chip-text {
	font-size: 24rpx;
	font-weight: 500;
}

.filter-chip.active .chip-text {
	color: #fff;
	font-weight: 600;
}

.chip-count {
	font-size: 18rpx;
	background: rgba(64, 158, 255, 0.1);
	color: #409eff;
	border-radius: 8rpx;
	padding: 2rpx 6rpx;
	min-width: 28rpx;
	text-align: center;
	margin-left: 2rpx;
}

.filter-chip.active .chip-count {
	background: rgba(255, 255, 255, 0.2);
	color: #fff;
}



.filter-label {
	font-size: 26rpx;
	color: #666;
	font-weight: 600;
	white-space: nowrap;
}



.advanced-filter-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 60rpx;
	height: 60rpx;
	background: linear-gradient(135deg, #722ed1, #9254de);
	color: #fff;
	border-radius: 50%;
	cursor: pointer;
	transition: all 0.3s ease;
	box-shadow: 0 4rpx 16rpx rgba(114, 46, 209, 0.3);
	flex-shrink: 0;

	&:active {
		transform: scale(0.95);
		background: linear-gradient(135deg, #531dab, #722ed1);
	}
}

.btn-icon {
	font-size: 32rpx;
	transition: transform 0.3s ease;
}

.current-filter-status {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-top: 16rpx;
	padding: 12rpx 16rpx;
	background: linear-gradient(135deg, #e6f7ff, #f0f9ff);
	border: 1rpx solid #91d5ff;
	border-radius: 12rpx;
}

.status-text {
	font-size: 22rpx;
	color: #1890ff;
	font-weight: 500;
}

.clear-filter-btn {
	padding: 4rpx 12rpx;
	background: #1890ff;
	color: #fff;
	border-radius: 12rpx;
	cursor: pointer;
	transition: all 0.3s ease;
	
	&:active {
		background: #096dd9;
		transform: scale(0.95);
	}
}

.clear-text {
	font-size: 20rpx;
	font-weight: 600;
}

/* 高级筛选面板样式 */
.advanced-filter-panel {
	margin: 16rpx 24rpx 24rpx;
	background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
	border-radius: 20rpx;
	box-shadow: 0 8rpx 32rpx rgba(114, 46, 209, 0.15);
	border: 2rpx solid #f0e6ff;
	overflow: hidden;
	animation: slideDown 0.3s ease-out;
	transform-origin: top;
	
	&.panel-show {
		animation: slideDown 0.3s ease-out;
	}
}

@keyframes slideDown {
	from {
		opacity: 0;
		transform: translateY(-20rpx) scaleY(0.8);
	}
	to {
		opacity: 1;
		transform: translateY(0) scaleY(1);
	}
}

.panel-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 24rpx 28rpx 20rpx;
	background: linear-gradient(135deg, #f0e6ff, #faf0ff);
	border-bottom: 1rpx solid #e6d7ff;
}

.panel-title {
	font-size: 28rpx;
	color: #722ed1;
	font-weight: 700;
}

.panel-close {
	width: 48rpx;
	height: 48rpx;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.8);
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: all 0.3s ease;
	
	&:active {
		background: rgba(255, 255, 255, 1);
		transform: scale(0.9);
	}
}

.close-icon {
	font-size: 20rpx;
	color: #722ed1;
	font-weight: bold;
}

.panel-content {
	padding: 28rpx;
}

.filter-section {
	margin-bottom: 32rpx;
	
	&:last-child {
		margin-bottom: 0;
	}
}

.section-title {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 16rpx;
	padding-bottom: 8rpx;
	border-bottom: 1rpx solid #f0f2f5;
}

.title-text {
	font-size: 26rpx;
	color: #333;
	font-weight: 700;
}

.title-desc {
	font-size: 20rpx;
	color: #999;
	background: #f5f5f5;
	padding: 2rpx 8rpx;
	border-radius: 8rpx;
}

/* 复选框样式 */
.status-checkboxes {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.checkbox-item {
	display: flex;
	align-items: center;
	padding: 12rpx 16rpx;
	background: #fff;
	border: 1rpx solid #e0e6ed;
	border-radius: 12rpx;
	cursor: pointer;
	transition: all 0.3s ease;
	
	&:active {
		transform: scale(0.98);
		background: #f8f9fa;
	}
}

.checkbox-icon {
	width: 32rpx;
	height: 32rpx;
	border: 2rpx solid #d9d9d9;
	border-radius: 6rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 12rpx;
	transition: all 0.3s ease;
	
	&.checked {
		background: linear-gradient(135deg, #52c41a, #73d13d);
		border-color: #52c41a;
		color: #fff;
	}
}

.check-mark {
	font-size: 20rpx;
	font-weight: bold;
}

.checkbox-label {
	flex: 1;
	font-size: 26rpx;
	color: #333;
	font-weight: 500;
}

.checkbox-count {
	font-size: 22rpx;
	color: #666;
	background: #f5f5f5;
	padding: 4rpx 8rpx;
	border-radius: 8rpx;
}

/* 单选框样式 */
.time-radios {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.radio-item {
	display: flex;
	align-items: center;
	padding: 12rpx 16rpx;
	background: #fff;
	border: 1rpx solid #e0e6ed;
	border-radius: 12rpx;
	cursor: pointer;
	transition: all 0.3s ease;
	
	&:active {
		transform: scale(0.98);
		background: #f8f9fa;
	}
}

.radio-icon {
	width: 32rpx;
	height: 32rpx;
	border: 2rpx solid #d9d9d9;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 12rpx;
	transition: all 0.3s ease;
	
	&.checked {
		border-color: #1890ff;
	}
}

.radio-dot {
	width: 16rpx;
	height: 16rpx;
	background: linear-gradient(135deg, #1890ff, #40a9ff);
	border-radius: 50%;
}

.radio-label {
	flex: 1;
	font-size: 26rpx;
	color: #333;
	font-weight: 500;
}

.radio-count {
	font-size: 22rpx;
	color: #666;
	background: #f5f5f5;
	padding: 4rpx 8rpx;
	border-radius: 8rpx;
}

/* 预设方案样式 */
.preset-schemes {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 16rpx;
}

.scheme-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 20rpx 16rpx;
	background: linear-gradient(135deg, #fff 0%, #fafbff 100%);
	border: 1rpx solid #e0e6ed;
	border-radius: 16rpx;
	cursor: pointer;
	transition: all 0.3s ease;
	
	&:active {
		transform: scale(0.95);
		background: linear-gradient(135deg, #f0f9ff, #e6f7ff);
		border-color: #91d5ff;
	}
}

.scheme-icon {
	font-size: 32rpx;
	margin-bottom: 8rpx;
}

.scheme-name {
	font-size: 24rpx;
	color: #333;
	font-weight: 600;
	text-align: center;
	margin-bottom: 4rpx;
}

.scheme-count {
	font-size: 20rpx;
	color: #666;
	background: #f5f5f5;
	padding: 2rpx 6rpx;
	border-radius: 6rpx;
}

/* 面板底部操作按钮 */
.panel-actions {
	display: flex;
	gap: 16rpx;
	padding: 20rpx 28rpx 28rpx;
	background: #fafbfc;
	border-top: 1rpx solid #f0f2f5;
}

.action-btn {
	flex: 1;
	height: 72rpx;
	border-radius: 36rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: all 0.3s ease;
	font-weight: 600;
	
	&:active {
		transform: scale(0.95);
	}
}

.reset-btn {
	background: #fff;
	color: #666;
	border: 1rpx solid #d9d9d9;
	
	&:active {
		background: #f5f5f5;
	}
}

.apply-btn {
	background: linear-gradient(135deg, #722ed1, #9254de);
	color: #fff;
	box-shadow: 0 6rpx 20rpx rgba(114, 46, 209, 0.3);
	
	&:active {
		background: linear-gradient(135deg, #531dab, #722ed1);
	}
}

/* 响应式优化 */
@media (max-width: 750rpx) {
	.filter-row {
		flex-direction: column;
		gap: 12rpx;
		align-items: flex-start;
	}

	.filter-chips {
		width: 100%;
		justify-content: flex-start;
	}
	
	.preset-schemes {
		grid-template-columns: 1fr;
	}
	
	.panel-actions {
		flex-direction: column;
		gap: 12rpx;
	}
}

.status-tags {
	margin: 24rpx 0;
}

/* 卡片背景装饰效果 */
.card-background {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	pointer-events: none;
	z-index: 1;
}

.gradient-overlay {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: linear-gradient(135deg,
			rgba(64, 158, 255, 0.02) 0%,
			rgba(103, 194, 58, 0.01) 25%,
			rgba(230, 162, 60, 0.01) 50%,
			rgba(245, 108, 108, 0.01) 75%,
			rgba(144, 147, 153, 0.01) 100%);
	border-radius: 28rpx;
}

.floating-elements {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	overflow: hidden;
	border-radius: 28rpx;
}

.float-dot {
	position: absolute;
	border-radius: 50%;
	background: rgba(64, 158, 255, 0.08);
	animation: float 6s ease-in-out infinite;
}

.dot-1 {
	width: 60rpx;
	height: 60rpx;
	top: 20%;
	right: 10%;
	animation-delay: 0s;
	background: linear-gradient(135deg, rgba(64, 158, 255, 0.1), rgba(64, 158, 255, 0.05));
}

.dot-2 {
	width: 40rpx;
	height: 40rpx;
	bottom: 30%;
	left: 15%;
	animation-delay: 2s;
	background: linear-gradient(135deg, rgba(103, 194, 58, 0.08), rgba(103, 194, 58, 0.03));
}

.dot-3 {
	width: 30rpx;
	height: 30rpx;
	top: 60%;
	right: 20%;
	animation-delay: 4s;
	background: linear-gradient(135deg, rgba(230, 162, 60, 0.06), rgba(230, 162, 60, 0.02));
}

.shine-effect {
	position: absolute;
	top: 0;
	left: -100%;
	width: 100%;
	height: 100%;
	background: linear-gradient(90deg,
			transparent,
			rgba(255, 255, 255, 0.3),
			transparent);
	animation: shine 8s infinite;
	border-radius: 28rpx;
}

@keyframes float {

	0%,
	100% {
		transform: translateY(0px) rotate(0deg);
		opacity: 0.3;
	}

	50% {
		transform: translateY(-20rpx) rotate(180deg);
		opacity: 0.8;
	}
}

@keyframes shine {
	0% {
		left: -100%;
	}

	50% {
		left: 100%;
	}

	100% {
		left: 100%;
	}
}

.card-header {
	background: linear-gradient(135deg, #f8faff 0%, #eef4ff 50%, #e6f0ff 100%) !important;
	border-bottom: 1px solid rgba(64, 158, 255, 0.08);
	padding: 24rpx !important;
	border-radius: 28rpx 28rpx 0 0;
	position: relative;
	z-index: 2;

	/* 添加微妙的内阴影 */
	box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.8);
}

.main-info {
	display: flex;
	justify-content: space-between;
	align-items: center;
	width: 100%;
}

.plate-number {
	display: flex;
	align-items: center;

	/deep/ .u-icon {
		margin-right: 8rpx;
	}
}

.plate-text {
	font-size: 36rpx;
	font-weight: 800;
	letter-spacing: 3rpx;
	padding: 14rpx 22rpx;
	border-radius: 20rpx;
	font-family: "SF Pro Display", "PingFang SC", "微软雅黑";
	min-width: 200rpx;
	text-align: center;
	display: inline-block;
	position: relative;
	overflow: hidden;
	backdrop-filter: blur(10rpx);
	transform: translateZ(0);
	transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

	&.blue-plate {
		background: linear-gradient(135deg, #1565c0 0%, #1976d2 50%, #1e88e5 100%);
		color: #FFFFFF;
		border: 3rpx solid #0d47a1;
		box-shadow:
			0 12rpx 32rpx rgba(25, 118, 210, 0.4),
			0 4rpx 12rpx rgba(25, 118, 210, 0.2),
			inset 0 2rpx 0 rgba(255, 255, 255, 0.3),
			inset 0 -2rpx 0 rgba(0, 0, 0, 0.1);
	}

	&.green-plate {
		background: linear-gradient(180deg, #6AD390 0%, #D0F1E4 100%);
		color: #000000;
		border: 3rpx solid #4CAF50;
		box-shadow:
			0 12rpx 32rpx rgba(106, 211, 144, 0.4),
			0 4rpx 12rpx rgba(106, 211, 144, 0.2),
			inset 0 2rpx 0 rgba(255, 255, 255, 0.3),
			inset 0 -2rpx 0 rgba(0, 0, 0, 0.1);
	}

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
		transition: left 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
	}

	&::after {
		content: '';
		position: absolute;
		top: 6rpx;
		left: 6rpx;
		right: 6rpx;
		bottom: 6rpx;
		border: 1rpx solid rgba(255, 255, 255, 0.2);
		border-radius: 14rpx;
		pointer-events: none;
	}

	&:hover {
		transform: translateY(-4rpx) scale(1.05);
	}

	&:hover::before {
		left: 100%;
	}

	&:active {
		transform: translateY(-1rpx) scale(1.02);
	}
}

.filter-panel {
	padding: 32rpx 24rpx;
	background: linear-gradient(135deg, #ffffff, #f8faff);
	border-radius: 24rpx 24rpx 0 0;
	box-shadow: 0 -8rpx 32rpx rgba(64, 158, 255, 0.1);
	border-top: 2rpx solid rgba(64, 158, 255, 0.1);
}

.section-title {
	font-size: 26rpx;
	color: #666666;
	margin-bottom: 16rpx;
	font-weight: 400;
	position: relative;
	padding-left: 12rpx;
}

.section-title::before {
	content: '';
	position: absolute;
	left: 0;
	top: 50%;
	transform: translateY(-50%);
	width: 3rpx;
	height: 20rpx;
	background: #909399;
	border-radius: 2rpx;
}

.quick-time {
	display: flex;
	gap: 20rpx;
	margin-bottom: 32rpx;
}

.time-row {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 16rpx;
	margin-bottom: 24rpx;
}

.time-item {
	background: #f8f9fa;
	border-radius: 8rpx;
	padding: 16rpx;
	border: 1rpx solid #e0e3e6;

	.time-label {
		font-size: 22rpx;
		color: #909399;
		margin-bottom: 8rpx;
	}

	.time-value {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 24rpx;
		color: #606266;
	}
}

.status-btns {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-bottom: 24rpx;
}

.action-bar {
	display: flex;
	margin-top: 24rpx;
	gap: 16rpx;
	padding-top: 16rpx;
	border-top: 1rpx solid #f0f2f5;
}

.search-container {
	padding: 20rpx 24rpx;
	background: linear-gradient(135deg, #ffffff, #f8faff);
	display: flex;
	align-items: center;
	border-radius: 20rpx;
	box-shadow: 0 8rpx 32rpx rgba(64, 158, 255, 0.12);
	margin-bottom: 20rpx;
	gap: 16rpx;
	border: 1rpx solid #e6f0ff;
	backdrop-filter: blur(10rpx);
}

.search-input-wrapper {
	flex: 1;
}

.action-buttons {
	display: flex;
	align-items: center;
	flex-shrink: 0;
}

.album {
	@include flex;
	align-items: flex-start;

	&__avatar {
		background-color: $u-bg-color;
		padding: 5px;
		border-radius: 3px;
		color: #fff
	}

	&__content {
		margin-left: 10px;
		flex: 1;
	}
}

.checkbox-group {
	display: flex;
	flex-wrap: wrap;
	gap: 24rpx;
}

.button-hover {
	transform: scale(0.98);
	opacity: 0.9;
}

.sort-bar {
	display: flex;
	align-items: center;
	padding: 20rpx;
	background: #fff;
	margin-bottom: 20rpx;
	border-radius: 12rpx;
}


.filter-container {
	padding: 24rpx 32rpx;
	background: #fff;
	margin-bottom: 20rpx;

	.filter-controls {
		display: flex;
		justify-content: space-between;
		gap: 24rpx;
	}
}

.card-list {
	padding: 20rpx;
}

.card-item {
	background: #fff;
	border-radius: 12rpx;
	padding: 24rpx;
	margin: 20rpx;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
	position: relative;
}

.vehicle-info {
	display: flex;
	align-items: center;
	margin-bottom: 16rpx;

	.car-icon {
		margin-right: 12rpx;
	}

	.license-plate {
		font-size: 38rpx;
		font-weight: 800;
		color: #000;
	}

	.status-badge {
		margin-left: auto;
	}
}

.meta-info {
	padding-left: 40rpx;

	.user-info {
		display: flex;
		align-items: center;
		font-size: 26rpx;
		color: #606266;

		u-icon {
			margin-right: 8rpx;
		}

		.owner {
			font-size: 26rpx;
			color: #000;
			margin-right: 24rpx;
		}
	}

	.address-info {
		display: inline-flex;
		align-items: center;
		margin-bottom: 6px;

		u-icon {
			margin-right: 8rpx;
		}
	}

	.address {
		font-size: 16px;
		color: #000000;
		margin-left: 8px;
		white-space: nowrap;
	}

	/* 新增样式 */
	.icon-text-group {
		display: inline-flex;
		align-items: center;
		margin-right: 16px;
	}

	.icon-text-group text {
		margin-left: 4px;
		white-space: nowrap;
	}

	.time-info {
		margin-top: 12rpx;
		display: flex;
		align-items: center;
		font-size: 24rpx;
		color: #909399;

		u-icon {
			margin-right: 8rpx;
		}
	}
}

.action-wrapper {
	border-top: 1rpx solid #eee;
	margin-top: 20rpx;
	padding-top: 20rpx;

	.action-btns {
		display: flex;
		justify-content: flex-end;
		gap: 16rpx;

		.btn-custom {
			height: 56rpx;
			line-height: 56rpx;
			padding: 0 24rpx;
			font-size: 26rpx;
			border-radius: 28rpx;
		}
	}
}

/* 涟漪动画 */
.ripple-btn {
	position: relative;
	overflow: hidden;
}

.ripple-btn::after {
	content: '';
	position: absolute;
	top: 50%;
	left: 50%;
	width: 0;
	height: 0;
	background: rgba(255, 255, 255, 0.3);
	border-radius: 50%;
	transform: translate(-50%, -50%);
	transition: width 0.3s, height 0.3s;
}

.ripple-btn:active::after {
	width: 200rpx;
	height: 200rpx;
}

/* 复选框选中态优化 */
/deep/ .u-checkbox__icon-wrap--checked {
	background: #2979ff !important;
	border-color: #2979ff !important;
}

.tui-icon {
	width: 48rpx;
	height: 48rpx;
	margin-right: 20rpx;
}

.tui-right {
	margin-left: auto;
}

.container {
	margin-top: 10px;
	padding-bottom: 120rpx;
	box-sizing: border-box;
}

.header {
	padding: 80rpx 90rpx 60rpx 90rpx;
	box-sizing: border-box;
}

.title {
	font-size: 34rpx;
	color: #333;
	font-weight: 500;
}

.sub-title {
	font-size: 24rpx;
	color: #7a7a7a;
	padding-top: 18rpx;
}

.tui-title {
	width: 100%;
	padding: 50rpx 30rpx 30rpx;
	box-sizing: border-box;
	font-weight: bold;
}

.tui-header-bg {
	width: 100%;
	margin: 0;
}

.tui-header-img {
	width: 100%;
	height: 440rpx;
	display: block;
}

.tui-header-icon {
	width: 100%;
	position: fixed;
	top: 0;
	padding: 0 12rpx;
	display: flex;
	align-items: center;
	height: 32px;
	transform: translateZ(0);
	z-index: 99999;
	box-sizing: border-box;
}

.tui-content-box {
	width: 100%;
	height: 44px;
	padding: 0 30rpx;
	box-sizing: border-box;
	display: flex;
	align-items: center;
}

.tui-avatar-box {
	width: 30px;
	height: 30px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 1px solid #eaeef1;
	flex-shrink: 0;
}

.tui-avatar {
	width: 28px;
	height: 28px;
	border-radius: 50%;
}

.tui-search-box {
	width: 95%;
	height: 32px;
	margin: 0 28rpx;
	border-radius: 18px;
	padding: 0 12px;
	box-sizing: border-box;
	display: flex;
	align-items: center;
}

.tui-search-text {
	color: #8a8a8a;
	padding-left: 10rpx;
}

.tui-notice-box {
	width: 70px;
	margin-right: -10px;
	height: 40px;
}

.tui-menus {
	width: 400px;
	height: 30px;
	margin-top: -30px;
	padding-bottom: 40px;
	/* padding-top: -12px; */
	/* background-color: #d9ebf5; */
}

.tui-section-box {
	width: 100%;
	margin-top: -180px;
	margin-left: -12px;
}

.container {
	padding: 16rpx;
}


.status-tags {
	margin: 16rpx 0;
}

.time-filter-tags {
	margin-top: 16rpx;
	background: linear-gradient(135deg, #ffffff, #f8faff);
	border-radius: 20rpx;
	padding: 24rpx;
	box-shadow: 0 8rpx 24rpx rgba(64, 158, 255, 0.06);
	border: 1rpx solid rgba(64, 158, 255, 0.08);
}

.time-filter-title {
	font-size: 28rpx;
	color: #303133;
	margin-bottom: 16rpx;
	font-weight: 500;
}

.time-tags-wrap {
	display: flex;
	flex-wrap: wrap;
	gap: 8rpx;
}

/* 卡片列表紧凑化 */
.data-list {
	padding: 12rpx;
}

.list-item {
	margin: 18rpx 0;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}

/* 卡片头部紧凑化 */
/deep/ .u-card__head {
	padding: 16rpx !important;
}

/* 卡片内容紧凑化 */
/deep/ .u-card__body {
	padding: 16rpx !important;
}

/* 新的卡片内容区域已重新设计 */

/* 卡片内容区域紧凑化 */
.card-body {
	padding: 20rpx !important;
	position: relative;
	z-index: 3;
}

/* 卡片头部调整 */
.card-header {
	padding: 20rpx !important;
}

/* 筛选弹窗内部紧凑化 */
.filter-panel {
	padding: 30rpx 24rpx;
}

.quick-time {
	gap: 16rpx;
	margin-bottom: 24rpx;
}

.time-row {
	gap: 16rpx;
	margin-bottom: 24rpx;
}

.time-item {
	padding: 16rpx;
}

.status-btns {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
	margin-bottom: 24rpx;
}

.action-bar {
	margin-top: 24rpx;
	gap: 16rpx;
}

/* 添加平滑过渡效果 */
.list-item {
	margin: 18rpx 0;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);

	/* 添加硬件加速和平滑过渡 */
	transform: translateZ(0);
	will-change: transform, opacity;
	transition: transform 0.3s ease, opacity 0.3s ease;
}

/* 修复数据列表渲染闪烁 */
.data-list {
	min-height: 400rpx;
	/* 根据实际内容调整最小高度 */
	position: relative;
	transform: translateZ(0);
	will-change: transform;
}

/* 优化卡片过渡效果 */
/deep/ .u-card {
	transform: translateZ(0);
	backface-visibility: hidden;
	will-change: transform, opacity;
	transition: all 0.3s ease;
}

/* 优化加载状态 */
/deep/ .u-loading-page {
	background-color: rgba(255, 255, 255, 0.4) !important;
	backdrop-filter: blur(2px);
}

/* 优化分段器过渡效果 */
/deep/ .u-subsection {
	will-change: transform;

	.u-subsection__bar {
		transition: all 0.3s cubic-bezier(0.35, 0, 0.25, 1) !important;
	}

	.u-subsection__item {
		transition: all 0.2s ease !important;
	}
}

/* 时间标签平滑过渡 */
.time-tags-wrap .u-tag {
	transition: all 0.2s ease !important;
}

.card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	background: linear-gradient(to right, #f8f9ff, #f1f5ff) !important;
	border-bottom: 1px dashed rgba(63, 135, 245, 0.15);
}

.appointment-time {
	display: flex;
	align-items: center;
	background: rgba(63, 135, 245, 0.08);
	border-radius: 24rpx;
	padding: 6rpx 16rpx;
}

.time-text {
	margin-left: 8rpx;
	font-size: 28rpx;
	color: #3f87f5;
	font-weight: 500;
}

.card-title {
	font-size: 28rpx;
	color: #606266;
	font-weight: 500;
}

/* 预约时间区域样式 */
.appointment-time-section {
	display: flex;
	align-items: center;
	background: linear-gradient(135deg, #e8f4fd, #f0f8ff);
	border-radius: 16rpx;
	padding: 18rpx 20rpx;
	margin-bottom: 20rpx;
	position: relative;
	border-left: 4rpx solid #409eff;
	box-shadow: 0 2rpx 12rpx rgba(64, 158, 255, 0.08);

	.time-content {
		flex: 1;
		margin-left: 12rpx;

		.time-label {
			display: block;
			font-size: 22rpx;
			color: #73879c;
			margin-bottom: 4rpx;
			font-weight: 500;
		}

		.time-value {
			font-size: 30rpx;
			color: #409eff;
			font-weight: 700;
			letter-spacing: 0.5rpx;
		}
	}
}

/* 紧凑信息网格 */
.info-grid {
	background: linear-gradient(135deg, #fafbfc 0%, #f5f7fa 100%);
	border-radius: 16rpx;
	padding: 20rpx;
	margin-bottom: 16rpx;
	border: 1rpx solid rgba(240, 242, 245, 0.8);
	position: relative;
	z-index: 2;
	box-shadow:
		0 4rpx 16rpx rgba(0, 0, 0, 0.04),
		inset 0 1rpx 0 rgba(255, 255, 255, 0.9);
	backdrop-filter: blur(10rpx);

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(45deg,
				rgba(64, 158, 255, 0.01) 0%,
				rgba(103, 194, 58, 0.01) 50%,
				rgba(230, 162, 60, 0.01) 100%);
		border-radius: 16rpx;
		z-index: -1;
	}
}

.info-row {
	display: flex;
	margin-bottom: 12rpx;

	&:last-child {
		margin-bottom: 0;
	}
}

.info-cell {
	flex: 1;
	display: flex;
	align-items: center;
	min-height: 32rpx;

	&.full-width {
		flex: 1;
	}

	/deep/ .u-icon {
		margin-right: 8rpx;
		flex-shrink: 0;
	}

	.cell-value {
		font-size: 26rpx;
		color: #333;
		font-weight: 500;
		line-height: 1.2;
		word-break: break-all;
	}

	.time-summary {
		font-size: 24rpx;
		color: #666;
		background: #f0f9ff;
		padding: 4rpx 12rpx;
		border-radius: 12rpx;
		margin-left: auto;
	}
}

/* 紧凑的进出场时间记录 */
.compact-time-records {
	background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 50%, #eceff1 100%);
	border-radius: 16rpx;
	padding: 16rpx 20rpx;
	border: 1rpx solid rgba(233, 236, 239, 0.6);
	position: relative;
	z-index: 2;
	box-shadow:
		0 6rpx 20rpx rgba(0, 0, 0, 0.06),
		inset 0 1rpx 0 rgba(255, 255, 255, 0.8);
	backdrop-filter: blur(8rpx);

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg,
				rgba(82, 196, 26, 0.02) 0%,
				rgba(245, 34, 45, 0.02) 100%);
		border-radius: 16rpx;
		z-index: -1;
	}
}

.time-record-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8rpx;
}

.record-cell {
	display: flex;
	align-items: center;
	gap: 6rpx;

	.record-text {
		font-size: 24rpx;
		color: #495057;
		font-weight: 500;
	}
}

.record-dot {
	width: 16rpx;
	height: 16rpx;
	border-radius: 50%;
	flex-shrink: 0;
	position: relative;

	&::before {
		content: '';
		position: absolute;
		top: -4rpx;
		left: -4rpx;
		right: -4rpx;
		bottom: -4rpx;
		border-radius: 50%;
		opacity: 0.3;
		animation: pulse-dot 2s infinite;
	}

	&.entry-dot {
		background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
		box-shadow:
			0 4rpx 12rpx rgba(82, 196, 26, 0.4),
			0 2rpx 6rpx rgba(82, 196, 26, 0.2),
			inset 0 1rpx 0 rgba(255, 255, 255, 0.3);

		&::before {
			background: linear-gradient(135deg, #52c41a, #73d13d);
		}
	}

	&.exit-dot {
		background: linear-gradient(135deg, #f5222d 0%, #ff7875 100%);
		box-shadow:
			0 4rpx 12rpx rgba(245, 34, 45, 0.4),
			0 2rpx 6rpx rgba(245, 34, 45, 0.2),
			inset 0 1rpx 0 rgba(255, 255, 255, 0.3);

		&::before {
			background: linear-gradient(135deg, #f5222d, #ff7875);
		}
	}
}

@keyframes pulse-dot {
	0% {
		transform: scale(1);
		opacity: 0.3;
	}

	50% {
		transform: scale(1.2);
		opacity: 0.1;
	}

	100% {
		transform: scale(1);
		opacity: 0.3;
	}
}

.record-separator {
	font-size: 24rpx;
	color: #adb5bd;
	font-weight: bold;
	margin: 0 8rpx;
}

.duration-chip {
	background: linear-gradient(135deg, #13c2c2 0%, #36cfc9 50%, #5cdbd3 100%);
	color: #ffffff;
	font-size: 20rpx;
	font-weight: 700;
	padding: 6rpx 14rpx;
	border-radius: 14rpx;
	margin-left: auto;
	box-shadow:
		0 4rpx 16rpx rgba(19, 194, 194, 0.3),
		0 2rpx 6rpx rgba(19, 194, 194, 0.15),
		inset 0 1rpx 0 rgba(255, 255, 255, 0.3);
	white-space: nowrap;
	position: relative;
	text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.1);
	backdrop-filter: blur(4rpx);
	border: 1rpx solid rgba(255, 255, 255, 0.2);

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
		animation: chip-shine 3s infinite;
		border-radius: 14rpx;
	}
}

@keyframes chip-shine {
	0% {
		left: -100%;
	}

	100% {
		left: 100%;
	}
}

/* 修改今日标识样式 */
.today-badge {
	position: absolute;
	top: 0;
	left: 0;
	background: linear-gradient(135deg, #ff6b35, #f7931e);
	color: white;
	padding: 8rpx 20rpx;
	font-size: 24rpx;
	font-weight: 700;
	border-bottom-right-radius: 20rpx;
	z-index: 5;
	box-shadow: 0 4rpx 16rpx rgba(255, 107, 53, 0.4);
	display: flex;
	align-items: center;
	backdrop-filter: blur(10rpx);
}

.yesterday-badge {
	position: absolute;
	top: 0;
	left: 0;
	background: linear-gradient(135deg, #78909c, #90a4ae);
	color: white;
	padding: 8rpx 20rpx;
	font-size: 24rpx;
	font-weight: 700;
	border-bottom-right-radius: 20rpx;
	z-index: 5;
	box-shadow: 0 4rpx 16rpx rgba(120, 144, 156, 0.3);
	display: flex;
	align-items: center;
	backdrop-filter: blur(10rpx);
}

.badge-text {
	margin-left: 4rpx;
}

/* 今日预约时间特殊样式 */
.today-appointment {
	background: linear-gradient(135deg, #fff3e0, #ffe0b2) !important;
	border-left: 8rpx solid #ff6b35 !important;
	position: relative;
	overflow: hidden;
	box-shadow: 0 4rpx 16rpx rgba(255, 107, 53, 0.15) !important;

	.time-value {
		color: #e65100 !important;
		font-weight: 700 !important;
		animation: pulse 2s infinite;
	}
}

/* 昨日预约时间特殊样式 */
.yesterday-appointment {
	background: linear-gradient(135deg, #f5f5f5, #eceff1) !important;
	border-left: 8rpx solid #78909c !important;
	box-shadow: 0 4rpx 16rpx rgba(120, 144, 156, 0.1) !important;

	.time-value {
		color: #455a64 !important;
		font-weight: 600 !important;
	}
}

/* 今日时间的脉动动画 */
@keyframes pulse {
	0% {
		opacity: 1;
	}

	50% {
		opacity: 0.8;
	}

	100% {
		opacity: 1;
	}
}

/* 紧急标记 */
.urgent-marker {
	position: absolute;
	right: 0;
	top: 0;
	height: 100%;
	width: 8rpx;
	background: linear-gradient(to bottom, #f44336, #ff9800);
	animation: blink 1.5s infinite;
	border-radius: 0 12rpx 12rpx 0;
}

@keyframes blink {
	0% {
		opacity: 1;
	}

	50% {
		opacity: 0.5;
	}

	100% {
		opacity: 1;
	}
}

/* 卡片整体悬停效果增强 - 帮助区分查看过的卡片 */
.list-item:hover {
	transform: translateY(-8rpx) scale(1.01);
	box-shadow: 0 16rpx 64rpx rgba(64, 158, 255, 0.15);
	border-color: rgba(64, 158, 255, 0.15);
}

/* 在时间筛选标签区域添加今日/昨日快速筛选 */
.quick-filter-tag {
	margin-top: 16rpx;
	display: flex;
	gap: 16rpx;
}

.today-filter {
	background: rgba(244, 67, 54, 0.1);
	color: #f44336;
	border: 1px solid rgba(244, 67, 54, 0.2);
	border-radius: 24rpx;
	padding: 4rpx 16rpx;
	font-size: 24rpx;
}

.yesterday-filter {
	background: rgba(96, 125, 139, 0.1);
	color: #607d8b;
	border: 1px solid rgba(96, 125, 139, 0.2);
	border-radius: 24rpx;
	padding: 4rpx 16rpx;
	font-size: 24rpx;
}

/* 审批记录提示信息样式 */
.approval-tips {
	margin: 12rpx 0;
	background: linear-gradient(135deg, #fff9e6, #fffbf0);
	border-radius: 16rpx;
	padding: 16rpx 20rpx;
	border: 1rpx solid #ffd666;
	box-shadow: 0 2rpx 8rpx rgba(255, 214, 102, 0.1);
}

.tips-header {
	display: flex;
	align-items: center;
	margin-bottom: 12rpx;
}

.tips-title {
	margin-left: 6rpx;
	font-size: 26rpx;
	color: #e6a23c;
	font-weight: 600;
}

.tips-content {
	display: flex;
	flex-direction: column;
	gap: 6rpx;
}

.tip-item {
	font-size: 22rpx;
	color: #8c6e3a;
	line-height: 1.4;
	display: block;
}

/* 智能数据统计面板样式 */
.smart-stats-panel {
	margin: 24rpx 0;
	background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f8faff 100%);
	border-radius: 24rpx;
	padding: 28rpx;
	box-shadow: 0 12rpx 48rpx rgba(64, 158, 255, 0.1);
	border: 2rpx solid #e6f0ff;
	position: relative;
	overflow: hidden;
}

.smart-stats-panel::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 4rpx;
	background: linear-gradient(90deg, #409eff 0%, #67c23a 25%, #e6a23c 50%, #f56c6c 75%, #909399 100%);
}

.stats-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24rpx;
}

.stats-title {
	font-size: 28rpx;
	color: #409eff;
	font-weight: 700;
	display: flex;
	align-items: center;
	letter-spacing: 0.5rpx;

	.vs-text {
		font-size: 24rpx;
		color: #666;
		font-weight: 400;
		margin-left: 8rpx;
	}
}

/* 核心指标网格 */
.core-metrics-grid {
	display: flex;
	justify-content: space-between;
	gap: 12rpx;
	margin-bottom: 24rpx;
}

.metric-item {
	flex: 1;
	background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 255, 0.8));
	border-radius: 16rpx;
	padding: 16rpx 12rpx;
	text-align: center;
	position: relative;
	overflow: hidden;
	transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	backdrop-filter: blur(10rpx);
	border: 1rpx solid rgba(255, 255, 255, 0.5);
	cursor: pointer;

	&:active {
		transform: scale(0.95);
	}

	&.efficiency {
		background: linear-gradient(135deg, #fff9e6, #fffbf0);
		border-color: #ffd666;
	}
}

.metric-value {
	font-size: 32rpx;
	font-weight: 800;
	color: #262626;
	margin-bottom: 4rpx;
	letter-spacing: 0.5rpx;
}

.metric-label {
	font-size: 22rpx;
	color: #666;
	margin-bottom: 6rpx;
	font-weight: 500;
}

.metric-trend {
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 18rpx;
	gap: 2rpx;

	&.trend-up {
		color: #52c41a;
	}

	&.trend-down {
		color: #f5222d;
	}

	&.trend-stable {
		color: #666;
	}

	&.urgent {
		color: #fa8c16;
		animation: pulse-urgent 2s infinite;
	}

	&.normal {
		color: #409eff;
	}

	.trend-icon {
		font-size: 16rpx;
	}

	.trend-text {
		font-weight: 600;
	}
}

@keyframes pulse-urgent {

	0%,
	100% {
		opacity: 1;
	}

	50% {
		opacity: 0.6;
	}
}

/* 进度条区域 */
.progress-section {
	margin-bottom: 20rpx;
}

.progress-wrapper {
	background: rgba(255, 255, 255, 0.8);
	border-radius: 12rpx;
	padding: 16rpx;
	backdrop-filter: blur(5rpx);
}

.progress-bar {
	height: 16rpx;
	background: #f0f2f5;
	border-radius: 8rpx;
	position: relative;
	overflow: hidden;
	margin-bottom: 12rpx;
}

.progress-fill {
	height: 100%;
	background: linear-gradient(90deg, #52c41a, #95de64);
	border-radius: 8rpx;
	transition: width 1s ease-out;
	position: relative;

	&::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
		animation: progress-shine 2s infinite;
	}
}

.progress-segments {
	position: absolute;
	top: 0;
	left: 0;
	height: 100%;
	display: flex;

	.segment {
		height: 100%;
		transition: width 1s ease-out;

		&.approved {
			background: #52c41a;
		}

		&.rejected {
			background: #f5222d;
		}
	}
}

.progress-label {
	display: flex;
	justify-content: space-between;
	align-items: center;

	.progress-text {
		font-size: 24rpx;
		color: #666;
	}

	.progress-percentage {
		font-size: 26rpx;
		color: #409eff;
		font-weight: 700;
	}
}

@keyframes progress-shine {
	0% {
		transform: translateX(-100%);
	}

	100% {
		transform: translateX(200%);
	}
}



/* 审批记录标题样式 */
.records-title-section {
	margin: 32rpx 0 20rpx 0;
	background: linear-gradient(135deg, #ffffff, #f8faff);
	border-radius: 16rpx;
	overflow: hidden;
	box-shadow: 0 4rpx 20rpx rgba(64, 158, 255, 0.06);
	border: 1rpx solid rgba(64, 158, 255, 0.08);
}

.records-title-content {
	padding: 24rpx 32rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
	background: linear-gradient(135deg, rgba(64, 158, 255, 0.02), rgba(64, 158, 255, 0.01));
}

.title-left {
	display: flex;
	align-items: center;
	flex: 1;
}

.title-text {
	font-size: 32rpx;
	color: #262626;
	font-weight: 700;
	letter-spacing: 1rpx;
	margin-right: 16rpx;
}

.title-badge {
	background: linear-gradient(135deg, #409eff, #36a3ff);
	border-radius: 20rpx;
	padding: 4rpx 16rpx;
	min-width: 48rpx;
	height: 36rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4rpx 12rpx rgba(64, 158, 255, 0.25);
}

.badge-number {
	font-size: 24rpx;
	color: #ffffff;
	font-weight: 700;
	line-height: 1;
}

.title-right {
	padding: 8rpx;
	border-radius: 50%;
	background: rgba(144, 147, 153, 0.08);
	transition: all 0.3s ease;
	cursor: pointer;
}

.title-right:active {
	transform: scale(0.9) rotate(180deg);
	background: rgba(64, 158, 255, 0.1);
}

.title-line {
	height: 4rpx;
	background: linear-gradient(90deg,
			#409eff 0%,
			#67c23a 25%,
			#e6a23c 50%,
			#f56c6c 75%,
			#909399 100%);
}

/* 快速筛选侧滑面板样式 */
.quick-filter-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.4);
	backdrop-filter: blur(4rpx);
	z-index: 998;
	opacity: 0;
	visibility: hidden;
	transition: all 0.3s ease;

	&.active {
		opacity: 1;
		visibility: visible;
	}
}

.quick-filter-panel {
	position: fixed;
	top: 0;
	right: 0;
	width: 560rpx;
	height: 100vh;
	background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
	z-index: 999;
	transform: translateX(100%);
	transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
	box-shadow: -8rpx 0 32rpx rgba(0, 0, 0, 0.1);
	display: flex;
	flex-direction: column;

	&.active {
		transform: translateX(0);
	}
}

/* 面板头部 */
.panel-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 32rpx 24rpx 24rpx;
	border-bottom: 1rpx solid #f0f2f5;
	background: linear-gradient(135deg, #f0f9ff, #e6f0ff);
}

.header-title {
	display: flex;
	align-items: center;

	.title-text {
		font-size: 32rpx;
		color: #262626;
		font-weight: 700;
		margin-left: 8rpx;
	}
}

.header-close {
	width: 64rpx;
	height: 64rpx;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.8);
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s ease;

	&:active {
		transform: scale(0.9);
		background: rgba(245, 245, 245, 0.9);
	}
}

/* 筛选区域 */
.filter-section {
	padding: 24rpx;
	border-bottom: 1rpx solid #f8f9fa;
}

.section-header {
	display: flex;
	align-items: center;
	margin-bottom: 16rpx;

	.section-title {
		font-size: 28rpx;
		color: #262626;
		font-weight: 600;
		margin-left: 6rpx;
	}
}

/* 时间范围选项 */
.time-range-options {
	display: flex;
	flex-direction: column;
	gap: 12rpx;
}

.range-option {
	display: flex;
	align-items: center;
	padding: 16rpx 20rpx;
	background: #fafbfc;
	border-radius: 12rpx;
	border: 2rpx solid transparent;
	transition: all 0.3s ease;
	cursor: pointer;

	&:active {
		transform: scale(0.98);
	}

	&.active {
		background: linear-gradient(135deg, #e8f4ff, #f0f8ff);
		border-color: #409eff;
		box-shadow: 0 4rpx 16rpx rgba(64, 158, 255, 0.15);
	}
}

.option-radio {
	width: 32rpx;
	height: 32rpx;
	border-radius: 50%;
	border: 3rpx solid #ddd;
	margin-right: 16rpx;
	position: relative;
	transition: all 0.3s ease;

	&.checked {
		border-color: #409eff;
		background: #409eff;

		&::after {
			content: '';
			position: absolute;
			top: 6rpx;
			left: 6rpx;
			width: 14rpx;
			height: 14rpx;
			border-radius: 50%;
			background: #ffffff;
		}
	}
}

.option-text {
	font-size: 28rpx;
	color: #333;
	font-weight: 500;
}

/* 复选框样式 */
.status-checkboxes,
.vehicle-checkboxes {
	display: flex;
	flex-direction: column;
	gap: 12rpx;
}

.checkbox-item {
	display: flex;
	align-items: center;
	padding: 16rpx 20rpx;
	background: #fafbfc;
	border-radius: 12rpx;
	border: 2rpx solid transparent;
	transition: all 0.3s ease;
	cursor: pointer;

	&:active {
		transform: scale(0.98);
	}

	&.active {
		background: linear-gradient(135deg, #f0f9ff, #e8f4ff);
		border-color: #409eff;
		box-shadow: 0 4rpx 16rpx rgba(64, 158, 255, 0.1);
	}
}

.checkbox {
	width: 32rpx;
	height: 32rpx;
	border-radius: 8rpx;
	border: 3rpx solid #ddd;
	margin-right: 16rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s ease;

	&.checked {
		border-color: #409eff;
		background: #409eff;
	}
}

.checkbox-text {
	flex: 1;
	font-size: 28rpx;
	color: #333;
	font-weight: 500;
}

.status-count {
	background: linear-gradient(135deg, #409eff, #36a3ff);
	color: #fff;
	font-size: 20rpx;
	font-weight: 700;
	padding: 4rpx 12rpx;
	border-radius: 20rpx;
	min-width: 40rpx;
	text-align: center;
	box-shadow: 0 2rpx 8rpx rgba(64, 158, 255, 0.3);
}

/* 操作按钮 */
.panel-actions {
	margin-top: auto;
	padding: 24rpx;
	display: flex;
	gap: 16rpx;
	border-top: 1rpx solid #f0f2f5;
	background: #fafbfc;
}

.action-button {
	flex: 1;
	height: 88rpx;
	border-radius: 44rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 28rpx;
	font-weight: 600;
	transition: all 0.3s ease;
	cursor: pointer;

	&:active {
		transform: scale(0.96);
	}

	.btn-text {
		margin-left: 6rpx;
	}
}

.reset-btn {
	background: linear-gradient(135deg, #f8f9fa, #e9ecef);
	color: #666;
	border: 2rpx solid #e0e3e6;

	&:active {
		background: linear-gradient(135deg, #e9ecef, #dee2e6);
	}
}

.apply-btn {
	background: linear-gradient(135deg, #409eff, #36a3ff);
	color: #fff;
	border: 2rpx solid #409eff;
	box-shadow: 0 8rpx 24rpx rgba(64, 158, 255, 0.3);

	&:active {
		background: linear-gradient(135deg, #2b7ce5, #1976d2);
	}
}

/* 响应式适配 */
@media (max-width: 750rpx) {
	.quick-filter-panel {
		width: 480rpx;
	}
}

@media (max-width: 600rpx) {
	.quick-filter-panel {
		width: 420rpx;
	}
}

/* 智能搜索样式 */
.smart-search-container {
	padding: 20rpx 24rpx;
	background: linear-gradient(135deg, #ffffff, #f8faff);
	display: flex;
	align-items: flex-start;
	border-radius: 20rpx;
	box-shadow: 0 8rpx 32rpx rgba(64, 158, 255, 0.12);
	margin-bottom: 20rpx;
	gap: 16rpx;
	border: 1rpx solid #e6f0ff;
	backdrop-filter: blur(10rpx);
	position: relative;
	z-index: 10;
}

.search-wrapper {
	flex: 1;
	position: relative;
}

.search-input-box {
	display: flex;
	align-items: center;
	background: #f5f7fa;
	border-radius: 50rpx;
	padding: 0 20rpx;
	height: 72rpx;
	border: 2rpx solid transparent;
	transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	position: relative;
	overflow: hidden;

	&.focused {
		background: #ffffff;
		border-color: #409eff;
		box-shadow: 0 8rpx 24rpx rgba(64, 158, 255, 0.15);
		transform: scale(1.02);
	}

	&.hasText {
		background: #ffffff;
		border-color: #e6f0ff;
	}
}

.search-input {
	flex: 1;
	font-size: 28rpx;
	color: #333;
	background: transparent;
	border: none;
	outline: none;
	padding-left: 20rpx;

	&::placeholder {
		color: #c0c4cc;
		font-size: 26rpx;
	}
}

.search-clear,
.search-voice {
	width: 36rpx;
	height: 36rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s ease;
	cursor: pointer;

	&:active {
		transform: scale(0.9);
		background: rgba(192, 196, 204, 0.1);
	}
}

.search-voice {
	background: linear-gradient(135deg, #f0f9ff, #e6f0ff);

	&:active {
		background: linear-gradient(135deg, #e6f0ff, #dce9ff);
	}
}

/* 搜索建议下拉框 */
.search-suggestions {
	position: absolute;
	top: 76rpx;
	left: 0;
	right: 0;
	background: #ffffff;
	border-radius: 16rpx;
	box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.1);
	border: 1rpx solid #e6f0ff;
	z-index: 100;
	overflow: hidden;
	max-height: 600rpx;
	backdrop-filter: blur(10rpx);
}

.suggestions-scroll {
	max-height: 540rpx;
}

.suggestion-item {
	display: flex;
	align-items: center;
	padding: 20rpx 24rpx;
	border-bottom: 1rpx solid #f5f7fa;
	transition: all 0.3s ease;
	cursor: pointer;

	&:last-child {
		border-bottom: none;
	}

	&:active {
		background: linear-gradient(135deg, #f0f9ff, #e8f4ff);
		transform: scale(0.98);
	}
}

.suggestion-icon {
	width: 40rpx;
	height: 40rpx;
	border-radius: 50%;
	background: #f5f7fa;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 16rpx;
	flex-shrink: 0;
}

.suggestion-content {
	flex: 1;

	.suggestion-text {
		display: block;
		font-size: 28rpx;
		color: #333;
		margin-bottom: 4rpx;
		line-height: 1.3;
	}

	.suggestion-type {
		font-size: 22rpx;
		color: #999;
	}
}

.suggestion-arrow {
	margin-left: 12rpx;
}

.suggestions-footer {
	padding: 16rpx 24rpx;
	background: #f8f9fa;
	border-top: 1rpx solid #f0f2f5;

	.footer-text {
		font-size: 22rpx;
		color: #666;
	}
}

/* 操作按钮组 */
.action-buttons {
	display: flex;
	align-items: center;
	gap: 12rpx;
	flex-shrink: 0;
}

.action-btn {
	min-width: 88rpx;
	height: 72rpx;
	border-radius: 36rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	cursor: pointer;
	position: relative;
	overflow: hidden;
	padding: 0 16rpx;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent);
		transform: translateX(-100%);
		transition: transform 0.6s ease;
	}

	&:active {
		transform: scale(0.9);
	}

	&:hover::before {
		transform: translateX(100%);
	}

	.btn-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2rpx;
	}

	.btn-label {
		font-size: 20rpx;
		font-weight: 500;
		line-height: 1;
		white-space: nowrap;
	}

	.icon-emoji {
		font-size: 24rpx;
		line-height: 1;
	}
}

.history-btn {
	background: linear-gradient(135deg, #fef8f0, #fdf2e9);
	border: 2rpx solid #f4d6ae;
	box-shadow: 0 4rpx 16rpx rgba(245, 166, 35, 0.15);

	&.active {
		background: linear-gradient(135deg, #fef2e4, #fce4c1);
		border-color: #f5a623;
		box-shadow: 0 6rpx 20rpx rgba(245, 166, 35, 0.25);
	}
}

.filter-btn {
	background: linear-gradient(135deg, #f0f9f4, #e8f5e8);
	border: 2rpx solid #b8e6b8;
	box-shadow: 0 4rpx 16rpx rgba(76, 175, 80, 0.15);

	&:active {
		background: linear-gradient(135deg, #e8f5e8, #d4edda);
		transform: scale(0.98);
	}
}

/* 搜索历史面板 */
.search-history-panel {
	margin: 20rpx 0;
	background: linear-gradient(135deg, #ffffff, #f8faff);
	border-radius: 20rpx;
	box-shadow: 0 8rpx 24rpx rgba(64, 158, 255, 0.08);
	border: 1rpx solid #e6f0ff;
	overflow: hidden;
}

.history-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 24rpx 32rpx;
	background: linear-gradient(135deg, #f0f9ff, #e6f0ff);
	border-bottom: 1rpx solid #f0f2f5;

	.header-title {
		display: flex;
		align-items: center;

		.title-text {
			font-size: 28rpx;
			color: #262626;
			font-weight: 600;
			margin-left: 6rpx;
		}
	}

	.clear-all {
		font-size: 24rpx;
		color: #666;
		padding: 8rpx 16rpx;
		border-radius: 16rpx;
		background: rgba(255, 255, 255, 0.8);
		transition: all 0.3s ease;
		cursor: pointer;

		&:active {
			background: rgba(245, 245, 245, 0.9);
			transform: scale(0.95);
		}
	}
}

.history-content {
	padding: 16rpx 0;
}

.history-item {
	display: flex;
	align-items: center;
	padding: 16rpx 32rpx;
	transition: all 0.3s ease;
	cursor: pointer;

	&:active {
		background: linear-gradient(135deg, #f0f9ff, #e8f4ff);
	}

	.history-icon {
		width: 36rpx;
		height: 36rpx;
		border-radius: 50%;
		background: #f5f7fa;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 16rpx;
		flex-shrink: 0;
	}

	.history-text {
		flex: 1;
		font-size: 26rpx;
		color: #333;
		margin-right: 16rpx;
	}

	.history-time {
		font-size: 20rpx;
		color: #999;
		margin-right: 16rpx;
	}

	.history-delete {
		width: 32rpx;
		height: 32rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;

		&:active {
			background: rgba(245, 34, 45, 0.1);
			transform: scale(0.9);
		}
	}
}

.history-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 80rpx 32rpx;

	.empty-text {
		font-size: 26rpx;
		color: #999;
		margin-top: 16rpx;
	}
}

/* 热门搜索标签 */
.hot-search-tags {
	margin: 20rpx 0;
	background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f8faff 100%);
	border-radius: 20rpx;
	padding: 24rpx;
	border: 1rpx solid #b3e5fc;
	box-shadow: 0 8rpx 24rpx rgba(3, 169, 244, 0.08);
	position: relative;
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(45deg, 
			rgba(3, 169, 244, 0.01) 0%, 
			rgba(33, 150, 243, 0.02) 50%, 
			rgba(25, 118, 210, 0.01) 100%);
		pointer-events: none;
		z-index: 0;
	}
}

.tags-header {
	display: flex;
	align-items: center;
	margin-bottom: 20rpx;
	position: relative;
	z-index: 1;

	.tags-title {
		font-size: 26rpx;
		color: #1976d2;
		font-weight: 600;
		margin-left: 6rpx;
		letter-spacing: 0.5rpx;
	}
}

.tags-container {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	position: relative;
	z-index: 1;
}

.hot-tag {
	display: flex;
	align-items: center;
	background: linear-gradient(135deg, #ffffff 0%, #f8fbff 100%);
	border: 1rpx solid #e3f2fd;
	border-radius: 24rpx;
	padding: 8rpx 16rpx;
	transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	cursor: pointer;
	position: relative;
	overflow: hidden;
	backdrop-filter: blur(10rpx);
	box-shadow: 0 4rpx 16rpx rgba(25, 118, 210, 0.08);

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(25, 118, 210, 0.1), transparent);
		transition: left 0.6s ease;
	}

	&:hover::before {
		left: 100%;
	}

	&:active {
		background: linear-gradient(135deg, #e3f2fd, #bbdefb);
		transform: scale(0.95);
		box-shadow: 0 2rpx 8rpx rgba(25, 118, 210, 0.15);
	}

	.tag-text {
		font-size: 24rpx;
		color: #1565c0;
		font-weight: 600;
		letter-spacing: 0.5rpx;
		position: relative;
		z-index: 2;
	}

	.tag-count {
		background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
		color: #ffffff;
		font-size: 18rpx;
		font-weight: 700;
		padding: 4rpx 10rpx;
		border-radius: 14rpx;
		margin-left: 8rpx;
		min-width: 32rpx;
		text-align: center;
		box-shadow: 0 4rpx 12rpx rgba(33, 150, 243, 0.3);
		position: relative;
		z-index: 2;
		border: 1rpx solid rgba(255, 255, 255, 0.2);
		text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.1);

		&::before {
			content: '';
			position: absolute;
			top: 1rpx;
			left: 1rpx;
			right: 1rpx;
			bottom: 1rpx;
			background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent);
			border-radius: 12rpx;
			pointer-events: none;
		}
	}
}

/* 图标emoji样式 */
.icon-emoji {
	font-size: 32rpx;
	line-height: 1;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s ease;
	vertical-align: middle;
	margin-right: 4rpx;
}



/* 操作按钮内的图标 */
.action-btn .icon-emoji {
	font-size: 30rpx;
}

/* 卡片内容的小图标 */
.info-cell .icon-emoji {
	font-size: 24rpx;
	margin-right: 8rpx;
}

/* 设置面板的图标 */
.section-header .icon-emoji {
	font-size: 28rpx;
}

/* 热门搜索标签图标 */
.tags-header .icon-emoji {
	font-size: 26rpx;
}

/* 响应式适配 */
@media (max-width: 750rpx) {
	.smart-search-container {
		padding: 16rpx 20rpx;
		gap: 12rpx;
	}

	.search-input-box {
		height: 64rpx;
		padding: 0 16rpx;
	}

	.action-btn {
		width: 64rpx;
		height: 64rpx;
	}

	.search-suggestions {
		max-height: 480rpx;
	}
}

/* 手势操作样式 */
.gesture-tips {
	margin: 8rpx 0;
	background: linear-gradient(135deg, #e8f4ff, #f0f8ff);
	border-radius: 12rpx;
	padding: 8rpx 16rpx;
	border: 1rpx solid #b3d8ff;
	animation: fadeInDown 0.5s ease;
}

.tips-content {
	display: flex;
	align-items: center;
	justify-content: space-between;

	.tips-text {
		flex: 1;
		font-size: 22rpx;
		color: #409eff;
		margin-left: 4rpx;
	}

	.tips-close {
		width: 28rpx;
		height: 28rpx;
		border-radius: 50%;
		background: rgba(192, 196, 204, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;

		&:active {
			background: rgba(192, 196, 204, 0.4);
			transform: scale(0.9);
		}
	}
}

/* 多选操作栏 */
.multi-select-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background: linear-gradient(135deg, #ffffff, #f8faff);
	border-top: 1rpx solid #e6f0ff;
	padding: 20rpx 24rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	z-index: 100;
	transform: translateY(100%);
	transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
	box-shadow: 0 -8rpx 24rpx rgba(64, 158, 255, 0.1);

	&.active {
		transform: translateY(0);
	}
}

.select-info {
	display: flex;
	flex-direction: column;

	.select-count {
		font-size: 28rpx;
		color: #333;
		font-weight: 600;
		margin-bottom: 4rpx;
	}

	.select-all {
		font-size: 22rpx;
		color: #409eff;
		cursor: pointer;

		&:active {
			opacity: 0.8;
		}
	}
}

.select-actions {
	display: flex;
	gap: 24rpx;

	.action-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6rpx;
		cursor: pointer;
		transition: all 0.3s ease;

		&:active {
			transform: scale(0.9);
		}

		.action-text {
			font-size: 20rpx;
			color: #666;
		}
	}
}

.select-close {
	width: 48rpx;
	height: 48rpx;
	border-radius: 50%;
	background: rgba(102, 102, 102, 0.1);
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s ease;

	&:active {
		background: rgba(102, 102, 102, 0.2);
		transform: scale(0.9);
	}
}

/* 列表项手势操作 */
.list-item {
	position: relative;
	overflow: hidden;

	&.multiSelectMode {
		margin-left: 60rpx; // 为复选框留出空间
	}

	&.selected {
		.multi-select-checkbox .checkbox-icon {
			background: #409eff;
			border-color: #409eff;
		}
	}
}

/* 简化的滑动操作样式 - 参考facility.vue */
/deep/ .u-swipe-action-item__right {
	height: 100%;
	display: flex;
	align-items: stretch;
}

/deep/ .u-swipe-action-item__right__button {
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s ease;
	position: relative;
	overflow: hidden;
	
	&:active {
		opacity: 0.8;
		transform: scale(0.98);
	}
}

/* 多选复选框 */
.multi-select-checkbox {
	position: absolute;
	top: 50%;
	left: 16rpx;
	transform: translateY(-50%);
	z-index: 10;
	cursor: pointer;

	.checkbox-icon {
		width: 44rpx;
		height: 44rpx;
		border-radius: 50%;
		border: 3rpx solid #ddd;
		background: #ffffff;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);

		&.checked {
			background: #409eff;
			border-color: #409eff;
			transform: scale(1.1);
		}
	}
}

/* 卡片容器 */
.card-container {
	transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
	position: relative;
	z-index: 2;
}

/* 动画效果 */
@keyframes fadeInDown {
	from {
		opacity: 0;
		transform: translateY(-20rpx);
	}

	to {
		opacity: 1;
		transform: translateY(0);
	}
}

/* 手势提示闪烁动画 */
.gesture-tips {
	animation: fadeInDown 0.5s ease, pulseGlow 3s infinite 2s;
}

@keyframes pulseGlow {

	0%,
	100% {
		box-shadow: 0 4rpx 16rpx rgba(255, 214, 102, 0.1);
	}

	50% {
		box-shadow: 0 8rpx 32rpx rgba(64, 158, 255, 0.2);
	}
}

/* ==================== 精简版卡片样式 ==================== */
.simplified-card {
	background: linear-gradient(135deg, #ffffff 0%, #f8fbff 100%);
	border-radius: 20rpx;
	padding: 24rpx;
	margin: 16rpx 0;
	box-shadow: 
		0 8rpx 32rpx rgba(64, 158, 255, 0.08),
		0 2rpx 8rpx rgba(64, 158, 255, 0.04);
	border: 1rpx solid rgba(64, 158, 255, 0.08);
	overflow: hidden;
	min-height: 200rpx;
	position: relative;
	transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

	&:hover {
		transform: translateY(-4rpx);
		box-shadow: 
			0 16rpx 48rpx rgba(64, 158, 255, 0.12),
			0 4rpx 16rpx rgba(64, 158, 255, 0.08);
		border-color: rgba(64, 158, 255, 0.15);
	}

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba(64, 158, 255, 0.01), rgba(103, 194, 58, 0.01));
		pointer-events: none;
		z-index: 0;
	}
}

.card-content {
	display: flex;
	width: 100%;
	gap: 24rpx;
	min-height: 160rpx;
	align-items: stretch;
	position: relative;
	z-index: 1;
}

/* Left content area */
.left-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

/* Appointment type icon */
.type-icon {
	display: flex;
	align-items: center;
	gap: 10rpx;
	padding: 8rpx 16rpx;
	background: linear-gradient(135deg, rgba(64, 158, 255, 0.08), rgba(64, 158, 255, 0.04));
	border-radius: 20rpx;
	border: 1rpx solid rgba(64, 158, 255, 0.15);
	align-self: flex-start;

	.type-text {
		font-size: 22rpx;
		color: #409eff;
		font-weight: 600;
		letter-spacing: 0.5rpx;
	}
}

/* License plate row */
.plate-row {
	display: flex;
	align-items: center;
	gap: 12rpx;

	.plate-text {
		font-size: 34rpx;
		font-weight: 800;
		letter-spacing: 3rpx;
		padding: 12rpx 24rpx;
		border-radius: 12rpx;
		font-family: "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif;
		text-align: center;
		position: relative;
		overflow: hidden;
		transition: all 0.3s ease;

		&::before {
			content: '';
			position: absolute;
			top: 0;
			left: -100%;
			width: 100%;
			height: 100%;
			background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
			transition: left 0.8s ease;
		}

		&:hover::before {
			left: 100%;
		}

		&.blue-plate {
			background: linear-gradient(180deg, #0C4FC5 0%, #216FEF 100%);
			color: #FFFFFF;
			border: 2rpx solid #0C4FC5;
			box-shadow: 
				0 8rpx 24rpx rgba(12, 79, 197, 0.4),
				0 2rpx 8rpx rgba(12, 79, 197, 0.2),
				inset 0 1rpx 0 rgba(255, 255, 255, 0.2);

			&::after {
				content: '';
				position: absolute;
				top: 3rpx;
				left: 3rpx;
				right: 3rpx;
				bottom: 3rpx;
				border: 1rpx solid rgba(255, 255, 255, 0.15);
				border-radius: 9rpx;
			}
		}

		&.green-plate {
			background: linear-gradient(180deg, #6AD390 0%, #D0F1E4 100%);
			color: #000000;
			border: 2rpx solid #4CAF50;
			box-shadow: 
				0 8rpx 24rpx rgba(106, 211, 144, 0.4),
				0 2rpx 8rpx rgba(106, 211, 144, 0.2),
				inset 0 1rpx 0 rgba(255, 255, 255, 0.3);

			&::after {
				content: '';
				position: absolute;
				top: 3rpx;
				left: 3rpx;
				right: 3rpx;
				bottom: 3rpx;
				border: 1rpx solid rgba(255, 255, 255, 0.2);
				border-radius: 9rpx;
			}
		}
	}
}

/* Contact information row */
.contact-row {
	display: flex;
	gap: 32rpx;
	flex-wrap: wrap;

	.contact-item {
		display: flex;
		align-items: center;
		gap: 8rpx;
		padding: 8rpx 12rpx;
		background: rgba(64, 158, 255, 0.04);
		border-radius: 16rpx;
		border: 1rpx solid rgba(64, 158, 255, 0.08);

		.contact-text {
			font-size: 26rpx;
			color: #333;
			font-weight: 500;
		}
	}
}

/* Address information row */
.address-row {
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding: 8rpx 12rpx;
	background: rgba(102, 102, 102, 0.04);
	border-radius: 12rpx;

	.address-text {
		font-size: 24rpx;
		color: #666;
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		line-height: 1.4;
	}
}

/* Right content area - vertical layout */
.right-content {
	display: flex !important;
	flex-direction: column !important;
	align-items: flex-end !important;
	justify-content: flex-start !important;
	min-width: 160rpx;
	gap: 16rpx;
	height: 100%;
	padding-top: 12rpx;
}

/* Time information row */
.time-info {
	display: block !important;
	width: 100% !important;
	text-align: right !important;
	margin-bottom: 12rpx !important;
	padding: 8rpx 12rpx;
	background: rgba(102, 102, 102, 0.06);
	border-radius: 16rpx;
	backdrop-filter: blur(5rpx);

	.time-text {
		font-size: 22rpx;
		color: #666;
		font-weight: 500;
		display: inline-block;
		letter-spacing: 0.5rpx;
	}
}

/* Status information row */
.status-info {
	display: block !important;
	width: 100% !important;
	text-align: right !important;
	padding: 6rpx 0;

	.status-tag {
		display: inline-flex;
		align-items: center;
		gap: 6rpx;
		padding: 8rpx 16rpx;
		border-radius: 20rpx;
		font-size: 20rpx;
		font-weight: 600;
		letter-spacing: 0.5rpx;
		backdrop-filter: blur(5rpx);
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
		border: 1rpx solid transparent;
		transition: all 0.3s ease;

		.status-icon {
			font-size: 18rpx;
		}

		.status-text {
			font-size: 20rpx;
			line-height: 1;
		}

		&.status-pending {
			background: linear-gradient(135deg, #FFF4E6 0%, #FFE7BA 100%);
			color: #E6A23C;
			border-color: rgba(230, 162, 60, 0.2);
			box-shadow: 0 4rpx 16rpx rgba(230, 162, 60, 0.2);
		}

		&.status-approved {
			background: linear-gradient(135deg, #F0F9FF 0%, #E6F7FF 100%);
			color: #52C41A;
			border-color: rgba(82, 196, 26, 0.2);
			box-shadow: 0 4rpx 16rpx rgba(82, 196, 26, 0.2);
		}

		&.status-rejected {
			background: linear-gradient(135deg, #FFF1F0 0%, #FFCCC7 100%);
			color: #FF4D4F;
			border-color: rgba(255, 77, 79, 0.2);
			box-shadow: 0 4rpx 16rpx rgba(255, 77, 79, 0.2);
		}

		&.status-unknown {
			background: linear-gradient(135deg, #F5F5F5 0%, #E8E8E8 100%);
			color: #8C8C8C;
			border-color: rgba(140, 140, 140, 0.2);
			box-shadow: 0 4rpx 16rpx rgba(140, 140, 140, 0.2);
		}
	}
}

/* Today appointment special animation */
.simplified-card.today-card .plate-text {
	animation: pulse-today 2s infinite;
}

@keyframes pulse-today {
	0%, 100% {
		transform: scale(1);
		box-shadow: 0 6rpx 16rpx rgba(25, 118, 210, 0.3);
	}
	50% {
		transform: scale(1.02);
		box-shadow: 0 8rpx 20rpx rgba(255, 107, 53, 0.4);
	}
}



/* Responsive adaptation */
@media (max-width: 750rpx) {
	.multi-select-bar {
		padding: 16rpx 20rpx;
	}

	.select-actions {
		gap: 16rpx;
	}

	.multi-select-checkbox .checkbox-icon {
		width: 40rpx;
		height: 40rpx;
	}

	.gesture-tips {
		margin: 6rpx 0;
		padding: 6rpx 12rpx;

		.tips-content .tips-text {
			font-size: 20rpx;
		}
	}

	.approval-tips {
		margin: 8rpx 0;
		padding: 12rpx 16rpx;

		.tips-title {
			font-size: 24rpx;
		}

		.tip-item {
			font-size: 20rpx;
		}
	}

	/* Small screen card adaptation */
	.simplified-card {
		min-height: 160rpx; /* Slightly compressed for small screens */
		padding: 16rpx;
	}

	.card-content {
		gap: 16rpx;
	}

	.left-content {
		gap: 10rpx;
	}

	.right-content {
		min-width: 140rpx;
		gap: 12rpx;
	}

	.status-info .status-tag {
		padding: 6rpx 12rpx;
		font-size: 18rpx;

		.status-icon {
			font-size: 16rpx;
		}

		.status-text {
			font-size: 18rpx;
		}
	}

	.plate-row .plate-text {
		font-size: 28rpx;
		padding: 6rpx 16rpx;
	}

	.contact-row {
		gap: 24rpx;

		.contact-text {
			font-size: 24rpx;
		}
	}

	.address-row .address-text {
		font-size: 22rpx;
	}
}



/* ==================== Data Visualization Panel Styles ==================== */
.data-visualization-panel {
	margin: 24rpx 0;
	background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
	border-radius: 24rpx;
	padding: 28rpx;
	box-shadow: 0 12rpx 48rpx rgba(114, 46, 209, 0.1);
	border: 2rpx solid #f0e6ff;
	position: relative;
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4rpx;
		background: linear-gradient(90deg, #722ed1 0%, #13c2c2 25%, #fa8c16 50%, #52c41a 75%, #f5222d 100%);
	}
}

.visualization-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24rpx;

	.header-title {
		display: flex;
		align-items: center;

		.title-text {
			font-size: 28rpx;
			color: #722ed1;
			font-weight: 700;
			margin-left: 8rpx;
		}
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 12rpx;
	}
}

.view-mode-toggle {
	display: flex;
	background: rgba(255, 255, 255, 0.8);
	border-radius: 20rpx;
	padding: 4rpx;
	border: 1rpx solid #e0e3e6;

	.mode-btn {
		width: 60rpx;
		height: 48rpx;
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
		cursor: pointer;

		&:active {
			transform: scale(0.9);
		}

		&.active {
			background: linear-gradient(135deg, #722ed1, #9254de);
			box-shadow: 0 4rpx 12rpx rgba(114, 46, 209, 0.3);

			/deep/ .u-icon {
				color: #ffffff !important;
			}
		}
	}
}

.collapse-btn {
	width: 48rpx;
	height: 48rpx;
	border-radius: 50%;
	background: rgba(102, 102, 102, 0.1);
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s ease;
	cursor: pointer;

	&:active {
		background: rgba(102, 102, 102, 0.2);
		transform: scale(0.9);
	}
}

/* New chart styles */
.chart-item {
	background: rgba(255, 255, 255, 0.9);
	border-radius: 16rpx;
	padding: 24rpx;
	border: 1rpx solid #f0f2f5;
	backdrop-filter: blur(5rpx);
	margin-bottom: 20rpx;

	&.full-width {
		width: 100%;
	}

	.chart-title {
		font-size: 28rpx;
		color: #333;
		font-weight: 600;
		margin-bottom: 20rpx;
		text-align: left;
		display: flex;
		align-items: center;
	}
}

/* Simple bar chart styles */
.simple-bar-chart {
	.bar-item {
		margin-bottom: 20rpx;

		&:last-child {
			margin-bottom: 0;
		}
	}

	.bar-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8rpx;

		.bar-label {
			font-size: 26rpx;
			color: #333;
			font-weight: 500;
		}

		.bar-number {
			font-size: 28rpx;
			color: #409eff;
			font-weight: 700;
		}
	}

	.bar-track {
		height: 16rpx;
		background: #f0f2f5;
		border-radius: 8rpx;
		overflow: hidden;
		position: relative;
	}

	.bar-fill {
		height: 100%;
		border-radius: 8rpx;
		transition: width 1s ease-out;
		position: relative;

		&::after {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
			animation: bar-shine 2s infinite;
			border-radius: 8rpx;
		}

		&.pending-fill {
			background: linear-gradient(90deg, #667eea, #764ba2);
			box-shadow: 0 4rpx 16rpx rgba(102, 126, 234, 0.3);
		}

		&.approved-fill {
			background: linear-gradient(90deg, #11998e, #38ef7d);
			box-shadow: 0 4rpx 16rpx rgba(17, 153, 142, 0.3);
		}

		&.rejected-fill {
			background: linear-gradient(90deg, #fc466b, #3f5efb);
			box-shadow: 0 4rpx 16rpx rgba(252, 70, 107, 0.3);
		}

		&.entered-fill {
			background: linear-gradient(90deg, #56ab2f, #a8e6cf);
			box-shadow: 0 4rpx 16rpx rgba(86, 171, 47, 0.3);
		}

		&.exited-fill {
			background: linear-gradient(90deg, #ff9a9e, #fecfef);
			box-shadow: 0 4rpx 16rpx rgba(255, 154, 158, 0.3);
		}

		&.unentered-fill {
			background: linear-gradient(90deg, #74b9ff, #0984e3);
			box-shadow: 0 4rpx 16rpx rgba(116, 185, 255, 0.3);
		}
	}
}

@keyframes bar-shine {
	0% {
		transform: translateX(-100%);
	}

	100% {
		transform: translateX(200%);
	}
}

/* ==================== New Chart Styles ==================== */

/* Pie chart styles */
.pie-chart-container {
	display: flex;
	align-items: center;
	gap: 32rpx;

	.pie-chart {
		flex: 1;
		display: flex;
		justify-content: center;

		.pie-svg-container {
			position: relative;
			width: 160rpx;
			height: 160rpx;
			border-radius: 50%;
			background: conic-gradient(from 0deg,
					#667eea 0deg var(--pending-end, 120deg),
					#11998e var(--pending-end, 120deg) var(--approved-end, 240deg),
					#fc466b var(--approved-end, 240deg) 360deg);
			box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);

			.pie-center {
				position: absolute;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				width: 80rpx;
				height: 80rpx;
				background: #fff;
				border-radius: 50%;
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				box-shadow: inset 0 2rpx 8rpx rgba(0, 0, 0, 0.1);

				.center-number {
					font-size: 28rpx;
					font-weight: bold;
					color: #333;
					line-height: 1;
				}

				.center-label {
					font-size: 18rpx;
					color: #666;
					margin-top: 4rpx;
				}
			}
		}
	}

	.pie-legend {
		flex: 1;

		.legend-item {
			display: flex;
			align-items: center;
			margin-bottom: 16rpx;

			.legend-dot {
				width: 16rpx;
				height: 16rpx;
				border-radius: 50%;
				margin-right: 12rpx;

				&.pending-dot {
					background: linear-gradient(135deg, #667eea, #764ba2);
					box-shadow: 0 2rpx 8rpx rgba(102, 126, 234, 0.4);
				}

				&.approved-dot {
					background: linear-gradient(135deg, #11998e, #38ef7d);
					box-shadow: 0 2rpx 8rpx rgba(17, 153, 142, 0.4);
				}

				&.rejected-dot {
					background: linear-gradient(135deg, #fc466b, #3f5efb);
					box-shadow: 0 2rpx 8rpx rgba(252, 70, 107, 0.4);
				}
			}

			.legend-text {
				font-size: 24rpx;
				color: #333;
			}
		}
	}
}

/* Vertical bar chart styles */
.vertical-bar-chart {
	position: relative;

	.bars-container {
		display: flex;
		align-items: flex-end;
		justify-content: space-around;
		height: 200rpx;
		padding: 0 20rpx;
		margin-bottom: 16rpx;

		.bar-column {
			display: flex;
			flex-direction: column;
			align-items: center;
			flex: 1;

			.bar-wrapper {
				height: 160rpx;
				display: flex;
				align-items: flex-end;
				width: 60rpx;

				.vertical-bar {
					width: 100%;
					border-radius: 8rpx 8rpx 0 0;
					position: relative;
					display: flex;
					align-items: flex-start;
					justify-content: center;
					padding-top: 8rpx;
					transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
					animation: barGrow 1s ease-out;

					&.entered-bar {
						background: linear-gradient(to top, #56ab2f, #a8e6cf);
						box-shadow: 0 4rpx 12rpx rgba(86, 171, 47, 0.4);
					}

					&.exited-bar {
						background: linear-gradient(to top, #ff9a9e, #fecfef);
						box-shadow: 0 4rpx 12rpx rgba(255, 154, 158, 0.4);
					}

					&.unentered-bar {
						background: linear-gradient(to top, #74b9ff, #ddd6fe);
						box-shadow: 0 4rpx 12rpx rgba(116, 185, 255, 0.4);
					}

					.bar-value {
						font-size: 20rpx;
						font-weight: bold;
						color: #fff;
						text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.3);
					}
				}
			}

			.bar-label {
				font-size: 20rpx;
				color: #666;
				margin-top: 12rpx;
				text-align: center;
			}
		}
	}

	.y-axis {
		position: absolute;
		left: 0;
		top: 0;
		height: 160rpx;
		display: flex;
		flex-direction: column;
		justify-content: space-between;

		.y-label {
			font-size: 18rpx;
			color: #999;
			line-height: 1;
		}
	}
}



/* Animation effects */
@keyframes barGrow {
	from {
		height: 0;
	}

	to {
		height: var(--final-height, 100%);
	}
}



/* Simple line chart styles */
.simple-line-chart {
	.line-chart-container {
		position: relative;
		height: 200rpx;
		background: linear-gradient(to top, #f8f9fa 0%, transparent 20%);
		border-radius: 8rpx;
		margin-bottom: 16rpx;
	}

	.chart-grid {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;

		.grid-line {
			position: absolute;
			left: 0;
			right: 0;
			height: 1rpx;
			background: #e6e8eb;

			&:nth-child(1) {
				top: 20%;
			}

			&:nth-child(2) {
				top: 40%;
			}

			&:nth-child(3) {
				top: 60%;
			}

			&:nth-child(4) {
				top: 80%;
			}

			&:nth-child(5) {
				bottom: 0;
			}
		}
	}

	.line-path {
		position: relative;
		height: 160rpx;
	}

	.line-point {
		position: absolute;
		transform: translateX(-50%);
		cursor: pointer;

		.point-dot {
			width: 16rpx;
			height: 16rpx;
			border-radius: 50%;
			background: linear-gradient(135deg, #409eff, #36a3ff);
			border: 3rpx solid #ffffff;
			box-shadow: 0 4rpx 12rpx rgba(64, 158, 255, 0.3);
			transition: all 0.3s ease;

			&:hover {
				transform: scale(1.2);
			}
		}

		.point-label {
			position: absolute;
			top: -32rpx;
			left: 50%;
			transform: translateX(-50%);
			font-size: 20rpx;
			color: #333;
			background: rgba(255, 255, 255, 0.9);
			padding: 4rpx 8rpx;
			border-radius: 8rpx;
			border: 1rpx solid #e0e3e6;
			white-space: nowrap;
		}
	}

	.chart-x-labels {
		display: flex;
		justify-content: space-between;
		padding: 0 16rpx;

		.x-label {
			font-size: 20rpx;
			color: #666;
			flex: 1;
			text-align: center;
		}
	}
}

/* Comparison chart styles */
.comparison-chart {
	.comparison-item {
		margin-bottom: 20rpx;
	}

	.comparison-header {
		margin-bottom: 16rpx;

		.comparison-title {
			font-size: 24rpx;
			color: #666;
			font-weight: 500;
		}
	}

	.comparison-bars {
		margin-bottom: 16rpx;
	}

	.comparison-bar {
		display: flex;
		align-items: center;
		margin-bottom: 12rpx;

		&:last-child {
			margin-bottom: 0;
		}

		.bar-label {
			width: 120rpx;
			font-size: 24rpx;
			color: #333;
			font-weight: 500;
		}

		.bar-container {
			flex: 1;
			height: 32rpx;
			background: #f0f2f5;
			border-radius: 16rpx;
			position: relative;
			overflow: hidden;
			margin: 0 16rpx;

			.bar-fill {
				height: 100%;
				border-radius: 16rpx;
				transition: width 1s ease-out;
				position: relative;

				&.today-fill {
					background: linear-gradient(90deg, #409eff, #69c0ff);
				}

				&.yesterday-fill {
					background: linear-gradient(90deg, #909399, #c0c4cc);
				}
			}

			.bar-text {
				position: absolute;
				right: 12rpx;
				top: 50%;
				transform: translateY(-50%);
				font-size: 20rpx;
				color: #333;
				font-weight: 600;
				z-index: 2;
			}
		}
	}

	.comparison-summary {
		text-align: center;
		padding: 16rpx;
		background: #f8f9fa;
		border-radius: 12rpx;
		border: 1rpx solid #e0e3e6;

		.summary-text {
			font-size: 24rpx;
			color: #409eff;
			font-weight: 600;
		}
	}
}

/* Ring chart */
.ring-chart {
	display: flex;
	justify-content: center;
	margin-bottom: 16rpx;
}

.ring-progress {
	position: relative;
	width: 200rpx;
	height: 200rpx;
}

.progress-ring {
	width: 100%;
	height: 100%;
	position: relative;
	border-radius: 50%;
	background: conic-gradient(var(--color, #fa8c16) 0deg var(--progress, 0%),
			#f0f2f5 var(--progress, 0%) 360deg);
	transform: rotate(-90deg);

	&::before {
		content: '';
		position: absolute;
		top: 20rpx;
		left: 20rpx;
		right: 20rpx;
		bottom: 20rpx;
		background: #ffffff;
		border-radius: 50%;
	}
}

.ring-center {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	text-align: center;
	z-index: 2;

	.center-number {
		display: block;
		font-size: 32rpx;
		font-weight: 800;
		color: #333;
		line-height: 1;
	}

	.center-label {
		display: block;
		font-size: 20rpx;
		color: #666;
		margin-top: 4rpx;
	}
}

.chart-legend {
	display: flex;
	flex-direction: column;
	gap: 8rpx;

	.legend-item {
		display: flex;
		align-items: center;

		.legend-dot {
			width: 16rpx;
			height: 16rpx;
			border-radius: 50%;
			margin-right: 8rpx;

			&.pending-dot {
				background: linear-gradient(135deg, #667eea, #764ba2);
				box-shadow: 0 2rpx 6rpx rgba(102, 126, 234, 0.3);
			}

			&.approved-dot {
				background: linear-gradient(135deg, #11998e, #38ef7d);
				box-shadow: 0 2rpx 6rpx rgba(17, 153, 142, 0.3);
			}

			&.rejected-dot {
				background: linear-gradient(135deg, #fc466b, #3f5efb);
				box-shadow: 0 2rpx 6rpx rgba(252, 70, 107, 0.3);
			}
		}

		.legend-text {
			font-size: 20rpx;
			color: #666;
		}
	}
}

/* Bar chart */
.bar-chart {
	height: 200rpx;
	display: flex;
	align-items: end;
	justify-content: center;
}

.bar-container {
	display: flex;
	gap: 16rpx;
	align-items: end;
	height: 160rpx;
}

.bar-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	min-width: 60rpx;

	.bar-fill {
		width: 32rpx;
		border-radius: 16rpx 16rpx 0 0;
		transition: height 1s ease-out;
		margin-bottom: 8rpx;
		position: relative;

		&::after {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			height: 4rpx;
			background: rgba(255, 255, 255, 0.3);
			border-radius: 2rpx;
		}

		&.entered-bar {
			background: linear-gradient(to top, #52c41a, #73d13d);
		}

		&.exited-bar {
			background: linear-gradient(to top, #fa8c16, #ffc53d);
		}

		&.unentered-bar {
			background: linear-gradient(to top, #409eff, #69c0ff);
		}
	}

	.bar-label {
		font-size: 18rpx;
		color: #666;
		margin-bottom: 4rpx;
	}

	.bar-value {
		font-size: 20rpx;
		color: #333;
		font-weight: 600;
	}
}

/* Trend analysis */
.trend-analysis {
	background: rgba(255, 255, 255, 0.9);
	border-radius: 16rpx;
	padding: 20rpx;
	border: 1rpx solid #f0f2f5;

	.trend-title {
		font-size: 24rpx;
		color: #333;
		font-weight: 600;
		margin-bottom: 16rpx;
	}
}

.trend-chart {
	position: relative;
	height: 200rpx;
	background: linear-gradient(to top, #f8f9fa 0%, transparent 20%);
	border-radius: 8rpx;
	margin-bottom: 16rpx;
}

.trend-line {
	position: relative;
	height: 160rpx;

	&::before {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 1rpx;
		background: #e0e3e6;
	}
}

.line-point {
	position: absolute;
	transform: translateX(-50%);
	cursor: pointer;

	.point-dot {
		width: 16rpx;
		height: 16rpx;
		border-radius: 50%;
		border: 3rpx solid #ffffff;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);

		&.normal {
			background: #409eff;
		}

		&.high {
			background: #fa8c16;
		}

		&.low {
			background: #52c41a;
		}

		&.peak {
			background: #f5222d;
			animation: pulse-peak 2s infinite;
		}
	}

	.point-value {
		position: absolute;
		top: -32rpx;
		left: 50%;
		transform: translateX(-50%);
		font-size: 18rpx;
		color: #333;
		background: rgba(255, 255, 255, 0.9);
		padding: 2rpx 8rpx;
		border-radius: 8rpx;
		border: 1rpx solid #e0e3e6;
	}
}

@keyframes pulse-peak {

	0%,
	100% {
		transform: scale(1);
	}

	50% {
		transform: scale(1.2);
	}
}

.trend-labels {
	display: flex;
	justify-content: space-between;
	padding: 0 16rpx;

	.label {
		font-size: 18rpx;
		color: #666;
	}
}

/* Timeline view */
.timeline-section {
	background: rgba(255, 255, 255, 0.9);
	border-radius: 16rpx;
	padding: 20rpx;
	border: 1rpx solid #f0f2f5;

	.timeline-title {
		font-size: 24rpx;
		color: #333;
		font-weight: 600;
		margin-bottom: 16rpx;
	}
}

.timeline-scroll {
	max-height: 400rpx;
}

.timeline-container {
	position: relative;

	&::before {
		content: '';
		position: absolute;
		left: 24rpx;
		top: 0;
		bottom: 0;
		width: 2rpx;
		background: #e0e3e6;
	}
}

.timeline-item {
	position: relative;
	padding: 16rpx 0 16rpx 60rpx;

	.timeline-dot {
		position: absolute;
		left: 16rpx;
		top: 20rpx;
		width: 16rpx;
		height: 16rpx;
		border-radius: 50%;
		border: 3rpx solid #ffffff;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
	}

	&.approved .timeline-dot {
		background: #52c41a;
	}

	&.urgent .timeline-dot {
		background: #fa8c16;
		animation: pulse-urgent 2s infinite;
	}

	&.sync .timeline-dot {
		background: #409eff;
	}

	&.update .timeline-dot {
		background: #722ed1;
	}

	&.error .timeline-dot {
		background: #f5222d;
	}

	.timeline-content {
		.event-time {
			font-size: 20rpx;
			color: #666;
			margin-bottom: 4rpx;
		}

		.event-title {
			font-size: 24rpx;
			color: #333;
			font-weight: 600;
			margin-bottom: 4rpx;
		}

		.event-desc {
			font-size: 22rpx;
			color: #666;
			line-height: 1.4;
		}
	}
}

/* Heatmap view */
.heatmap-section {
	background: rgba(255, 255, 255, 0.9);
	border-radius: 16rpx;
	padding: 20rpx;
	border: 1rpx solid #f0f2f5;

	.heatmap-title {
		font-size: 24rpx;
		color: #333;
		font-weight: 600;
		margin-bottom: 16rpx;
	}
}

.heatmap-container {
	overflow-x: auto;
}

.time-labels {
	display: flex;
	gap: 4rpx;
	margin-bottom: 8rpx;
	padding-left: 80rpx;

	.time-label {
		width: 24rpx;
		font-size: 16rpx;
		color: #666;
		text-align: center;
	}
}

.heatmap-grid {
	display: flex;
	flex-direction: column;
	gap: 4rpx;
}

.heatmap-row {
	display: flex;
	align-items: center;
	gap: 8rpx;

	.day-label {
		width: 72rpx;
		font-size: 20rpx;
		color: #333;
		text-align: right;
	}
}

.heat-cells {
	display: flex;
	gap: 4rpx;

	.heat-cell {
		width: 24rpx;
		height: 24rpx;
		border-radius: 4rpx;
		cursor: pointer;
		transition: all 0.3s ease;

		&:hover {
			transform: scale(1.2);
			box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
		}

		&.heat-0 {
			background: #f0f2f5;
		}

		&.heat-1 {
			background: #d6e7ff;
		}

		&.heat-2 {
			background: #adc6ff;
		}

		&.heat-3 {
			background: #85a5ff;
		}

		&.heat-4 {
			background: #597ef7;
		}
	}
}

.heatmap-legend {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8rpx;
	margin-top: 16rpx;

	.legend-label {
		font-size: 18rpx;
		color: #666;
	}

	.legend-colors {
		display: flex;
		gap: 4rpx;

		.legend-cell {
			width: 16rpx;
			height: 16rpx;
			border-radius: 2rpx;
		}
	}
}

/* Data visualization toggle button */
.data-viz-toggle {
	margin: 16rpx 0;
	background: linear-gradient(135deg, #f0e6ff, #faf0ff);
	border: 1rpx solid #d9d2e9;
	border-radius: 20rpx;
	padding: 16rpx 24rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8rpx;
	transition: all 0.3s ease;
	cursor: pointer;

	&:active {
		transform: scale(0.98);
		background: linear-gradient(135deg, #e6d7ff, #f0e6ff);
	}

	.toggle-text {
		font-size: 26rpx;
		color: #722ed1;
		font-weight: 600;
	}
}

/* Detail popup styles */
.detail-popup {
	display: flex;
	flex-direction: column;
	height: 100%;
	background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
	border-radius: 20rpx;
	overflow: hidden;
}

.detail-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx 16rpx 16rpx;
	background: linear-gradient(135deg, #f0f9ff, #e6f0ff);
	border-bottom: 1rpx solid #e0e6ed;
}

.detail-title {
	font-size: 28rpx;
	color: #262626;
	font-weight: 700;
}

.detail-close {
	width: 40rpx;
	height: 40rpx;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.8);
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s ease;

	&:active {
		transform: scale(0.9);
		background: rgba(245, 245, 245, 0.9);
	}
}

.detail-content {
	flex: 1;
	padding: 16rpx 12rpx;
	overflow-y: auto;
}

.detail-section {
	margin-bottom: 20rpx;

	&:last-child {
		margin-bottom: 0;
	}

	.section-title {
		font-size: 22rpx;
		color: #333;
		font-weight: 600;
		margin-bottom: 10rpx;
		padding-left: 8rpx;
		border-left: 3rpx solid #409eff;
		background: rgba(64, 158, 255, 0.05);
		padding: 6rpx 10rpx;
		border-radius: 6rpx;
	}
}

.info-card {
	background: #ffffff;
	border-radius: 10rpx;
	padding: 14rpx;
	box-shadow: 0 2rpx 8rpx rgba(64, 158, 255, 0.08);
	border: 1rpx solid rgba(64, 158, 255, 0.06);
}

.info-row {
	display: flex;
	margin-bottom: 12rpx;
	min-height: 36rpx;
	align-items: flex-start;

	&:last-child {
		margin-bottom: 0;
	}

	.info-label {
		font-size: 22rpx;
		color: #666;
		font-weight: 500;
		min-width: 140rpx;
		flex-shrink: 0;
		line-height: 1.4;
	}

	.info-value {
		font-size: 22rpx;
		color: #333;
		font-weight: 500;
		flex: 1;
		line-height: 1.4;
		word-break: break-all;

		&.status-pending {
			color: #fa8c16;
		}

		&.status-approved {
			color: #52c41a;
		}

		&.status-rejected {
			color: #f5222d;
		}

		&.vehicle-status-entered {
			color: #52c41a;
		}

		&.vehicle-status-exited {
			color: #fa8c16;
		}

		&.vehicle-status-not-entered {
			color: #409eff;
		}
	}
}

/* Timeline styles */
.timeline {
	margin-top: 16rpx;
	padding: 16rpx;
	background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%);
	border-radius: 10rpx;
	border: 1rpx solid #e0e3e6;
}

.timeline-title {
	font-size: 22rpx;
	color: #666;
	margin-bottom: 10rpx;
	font-weight: 600;
}

.timeline-line {
	font-size: 16rpx;
	color: #409eff;
	margin-bottom: 12rpx;
	text-align: center;
	letter-spacing: 1rpx;
}

.timeline-item {
	display: flex;
	margin-bottom: 10rpx;

	&:last-child {
		margin-bottom: 0;
	}

	.timeline-label {
		font-size: 22rpx;
		color: #666;
		min-width: 140rpx;
		flex-shrink: 0;
	}

	.timeline-value {
		font-size: 22rpx;
		color: #333;
		font-weight: 500;
		flex: 1;
	}
}

/* Bottom action buttons */
.detail-actions {
	display: flex;
	gap: 12rpx;
	padding: 16rpx 12rpx;
	background: #fafbfc;
	border-top: 1rpx solid #f0f2f5;
}

.action-btn {
	flex: 1;
	height: 76rpx;
	border-radius: 38rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6rpx;
	transition: all 0.3s ease;
	cursor: pointer;

	&:active {
		transform: scale(0.96);
	}

	.btn-icon {
		font-size: 24rpx;
	}

	.btn-text {
		font-size: 24rpx;
		font-weight: 600;
	}
}

.share-btn {
	background: linear-gradient(135deg, #fa8c16, #ffc53d);
	color: #ffffff;
	box-shadow: 0 8rpx 24rpx rgba(250, 140, 22, 0.3);

	&:active {
		background: linear-gradient(135deg, #d46b08, #fa8c16);
	}
}

.note-btn {
	background: linear-gradient(135deg, #722ed1, #9254de);
	color: #ffffff;
	box-shadow: 0 8rpx 24rpx rgba(114, 46, 209, 0.3);

	&:active {
		background: linear-gradient(135deg, #531dab, #722ed1);
	}
}

/* Mobile screen responsive adaptation */
@media (max-width: 750rpx) {
	.detail-popup {
		.detail-header {
			padding: 16rpx 12rpx 12rpx;
			
			.detail-title {
				font-size: 26rpx;
			}
		}
		
		.detail-content {
			padding: 12rpx 8rpx;
		}
		
		.detail-section {
			margin-bottom: 16rpx;
			
			.section-title {
				font-size: 20rpx;
				padding: 4rpx 8rpx;
				margin-bottom: 8rpx;
			}
		}
		
		.info-card {
			padding: 12rpx;
		}
		
		.info-row {
			margin-bottom: 10rpx;
			
			.info-label {
				font-size: 20rpx;
				min-width: 100rpx;
			}
			
			.info-value {
				font-size: 20rpx;
			}
		}
		
		.timeline {
			padding: 12rpx;
			
			.timeline-title {
				font-size: 20rpx;
			}
			
			.timeline-item {
				.timeline-label {
					font-size: 20rpx;
					min-width: 100rpx;
				}
				
				.timeline-value {
					font-size: 20rpx;
				}
			}
		}
		
		.detail-actions {
			padding: 12rpx 8rpx;
			gap: 10rpx;
			
			.action-btn {
				height: 68rpx;
				
				.btn-icon {
					font-size: 22rpx;
				}
				
				.btn-text {
					font-size: 22rpx;
				}
			}
		}
	}
}

/* Further optimization for small screen devices */
@media (max-width: 600rpx) {
	.detail-popup {
		.info-row {
			flex-direction: column;
			align-items: flex-start;
			
			.info-label {
				margin-bottom: 4rpx;
				min-width: auto;
			}
			
			.info-value {
				padding-left: 16rpx;
			}
		}
		
		.timeline-item {
			.timeline-label {
				min-width: 80rpx;
			}
		}
		
		.detail-actions {
			.action-btn {
				.btn-text {
					display: none;
				}
				
				.btn-icon {
					font-size: 28rpx;
				}
			}
		}
	}
}
</style>