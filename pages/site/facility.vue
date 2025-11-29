<template>
	<view class="facility-container">
		<!-- 自定义导航栏 -->
		<view class="custom-navbar">
			<view class="navbar-content">
				<!-- 左侧返回按钮 - 禁用状态 -->
				<view class="navbar-left">
					<view class="home-button disabled" @click="onDisabledClick">
						<u-icon name="home-fill" size="18" color="#cccccc"></u-icon>
					</view>
				</view>
				<!-- 中间标题 -->
				<view class="navbar-title">
					<text>审批管理</text>
				</view>
				<!-- 右侧搜索按钮 -->
				<view class="navbar-right">
					<view class="search-button" @click="search">
						<u-icon name="search" size="18" color="#ffffff"></u-icon>
					</view>
				</view>
			</view>
		</view>

		<view class="v1" @click="search">
			<image src="/static/搜索-removebg-preview.png" class="v-img1"></image>
			<view class="v-text1">审批查询</view>
			<view class="v-text1-small">管家审批利器</view>
			<view class="v-text1-small1">一键解锁车辆通行全动态</view>
		</view>
		<!-- 添加在列表上方或下方，根据合理位置 -->
		<view class="stats-container">
			<view class="stats-header">
				<view class="stats-title">
					<u-icon name="order" size="24" color="#0958d9" margin-right="10rpx"></u-icon>
					<text>待审批统计</text>
				</view>
				<!-- <u-tag text="本周" plain size="mini" type="primary"></u-tag> -->
			</view>

			<!-- 统计卡片加载状态 -->
			<view v-if="loading && !isRefreshing" class="stats-skeleton">
				<view class="loading-tip">
					<u-loading mode="circle" color="#3b82f6" size="24"></u-loading>
					<text class="loading-text">正在加载数据...</text>
				</view>
				<view class="skeleton-cards">
					<view class="skeleton-card" v-for="i in 4" :key="i">
						<view class="skeleton-label"></view>
						<view class="skeleton-value"></view>
						<view class="skeleton-indicator"></view>
					</view>
				</view>
			</view>

			<!-- 正常统计卡片 -->
			<view v-else class="stats-cards fade-in" :class="{ 'stats-highlight': statsHighlight }">
				<view class="stat-card total" @click="quickFilter('all')">
					<view class="stat-label">全部</view>
					<view class="stat-value">{{ totalStats.count }}</view>
					<view class="stat-indicator"></view>
				</view>

				<view class="stat-card today" @click="quickFilter('today')">
					<view class="stat-label">今日</view>
					<view class="stat-value">{{ totalStats.today }}</view>
					<view class="stat-percentage" v-if="totalStats.todayPercent">
						<text :class="totalStats.todayPercent > 0 ? 'percentage-up' : 'percentage-down'">
							{{ totalStats.todayPercent > 0 ? '+' : '' }}{{ totalStats.todayPercent }}%
						</text>
					</view>
					<view class="stat-indicator"></view>
				</view>

				<view class="stat-card yesterday" @click="quickFilter('yesterday')">
					<view class="stat-label">昨日</view>
					<view class="stat-value">{{ totalStats.yesterday }}</view>
					<view class="stat-indicator"></view>
				</view>

				<view class="stat-card three-days" @click="quickFilter('three_days')">
					<view class="stat-label">近三日</view>
					<view class="stat-value">{{ totalStats.threeDays }}</view>
					<view class="stat-indicator"></view>
				</view>
			</view>
		</view>
		<view class="audit-list">
			<!-- 搜索区域优化 -->
			<view class="filter-container">
				<view class="search-box">
					<!-- 简化排序按钮 -->
					<view class="sort-button" :class="{ active: sortConfig.desc }" @click="toggleSort">
						<view class="sort-icon-wrapper">
							<text class="sort-icon">{{ sortConfig.desc ? '⬇️' : '⬆️' }}</text>
						</view>
					</view>

					<!-- 现代化搜索框 -->
					<view class="modern-search-container">
						<view class="search-input-wrapper">
							<view class="search-icon">
								<text class="icon-emoji">🔍</text>
							</view>
							<input v-model="searchKey" placeholder="车牌号/手机号/住址/姓名" class="search-input"
								@input="onSearchInputChange" @focus="onSearchFocus" @blur="onSearchBlur" />
							<view v-if="searchKey" class="clear-button" @click="clearSearch">
								<text class="clear-emoji">❌</text>
							</view>
						</view>
					</view>
				</view>
				<!-- 实时搜索结果 -->
				<view class="search-results" v-if="showSearchResults && searchKey">
					<view v-if="isSearching" class="empty-result">
						<u-loading mode="circle" color="#3b82f6"></u-loading>
						<text>搜索中...</text>
					</view>
					<view v-else-if="searchResults.length === 0" class="empty-result">
						未找到匹配"{{ searchKey }}"的结果
					</view>
					<view v-else>
						<view class="search-result-item" v-for="(item, idx) in searchResults" :key="idx"
							@click="selectSearchResult(item)">
							<view style="display: flex; align-items: center;">
								<u-icon name="car" size="20" color="#60a5fa" margin-right="10rpx"></u-icon>
								<view class="plate-number search-plate"
									:class="isNewEnergyPlate(item.plateNumber) ? 'green-plate' : 'blue-plate'">
									{{ item.plateNumber }}
								</view>
							</view>
							<view style="font-size: 24rpx; color: #64748b; margin-top: 6rpx;">
								{{ item.name }} · {{ item.addressDetail }}
							</view>
						</view>
					</view>
				</view>
			</view>

			<!-- 列表加载状态 -->
			<view v-if="loading && !isRefreshing" class="list-skeleton">
				<view class="skeleton-item" v-for="i in 5" :key="i">
					<view class="skeleton-content">
						<view class="skeleton-plate"></view>
						<view class="skeleton-info">
							<view class="skeleton-line short"></view>
							<view class="skeleton-line long"></view>
							<view class="skeleton-line medium"></view>
						</view>
					</view>
				</view>
			</view>

			<!-- 空状态提示 -->
			<view v-else-if="!loading && filteredList.length === 0" class="empty-state">
				<view class="empty-icon">📋</view>
				<view class="empty-text">暂无待审核数据</view>
				<view class="empty-desc">当前筛选条件下没有找到相关数据</view>
			</view>

			<!-- 列表控制区域 -->
			<view class="list-control-header" v-if="!loading && filteredList.length > 0">
				<view class="list-title">
					<text class="icon-emoji" style="color: #409EFF; margin-right: 12rpx">📋</text>
					<text>待审核列表</text>
					<text class="list-count">({{ filteredList.length }}条)</text>
				</view>
				<view class="list-actions">
					<view class="action-btn" @click="expandAllItems">
						<text class="action-icon expand-all-icon">⬇️</text>
					</view>
					<view class="action-btn" @click="collapseAllItems">
						<text class="action-icon collapse-all-icon">⬆️</text>
					</view>
				</view>
			</view>

			<!-- 优化后的列表项 - 折叠样式 -->
			<u-swipe-action v-if="!loading && filteredList.length > 0" ref="uSwipeAction" class="fade-in">
				<u-swipe-action-item v-for="(item, index) in filteredList" :key="item.id" :options="options"
					:name="index" @click="handleAction">
					<u-card :border="false" margin="6rpx 0" :body-style="{ padding: '12rpx 16rpx' }"
						box-shadow="0 2rpx 8rpx rgba(0,0,0,0.06)"
						:custom-style="{ borderRadius: '12rpx', position: 'relative', overflow: 'hidden' }">
						<view class="card-body">
							<!-- 紧凑单行布局：车牌 + 业主信息 + 等待时间 + 操作按钮 -->
							<view class="compact-row">
								<!-- 车牌号码 -->
								<view class="plate-number-compact"
									:class="item.plateNumber && item.plateNumber.length === 8 ? 'green-plate' : 'blue-plate'">
									<text class="plate-text">{{ item.plateNumber || '未知车牌' }}</text>
								</view>

								<!-- 业主信息区域 -->
								<view class="owner-info-section">
									<view class="owner-info">
										<text class="owner-name">{{ item.name && item.name.trim() !== '' ? item.name : '未知业主' }}</text>
									</view>
								</view>

								<!-- 等待时间区域 -->
								<view class="waiting-info-section">
									<view class="waiting-status" :class="'urgency-' + getWaitingUrgencyLevel(item.recordTime)">
										<text class="waiting-text">{{ getWaitingDisplay(item.recordTime) }}</text>
									</view>
								</view>

								<!-- 操作按钮 -->
								<view class="actions-compact">
									<view class="copy-btn" @click="copyPlateNumber(item.plateNumber)">
										<text class="action-icon copy-icon">📋</text>
									</view>
									<view class="collapse-btn" @click="toggleItemCollapse(index)">
										<text class="action-icon expand-icon">{{ isItemCollapsed(index) ? '⬇️' : '⬆️' }}</text>
									</view>
								</view>
							</view>

							<!-- 详细信息区域 - 现代卡片网格布局 -->
							<view class="detail-info-section" v-if="!isItemCollapsed(index)">
								<!-- 第一行：三列网格（基本信息） -->
								<view class="info-grid-row">
									<!-- 联系人卡片 -->
									<view class="info-card contact-card">
										<text class="card-icon">👤</text>
										<text class="card-label">联系人</text>
										<text class="card-content"
											:class="{ 'no-data': !item.name || item.name.trim() === '' }">
											{{ item.name && item.name.trim() !== '' ? item.name : '暂无' }}
										</text>
									</view>

									<!-- 手机号卡片 -->
									<view class="info-card phone-card" @tap="makePhoneCall(item.phone)">
										<text class="card-icon">📱</text>
										<text class="card-label">手机号</text>
										<text class="card-content clickable">{{ formatPhoneNumber(item.phone) }}</text>
									</view>

									<!-- 地址卡片 -->
									<view class="info-card address-card">
										<text class="card-icon">📍</text>
										<text class="card-label">住址</text>
										<text class="card-content">{{ formatAddress(item) }}</text>
									</view>
								</view>

								<!-- 第二行：时间信息卡片（全宽） -->
								<view class="info-grid-row">
									<view class="info-card time-card full-width">
										<view class="time-card-header">
											<text class="card-icon large">⏰</text>
											<text class="card-label">预约时间</text>
										</view>
										<view class="time-content-row">
											<text class="card-content primary">{{ formatAppointmentTime(item.recordTime) }}</text>
											<text class="waiting-text-inline" v-if="item.recordTime">{{ getWaitingTime(item.recordTime) }}</text>
										</view>
									</view>
								</view>
							</view>
						</view>
					</u-card>
				</u-swipe-action-item>
			</u-swipe-action>

			<!-- 优化后的筛选弹窗 -->
			<u-popup :show="showFilter" mode="bottom" :round="16" :closeable="true" :safe-area-inset-bottom="true"
				@close="handlePopupClose">
				<view class="filter-panel">
					<!-- 标题区优化 -->
					<view class="panel-header">
						<text class="panel-title">车辆状态筛选</text>
					</view>
					<!-- 紧急程度筛选优化 -->
					<view class="filter-section">
						<view class="section-header">
							<u-icon name="error-circle" color="#2979ff" size="28" />
							<text class="section-title">选择车辆状态</text>
						</view>
						<u-radio-group v-model="selectedStatus" placement="row" :custom-style="{
							    display: 'flex',
							    flexDirection: 'row',
							    flexWrap: 'wrap',      
							    gap: '40rpx',        
							    padding: '20rpx 0'
							  }">
							<view class="radio-group">
								<u-radio placement="row" v-for="(item, idx) in urgencyOptions" :key="idx"
									:name="item.value" :label="item.label" icon-size="40" label-color="#606266"
									label-size="32rpx" shape="circle" :custom-style="{
				                    marginRight: '40rpx',
				                    marginBottom: '24rpx'
				                }">
								</u-radio>
							</view>
						</u-radio-group>
					</view>
					<!-- 操作按钮组 -->
					<view class="action-bar">
						<u-button type="primary" shape="circle" :custom-style="{
	          flex: 1,
	          height: '96rpx',
	          background: 'linear-gradient(45deg, #3f87f5, #2979ff)',
	          fontSize: '34rpx'
	        }" :disabled="!urgencyValue" @click="confirmFilter">
							立即筛选
						</u-button>
						<u-button type="default" shape="circle" :custom-style="{
	          flex: 1,
	          height: '96rpx',
	          marginLeft: '24rpx',
	          fontSize: '34rpx'
	        }" @click="resetFilter">
							重置条件
						</u-button>
					</view>
				</view>
			</u-popup>
		</view>

		<!-- 自定义TabBar -->
		<custom-tabbar :userRole="currentUserRole" @tabChange="onTabChange">
		</custom-tabbar>
	</view>
</template>

<script>
	import TimeUtils from '@/utils/timeUtils.js'
	import CustomTabbar from '@/components/custom-tabbar.vue'
	import {
		appointmentAPI,
		butlerAPI
	} from '@/config/api.js'

	export default {
		components: {
			CustomTabbar
		},
		data() {
			return {
				statusBarHeight: 0, // 状态栏高度
				currentUserRole: 'manager', // 默认管家角色
				originalList: [],
				radioGroupStyle: {
					display: 'flex',
					flexWrap: 'wrap',
					gap: '32rpx',
					padding: '24rpx'
				},
				radioItemStyle: {
					backgroundColor: '#f5f7fa',
					borderRadius: '16rpx',
					padding: '16rpx 24rpx'
				},
				selectedStatus: '',
				searchKey: '', // 搜索关键词
				searchResults: [], // 搜索结果
				showSearchResults: false, // 是否显示搜索结果
				activeTag: 'pending', // 当前选中的标签，默认为待审核
				isSearching: false, // 是否正在搜索中
				searchDebounceTimer: null, // 搜索防抖计时器
				quickTags: [{
						id: 'today',
						text: '今日',
						type: 'primary'
					},
					{
						id: 'yesterday',
						text: '昨日',
						type: ''
					},
					{
						id: 'three_days',
						text: '近三天',
						type: ''
					},
					{
						id: 'pending',
						text: '待审核',
						type: 'warning'
					},
					{
						id: 'all',
						text: '全部',
						type: 'error'
					}
				],
				urgencyOptions: [{
						label: '普通',
						value: '普通',
						checked: false
					},
					{
						label: '即将超时',
						value: '即将超时',
						checked: true
					}, {
						label: '今日新增',
						value: '今日新增',
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
						text: '通过',
						style: {
							backgroundColor: '#19be6b',
							borderRadius: '8rpx 0 0 8rpx',
							width: '120rpx',
							height: '100%',
							fontSize: '28rpx',
							fontWeight: 'bold'
						},
						type: 'approve' // 新增类型标识
					},
					{
						text: '驳回',
						style: {
							backgroundColor: '#ff7900',
							width: '120rpx',
							height: '100%',
							fontSize: '28rpx',
							fontWeight: 'bold',
							boxShadow: '0 4rpx 8rpx rgba(0, 0, 0, 0.1)',
							borderLeft: '2rpx solid #fff'
						},
						type: 'reject' // 新增类型标识
					}
				],
				hasClickedPending: false,
				pendingList: [],
				sortConfig: {
					field: 'time',
					desc: true
				},
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
				isSorting: false, // 添加排序状态标记
				totalStats: {
					count: 0,
					today: 0,
					yesterday: 0,
					threeDays: 0,
					pending: 0,
					todayPercent: 0
				},
				loading: false, // 加载状态
				butlerInfo: null, // 管家信息
				communityInfo: null, // 小区信息
				isRefreshing: false, // 是否正在刷新
				// 添加调试状态变量
				debug: {
					apiStatus: '未加载',
					lastError: '',
					responseType: '',
					dataCount: 0,
					isLoading: false,
					showTestButtons: false // 添加测试按钮显示状态
				},
				// 统计卡片高亮状态
				statsHighlight: false,
				// 折叠状态控制 - 每个预约项的折叠状态
				itemCollapseStates: {}, // 格式: { index: boolean }
			};
		},
		computed: {
			statusStyle() {
				return (status) => ({})
			},
			timeRangeLabel() {
				return this.sortedList.length ?
					`${this.sortedList[0].time.split(' ')[0]} ~ ${this.sortedList[this.sortedList.length-1].time.split(' ')[0]}` :
					'请选择'
			},
			filteredList() {
				let filteredData;

				if (!this.searchKey && !this.activeTag) {
					filteredData = this.pendingList;
				} else {
					// 根据搜索关键词和当前标签过滤
					filteredData = this.pendingList.filter(item => {
						let matchesSearch = true;
						let matchesTag = true;

						// 搜索关键词匹配
						if (this.searchKey) {
							const keyword = this.searchKey.toLowerCase();
							matchesSearch = item.plateNumber.toLowerCase().includes(keyword) ||
								item.phone.toLowerCase().includes(keyword) ||
								item.addressDetail.toLowerCase().includes(keyword) ||
								item.name.toLowerCase().includes(keyword);
						}

						// 标签匹配
						if (this.activeTag) {
							switch (this.activeTag) {
								case 'today':
									matchesTag = this.isToday(item.recordTime);
									break;
								case 'yesterday':
									matchesTag = this.isYesterday(item.recordTime);
									break;
								case 'three_days':
									matchesTag = this.isWithinDays(item.recordTime, 3);
									break;
								case 'pending':
									matchesTag = item.status === '待审批' || !item.status || item.status === '';
									break;
								case 'expiring':
									// 这里定义"即将超时"的逻辑，例如预约时间在24小时内
									const now = new Date();
									const appointmentTime = this.parseDate(item.time);
									if (appointmentTime) {
										const diffHours = (appointmentTime - now) / (1000 * 60 * 60);
										matchesTag = diffHours > 0 && diffHours <= 24;
									} else {
										matchesTag = false;
									}
									break;
								case 'all':
									matchesTag = true;
									break;
							}
						}

						return matchesSearch && matchesTag;
					});
				}

				// 根据当前排序配置进行排序
				return filteredData.sort((a, b) => {
					const timeA = this.getTimestamp(a.recordTime || a.time);
					const timeB = this.getTimestamp(b.recordTime || b.time);
					
					if (this.sortConfig.desc) {
						return timeB - timeA; // 倒序：新→旧
					} else {
						return timeA - timeB; // 正序：旧→新
					}
				});
			},
			highlightedResults() {
				if (!this.searchKey) return [];

				const keyword = this.searchKey.toLowerCase();
				return this.filteredList.map(item => {
					let plateHighlighted = item.plateNumber;
					if (item.plateNumber.toLowerCase().includes(keyword)) {
						const index = item.plateNumber.toLowerCase().indexOf(keyword);
						plateHighlighted = item.plateNumber.substring(0, index) +
							'<span class="highlight-text">' +
							item.plateNumber.substring(index, index + keyword.length) +
							'</span>' +
							item.plateNumber.substring(index + keyword.length);
					}

					return {
						...item,
						plateHighlighted
					};
				});
			}
		},
		filters: {
			timeFormat(val) {
				return val.replace(' ', '  ')
			}
		},
		onLoad() {
			// 获取状态栏高度
			this.getStatusBarHeight();
			
			// 立即设置加载状态，确保用户看到骨架屏
			this.loading = true;

			// 获取用户角色
			this.getUserRole();

			// 监听TabBar状态更新事件
			uni.$on('updateTabBarIndex', (index) => {
			});

			// 默认筛选待审核数据
			this.activeTag = 'pending';

			// 立即开始加载数据
			this.loadAppointmentData().then(() => {
				// 数据加载完成后应用待审核筛选
				this.quickFilter('pending');
			});
		},
		onShow() {
			// 页面显示时通知TabBar检查当前页面
			this.$nextTick(() => {
				// 根据角色动态计算审核页面的索引
				// 管家角色：预约(0) -> 预约查询(1) -> 违规车辆(2) -> 审核(3)
				// 其他角色可能没有审核页面
				const auditIndex = this.currentUserRole === 'manager' ? 3 : -1;
				if (auditIndex !== -1) {
					uni.$emit('updateTabBarIndex', auditIndex);
				}
			});

			// 确保每次显示页面时都应用待审核筛选
			if (!this.activeTag || this.activeTag !== 'pending') {
				this.quickFilter('pending');
			}
		},
		onUnload() {
			// 清理事件监听
			uni.$off('updateTabBarIndex');
		},
		mounted() {
			// 数据加载已在 onLoad 中处理，这里不需要重复加载
		},
		onPullDownRefresh() {
			// 下拉刷新
			this.refreshData();
		},
		methods: {
			// 获取状态栏高度
			getStatusBarHeight() {
				try {
					const systemInfo = uni.getSystemInfoSync();
					this.statusBarHeight = systemInfo.statusBarHeight || 20;
					// 设置CSS变量
					uni.setStorageSync('statusBarHeight', this.statusBarHeight);
					// 通过样式设置
					const style = document.createElement('style');
					style.innerHTML = `:root { --status-bar-height: ${this.statusBarHeight}px; }`;
					document.head.appendChild(style);
				} catch (e) {
					this.statusBarHeight = 20; // 默认值
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

			// 获取用户角色
			getUserRole() {
				try {
					const userInfo = uni.getStorageSync('userInfo');
					if (userInfo && userInfo.role) {
						this.currentUserRole = userInfo.role;
					}
				} catch (error) {
					// 获取用户角色失败
				}
			},

			// TabBar切换事件处理
			onTabChange(tabInfo) {
				// TabBar切换处理
			},

			// 更新时间数据
			updateTimes() {
				try {
					TimeUtils.reset();

					// 更新待处理列表时间
					const updatedList = this.pendingList.map((item, index) => ({
						...item,
						time: TimeUtils.getRecentTime(index % 5, 'YYYY-MM-DD HH:mm')
					}));

					// 按记录创建时间倒序排序（记录创建时间越晚的越靠前）
					this.pendingList = updatedList.sort((a, b) => {
						const timeA = this.getTimestamp(a.recordTime || a.time);
						const timeB = this.getTimestamp(b.recordTime || b.time);
						return timeB - timeA; // 倒序排序，时间越晚的越靠前
					});

					// 更新统计数据
					this.calculateStats();
				} catch (error) {
					// 更新设施管理时间失败
				}
			},
			async handleAction(e) {
				// uView的u-swipe-action-item组件事件参数结构：
				// e.index: 按钮索引 (0=通过, 1=驳回)
				// e.name: 列表项索引 (我们在模板中设置的:name="index")

				const listIndex = parseInt(e.name); // 列表项索引
				const buttonIndex = e.index; // 按钮索引

				// 确定操作类型和名称
				const actionType = buttonIndex === 0 ? 'approve' : 'reject';
				const actionName = buttonIndex === 0 ? '通过' : '驳回';

				const item = this.pendingList[listIndex];

				if (!item) {
					uni.showToast({
						title: '操作失败，请刷新页面重试',
						icon: 'none',
						duration: 2000
					});
					return;
				}

				try {
					// 定制不同操作的确认信息
					let confirmTitle, confirmContent, confirmColor;

					if (actionType === 'approve') {
						confirmTitle = '审核通过确认';
						confirmContent = `确定通过车牌号为【${item.plateNumber}】的申请吗？\n业主：${item.name}\n住址：${item.addressDetail}`;
						confirmColor = '#19be6b';
					} else if (actionType === 'reject') {
						confirmTitle = '驳回申请确认';
						confirmContent = `确定要驳回车牌号为【${item.plateNumber}】的申请吗？\n业主：${item.name}\n住址：${item.addressDetail}`;
						confirmColor = '#f56c6c';
					} else {
						// 添加默认情况处理
						confirmTitle = '操作确认';
						confirmContent = `确定要${actionName}车牌号为【${item.plateNumber}】的申请吗？`;
						confirmColor = '#909399';
					}

					// 显示确认对话框
					const {
						confirm
					} = await uni.showModal({
						title: confirmTitle,
						content: confirmContent,
						confirmText: actionType === 'approve' ? '确认通过' : '确认驳回',
						confirmColor: confirmColor,
						cancelColor: '#909399'
					})

					if (!confirm) {
						// 使用正确的ref关闭滑动面板
						this.$refs.uSwipeAction.closeOther(listIndex)
						return
					}

					// 显示加载中
					uni.showLoading({
						title: actionType === 'approve' ? '审核通过中...' : '申请驳回中...',
						mask: true
					})

					// 执行审核操作
					await this.submitAudit(item.id, actionType)

					// 隐藏加载提示
					uni.hideLoading()

					// 根据不同操作显示不同成功提示
					if (actionType === 'approve') {
						uni.showToast({
							title: `审核通过成功`,
							icon: 'success',
							duration: 2000
						})
					} else {
						uni.showToast({
							title: `申请已驳回`,
							icon: 'error',
							duration: 2000
						})
					}

					// 更新数据源 - 先标记状态变更，然后使用动画移除
					this.$set(this.pendingList[listIndex], 'statusChanged', true)
					this.$set(this.pendingList[listIndex], 'statusType', actionType)

					// 延迟移除，展示过渡动画，并重新计算统计数据
					setTimeout(async () => {
						// 从待审核列表中移除项目（但不从原始数据中删除，因为只是状态改变）
						this.pendingList.splice(listIndex, 1)

						// 重新计算统计数据（此时originalList中的状态已经更新）
						// 注意：全部数据数量不变，只是待审核数量减少
						this.calculateStats();

						// 可选：重新加载数据以确保数据同步（如果需要的话）
						// await this.loadAppointmentData();
					}, 600)

				} catch (error) {
					uni.hideLoading()

					// 显示详细的错误信息
					const errorMessage = error.message || error.msg || `${actionName}失败，请重试`;
					uni.showToast({
						title: errorMessage,
						icon: 'none',
						duration: 3000
					})
				} finally {
					// 确保滑动面板被关闭
					if (this.$refs.uSwipeAction && typeof this.$refs.uSwipeAction.closeOther === 'function') {
						this.$refs.uSwipeAction.closeOther(listIndex);
					}
				}
			},
			statusType(status) {
				const map = {
					'今日新增': 'success',
					'即将超时': 'warning'
				}
				return map[status] || 'info'
			},
			// 实时搜索处理
			handleSearchInput(e) {
				// 获取输入的值
				const val = e.detail.value || '';

				this.searchKey = val;

				if (!val.trim()) {
					// 搜索词为空时恢复当前筛选状态下的数据
					if (this.activeTag) {
						this.quickFilter(this.activeTag);
					} else {
						// 恢复原始列表并按记录创建时间倒序排序
						this.pendingList = [...this.originalList].sort((a, b) => {
							const timeA = this.getTimestamp(a.recordTime || a.time);
							const timeB = this.getTimestamp(b.recordTime || b.time);
							return timeB - timeA; // 倒序排序，时间越晚的越靠前
						});
					}
					return;
				}

				// 基于当前筛选状态的数据源进行搜索
				let baseList = this.activeTag ?
					this.getFilteredListByTag(this.activeTag) : [...this.originalList];

				// 根据输入实时筛选列表
				const keyword = val.toLowerCase();
				const filteredResults = baseList.filter(item =>
					(item.plateNumber && item.plateNumber.toLowerCase().includes(keyword)) ||
					(item.phone && item.phone.toLowerCase().includes(keyword)) ||
					(item.addressDetail && item.addressDetail.toLowerCase().includes(keyword)) ||
					(item.name && item.name.toLowerCase().includes(keyword))
				);

				// 对搜索结果应用当前排序设置
				this.pendingList = filteredResults.sort((a, b) => {
					const timeA = this.getTimestamp(a.recordTime || a.time);
					const timeB = this.getTimestamp(b.recordTime || b.time);

					if (this.sortConfig.desc) {
						return timeB - timeA; // 倒序：新→旧
					} else {
						return timeA - timeB; // 正序：旧→新
					}
				});
			},



			// 获取基于标签的过滤列表
			getFilteredListByTag(tagId) {
				const originalData = [...this.originalList];
				let filteredData;

				switch (tagId) {
					case 'today':
						filteredData = originalData.filter(item => this.isToday(item.recordTime));
						break;
					case 'yesterday':
						filteredData = originalData.filter(item => this.isYesterday(item.recordTime));
						break;
					case 'three_days':
						filteredData = originalData.filter(item =>
							this.isWithinDays(item.recordTime, 3) && !this.isToday(item.recordTime) && !this.isYesterday(item.recordTime)
						);
						break;
					case 'pending':
						filteredData = originalData.filter(item =>
							item.status === '待审核' || !item.status || item.status === ''
						);
						break;
					case 'all':
					default:
						filteredData = originalData;
						break;
				}

				// 应用当前排序设置
				return filteredData.sort((a, b) => {
					const timeA = this.getTimestamp(a.recordTime || a.time);
					const timeB = this.getTimestamp(b.recordTime || b.time);

					if (this.sortConfig.desc) {
						return timeB - timeA; // 倒序：新→旧
					} else {
						return timeA - timeB; // 正序：旧→新
					}
				});
			},

			// 标签筛选方法
			quickFilter(tagId) {
				// 清空搜索框
				this.searchKey = '';

				// 首先恢复原始数据
				const originalData = [...this.originalList];

				// 根据标签进行过滤
				let filteredData;
				switch (tagId) {
					case 'today':
						filteredData = originalData.filter(item => this.isToday(item.recordTime));
						break;

					case 'yesterday':
						filteredData = originalData.filter(item => this.isYesterday(item.recordTime));
						break;

					case 'three_days':
						filteredData = originalData.filter(item =>
							this.isWithinDays(item.recordTime, 3) && !this.isToday(item.recordTime) && !this.isYesterday(item.recordTime)
						);
						break;

					case 'pending':
						// 筛选待审核的数据 - 修复状态匹配逻辑，增加更多可能的状态字段名
						filteredData = originalData.filter(item => {
							// 检查各种可能的状态字段名
							const status = item.status || item.auditstatus || item.auditStatus || item.audit_status;
							// 检查是否是待审核状态（包括空值、未定义值、明确的'待审批'/'待审核'值）
							const isPending = !status ||
								status === '' ||
								status === '待审批' ||
								status === '待审核' ||
								status === 0 ||
								status === '0' ||
								status === null ||
								status === undefined;

							return isPending;
						});
						break;

					case 'expiring':
						// 这里"即将超时"定义为预约时间在当前时间的未来24小时内
						const now = new Date();
						filteredData = originalData.filter(item => {
							const appointmentTime = this.parseDate(item.time);
							if (!appointmentTime) return false;
							const diffHours = (appointmentTime - now) / (1000 * 60 * 60);
							return diffHours > 0 && diffHours <= 24;
						});
						break;

					case 'all':
					default:
						filteredData = originalData; // 显示全部数据
						break;
				}

				// 应用当前排序设置
				this.pendingList = filteredData.sort((a, b) => {
					const timeA = this.getTimestamp(a.recordTime || a.time);
					const timeB = this.getTimestamp(b.recordTime || b.time);

					if (this.sortConfig.desc) {
						return timeB - timeA; // 倒序：新→旧
					} else {
						return timeA - timeB; // 正序：旧→新
					}
				});
				
				// 强制更新视图
				this.$forceUpdate();

				// 提示筛选结果
				uni.showToast({
					title: `筛选结果: ${this.pendingList.length}条`,
					icon: 'none',
					duration: 1500
				});

				// 更新当前选中的标签
				this.activeTag = tagId;

				// 在筛选后更新统计信息
				this.$nextTick(() => {
					this.calculateStats();
				});
			},
			approve() {
				// 跳转到审批查询页面
				uni.navigateTo({
					url: "/pages/site/approve_transfer"
				})
			},
			search() {
				// 跳转到审批查询页面
				uni.navigateTo({
					url: "/pagesE/site/approve_search"
				})
			},
			confirmFilter() {
				this.$emit('filter', this.urgencyValue)
				// 根据所选择的内容进行筛选一下数据
				const filteredData = this.originalList.filter(item => {
					if (this.selectedStatus === "普通") {
						this.hasClickedPending = true;
						return item.status === '普通';
					} else if (this.selectedStatus === "即将超时") {
						this.hasClickedPending = true;
						return item.status === '即将超时';
					} else if (this.selectedStatus === "今日新增") {
						this.hasClickedPending = true;
						return item.status === '今日新增';
					} else if (this.selectedStatus == '') {
						this.hasClickedPending = true;
						return true;
					}
				});

				// 按记录创建时间倒序排序（记录创建时间越晚的越靠前）
				this.pendingList = filteredData.sort((a, b) => {
					const timeA = this.getTimestamp(a.recordTime || a.time);
					const timeB = this.getTimestamp(b.recordTime || b.time);
					return timeB - timeA; // 倒序排序，时间越晚的越靠前
				});

				this.showFilter = false
			},

			handlePopupClose() {
				this.showFilter = false
				// 关闭时恢复原始值
				this.urgencyValue = this.cachedValue
			},
			urgencyChange(values) {
				// 此处可进行筛选逻辑处理
			},
			openAction(index) {
				this.pendingList.forEach((item, i) => {
					item.showAction = i === index
				});
				this.$forceUpdate()
			},

			// 提交审核接口
			async submitAudit(id, type) {
				try {
					// 获取当前管家信息
					const userInfo = uni.getStorageSync('userInfo');
					const openid = userInfo?.openid || userInfo?.userInfo?.openid;
					const username = userInfo?.username || userInfo?.userInfo?.username || '管家';

					if (!openid) {
						throw new Error('未找到管家信息，请重新登录');
					}

					// 构建审核请求参数 - 使用与后端匹配的状态值
					const auditData = {
						id: id,
						auditopenid: openid,
						auditusername: username,
						auditdate: this.formatDateForBackend(new Date()),
						auditstatus: type === 'approve' ? '已通过' : '未通过',
						refusereason: type === 'reject' ? '不符合预约要求' : ''
					};

					// 调用审核API
					const { appointmentAPI } = require('@/config/api.js');
					const response = await appointmentAPI.audit(auditData);

					// 检查响应状态 - 修复响应状态判断逻辑
					if (response && (response.code === 0 || response.code === '0' || response.code === null || response.code === undefined)) {
						const newStatus = type === 'approve' ? '已通过' : '未通过';

						// 更新本地数据状态，确保UI立即反映变化
						const itemIndex = this.pendingList.findIndex(item => item.id === id);
						if (itemIndex !== -1) {
							this.$set(this.pendingList[itemIndex], 'status', newStatus);
							this.$set(this.pendingList[itemIndex], 'auditstatus', newStatus);
						}

						// 同时更新原始数据 - 这是关键，确保统计数据正确
						const originalIndex = this.originalList.findIndex(item => item.id === id);
						if (originalIndex !== -1) {
							this.$set(this.originalList[originalIndex], 'status', newStatus);
							this.$set(this.originalList[originalIndex], 'auditstatus', newStatus);
						}

						// 立即重新计算统计数据
						this.calculateStats();

						// 添加视觉反馈 - 短暂高亮统计卡片
						this.highlightStatsCard();

						return response;
					} else {
						throw new Error(response?.msg || response?.message || '审核操作失败');
					}
				} catch (error) {
					throw error;
				}
			},
			toggleSort() {
				// 切换排序方向
				this.sortConfig.desc = !this.sortConfig.desc;

				// 直接重新应用当前的筛选条件，这会触发filteredList计算属性重新计算
				if (this.activeTag) {
					this.quickFilter(this.activeTag);
				} else {
					// 如果没有激活的标签，则直接应用排序
					this.applySorting();
				}

				// 显示排序状态提示
				uni.showToast({
					title: this.sortConfig.desc ? '按预约时间倒序排序（新→旧）' : '按预约时间正序排序（旧→新）',
					icon: 'none',
					duration: 2000
				});
			},

			// 应用排序到当前列表
			applySorting() {
				if (this.pendingList.length === 0) {
					return;
				}

				// 创建新数组并排序，确保Vue能检测到变化
				const sortedList = [...this.pendingList].sort((a, b) => {
					const timeA = this.getTimestamp(a.recordTime || a.time);
					const timeB = this.getTimestamp(b.recordTime || b.time);

					if (this.sortConfig.desc) {
						return timeB - timeA; // 倒序：新→旧
					} else {
						return timeA - timeB; // 正序：旧→新
					}
				});

				// 重新赋值触发响应式更新
				this.pendingList = sortedList;

				// 强制更新视图
				this.$forceUpdate();
				
				// 延迟一下再次确认更新
				setTimeout(() => {
					this.$forceUpdate();
				}, 100);
			},
			sortedList() {
				// 克隆数组后再排序 - 默认按记录创建时间倒序排序（记录创建时间越晚的越靠前）
				const sortedArray = [...this.originalList].sort((a, b) => {
					const timeA = this.getTimestamp(a.recordTime || a.time);
					const timeB = this.getTimestamp(b.recordTime || b.time);
					// 固定为倒序排序，记录创建时间越晚的越靠前
					return timeB - timeA;
				});

				// 有序地更新列表
				this.pendingList = sortedArray;
			},
			confirmTime(time) {
				this.showTimePicker = false
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
					console.warn('日期解析失败:', dateString, error);
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
							let year, month, day, hour = 0, minute = 0, second = 0;
							
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
					console.warn('手动解析日期失败:', dateString, error);
					return null;
				}
			},

			// 安全获取时间戳的函数
			getTimestamp(dateString) {
				const date = this.parseDate(dateString);
				return date ? date.getTime() : 0;
			},

			isToday(dateString) {
				if (!dateString) return false;
				const today = new Date();
				const appointmentDate = this.parseDate(dateString);

				if (!appointmentDate) return false;

				const result = today.getFullYear() === appointmentDate.getFullYear() &&
					today.getMonth() === appointmentDate.getMonth() &&
					today.getDate() === appointmentDate.getDate();
				return result;
			},

			isYesterday(dateString) {
				if (!dateString) return false;
				const today = new Date();
				const yesterday = new Date(today);
				yesterday.setDate(yesterday.getDate() - 1);

				const appointmentDate = this.parseDate(dateString);
				if (!appointmentDate) return false;

				return yesterday.getFullYear() === appointmentDate.getFullYear() &&
					yesterday.getMonth() === appointmentDate.getMonth() &&
					yesterday.getDate() === appointmentDate.getDate();
			},

			isWithinDays(dateString, days) {
				if (!dateString) return false;
				const date = this.parseDate(dateString);
				if (!date) return false;

				const today = new Date();
				const diffTime = today.getTime() - date.getTime();
				const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

				// 确保不包括今天和昨天，且在指定天数范围内
				return diffDays > 1 && diffDays <= days;
			},
			getWaitingTime(timeStr) {
				if (!timeStr) return '';
				const appointmentTime = this.parseDate(timeStr);
				if (!appointmentTime) return '时间格式错误';

				const now = new Date();

				// 如果预约时间还未到，显示"即将到来"
				if (appointmentTime > now) {
					return "即将到来";
				}

				// 计算已等待时间
				const diffMs = now - appointmentTime;
				const diffMins = Math.floor(diffMs / 60000);
				const diffHours = Math.floor(diffMins / 60);

				if (diffHours > 0) {
					return `已等待${diffHours}小时${diffMins % 60}分钟`;
				} else {
					return `已等待${diffMins}分钟`;
				}
			},

			// 获取简短的时间状态文本
			getShortTimeStatus(timeStr) {
				if (!timeStr) return '';
				if (this.isToday(timeStr)) {
					return '今日';
				} else if (this.isYesterday(timeStr)) {
					return '昨日';
				} else if (this.isWithinDays(timeStr, 3)) {
					return '3天前';
				} else if (this.isWithinDays(timeStr, 7)) {
					return '本周';
				} else {
					return '较早';
				}
			},

			// 获取简短的等待时间文本
			getShortWaitingTime(timeStr) {
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

				if (diffHours > 0) {
					return `${diffHours}h${diffMins % 60}m`;
				} else {
					return `${diffMins}m`;
				}
			},

			// 格式化手机号显示
			formatPhoneNumber(phone) {
				if (!phone) return '暂无';
				// 完整显示手机号，不进行脱敏处理
				return phone;
			},

			// 格式化地址显示
			formatAddress(addressData) {
				// 如果传入的是字符串，直接返回
				if (typeof addressData === 'string') {
					if (!addressData) return '暂无';
					if (addressData.length <= 12) return addressData;
					return addressData.substring(0, 12) + '...';
				}

				// 如果传入的是对象，尝试拼接地址
				if (typeof addressData === 'object' && addressData) {
					// 首先检查是否有完整的地址字段
					if (addressData.addressDetail) return addressData.addressDetail;
					if (addressData.address) return addressData.address;
					if (addressData.address_detail) return addressData.address_detail;

					// 如果没有完整地址，尝试拼接各个部分
					let address = '';

					// 添加小区名称
					if (addressData.community) {
						address += addressData.community;
					}

					// 添加楼栋信息
					if (addressData.building || addressData.buildingNo || addressData.building_no) {
						const building = addressData.building || addressData.buildingNo || addressData.building_no;
						address += (address ? ' ' : '') + building + '栋';
					}

					// 添加单元信息
					if (addressData.units || addressData.unit) {
						const unit = addressData.units || addressData.unit;
						address += unit + '单元';
					}

					// 添加楼层
					if (addressData.floor) {
						address += addressData.floor + '层';
					}

					// 添加房间号
					if (addressData.room || addressData.roomNo || addressData.room_no) {
						const room = addressData.room || addressData.roomNo || addressData.room_no;
						address += room + '号';
					}

					return address.trim() || '暂无';
				}

				return '暂无';
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

			// 获取简短地址信息
			getShortAddress(address) {
				if (!address) return '未知地址';

				// 提取楼栋、单元和房间号信息，格式如：3栋2单元502
				const fullMatch = address.match(/(\d+)栋.*?(\d+)单元.*?(\d+)/);
				if (fullMatch) {
					return `${fullMatch[1]}栋${fullMatch[2]}单元${fullMatch[3]}`;
				}

				// 如果没有房间号，只提取楼栋和单元信息，格式如：3栋2单元
				const basicMatch = address.match(/(\d+)栋.*?(\d+)单元/);
				if (basicMatch) {
					return `${basicMatch[1]}栋${basicMatch[2]}单元`;
				}

				// 如果没有匹配到标准格式，截取前10个字符（增加长度以容纳房间号）
				if (address.length <= 10) return address;
				return address.substring(0, 10) + '...';
			},

			// 获取等待时长显示
			getWaitingDisplay(timeStr) {
				if (!timeStr) return '未知时间';

				const appointmentTime = this.parseDate(timeStr);
				if (!appointmentTime) return '时间错误';

				const now = new Date();

				// 如果预约时间还未到，显示"即将到来"
				if (appointmentTime > now) {
					const diffMs = appointmentTime - now;
					const diffMins = Math.floor(diffMs / 60000);
					const diffHours = Math.floor(diffMins / 60);

					if (diffHours > 0) {
						return `${diffHours}h后`;
					} else {
						return `${diffMins}m后`;
					}
				}

				// 计算已等待时间
				const diffMs = now - appointmentTime;
				const diffMins = Math.floor(diffMs / 60000);
				const diffHours = Math.floor(diffMins / 60);

				if (diffHours > 0) {
					return `等待${diffHours}h`;
				} else if (diffMins > 0) {
					return `等待${diffMins}m`;
				} else {
					return '刚到';
				}
			},

			// 获取等待时长的紧急程度等级
			getWaitingUrgencyLevel(timeStr) {
				if (!timeStr) return 'unknown';

				const appointmentTime = this.parseDate(timeStr);
				if (!appointmentTime) return 'unknown';

				const now = new Date();

				// 如果预约时间还未到
				if (appointmentTime > now) {
					return 'upcoming';
				}

				// 计算已等待时间
				const diffMs = now - appointmentTime;
				const diffMins = Math.floor(diffMs / 60000);
				const diffHours = Math.floor(diffMins / 60);

				if (diffMins < 5) {
					return 'just-arrived'; // 刚到
				} else if (diffMins < 30) {
					return 'normal'; // 正常等待
				} else if (diffMins < 120) { // 2小时内
					return 'warning'; // 需要注意
				} else if (diffMins < 300) { // 5小时内
					return 'urgent'; // 紧急
				} else {
					return 'critical'; // 非常紧急
				}
			},
			formatAppointmentTime(timeStr) {
				if (!timeStr) return '';
				const date = this.parseDate(timeStr);
				if (!date) return '时间格式错误';

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

				// 其他日期显示年月日和时间
				const year = date.getFullYear();
				const month = (date.getMonth() + 1).toString().padStart(2, '0');
				const day = date.getDate().toString().padStart(2, '0');
				const hours = date.getHours().toString().padStart(2, '0');
				const minutes = date.getMinutes().toString().padStart(2, '0');

				return `${year}-${month}-${day} ${hours}:${minutes}`;
			},
			// 格式化记录创建时间（右上角显示）
			formatRecordTime(timeStr) {
				if (!timeStr) return '';
				const date = this.parseDate(timeStr);
				if (!date) return '时间格式错误';

				if (this.isToday(timeStr)) {
					// 今日记录显示时分
					const hours = date.getHours().toString().padStart(2, '0');
					const minutes = date.getMinutes().toString().padStart(2, '0');
					return `今日${hours}:${minutes}`;
				} else if (this.isYesterday(timeStr)) {
					// 昨日记录
					const hours = date.getHours().toString().padStart(2, '0');
					const minutes = date.getMinutes().toString().padStart(2, '0');
					return `昨日${hours}:${minutes}`;
				}

				// 其他日期显示月日和时间
				const month = (date.getMonth() + 1).toString().padStart(2, '0');
				const day = date.getDate().toString().padStart(2, '0');
				const hours = date.getHours().toString().padStart(2, '0');
				const minutes = date.getMinutes().toString().padStart(2, '0');

				return `${month}-${day} ${hours}:${minutes}`;
			},
			handleSearchInput() {
				// 实时搜索逻辑已在watch中处理
			},
			resetFilter() {
				this.searchKey = '';
				this.activeTag = '';
				// 恢复原始列表并应用当前排序设置
				this.pendingList = [...this.originalList].sort((a, b) => {
					const timeA = this.getTimestamp(a.recordTime || a.time);
					const timeB = this.getTimestamp(b.recordTime || b.time);

					if (this.sortConfig.desc) {
						return timeB - timeA; // 倒序：新→旧
					} else {
						return timeA - timeB; // 正序：旧→新
					}
				});

				uni.showToast({
					title: '已重置筛选条件',
					icon: 'none',
					duration: 1500
				});
			},
			selectSearchResult(item) {
				this.showSearchResults = false;

				// 找到对应索引
				const index = this.pendingList.findIndex(i => i.id === item.id);
				if (index !== -1) {
					// 滚动到该项
					// 注意：这里需要DOM元素的ref，您可能需要添加ref到列表项
					this.$nextTick(() => {
						// 可以添加滚动逻辑，如果有需要
						// 例如使用uni.createSelectorQuery()等API
					});
				}
			},
			async handleActionWithOption(optionItem, optionIndex) {
				// 根据索引获取正确的按钮配置
				const selectedOption = this.options[optionIndex];

				if (!selectedOption) {
					return;
				}

				const actionType = selectedOption.type;
				const actionName = selectedOption.text;

				// 确保我们可以获取到必要的信息
				const index = this.pendingList.findIndex(item => item.id === optionItem.id);

				if (index === -1) {
					return;
				}

				const item = this.pendingList[index];

				try {
					// 定制不同操作的确认信息
					let confirmTitle, confirmContent, confirmColor;

					if (actionType === 'approve') {
						confirmTitle = '审核通过确认';
						confirmContent = `确定通过车牌号为【${item.plateNumber}】的申请吗？\n住址：${item.addressDetail}`;
						confirmColor = '#19be6b';
					} else if (actionType === 'reject') {
						confirmTitle = '驳回申请确认';
						confirmContent = `确定要驳回车牌号为【${item.plateNumber}】的申请吗？\n住址：${item.addressDetail}`;
						confirmColor = '#f56c6c';
					} else {
						// 添加默认情况处理
						confirmTitle = '操作确认';
						confirmContent = `确定要${actionName}车牌号为【${item.plateNumber}】的申请吗？`;
						confirmColor = '#909399';
					}

					// 其余处理逻辑保持不变
					const {
						confirm
					} = await uni.showModal({
						title: confirmTitle,
						content: confirmContent,
						confirmText: actionType === 'approve' ? '确认通过' : '确认驳回',
						confirmColor: confirmColor,
						cancelColor: '#909399'
					})

					if (!confirm) {
						// 使用正确的ref关闭滑动面板
						this.$refs.uSwipeAction.closeOther(index)
						return
					}

					// 显示加载中
					uni.showLoading({
						title: actionType === 'approve' ? '审核通过中...' : '申请驳回中...',
						mask: true
					})

					// 执行审核操作
					await this.submitAudit(item.id, actionType)

					// 隐藏加载提示
					uni.hideLoading()

					// 根据不同操作显示不同成功提示
					if (actionType === 'approve') {
						uni.showToast({
							title: `审核通过成功`,
							icon: 'success',
							duration: 2000
						})
					} else {
						uni.showToast({
							title: `申请已驳回`,
							icon: 'error',
							duration: 2000
						})
					}

					// 更新数据源 - 先标记状态变更，然后使用动画移除
					this.$set(this.pendingList[index], 'statusChanged', true)
					this.$set(this.pendingList[index], 'statusType', actionType)

					// 延迟移除，展示过渡动画
					setTimeout(() => {
						this.pendingList.splice(index, 1)
					}, 600)

				} catch (error) {
					uni.hideLoading()
					uni.showToast({
						title: `${actionName}失败，请重试`,
						icon: 'none',
						duration: 3000
					})
				} finally {
					if (this.$refs.uSwipeAction && typeof this.$refs.uSwipeAction.closeOther === 'function') {
						this.$refs.uSwipeAction.closeOther(index);
					}
				}
			},
			calculateStats() {
				const originalData = this.originalList;

				// 待审核数量 - 使用与筛选逻辑一致的判断条件
				const pendingItems = originalData.filter(item => {
					const status = item.status || item.auditstatus || item.auditStatus || item.audit_status;
					const isPending = !status ||
						status === '' ||
						status === '待审批' ||
						status === '待审核' ||
						status === 0 ||
						status === '0' ||
						status === null ||
						status === undefined;
					return isPending;
				});

				this.totalStats.pending = pendingItems.length;

				// 在设施管理页面，"全部"应该等于"待审核"，因为这个页面只显示待审核的数据
				this.totalStats.count = this.totalStats.pending;

				// 今日待审核数量
				this.totalStats.today = pendingItems.filter(item => this.isToday(item.recordTime)).length;

				// 昨日待审核数量
				this.totalStats.yesterday = pendingItems.filter(item => this.isYesterday(item.recordTime)).length;

				// 近三日待审核数量
				this.totalStats.threeDays = pendingItems.filter(item =>
					this.isWithinDays(item.recordTime, 3) && !this.isToday(item.recordTime) && !this.isYesterday(item.recordTime)
				).length;

				// 计算今日较昨日变化百分比
				if (this.totalStats.yesterday > 0) {
					this.totalStats.todayPercent = Math.round(
						((this.totalStats.today - this.totalStats.yesterday) / this.totalStats.yesterday) * 100
					);
				} else {
					this.totalStats.todayPercent = this.totalStats.today > 0 ? 100 : 0;
				}
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
			handleAudit(item) {
				// 这里可以添加审核逻辑
			},
			// 新增搜索框相关方法
			onSearchFocus() {
				// 搜索框获得焦点
			},
			onSearchBlur() {
				// 搜索框失去焦点
			},
			onSearchInputChange(e) {
				// 处理input事件，将其转换为与原来handleSearchInput兼容的格式
				const value = e.target.value || '';
				this.searchKey = value;
				this.handleSearchInput({
					detail: {
						value
					}
				});
			},
			clearSearch() {
				this.searchKey = '';
				this.handleSearchInput({
					detail: {
						value: ''
					}
				});
				uni.showToast({
					title: '已清空搜索',
					icon: 'none',
					duration: 1000
				});
			},
			// 判断是否是新能源车牌
			isNewEnergyPlate(plateNumber) {
				return plateNumber && plateNumber.length === 8;
			},
			// 添加获取管家小区预约数据的方法
			async loadAppointmentData() {
				try {
					this.loading = true;
					this.debug.isLoading = true;
					this.debug.apiStatus = '加载中';

					// 只在下拉刷新时显示 loading，初始加载使用骨架屏
					if (this.isRefreshing) {
						uni.showLoading({
							title: '刷新中...',
							mask: true
						});
					}

					// 1. 获取当前管家的 openid
					const userInfo = uni.getStorageSync('userInfo');
					const openid = userInfo?.openid || userInfo?.userInfo?.openid;

					if (!openid) {
						this.debug.apiStatus = '失败';
						this.debug.lastError = '未找到管家 openid，请重新登录';

						uni.showToast({
							title: '请重新登录',
							icon: 'none',
							duration: 2000
						});

						if (this.isRefreshing) {
							uni.hideLoading();
						}
						return;
					}

					// 2. 获取管家小区信息
					const communityInfo = await this.getManagerCommunityInfo(userInfo);

					// 3. 调用待审核预约数据接口
					let appointmentResponse;
					try {
						// 使用封装的 API 方法获取待审核数据
						appointmentResponse = await appointmentAPI.listAppointNoAudit({
							community: communityInfo?.community || '', // 根据管家小区过滤
							pageNum: 1,
							pageSize: 50
						});

						// 更新调试信息
						this.debug.responseType = typeof appointmentResponse === 'object' ?
							(Array.isArray(appointmentResponse) ? 'Array' : 'Object') : typeof appointmentResponse;

					} catch (error) {

						// 更新调试信息
						this.debug.apiStatus = '失败';
						this.debug.lastError = error.message || '未知错误';
						this.debug.dataCount = 0;

						uni.showToast({
							title: '获取预约数据失败，请重试',
							icon: 'none',
							duration: 2000
						});

						if (this.isRefreshing) {
							uni.hideLoading();
						}
						this.loading = false;
						this.debug.isLoading = false;
						return;
					}

					// 检查API响应结构
					if (!appointmentResponse) {
						// 更新调试信息
						this.debug.apiStatus = '失败';
						this.debug.lastError = '预约API响应为空';
						this.debug.dataCount = 0;

						uni.showToast({
							title: '暂无待审核数据',
							icon: 'none',
							duration: 2000
						});
						// 初始化为空数组
						this.pendingList = [];
						this.originalList = [];
						this.calculateStats();

						if (this.isRefreshing) {
							uni.hideLoading();
						}
						this.loading = false;
						this.debug.isLoading = false;
						return;
					}

					// 检查API响应数据，处理多种可能的数据结构
					let apiData;
					apiData = appointmentResponse.data.records;


					this.debug.dataCount = Array.isArray(apiData) ? apiData.length : 0;

					if (!Array.isArray(apiData) || apiData.length === 0) {
						// 更新调试信息
						this.debug.apiStatus = '无数据';
						this.debug.lastError = !Array.isArray(apiData) ? 'API返回数据不是数组' : '数组为空';

						uni.showToast({
							title: '暂无待审核数据',
							icon: 'none',
							duration: 2000
						});
						// 初始化为空数组
						this.pendingList = [];
						this.originalList = [];
						this.calculateStats();

						if (this.isRefreshing) {
							uni.hideLoading();
						}
						this.loading = false;
						this.debug.isLoading = false;
						return;
					}

					// 5. 格式化预约数据
					const formattedData = this.formatAppointmentData(apiData);

					if (formattedData.length === 0) {

						// 更新调试信息
						this.debug.apiStatus = '格式化失败';
						this.debug.lastError = '数据格式化后为空';

						uni.showToast({
							title: '暂无待审核数据',
							icon: 'none',
							duration: 2000
						});
						// 初始化为空数组
						this.pendingList = [];
						this.originalList = [];
						this.calculateStats();

						if (this.isRefreshing) {
							uni.hideLoading();
						}
						this.loading = false;
						this.debug.isLoading = false;
						return;
					}

					// 6. 更新数据并应用当前排序设置
					const sortedData = formattedData.sort((a, b) => {
						const timeA = this.getTimestamp(a.recordTime || a.time);
						const timeB = this.getTimestamp(b.recordTime || b.time);

						if (this.sortConfig.desc) {
							return timeB - timeA; // 倒序：新→旧
						} else {
							return timeA - timeB; // 正序：旧→新
						}
					});
					this.pendingList = sortedData;
					this.originalList = JSON.parse(JSON.stringify(sortedData));

					// 7. 更新统计数据
					this.calculateStats();

					// 更新调试信息
					this.debug.apiStatus = '成功';
					this.debug.lastError = '';
					this.debug.dataCount = formattedData.length;

					if (this.isRefreshing) {
						uni.hideLoading();
					}
				} catch (error) {
					// 更新调试信息
					this.debug.apiStatus = '失败';
					this.debug.lastError = error.message || '未知错误';
					this.debug.dataCount = 0;

					if (this.isRefreshing) {
						uni.hideLoading();
					}
					uni.showToast({
						title: '加载数据失败: ' + (error.message || '未知错误'),
						icon: 'none',
						duration: 3000
					});
					// 初始化为空数组
					this.pendingList = [];
					this.originalList = [];
					this.calculateStats();
				} finally {
					this.loading = false;
					this.debug.isLoading = false;
				}
			},

			// 格式化API返回的预约数据
			formatAppointmentData(apiData) {
				if (!Array.isArray(apiData)) {
					return [];
				}

				return apiData.map((item, index) => {
					console.log(`📋 [数据格式化] 处理第${index + 1}条数据:`, item);

					// 专门检查地址相关字段
					console.log(`📋 [数据格式化] 地址字段检查:`, {
						building: item.building,
						buildingNo: item.buildingNo,
						building_no: item.building_no,
						buildingnum: item.buildingnum,
						units: item.units,
						unit: item.unit,
						unitnum: item.unitnum,
						floor: item.floor,
						floornum: item.floornum,
						room: item.room,
						roomNo: item.roomNo,
						room_no: item.room_no,
						roomnum: item.roomnum,
						address: item.address,
						addressDetail: item.addressDetail,
						address_detail: item.address_detail,
						community: item.community
					});

					// 获取审核状态
					const auditStatus = item.auditstatus || item.auditStatus || item.audit_status || item.status || '待审核';

					// 构建预约数据对象，尝试多种可能的字段名
					const formattedItem = {
						id: item.id || item.appointmentId || item._id || '',
						time: item.visitdate || item.visitDate || item.appointmentDate || item.appointment_date || '', // 预约时间
						recordTime: item.recorddate || item.recordDate || item.createTime || item.createtime || '', // 记录创建时间
						name: item.visitorname || item.visitorName || item.ownername || item.ownerName || item
							.name || item.userName || item.owner || '未知业主',
						phone: item.visitorphone || item.visitorPhone || item.ownerphone || item.ownerPhone || item
							.phone || item.phoneNumber || item.mobile || '',
						plateNumber: item.platenumber || item.plateNumber || item.plate_number || item.carNumber ||
							item.carnumber || '',
						status: auditStatus,
						auditstatus: auditStatus, // 同时保存到auditstatus字段
						addressDetail: this.formatAddress(item), // 格式化地址
						description: item.visitreason || item.visitReason || item.reason || item.description ||
							'访客预约',
						showAction: false
					};

					console.log(`📋 [数据格式化] 格式化后数据:`, formattedItem);
					return formattedItem;
				});
			},

			// 格式化地址
			formatAddress(item) {

				// 首先检查是否有完整的地址字段
				if (item.addressDetail) {
					return item.addressDetail;
				}
				if (item.address) {
					return item.address;
				}
				if (item.address_detail) {
						return item.address_detail;
				}

				// 尝试拼接各个部分
				const parts = [];

				// 检查楼栋信息 - 支持更多字段名
				if (item.building || item.buildingNo || item.building_no || item.buildingnum) {
					const building = item.building || item.buildingNo || item.building_no || item.buildingnum;
					// 如果楼栋信息已经包含"栋"字，就不重复添加
					const buildingText = building.toString().includes('栋') ? building : building + '栋';
					parts.push(buildingText);
					
				}

				// 检查单元信息 - 支持更多字段名
				if (item.units || item.unit || item.unitnum) {
					const unit = item.units || item.unit || item.unitnum;
					// 如果单元信息已经包含"单元"字，就不重复添加
					const unitText = unit.toString().includes('单元') ? unit : unit + '单元';
					parts.push(unitText);
				}

				// 检查楼层信息
				if (item.floor || item.floornum) {
					const floor = item.floor || item.floornum;
					// 如果楼层信息已经包含"层"字，就不重复添加
					const floorText = floor.toString().includes('层') ? floor : floor + '层';
					parts.push(floorText);
				}

				// 检查房间信息 - 支持更多字段名
				if (item.room || item.roomNo || item.room_no || item.roomnum) {
					const room = item.room || item.roomNo || item.room_no || item.roomnum;
					// 如果房间信息已经包含"室"或"号"字，就不重复添加
					const roomText = (room.toString().includes('室') || room.toString().includes('号')) ? room : room + '室';
					parts.push(roomText);
				}


				// 如果有拼接的部分，就使用拼接结果；否则尝试使用社区名称或返回默认值
				let result;
				if (parts.length > 0) {
					result = parts.join('');  // 不用空格分隔，直接连接
				} else if (item.community) {
					result = item.community;
				} else {
					result = '未知地址';
				}
				return result;
			},
			// 获取管家小区信息
			async getManagerCommunityInfo(userInfo) {
				try {
					// 方案1: 从用户信息中获取小区信息
					if (userInfo?.parkName || userInfo?.userInfo?.parkName) {
						const community = userInfo.parkName || userInfo.userInfo.parkName;
						return {
							community
						};
					}

					// 方案2: 通过手机号查询管家信息
					const phone = userInfo?.phone || userInfo?.userInfo?.phone;
					if (phone) {
						const {
							butlerAPI
						} = require('@/config/api.js');
						const response = await butlerAPI.getByPhone(phone);

						if (response && response.data && response.code === '0') {
							const butlerInfo = response.data;
							return {
								community: butlerInfo.community,
								province: butlerInfo.province,
								city: butlerInfo.city,
								district: butlerInfo.district
							};
						}
					}

					return {
						community: '四季上东'
					};

				} catch (error) {
					return {
						community: '四季上东'
					};
				}
			},

			// 刷新数据
			async refreshData() {
				if (this.isRefreshing) return;

				this.isRefreshing = true;
				this.debug.isLoading = true;
				this.debug.apiStatus = '加载中';

				uni.showLoading({
					title: '刷新中...',
					mask: true
				});

				try {
					// 重新加载数据
					await this.loadAppointmentData();

					if (this.debug.apiStatus === '成功') {
						uni.showToast({
							title: '刷新成功',
							icon: 'success',
							duration: 1500
						});
					}
				} catch (error) {
					// 更新调试信息
					this.debug.apiStatus = '失败';
					this.debug.lastError = error.message || '刷新失败';

					uni.showToast({
						title: '刷新失败，请重试',
						icon: 'none',
						duration: 2000
					});
				} finally {
					this.isRefreshing = false;
					uni.hideLoading();
					// 停止下拉刷新
					uni.stopPullDownRefresh();
				}
			},

			// 切换测试模式
			toggleTestMode() {
				this.debug.showTestButtons = !this.debug.showTestButtons;
			},

			// 测试通过第一项
			async testApproveFirst() {
				if (this.pendingList.length === 0) {
					uni.showToast({
						title: '没有可测试的数据',
						icon: 'none',
						duration: 2000
					});
					return;
				}

				const mockEvent = {
					index: 0, // 按钮索引：0表示通过
					name: '0' // 列表项索引：第一项
				};
				await this.handleAction(mockEvent);
			},

			// 测试驳回第一项
			async testRejectFirst() {
				if (this.pendingList.length === 0) {
					uni.showToast({
						title: '没有可测试的数据',
						icon: 'none',
						duration: 2000
					});
					return;
				}

				const mockEvent = {
					index: 1, // 按钮索引：1表示驳回
					name: '0' // 列表项索引：第一项
				};
				await this.handleAction(mockEvent);
			},

			// 格式化日期为后端LocalDateTime兼容的格式
			formatDateForBackend(date) {
				if (!date) date = new Date();

				// 格式化为 yyyy-MM-ddTHH:mm:ss 格式（不包含时区信息和毫秒）
				// 这个格式与Java LocalDateTime.parse()方法兼容
				const year = date.getFullYear();
				const month = String(date.getMonth() + 1).padStart(2, '0');
				const day = String(date.getDate()).padStart(2, '0');
				const hours = String(date.getHours()).padStart(2, '0');
				const minutes = String(date.getMinutes()).padStart(2, '0');
				const seconds = String(date.getSeconds()).padStart(2, '0');

				// 使用标准的ISO格式：yyyy-MM-ddTHH:mm:ss
				// 这种格式在所有平台上都能正确解析
				const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
				return formattedDate;
			},

			// 高亮统计卡片以显示数据变化
			highlightStatsCard() {
				// 添加一个临时的高亮效果
				this.statsHighlight = true;
				setTimeout(() => {
					this.statsHighlight = false;
				}, 1000);
			},

			// 测试统计高亮效果
			testStatsHighlight() {
				this.highlightStatsCard();
				uni.showToast({
					title: '统计高亮测试',
					icon: 'success',
					duration: 1500
				});
			},

			// 手动刷新统计数据
			manualRefreshStats() {

				this.calculateStats();
				this.highlightStatsCard();

				uni.showToast({
					title: '统计数据已刷新',
					icon: 'success',
					duration: 1500
				});
			},

			// 验证统计逻辑
			validateStatsLogic() {

				// 验证"全部"是否等于"待审核"
				const isValid = this.totalStats.count === this.totalStats.pending;

				if (isValid) {
					uni.showToast({
						title: '统计逻辑正确',
						icon: 'success',
						duration: 1500
					});
				} else {
					uni.showToast({
						title: '统计逻辑错误',
						icon: 'error',
						duration: 1500
					});
				}
			},

			// === 折叠相关方法 ===
			// 判断项目是否折叠
			isItemCollapsed(index) {
				return this.itemCollapseStates[index] !== false; // 默认折叠
			},

			// 切换项目折叠状态
			toggleItemCollapse(index) {
				this.$set(this.itemCollapseStates, index, !this.isItemCollapsed(index));
			},

			// 展开所有项目
			expandAllItems() {
				this.filteredList.forEach((item, index) => {
					this.$set(this.itemCollapseStates, index, false);
				});
				uni.showToast({
					title: '已全部展开',
					icon: 'none',
					duration: 1000
				});
			},

			// 收起所有项目
			collapseAllItems() {
				this.filteredList.forEach((item, index) => {
					this.$set(this.itemCollapseStates, index, true);
				});
				uni.showToast({
					title: '已全部收起',
					icon: 'none',
					duration: 1000
				});
			},

			// 复制车牌号
			copyPlateNumber(plateNumber) {
				if (!plateNumber) {
					uni.showToast({
						title: '车牌号为空',
						icon: 'none',
						duration: 1500
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
							icon: 'none',
							duration: 1500
						});
					}
				});
			},

			// 获取时间状态文本
			getTimeStatusText(time) {
				if (this.isToday(time)) {
					return '今日';
				} else if (this.isYesterday(time)) {
					return '昨日';
				} else if (this.isWithinDays(time, 3)) {
					return '近3天';
				} else if (this.isWithinDays(time, 5)) {
					return '近5天';
				} else if (this.isWithinDays(time, 7)) {
					return '近7天';
				}
				return '更早';
			},

			// 获取状态类型
			statusType(status) {
				const statusMap = {
					'已通过': 'success',
					'待审核': 'warning',
					'待审批': 'warning',
					'未通过': 'error',
					'已拒绝': 'error'
				};
				return statusMap[status] || 'info';
			},
		}
	};
</script>

<style lang="scss" scoped>
	/* 搜索区域整体优化 */
	.filter-container {
		display: flex;
		flex-direction: column;
		padding: 16rpx 16rpx;
		background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
		border-radius: 20rpx;
		box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
		margin: 4rpx 8rpx 8rpx 8rpx;
		border: 1rpx solid #e8edf3;
		position: relative;
		overflow: hidden;
	}

	.filter-container::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2rpx;
		background: linear-gradient(90deg, #60a5fa 0%, #3b82f6 100%);
		opacity: 0.8;
	}

	/* 现代化搜索框组合布局 */
	.search-box {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 20rpx;
		position: relative;
	}

	/* 现代化排序按钮 */
	.sort-button {
		width: 80rpx;
		height: 84rpx;
		border-radius: 20rpx;
		box-shadow: 0 6rpx 20rpx rgba(96, 165, 250, 0.25);
		position: relative;
		overflow: hidden;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		flex-shrink: 0;
	}

	.sort-button::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%);
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.sort-button:hover::before {
		opacity: 1;
	}

	.sort-button.active {
		// background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
		transform: scale(1.05);
		box-shadow: 0 8rpx 25rpx rgba(59, 130, 246, 0.35);
	}

	.sort-icon-wrapper {
		position: relative;
		z-index: 2;
	}

	.sort-icon {
		transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
	}

	.sort-icon.flipped {
		transform: rotate(180deg);
	}

	.sort-emoji {
		font-size: 32rpx;
		line-height: 1;
	}

	.sort-tooltip {
		margin-top: 4rpx;
		z-index: 2;
	}

	.tooltip-text {
		font-size: 22rpx;
		color: rgba(255, 255, 255, 0.9);
		font-weight: 500;
		letter-spacing: 0.5rpx;
		text-align: center;
		white-space: nowrap;
	}

	/* 现代化搜索容器 */
	.modern-search-container {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 16rpx;
		height: 84rpx;
		min-width: 0;
	}

	.search-input-wrapper {
		flex: 1;
		height: 100%;
		background: #ffffff;
		border: 2rpx solid #e2e8f0;
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		padding: 0 18rpx;
		position: relative;
		transition: all 0.3s ease;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
		min-height: 84rpx;
		min-width: 0;
		max-width: none;
	}

	.search-input-wrapper:focus-within {
		border-color: #60a5fa;
		box-shadow: 0 0 0 4rpx rgba(96, 165, 250, 0.1);
		background: #fafbff;
	}

	.search-icon {
		margin-right: 12rpx;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.icon-emoji {
		font-size: 28rpx;
		line-height: 1;
		opacity: 0.6;
		transition: opacity 0.3s ease;
	}

	.search-input-wrapper:focus-within .icon-emoji {
		opacity: 1;
	}

	.search-input {
		flex: 1;
		height: 60rpx;
		border: none;
		outline: none;
		font-size: 28rpx;
		color: #1e293b;
		background: transparent;
		line-height: 60rpx;
		padding: 0 8rpx;
		vertical-align: middle;
	}

	.search-input::placeholder {
		color: #94a3b8;
		font-size: 26rpx;
		line-height: 60rpx;
	}

	.clear-button {
		margin-left: 8rpx;
		padding: 6rpx;
		border-radius: 50%;
		transition: all 0.2s ease;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.clear-button:hover {
		background: rgba(148, 163, 184, 0.1);
	}

	.clear-emoji {
		font-size: 20rpx;
		line-height: 1;
		opacity: 0.6;
	}



	/* 移除了旧的搜索框样式，已被新的现代化样式替代 */

	/* 添加可选的快捷筛选标签区域 */
	.quick-filter {
		display: flex;
		flex-wrap: wrap;
		gap: 12rpx;
		margin-top: 12rpx;
		padding-top: 12rpx;
		border-top: 1rpx dashed #e5e7eb;
	}

	/* 美化标签样式 */
	/deep/ .quick-filter .u-tag {
		border-radius: 24rpx !important;
		padding: 6rpx 20rpx !important;
		background: #f3f4f6 !important;
		border: 1rpx solid #e5e7eb !important;
		color: #4b5563 !important;
		font-size: 24rpx !important;
		transition: all 0.2s;
	}

	/deep/ .quick-filter .u-tag.u-tag--primary {
		background: #eff6ff !important;
		border: 1rpx solid #dbeafe !important;
		color: #3b82f6 !important;
	}

	/deep/ .quick-filter .u-tag.u-tag--warning {
		background: #fff7ed !important;
		border: 1rpx solid #ffedd5 !important;
		color: #f97316 !important;
	}

	/deep/ .quick-filter .u-tag.u-tag--error {
		background: #fef2f2 !important;
		border: 1rpx solid #fee2e2 !important;
		color: #ef4444 !important;
	}

	/deep/ .quick-filter .u-tag:active {
		transform: scale(0.95);
		opacity: 0.9;
	}

	/* 卡片列表紧凑化 */
	.audit-list {
		margin-top: -32rpx;
		padding: 8rpx;
		min-height: 200rpx;
		/* 根据实际内容调整一个合适的最小高度 */
		position: relative;
	}

	.list-item {
		margin-bottom: 4rpx !important;
	}

	/* 车牌突出样式优化 */
	.highlight-plate {
		padding: 12rpx 16rpx;
		margin: 0 0 16rpx 0;
		/* 调整上下间距 */
		background: linear-gradient(to right, #f0f4ff, #e4ebff);
		border-radius: 8rpx;
		position: relative;
		/* 确保定位正确 */
		z-index: 1;
		/* 防止被其他元素覆盖 */
		margin-top: 40rpx;
		/* 为徽章留出空间 */
	}

	/* 卡片内容间距调整 */
	.card-content {
		padding: 20rpx !important;
	}

	.card-content .info-row {
		padding: 8rpx 0 !important;
		margin-bottom: 4rpx;
	}

	.card-content .address-row {
		padding: 10rpx !important;
		margin-top: 6rpx !important;
	}

	.time-info {
		margin-top: 16rpx !important;
		padding-top: 12rpx !important;
	}

	/* 卡片交互优化 */
	.card-container {
		transition: all 0.2s ease;
		transform: translateZ(0);
		backface-visibility: hidden;
		will-change: transform;
	}

	.card-container:active {
		transform: scale(0.98);
	}

	/* 卡片容器 */
	.card-container {
		position: relative;
		margin: 4rpx 14rpx;
		border-radius: 16rpx;
		box-shadow: 0 8rpx 40rpx rgba(0, 0, 0, 0.12);
		overflow: hidden;
		background: #fff;
	}

	/* 背景层立体效果 */
	.card-background {
		position: absolute;
		width: 100%;
		height: 100%;

		.convex-effect {
			height: 60%;
			background: linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 100%);
		}

		.concave-effect {
			height: 40%;
			background: linear-gradient(0deg, rgba(0, 0, 0, 0.03) 0%, rgba(0, 0, 0, 0) 100%);
		}
	}

	/* 内容区 */
	.card-content {
		position: relative;
		z-index: 1;
		padding: 32rpx;

		.card-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 40rpx;
			padding-bottom: 24rpx;
			border-bottom: 2rpx solid #f5f7fa;
		}

		.info-row {
			display: flex;
			align-items: center;
			padding: 16rpx 0;

			/* 行间分隔线 */
			&:not(:last-child) {
				border-bottom: 1rpx solid #f0f2f5;
			}
		}

		.address-row {
			background: rgba(245, 247, 250, 0.6);
			border-radius: 8rpx;
			padding: 16rpx;
		}

		.time-info {
			margin-top: 32rpx;
			padding-top: 24rpx;
			border-top: 1rpx dashed #e0e3e6;
		}
	}

	.time-info {
		position: relative;

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

		.record-time {
			position: absolute;
			top: -40rpx;
			right: 0;
			background: #4CAF50;
			color: white;
			padding: 4rpx 12rpx;
			border-radius: 12rpx;
			font-size: 22rpx;
			font-weight: 500;
			z-index: 10;
		}
	}

	.list-item {
		margin: 8rpx 0;
		background: #fff;
		border-radius: 16rpx;
		overflow: hidden;
		position: relative;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);

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
		margin-top: 10rpx;
	}

	/* 全局卡片样式调整 */
	.data-list {
		background-color: #f5f5f5;
		/* 全局背景色设置（需在App.vue同步配置）[[0]](#__0) [[7]](#__7) */
		padding: 20rpx;
	}

	.card-header {
		margin-top: 5px;
		margin-left: 280px;
		display: flex;
		justify-content: space-between;
		align-items: center;
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

	/* 车牌样式 */
	.vehicle-row {
		margin-bottom: 8px;
	}

	.plate-number {
		display: inline-block;
		font-size: 34rpx;
		font-weight: bold;
		padding: 10rpx 28rpx;
		border-radius: 10rpx;
		font-family: "微软雅黑";
		letter-spacing: 2rpx;
		min-width: 200rpx;
		text-align: center;
		margin: 0 20rpx 0 10rpx;
		word-wrap: break-word;
		word-break: break-all;
		white-space: normal;
		line-height: 1.3;

		&.blue-plate {
			background: linear-gradient(180deg, #0C4FC5 0%, #216FEF 100%);
			color: #FFFFFF;
			border: 1px solid #0C4FC5;
		}

		&.green-plate {
			background: linear-gradient(180deg, #6AD390 0%, #D0F1E4 100%);
			color: #000000;
			border: 1px solid #6AD390;
		}

		&.search-plate {
			font-size: 28rpx;
			padding: 8rpx 18rpx;
			min-width: 160rpx;
			margin: 0 10rpx 0 0;
			word-wrap: break-word;
			word-break: break-all;
			white-space: normal;
			line-height: 1.3;
		}
	}

	/* 地址样式 */
	.address-row {
		display: flex;
		align-items: center;
		margin-bottom: 12rpx;
	}

	.address {
		font-size: 14px;
		color: #606266;
		margin-left: 6rpx;
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

	.card-item {
		display: flex;
		align-items: center;
		padding: 24rpx 32rpx;
		margin: 0 24rpx 20rpx;
		background: #fff;
		border-radius: 16rpx;
		box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.04);

		.card-content {
			flex: 1;

			.card-header {
				display: flex;
				align-items: center;
				margin-bottom: 16rpx;

				.applicant {
					font-size: 30rpx;
					color: #1d2129;
					font-weight: 500;
					margin-right: 20rpx;
				}
			}

			.time {
				display: block;
				font-size: 24rpx;
				color: #86909c;
				margin-bottom: 12rpx;
			}

			.desc {
				font-size: 26rpx;
				color: #4e5969;
				line-height: 1.5;
				display: -webkit-box;
				-webkit-box-orient: vertical;
				-webkit-line-clamp: 2;
				overflow: hidden;
			}
		}
	}

	/* 自定义单选按钮容器 */
	.radio-indicator {
		width: 40rpx;
		height: 40rpx;
		border: 2rpx solid #dcdfe6;
		border-radius: 50%;
		position: relative;
		transition: all 0.3s ease;
	}

	/* 选中态外框样式 */
	.u-radio--checked .radio-indicator {
		border-color: #2979ff;
		background: rgba(41, 121, 255, 0.1);
	}

	/* 内圆点动画 */
	.inner-dot {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 0;
		height: 0;
		border-radius: 50%;
		background: #2979ff;
		transition: all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
	}

	.inner-dot.active {
		width: 24rpx;
		height: 24rpx;
	}

	/* 增加点击反馈 */
	.u-radio:active .radio-indicator {
		transform: scale(0.9);
	}

	/* 弹窗优化 [[1]](#__1) */
	.filter-panel {
		padding: 40rpx 32rpx;
		background: #fff;
		min-height: 60vh;

		.panel-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 40rpx;

			.panel-title {
				font-size: 40rpx;
				color: #1d2129;
				font-weight: 600;
			}
		}

		.section-header {
			display: flex;
			align-items: center;
			margin-bottom: 32rpx;

			.section-title {
				font-size: 34rpx;
				color: #1d2129;
				margin-left: 16rpx;
			}
		}

		.action-bar {
			display: flex;
			margin-top: 60rpx;
			padding: 0 20rpx;
		}
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

				.home-button {
					width: 64rpx;
					height: 64rpx;
					display: flex;
					align-items: center;
					justify-content: center;
					border-radius: 50%;

					&.disabled {
						background: rgba(255, 255, 255, 0.1);
						cursor: not-allowed;
						opacity: 0.5;
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

	.facility-container {
		padding: 12rpx 6rpx; // 左右间距
		padding-top: calc(var(--status-bar-height) + 44px + 12rpx); // 顶部间距避免被自定义导航栏遮挡
		padding-bottom: calc(140rpx + env(safe-area-inset-bottom)); // 底部间距避免被导航栏遮挡，适配安全区域
		background: #f5f6fa;
		min-height: 100vh;
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



	/* 待审核列表标题特殊样式 */
	.audit-list-title {
		margin-top: -8rpx !important;
		margin-bottom: 0 !important;
	}

	.v1 {
		width: 92.5%;
		height: 122px;
		margin-left: 15px;
		margin-top: 0px; // 调整顶部间距，因为现在有自定义导航栏
		border-radius: 15px;
		background-image: linear-gradient(to top, #209cff 0%, #68e0cf 100%);
	}

	.v-img1 {
		width: 132px;
		height: 132px;
		margin-left: 10px;
	}

	.v-text1 {
		font-size: 24px;
		margin-top: -120px;
		margin-left: 220px;
		font-family: "微软雅黑";
		font-weight: 700;
		color: #fff;
	}

	.v-text1-small {
		font-size: 14px;
		margin-top: 10px;
		margin-left: 230px;
		font-family: "微软雅黑";
		color: #fff;
	}

	.v-text1-small1 {
		font-size: 14px;
		margin-top: 5px;
		margin-left: 160px;
		font-family: "微软雅黑";
		color: #fff;
	}

	.v1-v1 {
		width: 42%;
		height: 35px;
		margin-top: 10px;
		padding-top: 3px;
		/* padding-bottom: -10px; */
		margin-left: 175px;
		border-radius: 18px;
		background-color: #256ef5;
	}

	.v2-v2 {
		width: 42%;
		height: 35px;
		margin-top: 10px;
		padding-top: 3px;
		/* padding-bottom: -10px; */
		margin-left: 175px;
		border-radius: 18px;
		background-color: #256ef5;
	}

	.v3-v3 {
		width: 42%;
		height: 35px;
		margin-top: 10px;
		padding-top: 3px;
		/* padding-bottom: -10px; */
		margin-left: 175px;
		border-radius: 18px;
		background-color: #256ef5;
	}

	.v1-v1-text {
		font-size: 20px;
		margin-left: 20px;
		font-family: "Microsoft YaHei";
		font-weight: 700;
		color: #fff;
	}

	.v2-v2-text {
		font-size: 20px;
		margin-left: 25px;
		font-family: "Microsoft YaHei";
		font-weight: 700;
		color: #fff;
	}

	.v3-v3-text {
		font-size: 20px;
		margin-left: 20px;
		font-family: "Microsoft YaHei";
		font-weight: 700;
		color: #fff;
	}

	.v1-v1-image {
		width: 15px;
		height: 15px;
		margin-left: 10px;
	}

	.v2-v2-image {
		width: 15px;
		height: 15px;
		margin-left: 10px;
	}

	.v3-v3-image {
		width: 15px;
		height: 15px;
		margin-left: 10px;
	}

	.tui-badge-item {
		position: relative;
		margin-left: 15px;
		margin-right: 2px;
	}

	/* 增强点击反馈 */
	.radio-label {
		transition: all 0.3s;
	}

	.u-radio--checked .radio-label {
		transform: scale(1.05);
		font-weight: 600;
	}

	/* 防止排序时内容跳动 */
	.card-container {
		transform: translateZ(0);
		backface-visibility: hidden;
		will-change: transform;
		transition: transform 0.2s ease;
		/* 平滑过渡效果 */
	}

	/* 防止图标抖动 */
	/deep/ .u-icon {
		will-change: transform;
		transition: transform 0.3s ease;
	}

	/* 优先级标识基础样式 */
	.priority-badge {
		position: absolute;
		top: 0;
		right: 0;
		/* 改为右侧而非左侧 */
		left: auto;
		/* 取消左侧定位 */
		color: white;
		padding: 8rpx 20rpx;
		font-size: 24rpx;
		font-weight: bold;
		border-bottom-left-radius: 12rpx;
		/* 改为左下角圆角 */
		border-bottom-right-radius: 0;
		/* 移除右下角圆角 */
		z-index: 5;
		display: flex;
		align-items: center;
		box-shadow: -2rpx 2rpx 8rpx rgba(0, 0, 0, 0.2);
		/* 调整阴影方向 */
	}

	/* 今日待审核标识 - 最高优先级 */
	.today-pending-badge {
		background: linear-gradient(45deg, #d50000, #ff1744);
		animation: pulse-prominent 1.5s infinite;
	}

	/* 昨日待审核标识 - 次高优先级 */
	.yesterday-pending-badge {
		background: linear-gradient(45deg, #0d47a1, #1976d2);
	}

	/* 近三天待审核标识 */
	.three-days-badge {
		background: linear-gradient(45deg, #43a047, #66bb6a);
	}

	/* 近五天待审核标识 */
	.five-days-badge {
		background: linear-gradient(45deg, #ffb300, #ffd54f);
		color: #5d4037;
	}

	/* 近一周待审核标识 */
	.week-badge {
		background: linear-gradient(45deg, #7b1fa2, #ab47bc);
	}

	/* 卡片容器状态样式 */
	.today-pending {
		border: 2px solid #f44336 !important;
		box-shadow: 0 8rpx 24rpx rgba(244, 67, 54, 0.2) !important;
	}

	.yesterday-pending {
		border: 2px solid #1976d2 !important;
		box-shadow: 0 8rpx 24rpx rgba(25, 118, 210, 0.15) !important;
	}

	.three-days-pending {
		border: 1px solid #4CAF50 !important;
	}

	.five-days-pending {
		border: 1px solid #FFC107 !important;
	}

	.week-pending {
		border: 1px solid #9C27B0 !important;
	}

	/* 预约时间行样式 */
	.appointment-highlight {
		background: linear-gradient(to right, #eef5ff, #f8faff);
		border-radius: 12rpx;
		padding: 12rpx 16rpx;
		margin-top: 16rpx;
		position: relative;
		overflow: hidden;
	}

	.appointment-highlight .time-label {
		margin: 0 8rpx;
		color: #909399;
		font-size: 26rpx;
	}

	.appointment-highlight .time-value {
		font-size: 30rpx;
		color: #3f87f5;
		font-weight: bold;
	}

	/* 今日待审核时间行 */
	.today-pending-appointment {
		background: linear-gradient(to right, #ffebee, #ffcdd2) !important;
		border-left: 8rpx solid #f44336 !important;
	}

	/* 昨日待审核时间行 */
	.yesterday-pending-appointment {
		background: linear-gradient(to right, #e3f2fd, #bbdefb) !important;
		border-left: 8rpx solid #1976d2 !important;
	}

	/* 三天内待审核时间行 */
	.three-days-appointment {
		background: linear-gradient(to right, #e8f5e9, #f1f8e9) !important;
		border-left: 6rpx solid #4CAF50 !important;
	}

	/* 五天内待审核时间行 */
	.five-days-appointment {
		background: linear-gradient(to right, #fff8e1, #fffde7) !important;
		border-left: 6rpx solid #FFC107 !important;
	}

	/* 一周内待审核时间行 */
	.week-appointment {
		background: linear-gradient(to right, #f3e5f5, #f8f5fd) !important;
		border-left: 6rpx solid #9C27B0 !important;
	}

	/* 今日待审核时间文字 */
	.today-pending-time {
		color: #d32f2f !important;
		font-weight: 800 !important;
		font-size: 32rpx !important;
		animation: pulse 2s infinite;
	}

	/* 昨日待审核时间文字 */
	.yesterday-pending-time {
		color: #1565c0 !important;
		font-weight: 700 !important;
		font-size: 30rpx !important;
	}

	/* 三天内待审核时间文字 */
	.three-days-time {
		color: #2E7D32 !important;
		font-weight: 600 !important;
		font-size: 28rpx !important;
	}

	/* 五天内待审核时间文字 */
	.five-days-time {
		color: #F57F17 !important;
		font-weight: 600 !important;
		font-size: 28rpx !important;
	}

	/* 一周内待审核时间文字 */
	.week-time {
		color: #6A1B9A !important;
		font-weight: 500 !important;
		font-size: 26rpx !important;
	}

	/* 高亮车牌样式 */
	.today-pending-plate {
		background: linear-gradient(to right, #ffebee, #fff5f5) !important;
		border-left: 4rpx solid #f44336 !important;
	}

	.yesterday-pending-plate {
		background: linear-gradient(to right, #e3f2fd, #e8f4ff) !important;
		border-left: 4rpx solid #1976d2 !important;
	}

	/* 标记条样式 */
	.urgent-marker {
		position: absolute;
		right: 0;
		top: 0;
		height: 100%;
		width: 8rpx;
		background: linear-gradient(to bottom, #f44336, #ff9800);
		animation: blink 1.5s infinite;
	}

	.yesterday-marker {
		position: absolute;
		right: 0;
		top: 0;
		height: 100%;
		width: 6rpx;
		background: linear-gradient(to bottom, #1976d2, #64b5f6);
	}

	.three-days-marker {
		position: absolute;
		right: 0;
		top: 0;
		height: 100%;
		width: 6rpx;
		background: linear-gradient(to bottom, #43a047, #81c784);
	}

	.five-days-marker {
		position: absolute;
		right: 0;
		top: 0;
		height: 100%;
		width: 4rpx;
		background: linear-gradient(to bottom, #ffb300, #ffd54f);
	}

	.week-marker {
		position: absolute;
		right: 0;
		top: 0;
		height: 100%;
		width: 4rpx;
		background: linear-gradient(to bottom, #7b1fa2, #ce93d8);
	}

	/* 动画效果 */
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

	@keyframes pulse-prominent {
		0% {
			opacity: 1;
		}

		50% {
			opacity: 0.7;
		}

		100% {
			opacity: 1;
		}
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

	/* 徽章文本样式 */
	.badge-text {
		margin-right: 8rpx;
		/* 右侧空间 */
		margin-left: 0;
		/* 移除左侧空间 */
		font-size: 24rpx;
		font-weight: bold;
		order: -1;
		/* 让文本显示在图标前面 */
	}

	/* 右滑按钮优化样式 */
	/deep/ .u-swipe-action-item__right {
		height: 100%;
		display: flex;
		align-items: stretch;
	}

	/deep/ .u-swipe-action-item__right__button {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 !important;
		position: relative;
		overflow: hidden;
	}

	/* 按钮点击效果 */
	/deep/ .u-swipe-action-item__right__button:active {
		opacity: 0.8;
		transform: scale(0.98);
	}

	/* 修改按钮图标样式，删除伪元素内容 */
	/deep/ .u-swipe-action-item__right__button::before {
		content: none !important;
		/* 完全移除内容 */
		display: none !important;
		/* 确保不显示 */
	}

	/* 删除这些选择器，它们定义了特定按钮的图标 */
	/deep/ .u-swipe-action-item__right__button:nth-child(1)::before {
		content: none !important;
		display: none !important;
	}

	/deep/ .u-swipe-action-item__right__button:nth-child(2)::before {
		content: none !important;
		display: none !important;
	}

	/* 美化按钮样式 */
	/deep/ .u-swipe-action-item__right__button:nth-child(1) {
		background-image: linear-gradient(45deg, #0e9d56, #19be6b);
	}

	/deep/ .u-swipe-action-item__right__button:nth-child(2) {
		background-image: linear-gradient(45deg, #e8571f, #ff7900);
	}

	/* 状态变更动画 */
	.card-container {
		transition: all 0.5s;
	}

	.card-container[statusChanged="true"][statusType="approve"] {
		transform: translateX(-100%);
		opacity: 0;
		background-color: rgba(25, 190, 107, 0.1);
	}

	.card-container[statusChanged="true"][statusType="reject"] {
		transform: translateX(100%);
		opacity: 0;
		background-color: rgba(245, 108, 108, 0.1);
	}

	/* 实时搜索结果样式 */
	.search-results {
		max-height: 60vh;
		overflow-y: auto;
		margin-top: 16rpx;
		background: #ffffff;
		border-radius: 12rpx;
		box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.08);
		border: 1rpx solid #edf2f7;
	}

	/* 实时搜索结果项样式 */
	.search-result-item {
		padding: 20rpx 24rpx;
		border-bottom: 1rpx solid #edf2f7;
		transition: all 0.2s;
	}

	.search-result-item:last-child {
		border-bottom: none;
	}

	.search-result-item:active {
		background-color: #f8fafc;
	}

	/* 高亮匹配文本 */
	.highlight-text {
		color: #3b82f6;
		font-weight: bold;
	}

	/* 空结果提示 */
	.empty-result {
		padding: 40rpx;
		text-align: center;
		color: #94a3b8;
		font-size: 28rpx;
	}

	/* 标签选中状态 */
	/deep/ .quick-filter .u-tag.active {
		background: #3b82f6 !important;
		color: #ffffff !important;
		border-color: #2563eb !important;
	}

	/* 添加统计数据展示区域样式 */
	.stats-container {
		margin: 20rpx 16rpx 8rpx 16rpx;
		padding: 24rpx;
		background: linear-gradient(135deg, #f0f9ff, #e6f7ff);
		border-radius: 16rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.04);
		border: 1rpx solid #bae7ff;
	}

	.stats-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
		border-bottom: 1rpx dashed #91caff;
		padding-bottom: 16rpx;
	}

	.stats-title {
		font-size: 28rpx;
		color: #0958d9;
		font-weight: bold;
		display: flex;
		align-items: center;
	}

	.stats-cards {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		margin-top: 10rpx;
	}

	.stat-card {
		width: 22%;
		background: #ffffff;
		border-radius: 12rpx;
		padding: 16rpx 12rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
		margin-bottom: 16rpx;
		position: relative;
		overflow: hidden;
		transition: all 0.3s;
	}

	.stat-card:active {
		transform: scale(0.98);
	}

	.stat-label {
		font-size: 24rpx;
		color: #666666;
		margin-bottom: 6rpx;
		text-align: center;
	}

	.stat-value {
		font-size: 32rpx;
		font-weight: bold;
		text-align: center;
		color: #262626;
	}

	.stat-indicator {
		height: 4rpx;
		width: 100%;
		position: absolute;
		bottom: 0;
		left: 0;
	}

	.stat-card.total .stat-indicator {
		background: linear-gradient(to right, #1677ff, #4096ff);
	}

	.stat-card.today .stat-indicator {
		background: linear-gradient(to right, #f5222d, #ff7875);
	}

	.stat-card.yesterday .stat-indicator {
		background: linear-gradient(to right, #1890ff, #69c0ff);
	}

	.stat-card.three-days .stat-indicator {
		background: linear-gradient(to right, #52c41a, #95de64);
	}

	.stat-card.pending .stat-indicator {
		background: linear-gradient(to right, #fa8c16, #ffc53d);
	}

	/* 统计数据更新高亮效果 */
	.stats-highlight {
		animation: statsUpdate 1s ease-in-out;
	}

	.pending-updated {
		animation: pendingUpdate 1s ease-in-out;
	}

	@keyframes statsUpdate {
		0% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.02);
		}
		100% {
			transform: scale(1);
		}
	}

	@keyframes pendingUpdate {
		0% {
			transform: scale(1);
			box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
		}
		50% {
			transform: scale(1.05);
			box-shadow: 0 8rpx 24rpx rgba(250, 140, 22, 0.3);
		}
		100% {
			transform: scale(1);
			box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
		}
	}

	.stat-percentage {
		font-size: 20rpx;
		color: #8c8c8c;
		text-align: center;
		margin-top: 4rpx;
	}

	.percentage-up {
		color: #f5222d;
	}

	.percentage-down {
		color: #52c41a;
	}

	/* 业主姓名样式 */
	.owner-name {
		display: flex;
		align-items: center;
	}
	
	.owner-label {
		font-size: 24rpx;
		color: #666;
		margin-right: 6rpx;
	}

	/* 调试信息样式 */
	.debug-info {
		margin: 20rpx;
		padding: 24rpx;
		background-color: #f8fafc;
		border-radius: 12rpx;
		border: 1rpx solid #e2e8f0;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
	}

	.debug-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16rpx;
		padding-bottom: 16rpx;
		border-bottom: 1rpx dashed #cbd5e1;
	}

	.debug-title {
		font-size: 30rpx;
		font-weight: bold;
		color: #334155;
	}

	.debug-status {
		font-size: 28rpx;
		font-weight: bold;
		padding: 6rpx 16rpx;
		border-radius: 8rpx;
		background-color: #f1f5f9;
		color: #64748b;
	}

	.status-success {
		background-color: #dcfce7;
		color: #16a34a;
	}

	.status-error {
		background-color: #fee2e2;
		color: #dc2626;
	}

	.status-loading {
		background-color: #e0f2fe;
		color: #0284c7;
		animation: pulse 1.5s infinite;
	}

	.debug-item {
		display: flex;
		margin: 12rpx 0;
		font-size: 26rpx;
	}

	.debug-label {
		color: #64748b;
		width: 140rpx;
		flex-shrink: 0;
	}

	.debug-value {
		color: #334155;
		flex: 1;
	}

	.error-text {
		color: #dc2626;
	}

	.debug-actions {
		margin-top: 20rpx;
		display: flex;
		justify-content: center;
	}

	.debug-button {
		font-size: 26rpx;
		padding: 10rpx 30rpx;
		background-color: #0ea5e9;
		color: white;
		border-radius: 8rpx;
		border: none;
	}

	.debug-button:active {
		background-color: #0284c7;
	}

	.debug-button[disabled] {
		background-color: #94a3b8;
		opacity: 0.7;
	}

	/* 骨架屏样式 */
	.stats-skeleton {
		padding: 20rpx;
	}

	.loading-tip {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 20rpx;
		padding: 16rpx;
		background: rgba(59, 130, 246, 0.1);
		border-radius: 12rpx;
		gap: 12rpx;
	}

	.loading-text {
		font-size: 26rpx;
		color: #3b82f6;
		font-weight: 500;
	}

	.skeleton-cards {
		display: flex;
		justify-content: space-between;
		gap: 20rpx;
	}

	.skeleton-card {
		flex: 1;
		background: #f8fafc;
		border-radius: 16rpx;
		padding: 24rpx;
		position: relative;
		overflow: hidden;
	}

	.skeleton-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
		animation: skeleton-loading 1.5s infinite;
	}

	.skeleton-label {
		width: 60%;
		height: 24rpx;
		background: #e2e8f0;
		border-radius: 4rpx;
		margin-bottom: 16rpx;
	}

	.skeleton-value {
		width: 40%;
		height: 36rpx;
		background: #e2e8f0;
		border-radius: 4rpx;
		margin-bottom: 12rpx;
	}

	.skeleton-indicator {
		width: 100%;
		height: 8rpx;
		background: #e2e8f0;
		border-radius: 4rpx;
	}

	/* 列表骨架屏 */
	.list-skeleton {
		padding: 20rpx;
	}

	.skeleton-item {
		background: #ffffff;
		border-radius: 16rpx;
		padding: 24rpx;
		margin-bottom: 16rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
		position: relative;
		overflow: hidden;
	}

	.skeleton-item::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
		animation: skeleton-loading 1.5s infinite;
	}

	.skeleton-content {
		display: flex;
		align-items: flex-start;
		gap: 20rpx;
	}

	.skeleton-plate {
		width: 120rpx;
		height: 60rpx;
		background: #e2e8f0;
		border-radius: 8rpx;
		flex-shrink: 0;
	}

	.skeleton-info {
		flex: 1;
	}

	.skeleton-line {
		height: 24rpx;
		background: #e2e8f0;
		border-radius: 4rpx;
		margin-bottom: 12rpx;
	}

	.skeleton-line.short {
		width: 40%;
	}

	.skeleton-line.medium {
		width: 70%;
	}

	.skeleton-line.long {
		width: 90%;
	}

	/* 空状态样式 */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 80rpx 40rpx;
		text-align: center;
	}

	.empty-icon {
		font-size: 120rpx;
		margin-bottom: 24rpx;
		opacity: 0.6;
	}

	.empty-text {
		font-size: 32rpx;
		color: #64748b;
		font-weight: 500;
		margin-bottom: 12rpx;
	}

	.empty-desc {
		font-size: 26rpx;
		color: #94a3b8;
		line-height: 1.5;
	}

	/* 骨架屏动画 */
	@keyframes skeleton-loading {
		0% {
			left: -100%;
		}
		100% {
			left: 100%;
		}
	}

	/* 渐入动画 */
	.fade-in {
		animation: fadeIn 0.5s ease-in-out;
	}

	@keyframes fadeIn {
		0% {
			opacity: 0;
			transform: translateY(20rpx);
		}
		100% {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* 实时统计数据显示样式 */
	.stats-debug {
		margin-top: 20rpx;
		padding: 20rpx;
		background: #f8f9fa;
		border-radius: 10rpx;
		border: 1rpx solid #e9ecef;
	}

	.stats-debug-title {
		font-size: 28rpx;
		font-weight: bold;
		color: #495057;
		margin-bottom: 15rpx;
		display: block;
	}

	.stats-debug-row {
		display: flex;
		flex-wrap: wrap;
		margin-bottom: 10rpx;
	}

	.stats-debug-item {
		font-size: 24rpx;
		color: #6c757d;
		margin-right: 20rpx;
		margin-bottom: 5rpx;
		padding: 5rpx 10rpx;
		background: #ffffff;
		border-radius: 5rpx;
		border: 1rpx solid #dee2e6;
	}

	/* === 折叠列表样式 === */
	/* 列表控制区域 */
	.list-control-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16rpx 20rpx;
		background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
		border-radius: 12rpx;
		margin: 8rpx 16rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
	}

	.list-title {
		display: flex;
		align-items: center;
		font-size: 32rpx;
		font-weight: 600;
		color: #333;
	}

	.list-count {
		font-size: 24rpx;
		color: #666;
		margin-left: 8rpx;
	}

	.list-actions {
		display: flex;
		gap: 12rpx;
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 60rpx;
		height: 60rpx;
		background: linear-gradient(135deg, #f0f9eb, #e1f3d8);
		border: 1rpx solid rgba(103, 194, 58, 0.2);
		border-radius: 16rpx;
		transition: all 0.3s ease;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
	}

	.action-btn:active {
		background: linear-gradient(135deg, #e1f3d8, #d1edc4);
		transform: scale(0.9);
		box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.15);
	}

	.action-icon {
		font-size: 32rpx;
		line-height: 1;
	}

	.expand-all-icon {
		color: #67C23A;
	}

	.collapse-all-icon {
		color: #909399;
	}

	/* 紧凑单行布局 */
	.compact-row {
		display: flex;
		align-items: center;
		gap: 12rpx;
		padding: 20rpx 0 20rpx 24rpx;
		min-height: 100rpx;
	}



	/* 车牌号样式 - 支持两行显示 */
	.plate-number-compact {
		flex-shrink: 0;
		padding: 12rpx 16rpx;
		border-radius: 8rpx;
		text-align: center;
		font-weight: 600;
		font-size: 28rpx;
		width: 220rpx;
		min-height: 56rpx;
		max-height: 100rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1.3;
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
	}

	.plate-text {
		font-family: 'Arial', sans-serif;
		letter-spacing: 2rpx;
		word-wrap: break-word;
		word-break: break-all;
		white-space: normal;
		line-height: 1.3;
		display: block;
		width: 100%;
		text-align: center;
	}

	/* 业主信息区域 */
	.owner-info-section {
		flex: 1;
		display: flex;
		align-items: center;
		margin: 0 12rpx;
		min-width: 0; /* 允许内容收缩 */
	}

	.owner-info {
		display: flex;
		align-items: center;
	}

	.owner-name {
		font-size: 28rpx;
		color: #2c3e50;
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* 等待时间区域 */
	.waiting-info-section {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		margin: 0 12rpx;
	}

	.waiting-status {
		display: flex;
		align-items: center;
		padding: 8rpx 12rpx;
		border-radius: 12rpx;
		font-size: 24rpx;
		font-weight: 600;
		background: #f8f9fa;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
		transition: all 0.3s ease;
	}

	.waiting-text {
		color: #333;
		font-size: 24rpx;
		font-weight: 600;
	}

	/* 刚到达 - 蓝色系 */
	.waiting-status.urgency-just-arrived {
		background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
		border: 1rpx solid #90caf9;
	}

	.urgency-just-arrived .waiting-text {
		color: #0d47a1;
		font-weight: 600;
	}

	/* 正常等待 - 绿色系 */
	.waiting-status.urgency-normal {
		background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
		border: 1rpx solid #a5d6a7;
	}

	.urgency-normal .waiting-text {
		color: #1b5e20;
		font-weight: 600;
	}

	/* 需要注意 - 橙色系 */
	.waiting-status.urgency-warning {
		background: linear-gradient(135deg, #fff3e0 0%, #ffcc02 100%);
		border: 1rpx solid #ffb74d;
	}

	.urgency-warning .waiting-text {
		color: #e65100;
		font-weight: 700;
	}

	/* 紧急 - 红色系 */
	.waiting-status.urgency-urgent {
		background: linear-gradient(135deg, #ffebee 0%, #ef5350 100%);
		border: 1rpx solid #e57373;
		animation: urgentPulse 2s infinite;
	}

	.urgency-urgent .waiting-text {
		color: #b71c1c;
		font-weight: 700;
	}

	/* 非常紧急 - 深红色系 */
	.waiting-status.urgency-critical {
		background: linear-gradient(135deg, #ffcdd2 0%, #f44336 100%);
		border: 2rpx solid #e53935;
		animation: criticalPulse 1s infinite;
	}

	.urgency-critical .waiting-text {
		color: #ffffff;
		font-weight: 700;
		text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.3);
	}

	/* 即将到来 - 紫色系 */
	.waiting-status.urgency-upcoming {
		background: linear-gradient(135deg, #f3e5f5 0%, #ce93d8 100%);
		border: 1rpx solid #ba68c8;
	}

	.urgency-upcoming .waiting-text {
		color: #4a148c;
		font-weight: 600;
	}

	/* 未知状态 - 灰色系 */
	.waiting-status.urgency-unknown {
		background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
		border: 1rpx solid #bdbdbd;
	}

	.urgency-unknown .waiting-text {
		color: #424242;
		font-weight: 500;
	}

	/* 动画效果 */
	@keyframes urgentPulse {
		0% {
			box-shadow: 0 2rpx 8rpx rgba(244, 67, 54, 0.2);
		}
		50% {
			box-shadow: 0 4rpx 16rpx rgba(244, 67, 54, 0.4);
			transform: scale(1.02);
		}
		100% {
			box-shadow: 0 2rpx 8rpx rgba(244, 67, 54, 0.2);
		}
	}

	@keyframes criticalPulse {
		0% {
			box-shadow: 0 4rpx 16rpx rgba(244, 67, 54, 0.3);
		}
		50% {
			box-shadow: 0 8rpx 24rpx rgba(244, 67, 54, 0.6);
			transform: scale(1.05);
		}
		100% {
			box-shadow: 0 4rpx 16rpx rgba(244, 67, 54, 0.3);
		}
	}





	/* 操作按钮区域 */
	.actions-compact {
		display: flex;
		gap: 12rpx;
		flex-shrink: 0;
		margin-left: auto;
		margin-right: 16rpx;
		justify-content: flex-end;
	}

	.copy-btn,
	.collapse-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 56rpx;
		height: 56rpx;
		border-radius: 12rpx;
		transition: all 0.3s ease;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
		border: 1rpx solid rgba(0, 0, 0, 0.05);
	}

	.copy-btn:active,
	.collapse-btn:active {
		transform: scale(0.9);
		box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.15);
	}

	.copy-btn {
		background: linear-gradient(135deg, #ecf5ff, #d9ecff);
	}

	.copy-btn .copy-icon {
		color: #409EFF;
		font-size: 32rpx;
		line-height: 1;
	}

	.copy-btn:hover {
		background: linear-gradient(135deg, #d9ecff, #b3d8ff);
		transform: translateY(-1rpx);
	}

	.collapse-btn {
		background: linear-gradient(135deg, #f0f9eb, #e1f3d8);
	}

	.collapse-btn .expand-icon {
		color: #67C23A;
		font-size: 32rpx;
		line-height: 1;
	}

	.collapse-btn:hover {
		background: linear-gradient(135deg, #e1f3d8, #d1edc4);
		transform: translateY(-1rpx);
	}

	/* 详细信息区域 - 现代卡片网格布局 */
	.detail-info-section {
		margin-top: 24rpx;
		padding: 16rpx 12rpx;
		background: rgba(245, 247, 250, 0.5);
		border-radius: 16rpx;
		border-top: 1rpx solid #e6edf5;
	}

	/* 网格行布局 */
	.info-grid-row {
		display: flex;
		gap: 16rpx;
		margin-bottom: 20rpx;
		padding: 0 8rpx;
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
		border-radius: 16rpx;
		padding: 20rpx 12rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.04);
		position: relative;
		overflow: hidden;
		min-height: 120rpx;
		justify-content: center;
		transition: all 0.3s ease;
	}
	
	.info-card:active {
		transform: scale(0.98);
	}

	/* 三列网格卡片 */
	.info-card:not(.full-width) {
		flex: 1;
	}

	/* 全宽卡片 */
	.info-card.full-width {
		width: 100%;
	}

	/* 联系人卡片 */
	.contact-card {
		background: #ffffff;
		border: 1rpx solid rgba(79, 172, 254, 0.2);
	}

	.contact-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4rpx;
		background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
	}

	/* 手机号卡片 */
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
		background: linear-gradient(90deg, #ff9500 0%, #ffb84d 100%);
	}

	/* 时间卡片 */
	.time-card {
		background: #ffffff;
		border: 1rpx solid rgba(139, 92, 246, 0.2);
		padding: 24rpx;
		text-align: center;
		align-items: center;
		min-height: 140rpx;
	}

	.time-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4rpx;
		background: linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%);
	}

	/* 卡片图标 */
	.card-icon {
		font-size: 36rpx;
		margin-bottom: 10rpx;
		filter: drop-shadow(0 2rpx 4rpx rgba(0, 0, 0, 0.1));
	}

	.card-icon.large {
		font-size: 40rpx;
	}

	/* 卡片标签 */
	.card-label {
		font-size: 24rpx;
		color: #64748b;
		font-weight: 500;
		margin-bottom: 8rpx;
	}

	/* 卡片内容 */
	.card-content {
		font-size: 28rpx;
		color: #1e293b;
		font-weight: 600;
		line-height: 1.4;
		word-break: break-all;
		text-align: center;
		padding: 0 8rpx;
	}

	.card-content.primary {
		font-size: 32rpx;
		color: #0f172a;
		letter-spacing: 1rpx;
	}

	.card-content.no-data {
		color: #94a3b8;
		font-style: italic;
		font-weight: 400;
	}

	.card-content.clickable {
		color: #0ea5e9;
		text-decoration: underline;
		text-decoration-color: rgba(14, 165, 233, 0.3);
	}

	/* 时间卡片特殊布局 */
	.time-card-header {
		display: flex;
		align-items: center;
		margin-bottom: 16rpx;
		width: 100%;
		justify-content: center;
		padding-bottom: 12rpx;
		border-bottom: 1rpx dashed rgba(139, 92, 246, 0.2);
	}

	.time-card-header .card-label {
		margin-left: 12rpx;
		margin-bottom: 0;
	}

	/* 新增：时间内容行样式 */
	.time-content-row {
		display: flex;
		align-items: center;
		gap: 16rpx;
		flex-wrap: wrap;
		width: 100%;
		justify-content: center;
		padding: 8rpx 0;

		.card-content.primary {
			font-size: 28rpx;
			font-weight: 700;
			color: #0c4a6e;
			flex-shrink: 0;
		}

		.waiting-text-inline {
			font-size: 24rpx;
			color: #f59e0b;
			font-weight: 600;
			background: rgba(245, 158, 11, 0.1);
			padding: 6rpx 16rpx;
			border-radius: 20rpx;
			border: 1rpx solid rgba(245, 158, 11, 0.2);
			flex-shrink: 0;
			white-space: nowrap;
			box-shadow: 0 2rpx 6rpx rgba(245, 158, 11, 0.15);
		}
	}

	.time-card-footer {
		display: flex;
		align-items: center;
		margin-top: 12rpx;
		padding: 8rpx 16rpx;
		background: rgba(139, 92, 246, 0.1);
		border-radius: 20rpx;
		width: 100%;
		justify-content: center;
	}

	.waiting-indicator {
		font-size: 20rpx;
		margin-right: 8rpx;
	}

	.waiting-text {
		font-size: 24rpx;
		color: #8b5cf6;
		font-weight: 600;
	}
</style>