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
				<view class="navbar-title">快速查车</view>
				<!-- 右侧按钮区域 -->
				<view class="navbar-right">
					<!-- 显示当前管理的小区（仅显示，不可点击） -->
					<view class="community-display" v-if="currentUserRole === 'manager' && currentManagerCommunity">
						<text class="community-icon">🏘️</text>
						<text class="community-text">{{ currentManagerCommunity }}</text>
					</view>
				</view>
			</view>
		</view>

		<view class="container" :style="{ paddingTop: (statusBarHeight - 40) + 'px' }">
			<!-- 欢迎界面 -->
			<view class="welcome-section">
				<!-- 核心功能区块 -->
				<view class="main-content">
					<!-- Deepseek风格图标 -->
					<u-row justify="center">
						<u-col span="auto">
							<view class="icon-wrapper">
								<image src="/static/巡查驻点.png" style="width: 70px; height: 70px;"></image>
								<text class="main-title">快速查车</text>
								<text class="sub-title">智慧出行服务系统 V1.1</text>
							</view>
						</u-col>
					</u-row>
					<!-- 主搜索框 -->
					<view class="welcome-search-container">
						<view class="search-input-wrapper">
							<input class="search-input" v-model="searchKeyword" placeholder="输入车牌号/姓名/手机号/地址..."
								@input="handleSearchInput" @focus="handleSearchFocus" @blur="handleSearchBlur"
								@confirm="handleSearchConfirm" :focus="searchInputFocus" adjust-position="true"
								cursor-spacing="10" hold-keyboard="true" confirm-type="search" />
							<view class="search-actions">
								<view class="voice-search" 
								      @click="startVoiceSearch" 
								      v-if="!searchKeyword"
								      :class="{ 'recording': isRecording }">
									<text class="icon-emoji" 
									      :style="{ color: isRecording ? '#F56C6C' : '#409EFF' }">
										{{ isRecording ? '🔴' : '🎤' }}
									</text>
								</view>
								<view class="clear-search" @click="clearSearch" v-if="searchKeyword">
									<text class="icon-emoji" style="color: #C0C4CC">✕</text>
								</view>
								<view class="search-button" @click="handleSearchConfirm">
									<text class="icon-emoji" style="color: #FFFFFF">🔍</text>
								</view>
							</view>
						</view>

						<!-- 搜索建议下拉框 - 修复键盘遮挡问题 -->
						<view class="search-suggestions" v-if="showSuggestions"
							:style="{ transform: 'translateY(' + (keyboardHeight > 0 ? '-' + (keyboardHeight - 100) + 'px' : '0') + ')' }">
							<scroll-view scroll-y class="suggestions-scroll"
								v-if="searchSuggestions && searchSuggestions.length > 0"
								:scroll-top="suggestionScrollTop" :enable-back-to-top="false" :show-scrollbar="true"
								:enhanced="true" :bounces="true" :fast-deceleration="false">
								<view class="suggestion-item" v-for="(suggestion, index) in searchSuggestions"
									:key="index" @click="selectSuggestionByIndex(index)" @touchstart="handleTouchStart"
									@touchend="handleTouchEnd">
									<view class="suggestion-icon">
										<text class="icon-emoji"
											:style="{ color: getSuggestionIconColor((suggestion && suggestion.type) || 'default') }">
											{{ getSuggestionIcon((suggestion && suggestion.type) || 'default') }}
										</text>
									</view>
									<view class="suggestion-content">
										<text class="suggestion-text">{{ (suggestion && suggestion.text) || '未知'
										}}</text>
										<text class="suggestion-type">{{ getSuggestionTypeText((suggestion &&
											suggestion.type) || 'default') }}</text>
									</view>
									<view class="suggestion-arrow">
										<text class="icon-emoji" style="color: #c0c4cc">➡</text>
									</view>
								</view>
							</scroll-view>

							<!-- 没有找到建议时的提示 -->
							<view class="no-suggestions" v-if="!searchSuggestions || searchSuggestions.length === 0">
								<view class="no-suggestions-content">
									<text class="icon-emoji" style="color: #909399; margin-right: 8rpx">🔍</text>
									<text class="no-suggestions-text">没有找到匹配的建议</text>
								</view>
								<view class="no-suggestions-tip">
									<text class="tip-text">可以尝试输入车牌号、姓名、手机号或地址</text>
								</view>
							</view>

							<view class="suggestions-footer" v-if="searchSuggestions && searchSuggestions.length > 0">
								<text class="footer-text">找到 {{ (searchSuggestions || []).length }} 个匹配项</text>
							</view>
						</view>
					</view>

					<!-- 搜索历史 -->
					<view class="search-history"
						v-if="showSearchHistory && searchHistory && searchHistory.length > 0 && !showHotSearch">
						<view class="history-header">
							<view class="history-title">
								<text class="icon-emoji" style="color: #909399; margin-right: 8rpx">🕐</text>
								<text>搜索历史</text>
							</view>
							<view class="history-actions">
								<view class="history-toggle" @click="toggleSearchHistory">
									<text class="icon-emoji" style="color: #909399; margin-right: 6rpx">{{
										searchHistoryExpanded ? '📕' : '📖' }}</text>
									<text>{{ searchHistoryExpanded ? '收起' : '展开' }}</text>
								</view>
								<view class="clear-history" @click="clearSearchHistory">
									<text class="icon-emoji" style="color: #909399; margin-right: 6rpx">🗑️</text>
									<text>清空</text>
								</view>
							</view>
						</view>
						<view class="history-content" v-if="searchHistoryExpanded">
							<view class="history-item" v-for="(item, index) in recentSearchHistory" :key="index"
								@click="useHistorySearch(item)" v-if="item && item.keyword">
								<view class="history-icon">
									<text class="icon-emoji">{{ getHistoryIcon(item && item.type ? item.type :
										'keyword') }}</text>
								</view>
								<text class="history-text">{{ (item && item.keyword) ? item.keyword : '未知' }}</text>
								<view class="history-time">{{ formatHistoryTime(item && item.time ? item.time :
									Date.now()) }}</view>
								<view class="history-delete" @click.stop="removeSearchHistory(index)">
									<text class="icon-emoji" style="color: #999">✕</text>
								</view>
							</view>
						</view>
						<!-- 添加收起状态下的预览 -->
						<view class="history-preview" v-if="!searchHistoryExpanded && searchHistory.length > 0">
							<view class="preview-tags">
								<view class="preview-tag" v-for="(item, index) in previewSearchHistory" :key="index"
									@click="useHistorySearch(item)" v-if="item && item.keyword">
									<text>{{ item.keyword }}</text>
								</view>
								<view class="preview-more" v-if="searchHistory.length > 3">
									<text>...</text>
								</view>
							</view>
						</view>
					</view>

					<!-- 热门搜索标签 -->
					<view class="hot-search-tags"
						v-if="showHotSearch && (!showSearchHistory || !searchHistory || searchHistory.length === 0)">
						<view class="tags-header">
							<text class="icon-emoji" style="color: #FF6B35; margin-right: 8rpx">🔥</text>
							<text class="tags-title">关键词搜索</text>
						</view>
						<view class="tags-container">
							<view class="hot-tag" v-for="(tag, index) in hotSearchTags" :key="index"
								@click="selectHotTag(tag)">
								<view class="tag-content">
									<text class="tag-text">{{ tag.text }}</text>
									<text class="tag-count">{{ tag.count }}</text>
								</view>
							</view>
						</view>
					</view>

					<!-- 快速操作入口 -->
					<view class="quick-actions">
						<view class="action-item" @click="showAdvancedFeatures">
							<text class="icon-emoji" style="color: #409EFF; margin-right: 12rpx">🔍</text>
							<text class="action-text">全部数据</text>
							<text class="icon-emoji" style="color: #C0C4CC">➡</text>
						</view>
						<view class="action-item" @click="showTodayAppointment">
							<text class="icon-emoji" style="color: #67C23A; margin-right: 12rpx">📅</text>
							<text class="action-text">今日预约</text>
							<text class="action-count">{{ getTodayCount() }}</text>
						</view>
						<view class="action-item" @click="showTodayVisit">
							<text class="icon-emoji" style="color: #FF9500; margin-right: 12rpx">🚗</text>
							<text class="action-text">今日来访</text>
							<text class="action-count">{{ getTodayVisitCount() }}</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 自定义TabBar -->
			<custom-tabbar @tabChange="onTabChange">
			</custom-tabbar>
		</view>

	</view>
</template>
<script>
import dayjs from 'dayjs'
import CustomTabbar from '@/components/custom-tabbar.vue'
import {
	appointmentAPI
} from '@/config/api.js'

// 引入微信同声传译插件
const plugin = requirePlugin("WechatSI");

export default {
	components: {
		CustomTabbar
	},
	data() {
		return {
			statusBarHeight: 44, // 状态栏高度，默认44px
			currentUserRole: 'manager', // 默认管家角色
			currentUserPhone: '', // 当前用户手机号
			currentManagerCommunity: '', // 当前管家负责的小区
			isLoadingData: false, // 是否正在加载数据，防止重复加载
			
			// 智能搜索相关数据
			searchKeyword: '',
			showSuggestions: false,
			showSearchHistory: false,
			showHotSearch: true,
			searchHistoryExpanded: false, // 新增：控制搜索历史展开/收起状态
			searchSuggestions: [],
			searchHistory: [], // 格式: [{ keyword: '', type: '', time: timestamp, count: number }]
			userInteracting: false, // 用户是否正在交互（防止意外隐藏建议）
			searchDebounceTimer: null, // 搜索防抖定时器
			searchInputFocus: false, // 控制搜索框焦点
			hasPerformedSearch: false, // 是否已执行过搜索操作
			keyboardHeight: 0, // 键盘高度
			suggestionScrollTop: 0, // 搜索建议滚动位置
			hotSearchTags: [], // 热门搜索标签数组

			// 数据存储（用于统计和跳转到列表页）
			originalList: [], // 原始数据备份
			reservationList: [], // 用于统计
			
			// 语音识别相关
			voiceManager: null, // 语音识别管理器
			isRecording: false, // 录音状态
		}
	},


	onLoad(options) {
		// 设置状态栏高度
		this.setStatusBarHeight();

		// 清除可能存在的手动选择的小区存储
		uni.removeStorageSync('managerSelectedCommunity');

		// 🆕 优先使用URL参数中的角色（从dataList返回时传递）
		if (options.role) {
			console.log('🎭 [searchResult] 从URL参数获取角色:', options.role);
			this.currentUserRole = options.role;
			// 同步更新存储，确保TabBar组件也能获取正确角色
			try {
				const userInfo = uni.getStorageSync('userInfo') || {};
				userInfo.role = options.role;
				uni.setStorageSync('userInfo', userInfo);
				uni.setStorageSync('userRole', options.role);
			} catch (e) {
				console.error('❌ [searchResult] 同步角色到存储失败:', e);
			}
		}

		// 获取用户角色
		this.getUserRole();
		// 加载搜索历史
		this.loadSearchHistory();

		// 🐛 修复：立即从storage加载缓存数据，避免页面初始化时数据为空
		this.loadDataFromStorage();

		// 获取用户手机号并加载预约数据（用于统计）
		this.getCurrentUserPhone().then(() => {
			console.log('🚀 [onLoad] 手机号获取成功，开始加载数据');
			this.loadAppointmentData();
		}).catch((error) => {
			console.error('❌ [onLoad] 获取手机号失败:', error);
			// 即使获取手机号失败，storage中可能有缓存数据可用
		});

		// 监听TabBar状态更新事件
		uni.$on('updateTabBarIndex', (index) => {
			// TabBar状态更新处理
		});
		
		// 监听清空搜索框事件
		uni.$on('clearSearchKeyword', this.handleClearSearchKeyword);
	},
	onShow() {
		// 强制隐藏系统TabBar
		this.hideSystemTabBar();

		// 页面显示时通知TabBar检查当前页面
		this.$nextTick(() => {
			// 通知TabBar更新为当前页面对应的索引（预约查询页面是索引1）
			uni.$emit('updateTabBarIndex', 1);
		});

		// 页面显示时刷新数据，确保今日数据统计实时更新
		if (this.currentUserPhone) {
			this.loadAppointmentData();
		}

		// 触发导航到停车页面事件
		this.triggerNavigateToParking();
	},
	onUnload() {
		// 停止录音（如果正在录音）
		if (this.isRecording && this.voiceManager) {
			this.stopVoiceSearch();
		}
		// 清理事件监听
		uni.$off('updateTabBarIndex');
		uni.$off('clearSearchKeyword', this.handleClearSearchKeyword);
	},

	// 监听页面返回按钮
	onBackPress(options) {
		// 允许正常返回
		return false;
	},

	mounted() {
		// 确保数据是数组
		if (!Array.isArray(this.reservationList)) {
			this.reservationList = [];
		}

		// 初始化备份数据
		this.originalList = [];

		// 加载搜索历史和热门标签
		try {
			const history = uni.getStorageSync('search_history');
			if (history && Array.isArray(history)) {
				this.searchHistory = history.map(item => ({
					...item,
					count: item.count || 1 // 确保每个历史记录都有count字段
				}));
				// 🐛 修复：显示搜索历史，同时隐藏热门搜索
				this.showSearchHistory = true;
				this.showHotSearch = false; // 有历史记录时隐藏热门搜索，显示搜索历史
				// 初始化热门搜索标签
				this.updateHotSearchTags();
			} else {
				this.searchHistory = [];
				this.hotSearchTags = [];
			}

			// 默认搜索历史为收起状态
			this.searchHistoryExpanded = false;

		} catch (error) {
			this.searchHistory = [];
			this.hotSearchTags = [];
		}

		// 初始化筛选器计数
		this.updateFilterCounts();

		// 初始化搜索建议数组
		if (!Array.isArray(this.searchSuggestions)) {
			this.searchSuggestions = [];
		}

		// 初始化键盘监听
		this.initKeyboardListeners();

		// 初始化折叠状态 - 默认全部折叠
		this.itemCollapseStates = {};
		
		// 初始化语音识别管理器
		this.initVoiceManager();
	},
	computed: {
		// 获取预览显示的搜索历史（最多3条）
		previewSearchHistory() {
			try {
				// 安全检查，确保返回有效的历史记录数组
				if (!this.searchHistory || !Array.isArray(this.searchHistory)) {
					return [];
				}

				// 过滤掉无效的历史记录项，只返回前3条
				return this.searchHistory
					.filter(item => item && item.keyword && typeof item.keyword === 'string')
					.slice(0, 3);
			} catch (error) {
				return [];
			}
		},

		// 计算每个项目的时间状态类名
		getItemTimeClass() {
			return (time) => {
				if (this.isToday(time)) {
					return 'time-status-today';
				} else if (this.isYesterday(time)) {
					return 'time-status-yesterday';
				} else if (this.isWithinDays(time, 3)) {
					return 'time-status-three-days';
				} else if (this.isWithinDays(time, 5)) {
					return 'time-status-five-days';
				} else if (this.isWithinDays(time, 7)) {
					return 'time-status-week';
				}
				return '';
			}
		},

		// 最近搜索历史（限制显示数量）
		recentSearchHistory() {
			try {
				// 安全检查，确保返回有效的历史记录数组
				if (!this.searchHistory || !Array.isArray(this.searchHistory)) {
					return [];
				}

				// 过滤掉无效的历史记录项
				return this.searchHistory
					.filter(item => item && item.keyword && typeof item.keyword === 'string')
					.slice(0, 6);
			} catch (error) {
				return [];
			}
		}
	},
	methods: {
		// 🆕 iOS 兼容的日期解析函数
		parseDate(dateString) {
			if (!dateString) return new Date();

			// 如果已经是 Date 对象，直接返回
			if (dateString instanceof Date) return dateString;

			// 将 "2025-07-15 10:17:15" 格式转换为 "2025/07/15 10:17:15" 格式
			// 这样在 iOS 中也能正常工作
			const normalizedDateString = dateString.replace(/-/g, '/');
			return new Date(normalizedDateString);
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

		// 获取用户角色
		getUserRole() {
			try {
				const userInfo = uni.getStorageSync('userInfo');

				if (userInfo && userInfo.role) {
					this.currentUserRole = userInfo.role;
				} else if (userInfo && userInfo.userInfo && userInfo.userInfo.userkind) {
					// 检查是否使用了userkind字段（兼容处理）
					this.currentUserRole = userInfo.userInfo.userkind;
				} else {
					// 预约查询页面默认为管家角色
					this.currentUserRole = 'manager';
				}
			} catch (error) {
				this.currentUserRole = 'manager';
			}
		},

		// 获取当前用户手机号
		getCurrentUserPhone() {
			console.log('📞 [获取手机号] 开始获取用户手机号');
			return new Promise((resolve, reject) => {
				try {
					const userInfo = uni.getStorageSync('userInfo');
					console.log('📞 [获取手机号] userInfo:', userInfo);

					if (userInfo && userInfo.phone) {
						this.currentUserPhone = userInfo.phone;
						console.log('✅ [获取手机号] 成功:', this.currentUserPhone);
						resolve(this.currentUserPhone);
					} else if (userInfo && userInfo.userInfo && userInfo.userInfo.phone) {
						this.currentUserPhone = userInfo.userInfo.phone;
						console.log('✅ [获取手机号] 成功 (nested):', this.currentUserPhone);
						resolve(this.currentUserPhone);
					} else {
						console.error('❌ [获取手机号] 未找到手机号，尝试从storage加载缓存数据');
						this.loadDataFromStorage();
						reject('未找到手机号');
					}
				} catch (error) {
					console.error('❌ [获取手机号] 异常:', error);
					this.loadDataFromStorage();
					reject(error);
				}
			});
		},
		
		// 从storage加载缓存数据（fallback机制）
		loadDataFromStorage() {
			console.log('💾 [数据加载] 尝试从storage加载缓存数据');
			try {
				const cachedData = uni.getStorageSync('searchResultData');
				if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
					console.log('✅ [数据加载] 从storage加载成功，数据长度:', cachedData.length);
					this.originalList = cachedData;
					this.reservationList = [...cachedData];
					this.updateFilterCounts();
					this.sortByLatestTime();
				} else {
					console.warn('⚠️ [数据加载] storage中没有缓存数据');
				}
			} catch (error) {
				console.error('❌ [数据加载] 从storage加载失败:', error);
			}
		},

		// 加载预约数据
		loadAppointmentData() {
			// 防止重复加载
			if (this.isLoadingData) {
				console.log('⏳ [数据加载] 正在加载中，跳过重复请求');
				return Promise.resolve();
			}

			// 设置加载状态
			this.isLoadingData = true;

			// 显示加载提示
			uni.showLoading({
				title: '加载数据中...',
				mask: true
			});

			// 根据用户角色选择不同的查询方式，返回Promise
			if (this.currentUserRole === 'visitor') {
				// 访客 - 根据手机号查询
				return this.loadAppointmentDataByPhone();
			} else if (this.currentUserRole === 'manager') {
				// 管家 - 查询管理区域内的预约
				return this.loadAppointmentDataForManager();
			} else {
				// 业主 - 根据手机号查询
				return this.loadAppointmentDataByPhone();
			}
		},

		// 智能搜索确认 - 跳转到数据列表页
		handleSearchConfirm() {
			if (!this.searchKeyword || !this.searchKeyword.trim()) {
				uni.showToast({
					title: '请输入搜索内容',
					icon: 'none',
					duration: 1500
				});
				return;
			}

			// 保存数据到storage供dataList页面使用
			uni.setStorageSync('searchResultData', this.originalList);

			// 跳转到数据列表页，传递搜索关键词
			uni.navigateTo({
				url: `/pagesA/reservation/dataList/dataList?keyword=${encodeURIComponent(this.searchKeyword)}`
			});

			// 关闭搜索建议
			this.showSuggestions = false;

			// 保存搜索历史
			this.saveSearchHistory(this.searchKeyword);
		},

		// 根据手机号查询预约数据
		loadAppointmentDataByPhone() {
			console.log('📱 [数据加载] 开始加载，手机号:', this.currentUserPhone);
			if (!this.currentUserPhone) {
				console.error('❌ [数据加载] 手机号为空，无法加载数据');
				uni.hideLoading();
				this.isLoadingData = false;
				uni.showToast({
					title: '未找到用户信息',
					icon: 'none',
					duration: 2000
				});
				return Promise.reject('未找到用户信息');
			}

			this.originalList = [];
			this.reservationList = [];

			return appointmentAPI.getListByPhone(this.currentUserPhone)
				.then((res) => {
					console.log('✅ [数据加载] API响应:', res);
					console.log('📦 [数据加载] res.code:', res?.code);
					console.log('📦 [数据加载] res.data:', res?.data);
					
					uni.hideLoading();
					this.isLoadingData = false;

					// 尝试多种数据格式
					let dataList = [];
					
					if (res && res.code === "0" && res.data) {
						// 格式1: res.data.data.data
						if (res.data.data && Array.isArray(res.data.data.data)) {
							dataList = res.data.data.data;
							console.log('📋 [数据加载] 格式1 - 数据列表长度:', dataList.length);
						}
						// 格式2: res.data.data
						else if (Array.isArray(res.data.data)) {
							dataList = res.data.data;
							console.log('📋 [数据加载] 格式2 - 数据列表长度:', dataList.length);
						}
						// 格式3: res.data
						else if (Array.isArray(res.data)) {
							dataList = res.data;
							console.log('📋 [数据加载] 格式3 - 数据列表长度:', dataList.length);
						}
						
						if (dataList.length > 0) {
							const formattedData = this.formatAppointmentData(dataList);
							console.log('✨ [数据加载] 格式化后数据长度:', formattedData.length);
							this.originalList = formattedData;
							this.reservationList = [...formattedData];
							
							// 存储数据到storage供dataList页面使用
							try {
								uni.setStorageSync('searchResultData', formattedData);
								console.log('💾 [数据加载] 数据已存储到storage');
							} catch (e) {
								console.error('❌ [数据加载] 存储数据失败:', e);
							}
							
							this.updateFilterCounts();
							this.sortByLatestTime();
							console.log('🎉 [数据加载] 数据加载完成，originalList长度:', this.originalList.length);
						} else {
							console.warn('⚠️ [数据加载] 没有找到数据');
							uni.showToast({
								title: '没有找到预约记录',
								icon: 'none',
								duration: 2000
							});
						}
					} else {
						console.error('❌ [数据加载] API响应格式异常');
						uni.showToast({
							title: 'API返回数据格式异常',
							icon: 'none',
							duration: 2000
						});
					}

					uni.hideLoading();
					this.isLoadingData = false;
				})
				.catch(err => {
					uni.hideLoading();
					this.isLoadingData = false;
					uni.showToast({
						title: '加载数据失败，请重试',
						icon: 'none',
						duration: 2000
					});
					return Promise.reject(err);
				});
		},

		// 管家查询所有预约数据
		loadAppointmentDataForManager() {
			const userInfo = uni.getStorageSync('userInfo');
			let managerCommunity = '';
			
			if (userInfo) {
				if (userInfo.community) {
					managerCommunity = userInfo.community;
				} else if (userInfo.userInfo && userInfo.userInfo.community) {
					managerCommunity = userInfo.userInfo.community;
				} else if (userInfo.managerData && userInfo.managerData.community) {
					managerCommunity = userInfo.managerData.community;
				} else if (userInfo.yardName) {
					managerCommunity = userInfo.yardName;
				} else if (userInfo.userInfo && userInfo.userInfo.yardName) {
					managerCommunity = userInfo.userInfo.yardName;
				}
			}

			this.currentManagerCommunity = managerCommunity;
			this.originalList = [];
			this.reservationList = [];

			return appointmentAPI.getList()
				.then(res => {
					if (res && (res.code === "0" || res.code === 0 || res.success === true)) {
						let dataArray = [];

						if (res.data && res.data.data && Array.isArray(res.data.data)) {
							dataArray = res.data.data.data;
						} else if (res.data && Array.isArray(res.data)) {
							dataArray = res.data.data;
						} else if (Array.isArray(res)) {
							dataArray = res;
						} else {
							dataArray = res.data.data.data || [];
						}

						const formattedData = this.formatAppointmentData(dataArray);

						let filteredData = formattedData;
						if (managerCommunity) {
							filteredData = formattedData.filter(item => {
								const itemCommunity = (item.community || '').trim();
								const targetCommunity = managerCommunity.trim();
								return itemCommunity === targetCommunity;
							});
						}

						this.originalList = filteredData;
						this.reservationList = [...filteredData];
						this.updateFilterCounts();
						this.sortByLatestTime();
					}

					uni.hideLoading();
					this.isLoadingData = false;
					return Promise.resolve();
				})
				.catch(err => {
					uni.hideLoading();
					this.isLoadingData = false;
					uni.showToast({
						title: '加载数据失败，请重试',
						icon: 'none',
						duration: 2000
					});
				});
		},

		// 格式化API返回的预约数据
		formatAppointmentData(apiData) {
			if (!Array.isArray(apiData)) {
				return [];
			}

			return apiData.map(item => {
			return {
				time: item.recorddate || item.visitdate || '',
				name: item.visitorname || '',  // 仅用于向后兼容，实际应使用visitorName
				phone: item.visitorphone || '',  // 仅用于向后兼容，实际应使用单独字段
				plateNumber: item.platenumber || '',
				status: this.mapApiStatus(item.auditstatus),
				addressDetail: this.formatAddress(item),
				entryTime: item.arrivedate || '',
				leaveTime: item.leavedate || '',
				vehicleStatus: this.getVehicleStatus(item),
				id: item.id || '',
				community: item.community || '',
				building: item.building || '',
				units: item.units || '',
				room: item.room || '',
				floor: item.floor || '',
				visitReason: item.visitreason || '',
				appointType: item.appointtype || '',
				refuseReason: item.refusereason || '',
				venueStatus: item.venuestatus || '',
				orderNumber: item.ordernumber || '',
				// 独立字段 - 不再混用
				ownerPhone: item.ownerphone || '',
				visitorName: item.visitorname || '',
				ownerName: item.ownername || ''
			};
		});
		},

		// 将API状态映射为页面状态
		mapApiStatus(status) {
			if (!status) return '待审核';

			const statusMap = {
				'0': '待审核',
				'1': '已通过',
				'2': '未通过',
				'待审核': '待审核',
				'已通过': '已通过',
				'未通过': '未通过',
				'已审核': '已通过'
			};

			return statusMap[status] || status;
		},

		// 格式化地址信息
		formatAddress(item) {
			if (item.addressDetail) return item.addressDetail;
			if (item.address) return item.address;
			if (item.address_detail) return item.address_detail;

			let address = '';

			if (item.community) {
				address += item.community;
			}

			if (item.building || item.buildingNo || item.building_no) {
				const building = item.building || item.buildingNo || item.building_no;
				address += (address ? ' ' : '') + building + '栋';
			}

			if (item.units || item.unit) {
				const unit = item.units || item.unit;
				address += unit + '单元';
			}

			if (item.floor) {
				address += item.floor + '层';
			}

			if (item.room || item.roomNo || item.room_no) {
				const room = item.room || item.roomNo || item.room_no;
				address += room + '号';
			}

			return address.trim() || '未知地址';
		},

		// 获取车辆状态
		getVehicleStatus(item) {
			if (item.venuestatus) {
				return item.venuestatus;
			}

			if (item.arrivedate && item.leavedate) {
				return '已离场';
			} else if (item.arrivedate) {
				return '已进场';
			} else {
				return '未进场';
			}
		},
		
		// TabBar切换事件处理
		onTabChange(tabInfo) {
			// TabBar切换处理逻辑
		},

		// 强制隐藏系统TabBar
		hideSystemTabBar() {
			try {
				if (uni.hideTabBar) {
					uni.hideTabBar({
						animation: false
					});
				}
			} catch (error) {
				// 忽略错误
			}
		},
		
		clearSearch() {
			this.searchKeyword = '';
		},
		
		// 处理清空搜索框事件（从 dataList 返回时）
		handleClearSearchKeyword() {
			console.log('🔄 [searchResult] 接收到清空搜索框事件');
			this.searchKeyword = '';
			this.showSuggestions = false;
			this.searchSuggestions = [];
			this.hasPerformedSearch = false;
		},
		
		saveSearchHistory(keyword) {
			if (!keyword || !keyword.trim()) return;
			
			try {
				const trimmedKeyword = keyword.trim();
				// 从storage读取现有历史
				let history = uni.getStorageSync('search_history') || [];
				
				// 检查是否已存在
				const existingIndex = history.findIndex(item => item.keyword === trimmedKeyword);
				
				if (existingIndex !== -1) {
					// 已存在，更新计数和时间
					history[existingIndex].count = (history[existingIndex].count || 1) + 1;
					history[existingIndex].time = Date.now();
					// 移到最前面
					const item = history.splice(existingIndex, 1)[0];
					history.unshift(item);
				} else {
					// 不存在，添加新记录
					history.unshift({
						keyword: trimmedKeyword,
						type: 'keyword',
						time: Date.now(),
						count: 1
					});
				}
				
				// 限制历史记录数量为20条
				if (history.length > 20) {
					history = history.slice(0, 20);
				}
				
				// 保存到storage
				uni.setStorageSync('search_history', history);
				this.searchHistory = history;
				
				// 更新热门搜索标签
				this.updateHotSearchTags();
			} catch (error) {
				console.error('保存搜索历史失败:', error);
			}
		},
		
		// 初始化语音识别管理器
		initVoiceManager() {
			if (this.voiceManager) return;
			
			try {
				this.voiceManager = plugin.getRecordRecognitionManager();
				
				// 开始录音回调
				this.voiceManager.onStart = (res) => {
					console.log('✅ 开始录音识别', res);
					this.isRecording = true;
					uni.showToast({
						title: '请说话...',
						icon: 'none',
						duration: 30000,
						mask: true
					});
				};
				
				// 识别结束回调
				this.voiceManager.onStop = (res) => {
					console.log('✅ 识别结果:', res.result);
					this.isRecording = false;
					uni.hideToast();
					
					if (res.result) {
						// 将识别结果填入搜索框
						this.searchKeyword = res.result;
						// 触发搜索建议
						this.handleSearchInput({
							detail: {
								value: res.result
							}
						});
						
						uni.showToast({
							title: '识别成功: ' + res.result,
							icon: 'success',
							duration: 1500
						});
					} else {
						uni.showToast({
							title: '未识别到内容，请重试',
							icon: 'none',
							duration: 1500
						});
					}
				};
				
				// 识别错误回调
				this.voiceManager.onError = (res) => {
					console.error('❌ 录音识别错误:', res);
					this.isRecording = false;
					uni.hideToast();
					
					const errorMsg = {
						'1000': '未授权麦克风权限',
						'1001': '录音失败',
						'1002': '识别失败',
						'1003': '网络错误',
						'1004': '未检测到语音',
						'1005': '录音时间太短',
						'1006': '识别超时'
					};
					
					// 如果是权限问题，引导用户授权
					if (res.msg === '1000') {
						uni.showModal({
							title: '需要麦克风权限',
							content: '请在设置中允许小程序使用麦克风进行语音搜索',
							confirmText: '去设置',
							cancelText: '取消',
							success: (modalRes) => {
								if (modalRes.confirm) {
									uni.openSetting();
								}
							}
						});
					} else {
						uni.showToast({
							title: errorMsg[res.msg] || '识别失败，请重试',
							icon: 'none',
							duration: 2000
						});
					}
				};
				
				// 实时识别结果回调（可选，提供更好的用户体验）
				this.voiceManager.onRecognize = (res) => {
					console.log('🎤 实时识别:', res.result);
					// 可以实时更新搜索框内容
					if (res.result) {
						this.searchKeyword = res.result;
					}
				};
				
				console.log('✅ 语音识别管理器初始化成功');
			} catch (error) {
				console.error('❌ 初始化语音识别管理器失败:', error);
				uni.showToast({
					title: '语音功能初始化失败',
					icon: 'none',
					duration: 2000
				});
			}
		},
		
		// 开始语音搜索
		startVoiceSearch() {
			// 如果正在录音，停止录音
			if (this.isRecording) {
				this.stopVoiceSearch();
				return;
			}
			
			// 确保管理器已初始化
			if (!this.voiceManager) {
				this.initVoiceManager();
			}
			
			if (!this.voiceManager) {
				uni.showToast({
					title: '语音功能不可用',
					icon: 'none',
					duration: 2000
				});
				return;
			}
			
			try {
				// 开始录音识别
				this.voiceManager.start({
					duration: 30000,  // 最长录音时间30秒
					lang: 'zh_CN'     // 语言：简体中文
				});
			} catch (error) {
				console.error('❌ 启动录音失败:', error);
				uni.showToast({
					title: '启动录音失败',
					icon: 'none',
					duration: 2000
				});
			}
		},
		
		// 停止语音搜索
		stopVoiceSearch() {
			if (this.isRecording && this.voiceManager) {
				try {
					this.voiceManager.stop();
				} catch (error) {
					console.error('❌ 停止录音失败:', error);
				}
			}
		},
		
		handleSearchInput(e) {
			this.searchKeyword = e.detail.value
			if (this.searchKeyword && this.searchKeyword.trim()) {
				this.generateSearchSuggestions()
				this.showSuggestions = true
			} else {
				this.showSuggestions = false
			}
		},
		
		generateSearchSuggestions() {
			const keyword = this.searchKeyword.toLowerCase()
			console.log(' [搜索建议] 关键词:', keyword)
			console.log(' [搜索建议] originalList长度:', this.originalList ? this.originalList.length : 0)
			if (!this.originalList || this.originalList.length === 0) {
				console.warn(' [搜索建议] originalList为空，无法生成建议')
				this.searchSuggestions = []
				return
			}
			const suggestions = this.originalList
				.filter(item => {
					return (
						(item.plateNumber && item.plateNumber.toLowerCase().includes(keyword)) ||
						(item.name && item.name.toLowerCase().includes(keyword)) ||
						(item.phone && item.phone.includes(keyword)) ||
						(item.addressDetail && item.addressDetail.toLowerCase().includes(keyword))
					)
				})
				.map(item => {
					let text = ''
					let type = 'default'
					
					if (item.plateNumber && item.plateNumber.toLowerCase().includes(keyword)) {
						text = item.plateNumber
						type = 'plate'
					} else if (item.name && item.name.toLowerCase().includes(keyword)) {
						text = item.name
						type = 'name'
					} else if (item.phone && item.phone.includes(keyword)) {
						text = item.phone
						type = 'phone'
					} else if (item.addressDetail && item.addressDetail.toLowerCase().includes(keyword)) {
						text = item.addressDetail
						type = 'address'
					}
					
					return { text, type }
				})
			console.log(' [搜索建议] 找到匹配项:', suggestions.length)
			const uniqueMap = new Map()
			suggestions.forEach(suggestion => {
				if (!uniqueMap.has(suggestion.text)) {
					uniqueMap.set(suggestion.text, suggestion)
				}
			})
			this.searchSuggestions = Array.from(uniqueMap.values()).slice(0, 5)
			console.log(' [搜索建议] 去重后数量:', this.searchSuggestions.length)
		},
		
		selectSuggestionByIndex(index) {
			if (this.searchSuggestions[index]) {
				this.searchKeyword = this.searchSuggestions[index].text
				this.handleSearchConfirm()
				this.showSuggestions = false
			}
		},
		
		getSuggestionIcon(type) {
			const icons = {
				plate: '🚗',
				name: '👤',
				phone: '📱',
				address: '📍',
				default: '🔍'
			}
			return icons[type] || icons.default
		},
		
		getSuggestionIconColor(type) {
			const colors = {
				plate: '#409EFF',
				name: '#67C23A',
				phone: '#E6A23C',
				address: '#F56C6C',
				default: '#909399'
			}
			return colors[type] || colors.default
		},
		
		getSuggestionTypeText(type) {
			const texts = {
				plate: '车牌号',
				name: '姓名',
				phone: '手机号',
				address: '地址',
				default: '搜索'
			}
			return texts[type] || texts.default
		},
		
		handleSearchFocus() {
			this.searchInputFocus = true
			if (this.searchKeyword && this.searchKeyword.trim()) {
				// 🐛 修复：获得焦点时重新生成搜索建议，确保建议内容与输入框内容匹配
				this.generateSearchSuggestions()
				this.showSuggestions = true
			}
		},
		
		handleSearchBlur() {
			// 延迟隐藏，确保点击建议项能够触发
			setTimeout(() => {
				this.searchInputFocus = false
				this.showSuggestions = false
			}, 200)
		},
		
		handleTouchStart() {
			// 标记用户正在交互，阻止blur事件隐藏建议框
			this.userInteracting = true
		},
		
		handleTouchEnd() {
			// 触摸结束后重置交互标记
			setTimeout(() => {
				this.userInteracting = false
			}, 100)
		},
		
		loadSearchHistory() {
			try {
				const history = uni.getStorageSync('search_history');
				if (history && Array.isArray(history) && history.length > 0) {
					this.searchHistory = history;
					this.showSearchHistory = true;
					this.showHotSearch = false; // 有历史记录时隐藏热门搜索
					this.updateHotSearchTags();
				} else {
					this.searchHistory = [];
					this.showSearchHistory = false;
					this.showHotSearch = true; // 无历史记录时显示热门搜索
				}
			} catch (error) {
				console.error('加载搜索历史失败:', error);
				this.searchHistory = [];
				this.showSearchHistory = false;
				this.showHotSearch = true;
			}
		},
		
		clearSearchHistory() {
			uni.showModal({
				title: '清空历史',
				content: '确定要清空所有搜索历史吗？',
				success: (res) => {
					if (res.confirm) {
						try {
							uni.removeStorageSync('search_history');
							this.searchHistory = [];
							this.showSearchHistory = false;
							this.hotSearchTags = [];
							uni.showToast({
								title: '已清空',
								icon: 'success'
							});
						} catch (error) {
							console.error('清空搜索历史失败:', error);
						}
					}
				}
			});
		},
		
		useHistorySearch(item) {
			if (!item || !item.keyword) return;
			this.searchKeyword = item.keyword;
			this.handleSearchConfirm();
		},
		
		toggleSearchHistory() {
			this.searchHistoryExpanded = !this.searchHistoryExpanded;
		},
		
		removeSearchHistory(index) {
			try {
				this.searchHistory.splice(index, 1);
				uni.setStorageSync('search_history', this.searchHistory);
				if (this.searchHistory.length === 0) {
					this.showSearchHistory = false;
				}
				this.updateHotSearchTags();
			} catch (error) {
				console.error('删除搜索历史失败:', error);
			}
		},
		
		getHistoryIcon(type) {
			const icons = {
				keyword: '🔍',
				plate: '🚗',
				name: '👤',
				phone: '📱',
				address: '📍'
			};
			return icons[type] || icons.keyword;
		},
		
		formatHistoryTime(timestamp) {
			if (!timestamp) return '';
			const now = Date.now();
			const diff = now - timestamp;
			const minutes = Math.floor(diff / 60000);
			const hours = Math.floor(diff / 3600000);
			const days = Math.floor(diff / 86400000);
			
			if (minutes < 1) return '刚刚';
			if (minutes < 60) return `${minutes}分钟前`;
			if (hours < 24) return `${hours}小时前`;
			if (days < 7) return `${days}天前`;
			return dayjs(timestamp).format('MM-DD');
		},
		
		updateHotSearchTags() {
			if (!this.searchHistory || this.searchHistory.length === 0) {
				this.hotSearchTags = [];
				return;
			}
			
			// 按搜索次数排序，取前5个
			const sorted = [...this.searchHistory]
				.sort((a, b) => (b.count || 1) - (a.count || 1))
				.slice(0, 5);
			
			this.hotSearchTags = sorted.map(item => ({
				text: item.keyword,
				count: item.count || 1
			}));
		},
		
		selectHotTag(tag) {
			if (!tag || !tag.text) return;
			this.searchKeyword = tag.text;
			this.handleSearchConfirm();
		},
		
		updateFilterCounts() {
			// 更新筛选器计数（可选实现）
		},
		
		sortByLatestTime() {
			if (!this.reservationList || !Array.isArray(this.reservationList)) {
				return;
			}
			this.reservationList.sort((a, b) => {
				return this.parseDate(b.time) - this.parseDate(a.time);
			});
		},
		
		isToday(dateStr) {
			if (!dateStr) return false;
			const date = this.parseDate(dateStr);
			const today = new Date();
			return date.toDateString() === today.toDateString();
		},
		
		isYesterday(dateStr) {
			if (!dateStr) return false;
			const date = this.parseDate(dateStr);
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);
			return date.toDateString() === yesterday.toDateString();
		},
		
		isWithinDays(dateStr, days) {
			if (!dateStr) return false;
			const date = this.parseDate(dateStr);
			const now = new Date();
			const diffTime = now - date;
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
			return diffDays <= days;
		},
		
		triggerNavigateToParking() {
			// 触发导航事件（可选实现）
		},
		
		getStatusColor(status) {
			const colorMap = {
				'已进场': '#4CAF50',
				'已离场': '#FF9800',
				'未进场': '#2196F3'
			}
			return colorMap[status] || '#F44336'
		},
		// 车辆状态类型映射
		vehicleStatusType(status) {
			const map = {
				'已进场': 'success',
				'已离场': 'warning',
				'未进场': 'info'
			}
			return map[status] || 'error'
		},

		// 获取时间标签样式
		getTimeTagStyle(tag) {
			const isActive = this.selectedTimeTag === tag;
			return {
				backgroundColor: isActive ? '#e8f4ff' : '#fff',
				color: isActive ? '#2979ff' : '#606266',
				borderColor: isActive ? '#2979ff' : '#dcdfe6',
				fontSize: '24rpx',
				padding: '6rpx 20rpx',
				marginRight: '12rpx',
				marginBottom: '12rpx',
				fontWeight: isActive ? 'bold' : 'normal'
			}
		},
		// 管家角色统计方法
		getStatusCount(status) {
			return this.originalList.filter(item => item.status === status).length;
		},
		getVehicleStatusCount(status) {
			return this.originalList.filter(item =>
				item.status === '已通过' && item.vehicleStatus === status
			).length;
		},
		getTodayStatusCount(status) {
			if (!this.originalList || !Array.isArray(this.originalList)) {
				return 0;
			}
			return this.originalList.filter(item =>
				this.isToday(item.time) && item.status === status
			).length;
		},
		getTodayVehicleStatusCount(status) {
			if (!this.originalList || !Array.isArray(this.originalList)) {
				return 0;
			}
			return this.originalList.filter(item =>
				this.isToday(item.time) && item.status === '已通过' && item.vehicleStatus === status
			).length;
		},
		getCurrentDate() {
			return dayjs().format('YYYY-MM-DD');
		},
		refreshStatistics() {
			// 可以在这里添加刷新数据的逻辑
			uni.showToast({
				title: '统计数据已刷新',
				icon: 'success'
			});
		},
		// 用户角色统计方法
		getUserStatusCount(status) {
			if (!this.originalList || !Array.isArray(this.originalList)) {
				return 0;
			}
			return this.originalList.filter(item => item.status === status).length;
		},
		getUserStatusPercentage(status) {
			const count = this.getUserStatusCount(status);
			const total = this.originalList ? this.originalList.length : 1; // 避免除以0
			return Math.round((count / total) * 100);
		},
		getUserVehicleStatusCount(status) {
			if (!this.originalList || !Array.isArray(this.originalList)) {
				return 0;
			}
			return this.originalList.filter(item =>
				item.status === '已通过' && item.vehicleStatus === status
			).length;
		},
		hasApprovedReservations() {
			if (!this.originalList || !Array.isArray(this.originalList)) {
				return false;
			}
			return this.originalList.some(item => item.status === '已通过');
		},
		calculateAverageDuration() {
			if (!this.originalList || !Array.isArray(this.originalList)) {
				return '-';
			}
			const completedTrips = this.originalList.filter(item =>
				item.status === '已通过' && item.vehicleStatus === '已离场' && item.entryTime && item.leaveTime
			);

			if (completedTrips.length === 0) return '-';

			const totalMinutes = completedTrips.reduce((sum, item) => {
				return sum + dayjs(item.leaveTime).diff(dayjs(item.entryTime), 'minute');
			}, 0);

			const avgMinutes = Math.round(totalMinutes / completedTrips.length);
			const hours = Math.floor(avgMinutes / 60);
			const minutes = avgMinutes % 60;

			return hours > 0 ? `${hours}小时${minutes}分钟` : `${minutes}分钟`;
		},
		getNextReservation() {
			if (!this.originalList || !Array.isArray(this.originalList)) {
				return null;
			}
			const now = new Date();
			const futureReservations = this.originalList.filter(item =>
				this.parseDate(item.time) > now
			).sort((a, b) => this.parseDate(a.time) - this.parseDate(b.time));

			return futureReservations.length > 0 ? futureReservations[0] : null;
		},
		// 计算今日数据占总数据的百分比
		getTodayPercentage() {
			const todayCount = this.getTodayCount();
			const totalCount = this.originalList.length || 1; // 避免除以0
			return Math.round((todayCount / totalCount) * 100);
		},
		// 按预约时间排序（最晚优先），有停车时长的按停车时长倒序二级排序

		// === 车牌相关方法 ===
		// 判断是否是新能源车牌（8位数字符）
		isNewEnergyPlate(plateNumber) {
			return plateNumber && plateNumber.length === 8
		},

		// 获取车牌样式类名
		getPlateClass(plateNumber) {
			return this.isNewEnergyPlate(plateNumber) ? 'green-plate' : 'blue-plate'
		},

		// 获取车辆状态样式类名
		getVehicleStatusClass(status) {
			const classMap = {
				'已进场': 'status-entered',
				'已离场': 'status-exited',
				'未进场': 'status-pending'
			}
			return classMap[status] || 'status-pending'
		},

		// === 数据统计方法 ===
		// 获取今日数量
		getTodayCount() {
			// 🐛 修复：增强数据验证，确保统计准确
			if (!this.originalList || !Array.isArray(this.originalList) || this.originalList.length === 0) {
				console.warn('⚠️ [统计] originalList为空或无效，今日数量为0');
				return 0;
			}
			try {
				const today = new Date().toDateString();
				const count = this.originalList.filter(item => {
					if (!item || !item.time) return false;
					const itemDate = this.parseDate(item.time).toDateString();
					return itemDate === today;
				}).length;
				console.log('📊 [统计] 今日数量:', count, '/ 总数:', this.originalList.length);
				return count;
			} catch (error) {
				console.error('❌ [统计] 计算今日数量失败:', error);
				return 0;
			}
		},

		// 获取今日趋势
		getTodayTrend() {
			if (!this.originalList || !Array.isArray(this.originalList)) {
				return '0%';
			}

			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);
			const yesterdayStr = yesterday.toDateString();

			const yesterdayCount = this.originalList.filter(item => {
				const itemDate = this.parseDate(item.time).toDateString();
				return itemDate === yesterdayStr;
			}).length;

			const todayCount = this.getTodayCount();
			if (yesterdayCount === 0) return todayCount > 0 ? '+100%' : '0%';

			const percent = Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100);
			// 如果是负数，不显示
			if (percent < 0) return '';
			return percent > 0 ? `+${percent}%` : '0%';
		},
		// 获取在场车辆数量（已进场且未离场）
		getInParkingCount() {
			if (!this.originalList || !Array.isArray(this.originalList)) {
				return 0;
			}
			return this.originalList.filter(item =>
				item.status === '已通过' &&
				(item.vehicleStatus === '已进场' || item.vehicleStatus === '已入场')
			).length;
		},

		// 获取未入场车辆数量
		getNotEnteredCount() {
			if (!this.originalList || !Array.isArray(this.originalList)) {
				return 0;
			}
			return this.originalList.filter(item =>
				item.status === '已通过' &&
				(item.vehicleStatus === '未进场' || item.vehicleStatus === '待进场' ||
					item.vehicleStatus === '待入场' || item.vehicleStatus === '未入场' ||
					!item.vehicleStatus)
			).length;
		},

		// 获取今日未入场车辆数量
		getTodayNotEnteredCount() {
			if (!this.originalList || !Array.isArray(this.originalList)) {
				return 0;
			}
			const today = new Date().toDateString();
			return this.originalList.filter(item => {
				const itemDate = this.parseDate(item.time).toDateString();
				return itemDate === today &&
					item.status === '已通过' &&
					(item.vehicleStatus === '未进场' || item.vehicleStatus === '待进场' ||
						item.vehicleStatus === '待入场' || item.vehicleStatus === '未入场' ||
						!item.vehicleStatus);
			}).length;
		},

		// 获取今日离场车辆数量
		getExitedTodayCount() {
			if (!this.originalList || !Array.isArray(this.originalList)) {
				return 0;
			}
			const today = new Date().toDateString();
			return this.originalList.filter(item => {
				// 如果有实际离场时间，使用离场时间判断
				if (item.leaveTime || item.actualExitTime) {
					const leaveTime = item.leaveTime || item.actualExitTime;
					const exitDate = this.parseDate(leaveTime).toDateString();
					return exitDate === today &&
						(item.vehicleStatus === '已离场' || item.vehicleStatus === '已出场');
				}
				// 如果没有离场时间，但状态是已离场，使用预约时间判断
				const itemDate = this.parseDate(item.time).toDateString();
				return itemDate === today &&
					(item.vehicleStatus === '已离场' || item.vehicleStatus === '已出场');
			}).length;
		},

		// 获取审批通过率
		getApprovalRate() {
			if (!this.originalList || !Array.isArray(this.originalList)) {
				return 0;
			}
			const total = this.originalList.length;
			if (total === 0) return 0;
			const approved = this.originalList.filter(item => item.status === '已通过').length;
			return Math.round((approved / total) * 100);
		},

		// 获取入场率（已通过预约中实际入场的比例）
		getEntryRate() {
			if (!this.originalList || !Array.isArray(this.originalList)) {
				return 0;
			}
			const approvedList = this.originalList.filter(item => item.status === '已通过');
			if (approvedList.length === 0) return 0;

			const enteredCount = approvedList.filter(item =>
				item.vehicleStatus === '已进场' || item.vehicleStatus === '已入场' ||
				item.vehicleStatus === '已离场' || item.vehicleStatus === '已出场'
			).length;

			return Math.round((enteredCount / approvedList.length) * 100);
		},

		// === 筛选器方法 ===
		// 更新筛选器计数
		updateFilterCounts() {
			if (!this.originalList || !Array.isArray(this.originalList)) {
				return;
			}

			// 更新时间筛选计数
			if (this.timeFilterOptions && Array.isArray(this.timeFilterOptions)) {
				this.timeFilterOptions.forEach(option => {
					if (option.key !== 'all') {
						option.count = this.getTimeFilterCount(option.key);
					}
				});
			}

			// 更新状态筛选计数
			if (this.statusFilterOptions && Array.isArray(this.statusFilterOptions)) {
				this.statusFilterOptions.forEach(option => {
					if (option.key === 'all') {
						option.count = this.originalList.length;
					} else {
						option.count = this.getStatusFilterCount(option.key);
					}
				});
			}

			// 更新车辆状态筛选计数
			if (this.vehicleFilterOptions && Array.isArray(this.vehicleFilterOptions)) {
				this.vehicleFilterOptions.forEach(option => {
					if (option.key === 'all') {
						option.count = this.originalList.length; // 显示所有记录的数量
					} else {
						option.count = this.getVehicleFilterCount(option.key);
					}
				});
			}
		},

		// 获取时间筛选计数
		getTimeFilterCount(timeKey) {
			if (!this.originalList || !Array.isArray(this.originalList)) {
				return 0;
			}

			const now = new Date();
			return this.originalList.filter(item => {
				const itemDate = this.parseDate(item.time);

				switch (timeKey) {
					case 'today':
						return itemDate.toDateString() === now.toDateString();
					case 'yesterday':
						const yesterday = new Date(now);
						yesterday.setDate(yesterday.getDate() - 1);
						return itemDate.toDateString() === yesterday.toDateString();
					case 'recent3':
						const threeDaysAgo = new Date(now);
						threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
						return itemDate >= threeDaysAgo;
					case 'thisWeek':
						const weekStart = new Date(now);
						weekStart.setDate(weekStart.getDate() - now.getDay());
						return itemDate >= weekStart;
					default:
						return true;
				}
			}).length;
		},

		// 获取状态筛选计数
		getStatusFilterCount(statusKey) {
			if (!this.originalList || !Array.isArray(this.originalList)) {
				return 0;
			}

			return this.originalList.filter(item => {
				switch (statusKey) {
					case 'pending':
						return item.status === '待审核' || item.status === '待审批';
					case 'approved':
						return item.status === '已通过';
					case 'rejected':
						return item.status === '未通过' || item.status === '已拒绝';
					default:
						return false;
				}
			}).length;
		},

		// 获取车辆状态筛选计数
		getVehicleFilterCount(vehicleKey) {
			if (!this.originalList || !Array.isArray(this.originalList)) {
				return 0;
			}

			return this.originalList.filter(item => {
				if (item.status !== '已通过') return false;

				// 根据vehicleKey匹配不同的车辆状态
				switch (vehicleKey) {
					case 'entered':
						return item.vehicleStatus === '已进场' || item.vehicleStatus === '已入场';
					case 'exited':
						return item.vehicleStatus === '已离场' || item.vehicleStatus === '已出场';
					case 'notEntered':
						return item.vehicleStatus === '未进场' || item.vehicleStatus === '待进场' ||
							item.vehicleStatus === '待入场' || item.vehicleStatus === '未入场' ||
							!item.vehicleStatus;
					default:
						return false;
				}
			}).length;
		},

		// 选择时间筛选
		selectTimeFilter(timeKey) {
			this.selectedTimeFilter = timeKey;

			// 如果选择"全部"，则重置筛选状态，返回欢迎界面
			if (timeKey === 'all') {
				this.isFiltering = false;
				// 恢复原始数据
				this.reservationList = [...this.originalList];
				// 重新排序
				this.sortByLatestTime();
				// 重置搜索状态，强制返回欢迎界面
				this.hasPerformedSearch = false;
				// 重置搜索关键词
				this.searchKeyword = '';
			} else {
				this.isFiltering = true;
			}
		},

		// 选择状态筛选
		selectStatusFilter(statusKey) {
			this.selectedStatusFilter = statusKey;

			// 如果选择"全部"，则重置筛选状态，返回欢迎界面
			if (statusKey === 'all') {
				this.isFiltering = false;
				// 恢复原始数据
				this.reservationList = [...this.originalList];
				// 重新排序
				this.sortByLatestTime();
				// 重置搜索状态，强制返回欢迎界面
				this.hasPerformedSearch = false;
				// 重置搜索关键词
				this.searchKeyword = '';
			} else {
				this.isFiltering = true;
			}
		},

		// 选择车辆状态筛选
		selectVehicleFilter(vehicleKey) {
			// 只设置选中的车辆状态，不立即执行筛选
			this.selectedVehicleFilter = vehicleKey;
			// 注意：筛选将在点击"应用筛选"按钮时执行
		},


		// === 新增方法：欢迎界面相关 ===
		// 显示全部数据功能 - 跳转到数据列表页
		async showAdvancedFeatures() {
			// 检查originalList是否有效
			if (!this.originalList || this.originalList.length === 0) {
				console.warn('⚠️ [全部数据] originalList为空，重新加载数据');
				uni.showToast({
					title: '数据加载中，请稍候...',
					icon: 'loading',
					duration: 1500
				});
				
				// 等待数据加载完成
				await this.loadAppointmentData();
				
				// 数据加载完成后检查是否有数据
				if (!this.originalList || this.originalList.length === 0) {
					uni.showToast({
						title: '暂无数据',
						icon: 'none',
						duration: 2000
					});
					return;
				}
			}

			// 保存数据到storage供dataList页面使用
			uni.setStorageSync('searchResultData', this.originalList);

			// 跳转到数据列表页
			uni.navigateTo({
				url: '/pagesA/reservation/dataList/dataList'
			});
		},



		// 显示今日预约数据 - 跳转到数据列表页（基于time字段）
		showTodayAppointment() {
			// 保存数据到storage供dataList页面使用
			uni.setStorageSync('searchResultData', this.originalList);

			// 跳转到数据列表页（dataList页面会自动应用今日筛选）
			uni.navigateTo({
				url: '/pagesA/reservation/dataList/dataList?filter=today'
			});
		},

		// 显示今日来访数据 - 跳转到数据列表页（基于recorddate字段）
		showTodayVisit() {
			// 保存数据到storage供dataList页面使用
			uni.setStorageSync('searchResultData', this.originalList);

			// 跳转到数据列表页，传递visitdate筛选参数
			uni.navigateTo({
				url: '/pagesA/reservation/dataList/dataList?filter=todayVisit'
			});
		},

		// 获取今日来访数量（基于recorddate字段）
		getTodayVisitCount() {
			if (!this.originalList || !Array.isArray(this.originalList) || this.originalList.length === 0) {
				return 0;
			}
			try {
				const today = new Date().toDateString();
				const count = this.originalList.filter(item => {
					if (!item || !item.entryTime) return false;
					const itemDate = this.parseDate(item.entryTime).toDateString();
					return itemDate === today;
				}).length;
				return count;
			} catch (error) {
				console.error('❌ [统计] 计算今日来访数量失败:', error);
				return 0;
			}
		},

		// 返回上一页
		backToWelcome() {
			// 使用uni.navigateBack()返回上一页
			uni.navigateBack({
				delta: 1
			});
		},

		// 智能搜索区域的返回按钮点击事件
		navigateBack() {
			// 如果当前显示的是功能界面，则返回到欢迎界面
			if (!this.showWelcomeInterface) {
				// 🐛 修复：先保存originalList的引用，避免在重置过程中丢失
				const savedOriginalList = this.originalList || [];
				console.log('🔙 [返回操作] 保存的原始数据量:', savedOriginalList.length);

				// 重置搜索相关状态
				this.searchKeyword = '';
				this.hasPerformedSearch = false;
				this.currentStatFilter = null;
				this.selectedTimeRange = null;
				this.selectedSortOrder = 'desc';

				// 🐛 修复：确保originalList不会被清空
				if (savedOriginalList.length > 0) {
					this.originalList = savedOriginalList;
				}

				// 重置所有筛选状态
				this.resetAllFilters();

				// 重置搜索历史和热搜状态
				if (this.showSearchHistory) {
					this.showSearchHistory = false;
					this.showHotSearch = true;
				}
				this.showSuggestions = false;

				console.log('✅ [返回操作] 当前数据量:', this.reservationList.length);
			} else {
				// 如果当前显示的是欢迎界面，则正常返回上一页
				uni.navigateBack({
					delta: 1
				});
			}
		},

		// === 键盘监听相关方法 ===
		// 初始化键盘监听
		initKeyboardListeners() {
			// #ifdef H5
			// H5环境下监听resize事件来检测键盘
			this.handleResize = () => {
				const currentHeight = window.innerHeight;
				const screenHeight = window.screen.height;
				const heightDiff = screenHeight - currentHeight;

				if (heightDiff > 150) {
					// 键盘弹出
					this.keyboardHeight = heightDiff;
					this.adjustSuggestionPosition();
				} else {
					// 键盘隐藏
					this.keyboardHeight = 0;
				}
			};

			window.addEventListener('resize', this.handleResize);
			// #endif

			// #ifdef MP-WEIXIN
			// 微信小程序监听键盘高度变化
			uni.onKeyboardHeightChange((res) => {
				this.keyboardHeight = res.height;
				if (res.height > 0) {
					this.adjustSuggestionPosition();
				}
			});
			// #endif

			// #ifdef APP-PLUS
			// App端监听软键盘
			uni.onKeyboardHeightChange && uni.onKeyboardHeightChange((res) => {
				this.keyboardHeight = res.height;
				if (res.height > 0) {
					this.adjustSuggestionPosition();
				}
			});
			// #endif
		},

		// 移除键盘监听
		removeKeyboardListeners() {
			// #ifdef H5
			if (this.handleResize) {
				window.removeEventListener('resize', this.handleResize);
			}
			// #endif
		},

		// 调整搜索建议位置
		adjustSuggestionPosition() {
			this.$nextTick(() => {
				try {
					const systemInfo = uni.getSystemInfoSync();
					// 如果键盘高度大于屏幕高度的40%，则调整建议框位置
					if (this.keyboardHeight > systemInfo.windowHeight * 0.4) {
						this.suggestionScrollTop = 0;
						// 为搜索建议添加特殊样式类
						const suggestionElements = document.querySelectorAll('.search-suggestions');
						suggestionElements.forEach(el => {
							el.classList.add('keyboard-active');
						});
					} else {
						// 移除特殊样式类
						const suggestionElements = document.querySelectorAll('.search-suggestions');
						suggestionElements.forEach(el => {
							el.classList.remove('keyboard-active');
						});
					}
				} catch (error) {
					// 调整位置失败处理
				}
			});
		},

		// 优化滚动视图
		optimizeScrollView() {
			try {
				// 重置滚动位置到顶部
				this.suggestionScrollTop = 0;

				// 延迟再次设置，确保scroll-view正确初始化
				setTimeout(() => {
					this.suggestionScrollTop = 1;
					setTimeout(() => {
						this.suggestionScrollTop = 0;
					}, 50);
				}, 100);

			} catch (error) {
				// 优化滚动视图失败处理
			}
		},


		// 切换搜索历史展开/收起状态
		toggleSearchHistory() {
			this.searchHistoryExpanded = !this.searchHistoryExpanded;
		},



		/**
		 * 🆕 触发导航到停车页面事件
		 */
		triggerNavigateToParking() {
			try {
				console.log('🚗 [查询页面] 触发导航到停车页面事件');
				uni.$emit('navigate-to-parking', {
					page: 'searchResult',
					hasInParkingVehicles: this.getInParkingCount() > 0,
					inParkingCount: this.getInParkingCount(),
					timestamp: new Date().getTime()
				});
			} catch (error) {
				console.error('❌ [查询页面] 触发事件失败:', error);
			}
		},



		/**
		 * 🆕 监听真实的车辆状态变化 (当从后端获取数据时)
		 */
		onVehicleStatusUpdated(oldData, newData) {
			try {
				// 检查是否有状态变化
				const hasStatusChanges = newData.some((newItem, index) => {
					const oldItem = oldData[index];
					return oldItem && oldItem.vehicleStatus !== newItem.vehicleStatus;
				});

				if (hasStatusChanges) {
					console.log('🔄 [查询页面] 检测到车辆状态变化');

					// 触发停车状态变化事件
					uni.$emit('parking-status-changed', {
						type: 'data_refresh',
						timestamp: new Date().getTime(),
						hasInParkingVehicles: this.getInParkingCount() > 0,
						inParkingCount: this.getInParkingCount()
					});
				}
			} catch (error) {
				console.error('❌ [查询页面] 处理状态变化失败:', error);
			}
		}

	}
}
</script>
<style lang="scss" scoped>
/* === 欢迎页面样式 === */

/* === 搜索建议相关样式 === */
.search-suggestions {
	position: absolute;
	top: 100%;
	left: 0;
	right: 0;
	background: #fff;
	border-radius: 12rpx;
	box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.12);
	z-index: 1000;
	margin-top: 8rpx;
	border: 1rpx solid #e8e8e8;
	overflow: hidden;

	.suggestions-scroll {
		max-height: 400rpx;
	}

	.suggestion-item {
		display: flex;
		align-items: center;
		padding: 16rpx 20rpx;
		border-bottom: 1rpx solid #f0f0f0;
		transition: all 0.3s ease;

		&:active {
			background: #f8f9ff;
		}

		&:last-child {
			border-bottom: none;
		}

		.suggestion-icon {
			width: 40rpx;
			height: 40rpx;
			border-radius: 8rpx;
			background: #f5f7fa;
			display: flex;
			align-items: center;
			justify-content: center;
			margin-right: 16rpx;

			.icon-emoji {
				font-size: 24rpx;
			}
		}

		.suggestion-content {
			flex: 1;

			.suggestion-text {
				font-size: 28rpx;
				color: #333;
				margin-bottom: 4rpx;
				display: block;
			}

			.suggestion-type {
				font-size: 22rpx;
				color: #999;
			}
		}

		.suggestion-count {
			font-size: 24rpx;
			color: #409EFF;
			font-weight: 600;
			padding: 4rpx 8rpx;
			background: rgba(64, 158, 255, 0.1);
			border-radius: 8rpx;
			margin-right: 12rpx;
		}

		.suggestion-arrow {
			color: #ccc;

			.icon-emoji {
				font-size: 20rpx;
			}
		}
	}

	.suggestions-footer {
		padding: 12rpx 20rpx;
		background: #f8f9fa;
		border-top: 1rpx solid #e8e8e8;

		.footer-text {
			font-size: 22rpx;
			color: #666;
		}
	}
}

/* 没有搜索建议时的样式 */
.no-suggestions {
	padding: 20rpx;
	text-align: center;
	background: #f8f9fa;
	border-radius: 12rpx;
	margin: 10rpx;

	.no-suggestions-content {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 8rpx;

		.no-suggestions-text {
			color: #909399;
			font-size: 28rpx;
		}
	}

	.no-suggestions-tip {
		margin-top: 8rpx;

		.tip-text {
			color: #c0c4cc;
			font-size: 24rpx;
		}
	}
}

.empty-text {
	color: #909399;
	font-size: 28rpx;
	margin-top: 20rpx;
}

.back-to-welcome {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8rpx;
	margin-top: 30rpx;
	padding: 16rpx 32rpx;
	background: linear-gradient(135deg, #409EFF, #67C23A);
	color: #ffffff;
	border-radius: 24rpx;
	font-size: 26rpx;
	font-weight: 600;
	box-shadow: 0 4rpx 16rpx rgba(64, 158, 255, 0.3);
	transition: all 0.3s ease;
	cursor: pointer;

	&:active {
		transform: scale(0.98);
		box-shadow: 0 2rpx 8rpx rgba(64, 158, 255, 0.5);
	}

	text {
		color: #ffffff;
	}
}


/* === 欢迎界面样式 === */
.welcome-section {
	min-height: 100vh;
	display: flex;
	justify-content: center;
	align-items: center;
	background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
	padding: 20rpx 20rpx;

	.main-content {
		width: 100%;
		max-width: 700rpx;

		.icon-wrapper {
			text-align: center;
			margin-bottom: 30rpx;

			.main-title {
				display: block;
				font-size: 48rpx;
				font-weight: 600;
				color: #1e3a8a;
				letter-spacing: 2rpx;
				text-shadow: 0 4rpx 8rpx rgba(30, 58, 138, 0.1);
				margin-top: 20rpx;
			}

			.sub-title {
				display: block;
				font-size: 28rpx;
				color: #64748b;
				margin: 16rpx 0;
				font-family: monospace;
			}
		}
	}
}

.welcome-search-container {
	margin-bottom: 40rpx;
	position: relative;
	overflow: visible;

	.search-input-wrapper {
		position: relative;
		background: #FFFFFF;
		border-radius: 30rpx;
		padding: 12rpx 24rpx;
		box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.12);
		border: 3rpx solid rgba(255, 255, 255, 0.9);
		transition: all 0.4s ease;
		overflow: visible;

		&:focus-within {
			border-color: #409EFF;
			box-shadow: 0 12rpx 40rpx rgba(64, 158, 255, 0.25);
			transform: translateY(-4rpx);
		}

		.search-input {
			width: calc(100% - 140rpx);
			height: 88rpx;
			font-size: 30rpx;
			color: #333;
			border: none;
			outline: none;

			&::placeholder {
				color: #C0C4CC;
				font-size: 28rpx;
			}
		}

		.search-actions {
			position: absolute;
			right: 12rpx;
			top: 50%;
			transform: translateY(-50%);
			display: flex;
			align-items: center;
			gap: 16rpx;

			.voice-search,
			.clear-search {
				width: 72rpx;
				height: 72rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				border-radius: 50%;
				background: #F5F7FA;
				transition: all 0.3s ease;

				&:active {
					transform: scale(0.95);
					background: #E4E7ED;
				}
				
				&.recording {
					animation: pulse 1.5s ease-in-out infinite;
					background: #FEF0F0;
					box-shadow: 0 0 0 4rpx rgba(245, 108, 108, 0.2);
				}
			}

			.search-button {
				width: 72rpx;
				height: 72rpx;
				background: linear-gradient(135deg, #409EFF, #67C23A);
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				box-shadow: 0 6rpx 20rpx rgba(64, 158, 255, 0.4);
				transition: all 0.3s ease;

				&:active {
					transform: scale(0.95);
					box-shadow: 0 4rpx 16rpx rgba(64, 158, 255, 0.6);
				}
			}
		}
	}
}

.quick-actions {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
	margin-top: 40rpx;

	.action-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: #ffffff;
		border-radius: 20rpx;
		padding: 24rpx 28rpx;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
		border: 1rpx solid rgba(255, 255, 255, 0.8);
		transition: all 0.3s ease;

		&:active {
			transform: translateY(-2rpx);
			box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
		}

		.action-text {
			flex: 1;
			font-size: 30rpx;
			font-weight: 600;
			color: #333333;
			margin-left: 4rpx;
		}

		.action-count {
			font-size: 26rpx;
			font-weight: bold;
			color: #67C23A;
			background: rgba(103, 194, 58, 0.1);
			padding: 6rpx 16rpx;
			border-radius: 16rpx;
			margin-right: 12rpx;
		}
	}
}

.functional-section {
	padding: 0;
	display: flex;
	flex-direction: column;
	flex: 1;
	overflow: hidden;
	height: 100vh;
}

.function-header {
	flex-shrink: 0;
	padding: 100rpx 0 16rpx 0;
	background: #ffffff;
	z-index: 2;
}

.function-content {
	flex: 1;
	overflow-y: auto;
	padding: 16rpx 0 140rpx 0;
	/* 增加底部内边距为底部导航栏留出空间 */
}

.data-list-container {
	padding: 20rpx 0;

	.list-item {
		margin: 30rpx 0;
		background: linear-gradient(135deg, #ffffff 0%, #fdfdfe 100%);
		border-radius: 20rpx;
		overflow: hidden;
		position: relative;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.03);
		border: 1rpx solid rgba(255, 255, 255, 0.9);

		&::before {
			content: '';
			position: absolute;
			bottom: -15rpx;
			left: 5%;
			width: 90%;
			height: 30rpx;
			background: #f5f5f7;
			border-radius: 0 0 16rpx 16rpx;
			z-index: -1;
		}
	}
}

/* === 智能搜索样式 === */
.intelligent-search-section {
	background: #ffffff;
	border-radius: 20rpx;
	padding: 120rpx 30rpx 30rpx 30rpx;
	margin-bottom: 16rpx;
	position: relative;
	overflow: visible;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
	border: 1rpx solid rgba(230, 230, 230, 0.6);
	flex-shrink: 0;
	z-index: 5;
}

.search-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;

	.search-header-left {
		display: flex;
		align-items: center;
	}

	.back-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40rpx;
		height: 40rpx;
		margin-right: 16rpx;
		background: #0C4FC5;
		border-radius: 20%;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 2rpx 8rpx rgba(102, 126, 234, 0.3);
	}

	.back-button:active {
		transform: scale(0.95);
		box-shadow: 0 1rpx 4rpx rgba(102, 126, 234, 0.4);
	}

	.back-icon {
		font-size: 32rpx;
		color: #ffffff;
		font-weight: bold;
		line-height: 1;
	}

	.search-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #333333;
		text-shadow: none;
	}

	.search-stats {
		.search-count {
			font-size: 26rpx;
			color: #666666;
			background: rgba(102, 102, 102, 0.1);
			padding: 6rpx 16rpx;
			border-radius: 20rpx;
			backdrop-filter: blur(10rpx);
		}
	}
}

.smart-search-container {
	position: relative;
	z-index: 10;
	overflow: visible;
}

.search-input-wrapper {
	position: relative;
	background: #FFFFFF;
	border-radius: 25rpx;
	padding: 8rpx 20rpx;
	box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
	border: 2rpx solid rgba(255, 255, 255, 0.8);
	transition: all 0.3s ease;
	overflow: visible;

	&:focus-within {
		border-color: #409EFF;
		box-shadow: 0 8rpx 32rpx rgba(64, 158, 255, 0.3);
		transform: translateY(-2rpx);
	}
}

.search-input {
	width: calc(100% - 120rpx);
	height: 80rpx;
	font-size: 28rpx;
	color: #333;
	border: none;
	outline: none;

	&::placeholder {
		color: #C0C4CC;
		font-size: 26rpx;
	}
}

.search-actions {
	position: absolute;
	right: 8rpx;
	top: 50%;
	transform: translateY(-50%);
	display: flex;
	align-items: center;
	gap: 12rpx;

	.voice-search,
	.clear-search {
		width: 64rpx;
		height: 64rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: #F5F7FA;
		transition: all 0.3s ease;

		&:active {
			transform: scale(0.95);
			background: #E4E7ED;
		}
	}

	.search-button {
		width: 64rpx;
		height: 64rpx;
		background: linear-gradient(135deg, #409EFF, #67C23A);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4rpx 16rpx rgba(64, 158, 255, 0.4);
		transition: all 0.3s ease;

		&:active {
			transform: scale(0.95);
			box-shadow: 0 2rpx 8rpx rgba(64, 158, 255, 0.6);
		}
	}
}

/* 搜索建议下拉框 - 优化键盘适配和滚动 */
.search-suggestions {
	position: absolute;
	top: 100%;
	left: 0;
	right: 0;
	background: #FFFFFF;
	border-radius: 16rpx;
	margin-top: 8rpx;
	box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
	border: 1rpx solid rgba(64, 158, 255, 0.2);
	z-index: 9999;
	/* 提高z-index确保在键盘上方 */
	overflow: hidden;
	backdrop-filter: blur(20rpx);
	transition: transform 0.3s ease;
	max-height: 50vh;
	/* 限制最大高度，避免超出视窗 */

	.suggestions-scroll {
		height: auto;
		max-height: 320rpx;
		/* 固定最大高度，约显示4-5个建议项 */
		min-height: 80rpx;
		/* 确保有最小高度 */
		overflow-y: auto !important;
		overflow-x: hidden;
		-webkit-overflow-scrolling: touch;
		/* iOS平滑滚动 */
		/* 确保滚动可见 */
		scrollbar-width: thin;
		scrollbar-color: rgba(64, 158, 255, 0.5) rgba(240, 240, 240, 0.3);

		/* 添加边框以清晰显示滚动区域 */
		border: 1rpx solid rgba(64, 158, 255, 0.1);
		border-radius: 8rpx;

		/* Webkit滚动条样式 */
		&::-webkit-scrollbar {
			width: 6rpx;
		}

		&::-webkit-scrollbar-track {
			background: rgba(240, 240, 240, 0.3);
			border-radius: 3rpx;
		}

		&::-webkit-scrollbar-thumb {
			background: rgba(64, 158, 255, 0.5);
			border-radius: 3rpx;

			&:hover {
				background: rgba(64, 158, 255, 0.7);
			}

			&:active {
				background: rgba(64, 158, 255, 0.8);
			}
		}
	}

	.suggestion-item {
		display: flex;
		align-items: center;
		padding: 16rpx 20rpx;
		border-bottom: 1rpx solid #f8f9fa;
		transition: all 0.3s ease;
		position: relative;

		&:last-child {
			border-bottom: none;
		}

		&:active {
			background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
			transform: scale(0.98);
		}

		&::before {
			content: '';
			position: absolute;
			left: 0;
			top: 0;
			width: 0;
			height: 100%;
			background: linear-gradient(135deg, #409eff, #36cfc9);
			transition: width 0.3s ease;
		}

		&:active::before {
			width: 4rpx;
		}

		.suggestion-icon {
			width: 36rpx;
			height: 36rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			margin-right: 16rpx;
			background: rgba(64, 158, 255, 0.1);
			border-radius: 50%;

			.icon-emoji {
				font-size: 18rpx;
			}
		}

		.suggestion-content {
			flex: 1;
			display: flex;
			flex-direction: column;

			.suggestion-text {
				font-size: 28rpx;
				color: #303133;
				font-weight: 500;
				line-height: 1.4;
				margin-bottom: 4rpx;
			}

			.suggestion-type {
				font-size: 22rpx;
				color: #909399;
				line-height: 1.2;
			}
		}

		.suggestion-count {
			font-size: 20rpx;
			color: #409eff;
			background: linear-gradient(135deg, #e3f2fd, #bbdefb);
			padding: 4rpx 10rpx;
			border-radius: 12rpx;
			margin-right: 12rpx;
			min-width: 32rpx;
			text-align: center;
			font-weight: 600;
			box-shadow: 0 2rpx 8rpx rgba(64, 158, 255, 0.2);
		}

		.suggestion-arrow {
			width: 24rpx;
			height: 24rpx;
			display: flex;
			align-items: center;
			justify-content: center;

			.icon-emoji {
				font-size: 16rpx;
			}
		}
	}

	.suggestions-footer {
		padding: 12rpx 20rpx;
		background: linear-gradient(135deg, #f8f9fa, #e9ecef);
		border-top: 1rpx solid #e9ecef;

		.footer-text {
			font-size: 22rpx;
			color: #6c757d;
			text-align: center;
		}
	}
}

/* 搜索历史 */
.search-history {
	margin-top: 24rpx;

	.history-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16rpx;

		.history-title {
			display: flex;
			align-items: center;
			gap: 8rpx;
			color: #666666;
			font-size: 26rpx;
		}

		.history-actions {
			display: flex;
			align-items: center;
			gap: 12rpx;

			.history-toggle,
			.clear-history {
				display: flex;
				align-items: center;
				gap: 6rpx;
				color: #999999;
				font-size: 22rpx;
				padding: 8rpx 16rpx;
				border-radius: 20rpx;
				background: rgba(153, 153, 153, 0.1);
				backdrop-filter: blur(10rpx);
				transition: all 0.3s ease;

				&:active {
					background: rgba(153, 153, 153, 0.2);
					transform: scale(0.95);
				}
			}

			.history-toggle {
				background: rgba(64, 158, 255, 0.1);
				color: #409EFF;
			}
		}
	}

	.history-content {
		width: 100%;
		animation: fadeIn 0.3s ease;

		.history-item {
			display: flex;
			align-items: center;
			padding: 16rpx 0;
			border-bottom: 1rpx solid rgba(153, 153, 153, 0.1);
			transition: all 0.3s ease;

			&:last-child {
				border-bottom: none;
			}

			&:active {
				background: rgba(153, 153, 153, 0.1);
				border-radius: 8rpx;
			}

			.history-icon {
				width: 36rpx;
				height: 36rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				margin-right: 16rpx;
				background: rgba(153, 153, 153, 0.1);
				border-radius: 50%;

				.icon-emoji {
					font-size: 18rpx;
				}
			}

			.history-text {
				flex: 1;
				font-size: 26rpx;
				color: #333333;
				font-weight: 500;
			}

			.history-time {
				font-size: 22rpx;
				color: #999999;
				margin-right: 16rpx;
			}

			.history-delete {
				width: 32rpx;
				height: 32rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				background: rgba(153, 153, 153, 0.1);
				border-radius: 50%;
				transition: all 0.3s ease;

				&:active {
					background: rgba(153, 153, 153, 0.2);
					transform: scale(0.9);
				}

				.icon-emoji {
					font-size: 16rpx;
				}
			}
		}
	}

	/* 新增：搜索历史预览样式 */
	.history-preview {
		width: 100%;
		animation: fadeIn 0.3s ease;

		.preview-tags {
			display: flex;
			flex-wrap: wrap;
			gap: 12rpx;
			padding: 8rpx 0;

			.preview-tag {
				background: linear-gradient(135deg, #f8f9fa, #e9ecef);
				border: 1rpx solid #dee2e6;
				border-radius: 20rpx;
				padding: 8rpx 16rpx;
				font-size: 24rpx;
				color: #606266;
				transition: all 0.3s ease;

				&:active {
					background: #e9ecef;
					transform: scale(0.95);
				}
			}

			.preview-more {
				display: flex;
				align-items: center;
				justify-content: center;
				background: rgba(153, 153, 153, 0.1);
				border-radius: 50%;
				width: 40rpx;
				height: 40rpx;
				font-size: 24rpx;
				color: #909399;
			}
		}
	}

	.history-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60rpx 0;

		.icon-emoji {
			font-size: 48rpx;
			opacity: 0.5;
		}

		.empty-text {
			margin-top: 16rpx;
			font-size: 26rpx;
			color: #999999;
		}
	}
}

/* 添加淡入动画 */
@keyframes fadeIn {
	from {
		opacity: 0;
	}

	to {
		opacity: 1;
	}
}

/* 热门搜索标签 */
.hot-search-tags {
	margin-top: 24rpx;
	background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f8faff 100%);
	border-radius: 20rpx;
	padding: 24rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.8);
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
	backdrop-filter: blur(20rpx);
	position: relative;
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		top: -2rpx;
		left: -2rpx;
		right: -2rpx;
		bottom: -2rpx;
		background: linear-gradient(135deg,
				rgba(64, 158, 255, 0.1) 0%,
				rgba(103, 194, 58, 0.1) 50%,
				rgba(255, 107, 53, 0.1) 100%);
		border-radius: 20rpx;
		z-index: -1;
	}

	.tags-header {
		display: flex;
		align-items: center;
		gap: 10rpx;
		margin-bottom: 20rpx;

		.tags-title {
			font-size: 26rpx;
			color: #1976d2;
			font-weight: 600;
		}
	}

	.tags-container {
		display: flex;
		flex-wrap: wrap;
		gap: 12rpx;

		.hot-tag {
			background: linear-gradient(135deg, #FFFFFF, #F8FAFC);
			border: 1rpx solid #E1E7EF;
			border-radius: 20rpx;
			padding: 8rpx 16rpx;
			transition: all 0.3s ease;
			cursor: pointer;
			position: relative;
			overflow: hidden;
			box-shadow: 0 2rpx 8rpx rgba(25, 118, 210, 0.1);

			&::before {
				content: '';
				position: absolute;
				top: 0;
				left: -100%;
				width: 100%;
				height: 100%;
				background: linear-gradient(90deg,
						transparent,
						rgba(64, 158, 255, 0.3),
						transparent);
				transition: left 0.6s ease;
			}

			&:hover::before {
				left: 100%;
			}

			&:active {
				background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
				transform: scale(0.95);
				box-shadow: 0 1rpx 4rpx rgba(25, 118, 210, 0.2);
			}

			.tag-content {
				display: flex;
				align-items: center;
				gap: 8rpx;
				position: relative;
				z-index: 1;

				.tag-text {
					font-size: 24rpx;
					color: #1565c0;
					font-weight: 500;
				}

				.tag-count {
					font-size: 20rpx;
					color: #2196f3;
					background: linear-gradient(135deg, #e3f2fd, #bbdefb);
					padding: 2rpx 8rpx;
					border-radius: 10rpx;
					min-width: 32rpx;
					text-align: center;
					font-weight: 600;
					box-shadow: inset 0 1rpx 2rpx rgba(33, 150, 243, 0.2);
				}
			}
		}
	}
}

/* 动画效果 */
@keyframes floating {

	0%,
	100% {
		transform: rotate(0deg) translate(-50%, -50%);
	}

	50% {
		transform: rotate(180deg) translate(-50%, -50%);
	}
}

@keyframes shimmer {
	0% {
		background-position: -1000rpx 0;
	}

	100% {
		background-position: 1000rpx 0;
	}
}



/* === 紧凑单行布局 === */
.compact-row {
	display: flex;
	align-items: center;
	gap: 12rpx;
	padding: 8rpx 0;
	width: 100%;
}

/* === 搜索建议相关样式 === */
.search-container {
	position: relative;
	overflow: visible;
	/* 重要：允许建议框显示 */
}

.search-input-container {
	position: relative;
	overflow: visible;
	/* 重要：允许建议框显示 */
}

/* 智能搜索容器 */
.smart-search-container {
	position: relative;
	overflow: visible;
	/* 重要：允许建议框显示 */
}

.search-input-wrapper {
	position: relative;
	overflow: visible;
	/* 重要：允许建议框显示 */
}

.search-suggestions {
	position: absolute;
	top: 100%;
	left: 0;
	right: 0;
	background: #fff;
	border-radius: 12rpx;
	box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.12);
	z-index: 1000;
	margin-top: 8rpx;
	border: 1rpx solid #e8e8e8;
	overflow: hidden;

	.suggestions-scroll {
		max-height: 400rpx;
	}

	.suggestion-item {
		display: flex;
		align-items: center;
		padding: 20rpx;
		border-bottom: 1rpx solid #f0f0f0;
		cursor: pointer;
		transition: all 0.2s ease;
		-webkit-tap-highlight-color: rgba(64, 158, 255, 0.1);
		tap-highlight-color: rgba(64, 158, 255, 0.1);
		user-select: none;

		/* 确保点击区域足够大，便于滚动和点击 */
		min-height: 88rpx;
		position: relative;

		&:hover {
			background: linear-gradient(135deg, #f8fbff, #f0f7ff);
		}

		&:active {
			background: linear-gradient(135deg, #e3f2fd, #bbdefb);
			transform: scale(0.98);
		}

		&:last-child {
			border-bottom: none;
		}

		/* 增强触摸反馈 */
		&:focus {
			outline: none;
			background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
		}

		.suggestion-icon {
			width: 40rpx;
			height: 40rpx;
			border-radius: 8rpx;
			background: #f5f7fa;
			display: flex;
			align-items: center;
			justify-content: center;
			margin-right: 16rpx;

			.icon-emoji {
				font-size: 24rpx;
			}
		}

		.suggestion-content {
			flex: 1;

			.suggestion-text {
				font-size: 28rpx;
				color: #333;
				margin-bottom: 4rpx;
				display: block;
			}

			.suggestion-type {
				font-size: 22rpx;
				color: #999;
			}
		}

		.suggestion-arrow {
			color: #ccc;

			.icon-emoji {
				font-size: 20rpx;
			}
		}
	}

	.suggestions-footer {
		padding: 12rpx 20rpx;
		background: #f8f9fa;
		border-top: 1rpx solid #e8e8e8;

		.footer-text {
			font-size: 22rpx;
			color: #666;
		}
	}
}

.no-suggestions {
	padding: 20rpx;
	text-align: center;

	.no-suggestions-content {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 8rpx;

		.no-suggestions-text {
			font-size: 24rpx;
			color: #909399;
		}
	}

	.no-suggestions-tip {
		.tip-text {
			font-size: 20rpx;
			color: #c0c4cc;
		}
	}
}

/* === 动画效果 === */
@keyframes bounce {

	0%,
	20%,
	50%,
	80%,
	100% {
		transform: translateY(0);
	}

	40% {
		transform: translateY(-6rpx);
	}

	60% {
		transform: translateY(-3rpx);
	}
}

/* 录音脉冲动画 */
@keyframes pulse {
	0%, 100% {
		transform: scale(1);
		box-shadow: 0 0 0 4rpx rgba(245, 108, 108, 0.2);
	}
	50% {
		transform: scale(1.05);
		box-shadow: 0 0 0 8rpx rgba(245, 108, 108, 0.4);
	}
}

/* === 键盘适配优化 === */
/* 当键盘弹出时的特殊处理 */
.search-suggestions.keyboard-active {
	position: fixed !important;
	top: auto !important;
	bottom: 20rpx;
	left: 20rpx;
	right: 20rpx;
	margin-top: 0;
	max-height: 30vh;
	z-index: 99999;
}

/* 小屏幕设备优化 */
@media screen and (max-height: 667px) {
	.search-suggestions {
		max-height: 280rpx;
	}

	.search-suggestions .suggestions-scroll {
		max-height: 240rpx;
		/* 约显示3-4个建议项 */
	}
}

@media screen and (max-height: 568px) {
	.search-suggestions {
		max-height: 220rpx;
	}

	.search-suggestions .suggestions-scroll {
		max-height: 180rpx;
		/* 约显示2-3个建议项 */
	}
}

/* 为不同屏幕密度优化 */
@media screen and (-webkit-device-pixel-ratio: 3) {
	.search-suggestions .suggestions-scroll {

		/* 高密度屏幕使用更精细的滚动条 */
		&::-webkit-scrollbar {
			width: 4rpx;
		}
	}
}

/* 🆕 自定义导航栏样式 */
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
.container {
	min-height: calc(100vh - 88px);
	/* 减去导航栏高度 */
}

/* 🆕 小区显示样式 */
.navbar-right {
	display: flex;
	align-items: center;
}

.community-display {
	display: flex;
	align-items: center;
	padding: 8rpx 16rpx;
	background: rgba(255, 255, 255, 0.2);
	border-radius: 20rpx;
	border: 1px solid rgba(255, 255, 255, 0.3);
}

.community-icon {
	font-size: 24rpx;
	margin-right: 8rpx;
}

.community-text {
	font-size: 24rpx;
	color: #ffffff;
	max-width: 120rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
</style>