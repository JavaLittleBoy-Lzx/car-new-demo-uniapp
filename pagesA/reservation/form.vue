<template>
	<view class="u-page">
		<!-- 🆕 锁定屏幕 -->
		<view v-if="showLockScreen" class="lock-screen" :class="{ 'qr-used': lockScreenConfig.isQrUsed }">
			<!-- 自定义导航栏（锁定页面不显示标题） -->
			<view class="custom-navbar">
				<view class="navbar-content" :style="{ marginTop: statusBarHeight + 'px' }">
					<!-- 左侧房子图标（不可点击） -->
					<view class="navbar-left">
						<view class="home-icon-disabled">
							<u-icon name="home" size="20" color="#ffffff"></u-icon>
						</view>
					</view>
					<!-- 中间标题区域（留空） -->
					<view class="navbar-title"></view>
					<!-- 右侧按钮区域 -->
					<view class="navbar-right">
						<view class="nav-dots">
							<u-icon name="more-dot-fill" size="20" color="#ffffff"></u-icon>
						</view>
						<view class="nav-scan">
							<u-icon name="scan" size="20" color="#ffffff"></u-icon>
						</view>
					</view>
				</view>
			</view>

			<view class="lock-content" :class="{ 'qr-used': lockScreenConfig.isQrUsed }">
				<view class="lock-icon">{{ lockScreenConfig.icon }}</view>
				<view class="lock-title">{{ lockScreenConfig.title }}</view>
				<view class="lock-message">
					{{ lockScreenConfig.message }}
				</view>
				<view class="lock-tips">
					<text class="tip-item" v-for="tip in lockScreenConfig.tips" :key="tip">• {{ tip }}</text>
				</view>
				<button class="contact-butler-btn" @click="contactButler" v-if="lockScreenConfig.showContactButton">
					{{ lockScreenConfig.contactButtonText }}
				</button>
				<!-- 🔧 临时调试按钮 -->
			</view>
		</view>

		<!-- 原有内容 -->
		<view v-else :style="{ paddingTop: (statusBarHeight - 280) + 'px' }">
			<!-- 自定义导航栏 -->
			<view class="custom-navbar">
				<view class="navbar-content" :style="{ marginTop: statusBarHeight + 'px' }">
					<!-- 左侧房子图标（不可点击） -->
					<view class="navbar-left">
						<view class="home-icon-disabled">
							<u-icon name="home" size="20" color="#ffffff"></u-icon>
						</view>
					</view>
					<!-- 中间标题 -->
					<view class="navbar-title">{{ parkingLotInfo.fullName || '停车场' }}</view>
					<!-- 右侧按钮区域 -->
				</view>
			</view>

			<u-swiper class="swiper case" :autoplay="true" circular :list="list1" indicator height="368rpx"
				indicatorMode="dot" @click="click" :style="{ marginTop: '-240px' }"></u-swiper>
			<view class="name">
				<text class="name-css">{{ parkingLotInfo.fullName }}</text>
			</view>

			<!-- 添加选择器组件 -->
			<u-picker :show="showPicker" :columns="pickerColumns" @close="closePicker" @cancel="closePicker"
				@confirm="onPickerConfirm" :loading="isLoadingOptions" :defaultIndex="pickerDefaultIndex">
			</u-picker>

			<!-- 原有的表单内容 -->
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
					<!-- 添加地址选择器 -->
					<u-form-item leftIcon="home" labelPosition="left" :leftIconStyle="{ 'color': '#025def' }"
						labelWidth="90" borderBottom="false" label="访问地址">
						<view class="address-content">
							<!-- 业主角色自动填充的地址（不可修改） -->
							<view v-if="isOwnerAddressAutoFilled && currentUserRole === 'owner'" class="owner-auto-filled-address">
								<view class="auto-filled-item">
									<text class="auto-filled-text">{{ ownerAutoFilledAddressInfo }}</text>
									<view class="auto-filled-badge owner-badge">
										<text class="badge-text">业主信息自动获取</text>
									</view>
								</view>
								<view class="auto-filled-tips">
									<text class="tips-text">🔒 此地址通过业主信息自动获取，无法修改</text>
								</view>
							</view>

							<!-- 二维码自动填充的地址（不可修改） -->
							<view v-else-if="isAddressAutoFilled" class="qr-auto-filled-address">
								<view class="auto-filled-item">
									<text class="auto-filled-text">{{ autoFilledAddressInfo }}</text>
									<view class="auto-filled-badge qr-badge">
										<text class="badge-text">二维码自动获取</text>
									</view>
								</view>
								<view class="auto-filled-tips">
									<text class="tips-text">🔒 此地址通过二维码自动获取，无法修改</text>
								</view>
							</view>

							<!-- 手动选择的地址（业主角色不可修改，其他角色可修改） -->
							<picker v-else-if="currentUserRole !== 'owner' || !isOwnerAddressAutoFilled" mode="multiSelector" :range="addressRange" range-key="name"
								:value="addressValue" @change="onAddressChange" @columnchange="onAddressColumnChange"
								:disabled="isOwnerAddressAutoFilled">
								<view class="picker-item" :class="{ 'disabled': isOwnerAddressAutoFilled }">
									<text class="picker-text">{{ addressDisplay || '请选择栋、单元、房间' }}</text>
									<text class="picker-arrow">▼</text>
								</view>
							</picker>

							<!-- 🆕 手动选择地址时显示业主手机号 -->
							<!-- <view v-if="!isAddressAutoFilled && selectedOwnerInfo && selectedOwnerInfo.ownerphone" class="manual-owner-info">
							<view class="owner-phone-item">
								<text class="owner-phone-label">业主手机：</text>
								<text class="owner-phone-value">{{ selectedOwnerInfo.ownerphone }}</text>
							</view>
						</view> -->
						</view>
						<!-- 管家选择地址后的业主信息提示 -->
						<view
							v-if="currentUserRole === 'manager' && showOwnerSuggestions && ownerSuggestions.length > 0"
							class="owner-suggestions">
							<view class="suggestions-header">
								<text class="suggestions-title">该地址的业主信息：</text>
							</view>
							<view v-for="(owner, index) in ownerSuggestions" :key="index" class="owner-suggestion-item"
								@tap="selectOwnerSuggestion(owner)">
								<view class="owner-info">
									<text class="owner-name">{{ owner.ownername }}</text>
									<text class="owner-phone">{{ owner.ownerphone }}</text>
									<text class="owner-address">{{ formatOwnerAddress(owner) }}</text>
								</view>
								<view class="suggestion-action">
									<text class="action-text">选择此业主</text>
								</view>
							</view>
						</view>
					</u-form-item>

					<u-form-item :label="phoneLabel" prop="code" leftIcon="phone-fill" labelPosition="left"
						:leftIconStyle="{ 'color': '#025def' }" labelWidth="90" borderBottom="false">
						<!-- 业主角色：可手动填写访客电话 -->
						<u--input v-if="currentUserRole === 'owner'" v-model="model1.code" :disabled="false"
							border="none" placeholder="请输入访客联系电话" type="number"></u--input>
						<!-- 访客角色：不可编辑的联系电话输入框（已改为禁用状态） -->
						<u--input v-else-if="currentUserRole === 'visitor'" v-model="model1.code" :disabled="true"
							:disabledColor="'#f8f9fa'" border="none" :placeholder="phonePlaceholder"
							type="number"></u--input>
						<!-- 其他角色：禁用的联系电话输入框 -->
						<u--input v-else v-model="model1.code" :disabled="true" :disabledColor="'#f8f9fa'" border="none"
							:placeholder="phonePlaceholder" type="number"></u--input>
					</u-form-item>

					<!-- 🆕 业主信息显示（业主角色必须显示且不可修改） -->
					<view v-if="selectedOwnerInfo && currentUserRole === 'owner'" class="owner-info-container">
						<view class="owner-info-header">
							<u-icon name="home-fill" color="#4caf50" size="18"></u-icon>
							<text class="owner-info-title">业主信息（自动获取）</text>
						</view>
						
						<u-form-item label="业主姓名" leftIcon="account-fill" labelPosition="left"
							:leftIconStyle="{ 'color': '#4caf50' }" labelWidth="90" borderBottom="false">
							<u--input v-model="selectedOwnerInfo.ownername" :disabled="true" 
								:disabledColor="'#f1f8f4'" border="none" placeholder="暂无业主信息"
								:style="{ color: '#2e7d32', fontWeight: '600', fontSize: '15px' }"></u--input>
						</u-form-item>

						<u-form-item label="业主电话" leftIcon="phone-fill" labelPosition="left"
							:leftIconStyle="{ 'color': '#4caf50' }" labelWidth="90" borderBottom="false">
							<u--input v-model="selectedOwnerInfo.ownerphone" :disabled="true" 
								:disabledColor="'#f1f8f4'" border="none" placeholder="暂无业主电话"
								type="number" :style="{ color: '#2e7d32', fontWeight: '600', fontSize: '15px' }"></u--input>
						</u-form-item>
					</view>
					<!-- 访客角色：显示业主信息 -->
					<view v-else-if="selectedOwnerInfo && currentUserRole === 'visitor'" class="owner-info-container">
						<view class="owner-info-header">
							<u-icon name="home-fill" color="#4caf50" size="18"></u-icon>
							<text class="owner-info-title">被访业主信息</text>
						</view>
						
						<u-form-item label="业主姓名" leftIcon="account-fill" labelPosition="left"
							:leftIconStyle="{ 'color': '#4caf50' }" labelWidth="90" borderBottom="false">
							<u--input v-model="selectedOwnerInfo.ownername" :disabled="true" 
								:disabledColor="'#f1f8f4'" border="none" placeholder="暂无业主信息"
								:style="{ color: '#2e7d32', fontWeight: '600', fontSize: '15px' }"></u--input>
						</u-form-item>

						<u-form-item label="业主电话" leftIcon="phone-fill" labelPosition="left"
							:leftIconStyle="{ 'color': '#4caf50' }" labelWidth="90" borderBottom="false">
							<u--input v-model="selectedOwnerInfo.ownerphone" :disabled="true" 
								:disabledColor="'#f1f8f4'" border="none" placeholder="暂无业主电话"
								type="number" :style="{ color: '#2e7d32', fontWeight: '600', fontSize: '15px' }"></u--input>
						</u-form-item>
					</view>

					<!-- 🔒 为保护业主隐私，访客角色不显示业主个人信息，仅显示访问地址 -->
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

				<!-- 业主月票车牌选择 - 注释掉，改为手动输入校验 -->
				<!-- 
				<view v-if="currentUserRole === 'owner'" class="monthly-ticket-section">
					<view class="monthly-ticket-title">
						<tui-icon name="car" size="16" color="#025def"></tui-icon>
					</view>

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

					<view v-if="isLoadingMonthlyTicket" class="loading-monthly-section">
						<view class="loading-content">
							<u-loading-icon color="#025def" size="16"></u-loading-icon>
							<text class="loading-text">正在查询月票信息...</text>
						</view>
					</view>

					<view v-if="!isLoadingMonthlyTicket && monthlyTicketPlates.length === 0"
						class="monthly-empty-section">
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

					<u-picker ref="monthlyPicker" :show="showMonthlyPicker" :columns="monthlyPickerColumns"
						@close="showMonthlyPicker = false" @cancel="showMonthlyPicker = false"
						@confirm="onMonthlyPlateConfirm" :closeOnClickOverlay="true" :defaultIndex="[0]" keyName="text"
						title="选择月票车牌">
					</u-picker>
				</view>
				-->

				<view class="button-car" :style="{ background: carColor }">
					<view class="car-view" :style="{
						'--border-bg-color': borderBgColor
					}">
						<xm-keyboard-input-v1 :plateType="plateType" :dynamicWidth="dynamicWidth" ref="keyboardInputAdd"
							v-if="carMax" :max="maxCarLenght" :showPointer="true"></xm-keyboard-input-v1>
						<xm-keyboard-input-v1 :plateType="plateType" :dynamicWidth="dynamicWidth" ref="keyboardInputAdd"
							v-if="carMax == false" :max="maxCarLenght" :showPointer="true"></xm-keyboard-input-v1>
					</view>
				</view>
				<view class="color-car-button">
					<view class="blue-car"
						:class="{ selected: selectedColor === 'linear-gradient(to bottom, #216fef, #0c4fc5)' }">
						<view class="blue-car-text"
							@click="changeColor('linear-gradient(to bottom, #216fef, #0c4fc5)')">蓝牌
						</view>
					</view>
					<view class="yellow-car"
						:class="{ selected: selectedColor === 'linear-gradient(to bottom, #f8c401, #dba700)' }">
						<view class="yellow-car-text"
							@click="changeColor('linear-gradient(to bottom, #f8c401, #dba700)')">
							黄牌</view>
					</view>
					<view class="white-car"
						:class="{ selected: selectedColor === 'linear-gradient(to bottom, #f5f5f5, #e0e0e0)' }">
						<view class="white-car-text"
							@click="changeColor('linear-gradient(to bottom, #f5f5f5, #e0e0e0)')">白牌
						</view>
					</view>
					<view class="black-car"
						:class="{ selected: selectedColor === 'linear-gradient(to bottom, #525252, #1e1e1e)' }">
						<view class="black-car-text"
							@click="changeColor('linear-gradient(to bottom, #525252, #1e1e1e)')">黑牌
						</view>
					</view>
					<view class="green-car"
						:class="{ selected: selectedColor === 'linear-gradient(to bottom, #d0f1e4, #6ad390)' }">
						<view class="green-car-text"
							@click="changeColor('linear-gradient(to bottom, #d0f1e4, #6ad390)')">
							新能源</view>
					</view>
				</view>
				<u-gap height="1" bgColor="#bbb" marginBottom="10" marginTop="20"></u-gap>
				<view class="xm-keyboard-v2">
					<view @click="showKeyboardWithCurrentValue" style="margin-left: 5px; width: 340px;">
						<xm-keyboard-input ref="keyboardInput" @change="inputChange" v-if="carMax" :cursor="true"
							:max="maxCarLenght" :showPointer="true"></xm-keyboard-input>
						<xm-keyboard-input ref="keyboardInput" @change="inputChange" v-if="carMax == false"
							:cursor="true" :max="maxCarLenght" :showPointer="true"></xm-keyboard-input>
					</view>
					<xm-popup :show="isShow" @close="keyboardClosed" background="#d4d5d9" :showContent="showContent">
						<view class="keyboard-preview" v-if="isShow">
							<view class="preview-title">当前输入的车牌号码</view>
							<view class="preview-car-plate"
								:style="{ background: carColor, borderColor: borderBgColor }">
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
				<view class="name-button-submit">
					<u-button iconColor="#fff" text="提  交" color="#0685f9"
						customStyle="border-radius: 10px; height: 35px" @click="submit"></u-button>
				</view>
			</view>

			<!-- 自定义TabBar -->
			<custom-tabbar @tabChange="onTabChange">
			</custom-tabbar>
		</view> <!-- 原有内容结束 -->

		<!-- 🆕 公众号关注引导模态框 -->
		<view v-if="showSubscriptionGuide" class="subscription-modal-overlay" @click="closeSubscriptionGuide">
			<view class="subscription-modal" @click.stop="">
				<view class="subscription-guide">
					<view class="guide-header">
						<text class="guide-icon">📢</text>
						<text class="guide-title">关注公众号</text>
					</view>
					<view class="guide-content">
						<text class="guide-desc">为了及时接收预约状态更新和重要通知，请关注我们的公众号</text>
						<view class="guide-qrcode">
							<image class="qrcode-img" src="/static/qrcode/wechat-qrcode.jpg" mode="aspectFit" />
							<text class="qrcode-text">长按识别二维码关注</text>
						</view>
						<view class="guide-actions">
							<button class="guide-btn primary" @click="checkSubscriptionStatusInModal"
								:disabled="checkingSubscription">
								{{ checkingSubscription ? '验证中...' : '我已关注' }}
							</button>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import CustomTabbar from '@/components/custom-tabbar.vue'
import { request, apiUrls } from '@/config/api.js'
import { violationApi } from '@/api/violation-api.js'

export default {
	components: {
		CustomTabbar
	},
	data() {
		return {
			statusBarHeight: 44, // 状态栏高度，默认44px
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
				fullName: '',
				fullAddress: '',
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
			currentPlateChars: [],
			textColor: '#fff',
			plateUpdateTrigger: 0, // 用于强制触发计算属性更新

			// 月票车牌相关数据
			isLoadingMonthlyTicket: false,
			monthlyTicketPlates: [],
			monthlyTicketOptions: [],
			monthlyPickerColumns: [
				[]
			],
			monthlyPickerObjectData: [
				[]
			],
			selectedMonthlyPlate: '',
			monthlyTicketError: '',
			monthlyPlaceholder: '请选择月票车牌',
			showMonthlyPicker: false,

			// 小区相关数据
			currentCommunity: '', // 当前小区名称
			selectedBuilding: '', // 选中的楼栋
			selectedUnit: '', // 选中的单元
			selectedRoom: '', // 选中的房间

			// 选择器相关
			showPicker: false,
			currentPickerType: '', // 当前打开的选择器类型：building/unit/room
			pickerColumns: [
				[]
			],
			pickerDefaultIndex: [0],
			isLoadingOptions: false,

			// 选项数据
			buildingOptions: [],
			unitOptions: [],
			roomOptions: [],

			// 地址选择相关数据
			currentCommunityName: '', // 当前小区名称
			addressRange: [
				[],
				[],
				[],
				[]
			], // [栋, 单元, 楼层, 房间]
			addressValue: [0, 0, 0, 0], // 当前选中的索引
			addressDisplay: '', // 显示文本
			addressData: {}, // 原始地址数据结构
			isAddressAutoFilled: false, // 标记地址是否为自动填充（不可修改）
			autoFilledAddressInfo: '', // 自动填充的地址信息文本
			isOwnerAddressAutoFilled: false, // 标记地址是否为业主自动填充（不可修改）
			ownerAutoFilledAddressInfo: '', // 业主自动填充的地址信息文本

			// 业主信息提示相关
			ownerSuggestions: [], // 业主信息建议列表
			phoneInputTimer: null, // 输入防抖定时器
			selectedOwnerInfo: null, // 选中的业主信息
			showOwnerSuggestions: false, // 是否显示业主建议

			// 业主搜索功能相关
			ownerSearchKeyword: '', // 业主搜索关键词
			filteredOwnerList: [], // 过滤后的业主列表
			showOwnerSearchResults: false, // 是否显示搜索结果
			ownerSearchLoading: false, // 搜索加载状态
			searchInputTimer: null, // 搜索输入防抖定时器

			form: {
				nickname: '',
				phone: '',
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

			// 🆕 访问控制相关
			showLockScreen: false, // 是否显示锁定屏幕
			accessDenied: false, // 是否访问被拒绝
			qrValidated: false, // 二维码是否已验证
			accessToken: null, // 访问令牌
			scannedQrId: null, // 扫码的二维码ID
			debugMode: false, // 🔧 调试模式开关

			// 🔒 锁定屏幕配置
			lockScreenConfig: {
				icon: '🔒',
				title: '需要扫码预约',
				message: '请扫描管家提供的二维码进行预约操作',
				tips: [
					'每个二维码仅可使用一次',
					'二维码有效期为24小时',
					'如需预约请联系小区管家'
				],
				showContactButton: true,
				contactButtonText: '联系管家',
				showDebugButton: true,
				footerText: '管家用户不受此限制',
				isQrUsed: false // 标识是否为二维码已使用状态
			},

			// 🆕 公众号关注相关
			showSubscriptionGuide: false, // 是否显示公众号关注引导
			checkingSubscription: false, // 是否正在检查关注状态

			// 🆕 预约提交状态控制
			isSubmittingAppointment: false, // 是否正在提交预约
		}
	},
	async onLoad(options) {
		try {
			console.log('🚀 页面加载开始，接收到的参数:', options);
			console.log('🔍 [详细调试] options类型:', typeof options);
			console.log('🔍 [详细调试] options内容:', JSON.stringify(options, null, 2));
			console.log('🔍 [详细调试] options所有键:', Object.keys(options || {}));

			// 🆕 处理微信小程序码的scene参数和其他可能的参数格式
			let processedOptions = await this.processAllQrCodeParams(options);
			if (processedOptions && Object.keys(processedOptions).length > 0) {
				options = processedOptions;
				console.log('🔧 处理后的最终options:', JSON.stringify(options, null, 2));
			} else {
				console.log('⚠️ 未能从任何来源解析到有效参数');
			}

			// 🆕 设置状态栏高度
			this.setStatusBarHeight();

			// 🔍 检查并显示 qrId 参数状态
			this.checkAndShowQrIdStatus(options);

			// 获取用户角色
			await this.getUserRole();

			// 🔍 验证参数解析结果
			console.log('🔍 [验证] 访问控制检查前的options:', JSON.stringify(options, null, 2));
			console.log('🔍 [验证] options.qrId:', options?.qrId);
			console.log('🔍 [验证] 当前用户角色:', this.currentUserRole);

			// 🔍 额外的调试信息
			console.log('🔍 [验证] 是否有options对象:', !!options);
			console.log('🔍 [验证] options的所有键:', options ? Object.keys(options) : 'options为空');
			if (options) {
				console.log('🔍 [验证] 逐个检查options中的参数:');
				for (const [key, value] of Object.entries(options)) {
					console.log(`  - ${key}: ${value} (类型: ${typeof value})`);
				}
			}

			// 🆕 访问控制检查
			const accessCheckResult = await this.checkPageAccess(options);
			console.log('🔐 访问控制检查结果:', accessCheckResult);
			if (!accessCheckResult.allowed) {
				console.warn('❌ 访问被拒绝，原因:', accessCheckResult.reason);

				// 🔧 临时：如果是visitor_no_qr_access错误，显示详细的调试信息
				if (accessCheckResult.reason === 'visitor_no_qr_access') {
				}

				return; // 访问被拒绝，直接返回
			}

			// 继续页面初始化
			await this.continuePageInitialization(options);

			// 🆕 页面加载完成后，同步底部导航栏状态
			this.syncTabBarStatus();

		} catch (error) {
			console.error('❌ 页面加载失败:', error);
			uni.showToast({
				title: '页面加载失败',
				icon: 'error'
			});
		}
	},
	async onShow() {
		// 强制隐藏系统TabBar
		this.hideSystemTabBar();

		// 重新获取用户角色和电话号码（角色可能发生变化）
		await this.getUserRole();

		// 🆕 每次页面显示时检查访客预约状态
		this.checkGuestReservationStatus();

		// 🆕 同步底部导航栏状态
		this.syncTabBarStatus();

		// 页面显示时通知TabBar检查当前页面
		this.$nextTick(() => {
			uni.$emit('syncTabBarState');
		});
	},

	// 拦截返回键 - 防止访客重复预约和访问受限时返回
	onBackPress() {
		console.log(' [返回键拦截] 触发返回键事件');
		console.log(' [返回键拦截] 当前用户角色:', this.currentUserRole);
		console.log(' [返回键拦截] 是否显示锁定屏幕:', this.showLockScreen);

		// 如果显示锁定屏幕（访客访问受限），禁止返回
		if (this.showLockScreen) {
			console.log(' [返回键拦截] 访客访问受限，禁止返回');
			return true; // 阻止默认返回行为
		}

		// 只对访客角色进行返回键拦截
		if (this.currentUserRole === 'visitor' && this.scannedQrId) {
			// 检查二维码是否已被使用
			const qrUsed = uni.getStorageSync(`qr_used_${this.scannedQrId}`);
			if (qrUsed) {
				console.log(' [返回键拦截] 访客二维码已使用，阻止返回');
				uni.showModal({
					title: '提示',
					content: '您已完成预约，此二维码已使用，无法重复预约。',
					showCancel: false,
					confirmText: '知道了'
				});
				return true; // 阻止默认返回行为
			}
		}

		// 检查是否正在提交预约
		if (this.isSubmittingAppointment) {
			console.log(' [返回键拦截] 正在提交预约，阻止返回');
			uni.showModal({
				title: '提示',
				content: '正在提交预约，请稍候...',
				showCancel: false,
				confirmText: '知道了'
			});
			return true; // 阻止默认返回行为
		}

		// 非访客角色或其他情况允许正常返回
		console.log(' [返回键拦截] 允许正常返回');
		return false; // 允许正常返回
	},
	onUnload() {
		// 清理事件监听
		uni.$off('updateTabBarIndex');
	},
	onReady() {
		// 确保表单组件已经准备好再设置规则
		this.$nextTick(() => {
			if (this.$refs.form1 && this.$refs.form1.setRules) {
				this.$refs.form1.setRules(this.rules);
			}
		});

		// 初始化车牌字符数组
		this.adjustPlateCharsLength();
	},
	computed: {
		isreasonSelected() {
			return this.model1.reason == '';
		},
		displayPlateChars() {
			// 添加响应式依赖，确保计算属性能够正确更新
			const trigger = this.plateUpdateTrigger;

			// 优先使用键盘输入组件的实际值，确保预览区域与输入区域同步
			if (this.$refs.keyboardInput && this.$refs.keyboardInput.values) {
				const inputValues = this.$refs.keyboardInput.values || [];
				// 根据车牌类型返回对应长度的数组
				const targetLength = this.maxCarLenght;
				const result = new Array(targetLength).fill('');

				// 填充实际输入的字符
				for (let i = 0; i < Math.min(targetLength, inputValues.length); i++) {
					result[i] = inputValues[i] || '';
				}

				// 添加调试日志
				console.log('🔍 displayPlateChars - 键盘输入值:', inputValues, '触发器:', trigger);
				console.log('🔍 displayPlateChars - 返回结果:', result);

				return result;
			}

			// 如果键盘组件不可用，使用当前车牌字符数组作为备选
			console.log('🔍 displayPlateChars - 使用备选数据:', this.currentPlateChars, '触发器:', trigger);
			return this.currentPlateChars.slice(0, this.maxCarLenght);
		},
		// 根据角色显示不同的标签文本
		phoneLabel() {
			const labels = {
				'visitor': '访客电话',
				'owner': '访客电话', // 业主角色也显示"访客电话"
				'manager': '联系电话'
			};
			return labels[this.currentUserRole] || '联系电话';
		},
		phonePlaceholder() {
			const placeholders = {
				'visitor': '访客电话（自动获取，不可修改）',
				'owner': '请输入访客联系电话', // 业主角色的提示文本
				'manager': '选择地址后自动填充业主电话'
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
		// 🆕 继续页面初始化（提取为独立方法）
		async continuePageInitialization(options) {
			try {
				// 处理扫码传入的地址参数
				if (options) {
					// 🔍 详细调试：显示原始参数
					console.log('🔍 [调试] 原始options参数:', JSON.stringify(options, null, 2));

					// 🔍 检查是否有地址相关参数
					const addressParams = ['building', 'units', 'floor', 'room', 'community', 'province', 'city', 'district'];
					const foundAddressParams = {};
					addressParams.forEach(param => {
						if (options[param]) {
							foundAddressParams[param] = options[param];
						}
					});
					console.log('🏠 [调试] 发现的地址参数:', foundAddressParams);

					// 先尝试解码所有参数
					const decodedParams = {};
					for (const key in options) {
						try {
							if (options[key] && typeof options[key] === 'string' && options[key].includes('%')) {
								decodedParams[key] = decodeURIComponent(options[key]);
							} else {
								decodedParams[key] = options[key];
							}
						} catch (e) {
							decodedParams[key] = options[key];
						}
					}

					// 🔍 详细调试：显示解码后的参数
					console.log('🔍 [调试] 解码后的参数:', JSON.stringify(decodedParams, null, 2));


					// 存储解码后的小区信息 - 确保所有字段都有值
					// 🆕 管家角色不处理扫码的小区信息，使用自己管理的小区
					if (decodedParams.community && this.currentUserRole !== 'manager') {
						// 确保省市区信息完整
						const parkInfo = {
							name: decodedParams.community,
							fullName: `${decodedParams.community}-停车场`,
							province: decodedParams.province || '黑龙江省',
							city: decodedParams.city || '哈尔滨市',
							district: decodedParams.district || '道里区',
							address: decodedParams.address || '',
							fullAddress: decodedParams.fullAddress || ''
						};

						uni.setStorageSync('parkInfo', parkInfo);

						// 直接更新停车场信息，确保立即显示正确的地址
						this.parkingLotInfo = {
							fullName: parkInfo.fullName,
							fullAddress: `${parkInfo.province}${parkInfo.city}${parkInfo.district}${parkInfo.address || parkInfo.name}`,
							buildingInfo: ''
						};

					} else if (decodedParams.community && this.currentUserRole === 'manager') {
						console.log('👨‍💼 管家角色，忽略扫码的小区信息，使用管家自己的小区');
					}

					// 处理管家信息（如果有的话）
					if (decodedParams.butlerName || decodedParams.butlerPhone || decodedParams.butlerId) {
						this.processButlerInfo(decodedParams);
					}

					// 🆕 处理访客手机号（访客角色应该填充自己的手机号，不是管家的）
					if (this.currentUserRole === 'visitor') {
						// 访客角色：优先从用户信息中获取自己的手机号
						const userInfo = uni.getStorageSync('userInfo');
						const userPhone = userInfo?.phone || userInfo?.userInfo?.phone || '';

						if (userPhone) {
							this.model1.code = userPhone;
							console.log('🚗 [onLoad] 访客角色，从用户信息获取自己的手机号:', userPhone);
						} else if (decodedParams.visitorPhone) {
							// 如果用户信息中没有手机号，才使用二维码中的访客手机号
							this.model1.code = decodedParams.visitorPhone;
							console.log('🚗 [onLoad] 访客角色，从二维码获取访客手机号:', decodedParams.visitorPhone);
						} else {
							console.log('🚗 [onLoad] 访客角色，未获取到手机号，留空让用户填写');
						}
					}

					// 先初始化地址数据，确保地址数据加载完成后再处理扫码参数
					await this.loadCurrentCommunityInfo();

					// 地址数据加载完成后，再处理扫码地址参数
					await this.processScannedAddressParams(decodedParams);
				} else {
					// 没有扫码参数时，直接加载地址数据
					await this.loadCurrentCommunityInfo();
				}

				// 监听TabBar状态更新事件
				uni.$on('updateTabBarIndex', (index) => {
					// TabBar状态更新
				});
			} catch (error) {
				console.error('continuePageInitialization错误:', error);
				uni.showToast({
					title: '页面初始化失败',
					icon: 'none'
				});
			}
		},
		// 🆕 设置状态栏高度
		setStatusBarHeight() {
			try {
				const systemInfo = uni.getSystemInfoSync();
				const statusBarHeight = systemInfo.statusBarHeight || 0;

				// 保存状态栏高度到data中
				this.statusBarHeight = statusBarHeight;

				// 在小程序环境中，通过动态样式设置
				// #ifdef H5
				document.documentElement.style.setProperty('--status-bar-height', statusBarHeight + 'px');
				// #endif

				console.log('✅ 状态栏高度设置完成:', statusBarHeight + 'px');
			} catch (error) {
				console.error('❌ 设置状态栏高度失败:', error);
				// 设置默认值
				this.statusBarHeight = 44;
				// #ifdef H5
				document.documentElement.style.setProperty('--status-bar-height', '44px');
				// #endif
			}
		},

		// 🔍 检查并显示 qrId 参数状态
		checkAndShowQrIdStatus(options) {
			const hasQrId = options && options.qrId;
			const qrIdValue = options?.qrId || '无';

			// 分析参数类型
			const paramAnalysis = this.analyzePageParams(options);

			// 构建参数详情
			const allParams = Object.keys(options || {}).map(key =>
				`${key}: ${decodeURIComponent(options[key] || '')}`
			).join('\n') || '无参数';

			// 构建弹窗内容
			let modalContent = '';
			let modalTitle = '';

			if (hasQrId) {
				modalTitle = '✅ 检测到 qrId 参数';
				modalContent = `qrId: ${qrIdValue}\n\n这是正确的访客预约二维码！\n\n参数分析：\n${paramAnalysis}\n\n完整参数列表：\n${allParams}`;
			} else {
				modalTitle = '❌ 未检测到 qrId 参数';
				modalContent = `⚠️ 二维码参数检查结果：\n\n${paramAnalysis}\n\n当前接收到的参数：\n${allParams}\n\n💡 说明：\n正确的访客预约二维码应该包含 qrId 参数，用于验证访问权限。`;
			}

			// 显示检查结果弹窗
			// setTimeout(() => {
			// 	uni.showModal({
			// 		title: modalTitle,
			// 		content: modalContent,
			// 		showCancel: true,
			// 		cancelText: '知道了',
			// 		success: (res) => {
			// 			if (res.confirm && !hasQrId) {
			// 				// 如果没有 qrId 且用户选择调试模式
			// 				this.enableDebugMode();
			// 			}
			// 		}
			// 	});
			// }, 1000); // 延迟1秒显示，确保页面加载完成
		},

		// 🆕 综合处理所有可能的二维码参数格式
		async processAllQrCodeParams(options) {
			try {
				console.log('🎯 [processAllQrCodeParams] 开始综合处理参数');
				console.log('🔍 [processAllQrCodeParams] 原始options:', JSON.stringify(options, null, 2));

				let finalParams = { ...options } || {};

				// 方式1: 检查scene参数（微信小程序码）
				if (options && options.scene) {
					console.log('📱 [方式1] 检测到微信小程序码scene参数:', options.scene);
					const sceneParams = this.parseSceneParams(options.scene);
					finalParams = { ...finalParams, ...sceneParams };
					console.log('🔧 [方式1] 合并scene参数后:', JSON.stringify(finalParams, null, 2));
				}

				// 方式2: 检查其他可能的参数字段
				const possibleSceneFields = ['scene', 'query', 'params', 'data'];
				for (const field of possibleSceneFields) {
					if (options && options[field] && typeof options[field] === 'string' && options[field].includes('=')) {
						console.log(`📱 [方式2] 检测到可能的参数字段 ${field}:`, options[field]);
						const parsedParams = this.parseSceneParams(options[field]);
						finalParams = { ...finalParams, ...parsedParams };
						console.log(`🔧 [方式2] 合并${field}参数后:`, JSON.stringify(finalParams, null, 2));
					}
				}

				// 方式3: 检查URL编码的完整参数
				if (options && typeof options === 'string' && options.includes('=')) {
					console.log('📱 [方式3] 检测到字符串形式的参数:', options);
					const stringParams = this.parseSceneParams(options);
					finalParams = { ...finalParams, ...stringParams };
					console.log('🔧 [方式3] 解析字符串参数后:', JSON.stringify(finalParams, null, 2));
				}

				// 方式4: 尝试从当前页面路径中提取参数
				try {
					const pages = getCurrentPages();
					if (pages && pages.length > 0) {
						const currentPage = pages[pages.length - 1];
						if (currentPage && currentPage.options) {
							console.log('📱 [方式4] 检测到页面路径参数:', currentPage.options);
							finalParams = { ...finalParams, ...currentPage.options };
							console.log('🔧 [方式4] 合并页面参数后:', JSON.stringify(finalParams, null, 2));
						}
					}
				} catch (e) {
					console.log('⚠️ [方式4] 获取页面参数失败:', e);
				}

				// 方式5: 从本地存储兜底合并参数（适配 TabBar 跳转丢失 query 的情况）
				try {
					const scannedAddressInfo = uni.getStorageSync('scannedAddressInfo') || {};
					const pendingScannedParams = uni.getStorageSync('pendingScannedParams') || {};
					const hasScanned = scannedAddressInfo && Object.keys(scannedAddressInfo).length > 0;
					const hasPending = pendingScannedParams && Object.keys(pendingScannedParams).length > 0;
					const isFresh = scannedAddressInfo.timestamp ? ((Date.now() - scannedAddressInfo.timestamp) < 5 * 60 * 1000) : true;
					if (hasScanned || hasPending) {
						const storageParams = { ...(hasScanned && isFresh ? scannedAddressInfo : {}), ...(hasPending ? pendingScannedParams : {}) };
						if (storageParams.unit && !storageParams.units) {
							storageParams.units = storageParams.unit;
						}
						finalParams.qrId = finalParams.qrId || storageParams.qrId;
						finalParams.community = finalParams.community || storageParams.community;
						finalParams.building = finalParams.building || storageParams.building;
						finalParams.unit = finalParams.unit || storageParams.unit;
						finalParams.units = finalParams.units || storageParams.units;
						finalParams.floor = finalParams.floor || storageParams.floor;
						finalParams.room = finalParams.room || storageParams.room;
						finalParams.visitorPhone = finalParams.visitorPhone || storageParams.visitorPhone || storageParams.phone;
						finalParams.butlerName = finalParams.butlerName || storageParams.butlerName;
						finalParams.butlerPhone = finalParams.butlerPhone || storageParams.butlerPhone;
						console.log('🔧 [方式5] 合并本地存储参数后:', JSON.stringify(finalParams, null, 2));
					} else {
						console.log('ℹ️ [方式5] 本地未找到可用的扫码参数');
					}
				} catch (e) {
					console.log('⚠️ [方式5] 读取本地扫码参数失败:', e);
				}

				console.log('🎯 [processAllQrCodeParams] 最终处理结果:', JSON.stringify(finalParams, null, 2));
				return finalParams;

			} catch (error) {
				console.error('❌ [processAllQrCodeParams] 综合处理参数失败:', error);
				return options || {};
			}
		},

		// 🆕 处理微信小程序码的scene参数
		async handleWechatMiniProgramScene(scene, originalOptions) {
			try {
				console.log('🎯 处理微信小程序码scene参数:', scene);

				// 解析scene参数
				const sceneParams = this.parseSceneParams(scene);
				console.log('📝 解析的scene参数:', sceneParams);

				// 将scene参数合并到原始options中
				const mergedOptions = { ...originalOptions, ...sceneParams };
				console.log('🔧 合并后的参数:', mergedOptions);

				return mergedOptions;

			} catch (error) {
				console.error('❌ 处理微信小程序码scene失败:', error);
				return originalOptions;
			}
		},

		// 🆕 解析scene参数
		parseSceneParams(scene) {
			try {
				console.log('🔍 [parseSceneParams] 开始解析scene:', scene, '类型:', typeof scene);
				const params = {};

				if (!scene) {
					console.log('❌ [parseSceneParams] scene为空');
					return params;
				}

				// 将scene转为字符串
				let sceneStr = String(scene);
				console.log('🔍 [parseSceneParams] scene字符串:', sceneStr);

				// scene参数通常是URL编码的，先尝试解码
				let decodedScene = sceneStr;
				try {
					decodedScene = decodeURIComponent(sceneStr);
					console.log('🔍 [parseSceneParams] 解码后的scene:', decodedScene);
				} catch (e) {
					console.log('⚠️ [parseSceneParams] Scene参数无需解码或解码失败，使用原始值');
				}

				// 解析参数对（格式：key=value&key2=value2）
				const pairs = decodedScene.split('&');
				console.log('🔍 [parseSceneParams] 分割后的参数对:', pairs);

				pairs.forEach((pair, index) => {
					console.log(`🔍 [parseSceneParams] 处理参数对 ${index}: "${pair}"`);
					const [key, value] = pair.split('=');
					if (key && value !== undefined) {
						try {
							params[key] = decodeURIComponent(value);
							console.log(`✅ [parseSceneParams] 添加参数: ${key} = ${params[key]}`);
						} catch (e) {
							params[key] = value; // 如果解码失败，使用原始值
							console.log(`⚠️ [parseSceneParams] 解码失败，使用原始值: ${key} = ${value}`);
						}
					} else {
						console.log(`❌ [parseSceneParams] 无效的参数对: "${pair}"`);
					}
				});

				console.log('🎯 [parseSceneParams] Scene参数解析最终结果:', params);
				return params;

			} catch (error) {
				console.error('❌ [parseSceneParams] 解析scene参数失败:', error);
				return {};
			}
		},

		// 🔍 分析页面参数类型
		analyzePageParams(options) {
			if (!options || Object.keys(options).length === 0) {
				return '❌ 无任何参数';
			}

			const hasQrId = options.qrId;
			const hasAddressParams = options.community || options.building || options.unit || options.floor || options.room;
			const hasButlerParams = options.butlerName || options.butlerPhone;

			let analysis = [];

			if (hasQrId) {
				analysis.push('✅ 包含 qrId 参数（正确）');
			} else {
				analysis.push('❌ 缺少 qrId 参数');
			}

			if (hasButlerParams) {
				analysis.push('✅ 包含管家信息');
			} else {
				analysis.push('❌ 缺少管家信息');
			}

			if (hasAddressParams) {
				analysis.push('📍 包含地址信息');
			} else {
				analysis.push('❌ 缺少地址信息');
			}

			// 判断二维码类型
			if (hasQrId && hasButlerParams) {
				analysis.push('\n🎯 判断：正确的访客预约二维码');
			} else if (hasAddressParams && !hasQrId) {
				analysis.push('\n⚠️ 判断：可能是地址跳转二维码（非访客预约）');
			} else {
				analysis.push('\n❓ 判断：未知类型的二维码');
			}

			return analysis.join('\n');
		},

		// 🆕 检查页面访问权限
		async checkPageAccess(options) {
			try {
				console.log('🔐 开始检查页面访问权限:', {
					currentUserRole: this.currentUserRole,
					options: options,
					debugMode: this.debugMode
				});

				// 🔧 调试模式：临时跳过访问控制（仅用于调试）

				// 管家角色直接放行
				if (this.currentUserRole === 'manager') {
					console.log('👨‍💼 管家角色，跳过访问控制检查');
					return { allowed: true, reason: 'manager_role' };
				}

				// 🔒 访客二维码一次性使用控制：只有通过扫描访客二维码且还没有完成预约记录的情况下才能打开表单
				if (options && options.qrId) {
					console.log('🎯 检测到访客二维码参数，开始验证:', options.qrId);

					// 🔒 首先检查二维码是否已被使用
					const isUsed = await this.checkQrCodeUsed(options.qrId);
					if (isUsed) {
						console.warn('🔒 访客二维码已被使用，拒绝访问');
						this.showQrCodeUsedLock();
						return { allowed: false, reason: 'qr_already_used' };
					}

					// 验证二维码有效性（但不标记为已使用）
					const validation = await this.validateQrCodeWithoutMarking(options.qrId);
					if (validation.success) {
						console.log('✅ 访客二维码验证成功，允许进入表单');
						this.qrValidated = true;
						this.scannedQrId = options.qrId;
						
						// 🔧 安全检查：确保 validation.data 存在
						if (validation.data) {
							this.accessToken = validation.data.accessToken;
							
							// 🆕 从验证结果中获取地址信息
							const qrCodeUsage = validation.data.butlerInfo;
							if (qrCodeUsage) {
								console.log('🏠 从二维码验证结果获取地址信息:', qrCodeUsage);

								// 🔧 重要修复：将二维码中的地址信息合并到 options 中
								options.community = qrCodeUsage.community || options.community;
								options.building = qrCodeUsage.building || options.building;
								options.units = qrCodeUsage.unit || options.units; // 注意：数据库字段是 unit，不是 units
								options.unit = qrCodeUsage.unit || options.unit; // 🔧 同时设置 unit 字段以兼容不同的参数名
								options.floor = qrCodeUsage.floor || options.floor;
								options.room = qrCodeUsage.room || options.room;
								options.butlerName = qrCodeUsage.butlerName || options.butlerName;
								options.butlerPhone = qrCodeUsage.butlerPhone || options.butlerPhone;

								console.log('🔧 合并后的参数:', options);
							}

							// 保存访问令牌到本地存储
							uni.setStorageSync('qrAccessToken', validation.data.accessToken);
						} else {
							console.warn('⚠️ 验证成功但缺少 data 数据，使用默认配置');
							this.accessToken = `temp_${options.qrId}_${Date.now()}`;
							uni.setStorageSync('qrAccessToken', this.accessToken);
						}
						
						uni.setStorageSync('qrValidated', true);
						uni.setStorageSync('scannedQrId', options.qrId);

						return { allowed: true, reason: 'visitor_qr_validated' };
					} else {
						console.warn('❌ 访客二维码验证失败:', validation.message);
						this.showQrCodeError(validation.message);
						return { allowed: false, reason: 'qr_validation_failed' };
					}
				} else {
					// 🔍 没有qrId参数的情况
					
					// 访客角色：必须验证二维码扫描信息
					if (this.currentUserRole === 'visitor') {
						console.log('🔍 [访客验证] 访客角色，检查二维码扫描信息');
						const visitorQrCheck = await this.checkVisitorQrAccess();
						if (!visitorQrCheck.canSubmit) {
							// 访客未通过二维码扫描，拒绝访问
							return { allowed: false, reason: 'visitor_no_qr_scan' };
						}
						// 访客验证通过，允许访问
						console.log('✅ [访客验证] 访客二维码验证通过，允许访问页面');
						return { allowed: true, reason: 'visitor_qr_verified' };
					}
					
					// 业主/门岗登记角色：直接允许访问
					if (this.currentUserRole === 'owner') {
						console.log('✅ 业主/门岗登记用户可直接访问');
						return { allowed: true, reason: 'owner_access' };
					}

					// 其他情况：检查是否有有效的访问令牌
					const hasValidToken = await this.checkAccessToken();
					if (hasValidToken) {
						console.log('✅ 发现有效的访问令牌');
						return { allowed: true, reason: 'valid_token' };
					} else {
						console.warn('❌ 无有效访问权限');
						this.showAccessDenied();
						return { allowed: false, reason: 'no_access_token' };
					}
				}
			} catch (error) {
				console.error('❌ 检查页面访问权限时发生异常:', error);
				
				// 业主/门岗登记用户：异常时也允许访问
				if (this.currentUserRole === 'owner') {
					console.log('✅ 业主/门岗登记用户即使异常也可访问');
					return { allowed: true, reason: 'owner_exception_pass' };
				}
				
				// 访客和其他角色：异常时不允许访问
				this.showAccessDenied();
				return { allowed: false, reason: 'check_error' };
			}
		},

		// 🔒 检查二维码是否已被使用
		async checkQrCodeUsed(qrId) {
			try {
				// 首先检查本地存储
				const localUsed = uni.getStorageSync(`qr_used_${qrId}`);
				if (localUsed) {
					const usedTime = uni.getStorageSync(`qr_used_time_${qrId}`);
					console.log('🔒 本地检查：二维码已被使用', { qrId, usedTime: new Date(usedTime) });
					return true;
				}

				// 🔧 临时方案：后端接口未实现时，只依赖本地存储
				// 检查后端状态（如果接口可用）
				const userInfo = uni.getStorageSync('userInfo');
				const openid = userInfo?.userInfo?.openid || userInfo?.openid;

				if (!openid) {
					console.warn('❌ 缺少用户openid，只依赖本地存储检查');
					return false;
				}

				try {
					const response = await request({
						url: apiUrls.qrcode.checkUsed,
						method: 'GET',
						data: {
							qrId: qrId,
							openid: openid
						}
					});

					if (response && response.data && response.data.used) {
						// 同步到本地存储
						uni.setStorageSync(`qr_used_${qrId}`, true);
						uni.setStorageSync(`qr_used_time_${qrId}`, response.data.usedTime || Date.now());
						return true;
					}
					return false;
				} catch (apiError) {
					// 后端接口不可用（404等），只依赖本地存储
					console.log('🔧 后端接口暂不可用，依赖本地存储:', apiError.message);
					return false;
				}
			} catch (error) {
				console.error('🔒 检查二维码使用状态失败:', error);
				// 网络错误时，只依赖本地存储
				const localUsed = uni.getStorageSync(`qr_used_${qrId}`);
				return !!localUsed;
			}
		},

		// 🔒 标记二维码为已使用（一次性使用）- 预约完成后调用
		async markQrCodeAsUsed(qrId) {
			try {
				console.log('🔒 预约完成，开始标记二维码为已使用:', qrId);

				const userInfo = uni.getStorageSync('userInfo');
				const openid = userInfo?.userInfo?.openid || userInfo?.openid;

				if (!openid) {
					console.warn('❌ 缺少用户openid，无法标记二维码为已使用');
					return {
						success: false,
						message: '用户信息不完整，无法标记二维码'
					};
				}

				// 🔒 调用原有的validate接口来标记二维码为已使用
				const requestData = {
					qrId: qrId,
					openid: openid,
					visitorPhone: userInfo?.phone || ''
				};

				try {
					const response = await request({
						url: apiUrls.qrcode.validate, // 使用原有的validate接口
						method: 'POST',
						data: requestData,
						header: {
							'Content-Type': 'application/x-www-form-urlencoded'
						}
					});

					console.log('🔒 后端标记二维码为已使用响应:', response);

					if (response.code === '0') {
						// 同步到本地存储
						uni.setStorageSync(`qr_used_${qrId}`, true);
						uni.setStorageSync(`qr_used_time_${qrId}`, Date.now());

						console.log('✅ 二维码已成功标记为已使用（后端+本地）');
						return {
							success: true,
							message: '二维码已标记为已使用'
						};
					} else {
						console.warn('❌ 后端标记二维码失败:', response.msg);
						// 即使后端失败，也在本地标记，确保功能可用
						uni.setStorageSync(`qr_used_${qrId}`, true);
						uni.setStorageSync(`qr_used_time_${qrId}`, Date.now());
						return {
							success: true,
							message: '二维码已标记为已使用（本地）'
						};
					}
				} catch (apiError) {
					// 后端接口不可用，但本地标记，功能仍然正常
					console.log('🔧 后端接口暂不可用，完成本地标记:', apiError.message);
					uni.setStorageSync(`qr_used_${qrId}`, true);
					uni.setStorageSync(`qr_used_time_${qrId}`, Date.now());
					return {
						success: true,
						message: '二维码已标记为已使用（本地）'
					};
				}

			} catch (error) {
				console.error('🔒 标记二维码为已使用失败:', error);
				return {
					success: false,
					message: '标记失败: ' + error.message
				};
			}
		},

		// 📧 发送预约待审核通知给管家
		async sendBookingPendingNotification(appointmentData, parkingLotName) {
			try {
				console.log('📧 [发送通知] 开始发送预约待审核通知');

				// 🆕 先查询车场管家昵称
				let managerNickname = '小区管家'; // 默认管家昵称
				let shouldSendNotification = true; // 是否应该发送通知
				
				try {
					console.log('🔍 [查询管家] 开始查询车场管家昵称 - 车场:', parkingLotName);
					
					// 调用查询管家昵称接口
					const butlerResponse = await request({
						url: `/api/wechat/butler-nickname/${encodeURIComponent(parkingLotName)}`,
						method: 'GET',
						timeout: 15000 // 15秒超时
					});
					
					console.log('🔍 [查询管家] 接口响应:', butlerResponse);
					
					if (butlerResponse.code === '0' || butlerResponse.code === 0) {
						if (butlerResponse.data) {
							// 检查是否有未关注的管家
							if (butlerResponse.data.success === false && butlerResponse.data.unfollowedButlers) {
								// 所有管家都未关注公众号
								console.warn('⚠️ [查询管家] 所有管家都未关注公众号');
								const unfollowedButlers = butlerResponse.data.unfollowedButlers;
								
								// 显示提示信息
								this.showUnfollowedButlersAlert(unfollowedButlers, parkingLotName);
								
								// 不发送通知
								shouldSendNotification = false;
								return {
									success: false,
									message: '管家尚未关注公众号，无法发送通知'
								};
							} else if (butlerResponse.data.nickname) {
								// 找到已关注的管家
								managerNickname = butlerResponse.data.nickname;
								console.log('✅ [查询管家] 成功获取管家昵称:', managerNickname);
								
								// 如果还有其他未关注的管家，也提示用户
								if (butlerResponse.data.hasUnfollowedButlers && butlerResponse.data.unfollowedButlers && butlerResponse.data.unfollowedButlers.length > 0) {
									console.log('⚠️ [查询管家] 存在未关注的管家:', butlerResponse.data.unfollowedButlers);
									// 可选：显示温和的提示
									this.showPartialUnfollowedButlersHint(butlerResponse.data.unfollowedButlers);
								}
							} else {
								console.warn('⚠️ [查询管家] 响应中未找到昵称，使用默认值');
							}
						}
					} else {
						console.warn('⚠️ [查询管家] 查询失败，使用默认昵称:', butlerResponse.message);
					}
				} catch (butlerError) {
					console.error('❌ [查询管家] 查询管家昵称异常，使用默认昵称:', butlerError);
					// 查询失败不影响后续流程，使用默认昵称继续
				}

				// 如果不应该发送通知，直接返回
				if (!shouldSendNotification) {
					return {
						success: false,
						message: '管家未关注公众号，无法发送通知'
					};
				}

				// 构建通知请求参数
				const notificationData = {
					plateNumber: appointmentData.platenumber || '',
					parkName: parkingLotName || appointmentData.parking || '停车场',
					bookerName: appointmentData.visitorname || '访客',
					contactPhone: appointmentData.visitorphone || '',
					managerNickname: managerNickname
				};

				console.log('📧 [发送通知] 请求参数:', notificationData);

				// 调用后端接口发送通知
				const response = await request({
					url: '/api/wechat/send/booking-pending-notification',
					method: 'POST',
					data: notificationData,
					header: {
						'Content-Type': 'application/json'
					}
				});

				console.log('📧 [发送通知] 接口响应:', response);

				if (response.code === '0' || response.code === 0) {
					console.log('✅ [发送通知] 预约待审核通知发送成功');
					return {
						success: true,
						message: '通知发送成功'
					};
				} else {
					console.warn('⚠️ [发送通知] 通知发送失败:', response.message);
					return {
						success: false,
						message: response.message || '发送失败'
					};
				}

			} catch (error) {
				console.error('❌ [发送通知] 发送预约待审核通知异常:', error);
				return {
					success: false,
					message: '发送异常: ' + error.message
				};
			}
		},
		
		// 🆕 显示所有管家都未关注公众号的提示
		showUnfollowedButlersAlert(unfollowedButlers, parkingLotName) {
			let butlerList = unfollowedButlers.map((butler, index) => {
				return `${index + 1}. ${butler.butlerName} (${butler.phone})`;
			}).join('\n');
			
			uni.showModal({
				title: '⚠️ 管家尚未关注公众号',
				content: `您的预约已成功提交！\n\n但 ${parkingLotName} 的管家尚未关注公众号，无法接收预约审核提醒。\n\n请联系以下管家关注公众号：\n${butlerList}\n\n建议通过其他方式（如电话）通知管家审核预约。`,
				showCancel: false,
				confirmText: '我知道了',
				confirmColor: '#ff9500'
			});
		},
		
		// 🆕 显示部分管家未关注的温和提示
		showPartialUnfollowedButlersHint(unfollowedButlers) {
			// 仅在控制台记录，不打扰用户
			console.log('💡 [提示] 以下管家尚未关注公众号，建议提醒他们关注以便接收通知:');
			unfollowedButlers.forEach((butler, index) => {
				console.log(`   ${index + 1}. ${butler.butlerName} (${butler.phone})`);
			});
		},

		// 🆕 验证二维码（不标记为已使用，仅用于访问控制检查）
		async validateQrCodeWithoutMarking(qrId) {
			try {
				console.log('🔍 开始验证访客二维码（不标记为已使用）:', qrId);

				const userInfo = uni.getStorageSync('userInfo');
				console.log('👤 用户信息:', userInfo);
				const openid = userInfo?.userInfo?.openid || userInfo?.openid;
				const visitorType = userInfo?.visitorType || userInfo?.userInfo?.visitorType;

				// ✅ 外来访客（qrId）不强制要求openid，只需要手机号
				if (!openid && visitorType !== 'external') {
					console.warn('❌ 用户信息不完整，缺少 openid');
					return {
						success: false,
						message: '用户信息不完整，请重新登录'
					};
				}
				
				if (visitorType === 'external') {
					console.log('✅ 外来访客，不需要openid验证，直接允许访问');
					// 🔧 为外来访客生成临时访问令牌
					const tempAccessToken = `external_${qrId}_${Date.now()}`;
					return {
						success: true,
						message: '外来访客验证通过',
						data: {
							accessToken: tempAccessToken,
							butlerInfo: null, // 外来访客可能没有管家信息
							qrId: qrId
						}
					};
				}

				// 🔒 调用专门的验证接口，不标记为已使用
				const requestData = {
					qrId: qrId,
					openid: openid,
					visitorPhone: userInfo?.phone || ''
				};
				console.log('📤 发送验证请求（不标记为已使用）:', requestData);

				// 🆕 使用新的验证接口，只检查有效性，不标记为已使用
				const response = await request({
					url: apiUrls.qrcode.validateOnly, // 新的验证接口
					method: 'POST',
					data: requestData,
					header: {
						'Content-Type': 'application/x-www-form-urlencoded'
					}
				});

				console.log('📥 验证响应:', response);

				if (response.code === '0') {
					console.log('✅ 访客二维码验证成功（未标记为已使用）');
					return {
						success: true,
						message: '验证成功',
						data: response.data
					};
				} else {
					console.warn('❌ 访客二维码验证失败:', response.msg);
					return {
						success: false,
						message: response.msg || '验证失败'
					};
				}
			} catch (error) {
				console.error('❌ 验证访客二维码时发生异常:', error);
				return {
					success: false,
					message: '网络异常，请重试'
				};
			}
		},

		// 🆕 验证二维码（原有方法，用于标记为已使用）
		async validateQrCode(qrId) {
			try {
				console.log('🔍 开始验证二维码:', qrId);

				// 🔒 首先检查二维码是否已被使用
				const isUsed = await this.checkQrCodeUsed(qrId);
				if (isUsed) {
					console.warn('🔒 二维码已被使用，拒绝访问');
					this.showQrCodeUsedLock();
					return {
						success: false,
						message: '此二维码已被使用，每个二维码只能使用一次。请联系管家重新生成二维码。'
					};
				}

				const userInfo = uni.getStorageSync('userInfo');
				console.log('👤 用户信息:', userInfo);
				const openid = userInfo?.userInfo?.openid || userInfo?.openid;
				const visitorType = userInfo?.visitorType || userInfo?.userInfo?.visitorType;

				// ✅ 外来访客（qrId）不强制要求openid，只需要手机号
				if (!openid && visitorType !== 'external') {
					console.warn('❌ 用户信息不完整，缺少 openid');
					return {
						success: false,
						message: '用户信息不完整，请重新登录'
					};
				}
				
				// 外来访客直接标记为已使用，不需要后端验证
				if (visitorType === 'external') {
					console.log('✅ 外来访客，直接标记为已使用');
					// 保存到本地存储
					uni.setStorageSync(`qrcode_used_${qrId}`, true);
					return {
						success: true,
						message: '验证成功'
					};
				}

				const requestData = {
					qrId: qrId,
					openid: openid || '',
					visitorPhone: userInfo?.phone || ''
				};
				console.log('📤 发送验证请求:', requestData);

				// 🔧 修复：后端使用 @RequestParam，需要发送 URL 参数而不是 JSON 数据
				const response = await request({
					url: apiUrls.qrcode.validate,
					method: 'POST',
					data: requestData,
					header: {
						'Content-Type': 'application/x-www-form-urlencoded'
					}
				});

				console.log('📥 验证响应:', response);

				if (response.code === '0') {
					console.log('✅ 二维码验证成功');
					return {
						success: true,
						message: '验证成功',
						data: response.data
					};
				} else {
					console.warn('❌ 二维码验证失败:', response.msg);
					return {
						success: false,
						message: response.msg || '验证失败'
					};
				}
			} catch (error) {
				console.error('❌ 验证二维码时发生异常:', error);
				return {
					success: false,
					message: '网络异常，请重试'
				};
			}
		},

		// 🆕 检查访问令牌
		async checkAccessToken() {
			try {
				const token = uni.getStorageSync('qrAccessToken');
				const validated = uni.getStorageSync('qrValidated');

				if (!token || !validated) {
					return false;
				}

				// 验证令牌是否仍然有效
				// 🔧 修复：后端使用 @RequestParam，需要发送 URL 参数而不是 JSON 数据
				const response = await request({
					url: apiUrls.qrcode.validateToken,
					method: 'POST',
					data: { token: token },
					header: {
						'Content-Type': 'application/x-www-form-urlencoded'
					}
				});

				if (response.code === '0' && response.data.valid) {
					this.accessToken = token;
					this.qrValidated = true;
					return true;
				} else {
					// 令牌无效，清理本地存储
					uni.removeStorageSync('qrAccessToken');
					uni.removeStorageSync('qrValidated');
					uni.removeStorageSync('scannedQrId');
					return false;
				}
			} catch (error) {
				console.error('❌ 检查访问令牌时发生异常:', error);
				return false;
			}
		},

		// 🆕 显示访问被拒绝页面
		showAccessDenied() {
			this.accessDenied = true;
			this.showLockScreen = true;
		},

		// 🔒 显示二维码已使用的锁定屏幕
		showQrCodeUsedLock() {
			this.lockScreenConfig = {
				icon: '🚫',
				title: '二维码已使用',
				message: '此二维码已被使用，每个二维码只能使用一次',
				tips: [
					'此二维码已完成预约操作',
					'每个二维码仅可使用一次',
					'如需重新预约请联系管家',
					'管家将为您生成新的二维码'
				],
				showContactButton: true,
				contactButtonText: '联系管家重新生成',
				showDebugButton: false,
				footerText: '如有疑问请联系小区管家',
				isQrUsed: true // 标识为二维码已使用状态
			};
			this.showLockScreen = true;
		},

		// 🆕 显示二维码错误
		showQrCodeError(message) {
			// 检查是否是二维码已使用的错误
			if (message && message.includes('已被使用')) {
				this.showQrCodeUsedLock();
				return;
			}

			uni.showModal({
				title: '二维码无效',
				content: message + '\n\n请联系管家重新生成二维码',
				showCancel: false,
				confirmText: '知道了',
				success: () => {
					// 跳转回首页或关闭页面
					uni.navigateBack({
						fail: () => {
							uni.reLaunch({
								url: '/pagesA/reservation/searchResult/searchResult'
							});
						}
					});
				}
			});
		},

		// 🔒 显示访客访问被拒绝界面
		showVisitorAccessDenied() {
			this.lockScreenConfig = {
				icon: '🚫',
				title: '访问受限',
				message: '访客用户必须通过扫描管家提供的专用二维码才能访问预约表单',
				tips: [
					'访客预约需要扫描专用二维码',
					'请联系小区管家获取二维码',
					'管家会为您生成访客预约二维码',
					'扫描二维码后即可进行预约'
				],
				showContactButton: true,
				contactButtonText: '联系管家获取二维码',
				showDebugButton: false,
				footerText: '如有疑问请联系小区管家',
				isQrUsed: false
			};
			this.showLockScreen = true;
		},

		// 🆕 联系管家
		contactButler() {
			uni.showModal({
				title: '联系管家',
				content: '请通过以下方式联系小区管家获取预约二维码：\n\n1. 拨打物业电话\n2. 前往物业办公室\n3. 联系小区管家微信',
				showCancel: true,
				cancelText: '知道了',
				confirmText: '拨打电话',
				success: (res) => {
					if (res.confirm) {
						uni.makePhoneCall({
							phoneNumber: '400-000-0000' // 这里可以配置实际的物业电话
						});
					}
				}
			});
		},

		// 🔧 启用调试模式（临时方法）
		enableDebugMode() {
		},

		// 🆕 检查访客预约状态
		async checkGuestReservationStatus() {
			try {
				// 只对访客角色进行检查
				if (this.currentUserRole !== 'visitor' || !this.scannedQrId) {
					return;
				}

				console.log('🔍 [预约状态检查] 开始检查访客预约状态:', this.scannedQrId);

				// 检查二维码是否已被使用
				const qrUsed = uni.getStorageSync(`qr_used_${this.scannedQrId}`);
				const usedTime = uni.getStorageSync(`qr_used_time_${this.scannedQrId}`);

				if (qrUsed) {
					console.log('🔍 [预约状态检查] 发现二维码已被使用:', {
						qrId: this.scannedQrId,
						usedTime: new Date(usedTime)
					});

					// 显示二维码已使用的锁定界面
					this.showQrCodeUsedLock();
				}

				// 检查是否有待处理的预约记录
				await this.checkPendingReservations();

			} catch (error) {
				console.error('❌ [预约状态检查] 检查访客预约状态失败:', error);
			}
		},

		// 🆕 检查待处理的预约记录
		async checkPendingReservations() {
			try {
				if (!this.model1.code || !this.scannedQrId) {
					return;
				}

				// 查询当前手机号的最近预约记录
				const recentRecords = await this.getRecentReservationsByPhone(this.model1.code);
				
				if (recentRecords && recentRecords.length > 0) {
					// 检查是否有与当前二维码相关的已完成预约
					const relatedRecord = recentRecords.find(record => {
						// 检查是否是相同二维码相关的预约且状态为已完成
						return record.qrId === this.scannedQrId && 
							   ['已离场', '离场', '已完成', '完成'].includes(this.getRecordStatus(record));
					});

					if (relatedRecord) {
						console.log('🔍 [预约状态检查] 发现二维码相关的已完成预约');
						// 标记二维码为已使用
						uni.setStorageSync(`qr_used_${this.scannedQrId}`, true);
						uni.setStorageSync(`qr_used_time_${this.scannedQrId}`, Date.now());
						this.showQrCodeUsedLock();
					}
				}

			} catch (error) {
				console.error('❌ [预约状态检查] 检查待处理预约失败:', error);
			}
		},

		// 🆕 根据手机号获取最近的预约记录
		async getRecentReservationsByPhone(phone) {
			try {
				const { appointmentAPI } = require('@/config/api.js');
				const response = await appointmentAPI.getListByPhone(phone);
				
				// 解析响应数据
				let recordList = [];
				if (response && response.data) {
					if (response.data.data && response.data.data.data && Array.isArray(response.data.data.data)) {
						recordList = response.data.data.data;
					} else if (response.data.data && Array.isArray(response.data.data)) {
						recordList = response.data.data;
					} else if (Array.isArray(response.data)) {
						recordList = response.data;
					}
				}

				// 只返回最近7天的记录
				const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
				return recordList.filter(record => {
					try {
						const recordDate = new Date(record.recorddate || record.visitdate);
						return recordDate >= sevenDaysAgo;
					} catch (e) {
						return false;
					}
				});

			} catch (error) {
				console.error('❌ [预约查询] 获取预约记录失败:', error);
				return [];
			}
		},

		// 🆕 重定向到首页
		redirectToHomePage() {
			try {
				console.log('🏠 [页面跳转] 重定向到首页');
				
				// 清理相关的本地存储
				uni.removeStorageSync('pendingScannedParams');
				uni.removeStorageSync('qrAccessToken');
				uni.removeStorageSync('qrValidated');

				// 尝试跳转到首页
				uni.reLaunch({
					url: '/pagesA/reservation/searchResult/searchResult',
					fail: (error) => {
						console.error('❌ [页面跳转] 跳转首页失败:', error);
						// 如果跳转失败，尝试其他页面
						uni.switchTab({
							url: '/pagesA/reservation/searchResult/searchResult',
							fail: () => {
								// 如果TabBar跳转也失败，则关闭当前页面
								uni.navigateBack({
									fail: () => {
										console.error('❌ [页面跳转] 所有跳转方式都失败');
									}
								});
							}
						});
					}
				});

			} catch (error) {
				console.error('❌ [页面跳转] 重定向到首页失败:', error);
			}
		},

		// 🆕 同步底部导航栏状态
		syncTabBarStatus() {
			try {
				// 获取当前页面路径
				const pages = getCurrentPages();
				if (pages && pages.length > 0) {
					const currentPage = pages[pages.length - 1];
					const currentRoute = currentPage.route;

					console.log('📱 [导航栏同步] 当前页面路径:', currentRoute);

					// 通知自定义TabBar组件更新状态
					this.$nextTick(() => {
						uni.$emit('syncTabBarState', {
							currentRoute: currentRoute,
							isReservationPage: currentRoute.includes('reservation')
						});
					});
				}
			} catch (error) {
				console.error('❌ [导航栏同步] 同步失败:', error);
			}
		},

		// 获取用户角色和电话号码
		async getUserRole() {
			try {
				const userInfo = uni.getStorageSync('userInfo');
				console.log('🔍 完整的用户信息:', userInfo); // 添加调试信息

				// 🆕 获取微信用户信息和基本用户信息
				const wechatUserInfo = uni.getStorageSync('wechatUserInfo');
				const userBasicInfo = uni.getStorageSync('userBasicInfo');
				console.log('💬 微信用户信息:', wechatUserInfo);
				console.log('👤 用户基本信息:', userBasicInfo);

				// 🆕 设置用户昵称和微信信息到表单中
				if (wechatUserInfo && wechatUserInfo.nickname) {
					this.form.nickname = wechatUserInfo.nickname;
					console.log('✅ 设置用户昵称到表单:', wechatUserInfo.nickname);
				} else if (userBasicInfo && userBasicInfo.nickname) {
					this.form.nickname = userBasicInfo.nickname;
					console.log('✅ 从基本信息设置用户昵称到表单:', userBasicInfo.nickname);
				} else if (userInfo && userInfo.nickname) {
					this.form.nickname = userInfo.nickname;
					console.log('✅ 从用户信息设置昵称到表单:', userInfo.nickname);
				}

				// 获取角色
				if (userInfo && userInfo.role) {
					this.currentUserRole = userInfo.role;
				} else if (userInfo && userInfo.userInfo && userInfo.userInfo.userkind) {
					this.currentUserRole = userInfo.userInfo.userkind;
				} else {
					this.currentUserRole = 'owner';
				}

				console.log('👤 当前用户角色:', this.currentUserRole);

				// 🆕 如果是管家角色，处理管家的小区信息
				if (this.currentUserRole === 'manager') {
					console.log('👨‍💼 检测到管家角色，处理小区信息');
					await this.handleManagerCommunityInfo(userInfo);
				}

				// 🔧 重要修复：根据角色决定是否自动填充电话号码
				let phone = '';
				// 🆕 优先从用户基本信息获取手机号
				if (userBasicInfo && userBasicInfo.phone) {
					phone = userBasicInfo.phone;
					console.log('✅ 从用户基本信息获取手机号:', phone);
				} else if (userInfo && userInfo.phone) {
					phone = userInfo.phone;
					console.log('✅ 从用户信息获取手机号:', phone);
				} else if (userInfo && userInfo.userInfo && userInfo.userInfo.phone) {
					phone = userInfo.userInfo.phone;
					console.log('✅ 从嵌套用户信息获取手机号:', phone);
				}

				// 🆕 设置手机号到表单中
				if (phone) {
					this.form.phone = phone;
					console.log('✅ 设置手机号到表单:', phone);
				}

				// 🔧 重要修复：根据角色决定是否自动填充电话号码
				if (this.currentUserRole === 'manager') {
					this.model1.code = ''; // 管家角色初始为空，等待选择业主后填充
					console.log('👨‍💼 [管家角色] 联系电话初始化为空，等待选择业主后填充');
				} else if (this.currentUserRole === 'visitor') {
					// 访客角色：电话号码现在不可编辑，优先从已有数据获取
					if (!this.model1.code) {
						// 尝试从用户信息中获取手机号
						if (phone) {
							this.model1.code = phone;
							console.log('🚗 [访客角色] 从用户信息获取手机号并填充（不可编辑）:', phone);
						} else {
							// 如果没有手机号，显示提示信息
							this.model1.code = '';
							console.log('🚗 [访客角色] 联系电话为空（不可编辑），需要从二维码或用户信息获取');
						}
					} else {
						console.log('🚗 [访客角色] 已有手机号，保持不变（不可编辑）:', this.model1.code);
					}
				} else if (this.currentUserRole === 'owner') {
					// 业主角色：联系电话初始化为空，让业主手动填写访客电话
					this.model1.code = '';
					console.log('👤 [业主角色] 联系电话初始化为空，等待手动填写访客电话');
				} else if (phone) {
					this.model1.code = phone; // 其他角色自动填充
					console.log('👤 [其他角色] 联系电话自动填充:', phone);
				}

				// 检查管家信息（用于访客角色判断预约类型）
				this.checkButlerInfo(userInfo);

				// 更新来访原因选项
				this.updateReasonOptions();

				// 更新停车场信息
				await this.updateParkingLotInfo(userInfo);

				// 如果是业主角色，加载月票信息并自动填充业主地址
				if (this.currentUserRole === 'owner') {
					await this.loadMonthlyTicketInfo();
					// 注意：地址自动填充和业主信息现在在loadMonthlyTicketInfo内部进行
					// 业主地址信息将被标记为不可修改
				}

			} catch (error) {
				console.error('获取用户信息失败:', error);
				this.currentUserRole = 'owner';
			}
		},

		// 检查管家信息
		checkButlerInfo(userInfo) {
			try {
				// 检查是否有管家信息
				const hasButlerInfo = userInfo?.userInfo?.butlerName ||
					userInfo?.userInfo?.butlerPhone ||
					userInfo?.butlerName ||
					userInfo?.butlerPhone ||
					userInfo?.userInfo?.butler_id ||
					userInfo?.butler_id;

				if (hasButlerInfo) {
					console.log('🏠 检测到管家信息:', {
						butlerName: userInfo?.userInfo?.butlerName || userInfo?.butlerName,
						butlerPhone: userInfo?.userInfo?.butlerPhone || userInfo?.butlerPhone,
						butlerId: userInfo?.userInfo?.butler_id || userInfo?.butler_id
					});
				} else {
					console.log('🏠 未检测到管家信息');
				}
			} catch (error) {
				console.error('检查管家信息失败:', error);
			}
		},

		// 🆕 获取微信openid
		getWechatOpenid(userInfo) {
			try {
				// 优先从用户基本信息获取
				const userBasicInfo = uni.getStorageSync('userBasicInfo');
				if (userBasicInfo && userBasicInfo.openid) {
					console.log('✅ 从用户基本信息获取openid:', userBasicInfo.openid);
					return userBasicInfo.openid;
				}

				// 从微信用户信息获取
				const wechatUserInfo = uni.getStorageSync('wechatUserInfo');
				if (wechatUserInfo && wechatUserInfo.openid) {
					console.log('✅ 从微信用户信息获取openid:', wechatUserInfo.openid);
					return wechatUserInfo.openid;
				}

				// 从用户信息的根级别获取
				if (userInfo && userInfo.openid) {
					console.log('✅ 从用户信息根级别获取openid:', userInfo.openid);
					return userInfo.openid;
				}

				// 从用户信息的嵌套级别获取
				if (userInfo && userInfo.userInfo && userInfo.userInfo.openid) {
					console.log('✅ 从用户信息嵌套级别获取openid:', userInfo.userInfo.openid);
					return userInfo.userInfo.openid;
				}

				// 生成临时openid
				const tempOpenid = 'temp_openid_' + Date.now();
				console.warn('⚠️ 无法获取openid，生成临时openid:', tempOpenid);
				return tempOpenid;
			} catch (error) {
				console.error('❌ 获取openid失败:', error);
				return 'temp_openid_' + Date.now();
			}
		},

		// 🆕 获取微信昵称
		getWechatNickname(userInfo) {
			try {
				// 优先从表单中获取（已在getUserRole中设置）
				if (this.form.nickname) {
					console.log('✅ 从表单获取昵称:', this.form.nickname);
					return this.form.nickname;
				}

				// 从用户基本信息获取
				const userBasicInfo = uni.getStorageSync('userBasicInfo');
				if (userBasicInfo && userBasicInfo.nickname) {
					console.log('✅ 从用户基本信息获取昵称:', userBasicInfo.nickname);
					return userBasicInfo.nickname;
				}

				// 从微信用户信息获取
				const wechatUserInfo = uni.getStorageSync('wechatUserInfo');
				if (wechatUserInfo && wechatUserInfo.nickname) {
					console.log('✅ 从微信用户信息获取昵称:', wechatUserInfo.nickname);
					return wechatUserInfo.nickname;
				}

				// 从用户信息的根级别获取
				if (userInfo && userInfo.nickname) {
					console.log('✅ 从用户信息根级别获取昵称:', userInfo.nickname);
					return userInfo.nickname;
				}

				// 从用户信息的嵌套级别获取
				if (userInfo && userInfo.userInfo && userInfo.userInfo.nickname) {
					console.log('✅ 从用户信息嵌套级别获取昵称:', userInfo.userInfo.nickname);
					return userInfo.userInfo.nickname;
				}

				console.log('⚠️ 无法获取昵称，返回空字符串');
				return '';
			} catch (error) {
				console.error('❌ 获取昵称失败:', error);
				return '';
			}
		},

		// 🆕 获取微信unionid
		getWechatUnionid(userInfo) {
			try {
				// 从用户基本信息获取
				const userBasicInfo = uni.getStorageSync('userBasicInfo');
				if (userBasicInfo && userBasicInfo.unionid) {
					console.log('✅ 从用户基本信息获取unionid:', userBasicInfo.unionid);
					return userBasicInfo.unionid;
				}

				// 从微信用户信息获取
				const wechatUserInfo = uni.getStorageSync('wechatUserInfo');
				if (wechatUserInfo && wechatUserInfo.unionid) {
					console.log('✅ 从微信用户信息获取unionid:', wechatUserInfo.unionid);
					return wechatUserInfo.unionid;
				}

				// 从用户信息的根级别获取
				if (userInfo && userInfo.unionid) {
					console.log('✅ 从用户信息根级别获取unionid:', userInfo.unionid);
					return userInfo.unionid;
				}

				// 从用户信息的嵌套级别获取
				if (userInfo && userInfo.userInfo && userInfo.userInfo.unionid) {
					console.log('✅ 从用户信息嵌套级别获取unionid:', userInfo.userInfo.unionid);
					return userInfo.userInfo.unionid;
				}

				console.log('⚠️ 无法获取unionid，返回空字符串');
				return '';
			} catch (error) {
				console.error('❌ 获取unionid失败:', error);
				return '';
			}
		},

		// 🆕 根据用户角色获取微信信息并分配到相应字段
		getWechatInfoByRole(userInfo) {
			try {
				// 获取 wechat_auth_result 中的微信信息
				let wechatAuthResult = {};
				try {
					const authResultStr = uni.getStorageSync('wechat_auth_result');
					if (authResultStr) {
						wechatAuthResult = typeof authResultStr === 'string' ? JSON.parse(authResultStr) : authResultStr;
						console.log('✅ 获取到wechat_auth_result:', wechatAuthResult);
					}
				} catch (error) {
					console.warn('⚠️ wechat_auth_result解析失败:', error);
				}

				// 获取原有手机号（授权获取的）
				const originalPhone = this.model1.code;

				const result = {};

				if (this.currentUserRole === 'manager') {
					// 管家：wechat_auth_result的nickname和openid赋值给auditusername、auditopenid
					if (wechatAuthResult.nickname) {
						result.auditusername = wechatAuthResult.nickname;
						console.log('👨‍💼 [管家] 设置审核用户名(来自wechat_auth_result):', result.auditusername);
					} else {
						// 如果wechat_auth_result中没有昵称，使用原有逻辑作为兜底
						result.auditusername = userInfo.userInfo?.username ||
							userInfo.userInfo?.managerData?.name ||
							userInfo.managerData?.name ||
							userInfo.userName ||
							this.getWechatNickname(userInfo) ||
							'管家用户';
						console.log('👨‍💼 [管家] 设置审核用户名(兜底逻辑):', result.auditusername);
					}

					if (wechatAuthResult.openid) {
						result.auditopenid = wechatAuthResult.openid;
						console.log('👨‍💼 [管家] 设置审核openid:', result.auditopenid);
					}

					// 管家的其他字段 - 只保留数据库中存在的字段
					result.openid = this.getWechatOpenid(userInfo);
					result.visitorphone = originalPhone;
					console.log('👨‍💼 [管家] 已移除nickname和unionid字段（数据库中不存在）');

				} else if (this.currentUserRole === 'owner') {
					// 业主：不使用wechat_auth_result，但需要设置访客姓名
					result.openid = this.getWechatOpenid(userInfo);
					result.visitorname = this.getWechatNickname(userInfo); // 业主预约时，业主姓名作为访客姓名
					result.visitorphone = originalPhone;
					console.log('🏠 [业主] 设置业主姓名为访客姓名:', result.visitorname);
					console.log('🏠 [业主] 已移除nickname和unionid字段（数据库中不存在）');

				} else if (this.currentUserRole === 'visitor') {
					// 访客：wechat_auth_result的nickname和openid赋值给visitorname和openid
					if (wechatAuthResult.nickname) {
						result.visitorname = wechatAuthResult.nickname;
						console.log('🚗 [访客] 设置访客姓名(来自wechat_auth_result):', result.visitorname);
					} else {
						// 如果wechat_auth_result中没有昵称，使用原有逻辑作为兜底
						result.visitorname = this.getWechatNickname(userInfo) || '访客用户';
						console.log('🚗 [访客] 设置访客姓名(兜底逻辑):', result.visitorname);
					}

					if (wechatAuthResult.openid) {
						result.openid = wechatAuthResult.openid;
						console.log('🚗 [访客] 设置访客openid:', result.openid);
					} else {
						// 如果wechat_auth_result中没有openid，使用原有逻辑获取
						result.openid = this.getWechatOpenid(userInfo);
					}

					// 访客的其他字段 - 只保留数据库中存在的字段
					result.visitorphone = originalPhone; // phone还是获取原来授权获取的手机号
					console.log('🚗 [访客] 已移除nickname和unionid字段（数据库中不存在）');

				} else {
					// 默认情况：按访客处理
					result.openid = this.getWechatOpenid(userInfo);
					result.visitorname = this.getWechatNickname(userInfo) || '访客用户';
					result.visitorphone = originalPhone;
					console.log('❓ [未知角色] 按访客处理，设置访客姓名:', result.visitorname);
					console.log('❓ [未知角色] 已移除nickname和unionid字段（数据库中不存在）');
				}

				console.log('📋 [微信信息分配] 角色:', this.currentUserRole, '结果:', result);
				return result;

			} catch (error) {
				console.error('❌ 根据角色获取微信信息失败:', error);
				// 出错时返回兜底结果 - 按访客处理
				return {
					openid: this.getWechatOpenid(userInfo),
					visitorname: this.getWechatNickname(userInfo) || '访客用户',
					visitorphone: this.model1.code
				};
			}
		},

		// 🆕 获取完整的用户信息（供外部调用）
		getCompleteUserInfo() {
			try {
				const userInfo = uni.getStorageSync('userInfo') || {};
				const wechatUserInfo = uni.getStorageSync('wechatUserInfo') || {};
				const userBasicInfo = uni.getStorageSync('userBasicInfo') || {};

				// 构建完整的用户信息对象
				const completeUserInfo = {
					// 基本信息
					phone: userBasicInfo.phone || userInfo.phone || userInfo.userInfo?.phone || '',
					nickname: userBasicInfo.nickname || wechatUserInfo.nickname || userInfo.nickname || userInfo.userInfo?.nickname || '',
					openid: userBasicInfo.openid || wechatUserInfo.openid || userInfo.openid || userInfo.userInfo?.openid || '',
					unionid: userBasicInfo.unionid || wechatUserInfo.unionid || userInfo.unionid || userInfo.userInfo?.unionid || '',
					headimgurl: userBasicInfo.headimgurl || wechatUserInfo.headimgurl || userInfo.headimgurl || userInfo.userInfo?.headimgurl || '',

					// 角色信息
					role: userInfo.role || userInfo.userInfo?.userkind || 'visitor',
					roleText: userInfo.roleText || userInfo.userInfo?.roleText || '',

					// 其他信息
					yardName: userBasicInfo.yardName || userInfo.yardName || '',
					userName: userBasicInfo.userName || userInfo.userName || '',

					// 原始数据引用
					_userInfo: userInfo,
					_wechatUserInfo: wechatUserInfo,
					_userBasicInfo: userBasicInfo,

					// 时间戳
					timestamp: Date.now()
				};

				console.log('✅ [完整用户信息] 已构建完整用户信息:', completeUserInfo);
				return completeUserInfo;
			} catch (error) {
				console.error('❌ [完整用户信息] 获取完整用户信息失败:', error);
				return {
					phone: '',
					nickname: '',
					openid: '',
					unionid: '',
					headimgurl: '',
					role: 'visitor',
					roleText: '',
					yardName: '',
					userName: '',
					timestamp: Date.now(),
					error: error.message
				};
			}
		},

		// 🆕 检查公众号关注状态
		async checkSubscriptionStatus() {
			try {
				console.log('📱 [公众号校验] 开始检查用户公众号关注状态');

				// 获取本地存储的用户信息
				const userInfo = uni.getStorageSync('userInfo') || {};
				const wechatUserInfo = uni.getStorageSync('wechatUserInfo') || {};
				const userBasicInfo = uni.getStorageSync('userBasicInfo') || {};

				// 获取用户手机号、昵称、openid
				const phone = userBasicInfo.phone || userInfo.phone || userInfo.userInfo?.phone || this.model1.code || '';
				const nickname = wechatUserInfo.nickname || userBasicInfo.nickname || userInfo.nickname || userInfo.userInfo?.nickname || this.form.nickname || '';
				const openid = wechatUserInfo.openid || userBasicInfo.openid || userInfo.openid || userInfo.userInfo?.openid || '';

				console.log('📱 [公众号校验] 用户信息:', { phone, nickname, openid });

				// 检查必要信息是否完整
				if (!phone && !nickname && !openid) {
					console.warn('⚠️ [公众号校验] 用户信息不完整，跳过公众号关注检查');
					return { canSubmit: true, message: '用户信息不完整，跳过检查' };
				}

				this.checkingSubscription = true;

				uni.showLoading({
					title: '检查关注状态...',
					mask: true
				});

				// 调用后端API查询user_mapper表的is_followed字段
				const response = await uni.request({
					url: 'https://www.xuerparking.cn:8543/parking/user/checkFollowStatus',
					method: 'POST',
					data: {
						phone: phone,
						nickname: nickname,
						openid: openid
					},
					header: {
						'content-type': 'application/json'
					}
				});

				console.log('📱 [公众号校验] 后端响应:', response.data);

				uni.hideLoading();

				// 解析响应结果
				if (response.data.data && response.data.data.code === '0') {
					const isFollowed = response.data.data.data && response.data.data.data.is_followed === 1;

					if (isFollowed) {
						console.log('✅ [公众号校验] 用户已关注公众号，允许提交预约');
						return { canSubmit: true, message: '用户已关注公众号' };
					} else {
						console.log('❌ [公众号校验] 用户未关注公众号，显示关注引导');
						this.showSubscriptionGuideModal();
						return { canSubmit: false, message: '用户未关注公众号' };
					}
				} else {
					console.warn('⚠️ [公众号校验] 查询接口返回异常，默认允许提交');
					return { canSubmit: true, message: '查询接口异常，允许提交' };
				}

			} catch (error) {
				console.error('❌ [公众号校验] 检查关注状态失败:', error);
				uni.hideLoading();

				// 网络错误时询问用户是否继续
				return new Promise((resolve) => {
					uni.showModal({
						title: '网络提醒',
						content: '无法检查公众号关注状态，可能是网络连接问题。\n\n为了及时接收预约通知，建议先关注公众号。\n\n是否仍要继续提交预约？',
						showCancel: true,
						cancelText: '稍后重试',
						confirmText: '继续提交',
						success: (res) => {
							if (res.confirm) {
								resolve({ canSubmit: true, message: '用户选择继续提交' });
							} else {
								resolve({ canSubmit: false, message: '用户选择稍后重试' });
							}
						}
					});
				});
			} finally {
				this.checkingSubscription = false;
			}
		},

		// 🆕 显示公众号关注引导模态框
		showSubscriptionGuideModal() {
			this.showSubscriptionGuide = true;
		},

		// 🆕 关闭公众号关注引导
		closeSubscriptionGuide() {
			this.showSubscriptionGuide = false;
		},

		// 🆕 检查公众号关注状态（用户点击"我已关注"）
		async checkSubscriptionStatusInModal() {
			if (this.checkingSubscription) return;

			this.checkingSubscription = true;

			try {
				uni.showLoading({
					title: '验证中...',
					mask: true
				});

				// 获取用户信息
				const userInfo = uni.getStorageSync('userInfo') || {};
				const wechatUserInfo = uni.getStorageSync('wechatUserInfo') || {};
				const userBasicInfo = uni.getStorageSync('userBasicInfo') || {};

				const phone = userBasicInfo.phone || userInfo.phone || userInfo.userInfo?.phone || this.model1.code || '';
				const nickname = wechatUserInfo.nickname || userBasicInfo.nickname || userInfo.nickname || userInfo.userInfo?.nickname || this.form.nickname || '';
				const openid = wechatUserInfo.openid || userBasicInfo.openid || userInfo.openid || userInfo.userInfo?.openid || '';

				// 重新检查关注状态
				const response = await uni.request({
					url: 'https://www.xuerparking.cn:8543/parking/user/checkFollowStatus',
					method: 'POST',
					data: {
						phone: phone,
						nickname: nickname,
						openid: openid
					},
					header: {
						'content-type': 'application/json'
					}
				});

				uni.hideLoading();

				if (response.data.data && response.data.data.code === '0') {
					const isFollowed = response.data.data.data && response.data.data.data.is_followed === 1;

					if (isFollowed) {
						// 关注成功，关闭引导界面并继续提交预约
						this.closeSubscriptionGuide();
						uni.showToast({
							title: '验证成功！',
							icon: 'success',
							duration: 1500
						});

						// 延迟继续提交预约
						setTimeout(async () => {
							// 🆕 重新设置提交状态
							this.isSubmittingAppointment = true;
							const appointmentData = await this.buildAppointmentData();
							this.submitAppointment(appointmentData);
						}, 1500);
					} else {
						uni.showModal({
							title: '尚未检测到关注',
							content: '请先扫描上方二维码关注公众号，关注后您的信息会自动同步到我们的系统中。',
							showCancel: false,
							confirmText: '知道了'
						});
					}
				} else {
					uni.showModal({
						title: '验证失败',
						content: '检查关注状态时出现异常，请稍后重试。',
						showCancel: false,
						confirmText: '知道了'
					});
				}

			} catch (error) {
				console.error('❌ [公众号校验] 验证关注状态失败:', error);
				uni.hideLoading();

				uni.showModal({
					title: '验证失败',
					content: '网络连接异常，请检查网络后重试。',
					showCancel: false,
					confirmText: '知道了'
				});
			} finally {
				this.checkingSubscription = false;
			}
		},

		// 处理扫码传入的管家信息
		processButlerInfo(decodedParams) {
			try {
				console.log('🏠 处理扫码传入的管家信息:', decodedParams);

				// 获取当前用户信息
				const userInfo = uni.getStorageSync('userInfo') || {};

				// 更新用户信息中的管家信息
				if (decodedParams.butlerName) {
					if (userInfo.userInfo) {
						userInfo.userInfo.butlerName = decodedParams.butlerName;
					} else {
						userInfo.butlerName = decodedParams.butlerName;
					}
				}

				if (decodedParams.butlerPhone) {
					if (userInfo.userInfo) {
						userInfo.userInfo.butlerPhone = decodedParams.butlerPhone;
					} else {
						userInfo.butlerPhone = decodedParams.butlerPhone;
					}
				}

				if (decodedParams.butlerId) {
					if (userInfo.userInfo) {
						userInfo.userInfo.butler_id = decodedParams.butlerId;
					} else {
						userInfo.butler_id = decodedParams.butlerId;
					}
				}

				// 保存更新后的用户信息
				uni.setStorageSync('userInfo', userInfo);

				console.log('🏠 管家信息已更新到用户信息中:', {
					butlerName: decodedParams.butlerName,
					butlerPhone: decodedParams.butlerPhone,
					butlerId: decodedParams.butlerId
				});

				// 显示提示信息
				if (decodedParams.butlerName) {
					uni.showToast({
						title: `管家信息已加载: ${decodedParams.butlerName}`,
						icon: 'success',
						duration: 2000
					});
				}

			} catch (error) {
				console.error('处理管家信息失败:', error);
				uni.showToast({
					title: '管家信息处理失败',
					icon: 'none'
				});
			}
		},

		// 🆕 处理管家小区信息
		async handleManagerCommunityInfo(userInfo) {
			try {
				console.log('🏠 开始处理管家小区信息:', userInfo);
				console.log('🔍 [调试] userInfo.userInfo:', userInfo.userInfo);
				console.log('🔍 [调试] userInfo.managerData:', userInfo.managerData);

				// 从用户信息中获取管家的小区信息（不设置硬编码默认值）
				let managerCommunity = '';
				let province = '';
				let city = '';
				let district = '';

				// 🔧 修复：尝试从多个可能的位置获取管家小区信息
				if (userInfo.userInfo && userInfo.userInfo.community) {
					managerCommunity = userInfo.userInfo.community;
					province = userInfo.userInfo.province || '';
					city = userInfo.userInfo.city || '';
					district = userInfo.userInfo.district || '';
					console.log('✅ 从userInfo.userInfo中获取到管家小区:', managerCommunity);
				} else if (userInfo.community) {
					managerCommunity = userInfo.community;
					province = userInfo.province || '';
					city = userInfo.city || '';
					district = userInfo.district || '';
					console.log('✅ 从userInfo中获取到管家小区:', managerCommunity);
				}
				// 🆕 尝试从管家验证数据中获取（managerData）
				else if (userInfo.managerData) {
					managerCommunity = userInfo.managerData.community || '';
					province = userInfo.managerData.province || '';
					city = userInfo.managerData.city || '';
					district = userInfo.managerData.district || '';
					console.log('✅ 从userInfo.managerData中获取到管家小区:', managerCommunity);
				}
				// 🆕 尝试从全局存储的管家数据中获取
				else {
					const storedManagerData = uni.getStorageSync('managerData');
					if (storedManagerData && storedManagerData.community) {
						managerCommunity = storedManagerData.community;
						province = storedManagerData.province || '';
						city = storedManagerData.city || '';
						district = storedManagerData.district || '';
						province = storedManagerData.province || province;
						city = storedManagerData.city || city;
						district = storedManagerData.district || district;
						console.log('✅ 从存储的管家数据中获取到小区:', managerCommunity);
					} else {
						console.log('⚠️ 未找到管家小区信息，使用默认值:', managerCommunity);
					}
				}

				// 构建管家小区的parkInfo，强制覆盖本地存储
				const managerParkInfo = {
					name: managerCommunity,
					fullName: `${managerCommunity}-停车场`,
					province: province,
					city: city,
					district: district,
					fullAddress: `${province}${city}${district}${managerCommunity}`,
					isManagerCommunity: true // 标记这是管家的小区信息
				};

				// 保存到本地存储
				uni.setStorageSync('parkInfo', managerParkInfo);
				console.log('✅ 管家小区信息已保存到本地存储:', managerParkInfo);

				// 立即更新停车场信息显示
				this.parkingLotInfo = {
					fullName: managerParkInfo.fullName,
					fullAddress: managerParkInfo.fullAddress,
					buildingInfo: this.parkingLotInfo.buildingInfo || ''
				};

				// 更新页面标题
				uni.setNavigationBarTitle({
					title: managerParkInfo.fullName
				});

				console.log('✅ 管家停车场信息已更新:', this.parkingLotInfo);

			} catch (error) {
				console.error('❌ 处理管家小区信息失败:', error);
			}
		},

		// 更新停车场信息
		async updateParkingLotInfo(userInfo) {
			try {
				const addressInfo = await this.getAddressInfo(userInfo);

				// 检查本地存储中是否有更新的小区信息
				const parkInfo = uni.getStorageSync('parkInfo');
				// 如果本地存储有parkInfo，优先使用它的信息
				if (parkInfo && parkInfo.name) {
					// 构建停车场全名
					const fullName = parkInfo.fullName || `${parkInfo.city || ''}${parkInfo.name}-停车场`;

					// 构建完整地址
					let fullAddress = '';
					if (parkInfo.province && parkInfo.city) {
						fullAddress = `${parkInfo.province}${parkInfo.city}${parkInfo.district || ''}`;
					} else if (parkInfo.fullAddress) {
						fullAddress = parkInfo.fullAddress;
					} else {
						// fullAddress = '黑龙江省哈尔滨市香坊区和平路115号';
					}

					// 更新停车场信息
					this.parkingLotInfo = {
						fullName: fullName,
						fullAddress: fullAddress,
						buildingInfo: this.parkingLotInfo.buildingInfo || ''
					};

					// 🆕 更新页面标题
					uni.setNavigationBarTitle({
						title: fullName
					});

					console.log("🔍 使用本地存储更新的停车场信息:", this.parkingLotInfo);
					return;
				}

				// 如果没有本地存储的信息，使用用户信息中的地址
				// 构建停车场全名
				let fullName = '';
				if (addressInfo.city && addressInfo.community) {
					fullName = `${addressInfo.city}${addressInfo.community}-停车场`;
					console.log("🔍 使用用户信息构建停车场名称:", fullName);
				} else if (addressInfo.community) {
					// 如果只有小区名称，也使用它
					fullName = `${addressInfo.community}-停车场`;
					console.log("🔍 使用小区名称构建停车场名称:", fullName);
				} else {
					// 实在没有信息时，使用通用名称
					fullName = '停车场';
					console.log("🔍 使用通用停车场名称:", fullName);
				}

				// 构建完整地址
				let fullAddress = '';
				const hasProvince = Boolean(addressInfo.province);
				const hasCity = Boolean(addressInfo.city);

				if (hasProvince && hasCity) {
					fullAddress = `${addressInfo.province}${addressInfo.city}`;
					if (addressInfo.district) {
						fullAddress += addressInfo.district;
					}
					// 添加小区信息
					if (addressInfo.community) {
						fullAddress += addressInfo.community;
					}
					console.log("🔍 使用用户信息构建地址:", fullAddress);
				} else {
					console.log("🔍 使用默认地址:", fullAddress);
				}

				// 构建楼栋信息
				let buildingInfo = '';
				if (addressInfo.building) {
					buildingInfo = `${addressInfo.building}栋`;
					if (addressInfo.units) {
						buildingInfo += `${addressInfo.units}单元`;
					}
					if (addressInfo.floor) {
						buildingInfo += `${addressInfo.floor}层`;
					}
					if (addressInfo.room) {
						buildingInfo += `${addressInfo.room}室`;
					}
				}

				// 更新停车场信息
				this.parkingLotInfo = {
					fullName: fullName,
					fullAddress: fullAddress,
					buildingInfo: buildingInfo
				};
			} catch (error) {
				console.error('❌ 更新停车场信息失败:', error);
			}
		},

		// 根据角色更新来访原因选项
		updateReasonOptions() {
			const reasonOptions = {
				'visitor': [{
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
				'owner': [{
					name: '业主临时停车'
				},
				{
					name: '朋友来访'
				},
				{
					name: '家政服务'
				},
				{
					name: '装修施工'
				},
				{
					name: '其他需要'
				}
				],
				'manager': [{
					name: '管理巡查'
				},
				{
					name: '设施维护'
				},
				{
					name: '安全检查'
				},
				{
					name: '紧急处理'
				},
				{
					name: '其他工作'
				}
				]
			};

			this.actions = reasonOptions[this.currentUserRole] || reasonOptions['visitor'];
		},

		// TabBar切换事件处理
		onTabChange(tabInfo) {
			// TabBar切换处理
		},

		// 🚫 强制隐藏系统TabBar
		hideSystemTabBar() {
			try {
				console.log('🚫 [预约页面] 尝试隐藏系统TabBar');

				// 尝试通过uni API隐藏TabBar
				if (uni.hideTabBar) {
					uni.hideTabBar({
						animation: false,
						success: () => {
							console.log('✅ [预约页面] 成功隐藏系统TabBar');
						},
						fail: (err) => {
							console.warn('⚠️ [预约页面] 隐藏系统TabBar失败:', err);
						}
					});
				}

				// 延迟再次尝试隐藏
				setTimeout(() => {
					if (uni.hideTabBar) {
						uni.hideTabBar({ animation: false });
					}
				}, 100);

			} catch (error) {
				console.error('❌ [预约页面] 隐藏系统TabBar出错:', error);
			}
		},

		selectDate(index) {
			this.activeDate = index;
			this.activeTimeSlot = -1; // 重置时间段选择
			this.checkboxValue6 = this.checkboxList6.map(item => item.name);
		},

		// 选择时间段
		selectTimeSlot(index) {
			this.activeTimeSlot = index;
		},

		changeCur(index) {
			this.cur = index;
			this.toChange();
		},
		toChange() {
			this.$emit('change', this.cur)
		},
		changeValue(v) {
			let max = Math.min(v.length, this.max);
			for (let i = 0; i < max; i++) {
				this.values[i] = v.charAt(i)
			}
			let cur = this.values.findIndex(x => !x)
			this.cur = cur === -1 ? this.max - 1 : cur;
			this.toChange()
		},
		click(e) {
			let urls = '';
			if (e == 0) {
				urls = "";
			}
			if (e == 1) {
				urls = "/pages/site/price_details"
			}
			if (e == 2) {
				urls = "/pages/site/car_log"
			}
		},
		afterRead(event) {
			this.fileList1.push({
				url: event.file,
				status: 'uploading',
				message: '上传中'
			})
		},
		navigateBack() {
			uni.navigateBack()
		},
		reasonSelect(e) {
			this.model1.reason = e.name
			this.$refs.form1.validateField('userInfo.reason')
		},
		change(e) {
			// console.log(e);
		},
		formatter(day) {
			const d = new Date()
			let month = d.getMonth() + 1
			const date = d.getDate()
			if (day.month == month && day.day == date + 3) {
				day.bottomInfo = '有优惠'
				day.dot = true
			}
			return day
		},
		codeChange(text) {
			this.tips = text;
		},
		open() {
			this.showPopup = true
			// this.showContent = true
		},
		async submit() {
			// 防止重复提交
			if (this.isSubmittingAppointment) {
				uni.showToast({
					title: '正在提交，请稍候...',
					icon: 'none'
				});
				return;
			}

			// 表单验证
			if (!this.validateForm()) {
				return;
			}

			// 注：访客的二维码扫描验证已在页面加载时的checkPageAccess中完成
			
			// 🚫 检查车牌是否在黑名单中
			const blacklistCheck = await this.checkBlacklistStatus();
			if (!blacklistCheck.canSubmit) {
				return; // 如果车牌在黑名单中，不允许提交
			}

			// 检查手机号历史记录
			const historyCheck = await this.checkPhoneHistory();
			if (!historyCheck.canSubmit) {
				return; // 如果不能提交，方法内部已经显示了相应提示
			}

			// 管家预约时检查地址冲突
			if (this.currentUserRole === 'manager') {
				const addressCheck = await this.checkAddressConflict();
				if (!addressCheck.canSubmit) {
					return; // 如果不能提交，方法内部已经显示了相应提示
				}
			}

			// 🆕 公众号关注校验
			const subscriptionCheck = await this.checkSubscriptionStatus();
			if (!subscriptionCheck.canSubmit) {
				return; // 如果未关注公众号，显示引导界面
			}

			// 🆕 设置提交状态
			this.isSubmittingAppointment = true;

			try {
				// 构建预约数据
				const appointmentData = await this.buildAppointmentData();

				// 调用预约接口
				await this.submitAppointment(appointmentData);
			} catch (error) {
				console.error('❌ [预约提交] 提交失败:', error);
				this.isSubmittingAppointment = false; // 发生错误时重置状态
			}
		},

		// 表单验证
		validateForm() {
			// 检查日期选择
			if (this.activeDate === -1) {
				uni.showToast({
					title: '请选择预约日期',
					icon: 'none',
					duration: 2000
				});
				return false;
			}

			// 检查时间段选择
			// if (this.activeTimeSlot === -1) {
			// 	uni.showToast({
			// 		title: '请选择预约时段',
			// 		icon: 'none',
			// 		duration: 2000
			// 	});
			// 	return false;
			// }

			// 检查电话号码
			if (!this.model1.code) {
				uni.showToast({
					title: '请确认联系电话',
					icon: 'none',
					duration: 2000
				});
				return false;
			}

			// 检查来访原因
			if (!this.model1.reason) {
				uni.showToast({
					title: '请选择来访原因',
					icon: 'none',
					duration: 2000
				});
				return false;
			}

			// 检查车牌号
			const plateNumber = this.getPlateNumber();
			if (!plateNumber || plateNumber.length < 7) {
				uni.showToast({
					title: '请输入完整的车牌号',
					icon: 'none',
					duration: 2000
				});
				return false;
			}

			return true;
		},

		// 🔍 检查访客二维码访问权限
		async checkVisitorQrAccess() {
			try {
				console.log('🔍 [访客验证] 开始检查访客二维码扫描权限');
				
				// 只从本地存储获取当前扫码session的信息
				const scannedAddressInfo = uni.getStorageSync('scannedAddressInfo') || {};
				
				console.log('📍 [访客验证] 当前扫码信息:', scannedAddressInfo);
				
				// 严格验证：必须有车场信息且来自二维码扫描
				const community = scannedAddressInfo.community;
				const source = scannedAddressInfo.source; // 应该是 'qr_scan'
				const timestamp = scannedAddressInfo.timestamp;
				
				// 验证1: 必须有车场名称
				if (!community || community.trim() === '' || community === '-停车场') {
					console.warn('❌ [访客验证] 访客未通过二维码扫描进入，无有效车场信息');
					console.log('   - community:', community);
					console.log('   - source:', source);
					
					// 显示全屏锁定页面
					this.showVisitorAccessDenied();
					
					return {
						canSubmit: false,
						message: '访客必须通过扫描车场二维码才能预约'
					};
				}
				
				// 验证2: 必须标记为二维码扫描来源
				if (source !== 'qr_scan') {
					console.warn('❌ [访客验证] 车场信息不是来自二维码扫描');
					console.log('   - source:', source);
					
					// 显示全屏锁定页面
					this.showVisitorAccessDenied();
					
					return {
						canSubmit: false,
						message: '车场信息不是来自二维码扫描'
					};
				}
				
				// 验证3: 检查扫码信息的时效性（24小时内）
				if (!timestamp) {
					console.warn('❌ [访客验证] 扫码信息无时间戳');
					
					// 显示二维码过期锁定页面
					this.lockScreenConfig = {
						icon: '⏰',
						title: '二维码信息无效',
						message: '二维码信息无效，请重新扫描车场二维码',
						tips: [
							'请联系管家获取专用预约二维码',
							'每个二维码24小时内有效',
							'扫码后即可预约访问'
						],
						showContactButton: true,
						contactButtonText: '联系管家获取二维码',
						footerText: '如有疑问请联系小区管家',
						isQrUsed: false
					};
					this.showLockScreen = true;
					
					return {
						canSubmit: false,
						message: '扫码信息无时间戳'
					};
				}
				
				const elapsedTime = Date.now() - timestamp;
				const maxAge = 24 * 60 * 60 * 1000; // 24小时
				
				if (elapsedTime > maxAge) {
					console.warn('⚠️ [访客验证] 二维码扫描信息已过期');
					console.log('   - 扫描时间:', new Date(timestamp));
					console.log('   - 已过时长:', Math.floor(elapsedTime / 1000 / 60), '分钟');
					
					// 显示二维码过期锁定页面
					this.lockScreenConfig = {
						icon: '⏰',
						title: '二维码已过期',
						message: '您的预约二维码已过期（有效期24小时），请重新扫描车场二维码',
						tips: [
							'二维码有效期为24小时',
							'请联系管家获取新的预约二维码',
							'扫码后即可预约访问'
						],
						showContactButton: true,
						contactButtonText: '联系管家获取二维码',
						footerText: '如有疑问请联系小区管家',
						isQrUsed: false
					};
					this.showLockScreen = true;
					
					return {
						canSubmit: false,
						message: '二维码扫描信息已过期'
					};
				}
				
				console.log('✅ [访客验证] 访客通过二维码扫描进入，车场:', community);
				console.log('   - 扫描时间:', new Date(timestamp));
				console.log('   - 有效时长:', Math.floor((maxAge - elapsedTime) / 1000 / 60), '分钟');
				
				return {
					canSubmit: true,
					message: '访客二维码验证通过',
					community
				};
				
			} catch (error) {
				console.error('❌ [访客验证] 检查访客权限时发生异常:', error);
				
				// 发生异常时，显示锁定页面
				this.lockScreenConfig = {
					icon: '❌',
					title: '验证失败',
					message: '无法验证您的访客权限，请重新扫描车场二维码',
					tips: [
						'系统验证异常，请稍后重试',
						'请确保通过扫描二维码进入',
						'如持续失败请联系管家'
					],
					showContactButton: true,
					contactButtonText: '联系管家获取帮助',
					footerText: '如有疑问请联系小区管家',
					isQrUsed: false
				};
				this.showLockScreen = true;
				
				return {
					canSubmit: false,
					message: '访客权限验证异常'
				};
			}
		},

		// 🚫 检查车牌黑名单状态
		async checkBlacklistStatus() {
			try {
				const plateNumber = this.getPlateNumber();
				if (!plateNumber) {
					return { canSubmit: true, message: '车牌号为空，跳过黑名单检查' };
				}

				console.log('🚫 [黑名单检查] 开始检查车牌:', plateNumber);

				uni.showLoading({
					title: '检查黑名单状态...',
					mask: true
				});

				// 🆕 首先调用 getParkBlack 接口检查黑名单
				const parkBlackResult = await this.checkParkBlacklist(plateNumber);
				if (!parkBlackResult.canSubmit) {
					uni.hideLoading();
					return parkBlackResult;
				}

				// 查询违规记录中的黑名单标记
				const params = {
					plateNumber: plateNumber,
					pageSize: 100, // 获取足够多的记录
					page: 1
				};

				const data = await violationApi.getViolations(params);
				console.log("data数据：",data)
				// 检查响应数据格式
				let records = [];
				if (data.list) {
					records = data.list;
				} else if (data?.records) {
					records = data.records;
				} else if (data?.list) {
					records = data.list;
				} else if (Array.isArray(data.data)) {
					records = data.data;
				} else if (Array.isArray(data)) {
					records = data;
				}

				console.log('🚫 [黑名单检查] 查询到违规记录:', records.length, '条');

				// 检查是否有should_blacklist为1的记录
				const blacklistRecords = records.filter(record =>
					record.shouldBlacklist === 1 || record.shouldBlacklist === '1' || record.shouldBlacklist === true
				);

				uni.hideLoading();

				if (blacklistRecords.length > 0) {
					console.log('🚫 [黑名单检查] 发现黑名单车辆，共', blacklistRecords.length, '条记录');

					// 显示黑名单提示
					uni.showModal({
						title: '⚠️ 车牌已拉黑',
						content: `车牌号 ${plateNumber} 已被列入违规记录，无法进行预约。\n\n原因：存在违规记录\n记录数量：${blacklistRecords.length} 条\n\n如有疑问，请联系管理员处理。`,
						showCancel: false,
						confirmText: '我知道了',
						confirmColor: '#e74c3c'
					});

					return {
						canSubmit: false,
						message: `车牌 ${plateNumber} 在黑名单中，不允许预约`
					};
				}

				console.log('🚫 [黑名单检查] 车牌未在黑名单中，允许预约');
				return {
					canSubmit: true,
					message: '车牌未在黑名单中，可以预约'
				};

			} catch (error) {
				console.error('🚫 [黑名单检查] 检查失败:', error);

				uni.hideLoading();

				// 显示错误提示并询问是否继续
				return new Promise((resolve) => {
					uni.showModal({
						title: '⚠️ 黑名单检查失败',
						content: '无法检查车牌黑名单状态，可能是网络连接问题。\n\n为确保预约顺利，建议检查网络后重试。\n\n是否仍要继续提交预约？',
						showCancel: true,
						cancelText: '重新检查',
						confirmText: '继续预约',
						confirmColor: '#007aff',
						success: (res) => {
							if (res.confirm) {
								resolve({
									canSubmit: true,
									message: '用户选择跳过黑名单检查'
								});
							} else {
								resolve({
									canSubmit: false,
									message: '用户选择重新检查'
								});
							}
						}
					});
				});
			}
		},

		// 检查地址冲突（管家预约专用）
		async checkAddressConflict() {
			try {
				uni.showLoading({
					title: '检查地址冲突...',
					mask: true
				});

				// 获取当前要预约的地址信息
				const currentAddress = this.getCurrentAddressInfo();

				// 调用API查询该地址的所有预约记录
				const { appointmentAPI } = require('@/config/api.js');

				// 构建地址查询参数
				const addressQuery = {
					community: currentAddress.community,
					building: currentAddress.building,
					units: currentAddress.units,
					floor: currentAddress.floor,
					room: currentAddress.room
				};

				console.log('🏠 [地址冲突检查] 查询地址:', addressQuery);

				// 查询该地址的预约记录
				const addressRecords = await appointmentAPI.getListByAddress(addressQuery);

				uni.hideLoading();

				// 解析响应数据
				let recordList = [];
				if (addressRecords && addressRecords.data) {
					if (Array.isArray(addressRecords.data.data)) {
						recordList = addressRecords.data.data;
					} else if (Array.isArray(addressRecords.data)) {
						recordList = addressRecords.data;
					}
				}

				console.log('🏠 [地址冲突检查] 查询到的记录:', recordList);

				if (recordList.length === 0) {
					return {
						canSubmit: true,
						message: '该地址无冲突记录，可以提交'
					};
				}

				// 筛选近期有效记录（30天内）
				const recentRecords = this.filterRecentAndValidRecords(recordList);

				if (recentRecords.length === 0) {
					return {
						canSubmit: true,
						message: '该地址无近期有效记录，可以提交'
					};
				}

				// 检查是否有不同业主的有效预约
				const currentOwnerPhone = this.selectedOwnerInfo ? this.selectedOwnerInfo.ownerphone : '';

				for (let record of recentRecords) {
					const recordOwnerPhone = record.ownerphone || '';
					const actualStatus = this.getRecordStatus(record);

					// 如果是不同业主且有有效预约，则不允许预约
					if (recordOwnerPhone && recordOwnerPhone !== currentOwnerPhone) {
						// 检查状态是否为有效状态
						if (['有效', '待审批', '审核中', '待审批', '审批中', '已通过', '审核通过', '通过', '审批通过', '已入场', '入场', '在场'].includes(actualStatus)) {

							const recordInfo = this.formatRecordInfo(record);

							return new Promise((resolve) => {
								uni.showModal({
									title: '地址冲突提醒',
									content: `该地址已有其他业主的有效预约：\n${recordInfo}\n\n相同地址的不同业主不能同时预约，请选择其他时间或联系管理员处理。`,
									showCancel: false,
									confirmText: '我知道了',
									success: () => {
										resolve({
											canSubmit: false,
											message: '存在地址冲突的预约记录'
										});
									}
								});
							});
						}
					}
				}

				console.log('🏠 [地址冲突检查] 检查通过，允许提交');
				return {
					canSubmit: true,
					message: '地址冲突检查通过，可以提交'
				};

			} catch (error) {
				uni.hideLoading();
				console.error('🏠 [地址冲突检查] 检查失败:', error);

				// 如果检查失败，为了安全起见，仍然允许提交，但记录错误
				uni.showToast({
					title: '地址冲突检查失败，请联系管理员',
					icon: 'none',
					duration: 3000
				});

				return {
					canSubmit: true,
					message: '地址冲突检查失败，但允许提交'
				};
			}
		},

		// 获取当前地址信息
		getCurrentAddressInfo() {
			// 如果管家选择了业主，使用业主的地址信息
			if (this.selectedOwnerInfo) {
				return {
					community: this.selectedOwnerInfo.community || this.currentCommunityName,
					building: this.selectedOwnerInfo.building || '',
					units: this.selectedOwnerInfo.units || '',
					floor: this.selectedOwnerInfo.floor || '',
					room: this.selectedOwnerInfo.roomnumber || ''
				};
			}

			// 否则使用表单中的地址信息
			return {
				community: this.form.addressInfo.community || this.currentCommunityName,
				building: this.form.addressInfo.building || '',
				units: this.form.addressInfo.units || '',
				floor: this.form.addressInfo.floor || '',
				room: this.form.addressInfo.roomnumber || ''
			};
		},

		// 检查手机号历史记录
		async checkPhoneHistory() {
			try {
				console.log('📱 [预约检查] 开始查询手机号历史记录:', this.model1.code);

				uni.showLoading({
					title: '检查历史记录...',
					mask: true
				});

				// 调用API查询当前手机号的预约记录
				const {
					appointmentAPI
				} = require('@/config/api.js');
				const historyData = await appointmentAPI.getListByPhone(this.model1.code);

				uni.hideLoading();

				// 解析嵌套的数据结构
				let recordList = [];
				if (historyData && historyData.data) {
					// 检查三层嵌套结构 {code: "0", msg: "成功", data: {code: 0, msg: "执行成功", data: {data: Array}}}
					if (historyData.data.data && historyData.data.data.data && Array.isArray(historyData.data.data
						.data)) {
						recordList = historyData.data.data.data;
					}
					// 检查二层嵌套结构 {code: "0", msg: "成功", data: {code: 0, msg: "执行成功", data: Array}}
					else if (historyData.data.data && Array.isArray(historyData.data.data)) {
						recordList = historyData.data.data;
					}
					// 检查简单结构 {code: "0", msg: "成功", data: Array}
					else if (Array.isArray(historyData.data)) {
						recordList = historyData.data;
					}
				}

				// 如果没有历史记录，允许提交
				if (!recordList || recordList.length === 0) {
					return {
						canSubmit: true,
						message: '无历史记录，可以提交'
					};
				}

				// 筛选近期记录（30天内）和有效记录
				console.log('📱 [预约检查] 查询到原始记录数量:', recordList.length);
				const recentRecords = this.filterRecentAndValidRecords(recordList);
				console.log('📱 [预约检查] 筛选后记录数量:', recentRecords.length);

				if (recentRecords.length === 0) {
					return {
						canSubmit: true,
						message: '无近期有效记录，可以提交'
					};
				}

				// 获取当前要预约的车牌号
				const currentPlateNumber = this.getPlateNumber();

				// 检查是否有相同车牌的记录，支持多种手机号字段
				const samePhoneRecords = recentRecords.filter(record => {
					const recordPhone = record.visitorphone || record.ownerphone || record.phone;
					return recordPhone === this.model1.code;
				});

				const samePlateRecords = recentRecords.filter(record =>
					record.platenumber === currentPlateNumber
				);

				// 检查手机号相关的记录
				for (let record of samePhoneRecords) {
					// 获取实际的状态值，优先检查auditStatus和venuestatus
					const actualStatus = this.getRecordStatus(record);
					const checkResult = await this.checkRecordStatus(actualStatus, record, '手机号');
					if (!checkResult.canSubmit) {
						return checkResult;
					}
				}

				// 检查车牌相关的记录（如果手机号不同但车牌相同）
				for (let record of samePlateRecords) {
					const recordPhone = record.visitorphone || record.ownerphone || record.phone;
					if (recordPhone !== this.model1.code) {
						// 获取实际的状态值
						const actualStatus = this.getRecordStatus(record);
						const checkResult = await this.checkRecordStatus(actualStatus, record, '车牌号');
						if (!checkResult.canSubmit) {
							return checkResult;
						}
					}
				}

				console.log('📋 [预约提交] 所有记录检查通过，允许提交');
				return {
					canSubmit: true,
					message: '历史记录检查通过，可以提交'
				};

			} catch (error) {
				uni.hideLoading();
				console.error('📋 [预约提交] 检查历史记录失败:', error);

				// 如果查询失败，询问用户是否继续
				return new Promise((resolve) => {
					uni.showModal({
						title: '网络提醒',
						content: '无法查询历史预约记录，可能是网络连接问题。\n\n为确保预约顺利，建议检查网络后重试。\n\n是否仍要继续提交预约？',
						showCancel: true,
						cancelText: '稍后重试',
						confirmText: '继续提交',
						success: (res) => {
							if (res.confirm) {
								resolve({
									canSubmit: true,
									message: '用户选择继续提交'
								});
							} else {
								resolve({
									canSubmit: false,
									message: '用户选择稍后重试'
								});
							}
						}
					});
				});
			}
		},

		// 筛选近期有效记录
		filterRecentAndValidRecords(recordList) {
			const now = new Date();
			const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

			// 🆕 获取当前业主的车场名称
			const currentParkingLotName = this.userInfo?.lotname || this.userInfo?.parkingLotName || '';
			console.log('🏢 [记录筛选] 当前业主车场名称:', currentParkingLotName);

			return recordList.filter(record => {
				// 🆕 首先通过车场名称筛选 - 只保留与当前业主车场名称一致的记录
				const recordParkingLotName = record.lotname || record.parkingLotName || record.parkinglotname || '';
				if (currentParkingLotName && recordParkingLotName && recordParkingLotName !== currentParkingLotName) {
					console.log('🏢 [记录筛选] 车场名称不匹配，跳过记录:', {
						recordParkingLot: recordParkingLotName,
						currentParkingLot: currentParkingLotName,
						plateNumber: record.platenumber,
						visitDate: record.visitdate
					});
					return false;
				} else if (currentParkingLotName && recordParkingLotName) {
					console.log('🏢 [记录筛选] 车场名称匹配，保留记录:', {
						recordParkingLot: recordParkingLotName,
						currentParkingLot: currentParkingLotName,
						plateNumber: record.platenumber,
						visitDate: record.visitdate
					});
				}

				// 筛选条件：记录创建时间在30天内
				let recordDate;
				try {
					// 尝试解析recorddate字段
					if (record.recorddate) {
						recordDate = new Date(record.recorddate);
					} else if (record.visitdate) {
						// 如果没有recorddate，使用visitdate
						const visitDateStr = record.visitdate.includes(' - ') ?
							record.visitdate.split(' - ')[0] :
							record.visitdate;
						recordDate = new Date(visitDateStr);
					} else {
						// 如果都没有，跳过这个记录
						return false;
					}

					// 检查日期是否有效
					if (isNaN(recordDate.getTime())) {
						return false;
					}

					// 只保留30天内的记录
					return recordDate >= thirtyDaysAgo;
				} catch (error) {
					return false;
				}
			}).sort((a, b) => {
				// 按记录时间倒序排列，最新的在前面
				try {
					const dateA = new Date(a.recorddate || a.visitdate);
					const dateB = new Date(b.recorddate || b.visitdate);
					return dateB.getTime() - dateA.getTime();
				} catch (error) {
					return 0;
				}
			});
		},

		// 检查记录状态
		async checkRecordStatus(status, record, recordType = '手机号') {
			// 格式化时间显示
			const formatTime = (dateTimeStr) => {
				if (!dateTimeStr) return '未知时间';
				try {
					let dateStr = dateTimeStr;
					// 处理时间区间格式
					if (dateStr.includes(' - ')) {
						dateStr = dateStr.split(' - ')[0]; // 取开始时间
					}

					const date = new Date(dateStr);
					if (isNaN(date.getTime())) {
						return dateTimeStr;
					}

					const month = date.getMonth() + 1;
					const day = date.getDate();
					const hours = date.getHours().toString().padStart(2, '0');
					const minutes = date.getMinutes().toString().padStart(2, '0');

					// 判断是今天、昨天、明天还是其他日期
					const today = new Date();
					const recordDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
					const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
					const diffDays = Math.floor((todayDay - recordDay) / (1000 * 60 * 60 * 24));

					if (diffDays === 0) {
						return `今天 ${hours}:${minutes}`;
					} else if (diffDays === 1) {
						return `昨天 ${hours}:${minutes}`;
					} else if (diffDays === -1) {
						return `明天 ${hours}:${minutes}`;
					} else if (diffDays > 1 && diffDays <= 7) {
						return `${diffDays}天前 ${hours}:${minutes}`;
					} else if (diffDays < -1 && diffDays >= -7) {
						return `${Math.abs(diffDays)}天后 ${hours}:${minutes}`;
					} else {
						return `${month}月${day}日 ${hours}:${minutes}`;
					}
				} catch (e) {
					return dateTimeStr;
				}
			};

			const visitTime = formatTime(record.visitdate);
			const plateNumber = record.platenumber || '未知车牌';
			const recordPhone = record.visitorphone || record.ownerphone || '未知手机';

			// 构建记录信息显示
			
			
			
			let recordInfo = `车牌：${plateNumber}\n预约时间：${visitTime}`;
			if (recordType === '车牌号' && recordPhone !== this.model1.code) {
				recordInfo += `\n预约手机：${recordPhone}`;
			}
			console.log("测试状态：", status);
			switch (status) {
				case '已离场':
				case '离场':
					// 允许提交新的预约
					return {
						canSubmit: true, message: `${recordType}最新记录已离场，可以提交新预约`
					};

				case '有效':
				case '待审批':
				case '审核中':
				case '待审批':
				case '审批中':
					// 有待审批的预约，不允许重复提交
					return new Promise((resolve) => {
						const statusText = status === '有效' ? '待审批' : status;
						const title = recordType === '车牌号' ? '车牌冲突提醒' : '预约提醒';
						const content = recordType === '车牌号' ?
							`检测到该车牌有一个${statusText}的预约记录：\n${recordInfo}\n\n同一车牌不能重复预约，请等待当前预约处理完成后再提交新的申请。` :
							`您有一个${statusText}的预约记录：\n${recordInfo}\n\n请等待审批完成或处理完当前预约后再提交新的预约申请。`;

						uni.showModal({
							title: title,
							content: content,
							showCancel: false,
							confirmText: '我知道了',
							success: () => {
								resolve({
									canSubmit: false,
									message: `存在${statusText}的预约记录`
								});
							}
						});
					});

				case '待入场':
					// 🆕 只对"待入场"状态弹窗提醒
					return new Promise((resolve) => {
						const title = recordType === '车牌号' ? '车牌冲突提醒' : '预约提醒';
						const content = recordType === '车牌号' ?
							`检测到该车牌有一个待入场的预约：\n${recordInfo}\n\n同一车牌不能重复预约，请先使用当前预约或等待过期后再提交新的申请。` :
							`您有一个待入场的预约：\n${recordInfo}\n\n建议先使用当前预约或等待过期后再提交新的预约申请。`;

						uni.showModal({
							title: title,
							content: content,
							showCancel: false,
							cancelText: '我知道了',
							success: () => {
								resolve({
									canSubmit: false,
									message: '存在待入场的预约记录'
								});
							}
						});
					});

				case '已通过':
				case '审核通过':
				case '通过':
				case '审批通过':
					// 🆕 已通过但非待入场状态，允许提交（不弹窗）
					return {
						canSubmit: true,
						message: `${recordType}最新记录已通过审核，可以提交新预约`
					};

				case '已入场':
				case '入场':
				case '在场':
					// 车辆已在场内，不允许重复预约
					return new Promise((resolve) => {
						const title = '车辆状态提醒';
						const content = recordType === '车牌号' ?
							`检测到该车牌已在场内：\n${recordInfo}\n\n一个车牌同时只能有一个在场记录，请等待离场后再提交新的预约。` :
							`您的车辆已在场内：\n${recordInfo}\n\n一个车牌同时只能有一个在场记录，请先离场后再提交新的预约。`;

						uni.showModal({
							title: title,
							content: content,
							showCancel: false,
							confirmText: '我知道了',
							success: () => {
								resolve({
									canSubmit: false,
									message: '车辆已在场内'
								});
							}
						});
					});

				case '未进场':
				case '拒绝':
				case '未通过':
				case '审批拒绝':
					// 🆕 之前的申请被拒绝，直接允许重新申请（不弹窗）
					return {
						canSubmit: true,
						message: `${recordType}之前的申请已被拒绝，可以重新提交预约`
					};

				case '已过期':
				case '过期':
					// 预约已过期，可以提交新预约
					return {
						canSubmit: true, message: `${recordType}最新记录已过期，可以提交新预约`
					};

				case '已取消':
				case '取消':
					// 预约已取消，可以提交新预约
					return {
						canSubmit: true, message: `${recordType}最新记录已取消，可以提交新预约`
					};

				default:
					// 未知状态，询问用户
					return new Promise((resolve) => {
						const title = '状态确认';
						const content =
							`检测到您有一个状态为"${status}"的预约记录：\n${recordInfo}\n\n系统无法自动判断该状态，是否继续提交新的预约申请？`;

						uni.showModal({
							title: title,
							content: content,
							showCancel: true,
							cancelText: '取消',
							confirmText: '继续',
							success: (res) => {
								if (res.confirm) {
									resolve({
										canSubmit: true,
										message: '用户确认继续提交'
									});
								} else {
									resolve({
										canSubmit: false,
										message: '用户取消提交'
									});
								}
							}
						});
					});
			}
		},

		// 🆕 调用后端 getParkBlack 接口检查黑名单
		async checkParkBlacklist(plateNumber) {
			try {
				console.log('🚫 [后端黑名单检查] 开始检查车牌:', plateNumber);

				// 获取当前小区信息
				const parkInfo = uni.getStorageSync('parkInfo');
				let communityName = this.currentCommunityName || parkInfo?.name || '';
				
				// 如果小区名称是URL编码的，进行解码
				if (communityName && typeof communityName === 'string' && communityName.includes('%')) {
					try {
						communityName = decodeURIComponent(communityName);
					} catch (e) {
						console.error('解码小区名称失败:', e);
					}
				}

				console.log('🏠 [后端黑名单检查] 当前小区名称:', communityName);

				// 首先查询小区对应的 parkCode
				const yardInfoResponse = await uni.request({
					url: 'https://www.xuerparking.cn:8543/parking/yardInfo/yardCode',
					// url: 'https://csharphrb.picp.vip/parking/yardInfo/yardCode',
					method: 'GET',
					data: {
						yardName: communityName
					},
					header: {
						'content-type': 'application/json'
					}
				});

				if (yardInfoResponse.statusCode !== 200 || !yardInfoResponse.data) {
					console.error('🚫 [后端黑名单检查] 查询小区信息失败:', yardInfoResponse);
					throw new Error('查询小区信息失败');
				}
				const yardInfo = yardInfoResponse.data;
				console.log("yardInfo.data.get(0)",yardInfo.data[0])
				const parkCode = yardInfo.data[0];

				if (!parkCode) {
					console.error('🚫 [后端黑名单检查] 未找到小区对应的parkCode:', yardInfo);
					throw new Error('未找到小区对应的代码');
				}

				console.log('🏠 [后端黑名单检查] 小区代码:', parkCode);

				// 调用 getParkBlack 接口检查黑名单
				const blacklistResponse = await uni.request({
					url: 'https://www.xuerparking.cn:8543/parking/blackList/getParkBlack',
					method: 'GET',
					data: {
						parkCodeList: parkCode,
						carCode: plateNumber
					},
					header: {
						'content-type': 'application/json'
					}
				});

				console.log('🚫 [后端黑名单检查] 接口响应:', blacklistResponse);

				if (blacklistResponse.statusCode !== 200) {
					console.error('🚫 [后端黑名单检查] 接口调用失败:', blacklistResponse);
					throw new Error('黑名单检查接口调用失败');
				}

				const blacklistData = blacklistResponse.data.data;
				console.log("blacklistData",blacklistData)
				// 检查返回的数据结构，判断是否在黑名单中
				let isBlacklisted = false;
				let blacklistInfo = null;

				if (blacklistData && blacklistData.resultCode === 0) {
					// 成功响应，检查数据
					const data = blacklistData.data;
					if (data && data.recordList&& data.recordList.length > 0) {
						isBlacklisted = true;
						blacklistInfo = data.recordList[0]; // 获取第一条黑名单记录
					} else if (data && typeof data === 'object' && data.carCode) {
						isBlacklisted = true;
						blacklistInfo = data;
					}
				} else if (blacklistData && Array.isArray(blacklistData) && blacklistData.recordList.length > 0) {
					isBlacklisted = true;
					blacklistInfo = blacklistData.recordList[0];
				} else if (blacklistData && typeof blacklistData === 'object' && blacklistData.recordList.carCode) {
					isBlacklisted = true;
					blacklistInfo = blacklistData;
				}

				if (isBlacklisted) {
					console.log('🚫 [后端黑名单检查] 车牌在黑名单中:', blacklistInfo);

					// 显示黑名单提示
					const reason = blacklistInfo.reason || blacklistInfo.blackReason || '未提供原因';
					const remark = blacklistInfo.remark1 || blacklistInfo.remark || '';

					uni.showModal({
						title: '⚠️ 车牌已列入黑名单',
						content: `车牌号 ${plateNumber} 已被列入系统黑名单，无法进行预约。\n\n拉黑原因：${reason}\n${remark ? '备注：' + remark + '\n' : ''}\n如有疑问，请联系小区管理处处理。`,
						showCancel: false,
						confirmText: '我知道了',
						confirmColor: '#e74c3c'
					});

					return {
						canSubmit: false,
						message: `车牌 ${plateNumber} 在系统黑名单中，不允许预约`
					};
				}

				console.log('🚫 [后端黑名单检查] 车牌未在系统黑名单中');
				return {
					canSubmit: true,
					message: '车牌未在系统黑名单中'
				};

			} catch (error) {
				console.error('🚫 [后端黑名单检查] 检查失败:', error);
				
				// 如果后端黑名单检查失败，不阻止预约，但记录错误
				console.warn('🚫 [后端黑名单检查] 检查失败，继续进行本地黑名单检查');
				return {
					canSubmit: true,
					message: '后端黑名单检查失败，继续本地检查'
				};
			}
		},

		// 获取车牌号
		getPlateNumber() {
			if (this.$refs.keyboardInput && this.$refs.keyboardInput.values) {
				return this.$refs.keyboardInput.values.join('').trim();
			}
			return '';
		},

		// 构建预约数据
		async buildAppointmentData() {
			try {
				const userInfo = uni.getStorageSync('userInfo') || {};
				const selectedDate = this.dates[this.activeDate]; // 获取选中的日期
				const plateNumber = this.getPlateNumber();

				// 构建记录时间 - 当前时间，格式：YYYY-MM-DD HH:mm:ss
				const now = new Date();
				const recordDateTime = now.getFullYear() + '-' +
					String(now.getMonth() + 1).padStart(2, '0') + '-' +
					String(now.getDate()).padStart(2, '0') + ' ' +
					String(now.getHours()).padStart(2, '0') + ':' +
					String(now.getMinutes()).padStart(2, '0') + ':' +
					String(now.getSeconds()).padStart(2, '0');

				// 构建访问时间
				let visitDateTime = '';
				if (selectedDate) {
					const currentYear = new Date().getFullYear();
					visitDateTime = `${currentYear}-${selectedDate.day}`;
				}
				// console.log('')

				// 获取地址信息
				const addressInfo = await this.getAddressInfo(userInfo);

				// 构建基础预约数据
				const appointmentData = {
					// 详细地址信息 - 优先使用获取到的地址信息
					// 🔧 修复：业主角色时，如果有selectedOwnerInfo，优先使用其中的地址信息
					province: (this.currentUserRole === 'owner' && this.selectedOwnerInfo?.province) ||
						this.form.addressInfo.province || addressInfo.province || '黑龙江省',
					city: (this.currentUserRole === 'owner' && this.selectedOwnerInfo?.city) ||
						this.form.addressInfo.city || addressInfo.city || '哈尔滨市',
					district: (this.currentUserRole === 'owner' && this.selectedOwnerInfo?.district) ||
						this.form.addressInfo.district || addressInfo.district || '香坊区',
					community: (this.currentUserRole === 'owner' && this.selectedOwnerInfo?.community) ||
						this.form.addressInfo.community || addressInfo.community || this.currentCommunityName,
					building: (this.currentUserRole === 'owner' && this.selectedOwnerInfo?.building) ||
						this.form.addressInfo.building || '',
					units: (this.currentUserRole === 'owner' && this.selectedOwnerInfo?.units) ||
						this.form.addressInfo.units || '',
					floor: (this.currentUserRole === 'owner' && this.selectedOwnerInfo?.floor) ||
						this.form.addressInfo.floor || '',
					room: (this.currentUserRole === 'owner' && this.selectedOwnerInfo?.roomnumber) ||
						this.form.addressInfo.roomnumber || '',

					// 时间信息
					visitdate: visitDateTime, // 预约时间
					recorddate: recordDateTime, // 记录创建时间

					// 联系信息
					visitorphone: this.model1.code,

					// 车辆信息
					platenumber: plateNumber,
					cartype: plateNumber.length === 8 ? '新能源车' : '燃油车',

					// 预约信息
					visitreason: this.model1.reason,

					// 🆕 微信信息 - 根据角色设置不同字段
					...this.getWechatInfoByRole(userInfo),

					// 状态信息
					status: '有效'
				};

				// 根据用户角色和管家信息设置预约类型
				let appointType = '自助'; // 默认类型

				if (this.currentUserRole === 'manager') {
					// 管家角色：代人预约
					appointType = '代人';
					appointmentData.ownername = userInfo.userInfo?.username || '管家用户';
					appointmentData.ownerphone = userInfo.phone || userInfo.userInfo?.phone || this.model1.code;

					// 🆕 管家代人预约：传递当前管家的nickname和openid给后端
					appointmentData.managerNickname = this.getWechatNickname(userInfo);
					appointmentData.managerOpenid = this.getWechatOpenid(userInfo);
					console.log('👨‍💼 [管家代人预约] 传递管家信息给后端:', {
						managerNickname: appointmentData.managerNickname,
						managerOpenid: appointmentData.managerOpenid
					});

					console.log('👨‍💼 [管家代约] 审核用户名由getWechatInfoByRole方法设置');
				} else if (this.currentUserRole === 'owner') {
					// 业主角色：业主预约，需要审核（使用"业主"类型以区别于外来访客的"自助"类型）
					appointType = '业主';
					// 📝 业主预约设置为待审批状态
					appointmentData.auditstatus = '待审批';
					appointmentData.venuestatus = '待审批';
					console.log('📝 [业主预约] 预约类型=业主，设置审核状态为待审批');
					
					// 🔧 修复：优先使用从月票数据中获取的准确业主信息
					if (this.selectedOwnerInfo && this.selectedOwnerInfo.ownername) {
						appointmentData.ownername = this.selectedOwnerInfo.ownername;
						appointmentData.ownerphone = this.selectedOwnerInfo.ownerphone || userInfo.phone || userInfo.userInfo?.phone || this.model1.code;
						console.log('✅ [业主预约] 使用月票查询的准确业主信息:', {
							ownername: appointmentData.ownername,
							ownerphone: appointmentData.ownerphone
						});
					} else {
						// 如果没有selectedOwnerInfo，使用用户信息（兜底）
						appointmentData.ownername = userInfo.userInfo?.ownername || userInfo.userInfo?.username || '业主用户';
						appointmentData.ownerphone = userInfo.phone || userInfo.userInfo?.phone || this.model1.code;
						console.log('⚠️ [业主预约] 使用用户信息中的业主信息（兜底）:', {
							ownername: appointmentData.ownername,
							ownerphone: appointmentData.ownerphone
						});
					}

					// 🔧 修复：业主角色时，如果有selectedOwnerInfo，也要设置地址信息
					if (this.selectedOwnerInfo) {
						if (this.selectedOwnerInfo.community) {
							appointmentData.community = this.selectedOwnerInfo.community;
						}
						if (this.selectedOwnerInfo.building) {
							appointmentData.building = this.selectedOwnerInfo.building;
						}
						if (this.selectedOwnerInfo.units) {
							appointmentData.units = this.selectedOwnerInfo.units;
						}
						if (this.selectedOwnerInfo.floor) {
							appointmentData.floor = this.selectedOwnerInfo.floor;
						}
						if (this.selectedOwnerInfo.roomnumber) {
							appointmentData.room = this.selectedOwnerInfo.roomnumber;
						}

						console.log('✅ [业主预约] 使用selectedOwnerInfo中的地址信息:', {
							community: appointmentData.community,
							building: appointmentData.building,
							units: appointmentData.units,
							floor: appointmentData.floor,
							room: appointmentData.room
						});
					}
				} else if (this.currentUserRole === 'visitor') {
					// 访客角色：需要检查是否有管家信息
					// 检查是否有管家信息（通过butlerName或其他字段判断）
					const hasButlerInfo = userInfo.userInfo?.butlerName ||
						userInfo.userInfo?.butlerPhone ||
						userInfo.butlerName ||
						userInfo.butlerPhone ||
						userInfo.userInfo?.butler_id ||
						userInfo.butler_id;

					if (hasButlerInfo) {
						// 有管家信息：邀请类型
						appointType = '邀请';
						// 注意：管家信息不需要存储在Appointment表中，只用于判断预约类型
						// butlerName, butlerPhone, butlerId 等字段在Appointment实体中不存在
						// 这些信息可以通过其他方式关联（如通过openid查询用户信息）
					} else {
						// 没有管家信息：自助类型
						appointType = '自助';
					}
				}

				// 设置预约类型
				appointmentData.appointtype = appointType;

				// 🆕 如果是访客角色且通过二维码扫码进入（邀请类型），传递管家姓名给后端
				if (this.currentUserRole === 'visitor' && this.qrValidated) {
					// 访客扫码预约：传递二维码中的管家姓名
					const scannedAddressInfo = uni.getStorageSync('scannedAddressInfo') || {};
					const pendingScannedParams = uni.getStorageSync('pendingScannedParams') || {};
					
					// 尝试从多个来源获取管家姓名
					const butlerName = scannedAddressInfo.butlerName || 
									 pendingScannedParams.butlerName || 
									 userInfo?.userInfo?.butlerName || 
									 userInfo?.butlerName;
					
					if (butlerName) {
						appointmentData.butlerName = butlerName;
						appointmentData.appointtype = '邀请'; // 明确设置为邀请类型
						console.log('🚗 [访客邀请预约] 传递管家姓名给后端:', appointmentData.butlerName);
					} else {
						console.warn('⚠️ [访客邀请预约] 未找到管家姓名信息');
					}
				}

				// 🆕 如果访客角色查询到了业主信息，将业主信息保存到相应字段
				if (this.currentUserRole === 'visitor' && this.selectedOwnerInfo) {
					// 将业主信息保存到数据库的 ownername 和 ownerphone 字段
					appointmentData.ownername = this.selectedOwnerInfo.ownername;
					appointmentData.ownerphone = this.selectedOwnerInfo.ownerphone;

					// 业主地址信息保存到现有的地址字段中
					if (this.selectedOwnerInfo.community) {
						appointmentData.community = this.selectedOwnerInfo.community;
					}
					if (this.selectedOwnerInfo.building) {
						appointmentData.building = this.selectedOwnerInfo.building;
					}
					if (this.selectedOwnerInfo.units) {
						appointmentData.units = this.selectedOwnerInfo.units;
					}
					if (this.selectedOwnerInfo.floor) {
						appointmentData.floor = this.selectedOwnerInfo.floor;
					}
					if (this.selectedOwnerInfo.roomnumber) {
						appointmentData.room = this.selectedOwnerInfo.roomnumber;
					}

					console.log('🚗 访客角色，业主信息已设置:', {
						ownername: appointmentData.ownername,
						ownerphone: appointmentData.ownerphone,
						community: appointmentData.community,
						building: appointmentData.building,
						units: appointmentData.units,
						floor: appointmentData.floor,
						room: appointmentData.room,
						selectedOwnerInfo: this.selectedOwnerInfo
					});
				}
				// 如果管家选择了业主信息，将业主信息保存到相应字段
				else if (this.currentUserRole === 'manager' && this.selectedOwnerInfo) {
					// 将业主信息保存到数据库的 ownername 和 ownerphone 字段
					appointmentData.ownername = this.selectedOwnerInfo.ownername;
					appointmentData.ownerphone = this.selectedOwnerInfo.ownerphone;

					// 🔧 修复：管家选择业主时，审核用户名由getWechatInfoByRole方法统一设置

					console.log('👨‍💼 [管家选择业主] 审核用户名由getWechatInfoByRole方法设置');

					// 业主地址信息保存到现有的地址字段中
					// 注意：这些字段在 Appointment 实体类中已经存在
					if (this.selectedOwnerInfo.community) {
						appointmentData.community = this.selectedOwnerInfo.community;
					}
					if (this.selectedOwnerInfo.building) {
						appointmentData.building = this.selectedOwnerInfo.building;
					}
					if (this.selectedOwnerInfo.units) {
						appointmentData.units = this.selectedOwnerInfo.units;
					}
					if (this.selectedOwnerInfo.floor) {
						appointmentData.floor = this.selectedOwnerInfo.floor;
					}
					if (this.selectedOwnerInfo.roomnumber) {
						appointmentData.room = this.selectedOwnerInfo.roomnumber;
					}

					console.log('👨‍💼 管家代为预约，业主信息已设置:', {
						ownername: appointmentData.ownername,
						ownerphone: appointmentData.ownerphone,
						community: appointmentData.community,
						building: appointmentData.building,
						units: appointmentData.units,
						floor: appointmentData.floor,
						room: appointmentData.room,
						selectedOwnerInfo: this.selectedOwnerInfo
					});
				} else if (this.currentUserRole === 'manager') {
					// 管家没有选择业主信息时，清空这些字段
					appointmentData.ownername = '';
					appointmentData.ownerphone = '';

					// 🔧 修复：管家未选择业主时，审核用户名由getWechatInfoByRole方法统一设置

					console.log('👨‍💼 管家未选择业主信息，ownername 和 ownerphone 字段为空');
					console.log('👨‍💼 [管家未选择业主] 审核用户名由getWechatInfoByRole方法设置');
				}

				// 生成订单号
				appointmentData.ordernumber = 'APT' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();

				// 🏛️ 设置预约场所（从 parkInfo 或 parkingLotInfo 获取）
				const parkInfo = uni.getStorageSync('parkInfo');
				let parkingLotName = '';
				
				if (parkInfo && parkInfo.fullName) {
					parkingLotName = parkInfo.fullName;
					console.log('🏛️ [预约场所] 从 parkInfo.fullName 获取:', parkingLotName);
				} else if (parkInfo && parkInfo.name) {
					parkingLotName = parkInfo.name + '·停车场';
					console.log('🏛️ [预约场所] 从 parkInfo.name 获取:', parkingLotName);
				} else if (this.parkingLotInfo && this.parkingLotInfo.fullName) {
					parkingLotName = this.parkingLotInfo.fullName;
					console.log('🏛️ [预约场所] 从 parkingLotInfo.fullName 获取:', parkingLotName);
				} else if (this.parkingLotInfo && this.parkingLotInfo.name) {
					parkingLotName = this.parkingLotInfo.name + '·停车场';
					console.log('🏛️ [预约场所] 从 parkingLotInfo.name 获取:', parkingLotName);
				} else if (userInfo && userInfo.yardName) {
					parkingLotName = userInfo.yardName + '·停车场';
					console.log('🏛️ [预约场所] 从 userInfo.yardName 获取:', parkingLotName);
				} else {
					parkingLotName = '停车场';
					console.log('🏛️ [预约场所] 使用默认名称:', parkingLotName);
				}
				
				// 将停车场名称设置到预约数据中（使用parking字段，与后端Appointment实体类对应）
				appointmentData.parking = parkingLotName;
				console.log('✅ [预约场所] 最终设置的场所名称:', appointmentData.parking);

				console.log('📋 预约数据构建完成:', {
					userRole: this.currentUserRole,
					appointType: appointType,
					auditusername: appointmentData.auditusername, // 🔧 审核用户名由getWechatInfoByRole方法设置
					visitorname: appointmentData.visitorname, // 🔧 访客姓名由getWechatInfoByRole方法设置
					hasButlerInfo: this.currentUserRole === 'visitor' ? (userInfo.userInfo?.butlerName || userInfo.userInfo?.butlerPhone || userInfo.butlerName || userInfo.butlerPhone || userInfo.userInfo?.butler_id || userInfo.butler_id) : 'N/A',
					appointmentData: appointmentData
				});

				return appointmentData;
			} catch (error) {
				console.error('构建预约数据失败:', error);
				throw new Error('构建预约数据失败，请重试');
			}
		},

		// 获取详细地址信息
		async getAddressInfo(userInfo) {
			// 首先检查本地存储中是否有parkInfo
			const parkInfo = uni.getStorageSync('parkInfo');
			if (parkInfo && parkInfo.name) {
				console.log('🔍 从本地存储获取地址信息:', parkInfo);

				// 从parkInfo构建地址信息
				const addressInfo = {
					province: parkInfo.province || '',
					city: parkInfo.city || '',
					district: parkInfo.district || '',
					community: parkInfo.name || '',
					building: '',
					units: '',
					floor: '',
					room: ''
				};

				console.log('🔍 从parkInfo构建的地址信息:', addressInfo);
				return addressInfo;
			}

			// 设置默认地址信息（空值，不设置硬编码的默认车场）
			const defaultAddress = {
				province: '',
				city: '',
				district: '',
				community: '',
				building: '',
				units: '',
				floor: '',
				room: ''
			};

			// 如果用户信息中有详细地址信息，则使用用户的地址
			if (userInfo && userInfo.userInfo) {
				const user = userInfo.userInfo;
				console.log('🔍 从用户信息获取地址:', user);

				// 从用户信息中提取地址信息
				const addressInfo = {
					province: user.province || '',
					city: user.city || '',
					district: user.district || '',
					community: user.community || user.communityname || '',
					building: user.building || user.buildingname || '',
					units: user.units || user.unitname || '',
					floor: user.floor || user.floornumber || '',
					room: user.room || user.roomnumber || user.roomname || ''
				};

				console.log('🔍 从用户信息构建的地址信息:', addressInfo);
				return addressInfo;
			}

			console.log('🔍 使用默认地址信息（空值）:', defaultAddress);
			return defaultAddress;
		},

		// 提交预约
		async submitAppointment(appointmentData) {
			// 🆕 在提交预约前再次检查公众号关注状态（双重保险）
			console.log('📱 [提交预约] 开始检查公众号关注状态...');
			const subscriptionCheck = await this.checkSubscriptionStatus();
			if (!subscriptionCheck.canSubmit) {
				console.log('❌ [提交预约] 用户未关注公众号，终止提交');
				return; // 如果未关注公众号，显示引导界面并终止提交
			}
			console.log('✅ [提交预约] 公众号关注状态检查通过，继续提交预约');

			// 🆕 显示完整的用户信息调试信息
			try {
				console.log('📋 [提交预约] ==================== 用户信息汇总 ====================');
				const userInfo = uni.getStorageSync('userInfo');
				const wechatUserInfo = uni.getStorageSync('wechatUserInfo');
				const userBasicInfo = uni.getStorageSync('userBasicInfo');

				console.log('📋 [提交预约] 用户信息 (userInfo):', userInfo);
				console.log('📋 [提交预约] 微信用户信息 (wechatUserInfo):', wechatUserInfo);
				console.log('📋 [提交预约] 用户基本信息 (userBasicInfo):', userBasicInfo);
				console.log('📋 [提交预约] 表单信息 (form):', {
					nickname: this.form.nickname,
					phone: this.form.phone
				});

				console.log('📋 [提交预约] 预约数据中的微信信息:', {
					openid: appointmentData.openid,
					visitorname: appointmentData.visitorname,
					auditusername: appointmentData.auditusername,
					visitorphone: appointmentData.visitorphone
				});
				console.log('📋 [提交预约] ======================================');
			} catch (debugError) {
				console.error('❌ [提交预约] 显示调试信息失败:', debugError);
			}

			uni.showLoading({
			title: '提交中...',
			mask: true
		});
		
		// 🆕 声明变量，确保在整个方法中可用
		let auditStatus = '';
		let venueStatus = '';
		let parkingLotName = '';

		try {
			// 调用后端预约接口
			const result = await this.callAppointmentAPI(appointmentData);

			uni.hideLoading();

			// 保存预约数据到本地存储，供结果页面显示
			try {
				// 获取当前停车场名称
				const parkInfo = uni.getStorageSync('parkInfo');

				if (parkInfo && parkInfo.fullName) {
					parkingLotName = parkInfo.fullName;
				} else if (parkInfo && parkInfo.name) {
					parkingLotName = `${parkInfo.name}-停车场`;
				} else if (this.parkingLotInfo && this.parkingLotInfo.fullName) {
					parkingLotName = this.parkingLotInfo.fullName;
				} else if (this.userInfo && this.userInfo.yardName) {
					// 从用户信息中获取车场名称
					parkingLotName = `${this.userInfo.yardName}-停车场`;
				} else {
					// 使用通用名称
					parkingLotName = '停车场';
				}

				// 🆕 从后端返回结果中获取状态信息
				const backendData = result.data || {};
				auditStatus = backendData.auditstatus || '';
				venueStatus = backendData.venuestatus || '';

					uni.setStorageSync('lastAppointmentData', {
						visitDate: appointmentData.visitdate,
						plateNumber: appointmentData.platenumber,
						visitReason: appointmentData.visitreason,
						appointType: appointmentData.appointtype,
						status: 'pending',
						submitTime: new Date().toISOString(),
						parkingLotName: parkingLotName, // 添加停车场名称
						// 🆕 添加后端返回的状态信息
						auditStatus: auditStatus,
						venueStatus: venueStatus,
						// 🆕 保存访客手机号，用于后续更新访客姓名
						visitorphone: appointmentData.visitorphone
					});

					console.log('📱 [预约提交] 保存预约数据成功，停车场名称:', parkingLotName);
					console.log('📱 [预约提交] 审核状态:', auditStatus, '场地状态:', venueStatus);
				} catch (storageError) {
					console.error('保存预约数据失败:', storageError);
				}

				// 🔒 预约成功后，标记二维码为已使用（一次性使用）
				if (this.scannedQrId) {
					await this.markQrCodeAsUsed(this.scannedQrId);
					console.log('🔒 二维码已标记为已使用:', this.scannedQrId);
				}

				// 📧 业主预约成功且需要审核时，发送通知给管家
				if (auditStatus === '待审批') {
					try {
						//去除掉-停车场
						const parkingLotNameWithoutSuffix = parkingLotName.replace('-停车场', '');
						console.log('📧 [发送通知] 发送待审核通知，停车场名称:', parkingLotNameWithoutSuffix);
						await this.sendBookingPendingNotification(appointmentData, parkingLotNameWithoutSuffix);
						// await this.sendBookingPendingNotification(appointmentData, parkingLotName);
					} catch (notifyError) {
						console.error('📧 [发送通知] 发送待审核通知失败:', notifyError);
						// 通知发送失败不影响预约成功
					}
				}

				// 🆕 根据预约状态显示不同的提示信息
				this.showAppointmentStatusMessage(result.data || {}, appointmentData);

				// 🆕 预约成功后，检查是否有微信用户信息并自动更新
				await this.autoUpdateVisitorNameIfAvailable();

				// 🆕 预约提交成功，重置提交状态
				this.isSubmittingAppointment = false;

				// 延迟跳转，让用户看到状态提示
				setTimeout(() => {
					uni.navigateTo({
						url: "/pagesD/reservation/result"
					});
				}, 3000); // 增加延迟时间，让用户看清状态提示

			} catch (error) {
				uni.hideLoading();
				console.error('预约提交失败:', error);

				// 🆕 预约提交失败，重置提交状态
				this.isSubmittingAppointment = false;

				// 根据错误类型显示不同的提示
				let errorMessage = '预约提交失败，请检查网络连接后重试。';
				let showRetry = true; // 是否显示重试按钮
				let modalTitle = '提交失败';

				if (error.message) {
					if (error.message.includes('黑名单')) {
						// 黑名单特殊处理
						modalTitle = '⚠️ 预约受限';
						errorMessage = '🚫 该车牌号已被列入黑名单，无法进行预约。\n\n📞 如有疑问，请联系小区管理处：\n• 核实车牌信息是否正确\n• 了解黑名单原因\n• 申请解除限制\n\n💡 温馨提示：\n请确认车牌号输入无误，或联系管理员处理。';
						showRetry = false; // 黑名单情况不显示重试按钮
					} else if (error.message.includes('网络')) {
						errorMessage = '网络连接失败，请检查网络后重试。';
					} else if (error.message.includes('超时')) {
						errorMessage = '网络超时，请稍后重试。';
					} else if (error.message.includes('服务器')) {
						errorMessage = '服务器繁忙，请稍后重试。';
					} else {
						errorMessage = error.message;
					}
				}

				uni.showModal({
					title: modalTitle,
					content: errorMessage,
					showCancel: showRetry,
					cancelText: '取消',
					confirmText: showRetry ? '重试' : '我知道了',
					success: (res) => {
						if (res.confirm && showRetry) {
							// 🆕 重试时重新设置提交状态
							this.isSubmittingAppointment = true;
							this.submitAppointment(appointmentData);
						}
					}
				});
			}
		},

		// 🆕 根据预约状态显示相应的提示信息
		showAppointmentStatusMessage(backendData, appointmentData) {
			const auditStatus = backendData.auditstatus || '';
			const venueStatus = backendData.venuestatus || '';
			const appointType = appointmentData.appointtype || '';

			console.log('📱 [状态提示] 审核状态:', auditStatus, '场地状态:', venueStatus, '预约类型:', appointType);

			// 根据不同状态组合显示相应提示
			if (this.currentUserRole === 'manager' && appointType === '代人') {
				// 管家代人预约
				uni.showModal({
					title: '✅ 预约提交成功',
					content: '🎉 管家代人预约已自动通过！\n\n📋 预约状态：已通过审核\n🚪 入场状态：待入场\n\n💡 温馨提示：\n• 预约无需审核，可直接入场\n• 请提醒访客按时到达\n• 如有变更请及时联系',
					showCancel: false,
					confirmText: '我知道了'
				});
			} else if (auditStatus === '不审核' || (auditStatus === '已通过' && venueStatus === '待入场')) {
				// 无需审核或已自动通过
				uni.showModal({
					title: '✅ 预约提交成功',
					content: '🎉 您的预约已自动通过！\n\n📋 预约状态：免审核通过\n🚪 入场状态：待入场\n\n💡 温馨提示：\n• 该时间段无需审核\n• 可直接前往停车场\n• 请按预约时间准时到达\n• 入场时请出示预约信息',
					showCancel: false,
					confirmText: '我知道了'
				});
			} else if (auditStatus === '待审批' || auditStatus === '待审批') {
				// 需要审核
				uni.showModal({
					title: '⏳ 预约提交成功',
					content: '📝 您的预约正在等待审批...\n\n📋 预约状态：待审批\n👨‍💼 审核人员：小区管家\n\n💡 温馨提示：\n• 管家将在24小时内审核\n• 审核结果将通过短信通知\n• 可在"我的预约"中查看进度\n• 如有疑问请联系小区管家',
					showCancel: false,
					confirmText: '我知道了'
				});
			} else if (appointType === '邀请') {
				// 访客扫码预约（管家邀请）
				uni.showModal({
					title: '✅ 预约提交成功',
					content: '🎉 访客预约已通过管家审核！\n\n📋 预约状态：已通过审核\n🚪 入场状态：待入场\n👨‍💼 审核人员：邀请管家\n\n💡 温馨提示：\n• 管家邀请预约无需等待\n• 可直接前往停车场\n• 请按预约时间准时到达\n• 感谢管家的邀请安排',
					showCancel: false,
					confirmText: '我知道了'
				});
			} else {
				// 默认成功提示
				uni.showModal({
					title: '✅ 预约提交成功',
					content: '🎉 您的预约已成功提交！\n\n📋 当前状态：处理中\n⏰ 处理时间：请耐心等待\n\n💡 温馨提示：\n• 系统正在处理您的预约\n• 请关注预约状态变化\n• 可在"我的预约"中查看详情\n• 如有疑问请联系客服',
					showCancel: false,
					confirmText: '我知道了'
				});
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

				console.log('📱 [API调用] 后端返回结果:', result);

				// 🆕 检查响应结果 - 判断 result.data 中的业务状态
				// 首先检查HTTP请求是否成功
				if (!result || (result.code !== '0' && result.code !== 0)) {
					const errorMsg = result?.msg || '网络请求失败';
					console.log('📱 [API调用] HTTP请求失败:', errorMsg);
					throw new Error(errorMsg);
				}

				// 检查业务逻辑结果（在 result.data 中）
				const businessResult = result.data;
				if (!businessResult) {
					console.log('📱 [API调用] 预约失败：缺少业务数据');
					throw new Error('服务器响应异常，缺少业务数据');
				}

				// 判断业务结果：只有 data.code 为 0 或 200 才是成功
				if (businessResult.code === 0 || businessResult.code === 200 ||
					businessResult.code === '0' || businessResult.code === '200') {
					// 业务成功
					const backendData = businessResult.data || businessResult;
					console.log('📱 [API调用] 预约成功 (业务code: 0/200)，提取的状态数据:', backendData);
					return {
						success: true,
						message: businessResult?.msg || businessResult?.message || '预约成功',
						data: backendData // 返回包含状态信息的数据
					};
				} else {
					// 业务失败（如 code: -1 等）
					const errorMsg = businessResult?.msg || businessResult?.message || '预约失败';
					console.log('📱 [API调用] 预约失败，业务响应:', {
						code: businessResult?.code,
						msg: businessResult?.msg,
						message: businessResult?.message,
						fullBusinessResult: businessResult
					});
					throw new Error(errorMsg);
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
			console.log('🎨 切换车牌类型，清除之前输入的车牌号码');

			// 先清除所有输入的车牌号码
			this.clearAllPlateInput();

			this.carColor = color;
			this.selectedColor = color;

			if (color == 'linear-gradient(to bottom, #d0f1e4, #6ad390)') {
				console.log('🟢 切换到新能源车牌，设置maxCarLenght=8');
				this.carMax = false;
				this.maxCarLenght = 8;
				this.plateType = "newEnergy";
				this.borderBgColor = "#000";
				this.dynamicWidth = 22;
				this.textColor = '#000';
			} else {
				console.log('🔵 切换到传统车牌，设置maxCarLenght=7');
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

			// 调整车牌字符数组长度以匹配新的车牌类型
			this.adjustPlateCharsLength();
			this.updateCurrentPlateChars();
		},
		// 显示键盘并传递当前车牌号码
		showKeyboardWithCurrentValue() {
			// 获取当前输入的车牌号码
			const currentPlateNumber = this.getPlateNumber();
			console.log('🎹 显示键盘，当前车牌号码:', currentPlateNumber);
			this.toShow(currentPlateNumber);
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
	
		},
		toCancel() {
			this.keyboardClosed();
		},
		toConfirm() {
			this.isShow = false;
			if (this.$refs.keyboardInput && this.$refs.keyboardInput.values) {
				let value = this.$refs.keyboardInput.values.join('');
				this.$emit('confirm', value);
			}
		},
		inputChange(index) {
			this.carIndex = index;

			// 安全检查：确保 keyboardInput 组件存在且有 values 属性
			if (!this.$refs.keyboardInput || !this.$refs.keyboardInput.values) {
				console.warn('keyboardInput 组件或其 values 属性不存在');
				return;
			}

			let newValue = this.$refs.keyboardInput.values[index - 1];

			// 安全检查：确保 keyboardBox 组件存在
			if (!this.$refs.keyboardBox) {
				console.warn('keyboardBox 组件不存在');
				return;
			}

			if (index == 0) {
				this.$refs.keyboardBox.changeMode(index == 0 ? 0 : 1);
			} else {
				this.$refs.keyboardBox.changeMode(1);
				if (this.$refs.keyboardInput.values[this.maxCarLenght - 1] != "") {
					// 安全检查：确保 keyboardInputAdd 组件存在
					if (this.$refs.keyboardInputAdd && this.$refs.keyboardInputAdd.changeCur) {
						this.$refs.keyboardInputAdd.changeCur(index - 1);
					}
				}
			}

			// 更新车牌字符数组以保持同步
			this.$nextTick(() => {
				this.updateCurrentPlateChars();
			});
		},
		inputAdd(v) {
			console.log('➕ 执行添加操作:', v);
			this.$refs.keyboardInput.toAdd(v);
			this.$refs.keyboardInputAdd.toAdd(v);
			this.$nextTick(() => {
				console.log('🔄 添加后更新车牌字符数组');
				this.updateCurrentPlateChars();
				// 触发计算属性更新
				this.plateUpdateTrigger++;
			});
		},
		inputDel() {
			console.log('🗑️ 执行删除操作');
			this.$refs.keyboardInputAdd.toDel();
			this.$refs.keyboardInput.toDel();

			// 立即更新预览区域，确保删除操作能实时反映
			this.$nextTick(() => {
				console.log('🔄 删除后更新车牌字符数组');
				this.updateCurrentPlateChars();
				// 触发计算属性更新
				this.plateUpdateTrigger++;

				// 添加额外的延迟确保更新
				setTimeout(() => {
					this.$forceUpdate();
					console.log('🔄 强制更新完成');
				}, 50);
			});
		},
		inputClear() {
			console.log('🧹 执行清除操作');
			this.$refs.keyboardInputAdd.toClear();
			this.$refs.keyboardInput.toClear();
			this.clearCurrentPlateChars();
			// 触发计算属性更新
			this.plateUpdateTrigger++;
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
		// 调整车牌字符数组长度
		adjustPlateCharsLength() {
			console.log('📏 调整车牌字符数组长度，目标长度:', this.maxCarLenght);

			// 根据新的长度创建新数组（不保留原有字符，因为在changeColor中已经清除）
			if (this.maxCarLenght === 8) {
				// 新能源车牌8位
				this.currentPlateChars = new Array(8).fill('');
			} else {
				// 传统车牌7位
				this.currentPlateChars = new Array(7).fill('');
			}

			console.log('✅ 数组长度调整完成:', this.currentPlateChars);
		},

		// 同步输入组件状态
		syncInputComponents() {
			try {
				if (this.$refs.keyboardInput && this.$refs.keyboardInputAdd) {
					// 获取当前输入的字符
					const currentValues = this.$refs.keyboardInput.values || [];

					// 清空组件
					this.$refs.keyboardInput.toClear();
					this.$refs.keyboardInputAdd.toClear();

					// 重新填充字符（限制在新的最大长度内）
					for (let i = 0; i < Math.min(currentValues.length, this.maxCarLenght); i++) {
						if (currentValues[i]) {
							this.$refs.keyboardInput.toAdd(currentValues[i]);
							this.$refs.keyboardInputAdd.toAdd(currentValues[i]);
						}
					}
				}
			} catch (error) {
				console.error('❌ 同步输入组件失败:', error);
			}
		},

		updateCurrentPlateChars() {
			if (this.$refs.keyboardInput) {
				const values = this.$refs.keyboardInput.values || [];

				// 根据车牌类型调整数组长度
				const targetLength = this.maxCarLenght;
				this.currentPlateChars = new Array(targetLength).fill('');

				// 填充实际输入的字符，确保与键盘输入组件完全同步
				for (let i = 0; i < Math.min(targetLength, values.length); i++) {
					this.currentPlateChars[i] = values[i] || '';
				}

				// 强制更新数组引用以触发响应式更新
				this.currentPlateChars = [...this.currentPlateChars];

				console.log('🔄 同步车牌字符数组:', this.currentPlateChars);
			}
		},
		// 清除所有车牌输入
		clearAllPlateInput() {
			try {
				// 清除输入组件的内容
				if (this.$refs.keyboardInput) {
					this.$refs.keyboardInput.toClear();
				}
				if (this.$refs.keyboardInputAdd) {
					this.$refs.keyboardInputAdd.toClear();
				}

				// 清除当前车牌字符数组
				this.clearCurrentPlateChars();

				console.log('🧹 已清除所有车牌输入');
			} catch (error) {
				console.error('❌ 清除车牌输入失败:', error);
			}
		},

		clearCurrentPlateChars() {
			for (let i = 0; i < this.currentPlateChars.length; i++) {
				this.currentPlateChars[i] = '';
			}
		},

		// 获取记录的真实状态
		getRecordStatus(record) {
			console.log("测试预约记录状态：", record.venuestatus);
			// 按优先级检查各种状态字段
			// 1. 首先检查auditStatus（审核状态）
			if (record.auditStatus && record.auditStatus !== '(Null)' && record.auditStatus.trim() !== '') {
				return record.auditStatus;
			}

			// 2. 检查venuestatus（场地状态）
			if (record.venuestatus && record.venuestatus !== '(Null)' && record.venuestatus.trim() !== '') {
				return record.venuestatus;
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

		// 🆕 业主地址自动填充方法


		// 🆕 获取选中的地址文本
		getSelectedAddressText() {
			try {
				// 优先返回 addressDisplay 如果有值
				if (this.addressDisplay && this.addressDisplay.trim() !== '') {
					return this.addressDisplay;
				}

				// 如果 addressDisplay 为空，从 addressValue 构建地址文本
				const parts = [];

				if (this.addressRange && this.addressRange.length >= 4) {
					// 楼栋
					if (this.addressValue[0] >= 0 && this.addressRange[0][this.addressValue[0]]) {
						parts.push(this.addressRange[0][this.addressValue[0]].name);
					}
					// 单元
					if (this.addressValue[1] >= 0 && this.addressRange[1][this.addressValue[1]]) {
						parts.push(this.addressRange[1][this.addressValue[1]].name);
					}
					// 楼层
					if (this.addressValue[2] >= 0 && this.addressRange[2][this.addressValue[2]]) {
						parts.push(this.addressRange[2][this.addressValue[2]].name);
					}
					// 房间
					if (this.addressValue[3] >= 0 && this.addressRange[3][this.addressValue[3]]) {
						parts.push(this.addressRange[3][this.addressValue[3]].name);
					}
				}

				const addressText = parts.join(' ');
				console.log('🏠 [地址文本] 构建的地址文本:', addressText);
				return addressText;

			} catch (error) {
				console.error('❌ [地址文本] 获取地址文本失败:', error);
				return '';
			}
		},

		// ================ 月票车牌相关方法 ================

		// 🆕 从月票查询数据中自动填充业主地址
		async autoFillOwnerAddressFromTicketData(monthlyTicketData) {
			try {
				console.log('🏠 [月票地址填充] 开始从月票数据中提取地址信息');

				// 检查数据结构
				if (!monthlyTicketData?.data?.data) {
					console.log('⚠️ [月票地址填充] 月票数据格式不正确，跳过地址填充');
					return;
				}

				const ticketData = monthlyTicketData.data.data;
				console.log('🏠 [月票地址填充] 月票返回的完整数据:', ticketData);

				// 从月票数据中提取地址信息
				const ownerAddress = {
					community: ticketData.community || '',
					building: String(ticketData.building || ''),
					unit: String(ticketData.units || ''),
					floor: String(ticketData.floor || ''),
					room: String(ticketData.roomnumber || '')
				};

				console.log('🏠 [月票地址填充] 从月票数据提取的地址信息:', ownerAddress);

				// 检查是否有完整地址信息
				const hasDetailedAddress = ownerAddress.building || ownerAddress.unit || ownerAddress.floor || ownerAddress.room;

				if (hasDetailedAddress) {
					console.log('✅ [月票地址填充] 发现详细地址信息，开始自动填充');

					// 确保地址数据已加载
					if (!this.addressRange || this.addressRange[0].length === 0) {
						console.log('🏠 [月票地址填充] 地址数据未加载，先加载地址数据');
						await this.loadAddressData();
					}

					// 等待地址数据加载完成
					let retries = 0;
					const maxRetries = 10;
					while ((!this.addressRange || this.addressRange[0].length === 0) && retries < maxRetries) {
						console.log(`🏠 [月票地址填充] 等待地址数据加载... (${retries + 1}/${maxRetries})`);
						await new Promise(resolve => setTimeout(resolve, 500));
						retries++;
					}

					if (this.addressRange && this.addressRange[0].length > 0) {
						// 调用自动填充方法
						await this.autoFillDetailedAddress(ownerAddress);

						// 🆕 标记为业主自动填充（不可修改）
						this.isOwnerAddressAutoFilled = true;
						this.ownerAutoFilledAddressInfo = this.getSelectedAddressText() || '';

						// 显示自动填充成功的提示
						const filledAddress = this.getSelectedAddressText() || '';
						if (filledAddress) {
							console.log('✅ [月票地址填充] 业主地址自动填充成功:', filledAddress);
						}
					} else {
						console.log('❌ [月票地址填充] 地址数据加载失败');
					}
				} else if (ownerAddress.community) {
					// 只有小区信息，设置小区但提示手动选择详细地址
					this.currentCommunityName = ownerAddress.community;
					this.form.addressInfo.community = ownerAddress.community;

					console.log('🏠 [月票地址填充] 仅设置小区信息:', ownerAddress.community);

					uni.showModal({
						title: '🏠 小区信息已设置',
						content: `已设置小区: ${ownerAddress.community}\n\n请在地址选择器中选择详细地址信息（楼栋、单元、房间等）`,
						showCancel: false,
						confirmText: '去选择'
					});
				} else {
					console.log('⚠️ [月票地址填充] 月票数据中无地址信息');
				}

			} catch (error) {
				console.error('❌ [月票地址填充] 从月票数据填充地址失败:', error);
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
				const addressInfo = await this.getAddressInfo(userInfo);
				const community = addressInfo.community || '';

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

				// 🆕 从月票数据中提取地址信息并自动填充
				await this.autoFillOwnerAddressFromTicketData(monthlyTicketData);

				// 🔧 修复：业主角色时，从月票数据中提取并设置业主信息
				await this.extractOwnerInfoFromTicketData(monthlyTicketData);

				// 🔒 业主角色：标记地址为业主自动填充（不可修改）
				if (this.selectedOwnerInfo && this.selectedOwnerInfo.ownername) {
					this.isOwnerAddressAutoFilled = true;
					this.ownerAutoFilledAddressInfo = this.getSelectedAddressText() || '';
					console.log('🔒 [业主角色] 地址已标记为不可修改:', this.ownerAutoFilledAddressInfo);
				}

				// 查询完成提示
				if (this.monthlyTicketPlates.length > 0) {
					const source = monthlyTicketData?.data?.source || 'unknown';
					const sourceText = source === 'local_database' ? '(本地数据)' : '(外部API)';
					uni.showToast({
						title: `找到${this.monthlyTicketPlates.length}个月票车牌${sourceText}`,
						icon: 'success',
						duration: 2000
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
			console.log("测试月票数据 = " + data.data.data.ownername);
			try {
				let plateList = [];

				// 处理不同的响应数据结构
				if (data && data.data) {
					// 检查嵌套数据结构
					if (data.data.data && Array.isArray(data.data.data)) {
						plateList = data.data.data;
					} else if (Array.isArray(data.data)) {
						plateList = data.data;
					} else if (data.data.plateNumbers && Array.isArray(data.data.plateNumbers)) {
						plateList = data.data.plateNumbers;
					} else if (data.data.data.monthlyTickets && Array.isArray(data.data.data.monthlyTickets)) {
						plateList = data.data.data.monthlyTickets;
					}
				} else if (Array.isArray(data)) {
					plateList = data;
				}

				// 提取车牌号码
				plateList.forEach((item, index) => {
					let plateNumber = '';
					let ticketInfo = '';
					console.log("测试车牌号码 = " + item.plateNumber);
					if (typeof item === 'string') {
						// 直接是车牌号字符串
						plateNumber = item.trim();
					} else if (typeof item === 'object' && item !== null) {
						// 从对象中提取车牌号
						plateNumber = item.plateNumber ||
							item.platenumber ||
							item.carNumber ||
							item.carnumber ||
							item.plate ||
							item.number ||
							'';

						// 提取票据信息（如有效期等）
						if (item.expireDate || item.validUntil || item.endDate) {
							const expireDate = item.expireDate || item.validUntil || item.endDate;
							ticketInfo = ` (有效期至: ${this.formatExpireDate(expireDate)})`;
						} else if (item.status) {
							ticketInfo = ` (状态: ${item.status})`;
						}
					}

					if (plateNumber && plateNumber.length >= 7) {
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
					}
				});

				// 构建 u-picker 的 columns 数据格式
				// 尝试两种格式：对象数组和字符串数组
				this.monthlyPickerColumns = [
					this.monthlyTicketOptions.map(option => option.label)
				];

				// 备份对象格式以便后续使用
				this.monthlyPickerObjectData = [
					this.monthlyTicketOptions.map(option => ({
						text: option.label,
						value: option.value
					}))
				];

				console.log(`🎫 解析到 ${this.monthlyTicketPlates.length} 个月票车牌:`, this.monthlyTicketPlates);
				console.log('🎫 月票选择器原始数据 monthlyTicketOptions:', this.monthlyTicketOptions);
				console.log('🎫 月票选择器最终数据 monthlyPickerColumns:', this.monthlyPickerColumns);
				console.log('🎫 第一个选项详情:', this.monthlyPickerColumns[0] && this.monthlyPickerColumns[0][0]);
				console.log('🎫 数据类型检查 - 第一个选项类型:', typeof (this.monthlyPickerColumns[0] && this.monthlyPickerColumns[0][0]));

				if (this.monthlyTicketPlates.length === 0) {
					this.monthlyTicketError = '暂无可用的月票车牌信息';
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

		// 🔧 修复：从月票数据中提取业主信息
		async extractOwnerInfoFromTicketData(monthlyTicketData) {
			try {
				console.log('👤 [业主信息提取] 开始从月票数据中提取业主信息');

				// 检查数据结构
				if (!monthlyTicketData?.data?.data) {
					console.log('⚠️ [业主信息提取] 月票数据格式不正确，跳过业主信息提取');
					return;
				}

				const ticketData = monthlyTicketData.data.data;
				console.log('👤 [业主信息提取] 月票返回的完整数据:', ticketData);

				// 从月票数据中提取业主信息
				const ownerInfo = {
					ownername: ticketData.ownername || '',
					ownerphone: ticketData.ownerphone || '',
					community: ticketData.community || '',
					building: String(ticketData.building || ''),
					units: String(ticketData.units || ''),
					floor: String(ticketData.floor || ''),
					roomnumber: String(ticketData.roomnumber || ''),
					province: ticketData.province || '',
					city: ticketData.city || '',
					district: ticketData.district || ''
				};

				console.log('👤 [业主信息提取] 从月票数据提取的业主信息:', ownerInfo);

				// 检查是否有有效的业主信息
				if (ownerInfo.ownername && ownerInfo.ownername.trim() !== '') {
					console.log('✅ [业主信息提取] 发现有效的业主信息，开始设置');

					// 设置业主信息到 selectedOwnerInfo，用于后续提交
					this.selectedOwnerInfo = ownerInfo;

					// 🔧 修复：确保地址信息也正确保存到表单中
					if (ownerInfo.community) this.form.addressInfo.community = ownerInfo.community;
					if (ownerInfo.building) this.form.addressInfo.building = ownerInfo.building;
					if (ownerInfo.units) this.form.addressInfo.units = ownerInfo.units;
					if (ownerInfo.floor) this.form.addressInfo.floor = ownerInfo.floor;
					if (ownerInfo.roomnumber) this.form.addressInfo.roomnumber = ownerInfo.roomnumber;
					if (ownerInfo.province) this.form.addressInfo.province = ownerInfo.province;
					if (ownerInfo.city) this.form.addressInfo.city = ownerInfo.city;
					if (ownerInfo.district) this.form.addressInfo.district = ownerInfo.district;

					// 更新完整地址
					this.updateFullAddress();

					console.log('✅ [业主信息提取] 业主信息设置完成:', {
						selectedOwnerInfo: this.selectedOwnerInfo,
						formAddressInfo: this.form.addressInfo
					});

					// 显示业主信息获取成功的提示
					console.log('🎉 [业主信息提取] 业主信息自动获取成功:', ownerInfo.ownername);
				} else {
					console.log('⚠️ [业主信息提取] 月票数据中无有效的业主姓名信息');
				}

			} catch (error) {
				console.error('❌ [业主信息提取] 从月票数据提取业主信息失败:', error);
			}
		},

		// 显示月票选择器
		openMonthlyPicker() {
			console.log('🎫 准备显示月票选择器');
			console.log('🎫 月票车牌数量:', this.monthlyTicketPlates.length);
			console.log('🎫 选择器数据检查 monthlyPickerColumns:', this.monthlyPickerColumns);

			if (this.monthlyTicketPlates.length === 0) {
				uni.showToast({
					title: '暂无可用的月票车牌',
					icon: 'none',
					duration: 2000
				});
				return;
			}

			// 确保数据格式正确
			if (!this.monthlyPickerColumns || this.monthlyPickerColumns.length === 0 || this.monthlyPickerColumns[0].length === 0) {
				console.error('🎫 选择器数据为空，重新构建数据');
				// 重新构建数据
				this.monthlyPickerColumns = [
					this.monthlyTicketOptions.map(option => option.label)
				];
			}

			console.log('🎫 最终选择器数据:', this.monthlyPickerColumns);

			// 强制更新组件
			this.$nextTick(() => {
				this.showMonthlyPicker = true;
			});
		},

		// 月票车牌选择确认处理
		onMonthlyPlateConfirm(selection) {
			console.log('🎫 用户选择月票车牌:', selection);
			console.log('🎫 选择的详细信息:', JSON.stringify(selection, null, 2));

			this.showMonthlyPicker = false;

			try {
				if (selection && selection.value && selection.value.length > 0) {
					// 获取选中的显示文本（完整标签）
					const selectedLabel = selection.value[0];
					console.log('🎫 选中的标签:', selectedLabel, typeof selectedLabel);

					// 从标签中提取车牌号（去掉状态信息）
					let plateNumber = '';
					if (typeof selectedLabel === 'string') {
						// 提取车牌号部分，去掉括号及其内容
						const match = selectedLabel.match(/^([^\s\(]+)/);
						plateNumber = match ? match[1] : selectedLabel.split(' ')[0];
					}

					console.log('🎫 提取的车牌号码:', plateNumber);

					if (plateNumber) {
						// 设置选中的车牌号用于显示
						this.selectedMonthlyPlate = plateNumber;

						// 🔧 先根据车牌号自动选择车牌类型（设置正确的maxCarLenght）
						this.autoSelectPlateType(plateNumber);

						// 🔧 等待DOM更新完成后再填充到输入框
						this.$nextTick(() => {
							this.fillPlateNumber(plateNumber);
						});

						uni.showToast({
							title: `已选择车牌: ${plateNumber}`,
							icon: 'success',
							duration: 1500
						});
					} else {
						throw new Error('无法提取车牌号码');
					}

				} else {
					throw new Error('选择器返回数据格式错误');
				}

			} catch (error) {
				console.error('🎫 处理月票选择失败:', error);
				uni.showToast({
					title: '选择失败，请重试',
					icon: 'none',
					duration: 2000
				});
			}
		},

		// 填充车牌号到输入区域
		fillPlateNumber(plateNumber) {
			console.log('🎫 开始填充车牌号:', plateNumber, typeof plateNumber);

			// 确保plateNumber是字符串
			if (typeof plateNumber === 'object') {
				console.warn('🎫 车牌号码是对象，尝试提取value属性:', plateNumber);
				plateNumber = plateNumber.value || plateNumber.text || '';
			}

			if (!plateNumber || typeof plateNumber !== 'string') {
				console.error('🎫 无效的车牌号码:', plateNumber);
				return;
			}

			try {
				// 等待组件完全加载后再填充
				this.$nextTick(() => {
					try {
						// 清空当前输入
						if (this.$refs.keyboardInput && this.$refs.keyboardInput.toClear) {
							this.$refs.keyboardInput.toClear();
						}
						if (this.$refs.keyboardInputAdd && this.$refs.keyboardInputAdd.toClear) {
							this.$refs.keyboardInputAdd.toClear();
						}
						console.log('🎫 准备逐字符添加:', plateNumber, '长度:', plateNumber.length, 'maxCarLenght:', this.maxCarLenght);
						// 逐个添加字符
						for (let i = 0; i < plateNumber.length && i < this.maxCarLenght; i++) {
							const char = plateNumber.charAt(i);
							console.log('🎫 添加字符:', char, '位置:', i);

							if (this.$refs.keyboardInput && this.$refs.keyboardInput.toAdd) {
								this.$refs.keyboardInput.toAdd(char);
							}
							if (this.$refs.keyboardInputAdd && this.$refs.keyboardInputAdd.toAdd) {
								this.$refs.keyboardInputAdd.toAdd(char);
							}
						}
						// 强制更新显示和响应式数据
						this.$nextTick(() => {
							this.updateCurrentPlateChars();
							// 强制更新计算属性
							this.plateUpdateTrigger++;
						});

						console.log('🎫 车牌号填充完成:', plateNumber);

						// 显示成功提示
						uni.showToast({
							title: `车牌号已填充: ${plateNumber}`,
							icon: 'success',
							duration: 1500
						});

					} catch (innerError) {
						console.error('🎫 组件操作失败:', innerError);
						this.fallbackFillPlateNumber(plateNumber);
					}
				});

			} catch (error) {
				console.error('🎫 填充车牌号失败:', error);
				this.fallbackFillPlateNumber(plateNumber);
			}
		},

		// 备用的车牌填充方法
		fallbackFillPlateNumber(plateNumber) {
			try {
				console.log('🎫 使用备用方法填充车牌号:', plateNumber);

				// 直接更新车牌字符数组
				this.currentPlateChars = new Array(this.maxCarLenght).fill('');
				for (let i = 0; i < plateNumber.length && i < this.maxCarLenght; i++) {
					this.currentPlateChars[i] = plateNumber.charAt(i);
				}

				// 强制更新响应式数据
				this.currentPlateChars = [...this.currentPlateChars];
				this.plateUpdateTrigger++;

				console.log('🎫 备用方法填充完成:', this.currentPlateChars);

				uni.showToast({
					title: `车牌号已填充: ${plateNumber}`,
					icon: 'success',
					duration: 1500
				});
			} catch (error) {
				console.error('🎫 备用填充方法也失败:', error);
				uni.showToast({
					title: '填充车牌失败，请手动输入',
					icon: 'none',
					duration: 2000
				});
			}
		},

		// 根据车牌号自动选择车牌类型
		autoSelectPlateType(plateNumber) {
			if (!plateNumber) return;

			console.log('🔄 自动选择车牌类型:', plateNumber, '长度:', plateNumber.length);

			// 根据车牌长度和特征判断类型
			if (plateNumber.length === 8) {
				// 新能源车牌
				console.log('🟢 识别为新能源车牌，切换到绿牌');
				this.changeColor('linear-gradient(to bottom, #d0f1e4, #6ad390)');
			} else if (plateNumber.length === 7) {
				// 传统车牌，根据颜色特征判断
				// 这里可以根据实际业务逻辑调整
				// 默认选择蓝牌
				console.log('🔵 识别为传统车牌，切换到蓝牌');
				this.changeColor('linear-gradient(to bottom, #216fef, #0c4fc5)');
			} else {
				console.warn('⚠️ 未知车牌长度:', plateNumber.length);
			}

			console.log('✅ 车牌类型切换完成，当前maxCarLenght:', this.maxCarLenght, 'plateType:', this.plateType);
		},

		// 初始化地址数据
		async initAddressData() {
			try {
				// 获取当前小区信息
				const userInfo = uni.getStorageSync('userInfo');
				const addressInfo = await this.getAddressInfo(userInfo);

				this.currentCommunity = addressInfo.community || '';

				if (this.currentCommunity) {
					// 加载楼栋数据
					await this.loadBuildingOptions();

					// 如果有默认值，则自动选中
					if (addressInfo.building) {
						this.selectedBuilding = addressInfo.building;
						await this.loadUnitOptions();

						if (addressInfo.units) {
							this.selectedUnit = addressInfo.units;
							await this.loadRoomOptions();

							if (addressInfo.room) {
								this.selectedRoom = addressInfo.room;
							}
						}
					}
				}
			} catch (error) {
				console.error('初始化地址数据失败:', error);
				uni.showToast({
					title: '加载地址信息失败',
					icon: 'none'
				});
			}
		},

		// 加载楼栋选项
		async loadBuildingOptions() {
			try {
				this.isLoadingOptions = true;
				const {
					buildingAPI
				} = require('@/config/api.js');

				// 调用API获取楼栋列表
				const response = await buildingAPI.getBuildings(this.currentCommunity);

				// 处理响应数据
				if (response && response.data) {
					this.buildingOptions = this.formatBuildingOptions(response.data);
				}
			} catch (error) {
				console.error('加载楼栋数据失败:', error);
				uni.showToast({
					title: '加载楼栋失败',
					icon: 'none'
				});
			} finally {
				this.isLoadingOptions = false;
			}
		},

		// 加载单元选项
		async loadUnitOptions() {
			if (!this.selectedBuilding) return;

			try {
				this.isLoadingOptions = true;
				const {
					buildingAPI
				} = require('@/config/api.js');

				// 调用API获取单元列表
				const response = await buildingAPI.getUnits(this.currentCommunity, this.selectedBuilding);

				// 处理响应数据
				if (response && response.data) {
					this.unitOptions = this.formatUnitOptions(response.data);
				}
			} catch (error) {
				console.error('加载单元数据失败:', error);
				uni.showToast({
					title: '加载单元失败',
					icon: 'none'
				});
			} finally {
				this.isLoadingOptions = false;
			}
		},

		// 加载房间选项
		async loadRoomOptions() {
			if (!this.selectedBuilding || !this.selectedUnit) return;

			try {
				this.isLoadingOptions = true;
				const {
					buildingAPI
				} = require('@/config/api.js');

				// 调用API获取房间列表
				const response = await buildingAPI.getRooms(
					this.currentCommunity,
					this.selectedBuilding,
					this.selectedUnit
				);

				// 处理响应数据
				if (response && response.data) {
					this.roomOptions = this.formatRoomOptions(response.data);
				}
			} catch (error) {
				console.error('加载房间数据失败:', error);
				uni.showToast({
					title: '加载房间失败',
					icon: 'none'
				});
			} finally {
				this.isLoadingOptions = false;
			}
		},

		// 格式化选项数据
		formatBuildingOptions(data) {
			// 根据实际数据结构处理
			return Array.isArray(data) ? data.map(item => ({
				text: `${item}栋`,
				value: item
			})) : [];
		},

		formatUnitOptions(data) {
			return Array.isArray(data) ? data.map(item => ({
				text: `${item}单元`,
				value: item
			})) : [];
		},

		formatRoomOptions(data) {
			return Array.isArray(data) ? data.map(item => ({
				text: `${item}室`,
				value: item
			})) : [];
		},

		// 打开选择器
		openPicker(type) {
			this.currentPickerType = type;

			switch (type) {
				case 'building':
					this.pickerColumns = [this.buildingOptions];
					this.pickerDefaultIndex = [Math.max(0, this.buildingOptions.findIndex(
						item => item.value === this.selectedBuilding
					))];
					break;
				case 'unit':
					if (!this.selectedBuilding) {
						uni.showToast({
							title: '请先选择楼栋',
							icon: 'none'
						});
						return;
					}
					this.pickerColumns = [this.unitOptions];
					this.pickerDefaultIndex = [Math.max(0, this.unitOptions.findIndex(
						item => item.value === this.selectedUnit
					))];
					break;
				case 'room':
					if (!this.selectedUnit) {
						uni.showToast({
							title: '请先选择单元',
							icon: 'none'
						});
						return;
					}
					this.pickerColumns = [this.roomOptions];
					this.pickerDefaultIndex = [Math.max(0, this.roomOptions.findIndex(
						item => item.value === this.selectedRoom
					))];
					break;
			}

			this.showPicker = true;
		},

		// 关闭选择器
		closePicker() {
			this.showPicker = false;
			this.currentPickerType = '';
		},

		// 选择器确认
		async onPickerConfirm(e) {
			const selectedOption = this.pickerColumns[0][e.value[0]];

			switch (this.currentPickerType) {
				case 'building':
					this.selectedBuilding = selectedOption.value;
					this.selectedUnit = '';
					this.selectedRoom = '';
					await this.loadUnitOptions();
					break;
				case 'unit':
					this.selectedUnit = selectedOption.value;
					this.selectedRoom = '';
					await this.loadRoomOptions();
					break;
				case 'room':
					this.selectedRoom = selectedOption.value;
					break;
			}

			this.closePicker();

			// 更新表单数据
			this.updateFormAddress();
		},

		// 更新表单地址信息
		updateFormAddress() {
			// 更新地址展示
			if (this.selectedBuilding) {
				let buildingInfo = `${this.selectedBuilding}栋`;
				if (this.selectedUnit) {
					buildingInfo += ` ${this.selectedUnit}单元`;
					if (this.selectedRoom) {
						buildingInfo += ` ${this.selectedRoom}室`;
					}
				}
				this.parkingLotInfo.buildingInfo = buildingInfo;
			} else {
				this.parkingLotInfo.buildingInfo = '';
			}
		},

		// 加载当前小区信息
		async loadCurrentCommunityInfo() {
			try {
				uni.showLoading({
					title: '加载地址信息...'
				});

				// 从本地存储获取小区信息
				const parkInfo = uni.getStorageSync('parkInfo');

				if (parkInfo) {
					console.log('📍 从本地存储获取到小区信息:', parkInfo);

					// 尝试解码小区名称
					let communityName = parkInfo.name;
					if (communityName && typeof communityName === 'string' && communityName.includes('%')) {
						try {
							communityName = decodeURIComponent(communityName);
							console.log('📍 小区名称已解码:', communityName);
						} catch (e) {
							console.error('解码小区名称失败:', e);
						}
					}

					// 确保地址信息完整
					let fullAddress = '';
					if (parkInfo.fullAddress) {
						fullAddress = parkInfo.fullAddress;
					} else if (parkInfo.province && parkInfo.city) {
						fullAddress = `${parkInfo.province}${parkInfo.city}${parkInfo.district || ''}`;
						if (parkInfo.address) {
							fullAddress += parkInfo.address;
						} else if (parkInfo.name) {
							fullAddress += parkInfo.name;
						}
					} else {
						// fullAddress = '黑龙江省哈尔滨市香坊区和平路115号';
						console.log("🔍 使用默认地址2553:", fullAddress);
					}

					// 更新停车场信息显示
					this.parkingLotInfo = {
						fullName: parkInfo.fullName || communityName + '-停车场',
						fullAddress: fullAddress,
						buildingInfo: this.parkingLotInfo?.buildingInfo || ''
					};

					// 设置当前小区名称
					this.currentCommunityName = communityName;

					// 初始化表单地址信息
					this.form.addressInfo.province = parkInfo.province || '';
					this.form.addressInfo.city = parkInfo.city || '';
					this.form.addressInfo.district = parkInfo.district || '';
					this.form.addressInfo.community = communityName;

					// 更新页面标题
					uni.setNavigationBarTitle({
						title: this.parkingLotInfo.fullName
					});

					console.log('✅ 停车场信息已更新:', this.parkingLotInfo);
					console.log('✅ 表单地址信息已初始化:', this.form.addressInfo);
				} else {
					console.log('⚠️ 未找到本地存储的小区信息，使用默认值');

					// 如果没有存储的小区信息，使用空值
					this.parkingLotInfo = {
						fullName: '停车场',
						fullAddress: '',
						buildingInfo: ''
					};
					this.currentCommunityName = '';

					// 初始化默认地址信息（空值）
					this.form.addressInfo.province = '';
					this.form.addressInfo.city = '';
					this.form.addressInfo.district = '';
					this.form.addressInfo.community = '';
				}

				// 加载地址数据
				await this.loadAddressData();

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
				console.log('🚀 开始加载四级地址数据');

				// 从本地存储获取小区信息
				const parkInfo = uni.getStorageSync('parkInfo');
				let communityName = parkInfo?.name || this.currentCommunityName || '';

				// 如果communityName是URL编码的形式，进行解码
				try {
					if (communityName && typeof communityName === 'string' && communityName.includes('%')) {
						communityName = decodeURIComponent(communityName);
						console.log('📍 检测到编码的小区名称,已解码');
					}
				} catch (e) {
					console.error('解码小区名称失败:', e);
				}

				console.log('📍 原始小区名称:', parkInfo?.name);
				console.log('📍 处理后小区名称:', communityName);

				// 显示加载提示
				uni.showLoading({
					title: '加载地址数据...',
					mask: true
				});

				const response = await uni.request({
					// url: `https://www.xuerparking.cn:8543/parking/community/getAllCommunity?community=${encodeURIComponent(communityName)}`,
					url: `http://localhost:8543/parking/community/getAllCommunity?community=${encodeURIComponent(communityName)}`,
					method: 'GET',
					header: {
						'content-type': 'application/json'
					},
					timeout: 10000
				});

				console.log('📊 API返回数据:', response.data);

				if (!response.data) {
					throw new Error('未收到服务器响应');
				}

				if (response.data.code !== "0") {
					throw new Error(response.data.msg || '服务器返回错误');
				}

				// 处理双层嵌套的数据结构
				let addressData = response.data.data;
				
				// 检查是否有内层嵌套
				if (addressData && addressData.code === "0" && addressData.data) {
					addressData = addressData.data;
				}

				if (!Array.isArray(addressData)) {
					throw new Error('返回数据格式错误');
				}

				if (addressData.length === 0) {
					throw new Error(`未找到小区"${communityName}"的地址数据`);
				}

				// 检查数据结构
				const hasValidData = addressData.some(item =>
					item.building && item.units && item.floor && item.roomnumber
				);

				if (!hasValidData) {
					throw new Error('返回的地址数据结构不完整');
				}

				console.log('📊 获取到地址数据:', addressData.length, '条记录');
				this.buildAddressTree(addressData);

			} catch (error) {
				console.error('❌ 加载地址数据失败:', error);
				uni.showToast({
					title: error.message || '地址信息加载失败',
					icon: 'none',
					duration: 3000
				});
			} finally {
				// 隐藏加载提示
				uni.hideLoading();
			}
		},

		// 构建四级地址树形结构
		buildAddressTree(data) {
			try {
				console.log('🏗️ 开始构建地址树');

				this.addressData = {};
				this.addressRange = [[], [], [], []];

				// 按栋分组
				const buildingMap = {};
				let validItemCount = 0;

				data.forEach((item, index) => {
					const {
						building,
						units,
						floor,
						roomnumber
					} = item;

					// 检查数据完整性
					if (!building || !units || !floor || !roomnumber) {
						console.warn(`⚠️ 第${index + 1}条数据不完整:`, item);
						return;
					}

					validItemCount++;

					if (!buildingMap[building]) {
						buildingMap[building] = {};
					}
					if (!buildingMap[building][units]) {
						buildingMap[building][units] = {};
					}
					if (!buildingMap[building][units][floor]) {
						buildingMap[building][units][floor] = [];
					}
					buildingMap[building][units][floor].push(roomnumber);
				});

				console.log(`✅ 数据处理完成: 总计${data.length}条记录，有效数据${validItemCount}条`);

				if (validItemCount === 0) {
					throw new Error('没有找到有效的地址数据');
				}

				this.addressData = buildingMap;

				// 初始化第一级选项（栋）
				this.addressRange[0] = Object.keys(buildingMap).map(building => ({
					name: building + '栋'
				}));

				console.log('📊 地址树结构:', {
					buildingCount: this.addressRange[0].length,
					buildings: this.addressRange[0].map(b => b.name)
				});

				// 如果有栋的选项，初始化第二级选项（单元）
				if (this.addressRange[0].length > 0) {
					this.updateColumnOptions(0, 0);
					console.log('✅ 地址树构建完成');
				} else {
					throw new Error('未能生成有效的楼栋选项');
				}
			} catch (error) {
				console.error('❌ 构建地址树失败:', error);
				uni.showToast({
					title: error.message || '地址数据处理失败',
					icon: 'none',
					duration: 3000
				});
			}
		},

		// 更新指定列的选项
		updateColumnOptions(columnIndex, selectedIndex) {
			for (let i = columnIndex + 1; i < 4; i++) {
				this.addressRange[i] = [];
				this.addressValue[i] = 0;
			}

			if (columnIndex === 0) {
				// 栋选择变化，更新单元选项
				const selectedBuilding = this.addressRange[0][selectedIndex].name.replace('栋', '');
				if (this.addressData[selectedBuilding]) {
					this.addressRange[1] = Object.keys(this.addressData[selectedBuilding]).map(units => ({
						name: units + '单元'
					}));
					if (this.addressRange[1].length > 0) {
						this.updateColumnOptions(1, 0);
					}
				}
			} else if (columnIndex === 1) {
				// 单元选择变化，更新楼层选项
				const selectedBuilding = this.addressRange[0][this.addressValue[0]].name.replace('栋', '');
				const selectedUnits = this.addressRange[1][selectedIndex].name.replace('单元', '');
				if (this.addressData[selectedBuilding][selectedUnits]) {
					this.addressRange[2] = Object.keys(this.addressData[selectedBuilding][selectedUnits]).map(floor =>
					({
						name: floor + '楼'
					}));
					if (this.addressRange[2].length > 0) {
						this.updateColumnOptions(2, 0);
					}
				}
			} else if (columnIndex === 2) {
				// 楼层选择变化，更新房间选项
				const selectedBuilding = this.addressRange[0][this.addressValue[0]].name.replace('栋', '');
				const selectedUnits = this.addressRange[1][this.addressValue[1]].name.replace('单元', '');
				const selectedFloor = this.addressRange[2][selectedIndex].name.replace('楼', '');
				if (this.addressData[selectedBuilding][selectedUnits][selectedFloor]) {
					this.addressRange[3] = this.addressData[selectedBuilding][selectedUnits][selectedFloor].map(room =>
					({
						name: room + '室'
					}));
				}
			}
		},

		// 四级选择器列变化事件
		onAddressColumnChange(e) {
			// 🆕 检查是否为业主自动填充地址，如果是则阻止修改
			if (this.isOwnerAddressAutoFilled) {
				console.log('🔒 [地址保护] 业主自动填充地址，不允许修改');
				uni.showToast({
					title: '业主地址不可修改',
					icon: 'none',
					duration: 2000
				});
				return;
			}

			const {
				column,
				value
			} = e.detail;
			this.addressValue[column] = value;
			this.updateColumnOptions(column, value);
			this.updateAddressDisplay();

			// 🔧 重要修复：地址列变化时，清除之前的业主信息
			if (this.currentUserRole === 'manager') {
				console.log('🧹 [地址列变化] 清除之前的业主信息');
				this.clearOwnerInfo();
			}
		},

		// 四级选择器确认选择事件
		onAddressChange(e) {
			// 🆕 检查是否为业主自动填充地址，如果是则阻止修改
			if (this.isOwnerAddressAutoFilled) {
				console.log('🔒 [地址保护] 业主自动填充地址，不允许修改');
				uni.showToast({
					title: '业主地址不可修改',
					icon: 'none',
					duration: 2000
				});
				return;
			}

			console.log('🏠 [地址选择] 用户选择了地址:', e.detail.value);
			this.addressValue = e.detail.value;
			this.updateFormAddress();
			this.updateAddressDisplay();
			this.updateFullAddress();
		},

		// 更新表单地址数据
		async updateFormAddress() {
			console.log('🏠 [地址更新] 开始更新表单地址数据');
			console.log('🏠 [地址更新] 当前用户角色:', this.currentUserRole);
			console.log('🏠 [地址更新] addressValue:', this.addressValue);
			console.log('🏠 [地址更新] addressRange:', this.addressRange);

			const [buildingIndex, unitsIndex, floorIndex, roomIndex] = this.addressValue;

			// 更新楼栋、单元、楼层、房间信息
			if (this.addressRange[0][buildingIndex]) {
				this.form.addressInfo.building = this.addressRange[0][buildingIndex].name.replace('栋', '');
				console.log('🏠 [地址更新] 楼栋:', this.form.addressInfo.building);
			}
			if (this.addressRange[1][unitsIndex]) {
				this.form.addressInfo.units = this.addressRange[1][unitsIndex].name.replace('单元', '');
				console.log('🏠 [地址更新] 单元:', this.form.addressInfo.units);
			}
			if (this.addressRange[2][floorIndex]) {
				this.form.addressInfo.floor = this.addressRange[2][floorIndex].name.replace('楼', '');
				console.log('🏠 [地址更新] 楼层:', this.form.addressInfo.floor);
			}
			if (this.addressRange[3][roomIndex]) {
				this.form.addressInfo.roomnumber = this.addressRange[3][roomIndex].name.replace('室', '');
				console.log('🏠 [地址更新] 房间号:', this.form.addressInfo.roomnumber);
			}

			// 确保省市区和小区信息正确设置
			const userInfo = uni.getStorageSync('userInfo');
			const addressInfo = await this.getAddressInfo(userInfo);

			this.form.addressInfo.province = addressInfo.province;
			this.form.addressInfo.city = addressInfo.city;
			this.form.addressInfo.district = addressInfo.district;
			this.form.addressInfo.community = addressInfo.community;

			console.log('📍 [地址更新] 最终地址信息:', this.form.addressInfo);

			// 🔧 重要修复：地址变更时，先清除之前的业主信息（管家和访客都需要清除）
			if (this.currentUserRole === 'manager' || this.currentUserRole === 'visitor') {
				const roleText = this.currentUserRole === 'manager' ? '管家' : '访客';
				console.log(`🧹 [地址更新] ${roleText}角色，清除之前的业主信息`);
				this.clearOwnerInfo();
			}

			// 🆕 如果是管家或访客角色，且地址完整（有房间号），查询该地址的业主信息
			const needQueryOwner = (this.currentUserRole === 'manager' || this.currentUserRole === 'visitor') 
				&& this.form.addressInfo.roomnumber;
			
			if (needQueryOwner) {
				const roleText = this.currentUserRole === 'manager' ? '管家' : '访客';
				console.log(`👤 [地址更新] ${roleText}角色，开始查询业主信息`);
				await this.searchOwnerByAddress();
			} else {
				console.log('⚠️ [地址更新] 不满足查询条件:', {
					currentRole: this.currentUserRole,
					needQuery: this.currentUserRole === 'manager' || this.currentUserRole === 'visitor',
					hasRoomNumber: !!this.form.addressInfo.roomnumber
				});
			}
		},

		// 更新地址显示文本
		updateAddressDisplay() {
			const parts = [];
			const [buildingIndex, unitsIndex, floorIndex, roomIndex] = this.addressValue;

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
		},

		// 更新完整地址
		updateFullAddress() {
			const parts = [];

			if (this.form.addressInfo.building) parts.push(this.form.addressInfo.building + '栋');
			if (this.form.addressInfo.units) parts.push(this.form.addressInfo.units + '单元');
			if (this.form.addressInfo.floor) parts.push(this.form.addressInfo.floor + '楼');
			if (this.form.addressInfo.roomnumber) parts.push(this.form.addressInfo.roomnumber + '室');

			this.form.fullAddress = parts.join('');
		},

		// 重置地址选择状态（如果需要的话）
		resetAddressSelection() {
			this.isAddressAutoFilled = false;
			this.autoFilledAddressInfo = '';
			this.isOwnerAddressAutoFilled = false;
			this.ownerAutoFilledAddressInfo = '';
			this.addressValue = [0, 0, 0, 0];
			this.addressDisplay = '';
			this.form.addressInfo = {
				province: '',
				city: '',
				district: '',
				community: '',
				building: '',
				units: '',
				floor: '',
				roomnumber: ''
			};
			this.form.fullAddress = '';
		},

		// 处理扫码传入的地址参数
		async processScannedAddressParams(options) {
			try {
				console.log('📍 接收到扫码地址参数:', options);
				console.log('👤 当前用户角色:', this.currentUserRole);

				// 🔍 详细调试：检查原始参数
				console.log('🔍 [调试] 原始参数类型和内容:');
				console.log('🔍 options.community:', typeof options.community, '=', options.community);
				console.log('🔍 options.building:', typeof options.building, '=', options.building);
				console.log('🔍 options.unit:', typeof options.unit, '=', options.unit);
				console.log('🔍 options.units:', typeof options.units, '=', options.units);
				console.log('🔍 options.floor:', typeof options.floor, '=', options.floor);
				console.log('🔍 options.room:', typeof options.room, '=', options.room);

				// 🔍 检查地址信息是否已经在 options 中（应该在 validateQrCode 中已经处理过）
				if (options.qrId && !options.building && !options.unit && !options.floor && !options.room) {
					console.log('⚠️ 检测到 qrId 但缺少地址字段，尝试从本地存储获取扫码地址信息');
					console.log('🔍 当前 options 中的所有字段:', Object.keys(options));
					console.log('🔍 qrValidated 状态:', this.qrValidated);

					// 🆕 尝试从本地存储获取扫码地址信息
					const scannedAddressInfo = uni.getStorageSync('scannedAddressInfo');
					if (scannedAddressInfo) {
						console.log('💾 从本地存储获取到扫码地址信息:', scannedAddressInfo);

						// 检查数据是否新鲜（5分钟内）
						const isDataFresh = scannedAddressInfo.timestamp &&
							(Date.now() - scannedAddressInfo.timestamp) < 5 * 60 * 1000;

						if (isDataFresh) {
							console.log('✅ 扫码地址信息数据新鲜，合并到 options 中');

							// 将本地存储的地址信息合并到 options 中
							// 🚀 重要：首先处理qrId参数
							options.qrId = scannedAddressInfo.qrId || options.qrId;
							options.community = scannedAddressInfo.community || options.community;
							options.building = scannedAddressInfo.building || options.building;
							options.unit = scannedAddressInfo.unit || options.unit;
							options.floor = scannedAddressInfo.floor || options.floor;
							options.room = scannedAddressInfo.room || options.room;
							options.butlerName = scannedAddressInfo.butlerName || options.butlerName;
							options.butlerPhone = scannedAddressInfo.butlerPhone || options.butlerPhone;
							options.visitorPhone = scannedAddressInfo.visitorPhone || options.visitorPhone;

							console.log('🔧 合并本地存储地址信息后的 options:', options);
						} else {
							console.log('⚠️ 扫码地址信息数据过期，清除本地存储');
							uni.removeStorageSync('scannedAddressInfo');
						}
					} else {
						console.log('❌ 本地存储中未找到扫码地址信息');
					}
				}

				// 解析URL参数（安全解码，避免解码错误）
				const scannedAddress = {};

				// 安全解码函数
				const safeDecodeURIComponent = (value) => {
					if (!value) return '';
					try {
						// 如果值已经是解码后的中文，直接返回
						if (typeof value === 'string' && /[\u4e00-\u9fa5]/.test(value)) {
							console.log('🔍 检测到中文字符，无需解码:', value);
							return value;
						}
						// 如果包含 % 符号，尝试解码
						if (typeof value === 'string' && value.includes('%')) {
							const decoded = decodeURIComponent(value);
							console.log('🔍 解码:', value, '->', decoded);
							return decoded;
						}
						// 否则直接返回原值
						console.log('🔍 无需解码，直接返回:', value);
						return value;
					} catch (error) {
						console.warn('🔍 解码失败，返回原值:', value, error);
						return value;
					}
				};

				// 逐个字段进行安全解码
				// 🚀 重要：添加qrId参数处理
				scannedAddress.qrId = options.qrId; // qrId不需要解码，直接使用
				scannedAddress.community = safeDecodeURIComponent(options.community);
				scannedAddress.building = safeDecodeURIComponent(options.building);
				scannedAddress.unit = safeDecodeURIComponent(options.units) || safeDecodeURIComponent(options.unit); // 🔧 修复：支持units和unit两种参数名
				scannedAddress.floor = safeDecodeURIComponent(options.floor);
				scannedAddress.room = safeDecodeURIComponent(options.room);
				scannedAddress.visitorPhone = safeDecodeURIComponent(options.visitorPhone);
				scannedAddress.butlerName = safeDecodeURIComponent(options.butlerName);

				console.log('📍 解析后的地址信息:', scannedAddress);
				console.log('📍 地址字段详情:', {
					building: `"${scannedAddress.building}"`,
					unit: `"${scannedAddress.unit}"`,
					floor: `"${scannedAddress.floor}"`,
					room: `"${scannedAddress.room}"`
				});

				// 注意：访客手机号的处理已在 onLoad 方法中完成，这里不再重复处理

				// 🆕 对于访客角色，优先处理管家信息
				if (this.currentUserRole === 'visitor' && scannedAddress.butlerName) {
					console.log('🚗 访客角色，处理管家信息:', scannedAddress.butlerName);
					// 可以在这里添加管家信息的显示逻辑
				}

				// 检查是否有有效的地址信息（既检查扫码地址，也检查表单地址）
				const hasDetailedAddress = scannedAddress.building || scannedAddress.unit || scannedAddress.floor || scannedAddress.room;
				const hasCommunityInfo = scannedAddress.community || this.form.addressInfo.community;

				if (!hasDetailedAddress && !hasCommunityInfo) {
					console.log('📍 无任何地址信息，跳过自动填充');

					// 🔍 如果没有地址信息，但有 qrId，显示提示
					if (options.qrId) {
						console.log('⚠️ 有 qrId 但无地址信息，可能是二维码数据不完整');
						uni.showModal({
							title: '地址信息提醒',
							content: '检测到您通过二维码进入，但未获取到地址信息。\n\n请手动选择访问地址，或联系管家确认二维码是否包含完整信息。',
							showCancel: false,
							confirmText: '知道了'
						});
					}
					return;
				}

				// 🆕 如果只有小区信息而没有详细地址，也要进行处理
				if (hasCommunityInfo && !hasDetailedAddress) {
					console.log('📍 检测到小区信息但无详细地址，设置小区信息并提示用户手动选择详细地址');

					// 设置小区信息（优先使用扫码的，如果没有则使用表单中已有的）
					const communityName = scannedAddress.community || this.form.addressInfo.community;
					if (communityName) {
						this.currentCommunityName = communityName;
						this.form.addressInfo.community = communityName;
						console.log('🏘️ 已设置小区信息:', communityName);
					}

					// 显示提示
					uni.showModal({
						title: '地址信息确认',
						content: `已从二维码获取到小区信息：${scannedAddress.community}\n\n请手动选择具体的楼栋、单元、楼层和房间号。`,
						showCancel: false,
						confirmText: '知道了'
					});

					// 继续处理其他信息（如管家信息、访客手机号等）
				}

				// 🆕 如果有详细地址信息，进行自动填充
				if (hasDetailedAddress) {
					console.log('📍 检测到详细地址信息，开始自动填充');

					// 设置小区信息
					if (scannedAddress.community) {
						this.currentCommunityName = scannedAddress.community;
						this.form.addressInfo.community = scannedAddress.community;
					}

					// 尝试自动填充详细地址
					await this.autoFillDetailedAddress(scannedAddress);
				}

				console.log('✅ [调试] 发现有效地址信息，开始处理地址自动填充');

				// 等待地址数据加载完成
				let retries = 0;
				const maxRetries = 10;
				while ((!this.addressData || Object.keys(this.addressData).length === 0) && retries < maxRetries) {
					console.log(`📍 等待地址数据加载... (${retries + 1}/${maxRetries})`);
					await new Promise(resolve => setTimeout(resolve, 500));
					retries++;
				}

				if (!this.addressData || Object.keys(this.addressData).length === 0) {
					console.error('📍 地址数据加载失败，无法自动填充');
					console.error('📍 addressData状态:', this.addressData);
					console.error('📍 addressRange状态:', this.addressRange);
					uni.showToast({
						title: '地址数据加载失败',
						icon: 'none'
					});
					return;
				}

				console.log('📍 地址数据已加载，开始匹配:', {
					addressDataKeys: Object.keys(this.addressData),
					addressRangeLength: this.addressRange.map(range => range.length),
					firstBuilding: this.addressRange[0]?.[0]?.name
				});

				// 自动设置地址选择器
				let addressSet = false;

				// 查找并设置楼栋
				if (scannedAddress.building && scannedAddress.building.trim() !== '') {
					const buildingIndex = this.addressRange[0].findIndex(item =>
						item.name.replace('栋', '') === scannedAddress.building
					);

					if (buildingIndex >= 0) {
						this.addressValue[0] = buildingIndex;
						this.updateColumnOptions(0, buildingIndex);
						addressSet = true;
						console.log('📍 设置楼栋:', scannedAddress.building, '索引:', buildingIndex);
					} else {
						console.log('📍 未找到匹配的楼栋:', scannedAddress.building, '但仍然设置地址信息');
						// 即使没有找到匹配的楼栋，也要设置地址信息
						addressSet = true;
					}
				} else {
					console.log('📍 楼栋为空，但仍然尝试设置其他地址信息');
				}

				// 查找并设置单元（无论楼栋是否匹配都尝试设置）
				if (scannedAddress.unit && this.addressRange[1].length > 0) {
					const unitIndex = this.addressRange[1].findIndex(item =>
						item.name.replace('单元', '') === scannedAddress.unit
					);

					if (unitIndex >= 0) {
						this.addressValue[1] = unitIndex;
						this.updateColumnOptions(1, unitIndex);
						addressSet = true;
						console.log('📍 设置单元:', scannedAddress.unit, '索引:', unitIndex);

						// 查找并设置楼层
						if (scannedAddress.floor && this.addressRange[2].length > 0) {
							const floorIndex = this.addressRange[2].findIndex(item =>
								item.name.replace('楼', '') === scannedAddress.floor
							);

							if (floorIndex >= 0) {
								this.addressValue[2] = floorIndex;
								this.updateColumnOptions(2, floorIndex);
								console.log('📍 设置楼层:', scannedAddress.floor, '索引:', floorIndex);

								// 查找并设置房间
								if (scannedAddress.room && this.addressRange[3].length > 0) {
									const roomIndex = this.addressRange[3].findIndex(item =>
										item.name.replace('室', '') === scannedAddress.room
									);

									if (roomIndex >= 0) {
										this.addressValue[3] = roomIndex;
										console.log('📍 设置房间:', scannedAddress.room, '索引:', roomIndex);
									} else {
										console.log('📍 未找到匹配的房间:', scannedAddress.room);
									}
								}
							} else {
								console.log('📍 未找到匹配的楼层:', scannedAddress.floor);
							}
						}
					} else {
						console.log('📍 未找到匹配的单元:', scannedAddress.unit);
					}
				}

				// 🆕 对于访客角色，即使地址没有完全匹配，也要显示地址信息
				if (addressSet || this.currentUserRole === 'visitor') {
					// 更新显示和表单数据（如果地址匹配成功）
					if (addressSet) {
						this.updateAddressDisplay();
						this.updateFormAddress();
						this.updateFullAddress();
					}

					// 构建自动填充的地址信息文本
					let addressText = '';
					if (scannedAddress.building) addressText += scannedAddress.building + '栋';
					if (scannedAddress.unit) addressText += scannedAddress.unit + '单元';
					if (scannedAddress.floor) addressText += scannedAddress.floor + '楼';
					if (scannedAddress.room) addressText += scannedAddress.room + '室';

					// ✅ 区分受邀访客和外来访客
					const userInfo = uni.getStorageSync('userInfo') || {};
					const visitorType = userInfo?.visitorType || userInfo?.userInfo?.visitorType;
					
					// 🆕 只有受邀访客（有完整地址信息）才锁定地址，外来访客可以选择
					const hasDetailedAddress = scannedAddress.building || scannedAddress.unit || scannedAddress.floor || scannedAddress.room;
					
					if (this.currentUserRole === 'visitor' && visitorType === 'invited' && hasDetailedAddress) {
						// 受邀访客：有管家邀请码和完整地址 → 锁定地址
						this.isAddressAutoFilled = true;
						this.autoFilledAddressInfo = addressText;

						// 🔧 强制设置表单地址信息
						if (scannedAddress.building) this.form.addressInfo.building = scannedAddress.building;
						if (scannedAddress.unit) this.form.addressInfo.units = scannedAddress.unit;
						if (scannedAddress.floor) this.form.addressInfo.floor = scannedAddress.floor;
						if (scannedAddress.room) this.form.addressInfo.roomnumber = scannedAddress.room;

						// 更新完整地址
						this.updateFullAddress();

						console.log('🎫 受邀访客，地址锁定（不可修改）:', {
							visitorType: visitorType,
							addressText: addressText,
							formAddress: this.form.addressInfo,
							isAutoFilled: this.isAddressAutoFilled
						});
					} else {
						// 外来访客或其他角色：可以选择地址
						this.isAddressAutoFilled = false;
						this.autoFilledAddressInfo = '';
						// 🆕 确保清除业主自动填充标记
						this.isOwnerAddressAutoFilled = false;
						this.ownerAutoFilledAddressInfo = '';
						
						if (this.currentUserRole === 'visitor' && visitorType === 'external') {
							console.log('🚗 外来访客，可以选择小区地址');
						} else {
							console.log('👤 非访客角色，地址可以修改');
						}
					}

					// 🆕 访客角色：查询并显示业主信息
					if (this.currentUserRole === 'visitor') {
						console.log('🚗 访客角色，开始查询业主信息...');
						await this.queryOwnerInfoForVisitor(scannedAddress);
					}

					// 🆕 根据角色显示不同的成功提示
					let successMessage = '';
					if (this.currentUserRole === 'visitor') {
						successMessage = `访问地址已自动填充: ${addressText}`;
						if (scannedAddress.butlerName) {
							successMessage += `\n管家: ${scannedAddress.butlerName}`;
						}
					} else {
						successMessage = `地址已自动填充: ${addressText}`;
					}

					console.log('✅ 地址自动填充完成:', {
						userRole: this.currentUserRole,
						building: scannedAddress.building,
						unit: scannedAddress.unit,
						floor: scannedAddress.floor,
						room: scannedAddress.room,
						butlerName: scannedAddress.butlerName,
						addressValue: this.addressValue,
						addressDisplay: this.addressDisplay,
						isAutoFilled: this.isAddressAutoFilled
					});
				} else {
					console.log('📍 未找到匹配的地址信息');

					// 🆕 对于访客角色，即使未找到匹配的地址，也要尝试手动填充
					if (this.currentUserRole === 'visitor' && (scannedAddress.building || scannedAddress.unit || scannedAddress.floor || scannedAddress.room)) {
						console.log('🚗 访客角色，尝试手动填充地址信息');

						// 🔧 重要修复：确保小区信息正确设置
						const userInfo = uni.getStorageSync('userInfo') || {};
						const visitorType = userInfo?.visitorType || userInfo?.userInfo?.visitorType;
						const addressInfo = await this.getAddressInfo(userInfo);

						// 手动设置表单地址信息，包括小区信息（不使用硬编码默认值）
						this.form.addressInfo.community = addressInfo.community || this.currentCommunityName;
						this.form.addressInfo.province = addressInfo.province || '';
						this.form.addressInfo.city = addressInfo.city || '';
						this.form.addressInfo.district = addressInfo.district || '';

						if (scannedAddress.building) this.form.addressInfo.building = scannedAddress.building;
						if (scannedAddress.unit) this.form.addressInfo.units = scannedAddress.unit;
						if (scannedAddress.floor) this.form.addressInfo.floor = scannedAddress.floor;
						if (scannedAddress.room) this.form.addressInfo.roomnumber = scannedAddress.room;

						// 构建地址显示文本
						let addressText = '';
						if (scannedAddress.building) addressText += scannedAddress.building + '栋';
						if (scannedAddress.unit) addressText += scannedAddress.unit + '单元';
						if (scannedAddress.floor) addressText += scannedAddress.floor + '楼';
						if (scannedAddress.room) addressText += scannedAddress.room + '室';

						// ✅ 只有受邀访客才锁定地址
						if (visitorType === 'invited') {
							this.autoFilledAddressInfo = addressText;
							this.isAddressAutoFilled = true; // 受邀访客不允许修改地址
						} else {
							// 外来访客可以选择地址
							this.autoFilledAddressInfo = '';
							this.isAddressAutoFilled = false;
						}

						// 更新完整地址
						this.updateFullAddress();

						console.log('✅ 访客角色地址手动填充完成:', {
							formAddress: this.form.addressInfo,
							addressText: addressText,
							isAutoFilled: this.isAddressAutoFilled
						});

						// 🆕 访客角色：查询并显示业主信息
						console.log('🚗 访客角色，开始查询业主信息...');
						await this.queryOwnerInfoForVisitor(scannedAddress);

						// 显示成功提示
						let successMessage = `访问地址已填充: ${addressText}`;
						if (scannedAddress.butlerName) {
							successMessage += `\n管家: ${scannedAddress.butlerName}`;
						}

						uni.showToast({
							title: successMessage,
							icon: 'success',
							duration: 3000
						});

					} else {
						// 显示未找到的提示
						let notFoundItems = [];
						if (scannedAddress.building) notFoundItems.push(`楼栋${scannedAddress.building}`);
						if (scannedAddress.unit) notFoundItems.push(`单元${scannedAddress.unit}`);
						if (scannedAddress.floor) notFoundItems.push(`楼层${scannedAddress.floor}`);
						if (scannedAddress.room) notFoundItems.push(`房间${scannedAddress.room}`);

						if (notFoundItems.length > 0) {
							uni.showModal({
								title: '地址信息提醒',
								content: `从二维码获取到地址信息：${notFoundItems.join('、')}\n\n但在当前小区数据中未找到匹配项，请${this.currentUserRole === 'visitor' ? '联系管家确认地址' : '手动选择正确的地址'}。`,
								showCancel: false,
								confirmText: '知道了'
							});
						}
					}
				}

			} catch (error) {
				console.error('📍 处理扫码地址参数失败:', error);
				uni.showToast({
					title: '地址信息处理失败',
					icon: 'none'
				});
			}
		},

		// 🆕 访客角色：查询业主信息
		async queryOwnerInfoForVisitor(scannedAddress) {
			try {
				// 确保有地址信息
				if (!scannedAddress.building && !scannedAddress.unit && !scannedAddress.floor && !scannedAddress.room) {
					return;
				}

				// 获取当前小区信息
				const userInfo = uni.getStorageSync('userInfo') || {};
				const addressInfo = await this.getAddressInfo(userInfo);

				// 构建查询参数 - 只传递必要的参数
				const queryParams = {
					community: addressInfo.community || this.currentCommunityName,
					building: scannedAddress.building,
					units: scannedAddress.unit,
					floor: scannedAddress.floor,
					roomnumber: scannedAddress.room
				};

				// 调用API查询业主信息
				const { ownerAPI } = require('@/config/api.js');
				const response = await ownerAPI.getOwnerInfoByAddress(queryParams);

				// 解析响应数据
				let ownerData = [];
				if (response && response.data) {
					if (response.data.data && Array.isArray(response.data.data)) {
						ownerData = response.data.data;
					} else if (Array.isArray(response.data)) {
						ownerData = response.data;
					}
				}

				if (ownerData.length > 0) {
					// 过滤出有效的业主信息
					const validOwners = ownerData.filter(owner =>
						owner.ownername && owner.ownername.trim() !== '' && owner.ownerphone
					);

					if (validOwners.length > 0) {
						// 🆕 为访客角色设置业主信息显示
						this.selectedOwnerInfo = validOwners[0]; // 选择第一个业主

						// 🔒 为保护业主隐私，移除业主信息显示弹窗
						// 仅在后台保存业主信息，不向访客显示
						const ownerInfo = validOwners[0];
						const addressText = this.formatOwnerAddress(ownerInfo);

					} else {
						this.selectedOwnerInfo = null;
					}
				} else {
					console.log('⚠️ [访客查询业主] 该地址未找到业主信息');
					this.selectedOwnerInfo = null;
				}

			} catch (error) {
				console.error('❌ [访客查询业主] 查询业主信息失败:', error);
				this.selectedOwnerInfo = null;
			}
		},

		// 跳转到二维码测试页面
		goToQRCodeTest() {
			uni.navigateTo({
				url: '/pages/qrcode/qrcode?test=1',
				success: () => {
					console.log('跳转到二维码测试页面');
				},
				fail: (error) => {
					console.error('跳转失败:', error);
					uni.showToast({
						title: '页面跳转失败',
						icon: 'none'
					});
				}
			});
		},





		// 根据地址查询业主信息
		async searchOwnerByAddress() {
			try {
				console.log('🏠 [管家地址选择] 查询地址对应的业主信息:', this.form.addressInfo);

				// 确保地址信息完整
				if (!this.form.addressInfo.community || !this.form.addressInfo.building ||
					!this.form.addressInfo.units || !this.form.addressInfo.floor ||
					!this.form.addressInfo.roomnumber) {
					console.log('⚠️ [管家地址选择] 地址信息不完整，跳过查询');
					console.log('⚠️ 当前地址信息:', {
						community: this.form.addressInfo.community,
						building: this.form.addressInfo.building,
						units: this.form.addressInfo.units,
						floor: this.form.addressInfo.floor,
						roomnumber: this.form.addressInfo.roomnumber
					});
					return;
				}

				// 🔧 重要修复：先查询正确的省市区信息
				const { ownerAPI, communityAPI } = require('@/config/api.js');

				console.log('🔍 [省市区查询] 开始查询正确的省市区信息');
				const communityInfo = await communityAPI.findProvinceByCommunityName(
					this.form.addressInfo.community,
					this.form.addressInfo.building,
					this.form.addressInfo.units,
					this.form.addressInfo.floor,
					this.form.addressInfo.roomnumber
				);

				console.log('🔍 [省市区查询] 查询结果:', communityInfo);

				// 使用查询到的正确省市区信息
				let correctProvince = this.form.addressInfo.province;
				let correctCity = this.form.addressInfo.city;
				let correctDistrict = this.form.addressInfo.district;

				if (communityInfo && communityInfo.data) {
					correctProvince = communityInfo.data.province || correctProvince;
					correctCity = communityInfo.data.city || correctCity;
					correctDistrict = communityInfo.data.district || correctDistrict;

					console.log('✅ [省市区查询] 使用查询到的省市区信息:', {
						province: correctProvince,
						city: correctCity,
						district: correctDistrict
					});
				} else {
					console.log('⚠️ [省市区查询] 未查询到省市区信息，使用默认值');
				}

				// 构建查询参数 - 只传递必要的参数
				const queryParams = {
					community: this.form.addressInfo.community,
					building: this.form.addressInfo.building,
					units: this.form.addressInfo.units,
					floor: this.form.addressInfo.floor,
					roomnumber: this.form.addressInfo.roomnumber
				};

				console.log('🔍 [管家地址选择] 发送查询请求，参数:', queryParams);

				const response = await ownerAPI.getOwnerInfoByAddress(queryParams);

				console.log('🏠 [管家地址选择] 业主信息查询结果:', response);

				// 🔧 修复：检查多层嵌套的响应结构
				let ownerData = [];
				if (response && response.data) {
					// 检查是否有嵌套的data结构
					if (response.data.data && Array.isArray(response.data.data)) {
						ownerData = response.data.data;
					} else if (Array.isArray(response.data)) {
						ownerData = response.data;
					}
				}

				console.log('🔍 [管家地址选择] 解析后的业主数据:', ownerData);

				if (ownerData.length > 0) {
					// 过滤出有效的业主信息
					const validOwners = ownerData.filter(owner =>
						owner.ownername && owner.ownername.trim() !== '' && owner.ownerphone
					);

					console.log('🔍 [管家地址选择] 有效的业主信息:', validOwners);

					if (validOwners.length > 0) {
						this.ownerSuggestions = validOwners.slice(0, 3); // 最多显示3个建议
						this.showOwnerSuggestions = true;
						console.log('✅ [管家地址选择] 找到业主信息:', this.ownerSuggestions);

						// 🔧 如果只有一个业主，直接确认选择（不重复弹窗）
						if (validOwners.length === 1) {
							const owner = validOwners[0];
							const isVisitor = this.currentUserRole === 'visitor';
							const confirmContent = isVisitor
								? `该地址的业主是：${owner.ownername}\n电话：${owner.ownerphone}\n\n确认您要拜访的业主？`
								: `该地址的业主是：${owner.ownername}\n电话：${owner.ownerphone}\n\n是否为此业主代为预约？`;
							
							uni.showModal({
								title: '找到业主信息',
								content: confirmContent,
								showCancel: true,
								cancelText: '取消',
								confirmText: '确认',
								success: (res) => {
									if (res.confirm) {
										// 🔧 直接设置业主信息，避免重复确认
										console.log(`✅ [业主选择] 确认${isVisitor ? '拜访' : '代为预约'}:`, owner.ownername);
										
										// 隐藏建议列表
										this.ownerSuggestions = [];
										this.showOwnerSuggestions = false;
										
										// 将业主信息存储到表单中
										this.selectedOwnerInfo = owner;
										
										// 🔧 仅管家角色更新联系电话为业主电话，访客保留自己的手机号
										if (!isVisitor && owner.ownerphone) {
											this.model1.code = owner.ownerphone;
											console.log('📞 [管家代约] 联系电话已更新为业主电话:', owner.ownerphone);
										} else if (isVisitor) {
											console.log('📞 [访客预约] 保留访客自己的手机号:', this.model1.code);
										}
										
										// 🆕 标记为业主自动填充地址
										this.isOwnerAddressAutoFilled = !isVisitor;
										this.ownerAutoFilledAddressInfo = this.formatOwnerAddress(owner);
										
										const toastMessage = isVisitor 
											? `已选择拜访业主：${owner.ownername}` 
											: `已选择为 ${owner.ownername} 代为预约`;
										
										uni.showToast({
											title: toastMessage,
											icon: 'success',
											duration: 2000
										});
									}
								}
							});
						}
					} else {
						this.ownerSuggestions = [];
						this.showOwnerSuggestions = false;
						console.log('⚠️ [管家地址选择] 未找到有效的业主信息（姓名或电话为空）');
					}
				} else {
					this.ownerSuggestions = [];
					this.showOwnerSuggestions = false;
					console.log('⚠️ [管家地址选择] 该地址未找到对应的业主信息');

					// 显示提示信息
					uni.showToast({
						title: '该地址暂无业主信息',
						icon: 'none',
						duration: 2000
					});
				}

			} catch (error) {
				console.error('❌ [管家地址选择] 查询业主信息失败:', error);
				this.ownerSuggestions = [];
				this.showOwnerSuggestions = false;

				// 显示错误提示
				uni.showToast({
					title: '查询业主信息失败',
					icon: 'none',
					duration: 2000
				});
			}
		},

		// 格式化业主地址显示
		formatOwnerAddress(owner) {
			const parts = [];
			if (owner.community) parts.push(owner.community);
			if (owner.building) parts.push(owner.building + '栋');
			if (owner.units) parts.push(owner.units + '单元');
			if (owner.floor) parts.push(owner.floor + '楼');
			if (owner.roomnumber) parts.push(owner.roomnumber + '室');

			return parts.join(' ') || '地址信息不完整';
		},

		// 选择业主建议
		selectOwnerSuggestion(owner) {
			console.log('👆 [管家选择] 选择业主:', owner);

			// 隐藏建议列表
			this.ownerSuggestions = [];
			this.showOwnerSuggestions = false;

			// 🔧 区分访客和管家角色
			const isVisitor = this.currentUserRole === 'visitor';
			const confirmTitle = '确认业主信息';
			const confirmContent = isVisitor
				? `业主姓名：${owner.ownername}\n联系电话：${owner.ownerphone}\n地址：${this.formatOwnerAddress(owner)}\n\n确认您要拜访的业主？`
				: `业主姓名：${owner.ownername}\n联系电话：${owner.ownerphone}\n地址：${this.formatOwnerAddress(owner)}\n\n是否为此业主代为预约？`;

			// 显示确认信息
			uni.showModal({
				title: confirmTitle,
				content: confirmContent,
				showCancel: true,
				cancelText: '取消',
				confirmText: '确认',
				success: (res) => {
					if (res.confirm) {
						// 用户确认，设置业主信息
						const actionText = isVisitor ? '拜访' : '代为预约';
						console.log(`✅ [业主选择] 确认${actionText}:`, owner.ownername);

						// 将业主信息存储到表单中，用于后续提交
						this.selectedOwnerInfo = owner;

						// 🔧 重要修复：仅管家角色更新联系电话为业主电话，访客保留自己的手机号
						if (!isVisitor && owner.ownerphone) {
							this.model1.code = owner.ownerphone;
							console.log('📞 [管家代约] 联系电话已更新为业主电话:', owner.ownerphone);
						} else if (isVisitor) {
							console.log('📞 [访客预约] 保留访客自己的手机号:', this.model1.code);
						}

						// 🆕 标记为业主自动填充地址（不可修改）
						this.isOwnerAddressAutoFilled = !isVisitor;
						this.ownerAutoFilledAddressInfo = this.formatOwnerAddress(owner);

						const toastMessage = isVisitor 
							? `已选择拜访业主：${owner.ownername}` 
							: `已选择为 ${owner.ownername} 代为预约`;

						uni.showToast({
							title: toastMessage,
							icon: 'success',
							duration: 2000
						});
					} else {
						// 🔧 重要修复：用户取消时，清空业主信息
						this.selectedOwnerInfo = null;

						// 🔧 仅管家角色清空联系电话，访客保留自己的手机号
						if (!isVisitor) {
							this.model1.code = '';
							console.log('📞 [管家取消] 清空联系电话');
						} else {
							console.log('📞 [访客取消] 保留访客自己的手机号:', this.model1.code);
						}

						// 重新显示建议列表
						this.showOwnerSuggestions = true;
					}
				}
			});
		},

		// 清除业主信息
		clearOwnerInfo() {
			console.log('🧹 [清除业主信息] 开始清除之前的业主信息');

			// 清除业主相关数据
			this.selectedOwnerInfo = null;
			this.ownerSuggestions = [];
			this.showOwnerSuggestions = false;

			// 🆕 清除业主自动填充标记
			this.isOwnerAddressAutoFilled = false;
			this.ownerAutoFilledAddressInfo = '';

			// 🔧 清除联系电话（仅管家角色清除，访客保留自己的手机号）
			if (this.currentUserRole === 'manager') {
				this.model1.code = '';
				console.log('🧹 [清除业主信息] 已清除管家角色的联系电话');
			}

			console.log('✅ [清除业主信息] 业主信息清除完成');
		},

		// 业主搜索相关方法
		// 搜索业主（通过关键词）
		async searchOwnerByKeyword() {
			const keyword = this.ownerSearchKeyword.trim();
			if (!keyword) {
				this.clearOwnerSearch();
				return;
			}

			console.log('🔍 [业主搜索] 开始搜索业主:', keyword);
			this.ownerSearchLoading = true;
			this.showOwnerSearchResults = false;

			try {
				const { ownerAPI } = require('@/config/api.js');

				// 获取当前管家的社区信息
				const userInfo = uni.getStorageSync('userInfo');
				const addressInfo = await this.getAddressInfo(userInfo);

				// 构建搜索参数 - 只传递必要的参数
				const queryParams = {
					community: addressInfo.community || '',
					building: '', // 不限制楼栋，搜索整个小区
					units: '', // 不限制单元
					floor: '', // 不限制楼层
					roomnumber: '' // 不限制房间号
				};
				const response = await ownerAPI.getOwnerInfoByAddress(queryParams);
				// 解析响应数据
				let ownerData = [];
				if (response && response.data) {
					if (response.data.data && Array.isArray(response.data.data)) {
						ownerData = response.data.data;
					} else if (Array.isArray(response.data)) {
						ownerData = response.data;
					}
				}

				// 过滤匹配的业主
				const keywordLower = keyword.toLowerCase();
				this.filteredOwnerList = ownerData.filter(owner => {
					const name = (owner.ownername || '').toLowerCase();
					const phone = (owner.ownerphone || '').toLowerCase();
					return name.includes(keywordLower) || phone.includes(keywordLower);
				});

				this.showOwnerSearchResults = true;
				if (this.filteredOwnerList.length === 0) {
					uni.showToast({
						title: '未找到匹配的业主',
						icon: 'none',
						duration: 2000
					});
				}

			} catch (error) {
				console.error('❌ [业主搜索] 搜索失败:', error);
				this.filteredOwnerList = [];
				this.showOwnerSearchResults = true;

				uni.showToast({
					title: '搜索业主信息失败',
					icon: 'none',
					duration: 2000
				});
			} finally {
				this.ownerSearchLoading = false;
			}
		},

		// 搜索输入事件（防抖）
		onOwnerSearchInput() {
			// 清除之前的定时器
			if (this.searchInputTimer) {
				clearTimeout(this.searchInputTimer);
			}

			// 设置新的定时器，500ms后执行搜索
			this.searchInputTimer = setTimeout(() => {
				if (this.ownerSearchKeyword.trim()) {
					this.searchOwnerByKeyword();
				} else {
					this.clearOwnerSearch();
				}
			}, 500);
		},

		// 清除业主搜索
		clearOwnerSearch() {
			console.log('🧹 [业主搜索] 清除搜索结果');
			this.ownerSearchKeyword = '';
			this.filteredOwnerList = [];
			this.showOwnerSearchResults = false;
			this.ownerSearchLoading = false;

			// 清除定时器
			if (this.searchInputTimer) {
				clearTimeout(this.searchInputTimer);
				this.searchInputTimer = null;
			}
		},

		// 从搜索结果中选择业主
		async selectOwnerFromSearch(owner) {
			console.log('👆 [业主搜索] 选择业主:', owner);

			// 隐藏搜索结果
			this.showOwnerSearchResults = false;

			// 根据角色显示不同的确认信息
			const isVisitor = this.currentUserRole === 'visitor';
			const confirmTitle = isVisitor ? '确认业主信息' : '确认业主信息';
			const confirmContent = isVisitor 
				? `业主姓名：${owner.ownername}\n联系电话：${owner.ownerphone}\n地址：${this.formatOwnerAddress(owner)}\n\n确认您要拜访的业主？` 
				: `业主姓名：${owner.ownername}\n联系电话：${owner.ownerphone}\n地址：${this.formatOwnerAddress(owner)}\n\n是否为此业主代为预约？`;

			// 显示确认信息
			uni.showModal({
				title: confirmTitle,
				content: confirmContent,
				showCancel: true,
				cancelText: '取消',
				confirmText: '确认',
				success: async (res) => {
					if (res.confirm) {
						// 用户确认，设置业主信息
						const actionText = isVisitor ? '拜访' : '代为预约';
						console.log(`✅ [业主搜索] 确认${actionText}:`, owner.ownername);

						// 将业主信息存储到表单中
						this.selectedOwnerInfo = owner;

						// 🔧 访客角色：不修改联系电话（使用访客自己的手机号）
						// 🔧 管家角色：设置业主联系电话
						if (!isVisitor && owner.ownerphone) {
							this.model1.code = owner.ownerphone;
						}

						// 自动填充地址信息
						await this.autoFillAddressFromOwner(owner);

						// 清除搜索
						this.clearOwnerSearch();

						const toastMessage = isVisitor 
							? `已选择拜访业主：${owner.ownername}` 
							: `已选择为 ${owner.ownername} 代为预约`;
						
						uni.showToast({
							title: toastMessage,
							icon: 'success',
							duration: 2000
						});
					} else {
						// 用户取消，重新显示搜索结果
						this.showOwnerSearchResults = true;
					}
				}
			});
		},

		// 根据业主信息自动填充地址
		async autoFillAddressFromOwner(owner) {
			try {
				console.log('🏠 [地址自动填充] 开始根据业主信息填充地址:', owner);

				// 更新表单地址信息
				this.form.addressInfo.province = owner.province || '';
				this.form.addressInfo.city = owner.city || '';
				this.form.addressInfo.district = owner.district || '';
				this.form.addressInfo.community = owner.community || '';
				this.form.addressInfo.building = owner.building || '';
				this.form.addressInfo.units = owner.units || '';
				this.form.addressInfo.floor = owner.floor || '';
				this.form.addressInfo.roomnumber = owner.roomnumber || '';

				// 重新加载地址数据并设置选择器
				await this.loadAddressData();
				await this.setAddressFromOwnerInfo(owner);

				// 更新显示
				this.updateAddressDisplay();
				this.updateFullAddress();

				// 🆕 标记为业主自动填充
				// 🔧 访客角色：不锁定地址（允许访客调整地址）
				// 🔧 管家角色：锁定地址（不允许修改）
				const isVisitor = this.currentUserRole === 'visitor';
				this.isOwnerAddressAutoFilled = !isVisitor;  // 访客可以修改，管家不可修改
				this.ownerAutoFilledAddressInfo = this.getSelectedAddressText() || '';

				const lockStatus = isVisitor ? '允许修改' : '不可修改';
				console.log(`✅ [地址自动填充] 地址信息已自动填充完成，地址${lockStatus}`);

			} catch (error) {
				console.error('❌ [地址自动填充] 填充地址失败:', error);
				uni.showToast({
					title: '自动填充地址失败',
					icon: 'none',
					duration: 2000
				});
			}
		},

		// 🆕 自动填充详细地址信息
		async autoFillDetailedAddress(scannedAddress) {
			try {
				console.log('🏠 [自动填充] 开始自动填充详细地址:', scannedAddress);

				// 确保地址数据已加载
				if (!this.addressRange || this.addressRange.length === 0) {
					console.log('🏠 [自动填充] 地址数据未加载，先加载地址数据');
					await this.loadAddressData();
				}

				// 查找并设置楼栋
				if (scannedAddress.building && this.addressRange[0] && this.addressRange[0].length > 0) {
					const buildingIndex = this.addressRange[0].findIndex(item => {
						const buildingName = item.name.replace('栋', '');
						const scannedBuilding = scannedAddress.building.toString().replace('栋', '');
						return buildingName === scannedBuilding;
					});

					if (buildingIndex >= 0) {
						this.addressValue[0] = buildingIndex;
						this.updateColumnOptions(0, buildingIndex);
						console.log('🏠 [自动填充] 设置楼栋:', scannedAddress.building, '索引:', buildingIndex);

						// 查找并设置单元
						if (scannedAddress.unit && this.addressRange[1] && this.addressRange[1].length > 0) {
							const unitIndex = this.addressRange[1].findIndex(item => {
								const unitName = item.name.replace('单元', '');
								const scannedUnit = scannedAddress.unit.toString().replace('单元', '');
								return unitName === scannedUnit;
							});

							if (unitIndex >= 0) {
								this.addressValue[1] = unitIndex;
								this.updateColumnOptions(1, unitIndex);
								console.log('🏠 [自动填充] 设置单元:', scannedAddress.unit, '索引:', unitIndex);

								// 查找并设置楼层
								if (scannedAddress.floor && this.addressRange[2] && this.addressRange[2].length > 0) {
									const floorIndex = this.addressRange[2].findIndex(item => {
										const floorName = item.name.replace('层', '').replace('楼', '');
										const scannedFloor = scannedAddress.floor.toString().replace('层', '').replace('楼', '');
										return floorName === scannedFloor;
									});

									if (floorIndex >= 0) {
										this.addressValue[2] = floorIndex;
										this.updateColumnOptions(2, floorIndex);
										console.log('🏠 [自动填充] 设置楼层:', scannedAddress.floor, '索引:', floorIndex);

										// 查找并设置房间
										if (scannedAddress.room && this.addressRange[3] && this.addressRange[3].length > 0) {
											const roomIndex = this.addressRange[3].findIndex(item => {
												const roomName = item.name.replace('室', '').replace('号', '');
												const scannedRoom = scannedAddress.room.toString().replace('室', '').replace('号', '');
												return roomName === scannedRoom;
											});

											if (roomIndex >= 0) {
												this.addressValue[3] = roomIndex;
												console.log('🏠 [自动填充] 设置房间:', scannedAddress.room, '索引:', roomIndex);
											} else {
												console.log('⚠️ [自动填充] 未找到匹配的房间:', scannedAddress.room);
											}
										}
									} else {
										console.log('⚠️ [自动填充] 未找到匹配的楼层:', scannedAddress.floor);
									}
								}
							} else {
								console.log('⚠️ [自动填充] 未找到匹配的单元:', scannedAddress.unit);
							}
						}
					} else {
						console.log('⚠️ [自动填充] 未找到匹配的楼栋:', scannedAddress.building);
					}
				}

				// 更新地址显示
				this.updateAddressDisplay();

				// 🔧 修复：确保form.addressInfo也被正确更新
				await this.updateFormAddress();

				// 显示自动填充结果
				const filledAddress = this.getSelectedAddressText();
				if (filledAddress) {
					console.log('✅ [自动填充] 地址自动填充成功:', filledAddress);
					console.log('✅ [自动填充] 表单地址信息:', this.form.addressInfo);
				} else {
					console.log('⚠️ [自动填充] 地址自动填充未完全成功');
				}

			} catch (error) {
				console.error('❌ [自动填充] 自动填充详细地址失败:', error);
				uni.showToast({
					title: '地址自动填充失败',
					icon: 'none',
					duration: 2000
				});
			}
		},

		// 设置地址选择器（根据业主信息）
		async setAddressFromOwnerInfo(owner) {
			try {
				console.log('🏠 [地址设置] 开始设置地址选择器:', owner);

				// 查找并设置楼栋
				if (owner.building && this.addressRange[0].length > 0) {
					const buildingIndex = this.addressRange[0].findIndex(item =>
						item.name.replace('栋', '') === owner.building.toString()
					);

					if (buildingIndex >= 0) {
						this.addressValue[0] = buildingIndex;
						this.updateColumnOptions(0, buildingIndex);
						console.log('🏠 [地址设置] 设置楼栋:', owner.building, '索引:', buildingIndex);

						// 查找并设置单元
						if (owner.units && this.addressRange[1].length > 0) {
							const unitIndex = this.addressRange[1].findIndex(item =>
								item.name.replace('单元', '') === owner.units.toString()
							);

							if (unitIndex >= 0) {
								this.addressValue[1] = unitIndex;
								this.updateColumnOptions(1, unitIndex);
								console.log('🏠 [地址设置] 设置单元:', owner.units, '索引:', unitIndex);

								// 查找并设置楼层
								if (owner.floor && this.addressRange[2].length > 0) {
									const floorIndex = this.addressRange[2].findIndex(item =>
										item.name.replace('楼', '') === owner.floor.toString()
									);

									if (floorIndex >= 0) {
										this.addressValue[2] = floorIndex;
										this.updateColumnOptions(2, floorIndex);
										console.log('🏠 [地址设置] 设置楼层:', owner.floor, '索引:', floorIndex);

										// 查找并设置房间
										if (owner.roomnumber && this.addressRange[3].length > 0) {
											const roomIndex = this.addressRange[3].findIndex(item =>
												item.name.replace('室', '') === owner.roomnumber.toString()
											);

											if (roomIndex >= 0) {
												this.addressValue[3] = roomIndex;
												console.log('🏠 [地址设置] 设置房间:', owner.roomnumber, '索引:', roomIndex);
											}
										}
									}
								}
							}
						}
					}
				}

				console.log('✅ [地址设置] 地址选择器设置完成');

			} catch (error) {
				console.error('❌ [地址设置] 设置地址选择器失败:', error);
			}
		},

		// 🆕 自动更新访客姓名（如果已有微信用户信息）
		async autoUpdateVisitorNameIfAvailable() {
			try {
				console.log('📱 [自动更新访客姓名] 开始检查微信用户信息...');

				// 检查本地存储中是否已有微信用户信息
				const userInfo = uni.getStorageSync('userInfo') || {};
				const wechatUserInfo = uni.getStorageSync('wechatUserInfo') || {};

				// 优先使用专门存储的微信信息
				let visitorName = '';
				if (wechatUserInfo.nickname) {
					visitorName = wechatUserInfo.nickname;
					console.log('📱 [自动更新访客姓名] 从专门的微信存储中获取昵称:', visitorName);
				} else if (userInfo.userInfo?.nickname) {
					visitorName = userInfo.userInfo.nickname;
					console.log('📱 [自动更新访客姓名] 从用户信息中获取昵称:', visitorName);
				}

				// 如果没有微信昵称，跳过自动更新
				if (!visitorName || visitorName.trim() === '') {
					console.log('📱 [自动更新访客姓名] 没有找到微信昵称，跳过自动更新');
					return;
				}

				console.log('📱 [自动更新访客姓名] 检测到已有微信昵称，开始自动更新预约表中的访客姓名:', visitorName);

				// 获取 openid（优先级：userInfo.openid > userInfo.userInfo.openid）
				const openid = userInfo.openid || userInfo.userInfo?.openid || wechatUserInfo.openid;

				// 获取访客手机号
				const lastAppointmentData = uni.getStorageSync('lastAppointmentData') || {};
				const visitorPhone = lastAppointmentData.visitorphone || userInfo.phone || userInfo.userInfo?.phone;

				// 优先使用 openid 更新（更准确）
				if (openid) {
					console.log('📱 [自动更新访客姓名] 使用 openid 更新:', openid);

					const response = await uni.request({
						url: 'http://localhost:8543/parking/appointment/updateVisitorNameByOpenid',
						method: 'POST',
						data: {
							openid: openid,
							visitorName: visitorName
						},
						header: {
							'content-type': 'application/json'
						}
					});

					console.log('📱 [自动更新访客姓名] openid 更新结果:', response.data);

					if (response.data && response.data.code === 200) {
						console.log('✅ [自动更新访客姓名] openid 更新成功');
						return;
					}
				}

				// 如果 openid 更新失败或没有 openid，尝试使用手机号更新
				if (visitorPhone) {
					console.log('📱 [自动更新访客姓名] 使用手机号更新:', visitorPhone);

					const response = await uni.request({
						url: 'http://localhost:8543/parking/appointment/updateVisitorNameByPhone',
						method: 'POST',
						data: {
							visitorPhone: visitorPhone,
							visitorName: visitorName
						},
						header: {
							'content-type': 'application/json'
						}
					});

					console.log('📱 [自动更新访客姓名] 手机号更新结果:', response.data);

					if (response.data && response.data.code === 200) {
						console.log('✅ [自动更新访客姓名] 手机号更新成功');
						return;
					}
				}

				console.warn('⚠️ [自动更新访客姓名] 所有更新方式都失败了');

			} catch (error) {
				console.error('❌ [自动更新访客姓名] 自动更新失败:', error);
			}
		},


	}
}
</script>

<style lang="scss">
/* 🆕 锁定屏幕样式 */
.lock-screen {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100vh;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9999;
	padding: 40rpx;
	box-sizing: border-box;
}

.lock-content {
	background: white;
	border-radius: 24rpx;
	padding: 80rpx 60rpx;
	text-align: center;
	box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.15);
	max-width: 600rpx;
	width: 100%;
	position: relative;
	overflow: hidden;
}

.lock-content::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 8rpx;
	background: linear-gradient(90deg, #667eea, #764ba2);
}

.lock-icon {
	font-size: 120rpx;
	margin-bottom: 40rpx;
	animation: pulse 2s infinite;
}

@keyframes pulse {

	0%,
	100% {
		transform: scale(1);
	}

	50% {
		transform: scale(1.1);
	}
}

.lock-title {
	font-size: 48rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 20rpx;
}

.lock-message {
	font-size: 32rpx;
	color: #666;
	margin-bottom: 40rpx;
	line-height: 1.6;
}

.lock-tips {
	background: #f8f9fa;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 40rpx;
	border-left: 6rpx solid #667eea;
}

.tip-item {
	display: block;
	font-size: 28rpx;
	color: #555;
	margin-bottom: 12rpx;
	text-align: left;
	line-height: 1.5;
}

.tip-item:last-child {
	margin-bottom: 0;
}

.contact-butler-btn {
	background: linear-gradient(45deg, #667eea, #764ba2);
	color: white;
	border: none;
	border-radius: 50rpx;
	padding: 28rpx 60rpx;
	font-size: 32rpx;
	font-weight: 500;
	box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.3);
	transition: all 0.3s ease;
	margin-bottom: 30rpx;
}

.contact-butler-btn:active {
	transform: translateY(2rpx);
	box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
}

/* 🔧 调试按钮样式 */
.debug-btn {
	background: linear-gradient(45deg, #ff6b6b, #ee5a24);
	color: white;
	border: none;
	border-radius: 50rpx;
	padding: 20rpx 40rpx;
	font-size: 24rpx;
	font-weight: 500;
	box-shadow: 0 6rpx 18rpx rgba(255, 107, 107, 0.3);
	transition: all 0.3s ease;
	margin-bottom: 20rpx;
	margin-top: 10rpx;
}

.debug-btn:active {
	transform: translateY(2rpx);
	box-shadow: 0 3rpx 9rpx rgba(255, 107, 107, 0.3);
}

.lock-footer {
	border-top: 1rpx solid #eee;
	padding-top: 20rpx;
}

.footer-text {
	font-size: 24rpx;
	color: #999;
	font-style: italic;
}

/* 🔒 二维码已使用状态的特殊样式 */
.lock-screen.qr-used {
	background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
}

.lock-content.qr-used {
	border-left: 6rpx solid #ff6b6b;
}

.lock-content.qr-used .lock-tips {
	background: #fff5f5;
	border-left: 6rpx solid #ff6b6b;
}

.lock-content.qr-used .contact-butler-btn {
	background: linear-gradient(45deg, #ff6b6b, #ee5a24);
	box-shadow: 0 8rpx 24rpx rgba(255, 107, 107, 0.4);
}

.lock-content.qr-used .contact-butler-btn:active {
	box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.3);
}

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
	/* 增加页面底部内边距 */
	min-height: 100vh;
	/* 确保页面至少占满整个视口高度 */
	box-sizing: border-box;
	padding-bottom: env(safe-area-inset-bottom);
	/* 适配全面屏底部安全区域 */
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
	margin: 8rpx auto;
	/* 进一步减小外边距 */
	background-color: #FFFFFF;
	box-shadow: 0 5rpx 20rpx 0rpx rgba(0, 0, 150, .2);
	border-radius: 20rpx;
	padding: 12rpx 12rpx;
	/* 进一步减小内边距 */
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
	font-size: 34rpx;
	/* 减小标题字体 */
	padding-top: 10rpx;
	margin-bottom: 4rpx;
	margin-left: 20rpx;
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
	padding-bottom: 120rpx;
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.name-button-submit .test-button {
	margin-top: 10rpx;
	background: #f0f9ff !important;
	border: 2rpx solid #0ea5e9 !important;
	color: #0ea5e9 !important;
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
	margin-left: -12rpx;
	/* 调整按钮位置 */
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
	/* 增加底部内边距 */
	background-color: #FFFFFF;
	box-shadow: 0 5rpx 20rpx 0rpx rgba(0, 0, 150, .2);
	border-radius: 20rpx;
	padding: 10rpx 15rpx 40rpx;
	/* 确保底部有足够空间 */
	box-sizing: border-box;
	transition: margin-top 0.3s ease;
	margin-bottom: 30rpx;
	/* 添加底部外边距 */
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
	margin: 12rpx auto;
	padding: 12rpx 10rpx;
	background-color: #FFFFFF;
	box-shadow: 0 5rpx 20rpx 0rpx rgba(0, 0, 150, .2);
	border-radius: 20rpx;
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
	padding: 8rpx 12rpx;
	min-height: 60rpx;
	background: #f8f9fa;
	border-radius: 10rpx;
	border: 2rpx solid #e9ecef;
	transition: all 0.3s ease;
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

/* 添加小区选择器样式 */
.community-selector {
	margin-top: 15rpx;
	padding: 15rpx;
	background: #f8f9fa;
	border-radius: 12rpx;
}

.community-info {
	display: flex;
	align-items: center;
	margin-bottom: 12rpx;
}

.community-name {
	font-size: 28rpx;
	color: #025def;
	margin-left: 10rpx;
	font-weight: 500;
}

.address-selectors {
	display: flex;
	flex-direction: column;
	gap: 12rpx;
	/* 减小选择器之间的间距 */
}

.selector-item {
	display: flex;
	align-items: center;
	padding: 8rpx 0;
	/* 减小上下内边距 */
}

.selector-label {
	font-size: 26rpx;
	color: #666;
	width: 100rpx;
	/* 减小标签宽度 */
}

.selector-content {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12rpx 20rpx;
	/* 减小内边距 */
	background: #fff;
	border-radius: 8rpx;
	border: 2rpx solid #e9ecef;
}

.selector-value {
	font-size: 26rpx;
	color: #333;

	&.placeholder {
		color: #999;
	}
}

/* 重新设计选择器样式 */
.selector-content {
	flex: 1;
	display: flex;
	align-items: center;
	position: relative;
	background: #ffffff;
}

.selector-arrow {
	position: absolute;
	right: 20rpx;
	top: 50%;
	transform: translateY(-50%);
	display: flex;
	align-items: center;
	justify-content: center;
	width: 40rpx;
	height: 40rpx;
	z-index: 1;
}

/* 修改输入框样式 */
::v-deep .u-input {
	&__content {
		background-color: #ffffff !important;
		padding: 10rpx 0;
	}

	&__input {
		font-size: 28rpx;
		color: #333;
	}

	&--disabled {
		background-color: #ffffff !important;

		.u-input__input {
			color: #333 !important;
		}
	}
}

/* 占位符样式 */
::v-deep .u-input__input--disabled::placeholder {
	color: #999 !important;
}

/* 移除旧的选择器样式 */
.community-selector,
.community-info,
.address-selectors,
.selector-item,
.selector-label,
.selector-value {
	display: none;
}

.centre_vie {
	width: 98%;
	/* 增加宽度 */
	margin: 10rpx auto;
	/* 减小上下外边距 */
	background-color: #FFFFFF;
	box-shadow: 0 5rpx 20rpx 0rpx rgba(0, 0, 150, .2);
	border-radius: 20rpx;
	padding: 20rpx 15rpx;
	/* 调整内边距 */
	box-sizing: border-box;
}

/* 调整表单项样式 */
::v-deep .u-form-item {
	padding: 4rpx 8rpx;
	/* 进一步减小表单项内边距 */
	margin-bottom: 4rpx;
	/* 进一步减小表单项之间的间距 */

	.u-form-item__body {
		padding: 6rpx 0;
		/* 减小表单项主体内边距 */

		&__left {
			margin-right: 8rpx;
			/* 减小左侧标签的右边距 */
		}

		&__right {
			flex: 1;
			padding-left: 0;
		}
	}
}

/* 调整选择器内容区域样式 */
.selector-content {
	flex: 1;
	display: flex;
	align-items: center;
	position: relative;
	background: #ffffff;
	padding-right: 40rpx;
	/* 为箭头留出空间 */
}

/* 调整箭头位置 */
.selector-arrow {
	position: absolute;
	right: 10rpx;
	top: 50%;
	transform: translateY(-50%);
	display: flex;
	align-items: center;
	justify-content: center;
	width: 40rpx;
	height: 40rpx;
	z-index: 1;
}

/* 调整输入框样式 */
::v-deep .u-input {
	&__content {
		background-color: #ffffff !important;
		padding: 8rpx 0;
	}

	&__input {
		font-size: 28rpx;
		color: #333;
	}
}

/* 调整卡片之间的间距 */
.centre_vie+.centre_vie {
	margin-top: 12rpx;
	/* 减小相邻卡片之间的间距 */
}

/* 添加地址选择器样式 */
.form-item {
	margin-bottom: 30rpx;

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

	.tip {
		display: block;
		font-size: 24rpx;
		color: #718096;
		margin-top: 12rpx;
		padding-left: 8rpx;
	}
}

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

.address-selector {
	width: 100%;

	.current-community {
		margin: 10rpx 0;
		padding: 12rpx 20rpx;
		background: #f8f9fa;
		border-radius: 12rpx;
		display: flex;
		align-items: center;

		.community-label {
			font-size: 26rpx;
			color: #666;
			margin-right: 10rpx;
		}

		.community-name {
			font-size: 28rpx;
			color: #333;
			font-weight: 500;
		}
	}

	.address-row {
		margin-top: 10rpx;

		.picker-item {
			width: 100%;
			height: 80rpx;
			background: #f8f9fa;
			border-radius: 12rpx;
			padding: 8rpx 12rpx;
			/* 减小选择器内边距 */
			display: flex;
			align-items: center;
			justify-content: space-between;

			.picker-text {
				font-size: 26rpx;
				/* 稍微减小字体大小 */
				color: #333;
				flex: 1;
				padding-left: 0;
				/* 移除文本的左内边距 */

				&:empty::before {
					content: '请选择栋、单元、房间';
					color: #999;
				}
			}

			.picker-arrow {
				font-size: 24rpx;
				color: #999;
				margin-left: 10rpx;
			}
		}
	}

	.full-address {
		margin-top: 15rpx;
		padding: 15rpx;
		background: #f0f9ff;
		border-radius: 12rpx;
		border: 1px solid #e6f4ff;

		.address-preview-label {
			font-size: 26rpx;
			color: #666;
			margin-bottom: 8rpx;
			display: block;
		}

		.full-address-text {
			font-size: 28rpx;
			color: #333;
			line-height: 1.4;
		}
	}
}

.multi-selector {
	min-height: 80rpx;
	background: #f8f9fa !important;
	border-radius: 12rpx;

	.picker-text {
		max-width: 480rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 26rpx;
		line-height: 1.4;
	}
}

/* 地址选择器样式 */
.address-row-container {
	display: flex;
	align-items: center;
	padding: 8rpx 16rpx;
	/* 减小内边距 */
	margin: 6rpx 0;
	/* 减小外边距 */
	background: #fff;
	border-radius: 10rpx;
}

.address-label {
	display: flex;
	align-items: center;
	min-width: 160rpx;
	margin-right: 20rpx;

	text {
		font-size: 28rpx;
		color: #333;
		margin-left: 10rpx;
	}
}

.address-content {
	flex: 1;

	.picker-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: #f8f9fa;
		padding: 8rpx 12rpx;
		/* 减小选择器内边距 */
		border-radius: 10rpx;
		min-height: 60rpx;
		/* 减小最小高度 */

		.picker-text {
			font-size: 26rpx;
			/* 稍微减小字体大小 */
			color: #333;
			flex: 1;
			padding-left: 0;
			/* 移除文本的左内边距 */

			&:empty::before {
				content: '请选择栋、单元、房间';
				color: #999;
			}
		}

		.picker-arrow {
			font-size: 24rpx;
			color: #999;
			margin-left: 10rpx;
		}
	}
}

/* 地址选择器和表单项通用样式 */
::v-deep .u-form-item {
	padding: 4rpx 8rpx;
	margin-bottom: 4rpx;

	.u-form-item__body {
		padding: 6rpx 0;

		&__left {
			margin-right: 8rpx;
			/* 减小左侧标签的右边距 */
		}

		&__right {
			flex: 1;
			padding-left: 0;
			/* 移除右侧内容的左内边距 */
		}
	}
}

/* 输入框样式统一 */
::v-deep .u-input {
	background-color: #f8f9fa !important;
	border-radius: 8rpx;
	padding: 8rpx 12rpx;
	/* 进一步减小内边距 */
	min-height: 60rpx;
	/* 进一步减小最小高度 */

	&__content {
		background-color: #f8f9fa !important;
		padding: 0;
	}

	&__input {
		font-size: 26rpx;
		/* 稍微减小字体大小 */
		color: #333;
	}
}

/* 自动填充地址样式 */
.auto-filled-address {
	width: 100%;
	background: linear-gradient(135deg, #e8f4fd 0%, #f0f9ff 100%);
	border-radius: 12rpx;
	border: 2rpx solid #0ea5e9;
	padding: 12rpx 16rpx;
	box-sizing: border-box;
}

/* 🆕 业主自动填充地址样式（绿色主题） */
.owner-auto-filled-address {
	width: 100%;
	background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
	border-radius: 12rpx;
	border: 2rpx solid #10b981;
	padding: 12rpx 16rpx;
	box-sizing: border-box;
}

/* 🆕 二维码自动填充地址样式（蓝色主题） */
.qr-auto-filled-address {
	width: 100%;
	background: linear-gradient(135deg, #e8f4fd 0%, #f0f9ff 100%);
	border-radius: 12rpx;
	border: 2rpx solid #0ea5e9;
	padding: 12rpx 16rpx;
	box-sizing: border-box;
}

.auto-filled-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 8rpx;
}

.auto-filled-text {
	font-size: 28rpx;
	font-weight: 600;
	color: #0c4a6e;
	flex: 1;
}

.auto-filled-badge {
	background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
	padding: 4rpx 12rpx;
	border-radius: 20rpx;
	margin-left: 12rpx;
}

/* 🆕 业主徽章样式（绿色主题） */
.owner-badge {
	background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

/* 🆕 二维码徽章样式（蓝色主题） */
.qr-badge {
	background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
}

.badge-text {
	font-size: 20rpx;
	color: #ffffff;
	font-weight: 500;
}

.auto-filled-tips {
	margin-top: 8rpx;
	padding: 8rpx 0;
}

.tips-text {
	font-size: 24rpx;
	color: #0369a1;
	line-height: 1.4;
}

/* 🆕 禁用状态的地址选择器样式 */
.picker-item.disabled {
	opacity: 0.6;
	cursor: not-allowed;
	background: #f5f5f5;
}

/* 🆕 业主手机号显示样式 */
.auto-filled-owner-info,
.manual-owner-info {
	margin-top: 12rpx;
	padding: 10rpx 16rpx;
	background: rgba(6, 182, 212, 0.08);
	border-radius: 8rpx;
	border: 1rpx solid rgba(6, 182, 212, 0.2);
}

.owner-phone-item {
	display: flex;
	align-items: center;
	justify-content: flex-start;
}

.owner-phone-label {
	font-size: 26rpx;
	color: #0891b2;
	font-weight: 500;
	margin-right: 8rpx;
}

.owner-phone-value {
	font-size: 26rpx;
	color: #0c4a6e;
	font-weight: 600;
}

/* 业主信息建议样式 */
.owner-suggestions {
	margin-top: 16rpx;
	background: #f8f9fa;
	border-radius: 12rpx;
	border: 1rpx solid #e9ecef;
	overflow: hidden;

	.suggestions-header {
		padding: 16rpx 20rpx 12rpx;
		background: #e3f2fd;
		border-bottom: 1rpx solid #bbdefb;

		.suggestions-title {
			font-size: 26rpx;
			color: #1976d2;
			font-weight: 500;
		}
	}

	.owner-suggestion-item {
		padding: 16rpx 20rpx;
		border-bottom: 1rpx solid #e9ecef;
		display: flex;
		justify-content: space-between;
		align-items: center;
		transition: background-color 0.2s;

		&:last-child {
			border-bottom: none;
		}

		&:active {
			background: #e3f2fd;
		}

		.owner-info {
			flex: 1;

			.owner-name {
				display: block;
				font-size: 30rpx;
				color: #333;
				font-weight: 600;
				margin-bottom: 6rpx;
			}

			.owner-phone {
				display: block;
				font-size: 26rpx;
				color: #1976d2;
				font-weight: 500;
				margin-bottom: 6rpx;
			}

			.owner-address {
				display: block;
				font-size: 24rpx;
				color: #666;
				line-height: 1.4;
			}
		}

		.suggestion-action {
			.action-text {
				font-size: 24rpx;
				color: #1976d2;
				padding: 8rpx 16rpx;
				background: #e3f2fd;
				border-radius: 20rpx;
				border: 1rpx solid #bbdefb;
			}
		}
	}

	// 业主搜索功能样式
	.owner-search-section {
		margin: 20rpx 0;
		padding: 20rpx;
		background: #f8f9fa;
		border-radius: 16rpx;
		border: 1rpx solid #e9ecef;

		.search-container {
			margin-bottom: 20rpx;

			.search-header {
				margin-bottom: 16rpx;

				.search-title {
					font-size: 32rpx;
					font-weight: 600;
					color: #2c3e50;
					display: block;
					margin-bottom: 8rpx;
				}

				.search-subtitle {
					font-size: 24rpx;
					color: #6c757d;
					display: block;
				}
			}
		}

		.owner-search-results {
			margin-top: 20rpx;

			.results-header {
				padding: 16rpx 0;
				border-bottom: 1rpx solid #e9ecef;
				margin-bottom: 16rpx;

				.results-title {
					font-size: 28rpx;
					font-weight: 600;
					color: #495057;
				}
			}

			.owner-result-item {
				display: flex;
				align-items: center;
				justify-content: space-between;
				padding: 20rpx;
				margin-bottom: 16rpx;
				background: #ffffff;
				border-radius: 12rpx;
				border: 1rpx solid #e9ecef;
				box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
				transition: all 0.3s ease;

				&:active {
					transform: scale(0.98);
					background: #f8f9fa;
				}

				.owner-info {
					flex: 1;

					.owner-name {
						font-size: 32rpx;
						font-weight: 600;
						color: #2c3e50;
						display: block;
						margin-bottom: 8rpx;
					}

					.owner-phone {
						font-size: 28rpx;
						color: #495057;
						display: block;
						margin-bottom: 8rpx;
					}

					.owner-address {
						font-size: 24rpx;
						color: #6c757d;
						display: block;
						margin-bottom: 8rpx;
					}

					.owner-status {
						font-size: 22rpx;
						padding: 4rpx 12rpx;
						border-radius: 12rpx;
						display: inline-block;

						&.status-approved {
							color: #28a745;
							background: #d4edda;
							border: 1rpx solid #c3e6cb;
						}

						&.status-pending {
							color: #ffc107;
							background: #fff3cd;
							border: 1rpx solid #ffeaa7;
						}

						&.status-rejected {
							color: #dc3545;
							background: #f8d7da;
							border: 1rpx solid #f5c6cb;
						}

						&.status-unknown {
							color: #6c757d;
							background: #e9ecef;
							border: 1rpx solid #dee2e6;
						}
					}
				}

				.select-action {
					.action-text {
						font-size: 24rpx;
						color: #007bff;
						padding: 8rpx 16rpx;
						background: #e7f3ff;
						border-radius: 20rpx;
						border: 1rpx solid #b3d7ff;
					}
				}
			}
		}

		.search-loading {
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 40rpx 20rpx;

			.loading-text {
				margin-left: 16rpx;
				font-size: 28rpx;
				color: #6c757d;
			}
		}

		.no-search-results {
			text-align: center;
			padding: 40rpx 20rpx;

			.no-results-text {
				font-size: 28rpx;
				color: #6c757d;
				display: block;
				margin-bottom: 8rpx;
			}

			.no-results-tip {
				font-size: 24rpx;
				color: #adb5bd;
				display: block;
			}
		}
	}
}

/* 🆕 访客角色业主信息显示样式 */
.owner-info-display {
	width: 100%;
	padding: 15rpx 20rpx;
	background: #f8f9fa;
	border-radius: 12rpx;
	border: 1rpx solid #e9ecef;
}

.owner-info-item {
	display: flex;
	align-items: center;
	margin-bottom: 12rpx;

	&:last-child {
		margin-bottom: 0;
	}
}

.owner-label {
	font-size: 26rpx;
	color: #495057;
	font-weight: 500;
	min-width: 140rpx;
}

.owner-value {
	font-size: 26rpx;
	color: #2c3e50;
	flex: 1;
	word-break: break-all;
}

/* 访客角色联系电话输入框样式 */
::v-deep .u-input--visitor {
	.u-input__content {
		background-color: #ffffff !important;
		border: 1rpx solid #ced4da !important;
		border-radius: 8rpx !important;
	}

	.u-input__input {
		color: #495057 !important;
	}
}

/* 🆕 自定义导航栏样式 */
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

.navbar-right {
	display: flex;
	align-items: center;
	gap: 20rpx;
	min-width: 80rpx;
	justify-content: flex-end;
}

.nav-dots,
.nav-scan {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 60rpx;
	height: 60rpx;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.1);
	transition: background 0.3s ease;
}

.nav-dots:active,
.nav-scan:active {
	background: rgba(255, 255, 255, 0.2);
}

/* 为页面内容添加顶部间距，避免被导航栏遮挡 */
.u-page {
	padding-top: 88px;
	/* 44px(状态栏) + 44px(导航栏) */
}

/* 锁定屏幕时不需要顶部间距 */
.lock-screen {
	padding-top: 0;
}

.lock-screen .lock-content {
	margin-top: 172px;
	/* 44px(状态栏) + 88rpx(约44px导航栏) + 40rpx(约20px间距) */
}

/* 🆕 公众号关注引导模态框样式 */
.subscription-modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.7);
	z-index: 9999;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 40rpx;
}

.subscription-modal {
	background: white;
	border-radius: 24rpx;
	width: 100%;
	max-width: 600rpx;
	max-height: 80vh;
	overflow: hidden;
	box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.3);
}

.subscription-guide {
	padding: 40rpx;
}

.guide-header {
	display: flex;
	align-items: center;
	margin-bottom: 32rpx;
	justify-content: center;
}

.guide-icon {
	font-size: 48rpx;
	margin-right: 16rpx;
}

.guide-title {
	font-size: 36rpx;
	font-weight: 600;
	color: #2d3748;
}

.guide-content {
	text-align: center;
}

.guide-desc {
	font-size: 28rpx;
	color: #4a5568;
	line-height: 1.6;
	margin-bottom: 40rpx;
	display: block;
}

.guide-qrcode {
	margin-bottom: 40rpx;
}

.qrcode-img {
	width: 280rpx;
	height: 280rpx;
	border-radius: 16rpx;
	border: 2rpx solid #e2e8f0;
	margin-bottom: 20rpx;
}

.qrcode-text {
	font-size: 24rpx;
	color: #718096;
	display: block;
}

.guide-actions {
	display: flex;
	gap: 20rpx;
}

.guide-btn {
	flex: 1;
	height: 88rpx;
	border-radius: 44rpx;
	border: none;
	font-size: 28rpx;
	font-weight: 600;
	transition: all 0.3s ease;
	display: flex;
	align-items: center;
	justify-content: center;
}

.guide-btn::after {
	border: none;
}

.guide-btn.secondary {
	background: #f7fafc;
	color: #4a5568;
	border: 2rpx solid #e2e8f0;
}

.guide-btn.secondary:active {
	background: #edf2f7;
}

.guide-btn.primary {
	background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
	color: white;
	box-shadow: 0 6rpx 24rpx rgba(79, 172, 254, 0.3);
}

.guide-btn.primary:active {
	transform: translateY(2rpx);
	box-shadow: 0 4rpx 16rpx rgba(79, 172, 254, 0.4);
}

.guide-btn:disabled {
	opacity: 0.5;
	transform: none !important;
}

// 🆕 业主信息容器样式
.owner-info-container {
	margin: 20rpx 0;
	padding: 24rpx;
	background: linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%);
	border-radius: 16rpx;
	border: 2rpx solid #81c784;
	box-shadow: 0 4rpx 12rpx rgba(76, 175, 80, 0.1);
	
	.owner-info-header {
		display: flex;
		align-items: center;
		margin-bottom: 16rpx;
		padding-bottom: 12rpx;
		border-bottom: 1rpx solid #c8e6c9;
		
		.owner-info-title {
			margin-left: 12rpx;
			font-size: 30rpx;
			font-weight: 600;
			color: #2e7d32;
			letter-spacing: 0.5rpx;
		}
	}
}
</style>