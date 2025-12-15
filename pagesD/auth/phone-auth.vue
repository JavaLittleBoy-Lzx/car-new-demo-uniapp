<template>
	<view class="auth-container">
		<!-- 背景渐变 -->
		<view class="bg-gradient"></view>

		<!-- 顶部装饰波浪 -->
		<view class="wave-decoration">
			<view class="wave wave-1"></view>
			<view class="wave wave-2"></view>
		</view>
		<!-- 主内容 -->
		<view class="main-content">
			<!-- 顶部区域 -->
			<view class="header-section">
				<view class="logo-container">
					<view class="logo-bg">
						<text class="logo-icon">⛄</text>
					</view>
					<text class="app-title">雪人停车</text>
					<text class="app-subtitle">Snowman Parking</text>
				</view>
			</view>
			<!-- 中间内容区域 -->
			<view class="content-section">
				<view class="welcome-text">
					<text class="welcome-title">欢迎使用</text>
					<text class="welcome-desc">请授权手机号以获得更好的服务体验</text>
					<view class="process-tips">
						<text class="tips-title">🔍 身份验证流程：</text>
						<text class="tips-item">1. 获取微信授权信息</text>
						<text class="tips-item">2. 验证用户身份</text>
						<text class="tips-item">3. 匹配用户角色权限</text>
						<text class="tips-note">⏰ 整个过程预计需要5-10秒</text>
					</view>
				</view>

				<!-- 功能亮点 -->
				<view class="highlights-section">
					<view class="highlight-item">
						<view class="icon-container">
							<view class="icon-bg icon-blue">
								<text class="icon">🅿️</text>
							</view>
							<view class="icon-ring"></view>
						</view>
						<view class="content">
							<text class="title">智能预约</text>
							<text class="desc">便捷预约，智能管理车位</text>
						</view>
					</view>
					<view class="highlight-item">
						<view class="icon-container">
							<view class="icon-bg icon-green">
								<text class="icon">🔐</text>
							</view>
							<view class="icon-ring"></view>
						</view>
						<view class="content">
							<text class="title">安全可靠</text>
							<text class="desc">微信官方授权保障安全</text>
						</view>
					</view>
					<view class="highlight-item">
						<view class="icon-container">
							<view class="icon-bg icon-orange">
								<text class="icon">⚡</text>
							</view>
							<view class="icon-ring"></view>
						</view>
						<view class="content">
							<text class="title">一键登录</text>
							<text class="desc">无需注册，即点即用</text>
						</view>
					</view>
				</view>
			</view>
			<!-- 底部授权区域 -->
			<view class="auth-section">
				<button class="auth-button" :class="{ loading: loading }"
					:open-type="agreeTerms ? 'getPhoneNumber' : ''" @getphonenumber="onGetPhoneNumber"
					@click="onAuthButtonClick" :disabled="loading">
					<view class="button-content">
						<text class="wechat-icon">💬</text>
						<text class="button-text">{{ loading ? '授权中...' : '微信一键登录' }}</text>
					</view>
					<view v-if="loading" class="loading-wave"></view>
				</button>
				<view class="privacy-notice">
					<!-- 协议同意区域 -->
					<view class="agreement-section" :class="{ shaking: agreementShaking }">
						<!-- 提示框 -->
						<view v-if="showAgreementTip" class="agreement-tip">
							<text class="tip-text">请先勾选同意后再进行登录</text>
						</view>

						<label class="agreement-item">
							<checkbox-group @change="onAgreeChange">
								<checkbox :value="'agree'" :checked="agreeTerms" color="#1677ff" />
							</checkbox-group>
							<text class="agreement-text">
								我已阅读并同意
								<text class="notice-link" @tap="showServiceAgreement">《用户协议》</text>
								<text class="notice-text">和</text>
								<text class="notice-link" @tap="showPrivacyPolicy">《隐私政策》</text>
							</text>
						</label>
					</view>

					<!-- 隐私提示 -->
					<!-- <view class="privacy-tips">
						<text class="privacy-tip">🔒 我们承诺保护您的隐私安全</text>
						<text class="privacy-tip">📱 仅用于身份验证，不会泄露个人信息</text>
					</view> -->
				</view>
			</view>
		</view>

		<!-- 全屏加载 -->
		<view v-if="showLoading" class="fullscreen-loading">
			<view class="loading-card">
				<!-- 进度条 -->
				<view class="progress-container">
					<view class="progress-bar">
						<view class="progress-fill" :style="{ width: progressPercentage + '%' }"></view>
					</view>
					<text class="progress-text">{{ progressPercentage }}%</text>
				</view>

				<!-- 阶段指示器 -->
				<view class="stage-indicators">
					<view class="stage-item" :class="{ active: currentStage >= 1, completed: currentStage > 1 }">
						<view class="stage-icon">1</view>
						<text class="stage-label">微信授权</text>
					</view>
					<view class="stage-connector" :class="{ active: currentStage >= 2 }"></view>
					<view class="stage-item" :class="{ active: currentStage >= 2, completed: currentStage > 2 }">
						<view class="stage-icon">2</view>
						<text class="stage-label">身份验证</text>
					</view>
					<view class="stage-connector" :class="{ active: currentStage >= 3 }"></view>
					<view class="stage-item" :class="{ active: currentStage >= 3, completed: currentStage > 3 }">
						<view class="stage-icon">3</view>
						<text class="stage-label">设置用户</text>
					</view>
				</view>

				<!-- 动态loading图标 -->
				<view class="loading-animation">
					<view class="searching-icon" v-if="currentStage === 2">
						<view class="radar-circle"></view>
						<view class="radar-circle"></view>
						<view class="radar-circle"></view>
						<text class="search-text">🔍</text>
					</view>
					<view class="loading-dots" v-else>
						<view class="dot dot-1"></view>
						<view class="dot dot-2"></view>
						<view class="dot dot-3"></view>
					</view>
				</view>

				<!-- 主要提示文本 -->
				<text class="loading-text">{{ loadingText }}</text>

				<!-- 耐心等待提示 -->
				<view class="patience-tips" v-if="currentStage === 2 && showPatienceTip">
					<text class="tip-item">🔍 正在查询您的信息</text>
					<text class="tip-item">⏰ 外部服务查询需要一点时间，请耐心等待</text>
					<text class="tip-item">🎯 我们正在为您匹配最合适的权限</text>
				</view>

				<!-- 倒计时或已用时间 -->
				<view class="time-indicator" v-if="currentStage === 2">
					<text class="time-text">已用时间: {{ formatTime(elapsedTime) }}</text>
					<text class="time-text" v-if="elapsedTime < 10">预计剩余:
						{{ formatTime(Math.max(0, 10 - elapsedTime)) }}</text>
				</view>
			</view>
		</view>

		<!-- 协议查看弹窗 -->
		<view v-if="showAgreementModal" class="agreement-modal">
			<view class="modal-container">
				<view class="modal-header">
					<text class="modal-title">{{ currentAgreementTitle }}</text>
					<text class="close-btn" @tap="closeAgreementModal">✕</text>
				</view>
				<scroll-view class="modal-body" scroll-y>
					<text class="agreement-content">{{ currentAgreementContent }}</text>
				</scroll-view>
				<view class="modal-footer">
					<button class="agreement-confirm-btn" @click="onAgreementConfirm">
						我已阅读
					</button>
				</view>
			</view>
		</view>


	</view>
</template>

<script>
	// 改为静态导入，避免动态import问题
	import AuthUtils from '@/utils/auth.js'
	import DynamicTabBarManager from '@/utils/dynamicTabBar.js'

	export default {
		data() {
			return {
				loading: false,
				showLoading: false,
				loadingText: '正在授权...',
				// 进度管理
				currentStage: 0, // 0=未开始, 1=微信授权, 2=身份验证, 3=设置用户, 4=完成
				progressPercentage: 0,
				showPatienceTip: false,
				// 时间追踪
				startTime: 0,
				elapsedTime: 0,
				timeInterval: null,
				// 耐心提示定时器
				patienceTimer: null,
				// 协议相关
				agreeTerms: false,
				showAgreementModal: false,
				currentAgreementTitle: '',
				currentAgreementContent: '',
				// 协议提示相关
				showAgreementTip: false,
				agreementShaking: false,
				serviceAgreementContent: `用户服务协议

欢迎使用雪人停车服务！

一、服务说明
1. 本协议是您与雪人停车系统之间关于停车服务使用的法律协议。
2. 停车服务包括但不限于车位预约、在线支付、违规查询等功能。
3. 使用本服务需要通过微信授权验证您的身份信息。

二、用户权利与义务
1. 您有权根据您的身份角色使用相应的停车服务功能。
2. 您应当提供真实、准确的个人信息和车辆信息。
3. 您应当遵守停车场相关规定和交通法规。
4. 您不得滥用服务功能，不得从事违法违规活动。

三、服务功能
1. 业主用户：可享受车位预约、违规查询、停车费缴纳等服务。
2. 管家用户：可进行预约管理、业主信息管理、违规记录管理等。
3. 访客用户：可申请临时停车、查看个人停车记录等。

四、数据安全
1. 我们采用业界标准的安全措施保护您的数据安全。
2. 您的个人信息仅用于提供停车服务，不会用于其他商业目的。
3. 我们不会向第三方出售或泄露您的个人信息。

五、服务限制
1. 服务的可用性可能受到网络、设备等因素影响。
2. 我们保留在必要时暂停或终止服务的权利。
3. 对于违规使用服务的用户，我们有权限制或取消其使用权限。

六、免责声明
1. 因不可抗力导致的服务中断，我们不承担责任。
2. 因用户违规行为导致的后果，由用户自行承担。
3. 我们对停车场的实际管理和安全状况不承担责任。

七、协议修改
1. 我们保留修改本协议的权利。
2. 协议修改后，继续使用服务即表示同意修改后的协议。
3. 重要修改会通过适当方式通知用户。

八、争议解决
因本协议产生的争议，双方应友好协商解决；协商不成的，提交相关法院诉讼解决。

本协议自您同意之日起生效。

联系我们：
- 客服电话：400-888-6688
- 邮箱：service@snowmanparking.com`,
				privacyPolicyContent: `隐私政策

雪人停车非常重视您的隐私保护。本隐私政策详细说明了我们如何收集、使用、存储和保护您的个人信息。

一、信息收集
我们收集的信息包括：
1. 基本信息：微信授权获取的姓名、手机号等
2. 车辆信息：车牌号、车型等停车相关信息
3. 使用信息：预约记录、停车记录、支付记录等
4. 设备信息：设备型号、操作系统、唯一设备标识符等
5. 位置信息：为提供精准停车服务而收集的位置数据

二、信息使用目的
我们使用您的信息用于：
1. 身份验证和账户管理
2. 提供停车预约和管理服务
3. 处理支付和费用结算
4. 客户服务和技术支持
5. 安全监控和风险防范
6. 服务改进和功能优化
7. 法律法规要求的其他用途

三、信息共享原则
我们承诺不会向第三方出售、出租或交易您的个人信息，除非：
1. 获得您的明确授权同意
2. 法律法规明确要求
3. 司法机关或行政机关依法要求
4. 维护我们或其他用户的合法权益
5. 与可信赖的服务提供商分享（仅限于提供服务所需）

四、信息存储与安全
1. 您的信息存储在安全可靠的服务器中
2. 我们采用加密技术保护数据传输安全
3. 定期进行安全评估和漏洞检测
4. 建立完善的数据访问权限管理制度
5. 信息保存期限遵循相关法律法规要求

五、您的权利
您对个人信息享有以下权利：
1. 知情权：了解我们如何处理您的个人信息
2. 访问权：查询我们持有的您的个人信息
3. 更正权：要求更正不准确或不完整的信息
4. 删除权：在特定情况下要求删除您的个人信息
5. 限制处理权：要求我们限制对您信息的处理
6. 数据可携权：要求获得您的个人信息副本

六、第三方服务
本服务可能包含第三方链接或服务：
1. 微信支付等支付服务
2. 地图导航服务
3. 客服系统等
这些第三方服务有其独立的隐私政策，我们建议您仔细阅读。

七、未成年人保护
1. 我们特别重视未成年人的个人信息保护
2. 如果您是18岁以下的未成年人，请在监护人陪同下使用我们的服务
3. 我们不会主动收集未成年人的个人信息

八、跨境数据传输
如果您的信息需要跨境传输，我们会：
1. 确保接收方具备充分的数据保护水平
2. 采取必要的安全保障措施
3. 遵守相关法律法规要求

九、政策更新
1. 我们可能会不定期更新本隐私政策
2. 重大变更会通过适当方式通知您
3. 继续使用服务即表示同意更新后的政策

十、联系我们
如您对本隐私政策有任何疑问或建议，请联系我们：
- 客服热线：400-888-6688
- 邮箱：privacy@snowmanparking.com
- 地址：请通过客服获取详细联系地址

本隐私政策最后更新时间：2024年12月16日`
			}
		},



		onLoad() {
			try {
				// 检查是否已经授权
				this.checkAuthStatus();
			} catch (error) {
				console.error('onLoad错误:', error);
				this.handleInitError(error);
			}
		},

		onShow() {
			try {
				// 页面显示时也检查一次授权状态
				this.checkAuthStatus();
			} catch (error) {
				console.error('onShow错误:', error);
				this.handleInitError(error);
			}
		},

		onUnload() {
			// 页面卸载时清理定时器
			this.resetProgress();
		},

		onHide() {
			// 页面隐藏时暂停定时器（可选）
			if (this.timeInterval) {
				clearInterval(this.timeInterval);
				this.timeInterval = null;
			}
		},

		methods: {
			// 进度管理方法
			startProgressTracking() {
				this.startTime = Date.now();
				this.elapsedTime = 0;
				this.currentStage = 1;
				this.progressPercentage = 10;

				// 开始时间追踪
				this.timeInterval = setInterval(() => {
					this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
				}, 1000);
			},

			updateStage(stage, progress, text) {
				this.currentStage = stage;
				this.progressPercentage = progress;
				this.loadingText = text;

				// 在身份验证阶段显示耐心提示
				if (stage === 2) {
					// 3秒后显示耐心等待提示
					this.patienceTimer = setTimeout(() => {
						this.showPatienceTip = true;
					}, 3000);
				}
			},

			completeProgress() {
				this.currentStage = 4;
				this.progressPercentage = 100;
				this.showPatienceTip = false;

				// 清除定时器
				if (this.timeInterval) {
					clearInterval(this.timeInterval);
					this.timeInterval = null;
				}
				if (this.patienceTimer) {
					clearTimeout(this.patienceTimer);
					this.patienceTimer = null;
				}
			},

			resetProgress() {
				this.currentStage = 0;
				this.progressPercentage = 0;
				this.showPatienceTip = false;
				this.elapsedTime = 0;

				// 清除所有定时器
				if (this.timeInterval) {
					clearInterval(this.timeInterval);
					this.timeInterval = null;
				}
				if (this.patienceTimer) {
					clearTimeout(this.patienceTimer);
					this.patienceTimer = null;
				}
			},

			formatTime(seconds) {
				if (seconds < 60) {
					return `${seconds}秒`;
				} else {
					const minutes = Math.floor(seconds / 60);
					const remainingSeconds = seconds % 60;
					return `${minutes}分${remainingSeconds}秒`;
				}
			},

			// 检查授权状态
			checkAuthStatus() {
				try {
					// 首先检查全局状态
					const app = getApp();
					if (app && app.globalData && app.globalData.isAuthorized) {
						const userInfo = app.globalData.userInfo;
						if (userInfo && userInfo.role) {
							console.log('检测到全局授权状态，自动跳转到:', userInfo.role);
							// 立即跳转，不需要延迟
							this.navigateToHome(userInfo.role);
							return;
						}
					}

									// 如果全局状态不存在，检查本地存储
				const userInfo = uni.getStorageSync('userInfo');
				if (userInfo && userInfo.isAuthorized && userInfo.phone && userInfo.role) {
					// 已授权则直接跳转
					console.log('用户已授权，自动跳转到:', userInfo.role);
					this.navigateToHome(userInfo.role);
				} else {
					console.log('用户未授权，显示授权页面');
				}
				} catch (error) {
					console.error('检查授权状态失败:', error);
					// 发生错误时，默认显示授权页面
					console.log('授权状态检查异常，显示授权页面');
				}
			},

			// 按钮点击处理
			onAuthButtonClick() {
				console.log('按钮点击，协议状态:', this.agreeTerms);

				// 如果未勾选协议，显示提示和抖动
				if (!this.agreeTerms) {
					console.log('未勾选协议，显示提示');
					this.showAgreementTipAndShake();
					return;
				}

				// 如果已勾选协议，点击会自动触发 getPhoneNumber (通过 open-type)
				console.log('协议已勾选，将触发微信授权');
			},

			// 获取手机号授权
			async onGetPhoneNumber(e) {
				console.log('授权回调:', e);

				// 此时协议肯定已勾选，直接处理授权结果
				if (e.detail.errMsg === 'getPhoneNumber:fail user deny') {
					uni.showModal({
						title: '授权提醒',
						content: '为了提供更好的停车服务，我们需要获取您的手机号进行身份验证。请点击"允许"完成授权。',
						showCancel: true,
						cancelText: '暂不授权',
						confirmText: '重新授权',
						success: (res) => {
							if (res.confirm) {
								// 用户选择重新授权，可以引导用户再次点击授权按钮
								uni.showToast({
									title: '请再次点击授权按钮',
									icon: 'none',
									duration: 2000
								});
							}
						}
					});
					return;
				}

				if (e.detail.errMsg !== 'getPhoneNumber:ok') {
					uni.showModal({
						title: '授权异常',
						content: '获取手机号时出现异常，可能是网络问题或微信服务暂时不可用。请稍后重试。',
						showCancel: true,
						cancelText: '稍后重试',
						confirmText: '立即重试'
					});
					return;
				}

				this.loading = true;
				this.showLoading = true;

				// 启动进度追踪
				this.startProgressTracking();

				try {
					// 获取加密数据（开发阶段不实际使用）
					const {
						encryptedData,
						iv
					} = e.detail;

					// 第一步：获取登录凭证
					this.updateStage(1, 20, '正在获取微信登录凭证...');
					const loginRes = await this.wxLogin();

					// 第二步：验证身份角色（最耗时的阶段）
					this.updateStage(2, 30, '正在验证您的身份...\n🔍 查询外部服务中，请耐心等待');

					// 添加友好的进度提示
					uni.showToast({
						title: '正在查询月票信息',
						icon: 'loading',
						duration: 3000,
						mask: false
					});

					// 身份验证过程中逐步更新进度
					const verificationStartTime = Date.now();

					// 动态进度更新，根据实际耗时调整
					const progressUpdateInterval = setInterval(() => {
						const elapsed = (Date.now() - verificationStartTime) / 1000;
						if (elapsed < 10) {
							this.updateStage(2, 35, '🔍 正在连接系统...');
						} else if (elapsed < 20) {
							this.updateStage(2, 45, '📊 正在查询您的月票信息...');
						} else if (elapsed < 30) {
							this.updateStage(2, 55, '🎯 正在匹配用户身份和权限...');
						} else if (elapsed < 45) {
							this.updateStage(2, 65, '⏳ 外部查询正在进行，请稍等...');
						} else if (elapsed < 60) {
							this.updateStage(2, 70, '🔄 查询数据量较大，正在处理...');
						} else {
							this.updateStage(2, 75, '⌛ 系统正在努力查询中，马上完成...');
						}
					}, 5000); // 每5秒更新一次

					// 开始身份验证
					const phoneResult = await this.decryptPhone({
						code: loginRes.code,
						encryptedData,
						iv,
						parkName: '' // 不设置默认停车场
					});

					// 清除进度更新定时器
					clearInterval(progressUpdateInterval);

					const verificationDuration = Math.round((Date.now() - verificationStartTime) / 1000);

					// 第三步：设置用户信息
					this.updateStage(3, 85, `✅ 身份验证完成(${verificationDuration}秒)\n正在为您设置用户信息...`);

					// 如果是未注册用户，自动转为访客
					if (phoneResult.role === 'unregistered' || !phoneResult.role) {
						console.log('📝 未注册用户，自动设置为访客角色');
						
						// 🔍 验证访客是否通过二维码扫描进入
						const scannedAddressInfo = uni.getStorageSync('scannedAddressInfo') || {};
						const community = scannedAddressInfo.community;
						const source = scannedAddressInfo.source;
						
						// 访客必须通过二维码扫描进入
						if (!community || community.trim() === '' || community === '-停车场' || source !== 'qr_scan') {
							console.warn('❌ [访客验证] 访客未通过二维码扫描进入');
							
							// 重置进度
							this.completeProgress();
							this.showLoading = false;
							this.loading = false;
							
							uni.showModal({
								title: '访问受限',
								content: '访客用户需要通过扫描车场二维码才能使用停车服务。\n\n请联系管家获取专用二维码后重新扫码登录。',
								showCancel: false,
								confirmText: '我知道了'
							});
							return;
						}
						
						console.log('✅ [访客验证] 访客通过二维码扫描进入，车场:', community);
						
						phoneResult.role = 'visitor';
						phoneResult.roleText = '访客';
						phoneResult.userInfo = {
							id: Date.now(),
							openid: 'visitor_' + phoneResult.phone,
							nickname: '访客用户',
							phone: phoneResult.phone,
							auditstatus: '已通过',
							userkind: 'visitor'
						};
						phoneResult.permissions = ['appointment.create', 'appointment.query.own', 'visitor.appointment', 'visitor.query'];
					}
					
					// 保存用户信息
					const loginResult = await this.saveUserInfo(phoneResult);

					// 第四步：完成设置
					this.updateStage(4, 95, `🎉 欢迎您，${phoneResult.roleText}！\n正在进入停车服务...`);

					// 显示角色相关的成功提示
					const successMessages = {
						owner: '🏠 业主身份验证成功！',
						manager: '👨‍💼 管家身份验证成功！',
						visitor: '🚗 访客身份验证成功！'
					};

					const successMessage = successMessages[phoneResult.role] || '✅ 身份验证成功！';

					uni.showToast({
						title: successMessage,
						icon: 'success',
						duration: 2000
					});

					// 延迟一下让用户看到成功状态，同时显示角色权限提示
					setTimeout(() => {
						const roleDescriptions = {
							owner: '您可以预约停车位、查看个人违规记录',
							manager: '您可以管理预约、审核申请、查看所有记录',
							visitor: '您可以申请访客预约、查看个人记录'
						};

						const roleDesc = roleDescriptions[phoneResult.role] || '欢迎使用停车服务';

						// 最终完成进度
						this.completeProgress();

						uni.showToast({
							title: roleDesc,
							icon: 'none',
							duration: 2500,
							mask: false
						});

						// 再延迟一下跳转
						setTimeout(() => {
							this.navigateToHome(phoneResult.role);
						}, 1000);
					}, 1500);

				} catch (error) {
					console.error('🚨 授权失败:', error);

					// 重置进度追踪
					this.resetProgress();

					// 隐藏加载状态
					this.showLoading = false;
					this.loading = false;

					// 处理授权错误，提供友好的用户反馈
					this.handleAuthError(error);

				} finally {
					// 确保加载状态被清除
					this.loading = false;

					// 延迟隐藏加载框，让用户看到最终状态
					setTimeout(() => {
						this.showLoading = false;
						// 确保进度被重置
						this.resetProgress();
					}, 1000);
				}
			},

			// 微信登录
			wxLogin() {
				return new Promise((resolve, reject) => {
					uni.login({
						provider: 'weixin',
						success: (res) => {
							if (res.code) {
								resolve(res);
							} else {
								reject(new Error('登录失败'));
							}
						},
						fail: reject
					});
				});
			},

			// 调用后端接口进行授权
			async decryptPhone({
				code,
				encryptedData,
				iv
			}) {;

				try {
					// 调用后端授权接口（传递停车场信息）
					const authResult = await this.callAuthAPI({
						code,
						encryptedData,
						iv,
						parkName: '' // 不设置默认停车场
					});
					if (authResult.code === "0") {
						// 明确获取 data 部分
						const actualData = authResult.data.data;
						// 打印所有字段
						console.log('📊 实际数据结构分析:');
						if (actualData && typeof actualData === 'object') {
							for (const key in actualData) {
								console.log(`  - ${key}: ${actualData[key]} (${typeof actualData[key]})`);
							}
						}

						// 验证返回的数据结构
						if (!actualData) {
							console.error('❌ 后端返回的data为空');
							throw new Error('服务器返回的数据为空');
						}

						// 检查角色是否存在且有效
						if (!actualData.role || actualData.role.trim() === '') {
							console.error('❌ 角色信息无效:', authResult.data.role);
							console.error('📊 完整返回数据:', authResult);
							console.error('📊 data部分:', actualData);
							uni.showModal({
								title: '授权异常',
								content: `服务器返回的角色信息无效，请重试或联系管理员`,
								showCancel: false
							});
							throw new Error('角色信息无效');
						}

						console.log('✅ 角色验证通过:', actualData.role, '-', actualData.roleText);

						return {
							phone: actualData.phone,
							role: actualData.role,
							roleText: actualData.roleText,
							userInfo: actualData.userInfo,
							permissions: actualData.permissions || []
						};
					} else {
						throw new Error(authResult.msg || '授权失败');
					}
				} catch (error) {
					console.error('❌ 后端授权失败:', error);

					// 根据错误类型提供友好的处理方案
					if (error.message.includes('网络') || error.message.includes('timeout')) {
						// 网络相关错误，不再提供测试模式选项
						uni.showModal({
							title: '网络连接超时',
							content: '身份验证需要连接外部月票系统，当前网络连接较慢或不稳定。\n\n请检查您的网络连接：\n• 确保WiFi或移动数据已开启\n• 尝试切换到更稳定的网络\n• 移动到信号较好的位置\n\n检查完成后，请重新点击授权按钮。',
							showCancel: true,
							cancelText: '稍后重试',
							confirmText: '重新检测',
							success: (res) => {
								if (res.confirm) {
									// 用户选择重新检测
									uni.showToast({
										title: '请重新点击授权按钮',
										icon: 'none',
										duration: 2500
									});
								}
							}
						});
						throw error;
					} else if (error.message.includes('服务器错误')) {
						// 服务器错误
						uni.showModal({
							title: '服务暂时不可用',
							content: '停车服务系统正在维护或遇到临时问题。\n\n建议：\n• 稍后再试\n• 联系停车场管理员\n• 或重启小程序后重试',
							showCancel: true,
							cancelText: '稍后再试',
							confirmText: '联系管理员',
							success: (res) => {
								if (res.confirm) {
									// 显示联系方式（可以根据实际情况修改）
									uni.showModal({
										title: '联系管理员',
										content: '如需帮助，请联系：\n\n停车场管理员\n电话：请咨询现场工作人员',
										showCancel: false,
										confirmText: '好的'
									});
								}
							}
						});
						throw error;
					} else if (error.message.includes('角色信息无效')) {
						// 数据异常
						uni.showModal({
							title: '数据异常',
							content: '系统返回的身份信息异常，可能是：\n\n• 您的账户信息需要更新\n• 系统数据同步延迟\n• 服务配置问题\n\n建议联系管理员处理。',
							showCancel: true,
							cancelText: '稍后重试',
							confirmText: '联系管理员'
						});
						throw error;
					} else {
						// 其他未知错误
						uni.showModal({
							title: '授权遇到问题',
							content: `抱歉，授权过程中遇到了问题：\n\n${error.message}\n\n您可以：\n• 重新尝试授权\n• 重启小程序后再试\n• 联系技术支持`,
							showCancel: true,
							cancelText: '重新尝试',
							confirmText: '技术支持',
							success: (res) => {
								if (res.confirm) {
									uni.showModal({
										title: '技术支持',
										content: '如果问题持续存在，请：\n\n1. 截图保存错误信息\n2. 记录操作步骤\n3. 联系技术支持人员\n\n我们会尽快为您解决问题。',
										showCancel: false,
										confirmText: '知道了'
									});
								}
							}
						});
						throw error;
					}
				}
			},

			// 调用后端授权API
			async callAuthAPI(params) {
				try {
					// 导入API配置 - 使用require替代动态import
					const apiConfig = require('@/config/api.js');
					const wechatAPI = apiConfig.wechatAPI || apiConfig.default?.wechatAPI;

					if (!wechatAPI) {
						throw new Error('API配置加载失败');
					}

					console.log('🚀 调用后端授权接口:', {
						url: '/parking/wechat/phoneAuth',
						params: {
							code: params.code,
							encryptedData: params.encryptedData ? '已提供' : '未提供',
							iv: params.iv ? '已提供' : '未提供',
							parkName: params.parkName || ''
						}
					});

					return await wechatAPI.phoneAuth(params);
				} catch (error) {
					console.error('❌ API调用失败:', error);

					// 根据错误类型抛出不同的错误信息
					if (error.originalError) {
						// 网络错误
						throw new Error('网络连接失败，请检查网络连接');
					} else if (error.statusCode) {
						// HTTP错误
						throw new Error(`服务器错误 (${error.statusCode}): ${error.message}`);
					} else {
						// 其他错误
						throw new Error(error.message || '无法连接到服务器');
					}
				}
			},



			// 保存用户信息
			async saveUserInfo(userInfo) {
				// 准备认证数据，添加权限信息
				const authData = {
					phone: userInfo.phone,
					role: userInfo.role,
					roleText: userInfo.roleText,
					message: userInfo.message,
					userInfo: userInfo.userInfo,
					permissions: userInfo.permissions
				};

				// 使用AuthUtils进行登录
				const loginResult = await AuthUtils.login(authData);

				// 检查登录是否成功
				if (!loginResult.success) {
					throw new Error(loginResult.message || '登录失败');
				}

				console.log('✅ 用户信息保存成功，角色:', authData.role);

				// 保存到Vuex（如果使用Vuex）
				if (this.$store) {
					this.$store.commit('$tStore', {
						name: 'vuex_user',
						value: loginResult.data
					});
				}

				return loginResult;
			},

			// 根据角色跳转到首页
			async navigateToHome(role) {
				try {
					// 确保TabBar已经设置完成
					await DynamicTabBarManager.setTabBarByRole(role);

					// 定义角色对应的首页
					const homePages = {
						manager: '/pagesA/reservation/searchResult/searchResult', // 管家默认进入预约查询
						owner: '/pagesA/reservation/form', // 业主默认进入预约页面
						visitor: '/pagesA/reservation/form' // 访客默认进入预约页面
					};

					const homePage = homePages[role] || '/pagesA/reservation/form';

					console.log(`🚀 用户角色: ${role}, TabBar已设置，跳转到: ${homePage}`);

					uni.reLaunch({
						url: homePage,
						success: () => {
							console.log('✅ 页面跳转成功');

							// 显示欢迎信息
							setTimeout(() => {
								// 🔍 检查访客是否需要显示欢迎信息
								if (role === 'visitor') {
									// 访客需要验证是否通过二维码扫描进入
									const scannedAddressInfo = uni.getStorageSync('scannedAddressInfo') || {};
									const community = scannedAddressInfo.community;
									const source = scannedAddressInfo.source;
									
									// 只有通过二维码扫描且有车场信息的访客才显示欢迎信息
									if (community && community.trim() !== '' && community !== '-停车场' && source === 'qr_scan') {
										console.log('✅ 访客通过二维码扫描进入，显示欢迎信息');
										uni.showToast({
											title: '🚗 欢迎访客！',
											icon: 'success',
											duration: 1500
										});
									} else {
										console.log('⚠️ 访客未通过二维码扫描，不显示欢迎信息');
										// 不显示任何提示
									}
								} else {
									// 业主和管家正常显示欢迎信息
									const welcomeMessages = {
										manager: '🎉 欢迎管家！',
										owner: '🏠 欢迎业主！'
									};
									const welcomeMessage = welcomeMessages[role] || '🎉 欢迎您！';
									uni.showToast({
										title: welcomeMessage,
										icon: 'success',
										duration: 1500
									});
								}
							}, 500);
						},
						fail: (err) => {
							console.error('❌ 页面跳转失败:', err);
							// 如果跳转失败，尝试跳转到首页
							uni.reLaunch({
								url: '/pagesA/reservation/form'
							});
						}
					});

				} catch (error) {
					console.error('❌ TabBar设置失败:', error);

					// 即使TabBar设置失败，也要跳转
					const defaultPages = {
						manager: '/pagesA/reservation/searchResult/searchResult',
						owner: '/pagesA/reservation/form',
						visitor: '/pagesA/reservation/form'
					};
					const defaultPage = defaultPages[role] || '/pagesA/reservation/form';

					uni.reLaunch({
						url: defaultPage
					});
				}
			},

			// 继续访客登录流程
			async continueLogin(visitorResult) {
				try {
					// 🔍 访客扫码验证
					if (visitorResult.role === 'visitor') {
						const scannedAddressInfo = uni.getStorageSync('scannedAddressInfo') || {};
						const community = scannedAddressInfo.community;
						const source = scannedAddressInfo.source;
						
						// 访客必须通过二维码扫描进入
						if (!community || community.trim() === '' || community === '-停车场' || source !== 'qr_scan') {
							console.warn('❌ [访客验证] 访客未通过二维码扫描进入');
							
							// 重置进度
							this.resetProgress();
							this.showLoading = false;
							this.loading = false;
							
							uni.showModal({
								title: '访问受限',
								content: '访客用户需要通过扫描车场二维码才能进行预约。\n\n请联系管家获取专用预约二维码。',
								showCancel: false,
								confirmText: '我知道了'
							});
							return;
						}
						
						console.log('✅ [访客验证] 访客通过二维码扫描进入，车场:', community);
					}
					
					// 第三步：设置用户信息
					this.updateStage(3, 85, `✅ 身份确认完成\n正在为您设置用户信息...`);

					// 保存用户信息
					const loginResult = await this.saveUserInfo(visitorResult);

					// 第四步：完成设置
					this.updateStage(4, 95, `🎉 欢迎您，${visitorResult.roleText}！\n正在进入停车服务...`);

					// 延迟一下让用户看到成功状态
					setTimeout(() => {
						// 最终完成进度
						this.completeProgress();

						// 再延迟一下跳转
						setTimeout(() => {
							this.navigateToHome(visitorResult.role);
						}, 500);
					}, 1000);

				} catch (error) {
					console.error('🚨 登录失败:', error);

					// 重置进度追踪
					this.resetProgress();

					// 隐藏加载状态
					this.showLoading = false;
					this.loading = false;

					// 处理登录错误
					this.handleAuthError(error);
				}
			},


			// 处理授权错误
			handleAuthError(error) {
				console.error('🚨 授权错误详情:', error);

				if (error.message && error.message.includes('用户取消选择')) {
					// 用户取消了角色选择，不显示错误
					return;
				}

				// 花生壳免费版限制处理
				if (error.isHuashengkeError || (error.message && error.message.includes('花生壳'))) {
					// 检查是否是正在自动重试的情况
					if (error.message && error.message.includes('正在自动处理')) {
						// 显示友好的等待提示
						uni.showToast({
							title: '🕒 花生壳等待中，请稍候...',
							icon: 'loading',
							duration: 3000,
							mask: true
						});
						
						// 更新加载文本
						this.loadingText = '🌐 检测到内网穿透中间页\n⏳ 正在自动等待跳转...\n(约需10-15秒)';
						
						return; // 不显示错误弹窗，让自动重试继续
					}
					
					// 如果是重试失败的情况
					if (error.statusCode === 'TUNNEL_RETRY_FAILED') {
						uni.showModal({
							title: '访问异常',
							content: '花生壳自动跳转失败，可能的原因：\n\n• 网络连接不稳定\n• 花生壳服务异常\n• 后端服务未启动\n\n建议：\n• 重新尝试授权\n• 检查网络连接\n• 联系技术支持',
							showCancel: true,
							cancelText: '重新尝试',
							confirmText: '联系支持',
							success: (res) => {
								if (res.confirm) {
									this.showHelpInfo();
								} else {
									// 重新尝试
									uni.showToast({
										title: '请重新点击授权按钮',
										icon: 'none',
										duration: 2000
									});
								}
							}
						});
						return;
					}
					
					// 其他花生壳相关错误
					uni.showModal({
						title: '内网穿透提示',
						content: '检测到花生壳内网穿透服务。\n\n✅ 系统已自动处理10秒等待\n✅ 支持免费版无需升级\n\n如果仍有问题，请：\n• 检查网络连接\n• 确认后端服务运行\n• 联系技术支持',
						showCancel: true,
						cancelText: '重新尝试',
						confirmText: '获取帮助',
						success: (res) => {
							if (res.confirm) {
								this.showHelpInfo();
							} else {
								uni.showToast({
									title: '请重新点击授权按钮',
									icon: 'none',
									duration: 2000
								});
							}
						}
					});
					return;
				}

				// 根据错误类型提供不同的处理方案
				if (error.message && error.message.includes('网络')) {
					// 网络错误
					uni.showModal({
						title: '网络连接问题',
						content: '网络连接不稳定，影响了身份验证过程。\n\n建议解决方案：\n• 检查网络连接状态\n• 切换到稳定的WiFi\n• 移动到信号较好的位置',
						showCancel: true,
						cancelText: '稍后重试',
						confirmText: '重新检测',
						success: (res) => {
							if (res.confirm) {
								// 显示网络检测提示
								uni.showLoading({
									title: '检测网络中...',
									mask: true
								});

								// 简单的网络检测
								setTimeout(() => {
									uni.hideLoading();
									uni.showToast({
										title: '请重新点击授权按钮',
										icon: 'none',
										duration: 2500
									});
								}, 2000);
							}
						}
					});
				} else if (error.message && error.message.includes('timeout')) {
					// 超时错误
					uni.showModal({
						title: '请求超时',
						content: '身份验证服务响应较慢，这可能是由于：\n\n• 网络延迟较高\n• 服务器负载较重\n• 外部验证服务繁忙\n\n请稍后重试或联系管理员。',
						showCancel: true,
						cancelText: '稍后重试',
						confirmText: '立即重试',
						success: (res) => {
							if (res.confirm) {
								// 用户选择立即重试，可以触发重新授权
								uni.showToast({
									title: '请重新点击授权按钮',
									icon: 'none',
									duration: 2000
								});
							}
						}
					});
				} else if (error.attempts && error.attempts > 1) {
					// 多次尝试失败
					uni.showModal({
						title: '多次尝试失败',
						content: `已尝试 ${error.attempts} 次，仍然无法完成授权。\n\n可能的原因：\n• 网络环境不稳定\n• 服务器维护中\n• 账户状态异常\n\n建议联系技术支持。`,
						showCancel: true,
						cancelText: '稍后再试',
						confirmText: '获取帮助',
						success: (res) => {
							if (res.confirm) {
								this.showHelpInfo();
							}
						}
					});
				} else {
					// 通用错误处理
					const errorMessage = error.message || '未知错误';
					uni.showModal({
						title: '授权遇到问题',
						content: `很抱歉，授权过程中遇到了问题：\n\n${errorMessage}\n\n建议您：\n• 重新尝试授权\n• 检查网络连接\n• 重启小程序`,
						showCancel: true,
						cancelText: '重新尝试',
						confirmText: '获取帮助',
						success: (res) => {
							if (res.confirm) {
								this.showHelpInfo();
							} else {
								// 用户选择重新尝试
								uni.showToast({
									title: '请重新点击授权按钮',
									icon: 'none',
									duration: 2000
								});
							}
						}
					});
				}
			},

			// 显示帮助信息
			showHelpInfo() {
				uni.showModal({
					title: '获取帮助',
					content: '如果持续遇到问题，您可以：\n\n🔧 技术支持\n• 重启小程序后重试\n• 清除小程序缓存\n• 更新微信到最新版本\n\n📞 联系我们\n• 联系停车场管理员\n• 反馈问题给技术团队',
					showCancel: true,
					cancelText: '自助解决',
					confirmText: '联系支持',
					success: (res) => {
						if (res.confirm) {
							uni.showModal({
								title: '联系支持',
								content: '请联系：\n\n停车场现场管理员\n或扫描停车场内的客服二维码\n\n我们会尽快为您解决问题。',
								showCancel: false,
								confirmText: '好的'
							});
						} else {
							uni.showToast({
								title: '请尝试重启小程序',
								icon: 'none',
								duration: 2500
							});
						}
					}
				});
			},

			// 开发调试：清除授权状态
			clearAuth() {
				uni.showModal({
					title: '确认清除',
					content: '确定要清除授权状态吗？清除后需要重新授权登录。',
					success: (res) => {
						if (res.confirm) {
							// 清除本地存储
							uni.removeStorageSync('userInfo');

							// 清除全局状态
							const app = getApp();
							if (app.globalData) {
								app.globalData.isAuthorized = false;
								app.globalData.userInfo = null;
							}

							uni.showToast({
								title: '所有状态已清除',
								icon: 'success'
							});

							console.log('授权状态和申请记录已清除');
						}
					}
				});
			}
		}
	}
</script>

<style lang="scss" scoped>
	.auth-container {
		min-height: 100vh;
		position: relative;
		overflow: hidden;
		background: #f8fafc;
	}

	.bg-gradient {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 50vh;
		background: linear-gradient(135deg, #1677ff 0%, #0958d9 100%);
		z-index: 1;
	}

	.wave-decoration {
		position: absolute;
		top: 45vh;
		left: 0;
		right: 0;
		height: 100rpx;
		z-index: 2;

		.wave {
			position: absolute;
			bottom: 0;
			left: 0;
			width: 100%;
			height: 100rpx;
			background: #f8fafc;

			&.wave-1 {
				border-radius: 0 0 50% 50% / 0 0 100% 100%;
				animation: wave-flow 4s ease-in-out infinite;
			}

			&.wave-2 {
				border-radius: 0 0 40% 60% / 0 0 80% 120%;
				opacity: 0.8;
				animation: wave-flow 6s ease-in-out infinite reverse;
			}
		}
	}

	@keyframes wave-flow {

		0%,
		100% {
			transform: translateX(0) scaleY(1);
		}

		50% {
			transform: translateX(-20rpx) scaleY(1.1);
		}
	}

	.main-content {
		position: relative;
		z-index: 3;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		padding: 0 60rpx;
	}

	.header-section {
		flex: none;
		padding-top: 150rpx;
		text-align: center;

		.logo-container {
			.logo-bg {
				width: 120rpx;
				height: 120rpx;
				background: rgba(255, 255, 255, 0.25);
				border-radius: 30rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				margin: 0 auto 30rpx;
				backdrop-filter: blur(20px);
				box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.2);
				border: 2rpx solid rgba(255, 255, 255, 0.3);

				.logo-icon {
					font-size: 60rpx;
				}
			}

			.app-title {
				display: block;
				font-size: 52rpx;
				font-weight: 700;
				color: #fff;
				margin-bottom: 12rpx;
				letter-spacing: 2rpx;
				text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
			}

			.app-subtitle {
				display: block;
				font-size: 28rpx;
				color: #fff;
				font-weight: 400;
				letter-spacing: 1rpx;
				opacity: 0.9;
				text-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.2);
			}
		}
	}

	.content-section {
		flex: 1;
		padding-top: 100rpx;

		.welcome-text {
			text-align: center;
			margin-bottom: 60rpx;
			background: rgba(255, 255, 255, 0.95);
			border-radius: 24rpx;
			padding: 40rpx 30rpx 30rpx;
			box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);

			.welcome-title {
				display: block;
				font-size: 42rpx;
				font-weight: 600;
				color: #1a202c;
				margin-bottom: 16rpx;
			}

			.welcome-desc {
				display: block;
				font-size: 28rpx;
				color: #4a5568;
				line-height: 1.6;
				margin-bottom: 24rpx;
			}

			.process-tips {
				background: linear-gradient(135deg, #f7f9fc 0%, #e3f2fd 100%);
				border-radius: 16rpx;
				padding: 24rpx 20rpx;
				margin-top: 24rpx;
				border: 1rpx solid #e8f4f8;
				text-align: left;

				.tips-title {
					display: block;
					font-size: 26rpx;
					font-weight: 600;
					color: #1565c0;
					margin-bottom: 16rpx;
					text-align: center;
				}

				.tips-item {
					display: block;
					font-size: 24rpx;
					color: #455a64;
					margin-bottom: 8rpx;
					padding-left: 12rpx;
					position: relative;
					line-height: 1.5;

					&::before {
						content: '•';
						position: absolute;
						left: 0;
						color: #1976d2;
						font-weight: bold;
					}
				}

				.tips-note {
					display: block;
					font-size: 22rpx;
					color: #ff7043;
					margin-top: 12rpx;
					text-align: center;
					background: rgba(255, 112, 67, 0.1);
					padding: 8rpx 12rpx;
					border-radius: 8rpx;
					font-weight: 500;
				}
			}
		}

		.highlights-section {
			padding: 0 30rpx;
			max-width: 600rpx;
			margin: 0 auto;

			.highlight-item {
				display: flex;
				align-items: center;
				padding: 24rpx 28rpx;
				margin-bottom: 20rpx;
				background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%);
				border-radius: 20rpx;
				box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
				border: 1rpx solid rgba(255, 255, 255, 0.8);
				backdrop-filter: blur(10rpx);
				position: relative;
				overflow: hidden;

				&:last-child {
					margin-bottom: 0;
				}

				&::before {
					content: '';
					position: absolute;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					background: linear-gradient(135deg, transparent 0%, rgba(22, 119, 255, 0.02) 100%);
					pointer-events: none;
				}

				.icon-container {
					position: relative;
					margin-right: 32rpx;
					flex-shrink: 0;

					.icon-bg {
						width: 72rpx;
						height: 72rpx;
						border-radius: 50%;
						display: flex;
						align-items: center;
						justify-content: center;
						position: relative;
						z-index: 2;

						&.icon-blue {
							background: linear-gradient(135deg, #1677ff 0%, #69c0ff 100%);
							box-shadow: 0 4rpx 16rpx rgba(22, 119, 255, 0.3);
						}

						&.icon-green {
							background: linear-gradient(135deg, #52c41a 0%, #b7eb8f 100%);
							box-shadow: 0 4rpx 16rpx rgba(82, 196, 26, 0.3);
						}

						&.icon-orange {
							background: linear-gradient(135deg, #fa8c16 0%, #ffd666 100%);
							box-shadow: 0 4rpx 16rpx rgba(250, 140, 22, 0.3);
						}

						.icon {
							font-size: 40rpx;
							filter: brightness(1.1);
						}
					}

					.icon-ring {
						position: absolute;
						top: -6rpx;
						left: -6rpx;
						width: 84rpx;
						height: 84rpx;
						border: 2rpx solid rgba(22, 119, 255, 0.1);
						border-radius: 50%;
						z-index: 1;
						animation: ring-pulse 3s ease-in-out infinite;
					}
				}

				.content {
					flex: 1;
					min-width: 0;

					.title {
						display: block;
						font-size: 30rpx;
						font-weight: 600;
						color: #1a202c;
						margin-bottom: 6rpx;
						line-height: 1.4;
					}

					.desc {
						display: block;
						font-size: 24rpx;
						color: #718096;
						line-height: 1.5;
						font-weight: 400;
					}
				}
			}
		}
	}

	.auth-section {
		flex: none;
		padding-bottom: 80rpx;

		.auth-button {
			width: 100%;
			height: 112rpx;
			background: linear-gradient(135deg, #1677ff 0%, #0958d9 100%);
			border-radius: 56rpx;
			border: none;
			margin-bottom: 40rpx;
			position: relative;
			overflow: hidden;
			box-shadow: 0 8rpx 24rpx rgba(22, 119, 255, 0.4);
			transition: all 0.3s ease;

			&:not(:disabled):active {
				transform: scale(0.98);
			}

			&:disabled {
				opacity: 0.7;
			}

			&::after {
				border: none;
			}

			.button-content {
				display: flex;
				align-items: center;
				justify-content: center;
				height: 100%;
				position: relative;
				z-index: 2;

				.wechat-icon {
					font-size: 40rpx;
					margin-right: 16rpx;
				}

				.button-text {
					font-size: 32rpx;
					font-weight: 600;
					color: #fff;
					letter-spacing: 1rpx;
				}
			}

			.loading-wave {
				position: absolute;
				top: 0;
				left: -100%;
				width: 100%;
				height: 100%;
				background: linear-gradient(90deg,
						transparent,
						rgba(255, 255, 255, 0.3),
						transparent);
				animation: loading-wave 1.5s infinite;
			}
		}

		.privacy-notice {
			text-align: center;
			line-height: 1.6;

			.agreement-section {
				margin-bottom: 16rpx;
				position: relative;
				transition: all 0.3s ease;

				// 提示框样式
				.agreement-tip {
					position: absolute;
					top: -60rpx;
					left: 50%;
					transform: translateX(-50%);
					background: rgba(0, 0, 0, 0.8);
					color: #fff;
					padding: 12rpx 24rpx;
					border-radius: 24rpx;
					z-index: 100;
					animation: tip-fade-in 0.3s ease;

					&::after {
						content: '';
						position: absolute;
						bottom: -8rpx;
						left: 50%;
						transform: translateX(-50%);
						width: 0;
						height: 0;
						border-left: 8rpx solid transparent;
						border-right: 8rpx solid transparent;
						border-top: 8rpx solid rgba(0, 0, 0, 0.8);
					}

					.tip-text {
						font-size: 24rpx;
						color: #fff;
						white-space: nowrap;
					}
				}

				// 抖动效果
				&.shaking {
					animation: shake-horizontal 0.6s ease-in-out;
				}

				.agreement-item {
					display: flex;
					align-items: flex-start;
					justify-content: center;
					gap: 12rpx;
					text-align: left;

					// 调整复选框大小
					checkbox {
						transform: scale(0.8);
						margin-right: 4rpx;
					}

					// 针对不同平台的复选框大小调整
					/deep/ .uni-checkbox-input {
						width: 18px !important;
						height: 18px !important;
						margin-right: 8rpx;
					}

					// 微信小程序端的复选框调整
					/deep/ .wx-checkbox-input {
						width: 18px !important;
						height: 18px !important;
						transform: scale(0.8);
					}

					// 通用的复选框样式调整
					::v-deep checkbox {
						transform: scale(0.8);
					}

					// H5端的复选框调整
					::v-deep input[type="checkbox"] {
						width: 18px !important;
						height: 18px !important;
						transform: scale(0.8);
					}

					.agreement-text {
						font-size: 24rpx;
						color: #4a5568;
						line-height: 1.6;

						.notice-text {
							color: #a0aec0;
						}

						.notice-link {
							color: #1677ff;
							font-weight: 600;
							border-bottom: 1rpx solid #1677ff;
							margin: 0 4rpx;
						}
					}
				}
			}

			.privacy-tips {
				background: rgba(255, 255, 255, 0.8);
				border-radius: 12rpx;
				padding: 16rpx 20rpx;
				backdrop-filter: blur(10rpx);
				border: 1rpx solid rgba(255, 255, 255, 0.3);

				.privacy-tip {
					display: block;
					font-size: 20rpx;
					color: #64748b;
					line-height: 1.5;
					margin-bottom: 4rpx;

					&:last-child {
						margin-bottom: 0;
					}
				}
			}
		}
	}

	.fullscreen-loading {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(10px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;

		.loading-card {
			background: #fff;
			border-radius: 32rpx;
			padding: 60rpx 40rpx;
			text-align: center;
			min-width: 450rpx;
			max-width: 600rpx;
			box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.2);

			// 进度条样式
			.progress-container {
				margin-bottom: 40rpx;

				.progress-bar {
					width: 100%;
					height: 8rpx;
					background: #f0f0f0;
					border-radius: 4rpx;
					overflow: hidden;
					margin-bottom: 12rpx;

					.progress-fill {
						height: 100%;
						background: linear-gradient(90deg, #1890ff 0%, #52c41a 100%);
						border-radius: 4rpx;
						transition: width 0.3s ease;
						animation: progress-shimmer 2s infinite;
					}
				}

				.progress-text {
					font-size: 24rpx;
					color: #1890ff;
					font-weight: 600;
				}
			}

			// 阶段指示器样式
			.stage-indicators {
				display: flex;
				align-items: center;
				justify-content: center;
				margin-bottom: 40rpx;

				.stage-item {
					display: flex;
					flex-direction: column;
					align-items: center;

					.stage-icon {
						width: 40rpx;
						height: 40rpx;
						border-radius: 50%;
						background: #f0f0f0;
						color: #999;
						display: flex;
						align-items: center;
						justify-content: center;
						font-size: 22rpx;
						font-weight: 600;
						margin-bottom: 8rpx;
						transition: all 0.3s ease;
					}

					.stage-label {
						font-size: 20rpx;
						color: #999;
						transition: color 0.3s ease;
					}

					&.active {
						.stage-icon {
							background: #1890ff;
							color: #fff;
							animation: stage-pulse 2s infinite;
						}

						.stage-label {
							color: #1890ff;
						}
					}

					&.completed {
						.stage-icon {
							background: #52c41a;
							color: #fff;
							animation: none;
						}

						.stage-label {
							color: #52c41a;
						}
					}
				}

				.stage-connector {
					width: 60rpx;
					height: 2rpx;
					background: #f0f0f0;
					margin: 0 20rpx;
					transition: background 0.3s ease;

					&.active {
						background: #1890ff;
					}
				}
			}

			// 动态loading动画
			.loading-animation {
				margin-bottom: 30rpx;

				.searching-icon {
					position: relative;
					width: 80rpx;
					height: 80rpx;
					margin: 0 auto;

					.radar-circle {
						position: absolute;
						top: 50%;
						left: 50%;
						transform: translate(-50%, -50%);
						border: 2rpx solid #1890ff;
						border-radius: 50%;
						opacity: 0;
						animation: radar-pulse 2s infinite;

						&:nth-child(1) {
							width: 20rpx;
							height: 20rpx;
							animation-delay: 0s;
						}

						&:nth-child(2) {
							width: 40rpx;
							height: 40rpx;
							animation-delay: 0.7s;
						}

						&:nth-child(3) {
							width: 60rpx;
							height: 60rpx;
							animation-delay: 1.4s;
						}
					}

					.search-text {
						position: absolute;
						top: 50%;
						left: 50%;
						transform: translate(-50%, -50%);
						font-size: 32rpx;
						z-index: 10;
					}
				}

				.loading-dots {
					display: flex;
					justify-content: center;
					gap: 12rpx;

					.dot {
						width: 16rpx;
						height: 16rpx;
						background: #1890ff;
						border-radius: 50%;
						animation: dot-bounce 1.4s infinite ease-in-out both;

						&.dot-1 {
							animation-delay: -0.32s;
						}

						&.dot-2 {
							animation-delay: -0.16s;
						}

						&.dot-3 {
							animation-delay: 0s;
						}
					}
				}
			}

			.loading-text {
				font-size: 28rpx;
				color: #4a5568;
				font-weight: 500;
				line-height: 1.5;
				margin-bottom: 20rpx;
			}

			// 耐心等待提示
			.patience-tips {
				background: linear-gradient(135deg, #f6ffed 0%, #e6f7ff 100%);
				border-radius: 16rpx;
				padding: 24rpx 20rpx;
				margin: 20rpx 0;
				border: 1rpx solid #d9f7be;

				.tip-item {
					display: block;
					font-size: 24rpx;
					color: #52c41a;
					margin-bottom: 8rpx;
					line-height: 1.4;

					&:last-child {
						margin-bottom: 0;
					}
				}
			}

			// 时间指示器
			.time-indicator {
				margin-top: 20rpx;
				padding: 16rpx;
				background: rgba(24, 144, 255, 0.1);
				border-radius: 12rpx;

				.time-text {
					display: block;
					font-size: 22rpx;
					color: #1890ff;
					margin-bottom: 4rpx;

					&:last-child {
						margin-bottom: 0;
					}
				}
			}
		}
	}

	@keyframes loading-wave {
		0% {
			left: -100%;
		}

		100% {
			left: 100%;
		}
	}

	@keyframes dot-bounce {

		0%,
		80%,
		100% {
			transform: scale(0);
		}

		40% {
			transform: scale(1);
		}
	}

	@keyframes ring-pulse {

		0%,
		100% {
			transform: scale(1);
			opacity: 0.3;
		}

		50% {
			transform: scale(1.1);
			opacity: 0.1;
		}
	}

	// 新增动画关键帧
	@keyframes progress-shimmer {
		0% {
			background-position: -200% 0;
		}

		100% {
			background-position: 200% 0;
		}
	}

	@keyframes stage-pulse {
		0% {
			transform: scale(1);
			box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.7);
		}

		70% {
			transform: scale(1.05);
			box-shadow: 0 0 0 10rpx rgba(24, 144, 255, 0);
		}

		100% {
			transform: scale(1);
			box-shadow: 0 0 0 0 rgba(24, 144, 255, 0);
		}
	}

	@keyframes radar-pulse {
		0% {
			transform: translate(-50%, -50%) scale(0);
			opacity: 1;
		}

		100% {
			transform: translate(-50%, -50%) scale(1);
			opacity: 0;
		}
	}

	// 协议查看弹窗样式
	.agreement-modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(10rpx);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		animation: modal-fade-in 0.3s ease;

		.modal-container {
			background: linear-gradient(135deg, #fff 0%, #f8fafc 100%);
			border-radius: 32rpx;
			margin: 40rpx;
			max-width: 660rpx;
			max-height: 80vh;
			box-shadow: 0 20rpx 60rpx rgba(22, 119, 255, 0.2);
			border: 1rpx solid rgba(255, 255, 255, 0.8);
			animation: modal-scale-in 0.3s ease;
			display: flex;
			flex-direction: column;
		}

		.modal-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 40rpx 40rpx 0;
			border-bottom: 1rpx solid #e2e8f0;
			margin-bottom: 30rpx;

			.modal-title {
				font-size: 36rpx;
				font-weight: 700;
				color: #1a202c;
			}

			.close-btn {
				width: 60rpx;
				height: 60rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 28rpx;
				color: #718096;
				background: #f7fafc;
				border-radius: 50%;
				transition: all 0.3s ease;

				&:active {
					background: #e2e8f0;
					color: #4a5568;
				}
			}
		}

		.modal-body {
			flex: 1;
			max-height: 60vh;
			padding: 0 40rpx;

			.agreement-content {
				font-size: 28rpx;
				color: #4a5568;
				line-height: 1.8;
				white-space: pre-line;
				word-wrap: break-word;
			}
		}

		.modal-footer {
			padding: 30rpx 40rpx 40rpx;
			border-top: 1rpx solid #e2e8f0;
			margin-top: 30rpx;

			.agreement-confirm-btn {
				width: 100%;
				height: 88rpx;
				background: linear-gradient(135deg, #1677ff 0%, #0958d9 100%);
				color: white;
				border: none;
				border-radius: 44rpx;
				font-size: 32rpx;
				font-weight: 600;
				box-shadow: 0 8rpx 24rpx rgba(22, 119, 255, 0.4);
				transition: all 0.3s ease;

				&:active {
					transform: scale(0.98);
					box-shadow: 0 4rpx 16rpx rgba(22, 119, 255, 0.6);
				}
			}
		}
	}



	@keyframes modal-fade-in {
		0% {
			opacity: 0;
		}

		100% {
			opacity: 1;
		}
	}

	@keyframes modal-scale-in {
		0% {
			opacity: 0;
			transform: scale(0.8);
		}

		100% {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes shake {

		0%,
		100% {
			transform: translateX(0);
		}

		10%,
		30%,
		50%,
		70%,
		90% {
			transform: translateX(-10rpx);
		}

		20%,
		40%,
		60%,
		80% {
			transform: translateX(10rpx);
		}
	}

	// 水平抖动动画
	@keyframes shake-horizontal {

		0%,
		100% {
			transform: translateX(0);
		}

		10%,
		30%,
		50%,
		70%,
		90% {
			transform: translateX(-8rpx);
		}

		20%,
		40%,
		60%,
		80% {
			transform: translateX(8rpx);
		}
	}

	// 提示框淡入动画
	@keyframes tip-fade-in {
		0% {
			opacity: 0;
			transform: translateX(-50%) translateY(-10rpx);
		}

		100% {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}
</style>