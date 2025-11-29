<template>
	<view class="apply-container">
		<view class="header">
			<text class="title">申请访客身份</text>
			<text class="subtitle">请填写您的基本信息，管理员审核通过后即可使用访客功能</text>
		</view>

		<view class="form-container">
			<view class="form-item">
				<text class="label">姓名 *</text>
				<input class="input" v-model="form.nickname" placeholder="请输入您的真实姓名" maxlength="20" />
			</view>

			<view class="form-item">
				<text class="label">手机号 *</text>
				<input class="input readonly" v-model="form.phone" placeholder="手机号" disabled />
				<text class="tip">系统自动获取，不可修改</text>
			</view>

			<view class="form-item">
				<text class="label">访问业主手机号 *</text>
				<view class="owner-phone-container">
					<input class="input owner-phone-input" v-model="form.ownerPhone" placeholder="请输入要访问的业主手机号"
						maxlength="11" type="number" @input="onOwnerPhoneInput" @blur="onOwnerPhoneBlur" />
					<view class="verify-status" v-if="ownerVerifyStatus">
						<text v-if="ownerVerifyStatus === 'verifying'" class="status verifying">验证中...</text>
						<text v-else-if="ownerVerifyStatus === 'valid'" class="status valid">✓ 已验证</text>
						<text v-else-if="ownerVerifyStatus === 'invalid'" class="status invalid">✗ 非本小区业主</text>
						<text v-else-if="ownerVerifyStatus === 'error'" class="status error">验证失败</text>
					</view>
				</view>
				<text class="tip">请输入要访问的业主手机号，失焦后自动验证或点击验证按钮</text>

				<!-- 优化后的操作按钮 -->
				<view class="action-buttons" style="margin-top: 20rpx;">
					<!-- 只有在需要验证或验证失败时才显示验证按钮 -->
					<button
						v-if="!ownerVerifyStatus || ownerVerifyStatus === 'invalid' || ownerVerifyStatus === 'error'"
						class="verify-btn" @click="manualValidateOwnerPhone" :disabled="!canManualVerify" size="mini"
						type="primary" style="font-size: 26rpx; padding: 12rpx 24rpx; margin-right: 20rpx;">
						{{ getVerifyButtonText() }}
					</button>

					<!-- 验证成功后显示重新验证按钮 -->
					<button v-if="ownerVerifyStatus === 'valid'" class="re-verify-btn" @click="reVerifyOwner"
						size="mini" type="default" style="font-size: 24rpx; padding: 10rpx 20rpx; margin-right: 20rpx;">
						🔄 重新验证
					</button>

					<!-- 状态显示 -->
					<text style="font-size: 24rpx; color: #666; align-self: center;">
						{{ getStatusText() }}
					</text>
				</view>

				<view v-if="ownerInfo.name" class="owner-info">
					<text class="owner-detail">业主姓名：{{ ownerInfo.name }}</text>
					<text class="owner-detail">地址：{{ ownerInfo.address }}</text>
				</view>
			</view>

			<view class="form-item">
				<text class="label">性别</text>
				<radio-group @change="onGenderChange" class="gender-radio-group">
					<label class="gender-option" :class="{ active: form.gender === '男' }">
						<radio value="男" :checked="form.gender === '男'" color="#1677ff" />
						<text class="gender-text">男</text>
					</label>
					<label class="gender-option" :class="{ active: form.gender === '女' }">
						<radio value="女" :checked="form.gender === '女'" color="#1677ff" />
						<text class="gender-text">女</text>
					</label>
				</radio-group>
			</view>

			<view class="form-item">
				<text class="label">身份证号</text>
				<input class="input" v-model="form.idCard" placeholder="请输入身份证号（选填）" maxlength="18" />
			</view>

			<!-- 访问地址选择 -->
			<view class="form-item">
				<text class="label">访问地址 *</text>
				<text class="tip">请选择您要访问的具体地址</text>

				<!-- 当前小区显示 -->
				<view class="current-community">
					<text class="community-label">当前小区：</text>
					<text class="community-name">{{ currentCommunityName }}</text>
				</view>

				<view class="address-selector">
					<!-- 四级地址选择器 -->
					<view class="address-row">
						<text class="address-label">地址：</text>
						<picker mode="multiSelector" :range="addressRange" range-key="name" :value="addressValue"
							@change="onAddressChange" @columnchange="onAddressColumnChange">
							<view class="picker-item multi-selector">
								<text class="picker-text">{{ addressDisplay || '请选择栋、单元、楼层、房间' }}</text>
								<text class="picker-arrow">▼</text>
							</view>
						</picker>
					</view>

					<!-- 完整地址显示 -->
					<view class="full-address" v-if="form.fullAddress">
						<text class="address-preview-label">完整地址：</text>
						<text class="full-address-text">{{ form.fullAddress }}</text>
					</view>


				</view>
			</view>

			<view class="form-item">
				<text class="label">申请原因 *</text>
				<textarea class="textarea" v-model="form.reason" placeholder="请说明申请访客身份的原因，例如：送货、维修等" maxlength="200" />
				<text class="char-count">{{ form.reason.length }}/200</text>
			</view>
		</view>

		<view class="agreement-section">
			<label class="agreement-item">
				<checkbox-group @change="onAgreeChange">
					<checkbox :value="'agree'" :checked="agreeTerms" color="#1677ff" />
				</checkbox-group>
				<text class="agreement-text">
					我已阅读并同意
					<text class="link" @tap="showServiceAgreement">《访客使用协议》</text>
					和
					<text class="link" @tap="showPrivacyPolicy">《隐私政策》</text>
				</text>
			</label>
		</view>

		<view class="button-section">
			<button class="submit-btn" :class="{ disabled: !canSubmit }" :disabled="!canSubmit"
				@click="submitApplication">
				<view v-if="submitting" class="loading-content">
					<view class="loading-dots">
						<view class="dot"></view>
						<view class="dot"></view>
						<view class="dot"></view>
					</view>
					<text>{{ submittingText }}</text>
				</view>
				<text v-else>{{ submitButtonText }}</text>
			</button>

			<button class="cancel-btn" @click="goBack" :disabled="submitting">
				取消
			</button>
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

		<!-- 协议确认弹窗 -->
		<view v-if="showAgreementConfirmModal" class="confirm-modal">
			<view class="confirm-content">
				<view class="confirm-icon">⚠️</view>
				<text class="confirm-title">请先同意用户协议</text>
				<text class="confirm-desc">
					为了使用访客申请功能，您需要先阅读并同意我们的用户协议和隐私政策。
				</text>
				<view class="confirm-buttons">
					<button class="cancel-confirm-btn" @click="closeAgreementConfirmModal">
						暂不同意
					</button>
					<button class="agree-confirm-btn" @click="goToAgreement">
						查看协议
					</button>
				</view>
			</view>
		</view>

		<!-- 提交成功弹窗 -->
		<view v-if="showSuccessModal" class="success-modal">
			<view class="modal-content">
				<view class="success-icon">✅</view>
				<text class="success-title">申请提交成功</text>
				<text class="success-desc">
					您的访客申请已提交，管理员将在1-3个工作日内审核。
					审核结果将通过系统消息通知您。
				</text>
				<button class="confirm-btn" @click="handleSuccessConfirm">
					我知道了
				</button>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				form: {
					nickname: '',
					phone: '',
					ownerPhone: '', // 访问业主手机号
					gender: '男',
					idCard: '',
					reason: '',
					address: '',
					// 地址信息
					addressInfo: {
						province: '',
						city: '',
						district: '',
						community: '',
						building: '',
						units: '',
						floor: '',
						roomnumber: ''
					},
					fullAddress: ''
				},
				// 当前小区信息
				currentCommunityName: '四季上东', // 从登录信息获取
				currentCommunityInfo: {
					province: '', // 从API动态获取
					city: '', // 从API动态获取
					district: '', // 从API动态获取
					community: '四季上东' // 从API动态获取
				},
				// 四级地址选择器数据
				addressRange: [
					[],
					[],
					[],
					[]
				], // [栋, 单元, 楼层, 房间]
				addressValue: [0, 0, 0, 0], // 当前选中的索引
				addressDisplay: '', // 显示文本

				// 原始地址数据结构
				addressData: {},

				// 业主验证相关
				ownerVerifyStatus: '', // 'verifying', 'valid', 'invalid', 'error'
				ownerInfo: { // 验证通过的业主信息
					name: '',
					address: '',
					community: '',
					phone: ''
				},
				verifyTimer: null, // 防抖计时器

				// 🎯 优化用户体验 - 添加验证缓存和状态管理
				verificationCache: {}, // 缓存验证结果 {phone: {status, result, timestamp}}
				isVerifying: false, // 是否正在验证中
				lastVerifiedPhone: '', // 上次验证的手机号
				allowAutoVerify: true, // 是否允许自动验证（失焦时）
				agreeTerms: false,
				submitting: false,
				submittingText: '正在提交申请...',
				showSuccessModal: false,
				showAgreementModal: false,
				showAgreementConfirmModal: false,
				// 审核策略相关
				auditPolicy: 'manual', // manual需要审核, auto自动通过
				applicationId: null,
				currentAgreementTitle: '',
				currentAgreementContent: '',

				// 二维码相关信息
				qrCodeInfo: null, // 从二维码获取的信息
				pendingAddressPreset: null, // 待设置的地址预设信息
				serviceAgreementContent: `访客使用协议

欢迎使用停车场管理系统访客功能！

一、服务说明
1. 本协议是您与停车场管理系统之间关于访客身份申请和使用服务的法律协议。
2. 访客功能允许您在通过审核后临时使用停车场相关服务。
3. 访客身份需要管理员审核，审核通过后方可使用相关功能。

二、用户权利与义务
1. 您有权申请访客身份，并在审核通过后使用相应服务。
2. 您应当提供真实、准确的个人信息。
3. 您应当遵守停车场相关规定和管理制度。
4. 您不得滥用访客功能，不得从事违法违规活动。

三、服务限制
1. 访客身份具有时效性，管理员可根据需要调整访客权限。
2. 访客功能仅限于已审核通过的用户使用。
3. 管理员有权对违规用户取消访客资格。

四、隐私保护
1. 我们将依据《隐私政策》保护您的个人信息。
2. 您的申请信息仅用于身份验证和服务提供。

五、免责声明
1. 因不可抗力导致的服务中断，我们不承担责任。
2. 因用户违规行为导致的后果，由用户自行承担。

六、协议修改
1. 我们保留修改本协议的权利。
2. 协议修改后，继续使用服务即表示同意修改后的协议。

七、争议解决
因本协议产生的争议，双方应友好协商解决；协商不成的，提交相关法院诉讼解决。

本协议自您点击同意之日起生效。`,
				privacyPolicyContent: `隐私政策

我们非常重视您的隐私保护。本隐私政策说明了我们如何收集、使用、存储和保护您的个人信息。

一、信息收集
我们收集的信息包括：
1. 基本信息：姓名、手机号、性别、身份证号等
2. 申请信息：申请原因、联系地址等
3. 系统信息：设备信息、操作记录等

二、信息使用
我们使用您的信息用于：
1. 身份验证和账户管理
2. 提供访客服务
3. 安全监控和风险防范
4. 服务改进和优化

三、信息共享
我们不会向第三方出售、出租或交易您的个人信息，除非：
1. 获得您的明确同意
2. 法律法规要求
3. 维护我们的合法权益

四、信息存储
1. 您的信息存储在安全的服务器中
2. 我们采用业界标准的安全措施保护您的信息
3. 信息保存期限不超过法律规定的最长期限

五、信息安全
1. 我们使用加密技术保护您的信息传输
2. 定期进行安全评估和风险监控
3. 建立完善的信息安全管理制度

六、您的权利
您有权：
1. 查询您的个人信息
2. 要求更正错误信息
3. 要求删除不必要的信息
4. 撤回信息使用授权

七、政策更新
1. 我们可能会不定期更新本隐私政策
2. 更新后的政策将在应用内公布
3. 继续使用服务即表示同意更新后的政策

八、联系我们
如您对本隐私政策有任何疑问，请联系我们：
- 邮箱：support@parking.com
- 电话：400-123-4567

本隐私政策最后更新时间：2025年6月26日`
			}
		},

		computed: {
			canSubmit() {
				const hasNickname = this.form.nickname.trim().length >= 2;
				const hasReason = this.form.reason.trim().length >= 2;
				const hasPhone = this.form.phone.trim();
				const hasOwnerPhone = this.form.ownerPhone.trim().length === 11;
				const hasValidOwner = this.ownerVerifyStatus === 'valid';
				const hasAddress = this.form.fullAddress.trim();
				const hasAgreed = this.agreeTerms;

				return hasNickname && hasReason && hasPhone && hasOwnerPhone && hasValidOwner && hasAddress && hasAgreed &&
					!this.submitting;
			},

			// 🎯 判断是否可以手动验证
			canManualVerify() {
				const phone = this.form.ownerPhone.trim();
				return phone.length === 11 &&
					/^1[3-9]\d{9}$/.test(phone) &&
					phone !== this.form.phone &&
					!this.isVerifying;
			},

			submitButtonText() {
				if (this.submitting) {
					return this.submittingText;
				}

				if (!this.form.nickname.trim()) {
					return '请输入姓名';
				}

				if (this.form.nickname.trim().length < 2) {
					return '姓名至少2个字符';
				}

				if (!this.form.reason.trim()) {
					return '请填写申请原因';
				}

				if (this.form.reason.trim().length < 2) {
					return '申请原因至少2个字符';
				}

				if (!this.form.ownerPhone.trim()) {
					return '请输入业主手机号';
				}

				if (this.form.ownerPhone.trim() && this.form.ownerPhone.trim().length !== 11) {
					return '手机号格式不正确';
				}

				if (this.form.ownerPhone.trim().length === 11 && this.ownerVerifyStatus !== 'valid') {
					if (this.ownerVerifyStatus === 'verifying') {
						return '验证业主身份中...';
					} else if (this.ownerVerifyStatus === 'invalid') {
						return '该手机号非本小区业主';
					} else if (this.ownerVerifyStatus === 'error') {
						return '业主验证失败，请重试';
					} else {
						return '请验证业主手机号';
					}
				}

				if (!this.form.fullAddress.trim()) {
					return '请选择访问地址';
				}

				if (!this.agreeTerms) {
					return '请同意用户协议';
				}

				return '提交申请';
			}
		},

		async onLoad(options) {
			console.log('🚀 访客申请页面加载，参数:', options);

			// 处理二维码扫描参数
			await this.handleQrCodeParams(options);

			// 处理微信小程序码场景值
			await this.handleWechatScene(options);

			this.loadUserInfo();
			this.loadCurrentCommunityInfo();
		},

		onUnload() {
			// 清理计时器
			if (this.verifyTimer) {
				clearTimeout(this.verifyTimer);
			}
			// 重置验证状态，避免影响后续使用
			this.isVerifying = false;
		},

		methods: {
			// 🎯 新增：扩展简化参数为完整格式
			expandShortParams(shortParams) {
				console.log('🔧 扩展简化参数:', shortParams);

				const expandedParams = {
					type: 'butler_invitation' // 标记为管家邀请
				};

				// 映射简化参数到完整参数
				if (shortParams.bp) expandedParams.butlerPhone = shortParams.bp;
				if (shortParams.bn) expandedParams.butlerName = shortParams.bn;
				if (shortParams.c) expandedParams.community = shortParams.c;
				if (shortParams.ts) expandedParams.timestamp = shortParams.ts;

				// 构建完整地址（如果有小区信息）
				if (expandedParams.community) {
					expandedParams.fullAddress = expandedParams.community;
				}

				console.log('🎯 扩展后的完整参数:', expandedParams);
				return expandedParams;
			},

			// 处理二维码扫描参数
			async handleQrCodeParams(options) {
				try {
					console.log('🔍 处理访客申请页面参数:', options);

					// 🎯 新增：处理普通链接二维码扫描参数 (微信6.5.6+)
					if (options && options.q) {
						console.log('🔗 检测到普通链接二维码扫描，原始链接参数:', options.q);

						// 解码二维码原始链接内容
						const qrUrl = decodeURIComponent(options.q);
						const scanTime = parseInt(options.scancode_time || Date.now() / 1000);

						console.log('📋 二维码原始链接:', qrUrl);
						console.log('⏰ 扫码时间:', new Date(scanTime * 1000));

						try {
							// 解析URL参数 - 兼容微信小程序环境
							const urlObj = new URL(qrUrl);
							// 手动解析查询字符串，不使用URLSearchParams（小程序不支持）
							const queryString = urlObj.search.substring(1); // 去掉开头的 ?
							const params = {
								get: function(key) {
									if (!queryString) return null;
									const pairs = queryString.split('&');
									for (const pair of pairs) {
										const [k, v] = pair.split('=');
										if (k === key) {
											return v ? decodeURIComponent(v) : '';
										}
									}
									return null;
								}
							};

							// 构建二维码数据对象
							const qrData = {
								type: 'visitor_invite_link',
								butlerPhone: params.get('butler_phone'),
								butlerName: decodeURIComponent(params.get('butler_name') || ''),
								province: params.get('province') || '',
								city: params.get('city') || '',
								district: params.get('district') || '',
								community: decodeURIComponent(params.get('community') || ''),
								building: params.get('building') || '',
								units: params.get('units') || '',
								floor: params.get('floor') || '',
								room: params.get('room') || '',
								timestamp: params.get('timestamp') || scanTime * 1000,
								source: 'qr_code_scan'
							};

							console.log('✅ 从普通链接二维码解析的数据:', qrData);

							// 如果有有效的管家信息，继续处理
							if (qrData.butlerPhone && qrData.butlerName) {
								// 显示扫码成功提示
								const fullAddress = this.buildFullAddressFromQrData(qrData);

								uni.showModal({
									title: '🎯 扫码成功！',
									content: `您通过扫描访客邀请二维码申请访客身份

👤 管家信息：${qrData.butlerName} (${qrData.butlerPhone})
🏠 访问地址：${fullAddress || '未设置详细地址'}

✅ 信息将自动填入，请确认并完善其他必要信息。`,
									showCancel: false,
									confirmText: '开始申请',
									success: () => {
										this.applyQrCodeData(qrData);
									}
								});

								return; // 成功处理普通链接二维码，直接返回
							}

						} catch (urlError) {
							console.error('❌ 解析普通链接二维码URL失败:', urlError);
							// 如果URL解析失败，继续尝试其他格式
						}
					}

					// 检查是否有其他格式的二维码数据
					if (options && (options.data || options.butlerPhone || options.type === 'butler_invitation' ||
							options.bp || options.t === 'bi')) {
						let qrData = {};

						// 🎯 优化：支持简化参数格式和完整参数格式
						if (options.t === 'bi' || options.bp) {
							// 处理简化参数格式（从优化后的小程序码扫描得到）
							qrData = this.expandShortParams(options);
							console.log('📱 使用简化格式的二维码参数:', qrData);
						} else if (options.type === 'butler_invitation') {
							// 直接使用URL参数，这是完整的参数传递方式
							qrData = options;
							console.log('📱 使用完整格式的二维码参数:', qrData);
						} else if (options.data) {
							try {
								// 兼容旧的JSON数据格式
								qrData = typeof options.data === 'string' ?
									JSON.parse(decodeURIComponent(options.data)) : options.data;
								console.log('📱 解析的JSON二维码数据:', qrData);
							} catch (parseError) {
								console.log('❌ 解析二维码数据失败，尝试直接使用:', parseError);
								// 如果解析失败，可能是直接的参数格式
								qrData = options;
							}
						} else {
							// 直接使用URL参数
							qrData = options;
						}

						// 检查是否是管家邀请的访客申请
						if (qrData.butlerName || qrData.butlerPhone || qrData.fullAddress || qrData.type ===
							'butler_invitation') {
							console.log('🎯 检测到管家邀请的访客申请');

							// 🎯 构建地址信息对象（新格式）
							const addressInfo = {
								province: qrData.province || '',
								city: qrData.city || '',
								district: qrData.district || '',
								community: qrData.community || '',
								building: qrData.building || '',
								units: qrData.units || '',
								floor: qrData.floor || '',
								room: qrData.room || ''
							};

							// 构建完整地址显示
							let fullAddress = qrData.fullAddress;
							if (!fullAddress && (addressInfo.province || addressInfo.city)) {
								fullAddress = '';
								if (addressInfo.province) fullAddress += addressInfo.province;
								if (addressInfo.city) fullAddress += addressInfo.city;
								if (addressInfo.district) fullAddress += addressInfo.district;
								if (addressInfo.community) fullAddress += addressInfo.community;
								if (addressInfo.building) fullAddress += addressInfo.building + '栋';
								if (addressInfo.units) fullAddress += addressInfo.units + '单元';
								if (addressInfo.floor) fullAddress += addressInfo.floor + '层';
								if (addressInfo.room) fullAddress += addressInfo.room;
							}

							// 显示二维码信息提示
							const tipContent = `您正在通过管家邀请申请访客身份

管家信息：${qrData.butlerName || '未知'} (${qrData.butlerPhone || '未知'})
访问地址：${fullAddress || '未设置'}

地址信息将自动填入，管家信息也将自动设置。`;

							uni.showModal({
								title: '🎯 管家邀请申请',
								content: tipContent,
								showCancel: false,
								confirmText: '开始申请'
							});

							// 自动填入管家手机号作为访问业主手机号
							if (qrData.butlerPhone) {
								this.form.ownerPhone = qrData.butlerPhone;
								console.log('📱 自动填入管家手机号:', qrData.butlerPhone);

								// 延迟自动验证管家身份
								setTimeout(() => {
									if (this.canManualVerify) {
										console.log('🔄 自动验证管家身份');
										this.validateOwnerPhone();
									}
								}, 1500);
							}

							// 🎯 预设地址信息（使用新的地址对象）
							if (addressInfo.community || addressInfo.province) {
								// 直接设置地址信息到表单
								this.form.addressInfo = {
									...addressInfo
								};
								this.form.fullAddress = fullAddress;

								// 更新当前小区信息
								if (addressInfo.community) {
									this.currentCommunityName = addressInfo.community;
									this.currentCommunityInfo.community = addressInfo.community;
								}
								if (addressInfo.province) {
									this.currentCommunityInfo.province = addressInfo.province;
								}
								if (addressInfo.city) {
									this.currentCommunityInfo.city = addressInfo.city;
								}
								if (addressInfo.district) {
									this.currentCommunityInfo.district = addressInfo.district;
								}

								console.log('✅ 地址信息已直接设置:', this.form.addressInfo);
								console.log('✅ 完整地址已设置:', this.form.fullAddress);

								// 预设地址选择器
								this.presetAddressSelector(addressInfo);

								uni.showToast({
									title: '地址信息已自动填入',
									icon: 'success',
									duration: 2000
								});
							}

							// 保存二维码信息用于后续提交
							this.qrCodeInfo = {
								butlerName: qrData.butlerName,
								butlerPhone: qrData.butlerPhone,
								fullAddress: fullAddress,
								addressInfo: addressInfo,
								isFromQrCode: true,
								timestamp: qrData.timestamp || Date.now()
							};

							console.log('✅ 二维码信息已保存:', this.qrCodeInfo);
						}
					}

				} catch (error) {
					console.error('❌ 处理二维码参数失败:', error);
					uni.showToast({
						title: '二维码信息处理失败',
						icon: 'none',
						duration: 2000
					});
				}
			},

			// 从二维码预设地址信息
			presetAddressFromQrCode(qrData) {
				try {
					console.log('🏠 预设访客申请地址信息:', qrData);

					// 检查地址信息格式
					let addressInfo = qrData.addressInfo;
					if (!addressInfo && qrData.fullAddress) {
						// 如果没有结构化地址信息，但有完整地址，尝试解析
						console.log('🔍 尝试从完整地址解析结构化信息');
						// 这里可以添加地址解析逻辑，暂时先使用默认小区
						addressInfo = {
							community: this.currentCommunityName
						};
					}

					if (addressInfo) {
						// 更新当前小区信息
						if (addressInfo.community) {
							this.currentCommunityName = addressInfo.community;
						}
						if (addressInfo.province) {
							this.currentCommunityInfo.province = addressInfo.province;
						}
						if (addressInfo.city) {
							this.currentCommunityInfo.city = addressInfo.city;
						}
						if (addressInfo.district) {
							this.currentCommunityInfo.district = addressInfo.district;
						}

						// 构建完整地址字符串
						let fullAddress = '';
						if (addressInfo.province) fullAddress += addressInfo.province;
						if (addressInfo.city) fullAddress += addressInfo.city;
						if (addressInfo.district) fullAddress += addressInfo.district;
						if (addressInfo.community) fullAddress += addressInfo.community;
						if (addressInfo.building) fullAddress += addressInfo.building + '栋';
						if (addressInfo.units) fullAddress += addressInfo.units + '单元';
						if (addressInfo.floor) fullAddress += addressInfo.floor + '层';
						if (addressInfo.room) fullAddress += addressInfo.room;

						// 更新表单中的地址信息
						this.form.addressInfo = {
							...addressInfo
						};
						this.form.fullAddress = fullAddress || qrData.fullAddress || qrData.address;

						// 预设地址选择器（如果有足够的信息）
						if (addressInfo.building || addressInfo.units || addressInfo.floor || addressInfo.room) {
							this.presetAddressSelector(addressInfo);
						}

						console.log('✅ 地址信息已预设:', this.form.addressInfo);
						console.log('✅ 完整地址已设置:', this.form.fullAddress);

						uni.showToast({
							title: '地址信息已自动填入',
							icon: 'success',
							duration: 2000
						});
					}

				} catch (error) {
					console.error('❌ 预设地址信息失败:', error);
				}
			},

			// 预设地址选择器的值
			presetAddressSelector(addressInfo) {
				try {
					console.log('🎯 预设地址选择器:', addressInfo);

					// 这里需要根据您的地址选择器结构来设置
					// 暂时先记录信息，等地址数据加载完成后再设置
					this.pendingAddressPreset = {
						building: addressInfo.building,
						units: addressInfo.units,
						floor: addressInfo.floor,
						room: addressInfo.room || addressInfo.roomnumber
					};

					console.log('📋 地址预设信息已记录:', this.pendingAddressPreset);

				} catch (error) {
					console.error('❌ 预设地址选择器失败:', error);
				}
			},

			// 处理微信小程序码场景值
			async handleWechatScene(options) {
				try {
					// 获取场景值
					let scene = options.scene;

					if (scene) {
						console.log('🎯 检测到微信小程序码场景值:', scene);

						// 解析场景值
						const sceneParams = this.parseSceneValue(scene);

						if (sceneParams.b) {
							console.log('📱 从场景值获取管家信息:', sceneParams);

							// 根据管家后8位手机号获取完整信息
							const butlerInfo = await this.getButlerInfoByPhoneSuffix(sceneParams.b);

							if (butlerInfo) {
								// 自动填入管家信息
								this.form.ownerPhone = butlerInfo.phone;

								// 预设地址信息
								if (butlerInfo.addressInfo) {
									this.presetAddressFromQrCode(butlerInfo);
								}

								// 保存二维码信息
								this.qrCodeInfo = {
									butlerName: butlerInfo.name,
									butlerPhone: butlerInfo.phone,
									fullAddress: butlerInfo.address,
									addressInfo: butlerInfo.addressInfo,
									isFromWechatScene: true
								};

								// 显示扫码成功提示
								uni.showModal({
									title: '🎯 扫码成功',
									content: `您正在通过管家邀请申请访客身份

管家：${butlerInfo.name || '未知'}
电话：${butlerInfo.phone || '未知'}
地址：${butlerInfo.address || '未设置'}

信息将自动填入，请完善其他必要信息。`,
									showCancel: false,
									confirmText: '开始申请'
								});

								// 延迟自动验证管家身份
								setTimeout(() => {
									if (this.canManualVerify) {
										console.log('🔄 自动验证管家身份');
										this.validateOwnerPhone();
									}
								}, 1500);
							} else {
								// 未找到管家信息的提示
								uni.showModal({
									title: '⚠️ 管家信息获取失败',
									content: '未能获取到管家详细信息，请手动填写访问信息。',
									showCancel: false,
									confirmText: '手动填写'
								});
							}
						}
					}
				} catch (error) {
					console.error('❌ 处理微信场景值失败:', error);
					uni.showToast({
						title: '场景值处理失败，请手动填写',
						icon: 'none',
						duration: 2000
					});
				}
			},

			// 解析场景值
			parseSceneValue(scene) {
				const params = {};
				const pairs = scene.split('&');

				pairs.forEach(pair => {
					const [key, value] = pair.split('=');
					if (key && value) {
						params[key] = decodeURIComponent(value);
					}
				});

				console.log('🔍 解析的场景值参数:', params);
				return params;
			},

			// 根据手机号后缀获取管家信息
			async getButlerInfoByPhoneSuffix(phoneSuffix) {
				try {
					console.log('🔍 根据手机号后缀查询管家信息:', phoneSuffix);

					// 这里需要调用后端API，根据手机号后缀查询管家信息
					// 由于场景值限制，只传递了后8位手机号，需要后端模糊匹配
					const response = await uni.request({
						url: 'https://csharphrb.picp.vip/parking/butler/getByPhoneSuffix',
						method: 'GET',
						data: {
							phoneSuffix: phoneSuffix
						}
					});

					if (response.data && response.data.code === '0' && response.data.data) {
						const butlerData = response.data.data;
						console.log('✅ 管家信息查询成功:', butlerData);

						return {
							name: butlerData.username || butlerData.name,
							phone: butlerData.phone,
							address: this.buildFullAddressFromButler(butlerData),
							addressInfo: {
								province: butlerData.province,
								city: butlerData.city,
								district: butlerData.district,
								community: butlerData.community
							}
						};
					} else {
						console.warn('⚠️ 未找到匹配的管家信息');
						return null;
					}
				} catch (error) {
					console.error('❌ 查询管家信息失败:', error);
					return null;
				}
			},

			// 从管家信息构建完整地址
			buildFullAddressFromButler(butlerData) {
				let address = '';
				if (butlerData.province) address += butlerData.province;
				if (butlerData.city) address += butlerData.city;
				if (butlerData.district) address += butlerData.district;
				if (butlerData.community) address += butlerData.community;
				return address || '未设置';
			},

			// 🎯 新增：从二维码数据构建完整地址
			buildFullAddressFromQrData(qrData) {
				let address = '';
				if (qrData.province) address += qrData.province;
				if (qrData.city) address += qrData.city;
				if (qrData.district) address += qrData.district;
				if (qrData.community) address += qrData.community;
				if (qrData.building) address += qrData.building + '栋';
				if (qrData.units) address += qrData.units + '单元';
				if (qrData.floor) address += qrData.floor + '层';
				if (qrData.room) address += qrData.room + '室';
				return address || '未设置地址';
			},

			// 🎯 新增：应用二维码数据到表单
			applyQrCodeData(qrData) {
				try {
					console.log('📋 应用二维码数据到表单:', qrData);

					// 1. 填入管家手机号作为访问业主手机号
					if (qrData.butlerPhone) {
						this.form.ownerPhone = qrData.butlerPhone;
						console.log('📱 已填入管家手机号:', qrData.butlerPhone);
					}

					// 2. 设置地址信息
					if (qrData.community || qrData.province) {
						const addressInfo = {
							province: qrData.province || '',
							city: qrData.city || '',
							district: qrData.district || '',
							community: qrData.community || '',
							building: qrData.building || '',
							units: qrData.units || '',
							floor: qrData.floor || '',
							roomnumber: qrData.room || ''
						};

						// 构建完整地址
						const fullAddress = this.buildFullAddressFromQrData(qrData);

						// 更新表单数据
						this.form.addressInfo = {
							...addressInfo
						};
						this.form.fullAddress = fullAddress;

						// 更新当前小区信息
						if (qrData.community) {
							this.currentCommunityName = qrData.community;
							this.currentCommunityInfo.community = qrData.community;
						}
						if (qrData.province) this.currentCommunityInfo.province = qrData.province;
						if (qrData.city) this.currentCommunityInfo.city = qrData.city;
						if (qrData.district) this.currentCommunityInfo.district = qrData.district;

						console.log('🏠 地址信息已设置:', this.form.addressInfo);
						console.log('📍 完整地址已设置:', this.form.fullAddress);

						// 预设地址选择器
						if (qrData.building || qrData.units || qrData.floor || qrData.room) {
							this.presetAddressSelector(addressInfo);
						}
					}

					// 3. 保存二维码信息
					this.qrCodeInfo = {
						butlerName: qrData.butlerName,
						butlerPhone: qrData.butlerPhone,
						fullAddress: this.form.fullAddress,
						addressInfo: this.form.addressInfo,
						isFromQrCode: true,
						scanMethod: 'link_qrcode', // 标记为普通链接二维码
						timestamp: qrData.timestamp || Date.now()
					};

					console.log('✅ 二维码信息已保存:', this.qrCodeInfo);

					// 4. 显示成功提示
					uni.showToast({
						title: '✅ 信息已自动填入',
						icon: 'success',
						duration: 2000
					});

					// 5. 延迟自动验证管家身份
					setTimeout(() => {
						if (this.canManualVerify) {
							console.log('🔄 自动验证管家身份');
							this.validateOwnerPhone();
						}
					}, 1500);

				} catch (error) {
					console.error('❌ 应用二维码数据失败:', error);
					uni.showToast({
						title: '信息填入失败，请手动填写',
						icon: 'none',
						duration: 2000
					});
				}
			},

			// 加载用户信息
			loadUserInfo() {
				const userInfo = uni.getStorageSync('userInfo');
				if (userInfo && userInfo.phone) {
					this.form.phone = userInfo.phone;
				} else {
					// 如果没有手机号，返回登录页
					uni.showModal({
						title: '提示',
						content: '未获取到手机号信息，请重新登录',
						showCancel: false,
						success: () => {
							uni.reLaunch({
								url: '/pages/auth/phone-auth'
							});
						}
					});
				}
			},

			// 性别选择
			onGenderChange(e) {
				console.log('性别选择变更:', e.detail.value);
				this.form.gender = e.detail.value;
			},

			// 协议同意状态变更
			onAgreeChange(e) {
				this.agreeTerms = e.detail.value.includes('agree');
				console.log('协议同意状态:', this.agreeTerms);
			},

			// === 业主验证相关方法 ===

			// 🎯 获取验证按钮文本
			getVerifyButtonText() {
				if (this.isVerifying) {
					return '验证中...';
				}

				const phone = this.form.ownerPhone.trim();
				if (!phone) {
					return '请输入手机号';
				}

				if (phone.length !== 11) {
					return '手机号不完整';
				}

				if (!/^1[3-9]\d{9}$/.test(phone)) {
					return '手机号格式错误';
				}

				if (phone === this.form.phone) {
					return '不能是自己的号码';
				}

				// 检查缓存
				const cached = this.verificationCache[phone];
				if (cached && this.isCacheValid(cached)) {
					if (cached.status === 'valid') {
						return '已验证';
					} else if (cached.status === 'invalid') {
						return '重新验证';
					}
				}

				return '验证业主身份';
			},

			// 🎯 获取状态文本
			getStatusText() {
				const phone = this.form.ownerPhone.trim();

				if (this.isVerifying) {
					return '正在验证中...';
				}

				if (!phone) {
					return '请输入业主手机号';
				}

				if (phone.length !== 11) {
					return '手机号长度不正确';
				}

				// 检查缓存状态
				const cached = this.verificationCache[phone];
				if (cached && this.isCacheValid(cached)) {
					const timeDiff = Math.floor((Date.now() - cached.timestamp) / 1000);
					if (cached.status === 'valid') {
						return `已验证 (${timeDiff}秒前)`;
					} else if (cached.status === 'invalid') {
						return `验证失败 (${timeDiff}秒前)`;
					}
				}

				switch (this.ownerVerifyStatus) {
					case 'valid':
						return '验证通过';
					case 'invalid':
						return '非本小区业主';
					case 'error':
						return '验证出错';
					default:
						return '未验证';
				}
			},

			// 🎯 检查缓存是否有效（5分钟内）
			isCacheValid(cached) {
				const cacheTimeout = 5 * 60 * 1000; // 5分钟
				return cached && (Date.now() - cached.timestamp) < cacheTimeout;
			},

			// 🎯 从缓存获取验证结果
			getFromCache(phone) {
				const cached = this.verificationCache[phone];
				if (cached && this.isCacheValid(cached)) {
					console.log('🎯 从缓存获取验证结果:', phone, cached);
					return cached;
				}
				return null;
			},

			// 🎯 保存到缓存
			saveToCache(phone, status, result) {
				this.verificationCache[phone] = {
					status: status,
					result: result,
					timestamp: Date.now()
				};
				console.log('💾 保存验证结果到缓存:', phone, status);
			},

			// 强制重置业主验证状态
			forceResetOwnerStatus() {
				console.log('🔄 强制重置业主验证状态');
				console.log('🔄 重置前状态:', {
					ownerVerifyStatus: this.ownerVerifyStatus,
					ownerInfo: this.ownerInfo
				});

				this.ownerVerifyStatus = '';
				this.ownerInfo = {
					name: '',
					address: '',
					community: '',
					phone: ''
				};
				this.lastVerifiedPhone = '';

				// 强制Vue更新视图
				this.$forceUpdate();

				console.log('🔄 重置后状态:', {
					ownerVerifyStatus: this.ownerVerifyStatus,
					ownerInfo: this.ownerInfo
				});
			},

			// 🎯 业主手机号输入事件（仅清理状态，不自动验证）
			onOwnerPhoneInput(e) {
				const phone = e.detail.value;
				this.form.ownerPhone = phone;

				console.log('📝 业主手机号输入变化:', phone);

				// 清除之前的计时器
				if (this.verifyTimer) {
					clearTimeout(this.verifyTimer);
				}

				// 🎯 只有当手机号发生实质变化时才重置状态
				if (phone !== this.lastVerifiedPhone) {
					// 检查缓存
					const cached = this.getFromCache(phone);
					if (cached) {
						// 从缓存恢复状态
						this.ownerVerifyStatus = cached.status;
						if (cached.status === 'valid' && cached.result) {
							this.ownerInfo = {
								name: cached.result.ownerName || '业主',
								address: cached.result.address || '',
								community: cached.result.community || this.currentCommunityName,
								phone: phone
							};
						} else {
							this.ownerInfo = {
								name: '',
								address: '',
								community: '',
								phone: ''
							};
						}
						console.log('📦 从缓存恢复状态:', phone, cached.status);
					} else {
						// 重置验证状态（但不要太激进）
						if (phone.length < 11) {
							this.ownerVerifyStatus = '';
							this.ownerInfo = {
								name: '',
								address: '',
								community: '',
								phone: ''
							};
						}
					}
				}
			},

			// 🎯 手机号失焦事件（自动验证）
			onOwnerPhoneBlur() {
				const phone = this.form.ownerPhone.trim();
				console.log('📤 手机号失焦:', phone);

				// 只有在满足条件且允许自动验证时才触发
				if (this.allowAutoVerify && this.canManualVerify && phone !== this.lastVerifiedPhone) {
					// 检查缓存
					const cached = this.getFromCache(phone);
					if (!cached) {
						console.log('🔄 失焦自动验证');
						setTimeout(() => {
							this.validateOwnerPhone();
						}, 300); // 短暂延迟，避免误触
					}
				}
			},

			// 🎯 手动验证业主
			manualValidateOwnerPhone() {
				if (!this.canManualVerify) {
					return;
				}

				console.log('👆 用户手动点击验证');
				this.allowAutoVerify = false; // 手动验证后禁用自动验证一段时间
				this.validateOwnerPhone();

				// 3秒后重新允许自动验证
				setTimeout(() => {
					this.allowAutoVerify = true;
				}, 3000);
			},

			// 🎯 重新验证业主
			reVerifyOwner() {
				const phone = this.form.ownerPhone.trim();
				console.log('🔄 用户要求重新验证:', phone);

				// 清除缓存
				delete this.verificationCache[phone];

				// 重置状态
				this.ownerVerifyStatus = '';
				this.ownerInfo = {
					name: '',
					address: '',
					community: '',
					phone: ''
				};
				this.lastVerifiedPhone = '';

				// 立即验证
				if (this.canManualVerify) {
					this.validateOwnerPhone();
				}
			},

			// 验证业主手机号（优化版）
			async validateOwnerPhone() {
				const phone = this.form.ownerPhone.trim();

				// 基本验证
				if (!phone || phone.length !== 11) {
					this.ownerVerifyStatus = 'invalid';
					return;
				}

				// 验证手机号格式
				const phoneReg = /^1[3-9]\d{9}$/;
				if (!phoneReg.test(phone)) {
					this.ownerVerifyStatus = 'invalid';
					uni.showToast({
						title: '手机号格式不正确',
						icon: 'none',
						duration: 2000
					});
					return;
				}

				// 避免验证访客自己的手机号
				if (phone === this.form.phone) {
					this.ownerVerifyStatus = 'invalid';
					uni.showToast({
						title: '不能填写自己的手机号',
						icon: 'none',
						duration: 2000
					});
					return;
				}

				// 🎯 检查缓存
				const cached = this.getFromCache(phone);
				if (cached) {
					console.log('⚡ 使用缓存结果，无需重新验证');
					this.ownerVerifyStatus = cached.status;
					if (cached.status === 'valid' && cached.result) {
						this.ownerInfo = {
							name: cached.result.ownerName || '业主',
							address: cached.result.address || '',
							community: cached.result.community || this.currentCommunityName,
							phone: phone
						};
						this.lastVerifiedPhone = phone;

						uni.showToast({
							title: '使用缓存结果',
							icon: 'success',
							duration: 1500
						});
					}
					return;
				}

				// 🎯 防止重复验证
				if (this.isVerifying) {
					console.log('⚠️ 正在验证中，忽略重复请求');
					return;
				}

				// 开始验证
				this.isVerifying = true;
				this.ownerVerifyStatus = 'verifying';
				console.log('🔍 开始验证业主手机号:', phone);

				// 🎯 优化loading体验
				let loadingTitle = '正在验证业主身份...';
				const loadingTips = [
					'正在查询月票系统...',
					'正在验证业主信息...',
					'正在连接外部系统...',
					'验证中，请稍候...'
				];

				uni.showLoading({
					title: loadingTitle,
					mask: true
				});

				// 🎯 定期更换loading文案，提升体验
				let tipIndex = 0;
				const tipTimer = setInterval(() => {
					tipIndex = (tipIndex + 1) % loadingTips.length;
					uni.showLoading({
						title: loadingTips[tipIndex],
						mask: true
					});
				}, 2000);

				try {
					// 调用后端API验证月票信息
					const result = await this.checkOwnerMonthlyTicket(phone);

					// 清除loading和定时器
					clearInterval(tipTimer);
					uni.hideLoading();

					console.log('🔍 收到验证结果:', result);

					if (result.isValid) {
						console.log('✅ 验证成功');
						this.ownerVerifyStatus = 'valid';
						this.ownerInfo = {
							name: result.ownerName || '业主',
							address: result.address || '',
							community: result.community || this.currentCommunityName,
							phone: phone
						};
						this.lastVerifiedPhone = phone;

						// 🎯 保存到缓存
						this.saveToCache(phone, 'valid', result);

						uni.showToast({
							title: '验证成功',
							icon: 'success',
							duration: 2000
						});
					} else {
						console.log('❌ 验证失败');
						this.ownerVerifyStatus = 'invalid';
						this.ownerInfo = {
							name: '',
							address: '',
							community: '',
							phone: ''
						};

						// 🎯 保存失败结果到缓存
						this.saveToCache(phone, 'invalid', result);

						uni.showToast({
							title: result.message || '该手机号非本小区月票用户',
							icon: 'none',
							duration: 3000
						});
					}

				} catch (error) {
					// 清除loading和定时器
					clearInterval(tipTimer);
					uni.hideLoading();

					this.ownerVerifyStatus = 'error';
					console.error('❌ 业主验证异常:', error);

					// 根据错误类型提供不同的处理方案
					if (error.message.includes('超时') || error.message.includes('timeout')) {
						uni.showModal({
							title: '验证超时',
							content: '业主身份验证查询时间较长，建议稍后重试。',
							showCancel: true,
							cancelText: '稍后重试',
							confirmText: '重新验证',
							success: (res) => {
								if (res.confirm) {
									setTimeout(() => {
										this.validateOwnerPhone();
									}, 1000);
								}
							}
						});
					} else if (error.message.includes('网络')) {
						uni.showModal({
							title: '网络问题',
							content: '网络连接不稳定，请检查网络后重试。',
							showCancel: false,
							confirmText: '知道了'
						});
					} else {
						uni.showToast({
							title: '验证失败，请重试',
							icon: 'none',
							duration: 3000
						});
					}
				} finally {
					this.isVerifying = false;
				}
			},

			// 检查业主月票信息
			async checkOwnerMonthlyTicket(phone) {
				const startTime = Date.now();

				try {
					console.log('📞 调用业主月票验证API:', {
						phone: phone,
						community: this.currentCommunityName,
						startTime: new Date(startTime).toLocaleTimeString()
					});

					// 导入API配置
					const apiConfig = require('@/config/api.js');
					const ownerAPI = apiConfig.ownerAPI || apiConfig.default?.ownerAPI;

					if (!ownerAPI) {
						throw new Error('API配置加载失败');
					}

					// 使用封装好的API方法
					const data = await ownerAPI.checkMonthlyTicket(phone, this.currentCommunityName);

					const endTime = Date.now();
					const duration = (endTime - startTime) / 1000;
					console.log(`📦 业主月票验证API响应 (耗时: ${duration.toFixed(1)}秒):`, data);
					console.log('📦 响应结构详情:', JSON.stringify(data, null, 2));

					// 检查响应结构
					console.log('🔍 检查响应结构 - 外层code:', data?.code, '内层code:', data?.data?.code);

					// 后端返回格式：{ code: "0", msg: "成功", data: { code: "0"/"1", msg: "", data: {...} } }
					// 外层code表示HTTP请求是否成功，内层data.code表示业务逻辑是否成功
					if (data && data.code === "0" && data.data && data.data.code === "0") {
						const rawOwnerData = data.data.data;
						console.log('✅ 月票验证成功，原始数据:', rawOwnerData);
						console.log('📋 原始数据详细结构:', JSON.stringify(rawOwnerData, null, 2));

						// 🔍 处理数组结构 - 如果返回的是数组，取第一个元素
						let ownerInfo = null;

						if (Array.isArray(rawOwnerData) && rawOwnerData.length > 0) {
							ownerInfo = rawOwnerData[0]; // 取数组第一个元素
							console.log('📋 从数组中提取业主信息:', ownerInfo);
						} else if (rawOwnerData && typeof rawOwnerData === 'object') {
							ownerInfo = rawOwnerData; // 直接使用对象
							console.log('📋 直接使用对象作为业主信息:', ownerInfo);
						} else {
							console.log('⚠️ 未找到有效的业主信息数据');
						}

						console.log('📋 最终业主信息详细结构:', JSON.stringify(ownerInfo, null, 2));

						// 🔍 分析业主信息字段
						if (ownerInfo) {
							console.log('📝 可用字段分析:');
							console.log('姓名相关字段:', {
								userName: ownerInfo.userName, // 优先使用这个
								ownername: ownerInfo.ownername,
								username: ownerInfo.username,
								name: ownerInfo.name,
								ownerName: ownerInfo.ownerName,
								realName: ownerInfo.realName
							});
							console.log('地址相关字段:', {
								building: ownerInfo.building,
								units: ownerInfo.units,
								floor: ownerInfo.floor,
								roomnumber: ownerInfo.roomnumber,
								address: ownerInfo.address,
								fullAddress: ownerInfo.fullAddress,
								community: ownerInfo.community,
								province: ownerInfo.province,
								city: ownerInfo.city,
								district: ownerInfo.district
							});
							console.log('车辆相关字段:', {
								userPhone: ownerInfo.userPhone,
								carNo: ownerInfo.carNo,
								plateNumber: ownerInfo.plateNumber
							});
							console.log('其他字段:', Object.keys(ownerInfo));
						}

						// 🎯 优先获取userName字段作为业主姓名
						let ownerName = '业主'; // 默认值
						const nameFields = ['userName', 'ownername', 'username', 'name', 'ownerName',
							'realName'
						]; // userName放在首位

						if (ownerInfo) {
							for (const field of nameFields) {
								if (ownerInfo[field] && typeof ownerInfo[field] === 'string' && ownerInfo[field]
									.trim()) {
									ownerName = ownerInfo[field].trim();
									console.log(`✅ 找到业主姓名字段 [${field}]:`, ownerName);
									break;
								}
							}
						}

						if (ownerName === '业主') {
							console.log('⚠️ 未找到有效的业主姓名，使用默认值');
						}

						// 🎯 增强地址信息提取逻辑
						let address = '';

						if (ownerInfo) {
							// 优先使用完整地址字段
							if (ownerInfo.fullAddress && ownerInfo.fullAddress.trim()) {
								address = ownerInfo.fullAddress.trim();
								console.log('✅ 使用完整地址字段:', address);
							}
							// 其次使用address字段
							else if (ownerInfo.address && ownerInfo.address.trim()) {
								address = ownerInfo.address.trim();
								console.log('✅ 使用地址字段:', address);
							}
							// 尝试从分段地址信息构建
							else if (ownerInfo.building || ownerInfo.units || ownerInfo.floor || ownerInfo
								.roomnumber) {
								const addressParts = [];

								// 添加省市区信息
								if (ownerInfo.province) addressParts.push(ownerInfo.province);
								if (ownerInfo.city) addressParts.push(ownerInfo.city);
								if (ownerInfo.district) addressParts.push(ownerInfo.district);
								if (ownerInfo.community) addressParts.push(ownerInfo.community);

								// 添加详细地址
								if (ownerInfo.building) addressParts.push(ownerInfo.building + '栋');
								if (ownerInfo.units) addressParts.push(ownerInfo.units + '单元');
								if (ownerInfo.floor) addressParts.push(ownerInfo.floor + '楼');
								if (ownerInfo.roomnumber) addressParts.push(ownerInfo.roomnumber + '室');

								address = addressParts.join('');
								console.log('✅ 从分段信息构建地址:', address);
							}
							// 最后使用小区信息
							else if (ownerInfo.community) {
								address = ownerInfo.community;
								console.log('✅ 使用小区信息作为地址:', address);
							}
						}

						// 如果仍然没有地址，使用当前小区名称
						if (!address) {
							address = this.currentCommunityName;
							console.log('⚠️ 未找到地址信息，使用当前小区名称:', address);
						}

						const successResult = {
							isValid: true,
							ownerName: ownerName,
							address: address,
							community: (ownerInfo && ownerInfo.community) || this.currentCommunityName,
							phone: phone,
							message: `外部月票API验证成功 (耗时: ${duration.toFixed(1)}秒)`,
							source: 'external_api',
							duration: duration,
							// 保存原始数据用于调试
							rawOwnerInfo: ownerInfo
						};

						console.log('🎯 返回成功结果:', successResult);
						return successResult;

					} else {
						// 验证失败 - 检查是HTTP失败还是业务逻辑失败
						let errorMsg = '';

						if (!data || data.code !== "0") {
							// HTTP请求失败
							errorMsg = data?.msg || 'HTTP请求失败';
						} else if (data.data && data.data.code !== "0") {
							// 业务逻辑失败
							errorMsg = data.data.msg || '业主验证失败';
						} else {
							errorMsg = '未知错误';
						}

						console.log(`❌ 月票验证失败 (耗时: ${duration.toFixed(1)}秒):`, errorMsg);
						console.log('❌ 详细错误信息:', {
							outerCode: data?.code,
							outerMsg: data?.msg,
							innerCode: data?.data?.code,
							innerMsg: data?.data?.msg,
							innerData: data?.data?.data
						});

						const failResult = {
							isValid: false,
							message: errorMsg,
							source: 'external_api',
							duration: duration
						};

						console.log('🎯 返回失败结果:', failResult);
						return failResult;
					}
				} catch (error) {
					const endTime = Date.now();
					const duration = (endTime - startTime) / 1000;
					console.error(`❌ 业主月票验证API调用失败 (耗时: ${duration.toFixed(1)}秒):`, error);

					// 根据错误类型和持续时间提供不同的错误信息
					if (error.message.includes('timeout') || error.errMsg?.includes('timeout')) {
						if (duration > 60) {
							throw new Error(`外部月票API查询超时 (已等待${duration.toFixed(0)}秒)。\n\n系统正在查询大量月票数据，请稍后重试或联系管理员。`);
						} else {
							throw new Error(`网络连接超时 (${duration.toFixed(0)}秒)，请检查网络连接后重试。`);
						}
					} else if (error.message.includes('网络') || error.errMsg?.includes('network')) {
						throw new Error('网络连接失败，请检查网络连接状态。');
					} else if (error.statusCode >= 500) {
						throw new Error(`月票服务器错误 (HTTP ${error.statusCode})，请稍后重试。`);
					} else if (error.statusCode === 404) {
						throw new Error('月票验证接口暂时不可用，请联系管理员。');
					} else if (error.message.includes('API配置加载失败')) {
						throw new Error('系统配置加载失败，请重启应用后重试。');
					} else if (error.attempts && error.attempts > 1) {
						throw new Error(`验证失败，已尝试${error.attempts}次。外部系统可能繁忙，请稍后重试。`);
					} else {
						// 提供更友好的错误信息
						const errorMsg = error.message || error.errMsg || '未知错误';

						if (errorMsg.includes('request:fail')) {
							throw new Error('网络请求失败，请检查网络连接。');
						} else if (errorMsg.includes('abort')) {
							throw new Error('请求被中断，请重新尝试。');
						} else if (duration > 80) {
							throw new Error(`查询时间过长 (${duration.toFixed(0)}秒)，外部系统响应缓慢，请稍后重试。`);
						} else {
							throw new Error(`业主验证过程中出现问题: ${errorMsg}`);
						}
					}
				}
			},

			// === 地址选择相关方法 ===

			// 加载当前小区信息
			async loadCurrentCommunityInfo() {
				try {
					uni.showLoading({
						title: '加载地址信息...'
					});

					// 从登录信息或全局状态获取当前小区信息
					const userInfo = uni.getStorageSync('userInfo');
					const parkName = userInfo?.parkName || '四季上东'; // 默认四季上东

					// 只更新小区名称，省市区信息将从API数据中获取
					this.currentCommunityName = parkName;
					this.currentCommunityInfo.community = parkName;

					console.log('🏗️ 准备加载小区:', parkName);

					// 直接加载地址数据，buildAddressTree方法会自动更新省市区信息
					await this.loadAddressData();

					console.log('✅ 最终小区信息:', this.currentCommunityInfo);

				} catch (error) {
					console.error('❌ 加载小区信息失败:', error);
					uni.showToast({
						title: '地址信息加载失败',
						icon: 'none'
					});
				} finally {
					uni.hideLoading();
				}
			},

			// 加载四级地址数据
			async loadAddressData() {
				try {
					uni.showLoading({
						title: '加载地址信息...'
					});

					console.log('🚀 开始加载四级地址数据');
					console.log('📍 小区名称:', this.currentCommunityName);

					// 只传递小区名称
					const requestData = {
						community: this.currentCommunityName
					};

					console.log('📋 请求参数:', requestData);

					const response = await uni.request({
						// url: 'http://localhost:8543/parking/community/getAllCommunity',
						url:'https://www.xuerparking.cn:8543/parking/community/getAllCommunity',
						method: 'GET',
						data: requestData,
						timeout: 10000
					});

					console.log('📦 完整响应:', response);
					console.log('📦 响应状态码:', response.statusCode);
					console.log('📦 响应数据类型:', typeof response.data);
					console.log('📦 响应数据:', response.data);

					// 检查响应数据结构
					if (response.data && typeof response.data === 'object') {
						console.log('📊 响应数据的code:', response.data.code);
						console.log('📊 响应数据的msg:', response.data.msg);
						console.log('📊 响应数据的data:', response.data.data);
						console.log('📊 data是否为数组:', Array.isArray(response.data.data));

						if (response.data.data && Array.isArray(response.data.data)) {
							console.log('📊 数据数组长度:', response.data.data.length);
							console.log('📊 前3条数据示例:', response.data.data.slice(0, 3));

							// 构建四级地址树形结构
							this.buildAddressTree(response.data.data);
							console.log('✅ 地址数据加载成功');
						} else {
							console.warn('⚠️ response.data.data 不是数组或为空');
							uni.showToast({
								title: '数据格式异常',
								icon: 'none'
							});
						}
					} else if (response.statusCode === 200 && response.data && Array.isArray(response.data)) {
						// 直接返回数组的情况
						console.log('📊 直接返回数组，长度:', response.data.length);
						console.log('📊 前3条数据示例:', response.data.slice(0, 3));

						// 构建四级地址树形结构
						this.buildAddressTree(response.data);
						console.log('✅ 地址数据加载成功');
					} else {
						console.warn('⚠️ 地址数据为空或格式异常');
						console.warn('⚠️ statusCode:', response.statusCode);
						console.warn('⚠️ data type:', typeof response.data);
						console.warn('⚠️ data:', response.data);
						uni.showToast({
							title: '该小区暂无地址数据',
							icon: 'none'
						});
					}
				} catch (error) {
					console.error('❌ 加载地址数据失败:', error);
					uni.showToast({
						title: '地址信息加载失败',
						icon: 'none',
						duration: 3000
					});
				} finally {
					uni.hideLoading();
				}
			},

			// 构建四级地址树形结构
			buildAddressTree(data) {
				console.log('🏗️ 开始构建地址树形结构，原始数据长度:', data.length);
				console.log('🔍 前5条数据样例:', data.slice(0, 5));

				// 重置地址数据
				this.addressData = {};
				this.addressRange = [
					[],
					[],
					[],
					[]
				];

				// 从数据中提取省市区信息
				if (data.length > 0) {
					const firstItem = data[0];
					console.log('🌍 从数据中提取省市区信息:', firstItem);

					// 更新小区信息为真实数据
					if (firstItem.province) {
						this.currentCommunityInfo.province = firstItem.province;
					}
					if (firstItem.city) {
						this.currentCommunityInfo.city = firstItem.city;
					}
					if (firstItem.district) {
						this.currentCommunityInfo.district = firstItem.district;
					}
					if (firstItem.community) {
						this.currentCommunityInfo.community = firstItem.community;
						this.currentCommunityName = firstItem.community;
					}

					console.log('✅ 更新后的小区信息:', this.currentCommunityInfo);
				}

				// 按栋分组
				const buildingMap = {};
				let validCount = 0;
				let invalidCount = 0;

				data.forEach((item, index) => {
					console.log(`🏘️ 处理第${index + 1}条数据:`, item);

					const building = item.building;
					const units = item.units;
					const floor = item.floor;
					const roomnumber = item.roomnumber;

					// 检查数据完整性
					if (!building || units === undefined || floor === undefined || roomnumber === undefined) {
						console.warn(`⚠️ 数据不完整:`, {
							building,
							units,
							floor,
							roomnumber
						});
						invalidCount++;
						return;
					}

					validCount++;

					if (!buildingMap[building]) {
						buildingMap[building] = {};
						console.log(`🏢 创建新栋: ${building}`);
					}

					if (!buildingMap[building][units]) {
						buildingMap[building][units] = {};
						console.log(`🏠 在${building}栋创建新单元: ${units}`);
					}

					if (!buildingMap[building][units][floor]) {
						buildingMap[building][units][floor] = [];
						console.log(`🏭 在${building}栋${units}单元创建新楼层: ${floor}`);
					}

					buildingMap[building][units][floor].push(roomnumber);
					console.log(`🚪 在${building}栋${units}单元${floor}楼添加房间: ${roomnumber}`);
				});

				console.log(`📊 数据处理统计: 有效=${validCount}, 无效=${invalidCount}`);

				this.addressData = buildingMap;
				console.log('🏢 最终地址数据结构:', this.addressData);
				console.log('🏢 栋数量:', Object.keys(buildingMap).length);

				// 初始化第一级选项（栋）
				this.addressRange[0] = Object.keys(buildingMap).map(building => ({
					name: building + '栋'
				}));

				console.log('🎯 第一级选项（栋）:', this.addressRange[0]);
				console.log('🎯 第一级选项数量:', this.addressRange[0].length);

				// 如果有栋的选项，初始化第二级选项（单元）
				if (this.addressRange[0].length > 0) {
					console.log('✅ 开始初始化第二级选项');
					this.updateColumnOptions(0, 0);
				} else {
					console.warn('❌ 没有找到任何栋数据，无法初始化选择器');
				}

				// 更新表单地址信息
				this.form.addressInfo.province = this.currentCommunityInfo.province;
				this.form.addressInfo.city = this.currentCommunityInfo.city;
				this.form.addressInfo.district = this.currentCommunityInfo.district;
				this.form.addressInfo.community = this.currentCommunityInfo.community;
			},

			// 更新指定列的选项
			updateColumnOptions(columnIndex, selectedIndex) {
				console.log(`🔄 更新第${columnIndex + 1}级选项，选中索引: ${selectedIndex}`);
				console.log(`🔍 当前addressRange状态:`, this.addressRange);
				console.log(`🔍 当前addressData状态:`, this.addressData);

				// 清空后续列的选项
				for (let i = columnIndex + 1; i < 4; i++) {
					this.addressRange[i] = [];
					if (i < 3) { // 除了最后一列，都重置选中索引
						this.addressValue[i] = 0;
					}
				}

				if (columnIndex === 0) {
					// 栋选择变化，更新单元选项
					const selectedBuilding = this.addressRange[0][selectedIndex];
					console.log(`🏢 选中的栋:`, selectedBuilding);

					// 提取实际的楼栋号（去掉"栋"字）
					const actualBuilding = selectedBuilding.name.replace('栋', '');

					if (selectedBuilding && this.addressData[actualBuilding]) {
						const unitsKeys = Object.keys(this.addressData[actualBuilding]);
						console.log(`🏠 找到的单元键:`, unitsKeys);

						this.addressRange[1] = unitsKeys.map(units => ({
							name: units + '单元'
						}));
						console.log('🏠 第二级选项（单元）:', this.addressRange[1]);

						// 如果有单元选项，初始化第三级选项（楼层）
						if (this.addressRange[1].length > 0) {
							console.log('✅ 单元选项不为空，继续初始化楼层');
							this.updateColumnOptions(1, 0);
						} else {
							console.warn('❌ 单元选项为空');
						}
					} else {
						console.warn('❌ 栋选择无效或无数据:', selectedBuilding);
					}
				} else if (columnIndex === 1) {
					// 单元选择变化，更新楼层选项
					const selectedBuilding = this.addressRange[0][this.addressValue[0]];
					const selectedUnits = this.addressRange[1][selectedIndex];
					console.log(`🏠 选中的栋:`, selectedBuilding);
					console.log(`🏠 选中的单元:`, selectedUnits);

					// 提取实际的楼栋号和单元号
					const actualBuilding = selectedBuilding.name.replace('栋', '');
					const actualUnits = selectedUnits.name.replace('单元', '');

					if (selectedBuilding && selectedUnits && this.addressData[actualBuilding][actualUnits]) {
						const floorKeys = Object.keys(this.addressData[actualBuilding][actualUnits]);
						console.log(`🏭 找到的楼层键:`, floorKeys);

						this.addressRange[2] = floorKeys.map(floor => ({
							name: floor + '楼'
						}));
						console.log('🏢 第三级选项（楼层）:', this.addressRange[2]);

						// 如果有楼层选项，初始化第四级选项（房间）
						if (this.addressRange[2].length > 0) {
							console.log('✅ 楼层选项不为空，继续初始化房间');
							this.updateColumnOptions(2, 0);
						} else {
							console.warn('❌ 楼层选项为空');
						}
					} else {
						console.warn('❌ 单元选择无效或无数据');
					}
				} else if (columnIndex === 2) {
					// 楼层选择变化，更新房间选项
					const selectedBuilding = this.addressRange[0][this.addressValue[0]];
					const selectedUnits = this.addressRange[1][this.addressValue[1]];
					const selectedFloor = this.addressRange[2][selectedIndex];
					console.log(`🚪 选中的栋:`, selectedBuilding);
					console.log(`🚪 选中的单元:`, selectedUnits);
					console.log(`🚪 选中的楼层:`, selectedFloor);

					// 提取实际的楼栋号、单元号和楼层号
					const actualBuilding = selectedBuilding.name.replace('栋', '');
					const actualUnits = selectedUnits.name.replace('单元', '');
					const actualFloor = selectedFloor.name.replace('楼', '');

					if (selectedBuilding && selectedUnits && selectedFloor) {
						const rooms = this.addressData[actualBuilding][actualUnits][actualFloor];
						console.log(`🚪 找到的房间数组:`, rooms);

						this.addressRange[3] = rooms.map(roomnumber => ({
							name: roomnumber + '室'
						}));
						console.log('🚪 第四级选项（房间）:', this.addressRange[3]);
					} else {
						console.warn('❌ 楼层选择无效或无数据');
					}
				}

				// 输出最终的addressRange状态
				console.log(`✅ 第${columnIndex + 1}级选项更新完成:`, this.addressRange);
			},

			// 四级选择器列变化事件
			onAddressColumnChange(e) {
				console.log('📋 地址选择器列变化:', e.detail);
				const columnIndex = e.detail.column;
				const selectedIndex = e.detail.value;

				// 更新当前列的选中值
				this.addressValue[columnIndex] = selectedIndex;

				// 更新后续列的选项
				this.updateColumnOptions(columnIndex, selectedIndex);

				// 更新显示文本
				this.updateAddressDisplay();
			},

			// 四级选择器确认选择事件
			onAddressChange(e) {
				console.log('✅ 地址选择器确认选择:', e.detail);
				this.addressValue = e.detail.value;

				// 更新表单数据
				this.updateFormAddress();

				// 更新显示文本
				this.updateAddressDisplay();

				// 更新完整地址
				this.updateFullAddress();
			},

			// 更新表单地址数据
			updateFormAddress() {
				const [buildingIndex, unitsIndex, floorIndex, roomIndex] = this.addressValue;

				// 更新表单地址信息（去掉单位，只保留数值）
				if (this.addressRange[0][buildingIndex]) {
					this.form.addressInfo.building = this.addressRange[0][buildingIndex].name.replace('栋', '');
				}
				if (this.addressRange[1][unitsIndex]) {
					this.form.addressInfo.units = this.addressRange[1][unitsIndex].name.replace('单元', '');
				}
				if (this.addressRange[2][floorIndex]) {
					this.form.addressInfo.floor = this.addressRange[2][floorIndex].name.replace('楼', '');
				}
				if (this.addressRange[3][roomIndex]) {
					this.form.addressInfo.roomnumber = this.addressRange[3][roomIndex].name.replace('室', '');
				}

				console.log('📝 更新表单地址信息:', this.form.addressInfo);
			},

			// 更新地址显示文本
			updateAddressDisplay() {
				const parts = [];
				const [buildingIndex, unitsIndex, floorIndex, roomIndex] = this.addressValue;

				// 现在name字段已经包含单位，直接使用即可
				if (this.addressRange[0][buildingIndex]) {
					parts.push(this.addressRange[0][buildingIndex].name);
				}
				if (this.addressRange[1][unitsIndex]) {
					parts.push(this.addressRange[1][unitsIndex].name);
				}
				if (this.addressRange[2][floorIndex]) {
					parts.push(this.addressRange[2][floorIndex].name);
				}
				if (this.addressRange[3][roomIndex]) {
					parts.push(this.addressRange[3][roomIndex].name);
				}

				this.addressDisplay = parts.join(' ');
				console.log('📍 地址显示文本:', this.addressDisplay);
			},

			// 更新完整地址
			updateFullAddress() {
				const parts = [];

				// 使用当前小区的省市区信息
				if (this.currentCommunityInfo.province) parts.push(this.currentCommunityInfo.province);
				if (this.currentCommunityInfo.city) parts.push(this.currentCommunityInfo.city);
				if (this.currentCommunityInfo.district) parts.push(this.currentCommunityInfo.district);
				if (this.currentCommunityInfo.community) parts.push(this.currentCommunityInfo.community);

				// 用户选择的具体地址
				if (this.form.addressInfo.building) parts.push(this.form.addressInfo.building + '栋');
				if (this.form.addressInfo.units) parts.push(this.form.addressInfo.units + '单元');
				if (this.form.addressInfo.floor) parts.push(this.form.addressInfo.floor + '楼');
				if (this.form.addressInfo.roomnumber) parts.push(this.form.addressInfo.roomnumber + '室');

				this.form.fullAddress = parts.join('');
				console.log('📍 完整地址更新:', this.form.fullAddress);
			},

			// 提交申请
			async submitApplication() {
				// 首先检查是否同意协议
				if (!this.agreeTerms) {
					this.showAgreementConfirmModal = true;
					return;
				}

				if (!this.canSubmit) return;

				// 表单验证
				if (!this.validateForm()) return;

				this.submitting = true;
				this.submittingText = '正在提交申请...';

				try {
					// 第一阶段：验证信息
					this.submittingText = '正在验证申请信息...';
					await new Promise(resolve => setTimeout(resolve, 500));

					// 第二阶段：提交到服务器
					this.submittingText = '正在提交到服务器...';
					const result = await this.submitToServer();

					// 第三阶段：处理结果
					this.submittingText = '提交成功，正在处理...';
					await new Promise(resolve => setTimeout(resolve, 500));

					// 根据审核策略决定后续流程
					if (this.auditPolicy === 'auto') {
						// 自动通过，直接登录
						this.handleAutoApproval();
					} else {
						// 需要审核，显示等待提示
						this.showSuccessModal = true;

						// 显示成功提示
						// uni.showToast({
						// 	title: '申请提交成功',
						// 	icon: 'success',
						// 	duration: 2000
						// });
					}

				} catch (error) {
					console.error('提交申请失败:', error);

					// 显示详细的错误信息
					uni.showModal({
						title: '申请提交失败',
						content: error.message || '申请提交失败，请检查网络连接后重试',
						showCancel: true,
						cancelText: '稍后重试',
						confirmText: '立即重试',
						success: (res) => {
							if (res.confirm) {
								// 用户选择立即重试
								setTimeout(() => {
									this.submitApplication();
								}, 1000);
							}
						}
					});
				} finally {
					this.submitting = false;
					this.submittingText = '正在提交申请...';
				}
			},

			// 表单验证
			validateForm() {
				if (!this.form.nickname.trim()) {
					uni.showToast({
						title: '请输入姓名',
						icon: 'none'
					});
					return false;
				}

				if (this.form.nickname.length < 2) {
					uni.showToast({
						title: '姓名至少2个字符',
						icon: 'none'
					});
					return false;
				}

				if (!this.form.ownerPhone.trim()) {
					uni.showToast({
						title: '请输入访问业主手机号',
						icon: 'none'
					});
					return false;
				}

				if (this.form.ownerPhone.length !== 11) {
					uni.showToast({
						title: '业主手机号格式不正确',
						icon: 'none'
					});
					return false;
				}

				if (this.ownerVerifyStatus !== 'valid') {
					uni.showToast({
						title: '请确保业主手机号验证通过',
						icon: 'none'
					});
					return false;
				}

				if (!this.form.reason.trim()) {
					uni.showToast({
						title: '请填写申请原因',
						icon: 'none'
					});
					return false;
				}

				if (this.form.reason.length < 2) {
					uni.showToast({
						title: '申请原因至少2个字符',
						icon: 'none'
					});
					return false;
				}

				if (!this.form.fullAddress.trim()) {
					uni.showToast({
						title: '请选择访问地址',
						icon: 'none'
					});
					return false;
				}

				if (this.form.idCard && !this.validateIdCard(this.form.idCard)) {
					uni.showToast({
						title: '身份证号格式不正确',
						icon: 'none'
					});
					return false;
				}

				return true;
			},

			// 身份证验证
			validateIdCard(idCard) {
				const reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
				return reg.test(idCard);
			},

			// 提交到服务器
			async submitToServer() {
				try {
					// 导入API配置
					const {
						visitorAPI
					} = await import('@/config/api.js');

					// 准备提交数据（包含完整的省市区信息）
					const submitData = {
						nickname: this.form.nickname.trim(),
						phone: this.form.phone,
						ownerPhone: this.form.ownerPhone.trim(), // 访问业主手机号
						gender: this.form.gender,
						idCard: this.form.idCard.trim() || null,
						reason: this.form.reason.trim(),
						address: this.form.address.trim() || null,
						fullAddress: this.form.fullAddress.trim(),
						// 传递完整的地址信息
						province: this.form.addressInfo.province || this.currentCommunityInfo.province,
						city: this.form.addressInfo.city || this.currentCommunityInfo.city,
						district: this.form.addressInfo.district || this.currentCommunityInfo.district,
						community: this.form.addressInfo.community || this.currentCommunityName,
						building: this.form.addressInfo.building,
						units: this.form.addressInfo.units,
						floor: this.form.addressInfo.floor,
						roomnumber: this.form.addressInfo.roomnumber,
						// 业主相关信息
						ownerName: this.ownerInfo.name,
						ownerAddress: this.ownerInfo.address,
						ownerCommunity: this.ownerInfo.community,
						userkind: 'visitor',
						auditstatus: '待审批',
						applyTime: new Date().toISOString()
					};

					console.log('📤 提交访客申请数据:', submitData);

					// 调用后端API
					const result = await visitorAPI.submitApplication(submitData);

					console.log('✅ 访客申请提交成功:', result);

					// 检查后端返回结果
					if (result.code === "0") {
						// 保存审核策略信息
						this.auditPolicy = result.data?.auditPolicy || 'manual'; // manual需要审核, auto自动通过
						this.applicationId = result.data?.applicationId;

						return result;
					} else {
						throw new Error(result.msg || '申请提交失败');
					}

				} catch (error) {
					console.error('❌ 访客申请提交失败:', error);

					// 根据错误类型抛出友好的错误信息
					if (error.message.includes('timeout') || error.message.includes('网络')) {
						throw new Error('网络连接超时，请检查网络后重试');
					} else if (error.statusCode >= 500) {
						throw new Error('服务器暂时不可用，请稍后重试');
					} else if (error.statusCode === 400) {
						throw new Error('申请信息有误，请检查后重新提交');
					} else {
						throw new Error(error.message || '申请提交失败，请稍后重试');
					}
				}
			},

			// 自动通过处理
			handleAutoApproval() {
				console.log('🎉 车场自动通过访客申请');

				// 标记该手机号已通过申请，可以直接登录
				try {
					const appliedPhones = uni.getStorageSync('appliedVisitorPhones') || [];
					if (!appliedPhones.includes(this.form.phone)) {
						appliedPhones.push(this.form.phone);
						uni.setStorageSync('appliedVisitorPhones', appliedPhones);
					}

					// 更新用户信息状态为已通过
					const userInfo = uni.getStorageSync('userInfo') || {};
					userInfo.hasAppliedVisitor = true;
					userInfo.applicationStatus = 'approved'; // 已通过
					userInfo.role = 'visitor';
					userInfo.roleText = '访客';
					userInfo.isAuthorized = true;
					userInfo.userInfo = {
						id: this.applicationId,
						openid: 'visitor_' + this.form.phone,
						nickname: this.form.nickname,
						phone: this.form.phone,
						auditstatus: '已通过',
						userkind: 'visitor'
					};
					userInfo.permissions = ['appointment.create', 'appointment.query.own', 'visitor.appointment',
						'visitor.query'
					];
					uni.setStorageSync('userInfo', userInfo);

					console.log('已标记手机号自动通过状态:', this.form.phone);
				} catch (error) {
					console.error('保存通过状态失败:', error);
				}

				// 显示自动通过提示
				uni.showModal({
					title: '申请通过',
					content: '恭喜！四季上东停车场已自动通过您的访客申请。\n\n您现在可以使用访客身份进行停车预约等服务。',
					showCancel: false,
					confirmText: '立即使用',
					success: () => {
						// 直接跳转到主应用，触发重新授权检查
						uni.reLaunch({
							url: '/pages/auth/phone-auth'
						});
					}
				});
			},

			// 成功确认（需要审核的情况）
			handleSuccessConfirm() {
				this.showSuccessModal = false;

				// 标记该手机号已提交访客申请（需要审核）
				try {
					const appliedPhones = uni.getStorageSync('appliedVisitorPhones') || [];
					if (!appliedPhones.includes(this.form.phone)) {
						appliedPhones.push(this.form.phone);
						uni.setStorageSync('appliedVisitorPhones', appliedPhones);
					}

					// 更新用户信息状态
					const userInfo = uni.getStorageSync('userInfo') || {};
					userInfo.hasAppliedVisitor = true;
					userInfo.applicationStatus = 'pending';
					uni.setStorageSync('userInfo', userInfo);

					console.log('已标记手机号申请状态:', this.form.phone);
				} catch (error) {
					console.error('保存申请状态失败:', error);
				}

				// 返回登录页面
				uni.reLaunch({
					url: '/pages/auth/phone-auth'
				});
			},

			// 显示访客使用协议
			showServiceAgreement() {
				this.currentAgreementTitle = '访客使用协议';
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
				}

				// 关闭弹窗
				this.closeAgreementModal();
			},

			// 关闭协议确认弹窗
			closeAgreementConfirmModal() {
				this.showAgreementConfirmModal = false;

				// 显示提示
				uni.showToast({
					title: '请先同意协议后再提交',
					icon: 'none',
					duration: 2000
				});
			},

			// 去查看协议（从确认弹窗）
			goToAgreement() {
				this.showAgreementConfirmModal = false;
				// 显示访客使用协议
				this.showServiceAgreement();
			},

			// 返回
			goBack() {
				uni.showModal({
					title: '确认取消',
					content: '确定要取消申请吗？已填写的信息将丢失',
					success: (res) => {
						if (res.confirm) {
							uni.navigateBack();
						}
					}
				});
			}
		}
	}
</script>

<style lang="scss" scoped>
	.apply-container {
		min-height: 100vh;
		background: linear-gradient(135deg, #f8fafc 0%, #e8f4f8 100%);
		padding: 0;
	}

	.header {
		background: linear-gradient(135deg, #1677ff 0%, #0958d9 100%);
		text-align: center;
		padding: 80rpx 30rpx 60rpx;
		position: relative;

		&::after {
			content: '';
			position: absolute;
			bottom: 0;
			left: 0;
			right: 0;
			height: 40rpx;
			background: linear-gradient(135deg, #f8fafc 0%, #e8f4f8 100%);
			border-radius: 40rpx 40rpx 0 0;
		}

		.title {
			display: block;
			font-size: 44rpx;
			font-weight: 700;
			color: #fff;
			margin-bottom: 16rpx;
			text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
		}

		.subtitle {
			display: block;
			font-size: 26rpx;
			color: rgba(255, 255, 255, 0.9);
			line-height: 1.6;
			text-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.2);
		}
	}

	.form-container {
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10rpx);
		border-radius: 32rpx;
		padding: 50rpx 40rpx;
		margin: 20rpx 30rpx 30rpx;
		box-shadow: 0 8rpx 40rpx rgba(22, 119, 255, 0.1);
		border: 1rpx solid rgba(255, 255, 255, 0.8);
	}

	.form-item {
		margin-bottom: 50rpx;

		&:last-child {
			margin-bottom: 0;
		}

		.label {
			display: block;
			font-size: 32rpx;
			color: #1a202c;
			margin-bottom: 24rpx;
			font-weight: 600;
			position: relative;

			&::after {
				content: '';
				position: absolute;
				left: 0;
				bottom: -8rpx;
				width: 40rpx;
				height: 4rpx;
				background: linear-gradient(90deg, #1677ff, #69c0ff);
				border-radius: 2rpx;
			}
		}

		.input {
			width: 100%;
			height: 96rpx;
			border: 2rpx solid #e1e8f0;
			border-radius: 16rpx;
			padding: 0 28rpx;
			font-size: 32rpx;
			color: #2d3748;
			background: #fff;
			transition: all 0.3s ease;

			&.readonly {
				background: linear-gradient(135deg, #f7f9fc 0%, #e8f4f8 100%);
				color: #718096;
				border-color: #e2e8f0;
			}

			&:focus {
				border-color: #1677ff;
				box-shadow: 0 0 0 6rpx rgba(22, 119, 255, 0.1);
				background: #fff;
			}
		}

		.textarea {
			width: 100%;
			min-height: 140rpx;
			border: 2rpx solid #e1e8f0;
			border-radius: 16rpx;
			padding: 28rpx;
			font-size: 32rpx;
			color: #2d3748;
			line-height: 1.6;
			background: #fff;
			transition: all 0.3s ease;

			&:focus {
				border-color: #1677ff;
				box-shadow: 0 0 0 6rpx rgba(22, 119, 255, 0.1);
			}
		}

		.tip {
			display: block;
			font-size: 24rpx;
			color: #718096;
			margin-top: 12rpx;
			padding-left: 8rpx;
		}

		.char-count {
			display: block;
			text-align: right;
			font-size: 24rpx;
			color: #a0aec0;
			margin-top: 12rpx;
		}

		.gender-radio-group {
			display: flex;
			gap: 24rpx;

			.gender-option {
				flex: 1;
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 12rpx;
				height: 80rpx;
				border: 2rpx solid #e2e8f0;
				border-radius: 16rpx;
				background: #fff;
				transition: all 0.3s ease;
				cursor: pointer;

				&.active {
					border-color: #1677ff;
					background: linear-gradient(135deg, #f0f8ff 0%, #e6f7ff 100%);
					box-shadow: 0 4rpx 12rpx rgba(22, 119, 255, 0.15);
				}

				.gender-text {
					font-size: 30rpx;
					color: #4a5568;
					font-weight: 500;
				}

				&.active .gender-text {
					color: #1677ff;
					font-weight: 600;
				}
			}
		}

		// 业主手机号验证样式
		.owner-phone-container {
			position: relative;

			.owner-phone-input {
				padding-right: 140rpx; // 为验证状态留出空间
			}

			.verify-status {
				position: absolute;
				right: 20rpx;
				top: 50%;
				transform: translateY(-50%);

				.status {
					font-size: 24rpx;
					font-weight: 600;
					padding: 8rpx 16rpx;
					border-radius: 12rpx;

					&.verifying {
						color: #1677ff;
						background: linear-gradient(135deg, #f0f8ff 0%, #e6f7ff 100%);
						animation: pulse 1.5s infinite;
					}

					&.valid {
						color: #52c41a;
						background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%);
					}

					&.invalid {
						color: #ff4d4f;
						background: linear-gradient(135deg, #fff2f0 0%, #ffccc7 100%);
					}

					&.error {
						color: #fa8c16;
						background: linear-gradient(135deg, #fff7e6 0%, #ffd591 100%);
					}
				}
			}
		}

		// 🎯 优化后的操作按钮样式
		.action-buttons {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			gap: 16rpx;

			.verify-btn {
				background: linear-gradient(135deg, #1677ff 0%, #0958d9 100%);
				color: white;
				border: none;
				border-radius: 20rpx;
				font-weight: 600;
				box-shadow: 0 4rpx 12rpx rgba(22, 119, 255, 0.3);
				transition: all 0.3s ease;

				&:not(:disabled):active {
					transform: scale(0.95);
					box-shadow: 0 2rpx 8rpx rgba(22, 119, 255, 0.5);
				}

				&:disabled {
					background: linear-gradient(135deg, #cbd5e0 0%, #a0aec0 100%);
					box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
					transform: none;
				}
			}

			.re-verify-btn {
				background: rgba(255, 255, 255, 0.9);
				color: #666;
				border: 1rpx solid #d9d9d9;
				border-radius: 20rpx;
				font-weight: 500;
				transition: all 0.3s ease;

				&:active {
					background: #f5f5f5;
					border-color: #b5b5b5;
				}
			}
		}

		.owner-info {
			margin-top: 20rpx;
			padding: 20rpx 24rpx;
			background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%);
			border-radius: 16rpx;
			border: 1rpx solid #52c41a;

			.owner-detail {
				display: block;
				font-size: 26rpx;
				color: #389e0d;
				line-height: 1.6;
				margin-bottom: 8rpx;

				&:last-child {
					margin-bottom: 0;
				}
			}
		}

		// 当前小区显示样式
		.current-community {
			margin: 24rpx 0;
			padding: 20rpx 24rpx;
			background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
			border-radius: 16rpx;
			border: 1rpx solid #0ea5e9;
			display: flex;
			align-items: center;

			.community-label {
				font-size: 28rpx;
				color: #0369a1;
				font-weight: 500;
				margin-right: 12rpx;
			}

			.community-name {
				font-size: 30rpx;
				color: #0c4a6e;
				font-weight: 600;
				flex: 1;
			}
		}

		// 地址选择器样式
		.address-selector {
			margin-top: 24rpx;

			.address-row {
				display: flex;
				align-items: center;
				margin-bottom: 20rpx;

				.address-label {
					width: 120rpx;
					font-size: 28rpx;
					color: #4a5568;
					font-weight: 500;
					flex-shrink: 0;
				}

				.picker-item {
					flex: 1;
					display: flex;
					align-items: center;
					justify-content: space-between;
					height: 80rpx;
					padding: 0 24rpx;
					border: 2rpx solid #e2e8f0;
					border-radius: 16rpx;
					background: #fff;
					transition: all 0.3s ease;

					&:active {
						border-color: #1677ff;
						background: #f0f8ff;
					}

					.picker-text {
						font-size: 28rpx;
						color: #4a5568;

						&:empty::before {
							content: attr(placeholder);
							color: #a0aec0;
						}
					}

					.picker-arrow {
						font-size: 20rpx;
						color: #a0aec0;
						transition: transform 0.3s ease;
					}
				}

				// 四级选择器特殊样式
				&.multi-selector {
					min-height: 100rpx;

					.picker-text {
						max-width: 480rpx;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
						font-size: 26rpx;
						line-height: 1.4;
					}
				}
			}

			.full-address {
				margin-top: 30rpx;
				padding: 24rpx;
				background: linear-gradient(135deg, #f0f8ff 0%, #e6f7ff 100%);
				border-radius: 16rpx;
				border: 1rpx solid #bae7ff;

				.address-preview-label {
					font-size: 26rpx;
					color: #1677ff;
					font-weight: 600;
					margin-bottom: 8rpx;
					display: block;
				}

				.full-address-text {
					font-size: 28rpx;
					color: #2c5aa0;
					line-height: 1.5;
					word-break: break-all;
				}
			}
		}
	}

	.agreement-section {
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10rpx);
		border-radius: 32rpx;
		padding: 40rpx;
		margin: 0 30rpx 40rpx;
		box-shadow: 0 8rpx 40rpx rgba(22, 119, 255, 0.1);
		border: 1rpx solid rgba(255, 255, 255, 0.8);

		.agreement-item {
			display: flex;
			align-items: flex-start;
			gap: 20rpx;

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
				font-size: 28rpx;
				color: #4a5568;
				line-height: 1.6;

				.link {
					color: #1677ff;
					text-decoration: none;
					font-weight: 600;
					border-bottom: 1rpx solid #1677ff;
				}
			}
		}
	}

	.button-section {
		padding: 0 30rpx 50rpx;

		.submit-btn {
			width: 100%;
			height: 100rpx;
			background: linear-gradient(135deg, #1677ff 0%, #0958d9 100%);
			color: white;
			border: none;
			border-radius: 50rpx;
			font-size: 34rpx;
			font-weight: 600;
			margin-bottom: 24rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			box-shadow: 0 8rpx 24rpx rgba(22, 119, 255, 0.4);
			transition: all 0.3s ease;

			&:not(.disabled):active {
				transform: scale(0.98);
				box-shadow: 0 4rpx 16rpx rgba(22, 119, 255, 0.6);
			}

			&.disabled {
				background: linear-gradient(135deg, #cbd5e0 0%, #a0aec0 100%);
				box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
				transform: none;
			}

			.loading-content {
				display: flex;
				align-items: center;
				gap: 20rpx;

				.loading-dots {
					display: flex;
					gap: 8rpx;

					.dot {
						width: 10rpx;
						height: 10rpx;
						border-radius: 50%;
						background: currentColor;
						animation: dot-bounce 1.4s infinite ease-in-out both;

						&:nth-child(1) {
							animation-delay: -0.32s;
						}

						&:nth-child(2) {
							animation-delay: -0.16s;
						}

						&:nth-child(3) {
							animation-delay: 0s;
						}
					}
				}
			}
		}

		.cancel-btn {
			width: 100%;
			height: 88rpx;
			background: rgba(255, 255, 255, 0.9);
			color: #718096;
			border: 2rpx solid #e2e8f0;
			border-radius: 44rpx;
			font-size: 30rpx;
			font-weight: 500;
			backdrop-filter: blur(10rpx);
			transition: all 0.3s ease;

			&:not(:disabled):active {
				background: #f7fafc;
				border-color: #cbd5e0;
			}

			&:disabled {
				opacity: 0.5;
				background: #f7fafc;
			}
		}
	}

	.success-modal {
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

		.modal-content {
			background: linear-gradient(135deg, #fff 0%, #f8fafc 100%);
			border-radius: 32rpx;
			padding: 80rpx 50rpx 50rpx;
			margin: 0 40rpx;
			text-align: center;
			max-width: 540rpx;
			box-shadow: 0 20rpx 60rpx rgba(22, 119, 255, 0.2);
			border: 1rpx solid rgba(255, 255, 255, 0.8);
			animation: modal-scale-in 0.3s ease;

			.success-icon {
				font-size: 100rpx;
				margin-bottom: 30rpx;
				animation: success-bounce 0.6s ease;
			}

			.success-title {
				display: block;
				font-size: 40rpx;
				font-weight: 700;
				color: #1a202c;
				margin-bottom: 24rpx;
			}

			.success-desc {
				display: block;
				font-size: 28rpx;
				color: #4a5568;
				line-height: 1.8;
				margin-bottom: 50rpx;
			}

			.confirm-btn {
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

	@keyframes success-bounce {
		0% {
			transform: scale(0);
		}

		50% {
			transform: scale(1.2);
		}

		100% {
			transform: scale(1);
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

	// 协议确认弹窗样式
	.confirm-modal {
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

		.confirm-content {
			background: linear-gradient(135deg, #fff 0%, #f8fafc 100%);
			border-radius: 32rpx;
			padding: 60rpx 50rpx 50rpx;
			margin: 0 40rpx;
			text-align: center;
			max-width: 540rpx;
			box-shadow: 0 20rpx 60rpx rgba(255, 152, 0, 0.2);
			border: 1rpx solid rgba(255, 255, 255, 0.8);
			animation: modal-scale-in 0.3s ease;

			.confirm-icon {
				font-size: 80rpx;
				margin-bottom: 30rpx;
				animation: shake 0.5s ease-in-out;
			}

			.confirm-title {
				display: block;
				font-size: 36rpx;
				font-weight: 700;
				color: #d97706;
				margin-bottom: 24rpx;
			}

			.confirm-desc {
				display: block;
				font-size: 28rpx;
				color: #4a5568;
				line-height: 1.8;
				margin-bottom: 50rpx;
			}

			.confirm-buttons {
				display: flex;
				gap: 20rpx;

				.cancel-confirm-btn {
					flex: 1;
					height: 80rpx;
					background: rgba(255, 255, 255, 0.9);
					color: #718096;
					border: 2rpx solid #e2e8f0;
					border-radius: 40rpx;
					font-size: 28rpx;
					font-weight: 500;
					transition: all 0.3s ease;

					&:active {
						background: #f7fafc;
						border-color: #cbd5e0;
					}
				}

				.agree-confirm-btn {
					flex: 1;
					height: 80rpx;
					background: linear-gradient(135deg, #1677ff 0%, #0958d9 100%);
					color: white;
					border: none;
					border-radius: 40rpx;
					font-size: 28rpx;
					font-weight: 600;
					box-shadow: 0 6rpx 20rpx rgba(22, 119, 255, 0.4);
					transition: all 0.3s ease;

					&:active {
						transform: scale(0.98);
						box-shadow: 0 3rpx 12rpx rgba(22, 119, 255, 0.6);
					}
				}
			}
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

	@keyframes pulse {
		0% {
			opacity: 1;
			transform: scale(1);
		}

		50% {
			opacity: 0.7;
			transform: scale(0.95);
		}

		100% {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>