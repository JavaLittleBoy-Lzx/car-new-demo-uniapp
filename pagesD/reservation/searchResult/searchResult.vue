<template>
	<view class="container">
		<!-- 欢迎界面 - 当无搜索条件和筛选时显示 -->
		<view class="welcome-section" v-if="showWelcomeInterface">
			<!-- 核心功能区块 -->
			<view class="main-content">
				<!-- Deepseek风格图标 -->
				<u-row justify="center">
					<u-col span="auto">
						<view class="icon-wrapper">
							<image src="/static/巡查驻点.png" style="width: 70px; height: 70px;"></image>
							<text class="main-title">快速查车</text>
							<text class="sub-title">智慧出行服务系统 V1.1</text>
						</view>
					</u-col>
				</u-row>

				<!-- 主搜索框 -->
				<view class="welcome-search-container">
					<view class="search-input-wrapper">
						<input class="search-input" v-model="searchKeyword" placeholder="输入车牌号/姓名/手机号/地址..."
							@input="handleSearchInput" @focus="handleSearchFocus" @blur="handleSearchBlur"
							@confirm="handleSearchConfirm" :focus="searchInputFocus" adjust-position="true"
							cursor-spacing="10" hold-keyboard="true" confirm-type="search" />
						<view class="search-actions">
							<view class="voice-search" @click="startVoiceSearch" v-if="!searchKeyword">
								<text class="icon-emoji" style="color: #409EFF">🎤</text>
							</view>
							<view class="clear-search" @click="clearSearch" v-if="searchKeyword">
								<text class="icon-emoji" style="color: #C0C4CC">✕</text>
							</view>
							<view class="search-button" @click="handleSearchConfirm">
								<text class="icon-emoji" style="color: #FFFFFF">🔍</text>
							</view>
						</view>
					</view>

					<!-- 搜索建议下拉框 - 修复键盘遮挡问题 -->
					<view class="search-suggestions" v-if="showSuggestions"
						:style="{ transform: 'translateY(' + (keyboardHeight > 0 ? '-' + (keyboardHeight - 100) + 'px' : '0') + ')' }">
						<scroll-view scroll-y class="suggestions-scroll"
							v-if="searchSuggestions && searchSuggestions.length > 0" :scroll-top="suggestionScrollTop"
							:enable-back-to-top="false" :show-scrollbar="true" :enhanced="true" :bounces="true"
							:fast-deceleration="false">
							<view class="suggestion-item" v-for="(suggestion, index) in searchSuggestions" :key="index"
								@click="selectSuggestionByIndex(index)" @touchstart="handleTouchStart"
								@touchend="handleTouchEnd">
								<view class="suggestion-icon">
									<text class="icon-emoji"
										:style="{ color: getSuggestionIconColor((suggestion && suggestion.type) || 'default') }">
										{{ getSuggestionIcon((suggestion && suggestion.type) || 'default') }}
									</text>
								</view>
								<view class="suggestion-content">
									<text class="suggestion-text">{{ (suggestion && suggestion.text) || '未知' }}</text>
									<text
										class="suggestion-type">{{ getSuggestionTypeText((suggestion && suggestion.type) || 'default') }}</text>
								</view>
								<view class="suggestion-arrow">
									<text class="icon-emoji" style="color: #c0c4cc">➡</text>
								</view>
							</view>
						</scroll-view>

						<!-- 没有找到建议时的提示 -->
						<view class="no-suggestions" v-if="!searchSuggestions || searchSuggestions.length === 0">
							<view class="no-suggestions-content">
								<text class="icon-emoji" style="color: #909399; margin-right: 8rpx">🔍</text>
								<text class="no-suggestions-text">没有找到匹配的建议</text>
							</view>
							<view class="no-suggestions-tip">
								<text class="tip-text">可以尝试输入车牌号、姓名、手机号或地址</text>
							</view>
						</view>

						<view class="suggestions-footer" v-if="searchSuggestions && searchSuggestions.length > 0">
							<text class="footer-text">找到 {{ (searchSuggestions || []).length }} 个匹配项</text>
						</view>
					</view>
				</view>

				<!-- 搜索历史 -->
				<view class="search-history" v-if="showSearchHistory && searchHistory && searchHistory.length > 0">
					<view class="history-header">
						<view class="history-title">
							<text class="icon-emoji" style="color: #909399; margin-right: 8rpx">🕐</text>
							<text>搜索历史</text>
						</view>
						<view class="clear-history" @click="clearSearchHistory">
							<text class="icon-emoji" style="color: #909399; margin-right: 6rpx">🗑️</text>
							<text>清空</text>
						</view>
					</view>
					<view class="history-content">
						<view class="history-item" v-for="(item, index) in recentSearchHistory" :key="index"
							@click="useHistorySearch(item)" v-if="item && item.keyword">
							<view class="history-icon">
								<text
									class="icon-emoji">{{ getHistoryIcon(item && item.type ? item.type : 'keyword') }}</text>
							</view>
							<text class="history-text">{{ (item && item.keyword) ? item.keyword : '未知' }}</text>
							<view class="history-time">
								{{ formatHistoryTime(item && item.time ? item.time : Date.now()) }}</view>
							<view class="history-delete" @click.stop="removeSearchHistory(index)">
								<text class="icon-emoji" style="color: #999">✕</text>
							</view>
						</view>
					</view>
				</view>

				<!-- 热门搜索标签 -->
				<view class="hot-search-tags" v-if="showHotSearch">
					<view class="tags-header">
						<text class="icon-emoji" style="color: #FF6B35; margin-right: 8rpx">🔥</text>
						<text class="tags-title">热门搜索</text>
					</view>
					<view class="tags-container">
						<view class="hot-tag" v-for="(tag, index) in hotSearchTags" :key="index"
							@click="selectHotTag(tag)">
							<view class="tag-content">
								<text class="tag-text">{{ tag.text }}</text>
								<text class="tag-count">{{ tag.count }}</text>
							</view>
						</view>
					</view>
				</view>

				<!-- 快速操作入口 -->
				<view class="quick-actions">
					<view class="action-item" @click="showAdvancedFeatures">
						<text class="icon-emoji" style="color: #409EFF; margin-right: 12rpx">⚙️</text>
						<text class="action-text">高级功能</text>
						<text class="icon-emoji" style="color: #C0C4CC">➡</text>
					</view>
					<view class="action-item" @click="showTodayData">
						<text class="icon-emoji" style="color: #67C23A; margin-right: 12rpx">📊</text>
						<text class="action-text">今日数据</text>
						<text class="action-count">{{ getTodayCount() }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 功能界面 - 当有搜索条件或筛选时显示 -->
		<view class="functional-section" v-if="!showWelcomeInterface">
			<!-- 顶部固定区域 -->
			<view class="function-header">
				<!-- 智能搜索区域 -->
				<view class="intelligent-search-section">
					<view class="search-header">
						<text class="search-title">🔍 智能搜索</text>
						<view class="search-stats">
							<text class="search-count">{{ (reservationList || []).length }} 条结果</text>
						</view>
					</view>

					<!-- 主搜索框 -->
					<view class="smart-search-container">
						<view class="search-input-wrapper">
							<input class="search-input" v-model="searchKeyword" placeholder="输入车牌号/姓名/手机号/地址..."
								@input="handleSearchInput" @focus="handleSearchFocus" @blur="handleSearchBlur"
								@confirm="handleSearchConfirm" :focus="searchInputFocus" adjust-position="true"
								cursor-spacing="10" hold-keyboard="true" confirm-type="search" />
							<view class="search-actions">
								<view class="voice-search" @click="startVoiceSearch" v-if="!searchKeyword">
									<text class="icon-emoji" style="color: #409EFF">🎤</text>
								</view>
								<view class="clear-search" @click="clearSearch" v-if="searchKeyword">
									<text class="icon-emoji" style="color: #C0C4CC">✕</text>
								</view>
								<view class="search-button" @click="handleSearchConfirm">
									<text class="icon-emoji" style="color: #FFFFFF">🔍</text>
								</view>
							</view>
						</view>

						<!-- 搜索建议下拉框 - 修复键盘遮挡问题 -->
						<view class="search-suggestions" v-if="showSuggestions"
							:style="{ transform: 'translateY(' + (keyboardHeight > 0 ? '-' + (keyboardHeight - 100) + 'px' : '0') + ')' }">
							<scroll-view scroll-y class="suggestions-scroll"
								v-if="searchSuggestions && searchSuggestions.length > 0"
								:scroll-top="suggestionScrollTop" :enable-back-to-top="false" :show-scrollbar="true"
								:enhanced="true" :bounces="true" :fast-deceleration="false">
								<view class="suggestion-item" v-for="(suggestion, index) in (searchSuggestions || [])"
									:key="index" @click="selectSuggestionByIndex(index)" @touchstart="handleTouchStart"
									@touchend="handleTouchEnd">
									<view class="suggestion-icon">
										<text class="icon-emoji"
											:style="{ color: getSuggestionIconColor((suggestion && suggestion.type) || 'default') }">
											{{ getSuggestionIcon((suggestion && suggestion.type) || 'default') }}
										</text>
									</view>
									<view class="suggestion-content">
										<text
											class="suggestion-text">{{ (suggestion && suggestion.text) || '未知' }}</text>
										<text
											class="suggestion-type">{{ getSuggestionTypeText((suggestion && suggestion.type) || 'default') }}</text>
									</view>
									<view class="suggestion-arrow">
										<text class="icon-emoji" style="color: #c0c4cc">➡</text>
									</view>
								</view>
							</scroll-view>

							<!-- 没有找到建议时的提示 -->
							<view class="no-suggestions" v-if="!searchSuggestions || searchSuggestions.length === 0">
								<view class="no-suggestions-content">
									<text class="icon-emoji" style="color: #909399; margin-right: 8rpx">🔍</text>
									<text class="no-suggestions-text">没有找到匹配的建议</text>
								</view>
								<view class="no-suggestions-tip">
									<text class="tip-text">可以尝试输入车牌号、姓名、手机号或地址</text>
								</view>
							</view>

							<view class="suggestions-footer" v-if="searchSuggestions && searchSuggestions.length > 0">
								<text class="footer-text">找到 {{ (searchSuggestions || []).length }} 个匹配项</text>
							</view>
						</view>
					</view>
				</view>

				<!-- 搜索结果信息 -->
				<view class="search-result-info" v-if="searchKeyword || isFiltering">
					<view class="result-count">
						<text class="icon-emoji" style="color: #409EFF; margin-right: 8rpx">📋</text>
						<text class="result-text">搜索结果: </text>
						<text class="result-number">{{ (reservationList || []).length }}</text>
						<text class="result-unit">条记录</text>
					</view>
					<view class="search-tags" v-if="searchKeyword">
						<view class="search-tag">
							<text class="tag-label">关键词:</text>
							<text class="tag-value">{{ searchKeyword }}</text>
							<text class="icon-emoji" style="color: #909399; margin-left: 8rpx"
								@click="clearSearch">✕</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 可滚动内容区域 -->
			<scroll-view scroll-y class="function-content">
				<!-- 今日数据看板 -->
				<view class="today-dashboard">
					<view class="dashboard-header">
						<view class="dashboard-title">
							<text class="icon-emoji" style="color: #409EFF; margin-right: 12rpx">📊</text>
							<text>今日数据看板</text>
						</view>
						<view class="dashboard-toggle" @click="showDashboard = !showDashboard">
							<text class="icon-emoji" style="color: #909399">{{ showDashboard ? '⬆️' : '⬇️' }}</text>
						</view>
					</view>

					<view class="dashboard-content" v-if="showDashboard">
						<!-- 实时统计 -->
						<view class="stats-section">
							<view class="section-title">📊 实时统计</view>
							<view class="stats-grid">
								<view class="stat-item clickable-stat" @click="filterByToday"
									:class="{ 'active': currentStatFilter === 'today' }">
									<text class="stat-value">{{ getTodayCount() }}</text>
									<text class="stat-label">今日新增</text>
									<text class="stat-trend" v-if="getTodayTrend()"
										:class="(getTodayTrend() && getTodayTrend().startsWith('+')) ? 'trend-up' : ((getTodayTrend() && getTodayTrend().startsWith('-')) ? 'trend-down' : 'trend-stable')">
										{{ getTodayTrend() }}
									</text>
									<view class="click-indicator">
										<text class="icon-emoji">👆</text>
									</view>
								</view>
								<view class="stat-item clickable-stat" @click="filterByPending"
									:class="{ 'active': currentStatFilter === 'pending' }">
									<text class="stat-value">{{ getPendingCount() }}</text>
									<text class="stat-label">待处理</text>
									<text class="stat-urgent">{{ getUrgentCount() }}个紧急</text>
									<view class="click-indicator">
										<text class="icon-emoji">👆</text>
									</view>
								</view>
								<view class="stat-item clickable-stat" @click="filterByCompleted"
									:class="{ 'active': currentStatFilter === 'completed' }">
									<text class="stat-value">{{ getCompletedCount() }}</text>
									<text class="stat-label">已完成</text>
									<text class="stat-vehicle">{{ getInParkingCount() }}辆在场</text>
									<view class="click-indicator">
										<text class="icon-emoji">👆</text>
									</view>
								</view>
							</view>
						</view>

						<!-- 处理效率 -->
						<view class="efficiency-section">
							<view class="section-title">📈 处理效率</view>
							<view class="efficiency-content">
								<view class="progress-item">
									<text class="progress-label">处理进度</text>
									<view class="progress-bar">
										<view class="progress-fill" :style="{width: getProcessPercent() + '%'}"></view>
									</view>
									<text class="progress-percent">{{ getProcessPercent() }}%</text>
								</view>
								<view class="efficiency-stats">
									<text class="efficiency-stat">平均处理时长: 1.5小时</text>
									<text class="efficiency-stat">高峰时段: 14:00-16:00</text>
								</view>
							</view>
						</view>
					</view>
				</view>

				<!-- 智能筛选器 -->
				<view class="smart-filter">
					<view class="filter-header">
						<view class="filter-title">
							<text class="icon-emoji" style="color: #409EFF; margin-right: 12rpx">🔽</text>
							<text>智能筛选</text>
						</view>
						<view class="filter-toggle" @click="showSmartFilter = !showSmartFilter">
							<text class="icon-emoji" style="color: #909399">{{ showSmartFilter ? '⬆️' : '⬇️' }}</text>
						</view>
					</view>

					<view class="filter-content" v-if="showSmartFilter">
						<!-- 时间范围筛选 -->
						<view class="filter-section">
							<view class="filter-section-title">⏰ 时间范围</view>
							<view class="time-filter-tags">
								<view class="time-tag" v-for="(timeOption, index) in (timeFilterOptions || [])"
									:key="index" :class="{'active': selectedTimeFilter === timeOption.key}"
									@click="selectTimeFilter(timeOption.key)">
									<text class="tag-text">{{ timeOption.name }}</text>
									<text class="tag-count"
										v-if="timeOption.count !== undefined">{{ timeOption.count }}</text>
								</view>
							</view>
						</view>

						<!-- 审批状态筛选 -->
						<view class="filter-section">
							<view class="filter-section-title">📋 审批状态</view>
							<view class="status-filter-tags">
								<view class="status-tag" v-for="(statusOption, index) in (statusFilterOptions || [])"
									:key="index" :class="{'active': selectedStatusFilter === statusOption.key}"
									@click="selectStatusFilter(statusOption.key)">
									<text class="tag-emoji">{{ statusOption.emoji }}</text>
									<text class="tag-text">{{ statusOption.name }}</text>
									<text class="tag-count">{{ statusOption.count }}</text>
								</view>
							</view>
						</view>

						<!-- 车辆状态筛选 -->
						<view class="filter-section">
							<view class="filter-section-title">🚗 车辆状态</view>
							<view class="vehicle-filter-tags">
								<view class="vehicle-tag" v-for="(vehicleOption, index) in (vehicleFilterOptions || [])"
									:key="index" :class="{'active': selectedVehicleFilter === vehicleOption.key}"
									@click="selectVehicleFilter(vehicleOption.key)">
									<text class="tag-emoji">{{ vehicleOption.emoji }}</text>
									<text class="tag-text">{{ vehicleOption.name }}</text>
									<text class="tag-count">{{ vehicleOption.count }}</text>
								</view>
							</view>
						</view>

						<!-- 筛选操作 -->
						<view class="filter-actions">
							<view class="reset-filter" @click="resetAllFilters">
								<text class="icon-emoji" style="color: #909399; margin-right: 8rpx">🔄</text>
								<text>重置筛选</text>
							</view>
							<view class="apply-filter" @click="applyFilters">
								<text class="icon-emoji" style="color: #FFFFFF; margin-right: 8rpx">✅</text>
								<text>应用筛选</text>
							</view>
						</view>
					</view>
				</view>

				<!-- 数据列表 -->
				<view class="data-list-container" v-if="reservationList && reservationList.length > 0">
					<view class="compact-list-item" v-for="(item, index) in (reservationList || [])" :key="index">
						<!-- 紧凑的默认显示行 -->
						<view class="compact-item-header">
							<!-- 时间标签 -->
							<view class="time-status-badge" :class="[
								isToday(item.time) ? 'time-status-today' :
								isYesterday(item.time) ? 'time-status-yesterday' :
								isWithinDays(item.time, 3) ? 'time-status-three-days' :
								isWithinDays(item.time, 5) ? 'time-status-five-days' :
								isWithinDays(item.time, 7) ? 'time-status-week' : ''
							]">
								{{ getTimeStatusText(item.time) }}
							</view>

							<!-- 车牌号 -->
							<view class="compact-plate-number"
								:class="item.plateNumber && item.plateNumber.length === 8 ? 'green-plate' : 'blue-plate'">
								<text class="plate-text">{{ item.plateNumber || '未知车牌' }}</text>
							</view>

							<!-- 状态标签 -->
							<view class="compact-status-badge"
								:class="item.vehicleStatus === '已进场' ? 'status-entered' : (item.vehicleStatus === '已离场' ? 'status-exited' : 'status-pending')">
								<text class="status-text">{{ item.vehicleStatus || item.status }}</text>
							</view>

							<!-- 操作按钮组 -->
							<view class="compact-actions">
								<view class="copy-button" @click="copyPlateNumber(item.plateNumber)">
									<text class="action-text">复制</text>
								</view>
								<view class="expand-button" @click="toggleExpand(index)">
									<text class="expand-text">{{ expandedItems[index] ? '收起' : '展开' }}</text>
									<text class="expand-icon">{{ expandedItems[index] ? '↑' : '↓' }}</text>
								</view>
							</view>
						</view>

						<!-- 展开的详细信息 -->
						<view class="compact-item-details" v-if="expandedItems[index]">
							<!-- 停车位置信息 -->
							<view class="detail-row" v-if="item.vehicleStatus === '已进场' && item.entryTime">
								<text class="detail-icon">📍</text>
								<text class="detail-label">停车位置：</text>
								<text class="detail-value">A区3号位</text>
							</view>

							<!-- 进场时间和停车时长 -->
							<view class="detail-row" v-if="item.entryTime">
								<text class="detail-icon">⏱️</text>
								<text class="detail-label">进场时间：</text>
								<text class="detail-value">{{ formatTime(item.entryTime) }} ({{ item.vehicleStatus === '已进场' ? '已停车' + calcDuration(item.entryTime, new Date()) : '已离场' }})</text>
							</view>

							<!-- 访客信息 -->
							<view class="detail-row">
								<text class="detail-icon">👤</text>
								<text class="detail-label">访客信息：</text>
								<text class="detail-value">{{ item.name }} {{ item.phone }}</text>
							</view>

							<!-- 访问地址 -->
							<view class="detail-row">
								<text class="detail-icon">🏠</text>
								<text class="detail-label">访问地址：</text>
								<text class="detail-value">{{ item.addressDetail }}</text>
							</view>
						</view>
					</view>
				</view>


				<!-- 无数据提示 -->
				<view class="empty-result"
					v-if="(!reservationList || reservationList.length === 0) && (searchKeyword || isFiltering || currentStatFilter)">
					<u-empty mode="data"></u-empty>
					<view class="empty-text">没有找到符合条件的预约</view>
					<view class="back-to-welcome" @click="backToWelcome">
						<text class="icon-emoji" style="color: #409EFF; margin-right: 8rpx">🏠</text>
						<text>返回主页</text>
					</view>
				</view>
			</scroll-view>
		</view>

		<!-- 自定义TabBar -->
		<custom-tabbar :userRole="currentUserRole" @tabChange="onTabChange">
		</custom-tabbar>
	</view>
</template>
<script>
	import dayjs from 'dayjs'
	import CustomTabbar from '@/components/custom-tabbar.vue'

	export default {
		components: {
			CustomTabbar
		},
		data() {
			return {
				currentUserRole: 'owner', // 默认业主角色
				currentUserPhone: '', // 当前用户手机号
				// 智能搜索相关数据
				searchKeyword: '',
				showSuggestions: false,
				showSearchHistory: false,
				showHotSearch: true,
				searchSuggestions: [],
				searchHistory: [], // 格式: [{ keyword: '', type: '', time: timestamp }]
				userInteracting: false, // 用户是否正在交互（防止意外隐藏建议）
				searchDebounceTimer: null, // 搜索防抖定时器
				searchInputFocus: false, // 控制搜索框焦点
				hasPerformedSearch: false, // 是否已执行过搜索操作
				keyboardHeight: 0, // 键盘高度
				suggestionScrollTop: 0, // 搜索建议滚动位置
				hotSearchTags: [{
						text: '黑A123456',
						count: 12,
						type: 'plate'
					},
					{
						text: '张先生',
						count: 8,
						type: 'name'
					},
					{
						text: '5栋',
						count: 15,
						type: 'address'
					},
					{
						text: '138****5678',
						count: 6,
						type: 'phone'
					},
					{
						text: '已通过',
						count: 25,
						type: 'status'
					},
					{
						text: '待审核',
						count: 18,
						type: 'status'
					},
					{
						text: '7栋8单元',
						count: 9,
						type: 'address'
					},
					{
						text: '黑AF12345',
						count: 14,
						type: 'plate'
					}
				],

				showFilterTools: false,
				showFilterTools2: false, // 新增的筛选工具折叠控制变量
				current1: 0,
				listSubsection: ["全部", "待审批", "已通过", "未通过"],
				showCalendar: false,
				mode: 'range',
				timeRange: '',
				currentStatus: 0,
				statusList: [{
						name: '全部'
					},
					{
						name: '待审核'
					},
					{
						name: '已通过'
					},
					{
						name: '未通过'
					}
				],
				filteredList: [],
				originalList: [], // 原始数据备份
				reservationList: [
					// 示例数据 - 蓝牌传统燃油车（7位车牌）
					{
						time: '2025-04-19 12:00',
						name: '张先生',
						phone: '138****5678',
						plateNumber: '黑A123456',
						status: '待审核',
						addressDetail: "5栋3单元802",
						duration: '2小时'
					},
					{
						time: '2025-04-18 14:00',
						name: '李女士',
						phone: '139****8765',
						plateNumber: '黑B678901',
						status: '未通过',
						addressDetail: "6栋2单元501",
					},
					{
						time: '2025-04-19 11:00',
						name: '王先生',
						phone: '135****4321',
						addressDetail: "7栋8单元502",
						plateNumber: '黑C543210',
						status: '已通过',
						entryTime: '2025-04-19 11:30',
						vehicleStatus: '已进场'
					},
					{
						time: '2025-04-18 14:00',
						name: '刘女士',
						phone: '137****9876',
						plateNumber: '黑D987654',
						status: '已通过',
						addressDetail: "8栋5单元103",
						entryTime: '2025-04-18 14:30',
						exitTime: '2025-04-18 16:30',
						vehicleStatus: '已离场'
					},
					// 新能源车辆 - 绿牌（8位车牌）
					{
						time: '2025-04-19 09:00',
						name: '陈先生',
						phone: '156****2468',
						plateNumber: '黑AF12345',
						status: '已通过',
						addressDetail: "1栋1单元101",
						entryTime: '2025-04-19 09:15',
						vehicleStatus: '已进场'
					},
					{
						time: '2025-04-18 16:00',
						name: '赵女士',
						phone: '186****1357',
						plateNumber: '黑AD98765',
						status: '已通过',
						addressDetail: "2栋6单元201",
						entryTime: '2025-04-18 16:10',
						exitTime: '2025-04-18 18:45',
						vehicleStatus: '已离场'
					},
					{
						time: '2025-04-17 10:30',
						name: '孙先生',
						phone: '152****7890',
						plateNumber: '黑AG6666',
						status: '待审核',
						addressDetail: "3栋4单元301"
					},
					{
						time: '2025-04-16 15:20',
						name: '周女士',
						phone: '188****5432',
						plateNumber: '黑AH8888',
						status: '未通过',
						addressDetail: "4栋7单元401"
					},
					// 更多传统燃油车（7位车牌）
					{
						time: '2025-04-19 08:00',
						name: '吴先生',
						phone: '133****6789',
						plateNumber: '黑E13792',
						status: '已通过',
						addressDetail: "9栋3单元702",
						entryTime: '2025-04-19 08:15',
						vehicleStatus: '已进场'
					},
					{
						time: '2025-04-18 19:30',
						name: '郑女士',
						phone: '158****0123',
						plateNumber: '黑F24601',
						status: '已通过',
						addressDetail: "10栋9单元901",
						entryTime: '2025-04-18 19:45',
						exitTime: '2025-04-18 21:30',
						vehicleStatus: '已离场'
					},
					{
						time: '2025-04-17 13:15',
						name: '冯先生',
						phone: '177****4567',
						plateNumber: '黑G97318',
						status: '待审核',
						addressDetail: "11栋2单元1102"
					},
					// 更多新能源车（8位车牌）
					{
						time: '2025-04-19 17:00',
						name: '何女士',
						phone: '199****8901',
						plateNumber: '黑AI2401',
						status: '已通过',
						addressDetail: "12栋1单元1201",
						entryTime: '2025-04-19 17:20',
						vehicleStatus: '已进场'
					},
					{
						time: '2025-04-18 11:45',
						name: '蒋先生',
						phone: '136****3456',
						plateNumber: '黑AJ1392',
						status: '已通过',
						addressDetail: "13栋5单元1305",
						entryTime: '2025-04-18 12:00',
						exitTime: '2025-04-18 14:30',
						vehicleStatus: '已离场'
					},
					{
						time: '2025-04-17 20:00',
						name: '韩女士',
						phone: '151****7891',
						plateNumber: '黑AK9718',
						status: '未通过',
						addressDetail: "14栋8单元1408"
					},
					{
						time: '2025-04-16 07:30',
						name: '杨先生',
						phone: '183****2345',
						plateNumber: '黑AL86421',
						status: '已通过',
						addressDetail: "15栋6单元1506",
						entryTime: '2025-04-16 07:45',
						exitTime: '2025-04-16 19:20',
						vehicleStatus: '已离场'
					}
				],
				hasClickedPending: false,
				// 新增当前选中的时间标签
				selectedTimeTag: null,

				// 新增标签是否被点击状态的追踪变量
				isFiltering: false,
				userRole: 'manager', // 'manager' 或 'user'，这个可以通过路由参数或其他方式设置
				showTimeFilterTools: false, // 新增时间筛选折叠控制变量

				// 数据看板和筛选器相关
				showDashboard: true, // 显示数据看板
				showSmartFilter: false, // 显示智能筛选器
				selectedTimeFilter: 'all', // 选中的时间筛选
				selectedStatusFilter: 'all', // 选中的状态筛选
				selectedVehicleFilter: 'all', // 选中的车辆状态筛选
				currentStatFilter: null, // 当前实时统计筛选状态

				// 筛选器选项
				timeFilterOptions: [{
						key: 'all',
						name: '全部',
						count: undefined
					},
					{
						key: 'today',
						name: '今日',
						count: 0
					},
					{
						key: 'yesterday',
						name: '昨日',
						count: 0
					},
					{
						key: 'recent3',
						name: '近3天',
						count: 0
					},
					{
						key: 'thisWeek',
						name: '本周',
						count: 0
					}
				],

				// 展开状态控制
				expandedItems: {}, // 记录每个项目的展开状态
				statusFilterOptions: [{
						key: 'all',
						name: '全部',
						emoji: '📋',
						count: 0
					},
					{
						key: 'pending',
						name: '待审',
						emoji: '⏳',
						count: 0
					},
					{
						key: 'approved',
						name: '通过',
						emoji: '✅',
						count: 0
					},
					{
						key: 'rejected',
						name: '拒绝',
						emoji: '❌',
						count: 0
					}
				],
				vehicleFilterOptions: [{
						key: 'all',
						name: '全部',
						emoji: '🚗',
						count: 0
					},
					{
						key: 'entered',
						name: '进场',
						emoji: '🟢',
						count: 0
					},
					{
						key: 'exited',
						name: '离场',
						emoji: '🔴',
						count: 0
					},
					{
						key: 'notEntered',
						name: '未进',
						emoji: '⚪',
						count: 0
					}
				]
			}
		},
		onLoad(options) {
			// 获取用户角色
			this.getUserRole();

			// 获取用户手机号并加载预约数据
			this.getCurrentUserPhone().then(() => {
				// 加载真实预约数据
				this.loadAppointmentData();
			});

			// 监听TabBar状态更新事件
			uni.$on('updateTabBarIndex', (index) => {
				// TabBar状态更新处理
			});

			// 接收路由参数
			if (options.keyword) {
				this.searchKeyword = decodeURIComponent(options.keyword);
				// 延迟执行搜索，确保数据已初始化
				this.$nextTick(() => {
					this.performSearch();
				});
			}
		},
		onShow() {
			// 页面显示时通知TabBar检查当前页面
			this.$nextTick(() => {
				// 通知TabBar更新为当前页面对应的索引（预约查询页面是索引1）
				uni.$emit('updateTabBarIndex', 1);
			});

			// 页面显示时刷新数据，确保今日数据统计实时更新
			if (this.currentUserPhone) {
				console.log('📱 [查询页面] 页面显示，刷新预约数据');
				this.loadAppointmentData();
			}
		},
		onUnload() {
			// 清理事件监听
			uni.$off('updateTabBarIndex');
			// 清理搜索防抖定时器
			if (this.searchDebounceTimer) {
				clearTimeout(this.searchDebounceTimer);
				this.searchDebounceTimer = null;
			}
			// 清理键盘监听
			this.removeKeyboardListeners();
		},

		mounted() {
			// 确保数据是数组
			if (!Array.isArray(this.reservationList)) {
				this.reservationList = [];
			}

			// 初始化备份数据
			this.originalList = [...this.reservationList];

			// 排序数据
			if (this.reservationList && this.reservationList.length > 0) {
				this.sortByLatestTime();
			}

			// 初始化展开状态
			this.initExpandedItems();

			// 加载搜索历史
			try {
				const history = uni.getStorageSync('search_history');
				if (history && Array.isArray(history)) {
					this.searchHistory = history;
				} else {
					this.searchHistory = [];
				}
			} catch (error) {
				this.searchHistory = [];
			}

			// 初始化筛选器计数
			this.updateFilterCounts();

			// 初始化搜索建议数组
			if (!Array.isArray(this.searchSuggestions)) {
				this.searchSuggestions = [];
			}

			// 初始化键盘监听
			this.initKeyboardListeners();
		},
		computed: {
			// 计算每个项目的时间状态类名
			getItemTimeClass() {
				return (time) => {
					if (this.isToday(time)) {
						return 'time-status-today';
					} else if (this.isYesterday(time)) {
						return 'time-status-yesterday';
					} else if (this.isWithinDays(time, 3)) {
						return 'time-status-three-days';
					} else if (this.isWithinDays(time, 5)) {
						return 'time-status-five-days';
					} else if (this.isWithinDays(time, 7)) {
						return 'time-status-week';
					}
					return '';
				}
			},

			// 最近搜索历史（限制显示数量）
			recentSearchHistory() {
				try {
					// 安全检查，确保返回有效的历史记录数组
					if (!this.searchHistory || !Array.isArray(this.searchHistory)) {
						return [];
					}

					// 过滤掉无效的历史记录项
					return this.searchHistory
						.filter(item => item && item.keyword && typeof item.keyword === 'string')
						.slice(0, 6);
				} catch (error) {
					return [];
				}
			},

			// 智能判断是否显示欢迎界面
			showWelcomeInterface() {
				// ！！！关键修改：不再因为输入内容就跳转页面！！！
				// 只有在确认搜索（执行过搜索操作）后才显示功能界面

				// 如果有任何筛选条件，显示功能界面
				if (this.isFiltering || this.currentStatFilter) {
					return false;
				}

				// 如果有选中的筛选器，显示功能界面
				if (this.selectedTimeFilter !== 'all' ||
					this.selectedStatusFilter !== 'all' ||
					this.selectedVehicleFilter !== 'all') {
					return false;
				}

				// 如果当前数据不是原始完整数据（说明执行过搜索），显示功能界面
				// 添加安全检查，防止访问 undefined 对象的属性
				if (this.originalList && this.reservationList &&
					this.reservationList.length !== this.originalList.length) {
					return false;
				}

				// 如果明确标记为已执行搜索，显示功能界面
				if (this.hasPerformedSearch) {
					return false;
				}

				// 默认显示欢迎界面
				return true;
			}
		},
		methods: {
			// 获取用户角色
			getUserRole() {
				try {
					const userInfo = uni.getStorageSync('userInfo');

					if (userInfo && userInfo.role) {
						this.currentUserRole = userInfo.role;
					} else if (userInfo && userInfo.userInfo && userInfo.userInfo.userkind) {
						// 检查是否使用了userkind字段（兼容处理）
						this.currentUserRole = userInfo.userInfo.userkind;
					} else {
						this.currentUserRole = 'owner';
					}
				} catch (error) {
					this.currentUserRole = 'owner';
				}
			},

			// 获取当前用户手机号
			getCurrentUserPhone() {
				return new Promise((resolve, reject) => {
					try {
						const userInfo = uni.getStorageSync('userInfo');

						if (userInfo && userInfo.phone) {
							this.currentUserPhone = userInfo.phone;
						} else if (userInfo && userInfo.userInfo && userInfo.userInfo.phone) {
							this.currentUserPhone = userInfo.userInfo.phone;
						} else {
							// 如果找不到手机号，尝试从其他字段获取
							if (userInfo && userInfo.phoneNumber) {
								this.currentUserPhone = userInfo.phoneNumber;
							} else if (userInfo && userInfo.userInfo && userInfo.userInfo.phoneNumber) {
								this.currentUserPhone = userInfo.userInfo.phoneNumber;
							} else {
								this.currentUserPhone = '';
							}
						}
						resolve(this.currentUserPhone);
					} catch (error) {
						this.currentUserPhone = '';
						resolve(''); // 即使失败也resolve，不中断流程
					}
				});
			},

			// 加载预约数据
			loadAppointmentData() {
				// 显示加载提示
				uni.showLoading({
					title: '加载数据中...',
					mask: true
				});

				// 根据用户角色选择不同的查询方式
				if (this.currentUserRole === 'visitor') {
					// 访客 - 根据手机号查询
					this.loadAppointmentDataByPhone();
				} else if (this.currentUserRole === 'manager') {
					// 管家 - 查询管理区域内的预约
					this.loadAppointmentDataForManager();
				} else {
					// 业主 - 根据手机号查询
					this.loadAppointmentDataByPhone();
				}
			},

			// 根据手机号查询预约数据
			async loadAppointmentDataByPhone() {
				// 检查是否有手机号
				if (!this.currentUserPhone) {
					uni.hideLoading();
					uni.showToast({
						title: '未找到用户信息',
						icon: 'none',
						duration: 2000
					});
					return;
				}

				// 清空示例数据，确保只显示真实数据
				this.originalList = [];
				this.reservationList = [];

				// 调用API获取预约数据
				const { appointmentAPI } = await import('@/config/api.js');
				appointmentAPI.getListByPhone(this.currentUserPhone)
					.then(res => {
						// 检查返回数据格式
						if (res && res.code === "0" && res.data) {
							// 获取数据列表 - 处理嵌套的data结构
							let dataList = [];
							if (res.data.data && res.data.data.data && Array.isArray(res.data.data.data)) {
								dataList = res.data.data.data;
							} else if (res.data.data && Array.isArray(res.data.data)) {
								dataList = res.data.data;
							} else if (Array.isArray(res.data)) {
								dataList = res.data;
							}

							// 将API返回的数据转换为页面所需格式
							const formattedData = this.formatAppointmentData(dataList);

							// 更新数据
							this.originalList = formattedData;
							this.reservationList = [...formattedData];

							// 如果没有数据，显示提示
							if (formattedData.length === 0) {
								uni.showToast({
									title: '没有找到预约记录',
									icon: 'none',
									duration: 2000
								});
							}
						} else {
							// 不再保留示例数据
							uni.showToast({
								title: 'API返回数据格式异常',
								icon: 'none',
								duration: 2000
							});
						}

						uni.hideLoading();
					})
					.catch(err => {
						console.error('❌ 加载预约数据失败:', err);
						uni.hideLoading();
						uni.showToast({
							title: '加载数据失败，请重试',
							icon: 'none',
							duration: 2000
						});
					});
			},

			// 管家查询所有预约数据（不基于openid权限过滤）
			async loadAppointmentDataForManager() {
				// 获取管家的小区信息
				const userInfo = uni.getStorageSync('userInfo');
				const managerCommunity = userInfo && userInfo.community ? userInfo.community : '';

				// 清空示例数据，确保只显示真实数据
				this.originalList = [];
				this.reservationList = [];

				// 调用通用预约列表API（获取所有预约数据）
				const { appointmentAPI } = await import('@/config/api.js');
				appointmentAPI.getList()
					.then(res => {
						// 检查返回数据格式 - 更宽松的检查
						if (res && (res.code === "0" || res.code === 0 || res.success === true)) {
							let dataArray = [];

							// getList API返回格式: { code: "0", data: { data: [...] } }
							if (res.data && res.data.data && Array.isArray(res.data.data)) {
								dataArray = res.data.data;
							} else if (res.data && Array.isArray(res.data)) {
								dataArray = res.data;
							} else if (Array.isArray(res)) {
								dataArray = res;
							} else if (res.data && res.data.data && res.data.data.data) {
								dataArray = res.data.data.data || [];
							}

							// 如果数据为空，显示提示信息
							if (dataArray.length === 0) {
								uni.showModal({
									title: '暂无预约数据',
									content: `当前系统中暂无预约记录\n\n可能原因：\n1. 系统中还没有预约数据\n2. 数据库连接问题\n3. API接口异常`,
									showCancel: false,
									confirmText: '知道了'
								});
								uni.hideLoading();
								return;
							}

							// 将API返回的数据转换为页面所需格式
							const formattedData = this.formatAppointmentData(dataArray);

							// 更新数据
							this.originalList = formattedData;
							this.reservationList = [...formattedData];

							console.log(`✅ 管家查询成功，共加载 ${formattedData.length} 条预约记录`);
						} else {
							console.error('❌ API返回数据格式异常:', res);
							uni.showToast({
								title: 'API返回数据格式异常',
								icon: 'none',
								duration: 2000
							});
						}

						uni.hideLoading();
					})
					.catch(err => {
						console.error('❌ 管家查询预约数据失败:', err);
						uni.hideLoading();
						uni.showToast({
							title: '加载数据失败，请重试',
							icon: 'none',
							duration: 2000
						});
					});
			},

			// 格式化预约数据
			formatAppointmentData(dataList) {
				if (!Array.isArray(dataList)) {
					return [];
				}

				return dataList.map(item => {
					// 处理时间字段 - 优先使用recorddate
					let timeField = item.recorddate || item.appointmentTime || item.time || item.createTime;

					// 处理状态字段
					let status = item.status || '未知';
					if (status === 'pending') status = '待审批';
					else if (status === 'approved') status = '已通过';
					else if (status === 'rejected') status = '未通过';

					// 处理车辆状态
					let vehicleStatus = item.vehicleStatus || '未进场';
					if (item.actualEntryTime && !item.actualExitTime) {
						vehicleStatus = '已进场';
					} else if (item.actualEntryTime && item.actualExitTime) {
						vehicleStatus = '已离场';
					}

					return {
						id: item.id || Math.random().toString(36).substr(2, 9),
						time: timeField,
						name: item.visitorName || item.name || '未知',
						phone: item.visitorPhone || item.phone || '',
						plateNumber: item.plateNumber || item.licensePlate || '',
						status: status,
						addressDetail: item.visitAddress || item.addressDetail || item.address || '',
						duration: item.duration || '',
						entryTime: item.actualEntryTime || item.entryTime || '',
						exitTime: item.actualExitTime || item.exitTime || '',
						vehicleStatus: vehicleStatus,
						remark: item.remark || '',
						appointType: item.appointType || '自助'
					};
				});
			},

			// TabBar切换事件处理
			onTabChange(tabInfo) {
				// TabBar切换处理逻辑
			},

			// 初始化展开状态
			initExpandedItems() {
				this.expandedItems = {};
			},

			// 切换展开状态
			toggleExpand(index) {
				this.$set(this.expandedItems, index, !this.expandedItems[index]);
			},

			// === 智能搜索相关方法 ===
			// 处理搜索输入
			handleSearchInput(e) {
				// 安全地获取输入值
				let value = '';
				if (e && typeof e === 'object') {
					if (e.detail && typeof e.detail.value !== 'undefined') {
						value = e.detail.value;
					} else if (e.target && typeof e.target.value !== 'undefined') {
						value = e.target.value;
					}
				} else if (typeof e === 'string') {
					value = e;
				}

				// 确保值是字符串
				this.searchKeyword = String(value || '');

				// 清除之前的防抖定时器
				if (this.searchDebounceTimer) {
					clearTimeout(this.searchDebounceTimer);
				}

				// 简化逻辑：只生成建议
				const trimmedKeyword = this.searchKeyword.trim();

				if (trimmedKeyword.length === 0) {
					// 输入为空时，清空建议
					this.showSuggestions = false;
					this.searchSuggestions = [];
					this.showSearchHistory = this.searchHistory && this.searchHistory.length > 0;
					this.showHotSearch = true;
				} else {
					// 有输入内容时，生成搜索建议
					this.showSearchHistory = false;
					this.showHotSearch = false;
					this.generateSearchSuggestions();
					this.showSuggestions = true;

					// 调整滚动位置
					this.$nextTick(() => {
						this.optimizeScrollView();
					});
				}
			},

			// 生成搜索建议 - 参考violation.vue的简单实现
			generateSearchSuggestions() {
				if (!this.searchKeyword || typeof this.searchKeyword !== 'string') {
					this.searchSuggestions = [];
					this.showSuggestions = false;
					return;
				}

				const keyword = this.searchKeyword.toLowerCase().trim();

				if (keyword.length === 0) {
					this.searchSuggestions = [];
					this.showSuggestions = false;
					return;
				}

				if (!this.originalList || !Array.isArray(this.originalList)) {
					this.searchSuggestions = [];
					this.showSuggestions = false;
					return;
				}

				const suggestions = [];

				// 判断搜索关键词的类型，优化建议生成
				const searchType = this.detectSearchType(this.searchKeyword);

				// 从预约数据中生成建议
				this.originalList.forEach(item => {
					if (!item) return;

					// 根据搜索类型优化建议生成
					switch (searchType) {
						case 'status':
							// 状态搜索时，只显示状态相关建议
							if (item.status && item.status.toLowerCase().includes(keyword)) {
								const existing = suggestions.find(s => s.text === item.status && s.type ===
									'status');
								if (!existing) {
									suggestions.push({
										text: item.status,
										type: 'status'
									});
								}
							}
							if (item.vehicleStatus && item.vehicleStatus.toLowerCase().includes(keyword)) {
								const existing = suggestions.find(s => s.text === item.vehicleStatus && s.type ===
									'status');
								if (!existing) {
									suggestions.push({
										text: item.vehicleStatus,
										type: 'status'
									});
								}
							}
							break;

						case 'plate':
							// 车牌搜索时，优先显示车牌建议
							if (item.plateNumber && item.plateNumber.toLowerCase().includes(keyword)) {
								const existing = suggestions.find(s => s.text === item.plateNumber && s.type ===
									'plate');
								if (!existing) {
									suggestions.push({
										text: item.plateNumber,
										type: 'plate'
									});
								}
							}
							break;

						case 'phone':
							// 手机号搜索时，优先显示手机号建议
							if (item.phone && item.phone.includes(keyword)) {
								const existing = suggestions.find(s => s.text === item.phone && s.type ===
								'phone');
								if (!existing) {
									suggestions.push({
										text: item.phone,
										type: 'phone'
									});
								}
							}
							break;

						case 'name':
							// 姓名搜索时，优先显示姓名建议
							if (item.name && item.name.toLowerCase().includes(keyword)) {
								const existing = suggestions.find(s => s.text === item.name && s.type === 'name');
								if (!existing) {
									suggestions.push({
										text: item.name,
										type: 'name'
									});
								}
							}
							break;

						case 'address':
							// 地址搜索时，优先显示地址建议
							if (item.addressDetail && item.addressDetail.toLowerCase().includes(keyword)) {
								const existing = suggestions.find(s => s.text === item.addressDetail && s.type ===
									'address');
								if (!existing) {
									suggestions.push({
										text: item.addressDetail,
										type: 'address'
									});
								}
							}
							break;

						default:
							// 通用搜索时，显示所有类型的建议
							// 车牌号建议
							if (item.plateNumber && item.plateNumber.toLowerCase().includes(keyword)) {
								const existing = suggestions.find(s => s.text === item.plateNumber && s.type ===
									'plate');
								if (!existing) {
									suggestions.push({
										text: item.plateNumber,
										type: 'plate'
									});
								}
							}

							// 姓名建议
							if (item.name && item.name.toLowerCase().includes(keyword)) {
								const existing = suggestions.find(s => s.text === item.name && s.type === 'name');
								if (!existing) {
									suggestions.push({
										text: item.name,
										type: 'name'
									});
								}
							}

							// 手机号建议
							if (item.phone && item.phone.includes(keyword)) {
								const existing = suggestions.find(s => s.text === item.phone && s.type ===
								'phone');
								if (!existing) {
									suggestions.push({
										text: item.phone,
										type: 'phone'
									});
								}
							}

							// 地址建议
							if (item.addressDetail && item.addressDetail.toLowerCase().includes(keyword)) {
								const existing = suggestions.find(s => s.text === item.addressDetail && s.type ===
									'address');
								if (!existing) {
									suggestions.push({
										text: item.addressDetail,
										type: 'address'
									});
								}
							}

							// 状态建议
							if (item.status && item.status.toLowerCase().includes(keyword)) {
								const existing = suggestions.find(s => s.text === item.status && s.type ===
									'status');
								if (!existing) {
									suggestions.push({
										text: item.status,
										type: 'status'
									});
								}
							}

							// 车辆状态建议
							if (item.vehicleStatus && item.vehicleStatus.toLowerCase().includes(keyword)) {
								const existing = suggestions.find(s => s.text === item.vehicleStatus && s.type ===
									'status');
								if (!existing) {
									suggestions.push({
										text: item.vehicleStatus,
										type: 'status'
									});
								}
							}
							break;
					}
				});

				// 只显示从真实数据中匹配到的建议，移除不合理的模拟建议

				// 限制建议数量，最多显示10个
				this.searchSuggestions = suggestions.slice(0, 10);
			},

			// 获取建议图标颜色
			getSuggestionIconColor(type) {
				const colorMap = {
					'plate': '#2979ff',
					'phone': '#52c41a',
					'name': '#fa8c16',
					'address': '#E6A23C',
					'status': '#409EFF'
				};
				return colorMap[type] || '#666';
			},

			// 获取建议图标
			getSuggestionIcon(type) {
				const iconMap = {
					'plate': '🚗',
					'phone': '📱',
					'name': '👤',
					'address': '📍',
					'status': '📋',
					'keyword': '🔍'
				};
				return iconMap[type] || '🔍';
			},

			// 获取建议类型文本
			getSuggestionTypeText(type) {
				const textMap = {
					'plate': '车牌号',
					'phone': '手机号',
					'name': '姓名',
					'address': '地址',
					'status': '状态'
				};
				return textMap[type] || '关键词';
			},



			// 搜索框获得焦点
			handleSearchFocus() {
				// 标记用户正在与搜索框交互，防止意外失去焦点
				this.userInteracting = true;

				// 延迟检测键盘状态
				setTimeout(() => {
					this.adjustSuggestionPosition();
				}, 300);

				if (!this.searchKeyword.trim()) {
					this.showSearchHistory = this.searchHistory.length > 0;
					this.showHotSearch = true;
					this.showSuggestions = false;
				} else {
					// 如果有输入内容，立即显示建议
					this.generateSearchSuggestions();
					this.showSuggestions = true;
					this.showSearchHistory = false;
					this.showHotSearch = false;
				}

				// 短暂延迟后重置交互状态
				setTimeout(() => {
					this.userInteracting = false;
				}, 100);
			},

			// 搜索框失去焦点
			handleSearchBlur() {
				// 延迟隐藏，给用户充足时间点击建议项
				setTimeout(() => {
					// 只有当没有在进行交互时才隐藏建议
					if (!this.userInteracting) {
						this.showSuggestions = false;
						if (!this.searchKeyword.trim()) {
							this.showSearchHistory = this.searchHistory.length > 0;
							this.showHotSearch = true;
						} else {
							this.showSearchHistory = false;
							this.showHotSearch = false;
						}
					}
				}, 500); // 增加延迟时间到500ms
			},

			// 确认搜索
			handleSearchConfirm() {
				if (!this.searchKeyword.trim()) return;

				this.performSearch();
			},



			// 确认搜索（选择建议或使用历史记录时调用）
			performConfirmedSearch() {
				if (!this.searchKeyword || !this.searchKeyword.trim()) {
					this.reservationList = [...(this.originalList || [])];
					this.updateStatistics();
					return;
				}

				if (!this.originalList || !Array.isArray(this.originalList)) {
					this.reservationList = [];
					this.updateStatistics();
					return;
				}

				const keyword = this.searchKeyword.toLowerCase().trim();

				// 搜索匹配项
				const filteredList = this.originalList.filter(item => {
					if (!item) return false;

					return (
						// 车牌号匹配
						(item.plateNumber && item.plateNumber.toLowerCase().includes(keyword)) ||
						// 手机号匹配（支持脱敏格式）
						(item.phone && item.phone.includes(this.searchKeyword.trim())) ||
						// 姓名匹配
						(item.name && item.name.toLowerCase().includes(keyword)) ||
						// 地址匹配
						(item.addressDetail && item.addressDetail.toLowerCase().includes(keyword)) ||
						// 状态匹配
						(item.status && item.status.toLowerCase().includes(keyword)) ||
						// 车辆状态匹配
						(item.vehicleStatus && item.vehicleStatus.toLowerCase().includes(keyword))
					);
				});

				this.reservationList = filteredList;
				this.updateStatistics();
				this.hasPerformedSearch = true;

				// 隐藏所有弹出界面
				this.showSuggestions = false;
				this.showSearchHistory = false;
				this.showHotSearch = false;

				// 显示搜索结果提示
				uni.showToast({
					title: `找到 ${filteredList.length} 条记录`,
					icon: filteredList.length > 0 ? 'success' : 'none',
					duration: 1500
				});
			},

			// 执行搜索（手动搜索，带提示）
			performSearch() {
				if (!this.searchKeyword || this.searchKeyword.trim().length === 0) {
					// 如果搜索关键词为空，恢复原始列表
					this.reservationList = [...(this.originalList || [])];
					this.updateStatistics();
					return;
				}

				if (!this.originalList || !Array.isArray(this.originalList)) {
					this.reservationList = [];
					this.updateStatistics();
					return;
				}

				const keyword = this.searchKeyword.toLowerCase().trim();

				// 搜索匹配项
				const filteredList = this.originalList.filter(item => {
					if (!item) return false;

					return (
						// 车牌号匹配
						(item.plateNumber && typeof item.plateNumber === 'string' &&
							item.plateNumber.toLowerCase().includes(keyword)) ||
						// 手机号匹配（支持脱敏格式）
						(item.phone && typeof item.phone === 'string' &&
							item.phone.includes(this.searchKeyword.trim())) ||
						// 姓名匹配
						(item.name && typeof item.name === 'string' &&
							item.name.toLowerCase().includes(keyword)) ||
						// 地址匹配
						(item.addressDetail && typeof item.addressDetail === 'string' &&
							item.addressDetail.toLowerCase().includes(keyword)) ||
						// 状态匹配
						(item.status && typeof item.status === 'string' &&
							item.status.toLowerCase().includes(keyword)) ||
						// 车辆状态匹配
						(item.vehicleStatus && typeof item.vehicleStatus === 'string' &&
							item.vehicleStatus.toLowerCase().includes(keyword))
					);
				});

				this.reservationList = filteredList;
				this.updateStatistics();

				// 标记已执行搜索，触发页面切换到功能界面
				this.hasPerformedSearch = true;

				// 添加到搜索历史
				this.addToSearchHistory(this.searchKeyword, this.detectSearchType(this.searchKeyword));

				// 隐藏建议和历史记录
				this.showSuggestions = false;
				this.showSearchHistory = false;
				this.showHotSearch = false;

				// 显示搜索结果提示
				uni.showToast({
					title: `找到 ${filteredList.length} 条记录`,
					icon: filteredList.length > 0 ? 'success' : 'none',
					duration: 1500
				});
			},

			// 检测搜索类型
			detectSearchType(keyword) {
				try {
					// 安全检查输入
					if (!keyword || typeof keyword !== 'string') {
						return 'keyword';
					}

					const trimmedKeyword = keyword.trim();
					if (trimmedKeyword.length === 0) {
						return 'keyword';
					}

					// 使用安全的正则表达式检测
					if (/^[\u4e00-\u9fa5][A-Z0-9]{5,7}$/.test(trimmedKeyword)) {
						return 'plate'; // 车牌号格式
					} else if (/^1[3-9]\d{9}$/.test(trimmedKeyword) || /^\d{3}\*{4}\d{4}$/.test(trimmedKeyword)) {
						return 'phone'; // 手机号格式（包含脱敏格式）
					} else if (/^[\u4e00-\u9fa5]{2,4}$/.test(trimmedKeyword)) {
						return 'name'; // 中文姓名格式
					} else if (trimmedKeyword.includes('栋') || trimmedKeyword.includes('单元')) {
						return 'address'; // 地址格式
					} else if (['待审核', '已通过', '未通过', '已进场', '已离场', '未进场'].includes(trimmedKeyword)) {
						return 'status'; // 状态格式
					}

					return 'keyword'; // 其他关键词
				} catch (error) {
					return 'keyword'; // 默认返回关键词类型
				}
			},

			// 更新统计信息
			updateStatistics() {
				// 这里可以添加统计更新的逻辑
			},

			// 应用当前的筛选条件
			applyCurrentFilters() {
				// 应用状态筛选
				this.applyStatusFilter();

				// 应用时间筛选
				if (this.selectedTimeTag) {
					this.handleTimeTagClick(this.selectedTimeTag);
				}

				// 排序
				this.sortByLatestTime();
			},

			// 通过索引选择搜索建议
			selectSuggestionByIndex(index) {
				try {
					// 安全检查
					if (!this.searchSuggestions || !Array.isArray(this.searchSuggestions) ||
						index < 0 || index >= this.searchSuggestions.length) {
						return;
					}

					const suggestion = this.searchSuggestions[index];
					if (!suggestion || !suggestion.text) {
						return;
					}

					this.searchKeyword = String(suggestion.text || '');
					this.showSuggestions = false;
					this.showSearchHistory = false;
					this.showHotSearch = false;

					// 执行搜索
					this.$nextTick(() => {
						this.performConfirmedSearch();
					});

					// 保存到搜索历史
					this.addToSearchHistory(this.searchKeyword, suggestion.type || 'keyword');
				} catch (error) {
					// 确保在出错时隐藏建议框
					this.showSuggestions = false;
					this.showSearchHistory = false;
					this.showHotSearch = false;
				}
			},

			// 处理触摸开始事件
			handleTouchStart() {
				this.userInteracting = true;
			},

			// 处理触摸结束事件
			handleTouchEnd() {
				this.userInteracting = false;
			},

			// 清空搜索
			clearSearch() {
				this.searchKeyword = '';
				this.showSuggestions = false;
				this.showSearchHistory = this.searchHistory.length > 0;
				this.showHotSearch = true;

				// 恢复原始数据
				this.reservationList = [...this.originalList];
				this.updateStatistics();

				// 重置搜索状态，强制返回欢迎界面
				this.hasPerformedSearch = false;

				// 重置所有筛选状态，确保回到欢迎界面
				this.isFiltering = false;
				this.currentStatFilter = null;
				this.selectedTimeFilter = 'all';
				this.selectedStatusFilter = 'all';
				this.selectedVehicleFilter = 'all';

				// 重置为欢迎界面状态
				this.showSearchHistory = this.searchHistory.length > 0;
				this.showHotSearch = true;

				// 保持搜索框焦点，让用户可以继续输入
				this.$nextTick(() => {
					this.searchInputFocus = true;
					setTimeout(() => {
						this.searchInputFocus = false;
					}, 100);
				});
			},

			// 语音搜索
			startVoiceSearch() {
				uni.showToast({
					title: '语音搜索功能开发中...',
					icon: 'none'
				});

				// TODO: 实际项目中可以集成语音识别API
				// #ifdef APP-PLUS
				// plus.speech.startRecognize({
				//     engine: 'baidu',
				//     onstart: function(){
				//         console.log('开始语音识别');
				//     },
				//     onend: function(result){
				//         this.searchKeyword = result;
				//         this.handleSearchConfirm();
				//     }
				// });
				// #endif
			},

			// 添加到搜索历史
			addToSearchHistory(keyword, type = 'keyword') {
				try {
					// 安全检查输入参数
					if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
						return;
					}

					// 确保searchHistory是数组
					if (!Array.isArray(this.searchHistory)) {
						this.searchHistory = [];
					}

					// 检查是否已存在
					const trimmedKeyword = keyword.trim();
					const exists = this.searchHistory.find(item =>
						item && item.keyword && item.keyword === trimmedKeyword
					);

					if (exists) {
						return;
					}

					const historyItem = {
						keyword: trimmedKeyword,
						type: type || 'keyword',
						time: Date.now()
					};

					this.searchHistory.unshift(historyItem);

					// 限制历史记录数量
					if (this.searchHistory.length > 20) {
						this.searchHistory = this.searchHistory.slice(0, 20);
					}

					// 保存到本地存储
					try {
						uni.setStorageSync('search_history', this.searchHistory);
					} catch (storageError) {
						// 保存失败处理
					}

				} catch (error) {
					// 错误处理
				}
			},

			// 使用历史搜索
			useHistorySearch(historyItem) {
				// 安全检查
				if (!historyItem || !historyItem.keyword || typeof historyItem.keyword !== 'string') {
					return;
				}

				this.searchKeyword = historyItem.keyword;
				this.showSearchHistory = false;
				this.showHotSearch = false;
				this.showSuggestions = false;
				// 使用确认搜索，不显示额外提示
				this.performConfirmedSearch();

				// 保持搜索框焦点
				this.$nextTick(() => {
					this.searchInputFocus = true;
					setTimeout(() => {
						this.searchInputFocus = false;
					}, 100);
				});
			},

			// 移除搜索历史项
			removeSearchHistory(index) {
				// 安全检查
				if (!this.searchHistory || !Array.isArray(this.searchHistory) ||
					index < 0 || index >= this.searchHistory.length) {
					return;
				}

				this.searchHistory.splice(index, 1);
				try {
					uni.setStorageSync('search_history', this.searchHistory);
				} catch (error) {
					// 保存失败处理
				}
			},

			// 获取历史图标
			getHistoryIcon(type) {
				// 添加安全检查
				if (!type || typeof type !== 'string') {
					return '🔍';
				}

				const iconMap = {
					'plate': '🚗',
					'phone': '📱',
					'name': '👤',
					'address': '📍',
					'status': '📋',
					'keyword': '🔍'
				};
				return iconMap[type] || '🔍';
			},

			// 格式化历史时间
			formatHistoryTime(timestamp) {
				// 安全检查
				if (!timestamp || typeof timestamp !== 'number' || timestamp <= 0) {
					return '未知时间';
				}

				try {
					const now = Date.now();
					const diff = now - timestamp;

					// 确保时间差不为负数
					if (diff < 0) {
						return '刚刚';
					}

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
				} catch (error) {
					return '未知时间';
				}
			},

			// 清空搜索历史
			clearSearchHistory() {
				uni.showModal({
					title: '确认清空',
					content: '确定要清空所有搜索历史吗？',
					success: (res) => {
						if (res.confirm) {
							this.searchHistory = [];
							uni.removeStorageSync('search_history');
							uni.showToast({
								title: '已清空搜索历史',
								icon: 'success',
								duration: 1500
							});
						}
					}
				});
			},

			// 选择热门搜索标签
			selectHotTag(tag) {
				try {
					// 安全检查
					if (!tag || !tag.text || typeof tag.text !== 'string') {
						return;
					}

					// 设置搜索关键词
					this.searchKeyword = String(tag.text).trim();

					// 隐藏所有弹出界面
					this.showHotSearch = false;
					this.showSearchHistory = false;
					this.showSuggestions = false;

					// 执行搜索
					this.$nextTick(() => {
						this.performConfirmedSearch();
					});

					// 保持搜索框焦点
					setTimeout(() => {
						this.searchInputFocus = true;
						setTimeout(() => {
							this.searchInputFocus = false;
						}, 100);
					}, 50);

				} catch (error) {
					this.showHotSearch = false;
					this.showSearchHistory = false;
					this.showSuggestions = false;
				}
			},

			toggleFilterTools() {
				this.showFilterTools = !this.showFilterTools;
			},
			toggleFilterTools2() {
				this.showFilterTools2 = !this.showFilterTools2;
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
				return dayjs(timeStr).format('YYYY-MM-DD HH:mm')
			},

			// 计算时间差
			calcDuration(start, end) {
				const diff = dayjs(end).diff(dayjs(start), 'minute')
				const hours = Math.floor(diff / 60)
				const minutes = diff % 60
				return `${hours}小时${minutes}分钟`
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
			change1(index) {
				const statusMap = {
					0: "全部",
					1: '待审核',
					2: '已通过',
					3: '未通过'
				};

				this.current1 = index;

				// 首先根据当前选中的时间标签筛选数据
				if (this.selectedTimeTag) {
					this.handleTimeTagClick(this.selectedTimeTag);
				} else {
					// 如果没有时间标签筛选，直接应用状态筛选
					if (this.current1 === 0) {
						// 选择全部时，应该显示原始数据
						this.reservationList = [...this.originalList];
						this.hasClickedPending = true;
					} else {
						this.reservationList = this.originalList.filter(item => {
							if (this.current1 === 1) {
								this.hasClickedPending = true;
								return item.status === '待审核';
							} else if (this.current1 === 2) {
								this.hasClickedPending = true;
								return item.status === '已通过';
							} else if (this.current1 === 3) {
								this.hasClickedPending = true;
								return item.status === '未通过';
							}
						});
					}
				}

				// 应用筛选后进行排序（最晚时间优先）
				this.sortByLatestTime();

				// 应用筛选后显示提示
				this.showFilterResultToast();
			},
			calendarConfirm(e) {
				this.showCalendar = false
				// 筛选时间在这个范围之内的数据
				this.reservationList = this.originalList.filter(item => {
					return item.time >= e[0] && item.time <= e[e.length - 1]
				})

				// 添加排序
				this.sortByLatestTime();

				if (this.reservationList.length === 0) {
					uni.showToast({
						title: '没有找到符合条件的数据',
						icon: 'none'
					})
				} else {
					uni.showToast({
						title: '筛选成功',
						icon: 'success'
					})
				}
				// 更新时间范围显示
				this.timeRange = `${e[0]} - ${e[e.length - 1]}`
			},
			calendarClose() {
				this.showCalendar = false
				// 清空所选择的时间段
				this.timeRange = ''
			},
			statusType(status) {
				const map = {
					'待审核': 'warning',
					'已通过': 'success',
					'未通过': 'error'
				}
				return map[status] || 'info'
			},
			handleTimeConfirm(range) {
				// 时间范围确认处理
			},
			statusChange(index) {
				this.currentStatus = index
			},
			// 获取时间标签样式
			getTimeTagStyle(tag) {
				const isActive = this.selectedTimeTag === tag;
				return {
					backgroundColor: isActive ? '#e8f4ff' : '#fff',
					color: isActive ? '#2979ff' : '#606266',
					borderColor: isActive ? '#2979ff' : '#dcdfe6',
					fontSize: '24rpx',
					padding: '6rpx 20rpx',
					marginRight: '12rpx',
					marginBottom: '12rpx',
					fontWeight: isActive ? 'bold' : 'normal'
				}
			},
			// 处理时间标签点击
			handleTimeTagClick(tag) {
				// 防止重复操作
				if (this.isFiltering) return;
				this.isFiltering = true;

				// 如果再次点击已选中的标签，则取消筛选
				if (this.selectedTimeTag === tag) {
					this.selectedTimeTag = null;
					this.reservationList = [...this.originalList];

					// 如果有状态筛选，则应用状态筛选
					this.applyStatusFilter();

					// 添加排序
					this.sortByLatestTime();

					this.isFiltering = false;
					return;
				}

				this.selectedTimeTag = tag;

				if (tag === null) {
					// 点击"全部时间"，仅应用状态筛选
					this.reservationList = [...this.originalList];
					this.applyStatusFilter();
					this.isFiltering = false;
					return;
				}

				// 根据标签筛选数据
				const now = new Date();
				let startDate = new Date();

				switch (tag) {
					case 'today':
						// 今日数据，设置为今天开始
						startDate.setHours(0, 0, 0, 0);
						break;
					case 'yesterday':
						// 昨日数据，设置为昨天开始，今天结束
						startDate.setDate(startDate.getDate() - 1);
						startDate.setHours(0, 0, 0, 0);
						const endYesterday = new Date();
						endYesterday.setHours(0, 0, 0, 0);
						break;
					case 'three_days':
						// 近三天数据，设置为3天前开始
						startDate.setDate(startDate.getDate() - 3);
						startDate.setHours(0, 0, 0, 0);
						break;
					case 'five_days':
						// 近五天数据，设置为5天前开始
						startDate.setDate(startDate.getDate() - 5);
						startDate.setHours(0, 0, 0, 0);
						break;
					case 'week':
						// 近一周数据，设置为7天前开始
						startDate.setDate(startDate.getDate() - 7);
						startDate.setHours(0, 0, 0, 0);
						break;
				}

				// 筛选时间在范围内的数据
				let filteredList = this.originalList.filter(item => {
					const itemDate = new Date(item.time);

					if (tag === 'yesterday') {
						// 昨天的特殊处理
						const yesterdayStart = new Date();
						yesterdayStart.setDate(yesterdayStart.getDate() - 1);
						yesterdayStart.setHours(0, 0, 0, 0);
						const yesterdayEnd = new Date();
						yesterdayEnd.setHours(0, 0, 0, 0);
						return itemDate >= yesterdayStart && itemDate < yesterdayEnd;
					} else if (tag === 'today') {
						// 今天的特殊处理
						const todayStart = new Date();
						todayStart.setHours(0, 0, 0, 0);
						const tomorrowStart = new Date();
						tomorrowStart.setDate(tomorrowStart.getDate() + 1);
						tomorrowStart.setHours(0, 0, 0, 0);
						return itemDate >= todayStart && itemDate < tomorrowStart;
					}

					return itemDate >= startDate && itemDate <= now;
				});

				// 应用状态筛选
				this.reservationList = filteredList;
				this.applyStatusFilter();

				// 添加排序
				this.sortByLatestTime();

				this.isFiltering = false;
			},
			// 应用状态筛选 - 提取为独立方法以便复用
			applyStatusFilter() {
				if (this.current1 !== 0) {
					const statusMap = {
						1: '待审核',
						2: '已通过',
						3: '未通过'
					};

					this.reservationList = this.reservationList.filter(item =>
						item.status === statusMap[this.current1]
					);
				}
			},
			// 判断日期是否为今天
			isToday(dateString) {
				const today = new Date();
				const date = new Date(dateString);

				return date.getDate() === today.getDate() &&
					date.getMonth() === today.getMonth() &&
					date.getFullYear() === today.getFullYear();
			},
			// 判断日期是否为昨天
			isYesterday(dateString) {
				const yesterday = new Date();
				yesterday.setDate(yesterday.getDate() - 1);
				const date = new Date(dateString);

				return date.getDate() === yesterday.getDate() &&
					date.getMonth() === yesterday.getMonth() &&
					date.getFullYear() === yesterday.getFullYear();
			},
			// 格式化显示时间
			formatDisplayTime(timeStr) {
				const date = new Date(timeStr);

				if (this.isToday(timeStr)) {
					// 今日预约
					return '今日 ' + dayjs(timeStr).format('HH:mm');
				} else if (this.isYesterday(timeStr)) {
					// 昨日预约
					return '昨日 ' + dayjs(timeStr).format('HH:mm');
				} else {
					// 其他日期
					return dayjs(timeStr).format('MM-DD HH:mm');
				}
			},
			// 获取时间状态的文本
			getTimeStatusText(timeStr) {
				if (this.isToday(timeStr)) {
					return '今日';
				} else if (this.isYesterday(timeStr)) {
					return '昨日';
				} else if (this.isWithinDays(timeStr, 3)) {
					return '近三天';
				} else if (this.isWithinDays(timeStr, 5)) {
					return '近五天';
				} else if (this.isWithinDays(timeStr, 7)) {
					return '近一周';
				}
				return '';
			},
			// 判断日期是否在指定天数内
			isWithinDays(dateString, days) {
				const targetDate = new Date(dateString);
				const now = new Date();
				const startDate = new Date();
				startDate.setDate(startDate.getDate() - days);
				startDate.setHours(0, 0, 0, 0);

				// 排除今天和昨天
				if (this.isToday(dateString) || this.isYesterday(dateString)) {
					return false;
				}

				return targetDate >= startDate && targetDate <= now;
			},
			// 显示筛选结果提示
			showFilterResultToast() {
				let message = `筛选出 ${this.reservationList.length} 条数据`;

				// 使用轻提示显示筛选结果
				uni.showToast({
					title: message,
					icon: 'none',
					duration: 2000
				});
			},
			// 获取当前筛选标签的文本
			getFilterTagText(tag) {
				const tagMap = {
					'today': '今日',
					'yesterday': '昨日',
					'three_days': '近三天',
					'five_days': '近五天',
					'week': '近一周'
				};
				return tagMap[tag] || '全部时间';
			},
			// 管家角色统计方法
			getStatusCount(status) {
				return this.originalList.filter(item => item.status === status).length;
			},
			getVehicleStatusCount(status) {
				return this.originalList.filter(item =>
					item.status === '已通过' && item.vehicleStatus === status
				).length;
			},
			getTodayStatusCount(status) {
				if (!this.originalList || !Array.isArray(this.originalList)) {
					return 0;
				}
				return this.originalList.filter(item => {
					// 基于来访时间统计今日状态
					const visitTime = item.entryTime || item.actualEntryTime;
					return visitTime && this.isToday(visitTime) && item.status === status;
				}).length;
			},
			getTodayVehicleStatusCount(status) {
				if (!this.originalList || !Array.isArray(this.originalList)) {
					return 0;
				}
				return this.originalList.filter(item => {
					// 基于来访时间统计今日车辆状态
					const visitTime = item.entryTime || item.actualEntryTime;
					return visitTime && this.isToday(visitTime) && item.status === '已通过' && item.vehicleStatus === status;
				}).length;
			},
			getCurrentDate() {
				return dayjs().format('YYYY-MM-DD');
			},
			refreshStatistics() {
				// 可以在这里添加刷新数据的逻辑
				uni.showToast({
					title: '统计数据已刷新',
					icon: 'success'
				});
			},
			filterByStatus(status) {
				// 这里的问题可能是当 status 为 null 时的处理
				if (status === null) {
					this.current1 = 0; // 确保选中"全部"选项
				} else {
					this.current1 = this.listSubsection.findIndex(item =>
						(item === '待审批' && status === '待审核') ||
						(item === '已通过' && status === '已通过') ||
						(item === '未通过' && status === '未通过')
					);
				}

				this.change1(this.current1);
			},
			filterByVehicleStatus(status) {
				// 先选择已通过状态
				this.filterByStatus('已通过');

				// 然后从已通过的记录中筛选车辆状态
				setTimeout(() => {
					this.reservationList = this.reservationList.filter(item =>
						item.vehicleStatus === status
					);
					this.showFilterResultToast();
				}, 300);
			},
			// 用户角色统计方法
			getUserStatusCount(status) {
				if (!this.originalList || !Array.isArray(this.originalList)) {
					return 0;
				}
				return this.originalList.filter(item => item.status === status).length;
			},
			getUserStatusPercentage(status) {
				const count = this.getUserStatusCount(status);
				const total = this.originalList ? this.originalList.length : 1; // 避免除以0
				return Math.round((count / total) * 100);
			},
			getUserVehicleStatusCount(status) {
				if (!this.originalList || !Array.isArray(this.originalList)) {
					return 0;
				}
				return this.originalList.filter(item =>
					item.status === '已通过' && item.vehicleStatus === status
				).length;
			},
			hasApprovedReservations() {
				if (!this.originalList || !Array.isArray(this.originalList)) {
					return false;
				}
				return this.originalList.some(item => item.status === '已通过');
			},
			calculateAverageDuration() {
				if (!this.originalList || !Array.isArray(this.originalList)) {
					return '-';
				}
				const completedTrips = this.originalList.filter(item =>
					item.status === '已通过' && item.vehicleStatus === '已离场' && item.entryTime && item.exitTime
				);

				if (completedTrips.length === 0) return '-';

				const totalMinutes = completedTrips.reduce((sum, item) => {
					return sum + dayjs(item.exitTime).diff(dayjs(item.entryTime), 'minute');
				}, 0);

				const avgMinutes = Math.round(totalMinutes / completedTrips.length);
				const hours = Math.floor(avgMinutes / 60);
				const minutes = avgMinutes % 60;

				return hours > 0 ? `${hours}小时${minutes}分钟` : `${minutes}分钟`;
			},
			getNextReservation() {
				if (!this.originalList || !Array.isArray(this.originalList)) {
					return null;
				}
				const now = new Date();
				const futureReservations = this.originalList.filter(item =>
					new Date(item.time) > now
				).sort((a, b) => new Date(a.time) - new Date(b.time));

				return futureReservations.length > 0 ? futureReservations[0] : null;
			},
			// 计算今日数据占总数据的百分比
			getTodayPercentage() {
				const todayCount = this.getTodayCount();
				const totalCount = this.originalList.length || 1; // 避免除以0
				return Math.round((todayCount / totalCount) * 100);
			},
			toggleFilterTools() {
				this.showFilterTools = !this.showFilterTools;
			},
			toggleFilterTools2() {
				this.showFilterTools2 = !this.showFilterTools2;
			},
			toggleTimeFilterTools() {
				this.showTimeFilterTools = !this.showTimeFilterTools;
			},
			// 按预约时间排序（最晚优先）
			sortByLatestTime() {
				if (!this.reservationList || !Array.isArray(this.reservationList)) {
					return;
				}
				this.reservationList.sort((a, b) => {
					// 把两个时间字符串转为时间对象进行比较
					return new Date(b.time) - new Date(a.time);
				});
			},

			// === 车牌相关方法 ===
			// 判断是否是新能源车牌（8位数字符）
			isNewEnergyPlate(plateNumber) {
				return plateNumber && plateNumber.length === 8;
			},

			// 获取车牌样式类名
			getPlateClass(plateNumber) {
				return this.isNewEnergyPlate(plateNumber) ? 'green-plate' : 'blue-plate';
			},

			// 复制车牌号
			copyPlateNumber(plateNumber) {
				// #ifdef H5
				if (navigator.clipboard) {
					navigator.clipboard.writeText(plateNumber).then(() => {
						uni.showToast({
							title: '车牌号已复制',
							icon: 'success',
							duration: 1500
						});
					});
				} else {
					// 降级方案
					const input = document.createElement('input');
					input.value = plateNumber;
					document.body.appendChild(input);
					input.select();
					document.execCommand('copy');
					document.body.removeChild(input);
					uni.showToast({
						title: '车牌号已复制',
						icon: 'success',
						duration: 1500
					});
				}
				// #endif

				// #ifdef MP-WEIXIN || APP-PLUS
				uni.setClipboardData({
					data: plateNumber,
					success: () => {
						uni.showToast({
							title: '车牌号已复制',
							icon: 'success',
							duration: 1500
						});
					}
				});
				// #endif
			},

			// 拨打电话
			makePhoneCall(phoneNumber) {
				uni.makePhoneCall({
					phoneNumber: phoneNumber,
					success: () => {
						console.log('拨打电话成功');
					},
					fail: (err) => {
						console.log('拨打电话失败:', err);
						uni.showToast({
							title: '拨打电话失败',
							icon: 'none'
						});
					}
				});
			},

			// 复制地址
			copyAddress(address) {
				// #ifdef H5
				if (navigator.clipboard) {
					navigator.clipboard.writeText(address).then(() => {
						uni.showToast({
							title: '地址已复制',
							icon: 'success',
							duration: 1500
						});
					});
				} else {
					// 降级方案
					const input = document.createElement('input');
					input.value = address;
					document.body.appendChild(input);
					input.select();
					document.execCommand('copy');
					document.body.removeChild(input);
					uni.showToast({
						title: '地址已复制',
						icon: 'success',
						duration: 1500
					});
				}
				// #endif

				// #ifdef MP-WEIXIN || APP-PLUS
				uni.setClipboardData({
					data: address,
					success: () => {
						uni.showToast({
							title: '地址已复制',
							icon: 'success',
							duration: 1500
						});
					}
				});
				// #endif
			},

			// 获取车辆状态样式类名
			getVehicleStatusClass(status) {
				const classMap = {
					'已进场': 'status-entered',
					'已离场': 'status-exited',
					'未进场': 'status-pending'
				};
				return classMap[status] || 'status-pending';
			},

			// === 数据统计方法 ===
			// 获取今日数量（基于来访时间，不是预约时间）
			getTodayCount() {
				if (!this.originalList || !Array.isArray(this.originalList)) {
					return 0;
				}
				const today = new Date().toDateString();
				return this.originalList.filter(item => {
					// 优先使用实际进场时间，如果没有则使用预约时间
					const visitTime = item.entryTime || item.actualEntryTime;
					if (!visitTime) {
						return false; // 没有来访时间的不计入今日数据
					}
					const visitDate = new Date(visitTime).toDateString();
					return visitDate === today;
				}).length;
			},

			// 获取今日趋势（基于来访时间）
			getTodayTrend() {
				if (!this.originalList || !Array.isArray(this.originalList)) {
					return '0%';
				}

				const yesterday = new Date();
				yesterday.setDate(yesterday.getDate() - 1);
				const yesterdayStr = yesterday.toDateString();

				const yesterdayCount = this.originalList.filter(item => {
					// 优先使用实际进场时间，如果没有则使用预约时间
					const visitTime = item.entryTime || item.actualEntryTime;
					if (!visitTime) {
						return false; // 没有来访时间的不计入昨日数据
					}
					const visitDate = new Date(visitTime).toDateString();
					return visitDate === yesterdayStr;
				}).length;

				const todayCount = this.getTodayCount();
				if (yesterdayCount === 0) return todayCount > 0 ? '+100%' : '0%';

				const percent = Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100);
				// 如果是负数，不显示
				if (percent < 0) return '';
				return percent > 0 ? `+${percent}%` : '0%';
			},



			// 获取待处理数量
			getPendingCount() {
				if (!this.originalList || !Array.isArray(this.originalList)) {
					return 0;
				}
				return this.originalList.filter(item => item.status === '待审核').length;
			},

			// 获取紧急数量（今日待处理）
			getUrgentCount() {
				if (!this.originalList || !Array.isArray(this.originalList)) {
					return 0;
				}
				const today = new Date().toDateString();
				return this.originalList.filter(item => {
					const itemDate = new Date(item.time).toDateString();
					return itemDate === today && item.status === '待审核';
				}).length;
			},

			// 获取已完成数量
			getCompletedCount() {
				if (!this.originalList || !Array.isArray(this.originalList)) {
					return 0;
				}
				return this.originalList.filter(item => item.status === '已通过').length;
			},

			// 获取在场车辆数量
			getInParkingCount() {
				if (!this.originalList || !Array.isArray(this.originalList)) {
					return 0;
				}
				return this.originalList.filter(item => item.vehicleStatus === '已进场').length;
			},

			// 获取处理进度百分比
			getProcessPercent() {
				if (!this.originalList || !Array.isArray(this.originalList)) {
					return 0;
				}
				const total = this.originalList.length;
				if (total === 0) return 0;
				const completed = this.getCompletedCount();
				return Math.round((completed / total) * 100);
			},

			// === 筛选器方法 ===
			// 更新筛选器计数
			updateFilterCounts() {
				if (!this.originalList || !Array.isArray(this.originalList)) {
					return;
				}

				// 更新时间筛选计数
				if (this.timeFilterOptions && Array.isArray(this.timeFilterOptions)) {
					this.timeFilterOptions.forEach(option => {
						if (option.key !== 'all') {
							option.count = this.getTimeFilterCount(option.key);
						}
					});
				}

				// 更新状态筛选计数
				if (this.statusFilterOptions && Array.isArray(this.statusFilterOptions)) {
					this.statusFilterOptions.forEach(option => {
						if (option.key === 'all') {
							option.count = this.originalList.length;
						} else {
							option.count = this.getStatusFilterCount(option.key);
						}
					});
				}

				// 更新车辆状态筛选计数
				if (this.vehicleFilterOptions && Array.isArray(this.vehicleFilterOptions)) {
					this.vehicleFilterOptions.forEach(option => {
						if (option.key === 'all') {
							option.count = this.originalList.filter(item => item.status === '已通过').length;
						} else {
							option.count = this.getVehicleFilterCount(option.key);
						}
					});
				}
			},

			// 获取时间筛选计数
			getTimeFilterCount(timeKey) {
				if (!this.originalList || !Array.isArray(this.originalList)) {
					return 0;
				}

				const now = new Date();
				return this.originalList.filter(item => {
					const itemDate = new Date(item.time);

					switch (timeKey) {
						case 'today':
							return itemDate.toDateString() === now.toDateString();
						case 'yesterday':
							const yesterday = new Date(now);
							yesterday.setDate(yesterday.getDate() - 1);
							return itemDate.toDateString() === yesterday.toDateString();
						case 'recent3':
							const threeDaysAgo = new Date(now);
							threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
							return itemDate >= threeDaysAgo;
						case 'thisWeek':
							const weekStart = new Date(now);
							weekStart.setDate(weekStart.getDate() - now.getDay());
							return itemDate >= weekStart;
						default:
							return true;
					}
				}).length;
			},

			// 获取状态筛选计数
			getStatusFilterCount(statusKey) {
				if (!this.originalList || !Array.isArray(this.originalList)) {
					return 0;
				}

				const statusMap = {
					'pending': '待审核',
					'approved': '已通过',
					'rejected': '未通过'
				};

				return this.originalList.filter(item => item.status === statusMap[statusKey]).length;
			},

			// 获取车辆状态筛选计数
			getVehicleFilterCount(vehicleKey) {
				if (!this.originalList || !Array.isArray(this.originalList)) {
					return 0;
				}

				const vehicleMap = {
					'entered': '已进场',
					'exited': '已离场',
					'notEntered': '未进场'
				};

				return this.originalList.filter(item => {
					return item.status === '已通过' && (item.vehicleStatus === vehicleMap[vehicleKey] || (!item
						.vehicleStatus && vehicleKey === 'notEntered'));
				}).length;
			},

			// 选择时间筛选
			selectTimeFilter(timeKey) {
				this.selectedTimeFilter = timeKey;
				this.isFiltering = true;
			},

			// 选择状态筛选
			selectStatusFilter(statusKey) {
				this.selectedStatusFilter = statusKey;
				this.isFiltering = true;
			},

			// 选择车辆状态筛选
			selectVehicleFilter(vehicleKey) {
				this.selectedVehicleFilter = vehicleKey;
				this.isFiltering = true;
			},

			// 应用筛选
			applyFilters() {
				if (!this.originalList || !Array.isArray(this.originalList)) {
					this.reservationList = [];
					return;
				}

				let filteredData = [...this.originalList];

				// 应用时间筛选
				if (this.selectedTimeFilter !== 'all') {
					filteredData = this.applyTimeFilter(filteredData, this.selectedTimeFilter);
				}

				// 应用状态筛选
				if (this.selectedStatusFilter !== 'all') {
					filteredData = this.applyStatusFilter(filteredData, this.selectedStatusFilter);
				}

				// 应用车辆状态筛选
				if (this.selectedVehicleFilter !== 'all') {
					filteredData = this.applyVehicleFilter(filteredData, this.selectedVehicleFilter);
				}

				this.reservationList = filteredData;
				this.isFiltering = true;

				// 显示筛选结果提示
				uni.showToast({
					title: `筛选出 ${filteredData.length} 条记录`,
					icon: 'success',
					duration: 2000
				});
			},

			// 应用时间筛选
			applyTimeFilter(data, timeKey) {
				const now = new Date();
				return data.filter(item => {
					const itemDate = new Date(item.time);

					switch (timeKey) {
						case 'today':
							return itemDate.toDateString() === now.toDateString();
						case 'yesterday':
							const yesterday = new Date(now);
							yesterday.setDate(yesterday.getDate() - 1);
							return itemDate.toDateString() === yesterday.toDateString();
						case 'recent3':
							const threeDaysAgo = new Date(now);
							threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
							return itemDate >= threeDaysAgo;
						case 'thisWeek':
							const weekStart = new Date(now);
							weekStart.setDate(weekStart.getDate() - now.getDay());
							return itemDate >= weekStart;
						default:
							return true;
					}
				});
			},

			// 应用状态筛选
			applyStatusFilter(data, statusKey) {
				const statusMap = {
					'pending': '待审核',
					'approved': '已通过',
					'rejected': '未通过'
				};

				return data.filter(item => item.status === statusMap[statusKey]);
			},

			// 应用车辆状态筛选
			applyVehicleFilter(data, vehicleKey) {
				const vehicleMap = {
					'entered': '已进场',
					'exited': '已离场',
					'notEntered': '未进场'
				};

				return data.filter(item => {
					if (item.status !== '已通过') return false;

					if (vehicleKey === 'notEntered') {
						return !item.vehicleStatus || item.vehicleStatus === '未进场';
					}

					return item.vehicleStatus === vehicleMap[vehicleKey];
				});
			},

			// === 实时统计筛选方法 ===
			// 筛选今日来访（基于来访时间，不是预约时间）
			filterByToday() {
				if (this.currentStatFilter === 'today') {
					// 如果已经是今日筛选，则取消筛选
					this.currentStatFilter = null;
					this.reservationList = [...this.originalList];

					uni.showToast({
						title: '已取消筛选',
						icon: 'none',
						duration: 1500
					});
				} else {
					this.currentStatFilter = 'today';
					const today = new Date().toDateString();
					this.reservationList = this.originalList.filter(item => {
						// 优先使用实际进场时间，如果没有则不显示
						const visitTime = item.entryTime || item.actualEntryTime;
						if (!visitTime) {
							return false; // 没有来访时间的不显示在今日筛选中
						}
						const visitDate = new Date(visitTime).toDateString();
						return visitDate === today;
					});

					uni.showToast({
						title: `筛选今日来访：${this.reservationList.length}条记录`,
						icon: 'success',
						duration: 2000
					});
				}
			},

			// 筛选待处理
			filterByPending() {
				if (this.currentStatFilter === 'pending') {
					// 如果已经是待处理筛选，则取消筛选
					this.currentStatFilter = null;
					this.reservationList = [...this.originalList];

					uni.showToast({
						title: '已取消筛选',
						icon: 'none',
						duration: 1500
					});
				} else {
					this.currentStatFilter = 'pending';
					this.reservationList = this.originalList.filter(item => item.status === '待审核');

					uni.showToast({
						title: `筛选待处理：${this.reservationList.length}条记录`,
						icon: 'success',
						duration: 2000
					});
				}
			},

			// 筛选已完成
			filterByCompleted() {
				if (this.currentStatFilter === 'completed') {
					// 如果已经是已完成筛选，则取消筛选
					this.currentStatFilter = null;
					this.reservationList = [...this.originalList];

					uni.showToast({
						title: '已取消筛选',
						icon: 'none',
						duration: 1500
					});
				} else {
					this.currentStatFilter = 'completed';
					this.reservationList = this.originalList.filter(item => item.status === '已通过');

					uni.showToast({
						title: `筛选已完成：${this.reservationList.length}条记录`,
						icon: 'success',
						duration: 2000
					});
				}
			},

			// 重置所有筛选
			resetAllFilters() {
				this.selectedTimeFilter = 'all';
				this.selectedStatusFilter = 'all';
				this.selectedVehicleFilter = 'all';
				this.currentStatFilter = null; // 重置实时统计筛选
				this.reservationList = [...(this.originalList || [])];
				this.isFiltering = false;
				this.searchKeyword = '';

				uni.showToast({
					title: '筛选已重置',
					icon: 'success',
					duration: 1500
				});
			},

			// === 新增方法：欢迎界面相关 ===
			// 显示高级功能
			showAdvancedFeatures() {
				// 切换到功能界面并展开筛选器
				this.isFiltering = true;
				this.showSmartFilter = true;
				this.showDashboard = true;

				uni.showToast({
					title: '已进入高级功能模式',
					icon: 'success',
					duration: 1500
				});
			},

			// 显示今日数据
			showTodayData() {
				// 筛选今日数据
				this.filterByToday();
			},

			// 返回欢迎界面
			backToWelcome() {
				// 重置所有状态
				this.resetAllFilters();

				// 重置搜索相关状态
				this.searchKeyword = '';
				this.hasPerformedSearch = false;

				// 恢复原始数据
				this.reservationList = [...this.originalList];
				this.updateStatistics();

				// 确保显示搜索历史和热门搜索
				this.showSearchHistory = this.searchHistory.length > 0;
				this.showHotSearch = true;
				this.showSuggestions = false;

				uni.showToast({
					title: '已返回主页',
					icon: 'success',
					duration: 1500
				});
			},

			// === 键盘监听相关方法 ===
			// 初始化键盘监听
			initKeyboardListeners() {
				// #ifdef H5
				// H5环境下监听resize事件来检测键盘
				this.handleResize = () => {
					const currentHeight = window.innerHeight;
					const screenHeight = window.screen.height;
					const heightDiff = screenHeight - currentHeight;

					if (heightDiff > 150) {
						// 键盘弹出
						this.keyboardHeight = heightDiff;
						this.adjustSuggestionPosition();
					} else {
						// 键盘隐藏
						this.keyboardHeight = 0;
					}
				};

				window.addEventListener('resize', this.handleResize);
				// #endif

				// #ifdef MP-WEIXIN
				// 微信小程序监听键盘高度变化
				uni.onKeyboardHeightChange((res) => {
					this.keyboardHeight = res.height;
					if (res.height > 0) {
						this.adjustSuggestionPosition();
					}
				});
				// #endif

				// #ifdef APP-PLUS
				// App端监听软键盘
				uni.onKeyboardHeightChange && uni.onKeyboardHeightChange((res) => {
					this.keyboardHeight = res.height;
					if (res.height > 0) {
						this.adjustSuggestionPosition();
					}
				});
				// #endif
			},

			// 移除键盘监听
			removeKeyboardListeners() {
				// #ifdef H5
				if (this.handleResize) {
					window.removeEventListener('resize', this.handleResize);
				}
				// #endif
			},

			// 调整搜索建议位置
			adjustSuggestionPosition() {
				this.$nextTick(() => {
					try {
						const systemInfo = uni.getSystemInfoSync();
						// 如果键盘高度大于屏幕高度的40%，则调整建议框位置
						if (this.keyboardHeight > systemInfo.windowHeight * 0.4) {
							this.suggestionScrollTop = 0;
							// 为搜索建议添加特殊样式类
							const suggestionElements = document.querySelectorAll('.search-suggestions');
							suggestionElements.forEach(el => {
								el.classList.add('keyboard-active');
							});
						} else {
							// 移除特殊样式类
							const suggestionElements = document.querySelectorAll('.search-suggestions');
							suggestionElements.forEach(el => {
								el.classList.remove('keyboard-active');
							});
						}
					} catch (error) {
						// 调整位置失败处理
					}
				});
			},

			// 优化滚动视图
			optimizeScrollView() {
				try {
					// 重置滚动位置到顶部
					this.suggestionScrollTop = 0;

					// 延迟再次设置，确保scroll-view正确初始化
					setTimeout(() => {
						this.suggestionScrollTop = 1;
						setTimeout(() => {
							this.suggestionScrollTop = 0;
						}, 50);
					}, 100);

				} catch (error) {
					// 优化滚动视图失败处理
				}
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
				background-image: linear-gradient(to top, #0ba360 0%, #3cba92 100%);
				color: #fff !important;
			}

			&--warning {
				// 已离场
				background: linear-gradient(to right, rgb(240, 0, 0), rgb(220, 40, 30));
				color: #fff !important;
			}

			&--info {
				// 未进场
				background: linear-gradient(45deg, #2196F3, #42A5F5);
				color: #fff !important;
			}
		}
	}

	.time-info {
		.time-item {
			display: flex;
			align-items: center;
			margin: 12rpx 0;

			text {
				margin-left: 10rpx;
				color: #666;
				font-size: 14px;
			}

			.duration {
				color: #2196F3;
				margin-left: 15rpx;
				font-weight: bold;
			}
		}
	}

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

	/* 车牌高亮样式 */
	.highlight-plate {
		background-color: #f5f7ff;
		border-radius: 8rpx;
		padding: 12rpx;
		margin: 16rpx 0;
	}

	/* 地址行样式 */
	.address-row {
		border-left: 4rpx solid #FF5722;
		padding-left: 16rpx;
		margin-top: 20rpx;
	}

	/* 全局卡片样式调整 */
	.data-list {
		background: linear-gradient(135deg, #fbfcfd 0%, #f8fafb 100%);
		/* 全局背景色设置（需在App.vue同步配置）[[0]](#__0) [[7]](#__7) */
		padding: 20rpx;
	}



	.container {
		padding: 24rpx;
		background: linear-gradient(135deg, #fafbfc 0%, #f5f6f7 100%);
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.time-filter {
		background: #fff;
		border-radius: 16rpx;
		padding: 20rpx;
		margin-bottom: 24rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
	}

	.status-tags {
		margin: 24rpx 0;
	}



	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: #fafbfc !important;
		border-bottom: 1px dashed rgba(200, 200, 200, 0.5);
	}

	.card-body {
		.info-row {
			display: flex;
			align-items: center;
			margin: 16rpx 0;

			&>view {
				margin-right: 30rpx;
			}
		}
	}

	/* 时间筛选标签的样式 */
	.time-filter-tags {
		margin-top: 16rpx;
		background: #ffffff;
		border-radius: 12rpx;
		padding: 16rpx;
		box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.03);
	}

	.time-tags-wrap {
		display: flex;
		flex-wrap: wrap;
		gap: 12rpx;
	}

	.time-tag {
		transition: all 0.2s ease;
	}

	.time-tag-active {
		background-color: #e8f4ff !important;
		color: #2979ff !important;
		border-color: #2979ff !important;
		font-weight: bold;
	}

	/* 优化预约时间容器样式 */
	.appointment-time-container {
		display: flex;
		align-items: center;
		background: linear-gradient(to right, #f0f7ff, #e6f7ff);
		border-radius: 8rpx;
		padding: 8rpx 16rpx;
		margin-right: 10rpx;
		position: relative;
	}

	/* 时间标签样式增强 */
	.time-status-tag {
		position: absolute;
		top: -10rpx;
		left: -6rpx;
		font-size: 20rpx;
		padding: 2rpx 10rpx;
		border-radius: 10rpx;
		color: #ffffff;
		font-weight: bold;
		box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
	}

	/* 修改各种时间状态的标签样式，使今日更醒目 */
	.time-status-today {
		background: linear-gradient(to right, #FF3CAC, #784BA0, #2B86C5);
		font-size: 28rpx;
		/* 增大今日标签字体 */
		padding: 6rpx 20rpx;
		/* 增加内边距 */
		border: 1px solid rgba(255, 255, 255, 0.5);
		box-shadow: 0 4rpx 10rpx rgba(120, 75, 160, 0.4);
		animation: pulseToday 2s infinite alternate;
		/* 添加脉冲动画效果 */
	}

	/* 脉冲动画让今日标签更加醒目 */
	@keyframes pulseToday {
		from {
			box-shadow: 0 4rpx 10rpx rgba(120, 75, 160, 0.4);
		}

		to {
			box-shadow: 0 4rpx 16rpx rgba(120, 75, 160, 0.8);
		}
	}

	.time-status-yesterday {
		background: linear-gradient(to right, #FFC371, #FF5F6D);
		border: 1px solid rgba(255, 255, 255, 0.4);
	}

	.time-status-three-days {
		background: linear-gradient(to right, #4776E6, #8E54E9);
	}

	.time-status-five-days {
		background: linear-gradient(to right, #00b09b, #96c93d);
	}

	.time-status-week {
		background: linear-gradient(to right, #314755, #26a0da);
	}

	/* 统一增强时间状态标签的显示效果 */
	.time-status-badge {
		font-size: 26rpx;
		padding: 6rpx 16rpx;
		border-radius: 8rpx;
		color: #ffffff;
		font-weight: bold;
		margin-bottom: 10rpx;
		display: inline-block;
		align-self: flex-start;
		box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.2);
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
		/* 添加文字阴影增强可读性 */
		letter-spacing: 1px;
		/* 增加字间距 */
	}

	/* 给今日标签特别处理 */
	.time-status-badge.time-status-today {
		transform: scale(1.1);
		/* 整体放大 */
		transform-origin: left center;
		z-index: 5;
		/* 确保在最上层 */
	}

	/* 新的布局容器 */
	.appointment-container {
		display: flex;
		flex-direction: column;
		position: relative;
	}

	/* 状态标签作为常规元素而非绝对定位 */
	.time-status-badge {
		font-size: 26rpx;
		padding: 4rpx 16rpx;
		border-radius: 8rpx;
		color: #ffffff;
		font-weight: bold;
		margin-bottom: 8rpx;
		display: inline-block;
		align-self: flex-start;
		box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.2);
	}

	/* 在状态标签和数据列表之间添加筛选结果数量显示 */
	.filter-result-info {
		background: #fff;
		border-radius: 12rpx;
		padding: 16rpx 20rpx;
		margin: 16rpx 0;
		display: flex;
		justify-content: space-between;
		align-items: center;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
	}

	.filter-count {
		display: flex;
		align-items: center;
		font-size: 26rpx;
		color: #606266;
	}

	.count-number {
		font-weight: bold;
		color: #2979ff;
		font-size: 30rpx;
		margin: 0 6rpx;
	}

	.filter-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 10rpx;
	}

	.filter-tag {
		background: #f0f7ff;
		color: #2979ff;
		font-size: 22rpx;
		padding: 4rpx 16rpx;
		border-radius: 20rpx;
		font-weight: bold;
		border: 1px solid rgba(41, 121, 255, 0.2);
	}

	/* 无数据提示 */
	.empty-result {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60rpx 0;
		flex-shrink: 0;
	}

	/* === 搜索建议相关样式 === */
	.search-suggestions {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: #fff;
		border-radius: 12rpx;
		box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.12);
		z-index: 1000;
		margin-top: 8rpx;
		border: 1rpx solid #e8e8e8;
		overflow: hidden;

		.suggestions-scroll {
			max-height: 400rpx;
		}

		.suggestion-item {
			display: flex;
			align-items: center;
			padding: 16rpx 20rpx;
			border-bottom: 1rpx solid #f0f0f0;
			transition: all 0.3s ease;

			&:active {
				background: #f8f9ff;
			}

			&:last-child {
				border-bottom: none;
			}

			.suggestion-icon {
				width: 40rpx;
				height: 40rpx;
				border-radius: 8rpx;
				background: #f5f7fa;
				display: flex;
				align-items: center;
				justify-content: center;
				margin-right: 16rpx;

				.icon-emoji {
					font-size: 24rpx;
				}
			}

			.suggestion-content {
				flex: 1;

				.suggestion-text {
					font-size: 28rpx;
					color: #333;
					margin-bottom: 4rpx;
					display: block;
				}

				.suggestion-type {
					font-size: 22rpx;
					color: #999;
				}
			}

			.suggestion-count {
				font-size: 24rpx;
				color: #409EFF;
				font-weight: 600;
				padding: 4rpx 8rpx;
				background: rgba(64, 158, 255, 0.1);
				border-radius: 8rpx;
				margin-right: 12rpx;
			}

			.suggestion-arrow {
				color: #ccc;

				.icon-emoji {
					font-size: 20rpx;
				}
			}
		}

		.suggestions-footer {
			padding: 12rpx 20rpx;
			background: #f8f9fa;
			border-top: 1rpx solid #e8e8e8;

			.footer-text {
				font-size: 22rpx;
				color: #666;
			}
		}
	}

	/* 没有搜索建议时的样式 */
	.no-suggestions {
		padding: 20rpx;
		text-align: center;
		background: #f8f9fa;
		border-radius: 12rpx;
		margin: 10rpx;

		.no-suggestions-content {
			display: flex;
			align-items: center;
			justify-content: center;
			margin-bottom: 8rpx;

			.no-suggestions-text {
				color: #909399;
				font-size: 28rpx;
			}
		}

		.no-suggestions-tip {
			margin-top: 8rpx;

			.tip-text {
				color: #c0c4cc;
				font-size: 24rpx;
			}
		}
	}

	.empty-text {
		color: #909399;
		font-size: 28rpx;
		margin-top: 20rpx;
	}

	.back-to-welcome {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
		margin-top: 30rpx;
		padding: 16rpx 32rpx;
		background: linear-gradient(135deg, #409EFF, #67C23A);
		color: #ffffff;
		border-radius: 24rpx;
		font-size: 26rpx;
		font-weight: 600;
		box-shadow: 0 4rpx 16rpx rgba(64, 158, 255, 0.3);
		transition: all 0.3s ease;
		cursor: pointer;

		&:active {
			transform: scale(0.98);
			box-shadow: 0 2rpx 8rpx rgba(64, 158, 255, 0.5);
		}

		text {
			color: #ffffff;
		}
	}

	/* 在筛选结果数量显示下方添加管家统计卡片 */
	.statistics-dashboard {
		background: #fff;
		border-radius: 12rpx;
		padding: 16rpx;
		margin-bottom: 12rpx;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
	}

	.statistics-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12rpx;
		border-bottom: 1px solid #f2f2f2;
		padding-bottom: 10rpx;
	}

	.statistics-title {
		font-size: 30rpx;
		font-weight: bold;
		color: #333;
	}

	.refresh-button {
		display: flex;
		align-items: center;
		font-size: 24rpx;
		color: #909399;

		text {
			margin-left: 6rpx;
		}
	}

	.statistics-cards {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		margin-bottom: 12rpx;
	}

	.stat-card {
		width: 31%;
		background: #f8f9fa;
		border-radius: 10rpx;
		padding: 12rpx;
		margin-bottom: 10rpx;
		position: relative;
		overflow: hidden;
		box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.05);

		&:active {
			opacity: 0.8;
		}
	}

	.stat-value {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 4rpx;
	}

	.stat-label {
		font-size: 24rpx;
		color: #606266;
	}

	.stat-indicator {
		position: absolute;
		top: 0;
		left: 0;
		width: 8rpx;
		height: 100%;

		&.total {
			background: linear-gradient(to bottom, #3F51B5, #303F9F);
		}

		&.pending {
			background: linear-gradient(to bottom, #FFC107, #FF9800);
		}

		&.approved {
			background: linear-gradient(to bottom, #4CAF50, #2E7D32);
		}

		&.rejected {
			background: linear-gradient(to bottom, #F44336, #C62828);
		}

		&.entered {
			background: linear-gradient(to bottom, #2196F3, #1565C0);
		}

		&.exited {
			background: linear-gradient(to bottom, #9C27B0, #6A1B9A);
		}
	}

	.today-summary {
		background: #f8f9fa;
		border-radius: 10rpx;
		padding: 12rpx;
	}

	.summary-header {
		display: flex;
		justify-content: space-between;
		font-size: 24rpx;
		color: #606266;
		margin-bottom: 8rpx;
	}

	.summary-date {
		color: #909399;
		font-size: 24rpx;
	}

	.summary-content {
		display: flex;
		align-items: center;
		justify-content: space-around;
	}

	.summary-item {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.summary-label {
		font-size: 22rpx;
		color: #909399;
		margin-bottom: 4rpx;
	}

	.summary-value {
		font-size: 28rpx;
		font-weight: bold;
		color: #2979ff;
	}

	.summary-divider {
		color: #e0e0e0;
		margin: 0 10rpx;
	}

	.summary-ratio {
		font-size: 20rpx;
		color: #909399;
		margin-top: 4rpx;
	}

	/* 用户视图样式 */
	.user-statistics {
		background: #fff;
		border-radius: 12rpx;
		padding: 20rpx;
		margin: 20rpx 0;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
	}

	.user-statistics-header {
		margin-bottom: 20rpx;
		border-bottom: 1px solid #f2f2f2;
		padding-bottom: 16rpx;
	}

	.user-status-chart {
		padding: 16rpx 0;
	}

	.status-progress {
		margin-bottom: 20rpx;
	}

	.status-bar {
		height: 16rpx;
		background: #eee;
		border-radius: 8rpx;
		display: flex;
		overflow: hidden;
		margin-bottom: 16rpx;
	}

	.status-segment {
		height: 100%;

		&.pending {
			background: #FFC107;
		}

		&.approved {
			background: #4CAF50;
		}

		&.rejected {
			background: #F44336;
		}
	}

	.status-labels {
		display: flex;
		justify-content: space-between;
		font-size: 24rpx;
		color: #606266;
	}

	.status-label-item {
		display: flex;
		align-items: center;
	}

	.status-dot {
		width: 16rpx;
		height: 16rpx;
		border-radius: 50%;
		margin-right: 8rpx;

		&.pending {
			background: #FFC107;
		}

		&.approved {
			background: #4CAF50;
		}

		&.rejected {
			background: #F44336;
		}
	}

	.vehicle-statistics {
		margin-top: 30rpx;
		padding-top: 20rpx;
		border-top: 1px solid #f2f2f2;
	}

	.vehicle-stat-title {
		font-size: 28rpx;
		color: #333;
		margin-bottom: 16rpx;
	}

	.vehicle-stat-cards {
		display: flex;
		justify-content: space-between;
	}

	.vehicle-stat-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 30%;
		padding: 16rpx;
		background: #f8f9fa;
		border-radius: 12rpx;
	}

	.vehicle-stat-label {
		font-size: 24rpx;
		color: #909399;
		margin: 8rpx 0;
	}

	.vehicle-stat-value {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
	}

	.recent-reservation {
		margin-top: 30rpx;
		padding-top: 20rpx;
		border-top: 1px solid #f2f2f2;
	}

	.recent-header {
		font-size: 28rpx;
		color: #333;
		margin-bottom: 16rpx;
	}

	.recent-content {
		background: #f8f9fa;
		border-radius: 12rpx;
		padding: 16rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.recent-time {
		display: flex;
		align-items: center;

		text {
			margin-left: 8rpx;
			font-size: 26rpx;
			color: #333;
		}
	}

	.recent-status {
		font-size: 24rpx;
		padding: 4rpx 12rpx;
		border-radius: 20rpx;

		&.approved-status {
			background: #e8f5e9;
			color: #4CAF50;
		}

		&.pending-status {
			background: #fff3e0;
			color: #FF9800;
		}
	}

	/* 筛选工具区域 */
	.filter-tools {
		background: #fff;
		border-radius: 12rpx;
		margin-bottom: 12rpx;
		box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.05);
		overflow: hidden;
	}

	.filter-tools-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 14rpx 20rpx;
		border-bottom: 1px solid #f2f2f2;
	}

	.filter-tools-title {
		display: flex;
		align-items: center;

		text {
			margin-left: 10rpx;
			font-size: 28rpx;
			color: #333;
			font-weight: bold;
		}
	}

	.filter-tools-content {
		padding: 14rpx;
	}

	/* 调整列表区域的高度 */
	.data-list {
		height: calc(100vh - 520rpx);
		/* 根据上方内容的高度调整，确保列表可以正常滚动 */
		background-color: #f5f5f5;
		padding: 20rpx;
		border-radius: 12rpx;
	}

	/* 增加工具区域展开/收起的过渡效果 */
	.filter-tools-content {
		transition: all 0.3s ease;
	}

	/* 紧凑布局通用样式 */
	.compact-layout {
		padding: 16rpx 12rpx;
	}

	/* 筛选结果横幅样式 */
	.filter-result-banner {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: rgba(41, 121, 255, 0.1);
		padding: 8rpx 16rpx;
		border-radius: 6rpx;
		margin: 10rpx 0;
		font-size: 24rpx;
		color: #2979ff;
		border-left: 4rpx solid #2979ff;
	}

	.filter-count {
		display: flex;
		align-items: center;
		font-size: 24rpx;
	}

	.count-number {
		font-weight: bold;
		color: #2979ff;
		font-size: 28rpx;
		margin: 0 4rpx;
	}

	.filter-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 8rpx;
	}

	.filter-tag {
		background: #e8f4ff;
		color: #2979ff;
		font-size: 20rpx;
		padding: 2rpx 12rpx;
		border-radius: 16rpx;
		font-weight: bold;
		border: 1px solid rgba(41, 121, 255, 0.2);
	}

	/* 紧凑版状态标签 */
	.status-tags.compact {
		margin: 12rpx 0;
	}

	/* 紧凑版时间筛选标签 */
	.time-filter-tags.compact {
		margin-top: 12rpx;
		padding: 10rpx;
	}

	.time-tags-wrap {
		display: flex;
		flex-wrap: wrap;
		gap: 8rpx;
	}

	/* 紧凑版筛选工具 */
	.filter-tools.compact {
		margin-bottom: 12rpx;
	}

	.filter-tools-header {
		padding: 16rpx;
	}

	/* 调整列表区域的高度，使其更紧凑 */
	.data-list.compact {
		height: calc(100vh - 450rpx);
		/* 减小高度以适应更紧凑的页面 */
	}

	/* 列表项的紧凑版样式 */
	.list-item {
		margin: 16rpx 0;
	}

	/* 其他紧凑样式调整 */
	.container {
		padding: 16rpx;
	}

	.time-filter {
		padding: 16rpx;
		margin-bottom: 16rpx;
	}

	/* 时间筛选折叠栏样式 */
	.time-filter-tools {
		margin-top: 12rpx;
		margin-bottom: 12rpx;
	}

	.time-filter-tags {
		margin-top: 10rpx;
		background: #ffffff;
		border-radius: 12rpx;
		padding: 14rpx;
	}

	/* === 欢迎界面样式 === */
	.welcome-section {
		min-height: 100vh;
		display: flex;
		justify-content: center;
		align-items: center;
		background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
		padding: 40rpx 20rpx;

		.main-content {
			width: 100%;
			max-width: 700rpx;

			.icon-wrapper {
				text-align: center;
				margin-bottom: 60rpx;

				.main-title {
					display: block;
					font-size: 48rpx;
					font-weight: 600;
					color: #1e3a8a;
					letter-spacing: 2rpx;
					text-shadow: 0 4rpx 8rpx rgba(30, 58, 138, 0.1);
					margin-top: 20rpx;
				}

				.sub-title {
					display: block;
					font-size: 28rpx;
					color: #64748b;
					margin: 16rpx 0;
					font-family: monospace;
				}
			}
		}
	}

	.welcome-search-container {
		margin-bottom: 40rpx;
		position: relative;
		overflow: visible;

		.search-input-wrapper {
			position: relative;
			background: #FFFFFF;
			border-radius: 30rpx;
			padding: 12rpx 24rpx;
			box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.12);
			border: 3rpx solid rgba(255, 255, 255, 0.9);
			transition: all 0.4s ease;
			overflow: visible;

			&:focus-within {
				border-color: #409EFF;
				box-shadow: 0 12rpx 40rpx rgba(64, 158, 255, 0.25);
				transform: translateY(-4rpx);
			}

			.search-input {
				width: calc(100% - 140rpx);
				height: 88rpx;
				font-size: 30rpx;
				color: #333;
				border: none;
				outline: none;

				&::placeholder {
					color: #C0C4CC;
					font-size: 28rpx;
				}
			}

			.search-actions {
				position: absolute;
				right: 12rpx;
				top: 50%;
				transform: translateY(-50%);
				display: flex;
				align-items: center;
				gap: 16rpx;

				.voice-search,
				.clear-search {
					width: 72rpx;
					height: 72rpx;
					display: flex;
					align-items: center;
					justify-content: center;
					border-radius: 50%;
					background: #F5F7FA;
					transition: all 0.3s ease;

					&:active {
						transform: scale(0.95);
						background: #E4E7ED;
					}
				}

				.search-button {
					width: 72rpx;
					height: 72rpx;
					background: linear-gradient(135deg, #409EFF, #67C23A);
					border-radius: 50%;
					display: flex;
					align-items: center;
					justify-content: center;
					box-shadow: 0 6rpx 20rpx rgba(64, 158, 255, 0.4);
					transition: all 0.3s ease;

					&:active {
						transform: scale(0.95);
						box-shadow: 0 4rpx 16rpx rgba(64, 158, 255, 0.6);
					}
				}
			}
		}
	}

	.quick-actions {
		display: flex;
		flex-direction: column;
		gap: 16rpx;
		margin-top: 40rpx;

		.action-item {
			display: flex;
			align-items: center;
			justify-content: space-between;
			background: #ffffff;
			border-radius: 20rpx;
			padding: 24rpx 28rpx;
			box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
			border: 1rpx solid rgba(255, 255, 255, 0.8);
			transition: all 0.3s ease;

			&:active {
				transform: translateY(-2rpx);
				box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
			}

			.action-text {
				flex: 1;
				font-size: 30rpx;
				font-weight: 600;
				color: #333333;
				margin-left: 4rpx;
			}

			.action-count {
				font-size: 26rpx;
				font-weight: bold;
				color: #67C23A;
				background: rgba(103, 194, 58, 0.1);
				padding: 6rpx 16rpx;
				border-radius: 16rpx;
				margin-right: 12rpx;
			}
		}
	}

	.functional-section {
		padding: 0;
		display: flex;
		flex-direction: column;
		flex: 1;
		overflow: hidden;
		height: 100vh;
	}

	.function-header {
		flex-shrink: 0;
		padding-bottom: 16rpx;
		background: #ffffff;
		z-index: 2;
	}

	.function-content {
		flex: 1;
		overflow-y: auto;
		padding: 16rpx 0;
	}

	.data-list-container {
		padding: 20rpx 0;

		/* 紧凑列表项样式 */
		.compact-list-item {
			margin: 16rpx 0;
			background: #ffffff;
			border-radius: 16rpx;
			overflow: hidden;
			position: relative;
			box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
			border: 1rpx solid #f0f0f0;

			/* 紧凑头部行 */
			.compact-item-header {
				display: flex;
				align-items: center;
				padding: 20rpx;
				position: relative;

				/* 时间标签 */
				.time-status-badge {
					padding: 4rpx 12rpx;
					border-radius: 8rpx;
					font-size: 24rpx;
					margin-right: 16rpx;
					background: #f2f6fc;
					color: #409EFF;

					&.time-status-today {
						background: #ecf5ff;
						color: #409EFF;
					}

					&.time-status-yesterday {
						background: #f0f9eb;
						color: #67C23A;
					}
				}

				/* 紧凑车牌号 */
				.compact-plate-number {
					flex: 1;
					padding: 8rpx 16rpx;
					border-radius: 8rpx;
					font-size: 28rpx;
					font-weight: bold;
					text-align: center;
					margin: 0 16rpx;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;

					&.blue-plate {
						background: #0d47a1;
						color: white;
					}

					&.green-plate {
						background: #1b5e20;
						color: white;
					}
				}

				/* 状态标签 */
				.compact-status-badge {
					padding: 4rpx 12rpx;
					border-radius: 8rpx;
					font-size: 24rpx;
					margin: 0 16rpx;

					&.status-entered {
						background: #f0f9eb;
						color: #67C23A;
					}

					&.status-exited {
						background: #fef0f0;
						color: #f56c6c;
					}

					&.status-pending {
						background: #f4f4f5;
						color: #909399;
					}
				}

				/* 操作按钮组 */
				.compact-actions {
					display: flex;
					align-items: center;

					.copy-button, .expand-button {
						padding: 4rpx 12rpx;
						margin-left: 12rpx;
						font-size: 24rpx;
						color: #409EFF;
						display: flex;
						align-items: center;
					}

					.expand-icon {
						margin-left: 4rpx;
					}
				}
			}

			/* 详细信息部分 */
			.compact-item-details {
				padding: 0 20rpx 20rpx;
				background: #f9f9f9;
				border-top: 1rpx dashed #eaeaea;

				.detail-row {
					display: flex;
					align-items: center;
					padding: 12rpx 0;

					.detail-icon {
						margin-right: 12rpx;
						font-size: 28rpx;
					}

					.detail-label {
						color: #606266;
						font-size: 26rpx;
						margin-right: 8rpx;
					}

					.detail-value {
						color: #303133;
						font-size: 26rpx;
						flex: 1;
					}
				}
			}
		}

		.list-item {
			margin: 30rpx 0;
			background: linear-gradient(135deg, #ffffff 0%, #fdfdfe 100%);
			border-radius: 20rpx;
			overflow: hidden;
			position: relative;
			box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.03);
			border: 1rpx solid rgba(255, 255, 255, 0.9);

			&::before {
				content: '';
				position: absolute;
				bottom: -15rpx;
				left: 5%;
				width: 90%;
				height: 30rpx;
				background: #f5f5f7;
				border-radius: 0 0 16rpx 16rpx;
				z-index: -1;
			}
		}
	}

	/* === 智能搜索样式 === */
	.intelligent-search-section {
		background: #ffffff;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 24rpx;
		position: relative;
		overflow: visible;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
		border: 1rpx solid rgba(230, 230, 230, 0.6);
		flex-shrink: 0;
		z-index: 5;
	}

	.search-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;

		.search-title {
			font-size: 32rpx;
			font-weight: 600;
			color: #333333;
			text-shadow: none;
		}

		.search-stats {
			.search-count {
				font-size: 26rpx;
				color: #666666;
				background: rgba(102, 102, 102, 0.1);
				padding: 6rpx 16rpx;
				border-radius: 20rpx;
				backdrop-filter: blur(10rpx);
			}
		}
	}

	.smart-search-container {
		position: relative;
		z-index: 10;
		overflow: visible;
	}

	.search-input-wrapper {
		position: relative;
		background: #FFFFFF;
		border-radius: 25rpx;
		padding: 8rpx 20rpx;
		box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
		border: 2rpx solid rgba(255, 255, 255, 0.8);
		transition: all 0.3s ease;
		overflow: visible;

		&:focus-within {
			border-color: #409EFF;
			box-shadow: 0 8rpx 32rpx rgba(64, 158, 255, 0.3);
			transform: translateY(-2rpx);
		}
	}

	.search-input {
		width: calc(100% - 120rpx);
		height: 80rpx;
		font-size: 28rpx;
		color: #333;
		border: none;
		outline: none;

		&::placeholder {
			color: #C0C4CC;
			font-size: 26rpx;
		}
	}

	.search-actions {
		position: absolute;
		right: 8rpx;
		top: 50%;
		transform: translateY(-50%);
		display: flex;
		align-items: center;
		gap: 12rpx;

		.voice-search,
		.clear-search {
			width: 64rpx;
			height: 64rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: 50%;
			background: #F5F7FA;
			transition: all 0.3s ease;

			&:active {
				transform: scale(0.95);
				background: #E4E7ED;
			}
		}

		.search-button {
			width: 64rpx;
			height: 64rpx;
			background: linear-gradient(135deg, #409EFF, #67C23A);
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			box-shadow: 0 4rpx 16rpx rgba(64, 158, 255, 0.4);
			transition: all 0.3s ease;

			&:active {
				transform: scale(0.95);
				box-shadow: 0 2rpx 8rpx rgba(64, 158, 255, 0.6);
			}
		}
	}

	/* 搜索建议下拉框 - 优化键盘适配和滚动 */
	.search-suggestions {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: #FFFFFF;
		border-radius: 16rpx;
		margin-top: 8rpx;
		box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
		border: 1rpx solid rgba(64, 158, 255, 0.2);
		z-index: 9999;
		/* 提高z-index确保在键盘上方 */
		overflow: hidden;
		backdrop-filter: blur(20rpx);
		transition: transform 0.3s ease;
		max-height: 50vh;
		/* 限制最大高度，避免超出视窗 */

		.suggestions-scroll {
			height: auto;
			max-height: 320rpx;
			/* 固定最大高度，约显示4-5个建议项 */
			min-height: 80rpx;
			/* 确保有最小高度 */
			overflow-y: auto !important;
			overflow-x: hidden;
			-webkit-overflow-scrolling: touch;
			/* iOS平滑滚动 */
			/* 确保滚动可见 */
			scrollbar-width: thin;
			scrollbar-color: rgba(64, 158, 255, 0.5) rgba(240, 240, 240, 0.3);

			/* 添加边框以清晰显示滚动区域 */
			border: 1rpx solid rgba(64, 158, 255, 0.1);
			border-radius: 8rpx;

			/* Webkit滚动条样式 */
			&::-webkit-scrollbar {
				width: 6rpx;
			}

			&::-webkit-scrollbar-track {
				background: rgba(240, 240, 240, 0.3);
				border-radius: 3rpx;
			}

			&::-webkit-scrollbar-thumb {
				background: rgba(64, 158, 255, 0.5);
				border-radius: 3rpx;

				&:hover {
					background: rgba(64, 158, 255, 0.7);
				}

				&:active {
					background: rgba(64, 158, 255, 0.8);
				}
			}
		}

		.suggestion-item {
			display: flex;
			align-items: center;
			padding: 16rpx 20rpx;
			border-bottom: 1rpx solid #f8f9fa;
			transition: all 0.3s ease;
			position: relative;

			&:last-child {
				border-bottom: none;
			}

			&:active {
				background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
				transform: scale(0.98);
			}

			&::before {
				content: '';
				position: absolute;
				left: 0;
				top: 0;
				width: 0;
				height: 100%;
				background: linear-gradient(135deg, #409eff, #36cfc9);
				transition: width 0.3s ease;
			}

			&:active::before {
				width: 4rpx;
			}

			.suggestion-icon {
				width: 36rpx;
				height: 36rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				margin-right: 16rpx;
				background: rgba(64, 158, 255, 0.1);
				border-radius: 50%;

				.icon-emoji {
					font-size: 18rpx;
				}
			}

			.suggestion-content {
				flex: 1;
				display: flex;
				flex-direction: column;

				.suggestion-text {
					font-size: 28rpx;
					color: #303133;
					font-weight: 500;
					line-height: 1.4;
					margin-bottom: 4rpx;
				}

				.suggestion-type {
					font-size: 22rpx;
					color: #909399;
					line-height: 1.2;
				}
			}

			.suggestion-count {
				font-size: 20rpx;
				color: #409eff;
				background: linear-gradient(135deg, #e3f2fd, #bbdefb);
				padding: 4rpx 10rpx;
				border-radius: 12rpx;
				margin-right: 12rpx;
				min-width: 32rpx;
				text-align: center;
				font-weight: 600;
				box-shadow: 0 2rpx 8rpx rgba(64, 158, 255, 0.2);
			}

			.suggestion-arrow {
				width: 24rpx;
				height: 24rpx;
				display: flex;
				align-items: center;
				justify-content: center;

				.icon-emoji {
					font-size: 16rpx;
				}
			}
		}

		.suggestions-footer {
			padding: 12rpx 20rpx;
			background: linear-gradient(135deg, #f8f9fa, #e9ecef);
			border-top: 1rpx solid #e9ecef;

			.footer-text {
				font-size: 22rpx;
				color: #6c757d;
				text-align: center;
			}
		}
	}

	/* 搜索历史 */
	.search-history {
		margin-top: 24rpx;

		.history-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 16rpx;

			.history-title {
				display: flex;
				align-items: center;
				gap: 8rpx;
				color: #666666;
				font-size: 26rpx;
			}

			.clear-history {
				display: flex;
				align-items: center;
				gap: 6rpx;
				color: #999999;
				font-size: 22rpx;
				padding: 8rpx 16rpx;
				border-radius: 20rpx;
				background: rgba(153, 153, 153, 0.1);
				backdrop-filter: blur(10rpx);
				transition: all 0.3s ease;

				&:active {
					background: rgba(153, 153, 153, 0.2);
					transform: scale(0.95);
				}
			}
		}

		.history-content {
			width: 100%;

			.history-item {
				display: flex;
				align-items: center;
				padding: 16rpx 0;
				border-bottom: 1rpx solid rgba(153, 153, 153, 0.1);
				transition: all 0.3s ease;

				&:last-child {
					border-bottom: none;
				}

				&:active {
					background: rgba(153, 153, 153, 0.1);
					border-radius: 8rpx;
				}

				.history-icon {
					width: 36rpx;
					height: 36rpx;
					display: flex;
					align-items: center;
					justify-content: center;
					margin-right: 16rpx;
					background: rgba(153, 153, 153, 0.1);
					border-radius: 50%;

					.icon-emoji {
						font-size: 18rpx;
					}
				}

				.history-text {
					flex: 1;
					font-size: 26rpx;
					color: #333333;
					font-weight: 500;
				}

				.history-time {
					font-size: 22rpx;
					color: #999999;
					margin-right: 16rpx;
				}

				.history-delete {
					width: 32rpx;
					height: 32rpx;
					display: flex;
					align-items: center;
					justify-content: center;
					background: rgba(153, 153, 153, 0.1);
					border-radius: 50%;
					transition: all 0.3s ease;

					&:active {
						background: rgba(153, 153, 153, 0.2);
						transform: scale(0.9);
					}

					.icon-emoji {
						font-size: 16rpx;
					}
				}
			}
		}

		.history-empty {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			padding: 60rpx 0;

			.icon-emoji {
				font-size: 48rpx;
				opacity: 0.5;
			}

			.empty-text {
				margin-top: 16rpx;
				font-size: 26rpx;
				color: #999999;
			}
		}
	}

	/* 热门搜索标签 */
	.hot-search-tags {
		margin-top: 24rpx;
		background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f8faff 100%);
		border-radius: 20rpx;
		padding: 24rpx;
		border: 1rpx solid rgba(255, 255, 255, 0.8);
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
		backdrop-filter: blur(20rpx);
		position: relative;
		overflow: hidden;

		&::before {
			content: '';
			position: absolute;
			top: -2rpx;
			left: -2rpx;
			right: -2rpx;
			bottom: -2rpx;
			background: linear-gradient(135deg,
					rgba(64, 158, 255, 0.1) 0%,
					rgba(103, 194, 58, 0.1) 50%,
					rgba(255, 107, 53, 0.1) 100%);
			border-radius: 20rpx;
			z-index: -1;
		}

		.tags-header {
			display: flex;
			align-items: center;
			gap: 10rpx;
			margin-bottom: 20rpx;

			.tags-title {
				font-size: 26rpx;
				color: #1976d2;
				font-weight: 600;
			}
		}

		.tags-container {
			display: flex;
			flex-wrap: wrap;
			gap: 12rpx;

			.hot-tag {
				background: linear-gradient(135deg, #FFFFFF, #F8FAFC);
				border: 1rpx solid #E1E7EF;
				border-radius: 20rpx;
				padding: 8rpx 16rpx;
				transition: all 0.3s ease;
				cursor: pointer;
				position: relative;
				overflow: hidden;
				box-shadow: 0 2rpx 8rpx rgba(25, 118, 210, 0.1);

				&::before {
					content: '';
					position: absolute;
					top: 0;
					left: -100%;
					width: 100%;
					height: 100%;
					background: linear-gradient(90deg,
							transparent,
							rgba(64, 158, 255, 0.3),
							transparent);
					transition: left 0.6s ease;
				}

				&:hover::before {
					left: 100%;
				}

				&:active {
					background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
					transform: scale(0.95);
					box-shadow: 0 1rpx 4rpx rgba(25, 118, 210, 0.2);
				}

				.tag-content {
					display: flex;
					align-items: center;
					gap: 8rpx;
					position: relative;
					z-index: 1;

					.tag-text {
						font-size: 24rpx;
						color: #1565c0;
						font-weight: 500;
					}

					.tag-count {
						font-size: 20rpx;
						color: #2196f3;
						background: linear-gradient(135deg, #e3f2fd, #bbdefb);
						padding: 2rpx 8rpx;
						border-radius: 10rpx;
						min-width: 32rpx;
						text-align: center;
						font-weight: 600;
						box-shadow: inset 0 1rpx 2rpx rgba(33, 150, 243, 0.2);
					}
				}
			}
		}
	}

	/* 动画效果 */
	@keyframes floating {

		0%,
		100% {
			transform: rotate(0deg) translate(-50%, -50%);
		}

		50% {
			transform: rotate(180deg) translate(-50%, -50%);
		}
	}

	@keyframes shimmer {
		0% {
			background-position: -1000rpx 0;
		}

		100% {
			background-position: 1000rpx 0;
		}
	}

	/* === 车牌样式（参考owner-violation.vue并现代化改进） === */
	.plate-showcase {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: linear-gradient(135deg, #f8f9fa, #e9ecef);
		border-radius: 16rpx;
		padding: 24rpx;
		margin: 20rpx 0;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
		border: 1rpx solid #e9ecef;
		position: relative;
		overflow: hidden;

		&::before {
			content: '';
			position: absolute;
			top: 0;
			left: -100%;
			width: 100%;
			height: 100%;
			background: linear-gradient(90deg,
					transparent,
					rgba(255, 255, 255, 0.6),
					transparent);
			transition: left 0.6s ease;
		}

		&:hover::before {
			left: 100%;
		}
	}

	.plate-container {
		display: flex;
		flex-direction: column;
		gap: 12rpx;
		flex: 1;
	}

	.plate-number {
		display: inline-block;
		font-size: 26rpx;
		font-weight: 800;
		padding: 8rpx 12rpx;
		border-radius: 8rpx;
		font-family: "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif;
		letter-spacing: 0.8rpx;
		text-align: center;
		position: relative;
		overflow: hidden;
		transition: all 0.3s ease;
		white-space: nowrap;
		min-width: 120rpx;
		max-width: 180rpx;
		width: auto;



		&:hover {
			transform: translateY(-1rpx);
			box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.15);
		}

		&::before {
			content: '';
			position: absolute;
			top: 2rpx;
			left: 2rpx;
			right: 2rpx;
			height: 16rpx;
			background: linear-gradient(180deg,
					rgba(255, 255, 255, 0.5),
					rgba(255, 255, 255, 0.2));
			border-radius: 6rpx 6rpx 0 0;
			pointer-events: none;
			z-index: 1;
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

	.plate-type-indicator {
		display: flex;
		align-items: center;

		.plate-type-text {
			font-size: 22rpx;
			color: #909399;
			background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
			padding: 4rpx 12rpx;
			border-radius: 10rpx;
			font-weight: 500;
			box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
		}
	}

	.plate-actions {
		display: flex;
		flex-direction: column;
		gap: 8rpx;

		.copy-plate {
			display: flex;
			align-items: center;
			gap: 6rpx;
			padding: 12rpx 16rpx;
			background: linear-gradient(135deg, #e3f2fd, #bbdefb);
			border-radius: 20rpx;
			font-size: 22rpx;
			color: #409EFF;
			border: 1rpx solid rgba(64, 158, 255, 0.3);
			transition: all 0.3s ease;
			cursor: pointer;

			&:hover {
				background: linear-gradient(135deg, #bbdefb, #90caf9);
				transform: translateY(-1rpx);
				box-shadow: 0 4rpx 12rpx rgba(64, 158, 255, 0.3);
			}

			&:active {
				transform: translateY(0);
				box-shadow: 0 2rpx 6rpx rgba(64, 158, 255, 0.4);
			}

			text {
				font-weight: 600;
			}
		}
	}

	/* === 信息卡片重新设计 === */
	/* 联系人信息卡片 */
	.contact-info-card {
		background: linear-gradient(135deg, #f9fdfb, #f0fdf4);
		border-radius: 16rpx;
		padding: 20rpx;
		margin: 16rpx 0;
		border: 1rpx solid rgba(34, 197, 94, 0.1);
		box-shadow: 0 3rpx 12rpx rgba(34, 197, 94, 0.06);
		position: relative;
		overflow: hidden;



		.contact-header {
			display: flex;
			align-items: center;
			gap: 10rpx;
			margin-bottom: 16rpx;

			.contact-title {
				font-size: 26rpx;
				font-weight: 600;
				color: #166534;
			}
		}

		.contact-details {
			display: flex;
			flex-direction: column;
			gap: 12rpx;

			.contact-item {
				display: flex;
				justify-content: space-between;
				align-items: center;

				.contact-label {
					display: flex;
					align-items: center;
					gap: 8rpx;

					.label-text {
						font-size: 24rpx;
						color: #166534;
						font-weight: 500;
					}
				}

				.contact-value {
					font-size: 26rpx;
					color: #15803d;
					font-weight: 600;

					&.clickable {
						color: #2563eb;
						text-decoration: underline;
						cursor: pointer;

						&:active {
							opacity: 0.7;
						}
					}
				}
			}
		}
	}

	/* 地址信息卡片 */
	.address-info-card {
		background: linear-gradient(135deg, #fefcf3, #fef8e7);
		border-radius: 16rpx;
		padding: 20rpx;
		margin: 16rpx 0;
		border: 1rpx solid rgba(245, 158, 11, 0.1);
		box-shadow: 0 3rpx 12rpx rgba(245, 158, 11, 0.06);
		position: relative;
		overflow: hidden;



		.address-header {
			display: flex;
			align-items: center;
			gap: 10rpx;
			margin-bottom: 16rpx;

			.address-title {
				font-size: 26rpx;
				font-weight: 600;
				color: #92400e;
			}
		}

		.address-content {
			display: flex;
			justify-content: space-between;
			align-items: center;
			gap: 16rpx;

			.address-text {
				flex: 1;
				font-size: 26rpx;
				color: #a16207;
				font-weight: 500;
				line-height: 1.4;
			}

			.address-actions {
				display: flex;

				.address-action {
					display: flex;
					align-items: center;
					gap: 6rpx;
					padding: 8rpx 12rpx;
					background: rgba(255, 255, 255, 0.7);
					border-radius: 12rpx;
					font-size: 22rpx;
					color: #d97706;
					cursor: pointer;
					transition: all 0.3s ease;

					&:active {
						background: rgba(255, 255, 255, 0.9);
						transform: scale(0.95);
					}

					text {
						font-weight: 600;
					}
				}
			}
		}
	}

	/* 车辆状态卡片 */
	.vehicle-status-card {
		background: linear-gradient(135deg, #f8fbff, #f0f7ff);
		border-radius: 16rpx;
		padding: 20rpx;
		margin: 16rpx 0;
		border: 1rpx solid rgba(59, 130, 246, 0.1);
		box-shadow: 0 3rpx 12rpx rgba(59, 130, 246, 0.06);
		position: relative;
		overflow: hidden;



		.status-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 20rpx;

			.status-title {
				font-size: 26rpx;
				font-weight: 600;
				color: #1e40af;
				margin-left: 10rpx;
			}

			.status-badge {
				padding: 6rpx 16rpx;
				border-radius: 16rpx;
				font-size: 22rpx;
				font-weight: 600;

				.status-text {
					color: #ffffff;
				}

				&.status-entered {
					background: linear-gradient(135deg, #22c55e, #16a34a);
					box-shadow: 0 2rpx 8rpx rgba(34, 197, 94, 0.3);
				}

				&.status-exited {
					background: linear-gradient(135deg, #ef4444, #dc2626);
					box-shadow: 0 2rpx 8rpx rgba(239, 68, 68, 0.3);
				}

				&.status-pending {
					background: linear-gradient(135deg, #f59e0b, #d97706);
					box-shadow: 0 2rpx 8rpx rgba(245, 158, 11, 0.3);
				}
			}
		}

		.timeline-container {
			position: relative;
			padding-left: 32rpx;

			.timeline-item {
				position: relative;
				margin-bottom: 24rpx;

				&:last-child {
					margin-bottom: 0;
				}

				.timeline-dot {
					position: absolute;
					left: -38rpx;
					top: 6rpx;
					width: 12rpx;
					height: 12rpx;
					border-radius: 50%;
					border: 3rpx solid #ffffff;
					box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.2);

					&.entry-dot {
						background: #22c55e;
					}

					&.exit-dot {
						background: #ef4444;
					}
				}

				.timeline-content {
					.timeline-label {
						font-size: 22rpx;
						color: #64748b;
						margin-bottom: 4rpx;
					}

					.timeline-time {
						font-size: 26rpx;
						color: #1e293b;
						font-weight: 600;
					}
				}
			}

			.timeline-line {
				position: absolute;
				left: -33rpx;
				top: 20rpx;
				width: 2rpx;
				height: 40rpx;
				background: linear-gradient(180deg, #22c55e, #ef4444);
			}

			.duration-info {
				margin-top: 16rpx;
				padding-top: 16rpx;
				border-top: 1rpx solid rgba(59, 130, 246, 0.2);

				.duration-badge {
					display: flex;
					align-items: center;
					gap: 8rpx;
					background: rgba(255, 255, 255, 0.7);
					padding: 10rpx 16rpx;
					border-radius: 16rpx;

					.duration-text {
						font-size: 24rpx;
						color: #16a34a;
						font-weight: 600;
					}
				}
			}
		}
	}

	/* === 搜索结果信息样式 === */
	.search-result-info {
		background: linear-gradient(135deg, #ffffff 0%, #fcfcfd 100%);
		border-radius: 20rpx;
		padding: 20rpx;
		margin: 16rpx 0;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.03);
		border: 1rpx solid rgba(103, 194, 58, 0.05);
		flex-shrink: 0;

		.result-count {
			display: flex;
			align-items: center;
			gap: 8rpx;
			margin-bottom: 12rpx;

			.result-text {
				font-size: 26rpx;
				color: #606266;
			}

			.result-number {
				font-size: 32rpx;
				font-weight: bold;
				color: #409EFF;
			}

			.result-unit {
				font-size: 24rpx;
				color: #909399;
			}
		}

		.search-tags {
			display: flex;
			flex-wrap: wrap;
			gap: 12rpx;

			.search-tag {
				display: flex;
				align-items: center;
				gap: 8rpx;
				background: linear-gradient(135deg, #e3f2fd, #bbdefb);
				padding: 8rpx 16rpx;
				border-radius: 20rpx;
				border: 1rpx solid rgba(64, 158, 255, 0.3);

				.tag-label {
					font-size: 22rpx;
					color: #606266;
				}

				.tag-value {
					font-size: 24rpx;
					font-weight: 600;
					color: #409EFF;
				}
			}
		}
	}

	/* === 今日数据看板样式 === */
	.today-dashboard {
		background: linear-gradient(135deg, #ffffff 0%, #fcfcfd 100%);
		border-radius: 20rpx;
		margin: 16rpx 0;
		box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.04);
		border: 1rpx solid rgba(64, 158, 255, 0.05);
		overflow: hidden;
		flex-shrink: 0;

		.dashboard-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 24rpx;
			background: #f8f9fa;
			color: #333333;
			border-bottom: 1rpx solid #e9ecef;

			.dashboard-title {
				display: flex;
				align-items: center;
				gap: 12rpx;

				text {
					font-size: 32rpx;
					font-weight: bold;
					text-shadow: none;
				}
			}

			.dashboard-toggle {
				padding: 8rpx;
				border-radius: 50%;
				background: rgba(153, 153, 153, 0.1);
				transition: all 0.3s ease;

				&:active {
					background: rgba(153, 153, 153, 0.2);
					transform: scale(0.95);
				}
			}
		}

		.dashboard-content {
			padding: 24rpx;

			.section-title {
				font-size: 28rpx;
				font-weight: bold;
				color: #333333;
				margin-bottom: 16rpx;
				padding-bottom: 8rpx;
				border-bottom: 2rpx solid #f0f0f0;
			}
		}

		.stats-section {
			margin-bottom: 24rpx;

			.stats-grid {
				display: flex;
				justify-content: space-between;
				gap: 16rpx;

				.stat-item {
					flex: 1;
					background: linear-gradient(135deg, #f8f9fa, #e9ecef);
					border-radius: 12rpx;
					padding: 20rpx;
					text-align: center;
					box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
					border: 1rpx solid #dee2e6;
					position: relative;

					&.clickable-stat {
						cursor: pointer;
						transition: all 0.3s ease;
						border: 2rpx solid #dee2e6;
						overflow: hidden;

						&:hover {
							transform: translateY(-4rpx);
							box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
							border-color: #409EFF;
						}

						&:active {
							transform: translateY(-2rpx);
							box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.12);
						}

						&.active {
							background: linear-gradient(135deg, #409EFF, #67C23A);
							border-color: #409EFF;
							box-shadow: 0 8rpx 24rpx rgba(64, 158, 255, 0.4);
							transform: translateY(-4rpx);

							.stat-value {
								color: #ffffff;
							}

							.stat-label {
								color: #ffffff;
							}

							.stat-trend,
							.stat-urgent,
							.stat-vehicle {
								color: #ffffff;
							}

							.click-indicator {
								opacity: 0;
							}
						}

						.click-indicator {
							position: absolute;
							top: 8rpx;
							right: 8rpx;
							width: 24rpx;
							height: 24rpx;
							background: rgba(64, 158, 255, 0.2);
							border-radius: 50%;
							display: flex;
							align-items: center;
							justify-content: center;
							font-size: 12rpx;
							opacity: 0.7;
							transition: all 0.3s ease;

							.icon-emoji {
								font-size: 16rpx;
								animation: bounce 2s infinite;
							}
						}
					}

					.stat-value {
						display: block;
						font-size: 36rpx;
						font-weight: bold;
						color: #409EFF;
						margin-bottom: 8rpx;
						transition: color 0.3s ease;
					}

					.stat-label {
						display: block;
						font-size: 24rpx;
						color: #606266;
						margin-bottom: 6rpx;
						transition: color 0.3s ease;
					}

					.stat-trend {
						font-size: 22rpx;
						font-weight: bold;
						transition: color 0.3s ease;

						&.trend-up {
							color: #67C23A;
						}

						&.trend-down {
							color: #F56C6C;
						}

						&.trend-stable {
							color: #909399;
						}
					}

					.stat-urgent {
						font-size: 20rpx;
						color: #E6A23C;
						font-weight: 600;
						transition: color 0.3s ease;
					}

					.stat-vehicle {
						font-size: 20rpx;
						color: #409EFF;
						font-weight: 600;
						transition: color 0.3s ease;
					}
				}
			}
		}

		.efficiency-section {
			.efficiency-content {
				.progress-item {
					display: flex;
					align-items: center;
					gap: 16rpx;
					margin-bottom: 16rpx;

					.progress-label {
						font-size: 24rpx;
						color: #606266;
						white-space: nowrap;
					}

					.progress-bar {
						flex: 1;
						height: 12rpx;
						background: #f0f0f0;
						border-radius: 6rpx;
						overflow: hidden;

						.progress-fill {
							height: 100%;
							background: linear-gradient(90deg, #409EFF 0%, #67C23A 100%);
							border-radius: 6rpx;
							transition: width 0.8s ease;
						}
					}

					.progress-percent {
						font-size: 24rpx;
						font-weight: bold;
						color: #409EFF;
						white-space: nowrap;
					}
				}

				.efficiency-stats {
					display: flex;
					justify-content: space-between;
					gap: 16rpx;

					.efficiency-stat {
						flex: 1;
						font-size: 22rpx;
						color: #909399;
						background: #f8f9fa;
						padding: 12rpx;
						border-radius: 8rpx;
						text-align: center;
					}
				}
			}
		}
	}

	/* === 智能筛选器样式 === */
	.smart-filter {
		background: linear-gradient(135deg, #ffffff 0%, #fcfcfd 100%);
		border-radius: 20rpx;
		margin: 16rpx 0;
		box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.04);
		border: 1rpx solid rgba(245, 101, 101, 0.05);
		overflow: hidden;
		flex-shrink: 0;

		.filter-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 24rpx;
			background: #f8f9fa;
			color: #333333;
			border-bottom: 1rpx solid #e9ecef;

			.filter-title {
				display: flex;
				align-items: center;
				gap: 12rpx;

				text {
					font-size: 32rpx;
					font-weight: bold;
					text-shadow: none;
				}
			}

			.filter-toggle {
				padding: 8rpx;
				border-radius: 50%;
				background: rgba(153, 153, 153, 0.1);
				transition: all 0.3s ease;

				&:active {
					background: rgba(153, 153, 153, 0.2);
					transform: scale(0.95);
				}
			}
		}

		.filter-content {
			padding: 24rpx;

			.filter-section {
				margin-bottom: 28rpx;

				&:last-child {
					margin-bottom: 0;
				}

				.filter-section-title {
					font-size: 26rpx;
					font-weight: bold;
					color: #333333;
					margin-bottom: 16rpx;
					padding-bottom: 8rpx;
					border-bottom: 2rpx solid #f0f0f0;
				}
			}
		}

		.time-filter-tags,
		.status-filter-tags,
		.vehicle-filter-tags {
			display: flex;
			flex-wrap: wrap;
			gap: 12rpx;
		}

		.time-tag,
		.status-tag,
		.vehicle-tag {
			display: flex;
			align-items: center;
			gap: 8rpx;
			padding: 12rpx 20rpx;
			border-radius: 24rpx;
			border: 2rpx solid #e9ecef;
			background: #ffffff;
			transition: all 0.3s ease;
			cursor: pointer;

			&:hover {
				transform: translateY(-2rpx);
				box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
			}

			&:active {
				transform: translateY(0);
			}

			&.active {
				background: linear-gradient(135deg, #409EFF, #67C23A);
				border-color: #409EFF;
				color: #ffffff;
				box-shadow: 0 4rpx 16rpx rgba(64, 158, 255, 0.4);

				.tag-text,
				.tag-count {
					color: #ffffff;
				}
			}

			.tag-emoji {
				font-size: 26rpx;
			}

			.tag-text {
				font-size: 24rpx;
				font-weight: 600;
				color: #333333;
			}

			.tag-count {
				font-size: 20rpx;
				font-weight: bold;
				color: #409EFF;
				background: rgba(64, 158, 255, 0.1);
				padding: 4rpx 10rpx;
				border-radius: 12rpx;
				min-width: 24rpx;
				text-align: center;
			}
		}

		.filter-actions {
			display: flex;
			justify-content: space-between;
			gap: 16rpx;
			margin-top: 32rpx;
			padding-top: 24rpx;
			border-top: 2rpx solid #f0f0f0;

			.reset-filter,
			.apply-filter {
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 8rpx;
				padding: 16rpx 32rpx;
				border-radius: 24rpx;
				font-size: 26rpx;
				font-weight: bold;
				transition: all 0.3s ease;
				cursor: pointer;

				&:active {
					transform: scale(0.98);
				}
			}

			.reset-filter {
				background: #f8f9fa;
				border: 2rpx solid #dee2e6;
				color: #6c757d;

				&:hover {
					background: #e9ecef;
					border-color: #adb5bd;
				}
			}

			.apply-filter {
				background: linear-gradient(135deg, #409EFF, #67C23A);
				border: 2rpx solid #409EFF;
				color: #ffffff;
				box-shadow: 0 4rpx 16rpx rgba(64, 158, 255, 0.4);

				&:hover {
					background: linear-gradient(135deg, #337ecc, #5daf34);
					box-shadow: 0 6rpx 20rpx rgba(64, 158, 255, 0.6);
				}
			}
		}
	}

	/* === 搜索建议相关样式 === */
	.search-container {
		position: relative;
		overflow: visible;
		/* 重要：允许建议框显示 */
	}

	.search-input-container {
		position: relative;
		overflow: visible;
		/* 重要：允许建议框显示 */
	}

	/* 智能搜索容器 */
	.smart-search-container {
		position: relative;
		overflow: visible;
		/* 重要：允许建议框显示 */
	}

	.search-input-wrapper {
		position: relative;
		overflow: visible;
		/* 重要：允许建议框显示 */
	}

	.search-suggestions {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: #fff;
		border-radius: 12rpx;
		box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.12);
		z-index: 1000;
		margin-top: 8rpx;
		border: 1rpx solid #e8e8e8;
		overflow: hidden;

		.suggestions-scroll {
			max-height: 400rpx;
		}

		.suggestion-item {
			display: flex;
			align-items: center;
			padding: 20rpx;
			border-bottom: 1rpx solid #f0f0f0;
			cursor: pointer;
			transition: all 0.2s ease;
			-webkit-tap-highlight-color: rgba(64, 158, 255, 0.1);
			tap-highlight-color: rgba(64, 158, 255, 0.1);
			user-select: none;

			/* 确保点击区域足够大，便于滚动和点击 */
			min-height: 88rpx;
			position: relative;

			&:hover {
				background: linear-gradient(135deg, #f8fbff, #f0f7ff);
			}

			&:active {
				background: linear-gradient(135deg, #e3f2fd, #bbdefb);
				transform: scale(0.98);
			}

			&:last-child {
				border-bottom: none;
			}

			/* 增强触摸反馈 */
			&:focus {
				outline: none;
				background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
			}

			.suggestion-icon {
				width: 40rpx;
				height: 40rpx;
				border-radius: 8rpx;
				background: #f5f7fa;
				display: flex;
				align-items: center;
				justify-content: center;
				margin-right: 16rpx;

				.icon-emoji {
					font-size: 24rpx;
				}
			}

			.suggestion-content {
				flex: 1;

				.suggestion-text {
					font-size: 28rpx;
					color: #333;
					margin-bottom: 4rpx;
					display: block;
				}

				.suggestion-type {
					font-size: 22rpx;
					color: #999;
				}
			}

			.suggestion-arrow {
				color: #ccc;

				.icon-emoji {
					font-size: 20rpx;
				}
			}
		}

		.suggestions-footer {
			padding: 12rpx 20rpx;
			background: #f8f9fa;
			border-top: 1rpx solid #e8e8e8;

			.footer-text {
				font-size: 22rpx;
				color: #666;
			}
		}
	}

	.no-suggestions {
		padding: 20rpx;
		text-align: center;

		.no-suggestions-content {
			display: flex;
			align-items: center;
			justify-content: center;
			margin-bottom: 8rpx;

			.no-suggestions-text {
				font-size: 24rpx;
				color: #909399;
			}
		}

		.no-suggestions-tip {
			.tip-text {
				font-size: 20rpx;
				color: #c0c4cc;
			}
		}
	}

	/* === 动画效果 === */
	@keyframes bounce {

		0%,
		20%,
		50%,
		80%,
		100% {
			transform: translateY(0);
		}

		40% {
			transform: translateY(-6rpx);
		}

		60% {
			transform: translateY(-3rpx);
		}
	}

	/* === 键盘适配优化 === */
	/* 当键盘弹出时的特殊处理 */
	.search-suggestions.keyboard-active {
		position: fixed !important;
		top: auto !important;
		bottom: 20rpx;
		left: 20rpx;
		right: 20rpx;
		margin-top: 0;
		max-height: 30vh;
		z-index: 99999;
	}

	/* 小屏幕设备优化 */
	@media screen and (max-height: 667px) {
		.search-suggestions {
			max-height: 280rpx;
		}

		.search-suggestions .suggestions-scroll {
			max-height: 240rpx;
			/* 约显示3-4个建议项 */
		}
	}

	@media screen and (max-height: 568px) {
		.search-suggestions {
			max-height: 220rpx;
		}

		.search-suggestions .suggestions-scroll {
			max-height: 180rpx;
			/* 约显示2-3个建议项 */
		}
	}

	/* 为不同屏幕密度优化 */
	@media screen and (-webkit-device-pixel-ratio: 3) {
		.search-suggestions .suggestions-scroll {

			/* 高密度屏幕使用更精细的滚动条 */
			&::-webkit-scrollbar {
				width: 4rpx;
			}
		}
	}
</style>