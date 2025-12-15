<template>
	<view class="visitor-query-container">
		<!-- 头部信息卡片 -->
		<view class="header-card">
			<view class="user-info">
				<view class="avatar">
					<text class="avatar-text">访</text>
				</view>
				<view class="user-details">
					<view class="username">{{ userInfo.nickname || '访客用户' }}</view>
					<view class="phone">{{ userInfo.phone || '' }}</view>
				</view>
			</view>
			<view class="status-badge" :class="statusClass">
				{{ applicationStatusText }}
			</view>
		</view>

		<!-- 访客申请状态卡片 -->
		<view class="application-card">
			<view class="card-header">
				<view class="card-title">
					<text class="icon">📋</text>
					<text>访客申请状态</text>
				</view>
			</view>
			<view class="application-content">
				<view class="application-item">
					<text class="label">申请状态：</text>
					<text class="value" :class="statusClass">{{ applicationStatusText }}</text>
				</view>
				<view class="application-item" v-if="applicationTime">
					<text class="label">申请时间：</text>
					<text class="value">{{ applicationTime }}</text>
				</view>
				<view class="application-item" v-if="approvalTime">
					<text class="label">审核时间：</text>
					<text class="value">{{ approvalTime }}</text>
				</view>
				<!-- <view class="application-item" v-if="validPeriod">
					<text class="label">有效期限：</text>
					<text class="value">{{ validPeriod }}</text>
				</view> -->
			</view>
		</view>

		<!-- 搜索栏 -->
		<view class="search-container">
			<view class="search-box">
				<input 
					class="search-input" 
					v-model="searchKeyword" 
					:placeholder="currentTab === 'application' ? '搜索姓名、地址、原因...' : '搜索车牌号、地址、用途...'"
					@input="handleSearch"
					@confirm="performSearch"
				/>
				<view class="search-icon" @click="performSearch">
					<text>🔍</text>
				</view>
			</view>
		</view>

		<!-- Tab切换 -->
		<view class="tab-container">
			<view class="tab-list">
				<view 
					class="tab-item" 
					:class="{ active: currentTab === 'application' }"
					@click="switchTab('application')"
				>
					<text class="tab-icon">📋</text>
					<text class="tab-text">申请记录</text>
					<view class="tab-badge" v-if="filteredRecords.length > 0">{{ filteredRecords.length }}</view>
				</view>
				<view 
					class="tab-item" 
					:class="{ active: currentTab === 'reservation' }"
					@click="switchTab('reservation')">
					<text class="tab-icon">📅</text>
					<text class="tab-text">预约记录</text>
					<view class="tab-badge" v-if="filteredReservations.length > 0">{{ filteredReservations.length }}</view>
				</view>
			</view>
		</view>

		<!-- 记录标题 -->
		<view class="records-header">
			<view class="records-title">
				<text class="icon">{{ currentTab === 'application' ? '📋' : '📅' }}</text>
				<text>{{ currentTab === 'application' ? '我的申请记录' : '我的预约记录' }}</text>
			</view>
			<view class="records-count">
				共 {{ currentTab === 'application' ? filteredRecords.length : filteredReservations.length }} 条记录
			</view>
		</view>

		<!-- 加载状态 -->
		<view class="loading-container" v-if="loading">
			<view class="loading-icon">⏳</view>
			<view class="loading-text">{{ loadingText }}</view>
		</view>

		<!-- 申请记录列表 -->
		<view class="records-list" v-else-if="currentTab === 'application' && filteredRecords.length > 0">
			<view 
				class="record-item" 
				v-for="(record, index) in filteredRecords" 
				:key="index"
				@click="viewRecordDetail(record)"
			>
				<view class="record-header">
					<view class="record-time">{{ formatDate(record.time) }}</view>
					<view class="record-status" :class="'status-' + record.status">
						{{ record.statusText || record.status }}
					</view>
				</view>
				<view class="record-content">
					<!-- <view class="record-row">
						<text class="record-label">申请编号：</text>
						<text class="record-value">{{ record.applicationId }}</text>
					</view> -->
					<!-- <view class="record-row">
						<text class="record-label">申请人：</text>
						<text class="record-value">{{ record.applicantName }}</text>
					</view> -->
					<!-- <view class="record-row">
						<text class="record-label">车牌号：</text>
						<text class="record-value plate-number">{{ record.plateNumber }}</text>
					</view> -->
					<view class="record-row" v-if="record.phone">
						<text class="record-label">手机号：</text>
						<text class="record-value">{{ record.phone }}</text>
					</view>
					<view class="record-row" v-if="record.addressDetail">
						<text class="record-label">访问地址：</text>
						<text class="record-value">{{ record.addressDetail }}</text>
					</view>
					<view class="record-row" v-if="record.reason">
						<text class="record-label">申请原因：</text>
						<text class="record-value">{{ record.reason }}</text>
					</view>
					<view class="record-row" v-if="record.approver">
						<text class="record-label">审核人：</text>
						<text class="record-value">{{ record.approver }}</text>
					</view>
					<!-- <view class="record-row" v-if="record.entryTime">
						<text class="record-label">进场时间：</text>
						<text class="record-value">{{ formatDateTime(record.entryTime) }}</text>
					</view>
					<view class="record-row" v-if="record.exitTime">
						<text class="record-label">离场时间：</text>
						<text class="record-value">{{ formatDateTime(record.exitTime) }}</text>
					</view> -->
				</view>
			</view>
		</view>

		<!-- 预约记录列表 -->
		<view class="records-list" v-else-if="currentTab === 'reservation' && filteredReservations.length > 0">
			<view 
				class="reservation-item" 
				v-for="(reservation, index) in filteredReservations" 
				:key="index"
				@click="viewReservationDetail(reservation)"
			>
				<!-- 预约记录卡片头部 -->
				<view class="reservation-header">
				<!-- 	<view class="reservation-type">
						<text class="type-icon">{{ getReservationTypeIcon(reservation) }}</text>
						<text class="type-text">{{ getReservationTypeText(reservation) }}</text>
					</view> -->
					<view class="reservation-time">{{ formatDate(reservation.reservationTime) }}</view>
					<view class="reservation-status" :class="'status-' + reservation.status">
						{{ reservation.statusText || reservation.status }}
					</view>
				</view>
				
				<!-- 预约记录卡片内容 -->
				<view class="reservation-content">
					<!-- 车牌号显示区域 -->
					<view class="plate-section">
						<text class="section-icon">🚗</text>
						<view class="plate-number" :class="isNewEnergyPlate(reservation.plateNumber) ? 'green-plate' : 'blue-plate'">
							{{ reservation.plateNumber || '未知车牌' }}
						</view>
					</view>
					
					<!-- 预约时间段区域 -->
					<view class="contact-section">
						<view class="contact-row">
							<text class="contact-icon">⏰</text>
							<text class="contact-label">预约时间：</text>
							<text class="contact-value" :class="{ 'time-pending': getReservationTimeDisplay(reservation) === '时间待确认' }">{{ getReservationTimeDisplay(reservation) }}</text>
						</view>
					</view>
					
					<!-- 地址信息区域 -->
					<view class="address-section" v-if="reservation.visitAddress">
						<view class="address-row">
							<text class="address-icon">📍</text>
							<text class="address-label">访问地址：</text>
							<text class="address-value">{{ reservation.visitAddress }}</text>
						</view>
					</view>
					
					<!-- 预约详情区域 -->
					<view class="reservation-details">
						<view class="detail-row" v-if="reservation.purpose">
							<text class="detail-icon">📝</text>
							<text class="detail-label">预约原因：</text>
							<text class="detail-value">{{ reservation.purpose }}</text>
						</view>
						<view class="detail-row" v-if="reservation.contactPerson">
							<text class="detail-icon">👤</text>
							<text class="detail-label">联系人：</text>
							<text class="detail-value">{{ reservation.contactPerson }}</text>
						</view>
						<view class="detail-row" v-if="reservation.expectedTime">
							<text class="detail-icon">⏰</text>
							<text class="detail-label">预约时间：</text>
							<text class="detail-value">{{ formatDateTime(reservation.expectedTime) }}</text>
						</view>
					</view>
					
					<!-- 进出场记录区域 -->
					<view class="entry-exit-section" v-if="reservation.actualEntryTime || reservation.actualExitTime">
						<view class="section-title">
							<text class="title-icon">🚗</text>
							<text class="title-text">进出场记录</text>
						</view>
						<view class="entry-exit-details">
							<view class="entry-exit-row" v-if="reservation.actualEntryTime">
								<view class="entry-dot"></view>
								<text class="entry-exit-label">实际进场：</text>
								<text class="entry-exit-value">{{ formatDateTime(reservation.actualEntryTime) }}</text>
							</view>
							<view class="entry-exit-row" v-if="reservation.actualExitTime">
								<view class="exit-dot"></view>
								<text class="entry-exit-label">实际离场：</text>
								<text class="entry-exit-value">{{ formatDateTime(reservation.actualExitTime) }}</text>
							</view>
							<view class="duration-row" v-if="reservation.actualEntryTime && reservation.actualExitTime && reservation.duration">
								<text class="duration-icon">⏱️</text>
								<text class="duration-label">停留时长：</text>
								<view class="duration-chip">{{ reservation.duration }}</view>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 空状态 -->
		<view class="empty-state" v-else>
			<view class="empty-icon">{{ currentTab === 'application' ? '📝' : '📅' }}</view>
			<view class="empty-title">{{ currentTab === 'application' ? '暂无申请记录' : '暂无预约记录' }}</view>
			<view class="empty-desc">
				{{ currentTab === 'application' ? '您还没有任何访客申请记录，点击下方按钮开始申请' : '您还没有任何预约记录，预约功能即将开放' }}
			</view>
			<view class="empty-action" v-if="currentTab === 'application'">
				<button class="create-appointment-btn" @click="goToReservation">
					立即申请
				</button>
			</view>
		</view>

		<!-- 自定义TabBar（访客角色不显示） -->
		<custom-tabbar 
			v-if="currentUserRole !== 'visitor'"
			:userRole="currentUserRole" 
			@tabChange="onTabChange">
		</custom-tabbar>
	</view>
</template>

<script>
	import CustomTabbar from '@/components/custom-tabbar.vue'
	
	export default {
		components: {
			CustomTabbar
		},
		data() {
			return {
				currentUserRole: 'visitor',
				searchKeyword: '',
				userInfo: {},
				applicationStatus: 'approved', // pending, approved, rejected
				applicationTime: '',
				approvalTime: '',
				validPeriod: '',
				
				// 从后端visitor_application表查询的真实数据
				allRecords: [],
				filteredRecords: [],
				
				// 预约记录数据
				allReservations: [],
				filteredReservations: [],
				
				// 当前选中的Tab (application: 申请记录, reservation: 预约记录)
				currentTab: 'application',
				
				// 加载状态
				loading: false,
				loadingText: '加载中...'
			}
		},
		
		computed: {
			applicationStatusText() {
				const statusMap = {
					'pending': '待审核',
					'approved': '已通过',
					'rejected': '已拒绝'
				};
				return statusMap[this.applicationStatus] || '未知状态';
			},
			
			statusClass() {
				return `status-${this.applicationStatus}`;
			}
		},
		
		onLoad() {
			this.initUserInfo();
			this.loadApplicationStatus();
			// 不在这里调用loadRecords，在onShow中调用，避免重复
			
			// 监听TabBar状态更新事件
			uni.$on('updateTabBarIndex', (index) => {
				console.log('📨 [访客查询页面] 收到TabBar状态更新:', index);
			});
		},
		

		
		onShow() {
			// 重新加载数据（用户可能在其他页面提交了新申请）
			this.loadRecords();
			this.loadReservations();
			
			// 页面显示时通知TabBar检查当前页面
			this.$nextTick(() => {
				console.log('📱 [访客查询页面] 页面显示，当前角色:', this.currentUserRole);
				// 通知TabBar同步状态（让TabBar自动检测当前页面索引）
				uni.$emit('syncTabBarState');
			});
		},
		
		// 下拉刷新
		onPullDownRefresh() {
			console.log('📱 [访客查询页面] 下拉刷新');
			// 同时刷新申请记录和预约记录
			this.loadRecords();
			this.loadReservations();
			
			// 延迟停止下拉刷新
			setTimeout(() => {
				uni.stopPullDownRefresh();
			}, 1000);
		},
		
		onUnload() {
			// 清理事件监听
			uni.$off('updateTabBarIndex');
		},
		
		methods: {
			// iOS兼容的日期解析方法
			parseDate(dateString) {
				if (!dateString) return null;
				try {
					// 将 "YYYY-MM-DD HH:mm:ss" 格式转换为 "YYYY/MM/DD HH:mm:ss" 以兼容iOS
					const formattedDate = dateString.replace(/-/g, '/');
					const date = new Date(formattedDate);
					if (isNaN(date.getTime())) {
						console.warn('日期解析失败:', dateString);
						return null;
					}
					return date;
				} catch (error) {
					console.error('日期解析错误:', error, dateString);
					return null;
				}
			},

			// 初始化用户信息
			initUserInfo() {
				try {
					const userInfo = uni.getStorageSync('userInfo');
					console.log('📱 [访客查询页面] 获取存储的用户信息:', userInfo);
					
					if (userInfo) {
						// 检查数据结构，适配不同的存储格式
						if (userInfo.phone) {
							// 直接存储格式：{ phone: "13593527970", role: "visitor", ... }
							this.userInfo = userInfo;
							this.currentUserRole = userInfo.role || 'visitor';
						} else if (userInfo.userInfo) {
							// 嵌套格式：{ userInfo: { phone: "13593527970" }, role: "visitor" }
							this.userInfo = userInfo.userInfo;
							this.currentUserRole = userInfo.role || 'visitor';
						} else {
							console.warn('📱 [访客查询页面] 用户信息格式不符合预期:', userInfo);
							this.userInfo = {};
							this.currentUserRole = 'visitor';
						}
						
						console.log('📱 [访客查询页面] 解析后的用户信息:', {
							phone: this.userInfo.phone,
							nickname: this.userInfo.nickname,
							role: this.currentUserRole
						});
					} else {
						console.warn('📱 [访客查询页面] 未找到用户信息');
						this.userInfo = {};
						this.currentUserRole = 'visitor';
					}
				} catch (error) {
					console.error('📱 [访客查询页面] 获取用户信息失败:', error);
					this.userInfo = {};
					this.currentUserRole = 'visitor';
				}
			},
			
			// 加载申请状态
			loadApplicationStatus() {
				try {
					const userInfo = uni.getStorageSync('userInfo');
					console.log('📱 [访客查询页面] 加载申请状态，用户信息:', userInfo);
					
					if (userInfo) {
						// 根据用户角色和状态设置申请状态
						if (userInfo.isAuthorized || userInfo.role === 'visitor') {
							this.applicationStatus = 'approved';
						} else {
							this.applicationStatus = userInfo.applicationStatus || 'pending';
						}
						
						// 设置申请时间数据
						this.applicationTime = '2025-06-20 10:30';
						if (this.applicationStatus === 'approved') {
							this.approvalTime = '2025-06-20 15:45';
							this.validPeriod = '2025-06-20 至 2025-12-20';
						}
						
						console.log('📱 [访客查询页面] 申请状态设置为:', this.applicationStatus);
					}
				} catch (error) {
					console.error('📱 [访客查询页面] 加载申请状态失败:', error);
					this.applicationStatus = 'approved'; // 默认设置为已通过
				}
			},
			
			// 加载申请记录
			async loadRecords() {
				// 再次确认用户信息
				if (!this.userInfo.phone) {
					console.warn('📱 [访客查询页面] 用户手机号为空，重新初始化用户信息');
					this.initUserInfo();
				}
				
				const currentUserPhone = this.userInfo.phone;
				if (!currentUserPhone) {
					console.warn('📱 [访客查询页面] 用户手机号为空，无法查询记录');
					console.log('📱 [访客查询页面] 当前用户信息:', this.userInfo);
					
					uni.showModal({
						title: '无法获取用户信息',
						content: '请重新登录',
						showCancel: false,
						confirmText: '重新登录',
						success: (res) => {
							if (res.confirm) {
								// 跳转到登录页面
								uni.navigateTo({
									url: '/pages/auth/phone-auth'
								});
							}
						}
					});
					return;
				}
				
				this.loading = true;
				this.loadingText = '正在查询申请记录...';
				
				try {
					console.log('📱 [访客查询页面] 开始查询用户申请记录，手机号:', currentUserPhone);
					
					// 获取全局配置的baseUrl
					const app = getApp();
					const baseUrl = app.globalData?.baseUrl || 'http://localhost:8543';
					
					console.log('📱 [访客查询页面] 使用的API地址:', baseUrl);
					
					// 调用后端API查询visitor_application表和关联的预约信息
					// 目前使用单个状态查询接口，将来可以切换到列表接口
					// TODO: 等后端添加 /parking/visitor/records 接口后，可以切换到该接口获取完整记录列表
					
					const useRecordsAPI = true; // 使用records接口获取所有申请记录
					const apiUrl = useRecordsAPI ? 
						`${baseUrl}/parking/visitor/records` : 
						`${baseUrl}/parking/visitor/status`;
					
					const response = await uni.request({
						url: apiUrl,
						method: 'GET',
						data: {
							phone: currentUserPhone
						},
						header: {
							'Content-Type': 'application/json'
						},
						timeout: 10000 // 10秒超时
					});
					
					console.log('📱 [访客查询页面] API响应:', response);
					console.log('📱 [访客查询页面] response.data:', response.data);
					console.log('📱 [访客查询页面] response.data.data:', response.data.data);
					
					// 后端返回格式：{ code: "0", msg: "成功", data: {...} }
					// code为"0"表示成功
					if (response.statusCode === 200 && response.data.code === "0") {
						let responseData = response.data.data;
						
						// 检查是否有嵌套的data结构
						if (responseData && responseData.data && responseData.hasOwnProperty('code')) {
							console.log('📱 [访客查询页面] 发现嵌套结构，使用 responseData.data');
							responseData = responseData.data;
						}
						
						console.log('📱 [访客查询页面] 最终使用的响应数据:', responseData);
						
						if (useRecordsAPI) {
							// 使用新的records接口，返回记录数组
							if (Array.isArray(responseData) && responseData.length > 0) {
								this.allRecords = this.processRecordsData(responseData);
								this.filteredRecords = [...this.allRecords];
								
								// 按申请时间倒序排列
								this.filteredRecords.sort((a, b) => {
									const timeA = this.parseDate(a.applicationTime || a.time);
									const timeB = this.parseDate(b.applicationTime || b.time);
									if (!timeA || !timeB) return 0;
									return timeB - timeA;
								});
								
								// 根据最新的申请记录设置整体申请状态
								if (this.filteredRecords.length > 0) {
									const latestRecord = this.filteredRecords[0]; // 最新的申请记录
									this.applicationStatus = latestRecord.status;
									this.applicationTime = latestRecord.applicationTime;
									this.approvalTime = latestRecord.approvalTime;
									
									console.log('📱 [访客查询页面] 根据最新记录设置申请状态:', {
										status: this.applicationStatus,
										latestApplicationNo: latestRecord.applicationId,
										applicationTime: this.applicationTime
									});
								}
								
								console.log('✅ [访客查询页面] 查询成功，记录数量:', this.filteredRecords.length);
							} else {
								// 没有申请记录
								this.allRecords = [];
								this.filteredRecords = [];
								console.log('📝 [访客查询页面] 用户暂无申请记录');
							}
						} else {
							// 使用现有的status接口，返回单个申请状态
							if (responseData && responseData.hasApplication) {
								// 将单个申请状态转换为记录格式
								const singleRecord = this.processSingleApplicationStatus(responseData);
								this.allRecords = [singleRecord];
								this.filteredRecords = [...this.allRecords];
								
								console.log('✅ [访客查询页面] 查询成功，找到申请记录:', this.filteredRecords[0]);
							} else {
								// 没有申请记录
								this.allRecords = [];
								this.filteredRecords = [];
								console.log('📝 [访客查询页面] 用户暂无申请记录');
							}
						}
						
						if (this.filteredRecords.length === 0) {
							uni.showToast({
								title: '暂无申请记录',
								icon: 'none',
								duration: 2000
							});
						}
					} else {
						console.error('❌ [访客查询页面] API响应错误:', response.data);
						const errorMsg = response.data.msg || response.data.message || '查询失败';
						throw new Error(errorMsg);
					}
				} catch (error) {
					console.error('❌ [访客查询页面] 查询申请记录失败:', error);
					
					// 清空记录数据
					this.allRecords = [];
					this.filteredRecords = [];
					
					uni.showModal({
						title: '查询失败',
						content: `无法获取申请记录：${error.message || '网络错误'}\n\n请检查：\n1. 网络连接是否正常\n2. 后端服务是否启动\n3. API地址是否正确`,
						showCancel: false,
						confirmText: '重试',
						success: (res) => {
							if (res.confirm) {
								this.loadRecords();
							}
						}
					});
				} finally {
					this.loading = false;
				}
			},
			
			// 处理单个申请状态数据，转换为前端显示格式
			processSingleApplicationStatus(statusData) {
				console.log('📱 [访客查询页面] 处理申请状态数据:', statusData);
				
				// 状态映射
				const statusMap = {
					'待审批': { status: 'pending', statusText: '待审核' },
					'已通过': { status: 'approved', statusText: '已通过' },
					'未通过': { status: 'rejected', statusText: '未通过' }
				};
				
				const statusInfo = statusMap[statusData.status] || { status: 'pending', statusText: '待审核' };
				
				const result = {
					// 申请信息
					applicationId: statusData.applicationNo || 'VA' + Date.now(),
					applicantName: statusData.nickname || statusData.name || this.userInfo.nickname || '访客用户',
					phone: statusData.phone || this.userInfo.phone,
					gender: statusData.gender || '',
					
					// 访问信息
					plateNumber: statusData.plateNumber || '',
					addressDetail: statusData.fullAddress || '',
					reason: statusData.reason || '',
					
					// 时间信息
					time: statusData.submitTime || statusData.applicationTime,
					applicationTime: statusData.submitTime || statusData.applicationTime,
					approvalTime: statusData.auditTime || statusData.approvalTime,
					
					// 审核信息  
					...statusInfo,
					approver: statusData.auditUser || statusData.approver || '',
					remark: statusData.remark || '',
					rejectReason: statusData.rejectReason || '',
					
					// 停车信息（暂时为空，因为现有接口不提供）
					entryTime: statusData.entryTime || '',
					exitTime: statusData.exitTime || '',
					duration: statusData.duration || '',
					
					// 预约相关信息（暂时为空）
					reservationId: statusData.reservationId || '',
					reservationTime: statusData.reservationTime || '',
					reservationStatus: statusData.reservationStatus || '',
					
					// 原始数据（用于调试）
					_raw: statusData
				};
				
				console.log('📱 [访客查询页面] 处理后的记录数据:', result);
				return result;
			},
			
			// 处理后端返回的数据，转换为前端显示格式（用于records接口）
			processRecordsData(records) {
				console.log('📱 [访客查询页面] 处理记录数组数据:', records);
				
				return records.map(record => {
					// 状态映射
					const statusMap = {
						'待审批': { status: 'pending', statusText: '待审核' },
						'已通过': { status: 'approved', statusText: '已通过' },
						'未通过': { status: 'rejected', statusText: '未通过' },
						'PENDING': { status: 'pending', statusText: '待审核' },
						'APPROVED': { status: 'approved', statusText: '已通过' },
						'REJECTED': { status: 'rejected', statusText: '未通过' }
					};
					
					const statusInfo = statusMap[record.auditstatus] || statusMap[record.status] || { status: 'pending', statusText: '待审核' };
					
					// 计算停车时长
					let duration = '';
					if (record.entryTime && record.exitTime) {
						const entryDate = this.parseDate(record.entryTime);
						const exitDate = this.parseDate(record.exitTime);
						if (entryDate && exitDate) {
							const diffMs = exitDate - entryDate;
							const hours = Math.floor(diffMs / (1000 * 60 * 60));
							const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
							duration = hours > 0 ? `${hours}小时${minutes}分钟` : `${minutes}分钟`;
						}
					}
					
					const result = {
						// 申请信息
						applicationId: record.applicationNo || record.id || 'VA' + Date.now(),
						applicantName: record.nickname || record.name || this.userInfo.nickname || '访客用户',
						phone: record.phone || this.userInfo.phone,
						gender: record.gender || '',
						
						// 访问信息
						plateNumber: record.plateNumber || '',
						addressDetail: record.fullAddress || record.address || '',
						reason: record.reason || '',
						
						// 时间信息
						time: record.applydate || record.createTime,
						applicationTime: record.applydate || record.createTime,
						approvalTime: record.auditdate || record.auditTime,
						
						// 审核信息  
						...statusInfo,
						approver: record.auditusername || record.auditor || '',
						remark: record.remark || '',
						rejectReason: record.refusereason || record.rejectReason || '',
						
						// 停车信息（如果有关联的预约记录）
						entryTime: record.entryTime || '',
						exitTime: record.exitTime || '',
						duration: duration,
						
						// 预约相关信息
						reservationId: record.reservationId || '',
						reservationTime: record.reservationTime || '',
						reservationStatus: record.reservationStatus || '',
						
						// 原始数据（用于调试）
						_raw: record
					};
					
					console.log('📱 [访客查询页面] 处理后的单条记录:', result);
					return result;
				});
			},
			
			// 加载预约记录（调用真实API）
			async loadReservations() {
				console.log('📅 [访客查询页面] 加载预约记录');
				
				// 再次确认用户信息
				if (!this.userInfo.phone) {
					console.warn('📅 [访客查询页面] 用户手机号为空，重新初始化用户信息');
					this.initUserInfo();
				}
				
				const currentUserPhone = this.userInfo.phone;
				if (!currentUserPhone) {
					console.warn('📅 [访客查询页面] 用户手机号为空，无法查询预约记录');
					this.allReservations = [];
					this.filteredReservations = [];
					return;
				}
				
				this.loading = true;
				this.loadingText = '正在查询预约记录...';
				
				try {
					console.log('📅 [访客查询页面] 开始查询用户预约记录，手机号:', currentUserPhone);
					
					const response = await uni.request({
						url: `http://localhost:8543/parking/appointment/listByPhone`,
						method: 'GET',
						data: {
							phone: currentUserPhone
						},
						header: {
							'Content-Type': 'application/json'
						},
						timeout: 15000
					});
					
					let apiResponse;
					if (response.statusCode === 200 && response.data) {
						apiResponse = response.data;
					} else {
						// 如果直接调用失败，尝试使用封装的API
						const { appointmentAPI } = await import('@/config/api.js');
						apiResponse = await appointmentAPI.getListByPhone(currentUserPhone);
					}
					
					// 检查API响应格式
					if (apiResponse && (apiResponse.code === "0" || apiResponse.code === 0 || apiResponse.code === "success")) {
						let appointmentData = apiResponse.data;
						
						// 处理后端返回的嵌套结构：{ data: { data: [...] } }
						if (appointmentData && appointmentData.data) {
							if (Array.isArray(appointmentData.data)) {
								appointmentData = appointmentData.data;
							} else if (appointmentData.data && appointmentData.data.data && Array.isArray(appointmentData.data.data)) {
								appointmentData = appointmentData.data.data;
							} else {
								appointmentData = [];
							}
						} else if (!Array.isArray(appointmentData)) {
							appointmentData = [];
						}
						
						if (Array.isArray(appointmentData) && appointmentData.length > 0) {
							// 转换后端数据格式为前端显示格式
							this.allReservations = this.processReservationData(appointmentData);
							this.filteredReservations = [...this.allReservations];
							
							// 按预约时间倒序排列
							this.filteredReservations.sort((a, b) => {
								const timeA = new Date(a.reservationTime || a.recorddate);
								const timeB = new Date(b.reservationTime || b.recorddate);
								return timeB - timeA;
							});
							
							console.log('✅ [访客查询页面] 预约记录加载完成，数量:', this.filteredReservations.length);
							
							uni.showToast({
								title: `找到${this.filteredReservations.length}条预约记录`,
								icon: 'success',
								duration: 2000
							});
						} else {
							// 没有预约记录
							this.allReservations = [];
							this.filteredReservations = [];
							console.log('📅 [访客查询页面] 用户暂无预约记录');
							
							uni.showToast({
								title: '暂无预约记录',
								icon: 'none',
								duration: 2000
							});
						}
					} else {
						console.error('❌ [访客查询页面] API响应错误:', apiResponse);
						throw new Error(apiResponse?.msg || apiResponse?.message || '查询失败');
					}
				} catch (error) {
					console.error('❌ [访客查询页面] 查询预约记录失败:', error);
					
					// 清空预约记录数据
					this.allReservations = [];
					this.filteredReservations = [];
					
					const errorMsg = error.message || '网络错误';
					
					// 显示错误提示
					uni.showModal({
						title: '查询失败',
						content: `无法获取预约记录：${errorMsg}\n\n请检查网络连接或重试`,
						showCancel: true,
						cancelText: '取消',
						confirmText: '重试',
						success: (res) => {
							if (res.confirm) {
								this.loadReservations();
							}
						}
					});
				} finally {
					this.loading = false;
				}
			},
			
			// 处理后端预约数据，转换为前端显示格式
			processReservationData(reservations) {
				console.log('📅 [访客查询页面] 处理预约数据:', reservations);
				
				return reservations.map(appointment => {
					console.log('📅 [访客查询页面] 处理单条预约数据:', appointment);
					console.log('📅 [访客查询页面] visitdate字段值:', appointment.visitdate);
					
					// 状态映射
					const statusMap = {
						// 审核状态映射
						'待审批': { status: 'pending', statusText: '待审核' },
						'已通过': { status: 'approved', statusText: '已通过' },
						'不审核': { status: 'approved', statusText: '免审核' },
						'未通过': { status: 'rejected', statusText: '未通过' },
						
						// 场地状态映射
						'待入场': { status: 'waiting', statusText: '待入场' },
						'已入场': { status: 'active', statusText: '进行中' },
						'已离场': { status: 'completed', statusText: '已完成' },
						'未进场': { status: 'cancelled', statusText: '已取消' },
						
						// 通用状态映射
						'有效': { status: 'active', statusText: '有效' },
						'无效': { status: 'cancelled', statusText: '无效' }
					};
					
					// 优先使用场地状态，其次使用审核状态
					const currentStatus = appointment.venuestatus || appointment.auditstatus || appointment.status || '待审核';
					const statusInfo = statusMap[currentStatus] || { status: 'pending', statusText: currentStatus };
					
					// 构建访问地址
					let visitAddress = '';
					if (appointment.province && appointment.city && appointment.district) {
						visitAddress = `${appointment.province}${appointment.city}${appointment.district}`;
						if (appointment.community) {
							visitAddress += appointment.community;
						}
						if (appointment.building) {
							visitAddress += `${appointment.building}栋`;
						}
						if (appointment.units) {
							visitAddress += `${appointment.units}单元`;
						}
						if (appointment.floor) {
							visitAddress += `${appointment.floor}楼`;
						}
						if (appointment.room) {
							visitAddress += `${appointment.room}室`;
						}
					}
					
					// 计算停车时长
					let duration = '';
					if (appointment.arrivedate && appointment.leavedate) {
						const entryDate = new Date(appointment.arrivedate);
						const exitDate = new Date(appointment.leavedate);
						const diffMs = exitDate - entryDate;
						const hours = Math.floor(diffMs / (1000 * 60 * 60));
						const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
						if (hours > 0) {
							duration = `${hours}小时${minutes}分钟`;
						} else {
							duration = `${minutes}分钟`;
						}
					}
					
					const result = {
						// 预约基本信息
						reservationId: appointment.ordernumber || appointment.id || 'R' + Date.now(),
						reservationTime: appointment.recorddate,
						
						// 联系信息
						phone: appointment.visitorphone || appointment.ownerphone || appointment.phone || this.userInfo.phone,
						plateNumber: appointment.platenumber,
						
						// 地址和用途
						visitAddress: visitAddress,
						purpose: appointment.visitreason,
						contactPerson: appointment.ownername || appointment.auditusername || '',
						
						// 时间信息
						expectedTime: appointment.visitdate,
						actualEntryTime: appointment.arrivedate,
						actualExitTime: appointment.leavedate,
						
						// 状态信息
						...statusInfo,
						duration: duration,
						
						// 其他信息
						carType: appointment.cartype,
						appointType: appointment.appointtype,
						remark: appointment.refusereason || '',
						
						// 审核信息
						auditStatus: appointment.auditstatus,
						auditTime: appointment.auditdate,
						auditor: appointment.auditusername,
						
						// 原始数据（用于调试）
						_raw: appointment
					};
					
					console.log('📅 [访客查询页面] 处理后的预约记录:', result);
					console.log('📅 [访客查询页面] expectedTime字段值:', result.expectedTime);
					console.log('📅 [访客查询页面] reservationTime字段值:', result.reservationTime);
					return result;
				});
			},
			
			// 切换Tab
			switchTab(tab) {
				console.log('📱 [访客查询页面] 切换Tab:', tab);
				this.currentTab = tab;
				
				// 清空搜索关键词
				this.searchKeyword = '';
				
				// 重置过滤结果
				if (tab === 'application') {
					this.filteredRecords = [...this.allRecords];
				} else if (tab === 'reservation') {
					this.filteredReservations = [...this.allReservations];
				}
			},
			
			// 搜索处理
			handleSearch() {
				if (this.searchKeyword.trim() === '') {
					if (this.currentTab === 'application') {
						this.filteredRecords = [...this.allRecords];
					} else if (this.currentTab === 'reservation') {
						this.filteredReservations = [...this.allReservations];
					}
				} else {
					this.performSearch();
				}
			},
			
			// 执行搜索
			performSearch() {
				const keyword = this.searchKeyword.toLowerCase().trim();
				
				if (!keyword) {
					if (this.currentTab === 'application') {
						this.filteredRecords = [...this.allRecords];
					} else if (this.currentTab === 'reservation') {
						this.filteredReservations = [...this.allReservations];
					}
					return;
				}
				
				if (this.currentTab === 'application') {
					// 搜索申请记录
					this.filteredRecords = this.allRecords.filter(record => {
						return (
							record.applicationId.toLowerCase().includes(keyword) ||
							record.applicantName.toLowerCase().includes(keyword) ||
							record.plateNumber.toLowerCase().includes(keyword) ||
							record.phone.includes(keyword) ||
							record.addressDetail.toLowerCase().includes(keyword) ||
							record.reason.toLowerCase().includes(keyword) ||
							record.statusText.toLowerCase().includes(keyword) ||
							(record.approver && record.approver.toLowerCase().includes(keyword)) ||
							(record.remark && record.remark.toLowerCase().includes(keyword))
						);
					});
					
					uni.showToast({
						title: `找到 ${this.filteredRecords.length} 条申请记录`,
						icon: 'none',
						duration: 1500
					});
				} else if (this.currentTab === 'reservation') {
					// 搜索预约记录
					this.filteredReservations = this.allReservations.filter(reservation => {
						return (
							reservation.reservationId.toLowerCase().includes(keyword) ||
							reservation.plateNumber.toLowerCase().includes(keyword) ||
							reservation.phone.includes(keyword) ||
							reservation.visitAddress.toLowerCase().includes(keyword) ||
							reservation.purpose.toLowerCase().includes(keyword) ||
							reservation.contactPerson.toLowerCase().includes(keyword) ||
							reservation.statusText.toLowerCase().includes(keyword) ||
							(reservation.remark && reservation.remark.toLowerCase().includes(keyword))
						);
					});
					
					uni.showToast({
						title: `找到 ${this.filteredReservations.length} 条预约记录`,
						icon: 'none',
						duration: 1500
					});
				}
			},
			
			// 查看记录详情
			viewRecordDetail(record) {
				console.log('查看记录详情:', record);
				
				const statusEmoji = {
					'approved': '✅',
					'pending': '⏳', 
					'rejected': '❌'
				};
				
				let content = `📝 申请编号：${record.applicationId}\n`;
				content += `👤 申请人：${record.applicantName} (${record.gender})\n`;
				content += `📞 手机号：${record.phone}\n`;
				content += `🚗 车牌号：${record.plateNumber}\n`;
				content += `📍 访问地址：${record.addressDetail}\n`;
				content += `📝 申请原因：${record.reason}\n`;
				content += `⏰ 申请时间：${this.formatDateTime(record.applicationTime)}\n`;
				content += `${statusEmoji[record.status] || '📝'} 审核状态：${record.statusText}\n`;
				
				if (record.approvalTime) {
					content += `✅ 审核时间：${this.formatDateTime(record.approvalTime)}\n`;
				}
				if (record.approver) {
					content += `👨‍💼 审核人：${record.approver}\n`;
				}
				if (record.remark) {
					content += `📋 备注：${record.remark}\n`;
				}
				if (record.entryTime) {
					content += `🟢 进场时间：${this.formatDateTime(record.entryTime)}\n`;
				}
				if (record.exitTime) {
					content += `🔴 离场时间：${this.formatDateTime(record.exitTime)}\n`;
				}
				if (record.duration) {
					content += `⏱️ 停车时长：${record.duration}\n`;
				}
				if (record.rejectReason) {
					content += `⚠️ 拒绝原因：${record.rejectReason}`;
				}
				
				uni.showModal({
					title: '申请详情',
					content: content,
					showCancel: false,
					confirmText: '知道了'
				});
			},
			
			// 查看预约记录详情
			viewReservationDetail(reservation) {
				console.log('查看预约记录详情:', reservation);
				
				const statusEmoji = {
					'completed': '✅',
					'active': '🟢', 
					'waiting': '⏳',
					'approved': '✅',
					'cancelled': '❌',
					'rejected': '❌',
					'pending': '⏳'
				};
				
				let content = `📅 预约编号：${reservation.reservationId}\n`;
				content += `📞 手机号：${reservation.phone}\n`;
				content += `🚗 车牌号：${reservation.plateNumber}\n`;
				
				// 显示车辆类型（如果有）
				if (reservation.carType) {
					content += `🚙 车辆类型：${reservation.carType}\n`;
				}
				
				content += `📍 访问地址：${reservation.visitAddress}\n`;
				content += `📝 预约用途：${reservation.purpose}\n`;
				
				// 显示预约类型（如果有）
				if (reservation.appointType) {
					content += `📋 预约类型：${reservation.appointType}\n`;
				}
				
				if (reservation.contactPerson) {
					content += `👤 联系人：${reservation.contactPerson}\n`;
				}
				
				content += `⏰ 预约时间：${this.formatDateTime(reservation.reservationTime)}\n`;
				content += `⏱️ 预计时间：${this.formatDateTime(reservation.expectedTime)}\n`;
				content += `${statusEmoji[reservation.status] || '📝'} 预约状态：${reservation.statusText}\n`;
				
				// 显示审核信息（如果有）
				if (reservation.auditStatus && reservation.auditStatus !== reservation.statusText) {
					content += `🔍 审核状态：${reservation.auditStatus}\n`;
				}
				if (reservation.auditor) {
					content += `👨‍💼 审核人：${reservation.auditor}\n`;
				}
				if (reservation.auditTime) {
					content += `✅ 审核时间：${this.formatDateTime(reservation.auditTime)}\n`;
				}
				
				// 显示入场离场信息
				if (reservation.actualEntryTime) {
					content += `🟢 实际进场：${this.formatDateTime(reservation.actualEntryTime)}\n`;
				}
				if (reservation.actualExitTime) {
					content += `🔴 实际离场：${this.formatDateTime(reservation.actualExitTime)}\n`;
				}
				if (reservation.duration) {
					content += `⏱️ 停车时长：${reservation.duration}\n`;
				}
				
				// 显示备注或拒绝原因
				if (reservation.remark) {
					if (reservation.status === 'rejected' || reservation.status === 'cancelled') {
						content += `⚠️ 备注：${reservation.remark}`;
					} else {
						content += `📋 备注：${reservation.remark}`;
					}
				}
				
				uni.showModal({
					title: '预约详情',
					content: content,
					showCancel: false,
					confirmText: '知道了'
				});
			},
			
			// 前往预约页面
			goToReservation() {
				uni.switchTab({
					url: '/pagesA/reservation/form'
				});
			},
			
			// TabBar切换事件处理
			onTabChange(tabInfo) {
				console.log('📱 [访客查询页面] TabBar切换:', tabInfo);
			},
			
			// 格式化日期
			formatDate(dateTime) {
				if (!dateTime) return '';
				
				try {
					let dateStr = dateTime;
					
					// 检查是否是区间格式 "2025-12-28 08:00:00 - 2025-12-28 10:00:00"
					if (dateStr.includes(' - ')) {
						const times = dateStr.split(' - ');
						if (times.length === 2) {
							const startTime = times[0]; // "2025-12-28 08:00:00"
							
							// 解析开始时间
							const startDate = this.parseDate(startTime);
							if (!startDate) {
								console.error('开始时间解析失败:', startTime);
								return dateStr;
							}
							
							const month = String(startDate.getMonth() + 1).padStart(2, '0');
							const day = String(startDate.getDate()).padStart(2, '0');
							const hours = String(startDate.getHours()).padStart(2, '0');
							const minutes = String(startDate.getMinutes()).padStart(2, '0');
							
							return `${month}-${day} ${hours}:${minutes}`;
						}
					}
					
					// 处理单个时间格式（向后兼容）
					const date = this.parseDate(dateStr);
					if (!date) {
						console.error('单个时间解析失败:', dateStr);
						return dateStr;
					}
					
					const month = String(date.getMonth() + 1).padStart(2, '0');
					const day = String(date.getDate()).padStart(2, '0');
					const hours = String(date.getHours()).padStart(2, '0');
					const minutes = String(date.getMinutes()).padStart(2, '0');
					
					return `${month}-${day} ${hours}:${minutes}`;
				} catch (error) {
					console.error('日期格式化失败:', error, 'dateTime:', dateTime);
					return dateTime;
				}
			},
			
			// 格式化日期时间
			formatDateTime(dateTime) {
				if (!dateTime) return '';
				
				try {
					let dateStr = dateTime;
					
					// 检查是否是区间格式 "2025-12-28 08:00:00 - 2025-12-28 10:00:00"
					if (dateStr.includes(' - ')) {
						const times = dateStr.split(' - ');
						if (times.length === 2) {
							const startTime = times[0]; // "2025-12-28 08:00:00"
							const endTime = times[1];   // "2025-12-28 10:00:00"
							// 解析开始时间
							const startDate = this.parseDate(startTime);
							if (!startDate) {
								console.error('开始时间解析失败:', startTime);
								return dateStr;
							}
							// 提取时间段信息
							const year = startDate.getFullYear();
							const month = String(startDate.getMonth() + 1).padStart(2, '0');
							const day = String(startDate.getDate()).padStart(2, '0');
							// 提取开始和结束的时分
							const startHours = String(startDate.getHours()).padStart(2, '0');
							const startMinutes = String(startDate.getMinutes()).padStart(2, '0');
							const endDate = this.parseDate(endTime);
							if (!endDate) {
								console.error('结束时间解析失败:', endTime);
								return dateStr;
							}
							const endHours = String(endDate.getHours()).padStart(2, '0');
							const endMinutes = String(endDate.getMinutes()).padStart(2, '0');
							// 返回格式化的时间段
							return `${year}-${month}-${day} ${startHours}:${startMinutes}-${endHours}:${endMinutes}`;
						}
					}
					
					// 处理单个时间格式（向后兼容）
					const date = this.parseDate(dateStr);
					if (!date) {
						console.error('单个时间解析失败:', dateStr);
						return dateStr;
					}
					
					const year = date.getFullYear();
					const month = String(date.getMonth() + 1).padStart(2, '0');
					const day = String(date.getDate()).padStart(2, '0');
					const hours = String(date.getHours()).padStart(2, '0');
					const minutes = String(date.getMinutes()).padStart(2, '0');
					
					return `${year}-${month}-${day} ${hours}:${minutes}`;
				} catch (error) {
					console.error('日期格式化失败:', error, 'dateTime:', dateTime);
					return dateTime;
				}
			},
			
			// 获取预约类型图标
			getReservationTypeIcon(reservation) {
				const typeMap = {
					'新能源车': '🚙',
					'燃油车': '🚗'
				};
				return typeMap[reservation.carType] || '🚗';
			},
			
			// 获取预约类型文本
			getReservationTypeText(reservation) {
				const typeMap = {
					'新能源车': '新能源车',
					'燃油车': '燃油车'
				};
				return typeMap[reservation.carType] || '未知车辆';
			},
			
			// 判断是否为新能源车牌
			isNewEnergyPlate(plateNumber) {
				if (!plateNumber) return false;
				// 新能源车牌通常是8位，传统燃油车牌是7位
				return plateNumber.length === 8;
			},
			
			// 获取预约时间显示
			getReservationTimeDisplay(reservation) {
				console.log('📅 [访客查询页面] 获取预约时间显示:', reservation);
				
				// 尝试多个时间字段
				const timeFields = [
					reservation.expectedTime,      // 预计时间（从 visitdate 来）
					reservation.reservationTime,   // 预约时间（从 recorddate 来）
					reservation._raw?.visitdate,   // 原始 visitdate 字段
					reservation._raw?.recorddate   // 原始 recorddate 字段
				];
				
				for (let timeField of timeFields) {
					if (timeField) {
						console.log('📅 [访客查询页面] 尝试格式化时间字段:', timeField);
						const formattedTime = this.formatTimeSlot(timeField);
						if (formattedTime && formattedTime !== timeField && formattedTime !== '未设置') {
							return formattedTime;
						}
					}
				}
				
				// 如果都没有找到有效时间，返回默认提示
				console.warn('📅 [访客查询页面] 未找到有效的时间字段');
				return '时间待确认';
			},
			
			// 格式化时间段显示
			formatTimeSlot(dateTime) {
				if (!dateTime) return '未设置';
				
				try {
					let dateStr = dateTime;
					
					// 检查是否是区间格式 "2025-12-28 08:00:00 - 2025-12-28 10:00:00"
					if (dateStr.includes(' - ')) {
						const times = dateStr.split(' - ');
						if (times.length === 2) {
							const startTime = times[0]; // "2025-12-28 08:00:00"
							const endTime = times[1];   // "2025-12-28 10:00:00"
							// 解析开始时间
							const startDate = this.parseDate(startTime);
							if (!startDate) {
								console.error('开始时间解析失败:', startTime);
								return dateStr;
							}

							// 提取日期和时间段信息
							const month = String(startDate.getMonth() + 1).padStart(2, '0');
							const day = String(startDate.getDate()).padStart(2, '0');

							// 提取开始和结束的时分
							const startHours = String(startDate.getHours()).padStart(2, '0');
							const startMinutes = String(startDate.getMinutes()).padStart(2, '0');

							const endDate = this.parseDate(endTime);
							if (!endDate) {
								console.error('结束时间解析失败:', endTime);
								return dateStr;
							}
							const endHours = String(endDate.getHours()).padStart(2, '0');
							const endMinutes = String(endDate.getMinutes()).padStart(2, '0');
							
							// 返回格式化的时间段: "12-28 08:00-10:00"
							return `${month}-${day} ${startHours}:${startMinutes}-${endHours}:${endMinutes}`;
						}
					}
					
					// 处理单个时间格式（向后兼容）
					const date = this.parseDate(dateStr);
					if (!date) {
						console.error('单个时间解析失败:', dateStr);
						return dateStr;
					}
					
					const month = String(date.getMonth() + 1).padStart(2, '0');
					const day = String(date.getDate()).padStart(2, '0');
					const hours = String(date.getHours()).padStart(2, '0');
					const minutes = String(date.getMinutes()).padStart(2, '0');
					
					return `${month}-${day} ${hours}:${minutes}`;
				} catch (error) {
					console.error('时间段格式化失败:', error, 'dateTime:', dateTime);
					return dateTime;
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	.visitor-query-container {
		min-height: 100vh;
		background: linear-gradient(135deg, #f8fafc 0%, #e8f4f8 100%);
		padding: 20rpx;
		padding-bottom: 140rpx; /* 为TabBar留出空间 */
	}

	/* 头部信息卡片 */
	.header-card {
		background: linear-gradient(135deg, #1677ff 0%, #0958d9 100%);
		border-radius: 24rpx;
		padding: 40rpx 30rpx;
		margin-bottom: 20rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
		box-shadow: 0 8rpx 32rpx rgba(22, 119, 255, 0.3);
	}

	.user-info {
		display: flex;
		align-items: center;
	}

	.avatar {
		width: 80rpx;
		height: 80rpx;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 24rpx;
	}

	.avatar-text {
		color: #fff;
		font-size: 32rpx;
		font-weight: 600;
	}

	.user-details {
		color: #fff;
	}

	.username {
		font-size: 36rpx;
		font-weight: 600;
		margin-bottom: 8rpx;
	}

	.phone {
		font-size: 28rpx;
		opacity: 0.9;
	}

	.status-badge {
		padding: 12rpx 24rpx;
		border-radius: 50rpx;
		font-size: 24rpx;
		font-weight: 600;
		background: rgba(255, 255, 255, 0.2);
		color: #fff;
		
		&.status-approved {
			background: rgba(76, 175, 80, 0.2);
		}
		
		&.status-pending {
			background: rgba(255, 193, 7, 0.2);
		}
		
		&.status-rejected {
			background: rgba(244, 67, 54, 0.2);
		}
	}

	/* 申请状态卡片 */
	.application-card {
		background: #fff;
		border-radius: 24rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
		overflow: hidden;
	}

	.card-header {
		padding: 30rpx 30rpx 0;
	}

	.card-title {
		display: flex;
		align-items: center;
		font-size: 32rpx;
		font-weight: 600;
		color: #1a202c;
		
		.icon {
			margin-right: 12rpx;
			font-size: 28rpx;
		}
	}

	.application-content {
		padding: 20rpx 30rpx 30rpx;
	}

	.application-item {
		display: flex;
		margin-bottom: 16rpx;
		
		&:last-child {
			margin-bottom: 0;
		}
	}

	.label {
		color: #718096;
		font-size: 28rpx;
		min-width: 160rpx;
	}

	.value {
		color: #2d3748;
		font-size: 28rpx;
		flex: 1;
		
		&.status-approved {
			color: #4caf50;
		}
		
		&.status-pending {
			color: #ff9800;
		}
		
		&.status-rejected {
			color: #f44336;
		}
	}

	/* Tab切换 */
	.tab-container {
		margin-bottom: 20rpx;
	}

	.tab-list {
		display: flex;
		background: #fff;
		border-radius: 50rpx;
		padding: 8rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
	}

	.tab-item {
		flex: 1;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20rpx 24rpx;
		border-radius: 40rpx;
		transition: all 0.3s ease;
		cursor: pointer;
		
		&.active {
			background: linear-gradient(135deg, #1677ff 0%, #0958d9 100%);
			box-shadow: 0 6rpx 20rpx rgba(22, 119, 255, 0.3);
			
			.tab-icon, .tab-text {
				color: #fff;
			}
			
			.tab-badge {
				background: rgba(255, 255, 255, 0.2);
				color: #fff;
			}
		}
		
		&:not(.active):active {
			background: rgba(22, 119, 255, 0.1);
		}
	}

	.tab-icon {
		font-size: 32rpx;
		margin-right: 8rpx;
		color: #718096;
		transition: color 0.3s ease;
	}

	.tab-text {
		font-size: 28rpx;
		font-weight: 500;
		color: #2d3748;
		transition: color 0.3s ease;
	}

	.tab-badge {
		position: absolute;
		top: 8rpx;
		right: 8rpx;
		min-width: 32rpx;
		height: 32rpx;
		background: #f56565;
		color: #fff;
		font-size: 20rpx;
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 8rpx;
		line-height: 1;
	}

	/* 搜索栏 */
	.search-container {
		margin-bottom: 20rpx;
	}

	.search-box {
		background: #fff;
		border-radius: 50rpx;
		padding: 20rpx 24rpx;
		display: flex;
		align-items: center;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
	}

	.search-input {
		flex: 1;
		font-size: 28rpx;
		color: #2d3748;
		border: none;
		outline: none;
	}

	.search-icon {
		padding: 8rpx;
		font-size: 32rpx;
		color: #718096;
	}

	/* 记录标题 */
	.records-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
		padding: 0 10rpx;
	}

	.records-title {
		display: flex;
		align-items: center;
		font-size: 32rpx;
		font-weight: 600;
		color: #1a202c;
		
		.icon {
			margin-right: 12rpx;
			font-size: 28rpx;
		}
	}

	.records-count {
		font-size: 24rpx;
		color: #718096;
	}

	/* 记录列表 */
	.records-list {
		space-y: 16rpx;
	}

	.record-item {
		background: #fff;
		border-radius: 24rpx;
		padding: 30rpx;
		margin-bottom: 16rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
		transition: all 0.2s ease;
		
		&:active {
			transform: scale(0.98);
			box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
		}
	}

	.record-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
	}

	.record-time {
		font-size: 28rpx;
		color: #718096;
		font-weight: 500;
	}

	.record-status {
		padding: 8rpx 20rpx;
		border-radius: 20rpx;
		font-size: 24rpx;
		font-weight: 600;
		
		/* 申请记录状态 */
		&.status-approved {
			background: #e8f5e8;
			color: #4caf50;
		}
		
		&.status-pending {
			background: #fff8e1;
			color: #ff9800;
		}
		
		&.status-rejected {
			background: #ffebee;
			color: #f44336;
		}
		
		/* 预约记录状态 */
		&.status-completed {
			background: #e8f5e8;
			color: #4caf50;
		}
		
		&.status-active {
			background: #e3f2fd;
			color: #2196f3;
		}
		
		&.status-cancelled {
			background: #ffebee;
			color: #f44336;
		}
	}

	.record-content {
		space-y: 12rpx;
	}

	.record-row {
		display: flex;
		margin-bottom: 12rpx;
		
		&:last-child {
			margin-bottom: 0;
		}
	}

	.record-label {
		color: #718096;
		font-size: 26rpx;
		min-width: 140rpx;
	}

	.record-value {
		color: #2d3748;
		font-size: 26rpx;
		flex: 1;
		
		&.plate-number {
			font-weight: 600;
			color: #1677ff;
		}
	}

	/* 加载状态 */
	.loading-container {
		text-align: center;
		padding: 120rpx 40rpx;
		background: #fff;
		border-radius: 24rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
		margin-bottom: 20rpx;
	}

	.loading-icon {
		font-size: 120rpx;
		margin-bottom: 30rpx;
		animation: rotate 1.5s linear infinite;
	}

	.loading-text {
		font-size: 28rpx;
		color: #718096;
		line-height: 1.6;
	}

	@keyframes rotate {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	/* 空状态 */
	.empty-state {
		text-align: center;
		padding: 120rpx 40rpx;
		background: #fff;
		border-radius: 24rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
	}

	.empty-icon {
		font-size: 120rpx;
		margin-bottom: 30rpx;
	}

	.empty-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #1a202c;
		margin-bottom: 16rpx;
	}

	.empty-desc {
		font-size: 28rpx;
		color: #718096;
		line-height: 1.6;
		margin-bottom: 40rpx;
	}

	.empty-action {
		.create-appointment-btn {
			background: linear-gradient(135deg, #1677ff 0%, #0958d9 100%);
			color: #fff;
			border: none;
			border-radius: 50rpx;
			padding: 24rpx 48rpx;
			font-size: 28rpx;
			font-weight: 600;
			box-shadow: 0 8rpx 24rpx rgba(22, 119, 255, 0.4);
		}
	}

	/* ==================== 预约记录样式 ==================== */
	.reservation-item {
		background: linear-gradient(135deg, #ffffff 0%, #f8fbff 100%);
		border-radius: 24rpx;
		padding: 24rpx;
		margin-bottom: 20rpx;
		box-shadow: 
			0 8rpx 32rpx rgba(64, 158, 255, 0.08),
			0 2rpx 8rpx rgba(64, 158, 255, 0.04);
		border: 1rpx solid rgba(64, 158, 255, 0.08);
		overflow: hidden;
		position: relative;
		transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

		&:hover {
			transform: translateY(-4rpx);
			box-shadow: 
				0 16rpx 48rpx rgba(64, 158, 255, 0.12),
				0 4rpx 16rpx rgba(64, 158, 255, 0.08);
			border-color: rgba(64, 158, 255, 0.15);
		}

		&:active {
			transform: scale(0.98);
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

	/* 预约记录头部 */
	.reservation-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
		padding-bottom: 16rpx;
		border-bottom: 1rpx solid rgba(64, 158, 255, 0.1);
		position: relative;
		z-index: 1;
	}

	.reservation-type {
		display: flex;
		align-items: center;
		gap: 8rpx;
		padding: 8rpx 16rpx;
		background: linear-gradient(135deg, rgba(64, 158, 255, 0.08), rgba(64, 158, 255, 0.04));
		border-radius: 20rpx;
		border: 1rpx solid rgba(64, 158, 255, 0.15);

		.type-icon {
			font-size: 20rpx;
		}

		.type-text {
			font-size: 22rpx;
			color: #409eff;
			font-weight: 600;
			letter-spacing: 0.5rpx;
		}
	}

	.reservation-time {
		font-size: 26rpx;
		color: #666;
		font-weight: 500;
		background: rgba(102, 102, 102, 0.06);
		padding: 6rpx 12rpx;
		border-radius: 12rpx;
	}

	.reservation-status {
		padding: 8rpx 16rpx;
		border-radius: 20rpx;
		font-size: 22rpx;
		font-weight: 600;
		backdrop-filter: blur(5rpx);
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
		border: 1rpx solid transparent;

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

		&.status-completed {
			background: linear-gradient(135deg, #F0F9FF 0%, #E6F7FF 100%);
			color: #52C41A;
			border-color: rgba(82, 196, 26, 0.2);
			box-shadow: 0 4rpx 16rpx rgba(82, 196, 26, 0.2);
		}

		&.status-active {
			background: linear-gradient(135deg, #E6F7FF 0%, #BAE7FF 100%);
			color: #1890FF;
			border-color: rgba(24, 144, 255, 0.2);
			box-shadow: 0 4rpx 16rpx rgba(24, 144, 255, 0.2);
		}

		&.status-rejected, &.status-cancelled {
			background: linear-gradient(135deg, #FFF1F0 0%, #FFCCC7 100%);
			color: #FF4D4F;
			border-color: rgba(255, 77, 79, 0.2);
			box-shadow: 0 4rpx 16rpx rgba(255, 77, 79, 0.2);
		}
	}

	/* 预约记录内容 */
	.reservation-content {
		position: relative;
		z-index: 1;
	}

	/* 车牌号显示区域 */
	.plate-section {
		display: flex;
		align-items: center;
		gap: 16rpx;
		margin-bottom: 20rpx;
		padding: 16rpx 20rpx;
		background: linear-gradient(135deg, #f8faff 0%, #f0f8ff 100%);
		border-radius: 16rpx;
		border: 1rpx solid rgba(64, 158, 255, 0.1);

		.section-icon {
			font-size: 28rpx;
			color: #409eff;
		}

		.plate-number {
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
			min-width: 200rpx;

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

	/* 预约时间段区域 */
	.contact-section {
		margin-bottom: 16rpx;

		.contact-row {
			display: flex;
			align-items: center;
			gap: 8rpx;
			padding: 12rpx 16rpx;
			background: rgba(24, 144, 255, 0.04);
			border-radius: 12rpx;
			border: 1rpx solid rgba(24, 144, 255, 0.08);

			.contact-icon {
				font-size: 20rpx;
				color: #1890ff;
			}

			.contact-label {
				font-size: 24rpx;
				color: #666;
				font-weight: 500;
			}

			.contact-value {
				font-size: 26rpx;
				color: #1890ff;
				font-weight: 600;
				flex: 1;
				
				&.time-pending {
					color: #ff9800;
					font-style: italic;
				}
			}
		}
	}

	/* 地址信息区域 */
	.address-section {
		margin-bottom: 16rpx;

		.address-row {
			display: flex;
			align-items: flex-start;
			gap: 8rpx;
			padding: 12rpx 16rpx;
			background: rgba(255, 152, 0, 0.04);
			border-radius: 12rpx;
			border: 1rpx solid rgba(255, 152, 0, 0.08);

			.address-icon {
				font-size: 20rpx;
				color: #ff9800;
				margin-top: 2rpx;
			}

			.address-label {
				font-size: 24rpx;
				color: #666;
				font-weight: 500;
				min-width: 120rpx;
			}

			.address-value {
				font-size: 24rpx;
				color: #333;
				font-weight: 500;
				flex: 1;
				line-height: 1.4;
				word-break: break-all;
			}
		}
	}

	/* 预约详情区域 */
	.reservation-details {
		margin-bottom: 20rpx;

		.detail-row {
			display: flex;
			align-items: center;
			gap: 8rpx;
			padding: 8rpx 12rpx;
			margin-bottom: 8rpx;
			background: rgba(102, 102, 102, 0.04);
			border-radius: 8rpx;

			&:last-child {
				margin-bottom: 0;
			}

			.detail-icon {
				font-size: 18rpx;
				color: #666;
			}

			.detail-label {
				font-size: 22rpx;
				color: #666;
				min-width: 120rpx;
			}

			.detail-value {
				font-size: 22rpx;
				color: #333;
				flex: 1;
				font-weight: 500;
			}
		}
	}

	/* 进出场记录区域 */
	.entry-exit-section {
		background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%);
		border-radius: 16rpx;
		padding: 16rpx 20rpx;
		border: 1rpx solid rgba(233, 236, 239, 0.6);
		position: relative;
		z-index: 2;
		box-shadow: 
			0 6rpx 20rpx rgba(0, 0, 0, 0.06),
			inset 0 1rpx 0 rgba(255, 255, 255, 0.8);
		backdrop-filter: blur(8rpx);

		.section-title {
			display: flex;
			align-items: center;
			gap: 8rpx;
			margin-bottom: 12rpx;
			padding-bottom: 8rpx;
			border-bottom: 1rpx solid rgba(233, 236, 239, 0.8);

			.title-icon {
				font-size: 20rpx;
				color: #666;
			}

			.title-text {
				font-size: 24rpx;
				color: #333;
				font-weight: 600;
			}
		}

		.entry-exit-details {
			.entry-exit-row {
				display: flex;
				align-items: center;
				gap: 12rpx;
				margin-bottom: 8rpx;

				&:last-child {
					margin-bottom: 0;
				}

				.entry-dot, .exit-dot {
					width: 12rpx;
					height: 12rpx;
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
				}

				.entry-dot {
					background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
					box-shadow: 
						0 4rpx 12rpx rgba(82, 196, 26, 0.4),
						0 2rpx 6rpx rgba(82, 196, 26, 0.2),
						inset 0 1rpx 0 rgba(255, 255, 255, 0.3);

					&::before {
						background: linear-gradient(135deg, #52c41a, #73d13d);
					}
				}

				.exit-dot {
					background: linear-gradient(135deg, #f5222d 0%, #ff7875 100%);
					box-shadow: 
						0 4rpx 12rpx rgba(245, 34, 45, 0.4),
						0 2rpx 6rpx rgba(245, 34, 45, 0.2),
						inset 0 1rpx 0 rgba(255, 255, 255, 0.3);

					&::before {
						background: linear-gradient(135deg, #f5222d, #ff7875);
					}
				}

				.entry-exit-label {
					font-size: 22rpx;
					color: #666;
					min-width: 120rpx;
				}

				.entry-exit-value {
					font-size: 22rpx;
					color: #333;
					font-weight: 500;
					flex: 1;
				}
			}

			.duration-row {
				display: flex;
				align-items: center;
				gap: 8rpx;
				margin-top: 12rpx;
				padding-top: 8rpx;
				border-top: 1rpx solid rgba(233, 236, 239, 0.8);

				.duration-icon {
					font-size: 18rpx;
					color: #13c2c2;
				}

				.duration-label {
					font-size: 22rpx;
					color: #666;
					min-width: 120rpx;
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

	@keyframes chip-shine {
		0% {
			left: -100%;
		}
		100% {
			left: 100%;
		}
	}
</style> 