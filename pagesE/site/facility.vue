<template>
	<view class="container">
		<view class="tui-menus">
			<tui-section title="管家权益" fontWeight="1000" background="#fff" class="tui-section-box">
				<image slot="left" src="/static/车位管家 (1).png" class="tui-icon"></image>
			</tui-section>
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
				<u-tag text="本周" plain size="mini" type="primary"></u-tag>
			</view>

			<view class="stats-cards">
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
		<tui-section title="待审核列表" fontWeight="1000" background="#fff" descrTop="35" isLine="true" lineColor="#0638ed"
			class="tui-section-box">
		</tui-section>
		<view class="audit-list">
			<!-- 搜索区域优化 -->
			<view class="filter-container">
				<view class="search-box">
					<!-- 现代化排序按钮 -->
					<view class="sort-button" :class="{ active: sortConfig.desc }" @click="toggleSort">
						<view class="sort-icon-wrapper">
							<view class="sort-icon" :class="{ flipped: sortConfig.desc }">
								<text class="sort-emoji">📊</text>
							</view>
						</view>
						<view class="sort-tooltip">
							<text class="tooltip-text">{{ sortConfig.desc ? '新→旧' : '旧→新' }}</text>
						</view>
					</view>
					
					<!-- 现代化搜索框 -->
					<view class="modern-search-container">
						<view class="search-input-wrapper">
							<view class="search-icon">
								<text class="icon-emoji">🔍</text>
							</view>
							<input 
								v-model="searchKey" 
								placeholder="车牌号/手机号/住址" 
								class="search-input"
								@input="onSearchInputChange"
								@focus="onSearchFocus"
								@blur="onSearchBlur"
							/>
							<view v-if="searchKey" class="clear-button" @click="clearSearch">
								<text class="clear-emoji">❌</text>
							</view>
						</view>
						<view class="search-button" @click="handleSearch">
							<text class="button-emoji">🔍</text>
							<text class="search-text">搜索</text>
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
								<view class="plate-number search-plate" :class="isNewEnergyPlate(item.plateNumber) ? 'green-plate' : 'blue-plate'">
									{{ item.plateNumber }}
								</view>
							</view>
							<view style="font-size: 24rpx; color: #64748b; margin-top: 6rpx;">
								{{ item.name }} · {{ item.addressDetail }}
							</view>
						</view>
					</view>
				</view>
				<!-- 快捷筛选标签 -->
				<view class="quick-filter">
					<u-tag text="今日" plain size="mini" type="primary"
						:custom-style="activeTag === 'today' ? 'background-color:#3b82f6;color:#ffffff;border-color:#2563eb;' : ''"
						@click="quickFilter('today')"></u-tag>
					<u-tag text="昨日" plain size="mini"
						:custom-style="activeTag === 'yesterday' ? 'background-color:#3b82f6;color:#ffffff;border-color:#2563eb;' : ''"
						@click="quickFilter('yesterday')"></u-tag>
					<u-tag text="近三天" plain size="mini"
						:custom-style="activeTag === 'three_days' ? 'background-color:#3b82f6;color:#ffffff;border-color:#2563eb;' : ''"
						@click="quickFilter('three_days')"></u-tag>
					<u-tag text="全部" plain size="mini" type="error"
						:custom-style="activeTag === 'all' ? 'background-color:#ef4444;color:#ffffff;border-color:#dc2626;' : ''"
						@click="quickFilter('all')"></u-tag>
				</view>
			</view>

			<!-- 优化后的列表项 -->
			<u-swipe-action ref="uSwipeAction">
				<u-swipe-action-item v-for="(item, index) in filteredList" :key="item.id" :options="options"
					:index="index" @click="handleAction">
					<view class="card-container" :class="{
							'today-pending': isToday(item.time),
							'yesterday-pending': isYesterday(item.time),
							'three-days-pending': isWithinDays(item.time, 3),
							'five-days-pending': isWithinDays(item.time, 5),
							'week-pending': isWithinDays(item.time, 7)
						}" :statusChanged="item.statusChanged" :statusType="item.statusType">
						<view class="card-background">
							<view class="convex-effect"></view>
							<view class="concave-effect"></view>
						</view>
						<!-- 今日待审核标识 - 最高优先级 -->
						<view v-if="isToday(item.time)" class="priority-badge today-pending-badge">
							<u-icon name="warning-fill" size="24" color="#ffffff"></u-icon>
							<text class="badge-text">今日待审核 {{ getWaitingTime(item.time) }}</text>
						</view>
						
						<!-- 昨日待审核标识 - 次高优先级 -->
						<view v-else-if="isYesterday(item.time)" class="priority-badge yesterday-pending-badge">
							<u-icon name="hourglass-half-fill" size="22" color="#ffffff"></u-icon>
							<text class="badge-text">昨日待审核</text>
						</view>
						
						<!-- 近三天待审核标识 -->
						<view v-else-if="isWithinDays(item.time, 3)" class="priority-badge three-days-badge">
							<u-icon name="calendar" size="20" color="#ffffff"></u-icon>
							<text class="badge-text">近三天待审核</text>
						</view>
						
						<!-- 近五天待审核标识 -->
						<view v-else-if="isWithinDays(item.time, 5)" class="priority-badge five-days-badge">
							<u-icon name="calendar" size="20" color="#ffffff"></u-icon>
							<text class="badge-text">近五天待审核</text>
						</view>
						
						<!-- 近一周待审核标识 -->
						<view v-else-if="isWithinDays(item.time, 7)" class="priority-badge week-badge">
							<u-icon name="calendar" size="20" color="#ffffff"></u-icon>
							<text class="badge-text">近一周待审核</text>
						</view>
						<view class="card-content">
							<view class="card-body">
															<!-- 车牌突出显示 -->
							<view class="info-row highlight-plate" :class="{
									'today-pending-plate': isToday(item.time),
									'yesterday-pending-plate': isYesterday(item.time)
								}">
								<u-icon name="car" size="20" :color="isToday(item.time) ? '#d32f2f' : 
										   isYesterday(item.time) ? '#1976d2' : '#2196F3'"></u-icon>
								<view class="plate-number" :class="isNewEnergyPlate(item.plateNumber) ? 'green-plate' : 'blue-plate'">
									{{ item.plateNumber }}
								</view>
							</view>
								<!-- 原有信息 -->
								<view class="info-row">
									<u-icon name="account" size="18" color="#4CAF50"></u-icon>
									<u--text :text="item.name" margin="0 20rpx" color="#333"></u--text>
									<u-icon name="phone" size="18" color="#2196F3"></u-icon>
									<u--text :text="item.phone" color="#333"></u--text>
								</view>
								<!-- 新增住址详情 -->
								<view class="info-row address-row">
									<u-icon name="map" size="18" color="#FF5722"></u-icon>
									<u--text :text="item.addressDetail" margin="0 20rpx" color="#795548" size="16"
										:bold="true"></u--text>
								</view>
								<!-- 预约时间行 -->
								<view class="time-info">
									<view class="time-item appointment-highlight" :class="{
											'today-pending-appointment': isToday(item.time),
											'yesterday-pending-appointment': isYesterday(item.time),
											'three-days-appointment': isWithinDays(item.time, 3),
											'five-days-appointment': isWithinDays(item.time, 5),
											'week-appointment': isWithinDays(item.time, 7)
										}">
										<u-icon :name="isToday(item.time) ? 'clock-fill' : 
													isYesterday(item.time) ? 'clock' : 'calendar-fill'" :size="isToday(item.time) ? 24 : 22" :color="isToday(item.time) ? '#f44336' : 
														 isYesterday(item.time) ? '#1976d2' : '#3f87f5'"></u-icon>
										<text class="time-label">预约时间:</text>
										<text class="time-value" :class="{
												'today-pending-time': isToday(item.time),
												'yesterday-pending-time': isYesterday(item.time),
												'three-days-time': isWithinDays(item.time, 3),
												'five-days-time': isWithinDays(item.time, 5),
												'week-time': isWithinDays(item.time, 7)
											}">
											{{ formatAppointmentTime(item.time) }}
										</text>
										<view v-if="isToday(item.time)" class="urgent-marker"></view>
										<view v-else-if="isYesterday(item.time)" class="yesterday-marker"></view>
										<view v-else-if="isWithinDays(item.time, 3)" class="three-days-marker"></view>
										<view v-else-if="isWithinDays(item.time, 5)" class="five-days-marker"></view>
										<view v-else-if="isWithinDays(item.time, 7)" class="week-marker"></view>
									</view>
								</view>
							</view>
						</view>
					</view>
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
		<custom-tabbar 
			:userRole="currentUserRole" 
			@tabChange="onTabChange">
		</custom-tabbar>
	</view>
</template>

<script>
	import TimeUtils from '@/utils/timeUtils.js'
	import CustomTabbar from '@/components/custom-tabbar.vue'
	
	export default {
		components: {
			CustomTabbar
		},
		data() {
			return {
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
				activeTag: '', // 当前选中的标签
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
				pendingList: [{
						id: '20230316001',
						time: '2025-04-19 14:00',
						name: '张先生',
						phone: '138****5678',
						description: '老人外出就医申请',
						plateNumber: "黑C155345", // 新增车牌字段
						addressDetail: "3栋2单元1502", // 新增地址字段
						status: '',
						showAction: false
					},
					{
						id: '20230316001',
						time: '2025-04-15 14:00',
						name: '张先生',
						phone: '138****5678',
						addressDetail: "7栋8单元502", // 新增必填字段
						plateNumber: '黑A12345',
						description: '老人外出就医申请',
						status: '今日新增',
						showAction: false
					}, {
						id: '20230316001',
						time: '2025-04-15 14:00',
						name: '张先生',
						phone: '138****5678',
						plateNumber: "黑A1KK45", // 新增车牌字段
						addressDetail: "5栋1单元503", // 新增地址字段
						description: '老人外出就医申请',
						status: '今日新增',
						showAction: false
					}, {
						id: '20230316001',
						time: '2025-04-18 14:00',
						name: '张先生',
						phone: '138****5678',
						plateNumber: "黑A1KK45", // 新增车牌字段
						addressDetail: "4栋1单元203", // 新增地址字段
						description: '老人外出就医申请',
						status: '今日新增',
						showAction: false
					}
				],
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
					todayPercent: 0
				}
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
				if (!this.searchKey && !this.activeTag) {
					return this.pendingList;
				}

				// 根据搜索关键词和当前标签过滤
				return this.pendingList.filter(item => {
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
								matchesTag = this.isToday(item.time);
								break;
							case 'yesterday':
								matchesTag = this.isYesterday(item.time);
								break;
							case 'three_days':
								matchesTag = this.isWithinDays(item.time, 3);
								break;
							case 'expiring':
								// 这里定义"即将超时"的逻辑，例如预约时间在24小时内
								const now = new Date();
								const appointmentTime = new Date(item.time);
								const diffHours = (appointmentTime - now) / (1000 * 60 * 60);
								matchesTag = diffHours > 0 && diffHours <= 24;
								break;
							case 'all':
								matchesTag = true;
								break;
						}
					}

					return matchesSearch && matchesTag;
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
			// 获取用户角色
			this.getUserRole();
			
			// 监听TabBar状态更新事件
			uni.$on('updateTabBarIndex', (index) => {
				console.log('📨 [审核页面] 收到TabBar状态更新:', index);
			});
		},
		onShow() {
			// 页面显示时通知TabBar检查当前页面
			this.$nextTick(() => {
				console.log('📱 [审核页面] 页面显示');
				// 根据角色动态计算审核页面的索引
				// 管家角色：预约(0) -> 预约查询(1) -> 违规车辆(2) -> 审核(3)
				// 其他角色可能没有审核页面
				const auditIndex = this.currentUserRole === 'manager' ? 3 : -1;
				if (auditIndex !== -1) {
					uni.$emit('updateTabBarIndex', auditIndex);
				}
			});
		},
		onUnload() {
			// 清理事件监听
			uni.$off('updateTabBarIndex');
		},
		mounted() {
			// 自动更新时间数据
			this.updateTimes();
			
			// 保存原始数据
			this.originalList = JSON.parse(JSON.stringify(this.pendingList));
			console.log("已保存原始数据:", this.originalList.length, "条");

			// 输出示例数据信息，用于调试
			if (this.pendingList.length > 0) {
				console.log("示例数据格式:", {
					time: this.pendingList[0].time,
					isToday: this.isToday(this.pendingList[0].time),
					isYesterday: this.isYesterday(this.pendingList[0].time),
					isWithin3Days: this.isWithinDays(this.pendingList[0].time, 3)
				});
			}

			// 计算统计数据
			this.calculateStats();
		},
		methods: {
			// 获取用户角色
			getUserRole() {
				try {
					const userInfo = uni.getStorageSync('userInfo');
					if (userInfo && userInfo.role) {
						this.currentUserRole = userInfo.role;
						console.log('📱 [审核页面] 获取用户角色:', this.currentUserRole);
					} else {
						console.warn('📱 [审核页面] 未找到用户角色信息，使用默认角色');
						this.currentUserRole = 'manager';
					}
				} catch (error) {
					console.error('📱 [审核页面] 获取用户角色失败:', error);
					this.currentUserRole = 'manager';
				}
			},
			
			// TabBar切换事件处理
			onTabChange(tabInfo) {
				console.log('📱 [审核页面] TabBar切换:', tabInfo);
			},
			
			// 更新时间数据
			updateTimes() {
				console.log('🕒 更新设施管理时间...');
				try {
					TimeUtils.reset();
					
					// 更新待处理列表时间
					this.pendingList = this.pendingList.map((item, index) => ({
						...item,
						time: TimeUtils.getRecentTime(index % 5, 'YYYY-MM-DD HH:mm')
					}));
					
					// 更新统计数据
					this.calculateStats();
					
					console.log('✅ 设施管理时间更新完成');
				} catch (error) {
					console.error('❌ 更新设施管理时间失败:', error);
				}
			},
			async handleAction(e) {
				console.log("原始事件:", e);

				// 确保我们可以获取到必要的信息
				const index = e.index; // 列表项索引
				const optionIndex = e.optionIndex; // 按钮索引，0是通过，1是驳回

				// 确定操作类型和名称 - 简单直接
				const actionType = index === 0 ? 'approve' : 'reject';
				const actionName = index === 0 ? '通过' : '驳回';

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
					console.error('处理操作时出错:', error);
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
				console.log("搜索关键词:", val);

				this.searchKey = val;

				if (!val.trim()) {
					// 搜索词为空时恢复当前筛选状态下的数据
					if (this.activeTag) {
						this.quickFilter(this.activeTag);
					} else {
						this.pendingList = [...this.originalList];
					}
					return;
				}

				// 基于当前筛选状态的数据源进行搜索
				let baseList = this.activeTag ?
					this.getFilteredListByTag(this.activeTag) : [...this.originalList];

				// 根据输入实时筛选列表
				const keyword = val.toLowerCase();
				this.pendingList = baseList.filter(item =>
					(item.plateNumber && item.plateNumber.toLowerCase().includes(keyword)) ||
					(item.phone && item.phone.toLowerCase().includes(keyword)) ||
					(item.addressDetail && item.addressDetail.toLowerCase().includes(keyword)) ||
					(item.name && item.name.toLowerCase().includes(keyword))
				);

				console.log(`搜索结果: ${this.pendingList.length}条`);
			},

			// 搜索按钮点击方法
			handleSearch() {
				console.log("执行搜索:", this.searchKey);

				if (!this.searchKey.trim()) {
					if (this.activeTag) {
						this.quickFilter(this.activeTag);
					} else {
						this.pendingList = [...this.originalList];
					}

					uni.showToast({
						title: '请输入搜索关键词',
						icon: 'none',
						duration: 1500
					});
					return;
				}

				// 已经在输入时实时搜索了，这里只做提示
				uni.showToast({
					title: `找到 ${this.pendingList.length} 条匹配结果`,
					icon: 'none',
					duration: 2000
				});
			},

			// 获取基于标签的过滤列表
			getFilteredListByTag(tagId) {
				const originalData = [...this.originalList];

				switch (tagId) {
					case 'today':
						return originalData.filter(item => this.isToday(item.time));
					case 'yesterday':
						return originalData.filter(item => this.isYesterday(item.time));
					case 'three_days':
						return originalData.filter(item =>
							this.isWithinDays(item.time, 3) && !this.isToday(item.time) && !this.isYesterday(item.time)
						);
					case 'all':
					default:
						return originalData;
				}
			},

			// 标签筛选方法
			quickFilter(tagId) {
				console.log("选择的标签:", tagId);

				// 更新当前选中的标签
				this.activeTag = this.activeTag === tagId ? '' : tagId;

				// 如果取消了选中，显示所有数据
				if (this.activeTag === '') {
					this.pendingList = [...this.originalList];
					if (this.searchKey.trim()) {
						this.handleSearchInput({
							detail: {
								value: this.searchKey
							}
						});
					}
					return;
				}

				// 获取基于标签的过滤列表
				this.pendingList = this.getFilteredListByTag(this.activeTag);

				// 如果有搜索词，再根据搜索词过滤
				if (this.searchKey.trim()) {
					this.handleSearchInput({
						detail: {
							value: this.searchKey
						}
					});
				}

				// 提示筛选结果
				uni.showToast({
					title: `筛选结果: ${this.pendingList.length}条`,
					icon: 'none',
					duration: 1500
				});

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
					url: "/pages/site/approve_search"
				})
			},
			confirmFilter() {
				this.$emit('filter', this.urgencyValue)
				console.log('当前选中值2:', this.selectedStatus)
				// 根据所选择的内容进行筛选一下数据
				this.pendingList = this.originalList.filter(item => {
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
				this.showFilter = false
			},
			resetFilter() {
				this.selectedStatus = ''
				this.$emit('filter', '')
				// this.showFilter = false
			},
			handlePopupClose() {
				this.showFilter = false
				// 关闭时恢复原始值
				this.urgencyValue = this.cachedValue
			},
			urgencyChange(values) {
				console.log('当前选中值:', values)
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
				// 模拟API请求
				return new Promise((resolve, reject) => {
					setTimeout(() => {
						// 随机模拟成功或失败，实际项目中替换为真实API调用
						if (Math.random() > 0.1) {
							resolve({
								success: true
							})
						} else {
							reject(new Error('网络错误，请稍后再试'))
						}
					}, 1000) // 模拟网络延迟
				})
			},
			toggleSort() {
				// 使用动画标记和防抖
				if (this.isSorting) return;
				this.isSorting = true;
				
				// 添加排序提示
				uni.showLoading({
					title: '排序中...',
					mask: false
				});
				
				// 延迟执行避免UI阻塞
				setTimeout(() => {
					this.sortConfig.desc = !this.sortConfig.desc;
					this.sortedList();
					
					uni.hideLoading();
					this.isSorting = false;
				}, 50);
			},
			sortedList() {
				// 克隆数组后再排序
				const sortedArray = [...this.originalList].sort((a, b) => {
					const timeA = new Date(a.time).getTime();
					const timeB = new Date(b.time).getTime();
					return this.sortConfig.desc ? timeB - timeA : timeA - timeB;
				});
				
				// 有序地更新列表
				this.pendingList = sortedArray;
			},
			confirmTime(time) {
				console.log('筛选时间:', time)
				this.showTimePicker = false
			},
			isToday(dateString) {
				if (!dateString) return false;
				const today = new Date();
				const appointmentDate = new Date(dateString);
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
				
				const appointmentDate = new Date(dateString);
				return yesterday.getFullYear() === appointmentDate.getFullYear() && 
					   yesterday.getMonth() === appointmentDate.getMonth() && 
					   yesterday.getDate() === appointmentDate.getDate();
			},
			isWithinDays(dateString, days) {
				if (!dateString) return false;
				const date = new Date(dateString);
				const today = new Date();
				const diffTime = today.getTime() - date.getTime();
				const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
				
				// 确保不包括今天和昨天，且在指定天数范围内
				return diffDays > 1 && diffDays <= days;
			},
			getWaitingTime(timeStr) {
				if (!timeStr) return '';
				const appointmentTime = new Date(timeStr);
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
			formatAppointmentTime(timeStr) {
				if (!timeStr) return '';
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
				
				// 其他日期显示年月日和时间
				const year = date.getFullYear();
				const month = (date.getMonth() + 1).toString().padStart(2, '0');
				const day = date.getDate().toString().padStart(2, '0');
				const hours = date.getHours().toString().padStart(2, '0');
				const minutes = date.getMinutes().toString().padStart(2, '0');
				
				return `${year}-${month}-${day} ${hours}:${minutes}`;
			},
			handleSearchInput() {
				// 实时搜索逻辑已在watch中处理
			},
			handleSearch() {
				this.showSearchResults = false; // 隐藏实时搜索结果
				// 使用已过滤的列表作为结果
				this.pendingList = this.filteredList;

				// 显示搜索结果提示
				uni.showToast({
					title: `找到 ${this.pendingList.length} 条结果`,
					icon: 'none',
					duration: 2000
				});
			},
			quickFilter(tagId) {
				console.log("选择的标签:", tagId);

				// 清空搜索框
				this.searchKey = '';

				// 首先恢复原始数据
				const originalData = [...this.originalList];

				// 根据标签进行过滤
				switch (tagId) {
					case 'today':
						this.pendingList = originalData.filter(item => this.isToday(item.time));
						break;

					case 'yesterday':
						this.pendingList = originalData.filter(item => this.isYesterday(item.time));
						break;

					case 'three_days':
						this.pendingList = originalData.filter(item =>
							this.isWithinDays(item.time, 3) && !this.isToday(item.time) && !this.isYesterday(item.time)
						);
						break;

					case 'expiring':
						// 这里"即将超时"定义为预约时间在当前时间的未来24小时内
						const now = new Date();
						this.pendingList = originalData.filter(item => {
							const appointmentTime = new Date(item.time);
							const diffHours = (appointmentTime - now) / (1000 * 60 * 60);
							return diffHours > 0 && diffHours <= 24;
						});
						break;

					case 'all':
					default:
						this.pendingList = originalData; // 显示全部数据
						break;
				}

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
			resetFilter() {
				this.searchKey = '';
				this.activeTag = '';
				this.pendingList = [...this.originalList]; // 恢复原始列表

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
				console.log('点击的按钮:', optionItem, '索引:', optionIndex);

				// 根据索引获取正确的按钮配置
				const selectedOption = this.options[optionIndex];

				if (!selectedOption) {
					console.error('无效的选项索引:', optionIndex);
					return;
				}

				const actionType = selectedOption.type;
				const actionName = selectedOption.text;

				// 确保我们可以获取到必要的信息
				const index = this.pendingList.findIndex(item => item.id === optionItem.id);

				if (index === -1) {
					console.error('无法找到对应的列表项:', optionItem);
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
					console.error('处理操作时出错:', error);
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

				// 总数量
				this.totalStats.count = originalData.length;

				// 今日数量
				this.totalStats.today = originalData.filter(item => this.isToday(item.time)).length;

				// 昨日数量
				this.totalStats.yesterday = originalData.filter(item => this.isYesterday(item.time)).length;

				// 近三日数量
				this.totalStats.threeDays = originalData.filter(item =>
					this.isWithinDays(item.time, 3) && !this.isToday(item.time) && !this.isYesterday(item.time)
				).length;

				// 计算今日较昨日变化百分比
				if (this.totalStats.yesterday > 0) {
					this.totalStats.todayPercent = Math.round(
						((this.totalStats.today - this.totalStats.yesterday) / this.totalStats.yesterday) * 100
					);
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
				console.log('审核:', item);
				// 这里可以添加审核逻辑
			},
			// 新增搜索框相关方法
			onSearchFocus() {
				console.log('搜索框获得焦点');
			},
			onSearchBlur() {
				console.log('搜索框失去焦点');
			},
			onSearchInputChange(e) {
				// 处理input事件，将其转换为与原来handleSearchInput兼容的格式
				const value = e.target.value || '';
				this.searchKey = value;
				this.handleSearchInput({ detail: { value } });
			},
			clearSearch() {
				this.searchKey = '';
				this.handleSearchInput({ detail: { value: '' } });
				uni.showToast({
					title: '已清空搜索',
					icon: 'none',
					duration: 1000
				});
			},
			// 判断是否是新能源车牌
			isNewEnergyPlate(plateNumber) {
				return plateNumber && plateNumber.length === 8;
			}
		}
	};
</script>

<style lang="scss" scoped>
	/* 搜索区域整体优化 */
	.filter-container {
		display: flex;
		flex-direction: column;
		padding: 24rpx 16rpx;
		background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
		border-radius: 20rpx;
		box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
		margin: 20rpx 8rpx;
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
		width: 130rpx;
		height: 84rpx;
		border-radius: 20rpx;
		background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
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
		background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
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

	.search-button {
		height: 84rpx;
		width: 140rpx;
		background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
		box-shadow: 0 4rpx 16rpx rgba(96, 165, 250, 0.25);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		cursor: pointer;
		position: relative;
		overflow: hidden;
		flex-shrink: 0;
	}

	.search-button::before {
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

	.search-button:hover {
		transform: translateY(-2rpx);
		box-shadow: 0 6rpx 20rpx rgba(96, 165, 250, 0.35);
	}

	.search-button:hover::before {
		opacity: 1;
	}

	.search-button:active {
		transform: translateY(0);
		box-shadow: 0 4rpx 12rpx rgba(96, 165, 250, 0.25);
	}

	.button-emoji {
		font-size: 24rpx;
		line-height: 1;
	}

	.search-text {
		color: #ffffff;
		font-size: 30rpx;
		font-weight: 500;
		letter-spacing: 0.8rpx;
		white-space: nowrap;
	}

	/* 移除了旧的搜索框样式，已被新的现代化样式替代 */

	/* 添加可选的快捷筛选标签区域 */
	.quick-filter {
		display: flex;
		flex-wrap: wrap;
		gap: 16rpx;
		margin-top: 16rpx;
		padding-top: 16rpx;
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
		margin-top: -15px;
		padding: 8rpx;
		min-height: 200rpx;
		/* 根据实际内容调整一个合适的最小高度 */
		position: relative;
	}

	.list-item {
		margin-bottom: 16rpx !important;
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
		margin: 14rpx;
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

	.list-item {
		margin: 30rpx 0;
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
		}
	}

	/* 地址样式 */
	.address-row {
		display: flex;
		align-items: center;
		margin-bottom: 12px;
	}

	.address {
		font-size: 14px;
		color: #606266;
		margin-left: 6px;
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

	.v1 {
		width: 92.5%;
		height: 122px;
		margin-left: 15px;
		margin-top: 20px;
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
		margin: 20rpx 16rpx;
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
</style>