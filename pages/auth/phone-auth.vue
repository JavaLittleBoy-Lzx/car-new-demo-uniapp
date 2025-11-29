<template>
	<view class="auth-container">
		<!-- 🔒 页面锁定遮罩（二维码已使用时显示） -->
		<view v-if="isPageLocked" class="page-lock-overlay">
			<view class="lock-content">
				<text class="lock-icon">🔒</text>
				<text class="lock-title">访问已被阻止</text>
				<text class="lock-message">此二维码已被使用，若需预约请联系管理员发放二维码</text>
			</view>
		</view>

		<!-- 正常页面内容（未锁定时显示） -->
		<view v-if="!isPageLocked">
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
					<!-- 新增：扫码参数信息展示 -->
					<view
						v-if="scannedParams.butlerName || scannedParams.address || scannedParams.building || scannedParams.unit || scannedParams.floor || scannedParams.room || scannedParams.fullAddress"
						class="scanned-info">
						<text v-if="scannedParams.butlerName">👤 管家：{{ scannedParams.butlerName }}</text>
						<!-- <text v-if="scannedParams.phone">📱 手机号：{{ scannedParams.phone }}</text> -->
						<!-- <text v-if="scannedParams.community">🏘️ 小区：{{ scannedParams.community }}</text> -->
						<text v-if="scannedParams.building">🏢 楼栋：{{ scannedParams.building }}</text>
						<text v-if="scannedParams.unit">🚪 单元：{{ scannedParams.unit }}</text>
						<text v-if="scannedParams.floor">🏠 楼层：{{ scannedParams.floor }}</text>
						<text v-if="scannedParams.room">🏡 房间：{{ scannedParams.room }}</text>
						<text v-if="scannedParams.fullAddress">📍 完整地址：{{ scannedParams.fullAddress }}</text>
						<text v-if="scannedParams.address">🏠 地址：{{ scannedParams.address }}</text>
					</view>

					<!-- 🆕 新增：授权步骤指示器 -->
					<view class="auth-steps">
						<view class="step-item"
							:class="{ active: currentAuthStep >= 1, completed: currentAuthStep > 1 }">
							<view class="step-number">1</view>
							<text class="step-text">获取授权信息</text>
						</view>
						<view class="step-divider" :class="{ active: currentAuthStep >= 2 }"></view>
						<view class="step-item"
							:class="{ active: currentAuthStep >= 2, completed: currentAuthStep > 2 }">
							<view class="step-number">2</view>
							<text class="step-text">获取手机号</text>
						</view>
					</view>

					<!-- 🆕 修改：动态显示不同的欢迎文本 -->
					<view class="welcome-text">
						<text class="welcome-title" v-if="currentAuthStep === 1">开始授权</text>
						<text class="welcome-title" v-else-if="currentAuthStep === 2">继续授权</text>
						<text class="welcome-title" v-else>欢迎使用</text>

						<text class="welcome-desc" v-if="currentAuthStep === 1">
							首先需获取您的信息以提供个性化服务
						</text>
						<text class="welcome-desc" v-else-if="currentAuthStep === 2">
							接下来需要获取您的手机号以完成身份验证
						</text>
						<text class="welcome-desc" v-else>
							请授权手机号以获得更好的服务体验
						</text>
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
								<text class="desc">官方授权保障安全</text>
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
				<!-- 🆕 修改：底部授权区域，支持分步授权 -->
				<view class="auth-section">
					<!-- 第一步：公众号授权按钮 -->
					<button v-if="currentAuthStep === 1" class="auth-button wechat-auth-button"
						:class="{ loading: wechatAuthLoading }" @click="startWechatAuth" :disabled="wechatAuthLoading">
						<view class="button-content">
							<text class="wechat-icon">🔗</text>
							<text class="button-text">{{ wechatAuthLoading ? '授权中...' : '获取授权信息' }}</text>
						</view>
						<view v-if="wechatAuthLoading" class="loading-wave"></view>
					</button>

					<!-- 第二步：手机号授权按钮（现有逻辑） -->
					<button v-else-if="currentAuthStep === 2" class="auth-button" :class="{ loading: loading }"
						:open-type="agreeTerms ? 'getPhoneNumber' : ''" @getphonenumber="onGetPhoneNumber"
						@click="onAuthButtonClick" :disabled="loading">
						<view class="button-content">
							<text class="wechat-icon">💬</text>
							<text class="button-text">{{ loading ? '授权中...' : '手机号快捷登录' }}</text>
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
							<text class="stage-label">快速授权</text>
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
						<text class="tip-item">🏢 正在{{ currentParkName }}查询您的信息</text>
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

		</view> <!-- 结束正常页面内容 -->
	</view>
</template>

<script>
// 改为静态导入，避免动态import问题
import AuthUtils from '@/utils/auth.js'
import DynamicTabBarManager from '@/utils/dynamicTabBar.js'
import { request } from '@/config/api.js'

export default {
	data() {
		return {
			loading: false,
			showLoading: false,
			loadingText: '正在授权...',
			// 🔒 页面锁定状态（用于二维码已使用的情况）
			isPageLocked: false,
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

			// 🆕 新增：授权步骤相关
			currentAuthStep: 1, // 1-微信授权, 2-手机号授权
			wechatAuthLoading: false,
			wechatUserInfo: null, // 存储公众号用户信息

			currentScene: 0, // 当前小程序场景值
			scannedParams: {
				phone: '',
				address: '',
				building: '',
				unit: '',
				floor: '',
				room: '',
				fullAddress: '',
				community: ''
			}
		}
	},

	computed: {
		// 获取当前车场名称
		currentParkName() {
			// 优先从扫码参数中获取小区名称
			if (this.scannedParams && this.scannedParams.community) {
				return this.scannedParams.community;
			}
			
			// 从本地存储中获取小区信息
			try {
				const communityInfo = uni.getStorageSync('communityInfo');
				if (communityInfo && communityInfo.name) {
					return communityInfo.name;
				}
				
				// 从用户信息中获取
				const userInfo = uni.getStorageSync('userInfo');
				if (userInfo && userInfo.yardName) {
					return userInfo.yardName;
				}
				if (userInfo && userInfo.userInfo && userInfo.userInfo.community) {
					return userInfo.userInfo.community;
				}
			} catch (e) {
				console.log('获取车场名称失败:', e);
			}
			
			// 默认返回"停车场"
			return '停车场';
		}
	},

	onLoad(options) {
		try {
			// 获取并记录当前场景值
			this.checkCurrentScene();

			// 🆕 处理来自webview的用户信息参数
			this.handleWechatAuthParams(options);

			// 🆕 检查是否从微信授权页面返回
			if (options.fromWechatAuth === 'true') {
				console.log('🔄 从微信授权页面返回，直接进入手机号授权步骤');
				this.currentAuthStep = 2; // 直接跳到手机号授权步骤

				if (options.error === 'true') {
					// 微信授权失败，显示错误并允许重试或跳过
					uni.showToast({
						title: '授权信息获取失败，可跳过此步骤',
						icon: 'none',
						duration: 3000
					});
				}
			} else {
				// 检查是否已经授权
				this.checkAuthStatus();
			}

		} catch (error) {
			console.error('onLoad错误:', error);
			this.handleInitError(error);
		}

		// 总是显示options内容，无论是否为空
		let optionsContent = '';
		if (options && typeof options === 'object') {
			optionsContent = JSON.stringify(options, null, 2);
		} else if (options) {
			optionsContent = String(options);
		} else {
			optionsContent = 'options为空或undefined';
		}
		// 新增：处理扫码带来的参数
		if (options) {
			// 初始化扫码参数
			this.scannedParams = {
				qrId: '', // 🆕 添加二维码ID
				applyKind: '', // 🆕 添加角色标识参数
				butlerId: '', // 🆕 添加管家ID
				patrolId: '', // 🆕 添加巡逻员ID
				timestamp: '', // 🆕 添加二维码生成时间戳
				phone: '',
				address: '',
				building: '',
				unit: '',
				floor: '',
				room: '',
				fullAddress: '',
				community: '',
				butlerName: '', // 🆕 添加管家姓名
				butlerPhone: '', // 🆕 添加管家电话
				type: '' // 保留现有type参数，确保向后兼容
			};

			// 处理微信扫码的q参数
			if (options.q) {
				try {
					// 解码URL
					const decodedUrl = decodeURIComponent(options.q);
					console.log('解码后的URL:', decodedUrl);

					// 提取查询参数
					const urlParams = this.extractUrlParams(decodedUrl);
					console.log('提取的URL参数:', urlParams);

					// 映射参数（支持多种可能的参数名称）
					this.scannedParams = {
						qrId: urlParams.qrId || urlParams.qr_id || urlParams.qrid || '', // 🆕 添加二维码ID映射
						applyKind: urlParams.applyKind || urlParams.apply_kind || '', // 🆕 添加角色标识参数
						butlerId: urlParams.butlerId || urlParams.butler_id || '', // 🆕 添加管家ID映射
						patrolId: urlParams.patrolId || urlParams.patrol_id || '', // 🆕 添加巡逻员ID映射
						timestamp: urlParams.timestamp || urlParams.ts || urlParams.t || '', // 🆕 添加二维码生成时间戳
						phone: urlParams.bp || urlParams.butlerPhone || urlParams.phone || urlParams.p || '',
						butlerName: urlParams.bn || urlParams.butlerName || urlParams.butler_name || '', // 🆕 添加管家姓名映射
						butlerPhone: urlParams.bp || urlParams.butlerPhone || urlParams.butler_phone || '', // 🆕 添加管家电话映射
						address: urlParams.address || urlParams.addr || '',
						building: urlParams.bd || urlParams.building || urlParams.block || urlParams.tower ||
							urlParams.b || '',
						unit: urlParams.ut || urlParams.unit || urlParams.entrance || urlParams.door || urlParams
							.u || '',
						floor: urlParams.fl || urlParams.floor || urlParams.level || urlParams.f || '',
						room: urlParams.rm || urlParams.room || urlParams.apartment || urlParams.flat || urlParams
							.r || '',
						fullAddress: urlParams.fullAddress || urlParams.detailAddress || urlParams.fa || urlParams
							.da || '',
						community: urlParams.c || urlParams.community || urlParams.complex || urlParams.comm ||
							urlParams.cn || '',
						type: urlParams.type || '' // 保留现有type参数，确保向后兼容
					};

					// 进一步解码中文参数
					const fieldsToDeccode = ['butlerName', 'address', 'building', 'unit', 'floor', 'room',
						'fullAddress', 'community'
					];
					fieldsToDeccode.forEach(field => {
						if (this.scannedParams[field]) {
							try {
								this.scannedParams[field] = decodeURIComponent(this.scannedParams[field]);
							} catch (e) {
								console.warn(`解码${field}失败:`, e);
							}
						}
					});

					// 显示解析过程的详细信息
					// 保存this上下文
					const self = this;
					setTimeout(() => {
					}, 500);
					console.log("this.scannedParams测试:",JSON.stringify(this.scannedParams))
					// if (this.scannedParams && (this.scannedParams.qrId || this.scannedParams.building || this.scannedParams.unit ||
					// 	this.scannedParams.floor || this.scannedParams.room || this.scannedParams.community || this.scannedParams.phone || this.scannedParams.applyKind || this.scannedParams.butlerId || this.scannedParams.patrolId)) {

						
					// }
					const scannedAddressInfo = {
							applyKind: this.scannedParams.applyKind || '',
							butlerId: this.scannedParams.butlerId || '',
							patrolId: this.scannedParams.patrolId || '',
							community: this.scannedParams.community || '',
							building: this.scannedParams.building || '',
							unit: this.scannedParams.unit || '',
							floor: this.scannedParams.floor || '',
							room: this.scannedParams.room || '',
							butlerName: this.scannedParams.butlerName || '',
							butlerPhone: this.scannedParams.butlerPhone || this.scannedParams.phone || '',
							visitorPhone: this.scannedParams.phone || '',
							qrId: this.scannedParams.qrId || '',
							timestamp: Date.now(), // 添加时间戳，用于判断数据新鲜度
							source: 'qr_scan' // 标记数据来源
						};

						console.log('💾 立即保存扫码地址信息到本地存储:', scannedAddressInfo);
						uni.setStorageSync('scannedAddressInfo', scannedAddressInfo);
				} catch (error) {
					console.error('解析扫码参数失败:', error);
					// 显示解析失败的信息
					uni.showModal({
						title: '解析失败',
						content: `❌ 解析二维码参数失败：\n${error.message}\n\n原始q参数：\n${options.q}`,
						showCancel: false,
						confirmText: '知道了'
					});

					// 如果解析失败，尝试直接从options获取
					this.scannedParams = {
						phone: options.bp || options.butlerPhone || options.phone || options.p || '',
						address: options.address || options.addr || '',
						building: options.bd || options.building || options.block || options.tower || options.b ||
							'',
						unit: options.ut || options.unit || options.entrance || options.door || options.u || '',
						floor: options.fl || options.floor || options.level || options.f || '',
						room: options.rm || options.room || options.apartment || options.flat || options.r || '',
						fullAddress: options.fullAddress || options.detailAddress || options.fa || options.da ||
							'',
						community: options.c || options.community || options.complex || options.comm || options
							.cn || ''
					};
				}
			} else {
				// 直接从options获取参数（非扫码场景）
				this.scannedParams = {
					qrId: options.qrId || options.qr_id || options.qrid || '', // 🆕 添加二维码ID映射
					applyKind: options.applyKind || options.apply_kind || '', // 🆕 添加角色标识参数
					butlerId: options.butlerId || options.butler_id || '', // 🆕 添加管家ID映射
					patrolId: options.patrolId || options.patrol_id || '', // 🆕 添加巡逻员ID映射
					timestamp: options.timestamp || options.ts || options.t || '', // 🆕 添加二维码生成时间戳映射
					phone: options.bp || options.butlerPhone || options.phone || options.p || options.visitorPhone || '',
					butlerName: options.bn || options.butlerName || options.butler_name || '', // 🆕 添加管家姓名映射
					butlerPhone: options.bp || options.butlerPhone || options.butler_phone || '', // 🆕 添加管家电话映射
					address: options.address || options.addr || '',
					building: options.bd || options.building || options.block || options.tower || options.b || '',
					unit: options.ut || options.unit || options.entrance || options.door || options.u || '',
					floor: options.fl || options.floor || options.level || options.f || '',
					room: options.rm || options.room || options.apartment || options.flat || options.r || '',
					fullAddress: options.fullAddress || options.detailAddress || options.fa || options.da || '',
					community: options.c || options.community || options.complex || options.comm || options.cn || '',
					type: options.type || '' // 保留现有type参数，确保向后兼容
				};
			}

			// 🔒 检查访客二维码是否已被使用（同步等待）
			if (this.scannedParams.qrId) {
				console.log('🔍 检测到访客二维码，开始验证:', this.scannedParams.qrId);
				this.checkVisitorQrCodeUsage(this.scannedParams.qrId).then(isValid => {
					if (!isValid) {
						console.warn('🔒 二维码验证失败，已阻止页面继续加载');
						return; // 如果二维码无效，不继续执行后续逻辑
					}
					console.log('✅ 二维码验证通过，继续页面加载');
				}).catch(error => {
					console.error('❌ 二维码验证异常:', error);
				});
			}
			console.log("this.scannedParams:", JSON.stringify(this.scannedParams))
			// 🚀 重要修复：立即保存扫码信息到本地存储，防止微信授权过程中丢失
			if (this.scannedParams && (this.scannedParams.qrId || this.scannedParams.building || this.scannedParams.unit ||
				this.scannedParams.floor || this.scannedParams.room || this.scannedParams.community || this.scannedParams.phone || this.scannedParams.applyKind || this.scannedParams.butlerId || this.scannedParams.patrolId)) {

				const scannedAddressInfo = {
					applyKind: this.scannedParams.applyKind || '',
					butlerId: this.scannedParams.butlerId || '',
					patrolId: this.scannedParams.patrolId || '',
					community: this.scannedParams.community || '',
					building: this.scannedParams.building || '',
					unit: this.scannedParams.unit || '',
					floor: this.scannedParams.floor || '',
					room: this.scannedParams.room || '',
					butlerName: this.scannedParams.butlerName || '',
					butlerPhone: this.scannedParams.butlerPhone || this.scannedParams.phone || '',
					visitorPhone: this.scannedParams.phone || '',
					qrId: this.scannedParams.qrId || '',
					timestamp: Date.now(), // 添加时间戳，用于判断数据新鲜度
					source: 'qr_scan' // 标记数据来源
				};

				console.log('💾 立即保存扫码地址信息到本地存储:', scannedAddressInfo);
				uni.setStorageSync('scannedAddressInfo', scannedAddressInfo);
			}

			// 只要有任意一个参数就弹窗展示（包括巡逻员参数）
			if (this.scannedParams.phone || this.scannedParams.address || this.scannedParams.building ||
				this.scannedParams.unit || this.scannedParams.floor || this.scannedParams.room ||
				this.scannedParams.fullAddress || this.scannedParams.community || this.scannedParams.applyKind || 
				this.scannedParams.patrolId || this.scannedParams.butlerId) {
				// 保存this上下文
				const self = this;
				setTimeout(() => {
					// 🚀 根据扫码类型显示不同标题
					let msg = '';
					if (self.scannedParams.applyKind === '4' && self.scannedParams.patrolId) {
						msg = '✅ 成功解析到巡逻员信息：\n\n';
					} else if (self.scannedParams.butlerId) {
						msg = '✅ 成功解析到管家信息：\n\n';
					} else {
						msg = '✅ 成功解析到访客信息：\n\n';
					}

					// 🆕 巡逻员/管家特定信息
					if (self.scannedParams.applyKind) {
						const roleMap = {
							'1': '业主',
							'2': '管家', 
							'3': '访客',
							'4': '巡逻员'
						};
						msg += `👮 角色类型：${roleMap[self.scannedParams.applyKind] || '未知'} (${self.scannedParams.applyKind})\n`;
					}
					if (self.scannedParams.patrolId) msg += `🆔 巡逻员ID：${self.scannedParams.patrolId}\n`;
					if (self.scannedParams.butlerId) msg += `🆔 管家ID：${self.scannedParams.butlerId}\n`;

					// 基本信息
					if (self.scannedParams.butlerName) msg += `👤 管家：${self.scannedParams.butlerName}\n`;
					if (self.scannedParams.phone) msg += `📱 手机号：${self.scannedParams.phone}\n`;

					// 地址信息
					if (self.scannedParams.community) msg += `🏘️ 小区：${self.scannedParams.community}\n`;
					if (self.scannedParams.building) msg += `🏢 楼栋：${self.scannedParams.building}\n`;
					if (self.scannedParams.unit) msg += `🚪 单元：${self.scannedParams.unit}\n`;
					if (self.scannedParams.floor) msg += `🏠 楼层：${self.scannedParams.floor}\n`;
					if (self.scannedParams.room) msg += `🏡 房间：${self.scannedParams.room}\n`;
					if (self.scannedParams.fullAddress) msg += `📍 完整地址：${self.scannedParams.fullAddress}\n`;
					if (self.scannedParams.address) msg += `🏠 地址：${self.scannedParams.address}\n`;

					msg += `\n🔧 技术详情：\n`;
					msg += `• 是否来自扫码：${options.q ? '是' : '否'}\n`;
					msg += `• 解析来源：${options.q ? '二维码' : '直接参数'}\n`;

					// 显示有效参数数量
					const validParams = Object.keys(self.scannedParams).filter(key => self.scannedParams[key]);
					msg += `• 有效参数数量：${validParams.length}个\n`;
					msg += `• 参数列表：${validParams.join(', ')}\n`;

					// 🚀 根据扫码类型显示不同弹窗标题
					let title = '信息确认';
					if (self.scannedParams.applyKind === '4' && self.scannedParams.patrolId) {
						title = '巡逻员信息确认';
					} else if (self.scannedParams.butlerId) {
						title = '管家信息确认';
					} else {
						title = '访客信息确认';
					}

					uni.showModal({
						title: title,
						content: msg,
						showCancel: false,
						confirmText: '确认信息'
					});
				}, 1000); // 稍微延迟显示，确保解析详情弹窗先显示
			} else {
				// 没有参数的情况下也显示调试信息
				setTimeout(() => {
					// 当前不是业主不用显示，否则显示
					if (this.currentUserRole !== 'owner') {
						// uni.showModal({
						// 	title: '未检测到访客信息',
						// 	content: `⚠️ 未能解析到访客信息\n\n可能原因：\n• 二维码格式不正确\n• 参数名称不匹配\n• URL解码失败\n\n📋 调试信息：\n是否有q参数：${options.q ? '是' : '否'}\n参数总数：${Object.keys(options).length}`,
						// 	showCancel: false,
						// 	confirmText: '知道了'
						// });
					}

				}, 1000);
			}

			// 🆕 新增：统一角色识别和路由逻辑
			this.handleRoleIdentificationAndRouting();
		}
	},

	onShow() {
		try {
			// 🚀 重要修复：页面显示时优先恢复扫码信息
			this.restoreScannedParams();

			// 🆕 优先检查公众号授权结果（从网页授权返回）
			this.checkWechatAuthResult();

			// 页面显示时也检查一次授权状态（如果不是从微信授权返回）
			if (this.currentAuthStep === 1) {
				this.checkAuthStatus();
			}

			// 检查上次检查公众号关注状态的时间
			const lastCheckTime = uni.getStorageSync('lastSubscriptionCheckTime') || 0;
			const now = Date.now();

			// 每天最多检查一次
			if (now - lastCheckTime > 24 * 60 * 60 * 1000) {
				// 更新检查时间
				uni.setStorageSync('lastSubscriptionCheckTime', now);

				// 检查用户是否已登录但未关注公众号
				// const userInfo = uni.getStorageSync('userInfo');
				// if (userInfo && userInfo.isAuthorized && this.shouldRemindSubscription()) {
				// 	// 这里可以在适当的时机显示关注提示，比如在用户完成某个操作后
				// 	console.log('用户已登录但可能未关注公众号，可以在适当时机提醒');
				// }
			}
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
		// 🆕 安全的localStorage访问工具方法
		safeLocalStorageGet(key) {
			try {
				if (typeof localStorage !== 'undefined' && localStorage !== null) {
					return localStorage.getItem(key);
				}
				return null;
			} catch (e) {
				console.log(`[localStorage] 获取 ${key} 失败:`, e.message);
				return null;
			}
		},

		safeLocalStorageSet(key, value) {
			try {
				if (typeof localStorage !== 'undefined' && localStorage !== null) {
					localStorage.setItem(key, value);
					return true;
				}
				return false;
			} catch (e) {
				console.log(`[localStorage] 设置 ${key} 失败:`, e.message);
				return false;
			}
		},

		safeLocalStorageRemove(key) {
			try {
				if (typeof localStorage !== 'undefined' && localStorage !== null) {
					localStorage.removeItem(key);
					return true;
				}
				return false;
			} catch (e) {
				console.log(`[localStorage] 删除 ${key} 失败:`, e.message);
				return false;
			}
		},

		/**
		 * 🚀 重要修复：恢复之前保存的扫码信息到页面状态
		 */
		restoreScannedParams() {
			try {
				// 从本地存储中读取扫码信息
				const scannedAddressInfo = uni.getStorageSync('scannedAddressInfo');

				if (scannedAddressInfo && Object.keys(scannedAddressInfo).length > 0) {
					console.log('🔄 [参数恢复] 从本地存储恢复扫码信息:', scannedAddressInfo);

					// 恢复到页面状态中，优先使用保存的信息，但不覆盖已有的信息
					this.scannedParams = {
						...this.scannedParams, // 保留现有信息
						qrId: this.scannedParams.qrId || scannedAddressInfo.qrId || '',
						applyKind: this.scannedParams.applyKind || scannedAddressInfo.applyKind || '',
						butlerId: this.scannedParams.butlerId || scannedAddressInfo.butlerId || '',
						patrolId: this.scannedParams.patrolId || scannedAddressInfo.patrolId || '',
						community: this.scannedParams.community || scannedAddressInfo.community || '',
						building: this.scannedParams.building || scannedAddressInfo.building || '',
						unit: this.scannedParams.unit || scannedAddressInfo.unit || '',
						floor: this.scannedParams.floor || scannedAddressInfo.floor || '',
						room: this.scannedParams.room || scannedAddressInfo.room || '',
						butlerName: this.scannedParams.butlerName || scannedAddressInfo.butlerName || '',
						butlerPhone: this.scannedParams.butlerPhone || scannedAddressInfo.butlerPhone || '',
						phone: this.scannedParams.phone || scannedAddressInfo.visitorPhone || scannedAddressInfo.authorizedPhone || ''
					};

					console.log('✅ [参数恢复] 扫码参数已恢复到页面状态:', this.scannedParams);

					// 🆕 如果从localStorage也能读取到信息，进行对比验证
					if (typeof localStorage !== 'undefined') {
						try {
							const localStorageInfo = localStorage.getItem('scannedAddressInfo');
							if (localStorageInfo) {
								const parsedLocalInfo = JSON.parse(localStorageInfo);
								console.log('🔍 [参数恢复] 浏览器localStorage中的信息:', parsedLocalInfo);

								// 如果localStorage中的信息更新，使用最新的
								if (parsedLocalInfo.lastUpdated > (scannedAddressInfo.lastUpdated || 0)) {
									console.log('🔄 [参数恢复] localStorage中的信息更新，使用localStorage版本');
									this.scannedParams = {
										...this.scannedParams,
										qrId: this.scannedParams.qrId || parsedLocalInfo.qrId || '',
										applyKind: this.scannedParams.applyKind || parsedLocalInfo.applyKind || '',
										butlerId: this.scannedParams.butlerId || parsedLocalInfo.butlerId || '',
										patrolId: this.scannedParams.patrolId || parsedLocalInfo.patrolId || '',
										community: this.scannedParams.community || parsedLocalInfo.community || '',
										building: this.scannedParams.building || parsedLocalInfo.building || '',
										unit: this.scannedParams.unit || parsedLocalInfo.unit || '',
										floor: this.scannedParams.floor || parsedLocalInfo.floor || '',
										room: this.scannedParams.room || parsedLocalInfo.room || '',
										butlerName: this.scannedParams.butlerName || parsedLocalInfo.butlerName || '',
										butlerPhone: this.scannedParams.butlerPhone || parsedLocalInfo.butlerPhone || '',
										phone: this.scannedParams.phone || parsedLocalInfo.visitorPhone || parsedLocalInfo.authorizedPhone || ''
									};
								}
							}
						} catch (e) {
							console.log('⚠️ [参数恢复] 读取localStorage失败:', e.message);
						}
					}
				} else {
					console.log('ℹ️ [参数恢复] 本地存储中没有扫码信息，无需恢复');
				}
			} catch (error) {
				console.error('❌ [参数恢复] 恢复扫码信息时发生错误:', error);
			}
		},

		/**
		 * 🆕 安全解码URL编码的字符串（支持多次编码）
		 */
		safeDecodeURIComponent(str) {
			if (!str) return '';
			
			try {
				let decoded = str;
				let previousDecoded = '';
				
				// 最多解码5次，防止死循环
				for (let i = 0; i < 5; i++) {
					previousDecoded = decoded;
					try {
						decoded = decodeURIComponent(decoded);
					} catch (e) {
						// 如果解码失败，返回上一次成功解码的结果
						break;
					}
					
					// 如果解码后的字符串没有变化，说明已经完全解码
					if (decoded === previousDecoded) {
						break;
					}
				}
				
				console.log('🔍 [安全解码] 原始:', str, '→ 解码后:', decoded);
				return decoded;
			} catch (e) {
				console.warn('⚠️ [安全解码] 解码失败，返回原始字符串:', e);
				return str;
			}
		},

		/**
		 * 🆕 处理来自webview的用户信息参数
		 */
		handleWechatAuthParams(options) {
			try {
				console.log('📱 [参数处理] 接收到的URL参数:', options);


				// 检查是否有授权成功标记
				if (options.authSuccess === 'true') {
					console.log('✅ [参数处理] 检测到授权成功标记');

					// 构造用户信息对象
					const userInfo = {
						openid: options.openid || '',
						nickname: this.safeDecodeURIComponent(options.nickname || ''),
						sex: parseInt(options.sex) || 0,
						city: this.safeDecodeURIComponent(options.city || ''),
						province: this.safeDecodeURIComponent(options.province || ''),
						country: this.safeDecodeURIComponent(options.country || ''),
						headimgurl: this.safeDecodeURIComponent(options.headimgurl || ''),
						unionid: options.unionid || ''
					};

					console.log('📱 [参数处理] 从URL参数构造的用户信息:', userInfo);

					// 如果有有效的用户信息，保存并处理
					if (userInfo.openid && userInfo.nickname) {
						console.log('📱 [参数处理] 用户信息有效，开始保存和处理');

						// 🆕 显示用户信息验证成功的调试信息
						uni.showToast({
							title: `获取到用户：${userInfo.nickname}`,
							icon: 'success',
							duration: 3000
						});

						// 保存到本地存储
						uni.setStorageSync('wechat_auth_result', JSON.stringify({
							success: true,
							userInfo: userInfo,
							timestamp: parseInt(options.timestamp) || Date.now()
						}));

						// 立即处理授权成功
						this.handleWechatAuthSuccess(userInfo);
					} else {
						console.warn('⚠️ [参数处理] 用户信息不完整，openid或nickname缺失');

						// 🆕 显示用户信息验证失败的调试信息
						uni.showModal({
							title: '用户信息不完整',
							content: `openid: ${userInfo.openid || '空'}\nnickname: ${userInfo.nickname || '空'}`,
							showCancel: false,
							confirmText: '知道了'
						});
					}
				} else {
					console.log('📱 [参数处理] 未检测到授权成功标记');
				}
			} catch (error) {
				console.error('❌ [参数处理] 处理URL参数失败:', error);
			}
		},

		/**
		 * 🆕 检查公众号授权结果
		 */
		checkWechatAuthResult() {
			try {
				// 🚀 重要修复：首先恢复扫码信息到当前页面状态
				this.restoreScannedParams();

				// 🆕 优先从小程序存储获取授权结果
				let authResult = uni.getStorageSync('wechat_auth_result')

				// 🆕 如果小程序存储中没有，尝试从网页localStorage获取（通过webview）
				if (!authResult) {
					try {
						const webviewResult = this.safeLocalStorageGet('wechat_auth_result');
						if (webviewResult) {
							authResult = JSON.parse(webviewResult);
							console.log('📱 [公众号授权] 从webview localStorage获取到授权结果:', authResult);
						} else {
							console.log('📱 [公众号授权] webview localStorage中没有授权结果');

							// 🆕 尝试从其他存储键获取用户信息作为备选方案
							const wechatUserInfo = this.safeLocalStorageGet('wechat_user_info');
							if (wechatUserInfo) {
								try {
									const userInfo = JSON.parse(wechatUserInfo);
									console.log('📱 [公众号授权] 从webview localStorage获取到用户信息:', userInfo);
									// 构造一个成功的授权结果
									authResult = {
										success: true,
										userInfo: userInfo,
										timestamp: Date.now()
									};
								} catch (parseError) {
									console.log('📱 [公众号授权] 解析webview用户信息失败:', parseError.message);
								}
							}
						}
					} catch (e) {
						console.log('📱 [公众号授权] 无法从webview localStorage获取结果:', e.message);
					}
				}
				console.log("authResult", authResult)
		// 将authResult 转换为json（只在它是字符串时才解析）
		if (typeof authResult === 'string' && authResult.trim() !== '') {
			try {
				authResult = JSON.parse(authResult);
			} catch (e) {
				console.error('❌ [公众号授权] 解析授权结果失败:', e);
				authResult = null;
			}
		} else if (typeof authResult === 'string' && authResult.trim() === '') {
			// 空字符串视为无授权结果
			authResult = null;
		}
			if (authResult) {
				console.log('🔍 [公众号授权] 找到有效的授权结果:', authResult);

				// 清除结果，避免重复处理
				uni.removeStorageSync('wechat_auth_result')
				this.safeLocalStorageRemove('wechat_auth_result');

				if (authResult.success) {
					console.log('✅ [公众号授权] 检测到授权成功结果:', authResult.userInfo)
					this.handleWechatAuthSuccess(authResult.userInfo)
				} else {
					console.error('❌ [公众号授权] 检测到授权失败结果:', authResult.error)
					this.handleWechatAuthError({ message: authResult.error })
				}
			}
			} catch (error) {
				console.error('❌ [公众号授权] 检查授权结果失败:', error)
			}	
		},

		/**
		 * 🆕 开始微信公众号授权
		 */
		async startWechatAuth() {
			console.log('🚀 [公众号授权] 开始授权流程')

			try {
				// 🆕 直接跳转到 direct-auth.vue，不传递参数
				uni.navigateTo({
					url: `/pages/webview/direct-auth`,
					success: () => {
						console.log('✅ [公众号授权] 成功跳转到授权页面')
					},
					fail: (error) => {
						console.error('❌ [公众号授权] 跳转授权页面失败:', error)
						throw new Error('无法打开授权页面')
					}
				})

			} catch (error) {
				console.error('❌ [公众号授权] 跳转失败:', error)
				throw error
			}
		},



		/**
		 * 🆕 处理公众号授权完成回调
		 */
		handleWechatAuthSuccess(userInfo) {
			try {
				console.log('✅ [公众号授权] 授权成功，用户信息:', userInfo)

				this.wechatUserInfo = userInfo
				this.currentAuthStep = 2
				this.wechatAuthLoading = false

				// 显示成功提示
				uni.showToast({
					title: `欢迎，${userInfo.nickname || '用户'}！`,
					icon: 'success',
					duration: 2000
				})

				// 提示用户继续第二步
				setTimeout(() => {
					uni.showToast({
						title: '请继续授权手机号',
						icon: 'none',
						duration: 2000
					})
				}, 2500)

			} catch (error) {
				console.error('❌ [公众号授权] 处理授权结果失败:', error)
				this.handleWechatAuthError(error)
			}
		},

		/**
		 * 🆕 处理公众号授权错误
		 */
		handleWechatAuthError(error) {
			this.wechatAuthLoading = false

			const errorMessage = error.message || '公众号授权失败'

			uni.showModal({
				title: '授权失败',
				content: `${errorMessage}\n\n您可以：\n• 重新尝试授权\n• 跳过此步骤（部分功能可能受限）`,
				showCancel: true,
				cancelText: '重新尝试',
				confirmText: '跳过此步骤',
				success: (res) => {
					if (res.cancel) {
						// 重新尝试
						this.startWechatAuth()
					} else {
						// 跳过，直接进入手机号授权
						this.currentAuthStep = 2
						uni.showToast({
							title: '已跳过信息获取',
							icon: 'none',
							duration: 2000
						})
					}
				}
			})
		},

		/**
		 * 🆕 统一角色识别和路由处理
		 */
		async handleRoleIdentificationAndRouting() {
			const startTime = Date.now();
			try {
				// 检查是否有applyKind参数
				if (this.scannedParams.applyKind) {
					console.log('🔍 [角色识别] 检测到applyKind参数:', this.scannedParams.applyKind);

					switch (this.scannedParams.applyKind) {
						case '2': // 访客邀请
							console.log('👥 [角色识别] 识别为访客邀请');
							console.log('🚀 [角色识别] 跳转到访客申请页面: /pages/auth/visitor-apply');
							uni.redirectTo({
								url: '/pages/auth/visitor-apply'
							});
							return;

						case '3': // 管家身份验证
							console.log('👨‍💼 [角色识别] 识别为管家身份验证');
							console.log('🔄 [角色识别] 调用管家验证处理方法');
							await this.handleManagerQrCode();
							return;

						case '4': // 巡逻员身份验证
							console.log('👮‍♂️ [角色识别] 识别为巡逻员身份验证');
							console.log('🔄 [角色识别] 调用巡逻员验证处理方法');
							await this.handlePatrolQrCode();
							return;

						default:
							console.warn('❓ [角色识别] 未知的applyKind值:', this.scannedParams.applyKind);
							console.log('🔄 [角色识别] 继续检查其他参数...');
					}
				} else {
					console.log('ℹ️ [角色识别] 未检测到applyKind参数，检查其他标识');
				}

				// 兼容现有type参数（向后兼容）
				if (this.scannedParams.type === 'visitor_invite') {
					console.log('👥 [角色识别] 检测到type=visitor_invite（兼容模式）');
					console.log('🚀 [角色识别] 跳转到访客申请页面: /pages/auth/visitor-apply');
					uni.redirectTo({
						url: '/pages/auth/visitor-apply'
					});
					return;
				}

				// 如果没有二维码参数，继续原有的业主查询流程
				console.log('🏠 [角色识别] 无二维码特殊参数，继续业主身份验证流程');
				console.log('📋 [角色识别] 将使用传统的五层数据库查询机制');

			} catch (error) {
				const duration = Date.now() - startTime;
				console.error(`❌ [角色识别] 角色识别失败 (耗时: ${duration}ms):`, error);
				console.error('❌ [角色识别] 错误详情:', {
					name: error.name,
					message: error.message,
					stack: error.stack,
					scannedParams: this.scannedParams
				});
				console.log('🔄 [角色识别] 发生错误，继续原有业主验证流程');
			} finally {
				const duration = Date.now() - startTime;
				console.log(`⏱️ [角色识别] 角色识别流程结束，总耗时: ${duration}ms`);
				console.log('🎯 [角色识别] ==================== 角色识别流程结束 ====================');
			}
		},

		// 🆕 新增：管家身份验证处理
		async handleManagerQrCode() {
			const startTime = Date.now();
			try {
				console.log('👨‍💼 [管家验证] ==================== 开始管家身份验证 ====================');
				console.log('⏰ [管家验证] 开始时间:', new Date().toISOString());

				// 首先需要用户进行微信授权获取手机号
				const userInfo = uni.getStorageSync('userInfo');
				let userPhone = userInfo?.phone;

				console.log('📋 [管家验证] 当前用户信息:', {
					hasUserInfo: !!userInfo,
					hasPhone: !!userPhone,
					phone: userPhone ? userPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '无'
				});

				// 如果没有手机号，需要先进行授权
				if (!userPhone) {
					console.warn('⚠️ [管家验证] 用户未授权手机号，需要先进行授权');
					uni.showModal({
						title: '需要授权验证',
						content: '扫描管家二维码需要验证您的身份，请先完成授权获取手机号',
						showCancel: true,
						cancelText: '取消',
						confirmText: '立即授权',
						success: (res) => {
							if (res.confirm) {
								console.log('✅ [管家验证] 用户选择进行授权验证');
								// 这里不直接跳转，而是让用户点击授权按钮
							} else {
								console.log('❌ [管家验证] 用户取消授权，无法验证身份');
								uni.showToast({
									title: '无法验证管家身份',
									icon: 'none',
									duration: 2000
								});
							}
						}
					});
					return;
				}

				// 如果有手机号，进行管家身份验证
				console.log('🔍 [管家验证] 开始验证管家身份，手机号:', userPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'));

				// 从二维码参数中获取管家ID（需要从URL中解析）
				const butlerId = this.extractButlerIdFromParams();

				console.log('📋 [管家验证] 提取的管家ID:', butlerId);

				if (!butlerId) {
					console.error('❌ [管家验证] 无法从二维码中获取管家ID');
					uni.showModal({
						title: '二维码错误',
						content: '无法从二维码中获取管家信息，请确认二维码是否正确',
						showCancel: false
					});
					return;
				}

				console.log('🚀 [管家验证] 准备调用后端验证接口');
				console.log('📋 [管家验证] 验证参数详情:', {
					butlerId: butlerId,
					userPhone: userPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
					fullParams: this.scannedParams
				});

				// 调用后端验证接口
				const verifyResult = await this.verifyManagerRole(butlerId, userPhone);

				console.log('📋 [管家验证] 后端验证结果:', {
					verified: verifyResult.verified,
					managerName: verifyResult.managerName,
					hasManagerData: !!verifyResult.managerData
				});

				if (verifyResult.verified) {
					console.log('✅ [管家验证] 身份验证成功，准备跳转到管家工作台');
					// 验证通过，设置管家角色并跳转
					uni.showModal({
						title: '✅ 管家身份验证成功',
						content: `欢迎，${verifyResult.managerName}管家！\n即将进入管家工作台`,
						showCancel: false,
						confirmText: '进入工作台',
						success: () => {
							// 设置管家角色信息
							const managerInfo = {
								...userInfo,
								role: 'manager',
								roleText: '管家',
								managerData: verifyResult.managerData
							};

							console.log('💾 [管家验证] 保存管家角色信息到本地存储');
							uni.setStorageSync('userInfo', managerInfo);

							console.log('🚀 [管家验证] 跳转到管家工作台: /pages/manager/dashboard');
							// 跳转到管家工作台
							uni.switchTab({
								url: '/pages/manager/dashboard'
							});
						}
					});
				} else {
					console.error('❌ [管家验证] 身份验证失败:', verifyResult.message);
					console.error('❌ [管家验证] 原始错误信息:', verifyResult.originalError);
					console.error('❌ [管家验证] 错误代码:', verifyResult.errorCode);

					// 🔧 验证失败 - 显示详细的错误信息给用户
					const title = '❌ 管家身份验证失败';
					const content = verifyResult.message || '您不是该管家，无法使用此管家二维码';

					uni.showModal({
						title: title,
						content: content,
						showCancel: true,
						cancelText: '我知道了',
						confirmText: '联系管理员',
						success: (res) => {
							if (res.confirm) {
								// 用户选择联系管理员，显示更多帮助信息
								uni.showModal({
									title: '🔧 解决方案',
									content: '请通过以下方式解决：\n\n1️⃣ 确认管家身份\n• 确认您是该小区的管家\n• 检查您的手机号是否正确\n\n2️⃣ 联系管理员\n• 联系物业管理员\n• 更新管家信息\n• 重新绑定手机号\n\n3️⃣ 技术支持\n• 如果问题持续存在\n• 请提供错误信息给技术人员',
									showCancel: false,
									confirmText: '知道了'
								});
							}
						}
					});
					return; // 🔧 验证失败时正确结束函数执行
				}

			} catch (error) {
				const duration = Date.now() - startTime;
				console.error(`❌ [管家验证] 管家身份验证异常 (耗时: ${duration}ms):`, error);
				console.error('❌ [管家验证] 错误详情:', {
					name: error.name,
					message: error.message,
					stack: error.stack
				});

				// 🔧 网络异常或其他错误的友好处理
				let errorTitle = '验证失败';
				let errorContent = '管家身份验证过程中发生错误，请重试或联系管理员';

				if (error.message && error.message.includes('网络')) {
					errorTitle = '网络连接异常';
					errorContent = '网络连接不稳定，无法完成身份验证。\n\n请检查：\n• 网络连接是否正常\n• 信号是否稳定\n• 稍后重试';
				} else if (error.message && error.message.includes('timeout')) {
					errorTitle = '请求超时';
					errorContent = '验证请求超时，可能是网络延迟或服务器繁忙。\n\n建议：\n• 检查网络连接\n• 稍后重试\n• 联系技术支持';
				}

				uni.showModal({
					title: errorTitle,
					content: errorContent,
					showCancel: true,
					cancelText: '稍后重试',
					confirmText: '联系管理员',
					success: (res) => {
						if (res.confirm) {
							// 显示联系管理员的具体方式
							uni.showModal({
								title: '联系管理员',
								content: '请通过以下方式联系：\n\n📞 联系方式\n• 物业管理处\n• 停车场管理员\n• 技术支持热线\n\n📧 问题反馈\n• 描述具体错误情况\n• 提供手机号后四位\n• 说明验证时间',
								showCancel: false,
								confirmText: '知道了'
							});
						}
					}
				});
			} finally {
				const duration = Date.now() - startTime;
				console.log(`⏱️ [管家验证] 管家验证流程结束，总耗时: ${duration}ms`);
				console.log('👨‍💼 [管家验证] ==================== 管家身份验证结束 ====================');
			}
		},

		// 🆕 新增：从参数中提取管家ID
		extractButlerIdFromParams() {
			// 从scannedParams中获取butlerId
			if (this.scannedParams.butlerId) {
				return this.scannedParams.butlerId;
			}

			// 如果没有直接的butlerId，尝试从其他可能的参数名获取
			const possibleKeys = ['butlerId', 'butler_id', 'managerId', 'manager_id', 'id'];
			for (const key of possibleKeys) {
				if (this.scannedParams[key]) {
					return this.scannedParams[key];
				}
			}

			console.warn('⚠️ 无法从参数中提取管家ID:', this.scannedParams);
			return null;
		},

		// 🆕 新增：验证管家角色的后端接口调用
		async verifyManagerRole(butlerId, userPhone) {
			const startTime = Date.now();
			try {
				console.log('🚀 [管家验证] 开始验证管家身份');
				console.log('📋 [管家验证] 请求参数:', {
					butlerId: butlerId,
					userPhone: userPhone,
					applyKind: '3',
					timestamp: new Date().toISOString()
				});

				const requestData = {
					applyKind: '3',
					targetId: butlerId,
					userPhone: userPhone
				};

				console.log('🌐 [管家验证] 发送请求到:', 'https://www.xuerparking.cn:8543/parking/role/verifyByQrCode');
				console.log('📤 [管家验证] 请求数据:', JSON.stringify(requestData, null, 2));

				const response = await uni.request({
					url: 'https://www.xuerparking.cn:8543/parking/role/verifyByQrCode',
					method: 'POST',
					data: requestData,
					header: {
						'content-type': 'application/json'
					}
				});

				const duration = Date.now() - startTime;
				// console.log(`⏱️ [管家验证] 请求耗时: ${duration}ms`);
				// console.log('📥 [管家验证] 响应状态码:', response.statusCode);
				// console.log('📋 [管家验证] 完整响应数据:', JSON.stringify(response.data, null, 2));

				if (response.statusCode !== 200) {
					console.error('❌ [管家验证] HTTP状态码异常:', response.statusCode);
					return {
						verified: false,
						message: `服务器响应异常 (状态码: ${response.statusCode})`
					};
				}

				if (response.data && response.data.code === "0") {
					// 🆕 修复：检查三层嵌套的data结构
					let verified = false;
					let userData = null;
					let message = '';
					let managerName = '管家';

					// 检查第三层 data（实际的验证数据在这里）
					if (response.data.data && response.data.data.data) {
						const innerData = response.data.data.data;
						console.log('📋 [管家验证] 检查第三层data.verified:', innerData.verified);
						console.log('📋 [管家验证] 检查第三层data.managerData:', innerData.managerData);

						if (innerData.verified !== undefined) {
							verified = innerData.verified === true || innerData.verified === 'true' || innerData.verified === 1;
							userData = innerData.managerData;
							managerName = innerData.managerName || innerData.managerData?.username || '管家';
							message = response.data.data.msg || '验证成功';
							console.log('✅ [管家验证] 使用第三层数据结构: response.data.data.data.verified');
						}
					}

					// 兼容其他可能的数据结构
					if (!verified) {
						// 检查第二层 data
						if (response.data.data) {
							if (response.data.data.verified !== undefined) {
								verified = response.data.data.verified === true || response.data.data.verified === 'true' || response.data.data.verified === 1;
								userData = response.data.data.userData || response.data.data.managerData;
								message = response.data.data.message || response.data.data.msg;
								console.log('📋 [管家验证] 使用第二层数据结构: response.data.data.verified');
							}
						}

						// 检查第一层 data
						if (!verified && response.data.verified !== undefined) {
							verified = response.data.verified === true || response.data.verified === 'true' || response.data.verified === 1;
							userData = response.data.userData || response.data.managerData;
							message = response.data.message || response.data.msg;
							console.log('📋 [管家验证] 使用第一层数据结构: response.data.verified');
						}
					}

					const result = {
						verified: verified,
						managerName: managerName,
						managerData: userData,
						message: message
					};

					console.log('✅ [管家验证] 最终解析结果:', {
						verified: result.verified,
						managerName: result.managerName,
						message: result.message,
						hasManagerData: !!result.managerData
					});

					return result;
				} else {
					// 🆕 优化错误处理：详细处理后端错误信息
					const errorCode = response.data?.code;
					const errorMsg = response.data?.msg || response.data?.message || '验证失败';
					const errorData = response.data?.data || {};

					console.error('❌ [管家验证] 后端返回错误状态:', {
						code: errorCode,
						message: errorMsg,
						errorData: errorData,
						fullResponse: response.data
					});

					// 🔧 根据后端返回的具体错误信息，提供精确的用户提示
					let userFriendlyMessage = errorMsg;
					let detailedInfo = '';

					// 检查后端返回的data中的详细错误信息
					if (errorData.errorCode) {
						switch (errorData.errorCode) {
							case 'MANAGER_NOT_FOUND':
								userFriendlyMessage = '管家不存在';
								detailedInfo = errorData.message || '二维码中的管家信息不存在，请确认二维码是否正确';
								break;
							case 'PHONE_MISMATCH':
								userFriendlyMessage = '手机号不匹配';
								detailedInfo = errorData.message || '您的手机号与该管家信息不匹配，请确认您是否为该管家';
								// 添加更多调试信息
								if (errorData.managerName) {
									detailedInfo += `\n\n管家姓名：${errorData.managerName}`;
								}
								if (errorData.expectedPhone && errorData.actualPhone) {
									detailedInfo += `\n期望手机号：${errorData.expectedPhone}\n您的手机号：${errorData.actualPhone}`;
								}
								break;
							default:
								userFriendlyMessage = errorData.message || errorMsg;
								break;
						}
					} else {
						// 兼容旧的错误处理方式
						if (errorMsg.includes('手机号不匹配') || errorMsg.includes('管家不存在')) {
							userFriendlyMessage = '身份验证失败：您的手机号与该管家信息不匹配。\n\n可能原因：\n• 您不是该管家\n• 管家信息已更新\n• 二维码信息错误\n\n请确认您是否为该管家，或联系管理员确认您的管家身份。';
						} else if (errorMsg.includes('参数')) {
							userFriendlyMessage = '验证参数错误，请重新扫描二维码或联系管理员。';
						} else if (errorMsg.includes('权限')) {
							userFriendlyMessage = '您没有管家权限，无法使用此功能。';
						} else if (errorMsg.includes('系统')) {
							userFriendlyMessage = '系统验证失败，请稍后重试或联系技术支持。';
						}
					}

					return {
						verified: false,
						message: detailedInfo || userFriendlyMessage,
						originalError: errorMsg,
						errorCode: errorData.errorCode || errorCode,
						errorData: errorData
					};
				}

			} catch (error) {
				const duration = Date.now() - startTime;
				console.error(`❌ [管家验证] 请求异常 (耗时: ${duration}ms):`, error);
				console.error('❌ [管家验证] 错误详情:', {
					name: error.name,
					message: error.message,
					stack: error.stack
				});

				return {
					verified: false,
					message: '网络错误，请检查网络连接后重试'
				};
			}
		},

		// 🆕 新增：巡逻员身份验证处理
		async handlePatrolQrCode() {
			try {
				// 首先需要用户进行微信授权获取手机号
				const userInfo = uni.getStorageSync('userInfo');
				let userPhone = userInfo?.phone;

				// 如果没有手机号，需要先进行授权
				if (!userPhone) {
					uni.showModal({
						title: '需要授权验证',
						content: '扫描巡逻员二维码需要验证您的身份，请先完成授权获取手机号',
						showCancel: true,
						cancelText: '取消',
						confirmText: '立即授权',
						success: (res) => {
							if (res.confirm) {
								// 用户选择授权，继续原有的授权流程
								console.log('用户选择进行授权验证');
								// 这里不直接跳转，而是让用户点击授权按钮
							} else {
								// 用户取消，提示无法验证身份
								uni.showToast({
									title: '无法验证巡逻员身份',
									icon: 'none',
									duration: 2000
								});
							}
						}
					});
					return;
				}

				// 如果有手机号，进行巡逻员身份验证
				console.log('🔍 开始验证巡逻员身份，手机号:', userPhone);

				// 从二维码参数中获取巡逻员ID
				const patrolId = this.extractPatrolIdFromParams();

				if (!patrolId) {
					uni.showModal({
						title: '二维码错误',
						content: '无法从二维码中获取巡逻员信息，请确认二维码是否正确',
						showCancel: false
					});
					return;
				}

				// 调用后端验证接口
				const verifyResult = await this.verifyPatrolRole(patrolId, userPhone);

				if (verifyResult.verified) {
					// 验证通过，设置巡逻员角色并跳转
					uni.showModal({
						title: '✅ 巡逻员身份验证成功',
						content: `欢迎，${verifyResult.patrolName}巡逻员！\n即将进入巡逻员工作台`,
						showCancel: false,
						confirmText: '进入工作台',
						success: () => {
							// 设置巡逻员角色信息
							const patrolInfo = {
								...userInfo,
								role: 'patrol',
								roleText: '巡逻员',
								patrolData: verifyResult.patrolData,
								// 🆕 添加小区名称，从管家信息中提取
								yardName: verifyResult.patrolData?.managerInfo?.community || verifyResult.patrolData?.community,
								userName: verifyResult.patrolName || verifyResult.patrolData?.username || '巡逻员'
							};

							// 💾 存储用户信息到多个键中，确保兼容性
							uni.setStorageSync('userInfo', patrolInfo);
							uni.setStorageSync('patrolInfo', patrolInfo);
							uni.setStorageSync('loginInfo', patrolInfo);
							uni.setStorageSync('user', patrolInfo);

							// 🏠 单独存储管家信息，方便智能搜索使用
							if (verifyResult.patrolData?.managerInfo) {
								uni.setStorageSync('managerInfo', verifyResult.patrolData.managerInfo);
								console.log('💾 [存储管家信息] 管家信息已保存到本地存储:', verifyResult.patrolData.managerInfo);
							}

							// 🏢 存储小区信息
							const communityInfo = {
								name: verifyResult.patrolData?.managerInfo?.community || '',
								province: verifyResult.patrolData?.managerInfo?.province || '',
								city: verifyResult.patrolData?.managerInfo?.city || '',
								district: verifyResult.patrolData?.managerInfo?.district || ''
							};
							uni.setStorageSync('communityInfo', communityInfo);

							console.log('✅ [用户信息存储] 巡逻员信息已保存到所有存储键');
							console.log('📋 [用户信息存储] 存储的信息包含小区名称:', patrolInfo.yardName);
							console.log('📋 [用户信息存储] 存储的用户名称:', patrolInfo.userName);

							// 🆕 修复：直接跳转到违章记录页面，而不是通过 navigateToHome
							console.log('🚀 [巡逻员跳转] 直接跳转到违章记录页面');
							uni.redirectTo({
								url: '/pagesE/violation/violation',
								success: () => {
									console.log('✅ 巡逻员页面跳转成功');
								},
								fail: (err) => {
									console.error('❌ 巡逻员页面跳转失败:', err);
									// 跳转失败时，尝试使用 reLaunch
									uni.reLaunch({
										url: '/pagesE/violation/violation'
									});
								}
							});
						}
					});
				} else {
					console.error('❌ [巡逻员验证] 身份验证失败:', verifyResult.message);
					console.error('❌ [巡逻员验证] 原始错误信息:', verifyResult.originalError);
					console.error('❌ [巡逻员验证] 错误代码:', verifyResult.errorCode);

					// 🔧 验证失败 - 显示详细的错误信息给用户
					const title = '❌ 巡逻员身份验证失败';
					const content = verifyResult.message || '您不是该巡逻员，无法使用此巡逻员二维码';

					uni.showModal({
						title: title,
						content: content,
						showCancel: true,
						cancelText: '我知道了',
						confirmText: '联系管理员',
						success: (res) => {
							if (res.confirm) {
								// 用户选择联系管理员，显示更多帮助信息
								uni.showModal({
									title: '🔧 解决方案',
									content: '请通过以下方式解决：\n\n1️⃣ 确认巡逻员身份\n• 确认您是该小区的巡逻员\n• 检查您的手机号是否正确\n\n2️⃣ 联系管理员\n• 联系物业管理员\n• 更新巡逻员信息\n• 重新绑定手机号\n\n3️⃣ 技术支持\n• 如果问题持续存在\n• 请提供错误信息给技术人员',
									showCancel: false,
									confirmText: '知道了'
								});
							}
						}
					});
				}

			} catch (error) {
				console.error('❌ 巡逻员身份验证异常:', error);

				// 🔧 网络异常或其他错误的友好处理
				let errorTitle = '验证失败';
				let errorContent = '巡逻员身份验证过程中发生错误，请重试或联系管理员';

				if (error.message && error.message.includes('网络')) {
					errorTitle = '网络连接异常';
					errorContent = '网络连接不稳定，无法完成身份验证。\n\n请检查：\n• 网络连接是否正常\n• 信号是否稳定\n• 稍后重试';
				} else if (error.message && error.message.includes('timeout')) {
					errorTitle = '请求超时';
					errorContent = '验证请求超时，可能是网络延迟或服务器繁忙。\n\n建议：\n• 检查网络连接\n• 稍后重试\n• 联系技术支持';
				}

				uni.showModal({
					title: errorTitle,
					content: errorContent,
					showCancel: true,
					cancelText: '稍后重试',
					confirmText: '联系管理员',
					success: (res) => {
						if (res.confirm) {
							// 显示联系管理员的具体方式
							uni.showModal({
								title: '联系管理员',
								content: '请通过以下方式联系：\n\n📞 联系方式\n• 物业管理处\n• 停车场管理员\n• 技术支持热线\n\n📧 问题反馈\n• 描述具体错误情况\n• 提供手机号后四位\n• 说明验证时间',
								showCancel: false,
								confirmText: '知道了'
							});
						}
					}
				});
			}
		},

		// 🆕 新增：管家身份验证流程
		async handleManagerAuthFlow(code, encryptedData, iv) {
			try {
				console.log('👨‍💼 [管家验证流程] 开始管家身份验证流程');

				// 第一步：获取手机号（调用普通授权接口，但只使用手机号信息）
				const phoneResult = await this.callAuthAPI({
					code,
					encryptedData,
					iv,
					parkName: ''
				});
				console.log("phoneResult:",JSON.stringify(phoneResult))
				if (phoneResult.code !== "0") {
					throw new Error(phoneResult.msg || '获取手机号失败');
				}

				const userPhone = phoneResult.data.phone;
				console.log('📱 [管家验证流程] 获取到手机号:', userPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'));
				console.log('🔄 [管家验证流程] 忽略后端返回的角色信息，使用二维码识别的管家角色');

				// 第二步：验证管家身份
				const butlerId = this.extractButlerIdFromParams();
				if (!butlerId) {
					throw new Error('无法从二维码中获取管家ID');
				}

				const verifyResult = await this.verifyManagerRole(butlerId, userPhone);

				if (!verifyResult.verified) {
					throw new Error(verifyResult.message || '管家身份验证失败');
				}

				// 第三步：构建管家用户信息
				console.log('✅ [管家验证流程] 管家身份验证成功，构建用户信息');
				return {
					phone: userPhone,
					role: 'manager',
					roleText: '管家',
					userInfo: {
						id: verifyResult.managerData?.id || Date.now(),
						username: verifyResult.managerName,
						phone: userPhone,
						managerData: verifyResult.managerData
					},
					permissions: ['appointment.create', 'appointment.query.all', 'violation.add', 'violation.manage', 'audit.process'],
					source: 'qr_code_manager_verification'
				};

			} catch (error) {
				console.error('❌ [管家验证流程] 管家身份验证流程失败:', error);
				throw error;
			}
		},

		// 🆕 新增：巡逻员身份验证流程
		async handlePatrolAuthFlow(code, encryptedData, iv) {
			try {
				console.log('👮‍♂️ [巡逻员验证流程] 开始巡逻员身份验证流程');

				// 第一步：获取手机号（调用普通授权接口，但只使用手机号信息）
				const phoneResult = await this.callAuthAPI({
					code,
					encryptedData,
					iv,
					parkName: ''
				});

				if (phoneResult.code !== "0") {
					console.error('❌ [巡逻员验证] 获取手机号失败:', phoneResult.msg);
					uni.showModal({
						title: '获取手机号失败',
						content: phoneResult.msg || '无法获取您的手机号信息，请重试',
						showCancel: false,
						confirmText: '我知道了'
					});
					return; // 🔧 获取手机号失败时正确结束函数执行
				}
				console.log("phoneResult:",JSON.stringify(phoneResult))
				const userPhone = phoneResult.data.phone;
				console.log('📱 [巡逻员验证流程] 获取到手机号:', userPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'));
				console.log('🔄 [巡逻员验证流程] 忽略后端返回的角色信息，使用二维码识别的巡逻员角色');

				// 第二步：验证巡逻员身份
				const patrolId = this.extractPatrolIdFromParams();
				if (!patrolId) {
					console.error('❌ [巡逻员验证] 无法从二维码中获取巡逻员ID');
					uni.showModal({
						title: '二维码格式错误',
						content: '无法从二维码中获取巡逻员信息，请确认扫描的是正确的巡逻员二维码',
						showCancel: false,
						confirmText: '我知道了'
					});
					return; // 🔧 二维码解析失败时正确结束函数执行
				}

				const verifyResult = await this.verifyPatrolRole(patrolId, userPhone);

				if (!verifyResult.verified) {
					console.error('❌ [巡逻员验证] 身份验证失败:', verifyResult.message);
					console.error('❌ [巡逻员验证] 原始错误信息:', verifyResult.originalError);
					console.error('❌ [巡逻员验证] 错误代码:', verifyResult.errorCode);

					// 🔧 验证失败 - 显示详细的错误信息给用户
					const title = '❌ 巡逻员身份验证失败';
					const content = verifyResult.message || '您不是该巡逻员，无法使用此巡逻员二维码';

					uni.showModal({
						title: title,
						content: content,
						showCancel: true,
						cancelText: '我知道了',
						confirmText: '联系管理员',
						success: (res) => {
							if (res.confirm) {
								// 用户选择联系管理员，显示更多帮助信息
								uni.showModal({
									title: '🔧 解决方案',
									content: '请通过以下方式解决：\n\n1️⃣ 确认巡逻员身份\n• 确认您是该小区的巡逻员\n• 检查您的手机号是否正确\n\n2️⃣ 联系管理员\n• 联系物业管理员\n• 更新巡逻员信息\n• 重新绑定手机号\n\n3️⃣ 技术支持\n• 如果问题持续存在\n• 请提供错误信息给技术人员',
									showCancel: false,
									confirmText: '知道了'
								});
							}
						}
					});

					// 🔧 验证失败时抛出错误，阻止后续流程继续执行
					throw new Error(verifyResult.message || '巡逻员身份验证失败');
				}

				// 第三步：构建巡逻员用户信息
				console.log('✅ [巡逻员验证流程] 巡逻员身份验证成功，构建用户信息');
				return {
					phone: userPhone,
					role: 'patrol',
					roleText: '巡逻员',
					// 🆕 添加小区名称和用户名称，方便智能搜索使用
					yardName: verifyResult.patrolData?.managerInfo?.community || verifyResult.patrolData?.community || '',
					userName: verifyResult.patrolName || verifyResult.patrolData?.username || '巡逻员',
					userInfo: {
						id: verifyResult.patrolData?.id || Date.now(),
						username: verifyResult.patrolName,
						phone: userPhone,
						patrolData: verifyResult.patrolData,
						// 🏠 包含管家相关信息
						managerInfo: verifyResult.patrolData?.managerInfo,
						community: verifyResult.patrolData?.managerInfo?.community || '',
						yardName: verifyResult.patrolData?.managerInfo?.community || ''
					},
					permissions: ['violation.add', 'violation.query', 'violation.manage'],
					source: 'qr_code_patrol_verification'
				};

			} catch (error) {
				console.error('❌ [巡逻员验证流程] 巡逻员身份验证流程失败:', error);
				throw error;
			}
		},

		// 🆕 新增：从参数中提取巡逻员ID
		extractPatrolIdFromParams() {
			// 从scannedParams中获取patrolId
			if (this.scannedParams.patrolId) {
				return this.scannedParams.patrolId;
			}

			// 如果没有直接的patrolId，尝试从其他可能的参数名获取
			const possibleKeys = ['patrolId', 'patrol_id', 'id'];
			for (const key of possibleKeys) {
				if (this.scannedParams[key]) {
					return this.scannedParams[key];
				}
			}

			console.warn('⚠️ 无法从参数中提取巡逻员ID:', this.scannedParams);
			return null;
		},

		// 🆕 新增：验证巡逻员角色的后端接口调用
		async verifyPatrolRole(patrolId, userPhone) {
			const startTime = Date.now();
			try {
				console.log('🚀 [巡逻员验证] 开始验证巡逻员身份');
				console.log('📋 [巡逻员验证] 请求参数:', {
					patrolId: patrolId,
					userPhone: userPhone,
					applyKind: '4',
					timestamp: new Date().toISOString()
				});

				const requestData = {
					applyKind: '4',
					targetId: patrolId,
					userPhone: userPhone
				};

				console.log('🌐 [巡逻员验证] 发送请求到:', 'https://www.xuerparking.cn:8543/parking/role/verifyByQrCode');
				console.log('📤 [巡逻员验证] 请求数据:', JSON.stringify(requestData, null, 2));

				const response = await uni.request({
					url: 'https://www.xuerparking.cn:8543/parking/role/verifyByQrCode',
					method: 'POST',
					data: requestData,
					header: {
						'content-type': 'application/json'
					}
				});

				const duration = Date.now() - startTime;
				console.log(`⏱️ [巡逻员验证] 请求耗时: ${duration}ms`);
				console.log('📥 [巡逻员验证] 响应状态码:', response.statusCode);
				console.log('📋 [巡逻员验证] 完整响应数据:', JSON.stringify(response.data, null, 2));

				if (response.statusCode !== 200) {
					console.error('❌ [巡逻员验证] HTTP状态码异常:', response.statusCode);
					return {
						verified: false,
						message: `服务器响应异常 (状态码: ${response.statusCode})`
					};
				}
				console.log("巡逻员响应数据：", response.data);
				if (response.data && response.data.code === "0") {
					// 🔍 检查响应数据结构
					console.log('🔍 [巡逻员验证] 响应数据结构分析:', {
						hasData: !!response.data.data,
						hasInnerData: !!response.data.data?.data,
						innerDataVerified: response.data.data?.data?.verified,
						innerDataPatrolData: !!response.data.data?.data?.patrolData
					});

					// 检查第三层 data（实际的验证数据在这里）
					let verified = false;
					let patrolData = null;
					let patrolName = '巡逻员';
					let message = response.data.msg || '验证成功';

					if (response.data.data && response.data.data.data) {
						const innerData = response.data.data.data;
						console.log('📋 [巡逻员验证] 检查第三层data:', {
							verified: innerData.verified,
							hasPatrolData: !!innerData.patrolData,
							patrolName: innerData.patrolName
						});

						if (innerData.verified !== undefined) {
							verified = innerData.verified === true || innerData.verified === 'true' || innerData.verified === 1;
							patrolData = innerData.patrolData;
							patrolName = innerData.patrolName || innerData.patrolData?.username || '巡逻员';
							message = response.data.data.msg || '验证成功';
							console.log('✅ [巡逻员验证] 使用第三层数据结构');
						}
					}

					// 兼容其他可能的数据结构
					if (!verified) {
						// 检查第二层 data
						if (response.data.data) {
							if (response.data.data.verified !== undefined) {
								verified = response.data.data.verified === true || response.data.data.verified === 'true' || response.data.data.verified === 1;
								patrolData = response.data.data.patrolData;
								patrolName = response.data.data.patrolName || response.data.data.patrolData?.username || '巡逻员';
								message = response.data.data.message || response.data.data.msg;
								console.log('📋 [巡逻员验证] 使用第二层数据结构');
							}
						}

						// 检查第一层 data
						if (!verified && response.data.verified !== undefined) {
							verified = response.data.verified === true || response.data.verified === 'true' || response.data.verified === 1;
							patrolData = response.data.patrolData;
							patrolName = response.data.patrolName || response.data.patrolData?.username || '巡逻员';
							message = response.data.message || response.data.msg;
							console.log('📋 [巡逻员验证] 使用第一层数据结构');
						}
					}

					// 🏠 提取完整的管家信息到patrolData中
					const patrolDataWithManagerInfo = patrolData ? {
						// 保留原有的patrolData
						...patrolData,
						// 🆕 添加管家相关信息
						managerInfo: {
							id: patrolData?.id,
							usercode: patrolData?.usercode,
							province: patrolData?.province || '',
							city: patrolData?.city || '',
							district: patrolData?.district || '',
							community: patrolData?.community || this.currentParkName,
							phone: patrolData?.phone,
							username: patrolData?.username,
							createdate: patrolData?.createdate,
							createman: patrolData?.createman,
							status: patrolData?.status
						}
					} : null;

					const result = {
						verified: verified,
						patrolName: patrolName,
						patrolData: patrolDataWithManagerInfo,
						message: message,
						// 🆕 添加权限信息
						permissions: ['violation.add', 'violation.query', 'violation.manage']
					};

					console.log('✅ [巡逻员验证] 验证成功:', {
						verified: result.verified,
						patrolName: result.patrolName,
						message: result.message,
						hasPatrolData: !!result.patrolData
					});

					return result;
				} else {
					// 🆕 优化错误处理：详细处理后端错误信息
					const errorCode = response.data?.code;
					const errorMsg = response.data?.msg || response.data?.message || '验证失败';
					const errorData = response.data?.data || {};

					console.error('❌ [巡逻员验证] 后端返回错误状态:', {
						code: errorCode,
						message: errorMsg,
						errorData: errorData,
						fullResponse: response.data
					});

					// 🔧 根据后端返回的具体错误信息，提供精确的用户提示
					let userFriendlyMessage = errorMsg;
					let detailedInfo = '';

					// 检查后端返回的data中的详细错误信息
					if (errorData.errorCode) {
						switch (errorData.errorCode) {
							case 'PATROL_NOT_FOUND':
								userFriendlyMessage = '巡逻员不存在';
								detailedInfo = errorData.message || '二维码中的巡逻员信息不存在，请确认二维码是否正确';
								break;
							case 'WRONG_PATROL_QR':
								userFriendlyMessage = '二维码不匹配';
								detailedInfo = errorData.message || `您是巡逻员 ${errorData.actualPatrolName}，但此二维码是 ${errorData.targetPatrolName} 的，请使用正确的巡逻员二维码`;
								break;
							case 'NOT_PATROL':
								userFriendlyMessage = '非巡逻员用户';
								detailedInfo = errorData.message || '您不是巡逻员，无法使用巡逻员二维码。如果您认为这是错误，请联系管理员确认您的巡逻员身份';
								if (errorData.targetPatrolName) {
									detailedInfo += `\n\n此二维码属于：${errorData.targetPatrolName}`;
								}
								break;
							default:
								userFriendlyMessage = errorData.message || errorMsg;
								break;
						}
					} else {
						// 兼容旧的错误处理方式
						if (errorMsg.includes('手机号不匹配') || errorMsg.includes('巡逻员不存在')) {
							userFriendlyMessage = '身份验证失败：您的手机号与该巡逻员信息不匹配。\n\n可能原因：\n• 您不是该巡逻员\n• 巡逻员信息已更新\n• 二维码信息错误\n\n请确认您是否为该巡逻员，或联系管理员确认您的巡逻员身份。';
						} else if (errorMsg.includes('参数')) {
							userFriendlyMessage = '验证参数错误，请重新扫描二维码或联系管理员。';
						} else if (errorMsg.includes('权限')) {
							userFriendlyMessage = '您没有巡逻员权限，无法使用此功能。';
						} else if (errorMsg.includes('系统')) {
							userFriendlyMessage = '系统验证失败，请稍后重试或联系技术支持。';
						}
					}

					// 🔧 确保返回的错误信息包含完整的错误详情
					const errorMessage = detailedInfo || userFriendlyMessage;
					console.log('❌ [巡逻员验证] 构建的错误信息:', {
						detailedInfo,
						userFriendlyMessage,
						finalMessage: errorMessage
					});

					return {
						verified: false,
						message: errorMessage,
						originalError: errorMsg,
						errorCode: errorData.errorCode || errorCode,
						errorData: errorData
					};
				}

			} catch (error) {
				const duration = Date.now() - startTime;
				console.error(`❌ [巡逻员验证] 请求异常 (耗时: ${duration}ms):`, error);
				console.error('❌ [巡逻员验证] 错误详情:', {
					name: error.name,
					message: error.message,
					stack: error.stack
				});

				return {
					verified: false,
					message: '网络错误，请检查网络连接后重试'
				};
			}
		},

		// 提取URL参数的方法
		extractUrlParams(url) {
			const params = {};
			try {
				console.log('🔍 [URL解析] 开始解析URL:', url);

				// 查找URL中的查询参数部分
				let queryString = '';

				// 方法1：标准的?参数格式
				const queryStart = url.indexOf('?');
				if (queryStart !== -1) {
					queryString = url.substring(queryStart + 1);
					console.log('📋 [URL解析] 找到标准?参数:', queryString);
				} else {
					// 方法2：特殊的&参数格式（针对我们的URL格式）
					const ampersandStart = url.indexOf('&');
					if (ampersandStart !== -1) {
						queryString = url.substring(ampersandStart + 1);
						console.log('📋 [URL解析] 找到&参数格式:', queryString);
					}
				}

				if (!queryString) {
					console.log('⚠️ [URL解析] 未找到任何参数');
					return params;
				}

				// 解析参数对
				const pairs = queryString.split('&');
				console.log('📋 [URL解析] 参数对数组:', pairs);

				for (let pair of pairs) {
					const [key, value] = pair.split('=');
					if (key && value !== undefined) {
						// 解码参数值
						const decodedValue = decodeURIComponent(value);
						params[key] = decodedValue;
						console.log(`📝 [URL解析] 解析参数: ${key} = ${decodedValue}`);
					}
				}

				console.log('✅ [URL解析] 最终解析结果:', params);

			} catch (error) {
				console.error('❌ [URL解析] 提取URL参数失败:', error);
			}
			return params;
		},

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
				// 保存this上下文
				const self = this;
				// 3秒后显示耐心等待提示
				self.patienceTimer = setTimeout(() => {
					self.showPatienceTip = true;
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
					// 检查用户角色是否为审核未通过的状态
					const unapprovedRoles = ['pending', 'rejected', 'unregistered', 'disabled', 'suspended'];
					if (unapprovedRoles.includes(userInfo.role)) {
						console.log('用户状态为审核未通过，清除存储并显示授权页面:', userInfo.role);
						// 清除无效的用户信息
						uni.removeStorageSync('userInfo');
						uni.removeStorageSync('currentTabBarRole');
						return;
					}

					// 已授权且状态有效则直接跳转
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
			console.log('协议已勾选，将触发授权');
		},

		// 🔧 修改现有的手机号授权方法
		async onGetPhoneNumber(e) {
			console.log('📱 [手机号授权] 授权回调:', e);
			console.log('🔗 [手机号授权] 当前用户信息:', this.wechatUserInfo);

			// 验证授权结果
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
					content: '获取手机号时出现异常，可能是网络问题或服务暂时不可用。请稍后重试。',
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
				this.updateStage(1, 20, '正在获取登录凭证...');
				const loginRes = await this.wxLogin();

				// 第二步：验证身份角色（最耗时的阶段）
				this.updateStage(2, 30, `正在${this.currentParkName}验证您的身份...\n🔍 查询外部服务中，请耐心等待`);

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
						this.updateStage(2, 35, `🔍 正在连接${this.currentParkName}系统...`);
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
				let phoneResult;
				let loginResult;
				try {
					phoneResult = await this.decryptPhone({
						code: loginRes.code,
						encryptedData,
						iv,
						parkName: this.currentParkName // 当前停车场
					});

					// 清除进度更新定时器
					clearInterval(progressUpdateInterval);

					const verificationDuration = Math.round((Date.now() - verificationStartTime) / 1000);

					// 第三步：设置用户信息
					this.updateStage(3, 85, `✅ 身份验证完成(${verificationDuration}秒)\n正在为您设置用户信息...`);

					// 🔧 验证返回结果的有效性
					if (!phoneResult || typeof phoneResult !== 'object') {
						throw new Error('身份验证返回结果无效');
					}

					if (!phoneResult.phone || !phoneResult.role) {
						throw new Error('身份验证结果缺少必要信息');
					}

					console.log('✅ [身份验证] 验证结果有效，开始保存用户信息');
					
					// 🔍 巡检员必须通过扫描二维码才能登录
					if (phoneResult.role === 'patrol') {
						console.log('👮‍♂️ [巡检员验证] 检查是否通过二维码扫描');
						
						// 检查是否有巡检员ID（从二维码中获取）
						if (!this.scannedParams.patrolId && !this.scannedParams.qrId) {
							console.warn('❌ [巡检员验证] 巡检员未通过二维码扫描登录');
							this.completeProgress();
							this.showLoading = false;
							
							uni.showModal({
								title: '访问受限',
								content: '巡检员必须通过扫描专用二维码才能登录系统。\n\n请使用管理员提供的巡检二维码扫码登录。',
								showCancel: false,
								confirmText: '我知道了'
							});
							return;
						}
						
						console.log('✅ [巡检员验证] 巡检员通过二维码扫描登录');
					}

					// 🆕 合并公众号用户信息和手机号信息
					const combinedUserInfo = {
						...phoneResult,
						wechatUserInfo: this.wechatUserInfo || null, // 添加公众号用户信息（可能为空）
						scannedInfo: {
							qrId: this.scannedParams.qrId,
							patrolId: this.scannedParams.patrolId,
							butlerId: this.scannedParams.butlerId,
							applyKind: this.scannedParams.applyKind,
							butlerName: this.scannedParams.butlerName,
							community: this.scannedParams.community
						}
					};

					console.log('📋 [合并用户信息] 最终用户信息:', {
						hasPhoneResult: !!phoneResult,
						hasWechatUserInfo: !!this.wechatUserInfo,
						role: phoneResult?.role,
						phone: phoneResult?.phone,
						hasScannedInfo: !!(this.scannedParams.qrId || this.scannedParams.patrolId || this.scannedParams.butlerId)
					});

					// 保存用户信息
					loginResult = await this.saveUserInfo(combinedUserInfo);

				} catch (error) {
					// 清除进度更新定时器
					clearInterval(progressUpdateInterval);

					console.error('❌ [身份验证] 身份验证或保存用户信息失败:', error);

					// 重新抛出错误，让外层catch处理
					throw error;
				}

				// 🔧 确保变量在try块外可用
				if (!phoneResult) {
					throw new Error('身份验证流程异常，未获取到用户信息');
				}

				if (!loginResult) {
					throw new Error('保存用户信息失败，未获取到登录结果');
				}

				// 只处理未注册用户（区分三种访客类型）
				if (phoneResult.role === 'unregistered') {
					console.log('📝 [访客分类] 未注册用户，开始判断访客类型');
					console.log('📝 [访客分类] 扫码参数:', this.scannedParams);
					
					let visitorType = 'unknown'; // unknown: 未知访客, invited: 受邀访客, external: 外来访客
					let visitorRoleText = '访客';
					
					// 判断访客类型
					if (this.scannedParams.butlerId || this.scannedParams.applyKind) {
						// 类型1: 受邀访客（扫描管家邀请码）
						visitorType = 'invited';
						visitorRoleText = '受邀访客';
						console.log('✅ [访客分类] 识别为受邀访客 - 有管家邀请码');
					} else if (this.scannedParams.qrId) {
						// 类型2: 外来访客（扫描车场二维码）
						// 🔍 验证车场二维码是否过期（1分钟有效期）
						const qrTimestamp = parseInt(this.scannedParams.timestamp);
						const currentTime = Date.now();
						const validDuration = 60 * 1000; // 1分钟 = 60秒 = 60000毫秒
						
						if (qrTimestamp && !isNaN(qrTimestamp)) {
							const elapsedTime = currentTime - qrTimestamp;
							const remainingSeconds = Math.max(0, Math.floor((validDuration - elapsedTime) / 1000));
							
							console.log('⏱️ [二维码验证] 时间检查:', {
								qrTimestamp: qrTimestamp,
								currentTime: currentTime,
								elapsedTime: elapsedTime,
								elapsedSeconds: Math.floor(elapsedTime / 1000),
								validDuration: validDuration,
								remainingSeconds: remainingSeconds,
								isExpired: elapsedTime > validDuration
							});
							
							// 如果超过1分钟，二维码已过期
							if (elapsedTime > validDuration) {
								console.warn('❌ [二维码验证] 车场二维码已过期');
								this.completeProgress();
								this.showLoading = false;
								
								uni.showModal({
									title: '二维码已过期',
									content: `该车场二维码已过期，无法使用。\n\n车场二维码有效期：1分钟\n已过期：${Math.floor(elapsedTime / 1000)}秒\n\n请重新扫描最新的车场二维码。`,
									showCancel: false,
									confirmText: '我知道了'
								});
								return;
							}
							
							console.log(`✅ [二维码验证] 车场二维码有效，剩余时间：${remainingSeconds}秒`);
						} else {
							console.warn('⚠️ [二维码验证] 未找到有效的时间戳，跳过时间验证');
						}
						
						visitorType = 'external';
						visitorRoleText = '外来访客';
						console.log('✅ [访客分类] 识别为外来访客 - 扫描车场二维码');
					} else {
						// 类型3: 未知访客（直接搜索小程序进入）
						visitorType = 'unknown';
						visitorRoleText = '未知访客';
						console.warn('❌ [访客分类] 识别为未知访客 - 无扫码信息');
					}
					
					// 未知访客禁止访问
					if (visitorType === 'unknown') {
						console.warn('❌ [访问限制] 未知访客禁止访问系统');
						this.completeProgress();
						this.showLoading = false;
						
						uni.showModal({
							title: '访问受限',
							content: '访客用户需要通过扫描专用二维码才能使用停车服务。\n\n请联系管家获取以下二维码：\n• 管家邀请码（一次预约有效）\n• 车场二维码（持续有效）\n\n扫码后即可正常使用停车服务。',
							showCancel: false,
							confirmText: '我知道了'
						});
						return;
					}
					
					// 受邀访客和外来访客可以访问
					console.log(`✅ [访问通过] ${visitorRoleText}可以访问系统`);
					
					const visitorResult = {
						phone: phoneResult.phone,
						role: 'visitor',
						roleText: visitorRoleText,
						visitorType: visitorType, // 添加访客类型标识
						userInfo: {
							id: Date.now(),
							openid: 'visitor_' + phoneResult.phone,
							nickname: visitorRoleText,
							phone: phoneResult.phone,
							auditstatus: '已通过',
							userkind: 'visitor',
							visitorType: visitorType // 保存访客类型到用户信息
						},
						permissions: ['appointment.create', 'appointment.query.own',
							'visitor.appointment', 'visitor.query'
						],
						// 保存扫码信息以便后续使用
						scannedInfo: {
							qrId: this.scannedParams.qrId,
							butlerId: this.scannedParams.butlerId,
							applyKind: this.scannedParams.applyKind,
							butlerName: this.scannedParams.butlerName,
							community: this.scannedParams.community
						}
					};
					
					// 继续正常的登录流程
					this.completeProgress();
					this.showLoading = false;
					return this.continueLogin(visitorResult);
				}


				// 第四步：完成设置
				this.updateStage(4, 95, `🎉 欢迎您，${phoneResult.roleText}！\n正在进入停车服务...`);

				// 显示角色相关的成功提示
				const successMessages = {
					owner: '🏠 业主身份验证成功！',
					manager: '👨‍💼 管家身份验证成功！',
					patrol: '👮‍♂️ 巡逻员身份验证成功！',
					visitor: '🚗 访客身份验证成功！'
				};

				const successMessage = successMessages[phoneResult.role] || '✅ 身份验证成功！';

				uni.showToast({
					title: successMessage,
					icon: 'success',
					duration: 2000
				});

				// 延迟一下让用户看到成功状态，同时显示角色权限提示
				// 保存this上下文
				const self = this;
				setTimeout(() => {
					const roleDescriptions = {
						owner: '您可以预约停车位、查看个人违规记录',
						manager: '您可以管理预约、审核申请、查看所有记录',
						patrol: '您可以添加违规记录、查询违规信息、管理巡逻工作',
						visitor: '您可以申请访客预约、查看个人记录'
					};

					const roleDesc = roleDescriptions[phoneResult.role] || '欢迎使用停车服务';

					// 最终完成进度
					self.completeProgress();

					uni.showToast({
						title: roleDesc,
						icon: 'none',
						duration: 2500,
						mask: false
					});



					// 再延迟一下跳转
					setTimeout(() => {
						self.navigateToHome(phoneResult.role);
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

				// 保存this上下文
				const self = this;
				// 延迟隐藏加载框，让用户看到最终状态
				setTimeout(() => {
					self.showLoading = false;
					// 确保进度被重置
					self.resetProgress();
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
		}) {
			console.log('📱 微信授权参数:', {
				code: code || 'no-code',
				encryptedData: encryptedData && typeof encryptedData === 'string' ?
					encryptedData.substring(0, 20) + '...' : 'no-encrypted-data',
				iv: iv || 'no-iv',
				parkName: '' // 当前停车场
			});

			try {
				// 🆕 检查是否通过二维码识别为特殊角色（管家/巡逻员）
				console.log('🔍 [角色检查] 检查二维码识别的角色:', this.scannedParams);

				if (this.scannedParams.applyKind === '3') {
					// 管家身份验证流程
					console.log('👨‍💼 [管家验证] 检测到管家二维码，跳过五层角色判断，直接进行身份验证');
					return await this.handleManagerAuthFlow(code, encryptedData, iv);
				}

				if (this.scannedParams.applyKind === '4') {
					// 巡逻员身份验证流程
					console.log('👮‍♂️ [巡逻员验证] 检测到巡逻员二维码，跳过五层角色判断，直接进行身份验证');
					try {
						const patrolResult = await this.handlePatrolAuthFlow(code, encryptedData, iv);
						if (!patrolResult) {
							throw new Error('巡逻员身份验证流程返回空结果');
						}
						return patrolResult;
					} catch (error) {
						console.error('❌ [巡逻员验证] 巡逻员身份验证流程失败:', error);
						// 重新抛出错误，让上层处理
						throw error;
					}
				}

				// 移除此处的小区验证，改为在获取用户信息后验证

				// 普通用户：调用后端授权接口（传递停车场信息）
				console.log('🏠 [普通用户] 进行五层角色判断流程');
				const authResult = await this.callAuthAPI({
					code,
					encryptedData,
					iv,
					parkName: '' // 当前停车场
				});

				console.log('🔗 后端授权响应:', authResult);
				console.log('🔍 响应数据详情:', JSON.stringify(authResult, null, 2));
				console.log('📄 authResult类型:', typeof authResult);
				console.log('📄 authResult.code:', authResult.code, '类型:', typeof authResult.code);
				console.log('📄 authResult.data:', authResult.data);
				console.log('📄 authResult.data类型:', typeof authResult.data);

				if (authResult.code === "0") {
					// 明确获取 data 部分
					const actualData = authResult.data;
					console.log('📋 实际数据:', actualData);
					console.log('📋 实际数据JSON:', JSON.stringify(actualData, null, 2));
					console.log('🏷️ 角色信息:', actualData.role, '类型:', typeof actualData.role);

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

					// 处理不同的角色状态
					if (actualData.role === 'unregistered') {
						// 未注册用户 - 保持unregistered状态，让上层onGetPhoneNumber进行三种访客分类
						console.log('✅ 检测到未注册用户，保持unregistered状态传递给上层');
						console.log('📝 由前端根据扫码信息判断访客类型：');
						console.log('   - 受邀访客：扫描管家邀请码（butlerId/applyKind）');
						console.log('   - 外来访客：扫描车场二维码（qrId + 时间戳验证1分钟）');
						console.log('   - 未知访客：无扫码信息，拒绝访问');

						return {
							phone: actualData.phone,
							role: 'unregistered',  // ✅ 保持unregistered状态
							roleText: '未注册',
							userInfo: actualData.userInfo
						};
					}

					if (actualData.role === 'pending') {
						// 待审核用户
						console.log('⏳ 用户待审核');
						return {
							phone: actualData.phone,
							role: 'pending',
							roleText: '待审核',
							message: '您的申请正在审核中，请耐心等待',
							userInfo: actualData.userInfo,
							permissions: []
						};
					}

					if (actualData.role === 'rejected') {
						// 审核被拒绝用户
						console.log('❌ 用户申请被拒绝');
						return {
							phone: actualData.phone,
							role: 'rejected',
							roleText: '申请被拒绝',
							message: '很抱歉，您的申请未通过审核',
							userInfo: actualData.userInfo,
							permissions: []
						};
					}

					if (actualData.role === 'disabled') {
						// 账号被禁用用户
						console.log('🚫 用户账号被禁用');
						return {
							phone: actualData.phone,
							role: 'disabled',
							roleText: '账号被禁用',
							message: '您的账号已被管理员禁用',
							userInfo: actualData.userInfo,
							permissions: []
						};
					}

					if (actualData.role === 'suspended') {
						// 账号被暂停用户
						console.log('⏸️ 用户账号被暂停');
						return {
							phone: actualData.phone,
							role: 'suspended',
							roleText: '账号已暂停',
							message: '您的账号已被暂时停用',
							userInfo: actualData.userInfo,
							permissions: []
						};
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

					// 🆕 新增：在返回用户信息前，验证小区信息一致性
					if (this.scannedParams.community && actualData.phone) {
						console.log('🔍 [小区验证] 检测到扫码小区信息，开始验证一致性');
						const communityValidation = await this.validateCommunityConsistency(actualData.phone);
						if (!communityValidation.isValid) {
							console.error('❌ [小区验证] 验证失败:', communityValidation.message);
							throw new Error(communityValidation.message);
						}
						console.log('✅ [小区验证] 验证通过，允许登录');
					}

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

		// 🆕 新增：验证小区信息一致性
		async validateCommunityConsistency(userPhone) {
			try {
				console.log('🔍 [小区验证] 开始验证小区信息一致性');
				console.log('🔍 [小区验证] 当前扫码参数:', JSON.stringify(this.scannedParams, null, 2));
				console.log('🔍 [小区验证] 用户手机号:', userPhone);

				// 获取扫码的小区名称
				const scannedCommunity = this.scannedParams.community;
				if (!scannedCommunity) {
					console.log('⚠️ [小区验证] 扫码参数中无小区信息，跳过验证');
					return { isValid: true, message: '无需验证' };
				}

				// 使用用户授权后获取的手机号
				if (!userPhone) {
					console.log('⚠️ [小区验证] 无用户手机号，跳过验证');
					return { isValid: true, message: '无需验证' };
				}

				console.log('🔍 [小区验证] 验证参数:', {
					scannedCommunity: scannedCommunity,
					userPhone: userPhone
				});

				// 调用后端接口查询管家信息
				const managerInfoTab = await this.getManagerInfoByPhone(userPhone);
				const managerInfo = managerInfoTab.data;
				if (!managerInfo) {
					console.log('⚠️ [小区验证] 该手机号不是管家，跳过小区验证');
					return { isValid: true, message: '非管家用户，无需验证' };
				}

				// 获取管家对应的小区名称
				const managerCommunity = managerInfo.community || managerInfo.yardName || managerInfo.communityName;

				if (!managerCommunity) {
					console.log('⚠️ [小区验证] 管家信息中无小区名称，跳过验证');
					return { isValid: true, message: '无需验证' };
				}

				console.log('🔍 [小区验证] 小区信息对比:', {
					scannedCommunity: scannedCommunity,
					managerCommunity: managerCommunity
				});

				// 比较小区名称是否一致
				if (scannedCommunity !== managerCommunity) {
					const errorMessage = `小区信息不一致！\n\n扫码获取的小区：${scannedCommunity}\n您管理的小区：${managerCommunity}\n\n您不是${scannedCommunity}小区的管家，无法使用此二维码进行预约。\n\n请联系${scannedCommunity}小区的管家获取正确的预约二维码。`;

					console.error('❌ [小区验证] 小区信息不一致:', errorMessage);

					return {
						isValid: false,
						message: errorMessage
					};
				}

				console.log('✅ [小区验证] 小区信息一致，验证通过');
				return { isValid: true, message: '验证通过' };

			} catch (error) {
				console.error('❌ [小区验证] 验证过程发生错误:', error);

				// 验证过程出错时，为了安全起见，阻止登录
				return {
					isValid: false,
					message: `小区信息验证失败：${error.message}\n\n为了确保安全，请重试或联系管理员。`
				};
			}
		},

		// 🆕 新增：根据手机号查询管家信息
		async getManagerInfoByPhone(phone) {
			try {
				console.log('🔍 [管家查询] 开始查询管家信息，手机号:', phone);

				const response = await uni.request({
					url: 'https://www.xuerparking.cn:8543/parking/butler/getByPhone',
					method: 'GET',
					data: {
						phone: phone
					},
					header: {
						'content-type': 'application/json'
					}
				});

				console.log('📥 [管家查询] 响应状态码:', response.statusCode);
				console.log('📋 [管家查询] 响应数据:', JSON.stringify(response.data, null, 2));

				if (response.statusCode === 200 && response.data && response.data.code === "0") {
					const managerData = response.data.data;
					console.log('✅ [管家查询] 成功获取管家信息:', managerData);
					return managerData;
				} else {
					console.warn('⚠️ [管家查询] 未找到管家信息或查询失败:', response.data?.msg || '未知错误');
					return null;
				}

			} catch (error) {
				console.error('❌ [管家查询] 查询管家信息失败:', error);
				return null;
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
						parkName: params.parkName || this.currentParkName
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



		// 查询小区信息
		async fetchCommunityInfo() {
			try {
				// 从扫码参数中获取小区名称
				const communityName = this.scannedParams.community;
				console.log('🏢 准备查询小区信息:', communityName);

				const response = await uni.request({
					url: 'https://www.xuerparking.cn:8543/parking/community/getCommunityInfo',
					method: 'POST',
					data: {
						communityName: communityName
					},
					header: {
						'content-type': 'application/json'
					}
				});

				if (response.data && response.data.code === "0" && response.data.data) {
					return {
						name: response.data.data.name,
						fullName: response.data.data.name ? (response.data.data.name + '-停车场') : (this.scannedParams.community + '-停车场'),
						province: response.data.data.province,
						city: response.data.data.city,
						district: response.data.data.district,
						address: response.data.data.address,
						fullAddress: response.data.data.fullAddress ||
							`${response.data.data.province}${response.data.data.city}${response.data.data.district}${response.data.data.address}`
					};
				}

				// 如果接口返回异常，使用扫码的小区信息或默认值
				const defaultCommunityName = this.scannedParams.community;
				return {
					name: defaultCommunityName,
					fullName: defaultCommunityName ? defaultCommunityName + '-停车场' : '',
					province: '',
					city: '',
					district: '',
					address: '',
					fullAddress: ''
				};

			} catch (error) {
				console.error('获取小区信息失败:', error);
				// 发生错误时返回扫码的小区信息或默认值
				const defaultCommunityName = this.scannedParams.community;
				return {
					name: defaultCommunityName,
					fullName: defaultCommunityName ? defaultCommunityName + '-停车场' : '',
					province: '',
					city: '',
					district: '',
					address: '',
					fullAddress: ''
				};
			}
		},

		// 🔧 修改保存用户信息方法
		async saveUserInfo(userInfo) {
			try {
				console.log('💾 [保存用户信息] 开始保存，包含微信信息:', !!userInfo.wechatUserInfo);

				// 🔧 验证输入参数的有效性
				if (!userInfo || typeof userInfo !== 'object') {
					console.error('❌ [保存用户信息] 输入参数无效:', userInfo);
					throw new Error('用户信息参数无效，无法保存');
				}

				// 检查必要的字段
				if (!userInfo.phone || !userInfo.role) {
					console.error('❌ [保存用户信息] 缺少必要字段:', {
						hasPhone: !!userInfo.phone,
						hasRole: !!userInfo.role,
						userInfo: userInfo
					});
					throw new Error('用户信息不完整，缺少手机号或角色信息');
				}

				console.log('✅ [保存用户信息] 参数验证通过，开始保存流程');

				// 🆕 提前保存微信用户信息到独立的本地存储，供其他页面使用
				if (userInfo.wechatUserInfo) {
					console.log('💾 [微信信息] 保存微信用户信息到独立存储');
					uni.setStorageSync('wechatUserInfo', userInfo.wechatUserInfo);

					// 🆕 保存用户基本信息到易于访问的格式
					const userBasicInfo = {
						phone: userInfo.phone,
						nickname: userInfo.wechatUserInfo.nickname || '',
						openid: userInfo.wechatUserInfo.openid || '',
						unionid: userInfo.wechatUserInfo.unionid || '',
						headimgurl: userInfo.wechatUserInfo.headimgurl || '',
						role: userInfo.role,
						roleText: userInfo.roleText,
						timestamp: Date.now()
					};

					console.log('💾 [用户基本信息] 保存用户基本信息:', userBasicInfo);
					uni.setStorageSync('userBasicInfo', userBasicInfo);
				}

				// 查询小区信息
				let communityInfo;
				console.log('🔍 扫码参数:测试', this.scannedParams);
				// 如果有扫码参数中的小区信息，优先使用
				if (this.scannedParams.community) {
					console.log('🏢 使用扫码获取的小区信息:', this.scannedParams.community);
					communityInfo = await this.fetchCommunityInfo();
				} else if (userInfo.userInfo && userInfo.userInfo.community) {
					// 如果用户信息中有小区信息，使用用户信息中的
					console.log('🏢 使用用户信息中的小区:', userInfo.userInfo.community);
					this.scannedParams.community = userInfo.userInfo.community;
					communityInfo = await this.fetchCommunityInfo();
				} else {
					// 如果都没有，使用默认值
					console.log('⚠️ 未找到小区信息，使用默认值');
					communityInfo = await this.fetchCommunityInfo();
				}

				// 🆕 检查并保存到 user_mapper
				if (userInfo.wechatUserInfo) {
					await this.saveToUserMapper(userInfo.wechatUserInfo, userInfo.phone, userInfo.role);
				}

				// 准备认证数据，添加权限信息
				const authData = {
					phone: userInfo.phone,
					role: userInfo.role,
					roleText: userInfo.roleText,
					message: userInfo.message,
					userInfo: userInfo.userInfo,
					permissions: userInfo.permissions,
					parkInfo: communityInfo, // 添加小区信息
					wechatUserInfo: userInfo.wechatUserInfo, // 🆕 添加微信信息
					// 🆕 添加小区名称和用户名称，方便智能搜索使用
					yardName: this.scannedParams.community || userInfo.yardName || userInfo.userInfo?.yardName || userInfo.userInfo?.community || communityInfo?.name || this.currentParkName,
					userName: userInfo.userName || userInfo.userInfo?.username || userInfo.roleText || '用户'
				};

				// 💾 保存用户信息到多个存储键中，确保兼容性
				uni.setStorageSync('parkInfo', communityInfo);

				// 🏠 如果有管家信息，单独存储
				if (userInfo.userInfo?.managerInfo) {
					uni.setStorageSync('managerInfo', userInfo.userInfo.managerInfo);
					console.log('💾 [存储管家信息] 管家信息已保存到本地存储:', userInfo.userInfo.managerInfo);
				}

				// 🏠 如果有管家数据，也单独存储（用于管家角色的小区信息获取）
				if (userInfo.userInfo?.managerData) {
					uni.setStorageSync('managerData', userInfo.userInfo.managerData);
					console.log('💾 [存储管家数据] 管家数据已保存到本地存储:', userInfo.userInfo.managerData);
				}

				// 🏢 存储小区信息的多个副本，确保兼容性
				const communityInfoExtended = {
					...communityInfo,
					yardName: authData.yardName,
					communityName: authData.yardName
				};
				uni.setStorageSync('communityInfo', communityInfoExtended);
				uni.setStorageSync('yardInfo', communityInfoExtended);

				// 🆕 保存/更新扫码地址信息到本地存储（如果有的话）
				// 🚀 重要修复：读取已保存的扫码信息，并添加手机号信息
				let scannedAddressInfo = uni.getStorageSync('scannedAddressInfo') || {};

				// 如果有扫码参数或已存在扫码信息，则更新信息
				if (this.scannedParams || (scannedAddressInfo && Object.keys(scannedAddressInfo).length > 0)) {
					// 合并扫码信息和手机号信息
					const updatedScannedInfo = {
						...scannedAddressInfo, // 保留已存在的扫码信息
						// 添加或更新扫码参数（如果存在）
						applyKind: this.scannedParams?.applyKind || scannedAddressInfo.applyKind || '',
						butlerId: this.scannedParams?.butlerId || scannedAddressInfo.butlerId || '',
						patrolId: this.scannedParams?.patrolId || scannedAddressInfo.patrolId || '',
						community: this.scannedParams?.community || scannedAddressInfo.community || '',
						building: this.scannedParams?.building || scannedAddressInfo.building || '',
						unit: this.scannedParams?.unit || scannedAddressInfo.unit || '',
						floor: this.scannedParams?.floor || scannedAddressInfo.floor || '',
						room: this.scannedParams?.room || scannedAddressInfo.room || '',
						butlerName: this.scannedParams?.butlerName || scannedAddressInfo.butlerName || '',
						butlerPhone: this.scannedParams?.butlerPhone || this.scannedParams?.phone || scannedAddressInfo.butlerPhone || '',
						qrId: this.scannedParams?.qrId || scannedAddressInfo.qrId || '',
						// 🚀 关键修复：添加授权后的手机号信息
						authorizedPhone: userInfo.phone || '', // 手机号授权后的手机号
						visitorPhone: this.scannedParams?.phone || scannedAddressInfo.visitorPhone || '',
						timestamp: scannedAddressInfo.timestamp || Date.now(), // 保留原有时间戳或创建新的
						lastUpdated: Date.now(), // 最后更新时间
						source: scannedAddressInfo.source || 'auth_update' // 保留原有来源或标记为授权更新
					};

					console.log('💾 更新扫码地址信息到本地存储（包含授权手机号）:', updatedScannedInfo);
					uni.setStorageSync('scannedAddressInfo', updatedScannedInfo);

					// 🆕 额外保存一份到浏览器localStorage（如果支持）
					if (typeof localStorage !== 'undefined') {
						try {
							localStorage.setItem('scannedAddressInfo', JSON.stringify(updatedScannedInfo));
							console.log('💾 同时保存扫码信息到浏览器localStorage');
						} catch (e) {
							console.log('⚠️ 保存到localStorage失败:', e.message);
						}
					}
				}

				// 使用AuthUtils进行登录
				const loginResult = await AuthUtils.login(authData);

				// 💾 保存登录结果到多个存储键中，确保兼容性
				if (loginResult.success && loginResult.data) {
					const finalUserInfo = {
						...loginResult.data,
						yardName: authData.yardName,
						userName: authData.userName,
						wechatUserInfo: userInfo.wechatUserInfo, // 🆕 保留微信信息
						// 🆕 在根级别也保存微信关键信息，便于快速访问
						// ✅ 修复：访客的openid从userInfo.userInfo获取
						nickname: userInfo.wechatUserInfo?.nickname || userInfo.userInfo?.nickname || '',
						openid: userInfo.wechatUserInfo?.openid || userInfo.userInfo?.openid || '',
						unionid: userInfo.wechatUserInfo?.unionid || userInfo.userInfo?.unionid || '',
						headimgurl: userInfo.wechatUserInfo?.headimgurl || userInfo.userInfo?.headimgurl || '',
						// ✅ 保存访客类型信息
						visitorType: userInfo.visitorType || userInfo.userInfo?.visitorType || ''
					};

					// 存储到多个键中
					uni.setStorageSync('userInfo', finalUserInfo);
					uni.setStorageSync('loginInfo', finalUserInfo);
					uni.setStorageSync('user', finalUserInfo);

					// 根据角色存储到特定键中
					if (finalUserInfo.role === 'patrol') {
						uni.setStorageSync('patrolInfo', finalUserInfo);
					} else if (finalUserInfo.role === 'manager') {
						uni.setStorageSync('managerInfo', finalUserInfo);
					}

					// 🆕 更新userBasicInfo，确保包含最新的完整信息
					const updatedUserBasicInfo = {
						phone: finalUserInfo.phone,
						nickname: finalUserInfo.nickname,
						openid: finalUserInfo.openid,
						unionid: finalUserInfo.unionid,
						headimgurl: finalUserInfo.headimgurl,
						role: finalUserInfo.role,
						roleText: finalUserInfo.roleText,
						yardName: finalUserInfo.yardName,
						userName: finalUserInfo.userName,
						timestamp: Date.now()
					};
					uni.setStorageSync('userBasicInfo', updatedUserBasicInfo);

					console.log('💾 [用户信息存储] 用户信息已保存到所有存储键');
					console.log('📋 [用户信息存储] 存储的信息包含小区名称:', finalUserInfo.yardName);
					console.log('📋 [用户信息存储] 存储的用户名称:', finalUserInfo.userName);
					console.log('💾 [用户信息存储] 存储的微信昵称:', finalUserInfo.nickname);
					console.log('💾 [用户信息存储] 存储的openid:', finalUserInfo.openid);
					console.log('💾 [用户信息存储] 完成，已包含微信信息');
				}

				// 对于审核未通过的状态，不算登录失败
				const unapprovedRoles = ['pending', 'rejected', 'unregistered', 'disabled', 'suspended'];
				if (!loginResult.success && !unapprovedRoles.includes(authData.role)) {
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
			} catch (error) {
				console.error('保存用户信息失败:', error);
				throw error;
			}
		},

		/**
		 * 🆕 保存到 user_mapper 数据表
		 */
		async saveToUserMapper(wechatUserInfo, phone, role) {
			try {
				console.log('💾 [user_mapper] 开始保存到 user_mapper');
				
				// 参数验证
				if (!wechatUserInfo || !wechatUserInfo.nickname || !wechatUserInfo.nickname.trim()) {
					console.warn('⚠️ [user_mapper] 微信昵称为空，跳过保存');
					return;
				}

				// 先检查昵称是否已存在于 user_mapping 表中
				const existsResponse = await uni.request({
					// url: 'https://www.xuerparking.cn:8543/parking/user/checkNicknameExists',
					 url: 'https://www.xuerparking.cn:8543/parking/user/checkNicknameExists',
					method: 'POST',
					data: {
						nickname: wechatUserInfo.nickname.trim()
					},
					header: {
						'content-type': 'application/json'
					}
				});
				
				console.log("wechatUserInfo.nickname", wechatUserInfo.nickname);
				console.log("wechatUserInfo.openid", wechatUserInfo.openid);
				console.log("checkNicknameExists返回", existsResponse.data);
				
				// 检查返回格式并兼容两种响应类型
				const isSuccess = (existsResponse.data.code === "0") || (existsResponse.data.resultCode === 0);
				const exists = existsResponse.data.data.data?.exists || false;
				
				console.log("isSuccess:", isSuccess, "exists:", exists );

				// 只有昵称已存在时，才更新手机号
				if (isSuccess && exists) {
					console.log('✅ [user_mapper] 昵称已存在（记录数: ' + existsResponse.data.data.data?.count + '），开始更新手机号');

					// 更新用户手机号
					const saveResponse = await uni.request({
						url: 'https://www.xuerparking.cn:8543/parking/user/updatePhone',
						method: 'POST',
						data: {
							openid: wechatUserInfo.openid,
							nickname: wechatUserInfo.nickname || '',
							phone: phone
						},
						header: {
							'content-type': 'application/json'
						}
					});

					console.log("saveResponse", saveResponse);

					if (saveResponse.data && saveResponse.data.code === "0") {
						console.log('✅ [user_mapper] 手机号已成功更新到 user_mapper');
					} else {
						console.error('❌ [user_mapper] 更新失败:', saveResponse.data?.msg);
					}
				} else {
					console.log('ℹ️ [user_mapper] 昵称不存在于user_mapping表中，不更新手机号');
				}

			} catch (error) {
				console.error('❌ [user_mapper] 保存异常:', error);
				// 这里不抛出错误，避免影响主流程
			}
		},

		// 根据角色跳转到首页
		async navigateToHome(role) {
			try {
				// 🔥 在跳转前检查公众号关注状态
				// await this.checkAndGuideSubscription();

				// 确保TabBar已经设置完成
				await DynamicTabBarManager.setTabBarByRole(role);

				// 定义角色对应的首页
				const homePages = {
					manager: '/pagesA/reservation/searchResult/searchResult', // 管家默认进入预约查询
					patrol: '/pagesE/violation/violation', // 🆕 巡逻员默认进入违章记录页面
					owner: '/pagesA/reservation/form', // 业主默认进入预约页面
					visitor: '/pagesA/reservation/form' // 访客默认进入预约页面
				};

				let homePage = homePages[role];

				// 🆕 巡逻员特殊处理：强制跳转到违章记录页面
				if (role === 'patrol') {
					homePage = '/pagesE/violation/violation';
					console.log('👮‍♂️ [巡逻员跳转] 强制跳转到违章记录页面:', homePage);
				}

				if (!homePage) {
					console.warn(`⚠️ 未找到角色 ${role} 对应的首页，使用默认页面`);
					homePage = '/pagesA/reservation/form';
				}

				// 🚀 修复：从本地存储读取扫码地址信息
				const scannedAddressInfo = uni.getStorageSync('scannedAddressInfo') || {};

				// 🚀 修复：优化参数传递逻辑，确保qrId优先传递
				const params = [];

				// 🎯 第一优先级：qrId参数（访客二维码最重要）
				// 优先从scannedAddressInfo读取，如果没有再从this.scannedParams读取
				const qrId = scannedAddressInfo.qrId || (this.scannedParams && this.scannedParams.qrId);
				if (qrId) {
					params.push(`qrId=${encodeURIComponent(qrId)}`);
					console.log('🔑 [参数传递] qrId优先传递:', qrId);
				}

				// 🏢 第二优先级：地址相关参数
				// 检查是否有任何地址信息（从scannedAddressInfo或this.scannedParams）
				const hasAddressInfo = scannedAddressInfo.building || scannedAddressInfo.unit ||
					scannedAddressInfo.floor || scannedAddressInfo.room || scannedAddressInfo.community ||
					(this.scannedParams && (this.scannedParams.building || this.scannedParams.unit ||
						this.scannedParams.floor || this.scannedParams.room || this.scannedParams.community || this.scannedParams.applyKind || this.scannedParams.butlerId || this.scannedParams.patrolId));

				if (hasAddressInfo) {
					const applyKind = scannedAddressInfo.applyKind || (this.scannedParams && this.scannedParams.applyKind);
					const patrolId = scannedAddressInfo.patrolId || (this.scannedParams && this.scannedParams.patrolId);
					const butlerId = scannedAddressInfo.butlerId || (this.scannedParams && this.scannedParams.butlerId);
					if (applyKind) params.push(`applyKind=${encodeURIComponent(applyKind)}`);
					if (patrolId) params.push(`patrolId=${encodeURIComponent(patrolId)}`);
					if (butlerId) params.push(`butlerId=${encodeURIComponent(butlerId)}`);
					// 按重要性顺序添加参数，优先使用scannedAddressInfo的值
					const community = scannedAddressInfo.community || (this.scannedParams && this.scannedParams.community);
					const building = scannedAddressInfo.building || (this.scannedParams && this.scannedParams.building);
					const unit = scannedAddressInfo.unit || (this.scannedParams && this.scannedParams.unit);
					const floor = scannedAddressInfo.floor || (this.scannedParams && this.scannedParams.floor);
					const room = scannedAddressInfo.room || (this.scannedParams && this.scannedParams.room);
					const visitorPhone = scannedAddressInfo.visitorPhone || (this.scannedParams && this.scannedParams.phone);
					const butlerName = scannedAddressInfo.butlerName || (this.scannedParams && this.scannedParams.butlerName);
					const butlerPhone = scannedAddressInfo.butlerPhone || (this.scannedParams && this.scannedParams.butlerPhone);

					if (community) params.push(`community=${encodeURIComponent(community)}`);
					if (building) params.push(`building=${encodeURIComponent(building)}`);
					if (unit) params.push(`unit=${encodeURIComponent(unit)}`);
					if (floor) params.push(`floor=${encodeURIComponent(floor)}`);
					if (room) params.push(`room=${encodeURIComponent(room)}`);
					if (visitorPhone) params.push(`visitorPhone=${encodeURIComponent(visitorPhone)}`);
					if (butlerName) params.push(`butlerName=${encodeURIComponent(butlerName)}`);
					if (butlerPhone) params.push(`butlerPhone=${encodeURIComponent(butlerPhone)}`);
				}

				// 🔗 构建完整URL
				if (params.length > 0) {
					homePage += '?' + params.join('&');
				}

				// 🆕 修复：统一使用reLaunch，确保参数传递一致性
				// 但为巡逻员保留特殊处理，如果reLaunch失败则使用redirectTo
				const navigationOptions = {
					url: homePage,
					success: () => {
						console.log('✅ 页面跳转成功');
						console.log('🔍 [跳转成功] 传递的URL:', homePage);

						// 显示欢迎信息
						const self = this;
						setTimeout(() => {
							const roleTexts = {
								manager: '管家',
								patrol: '巡逻员',
								owner: '业主',
								visitor: '访客'
							};
							const roleText = roleTexts[role] || '用户';
							const welcomeMessages = {
								manager: '🎉 欢迎管家！',
								patrol: '👮‍♂️ 欢迎巡逻员！',
								owner: '🏠 欢迎业主！',
								visitor: '🚗 欢迎访客！'
							};
							const welcomeMessage = welcomeMessages[role] || '🎉 欢迎您！';

							// 如果有扫码参数，显示地址信息
							// 从本地存储和scannedParams中获取地址信息
							const storedAddressInfo = uni.getStorageSync('scannedAddressInfo') || {};
							const hasAddressFromStorage = storedAddressInfo.building || storedAddressInfo.unit ||
								storedAddressInfo.floor || storedAddressInfo.room;
							const hasAddressFromParams = self.scannedParams && (self.scannedParams.building ||
								self.scannedParams.unit || self.scannedParams.floor || self.scannedParams.room);

							if (hasAddressFromStorage || hasAddressFromParams) {
								let addressInfo = '';
								const building = storedAddressInfo.building || (self.scannedParams && self.scannedParams.building);
								const unit = storedAddressInfo.unit || (self.scannedParams && self.scannedParams.unit);
								const floor = storedAddressInfo.floor || (self.scannedParams && self.scannedParams.floor);
								const room = storedAddressInfo.room || (self.scannedParams && self.scannedParams.room);

								if (building) addressInfo += building + '栋';
								if (unit) addressInfo += unit + '单元';
								if (floor) addressInfo += floor + '楼';
								if (room) addressInfo += room + '室';

								if (addressInfo) {
									uni.showToast({
										title: `${welcomeMessage}\n地址已自动填充: ${addressInfo}`,
										icon: 'success',
										duration: 2500
									});
								} else {
									uni.showToast({
										title: welcomeMessage,
										icon: 'success',
										duration: 1500
									});
								}
							} else {
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
						console.error('🔍 [跳转失败] 尝试的URL:', homePage);// 处理跳转失败的情况	
					}
				};

				// 执行页面跳转
				uni.reLaunch(navigationOptions);

			} catch (error) {
				console.error('❌ TabBar设置失败:', error);

				// 即使TabBar设置失败，也要跳转
				const defaultPages = {
					manager: '/pagesA/reservation/searchResult/searchResult',
					patrol: '/pagesE/violation/violation', // 🆕 巡逻员默认页面
					owner: '/pagesA/reservation/form',
					visitor: '/pagesA/reservation/form'
				};
				const defaultPage = defaultPages[role] || '/pagesA/reservation/form';

				uni.reLaunch({
					url: defaultPage
				});
			}
		},

		// 跳转到访客申请页面
		navigateToVisitorApply(phone) {
			console.log('🚀 跳转到访客申请页面，手机号:', phone);

			// 先保存手机号到本地存储，供申请页面使用
			const tempUserInfo = {
				phone: phone,
				isAuthorized: false,
				role: 'unregistered',
				tempApply: true // 标记为临时申请状态
			};

			try {
				uni.setStorageSync('userInfo', tempUserInfo);
			} catch (error) {
				console.error('保存临时用户信息失败:', error);
			}

			// 隐藏当前加载状态
			this.completeProgress();
			this.showLoading = false;
			this.loading = false;

			// 跳转到访客申请页面
			uni.navigateTo({
				url: '/pagesD/auth/visitor-apply',
				success: () => {
					console.log('✅ 成功跳转到访客申请页面');

					// 显示友好提示
					setTimeout(() => {
						uni.showToast({
							title: '请填写申请信息',
							icon: 'none',
							duration: 2000
						});
					}, 500);
				},
				fail: (err) => {
					console.error('❌ 跳转访客申请页面失败:', err);

					// 跳转失败的处理
					uni.showModal({
						title: '跳转失败',
						content: '无法打开申请页面，请重试或联系管理员',
						showCancel: true,
						cancelText: '重试',
						confirmText: '联系管理员',
						success: (res) => {
							if (res.cancel) {
								// 用户选择重试
								this.navigateToVisitorApply(phone);
							} else {
								// 显示联系方式
								uni.showModal({
									title: '联系管理员',
									content: '请联系停车场现场管理员\n或扫描停车场内的客服二维码',
									showCancel: false,
									confirmText: '知道了'
								});
							}
						}
					});
				}
			});
		},

		// 处理授权错误
		handleAuthError(error) {
			console.error('🚨 授权错误详情:', error);

			if (error.message && error.message.includes('用户取消选择')) {
				// 用户取消了角色选择，不显示错误
				return;
			}

			// 🔧 增强：处理来自后端验证的具体错误信息
			if (error.message && (error.message.includes('手机号不匹配') || error.message.includes('管家不存在'))) {
				uni.showModal({
					title: '❌ 身份验证失败',
					content: '您的手机号与该管家信息不匹配。\n\n可能原因：\n• 您不是该管家\n• 管家信息已更新\n• 二维码信息错误\n\n请确认您是否为该管家，或联系管理员确认您的管家身份。',
					showCancel: true,
					cancelText: '我知道了',
					confirmText: '联系管理员',
					success: (res) => {
						if (res.confirm) {
							uni.showModal({
								title: '🔧 解决方案',
								content: '请通过以下方式解决：\n\n1️⃣ 确认管家身份\n• 确认您是该小区的管家\n• 检查您的手机号是否正确\n\n2️⃣ 联系管理员\n• 联系物业管理员\n• 更新管家信息\n• 重新绑定手机号\n\n3️⃣ 技术支持\n• 如果问题持续存在\n• 请提供错误信息给技术人员',
								showCancel: false,
								confirmText: '知道了'
							});
						}
					}
				});
				return;
			}

			// 🆕 新增：处理巡逻员验证失败的错误
			if (error.message && (error.message.includes('巡逻员') || error.message.includes('二维码不匹配'))) {
				uni.showModal({
					title: '❌ 巡逻员身份验证失败',
					content: error.message || '您不是该巡逻员，无法使用此巡逻员二维码。\n\n可能原因：\n• 您不是该巡逻员\n• 巡逻员信息已更新\n• 二维码信息错误\n\n请确认您是否为该巡逻员，或联系管理员确认您的巡逻员身份。',
					showCancel: true,
					cancelText: '我知道了',
					confirmText: '联系管理员',
					success: (res) => {
						if (res.confirm) {
							uni.showModal({
								title: '🔧 解决方案',
								content: '请通过以下方式解决：\n\n1️⃣ 确认巡逻员身份\n• 确认您是该小区的巡逻员\n• 检查您的手机号是否正确\n\n2️⃣ 联系管理员\n• 联系物业管理员\n• 更新巡逻员信息\n• 重新绑定手机号\n\n3️⃣ 技术支持\n• 如果问题持续存在\n• 请提供错误信息给技术人员',
								showCancel: false,
								confirmText: '知道了'
							});
						}
					}
				});
				return;
			}

			// 🆕 新增：处理小区信息不一致的错误
			if (error.message && error.message.includes('小区信息不一致')) {
				uni.showModal({
					title: '❌ 小区信息不匹配',
					content: error.message,
					showCancel: false,
					confirmText: '我知道了',
					success: () => {
						// 显示具体的解决建议
						uni.showModal({
							title: '解决建议',
							content: '请通过以下方式解决：\n\n1. 确认您扫描的是正确小区的二维码\n2. 联系对应小区的管家获取正确的预约二维码\n3. 如果您是该小区的业主，请联系物业确认您的管家信息',
							showCancel: false,
							confirmText: '好的'
						});
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
				content: '如果持续遇到问题，您可以：\n\n🔧 技术支持\n• 重启小程序后重试\n• 清除小程序缓存\n• 更新到最新版本\n\n📞 联系我们\n• 联系停车场管理员\n• 反馈问题给技术团队',
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

		// 处理初始化错误
		handleInitError(error) {
			console.error('页面初始化错误:', error);

			// 尝试重置页面状态
			this.loading = false;
			this.showLoading = false;
			this.loadingText = '正在授权...';

			// 可选：显示错误提示（但不要太频繁）
			if (!this._errorShown) {
				this._errorShown = true;
				// 保存this上下文
				const self = this;
				setTimeout(() => {
					uni.showToast({
						title: '页面加载完成',
						icon: 'success',
						duration: 1000
					});
					self._errorShown = false;
				}, 1000);
			}
		},

		// 协议同意状态变更
		onAgreeChange(e) {
			this.agreeTerms = e.detail.value.includes('agree');
			console.log('协议同意状态:', this.agreeTerms);

			// 如果用户勾选了协议，隐藏提示
			if (this.agreeTerms && this.showAgreementTip) {
				this.hideAgreementTip();
			}
		},

		// 显示协议提示并抖动
		showAgreementTipAndShake() {
			// 显示提示框
			this.showAgreementTip = true;

			// 触发抖动动画
			this.agreementShaking = true;

			// 保存this上下文
			const self = this;

			// 3秒后自动隐藏提示
			setTimeout(() => {
				self.hideAgreementTip();
			}, 3000);

			// 抖动动画持续0.6秒
			setTimeout(() => {
				self.agreementShaking = false;
			}, 600);
		},

		// 隐藏协议提示
		hideAgreementTip() {
			this.showAgreementTip = false;
			this.agreementShaking = false;
		},

		// 显示用户服务协议
		showServiceAgreement() {
			this.currentAgreementTitle = '用户服务协议';
			this.currentAgreementContent = this.serviceAgreementContent;
			this.showAgreementModal = true;
		},

		// 显示隐私政策
		showPrivacyPolicy() {
			this.currentAgreementTitle = '隐私政策';
			this.currentAgreementContent = this.privacyPolicyContent;
			this.showAgreementModal = true;
		},

		// 关闭协议查看弹窗
		closeAgreementModal() {
			this.showAgreementModal = false;
			this.currentAgreementTitle = '';
			this.currentAgreementContent = '';
		},

		// 智能协议确认 - 只有未勾选时才自动勾选
		onAgreementConfirm() {
			// 如果协议未勾选，点击"我已阅读"时自动勾选
			if (!this.agreeTerms) {
				this.agreeTerms = true;
				console.log('阅读协议后自动勾选');

				// 隐藏提示（如果有）
				if (this.showAgreementTip) {
					this.hideAgreementTip();
				}
			}

			// 关闭弹窗
			this.closeAgreementModal();
		},

		// 继续访客登录流程
		async continueLogin(visitorResult) {
			try {
				// 第三步：设置用户信息
				this.updateStage(3, 85, `✅ 访客身份确认完成\n正在为您设置用户信息...`);

				// 保存用户信息
				const loginResult = await this.saveUserInfo(visitorResult);

				// 第四步：完成设置
				// 只有受邀访客和外来访客显示欢迎信息
				const visitorType = visitorResult.visitorType || 'unknown';
				const showWelcome = visitorType === 'invited' || visitorType === 'external';
				
				if (showWelcome) {
					this.updateStage(4, 95, `🎉 欢迎您，${visitorResult.roleText}！\n正在进入停车服务...`);

					// 显示访客身份验证成功提示
					uni.showToast({
						title: '🚗 访客身份验证成功！',
						icon: 'success',
						duration: 2000
					});
				} else {
					this.updateStage(4, 95, `正在进入停车服务...`);
				}

				// 保存this上下文，避免在嵌套setTimeout中丢失
				const self = this;

				// 延迟一下让用户看到成功状态
				setTimeout(() => {
					// 最终完成进度
					self.completeProgress();

					// 只有受邀访客和外来访客显示权限提示
					if (showWelcome) {
						uni.showToast({
							title: '您可以申请访客预约、查看个人记录',
							icon: 'none',
							duration: 2500,
							mask: false
						});

						// 再延迟一下跳转
						setTimeout(() => {
							self.navigateToHome(visitorResult.role);
						}, 1000);
					} else {
						// 未知访客或其他情况直接跳转
						setTimeout(() => {
							self.navigateToHome(visitorResult.role);
						}, 500);
					}
				}, 1500);

			} catch (error) {
				console.error('🚨 访客登录失败:', error);

				// 重置进度追踪
				this.resetProgress();

				// 隐藏加载状态
				this.showLoading = false;
				this.loading = false;

				// 处理登录错误
				this.handleAuthError(error);
			}
		},


		// 开发调试：清除授权状态
		clearAuth() {
			uni.showModal({
				title: '确认清除',
				content: '确定要清除授权状态吗？清除后需要重新授权登录。\n\n同时会清除公众号关注状态。',
				success: (res) => {
					if (res.confirm) {
						// 清除本地存储
						uni.removeStorageSync('userInfo');

						// 清除公众号关注状态
						uni.removeStorageSync('hasSubscribedOfficial');

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

						console.log('授权状态和公众号关注状态已清除');

						// 提示如何测试公众号关注页面
						setTimeout(() => {
							// uni.showModal({
							// 	title: '测试提示',
							// 	content: '如需测试公众号关注页面，可以：\n\n1. 在开发环境下设置:\nuni.setStorageSync("forceShowSubscription", "true")\n\n2. 然后重新授权登录',
							// 	showCancel: false,
							// 	confirmText: '知道了'
							// });
						}, 1000);
					}
				}
			});
		},







		// 用户点击继续
		continueAuth() {
			// 暂时注释掉公众号关注检查功能
			console.log('continueAuth 方法被调用，但已暂时禁用');
			return;

			// // 获取当前存储的openid
			// const openid = uni.getStorageSync('userOpenid');
			//
			// if (!openid) {
			// 	// 如果没有openid，无法检查关注状态，显示提示
			// 	uni.showModal({
			// 		title: '无法验证关注状态',
			// 		content: '无法获取您的微信账号信息，请重新授权后再试。',
			// 		showCancel: false,
			// 		confirmText: '我知道了'
			// 	});
			// 	return;
			// }

			// 再次检查用户是否已关注公众号
			// this.checkUserSubscription(openid).then(result => {
			// 	if (result.isFollowed) {
			// 		// 用户已关注，继续流程
			// 		this.showSubscriptionComponent = false;
			// 		this.subscriptionActionResolved = true;

			// 		// 记录用户已关注状态到本地存储
			// 		try {
			// 			uni.setStorageSync('hasSubscribedOfficial', 'true');
			// 			console.log('已记录用户关注状态');
			// 		} catch (error) {
			// 			console.error('保存关注状态失败:', error);
			// 		}

			// 		// 记录用户操作
			// 		this.logSubscriptionAction('subscribed');

			// 		if (this.subscriptionActionResolver) {
			// 			this.subscriptionActionResolver();
			// 		}
			// 	} else {
			// 		// 用户未关注，显示强制关注提示
			// 		uni.showModal({
			// 			title: '关注公众号',
			// 			content: '您必须关注公众号才能继续使用停车服务。请扫描二维码关注后再点击"我已关注"按钮。',
			// 			showCancel: false,
			// 			confirmText: '我知道了'
			// 		});

			// 		// 确保二维码显示
			// 		this.showQrcodeFallback = true;
			// 	}
			// }).catch(error => {
			// 	console.error('检查关注状态失败:', error);
			//
			// 	// 出错时，显示提示
			// 	uni.showModal({
			// 		title: '检查关注状态失败',
			// 		content: '无法验证您是否已关注公众号，请确保您已扫码关注后再继续。',
			// 		showCancel: false,
			// 		confirmText: '我已关注'
			// 	});
			// });
		},

		// 检查是否应该提醒用户关注公众号
		shouldRemindSubscription() {
			// 暂时注释掉公众号关注功能，直接返回false
			return false;

			// // 如果在开发环境或者特定场景下，不强制要求关注公众号
			// // #ifdef MP-WEIXIN
			// try {
			// 	const accountInfo = uni.getAccountInfoSync();
			// 	const envType = accountInfo.miniProgram.envVersion;

			// 	// 在开发或体验版环境中不强制要求关注
			// 	if (envType === 'develop' || envType === 'trial') {
			// 		console.log('当前为开发/体验版环境，跳过公众号关注要求');
			// 		// 开发环境下可以通过设置强制显示来测试
			// 		const forceShow = uni.getStorageSync('forceShowSubscription');
			// 		if (forceShow === 'true') {
			// 			console.log('强制显示公众号关注页面（开发测试）');
			// 			return true;
			// 		}
			// 		return false;
			// 	}
			// } catch (error) {
			// 	console.error('获取小程序环境信息失败:', error);
			// }
			// // #endif

			// // 此处不再检查本地存储，因为我们已经通过API检查了用户是否关注公众号
			// // 我们已经在checkOfficialAccountFollowed方法中更新了hasSubscribedOfficial
			// // 所以这里直接返回false，避免重复显示关注页面
			// return false;
		},

		// 检查当前场景值并判断是否支持公众号组件
		checkCurrentScene() {
			try {
				// #ifdef MP-WEIXIN
				const launchOptions = wx.getLaunchOptionsSync();
				this.currentScene = launchOptions.scene;
				console.log('当前场景值:', this.currentScene);

				// 检查是否为开发环境
				try {
					const accountInfo = uni.getAccountInfoSync();
					const envType = accountInfo.miniProgram.envVersion;
					this.isDevelopEnv = (envType === 'develop' || envType === 'trial');
					console.log('当前环境:', envType, '是否为开发环境:', this.isDevelopEnv);
				} catch (e) {
					console.error('获取小程序环境信息失败:', e);
				}

				// 支持公众号组件的场景值列表
				const supportedScenes = [1007, 1008, 1036, 1044, 1058, 1067, 1084, 1089, 1090];

				// 我们现在使用API检查用户是否关注公众号，所以不再依赖组件
				// 但仍然设置这个标志，用于决定是显示组件还是二维码
				this.isOfficialAccountSupported = supportedScenes.includes(this.currentScene);

				console.log('是否支持公众号组件:', this.isOfficialAccountSupported);

				// 如果不支持组件，直接显示二维码备选方案
				if (!this.isOfficialAccountSupported) {
					this.showQrcodeFallback = true;
					console.log('当前场景不支持公众号组件，将显示二维码备选方案');
				}
				// #endif

				// 非微信环境下默认不支持
				// #ifndef MP-WEIXIN
				this.isOfficialAccountSupported = false;
				this.showQrcodeFallback = true;
				// #endif
			} catch (error) {
				console.error('获取场景值失败:', error);
				// 出错时默认不支持
				this.isOfficialAccountSupported = false;
				this.showQrcodeFallback = true;
			}
		},
		// 强制显示公众号关注页面
		forceShowSubscription() {
			// 设置强制显示标志
			uni.setStorageSync('forceShowSubscription', 'true');

			// 清除已关注状态
			uni.removeStorageSync('hasSubscribedOfficial');

			// 清除强制跳过标志
			uni.removeStorageSync('forceSkipSubscription');

		},

		// 强制跳过公众号关注
		forceSkipSubscription() {
			// 设置强制跳过标志
			uni.setStorageSync('forceSkipSubscription', 'true');

			// 设置已关注状态
			uni.setStorageSync('hasSubscribedOfficial', 'true');
		},

		// 新增方法：检查用户是否关注了公众号
		async checkOfficialAccountFollowed(code) {
			try {
				console.log('🔍 开始检查用户是否关注公众号...');

				// 1. 通过code获取用户openid
				const openidResult = await this.getOpenidByCode(code);
				if (!openidResult.success) {
					console.error('❌ 获取openid失败:', openidResult.message);
					return false;
				}

				const openid = openidResult.openid;
				console.log('✅ 获取openid成功:', openid);

				// 保存openid到本地存储，以便后续使用
				uni.setStorageSync('userOpenid', openid);

				// 2. 调用后端接口检查用户是否关注了公众号
				const checkResult = await this.checkUserSubscription(openid);

				console.log('📊 公众号关注检查结果:', checkResult);

				// 如果已关注，更新本地存储状态
				if (checkResult.isFollowed) {
					uni.setStorageSync('hasSubscribedOfficial', 'true');
				}

				return checkResult.isFollowed;
			} catch (error) {
				console.error('❌ 检查公众号关注状态失败:', error);

				// 出错时默认未关注，让用户看到关注页面
				return false;
			}
		},

		// 通过code获取用户openid
		async getOpenidByCode(code) {
			try {
				// 调用后端接口获取openid
				const apiConfig = require('@/config/api.js');
				const wechatAPI = apiConfig.wechatAPI || apiConfig.default?.wechatAPI;

				if (!wechatAPI || !wechatAPI.getOpenid) {
					throw new Error('API配置中缺少getOpenid方法');
				}

				console.log('🚀 调用后端接口获取openid, code:', code);

				// 调用后端接口
				const result = await wechatAPI.getOpenid({
					code: code
				});

				if (result && result.code === "0" && result.data && result.data.openid) {
					return {
						success: true,
						openid: result.data.openid
					};
				} else {
					return {
						success: false,
						message: result.msg || '获取openid失败'
					};
				}
			} catch (error) {
				console.error('获取openid失败:', error);
				return {
					success: false,
					message: error.message || '获取openid请求异常'
				};
			}
		},

		// 检查用户是否关注了公众号
		async checkUserSubscription(openid) {
			try {
				// 调用后端接口检查用户是否关注公众号
				const apiConfig = require('@/config/api.js');
				const wechatAPI = apiConfig.wechatAPI || apiConfig.default?.wechatAPI;

				if (!wechatAPI || !wechatAPI.checkSubscription) {
					throw new Error('API配置中缺少checkSubscription方法');
				}

				console.log('🚀 调用后端接口检查公众号关注状态, openid:', openid);

				// 调用后端接口
				const result = await wechatAPI.checkSubscription({
					openid: openid
				});

				if (result && result.code === "0") {
					return {
						isFollowed: result.data.isFollowed || false,
						subscribeTime: result.data.subscribeTime || null
					};
				} else {
					console.warn('⚠️ 检查公众号关注状态返回异常:', result);
					return {
						isFollowed: false
					};
				}
			} catch (error) {
				console.error('检查公众号关注状态失败:', error);
				return {
					isFollowed: false,
					error: error.message
				};
			}
		},

		// 🔒 检查访客二维码使用状态
		async checkVisitorQrCodeUsage(qrId) {
			try {
				console.log('🔍 检查访客二维码使用状态:', qrId);

				// 获取用户信息
				const userInfo = uni.getStorageSync('userInfo');
				const openid = userInfo?.userInfo?.openid || userInfo?.openid || 'visitor_temp';

				// 调用后端接口检查二维码使用状态
				const response = await request({
					url: '/parking/qrcode/checkUsed',
					method: 'GET',
					data: {
						qrId: qrId,
						openid: openid
					}
				});

				console.log('🔍 二维码使用状态检查响应:', response);

				if (response.data.code === '0' && response.data.data) {
					if (response.data.data.used) {
						// 二维码已被使用，立即显示锁定界面并阻止继续
						console.warn('🔒 访客二维码已被使用，立即拒绝访问');

						// 保存this上下文
						const self = this;
						// 立即显示错误提示
						setTimeout(() => {
							self.showQrCodeUsedError(qrId, response.data.data);
						}, 100);

						return false;
					} else {
						// 二维码未使用，允许继续
						console.log('✅ 访客二维码未使用，允许继续');
						return true;
					}
				} else {
					console.warn('❌ 检查二维码使用状态失败:', response.msg);
					// 保存this上下文
					const self = this;
					// 检查失败时，为了安全起见，也显示错误
					setTimeout(() => {
						self.showQrCodeCheckError(response.msg || '检查二维码状态失败');
					}, 100);
					return false;
				}

			} catch (error) {
				console.error('❌ 检查访客二维码使用状态时发生异常:', error);
				// 保存this上下文
				const self = this;
				// 网络错误时，为了安全起见，也显示错误
				setTimeout(() => {
					self.showQrCodeCheckError('网络异常，无法验证二维码状态');
				}, 100);
				return false;
			}
		},

		// 🔒 显示二维码已使用错误
		showQrCodeUsedError(qrId, usageData) {
			const usedTime = usageData.usedTime ? new Date(usageData.usedTime).toLocaleString() : '未知时间';

			// 立即隐藏页面内容，显示锁定状态
			this.isPageLocked = true;

			uni.showModal({
				title: '🔒 二维码已使用',
				content: `此访客二维码已被使用，无法重复使用。\n\n📅 使用时间：${usedTime}\n🆔 二维码ID：${qrId}\n\n⚠️ 每个访客二维码只能使用一次，请联系管家重新生成二维码。`,
				showCancel: false,
				confirmText: '知道了',
				success: () => {
				},
				fail: () => {
				}
			});
		},

		// 🔒 显示二维码检查错误
		showQrCodeCheckError(message) {
			uni.showModal({
				title: '二维码验证失败',
				content: `无法验证二维码状态：${message}\n\n为了安全起见，请重新扫描二维码或联系管家。`,
				showCancel: false,
				confirmText: '知道了',
				success: () => {
					// 跳转回首页或关闭页面
					uni.navigateBack({
						fail: () => {
							uni.reLaunch({
								url: '/pages/index/index'
							});
						}
					});
				}
			});
		}
	},


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

.scanned-info {
	background: #e6f7ff;
	color: #1677ff;
	border-radius: 12rpx;
	padding: 20rpx;
	margin-bottom: 30rpx;
	font-size: 28rpx;
	line-height: 1.8;
}

/* 公众号关注组件样式 */
.subscription-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.6);
	backdrop-filter: blur(8px);
	z-index: 9999;
	display: flex;
	align-items: center;
	justify-content: center;
	animation: fade-in 0.3s ease;
}

.subscription-card {
	background: white;
	width: 80%;
	max-width: 600rpx;
	border-radius: 24rpx;
	padding: 40rpx 30rpx;
	box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.2);
	animation: scale-in 0.3s ease;
}

.card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 30rpx;
}

.card-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
}

.close-btn {
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 32rpx;
	color: #999;
	background: #f7fafc;
	border-radius: 50%;
}

.official-account-container {
	margin: 30rpx 0;
	min-height: 120rpx;
	border: 1px solid #f0f0f0;
	border-radius: 12rpx;
	overflow: hidden;
}

.qrcode-fallback {
	margin: 20rpx 0;
	text-align: center;
	padding: 20rpx;
	background: #f0f8ff;
	border-radius: 16rpx;
	border: 1px solid #d6e8ff;
}

.qrcode-header {
	margin-bottom: 20rpx;
}

.qrcode-title {
	font-size: 30rpx;
	font-weight: 600;
	color: #1677ff;
}

.qrcode-image {
	width: 300rpx;
	height: 300rpx;
	margin: 0 auto;
	border-radius: 8rpx;
	border: 4rpx solid #fff;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.qrcode-tip {
	font-size: 26rpx;
	color: #333;
	margin-top: 20rpx;
	display: block;
	font-weight: 500;
}

.qrcode-note {
	font-size: 24rpx;
	color: #ff7043;
	margin-top: 16rpx;
	display: block;
	background: rgba(255, 112, 67, 0.1);
	padding: 8rpx 0;
	border-radius: 8rpx;
}

.benefits-list {
	margin: 30rpx 0;
}

.benefit-item {
	display: flex;
	align-items: center;
	margin-bottom: 16rpx;
}

.benefit-icon {
	font-size: 32rpx;
	margin-right: 16rpx;
	width: 40rpx;
	text-align: center;
}

.benefit-text {
	font-size: 26rpx;
	color: #666;
	flex: 1;
}

.action-buttons {
	margin-top: 30rpx;
}

.btn-continue {
	width: 100%;
	height: 80rpx;
	background: linear-gradient(135deg, #1677ff 0%, #0958d9 100%);
	color: white;
	border: none;
	border-radius: 40rpx;
	font-size: 28rpx;
	font-weight: 600;
	box-shadow: 0 8rpx 24rpx rgba(22, 119, 255, 0.4);
}

.subscription-note {
	margin-top: 20rpx;
	text-align: center;
	padding: 16rpx;
	background: #f8f9fa;
	border-radius: 12rpx;
	border: 1px dashed #e2e8f0;
}

.subscription-note text {
	display: block;
	font-size: 24rpx;
	color: #718096;
	line-height: 1.6;
}

/* 微信关注提示样式 */
.subscription-tip {
	margin-top: 20rpx;
	padding: 20rpx;
	background: linear-gradient(135deg, #ff9a56 0%, #ff6b6b 100%);
	border-radius: 16rpx;
	display: flex;
	align-items: center;
	gap: 12rpx;
	box-shadow: 0 8rpx 24rpx rgba(255, 107, 107, 0.2);
}

.tip-icon {
	font-size: 32rpx;
	filter: drop-shadow(0 2rpx 4rpx rgba(0, 0, 0, 0.1));
}

.tip-text {
	flex: 1;
	font-size: 26rpx;
	color: white;
	font-weight: 500;
	line-height: 1.4;
}

@keyframes fade-in {
	0% {
		opacity: 0;
	}

	100% {
		opacity: 1;
	}
}

@keyframes scale-in {
	0% {
		opacity: 0;
		transform: scale(0.8);
	}

	100% {
		opacity: 1;
		transform: scale(1);
	}
}

/* 开发工具样式 */
.dev-tools {
	margin-top: 20rpx;
	display: flex;
	justify-content: space-between;
	gap: 20rpx;
}

.dev-button {
	flex: 1;
	font-size: 22rpx;
	height: 60rpx;
	line-height: 60rpx;
	background: #f0f0f0;
	color: #333;
	border: 1px solid #ddd;
	border-radius: 30rpx;
	padding: 0 16rpx;
}

/* 🔒 页面锁定遮罩样式 */
.page-lock-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.8);
	z-index: 9999;
	display: flex;
	align-items: center;
	justify-content: center;
}

.lock-content {
	background: white;
	border-radius: 20rpx;
	padding: 60rpx 40rpx;
	text-align: center;
	box-shadow: 0 20rpx 40rpx rgba(0, 0, 0, 0.3);
	max-width: 600rpx;
	margin: 0 40rpx;
}

.lock-icon {
	font-size: 120rpx;
	display: block;
	margin-bottom: 30rpx;
}

.lock-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #ff4757;
	display: block;
	margin-bottom: 20rpx;
}

.lock-message {
	font-size: 28rpx;
	color: #666;
	display: block;
	line-height: 1.5;
}

/* 🆕 授权步骤样式 */
.auth-steps {
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 40rpx 0;
	padding: 0 40rpx;
}

.step-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	opacity: 0.5;
	transition: all 0.3s ease;

	&.active {
		opacity: 1;
	}

	&.completed {
		opacity: 1;

		.step-number {
			background: linear-gradient(135deg, #1677ff, #1890ff);
			color: white;

			&::after {
				content: '✓';
				position: absolute;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				font-size: 24rpx;
			}
		}
	}
}

.step-number {
	width: 60rpx;
	height: 60rpx;
	border-radius: 50%;
	border: 4rpx solid #e8e8e8;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 28rpx;
	font-weight: 600;
	color: #999;
	background: white;
	position: relative;
	margin-bottom: 16rpx;
	transition: all 0.3s ease;
}

.step-item.active .step-number {
	border-color: #1677ff;
	color: #1677ff;
}

.step-text {
	font-size: 24rpx;
	color: #666;
	text-align: center;
}

.step-item.active .step-text {
	color: #1677ff;
	font-weight: 500;
}

.step-divider {
	flex: 1;
	height: 2rpx;
	background: #e8e8e8;
	margin: 0 30rpx;
	position: relative;
	top: -30rpx;

	&.active {
		background: linear-gradient(to right, #1677ff, #e8e8e8);
	}
}

/* 🆕 微信授权按钮样式 */
.wechat-auth-button {
	background: linear-gradient(135deg, #07c160, #06ae56);

	&:hover {
		background: linear-gradient(135deg, #06ae56, #059048);
	}

	&.loading {
		background: linear-gradient(135deg, #06ae56, #059048);
	}
}
</style>