<template>
	<view class="container" @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd">
		<!-- 自定义导航栏 -->
		<view class="custom-navbar" :style="navbarStyle">
			<view class="navbar-content">
				<!-- 左侧返回按钮 -->
				<view class="navbar-left">
					<view class="back-button" @click="back">
						<u-icon name="arrow-left" size="18" color="#ffffff"></u-icon>
					</view>
				</view>
				<!-- 中间标题 -->
				<view class="navbar-title">
					<text>审批查询</text>
				</view>
				<!-- 右侧搜索按钮 -->
				<view class="navbar-right">
					<view class="search-button" @click="scrollToFilter">
						<u-icon name="search" size="18" color="#ffffff"></u-icon>
					</view>
				</view>
			</view>
		</view>

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
									<!-- <text></text> icon-emojisuggestion,index -->
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
				<view class="action-btn history-btn" @click="toggleSearchHistory"
					:class="{ active: showSearchHistory }">
					<view class="btn-content">
						<text class="icon-emoji" :style="{ color: showSearchHistory ? '#f5a623' : '#d4922a' }">📜</text>
						<text class="btn-label" :style="{ color: showSearchHistory ? '#f5a623' : '#d4922a' }">历史</text>
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

		<!-- 热门搜索标签 - 只在搜索框聚焦且无输入内容时显示 -->
		<view class="hot-search-tags"
			v-if="searchFocused && !showSearchHistory && searchKeyword.length === 0 && dynamicHotSearchTags.length > 0">
			<view class="tags-header">
				<text class="icon-emoji" style="color: #ff6b35; margin-right: 6rpx">🔥</text>
				<text class="tags-title">热门搜索</text>
			</view>
			<view class="tags-container">
				<view class="hot-tag" v-for="(tag, index) in dynamicHotSearchTags" :key="index"
					@click="useHotSearch(tag)">
					<text class="tag-text">{{ tag.text }}</text>
					<view class="tag-count" v-if="tag.count > 0">{{ tag.count }}</view>
				</view>
			</view>
		</view>
		<!-- 1. 增加加载状态提示 -->
		<u-loading-page :loading="loading" bgColor="#f5f7fa"></u-loading-page>
		<!-- 统一筛选栏 -->
		<view class="unified-filter-container">
			<!-- 时间筛选行 -->
			<view class="filter-row time-filters">
				<view class="filter-chips">
					<view class="filter-chip" :class="{ active: quickTimeRange === null }"
						@click="setQuickTimeRange(null)">
						<text class="chip-text">全部时间</text>
						<text class="chip-count">{{ statistics.total }}</text>
					</view>
					<view class="filter-chip" :class="{ active: quickTimeRange === 1 }" @click="setQuickTimeRange(1)">
						<text class="chip-text">今日</text>
						<text class="chip-count">{{ getTodayCount() }}</text>
					</view>
					<view class="filter-chip" :class="{ active: quickTimeRange === 'yesterday' }"
						@click="setQuickTimeRange('yesterday')">
						<text class="chip-text">昨日</text>
						<text class="chip-count">{{ getYesterdayCount() }}</text>
					</view>
					<view class="filter-chip" :class="{ active: quickTimeRange === 3 }" @click="setQuickTimeRange(3)">
						<text class="chip-text">近三天</text>
						<text class="chip-count">{{ getTimeRangeCount(3) }}</text>
					</view>
					<view class="filter-chip" :class="{ active: quickTimeRange === 7 }" @click="setQuickTimeRange(7)">
						<text class="chip-text">近一周</text>
						<text class="chip-count">{{ getTimeRangeCount(7) }}</text>
					</view>
				</view>
			</view>

			<!-- 状态筛选行 -->
			<view class="filter-row status-filters">
				<view class="filter-chips">
					<view class="filter-chip" :class="{ active: quickStatusFilter.length === 0 }"
						@click="clearStatusFilter()">
						<text class="chip-text">全部</text>
						<text class="chip-count">{{ statistics.total }}</text>
					</view>
					<view class="filter-chip" :class="{ active: quickStatusFilter.includes('待审批') }"
						@click="toggleStatusFilter('待审批')">
						<text class="chip-icon">⏳</text>
						<text class="chip-text">待审</text>
						<text class="chip-count">{{ statistics.pending }}</text>
					</view>
					<view class="filter-chip" :class="{ active: quickStatusFilter.includes('已通过') }"
						@click="toggleStatusFilter('已通过')">
						<text class="chip-icon">✅</text>
						<text class="chip-text">已通过</text>
						<text class="chip-count">{{ statistics.approved }}</text>
					</view>
					<view class="filter-chip" :class="{ active: quickStatusFilter.includes('未通过') }"
						@click="toggleStatusFilter('未通过')">
						<text class="chip-icon">❌</text>
						<text class="chip-text">未通过</text>
						<text class="chip-count">{{ statistics.rejected }}</text>
					</view>
				</view>
			</view>

			<!-- 车辆状态筛选行 -->
			<view class="filter-row vehicle-filters">
				<view class="filter-chips">
					<view class="filter-chip" :class="{ active: quickVehicleFilter.length === 0 }"
						@click="clearVehicleFilter()">
						<text class="chip-text">全部</text>
						<text class="chip-count">{{ statistics.total }}</text>
					</view>
					<view class="filter-chip" :class="{ active: quickVehicleFilter.includes('已进场') }"
						@click="toggleVehicleFilter('已进场')">
						<text class="chip-icon">🟢</text>
						<text class="chip-text">在场</text>
						<text class="chip-count">{{ statistics.entered }}</text>
					</view>
					<view class="filter-chip" :class="{ active: quickVehicleFilter.includes('已离场') }"
						@click="toggleVehicleFilter('已离场')">
						<text class="chip-icon">🔴</text>
						<text class="chip-text">已离场</text>
						<text class="chip-count">{{ statistics.exited }}</text>
					</view>
					<view class="filter-chip" :class="{ active: quickVehicleFilter.includes('未进场') }"
						@click="toggleVehicleFilter('未进场')">
						<text class="chip-icon">⚪</text>
						<text class="chip-text">未进场</text>
						<text class="chip-count">{{ getUnenteredCount() }}</text>
					</view>
				</view>
			</view>

			<!-- 当前筛选状态 -->
			<view class="filter-actions-row"
				v-if="hasActiveFilters || quickStatusFilter.length > 0 || quickVehicleFilter.length > 0">
				<view class="current-filter-status">
					<text class="status-text">{{ getCurrentFilterDescription() }}</text>
				</view>
				<view class="filter-action-buttons">
					<view class="action-btn clear-btn" @click="clearAllFilters">
						<text class="btn-text">清除筛选</text>
					</view>
				</view>
			</view>
		</view>
		<!-- 数据工作台 - 合并版本 -->
		<view class="unified-data-workspace">
			<view class="workspace-header">
				<view class="header-title">
					<text class="icon-emoji" style="color: #409eff; margin-right: 8rpx">📊</text>
					<text class="title-text">数据工作台</text>
				</view>
				<view class="header-actions">
					<view class="collapse-btn" @click="toggleDataWorkspace">
						<text class="icon-emoji" style="color: #999">{{ showDataWorkspace ? '−' : '+' }}</text>
					</view>
				</view>
			</view>

			<view class="workspace-content" v-if="showDataWorkspace">
				<!-- 重新设计的统计卡片布局 -->
				<view class="stats-dashboard">
					<!-- 简化的核心指标卡片组 -->
					<view class="core-metrics-grid-simple">
						<!-- 今日待审批 - 可点击筛选 -->
						<view class="metric-card urgent-card clickable-card" @click="filterTodayPending">
							<view class="card-header-fixed">
								<view class="header-left">
									<text class="card-icon">⏰</text>
									<text class="card-title">今日待审</text>
								</view>
								<view class="header-right">
									<text class="urgent-badge" v-if="getTodayPendingCount() > 0">{{
										getTodayPendingCount() }}</text>
								</view>
							</view>
							<view class="card-main-content">
								<text class="main-number">{{ getTodayPendingCount() }}</text>
								<text class="sub-text">项待处理</text>
							</view>
							<view class="card-trend">
								<text class="trend-text" :class="todayTrendClass">{{ todayTrendText }}</text>
							</view>
						</view>

						<!-- 通过率 -->
						<view class="metric-card success-card">
							<view class="card-header-fixed">
								<view class="header-left">
									<text class="card-icon">✅</text>
									<text class="card-title">通过率</text>
								</view>
								<view class="header-right">
									<text class="rate-badge">{{ getApprovalRate() }}%</text>
								</view>
							</view>
							<view class="card-main-content">
								<text class="main-number">{{ statistics.approved }}</text>
								<text class="sub-text">已通过</text>
							</view>
							<view class="card-trend">
								<text class="trend-text trend-up">较上周 +{{ getWeeklyTrend() }}%</text>
							</view>
						</view>
						<!-- 车辆在场 - 可点击筛选 -->
						<view class="metric-card info-card clickable-card" @click="filterVehicleOnSite">
							<view class="card-header-fixed">
								<view class="header-left">
									<text class="card-icon">🚗</text>
									<text class="card-title">车辆在场</text>
								</view>
								<view class="header-right">
									<text class="status-badge">{{ statistics.entered }}</text>
								</view>
							</view>
							<view class="card-main-content">
								<text class="main-number">{{ statistics.entered }}</text>
								<text class="sub-text">辆在场</text>
							</view>
							<view class="card-trend">
								<text class="trend-text">今日进场 {{ getTodayEntryCount() }} 辆</text>
							</view>
						</view>
					</view>

					<!-- 数据统计图表区域 -->
					<view class="charts-grid">
						<!-- 状态分布分析 - 增强版 -->
						<view class="chart-card distribution-analysis-card">
							<view class="chart-header">
								<view class="header-left">
									<text class="chart-icon">📊</text>
									<text class="chart-title">状态分布分析</text>
									<text class="chart-subtitle">全部记录</text>
								</view>
							</view>
							<view class="chart-content">
								<view class="distribution-container">
									<!-- 饼图主体 - 改进版 -->
									<view class="pie-chart-visual">
										<!-- 饼图主体 -->
										<view class="pie-chart-wrapper">
											<!-- 使用CSS渐变创建饼图 -->
											<view class="pie-chart-gradient">
												<!-- 中心显示 -->
												<view class="pie-center-display">
													<text class="pie-total-text">{{ statistics.total || 0 }}</text>
													<text class="pie-label-text">总计</text>
												</view>
											</view>
										</view>
									</view>

									<!-- 图例显示 -->
									<view class="distribution-legend">
										<view class="legend-item">
											<view class="legend-dot pending"></view>
											<view class="legend-content">
												<text class="legend-text">待审批 {{ statistics.pending }}个</text>
												<text class="legend-percent">({{ getPendingPercent() }}%)</text>
											</view>
										</view>
										<view class="legend-item">
											<view class="legend-dot approved"></view>
											<view class="legend-content">
												<text class="legend-text">已通过 {{ statistics.approved }}个</text>
												<text class="legend-percent">({{ getApprovedPercent() }}%)</text>
											</view>
										</view>
										<view class="legend-item">
											<view class="legend-dot rejected"></view>
											<view class="legend-content">
												<text class="legend-text">已拒绝 {{ statistics.rejected }}个</text>
												<text class="legend-percent">({{ getRejectedPercent() }}%)</text>
											</view>
										</view>
									</view>


								</view>
							</view>
						</view>
					</view>
				</view>
			</view>
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
					<text class="icon-emoji" style="color: #909399; margin-right: 16rpx"
						@click="expandAllItems">⬇️</text>
					<text class="icon-emoji" style="color: #909399; margin-right: 16rpx"
						@click="collapseAllItems">⬆️</text>
					<text class="icon-emoji" style="color: #909399" @click="refreshList">🔄</text>
				</view>
			</view>
			<view class="title-line"></view>
		</view>


		<!-- 多选操作栏 -->
		<view class="multi-select-bar" v-if="isMultiSelectMode" :class="{ active: selectedItems.length > 0 }">
			<view class="select-info">
				<text class="select-count">已选择 {{ selectedItems.length }} 项</text>
				<text class="select-detail"
					v-if="selectedItems.length > 0 && selectedPendingCount !== selectedItems.length">
					({{ selectedPendingCount }} 项待审批)
				</text>
				<text class="select-all" @click="toggleSelectAll">
					{{ selectedItems.length === validPendingList.length ? '取消全选' : '全选' }}
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
			</view>
			<view class="select-close" @click="exitMultiSelectMode">
				<text class="icon-emoji" style="color: #999">×</text>
			</view>
		</view>

		<!-- 优化后的列表项 - 参考facility.vue的简洁实现 -->
		<u-swipe-action ref="uSwipeAction">
			<u-swipe-action-item v-for="(item, index) in validPendingList" :key="item.id"
				:options="getSwipeOptions(item)" :index="index" :name="index" @click="handleSwipeAction">

				<!-- 多选复选框 -->
				<view class="multi-select-checkbox" v-if="isMultiSelectMode" @click.stop="handleCheckboxClick(item)"
					@touchstart.stop="handleCheckboxTouchStart" @touchend.stop="handleCheckboxTouchEnd">
					<view class="checkbox-icon" :class="{ checked: selectedItems.includes(item.id) }">
						<text class="icon-emoji" style="color: #fff" v-if="selectedItems.includes(item.id)">✓</text>
					</view>
				</view>

				<!-- 卡片内容 - 参考facility.vue的紧凑布局 -->
				<view class="list-item" :class="{
					selected: selectedItems.includes(item.id),
					multiSelectMode: isMultiSelectMode
				}" @longpress="handleLongPress(index)" @click="handleCardClick(item, index)">

					<!-- 紧凑单行布局：车牌 + 业主信息 + 状态信息 + 操作按钮 -->
					<view class="compact-row">
						<!-- 车牌号码 -->
						<view class="plate-number-compact"
							:class="item.plateNumber && item.plateNumber.length === 8 ? 'green-plate' : 'blue-plate'">
							<text class="plate-text">{{ item.plateNumber || '未知车牌' }}</text>
						</view>

						<!-- 业主信息标注 -->
						<view class="owner-info-compact">
							<view class="owner-name-tag">
								<text class="owner-icon">👤</text>
								<text class="owner-name">{{ item.name && item.name.trim() !== '' ? item.name : '未知业主' }}</text>
							</view>
						</view>

						<!-- 重要状态信息 -->
						<view class="status-info-section">
							<!-- 综合状态信息：房号 + 状态标签 -->
							<view class="combined-status">
								<view class="status-tag" :class="{
									'urgency-normal': (item.status || '未知') === '待审批' && getWaitingUrgencyLevel(item.appointmentTime) === 'normal',
									'urgency-medium': (item.status || '未知') === '待审批' && getWaitingUrgencyLevel(item.appointmentTime) === 'medium',
									'urgency-high': (item.status || '未知') === '待审批' && getWaitingUrgencyLevel(item.appointmentTime) === 'high',
									'urgency-urgent': (item.status || '未知') === '待审批' && getWaitingUrgencyLevel(item.appointmentTime) === 'urgent',
									'vehicle-entered': (item.status || '未知') === '已通过' && (item.vehicleStatus === '已进场'),
									'vehicle-exited': (item.status || '未知') === '已通过' && (item.vehicleStatus === '已离场'),
									'vehicle-waiting': (item.status || '未知') === '已通过' && (item.vehicleStatus === '未进场' || item.vehicleStatus === '待进场' || !item.vehicleStatus),
									'urgency-rejected': (item.status || '未知') === '未通过'
								}">
									<text class="status-text">{{ getStatusDisplay(item) }}</text>
								</view>
							</view>
						</view>

						<!-- 操作按钮 -->
						<view class="actions-compact">
							<view class="copy-btn" @click.stop="copyPlateNumber(item.plateNumber)">
								<text class="action-icon copy-icon">📋</text>
							</view>
							<view class="collapse-btn" @click.stop="toggleItemExpand(index)">
								<text class="action-icon expand-icon">{{ expandedItems.includes(index) ? '⬆️' : '⬇️'
								}}</text>
							</view>
						</view>
					</view>

					<!-- 详细信息区域 - 纵向紧凑布局 -->
					<view class="detail-info-section-compact" v-if="expandedItems.includes(index)">
						<!-- 手机号信息行 - 可点击拨打 -->
						<view class="info-row clickable-row" @tap="makePhoneCall(item.phone)">
							<text class="info-icon">📱</text>
							<text class="info-label">手机号：</text>
							<text class="info-value clickable">{{ formatPhoneNumber(item.phone) }}</text>
						</view>
						
						<!-- 根据车辆状态显示不同的时间信息 -->
						<!-- 待入场状态：显示预约时间 -->
						<view class="info-row" v-if="(item.vehicleStatus === '待进场' || item.vehicleStatus === '未进场' || !item.vehicleStatus) && item.appointmentTime">
							<text class="info-icon">⏰</text>
							<text class="info-label">预约时间：</text>
							<text class="info-value primary">{{ formatAppointmentTime(item.appointmentTime) }}</text>
						</view>
						
						<!-- 已进场状态：显示进场时间 -->
						<view class="info-row" v-if="item.vehicleStatus === '已进场' && item.entryTime">
							<text class="info-icon">🚗</text>
							<text class="info-label">进场时间：</text>
							<text class="info-value success">{{ formatTime(item.entryTime) }}</text>
						</view>
						
						<!-- 已离场状态：显示进场时间、离场时间和停车时长 -->
						<template v-if="item.vehicleStatus === '已离场'">
							<!-- 进场时间 -->
							<view class="info-row" v-if="item.entryTime">
								<text class="info-icon">🚗</text>
								<text class="info-label">进场时间：</text>
								<text class="info-value">{{ formatTime(item.entryTime) }}</text>
							</view>
							
							<!-- 离场时间 -->
							<view class="info-row" v-if="item.exitTime">
								<text class="info-icon">🚙</text>
								<text class="info-label">离场时间：</text>
								<text class="info-value">{{ formatTime(item.exitTime) }}</text>
							</view>
							
							<!-- 停车时长 -->
							<view class="info-row" v-if="item.entryTime && item.exitTime">
								<text class="info-icon">⏱️</text>
								<text class="info-label">停车时长：</text>
								<text class="info-value duration">{{ calcDuration(item.entryTime, item.exitTime) }}</text>
							</view>
						</template>
						
						<!-- 地址信息行 -->
						<view class="info-row">
							<text class="info-icon">📍</text>
							<text class="info-label">住址：</text>
							<text class="info-value">{{ formatAddress(item.addressDetail) }}</text>
						</view>
					</view>
				</view>
			</u-swipe-action-item>
		</u-swipe-action>
		<!-- 4. 空状态处理 -->
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
		<u-popup :show="showDetailPopup" mode="center" :round="12" @close="closeDetailModal" :width="dynamicPopupSize.width" :height="dynamicPopupSize.height">
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
								<text class="info-value">{{ currentDetailItem.appointmentTime ?
									formatAppointmentTime(currentDetailItem.appointmentTime) : '未知时间' }}</text>
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
									{{ getVehicleStatusIcon(currentDetailItem.vehicleStatus || '未进场') }} {{
										currentDetailItem.vehicleStatus || '未进场' }}
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
										<text class="timeline-value">{{ currentDetailItem.appointmentTime ?
											formatAppointmentTime(currentDetailItem.appointmentTime) : '未知时间' }}</text>
									</view>
								</template>

								<template v-else-if="currentDetailItem.status === '未通过'">
									<view class="timeline-item">
										<text class="timeline-label">❌ 审批结果：</text>
										<text class="timeline-value">申请未通过</text>
									</view>
									<view class="timeline-item">
										<text class="timeline-label">📝 申请时间：</text>
										<text class="timeline-value">{{ currentDetailItem.appointmentTime ?
											formatAppointmentTime(currentDetailItem.appointmentTime) : '未知时间' }}</text>
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

									<view class="timeline-item"
										v-if="currentDetailItem.entryTime && currentDetailItem.exitTime">
										<text class="timeline-label">⏱️ 停留时长：</text>
										<text class="timeline-value">{{ calcDuration(currentDetailItem.entryTime,
											currentDetailItem.exitTime) }}</text>
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
	import {
		appointmentAPI
	} from '@/config/api.js'

	export default {
		data() {
			return {
				// 系统信息
				statusBarHeight: 20,
				originalList: [],
				hasClickedPending: false,
				expandedItems: [], // 存储已展开项的索引
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
				statusFilterOptions: [{
						label: '待审批',
						value: '待审批',
						checked: false
					},
					{
						label: '已通过',
						value: '已通过',
						checked: false
					},
					{
						label: '未通过',
						value: '未通过',
						checked: false
					}
				],

				// 时间筛选选项（单选）
				timeFilterOptions: [{
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
					},
					{
						label: '全部时间',
						value: null
					}
				],
				selectedTimeFilter: null, // 当前选中的时间筛选

				// 预设方案
				presetSchemes: [{
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
				pendingList: [],

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

				// 新增：数据分析面板控制变量
				trendExpanded: false, // 趋势图是否展开
				efficiencyExpanded: false, // 效率分析是否展开
				distributionExpanded: false, // 状态分布是否展开
				urgentExpanded: false, // 紧急度分析是否展开
				currentStatusFilter: null, // 当前状态筛选


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
				// 热门搜索标签（动态生成）
				hotSearchTags: [],
				// 手势操作相关
				showGestureTips: false, // 是否已显示手势提示
				isMultiSelectMode: false, // 是否处于多选模式
				selectedItems: [], // 已选择的项目ID列表
				checkboxClickTimer: null, // 复选框点击防抖计时器

				// 数据工作台
				showDataWorkspace: true, // 默认展开
				// 对比数据
				todayCount: 7,
				yesterdayCount: 5,

				// 详情弹窗
				showDetailPopup: false,
				currentDetailItem: null,
				// 弹窗动态尺寸
				popupWidth: '90%',
				popupHeight: '70%',

				// 用户引导
				showButtonGuide: false,
				hasSeenGuide: false,

				// 调试模式（生产环境设为false）
				debugMode: false
			}
		},
		filters: {
			dateFormat(timestamp) {
				if (!timestamp) return ''
				// 如果是数字时间戳，直接使用；如果是字符串，需要安全解析
				const date = typeof timestamp === 'number' ? new Date(timestamp) : this.parseDate ? this.parseDate(
					timestamp) : new Date(timestamp)
				if (!date || isNaN(date.getTime())) return ''
				return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
			}
		},

		computed: {
			// 过滤有效的待处理列表项，确保索引匹配
			validPendingList() {
				return this.pendingList.filter(item => item && typeof item === 'object' && item.id);
			},

			// 导航栏样式计算
			navbarStyle() {
				return {
					paddingTop: `${this.statusBarHeight}px`
				};
			},

			// 动态弹窗尺寸计算
			dynamicPopupSize() {
				try {
					const systemInfo = uni.getSystemInfoSync();
					const screenWidth = systemInfo.screenWidth;
					const screenHeight = systemInfo.screenHeight;
					const safeArea = systemInfo.safeArea || {};
					const pixelRatio = systemInfo.pixelRatio || 1;
					
					// 根据屏幕尺寸和安全区域动态调整弹窗大小
					let width, height;
					
					// 考虑实际可用高度（减去状态栏、导航栏等）
					const availableHeight = safeArea.height || screenHeight - (this.statusBarHeight * pixelRatio);
					const heightRatio = availableHeight / screenHeight;
					
					if (screenWidth <= 375) {
						// 小屏手机 (iPhone SE, 老款iPhone等)
						width = '88%';
						height = '50%';
					} else if (screenWidth <= 414) {
						// 中等屏幕手机 (iPhone 8 Plus, iPhone X等)
						width = '90%';
						height = '52%';
					} else if (screenWidth <= 428) {
						// 大屏手机 (iPhone 12 Pro Max等)
						width = '92%';
						height = '55%';
					} else {
						// 平板或更大屏幕
						width = '85%';
						height = '60%';
					}
					
					return { width, height };
				} catch (error) {
					console.error('获取系统信息失败:', error);
					// 降级方案
					return { width: '90%', height: '52%' };
				}
			},

			// 缓存7天数据，避免频繁计算
			cachedLast7DaysData() {
				const cacheKey = `${this.originalList.length}_${this.validPendingList.length}`;
				if (this._last7DaysCache && this._last7DaysCache.key === cacheKey) {
					return this._last7DaysCache.data;
				}

				const data = this.getLast7DaysDataInternal();
				this._last7DaysCache = {
					key: cacheKey,
					data
				};
				return data;
			},
			formattedStartTime() {
				return this.formatDate(this.startTimestamp)
			},
			formattedEndTime() {
				return this.formatDate(this.endTimestamp)
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

			// 新增：周统计数据
			weeklyStats() {
				const last7Days = this.getLast7DaysData();
				const totalApproved = last7Days.reduce((sum, day) => sum + day.approved, 0);
				const totalRejected = last7Days.reduce((sum, day) => sum + day.rejected, 0);
				const totalProcessed = totalApproved + totalRejected;

				return {
					totalApproved,
					totalRejected,
					totalProcessed,
					approvalRate: totalProcessed > 0 ? Math.round((totalApproved / totalProcessed) * 100) : 0,
					avgProcessTime: this.calculateAvgProcessTime()
				};
			},

			// 动态热门搜索标签
			dynamicHotSearchTags() {
				// 如果没有搜索历史，不显示任何热门标签
				if (this.searchHistory.length === 0) {
					return [];
				}

				// 统计搜索关键词的频率
				const keywordCount = {};

				// 从搜索历史中统计
				this.searchHistory.forEach(item => {
					const keyword = item.keyword;
					keywordCount[keyword] = (keywordCount[keyword] || 0) + 1;
				});

				// 从当前数据中提取常见关键词
				const commonKeywords = this.extractCommonKeywords();
				commonKeywords.forEach(keyword => {
					keywordCount[keyword] = (keywordCount[keyword] || 0) + 1;
				});

				// 转换为标签格式并排序
				const tags = Object.entries(keywordCount)
					.map(([text, count]) => ({
						text,
						count
					}))
					.sort((a, b) => b.count - a.count)
					.slice(0, 6); // 限制显示6个

				// 只在有真实搜索历史时才显示标签
				if (tags.length > 0) {
					return tags.slice(0, 6);
				}

				return [];
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

			// 选中项目中待审批的数量
			selectedPendingCount() {
				return this.selectedItems.filter(id => {
					const item = this.validPendingList.find(item => item.id === id);
					return item && item.status === '待审批';
				}).length;
			},

			// 方案三：抽屉式筛选计算属性
			// 检查是否有活跃的筛选条件
			hasActiveFilters() {
				const hasStatusFilter = this.statusFilterOptions.some(item => item.checked);
				const hasTimeFilter = this.selectedTimeFilter !== null;
				const hasPreset = this.currentPreset !== null;
				return hasStatusFilter || hasTimeFilter || hasPreset;
			},

			// 新增统计相关计算属性
			todayTrendClass() {
				const todayCount = this.getTodayPendingCount();
				const yesterdayPendingCount = this.getYesterdayPendingCount();

				if (todayCount > yesterdayPendingCount) return 'trend-up';
				if (todayCount < yesterdayPendingCount) return 'trend-down';
				return 'trend-stable';
			},

			todayTrendText() {
				const todayCount = this.getTodayPendingCount();
				const yesterdayCount = this.getYesterdayPendingCount();
				const diff = todayCount - yesterdayCount;

				if (diff > 0) return `较昨日 +${diff}`;
				if (diff < 0) return `较昨日 ${diff}`;
				return '与昨日持平';
			},

			efficiencyTrendClass() {
				// 根据处理时间判断效率趋势
				const avgTime = parseFloat(this.getAverageProcessTime());
				if (avgTime < 1) return 'trend-up';
				if (avgTime > 2) return 'trend-down';
				return 'trend-stable';
			},

			efficiencyTrendText() {
				const avgTime = parseFloat(this.getAverageProcessTime());
				if (avgTime < 1) return '效率提升';
				if (avgTime > 2) return '需要优化';
				return '保持稳定';
			},

			// 饼图样式计算属性
			pieChartStyle() {
				const total = this.getTotalCount();

				if (total === 0) {
					return {
						background: '#f5f5f5'
					};
				}

				const pendingPercent = (this.statistics.pending / total) * 100;
				const approvedPercent = (this.statistics.approved / total) * 100;
				const rejectedPercent = (this.statistics.rejected / total) * 100;

				// 使用conic-gradient创建饼图
				const pendingDeg = (pendingPercent / 100) * 360;
				const approvedDeg = (approvedPercent / 100) * 360;
				const rejectedDeg = (rejectedPercent / 100) * 360;

				let currentDeg = 0;
				const gradientStops = [];

				if (pendingPercent > 0) {
					gradientStops.push(`#e6a23c ${currentDeg}deg ${currentDeg + pendingDeg}deg`);
					currentDeg += pendingDeg;
				}

				if (approvedPercent > 0) {
					gradientStops.push(`#67c23a ${currentDeg}deg ${currentDeg + approvedDeg}deg`);
					currentDeg += approvedDeg;
				}

				if (rejectedPercent > 0) {
					gradientStops.push(`#f56c6c ${currentDeg}deg ${currentDeg + rejectedDeg}deg`);
				}

				// 如果没有任何数据，显示灰色
				if (gradientStops.length === 0) {
					gradientStops.push('#f5f5f5 0deg 360deg');
				}

				const backgroundStyle = `conic-gradient(${gradientStops.join(', ')})`;

				return {
					background: backgroundStyle
				};
			},

			// 仪表盘样式计算属性
			gaugeStyle() {
				const urgencyLevel = this.getUrgencyLevel();
				const rotation = (urgencyLevel / 100) * 180; // 将百分比转换为0-180度的旋转角度

				return {
					transform: `rotate(${rotation}deg)`,
					background: `conic-gradient(from 0deg, #ff4757 0%, #ffa502 50%, #2ed573 100%)`
				};
			},

			// 环形进度条样式
			circleStyle() {
				const level = this.getUrgencyLevel();
				const rotation = (level / 100) * 180; // 半圆进度
				let color = '#67C23A'; // 默认绿色

				if (level >= 80) color = '#F56C6C'; // 红色
				else if (level >= 60) color = '#E6A23C'; // 橙色
				else if (level >= 30) color = '#409EFF'; // 蓝色

				return {
					transform: `rotate(${rotation}deg)`,
					backgroundColor: color
				};
			},

			// 雷达图指标数据
			radarMetrics() {
				const baseMetrics = [{
						label: '处理速度',
						value: 85,
						level: 'excellent',
						icon: '⚡'
					},
					{
						label: '通过率',
						value: 92,
						level: 'excellent',
						icon: '✓'
					},
					{
						label: '响应时间',
						value: 78,
						level: 'good',
						icon: '⏱'
					},
					{
						label: '服务质量',
						value: 88,
						level: 'excellent',
						icon: '★'
					},
					{
						label: '客户满意',
						value: 91,
						level: 'excellent',
						icon: '😊'
					}
				];

				// 为每个指标添加样式类和文本
				return baseMetrics.map(metric => ({
					...metric,
					levelClass: this.getMetricLevelClass(metric.value),
					levelText: this.getMetricLevelText(metric.value)
				}));
			}

		},
		mounted() {
			// 获取状态栏高度
			this.getStatusBarHeight();
			// 加载真实的预约数据
			this.loadAppointmentData();
			// 初始化搜索历史
			this.loadSearchHistory();
			// 初始化可视化数据
			this.initializeVisualizationData();
		},
		methods: {
			// 返回上一页
			back() {
				uni.navigateBack({
					delta: 1
				});
			},

			// 获取状态栏高度
			getStatusBarHeight() {
				try {
					const systemInfo = uni.getSystemInfoSync();
					this.statusBarHeight = systemInfo.statusBarHeight || 20;
				} catch (e) {
					this.statusBarHeight = 20;
				}
			},

			// 禁用按钮点击事件
			onDisabledClick() {
				uni.showToast({
					title: '当前页面无法返回',
					icon: 'none',
					duration: 1500
				});
			},

			// 简化版百分比计算方法
			getPendingPercent() {
				const total = this.getTotalCount();
				return total > 0 ? Math.round((this.statistics.pending / total) * 100) : 0;
			},

			getApprovedPercent() {
				const total = this.getTotalCount();
				return total > 0 ? Math.round((this.statistics.approved / total) * 100) : 0;
			},

			getRejectedPercent() {
				const total = this.getTotalCount();
				return total > 0 ? Math.round((this.statistics.rejected / total) * 100) : 0;
			},

			// 安全创建当前日期对象
			createCurrentDate() {
				return new Date();
			},

			// 安全创建日期对象，避免iOS兼容性问题
			createSafeDate(input) {
				if (!input) return this.createCurrentDate();

				// 如果是数字时间戳，直接使用
				if (typeof input === 'number') {
					return new Date(input);
				}

				// 如果是Date对象，直接返回
				if (input instanceof Date) {
					return input;
				}

				// 如果是字符串，使用parseDate方法安全解析
				if (typeof input === 'string') {
					return this.parseDate(input) || this.createCurrentDate();
				}

				return this.createCurrentDate();
			},

			// 格式化日期为后端期望的格式 (yyyy-MM-dd'T'HH:mm:ss)
			formatDateForBackend(date) {
				if (!date) date = this.createCurrentDate();

				const year = date.getFullYear();
				const month = String(date.getMonth() + 1).padStart(2, '0');
				const day = String(date.getDate()).padStart(2, '0');
				const hours = String(date.getHours()).padStart(2, '0');
				const minutes = String(date.getMinutes()).padStart(2, '0');
				const seconds = String(date.getSeconds()).padStart(2, '0');

				// 使用标准的ISO格式：yyyy-MM-ddTHH:mm:ss
				// 这种格式在所有平台上都能正确解析
				return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
			},

			// 加载预约数据
			async loadAppointmentData() {
				try {
					this.loading = true;
					console.log('🔄 开始加载预约数据...');

					// 1. 获取当前管家的 openid（使用增强的获取方法）
					let userInfo = uni.getStorageSync('userInfo');
					
					// 🆕 如果没有找到用户信息，尝试从其他存储键获取
					if (!userInfo) {
						console.log('⚠️ [用户信息] userInfo为空，尝试从其他来源获取');
						userInfo = this.getUserInfoFromAllSources();
					}
					
					console.log('👤 [用户信息] 用户信息:', userInfo);
					const openid = userInfo?.openid || userInfo?.userInfo?.openid;

					if (!openid) {
						console.log('❌ 未找到 openid');
						uni.showToast({
							title: '请重新登录',
							icon: 'none',
							duration: 2000
						});
						return;
					}

					console.log('📱 当前管家 openid:', openid);

					// 2. 获取管家小区信息
					const communityInfo = await this.getManagerCommunityInfo(userInfo);
					console.log('🏢 小区信息:', communityInfo);

					// 2.5 获取当前管家姓名
					const managerName = userInfo?.userName || 
									   userInfo?.username || 
									   userInfo?.userInfo?.username || 
									   userInfo?.userInfo?.userName ||
									   uni.getStorageSync('managerInfo')?.username ||
									   uni.getStorageSync('managerInfo')?.butlerName ||
									   '管家';
					console.log('👤 当前管家姓名:', managerName);

					// 3. 调用所有预约数据接口
					const apiParams = {
						community: communityInfo?.community || '', // 根据管家小区过滤
						auditusername: managerName, // 根据当前管家的姓名筛选审批记录
						pageNum: 1,
						pageSize: 100
					};
					console.log('📡 API 请求参数:', apiParams);

					const appointmentResponse = await appointmentAPI.getAllPage(apiParams);
					console.log('📡 API 响应:', appointmentResponse);

					// 4. 处理API响应数据
					if (appointmentResponse && appointmentResponse.data) {
						let appointmentData = [];

						// 处理分页数据结构
						if (appointmentResponse.data.records && Array.isArray(appointmentResponse.data.records)) {
							appointmentData = appointmentResponse.data.records;
						} else if (Array.isArray(appointmentResponse.data)) {
							appointmentData = appointmentResponse.data;
						}


						// 5. 转换数据格式
						const formattedData = this.formatAppointmentData(appointmentData);

						// 6. 按预约时间倒序排序（预约时间越晚的越在前面）
						const sortedData = formattedData.sort((a, b) => {
							const timeA = this.parseDate(a.appointmentTime || '')?.getTime() || 0;
							const timeB = this.parseDate(b.appointmentTime || '')?.getTime() || 0;
							return timeB - timeA; // 倒序排序，时间越晚的越靠前
						});


						// 7. 更新数据
						this.originalList = sortedData;
						this.pendingList = [...sortedData];

						// 7. 更新时间数据
						this.updateTimes();

						// 8. 更新统计数据
						this.updateStatistics();

					} else {
						// 如果API返回异常，保留原有的示例数据
						this.originalList = [...this.pendingList];
						this.updateTimes();
						this.updateStatistics();
					}

				} catch (error) {
					console.error('❌ 数据加载失败详细信息:', error);
					console.error('❌ 错误堆栈:', error.stack);

					// 发生错误时保留原有的示例数据
					this.originalList = [...this.pendingList];
					this.updateTimes();
					this.updateStatistics();

					uni.showToast({
						title: `数据加载失败: ${error.message || '未知错误'}`,
						icon: 'none',
						duration: 3000
					});
				} finally {
					this.loading = false;
				}
			},

			// 获取管家小区信息（增强版）
			async getManagerCommunityInfo(userInfo) {
				try {
					console.log('🏢 [管家小区信息] 获取管家小区信息, userInfo:', userInfo);

					// 🆕 方案1: 优先从新的存储结构中获取
					const managerInfo = uni.getStorageSync('managerInfo');
					const communityInfo = uni.getStorageSync('communityInfo');
					const yardInfo = uni.getStorageSync('yardInfo');
					
					console.log('🏠 [管家小区信息] managerInfo:', managerInfo);
					console.log('🏢 [管家小区信息] communityInfo:', communityInfo);
					console.log('🏡 [管家小区信息] yardInfo:', yardInfo);

					// 从新的存储结构中获取小区信息
					if (managerInfo?.community || communityInfo?.yardName || communityInfo?.communityName) {
						const community = managerInfo.community || communityInfo.yardName || communityInfo.communityName || communityInfo.name;
						console.log('✅ [管家小区信息] 从新存储结构获取小区:', community);
						return {
							community,
							province: managerInfo?.province || communityInfo?.province,
							city: managerInfo?.city || communityInfo?.city,
							district: managerInfo?.district || communityInfo?.district
						};
					}

					// 🆕 方案2: 从用户信息的增强字段中获取
					if (userInfo?.yardName || userInfo?.userInfo?.yardName || userInfo?.userInfo?.community) {
						const community = userInfo.yardName || userInfo.userInfo.yardName || userInfo.userInfo.community;
						console.log('✅ [管家小区信息] 从用户信息增强字段获取小区:', community);
						return {
							community,
							province: userInfo?.userInfo?.managerInfo?.province,
							city: userInfo?.userInfo?.managerInfo?.city,
							district: userInfo?.userInfo?.managerInfo?.district
						};
					}

					// 方案3: 从用户信息中获取小区信息（原有逻辑）
					if (userInfo?.parkName || userInfo?.userInfo?.parkName) {
						const community = userInfo.parkName || userInfo.userInfo.parkName;
						console.log('🏢 [管家小区信息] 从用户信息获取小区:', community);
						return {
							community
						};
					}

					// 方案4: 通过手机号查询管家信息
					const phone = userInfo?.phone || userInfo?.userInfo?.phone;
					if (phone) {
						console.log('📱 [管家小区信息] 通过手机号查询管家信息:', phone);
						const {
							butlerAPI
						} = require('@/config/api.js');
						const response = await butlerAPI.getByPhone(phone);

						if (response && response.data && response.code === '0') {
							const butlerInfo = response.data;
							console.log('🏢 [管家小区信息] 查询到管家信息:', butlerInfo);
							
							// 🆕 保存查询到的管家信息到本地存储
							uni.setStorageSync('managerInfo', butlerInfo);
							console.log('💾 [管家小区信息] 已保存管家信息到本地存储');
							
							return {
								community: butlerInfo.community,
								province: butlerInfo.province,
								city: butlerInfo.city,
								district: butlerInfo.district
							};
						}
					}

					// 🆕 方案5: 从扫码地址信息中获取
					const scannedInfo = uni.getStorageSync('scannedAddressInfo');
					if (scannedInfo?.community) {
						console.log('📱 [管家小区信息] 从扫码地址信息获取小区:', scannedInfo.community);
						return {
							community: scannedInfo.community
						};
					}

					// 如果都没有找到，返回默认值
					console.log('⚠️ [管家小区信息] 未找到小区信息，使用默认值');
					return {
						community: '四季上东' // 🆕 使用更具体的默认值
					};
				} catch (error) {
					console.error('❌ [管家小区信息] 获取管家小区信息失败:', error);
					return {
						community: '四季上东'
					};
				}
			},

			// 🆕 从所有可能的来源获取用户信息（增强版）
			getUserInfoFromAllSources() {
				console.log('🔍 [获取用户信息] 从所有可能的来源获取用户信息...');
				
				// 📋 扩展的存储键列表，包含我们新添加的键
				const allStorageKeys = [
					'userInfo', 'user', 'loginInfo', 'patrolInfo', 'managerInfo',
					'communityInfo', 'yardInfo', 'parkInfo', 'scannedAddressInfo'
				];
				
				// 1. 尝试从uni.storage获取所有可能的键
				for (const key of allStorageKeys) {
					try {
						const userInfo = uni.getStorageSync(key);
						if (userInfo && typeof userInfo === 'object') {
							console.log(`✅ [获取用户信息] 从uni.storage获取到${key}:`, userInfo);
							
							// 🏠 如果是管家信息，获取额外的小区信息
							if (key === 'managerInfo' || key === 'communityInfo' || key === 'yardInfo') {
								const mainUserInfo = uni.getStorageSync('userInfo') || {};
								const enhancedUserInfo = {
									...mainUserInfo,
									...userInfo,
									yardName: userInfo.community || userInfo.yardName || userInfo.communityName || mainUserInfo.yardName || '四季上东',
									userName: userInfo.username || userInfo.butlerName || mainUserInfo.userName || '用户',
									userInfo: {
										...mainUserInfo.userInfo,
										...userInfo,
										managerInfo: userInfo,
										community: userInfo.community || userInfo.yardName || userInfo.communityName || '四季上东',
										yardName: userInfo.community || userInfo.yardName || userInfo.communityName || '四季上东'
									}
								};
								console.log(`🏠 [获取用户信息] 增强的用户信息（包含${key}）:`, enhancedUserInfo);
								return enhancedUserInfo;
							}
							
							// 确保返回的用户信息包含必要的字段
							if (!userInfo.yardName && !userInfo.userName) {
								userInfo.yardName = userInfo.yardName || userInfo.community || userInfo.userInfo?.community || userInfo.userInfo?.yardName || '四季上东';
								userInfo.userName = userInfo.userName || userInfo.username || userInfo.userInfo?.username || userInfo.roleText || '用户';
							}
							
							return userInfo;
						}
					} catch (e) {
						console.log(`❌ [获取用户信息] 读取${key}失败:`, e.message);
					}
				}
				
				// 2. 🆕 尝试组合多个存储键的信息
				try {
					const userInfo = uni.getStorageSync('userInfo') || {};
					const managerInfo = uni.getStorageSync('managerInfo') || {};
					const communityInfo = uni.getStorageSync('communityInfo') || {};
					const scannedInfo = uni.getStorageSync('scannedAddressInfo') || {};
					
					if (Object.keys(userInfo).length > 0 || Object.keys(managerInfo).length > 0 || 
						Object.keys(communityInfo).length > 0 || Object.keys(scannedInfo).length > 0) {
						
						const combinedUserInfo = {
							...userInfo,
							yardName: userInfo.yardName || managerInfo.community || communityInfo.yardName || 
									 scannedInfo.community || communityInfo.name || '四季上东',
							userName: userInfo.userName || managerInfo.username || managerInfo.butlerName || 
									 scannedInfo.butlerName || userInfo.username || '用户',
							userInfo: {
								...userInfo.userInfo,
								managerInfo: managerInfo,
								community: managerInfo.community || communityInfo.yardName || scannedInfo.community || '四季上东',
								yardName: managerInfo.community || communityInfo.yardName || scannedInfo.community || '四季上东'
							}
						};
						
						console.log('🔧 [获取用户信息] 组合多个存储键的信息:', combinedUserInfo);
						return combinedUserInfo;
					}
				} catch (e) {
					console.log('❌ [获取用户信息] 组合存储信息失败:', e.message);
				}
				
				console.log('❌ [获取用户信息] 未找到任何用户信息');
				return null;
			},

			// 格式化预约数据
			formatAppointmentData(apiData) {
				if (!Array.isArray(apiData)) {
					return [];
				}

				return apiData.map((item, index) => {
					// 转换API数据格式为页面所需格式
					const formattedItem = {
						id: item.id || `api_${index}`,
						name: item.ownername || '未知',
						plateNumber: item.platenumber || '',
						phone: item.visitorphone || item.ownerphone || '',
						appointmentTime: item.recorddate || item.visitdate || '', // 优先使用recorddate（记录创建时间）
						description: item.visitreason || '预约申请',
						status: this.convertStatus(item.auditstatus || item.status),
						addressDetail: this.formatAddressFromItem(item),
						entryTime: item.arrivedate || '',
						exitTime: item.leavedate || '',
						vehicleStatus: this.convertVehicleStatus(item.venuestatus),
						showAction: false,
						// 保留原始数据
						originalData: item
					};

					return formattedItem;
				});
			},

			// 转换状态
			convertStatus(apiStatus) {
				if (!apiStatus) return '待审批';

				switch (apiStatus) {
					case '已通过':
					case '通过':
						return '已通过';
					case '未通过':
					case '拒绝':
					case '已拒绝':
						return '未通过';
					case '待审批':
					case '待审核':
					default:
						return '待审批';
				}
			},

			// 转换车辆状态
			convertVehicleStatus(apiVenueStatus) {
				if (!apiVenueStatus) return '未进场';

				switch (apiVenueStatus) {
					case '已入场':
					case '已进场':
						return '已进场';
					case '已离场':
					case '已出场':
						return '已离场';
					case '待入场':
					case '待进场':
					default:
						return '未进场';
				}
			},

			// 格式化地址组件（从API数据构建地址）
			formatAddressFromItem(item) {
				const parts = [];
				if (item.building) parts.push(`${item.building}栋`);
				if (item.units) parts.push(`${item.units}单元`);
				if (item.floor) parts.push(`${item.floor}层`);
				if (item.room) parts.push(`${item.room}室`);

				return parts.length > 0 ? parts.join('') : (item.community || '未知地址');
			},

			// 更新时间数据
			updateTimes() {
				try {
					// 只更新统计数据，不修改时间
					this.updateStatistics();
				} catch (error) {}
			},
			statusType(status) {
				const map = {
					'待审批': 'warning',
					'已通过': 'success',
					'未通过': 'error'
				}
				return map[status] || 'info'
			},
			getStatusColor(status) {
				const colorMap = {
					'已进场': '#4CAF50',
					'已离场': '#FF9800',
					'未进场': '#2196F3'
				}
				return colorMap[status] || '#F44336'
			},
			// 车辆状态类型映射
			vehicleStatusType(status) {
				const map = {
					'已进场': 'success',
					'已离场': 'warning',
					'未进场': 'info'
				}
				return map[status] || 'error'
			},

			// 时间格式化
			formatTime(timeStr) {
				if (!timeStr) {
					return '未知时间'
				}
				
				try {
					return dayjs(timeStr).format('YYYY-MM-DD HH:mm')
				} catch (error) {
					console.error('时间格式化出错:', error)
					return '时间格式错误'
				}
			},

			// 计算时间差
			calcDuration(start, end) {
				// 参数验证
				if (!start || !end) {
					return '未知时长'
				}
				
				try {
					const diff = dayjs(end).diff(dayjs(start), 'minute')
					if (diff < 0) {
						return '时间异常'
					}
					const hours = Math.floor(diff / 60)
					const minutes = diff % 60
					return `${hours}小时${minutes}分钟`
				} catch (error) {
					console.error('计算时长出错:', error)
					return '计算错误'
				}
			},
			getStatusClass(item) {
				if (item.exitTime) return 'exited'
				if (item.entryTime) return 'entered'
				return 'pending'
			},
			getStatusText(item) {
				if (item.exitTime) return '已离场'
				if (item.entryTime) return '已进场'
				return '待入场'
			},
			statusIcon(item) {
				const map = {
					'exited': 'checkmark-circle',
					'entered': 'clock',
					'pending': 'close-circle'
				}
				return map[this.getStatusClass(item)]
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
				}
				return styleMap[this.getStatusClass(item)]
			},
			// 保留原来的导航方法，备用
			navigateToDetail(id, status) {
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
				return num.toString().padStart(2, '0')
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
				if (!timestamp) return ''
				// 使用安全的日期创建方法
				const date = this.createSafeDate(timestamp)
				if (!date || isNaN(date.getTime())) return ''
				return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
			},

			// 快捷时间选择
			handleQuickTime(days) {
				this.selectedRange = days
				const end = this.createCurrentDate()
				const start = this.createCurrentDate()
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
							const itemTime = this.parseDate(item.appointmentTime)?.getTime() || 0;
							return itemTime >= start.getTime() && itemTime <= end.getTime();
						});
					}

					// 按预约时间倒序排序（预约时间越晚的越在前面）
					filteredList.sort((a, b) => {
						const timeA = this.parseDate(a.appointmentTime || '')?.getTime() || 0;
						const timeB = this.parseDate(b.appointmentTime || '')?.getTime() || 0;
						return timeB - timeA; // 倒序排序，时间越晚的越靠前
					});

					// 有序地更新列表
					this.pendingList = filteredList;
					this.hasClickedPending = true;

					// 更新筛选状态
					this.isFiltering = (this.current1 !== 0 || this.selectedTimeRange !== null);

					// 操作完成，重置状态
					this.loading = false;
				}, 50);
			},
			confirmFilter() {
				this.$emit('filter', this.urgencyValue)
				if (this.startTimestamp != null && this.endTimestamp != null && this.selectedStatus == null) {
					this.pendingList = this.originalList.filter(item => {
						const itemTime = this.parseDate(item.appointmentTime)?.getTime() || 0;
						return itemTime >= this.startTimestamp && itemTime <= this.endTimestamp;
					});
				} else if (this.startTimestamp != null && this.endTimestamp != null && this.selectedStatus != null) {
					// 通过筛选的时间范围和审核状态进行查询筛选数据
					this.pendingList = this.originalList.filter(item => {
						const itemTime = this.parseDate(item.appointmentTime)?.getTime() || 0;
						return itemTime >= this.startTimestamp && itemTime <= this.endTimestamp && item.status ===
							this.selectedStatus;
					});
				} else if (this.selectedStatus != null && this.startTimestamp == null && this.endTimestamp == null) {
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
			urgencyChange(values) {},

			// 提交审核接口
			async submitAudit(id, type) {
				// 调用后端接口逻辑...
			},

			confirmTime(time) {
				this.showTimePicker = false
			},
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
					let filteredList = this.originalList.filter(item => {
						const itemTime = this.parseDate(item.appointmentTime)?.getTime() || 0;
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

					// 按预约时间倒序排序（预约时间越晚的越在前面）
					filteredList.sort((a, b) => {
						const timeA = this.parseDate(a.appointmentTime || '')?.getTime() || 0;
						const timeB = this.parseDate(b.appointmentTime || '')?.getTime() || 0;
						return timeB - timeA; // 倒序排序，时间越晚的越靠前
					});

					this.pendingList = filteredList;

					// 更新筛选状态
					this.isFiltering = (this.current1 !== 0 || this.selectedTimeRange !== null);
					this.loading = false;
				}, 50);
			},
			formatAppointmentTime(timeStr) {
				if (!timeStr) return '未知时间';

				// 使用parseDate方法解析日期，确保iOS兼容性
				const date = this.parseDate(timeStr);
				const today = new Date();

				// 检查日期是否有效
				if (!date || isNaN(date.getTime())) {
					return '时间格式错误';
				}

				const hours = date.getHours().toString().padStart(2, '0');
				const minutes = date.getMinutes().toString().padStart(2, '0');
				const year = date.getFullYear();
				const month = (date.getMonth() + 1).toString().padStart(2, '0');
				const day = date.getDate().toString().padStart(2, '0');

				if (this.isToday(timeStr)) {
					// 今日预约 - 一行显示
					return `今日${hours}:${minutes}`;
				} else if (this.isYesterday(timeStr)) {
					// 昨日预约 - 一行显示
					return `昨日${hours}:${minutes}`;
				}

				const diffDays = Math.floor((date - today) / (24 * 60 * 60 * 1000));

				if (diffDays === 1) {
					// 明天 - 一行显示
					return `明日${hours}:${minutes}`;
				} else if (diffDays > 1 && diffDays < 7) {
					// 几天后 - 一行显示
					return `${diffDays}天后${hours}:${minutes}`;
				} else if (diffDays < 0 && diffDays > -7) {
					// 几天前 - 一行显示
					return `${Math.abs(diffDays)}天前${hours}:${minutes}`;
				}

				// 其他日期 - 显示完整日期，一行显示
				if (year === today.getFullYear()) {
					// 同年，只显示月日
					return `${month}-${day} ${hours}:${minutes}`;
				} else {
					// 不同年，显示年月日
					return `${year}-${month}-${day} ${hours}:${minutes}`;
				}
			},
			// iOS兼容的日期解析函数
			parseDate(dateString) {
				if (!dateString) return null;

				try {
					// 确保输入是字符串
					const dateStr = String(dateString).trim();
					if (!dateStr) return null;

					// 直接使用手动解析方式，避免使用new Date()直接解析字符串
					// 这样可以避免iOS上的兼容性问题
					return this.manualParseDate(dateStr);
				} catch (error) {
					return null;
				}
			},

			// 手动解析日期的方法 - 兼容iOS
			manualParseDate(dateString) {
				try {
					const dateStr = String(dateString).trim();

					// 匹配常见的日期时间格式
					const patterns = [
						// YYYY-MM-DD HH:mm:ss
						/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/,
						// YYYY/MM/DD HH:mm:ss
						/^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/,
						// YYYY-MM-DDTHH:mm:ss
						/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/,
						// YYYY-MM-DDTHH:mm:ss.sssZ
						/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z?$/,
						// YYYY-MM-DD
						/^(\d{4})-(\d{2})-(\d{2})$/,
						// YYYY/MM/DD
						/^(\d{4})\/(\d{2})\/(\d{2})$/,
						// MM/DD/YYYY HH:mm:ss
						/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/,
						// DD/MM/YYYY HH:mm:ss
						/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/
					];

					for (let i = 0; i < patterns.length; i++) {
						const pattern = patterns[i];
						const match = dateStr.match(pattern);

						if (match) {
							let year, month, day, hour = 0,
								minute = 0,
								second = 0;

							// 根据不同的模式解析日期部分
							if (i < 6) { // 前6种模式是年月日在前
								year = parseInt(match[1]);
								month = parseInt(match[2]) - 1; // 月份从0开始
								day = parseInt(match[3]);
								if (match[4]) hour = parseInt(match[4]);
								if (match[5]) minute = parseInt(match[5]);
								if (match[6]) second = parseInt(match[6]);
							} else if (i === 6) { // MM/DD/YYYY格式
								month = parseInt(match[1]) - 1;
								day = parseInt(match[2]);
								year = parseInt(match[3]);
								hour = parseInt(match[4]);
								minute = parseInt(match[5]);
								second = parseInt(match[6]);
							} else if (i === 7) { // DD/MM/YYYY格式
								day = parseInt(match[1]);
								month = parseInt(match[2]) - 1;
								year = parseInt(match[3]);
								hour = parseInt(match[4]);
								minute = parseInt(match[5]);
								second = parseInt(match[6]);
							}

							// 使用UTC创建日期，避免时区问题
							const date = new Date(Date.UTC(year, month, day, hour, minute, second));

							// 转换为本地时间
							const localDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));

							if (!isNaN(localDate.getTime())) {
								return localDate;
							}
						}
					}

					// 如果上面的模式都不匹配，尝试使用Date.parse
					const timestamp = Date.parse(dateStr);
					if (!isNaN(timestamp)) {
						return new Date(timestamp);
					}

					return null;
				} catch (error) {
					return null;
				}
			},

			isToday(dateString) {
				if (!dateString) return false;

				const today = this.createCurrentDate();
				const appointmentDate = this.createSafeDate(dateString);

				// 检查日期是否有效
				if (!appointmentDate || isNaN(appointmentDate.getTime())) {
					return false;
				}

				// 重置时间为当天开始，只比较日期部分
				const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
				const appointmentStart = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(),
					appointmentDate.getDate());

				return todayStart.getTime() === appointmentStart.getTime();
			},

			isYesterday(dateString) {
				if (!dateString) return false;

				const today = this.createCurrentDate();
				const yesterday = this.createCurrentDate();
				yesterday.setDate(yesterday.getDate() - 1);

				const appointmentDate = this.createSafeDate(dateString);

				// 检查日期是否有效
				if (!appointmentDate || isNaN(appointmentDate.getTime())) {
					return false;
				}

				// 重置时间为当天开始，只比较日期部分
				const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
				const appointmentStart = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(),
					appointmentDate.getDate());

				return yesterdayStart.getTime() === appointmentStart.getTime();
			},
			// 检查日期是否在指定天数范围内（不含今天和昨天）
			isWithinDays(dateString, days) {
				// 使用parseDate方法解析日期，确保iOS兼容性
				const date = this.parseDate(dateString);
				if (!date) return false;

				const today = new Date();
				const diffTime = date.getTime() - today.getTime();
				const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

				// 确保不包括今天和昨天，且在指定天数范围内
				return diffDays > 1 && diffDays <= days;
			},
			// 更新统计数据
			updateStatistics() {
				// 始终基于当前显示的数据计算统计（validPendingList）
				const list = this.validPendingList || [];

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

				// 如果没有数据，使用模拟数据进行测试
				if (this.statistics.total === 0) {
					console.log('使用模拟统计数据');
					this.statistics.total = 45;
					this.statistics.pending = 15;
					this.statistics.approved = 28;
					this.statistics.rejected = 2;
					this.statistics.entered = 23;
					this.statistics.exited = 5;
					this.statistics.urgent = 3;
				}

				// 只在调试模式下输出日志
				if (this.debugMode) {
					console.log('updateStatistics:', this.statistics, 'list length:', list.length);
				}
			},
			// 按申请状态快速筛选
			quickFilterByStatus(status) {
				this.loading = true;

				setTimeout(() => {
					if (status === '全部') {
						this.pendingList = [...this.originalList];
						this.current1 = 0; // 更新选中的标签
						this.isFiltering = false; // 显示全部时不是筛选状态
					} else {
						this.pendingList = this.originalList.filter(item => item.status === status);

						// 更新对应的标签索引
						const statusMap = {
							'待审批': 1,
							'已通过': 2,
							'未通过': 3
						};
						this.current1 = statusMap[status] || 0;
						this.isFiltering = true; // 按状态筛选时是筛选状态
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
					this.isFiltering = true; // 按车辆状态筛选时是筛选状态

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
				const date = this.parseDate(timeStr);
				if (!date) return timeStr;
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
			async refreshList() {
				this.loading = true;

				try {
					// 重新加载数据
					await this.loadAppointmentData();

					// 重置到全部状态
					this.current1 = 0;
					this.selectedTimeRange = null;
					this.quickTimeRange = null;
					this.quickStatusFilter = [];
					this.quickVehicleFilter = [];
					this.isFiltering = false; // 刷新时重置筛选状态
					this.pendingList = [...this.originalList];

					// 显示刷新成功提示
					uni.showToast({
						title: '刷新成功',
						icon: 'success',
						duration: 1500
					});
				} catch (error) {
					console.error('❌ 刷新数据失败:', error);
					uni.showToast({
						title: '刷新失败',
						icon: 'none',
						duration: 1500
					});
				} finally {
					this.loading = false;
				}
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
					this.quickTimeRange = 1; // 设置为今日
					this.quickStatusFilter = [];
					this.quickVehicleFilter = [];

					this.loading = false;

					uni.showToast({
						title: `找到${this.pendingList.length}条今日记录`,
						icon: 'success',
						duration: 1500
					});
				}, 300);
			},

			// 筛选今日待审批
			filterTodayPending() {
				this.loading = true;

				// 清除其他筛选条件
				this.quickTimeRange = 1; // 今日
				this.quickStatusFilter = ['待审批'];
				this.quickVehicleFilter = [];

				// 应用筛选
				this.applyCurrentFilters();

				// 滚动到列表区域
				setTimeout(() => {
					uni.pageScrollTo({
						selector: '.records-title-section',
						duration: 300
					});
				}, 500);
			},

			// 筛选在场车辆
			filterVehicleOnSite() {
				this.loading = true;

				// 清除其他筛选条件
				this.quickTimeRange = null;
				this.quickStatusFilter = ['已通过'];
				this.quickVehicleFilter = ['已进场'];

				// 应用筛选
				this.applyCurrentFilters();

				// 滚动到列表区域
				setTimeout(() => {
					uni.pageScrollTo({
						selector: '.records-title-section',
						duration: 300
					});
				}, 500);
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
				const currentX = e.touches[0].clientX;
				const currentY = e.touches[0].clientY;
				const deltaX = currentX - this.touchStartX;
				const deltaY = currentY - this.touchStartY;

				// 判断是否为右滑手势（从左边缘开始）
				if (this.touchStartX < 50 && deltaX > 80 && Math.abs(deltaY) < 100) {
					this.isSwiping = true;

					// 如果滑动距离足够，滚动到筛选区域
					if (deltaX > 120) {
						this.scrollToFilter();
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



			// 设置快速时间范围
			setQuickTimeRange(days) {
				this.quickTimeRange = days;
				// 自动应用筛选
				this.applyCurrentFilters();
			},

			// 方案三：抽屉式筛选方法

			// 获取当前筛选描述
			getCurrentFilterDescription() {
				let description = [];

				// 时间筛选描述
				if (this.quickTimeRange !== null) {
					if (this.quickTimeRange === 1) {
						description.push('今日');
					} else if (this.quickTimeRange === 'yesterday') {
						description.push('昨日');
					} else if (this.quickTimeRange === 3) {
						description.push('近三天');
					} else if (this.quickTimeRange === 7) {
						description.push('近一周');
					}
				}

				// 状态筛选描述
				if (this.quickStatusFilter.length > 0) {
					description.push(this.quickStatusFilter.join('、'));
				}

				// 车辆状态筛选描述
				if (this.quickVehicleFilter.length > 0) {
					description.push(this.quickVehicleFilter.join('、'));
				}

				if (description.length === 0) {
					return '当前显示全部记录';
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

				switch (presetKey) {
					case 'todayPending':
						filteredList = filteredList.filter(item => {
							return item.status === '待审批' && this.isToday(item.appointmentTime);
						});
						break;
					case 'weekApproved':
						const weekAgo = new Date();
						weekAgo.setDate(weekAgo.getDate() - 7);
						filteredList = filteredList.filter(item => {
							const itemDate = this.parseDate(item.appointmentTime);
							return item.status === '已通过' && itemDate && itemDate >= weekAgo;
						});
						break;
					case 'allRecords':
						// 显示全部记录，不做筛选
						break;
					default:
						this.currentPreset = null;
						break;
				}

				// 按预约时间倒序排序（预约时间越晚的越在前面）
				filteredList.sort((a, b) => {
					const timeA = this.parseDate(a.appointmentTime || '')?.getTime() || 0;
					const timeB = this.parseDate(b.appointmentTime || '')?.getTime() || 0;
					return timeB - timeA; // 倒序排序，时间越晚的越靠前
				});

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
								const itemDate = this.parseDate(item.appointmentTime);
								return itemDate && itemDate >= startDate && itemDate <= now;
							});
						}
					}

					// 按预约时间倒序排序（预约时间越晚的越在前面）
					filteredList.sort((a, b) => {
						const timeA = this.parseDate(a.appointmentTime || '')?.getTime() || 0;
						const timeB = this.parseDate(b.appointmentTime || '')?.getTime() || 0;
						return timeB - timeA; // 倒序排序，时间越晚的越靠前
					});

					this.pendingList = filteredList;
					this.isFiltering = true; // 高级筛选时设置为筛选状态
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

				// 重置统一筛选状态
				this.quickTimeRange = null;
				this.quickStatusFilter = [];
				this.quickVehicleFilter = [];

				// 重置其他筛选状态
				this.resetAdvancedFilter();

				setTimeout(() => {
					this.list = [...this.originalList];
					this.isFiltering = false;
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
				const dataSource = this.originalList && this.originalList.length > 0 ? this.originalList : this
					.validPendingList;
				const count = dataSource.filter(item =>
					item.status === '待审批' && this.isToday(item.appointmentTime)
				).length;
				// 只在调试模式下输出日志
				if (this.debugMode) {
					console.log('getTodayPendingCount:', count);
				}
				return count;
			},

			getWeekApprovedCount() {
				const weekAgo = new Date();
				weekAgo.setDate(weekAgo.getDate() - 7);
				return this.originalList.filter(item => {
					const itemDate = this.parseDate(item.appointmentTime);
					return item.status === '已通过' && itemDate && itemDate >= weekAgo;
				}).length;
			},

			getAllRecordsCount() {
				return this.originalList.length;
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
							const itemDate = this.parseDate(item.appointmentTime);
							return itemDate && itemDate >= startDate;
						});
					}
				}

				return count.length;
			},

			// 获取指定状态的记录数量
			getStatusCount(status) {
				return this.originalList.filter(item => item.status === status).length;
			},

			// 获取指定时间范围的记录数量
			getTimeCount(timeRange) {
				if (timeRange === null) {
					return this.originalList.length;
				}

				const startDate = new Date();
				startDate.setDate(startDate.getDate() - timeRange);

				return this.originalList.filter(item => {
					const itemDate = this.parseDate(item.appointmentTime);
					return itemDate && itemDate >= startDate;
				}).length;
			},

			// 切换状态筛选（改为单选）
			toggleStatusFilter(status) {
				// 确保 quickStatusFilter 是数组
				if (!Array.isArray(this.quickStatusFilter)) {
					this.quickStatusFilter = [];
				}

				const index = this.quickStatusFilter.indexOf(status);
				if (index > -1) {
					// 如果已选中，则取消选择
					this.quickStatusFilter.splice(index, 1);
				} else {
					// 审批状态是互斥的，只能选择一个
					this.quickStatusFilter = [status];
				}

				// 强制更新视图
				this.$forceUpdate();

				// 自动应用筛选
				this.applyCurrentFilters();
			},

			// 切换车辆状态筛选（互斥选择）
			toggleVehicleFilter(vehicleStatus) {
				const index = this.quickVehicleFilter.indexOf(vehicleStatus);
				if (index > -1) {
					// 如果已选中，则取消选择
					this.quickVehicleFilter.splice(index, 1);
				} else {
					// 车辆状态是互斥的，只能选择一个
					this.quickVehicleFilter = [vehicleStatus];
				}
				// 自动应用筛选
				this.applyCurrentFilters();
			},

			// 清除状态筛选
			clearStatusFilter() {
				this.quickStatusFilter = [];
				// 自动应用筛选
				this.applyCurrentFilters();
			},

			// 清除车辆状态筛选
			clearVehicleFilter() {
				this.quickVehicleFilter = [];
				// 自动应用筛选
				this.applyCurrentFilters();
			},

			// 滚动到筛选区域
			scrollToFilter() {
				// 使用 uni.pageScrollTo 滚动到筛选区域
				uni.pageScrollTo({
					selector: '.unified-filter-container',
					duration: 300
				});
			},

			// 应用当前筛选
			applyCurrentFilters() {
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
						} else if (this.quickTimeRange === 'yesterday') {
							// 昨日
							start.setDate(start.getDate() - 1);
							start.setHours(0, 0, 0, 0);
							end.setDate(end.getDate() - 1);
							end.setHours(23, 59, 59, 999);
						} else {
							// 近N天
							start.setDate(start.getDate() - this.quickTimeRange);
						}

						filteredList = filteredList.filter(item => {
							const itemTime = this.parseDate(item.appointmentTime);
							return itemTime && itemTime >= start && itemTime <= end;
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
							return this.quickVehicleFilter.includes(item.vehicleStatus);
						});
					}

					// 修复：应该更新 pendingList 而不是 list
					this.pendingList = filteredList;
					this.updateStatistics();
					this.loading = false;

					uni.showToast({
						title: `筛选完成，共${filteredList.length}条记录`,
						icon: 'none',
						duration: 1500
					});
				}, 300);
			},

			// 获取今日数据数量
			getTodayCount() {
				const today = this.createCurrentDate();
				today.setHours(0, 0, 0, 0);
				const tomorrow = this.createCurrentDate();
				tomorrow.setTime(today.getTime());
				tomorrow.setDate(tomorrow.getDate() + 1);

				return this.originalList.filter(item => {
					const itemTime = this.parseDate(item.appointmentTime);
					return itemTime && itemTime >= today && itemTime < tomorrow;
				}).length;
			},

			// 获取昨日数据数量
			getYesterdayCount() {
				const yesterday = new Date();
				yesterday.setDate(yesterday.getDate() - 1);
				yesterday.setHours(0, 0, 0, 0);
				const today = new Date();
				today.setHours(0, 0, 0, 0);

				return this.originalList.filter(item => {
					const itemTime = this.parseDate(item.appointmentTime);
					return itemTime && itemTime >= yesterday && itemTime < today;
				}).length;
			},

			// 获取时间范围内数据数量
			getTimeRangeCount(days) {
				const end = new Date();
				const start = new Date();
				start.setDate(start.getDate() - days);

				return this.originalList.filter(item => {
					const itemTime = this.parseDate(item.appointmentTime);
					return itemTime && itemTime >= start && itemTime <= end;
				}).length;
			},

			// 获取未进场车辆数量
			getUnenteredCount() {
				return this.originalList.filter(item => {
					return item.vehicleStatus === '未进场' || !item.vehicleStatus;
				}).length;
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
					// 当搜索框清空时，重置查询数据
					this.showSuggestions = false;
					this.searchSuggestions = [];
					this.resetToOriginalData();
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
					const typeOrder = {
						'plate': 1,
						'name': 2,
						'phone': 3
					};
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
					this.isFiltering = false;
					this.updateStatistics();
					return;
				}

				const keyword = this.searchKeyword.toLowerCase().trim();

				// 搜索匹配项
				let filteredList = this.originalList.filter(item => {
					return (
						(item.plateNumber && item.plateNumber.toLowerCase().includes(keyword)) ||
						(item.phone && item.phone.includes(keyword)) ||
						(item.name && item.name.toLowerCase().includes(keyword)) ||
						(item.addressDetail && item.addressDetail.toLowerCase().includes(keyword))
					);
				});

				// 按预约时间倒序排序（预约时间越晚的越在前面）
				filteredList.sort((a, b) => {
					const timeA = this.parseDate(a.appointmentTime || '')?.getTime() || 0;
					const timeB = this.parseDate(b.appointmentTime || '')?.getTime() || 0;
					return timeB - timeA; // 倒序排序，时间越晚的越靠前
				});

				this.pendingList = filteredList;
				this.isFiltering = true; // 搜索时设置为筛选状态
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
				this.resetToOriginalData();
			},

			// 重置到原始数据
			resetToOriginalData() {
				// 复制原始数据并按预约时间倒序排序
				let sortedList = [...this.originalList];
				sortedList.sort((a, b) => {
					const timeA = this.parseDate(a.appointmentTime || '')?.getTime() || 0;
					const timeB = this.parseDate(b.appointmentTime || '')?.getTime() || 0;
					return timeB - timeA; // 倒序排序，时间越晚的越靠前
				});

				this.pendingList = sortedList;
				this.isFiltering = false; // 清除搜索时重置筛选状态
				this.updateStatistics();

				// 显示重置提示
				if (this.isFiltering) {
					uni.showToast({
						title: '已重置数据',
						icon: 'success',
						duration: 1000
					});
				}
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

			// 从当前数据中提取常见关键词
			extractCommonKeywords() {
				const keywords = [];

				// 提取车牌号前缀（如：黑A、京B等）
				const platePrefix = new Set();
				this.originalList.forEach(item => {
					if (item.plateNumber && item.plateNumber.length >= 2) {
						const prefix = item.plateNumber.substring(0, 2);
						platePrefix.add(prefix);
					}
				});

				// 提取常见姓氏
				const surnames = new Set();
				this.originalList.forEach(item => {
					if (item.ownerName && item.ownerName.length >= 1) {
						const surname = item.ownerName.substring(0, 1);
						if (/[\u4e00-\u9fa5]/.test(surname)) { // 中文字符
							surnames.add(surname);
						}
					}
				});

				// 提取手机号前缀
				const phonePrefix = new Set();
				this.originalList.forEach(item => {
					if (item.visitorPhone && item.visitorPhone.length >= 3) {
						const prefix = item.visitorPhone.substring(0, 3);
						phonePrefix.add(prefix);
					}
				});

				// 添加状态关键词
				const statusKeywords = ['待审批', '已通过', '未通过'];

				// 合并所有关键词
				keywords.push(...Array.from(platePrefix));
				keywords.push(...Array.from(surnames));
				keywords.push(...Array.from(phonePrefix));
				keywords.push(...statusKeywords);

				return keywords;
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

								try {
									// 调用API审核
									const response = await appointmentAPI.audit({
										id: item.id,
										auditstatus: '已通过',
										refusereason: '滑动操作审核通过',
										auditusername: '管家', // 可以从用户信息中获取
										auditdate: this.formatDateForBackend(this.createCurrentDate())
									});

									// 检查响应状态
									if (response && (response.code === 0 || response.code === '0' || response.code ===
											null || response.code === undefined)) {
										// 更新状态
										item.status = '已通过';
										item.auditstatus = '已通过';
										this.updateStatistics();

										uni.hideLoading();
										uni.showToast({
											title: '审核通过成功',
											icon: 'success',
											duration: 2000
										});
									} else {
										uni.hideLoading();
										uni.showToast({
											title: '审核失败: ' + (response?.msg || '未知错误'),
											icon: 'error',
											duration: 2000
										});
									}
								} catch (error) {
									uni.hideLoading();
									console.error('审核失败:', error);
									uni.showToast({
										title: '审核失败: ' + (error.message || '网络错误'),
										icon: 'error',
										duration: 2000
									});
								}
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

								try {
									// 调用API审核
									const response = await appointmentAPI.audit({
										id: item.id,
										auditstatus: '未通过',
										refusereason: '滑动操作审核拒绝',
										auditusername: '管家', // 可以从用户信息中获取
										auditdate: this.formatDateForBackend(this.createCurrentDate())
									});

									// 检查响应状态
									if (response && (response.code === 0 || response.code === '0' || response.code ===
											null || response.code === undefined)) {
										// 更新状态
										item.status = '未通过';
										item.auditstatus = '未通过';
										this.updateStatistics();

										uni.hideLoading();
										uni.showToast({
											title: '申请已拒绝',
											icon: 'success',
											duration: 2000
										});
									} else {
										uni.hideLoading();
										uni.showToast({
											title: '拒绝失败: ' + (response?.msg || '未知错误'),
											icon: 'error',
											duration: 2000
										});
									}
								} catch (error) {
									uni.hideLoading();
									console.error('拒绝失败:', error);
									uni.showToast({
										title: '拒绝失败: ' + (error.message || '网络错误'),
										icon: 'error',
										duration: 2000
									});
								}
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
			async confirmApprove(item, index) {
				try {
					const result = await uni.showModal({
						title: '确认通过',
						content: `确定要通过 ${item.plateNumber} 的申请吗？`,
						confirmText: '确认通过',
						confirmColor: '#19be6b',
						cancelColor: '#909399'
					});

					if (result.confirm) {
						uni.showLoading({
							title: '审核中...',
							mask: true
						});

						try {
							// 调用API审核
							const response = await appointmentAPI.audit({
								id: item.id,
								auditstatus: '已通过',
								refusereason: '单个审核通过',
								auditusername: '管家', // 可以从用户信息中获取
								auditdate: this.formatDateForBackend(this.createCurrentDate())
							});

							// 检查响应状态
							if (response && (response.code === 0 || response.code === '0' || response.code === null ||
									response.code === undefined)) {
								// 更新本地状态
								item.status = '已通过';
								item.auditstatus = '已通过';
								this.updateStatistics();

								uni.hideLoading();
								uni.showToast({
									title: '审核通过成功',
									icon: 'success',
									duration: 2000
								});
							} else {
								uni.hideLoading();
								uni.showToast({
									title: '审核失败: ' + (response?.msg || '未知错误'),
									icon: 'error',
									duration: 2000
								});
							}
						} catch (error) {
							uni.hideLoading();
							console.error('审核失败:', error);
							uni.showToast({
								title: '审核失败: ' + (error.message || '网络错误'),
								icon: 'error',
								duration: 2000
							});
						}
					}
				} catch (error) {
					console.error('确认通过失败:', error);
				}
			},

			// 确认拒绝
			async confirmReject(item, index) {
				try {
					const result = await uni.showModal({
						title: '确认拒绝',
						content: `确定要拒绝 ${item.plateNumber} 的申请吗？`,
						confirmText: '确认拒绝',
						confirmColor: '#f5222d',
						cancelColor: '#909399'
					});

					if (result.confirm) {
						uni.showLoading({
							title: '拒绝中...',
							mask: true
						});

						try {
							// 调用API审核
							const response = await appointmentAPI.audit({
								id: item.id,
								auditstatus: '未通过',
								refusereason: '单个审核拒绝',
								auditusername: '管家', // 可以从用户信息中获取
								auditdate: this.formatDateForBackend(new Date())
							});

							// 检查响应状态
							if (response && (response.code === 0 || response.code === '0' || response.code === null ||
									response.code === undefined)) {
								// 更新本地状态
								item.status = '未通过';
								item.auditstatus = '未通过';
								this.updateStatistics();

								uni.hideLoading();
								uni.showToast({
									title: '申请已拒绝',
									icon: 'success',
									duration: 2000
								});
							} else {
								uni.hideLoading();
								uni.showToast({
									title: '拒绝失败: ' + (response?.msg || '未知错误'),
									icon: 'error',
									duration: 2000
								});
							}
						} catch (error) {
							uni.hideLoading();
							console.error('拒绝失败:', error);
							uni.showToast({
								title: '拒绝失败: ' + (error.message || '网络错误'),
								icon: 'error',
								duration: 2000
							});
						}
					}
				} catch (error) {
					console.error('确认拒绝失败:', error);
				}
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

			// 切换项目展开/折叠状态
			toggleItemExpand(index) {
				const position = this.expandedItems.indexOf(index);
				if (position > -1) {
					// 已展开，则折叠
					this.expandedItems.splice(position, 1);
				} else {
					// 未展开，则展开
					this.expandedItems.push(index);
				}
			},

			// 展开所有项目
			expandAllItems() {
				this.expandedItems = this.validPendingList.map((_, index) => index);
			},

			// 折叠所有项目
			collapseAllItems() {
				this.expandedItems = [];
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

			// 拨打电话
			callPhone(phone) {
				if (!phone) {
					uni.showToast({
						title: '无效的电话号码',
						icon: 'none',
						duration: 2000
					});
					return;
				}

				uni.makePhoneCall({
					phoneNumber: phone,
					success: () => {
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
			},

			// 获取简短地址（用于折叠状态显示）
			getShortAddress(address) {
				if (!address) return '未知地址';
				// 如果地址太长，截取前20个字符并添加省略号
				if (address.length > 20) {
					return address.substring(0, 20) + '...';
				}
				return address;
			},

			// 获取相对时间描述
			getRelativeTime(appointmentTime) {
				if (!appointmentTime) return '';

				const now = new Date();
				const appointmentDate = new Date(appointmentTime);
				const diffMs = appointmentDate.getTime() - now.getTime();
				const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
				const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

				if (diffDays > 0) {
					return `${diffDays}天后`;
				} else if (diffDays === 0) {
					if (diffHours > 0) {
						return `${diffHours}小时后`;
					} else if (diffHours === 0) {
						return '即将到来';
					} else {
						return '已过期';
					}
				} else {
					return `${Math.abs(diffDays)}天前`;
				}
			},

			// 获取车辆状态样式类
			getVehicleStatusClass(status) {
				const classMap = {
					'已进场': 'status-entered',
					'已离场': 'status-exited',
					'未进场': 'status-not-entered'
				};
				return classMap[status] || 'status-not-entered';
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
				content += `⏰ 预约时间：${item.appointmentTime ? this.formatAppointmentTime(item.appointmentTime) : '未知时间'}\n`;
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
				content += `⏰ 预约时间：${item.appointmentTime ? this.formatAppointmentTime(item.appointmentTime) : '未知时间'}\n`;
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

				console.log('🔘 切换选择状态:', {
					itemId: item.id,
					plateNumber: item.plateNumber,
					isSelected: this.selectedItems.includes(item.id),
					totalSelected: this.selectedItems.length
				});
			},

			// 处理复选框点击事件（防抖处理）
			handleCheckboxClick(item) {
				// 防抖处理，避免重复点击
				if (this.checkboxClickTimer) {
					clearTimeout(this.checkboxClickTimer);
				}

				this.checkboxClickTimer = setTimeout(() => {
					this.toggleItemSelection(item);

					// 震动反馈
					uni.vibrateShort({
						type: 'light'
					});

					this.checkboxClickTimer = null;
				}, 50);
			},

			// 处理复选框触摸开始
			handleCheckboxTouchStart(e) {
				// 阻止事件冒泡
				e.stopPropagation();
			},

			// 处理复选框触摸结束
			handleCheckboxTouchEnd(e) {
				// 阻止事件冒泡
				e.stopPropagation();
			},

			// 处理卡片点击事件
			handleCardClick(item, index) {
				if (this.isMultiSelectMode) {
					// 多选模式下，点击卡片也能选择
					this.handleCheckboxClick(item);
				} else {
					// 非多选模式下，显示详情
					this.showDetailModal(item);
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
			async batchApprove() {
				console.log('🚀 开始批量通过操作');

				const approveItems = this.selectedItems.filter(id => {
					const item = this.validPendingList.find(item => item.id === id);
					return item && item.status === '待审批';
				});

				const totalSelected = this.selectedItems.length;
				const nonPendingCount = totalSelected - approveItems.length;

				console.log(`📊 批量通过统计: 总选择=${totalSelected}, 可审核=${approveItems.length}, 跳过=${nonPendingCount}`);

				if (approveItems.length === 0) {
					uni.showToast({
						title: '没有可通过的申请',
						icon: 'none',
						duration: 1500
					});
					return;
				}

				// 构建提示内容
				let content = `确定要通过选中的 ${approveItems.length} 个申请吗？`;
				if (nonPendingCount > 0) {
					content += `\n\n注意：已选择 ${totalSelected} 项，其中 ${nonPendingCount} 项不是待审批状态，将被跳过。`;
				}

				const result = await uni.showModal({
					title: '批量通过',
					content: content
				});

				if (result.confirm) {
					console.log('✅ 用户确认批量通过操作');

					uni.showLoading({
						title: '批量审核中...',
						mask: true
					});

					try {
						let successCount = 0;
						let failCount = 0;
						const errors = [];

						console.log(`🔄 开始逐个审核 ${approveItems.length} 个申请`);

						// 逐个调用API审核
						for (const id of approveItems) {
							const item = this.validPendingList.find(item => item.id === id);
							if (item) {
								try {
									console.log(`📤 正在审核申请 ID: ${item.id}, 车牌: ${item.plateNumber}`);

									const auditData = {
										id: item.id,
										auditstatus: '已通过',
										refusereason: '批量通过',
										auditusername: '管家', // 可以从用户信息中获取
										auditdate: this.formatDateForBackend(new Date())
									};

									console.log('📋 审核数据:', auditData);

									const response = await appointmentAPI.audit(auditData);

									console.log(`📥 审核响应 ID: ${item.id}`, response);

									// 检查响应状态
									if (response && (response.code === 0 || response.code === '0' || response.code ===
											null || response.code === undefined)) {
										// 更新本地状态
										item.status = '已通过';
										item.auditstatus = '已通过';
										successCount++;

										console.log(`✅ 成功审核 ID: ${item.id}, 当前成功数: ${successCount}`);
									} else {
										console.error(
											`❌ 审核失败 - ID: ${item.id}, 响应状态: ${response?.code}, 消息: ${response?.msg}`
										);
										failCount++;
										errors.push(`${item.plateNumber}: ${response?.msg || '审核失败'}`);
									}
								} catch (error) {
									console.error(`❌ 审核失败 - ID: ${item.id}`, error);
									failCount++;
									errors.push(`${item.plateNumber}: ${error.message || '审核失败'}`);
								}
							}
						}

						uni.hideLoading();
						this.updateStatistics();
						this.exitMultiSelectMode();

						// 构建结果提示
						let successMessage = `成功通过 ${successCount} 个申请`;
						if (failCount > 0) {
							successMessage += `，${failCount} 个失败`;
						}
						if (nonPendingCount > 0) {
							successMessage += `，跳过 ${nonPendingCount} 个非待审批项目`;
						}

						uni.showToast({
							title: successMessage,
							icon: failCount > 0 ? 'none' : 'success',
							duration: 3000
						});

						// 如果有失败的，显示详细错误信息
						if (failCount > 0 && errors.length > 0) {
							setTimeout(() => {
								uni.showModal({
									title: '部分审核失败',
									content: `以下申请审核失败：\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? '\n...' : ''}`,
									showCancel: false
								});
							}, 1000);
						}

					} catch (error) {
						uni.hideLoading();
						console.error('批量审核失败:', error);
						uni.showToast({
							title: '批量审核失败',
							icon: 'error',
							duration: 2000
						});
					}
				}
			},

			// 批量拒绝
			async batchReject() {
				console.log('🚀 开始批量拒绝操作');

				const rejectItems = this.selectedItems.filter(id => {
					const item = this.validPendingList.find(item => item.id === id);
					return item && item.status === '待审批';
				});

				const totalSelected = this.selectedItems.length;
				const nonPendingCount = totalSelected - rejectItems.length;

				console.log(`📊 批量拒绝统计: 总选择=${totalSelected}, 可审核=${rejectItems.length}, 跳过=${nonPendingCount}`);

				if (rejectItems.length === 0) {
					uni.showToast({
						title: '没有可拒绝的申请',
						icon: 'none',
						duration: 1500
					});
					return;
				}

				// 构建提示内容
				let content = `确定要拒绝选中的 ${rejectItems.length} 个申请吗？`;
				if (nonPendingCount > 0) {
					content += `\n\n注意：已选择 ${totalSelected} 项，其中 ${nonPendingCount} 项不是待审批状态，将被跳过。`;
				}

				const result = await uni.showModal({
					title: '批量拒绝',
					content: content
				});

				if (result.confirm) {
					console.log('✅ 用户确认批量拒绝操作');

					uni.showLoading({
						title: '批量拒绝中...',
						mask: true
					});

					try {
						let successCount = 0;
						let failCount = 0;
						const errors = [];

						console.log(`🔄 开始逐个拒绝 ${rejectItems.length} 个申请`);

						// 逐个调用API审核
						for (const id of rejectItems) {
							const item = this.validPendingList.find(item => item.id === id);
							if (item) {
								try {
									console.log(`📤 正在拒绝申请 ID: ${item.id}, 车牌: ${item.plateNumber}`);

									const auditData = {
										id: item.id,
										auditstatus: '未通过',
										refusereason: '批量拒绝',
										auditusername: '管家', // 可以从用户信息中获取
										auditdate: this.formatDateForBackend(new Date())
									};


									const response = await appointmentAPI.audit(auditData);

									console.log(`📥 拒绝响应 ID: ${item.id}`, response);

									// 检查响应状态
									if (response && (response.code === 0 || response.code === '0' || response.code ===
											null || response.code === undefined)) {
										// 更新本地状态
										item.status = '未通过';
										item.auditstatus = '未通过';
										successCount++;

										console.log(`✅ 成功拒绝 ID: ${item.id}, 当前成功数: ${successCount}`);
									} else {
										console.error(
											`❌ 拒绝失败 - ID: ${item.id}, 响应状态: ${response?.code}, 消息: ${response?.msg}`
										);
										failCount++;
										errors.push(`${item.plateNumber}: ${response?.msg || '拒绝失败'}`);
									}
								} catch (error) {
									console.error(`❌ 拒绝失败 - ID: ${item.id}`, error);
									failCount++;
									errors.push(`${item.plateNumber}: ${error.message || '拒绝失败'}`);
								}
							}
						}

						uni.hideLoading();
						this.updateStatistics();
						this.exitMultiSelectMode();

						// 构建结果提示
						let successMessage = `成功拒绝 ${successCount} 个申请`;
						if (failCount > 0) {
							successMessage += `，${failCount} 个失败`;
						}
						if (nonPendingCount > 0) {
							successMessage += `，跳过 ${nonPendingCount} 个非待审批项目`;
						}

						uni.showToast({
							title: successMessage,
							icon: failCount > 0 ? 'none' : 'success',
							duration: 3000
						});

						// 如果有失败的，显示详细错误信息
						if (failCount > 0 && errors.length > 0) {
							setTimeout(() => {
								uni.showModal({
									title: '部分拒绝失败',
									content: `以下申请拒绝失败：\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? '\n...' : ''}`,
									showCancel: false
								});
							}, 1000);
						}

					} catch (error) {
						uni.hideLoading();
						console.error('批量拒绝失败:', error);
						uni.showToast({
							title: '批量拒绝失败',
							icon: 'error',
							duration: 2000
						});
					}
				}
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



			// ==================== 数据工作台相关方法 ====================

			// 切换数据工作台面板
			toggleDataWorkspace() {
				this.showDataWorkspace = !this.showDataWorkspace;
				if (this.vibrationEnabled) {
					uni.vibrateShort();
				}
			},



			// 初始化工作台数据
			initializeVisualizationData() {
				// 简化的初始化，不需要复杂的数据生成
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

			// ==================== 工作台相关方法 ====================

			// 获取紧急处理数量
			getUrgentCount() {
				return this.getOvertimeCount() + this.getExpiringCount();
			},

			// 获取超时待审数量 (>2小时)
			getOvertimeCount() {
				// 这里应该根据实际数据计算，暂时返回模拟数据
				return Math.floor(this.statistics.pending * 0.2);
			},

			// 获取即将到期数量 (1小时内)
			getExpiringCount() {
				// 这里应该根据实际数据计算，暂时返回模拟数据
				return Math.floor(this.statistics.pending * 0.1);
			},

			// 获取进度百分比
			getProgressPercent() {
				if (this.statistics.total === 0) return 0;
				const processed = this.statistics.approved + this.statistics.rejected;
				return Math.round((processed / this.statistics.total) * 100);
			},

			// 获取平均处理时间
			getAverageProcessTime() {
				// 这里应该根据实际数据计算，暂时返回模拟数据
				return '1.2';
			},

			// 获取超时车辆数量
			getOvertimeVehicles() {
				// 这里应该根据实际数据计算，暂时返回模拟数据
				return Math.floor(this.statistics.entered * 0.1);
			},

			// ==================== 数据分析相关方法 ====================

			// 获取趋势数据 (近7天)
			getTrendData() {
				// 这里应该从后端获取真实数据，暂时返回模拟数据
				return [{
						label: '一',
						value: 32
					},
					{
						label: '二',
						value: 45
					},
					{
						label: '三',
						value: 38
					},
					{
						label: '四',
						value: 42
					},
					{
						label: '五',
						value: 35
					},
					{
						label: '六',
						value: 28
					},
					{
						label: '日',
						value: 40
					}
				];
			},

			// 获取趋势最大值
			getMaxTrendValue() {
				const data = this.getTrendData();
				return Math.max(...data.map(item => item.value));
			},

			// 获取通过率百分比
			getApprovedPercent() {
				if (this.statistics.total === 0) return 0;
				return Math.round((this.statistics.approved / this.statistics.total) * 100);
			},

			// 获取待审百分比
			getPendingPercent() {
				if (this.statistics.total === 0) return 0;
				return Math.round((this.statistics.pending / this.statistics.total) * 100);
			},

			// 获取拒绝百分比
			getRejectedPercent() {
				if (this.statistics.total === 0) return 0;
				return Math.round((this.statistics.rejected / this.statistics.total) * 100);
			},

			// 获取审批通过率
			getApprovalRate() {
				const processed = this.statistics.approved + this.statistics.rejected;
				if (processed === 0) return 0;
				return Math.round((this.statistics.approved / processed) * 100);
			},

			// 获取趋势指示器
			getTrendIndicator() {
				// 这里应该根据实际对比数据计算
				return '+12% ↗️';
			},

			// 获取对比文本
			getComparisonText() {
				const diff = this.todayCount - this.yesterdayCount;
				if (diff > 0) {
					return `+${diff} (+${Math.round((diff / this.yesterdayCount) * 100)}%)`;
				} else if (diff < 0) {
					return `${diff} (${Math.round((diff / this.yesterdayCount) * 100)}%)`;
				} else {
					return '持平';
				}
			},

			// ==================== 新增统计方法 ====================





			// 获取昨日待审批数量
			getYesterdayPendingCount() {
				const yesterday = new Date();
				yesterday.setDate(yesterday.getDate() - 1);
				const yesterdayStr = yesterday.toISOString().split('T')[0];

				return this.originalList.filter(item => {
					if (item.status !== '待审批') return false;
					const itemDate = this.parseDate(item.appointmentTime);
					if (!itemDate) return false;
					const itemDateStr = itemDate.toISOString().split('T')[0];
					return itemDateStr === yesterdayStr;
				}).length;
			},

			// 获取周趋势
			getWeeklyTrend() {
				// 模拟数据，实际应该从后端获取
				return 5;
			},

			// 获取今日进场数量
			getTodayEntryCount() {
				const today = new Date();
				const todayStr = today.toISOString().split('T')[0];

				return this.originalList.filter(item => {
					if (!item.entryTime) return false;
					const entryDate = this.parseDate(item.entryTime);
					if (!entryDate) return false;
					const entryDateStr = entryDate.toISOString().split('T')[0];
					return entryDateStr === todayStr;
				}).length;
			},



			// 获取本周数量
			getWeekCount() {
				const today = new Date();
				const weekStart = new Date(today);
				weekStart.setDate(today.getDate() - today.getDay());

				return this.originalList.filter(item => {
					const itemDate = this.parseDate(item.appointmentTime);
					if (!itemDate) return false;
					return itemDate >= weekStart;
				}).length;
			},

			// 获取本周待审批数量
			getWeekPendingCount() {
				const today = new Date();
				const weekStart = new Date(today);
				weekStart.setDate(today.getDate() - today.getDay());

				return this.originalList.filter(item => {
					if (item.status !== '待审批') return false;
					const itemDate = this.parseDate(item.appointmentTime);
					if (!itemDate) return false;
					return itemDate >= weekStart;
				}).length;
			},

			// 获取今日离场数量
			getTodayExitCount() {
				const today = new Date();
				const todayStr = today.toISOString().split('T')[0];

				return this.originalList.filter(item => {
					if (!item.exitTime) return false;
					const exitDate = this.parseDate(item.exitTime);
					if (!exitDate) return false;
					const exitDateStr = exitDate.toISOString().split('T')[0];
					return exitDateStr === todayStr;
				}).length;
			},

			// 获取今日处理数量
			getProcessedTodayCount() {
				const today = new Date();
				const todayStr = today.toISOString().split('T')[0];

				return this.originalList.filter(item => {
					if (item.status === '待审批') return false;
					const itemDate = this.parseDate(item.appointmentTime);
					if (!itemDate) return false;
					const itemDateStr = itemDate.toISOString().split('T')[0];
					return itemDateStr === todayStr;
				}).length;
			},

			// 获取最快处理时间
			getFastestProcessTime() {
				// 模拟数据，实际应该从后端计算
				return '0.5h';
			},

			// 获取最慢处理时间
			getSlowestProcessTime() {
				// 模拟数据，实际应该从后端计算
				return '3.2h';
			},

			// 获取趋势数据（近7天）- 基于真实数据
			getTrendData() {
				const days = [];
				const today = new Date();

				for (let i = 6; i >= 0; i--) {
					const date = new Date(today);
					date.setDate(today.getDate() - i);
					const dateStr = date.toISOString().split('T')[0];

					// 统计当天的审批数据
					let approved = 0;
					let rejected = 0;

					this.originalList.forEach(item => {
						if (!item.appointmentTime) return;

						const appointmentDate = this.parseDate(item.appointmentTime);
						if (!appointmentDate) return;

						const appointmentDateStr = appointmentDate.toISOString().split('T')[0];
						if (appointmentDateStr === dateStr) {
							if (item.status === '已通过') {
								approved++;
							} else if (item.status === '未通过') {
								rejected++;
							}
						}
					});

					days.push({
						label: i === 0 ? '今日' : i === 1 ? '昨日' : `${date.getMonth() + 1}/${date.getDate()}`,
						approved: approved,
						rejected: rejected,
						date: dateStr
					});
				}

				return days;
			},

			// 获取最大日处理量
			getMaxDayCount() {
				const trendData = this.getTrendData();
				let max = 0;
				trendData.forEach(day => {
					const total = day.approved + day.rejected;
					if (total > max) max = total;
				});
				return max || 1;
			},

			// 获取小时流量数据 - 基于真实数据
			getHourlyFlow() {
				// 基于真实的预约数据计算今日各小时的车辆流量
				const today = new Date();
				const todayStr = today.toISOString().split('T')[0];
				const hours = [];

				// 初始化24小时数据
				for (let i = 0; i <= 23; i++) {
					hours.push({
						time: `${i.toString().padStart(2, '0')}:00`,
						count: 0
					});
				}

				// 统计今日各小时的预约数量
				this.originalList.forEach(item => {
					if (!item.appointmentTime) return;

					const appointmentDate = this.parseDate(item.appointmentTime);
					if (!appointmentDate) return;

					const appointmentDateStr = appointmentDate.toISOString().split('T')[0];
					if (appointmentDateStr === todayStr) {
						const hour = appointmentDate.getHours();
						if (hour >= 0 && hour <= 23) {
							hours[hour].count++;
						}
					}
				});

				// 只返回有意义的时间段（6:00-22:00）
				return hours.slice(6, 23);
			},

			// 获取最大小时流量
			getMaxHourCount() {
				const hourlyData = this.getHourlyFlow();
				let max = 0;
				hourlyData.forEach(hour => {
					if (hour.count > max) max = hour.count;
				});
				return max || 1;
			},

			// 饼图相关方法
			getTotalCount() {
				const total = this.statistics.pending + this.statistics.approved + this.statistics.rejected;
				// 只在调试模式下输出日志
				if (this.debugMode) {
					console.log('getTotalCount:', total, this.statistics);
				}
				return total;
			},

			getPendingPercent() {
				const total = this.getTotalCount();
				return total > 0 ? Math.round((this.statistics.pending / total) * 100) : 0;
			},

			getApprovedPercent() {
				const total = this.getTotalCount();
				return total > 0 ? Math.round((this.statistics.approved / total) * 100) : 0;
			},

			getRejectedPercent() {
				const total = this.getTotalCount();
				return total > 0 ? Math.round((this.statistics.rejected / total) * 100) : 0;
			},



			// 处理审批通过
			async handleApprove(item) {
				try {
					uni.showLoading({
						title: '处理中...'
					});

					const response = await appointmentAPI.approveAppointment(item.id);

					if (response.success) {
						// 更新本地数据
						const index = this.validPendingList.findIndex(listItem => listItem.id === item.id);
						if (index !== -1) {
							this.validPendingList[index].status = '已通过';
						}

						// 更新统计数据
						this.updateStatistics();

						uni.hideLoading();
						uni.showToast({
							title: '审批通过',
							icon: 'success'
						});
					}
				} catch (error) {
					uni.hideLoading();
					uni.showToast({
						title: '操作失败',
						icon: 'error'
					});
					console.error('审批通过失败:', error);
				}
			},

			// 处理审批拒绝
			async handleReject(item) {
				try {
					uni.showLoading({
						title: '处理中...'
					});

					const response = await appointmentAPI.rejectAppointment(item.id);

					if (response.success) {
						// 更新本地数据
						const index = this.validPendingList.findIndex(listItem => listItem.id === item.id);
						if (index !== -1) {
							this.validPendingList[index].status = '已拒绝';
						}

						// 更新统计数据
						this.updateStatistics();

						uni.hideLoading();
						uni.showToast({
							title: '审批拒绝',
							icon: 'success'
						});
					}
				} catch (error) {
					uni.hideLoading();
					uni.showToast({
						title: '操作失败',
						icon: 'error'
					});
					console.error('审批拒绝失败:', error);
				}
			},

			// 获取等待紧急程度级别
			getWaitingUrgencyLevel(timeStr) {
				if (!timeStr) return 'normal';
				const appointmentTime = this.parseDate(timeStr);
				if (!appointmentTime) return 'normal';

				const now = new Date();
				const diffMs = now - appointmentTime;
				const diffHours = diffMs / (1000 * 60 * 60);

				if (diffHours > 24) return 'urgent';
				if (diffHours > 12) return 'high';
				if (diffHours > 6) return 'medium';
				return 'normal';
			},

			// 获取等待时长显示
			getWaitingDisplay(timeStr) {
				if (!timeStr) return '未知时间';
				const appointmentTime = this.parseDate(timeStr);
				if (!appointmentTime) return '时间错误';

				const now = new Date();

				// 如果预约时间还未到，显示"即将到来"
				if (appointmentTime > now) {
					return "即将到来";
				}

				// 计算已等待时间
				const diffMs = now - appointmentTime;
				const diffMins = Math.floor(diffMs / 60000);
				const diffHours = Math.floor(diffMins / 60);
				const diffDays = Math.floor(diffHours / 24);

				if (diffDays > 0) {
					return `等待${diffDays}天`;
				} else if (diffHours > 0) {
					return `等待${diffHours}小时`;
				} else if (diffMins > 0) {
					return `等待${diffMins}分钟`;
				} else {
					return '刚刚预约';
				}
			},

			// 获取状态显示信息（用于折叠状态）
			getStatusDisplay(item) {
				const status = item.status || '未知';

				switch (status) {
					case '待审批':
						// 待审批状态显示等待时长
						return this.getWaitingDisplay(item.appointmentTime);
					case '已通过':
						// 已通过状态显示具体的车辆状态
						const vehicleStatus = item.vehicleStatus || '待进场';
						switch (vehicleStatus) {
							case '已进场':
								return '🟢 在场';
							case '已离场':
								return '🔴 已离场';
							case '未进场':
							case '待进场':
							default:
								return '⚪ 待进场';
						}
					case '未通过':
						// 未通过状态显示拒绝原因或时间
						return '❌ 已拒绝';
					default:
						return status;
				}
			},

			// 获取等待时间（用于详细信息）
			getWaitingTime(timeStr) {
				if (!timeStr) return '';
				const appointmentTime = this.parseDate(timeStr);
				if (!appointmentTime) return '';

				const now = new Date();

				// 如果预约时间还未到，显示"即将到来"
				if (appointmentTime > now) {
					return "即将到来";
				}

				// 计算已等待时间
				const diffMs = now - appointmentTime;
				const diffMins = Math.floor(diffMs / 60000);
				const diffHours = Math.floor(diffMins / 60);
				const diffDays = Math.floor(diffHours / 24);

				if (diffDays > 0) {
					return `已等待 ${diffDays} 天`;
				} else if (diffHours > 0) {
					return `已等待 ${diffHours} 小时`;
				} else if (diffMins > 0) {
					return `已等待 ${diffMins} 分钟`;
				} else {
					return '刚刚预约';
				}
			},

			// 复制车牌号
			copyPlateNumber(plateNumber) {
				if (!plateNumber) {
					uni.showToast({
						title: '车牌号为空',
						icon: 'error'
					});
					return;
				}

				uni.setClipboardData({
					data: plateNumber,
					success: () => {
						uni.showToast({
							title: '车牌号已复制',
							icon: 'success',
							duration: 1500
						});
					},
					fail: () => {
						uni.showToast({
							title: '复制失败',
							icon: 'error',
							duration: 1500
						});
					}
				});
			},

			// 拨打电话
			makePhoneCall(phone) {
				if (!phone) {
					uni.showToast({
						title: '暂无联系方式',
						icon: 'none'
					});
					return;
				}
				uni.makePhoneCall({
					phoneNumber: phone,
					fail: (err) => {
						console.error('拨打电话失败:', err);
						uni.showToast({
							title: '拨打失败',
							icon: 'none'
						});
					}
				});
			},

			// 格式化地址显示（用于UI显示，支持截断）
			formatAddress(address) {
				if (!address) return '暂无';
				// 如果地址过长，进行截断
				if (address.length <= 12) return address;
				return address.substring(0, 12) + '...';
			},

			// 格式化地址提示（用于紧凑显示，更短的截断）
			formatAddressHint(address) {
				if (!address) return '';
				// 对于紧凑显示，截断更短
				if (address.length <= 8) return address;
				return address.substring(0, 8) + '...';
			},

			// 获取等待时间
			getWaitingTime(appointmentTime) {
				if (!appointmentTime) return '';

				const now = new Date();
				const appointmentDate = new Date(appointmentTime);
				const diffMs = now.getTime() - appointmentDate.getTime();
				const diffMins = Math.floor(diffMs / (1000 * 60));
				const diffHours = Math.floor(diffMins / 60);
				const diffDays = Math.floor(diffHours / 24);

				if (diffDays > 0) {
					return `等待${diffDays}天`;
				} else if (diffHours > 0) {
					return `等待${diffHours}小时`;
				} else if (diffMins > 0) {
					return `等待${diffMins}分钟`;
				} else {
					return '刚刚提交';
				}
			},

			// 格式化手机号
			formatPhoneNumber(phone) {
				if (!phone) return '暂无手机号';
				// 简单的手机号格式化，中间用*号隐藏
				if (phone.length === 11) {
					return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
				}
				return phone;
			},

			// 拨打电话
			makePhoneCall(phone) {
				if (!phone) {
					uni.showToast({
						title: '手机号为空',
						icon: 'error'
					});
					return;
				}

				uni.makePhoneCall({
					phoneNumber: phone,
					fail: (err) => {
						console.error('拨打电话失败:', err);
						uni.showToast({
							title: '拨打失败',
							icon: 'error'
						});
					}
				});
			},

			// ==================== 新增数据分析方法 ====================

			// 展开/收起控制方法
			toggleTrendExpand() {
				this.trendExpanded = !this.trendExpanded;
				// 只在调试模式下输出日志
				if (this.debugMode) {
					console.log('toggleTrendExpand:', this.trendExpanded);
					console.log('weeklyStats:', this.weeklyStats);
					console.log('getTrendChartData:', this.getTrendChartData());
				}

				uni.showToast({
					title: this.trendExpanded ? '已展开趋势详情' : '已收起趋势详情',
					icon: 'none',
					duration: 1000
				});
			},

			toggleUrgentExpand() {
				this.urgentExpanded = !this.urgentExpanded;
			},

			toggleEfficiencyExpand() {
				this.efficiencyExpanded = !this.efficiencyExpanded;
			},

			toggleDistributionExpand() {
				this.distributionExpanded = !this.distributionExpanded;
			},

			// 获取近7天数据（优化版本，减少日志输出）
			getLast7DaysData() {
				// 使用缓存版本
				return this.cachedLast7DaysData;
			},

			// 获取近7天数据（内部实现）
			getLast7DaysDataInternal() {
				const days = [];
				const today = this.createCurrentDate();

				// 使用 originalList 确保获取所有数据
				const dataSource = this.originalList && this.originalList.length > 0 ? this.originalList : this
					.validPendingList;

				// 如果没有数据，返回模拟数据用于测试
				if (!dataSource || dataSource.length === 0) {
					// 只在第一次使用模拟数据时输出日志
					if (!this._mockDataLogged) {
						console.log('使用模拟数据进行测试');
						this._mockDataLogged = true;
					}
					return [{
							date: this.formatDateForComparison(this.createSafeDate(today.getTime() - 6 * 24 * 60 * 60 *
								1000)),
							approved: 5,
							rejected: 1,
							total: 6
						},
						{
							date: this.formatDateForComparison(this.createSafeDate(today.getTime() - 5 * 24 * 60 * 60 *
								1000)),
							approved: 8,
							rejected: 2,
							total: 10
						},
						{
							date: this.formatDateForComparison(this.createSafeDate(today.getTime() - 4 * 24 * 60 * 60 *
								1000)),
							approved: 12,
							rejected: 1,
							total: 13
						},
						{
							date: this.formatDateForComparison(this.createSafeDate(today.getTime() - 3 * 24 * 60 * 60 *
								1000)),
							approved: 15,
							rejected: 3,
							total: 18
						},
						{
							date: this.formatDateForComparison(this.createSafeDate(today.getTime() - 2 * 24 * 60 * 60 *
								1000)),
							approved: 9,
							rejected: 1,
							total: 10
						},
						{
							date: this.formatDateForComparison(this.createSafeDate(today.getTime() - 1 * 24 * 60 * 60 *
								1000)),
							approved: 6,
							rejected: 0,
							total: 6
						},
						{
							date: this.formatDateForComparison(this.createCurrentDate()),
							approved: 3,
							rejected: 2,
							total: 5
						}
					];
				}

				for (let i = 6; i >= 0; i--) {
					const date = this.createCurrentDate();
					date.setTime(today.getTime());
					date.setDate(date.getDate() - i);
					const dateStr = this.formatDateForComparison(date);

					const dayData = dataSource.filter(item => {
						if (!item.appointmentTime && !item.recordTime) return false;
						const itemDate = this.formatDateForComparison(this.createSafeDate(item.appointmentTime ||
							item.recordTime));
						return itemDate === dateStr;
					});

					const approved = dayData.filter(item => item.status === '已通过').length;
					const rejected = dayData.filter(item => item.status === '未通过').length;

					days.push({
						date: dateStr,
						approved,
						rejected,
						total: dayData.length
					});
				}

				// 只在调试模式下输出日志
				if (this.debugMode) {
					console.log('getLast7DaysData:', days);
				}
				return days;
			},

			// 获取趋势图表数据
			getTrendChartData() {
				const daysData = this.getLast7DaysData();
				const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

				return daysData.map((day, index) => {
					const date = new Date();
					date.setDate(date.getDate() - (6 - index));

					// 计算趋势
					let trend = '';
					if (index > 0) {
						const prevDay = daysData[index - 1];
						const currentTotal = day.approved + day.rejected;
						const prevTotal = prevDay.approved + prevDay.rejected;

						if (currentTotal > prevTotal) {
							trend = '↗';
						} else if (currentTotal < prevTotal) {
							trend = '↘';
						} else {
							trend = '→';
						}
					}

					return {
						date: day.date,
						approved: day.approved,
						rejected: day.rejected,
						label: `${date.getMonth() + 1}/${date.getDate()}`,
						shortDate: dayNames[date.getDay()],
						trend
					};
				});
			},

			// 获取柱状图高度
			getBarHeight(value, type) {
				const maxValue = this.getMaxTrendValue();
				const baseHeight = this.trendExpanded ? 160 : 100;
				const minHeight = 8; // 最小高度，确保即使数据为0也有一点显示

				if (value === 0) {
					return minHeight + 'rpx';
				}

				const height = maxValue > 0 ? Math.max((value / maxValue * baseHeight), minHeight) : minHeight;
				return height + 'rpx';
			},

			// 获取趋势图最大值
			getMaxTrendValue() {
				const data = this.getTrendChartData();
				let maxValue = 0;
				data.forEach(day => {
					const dayMax = Math.max(day.approved, day.rejected);
					if (dayMax > maxValue) {
						maxValue = dayMax;
					}
				});
				return Math.max(maxValue, 5); // 设置最小值为5，确保有合理的比例
			},

			// 计算平均处理时间
			calculateAvgProcessTime() {
				const processedItems = this.originalList.filter(item =>
					(item.status === '已通过' || item.status === '未通过') &&
					item.auditdate && item.appointmentTime
				);

				if (processedItems.length === 0) return 0;

				const totalHours = processedItems.reduce((sum, item) => {
					const appointmentTime = new Date(item.appointmentTime);
					const auditTime = new Date(item.auditdate);
					const diffHours = (auditTime - appointmentTime) / (1000 * 60 * 60);
					return sum + Math.max(diffHours, 0);
				}, 0);

				return Math.round((totalHours / processedItems.length) * 10) / 10;
			},

			// 获取趋势洞察
			getTrendInsight() {
				const data = this.getTrendChartData();
				const recentDays = data.slice(-3); // 最近3天
				const totalRecent = recentDays.reduce((sum, day) => sum + day.approved + day.rejected, 0);
				const avgRecent = totalRecent / 3;

				if (avgRecent > 10) {
					return '📈 趋势分析: 最近处理量较高，工作效率良好';
				} else if (avgRecent > 5) {
					return '📊 趋势分析: 处理量适中，保持稳定节奏';
				} else {
					return '📉 趋势分析: 处理量较少，可关注是否有积压';
				}
			},

			// 按日期筛选
			filterByTrendDate(dateStr) {
				// 只在调试模式下输出日志
				if (this.debugMode) {
					console.log('filterByTrendDate called with:', dateStr);
					console.log('originalList length:', this.originalList.length);
				}

				// 筛选指定日期的数据
				const dataSource = this.originalList && this.originalList.length > 0 ? this.originalList : this
					.validPendingList;
				const filteredData = dataSource.filter(item => {
					if (!item.appointmentTime && !item.recordTime) return false;
					const itemDate = this.formatDateForComparison(new Date(item.appointmentTime || item
						.recordTime));
					return itemDate === dateStr;
				});

				console.log('filteredData length:', filteredData.length);
				this.pendingList = filteredData;
				this.updateStatistics();

				uni.showToast({
					title: `已筛选${dateStr}的数据(${filteredData.length}条)`,
					icon: 'none',
					duration: 2000
				});
			},

			// 格式化日期用于比较
			formatDateForComparison(date) {
				const year = date.getFullYear();
				const month = (date.getMonth() + 1).toString().padStart(2, '0');
				const day = date.getDate().toString().padStart(2, '0');
				return `${year}-${month}-${day}`;
			},

			// 工作效率分析相关方法
			getTopPeakHours() {
				const hourlyStats = this.calculateHourlyStats();
				return hourlyStats
					.sort((a, b) => b.count - a.count)
					.slice(0, 3)
					.map(hour => ({
						...hour,
						efficiency: this.calculateHourEfficiency(hour)
					}));
			},

			calculateHourlyStats() {
				const hourlyData = {};

				// 初始化24小时数据
				for (let i = 0; i < 24; i++) {
					hourlyData[i] = {
						hour: i,
						count: 0,
						approved: 0,
						rejected: 0
					};
				}

				// 统计每小时的处理数据
				this.originalList.forEach(item => {
					if (item.auditdate) {
						const hour = new Date(item.auditdate).getHours();
						if (hourlyData[hour]) {
							hourlyData[hour].count++;
							if (item.status === '已通过') {
								hourlyData[hour].approved++;
							} else if (item.status === '未通过') {
								hourlyData[hour].rejected++;
							}
						}
					}
				});

				// 只返回有数据的小时
				return Object.values(hourlyData).filter(hour => hour.count > 0);
			},

			calculateHourEfficiency(hourData) {
				if (hourData.count === 0) return 0;
				const processed = hourData.approved + hourData.rejected;
				return processed > 0 ? Math.round((hourData.approved / processed) * 100) : 0;
			},

			filterByHour(hour) {
				const filteredData = this.originalList.filter(item => {
					if (item.auditdate) {
						const itemHour = new Date(item.auditdate).getHours();
						return itemHour === hour;
					}
					return false;
				});

				this.pendingList = filteredData;

				uni.showToast({
					title: `已筛选${hour}:00时段的数据(${filteredData.length}条)`,
					icon: 'none',
					duration: 2000
				});
			},

			getPendingAlerts() {
				const alerts = [];

				// 超时预警
				const overtimeCount = this.getOvertimePendingCount();
				if (overtimeCount > 0) {
					alerts.push({
						id: 'overtime',
						message: `有${overtimeCount}个申请超过2小时未处理`,
						type: 'urgent',
						buttonType: 'error',
						buttonText: '立即处理'
					});
				}

				// 今日积压预警
				const todayPending = this.getTodayPendingCount();
				if (todayPending > 10) {
					alerts.push({
						id: 'backlog',
						message: `今日待处理数量较多(${todayPending}个)`,
						type: 'warning',
						buttonType: 'warning',
						buttonText: '批量处理'
					});
				}

				// 效率下降预警
				const todayEfficiency = this.getEfficiencyStats().todayEfficiency;
				if (todayEfficiency < 70 && todayEfficiency > 0) {
					alerts.push({
						id: 'efficiency',
						message: `今日通过率较低(${todayEfficiency}%)`,
						type: 'info',
						buttonType: 'info',
						buttonText: '查看详情'
					});
				}

				return alerts;
			},

			getOvertimePendingCount() {
				const now = new Date();
				const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

				return this.pendingList.filter(item => {
					const appointmentTime = new Date(item.appointmentTime);
					return appointmentTime < twoHoursAgo && (!item.status || item.status === '待审批');
				}).length;
			},

			getWorkSuggestion() {
				const currentHour = new Date().getHours();
				const currentPending = this.getTodayPendingCount();
				const overtimeCount = this.getOvertimePendingCount();

				if (overtimeCount > 0) {
					return `⚡ 建议优先处理${overtimeCount}个超时申请，可考虑批量操作提高效率`;
				} else if (currentPending === 0) {
					return "🎉 当前无待处理事项，工作状态良好！";
				} else if (currentPending > 20) {
					return "📋 建议分批处理，优先处理紧急申请，保持稳定节奏";
				} else if (currentHour >= 17) {
					return "🌅 临近下班时间，建议优先处理紧急申请";
				} else {
					return "📊 建议按时间顺序处理，保持稳定的处理节奏";
				}
			},

			getEfficiencyStats() {
				const today = this.formatDateForComparison(new Date());
				const todayData = this.originalList.filter(item => {
					const itemDate = this.formatDateForComparison(new Date(item.appointmentTime || item
						.recordTime));
					return itemDate === today;
				});

				const todayProcessed = todayData.filter(item =>
					item.status === '已通过' || item.status === '未通过'
				);

				const todayApproved = todayData.filter(item =>
					item.status === '已通过'
				);

				const todayEfficiency = todayProcessed.length > 0 ?
					Math.round((todayApproved.length / todayProcessed.length) * 100) : 0;

				const peakHours = this.getTopPeakHours();
				const peakHour = peakHours.length > 0 ? peakHours[0].hour : 9;

				return {
					todayEfficiency,
					avgProcessTime: this.weeklyStats.avgProcessTime,
					peakHour
				};
			},

			handleAlert(alert) {
				switch (alert.id) {
					case 'overtime':
						// 筛选超时申请
						this.filterOvertimeItems();
						break;
					case 'backlog':
						// 显示批量操作
						this.showBatchOperations();
						break;
					case 'efficiency':
						// 显示效率详情
						this.showEfficiencyDetails();
						break;
				}
			},

			filterOvertimeItems() {
				const now = new Date();
				const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

				const overtimeItems = this.pendingList.filter(item => {
					const appointmentTime = new Date(item.appointmentTime);
					return appointmentTime < twoHoursAgo && (!item.status || item.status === '待审批');
				});

				this.pendingList = overtimeItems;

				uni.showToast({
					title: `已筛选超时申请(${overtimeItems.length}条)`,
					icon: 'none',
					duration: 2000
				});
			},

			showBatchOperations() {
				uni.showToast({
					title: '批量操作功能开发中',
					icon: 'none',
					duration: 2000
				});
			},

			showEfficiencyDetails() {
				this.efficiencyExpanded = true;
				uni.showToast({
					title: '已展开效率详情',
					icon: 'none',
					duration: 1000
				});
			},

			// 状态分布分析相关方法
			filterByStatus(status) {
				// 只在调试模式下输出日志
				if (this.debugMode) {
					console.log('filterByStatus called with:', status);
				}

				const dataSource = this.originalList && this.originalList.length > 0 ? this.originalList : this
					.validPendingList;
				const filteredData = dataSource.filter(item => item.status === status);

				// 只在调试模式下输出日志
				if (this.debugMode) {
					console.log('filterByStatus filteredData length:', filteredData.length);
				}
				this.pendingList = filteredData;
				this.currentStatusFilter = status;
				this.updateStatistics();

				uni.showToast({
					title: `已筛选${status}数据(${filteredData.length}条)`,
					icon: 'none',
					duration: 2000
				});
			},

			showDistributionDetails() {
				this.distributionExpanded = !this.distributionExpanded;
				uni.showToast({
					title: this.distributionExpanded ? '展开详细分析' : '收起详细分析',
					icon: 'none',
					duration: 1000
				});
			},

			getPendingTrend() {
				// 计算待审批数量趋势
				const todayPending = this.getTodayPendingCount();
				const yesterdayPending = this.yesterdayStats.pending;
				const change = todayPending - yesterdayPending;

				if (change > 0) {
					return `↑+${change} vs昨日`;
				} else if (change < 0) {
					return `↓${change} vs昨日`;
				} else {
					return '→持平 vs昨日';
				}
			},

			getApprovedTrend() {
				// 计算已通过数量趋势
				const todayApproved = this.getTodayApprovedCount();
				const yesterdayApproved = this.yesterdayStats.approved;
				const change = todayApproved - yesterdayApproved;

				if (change > 0) {
					return `↑+${change} vs昨日`;
				} else if (change < 0) {
					return `↓${change} vs昨日`;
				} else {
					return '→持平 vs昨日';
				}
			},

			getRejectedTrend() {
				// 计算已拒绝数量趋势
				const todayRejected = this.getTodayRejectedCount();
				const yesterdayRejected = this.yesterdayStats.rejected;
				const change = todayRejected - yesterdayRejected;

				if (change > 0) {
					return `↑+${change} vs昨日`;
				} else if (change < 0) {
					return `↓${change} vs昨日`;
				} else {
					return '→持平 vs昨日';
				}
			},

			getTodayApprovedCount() {
				const today = this.formatDateForComparison(new Date());
				return this.originalList.filter(item => {
					const itemDate = this.formatDateForComparison(new Date(item.appointmentTime || item
						.recordTime));
					return itemDate === today && item.status === '已通过';
				}).length;
			},

			getTodayRejectedCount() {
				const today = this.formatDateForComparison(new Date());
				return this.originalList.filter(item => {
					const itemDate = this.formatDateForComparison(new Date(item.appointmentTime || item
						.recordTime));
					return itemDate === today && item.status === '未通过';
				}).length;
			},

			getDistributionTrendSummary() {
				const approvalRate = this.weeklyStats.approvalRate;
				const todayEfficiency = this.getEfficiencyStats().todayEfficiency;

				if (approvalRate >= 90) {
					return '📈 通过率优秀，工作效率保持高水平';
				} else if (approvalRate >= 80) {
					return '📊 通过率良好，可继续保持当前节奏';
				} else if (approvalRate >= 70) {
					return '📉 通过率一般，建议关注审批质量';
				} else {
					return '⚠️ 通过率偏低，建议优化审批流程';
				}
			},

			getProcessingSpeedImprovement() {
				// 模拟处理速度改进百分比
				const avgProcessTime = this.weeklyStats.avgProcessTime;
				const standardTime = 2.0; // 标准处理时间2小时

				if (avgProcessTime < standardTime) {
					const improvement = Math.round(((standardTime - avgProcessTime) / standardTime) * 100);
					return improvement;
				} else {
					return 0;
				}
			},

			// 获取紧急度等级
			getUrgencyLevel() {
				const total = this.getTotalCount();
				if (total === 0) return 0;

				// 计算待审核的紧急度（基于待审核数量占比）
				const pendingPercent = (this.statistics.pending / total) * 100;
				return Math.min(Math.round(pendingPercent), 100);
			},

			// 紧急待办仪表盘相关方法
			toggleUrgentExpand() {
				this.urgentExpanded = !this.urgentExpanded;
			},

			// 获取仪表盘样式
			gaugeStyle() {
				const urgencyLevel = this.getUrgencyLevel();
				const rotation = (urgencyLevel / 100) * 180; // 0-180度

				let color = '#52c41a'; // 默认绿色
				if (urgencyLevel > 70) {
					color = '#ff4d4f'; // 红色
				} else if (urgencyLevel > 40) {
					color = '#fa8c16'; // 橙色
				}

				return {
					transform: `rotate(${rotation - 90}deg)`,
					borderColor: color,
					borderTopColor: color,
					borderRightColor: color
				};
			},

			// 获取紧急度数据
			getUrgentCategories() {
				return [{
						label: '超时',
						count: 3,
						type: 'urgent',
						icon: '🔴'
					},
					{
						label: '已到达',
						count: 3,
						type: 'warning',
						icon: '🟡'
					},
					{
						label: '今日预约',
						count: 3,
						type: 'normal',
						icon: '🟢'
					},
					{
						label: '其他',
						count: 3,
						type: 'other',
						icon: '⚪'
					}
				];
			},

			// 立即处理
			handleImmediateProcess() {
				uni.showToast({
					title: '正在处理紧急事项...',
					icon: 'loading',
					duration: 2000
				});
			},

			// 获取效率分数
			getEfficiencyScore() {
				const metrics = this.radarMetrics;
				const average = metrics.reduce((sum, item) => sum + item.value, 0) / metrics.length;
				return Math.round(average);
			},

			// 获取高峰时段数据
			getPeakTimeSlots() {
				return [{
						time: '09:00-10:00',
						count: 15,
						percentage: 85
					},
					{
						time: '14:00-15:00',
						count: 12,
						percentage: 70
					},
					{
						time: '16:00-17:00',
						count: 18,
						percentage: 95
					},
					{
						time: '10:00-11:00',
						count: 8,
						percentage: 45
					}
				];
			},

			// 获取改进建议
			getImprovementSuggestions() {
				return [
					'建议在高峰时段增加人手配置',
					'可优化午后14-15点的处理效率',
					'建议对紧急事项设置优先级处理',
					'可考虑引入自动化审批流程'
				];
			},

			// 饼图相关方法
			showDistributionDetails() {
				this.toggleDistributionExpand();
			},

			// 点击图例筛选
			handleLegendClick(status) {
				if (this.currentStatusFilter === status) {
					// 取消筛选
					this.currentStatusFilter = null;
				} else {
					// 应用筛选
					this.currentStatusFilter = status;
				}

				// 模拟筛选操作
				uni.showToast({
					title: this.currentStatusFilter ? `已筛选${status}` : '取消筛选',
					icon: 'none',
					duration: 1500
				});
			},

			// 获取分布数据
			getDistributionData() {
				return [{
						label: '待审批',
						count: 13,
						percent: 29,
						change: '+2 vs昨日',
						type: 'pending'
					},
					{
						label: '已通过',
						count: 31,
						percent: 69,
						change: '+3 vs昨日',
						type: 'approved'
					},
					{
						label: '已拒绝',
						count: 1,
						percent: 2,
						change: '-1 vs昨日',
						type: 'rejected'
					}
				];
			},

			// 修复紧急待办点击报错 - 添加缺失的方法
			filterUrgentItems(category) {
				console.log('筛选紧急事项:', category);
				// 模拟筛选逻辑
				if (category === '超时') {
					this.quickStatusFilter = ['待审批'];
					this.filterByTimeOverdue = true;
				} else if (category === '已到达') {
					this.quickVehicleFilter = ['已进场'];
				} else if (category === '今日预约') {
					this.quickTimeRange = 1;
				}
				this.applyFilters();
				// 显示筛选结果提示
				uni.showToast({
					title: `已筛选${category}事项`,
					icon: 'none',
					duration: 2000
				});
			},

			handleUrgentCategoryClick(item) {
				console.log('点击紧急分类:', item);
				this.filterUrgentItems(item.type);
			},

			// 获取紧急统计数据
			getUrgentStatsData() {
				return [{
						type: '超时',
						icon: '🔴',
						label: '超时待审',
						count: this.getUrgentCount('超时'),
						percentage: Math.min(100, Math.round((this.getUrgentCount('超时') / Math.max(1, this.statistics
							.pending)) * 100)),
						trend: '+2',
						trendType: 'trend-up'
					},
					{
						type: '已到达',
						icon: '🟡',
						label: '访客已到',
						count: this.getUrgentCount('已到达'),
						percentage: Math.min(100, Math.round((this.getUrgentCount('已到达') / Math.max(1, this.statistics
							.entered)) * 100)),
						trend: '+1',
						trendType: 'trend-up'
					},
					{
						type: '今日预约',
						icon: '🟢',
						label: '今日预约',
						count: this.getUrgentCount('今日预约'),
						percentage: Math.min(100, Math.round((this.getUrgentCount('今日预约') / Math.max(1, this
							.getTodayCount())) * 100)),
						trend: '0',
						trendType: 'trend-stable'
					},
					{
						type: '其他',
						icon: '🔵',
						label: '其他待办',
						count: this.getUrgentCount('其他'),
						percentage: Math.min(100, Math.round((this.getUrgentCount('其他') / Math.max(1, this.statistics
							.pending)) * 100)),
						trend: '-1',
						trendType: 'trend-down'
					}
				];
			},

			// 获取紧急度等级文本
			getUrgencyLevelText() {
				const level = this.getUrgencyLevel();
				if (level >= 80) return '高度紧急';
				if (level >= 60) return '中度紧急';
				if (level >= 30) return '低度紧急';
				return '正常';
			},

			// 获取紧急度等级样式类
			getUrgencyLevelClass() {
				const level = this.getUrgencyLevel();
				if (level >= 80) return 'urgency-high';
				if (level >= 60) return 'urgency-medium';
				if (level >= 30) return 'urgency-low';
				return 'urgency-normal';
			},

			// 获取紧急事项总数
			getTotalUrgentCount() {
				return this.getUrgentCount('超时') + this.getUrgentCount('已到达') + this.getUrgentCount('今日预约') + this
					.getUrgentCount('其他');
			},


			// 获取柱状图宽度
			getBarWidth(count) {
				const maxCount = Math.max(...this.getUrgentStatsData().map(item => item.count));
				return maxCount > 0 ? (count / maxCount) * 100 : 0;
			},

			// 获取柱状图颜色类
			getBarColorClass(type) {
				const colorMap = {
					'超时': 'bar-urgent',
					'已到达': 'bar-warning',
					'今日预约': 'bar-normal',
					'其他': 'bar-info'
				};
				return colorMap[type] || 'bar-default';
			},

			// 获取指标等级样式类
			getMetricLevelClass(value) {
				if (value >= 90) return 'level-excellent';
				if (value >= 80) return 'level-good';
				if (value >= 70) return 'level-normal';
				return 'level-poor';
			},

			// 获取指标等级文本
			getMetricLevelText(value) {
				if (value >= 90) return '优秀';
				if (value >= 80) return '良好';
				if (value >= 70) return '一般';
				return '待改进';
			},

			// 获取紧急度进度条数据
			getUrgentProgressData() {
				return [{
						label: '超时申请',
						count: 3,
						total: 10,
						percentage: 30,
						type: 'urgent'
					},
					{
						label: '已到达访客',
						count: 5,
						total: 8,
						percentage: 62,
						type: 'warning'
					},
					{
						label: '今日预约',
						count: 7,
						total: 10,
						percentage: 70,
						type: 'normal'
					}
				];
			}
		},
		watch: {
			pendingList: {
				handler() {
					this.updateStatistics();
				},
				deep: true
			}
		},

		beforeDestroy() {
			// 清理计时器
			if (this.checkboxClickTimer) {
				clearTimeout(this.checkboxClickTimer);
				this.checkboxClickTimer = null;
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

	/* 折叠状态信息样式 */
	.collapsed-info {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 8rpx;

		.time-info {
			display: flex;
			align-items: center;
			font-size: 24rpx;
			color: #666;

			.time-text {
				margin-left: 4rpx;
			}
		}

		.status-tag {
			display: flex;
			align-items: center;
			padding: 4rpx 12rpx;
			border-radius: 12rpx;
			font-size: 22rpx;
			font-weight: 500;

			&.status-pending {
				background: #fff7e6;
				color: #fa8c16;
				border: 1px solid #ffd591;
			}

			&.status-approved {
				background: #f6ffed;
				color: #52c41a;
				border: 1px solid #b7eb8f;
			}

			&.status-rejected {
				background: #fff1f0;
				color: #ff4d4f;
				border: 1px solid #ffccc7;
			}

			&.status-unknown {
				background: #f5f5f5;
				color: #999;
				border: 1px solid #d9d9d9;
			}

			.status-icon {
				margin-right: 4rpx;
			}
		}
	}

	/* 审批操作按钮样式 */
	.approval-status-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;

		.status-badge {
			display: flex;
			align-items: center;
			padding: 6rpx 16rpx;
			border-radius: 16rpx;
			font-size: 24rpx;
			font-weight: 500;

			&.status-pending {
				background: #fff7e6;
				color: #fa8c16;
				border: 1px solid #ffd591;
			}

			&.status-approved {
				background: #f6ffed;
				color: #52c41a;
				border: 1px solid #b7eb8f;
			}

			&.status-rejected {
				background: #fff1f0;
				color: #ff4d4f;
				border: 1px solid #ffccc7;
			}

			&.status-unknown {
				background: #f5f5f5;
				color: #999;
				border: 1px solid #d9d9d9;
			}
		}

		.action-buttons {
			display: flex;
			gap: 12rpx;

			.action-btn {
				display: flex;
				align-items: center;
				padding: 8rpx 16rpx;
				border-radius: 20rpx;
				font-size: 22rpx;
				font-weight: 500;
				transition: all 0.3s ease;

				.btn-icon {
					margin-right: 4rpx;
					font-size: 20rpx;
				}

				&.approve-btn {
					background: linear-gradient(135deg, #52c41a, #73d13d);
					color: #fff;
					box-shadow: 0 4rpx 12rpx rgba(82, 196, 26, 0.3);

					&:active {
						background: linear-gradient(135deg, #389e0d, #52c41a);
						transform: translateY(1rpx);
					}
				}

				&.reject-btn {
					background: linear-gradient(135deg, #ff4d4f, #ff7875);
					color: #fff;
					box-shadow: 0 4rpx 12rpx rgba(255, 77, 79, 0.3);

					&:active {
						background: linear-gradient(135deg, #cf1322, #ff4d4f);
						transform: translateY(1rpx);
					}
				}
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
		padding: 8rpx;
		border-radius: 20rpx 20rpx 0 0;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
		backdrop-filter: blur(10rpx);
	}

	.list-item {
		margin: 3rpx 0;
		border-radius: 16rpx;
		overflow: visible;
		position: relative;
		/* 固定高度确保与左滑操作区匹配 */
		min-height: 120rpx;

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

	/* ==================== 统一筛选布局样式 ==================== */
	.unified-filter-container {
		margin: 24rpx 0;
		padding: 0 24rpx;
		background: #fff;
		border-radius: 16rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
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

	/* 车辆筛选行特殊样式 */
	.vehicle-filters {
		background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
		border-color: rgba(34, 197, 94, 0.1);
		box-shadow: 0 4rpx 16rpx rgba(34, 197, 94, 0.1);
	}

	/* 特殊筛选按钮样式 */
	.special-filter {
		background: linear-gradient(135deg, #fef3c7, #fde68a) !important;
		border-color: #f59e0b !important;
		color: #92400e !important;
	}

	.special-filter.active {
		background: linear-gradient(135deg, #f59e0b, #d97706) !important;
		color: #fff !important;
	}

	.filter-label {
		font-size: 26rpx;
		color: #666;
		font-weight: 600;
		white-space: nowrap;
		margin-right: 16rpx;
		min-width: 80rpx;
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



	.btn-text {
		font-size: 24rpx;
		font-weight: 600;
	}

	.btn-icon {
		font-size: 20rpx;
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

	/* 筛选操作行样式 */
	.filter-actions-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 16rpx;
		padding: 16rpx 20rpx;
		background: linear-gradient(135deg, #f8faff, #e6f7ff);
		border: 1rpx solid #d6e4ff;
		border-radius: 12rpx;
	}

	.current-filter-status {
		flex: 1;
	}

	.filter-action-buttons {
		display: flex;
		gap: 12rpx;
		align-items: center;
	}

	.action-btn {
		padding: 8rpx 16rpx;
		border-radius: 20rpx;
		cursor: pointer;
		transition: all 0.3s ease;
		border: 1rpx solid transparent;
	}

	.clear-btn {
		background: #fff;
		border-color: #d9d9d9;
		color: #666;
	}

	.clear-btn:active {
		background: #f5f5f5;
		transform: scale(0.95);
	}

	.apply-btn {
		background: linear-gradient(135deg, #52c41a, #73d13d);
		color: #fff;
		border-color: #52c41a;
	}

	.apply-btn:active {
		background: linear-gradient(135deg, #389e0d, #52c41a);
		transform: scale(0.95);
	}

	.btn-text {
		font-size: 24rpx;
		font-weight: 500;
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
		font-size: 32rpx;
		font-weight: 600;
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
			white-space: nowrap;

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
		padding: 12rpx !important;
	}

	/* 卡片内容紧凑化 */
	/deep/ .u-card__body {
		padding: 12rpx !important;
	}

	/* 新的卡片内容区域已重新设计 */

	/* 卡片内容区域紧凑化 */
	.card-body {
		padding: 12rpx !important;
		position: relative;
		z-index: 3;
	}

	/* 卡片头部调整 */
	.card-header {
		padding: 12rpx !important;
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
		margin: 8rpx 0;
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
		white-space: nowrap !important;
		overflow: hidden;
		text-overflow: ellipsis;
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
		padding: 12rpx 16rpx;
		margin-bottom: 16rpx;
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
		padding: 14rpx;
		margin-bottom: 12rpx;
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

	/* 统一数据工作台样式 */

	/* 紧急待办仪表盘样式 - 修复遮挡问题 */
	.urgent-dashboard-card {
		.gauge-container {
			display: flex;
			flex-direction: column;
			align-items: center;
			padding: 30rpx 20rpx;
			min-height: 400rpx;
			/* 确保有足够的高度 */
		}

		.gauge-chart {
			position: relative;
			width: 240rpx;
			/* 增加宽度 */
			height: 120rpx;
			/* 增加高度 */
			margin: 30rpx 0;
			/* 增加上下边距 */
			z-index: 10;
			/* 确保在最上层 */
		}

		.gauge-background {
			position: relative;
			width: 100%;
			height: 100%;
			overflow: visible;
			/* 允许内容显示 */
		}

		.gauge-arc {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 200%;
			/* 增加高度以显示完整的半圆 */
			border-radius: 120rpx 120rpx 0 0;
			border: 12rpx solid #f0f0f0;
			/* 增加边框宽度 */
			border-bottom: none;
			transform-origin: center bottom;
			transition: all 0.3s ease;
			box-sizing: border-box;
		}

		.gauge-center {
			position: absolute;
			top: 60%;
			/* 调整位置以适应新的高度 */
			left: 50%;
			transform: translate(-50%, -50%);
			text-align: center;
			z-index: 20;
			/* 确保文字在最上层 */
			background: rgba(255, 255, 255, 0.9);
			/* 添加背景以提高可读性 */
			border-radius: 50%;
			padding: 20rpx;
			min-width: 80rpx;
			min-height: 80rpx;
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
		}

		.gauge-value {
			font-size: 36rpx;
			/* 增大字体 */
			font-weight: bold;
			color: #333;
			display: block;
			line-height: 1;
		}

		.gauge-label {
			font-size: 22rpx;
			color: #666;
			display: block;
			margin-top: 6rpx;
			white-space: nowrap;
		}

		.category-grid {
			display: grid;
			grid-template-columns: repeat(2, 1fr);
			gap: 16rpx;
			margin: 20rpx 0;
		}

		.category-item {
			display: flex;
			align-items: center;
			padding: 16rpx;
			border-radius: 12rpx;
			background: #f8f9fa;
			border: 1rpx solid #e9ecef;
			transition: all 0.3s ease;
			cursor: pointer;

			&:hover {
				background: #e9ecef;
				transform: translateY(-2rpx);
			}

			&.urgent {
				background: #fff2f0;
				border-color: #ffccc7;

				.category-icon {
					color: #ff4d4f;
				}
			}

			&.warning {
				background: #fff7e6;
				border-color: #ffd591;

				.category-icon {
					color: #fa8c16;
				}
			}

			&.normal {
				background: #f6ffed;
				border-color: #b7eb8f;

				.category-icon {
					color: #52c41a;
				}
			}

			&.other {
				background: #f5f5f5;
				border-color: #d9d9d9;

				.category-icon {
					color: #999;
				}
			}
		}

		.category-icon {
			font-size: 24rpx;
			margin-right: 12rpx;
		}

		.category-info {
			display: flex;
			flex-direction: column;
		}

		.category-count {
			font-size: 28rpx;
			font-weight: bold;
			color: #333;
			line-height: 1;
		}

		.category-label {
			font-size: 22rpx;
			color: #666;
			margin-top: 4rpx;
		}

		.dashboard-footer {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 20rpx;
			border-top: 1rpx solid #f0f0f0;
			margin-top: 20rpx;
		}

		.total-info {
			flex: 1;
		}

		.total-text {
			font-size: 26rpx;
			color: #666;
			font-weight: 500;
		}

		.action-buttons {
			display: flex;
			gap: 12rpx;
		}

		.urgent-progress-bars {
			display: flex;
			flex-direction: column;
			gap: 16rpx;
			margin: 20rpx 0;
		}

		.progress-item {
			display: flex;
			flex-direction: column;
			gap: 8rpx;
		}

		.progress-label {
			font-size: 24rpx;
			color: #666;
			font-weight: 500;
		}

		.progress-bar {
			height: 8rpx;
			background: #f0f0f0;
			border-radius: 4rpx;
			overflow: hidden;
			position: relative;
		}

		.progress-fill {
			height: 100%;
			border-radius: 4rpx;
			transition: width 0.3s ease;

			&.urgent {
				background: linear-gradient(90deg, #ff4d4f, #ff7875);
			}

			&.warning {
				background: linear-gradient(90deg, #fa8c16, #ffa940);
			}

			&.normal {
				background: linear-gradient(90deg, #52c41a, #73d13d);
			}
		}
	}

	/* 工作效率雷达图样式 - 优化管家用户体验 */
	.efficiency-radar-card {
		.radar-container {
			display: flex;
			flex-direction: column;
			align-items: center;
			padding: 30rpx 20rpx;
			background: linear-gradient(135deg, #f8faff 0%, #f0f8ff 100%);
			border-radius: 20rpx;
			position: relative;
			overflow: hidden;
		}

		.radar-chart {
			position: relative;
			width: 280rpx;
			/* 略微减小以留出更多空间给标签 */
			height: 280rpx;
			margin: 30rpx 0;
			background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%);
			border-radius: 50%;
			box-shadow: 0 8rpx 24rpx rgba(64, 158, 255, 0.1);
		}

		.radar-grid {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
		}

		.radar-circle {
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			border: 1rpx solid #e8e8e8;
			border-radius: 50%;

			&.circle-1 {
				width: 60rpx;
				height: 60rpx;
			}

			&.circle-2 {
				width: 120rpx;
				height: 120rpx;
			}

			&.circle-3 {
				width: 180rpx;
				height: 180rpx;
			}

			&.circle-4 {
				width: 240rpx;
				height: 240rpx;
			}
		}

		.radar-line {
			position: absolute;
			top: 50%;
			left: 50%;
			width: 1rpx;
			height: 120rpx;
			background: #e8e8e8;
			transform-origin: center bottom;

			&.line-1 {
				transform: translate(-50%, -100%) rotate(0deg);
			}

			&.line-2 {
				transform: translate(-50%, -100%) rotate(72deg);
			}

			&.line-3 {
				transform: translate(-50%, -100%) rotate(144deg);
			}

			&.line-4 {
				transform: translate(-50%, -100%) rotate(216deg);
			}

			&.line-5 {
				transform: translate(-50%, -100%) rotate(288deg);
			}
		}

		.radar-data-area {
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 200rpx;
			height: 200rpx;
			background: radial-gradient(circle, rgba(64, 158, 255, 0.1) 0%, rgba(64, 158, 255, 0.05) 50%, transparent 100%);
			border-radius: 50%;
			border: 2rpx solid rgba(64, 158, 255, 0.3);
		}

		.radar-labels {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
		}

		.radar-label {
			position: absolute;
			font-size: 24rpx;
			/* 增大字体以提高可读性 */
			color: #333;
			/* 加深颜色 */
			font-weight: 600;
			/* 增加字体重量 */
			white-space: nowrap;
			transform: translate(-50%, -50%);
			background: rgba(255, 255, 255, 0.9);
			/* 添加背景 */
			padding: 6rpx 12rpx;
			border-radius: 12rpx;
			box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
			border: 1rpx solid rgba(64, 158, 255, 0.2);

			&.label-speed {
				top: 8%;
				/* 调整位置以适应新的样式 */
				left: 50%;
				color: #1890ff;
				/* 蓝色表示速度 */
			}

			&.label-accuracy {
				top: 22%;
				right: 12%;
				color: #52c41a;
				/* 绿色表示准确率 */
			}

			&.label-response {
				bottom: 22%;
				right: 12%;
				color: #fa8c16;
				/* 橙色表示响应时间 */
			}

			&.label-quality {
				bottom: 22%;
				left: 12%;
				color: #722ed1;
				/* 紫色表示质量 */
			}

			&.label-satisfaction {
				top: 22%;
				left: 12%;
				color: #eb2f96;
				/* 粉色表示满意度 */
			}
		}

		.radar-metrics {
			display: flex;
			flex-wrap: wrap;
			gap: 16rpx;
			justify-content: center;
			margin: 20rpx 0;
		}

		.metric-item {
			display: flex;
			align-items: center;
			padding: 12rpx 16rpx;
			border-radius: 20rpx;
			background: #f8f9fa;
			border: 1rpx solid #e9ecef;
			min-width: 120rpx;
		}

		.metric-icon {
			font-size: 20rpx;
			margin-right: 8rpx;
		}

		.metric-info {
			display: flex;
			flex-direction: column;
		}

		.metric-label {
			font-size: 20rpx;
			color: #666;
			line-height: 1;
		}

		.metric-value {
			font-size: 24rpx;
			font-weight: bold;
			margin-top: 2rpx;
			line-height: 1;

			&.excellent {
				color: #52c41a;
			}

			&.good {
				color: #1890ff;
			}

			&.normal {
				color: #fa8c16;
			}

			&.poor {
				color: #ff4d4f;
			}
		}

		.efficiency-summary {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 20rpx;
			background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
			border-radius: 16rpx;
			margin: 20rpx 0;
			border: 1rpx solid #b3e5fc;
		}

		.summary-score {
			display: flex;
			flex-direction: column;
			align-items: center;
		}

		.score-value {
			font-size: 48rpx;
			font-weight: bold;
			color: #1890ff;
			line-height: 1;
		}

		.score-label {
			font-size: 24rpx;
			color: #666;
			margin-top: 4rpx;
		}

		.summary-trend {
			display: flex;
			align-items: center;
			gap: 8rpx;
		}

		.trend-icon {
			font-size: 24rpx;
			color: #52c41a;
		}

		.trend-text {
			font-size: 24rpx;
			color: #52c41a;
			font-weight: 500;
		}

		.efficiency-details {
			padding: 20rpx;
			border-top: 1rpx solid #f0f0f0;
			margin-top: 20rpx;
		}

		.details-header {
			margin-bottom: 20rpx;
		}

		.details-title {
			font-size: 28rpx;
			font-weight: bold;
			color: #333;
		}

		.time-analysis {
			margin-bottom: 24rpx;
		}

		.section-title {
			font-size: 26rpx;
			font-weight: bold;
			color: #333;
			margin-bottom: 16rpx;
		}

		.time-slots {
			display: flex;
			flex-direction: column;
			gap: 12rpx;
		}

		.time-slot {
			display: flex;
			align-items: center;
			gap: 16rpx;
			padding: 12rpx;
			background: #f8f9fa;
			border-radius: 8rpx;
		}

		.slot-time {
			font-size: 24rpx;
			color: #333;
			font-weight: 500;
			min-width: 120rpx;
		}

		.slot-bar {
			flex: 1;
			height: 8rpx;
			background: #e9ecef;
			border-radius: 4rpx;
			overflow: hidden;
			position: relative;
		}

		.slot-fill {
			height: 100%;
			border-radius: 4rpx;
			transition: width 0.3s ease;
		}

		.slot-count {
			font-size: 22rpx;
			color: #666;
			min-width: 60rpx;
			text-align: right;
		}

		.improvement-suggestions {
			margin-top: 24rpx;
		}

		.suggestions-list {
			display: flex;
			flex-direction: column;
			gap: 8rpx;
		}

		.suggestion-item {
			font-size: 24rpx;
			color: #666;
			line-height: 1.5;
			padding: 8rpx 0;
		}
	}

	/* 状态分布饼图样式 - 优化趋势分析视觉效果 */
	.distribution-analysis-card {
		.distribution-container {
			display: flex;
			flex-direction: column;
			align-items: center;
			padding: 30rpx 20rpx;
			background: linear-gradient(135deg, #fff9f0 0%, #fff2e8 100%);
			border-radius: 20rpx;
			position: relative;
			overflow: hidden;
		}

		.pie-chart-visual {
			display: flex;
			flex-direction: column;
			align-items: center;
			margin-bottom: 30rpx;
			position: relative;
		}

		.pie-chart-wrapper {
			position: relative;
			width: 220rpx;
			/* 增大尺寸 */
			height: 220rpx;
			margin-bottom: 20rpx;
			filter: drop-shadow(0 8rpx 16rpx rgba(0, 0, 0, 0.1));
		}

		.pie-chart-gradient {
			position: relative;
			width: 100%;
			height: 100%;
			border-radius: 50%;
			background: conic-gradient(from 0deg,
					#fa8c16 0deg 120deg,
					#52c41a 120deg 240deg,
					#ff4d4f 240deg 360deg);
			box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
		}

		.pie-center-display {
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 120rpx;
			height: 120rpx;
			background: #fff;
			border-radius: 50%;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
		}

		.pie-total-text {
			font-size: 32rpx;
			font-weight: bold;
			color: #333;
			line-height: 1;
		}

		.pie-label-text {
			font-size: 20rpx;
			color: #666;
			margin-top: 4rpx;
		}

		.chart-tip {
			font-size: 22rpx;
			color: #999;
			margin-top: 8rpx;
		}

		.distribution-legend {
			display: flex;
			flex-direction: column;
			gap: 16rpx;
			width: 100%;
			margin-top: 20rpx;
		}

		.legend-item {
			display: flex;
			align-items: center;
			padding: 16rpx;
			border-radius: 12rpx;
			background: #f8f9fa;
			border: 1rpx solid #e9ecef;
		}

		.legend-dot {
			width: 16rpx;
			height: 16rpx;
			border-radius: 50%;
			margin-right: 12rpx;

			&.pending {
				background: #fa8c16;
			}

			&.approved {
				background: #52c41a;
			}

			&.rejected {
				background: #ff4d4f;
			}
		}

		.legend-content {
			display: flex;
			align-items: center;
			gap: 8rpx;
			flex: 1;
		}

		.legend-text {
			font-size: 26rpx;
			color: #333;
			font-weight: 500;
		}

		.legend-percent {
			font-size: 22rpx;
			color: #666;
		}

		.legend-change {
			font-size: 20rpx;
			color: #52c41a;
			margin-left: auto;
		}
	}

	.unified-data-workspace {
		margin: 14rpx 0;
		background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f8faff 100%);
		border-radius: 24rpx;
		padding: 20rpx;
		box-shadow: 0 12rpx 48rpx rgba(64, 158, 255, 0.1);
		border: 2rpx solid #e6f0ff;
		position: relative;
		overflow: hidden;
	}

	.unified-data-workspace::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4rpx;
		background: linear-gradient(90deg, #409eff 0%, #67c23a 25%, #e6a23c 50%, #f56c6c 75%, #909399 100%);
	}

	.workspace-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16rpx;
	}

	.header-title {
		display: flex;
		align-items: center;
	}

	.title-text {
		font-size: 32rpx;
		font-weight: 600;
		color: #1a1a1a;
		margin-right: 12rpx;
	}

	.vs-text {
		font-size: 24rpx;
		color: #666;
		background: rgba(64, 158, 255, 0.1);
		padding: 4rpx 12rpx;
		border-radius: 12rpx;
	}

	.header-actions {
		display: flex;
		align-items: center;
	}

	.collapse-btn {
		width: 48rpx;
		height: 48rpx;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.collapse-btn:hover {
		background: rgba(255, 255, 255, 1);
		transform: scale(1.1);
	}

	.workspace-content {
		animation: fadeIn 0.3s ease;
	}









	/* 重新设计的统计面板样式 */
	.stats-dashboard {
		animation: fadeIn 0.3s ease;
	}

	/* 核心指标卡片网格 */
	.core-metrics-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16rpx;
		margin-bottom: 24rpx;
	}

	/* 简化的三列网格 */
	.core-metrics-grid-simple {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 12rpx;
		margin-bottom: 16rpx;
	}

	/* 统计卡片基础样式 */
	.metric-card {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%);
		border-radius: 20rpx;
		padding: 18rpx;
		border: 1rpx solid rgba(64, 158, 255, 0.1);
		box-shadow: 0 8rpx 24rpx rgba(64, 158, 255, 0.08);
		position: relative;
		overflow: hidden;
	}

	.metric-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4rpx;
		background: linear-gradient(90deg, #409eff 0%, #67c23a 100%);
	}

	/* 不同类型卡片的主题色 */
	.urgent-card::before {
		background: linear-gradient(90deg, #f56c6c 0%, #ff9800 100%);
	}

	.success-card::before {
		background: linear-gradient(90deg, #67c23a 0%, #52c41a 100%);
	}

	.info-card::before {
		background: linear-gradient(90deg, #409eff 0%, #1890ff 100%);
	}

	.warning-card::before {
		background: linear-gradient(90deg, #e6a23c 0%, #fa8c16 100%);
	}

	/* 卡片头部 - 优化布局 */
	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 12rpx;
	}

	/* 修复重叠的卡片头部 */
	.card-header-fixed {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 12rpx;
		min-height: 40rpx;
	}

	.header-left {
		display: flex;
		align-items: center;
		flex: 1;
		min-width: 0;
		/* 防止溢出 */
	}

	.header-right {
		flex-shrink: 0;
		margin-left: 8rpx;
	}

	.card-icon {
		font-size: 28rpx;
		margin-right: 8rpx;
	}

	.card-title {
		font-size: 24rpx;
		color: #606266;
		font-weight: 500;
		flex: 1;
	}

	/* 头部徽章 */
	.urgent-badge,
	.rate-badge,
	.status-badge,
	.time-badge {
		font-size: 20rpx;
		padding: 4rpx 8rpx;
		border-radius: 12rpx;
		font-weight: bold;
		color: #fff;
	}

	.urgent-badge {
		background: linear-gradient(45deg, #f56c6c, #ff9800);
	}

	.rate-badge {
		background: linear-gradient(45deg, #67c23a, #52c41a);
	}

	.status-badge {
		background: linear-gradient(45deg, #409eff, #1890ff);
	}

	.time-badge {
		background: linear-gradient(45deg, #e6a23c, #fa8c16);
	}

	/* 紧凑卡片内容 */
	.card-content-compact {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 4rpx;
	}

	.main-info {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	.main-number {
		font-size: 36rpx;
		font-weight: bold;
		color: #303133;
		line-height: 1;
	}

	.sub-text {
		font-size: 20rpx;
		color: #909399;
		margin-top: 2rpx;
	}

	.extra-info {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 2rpx;
	}

	.extra-text {
		font-size: 18rpx;
		color: #909399;
		background: rgba(64, 158, 255, 0.1);
		padding: 2rpx 6rpx;
		border-radius: 8rpx;
	}

	/* 紧凑卡片底部 */
	.card-footer-compact {
		margin-top: 4rpx;
	}

	/* 原有卡片内容保留兼容 */
	.card-content {
		margin-top: 12rpx;
	}

	/* 卡片底部 */
	.card-footer {
		margin-top: 8rpx;
	}

	/* 新的卡片内容样式 */
	.card-main-content {
		text-align: center;
		margin: 16rpx 0 8rpx 0;
	}

	.card-trend {
		text-align: center;
		margin-top: 8rpx;
	}

	/* 图表网格 */
	.charts-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 20rpx;
		margin-top: 24rpx;
	}

	/* 响应式布局 - 在较大屏幕上使用两列布局 */
	@media (min-width: 750rpx) {
		.charts-grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	/* 图表卡片 */
	.chart-card {
		background: #fff;
		border-radius: 16rpx;
		padding: 24rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
		border: 1rpx solid #f0f0f0;
	}

	.chart-header {
		display: flex;
		align-items: center;
		margin-bottom: 20rpx;
	}

	.chart-icon {
		font-size: 28rpx;
		margin-right: 8rpx;
	}

	.chart-title {
		font-size: 28rpx;
		font-weight: 600;
		color: #303133;
		margin-right: 8rpx;
	}

	.chart-subtitle {
		font-size: 22rpx;
		color: #909399;
	}

	.chart-content {
		min-height: 200rpx;
	}

	/* 趋势图样式 */
	.trend-chart {
		width: 100%;
	}

	.chart-bars {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		height: 160rpx;
		margin-bottom: 24rpx;
		padding: 0 8rpx;
		overflow-x: auto;
		/* 允许水平滚动 */
		-webkit-overflow-scrolling: touch;
		/* 提供iOS的滚动惯性 */
		scrollbar-width: none;
		/* 隐藏滚动条 */
	}

	/* 隐藏滚动条但保留功能 */
	.chart-bars::-webkit-scrollbar {
		display: none;
	}

	.bar-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		flex: 0 0 auto;
		/* 不允许收缩，保持固定宽度 */
		min-width: 80rpx;
		/* 设置最小宽度确保标签显示 */
		margin: 0 4rpx;
	}

	.bar-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
		height: 100rpx;
		justify-content: flex-end;
	}

	.bar-approved {
		background: linear-gradient(to top, #67c23a, #85ce61);
		width: 20rpx;
		border-radius: 4rpx 4rpx 0 0;
		margin-bottom: 2rpx;
	}

	.bar-rejected {
		background: linear-gradient(to top, #f56c6c, #f78989);
		width: 20rpx;
		border-radius: 4rpx 4rpx 0 0;
	}

	.bar-label {
		font-size: 20rpx;
		color: #909399;
		margin-top: 8rpx;
		text-align: center;
		white-space: nowrap;
		/* 防止文字换行 */
		overflow: visible;
		/* 允许文字溢出显示 */
		width: 100%;
		line-height: 1.2;
	}

	.chart-legend {
		display: flex;
		justify-content: center;
		gap: 24rpx;
	}

	.legend-item {
		display: flex;
		align-items: center;
	}

	.legend-dot {
		width: 12rpx;
		height: 12rpx;
		border-radius: 50%;
		margin-right: 6rpx;
	}

	.legend-dot.approved {
		background: #67c23a;
	}

	.legend-dot.rejected {
		background: #f56c6c;
	}

	.legend-text {
		font-size: 20rpx;
		color: #606266;
	}

	/* 流量图样式 */
	.flow-chart {
		width: 100%;
	}

	.flow-bars {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		height: 120rpx;
		margin-bottom: 16rpx;
		padding: 0 8rpx;
	}

	.flow-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		flex: 1;
		margin: 0 1rpx;
	}

	.flow-bar {
		background: linear-gradient(to top, #409eff, #66b1ff);
		width: 16rpx;
		border-radius: 4rpx 4rpx 0 0;
		min-height: 8rpx;
	}

	.flow-label {
		font-size: 16rpx;
		color: #909399;
		margin-top: 8rpx;
		text-align: center;
	}

	/* 饼图样式 */
	.pie-chart {
		width: 100%;
	}

	.pie-stats {
		display: flex;
		flex-direction: column;
		gap: 16rpx;
	}

	.pie-stat-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12rpx 16rpx;
		background: #f8f9fa;
		border-radius: 12rpx;
	}

	.pie-dot {
		width: 16rpx;
		height: 16rpx;
		border-radius: 50%;
		margin-right: 12rpx;
	}

	.pie-dot.pending {
		background: #e6a23c;
	}

	.pie-dot.approved {
		background: #67c23a;
	}

	.pie-dot.rejected {
		background: #f56c6c;
	}

	.pie-text {
		font-size: 24rpx;
		color: #606266;
		flex: 1;
	}

	.pie-number {
		font-size: 28rpx;
		font-weight: bold;
		color: #303133;
	}

	.trend-text {
		font-size: 22rpx;
		font-weight: 500;
	}

	.trend-up {
		color: #67c23a;
	}

	.trend-down {
		color: #f56c6c;
	}

	.trend-stable {
		color: #909399;
	}

	/* 详细统计行 */
	.detailed-stats-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16rpx;
		margin-bottom: 24rpx;
	}

	/* 统计区块 */
	.stats-section {
		background: rgba(255, 255, 255, 0.9);
		border-radius: 16rpx;
		padding: 20rpx;
		border: 1rpx solid rgba(64, 158, 255, 0.1);
		box-shadow: 0 4rpx 16rpx rgba(64, 158, 255, 0.06);
	}

	/* 区块头部 */
	.section-header {
		margin-bottom: 16rpx;
	}

	.section-title {
		font-size: 26rpx;
		font-weight: 600;
		color: #303133;
		display: block;
	}

	.section-subtitle {
		font-size: 22rpx;
		color: #909399;
		margin-top: 4rpx;
		display: block;
	}

	/* 状态条形图 */
	.status-bars {
		display: flex;
		flex-direction: column;
		gap: 12rpx;
	}

	.status-bar {
		display: flex;
		flex-direction: column;
		gap: 6rpx;
	}

	.bar-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.bar-label {
		font-size: 24rpx;
		color: #606266;
	}

	.bar-value {
		font-size: 24rpx;
		font-weight: 600;
		color: #303133;
	}

	.bar-track {
		height: 8rpx;
		background: #f5f7fa;
		border-radius: 4rpx;
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		border-radius: 4rpx;
		transition: width 0.3s ease;
	}

	.approved-bar {
		background: linear-gradient(90deg, #67c23a 0%, #85ce61 100%);
	}

	.pending-bar {
		background: linear-gradient(90deg, #e6a23c 0%, #ebb563 100%);
	}

	.rejected-bar {
		background: linear-gradient(90deg, #f56c6c 0%, #f78989 100%);
	}

	/* 时间统计 */
	.time-stats {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12rpx;
	}

	.time-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 12rpx;
		background: rgba(64, 158, 255, 0.05);
		border-radius: 12rpx;
		border: 1rpx solid rgba(64, 158, 255, 0.1);
	}

	.time-label {
		font-size: 22rpx;
		color: #909399;
		margin-bottom: 4rpx;
	}

	.time-value {
		font-size: 28rpx;
		font-weight: bold;
		color: #303133;
	}

	.time-value.highlight {
		color: #409eff;
	}

	/* 数据分析页面样式 */
	.data-analysis-page {
		animation: fadeIn 0.3s ease;
	}

	.chart-section {
		background: rgba(255, 255, 255, 0.8);
		border-radius: 16rpx;
		padding: 24rpx;
		margin-bottom: 20rpx;
		border: 1rpx solid rgba(64, 158, 255, 0.1);
	}

	.chart-title {
		font-size: 28rpx;
		font-weight: 600;
		color: #333;
		margin-bottom: 20rpx;
		display: flex;
		align-items: center;
	}

	/* 趋势图表样式 */
	.trend-chart {
		height: 200rpx;
		position: relative;
	}

	.chart-container {
		width: 100%;
		height: 100%;
		position: relative;
	}

	.trend-line-chart {
		width: 100%;
		height: 100%;
		position: relative;
		background: linear-gradient(180deg, rgba(64, 158, 255, 0.1) 0%, rgba(64, 158, 255, 0.05) 100%);
		border-radius: 12rpx;
	}

	.chart-grid {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 20rpx;
	}

	.grid-line {
		height: 1rpx;
		background: rgba(64, 158, 255, 0.2);
		width: 100%;
	}

	.trend-points {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		padding: 20rpx;
	}

	.trend-point {
		position: absolute;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.point-dot {
		width: 12rpx;
		height: 12rpx;
		background: #409eff;
		border-radius: 50%;
		border: 3rpx solid white;
		box-shadow: 0 2rpx 8rpx rgba(64, 158, 255, 0.3);
	}

	.point-value {
		font-size: 20rpx;
		color: #409eff;
		font-weight: 600;
		margin-top: 8rpx;
	}

	.x-axis-labels {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		justify-content: space-between;
		padding: 0 20rpx;
	}

	.axis-label {
		font-size: 20rpx;
		color: #666;
	}

	/* 状态分布样式 */
	.status-distribution {
		display: flex;
		align-items: center;
		gap: 24rpx;
	}

	.pie-chart-simple {
		width: 120rpx;
		height: 120rpx;
		border-radius: 50%;
		background: conic-gradient(#67c23a 0deg 120deg,
				#409eff 120deg 240deg,
				#f56c6c 240deg 360deg);
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
	}

	.pie-center-info {
		width: 80rpx;
		height: 80rpx;
		background: white;
		border-radius: 50%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.center-number {
		font-size: 24rpx;
		font-weight: 600;
		color: #333;
	}

	.center-label {
		font-size: 18rpx;
		color: #666;
	}

	.status-stats {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 12rpx;
	}

	.status-item {
		display: flex;
		align-items: center;
		gap: 12rpx;
	}

	.status-dot {
		width: 12rpx;
		height: 12rpx;
		border-radius: 50%;
	}

	.status-item.approved .status-dot {
		background: #67c23a;
	}

	.status-item.pending .status-dot {
		background: #409eff;
	}

	.status-item.rejected .status-dot {
		background: #f56c6c;
	}

	.status-text {
		font-size: 24rpx;
		color: #333;
	}

	/* 效率指标样式 */
	.efficiency-metrics {
		display: flex;
		flex-direction: column;
		gap: 16rpx;
	}

	.efficiency-metrics .metric-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16rpx;
		background: rgba(64, 158, 255, 0.05);
		border-radius: 12rpx;
		border: 1rpx solid rgba(64, 158, 255, 0.1);
	}

	.efficiency-metrics .metric-label {
		font-size: 24rpx;
		color: #666;
	}

	.efficiency-metrics .metric-value {
		font-size: 24rpx;
		font-weight: 600;
		color: #333;
	}

	.efficiency-metrics .metric-value.success {
		color: #67c23a;
	}

	.efficiency-metrics .metric-trend {
		font-size: 20rpx;
		color: #999;
	}

	.efficiency-metrics .trend-up {
		color: #67c23a;
	}

	.efficiency-metrics .comparison-up {
		color: #409eff;
	}

	/* 保留原有的stats-header样式以防其他地方使用 */
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
		padding: 18rpx 24rpx;
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
		flex-wrap: wrap;
		gap: 8rpx;

		.tags-title {
			font-size: 26rpx;
			color: #1976d2;
			font-weight: 600;
			margin-left: 6rpx;
			letter-spacing: 0.5rpx;
		}

		.tags-subtitle {
			font-size: 20rpx;
			color: #999;
			margin-left: auto;
			opacity: 0.8;
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

		.select-detail {
			font-size: 20rpx;
			color: #666;
			margin-bottom: 4rpx;
			opacity: 0.8;
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
		overflow: visible;

		&.multiSelectMode {
			margin-left: 80rpx; // 为复选框留出更多空间
			transition: all 0.3s ease;
		}

		&.selected {
			background: linear-gradient(135deg, #f0f7ff, #e6f3ff);
			border-color: #409eff;
			box-shadow: 0 4rpx 16rpx rgba(64, 158, 255, 0.15);
			transform: scale(0.98);

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
		left: 8rpx;
		transform: translateY(-50%);
		z-index: 10;
		cursor: pointer;
		/* 增大触摸区域 */
		padding: 16rpx;
		margin: -16rpx;

		/* 添加触摸反馈 */
		&:active {
			opacity: 0.7;
			transform: translateY(-50%) scale(0.95);
		}

		.checkbox-icon {
			width: 48rpx;
			height: 48rpx;
			border-radius: 50%;
			border: 3rpx solid #ddd;
			background: #ffffff;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
			box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);

			/* 确保触摸区域足够大 */
			min-width: 48rpx;
			min-height: 48rpx;

			&.checked {
				background: #409eff;
				border-color: #409eff;
				transform: scale(1.1);
				box-shadow: 0 6rpx 16rpx rgba(64, 158, 255, 0.3);
			}

			/* 添加悬停效果 */
			&:hover {
				border-color: #409eff;
				box-shadow: 0 6rpx 16rpx rgba(64, 158, 255, 0.2);
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
		padding: 14rpx;
		margin: 6rpx 0;
		box-shadow:
			0 8rpx 32rpx rgba(64, 158, 255, 0.08),
			0 2rpx 8rpx rgba(64, 158, 255, 0.04);
		border: 1rpx solid rgba(64, 158, 255, 0.08);
		overflow: visible;
		min-height: 180rpx;
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
		gap: 20rpx;
		min-height: 160rpx;
		align-items: stretch;
		position: relative;
		z-index: 1;
		overflow: hidden;
	}

	/* Left content area */
	.left-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 16rpx;
		min-width: 0;
		/* 允许内容被压缩 */
		overflow: hidden;
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
		gap: 24rpx;
		flex-wrap: nowrap;
		/* 防止换行，确保姓名和手机号在同一行 */
		align-items: center;

		.contact-item {
			display: flex;
			align-items: center;
			gap: 8rpx;
			padding: 8rpx 12rpx;
			background: rgba(64, 158, 255, 0.04);
			border-radius: 16rpx;
			border: 1rpx solid rgba(64, 158, 255, 0.08);
			flex: 1;
			/* 平均分配空间 */
			min-width: 0;
			/* 允许内容收缩 */

			.contact-text {
				font-size: 26rpx;
				color: #333;
				font-weight: 500;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
				/* 防止文本换行 */
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
		width: 200rpx;
		min-width: 200rpx;
		max-width: 200rpx;
		gap: 16rpx;
		height: 100%;
		padding-top: 12rpx;
		flex-shrink: 0;
		overflow: visible;
	}

	/* Time information row */
	.time-info {
		display: flex !important;
		align-items: center !important;
		justify-content: flex-end !important;
		width: 100% !important;
		margin-bottom: 12rpx !important;
		padding: 8rpx 12rpx;
		background: rgba(102, 102, 102, 0.06);
		border-radius: 16rpx;
		backdrop-filter: blur(5rpx);
		white-space: nowrap !important;
		overflow: visible !important;
		flex-shrink: 0;

		.time-text {
			font-size: 20rpx;
			color: #666;
			font-weight: 500;
			display: inline-block;
			letter-spacing: 0.5rpx;
			white-space: nowrap !important;
			overflow: visible !important;
		}
	}

	/* Status information row */
	.status-info {
		display: flex !important;
		justify-content: flex-end !important;
		width: 100% !important;
		padding: 6rpx 0;
		flex-shrink: 0;
		overflow: visible !important;
	}

	.expand-btn {
		margin-top: 10rpx;
		width: 48rpx;
		height: 48rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background-color: rgba(0, 0, 0, 0.05);
		transition: all 0.3s;
	}

	.expand-btn:active {
		background-color: rgba(0, 0, 0, 0.1);
		transform: scale(0.95);
	}

	/* 简要信息样式 - 折叠状态显示 */
	.brief-info {
		display: flex;
		flex-direction: column;
		gap: 8rpx;
		margin-top: 8rpx;
	}

	.brief-item {
		display: flex;
		align-items: center;
		font-size: 24rpx;
		color: #666;
	}

	.brief-text {
		color: #666;
		font-size: 24rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 200rpx;
	}

	/* 详细信息区域 - 纵向紧凑布局 */
	.detail-info-section-compact {
		margin-top: 12rpx;
		padding: 16rpx 20rpx 12rpx 20rpx;
		background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
		border-radius: 16rpx;
		border: 1rpx solid #e3e8ef;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.04);
		position: relative;
		overflow: hidden;
		animation: slideDown 0.3s ease-out;
	}

	/* 展开动画 */
	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10rpx);
			max-height: 0;
		}
		to {
			opacity: 1;
			transform: translateY(0);
			max-height: 500rpx;
		}
	}

	/* 装饰性背景元素 */
	.detail-info-section-compact::before {
		content: '';
		position: absolute;
		top: -50%;
		right: -20rpx;
		width: 100rpx;
		height: 100rpx;
		background: radial-gradient(circle, rgba(65, 158, 255, 0.03) 0%, transparent 70%);
		border-radius: 50%;
		pointer-events: none;
	}

	/* 信息行布局 */
	.info-row {
		display: flex;
		align-items: center;
		padding: 12rpx 8rpx;
		border-bottom: 1rpx solid rgba(233, 236, 239, 0.6);
		transition: all 0.25s ease;
		position: relative;
		border-radius: 8rpx;
		margin: 2rpx 0;
		white-space: nowrap;
		flex-wrap: nowrap;
	}

	.info-row:last-child {
		border-bottom: none;
		margin-bottom: 0;
	}

	.info-row:hover {
		background-color: rgba(65, 158, 255, 0.02);
		transform: translateX(2rpx);
	}

	/* 可点击行样式 */
	.info-row.clickable-row {
		cursor: pointer;
		position: relative;
	}

	.info-row.clickable-row::after {
		content: '📞';
		position: absolute;
		right: 8rpx;
		font-size: 20rpx;
		opacity: 0.6;
		transition: all 0.2s ease;
	}

	.info-row.clickable-row:active {
		background-color: rgba(33, 150, 243, 0.08);
		transform: scale(0.98);
		box-shadow: inset 0 2rpx 8rpx rgba(33, 150, 243, 0.1);
	}

	.info-row.clickable-row:active::after {
		transform: scale(1.2);
		opacity: 1;
	}

	/* 信息图标 */
	.info-icon {
		font-size: 28rpx;
		margin-right: 12rpx;
		width: 32rpx;
		height: 32rpx;
		text-align: center;
		line-height: 32rpx;
		flex-shrink: 0;
		background: linear-gradient(135deg, rgba(65, 158, 255, 0.1) 0%, rgba(65, 158, 255, 0.05) 100%);
		border-radius: 8rpx;
		position: relative;
		transition: transform 0.2s ease;
	}

	.info-row:hover .info-icon {
		transform: rotate(5deg) scale(1.05);
	}

	/* 信息标签 */
	.info-label {
		font-size: 26rpx;
		color: #5a6c7d;
		margin-right: 12rpx;
		min-width: 140rpx;
		flex-shrink: 0;
		font-weight: 500;
		letter-spacing: 0.5rpx;
		white-space: nowrap;
	}

	/* 信息内容 */
	.info-value {
		font-size: 28rpx;
		color: #2c3e50;
		flex: 1;
		word-break: normal;
		line-height: 1.4;
		font-weight: 400;
		transition: color 0.2s ease;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* 特殊样式 */
	.info-value.clickable {
		color: #2196F3;
		font-weight: 500;
		position: relative;
		text-decoration: none;
		background: linear-gradient(90deg, transparent 0%, rgba(33, 150, 243, 0.05) 100%);
		padding: 4rpx 8rpx;
		border-radius: 6rpx;
		border-left: 3rpx solid #2196F3;
		transition: all 0.3s ease;
	}

	.info-value.clickable:active {
		background: linear-gradient(90deg, rgba(33, 150, 243, 0.08) 0%, rgba(33, 150, 243, 0.12) 100%);
		transform: translateX(2rpx);
		border-left-width: 4rpx;
	}

	.info-value.primary {
		color: #409EFF;
		font-weight: 600;
		background: linear-gradient(90deg, transparent 0%, rgba(64, 158, 255, 0.05) 100%);
		padding: 4rpx 8rpx;
		border-radius: 6rpx;
		border-left: 3rpx solid #409EFF;
		position: relative;
	}

	.info-value.primary::after {
		content: '⭐';
		margin-left: 8rpx;
		font-size: 20rpx;
		opacity: 0.7;
	}

	/* 成功状态样式（已进场） */
	.info-value.success {
		color: #52c41a;
		font-weight: 600;
		background: linear-gradient(90deg, transparent 0%, rgba(82, 196, 26, 0.05) 100%);
		padding: 4rpx 8rpx;
		border-radius: 6rpx;
		border-left: 3rpx solid #52c41a;
		position: relative;
	}

	.info-value.success::after {
		content: '✅';
		margin-left: 8rpx;
		font-size: 20rpx;
		opacity: 0.8;
	}

	/* 停车时长特殊样式 */
	.info-value.duration {
		color: #fa8c16;
		font-weight: 600;
		background: linear-gradient(90deg, transparent 0%, rgba(250, 140, 22, 0.05) 100%);
		padding: 4rpx 8rpx;
		border-radius: 6rpx;
		border-left: 3rpx solid #fa8c16;
		position: relative;
	}

	.info-value.duration::after {
		content: '⏳';
		margin-left: 8rpx;
		font-size: 20rpx;
		opacity: 0.8;
	}

	/* 地址信息特殊样式 */
	.info-row:last-child .info-value {
		color: #34495e;
		background: linear-gradient(90deg, transparent 0%, rgba(52, 73, 94, 0.03) 100%);
		padding: 6rpx 10rpx;
		border-radius: 8rpx;
		border-left: 3rpx solid #95a5a6;
		position: relative;
	}

	/* 响应式字体调整 */
	@media (max-width: 750rpx) {
		.info-icon {
			font-size: 24rpx;
			width: 28rpx;
			height: 28rpx;
			line-height: 28rpx;
		}
		
		.info-label {
			font-size: 24rpx;
			min-width: 90rpx;
		}
		
		.info-value {
			font-size: 26rpx;
		}
	}

	/* 详细信息区域 - 现代卡片网格布局（保留原有样式以防其他地方使用） */
	.detail-info-section {
		margin-top: 8rpx;
		padding: 6rpx 6rpx 2rpx 6rpx;
		background: rgba(245, 247, 250, 0.5);
		border-radius: 12rpx;
		border-top: 1rpx solid #e6edf5;
	}

	/* 网格行布局 */
	.info-grid-row {
		display: flex;
		gap: 6rpx;
		margin-bottom: 1rpx;
		padding: 0 2rpx;
	}

	.info-grid-row:last-child {
		margin-bottom: 0;
	}

	/* 基础信息卡片样式 */
	.info-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		border-radius: 12rpx;
		padding: 8rpx 6rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
		position: relative;
		overflow: hidden;
		min-height: 70rpx;
		justify-content: center;
		transition: all 0.3s ease;
		flex: 1;
	}

	/* 详细信息卡片样式 */
	.contact-detail-card,
	.time-detail-card {
		background: linear-gradient(135deg, #f8faff 0%, #e8f4fd 100%);
		border: 1rpx solid #d4e8fc;
		flex: 1;
	}

	.address-detail-card {
		background: linear-gradient(135deg, #fff8f0 0%, #fef2e8 100%);
		border: 1rpx solid #f7e6d3;
	}

	.vehicle-status-card {
		background: linear-gradient(135deg, #f0fff4 0%, #e8f8ed 100%);
		border: 1rpx solid #d3f0e0;
	}

	.card-content-detail {
		display: flex;
		flex-direction: column;
		gap: 4rpx;
		align-items: center;
		width: 100%;
	}

	.detail-name,
	.detail-time,
	.detail-address {
		font-size: 24rpx;
		font-weight: 600;
		color: #333;
		text-align: center;
	}

	.detail-phone {
		font-size: 22rpx;
		color: #2196F3;
		cursor: pointer;
		text-decoration: underline;
	}

	.detail-relative-time {
		font-size: 20rpx;
		color: #666;
		background: rgba(64, 158, 255, 0.1);
		padding: 2rpx 8rpx;
		border-radius: 10rpx;
	}

	.detail-building {
		font-size: 20rpx;
		color: #FF5722;
		background: rgba(255, 87, 34, 0.1);
		padding: 4rpx 12rpx;
		border-radius: 12rpx;
	}

	.vehicle-status-row {
		display: flex;
		flex-direction: column;
		gap: 8rpx;
		align-items: center;
		width: 100%;
	}

	.status-badge {
		padding: 6rpx 16rpx;
		border-radius: 20rpx;
		font-size: 24rpx;
		font-weight: 600;
	}

	.status-entered {
		background: #e8f5e8;
		color: #4caf50;
		border: 1rpx solid #c8e6c9;
	}

	.status-exited {
		background: #ffebee;
		color: #f44336;
		border: 1rpx solid #ffcdd2;
	}

	.status-not-entered {
		background: #f5f5f5;
		color: #757575;
		border: 1rpx solid #e0e0e0;
	}

	.entry-time,
	.exit-time {
		font-size: 22rpx;
		color: #666;
		background: rgba(0, 0, 0, 0.05);
		padding: 4rpx 12rpx;
		border-radius: 12rpx;
	}

	.status-tag {
		display: inline-flex;
		align-items: center;
		gap: 6rpx;
		padding: 8rpx 16rpx;
		border-radius: 20rpx;
		font-size: 18rpx;
		font-weight: 600;
		letter-spacing: 0.5rpx;
		backdrop-filter: blur(5rpx);
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
		border: 1rpx solid transparent;
		transition: all 0.3s ease;
		white-space: nowrap;
		flex-shrink: 0;

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

	/* Today appointment special animation */
	.simplified-card.today-card .plate-text {
		animation: pulse-today 2s infinite;
	}

	@keyframes pulse-today {

		0%,
		100% {
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
			min-height: 160rpx;
			/* Slightly compressed for small screens */
			padding: 16rpx;
		}

		.card-content {
			gap: 16rpx;
		}

		.left-content {
			gap: 10rpx;
		}

		.right-content {
			width: 180rpx;
			min-width: 180rpx;
			max-width: 180rpx;
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
			gap: 20rpx;
			/* 在小屏幕上减少间距 */

			.contact-item {
				padding: 6rpx 10rpx;
				/* 在小屏幕上减少内边距 */
			}

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
			min-width: 120rpx;
			height: 48rpx;
			border-radius: 16rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 0.3s ease;
			cursor: pointer;
			padding: 0 16rpx;
			gap: 8rpx;

			.mode-text {
				font-size: 24rpx;
				font-weight: 500;
			}

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
		border-radius: 24rpx;
		overflow: hidden;
		position: relative;
		max-width: 100%;
		max-height: 100%;
		box-shadow: 0 8rpx 40rpx rgba(0, 0, 0, 0.12);
		margin: 20rpx;
	}

	.detail-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 24rpx 20rpx 20rpx; /* 增加内边距 */
		background: linear-gradient(135deg, #f0f9ff, #e6f0ff);
		border-bottom: 1rpx solid #e0e6ed;
	}

	.detail-title {
		font-size: 32rpx; /* 增加标题字体 */
		color: #262626;
		font-weight: 700;
	}

	.detail-close {
		width: 44rpx; /* 增加关闭按钮大小 */
		height: 44rpx;
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
		padding: 16rpx 14rpx; /* 适中的内边距 */
		overflow-y: auto;
		min-height: 0; /* 确保滚动正常工作 */
		-webkit-overflow-scrolling: touch; /* iOS 平滑滚动 */
	}

	.detail-section {
		margin-bottom: 20rpx; /* 适中的区块间距 */

		&:last-child {
			margin-bottom: 0;
		}

		.section-title {
			font-size: 24rpx; /* 适中的区块标题字体 */
			color: #333;
			font-weight: 600;
			margin-bottom: 10rpx; /* 适中的标题底部间距 */
			padding-left: 10rpx;
			border-left: 3rpx solid #409eff;
			background: rgba(64, 158, 255, 0.05);
			padding: 6rpx 10rpx; /* 适中的内边距 */
			border-radius: 6rpx;
		}
	}

	.info-card {
		background: #ffffff;
		border-radius: 10rpx; /* 适中的圆角 */
		padding: 12rpx; /* 适中的内边距 */
		box-shadow: 0 2rpx 8rpx rgba(64, 158, 255, 0.08);
		border: 1rpx solid rgba(64, 158, 255, 0.06);
	}

	.info-row {
		display: flex;
		margin-bottom: 10rpx; /* 适中的行间距 */
		min-height: 32rpx; /* 适中的最小高度 */
		align-items: flex-start;
		flex-wrap: wrap; /* 小屏幕时允许换行 */

		&:last-child {
			margin-bottom: 0;
		}

		.info-label {
			font-size: 24rpx; /* 适中的标签字体 */
			color: #666;
			font-weight: 500;
			min-width: 120rpx; /* 减少标签最小宽度以适应小屏 */
			max-width: 140rpx;
			flex-shrink: 0;
			line-height: 1.3;
			margin-right: 8rpx;
		}

		.info-value {
			font-size: 24rpx; /* 适中的值字体 */
			color: #333;
			font-weight: 500;
			flex: 1;
			line-height: 1.3;
			word-break: break-all;
			text-align: left; /* 改为左对齐，更适合阅读 */
			min-width: 0; /* 允许缩小 */

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
		text-align: center;
		align-items: center;
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
		justify-content: center;

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
			text-align: center;
		}
	}

	/* Bottom action buttons */
	.detail-actions {
		display: flex;
		gap: 12rpx; /* 适中的按钮间距 */
		padding: 16rpx 16rpx 20rpx; /* 优化内边距，顶部更紧凑 */
		background: #fafbfc;
		border-top: 1rpx solid #f0f2f5;
		flex-shrink: 0; /* 防止被压缩 */
	}

	.action-btn {
		flex: 1;
		height: 80rpx; /* 适中的按钮高度 */
		border-radius: 40rpx; /* 相应调整圆角 */
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6rpx; /* 适中的图标和文字间距 */
		transition: all 0.3s ease;
		cursor: pointer;
		min-width: 0; /* 允许缩小 */

		&:active {
			transform: scale(0.96);
		}

		.btn-icon {
			font-size: 26rpx; /* 适中的图标大小 */
		}

		.btn-text {
			font-size: 26rpx; /* 适中的文字大小 */
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
				padding: 8rpx;
			}

			.info-row {
				margin-bottom: 6rpx;

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

	/* 紧凑单行布局样式 */
	.compact-row {
		display: flex;
		align-items: center;
		padding: 12rpx 20rpx;
		min-height: 80rpx; /* 增加高度以容纳业主信息 */
		gap: 10rpx; /* 减少间距以节省空间 */
	}

	/* 车牌号码样式 - 参考facility.vue */
	.plate-number-compact {
		flex-shrink: 0;
		padding: 8rpx 16rpx;
		border-radius: 8rpx;
		text-align: center;
		font-weight: 500;
		font-size: 26rpx; /* 稍微减小字体 */
		width: 200rpx; /* 减小宽度为业主信息腾出空间 */
		height: 70rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 8rpx; /* 减小右边距 */
		white-space: nowrap;
		overflow: hidden;
	}

	.blue-plate {
		background: linear-gradient(180deg, #0C4FC5 0%, #216FEF 100%);
		color: #FFFFFF;
		border: 1px solid #0C4FC5;
	}

	.green-plate {
		background: linear-gradient(180deg, #6AD390 0%, #D0F1E4 100%);
		color: #000000;
		border: 1px solid #6AD390;
		width: 230rpx; /* 新能源车牌需要更宽的空间 */
	}

	.plate-text {
		font-family: 'Arial', sans-serif;
		letter-spacing: 2rpx;
	}

	/* 业主信息区域样式 */
	.owner-info-compact {
		flex-shrink: 1; /* 允许收缩 */
		display: flex;
		align-items: center; /* 改为水平居中对齐，因为只有一个元素 */
		margin-right: 10rpx; /* 增加右边距 */
		min-width: 110rpx; /* 增加最小宽度 */
		max-width: 160rpx; /* 增加最大宽度 */
	}

	.owner-name-tag {
		display: flex;
		align-items: center;
		gap: 6rpx; /* 增加图标和文字间距 */
		padding: 6rpx 12rpx; /* 增加内边距 */
		background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
		border: 1px solid #bae6fd;
		border-radius: 16rpx; /* 增加圆角 */
		min-height: 32rpx; /* 增加最小高度 */
	}

	.owner-icon {
		font-size: 22rpx; /* 增加图标大小 */
		color: #0369a1;
		flex-shrink: 0;
	}

	.owner-name {
		font-size: 24rpx; /* 增加字体大小 */
		color: #0c4a6e;
		font-weight: 600; /* 增加字体粗细 */
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		flex: 1;
		min-width: 0;
	}

	/* 状态信息区域 */
	.status-info-section {
		flex: 1;
		min-width: 0;
		/* 允许收缩 */
	}

	.combined-status {
		font-size: 26rpx;
		font-weight: 500;
		display: flex;
		align-items: center;
		flex-wrap: nowrap;
		gap: 16rpx;
		flex: 1;
		min-width: 0;
	}

	.address-info {
		color: #333;
		font-weight: 600;
		font-size: 24rpx;
		flex: 1;
		min-width: 0;
		max-width: 240rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.status-tag {
		flex-shrink: 0;
		padding: 8rpx 16rpx;
		border-radius: 16rpx;
		background-color: #f5f5f5;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
		min-height: 48rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.status-text {
		font-weight: 600;
		font-size: 24rpx;
		color: #666;
		position: relative;
		z-index: 1;
		white-space: nowrap;
	}

	/* 移除旧的样式，使用新的status-tag结构 */

	/* 状态标签样式 */
	.urgency-normal {
		background-color: #f5f5f5;
	}

	.urgency-normal .status-text {
		color: #666;
	}

	.urgency-medium {
		background: linear-gradient(135deg, #faad14 0%, #ffc53d 100%);
		border: 2rpx solid #faad14;
		box-shadow: 0 4rpx 12rpx rgba(250, 173, 20, 0.3);
	}

	.urgency-medium .status-text {
		color: #ffffff;
		font-weight: 700;
		text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.1);
	}

	.urgency-high {
		background: linear-gradient(135deg, #fa8c16 0%, #ffa940 100%);
		border: 2rpx solid #fa8c16;
		box-shadow: 0 4rpx 12rpx rgba(250, 140, 22, 0.3);
	}

	.urgency-high .status-text {
		color: #ffffff;
		font-weight: 700;
		text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.1);
	}

	.urgency-urgent {
		background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
		border: 2rpx solid #ff4d4f;
		box-shadow: 0 4rpx 12rpx rgba(255, 77, 79, 0.3);
		animation: pulse 2s infinite;
	}

	.urgency-urgent .status-text {
		color: #ffffff;
		font-weight: 700;
		text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.1);
	}

	/* 车辆状态样式 - 醒目设计 */
	.vehicle-entered {
		background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
		border: 2rpx solid #52c41a;
		box-shadow: 0 4rpx 12rpx rgba(82, 196, 26, 0.3);
		animation: vehicleEntered 3s ease-in-out infinite;
	}

	.vehicle-entered .status-text {
		color: #ffffff;
		font-weight: 700;
		text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.1);
	}

	.vehicle-exited {
		background: linear-gradient(135deg, #722ed1 0%, #9254de 100%);
		border: 2rpx solid #722ed1;
		box-shadow: 0 4rpx 12rpx rgba(114, 46, 209, 0.3);
	}

	.vehicle-exited .status-text {
		color: #ffffff;
		font-weight: 700;
		text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.1);
	}

	.vehicle-waiting {
		background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
		border: 2rpx solid #1890ff;
		box-shadow: 0 4rpx 12rpx rgba(24, 144, 255, 0.3);
	}

	.vehicle-waiting .status-text {
		color: #ffffff;
		font-weight: 700;
		text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.1);
	}

	/* 拒绝状态样式 */
	.urgency-rejected {
		background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
		border: 2rpx solid #ff4d4f;
		box-shadow: 0 4rpx 12rpx rgba(255, 77, 79, 0.3);
	}

	.urgency-rejected .status-text {
		color: #ffffff;
		font-weight: 700;
		text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.1);
	}

	@keyframes pulse {

		0%,
		100% {
			opacity: 1;
		}

		50% {
			opacity: 0.7;
		}
	}

	@keyframes vehicleEntered {

		0%,
		100% {
			box-shadow: 0 4rpx 12rpx rgba(82, 196, 26, 0.3);
			transform: scale(1);
		}

		50% {
			box-shadow: 0 6rpx 20rpx rgba(82, 196, 26, 0.5);
			transform: scale(1.02);
		}
	}

	/* 操作按钮区域 */
	.actions-compact {
		display: flex;
		align-items: center;
		gap: 12rpx;
		flex-shrink: 0;
	}

	.copy-btn,
	.collapse-btn {
		width: 60rpx;
		height: 60rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #F8F9FA;
		border: 2rpx solid #E9ECEF;
		transition: all 0.3s ease;
	}

	.copy-btn:active,
	.collapse-btn:active {
		transform: scale(0.95);
		background: #E9ECEF;
	}

	.action-icon {
		font-size: 36rpx;
	}

	.copy-icon {
		color: #007AFF;
	}

	.expand-icon {
		color: #666;
	}

	/* 详细信息区域样式 */
	.detail-info-section {
		padding: 4rpx 10rpx 2rpx 10rpx; /* 进一步减少内边距 */
		background: #F8F9FA;
		border-top: 2rpx solid #E9ECEF;
	}

	.info-grid-row {
		display: flex;
		gap: 6rpx; /* 保持卡片间距 */
		margin-bottom: 1rpx; /* 大幅减少行间距 */
	}

	/* 两列布局 */
	.info-grid-row.two-columns .info-card {
		flex: 1;
		max-width: calc(50% - 3rpx);
	}

	.info-grid-row:last-child {
		margin-bottom: 0;
	}

	.info-card {
		flex: 1;
		background: white;
		border-radius: 6rpx;
		padding: 10rpx 12rpx; /* 进一步增加内边距以适应更大字体 */
		box-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.03);
		border: 1rpx solid #F0F0F0;
		transition: all 0.3s ease;
	}

	.info-card.full-width {
		flex: none;
		width: 100%;
	}

	.card-icon {
		font-size: 26rpx; /* 进一步增加图标大小 */
		margin-right: 5rpx; /* 增加右边距 */
	}

	.card-icon.large {
		font-size: 28rpx; /* 进一步增加大图标大小 */
	}

	.card-label {
		font-size: 26rpx; /* 进一步增加标签字体 */
		color: #666;
		margin-bottom: 4rpx; /* 增加标签和内容之间的距离 */
		display: block;
		font-weight: 500;
	}

	.card-content {
		font-size: 28rpx; /* 进一步增加内容字体 */
		color: #333;
		font-weight: 600;
		margin-top: 1rpx;
	}

	.card-content.primary {
		font-size: 30rpx; /* 进一步增加主要内容字体 */
		font-weight: 700;
		color: #007AFF;
	}

	.card-content.clickable {
		color: #007AFF;
		text-decoration: underline;
		font-size: 28rpx; /* 进一步增加可点击内容字体 */
		font-weight: 600;
	}

	.card-content.no-data {
		color: #999;
		font-style: italic;
	}

	/* 手机号卡片 - 可点击样式 */
	.phone-card {
		background: #ffffff;
		border: 1rpx solid rgba(66, 184, 131, 0.2);
		cursor: pointer;
	}

	.phone-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4rpx;
		background: linear-gradient(90deg, #42b883 0%, #85ce61 100%);
	}

	.phone-card:active {
		transform: scale(0.98);
	}

	/* 地址卡片 */
	.address-card {
		background: #ffffff;
		border: 1rpx solid rgba(255, 149, 0, 0.2);
	}

	.address-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4rpx;
		background: linear-gradient(90deg, #ff9500 0%, #ffad33 100%);
	}

	.time-card-header,
	.address-card-header {
		display: flex;
		align-items: center;
		margin-bottom: 5rpx; /* 进一步增加头部和内容之间的距离以适应更大字体 */
	}

	.time-content-row,
	.address-content-row {
		margin-top: 2rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.waiting-text-inline {
		font-size: 24rpx;
		color: #ff6b35;
		margin-left: 12rpx;
		font-weight: 500;
	}

	/* 操作按钮卡片样式 */
	.action-buttons-card {
		background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%);
		border: 1rpx solid #e9ecef;
		padding: 8rpx 12rpx;
		min-height: 60rpx !important;
	}

	.action-buttons-card .action-buttons {
		display: flex;
		justify-content: center;
		gap: 12rpx;
	}

	/* 时间卡片和地址卡片特殊样式 */
	.time-card,
	.address-card {
		min-height: 42rpx !important; /* 进一步增加最小高度以适应更大字体 */
		padding: 8rpx 10rpx !important; /* 进一步增加内边距以适应更大字体 */
	}

	.time-card .card-label,
	.address-card .card-label {
		font-size: 24rpx; /* 进一步增加标签字体 */
		margin-bottom: 3rpx; /* 增加底部间距 */
		font-weight: 600;
	}

	.time-card .card-content,
	.address-card .card-content {
		font-size: 26rpx; /* 进一步增加内容字体 */
		line-height: 1.1;
		font-weight: 600;
	}

	.waiting-text-inline {
		font-size: 20rpx;
		color: #FF6B35;
		font-weight: 500;
	}

	.card-content-detail {
		display: flex;
		flex-direction: column;
		gap: 4rpx;
	}

	.approval-status-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 16rpx;
	}

	.status-badge {
		padding: 8rpx 16rpx;
		border-radius: 20rpx;
		font-size: 24rpx;
		font-weight: 500;
	}

	.status-badge.status-pending {
		background: #FFF3CD;
		color: #856404;
		border: 2rpx solid #FFEAA7;
	}

	.status-badge.status-approved {
		background: #D4EDDA;
		color: #155724;
		border: 2rpx solid #C3E6CB;
	}

	.status-badge.status-rejected {
		background: #F8D7DA;
		color: #721C24;
		border: 2rpx solid #F5C6CB;
	}

	.status-badge.status-unknown {
		background: #E2E3E5;
		color: #383D41;
		border: 2rpx solid #D6D8DB;
	}

	.action-buttons {
		display: flex;
		gap: 12rpx;
	}

	.action-btn {
		display: flex;
		align-items: center;
		gap: 4rpx;
		padding: 8rpx 16rpx;
		border-radius: 10rpx;
		font-size: 22rpx;
		font-weight: 500;
		transition: all 0.3s ease;
		height: 50rpx;
	}

	.action-btn.approve-btn {
		background: #28A745;
		color: white;
	}

	.action-btn.approve-btn:active {
		background: #218838;
		transform: scale(0.95);
	}

	.action-btn.reject-btn {
		background: #DC3545;
		color: white;
	}

	.action-btn.reject-btn:active {
		background: #C82333;
		transform: scale(0.95);
	}

	.btn-icon {
		font-size: 20rpx;
	}

	.btn-text {
		font-size: 22rpx;
	}

	/* ==================== 工作台样式 ==================== */
	.workspace-section {
		padding: 20rpx;
	}

	.urgent-section {
		background: linear-gradient(135deg, #fff2f0, #fff7f0);
		border: 2rpx solid #ff7875;
		border-radius: 16rpx;
		padding: 24rpx;
		margin-bottom: 24rpx;
	}

	.section-title {
		display: flex;
		align-items: center;
		margin-bottom: 16rpx;

		.title-icon {
			font-size: 32rpx;
			margin-right: 12rpx;
		}

		.title-text {
			font-size: 32rpx;
			font-weight: 600;
			color: #262626;
		}
	}

	.urgent-items {
		display: flex;
		flex-direction: column;
		gap: 12rpx;
	}

	.urgent-item {
		display: flex;
		align-items: center;
		gap: 8rpx;

		.urgent-label {
			font-size: 28rpx;
			color: #595959;
		}

		.urgent-value {
			font-size: 28rpx;
			font-weight: 600;
			color: #ff4d4f;
		}

		.urgent-desc {
			font-size: 24rpx;
			color: #8c8c8c;
		}
	}

	.progress-section {
		background: #ffffff;
		border-radius: 16rpx;
		padding: 24rpx;
		margin-bottom: 24rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
	}

	.progress-content {
		display: flex;
		flex-direction: column;
		gap: 16rpx;
	}

	.progress-bar-container {
		display: flex;
		flex-direction: column;
		gap: 8rpx;
	}

	.progress-info {
		display: flex;
		justify-content: space-between;
		align-items: center;

		.progress-text {
			font-size: 28rpx;
			color: #595959;
		}

		.progress-percent {
			font-size: 32rpx;
			font-weight: 600;
			color: #1890ff;
		}
	}

	.progress-bar {
		height: 12rpx;
		background: #f0f0f0;
		border-radius: 6rpx;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #1890ff, #40a9ff);
		border-radius: 6rpx;
		transition: width 0.3s ease;
	}

	.progress-detail {
		font-size: 24rpx;
		color: #8c8c8c;
		text-align: center;
	}

	.efficiency-info {
		display: flex;
		align-items: center;
		gap: 8rpx;

		.efficiency-label {
			font-size: 28rpx;
			color: #595959;
		}

		.efficiency-value {
			font-size: 28rpx;
			font-weight: 600;
			color: #52c41a;
		}
	}

	.vehicle-section {
		background: #ffffff;
		border-radius: 16rpx;
		padding: 24rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
	}

	.vehicle-stats {
		display: flex;
		flex-direction: column;
		gap: 12rpx;
	}

	.vehicle-stat-item {
		display: flex;
		align-items: center;
		gap: 8rpx;

		.stat-label {
			font-size: 28rpx;
			color: #595959;
		}

		.stat-value {
			font-size: 28rpx;
			font-weight: 600;
			color: #1890ff;
		}

		.stat-detail {
			font-size: 24rpx;
			color: #ff4d4f;
		}
	}

	/* ==================== 数据分析样式 ==================== */
	.analytics-section {
		padding: 20rpx;
	}

	.chart-item {
		background: #ffffff;
		border-radius: 16rpx;
		padding: 24rpx;
		margin-bottom: 24rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
	}

	.chart-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #262626;
		margin-bottom: 20rpx;
		display: flex;
		align-items: center;
		gap: 8rpx;
	}

	.trend-chart {
		height: 300rpx;
	}

	.chart-container {
		height: 100%;
		position: relative;
	}

	.trend-line-chart {
		height: 100%;
		position: relative;
		padding: 20rpx 0;
	}

	.chart-grid {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 40rpx;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.grid-line {
		height: 1rpx;
		background: #f0f0f0;
	}

	.trend-points {
		position: absolute;
		top: 20rpx;
		left: 0;
		right: 0;
		bottom: 60rpx;
	}

	.trend-point {
		position: absolute;
		display: flex;
		flex-direction: column;
		align-items: center;

		.point-dot {
			width: 12rpx;
			height: 12rpx;
			background: #1890ff;
			border-radius: 50%;
			border: 3rpx solid #ffffff;
			box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.3);
		}

		.point-value {
			font-size: 20rpx;
			color: #1890ff;
			font-weight: 600;
			margin-top: 8rpx;
		}
	}

	.x-axis-labels {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		justify-content: space-between;
		padding: 0 20rpx;
	}

	.axis-label {
		font-size: 24rpx;
		color: #8c8c8c;
	}

	.status-distribution {
		display: flex;
		align-items: center;
		gap: 40rpx;
	}

	.pie-chart-simple {
		width: 120rpx;
		height: 120rpx;
		border-radius: 50%;
		background: conic-gradient(#52c41a 0deg 69deg,
				#1890ff 69deg 298deg,
				#ff4d4f 298deg 360deg);
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;

		&::before {
			content: '';
			width: 80rpx;
			height: 80rpx;
			background: #ffffff;
			border-radius: 50%;
			position: absolute;
		}
	}

	.pie-center-info {
		position: relative;
		z-index: 1;
		text-align: center;

		.center-number {
			display: block;
			font-size: 28rpx;
			font-weight: 600;
			color: #262626;
		}

		.center-label {
			font-size: 20rpx;
			color: #8c8c8c;
		}
	}

	.status-stats {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 12rpx;
	}

	.status-item {
		display: flex;
		align-items: center;
		gap: 12rpx;

		.status-dot {
			width: 16rpx;
			height: 16rpx;
			border-radius: 50%;
		}

		.status-text {
			font-size: 26rpx;
			color: #595959;
		}

		&.approved .status-dot {
			background: #52c41a;
		}

		&.pending .status-dot {
			background: #1890ff;
		}

		&.rejected .status-dot {
			background: #ff4d4f;
		}
	}

	.efficiency-metrics {
		display: flex;
		flex-direction: column;
		gap: 16rpx;
	}

	.metric-item {
		display: flex;
		align-items: center;
		gap: 8rpx;

		.metric-label {
			font-size: 28rpx;
			color: #595959;
		}

		.metric-value {
			font-size: 28rpx;
			font-weight: 600;

			&.success {
				color: #52c41a;
			}
		}

		.metric-trend {
			font-size: 24rpx;

			&.trend-up {
				color: #52c41a;
			}

			&.trend-down {
				color: #ff4d4f;
			}

			&.trend-stable {
				color: #8c8c8c;
			}
		}
	}

	.comparison-up {
		color: #52c41a;
	}

	.comparison-down {
		color: #ff4d4f;
	}

	.comparison-stable {
		color: #8c8c8c;
	}

	/* 动画效果 */
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-10rpx);
		}

		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* ==================== 新饼图样式 ==================== */
	/* 饼图容器 */
	.pie-chart-container {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	/* 饼图可视化部分 */
	.pie-chart-visual {
		display: flex;
		justify-content: center;
		margin-bottom: 24rpx;
	}

	.pie-chart-circle {
		width: 200rpx;
		height: 200rpx;
		border-radius: 50%;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
	}

	.pie-center {
		width: 120rpx;
		height: 120rpx;
		background: #fff;
		border-radius: 50%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
	}

	.pie-total {
		font-size: 32rpx;
		font-weight: bold;
		color: #303133;
		line-height: 1;
	}

	.pie-label {
		font-size: 20rpx;
		color: #909399;
		margin-top: 4rpx;
	}

	/* 饼图图例 */
	.pie-legend {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 12rpx;
	}

	.legend-item {
		display: flex;
		align-items: center;
		padding: 8rpx 12rpx;
		background: #f8f9fa;
		border-radius: 8rpx;
	}

	.legend-dot {
		width: 16rpx;
		height: 16rpx;
		border-radius: 50%;
		margin-right: 12rpx;
		flex-shrink: 0;
	}

	.legend-dot.pending {
		background: #e6a23c;
	}

	.legend-dot.approved {
		background: #67c23a;
	}

	.legend-dot.rejected {
		background: #f56c6c;
	}

	.legend-text {
		font-size: 24rpx;
		color: #606266;
		flex: 1;
	}

	.legend-percent {
		font-size: 22rpx;
		color: #909399;
		margin-left: 8rpx;
	}

	/* ==================== 可点击卡片样式 ==================== */
	.clickable-card {
		position: relative;
		transition: all 0.3s ease;
		cursor: pointer;

		&:hover {
			transform: translateY(-2rpx);
			box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
		}

		&:active {
			transform: translateY(0);
		}
	}

	.card-click-hint {
		position: absolute;
		bottom: 8rpx;
		right: 12rpx;
		opacity: 0.7;

		.hint-text {
			font-size: 20rpx;
			color: #999;
			background: rgba(255, 255, 255, 0.8);
			padding: 2rpx 8rpx;
			border-radius: 8rpx;
		}
	}

	/* ==================== 图表描述样式 ==================== */
	.chart-description {
		margin-top: 16rpx;
		padding-top: 16rpx;
		border-top: 1rpx solid #f0f0f0;

		.desc-text {
			font-size: 24rpx;
			color: #8c8c8c;
			line-height: 1.4;
			text-align: center;
		}
	}

	/* ==================== 流量图增强样式 ==================== */
	.flow-chart {
		position: relative;
	}

	.flow-bars {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		height: 120rpx;
		padding: 0 8rpx;
		margin-bottom: 8rpx;
	}

	.flow-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		flex: 1;
		max-width: 40rpx;
	}

	.flow-bar {
		width: 24rpx;
		background: linear-gradient(to top, #1890ff, #40a9ff);
		border-radius: 4rpx 4rpx 0 0;
		min-height: 4rpx;
		margin-bottom: 8rpx;
		transition: all 0.3s ease;

		&:hover {
			background: linear-gradient(to top, #096dd9, #1890ff);
		}
	}

	.flow-label {
		font-size: 20rpx;
		color: #8c8c8c;
		transform: rotate(-45deg);
		white-space: nowrap;
	}

	/* ==================== 新增数据分析样式 ==================== */

	/* 美化版样式 */
	.chart-icon-wrapper {
		width: 48rpx;
		height: 48rpx;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 12rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 16rpx;
	}

	.chart-title-wrapper {
		flex: 1;
	}

	.chart-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #ffffff !important;
		margin-bottom: 4rpx;
	}

	.chart-subtitle {
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.8) !important;
	}

	.expand-button {
		background: rgba(255, 255, 255, 0.2);
		border-radius: 20rpx;
		padding: 12rpx 20rpx;
		display: flex;
		align-items: center;
		border: 1rpx solid rgba(255, 255, 255, 0.3);
		transition: all 0.3s ease;
	}

	.expand-button:active {
		background: rgba(255, 255, 255, 0.3);
		transform: scale(0.95);
	}

	.expand-text {
		font-size: 24rpx;
		color: #ffffff;
		margin-right: 8rpx;
	}

	.expand-arrow {
		font-size: 20rpx;
		color: #ffffff;
	}

	/* 趋势分析增强样式 - 美化版 */
	.trend-analysis-card {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 16rpx;
		overflow: hidden;
		box-shadow: 0 8rpx 32rpx rgba(102, 126, 234, 0.3);
		margin-bottom: 20rpx;

		.chart-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 20rpx;
			padding: 24rpx;
			background: rgba(255, 255, 255, 0.1);
			backdrop-filter: blur(10rpx);

			.header-left {
				display: flex;
				align-items: center;
				gap: 8rpx;
			}
		}

		.trend-summary {
			display: flex;
			justify-content: space-around;
			padding: 16rpx;
			background: #f8f9fa;
			border-radius: 12rpx;
			margin-bottom: 20rpx;

			.summary-item {
				text-align: center;

				.summary-value {
					display: block;
					font-size: 32rpx;
					font-weight: bold;
					color: #409eff;
				}

				.summary-label {
					font-size: 22rpx;
					color: #909399;
					margin-top: 4rpx;
				}
			}
		}

		.trend-chart-enhanced {
			transition: all 0.3s ease;

			&.expanded {
				.chart-bars-enhanced {
					height: 200rpx;
				}
			}
		}

		.chart-bars-enhanced {
			display: flex;
			align-items: flex-end;
			justify-content: space-between;
			height: 120rpx;
			padding: 0 8rpx;
			margin-bottom: 16rpx;
		}

		.bar-item-enhanced {
			display: flex;
			flex-direction: column;
			align-items: center;
			flex: 1;
			cursor: pointer;
			transition: all 0.2s ease;

			&:hover {
				transform: translateY(-2rpx);
			}
		}

		.bar-container-enhanced {
			display: flex;
			flex-direction: column;
			align-items: center;
			width: 32rpx;
			margin-bottom: 8rpx;
		}

		.bar-approved-enhanced,
		.bar-rejected-enhanced {
			width: 100%;
			border-radius: 8rpx 8rpx 0 0;
			min-height: 8rpx;
			position: relative;
			transition: all 0.3s ease;
			box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
			display: flex;
			align-items: flex-end;

			.bar-value {
				position: absolute;
				top: -26rpx;
				left: 50%;
				transform: translateX(-50%);
				font-size: 20rpx;
				color: #303133;
				font-weight: 700;
				background: rgba(255, 255, 255, 0.95);
				padding: 4rpx 8rpx;
				border-radius: 8rpx;
				border: 1rpx solid rgba(0, 0, 0, 0.1);
				box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
				white-space: nowrap;
				z-index: 10;
			}
		}

		.bar-approved-enhanced {
			background: linear-gradient(to top, #52c41a, #73d13d);
			box-shadow: 0 4rpx 12rpx rgba(82, 196, 26, 0.3);
		}

		.bar-rejected-enhanced {
			background: linear-gradient(to top, #ff4d4f, #ff7875);
			box-shadow: 0 4rpx 12rpx rgba(255, 77, 79, 0.3);
		}

		.bar-label-enhanced {
			font-size: 22rpx;
			color: #606266;
			margin-bottom: 4rpx;
		}

		.bar-date {
			font-size: 18rpx;
			color: #909399;
		}

		.bar-trend {
			font-size: 16rpx;
			margin-top: 2rpx;
		}

		.chart-legend-enhanced {
			.legend-items {
				display: flex;
				justify-content: center;
				gap: 24rpx;
				margin-bottom: 12rpx;

				.legend-item {
					display: flex;
					align-items: center;
					gap: 6rpx;

					.legend-color {
						width: 12rpx;
						height: 12rpx;
						border-radius: 2rpx;

						&.approved {
							background: #67c23a;
						}

						&.rejected {
							background: #f56c6c;
						}
					}

					.legend-text {
						font-size: 22rpx;
						color: #606266;
					}
				}
			}

			.chart-tip {
				font-size: 20rpx;
				color: #909399;
				text-align: center;
				margin-bottom: 8rpx;
			}

			.trend-insight {
				font-size: 22rpx;
				color: #409eff;
				text-align: center;
				background: #f0f9ff;
				padding: 8rpx 12rpx;
				border-radius: 8rpx;
			}
		}
	}

	/* 工作效率分析美化样式 */
	.efficiency-analysis-card-enhanced {
		background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
		border-radius: 16rpx;
		overflow: hidden;
		box-shadow: 0 8rpx 32rpx rgba(14, 165, 233, 0.15);
		margin-bottom: 20rpx;
		border: 1rpx solid rgba(14, 165, 233, 0.1);
	}

	.chart-header-enhanced {
		padding: 24rpx;
		background: rgba(255, 255, 255, 0.8);
		backdrop-filter: blur(10rpx);
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1rpx solid rgba(14, 165, 233, 0.1);
	}

	.header-left-enhanced {
		display: flex;
		align-items: center;
		flex: 1;
	}

	.efficiency-icon-wrapper {
		width: 48rpx;
		height: 48rpx;
		background: rgba(14, 165, 233, 0.15);
		border-radius: 12rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 16rpx;
	}

	.efficiency-title-wrapper {
		flex: 1;
	}

	.efficiency-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #0f172a;
		margin-bottom: 4rpx;
	}

	.efficiency-subtitle {
		font-size: 24rpx;
		color: #475569;
	}

	.header-right-enhanced {
		display: flex;
		align-items: center;
	}

	.efficiency-expand-button {
		background: rgba(14, 165, 233, 0.1);
		border-radius: 20rpx;
		padding: 12rpx 20rpx;
		display: flex;
		align-items: center;
		border: 1rpx solid rgba(14, 165, 233, 0.2);
		transition: all 0.3s ease;
	}

	.efficiency-expand-button:active {
		background: rgba(14, 165, 233, 0.2);
		transform: scale(0.95);
	}

	.efficiency-expand-text {
		font-size: 24rpx;
		color: #0f172a;
		margin-right: 8rpx;
	}

	.efficiency-expand-arrow {
		font-size: 20rpx;
		color: #0f172a;
	}

	/* 美化内容区域 */
	.chart-content-enhanced {
		padding: 24rpx;
		background: rgba(255, 255, 255, 0.9);
		border-radius: 0 0 16rpx 16rpx;
	}

	.section-header-enhanced {
		display: flex;
		align-items: center;
		margin-bottom: 16rpx;
	}

	.section-icon-wrapper {
		width: 32rpx;
		height: 32rpx;
		background: rgba(14, 165, 233, 0.15);
		border-radius: 8rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 12rpx;
	}

	.section-icon-wrapper.urgent {
		background: rgba(239, 68, 68, 0.15);
	}

	.section-title-enhanced {
		font-size: 28rpx;
		font-weight: 600;
		color: #0f172a;
	}

	.attention-content-enhanced {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16rpx;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 12rpx;
		border-left: 4rpx solid #ff4d4f;
	}

	.attention-text-enhanced {
		font-size: 26rpx;
		color: #8b4513;
		flex: 1;
	}

	.urgent-action-button {
		background: linear-gradient(135deg, #ff4d4f, #ff7875);
		border-radius: 20rpx;
		padding: 12rpx 24rpx;
		box-shadow: 0 4rpx 12rpx rgba(255, 77, 79, 0.3);
		transition: all 0.3s ease;
	}

	.urgent-action-button:active {
		transform: scale(0.95);
		box-shadow: 0 2rpx 8rpx rgba(255, 77, 79, 0.4);
	}

	.urgent-button-text {
		font-size: 24rpx;
		color: #ffffff;
		font-weight: 600;
	}

	/* 简化版饼状图样式 */
	.pie-chart-simple {
		position: relative;
		width: 200rpx;
		height: 200rpx;
		margin: 0 auto;
		cursor: pointer;
	}

	.pie-progress-container {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		overflow: hidden;
		background: #f5f5f5;
		display: flex;
		flex-direction: column;
	}

	.progress-ring {
		height: 33.33%;
		width: 100%;
		position: relative;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		transition: width 0.8s ease;
		border-radius: 0 100rpx 100rpx 0;
	}

	.pending-ring {
		background: rgba(230, 162, 60, 0.1);
	}

	.approved-ring {
		background: rgba(103, 194, 58, 0.1);
	}

	.rejected-ring {
		background: rgba(245, 108, 108, 0.1);
	}

	.pie-center-simple {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		text-align: center;
		background: #ffffff;
		border-radius: 50%;
		width: 120rpx;
		height: 120rpx;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
	}

	.pie-total-simple {
		font-size: 36rpx;
		font-weight: 600;
		color: #333;
		margin-bottom: 4rpx;
	}

	.pie-label-simple {
		font-size: 20rpx;
		color: #999;
	}

	/* 最基础的饼图样式 - 兼容版 */
	.pie-chart-wrapper {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		height: 200rpx;
	}

	.pie-chart-basic {
		position: relative;
		width: 180rpx;
		height: 180rpx;
		border-radius: 50%;
		overflow: hidden;
		background: #f5f5f5;
		cursor: pointer;
		transition: transform 0.3s ease;
	}

	.pie-chart-basic:active {
		transform: scale(0.95);
	}

	.pie-background {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		background: #f5f5f5;
	}

	.pie-data-display {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		overflow: hidden;
	}

	.pie-segment {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border-radius: 50%;
	}

	.pending-segment {
		background: linear-gradient(45deg, #e6a23c 0%, #e6a23c 40%, transparent 40%);
	}

	.approved-segment {
		background: linear-gradient(135deg, #67c23a 0%, #67c23a 40%, transparent 40%);
	}

	.rejected-segment {
		background: linear-gradient(225deg, #f56c6c 0%, #f56c6c 40%, transparent 40%);
	}

	.pie-center-display {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: #ffffff;
		border-radius: 50%;
		width: 100rpx;
		height: 100rpx;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
		z-index: 10;
	}

	.pie-total-text {
		font-size: 32rpx;
		font-weight: 600;
		color: #333;
		margin-bottom: 4rpx;
	}

	.pie-label-text {
		font-size: 18rpx;
		color: #999;
	}

	.pie-chart-empty {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 180rpx;
		height: 180rpx;
		border-radius: 50%;
		background: #f5f5f5;
		border: 2rpx dashed #ddd;
		margin: 0 auto;
	}

	/* 新的饼图渐变样式 */
	.pie-chart-gradient {
		position: relative;
		width: 180rpx;
		height: 180rpx;
		border-radius: 50%;
		margin: 0 auto;
		cursor: pointer;
		transition: transform 0.3s ease;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
	}

	.pie-chart-gradient:active {
		transform: scale(0.95);
	}

	.empty-text {
		font-size: 24rpx;
		color: #999;
	}

	// 容器样式调整 - 避免被导航栏遮挡
	.container {
		padding-top: 100rpx !important;
	}

	// 自定义导航栏样式
	.custom-navbar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 999;
		background: #0081ff;
		padding-top: var(--status-bar-height);

		.navbar-content {
			height: 44px;
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 0 16rpx;

			.navbar-left {
				width: 80rpx;
				display: flex;
				align-items: center;

				.back-button {
					width: 64rpx;
					height: 64rpx;
					display: flex;
					align-items: center;
					justify-content: center;
					border-radius: 50%;
					background: rgba(255, 255, 255, 0.1);
					transition: all 0.3s ease;

					&:active {
						background: rgba(255, 255, 255, 0.2);
						transform: scale(0.95);
					}
				}
			}

			.navbar-title {
				flex: 1;
				text-align: center;

				text {
					font-size: 18px;
					font-weight: 500;
					color: white;
				}
			}

			.navbar-right {
				width: 80rpx;
				display: flex;
				align-items: center;
				justify-content: flex-end;

				.search-button {
					width: 64rpx;
					height: 64rpx;
					display: flex;
					align-items: center;
					justify-content: center;
					border-radius: 50%;
					background: rgba(255, 255, 255, 0.1);
					transition: all 0.3s ease;

					&:active {
						background: rgba(255, 255, 255, 0.2);
						transform: scale(0.95);
					}
				}
			}
		}
	}
</style>