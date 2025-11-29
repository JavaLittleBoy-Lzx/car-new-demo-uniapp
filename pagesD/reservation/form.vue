<template>
	<view class="u-page">
		<u-swiper class="swiper case" :autoplay="true" circular :list="list1" indicator height="368rpx"
			indicatorMode="dot" @click="click"></u-swiper>
		<view class="name">
			<text class="name-css">{{ parkingLotInfo.fullName }}</text>
			<!-- <view class="name-button"><u-button icon="map" iconColor="#fff" text="到这里去" color="#0685f9"
					customStyle="border-radius: 10px; height: 35px"></u-button>
			</view> -->
			<view class="name-small">
				<tui-icon name="position" size="15" color="#d8dbda"></tui-icon>
				<text class="name-small-text">{{ parkingLotInfo.fullAddress }}</text>
			</view>
			<view class="address-detail" v-if="parkingLotInfo.buildingInfo">
				<tui-icon name="home" size="15" color="#d8dbda"></tui-icon>
				<text class="address-detail-text">{{ parkingLotInfo.buildingInfo }}</text>
			</view>
		</view>
		<view class="centre_vie">
			<!-- 注意，如果需要兼容微信小程序，最好通过setRules方法设置rules规则 -->
			<u--form borderBottom="false" labelPosition="top" :model="model1" ref="form1">
				<!-- 横向排列容器 -->
				<u-form-item label="预约时间" labelWidth="90" leftIcon="clock" :labelStyle="{ 'font-weight': '700' }"
					:leftIconStyle="{ 'color': '#025def' }" prop="userInfo.name" borderBottom="false"
					class="time-picker-container"> <!-- 新增容器类名 -->
					<view class="time-grid"> <!-- 横向排列容器 -->
						<view v-for="(date, index) in dates" :key="index"
							:class="['time-block', { 'active': activeDate === index }]" @tap="selectDate(index)">
							<view class="date-day">{{ date.day }}</view>
							<view class="date-week">{{ date.week }}</view>
						</view>
					</view>
				</u-form-item>
				<u-form-item label="预约时段" labelWidth="90" leftIcon="clock-fill" :labelStyle="{ 'font-weight': '700' }"
					:leftIconStyle="{ 'color': '#025def' }" borderBottom="false" v-if="activeDate >= 0"
					class="time-slot-container">
					<view class="time-slot-wrapper">
						<!-- 第一行时间段 -->
						<view class="time-slot-row">
							<view v-for="(slot, index) in timeSlots.slice(0, 4)" :key="index"
								:class="['time-slot-block', { 'active': activeTimeSlot === index }]"
								@tap="selectTimeSlot(index)">
								<text class="slot-text">{{ slot.label }}</text>
							</view>
						</view>
						<!-- 第二行时间段 -->
						<view class="time-slot-row">
							<view v-for="(slot, index) in timeSlots.slice(4)" :key="'slot-' + (index + 4)"
								:class="['time-slot-block', { 'active': activeTimeSlot === (index + 4) }]"
								@tap="selectTimeSlot(index + 4)">
								<text class="slot-text">{{ slot.label }}</text>
							</view>
						</view>
					</view>
				</u-form-item>


				<u-form-item :label="phoneLabel" prop="code" leftIcon="phone-fill" labelPosition="left"
					:leftIconStyle="{ 'color': '#025def' }" labelWidth="90" borderBottom="false">
					<u--input v-model="model1.code" :disabled="true" :disabledColor="'#f8f9fa'" border="none"
						:placeholder="phonePlaceholder" type="number"></u--input>
				</u-form-item>
				<u-form-item :label="reasonLabel" prop="reason" leftIcon="question-circle-fill" labelPosition="left"
					:leftIconStyle="{ 'color': '#025def' }" labelWidth="90" borderBottom="false" ref="item1">
					<u--input v-model="model1.reason" disabledColor="#ffffff" :placeholder="reasonPlaceholder"
						border="none" class="form-u-input"></u--input>
					<u-button slot="right" @click="showreason = true; hideKeyboard()" :text="reasonButtonText"
						type="primary" size="mini" class="u-button-solt"></u-button>
				</u-form-item>
			</u--form>
			<u-action-sheet :show="showreason" :actions="actions" :title="actionSheetTitle"
				:description="actionSheetDescription" @close="showreason = false" @select="reasonSelect($event)">
			</u-action-sheet>
		</view>
		<view class="centre_vie2">
			<view class="title-name">预约车牌号</view>

			<!-- 业主月票车牌选择 -->
			<view v-if="currentUserRole === 'owner'" class="monthly-ticket-section">
				<view class="monthly-ticket-title">
					<tui-icon name="car" size="16" color="#025def"></tui-icon>
				</view>

				<!-- 有月票车牌时显示选择器 -->
				<view v-if="monthlyTicketPlates.length > 0" class="monthly-ticket-selector">
					<view class="monthly-select-trigger" :class="{ 'has-selection': selectedMonthlyPlate }"
						@click="openMonthlyPicker">
						<text class="select-text">{{ selectedMonthlyPlate || '请选择月票车牌' }}</text>
						<tui-icon name="down" size="14" color="#999"></tui-icon>
					</view>
					<view class="monthly-ticket-tips">
						<text class="tips-text">💡 检测到 {{ monthlyTicketPlates.length }} 个月票车牌，您可以直接选择使用</text>
					</view>
				</view>

				<!-- 加载状态 -->
				<view v-if="isLoadingMonthlyTicket" class="loading-monthly-section">
					<view class="loading-content">
						<u-loading-icon color="#025def" size="16"></u-loading-icon>
						<text class="loading-text">正在查询月票信息...</text>
					</view>
				</view>

				<!-- 查询失败或无数据时显示 -->
				<view v-if="!isLoadingMonthlyTicket && monthlyTicketPlates.length === 0" class="monthly-empty-section">
					<view class="empty-content">
						<tui-icon name="info" size="16" color="#ff9500"></tui-icon>
						<text class="empty-text">
							{{ monthlyTicketError || '未找到月票车牌信息' }}
						</text>
						<view class="retry-button" @click="loadMonthlyTicketInfo">
							<text class="retry-text">重新查询</text>
						</view>
					</view>
				</view>

				<!-- 月票车牌选择器 -->
				<u-picker ref="monthlyPicker" :show="showMonthlyPicker" :columns="monthlyPickerColumns"
					@close="showMonthlyPicker = false" @cancel="showMonthlyPicker = false"
					@confirm="onMonthlyPlateConfirm" :closeOnClickOverlay="true" :defaultIndex="[0]">
				</u-picker>
			</view>

			<view class="button-car" :style="{ background: carColor }">
				<view class="car-view" :style="{
					'--border-bg-color': borderBgColor
				}">
					<xm-keyboard-input-v1 :plateType="plateType" :dynamicWidth="dynamicWidth" ref="keyboardInputDisplay"
						v-if="carMax" :max="maxCarLenght" :showPointer="true"
						:values="displayPlateChars"></xm-keyboard-input-v1>
					<xm-keyboard-input-v1 :plateType="plateType" :dynamicWidth="dynamicWidth" ref="keyboardInputDisplay"
						v-if="carMax == false" :max="maxCarLenght" :showPointer="true"
						:values="displayPlateChars"></xm-keyboard-input-v1>
				</view>
			</view>
			<view class="color-car-button">
				<view class="blue-car"
					:class="{ selected: selectedColor === 'linear-gradient(to bottom, #216fef, #0c4fc5)' }">
					<view class="blue-car-text" @click="changeColor('linear-gradient(to bottom, #216fef, #0c4fc5)')">蓝牌
					</view>
				</view>
				<view class="yellow-car"
					:class="{ selected: selectedColor === 'linear-gradient(to bottom, #f8c401, #dba700)' }">
					<view class="yellow-car-text" @click="changeColor('linear-gradient(to bottom, #f8c401, #dba700)')">
						黄牌</view>
				</view>
				<view class="white-car"
					:class="{ selected: selectedColor === 'linear-gradient(to bottom, #f5f5f5, #e0e0e0)' }">
					<view class="white-car-text" @click="changeColor('linear-gradient(to bottom, #f5f5f5, #e0e0e0)')">白牌
					</view>
				</view>
				<view class="black-car"
					:class="{ selected: selectedColor === 'linear-gradient(to bottom, #525252, #1e1e1e)' }">
					<view class="black-car-text" @click="changeColor('linear-gradient(to bottom, #525252, #1e1e1e)')">黑牌
					</view>
				</view>
				<view class="green-car"
					:class="{ selected: selectedColor === 'linear-gradient(to bottom, #d0f1e4, #6ad390)' }">
					<view class="green-car-text" @click="changeColor('linear-gradient(to bottom, #d0f1e4, #6ad390)')">
						新能源</view>
				</view>
			</view>
			<u-gap height="1" bgColor="#bbb" marginBottom="10" marginTop="20"></u-gap>
			<view class="car-number">请输入车牌号码</view>
			<view class="xm-keyboard-v2">
				<view @click="isShow = true" style="margin-left: 5px; width: 340px;">
					<xm-keyboard-input ref="keyboardInput" @change="inputChange" v-if="carMax" :cursor="true"
						:max="maxCarLenght" :showPointer="true" :values="displayPlateChars"></xm-keyboard-input>
					<xm-keyboard-input ref="keyboardInput" @change="inputChange" v-if="carMax == false" :cursor="true"
						:max="maxCarLenght" :showPointer="true" :values="displayPlateChars"></xm-keyboard-input>
				</view>
				<xm-popup :show="isShow" @close="keyboardClosed" background="#d4d5d9" :showContent="showContent">
					<view class="keyboard-preview" v-if="isShow">
						<view class="preview-title">当前输入的车牌号码</view>
						<view class="preview-car-plate" :style="{ background: carColor, borderColor: borderBgColor }">
							<view class="preview-plate-text" :style="{ color: textColor }">
								<text v-for="(item, index) in displayPlateChars" :key="index" class="plate-char"
									:style="{ color: textColor }">
									{{ item || ' ' }}
								</text>
							</view>
						</view>
					</view>
					<xm-keyboard-box ref="keyboardBox" :showChangeBtn="true" :showCancelBtn="!showContent"
						@add="inputAdd" @del="inputDel" @clear="inputClear" @cancel="keyboardClosed"
						@confirm="toConfirm"></xm-keyboard-box>
				</xm-popup>
			</view>
			<view class="name-button-submit"><u-button iconColor="#fff" text="提  交" color="#0685f9"
					customStyle="border-radius: 10px; height: 35px" @click="submit"></u-button>
			</view>
		</view>

		<!-- 自定义TabBar -->
		<custom-tabbar :userRole="currentUserRole" @tabChange="onTabChange">
		</custom-tabbar>
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
				currentUserRole: 'owner', // 默认业主角色
				activeDate: -1,
				activeTimeSlot: -1, // 当前选中的时间段
				dates: this.getNextFourDays(),
				timeSlots: [{
						label: '08:00-10:00',
						value: '08:00:00',
						endValue: '10:00:00'
					},
					{
						label: '10:00-12:00',
						value: '10:00:00',
						endValue: '12:00:00'
					},
					{
						label: '12:00-14:00',
						value: '12:00:00',
						endValue: '14:00:00'
					},
					{
						label: '14:00-16:00',
						value: '14:00:00',
						endValue: '16:00:00'
					},
					{
						label: '16:00-18:00',
						value: '16:00:00',
						endValue: '18:00:00'
					},
					{
						label: '18:00-20:00',
						value: '18:00:00',
						endValue: '20:00:00'
					},
					{
						label: '20:00-22:00',
						value: '20:00:00',
						endValue: '22:00:00'
					}
				],
				// 停车场信息
				parkingLotInfo: {
					fullName: '哈尔滨四季上东-停车场',
					fullAddress: '黑龙江省哈尔滨市香坊区和平路115号',
					buildingInfo: ''
				},
				dynamicWidth: 25,
				borderBgColor: "#fff",
				plateType: "default",
				currentCursor: 0,
				maxCarLenght: 7,
				carMax: true,
				carIndex: 0,
				inputValue: '',
				value: '京A11223',
				carColor: 'linear-gradient(to bottom, #216fef, #0c4fc5)',
				selectedColor: 'linear-gradient(to bottom, #216fef, #0c4fc5)',
				isColorChanged1: false,
				isColorChanged2: false,
				isColorChanged3: false,
				isColorChanged4: false,
				showActionSheet: false,
				isShow: false,
				itemList: [{
					text: "评论",
					color: "#2B2B2B"
				}, {
					text: "分享",
					color: "#2B2B2B"
				}],

				checkboxs: [{
						checked: true,
					},
					{
						checked: false,
					},
					{
						checked: false,
					},
				],
				fileList1: [],
				list1: [
					// '/static/coolc/parking1.jpg',
					// '/static/coolc/parking2.jpg',
					'/static/coolc/background.jpg',
				],
				disabled1: false,
				tips: '',
				showCalendar: false,
				showBirthday: false,
				model1: {
					reason: '',
					radiovalue1: '苹果',
					checkboxValue1: [],
					intro: '',
					code: ''
				},
				showreason: false,
				birthday: Number(new Date()),
				actions: [{
						name: '探亲访友'
					},
					{
						name: '商务拜访'
					},
					{
						name: '上门服务'
					},
					{
						name: '快递配送'
					},
					{
						name: '其他事务'
					}
				],
				rules: {
					'userInfo.name': [{
						type: 'string',
						required: true,
						message: '请填写姓名',
						trigger: ['blur', 'change']
					}, {
						validator: (rule, value, callback) => {
							return uni.$u.test.chinese(value);
						},
						message: "姓名必须为中文",
						trigger: ["change", "blur"],
					}],
					code: {
						type: 'number',
						required: true,
						len: 11,
						message: '请填写11位手机号码',
						trigger: ['blur']
					},
					'userInfo.reason': {
						type: 'string',
						max: 1,
						required: true,
						message: '请选择来访原因',
						trigger: ['blur', 'change']
					},
					radiovalue1: {
						type: 'string',
						min: 1,
						max: 2,
						message: '橙子有毒',
						trigger: ['change']
					},
					checkboxValue1: {
						type: 'array',
						min: 2,
						required: true,
						message: '不能太宅，至少选两项',
						trigger: ['change']
					},
					intro: {
						type: 'string',
						min: 3,
						required: true,
						message: '不低于3个字',
						trigger: ['change']
					},
					hotel: {
						type: 'string',
						min: 2,
						required: true,
						message: '请选择住店时间',
						trigger: ['change']
					},
					'userInfo.birthday': {
						type: 'string',
						required: true,
						message: '请选择生日',
						trigger: ['change']
					},
				},
				radiolist1: [{
						name: '苹果',
						disabled: false
					},
					{
						name: '香蕉',
						disabled: false
					},
					{
						name: '毒橙子',
						disabled: false
					}
				],
				checkboxList1: [{
						name: '羽毛球',
						disabled: false
					},
					{
						name: '跑步',
						disabled: false
					},
					{
						name: '爬山',
						disabled: false
					}
				],
				currentPlateChars: ['', '', '', '', '', '', '', ''],
				textColor: '#fff',

				// 月票车牌相关数据
				isLoadingMonthlyTicket: false,
				monthlyTicketPlates: [],
				monthlyTicketOptions: [],
				monthlyPickerColumns: [
					[]
				],
				selectedMonthlyPlate: '',
				monthlyTicketError: '',
				monthlyPlaceholder: '请选择月票车牌',
				showMonthlyPicker: false,

				// 二维码信息
				qrCodeInfo: null
			}
		},
		async onLoad(options) {
			// 处理二维码扫描参数
			await this.handleQrCodeParams(options);

			// 获取用户角色
			await this.getUserRole();

			// 监听TabBar状态更新事件
			uni.$on('updateTabBarIndex', (index) => {
				// TabBar状态更新
			});
		},
		async onShow() {
			// 重新获取用户角色和电话号码（角色可能发生变化）
			await this.getUserRole();

			// 页面显示时通知TabBar检查当前页面
			this.$nextTick(() => {
				uni.$emit('syncTabBarState');
			});

			// 确保业主角色时加载月票信息（每次显示页面时都刷新）
			if (this.currentUserRole === 'owner') {
				console.log('🎫 页面显示时重新加载月票信息');
				await this.loadMonthlyTicketInfo();
			}
		},
		onUnload() {
			// 清理事件监听
			uni.$off('updateTabBarIndex');
		},
		onReady() {
			this.$refs.form1.setRules(this.rules);
			// 初始化车牌字符数组
			this.initPlateCharsArray();

			// 延迟检查是否需要自动选择月票车牌（防止时序问题）
			setTimeout(() => {
				if (this.currentUserRole === 'owner' &&
					this.monthlyTicketPlates.length > 0 &&
					!this.selectedMonthlyPlate) {
					console.log('🎯 onReady中补充触发月票车牌自动选择');
					this.autoSelectFirstPlate();
				}
			}, 500);
		},
		computed: {
			isreasonSelected() {
				return this.model1.reason == '';
			},
			displayPlateChars() {
				// 确保数组长度正确
				if (this.currentPlateChars.length !== this.maxCarLenght) {
					// 创建正确长度的数组
					const correctLengthArray = new Array(this.maxCarLenght).fill('');
					// 复制现有字符
					for (let i = 0; i < Math.min(this.currentPlateChars.length, this.maxCarLenght); i++) {
						correctLengthArray[i] = this.currentPlateChars[i] || '';
					}
					return correctLengthArray;
				}

				// 检查是否有输入内容
				const hasInput = this.currentPlateChars.some(char => char !== '');

				// 如果没有输入内容，尝试从输入组件获取
				if (!hasInput && this.$refs.keyboardInput && this.$refs.keyboardInput.values) {
					const inputValues = this.$refs.keyboardInput.values || [];
					// 创建正确长度的数组并填充
					const result = new Array(this.maxCarLenght).fill('');
					for (let i = 0; i < Math.min(inputValues.length, this.maxCarLenght); i++) {
						result[i] = inputValues[i] || '';
					}
					return result;
				}

				return this.currentPlateChars;
			},
			// 根据角色显示不同的标签文本
			phoneLabel() {
				const labels = {
					'visitor': '访客电话',
					'owner': '业主电话',
					'manager': '联系电话'
				};
				return labels[this.currentUserRole] || '联系电话';
			},
			phonePlaceholder() {
				const placeholders = {
					'visitor': '访客登录电话（自动获取）',
					'owner': '业主电话（自动获取）',
					'manager': '管家电话（自动获取）'
				};
				return placeholders[this.currentUserRole] || '登录电话（自动获取）';
			},
			reasonLabel() {
				const labels = {
					'visitor': '来访原因',
					'owner': '预约原因',
					'manager': '预约类型'
				};
				return labels[this.currentUserRole] || '预约原因';
			},
			reasonPlaceholder() {
				const placeholders = {
					'visitor': '请选择来访原因',
					'owner': '请选择预约原因',
					'manager': '请选择预约类型'
				};
				return placeholders[this.currentUserRole] || '请选择原因';
			},
			reasonButtonText() {
				const buttonTexts = {
					'visitor': '原因查询',
					'owner': '原因查询',
					'manager': '类型查询'
				};
				return buttonTexts[this.currentUserRole] || '选项查询';
			},
			actionSheetTitle() {
				const titles = {
					'visitor': '请选择来访原因',
					'owner': '请选择预约原因',
					'manager': '请选择预约类型'
				};
				return titles[this.currentUserRole] || '请选择原因';
			},
			actionSheetDescription() {
				const descriptions = {
					'visitor': '请选择您本次来访的主要原因',
					'owner': '请选择您本次预约的原因',
					'manager': '请选择您本次预约的类型'
				};
				return descriptions[this.currentUserRole] || '如果选择其他可以自行输入';
			}
		},
		methods: {
			// 初始化车牌字符数组
			initPlateCharsArray() {
				console.log('🚀 初始化车牌字符数组，当前maxCarLenght:', this.maxCarLenght);

				// 根据当前车牌长度设置初始数组
				if (this.maxCarLenght === 8) {
					this.currentPlateChars = new Array(8).fill('');
					console.log('✅ 初始化为8位新能源车牌');
				} else {
					this.currentPlateChars = new Array(7).fill('');
					console.log('✅ 初始化为7位传统车牌');
				}

				console.log('🚀 初始化完成，currentPlateChars:', this.currentPlateChars);
			},

			// 处理二维码扫描参数
			async handleQrCodeParams(options) {
				try {
					console.log('🔍 处理页面参数:', options);

					// 处理微信小程序码的scene参数
					if (options && options.scene) {
						console.log('📱 检测到微信小程序码scene参数:', options.scene);
						await this.handleWechatMiniProgramScene(options.scene);
						return;
					}

					// 检查是否有二维码数据（其他二维码类型）
					if (options && options.data) {
						let qrData;
						try {
							// 尝试解析JSON数据
							qrData = JSON.parse(decodeURIComponent(options.data));
							console.log('📱 解析的二维码数据:', qrData);
						} catch (error) {
							console.log('❌ 解析二维码数据失败:', error);
							return;
						}

						// 检查是否是管家预约二维码
						if (qrData.type === 'butler_reservation') {
							console.log('🎯 检测到管家预约二维码');

							// 显示二维码信息提示
							uni.showModal({
								title: '管家邀请预约',
								content: `您正在通过管家 ${qrData.butlerName} 的邀请进行预约\n\n预约地址：${qrData.fullAddress}\n管家电话：${qrData.butlerPhone}`,
								showCancel: false,
								confirmText: '知道了'
							});

							// 预填地址信息
							if (qrData.addressInfo) {
								this.presetAddressFromQrCode(qrData.addressInfo);
							}

							// 预设管家联系方式（可选）
							if (qrData.butlerPhone) {
								this.model1.code = qrData.butlerPhone;
							}

							// 保存二维码信息用于后续提交
							this.qrCodeInfo = {
								butlerId: qrData.butlerId,
								butlerName: qrData.butlerName,
								butlerPhone: qrData.butlerPhone,
								fullAddress: qrData.fullAddress,
								addressInfo: qrData.addressInfo
							};
						}
					}

					// 检查其他URL参数
					if (options && options.type === 'butler_reservation') {
						console.log('🎯 检测到管家预约URL参数');
						// 处理直接的URL参数（备用方案）
					}

				} catch (error) {
					console.error('❌ 处理二维码参数失败:', error);
				}
			},

			// 处理微信小程序码的scene参数
			async handleWechatMiniProgramScene(scene) {
				try {
					console.log('🎯 处理微信小程序码scene参数:', scene);

					// 解析scene参数（格式：bp=手机号&c=地区&t=时间戳）
					const sceneParams = this.parseSceneParams(scene);
					console.log('📝 解析的scene参数:', sceneParams);

					if (sceneParams.bp) {
						// 通过手机号查询管家信息
						await this.loadButlerInfoByPhone(sceneParams.bp, sceneParams.c);
					} else {
						console.log('⚠️ scene参数中未找到管家手机号');
						uni.showToast({
							title: '二维码参数错误',
							icon: 'none'
						});
					}

				} catch (error) {
					console.error('❌ 处理微信小程序码scene失败:', error);
				}
			},

			// 解析scene参数
			parseSceneParams(scene) {
				const params = {};
				try {
					const pairs = scene.split('&');
					pairs.forEach(pair => {
						const [key, value] = pair.split('=');
						if (key && value) {
							params[key] = decodeURIComponent(value);
						}
					});
				} catch (error) {
					console.error('❌ 解析scene参数失败:', error);
				}
				return params;
			},

			// 通过手机号查询管家信息
			async loadButlerInfoByPhone(phoneShort, community) {
				try {
					console.log('🔍 通过手机号查询管家:', phoneShort, community);

					// 显示加载提示
					uni.showLoading({
						title: '正在查询管家信息...'
					});

					// 构建完整手机号（如果只有后8位）
					let searchPhones = [phoneShort];
					if (phoneShort.length === 8) {
						// 添加常见前缀进行搜索
						searchPhones = [
							'130' + phoneShort.substring(0, 8),
							'131' + phoneShort.substring(0, 8),
							'132' + phoneShort.substring(0, 8),
							'133' + phoneShort.substring(0, 8),
							'134' + phoneShort.substring(0, 8),
							'135' + phoneShort.substring(0, 8),
							'136' + phoneShort.substring(0, 8),
							'137' + phoneShort.substring(0, 8),
							'138' + phoneShort.substring(0, 8),
							'139' + phoneShort.substring(0, 8),
							'147' + phoneShort.substring(0, 8),
							'150' + phoneShort.substring(0, 8),
							'151' + phoneShort.substring(0, 8),
							'152' + phoneShort.substring(0, 8),
							'153' + phoneShort.substring(0, 8),
							'155' + phoneShort.substring(0, 8),
							'156' + phoneShort.substring(0, 8),
							'157' + phoneShort.substring(0, 8),
							'158' + phoneShort.substring(0, 8),
							'159' + phoneShort.substring(0, 8),
							'180' + phoneShort.substring(0, 8),
							'181' + phoneShort.substring(0, 8),
							'182' + phoneShort.substring(0, 8),
							'183' + phoneShort.substring(0, 8),
							'184' + phoneShort.substring(0, 8),
							'185' + phoneShort.substring(0, 8),
							'186' + phoneShort.substring(0, 8),
							'187' + phoneShort.substring(0, 8),
							'188' + phoneShort.substring(0, 8),
							'189' + phoneShort.substring(0, 8)
						];
					}

					// 调用API查询管家
					const {
						butlerAPI
					} = require('@/config/api.js');
					let butlerInfo = null;

					// 尝试查询每个可能的手机号
					for (const phone of searchPhones) {
						try {
							const result = await butlerAPI.getByPhone(phone);
							if (result && result.data && result.code === '0') {
								butlerInfo = result.data;
								console.log('✅ 找到管家信息:', butlerInfo);
								break;
							}
						} catch (err) {
							// 继续尝试下一个号码
							console.log('⏭️ 号码查询失败，尝试下一个:', phone);
						}
					}

					uni.hideLoading();

					if (butlerInfo) {
						// 显示管家信息提示
						const communityInfo = butlerInfo.community || community || '该区域';
						uni.showModal({
							title: '管家邀请预约',
							content: `您正在通过管家 ${butlerInfo.username} 的邀请进行预约\n\n服务区域：${communityInfo}\n管家电话：${butlerInfo.phone}`,
							showCancel: false,
							confirmText: '知道了'
						});

						// 预设地址信息
						this.presetAddressFromButlerInfo(butlerInfo);

						// 保存二维码信息用于后续提交
						this.qrCodeInfo = {
							butlerId: butlerInfo.id,
							butlerName: butlerInfo.username,
							butlerPhone: butlerInfo.phone,
							community: butlerInfo.community,
							province: butlerInfo.province,
							city: butlerInfo.city,
							district: butlerInfo.district
						};
					} else {
						console.log('❌ 未找到管家信息');
						uni.showModal({
							title: '提示',
							content: '未找到对应的管家信息，您可以继续正常预约',
							showCancel: false,
							confirmText: '知道了'
						});
					}

				} catch (error) {
					console.error('❌ 查询管家信息失败:', error);
					uni.hideLoading();
					uni.showToast({
						title: '查询管家信息失败',
						icon: 'none'
					});
				}
			},

			// 从管家信息预设地址
			presetAddressFromButlerInfo(butlerInfo) {
				try {
					console.log('🏠 从管家信息预设地址:', butlerInfo);

					// 构建停车场信息
					let fullName = '';
					let fullAddress = '';

					// 构建停车场名称
					if (butlerInfo.city && butlerInfo.community) {
						fullName = `${butlerInfo.city}${butlerInfo.community}-停车场`;
					} else if (butlerInfo.community) {
						fullName = `${butlerInfo.community}-停车场`;
					}

					// 构建完整地址
					if (butlerInfo.province) fullAddress += butlerInfo.province;
					if (butlerInfo.city) fullAddress += butlerInfo.city;
					if (butlerInfo.district) fullAddress += butlerInfo.district;
					if (butlerInfo.community) fullAddress += butlerInfo.community;

					// 更新停车场信息
					this.parkingLotInfo = {
						fullName: fullName || this.parkingLotInfo.fullName,
						fullAddress: fullAddress || this.parkingLotInfo.fullAddress,
						buildingInfo: this.parkingLotInfo.buildingInfo
					};

					console.log('✅ 地址信息已更新:', this.parkingLotInfo);

				} catch (error) {
					console.error('❌ 预设地址信息失败:', error);
				}
			},

			// 从二维码预设地址信息
			presetAddressFromQrCode(addressInfo) {
				try {
					console.log('🏠 预设地址信息:', addressInfo);

					// 构建停车场信息
					let fullName = '';
					let fullAddress = '';
					let buildingInfo = '';

					// 构建停车场名称
					if (addressInfo.city && addressInfo.community) {
						fullName = `${addressInfo.city}${addressInfo.community}-停车场`;
					}

					// 构建完整地址
					if (addressInfo.province) fullAddress += addressInfo.province;
					if (addressInfo.city) fullAddress += addressInfo.city;
					if (addressInfo.district) fullAddress += addressInfo.district;
					if (addressInfo.community) fullAddress += addressInfo.community;

					// 构建楼栋信息
					if (addressInfo.building) {
						buildingInfo = `${addressInfo.building}栋`;
						if (addressInfo.units) {
							buildingInfo += `${addressInfo.units}单元`;
						}
						if (addressInfo.floor) {
							buildingInfo += `${addressInfo.floor}层`;
						}
					}

					// 更新停车场信息
					this.parkingLotInfo = {
						fullName: fullName || this.parkingLotInfo.fullName,
						fullAddress: fullAddress || this.parkingLotInfo.fullAddress,
						buildingInfo: buildingInfo || this.parkingLotInfo.buildingInfo
					};

					console.log('✅ 地址信息已更新:', this.parkingLotInfo);

				} catch (error) {
					console.error('❌ 预设地址信息失败:', error);
				}
			},

			// 获取用户角色和电话号码
			async getUserRole() {
				try {
					const userInfo = uni.getStorageSync('userInfo');

					// 获取角色
					if (userInfo && userInfo.role) {
						this.currentUserRole = userInfo.role;
					} else if (userInfo && userInfo.userInfo && userInfo.userInfo.userkind) {
						this.currentUserRole = userInfo.userInfo.userkind;
					} else {
						this.currentUserRole = 'owner';
					}

					// 获取电话号码
					let phone = '';
					if (userInfo && userInfo.phone) {
						phone = userInfo.phone;
					} else if (userInfo && userInfo.userInfo && userInfo.userInfo.phone) {
						phone = userInfo.userInfo.phone;
					}

					if (phone) {
						this.model1.code = phone;
					}

					// 更新来访原因选项
					this.updateReasonOptions();

					// 更新停车场信息
					await this.updateParkingLotInfo(userInfo);

					// 如果是业主角色，立即加载月票信息
					if (this.currentUserRole === 'owner') {
						console.log('🎫 业主角色确认，开始加载月票信息');
						await this.loadMonthlyTicketInfo();
					}

				} catch (error) {
					console.error('获取用户信息失败:', error);
					this.currentUserRole = 'owner';
				}
			},



			// 调用预约API
			async callAppointmentAPI(appointmentData) {
				try {
					const {
						appointmentAPI
					} = require('@/config/api.js');

					// 调用后端预约接口
					const result = await appointmentAPI.create(appointmentData);

					// 检查响应结果
					if (result && result.success !== false) {
						return {
							success: true,
							message: '预约成功',
							data: result
						};
					} else {
						throw new Error(result?.msg || result?.message || '预约失败');
					}
				} catch (error) {
					console.error('API调用失败:', error);
					throw error;
				}
			},
			reset() {
				const validateList = ['userInfo.name', 'userInfo.reason', 'radiovalue1', 'checkboxValue1', 'intro',
					'hotel', 'code', 'userInfo.birthday'
				]
				this.$refs.form1.resetFields()
				this.$refs.form1.clearValidate()
				setTimeout(() => {
					this.$refs.form1.clearValidate(validateList)
					// 或者使用 this.$refs.form1.clearValidate()
				}, 10)
			},
			hideKeyboard() {
				uni.hideKeyboard()
			},
			radioClick(name) {
				this.radios.map((item, index) => {
					item.checked = index === name ? true : false;
				});
			},
			checkboxClick(name) {
				this.checkboxs[name].checked = !this.checkboxs[name].checked;
			},
			colorChange1() {
				this.isColorChanged1 = !this.isColorChanged1;
			},
			colorChange2() {
				this.isColorChanged2 = !this.isColorChanged2;
			},
			colorChange3() {
				this.isColorChanged3 = !this.isColorChanged3;
			},
			colorChange4() {
				this.isColorChanged4 = !this.isColorChanged4;
			},

			openActionSheet() {
				this.showActionSheet = true;
			},
			itemClick(e) {
				let index = e.index;
				this.closeActionSheet();
			},
			closeActionSheet() {
				this.showActionSheet = false;
			},
			changeColor(color) {
				console.log('🎨 切换车牌颜色:', color);

				this.carColor = color;
				this.selectedColor = color;

				if (color == 'linear-gradient(to bottom, #d0f1e4, #6ad390)') {
					console.log('🔋 切换到新能源车牌');
					this.carMax = false;
					this.maxCarLenght = 8;
					this.plateType = "newEnergy";
					this.borderBgColor = "#000";
					this.dynamicWidth = 22;
					this.textColor = '#000';
				} else {
					console.log('⛽ 切换到传统车牌');
					this.carMax = true;
					this.maxCarLenght = 7;
					this.dynamicWidth = 25;
					if (color == 'linear-gradient(to bottom, #216fef, #0c4fc5)') {
						this.plateType = "blue";
						this.borderBgColor = "#fff";
						this.textColor = '#fff';
					} else if (color == 'linear-gradient(to bottom, #f8c401, #dba700)') {
						this.plateType = "yellow";
						this.borderBgColor = "#000";
						this.textColor = '#000';
					} else if (color == 'linear-gradient(to bottom, #f5f5f5, #e0e0e0)') {
						this.plateType = "white";
						this.borderBgColor = "#000";
						this.textColor = '#000';
					} else if (color == 'linear-gradient(to bottom, #525252, #1e1e1e)') {
						this.plateType = "black";
						this.borderBgColor = "#fff";
						this.textColor = '#fff';
					}
				}

				// 等待DOM更新后处理车牌字符数组
				this.$nextTick(() => {
					console.log('📝 DOM更新后，当前maxCarLenght:', this.maxCarLenght);

					// 调整车牌字符数组长度
					this.adjustPlateCharsLength();

					// 更新显示
					this.updateCurrentPlateChars();

					console.log('✅ 车牌类型切换完成，currentPlateChars:', this.currentPlateChars);
				});
			},

			// 调整车牌字符数组长度
			adjustPlateCharsLength() {
				console.log('📏 调整车牌字符数组长度，目标长度:', this.maxCarLenght);
				console.log('📏 当前数组:', this.currentPlateChars);

				const oldChars = [...this.currentPlateChars];

				// 根据新的长度创建新数组
				if (this.maxCarLenght === 8) {
					// 新能源车牌8位
					this.currentPlateChars = new Array(8).fill('');
				} else {
					// 传统车牌7位
					this.currentPlateChars = new Array(7).fill('');
				}

				// 保留原有字符（在新长度范围内）
				for (let i = 0; i < Math.min(oldChars.length, this.currentPlateChars.length); i++) {
					if (oldChars[i] && oldChars[i] !== '') {
						this.currentPlateChars[i] = oldChars[i];
					}
				}

				// 如果从长数组切换到短数组，需要同步更新输入组件
				if (oldChars.length > this.maxCarLenght) {
					console.log('⚠️ 从长车牌切换到短车牌，需要同步输入组件');
					this.syncInputComponents();
				}

				console.log('✅ 数组长度调整完成:', this.currentPlateChars);
			},

			// 同步输入组件的内容
			syncInputComponents() {
				console.log('🔄 同步输入组件内容');

				// 清空输入组件
				if (this.$refs.keyboardInput && this.$refs.keyboardInput.toClear) {
					this.$refs.keyboardInput.toClear();
				}
				if (this.$refs.keyboardInputDisplay && this.$refs.keyboardInputDisplay.toClear) {
					this.$refs.keyboardInputDisplay.toClear();
				}

				// 重新填充当前有效字符
				const validChars = this.currentPlateChars.filter(char => char && char !== '');
				if (validChars.length > 0) {
					console.log('📝 重新填充字符:', validChars);

					// 延迟填充，确保清空操作完成
					setTimeout(() => {
						validChars.forEach(char => {
							if (this.$refs.keyboardInput && this.$refs.keyboardInput.toAdd) {
								this.$refs.keyboardInput.toAdd(char);
							}
							if (this.$refs.keyboardInputDisplay && this.$refs.keyboardInputDisplay.toAdd) {
								this.$refs.keyboardInputDisplay.toAdd(char);
							}
						});
					}, 10);
				}
			},
			toShow(value) {
				this.value = value || '';
				this.isShow = true;
				this.$refs.keyboardInput.changeValue(this.value);
				this.$nextTick(() => {
					this.updateCurrentPlateChars();
				});
			},
			keyboardClosed() {
				this.isShow = false;
				this.clearCurrentPlateChars();
				this.$emit('cancel');
			},
			toCancel() {
				this.keyboardClosed();
			},
			toConfirm() {
				this.isShow = false;
				let value = this.$refs.keyboardInput.values.join('')
				this.$emit('confirm', value);
			},
			inputChange(index) {
				this.carIndex = index;
				let newValue = this.$refs.keyboardInput.values[index - 1]
				if (index == 0) {
					this.$refs.keyboardBox.changeMode(index == 0 ? 0 : 1);
				} else {
					this.$refs.keyboardBox.changeMode(1);
					if (this.$refs.keyboardInput.values[this.maxCarLenght - 1] != "") {
						// 修复组件引用名称
						if (this.$refs.keyboardInputDisplay && this.$refs.keyboardInputDisplay.changeCur) {
							this.$refs.keyboardInputDisplay.changeCur(index - 1);
						}
					}
				}

				// 同步数据到currentPlateChars数组
				this.$nextTick(() => {
					this.syncComponentValuesToArray();
				});
			},
			inputAdd(v) {
				console.log('➕ 执行添加操作:', v);

				// 主要操作实际输入组件
				if (this.$refs.keyboardInput && this.$refs.keyboardInput.toAdd) {
					this.$refs.keyboardInput.toAdd(v);
				}
				// 同步到显示组件
				if (this.$refs.keyboardInputDisplay && this.$refs.keyboardInputDisplay.toAdd) {
					this.$refs.keyboardInputDisplay.toAdd(v);
				}

				// 立即同步组件数据到currentPlateChars数组
				this.$nextTick(() => {
					this.syncComponentValuesToArray();

					// 额外的同步确保
					setTimeout(() => {
						this.ensurePerfectSync();
					}, 50);
				});
			},
			inputDel() {
				console.log('🗑️ 执行删除操作');

				// 主要操作实际输入组件
				if (this.$refs.keyboardInput && this.$refs.keyboardInput.toDel) {
					this.$refs.keyboardInput.toDel();
				}
				// 同步到显示组件
				if (this.$refs.keyboardInputDisplay && this.$refs.keyboardInputDisplay.toDel) {
					this.$refs.keyboardInputDisplay.toDel();
				}

				// 立即同步组件数据到currentPlateChars数组
				this.$nextTick(() => {
					this.syncComponentValuesToArray();

					// 额外的同步确保
					setTimeout(() => {
						this.ensurePerfectSync();
					}, 50);
				});
			},
			inputClear() {
				console.log('🧹 执行清空操作');

				// 主要操作实际输入组件
				if (this.$refs.keyboardInput && this.$refs.keyboardInput.toClear) {
					this.$refs.keyboardInput.toClear();
				}
				// 同步到显示组件
				if (this.$refs.keyboardInputDisplay && this.$refs.keyboardInputDisplay.toClear) {
					this.$refs.keyboardInputDisplay.toClear();
				}

				// 立即清空currentPlateChars数组
				this.clearCurrentPlateChars();

				// 确保数组引用更新，触发响应式更新
				this.currentPlateChars = [...this.currentPlateChars];
				console.log('✅ 清空完成，currentPlateChars:', this.currentPlateChars);

				// 额外的同步确保
				setTimeout(() => {
					this.ensurePerfectSync();
				}, 50);
			},
			getNextFourDays() {
				const days = [];
				const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

				for (let i = 0; i < 4; i++) {
					const date = new Date();
					date.setDate(date.getDate() + i);

					const month = (date.getMonth() + 1).toString().padStart(2, '0');
					const day = date.getDate().toString().padStart(2, '0');
					const weekDay = weekDays[date.getDay()];

					days.push({
						day: `${month}-${day}`,
						week: weekDay
					});
				}

				return days;
			},
			updateCurrentPlateChars() {
				console.log('🚗 更新车牌字符显示，当前maxCarLenght:', this.maxCarLenght);
				console.log('🚗 当前currentPlateChars:', this.currentPlateChars);

				// 确保数组长度正确
				if (this.currentPlateChars.length !== this.maxCarLenght) {
					console.log('📏 调整数组长度，从', this.currentPlateChars.length, '到', this.maxCarLenght);

					const oldChars = [...this.currentPlateChars];

					// 创建新长度的数组
					if (this.maxCarLenght === 8) {
						this.currentPlateChars = new Array(8).fill('');
					} else {
						this.currentPlateChars = new Array(7).fill('');
					}

					// 保留有效字符
					for (let i = 0; i < Math.min(oldChars.length, this.currentPlateChars.length); i++) {
						if (oldChars[i] && oldChars[i] !== '') {
							this.currentPlateChars[i] = oldChars[i];
						}
					}

					// 强制更新数组引用
					this.currentPlateChars = [...this.currentPlateChars];
					console.log('✅ 数组长度调整完成:', this.currentPlateChars);
				}
			},



			clearCurrentPlateChars() {
				for (let i = 0; i < this.currentPlateChars.length; i++) {
					this.currentPlateChars[i] = '';
				}
			},

			// 获取记录的真实状态
			getRecordStatus(record) {
				// 按优先级检查各种状态字段
				// 1. 首先检查auditStatus（审核状态）
				if (record.auditStatus && record.auditStatus !== '(Null)' && record.auditStatus.trim() !== '') {
					return record.auditStatus;
				}

				// 2. 检查venuStatus（场地状态）
				if (record.venuStatus && record.venuStatus !== '(Null)' && record.venuStatus.trim() !== '') {
					return record.venuStatus;
				}

				// 3. 检查传统的status字段
				if (record.status && record.status !== '(Null)' && record.status.trim() !== '') {
					return record.status;
				}

				// 4. 检查其他可能的状态字段
				const statusFields = ['appointmentstatus', 'visitstatus', 'recordstatus'];
				for (let field of statusFields) {
					if (record[field] && record[field] !== '(Null)' && record[field].trim() !== '') {
						return record[field];
					}
				}

				// 5. 如果都没有找到有效状态，返回默认值
				return '有效'; // 默认状态，会被后续检查拦截
			},

			// ================ 月票车牌相关方法 ================

			// 获取地址信息
			getAddressInfo(userInfo) {
				try {
					// 从userInfo中提取地址信息
					const community = userInfo?.userInfo?.community ||
						userInfo?.community ||
						'四季上东'; // 默认社区

					return {
						community: community,
						province: userInfo?.userInfo?.province || userInfo?.province,
						city: userInfo?.userInfo?.city || userInfo?.city,
						district: userInfo?.userInfo?.district || userInfo?.district,
						building: userInfo?.userInfo?.building || userInfo?.building,
						units: userInfo?.userInfo?.units || userInfo?.units,
						floor: userInfo?.userInfo?.floor || userInfo?.floor,
						room: userInfo?.userInfo?.room || userInfo?.room
					};
				} catch (error) {
					console.error('🏠 获取地址信息失败:', error);
					return {
						community: '四季上东' // 出错时返回默认社区
					};
				}
			},

			// 加载月票信息
			async loadMonthlyTicketInfo() {
				if (this.currentUserRole !== 'owner') {
					console.log('🎫 非业主角色，跳过月票查询');
					return;
				}

				try {
					this.isLoadingMonthlyTicket = true;
					this.monthlyTicketError = '';

					const userInfo = uni.getStorageSync('userInfo') || {};
					const phone = this.model1.code || userInfo.phone || userInfo.userInfo?.phone;

					if (!phone) {
						throw new Error('无法获取用户手机号');
					}

					// 获取社区信息
					const addressInfo = this.getAddressInfo(userInfo);
					const community = addressInfo.community || '四季上东';

					console.log('🎫 开始查询月票信息:', {
						phone: phone,
						community: community,
						userInfo: userInfo
					});

					// 显示查询开始的提示
					uni.showToast({
						title: '查询月票信息...',
						icon: 'loading',
						duration: 2000
					});

					// 调用月票查询API
					const {
						ownerAPI
					} = require('@/config/api.js');
					const monthlyTicketData = await ownerAPI.checkMonthlyTicket(phone, community);

					console.log('🎫 月票查询API返回原始数据:', monthlyTicketData);

					// 解析月票数据
					this.parseMonthlyTicketData(monthlyTicketData);

					// 查询完成提示
					if (this.monthlyTicketPlates.length > 0) {
						const source = monthlyTicketData?.data?.source || 'unknown';
						const sourceText = source === 'local_database' ? '(本地数据)' : '(外部API)';
						uni.showToast({
							title: `找到${this.monthlyTicketPlates.length}个月票车牌${sourceText}`,
							icon: 'success',
							duration: 2000
						});

						// 月票加载成功后，立即自动选择第一个车牌
						console.log('🎯 月票加载完成，准备自动选择第一个车牌');
						this.$nextTick(() => {
							setTimeout(() => {
								this.autoSelectFirstPlate();
							}, 500); // 稍微延迟确保DOM完全渲染
						});
					} else {
						uni.showToast({
							title: '未找到月票车牌',
							icon: 'none',
							duration: 2000
						});
					}

				} catch (error) {
					console.error('🎫 查询月票信息失败:', error);
					this.monthlyTicketError = this.getMonthlyTicketErrorMessage(error);

					// 错误提示
					uni.showToast({
						title: '月票查询失败',
						icon: 'error',
						duration: 2000
					});
				} finally {
					this.isLoadingMonthlyTicket = false;
				}
			},

			// 解析月票数据
			parseMonthlyTicketData(data) {
				this.monthlyTicketPlates = [];
				this.monthlyTicketOptions = [];
				this.monthlyPickerColumns = [
					[]
				];

				try {
					console.log('🔍 开始解析月票数据，原始数据:', data);
					console.log('🔍 data类型:', typeof data);
					console.log('🔍 data.data:', data?.data);
					console.log('🔍 data.data类型:', typeof data?.data);

					let plateList = [];

					// 处理不同的响应数据结构
					if (data && data.data) {
						console.log('🔍 进入data.data分支');

						// 先检查是否是API响应格式（有code、msg、data字段）
						if (data.data.code !== undefined && data.data.data) {
							console.log('🔍 检测到API响应格式，检查data.data.data');
							if (Array.isArray(data.data.data)) {
								console.log('✅ 使用data.data.data，长度:', data.data.data.length);
								plateList = data.data.data;
							} else if (data.data.data.data && Array.isArray(data.data.data.data)) {
								console.log('✅ 使用data.data.data.data，长度:', data.data.data.data.length);
								plateList = data.data.data.data;
							} else if (data.data.data.monthlyTickets && Array.isArray(data.data.data.monthlyTickets)) {
								console.log('✅ 使用data.data.data.monthlyTickets，长度:', data.data.data.monthlyTickets.length);
								plateList = data.data.data.monthlyTickets;
							}
						}
						// 如果还没找到，检查直接的数组结构
						else if (Array.isArray(data.data)) {
							console.log('✅ 使用data.data，长度:', data.data.length);
							plateList = data.data;
						}
						// 检查嵌套的车牌数组字段
						else if (data.data.data && Array.isArray(data.data.data)) {
							console.log('✅ 使用data.data.data，长度:', data.data.data.length);
							plateList = data.data.data;
						} else if (data.data.monthlyTickets && Array.isArray(data.data.monthlyTickets)) {
							console.log('✅ 使用data.data.monthlyTickets，长度:', data.data.monthlyTickets.length);
							plateList = data.data.monthlyTickets;
						} else if (data.data.plateNumbers && Array.isArray(data.data.plateNumbers)) {
							console.log('✅ 使用data.data.plateNumbers，长度:', data.data.plateNumbers.length);
							plateList = data.data.plateNumbers;
						} else {
							console.log('⚠️ 未匹配到任何data.data的数组格式');
							console.log('🔍 data.data详细结构:', JSON.stringify(data.data, null, 2));
							console.log('🔍 尝试直接检查data.data中的数组字段...');

							// 最后尝试：遍历data.data的所有属性，找到数组
							for (let key in data.data) {
								if (Array.isArray(data.data[key]) && data.data[key].length > 0) {
									console.log(`✅ 找到数组字段 data.data.${key}，长度:`, data.data[key].length);
									plateList = data.data[key];
									break;
								}
							}
						}
					} else if (Array.isArray(data)) {
						console.log('✅ 使用根级data数组，长度:', data.length);
						plateList = data;
					} else {
						console.log('❌ 数据结构不匹配');
					}

					console.log('🎫 最终plateList:', plateList);
					console.log('🎫 plateList长度:', plateList.length);

					// 提取车牌号码
					plateList.forEach((item, index) => {
						console.log(`🚗 处理第${index + 1}个车牌项:`, item);

						let plateNumber = '';
						let ticketInfo = '';

						if (typeof item === 'string') {
							// 直接是车牌号字符串
							plateNumber = item.trim();
							console.log('✅ 字符串车牌:', plateNumber);
						} else if (typeof item === 'object' && item !== null) {
							// 从对象中提取车牌号
							plateNumber = item.plateNumber ||
								item.platenumber ||
								item.carNumber ||
								item.carnumber ||
								item.plate ||
								item.number ||
								'';

							console.log('🔍 对象车牌字段检查:');
							console.log('  - plateNumber:', item.plateNumber);
							console.log('  - platenumber:', item.platenumber);
							console.log('  - 最终车牌号:', plateNumber);

							// 提取票据信息（如有效期等）
							if (item.expireDate || item.validUntil || item.endDate) {
								const expireDate = item.expireDate || item.validUntil || item.endDate;
								ticketInfo = ` (有效期至: ${this.formatExpireDate(expireDate)})`;
							} else if (item.status) {
								ticketInfo = ` (状态: ${item.status})`;
							}
						}

						console.log(
							`🎫 车牌${index + 1}处理结果: plateNumber="${plateNumber}", ticketInfo="${ticketInfo}"`);

						if (plateNumber && plateNumber.length >= 7) {
							console.log(`✅ 车牌${index + 1}通过验证，添加到列表`);
							this.monthlyTicketPlates.push({
								plateNumber: plateNumber,
								ticketInfo: ticketInfo,
								originalData: item
							});

							// 构建选择器选项
							this.monthlyTicketOptions.push({
								label: plateNumber + ticketInfo,
								value: plateNumber
							});
						} else {
							console.log(`❌ 车牌${index + 1}未通过验证: "${plateNumber}" (长度: ${plateNumber.length})`);
						}
					});

					// 构建 u-picker 的 columns 数据格式
					this.monthlyPickerColumns = [
						this.monthlyTicketOptions.map(option => ({
							text: option.label,
							value: option.value
						}))
					];

					console.log(`🎫 解析到 ${this.monthlyTicketPlates.length} 个月票车牌:`, this.monthlyTicketPlates);
					console.log('🎫 月票选择器数据:', this.monthlyPickerColumns);
					console.log('🎫 选择器选项详情:', this.monthlyTicketOptions);

					if (this.monthlyTicketPlates.length === 0) {
						this.monthlyTicketError = '暂无可用的月票车牌信息';
						console.log('❌ 月票车牌数量为0，设置错误信息');
					} else {
						this.monthlyTicketError = '';
						console.log('✅ 月票车牌解析成功');

						// 自动选择第一个月票车牌 - 增加延迟确保组件准备完毕
						this.$nextTick(() => {
							setTimeout(() => {
								this.autoSelectFirstPlate();
							}, 300); // 增加延迟，确保页面完全渲染
						});
					}

				} catch (error) {
					console.error('🎫 解析月票数据失败:', error);
					this.monthlyTicketError = '月票数据解析失败';
				}
			},

			// 格式化过期日期
			formatExpireDate(dateStr) {
				try {
					const date = new Date(dateStr);
					if (isNaN(date.getTime())) {
						return dateStr;
					}

					const year = date.getFullYear();
					const month = (date.getMonth() + 1).toString().padStart(2, '0');
					const day = date.getDate().toString().padStart(2, '0');

					return `${year}-${month}-${day}`;
				} catch (error) {
					return dateStr;
				}
			},

			// 获取月票错误提示信息
			getMonthlyTicketErrorMessage(error) {
				if (error.message) {
					if (error.message.includes('超时') || error.message.includes('timeout')) {
						return '查询超时，请检查网络后重试';
					} else if (error.message.includes('网络') || error.message.includes('network')) {
						return '网络连接失败，请检查网络';
					} else if (error.message.includes('无法获取')) {
						return '无法获取用户信息，请重新登录';
					} else {
						return error.message;
					}
				}
				return '查询月票信息失败，请稍后重试';
			},

			// 显示月票选择器
			openMonthlyPicker() {
				if (this.monthlyTicketPlates.length === 0) {
					uni.showToast({
						title: '暂无可用的月票车牌',
						icon: 'none',
						duration: 2000
					});
					return;
				}
				this.showMonthlyPicker = true;
			},

			// 月票车牌选择确认处理
			onMonthlyPlateConfirm(selection) {
				console.log('🎫 用户选择月票车牌 - 原始参数:', selection);
				console.log('🎫 selection类型:', typeof selection);
				console.log('🎫 selection.value:', selection?.value);
				console.log('🎫 selection.value类型:', typeof selection?.value);

				this.showMonthlyPicker = false;

				if (selection && selection.value && selection.value.length > 0) {
					// 修复：正确提取车牌号字符串
					const selectedObject = selection.value[0];
					console.log('🎫 选中的对象:', selectedObject);

					let selectedPlate;
					if (typeof selectedObject === 'string') {
						// 如果直接是字符串
						selectedPlate = selectedObject;
					} else if (selectedObject && selectedObject.value) {
						// 如果是对象，取value属性
						selectedPlate = selectedObject.value;
					} else if (selectedObject && selectedObject.text) {
						// 如果有text属性，取第一个空格前的部分（车牌号）
						selectedPlate = selectedObject.text.split(' ')[0];
					} else {
						console.log('❌ 无法从选择对象中提取车牌号:', selectedObject);
						uni.showToast({
							title: '选择失败，数据格式错误',
							icon: 'none',
							duration: 2000
						});
						return;
					}

					console.log('🎫 提取的车牌号:', selectedPlate);
					console.log('🎫 车牌号类型:', typeof selectedPlate);

					// 确保是字符串且有效
					if (typeof selectedPlate === 'string' && selectedPlate.length >= 7) {
						this.selectedMonthlyPlate = selectedPlate;

						// 自动填充车牌号到输入区域
						this.fillPlateNumber(selectedPlate);

						// 根据车牌号自动选择车牌类型
						this.autoSelectPlateType(selectedPlate);

						uni.showToast({
							title: `已选择车牌: ${selectedPlate}`,
							icon: 'success',
							duration: 2000
						});
					} else {
						console.log('❌ 车牌号格式不正确:', selectedPlate);
						uni.showToast({
							title: '车牌号格式不正确',
							icon: 'none',
							duration: 2000
						});
					}
				} else {
					console.log('❌ 选择数据格式不正确:', selection);
					uni.showToast({
						title: '选择失败，请重试',
						icon: 'none',
						duration: 2000
					});
				}
			},

			// 填充车牌号到输入区域
			fillPlateNumber(plateNumber) {
				console.log('🎫 开始填充车牌号:', plateNumber);

				if (!plateNumber) {
					console.log('❌ 车牌号为空，无法填充');
					return;
				}

				try {
					// 先更新车牌类型（这会影响maxCarLenght和carMax）
					this.autoSelectPlateType(plateNumber);

					// 等待DOM更新后再填充
					this.$nextTick(() => {
						console.log('📝 DOM更新后开始填充，当前maxCarLenght:', this.maxCarLenght);
						console.log('📝 当前carMax:', this.carMax);

						// 直接设置车牌字符数组（通过数据绑定更新显示）
						this.directSetPlateChars(plateNumber);

						// 多重延迟确保组件状态同步
						setTimeout(() => {
							// 同步更新输入组件的内部状态
							this.syncInputComponentsWithData(plateNumber);

							// 额外的同步检查
							setTimeout(() => {
								this.verifyPlateNumberFilled(plateNumber);
							}, 100);
						}, 50);

						console.log('🎫 车牌号填充完成:', plateNumber);
					});

				} catch (error) {
					console.error('🎫 填充车牌号失败:', error);
					uni.showToast({
						title: '填充车牌失败，请手动输入',
						icon: 'none',
						duration: 2000
					});
				}
			},

			// 验证车牌号是否填充成功
			verifyPlateNumberFilled(expectedPlateNumber) {
				console.log('🔍 验证车牌号填充结果');

				try {
					// 检查各个组件的状态
					let inputValues = [];
					let displayValues = [];

					if (this.$refs.keyboardInput && this.$refs.keyboardInput.values) {
						inputValues = [...this.$refs.keyboardInput.values];
					}

					if (this.$refs.keyboardInputDisplay && this.$refs.keyboardInputDisplay.values) {
						displayValues = [...this.$refs.keyboardInputDisplay.values];
					}

					const inputStr = inputValues.join('');
					const displayStr = displayValues.join('');
					const arrayStr = this.currentPlateChars.join('');

					console.log('🔍 期望车牌号:', expectedPlateNumber);
					console.log('🔍 输入组件结果:', inputStr);
					console.log('🔍 显示组件结果:', displayStr);
					console.log('🔍 数组结果:', arrayStr);

					// 检查是否填充成功
					const isInputCorrect = inputStr === expectedPlateNumber;
					const isDisplayCorrect = displayStr === expectedPlateNumber;
					const isArrayCorrect = arrayStr === expectedPlateNumber;

					if (isInputCorrect && isDisplayCorrect && isArrayCorrect) {
						console.log('✅ 车牌号填充验证成功');
						return true;
					} else {
						console.log('⚠️ 车牌号填充不完整，尝试修复');

						// 尝试修复不一致的状态
						this.repairPlateNumberFill(expectedPlateNumber);
						return false;
					}

				} catch (error) {
					console.error('❌ 验证车牌号填充失败:', error);
					return false;
				}
			},

			// 修复车牌号填充
			repairPlateNumberFill(plateNumber) {
				console.log('🔧 修复车牌号填充:', plateNumber);

				try {
					// 强制清空所有组件
					this.clearAllPlateComponents();

					// 重新设置数组
					this.directSetPlateChars(plateNumber);

					// 延迟重新填充组件
					setTimeout(() => {
						this.forceRefillComponents(plateNumber);
					}, 100);

				} catch (error) {
					console.error('❌ 修复车牌号填充失败:', error);
				}
			},

			// 清空所有车牌组件
			clearAllPlateComponents() {
				console.log('🧹 清空所有车牌组件');

				// 清空输入组件
				if (this.$refs.keyboardInput && this.$refs.keyboardInput.toClear) {
					this.$refs.keyboardInput.toClear();
				}

				// 清空显示组件
				if (this.$refs.keyboardInputDisplay && this.$refs.keyboardInputDisplay.toClear) {
					this.$refs.keyboardInputDisplay.toClear();
				}

				// 清空数组
				this.clearCurrentPlateChars();
			},

			// 强制重新填充组件
			forceRefillComponents(plateNumber) {
				console.log('🔄 强制重新填充组件:', plateNumber);

				try {
					// 逐个字符添加到两个组件
					for (let i = 0; i < plateNumber.length && i < this.maxCarLenght; i++) {
						const char = plateNumber.charAt(i);

						// 添加到输入组件
						if (this.$refs.keyboardInput && this.$refs.keyboardInput.toAdd) {
							this.$refs.keyboardInput.toAdd(char);
						}

						// 添加到显示组件
						if (this.$refs.keyboardInputDisplay && this.$refs.keyboardInputDisplay.toAdd) {
							this.$refs.keyboardInputDisplay.toAdd(char);
						}
					}

					// 同步数组状态
					this.syncComponentValuesToArray();

					console.log('✅ 强制重新填充完成');

				} catch (error) {
					console.error('❌ 强制重新填充失败:', error);
				}
			},

			// 直接设置车牌字符数组
			directSetPlateChars(plateNumber) {
				console.log('📝 直接设置车牌字符数组:', plateNumber);

				// 确保数组长度正确
				if (this.maxCarLenght === 8) {
					this.currentPlateChars = new Array(8).fill('');
				} else {
					this.currentPlateChars = new Array(7).fill('');
				}

				// 填充字符
				for (let i = 0; i < Math.min(plateNumber.length, this.currentPlateChars.length); i++) {
					this.currentPlateChars[i] = plateNumber.charAt(i);
				}

				// 强制更新数组引用，触发响应式更新
				this.currentPlateChars = [...this.currentPlateChars];
				console.log('✅ 直接设置完成:', this.currentPlateChars);
			},

			// 同步输入组件的内部状态
			syncInputComponentsWithData(plateNumber) {
				console.log('🔄 同步输入组件内部状态');

				// 延迟执行，确保组件已经通过props接收到新数据
				setTimeout(() => {
					// 清空输入组件的内部状态
					if (this.$refs.keyboardInput && this.$refs.keyboardInput.toClear) {
						this.$refs.keyboardInput.toClear();
					}
					if (this.$refs.keyboardInputDisplay && this.$refs.keyboardInputDisplay.toClear) {
						this.$refs.keyboardInputDisplay.toClear();
					}

					// 重新填充到输入组件
					setTimeout(() => {
						for (let i = 0; i < plateNumber.length && i < this.maxCarLenght; i++) {
							const char = plateNumber.charAt(i);
							if (this.$refs.keyboardInput && this.$refs.keyboardInput.toAdd) {
								this.$refs.keyboardInput.toAdd(char);
							}
							if (this.$refs.keyboardInputDisplay && this.$refs.keyboardInputDisplay.toAdd) {
								this.$refs.keyboardInputDisplay.toAdd(char);
							}
						}
						console.log('✅ 输入组件内部状态同步完成');
					}, 20);
				}, 50);
			},



			// 根据车牌号自动选择车牌类型
			autoSelectPlateType(plateNumber) {
				if (!plateNumber) return;

				// 根据车牌长度和特征判断类型
				if (plateNumber.length === 8) {
					// 新能源车牌
					this.changeColor('linear-gradient(to bottom, #d0f1e4, #6ad390)');
				} else if (plateNumber.length === 7) {
					// 传统车牌，根据颜色特征判断
					// 这里可以根据实际业务逻辑调整
					// 默认选择蓝牌
					this.changeColor('linear-gradient(to bottom, #216fef, #0c4fc5)');
				}
			},

			// 同步组件数据到数组
			syncComponentValuesToArray() {
				console.log('🔄 同步组件数据到currentPlateChars数组');

				try {
					// 优先从实际输入组件获取最新值
					let latestValues = [];
					if (this.$refs.keyboardInput && this.$refs.keyboardInput.values) {
						latestValues = this.$refs.keyboardInput.values || [];
						console.log('📝 从keyboardInput获取values:', latestValues);
					} else if (this.$refs.keyboardInputDisplay && this.$refs.keyboardInputDisplay.values) {
						latestValues = this.$refs.keyboardInputDisplay.values || [];
						console.log('📝 从keyboardInputDisplay获取values:', latestValues);
					}

					// 确保数组长度正确
					if (this.maxCarLenght === 8) {
						this.currentPlateChars = new Array(8).fill('');
					} else {
						this.currentPlateChars = new Array(7).fill('');
					}

					// 填充实际数据
					for (let i = 0; i < Math.min(latestValues.length, this.currentPlateChars.length); i++) {
						this.currentPlateChars[i] = latestValues[i] || '';
					}

					// 强制更新数组引用，触发响应式更新
					this.currentPlateChars = [...this.currentPlateChars];
					console.log('✅ 同步完成，currentPlateChars:', this.currentPlateChars);

					// 关键修复：确保两个组件状态一致
					this.forceComponentsSync();

				} catch (error) {
					console.error('❌ 同步组件数据失败:', error);
				}
			},

			// 强制两个组件状态同步
			forceComponentsSync() {
				console.log('🔄 强制两个组件状态同步');

				// 延迟执行，确保DOM已更新
				setTimeout(() => {
					// 获取当前最准确的values（来自实际输入组件）
					let masterValues = [];
					if (this.$refs.keyboardInput && this.$refs.keyboardInput.values) {
						masterValues = [...this.$refs.keyboardInput.values];
					}

					console.log('📝 主控values:', masterValues);

					// 清空显示组件并重新填充
					if (this.$refs.keyboardInputDisplay) {
						console.log('🧹 清空显示组件');
						if (this.$refs.keyboardInputDisplay.toClear) {
							this.$refs.keyboardInputDisplay.toClear();
						}

						// 逐个添加字符到显示组件
						setTimeout(() => {
							for (let i = 0; i < masterValues.length && i < this.maxCarLenght; i++) {
								if (masterValues[i] && this.$refs.keyboardInputDisplay.toAdd) {
									this.$refs.keyboardInputDisplay.toAdd(masterValues[i]);
									console.log(`📝 添加字符到显示组件 ${i}: ${masterValues[i]}`);
								}
							}
							console.log('✅ 显示组件同步完成');
						}, 10);
					}
				}, 20);
			},

			// 确保完美同步（最终检查）
			ensurePerfectSync() {
				console.log('🎯 执行最终同步检查');

				try {
					// 获取两个组件的当前状态
					let inputValues = [];
					let displayValues = [];

					if (this.$refs.keyboardInput && this.$refs.keyboardInput.values) {
						inputValues = [...this.$refs.keyboardInput.values];
					}

					if (this.$refs.keyboardInputDisplay && this.$refs.keyboardInputDisplay.values) {
						displayValues = [...this.$refs.keyboardInputDisplay.values];
					}

					console.log('🔍 输入组件values:', inputValues);
					console.log('🔍 显示组件values:', displayValues);
					console.log('🔍 当前数组:', this.currentPlateChars);

					// 检查是否一致
					const inputStr = inputValues.join('');
					const displayStr = displayValues.join('');
					const arrayStr = this.currentPlateChars.join('');

					console.log('🔍 输入组件字符串:', inputStr);
					console.log('🔍 显示组件字符串:', displayStr);
					console.log('🔍 数组字符串:', arrayStr);

					if (inputStr !== displayStr || inputStr !== arrayStr) {
						console.log('⚠️ 发现不一致，进行修复');

						// 以输入组件为准进行修复
						const masterValues = inputValues;

						// 修复数组
						if (this.maxCarLenght === 8) {
							this.currentPlateChars = new Array(8).fill('');
						} else {
							this.currentPlateChars = new Array(7).fill('');
						}

						for (let i = 0; i < Math.min(masterValues.length, this.currentPlateChars.length); i++) {
							this.currentPlateChars[i] = masterValues[i] || '';
						}
						this.currentPlateChars = [...this.currentPlateChars];

						// 修复显示组件
						if (this.$refs.keyboardInputDisplay) {
							if (this.$refs.keyboardInputDisplay.toClear) {
								this.$refs.keyboardInputDisplay.toClear();
							}

							setTimeout(() => {
								for (let i = 0; i < masterValues.length; i++) {
									if (masterValues[i] && this.$refs.keyboardInputDisplay.toAdd) {
										this.$refs.keyboardInputDisplay.toAdd(masterValues[i]);
									}
								}
								console.log('✅ 最终同步修复完成');
							}, 5);
						}
					} else {
						console.log('✅ 所有组件状态一致');
					}

				} catch (error) {
					console.error('❌ 最终同步检查失败:', error);
				}
			},

			// 自动选择第一个月票车牌
			autoSelectFirstPlate() {
				console.log('🎯 自动选择第一个月票车牌');

				if (this.monthlyTicketPlates.length === 0) {
					console.log('❌ 没有可用的月票车牌');
					return;
				}

				// 检查用户是否已经开始输入车牌号，如果已经输入则不自动选择
				const hasUserInput = this.currentPlateChars.some(char => char !== '');
				if (hasUserInput) {
					console.log('⚠️ 用户已有输入，跳过自动选择');
					return;
				}

				// 检查是否已经选择过月票车牌
				if (this.selectedMonthlyPlate) {
					console.log('✅ 已选择月票车牌，跳过自动选择');
					return;
				}

				try {
					// 获取第一个车牌
					const firstPlate = this.monthlyTicketPlates[0];
					const plateNumber = firstPlate.plateNumber;

					console.log('🎯 选择第一个车牌:', plateNumber);
					console.log('🎯 车牌详情:', firstPlate);

					// 设置选中状态（这会自动更新模板显示）
					this.selectedMonthlyPlate = plateNumber;

					// 确保组件已经准备好，然后延迟执行填充
					this.$nextTick(() => {
						// 再次确保DOM完全渲染
						setTimeout(() => {
							// 检查组件是否存在
							if (!this.$refs.keyboardInput && !this.$refs.keyboardInputDisplay) {
								console.log('⚠️ 车牌输入组件尚未准备好，延迟重试');
								setTimeout(() => this.autoSelectFirstPlate(), 500);
								return;
							}

							// 使用与手动选择相同的逻辑
							this.fillPlateNumber(plateNumber);
							this.autoSelectPlateType(plateNumber);

							console.log('✅ 自动选择第一个车牌完成:', plateNumber);

							// 显示自动选择的提示（不打断用户）
							setTimeout(() => {
								uni.showToast({
									title: `已自动选择: ${plateNumber}`,
									icon: 'success',
									duration: 1500
								});
							}, 800);
						}, 200);
					});

				} catch (error) {
					console.error('❌ 自动选择第一个车牌失败:', error);
					this.monthlyTicketError = '自动选择车牌失败';
				}
			},
		}
	}
</script>

<style lang="scss">
	.time-picker-container {
		overflow-x: hidden;
		width: 100%;
		padding: 0;
		box-sizing: border-box;
	}

	.time-grid {
		display: flex;
		gap: 10rpx;
		padding: 20rpx 0;
		flex-wrap: nowrap;
		width: 100%;
		justify-content: space-between;
	}

	.time-block {
		flex: 1;
		min-width: 130rpx;
		max-width: 160rpx;
		height: 120rpx;
		background: #f8f9fa;
		border-radius: 16rpx;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		transition: all 0.3s;
		border: 2rpx solid #e9ecef;
	}

	.time-block.active {
		background: #025def;
		color: white;
		border-color: #025def;
	}

	.date-day {
		font-size: 28rpx;
		font-weight: 600;
		margin-bottom: 8rpx;
	}

	.date-week {
		font-size: 24rpx;
		opacity: 0.9;
	}

	/* 时间段选择样式 */
	.time-slot-container {
		width: 100%;
		padding: 0;
		box-sizing: border-box;
	}

	.time-slot-wrapper {
		width: 100%;
		padding: 10rpx 0;
		box-sizing: border-box;
	}

	.time-slot-row {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		gap: 10rpx;
		margin-bottom: 15rpx;
		padding: 0 10rpx;
		box-sizing: border-box;
	}

	.time-slot-row:last-child {
		margin-bottom: 0;
		justify-content: flex-start;
	}

	.time-slot-block {
		flex: 1;
		max-width: 160rpx;
		height: 70rpx;
		background: #f8f9fa;
		border-radius: 10rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		transition: all 0.3s ease;
		border: 2rpx solid #e9ecef;
		box-sizing: border-box;
		cursor: pointer;
	}

	/* 第二行的时间段块样式调整 */
	.time-slot-row:last-child .time-slot-block {
		margin-right: 10rpx;
	}

	.time-slot-row:last-child .time-slot-block:last-child {
		margin-right: 0;
	}

	.time-slot-block.active {
		background: #025def;
		color: white;
		border-color: #025def;
		transform: scale(1.02);
		box-shadow: 0 4rpx 12rpx rgba(2, 93, 239, 0.3);
	}

	.slot-text {
		font-size: 24rpx;
		font-weight: 500;
		color: #333;
		white-space: nowrap;
	}

	.time-slot-block.active .slot-text {
		color: white;
		font-weight: 600;
	}

	.car-number {
		font-size: 28rpx;
		color: #7a7171;
		margin-bottom: 10rpx;
		margin-left: 20rpx;
	}

	.u-page {
		background-color: #F6F6F6;
		padding: 10rpx 10rpx 40rpx 10rpx;
	}

	.color-car-button {
		width: 95%;
		margin: 10rpx auto;
		display: flex;
		justify-content: space-between;
	}

	.blue-car,
	.yellow-car,
	.white-car,
	.black-car,
	.green-car {
		flex: 1;
		height: 64rpx;
		border-radius: 6rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #f7f7f7;
		margin: 0 5rpx;
		padding: 0;
		box-sizing: border-box;
	}

	.blue-car-text,
	.yellow-car-text,
	.white-car-text,
	.black-car-text,
	.green-car-text {
		font-size: 20rpx;
	}

	.centre_vie,
	.centre_vie2 {
		width: 96%;
		margin: 20rpx auto;
		background-color: #FFFFFF;
		box-shadow: 0 5rpx 20rpx 0rpx rgba(0, 0, 150, .2);
		border-radius: 20rpx;
		padding: 20rpx 15rpx;
		box-sizing: border-box;
	}

	.button-car {
		width: 90%;
		margin: 5rpx auto 15rpx;
		height: auto;
		padding: 6rpx 0;
		border-radius: 20rpx;
		overflow: hidden;
	}

	.car-view {
		width: 100%;
		height: auto;
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 80rpx;
		padding: 10rpx 0;
		border-radius: 16rpx;
		border: 2rpx solid;
		border-color: var(--border-bg-color, #fff);
		box-sizing: border-box;
	}

	.title-name {
		font-size: 38rpx;
		padding-top: 15rpx;
		margin-bottom: 5rpx;
		margin-left: 30rpx;
		font-family: "微软雅黑";
		font-weight: 700;
		color: #004cff;
	}

	.name {
		padding: 20rpx;
	}

	.name-css {
		font-size: 40rpx;
		font-family: "微软雅黑";
		font-weight: 700;
		color: #000;
	}

	.name-button-submit {
		width: 95%;
		margin: 20rpx auto;
	}

	.name-small {
		margin-top: 10rpx;
		margin-bottom: 20rpx;
		width: 100%;
	}

	.name-small-text {
		font-size: 26rpx;
		font-family: "微软雅黑";
		color: #aaacab;
	}

	.address-detail {
		margin-top: 8rpx;
		margin-bottom: 10rpx;
		width: 100%;
		display: flex;
		align-items: center;
	}

	.address-detail-text {
		font-size: 24rpx;
		font-family: "微软雅黑";
		color: #007eff;
		margin-left: 8rpx;
		font-weight: 500;
	}

	.parking {
		color: #aaacab;
		margin-top: 15px;
	}

	.parking-v1 {
		border-radius: 12px;
		width: 50%;
		height: 35px;
		margin-top: 15px;
		// margin-left: 180px;
		background-color: #ebf1ff;
		color: #000;
	}

	.parking-v2 {
		border-radius: 12px;
		width: 50%;
		height: 35px;
		padding-bottom: 15px;
		margin-top: -38px;
		margin-left: 180px;
		background-color: #ceffda;
		color: #000;
	}

	.parking-v1-image {
		width: 20px;
		height: 20px;
		margin-top: 10px;
		margin-left: 5px;
	}

	.parking-v2-image {
		width: 20px;
		height: 20px;
		margin-top: 10px;
		margin-left: 5px;
	}

	.parking-v1-text {
		margin-left: 30px;
		font-size: 15px;
		margin-top: -25px;
	}

	.parking-v2-text {
		margin-left: 30px;
		font-size: 15px;
		margin-top: -25px;
	}

	.parking-v1-text2 {
		font-size: 18px;
		margin-left: 125px;
		margin-top: -25px;
		color: #005bef;
		padding-bottom: 10px;
	}

	.parking-v2-text2 {
		font-size: 20px;
		margin-left: 145px;
		margin-top: -20px;
		color: #3fef00;
		padding-bottom: 10px;
	}

	.tag-class1 {
		width: 60px;
		height: 50px;
		margin-top: 20px;
		margin-left: 25px;
		border-radius: 5px;
		border: 1px solid #adb2b5;
		/* 默认边框颜色 */
	}

	/* 改变后的样式 */
	.tag-class1.changed1 {
		width: 60px;
		height: 50px;
		margin-top: 20px;
		margin-left: 25px;
		border-color: #c7cede;
		border-radius: 12px;
		background-color: #047efd;
		color: #fff;
	}

	.date-time1 {
		margin-left: 10px;
		margin-top: 5px;
	}

	.date-weekday1 {
		margin-left: 12px;
		margin-top: 5px;
	}

	.tag-class2 {
		width: 60px;
		height: 50px;
		margin-top: -50px;
		margin-left: 105px;
		border-radius: 5px;
		border: 1px solid #adb2b5;
		/* 默认边框颜色 */
	}

	/* 改变后的样式 */
	.tag-class2.changed2 {
		width: 60px;
		height: 50px;
		margin-top: -50px;
		margin-left: 105px;
		border-color: #c7cede;
		border-radius: 12px;
		background-color: #047efd;
		color: #fff;
	}

	.date-time2 {
		margin-left: 10px;
		margin-top: 5px;
	}

	.date-weekday2 {
		margin-left: 12px;
		margin-top: 5px;
	}

	.tag-class3 {
		width: 60px;
		height: 50px;
		margin-top: -50px;
		margin-left: 185px;
		border-radius: 5px;
		border: 1px solid #adb2b5;
		/* 默认边框颜色 */
	}

	/* 改变后的样式 */
	.tag-class3.changed3 {
		width: 60px;
		height: 50px;
		margin-top: -50px;
		margin-left: 185px;
		border-color: #c7cede;
		border-radius: 12px;
		background-color: #047efd;
		color: #fff;
	}

	.date-time3 {
		margin-left: 10px;
		margin-top: 5px;
	}

	.date-weekday3 {
		margin-left: 12px;
		margin-top: 5px;
	}

	.tag-class4 {
		width: 60px;
		height: 50px;
		margin-bottom: 15px;
		margin-top: -50px;
		margin-left: 265px;
		border-radius: 5px;
		border: 1px solid #adb2b5;
		/* 默认边框颜色 */
	}

	/* 改变后的样式 */
	.tag-class4.changed4 {
		width: 60px;
		height: 50px;
		margin-top: -50px;
		margin-left: 265px;
		border-color: #c7cede;
		border-radius: 12px;
		background-color: #047efd;
		color: #fff;
	}

	.date-time4 {
		margin-left: 10px;
		margin-top: 5px;
	}

	.date-weekday4 {
		margin-left: 12px;
		margin-top: 5px;
	}

	.form-u-input {
		margin-left: 10px;
	}

	.u-text-reason {
		width: 50px;
	}

	.u-button-solt {
		margin-left: -15px;
	}

	.xm-keyboard-v2 {
		width: 95%;
		margin: 0 auto;
	}

	/* 修复输入容器的宽度问题 */
	.xm-keyboard-v2>view {
		width: 100% !important;
		margin: 0 auto !important;
		box-sizing: border-box;
	}

	/* 重写车牌输入组件样式 */
	::v-deep .xm-keyboard-input-v1 {
		justify-content: center !important;
		max-width: 550rpx;
		margin: 0 auto;
	}

	::v-deep .xm-keyboard-input-v1 .xm-keyboard-input {
		flex: 0 0 auto !important;
		margin: 0 5rpx !important;
		border-radius: 8rpx !important;
	}

	/* 车牌类型选择按钮样式 */
	.blue-car.selected {
		background: linear-gradient(to bottom, #216fef, #0c4fc5) !important;
		border: 2rpx solid #216fef;
		color: #fff;
	}

	.blue-car.selected .blue-car-text {
		color: #fff;
	}

	.yellow-car.selected {
		background: linear-gradient(to bottom, #f8c401, #dba700) !important;
		border: 2rpx solid #f8c401;
	}

	.yellow-car.selected .yellow-car-text {
		color: #000;
	}

	.white-car.selected {
		background: linear-gradient(to bottom, #f5f5f5, #e0e0e0) !important;
		border: 2rpx solid #e0e0e0;
	}

	.white-car.selected .white-car-text {
		color: #000;
	}

	.black-car.selected {
		background: linear-gradient(to bottom, #525252, #1e1e1e) !important;
		border: 2rpx solid #000;
	}

	.black-car.selected .black-car-text {
		color: #fff;
	}

	.green-car.selected {
		background: linear-gradient(to bottom, #d0f1e4, #6ad390) !important;
		border: 2rpx solid #6ad390;
	}

	.green-car.selected .green-car-text {
		color: #000;
	}

	/* 调整整体布局 */
	.centre_vie2 {
		width: 96%;
		margin: 10rpx auto;
		padding-top: 10rpx;
		padding-bottom: 30rpx;
		background-color: #FFFFFF;
		box-shadow: 0 5rpx 20rpx 0rpx rgba(0, 0, 150, .2);
		border-radius: 20rpx;
		padding: 10rpx 15rpx 30rpx;
		box-sizing: border-box;
		transition: margin-top 0.3s ease;
	}

	/* 调整车牌类型按钮区域边距 */
	.color-car-button {
		width: 95%;
		margin: 10rpx auto;
		display: flex;
		justify-content: space-between;
	}

	/* 调整分隔线上下边距 */
	.u-gap {
		margin-bottom: 5rpx !important;
		margin-top: 10rpx !important;
	}

	/* 添加键盘显示时的样式 */
	.keyboard-active {
		margin-top: -320px !important;
		transition: margin-top 0.3s ease;
	}

	/* 添加键盘预览区域样式 */
	.keyboard-preview {
		padding: 20rpx;
		background-color: #f5f5f5;
		border-bottom: 1px solid #e0e0e0;
	}

	.preview-title {
		text-align: center;
		font-size: 26rpx;
		color: #666;
		margin-bottom: 15rpx;
	}

	.preview-car-plate {
		width: 80%;
		height: 80rpx;
		margin: 0 auto 20rpx;
		border-width: 2rpx;
		border-style: solid;
		border-radius: 10rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
		position: relative;
		overflow: hidden;
	}

	.preview-plate-text {
		display: flex;
		justify-content: center;
		width: 95%;
		height: 70rpx;
		line-height: 70rpx;
	}

	.plate-char {
		flex: 1;
		text-align: center;
		font-size: 32rpx;
		font-weight: bold;
		min-width: 40rpx;
		letter-spacing: 2rpx;
	}

	.plate-char:not(:empty) {
		display: inline-block;
	}

	/* 禁用的电话输入框样式 */
	::v-deep .u-input--disabled {
		background-color: #f8f9fa !important;
		color: #6c757d !important;
		border: 1rpx solid #e9ecef !important;
		border-radius: 8rpx !important;
	}

	::v-deep .u-input--disabled .u-input__control {
		background-color: #f8f9fa !important;
		color: #6c757d !important;
	}

	/* ================ 月票车牌选择样式 ================ */
	.monthly-ticket-section {
		width: 96%;
		margin: 20rpx auto;
		background-color: #FFFFFF;
		box-shadow: 0 5rpx 20rpx 0rpx rgba(0, 0, 150, .2);
		border-radius: 20rpx;
		padding: 20rpx 15rpx;
		box-sizing: border-box;
	}

	.monthly-ticket-title {
		display: flex;
		align-items: center;
		margin-bottom: 20rpx;
	}

	.monthly-ticket-title-text {
		font-size: 32rpx;
		font-weight: 600;
		color: #025def;
		margin-left: 10rpx;
	}

	.monthly-ticket-selector {
		margin-bottom: 15rpx;
	}

	.monthly-select-trigger {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 25rpx;
		background: #f8f9fa;
		border-radius: 12rpx;
		min-height: 80rpx;
		transition: all 0.3s ease;
		border: 2rpx solid #e9ecef;
	}

	.monthly-select-trigger.has-selection {
		background: #e3f2fd;
		border-color: #025def;
	}

	.select-text {
		font-size: 28rpx;
		color: #333;
		flex: 1;
	}

	.monthly-select-trigger.has-selection .select-text {
		color: #025def;
		font-weight: 500;
	}

	.monthly-ticket-tips {
		padding: 15rpx 20rpx;
		background: #f0f8ff;
		border-radius: 8rpx;
		margin-top: 15rpx;
	}

	.tips-text {
		font-size: 24rpx;
		color: #025def;
		line-height: 1.4;
	}

	.loading-monthly-section {
		padding: 30rpx 20rpx;
		text-align: center;
	}

	.loading-content {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		gap: 15rpx;
	}

	.loading-text {
		font-size: 26rpx;
		color: #666;
	}

	.monthly-empty-section {
		padding: 30rpx 20rpx;
		text-align: center;
	}

	.empty-content {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		gap: 15rpx;
	}

	.empty-text {
		font-size: 26rpx;
		color: #ff9500;
		line-height: 1.4;
		text-align: center;
		max-width: 400rpx;
	}

	.retry-button {
		background: #025def;
		color: white;
		padding: 15rpx 30rpx;
		border-radius: 50rpx;
		margin-top: 10rpx;
		transition: all 0.3s ease;
	}

	.retry-button:active {
		background: #0056cc;
		transform: scale(0.98);
	}

	.retry-text {
		font-size: 26rpx;
		color: white;
		font-weight: 500;
	}
</style>