<script>
	import Vue from 'vue'
	import store from './store/index.js'
	// 移除TuniaoUI依赖
	// import updateCustomBarInfo from './components/tuniao-ui/libs/function/updateCustomBarInfo.js'
	import AuthUtils from '@/utils/auth.js'
	import DynamicTabBarManager from '@/utils/dynamicTabBar.js'
	import TimeoutMonitoring from '@/utils/timeoutMonitoring.js'

	export default {
		globalData: {
			selectedPlateNumber: null,  // 存储从车牌识别页面返回的车牌号码
		},
		
		// 🆕 添加数据属性
		data() {
			return {
				healthCheckTimer: null
			}
		},
		
		onLaunch: function() {
			console.log('App Launch')
			console.log("")

			// 延迟检查用户授权状态，确保应用完全初始化
			setTimeout(() => {
				this.initializeApp()
			}, 500)

			// 中间突起按钮
			uni.onTabBarMidButtonTap(function(e) {
				console.log(e)
				console.log("点击了中间按钮")
				uni.navigateTo({
					url: '/pages/reservation/index',
				});
			})
			// 获取设备的状态栏信息和自定义顶栏信息
			// 使用原生API替代TuniaoUI函数
			this.updateCustomBarInfo().then((res) => {
				store.commit('$tStore', {
					name: 'vuex_status_bar_height',
					value: res.statusBarHeight
				})
				store.commit('$tStore', {
					name: 'vuex_custom_bar_height',
					value: res.customBarHeight
				})
			})
		},
		onShow: function() {
			console.log('App Show')
			this.refreshTabBar()
			// 🔄 从后台回到前台时，自动检查并启动超时监控（无需手动操作）
			console.log('🔄 [App] 应用回到前台，自动检查监控状态...');
			this.checkAndStartTimeoutMonitoring()
		},
		onHide: function() {
			console.log('App Hide')
			// 🆕 进入后台时保留监控状态，但可以调整频率
			this.handleAppGoBackground()
		},
		onUnload: function() {
			console.log('App Unload')
			// 🆕 应用卸载时清理资源
			this.cleanupTimeoutMonitoring()
		},

		methods: {
			/**
			 * 获取设备状态栏和自定义导航栏信息
			 */
			updateCustomBarInfo() {
				return new Promise((resolve) => {
					uni.getSystemInfo({
						success: (res) => {
							const statusBarHeight = res.statusBarHeight || 0;
							// 默认导航栏高度
							let customBarHeight = statusBarHeight + 44; // 44是默认导航栏内容高度

							// 针对不同平台调整
							// #ifdef MP-WEIXIN
							customBarHeight = statusBarHeight + 44;
							// #endif
							// #ifdef H5
							customBarHeight = 44;
							// #endif
							// #ifdef APP-PLUS
							customBarHeight = statusBarHeight + 44;
							// #endif
							resolve({
								statusBarHeight,
								customBarHeight
							});
						},
						fail: () => {
							// 失败时使用默认值
							resolve({
								statusBarHeight: 20,
								customBarHeight: 64
							});
						}
					});
				});
			},

			/**
			 * 初始化应用
			 */
			async initializeApp() {
				console.log('🚀 [App] 开始初始化应用');

				try {
					// 兼容原有的用户检查逻辑
					this.checkUserAuth();

					// 初始化认证状态和TabBar
					const isAuthenticated = await AuthUtils.initializeAuth();

									if (isAuthenticated) {
					console.log('✅ [App] 用户已认证，应用初始化完成');
					// 🔄 用户已认证，自动启动超时监控（无需手动开启）
					console.log('🚀 [App] 正在自动启动超时监控系统...');
					this.checkAndStartTimeoutMonitoring();
				} else {
					console.log('🔐 [App] 用户未认证，显示默认状态');
					// 设置默认TabBar
					await DynamicTabBarManager.resetToDefault();
				}

					// 设置全局数据
					this.setGlobalData('appInitialized', true);
					this.setGlobalData('isAuthenticated', isAuthenticated);
					
							// 🔄 设置监控相关的事件监听（自动运行）
		this.setupTimeoutMonitoringEvents();
		
		console.log('🔄 [App] 超时监控系统已配置为自动运行模式，无需手动开启');

				} catch (error) {
					console.error('❌ [App] 应用初始化失败:', error);

					// 初始化失败时的降级处理
					await DynamicTabBarManager.resetToDefault();
				}
			},

			/**
			 * 刷新TabBar
			 */
			async refreshTabBar() {
				try {
					const userInfo = uni.getStorageSync('userInfo');
					const currentRole = userInfo?.role;
					const globalRole = this.getGlobalData('currentRole');

					// 检查角色是否发生变化
					if (currentRole && currentRole !== globalRole) {
						console.log('🔄 [App] 角色变化，重新设置TabBar:', globalRole, '->', currentRole);

						await DynamicTabBarManager.setTabBarByRole(currentRole);
						this.setGlobalData('currentRole', currentRole);

						// 触发全局角色变化事件
						uni.$emit('roleChanged', {
							oldRole: globalRole,
							newRole: currentRole
						});
					}

				} catch (error) {
					console.error('❌ [App] TabBar刷新失败:', error);
				}
			},

			// 检查用户授权状态（保留原有逻辑）
			checkUserAuth() {
				try {
					const userInfo = uni.getStorageSync('userInfo')
					console.log('检查用户授权状态:', userInfo)

					if (userInfo && userInfo.isAuthorized && userInfo.phone) {
						// 用户已授权，保存到全局状态
						if (store) {
							store.commit('$tStore', {
								name: 'vuex_user_info',
								value: userInfo
							})
						}
						console.log('用户已授权，角色:', userInfo.role)

						// 设置全局标记，表示用户已授权
						this.setGlobalData('isAuthorized', true)
						this.setGlobalData('userInfo', userInfo)
						this.setGlobalData('currentRole', userInfo.role)

					} else {
						console.log('用户未授权，将显示授权页面')
						// 清除可能存在的无效用户信息
						uni.removeStorageSync('userInfo')

						// 设置全局标记，表示用户未授权
						this.setGlobalData('isAuthorized', false)
					}
				} catch (error) {
					console.error('检查授权状态失败:', error)
					// 发生错误时清除用户信息
					uni.removeStorageSync('userInfo')
					this.setGlobalData('isAuthorized', false)
				}
			},

			/**
			 * 获取全局数据
			 * @param {string} key - 数据键名
			 */
			getGlobalData(key) {
				try {
					const app = getApp();
					if (app && app.globalData) {
						return app.globalData[key];
					}
				} catch (error) {
					console.warn('获取全局数据失败:', error);
				}
				return null;
			},

			// 安全地设置全局数据
			setGlobalData(key, value, retryCount = 0) {
				try {
					const app = getApp()
					if (app) {
						if (!app.globalData) {
							app.globalData = {}
						}
						app.globalData[key] = value
						console.log(`设置全局数据 ${key}:`, value)
					} else {
						console.warn('getApp() 返回空值，无法设置全局数据')
						// 如果 getApp() 返回空值，尝试重试（最多3次）
						if (retryCount < 3) {
							setTimeout(() => {
								this.setGlobalData(key, value, retryCount + 1)
							}, 200)
						}
					}
				} catch (error) {
					console.error('设置全局数据失败:', error)
					// 发生异常时也尝试重试
					if (retryCount < 3) {
						setTimeout(() => {
							this.setGlobalData(key, value, retryCount + 1)
						}, 200)
					}
				}
			},

					/**
		 * 🔄 自动检查并启动超时监控（基于timeout-monitor.vue验证的功能）
		 * 无需手动开启，应用启动时自动运行
		 */
		async checkAndStartTimeoutMonitoring() {
			try {
				console.log('🔍 [App] 自动检查超时监控启动条件');
				
				// 检查用户授权状态
				const userInfo = uni.getStorageSync('userInfo');
				console.log('👤 [App] 当前用户信息:', userInfo);
				
				if (!userInfo || !userInfo.isAuthorized) {
					console.log('🚫 [App] 用户未授权，无法自动启动监控');
					return false;
				}
				
				// 检查用户角色权限（与timeout-monitor.vue保持一致）
				const currentRole = userInfo.role;
				if (!['manager', 'owner'].includes(currentRole)) {
					console.log('🔒 [App] 用户角色无监控权限:', currentRole);
					return false;
				}
				
				// 延迟启动，确保应用完全初始化
				setTimeout(async () => {
					console.log('⏰ [App] 自动启动超时监控');
					
					try {
						// 使用与timeout-monitor.vue相同的启动逻辑
						const started = await TimeoutMonitoring.checkAndStartMonitoring();
						console.log("🚀 [App] 监控自动启动结果:", started);
						
						if (started) {
							console.log('🟢 [App] 超时监控已自动启动成功');
							
							// 设置定期状态检查（每5分钟检查一次监控是否还在运行）
							this.setupMonitoringHealthCheck();
							
							// 设置全局标记，表示监控已启动
							this.setGlobalData('timeoutMonitoringStarted', true);
							
							// 触发监控启动事件
							uni.$emit('monitoring-status-changed', {
								isMonitoring: true,
								autoStarted: true
							});
						} else {
							console.log('⚪ [App] 暂无需要监控的车辆或自动启动失败');
							this.setGlobalData('timeoutMonitoringStarted', false);
						}
					} catch (error) {
						console.error('❌ [App] 自动启动监控过程中发生错误:', error);
						this.setGlobalData('timeoutMonitoringStarted', false);
					}
				}, 2000); // 延迟2秒启动
				
				return true;
				
			} catch (error) {
				console.error('❌ [App] 自动启动超时监控失败:', error);
				this.setGlobalData('timeoutMonitoringStarted', false);
				return false;
			}
		},

			/**
			 * 🔄 自动设置监控健康检查（自动运行，无需手动开启）
			 */
			setupMonitoringHealthCheck() {
				// 清除现有的健康检查定时器
				if (this.healthCheckTimer) {
					clearInterval(this.healthCheckTimer);
					console.log('🧹 [App] 清除旧的健康检查定时器');
				}
				
				// 每5分钟自动检查一次监控状态
				this.healthCheckTimer = setInterval(async () => {
					console.log('🏥 [App] 自动执行监控健康检查');
					
					try {
						const status = TimeoutMonitoring.getMonitoringStatus();
						console.log('📊 [App] 当前监控状态:', status);
						
						if (status.isMonitoring) {
							console.log('✅ [App] 监控正常运行，活跃车辆:', status.recentActiveCount);
						} else {
							console.log('⚠️ [App] 监控已停止，自动检查是否需要重新启动');
							
							// 自动检查是否有新的车辆需要监控
							const needsRestart = await TimeoutMonitoring.shouldStartMonitoring();
							if (needsRestart) {
								console.log('🟢 [App] 发现新的活跃车辆，自动重新启动监控');
								const restarted = await TimeoutMonitoring.checkAndStartMonitoring();
								if (restarted) {
									console.log('✅ [App] 监控自动重启成功');
									// 触发监控重启事件
									uni.$emit('monitoring-status-changed', {
										isMonitoring: true,
										autoRestarted: true
									});
								} else {
									console.log('❌ [App] 监控自动重启失败');
								}
							} else {
								console.log('⚪ [App] 暂无需要监控的车辆，保持停止状态');
							}
						}
					} catch (error) {
						console.error('❌ [App] 自动健康检查失败:', error);
					}
				}, 5 * 60 * 1000); // 5分钟
				
				console.log('🏥 [App] 自动监控健康检查已设置，间隔5分钟');
			},

			/**
			 *  处理应用进入后台（优化版本）
			 */
			handleAppGoBackground() {
				try {
					const status = TimeoutMonitoring.getMonitoringStatus();
					if (status.isMonitoring) {
						console.log('📱 [App] 应用进入后台，监控继续运行');
						console.log('📊 [App] 当前活跃车辆:', status.recentActiveCount);
					} else {
						console.log(' [App] 应用进入后台，监控已停止');
					}
				} catch (error) {
					console.error('❌ [App] 处理后台逻辑失败:', error);
				}
			},

			/**
			 * 🆕 停止超时监控（优化版本）
			 */
			stopTimeoutMonitoring() {
				try {
					TimeoutMonitoring.stopMonitoring();
					console.log('🔴 [App] 超时监控已停止');
					
					// 清理健康检查定时器
					if (this.healthCheckTimer) {
						clearInterval(this.healthCheckTimer);
						this.healthCheckTimer = null;
						console.log('🧹 [App] 健康检查定时器已清理');
					}
					
					// 设置全局标记
					this.setGlobalData('timeoutMonitoringStarted', false);
					
				} catch (error) {
					console.error('❌ [App] 停止超时监控失败:', error);
				}
			},

			/**
			 * 🆕 获取监控状态（调试用）
			 */
			getTimeoutMonitoringStatus() {
				const status = TimeoutMonitoring.getMonitoringStatus();
				console.log('📊 [App] 获取监控状态:', status);
				return status;
			},

			/**
			 * 🆕 设置超时监控相关事件监听（优化版本）
			 */
			setupTimeoutMonitoringEvents() {
				try {
					// 监听车辆状态变化事件
					uni.$on('parking-status-changed', this.handleParkingStatusChanged);
					
					// 监听用户登出事件
					uni.$on('user-logout', this.handleUserLogout);
					
					// 监听页面跳转到停车页面
					uni.$on('navigate-to-parking', this.handleNavigateToParking);
					
					// 监听监控状态变化事件
					uni.$on('monitoring-status-changed', this.handleMonitoringStatusChanged);
					
					console.log('🎯 [App] 超时监控事件监听已设置');
				} catch (error) {
					console.error('❌ [App] 设置监控事件监听失败:', error);
				}
			},

			/**
			 *  处理停车状态变化（优化版本）
			 */
			handleParkingStatusChanged(data) {
				try {
					console.log('📡 [App] 收到停车状态变化事件:', data);
					
					// 延迟重新检查监控条件，确保数据已更新
					setTimeout(() => {
						this.checkAndStartTimeoutMonitoring();
					}, 2000);
					
				} catch (error) {
					console.error('❌ [App] 处理停车状态变化失败:', error);
				}
			},

			/**
			 * 🆕 处理用户登出（优化版本）
			 */
			handleUserLogout() {
				try {
					console.log('👋 [App] 用户登出，停止超时监控');
					this.stopTimeoutMonitoring();
					
					// 设置全局标记
					this.setGlobalData('timeoutMonitoringStarted', false);
					
				} catch (error) {
					console.error('❌ [App] 处理用户登出失败:', error);
				}
			},

			/**
			 * 🆕 处理跳转到停车页面（优化版本）
			 */
			handleNavigateToParking(data) {
				try {
					console.log('🚗 [App] 跳转到停车页面:', data);
					
					// 延迟检查，确保页面加载完成
					setTimeout(() => {
						this.checkAndStartTimeoutMonitoring();
					}, 3000);
					
				} catch (error) {
					console.error('❌ [App] 处理停车页面跳转失败:', error);
				}
			},

			/**
			 *  处理监控状态变化
			 */
			handleMonitoringStatusChanged(data) {
				try {
					console.log('📡 [App] 收到监控状态变化事件:', data);
					
					// 更新全局状态
					this.setGlobalData('timeoutMonitoringStarted', data.isMonitoring);
					
				} catch (error) {
					console.error('❌ [App] 处理监控状态变化失败:', error);
				}
			},

			/**
			 *  清理超时监控资源（优化版本）
			 */
			cleanupTimeoutMonitoring() {
				try {
					// 停止监控
					this.stopTimeoutMonitoring();
					
					// 移除事件监听
					uni.$off('parking-status-changed', this.handleParkingStatusChanged);
					uni.$off('user-logout', this.handleUserLogout);
					uni.$off('navigate-to-parking', this.handleNavigateToParking);
					uni.$off('monitoring-status-changed', this.handleMonitoringStatusChanged);
					
					// 清除全局标记
					this.setGlobalData('timeoutMonitoringStarted', false);
					
					console.log('🧹 [App] 超时监控资源已清理');
				} catch (error) {
					console.error('❌ [App] 清理监控资源失败:', error);
				}
			},

			/**
			 *  手动调试监控状态（全局方法）
			 */
			debugTimeoutMonitoring() {
				console.log(' [App] 手动调试监控状态');
				return TimeoutMonitoring.debugMonitoringStatus();
			},

			/**
			 * 🆕 手动重启监控（全局方法）
			 */
			async restartTimeoutMonitoring() {
				console.log('🔧 [App] 手动重启监控');
				try {
					await TimeoutMonitoring.forceRestartMonitoring();
					console.log('✅ [App] 监控重启完成');
					return true;
				} catch (error) {
					console.error('❌ [App] 监控重启失败:', error);
					return false;
				}
			},

			/**
			 *  强制检查超时车辆（全局方法）
			 */
			async forceCheckTimeout() {
				console.log(' [App] 强制检查超时车辆');
				try {
					await TimeoutMonitoring.forceCheck();
					console.log('✅ [App] 强制检查完成');
					return true;
				} catch (error) {
					console.error('❌ [App] 强制检查失败:', error);
					return false;
				}
			},

			/**
			 * 🆕 检查5分钟内即将超时的车辆（全局方法）
			 */
			async check5MinutesTimeout() {
				console.log('⏰ [App] 检查5分钟内即将超时的车辆');
				try {
					const vehicles = await TimeoutMonitoring.check5MinutesTimeout();
					console.log(`📊 [App] 5分钟内即将超时: ${vehicles.length}辆`);
					return vehicles;
				} catch (error) {
					console.error('❌ [App] 5分钟超时检查失败:', error);
					return [];
				}
			},

			/**
			 * 🆕 检查1分钟内即将超时的车辆（全局方法）
			 */
			async check1MinuteTimeout() {
				console.log('⏰ [App] 检查1分钟内即将超时的车辆');
				try {
					const vehicles = await TimeoutMonitoring.check1MinuteTimeout();
					console.log(`📊 [App] 1分钟内即将超时: ${vehicles.length}辆`);
					return vehicles;
				} catch (error) {
					console.error('❌ [App] 1分钟超时检查失败:', error);
					return [];
				}
			},

			/**
			 * 🆕 分级检查超时车辆（全局方法）
			 */
			async performTieredTimeoutCheck() {
				console.log('🔍 [App] 执行分级超时检查');
				try {
					const results = await TimeoutMonitoring.performTieredTimeoutCheck();
					console.log(`📊 [App] 分级检查结果:`, results);
					return results;
				} catch (error) {
					console.error('❌ [App] 分级检查失败:', error);
					return { '1min': [], '5min': [], '15min': [], total: 0 };
				}
			},

			/**
			 * 🆕 手动发送超时通知（调试用）
			 */
			async sendTimeoutNotificationManually(plateNumber) {
				console.log('📤 [App] 手动发送超时通知:', plateNumber);
				try {
					// 模拟车辆数据
					const vehicle = {
						plateNumber: plateNumber,
						remainingMinutes: 5,
						parkName: '测试停车场',
						notificationType: 'manual_test'
					};
					
					const result = await TimeoutMonitoring.sendTimeoutNotification(vehicle);
					console.log('✅ [App] 手动发送通知完成:', result);
					return result;
				} catch (error) {
					console.error('❌ [App] 手动发送通知失败:', error);
					return false;
				}
			}
		}
	}
</script>

<style lang="scss">
	/*每个页面公共css */
	/*colorui css */
	@import "static/css/common.css";
	@import "static/colorui/main.css";
	@import "static/colorui/icon.css";

	/* 只保留uView UI样式，移除TuniaoUI样式 */
	@import "@/uni_modules/uview-ui/index.scss";

	*,
	view,
	navigator {
		box-sizing: border-box;
	}

	.warp {
		background: #f5f5f5;
	}

	.car_park {
		width: 690rpx;
		border: 2rpx solid #ededed;
		border-radius: 10rpx;
		@include flex;
		justify-content: space-between;
		font-size: 28rpx;
		padding: 10rpx 24rpx;
	}

	.all_title_box {
		width: 100%;
		@include flex;
		justify-content: space-between;
		align-items: center;
		padding: 24rpx 0;

		.title {
			font-size: 32rpx;
			position: relative;
			padding-left: 34rpx;

			&::after {
				width: 24rpx;
				height: 6rpx;
				border-radius: 34rpx;
				background: #527bff;
				content: '';
				position: absolute;
				left: 0rpx;
				top: 10rpx;
			}
		}

		.time {
			@include flex;
			justify-content: space-between;
			align-items: center;

			.t {
				font-size: 28rpx;
				padding-right: 10rpx;
			}
		}
	}

	.lattice_box {
		width: 690rpx;
		@include flex;
		justify-content: space-between;
		flex-wrap: wrap;

		.item {
			width: 330rpx;
			height: 128rpx;
			border-radius: 10rpx;
			margin-top: 30rpx;
			padding: 20rpx 30rpx;
			position: relative;

			&.item_1 {
				background-color: rgba(253, 230, 231, 1);
				color: #CE413E;

				.lines {
					width: 100%;
					@include flex;
					justify-content: space-between;
					align-items: center;

					&:nth-child(1) {
						padding-bottom: 10rpx;
					}

					.title {
						font-size: 28rpx;
					}

					.price {
						font-size: 28rpx;
					}

					.titles {
						font-size: 24rpx;
					}

					.nums {
						font-size: 24rpx;
					}
				}
			}

			&.item_2 {
				background-color: rgba(209, 255, 233, 1);
				color: #33BF73;

				.lines {
					width: 100%;
					@include flex;
					justify-content: space-between;
					align-items: center;

					&:nth-child(1) {
						padding-bottom: 10rpx;
					}

					.title {
						font-size: 28rpx;
					}

					.price {
						font-size: 28rpx;
					}

					.titles {
						font-size: 24rpx;
					}

					.nums {
						font-size: 24rpx;
					}
				}
			}

			&.item_3 {
				background-color: rgba(190, 214, 249, 1);
				color: #3E7ACE;

				.title {
					display: block;
					font-size: 28rpx;
					padding-bottom: 10rpx;
				}

				.label {
					display: block;
					font-size: 24rpx;
				}

				.icon_box {
					width: 86rpx;
					height: 86rpx;
					line-height: 86rpx;
					border-radius: 86rpx;
					background: #3E7ACE;
					@include flex;
					justify-content: center;
					align-items: center;
					position: absolute;
					right: 24rpx;
					top: 50%;
					margin-top: -43rpx;
				}
			}

			&.item_4 {
				background-color: rgba(251, 223, 149, 1);
				color: #A17811;

				.title {
					display: block;
					font-size: 28rpx;
					padding-bottom: 10rpx;
				}

				.label {
					display: block;
					font-size: 24rpx;
				}

				.icon_box {
					width: 86rpx;
					height: 86rpx;
					line-height: 86rpx;
					border-radius: 86rpx;
					background: #A17811;
					@include flex;
					justify-content: center;
					align-items: center;
					position: absolute;
					right: 24rpx;
					top: 50%;
					margin-top: -43rpx;
				}
			}
		}
	}

	//表格
	$div-table-border-color: #ededed;
	$div-table-border-width: 1rpx;

	.div-table {
		display: table;
		width: 100%;
		height: 100%;
		border: $div-table-border-width solid $div-table-border-color;
		box-sizing: border-box;
		table-layout: fixed;
		position: relative;

		.celspan {
			display: table;
			width: 100%;
			height: 100%;

			.td {
				display: table-cell;
				border: none !important;
			}

			.td+.td {
				border-left: $div-table-border-width solid $div-table-border-color !important;
			}
		}

		.rowspan {
			display: table;
			width: 100%;
			height: 100%;

			.tr {
				display: table-row;
				border: none !important;
			}
		}

		&.fixed-thead {

			.tbody,
			.thead,
			.tr,
			.th,
			.td {
				display: block;
			}

			.tr,
			.th {
				&:after {
					content: '';
					display: block;
					visibility: hidden;
					clear: both;
					height: 0;
				}
			}

			.td {
				float: left;
				color: #333;
				font-size: 26rpx;
			}
		}

		.tr,
		.th {
			display: table-row;

			&+.tr,
			&+.th {

				.td,
				.th {
					border-top: $div-table-border-width solid $div-table-border-color;
					word-break: break-word;
				}
			}
		}

		.rowspan {

			.tr,
			.th {
				display: table-row;

				.td,
				.th {
					border: none;
				}

				&+.tr,
				&+.th {

					.td,
					.th {
						border-top: $div-table-border-width solid $div-table-border-color;
					}
				}
			}
		}

		.td {
			display: table-cell;
			vertical-align: middle;
			text-align: center;
			box-sizing: border-box;
			padding: 18rpx 20rpx;

			&.noPadding {
				padding: 0;
			}

			&+.td {
				border-left: $div-table-border-width solid $div-table-border-color;
			}
		}

		.tbody {
			display: table-row-group;
		}

		.thead {
			display: table-header-group;

			.tr,
			.th {

				.td,
				.th {
					border-bottom: $div-table-border-width solid $div-table-border-color;
				}
			}
		}

		.tfoot {
			display: table-footer-group;

			.tr,
			.th {

				.td,
				.th {
					border-top: $div-table-border-width solid $div-table-border-color;
				}
			}
		}

		.colgroup {
			display: table-column-group;
		}

		.col {
			display: table-column;
		}

		.caption {
			display: table-caption;
		}
	}
</style>