<template>
	<view class="webview-container">
		<web-view :src="authUrl" @message="handleMessage"></web-view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			authUrl: '',
			scannedParams: {},
			returnUrl: ''
		}
	},

	onLoad(options) {
		try {
			console.log('🚀 [web-view授权] 页面原始参数:', options)
			
			// 解析传递的参数
			this.scannedParams = options.scannedParams ? JSON.parse(decodeURIComponent(options.scannedParams)) : {}
			this.returnUrl = options.returnUrl || '/pages/auth/phone-auth'
			
			console.log('🔗 [web-view授权] 页面加载参数:', {
				scannedParams: this.scannedParams,
				returnUrl: this.returnUrl,
				timestamp: options.timestamp
			})
			
			// 构造公众号授权URL
			this.buildAuthUrl()
			
		} catch (error) {
			console.error('❌ [web-view授权] 页面加载失败:', error)
			this.handleError(error)
		}
	},

	methods: {
		/**
		 * 构造公众号授权URL
		 */
		        buildAuthUrl() {
            // 🚨 请替换为您的实际配置
            const appid = 'wx7fcbbc5d885b630b' // 替换为您的公众号appid
            const redirectUri = encodeURIComponent('https://www.xuerparking.cn:8543/wechat-callback.html') // 🆕 使用新的回调页面
            const state = encodeURIComponent(JSON.stringify({
                scannedParams: this.scannedParams,
                returnUrl: this.returnUrl,
                timestamp: Date.now()
            }))
            
            this.authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appid}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_userinfo&state=${state}#wechat_redirect`
            
            console.log('🔗 [web-view授权] 构造的授权URL:', this.authUrl)
        },

		/**
		 * 处理来自H5页面的消息
		 */
		handleMessage(event) {
			try {
				const data = event.detail.data[0]
				console.log('📨 [web-view授权] 收到消息:', data)
				
				if (data.type === 'auth_success') {
					// 授权成功，返回上一页并传递用户信息
					this.handleAuthSuccess(data.userInfo)
				} else if (data.type === 'auth_error') {
					// 授权失败
					this.handleAuthError(data.error)
				}
				
			} catch (error) {
				console.error('❌ [web-view授权] 消息处理失败:', error)
				this.handleError(error)
			}
		},

		/**
		 * 处理授权成功
		 */
		handleAuthSuccess(userInfo) {
			console.log('✅ [web-view授权] 授权成功，用户信息:', userInfo)
			
			// 将用户信息保存到全局状态
			const app = getApp()
			if (app.globalData) {
				app.globalData.wechatAuthResult = {
					success: true,
					userInfo: userInfo,
					timestamp: Date.now()
				}
			}
			
			// 返回授权页面
			uni.navigateBack({
				success: () => {
					console.log('✅ [web-view授权] 成功返回授权页面')
				}
			})
		},

		/**
		 * 处理授权失败
		 */
		handleAuthError(error) {
			console.error('❌ [web-view授权] 授权失败:', error)
			
			// 将错误信息保存到全局状态
			const app = getApp()
			if (app.globalData) {
				app.globalData.wechatAuthResult = {
					success: false,
					error: error,
					timestamp: Date.now()
				}
			}
			
			// 返回授权页面
			uni.navigateBack()
		},

		/**
		 * 处理一般错误
		 */
		handleError(error) {
			uni.showModal({
				title: '授权失败',
				content: `授权过程中遇到问题：${error.message}`,
				showCancel: false,
				confirmText: '返回',
				success: () => {
					uni.navigateBack()
				}
			})
		}
	}
}
</script>

<style>
.webview-container {
	width: 100%;
	height: 100vh;
}
</style> 