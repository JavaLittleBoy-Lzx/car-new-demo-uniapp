<template>
	<view class="container">
		<view class="header">
			<text class="title">关注公众号</text>
			<text class="subtitle">{{ subtitleText }}</text>
		</view>
		
		<view class="qrcode-section">
			<view class="qrcode-container">
				<!-- 这里放置实际的公众号二维码图片 -->
				<image 
					class="qrcode-image" 
					src="/static/qrcode/wechat-qrcode.jpg" 
					mode="aspectFit"
					@error="onImageError"
					show-menu-by-longpress
				></image>
				<text class="qrcode-tip">长按识别二维码关注</text>
			</view>
		</view>
		
		<view class="benefits-section">
			<text class="benefits-title">关注后您将享受：</text>
			<view class="benefit-item">
				<text class="benefit-icon">🚗</text>
				<text class="benefit-text">停车超时提醒，避免违章罚单</text>
			</view>
			<view class="benefit-item">
				<text class="benefit-icon">📱</text>
				<text class="benefit-text">预约状态实时通知</text>
			</view>
			<view class="benefit-item">
				<text class="benefit-icon">⏰</text>
				<text class="benefit-text">智能时间管理提醒</text>
			</view>
			<view class="benefit-item">
				<text class="benefit-icon">🎯</text>
				<text class="benefit-text">专属客服支持</text>
			</view>
		</view>
		
		<view class="action-section">
			<button class="btn primary" @click="goBack">返回小程序</button>
			<button class="btn" @click="checkAgain">我已关注，重新检测</button>
		</view>
		
		<view class="test-section" v-if="isTestMode">
			<text class="test-title">🧪 测试模式说明</text>
			<text class="test-desc">这是测试页面，实际使用时请替换为真实的公众号二维码</text>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			isTestMode: false,
			currentUserRole: 'visitor', // 默认访客角色
			roleSpecificTips: {
				visitor: '扫码关注公众号，及时接收访客通行提醒',
				owner: '扫码关注公众号，及时接收车位预约状态',
				manager: '扫码关注公众号，及时接收管理通知'
			}
		}
	},
	onLoad(options) {
		// 检查是否是测试模式
		this.isTestMode = options.test === '1';
		
		// 获取用户角色
		this.getUserRole();
		
		// 记录页面访问
		console.log('公众号二维码页面加载，测试模式:', this.isTestMode);
	},
	computed: {
		// 根据角色返回不同的提示文本
		subtitleText() {
			return this.roleSpecificTips[this.currentUserRole] || this.roleSpecificTips.visitor;
		}
	},
	methods: {
		// 获取用户角色
		getUserRole() {
			try {
				const userInfo = uni.getStorageSync('userInfo');
				
				// 获取角色
				if (userInfo && userInfo.role) {
					this.currentUserRole = userInfo.role;
				} else if (userInfo && userInfo.userInfo && userInfo.userInfo.userkind) {
					this.currentUserRole = userInfo.userInfo.userkind;
				} else {
					this.currentUserRole = 'visitor';
				}
				
				console.log('当前用户角色:', this.currentUserRole);
				
			} catch (error) {
				console.error('获取用户信息失败:', error);
				this.currentUserRole = 'visitor';
			}
		},
		/**
		 * 图片加载错误处理
		 */
		onImageError() {
			console.log('二维码图片加载失败，显示占位符');
			// 可以显示默认的占位图片或文字提示
		},
		
		/**
		 * 返回小程序
		 */
		goBack() {
			uni.navigateBack({
				delta: 1
			});
		},
		
		/**
		 * 重新检测关注状态
		 */
		async checkAgain() {
			try {
				// 这里可以调用检查关注状态的接口
				uni.showLoading({
					title: '检测中...'
				});
				
				// 模拟检测过程
				setTimeout(() => {
					uni.hideLoading();
					
					if (this.isTestMode) {
						// 测试模式下提示
						// uni.showModal({
						// 	title: '🧪 测试模式',
						// 	content: '模拟检测完成！在实际项目中，这里会调用真实的关注检测接口。',
						// 	showCancel: false,
						// 	success: () => {
						// 		this.goBack();
						// 	}
						// });
					} else {
						// 实际项目中的检测逻辑
						uni.showToast({
							title: '检测完成，感谢关注！',
							icon: 'success'
						});
						setTimeout(() => {
							this.goBack();
						}, 1500);
					}
				}, 2000);
				
			} catch (error) {
				uni.hideLoading();
				uni.showToast({
					title: '检测失败，请稍后重试',
					icon: 'none'
				});
			}
		}
	}
}
</script>

<style scoped>
.container {
	padding: 40rpx 30rpx;
	background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
	min-height: 100vh;
	display: flex;
	flex-direction: column;
}

.header {
	text-align: center;
	margin-bottom: 60rpx;
}

.title {
	font-size: 48rpx;
	font-weight: bold;
	color: #333;
	display: block;
	margin-bottom: 20rpx;
}

.subtitle {
	font-size: 28rpx;
	color: #666;
	line-height: 1.5;
}

.qrcode-section {
	flex: 1;
	display: flex;
	justify-content: center;
	align-items: center;
	margin: 40rpx 0;
}

.qrcode-container {
	background: white;
	border-radius: 20rpx;
	padding: 60rpx;
	box-shadow: 0 10rpx 40rpx rgba(0,0,0,0.1);
	text-align: center;
}

.qrcode-image {
	width: 400rpx;
	height: 400rpx;
	border-radius: 10rpx;
	margin-bottom: 30rpx;
	background: #f0f0f0;
	border: 2rpx dashed #ddd;
}

.qrcode-tip {
	font-size: 26rpx;
	color: #888;
}

.benefits-section {
	background: white;
	border-radius: 20rpx;
	padding: 40rpx;
	margin: 40rpx 0;
	box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.08);
}

.benefits-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 30rpx;
	display: block;
}

.benefit-item {
	display: flex;
	align-items: center;
	margin-bottom: 25rpx;
}

.benefit-icon {
	font-size: 32rpx;
	margin-right: 20rpx;
	width: 60rpx;
}

.benefit-text {
	font-size: 28rpx;
	color: #555;
	flex: 1;
}

.action-section {
	margin-top: 40rpx;
}

.btn {
	width: 100%;
	padding: 30rpx;
	border-radius: 15rpx;
	font-size: 32rpx;
	margin-bottom: 20rpx;
	border: none;
}

.btn.primary {
	background: #007AFF;
	color: white;
}

.btn {
	background: white;
	color: #007AFF;
	border: 2rpx solid #007AFF;
}

.test-section {
	background: #fff3cd;
	border: 2rpx solid #ffd700;
	border-radius: 15rpx;
	padding: 30rpx;
	margin-top: 40rpx;
	text-align: center;
}

.test-title {
	font-size: 28rpx;
	color: #856404;
	font-weight: bold;
	display: block;
	margin-bottom: 15rpx;
}

.test-desc {
	font-size: 24rpx;
	color: #856404;
	line-height: 1.4;
}
</style> 