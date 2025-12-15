<template>
	<view class="result-page">
		<!-- 自定义导航栏 -->
		<view class="custom-navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="navbar-content">
				<view class="navbar-title">{{ navbarTitle }}</view>
			</view>
		</view>
		
		<!-- 顶部背景装饰 -->
		<view class="header-decoration">
			<view class="decoration-circle circle-1"></view>
			<view class="decoration-circle circle-2"></view>
			<view class="decoration-circle circle-3"></view>
		</view>

		<!-- 主要内容区域 -->
		<view class="main-content" :style="{ marginTop: (statusBarHeight + 44) + 'px' }">
			<!-- 状态图标和标题 -->
			<view class="status-section">
				<view class="status-icon-container">
					<view :class="['status-icon', statusIconType]">
						<text class="icon-text">{{ statusIconType === 'approved' ? '✅' : '⏳' }}</text>
						<view v-if="statusIconType === 'pending'" class="pulse-ring"></view>
					</view>
				</view>
				<view class="status-title">{{ statusTitle }}</view>
				<view class="status-subtitle">{{ statusSubtitle }}</view>
			</view>

			<!-- 预约信息卡片 -->
			<view class="info-card">
				<view class="card-header">
					<view class="card-title">
						<text class="title-icon">{{ cardTitleIcon }}</text>
						<text class="title-text">{{ cardTitleText }}</text>
					</view>
				</view>
				<view class="card-content">
					<view class="info-item">
						<view class="info-label">
							<text class="label-icon">🏢</text>
							<text class="label-text">{{ venueLabel }}</text>
						</view>
						<text class="info-value">{{ parkingLotName }}</text>
					</view>
					<view class="info-item">
						<view class="info-label">
							<text class="label-icon">📅</text>
							<text class="label-text">{{ timeLabel }}</text>
						</view>
						<text class="info-value">{{ formatDateTime() }}</text>
					</view>
					<view class="info-item">
						<view class="info-label">
							<text class="label-icon">🚗</text>
							<text class="label-text">车牌号码</text>
						</view>
						<text class="info-value">{{ plateNumber || '未填写' }}</text>
					</view>
					<view class="info-item">
						<view class="info-label">
							<text class="label-icon">📝</text>
							<text class="label-text">{{ reasonLabel }}</text>
						</view>
						<text class="info-value">{{ visitReason || '未填写' }}</text>
					</view>
				</view>
			</view>
			


			<!-- 提醒信息 -->
			<view class="reminder-card">
				<view class="reminder-header">
					<text class="reminder-icon">💡</text>
					<text class="reminder-title">温馨提醒</text>
				</view>
				<view class="reminder-content">
					<view v-for="(item, index) in reminderItems" :key="index" class="reminder-item">
						<text class="reminder-dot">•</text>
						<text class="reminder-text">{{ item }}</text>
					</view>
				</view>
			</view>

			<!-- 操作按钮 -->
			<view class="action-buttons">
				<!-- 只有管家角色才显示查看按钮 -->
				<button v-if="showViewAppointmentsBtn" class="action-btn primary-btn" @click="viewMyAppointments">
					<text class="btn-icon">{{ viewButtonIcon }}</text>
					<text class="btn-text">{{ viewButtonText }}</text>
				</button>
			</view>
		</view>
		
		<!-- 底部装饰 -->
		<view class="footer-decoration">
			<view class="wave-bg"></view>
		</view>
	</view>
</template>

<script>
	
	export default {
		data() {
			return {
				appointmentData: {
					visitDate: '',
					plateNumber: '',
					visitReason: '',
					appointType: '',
					status: 'pending',
					auditstatus: '',
					venuestatus: ''
				},
				statusBarHeight: 0,
				parkingLotName: '停车场', // 默认值
				userRole: 'visitor', // 用户角色
				needsAudit: true, // 是否需要审核
			}
		},
		
		async onLoad(options) {
			// 获取系统信息，设置状态栏高度
			this.setStatusBarHeight();

			// 获取从预约页面传递的数据
			console.log('📱 [结果页面] 接收到的参数:', options);

			// 从本地存储获取最新的预约数据
			this.loadAppointmentData();

			// 加载停车场信息
			this.loadParkingLotInfo();

			// 获取用户角色信息
			this.loadUserRole();

			// 判断审核状态
			this.determineAuditStatus();
		},
		
		onShow() {
			// 隐藏返回按钮（兼容性处理）
			try {
				uni.hideBackButton();
			} catch (e) {
				console.log('hideBackButton not supported');
			}
		},
		
		onBackPress(options) {
			// 阻止物理返回键和手势返回
			if (options.from === 'backbutton' || options.from === 'navigateBack') {
				uni.showModal({
					title: '提示',
					content: '请使用页面内的按钮进行操作',
					showCancel: false,
					confirmText: '知道了'
				});
				return true; // 阻止返回
			}
		},
		
		computed: {
			plateNumber() {
				return this.appointmentData.plateNumber || '未填写';
			},

			visitReason() {
				return this.appointmentData.visitReason || '未填写';
			},

			// 获取导航栏标题
			navbarTitle() {
				if (this.userRole === 'manager' && this.appointmentData.appointType === '代人') {
					return '代人预约结果';
				}
				if (this.appointmentData.appointType === '邀请') {
					return '邀请预约结果';
				}
				return '预约结果';
			},

			// 判断是否显示查看按钮（只有管家显示）
			showViewAppointmentsBtn() {
				const userInfo = uni.getStorageSync('userInfo') || {};
				const userRole = userInfo.role || userInfo.userInfo?.userkind || 'visitor';

				// 只有管家角色才显示此按钮
				return userRole === 'manager';
			},

			// 获取查看按钮的文字
			viewButtonText() {
				if (this.userRole === 'manager' && this.appointmentData.appointType === '代人') {
					return '查看管理预约';
				}
				return '查看我的预约';
			},

			// 获取查看按钮的图标
			viewButtonIcon() {
				if (this.userRole === 'manager' && this.appointmentData.appointType === '代人') {
					return '👨‍💼';
				}
				return '📋';
			},

			// 获取卡片标题图标
			cardTitleIcon() {
				if (this.userRole === 'manager' && this.appointmentData.appointType === '代人') {
					return '👨‍💼';
				}
				if (this.appointmentData.appointType === '邀请') {
					return '🎫';
				}
				return '📋';
			},

			// 获取卡片标题文字
			cardTitleText() {
				if (this.userRole === 'manager' && this.appointmentData.appointType === '代人') {
					return '代人预约详情';
				}
				if (this.appointmentData.appointType === '邀请') {
					return '邀请预约详情';
				}
				return '预约详情';
			},

			// 获取场所标签
			venueLabel() {
				if (this.userRole === 'manager' && this.appointmentData.appointType === '代人') {
					return '预约场所';
				}
				if (this.appointmentData.appointType === '邀请') {
					return '访问场所';
				}
				return '预约场所';
			},

			// 获取时间标签
			timeLabel() {
				if (this.userRole === 'manager' && this.appointmentData.appointType === '代人') {
					return '预约日期';
				}
				if (this.appointmentData.appointType === '邀请') {
					return '访问日期';
				}
				return '预约日期';
			},

			// 获取原因标签
			reasonLabel() {
				if (this.userRole === 'manager' && this.appointmentData.appointType === '代人') {
					return '预约类型';
				}
				if (this.appointmentData.appointType === '邀请') {
					return '访问原因';
				}
				return '预约原因';
			},

			// 获取状态标题
			statusTitle() {
				if (this.userRole === 'manager' && this.appointmentData.appointType === '代人') {
					return '代人预约成功';
				}

				if (this.appointmentData.appointType === '邀请') {
					return '邀请预约成功';
				}

				if (!this.needsAudit) {
					return '预约提交成功';
				}

				return '预约提交成功';
			},

			// 获取状态副标题
			statusSubtitle() {
				if (this.userRole === 'manager' && this.appointmentData.appointType === '代人') {
					return '管家代人预约已自动通过';
				}

				if (this.appointmentData.appointType === '邀请') {
					return '管家邀请预约已自动通过';
				}

				if (!this.needsAudit) {
					return '预约已自动通过，可直接入场';
				}

				return '正在等待管家审核';
			},

			// 获取状态图标类型
			statusIconType() {
				if (this.userRole === 'manager' && this.appointmentData.appointType === '代人') {
					return 'approved';
				}

				if (this.appointmentData.appointType === '邀请') {
					return 'approved';
				}

				if (!this.needsAudit) {
					return 'approved';
				}

				return 'pending';
			},

			// 获取提醒内容
			reminderItems() {
				if (this.userRole === 'manager' && this.appointmentData.appointType === '代人') {
					return [
						'管家代人预约无需审核，已自动通过',
						'请通知访客按时到达现场',
						'如有变更请及时联系访客'
					];
				}

				if (this.appointmentData.appointType === '邀请') {
					return [
						'管家邀请预约无需审核，已自动通过',
						'您可以直接前往停车场入场',
						'请按预约时间准时到达',
						'如有疑问请联系邀请您的管家'
					];
				}

				if (!this.needsAudit) {
					return [
						'该时间段无需审核，预约已生效',
						'请按时到达现场',
						'如有变更请及时联系管家'
					];
				}

				return [
					'管家会在1-2小时内完成审核',
					'请保持手机畅通，注意接收审核通知',
					'审核通过后请按时到达现场'
				];
			}
		},
		
		methods: {

			// 设置状态栏高度
			setStatusBarHeight() {
				const systemInfo = uni.getSystemInfoSync();
				this.statusBarHeight = systemInfo.statusBarHeight || 0;
				
				console.log('📱 [结果页面] 状态栏高度:', this.statusBarHeight + 'px');
			},
			
			// 加载预约数据
			loadAppointmentData() {
				try {
					// 从本地存储获取最后一次预约的数据
					const lastAppointment = uni.getStorageSync('lastAppointmentData');
					if (lastAppointment) {
						this.appointmentData = { ...this.appointmentData, ...lastAppointment };
						console.log('📱 [结果页面] 加载预约数据:', this.appointmentData);
					}
				} catch (error) {
					console.error('📱 [结果页面] 加载预约数据失败:', error);
				}
			},

			// 加载用户角色信息
			loadUserRole() {
				try {
					const userInfo = uni.getStorageSync('userInfo') || {};
					this.userRole = userInfo.role || userInfo.userInfo?.userkind || 'visitor';
					console.log('📱 [结果页面] 用户角色:', this.userRole);
				} catch (error) {
					console.error('📱 [结果页面] 加载用户角色失败:', error);
					this.userRole = 'visitor';
				}
			},

			// 判断审核状态
			determineAuditStatus() {
				try {
					// 如果是管家代人预约，无需审核
					if (this.userRole === 'manager' && this.appointmentData.appointType === '代人') {
						this.needsAudit = false;
						console.log('📱 [结果页面] 管家代人预约，无需审核');
						return;
					}

					// 根据预约数据中的审核状态判断
					const auditStatus = this.appointmentData.auditstatus || '';
					const venueStatus = this.appointmentData.venuestatus || '';

					if (auditStatus === '不审核' || auditStatus === '已通过' || venueStatus === '待入场') {
						this.needsAudit = false;
						console.log('📱 [结果页面] 根据状态判断无需审核:', { auditStatus, venueStatus });
					} else {
						this.needsAudit = true;
						console.log('📱 [结果页面] 需要审核:', { auditStatus, venueStatus });
					}
				} catch (error) {
					console.error('📱 [结果页面] 判断审核状态失败:', error);
					this.needsAudit = true; // 默认需要审核
				}
			},
			
			// 加载停车场信息
			loadParkingLotInfo() {
				try {
					// 从本地存储获取停车场信息
					const parkInfo = uni.getStorageSync('parkInfo');
					
					if (parkInfo && parkInfo.fullName) {
						// 优先使用fullName
						this.parkingLotName = parkInfo.fullName;
					} else if (parkInfo && parkInfo.name) {
						// 如果没有fullName，使用name并添加"停车场"后缀
						this.parkingLotName = `${parkInfo.name}-停车场`;
					} else {
						// 如果本地存储没有停车场信息，尝试从lastAppointmentData获取
						const lastAppointment = uni.getStorageSync('lastAppointmentData');
						if (lastAppointment && lastAppointment.parkingLotName) {
							this.parkingLotName = lastAppointment.parkingLotName;
						} else {
							// 使用默认值
							this.parkingLotName = '哈尔滨四季上东停车场';
						}
					}
					
					console.log('📱 [结果页面] 加载停车场信息:', this.parkingLotName);
				} catch (error) {
					console.error('📱 [结果页面] 加载停车场信息失败:', error);
					// 使用默认值
					this.parkingLotName = '哈尔滨四季上东停车场';
				}
			},
			
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

			// 格式化日期时间
			formatDateTime() {
				if (this.appointmentData.visitDate) {
					try {
						let dateStr = this.appointmentData.visitDate;

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

								// 只返回日期部分，不返回时间段
								return `${year}年${month}月${day}日`;
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
						// 🔧 只返回日期部分，不返回时间
						return `${year}年${month}月${day}日`;
					} catch (error) {
						console.error('日期格式化失败:', error, 'visitDate:', this.appointmentData.visitDate);
						return this.appointmentData.visitDate;
					}
				}
				return '未设置';
			},
			
			// 查看我的预约
			viewMyAppointments() {
				console.log('📱 [结果页面] 跳转到我的预约');
				
				// 验证用户是否已完成必要步骤
				if (!this.validateUserRequirements()) {
					return; // 验证失败，不进行跳转
				}
				
				// 根据用户角色跳转到不同的预约列表页面
				const userInfo = uni.getStorageSync('userInfo') || {};
				const userRole = userInfo.role || 'visitor';
				
				console.log(' [结果页面] 用户角色:', userRole);
				
				if (userRole === 'visitor') {
					// 访客跳转到专用的访客查询页面 - 使用navigateTo跳转到普通页面
					uni.navigateTo({
						url: '/pagesA/reservation/searchResult/searchResult?reset=true',
						success: () => {
							console.log(' [结果页面] 成功跳转到访客查询页面（重置模式）');
						},
						fail: (err) => {
							console.error(' [结果页面] 跳转失败:', err);
							uni.showToast({
								title: '页面跳转失败',
								icon: 'none',
								duration: 2000
							});
						}
					});
				} else if (userRole === 'manager') {
					// 管家查看管理的预约 - 跳转到查询首页（图3的位置），不直接跳转到详情页
					uni.navigateTo({
						url: '/pagesA/reservation/searchResult/searchResult?reset=true',
						success: () => {
							console.log(' [结果页面] 成功跳转到管家查询首页（重置模式）');
						},
						fail: (err) => {
							console.error(' [结果页面] 跳转失败:', err);
						}
					});
				} else {
					// 业主查看自己的预约 - 使用navigateTo跳转到普通页面
					uni.navigateTo({
						url: '/pagesA/reservation/searchResult/searchResult?reset=true',
						success: () => {
							console.log(' [结果页面] 成功跳转到业主查询页面（重置模式）');
						},
						fail: (err) => {
							console.error(' [结果页面] 跳转失败:', err);
						}
					});
				}
			},
			
			// 验证用户是否满足查看预约的要求
			validateUserRequirements() {
				// 所有验证都通过，直接允许查看预约
				console.log(' [验证] 用户满足查看预约的所有要求');
				console.log('✅ [验证] 用户满足查看预约的所有要求');
				return true;
			},
			
			// 兼容旧的方法名
			linkTo() {
				this.viewMyAppointments();
			}
		}
	}
</script>

<style lang="scss" scoped>
	.result-page {
		min-height: 100vh;
		background: linear-gradient(135deg, #0081ff 0%, #1890ff 50%, #40a9ff 100%);
		position: relative;
		overflow: hidden;
	}

	/* 自定义导航栏 */
	.custom-navbar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 1000;
		background: #0081ff;
		
		.navbar-content {
			height: 88rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			position: relative;
			
			.navbar-title {
				font-size: 36rpx;
				font-weight: 600;
				color: white;
				text-align: center;
			}
		}
	}

	/* 顶部装饰 */
	.header-decoration {
		position: absolute;
		top: -100rpx;
		left: -100rpx;
		width: 400rpx;
		height: 400rpx;
		pointer-events: none;

		.decoration-circle {
			position: absolute;
			border-radius: 50%;
			background: rgba(255, 255, 255, 0.1);

			&.circle-1 {
				width: 200rpx;
				height: 200rpx;
				top: 0;
				left: 0;
				animation: float 6s ease-in-out infinite;
			}

			&.circle-2 {
				width: 120rpx;
				height: 120rpx;
				top: 100rpx;
				left: 200rpx;
				animation: float 8s ease-in-out infinite reverse;
			}

			&.circle-3 {
				width: 80rpx;
				height: 80rpx;
				top: 200rpx;
				left: 50rpx;
				animation: float 10s ease-in-out infinite;
			}
		}
	}

	/* 主要内容 */
	.main-content {
		position: relative;
		z-index: 2;
		padding: 40rpx 40rpx 120rpx;
	}

	/* 状态区域 */
	.status-section {
		text-align: center;
		margin-bottom: 60rpx;

		.status-icon-container {
			position: relative;
			display: inline-block;
			margin-bottom: 40rpx;

			.status-icon {
				width: 120rpx;
				height: 120rpx;
				border-radius: 50%;
				background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
				display: flex;
				align-items: center;
				justify-content: center;
				position: relative;
				box-shadow: 0 8rpx 30rpx rgba(79, 172, 254, 0.4);

				.icon-text {
					font-size: 48rpx;
					color: white;
				}

				&.pending {
					background: linear-gradient(135deg, #ffa726 0%, #fb8c00 100%);
					box-shadow: 0 8rpx 30rpx rgba(255, 167, 38, 0.4);
				}

				&.approved {
					background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
					box-shadow: 0 8rpx 30rpx rgba(76, 175, 80, 0.4);
				}
			}

			.pulse-ring {
				position: absolute;
				top: -10rpx;
				left: -10rpx;
				right: -10rpx;
				bottom: -10rpx;
				border: 4rpx solid rgba(255, 167, 38, 0.3);
				border-radius: 50%;
				animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
			}
		}

		/* 为已通过状态的脉冲环设置不同颜色 */
		.status-icon.approved + .pulse-ring {
			border-color: rgba(76, 175, 80, 0.3);
		}

		.status-title {
			font-size: 48rpx;
			font-weight: 700;
			color: white;
			margin-bottom: 16rpx;
			text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
		}

		.status-subtitle {
			font-size: 28rpx;
			color: rgba(255, 255, 255, 0.9);
			font-weight: 400;
		}
	}

	/* 信息卡片 */
	.info-card {
		background: rgba(255, 255, 255, 0.95);
		border-radius: 24rpx;
		margin-bottom: 40rpx;
		box-shadow: 0 8rpx 40rpx rgba(0, 0, 0, 0.1);
		backdrop-filter: blur(20rpx);
		border: 1rpx solid rgba(255, 255, 255, 0.3);

		.card-header {
			padding: 32rpx 32rpx 0;

			.card-title {
				display: flex;
				align-items: center;
				font-size: 32rpx;
				font-weight: 600;
				color: #2d3748;

				.title-icon {
					margin-right: 16rpx;
					font-size: 36rpx;
				}
			}
		}

		.card-content {
			padding: 20rpx 32rpx 32rpx;

			.info-item {
				display: flex;
				align-items: center;
				justify-content: space-between;
				padding: 24rpx 0;
				border-bottom: 1rpx solid #f7fafc;

				&:last-child {
					border-bottom: none;
				}

				.info-label {
					display: flex;
					align-items: center;
					flex: 1;

					.label-icon {
						margin-right: 12rpx;
						font-size: 28rpx;
					}

					.label-text {
						font-size: 28rpx;
						color: #4a5568;
						font-weight: 500;
					}
				}

				.info-value {
					font-size: 28rpx;
					color: #1a202c;
					font-weight: 600;
					text-align: right;
					flex: 1;
					margin-left: 20rpx;
				}
			}
		}
	}
	


	/* 提醒卡片 */
	.reminder-card {
		background: linear-gradient(135deg, #0081ff 0%, #1890ff 100%);
		border-radius: 24rpx;
		padding: 32rpx;
		margin-bottom: 60rpx;
		box-shadow: 0 8rpx 40rpx rgba(0, 129, 255, 0.3);

		.reminder-header {
			display: flex;
			align-items: center;
			margin-bottom: 24rpx;

			.reminder-icon {
				font-size: 36rpx;
				margin-right: 16rpx;
			}

			.reminder-title {
				font-size: 32rpx;
				font-weight: 600;
				color: white;
			}
		}

		.reminder-content {
			.reminder-item {
				display: flex;
				align-items: flex-start;
				margin-bottom: 16rpx;

				&:last-child {
					margin-bottom: 0;
				}

				.reminder-dot {
					color: rgba(255, 255, 255, 0.8);
					margin-right: 12rpx;
					font-size: 24rpx;
					line-height: 1.5;
				}

				.reminder-text {
					font-size: 26rpx;
					color: rgba(255, 255, 255, 0.9);
					line-height: 1.6;
				}
			}
		}
	}

	/* 操作按钮 */
	.action-buttons {
		display: flex;
		flex-direction: column;
		gap: 24rpx;

		.action-btn {
			height: 96rpx;
			border-radius: 48rpx;
			border: none;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 32rpx;
			font-weight: 600;
			transition: all 0.3s ease;
			position: relative;
			overflow: hidden;

			&::after {
				border: none;
			}

			.btn-icon {
				margin-right: 12rpx;
				font-size: 32rpx;
			}

			.btn-text {
				font-size: 32rpx;
				font-weight: 600;
			}

			&.primary-btn {
				background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
				color: white;
				box-shadow: 0 8rpx 30rpx rgba(79, 172, 254, 0.4);

				&:active {
					transform: translateY(2rpx);
					box-shadow: 0 4rpx 20rpx rgba(79, 172, 254, 0.6);
				}
			}

			&.secondary-btn {
				background: rgba(255, 255, 255, 0.9);
				color: #0081ff;
				border: 2rpx solid rgba(255, 255, 255, 0.3);
				backdrop-filter: blur(10rpx);

				&:active {
					transform: translateY(2rpx);
					background: rgba(255, 255, 255, 0.8);
				}
			}
		}
	}

	/* 底部装饰 */
	.footer-decoration {
		position: absolute;
		bottom: -50rpx;
		left: 0;
		right: 0;
		height: 200rpx;
		pointer-events: none;

		.wave-bg {
			width: 100%;
			height: 100%;
			background: rgba(255, 255, 255, 0.1);
			border-radius: 50% 50% 0 0 / 100% 100% 0 0;
		}
	}

	/* 动画效果 */
	@keyframes float {
		0%,
		100% {
			transform: translateY(0rpx);
		}

		50% {
			transform: translateY(-20rpx);
		}
	}

	@keyframes pulse-ring {
		0% {
			transform: scale(0.8);
			opacity: 1;
		}

		100% {
			transform: scale(1.3);
			opacity: 0;
		}
	}

	/* 响应式适配 */
	@media screen and (max-width: 600rpx) {
		.main-content {
			padding: 60rpx 30rpx 100rpx;
		}

		.status-section .status-title {
			font-size: 42rpx;
		}

		.action-buttons {
			.action-btn {
				height: 88rpx;
				font-size: 30rpx;

				.btn-text {
					font-size: 30rpx;
				}
			}
		}
	}
</style>