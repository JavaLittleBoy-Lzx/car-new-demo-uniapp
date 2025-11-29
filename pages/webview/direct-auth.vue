<template>
	<view class="container">
		<!-- 🆕 直接加载微信授权页面 -->
		<web-view 
			:src="authUrl" 
			@message="handleMessage"
			@error="handleError"
			@load="handleLoad"
		></web-view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				authUrl: '', // 微信授权URL
				scannedParams: null, // 扫码参数
				returnUrl: '', // 返回页面
				currentStateKey: '', // 🆕 当前使用的state key，用于清理
			}
		},
		onLoad(options) {
			console.log('🔗 [直接授权] 页面加载')
			try {
				// 🆕 每次进入页面先清空authUrl，确保重新生成
				this.authUrl = ''		
				// 设置默认值，不从参数获取
				this.scannedParams = null
				this.returnUrl = '/pages/auth/phone-auth'
				console.log('📝 [直接授权] 使用默认参数:', {
					scannedParams: this.scannedParams,
					returnUrl: this.returnUrl
				})
				// 🆕 构造微信授权URL 创建URL
				this.buildWechatAuthUrl()
				
			} catch (error) {
				console.error('❌ [直接授权] 初始化失败:', error)
				this.handleError('页面初始化失败')
			}
		},

		onShow() {
			console.log('👁️ [直接授权] 页面显示')
			
			// 🆕 每次页面显示时都重新生成授权URL，确保使用最新的timestamp和state
			console.log('🔄 [直接授权] 页面显示时重新生成授权URL')
			this.authUrl = '' // 先清空
			this.buildWechatAuthUrl()
		},

		onHide() {
			console.log('👁️ [直接授权] 页面隐藏')
		},

		onUnload() {
			console.log('🗑️ [直接授权] 页面卸载，清理资源')
			// 🆕 页面卸载时清理URL，确保下次重新生成
			this.authUrl = ''
			
			// 🆕 清理存储的状态数据，避免内存泄漏
			if (this.currentStateKey) {
				try {
					uni.removeStorageSync(this.currentStateKey)
					console.log('🧹 [直接授权] 已清理状态数据:', this.currentStateKey)
				} catch (error) {
					console.warn('⚠️ [直接授权] 清理状态数据失败:', error)
				}
				this.currentStateKey = ''
			}
		},

		methods: {
			/**
			 * 🆕 构造微信授权URL
			 */
			buildWechatAuthUrl() {
				try {
					console.log('🔨 [直接授权] 开始构造新的微信授权URL')
					
					// 🚨 微信公众号配置（请替换为您的实际配置）
					const appid = 'wx7fcbbc5d885b630b' // 替换为您的公众号appid
					const redirectUri = encodeURIComponent('https://www.xuerparking.cn/wechat-callback.html') // 授权回调页面
					
					// 🆕 构造简洁的state参数（限制128字节）
					// 使用时间戳+随机数确保唯一性，符合a-zA-Z0-9要求
					const timestamp = Date.now().toString(36) // 转为36进制，更短
					const random = Math.random().toString(36).substr(2, 6) // 6位随机字符
					const state = `${timestamp}${random}` // 简洁的state，约20字符
					
					// 将完整的状态数据存储到本地，用state作为key
					const stateData = {
						scannedParams: this.scannedParams,
						returnUrl: this.returnUrl,
						timestamp: Date.now(),
						random: random
					}
					const stateKey = `auth_state_${state}`
					uni.setStorageSync(stateKey, stateData)
					this.currentStateKey = stateKey // 🆕 记录当前state key
					
					// 🆕 构造完整的微信授权URL，添加forcePopup=true强制弹出授权页面
					this.authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appid}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_userinfo&state=${state}&forcePopup=true#wechat_redirect`
					
					console.log('🔗 [直接授权] 构造的微信授权URL:', this.authUrl)
					console.log('🔑 [直接授权] State参数:', state, '(长度:', state.length, '字节)')
					console.log('📊 [直接授权] 完整状态数据已存储到本地:', stateData)
					
				} catch (error) {
					console.error('❌ [直接授权] 构造授权URL失败:', error)
					this.handleError('无法构造授权URL')
				}
			},

			/**
			 * 处理来自H5页面的消息
			 */
			handleMessage(event) {
				try {
					const data = event.detail.data[0]
					console.log('📨 [直接授权] 收到消息:', data)
					
					if (data.type === 'auth_success') {
						// 授权成功，返回上一页并传递用户信息
						this.handleAuthSuccess(data.userInfo)
					} else if (data.type === 'auth_error') {
						// 授权失败
						this.handleAuthError(data.error)
					}
					
				} catch (error) {
					console.error('❌ [直接授权] 消息处理失败:', error)
					this.handleError(error)
				}
			},

			/**
			 * 处理授权成功
			 */
			handleAuthSuccess(userInfo) {
				console.log('✅ [直接授权] 授权成功，用户信息:', userInfo)
				
				try {
					// 将用户信息存储到全局状态或缓存中
					const authResult = {
						success: true,
						userInfo: userInfo,
						timestamp: Date.now()
					}
					
					// 存储到本地缓存
					uni.setStorageSync('wechat_auth_result', authResult)
					
					// 显示成功提示
					uni.showToast({
						title: '授权成功',
						icon: 'success',
						duration: 1500
					})
					
					// 延迟返回，确保用户能看到成功提示
					setTimeout(() => {
						// 返回到授权页面
						uni.navigateBack({
							delta: 1,
							success: () => {
								console.log('✅ [直接授权] 成功返回到授权页面')
							}
						})
					}, 1500)
					
				} catch (error) {
					console.error('❌ [直接授权] 处理授权成功失败:', error)
					this.handleError(error)
				}
			},

			/**
			 * 处理授权失败
			 */
			handleAuthError(errorMessage) {
				console.error('❌ [直接授权] 授权失败:', errorMessage)
				
				// 存储失败结果
				const authResult = {
					success: false,
					error: errorMessage,
					timestamp: Date.now()
				}
				uni.setStorageSync('wechat_auth_result', authResult)
				
				// 显示错误提示
				uni.showModal({
					title: '授权失败',
					content: errorMessage || '微信授权失败，请重试',
					showCancel: false,
					confirmText: '确定',
					success: () => {
						// 返回上一页
						uni.navigateBack({
							delta: 1
						})
					}
				})
			},

			/**
			 * 处理通用错误
			 */
			handleError(error) {
				console.error('❌ [直接授权] 页面错误:', error)
				
				const errorMessage = typeof error === 'string' ? error : error.message || '未知错误'
				
				uni.showModal({
					title: '页面错误',
					content: errorMessage,
					showCancel: false,
					confirmText: '确定',
					success: () => {
						// 返回上一页
						uni.navigateBack({
							delta: 1
						})
					}
				})
			},

			/**
			 * web-view加载完成
			 */
			handleLoad(event) {
				console.log('✅ [直接授权] web-view加载完成:', event)
			}
		}
	}
</script>

<style scoped>
	.container {
		width: 100%;
		height: 100vh;
	}
</style> 