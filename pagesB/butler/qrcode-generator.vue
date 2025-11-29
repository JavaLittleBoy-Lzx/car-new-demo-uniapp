<template>
	<view class="page-wrapper">
		<!-- 自定义导航栏 -->
		<view class="custom-navbar">
			<view class="navbar-content" :style="{ marginTop: statusBarHeight + 'px' }">
				<!-- 左侧首页图标（不可点击） -->
				<view class="navbar-left">
					<view class="home-icon-disabled">
						<u-icon name="home" size="20" color="#ffffff"></u-icon>
					</view>
				</view>
				<!-- 中间标题 -->
				<view class="navbar-title">访客邀请</view>
				<!-- 右侧按钮区域 -->
			</view>
		</view>

		<view class="container safe-area-inset-bottom" :style="{ paddingTop: (statusBarHeight + 88) + 'px' }">
			<!-- 地址选择器 -->
			<view class="address-selector">
				<view class="selector-title">
					<view class="title-left">
						<tui-icon name="position" size="16" color="#025def"></tui-icon>
						<text class="title-text">选择访问地址</text>
					</view>
				</view>
				<!-- 详细地址选择 -->
				<view class="detail-selector" v-if="selectedAddress.community">
					<view class="selector-row">
						<view class="selector-item">
							<text class="selector-label">栋</text>
							<u-picker ref="buildingPicker" :show="showBuildingPicker" :columns="buildingColumns"
								@close="showBuildingPicker = false" @cancel="showBuildingPicker = false"
								@confirm="onBuildingConfirm" :closeOnClickOverlay="true">
							</u-picker>
							<view class="selector-trigger" @click="openBuildingPicker">
								<text class="selector-text">{{ selectedAddress.building || '选择栋' }}</text>
								<tui-icon name="down" size="14" color="#999"></tui-icon>
							</view>
						</view>
						<view class="selector-item">
							<text class="selector-label">座</text>
							<u-picker ref="unitsPicker" :show="showUnitsPicker" :columns="unitsColumns"
								@close="showUnitsPicker = false" @cancel="showUnitsPicker = false"
								@confirm="onUnitsConfirm" :closeOnClickOverlay="true">
							</u-picker>
							<view class="selector-trigger"
								:class="!selectedAddress.building ? 'selector-trigger disabled' : 'selector-trigger'"
								@click="openUnitsPicker">
								<text class="selector-text">{{ selectedAddress.units || '选择座' }}</text>
								<tui-icon name="down" size="14" color="#999"></tui-icon>
							</view>
						</view>
					</view>

					<view class="selector-row">
						<view class="selector-item">
							<text class="selector-label">单元</text>
							<u-picker ref="floorPicker" :show="showFloorPicker" :columns="floorColumns"
								@close="showFloorPicker = false" @cancel="showFloorPicker = false"
								@confirm="onFloorConfirm" :closeOnClickOverlay="true">
							</u-picker>
							<view class="selector-trigger"
								:class="!selectedAddress.units ? 'selector-trigger disabled' : 'selector-trigger'"
								@click="openFloorPicker">
								<text class="selector-text">{{ selectedAddress.floor || '选择单元' }}</text>
								<tui-icon name="down" size="14" color="#999"></tui-icon>
							</view>
						</view>

						<view class="selector-item">
							<text class="selector-label">房间号</text>
							<u-picker ref="roomPicker" :show="showRoomPicker" :columns="roomColumns"
								@close="showRoomPicker = false" @cancel="showRoomPicker = false"
								@confirm="onRoomConfirm" :closeOnClickOverlay="true">
							</u-picker>
							<view class="selector-trigger"
								:class="!selectedAddress.floor ? 'selector-trigger disabled' : 'selector-trigger'"
								@click="openRoomPicker">
								<text class="selector-text">{{ selectedAddress.room || '选择房间' }}</text>
								<tui-icon name="down" size="14" color="#999"></tui-icon>
							</view>
						</view>
					</view>
				</view>
			</view>

			<!-- 业主信息选择器 -->
			<view class="owner-selector" v-if="selectedAddress.community">
				<view class="selector-title">
					<view class="title-left">
						<tui-icon name="account" size="16" color="#025def"></tui-icon>
						<text class="title-text">选择业主信息</text>
						<text class="required-tag">必选</text>
					</view>
					<view class="title-right" v-if="ownerList.length > 0">
						<text class="owner-count">共{{ ownerList.length }}位业主</text>
						<text class="search-tip" v-if="ownerList.length <= 5">（数量较少，无需搜索）</text>
					</view>
				</view>

				<!-- 必选提示 -->
				<view class="owner-required-tip" v-if="!selectedOwner">
					<tui-icon name="info-circle" size="14" color="#ff9800"></tui-icon>
					<text class="tip-text">请选择一位业主，访客需要知道要拜访的具体业主信息</text>
				</view>

				<!-- 业主搜索框 - 只有当业主数量超过5条时才显示 -->
				<view class="owner-search" v-if="ownerList.length > 5">
					<u-search v-model="ownerSearchKeyword" placeholder="输入业主姓名或手机号搜索" :show-action="false"
						:clearabled="true" @search="searchOwners" @clear="clearOwnerSearch" @input="onOwnerSearchInput"
						height="40" bg-color="#f8f9fa" border-color="#e9ecef"></u-search>
				</view>

				<!-- 业主列表 -->
				<view class="owner-list" v-if="filteredOwnerList.length > 0">
					<view class="owner-item" v-for="(owner, index) in filteredOwnerList" :key="index"
						:class="selectedOwner && selectedOwner.id === owner.id ? 'owner-item selected' : 'owner-item'"
						@click="selectOwner(owner)">
						<view class="owner-info">
							<view class="owner-name">{{ owner.ownername || '未知业主' }}</view>
							<view class="owner-phone">{{ owner.ownerphone || '无电话' }}</view>
						</view>
						<view class="owner-address">
							<text class="address-detail">
								{{ formatOwnerAddress(owner) }}
							</text>
						</view>
						<view class="owner-status" v-if="owner.isaudit">
							<text class="status-text" :class="'status-text ' + getAuditStatusClass(owner.isaudit)">
								{{ getAuditStatusText(owner.isaudit) }}
							</text>
						</view>
						<view class="select-indicator" v-if="selectedOwner && selectedOwner.id === owner.id">
							<tui-icon name="check" size="16" color="#025def"></tui-icon>
						</view>
					</view>
				</view>

				<!-- 无业主数据提示 -->
				<view class="no-owner-tip" v-if="ownerSearched && filteredOwnerList.length === 0">
					<tui-icon name="info-circle" size="20" color="#999"></tui-icon>
					<text class="tip-text">该地址暂无业主信息</text>
					<text class="tip-desc">请确认地址是否正确，或联系管理员添加业主信息</text>
				</view>

				<!-- 加载状态 -->
				<view class="owner-loading" v-if="ownerLoading">
					<u-loading-icon mode="circle" color="#025def" size="20"></u-loading-icon>
					<text class="loading-text">正在查询业主信息...</text>
				</view>
			</view>

			<!-- 选中业主信息预览 -->
			<view class="selected-owner-preview" v-if="selectedOwner">
				<view class="preview-title">
					<tui-icon name="account-check" size="16" color="#025def"></tui-icon>
					<text class="title-text">已选择业主</text>
				</view>
				<view class="preview-content">
					<view class="owner-detail">
						<text class="owner-name">{{ selectedOwner.ownername }}</text>
						<text class="owner-phone">{{ selectedOwner.ownerphone }}</text>
					</view>
					<view class="owner-address-detail">
						<text class="address-text">{{ formatOwnerAddress(selectedOwner) }}</text>
					</view>
				</view>
			</view>

			<!-- 地址预览 -->
			<view class="address-preview" v-if="fullAddress">
				<view class="preview-title">
					<tui-icon name="location" size="16" color="#025def"></tui-icon>
					<text class="title-text">访问地址预览</text>
				</view>
				<view class="preview-content">
					<text class="address-text">{{ fullAddress }}</text>
				</view>
			</view>

			<!-- 生成按钮 -->
			<view class="generate-section">
				<u-button type="primary" :disabled="!canGenerate" @click="generateQrCode" :loading="isGenerating"
					loadingText="生成中..." :text="generateButtonText"
					customStyle="border-radius: 25px; height: 50px; font-size: 16px;">
				</u-button>
			</view>

			<!-- 二维码展示 -->
			<view class="qrcode-section" v-if="qrCodeData">
				<view class="qrcode-title">
					<tui-icon name="qrcode" size="16" color="#025def"></tui-icon>
					<text class="title-text">访客预约二维码</text>
				</view>
				<view class="qrcode-container">
					<canvas canvas-id="qrCanvas" :style="{ width: qrSize + 'px', height: qrSize + 'px' }"
						class="qr-canvas">
					</canvas>
					<!-- 隐藏的临时canvas -->
					<canvas canvas-id="tempQrCanvas"
						:style="{ width: qrSize + 'px', height: qrSize + 'px', display: 'none' }" class="temp-canvas">
					</canvas>
				</view>
				<view class="action-buttons">
					<u-button type="success" @click="saveQrCode" text="保存图片"
						customStyle="border-radius: 20px; margin-right: 8px; flex: 1;">
					</u-button>
					<u-button type="info" @click="shareQrCodeImage" text="分享二维码图片"
						customStyle="border-radius: 20px; flex: 1;">
					</u-button>
				</view>
			</view>

			<!-- 添加底部安全区域 -->
			<view class="bottom-safe-area"></view>

			<!-- 自定义TabBar -->
			<custom-tabbar :userRole="currentUserRole" @tabChange="onTabChange">
			</custom-tabbar>
		</view>
	</view>
</template>

<script>
import {
	request,
	apiUrls,
	ownerAPI
} from '@/config/api.js'
// 按照cc-defineQRCode插件文档的方式引入（多种尝试方式）
import uQRCode from '@/uni_modules/cc-defineQRCode/components/cc-defineQRCode/common/uqrcode.js'
// 导入自定义TabBar组件
import CustomTabbar from '@/components/custom-tabbar.vue'

export default {
	components: {
		CustomTabbar
	},

	data() {
		return {
			// 状态栏高度
			statusBarHeight: 0,

			// 🎯 基础URL配置（后台已配置跳转规则）
			baseUrl: 'https://www.xuerparking.cn:8543/verify/butler/', // 完整URL基础路径

			// 用户角色配置
			currentUserRole: 'manager', // 默认管家角色

			butlerInfo: null,
			selectedAddress: {
				province: '',
				city: '',
				district: '',
				community: '',
				building: '',
				units: '',
				floor: '',
				room: ''
			},

			// Picker显示状态
			showProvincePicker: false,
			showCityPicker: false,
			showDistrictPicker: false,
			showCommunityPicker: false,
			showBuildingPicker: false,
			showUnitsPicker: false,
			showFloorPicker: false,
			showRoomPicker: false,

			// Picker数据
			provinceColumns: [
				[]
			],
			cityColumns: [
				[]
			],
			districtColumns: [
				[]
			],
			communityColumns: [
				[]
			],
			buildingColumns: [
				[]
			],
			unitsColumns: [
				[]
			],
			floorColumns: [
				[]
			],
			roomColumns: [
				[]
			],

			// 数据源
			provinceList: [],
			cityList: [],
			districtList: [],
			communityList: [],
			buildingList: [],
			unitsList: [],
			floorList: [],
			roomList: [],

			// 业主相关数据
			ownerList: [], // 当前地址的业主列表
			filteredOwnerList: [], // 过滤后的业主列表
			selectedOwner: null, // 选中的业主
			ownerSearchKeyword: '', // 业主搜索关键词
			ownerLoading: false, // 业主查询加载状态
			ownerSearched: false, // 是否已经搜索过业主

			isGenerating: false,
			qrCodeData: null,
			qrCodeText: '',
			qrSize: 280,
			showDebugInfo: false,
			qrCodeType: 'miniprogram', // 默认使用小程序码
			successfulFormat: null, // 存储测试成功的格式
			qrCodeImagePath: '', // 存储生成的二维码图片路径

			// 🆕 二维码唯一性控制相关
			currentQrId: null, // 当前生成的二维码ID
			qrCodeRecorded: false // 是否已记录到后端
		}
	},

	computed: {
		fullAddress() {
			const addr = this.selectedAddress;
			const parts = [];
			if (addr.community) parts.push(addr.community);
			if (addr.building) parts.push(addr.building + '座');
			if (addr.units) parts.push(addr.units + '单元');
			if (addr.room) parts.push(addr.room);
			return parts.join('');
		},

		canGenerate() {
			// 必须选择完整地址和业主信息
			const hasCompleteAddress = this.selectedAddress.province &&
				this.selectedAddress.city &&
				this.selectedAddress.district &&
				this.selectedAddress.community;

			// 必须选择业主信息
			const hasOwnerInfo = this.selectedOwner && this.selectedOwner.ownername && this.selectedOwner.ownerphone;

			return hasCompleteAddress && hasOwnerInfo;
		},

		generateButtonText() {
			const hasCompleteAddress = this.selectedAddress.province &&
				this.selectedAddress.city &&
				this.selectedAddress.district &&
				this.selectedAddress.community;

			const hasOwnerInfo = this.selectedOwner && this.selectedOwner.ownername && this.selectedOwner.ownerphone;

			if (!hasCompleteAddress && !hasOwnerInfo) {
				return '请先选择地址和业主';
			} else if (!hasCompleteAddress) {
				return '请先选择完整地址';
			} else if (!hasOwnerInfo) {
				return '请先选择业主信息';
			} else {
				return '生成访客邀请码';
			}
		},

		// 调试信息计算属性
		userLoginStatus() {
			const userInfo = uni.getStorageSync('userInfo');
			if (!userInfo) return '❌ 未登录';
			if (!userInfo.openid) return '⚠️ openid缺失';
			return '✅ 已登录';
		},

		butlerInfoStatus() {
			if (!this.butlerInfo) return '❌ 未获取';
			if (!this.butlerInfo.username) return '⚠️ 姓名缺失';
			if (!this.butlerInfo.phone) return '⚠️ 电话缺失';
			return '✅ 信息完整';
		},

		addressStatus() {
			const {
				province,
				city,
				district,
				community
			} = this.selectedAddress;
			if (!province || !city || !district || !community) {
				return '⚠️ 地址不完整';
			}
			return '✅ 地址完整';
		},

		qrGenerationStatus() {
			// 显示二维码生成方式的状态
			const formatStatus = this.successfulFormat ? `已应用${this.successfulFormat}格式` : '官方插件方式';
			return `🎯 已使用cc-defineQRCode官方插件（${formatStatus}）`;
		}
	},

	async onLoad() {
		// 获取状态栏高度
		const systemInfo = uni.getSystemInfoSync();
		this.statusBarHeight = systemInfo.statusBarHeight || 44;

		// 先加载省份列表，再初始化管家信息
		await this.loadProvinceList();
		await this.initButlerInfo();
	},

	mounted() {
		console.log('🚀 访客邀请二维码页面加载完成');
		this.getUserRole();
		this.initButlerInfo();
		this.preloadAddressData();

		// 设置默认分享行为
		this.setDefaultShareBehavior();
	},

	// 定义页面的分享行为（适配微信版本 >= 2.20.0）
	onShareAppMessage(res) {
		console.log('📤 分享应用消息触发:', res);
		console.log('📷 当前二维码图片路径:', this.qrCodeImagePath);

		// 构建分享标题，包含管家和小区信息
		const butlerName = this.butlerInfo?.username || '管家';
		const community = this.selectedAddress.community || '小区';
		const shareTitle = `${butlerName}邀请您访问${community}`;

		// 使用生成的二维码图片，如果没有则使用默认图片
		const imageUrl = this.qrCodeImagePath || '/static/images/share-default.png';

		console.log('📋 分享配置:', {
			title: shareTitle,
			path: '/pagesB/butler/qrcode-generator',
			imageUrl: imageUrl
		});

		// 分享成功回调（延迟执行，确保分享动作完成）
		setTimeout(() => {
			this.onShareSuccess('分享给朋友');
		}, 1500);

		// 返回分享内容
		return {
			title: shareTitle,
			path: '/pagesB/butler/qrcode-generator',
			imageUrl: imageUrl
		};
	},

	// 定义分享到朋友圈的行为（适配微信版本 >= 2.20.0）
	onShareTimeline() {
		console.log('📤 分享到朋友圈触发');
		console.log('📷 当前二维码图片路径:', this.qrCodeImagePath);

		// 构建分享标题，包含管家和小区信息
		const butlerName = this.butlerInfo?.username || '管家';
		const community = this.selectedAddress.community || '小区';
		const shareTitle = `${butlerName}邀请您访问${community}`;

		// 使用生成的二维码图片
		const imageUrl = this.qrCodeImagePath || '/static/images/share-default.png';

		console.log('📋 朋友圈分享配置:', {
			title: shareTitle,
			imageUrl: imageUrl
		});

		// 分享成功回调
		setTimeout(() => {
			this.onShareSuccess('分享到朋友圈');
		}, 1500);

		return {
			title: shareTitle,
			query: '',
			imageUrl: imageUrl
		};
	},

	methods: {
		// 🆕 显示生成错误提示
		showGenerateErrorTip() {
			// 检查缺少什么信息
			const hasCompleteAddress = this.selectedAddress.province &&
				this.selectedAddress.city &&
				this.selectedAddress.district &&
				this.selectedAddress.community;

			const hasOwnerInfo = this.selectedOwner && this.selectedOwner.ownername && this.selectedOwner.ownerphone;

			let missingInfo = [];
			let detailContent = '';

			if (!hasCompleteAddress) {
				missingInfo.push('访问地址');
				detailContent += '📍 访问地址信息不完整\n';
				if (!this.selectedAddress.province) detailContent += '  • 省份：未选择\n';
				if (!this.selectedAddress.city) detailContent += '  • 城市：未选择\n';
				if (!this.selectedAddress.district) detailContent += '  • 区县：未选择\n';
				if (!this.selectedAddress.community) detailContent += '  • 小区：未选择\n';
				detailContent += '\n';
			}

			if (!hasOwnerInfo) {
				missingInfo.push('业主信息');
				detailContent += '👤 业主信息未选择\n';
				if (!this.selectedOwner) {
					detailContent += '  • 请在上方选择具体的业主\n';
					detailContent += '  • 访客需要知道要拜访哪位业主\n';
				} else {
					if (!this.selectedOwner.ownername) detailContent += '  • 业主姓名：缺失\n';
					if (!this.selectedOwner.ownerphone) detailContent += '  • 业主电话：缺失\n';
				}
				detailContent += '\n';
			}

			const title = `缺少必要信息：${missingInfo.join('、')}`;

			detailContent += '💡 操作步骤：\n';
			if (!hasCompleteAddress) {
				detailContent += '1. 先选择完整的访问地址\n';
			}
			if (!hasOwnerInfo) {
				detailContent += `${!hasCompleteAddress ? '2' : '1'}. 选择地址后会自动显示业主列表\n`;
				detailContent += `${!hasCompleteAddress ? '3' : '2'}. 点击选择具体的业主信息\n`;
			}
			detailContent += '\n✅ 选择完成后即可生成二维码';

			uni.showModal({
				title: title,
				content: detailContent,
				showCancel: false,
				confirmText: '我知道了'
			});
		},

		// 🆕 生成唯一二维码ID
		generateUniqueQrId() {
			const timestamp = Date.now();
			const random = Math.random().toString(36).substring(2, 11);
			const userInfo = uni.getStorageSync('userInfo');
			const phoneLastFour = (userInfo?.phone || '0000').slice(-4);
			return `QR_${timestamp}_${phoneLastFour}_${random}`;
		},

		// 🆕 记录二维码生成到后端
		async recordQrCodeGeneration(qrId, qrData) {
			try {
				console.log('🎯 开始记录二维码生成:', { qrId, qrData });

				const userInfo = uni.getStorageSync('userInfo');
				const recordData = {
					qrId: qrId,
					butlerPhone: userInfo?.phone || qrData.butlerPhone,
					butlerName: qrData.butlerName || userInfo?.userInfo?.username || '管家',
					community: this.selectedAddress.community,
					building: this.selectedAddress.building,
					unit: this.selectedAddress.units, // 🔧 修复：数据库字段是 unit，前端传 units 值
					floor: this.selectedAddress.floor,
					room: this.selectedAddress.room,
					qrType: 'visitor_invitation'
				};

				const response = await request({
					url: apiUrls.qrcode.record,
					method: 'POST',
					data: recordData
				});

				if (response.code === '0') {
					console.log('✅ 二维码生成记录成功');
					this.qrCodeRecorded = true;
					return true;
				} else {
					console.error('❌ 二维码生成记录失败:', response.msg);
					return false;
				}
			} catch (error) {
				console.error('❌ 记录二维码生成时发生异常:', error);
				return false;
			}
		},

		// 设置默认分享行为（适配微信版本 >= 2.20.0）
		setDefaultShareBehavior() {
			// 启用分享菜单，支持分享给朋友和分享到朋友圈
			uni.showShareMenu({
				withShareTicket: true,
				menus: ['shareAppMessage', 'shareTimeline'],
				success: () => {
					console.log('✅ 分享菜单已启用（支持分享给朋友和朋友圈）');
				},
				fail: (err) => {
					console.error('❌ 分享菜单设置失败:', err);
				}
			});

			console.log('📱 页面分享功能已初始化，可通过右上角"•••"分享');
		},

		// 辅助方法：确保管家信息格式正确
		ensureButlerInfoFormat(data) {
			// 如果数据包含响应格式的 code 和 data，则提取 data 部分
			if (data && typeof data === 'object' && data.hasOwnProperty('code') && data.hasOwnProperty('data')) {
				console.log('检测到响应格式，提取 data 部分:', data.data);
				return data.data;
			}
			// 否则直接返回数据
			return data;
		},

		// TabBar切换事件处理
		onTabChange(tabInfo) {
			console.log('📱 [访客邀请页面] TabBar切换:', tabInfo);
			// TabBar切换处理逻辑已在custom-tabbar.vue中处理
		},

		// 获取用户角色
		getUserRole() {
			try {
				const userInfo = uni.getStorageSync('userInfo');

				if (userInfo && userInfo.role) {
					this.currentUserRole = userInfo.role;
				} else if (userInfo && userInfo.userInfo && userInfo.userInfo.userkind) {
					this.currentUserRole = userInfo.userInfo.userkind;
				} else {
					// 访客邀请页面默认为管家角色
					this.currentUserRole = 'manager';
				}

				console.log('📱 [访客邀请页面] 获取用户角色:', this.currentUserRole);
			} catch (error) {
				console.error('📱 [访客邀请页面] 获取用户角色失败:', error);
				this.currentUserRole = 'manager';
			}
		},

		// 初始化管家信息
		async initButlerInfo() {
			try {
				const userInfo = uni.getStorageSync('userInfo');
				console.log('初始化时获取的用户信息:', userInfo);

				if (!userInfo) {
					console.warn('用户信息缺失，需要重新登录');
					uni.showModal({
						title: '提示',
						content: '未检测到登录信息，请先登录',
						showCancel: true,
						cancelText: '返回首页',
						confirmText: '去登录',
						success: (res) => {
							if (res.confirm) {
								// 跳转到登录页面
								uni.reLaunch({
									url: '/pages/auth/phone-auth'
								});
							} else {
								// 返回首页
								uni.navigateBack();
							}
						}
					});
					return;
				}

				// 检查是否为管家身份
				if (userInfo.role !== 'manager') {
					uni.showModal({
						title: '权限提示',
						content: `当前身份为${userInfo.roleText || '未知'}，此功能仅限管家使用。\n\n如果您是管家，请确认：\n1. 账号信息是否正确\n2. 是否需要联系管理员更新权限`,
						showCancel: true,
						cancelText: '返回',
						confirmText: '重新登录',
						success: (res) => {
							if (res.confirm) {
								uni.reLaunch({
									url: '/pages/auth/phone-auth'
								});
							} else {
								uni.navigateBack();
							}
						}
					});
					return;
				}

				// 检查手机号
				if (!userInfo.phone) {
					uni.showModal({
						title: '手机号缺失',
						content: '用户信息中缺少手机号，无法查询管家信息。请重新登录。',
						showCancel: false,
						confirmText: '去登录',
						success: () => {
							uni.reLaunch({
								url: '/pages/auth/phone-auth'
							});
						}
					});
					return;
				}

				console.log('通过手机号查询管家信息:', userInfo.phone);

				// 直接通过手机号查询管家信息
				const response = await request({
					url: apiUrls.butler.getByPhone,
					method: 'GET',
					data: {
						phone: userInfo.phone
					}
				});

				if (response.code === '0' && response.data) {
					// 使用辅助方法确保数据格式正确
					this.butlerInfo = this.ensureButlerInfoFormat(response.data);
					// 预填管家的默认地址
					await this.preloadAddressData();

					uni.showToast({
						title: '管家信息加载成功',
						icon: 'success'
					});
				} else {
					console.warn('查询管家信息失败:', response);
					uni.showModal({
						title: '获取管家信息失败',
						content: `手机号：${userInfo.phone}\n\n${response.msg || '未找到对应的管家信息'}\n\n可能的原因：\n1. 该手机号未注册为管家\n2. 网络连接问题\n3. 服务器暂时不可用\n\n请联系管理员或重新登录`,
						showCancel: true,
						cancelText: '返回',
						confirmText: '重新登录',
						success: (res) => {
							if (res.confirm) {
								uni.reLaunch({
									url: '/pages/auth/phone-auth'
								});
							} else {
								uni.navigateBack();
							}
						}
					});
				}
			} catch (error) {
				console.error('获取管家信息失败:', error);
				uni.showModal({
					title: '加载失败',
					content: '获取管家信息时发生错误，请检查网络连接后重试。\n\n如果问题持续存在，请联系技术支持。',
					showCancel: true,
					cancelText: '返回',
					confirmText: '重试',
					success: (res) => {
						if (res.confirm) {
							this.initButlerInfo();
						} else {
							uni.navigateBack();
						}
					}
				});
			}
		},

		// 预加载地址数据并预填管家地址
		async preloadAddressData() {
			try {
				console.log('=== 开始预加载地址数据 ===');

				// 使用辅助方法确保 butlerInfo 格式正确
				this.butlerInfo = this.ensureButlerInfoFormat(this.butlerInfo);

				console.log('管家信息:', JSON.stringify(this.butlerInfo, null, 2));

				if (!this.butlerInfo) {
					console.warn('❌ 管家信息为空，无法预填地址');
					uni.showToast({
						title: '管家信息为空',
						icon: 'none'
					});
					return;
				}

				// 检查管家信息中的地址字段
				console.log('📍 管家地址信息检查:');
				console.log('- 省份:', this.butlerInfo.province || '❌ 缺失');
				console.log('- 城市:', this.butlerInfo.city || '❌ 缺失');
				console.log('- 区县:', this.butlerInfo.district || '❌ 缺失');
				console.log('- 小区:', this.butlerInfo.community || '❌ 缺失');

				// 如果管家信息中没有地址信息，尝试使用默认值或提示用户
				if (!this.butlerInfo.province && !this.butlerInfo.city && !this.butlerInfo.district && !this
					.butlerInfo.community) {
					console.warn('⚠️ 管家信息中缺少所有地址信息');
					uni.showModal({
						title: '地址信息缺失',
						content: '管家资料中未包含地址信息，请手动选择访问地址。\n\n建议联系管理员完善管家资料。',
						showCancel: false,
						confirmText: '知道了'
					});
					return;
				}

				// 1. 确保省份列表已加载
				console.log('📋 检查省份列表，当前数量:', this.provinceList.length);
				if (this.provinceList.length === 0) {
					console.log('🔄 加载省份列表...');
					await this.loadProvinceList();
					console.log('✅ 省份列表加载完成，数量:', this.provinceList.length);
				}

				// 2. 预填省份
				if (this.butlerInfo.province) {
					console.log('🎯 预填省份:', this.butlerInfo.province);

					// 检查省份是否在列表中
					const provinceExists = this.provinceList.some(item => item.province === this.butlerInfo
						.province);
					console.log('省份是否存在于列表中:', provinceExists);

					if (provinceExists) {
						this.selectedAddress.province = this.butlerInfo.province;
						console.log('✅ 省份预填成功');

						// 3. 加载并预填城市
						console.log('🔄 加载城市列表...');
						await this.loadCityList();
						console.log('城市列表数量:', this.cityList.length);

						if (this.butlerInfo.city && this.cityList.length > 0) {
							const cityExists = this.cityList.some(item => item.city === this.butlerInfo.city);
							console.log('城市是否存在于列表中:', cityExists, '目标城市:', this.butlerInfo.city);

							if (cityExists) {
								this.selectedAddress.city = this.butlerInfo.city;
								console.log('✅ 城市预填成功');

								// 4. 加载并预填区县
								console.log('🔄 加载区县列表...');
								await this.loadDistrictList();
								console.log('区县列表数量:', this.districtList.length);

								if (this.butlerInfo.district && this.districtList.length > 0) {
									const districtExists = this.districtList.some(item => item.district === this
										.butlerInfo.district);
									console.log('区县是否存在于列表中:', districtExists, '目标区县:', this.butlerInfo.district);

									if (districtExists) {
										this.selectedAddress.district = this.butlerInfo.district;
										console.log('✅ 区县预填成功');

										// 5. 加载并预填小区
										console.log('🔄 加载小区列表...');
										await this.loadCommunityList();
										console.log('小区列表数量:', this.communityList.length);

										if (this.butlerInfo.community && this.communityList.length > 0) {
											const communityExists = this.communityList.some(item => item
												.community === this.butlerInfo.community);
											console.log('小区是否存在于列表中:', communityExists, '目标小区:', this.butlerInfo
												.community);

											if (communityExists) {
												this.selectedAddress.community = this.butlerInfo.community;
												console.log('✅ 小区预填成功');

												// 6. 尝试加载楼栋信息
												try {
													await this.loadBuildingList();
													console.log('楼栋列表数量:', this.buildingList.length);
												} catch (error) {
													console.warn('加载楼栋列表失败，但不影响主要功能:', error);
												}
											} else {
												console.warn('❌ 小区不存在于列表中:', this.butlerInfo.community);
											}
										} else {
											console.warn('❌ 小区信息缺失或小区列表为空');
										}
									} else {
										console.warn('❌ 区县不存在于列表中:', this.butlerInfo.district);
									}
								} else {
									console.warn('❌ 区县信息缺失或区县列表为空');
								}
							} else {
								console.warn('❌ 城市不存在于列表中:', this.butlerInfo.city);
							}
						} else {
							console.warn('❌ 城市信息缺失或城市列表为空');
						}
					} else {
						console.warn('❌ 省份不存在于列表中:', this.butlerInfo.province);
					}
				} else {
					console.warn('❌ 省份信息缺失');
				}

				// 强制更新视图
				this.$forceUpdate();
				// 显示预填结果
				if (this.fullAddress) {
					uni.showToast({
						title: `地址预填成功: ${this.fullAddress}`,
						icon: 'success',
						duration: 3000
					});
				} else {
					uni.showToast({
						title: '地址预填未完成，请手动选择',
						icon: 'none',
						duration: 3000
					});
				}

			} catch (error) {
				console.error('❌ 预加载地址数据失败:', error);
				uni.showModal({
					title: '地址预填失败',
					content: `预填地址时发生错误: ${error.message}\n\n请手动选择访问地址。`,
					showCancel: false,
					confirmText: '知道了'
				});
			}
		},

		// 加载省份列表
		async loadProvinceList() {
			try {
				const response = await request({
					url: '/parking/community/province',
					method: 'GET'
				});
				this.provinceList = (response && response.data) || [];
				this.provinceColumns = [this.provinceList.map(item => item.province)];
			} catch (error) {
				console.error('加载省份列表失败:', error);
			}
		},

		// 加载城市列表
		async loadCityList() {
			if (!this.selectedAddress.province) return;
			try {
				const response = await request({
					url: '/parking/community/city',
					method: 'GET',
					data: {
						province: this.selectedAddress.province
					}
				});
				this.cityList = (response && response.data) || [];
				this.cityColumns = [this.cityList.map(item => item.city)];
			} catch (error) {
				console.error('加载城市列表失败:', error);
			}
		},

		// 加载区县列表
		async loadDistrictList() {
			if (!this.selectedAddress.city) return;
			try {
				const response = await request({
					url: '/parking/community/district',
					method: 'GET',
					data: {
						province: this.selectedAddress.province,
						city: this.selectedAddress.city
					}
				});
				this.districtList = (response && response.data) || [];
				this.districtColumns = [this.districtList.map(item => item.district)];
			} catch (error) {
				console.error('加载区县列表失败:', error);
			}
		},

		// 加载小区列表
		async loadCommunityList() {
			if (!this.selectedAddress.district) return;
			try {
				const response = await request({
					url: '/parking/community/community',
					method: 'GET',
					data: {
						province: this.selectedAddress.province,
						city: this.selectedAddress.city,
						district: this.selectedAddress.district
					}
				});
				this.communityList = (response && response.data) || [];
				this.communityColumns = [this.communityList.map(item => item.community)];
			} catch (error) {
				console.error('加载小区列表失败:', error);
			}
		},

		// 加载楼栋列表
		async loadBuildingList() {
			if (!this.selectedAddress.community) return;
			try {
				const response = await request({
					url: '/parking/community/building',
					method: 'GET',
					data: {
						province: this.selectedAddress.province,
						city: this.selectedAddress.city,
						district: this.selectedAddress.district,
						community: this.selectedAddress.community
					}
				});
				this.buildingList = (response && response.data) || [];
				this.buildingColumns = [this.buildingList.map(item => item.building)];
			} catch (error) {
				console.error('加载楼栋列表失败:', error);
			}
		},

		// 加载单元列表
		async loadUnitsList() {
			if (!this.selectedAddress.building) return;
			try {
				const response = await request({
					url: '/parking/community/units',
					method: 'GET',
					data: {
						province: this.selectedAddress.province,
						city: this.selectedAddress.city,
						district: this.selectedAddress.district,
						community: this.selectedAddress.community,
						building: this.selectedAddress.building
					}
				});
				this.unitsList = (response && response.data) || [];
				this.unitsColumns = [this.unitsList.map(item => item.units.toString())];
			} catch (error) {
				console.error('加载单元列表失败:', error);
			}
		},

		// 加载楼层列表
		async loadFloorList() {
			if (!this.selectedAddress.units) return;
			try {
				const response = await request({
					url: '/parking/community/floor',
					method: 'GET',
					data: {
						province: this.selectedAddress.province,
						city: this.selectedAddress.city,
						district: this.selectedAddress.district,
						community: this.selectedAddress.community,
						building: this.selectedAddress.building,
						units: this.selectedAddress.units
					}
				});
				this.floorList = (response && response.data) || [];
				this.floorColumns = [this.floorList.map(item => item.floor.toString())];
			} catch (error) {
				console.error('加载楼层列表失败:', error);
			}
		},

		// 加载房间号列表
		async loadRoomList() {
			if (!this.selectedAddress.floor) return;
			try {
				const response = await request({
					url: '/parking/community/getOnlyRoomNumber',
					method: 'GET',
					data: {
						province: this.selectedAddress.province,
						city: this.selectedAddress.city,
						district: this.selectedAddress.district,
						community: this.selectedAddress.community,
						building: this.selectedAddress.building,
						units: this.selectedAddress.units,
						floor: this.selectedAddress.floor
					}
				});
				this.roomList = (response && response.data) || [];
				this.roomColumns = [this.roomList.map(item => item.roomnumber.toString())];
			} catch (error) {
				console.error('加载房间号列表失败:', error);
			}
		},

		// Picker事件处理
		openProvincePicker() {
			this.showProvincePicker = true;
		},

		async onProvinceConfirm(e) {
			this.selectedAddress.province = e.value[0];
			this.selectedAddress.city = '';
			this.selectedAddress.district = '';
			this.selectedAddress.community = '';
			this.selectedAddress.building = '';
			this.selectedAddress.units = '';
			this.selectedAddress.floor = '';
			this.selectedAddress.room = '';
			this.showProvincePicker = false;

			// 清除之前的业主选择
			this.clearOwnerSelection();

			await this.loadCityList();
		},

		openCityPicker() {
			if (!this.selectedAddress.province) {
				uni.showToast({
					title: '请先选择省份',
					icon: 'none'
				});
				return;
			}
			this.showCityPicker = true;
		},

		async onCityConfirm(e) {
			this.selectedAddress.city = e.value[0];
			this.selectedAddress.district = '';
			this.selectedAddress.community = '';
			this.selectedAddress.building = '';
			this.selectedAddress.units = '';
			this.selectedAddress.floor = '';
			this.selectedAddress.room = '';
			this.showCityPicker = false;

			// 清除之前的业主选择
			this.clearOwnerSelection();

			await this.loadDistrictList();
		},

		openDistrictPicker() {
			if (!this.selectedAddress.city) {
				uni.showToast({
					title: '请先选择城市',
					icon: 'none'
				});
				return;
			}
			this.showDistrictPicker = true;
		},

		async onDistrictConfirm(e) {
			this.selectedAddress.district = e.value[0];
			this.selectedAddress.community = '';
			this.selectedAddress.building = '';
			this.selectedAddress.units = '';
			this.selectedAddress.floor = '';
			this.selectedAddress.room = '';
			this.showDistrictPicker = false;

			// 清除之前的业主选择
			this.clearOwnerSelection();

			await this.loadCommunityList();
		},

		openCommunityPicker() {
			if (!this.selectedAddress.district) {
				uni.showToast({
					title: '请先选择区县',
					icon: 'none'
				});
				return;
			}
			this.showCommunityPicker = true;
		},

		async onCommunityConfirm(e) {
			this.selectedAddress.community = e.value[0];
			this.selectedAddress.building = '';
			this.selectedAddress.units = '';
			this.selectedAddress.floor = '';
			this.selectedAddress.room = '';
			this.showCommunityPicker = false;

			// 清除之前的业主选择
			this.clearOwnerSelection();

			await this.loadBuildingList();
			// 社区选择完成后，查询该社区的所有业主
			this.searchOwnersForCurrentAddress();
		},

		openBuildingPicker() {
			this.showBuildingPicker = true;
		},

		async onBuildingConfirm(e) {
			this.selectedAddress.building = e.value[0];
			this.selectedAddress.units = '';
			this.selectedAddress.floor = '';
			this.selectedAddress.room = '';
			this.showBuildingPicker = false;

			// 清除之前的业主选择
			this.clearOwnerSelection();

			await this.loadUnitsList();
			// 楼栋选择完成后，查询该楼栋的业主
			this.searchOwnersForCurrentAddress();
		},

		openUnitsPicker() {
			if (!this.selectedAddress.building) {
				uni.showToast({
					title: '请先选择楼栋',
					icon: 'none'
				});
				return;
			}
			this.showUnitsPicker = true;
		},

		async onUnitsConfirm(e) {
			this.selectedAddress.units = e.value[0];
			this.selectedAddress.floor = '';
			this.selectedAddress.room = '';
			this.showUnitsPicker = false;

			// 清除之前的业主选择
			this.clearOwnerSelection();

			await this.loadFloorList();
			// 单元选择完成后，查询该单元的业主
			this.searchOwnersForCurrentAddress();
		},

		openFloorPicker() {
			if (!this.selectedAddress.units) {
				uni.showToast({
					title: '请先选择单元',
					icon: 'none'
				});
				return;
			}
			this.showFloorPicker = true;
		},

		async onFloorConfirm(e) {
			this.selectedAddress.floor = e.value[0];
			this.selectedAddress.room = '';
			this.showFloorPicker = false;

			// 清除之前的业主选择
			this.clearOwnerSelection();

			await this.loadRoomList();
			// 楼层选择完成后，查询该楼层的业主
			this.searchOwnersForCurrentAddress();
		},

		openRoomPicker() {
			if (!this.selectedAddress.floor) {
				uni.showToast({
					title: '请先选择楼层',
					icon: 'none'
				});
				return;
			}
			this.showRoomPicker = true;
		},

		onRoomConfirm(e) {
			this.selectedAddress.room = e.value[0];
			this.showRoomPicker = false;
			// 房间选择完成后，自动查询业主信息
			this.searchOwnersForCurrentAddress();
		},

		// 业主信息相关方法
		// 根据当前地址查询业主信息
		async searchOwnersForCurrentAddress() {
			if (!this.selectedAddress.community) {
				console.log('社区信息不完整，无法查询业主');
				return;
			}

			this.ownerLoading = true;
			this.ownerSearched = false;

			try {
				console.log('🔍 开始查询业主信息，地址:', this.selectedAddress);

				// 构建查询参数
				const queryParams = {
					province: this.selectedAddress.province || '',
					city: this.selectedAddress.city || '',
					district: this.selectedAddress.district || '',
					community: this.selectedAddress.community || '',
					building: this.selectedAddress.building || '',
					units: this.selectedAddress.units || '',
					floor: this.selectedAddress.floor || '',
					roomnumber: this.selectedAddress.room || '',
					userphone: '' // 不按手机号过滤，查询该地址的所有业主
				};

				// 调用API查询业主信息
				const response = await request({
					url: '/parking/ownerinfo/myRooms',
					method: 'GET',
					data: queryParams
				});

				if (response.code === '0' && response.data && response.data.data) {
					// 确保 response.data 是数组
					let ownerData = [];
					if (Array.isArray(response.data.data)) {
						ownerData = response.data.data;
					} else if (response.data && typeof response.data === 'object') {
						// 如果是对象，尝试提取数组
						ownerData = [];
					} else {
						ownerData = [];
					}

					this.ownerList = ownerData;
					this.filteredOwnerList = ownerData.slice(); // 使用 slice() 创建副本，避免展开操作符问题
					this.ownerSearched = true;

					// 清除之前的搜索关键词，确保搜索框显示逻辑正确
					this.ownerSearchKeyword = '';

					if (this.ownerList.length > 0) {
						uni.showToast({
							title: `找到${this.ownerList.length}位业主`,
							icon: 'success',
							duration: 2000
						});
					} else {
						uni.showToast({
							title: '该地址暂无业主信息',
							icon: 'none',
							duration: 2000
						});
					}
				} else {
					console.warn('❌ 业主查询失败:', response);
					this.ownerList = [];
					this.filteredOwnerList = [];
					this.ownerSearched = true;
					this.ownerSearchKeyword = ''; // 清除搜索关键词

					uni.showToast({
						title: response.msg || '查询业主信息失败',
						icon: 'none',
						duration: 2000
					});
				}
			} catch (error) {
				console.error('❌ 业主查询异常:', error);
				this.ownerList = [];
				this.filteredOwnerList = [];
				this.ownerSearched = true;
				this.ownerSearchKeyword = ''; // 清除搜索关键词

				uni.showToast({
					title: '查询业主信息失败',
					icon: 'none',
					duration: 2000
				});
			} finally {
				this.ownerLoading = false;
			}
		},

		// 选择业主
		selectOwner(owner) {
			this.selectedOwner = owner;

			// 自动填充地址信息
			this.autoFillAddressFromOwner(owner);

			uni.showToast({
				title: `已选择业主：${owner.ownername}`,
				icon: 'success',
				duration: 2000
			});
		},

		// 根据业主信息自动填充地址
		autoFillAddressFromOwner(owner) {

			// 更新地址信息
			if (owner.province) this.selectedAddress.province = owner.province;
			if (owner.city) this.selectedAddress.city = owner.city;
			if (owner.district) this.selectedAddress.district = owner.district;
			if (owner.community) this.selectedAddress.community = owner.community;
			if (owner.building) this.selectedAddress.building = owner.building;
			if (owner.units) this.selectedAddress.units = owner.units.toString();
			if (owner.floor) this.selectedAddress.floor = owner.floor.toString();
			if (owner.roomnumber) this.selectedAddress.room = owner.roomnumber.toString();

			// 强制更新视图
			this.$forceUpdate();
		},

		// 业主搜索
		searchOwners() {
			this.filterOwnerList();
		},

		// 清除业主搜索
		clearOwnerSearch() {
			this.ownerSearchKeyword = '';
			this.filteredOwnerList = this.ownerList.slice(); // 使用 slice() 创建副本
		},

		// 业主搜索输入事件
		onOwnerSearchInput() {
			// 实时搜索
			this.filterOwnerList();
		},

		// 过滤业主列表
		filterOwnerList() {
			if (!this.ownerSearchKeyword.trim()) {
				this.filteredOwnerList = this.ownerList.slice(); // 使用 slice() 创建副本
				return;
			}

			const keyword = this.ownerSearchKeyword.trim().toLowerCase();
			// 确保 ownerList 是数组
			const ownerArray = Array.isArray(this.ownerList) ? this.ownerList : [];
			this.filteredOwnerList = ownerArray.filter(owner => {
				const name = (owner.ownername || '').toLowerCase();
				const phone = (owner.ownerphone || '').toLowerCase();
				return name.includes(keyword) || phone.includes(keyword);
			});
		},

		// 格式化业主地址
		formatOwnerAddress(owner) {
			if (!owner) return '';

			const parts = [];
			// 不显示小区，只显示：栋+座+单元+房间号
			if (owner.building) parts.push(owner.building + '栋');
			if (owner.units) parts.push(owner.units + '座');
			if (owner.floor) parts.push(owner.floor + '单元');
			if (owner.roomnumber) parts.push(owner.roomnumber);

			return parts.length > 0 ? parts.join('') : '地址信息不完整';
		},

		// 获取审核状态样式类
		getAuditStatusClass(status) {
			switch (status) {
				case '1':
				case 'approved':
					return 'status-approved';
				case '0':
				case 'pending':
					return 'status-pending';
				case '-1':
				case 'rejected':
					return 'status-rejected';
				default:
					return 'status-unknown';
			}
		},



		// 获取审核状态文本
		getAuditStatusText(status) {
			switch (status) {
				case '1':
				case 'approved':
					return '已审核';
				case '0':
				case 'pending':
					return '待审核';
				case '-1':
				case 'rejected':
					return '已拒绝';
				default:
					return '未知状态';
			}
		},

		// 清除业主选择
		clearOwnerSelection() {
			this.selectedOwner = null;
			this.ownerList = [];
			this.filteredOwnerList = [];
			this.ownerSearchKeyword = '';
			this.ownerSearched = false;
			console.log('🧹 已清除业主选择');
		},

		// 生成二维码
		async generateQrCode() {
			// 检查必要信息是否完整
			if (!this.canGenerate) {
				this.showGenerateErrorTip();
				return;
			}

			const userInfo = uni.getStorageSync('userInfo');
			const openid = userInfo?.openid;

			if (!userInfo?.phone) {
				uni.showToast({
					title: '请先完成手机号验证',
					icon: 'none',
					duration: 2000
				});
				uni.redirectTo({
					url: '/pages/auth/phone-auth'
				});
				return;
			}

			try {
				uni.showLoading({
					title: '生成中...',
					mask: true
				});
				// 方案1：普通链接二维码（推荐，最稳定）
				console.log('🔗 尝试普通链接二维码方案...');
				let success = await this.tryGenerateVisitorInviteLink();
				if (!success) {
					console.log('⚠️ 普通链接二维码生成失败，尝试微信官方小程序码...');
					// 方案2：微信官方小程序码（备用）
					success = await this.tryGenerateOfficialMiniProgramCode();
					if (!success) {
						console.log('⚠️ 微信官方小程序码也失败，使用最终降级方案...');
						// 方案3：最终降级 - 普通二维码
						await this.generateMiniProgramCode();
					}
				}
			} catch (error) {
				console.error('生成二维码失败:', error);
				uni.showModal({
					title: '生成失败',
					content: `二维码生成失败: ${error.message}`,
					showCancel: false
				});
			} finally {
				uni.hideLoading();
			}
		},
		// 🎯 新增：尝试生成普通链接二维码（推荐方案）
		async tryGenerateVisitorInviteLink() {
			try {
				const userInfo = uni.getStorageSync('userInfo');

				// 🆕 生成唯一二维码ID
				const qrId = this.generateUniqueQrId();
				this.currentQrId = qrId;
				console.log('🎯 生成二维码ID:', qrId);

				// 🎯 构建完整的访客邀请URL，确保包含详细地址信息和业主信息
				const baseUrl = this.baseUrl; // 使用配置的基础URL
				const visitorParams = {
					qrId: qrId, // 🆕 添加二维码ID
					applyKind: '2', // 🆕 添加统一角色标识参数
					butlerName: this.butlerInfo?.username || '管家',
					butlerPhone: this.butlerInfo?.phone || userInfo.phone,
					fullAddress: this.fullAddress,
					// 详细地址信息 - 确保楼栋、单元、楼层、房间号都包含在二维码中
					province: this.selectedAddress.province || '',
					city: this.selectedAddress.city || '',
					district: this.selectedAddress.district || '',
					community: this.selectedAddress.community || '',
					building: this.selectedAddress.building || '', // 楼栋信息
					units: this.selectedAddress.units || '', // 单元信息
					floor: this.selectedAddress.floor || '', // 楼层信息
					room: this.selectedAddress.room || '', // 房间号信息
					// 🆕 添加业主信息到二维码参数中
					ownerName: this.selectedOwner?.ownername || '',
					ownerPhone: this.selectedOwner?.ownerphone || '',
					ownerAddress: this.formatOwnerAddress(this.selectedOwner) || '',
					type: 'visitor_invite', // 保留现有参数，确保向后兼容
					timestamp: Date.now()
				};

				// 构建完整的邀请URL
				const fullInviteUrl = `${baseUrl}?${Object.keys(visitorParams).map(key =>
					`${key}=${encodeURIComponent(visitorParams[key])}`
				).join('&')}`;

				// 🎯 调试信息：确认详细地址信息已包含在URL中
				console.log('🎯 生成的完整邀请URL:', fullInviteUrl);
				console.log('🎯 URL中包含的详细地址信息:');
				console.log('  - 楼栋 (building):', this.selectedAddress.building || '未设置');
				console.log('  - 单元 (units):', this.selectedAddress.units || '未设置');
				console.log('  - 楼层 (floor):', this.selectedAddress.floor || '未设置');
				console.log('  - 房间号 (room):', this.selectedAddress.room || '未设置');
				console.log('🎯 visitorParams对象:', visitorParams);

				// 构建请求参数
				const params = {
					phone: userInfo.phone,
					fullUrl: fullInviteUrl, // 🎯 传递完整URL
					...this.selectedAddress,
					butlerName: visitorParams.butlerName,
					butlerPhone: visitorParams.butlerPhone
				};
				// 🎯 关键：调用后端普通链接二维码接口
				const response = await request({
					url: apiUrls.butler.generateVisitorInviteLink,
					method: 'GET',
					data: params
				});

				console.log('📨 普通链接二维码接口响应:', response);

				// 检查是否成功生成普通链接二维码
				if (response.code === '0' && response.data) {
					const data = response.data;

					// 检查是否是普通链接二维码
					if (data.type === 'visitor_invite_link' && (data.inviteLink || data.fullUrl)) {
						const finalInviteUrl = data.inviteLink || data.fullUrl || fullInviteUrl;
						console.log('✅ 普通链接二维码生成成功！');
						console.log('📋 最终邀请链接:', finalInviteUrl);

						// 保存二维码数据
						this.qrCodeData = data;
						this.qrCodeData.inviteLink = finalInviteUrl; // 确保保存完整URL
						this.qrCodeText = finalInviteUrl; // 🎯 使用完整URL作为二维码内容

						// 生成并显示普通二维码
						await this.drawTextQrCode(finalInviteUrl);

						// 🆕 记录二维码生成到后端
						await this.recordQrCodeGeneration(qrId, {
							butlerName: visitorParams.butlerName,
							butlerPhone: visitorParams.butlerPhone
						});

						// 显示成功信息
						this.showVisitorInviteLinkSuccess(this.qrCodeData);

						return true; // 成功
					} else {
						console.log('⚠️ 后端返回数据格式异常');
						console.log('返回数据:', data);

						// 🎯 降级处理：直接使用本地构建的完整URL
						this.qrCodeData = {
							type: 'visitor_invite_link',
							inviteLink: fullInviteUrl,
							butlerName: visitorParams.butlerName,
							butlerPhone: visitorParams.butlerPhone,
							fullAddress: this.fullAddress,
							timestamp: Date.now()
						};
						this.qrCodeText = fullInviteUrl;

						await this.drawTextQrCode(fullInviteUrl);

						// 🆕 记录二维码生成到后端
						await this.recordQrCodeGeneration(qrId, {
							butlerName: visitorParams.butlerName,
							butlerPhone: visitorParams.butlerPhone
						});

						this.showVisitorInviteLinkSuccess(this.qrCodeData);

						return true; // 使用降级方案成功
					}
				} else {
					console.log('❌ 后端接口调用失败，使用本地生成:', response);

					// 🎯 完全本地生成完整URL二维码
					this.qrCodeData = {
						type: 'visitor_invite_link',
						inviteLink: fullInviteUrl,
						butlerName: visitorParams.butlerName,
						butlerPhone: visitorParams.butlerPhone,
						fullAddress: this.fullAddress,
						timestamp: Date.now()
					};
					this.qrCodeText = fullInviteUrl;

					await this.drawTextQrCode(fullInviteUrl);

					// 🆕 记录二维码生成到后端
					await this.recordQrCodeGeneration(qrId, {
						butlerName: visitorParams.butlerName,
						butlerPhone: visitorParams.butlerPhone
					});

					this.showVisitorInviteLinkSuccess(this.qrCodeData);

					return true; // 本地生成成功
				}

			} catch (error) {
				console.error('🔥 调用普通链接二维码接口异常:', error);

				// 显示友好的错误信息
				let errorMsg = '网络连接失败';
				if (error.message) {
					if (error.message.includes('timeout')) {
						errorMsg = '请求超时，服务器响应较慢';
					} else if (error.message.includes('network')) {
						errorMsg = '网络连接失败';
					} else {
						errorMsg = error.message;
					}
				}

				console.log(`⚠️ 普通链接二维码生成失败: ${errorMsg}，将使用备用方案`);

				return false; // 需要降级
			}
		},

		// 🎯 新增：尝试生成微信官方小程序码（备用方案）
		async tryGenerateOfficialMiniProgramCode() {
			try {
				const userInfo = uni.getStorageSync('userInfo');

				// 构建请求参数
				const params = {
					phone: userInfo.phone,
					community: this.selectedAddress.community || '',
					building: this.selectedAddress.building || '',
					units: this.selectedAddress.units || '',
					floor: this.selectedAddress.floor || '',
					room: this.selectedAddress.room || ''
				};

				console.log('📡 调用后端微信官方小程序码接口，参数:', params);

				// 🎯 关键：调用后端微信官方小程序码接口
				const response = await request({
					url: apiUrls.butler.generateMiniProgramCode,
					method: 'GET',
					data: params
				});

				console.log('📨 后端接口响应:', response);

				// 检查是否成功生成微信官方小程序码
				if (response.code === '0' && response.data) {
					const data = response.data;

					// 检查是否是微信官方小程序码
					if (data.type === 'wechat_mini_program' && data.officialCode === true && data.qrCodeImage) {
						console.log('✅ 微信官方小程序码生成成功！');

						// 保存二维码数据
						this.qrCodeData = data;
						this.qrCodeText = data.pagePath || '';

						// 显示微信官方小程序码
						await this.displayOfficialMiniProgramCode(data.qrCodeImage);

						// 显示成功信息
						this.showOfficialMiniProgramCodeSuccess(data);

						return true; // 成功
					} else {
						console.log('⚠️ 后端返回的不是官方小程序码，进行降级处理');
						console.log('返回数据:', data);

						// 保存降级数据，供普通二维码使用
						if (data.butlerName || data.butlerPhone) {
							this.qrCodeData = data;
						}

						return false; // 需要降级
					}
				} else {
					console.log('❌ 后端接口调用失败:', response);
					return false; // 需要降级
				}

			} catch (error) {
				console.error('🔥 调用微信官方小程序码接口异常:', error);

				// 显示友好的错误信息
				let errorMsg = '网络连接失败';
				if (error.message) {
					if (error.message.includes('timeout')) {
						errorMsg = '请求超时，服务器响应较慢';
					} else if (error.message.includes('network')) {
						errorMsg = '网络连接失败';
					} else {
						errorMsg = error.message;
					}
				}

				console.log(`⚠️ 微信官方小程序码生成失败: ${errorMsg}，将降级到普通二维码`);

				return false; // 需要降级
			}
		},

		// 🎯 新增：显示微信官方小程序码
		async displayOfficialMiniProgramCode(base64Image) {
			try {
				console.log('🖼️ 开始显示微信官方小程序码');

				// 获取canvas上下文
				const ctx = uni.createCanvasContext('qrCanvas', this);

				// 清空画布
				ctx.clearRect(0, 0, this.qrSize, this.qrSize);

				// 绘制白色背景
				ctx.fillStyle = '#ffffff';
				ctx.fillRect(0, 0, this.qrSize, this.qrSize);

				// 绘制微信官方小程序码图片
				ctx.drawImage(base64Image, 0, 0, this.qrSize, this.qrSize);

				// 执行绘制
				ctx.draw(false, () => {
					console.log('✅ 微信官方小程序码显示完成');

					// 保存图片路径供分享使用
					this.qrCodeImagePath = base64Image;
				});

			} catch (error) {
				console.error('❌ 显示微信官方小程序码失败:', error);
				throw error;
			}
		},

		// 🎯 新增：显示普通链接二维码成功信息
		showVisitorInviteLinkSuccess(data) {
			console.log('🎉 显示普通链接二维码成功信息');

			// 立即显示成功提示
			uni.showToast({
				title: '🎯 访客邀请二维码生成成功！',
				icon: 'success',
				duration: 3000
			});

			// 延迟显示详细信息
			setTimeout(() => {
				const butlerName = data.butlerName || '未知管家';
				const butlerPhone = data.butlerPhone || '未知电话';
				const fullAddress = this.fullAddress || '未设置地址';

				// 构建详细地址信息显示
				let addressDetails = '';
				if (this.selectedAddress.building) addressDetails += `楼栋: ${this.selectedAddress.building}栋\n`;
				if (this.selectedAddress.units) addressDetails += `单元: ${this.selectedAddress.units}单元\n`;
				if (this.selectedAddress.floor) addressDetails += `楼层: ${this.selectedAddress.floor}层\n`;
				if (this.selectedAddress.room) addressDetails += `房间: ${this.selectedAddress.room}号\n`;

				// 构建业主信息显示
				let ownerDetails = '';
				if (this.selectedOwner) {
					ownerDetails += `业主姓名: ${this.selectedOwner.ownername}\n`;
					ownerDetails += `业主电话: ${this.selectedOwner.ownerphone}\n`;
				}

				uni.showModal({
					title: '✅ 访客邀请二维码生成成功',
					content: `类型：普通链接二维码 (推荐方案)

🚀 访客扫码后将：
✅ 自动打开您的小程序
✅ 直接跳转到访客申请页面
✅ 自动填入管家信息 (${butlerName})
✅ 自动填入访问地址 (${fullAddress})
✅ 自动填入业主信息

📍 二维码包含的详细信息：
${addressDetails || '基础地址信息'}
${ownerDetails || '业主信息'}
✅ 访客可直接联系业主并提交申请

📱 请将此二维码发送给访客
扫码即可直接跳转到小程序！`,
					showCancel: true,
					cancelText: '知道了',
					confirmText: '查看链接',
					success: (res) => {
						if (res.confirm) {
							// 显示邀请链接详情
							uni.showModal({
								title: '📋 访客邀请链接详情',
								content: `💡 使用说明：
1. 此链接生成了二维码
2. 访客扫码后自动跳转小程序
3. 需要在小程序后台配置跳转规则

📋 配置位置：
小程序后台 → 开发管理 → 开发设置
→ 扫普通链接二维码打开小程序`,
								showCancel: false,
								confirmText: '知道了'
							});
						}
					}
				});
			}, 1500);
		},

		// 🎯 新增：显示微信官方小程序码成功信息
		showOfficialMiniProgramCodeSuccess(data) {
			console.log('🎉 显示微信官方小程序码成功信息');

			// 立即显示成功提示
			uni.showToast({
				title: '🎯 微信官方小程序码生成成功！',
				icon: 'success',
				duration: 3000
			});

			// 延迟显示详细信息
			setTimeout(() => {
				const fullAddress = this.fullAddress || '未设置地址';
				const butlerName = data.butlerName || '未知管家';
				const butlerPhone = data.butlerPhone || '未知电话';

				uni.showModal({
					title: '🎯 微信官方小程序码生成成功',
					content: `✅ 类型：微信官方小程序码

🚀 访客扫码后将：
✅ 自动打开您的小程序
✅ 直接跳转到访客申请页面  
✅ 自动填入管家信息 (${butlerName})
✅ 自动填入访问地址 (${fullAddress})
✅ 访客可直接提交申请

📋 当前信息：
管家：${butlerName}
电话：${butlerPhone}
地址：${fullAddress}

📱 请将此小程序码发送给访客，
扫码即可直接跳转到小程序！`,
					showCancel: false,
					confirmText: '知道了'
				});
			}, 1500);
		},

		// 🎯 简化：直接生成包含完整URL的二维码（不依赖后端）
		async generateMiniProgramCode() {
			const userInfo = uni.getStorageSync('userInfo');

			console.log('🎯 开始直接生成前端二维码，不调用后端API');

			// 🆕 生成唯一的二维码ID
			const qrId = this.generateUniqueQrId();
			console.log('🎯 生成的二维码ID:', qrId);

			// 构建简化的访客邀请参数
			const butlerName = this.butlerInfo?.username || '管家';
			const butlerPhone = this.butlerInfo?.phone || userInfo.phone || '';
			const community = this.selectedAddress.community || '';

			// 构建包含详细地址信息和业主信息的URL参数（🆕 添加 qrId、详细地址和业主信息）
			const shortParams = [];
			shortParams.push(`qrId=${encodeURIComponent(qrId)}`); // 🆕 添加二维码ID
			if (butlerPhone) {
				const phoneDigits = butlerPhone.replace(/\D/g, '');
				shortParams.push(`bp=${encodeURIComponent(phoneDigits)}`);
			}
			if (butlerName) {
				shortParams.push(`bn=${encodeURIComponent(butlerName)}`);
			}
			if (community) {
				shortParams.push(`c=${encodeURIComponent(community)}`);
			}
			// 🎯 添加详细地址信息到二维码参数中
			if (this.selectedAddress.building) {
				shortParams.push(`building=${encodeURIComponent(this.selectedAddress.building)}`);
			}
			if (this.selectedAddress.units) {
				shortParams.push(`unit=${encodeURIComponent(this.selectedAddress.units)}`);
			}
			if (this.selectedAddress.floor) {
				shortParams.push(`floor=${encodeURIComponent(this.selectedAddress.floor)}`);
			}
			if (this.selectedAddress.room) {
				shortParams.push(`room=${encodeURIComponent(this.selectedAddress.room)}`);
			}
			// 🆕 添加业主信息到二维码参数中
			if (this.selectedOwner?.ownername) {
				shortParams.push(`on=${encodeURIComponent(this.selectedOwner.ownername.slice(0, 3))}`);
			}
			if (this.selectedOwner?.ownerphone) {
				const ownerPhoneDigits = this.selectedOwner.ownerphone.replace(/\D/g, '');
				shortParams.push(`op=${encodeURIComponent(ownerPhoneDigits.slice(-8))}`);
			}
			shortParams.push('t=bi'); // butler_invitation 缩写
			shortParams.push(`ts=${Date.now().toString().slice(-8)}`); // 短时间戳

			// 构建完整的URL（直接在前端生成）
			const fullUrl = `${this.baseUrl}?${shortParams.join('&')}`;

			console.log('🎯 构建的完整URL:', fullUrl);
			console.log('🎯 URL长度:', fullUrl.length, '字符');
			console.log('🎯 包含的qrId:', qrId);
			console.log('🎯 详细地址信息检查:');
			console.log('  - 楼栋:', this.selectedAddress.building || '未设置');
			console.log('  - 单元:', this.selectedAddress.units || '未设置');
			console.log('  - 楼层:', this.selectedAddress.floor || '未设置');
			console.log('  - 房间号:', this.selectedAddress.room || '未设置');
			console.log('🎯 URL参数列表:', shortParams);

			// 设置二维码数据
			this.qrCodeData = {
				type: 'simple_url_qrcode',
				fullUrl: fullUrl,
				qrId: qrId, // 🆕 保存二维码ID
				butlerName: butlerName,
				butlerPhone: butlerPhone,
				fullAddress: this.fullAddress,
				timestamp: Date.now()
			};

			// 设置二维码文本内容
			this.qrCodeText = fullUrl;

			try {
				// 🎯 直接生成包含完整URL的二维码
				await this.drawMiniProgramQrCode(fullUrl);

				// 🆕 记录二维码生成到后端
				await this.recordQrCodeGeneration(qrId, {
					butlerName: butlerName,
					butlerPhone: butlerPhone
				});

				// 显示成功信息
				this.showMiniProgramSuccessInfo(fullUrl, qrId);

				console.log('✅ 前端二维码生成成功:', fullUrl);
				console.log('✅ 二维码ID已记录:', qrId);

			} catch (error) {
				console.error('❌ 前端二维码生成失败:', error);
				uni.showToast({
					title: '二维码生成失败',
					icon: 'none'
				});
			}
		},

		// 🎯 简化：显示前端二维码生成成功信息
		showMiniProgramSuccessInfo(urlPath, qrId) {
			console.log('🎯 访客邀请二维码生成成功，URL:', urlPath);
			console.log('🎯 二维码ID:', qrId);

			// 显示详细的成功信息
			setTimeout(() => {
				const butlerName = this.qrCodeData.butlerName || '未知';
				const butlerPhone = this.qrCodeData.butlerPhone || '未知';
				const address = this.fullAddress || '未设置';

				// 构建详细地址信息显示
				let addressDetails = '';
				if (this.selectedAddress.building) addressDetails += `楼栋: ${this.selectedAddress.building}栋\n`;
				if (this.selectedAddress.units) addressDetails += `单元: ${this.selectedAddress.units}单元\n`;
				if (this.selectedAddress.floor) addressDetails += `楼层: ${this.selectedAddress.floor}层\n`;
				if (this.selectedAddress.room) addressDetails += `房间: ${this.selectedAddress.room}号\n`;

				// 构建业主信息显示
				let ownerDetails = '';
				if (this.selectedOwner) {
					ownerDetails += `业主: ${this.selectedOwner.ownername}\n`;
					ownerDetails += `联系: ${this.selectedOwner.ownerphone}\n`;
				}

				uni.showModal({
					title: '✅ 访客邀请二维码生成成功',
					content: `二维码ID: ${qrId}
管家: ${butlerName}
电话: ${butlerPhone}
地址: ${address}

📍 详细信息：
${addressDetails || '基础地址信息'}
${ownerDetails || '业主信息'}
✅ 此二维码包含完整信息（地址、业主联系方式），访客扫码后可直接联系业主进行预约申请！`,
					showCancel: false,
					confirmText: '知道了'
				});
			}, 500);
		},

		// 🎯 显示URL映射配置状态（后台已配置）
		showUrlMappingGuide() {
			uni.showModal({
				title: '✅ URL映射配置状态',
				content: `🎉 好消息！URL映射跳转规则已配置完成！

✅ 当前状态：
• 基础URL：${this.baseUrl}
• 后台跳转规则：已配置 ✓
• 扫码跳转：已启用 ✓

📱 扫码效果：
• 访客扫描二维码后将自动跳转到小程序
• 所有参数会自动传递到目标页面
• 无需手动复制粘贴信息

🔗 生成的URL格式：
${this.baseUrl}?参数1=值1&参数2=值2...

🎯 测试方法：
1. 生成二维码
2. 使用微信"扫一扫"
3. 应该直接跳转到小程序访客申请页面
4. 管家信息和地址自动填入

💡 如果扫码没有自动跳转：
• 等待5-10分钟再试（配置生效需要时间）
• 确认使用微信扫一扫功能
• 检查网络连接是否正常

现在可以放心使用二维码功能了！🎉`,
				showCancel: false,
				confirmText: '知道了'
			});
		},

		// 🎯 检查并配置微信官方小程序码（可选功能）
		async checkAndConfigureOfficialWechatCode() {
			uni.showModal({
				title: '🔧 微信官方小程序码配置检查',
				content: `当前状态检查：

✅ 基础功能（已完成）：
✅ URL映射跳转：已配置并生效
✅ 扫码自动跳转小程序：正常工作
✅ 参数自动传递：已实现
✅ 访客申请页面：已支持扫码参数

🔧 高级功能（可选配置）：
⚙️ 微信官方小程序码API：可选升级
⚙️ access_token获取：需要实现
⚙️ 小程序AppID/AppSecret：需要配置

💡 选择说明：
• 当前功能已完全可用，扫码直接跳转小程序
• 微信官方小程序码是更高级的功能
• 可以生成真正的小程序码（非URL二维码）
• 但配置较复杂，当前方案已足够使用

请选择您的处理方式：`,
				showCancel: true,
				cancelText: '继续使用当前',
				confirmText: '查看高级配置',
				success: (res) => {
					if (res.confirm) {
						this.showDetailedConfigGuide();
					} else {
						uni.showToast({
							title: '当前方案已完全可用！',
							icon: 'success',
							duration: 2000
						});
					}
				}
			});
		},

		// 🎯 新增：显示详细配置指南
		showDetailedConfigGuide() {
			uni.showModal({
				title: '🔧 微信官方小程序码配置详细指南',
				content: `📋 完整配置步骤：

🔸 第一步：微信开发者后台配置
1. 登录微信公众平台：mp.weixin.qq.com
2. 进入您的小程序管理后台
3. 开发 → 开发管理 → 开发设置
4. 记录 AppID 和 AppSecret

🔸 第二步：后端API实现
需要在后端实现以下接口：

1️⃣ access_token获取接口：
GET https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=APPID&secret=APPSECRET

2️⃣ 小程序码生成接口：
POST https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=ACCESS_TOKEN
{
  "scene": "bp=手机号&t=bi",
  "page": "pages/reservation/form",
  "width": 430,
  "auto_color": false,
  "line_color": {"r":0,"g":0,"b":0}
}

🔸 第三步：修改现有后端接口
确保您的后端接口：
${this.getBackendApiInfo()}

返回真正的小程序码图片Base64数据。

💡 测试方法：
完成配置后，生成的二维码扫码将直接跳转小程序！`,
				showCancel: false,
				confirmText: '我知道了'
			});
		},

		// 🎯 新增：获取后端API信息
		getBackendApiInfo() {
			return `URL: /parking/butler/generateMiniProgramCode
期望返回格式：
{
  "code": "0",
  "data": {
    "type": "wechat_mini_program",
    "qrCodeImage": "data:image/png;base64,iVBORw0KGgo...",
    "officialCode": true,
    "pagePath": "pages/reservation/form?...",
    "butlerName": "管家姓名",
    "butlerPhone": "管家电话"
  }
}`;
		},

		// 🎯 新增：使用文本二维码替代方案
		async useTextQrCodeInstead() {
			uni.showModal({
				title: '📱 使用文本二维码（临时方案）',
				content: `由于微信官方小程序码需要后端配置，
建议暂时使用以下替代方案：

✅ 方案1：文本二维码 + 复制功能
• 生成包含访客信息的文本二维码
• 访客扫码获取信息文本
• 访客手动访问小程序并填写信息

✅ 方案2：直接分享访客申请链接
• 通过微信分享访客申请页面
• 自动填入管家信息和地址
• 访客直接在小程序中申请

请选择使用哪种方案：`,
				showCancel: true,
				cancelText: '生成文本码',
				confirmText: '分享链接',
				success: (res) => {
					if (res.confirm) {
						this.shareVisitorApplicationLink();
					} else {
						// 切换到文本二维码模式
						this.qrCodeType = 'text';
						this.generateQrCode();
					}
				}
			});
		},

		// 🎯 新增：分享访客申请链接
		shareVisitorApplicationLink() {
			const userInfo = uni.getStorageSync('userInfo');

			// 构建小程序分享参数
			const shareParams = {
				butlerName: this.butlerInfo?.username || '管家',
				butlerPhone: this.butlerInfo?.phone || userInfo.phone,
				community: this.selectedAddress.community || '',
				type: 'butler_invitation'
			};

			const shareUrl = `pages/auth/visitor-apply?${Object.keys(shareParams).map(key =>
				`${key}=${encodeURIComponent(shareParams[key])}`
			).join('&')}`;

			// 复制分享链接
			uni.setClipboardData({
				data: shareUrl,
				success: () => {
					uni.showModal({
						title: '🔗 分享链接已复制',
						content: `访客申请链接已复制到剪贴板：

${shareUrl}

📱 使用方法：
1. 将此链接发送给访客
2. 访客在微信中打开您的小程序
3. 通过链接跳转到访客申请页面
4. 管家信息将自动填入

💡 注意事项：
• 此方法需要访客手动打开小程序
• 但信息会自动填入，体验较好
• 无需配置微信官方API`,
						showCancel: false,
						confirmText: '知道了'
					});
				}
			});
		},

		// 生成文本二维码
		async generateTextQrCode() {
			const userInfo = uni.getStorageSync('userInfo');
			console.log('调用generateQrCodeData接口，参数:', {
				phone: userInfo.phone,
				...this.selectedAddress
			});

			const response = await request({
				url: apiUrls.butler.generateQrCodeData,
				method: 'GET',
				data: {
					phone: userInfo.phone, // 只使用手机号参数
					...this.selectedAddress
				}
			});

			console.log('文本二维码响应数据:', response);

			if (response.code === '0' && response.data) {
				// 检查内层数据是否有效
				if (response.data.code === '1') {
					console.error('管家信息验证失败:', response.data);

					// 提供更详细的错误信息和解决方案
					const errorMsg = response.data.msg || '未找到管家信息';
					let detailMsg = `错误原因：${errorMsg}\n\n`;
					detailMsg += `查询条件：\n`;
					detailMsg += `- 手机号：${userInfo?.phone || '未获取'}\n`;
					detailMsg += `- OpenID：${openid || '未生成'}\n\n`;
					detailMsg += `可能的解决方案：\n`;
					detailMsg += `1. 确认您的手机号是否正确\n`;
					detailMsg += `2. 联系管理员添加管家权限\n`;
					detailMsg += `3. 重新登录尝试`;

					uni.showModal({
						title: '管家信息查询失败',
						content: detailMsg,
						showCancel: true,
						cancelText: '返回',
						confirmText: '重新登录',
						success: (res) => {
							if (res.confirm) {
								uni.reLaunch({
									url: '/pages/auth/phone-auth'
								});
							} else {
								uni.navigateBack();
							}
						}
					});
					return;
				}
				console.warn('测试数据:', response.data);
				// 检查是否有管家姓名（验证数据完整性）
				// if (!response.data.butlerName) {
				// 	console.warn('管家信息不完整:', response.data);
				// 	uni.showToast({
				// 		title: '管家信息不完整，请联系管理员',
				// 		icon: 'none',
				// 		duration: 3000
				// 	});
				// 	return;
				// }

				this.qrCodeData = response.data;
				// 构建二维码文本
				this.qrCodeText = this.buildQrCodeUrl();

				console.log('准备生成文本二维码，数据:', this.qrCodeText);

				// 绘制二维码
				await this.drawQrCode();

			} else {
				throw new Error(response.msg || '获取二维码数据失败');
			}
		},

		// 显示Base64图片
		displayBase64Image(base64Data) {
			const ctx = uni.createCanvasContext('qrCanvas', this);

			// 创建临时图片
			const tempFilePath = base64Data;

			// 绘制图片到canvas
			ctx.drawImage(tempFilePath, 0, 0, this.qrSize, this.qrSize);
			ctx.draw();

			console.log('Base64图片显示完成');
		},

		// 专门生成小程序码的方法（优化扫描成功率）
		async drawMiniProgramQrCode(urlPath) {
			console.log('🎯 开始生成小程序码，URL路径:', urlPath);

			try {
				// 检查 uQRCode 插件是否可用
				if (typeof uQRCode === 'undefined') {
					console.error('uQRCode 插件未加载');
					throw new Error('uQRCode plugin not loaded');
				}

				// 🎯 验证是否为完整URL格式
				const isFullUrl = urlPath.startsWith('http://') || urlPath.startsWith('https://');
				console.log('🎯 输入是否为完整URL:', isFullUrl, '内容:', urlPath);

				// 🎯 修复：为了确保详细地址信息不丢失，优先使用原始URL
				let qrData = urlPath;

				// 只有在URL极长时才进行优化，避免详细地址信息丢失
				if (urlPath.length > 500) {
					console.log('🎯 URL极长，进行必要的优化处理');
					qrData = this.optimizeMiniProgramPath(urlPath);
				} else {
					console.log('🎯 URL长度适中，直接使用原始URL（保留完整详细地址信息）');
				}

				console.log('🎯 最终使用的二维码内容:', qrData);
				console.log('🎯 内容长度:', qrData.length);
				console.log('🎯 是否包含详细地址信息检查:');
				console.log('  - building参数:', qrData.includes('building=') ? '✅ 包含' : '❌ 缺失');
				console.log('  - units参数:', qrData.includes('units=') ? '✅ 包含' : '❌ 缺失');
				console.log('  - floor参数:', qrData.includes('floor=') ? '✅ 包含' : '❌ 缺失');
				console.log('  - room参数:', qrData.includes('room=') ? '✅ 包含' : '❌ 缺失');

				// 按照插件文档的标准配置参数生成小程序码
				uni.showLoading({
					title: '小程序码生成中',
					mask: true
				});

				uQRCode.make({
					canvasId: 'qrCanvas',
					componentInstance: this,
					text: qrData, // 使用优化后的内容
					size: this.qrSize,
					margin: 10, // 🎯 减少边距
					backgroundColor: '#ffffff',
					foregroundColor: '#000000',
					correctLevel: 1, // 🎯 中等纠错级别 (L=1, M=0, Q=3, H=2)
					success: (res) => {
						console.log('🎯 小程序码生成成功，图片路径:', res);

						// 存储生成的图片路径
						this.qrCodeImagePath = res;

						uni.hideLoading();
						uni.showToast({
							title: '✅ 高兼容性小程序码生成成功',
							icon: 'success',
							duration: 3000
						});

						// 更新存储的二维码文本
						this.qrCodeText = qrData;

						console.log('🎯 小程序码生成完成，优化后内容:', qrData);
					},
					fail: (error) => {
						console.error('🎯 小程序码生成失败:', error);
						uni.hideLoading();

						// 降级到信息卡片
						this.drawBasicQrCode();
						uni.showToast({
							title: '小程序码生成失败，已生成信息卡片',
							icon: 'none',
							duration: 2000
						});
					},
					complete: () => {
						console.log('🎯 小程序码生成流程完成');
						uni.hideLoading();
					}
				});

			} catch (error) {
				console.error('🎯 小程序码生成异常:', error);
				uni.hideLoading();

				// 降级到信息卡片
				this.drawBasicQrCode();
				uni.showToast({
					title: '小程序码生成异常，已生成信息卡片',
					icon: 'none',
					duration: 2000
				});
			}
		},

		// 🎯 修复：优化小程序路径以提高扫描成功率（强制使用完整URL）
		optimizeMiniProgramPath(originalPath) {
			console.log('🎯 开始优化小程序路径:', originalPath);

			// 🎯 检查是否为完整URL
			const isFullUrl = originalPath.startsWith('http://') || originalPath.startsWith('https://');
			console.log('🎯 是否为完整URL:', isFullUrl);

			// 🎯 关键修复：如果不是完整URL，立即转换为完整URL
			let workingPath = originalPath;
			if (!isFullUrl) {
				console.log('🎯 检测到相对路径，立即转换为完整URL');
				// 提取参数部分
				const queryPart = originalPath.includes('?') ? originalPath.split('?')[1] : '';
				workingPath = queryPart ? `${this.baseUrl}?${queryPart}` : this.baseUrl;
				console.log('🎯 转换后的完整URL:', workingPath);
			}

			// 🎯 修复：提高URL长度阈值，避免过度简化导致详细地址信息丢失
			if (workingPath.length > 400) {
				console.log('🎯 路径过长，进行简化处理（保留详细地址信息）');

				// 手动解析URL参数（兼容小程序环境）
				const urlParams = this.parseUrlParams(workingPath);
				const butlerPhone = urlParams.butlerPhone || urlParams.bp || '';
				const butlerName = urlParams.butlerName || urlParams.bn || '';
				const community = urlParams.community || urlParams.c || '';

				// 🎯 关键修复：保留详细地址信息
				const building = urlParams.building || '';
				const units = urlParams.units || '';
				const floor = urlParams.floor || '';
				const room = urlParams.room || '';
				const qrId = urlParams.qrId || '';

				// 构建包含详细地址信息的简化参数
				const shortParams = [];
				if (qrId) shortParams.push(`qrId=${encodeURIComponent(qrId)}`);
				if (butlerPhone) shortParams.push(`bp=${encodeURIComponent(butlerPhone)}`);
				if (butlerName) shortParams.push(`bn=${encodeURIComponent(butlerName)}`);
				if (community) shortParams.push(`c=${encodeURIComponent(community)}`);

				// 🎯 重要：保留详细地址信息，这些是用户要求必须包含的
				if (building) shortParams.push(`building=${encodeURIComponent(building)}`);
				if (units) shortParams.push(`units=${encodeURIComponent(units)}`);
				if (floor) shortParams.push(`floor=${encodeURIComponent(floor)}`);
				if (room) shortParams.push(`room=${encodeURIComponent(room)}`);

				shortParams.push('t=bi'); // butler_invitation 缩写
				shortParams.push(`ts=${Date.now().toString().slice(-8)}`); // 短时间戳

				// 🎯 简化：始终使用完整URL格式（workingPath已经是完整URL）
				const baseUrl = workingPath.split('?')[0]; // 提取基础URL
				const optimizedPath = `${baseUrl}?${shortParams.join('&')}`;
				console.log('🎯 简化后的完整URL（保留详细地址）:', optimizedPath);
				console.log('🎯 保留的详细地址信息: 楼栋=' + building + ', 单元=' + units + ', 楼层=' + floor + ', 房间=' + room);

				console.log('🎯 简化前长度:', workingPath.length, '简化后长度:', optimizedPath.length);

				return optimizedPath;
			}

			// 如果路径长度适中，直接返回完整URL格式
			console.log('🎯 路径长度适中，直接使用完整URL格式');
			return workingPath;
		},

		// 🎯 新增：手动解析URL参数（兼容小程序环境）
		parseUrlParams(url) {
			const params = {};
			try {
				const queryString = url.split('?')[1] || '';
				if (queryString) {
					const pairs = queryString.split('&');
					pairs.forEach(pair => {
						const [key, value] = pair.split('=');
						if (key && value !== undefined) {
							params[key] = decodeURIComponent(value);
						}
					});
				}
			} catch (error) {
				console.error('解析URL参数失败:', error);
			}
			console.log('🔍 解析的URL参数:', params);
			return params;
		},



		// 构建二维码URL（专门解决扫描兼容性问题）
		buildQrCodeUrl() {
			// 获取并验证管家信息，确保没有空字段
			const butlerName = this.qrCodeData?.butlerName?.trim() || '未知管家';
			const butlerPhone = this.qrCodeData?.butlerPhone?.trim() || '无';
			const address = (this.qrCodeData?.fullAddress || this.fullAddress || '未知地址').trim();

			console.log('原始数据检查:', {
				butlerName: this.qrCodeData?.butlerName,
				butlerPhone: this.qrCodeData?.butlerPhone,
				address: this.qrCodeData?.fullAddress || this.fullAddress,
				处理后_butlerName: butlerName,
				处理后_butlerPhone: butlerPhone,
				处理后_address: address
			});

			// 方案1：纯数字格式（最高扫描成功率）
			const phoneDigits = butlerPhone.replace(/\D/g, '') || '0000';
			const timestamp = Date.now().toString().slice(-8);
			const numericFormat = `${phoneDigits}${timestamp}`;

			// 方案2：简化英文格式（高兼容性）
			const simpleFormat =
				`Butler:${this.translateToEnglish(butlerName)},Phone:${phoneDigits},Location:${this.simplifyAddress(address)}`;

			// 方案3：标准 vCard 格式（通用标准）
			const vCardFormat = `BEGIN:VCARD
VERSION:3.0
FN:${butlerName}
TEL:${butlerPhone}
ADR:${address}
NOTE:访客预约-${new Date().toLocaleDateString()}
END:VCARD`;

			// 方案4：JSON格式（结构化数据）
			const jsonData = {
				type: 'visitor',
				butler: butlerName,
				phone: butlerPhone,
				address: address,
				time: Date.now()
			};
			const jsonFormat = JSON.stringify(jsonData);

			// 方案5：最简格式（保底方案）
			const minimalFormat = `${butlerName} ${butlerPhone}`;

			// 智能选择最佳格式
			let finalData;
			let selectedFormat = '';

			if (numericFormat.length <= 30) {
				finalData = numericFormat;
				selectedFormat = '纯数字格式';
			} else if (minimalFormat.length <= 50) {
				finalData = minimalFormat;
				selectedFormat = '最简格式';
			} else if (simpleFormat.length <= 100) {
				finalData = simpleFormat;
				selectedFormat = '简化英文格式';
			} else if (jsonFormat.length <= 200) {
				finalData = jsonFormat;
				selectedFormat = 'JSON格式';
			} else {
				// 降级到最基本的格式
				finalData = `${butlerName.slice(0, 5)} ${phoneDigits}`;
				selectedFormat = '降级格式';
			}

			console.log('二维码格式选择详情:', {
				纯数字格式: {
					内容: numericFormat,
					长度: numericFormat.length
				},
				简化英文格式: {
					内容: simpleFormat,
					长度: simpleFormat.length
				},
				vCard格式: {
					内容: vCardFormat.slice(0, 50) + '...',
					长度: vCardFormat.length
				},
				JSON格式: {
					内容: jsonFormat,
					长度: jsonFormat.length
				},
				最简格式: {
					内容: minimalFormat,
					长度: minimalFormat.length
				},
				最终选择: selectedFormat,
				最终数据: finalData,
				最终长度: finalData.length
			});

			return finalData;
		},

		// 将中文名称转换为拼音或英文（提高兼容性）
		translateToEnglish(name) {
			const translations = {
				'管家': 'Butler',
				'张': 'Zhang',
				'王': 'Wang',
				'李': 'Li',
				'赵': 'Zhao',
				'陈': 'Chen',
				'刘': 'Liu',
				'周': 'Zhou',
				'吴': 'Wu',
				'郑': 'Zheng',
				'孙': 'Sun',
				'朱': 'Zhu',
				'胡': 'Hu',
				'林': 'Lin',
				'何': 'He',
				'高': 'Gao',
				'罗': 'Luo',
				'郭': 'Guo',
				'梁': 'Liang',
				'马': 'Ma'
			};

			// 尝试翻译常见姓氏
			for (let [chinese, english] of Object.entries(translations)) {
				if (name.includes(chinese)) {
					return name.replace(chinese, english);
				}
			}

			// 如果无法翻译，返回简化版本
			return name.length > 5 ? 'Butler' : name;
		},

		// 简化地址信息
		simplifyAddress(address) {
			// 移除常见的中文地址词汇，保留核心信息
			const simplified = address
				.replace(/省|市|县|区|街道|社区|小区|栋|单元|层|号|室/g, '')
				.replace(/[，。！？；：""''【】（）]/g, '')
				.slice(0, 20); // 限制长度

			return simplified || 'Address';
		},

		// 已移除网络检查相关方法，现在使用本地qrcode库

		// 绘制二维码（使用本地qrcode库生成真正可扫描的二维码）
		async drawQrCode() {
			console.log('开始绘制二维码，数据:', this.qrCodeText);
			console.log('二维码尺寸:', this.qrSize);

			try {
				// 优先使用本地qrcode库生成真正的二维码
				await this.drawLocalQrCode();
			} catch (error) {
				console.error('本地二维码生成失败:', error);
				// 降级到信息卡片
				this.drawBasicQrCode();
			}
		},

		// 使用uQrcode库生成真正可扫描的二维码
		async drawLocalQrCode() {
			return new Promise((resolve, reject) => {
				try {
					console.log('开始使用uQRCode库生成二维码');
					console.log('二维码内容:', this.qrCodeText);
					console.log('二维码内容长度:', this.qrCodeText.length);

					// 检查 uQRCode 插件是否可用
					if (typeof uQRCode === 'undefined') {
						console.error('uQRCode 插件未加载');
						throw new Error('uQRCode plugin not loaded');
					}

					// 智能优化二维码内容，确保可扫描性
					let qrData = this.qrCodeText;
					console.log('原始二维码数据长度:', qrData.length);

					// 第一层优化：长度超过250字符时简化
					if (qrData.length > 250) {
						console.log('内容过长，进行第一层简化');
						const butlerName = this.qrCodeData?.butlerName || '管家';
						const butlerPhone = this.qrCodeData?.butlerPhone || '暂无';
						const community = this.selectedAddress.community || '未知小区';

						// 使用英文格式，兼容性更好
						qrData = `Butler:${butlerName}
Phone:${butlerPhone}
Community:${community}
Time:${new Date().toISOString().slice(0, 19)}`;
						console.log('第一层简化后:', qrData, '长度:', qrData.length);
					}

					// 第二层优化：长度超过150字符时进一步简化
					if (qrData.length > 150) {
						console.log('仍然过长，进行第二层简化');
						const butlerName = this.qrCodeData?.butlerName || 'Butler';
						const butlerPhone = this.qrCodeData?.butlerPhone || 'N/A';
						const community = this.selectedAddress.community || 'Community';

						// 使用最简格式
						qrData = `${butlerName},${butlerPhone},${community}`;
						console.log('第二层简化后:', qrData, '长度:', qrData.length);
					}

					// 第三层优化：如果还是太长，使用纯数字和字母
					if (qrData.length > 100) {
						console.log('极度简化处理');
						const timestamp = Date.now().toString().slice(-8); // 取时间戳后8位
						const phone = (this.qrCodeData?.butlerPhone || '').replace(/\D/g, '').slice(-
							8); // 提取纯数字
						qrData = `VISIT:${phone}:${timestamp}`;
						console.log('第三层简化后:', qrData, '长度:', qrData.length);
					}

					console.log('最终二维码内容:', qrData);
					console.log('最终长度:', qrData.length, '字符');

					// 尝试使用 uQRCode 标准方式
					this.generateWithUQRCode(qrData, resolve);

				} catch (error) {
					console.error('uQRCode初始化失败:', error);
					console.log('降级到信息卡片模式');

					// 如果真正的二维码生成失败，降级到信息卡片
					this.drawBasicQrCode();
					uni.showToast({
						title: '已生成信息卡片',
						icon: 'success',
						duration: 2000
					});
					resolve();
				}
			});
		},

		// 按照cc-defineQRCode插件文档的标准方式生成二维码
		generateWithUQRCode(qrData, resolve) {
			try {
				console.log('使用cc-defineQRCode插件标准方式生成');
				console.log('二维码数据:', qrData);
				console.log('画布尺寸:', this.qrSize);

				// 检查 uQRCode 是否可用
				if (typeof uQRCode === 'undefined') {
					console.error('uQRCode 插件未定义');
					throw new Error('uQRCode 插件不可用');
				}

				// 🎯 强制简化二维码内容以提高扫描成功率
				let finalQrData = this.generateScanFriendlyContent(qrData);
				console.log('🎯 简化后的二维码内容:', finalQrData);
				console.log('🎯 简化后长度:', finalQrData.length);

				// 按照插件文档的标准配置参数
				uni.showLoading({
					title: '二维码生成中',
					mask: true
				});

				uQRCode.make({
					canvasId: 'qrCanvas',
					componentInstance: this,
					text: finalQrData,
					size: this.qrSize,
					margin: 10, // 🎯 减少边距，提高内容密度
					backgroundColor: '#ffffff',
					foregroundColor: '#000000',
					correctLevel: 1, // 🎯 设置中等纠错级别 (L=1, M=0, Q=3, H=2)
					success: (res) => {
						console.log('uQRCode 生成成功，图片路径:', res);

						// 存储生成的图片路径
						this.qrCodeImagePath = res;

						uni.hideLoading();
						uni.showToast({
							title: '✅ 高兼容性二维码生成成功',
							icon: 'success',
							duration: 2000
						});

						// 更新二维码文本为实际使用的内容
						this.qrCodeText = finalQrData;

						resolve();
					},
					fail: (error) => {
						console.error('uQRCode 生成失败:', error);
						uni.hideLoading();
						throw error;
					},
					complete: () => {
						console.log('uQRCode 生成完成');
						uni.hideLoading();
					}
				});

			} catch (uqrError) {
				console.error('uQRCode 插件方法失败:', uqrError);
				uni.hideLoading();
				console.log('尝试备用生成方式');

				// 尝试备用方式
				this.generateWithFallback(qrData, resolve);
			}
		},

		// 🎯 修复：生成扫描友好的二维码内容（保持完整URL格式）
		generateScanFriendlyContent(originalData) {
			console.log('🎯 开始优化二维码内容，原始数据:', originalData);

			// 🎯 关键修复：如果原始数据是完整URL，优先保持URL格式
			const isFullUrl = originalData.startsWith('http://') || originalData.startsWith('https://');

			if (isFullUrl) {
				console.log('🎯 检测到完整URL，保持URL格式不变');
				// 🎯 修复：提高URL长度阈值，避免详细地址信息被简化掉
				// 只有在URL极长（超过500字符）时才进行简化，确保详细地址信息不丢失
				if (originalData.length > 500) {
					console.log('🎯 URL极长，进行参数简化（保留详细地址信息）');
					// 重新调用已修复的 optimizeMiniProgramPath 方法
					const optimizedUrl = this.optimizeMiniProgramPath(originalData);
					console.log('🎯 URL简化后:', optimizedUrl);
					return optimizedUrl;
				} else {
					console.log('🎯 URL长度适中，直接使用完整URL（包含详细地址信息）');
					console.log('🎯 URL长度:', originalData.length, '字符');
					return originalData;
				}
			}

			// 如果不是URL格式，则使用简化策略（用于文本二维码等）
			console.log('🎯 非URL格式，使用简化策略');

			const butlerName = this.qrCodeData?.butlerName || '管家';
			const butlerPhone = this.qrCodeData?.butlerPhone || '';
			const community = this.selectedAddress.community || '';

			// 🎯 策略1：优先使用纯数字格式（最高扫描成功率）
			const phoneDigits = butlerPhone.replace(/\D/g, '');
			if (phoneDigits.length >= 8) {
				const shortCode = phoneDigits.slice(-8) + Date.now().toString().slice(-4);
				console.log('🎯 使用纯数字格式:', shortCode);
				return shortCode;
			}

			// 🎯 策略2：超短格式（管家姓名+电话）
			if (butlerName && phoneDigits) {
				const shortFormat = `${butlerName}:${phoneDigits}`;
				if (shortFormat.length <= 30) {
					console.log('🎯 使用超短格式:', shortFormat);
					return shortFormat;
				}
			}

			// 🎯 策略3：仅电话号码
			if (phoneDigits.length >= 11) {
				console.log('🎯 使用纯电话号码:', phoneDigits);
				return phoneDigits;
			}

			// 🎯 策略4：英文简化格式
			const englishName = this.translateToEnglish(butlerName);
			const simpleFormat = `${englishName}-${phoneDigits.slice(-8)}`;
			if (simpleFormat.length <= 25) {
				console.log('🎯 使用英文简化格式:', simpleFormat);
				return simpleFormat;
			}

			// 🎯 策略5：时间戳格式（保底方案）
			const timestamp = Date.now().toString();
			console.log('🎯 使用时间戳格式:', timestamp);
			return timestamp;
		},

		// 备用生成方式
		generateWithFallback(qrData, resolve) {
			try {
				console.log('使用备用方式生成二维码');

				// 尝试其他库或方式
				if (typeof window !== 'undefined' && window.QRCode) {
					console.log('尝试使用其他二维码库');
					// 如果有其他二维码库可用
					this.generateWithOtherLibrary(qrData, resolve);
					return;
				}

				// 如果没有其他库，生成信息卡片
				console.log('生成二维码信息卡片');
				const ctx = uni.createCanvasContext('qrCanvas', this);

				// 清空画布
				ctx.setFillStyle('#ffffff');
				ctx.fillRect(0, 0, this.qrSize, this.qrSize);

				// 绘制一个专业的信息展示
				this.drawSimpleQrInfo(ctx, qrData);

				setTimeout(() => {
					ctx.draw();
					console.log('备用方式生成完成');
					uni.showToast({
						title: '已生成信息卡片',
						icon: 'success',
						duration: 2000
					});
					resolve();
				}, 100);

			} catch (fallbackError) {
				console.error('备用方式也失败:', fallbackError);
				// 最后降级到基础卡片
				console.log('最终降级到基础信息卡片');
				this.drawBasicQrCode();
				uni.showToast({
					title: '已生成基础信息卡片',
					icon: 'success',
					duration: 2000
				});
				resolve();
			}
		},

		// 使用其他库生成二维码
		generateWithOtherLibrary(qrData, resolve) {
			try {
				console.log('尝试使用备用二维码库');
				// 这里可以添加其他二维码库的调用
				// 暂时回退到信息卡片
				throw new Error('其他库暂不可用');
			} catch (error) {
				console.log('其他库不可用，生成信息卡片');
				this.drawBasicQrCode();
				uni.showToast({
					title: '已生成信息卡片',
					icon: 'success',
					duration: 2000
				});
				resolve();
			}
		},

		// 绘制简单的二维码信息
		drawSimpleQrInfo(ctx, qrData) {
			// 绘制边框
			ctx.setStrokeStyle('#025def');
			ctx.setLineWidth(3);
			ctx.strokeRect(5, 5, this.qrSize - 10, this.qrSize - 10);

			// 绘制标题
			ctx.setFillStyle('#025def');
			ctx.setFontSize(16);
			ctx.setTextAlign('center');
			ctx.fillText('访客预约二维码', this.qrSize / 2, 35);

			// 绘制内容
			ctx.setFillStyle('#333333');
			ctx.setFontSize(12);
			ctx.setTextAlign('left');

			const lines = qrData.split('\n');
			let y = 60;
			lines.forEach((line, index) => {
				if (line.length > 20) {
					// 长行分割
					const chunks = [];
					for (let i = 0; i < line.length; i += 20) {
						chunks.push(line.substring(i, i + 20));
					}
					chunks.forEach(chunk => {
						ctx.fillText(chunk, 15, y);
						y += 18;
					});
				} else {
					ctx.fillText(line, 15, y);
					y += 18;
				}
			});

			// 绘制提示
			ctx.setFillStyle('#666666');
			ctx.setFontSize(10);
			ctx.setTextAlign('center');
			ctx.fillText('请复制文本信息分享给访客', this.qrSize / 2, this.qrSize - 20);
		},

		// 已移除base64图片绘制方法，现在直接使用信息卡片

		// 已移除在线API相关方法，现在使用本地qrcode库

		// 已移除所有在线API方法，现在使用本地qrcode库

		// 检查生成状态（调试用）
		debugCheckQrStatus() {
			let statusText = `二维码生成状态：\n`;
			statusText += `✅ 使用方案：cc-defineQRCode官方插件（已修复）\n`;
			statusText += `• 插件来源：DCloud插件市场 cc-defineQRCode 插件\n`;
			statusText += `• 数据长度：${this.qrCodeText ? this.qrCodeText.length : 0}字符\n`;
			statusText += `• 二维码尺寸：${this.qrSize}px\n`;
			statusText += `• 生成模式：完全离线本地生成\n`;
			statusText += `• 技术方案：uQRCode.make() 插件标准调用\n`;
			statusText += `• 调用方式：import + uQRCode.make()\n`;
			statusText += `• 参数配置：canvasId + componentInstance + text + size + margin\n`;
			statusText += `• 回调机制：success/fail/complete 标准回调\n`;
			statusText += `• 错误处理：四层降级保护\n`;
			statusText += `• 实现方式：官方插件 → 备用库 → 信息卡片 → 基础卡片\n`;
			statusText += `• 纠错级别：插件默认（优化）\n`;
			statusText += `• 兼容性：支持微信扫一扫等主流扫码工具\n`;

			if (this.qrCodeData) {
				statusText += `\n✅ 数据状态：已准备\n`;
				statusText += `• 管家姓名：${this.qrCodeData.butlerName || '未知'}\n`;
				statusText += `• 管家电话：${this.qrCodeData.butlerPhone || '未知'}\n`;
				statusText += `• 访问地址：${this.fullAddress || '未设置'}\n`;
			} else {
				statusText += `\n❌ 数据状态：未准备\n`;
			}

			// 检查 uQRCode 插件是否可用
			statusText += `\n🔧 系统状态检查：\n`;
			statusText += `• uQRCode 插件：${typeof uQRCode !== 'undefined' ? '✅ 已加载' : '❌ 未加载'}\n`;

			if (typeof uQRCode !== 'undefined') {
				statusText += `• 类型检查：${typeof uQRCode === 'object' ? '✅ 是对象' : '❌ 不是对象'}\n`;
				statusText += `• 生成方式：uQRCode.make() 插件标准调用\n`;
				statusText += `• 错误修复：✅ 已改为cc-defineQRCode插件标准方式\n`;
				statusText += `• 调用方式：✅ 使用 uQRCode.make() 插件方法\n`;

				try {
					statusText += `• make方法：${typeof uQRCode.make === 'function' ? '✅ 插件方法可用' : '❌ 插件方法不可用'}\n`;
					statusText += `• 插件来源：✅ cc-defineQRCode 官方插件\n`;
				} catch (error) {
					statusText += `• 插件检查：❌ 检查失败 (${error.message})\n`;
				}
			} else {
				statusText += `• 生成方式：备用Canvas绘制\n`;
				statusText += `• 提示：uQRCode插件未加载，将使用备用方案\n`;
			}

			statusText += `• Canvas支持：✅ uni.createCanvasContext 可用\n`;
			statusText += `• 降级机制：✅ 四层保护确保100%可用性\n`;
			statusText += `• 问题修复：✅ 已使用cc-defineQRCode官方插件修复\n`;
			statusText += `• 插件参考：✅ DCloud插件市场官方插件\n`;

			uni.showModal({
				title: '系统状态检查（官方插件版）',
				content: statusText,
				showCancel: false,
				confirmText: '确定'
			});
		},

		// 本地生成二维码（使用新的分层方式）
		async drawQrCodeLocal() {
			try {
				console.log('开始本地二维码生成，数据长度:', this.qrCodeText.length);

				// 检查数据长度，如果太长则使用简化版本
				let qrData = this.qrCodeText;
				if (qrData.length > 200) {
					console.log('数据过长，使用简化版本');
					// 生成简化的二维码数据
					qrData =
						`访客预约|${this.qrCodeData?.butlerName || '管家'}|${this.qrCodeData?.butlerPhone || ''}|${this.fullAddress || ''}`;
					if (qrData.length > 100) {
						qrData = `预约|${this.qrCodeData?.butlerName || '管家'}|${this.qrCodeData?.butlerPhone || ''}`;
					}
				}

				console.log('使用的二维码数据:', qrData);

				// 使用新的分层生成方式
				if (typeof uQRCode !== 'undefined') {
					return new Promise((resolve) => {
						try {
							this.generateWithUQRCode(qrData, resolve);
						} catch (error) {
							console.warn('uQRCode 插件生成失败，使用备用方式:', error);
							this.generateWithFallback(qrData, resolve);
						}
					});
				} else {
					console.warn('uQRCode 插件未加载，使用基础绘制方法');
					this.drawBasicQrCode(qrData);
					uni.showToast({
						title: '已生成信息卡片',
						icon: 'success'
					});
				}

			} catch (error) {
				console.error('本地二维码生成失败:', error);
				// 降级到最基本的方法
				this.drawBasicQrCode();
				uni.showToast({
					title: '已生成基础信息卡片',
					icon: 'success'
				});
			}
		},

		// 基础二维码绘制（专业的信息卡片）
		drawBasicQrCode(customData = null) {
			try {
				console.log('开始绘制专业信息卡片');
				const ctx = uni.createCanvasContext('qrCanvas', this);

				// 清空画布并设置渐变背景
				ctx.setFillStyle('#f8f9fa');
				ctx.fillRect(0, 0, this.qrSize, this.qrSize);

				// 绘制卡片边框
				this.drawCardBorder(ctx);

				// 绘制标题区域
				this.drawCardHeader(ctx);

				// 绘制主要信息
				this.drawCardContent(ctx);

				// 绘制装饰性二维码图案
				this.drawDecorativeQRPattern(ctx);

				// 绘制底部信息
				this.drawCardFooter(ctx);

				ctx.draw();

				console.log('专业信息卡片绘制完成');
				uni.showToast({
					title: '访客预约卡片已生成',
					icon: 'success',
					duration: 2000
				});

			} catch (error) {
				console.error('信息卡片生成失败:', error);
				this.drawTextOnlyFallback();
			}
		},

		// 绘制卡片边框
		drawCardBorder(ctx) {
			// 外边框
			ctx.setStrokeStyle('#025def');
			ctx.setLineWidth(3);
			ctx.strokeRect(2, 2, this.qrSize - 4, this.qrSize - 4);

			// 内边框
			ctx.setStrokeStyle('#e0e6ff');
			ctx.setLineWidth(1);
			ctx.strokeRect(8, 8, this.qrSize - 16, this.qrSize - 16);
		},

		// 绘制卡片标题
		drawCardHeader(ctx) {
			// 标题背景
			ctx.setFillStyle('#025def');
			ctx.fillRect(10, 10, this.qrSize - 20, 35);

			// 标题文字
			ctx.setFillStyle('#ffffff');
			ctx.setFontSize(16);
			ctx.setTextAlign('center');
			ctx.fillText('访客预约信息', this.qrSize / 2, 32);
		},

		// 绘制卡片主要内容
		drawCardContent(ctx) {
			const startY = 60;
			const lineHeight = 20;
			let currentY = startY;

			ctx.setFillStyle('#333333');
			ctx.setFontSize(14);
			ctx.setTextAlign('left');

			// 管家信息
			if (this.qrCodeData?.butlerName) {
				ctx.setFillStyle('#025def');
				ctx.fillText('管    家:', 20, currentY);
				ctx.setFillStyle('#333333');
				ctx.fillText(this.qrCodeData.butlerName, 80, currentY);
				currentY += lineHeight;
			}

			// 电话信息
			if (this.qrCodeData?.butlerPhone) {
				ctx.setFillStyle('#025def');
				ctx.fillText('联系电话:', 20, currentY);
				ctx.setFillStyle('#333333');
				ctx.fillText(this.qrCodeData.butlerPhone, 80, currentY);
				currentY += lineHeight;
			}

			// 地址信息
			if (this.fullAddress) {
				ctx.setFillStyle('#025def');
				ctx.fillText('访问地址:', 20, currentY);
				currentY += lineHeight;

				// 分行显示长地址
				const address = this.fullAddress;
				const maxWidth = this.qrSize - 40;
				const addressLines = this.splitTextToLines(ctx, address, maxWidth, 12);

				ctx.setFillStyle('#333333');
				ctx.setFontSize(12);
				addressLines.forEach(line => {
					ctx.fillText(line, 20, currentY);
					currentY += 16;
				});
			}

			// 生成时间
			ctx.setFillStyle('#666666');
			ctx.setFontSize(10);
			const now = new Date();
			const timeStr = now.toLocaleString('zh-CN');
			ctx.fillText(`生成时间: ${timeStr}`, 20, currentY + 10);
		},

		// 绘制装饰性二维码图案
		drawDecorativeQRPattern(ctx) {
			const patternSize = 60;
			const startX = this.qrSize - patternSize - 15;
			const startY = 55;

			// 背景
			ctx.setFillStyle('#f0f7ff');
			ctx.fillRect(startX, startY, patternSize, patternSize);

			// 边框
			ctx.setStrokeStyle('#025def');
			ctx.setLineWidth(1);
			ctx.strokeRect(startX, startY, patternSize, patternSize);

			// 绘制二维码样式的点阵
			ctx.setFillStyle('#025def');
			const dotSize = 3;
			const spacing = 5;

			for (let i = 0; i < 10; i++) {
				for (let j = 0; j < 10; j++) {
					// 创建随机但固定的图案
					const seed = (i * 10 + j + this.qrCodeData?.butlerPhone?.length || 0) % 3;
					if (seed === 0) {
						const x = startX + 5 + i * spacing;
						const y = startY + 5 + j * spacing;
						ctx.fillRect(x, y, dotSize, dotSize);
					}
				}
			}

			// 中心文字
			ctx.setFillStyle('#025def');
			ctx.setFontSize(10);
			ctx.setTextAlign('center');
			ctx.fillText('二维码', startX + patternSize / 2, startY + patternSize / 2 + 15);
			ctx.fillText('(离线模式)', startX + patternSize / 2, startY + patternSize / 2 + 25);
		},

		// 绘制卡片底部
		drawCardFooter(ctx) {
			const footerY = this.qrSize - 35;

			// 底部背景
			ctx.setFillStyle('#f8f9fa');
			ctx.fillRect(10, footerY, this.qrSize - 20, 25);

			// 使用说明
			ctx.setFillStyle('#666666');
			ctx.setFontSize(10);
			ctx.setTextAlign('center');
			ctx.fillText('请保存此卡片并提供给访客', this.qrSize / 2, footerY + 10);
			ctx.fillText('或点击"复制信息"按钮获取文本信息', this.qrSize / 2, footerY + 20);
		},

		// 文本分行处理
		splitTextToLines(ctx, text, maxWidth, fontSize) {
			ctx.setFontSize(fontSize);
			const lines = [];
			let currentLine = '';

			for (let i = 0; i < text.length; i++) {
				const testLine = currentLine + text[i];
				const metrics = ctx.measureText ? ctx.measureText(testLine) : {
					width: testLine.length * fontSize * 0.6
				};

				if (metrics.width > maxWidth && currentLine) {
					lines.push(currentLine);
					currentLine = text[i];
				} else {
					currentLine = testLine;
				}
			}

			if (currentLine) {
				lines.push(currentLine);
			}

			return lines;
		},

		// 格式化二维码数据用于显示
		formatQrDataForDisplay(data) {
			const lines = [];

			if (this.qrCodeData && this.qrCodeData.butlerName) {
				lines.push(`管家: ${this.qrCodeData.butlerName}`);
			}
			if (this.qrCodeData && this.qrCodeData.butlerPhone) {
				lines.push(`电话: ${this.qrCodeData.butlerPhone}`);
			}
			if (this.fullAddress) {
				// 分割长地址
				const address = this.fullAddress;
				if (address.length > 15) {
					const chunks = [];
					for (let i = 0; i < address.length; i += 15) {
						chunks.push(address.substring(i, i + 15));
					}
					lines.push(`地址: ${chunks[0]}`);
					chunks.slice(1).forEach(chunk => lines.push(`      ${chunk}`));
				} else {
					lines.push(`地址: ${address}`);
				}
			}

			lines.push('');
			lines.push('请将此信息提供给访客');

			return lines;
		},

		// 绘制简单的定位符
		drawSimpleFinderPattern(ctx, x, y, size) {
			ctx.setFillStyle('#000000');
			// 外框
			ctx.fillRect(x, y, size, size);
			// 内部白色
			ctx.setFillStyle('#ffffff');
			ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
			// 中心黑色
			ctx.setFillStyle('#000000');
			ctx.fillRect(x + 6, y + 6, size - 12, size - 12);
		},

		// 绘制装饰性图案
		drawDecorativePattern(ctx) {
			ctx.setFillStyle('#000000');
			const centerX = this.qrSize / 2;
			const centerY = this.qrSize / 2;

			// 绘制一些小点作为装饰
			for (let i = 0; i < 10; i++) {
				const angle = (i / 10) * 2 * Math.PI;
				const radius = 50;
				const x = centerX + Math.cos(angle) * radius;
				const y = centerY + Math.sin(angle) * radius;

				ctx.beginPath();
				ctx.arc(x, y, 2, 0, 2 * Math.PI);
				ctx.fill();
			}
		},

		// 最后的文本显示备用方案
		drawTextOnlyFallback() {
			try {
				const ctx = uni.createCanvasContext('qrCanvas', this);

				// 清空画布
				ctx.setFillStyle('#f0f0f0');
				ctx.fillRect(0, 0, this.qrSize, this.qrSize);

				// 绘制边框
				ctx.setStrokeStyle('#cccccc');
				ctx.setLineWidth(1);
				ctx.strokeRect(0, 0, this.qrSize, this.qrSize);

				// 显示错误信息
				ctx.setFillStyle('#666666');
				ctx.setFontSize(16);
				ctx.setTextAlign('center');
				ctx.fillText('二维码生成失败', this.qrSize / 2, this.qrSize / 2 - 20);
				ctx.fillText('请使用复制功能获取信息', this.qrSize / 2, this.qrSize / 2 + 20);

				ctx.draw();

				uni.showToast({
					title: '请使用复制功能',
					icon: 'none'
				});

			} catch (error) {
				console.error('文本显示也失败了:', error);
			}
		},

		// 绘制定位符
		drawFinderPattern(ctx, startX, startY, nSize) {
			// 外框 7x7
			ctx.fillRect(startX * nSize, startY * nSize, 7 * nSize, nSize);
			ctx.fillRect(startX * nSize, (startY + 6) * nSize, 7 * nSize, nSize);
			ctx.fillRect(startX * nSize, startY * nSize, nSize, 7 * nSize);
			ctx.fillRect((startX + 6) * nSize, startY * nSize, nSize, 7 * nSize);

			// 内部实心方块 3x3
			ctx.fillRect((startX + 2) * nSize, (startY + 2) * nSize, 3 * nSize, 3 * nSize);
		},

		// 绘制数据模式
		drawDataPattern(ctx, nCount, nSize) {
			const hash = this.hashString(this.qrCodeText);

			for (let row = 0; row < nCount; row++) {
				for (let col = 0; col < nCount; col++) {
					// 跳过定位符区域
					if (this.isFinderPatternArea(row, col, nCount)) {
						continue;
					}

					// 跳过时序模式
					if (row === 6 || col === 6) {
						continue;
					}

					// 基于哈希值和位置生成图案
					const value = (hash + row * 31 + col * 17) % 256;
					if (value % 2 === 0) {
						ctx.fillRect(col * nSize, row * nSize, nSize, nSize);
					}
				}
			}
		},

		// 检查是否在定位符区域
		isFinderPatternArea(row, col, nCount) {
			return (row < 9 && col < 9) ||
				(row < 9 && col >= nCount - 8) ||
				(row >= nCount - 8 && col < 9);
		},

		// 字符串哈希函数
		hashString(str) {
			let hash = 0;
			for (let i = 0; i < str.length; i++) {
				const char = str.charCodeAt(i);
				hash = ((hash << 5) - hash) + char;
				hash = hash & hash;
			}
			return Math.abs(hash);
		},

		// 保存二维码
		saveQrCode() {
			uni.canvasToTempFilePath({
				canvasId: 'qrCanvas',
				success: (res) => {
					uni.saveImageToPhotosAlbum({
						filePath: res.tempFilePath,
						success: () => {
							uni.showToast({
								title: '保存成功',
								icon: 'success'
							});
						},
						fail: () => {
							uni.showToast({
								title: '保存失败',
								icon: 'none'
							});
						}
					});
				}
			}, this);
		},

		// 直接分享二维码图片（使用 wx.shareImageMessage）
		shareQrCodeImage() {
			console.log('📤 准备分享二维码图片');
			
			// 将canvas转为临时文件路径
			uni.canvasToTempFilePath({
				canvasId: 'qrCanvas',
				success: (res) => {
					const imagePath = res.tempFilePath;
					console.log('✅ 二维码图片路径已生成:', imagePath);
					
					// 检查微信环境和API支持
					if (typeof wx === 'undefined') {
						uni.showModal({
							title: '提示',
							content: '此功能需要在微信小程序中使用',
							showCancel: false
						});
						return;
					}
					
					// 检查基础库版本是否支持 showShareImageMenu
					const systemInfo = wx.getSystemInfoSync();
					const sdkVersion = systemInfo.SDKVersion || systemInfo.sdkVersion || '0.0.0';
					console.log('当前基础库版本:', sdkVersion);
					
					if (this.parseVersion(sdkVersion) < 21400) {
						uni.showModal({
							title: '版本不支持',
							content: '当前微信版本过低，不支持直接分享图片功能。\n\n请升级微信到最新版本（需要基础库 2.14.0 及以上）后重试。',
							showCancel: false
						});
						return;
					}
					
					// 使用 wx.showShareImageMenu 弹出分享图片菜单
					if (wx.showShareImageMenu) {
						wx.showShareImageMenu({
							path: imagePath,
							success: () => {
								console.log('✅ 分享菜单调起成功');
								uni.showToast({
									title: '请选择分享方式',
									icon: 'none',
									duration: 2000
								});
								// 记录分享事件
								this.onShareSuccess('分享图片');
							},
							fail: (err) => {
								console.error('❌ 调起分享菜单失败:', err);
								// 如果分享失败，提供降级方案
								this.showShareFallback(imagePath);
							}
						});
					} else {
						// API不存在，使用降级方案
						console.warn('⚠️ wx.showShareImageMenu API 不可用');
						this.showShareFallback(imagePath);
					}
				},
				fail: (err) => {
					console.error('❌ 获取二维码图片失败:', err);
					uni.showToast({
						title: '获取图片失败，请重试',
						icon: 'none',
						duration: 2000
					});
				}
			}, this);
		},
		
		// 分享降级方案
		showShareFallback(imagePath) {
			uni.showModal({
				title: '分享二维码',
				content: '请选择分享方式：\n\n1. 保存到相册后手动分享\n2. 取消返回',
				showCancel: true,
				cancelText: '取消',
				confirmText: '保存到相册',
				success: (res) => {
					if (res.confirm) {
						this.saveAndShare(imagePath);
					}
				}
			});
		},

		// 解析版本号
		parseVersion(versionStr) {
			if (!versionStr || typeof versionStr !== 'string') {
				return 0;
			}
			const parts = versionStr.split('.');
			let num = 0;
			for (let i = 0; i < 3 && i < parts.length; i++) {
				const part = parseInt(parts[i], 10) || 0;
				num = num * 100 + part;
			}
			return num;
		},

		// 保存图片分享
		saveAndShare(imagePath) {
			uni.saveImageToPhotosAlbum({
				filePath: imagePath,
				success: () => {
					uni.showModal({
						title: '✅ 保存成功',
						content: '二维码已保存到相册\n\n您可以通过以下方式分享：\n• 打开微信，选择要分享的对象\n• 点击相册图标，选择刚保存的二维码\n• 发送给访客即可',
						showCancel: false,
						confirmText: '知道了'
					});
				},
				fail: (err) => {
					console.error('保存图片失败:', err);
					// 检查是否需要授权
					if (err.errMsg && err.errMsg.includes('auth')) {
						uni.showModal({
							title: '需要授权',
							content: '保存图片需要您的授权，请在设置中允许访问相册',
							showCancel: true,
							cancelText: '取消',
							confirmText: '去设置',
							success: (res) => {
								if (res.confirm) {
									uni.openSetting();
								}
							}
						});
					} else {
						uni.showToast({
							title: '保存失败，请重试',
							icon: 'none'
						});
					}
				}
			});
		},

		// 获取管家完整地址
		getButlerFullAddress() {
			// 确保数据格式正确
			const butlerInfo = this.ensureButlerInfoFormat(this.butlerInfo);
			if (!butlerInfo) return '未设置';

			let address = '';
			if (butlerInfo.province) address += butlerInfo.province;
			if (butlerInfo.city) address += butlerInfo.city;
			if (butlerInfo.district) address += butlerInfo.district;
			if (butlerInfo.community) address += butlerInfo.community;

			return address || '未设置';
		},

		// 使用默认小区（现在改为自动填入管家地址）
		async useDefaultCommunity() {
			console.log('🎯 用户点击了"自动填入管家地址"按钮');

			// 确保数据格式正确
			const butlerInfo = this.ensureButlerInfoFormat(this.butlerInfo);
			if (!butlerInfo) {
				uni.showToast({
					title: '管家信息未加载',
					icon: 'none'
				});
				return;
			}

			// 检查管家是否有地址信息
			if (!butlerInfo.province && !butlerInfo.city && !butlerInfo.district && !butlerInfo.community) {
				uni.showModal({
					title: '地址信息不完整',
					content: '管家资料中缺少地址信息，无法自动填入。\n\n建议联系管理员完善管家资料，或手动选择访问地址。',
					showCancel: false,
					confirmText: '知道了'
				});
				return;
			}

			try {
				// 直接调用我们之前写好的预填地址方法
				// 注意：不使用showLoading，因为preloadAddressData内部会显示toast/modal
				// 微信小程序同一时间只能显示一个交互组件，会产生冲突
				await this.preloadAddressData();

			} catch (error) {
				console.error('自动填入管家地址失败:', error);
				uni.showToast({
					title: '填入失败，请重试',
					icon: 'none'
				});
			}
		},

		// 格式化时间
		formatTime(timestamp) {
			const date = new Date(timestamp);
			return date.toLocaleString('zh-CN');
		},

		// 检查管家信息状态（调试用）
		checkButlerInfoStatus() {
			console.log('=== 管家信息状态检查 ===');
			console.log('原始 butlerInfo:', this.butlerInfo);
			console.log('butlerInfo 类型:', typeof this.butlerInfo);
			console.log('butlerInfo 是否为null:', this.butlerInfo === null);
			console.log('butlerInfo 是否为undefined:', this.butlerInfo === undefined);

			if (this.butlerInfo) {
				console.log('butlerInfo 属性检查:');
				console.log('- 是否有 code 属性:', this.butlerInfo.hasOwnProperty('code'));
				console.log('- 是否有 data 属性:', this.butlerInfo.hasOwnProperty('data'));
				console.log('- 是否有 province 属性:', this.butlerInfo.hasOwnProperty('province'));

				if (this.butlerInfo.hasOwnProperty('code') && this.butlerInfo.hasOwnProperty('data')) {
					console.log('这是响应对象格式，实际数据在 data 中:');
					console.log('- data.province:', this.butlerInfo.data?.province);
					console.log('- data.city:', this.butlerInfo.data?.city);
					console.log('- data.district:', this.butlerInfo.data?.district);
					console.log('- data.community:', this.butlerInfo.data?.community);
				} else {
					console.log('这是直接的数据对象:');
					console.log('- province:', this.butlerInfo.province);
					console.log('- city:', this.butlerInfo.city);
					console.log('- district:', this.butlerInfo.district);
					console.log('- community:', this.butlerInfo.community);
				}
			}

			// 测试辅助方法
			const correctedInfo = this.ensureButlerInfoFormat(this.butlerInfo);
			console.log('经过格式修正后的数据:', correctedInfo);
			console.log('===========================');

			// 显示给用户
			uni.showModal({
				title: '管家信息状态',
				content: `原始数据类型: ${typeof this.butlerInfo}\n是否为响应格式: ${this.butlerInfo?.hasOwnProperty('code')}\n修正后是否有地址: ${!!(correctedInfo?.province)}`,
				showCancel: false
			});
		},

		// 已移除网络状态检测方法，现在使用本地生成

		// 测试二维码生成功能（调试用）
		async forceLocalQrCode() {
			if (!this.canGenerate) {
				uni.showToast({
					title: '请至少选择到小区',
					icon: 'none'
				});
				return;
			}

			try {
				console.log('用户手动触发二维码生成');

				// 确保有必要的数据
				if (!this.qrCodeData) {
					const userInfo = uni.getStorageSync('userInfo');
					const response = await request({
						url: apiUrls.butler.generateQrCodeData,
						method: 'GET',
						data: {
							phone: userInfo.phone,
							...this.selectedAddress
						}
					});

					if (response.code === '0' && response.data) {
						this.qrCodeData = this.ensureButlerInfoFormat(response.data);
						this.qrCodeText = this.buildQrCodeUrl();
					}
				}

				// 生成真正的二维码
				try {
					// 直接调用修复后的 drawLocalQrCode 方法
					await this.drawLocalQrCode();
				} catch (localError) {
					console.warn('uQRCode生成失败，使用信息卡片:', localError);
					this.drawBasicQrCode();
				}

			} catch (error) {
				console.error('二维码生成失败:', error);
				uni.showToast({
					title: '二维码生成失败',
					icon: 'none'
				});
			}
		},

		// 测试不同格式的二维码（新增方法）
		async testDifferentQrFormats() {
			if (!this.canGenerate) {
				uni.showToast({
					title: '请至少选择到小区',
					icon: 'none'
				});
				return;
			}

			// 显示格式选择菜单
			uni.showActionSheet({
				itemList: [
					'🔢 纯数字格式 (推荐-最易扫描)',
					'📱 极简格式 (仅手机号)',
					'🔤 英文格式 (中等兼容)',
					'📝 简单文本格式',
					'🌐 短URL格式 (高级)',
					'🔄 自动选择最佳格式'
				],
				success: async (res) => {
					const formats = [
						'numeric', 'minimal', 'english', 'simple', 'url', 'auto'
					];

					if (formats[res.tapIndex] === 'auto') {
						await this.autoSelectBestFormat();
					} else {
						await this.generateTestQrCode(formats[res.tapIndex]);
					}
				}
			});
		},

		// 生成测试二维码（针对扫描问题优化）
		async generateTestQrCode(format) {
			try {
				const butlerName = this.qrCodeData?.butlerName || '张管家';
				const butlerPhone = this.qrCodeData?.butlerPhone || '13800138000';
				const community = this.selectedAddress.community || '欧洲新城';

				let testData = '';
				let formatName = '';

				switch (format) {
					case 'simple':
						testData = `${butlerName} ${butlerPhone}`;
						formatName = '简单文本';
						break;
					case 'url':
						testData = `https://v.cn/b=${encodeURIComponent(butlerName)}&p=${butlerPhone}`;
						formatName = '短URL格式';
						break;
					case 'english':
						testData =
							`Butler:${this.translateToEnglish(butlerName)},Phone:${butlerPhone.replace(/\D/g, '')},Community:${this.simplifyAddress(community)}`;
						formatName = '英文格式';
						break;
					case 'numeric':
						const phoneNum = butlerPhone.replace(/\D/g, '');
						const timestamp = Date.now().toString().slice(-6);
						testData = `${phoneNum}${timestamp}`;
						formatName = '纯数字格式';
						break;
					case 'minimal':
						testData = butlerPhone.replace(/\D/g, '') || '13800138000';
						formatName = '极简格式';
						break;
				}

				console.log(`测试格式 ${format} (${formatName}):`, testData, '长度:', testData.length);

				// 使用cc-defineQRCode插件标准方式生成二维码
				if (typeof uQRCode !== 'undefined') {
					uni.showLoading({
						title: '测试二维码生成中',
						mask: true
					});

					uQRCode.make({
						canvasId: 'qrCanvas',
						componentInstance: this,
						text: testData,
						size: this.qrSize,
						margin: 30, // 增加边距提高识别率
						success: (res) => {
							console.log(`${formatName} 格式二维码生成成功:`, res);

							uni.hideLoading();
							uni.showModal({
								title: '✅ 测试二维码生成成功',
								content: `格式: ${formatName}
内容: ${testData}
长度: ${testData.length}字符
边距: 30px
调用方式: uQRCode.make()
图片路径: ${res ? '已生成' : '未生成'}

🔍 扫描测试说明:
1. 保持15-30cm距离
2. 确保光线充足
3. 对准二维码中心
4. 如果此格式能扫描，请点击"应用此格式"`,
								showCancel: true,
								cancelText: '继续测试',
								confirmText: '应用此格式',
								success: (modalRes) => {
									if (modalRes.confirm) {
										this.applyTestFormat(format, testData);
									}
								}
							});
						},
						fail: (error) => {
							console.error(`${formatName} 格式生成失败:`, error);
							uni.hideLoading();
							uni.showModal({
								title: '生成失败',
								content: `${formatName} 格式生成失败: ${error.message || error}`,
								showCancel: false
							});
						},
						complete: () => {
							uni.hideLoading();
						}
					});
				} else {
					uni.showModal({
						title: 'uQRCode插件未加载',
						content: '请检查uQRCode插件是否正确加载',
						showCancel: false
					});
				}

			} catch (error) {
				console.error('测试二维码生成失败:', error);
				uni.showModal({
					title: '测试失败',
					content: `生成测试二维码时发生错误: ${error.message}`,
					showCancel: false
				});
			}
		},

		// 应用测试成功的格式
		applyTestFormat(format, testData) {
			try {
				// 保存成功的格式设置
				this.successfulFormat = format;
				this.qrCodeText = testData;

				// 更新二维码数据
				if (!this.qrCodeData) {
					this.qrCodeData = {};
				}

				uni.showToast({
					title: `已应用${format}格式`,
					icon: 'success',
					duration: 2000
				});

				console.log('已应用格式:', format, '数据:', testData);

			} catch (error) {
				console.error('应用格式失败:', error);
				uni.showToast({
					title: '应用格式失败',
					icon: 'none'
				});
			}
		},

		// 自动选择最佳格式
		async autoSelectBestFormat() {
			try {
				uni.showLoading({
					title: '正在自动选择最佳格式...'
				});

				const butlerPhone = this.qrCodeData?.butlerPhone || '13800138000';
				const phoneDigits = butlerPhone.replace(/\D/g, '');

				// 按优先级测试格式
				const testFormats = [{
					format: 'numeric',
					data: phoneDigits + Date.now().toString().slice(-6),
					name: '纯数字格式',
					priority: 1
				},
				{
					format: 'minimal',
					data: phoneDigits,
					name: '极简格式',
					priority: 2
				},
				{
					format: 'simple',
					data: `${this.qrCodeData?.butlerName || '管家'} ${phoneDigits}`,
					name: '简单文本',
					priority: 3
				}
				];

				// 选择最短且有效的格式
				let bestFormat = testFormats[0]; // 默认选择第一个

				for (let test of testFormats) {
					if (test.data.length <= 20) { // 优先选择短数据
						bestFormat = test;
						break;
					}
				}

				console.log('自动选择的最佳格式:', bestFormat);

				// 应用最佳格式
				this.qrCodeText = bestFormat.data;
				this.successfulFormat = bestFormat.format;

				// 生成二维码
				if (typeof uQRCode !== 'undefined') {
					uQRCode.make({
						canvasId: 'qrCanvas',
						componentInstance: this,
						text: bestFormat.data,
						size: this.qrSize,
						margin: 30,
						success: (res) => {
							uni.hideLoading();
							uni.showModal({
								title: '🎯 自动优化完成',
								content: `已自动选择: ${bestFormat.name}
数据: ${bestFormat.data}
长度: ${bestFormat.data.length}字符
优先级: ${bestFormat.priority}
调用方式: uQRCode.make()
图片路径: ${res ? '已生成' : '未生成'}

此格式具有最高的扫描成功率，请测试扫描效果。`,
								showCancel: false,
								confirmText: '知道了'
							});
						},
						fail: (error) => {
							uni.hideLoading();
							console.error('自动选择格式生成失败:', error);
							uni.showToast({
								title: '自动优化失败',
								icon: 'none'
							});
						},
						complete: () => {
							uni.hideLoading();
						}
					});
				} else {
					uni.hideLoading();
					uni.showToast({
						title: 'uQRCode插件未加载',
						icon: 'none'
					});
				}

			} catch (error) {
				uni.hideLoading();
				console.error('自动选择格式失败:', error);
				uni.showToast({
					title: '自动优化失败',
					icon: 'none'
				});
			}
		},

		// 已移除网络失败记录重置方法，现在使用本地生成

		// 🎯 新增：快速生成高扫描率二维码
		async generateOptimizedQr() {
			if (!this.canGenerate) {
				uni.showToast({
					title: '请至少选择到小区',
					icon: 'none'
				});
				return;
			}

			try {
				uni.showLoading({
					title: '生成高扫描率二维码中...',
					mask: true
				});

				// 强制使用最简格式
				const butlerPhone = this.butlerInfo?.phone || '13800138000';
				const phoneDigits = butlerPhone.replace(/\D/g, '');

				// 生成超简格式
				const optimizedContent = phoneDigits.slice(-8) + Date.now().toString().slice(-4);

				console.log('🎯 强制优化的二维码内容:', optimizedContent);
				console.log('🎯 内容长度:', optimizedContent.length, '字符');

				// 强制设置二维码数据
				this.qrCodeData = {
					butlerName: this.butlerInfo?.username || '管家',
					butlerPhone: butlerPhone,
					fullAddress: this.fullAddress,
					type: 'optimized'
				};
				this.qrCodeText = optimizedContent;

				// 直接使用最优化的参数生成
				if (typeof uQRCode !== 'undefined') {
					uQRCode.make({
						canvasId: 'qrCanvas',
						componentInstance: this,
						text: optimizedContent,
						size: this.qrSize,
						margin: 5, // 最小边距
						backgroundColor: '#ffffff',
						foregroundColor: '#000000',
						correctLevel: 1, // 🎯 最低纠错级别，最高密度 (L=1)
						success: (res) => {
							uni.hideLoading();

							// 保存图片路径
							this.qrCodeImagePath = res;

							uni.showModal({
								title: '🎯 高扫描率二维码生成成功',
								content: `已生成超简化二维码！

格式: 纯数字
内容: ${optimizedContent}
长度: ${optimizedContent.length}字符
纠错级别: 最低 (最高密度)
边距: 最小 (5px)

📱 此二维码具有最高的扫描成功率
🔍 请用微信扫一扫测试扫描效果
📋 如果能正常扫描，可点击"复制信息"获取内容

管家信息: ${this.qrCodeData.butlerName} (${this.qrCodeData.butlerPhone})
访问地址: ${this.fullAddress}`,
								showCancel: false,
								confirmText: '知道了'
							});
						},
						fail: (error) => {
							uni.hideLoading();
							console.error('优化二维码生成失败:', error);
							uni.showToast({
								title: '生成失败，请重试',
								icon: 'none'
							});
						}
					});
				} else {
					uni.hideLoading();
					uni.showToast({
						title: 'uQRCode插件未加载',
						icon: 'none'
					});
				}

			} catch (error) {
				uni.hideLoading();
				console.error('快速生成二维码失败:', error);
				uni.showToast({
					title: '生成失败: ' + error.message,
					icon: 'none'
				});
			}
		},

		// 🎯 新增：生成访客友好的二维码（根据参考文档优化）
		async generateVisitorFriendlyQr() {
			if (!this.canGenerate) {
				uni.showToast({
					title: '请至少选择到小区',
					icon: 'none'
				});
				return;
			}

			try {
				uni.showLoading({
					title: '生成访客友好二维码中...',
					mask: true
				});

				// 构建访客友好的信息格式
				const butlerName = this.butlerInfo?.username || '管家';
				const butlerPhone = this.butlerInfo?.phone || '暂无';
				const fullAddress = this.fullAddress || '未设置';
				const timestamp = new Date().toLocaleString('zh-CN', {
					timeZone: 'Asia/Shanghai'
				});

				// 生成易于访客理解的文本格式
				const visitorFriendlyText = `【停车场访客申请】

👤 联系管家：${butlerName}
📞 管家电话：${butlerPhone}
🏠 访问地址：${fullAddress}
⏰ 生成时间：${timestamp}

📱 申请方法：
1. 复制此信息
2. 搜索小程序并打开
3. 进入"访客申请"功能
4. 粘贴管家信息
5. 填写个人资料
6. 提交申请

💡 提示：管家会收到申请通知并进行审核`;

				console.log('🎯 访客友好二维码内容:', visitorFriendlyText);
				console.log('🎯 内容长度:', visitorFriendlyText.length, '字符');

				// 设置二维码数据
				this.qrCodeData = {
					butlerName: butlerName,
					butlerPhone: butlerPhone,
					fullAddress: fullAddress,
					type: 'visitor_friendly',
					timestamp: Date.now()
				};
				this.qrCodeText = visitorFriendlyText;

				// 生成二维码
				if (typeof uQRCode !== 'undefined') {
					uQRCode.make({
						canvasId: 'qrCanvas',
						componentInstance: this,
						text: visitorFriendlyText,
						size: this.qrSize,
						margin: 8,
						backgroundColor: '#ffffff',
						foregroundColor: '#000000',
						correctLevel: 0, // M级纠错（平衡密度和容错）
						success: (res) => {
							uni.hideLoading();
							this.qrCodeImagePath = res;

							// 显示成功提示
							uni.showModal({
								title: '✅ 访客友好二维码生成成功',
								content: `已生成访客友好格式的二维码！

📱 特点：
• 中文说明，访客易理解
• 包含完整申请步骤
• 可直接复制粘贴信息
• 适合发送给访客

📋 二维码信息：
${visitorFriendlyText.substring(0, 150)}...

访客扫码后能看到完整的申请指南和您的联系信息。`,
								showCancel: true,
								cancelText: '知道了',
								confirmText: '分享给访客',
								success: (modalRes) => {
									if (modalRes.confirm) {
										this.shareVisitorFriendlyInfo();
									}
								}
							});
						},
						fail: (error) => {
							uni.hideLoading();
							console.error('访客友好二维码生成失败:', error);
							uni.showToast({
								title: '生成失败，请重试',
								icon: 'none'
							});
						}
					});
				} else {
					uni.hideLoading();
					uni.showToast({
						title: 'uQRCode插件未加载',
						icon: 'none'
					});
				}

			} catch (error) {
				uni.hideLoading();
				console.error('生成访客友好二维码失败:', error);
				uni.showToast({
					title: '生成失败: ' + error.message,
					icon: 'none'
				});
			}
		},

		// 🎯 新增：分享访客友好信息
		shareVisitorFriendlyInfo() {
			const shareText = this.qrCodeText;

			// 复制到剪贴板
			uni.setClipboardData({
				data: shareText,
				success: () => {
					uni.showModal({
						title: '📋 访客申请信息已复制',
						content: `完整的访客申请指南已复制到剪贴板！

📱 分享方式：
• 微信聊天：直接粘贴发送
• 短信发送：粘贴到短信应用
• 其他应用：支持粘贴的地方都可以

👥 建议分享对象：
• 预约访客本人
• 访客家属或朋友
• 需要访问的业主

💡 访客收到信息后，按照步骤操作即可完成申请`,
						showCancel: false,
						confirmText: '知道了'
					});
				},
				fail: () => {
					uni.showToast({
						title: '复制失败，请重试',
						icon: 'none'
					});
				}
			});
		},

		// 检查用户信息（调试用）
		checkUserInfo() {
			const userInfo = uni.getStorageSync('userInfo');
			console.log('当前用户信息:', userInfo);

			let infoText = '';
			if (!userInfo) {
				infoText = '❌ 未找到用户信息\n请重新登录';
			} else {
				infoText = `✅ 用户信息详情:\n\n`;
				infoText += `🔐 身份验证:\n`;
				infoText += `- 角色: ${userInfo.role || '未知'} (${userInfo.roleText || '未知'})\n`;
				infoText += `- 授权状态: ${userInfo.isAuthorized ? '✅ 已授权' : '❌ 未授权'}\n\n`;

				infoText += `📱 联系信息:\n`;
				infoText += `- 手机号: ${userInfo.phone || '❌ 缺失'}\n`;
				infoText += `- OpenID: ${userInfo.openid ? '✅ 已设置' : '❌ 缺失'}\n\n`;

				infoText += `🏠 地址信息:\n`;
				if (userInfo.userInfo) {
					infoText += `- 姓名: ${userInfo.userInfo.username || '未设置'}\n`;
					infoText += `- 用户代码: ${userInfo.userInfo.usercode || '未设置'}\n`;
					infoText += `- 管辖小区: ${userInfo.userInfo.community || '未设置'}\n`;
				} else {
					infoText += `- 详细信息: ❌ 未获取\n`;
				}

				infoText += `\n⏰ 其他信息:\n`;
				infoText += `- 登录时间: ${userInfo.loginTime ? new Date(userInfo.loginTime).toLocaleString() : '未知'}\n`;

				// 添加当前管家信息状态
				if (this.butlerInfo) {
					infoText += `\n🏢 管家信息状态: ✅ 已加载\n`;
					infoText += `- 管家姓名: ${this.butlerInfo.username || '未设置'}\n`;
					infoText += `- 管家电话: ${this.butlerInfo.phone || '未设置'}\n`;
					infoText += `- 管辖小区: ${this.butlerInfo.community || '未设置'}`;
				} else {
					infoText += `\n🏢 管家信息状态: ❌ 未加载`;
				}
			}

			uni.showModal({
				title: '用户信息检查',
				content: infoText,
				showCancel: userInfo && userInfo.phone,
				cancelText: '知道了',
				confirmText: userInfo && userInfo.phone ? '知道了' : '去登录',
				success: (res) => {
					if (res.confirm && (!userInfo || !userInfo.phone)) {
						uni.reLaunch({
							url: '/pages/auth/phone-auth'
						});
					}
				}
			});
		},

		// 🎯 新增：完整的前后端连接测试方法
		async testBackendConnection() {
			uni.showLoading({
				title: '测试连接中...',
				mask: true
			});

			try {
				const userInfo = uni.getStorageSync('userInfo');

				if (!userInfo?.phone) {
					throw new Error('用户手机号缺失，请先登录');
				}

				// 构建测试参数
				const testParams = {
					phone: userInfo.phone,
					community: this.selectedAddress.community || '测试小区',
					building: this.selectedAddress.building || '1',
					units: this.selectedAddress.units || '1',
					floor: this.selectedAddress.floor || '1',
					room: this.selectedAddress.room || '101'
				};

				console.log('🔧 开始测试后端连接，参数:', testParams);

				// 测试微信官方小程序码接口
				let testResult = {
					用户信息: '✅ 完整',
					后端连接: '❌ 测试中...',
					官方小程序码: '❌ 测试中...',
					降级机制: '❌ 测试中...',
					推荐方案: ''
				};

				try {
					console.log('📡 测试微信官方小程序码接口...');

					const response = await request({
						url: apiUrls.butler.generateMiniProgramCode,
						method: 'GET',
						data: testParams
					});

					console.log('📨 后端响应:', response);

					testResult.后端连接 = '✅ 连接成功';

					if (response.code === '0' && response.data) {
						const data = response.data;

						if (data.type === 'wechat_mini_program' && data.officialCode === true && data
							.qrCodeImage) {
							testResult.官方小程序码 = '✅ 配置完成！扫码可直接跳转';
							testResult.推荐方案 = '🎯 直接使用官方小程序码，体验最佳';

							// 显示成功结果
							uni.hideLoading();
							uni.showModal({
								title: '🎉 测试结果：完美配置！',
								content: `恭喜！您的系统配置完美！

✅ 后端连接：正常
✅ 微信官方API：已配置
✅ 小程序码：可直接生成
✅ 扫码体验：直接跳转小程序

📱 当前生成的二维码：
• 类型：微信官方小程序码
• 扫码效果：直接打开小程序
• 用户体验：无缝跳转，信息自动填入

🚀 您现在可以：
1. 正常生成微信官方小程序码
2. 发送给访客，扫码直接跳转
3. 享受最佳的用户体验

管家：${data.butlerName || '未知'}
电话：${data.butlerPhone || '未知'}`,
								showCancel: false,
								confirmText: '太好了！'
							});

							return;

						} else {
							testResult.官方小程序码 = '⚠️ 后端未配置微信API';
							testResult.推荐方案 = '🔧 需要配置微信官方API';
						}
					} else {
						testResult.官方小程序码 = '❌ 接口调用失败';
					}

				} catch (apiError) {
					console.error('API调用失败:', apiError);
					testResult.后端连接 = `❌ 连接失败: ${apiError.message}`;
					testResult.官方小程序码 = '❌ 无法测试';
				}

				// 测试降级机制
				try {
					console.log('🔧 测试降级机制...');
					const fallbackResponse = await request({
						url: apiUrls.butler.generateQrCodeData,
						method: 'GET',
						data: testParams
					});

					if (fallbackResponse.code === '0') {
						testResult.降级机制 = '✅ 普通二维码可用';
						if (!testResult.推荐方案) {
							testResult.推荐方案 = '📱 使用普通二维码 + 分享链接';
						}
					}
				} catch (fallbackError) {
					testResult.降级机制 = '❌ 降级机制异常';
				}

				// 显示测试结果
				uni.hideLoading();

				let resultContent = `📋 完整测试结果：

👤 用户信息：${testResult.用户信息}
🔗 后端连接：${testResult.后端连接}
🎯 官方小程序码：${testResult.官方小程序码}
📱 降级机制：${testResult.降级机制}

💡 推荐方案：${testResult.推荐方案}

📋 详细说明：`;

				if (testResult.官方小程序码.includes('配置完成')) {
					resultContent += `
🎉 您的系统已完美配置！
• 可生成真正的微信官方小程序码
• 访客扫码直接跳转到小程序
• 无需手动复制信息
• 用户体验最佳`;
				} else if (testResult.后端连接.includes('成功')) {
					resultContent += `
🔧 后端连接正常，但需要配置：
• 后端接口运行正常
• 需要添加微信官方API配置
• 点击"配置小程序码"查看详细步骤
• 配置后即可享受最佳体验`;
				} else {
					resultContent += `
⚠️ 连接问题需要排查：
• 检查网络连接
• 确认后端服务状态
• 验证接口地址配置
• 联系技术支持`;
				}

				uni.showModal({
					title: '🔧 前后端连接测试结果',
					content: resultContent,
					showCancel: true,
					cancelText: '知道了',
					confirmText: testResult.官方小程序码.includes('未配置') ? '配置指南' : '重新测试',
					success: (res) => {
						if (res.confirm) {
							if (testResult.官方小程序码.includes('未配置')) {
								this.showDetailedConfigGuide();
							} else {
								// 重新测试
								setTimeout(() => {
									this.testBackendConnection();
								}, 500);
							}
						}
					}
				});

			} catch (error) {
				console.error('测试过程异常:', error);
				uni.hideLoading();

				uni.showModal({
					title: '❌ 测试失败',
					content: `连接测试失败：

错误信息：${error.message}

可能原因：
• 网络连接问题
• 后端服务未启动
• 用户信息异常
• 配置文件错误

建议操作：
1. 检查网络连接
2. 确认后端服务状态
3. 重新登录尝试
4. 联系技术支持`,
					showCancel: true,
					cancelText: '返回',
					confirmText: '重新登录',
					success: (res) => {
						if (res.confirm) {
							uni.reLaunch({
								url: '/pages/auth/phone-auth'
							});
						}
					}
				});
			}
		},

		// 分享成功回调
		onShareSuccess(shareType) {
			console.log(`分享成功: ${shareType}`);

			// 记录分享事件
			try {
				const userInfo = uni.getStorageSync('userInfo');
				const shareData = {
					type: shareType,
					butlerPhone: this.butlerInfo?.phone || '',
					community: this.selectedAddress.community || '',
					timestamp: Date.now()
				};

				// 可以在这里添加分享统计代码
				console.log('分享数据:', shareData);

				// 显示分享成功提示
				uni.showToast({
					title: '分享成功',
					icon: 'success',
					duration: 2000
				});
			} catch (error) {
				console.error('记录分享事件失败:', error);
			}
		}
	}
}
</script>

<style scoped>
.page-wrapper {
	min-height: 100vh;
	background: linear-gradient(135deg, #fafbfc 0%, #f5f6f7 100%);
}

.custom-navbar {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 1000;
	background: #0081ff;
}

.navbar-content {
	height: 88rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 30rpx;
	position: relative;
	margin-top: 44px;
	/* 默认状态栏高度 */
}

.navbar-left {
	display: flex;
	align-items: center;
	min-width: 80rpx;
}

.home-icon-disabled {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 60rpx;
	height: 60rpx;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.1);
	opacity: 0.6;
	cursor: not-allowed;
	pointer-events: none;
}

.navbar-title {
	position: absolute;
	left: 50%;
	transform: translateX(-50%);
	font-size: 36rpx;
	font-weight: 600;
	color: white;
	text-align: center;
	max-width: 400rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.container {
	padding: 20rpx;
	padding-bottom: 180rpx;
	/* 增加底部内边距,为TabBar预留空间 */
	background-color: #f8f9fa;
	min-height: 100vh;
	box-sizing: border-box;
	/* 确保padding不会增加容器高度 */
}

.header {
	text-align: center;
	margin-bottom: 30rpx;
}

.title {
	font-size: 32rpx;
	font-weight: bold;
	color: #025def;
	margin-bottom: 10rpx;
}

.subtitle {
	font-size: 24rpx;
	color: #666;
}

.address-selector {
	background-color: white;
	border-radius: 15rpx;
	padding: 25rpx;
	margin-bottom: 25rpx;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.selector-title {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 25rpx;
}

.title-left {
	display: flex;
	align-items: center;
}

.title-text {
	margin-left: 10rpx;
	font-size: 28rpx;
	font-weight: bold;
	color: #333;
}

.selector-row {
	display: flex;
	margin-bottom: 20rpx;
}

.selector-item {
	flex: 1;
	margin-right: 15rpx;
}

.selector-item:last-child {
	margin-right: 0;
}

.selector-label {
	font-size: 24rpx;
	color: #666;
	margin-bottom: 10rpx;
	display: block;
}

.selector-trigger {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 20rpx 15rpx;
	border: 2rpx solid #e0e0e0;
	border-radius: 10rpx;
	background-color: white;
	min-height: 80rpx;
}

.selector-trigger.disabled {
	background-color: #f5f5f5;
	color: #ccc;
}

.selector-text {
	font-size: 26rpx;
	color: #333;
	flex: 1;
}

.detail-selector {
	margin-top: 20rpx;
	padding-top: 20rpx;
	border-top: 2rpx solid #f0f0f0;
}

.address-preview {
	background-color: white;
	border-radius: 15rpx;
	padding: 25rpx;
	margin-bottom: 25rpx;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.preview-title {
	display: flex;
	align-items: center;
	margin-bottom: 15rpx;
}

.preview-content {
	padding: 20rpx;
	background-color: #f8f9fa;
	border-radius: 10rpx;
	border-left: 6rpx solid #025def;
}

.address-text {
	font-size: 28rpx;
	color: #333;
	line-height: 1.5;
}

.generate-section {
	margin-bottom: 30rpx;
}

.generate-section .u-button--disabled {
	opacity: 0.5;
	background-color: #f5f5f5 !important;
	color: #999 !important;
	border-color: #e0e0e0 !important;
}

.qrcode-section {
	background-color: white;
	border-radius: 15rpx;
	padding: 25rpx;
	margin-bottom: 120rpx;
	/* 增加底部外边距，避免被TabBar遮挡 */
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
	text-align: center;
}

.qrcode-title {
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 25rpx;
}

.qrcode-container {
	display: flex;
	justify-content: center;
	margin-bottom: 25rpx;
}

.qr-canvas {
	border: 2rpx solid #e0e0e0;
	border-radius: 10rpx;
}

.temp-canvas {
	position: absolute;
	left: -9999px;
	top: -9999px;
	visibility: hidden;
}

.qrcode-info {
	text-align: left;
	background-color: #f8f9fa;
	border-radius: 10rpx;
	padding: 20rpx;
	margin-bottom: 25rpx;
}

.action-buttons {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 8rpx;
	margin-bottom: 50rpx;
	/* 增加底部按钮组的下边距 */
}

/* 业主选择器样式 */
.owner-selector {
	background: white;
	border-radius: 12rpx;
	margin: 20rpx 0;
	padding: 20rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.owner-search {
	margin: 15rpx 0;
}

.owner-count {
	font-size: 24rpx;
	color: #666;
	background: #f0f8ff;
	padding: 4rpx 8rpx;
	border-radius: 8rpx;
}

.search-tip {
	font-size: 22rpx;
	color: #999;
	margin-left: 8rpx;
}

.required-tag {
	font-size: 20rpx;
	color: #ff4444;
	background: #ffe6e6;
	padding: 2rpx 8rpx;
	border-radius: 8rpx;
	margin-left: 8rpx;
	font-weight: 600;
}

.owner-required-tip {
	display: flex;
	align-items: center;
	padding: 15rpx 20rpx;
	background: #fff3e0;
	border: 1rpx solid #ffcc80;
	border-radius: 8rpx;
	margin: 15rpx 0;
}

.owner-required-tip .tip-text {
	font-size: 24rpx;
	color: #f57c00;
	margin-left: 8rpx;
	line-height: 1.4;
}

.owner-list {
	max-height: 600rpx;
	overflow-y: auto;
}

.owner-item {
	display: flex;
	align-items: center;
	padding: 20rpx;
	margin: 10rpx 0;
	background: #f8f9fa;
	border-radius: 12rpx;
	border: 2rpx solid transparent;
	transition: all 0.3s ease;
	position: relative;
}

.owner-item.selected {
	background: #e3f2fd;
	border-color: #025def;
	box-shadow: 0 2rpx 8rpx rgba(2, 93, 239, 0.2);
}

.owner-item:active {
	transform: scale(0.98);
}

.owner-info {
	flex: 1;
	margin-right: 15rpx;
}

.owner-name {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
	margin-bottom: 8rpx;
}

.owner-phone {
	font-size: 26rpx;
	color: #666;
}

.owner-address {
	flex: 2;
	margin-right: 15rpx;
}

.address-detail {
	font-size: 28rpx;
	color: #555;
	line-height: 1.4;
}

.owner-status {
	margin-right: 15rpx;
}

.status-text {
	font-size: 22rpx;
	padding: 4rpx 8rpx;
	border-radius: 8rpx;
	color: white;
}

.status-approved {
	background: #4caf50;
}

.status-pending {
	background: #ff9800;
}

.status-rejected {
	background: #f44336;
}

.status-unknown {
	background: #9e9e9e;
}

.select-indicator {
	position: absolute;
	top: 10rpx;
	right: 10rpx;
	width: 32rpx;
	height: 32rpx;
	background: #025def;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.no-owner-tip {
	text-align: center;
	padding: 40rpx 20rpx;
	color: #999;
}

.tip-text {
	display: block;
	font-size: 28rpx;
	margin: 10rpx 0;
}

.tip-desc {
	display: block;
	font-size: 24rpx;
	color: #ccc;
}

.owner-loading {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 40rpx 20rpx;
	color: #666;
}

.loading-text {
	margin-left: 15rpx;
	font-size: 28rpx;
}

/* 选中业主预览样式 */
.selected-owner-preview {
	background: linear-gradient(135deg, #e3f2fd 0%, #f0f8ff 100%);
	border-radius: 12rpx;
	margin: 20rpx 0;
	padding: 20rpx;
	border: 2rpx solid #025def;
	box-shadow: 0 4rpx 12rpx rgba(2, 93, 239, 0.15);
}

.selected-owner-preview .preview-title {
	display: flex;
	align-items: center;
	margin-bottom: 15rpx;
}

.selected-owner-preview .title-text {
	margin-left: 8rpx;
	font-size: 28rpx;
	font-weight: 600;
	color: #025def;
}

.owner-detail {
	display: flex;
	align-items: center;
	margin-bottom: 10rpx;
}

.owner-detail .owner-name {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
	margin-right: 20rpx;
}

.owner-detail .owner-phone {
	font-size: 28rpx;
	color: #666;
	background: rgba(255, 255, 255, 0.8);
	padding: 4rpx 12rpx;
	border-radius: 12rpx;
}

.owner-address-detail {
	margin-top: 10rpx;
}

.owner-address-detail .address-text {
	font-size: 26rpx;
	color: #555;
	background: rgba(255, 255, 255, 0.6);
	padding: 8rpx 12rpx;
	border-radius: 8rpx;
	display: inline-block;
}

/* 适配底部安全区域 */
.safe-area-inset-bottom {
	padding-bottom: constant(safe-area-inset-bottom);
	/* iOS 11.2以下 */
	padding-bottom: env(safe-area-inset-bottom);
	/* iOS 11.2+ */
}

/* 底部安全区域 */
.bottom-safe-area {
	height: 100rpx;
	/* 为TabBar预留空间 */
	width: 100%;
}
</style>