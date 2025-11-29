<template>
	<view class="test-container">
		<view class="header">
			<text class="title">TabBar角色修复测试</text>
		</view>
		
		<view class="info-section">
			<view class="info-item">
				<text class="label">当前用户角色:</text>
				<text class="value" :class="roleClass">{{ roleText }}</text>
			</view>
			
			<view class="info-item">
				<text class="label">用户手机号:</text>
				<text class="value">{{ phone }}</text>
			</view>
			
			<view class="info-item">
				<text class="label">登录状态:</text>
				<text class="value" :class="{ 'status-success': isLoggedIn, 'status-error': !isLoggedIn }">
					{{ isLoggedIn ? '已登录' : '未登录' }}
				</text>
			</view>
			
			<view class="info-item">
				<text class="label">TabBar角色:</text>
				<text class="value">{{ tabBarRole }}</text>
			</view>
		</view>
		
		<view class="test-section">
			<text class="section-title">角色切换测试</text>
			
			<view class="button-group">
				<u-button type="primary" @click="switchToOwner" text="切换为业主" 
					customStyle="margin: 10rpx; border-radius: 20rpx;"></u-button>
				<u-button type="success" @click="switchToManager" text="切换为管家" 
					customStyle="margin: 10rpx; border-radius: 20rpx;"></u-button>
				<u-button type="warning" @click="switchToVisitor" text="切换为访客" 
					customStyle="margin: 10rpx; border-radius: 20rpx;"></u-button>
			</view>
		</view>
		
		<view class="debug-section">
			<text class="section-title">调试信息</text>
			
			<view class="debug-info">
				<text class="debug-text">{{ debugInfo }}</text>
			</view>
			
			<view class="button-group">
				<u-button type="info" @click="refreshUserInfo" text="刷新用户信息" 
					customStyle="margin: 10rpx; border-radius: 20rpx;"></u-button>
				<u-button type="error" @click="clearUserInfo" text="清除用户信息" 
					customStyle="margin: 10rpx; border-radius: 20rpx;"></u-button>
			</view>
		</view>
		
		<!-- 自定义TabBar - 不传递userRole，让组件自动获取 -->
		<custom-tabbar @tabChange="onTabChange"></custom-tabbar>
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
			userInfo: {},
			debugInfo: ''
		}
	},
	
	computed: {
		currentRole() {
			return this.userInfo.role || 'unknown'
		},
		
		roleText() {
			const roleMap = {
				'owner': '业主',
				'manager': '管家',
				'visitor': '访客'
			}
			return roleMap[this.currentRole] || '未知'
		},
		
		roleClass() {
			return {
				'role-owner': this.currentRole === 'owner',
				'role-manager': this.currentRole === 'manager',
				'role-visitor': this.currentRole === 'visitor'
			}
		},
		
		phone() {
			return this.userInfo.phone || '未知'
		},
		
		isLoggedIn() {
			return this.userInfo.isAuthorized || false
		},
		
		tabBarRole() {
			return uni.getStorageSync('currentTabBarRole') || '未设置'
		}
	},
	
	onLoad() {
		this.loadUserInfo()
	},
	
	onShow() {
		this.loadUserInfo()
	},
	
	methods: {
		// 加载用户信息
		loadUserInfo() {
			try {
				const userInfo = uni.getStorageSync('userInfo')
				this.userInfo = userInfo || {}
				this.updateDebugInfo()
				console.log('📱 [测试页面] 用户信息:', this.userInfo)
			} catch (error) {
				console.error('📱 [测试页面] 加载用户信息失败:', error)
				this.debugInfo = '加载用户信息失败: ' + error.message
			}
		},
		
		// 更新调试信息
		updateDebugInfo() {
			this.debugInfo = JSON.stringify(this.userInfo, null, 2)
		},
		
		// 切换为业主
		async switchToOwner() {
			await this.switchRole('owner')
		},
		
		// 切换为管家
		async switchToManager() {
			await this.switchRole('manager')
		},
		
		// 切换为访客
		async switchToVisitor() {
			await this.switchRole('visitor')
		},
		
		// 切换角色
		async switchRole(newRole) {
			try {
				console.log('🔄 [测试页面] 切换角色:', newRole)
				
				const updatedUser = {
					...this.userInfo,
					role: newRole,
					roleText: this.getRoleDisplayName(newRole),
					isAuthorized: true,
					userInfo: {
						...this.userInfo.userInfo,
						permissions: this.getRolePermissions(newRole)
					}
				}
				
				uni.setStorageSync('userInfo', updatedUser)
				this.userInfo = updatedUser
				this.updateDebugInfo()
				
				// 触发角色变化事件
				uni.$emit('roleChanged', {
					oldRole: this.currentRole,
					newRole: newRole
				})
				
				uni.showToast({
					title: `已切换为${this.getRoleDisplayName(newRole)}`,
					icon: 'success',
					duration: 2000
				})
				
			} catch (error) {
				console.error('🔄 [测试页面] 角色切换失败:', error)
				uni.showToast({
					title: '角色切换失败',
					icon: 'error'
				})
			}
		},
		
		// 获取角色显示名称
		getRoleDisplayName(role) {
			const roleNames = {
				'owner': '业主',
				'manager': '管家',
				'visitor': '访客'
			}
			return roleNames[role] || '未知角色'
		},
		
		// 获取角色权限
		getRolePermissions(role) {
			const permissions = {
				'owner': ['reservation', 'query'],
				'manager': ['reservation', 'query', 'audit', 'invite'],
				'visitor': ['reservation', 'query']
			}
			return permissions[role] || []
		},
		
		// 刷新用户信息
		refreshUserInfo() {
			this.loadUserInfo()
			uni.showToast({
				title: '用户信息已刷新',
				icon: 'success'
			})
		},
		
		// 清除用户信息
		clearUserInfo() {
			uni.showModal({
				title: '确认清除',
				content: '确定要清除用户信息吗？',
				success: (res) => {
					if (res.confirm) {
						uni.removeStorageSync('userInfo')
						this.userInfo = {}
						this.updateDebugInfo()
						
						uni.showToast({
							title: '用户信息已清除',
							icon: 'success'
						})
					}
				}
			})
		},
		
		// TabBar切换事件
		onTabChange(tabInfo) {
			console.log('📱 [测试页面] TabBar切换:', tabInfo)
		}
	}
}
</script>

<style lang="scss" scoped>
.test-container {
	padding: 40rpx;
	padding-bottom: 200rpx;
}

.header {
	text-align: center;
	margin-bottom: 40rpx;
}

.title {
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
}

.info-section, .test-section, .debug-section {
	background: #fff;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 30rpx;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.section-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 20rpx;
	display: block;
}

.info-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #f0f0f0;
}

.info-item:last-child {
	border-bottom: none;
}

.label {
	font-size: 28rpx;
	color: #666;
}

.value {
	font-size: 28rpx;
	color: #333;
	font-weight: bold;
}

.role-owner {
	color: #007AFF;
}

.role-manager {
	color: #34C759;
}

.role-visitor {
	color: #FF9500;
}

.status-success {
	color: #34C759;
}

.status-error {
	color: #FF3B30;
}

.button-group {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
}

.debug-info {
	background: #f8f9fa;
	border-radius: 10rpx;
	padding: 20rpx;
	margin-bottom: 20rpx;
}

.debug-text {
	font-size: 24rpx;
	color: #666;
	font-family: monospace;
	white-space: pre-wrap;
}
</style>
