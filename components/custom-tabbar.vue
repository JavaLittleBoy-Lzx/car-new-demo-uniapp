<!-- 自定义动态TabBar -->
<template>
	<view>
		<!-- 🆕 状态横条（TabBar上方） -->
		<view 
			v-if="shouldShowTabBar && currentUserRole === 'patrol' && dutyStatus" 
			class="duty-status-bar"
			:class="dutyStatus.enabled ? 'duty-on' : 'duty-off'"
			@click="handleDutyBarClick"
		>
			<view class="status-content">
				<text class="status-dot">{{ dutyStatus.enabled ? '🟢' : '⭕' }}</text>
				<text class="status-text">
					{{ dutyStatus.enabled ? '值班中 - 正在接收消息提醒' : '离岗 - 消息提醒已关闭' }}
				</text>
				<text class="status-hint">点击切换</text>
			</view>
		</view>
		
		<!-- TabBar -->
		<view v-show="shouldShowTabBar" class="custom-tabbar" :style="{ backgroundColor: themeConfig.backgroundColor }">
			<view v-for="(item, index) in visibleTabs" :key="item.pagePath" class="tabbar-item"
				:class="{ active: currentIndex === index }" @click="switchTab(item, index)">
				<view class="tabbar-icon">
					<image class="icon-image" :src="currentIndex === index ? item.selectedIconPath : item.iconPath"
						mode="aspectFit" />
					
					<!-- 🆕 值班状态徽标（仅巡检员的违规查询菜单显示） -->
					<view 
						v-if="currentUserRole === 'patrol' && item.pagePath === 'pagesE/violation/violation' && dutyStatus" 
						class="duty-badge"
						:class="dutyStatus.enabled ? 'badge-on' : 'badge-off'"
					>
						<text class="badge-dot">●</text>
					</view>
				</view>
				<text class="tabbar-text"
					:style="{ color: currentIndex === index ? themeConfig.selectedColor : themeConfig.color }">
					{{ item.text }}
				</text>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		name: "CustomTabBar",
		props: {
			selectedIndex: {
				type: Number,
				default: -1 // 改为-1，表示自动检测
			},
			userRole: { // 用户角色（可选，如果不传则自动获取）
				type: String,
				default: ''
			},
			// 🆕 值班状态
			dutyStatus: {
				type: Object,
				default: () => ({ enabled: false })
			}
		},
		data() {
			return {
				currentIndex: 0,
				currentUserRole: '', // 内部维护的用户角色
				// TabBar配置
				tabBarConfigs: {
					// 业主配置 (3个Tab)
					// owner: [{
					// 		pagePath: "pagesA/reservation/form",
					// 		text: "业主预约",
					// 		iconPath: "/static/coolc/icon/home.png",
					// 		selectedIconPath: "/static/coolc/icon/home_selected.png"
					// 	},
					// 	{
					// 		pagePath: "pagesA/reservation/searchResult/searchResult",
					// 		text: "预约查询",
					// 		iconPath: "/static/icons/carReservation/car_reservation.png",
					// 		selectedIconPath: "/static/icons/carReservation/car_reservation_selected.png"
					// 	},
					// 	{
					// 		pagePath: "pagesE/violation/owner-new-violation",
					// 		text: "违规车辆",
					// 		iconPath: "/static/L_AID_Violation.png",
					// 		selectedIconPath: "/static/icon-violation-nature.png"
					// 	}
					// ],

					// 管家配置 (5个Tab)
					manager: [{
							pagePath: "pagesA/reservation/form",
							text: "代人预约",
							iconPath: "/static/coolc/icon/home.png",
							selectedIconPath: "/static/coolc/icon/home_selected.png"
						},
						{
							pagePath: "pagesA/reservation/searchResult/searchResult",
							text: "预约查询",
							iconPath: "/static/icons/carReservation/car_reservation.png",
							selectedIconPath: "/static/icons/carReservation/car_reservation_selected.png"
						},
						{
							pagePath: "pagesB/butler/qrcode-generator",
							text: "访客邀请",
							iconPath: "/static/icons/vistor.png",
							selectedIconPath: "/static/icons/vistor-selected.png"
						},
						{
							pagePath: "pagesE/violation/violation",
							text: "违规管理",
							iconPath: "/static/L_AID_Violation.png",
							selectedIconPath: "/static/icon-violation-nature.png"
						},
						// {
						// 	pagePath: "pages/site/facility",
						// 	text: "预约审核",
						// 	iconPath: "/static/icons/facility/unselected.png",
						// 	selectedIconPath: "/static/icons/facility/selected.png"
						// }
					],

					// 🆕 巡逻员角色 (2个Tab)
					patrol: [{
							pagePath: "pagesE/violation/add-violation",
							text: "违规添加",
							iconPath: "/static/icons/add-violation.png",
							selectedIconPath: "/static/icons/add-violation-active.png"
						},
						{
							pagePath: "pagesE/violation/violation",
							text: "违规查询",
							iconPath: "/static/L_AID_Violation.png",
							selectedIconPath: "/static/icon-violation-nature.png"
						}
					],
					// 访客角色 (2个Tab)
					// visitor: [{
					// 		pagePath: "pagesA/reservation/form",
					// 		text: "访客预约",
					// 		iconPath: "/static/coolc/icon/home.png",
					// 		selectedIconPath: "/static/coolc/icon/home_selected.png"
					// 	},
					// 	{
					// 		pagePath: "pagesA/reservation/searchResult/searchResult",
					// 		text: "预约查询",
					// 		iconPath: "/static/icons/carReservation/car_reservation.png",
					// 		selectedIconPath: "/static/icons/carReservation/car_reservation_selected.png"
					// 	}
					// ]
				},

				// 主题配置
				themeConfigs: {
					owner: {
						selectedColor: '#007AFF',
						color: '#999999',
						backgroundColor: '#ffffff'
					},
					manager: {
						selectedColor: '#007AFF',
						color: '#999999',
						backgroundColor: '#ffffff'
					},
					patrol: {
						selectedColor: '#0081ff',
						color: '#999999',
						backgroundColor: '#ffffff'
					},
					visitor: {
						selectedColor: '#007AFF',
						color: '#999999',
						backgroundColor: '#ffffff'
					}
				}
			}
		},

		computed: {
			// 获取当前角色的可见Tab
			visibleTabs() {
				const role = this.getCurrentRole();
				return this.tabBarConfigs[role] || this.tabBarConfigs.owner || [];
			},

			// 获取当前角色的主题配置
			themeConfig() {
				const role = this.getCurrentRole();
				return this.themeConfigs[role] || this.themeConfigs.owner;
			},

			// 判断是否应该显示TabBar
			shouldShowTabBar() {
				const pages = getCurrentPages();
				if (pages.length === 0) return false;

				const currentPage = pages[pages.length - 1];
				const currentRoute = currentPage.route;

				// 定义TabBar页面路径
				const tabBarPages = [
					'pages/reservation/form',
					'pages/reservation/searchResult/searchResult',
					'pagesE/violation/owner-new-violation',
					'pagesE/violation/add-violation', // 🆕 违规添加页面
					'pagesE/violation/violation', // 🆕 违规查询页面
					'pages/site/facility',
					'pagesB/butler/qrcode-generator'
				];

				// 如果当前页面是TabBar页面，则显示TabBar
				return tabBarPages.includes(currentRoute);
			}
		},

		watch: {
			selectedIndex: {
				handler(newVal) {
					if (newVal >= 0) {
						this.currentIndex = newVal;
					} else {
						// 自动检测当前页面对应的索引
						this.detectCurrentPageIndex();
					}
				},
				immediate: true
			},

			userRole: {
				handler() {
					// 角色变化时重新检测当前页面索引
					this.$nextTick(() => {
						this.detectCurrentPageIndex();
					});
				},
				immediate: true
			},

			// 监听可见Tab变化，重新检测索引
			visibleTabs: {
				handler(newTabs, oldTabs) {
					if (newTabs && newTabs.length !== (oldTabs ? oldTabs.length : 0)) {
						this.$nextTick(() => {
							this.detectCurrentPageIndex();
						});
					}
				},
				immediate: false
			}
		},
		created() {
			// 初始化用户角色
			this.initUserRole();

			// 如果没有明确指定selectedIndex，则自动检测
			if (this.selectedIndex < 0) {
				this.detectCurrentPageIndex();
			} else {
				this.currentIndex = this.selectedIndex;
			}

			// 监听自定义事件，用于页面间的状态同步
			uni.$on('updateTabBarIndex', (index) => {
				if (typeof index === 'number' && index >= 0 && index < this.visibleTabs.length) {
					this.currentIndex = index;
				} else {
					this.detectCurrentPageIndex();
				}
			});

			// 监听页面状态同步事件
			uni.$on('syncTabBarState', () => {
				this.detectCurrentPageIndex();
			});

			// 监听角色变化事件
			uni.$on('roleChanged', (roleData) => {
				console.log('🎭 [TabBar] 收到角色变化事件:', roleData);
				this.initUserRole(); // 重新初始化角色
				this.$nextTick(() => {
					this.detectCurrentPageIndex(); // 重新检测当前页面索引
				});
			});
		},

		mounted() {
			// 强制隐藏系统TabBar
			this.hideSystemTabBar();

			// 页面挂载后再次检测，增加延迟确保页面完全加载
			this.$nextTick(() => {
				setTimeout(() => {
					this.detectCurrentPageIndex();
				}, 50);
			});
		},

		beforeDestroy() {
			// 清理事件监听
			uni.$off('updateTabBarIndex');
			uni.$off('syncTabBarState');
			uni.$off('roleChanged');
		},

		methods: {
			// 获取当前用户角色
			getCurrentRole() {
				// 优先使用props传入的角色
				if (this.userRole) {
					return this.userRole;
				}

				// 使用内部维护的角色
				if (this.currentUserRole) {
					return this.currentUserRole;
				}

				// 从存储中获取角色
				try {
					const userInfo = uni.getStorageSync('userInfo');
					if (userInfo && userInfo.role) {
						this.currentUserRole = userInfo.role;
						return userInfo.role;
					}
				} catch (error) {
					console.error('获取用户角色失败:', error);
				}

				// 默认返回访客角色
				return 'visitor';
			},

			// 初始化用户角色
			initUserRole() {
				try {
					const userInfo = uni.getStorageSync('userInfo');
					if (userInfo && userInfo.role) {
						this.currentUserRole = userInfo.role;
						console.log('🎭 [TabBar] 初始化用户角色:', this.currentUserRole);
					} else {
						this.currentUserRole = 'visitor';
						console.log('🎭 [TabBar] 未找到用户角色，默认为访客');
					}
				} catch (error) {
					console.error(' [TabBar] 初始化用户角色失败:', error);
					this.currentUserRole = 'visitor';
				}
			},

			// 检测当前页面对应的Tab索引
			detectCurrentPageIndex() {
				const pages = getCurrentPages();
				if (pages.length === 0) {
					return;
				}

				// 防御性检查：如果visibleTabs未定义或为空，直接返回
				if (!this.visibleTabs || this.visibleTabs.length === 0) {
					console.log(' CustomTabBar visibleTabs 为空，跳过索引检测');
					return;
				}

				const currentPage = pages[pages.length - 1];
				const currentRoute = currentPage.route;


				// 在当前角色的可见Tab中查找匹配的页面
				const matchIndex = this.visibleTabs.findIndex(tab => {
					const matches = tab.pagePath === currentRoute;
					return matches;
				});

				if (matchIndex !== -1) {
					this.currentIndex = matchIndex;

					// 强制触发视图更新
					this.$forceUpdate();
				} else {
					console.log('⚠️ CustomTabBar 未找到匹配页面，保持当前索引:', this.currentIndex);
					console.log('📋 可用的Tab路径:', this.visibleTabs.map(tab => tab.pagePath));
				}
			},

			// 切换Tab
			async switchTab(item, index) {
				const currentRole = this.getCurrentRole();

				// 🔒 访客角色特殊处理
				if (currentRole === 'visitor') {
					// 🔒 检查访客点击预约查询的情况
					if (item.pagePath === 'pagesA/reservation/searchResult/searchResult') {
						console.log('🔍 [TabBar] 访客点击预约查询，检查是否已完成预约');

						// 检查访客是否已完成预约
						const hasCompletedAppointment = await this.checkVisitorCompletedAppointment();
						if (!hasCompletedAppointment) {
							console.warn('⚠️ [TabBar] 访客尚未完成预约，阻止进入查询页面');

							// 显示提示信息
							uni.showModal({
								title: '请先完成预约',
								content: '您需要先完成预约提交，才能查询预约记录。\n\n💡 温馨提示：\n• 请填写完整的预约信息\n• 选择预约时间和车牌号\n• 点击"提交预约"按钮\n• 预约成功后即可查询记录\n\n🔄 请返回预约页面完成预约',
								showCancel: true,
								cancelText: '继续预约',
								confirmText: '知道了',
								success: (res) => {
									if (!res.confirm) {
										// 用户选择继续预约，跳转到预约页面
										this.navigateToTab({
											pagePath: 'pagesA/reservation/form'
										}, 0);
									}
								}
							});
							return; // 阻止继续执行
						}
					}

					// 🔒 检查访客点击预约页面的情况
					if (item.pagePath === 'pagesA/reservation/form') {
						console.log('🔍 [TabBar] 访客点击预约导航，检查二维码使用状态');

						// 检查是否有已使用的二维码
						const hasUsedQrCode = await this.checkVisitorQrCodeUsage();
						if (hasUsedQrCode) {
							console.warn('🔒 [TabBar] 访客二维码已使用，阻止进入预约页面');

							// 显示提示信息
							uni.showModal({
								title: '无法进入预约',
								content: '您的访客二维码已经使用过了，每个二维码只能使用一次。\n\n您可以：\n• 查询已有的预约记录\n• 联系管家重新生成二维码',
								showCancel: true,
								cancelText: '查询记录',
								confirmText: '知道了',
								success: (res) => {
									if (!res.confirm) {
										// 用户选择查询记录，跳转到查询页面
										this.navigateToQueryPage();
									}
								}
							});
							return; // 阻止继续执行
						}
					}
				}

				// 立即更新当前索引，不等待跳转完成
				this.currentIndex = index;

				// 通知父组件
				this.$emit('tabChange', {
					index: index,
					item: item,
					pagePath: item.pagePath
				});

				// 广播状态更新事件
				uni.$emit('updateTabBarIndex', index);

				// 执行页面跳转
				this.navigateToTab(item, index);
			},

			// 修复的导航跳转逻辑
			navigateToTab(item, index) {
				let fullPath = '/' + item.pagePath;

				// 🆕 特殊处理：如果跳转到searchResult页面，添加fromTabBar参数
				if (item.pagePath === 'pagesA/reservation/searchResult/searchResult') {
					fullPath += '?fromTabBar=true';
					console.log('🏠 [TabBar] 从底部导航栏跳转到查询页面，将显示欢迎界面');
				}

				// 特殊处理：如果跳转到form.vue且用户是访客，需要携带qrId参数
				if (item.pagePath === 'pagesA/reservation/form') {  
					const currentRole = this.getCurrentRole();
					if (currentRole === 'visitor') {
						// 从本地存储中获取scannedQrId
						const scannedQrId = uni.getStorageSync('scannedQrId');
						if (scannedQrId) {
							fullPath += `?qrId=${scannedQrId}`;
							console.log('🔧 [TabBar] 访客跳转到form.vue，携带qrId参数:', scannedQrId);
						} else {
							console.warn('⚠️ [TabBar] 访客跳转到form.vue，但未找到scannedQrId');
						}
					}
				}

				// 获取当前页面栈
				const pages = getCurrentPages();
				const currentPage = pages[pages.length - 1];
				const currentRoute = currentPage ? currentPage.route : '';

				// 如果是同一个页面，不需要跳转
				if (currentRoute === item.pagePath) {
					console.log('🔄 [TabBar] 已在当前页面，无需跳转:', item.pagePath);
					return;
				}

				// 定义TabBar页面路径（这些页面之间可以直接跳转）
				const tabBarPages = [
					'pages/reservation/form',
					'pages/reservation/searchResult/searchResult',
					'pagesE/violation/owner-new-violation',
					'pagesE/violation/add-violation', // 🆕 违规添加页面
					'pagesE/violation/violation', // 🆕 违规查询页面
					'pages/site/facility',
					'pagesB/butler/qrcode-generator'
				];

				const isTabBarPage = tabBarPages.includes(item.pagePath);
				const isCurrentTabBarPage = tabBarPages.includes(currentRoute);

				if (isTabBarPage && isCurrentTabBarPage) {
					// TabBar页面之间的跳转，使用reLaunch确保页面栈清理
					uni.reLaunch({
						url: fullPath,
						success: () => {
							console.log('✅ [TabBar] reLaunch成功:', fullPath);
							this.$nextTick(() => {
								this.currentIndex = index;
								uni.$emit('updateTabBarIndex', index);
								setTimeout(() => {
									this.detectCurrentPageIndex();
								}, 100);
							});
						},
						fail: (err) => {
							console.error('❌ [TabBar] reLaunch失败:', err);
							// 降级使用navigateTo
							this.fallbackNavigate(fullPath, index);
						}
					});
				} else {
					// 其他情况使用navigateTo
					this.fallbackNavigate(fullPath, index);
				}
			},

			// 降级导航方法
			fallbackNavigate(fullPath, index) {
				uni.navigateTo({
					url: fullPath,
					success: () => {
						console.log('✅ [TabBar] navigateTo成功:', fullPath);
						this.currentIndex = index;
						uni.$emit('updateTabBarIndex', index);
					},
					fail: (err) => {
						console.error('❌ [TabBar] navigateTo失败:', err);
						// 最后尝试redirectTo
						uni.redirectTo({
							url: fullPath,
							success: () => {
								console.log('✅ [TabBar] redirectTo成功:', fullPath);
								this.currentIndex = index;
								uni.$emit('updateTabBarIndex', index);
							},
							fail: (redirectErr) => {
								console.error('❌ [TabBar] 所有跳转方式都失败:', redirectErr);
								// 重置状态
								this.detectCurrentPageIndex();
								uni.showToast({
									title: '页面跳转失败',
									icon: 'none',
									duration: 2000
								});
							}
						});
					}
				});
			},

			// 更新选中索引（供父组件调用）
			updateSelectedIndex(index) {
				this.currentIndex = index;
				uni.$emit('updateTabBarIndex', index);
			},

			// 获取当前Tab数量
			getTabCount() {
				return this.visibleTabs.length;
			},

			// 🔒 检查访客二维码使用状态
			async checkVisitorQrCodeUsage() {
				try {
					// 检查本地存储中是否有已使用的二维码记录
					const userInfo = uni.getStorageSync('userInfo');
					const currentUserPhone = userInfo?.phone || userInfo?.userInfo?.phone;

					if (!currentUserPhone) {
						console.warn('🔒 [TabBar] 无法获取用户手机号');
						return false;
					}

					// 🔧 修复：只检查本地存储中的二维码使用状态
					// 二维码的使用状态应该只在预约提交成功后才被标记
					try {
						// 方法1：检查是否有scannedQrId记录且已被标记为使用
						const scannedQrId = uni.getStorageSync('scannedQrId');
						if (scannedQrId) {
							const isUsed = uni.getStorageSync(`qr_used_${scannedQrId}`);
							if (isUsed) {
								console.log('🔒 [TabBar] 发现已使用的二维码:', scannedQrId);
								return true;
							} else {
								console.log('🔍 [TabBar] 二维码存在但未被标记为已使用:', scannedQrId);
								return false;
							}
						}

						// 🔧 移除错误的逻辑：不再通过查询预约记录来判断二维码是否已使用
						// 原因：用户可能有其他预约记录，但当前二维码可能还没有被使用
						// 二维码的使用状态应该只在form.vue中的submit方法成功提交后才被标记

						console.log('🔍 [TabBar] 未找到已使用的二维码记录');
						return false;

					} catch (error) {
						console.warn('🔒 [TabBar] 检查二维码使用状态时出错:', error);
						// 出错时返回false，允许用户继续使用
						return false;
					}
				} catch (error) {
					console.error('🔒 [TabBar] 检查访客二维码使用状态失败:', error);
					return false;
				}
			},

			// 🔍 检查访客是否已完成预约
			async checkVisitorCompletedAppointment() {
				try {
					// 获取用户信息
					const userInfo = uni.getStorageSync('userInfo');
					const currentUserPhone = userInfo?.phone || userInfo?.userInfo?.phone;

					if (!currentUserPhone) {
						console.warn('🔍 [TabBar] 无法获取用户手机号');
						return false;
					}

					// 检查本地存储中是否有二维码使用记录
					const scannedQrId = uni.getStorageSync('scannedQrId');
					if (scannedQrId) {
						const isUsed = uni.getStorageSync(`qr_used_${scannedQrId}`);
						if (isUsed) {
							console.log('✅ [TabBar] 发现已使用的二维码，说明已完成预约:', scannedQrId);
							return true;
						}
					}

					// 如果本地没有使用记录，检查是否有最近的预约数据
					const lastAppointmentData = uni.getStorageSync('lastAppointmentData');
					if (lastAppointmentData && lastAppointmentData.submitTime) {
						// 检查预约提交时间是否在最近（比如1小时内）
						const submitTime = new Date(lastAppointmentData.submitTime);
						const now = new Date();
						const timeDiff = now.getTime() - submitTime.getTime();
						const oneHour = 60 * 60 * 1000; // 1小时的毫秒数

						if (timeDiff < oneHour) {
							console.log('✅ [TabBar] 发现最近的预约记录，允许查询');
							return true;
						}
					}

					console.log('❌ [TabBar] 访客尚未完成预约');
					return false;

				} catch (error) {
					console.error('🔍 [TabBar] 检查访客预约完成状态失败:', error);
					return false;
				}
			},

			// 导航到查询页面
			navigateToQueryPage() {
			console.log(' [TabBar] 导航到查询页面');

			// 根据角色跳转到不同页面
			// 管家 -> 访客邀请页面
			// 其他角色 -> 预约查询页面
			const targetUrl = this.currentUserRole === 'manager' 
				? '/pagesB/butler/qrcode-generator'
				: '/pagesA/reservation/searchResult/searchResult';

			console.log(` [TabBar] 当前角色: ${this.currentUserRole}, 跳转到: ${targetUrl}`);

			uni.reLaunch({
				url: targetUrl,
				success: () => {
					console.log(` [TabBar] 成功跳转到${this.currentUserRole === 'manager' ? '访客邀请' : '预约查询'}页面`);
					// 更新TabBar状态到查询页面
					const queryTabIndex = this.visibleTabs.findIndex(tab =>
						tab.pagePath === 'pages/reservation/searchResult/searchResult' ||
						tab.pagePath === 'pagesB/butler/qrcode-generator'
					);
					if (queryTabIndex !== -1) {
						this.currentIndex = queryTabIndex;
						uni.$emit('updateTabBarIndex', queryTabIndex);
					}
				},
				fail: (err) => {
					console.error(' [TabBar] reLaunch失败:', err);
					// 如果reLaunch失败，尝试使用navigateTo
					uni.navigateTo({
						url: targetUrl,
						success: () => {
							console.log(' [TabBar] 使用navigateTo成功跳转');
						},
						fail: (navErr) => {
							console.error(' [TabBar] navigateTo也失败:', navErr);
							uni.showToast({
								title: '跳转失败，请重试',
								icon: 'none',
								duration: 2000
							});
						}
					});

				}
			});
		},

			// 🆕 点击状态横条切换值班状态
			handleDutyBarClick() {
				// 通知父组件切换值班状态
				uni.$emit('toggleDutyStatus');
			},
			
			// 强制隐藏系统TabBar
			hideSystemTabBar() {
				try {
					// 获取当前页面路径
					const pages = getCurrentPages();
					const currentPage = pages[pages.length - 1];
					const currentRoute = currentPage ? currentPage.route : '';
					
					console.log('🚫 [TabBar] 当前页面路径:', currentRoute);
					
					// 定义TabBar页面列表（根据项目实际配置 - 从tabBarConfigs中提取）
					const tabBarPages = [
						// 业主/管家/访客共用
						'pagesA/reservation/form',
						// 注意：searchResult 是普通页面，不是TabBar页面，不要加入此列表
						// 'pagesA/reservation/searchResult/searchResult',
						// 管家专用
						'pagesB/butler/qrcode-generator',
						'pages/site/facility',
						// 违规管理相关
						'pagesE/violation/violation',
						'pagesE/violation/owner-new-violation',
						'pagesE/violation/add-violation'
					];
					
					// 检查当前页面是否是TabBar页面
					const isTabBarPage = tabBarPages.some(page => currentRoute.includes(page));
					
					if (!isTabBarPage) {
						console.log('ℹ️ [TabBar] 当前页面非TabBar页面，跳过hideTabBar调用');
						// 直接返回，不尝试调用hideTabBar，避免报错
						return;
					}

					console.log('✅ [TabBar] 当前页面是TabBar页面，尝试隐藏系统TabBar');

					// 检查是否在微信小程序环境
					// #ifdef MP-WEIXIN
					// 在微信小程序中，如果没有配置原生TabBar，uni.hideTabBar会失败
					// 这是正常现象，因为我们使用的是自定义TabBar
					if (uni.hideTabBar) {
						uni.hideTabBar({
							animation: false,
							success: () => {
								console.log('✅ [TabBar] 成功隐藏系统TabBar');
							},
							fail: (err) => {
								// 在微信小程序中，如果页面没有配置TabBar，这个错误是预期的
								// 使用warn级别，避免污染控制台
								console.warn('⚠️ [TabBar] 当前页面无系统TabBar配置，使用自定义TabBar');
							}
						});
					}
					// #endif

					// #ifdef H5
					// 在H5环境中，可以使用DOM操作
					if (typeof document !== 'undefined') {
						const style = document.createElement('style');
						style.innerHTML = `
							uni-tabbar, .uni-tabbar, [class*="tabbar"] {
								display: none !important;
								visibility: hidden !important;
								opacity: 0 !important;
								height: 0 !important;
								z-index: -1 !important;
							}
							/* 确保自定义TabBar显示 */
							.custom-tabbar {
								display: flex !important;
								visibility: visible !important;
								opacity: 1 !important;
								z-index: 99999 !important;
							}
						`;
						document.head.appendChild(style);
					}
					// #endif

					// #ifdef APP-PLUS
					// 在App环境中的处理
					if (uni.hideTabBar) {
						uni.hideTabBar({
							animation: false,
							success: () => {
								console.log('✅ [TabBar] 成功隐藏系统TabBar');
							},
							fail: (err) => {
								console.warn('⚠️ [TabBar] 隐藏系统TabBar失败:', err);
							}
						});
					}
					// #endif

				} catch (error) {
					console.error('❌ [TabBar] 隐藏系统TabBar出错:', error);
				}
			}
		}
	};
</script>

<style lang="scss" scoped>
	// 🆕 值班状态横条样式
	.duty-status-bar {
		position: fixed;
		bottom: calc(120rpx + env(safe-area-inset-bottom)); // TabBar高度
		left: 0;
		right: 0;
		height: 64rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 99998;
		transition: all 0.3s ease;
		box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.08);
		
		&.duty-on {
			background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
		}
		
		&.duty-off {
			background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
		}
		
		.status-content {
			display: flex;
			align-items: center;
			gap: 12rpx;
		}
		
		.status-dot {
			font-size: 32rpx;
			line-height: 1;
		}
		
		.status-text {
			font-size: 26rpx;
			color: #ffffff;
			font-weight: 500;
			letter-spacing: 1rpx;
		}
		
		.status-hint {
			font-size: 22rpx;
			color: rgba(255, 255, 255, 0.8);
			margin-left: 12rpx;
			padding: 4rpx 12rpx;
			border-radius: 20rpx;
			background: rgba(255, 255, 255, 0.2);
		}
	}

	.custom-tabbar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: calc(120rpx + env(safe-area-inset-bottom));
		background-color: #ffffff;
		border-top: 1rpx solid #e5e5e5;
		display: flex;
		z-index: 99999;
		/* 提高层级，确保覆盖系统TabBar */
		box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.1);
		/* 强制显示，覆盖可能的系统TabBar */
		visibility: visible !important;
		opacity: 1 !important;

		.tabbar-item {
			flex: 1;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			padding: 6rpx 4rpx calc(8rpx + env(safe-area-inset-bottom)) 4rpx;
			transition: all 0.2s ease;

			&.active {
				transform: scale(1.02);
			}

			.tabbar-icon {
				width: 64rpx;
				height: 64rpx;
				margin-bottom: 4rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				position: relative; // 🆕 为徽标定位

				.icon-image {
					width: 100%;
					height: 100%;
					object-fit: contain;
				}
				
				// 🆕 值班状态徽标
				.duty-badge {
					position: absolute;
					top: -8rpx;
					right: -12rpx;
					width: 24rpx;
					height: 24rpx;
					border-radius: 50%;
					display: flex;
					align-items: center;
					justify-content: center;
					border: 2rpx solid #ffffff;
					animation: pulse 2s infinite;
					
					&.badge-on {
						background: #67c23a;
						box-shadow: 0 0 12rpx rgba(103, 194, 58, 0.6);
					}
					
					&.badge-off {
						background: #f56c6c;
						box-shadow: 0 0 12rpx rgba(245, 108, 108, 0.6);
					}
					
					.badge-dot {
						font-size: 16rpx;
						color: #ffffff;
					}
				}
			}

			.tabbar-text {
				font-size: 22rpx;
				line-height: 1.2;
				text-align: center;
				transition: color 0.2s ease;
				font-weight: 500;
			}
		}
	}
	
	// 🆕 徽标脉动动画
	@keyframes pulse {
		0%, 100% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(1.2);
			opacity: 0.8;
		}
	}

	// 统一蓝色主题
	.custom-tabbar {
		.tabbar-item.active {
			.tabbar-text {
				color: #007AFF;
				font-weight: 600;
			}
		}
	}

	// 兼容不同屏幕尺寸
	@media screen and (max-width: 750rpx) {
		.custom-tabbar {
			.tabbar-item {
				.tabbar-icon {
					width: 60rpx;
					height: 60rpx;
				}

				.tabbar-text {
					font-size: 20rpx;
				}
			}
		}
	}

	@media screen and (min-width: 751rpx) {
		.custom-tabbar {
			.tabbar-item {
				.tabbar-icon {
					width: 68rpx;
					height: 68rpx;
				}

				.tabbar-text {
					font-size: 24rpx;
				}
			}
		}
	}
</style>