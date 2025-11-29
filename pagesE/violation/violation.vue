<template>
	<view class="violation-container">
		<!-- 自定义导航栏 -->
		<view class="custom-navbar">
			<view class="navbar-content">
				<!-- 左侧返回按钮 - 禁用状态 -->
				<view class="navbar-left">
					<view class="home-button disabled" @click="onDisabledClick">
						<u-icon name="home-fill" size="18" color="#cccccc"></u-icon>
					</view>
				</view>
				<!-- 中间标题 -->
				<view class="navbar-title">
					<text>违规车辆</text>
				</view>
				<!-- 右侧占位 -->
				<view class="navbar-right"></view>
			</view>
		</view>
		<!-- 管家界面 -->
		<view class="housekeeper-view">
			<!-- 智能搜索栏 -->
			<view class="smart-search-container">
				<view class="search-wrapper">
					<!-- 搜索输入框 -->
					<view class="search-input-box"
						:class="{ focused: searchFocused, hasText: searchKeyword.length > 0 }">
						<input class="search-input" :value="searchKeyword" placeholder="搜索车牌号/业主姓名/手机号"
							@focus="handleSearchFocus" @blur="handleSearchBlur" @input="handleSearchInput"
							@confirm="performSearch" :focus="searchFocused" />
						<!-- 清空按钮 -->
						<view class="clear-btn" v-if="searchKeyword.length > 0" @click="clearSearchInput">
							<u-icon name="close-circle-fill" size="22" color="#c8c9cc"></u-icon>
						</view>
					</view>

					<!-- 搜索建议下拉框 -->
					<view class="search-suggestions" v-if="showSuggestions && searchSuggestions.length > 0">
						<scroll-view scroll-y class="suggestions-scroll">
							<view class="suggestion-item" v-for="(suggestion, index) in searchSuggestions" :key="index"
								@click="selectSuggestion(suggestion)">
								<view class="suggestion-icon">
									<text class="icon-emoji">
										{{ suggestion.type === 'plate' ? '🚗' :
											suggestion.type === 'phone' ? '📱' :
												suggestion.type === 'name' ? '👤' :
													suggestion.type === 'violation' ? '⚠️' :
														suggestion.type === 'reason' ? '📝' : '🔍' }}
									</text>
								</view>
								<view class="suggestion-content">
									<text class="suggestion-text">{{ suggestion.text }}</text>
									<text class="suggestion-type">{{ getSuggestionTypeText(suggestion.type) }}</text>
								</view>
								<view class="suggestion-arrow">
									<text class="icon-emoji">➡️</text>
								</view>
							</view>
						</scroll-view>
						<view class="suggestions-footer">
							<text class="footer-text">找到 {{ searchSuggestions.length }} 个匹配项</text>
						</view>
					</view>
				</view>

				<!-- 右侧操作按钮组 -->
				<view class="action-buttons">
					<!-- 搜索历史按钮 -->
					<view class="action-btn history-btn" @click="toggleSearchHistory"
						:class="{ active: showSearchHistory }">
						<view class="btn-content">
							<text class="icon-emoji"
								:style="{ color: showSearchHistory ? '#f5a623' : '#d4922a' }">📜</text>
							<text class="btn-label"
								:style="{ color: showSearchHistory ? '#f5a623' : '#d4922a' }">历史</text>
						</view>
					</view>
				</view>
			</view>


			<!-- 搜索历史面板 -->
			<view class="search-history-panel" v-if="showSearchHistory">
				<view class="history-header">
					<view class="header-title">
						<text class="icon-emoji" style="color: #409eff; margin-right: 6rpx">📜</text>
						<text class="title-text">搜索历史</text>
					</view>
					<view class="header-actions">
						<text class="clear-all" @click="clearSearchHistory">清空</text>
					</view>
				</view>
				<view class="history-content" v-if="searchHistory.length > 0">
					<view class="history-item" v-for="(item, index) in recentSearchHistory" :key="index"
						@click="useHistorySearch(item)">
						<view class="history-icon">
							<text class="icon-emoji">{{ item.type === 'plate' ? '🚗' : item.type === 'phone' ? '📱' :
								item.type === 'name' ? '👤' : '🔍' }}</text>
						</view>
						<text class="history-text">{{ item.keyword }}</text>
						<view class="history-time">{{ formatHistoryTime(item.time) }}</view>
						<view class="history-delete" @click.stop="removeSearchHistory(index)">
							<text class="icon-emoji" style="color: #999">×</text>
						</view>
					</view>
				</view>
				<view class="history-empty" v-else>
					<text class="icon-emoji" style="font-size: 48rpx; color: #e0e3e6">🔍</text>
					<text class="empty-text">暂无搜索历史</text>
				</view>
			</view>

			<!-- 热门搜索标签 -->
			<view class="hot-search-tags" v-if="!searchFocused && !showSearchHistory && searchKeyword.length === 0">
				<view class="tags-header">
					<text class="icon-emoji" style="color: #ff6b35; margin-right: 6rpx">🔥</text>
					<text class="tags-title">热门搜索</text>
				</view>
				<view class="tags-container">
					<view class="hot-tag" v-for="(tag, index) in hotSearchTags" :key="index" @click="useHotSearch(tag)">
						<text class="tag-text">{{ tag.text }}</text>
						<view class="tag-count" v-if="tag.count && tag.count > 0">{{ tag.count }}</view>
					</view>
				</view>
			</view>

			<!-- 违规统计 -->
			<view class="weekly-stats">
				<view class="stats-header">
					<text class="stats-title">违规统计</text>
						<!-- 新的日期范围选择器 -->
						<view class="date-range-wrapper">
							<uni-datetime-picker 
								ref="statisticsCalendar"
								v-model="statisticsDateRange" 
								type="daterange"
								rangeSeparator="至"
								start="2024-01-01"
								:end="getCurrentDate()"
								:border="false"
								:clearIcon="true"
								placeholder="选择日期范围"
								@change="onStatisticsDateRangeChange"
								@maskClick="closeStatisticsCalendar">
								<template v-slot>
									<view class="custom-calendar-trigger">
										<u-icon name="calendar" color="#10b981" size="20"></u-icon>
										<text class="calendar-text">
											{{ formatDateRangeDisplay(statisticsDateRange) }}
										</text>
									</view>
								</template>
							</uni-datetime-picker>
					</view>
				</view>

				<!-- 高风险车辆统计 -->
				<view v-if="highRiskCars.length > 0" class="high-risk-section">
					<view class="section-header">
						<view class="warning-title">
							<u-icon name="error-circle-fill" color="#ff4d4f" size="36"></u-icon>
							<text class="title-text">高风险车辆预警</text>
							<text class="total-count">{{ highRiskCars.length }}辆</text>
							
							<!-- 🚫 黑名单车辆统计 -->
							<text class="blacklist-count" v-if="getBlacklistedHighRiskCount() > 0">
								🚫 {{ getBlacklistedHighRiskCount() }}辆已拉黑
							</text>
						</view>
					</view>

					<view class="risk-vehicles-list">
						<!-- 高风险车辆空状态 -->
						<view v-if="highRiskCars.length === 0" class="empty-state-container">
							<view class="empty-state-card">
								<view class="empty-icon">
									<text class="icon-emoji">🚗</text>
								</view>
								<view class="empty-content">
									<text class="empty-title">暂无高风险车辆</text>
									<text class="empty-subtitle">
										{{ statisticsStartDate }} 至 {{ statisticsEndDate }} 期间暂无高风险车辆记录
									</text>
								</view>
							</view>
						</view>

						<view v-for="(car, index) in highRiskCars" :key="car.plateNumber" class="risk-vehicle-item"
							:class="{ 'expanded': car.isExpanded }" v-else>
							<!-- 车辆主要信息卡片 -->
							<view class="risk-card" @click="toggleViolationDetails(index)">
								<view class="card-header">
									<view class="plate-info">
										<text class="plate-number"
											:class="car.isNewEnergy ? 'green-plate' : 'blue-plate'">
											{{ car.plateNumber }}
										</text>
										
										<view class="violation-badge"
											:class="[car.count <= 2 ? 'violation-normal' : car.count <= 4 ? 'violation-warning' : 'violation-severe']">
											<u-icon name="warning-fill" color="#fff" size="24"></u-icon>
											<text>{{ car.count }}次违规</text>
										</view>
									</view>
									<view class="toggle-icon">
										<u-icon :name="car.isExpanded ? 'arrow-up' : 'arrow-down'" size="28"
											color="#909399"></u-icon>
									</view>
								</view>
							</view>

							<!-- 违规详情折叠面板 -->
							<view v-if="car.isExpanded" class="violation-details">
								<!-- 业主信息 - 重新设计的布局 -->
								<view class="owner-info-redesigned">
									<!-- 车主类型标识 -->
									<view class="owner-type-badge">
										<view class="type-tag"
											:class="car.ownerType === 'local' ? 'type-local' : car.ownerType === 'monthly' ? 'type-monthly' : car.ownerType === 'visitor' ? 'type-visitor' : car.ownerType === 'temporary' ? 'type-temporary' : 'type-unknown'">
											<text class="type-icon">{{ getOwnerTypeIcon(car.ownerType || 'unknown') }}</text>
											<text class="type-text">{{ getOwnerTypeText(car.ownerType || 'unknown') }}</text>
										</view>
									</view>

									<!-- 基本信息卡片 -->
									<view class="basic-info-card" v-if="car.ownerType !== 'temporary'">
										<view class="info-row owner-name-row">
											<text class="info-icon">👤</text>
											<view class="info-content">
												<text class="info-label">业主姓名</text>
												<text class="info-value highlight">{{ car.ownerName || '未知' }}</text>
											</view>
										</view>
										
										<view class="info-row phone-row">
											<text class="info-icon">📱</text>
											<view class="info-content">
												<text class="info-label">联系电话</text>
												<view class="phone-wrapper">
													<text v-if="car.phone && car.phone !== '未知'" 
														  class="info-value phone-number clickable-phone" 
														  @click="makePhoneCall(car.phone)">{{ car.phone }}</text>
													<text v-else class="info-value phone-number">{{ car.phone || '未知' }}</text>
												</view>
											</view>
										</view>
									</view>

									<!-- 专属信息区域 -->
									<view v-if="car.ownerType === 'monthly'" class="specialty-info-card monthly-card">
										<view class="card-header">
											<text class="card-title">🎫 月票信息</text>
										</view>
										<view class="info-row">
											<text class="info-icon">📋</text>
											<view class="info-content">
												<text class="info-label">月票名称</text>
												<text class="info-value">{{ car.monthTicketName || '三期地库车辆' }}</text>
											</view>
										</view>
									</view>

									<view v-else-if="car.ownerType === 'local'" class="specialty-info-card local-card">
										<view class="card-header">
											<text class="card-title">🏠 业主信息</text>
										</view>
										<view class="info-row" v-if="car.community">
											<text class="info-icon">🏘️</text>
											<view class="info-content">
												<text class="info-label">小区</text>
												<text class="info-value">{{ car.community }}</text>
											</view>
										</view>
									</view>
								</view>

								<!-- 添加状态统计卡片 -->
								<view class="violation-summary">
									<view class="summary-item"
										v-for="(count, type) in getViolationTypes(car.violations)" :key="type">
										<text class="type">{{ type }}</text>
										<text class="count">{{ count }}次</text>
									</view>
								</view>

								<!-- 当选择了状态筛选但没有符合条件的记录时显示提示 -->
								<view v-if="car.selectedStatus && car.violations.length === 0" class="no-records-tip">
									<view class="tip-icon">
										<text class="icon-emoji">📋</text>
									</view>
									<text class="tip-text">该车辆在"{{ getStatusDisplayText(car.selectedStatus)
									}}"状态下暂无违规记录</text>
								</view>

								<view v-for="(violation, vIndex) in car.violations" :key="vIndex"
									class="violation-item">
									<!-- 状态在顶部显示 -->
									<view class="status-row">
										<!-- 状态标识 -->
										<view v-if="violation.enterTime && !violation.leaveTime"
											class="status-badge in-progress">
											<u-icon name="car" size="20" color="#fff"></u-icon>
											<text>停车中</text>
										</view>
										<view v-if="violation.leaveTime && violation.isFixed" class="status-badge has-left-fixed">
											<u-icon name="lock" size="20" color="#fff"></u-icon>
											<text>已离场固定</text>
										</view>
										<view v-if="violation.leaveTime && !violation.isFixed" class="status-badge has-left">
											<u-icon name="checkmark-circle" size="20" color="#fff"></u-icon>
											<text>已离场</text>
										</view>
									</view>

									<!-- 车辆状态卡片 -->
									<view class="vehicle-status-card">
										<!-- 停车状态和时长 -->
										<view v-if="violation.enterTime && !violation.leaveTime" class="parking-status">
											<text class="status-icon">🚗</text>
											<text class="status-text">停车中</text>
											<text class="duration-icon">⏱️</text>
											<text class="duration-text">已停车 {{ calculateParkingDuration(violation.enterTime) }}</text>
										</view>
									</view>

									<!-- 车辆时间线 -->
									<view class="vehicle-timeline">
										<!-- 进出场时间显示 - 紧凑样式 -->
										<view v-if="violation.enterTime || violation.leaveTime"
											class="timeline-cards compact">
											<view v-if="violation.enterTime" class="timeline-card enter-card">
												<view class="card-icon">
													<text class="emoji-icon">🚗</text>
												</view>
												<view class="card-content">
													<text class="card-label">进场时间</text>
													<view class="card-time">
														<text class="date-part">{{ formatFullDate(violation.enterTime)
														}}</text>
														<text class="time-part">{{ formatTime(violation.enterTime)
														}}</text>
													</view>
												</view>
											</view>
											<view v-if="violation.leaveTime" class="timeline-card leave-card">
												<view class="card-icon">
													<text class="emoji-icon">🚙</text>
												</view>
												<view class="card-content">
													<text class="card-label">离场时间</text>
													<view class="card-time">
														<text class="date-part">{{ formatFullDate(violation.leaveTime)
														}}</text>
														<text class="time-part">{{ formatTime(violation.leaveTime)
														}}</text>
													</view>
												</view>
											</view>
																		</view>
							</view>

							<!-- 违规位置信息 -->
							<view v-if="violation.violationLocation" class="violation-location">
								<view class="location-header">
									<text class="location-icon">📍</text>
									<text class="location-label">违规位置</text>
								</view>
								<view class="location-content">
									<text class="location-value">{{ violation.violationLocation }}</text>
									<view class="location-badge">
										<text class="badge-text">高风险区域</text>
									</view>
														</view>
					</view>

					<!-- 违规照片区域 -->
								<view v-if="violation.photos && violation.photos.length > 0" class="violation-photos">
									<view class="photos-header">
										<view class="photos-title-section">
											<text class="photos-icon">📸</text>
											<text class="photos-label">违规照片</text>
										</view>
										<view class="photos-count-badge">
											<text class="photos-count">{{ violation.photos.length }}张</text>
										</view>
									</view>
									<view class="photos-grid">
										<view v-for="(photo, pIndex) in violation.photos" :key="pIndex" 
											class="photo-item" @click="previewImage(photo, violation.photos)">
											<image :src="photo" class="photo-image" mode="aspectFill"></image>
											<view class="photo-overlay">
												<text class="photo-index">{{ pIndex + 1 }}</text>
											</view>
										</view>
									</view>
								</view>
								</view>
							</view>
						</view>
					</view>
				</view>
				<!-- 实时违规记录 -->
				<view class="realtime-violations">
					<!-- 添加统计卡片组 -->
					<view class="violation-stats-cards">
						<view 
							class="stat-card in-progress" 
							:class="{ 'selected': realtimeSelectedStatus === 'in-progress' }"
							@click="selectRealtimeStatus('in-progress')">
							<view class="icon-wrapper">
								<u-icon name="pause-circle" size="32" color="#fff"></u-icon>
							</view>
							<view class="stat-info">
								<text class="label">进场状态</text>
								<text class="number">{{ getRealtimeInProgressCount() }}</text>
								<text class="status">未离场</text>
							</view>
							<!-- 选中状态指示器 -->
							<view class="selection-indicator" v-if="realtimeSelectedStatus === 'in-progress'">
								<u-icon name="checkmark" size="16" color="#2196f3"></u-icon>
							</view>
						</view>
						<view 
							class="stat-card has-left" 
							:class="{ 'selected': realtimeSelectedStatus === 'has-left' }"
							@click="selectRealtimeStatus('has-left')">
							<view class="icon-wrapper">
								<u-icon name="checkmark-circle" size="32" color="#fff"></u-icon>
							</view>
							<view class="stat-info">
								<text class="label">离场状态</text>
								<text class="number">{{ getRealtimeLeftCount() }}</text>
								<text class="status">已离场</text>
							</view>
							<!-- 选中状态指示器 -->
							<view class="selection-indicator" v-if="realtimeSelectedStatus === 'has-left'">
								<u-icon name="checkmark" size="16" color="#4caf50"></u-icon>
							</view>
						</view>
						<!-- 🔧 新增：已拉黑统计卡片 -->
						<view 
							class="stat-card blacklisted" 
							:class="{ 'selected': realtimeSelectedStatus === 'blacklisted' }"
							@click="selectRealtimeStatus('blacklisted')">
							<view class="icon-wrapper">
								<u-icon name="close-circle" size="32" color="#fff"></u-icon>
							</view>
							<view class="stat-info">
								<text class="label">拉黑状态</text>
								<text class="number">{{ getRealtimeBlacklistedCount() }}</text>
								<text class="status">已拉黑</text>
							</view>
							<!-- 选中状态指示器 -->
							<view class="selection-indicator" v-if="realtimeSelectedStatus === 'blacklisted'">
								<u-icon name="checkmark" size="16" color="#f44336"></u-icon>
							</view>
						</view>
						<!-- 🔧 新增：未拉黑统计卡片 -->
						<view 
							class="stat-card non-blacklisted" 
							:class="{ 'selected': realtimeSelectedStatus === 'non-blacklisted' }"
							@click="selectRealtimeStatus('non-blacklisted')">
							<view class="icon-wrapper">
								<u-icon name="checkmark-circle-fill" size="32" color="#fff"></u-icon>
							</view>
							<view class="stat-info">
								<text class="label">正常状态</text>
								<text class="number">{{ getRealtimeNonBlacklistedCount() }}</text>
								<text class="status">未拉黑</text>
							</view>
							<!-- 选中状态指示器 -->
							<view class="selection-indicator" v-if="realtimeSelectedStatus === 'non-blacklisted'">
								<u-icon name="checkmark" size="16" color="#4caf50"></u-icon>
							</view>
						</view>
					</view>

					<view class="stats-header">
						<view class="title-with-stats">
							<text class="stats-title">实时违规记录</text>
							<!-- 🚫 黑名单车辆统计 -->
							<text class="blacklist-count" v-if="getBlacklistedRealtimeCount() > 0">
								🚫 {{ getBlacklistedRealtimeCount() }}辆已拉黑
							</text>
						</view>
						<!-- 新的日期范围选择器 - 浅蓝色主题 -->
						<view class="date-range-wrapper realtime-calendar">
							<uni-datetime-picker 
								ref="realtimeCalendar"
								v-model="realtimeDateRange" 
								type="daterange"
								rangeSeparator="至"
								start="2024-01-01"
								:end="getCurrentDate()"
								:border="false"
								:clearIcon="true"
								placeholder="选择日期范围"
								@change="onRealtimeDateRangeChange"
								@maskClick="closeRealtimeCalendar">
								<template v-slot>
									<view class="custom-calendar-trigger realtime-trigger">
										<u-icon name="calendar" color="#2196f3" size="20"></u-icon>
										<text class="calendar-text">
											{{ formatDateRangeDisplay(realtimeDateRange) }}
										</text>
									</view>
								</template>
							</uni-datetime-picker>
						</view>
					</view>
					<view class="violation-cards">
						<!-- 空状态提示 -->
						<view v-if="realtimeRecords.length === 0" class="empty-state-container">
							<view class="empty-state-card">
								<view class="empty-icon">
									<text class="icon-emoji">📋</text>
								</view>
								<view class="empty-content">
									<text class="empty-title">暂无违规记录</text>
									<text class="empty-subtitle" v-if="realtimeSelectedStatus">
										该{{ getStatusDisplayText(realtimeSelectedStatus) }}状态下暂无违规记录
									</text>
									<text class="empty-subtitle" v-else-if="realtimeStartDate && realtimeEndDate">
										{{ realtimeStartDate }} 至 {{ realtimeEndDate }} 期间暂无违规记录
									</text>
									<text class="empty-subtitle" v-else>
										当前时间范围内暂无违规记录
									</text>
								</view>
								<view class="empty-actions">
									<view class="action-btn" @click="clearAllFilters" v-if="realtimeSelectedStatus">
										<text class="btn-text">清除筛选</text>
									</view>
								</view>
							</view>
						</view>

						<!-- 使用 uView 的滑动组件 -->
						<u-swipe-action ref="uSwipeAction" v-else>
							<u-swipe-action-item v-for="(record, index) in realtimeRecords" :key="index"
								:options="generateSwipeOptions(record)" :name="index" @click="handleSwipeAction">
								
								<view class="realtime-violation-item-compact"
									:class="{ 'expanded': record.isExpanded }">
									<!-- 紧凑的一行显示 -->
									<view class="compact-row" @click="toggleRealtimeViolationItem(index)">
										<view class="main-info">
											<!-- 车牌号 -->
											<text class="plate-number-compact"
												:class="record.isNewEnergy ? 'green-plate' : 'blue-plate'">
												{{ record.plateNumber }}
											</text>

											<!-- 状态标签 -->
											<view class="status-tag" :class="{
												'status-processed': getVehicleStatusText(record) === '已离场',
												'status-processing': getVehicleStatusText(record) === '在场',
												'status-fixed': getVehicleStatusText(record) === '已离场固定'
											}">
												<text class="status-text">{{ getVehicleStatusText(record) }}</text>
											</view>

											<!-- 违规原因简化显示 -->
											<text class="reason-short">{{ getShortReason(record.violationType)
											}}</text>

											<!-- 时间显示 -->
											<text class="time-display">{{ getRelativeTime(record.createdAt || record.created_at)
											}}</text>
										</view>

										<!-- 展开图标 -->
										<view class="expand-icon">
											<u-icon :name="record.isExpanded ? 'arrow-up' : 'arrow-down'" size="24"
												color="#909399"></u-icon>
										</view>
									</view>
									<!-- 展开后的详细信息 - 按新格式重新设计 -->
									<view class="detail-content" v-if="record.isExpanded">
										<!-- 顶部状态条 -->
										<view class="status-header">
											<view class="status-left">
												<text v-if="record.isBlacklisted" class="blacklist-status">🚫已拉黑</text>
													</view>
											<view class="status-right">
												<text class="parking-status" 
													  :class="{
														'status-not-left': record.enterTime && !record.leaveTime,
														'status-left': record.leaveTime,
														'status-waiting': !record.enterTime
													  }">
													{{ record.enterTime && !record.leaveTime ? '🚗未离场' : 
														 record.leaveTime ? '🟢已离场' : '⏳待进场' }}
												</text>
												</view>
											</view>
											
										<!-- 分隔线 -->
										
										<!-- 车主类型标识 -->
										<view class="owner-type-header">
											<text class="type-label">
												{{ record.ownerType === 'monthly' ? '🏷️ 月票车主' : 
													 record.ownerType === 'local' ? '🏷️ 业主车辆' : 
													 record.ownerType === 'visitor' ? '🎫 预约车辆' :
													 record.ownerType === 'temporary' ? '🚗 临时车辆' :
													 '❓ 未知类型' }}
											</text>
											<!-- 预约车辆突出显示标识 -->
											<view v-if="record.ownerType === 'visitor'" class="appointment-badge">
												<text class="badge-text">✨ VIP预约专属</text>
											</view>
													</view>
													
										<!-- 车主信息段落 -->
										<view class="info-section" v-if="record.ownerType !== 'temporary'">
											<view class="section-title">
												<text class="title-text">● 车主信息</text>
											</view>
											<view class="section-content">
												<view class="info-item">
													<text class="info-prefix">  👤 业主姓名: </text>
													<text class="info-value clickable" 
														  @click="showOwnerDetails(record)">{{ record.ownerName || record.parkName }}</text>
												</view>
												<view class="info-item">
													<text class="info-prefix">  📞 联系电话: </text>
																<text v-if="record.ownerPhone && record.ownerPhone !== '未知'" 
														  class="info-value clickable-phone" 
														  @click="makePhoneCall(record.ownerPhone)">{{ record.ownerPhone}}</text>
													<text v-else class="info-value">{{ record.ownerPhone }}</text>
															</view>
												<view v-if="record.ownerType === 'monthly'" class="info-item">
													<text class="info-prefix">  🎫 月票名称: </text>
													<text class="info-value">{{ record.monthTicketName || record.ownerAddress }}</text>
												</view>
												<view v-else-if="record.ownerType === 'local' && record.ownerAddress" class="info-item">
													<text class="info-prefix">  🏠 住址信息: </text>
													<text class="info-value">{{ record.ownerAddress }}</text>
														</view>
													</view>
												</view>

										<!-- 位置信息段落 -->
										<view class="info-section" v-if="record.ownerType !== 'temporary'">
											<view class="section-title">
												<text class="title-text">● 位置信息</text>
											</view>
											<view class="section-content">
												<view class="info-item">
													<text class="info-prefix">  📍 违规位置: </text>
													<text class="info-value location-highlight">{{ record.location || '连规位置测试违规位置' }}</text>
														</view>
													</view>
												</view>
												
										<!-- 停车时间轴段落 -->
										<view class="info-section">
											<view class="section-title">
												<text class="title-text">● 停车时间轴</text>
														</view>
											<view class="section-content">
												<view class="timeline-container">
													<!-- 进场时间 -->
													<view class="timeline-item enter-time">
														<text class="timeline-icon">🟢</text>
														<text class="timeline-label">进场时间: </text>
														<text class="timeline-value">
															{{ record.enterTime ? formatTimeOnly(record.enterTime) : '08:06:07' }} 
															({{ record.enterTime ? formatDateOnly(record.enterTime) : '2025-08-20' }})
														</text>
												</view>
												
													<!-- 时间轴连接线和停车时长 -->
													<view class="timeline-connector">
														<text class="connector-line">│</text>
														</view>
													<view class="timeline-item duration">
														<text class="timeline-branch">├───</text>
														<text class="timeline-icon">⏱️</text>
														<text class="timeline-label">已停车: </text>
														<text class="timeline-value duration-highlight">
															{{ record.enterTime ? getParkingDuration(record) : '48小时27分钟' }}
														</text>
													</view>
													<view class="timeline-connector">
														<text class="connector-line">│</text>
														</view>
													
													<!-- 离场时间 -->
													<view class="timeline-item leave-time">
														<text class="timeline-icon">{{ record.leaveTime ? '🟢' : '🔴' }}</text>
														<text class="timeline-label">离场时间: </text>
														<text class="timeline-value" :class="{ 'not-left': !record.leaveTime }">
															{{ record.leaveTime ? formatTimeOnly(record.leaveTime) + ' (' + formatDateOnly(record.leaveTime) + ')' : '-- (未离场)' }}
														</text>
													</view>
												</view>
											</view>
										</view>

										<!-- 违规证据段落 -->
										<view class="info-section" v-if="record.ownerType !== 'temporary'">
											<view class="section-title">
												<text class="title-text">● 违规证据</text>
											</view>
											<view class="section-content">
												<view class="info-item">
													<text class="info-prefix">  📸 违规照片 </text>
													<text class="info-value photo-count">({{ record.photos && record.photos.length || 1 }}张)</text>
												</view>
												<!-- 照片网格 -->
												<view class="photos-grid" v-if="record.photos && record.photos.length > 0">
												<view 
													v-for="(photo, photoIndex) in record.photos" 
													:key="photoIndex" 
													class="photo-item"
													@click="previewPhoto(record.photos, photoIndex)"
													v-if="photo && typeof photo === 'string' && (photo.startsWith('http') || photo.startsWith('/'))"
												>
													<image :src="photo" mode="aspectFill" class="photo-image" @error="onImageError(photo)"></image>
												</view>
											</view>
												<view v-else class="photo-placeholder">
													<text class="placeholder-text">[图片区域]</text>
										</view>
												</view>
												</view>

										<!-- 拉黑原因段落 -->
										<view class="info-section" v-if="record.isBlacklisted || record.violationType">
											<view class="section-title">
												<text class="title-text">● {{ record.isBlacklisted ? '拉黑原因' : '违规类型' }}</text>
												</view>
											<view class="section-content">
												<view class="info-item blacklist-reason-item">
													<text class="info-prefix blacklist-icon">📋</text>
													<text class="info-value violation-reason">{{ record.violationType || '未按位置停车' }}</text>
											</view>
												<view v-if="record.description" class="info-item">
													<text class="info-prefix">  📝 详细说明: </text>
													<text class="info-value">{{ record.description }}</text>
											</view>
											</view>
										</view>
									</view>
								</view>
							</u-swipe-action-item>
						</u-swipe-action>
					</view>
				</view>
				<!-- 自定义TabBar -->
				<custom-tabbar :userRole="currentUserRole" @tabChange="onTabChange">
				</custom-tabbar>
			</view>
		</view>
		<!-- 自定义TabBar -->
		<custom-tabbar :userRole="currentUserRole" @tabChange="onTabChange">
		</custom-tabbar>
	</view>
</template>

<script>
import CustomTabbar from '@/components/custom-tabbar.vue'
import { violationApi, ownerApi, violationTypeApi, apiUtils, blacklistApi } from '@/api/violation-api.js'
import { apiConfig, request } from '@/config/api.js'

export default {
	components: {
		CustomTabbar
	},
	data() {
		return {
			currentUserRole: 'manager', // 默认管家角色
			isHousekeeper: true, // 是否为管家
			creditScore: 85, // 信用分
			monthViolations: 2, // 本月违规次数
			totalViolations: 5, // 累计违规次数
			lastViolationDate: '', // 最近违规日期，将在mounted中设置
			
			// 🏢 车场相关信息
			currentParkName: '', // 当前车场名称
			currentParkCode: '', // 当前车场编码
			
			// 🏠 管家小区相关信息
			currentCommunityName: '', // 当前管家所在小区名称
			communityLoaded: false, // 小区信息是否已加载
			loadingCommunityInfo: false, // 是否正在加载小区信息

			timeRanges: [{
				name: '周'
			},
			{
				name: '月'
			},
			{
				name: '季'
			},
			{
				name: '年'
			}
			],
			filterTabs: [{
				name: '全部'
			},
			{
				name: '未处理'
			},
			{
				name: '已处理'
			}
			],
			chartOpts: {
				color: ['#2979ff'],
				padding: [15, 10, 0, 15],
				enableScroll: true,
				legend: false,
				xAxis: {
					itemCount: 7
				},
				yAxis: {
					gridType: 'dash',
					dashLength: 2
				}
			},
			chartData: {
				categories: ['1月', '2月', '3月', '4月', '5月', '6月', '7月'],
				series: [{
					name: '违规次数',
					data: [2, 1, 3, 0, 2, 1, 0]
				}]
			},
			violationList: [], // 将在mounted中初始化
			// 管家界面数据
			weekDateRange: '', // 将在mounted中设置
			highRiskCars: [],
			realtimeRecords: [], // 将在mounted中初始化
			searchKeyword: '',
			// 智能搜索相关数据
			searchFocused: false,
			showSuggestions: false,
			searchSuggestions: [],
			showSearchHistory: false,
			searchHistory: [],
			hotSearchTags: [],
			startDate: this.getLastWeekDate(),
			endDate: this.getCurrentDate(),
			showCalendarPicker: false,
			calendarDefaultDate: [],
			originalRealtimeRecords: [],
			tempDateRange: null,
			realtimeStartDate: '',
			realtimeEndDate: '',
			selectedStatus: '', // 选中的状态 - 保留用于实时违规记录
			statisticsSelectedStatus: '', // 新增：违规统计的选中状态
			realtimeSelectedStatus: '', // 新增：实时违规记录的独立状态选择
			filteredRecords: [], // 筛选后的记录

			// 违规统计的时间范围 - 使用 uni-datetime-picker
			statisticsStartDate: '',
			statisticsEndDate: '',
			statisticsDateRange: [], // 新增：用于 uni-datetime-picker 的日期范围
			showStatisticsCalendarPicker: false,
			statisticsCalendarDefaultDate: [], // 保留兼容性
			
			// 实时违规记录的时间范围 - 使用 uni-datetime-picker
			realtimeDateRange: [], // 新增：用于 uni-datetime-picker 的日期范围

			// 分别保存两部分的原始数据
			originalStatisticsRecords: [],
			originalRealtimeRecords: [],
			originalHighRiskCars: [], // 原始高风险车辆数据

			// 当前最大日期（用于日历组件）
			currentMaxDate: '',

			// 临时保存日期范围选择
			tempStatisticsDateRange: null,

			// 触摸相关数据
			touchStartX: 0,
			touchStartTime: 0,
			currentSwipeIndex: null,

			// 滑动操作配置 - 动态生成
			swipeOptions: [],

					// 🚫 黑名单相关数据
		blacklistData: {
			specialCarTypes: [], // 黑名单类型列表
			currentCarBlackStatus: null, // 当前车辆的黑名单状态
			loading: false
		},
		
		// 🆕 移除黑名单相关数据
		removeBlacklistData: {
			showConfirmDialog: false, // 是否显示确认对话框
			currentRecord: null, // 当前要操作的记录
			loading: false // 是否正在移除黑名单
		},

			// 新增违规记录相关数据
			showAddViolationModal: false,
			showPlateScanModal: false,
			submitting: false,
			scanResult: '',
			newViolation: {
				plateNumber: '',
				ownerInfo: null,
				type: '',
				customType: '',
				location: '',
				photos: '',
				voiceMemo: null,
				description: ''
			},
			violationTypes: [{
				name: '超时停车',
				value: 'overtime',
				icon: '🚗'
			},
			{
				name: '未按位停车',
				value: 'wrong_position',
				icon: '🅿️'
			},
			{
				name: '占用他人车位',
				value: 'occupy_space',
				icon: '🚫'
			},
			{
				name: '未经授权停车',
				value: 'unauthorized',
				icon: '🔒'
			},
			{
				name: '堵塞通道',
				value: 'block_passage',
				icon: '🚧'
			},
			{
				name: '占用残疾人车位',
				value: 'disabled_space',
				icon: '♿'
			},
			{
				name: '其他',
				value: 'other',
				icon: '➕'
			}
			]
		};
	},
	watch: {
		// 监听搜索关键词变化，确保始终是字符串
		searchKeyword: {
			handler(newVal, oldVal) {
				if (typeof newVal !== 'string') {
					// 直接设置为字符串，避免使用 $nextTick
					const strValue = String(newVal || '');
					if (strValue !== newVal) {
						this.searchKeyword = strValue;
					}
				}
			},
			immediate: false // 避免初始化时的问题
		}
	},
	computed: {
		// 最近搜索历史（限制显示数量）
		recentSearchHistory() {
			return this.searchHistory.slice(0, 10);
		}
	},
	methods: {
		// 图片加载错误处理
		onImageError(photoSrc) {
			console.error('图片加载失败:', photoSrc);
			uni.showToast({
				title: '图片加载失败',
				icon: 'none',
				duration: 1500
			});
		},

		// 拨打电话
		makePhoneCall(phoneNumber) {
			if (!phoneNumber || phoneNumber === '未知') {
				uni.showToast({
					title: '电话号码无效',
					icon: 'none',
					duration: 1500
				});
				return;
			}

			uni.showModal({
				title: '拨打电话',
				content: `确定拨打 ${phoneNumber} 吗？`,
				success: (res) => {
					if (res.confirm) {
						uni.makePhoneCall({
							phoneNumber: phoneNumber,
							success: () => {
								console.log('拨打电话成功');
							},
							fail: (err) => {
								console.error('拨打电话失败:', err);
								uni.showToast({
									title: '拨打失败',
									icon: 'none',
									duration: 1500
								});
							}
						});
					}
				}
			});
		},

		// 格式化时间（只显示时间部分）
		formatTimeOnly(dateTimeString) {
			if (!dateTimeString) return '';
			try {
				const date = new Date(dateTimeString);
				const hours = String(date.getHours()).padStart(2, '0');
				const minutes = String(date.getMinutes()).padStart(2, '0');
				const seconds = String(date.getSeconds()).padStart(2, '0');
				return `${hours}:${minutes}:${seconds}`;
			} catch (error) {
				console.error('时间格式化失败:', error);
				return '';
			}
		},

		// 格式化日期（只显示日期部分）
		formatDateOnly(dateTimeString) {
			if (!dateTimeString) return '';
			try {
				const date = new Date(dateTimeString);
				const year = date.getFullYear();
				const month = String(date.getMonth() + 1).padStart(2, '0');
				const day = String(date.getDate()).padStart(2, '0');
				return `${year}-${month}-${day}`;
			} catch (error) {
				console.error('日期格式化失败:', error);
				return '';
			}
		},

		// 显示车主详情
		showOwnerDetails(record) {
			uni.showModal({
				title: '车主详情',
				content: `车主姓名: ${record.ownerName || '未知'}\n联系电话: ${record.ownerPhone || '未知'}\n车牌号: ${record.plateNumber}\n${record.ownerType === 'monthly' ? '月票名称: ' + (record.monthTicketName || record.ownerAddress || '未知') : ''}`,
				showCancel: false,
				confirmText: '关闭'
			});
		},
		
		// 处理禁用的首页按钮点击
		onDisabledClick() {
			uni.showToast({
				title: '首页按钮已禁用',
				icon: 'none',
				duration: 1500
			});
		},

		// 🏠 获取管家小区信息
		async loadManagerCommunityInfo() {
			if (this.currentUserRole !== 'manager') {
				console.log('📍 非管家角色，跳过小区信息加载');
				return;
			}

			if (this.loadingCommunityInfo) {
				console.log('📍 小区信息正在加载中，跳过重复请求');
				return;
			}

			try {
				this.loadingCommunityInfo = true;
				console.log('🏠 开始加载管家小区信息');

				// 获取用户信息
				const userInfo = uni.getStorageSync('userInfo');
				console.log('👤 [loadManagerCommunityInfo] 当前存储的用户信息:', userInfo);

				if (!userInfo) {
					console.warn('⚠️ [loadManagerCommunityInfo] 未找到用户信息');
					this.currentCommunityName = ''; // 默认小区
					this.communityLoaded = true;
					return;
				}

				let communityName = ''; // 默认值

				// 尝试从不同的数据源获取小区信息
				if (userInfo.userInfo && userInfo.userInfo.community) {
					communityName = userInfo.userInfo.community;
					console.log('✅ 从userInfo.userInfo中获取到管家小区:', communityName);
				} else if (userInfo.community) {
					communityName = userInfo.community;
					console.log('✅ 从userInfo中获取到管家小区:', communityName);
				} else if (userInfo.managerData && userInfo.managerData.community) {
					communityName = userInfo.managerData.community;
					console.log('✅ 从userInfo.managerData中获取到管家小区:', communityName);
				} else {
					// 尝试从存储的管家数据中获取
					const storedManagerData = uni.getStorageSync('managerData');
					if (storedManagerData && storedManagerData.community) {
						communityName = storedManagerData.community;
						console.log('✅ 从存储的管家数据中获取到小区:', communityName);
					} else {
						console.log('⚠️ 未找到管家小区信息，使用默认值:', communityName);
					}
				}

				// 设置小区信息
				this.currentCommunityName = communityName;
				this.communityLoaded = true;

				console.log('✅ 管家小区信息加载完成:', {
					communityName: this.currentCommunityName,
					userRole: this.currentUserRole
				});

			} catch (error) {
				console.error('❌ 加载管家小区信息失败:', error);
				this.currentCommunityName = '四季上东'; // 使用默认值
				this.communityLoaded = true;
			} finally {
				this.loadingCommunityInfo = false;
			}
		},

		// 生成最近一周的随机日期（仅日期）
		getRandomDateInLastWeek() {
			const now = new Date();
			const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			const randomTime = oneWeekAgo.getTime() + Math.random() * (now.getTime() - oneWeekAgo.getTime());
			const randomDate = new Date(randomTime);
			return this.formatDate(randomDate);
		},

		// 生成最近一周的随机日期时间
		getRandomDateTimeInLastWeek() {
			const now = new Date();
			const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			const randomTime = oneWeekAgo.getTime() + Math.random() * (now.getTime() - oneWeekAgo.getTime());
			const randomDate = new Date(randomTime);
			return this.formatDateTime(randomDate);
		},

		// 格式化日期时间
		formatDateTime(date) {
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			const hours = String(date.getHours()).padStart(2, '0');
			const minutes = String(date.getMinutes()).padStart(2, '0');
			return `${year}-${month}-${day} ${hours}:${minutes}`;
		},

		// 获取最近一周的日期范围
		getLastWeekDateRange() {
			const now = new Date();
			const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			return `${this.formatDate(oneWeekAgo)}-${this.formatDate(now)}`;
		},

		// 生成实时记录数据
		generateRealtimeRecords() {
			const records = [];

			// 为每个记录生成随机时间
			const recordsWithTime = records.map(record => {
				const appointmentTime = this.getRandomDateTimeInLastWeek();
				const appointmentDate = new Date(appointmentTime);

				// 生成进场时间（预约时间后0-30分钟） - 确保所有记录都有进场时间
				const enterDate = new Date(appointmentDate.getTime() + Math.random() * 30 * 60 * 1000);
				const enterTime = this.formatDateTime(enterDate);

				// 生成离场时间（进场时间后30分钟-4小时）
				let leaveTime = null;
				if (Math.random() > 0.3) { // 70%的概率有离场时间
					const leaveDate = new Date(enterDate.getTime() + (30 + Math.random() * 210) * 60 * 1000);
					leaveTime = this.formatDateTime(leaveDate);
				}

				return {
					...record,
					time: appointmentTime,
					appointmentTime: appointmentTime,
					enterTime: enterTime,
					leaveTime: leaveTime,
					isExpanded: false
				};
			});

			// 按预约时间降序排序（预约时间越晚越靠前）
			return recordsWithTime.sort((a, b) => {
				const timeA = new Date(a.appointmentTime).getTime();
				const timeB = new Date(b.appointmentTime).getTime();
				return timeB - timeA; // 降序排序，时间越晚越靠前
			});
		},

		// 初始化随机时间数据（仅用于备用，不生成实时记录）
		initializeRandomTimeData() {
			// 初始化最近违规日期
			this.lastViolationDate = this.getRandomDateInLastWeek();

			// 初始化违规列表（仅用于统计显示的备用数据）
			this.violationList = [];

			// 初始化周日期范围
			this.weekDateRange = this.getLastWeekDateRange();

			// API加载失败时保持空数组，显示真实的"暂无数据"状态
			this.realtimeRecords = [];
			this.originalRealtimeRecords = [];

			console.warn('⚠️ API加载失败，无法获取违规记录数据。请检查网络连接或联系管理员。');
		},

		// 🆕 调试用户信息
		debugUserInfo() {
			try {
				const userInfo = uni.getStorageSync('userInfo');
				console.log('🔍 [调试] 当前存储的完整用户信息:', JSON.stringify(userInfo, null, 2));

				if (userInfo) {
					// 分析用户信息结构
					console.log('🔍 [调试] 用户信息字段分析:');
					console.log('  - userInfo.patrolData:', userInfo.patrolData);
					console.log('  - userInfo.userInfo:', userInfo.userInfo);
					console.log('  - userInfo.ownerId:', userInfo.ownerId);
					console.log('  - userInfo.id:', userInfo.id);
					console.log('  - userInfo.role:', userInfo.role);
					console.log('  - userInfo.phone:', userInfo.phone);
					
					// 🆕 调试小区名称相关字段
					console.log('🔍 [调试] 小区名称字段分析:');
					console.log('  - userInfo.yardName:', userInfo.yardName);
					console.log('  - userInfo.userInfo?.community:', userInfo.userInfo?.community);
					console.log('  - userInfo.userInfo?.yardName:', userInfo.userInfo?.yardName);
					console.log('  - userInfo.patrolData?.community:', userInfo.patrolData?.community);
					console.log('  - userInfo.patrolData?.managerInfo?.community:', userInfo.patrolData?.managerInfo?.community);

					// 尝试解析用户ID
					let userId = null;
					let userRole = null;

					if (userInfo.patrolData && userInfo.patrolData.username) {
						userId = userInfo.patrolData.id || userInfo.patrolData.userId || userInfo.userId;
						userRole = 'patrol';
					} else if (userInfo.userInfo && userInfo.userInfo.username) {
						userId = userInfo.userInfo.id || userInfo.userId;
						userRole = 'housekeeper';
					} else if (userInfo.ownerId || userInfo.id) {
						userId = userInfo.ownerId || userInfo.id;
						userRole = 'owner';
					} else if (userInfo.role) {
						userId = userInfo.userId || userInfo.id;
						userRole = userInfo.role;
					}

					console.log('🔍 [调试] 解析结果:');
					console.log('  - 用户ID:', userId);
					console.log('  - 用户角色:', userRole);

					if (!userId) {
						console.error('❌ [调试] 无法解析用户ID，后端将使用anonymous!');
						// 🆕 尝试创建测试用户信息
						this.createTestUserInfo();
					}
				} else {
					console.error('❌ [调试] 未找到任何用户信息，后端将使用anonymous!');
					// 🆕 创建测试用户信息
					this.createTestUserInfo();
				}
			} catch (error) {
				console.error('❌ [调试] 调试用户信息时出错:', error);
			}
		},

		// 🆕 创建测试用户信息（临时解决方案）
		createTestUserInfo() {
			try {
				const testUserInfo = {};

				uni.setStorageSync('userInfo', testUserInfo);
				console.log('✅ [调试] 已创建测试用户信息:', testUserInfo);

				// 显示提示
				uni.showToast({
					title: '已创建测试用户身份',
					icon: 'success',
					duration: 2000
				});
			} catch (error) {
				console.error('❌ [调试] 创建测试用户信息失败:', error);
			}
		},

		// 获取用户角色
		getUserRole() {
			try {
				const userInfo = uni.getStorageSync('userInfo');
				if (userInfo && userInfo.role) {
					this.currentUserRole = userInfo.role;
					console.log('📱 [管家违规页面] 获取用户角色:', this.currentUserRole);
				} else {
					console.warn('📱 [管家违规页面] 未找到用户角色信息，使用默认角色');
					this.currentUserRole = 'manager';
				}
			} catch (error) {
				console.error('📱 [管家违规页面] 获取用户角色失败:', error);
				this.currentUserRole = 'manager';
			}
		},

		// TabBar切换事件处理
		onTabChange(tabInfo) {
			console.log('📱 [管家违规页面] TabBar切换:', tabInfo);
		},

		changeTimeRange(index) {
			// 切换时间范围
			this.updateChartData(index)
		},
		changeFilter(index) {
			// 切换筛选条件
			this.filterViolations(index)
		},
		updateChartData(timeRange) {
			// 更新图表数据
		},
		filterViolations(filter) {
			// 筛选违规记录
		},
		refreshList() {
			// 刷新实时违规记录
		},
		handleViolation(id) {
			// 处理违规记录
			uni.showToast({
				title: '处理成功',
				icon: 'success'
			});
		},

		// 显示处理确认弹窗
		showHandleDialog(record) {
			uni.showActionSheet({
				itemList: ['标记为已处理', '发送通知', '记录备注', '取消处理'],
				success: (res) => {
					switch (res.tapIndex) {
						case 0:
							this.markAsProcessed(record);
							break;
						case 1:
							this.sendNotification(record);
							break;
						case 2:
							this.addRemark(record);
							break;
						case 3:
							this.cancelProcess(record);
							break;
					}
				},
				fail: () => {
					console.log('用户取消操作');
				}
			});
		},

		// 标记为已处理
		markAsProcessed(record) {
			uni.showModal({
				title: '确认处理',
				content: `是否将车牌 ${record.plateNumber} 的违规记录标记为已处理？`,
				success: (res) => {
					if (res.confirm) {
						// 更新记录状态
						const index = this.realtimeRecords.findIndex(r => r.id === record.id);
						if (index !== -1) {
							this.$set(this.realtimeRecords[index], 'statusText', '已处理');
							this.$set(this.realtimeRecords[index], 'swiped', false); // 关闭滑动状态
						}
						uni.showToast({
							title: '处理成功',
							icon: 'success'
						});
					}
				}
			});
		},

		// 发送通知
		sendNotification(record) {
			uni.showModal({
				title: '发送通知',
									content: `是否向车主 ${record.ownerName} (${record.ownerPhone}) 发送违规处理通知？`,
				success: (res) => {
					if (res.confirm) {
						// 模拟发送通知
						uni.showLoading({
							title: '发送中...'
						});
						setTimeout(() => {
							uni.hideLoading();
							uni.showToast({
								title: '通知已发送',
								icon: 'success'
							});
							// 关闭滑动状态
							const index = this.realtimeRecords.findIndex(r => r.id === record.id);
							if (index !== -1) {
								this.$set(this.realtimeRecords[index], 'swiped', false);
							}
						}, 1500);
					}
				}
			});
		},

		// 添加备注
		addRemark(record) {
			uni.showModal({
				title: '添加备注',
				content: '请输入处理备注信息',
				editable: true,
				placeholderText: '请输入备注内容...',
				success: (res) => {
					if (res.confirm && res.content) {
						// 保存备注
						const index = this.realtimeRecords.findIndex(r => r.id === record.id);
						if (index !== -1) {
							this.$set(this.realtimeRecords[index], 'remark', res.content);
							this.$set(this.realtimeRecords[index], 'swiped', false);
						}
						uni.showToast({
							title: '备注已保存',
							icon: 'success'
						});
					}
				}
			});
		},

		// 取消处理
		cancelProcess(record) {
			// 关闭滑动状态
			const index = this.realtimeRecords.findIndex(r => r.id === record.id);
			if (index !== -1) {
				this.$set(this.realtimeRecords[index], 'swiped', false);
			}
		},
		// 检查用户角色
		async checkUserRole() {
			try {
				// 这里应该调用后端 API 获取用户角色
				// 临时模拟数据
				const userInfo = await this.getUserInfo();
				this.isHousekeeper = userInfo.role === 'housekeeper';
			} catch (error) {
				console.error('获取用户角色失败:', error);
				uni.showToast({
					title: '获取用户信息失败',
					icon: 'none'
				});
			}
		},

		// ==================== 新增违规记录相关方法 ====================

		// 跳转到新增违规页面
		openAddViolationModal() {
			uni.navigateTo({
				url: '/pagesE/violation/add-violation'
			});
		},

		// 关闭新增违规弹窗
		closeAddViolationModal() {
			this.showAddViolationModal = false;
			this.resetViolationForm();
		},

		// 重置违规表单
		resetViolationForm() {
			this.newViolation = {
				plateNumber: '',
				ownerInfo: null,
				type: '',
				customType: '',
				location: '',
				photos: '',
				voiceMemo: null,
				description: ''
			};
		},

		// 车牌号变化时查询车主信息
		async onPlateNumberChange(plateNumber) {
			if (plateNumber && plateNumber.length >= 7) {
				try {
					// 模拟查询车主信息
					const ownerInfo = await this.getOwnerInfoByPlate(plateNumber);
					this.newViolation.ownerInfo = ownerInfo;
				} catch (error) {
					console.error('查询车主信息失败:', error);
					this.newViolation.ownerInfo = null;
				}
			} else {
				this.newViolation.ownerInfo = null;
			}
		},

		// 根据车牌号查询车主信息
		async getOwnerInfoByPlate(plateNumber) {
			return new Promise((resolve) => {
				// 模拟API调用
				setTimeout(() => {
					// 模拟数据
					const mockOwners = {};
					resolve(mockOwners[plateNumber] || null);
				}, 500);
			});
		},

		// 选择违规类型
		selectViolationType(type) {
			this.newViolation.type = type.value;
			if (type.value !== 'other') {
				this.newViolation.customType = '';
			}
		},

		// 获取当前位置
		getCurrentLocation() {
			uni.getLocation({
				type: 'gcj02',
				success: (res) => {
					// 模拟根据坐标获取地址
					this.newViolation.location = `A区-${Math.floor(Math.random() * 50) + 1}号车位`;
					uni.showToast({
						title: '定位成功',
						icon: 'success'
					});
				},
				fail: () => {
					uni.showToast({
						title: '定位失败',
						icon: 'none'
					});
				}
			});
		},

		// 拍照取证
		takePhoto() {
			uni.chooseImage({
				count: 6 - this.newViolation.photos.length,
				sizeType: ['compressed'],
				sourceType: ['camera'],
				success: (res) => {
					this.newViolation.photos.push(...res.tempFilePaths);
				}
			});
		},

		// 预览照片
		previewPhoto(index) {
			uni.previewImage({
				urls: this.newViolation.photos,
				current: index
			});
		},

		// 删除照片
		deletePhoto(index) {
			this.newViolation.photos.splice(index, 1);
		},

		// 开始录制语音
		startVoiceRecord() {
			const recorderManager = uni.getRecorderManager();

			uni.showModal({
				title: '录制语音备注',
				content: '点击确定开始录制，录制完成后会自动停止',
				success: (res) => {
					if (res.confirm) {
						recorderManager.start({
							duration: 60000, // 最长60秒
							sampleRate: 16000,
							numberOfChannels: 1,
							encodeBitRate: 96000,
							format: 'mp3'
						});

						// 10秒后自动停止
						setTimeout(() => {
							recorderManager.stop();
						}, 10000);

						recorderManager.onStop((res) => {
							this.newViolation.voiceMemo = res.tempFilePath;
							uni.showToast({
								title: '录制完成',
								icon: 'success'
							});
						});
					}
				}
			});
		},

		// 播放语音
		playVoice() {
			const innerAudioContext = uni.createInnerAudioContext();
			innerAudioContext.src = this.newViolation.voiceMemo;
			innerAudioContext.play();
		},

		// 删除语音
		deleteVoice() {
			this.newViolation.voiceMemo = null;
		},

		// 提交违规记录
		async submitViolation() {
			// 表单验证
			if (!this.newViolation.plateNumber) {
				uni.showToast({
					title: '请输入车牌号',
					icon: 'none'
				});
				return;
			}

			if (!this.newViolation.type) {
				uni.showToast({
					title: '请选择违规类型',
					icon: 'none'
				});
				return;
			}

			if (this.newViolation.type === 'other' && !this.newViolation.customType) {
				uni.showToast({
					title: '请输入自定义违规类型',
					icon: 'none'
				});
				return;
			}

			if (!this.newViolation.location) {
				uni.showToast({
					title: '请输入违规位置',
					icon: 'none'
				});
				return;
			}

			this.submitting = true;

			try {
				// 模拟提交API
				await this.submitViolationToServer();

				uni.showToast({
					title: '提交成功',
					icon: 'success'
				});

				// 关闭弹窗并刷新列表
				this.closeAddViolationModal();
				this.refreshViolationList();

			} catch (error) {
				console.error('提交失败:', error);
				uni.showToast({
					title: '提交失败',
					icon: 'none'
				});
			} finally {
				this.submitting = false;
			}
		},

		// 提交违规记录到服务器
		async submitViolationToServer() {
			return new Promise((resolve) => {
				// 模拟API调用
				setTimeout(() => {
					resolve({
						success: true
					});
				}, 2000);
			});
		},

		// 刷新违规列表
		refreshViolationList() {
			// 重新加载违规记录列表
			this.getInitialData();
		},

		// 打开车牌扫描
		openPlateScanner() {
			this.showPlateScanModal = true;
			this.scanResult = '';
		},

		// 关闭车牌扫描
		closePlateScanner() {
			this.showPlateScanModal = false;
			this.scanResult = '';
		},

		// 开始扫描
		startScan() {
			// 模拟扫描过程
			uni.showLoading({
				title: '识别中...'
			});

			setTimeout(() => {
				uni.hideLoading();
				// 模拟识别结果
				const mockPlates = ['黑A12345', '黑B67890', '黑C98765', '黑D11111'];
				this.scanResult = mockPlates[Math.floor(Math.random() * mockPlates.length)];
			}, 2000);
		},

		// 使用扫描结果
		useScanResult() {
			this.newViolation.plateNumber = this.scanResult;
			this.onPlateNumberChange(this.scanResult);
			this.closePlateScanner();
		},

		// 重新扫描
		rescan() {
			this.scanResult = '';
			this.startScan();
		},

		// 获取用户信息
		getUserInfo() {
			return new Promise((resolve, reject) => {
				try {
					// 从本地存储获取真实的用户信息
					const userInfo = uni.getStorageSync('userInfo');
					console.log('🔍 [获取用户信息] 从存储中获取到的用户信息:', userInfo);

					if (userInfo) {
						// 根据不同的用户信息格式处理
						let processedUserInfo = {
							role: 'user',
							userId: null,
							username: null,
							phone: null
						};

						// 巡逻员身份
						if (userInfo.patrolData && userInfo.patrolData.username) {
							processedUserInfo.role = 'patrol';
							processedUserInfo.userId = userInfo.patrolData.id || userInfo.patrolData.userId || userInfo.userId;
							processedUserInfo.username = userInfo.patrolData.username;
							processedUserInfo.phone = userInfo.patrolData.phone;
						}
						// 管家身份
						else if (userInfo.userInfo && userInfo.userInfo.username) {
							processedUserInfo.role = 'housekeeper';
							processedUserInfo.userId = userInfo.userInfo.id || userInfo.userId;
							processedUserInfo.username = userInfo.userInfo.username;
							processedUserInfo.phone = userInfo.userInfo.phone;
						}
						// 业主身份
						else if (userInfo.ownerId || userInfo.id) {
							processedUserInfo.role = 'user';
							processedUserInfo.userId = userInfo.ownerId || userInfo.id;
							processedUserInfo.username = userInfo.ownername || userInfo.name;
							processedUserInfo.phone = userInfo.phone;
						}
						// 访客身份
						else if (userInfo.role === 'visitor' || userInfo.phone) {
							processedUserInfo.role = 'visitor';
							processedUserInfo.userId = userInfo.id || 'visitor_' + Date.now();
							processedUserInfo.username = userInfo.nickname || userInfo.name || '访客用户';
							processedUserInfo.phone = userInfo.phone;
						}
						// 通用格式处理
						else if (userInfo.role) {
							processedUserInfo.role = userInfo.role;
							processedUserInfo.userId = userInfo.userId || userInfo.id;
							processedUserInfo.username = userInfo.username || userInfo.name;
							processedUserInfo.phone = userInfo.phone;
						}

						console.log('✅ [获取用户信息] 处理后的用户信息:', processedUserInfo);
						resolve(processedUserInfo);
					} else {
						console.warn('⚠️ [获取用户信息] 未找到存储的用户信息，返回默认值');
						resolve({
							role: 'user',
							userId: 'anonymous',
							username: '匿名用户',
							phone: ''
						});
					}
				} catch (error) {
					console.error('❌ [获取用户信息] 获取用户信息失败:', error);
					reject(error);
				}
			});
		},
		// 获取初始数据
		async getInitialData() {
			try {
				// 根据用户角色加载不同的数据
				if (this.isHousekeeper) {
					await this.getHousekeeperData();
				} else {
					await this.getUserViolationData();
				}
			} catch (error) {
				console.error('获取数据失败:', error);
				uni.showToast({
					title: '获取数据失败',
					icon: 'none'
				});
			}
		},
		// 获取用户违规数据
		async getUserViolationData() {
			try {
				// 这里应该是实际的 API 调用
				// 临时模拟数据
				// const response = await new Promise(resolve => {
				// 	setTimeout(() => {
				// 		resolve({
				// 			creditScore: 85,
				// 			monthViolations: 2,
				// 			totalViolations: 5,
				// 			lastViolationDate: '2025-03-20',
				// 			violationList: []
				// 		});
				// 	}, 500);
				// });
				console.log("响应的数据：", response.violationList)
				// 更新数据
				this.creditScore = response.creditScore;
				this.monthViolations = response.monthViolations;
				this.totalViolations = response.totalViolations;
				this.lastViolationDate = response.lastViolationDate;
				this.violationList = response.violationList;
				// 更新图表数据
				this.updateChartData(0); // 默认显示周数据
			} catch (error) {
				throw error;
			}
		},
		// 获取管家数据
		async getHousekeeperData() {
			try {
				// 获取实时违规记录
				await this.loadRealtimeViolations();

				// 设置日期范围
				this.weekDateRange = this.getLastWeekDateRange();

				// 基于实时违规记录统计高风险车辆
				await this.updateStatisticsData();
			} catch (error) {
				console.error('获取管家数据失败:', error);
				// 不重新抛出错误，因为loadRealtimeViolations已经设置了备用数据
				console.log('📋 使用备用数据继续运行，实时记录数量:', this.realtimeRecords.length);

				// 设置日期范围
				this.weekDateRange = this.getLastWeekDateRange();

				// 基于备用数据统计高风险车辆
				await this.updateStatisticsData();
			}
		},

		// 获取状态文本
		getStatusText(status) {
			const statusMap = {
				'pending': '待处理',
				'processing': '处理中',
				'completed': '已完成',
				'cancelled': '已取消'
			};
			return statusMap[status] || status || '未知';
		},

		// 智能搜索相关方法
		handleSearchFocus() {
			this.searchFocused = true;
			this.showSearchHistory = false;
			if (this.searchKeyword && typeof this.searchKeyword === 'string' && this.searchKeyword.trim()) {
				this.generateSearchSuggestions(this.searchKeyword);
			}
		},

		handleSearchBlur() {
			// 延迟失焦，避免点击建议项时输入框已失焦
			setTimeout(() => {
				this.searchFocused = false;
				this.showSuggestions = false;
			}, 200);
		},

		handleSearchInput(e) {
			let value = '';

			// 更安全的值提取
			if (e && typeof e === 'object') {
				if (e.detail && typeof e.detail.value !== 'undefined') {
					value = e.detail.value;
				} else if (e.target && typeof e.target.value !== 'undefined') {
					value = e.target.value;
				}
			} else if (typeof e === 'string') {
				value = e;
			}

			// 确保值是字符串
			this.searchKeyword = String(value || '');

			if (this.searchKeyword && this.searchKeyword.trim()) {
				this.generateSearchSuggestions(this.searchKeyword);
				this.showSuggestions = true;
			} else {
				this.showSuggestions = false;
				// 如果搜索框为空，恢复原始数据
				this.restoreOriginalData();
			}
		},

		async generateSearchSuggestions(keyword) {
			if (!keyword || typeof keyword !== 'string') return;

			try {
				// 使用API获取搜索建议
				const suggestions = await ownerApi.getPlateSuggestions(keyword);

				// 转换API返回的数据格式
				this.searchSuggestions = suggestions.map(item => ({
					text: item.plateNumber,
					type: 'plate',
					ownerName: item.ownerName,
					creditScore: item.creditScore,
					isNewEnergy: item.isNewEnergy
				}));

				// 如果API返回的建议较少，补充本地数据
				if (this.searchSuggestions.length < 5) {
					this.addLocalSuggestions(keyword);
				}
			} catch (error) {
				console.error('获取搜索建议失败:', error);
				// 如果API失败，使用本地数据生成建议
				this.generateLocalSuggestions(keyword);
			}
		},

		// 生成本地搜索建议（作为API的备选方案）
		generateLocalSuggestions(keyword) {
			const suggestions = [];
			const searchValue = keyword.toLowerCase().trim();

			// 从高风险车辆中生成建议
			this.originalHighRiskCars.forEach(car => {
				// 车牌号建议 - 兼容多种字段名
				const plateNumber = car.plateNumber || car.plate_number;
				if (plateNumber && plateNumber.toLowerCase().includes(searchValue)) {
					const existing = suggestions.find(s => s.text === plateNumber && s.type === 'plate');
					if (!existing) {
						suggestions.push({
							text: plateNumber,
							type: 'plate'
						});
					}
				}

				// 业主姓名建议 - 兼容多种字段名
				const ownerName = car.ownerName || car.owner_name || car.name || car.ownername || car.parkName;
				if (ownerName && ownerName.toLowerCase().includes(searchValue)) {
					const existing = suggestions.find(s => s.text === ownerName && s.type === 'name');
					if (!existing) {
						suggestions.push({
							text: ownerName,
							type: 'name'
						});
					}
				}

				// 🔧 新增：手机号建议
				const phone = car.phone || car.ownerPhone || car.owner_phone;
				if (phone && phone.includes(searchValue)) {
					const existing = suggestions.find(s => s.text === phone && s.type === 'phone');
					if (!existing) {
						suggestions.push({
							text: phone,
							type: 'phone'
						});
					}
				}
			});

			// 从实时违规记录中生成建议
			this.originalRealtimeRecords.forEach(record => {
				// 车牌号建议 - 兼容多种字段名
				const plateNumber = record.plateNumber || record.plate_number;
				if (plateNumber && plateNumber.toLowerCase().includes(searchValue)) {
					const existing = suggestions.find(s => s.text === plateNumber && s.type === 'plate');
					if (!existing) {
						suggestions.push({
							text: plateNumber,
							type: 'plate'
						});
					}
				}

				// 🔧 新增：业主姓名建议
				const ownerName = record.ownerName || record.owner_name || record.name || record.ownername || record.parkName;
				if (ownerName && ownerName.toLowerCase().includes(searchValue)) {
					const existing = suggestions.find(s => s.text === ownerName && s.type === 'name');
					if (!existing) {
						suggestions.push({
							text: ownerName,
							type: 'name'
						});
					}
				}

				// 🔧 新增：手机号建议
				const phone = record.ownerPhone || record.owner_phone || record.phone;
				if (phone && phone.includes(searchValue)) {
					const existing = suggestions.find(s => s.text === phone && s.type === 'phone');
					if (!existing) {
						suggestions.push({
							text: phone,
							type: 'phone'
						});
					}
				}

				// 违规类型建议 - 兼容多种字段名
				const violationType = record.violationType || record.violation_type;
				if (violationType && violationType.toLowerCase().includes(searchValue)) {
					const existing = suggestions.find(s => s.text === violationType && s.type === 'violation');
					if (!existing) {
						suggestions.push({
							text: violationType,
							type: 'violation'
						});
					}
				}
			});

			// 限制建议数量并设置
			this.searchSuggestions = suggestions.slice(0, 10);
		},

		// 补充本地建议数据
		addLocalSuggestions(keyword) {
			// 这个方法用于在API返回建议较少时补充本地数据
			this.generateLocalSuggestions(keyword);
		},

		// 获取当前日期
		getCurrentDate() {
			const now = new Date();
			return now.toISOString().split('T')[0];
		},

		// 获取上周日期
		getLastWeekDate() {
			const now = new Date();
			const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			return lastWeek.toISOString().split('T')[0];
		},

		// 获取上周日期范围显示文本
		getLastWeekDateRange() {
			const now = new Date();
			const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

			const formatDate = (date) => {
				const year = date.getFullYear();
				const month = String(date.getMonth() + 1).padStart(2, '0');
				const day = String(date.getDate()).padStart(2, '0');
				return `${year}.${month}.${day}`;
			};

			return `${formatDate(lastWeek)}-${formatDate(now)}`;
		},

		selectSuggestion(suggestion) {
			this.searchKeyword = String(suggestion.text || '');
			this.showSuggestions = false;
			this.searchFocused = false;

			// 执行搜索
			this.performSearch();

			// 保存到搜索历史
			this.saveSearchHistory(this.searchKeyword, suggestion.type);
		},

		getSuggestionTypeText(type) {
			const typeMap = {
				plate: '车牌号',
				name: '业主姓名',
				phone: '手机号码',
				violation: '违规类型',
				reason: '预约原因',
				address: '地址'
			};
			return typeMap[type] || '其他';
		},

		performSearch() {
			if (!this.searchKeyword || typeof this.searchKeyword !== 'string' || !this.searchKeyword.trim()) {
				// 如果搜索框为空，恢复原始数据
				this.restoreOriginalData();
				return;
			}

			// 如果是第一次搜索，保存原始数据
			this.saveOriginalDataIfNeeded();

			// 执行搜索
			const searchValue = this.searchKeyword.toLowerCase().trim();

			// 1. 筛选高风险车辆
			this.highRiskCars = this.originalHighRiskCars.filter(car => {
				// 检查车辆基本信息 - 兼容多种字段名
				const carMatches = (
					(car.plateNumber && car.plateNumber.toLowerCase().includes(searchValue)) ||
					(car.plate_number && car.plate_number.toLowerCase().includes(searchValue)) ||
					(car.ownerName && car.ownerName.toLowerCase().includes(searchValue)) ||
					(car.owner_name && car.owner_name.toLowerCase().includes(searchValue)) ||
					(car.name && car.name.toLowerCase().includes(searchValue)) ||
					(car.ownername && car.ownername.toLowerCase().includes(searchValue)) ||
					(car.parkName && car.parkName.toLowerCase().includes(searchValue)) ||
					(car.phone && car.phone.includes(searchValue)) ||
					(car.ownerPhone && car.ownerPhone.includes(searchValue)) ||
					(car.owner_phone && car.owner_phone.includes(searchValue)) ||
					(car.address && car.address.toLowerCase().includes(searchValue)) ||
					(car.ownerAddress && car.ownerAddress.toLowerCase().includes(searchValue)) ||
					(car.owner_address && car.owner_address.toLowerCase().includes(searchValue))
				);

				// 检查违规记录详情
				const violationMatches = car.violations && car.violations.some(violation => {
					return (
						(violation.violationType && violation.violationType.toLowerCase().includes(
							searchValue)) ||
						(violation.violation_type && violation.violation_type.toLowerCase().includes(
							searchValue)) ||
						(violation.appointmentReason && violation.appointmentReason.toLowerCase()
							.includes(searchValue)) ||
						(violation.appointment_reason && violation.appointment_reason.toLowerCase()
							.includes(searchValue))
					);
				});

				return carMatches || violationMatches;
			});

			// 2. 筛选实时违规记录
			this.realtimeRecords = this.originalRealtimeRecords.filter(record => {
				return (
					// 搜索车牌号
					(record.plateNumber && record.plateNumber.toLowerCase().includes(searchValue)) ||
					(record.plate_number && record.plate_number.toLowerCase().includes(searchValue)) ||
					// 搜索业主姓名 - 兼容多种字段名
					(record.ownerName && record.ownerName.toLowerCase().includes(searchValue)) ||
					(record.owner_name && record.owner_name.toLowerCase().includes(searchValue)) ||
					(record.name && record.name.toLowerCase().includes(searchValue)) ||
					(record.ownername && record.ownername.toLowerCase().includes(searchValue)) ||
					(record.parkName && record.parkName.toLowerCase().includes(searchValue)) ||
					// 搜索手机号 - 兼容多种字段名
					(record.ownerPhone && record.ownerPhone.includes(searchValue)) ||
					(record.owner_phone && record.owner_phone.includes(searchValue)) ||
					(record.phone && record.phone.includes(searchValue)) ||
					// 搜索违规类型
					(record.violationType && record.violationType.toLowerCase().includes(searchValue)) ||
					(record.violation_type && record.violation_type.toLowerCase().includes(searchValue)) ||
					// 搜索地址
					(record.address && record.address.toLowerCase().includes(searchValue)) ||
					(record.ownerAddress && record.ownerAddress.toLowerCase().includes(searchValue)) ||
					(record.owner_address && record.owner_address.toLowerCase().includes(searchValue)) ||
					// 搜索预约原因
					(record.appointmentReason && record.appointmentReason.toLowerCase().includes(
						searchValue)) ||
					(record.appointment_reason && record.appointment_reason.toLowerCase().includes(
						searchValue))
				);
			}).sort((a, b) => {
				// 按预约时间降序排序（预约时间越晚越靠前）
				const timeA = new Date(a.appointmentTime).getTime();
				const timeB = new Date(b.appointmentTime).getTime();
				return timeB - timeA;
			});

			// 保存到搜索历史
			this.saveSearchHistory(this.searchKeyword, this.detectSearchType(this.searchKeyword));
			
			// 🔧 调试信息：输出搜索结果
			console.log('🔍 [调试] 搜索结果:', {
				searchKeyword: this.searchKeyword,
				searchValue: searchValue,
				originalRecordsCount: this.originalRealtimeRecords.length,
				filteredRecordsCount: this.realtimeRecords.length,
				sampleRecord: this.originalRealtimeRecords[0] // 输出第一条记录的字段结构
			});
			
			// 🔧 新增：强制更新组件以确保违规统计卡片正确更新
			this.$forceUpdate();
			
			// 显示搜索结果统计
			// 🔧 修复：只统计违规记录数量，因为违规记录已经包含了车辆信息
			const totalResults = this.realtimeRecords.length;
			const inProgressCount = this.getRealtimeInProgressCount();
			const leftCount = this.getRealtimeLeftCount();
			
			// 获取涉及的车牌号数量（去重）
			const uniquePlates = [...new Set(this.realtimeRecords.map(record => record.plateNumber).filter(Boolean))];
			const uniquePlateCount = uniquePlates.length;
			
			uni.showToast({
				title: `找到${totalResults}条违规记录(涉及${uniquePlateCount}辆车) 进场:${inProgressCount} 离场:${leftCount}`,
				icon: 'none',
				duration: 3000
			});
		},

		// 保存原始数据（如果需要）
		saveOriginalDataIfNeeded() {
			if (!this.originalRealtimeRecords.length) {
				this.originalRealtimeRecords = [...this.realtimeRecords];
			}
			if (!this.originalHighRiskCars.length) {
				this.originalHighRiskCars = [...this.highRiskCars];
			}
		},

		// 恢复原始数据
		restoreOriginalData() {
			if (this.originalRealtimeRecords.length) {
				this.realtimeRecords = [...this.originalRealtimeRecords].sort((a, b) => {
					// 按预约时间降序排序（预约时间越晚越靠前）
					const timeA = new Date(a.appointmentTime).getTime();
					const timeB = new Date(b.appointmentTime).getTime();
					return timeB - timeA;
				});
			}
			if (this.originalHighRiskCars.length) {
				this.highRiskCars = [...this.originalHighRiskCars];
			}
		},

		clearSearch() {
			this.searchKeyword = '';
			this.showSuggestions = false;
			this.showSearchHistory = false;
			this.searchFocused = false;
			// 恢复原始数据
			this.restoreOriginalData();
			// 强制更新组件
			this.$forceUpdate();
		},

		detectSearchType(keyword) {
			// 检测搜索关键词类型
			if (/^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼][A-Z][A-Z0-9]{4,5}[A-Z0-9挂学警港澳]?$/.test(keyword)) {
				return 'plate';
			}
			if (/^1[3-9]\d{9}$/.test(keyword)) {
				return 'phone';
			}
			if (/^[\u4e00-\u9fa5]{2,4}$/.test(keyword)) {
				return 'name';
			}
			return 'other';
		},

		toggleSearchHistory() {
			this.showSearchHistory = !this.showSearchHistory;
			if (this.showSearchHistory) {
				this.showSuggestions = false;
				this.searchFocused = false;
			}
		},

		saveSearchHistory(keyword, type) {
			// 避免重复添加
			const existingIndex = this.searchHistory.findIndex(item => item.keyword === keyword);
			if (existingIndex !== -1) {
				// 更新时间并移到最前面
				this.searchHistory.splice(existingIndex, 1);
			}

			// 添加到历史记录开头
			this.searchHistory.unshift({
				keyword,
				type,
				time: Date.now()
			});

			// 限制历史记录数量
			if (this.searchHistory.length > 20) {
				this.searchHistory = this.searchHistory.slice(0, 20);
			}

			// 保存到本地存储
			try {
				uni.setStorageSync('violation_search_history', this.searchHistory);
			} catch (e) {
				console.error('保存搜索历史失败:', e);
			}

			// 更新热门搜索标签
			this.updateHotSearchTags();
		},

		loadSearchHistory() {
			try {
				const history = uni.getStorageSync('violation_search_history');
				if (history && Array.isArray(history)) {
					this.searchHistory = history;
					// 加载搜索历史后更新热门搜索标签
					this.updateHotSearchTags();
				}
			} catch (e) {
				console.error('加载搜索历史失败:', e);
			}
		},

		clearSearchHistory() {
			this.searchHistory = [];
			try {
				uni.removeStorageSync('violation_search_history');
			} catch (e) {
				console.error('清空搜索历史失败:', e);
			}
			// 清空搜索历史后重置热门搜索为默认值
			this.updateHotSearchTags();
			uni.showToast({
				title: '已清空搜索历史',
				icon: 'success'
			});
		},

		useHistorySearch(item) {
			this.searchKeyword = String(item.keyword || '');
			this.showSearchHistory = false;
			this.performSearch();
		},

		removeSearchHistory(index) {
			this.searchHistory.splice(index, 1);
			try {
				uni.setStorageSync('violation_search_history', this.searchHistory);
			} catch (e) {
				console.error('保存搜索历史失败:', e);
			}
		},

		formatHistoryTime(timestamp) {
			const now = Date.now();
			const diff = now - timestamp;
			const minutes = Math.floor(diff / (1000 * 60));
			const hours = Math.floor(diff / (1000 * 60 * 60));
			const days = Math.floor(diff / (1000 * 60 * 60 * 24));

			if (minutes < 1) return '刚刚';
			if (minutes < 60) return `${minutes}分钟前`;
			if (hours < 24) return `${hours}小时前`;
			if (days < 7) return `${days}天前`;

			const date = new Date(timestamp);
			return `${date.getMonth() + 1}/${date.getDate()}`;
		},

		useHotSearch(tag) {
			this.searchKeyword = String(tag.text || '');
			this.performSearch();
			// 使用热门搜索时也保存到搜索历史
			this.saveSearchHistory(this.searchKeyword, tag.type);
		},

		// 清空搜索输入框
		clearSearchInput() {
			this.searchKeyword = '';
			this.showSuggestions = false;
			this.searchFocused = false;
			// 恢复原始数据
			this.restoreOriginalData();
		},

		// 更新热门搜索标签
		updateHotSearchTags() {
			// 统计搜索历史中各关键词的搜索次数
			const searchCounts = {};

			this.searchHistory.forEach(item => {
				const key = item.keyword;
				if (searchCounts[key]) {
					searchCounts[key].count++;
					// 更新最新搜索时间
					if (item.time > searchCounts[key].lastTime) {
						searchCounts[key].lastTime = item.time;
						searchCounts[key].type = item.type;
					}
				} else {
					searchCounts[key] = {
						text: key,
						type: item.type,
						count: 1,
						lastTime: item.time
					};
				}
			});

			// 转换为数组并按搜索次数和时间排序
			const hotSearchArray = Object.values(searchCounts)
				.filter(item => item.count >= 1) // 至少搜索过1次
				.sort((a, b) => {
					// 首先按搜索次数降序排序
					if (b.count !== a.count) {
						return b.count - a.count;
					}
					// 搜索次数相同时，按最新搜索时间降序排序
					return b.lastTime - a.lastTime;
				})
				.slice(0, 8); // 限制显示8个热门搜索

			// 如果动态生成的热门搜索不足8个，补充一些默认的热门搜索
			const defaultHotSearch = [];

			// 补充默认热门搜索（排除已存在的）
			const existingTexts = hotSearchArray.map(item => item.text);
			const additionalHotSearch = defaultHotSearch
				.filter(item => !existingTexts.includes(item.text))
				.slice(0, 8 - hotSearchArray.length);

			// 合并动态生成的和默认的热门搜索
			this.hotSearchTags = [...hotSearchArray, ...additionalHotSearch];

			console.log('🔥 [热门搜索] 更新热门搜索标签:', this.hotSearchTags);
		},

		openQuickFilter() {
			uni.showActionSheet({
				itemList: ['全部记录', '未离场', '已离场', '已离场固定状态', '今日违规', '本周违规'],
				success: (res) => {
					switch (res.tapIndex) {
						case 0:
							this.clearAllFilters();
							break;
						case 1:
							this.selectRealtimeStatus('in-progress');
							break;
						case 2:
							this.selectRealtimeStatus('has-left');
							break;
						case 3:
							this.selectRealtimeStatus('has-left-fixed');
							break;
						case 4:
							this.filterByToday();
							break;
						case 5:
							this.filterByThisWeek();
							break;
					}
				}
			});
		},

		clearAllFilters() {
			this.realtimeSelectedStatus = '';
			this.statisticsSelectedStatus = '';
			this.searchKeyword = '';
			this.showSuggestions = false;
			this.showSearchHistory = false;
			this.searchFocused = false;
			// 恢复所有原始数据
			this.restoreOriginalData();
			uni.showToast({
				title: '已清除所有筛选',
				icon: 'success'
			});
		},

		filterByToday() {
			const today = new Date();
			const todayStr = this.formatDate(today);

			if (this.originalRealtimeRecords.length) {
				this.realtimeRecords = this.originalRealtimeRecords.filter(record => {
					const createdDate = (record.createdAt || record.created_at || record.appointmentTime) ? 
						(record.createdAt || record.created_at || record.appointmentTime).split(' ')[0] : '';
					return createdDate === todayStr;
				}).sort((a, b) => {
					// 按创建时间降序排序（创建时间越晚越靠前）
					const timeA = new Date(a.createdAt || a.created_at || a.appointmentTime).getTime();
					const timeB = new Date(b.createdAt || b.created_at || b.appointmentTime).getTime();
					return timeB - timeA;
				});
			}

			uni.showToast({
				title: `今日违规${this.realtimeRecords.length}条`,
				icon: 'none'
			});
		},

		filterByThisWeek() {
			const now = new Date();
			const startOfWeek = new Date(now);
			startOfWeek.setDate(now.getDate() - now.getDay());
			startOfWeek.setHours(0, 0, 0, 0);

			if (this.originalRealtimeRecords.length) {
				this.realtimeRecords = this.originalRealtimeRecords.filter(record => {
					const createdTime = new Date(record.createdAt || record.created_at || record.appointmentTime);
					return createdTime >= startOfWeek;
				}).sort((a, b) => {
					// 按创建时间降序排序（创建时间越晚越靠前）
					const timeA = new Date(a.createdAt || a.created_at || a.appointmentTime).getTime();
					const timeB = new Date(b.createdAt || b.created_at || b.appointmentTime).getTime();
					return timeB - timeA;
				});
			}

			uni.showToast({
				title: `本周违规${this.realtimeRecords.length}条`,
				icon: 'none'
			});
		},
		resetSearch() {
			this.searchKeyword = '';
			if (this.originalRealtimeRecords.length) {
				this.realtimeRecords = [...this.originalRealtimeRecords].sort((a, b) => {
					// 按预约时间降序排序（预约时间越晚越靠前）
					const timeA = new Date(a.appointmentTime).getTime();
					const timeB = new Date(b.appointmentTime).getTime();
					return timeB - timeA;
				});
			}
		},
		showCalendar() {
			// 如果已经有选择的日期范围，就使用已选择的；否则使用默认的最近7天
			const endDate = this.endDate || this.getCurrentDate();
			const startDate = this.startDate || this.getLastWeekDate();
			this.calendarDefaultDate = [startDate, endDate];
			this.showCalendarPicker = true;
		},
		onCalendarConfirm(e) {
			if (e) {
				this.startDate = e[0];
				this.endDate = e[e.length - 1];
				this.showCalendarPicker = false;
				// 更新数据
				this.updateDataByDateRange();
			} else {
				uni.showToast({
					title: '请选择日期范围',
					icon: 'none'
				});
			}
		},
		toggleViolationDetails(index) {
			this.highRiskCars[index].isExpanded = !this.highRiskCars[index].isExpanded;
		},

		// 切换违规记录展开/折叠状态
		toggleViolationItem(index) {
			this.$set(this.violationList[index], 'isExpanded', !this.violationList[index].isExpanded);
		},

		// 切换实时违规记录展开/折叠状态
		toggleRealtimeViolationItem(index) {
			this.$set(this.realtimeRecords[index], 'isExpanded', !this.realtimeRecords[index].isExpanded);
		},



		// 获取状态简短文本
		getStatusShortText(statusText) {
			switch (statusText) {
				case '已处理':
					return '已离场';
				case '处理中':
					return '在场';
				default:
					return statusText;
			}
		},

		// 获取简化的违规原因
		getShortReason(reason) {
			if (!reason) return '未知';
			// 简化常见的违规原因
			const reasonMap = {
				'堵塞消防通道': '消防通道',
				'压线停车': '压线停车',
				'占用VIP车位': 'VIP车位',
				'超时停车': '超时停车',
				'未按规定停车': '违规停车'
			};
			return reasonMap[reason] || (reason.length > 6 ? reason.substring(0, 6) + '...' : reason);
		},

		// 获取相对时间显示
		getRelativeTime(timeStr) {
			if (!timeStr) return '';

			// 确保timeStr是可以被Date构造函数识别的格式
			let dateObj;
			
			if (typeof timeStr === 'number') {
				// 如果是时间戳，直接创建Date对象
				dateObj = new Date(timeStr);
			} else if (timeStr instanceof Date) {
				// 如果是Date对象，直接使用
				dateObj = timeStr;
			} else if (typeof timeStr === 'string') {
				// 如果是字符串，尝试解析
				dateObj = new Date(timeStr);
			} else {
				// 其他类型，尝试转换
				dateObj = new Date(timeStr);
			}

			// 检查日期是否有效
			if (isNaN(dateObj.getTime())) {
				console.warn('getRelativeTime: 无效的日期格式:', timeStr);
				return '无效时间';
			}

			const now = new Date();
			const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			const targetDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());

			const diffDays = Math.floor((targetDate - today) / (1000 * 60 * 60 * 24));
			
			// 格式化时间部分
			const timeOnly = dateObj.toTimeString().split(' ')[0].substring(0, 5); // HH:MM格式

			if (diffDays === 0) {
				return `今天 ${timeOnly}`;
			} else if (diffDays === -1) {
				return `昨天 ${timeOnly}`;
			} else if (diffDays === 1) {
				return `明天 ${timeOnly}`;
			} else if (diffDays > 1 && diffDays <= 7) {
				return `${diffDays}天后 ${timeOnly}`;
			} else if (diffDays < -1 && diffDays >= -7) {
				return `${Math.abs(diffDays)}天前 ${timeOnly}`;
			} else {
				// 超出一周范围，显示具体日期
				const month = String(dateObj.getMonth() + 1).padStart(2, '0');
				const day = String(dateObj.getDate()).padStart(2, '0');
				return `${month}-${day} ${timeOnly}`;
			}
		},

		// 计算停车时长
		getParkingDuration(record) {
			if (!record) return '';

			// 如果有离场时间，计算停车时长
			if (record.enterTime && record.leaveTime) {
				const enterTime = new Date(record.enterTime);
				const leaveTime = new Date(record.leaveTime);
				const diffMs = leaveTime.getTime() - enterTime.getTime();
				return this.formatDuration(diffMs);
			}
			// 如果只有进场时间，计算当前停车时长
			else if (record.enterTime && !record.leaveTime) {
				const enterTime = new Date(record.enterTime);
				const now = new Date();
				const diffMs = now.getTime() - enterTime.getTime();
				return this.formatDuration(diffMs) + ' (在场)';
			}
			// 如果未入场，计算等待时长
			else if (!record.enterTime) {
				const appointmentTime = new Date(record.appointmentTime);
				const now = new Date();
				const diffMs = now.getTime() - appointmentTime.getTime();
				return '等待 ' + this.formatDuration(diffMs);
			}

			return '';
		},

		// 计算停车时长（简化版本，只接收进场时间）
		calculateParkingDuration(enterTime) {
			if (!enterTime) return '';
			const enter = new Date(enterTime);
			const now = new Date();
			const diffMs = now.getTime() - enter.getTime();
			
			const hours = Math.floor(diffMs / (1000 * 60 * 60));
			const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
			
			if (hours > 0) {
				return `${hours}小时${minutes}分钟`;
			} else {
				return `${minutes}分钟`;
			}
		},

		// 格式化时长显示
		formatDuration(milliseconds) {
			if (milliseconds < 0) return '0分钟';

			const hours = Math.floor(milliseconds / (1000 * 60 * 60));
			const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

			if (hours > 0) {
				return `${hours}小时${minutes}分钟`;
			} else {
				return `${minutes}分钟`;
			}
		},

		// 获取当前日期
		getCurrentDate() {
			const date = new Date();
			const result = this.formatDate(date);
			console.log('getCurrentDate 方法调用 - 当前时间：', result);
			console.log('getCurrentDate 方法调用 - Date对象：', date);
			return result;
		},

		// 获取一周前的日期
		getLastWeekDate() {
			const date = new Date();
			date.setDate(date.getDate() - 7);
			const result = this.formatDate(date);
			console.log('getLastWeekDate 方法调用 - 一周前：', result);
			return result;
		},

		// 格式化日期
		formatDate(date) {
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			const result = `${year}-${month}-${day}`;
			console.log('formatDate 方法调用 - 输入：', date, '输出：', result);
			return result;
		},

		// 更新日期范围内的数据
		updateDataByDateRange() {
			try {
				// 使用完整的日期时间进行比较
				const startTime = new Date(this.startDate + ' 00:00:00').getTime();
				const endTime = new Date(this.endDate + ' 23:59:59').getTime();

				// 创建一个Map来统计日期范围内每辆车的违规次数和信息
				const violationStats = new Map();

				// 遍历实时违规记录，只统计在选定日期范围内的记录
				this.realtimeRecords.forEach(record => {
					// 使用预约时间进行筛选
					const appointmentTime = new Date(record.appointmentTime).getTime();

					// 检查预约时间是否在选定范围内
					if (appointmentTime >= startTime && appointmentTime <= endTime) {
						const plateNumber = record.plateNumber;

						if (!violationStats.has(plateNumber)) {
							// 初始化该车辆的统计信息
							violationStats.set(plateNumber, {
								plateNumber,
								count: 0,
								ownerName: record.ownerName || '',
								phone: record.ownerPhone || '',
								address: record.address || '',
								isNewEnergy: this.isNewEnergyPlate(plateNumber),
								isExpanded: false,
								violations: []
							});
						}

						const carStats = violationStats.get(plateNumber);
						carStats.count++;

						// 更新车主信息
						if (record.ownerName) carStats.ownerName = record.ownerName;
						if (record.ownerPhone) carStats.phone = record.ownerPhone;
						if (record.address) carStats.address = record.address;

						// 添加违规记录
						carStats.violations.push({
							time: record.time,
							violationType: record.violationType,
							status: record.status,
							appointmentReason: record.appointmentReason,
							enterTime: record.enterTime,
							leaveTime: record.leaveTime,
							appointmentTime: record.appointmentTime,
							violationLocation: record.location || record.violationLocation || 'A区-15号车位', // 添加违规位置
							photos: this.parsePhotos(record.photos) // 添加照片数据
						});
					}
				});

				// 筛选出违规次数超过3次的车辆并按违规次数降序排序
				this.highRiskCars = Array.from(violationStats.values())
					.filter(car => car.count >= 3)
					.sort((a, b) => b.count - a.count);

				// 更新实时违规记录显示
				if (this.originalRealtimeRecords.length) {
					this.realtimeRecords = this.originalRealtimeRecords.filter(record => {
						const appointmentTime = new Date(record.appointmentTime).getTime();
						return appointmentTime >= startTime && appointmentTime <= endTime;
					}).sort((a, b) => {
						// 按预约时间降序排序（预约时间越晚越靠前）
						const timeA = new Date(a.appointmentTime).getTime();
						const timeB = new Date(b.appointmentTime).getTime();
						return timeB - timeA;
					});
				}

				// 显示筛选结果提示
				uni.showToast({
					title: `已筛选出${this.highRiskCars.length}辆高风险车辆`,
					icon: 'none',
					duration: 2000
				});

			} catch (error) {
				console.error('更新日期范围数据失败:', error);
				uni.showToast({
					title: '筛选数据失败',
					icon: 'none'
				});
			}
		},
		isNewEnergyPlate(plateNumber) {
			// 简化判断逻辑，只需要检查长度是否为8位
			return plateNumber.length === 8;
		},
		getViolationLevel(count) {
			if (count <= 2) {
				return 'violation-normal'; // 1-2次违规
			} else if (count <= 4) {
				return 'violation-warning'; // 3-4次违规
			} else {
				return 'violation-severe'; // 5次及以上违规
			}
		},
		getViolationLevelClass(count) {
			if (count <= 2) {
				return 'violation-normal'; // 1-2次违规
			} else if (count <= 4) {
				return 'violation-warning'; // 3-4次违规
			} else {
				return 'violation-severe'; // 5次及以上违规
			}
		},
		getViolationTypes(violations) {
			const types = {};
			violations.forEach(violation => {
				if (types[violation.violationType]) {
					types[violation.violationType]++;
				} else {
					types[violation.violationType] = 1;
				}
			});
			return types;
		},
		violationLevelClass(count) {
			if (count <= 2) {
				return 'violation-normal'; // 1-2次违规
			} else if (count <= 4) {
				return 'violation-warning'; // 3-4次违规
			} else {
				return 'violation-severe'; // 5次及以上违规
			}
		},
		// 处理并获取高风险车辆数据

		// 获取车辆状态样式类
		getVehicleStatusClass(record) {
			if (!record.enterTime) return 'hidden'; // 不显示未进场的记录
			if (record.enterTime && !record.leaveTime) return 'not-left';
			return 'entered';
		},

		// 获取车辆状态图标
		getVehicleStatusIcon(record) {
			if (!record.enterTime) return 'info-circle';
			if (record.enterTime && !record.leaveTime) return 'car';
			return 'checkmark-circle';
		},

		// 获取车辆状态文本
		getVehicleStatusText(record) {
			// 确保 record 存在
			if (!record) return '未知状态';

			// 🔧 优先检查预约状态和车辆状态
			// 如果有预约状态，优先使用预约信息
			if (record.appointmentStatus) {
				switch (record.appointmentStatus) {
					case '已通过':
					case '已审核':
						// 预约已通过，检查车辆实际状态
						if (record.vehicleStatus) {
							switch (record.vehicleStatus) {
								case '未进场':
								case '待进场':
								case '待入场':
									return '待进场';
								case '在场':
								case '已进场':
									return '在场';
								case '已离场':
								case '已出场':
									return record.isFixed ? '已离场固定' : '已离场';
								default:
									return record.vehicleStatus;
							}
						}
						break;
					case '待审核':
					case '审核中':
						return '待审核';
					case '已拒绝':
					case '审核不通过':
						return '审核不通过';
				}
			}

			// 🔧 兜底逻辑：使用进场和离场时间判断
			if (!record.enterTime || record.enterTime === null || record.enterTime === undefined) {
				return '待进场'; // 显示为待进场状态，而不是返回null
			}

			// 检查离场时间
			if (!record.leaveTime || record.leaveTime === null || record.leaveTime === undefined) {
				return '在场';
			}

			// 检查是否是固定状态
			if (record.isFixed) {
				return '已离场固定';
			}

			return '已离场';
		},

		// 🔧 新增：根据violations数组判断车辆进场状态
		getVehicleStatusFromViolations(violations) {
			if (!violations || !Array.isArray(violations) || violations.length === 0) {
				return '未知状态';
			}

			// 检查是否有未离场的记录（有进场时间但没有离场时间）
			const hasInProgress = violations.some(v => 
				v.enterTime && v.enterTime !== null && v.enterTime !== undefined && 
				(!v.leaveTime || v.leaveTime === null || v.leaveTime === undefined)
			);

			// 检查是否有已离场的记录（有进场时间且有离场时间）
			const hasLeft = violations.some(v => 
				v.enterTime && v.enterTime !== null && v.enterTime !== undefined && 
				v.leaveTime && v.leaveTime !== null && v.leaveTime !== undefined
			);

			// 检查是否有待进场的记录（没有进场时间）
			const hasWaiting = violations.some(v => 
				!v.enterTime || v.enterTime === null || v.enterTime === undefined
			);

			// 优先级：未离场 > 已离场 > 待进场
			if (hasInProgress) {
				return '未离场';
			} else if (hasLeft) {
				return '已离场';
			} else if (hasWaiting) {
				return '待进场';
			}

			return '未知状态';
		},

		// 🔧 新增：获取车辆进场状态对应的图标
		getVehicleStatusIconFromViolations(violations) {
			const status = this.getVehicleStatusFromViolations(violations);
			switch (status) {
				case '待进场':
					return '⏳';
				case '未离场':
					return '🚗';
				case '已离场':
					return '✅';
				default:
					return '🏠';
			}
		},

		// 🔧 新增：获取车辆状态对应的图标
		getVehicleStatusIcon(record) {
			const status = this.getVehicleStatusText(record);
			switch (status) {
				case '待进场':
					return '⏳';
				case '在场':
					return '🚗';
				case '已离场':
					return '✅';
				case '已离场固定':
					return '🔒';
				case '待审核':
					return '📋';
				case '审核不通过':
					return '❌';
				default:
					return '🏠';
			}
		},

		// 获取状态显示文本（用于空状态提示）
		getStatusDisplayText(status) {
			switch (status) {
				case 'in-progress':
					return '未离场';
				case 'has-left':
					return '已离场';
				case 'has-left-fixed':
					return '已离场固定状态';
				default:
					return '全部';
			}
		},

		// 清除所有筛选条件
		clearAllFilters() {
			// 清除状态筛选
			this.realtimeSelectedStatus = '';

			// 恢复到原始数据
			this.updateRealtimeRecords();

			uni.showToast({
				title: '已清除筛选条件',
				icon: 'success',
				duration: 1500
			});
		},

		// 获取车辆状态颜色
		getVehicleStatusColor(record) {
			if (!record.enterTime) return '#fff';
			if (record.enterTime && !record.leaveTime) return '#fff';
			return '#fff';
		},

		// 获取车主类型样式类
		getOwnerTypeClass(ownerType) {
			switch (ownerType) {
				case 'local':
					return 'type-local';
				case 'monthly':
					return 'type-monthly';
				case 'visitor':
					return 'type-visitor';
				case 'temporary':
					return 'type-temporary';
				case 'unknown':
				default:
					return 'type-unknown';
			}
		},

		// 获取车主类型图标
		getOwnerTypeIcon(ownerType) {
			switch (ownerType) {
				case 'local':
					return '🏠';
				case 'monthly':
					return '🎫';
				case 'visitor':
					return '🎫'; // 预约车辆
				case 'temporary':
					return '🚗'; // 临时车
				case 'unknown':
				default:
					return '❓'; // 未知类型
			}
		},

		// 解析照片数组
		parsePhotos(photos) {
			if (!photos) return [];
			
			let photoArray = [];
			
			// 如果是字符串，尝试解析为JSON
			if (typeof photos === 'string') {
				try {
						
					// 清理可能的问题字符
					let cleanPhotos = photos.trim();
					
					// 检查是否是有效的JSON格式
					if (!cleanPhotos.startsWith('[') && !cleanPhotos.startsWith('{')) {
						console.warn('无效的JSON格式:', cleanPhotos);
						return [];
					}
					
					const parsed = JSON.parse(cleanPhotos);
					photoArray = Array.isArray(parsed) ? parsed : [];
				} catch (e) {
					return [];
				}
			} else if (Array.isArray(photos)) {
				// 如果已经是数组，直接使用
				photoArray = photos;
			} else {
				return [];
			}
			
			// 处理照片路径，转换临时路径为正确的服务器路径
			const processedPhotos = photoArray.map(photo => {
				
				if (typeof photo === 'string' && photo.trim()) {
					const trimmedPhoto = photo.trim();
					
					// 处理 http://tmp/ 开头的路径
					if (trimmedPhoto.startsWith('http://tmp/')) {
						const fileName = trimmedPhoto.replace('http://tmp/', '');
						const result = `${apiConfig.baseURL}/uploads/${fileName}`;
						return result;
					}
					// 处理相对路径 /tmp/
					if (trimmedPhoto.startsWith('/tmp/')) {
						const fileName = trimmedPhoto.replace('/tmp/', '');
						const result = `${apiConfig.baseURL}/uploads/${fileName}`;
						return result;
					}
					// 如果已经是完整的URL，直接返回
					if (trimmedPhoto.startsWith('http://') || trimmedPhoto.startsWith('https://')) {
						return trimmedPhoto;
					}
					// 处理相对路径（没有协议的路径）
					if (trimmedPhoto.startsWith('/')) {
						const result = `${apiConfig.baseURL}${trimmedPhoto}`;
						return result;
					}
					// 其他情况，假设是文件名，添加完整路径
					const result = `${apiConfig.baseURL}/uploads/${trimmedPhoto}`;
					return result;
				}
				
				return photo;
			}).filter(photo => {
				// 更严格的过滤条件
				const isValid = photo && 
							   typeof photo === 'string' && 
							   photo.trim() && 
							   photo.trim().length > 1 && 
							   !photo.includes('[') && 
							   !photo.includes(']') &&
							   (photo.startsWith('http') || photo.startsWith('/') || photo.includes('.'));
				
				if (!isValid) {
					console.warn('过滤掉无效照片:', photo);
				}
				
				return isValid;
			});
			
			return processedPhotos;
		},

		// 预览照片
		previewPhoto(photos, currentIndex) {
			if (!photos || photos.length === 0) return;
			
			uni.previewImage({
				urls: photos,
				current: currentIndex,
				longPressActions: {
					itemList: ['发送给朋友', '保存到相册', '收藏'],
					success: function (res) {
					},
					fail: function (res) {
					}
				}
			});
		},

		// 预览单张照片（兼容性方法）
		previewImage(photo, photos) {
			if (!photo || !photos || photos.length === 0) return;
			
			// 找到当前照片在数组中的索引
			const currentIndex = photos.indexOf(photo);
			
			uni.previewImage({
				urls: photos,
				current: currentIndex >= 0 ? currentIndex : 0,
				longPressActions: {
					itemList: ['发送给朋友', '保存到相册', '收藏'],
					success: function (res) {
					},
					fail: function (res) {
					}
				}
			});
		},

		// 获取车主类型文本
		getOwnerTypeText(ownerType) {
			switch (ownerType) {
				case 'local':
					return '本地车主';
				case 'monthly':
					return '月票车主';
				case 'visitor':
					return '预约车辆';
				case 'temporary':
					return '临时车辆';
				case 'unknown':
				default:
					return '未知类型';
			}
		},

		// 获取车主地址文本
		getOwnerAddressText(car) {
			if (car.ownerType === 'monthly') {
				return car.ownerAddress || car.parkName ? `${car.parkName}月票车主` : '未知车场';
			} else if (car.ownerType === 'local') {
				return car.ownerAddress || car.address || '未知地址';
			} else if (car.ownerType === 'visitor') {
				return '预约车辆';
			} else if (car.ownerType === 'temporary') {
				return '临时车辆';
			} else {
				return '未知类型';
			}
		},

		// 获取信用分数样式类
		getCreditScoreClass(score) {
			if (score >= 90) return 'score-excellent';
			if (score >= 80) return 'score-good';
			if (score >= 70) return 'score-normal';
			return 'score-poor';
		},

		// 格式化日期部分
		formatDate(dateString) {
			if (!dateString) return '';
			const date = new Date(dateString);
			return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
		},

		// 格式化时间部分
		formatTime(dateString) {
			if (!dateString) return '';
			const date = new Date(dateString);
			return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
		},

		// 格式化完整日期
		formatFullDate(dateString) {
			if (!dateString) return '';
			const date = new Date(dateString);
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			return `${year}-${month}-${day}`;
		},



		// 获取在场数量
		getInProgressCount(violations = null) {
			// 如果传入了特定的violations数组，使用它
			if (violations && Array.isArray(violations)) {
				return violations.filter(v => !v.enterTime || (!v.leaveTime || v.leaveTime === null || v.leaveTime === undefined)).length;
			}

			// 对于违规统计部分，基于原始数据计算
			// 对于实时记录部分，也基于原始数据计算，不受状态筛选影响
			if (!this.originalRealtimeRecords || !Array.isArray(this.originalRealtimeRecords)) {
				return 0;
			}
			// 统计逻辑与筛选逻辑保持一致：没有进场时间 OR 没有离场时间
			return this.originalRealtimeRecords.filter(v => !v.enterTime || (!v.leaveTime || v.leaveTime === null || v.leaveTime === undefined)).length;
		},

		// 获取已离场数量
		getLeftCount(violations = null) {
			// 如果传入了特定的violations数组，使用它
			if (violations && Array.isArray(violations)) {
				return violations.filter(v => v.enterTime && v.leaveTime && v.leaveTime !== null && v.leaveTime !== undefined).length;
			}

			// 对于违规统计部分，基于原始数据计算
			// 对于实时记录部分，也基于原始数据计算，不受状态筛选影响
			if (!this.originalRealtimeRecords || !Array.isArray(this.originalRealtimeRecords)) {
				return 0;
			}
			// 统计逻辑与筛选逻辑保持一致：有进场时间且有离场时间
			return this.originalRealtimeRecords.filter(v => v.enterTime && v.leaveTime && v.leaveTime !== null && v.leaveTime !== undefined).length;
		},



		getRealtimeInProgressCount() {
			// 🔧 修改：如果有搜索关键词，使用当前筛选后的数据；否则使用时间范围内的数据
			let targetRecords;
			if (this.searchKeyword && this.searchKeyword.trim()) {
				// 有搜索关键词时，基于当前显示的筛选结果计算
				targetRecords = this.realtimeRecords;
			} else {
				// 没有搜索关键词时，基于时间范围内的数据计算
				targetRecords = this.getRecordsInTimeRange();
			}
			
			if (!targetRecords || !Array.isArray(targetRecords)) {
				return 0;
			}
			// 🔧 修改：包含待进场的记录（没有enterTime的记录也算作未离场）
			return targetRecords.filter(v =>
				// 没有进场时间（待进场）或者有进场时间但没有离场时间（在场）
				(!v.enterTime || v.enterTime === null || v.enterTime === undefined) ||
				((v.enterTime && v.enterTime !== null && v.enterTime !== undefined) &&
					(!v.leaveTime || v.leaveTime === null || v.leaveTime === undefined))
			).length;
		},

		getRealtimeLeftCount() {
			// 🔧 修改：如果有搜索关键词，使用当前筛选后的数据；否则使用时间范围内的数据
			let targetRecords;
			if (this.searchKeyword && this.searchKeyword.trim()) {
				// 有搜索关键词时，基于当前显示的筛选结果计算
				targetRecords = this.realtimeRecords;
			} else {
				// 没有搜索关键词时，基于时间范围内的数据计算
				targetRecords = this.getRecordsInTimeRange();
			}
			
			if (!targetRecords || !Array.isArray(targetRecords)) {
				return 0;
			}
			return targetRecords.filter(v =>
				(v.enterTime && v.enterTime !== null && v.enterTime !== undefined) &&
				(v.leaveTime && v.leaveTime !== null && v.leaveTime !== undefined)
			).length;
		},

		// 🔧 新增：获取已拉黑记录数量
		getRealtimeBlacklistedCount() {
			// 🔧 修改：如果有搜索关键词，使用当前筛选后的数据；否则使用时间范围内的数据
			let targetRecords;
			if (this.searchKeyword && this.searchKeyword.trim()) {
				// 有搜索关键词时，基于当前显示的筛选结果计算
				targetRecords = this.realtimeRecords;
			} else {
				// 没有搜索关键词时，基于时间范围内的数据计算
				targetRecords = this.getRecordsInTimeRange();
			}
			
			if (!targetRecords || !Array.isArray(targetRecords)) {
				return 0;
			}
			
			const blacklistedCount = targetRecords.filter(record => record.isBlacklisted === true).length;
			console.log('🔍 [getRealtimeBlacklistedCount] 已拉黑记录数量:', blacklistedCount);
			return blacklistedCount;
		},

		// 🔧 新增：获取未拉黑记录数量
		getRealtimeNonBlacklistedCount() {
			// 🔧 修改：如果有搜索关键词，使用当前筛选后的数据；否则使用时间范围内的数据
			let targetRecords;
			if (this.searchKeyword && this.searchKeyword.trim()) {
				// 有搜索关键词时，基于当前显示的筛选结果计算
				targetRecords = this.realtimeRecords;
			} else {
				// 没有搜索关键词时，基于时间范围内的数据计算
				targetRecords = this.getRecordsInTimeRange();
			}
			
			if (!targetRecords || !Array.isArray(targetRecords)) {
				return 0;
			}
			
			const nonBlacklistedCount = targetRecords.filter(record => record.isBlacklisted !== true).length;
			console.log('🔍 [getRealtimeNonBlacklistedCount] 未拉黑记录数量:', nonBlacklistedCount);
			return nonBlacklistedCount;
		},

		// 获取当前时间范围内的记录数据
		getRecordsInTimeRange() {
			// 如果原始数据不存在，返回空数组
			if (!this.originalRealtimeRecords || !Array.isArray(this.originalRealtimeRecords)) {
				return [];
			}

			// 如果没有设置时间范围，返回所有原始数据
			if (!this.realtimeStartDate || !this.realtimeEndDate) {
				return this.originalRealtimeRecords;
			}

			// 根据设置的时间范围筛选数据
			const startTime = new Date(this.realtimeStartDate + ' 00:00:00').getTime();
			const endTime = new Date(this.realtimeEndDate + ' 23:59:59').getTime();

			return this.originalRealtimeRecords.filter(record => {
					const createdTime = new Date(record.createdAt || record.created_at || record.appointmentTime).getTime();
					return createdTime >= startTime && createdTime <= endTime;
			});
		},



		getStatisticsInProgressCount(car) {
			// 始终基于原始violations计算，显示该车辆未离场的总违规次数
			const violations = car.originalViolations || car.violations;
			if (!violations || !Array.isArray(violations)) {
				return 0;
			}
			return violations.filter(v =>
				(v.enterTime && v.enterTime !== null && v.enterTime !== undefined) &&
				(!v.leaveTime || v.leaveTime === null || v.leaveTime === undefined)
			).length;
		},

		getStatisticsLeftCount(car) {
			// 始终基于原始violations计算，显示该车辆已离场的总违规次数
			const violations = car.originalViolations || car.violations;
			if (!violations || !Array.isArray(violations)) {
				return 0;
			}
			return violations.filter(v =>
				(v.enterTime && v.enterTime !== null && v.enterTime !== undefined) &&
				(v.leaveTime && v.leaveTime !== null && v.leaveTime !== undefined)
			).length;
		},

		// 获取指定车辆在统计时间范围内的违规记录
		getCarViolationsInStatisticsRange(plateNumber) {
			if (!this.statisticsStartDate || !this.statisticsEndDate) {
				return [];
			}

			const startTime = new Date(this.statisticsStartDate + ' 00:00:00').getTime();
			const endTime = new Date(this.statisticsEndDate + ' 23:59:59').getTime();

			return this.originalRealtimeRecords.filter(record => {
				const appointmentTime = new Date(record.appointmentTime).getTime();
				return record.plateNumber === plateNumber &&
					appointmentTime >= startTime &&
					appointmentTime <= endTime;
			});
		},
		updateRealtimeRecords() {
			try {
				console.log('🔄 [updateRealtimeRecords] 开始更新实时记录');
				console.log('🔄 [updateRealtimeRecords] 时间范围:', this.realtimeStartDate, '至', this.realtimeEndDate);

				// 如果没有设置时间范围，直接返回不筛选
				if (!this.realtimeStartDate || !this.realtimeEndDate) {
					console.log('🔄 [updateRealtimeRecords] 没有设置时间范围，跳过筛选');
					if (this.originalRealtimeRecords.length > 0 && this.realtimeRecords.length === 0) {
						this.realtimeRecords = [...this.originalRealtimeRecords];
						console.log('🔄 [updateRealtimeRecords] 恢复原始数据:', this.realtimeRecords.length, '条');
					}
					return;
				}

				// 🔧 修复：直接重新从后端获取数据，而不是在本地筛选
				// 因为本地的 originalRealtimeRecords 可能只是之前某个时间范围的数据
				console.log('🔄 [updateRealtimeRecords] 重新从后端获取数据以避免本地筛选范围限制');
				this.loadRealtimeViolations();
				return;

				// 以下代码保留作为备用（如果需要纯本地筛选的话）
				/*
				const startTime = new Date(this.realtimeStartDate + ' 00:00:00').getTime();
				const endTime = new Date(this.realtimeEndDate + ' 23:59:59').getTime();

				// 如果没有保存原始数据，先保存（使用初始的完整数据）
				if (!this.originalRealtimeRecords.length) {
					// 重新获取完整的原始数据
					this.originalRealtimeRecords = [...this.getAllRealtimeRecords()];
				}

				// 筛选符合日期范围的记录（使用创建时间进行筛选）
				console.log('🔍 [过滤前] 原始记录数量:', this.originalRealtimeRecords.length);
				this.realtimeRecords = this.originalRealtimeRecords.filter(record => {
					const createdTime = new Date(record.createdAt || record.created_at || record.appointmentTime).getTime();
					const inDateRange = createdTime >= startTime && createdTime <= endTime;
					// 🔧 临时注释：允许显示未进场的违规记录用于调试
					// const hasEntered = record.enterTime && record.enterTime !== null && record.enterTime !== undefined;
					// return inDateRange && hasEntered;
					return inDateRange; // 只按日期范围筛选，不过滤未进场记录
				}).sort((a, b) => {
					// 按创建时间降序排序（创建时间越晚越靠前）
					const timeA = new Date(a.createdAt || a.created_at || a.appointmentTime).getTime();
					const timeB = new Date(b.createdAt || b.created_at || b.appointmentTime).getTime();
					return timeB - timeA;
				});
				console.log('🔍 [过滤后] 显示记录数量:', this.realtimeRecords.length);
				*/

				// 如果有选中的实时状态,再次筛选
				if (this.realtimeSelectedStatus) {
					this.filterRealtimeRecordsByStatus();
				}

				// 显示筛选结果提示
				uni.showToast({
					title: `已筛选出${this.realtimeRecords.length}条记录`,
					icon: 'none',
					duration: 2000
				});

			} catch (error) {
				console.error('更新实时记录数据失败:', error);
				uni.showToast({
					title: '筛选数据失败',
					icon: 'none'
				});
			}
		},
		resetRealtimeRecords() {
			this.realtimeStartDate = '';
			this.realtimeEndDate = '';
			this.realtimeSelectedStatus = ''; // 清除实时状态选择
			if (this.originalRealtimeRecords.length) {
				this.realtimeRecords = [...this.originalRealtimeRecords].sort((a, b) => {
					// 按预约时间降序排序（预约时间越晚越靠前）
					const timeA = new Date(a.appointmentTime).getTime();
					const timeB = new Date(b.appointmentTime).getTime();
					return timeB - timeA;
				});
			}
		},

		// 获取完整的原始实时记录数据
		getAllRealtimeRecords() {
			// 返回已加载的原始数据，如果没有则返回空数组
			return this.originalRealtimeRecords.length > 0 ? this.originalRealtimeRecords : [];
		},
		// 初始化默认日期范围
		initDefaultDateRange() {
			const today = new Date();
			const lastWeek = new Date();
			lastWeek.setDate(today.getDate() - 7); // 修改为7天前

			this.realtimeStartDate = this.formatDate(lastWeek);
			this.realtimeEndDate = this.formatDate(today);

			// 初始化时更新记录
			this.updateRealtimeRecords();
		},

		// 选择实时记录状态
		selectStatus(status) {
			this.selectedStatus = this.selectedStatus === status ? '' : status;
			this.filterRecordsByStatus();
		},

		// 选择实时违规记录状态（独立）
		selectRealtimeStatus(status) {
			// 触觉反馈
			uni.vibrateShort({
				type: 'light'
			});
			
			const prevStatus = this.realtimeSelectedStatus;
			this.realtimeSelectedStatus = this.realtimeSelectedStatus === status ? '' : status;
			this.filterRealtimeRecordsByStatus();
			
			// 用户反馈
			if (this.realtimeSelectedStatus) {
				let statusText = '';
				switch(status) {
					case 'in-progress':
						statusText = '未离场';
						break;
					case 'has-left':
						statusText = '已离场';
						break;
					case 'blacklisted':
						statusText = '已拉黑';
						break;
					case 'non-blacklisted':
						statusText = '未拉黑';
						break;
					default:
						statusText = '筛选';
				}
				const filteredCount = this.realtimeRecords.length;
				uni.showToast({
					title: `已筛选${statusText}记录：${filteredCount}条`,
					icon: 'none',
					duration: 2000
				});
			} else if (prevStatus) {
				// 取消筛选
				uni.showToast({
					title: '已取消筛选，显示全部记录',
					icon: 'none',
					duration: 2000
				});
			}
		},

		// 选择违规统计状态（全局，已废弃）
		selectStatisticsStatus(status) {
			this.statisticsSelectedStatus = this.statisticsSelectedStatus === status ? '' : status;
			this.filterStatisticsByStatus();
		},

		// 选择单个车辆的统计状态
		selectCarStatisticsStatus(car, status) {
			// 切换该车辆的选中状态
			const newStatus = car.selectedStatus === status ? '' : status;

			// 更新该车辆的选中状态
			car.selectedStatus = newStatus;

			// 筛选该车辆的违规记录
			this.filterCarViolationsByStatus(car);
		},

		// 筛选单个车辆的违规记录
		filterCarViolationsByStatus(car) {
			if (!car.selectedStatus) {
				// 如果取消选择,恢复原始违规数据，但过滤掉未进场的数据
				car.violations = car.originalViolations.filter(violation =>
					violation.enterTime && violation.enterTime !== null && violation.enterTime !== undefined
				);
				car.filteredCount = car.violations.length;
				return;
			}

			// 基于原始violations进行筛选，同时过滤掉未进场的数据
			const filteredViolations = car.originalViolations.filter(violation => {
				// 首先过滤掉未进场的数据
				if (!violation.enterTime || violation.enterTime === null || violation.enterTime === undefined) {
					return false;
				}

				switch (car.selectedStatus) {
					case 'in-progress':
						return !violation.leaveTime;
					case 'has-left':
						return violation.leaveTime;
					default:
						return true;
				}
			});

			// 更新该车辆的违规记录
			car.violations = filteredViolations;
			car.filteredCount = filteredViolations.length;

			// 显示筛选结果提示
			const statusText = this.getStatusText(car.selectedStatus);
			uni.showToast({
				title: `${car.plateNumber}: 已筛选出${car.filteredCount}条${statusText}违规记录`,
				icon: 'none',
				duration: 2000
			});
		},

		// 根据状态筛选实时记录
		filterRecordsByStatus() {
			if (!this.selectedStatus) {
				// 如果取消选择,恢复原始数据
				this.realtimeRecords = [...this.originalRealtimeRecords].sort((a, b) => {
					// 按预约时间降序排序（预约时间越晚越靠前）
					const timeA = new Date(a.appointmentTime).getTime();
					const timeB = new Date(b.appointmentTime).getTime();
					return timeB - timeA;
				});
				return;
			}

			// 直接更新 realtimeRecords，同时过滤掉未进场的数据
			this.realtimeRecords = this.originalRealtimeRecords.filter(record => {
				// 首先过滤掉未进场的数据
				if (!record.enterTime || record.enterTime === null || record.enterTime === undefined) {
					return false;
				}

				switch (this.selectedStatus) {
					case 'in-progress':
						return !record.leaveTime;
					case 'has-left':
						return record.leaveTime;
					default:
						return true;
				}
			}).sort((a, b) => {
				// 按预约时间降序排序（预约时间越晚越靠前）
				const timeA = new Date(a.appointmentTime).getTime();
				const timeB = new Date(b.appointmentTime).getTime();
				return timeB - timeA;
			});

			// 显示筛选结果提示
			uni.showToast({
				title: `已筛选出${this.realtimeRecords.length}条记录`,
				icon: 'none',
				duration: 2000
			});
		},

		// 根据实时状态筛选实时记录（独立筛选）
		filterRealtimeRecordsByStatus() {
			if (!this.realtimeSelectedStatus) {
				// 如果取消选择,恢复到当前时间范围的数据
				this.updateRealtimeRecords();
				return;
			}
			
			// 显示加载状态（短暂）
			this.realtimeLoading = true;

			// 🔧 修复：直接使用当前已显示的记录作为基础数据进行状态筛选
			// 因为 this.realtimeRecords 已经是正确的时间范围数据（通过 loadRealtimeViolations 获取）
			let baseRecords = [...this.realtimeRecords];
			
			// 如果当前没有数据，先确保从后端获取
			if (baseRecords.length === 0 && (this.realtimeStartDate && this.realtimeEndDate)) {
				console.log('🔄 [filterRealtimeRecordsByStatus] 没有基础数据，先从后端获取');
				this.loadRealtimeViolations().then(() => {
					// 加载完成后重新执行状态筛选
					this.filterRealtimeRecordsByStatus();
				});
				return;
			}

			// 根据状态进一步筛选
			this.realtimeRecords = baseRecords.filter(record => {
				// 🔧 临时注释：允许显示未进场的违规记录用于调试
				// if (!record.enterTime || record.enterTime === null || record.enterTime === undefined) {
				// 	return false;
				// }

				switch (this.realtimeSelectedStatus) {
					case 'in-progress':
						// 在场：有进场时间但没有离场时间（如果没有进场时间，也认为是在场状态）
						return !record.enterTime || (!record.leaveTime || record.leaveTime === null || record.leaveTime === undefined);
					case 'has-left':
						// 已离场：既有进场时间又有离场时间
						return record.enterTime && record.leaveTime && record.leaveTime !== null && record.leaveTime !== undefined;
					case 'has-left-fixed':
						// 已离场固定状态：既有进场时间又有离场时间，且状态被标记为固定
						return record.enterTime && record.leaveTime && record.leaveTime !== null && record.leaveTime !== undefined && record.isFixed;
					case 'blacklisted':
						// 🔧 新增：已拉黑状态
						return record.isBlacklisted === true;
					case 'non-blacklisted':
						// 🔧 新增：未拉黑状态
						return record.isBlacklisted !== true;
					default:
						return true; // 显示所有记录
				}
			}).sort((a, b) => {
				// 按预约时间降序排序（预约时间越晚越靠前）
				const timeA = new Date(a.appointmentTime).getTime();
				const timeB = new Date(b.appointmentTime).getTime();
				return timeB - timeA;
			});

			// 短暂延迟后关闭加载状态，提供更好的视觉反馈
			setTimeout(() => {
				this.realtimeLoading = false;
			}, 200);

			console.log('🎯 筛选后的实时记录数量:', this.realtimeRecords.length);
		},

		// 根据状态筛选违规统计数据
		filterStatisticsByStatus() {
			if (!this.statisticsSelectedStatus) {
				// 如果取消选择,恢复原始违规数据，但过滤掉未进场的数据
				this.highRiskCars = this.highRiskCars.map(car => {
					const enteredViolations = car.originalViolations.filter(violation =>
						violation.enterTime && violation.enterTime !== null && violation.enterTime !== undefined
					);
					return {
						...car,
						violations: [...enteredViolations], // 恢复已进场的violations
						count: car.originalViolations.length, // 显示全部违规次数
						filteredCount: enteredViolations.length // 筛选后的数量
					};
				});
				return;
			}

			// 基于原始violations进行筛选，不修改原始数据，同时过滤掉未进场的数据
			this.highRiskCars = this.highRiskCars.map(car => {
				const filteredViolations = car.originalViolations.filter(violation => {
					// 首先过滤掉未进场的数据
					if (!violation.enterTime || violation.enterTime === null || violation.enterTime === undefined) {
						return false;
					}

					switch (this.statisticsSelectedStatus) {
						case 'in-progress':
							return !violation.leaveTime;
						case 'has-left':
							return violation.leaveTime;
						default:
							return true;
					}
				});

				return {
					...car,
					violations: filteredViolations, // 筛选后的违规记录用于显示
					count: car.originalViolations.length, // 车牌旁边显示总违规次数
					filteredCount: filteredViolations.length // 筛选后的数量
				};
			}); // 保留所有车辆，即使某个状态下没有违规记录

			// 显示筛选结果提示
			const totalFilteredViolations = this.highRiskCars.reduce((sum, car) => sum + car.filteredCount, 0);
			const statusText = this.getStatusText(this.statisticsSelectedStatus);
			uni.showToast({
				title: `已筛选出${totalFilteredViolations}条${statusText}违规记录`,
				icon: 'none',
				duration: 2000
			});
		},

		// 获取状态文本
		getStatusText(status) {
			switch (status) {
				case 'in-progress':
					return '未离场';
				case 'has-left':
					return '已离场';
				case 'has-left-fixed':
					return '已离场固定状态';
				default:
					return '';
			}
		},
		// 违规统计相关方法
		showStatisticsCalendar() {
			console.log('🗓️ 点击显示统计日历 (uni-datetime-picker)');
			
			try {
				// 使用 ref 直接打开 uni-datetime-picker
				if (this.$refs.statisticsCalendar) {
					this.$refs.statisticsCalendar.show();
					console.log('✅ uni-datetime-picker 已打开');
				} else {
					console.error('❌ 无法找到 statisticsCalendar ref');
					uni.showToast({
						title: '日历组件未找到',
						icon: 'error'
					});
				}
				
			} catch (error) {
				console.error('❌ 显示日历时出错:', error);
				uni.showToast({
					title: '无法打开日历',
					icon: 'error'
				});
			}
		},

		async onStatisticsCalendarConfirm(e) {
			console.log('📅 日历确认回调被触发，参数:', e);
			
			// 简化处理逻辑，先确保回调能正常工作
			if (!e) {
				console.log('❌ 没有收到日期数据');
				uni.showToast({
					title: '没有收到日期数据',
					icon: 'none'
				});
				return;
			}
			
			if (!Array.isArray(e) || e.length < 2) {
				console.log('❌ 日期数据格式不正确:', e);
				uni.showToast({
					title: '请选择完整的时间范围',
					icon: 'none'
				});
				return;
			}
			
			try {
				const startDate = e[0];
				const endDate = e[e.length - 1];
				
				console.log('📊 获得日期范围:', { startDate, endDate });
				
				// 关闭日历
				this.showStatisticsCalendarPicker = false;
				
				// 格式化日期用于显示
				const formatDate = (timestamp) => {
					const date = new Date(timestamp);
					return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
				};
				
				// 直接应用筛选
				this.statisticsStartDate = formatDate(startDate);
							this.statisticsEndDate = formatDate(endDate);
			
			// 重新计算统计数据
			await this.updateStatisticsData();
			
			uni.showToast({
				title: `✅ 已筛选 ${this.statisticsStartDate} 至 ${this.statisticsEndDate}`,
					icon: 'success',
					duration: 3000
				});
				
				console.log('✅ 筛选成功:', this.statisticsStartDate, '至', this.statisticsEndDate);
				
			} catch (error) {
				console.error('❌ 日历处理错误:', error);
				this.showStatisticsCalendarPicker = false;
				uni.showToast({
					title: '日期处理失败，请重试',
					icon: 'error'
				});
			}
		},

		// 新增：日历关闭事件
		closeStatisticsCalendar() {
			console.log('📅 日历关闭事件被触发');
			this.showStatisticsCalendarPicker = false;
		},

		// 新增：uni-datetime-picker 日期范围变化事件
		async onStatisticsDateRangeChange(value) {
			console.log('📅 uni-datetime-picker 日期范围变化:', value);
			
			if (!value || !Array.isArray(value) || value.length !== 2) {
				console.log('❌ 日期范围数据格式不正确:', value);
				return;
			}
			
			try {
				const [startDate, endDate] = value;
				
				// 更新统计日期范围
				this.statisticsStartDate = startDate;
				this.statisticsEndDate = endDate;
				
							console.log('📊 更新统计日期范围:', { startDate, endDate });
			
			// 重新计算统计数据
			await this.updateStatisticsData();
			
			uni.showToast({
					title: `✅ 已筛选 ${startDate} 至 ${endDate}`,
					icon: 'success',
					duration: 2000
				});
				
			} catch (error) {
				console.error('❌ 日期范围处理错误:', error);
				uni.showToast({
					title: '日期处理失败，请重试',
					icon: 'error'
				});
			}
		},

		// 新增：获取当前日期（格式化为字符串）
		getCurrentDate() {
			const now = new Date();
			const year = now.getFullYear();
			const month = String(now.getMonth() + 1).padStart(2, '0');
			const day = String(now.getDate()).padStart(2, '0');
			return `${year}-${month}-${day}`;
		},

		// 实时违规记录的日历方法
		closeRealtimeCalendar() {
			console.log('📅 实时违规日历关闭事件被触发');
		},

		// 实时违规记录的日期范围变化事件
		async onRealtimeDateRangeChange(value) {
			console.log('📅 实时违规日期范围变化:', value);
			
			if (!value || !Array.isArray(value) || value.length !== 2) {
				console.log('❌ 实时违规日期范围数据格式不正确:', value);
				return;
			}
			
			try {
				const [startDate, endDate] = value;
				
				// 更新实时违规日期范围
				this.realtimeStartDate = startDate;
				this.realtimeEndDate = endDate;
				// 🔄 更新实时违规记录时间选择器的显示
				this.realtimeDateRange = [startDate, endDate];
				
				// 🔄 同步更新高风险车辆统计的时间范围
				this.statisticsStartDate = startDate;
				this.statisticsEndDate = endDate;
				// 🔄 同步更新高风险车辆统计时间选择器的显示
				this.statisticsDateRange = [startDate, endDate];
				
				console.log('📊 更新实时违规日期范围:', { startDate, endDate });
				console.log('🔄 同步更新高风险车辆统计时间范围:', { startDate, endDate });
				console.log('🔄 同步更新高风险车辆统计时间选择器显示:', [startDate, endDate]);
				
				// 重新加载实时违规记录
				console.log('📅 [时间范围改变] 准备重新加载实时违规记录');
				this.updateRealtimeRecords();
				
				// 🔄 同时更新高风险车辆统计数据
				await this.updateStatisticsData();
				
				console.log('📅 [时间范围改变] 数据重新加载完成');
				
				uni.showToast({
					title: `✅ 已筛选 ${startDate} 至 ${endDate}`,
					icon: 'success',
					duration: 2000
				});
				
			} catch (error) {
				console.error('❌ 实时违规日期范围处理错误:', error);
				uni.showToast({
					title: '日期处理失败，请重试',
					icon: 'error'
				});
			}
		},

		// 新增：格式化日期范围显示
		formatDateRangeDisplay(dateRange) {
			if (!dateRange || !Array.isArray(dateRange) || dateRange.length !== 2) {
				return '选择日期范围';
			}
			
			const [startDate, endDate] = dateRange;
			if (!startDate || !endDate) {
				return '选择日期范围';
			}
			
			// 简化显示格式
			const formatShortDate = (dateStr) => {
				const date = new Date(dateStr);
				return `${date.getMonth() + 1}/${date.getDate()}`;
			};
			
			return `${formatShortDate(startDate)} 至 ${formatShortDate(endDate)}`;
		},

		// 新增：日历变化事件
		onStatisticsCalendarChange(e) {
			console.log('📅 日历变化事件被触发，参数:', e);
		},

		// 确认统计日期范围
		async confirmStatisticsDateRange() {
			console.log('确认统计日期范围被调用, tempStatisticsDateRange:', this.tempStatisticsDateRange);
			if (this.tempStatisticsDateRange) {
				const startDate = this.tempStatisticsDateRange.startDate;
				const endDate = this.tempStatisticsDateRange.endDate;
				
				// 格式化日期用于显示
				const formatDate = (timestamp) => {
					const date = new Date(timestamp);
					return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
				};
				
				// 将时间戳转换为日期字符串格式
				this.statisticsStartDate = formatDate(startDate);
				this.statisticsEndDate = formatDate(endDate);
				this.tempStatisticsDateRange = null;
				
				console.log('统计日期已更新:', {
					start: formatDate(startDate),
					end: formatDate(endDate)
				});
				
							// 更新违规统计数据
			await this.updateStatisticsData();
			
			uni.showToast({
					title: `已筛选 ${formatDate(startDate)} 至 ${formatDate(endDate)}`,
					icon: 'success',
					duration: 3000
				});
			}
		},

		async updateStatisticsData() {
			try {
				console.log('📊 开始更新统计数据 - 独立加载高风险车辆数据');
				
				// 独立加载高风险车辆统计数据
				await this.loadHighRiskVehiclesData();

			} catch (error) {
				console.error('更新违规统计数据失败:', error);
				uni.showToast({
					title: '更新统计数据失败',
					icon: 'none'
				});
			}
		},

		// 🆕 新增：独立加载高风险车辆统计数据
		async loadHighRiskVehiclesData() {
			try {
				console.log('🚗 开始加载高风险车辆统计数据...');
				const params = {
					...apiUtils.formatDateRange(this.statisticsStartDate, this.statisticsEndDate),
					...apiUtils.formatPagination(1, 1000), // 加载足够多的数据用于统计
					userRole: this.currentUserRole // 添加用户角色参数
				};

				// 🏠 管家角色添加小区限制
			if (this.currentUserRole === 'manager' && this.currentCommunityName) {
				params.park_name = this.currentCommunityName;
				console.log('🏠 管家高风险车辆统计添加小区限制:', this.currentCommunityName);
			}

			// 🏢 添加车场筛选（非管家角色使用当前车场）
			if (this.currentUserRole !== 'manager' && this.currentParkName) {
				params.park_name = this.currentParkName;
				console.log('🏢 添加车场筛选:', this.currentParkName);
			}

			console.log('📋 高风险车辆统计请求参数:', params);

				const data = await violationApi.getViolations(params);
				console.log('✅ 高风险车辆统计API响应数据:', data);

				// 检查数据结构 - 处理可能的双重嵌套
				let records = [];
				let actualData = data;

				// 如果有双重嵌套，取内层数据
				if (data && data.data && typeof data.data === 'object') {
					actualData = data.data;
				}

				if (actualData && actualData.records) {
					records = actualData.records;
				} else if (actualData && actualData.list) {
					records = actualData.list;
				} else if (Array.isArray(actualData)) {
					records = actualData;
				} else {
					console.warn('⚠️ 高风险车辆统计数据结构未知:', data);
					records = [];
				}

				console.log(`📊 获取到 ${records.length} 条违规记录用于高风险车辆统计`);

				// 转换数据格式并统计
				const processedRecords = records.map(item => ({
					id: item.id,
					ownerType: item.ownerType,
					plateNumber: item.plateNumber || item.plate_number,
					appointmentReason: item.appointmentReason || '回家',
					violationType: item.violationType || item.violation_type,
					isNewEnergy: this.isNewEnergyPlate(item.plateNumber || item.plate_number),
					ownerName: item.ownerName || item.owner_name || item.name || item.ownername || item.parkName || '',
					ownerPhone: item.ownerPhone || item.owner_phone || item.phone || '',
					phone: item.ownerPhone || item.owner_phone || item.phone || '',
					address: item.address || item.owner_address || item.ownerAddress || '',
					time: item.time || item.created_at || new Date().toISOString(),
					status: item.status || '未处理',
					enterTime: item.enterTime || item.enter_time,
					leaveTime: item.leaveTime || item.leave_time,
					appointmentTime: item.appointmentTime || item.appointment_time,
					location: item.location || item.violation_location || 'A区-15号车位',
					violationLocation: item.location || item.violation_location || 'A区-15号车位',
					photos: item.photos || [],
					createdAt: item.created_at || item.time,
					created_at: item.created_at || item.time
				}));

				// 统计高风险车辆
				this.calculateHighRiskVehicles(processedRecords);

				console.log('✅ 高风险车辆统计数据加载完成');

			} catch (error) {
				console.error('❌ 加载高风险车辆统计失败:', error);
				// 使用默认值
				this.highRiskCars = [];
				this.originalHighRiskCars = [];
			}
		},

		// 🆕 新增：计算高风险车辆统计
		calculateHighRiskVehicles(records) {
			const startTime = new Date(this.statisticsStartDate + ' 00:00:00').getTime();
			const endTime = new Date(this.statisticsEndDate + ' 23:59:59').getTime();

			// 创建一个Map来统计时间范围内每辆车的违规次数和信息
			const violationStats = new Map();

			console.log('📊 开始计算高风险车辆，处理记录数量:', records.length);

			// 遍历违规记录，只统计在选定日期范围内的记录
			records.forEach(record => {
				// 使用创建时间进行筛选
				const createdTime = new Date(record.createdAt || record.created_at || record.appointmentTime).getTime();

				// 检查创建时间是否在选定范围内
				if (createdTime >= startTime && createdTime <= endTime) {
					const plateNumber = record.plateNumber;

					if (!violationStats.has(plateNumber)) {
						// 初始化该车辆的统计信息
						violationStats.set(plateNumber, {
							plateNumber,
							count: 0,
							ownerName: record.ownerName || '',
							phone: record.ownerPhone || '',
							address: record.address || '',
							isNewEnergy: this.isNewEnergyPlate(plateNumber),
							isExpanded: false,
							violations: []
						});
					}

					const carStats = violationStats.get(plateNumber);
					carStats.count++;

					// 更新车主信息
					if (record.ownerName) carStats.ownerName = record.ownerName;
					if (record.ownerPhone) carStats.phone = record.ownerPhone;
					if (record.address) carStats.address = record.address;

					// 添加违规记录
					carStats.violations.push({
						time: record.time,
						violationType: record.violationType,
						status: record.status,
						appointmentReason: record.appointmentReason,
						enterTime: record.enterTime,
						leaveTime: record.leaveTime,
						appointmentTime: record.appointmentTime,
						violationLocation: record.location || record.violationLocation || 'A区-15号车位',
						photos: this.parsePhotos(record.photos)
					});
				}
			});

			// 筛选出违规次数超过3次的车辆并按违规次数降序排序
			this.highRiskCars = Array.from(violationStats.values())
				.filter(car => car.count >= 3)
				.sort((a, b) => b.count - a.count)
				.map(car => ({
					...car,
					originalViolations: [...car.violations], // 保存原始的violations数据
					filteredCount: car.violations.length, // 初始时筛选后的数量等于全部数量
					selectedStatus: '' // 初始时没有选中任何状态
				}));

			// 保存原始高风险车辆数据
			if (!this.originalHighRiskCars.length) {
				this.originalHighRiskCars = [...this.highRiskCars];
			}

			console.log(`📊 计算完成，筛选出${this.highRiskCars.length}辆高风险车辆`);

			// 显示筛选结果提示
			uni.showToast({
				title: `已筛选出${this.highRiskCars.length}辆高风险车辆`,
				icon: 'none',
				duration: 2000
			});
		},
		processRealtimeRecords() {
			try {
				// 处理实时记录的逻辑
				const startTime = new Date(this.realtimeStartDate).getTime();
				const endTime = new Date(this.realtimeEndDate).getTime();

				this.filteredRealtimeRecords = this.realtimeRecords.filter(record => {
					const recordTime = new Date(record.time).getTime();
					return recordTime >= startTime && recordTime <= endTime;
				});
			} catch (error) {
				console.error('更新实时记录失败:', error);
				uni.showToast({
					title: '更新实时记录失败',
					icon: 'none'
				});
			}
		},

		processStatistics() {
			try {
				const startTime = new Date(this.statisticsStartDate).getTime();
				const endTime = new Date(this.statisticsEndDate).getTime();

				// 处理统计数据的逻辑
				this.filteredStatisticsRecords = this.originalStatisticsRecords.filter(record => {
					const recordTime = new Date(record.time).getTime();
					return recordTime >= startTime && recordTime <= endTime;
				});

				// 更新高风险车辆数量
				this.highRiskCount = this.filteredStatisticsRecords.filter(record => {
					return record.riskLevel === 'high';
				}).length;
			} catch (error) {
				console.error('更新违规统计数据失败:', error);
				uni.showToast({
					title: '更新统计数据失败',
					icon: 'none'
				});
			}
		},

		// 处理滑动操作
		async handleSwipeAction(e) {
			const listIndex = parseInt(e.name); // 列表项索引
			const buttonIndex = e.index; // 按钮索引
			const record = this.realtimeRecords[listIndex];

			// 首先查询车辆的黑名单状态
			await this.checkCarBlacklistStatus(record.plateNumber);

			// 获取当前车辆的滑动选项
			const currentOptions = this.generateSwipeOptions(record);
			const clickedOption = currentOptions[buttonIndex];

			if (!clickedOption) {
				console.error('❌ [滑动操作] 无效的按钮索引:', buttonIndex);
				return;
			}

			console.log('🔄 [滑动操作] 点击按钮:', clickedOption.text, '车牌:', record.plateNumber);

			const isInApiBlacklist = this.isCarInBlacklist(record.plateNumber);
			const isLocalBlacklist = record.should_blacklist === 1 || record.should_blacklist === '1' || record.should_blacklist === true;
			const isLocalOwner = record.ownerType === 'local';

			switch (clickedOption.text) {
				case '拉黑':
					// 本地拉黑操作
					this.addToLocalBlacklist(record, listIndex);
					break;
				case '接口拉黑':
					// 接口拉黑操作（将本地黑名单车辆添加到接口黑名单）
					this.addToApiBlacklist(record, listIndex);
					break;
				case '移除':
					// 移除操作 - 根据黑名单来源决定移除方式
					if (isInApiBlacklist) {
						this.removeFromApiBlacklist(record, listIndex);
					} else if (isLocalBlacklist) {
						this.removeFromLocalBlacklist(record, listIndex);
					} else {
						// 如果不在黑名单中，点击了灰色的移除按钮，提示用户
						uni.showToast({
							title: '该车辆不在黑名单中',
							icon: 'none'
						});
						this.closeSwipeAction(listIndex);
					}
					break;
				case '删除':
					// 删除操作 - 直接删除数据库中的数据
					this.deleteViolationRecord(record, listIndex);
					break;
				default:
					console.warn('⚠️ [滑动操作] 未处理的按钮:', clickedOption.text);
					this.closeSwipeAction(listIndex);
			}
		},

		// 🚫 查询车辆黑名单状态
		async checkCarBlacklistStatus(plateNumber) {
			try {
				this.blacklistData.loading = true;
				console.log('🔍 [黑名单查询] 查询车牌:', plateNumber);

				const parkCode = await this.getDefaultParkCode();
				const blacklistInfo = await blacklistApi.getParkBlack(plateNumber, parkCode);
				this.blacklistData.currentCarBlackStatus = blacklistInfo;
				
				console.log('🚫 [黑名单状态]:', blacklistInfo);
			} catch (error) {
				console.error('❌ [黑名单查询失败]:', error);
				this.blacklistData.currentCarBlackStatus = null;
			} finally {
				this.blacklistData.loading = false;
			}
		},

		// 🚫 获取黑名单类型列表
		async getSpecialCarTypes() {
			try {
				console.log('📋 [获取黑名单类型]');

				const parkCode = await this.getDefaultParkCode();
				const result = await blacklistApi.getSpecialCarTypeList(parkCode);
				this.blacklistData.specialCarTypes = result.recordList || [];
				console.log('✅ [黑名单类型列表]:', this.blacklistData.specialCarTypes);
			} catch (error) {
				console.error('❌ [获取黑名单类型失败]:', error);
			}
		},

		// 🚫 添加到本地黑名单（should_blacklist=1）
		async addToLocalBlacklist(record, index) {
			uni.showModal({
				title: '确认本地拉黑',
				content: `确认将车牌 ${record.plateNumber} 加入本地黑名单？\n\n⚠️ 本地拉黑后该车辆将在本地标记为黑名单状态`,
				success: async (res) => {
					if (res.confirm) {
						try {
							// 这里可以调用后端API来设置should_blacklist=1
							// 暂时直接更新本地状态
							this.$set(this.realtimeRecords[index], 'should_blacklist', 1);
							this.$set(this.realtimeRecords[index], 'isBlacklisted', true);
							
							// 同时更新原始数据
							const originalIndex = this.originalRealtimeRecords.findIndex(r => r.plateNumber === record.plateNumber);
							if (originalIndex !== -1) {
								this.$set(this.originalRealtimeRecords[originalIndex], 'should_blacklist', 1);
								this.$set(this.originalRealtimeRecords[originalIndex], 'isBlacklisted', true);
							}
							
							uni.showToast({
								title: '已加入本地黑名单',
								icon: 'success'
							});
							
							console.log('✅ [本地拉黑成功]:', record.plateNumber);
						} catch (error) {
							console.error('❌ [本地拉黑失败]:', error);
							uni.showToast({
								title: '本地拉黑失败',
								icon: 'none'
							});
						} finally {
							this.closeSwipeAction(index);
						}
					} else {
						this.closeSwipeAction(index);
					}
				}
			});
		},

		// 🚫 添加到接口黑名单
		async addToApiBlacklist(record, index) {
			// 确保有黑名单类型数据
			if (this.blacklistData.specialCarTypes.length === 0) {
				await this.getSpecialCarTypes();
			}

			if (this.blacklistData.specialCarTypes.length === 0) {
				uni.showToast({
					title: '无法获取黑名单类型',
					icon: 'none'
				});
				this.closeSwipeAction(index);
				return;
			}

			uni.showModal({
				title: '确认接口拉黑',
				content: `确认将车牌 ${record.plateNumber} 加入接口黑名单？\n\n⚠️ 接口拉黑后该车辆将无法预约停车`,
				success: async (res) => {
					if (res.confirm) {
						await this.performAddToBlacklist(record, index);
					} else {
						this.closeSwipeAction(index);
					}
				}
			});
		},

		// 🚫 添加到黑名单
		async addToBlacklist(record, index) {
			// 检查是否已在黑名单中
			if (this.blacklistData.currentCarBlackStatus && 
				this.blacklistData.currentCarBlackStatus.recordList && 
				this.blacklistData.currentCarBlackStatus.recordList.length > 0) {
				
				uni.showModal({
					title: '车辆已在黑名单',
					content: `车牌 ${record.plateNumber} 已在黑名单中，无需重复添加`,
					showCancel: false,
					success: () => {
						this.closeSwipeAction(index);
					}
				});
				return;
			}

			// 确保有黑名单类型数据
			if (this.blacklistData.specialCarTypes.length === 0) {
				await this.getSpecialCarTypes();
			}

			if (this.blacklistData.specialCarTypes.length === 0) {
				uni.showToast({
					title: '无法获取黑名单类型',
					icon: 'none'
				});
				this.closeSwipeAction(index);
				return;
			}

			uni.showModal({
				title: '确认拉黑',
				content: `确认将车牌 ${record.plateNumber} 加入黑名单？\n\n⚠️ 拉黑后该车辆将无法预约停车`,
				success: async (res) => {
					if (res.confirm) {
						await this.performAddToBlacklist(record, index);
					} else {
						this.closeSwipeAction(index);
					}
				}
			});
		},

		// 🚫 执行添加黑名单操作
		async performAddToBlacklist(record, index) {
			try {
				uni.showLoading({ title: '正在添加到黑名单...' });

				// 使用第一个黑名单类型（违规车辆）
				const defaultSpecialCarType = this.blacklistData.specialCarTypes[0];
				const specialCarType = defaultSpecialCarType ? defaultSpecialCarType.id : 1;

				const parkCode = await this.getDefaultParkCode();
				await blacklistApi.addBlackListCar(record.plateNumber, parkCode, specialCarType);

				// 更新记录状态
				this.$set(this.realtimeRecords[index], 'isBlacklisted', true);
				this.$set(this.realtimeRecords[index], 'statusText', '🚫已拉黑');

				uni.showToast({
					title: '已加入黑名单',
					icon: 'success'
				});

				console.log('✅ [拉黑成功]:', record.plateNumber);
			} catch (error) {
				console.error('❌ [拉黑失败]:', error);
				uni.showToast({
					title: '拉黑失败',
					icon: 'none'
				});
			} finally {
				uni.hideLoading();
				this.closeSwipeAction(index);
			}
		},

		// 🚫 从本地黑名单移除
		async removeFromLocalBlacklist(record, index) {
			uni.showModal({
				title: '确认移除本地黑名单',
				content: `确认将车牌 ${record.plateNumber} 从本地黑名单中移除？\n\n✅ 移除后该车辆本地黑名单标记将被取消`,
				success: async (res) => {
					if (res.confirm) {
						try {
							// 这里可以调用后端API来设置should_blacklist=0
							// 暂时直接更新本地状态
							this.$set(this.realtimeRecords[index], 'should_blacklist', 0);
							this.$set(this.realtimeRecords[index], 'isBlacklisted', false);
							
							// 同时更新原始数据
							const originalIndex = this.originalRealtimeRecords.findIndex(r => r.plateNumber === record.plateNumber);
							if (originalIndex !== -1) {
								this.$set(this.originalRealtimeRecords[originalIndex], 'should_blacklist', 0);
								this.$set(this.originalRealtimeRecords[originalIndex], 'isBlacklisted', false);
							}
							
							uni.showToast({
								title: '已从本地黑名单移除',
								icon: 'success'
							});
							
							console.log('✅ [本地黑名单移除成功]:', record.plateNumber);
						} catch (error) {
							console.error('❌ [本地黑名单移除失败]:', error);
							uni.showToast({
								title: '移除失败',
								icon: 'none'
							});
						} finally {
							this.closeSwipeAction(index);
						}
					} else {
						this.closeSwipeAction(index);
					}
				}
			});
		},

		// 🚫 从接口黑名单移除
		async removeFromApiBlacklist(record, index) {
			// 检查是否在黑名单中
			if (!this.blacklistData.currentCarBlackStatus || 
				!this.blacklistData.currentCarBlackStatus.recordList || 
				this.blacklistData.currentCarBlackStatus.recordList.length === 0) {
				
				uni.showModal({
					title: '车辆不在接口黑名单',
					content: `车牌 ${record.plateNumber} 不在接口黑名单中`,
					showCancel: false,
					success: () => {
						this.closeSwipeAction(index);
					}
				});
				return;
			}

			uni.showModal({
				title: '确认移除接口黑名单',
				content: `确认将车牌 ${record.plateNumber} 从接口黑名单中移除？\n\n✅ 移除后该车辆可以正常预约停车`,
				success: async (res) => {
					if (res.confirm) {
						await this.performRemoveFromBlacklist(record, index);
					} else {
						this.closeSwipeAction(index);
					}
				}
			});
		},

		// 🚫 从黑名单移除
		async removeFromBlacklist(record, index) {
			// 检查是否在黑名单中
			if (!this.blacklistData.currentCarBlackStatus || 
				!this.blacklistData.currentCarBlackStatus.recordList || 
				this.blacklistData.currentCarBlackStatus.recordList.length === 0) {
				
				uni.showModal({
					title: '车辆不在黑名单',
					content: `车牌 ${record.plateNumber} 不在黑名单中`,
					showCancel: false,
					success: () => {
						this.closeSwipeAction(index);
					}
				});
				return;
			}

			uni.showModal({
				title: '确认移除',
				content: `确认将车牌 ${record.plateNumber} 从黑名单中移除？\n\n✅ 移除后该车辆可以正常预约停车`,
				success: async (res) => {
					if (res.confirm) {
						await this.performRemoveFromBlacklist(record, index);
					} else {
						this.closeSwipeAction(index);
					}
				}
			});
		},

		// 🚫 执行移除黑名单操作
		async performRemoveFromBlacklist(record, index) {
			try {
				uni.showLoading({ title: '正在移除黑名单...' });

				const parkCode = await this.getDefaultParkCode();
				await blacklistApi.removeBlackListCar(record.plateNumber, parkCode);

				// 更新记录状态
				this.$set(this.realtimeRecords[index], 'isBlacklisted', false);
				this.$set(this.realtimeRecords[index], 'statusText', '已移除黑名单');

				uni.showToast({
					title: '已移除黑名单',
					icon: 'success'
				});

				console.log('✅ [移除黑名单成功]:', record.plateNumber);
			} catch (error) {
				console.error('❌ [移除黑名单失败]:', error);
				uni.showToast({
					title: '移除失败',
					icon: 'none'
				});
			} finally {
				uni.hideLoading();
				this.closeSwipeAction(index);
			}
		},

			// 🗑️ 删除违规记录
	async deleteViolationRecord(record, index) {
		// 首先检查车辆黑名单状态
		await this.checkCarBlacklistStatus(record.plateNumber);
		
		const isInApiBlacklist = this.isCarInBlacklist(record.plateNumber);
		const isLocalBlacklist = record.should_blacklist === 1 || record.should_blacklist === '1' || record.should_blacklist === true;
		
		// 如果车辆在黑名单中，显示特殊的确认对话框
		if (isInApiBlacklist || isLocalBlacklist) {
			this.showDeleteWithBlacklistConfirm(record, index, isInApiBlacklist, isLocalBlacklist);
		} else {
			// 正常删除流程
			uni.showModal({
				title: '确认删除',
				content: `确认删除车牌 ${record.plateNumber} 的违规记录？\n\n⚠️ 删除后将无法恢复，请谨慎操作`,
				confirmText: '确认删除',
				confirmColor: '#ff4d4f',
				success: async (res) => {
					if (res.confirm) {
						await this.performDeleteViolationRecord(record, index);
					} else {
						this.closeSwipeAction(index);
					}
				}
			});
		}
	},
	
	// 🚫 显示包含黑名单移除选项的删除确认对话框
	showDeleteWithBlacklistConfirm(record, index, isInApiBlacklist, isLocalBlacklist) {
		const blacklistType = isInApiBlacklist ? '线上黑名单' : '本地黑名单';
		
		uni.showModal({
			title: '删除违规记录',
			content: `车牌 ${record.plateNumber} 当前在${blacklistType}中\n\n是否同时移除黑名单记录？`,
			showCancel: true,
			cancelText: '仅删除违规',
			confirmText: '删除并移除黑名单',
			confirmColor: '#ff4d4f',
			success: async (res) => {
				if (res.confirm) {
					// 用户选择同时移除黑名单
					await this.performDeleteWithBlacklistRemoval(record, index, isInApiBlacklist);
				} else if (res.cancel) {
					// 用户选择仅删除违规记录
					await this.performDeleteViolationRecord(record, index);
				}
			},
			fail: () => {
				this.closeSwipeAction(index);
			}
		});
	},
	
	// 🚫 执行删除违规记录并移除黑名单
	async performDeleteWithBlacklistRemoval(record, index, isInApiBlacklist) {
		try {
			uni.showLoading({ title: '正在处理...' });
			
			// 先移除黑名单
			if (isInApiBlacklist) {
				await this.removeFromApiBlacklistSilent(record);
			} else {
				await this.removeFromLocalBlacklistSilent(record);
			}
			
			// 再删除违规记录
			await this.performDeleteViolationRecord(record, index);
			
			uni.showToast({
				title: '删除成功，已同时移除黑名单',
				icon: 'success',
				duration: 2000
			});
			
		} catch (error) {
			console.error('❌ [删除并移除黑名单失败]:', error);
			uni.showToast({
				title: '操作失败：' + (error.message || '未知错误'),
				icon: 'none',
				duration: 3000
			});
				} finally {
			uni.hideLoading();
			this.closeSwipeAction(index);
		}
	},
	
	// 🚫 静默移除API黑名单（用于删除流程中）
	async removeFromApiBlacklistSilent(record) {
		try {
			// 检查是否在黑名单中
			if (!this.blacklistData.currentCarBlackStatus || 
				!this.blacklistData.currentCarBlackStatus.recordList || 
				this.blacklistData.currentCarBlackStatus.recordList.length === 0) {
				console.log('📋 [静默移除API黑名单] 车辆不在黑名单中:', record.plateNumber);
				return;
			}

			const parkCode = await this.getDefaultParkCode();
			await blacklistApi.removeBlackListCar(record.plateNumber, parkCode);
			
			console.log('✅ [静默移除API黑名单成功]:', record.plateNumber);
		} catch (error) {
			console.error('❌ [静默移除API黑名单失败]:', error);
			throw error; // 重新抛出错误，让调用方处理
		}
	},
	
	// 🚫 静默移除本地黑名单（用于删除流程中）
	async removeFromLocalBlacklistSilent(record) {
		try {
			// 这里可以调用后端API来设置should_blacklist=0
			// 暂时直接更新本地状态（与移除本地黑名单逻辑一致）
			
			// 在实时记录中查找并更新
			const recordIndex = this.realtimeRecords.findIndex(r => 
				r.plateNumber === record.plateNumber && 
				r.appointmentTime === record.appointmentTime
			);
			if (recordIndex !== -1) {
				this.$set(this.realtimeRecords[recordIndex], 'should_blacklist', 0);
				this.$set(this.realtimeRecords[recordIndex], 'isBlacklisted', false);
			}
			
			// 同时更新原始数据
			const originalIndex = this.originalRealtimeRecords.findIndex(r => 
				r.plateNumber === record.plateNumber && 
				r.appointmentTime === record.appointmentTime
			);
			if (originalIndex !== -1) {
				this.$set(this.originalRealtimeRecords[originalIndex], 'should_blacklist', 0);
				this.$set(this.originalRealtimeRecords[originalIndex], 'isBlacklisted', false);
			}
			
			console.log('✅ [静默移除本地黑名单成功]:', record.plateNumber);
		} catch (error) {
			console.error('❌ [静默移除本地黑名单失败]:', error);
			throw error; // 重新抛出错误，让调用方处理
		}
	},

	// 🗑️ 执行删除违规记录操作
		async performDeleteViolationRecord(record, index) {
			try {
				// 🔧 权限检查和调试信息
				const userInfo = uni.getStorageSync('userInfo');
				console.log('🔍 [删除违规记录] 用户信息检查:');
				console.log('  - 完整用户信息:', userInfo);
				console.log('  - 用户角色:', userInfo?.role);
				console.log('  - 用户权限:', userInfo?.userInfo?.permissions);
				console.log('  - 是否有违规管理权限:', userInfo?.userInfo?.permissions?.includes('violation.manage'));
				
				uni.showLoading({ title: '正在删除记录...' });

				// 调用删除API - 需要根据后端API来设置参数
				const params = {
					plateNumber: record.plateNumber,
					id: record.id || record._id || record.recordId, // 后端期望的是id字段
					appointmentTime: record.appointmentTime,
					userRole: userInfo?.role // 添加用户角色信息
				};
				
				// 🔧 增加调试信息，帮助排查参数问题
				console.log('🔍 [删除违规记录] 原始记录数据:', record);
				console.log('🔍 [删除违规记录] 构建的参数:', params);
				console.log('🔍 [删除违规记录] ID字段检查:');
				console.log('  - record.id:', record.id);
				console.log('  - record._id:', record._id);
				console.log('  - record.recordId:', record.recordId);
				console.log('  - 最终使用的id:', params.id);
				console.log('🔍 [删除违规记录] 权限信息:');
				console.log('  - 用户角色:', userInfo?.role);
				console.log('  - 传递给后端的userRole:', params.userRole);

				// 调用后端删除API
				const response = await violationApi.deleteViolation(params);
				
				// 🔧 修复响应判断逻辑：如果没有抛出异常，说明删除成功
				console.log('✅ [删除违规记录] API调用成功，响应数据:', response);
				
				// 如果代码执行到这里没有抛出异常，说明删除成功
				if (true) { // 🔧 简化判断逻辑，因为错误情况会在API层面抛出异常
					// 从当前显示列表中移除记录
					this.realtimeRecords.splice(index, 1);
					
					// 从原始数据中移除记录（根据车牌号和时间匹配）
					const originalIndex = this.originalRealtimeRecords.findIndex(r => 
						r.plateNumber === record.plateNumber && 
						r.appointmentTime === record.appointmentTime
					);
					if (originalIndex !== -1) {
						this.originalRealtimeRecords.splice(originalIndex, 1);
					}

					// 更新违规统计数据
					await this.updateStatisticsData();

					uni.showToast({
						title: '删除成功',
						icon: 'success'
					});

					console.log('✅ [删除违规记录成功]:', record.plateNumber);
				}
			} catch (error) {
				console.error('❌ [删除违规记录失败]:', error);
				
				// 根据错误类型显示不同的提示
				let errorMessage = '删除失败';
				if (error.message && error.message.includes('网络')) {
					errorMessage = '网络错误，请检查网络连接';
				} else if (error.message && error.message.includes('权限')) {
					errorMessage = '无权限删除此记录';
				} else if (error.message && error.message.includes('无权限')) {
					errorMessage = '无权限删除此记录';
				} else if (error.message) {
					errorMessage = error.message;
				}
				
				uni.showToast({
					title: errorMessage,
					icon: 'none',
					duration: 3000
				});
			} finally {
				uni.hideLoading();
				this.closeSwipeAction(index);
			}
		},

		// 🔧 关闭滑动面板
		closeSwipeAction(index) {
			if (this.$refs.uSwipeAction && typeof this.$refs.uSwipeAction.closeOther === 'function') {
				this.$refs.uSwipeAction.closeOther(index);
			}
		},

		// 🏢 获取默认停车场代码
		async getDefaultParkCode() {
			try {
				// 从存储中获取车场名称，如果没有则使用默认值
				const savedParkName = uni.getStorageSync('selectedParkName') || '默认车场';
				
				console.log('🏢 获取车场编码，车场名称:', savedParkName);
				
				// 调用API获取车场编码 - 使用正确的参数格式
				const response = await request({
					url: '/parking/yardInfo/yardCode',
					method: 'GET',
					data: {
						yardName: savedParkName
					}
				});
				
				console.log('🏢 车场编码API响应:', response);
				
				// 处理响应数据
				if (response.data && Array.isArray(response.data) && response.data.length > 0) {
					const parkCode = response.data[0];
					console.log('🏢 获取到车场编码:', parkCode);
					return parkCode;
				} else if (response.data && typeof response.data === 'string') {
					console.log('🏢 获取到车场编码:', response.data);
					return response.data;
				} else {
					console.warn('🏢 车场编码API返回格式异常:', response);
					return 'ZK001'; // 默认车场编码
				}
				
			} catch (error) {
				console.error('🏢 获取车场编码失败:', error);
				// API调用失败时返回默认值
				return 'ZK001';
			}
		},

		// 🏢 设置车场名称
		setParkName(parkName) {
			try {
				uni.setStorageSync('selectedParkName', parkName);
				console.log('🏢 已保存车场名称:', parkName);
			} catch (error) {
				console.error('🏢 保存车场名称失败:', error);
			}
		},

		// 🏢 获取当前车场名称
		getCurrentParkName() {
			try {
				// 🆕 优先从用户信息中获取巡逻员的小区名称
				const userInfo = uni.getStorageSync('userInfo');
				let parkNameFromUser = null;
				
				if (userInfo) {
					// 从用户信息中提取小区名称，支持多种可能的字段
					parkNameFromUser = userInfo.yardName || 
						userInfo.userInfo?.community || 
						userInfo.userInfo?.yardName ||
						userInfo.patrolData?.managerInfo?.community || 
						userInfo.patrolData?.community ||
						userInfo.communityInfo?.name;
					
					console.log('👮‍♂️ 从巡逻员信息获取小区名称:', parkNameFromUser);
					
					// 如果找到了用户的小区名称，同时存储到selectedParkName中以便后续使用
					if (parkNameFromUser && parkNameFromUser !== uni.getStorageSync('selectedParkName')) {
						console.log('💾 将巡逻员小区名称存储为车场名称:', parkNameFromUser);
						uni.setStorageSync('selectedParkName', parkNameFromUser);
					}
				}
				
				// 优先使用用户的小区名称，其次从存储中获取，最后使用默认值
				const parkName = parkNameFromUser || 
					uni.getStorageSync('selectedParkName') || 
					'默认车场';
				
				console.log('🏢 最终确定的车场名称:', parkName);
				return parkName;
			} catch (error) {
				console.error('🏢 获取车场名称失败:', error);
				return '默认车场';
			}
		},

		// 🏢 初始化车场信息
		async initializeParkInfo() {
			try {
				
				// 获取存储的车场名称
				this.currentParkName = this.getCurrentParkName();
				
				// 获取对应的车场编码
				this.currentParkCode = await this.getDefaultParkCode();
			
				
				// 如果没有设置车场名称，设置一个默认值
				if (!this.currentParkName || this.currentParkName === '默认车场') {
					this.setParkName('万象上东'); // 设置一个默认的车场名称
					this.currentParkName = '万象上东';
					this.currentParkCode = await this.getDefaultParkCode();
				}
				
			} catch (error) {
				console.error('🏢 初始化车场信息失败:', error);
				// 设置默认值
				this.currentParkName = '默认车场';
				this.currentParkCode = 'ZK001';
			}
		},



		// 🔧 根据车辆黑名单状态生成滑动选项
		generateSwipeOptions(record) {
			// 🔧 检查用户权限
			const userInfo = uni.getStorageSync('userInfo');
			const userRole = userInfo?.role;
			const hasDeletePermission = userRole === 'manager' || userRole === 'patrol'; // 管家和巡逻员都能删除
			
			const isInApiBlacklist = this.isCarInBlacklist(record.plateNumber);
			const isLocalBlacklist = record.should_blacklist === 1 || record.should_blacklist === '1' || record.should_blacklist === true;
			const isLocalOwner = record.ownerType === 'local';
			
			// 如果在接口黑名单中，显示移除和删除按钮（删除需要权限）
			if (isInApiBlacklist) {
				const options = [{
					text: '移除',
					style: {
						backgroundColor: '#19be6b',
						borderRadius: hasDeletePermission ? '8rpx 0 0 8rpx' : '8rpx',
						width: '120rpx',
						height: '100%',
						fontSize: '28rpx',
						fontWeight: 'bold',
						color: '#ffffff'
					}
				}];
				
				// 只有管家角色才显示删除按钮
				if (hasDeletePermission) {
					options.push({
						text: '删除',
						style: {
							backgroundColor: '#ff6600',
							borderRadius: '0 8rpx 8rpx 0',
							width: '120rpx',
							height: '100%',
							fontSize: '28rpx',
							fontWeight: 'bold',
							color: '#ffffff',
							borderLeft: '2rpx solid #fff'
						}
					});
				}
				
				return options;
			}
			
			// 如果是本地黑名单（should_blacklist=1），根据车主类型决定按钮
			if (isLocalBlacklist) {
				if (isLocalOwner) {
					// 本地车主的本地黑名单：显示"接口拉黑"、"移除"和"删除"按钮（删除需要权限）
					const options = [{
						text: '接口拉黑',
						style: {
							backgroundColor: '#ff4d4f',
							borderRadius: '8rpx 0 0 0',
							width: hasDeletePermission ? '100rpx' : '120rpx',
							height: '100%',
							fontSize: '24rpx',
							fontWeight: 'bold',
							color: '#ffffff'
						}
					}, {
						text: '移除',
						style: {
							backgroundColor: '#19be6b',
							borderRadius: hasDeletePermission ? '0' : '0 8rpx 8rpx 0',
							width: hasDeletePermission ? '100rpx' : '120rpx',
							height: '100%',
							fontSize: '28rpx',
							fontWeight: 'bold',
							color: '#ffffff',
							borderLeft: '2rpx solid #fff'
						}
					}];
					
					// 只有管家角色才显示删除按钮
					if (hasDeletePermission) {
						options.push({
							text: '删除',
							style: {
								backgroundColor: '#ff6600',
								borderRadius: '0 8rpx 0 0',
								width: '100rpx',
								height: '100%',
								fontSize: '28rpx',
								fontWeight: 'bold',
								color: '#ffffff',
								borderLeft: '2rpx solid #fff'
							}
						});
					}
					
					return options;
				} else {
					// 非本地车主的本地黑名单：显示移除和删除按钮（删除需要权限）
					const options = [{
						text: '移除',
						style: {
							backgroundColor: '#19be6b',
							borderRadius: hasDeletePermission ? '8rpx 0 0 8rpx' : '8rpx',
							width: '120rpx',
							height: '100%',
							fontSize: '28rpx',
							fontWeight: 'bold',
							color: '#ffffff'
						}
					}];
					
					// 只有管家角色才显示删除按钮
					if (hasDeletePermission) {
						options.push({
							text: '删除',
							style: {
								backgroundColor: '#ff6600',
								borderRadius: '0 8rpx 8rpx 0',
								width: '120rpx',
								height: '100%',
								fontSize: '28rpx',
								fontWeight: 'bold',
								color: '#ffffff',
								borderLeft: '2rpx solid #fff'
							}
						});
					}
					
					return options;
				}
			}
			
			// 如果不在任何黑名单中
			if (isLocalOwner) {
				// 本地车主：显示"拉黑"、"移除"（灰色禁用）和"删除"按钮（删除需要权限）
				const options = [{
					text: '拉黑',
					style: {
						backgroundColor: '#ff4d4f',
						borderRadius: '8rpx 0 0 0',
						width: hasDeletePermission ? '100rpx' : '120rpx',
						height: '100%',
						fontSize: '28rpx',
						fontWeight: 'bold',
						color: '#ffffff'
					}
				}, {
					text: '移除',
					style: {
						backgroundColor: '#cccccc',
						borderRadius: hasDeletePermission ? '0' : '0 8rpx 8rpx 0',
						width: hasDeletePermission ? '100rpx' : '120rpx',
						height: '100%',
						fontSize: '28rpx',
						fontWeight: 'bold',
						borderLeft: '2rpx solid #fff',
						color: '#999999'
					}
				}];
				
				// 只有管家角色才显示删除按钮
				if (hasDeletePermission) {
					options.push({
						text: '删除',
						style: {
							backgroundColor: '#ff6600',
							borderRadius: '0 8rpx 0 0',
							width: '100rpx',
							height: '100%',
							fontSize: '28rpx',
							fontWeight: 'bold',
							color: '#ffffff',
							borderLeft: '2rpx solid #fff'
						}
					});
				}
				
				return options;
			} else {
				// 非本地车主：显示"拉黑"和"删除"按钮（删除需要权限）
				const options = [{
					text: '拉黑',
					style: {
						backgroundColor: '#ff4d4f',
						borderRadius: hasDeletePermission ? '8rpx 0 0 8rpx' : '8rpx',
						width: '120rpx',
						height: '100%',
						fontSize: '28rpx',
						fontWeight: 'bold',
						color: '#ffffff'
					}
				}];
				
				// 只有管家角色才显示删除按钮
				if (hasDeletePermission) {
					options.push({
						text: '删除',
						style: {
							backgroundColor: '#ff6600',
							borderRadius: '0 8rpx 8rpx 0',
							width: '120rpx',
							height: '100%',
							fontSize: '28rpx',
							fontWeight: 'bold',
							color: '#ffffff',
							borderLeft: '2rpx solid #fff'
						}
					});
				}
				
				return options;
			}
		},

		// 🔍 检查车辆是否在黑名单中
		isCarInBlacklist(plateNumber) {
			return this.blacklistData.currentCarBlackStatus && 
				   this.blacklistData.currentCarBlackStatus.recordList && 
				   this.blacklistData.currentCarBlackStatus.recordList.length > 0;
		},

		// 获取黑名单高风险车辆数量
		getBlacklistedHighRiskCount() {
			return this.highRiskCars.filter(car => car.isBlacklisted).length;
		},

		// 获取黑名单实时违规记录数量
		getBlacklistedRealtimeCount() {
			const blacklistedRecords = this.realtimeRecords.filter(record => record.isBlacklisted);
			console.log('🔍 [getBlacklistedRealtimeCount] 计算已拉黑记录数量:', blacklistedRecords.length);
			console.log('🔍 [getBlacklistedRealtimeCount] 已拉黑车牌:', blacklistedRecords.map(r => r.plateNumber));
			return blacklistedRecords.length;
		},

		// 🚫 批量检查车辆黑名单状态
		async batchCheckBlacklistStatus() {
			console.log('🔍 [batchCheckBlacklistStatus] 开始执行');
			
			if (!this.realtimeRecords || this.realtimeRecords.length === 0) {
				console.log('🔍 [batchCheckBlacklistStatus] 没有记录需要检查，退出');
				return;
			}
			
			// 🔧 首先检查should_blacklist字段，即使API失败也要保证这部分功能
			let blacklistCount = 0;
			this.realtimeRecords.forEach((record, index) => {
				const shouldBlacklistField = record.should_blacklist === 1 || record.should_blacklist === '1' || record.should_blacklist === true;
				if (shouldBlacklistField) {
					this.$set(this.realtimeRecords[index], 'isBlacklisted', true);
					blacklistCount++;
					console.log('🚫 [should_blacklist] 预设黑名单车辆:', record.plateNumber);
				}
			});
			
			console.log(`🔍 [批量检查黑名单] 共设置了 ${blacklistCount} 辆车为已拉黑状态`);
			
			// 🔧 同样处理高风险车辆
			this.highRiskCars.forEach((car, index) => {
				const shouldBlacklistField = car.should_blacklist === 1 || car.should_blacklist === '1' || car.should_blacklist === true;
				if (shouldBlacklistField) {
					this.$set(this.highRiskCars[index], 'isBlacklisted', true);
				}
			});
			
			this.originalHighRiskCars.forEach((car, index) => {
				const shouldBlacklistField = car.should_blacklist === 1 || car.should_blacklist === '1' || car.should_blacklist === true;
				if (shouldBlacklistField) {
					this.$set(this.originalHighRiskCars[index], 'isBlacklisted', true);
				}
			});
			
					// 为了提高性能，我们可以获取所有黑名单，然后本地匹配
		try {
			const parkCode = await this.getDefaultParkCode();
			console.log("🔍 [批量检查黑名单] 获取到车场编码：", parkCode);
			console.log("🔍 [批量检查黑名单] 车场编码类型：", typeof parkCode);
			console.log("🔍 [批量检查黑名单] 车场编码长度：", parkCode ? parkCode.length : 'N/A');
			console.log("🔍 [批量检查黑名单] 车场编码为空检查：", !parkCode);
			
			// 额外校验：确保车场编码有效
			if (!parkCode || typeof parkCode !== 'string' || parkCode.trim() === '') {
				console.error('❌ [批量检查黑名单] 车场编码无效，停止查询');
				console.error('❌ [批量检查黑名单] parkCode值:', parkCode);
				return; // 直接退出，不进行黑名单查询
			}
			
			console.log("🚀 [批量检查黑名单] 开始调用 blacklistApi.getParkBlackList...");
			const blacklistedCars = await blacklistApi.getParkBlackList(parkCode);
			
			// 🔧 增加错误处理和数据校验
			console.log('🔍 [批量检查黑名单] 后端响应:', blacklistedCars);
			
			let blacklistedPlates = new Set();
			
			// 检查后端是否返回错误
			if (blacklistedCars && blacklistedCars.resultCode && blacklistedCars.resultCode !== 200) {
				console.error('❌ [批量检查黑名单] 后端返回错误:', blacklistedCars.message || '未知错误');
				console.error('❌ [批量检查黑名单] 错误代码:', blacklistedCars.resultCode);
				// 如果后端返回错误，使用空的黑名单集合
			} else if (blacklistedCars && blacklistedCars.recordList && Array.isArray(blacklistedCars.recordList)) {
				// 正常情况：有recordList数组
				blacklistedPlates = new Set(blacklistedCars.recordList.map(car => car.carCode || car.plateNumber));
				console.log('✅ [批量检查黑名单] 从recordList获取黑名单:', blacklistedPlates.size, '个车辆');
			} else if (blacklistedCars && Array.isArray(blacklistedCars)) {
				// 备用情况：blacklistedCars本身就是数组
				blacklistedPlates = new Set(blacklistedCars.map(car => car.carCode || car.plateNumber));
				console.log('✅ [批量检查黑名单] 从数组获取黑名单:', blacklistedPlates.size, '个车辆');
			} else {
				console.warn('⚠️ [批量检查黑名单] 数据格式异常，使用空黑名单集合');
				console.warn('⚠️ [批量检查黑名单] 数据类型:', typeof blacklistedCars);
				console.warn('⚠️ [批量检查黑名单] 是否为数组:', Array.isArray(blacklistedCars));
			}

				// 更新每条记录的黑名单状态
				this.realtimeRecords.forEach((record, index) => {
					// 检查黑名单接口和should_blacklist字段
					const isInBlacklistAPI = blacklistedPlates.has(record.plateNumber);
					const shouldBlacklistField = record.should_blacklist === 1 || record.should_blacklist === '1' || record.should_blacklist === true;
					const isBlacklisted = isInBlacklistAPI || shouldBlacklistField;
					
					this.$set(this.realtimeRecords[index], 'isBlacklisted', isBlacklisted);
					
					// 🔍 调试日志
					if (shouldBlacklistField) {
						console.log('🚫 [should_blacklist] 车牌:', record.plateNumber, 'should_blacklist值:', record.should_blacklist);
					}
				});

				// 🔧 同时更新高风险车辆的黑名单状态
				this.highRiskCars.forEach((car, index) => {
					// 检查黑名单接口和should_blacklist字段
					const isInBlacklistAPI = blacklistedPlates.has(car.plateNumber);
					const shouldBlacklistField = car.should_blacklist === 1 || car.should_blacklist === '1' || car.should_blacklist === true;
					const isBlacklisted = isInBlacklistAPI || shouldBlacklistField;
					
					this.$set(this.highRiskCars[index], 'isBlacklisted', isBlacklisted);
					
					// 🔍 调试日志
					if (shouldBlacklistField) {
						console.log('🚫 [should_blacklist] 高风险车辆:', car.plateNumber, 'should_blacklist值:', car.should_blacklist);
					}
				});

				// 🔧 也更新原始高风险车辆数据的黑名单状态
				this.originalHighRiskCars.forEach((car, index) => {
					// 检查黑名单接口和should_blacklist字段
					const isInBlacklistAPI = blacklistedPlates.has(car.plateNumber);
					const shouldBlacklistField = car.should_blacklist === 1 || car.should_blacklist === '1' || car.should_blacklist === true;
					const isBlacklisted = isInBlacklistAPI || shouldBlacklistField;
					
					this.$set(this.originalHighRiskCars[index], 'isBlacklisted', isBlacklisted);
					
					// 🔍 调试日志
					if (shouldBlacklistField) {
						console.log('🚫 [should_blacklist] 原始高风险车辆:', car.plateNumber, 'should_blacklist值:', car.should_blacklist);
					}
				});

				// 统计黑名单车辆数量
				const blacklistedCount = this.realtimeRecords.filter(record => record.isBlacklisted).length;
				const blacklistedHighRiskCount = this.highRiskCars.filter(car => car.isBlacklisted).length;
				
				// 分别统计来源
				const apiBlacklistedCount = this.realtimeRecords.filter(record => blacklistedPlates.has(record.plateNumber)).length;
				const shouldBlacklistCount = this.realtimeRecords.filter(record => (record.should_blacklist === 1 || record.should_blacklist === '1' || record.should_blacklist === true)).length;
				
				console.log('✅ [批量检查黑名单] 完成，黑名单API发现:', blacklistedPlates.size, '个车辆');
				console.log('📊 [黑名单统计] 实时违规记录中黑名单车辆:', blacklistedCount, '个 (API:', apiBlacklistedCount, '个, should_blacklist:', shouldBlacklistCount, '个)');
				console.log('📊 [黑名单统计] 高风险车辆中黑名单车辆:', blacklistedHighRiskCount, '个');
			} catch (error) {
				console.error('❌ [批量检查黑名单失败]:', error);
			}
		},

		// 从数据库加载数据
		async loadDataFromDatabase() {
			try {
				console.log('🚀 开始从数据库加载数据...');
				uni.showLoading({ title: '加载中...' });

				// 🏠 管家角色需要等待小区信息加载完成
				if (this.currentUserRole === 'manager' && !this.communityLoaded) {
					console.log('⏳ 管家角色等待小区信息加载完成...');
					await this.loadManagerCommunityInfo();
				}

				// 并行加载各种数据
				await Promise.all([
					this.loadViolationStatistics(),
					this.loadRealtimeViolations(),
					this.loadUserCreditScore()
				]);

				// 数据加载完成后更新界面
				await this.updateStatisticsData();
				// 确保实时记录也按设定的时间范围进行筛选
				this.updateRealtimeRecords();

				console.log('✅ 数据库数据加载完成，不要模拟数据');
				console.log('🔍 最终数据检查:');
				console.log('  - realtimeRecords.length:', this.realtimeRecords.length);
				console.log('  - originalRealtimeRecords.length:', this.originalRealtimeRecords.length);
				console.log('  - realtimeRecords 数据:', this.realtimeRecords);

				// 🚫 批量检查车辆黑名单状态
				await this.batchCheckBlacklistStatus();

			} catch (error) {
				console.error('❌ 加载数据失败:', error);
				apiUtils.handleApiError(error, '数据加载失败');
				// 如果数据库加载失败，使用静态数据作为备用
				console.log('🔄 使用静态数据作为备用...');
				this.initializeRandomTimeData();
			} finally {
				uni.hideLoading();
			}
		},

		// 加载违规统计数据
		async loadViolationStatistics() {
			try {
				console.log('📊 开始加载违规统计数据...');
				const params = {
					...apiUtils.formatDateRange(this.statisticsStartDate, this.statisticsEndDate),
					type: 'statistics',
					userRole: this.currentUserRole // 添加用户角色参数
				};

				// 🏠 管家角色添加小区限制
				if (this.currentUserRole === 'manager' && this.currentCommunityName) {
					params.park_name = this.currentCommunityName;
					console.log('🏠 管家统计添加小区限制:', this.currentCommunityName);
				}
				console.log('📋 统计请求参数:', params);

				const data = await violationApi.getStatistics(params);
				console.log('✅ 统计API响应数据:', data);

				// 处理可能的双重嵌套
				let actualData = data;
				if (data && data.data && typeof data.data === 'object') {
					actualData = data.data;
				}

				// 更新统计数据
				this.monthViolations = actualData.monthViolations || 0;
				this.totalViolations = actualData.totalViolations || 0;
				this.lastViolationDate = actualData.lastViolationDate || '';

				// 更新图表数据
				if (actualData.chartData) {
					this.chartData = actualData.chartData;
				}

				console.log('✅ 违规统计数据加载完成:', {
					monthViolations: this.monthViolations,
					totalViolations: this.totalViolations,
					lastViolationDate: this.lastViolationDate
				});

			} catch (error) {
				console.error('❌ 加载违规统计失败:', error);
				// 使用默认值
				this.monthViolations = 0;
				this.totalViolations = 0;
				this.lastViolationDate = '';
			}
		},

		// 加载实时违规记录
		async loadRealtimeViolations() {
			try {
				console.log('🔄 开始加载实时违规记录...');
				const params = {
					...apiUtils.formatDateRange(this.realtimeStartDate, this.realtimeEndDate),
					...apiUtils.formatPagination(1, 100),
					status: this.realtimeSelectedStatus || undefined,
					userRole: this.currentUserRole // 添加用户角色参数
				};

				// 🏠 管家角色添加小区限制
				if (this.currentUserRole === 'manager' && this.currentCommunityName) {
					params.community = this.currentCommunityName;
					console.log('🏠 管家实时记录添加小区限制:', this.currentCommunityName);
				}

				// 🏢 添加车场筛选（非管家角色使用当前车场）
				if (this.currentUserRole !== 'manager' && this.currentParkName) {
					params.community = this.currentParkName;
					console.log('🏢 添加车场筛选:', this.currentParkName);
				}

				console.log('📋 请求参数:', params);

				const data = await violationApi.getViolations(params);
				console.log('✅ API响应数据:', data);

				// 检查数据结构 - 处理可能的双重嵌套
				let records = [];
				let actualData = data;

				// 如果有双重嵌套，取内层数据
				if (data && data.data && typeof data.data === 'object') {
					actualData = data.data;
				}

				if (actualData && actualData.records) {
					records = actualData.records;
				} else if (actualData && actualData.list) {
					records = actualData.list;
				} else if (Array.isArray(actualData)) {
					records = actualData;
				} else {
					console.warn('⚠️ 未知的数据结构:', data);
					console.warn('⚠️ 实际数据结构:', actualData);
					records = [];
				}

				console.log(`📊 获取到 ${records.length} 条违规记录`);
				

				// 转换数据格式
				this.realtimeRecords = records.map(item => {
					// 🔧 智能判断车主类型
					let ownerType = 'temporary'; // 默认为临时车
					
					// 获取违规类型
					const violationType = item.violationType || item.violation_type || '';
					
					// 0. 🚗 优先根据违规类型判断：如果违规类型包含"临时车"字样，直接判定为临时车
					if (violationType && violationType.includes('临时车')) {
						ownerType = 'temporary';
						console.log(`🚗 [违规类型判断] 车牌: ${item.plateNumber || item.plate_number}, 违规类型包含"临时车": ${violationType}`);
					}
					// 1. 优先判断是否有月票
					else if (item.monthTicketId || item.month_ticket_id) {
						ownerType = 'monthly'; // 月票车主
					}
					// 2. 判断是否有预约记录
					else if (item.appointmentId || item.appointment_id) {
						ownerType = 'visitor'; // 预约车辆
					}
					// 3. 判断是否是本地业主（可以根据实际业务逻辑调整）
					else if (item.ownerType === 'local') {
						ownerType = 'local'; // 本地车主
					}
					// 4. 如果后端明确返回了ownerType，优先使用后端的判断（除非是unknown）
					else if (item.ownerType && item.ownerType !== 'unknown') {
						ownerType = item.ownerType;
					}
					
					console.log(`🔍 [车主类型判断] 车牌: ${item.plateNumber || item.plate_number}, 类型: ${ownerType}, 违规类型: ${violationType}, appointmentId: ${item.appointmentId || item.appointment_id}, monthTicketId: ${item.monthTicketId || item.month_ticket_id}`);
					
					return {
						id: item.id,
						ownerType: ownerType,
						plateNumber: item.plateNumber || item.plate_number,
					appointmentReason: item.appointmentReason || '回家',
					violationType: item.violationType || item.violation_type,
					isNewEnergy: this.isNewEnergyPlate(item.plateNumber || item.plate_number),
					ownerName: item.ownerName || item.owner_name || item.name || item.ownername || item.parkName || '',
					ownerPhone: item.ownerPhone || item.owner_phone || item.phone || '',
					phone: item.ownerPhone || item.owner_phone || item.phone || '', // 兼容不同字段名
					address: item.ownerAddress || item.owner_address || item.address || '',
					appointmentTime: item.appointmentTime || item.appointment_time,
					createdAt: item.createdAt || item.created_at, // 添加created_at字段
					enterTime: item.enterTime || item.enter_time,
					leaveTime: item.leaveTime || item.leave_time,
					photos: this.parsePhotos(item.photos), // 使用parsePhotos方法处理照片数据
					location:item.location,
					monthTicketName:item.monthTicketName,
					// 🔧 新增：预约状态和车辆状态字段
					appointmentStatus: item.appointmentStatus || item.appointment_status,
					vehicleStatus: item.vehicleStatus || item.vehicle_status,
					isFixed: item.isFixed || false,
					isExpanded: false,
						// 🔧 新增：黑名单字段
						should_blacklist: item.should_blacklist || item.shouldBlacklist || 0
					};
				});

				// 保存原始数据
				this.originalRealtimeRecords = [...this.realtimeRecords];
				console.log('✅ 实时违规记录加载完成，共', this.realtimeRecords.length, '条');
				
				// 🔍 调试：检查should_blacklist字段
				const shouldBlacklistRecords = this.realtimeRecords.filter(record => 
					record.should_blacklist === 1 || record.should_blacklist === '1' || record.should_blacklist === true
				);
				console.log('🔍 [调试] should_blacklist为真值的记录:', shouldBlacklistRecords.length, '条');
				if (shouldBlacklistRecords.length > 0) {
					console.log('🔍 [调试] should_blacklist为1的车牌:', shouldBlacklistRecords.map(r => r.plateNumber));
					console.log('🔍 [调试] 第一条记录的完整数据:', shouldBlacklistRecords[0]);
				}

				// 🔧 修复：重新加载数据后，需要重新检查黑名单状态
				// 这样确保时间范围改变后，"已拉黑"标签能正常显示
				await this.batchCheckBlacklistStatus();
				console.log('✅ 黑名单状态检查完成');

			} catch (error) {
				console.error('❌ 加载实时违规记录失败:', error);
				console.error('❌ 错误详细信息:', {
					message: error.message,
					stack: error.stack,
					statusCode: error.statusCode,
					data: error.data
				});

				// 🔧 调试：检查是否是花生壳或网络问题
				if (error.isHuashengkeError) {
					console.warn('⚠️ 检测到花生壳访问问题，建议切换到development环境');
					uni.showToast({
						title: '花生壳访问异常，请切换到本地环境或检查网络',
						icon: 'none',
						duration: 4000
					});
				} else {
					// 显示用户友好的错误提示
					uni.showToast({
						title: '数据加载失败：' + (error.message || '网络连接异常'),
						icon: 'none',
						duration: 4000
					});
				}
				// API加载失败时保持空数组，显示真实的"暂无数据"状态
				this.realtimeRecords = [];
				this.originalRealtimeRecords = [];
			}
		},



		// 加载用户信用分
		async loadUserCreditScore() {
			try {
				// 获取当前用户ID
				const userInfo = uni.getStorageSync('userInfo');
				if (!userInfo || !userInfo.id) {
					console.warn('未找到用户信息');
					return;
				}

				// 这里可以调用获取用户信用分的API
				// const creditData = await ownerApi.getCreditScore(userInfo.id);
				// this.creditScore = creditData.score || 85;

				// 暂时使用默认值
				this.creditScore = 85;

			} catch (error) {
				console.error('加载用户信用分失败:', error);
				this.creditScore = 85;
			}
		}
	},
	onShow() {
		// 页面显示时通知TabBar检查当前页面
		this.$nextTick(() => {
			console.log('📱 [管家违规页面] 页面显示');
		});
	},
	async mounted() {
		// 🆕 调试用户信息
		this.debugUserInfo();

		// 获取用户角色
		this.getUserRole();

		// 🏢 初始化车场信息
		await this.initializeParkInfo();

		// 🏠 加载管家小区信息（管家角色专用）
		if (this.currentUserRole === 'manager') {
			await this.loadManagerCommunityInfo();
		}

		// 初始化当前最大日期
		this.currentMaxDate = this.getCurrentDate();
		console.log('mounted - 初始化 currentMaxDate:', this.currentMaxDate);

		// 加载搜索历史
		this.loadSearchHistory();

		// 初始化违规统计和实时记录的时间范围
		const today = new Date();
		const lastWeek = new Date();
		lastWeek.setDate(today.getDate() - 7);

		// 违规统计的时间范围（独立）
		this.statisticsStartDate = this.formatDate(lastWeek);
		this.statisticsEndDate = this.formatDate(today);
		
		// 初始化 uni-datetime-picker 的日期范围
		this.statisticsDateRange = [this.statisticsStartDate, this.statisticsEndDate];

		// 实时记录的时间范围（独立）
		this.realtimeStartDate = this.formatDate(lastWeek);
		this.realtimeEndDate = this.formatDate(today);
		
		// 初始化实时违规记录的 uni-datetime-picker 日期范围
		this.realtimeDateRange = [this.realtimeStartDate, this.realtimeEndDate];

		// 🚫 初始化黑名单类型数据
		await this.getSpecialCarTypes();

		// 从数据库加载数据
		await this.loadDataFromDatabase();
	}
}
</script>

<style lang="scss">
// 自定义导航栏样式
.custom-navbar {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 999;
	background: #0081ff;
	padding-top: var(--status-bar-height);

	.navbar-content {
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 16rpx;

		.navbar-left {
			width: 80rpx;
			display: flex;
			align-items: center;

			.home-button {
				width: 64rpx;
				height: 64rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				border-radius: 50%;

				&.disabled {
					background: rgba(255, 255, 255, 0.1);
					cursor: not-allowed;
					opacity: 0.5;
				}
			}
		}

		.navbar-title {
			flex: 1;
			text-align: center;

			text {
				font-size: 18px;
				font-weight: 500;
				color: white;
			}
		}

		.navbar-right {
			width: 80rpx;
		}
	}
}

.violation-container {
	padding: 12rpx 6rpx; // 左右间距
	padding-top: calc(var(--status-bar-height) + 44px + 12rpx); // 顶部间距避免被自定义导航栏遮挡
	padding-bottom: calc(140rpx + env(safe-area-inset-bottom)); // 底部间距避免被导航栏遮挡，适配安全区域
	/* background: #1e3a8a; */
	min-height: 100vh;

	.credit-score-section {
		background: #fff;
		border-radius: 12rpx;
		padding: 20rpx;
		margin-bottom: 16rpx;
		text-align: center;

		.credit-ring {
			margin-bottom: 16rpx;
		}

		.credit-inner {
			display: flex;
			flex-direction: column;
			align-items: center;

			.credit-num {
				font-size: 36rpx;
				font-weight: bold;
				color: #2979ff;
			}

			.credit-label {
				font-size: 20rpx;
				color: #666;
			}
		}

		.credit-message {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8rpx;
			font-size: 24rpx;

			&.warning {
				color: #ff9900;
			}
		}
	}

	.violation-stats {
		display: flex;
		justify-content: space-between;
		gap: 16rpx;
		margin: 16rpx;

		.stats-card {
			flex: 1;
			padding: 16rpx;
			border-radius: 8rpx;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			color: #fff;

			&:nth-child(1) {
				background: linear-gradient(135deg, #ff4d4f, #ff7875);
			}

			&:nth-child(2) {
				background: linear-gradient(135deg, #1890ff, #40a9ff);
			}

			&:nth-child(3) {
				background: linear-gradient(135deg, #722ed1, #b37feb);
			}

			.stats-title {
				font-size: 24rpx;
				opacity: 0.9;
				margin-bottom: 8rpx;
			}

			.stats-num {
				font-size: 36rpx;
				font-weight: bold;
			}

			.stats-date {
				font-size: 28rpx;
				font-weight: 500;
			}
		}
	}

	.chart-section {
		background: #fff;
		border-radius: 12rpx;
		padding: 16rpx;
		margin-bottom: 16rpx;

		.chart-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 16rpx;

			.chart-title {
				font-size: 26rpx;
				font-weight: bold;
			}
		}
	}

	.violation-list {
		background: #fff;
		border-radius: 12rpx;
		padding: 16rpx;

		.list-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 16rpx;
			font-size: 26rpx;
			font-weight: bold;
		}

		// 紧凑的违规记录项
		.violation-item-compact {
			margin-bottom: 16rpx;
			background: #fff;
			border-radius: 16rpx;
			box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
			overflow: hidden;
			transition: all 0.3s ease;

			&.expanded {
				box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
			}

			// 紧凑的一行显示
			.compact-row {
				display: flex;
				align-items: center;
				padding: 24rpx 32rpx;
				cursor: pointer;
				transition: background-color 0.2s ease;

				&:active {
					background-color: #f8f9fa;
				}

				.main-info {
					flex: 1;
					display: flex;
					align-items: center;
					gap: 12rpx;
					overflow: hidden;

					// 车牌号
					.plate-number-compact {
						display: inline-block;
						font-size: 28rpx;
						font-weight: bold;
						padding: 8rpx 16rpx;
						border-radius: 8rpx;
						font-family: "微软雅黑";
						letter-spacing: 1rpx;
						min-width: 140rpx;
						text-align: center;
						flex-shrink: 0;

						&.blue-plate {
							background: linear-gradient(180deg, #0C4FC5 0%, #216FEF 100%);
							color: #FFFFFF;
							border: 1px solid #0C4FC5;
						}

						&.green-plate {
							background: linear-gradient(180deg, #6AD390 0%, #D0F1E4 100%);
							color: #000000;
							border: 1px solid #6AD390;
						}
					}

					// 状态标签
					.status-tag {
						padding: 8rpx 16rpx;
						border-radius: 16rpx;
						font-size: 24rpx;
						flex-shrink: 0;

						.status-text {
							color: #fff;
							font-weight: 500;
						}

						&.status-not-processed {
							background: #ff4d4f;
						}

						&.status-processed {
							background: #ff9800;
						}

						&.status-processing {
							background: #9c27b0; // 修改为紫色，未离场状态
						}

						&.status-fixed {
							background: #722ed1; // 紫色表示固定状态
						}

						&.status-default {
							background: #8c8c8c;
						}

						// 🚫 黑名单状态样式
						&.status-blacklisted {
							background: linear-gradient(135deg, #e74c3c, #c0392b);
							box-shadow: 0 4rpx 16rpx rgba(231, 76, 60, 0.6);
							animation: pulse-danger 1.5s infinite;
							border: 2px solid #a93226;
						}
					}

					// 🚫 黑名单状态标签样式
					.blacklist-status-tag {
						display: flex;
						align-items: center;
						justify-content: center;
						padding: 8rpx 16rpx;
						border-radius: 16rpx;
						font-size: 24rpx;
						flex-shrink: 0;
						margin-left: 8rpx;
						white-space: nowrap;
						min-height: 48rpx; // 确保最小高度
						
						.status-text {
							color: #fff;
							font-weight: 500;
							white-space: nowrap;
							display: flex;
							align-items: center;
							justify-content: center;
							text-align: center;
							line-height: 1.2;
						}

						&.status-blacklisted {
							background: linear-gradient(135deg, #e74c3c, #c0392b);
							box-shadow: 0 6rpx 20rpx rgba(231, 76, 60, 0.6);
							animation: pulse-danger 1.5s infinite;
							border: 2px solid #a93226;
						}
					}

					// 🔧 新增：进场状态标签样式
					.entry-status-tag {
						display: flex;
						align-items: center;
						justify-content: center;
						padding: 6rpx 12rpx;
						border-radius: 12rpx;
						font-size: 22rpx;
						flex-shrink: 0;
						margin-left: 8rpx;
						white-space: nowrap;
						min-height: 40rpx;
						transition: all 0.3s ease;
						
						.entry-status-text {
							color: #fff;
							font-weight: 500;
							white-space: nowrap;
							display: flex;
							align-items: center;
							justify-content: center;
							text-align: center;
							line-height: 1.2;
						}

						&.entry-waiting {
							background: linear-gradient(135deg, #faad14, #ffc53d);
							box-shadow: 0 2rpx 8rpx rgba(250, 173, 20, 0.3);
						}

						&.entry-in-progress {
							background: linear-gradient(135deg, #1890ff, #40a9ff);
							box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.3);
						}

						&.entry-completed {
							background: linear-gradient(135deg, #52c41a, #73d13d);
							box-shadow: 0 2rpx 8rpx rgba(82, 196, 26, 0.3);
						}
					}

					// 违规原因简化显示
					.reason-short {
						font-size: 24rpx;
						color: #ff4d4f;
						flex-shrink: 0;
						max-width: 140rpx;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
						background: linear-gradient(135deg, #fff2f0 0%, #ffebe8 100%);
						padding: 6rpx 12rpx;
						border-radius: 12rpx;
						border: 1px solid #ffccc7;
						font-weight: 500;
						text-align: center;
					}

					// 时间显示
					.time-display {
						font-size: 22rpx;
						color: #999;
						margin-left: auto;
						flex-shrink: 0;
						min-width: 100rpx;
						text-align: right;
					}
				}

				// 展开图标
				.expand-icon {
					margin-left: 16rpx;
					flex-shrink: 0;
					transition: transform 0.3s ease;
				}
			}

			// 展开后的详细内容
			.detail-content {
				padding: 0 32rpx 32rpx;
				border-top: 1px solid #f0f0f0;
				background: #fafafa;

				.detail-section {
					padding-top: 24rpx;

					// 时间信息卡片
					.time-cards {
						display: flex;
						flex-direction: column;
						gap: 16rpx;
						margin-bottom: 24rpx;

						.time-card {
							display: flex;
							align-items: center;
							padding: 16rpx 20rpx;
							background: #fff;
							border-radius: 12rpx;
							box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.04);

							.card-icon {
								margin-right: 16rpx;
								width: 40rpx;
								height: 40rpx;
								display: flex;
								align-items: center;
								justify-content: center;
								border-radius: 8rpx;

								.emoji-icon {
									font-size: 24rpx;
								}
							}

							.card-content {
								flex: 1;

								.card-label {
									font-size: 22rpx;
									color: #666;
									display: block;
									margin-bottom: 4rpx;
								}

								.card-time {
									font-size: 26rpx;
									color: #333;
									font-weight: 500;
								}
							}

							&.appointment-card .card-icon {
								background: rgba(41, 121, 255, 0.1);
							}

							&.enter-card .card-icon {
								background: rgba(82, 196, 26, 0.1);
							}

							&.leave-card .card-icon {
								background: rgba(255, 77, 79, 0.1);
							}
						}
					}

					// 违规详情
					.violation-detail {
						.detail-row {
							display: flex;
							align-items: center;
							margin-bottom: 16rpx;
							padding: 16rpx 20rpx;
							background: #fff;
							border-radius: 12rpx;
							box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.04);

							.detail-tag {
								display: flex;
								align-items: center;
								margin-right: 16rpx;
								min-width: 120rpx;

								.tag-label {
									font-size: 22rpx;
									color: #666;
									margin-left: 8rpx;
								}
							}

							.detail-value {
								flex: 1;
								font-size: 26rpx;
								color: #333;

								&.status-not-processed {
									color: #ff4d4f;
								}

								&.status-processed {
									color: #ff9800;
								}

								&.status-processing {
									color: #9c27b0; // 修改为紫色，未离场状态
								}
							}
						}
					}
				}

				// 紧凑型三行布局样式
				.compact-detail-layout {
					padding-top: 24rpx;

					// 第一行：时间流程
					.time-flow-row {
						display: flex;
						align-items: stretch;
						justify-content: space-between;
						margin-bottom: 16rpx;
						padding: 16rpx;
						background: #f8f9fa;
						border-radius: 12rpx;

						.time-item {
							display: flex;
							flex-direction: column;
							align-items: flex-start;
							flex: 1;
							min-width: 0;
							max-width: 33.33%;
							position: relative;
							padding: 16rpx 12rpx;
							background: #fff;
							border-radius: 12rpx;
							margin-right: 12rpx;
							box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
							border: 1px solid #f0f0f0;

							&:last-child {
								margin-right: 0;
							}

							// 时间头部（图标+标签）
							.time-header {
								display: flex;
								align-items: center;
								margin-bottom: 12rpx;

								.time-icon {
									font-size: 20rpx;
									margin-right: 8rpx;
								}

								.time-label {
									font-size: 22rpx;
									color: #999;
									white-space: nowrap;
									font-weight: 400;
								}
							}

							// 时间显示区域
							.time-display {
								display: flex;
								flex-direction: column;
								align-items: flex-start;
								width: 100%;

								.time-main {
									font-size: 32rpx;
									color: #333;
									font-weight: 600;
									line-height: 1.2;
									margin-bottom: 4rpx;
								}

								.time-date {
									font-size: 20rpx;
									color: #999;
									line-height: 1;
								}
							}

							// 不同状态的样式
							&:nth-child(1) {
								border-left: 4rpx solid #1890ff; // 预约 - 蓝色
							}

							&:nth-child(2) {
								border-left: 4rpx solid #9c27b0; // 进场 - 紫色
							}

							&:nth-child(3) {
								border-left: 4rpx solid #ff9800; // 离场 - 橙色
							}
						}
					}

					// 第二行：停车时长
					.duration-row {
						display: flex;
						align-items: center;
						margin-bottom: 16rpx;
						padding: 20rpx 24rpx;
						background: linear-gradient(135deg, #fff9f0 0%, #ffffff 100%);
						border-radius: 16rpx;
						box-shadow: 0 4rpx 12rpx rgba(255, 149, 0, 0.08);
						border: 1px solid #fff2e8;
						position: relative;
						overflow: hidden;

						// 添加左侧装饰条
						&::before {
							content: '';
							position: absolute;
							left: 0;
							top: 0;
							bottom: 0;
							width: 4rpx;
							background: linear-gradient(to bottom, #ff9500, #ffad33);
						}

						.duration-icon {
							font-size: 26rpx;
							margin-right: 12rpx;
							padding: 10rpx;
							border-radius: 50%;
							background: rgba(255, 149, 0, 0.15);
							display: flex;
							align-items: center;
							justify-content: center;
							min-width: 46rpx;
							height: 46rpx;
						}

						.duration-label {
							font-size: 26rpx;
							color: #666;
							margin-right: 12rpx;
							font-weight: 500;
						}

						.duration-value {
							font-size: 32rpx;
							font-weight: 600;
							padding: 6rpx 16rpx;
							border-radius: 20rpx;
							position: relative;

							&.duration-short {
								color: #52c41a;
								background: rgba(82, 196, 26, 0.1);
								border: 1px solid rgba(82, 196, 26, 0.2);
							}

							&.duration-medium {
								color: #ff9500;
								background: rgba(255, 149, 0, 0.1);
								border: 1px solid rgba(255, 149, 0, 0.2);
							}

							&.duration-long {
								color: #ff4d4f;
								background: rgba(255, 77, 79, 0.1);
								border: 1px solid rgba(255, 77, 79, 0.2);
								animation: pulse 2s infinite;
							}
						}
					}

					// 第三行：状态信息
					.status-row {
						display: flex;
						align-items: center;
						padding: 20rpx 24rpx;
						background: linear-gradient(135deg, #f6ffed 0%, #ffffff 100%);
						border-radius: 16rpx;
						box-shadow: 0 4rpx 12rpx rgba(82, 196, 26, 0.06);
						border: 1px solid #f0f9e8;
						position: relative;

						.status-item {
							display: flex;
							align-items: center;
							padding: 8rpx 16rpx;
							border-radius: 20rpx;
							transition: all 0.3s ease;

							.status-icon {
								font-size: 24rpx;
								margin-right: 8rpx;
							}

							.status-text {
								font-size: 28rpx;
								color: #333;
								font-weight: 500;

								&.status-not-processed {
									color: #ff4d4f;
								}

								&.status-processed {
									color: #52c41a;
								}

								&.status-processing {
									color: #ff9500;
								}
							}

							// 违规原因样式
							&:first-child {
								background: rgba(255, 77, 79, 0.08);
								border: 1px solid rgba(255, 77, 79, 0.15);

								.status-text {
									color: #ff4d4f;
									font-weight: 600;
								}
							}

							// 车辆状态样式
							&:last-child {
								background: rgba(255, 152, 0, 0.08);
								border: 1px solid rgba(255, 152, 0, 0.15);

								.status-text.status-processed {
									color: #ff9800;
									font-weight: 600;
								}

								.status-text.status-processing {
									color: #9c27b0;
									background: rgba(156, 39, 176, 0.08);
									border: 1px solid rgba(156, 39, 176, 0.15);
									padding: 4rpx 12rpx;
									border-radius: 12rpx;
								}

								.status-text.status-not-processed {
									color: #ff4d4f;
									background: rgba(255, 77, 79, 0.08);
									border: 1px solid rgba(255, 77, 79, 0.15);
									padding: 4rpx 12rpx;
									border-radius: 12rpx;
								}
							}
						}

						.status-divider {
							margin: 0 20rpx;
							color: #d9d9d9;
							font-size: 28rpx;
							font-weight: 300;
						}
					}
				}

				// 添加动画效果
				@keyframes pulse {
					0% {
						transform: scale(1);
						box-shadow: 0 0 0 0 rgba(255, 77, 79, 0.4);
					}

					50% {
						transform: scale(1.02);
						box-shadow: 0 0 0 8rpx rgba(255, 77, 79, 0.1);
					}

					100% {
						transform: scale(1);
						box-shadow: 0 0 0 0 rgba(255, 77, 79, 0);
					}
				}

				@keyframes slideIn {
					from {
						opacity: 0;
						transform: translateY(20rpx);
					}

					to {
						opacity: 1;
						transform: translateY(0);
					}
				}

				// 为展开内容添加滑入动画
				.compact-detail-layout {
					animation: slideIn 0.3s ease-out;
				}
			}
		}
	}

	// 管家界面样式
	.housekeeper-view {

		// 智能搜索容器样式
		.smart-search-container {
			display: flex;
			gap: 16rpx; // 增加间距
			padding: 12rpx;
			background: #fff;
			border-radius: 8rpx;
			margin-bottom: 12rpx;
			box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);

			.search-wrapper {
				flex: 1;
				position: relative;

				.search-input-box {
					position: relative;
					background: #f5f7fa;
					border-radius: 20rpx;
					padding: 0 16rpx;
					transition: all 0.3s ease;
					border: 2rpx solid transparent;
					display: flex;
					align-items: center;

					&.focused {
						background: #fff;
						border-color: #2979ff;
						box-shadow: 0 0 0 4rpx rgba(41, 121, 255, 0.1);
					}

					&.hasText {
						.search-input {
							color: #333;
						}

						padding-right: 50rpx; // 为清空按钮留出空间
					}

					.search-input {
						flex: 1;
						height: 48rpx;
						font-size: 24rpx;
						color: #666;
						background: transparent;
						border: none;
						outline: none;
						padding: 0;

						&::placeholder {
							color: #999;
							font-size: 22rpx;
						}
					}

					.clear-btn {
						position: absolute;
						right: 12rpx;
						top: 50%;
						transform: translateY(-50%);
						width: 32rpx;
						height: 32rpx;
						display: flex;
						align-items: center;
						justify-content: center;
						z-index: 10;

						&:active {
							opacity: 0.6;
						}
					}
				}

				// 搜索建议下拉框
				.search-suggestions {
					position: absolute;
					top: 100%;
					left: 0;
					right: 0;
					background: #fff;
					border-radius: 8rpx;
					box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.12);
					z-index: 1000;
					margin-top: 6rpx;
					border: 1rpx solid #e8e8e8;
					overflow: hidden;

					.suggestions-scroll {
						max-height: 320rpx;
					}

					.suggestion-item {
						display: flex;
						align-items: center;
						padding: 12rpx 16rpx;
						border-bottom: 1rpx solid #f0f0f0;
						cursor: pointer;
						transition: all 0.3s ease;

						&:hover {
							background: #f8f9ff;
						}

						&:last-child {
							border-bottom: none;
						}

						.suggestion-icon {
							width: 32rpx;
							height: 32rpx;
							border-radius: 6rpx;
							background: #f5f7fa;
							display: flex;
							align-items: center;
							justify-content: center;
							margin-right: 12rpx;

							.icon-emoji {
								font-size: 20rpx;
							}
						}

						.suggestion-content {
							flex: 1;

							.suggestion-text {
								font-size: 24rpx;
								color: #333;
								margin-bottom: 2rpx;
								display: block;
							}

							.suggestion-type {
								font-size: 20rpx;
								color: #999;
							}
						}

						.suggestion-arrow {
							color: #ccc;

							.icon-emoji {
								font-size: 16rpx;
							}
						}
					}

					.suggestions-footer {
						padding: 8rpx 16rpx;
						background: #f8f9fa;
						border-top: 1rpx solid #e8e8e8;

						.footer-text {
							font-size: 20rpx;
							color: #666;
						}
					}
				}
			}

			// 右侧操作按钮组
			.action-buttons {
				display: flex;
				gap: 8rpx;
				margin-left: auto; // 右移历史按钮

				.action-btn {
					width: 80rpx;
					height: 56rpx;
					border-radius: 12rpx;
					display: flex;
					align-items: center;
					justify-content: center;
					cursor: pointer;
					transition: all 0.3s ease;
					border: 1rpx solid #e8e8e8;

					&.active {
						background: #fff3e0;
						border-color: #f5a623;
					}

					&:hover {
						transform: translateY(-2rpx);
						box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
					}

					.btn-content {
						display: flex;
						flex-direction: column;
						align-items: center;
						gap: 2rpx;

						.icon-emoji {
							font-size: 20rpx;
							line-height: 1;
						}

						.btn-label {
							font-size: 18rpx;
							line-height: 1;
						}
					}
				}
			}
		}

		// 搜索历史面板
		.search-history-panel {
			background: #fff;
			border-radius: 8rpx;
			margin-bottom: 12rpx;
			box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
			overflow: hidden;

			.history-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 12rpx 16rpx;
				background: #f8f9fa;
				border-bottom: 1rpx solid #e8e8e8;

				.header-title {
					display: flex;
					align-items: center;

					.title-text {
						font-size: 24rpx;
						font-weight: 600;
						color: #333;
					}
				}

				.clear-all {
					font-size: 20rpx;
					color: #999;
					cursor: pointer;

					&:hover {
						color: #ff4d4f;
					}
				}
			}

			.history-content {
				max-height: 240rpx;
				overflow-y: auto;
			}

			.history-item {
				display: flex;
				align-items: center;
				padding: 12rpx 16rpx;
				border-bottom: 1rpx solid #f0f0f0;
				cursor: pointer;
				transition: all 0.3s ease;

				&:hover {
					background: #f8f9ff;
				}

				&:last-child {
					border-bottom: none;
				}

				.history-icon {
					width: 28rpx;
					height: 28rpx;
					border-radius: 4rpx;
					background: #f5f7fa;
					display: flex;
					align-items: center;
					justify-content: center;
					margin-right: 8rpx;

					.icon-emoji {
						font-size: 16rpx;
					}
				}

				.history-text {
					flex: 1;
					font-size: 22rpx;
					color: #333;
				}

				.history-time {
					font-size: 18rpx;
					color: #999;
					margin-right: 8rpx;
				}

				.history-delete {
					width: 24rpx;
					height: 24rpx;
					border-radius: 50%;
					background: #f0f0f0;
					display: flex;
					align-items: center;
					justify-content: center;
					cursor: pointer;

					&:hover {
						background: #ff4d4f;

						.icon-emoji {
							color: #fff !important;
						}
					}

					.icon-emoji {
						font-size: 14rpx;
					}
				}
			}

			.history-empty {
				padding: 40rpx 16rpx;
				text-align: center;

				.empty-text {
					font-size: 20rpx;
					color: #999;
					margin-top: 8rpx;
					display: block;
				}
			}
		}

		// 热门搜索标签
		.hot-search-tags {
			background: #fff;
			border-radius: 8rpx;
			padding: 12rpx;
			margin-bottom: 12rpx;
			box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);

			.tags-header {
				display: flex;
				align-items: center;
				margin-bottom: 12rpx;

				.tags-title {
					font-size: 24rpx;
					font-weight: 600;
					color: #333;
				}
			}

			.tags-container {
				display: flex;
				flex-wrap: wrap;
				gap: 8rpx;

				.hot-tag {
					display: flex;
					align-items: center;
					gap: 6rpx;
					padding: 6rpx 12rpx;
					background: #f5f7fa;
					border-radius: 16rpx;
					border: 1rpx solid #e8e8e8;
					cursor: pointer;
					transition: all 0.3s ease;

					&:hover {
						background: #e6f7ff;
						border-color: #1890ff;

						.tag-text {
							color: #1890ff;
						}
					}

					.tag-text {
						font-size: 20rpx;
						color: #666;
					}

					.tag-count {
						font-size: 16rpx;
						color: #999;
						background: #e8e8e8;
						padding: 1rpx 6rpx;
						border-radius: 8rpx;
						min-width: 24rpx;
						text-align: center;
					}
				}
			}
		}

		.weekly-stats {
			background: #fff;
			border-radius: 8rpx; // 减少圆角
			padding: 12rpx; // 减少内边距
			margin-bottom: 12rpx; // 减少底部边距

			.stats-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 16rpx 0;
				border-bottom: 1px solid #eee;

				.title-with-stats {
					display: flex;
					align-items: center;
					gap: 16rpx;
				}

				.stats-title {
					font-size: 28rpx;
					font-weight: bold;
					color: #1a1a1a;
					position: relative;
					padding-left: 20rpx;
					white-space: nowrap;

					&::before {
						content: '';
						position: absolute;
						left: 0;
						top: 15%;
						height: 70%;
						width: 4rpx;
						background: linear-gradient(to bottom, #2979ff, #1890ff);
						border-radius: 2rpx;
					}
				}

				.blacklist-count {
					font-size: 26rpx;
					color: #fff;
					background: linear-gradient(135deg, #ff3300, #ff6600);
					padding: 8rpx 16rpx;
					border-radius: 20rpx;
					border: 2px solid #ff0000;
					white-space: nowrap;
					font-weight: 700;
					box-shadow: 0 4rpx 12rpx rgba(255, 51, 0, 0.6);
					animation: pulse-warning 2s infinite;
				}

				.date-picker {
					display: flex;
					align-items: center;
					padding: 6rpx 16rpx;
					background: #f5f7fa;
					border-radius: 20rpx;
					cursor: pointer;

					&:active {
						opacity: 0.8;
					}

					.date-text {
						font-size: 22rpx;
						color: #2979ff;
					}

					.separator {
						margin: 0 6rpx;
						color: #909399;
					}
				}

				.confirm-btn {
					background: linear-gradient(135deg, #52c41a, #73d13d);
					border-radius: 20rpx;
					padding: 12rpx 24rpx;
					box-shadow: 0 4rpx 12rpx rgba(82, 196, 26, 0.3);
					transition: all 0.3s ease;
					margin-left: 12rpx;
					display: flex;
					align-items: center;
					justify-content: center;

					&:active {
						transform: scale(0.95);
						box-shadow: 0 2rpx 8rpx rgba(82, 196, 26, 0.4);
					}

					.confirm-text {
						color: #fff;
						font-size: 28rpx;
						font-weight: 500;
					}

					&.pulse {
						animation: pulse 2s infinite;
					}
				}

				@keyframes pulse {
					0% {
						box-shadow: 0 4rpx 12rpx rgba(82, 196, 26, 0.3);
					}
					50% {
						box-shadow: 0 6rpx 20rpx rgba(82, 196, 26, 0.6);
						transform: scale(1.05);
					}
					100% {
						box-shadow: 0 4rpx 12rpx rgba(82, 196, 26, 0.3);
					}
				}
			}

			.realtime-violations {
				background: #fff;
				border-radius: 8rpx; // 减少圆角
				padding: 12rpx; // 减少内边距
				box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06); // 减少阴影
				margin-top: 16rpx; // 减少顶部边距

				.section-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 16rpx;
					padding: 12rpx 0;
					border-bottom: 1rpx solid #f0f0f0;

					.header-left {
						display: flex;
						align-items: center;
						gap: 16rpx;

						.title {
							font-size: 28rpx;
							font-weight: bold;
							color: #1a1a1a;
							position: relative;
							padding-left: 20rpx;
							white-space: nowrap;

							&::before {
								content: '';
								position: absolute;
								left: 0;
								top: 15%;
								height: 70%;
								width: 4rpx;
								background: linear-gradient(to bottom, #2979ff, #1890ff);
								border-radius: 2rpx;
							}
						}

						.date-picker {
							display: flex;
							align-items: center;
							padding: 6rpx 12rpx;
							background: #f0f7ff;
							border-radius: 6rpx;
							border: 1px solid rgba(41, 121, 255, 0.1);
							cursor: pointer;
							transition: all 0.3s ease;

							&:hover {
								background: #e6f7ff;
								border-color: rgba(41, 121, 255, 0.2);
							}

							.date-text {
								font-size: 20rpx;
								color: #2979ff;
								font-weight: 500;
							}

							.separator {
								margin: 0 6rpx;
								color: #2979ff;
								opacity: 0.6;
							}

							.u-icon {
								margin-left: 6rpx;
							}
						}
					}
				}

				// 优化车辆状态统计卡片样式 - 2x2布局
				.violation-stats-cards {
					display: grid;
					grid-template-columns: 1fr 1fr; // 2列布局
					grid-template-rows: 1fr 1fr; // 2行布局
					gap: 12rpx; // 卡片间隙
					margin: 20rpx 0; // 上下边距

					.stat-card {
						width: 100%;
						border-radius: 16rpx; // 增加圆角
						padding: 24rpx 16rpx; // 增加内边距
						display: flex;
						flex-direction: column;
						align-items: center;
						text-align: center;
						transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
						position: relative;
						overflow: hidden;
						cursor: pointer;
						background: #fff;
						box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08); // 增加阴影

						&::before {
							content: '';
							position: absolute;
							bottom: 0;
							left: 50%;
							transform: translateX(-50%);
							width: 60%;
							height: 4rpx;
							border-radius: 2rpx;
							transition: all 0.3s ease;
						}

						.icon-wrapper {
							width: 56rpx; // 增加图标尺寸
							height: 56rpx;
							border-radius: 12rpx; // 增加圆角
							display: flex;
							align-items: center;
							justify-content: center;
							margin-bottom: 12rpx; // 增加底部间距
							transition: all 0.4s ease;
							position: relative;

							&::after {
								content: '';
								position: absolute;
								inset: -6rpx;
								border-radius: 20rpx;
								background: inherit;
								opacity: 0.2;
								transform: scale(0.8);
								transition: all 0.4s ease;
								z-index: -1;
							}
						}

						.stat-info {
							.count {
								font-size: 36rpx; // 增加字体大小
								font-weight: 700;
								line-height: 1;
								margin-bottom: 6rpx; // 增加间距
								font-family: "DIN Alternate", "Arial", sans-serif;
								transition: all 0.3s ease;
							}

							.number {
								font-size: 42rpx; // 更大的数字字体
								font-weight: 800;
								line-height: 1;
								margin-bottom: 4rpx;
								font-family: "DIN Alternate", "Arial", sans-serif;
								transition: all 0.3s ease;
								display: block;
							}

							.status {
								font-size: 24rpx; // 状态文字字体
								font-weight: 500;
								opacity: 0.9;
								transition: all 0.3s ease;
								display: block;
							}

							.label {
								font-size: 22rpx; // 增加字体大小
								font-weight: 500;
								opacity: 0.8;
								transition: all 0.3s ease;
							}
						}

						&.not-entered {
							&::before {
								background: linear-gradient(90deg, #ff4d4f, #ff7875);
							}

							.icon-wrapper {
								background: linear-gradient(135deg, #ff4d4f, #ff7875);
								color: #fff;
							}

							.stat-info {
								.count {
									color: #ff4d4f;
								}

								.label {
									color: #cf1322;
								}
							}

							&:hover {
								background: linear-gradient(145deg, #fff5f5, #fff);
								box-shadow: 0 12rpx 40rpx rgba(255, 77, 79, 0.15);

								.icon-wrapper::after {
									transform: scale(1.2);
									opacity: 0.1;
								}
							}
						}

						&.in-progress {
							&::before {
								background: linear-gradient(90deg, #1890ff, #40a9ff);
							}

							.icon-wrapper {
								background: linear-gradient(135deg, #1890ff, #40a9ff);
								color: #fff;
							}

							.stat-info {
								.count {
									color: #1890ff;
								}

								.label {
									color: #096dd9;
								}
							}

							&:hover {
								background: linear-gradient(145deg, #f0f9ff, #fff);
								box-shadow: 0 12rpx 40rpx rgba(24, 144, 255, 0.15);

								.icon-wrapper::after {
									transform: scale(1.2);
									opacity: 0.1;
								}
							}
						}

						&.has-left {
							&::before {
								background: linear-gradient(90deg, #52c41a, #73d13d);
							}

							.icon-wrapper {
								background: linear-gradient(135deg, #52c41a, #73d13d);
								color: #fff;
							}

							.stat-info {
								.count {
									color: #52c41a;
								}

								.label {
									color: #389e0d;
								}
							}

							&:hover {
								background: linear-gradient(145deg, #f6ffed, #fff);
								box-shadow: 0 12rpx 40rpx rgba(82, 196, 26, 0.15);

								.icon-wrapper::after {
									transform: scale(1.2);
									opacity: 0.1;
								}
							}
						}

						// 🔧 新增：已拉黑卡片样式
						&.blacklisted {
							&::before {
								background: linear-gradient(90deg, #f5222d, #ff4d4f);
							}

							.icon-wrapper {
								background: linear-gradient(135deg, #f5222d, #ff4d4f);
								color: #fff;
							}

							.stat-info {
								.count, .number {
									color: #f5222d;
								}

								.label, .status {
									color: #cf1322;
								}
							}

							&:hover {
								background: linear-gradient(145deg, #fff1f0, #fff);
								box-shadow: 0 12rpx 40rpx rgba(245, 34, 45, 0.15);

								.icon-wrapper::after {
									transform: scale(1.2);
									opacity: 0.1;
								}
							}
						}

						// 🔧 新增：未拉黑卡片样式
						&.non-blacklisted {
							&::before {
								background: linear-gradient(90deg, #13c2c2, #36cfc9);
							}

							.icon-wrapper {
								background: linear-gradient(135deg, #13c2c2, #36cfc9);
								color: #fff;
							}

							.stat-info {
								.count, .number {
									color: #13c2c2;
								}

								.label, .status {
									color: #08979c;
								}
							}

							&:hover {
								background: linear-gradient(145deg, #e6fffb, #fff);
								box-shadow: 0 12rpx 40rpx rgba(19, 194, 194, 0.15);

								.icon-wrapper::after {
									transform: scale(1.2);
									opacity: 0.1;
								}
							}
						}

						&:hover {
							transform: translateY(-6rpx) scale(1.02);

							.icon-wrapper {
								transform: scale(1.1) rotate(5deg);
							}

							&::before {
								width: 80%;
							}
						}

						&.selected {
							transform: translateY(-8rpx) scale(1.08);
							box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.2);
							border: 3rpx solid transparent;

							&::before {
								width: 100%;
								height: 8rpx;
							}

							&::after {
								content: '✓';
								position: absolute;
								top: 8rpx;
								right: 8rpx;
								width: 32rpx;
								height: 32rpx;
								background: #52c41a;
								color: #fff;
								border-radius: 50%;
								display: flex;
								align-items: center;
								justify-content: center;
								font-size: 20rpx;
								font-weight: bold;
								animation: checkmark 0.3s ease-in-out;
							}

							.icon-wrapper {
								transform: scale(1.2);
							}

							.stat-info .count {
								font-size: 46rpx;
								font-weight: 700;
							}

							.stat-info .label {
								font-weight: 600;
							}

							&.not-entered {
								background: linear-gradient(145deg, #fff2f0, #fff5f5);
								box-shadow: 0 20rpx 60rpx rgba(255, 77, 79, 0.3);
								border-color: #ff4d4f;

								&::before {
									background: #ff4d4f;
								}

								.icon-wrapper {
									background: #ff4d4f;
								}

								.stat-info .count {
									color: #ff4d4f;
								}

								.stat-info .number {
									color: #ff4d4f;
								}

								.stat-info .status {
									color: #ff4d4f;
								}

								.stat-info .label {
									color: #ff4d4f;
								}
							}

							&.in-progress {
								background: linear-gradient(145deg, #e6f7ff, #f0f9ff);
								box-shadow: 0 20rpx 60rpx rgba(24, 144, 255, 0.3);
								border-color: #1890ff;

								&::before {
									background: #1890ff;
								}

								.icon-wrapper {
									background: #1890ff;
								}

								.stat-info .count {
									color: #1890ff;
								}

								.stat-info .number {
									color: #1890ff;
								}

								.stat-info .status {
									color: #1890ff;
								}

								.stat-info .label {
									color: #1890ff;
								}
							}

							&.has-left {
								background: linear-gradient(145deg, #f6ffed, #f9fff6);
								box-shadow: 0 20rpx 60rpx rgba(82, 196, 26, 0.3);
								border-color: #52c41a;

								&::before {
									background: #52c41a;
								}

								.icon-wrapper {
									background: #52c41a;
								}

								.stat-info .count {
									color: #52c41a;
								}

								.stat-info .number {
									color: #52c41a;
								}

								.stat-info .status {
									color: #52c41a;
								}

								.stat-info .label {
									color: #52c41a;
								}
							}

							@keyframes checkmark {
								0% {
									transform: scale(0) rotate(0deg);
									opacity: 0;
								}

								50% {
									transform: scale(1.2) rotate(180deg);
									opacity: 1;
								}

								100% {
									transform: scale(1) rotate(360deg);
									opacity: 1;
								}
							}
						}

						&:active {
							transform: translateY(-2rpx) scale(0.98);
							transition: all 0.1s ease;
						}
					}
				}

				.violation-cards {
					// 修改为单列布局，减少左右间距
					display: flex;
					flex-direction: column;
					gap: 16rpx;
					padding: 0 4rpx; // 大幅减少左右内边距

					// 空状态容器样式
					.empty-state-container {
						display: flex;
						justify-content: center;
						align-items: center;
						min-height: 400rpx;
						padding: 40rpx 20rpx;
					}

					.empty-state-card {
						display: flex;
						flex-direction: column;
						align-items: center;
						justify-content: center;
						padding: 60rpx 40rpx;
						background: linear-gradient(145deg, #fafbfc 0%, #ffffff 100%);
						border-radius: 24rpx;
						border: 2rpx dashed #e1e4e8;
						box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.02);
						position: relative;
						overflow: hidden;
						max-width: 600rpx;
						width: 100%;

						&::before {
							content: '';
							position: absolute;
							top: 0;
							left: 0;
							right: 0;
							bottom: 0;
							background: radial-gradient(circle at center, rgba(64, 158, 255, 0.03) 0%, transparent 70%);
							pointer-events: none;
						}

						.empty-icon {
							margin-bottom: 24rpx;
							font-size: 80rpx;
							opacity: 0.7;
							animation: float 3s ease-in-out infinite;

							.icon-emoji {
								font-size: 80rpx;
							}
						}

						.empty-content {
							text-align: center;
							margin-bottom: 32rpx;

							.empty-title {
								display: block;
								font-size: 32rpx;
								font-weight: 600;
								color: #2c3e50;
								margin-bottom: 12rpx;
								line-height: 1.4;
							}

							.empty-subtitle {
								display: block;
								font-size: 26rpx;
								color: #8590a6;
								line-height: 1.5;
								max-width: 400rpx;
							}
						}

						.empty-actions {
							display: flex;
							justify-content: center;

							.action-btn {
								padding: 16rpx 32rpx;
								background: linear-gradient(135deg, #409eff 0%, #66b3ff 100%);
								border-radius: 50rpx;
								box-shadow: 0 4rpx 12rpx rgba(64, 158, 255, 0.3);
								transition: all 0.3s ease;

								&:active {
									transform: translateY(2rpx);
									box-shadow: 0 2rpx 8rpx rgba(64, 158, 255, 0.4);
								}

								.btn-text {
									color: #ffffff;
									font-size: 26rpx;
									font-weight: 500;
								}
							}
						}

						@keyframes float {

							0%,
							100% {
								transform: translateY(0);
							}

							50% {
								transform: translateY(-8rpx);
							}
						}
					}

					// 紧凑的实时违规记录项
					.realtime-violation-item-compact {
						margin-bottom: 16rpx;
						background: #fff;
						border-radius: 16rpx;
						box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
						overflow: hidden;
						transition: all 0.3s ease;

						&.expanded {
							box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
						}

						// 紧凑的一行显示
						.compact-row {
							display: flex;
							align-items: center;
							padding: 24rpx 32rpx;
							cursor: pointer;
							transition: background-color 0.2s ease;

							&:active {
								background-color: #f8f9fa;
							}

							.main-info {
								flex: 1;
								display: flex;
								align-items: center;
								gap: 12rpx;
								overflow: hidden;

								// 车牌号
								.plate-number-compact {
									display: inline-block;
									font-size: 28rpx;
									font-weight: bold;
									padding: 8rpx 16rpx;
									border-radius: 8rpx;
									font-family: "微软雅黑";
									letter-spacing: 1rpx;
									min-width: 140rpx;
									text-align: center;
									flex-shrink: 0;

									&.blue-plate {
										background: linear-gradient(180deg, #0C4FC5 0%, #216FEF 100%);
										color: #FFFFFF;
										border: 1px solid #0C4FC5;
									}

									&.green-plate {
										background: linear-gradient(180deg, #6AD390 0%, #D0F1E4 100%);
										color: #000000;
										border: 1px solid #6AD390;
									}
								}

								// 状态标签
								.status-tag {
									padding: 8rpx 16rpx;
									border-radius: 16rpx;
									font-size: 24rpx;
									flex-shrink: 0;

									.status-text {
										color: #fff;
										font-weight: 500;
									}

									&.status-not-processed {
										background: #ff4d4f;
									}

									&.status-processed {
										background: #ff9800;
									}

									&.status-processing {
										background: #9c27b0; // 修改为紫色，未离场状态
									}

									&.status-fixed {
										background: #722ed1; // 紫色表示固定状态
									}

									&.status-default {
										background: #8c8c8c;
									}
								}

								// 违规原因简化显示
								.reason-short {
									font-size: 24rpx;
									color: #ff4d4f;
									flex-shrink: 0;
									max-width: 140rpx;
									overflow: hidden;
									text-overflow: ellipsis;
									white-space: nowrap;
									background: linear-gradient(135deg, #fff2f0 0%, #ffebe8 100%);
									padding: 6rpx 12rpx;
									border-radius: 12rpx;
									border: 1px solid #ffccc7;
									font-weight: 500;
									text-align: center;
								}

								// 时间显示
								.time-display {
									font-size: 22rpx;
									color: #999;
									margin-left: auto;
									flex-shrink: 0;
									min-width: 100rpx;
									text-align: right;
								}
							}

							// 展开图标
							.expand-icon {
								margin-left: 16rpx;
								flex-shrink: 0;
								transition: transform 0.3s ease;
							}
						}

						// 展开后的详细内容
						.detail-content {
							padding: 0 32rpx 32rpx;
							border-top: 1px solid #f0f0f0;
							background: #fafafa;

							.detail-section {
								padding-top: 24rpx;

								// 时间信息卡片
								.time-cards {
									display: flex;
									flex-direction: column;
									gap: 16rpx;
									margin-bottom: 24rpx;

									.time-card {
										display: flex;
										align-items: center;
										padding: 16rpx 20rpx;
										background: #fff;
										border-radius: 12rpx;
										box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.04);

										.card-icon {
											margin-right: 16rpx;
											width: 40rpx;
											height: 40rpx;
											display: flex;
											align-items: center;
											justify-content: center;
											border-radius: 8rpx;

											.emoji-icon {
												font-size: 24rpx;
											}
										}

										.card-content {
											flex: 1;

											.card-label {
												font-size: 22rpx;
												color: #666;
												display: block;
												margin-bottom: 4rpx;
											}

											.card-time {
												font-size: 26rpx;
												color: #333;
												font-weight: 500;
											}
										}

										&.appointment-card .card-icon {
											background: rgba(41, 121, 255, 0.1);
										}

										&.enter-card .card-icon {
											background: rgba(82, 196, 26, 0.1);
										}

										&.leave-card .card-icon {
											background: rgba(255, 77, 79, 0.1);
										}
									}
								}

								// 违规详情
								.violation-detail {
									margin-bottom: 24rpx;

									.detail-row {
										display: flex;
										align-items: center;
										margin-bottom: 16rpx;
										padding: 16rpx 20rpx;
										background: #fff;
										border-radius: 12rpx;
										box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.04);

										.detail-tag {
											display: flex;
											align-items: center;
											margin-right: 16rpx;
											min-width: 120rpx;

											.tag-label {
												font-size: 22rpx;
												color: #666;
												margin-left: 8rpx;
											}
										}

										.detail-value {
											flex: 1;
											font-size: 26rpx;
											color: #333;

											&.status-not-processed {
												color: #ff4d4f;
											}

											&.status-processed {
												color: #ff9800;
											}

											&.status-processing {
												color: #9c27b0; // 修改为紫色，未离场状态
											}
										}
									}
								}

								// 操作按钮
								.action-buttons {
									display: flex;
									justify-content: center;

									.action-btn {
										display: flex;
										align-items: center;
										gap: 8rpx;
										padding: 16rpx 32rpx;
										border-radius: 12rpx;
										font-size: 26rpx;
										font-weight: 500;
										transition: all 0.2s ease;

										&.primary {
											background: #1890ff;
											color: #fff;

											&:active {
												background: #096dd9;
											}
										}
									}
								}
							}

							// 紧凑型三行布局样式
							.compact-detail-layout {
								padding-top: 24rpx;
								animation: slideIn 0.3s ease-out;

								// 第一行：时间流程
								.time-flow-row {
									display: flex;
									align-items: stretch;
									justify-content: space-between;
									margin-bottom: 16rpx;
									padding: 16rpx;
									background: #f8f9fa;
									border-radius: 12rpx;

									.time-item {
										display: flex;
										flex-direction: column;
										align-items: flex-start;
										flex: 1;
										min-width: 0;
										max-width: 33.33%;
										position: relative;
										padding: 16rpx 12rpx;
										background: #fff;
										border-radius: 12rpx;
										margin-right: 12rpx;
										box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
										border: 1px solid #f0f0f0;

										&:last-child {
											margin-right: 0;
										}

										// 时间头部（图标+标签）
										.time-header {
											display: flex;
											align-items: center;
											margin-bottom: 12rpx;

											.time-icon {
												font-size: 20rpx;
												margin-right: 8rpx;
											}

											.time-label {
												font-size: 22rpx;
												color: #999;
												white-space: nowrap;
												font-weight: 400;
											}
										}

										// 时间显示区域
										.time-display {
											display: flex;
											flex-direction: column;
											align-items: flex-start;
											width: 100%;

											.time-main {
												font-size: 32rpx;
												color: #333;
												font-weight: 600;
												line-height: 1.2;
												margin-bottom: 4rpx;
											}

											.time-date {
												font-size: 20rpx;
												color: #999;
												line-height: 1;
											}
										}

										// 不同状态的样式
										&:nth-child(1) {
											border-left: 4rpx solid #1890ff; // 预约 - 蓝色
										}

										&:nth-child(2) {
											border-left: 4rpx solid #9c27b0; // 进场 - 紫色
										}

										&:nth-child(3) {
											border-left: 4rpx solid #ff9800; // 离场 - 橙色
										}
									}

									// 兼容原有的单独时间值样式
									.time-value {
										font-size: 28rpx;
										color: #333;
										font-weight: 600;
									}

									// 不同状态的图标背景色
									&:nth-child(1) .time-icon {
										background: rgba(24, 144, 255, 0.15); // 预约 - 蓝色
									}

									&:nth-child(2) .time-icon {
										background: rgba(82, 196, 26, 0.15); // 进场 - 绿色
									}

									&:nth-child(3) .time-icon {
										background: rgba(255, 149, 0, 0.15); // 离场 - 橙色
									}
								}
							}

							// 第二行：停车时长
							.duration-row {
								display: flex;
								align-items: center;
								margin-bottom: 16rpx;
								padding: 20rpx 24rpx;
								background: linear-gradient(135deg, #fff9f0 0%, #ffffff 100%);
								border-radius: 16rpx;
								box-shadow: 0 4rpx 12rpx rgba(255, 149, 0, 0.08);
								border: 1px solid #fff2e8;
								position: relative;
								overflow: hidden;

								// 添加左侧装饰条
								&::before {
									content: '';
									position: absolute;
									left: 0;
									top: 0;
									bottom: 0;
									width: 4rpx;
									background: linear-gradient(to bottom, #ff9500, #ffad33);
								}

								.duration-icon {
									font-size: 26rpx;
									margin-right: 12rpx;
									padding: 10rpx;
									border-radius: 50%;
									background: rgba(255, 149, 0, 0.15);
									display: flex;
									align-items: center;
									justify-content: center;
									min-width: 46rpx;
									height: 46rpx;
								}

								.duration-label {
									font-size: 26rpx;
									color: #666;
									margin-right: 12rpx;
									font-weight: 500;
								}

								.duration-value {
									font-size: 32rpx;
									font-weight: 600;
									padding: 6rpx 16rpx;
									border-radius: 20rpx;
									position: relative;

									&.duration-short {
										color: #52c41a;
										background: rgba(82, 196, 26, 0.1);
										border: 1px solid rgba(82, 196, 26, 0.2);
									}

									&.duration-medium {
										color: #ff9500;
										background: rgba(255, 149, 0, 0.1);
										border: 1px solid rgba(255, 149, 0, 0.2);
									}

									&.duration-long {
										color: #ff4d4f;
										background: rgba(255, 77, 79, 0.1);
										border: 1px solid rgba(255, 77, 79, 0.2);
										animation: pulse 2s infinite;
									}
								}
							}

							// 第三行：状态信息
							.status-row {
								display: flex;
								align-items: center;
								padding: 20rpx 24rpx;
								background: linear-gradient(135deg, #f6ffed 0%, #ffffff 100%);
								border-radius: 16rpx;
								box-shadow: 0 4rpx 12rpx rgba(82, 196, 26, 0.06);
								border: 1px solid #f0f9e8;
								position: relative;

								.status-item {
									display: flex;
									align-items: center;
									padding: 8rpx 16rpx;
									border-radius: 20rpx;
									transition: all 0.3s ease;

									.status-icon {
										font-size: 24rpx;
										margin-right: 8rpx;
									}

									.status-text {
										font-size: 28rpx;
										color: #333;
										font-weight: 500;

										&.status-not-processed {
											color: #ff4d4f;
										}

										&.status-processed {
											color: #52c41a;
										}

										&.status-processing {
											color: #ff9500;
										}
									}

									// 违规原因样式
									&:first-child {
										background: rgba(255, 77, 79, 0.08);
										border: 1px solid rgba(255, 77, 79, 0.15);

										.status-text {
											color: #ff4d4f;
											font-weight: 600;
										}
									}

									// 车辆状态样式
									&:last-child {
										background: rgba(255, 152, 0, 0.08);
										border: 1px solid rgba(255, 152, 0, 0.15);

										.status-text.status-processed {
											color: #ff9800;
											font-weight: 600;
										}

										.status-text.status-processing {
											color: #9c27b0;
											background: rgba(156, 39, 176, 0.08);
											border: 1px solid rgba(156, 39, 176, 0.15);
											padding: 4rpx 12rpx;
											border-radius: 12rpx;
										}

										.status-text.status-not-processed {
											color: #ff4d4f;
											background: rgba(255, 77, 79, 0.08);
											border: 1px solid rgba(255, 77, 79, 0.15);
											padding: 4rpx 12rpx;
											border-radius: 12rpx;
										}
									}
								}

								.status-divider {
									margin: 0 20rpx;
									color: #d9d9d9;
									font-size: 28rpx;
									font-weight: 300;
								}
							}
						}
					}
				}

				.violation-card {
					width: 100%;
					background: linear-gradient(145deg, #ffffff, #f8faff);
					border-radius: 12rpx; // 稍微减少圆角
					box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
					position: relative;
					transition: all 0.3s ease;
					border: 1px solid #f0f0f0;
					overflow: hidden; // 为滑动效果准备

					// 滑动容器
					.swipe-container {
						position: relative;
						width: 100%;
						display: flex;
						transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
					}

					// 主内容区域
					.card-main {
						width: 100%;
						padding: 16rpx 16rpx 16rpx; // 进一步减少内边距
						flex-shrink: 0;
						background: inherit;
					}



					&:hover {
						transform: translateY(-2rpx);
						box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
						border-color: #d9d9d9;
					}

					.card-header {
						display: flex;
						justify-content: space-between;
						align-items: center;
						margin-top: 20rpx; // 进一步减小与顶部标签的间距
						margin-bottom: 8rpx; // 减小底部间距
						padding-bottom: 8rpx; // 减小padding
						border-bottom: 1px dashed #f0f0f0;

						.header-left {
							display: flex;
							align-items: center;
							gap: 20rpx;

							.plate-number {
								display: inline-block;
								font-size: 28rpx;
								font-weight: bold;
								padding: 8rpx 16rpx;
								border-radius: 8rpx; // 与实时违规记录保持一致
								font-family: "微软雅黑";
								letter-spacing: 1rpx;
								min-width: 160rpx;
								text-align: center;
								position: relative;
								transition: all 0.3s ease;

								&.blue-plate {
									background: linear-gradient(135deg, #0C4FC5, #216FEF);
									color: #FFFFFF;
									border: 1px solid #0C4FC5;
									box-shadow: 0 4rpx 12rpx rgba(12, 79, 197, 0.2);

									&:hover {
										transform: translateY(-2rpx);
										box-shadow: 0 6rpx 16rpx rgba(12, 79, 197, 0.3);
									}
								}

								&.green-plate {
									background: linear-gradient(180deg, #6AD390 0%, #D0F1E4 100%);
									color: #000000;
									border: 1px solid #6AD390;
									box-shadow: 0 4rpx 12rpx rgba(82, 196, 26, 0.2);

									&:hover {
										transform: translateY(-2rpx);
										box-shadow: 0 6rpx 16rpx rgba(82, 196, 26, 0.3);
									}

									&::before {
										content: '新能源';
										position: absolute;
										top: -20rpx;
										right: -10rpx;
										background: #f6ffed;
										color: #52c41a;
										font-size: 20rpx;
										padding: 2rpx 8rpx;
										border-radius: 4rpx;
										border: 1px solid #b7eb8f;
										transform: scale(0.8);
									}
								}
							}

							.time {
								font-size: 28rpx;
								color: #666;
								font-family: "DIN Alternate";
								background: #f5f5f5;
								padding: 4rpx 12rpx;
								border-radius: 6rpx;
							}
						}

						.status {
							padding: 6rpx 20rpx;
							border-radius: 20rpx;
							font-size: 26rpx;
							font-weight: 500;
							display: flex;
							align-items: center;
							gap: 6rpx;

							&::before {
								content: '';
								width: 8rpx;
								height: 8rpx;
								border-radius: 50%;
							}

							&.not-processed {
								background: #fff2e8;
								color: #fa541c;
								border: 1px solid #ffbb96;

								&::before {
									background: #fa541c;
									box-shadow: 0 0 0 4rpx rgba(250, 84, 28, 0.2);
								}
							}

							&.is-processed {
								background: #f6ffed;
								color: #52c41a;
								border: 1px solid #b7eb8f;

								&::before {
									background: #52c41a;
									box-shadow: 0 0 0 4rpx rgba(82, 196, 26, 0.2);
								}
							}

							&.processing {
								background: #e6f7ff;
								color: #1890ff;
								border: 1px solid #91d5ff;

								&::before {
									background: #1890ff;
									box-shadow: 0 0 0 4rpx rgba(24, 144, 255, 0.2);
								}
							}
						}
					}

					.card-content {
						margin-top: 8rpx; // 减少顶部边距
						padding: 12rpx; // 减少内边距
						background: #fafafa;
						border-radius: 12rpx;
						border: 1px solid #f0f0f0;

						// 美观的时间卡片显示
						.time-info {
							margin: 8rpx 0; // 进一步减少上下边距
							display: flex;
							gap: 8rpx; // 进一步减少卡片间隙

							.time-card {
								flex: 1;
								background: linear-gradient(145deg, #ffffff, #f8faff);
								padding: 12rpx; // 进一步减少内边距
								border-radius: 12rpx; // 减少圆角
								border: 1rpx solid #e8e8e8;
								box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04); // 减少阴影
								transition: all 0.3s ease;
								display: flex;
								align-items: center;
								gap: 8rpx; // 进一步减少内部间隙

								.time-icon {
									display: flex;
									align-items: center;
									justify-content: center;
									width: 40rpx; // 进一步减少图标大小
									height: 40rpx;
									border-radius: 50%;
									background: rgba(255, 255, 255, 0.8);
									box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.08); // 减少阴影
								}

								.time-content {
									flex: 1;

									.time-label {
										font-size: 20rpx; // 进一步减少字体大小
										color: #666;
										margin-bottom: 4rpx; // 进一步减少间距
										display: block;
									}

									.time-display {
										display: flex;
										flex-direction: column;
										gap: 2rpx; // 减少间隙

										.date-text {
											font-size: 24rpx; // 减少字体大小
											color: #333;
											font-weight: 500;
										}

										.time-text {
											font-size: 28rpx; // 减少字体大小
											font-weight: 700;
											font-family: "DIN Alternate", "Arial", sans-serif;
											color: #1890ff;
										}
									}
								}

								&.enter-time {
									border-left: 4rpx solid #9c27b0;

									.time-icon {
										background: rgba(156, 39, 176, 0.1);
									}

									.time-display .time-text {
										color: #9c27b0;
									}
								}

								&.leave-time {
									border-left: 4rpx solid #ff7875;

									.time-icon {
										background: rgba(255, 120, 117, 0.1);
									}

									.time-display .time-text {
										color: #ff7875;
									}
								}

								&:hover {
									transform: translateY(-2rpx);
									box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);

									.time-icon {
										transform: scale(1.1);
									}
								}
							}
						}

						.violation-reason {
							display: flex;
							align-items: center;
							gap: 12rpx; // 减少间隙
							margin-top: 12rpx; // 添加上边距

							.label {
								color: #666;
								font-size: 26rpx; // 减少字体大小
								font-weight: 500;
								flex-shrink: 0;
							}

							.value {
								color: #ff4d4f;
								font-size: 26rpx; // 减少字体大小
								font-weight: 600;
								background: #fff2f0;
								padding: 6rpx 16rpx; // 减少内边距
								border-radius: 6rpx;
								border-left: 3rpx solid #ff4d4f; // 减少边框宽度
								flex: 1;
							}
						}
					}

					.card-actions {
						margin-top: 20rpx;
						display: flex;
						justify-content: flex-end;
						padding-top: 16rpx;
						border-top: 1px dashed #f0f0f0;

						:deep(.u-button) {
							min-width: 160rpx;
							border-radius: 8rpx;
							font-weight: 500;

							&:active {
								transform: scale(0.98);
							}
						}
					}

					// 预约时间标签样式优化  
					.appointment-tag {
						position: absolute;
						top: 12rpx; // 减少顶部间距
						left: 16rpx; // 减少左边距
						right: 120rpx; // 增加右边距，避免遮挡状态标签
						z-index: 2;
						background: linear-gradient(135deg, #e6f7ff, #f0f7ff);
						padding: 6rpx 16rpx; // 减少内边距
						border-radius: 6rpx; // 减少圆角
						display: flex;
						align-items: center;
						gap: 6rpx; // 减少间隙

						.tag-label {
							font-size: 20rpx; // 进一步减少字体大小
							color: #2979ff;
							font-weight: bold;
							flex-shrink: 0; // 防止文字被压缩
						}

						.time {
							color: #2979ff;
							font-size: 22rpx; // 进一步减少字体大小
							font-weight: 500;
							font-family: "DIN Alternate", "Arial", sans-serif;
							overflow: hidden; // 隐藏溢出
							text-overflow: ellipsis; // 省略号
							white-space: nowrap; // 不换行
							flex: 1; // 占据剩余空间
							min-width: 0; // 允许缩小
						}
					}

					// 车辆状态标签
					.vehicle-status {
						position: absolute;
						top: 12rpx; // 与预约时间对齐
						right: 12rpx; // 进一步减少右边距
						width: auto;
						min-width: 80rpx; // 设置最小宽度确保不被挤压
						padding: 6rpx 12rpx; // 减少内边距
						border-radius: 6rpx;
						display: flex;
						align-items: center;
						justify-content: center; // 居中对齐
						gap: 4rpx; // 进一步减少间隙
						font-size: 20rpx; // 再次减少字体大小
						font-weight: 500;
						z-index: 3; // 提高层级，确保在预约时间之上
						box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.08); // 减少阴影

						&.not-entered {
							background: linear-gradient(135deg, #ff4d4f, #ff7875);
							color: #fff;
							animation: pulse 2s infinite;
						}

						&.not-left {
							background: linear-gradient(135deg, #1890ff, #40a9ff);
							color: #fff;
						}

						&.entered {
							background: linear-gradient(135deg, #52c41a, #73d13d);
							color: #fff;
						}

						.u-icon {
							transform: scale(0.6); // 进一步缩小图标
							margin-right: 2rpx; // 添加少量右边距
						}
					}
				}

				@keyframes pulse {
					0% {
						transform: scale(1);
					}

					50% {
						transform: scale(1.05);
					}

					100% {
						transform: scale(1);
					}
				}

				@keyframes shake {

					0%,
					100% {
						transform: translateX(0);
					}

					25% {
						transform: translateX(-2rpx);
					}

					75% {
						transform: translateX(2rpx);
					}
				}

				@keyframes rotate {
					from {
						transform: rotate(0deg);
					}

					to {
						transform: rotate(360deg);
					}
				}

				@keyframes warning {

					0%,
					100% {
						transform: scale(1);
					}

					50% {
						transform: scale(1.1);
					}
				}

				@keyframes shimmer {
					to {
						left: 100%;
					}
				}

				@keyframes shine {
					0% {
						left: -100%;
					}

					20% {
						left: 100%;
					}

					100% {
						left: 100%;
					}
				}

				@keyframes ripple {
					to {
						transform: translate(-50%, -50%) scale(2);
						opacity: 0;
					}
				}

				@keyframes highlight {
					0% {
						transform: scale(1);
					}

					50% {
						transform: scale(1.02);
					}

					100% {
						transform: scale(1);
					}
				}

				@keyframes bounce {

					0%,
					20%,
					50%,
					80%,
					100% {
						transform: translateY(0);
					}

					40% {
						transform: translateY(-8rpx);
					}

					60% {
						transform: translateY(-4rpx);
					}
				}

				@keyframes slideDown {
					0% {
						opacity: 0;
						transform: translateY(-30rpx);
						max-height: 0;
					}

					50% {
						opacity: 0.8;
						transform: translateY(-10rpx);
					}

					100% {
						opacity: 1;
						transform: translateY(0);
						max-height: 2000rpx;
					}
				}

				@keyframes fadeInUp {
					0% {
						opacity: 0;
						transform: translate3d(0, 40rpx, 0);
					}

					100% {
						opacity: 1;
						transform: translate3d(0, 0, 0);
					}
				}

				@keyframes slideInLeft {
					0% {
						opacity: 0;
						transform: translate3d(-100%, 0, 0);
					}

					100% {
						opacity: 1;
						transform: translate3d(0, 0, 0);
					}
				}

				@keyframes timeCardPulse {
					0% {
						transform: scale(1);
						opacity: 1;
					}

					50% {
						transform: scale(1.05);
						opacity: 0.9;
					}

					100% {
						transform: scale(1);
						opacity: 1;
					}
				}

				@keyframes floatUp {
					0% {
						transform: translateY(0);
					}

					50% {
						transform: translateY(-4rpx);
					}

					100% {
						transform: translateY(0);
					}
				}
			}
		}

		.high-risk-section {
			margin-top: 16rpx;

			.section-header {
				.warning-title {
					display: flex;
					align-items: center;
					background: #fff2f0;
					padding: 16rpx;
					border-radius: 8rpx;
					margin-bottom: 16rpx;
					border: 1px solid #ffccc7;

					.u-icon {
						margin-right: 8rpx;
					}

					.title-text {
						font-size: 28rpx;
						font-weight: bold;
						color: #ff4d4f;
						margin-right: 12rpx;
					}

					.total-count {
						background: #ff4d4f;
						color: #fff;
						padding: 3rpx 12rpx;
						border-radius: 16rpx;
						font-size: 20rpx;
					}

					.blacklist-count {
						background: linear-gradient(135deg, #ff3300, #ff6600);
						color: #fff;
						padding: 6rpx 14rpx;
						border-radius: 18rpx;
						font-size: 22rpx;
						margin-left: 8rpx;
						font-weight: 700;
						border: 2px solid #ff0000;
						box-shadow: 0 3rpx 8rpx rgba(255, 51, 0, 0.6);
						animation: pulse-warning 2s infinite;
					}
				}
			}

			.risk-vehicles-list {

				// 高风险车辆空状态样式
				.empty-state-container {
					display: flex;
					justify-content: center;
					align-items: center;
					min-height: 300rpx;
					padding: 40rpx 20rpx;
				}

				.empty-state-card {
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					padding: 50rpx 30rpx;
					background: linear-gradient(145deg, #fafbfc 0%, #ffffff 100%);
					border-radius: 20rpx;
					border: 2rpx dashed #e1e4e8;
					box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.02);
					position: relative;
					overflow: hidden;
					max-width: 500rpx;
					width: 100%;

					&::before {
						content: '';
						position: absolute;
						top: 0;
						left: 0;
						right: 0;
						bottom: 0;
						background: radial-gradient(circle at center, rgba(82, 196, 26, 0.02) 0%, transparent 70%);
						pointer-events: none;
					}

					.empty-icon {
						margin-bottom: 20rpx;
						font-size: 64rpx;
						opacity: 0.7;
						animation: float 3s ease-in-out infinite;

						.icon-emoji {
							font-size: 64rpx;
						}
					}

					.empty-content {
						text-align: center;

						.empty-title {
							display: block;
							font-size: 28rpx;
							font-weight: 600;
							color: #2c3e50;
							margin-bottom: 8rpx;
							line-height: 1.4;
						}

						.empty-subtitle {
							display: block;
							font-size: 24rpx;
							color: #8590a6;
							line-height: 1.5;
							max-width: 350rpx;
						}
					}

					@keyframes float {

						0%,
						100% {
							transform: translateY(0);
						}

						50% {
							transform: translateY(-6rpx);
						}
					}
				}

				.risk-vehicle-item {
					margin-bottom: 16rpx;
					border-radius: 8rpx;
					background: #fff;
					overflow: hidden;
					transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
					box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);

					&.expanded {
						box-shadow: 0 12rpx 48rpx rgba(0, 0, 0, 0.15);
						transform: translateY(-4rpx);

						.risk-card {
							background: linear-gradient(135deg, #f8faff 0%, #ffffff 100%);
							border-bottom: 3rpx solid #1890ff;
						}

						.violation-details {
							animation: slideDown 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
						}
					}

					&:hover {
						transform: translateY(-4rpx);
						box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
					}

					.risk-card {
						padding: 12rpx 16rpx;
						background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);

						&:active {
							background: linear-gradient(to bottom, #f8f9fa 0%, #f5f6fa 100%);
						}

						.card-header {
							display: flex;
							justify-content: space-between;
							align-items: center;
							margin-bottom: 12rpx;

							.plate-info {
								display: flex;
								align-items: center;
								gap: 12rpx;

								.plate-number {
									display: inline-block;
									font-size: 28rpx; // 与实时违规记录保持一致
									font-weight: bold;
									padding: 8rpx 16rpx; // 与实时违规记录保持一致
									border-radius: 8rpx; // 与实时违规记录保持一致
									font-family: "微软雅黑";
									letter-spacing: 1rpx;
									min-width: 140rpx;
									text-align: center;

									&.blue-plate {
										background: linear-gradient(180deg, #0C4FC5 0%, #216FEF 100%);
										color: #FFFFFF;
										border: 1px solid #0C4FC5;
									}

									&.green-plate {
										background: linear-gradient(180deg, #6AD390 0%, #D0F1E4 100%);
										color: #000000;
										border: 1px solid #6AD390;
									}
								}

								.violation-badge {
									display: inline-flex;
									align-items: center;
									padding: 3rpx 8rpx;
									border-radius: 12rpx;
									margin-left: 8rpx;

									&.violation-normal {
										background: #8c8c8c; // 1-2次违规显示绿色
									}

									&.violation-warning {
										background: #faad14; // 3-4次违规显示黄色
									}

									&.violation-severe {
										background: #f5222d; // 5次及以上违规显示红色
										animation: pulse 1.5s infinite;
									}

									text {
										color: #FFFFFF;
										font-size: 24rpx;
										margin-left: 4rpx;
									}

									&.violation-severe {
										box-shadow: 0 0 12rpx rgba(245, 34, 45, 0.4);
									}
								}
							}
						}
					}
					.violation-details {
						background: linear-gradient(145deg, #ffffff 0%, #f8fafe 100%);
						border-top: none;
						padding: 16rpx;
						position: relative;
						overflow: hidden;
						border-radius: 0 0 16rpx 16rpx;
						box-shadow: inset 0 2rpx 8rpx rgba(0, 0, 0, 0.02);
						// 添加装饰背景
						&::before {
							content: '';
							position: absolute;
							top: -50%;
							right: -30%;
							width: 300rpx;
							height: 300rpx;
							background: radial-gradient(circle, rgba(41, 121, 255, 0.03) 0%, transparent 70%);
							border-radius: 50%;
							z-index: 0;
						}
						&::after {
							content: '';
							position: absolute;
							bottom: -40%;
							left: -20%;
							width: 250rpx;
							height: 250rpx;
							background: radial-gradient(circle, rgba(82, 196, 26, 0.03) 0%, transparent 70%);
							border-radius: 50%;
							z-index: 0;
						}
						// 添加顶部分割线装饰
						&:before {
							content: '';
							position: absolute;
							top: 0;
							left: 50%;
							transform: translateX(-50%);
							width: 40rpx;
							height: 4rpx;
							background: linear-gradient(90deg, #1890ff, #52c41a);
							border-radius: 2rpx;
							z-index: 1;
						}
						&>* {
							position: relative;
							z-index: 1;
						}
						// 重新设计的业主信息样式
						.owner-info-redesigned {
							margin-bottom: 12rpx;
							background: linear-gradient(145deg, #ffffff, #f8faff);
							padding: 12rpx 16rpx;
							border-radius: 8rpx;
							box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
							border: 1px solid rgba(24, 144, 255, 0.08);
							.info-row {
								&:first-child {
									display: flex;
									gap: 12rpx;
									margin-bottom: 8rpx;

									.info-item {
										flex: 1;
										padding: 8rpx 12rpx;
										background: rgba(255, 255, 255, 0.8);
										border-radius: 6rpx;
										box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.02);

										.label {
											color: #8c8c8c;
											font-size: 20rpx;
											margin-bottom: 4rpx;
											display: flex;
											align-items: center;
											font-weight: 500;

											&.name-label::before {
												content: '👤';
												margin-right: 6rpx;
												font-size: 24rpx;
											}

											&.phone-label::before {
												content: '📱';
												margin-right: 6rpx;
												font-size: 24rpx;
											}
										}

										.value {
											font-size: 24rpx;
											font-weight: 600;
											color: #333;

											&.highlight {
												color: #1890ff;
												font-size: 26rpx;
											}
											&.phone {
								color: #04ab1d;
								font-family: Monaco, monospace;
								letter-spacing: 1px;
								
								&.clickable-phone {
									background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
									color: #1890ff;
									padding: 6rpx 12rpx;
									border-radius: 20rpx;
									border: 1rpx solid #91d5ff;
									font-weight: 600;
									cursor: pointer;
									transition: all 0.3s ease;
									position: relative;
									overflow: hidden;

									&::before {
										content: '📞';
										margin-right: 6rpx;
										font-size: 20rpx;
									}

									&:hover {
										background: linear-gradient(135deg, #bae7ff 0%, #91d5ff 100%);
										transform: translateY(-1rpx);
										box-shadow: 0 4rpx 12rpx rgba(24, 144, 255, 0.3);
									}

											&:active {
			transform: translateY(0);
			background: linear-gradient(135deg, #91d5ff 0%, #69c0ff 100%);
		}

		/* 响应式设计 */
		@media (max-width: 750rpx) {
			font-size: 24rpx;
			padding: 4rpx 8rpx;
			
			&::before {
				font-size: 18rpx;
				margin-right: 4rpx;
			}
		}
	}
}
										}
									}
								}

								&.address-row {
									background: rgba(255, 255, 255, 0.6);
									padding: 8rpx 12rpx;
									border-radius: 6rpx;
									display: flex;
									align-items: flex-start;

									.label {
										color: #666;
										font-size: 20rpx;
										margin-right: 8rpx;
										flex-shrink: 0;
										display: flex;
										align-items: center;
										font-weight: 500;

										&::before {
											content: '🏠';
											margin-right: 4rpx;
											font-size: 20rpx;
										}
									}

									.value.address {
										color: #333;
										font-size: 22rpx;
										flex: 1;
										line-height: 1.3;
									}
								}
							}
						}

						// 新的基本信息卡片样式
						.basic-info-card {
							background: rgba(255, 255, 255, 0.9);
							border-radius: 12rpx;
							padding: 20rpx;
							margin-bottom: 12rpx;
							box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
							border: 1px solid rgba(24, 144, 255, 0.08);

							.info-row {
								display: flex;
								align-items: center;
								padding: 12rpx 0;
								
								&:not(:last-child) {
									border-bottom: 1px solid rgba(0, 0, 0, 0.05);
									margin-bottom: 12rpx;
									padding-bottom: 16rpx;
								}

								.info-icon {
									font-size: 32rpx;
									margin-right: 16rpx;
									width: 36rpx;
									text-align: center;
									opacity: 0.8;
								}

								.info-content {
									flex: 1;
									display: flex;
									flex-direction: column;
									gap: 6rpx;

									.info-label {
										font-size: 24rpx;
										color: #666;
										font-weight: 500;
										line-height: 1.3;
									}

									.info-value {
										font-size: 28rpx;
										color: #333;
										font-weight: 600;
										line-height: 1.4;

										&.highlight {
											color: #1890ff;
											font-size: 30rpx;
											font-weight: 700;
										}

										&.phone-number {
											color: #52c41a;
											font-family: Monaco, "SF Mono", monospace;
											letter-spacing: 0.5px;
											
											&.clickable-phone {
												background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%);
												color: #52c41a;
												padding: 8rpx 16rpx;
												border-radius: 24rpx;
												border: 1px solid #95de64;
												cursor: pointer;
												transition: all 0.3s ease;
												display: inline-flex;
												align-items: center;
												gap: 6rpx;
												margin-top: 4rpx;
												min-width: 200rpx;
												justify-content: center;

												&::before {
													content: '📞';
													font-size: 20rpx;
												}

												&:active {
													transform: scale(0.98);
													background: linear-gradient(135deg, #d9f7be 0%, #b7eb8f 100%);
												}
											}
										}
									}
									
									// 电话号码包装器
									.phone-wrapper {
										margin-top: 2rpx;
									}
								}
							}
						}

						// 专属信息卡片样式
						.specialty-info-card {
							background: rgba(255, 255, 255, 0.9);
							border-radius: 12rpx;
							padding: 16rpx;
							margin-bottom: 12rpx;
							box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);

							&.monthly-card {
								border-left: 4rpx solid #ff9500;
							}

							&.local-card {
								border-left: 4rpx solid #1890ff;
							}

							&.visitor-card {
								border-left: 4rpx solid #52c41a;
							}

							.card-header {
								margin-bottom: 12rpx;
								padding-bottom: 8rpx;
								border-bottom: 1px solid rgba(0, 0, 0, 0.05);

								.card-title {
									font-size: 24rpx;
									font-weight: 600;
									color: #333;
								}
							}

							.info-row {
								display: flex;
								align-items: center;
								padding: 6rpx 0;

								.info-icon {
									font-size: 24rpx;
									margin-right: 12rpx;
									width: 28rpx;
									text-align: center;
								}

								.info-content {
									flex: 1;
									display: flex;
									justify-content: space-between;
									align-items: center;

									.info-label {
										font-size: 22rpx;
										color: #666;
									}

									.info-value {
										font-size: 24rpx;
										color: #333;
										font-weight: 500;
									}
								}

								&.visitor-tip-row {
									.visitor-tip {
										font-size: 22rpx;
										color: #666;
										font-style: italic;
									}
								}
							}
						}

						// 优化状态统计卡片组
						.status-stats {
							display: flex;
							gap: 12rpx;
							margin: 0 0 16rpx;
							padding: 16rpx;
							background: rgba(255, 255, 255, 0.6);
							backdrop-filter: blur(10px);
							border-radius: 20rpx;
							border: 1px solid rgba(255, 255, 255, 0.8);
							box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);

							.stat-card {
								flex: 1;
								display: flex;
								flex-direction: column;
								align-items: center;
								text-align: center;
								padding: 20rpx 16rpx;
								border-radius: 16rpx;
								transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
								position: relative;
								overflow: hidden;
								cursor: pointer;
								background: rgba(255, 255, 255, 0.9);
								backdrop-filter: blur(20px);
								border: 1px solid rgba(255, 255, 255, 0.2);
								box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);

								// 光晕效果
								&::before {
									content: '';
									position: absolute;
									top: 0;
									left: 0;
									right: 0;
									height: 2rpx;
									border-radius: 1rpx;
									transition: all 0.4s ease;
									transform: scaleX(0);
									transform-origin: center;
								}

								// 悬浮光效
								&::after {
									content: '';
									position: absolute;
									top: -50%;
									left: -50%;
									width: 200%;
									height: 200%;
									background: conic-gradient(from 0deg, transparent, rgba(255, 255, 255, 0.1), transparent);
									border-radius: 50%;
									transition: all 0.6s ease;
									opacity: 0;
									transform: rotate(0deg);
								}

								.icon-wrapper {
									width: 56rpx;
									height: 56rpx;
									border-radius: 16rpx;
									display: flex;
									align-items: center;
									justify-content: center;
									margin-bottom: 12rpx;
									transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
									position: relative;
									backdrop-filter: blur(10px);
									box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);

									&::before {
										content: '';
										position: absolute;
										inset: -4rpx;
										border-radius: 24rpx;
										background: inherit;
										opacity: 0.3;
										transform: scale(0.8);
										transition: all 0.4s ease;
										z-index: -1;
									}
								}

								.stat-info {
									display: flex;
									flex-direction: column;
									align-items: center;

									.label {
										font-size: 22rpx;
										font-weight: 600;
										opacity: 0.9;
										margin-bottom: 6rpx;
										transition: all 0.3s ease;
									}

									.count {
										font-size: 36rpx;
										font-weight: 800;
										font-family: "DIN Alternate", "Arial", sans-serif;
										line-height: 1;
										transition: all 0.3s ease;
										background: linear-gradient(135deg, currentColor, currentColor);
										-webkit-background-clip: text;
										position: relative;

										&::after {
											content: '';
											position: absolute;
											bottom: -4rpx;
											left: 50%;
											transform: translateX(-50%);
											width: 0;
											height: 2rpx;
											background: currentColor;
											border-radius: 1rpx;
											transition: width 0.3s ease;
										}
									}

									.number {
										font-size: 42rpx;
										font-weight: 800;
										font-family: "DIN Alternate", "Arial", sans-serif;
										line-height: 1;
										transition: all 0.3s ease;
										background: linear-gradient(135deg, currentColor, currentColor);
										-webkit-background-clip: text;
										position: relative;
										margin-bottom: 4rpx;

										&::after {
											content: '';
											position: absolute;
											bottom: -4rpx;
											left: 50%;
											transform: translateX(-50%);
											width: 0;
											height: 2rpx;
											background: currentColor;
											border-radius: 1rpx;
											transition: width 0.3s ease;
										}
									}

									.status {
										font-size: 24rpx;
										font-weight: 500;
										opacity: 0.9;
										transition: all 0.3s ease;
									}
								}

								// 不同状态的样式 - 醒目版本
								&.overall-status {
									transform: scale(1.05) !important;
									border: 2px solid transparent !important;
									box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.12) !important;
									
									&::before {
										height: 6rpx !important;
									}

									.icon-wrapper {
										color: #fff !important;
										box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.2) !important;
										transform: scale(1.05);

										.status-emoji {
											font-size: 34rpx !important;
											line-height: 1;
											filter: drop-shadow(0 2rpx 4rpx rgba(0, 0, 0, 0.2));
										}
									}

									.stat-info {
										.status {
											font-size: 30rpx !important;
											font-weight: 700 !important;
											margin-bottom: 4rpx;
											text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.1);
										}

										.label {
											font-size: 22rpx !important;
											opacity: 0.9 !important;
											font-weight: 600;
										}
									}

									// 待进场状态 - 橙色醒目
									&[data-status="待进场"] {
										border-color: #ff6b35 !important;
										background: linear-gradient(145deg, #fff7e6, #ffffff) !important;
										
										&::before {
											background: linear-gradient(90deg, #ff6b35, #f7931e) !important;
										}
										
										.icon-wrapper {
											background: linear-gradient(135deg, #ff6b35, #f7931e) !important;
											box-shadow: 0 8rpx 24rpx rgba(255, 107, 53, 0.4) !important;
											
											.status-emoji {
												animation: pulse 1.5s infinite;
											}
										}
										
										.stat-info {
											.status {
												color: #ff6b35 !important;
											}
											.label {
												color: #ff6b35 !important;
											}
										}
									}

																	// 未离场状态 - 鲜艳紫色醒目
								&[data-status="未离场"] {
									border-color: #9c27b0 !important;
									background: linear-gradient(145deg, #f3e5f5, #ffffff) !important;
									
									&::before {
										background: linear-gradient(90deg, #9c27b0, #e91e63) !important;
									}
									
									.icon-wrapper {
										background: linear-gradient(135deg, #9c27b0, #e91e63) !important;
										box-shadow: 0 8rpx 24rpx rgba(156, 39, 176, 0.6) !important;
										
										.status-emoji {
											animation: float 2s ease-in-out infinite;
										}
									}
									
									.stat-info {
										.status {
											color: #9c27b0 !important;
											font-weight: 800 !important;
										}
										.label {
											color: #9c27b0 !important;
										}
									}
								}

																	// 已离场状态 - 鲜艳橙色醒目
								&[data-status="已离场"] {
									border-color: #ff9800 !important;
									background: linear-gradient(145deg, #fff3e0, #ffffff) !important;
									
									&::before {
										background: linear-gradient(90deg, #ff9800, #ffb74d) !important;
									}
									
									.icon-wrapper {
										background: linear-gradient(135deg, #ff9800, #ffb74d) !important;
										box-shadow: 0 8rpx 24rpx rgba(255, 152, 0, 0.6) !important;
									}
									
									.stat-info {
										.status {
											color: #ff9800 !important;
											font-weight: 800 !important;
										}
										.label {
											color: #ff9800 !important;
										}
									}
								}

									&:hover {
										box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.15) !important;
										transform: scale(1.08) !important;
									}
								}



								&.not-entered {
									&::before {
										background: linear-gradient(90deg, #ff4d4f, #ff7875);
									}

									.icon-wrapper {
										background: linear-gradient(135deg, #ff4d4f, #ff7875);
										color: #fff;
										box-shadow: 0 8rpx 24rpx rgba(255, 77, 79, 0.3);
									}

									.stat-info {

										.count,
										.number,
										.status,
										.label {
											color: #ff4d4f;
										}
									}

									&:hover {
										background: linear-gradient(145deg, rgba(255, 245, 245, 0.95), rgba(255, 255, 255, 0.95));
										border-color: rgba(255, 77, 79, 0.2);
										box-shadow: 0 12rpx 40rpx rgba(255, 77, 79, 0.15);
									}
								}

								&.in-progress {
									&::before {
										background: linear-gradient(90deg, #1890ff, #40a9ff);
									}

									.icon-wrapper {
										background: linear-gradient(135deg, #1890ff, #40a9ff);
										color: #fff;
										box-shadow: 0 8rpx 24rpx rgba(24, 144, 255, 0.3);
									}

									.stat-info {

										.count,
										.number,
										.status,
										.label {
											color: #1890ff;
										}
									}

									&:hover {
										background: linear-gradient(145deg, rgba(240, 249, 255, 0.95), rgba(255, 255, 255, 0.95));
										border-color: rgba(24, 144, 255, 0.2);
										box-shadow: 0 12rpx 40rpx rgba(24, 144, 255, 0.15);
									}
								}

								&.has-left {
									&::before {
										background: linear-gradient(90deg, #52c41a, #73d13d);
									}

									.icon-wrapper {
										background: linear-gradient(135deg, #52c41a, #73d13d);
										color: #fff;
										box-shadow: 0 8rpx 24rpx rgba(82, 196, 26, 0.3);
									}

									.stat-info {
										.count,
										.number,
										.status,
										.label {
											color: #52c41a;
										}
									}
									&:hover {
										background: linear-gradient(145deg, rgba(246, 255, 237, 0.95), rgba(255, 255, 255, 0.95));
										border-color: rgba(82, 196, 26, 0.2);
										box-shadow: 0 12rpx 40rpx rgba(82, 196, 26, 0.15);
									}
								}
								// 悬停效果
								&:hover {
									transform: translateY(-8rpx) scale(1.02);

									&::before {
										transform: scaleX(1);
									}

									&::after {
										opacity: 1;
										transform: rotate(180deg);
									}

									.icon-wrapper {
										transform: scale(1.15) rotate(5deg);

										&::before {
											transform: scale(1.2);
											opacity: 0.2;
										}
									}

									.stat-info .count::after {
										width: 100%;
									}
								}

								// 选中状态
								&.selected {
									transform: translateY(-12rpx) scale(1.08);
									box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.2);
									border: 2rpx solid transparent;

									&::before {
										transform: scaleX(1);
										height: 6rpx;
									}

									&::after {
										content: '✓';
										position: absolute;
										top: 6rpx;
										right: 6rpx;
										width: 24rpx;
										height: 24rpx;
										background: #52c41a;
										color: #fff;
										border-radius: 50%;
										display: flex;
										align-items: center;
										justify-content: center;
										font-size: 16rpx;
										font-weight: bold;
										animation: checkmark 0.3s ease-in-out;
										z-index: 10;
									}

									.icon-wrapper {
										transform: scale(1.25) rotate(10deg);
										box-shadow: 0 12rpx 32rpx rgba(0, 0, 0, 0.2);

										&::before {
											transform: scale(1.4);
											opacity: 0.15;
										}
									}

									.stat-info {
										.count {
											font-size: 48rpx;
											font-weight: 700;

											&::after {
												width: 120%;
												height: 3rpx;
											}
										}

										.label {
											opacity: 1;
											font-weight: 700;
										}
									}

									// 不同状态的选中样式
									&.not-entered {
										border-color: #ff4d4f;
										background: linear-gradient(145deg, #fff2f0, #fff5f5);
										box-shadow: 0 20rpx 60rpx rgba(255, 77, 79, 0.25);

										&::before {
											background: #ff4d4f;
										}
									}
									&.in-progress {
										border-color: #1890ff;
										background: linear-gradient(145deg, #e6f7ff, #f0f9ff);
										box-shadow: 0 20rpx 60rpx rgba(24, 144, 255, 0.25);

										&::before {
											background: #1890ff;
										}
									}
									&.has-left {
										border-color: #52c41a;
										background: linear-gradient(145deg, #f6ffed, #f9fff6);
										box-shadow: 0 20rpx 60rpx rgba(82, 196, 26, 0.25);

										&::before {
											background: #52c41a;
										}
									}
									@keyframes checkmark {
										0% {
											transform: scale(0) rotate(0deg);
											opacity: 0;
										}

										50% {
											transform: scale(1.2) rotate(180deg);
											opacity: 1;
										}

										100% {
											transform: scale(1) rotate(360deg);
											opacity: 1;
										}
									}
								}

								// 点击效果
								&:active {
									transform: translateY(-4rpx) scale(0.98);
									transition: all 0.1s ease;
								}
							}
						}

						// 预约时间标注
						.appointment-tag {
							right: 100rpx; // 缩短右侧长度，为状态标签留出空间
							background: linear-gradient(135deg, #e6f7ff, #f0f7ff);
							padding: 6rpx 16rpx;
							border-radius: 6rpx;
							display: flex;
							align-items: center;
							gap: 6rpx;

							.tag-label {
								font-size: 20rpx;
								color: #2979ff;
								font-weight: bold;
							}

							.time {
								color: #2979ff;
								font-size: 22rpx;
								font-weight: 500;
								font-family: "DIN Alternate", "Arial", sans-serif;
							}
						}

						.card-header {
							margin-top: 50rpx; // 调整与预约时间的间距
							// ... existing code ...
						}

						.card-content {
							margin-top: 12rpx;
							padding: 16rpx;
							background: #fafafa;
							border-radius: 8rpx;
							border: 1px solid #f0f0f0;

							// 美观的时间卡片显示
							.time-info {
								margin: 20rpx 0;
								display: flex;
								gap: 16rpx;
								position: relative;

								// 连接线动画
								&::before {
									content: '';
									position: absolute;
									top: 50%;
									left: 50%;
									transform: translate(-50%, -50%);
									width: 60rpx;
									height: 4rpx;
									background: linear-gradient(90deg, transparent, #e8e8e8, transparent);
									border-radius: 2rpx;
									z-index: 1;
								}

								.time-card {
									flex: 1;
									background: linear-gradient(145deg, #ffffff 0%, #fafcff 100%);
									padding: 20rpx 16rpx;
									border-radius: 16rpx;
									border: 1rpx solid rgba(255, 255, 255, 0.6);
									box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
									transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
									display: flex;
									align-items: center;
									gap: 12rpx;
									position: relative;
									overflow: hidden;
									backdrop-filter: blur(20rpx);

									// 装饰性光效背景
									&::before {
										content: '';
										position: absolute;
										top: -50%;
										right: -50%;
										width: 200%;
										height: 200%;
										background: conic-gradient(from 0deg, transparent, rgba(255, 255, 255, 0.05), transparent);
										border-radius: 50%;
										animation: rotate 20s linear infinite;
										z-index: 0;
									}

									// 顶部装饰线
									&::after {
										content: '';
										position: absolute;
										top: 0;
										left: 0;
										right: 0;
										height: 6rpx;
										border-radius: 24rpx 24rpx 0 0;
										transition: all 0.3s ease;
										z-index: 1;
									}

									.time-icon {
										display: flex;
										align-items: center;
										justify-content: center;
										width: 64rpx;
										height: 64rpx;
										border-radius: 16rpx;
										background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
										box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
										position: relative;
										z-index: 2;
										transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);

										// 内部光晕
										&::before {
											content: '';
											position: absolute;
											inset: 8rpx;
											border-radius: 16rpx;
											background: inherit;
											opacity: 0.3;
											transition: all 0.4s ease;
										}

										.emoji-icon {
											font-size: 40rpx;
											line-height: 1;
											display: block;
											text-align: center;
											animation: pulse 3s infinite;
											filter: drop-shadow(0 2rpx 4rpx rgba(0, 0, 0, 0.1));
										}
									}

									.time-content {
										flex: 1;
										position: relative;
										z-index: 2;

										.time-label {
											font-size: 24rpx;
											color: #8c8c8c;
											margin-bottom: 8rpx;
											display: flex;
											align-items: center;
											font-weight: 600;
											letter-spacing: 0.5px;
											position: relative;

											// 小图标装饰
											&::before {
												content: '';
												width: 6rpx;
												height: 6rpx;
												border-radius: 50%;
												margin-right: 8rpx;
												transition: all 0.3s ease;
											}
										}

										.time-display {
											display: flex;
											flex-direction: column;
											gap: 4rpx;

											.date-text {
												font-size: 24rpx;
												color: #595959;
												font-weight: 500;
												font-family: -apple-system, BlinkMacSystemFont, sans-serif;
												letter-spacing: 0.3px;
											}

											.time-text {
												font-size: 32rpx;
												font-weight: 800;
												font-family: "DIN Alternate", "SF Pro Display", "Arial", sans-serif;
												letter-spacing: 1px;
												position: relative;
												display: inline-block;
												transition: all 0.3s ease;

												// 时间文字下方装饰线
												&::after {
													content: '';
													position: absolute;
													bottom: -4rpx;
													left: 0;
													width: 0;
													height: 3rpx;
													border-radius: 2rpx;
													transition: width 0.3s ease;
												}
											}
										}
									}

									// 进场时间样式
									&.enter-time {
										&::after {
											background: linear-gradient(90deg, #9c27b0, #e91e63);
										}

										.time-icon {
											background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
											box-shadow: 0 8rpx 24rpx rgba(156, 39, 176, 0.2);
											border: 2rpx solid rgba(156, 39, 176, 0.1);

											&::before {
												background: linear-gradient(135deg, #9c27b0, #e91e63);
												opacity: 0.1;
											}

											.emoji-icon {
												color: #9c27b0;
												text-shadow: 0 2rpx 4rpx rgba(156, 39, 176, 0.2);
											}
										}

										.time-content {
											.time-label {
												color: #9c27b0;

												&::before {
													background: linear-gradient(135deg, #9c27b0, #e91e63);
													box-shadow: 0 0 8rpx rgba(156, 39, 176, 0.3);
												}
											}

											.time-display .time-text {
												color: #9c27b0;
												background: linear-gradient(135deg, #9c27b0, #7b1fa2);
												-webkit-background-clip: text;
												color: transparent;
												text-shadow: 0 2rpx 4rpx rgba(156, 39, 176, 0.1);

												&::after {
													background: linear-gradient(90deg, #9c27b0, #e91e63);
												}
											}
										}

										&:hover {
											background: linear-gradient(145deg, #f3e5f5 0%, #ffffff 100%);
											border-color: rgba(156, 39, 176, 0.3);
											box-shadow: 0 16rpx 48rpx rgba(156, 39, 176, 0.15);

											.time-content .time-display .time-text::after {
												width: 100%;
											}
										}
									}

									// 离场时间样式
									&.leave-time {
										&::after {
											background: linear-gradient(90deg, #ff7875, #ff4d4f);
										}

										.time-icon {
											background: linear-gradient(135deg, #fff2f0 0%, #ffccc7 100%);
											box-shadow: 0 8rpx 24rpx rgba(255, 77, 79, 0.2);
											border: 2rpx solid rgba(255, 77, 79, 0.1);

											&::before {
												background: linear-gradient(135deg, #ff7875, #ff4d4f);
												opacity: 0.1;
											}

											.emoji-icon {
												color: #ff4d4f;
												text-shadow: 0 2rpx 4rpx rgba(255, 77, 79, 0.2);
											}
										}

										.time-content {
											.time-label {
												color: #ff4d4f;

												&::before {
													background: linear-gradient(135deg, #ff7875, #ff4d4f);
													box-shadow: 0 0 8rpx rgba(255, 77, 79, 0.3);
												}
											}

											.time-display .time-text {
												color: #ff4d4f;
												background: linear-gradient(135deg, #ff7875, #cf1322);
												-webkit-background-clip: text;
												color: transparent;
												text-shadow: 0 2rpx 4rpx rgba(255, 77, 79, 0.1);

												&::after {
													background: linear-gradient(90deg, #ff7875, #ff4d4f);
												}
											}
										}

										&:hover {
											background: linear-gradient(145deg, #fff2f0 0%, #ffffff 100%);
											border-color: rgba(255, 77, 79, 0.3);
											box-shadow: 0 16rpx 48rpx rgba(255, 77, 79, 0.15);

											.time-content .time-display .time-text::after {
												width: 100%;
											}
										}
									}

									// 悬停效果
									&:hover {
										transform: translateY(-8rpx) scale(1.02);
										box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.15);

										.time-icon {
											transform: scale(1.1) rotate(5deg);

											&::before {
												inset: 4rpx;
												opacity: 0.2;
											}

											.emoji-icon {
												animation: bounce 0.6s ease-in-out;
											}
										}

										&::before {
											animation-duration: 10s;
										}
									}

									// 点击效果
									&:active {
										transform: translateY(-4rpx) scale(0.98);
										transition: all 0.1s ease;
									}
								}
							}

							.violation-reason {
								// ... existing code ...
							}
						}

						// 车辆状态标签移到底部
						.vehicle-status {
							position: absolute;
							top: 12rpx;
							right: 16rpx;
							width: auto;
							padding: 4rpx 12rpx;
							border-radius: 4rpx;
							display: flex;
							align-items: center;
							gap: 6rpx;
							font-size: 20rpx;
							font-weight: 500;

							&.not-entered {
								background: #ff4d4f;
								color: #fff;
							}

							&.not-left {
								background: #1890ff;
								color: #fff;
							}

							&.entered {
								background: #52c41a;
								color: #fff;
							}

							.u-icon {
								transform: scale(0.7);
							}
						}

						.violation-item {
							margin-bottom: 20rpx;
							padding: 20rpx;
							background: linear-gradient(145deg, #ffffff 0%, #fafcff 100%);
							border-radius: 16rpx;
							box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
							position: relative;
							margin-top: 16rpx;
							border: 1px solid rgba(255, 255, 255, 0.8);
							backdrop-filter: blur(20rpx);
							overflow: hidden;
							transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

							// 装饰背景
							&::before {
								content: '';
								position: absolute;
								top: -50%;
								right: -50%;
								width: 200rpx;
								height: 200rpx;
								background: radial-gradient(circle, rgba(255, 77, 79, 0.05) 0%, transparent 70%);
								border-radius: 50%;
								z-index: 0;
							}

							&::after {
								content: '';
								position: absolute;
								bottom: -30%;
								left: -30%;
								width: 150rpx;
								height: 150rpx;
								background: radial-gradient(circle, rgba(24, 144, 255, 0.05) 0%, transparent 70%);
								border-radius: 50%;
								z-index: 0;
							}

							// 悬停效果
							&:hover {
								transform: translateY(-6rpx);
								box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.12);
								border-color: rgba(24, 144, 255, 0.2);
							}

							// 左侧装饰线
							&:before {
								content: '';
								position: absolute;
								left: 0;
								top: 0;
								bottom: 0;
								width: 6rpx;
								background: linear-gradient(to bottom, #ff4d4f, #1890ff, #52c41a);
								border-radius: 0 3rpx 3rpx 0;
								z-index: 1;
							}

							&>* {
								position: relative;
								z-index: 1;
							}

							/* 预约时间和状态同行布局 */
							.appointment-status-row {
								display: flex;
								justify-content: space-between;
								align-items: center;
								margin-bottom: 12rpx;
								padding: 0 2rpx;
							}

							.appointment-tag {
								display: flex;
								align-items: center;
								gap: 6rpx;

								.tag-label {
									font-size: 22rpx;
									color: #666;
									font-weight: 500;
								}

								.time {
									font-size: 24rpx;
									color: #2979ff;
									font-weight: 600;
								}
							}

							.status-badge {
								display: flex;
								align-items: center;
								gap: 4rpx;
								padding: 6rpx 12rpx;
								border-radius: 16rpx;
								font-size: 20rpx;
								font-weight: 500;

								&.not-entered {
									background: linear-gradient(135deg, #ff4d4f, #ff7875);
									color: white;
								}

								&.in-progress {
									background: linear-gradient(135deg, #ff6b35, #f7931e);
									color: white;
									box-shadow: 0 4rpx 15rpx rgba(255, 107, 53, 0.4);
								}

								&.has-left {
									background: linear-gradient(135deg, #00b894, #00a085);
									color: white;
									box-shadow: 0 4rpx 15rpx rgba(0, 184, 148, 0.4);
								}
							}

							.violation-content {
								margin-top: 6rpx; // 减少顶部边距

								.info-row {
									display: flex;
									gap: 6rpx; // 减少间隙
									flex-wrap: wrap;

									.info-tag {
										display: flex;
										align-items: center;
										gap: 4rpx; // 减少内部间隙
										padding: 6rpx 10rpx; // 减少内边距
										background: linear-gradient(90deg, #f8f9fa 0%, #ffffff 100%);
										border-radius: 12rpx;
										border: 1px solid rgba(0, 0, 0, 0.06);
										transition: all 0.3s ease;
										min-width: 180rpx;

										&:hover {
											transform: translateY(-2rpx);
											box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
										}

										&.violation-tag {
											border-left: 3rpx solid #ff4d4f;

											&:hover {
												background: linear-gradient(90deg, #fff5f5 0%, #ffffff 100%);
											}
										}

										&.reason-tag {
											border-left: 3rpx solid #2979ff;

											&:hover {
												background: linear-gradient(90deg, #f0f7ff 0%, #ffffff 100%);
											}
										}

										.tag-label {
											font-size: 20rpx;
											color: #666;
											font-weight: 500;
											min-width: 70rpx;
										}

										.tag-value {
											font-size: 22rpx;
											color: #333;
											font-weight: 600;
											flex: 1;
										}
									}
								}
							}
						}

						// 违规类型统计样式优化
						.violation-summary {
							margin-bottom: 16rpx; // 减少底部边距
							padding: 12rpx; // 减少内边距
							background: linear-gradient(145deg, #ffffff 0%, #f8faff 100%);
							border-radius: 16rpx;
							border: 1px solid rgba(24, 144, 255, 0.1);
							box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
							position: relative;
							overflow: hidden;

							&::before {
								content: '';
								position: absolute;
								top: 0;
								left: 0;
								right: 0;
								height: 4rpx;
								background: linear-gradient(90deg, #1890ff, #52c41a, #faad14, #ff4d4f);
								border-radius: 4rpx 4rpx 0 0;
							}

							&::after {
								content: '';
								position: absolute;
								bottom: -30%;
								right: -30%;
								width: 120rpx;
								height: 120rpx;
								background: radial-gradient(circle, rgba(24, 144, 255, 0.05) 0%, transparent 70%);
								border-radius: 50%;
							}

							.summary-item {
								display: inline-flex;
								align-items: center;
								padding: 8rpx 12rpx; // 减少内边距
								margin: 4rpx 4rpx; // 减少边距
								background: linear-gradient(135deg, #ffffff 0%, #fafcff 100%);
								border-radius: 12rpx;
								box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
								border: 1px solid rgba(255, 255, 255, 0.8);
								position: relative;
								overflow: hidden;
								transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
								backdrop-filter: blur(10rpx);

								&::before {
									content: '';
									position: absolute;
									top: 0;
									left: 0;
									width: 4rpx;
									height: 100%;
									background: linear-gradient(to bottom, #ff4d4f, #faad14);
									border-radius: 0 2rpx 2rpx 0;
									opacity: 0.8;
								}

								&::after {
									content: '';
									position: absolute;
									top: -100%;
									left: -100%;
									width: 200%;
									height: 200%;
									background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
									transition: all 0.6s ease;
									transform: rotate(45deg);
								}

								&:hover {
									transform: translateY(-4rpx) scale(1.02);
									box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
									border-color: rgba(255, 77, 79, 0.2);

									&::after {
										top: -50%;
										left: -50%;
									}

									.type {
										color: #333;
									}

									.count {
										transform: scale(1.1);
									}
								}

								.type {
									color: #666;
									font-size: 20rpx; // 减少字体大小
									font-weight: 500;
									transition: all 0.3s ease;
									margin-right: 6rpx; // 减少右边距
									position: relative;

									&::after {
										content: '';
										position: absolute;
										bottom: -2rpx;
										left: 0;
										width: 0;
										height: 2rpx;
										background: currentColor;
										transition: width 0.3s ease;
									}
								}

								.count {
									background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
									color: #fff;
									font-weight: 700;
									font-size: 18rpx; // 减少字体大小
									padding: 3rpx 10rpx; // 减少内边距
									border-radius: 12rpx; // 减少圆角
									min-width: 32rpx; // 减少最小宽度
									text-align: center;
									font-family: "DIN Alternate", "Arial", sans-serif;
									box-shadow: 0 1rpx 6rpx rgba(255, 77, 79, 0.3); // 减少阴影
									transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
									position: relative;

									&::before {
										content: '';
										position: absolute;
										inset: -1rpx; // 减少边框
										border-radius: 14rpx; // 减少圆角
										background: linear-gradient(135deg, #ff4d4f, #ff7875);
										opacity: 0;
										transition: all 0.3s ease;
										z-index: -1;
									}
								}

								&:hover .type::after {
									width: 100%;
								}

								&:hover .count::before {
									opacity: 0.3;
									inset: -4rpx;
								}
							}

							// 无记录提示样式
							.no-records-tip {
								display: flex;
								flex-direction: column;
								align-items: center;
								justify-content: center;
								padding: 40rpx 20rpx;
								margin: 20rpx 0;
								background: linear-gradient(145deg, #fafbfc 0%, #ffffff 100%);
								border-radius: 20rpx;
								border: 2rpx dashed #e1e4e8;
								box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.02);
								position: relative;
								overflow: hidden;

								&::before {
									content: '';
									position: absolute;
									top: 0;
									left: 0;
									right: 0;
									bottom: 0;
									background: radial-gradient(circle at center, rgba(64, 158, 255, 0.02) 0%, transparent 70%);
									pointer-events: none;
								}

								.tip-icon {
									margin-bottom: 16rpx;
									font-size: 48rpx;
									opacity: 0.7;
									animation: float 3s ease-in-out infinite;

									.icon-emoji {
										font-size: 48rpx;
									}
								}

								.tip-text {
									color: #8590a6;
									font-size: 26rpx;
									text-align: center;
									line-height: 1.5;
									font-weight: 400;
								}

								@keyframes float {

									0%,
									100% {
										transform: translateY(0);
									}

									50% {
										transform: translateY(-4rpx);
									}
								}
							}
						}
					}
				}

				@keyframes pulse {
					0% {
						transform: scale(1);
					}

					50% {
						transform: scale(1.05);
					}

					100% {
						transform: scale(1);
					}
				}

				@keyframes shake {

					0%,
					100% {
						transform: translateX(0);
					}

					25% {
						transform: translateX(-2rpx);
					}

					75% {
						transform: translateX(2rpx);
					}
				}

				@keyframes rotate {
					from {
						transform: rotate(0deg);
					}

					to {
						transform: rotate(360deg);
					}
				}

				@keyframes warning {

					0%,
					100% {
						transform: scale(1);
					}

					50% {
						transform: scale(1.1);
					}
				}

				@keyframes shimmer {
					to {
						left: 100%;
					}
				}

				@keyframes shine {
					0% {
						left: -100%;
					}

					20% {
						left: 100%;
					}

					100% {
						left: 100%;
					}
				}

				@keyframes ripple {
					to {
						transform: translate(-50%, -50%) scale(2);
						opacity: 0;
					}
				}

				@keyframes highlight {
					0% {
						transform: scale(1);
					}

					50% {
						transform: scale(1.02);
					}

					100% {
						transform: scale(1);
					}
				}

				@keyframes bounce {

					0%,
					20%,
					50%,
					80%,
					100% {
						transform: translateY(0);
					}

					40% {
						transform: translateY(-8rpx);
					}

					60% {
						transform: translateY(-4rpx);
					}
				}
			}
		}

		// 违规记录详情重新设计的样式
		.owner-details-redesigned {
			margin-bottom: 16rpx;

			.basic-info-section,
			.location-info-section,
			.specialty-section {
				background: rgba(255, 255, 255, 0.9);
				border-radius: 12rpx;
				padding: 12rpx 16rpx;
				margin-bottom: 8rpx;
				box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);

				.info-row {
					display: flex;
					align-items: center;
					padding: 8rpx 0;

					.info-icon {
						font-size: 24rpx;
						margin-right: 12rpx;
						width: 28rpx;
						text-align: center;
					}

					.info-content {
						flex: 1;
						display: flex;
						justify-content: space-between;
						align-items: center;

						.info-label {
							font-size: 20rpx;
							color: #666;
							font-weight: 500;
						}

						.info-value {
							font-size: 22rpx;
							color: #333;
							font-weight: 600;

							&.phone-number {
								color: #52c41a;
								font-family: Monaco, monospace;

								&.clickable-phone {
									background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%);
									padding: 4rpx 8rpx;
									border-radius: 16rpx;
									border: 1px solid #95de64;
									cursor: pointer;

									&::before {
										content: '📞 ';
										font-size: 18rpx;
									}
								}
							}

							&.location-text {
								color: #1890ff;
								font-weight: 500;
							}

							&.monthly-name {
								color: #ff9500;
								font-weight: 500;
							}
						}
					}
				}
			}
		}

		// 时间和状态布局样式
		.time-status-layout {
			margin-top: 12rpx;

			.time-section {
				background: rgba(255, 255, 255, 0.9);
				border-radius: 12rpx;
				padding: 12rpx 16rpx;
				margin-bottom: 8rpx;
				box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);

				.time-row {
					display: flex;
					align-items: center;

					.time-icon {
						font-size: 24rpx;
						margin-right: 12rpx;
						width: 28rpx;
						text-align: center;
					}

					.time-content {
						flex: 1;
						display: flex;
						flex-direction: column;

						.time-label {
							font-size: 20rpx;
							color: #666;
							margin-bottom: 4rpx;
						}

						.time-value {
							font-size: 28rpx;
							color: #1890ff;
							font-weight: 700;
							font-family: Monaco, monospace;
							margin-bottom: 2rpx;
						}

						.time-date {
							font-size: 18rpx;
							color: #999;
						}
					}
				}
			}

			.status-tags-section {
				display: flex;
				gap: 8rpx;
				margin-bottom: 8rpx;

				.status-tag {
					flex: 1;
					display: flex;
					align-items: center;
					justify-content: center;
					padding: 8rpx 12rpx;
					border-radius: 20rpx;
					font-size: 20rpx;

					.status-icon {
						margin-right: 6rpx;
						font-size: 18rpx;
					}

					.status-text {
						font-size: 20rpx;
						font-weight: 500;
					}

					&.violation-tag {
						background: linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%);
						border: 1px solid #ffec3d;
						color: #d46b08;
					}

					&.vehicle-tag {
						&.tag-waiting {
							background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
							border: 1px solid #91d5ff;
							color: #1890ff;
						}

						&.tag-processing {
							background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%);
							border: 1px solid #95de64;
							color: #52c41a;
						}

						&.tag-processed {
							background: linear-gradient(135deg, #f5f5f5 0%, #d9d9d9 100%);
							border: 1px solid #d9d9d9;
							color: #666;
						}

						&.tag-fixed {
							background: linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%);
							border: 1px solid #d3adf7;
							color: #722ed1;
						}

						&.tag-pending {
							background: linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%);
							border: 1px solid #ffc069;
							color: #fa8c16;
							
							.status-icon {
								animation: pulse 1.5s infinite;
							}
						}

						&.tag-rejected {
							background: linear-gradient(135deg, #fff2f0 0%, #ffccc7 100%);
							border: 1px solid #ff7875;
							color: #f5222d;
							
							.status-icon {
								animation: shake 0.5s infinite;
							}
						}
					}

					// 🔧 进场状态标签样式 - 醒目版本
					&.entry-status-tag {
						padding: 12rpx 18rpx !important;
						border-radius: 25rpx !important;
						box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15) !important;
						transform: scale(1.05);
						
						.status-icon {
							font-size: 24rpx !important;
							margin-right: 8rpx !important;
						}
						
						.status-text {
							font-size: 24rpx !important;
							font-weight: 600 !important;
						}

						&.tag-entry-waiting {
							background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%) !important;
							border: 2px solid #ff4500 !important;
							color: #ffffff !important;
							box-shadow: 0 6rpx 20rpx rgba(255, 107, 53, 0.4) !important;
							
							.status-icon {
								animation: pulse 1s infinite;
								filter: drop-shadow(0 2rpx 4rpx rgba(0, 0, 0, 0.3));
							}
						}

						&.tag-entry-in-progress {
							background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%) !important;
							border: 2px solid #096dd9 !important;
							color: #ffffff !important;
							box-shadow: 0 6rpx 20rpx rgba(24, 144, 255, 0.4) !important;
							
							.status-icon {
								animation: float 1.5s ease-in-out infinite;
								filter: drop-shadow(0 2rpx 4rpx rgba(0, 0, 0, 0.3));
							}
						}

						&.tag-entry-completed {
							background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%) !important;
							border: 2px solid #389e0d !important;
							color: #ffffff !important;
							box-shadow: 0 6rpx 20rpx rgba(82, 196, 26, 0.4) !important;
							
							.status-icon {
								filter: drop-shadow(0 2rpx 4rpx rgba(0, 0, 0, 0.3));
							}
						}
					}

					// 🚫 黑名单状态标签样式 - 醒目版本
					&.blacklist-status-tag {
						padding: 12rpx 18rpx !important;
						border-radius: 25rpx !important;
						box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15) !important;
						transform: scale(1.05);
						
						.status-icon {
							font-size: 24rpx !important;
							margin-right: 8rpx !important;
						}
						
						.status-text {
							font-size: 24rpx !important;
							font-weight: 600 !important;
						}

						&.tag-blacklisted {
							background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%) !important;
							border: 3px solid #a93226 !important;
							color: #ffffff !important;
							box-shadow: 0 8rpx 24rpx rgba(231, 76, 60, 0.7) !important;
							font-weight: 800 !important;
							
							.status-icon {
								animation: shake 1.5s infinite ease-in-out;
								filter: drop-shadow(0 2rpx 4rpx rgba(0, 0, 0, 0.3));
							}
						}
					}
				}
			}

			.duration-section,
			.description-section {
				background: rgba(255, 255, 255, 0.9);
				border-radius: 12rpx;
				padding: 8rpx 12rpx; // 减少内边距
				margin-bottom: 6rpx; // 减少底部间距
				box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
				display: flex;
				align-items: center;

				.duration-icon,
				.description-icon {
					font-size: 20rpx;
					margin-right: 8rpx;
				}

				.duration-label,
				.description-label {
					font-size: 20rpx;
					color: #666;
					margin-right: 8rpx;
				}

				.duration-value,
				.description-text {
					font-size: 20rpx;
					color: #333;
					font-weight: 500;
				}
			}
		}
	}
}

.vehicle-timeline {
	margin: 16rpx 0; // 减少上下边距
	padding: 20rpx; // 减少内边距
	background: linear-gradient(145deg, #ffffff 0%, #fafcff 100%);
	border-radius: 24rpx;
	position: relative;
	box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);
	border: 2rpx solid rgba(255, 255, 255, 0.8);
	backdrop-filter: blur(20rpx);
	overflow: hidden;

	// 装饰背景
	&::before {
		content: '';
		position: absolute;
		top: -50%;
		right: -50%;
		width: 200%;
		height: 200%;
		background: conic-gradient(from 0deg, transparent, rgba(24, 144, 255, 0.03), transparent);
		border-radius: 50%;
		animation: rotate 30s linear infinite;
		z-index: 0;
	}

	&>* {
		position: relative;
		z-index: 1;
	}

	// 状态标识样式
	.status-badge {
		display: flex;
		align-items: center;
		padding: 8rpx 16rpx; // 减少内边距
		border-radius: 32rpx;
		font-size: 24rpx; // 减少字体大小
		font-weight: 600;
		gap: 8rpx; // 减少间隙
		width: fit-content;
		box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
		margin-bottom: 16rpx; // 减少底部间距
		transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
		letter-spacing: 0.5px;
		position: relative;
		overflow: hidden;

		// 光效背景
		&::before {
			content: '';
			position: absolute;
			top: 0;
			left: -100%;
			width: 100%;
			height: 100%;
			background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
			transition: 0.5s;
		}

		&:hover::before {
			left: 100%;
		}

		&.not-entered {
			background: linear-gradient(135deg, #ff4d4f, #ff7875);
			color: #fff;
			box-shadow: 0 8rpx 32rpx rgba(255, 77, 79, 0.3);

			&:hover {
				transform: translateY(-2rpx);
				box-shadow: 0 12rpx 40rpx rgba(255, 77, 79, 0.4);
			}
		}

		&.in-progress {
			background: linear-gradient(135deg, #ff6b35, #f7931e);
			color: #fff;
			box-shadow: 0 8rpx 32rpx rgba(255, 107, 53, 0.4);

			&:hover {
				transform: translateY(-2rpx);
				box-shadow: 0 12rpx 40rpx rgba(24, 144, 255, 0.4);
			}
		}

		&.has-left {
			background: linear-gradient(135deg, #00b894, #00a085);
			color: #fff;
			box-shadow: 0 8rpx 32rpx rgba(0, 184, 148, 0.4);

			&:hover {
				transform: translateY(-2rpx);
				box-shadow: 0 12rpx 40rpx rgba(0, 184, 148, 0.5);
			}
		}

		&.has-left-fixed {
			background: linear-gradient(135deg, #722ed1, #9254de);
			color: #fff;
			box-shadow: 0 8rpx 32rpx rgba(114, 46, 209, 0.3);

			&:hover {
				transform: translateY(-2rpx);
				box-shadow: 0 12rpx 40rpx rgba(114, 46, 209, 0.4);
			}
		}

		.u-icon {
			margin-right: 8rpx;
			filter: drop-shadow(0 2rpx 4rpx rgba(0, 0, 0, 0.1));
		}
	}

	// 新的时间线卡片样式
	.timeline-cards {
		margin: 16rpx 0; // 减少上下边距
		display: flex;
		gap: 12rpx; // 减少卡片间隙
		position: relative;

		&.compact {
			margin: 8rpx 0; // 进一步减少紧凑模式的边距
			gap: 8rpx; // 进一步减少紧凑模式的间隙
		}

		// 连接线
		&::before {
			content: '';
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 60rpx;
			height: 4rpx;
			background: linear-gradient(90deg, transparent, #e8e8e8, transparent);
			border-radius: 2rpx;
			z-index: 1;
		}

		.timeline-card {
			flex: 1;
			background: linear-gradient(145deg, #ffffff 0%, #fafcff 100%);
			padding: 16rpx 12rpx; // 减少内边距
			border-radius: 20rpx;
			border: 2rpx solid rgba(255, 255, 255, 0.6);
			box-shadow: 0 6rpx 24rpx rgba(0, 0, 0, 0.06);
			transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
			display: flex;
			align-items: center;
			gap: 12rpx; // 减少内部间隙
			position: relative;
			overflow: hidden;
			backdrop-filter: blur(10rpx);

			// 装饰背景
			&::before {
				content: '';
				position: absolute;
				top: -50%;
				right: -50%;
				width: 200%;
				height: 200%;
				background: conic-gradient(from 0deg, transparent, rgba(255, 255, 255, 0.05), transparent);
				border-radius: 50%;
				animation: rotate 25s linear infinite;
				z-index: 0;
			}

			// 顶部装饰线
			&::after {
				content: '';
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				height: 4rpx;
				border-radius: 20rpx 20rpx 0 0;
				transition: all 0.3s ease;
				z-index: 1;
			}

			.card-icon {
				display: flex;
				align-items: center;
				justify-content: center;
				width: 48rpx; // 减少图标大小
				height: 48rpx; // 减少图标大小
				border-radius: 16rpx;
				background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
				box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.08);
				position: relative;
				z-index: 2;
				transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);

				&::before {
					content: '';
					position: absolute;
					inset: 6rpx;
					border-radius: 10rpx;
					background: inherit;
					opacity: 0.4;
					transition: all 0.4s ease;
				}

				.emoji-icon {
					font-size: 32rpx;
					line-height: 1;
					display: block;
					text-align: center;
					animation: pulse 2.5s infinite;
					filter: drop-shadow(0 2rpx 4rpx rgba(0, 0, 0, 0.1));
				}
			}

			.card-content {
				flex: 1;
				position: relative;
				z-index: 2;

				.card-label {
					font-size: 20rpx; // 减少字体大小
					color: #8c8c8c;
					margin-bottom: 6rpx; // 减少底部间距
					display: block;
					font-weight: 600;
					letter-spacing: 0.5px;
				}

				.card-time {
					display: flex;
					flex-direction: column;
					gap: 4rpx;

					.date-part {
						font-size: 20rpx; // 减少字体大小
						color: #595959;
						font-weight: 500;
						font-family: -apple-system, BlinkMacSystemFont, sans-serif;
					}

					.time-part {
						font-size: 28rpx; // 减少字体大小
						font-weight: 800;
						font-family: "DIN Alternate", "SF Pro Display", "Arial", sans-serif;
						letter-spacing: 0.5px;
						position: relative;
						display: inline-block;
						transition: all 0.3s ease;

						&::after {
							content: '';
							position: absolute;
							bottom: -2rpx;
							left: 0;
							width: 0;
							height: 2rpx;
							border-radius: 1rpx;
							transition: width 0.3s ease;
						}
					}
				}
			}

			// 进场卡片样式
			&.enter-card {
				&::after {
					background: linear-gradient(90deg, #52c41a, #73d13d);
				}

				.card-icon {
					background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%);
					box-shadow: 0 6rpx 20rpx rgba(82, 196, 26, 0.15);
					border: 1rpx solid rgba(82, 196, 26, 0.1);

					&::before {
						background: linear-gradient(135deg, #52c41a, #73d13d);
						opacity: 0.1;
					}

					.emoji-icon {
						color: #52c41a;
						text-shadow: 0 2rpx 4rpx rgba(82, 196, 26, 0.2);
					}
				}

				.card-content {
					.card-label {
						color: #52c41a;
					}

					.card-time .time-part {
						color: #52c41a;
						background: linear-gradient(135deg, #52c41a, #389e0d);
						-webkit-background-clip: text;
						color: transparent;

						&::after {
							background: linear-gradient(90deg, #52c41a, #73d13d);
						}
					}
				}

				&:hover {
					background: linear-gradient(145deg, #f6ffed 0%, #ffffff 100%);
					border-color: rgba(82, 196, 26, 0.2);
					box-shadow: 0 12rpx 36rpx rgba(82, 196, 26, 0.12);

					.card-content .card-time .time-part::after {
						width: 100%;
					}
				}
			}

			// 离场卡片样式
			&.leave-card {
				&::after {
					background: linear-gradient(90deg, #ff7875, #ff4d4f);
				}

				.card-icon {
					background: linear-gradient(135deg, #fff2f0 0%, #ffccc7 100%);
					box-shadow: 0 6rpx 20rpx rgba(255, 77, 79, 0.15);
					border: 1rpx solid rgba(255, 77, 79, 0.1);

					&::before {
						background: linear-gradient(135deg, #ff7875, #ff4d4f);
						opacity: 0.1;
					}

					.emoji-icon {
						color: #ff4d4f;
						text-shadow: 0 2rpx 4rpx rgba(255, 77, 79, 0.2);
					}
				}

				.card-content {
					.card-label {
						color: #ff4d4f;
					}

					.card-time .time-part {
						color: #ff4d4f;
						background: linear-gradient(135deg, #ff7875, #cf1322);
						-webkit-background-clip: text;
						color: transparent;

						&::after {
							background: linear-gradient(90deg, #ff7875, #ff4d4f);
						}
					}
				}

				&:hover {
					background: linear-gradient(145deg, #fff2f0 0%, #ffffff 100%);
					border-color: rgba(255, 77, 79, 0.2);
					box-shadow: 0 12rpx 36rpx rgba(255, 77, 79, 0.12);

					.card-content .card-time .time-part::after {
						width: 100%;
					}
				}
			}

			// 悬停效果
			&:hover {
				transform: translateY(-6rpx) scale(1.02);
				box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.12);

				.card-icon {
					transform: scale(1.1) rotate(3deg);

					&::before {
						inset: 3rpx;
						opacity: 0.2;
					}

					.emoji-icon {
						animation: bounce 0.6s ease-in-out;
					}
				}

				&::before {
					animation-duration: 15s;
				}
			}

			// 点击效果
			&:active {
				transform: translateY(-3rpx) scale(0.98);
				transition: all 0.1s ease;
			}
		}
	}

	.timeline-container {
		margin-top: 20rpx;
		position: relative;

		.timeline-item {
			position: relative;
			padding-left: 40rpx;
			margin-bottom: 30rpx;
			display: flex;
			align-items: flex-start;

			&:last-child {
				margin-bottom: 0;
			}

			.time-dot {
				position: absolute;
				left: 0;
				top: 50%;
				transform: translateY(-50%);
				width: 12rpx;
				height: 12rpx;
				border-radius: 50%;
				z-index: 2;

				&::after {
					content: '';
					position: absolute;
					left: 50%;
					top: 50%;
					transform: translate(-50%, -50%);
					width: 24rpx;
					height: 24rpx;
					border-radius: 50%;
					border: 2rpx solid;
					opacity: 0.2;
					animation: ripple 1.5s infinite;
				}
			}

			&.enter {
				.time-dot {
					background: #52c41a;
					box-shadow: 0 0 10rpx rgba(82, 196, 26, 0.3);

					&::after {
						border-color: #52c41a;
					}
				}

				.time-content {
					border-left: 3rpx solid #52c41a;

					.time-label {
						color: #52c41a;

						&::before {
							content: '⬇️';
							margin-right: 8rpx;
						}
					}

					.time-value {
						.time-part {
							background: rgba(82, 196, 26, 0.1);
							color: #52c41a;
						}
					}
				}
			}

			&.leave {
				.time-dot {
					background: #722ed1;
					box-shadow: 0 0 10rpx rgba(114, 46, 209, 0.3);

					&::after {
						border-color: #722ed1;
					}
				}

				.time-content {
					border-left: 3rpx solid #722ed1;

					.time-label {
						color: #722ed1;

						&::before {
							content: '⬆️';
							margin-right: 8rpx;
						}
					}

					.time-value {
						.time-part {
							background: rgba(114, 46, 209, 0.1);
							color: #722ed1;
						}
					}
				}
			}

			.time-content {
				flex: 1;
				background: #fff;
				padding: 12rpx 16rpx; // 减少内边距
				border-radius: 8rpx;
				box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
				transition: all 0.3s ease;
				position: relative;

				&:hover {
					transform: translateX(4rpx);
					box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
				}

				.time-label {
					font-size: 22rpx; // 减少字体大小
					font-weight: 600;
					margin-bottom: 8rpx; // 减少底部间距
					display: flex;
					align-items: center;
				}

				.time-value {
					display: flex;
					align-items: center;
					font-size: 24rpx; // 减少字体大小
					color: #333;

					.date-part {
						color: #666;
						font-family: "DIN Alternate", "Arial", sans-serif;
						background: #f5f5f5;
						padding: 4rpx 12rpx;
						border-radius: 4rpx;
					}

					.time-part {
						margin-left: 16rpx;
						padding: 4rpx 16rpx;
						border-radius: 6rpx;
						font-family: "DIN Alternate", "Arial", sans-serif;
						font-weight: 600;
						position: relative;
						min-width: 120rpx;
						text-align: center;
					}
				}
			}
		}
	}
}

@keyframes ripple {
	0% {
		transform: translate(-50%, -50%) scale(1);
		opacity: 0.2;
	}

	100% {
		transform: translate(-50%, -50%) scale(1.5);
		opacity: 0;
	}
}

@keyframes shine {
	0% {
		left: -100%;
	}

	50% {
		left: 100%;
	}

	100% {
		left: 100%;
	}
}

/* uView 滑动组件样式优化 */
/deep/ .u-swipe-action-item__right {
	height: 100%;
	display: flex;
	align-items: stretch;
}

/deep/ .u-swipe-action-item__right__button {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0 !important;
	position: relative;
	overflow: hidden;
	flex-direction: column;
	gap: 8rpx;
}

/* 按钮点击效果 */
/deep/ .u-swipe-action-item__right__button:active {
	opacity: 0.8;
	transform: scale(0.98);
}

/* 移除默认图标 */
/deep/ .u-swipe-action-item__right__button::before {
	content: none !important;
	display: none !important;
}

/* 通过按钮样式 */
/deep/ .u-swipe-action-item__right__button:nth-child(1) {
	background-image: linear-gradient(45deg, #19be6b, #52c41a);
}

/* 拒绝按钮样式 */
/deep/ .u-swipe-action-item__right__button:nth-child(2) {
	background-image: linear-gradient(45deg, #ff4d4f, #ff7875);
}

/* ==================== 新增违规记录样式 ==================== */

/* 浮动按钮 */
.add-violation-fab {
	position: fixed;
	right: 30rpx;
	bottom: 200rpx;
	width: 110rpx;
	height: 110rpx;
	background: linear-gradient(135deg, #2979ff, #1565c0);
	border-radius: 60rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 24rpx rgba(41, 121, 255, 0.3);
	z-index: 999;
}

.fab-icon {
	margin-bottom: 4rpx;
}

.fab-text {
	font-size: 20rpx;
	color: #ffffff;
	font-weight: 500;
}

/* 新增违规弹窗 */
.add-violation-modal {
	padding: 40rpx;
	max-height: 80vh;
	overflow-y: auto;
}

.modal-section {
	margin-bottom: 40rpx;
}

.section-title {
	display: flex;
	align-items: center;
	margin-bottom: 20rpx;
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
}

.section-title text {
	margin-left: 12rpx;
}

.input-group {
	background: #f8f9fa;
	border-radius: 12rpx;
	padding: 20rpx;
}

.input-row {
	margin-bottom: 16rpx;
}

.owner-info {
	display: flex;
	justify-content: space-between;
	padding: 16rpx 20rpx;
	background: #e3f2fd;
	border-radius: 8rpx;
	margin-top: 16rpx;
}

.owner-name,
.owner-phone {
	font-size: 28rpx;
	color: #1976d2;
}

/* 违规类型选择 */
.violation-types {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 16rpx;
}

.type-option {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 24rpx 16rpx;
	background: #f5f5f5;
	border-radius: 12rpx;
	border: 2rpx solid transparent;
	transition: all 0.3s ease;
}

.type-option.selected {
	background: #e3f2fd;
	border-color: #2979ff;
}

.type-icon {
	font-size: 40rpx;
	margin-bottom: 8rpx;
}

.type-name {
	font-size: 24rpx;
	color: #666;
	text-align: center;
}

.type-option.selected .type-name {
	color: #2979ff;
	font-weight: 600;
}

.custom-input {
	margin-top: 20rpx;
}

/* 位置输入 */
.location-input {
	background: #f8f9fa;
	border-radius: 12rpx;
	padding: 20rpx;
}

/* 现场取证 */
.evidence-section {
	background: #f8f9fa;
	border-radius: 12rpx;
	padding: 20rpx;
}

.photo-upload {
	margin-bottom: 20rpx;
}

.upload-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 16rpx;
}

.photo-item {
	position: relative;
	width: 160rpx;
	height: 160rpx;
	border-radius: 8rpx;
	overflow: hidden;
}

.photo-item image {
	width: 100%;
	height: 100%;
}

.photo-delete {
	position: absolute;
	top: 8rpx;
	right: 8rpx;
	width: 32rpx;
	height: 32rpx;
	background: rgba(0, 0, 0, 0.6);
	border-radius: 16rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.photo-add {
	width: 160rpx;
	height: 160rpx;
	border: 2rpx dashed #ccc;
	border-radius: 8rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	color: #999;
}

.photo-add text {
	font-size: 24rpx;
	margin-top: 8rpx;
}

.voice-memo {
	border-top: 1rpx solid #eee;
	padding-top: 20rpx;
}

.voice-player {
	display: flex;
	gap: 16rpx;
}

/* 操作按钮 */
.modal-actions {
	display: flex;
	gap: 20rpx;
	margin-top: 40rpx;
}

.modal-actions .u-button {
	flex: 1;
}

/* 车牌扫描弹窗 */
.plate-scan-modal {
	padding: 40rpx;
	text-align: center;
}

.scan-area {
	position: relative;
	margin: 40rpx 0;
}

.scan-frame {
	width: 400rpx;
	height: 200rpx;
	border: 4rpx solid #2979ff;
	border-radius: 12rpx;
	margin: 0 auto;
	position: relative;
	overflow: hidden;
}

.scan-line {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 4rpx;
	background: linear-gradient(90deg, transparent, #2979ff, transparent);
	animation: scan 2s linear infinite;
}

@keyframes scan {
	0% {
		transform: translateY(0);
	}

	100% {
		transform: translateY(196rpx);
	}
}

.scan-tip {
	margin-top: 20rpx;
	font-size: 28rpx;
	color: #666;
}

.scan-result {
	margin: 40rpx 0;
	padding: 30rpx;
	background: #f0f9ff;
	border-radius: 12rpx;
}

.result-title {
	font-size: 28rpx;
	color: #666;
	margin-bottom: 16rpx;
}

.result-plate {
	font-size: 36rpx;
	font-weight: 600;
	color: #2979ff;
	margin-bottom: 20rpx;
}

.result-actions {
	display: flex;
	gap: 16rpx;
}

.scan-actions {
	display: flex;
	gap: 20rpx;
}

.scan-actions .u-button {
	flex: 1;
}

/* === 车主类型样式 === */
.owner-type-badge {
	margin-bottom: 20rpx;
	display: flex;
	justify-content: flex-start;
}

.type-tag {
	display: flex;
	align-items: center;
	padding: 8rpx 16rpx;
	border-radius: 20rpx;
	font-size: 24rpx;
}

.type-tag.type-local {
	background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
	color: white;
}

.type-tag.type-monthly {
	background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
	color: white;
}

.type-tag.type-visitor {
	background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
	color: white;
}

.type-tag.type-temporary {
	background: linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%);
	color: white;
}

.type-tag.type-unknown {
	background: linear-gradient(135deg, #757575 0%, #616161 100%);
	color: white;
}

.type-icon {
	margin-right: 8rpx;
	font-size: 26rpx;
}

.type-text {
	font-weight: bold;
	font-size: 24rpx;
}

/* 月票信息样式 */
.monthly-info {
	background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
	border-radius: 12rpx;
	padding: 20rpx;
	margin-top: 16rpx;
	border-left: 4rpx solid #2196F3;
}

.monthly-info .info-row {
	margin-bottom: 12rpx;
}

.monthly-info .info-row:last-child {
	margin-bottom: 0;
}

.status-indicator {
	display: flex;
	align-items: center;
	padding: 4rpx 12rpx;
	border-radius: 16rpx;
	font-size: 22rpx;
}

.status-indicator.active {
	background: #4CAF50;
	color: white;
}

.status-indicator.inactive {
	background: #F44336;
	color: white;
}

.status-text {
	font-weight: bold;
}

/* 本地车主信息样式 */
.local-owner-info {
	background: linear-gradient(135deg, #E8F5E8 0%, #C8E6C9 100%);
	border-radius: 12rpx;
	padding: 20rpx;
	margin-top: 16rpx;
	border-left: 4rpx solid #4CAF50;
}

.local-owner-info .info-row {
	margin-bottom: 12rpx;
}

.local-owner-info .info-row:last-child {
	margin-bottom: 0;
}

.value.score {
	font-weight: bold;
	padding: 4rpx 12rpx;
	border-radius: 16rpx;
	color: white;
}

.score.score-excellent {
	background: #4CAF50;
}

.score.score-good {
	background: #8BC34A;
}

.score.score-normal {
	background: #FF9800;
}

.score.score-poor {
	background: #F44336;
}

/* 预约车辆信息样式 */
.appointment-badge {
	margin-top: 8rpx;
	padding: 6rpx 12rpx;
	background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
	border-radius: 20rpx;
	display: inline-block;
	box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.3);
	animation: badge-glow 2s ease-in-out infinite alternate;
	
	.badge-text {
		color: #fff;
		font-size: 24rpx;
		font-weight: 600;
		text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.2);
	}
}

@keyframes badge-glow {
	0% {
		box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.3);
	}
	100% {
		box-shadow: 0 6rpx 20rpx rgba(255, 107, 107, 0.5);
	}
}

/* 拉黑原因项目样式 */
.blacklist-reason-item {
	display: flex !important;
	align-items: flex-start !important;
	gap: 8rpx !important;
	margin-bottom: 16rpx;
	line-height: 1.6;
	
	.blacklist-icon {
		color: #4a6cf7;
		font-size: 26rpx;
		font-weight: 500;
		flex-shrink: 0;
	}
	
	.violation-reason {
		color: #c0392b;
		font-size: 26rpx;
		font-weight: 600;
		flex: 1;
	}
}
.visitor-info {
	background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%);
	border-radius: 12rpx;
	padding: 20rpx;
	margin-top: 16rpx;
	border-left: 4rpx solid #FF9800;
	text-align: center;
}

.visitor-tip {
	color: #E65100;
	font-size: 26rpx;
	font-weight: bold;
}

/* 业主信息卡片样式 */
.owner-info-card {
	background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
	border-radius: 20rpx;
	padding: 32rpx;
	margin-bottom: 24rpx;
	border: 1rpx solid rgba(24, 144, 255, 0.1);
	box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);
	position: relative;
	overflow: hidden;
	backdrop-filter: blur(10rpx);
	animation: fadeInScale 0.6s ease-out;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 6rpx;
		background: linear-gradient(90deg, #1890ff, #722ed1, #eb2f96);
		border-radius: 20rpx 20rpx 0 0;
	}

	&::after {
		content: '';
		position: absolute;
		top: -50%;
		right: -30%;
		width: 200rpx;
		height: 200rpx;
		background: radial-gradient(circle, rgba(24, 144, 255, 0.05) 0%, transparent 70%);
		border-radius: 50%;
		z-index: 0;
	}

	&>* {
		position: relative;
		z-index: 1;
	}
}

.owner-header {
	margin-bottom: 20rpx;
}

.owner-type-badge {
	display: flex;
	justify-content: flex-start;
}

.type-tag {
	display: flex;
	align-items: center;
	gap: 10rpx;
	padding: 12rpx 20rpx;
	border-radius: 25rpx;
	font-size: 26rpx;
	font-weight: 600;
	position: relative;
	overflow: hidden;
	backdrop-filter: blur(10rpx);
	transition: all 0.3s ease;

	&::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		padding: 2rpx;
		background: linear-gradient(135deg, transparent, rgba(255, 255, 255, 0.3), transparent);
		mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
		mask-composite: xor;
	}
}

.type-tag.type-local {
	background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
	color: #0c4a6e;
	border: 1rpx solid rgba(14, 165, 233, 0.2);
	box-shadow: 0 4rpx 16rpx rgba(14, 165, 233, 0.1);
	
	&:hover {
		transform: translateY(-2rpx);
		box-shadow: 0 8rpx 24rpx rgba(14, 165, 233, 0.15);
	}
}

.type-tag.type-monthly {
	background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
	color: #14532d;
	border: 1rpx solid rgba(34, 197, 94, 0.2);
	box-shadow: 0 4rpx 16rpx rgba(34, 197, 94, 0.1);
	
	&:hover {
		transform: translateY(-2rpx);
		box-shadow: 0 8rpx 24rpx rgba(34, 197, 94, 0.15);
	}
}

.type-tag.type-visitor {
	background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
	color: #92400e;
	border: 1rpx solid rgba(245, 158, 11, 0.2);
	box-shadow: 0 4rpx 16rpx rgba(245, 158, 11, 0.1);
	
	&:hover {
		transform: translateY(-2rpx);
		box-shadow: 0 8rpx 24rpx rgba(245, 158, 11, 0.15);
	}
}

.type-tag.type-temporary {
	background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
	color: #6a1b9a;
	border: 1rpx solid rgba(156, 39, 176, 0.2);
	box-shadow: 0 4rpx 16rpx rgba(156, 39, 176, 0.1);
	
	&:hover {
		transform: translateY(-2rpx);
		box-shadow: 0 8rpx 24rpx rgba(156, 39, 176, 0.15);
	}
}

.type-tag.type-unknown {
	background: linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%);
	color: #424242;
	border: 1rpx solid rgba(117, 117, 117, 0.2);
	box-shadow: 0 4rpx 16rpx rgba(117, 117, 117, 0.1);
	
	&:hover {
		transform: translateY(-2rpx);
		box-shadow: 0 8rpx 24rpx rgba(117, 117, 117, 0.15);
	}
}

.type-icon {
	font-size: 28rpx;
}

.type-text {
	font-size: 24rpx;
}

.owner-details .info-row {
	display: flex;
	gap: 24rpx;
	margin-bottom: 20rpx;
	animation: slideInUp 0.6s ease-out;
}

.owner-details .info-row:last-child {
	margin-bottom: 0;
}

.info-item {
	flex: 1;
	display: flex;
	align-items: center;
	gap: 12rpx;
	padding: 16rpx 20rpx;
	background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 255, 0.8) 100%);
	border-radius: 16rpx;
	border: 1rpx solid rgba(24, 144, 255, 0.08);
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
	transition: all 0.3s ease;
	position: relative;
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 4rpx;
		height: 100%;
		background: linear-gradient(180deg, #1890ff, #722ed1);
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	&:hover {
		transform: translateY(-2rpx);
		box-shadow: 0 8rpx 24rpx rgba(24, 144, 255, 0.1);
		border-color: rgba(24, 144, 255, 0.15);

		&::before {
			opacity: 1;
		}
	}
}

.info-item.full-width {
	flex: none;
	width: 100%;
}

.info-icon {
	font-size: 32rpx;
	min-width: 32rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 40rpx;
	height: 40rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, rgba(24, 144, 255, 0.1) 0%, rgba(114, 46, 209, 0.1) 100%);
	flex-shrink: 0;
}

.info-label {
	font-size: 26rpx;
	color: #64748b;
	min-width: 80rpx;
	font-weight: 500;
	letter-spacing: 0.5px;
}

.info-value {
	font-size: 26rpx;
	color: #111827;
	font-weight: 500;
	flex: 1;
	
	&.clickable-phone {
		background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
		color: #1890ff;
		padding: 8rpx 16rpx;
		border-radius: 20rpx;
		border: 1rpx solid #91d5ff;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
		font-family: Monaco, monospace;
		letter-spacing: 1px;
		display: inline-flex;
		align-items: center;
		min-width: auto;

		&::before {
			content: '📞';
			margin-right: 8rpx;
			font-size: 24rpx;
		}

		&:hover {
			background: linear-gradient(135deg, #bae7ff 0%, #91d5ff 100%);
			transform: translateY(-1rpx);
			box-shadow: 0 4rpx 12rpx rgba(24, 144, 255, 0.3);
		}

		&:active {
			transform: translateY(0);
			background: linear-gradient(135deg, #91d5ff 0%, #69c0ff 100%);
		}

		/* 响应式设计 */
		@media (max-width: 750rpx) {
			font-size: 22rpx;
			padding: 6rpx 12rpx;
			
			&::before {
				font-size: 20rpx;
				margin-right: 6rpx;
			}
		}
	}
}

.info-value.score {
	padding: 4rpx 12rpx;
	border-radius: 16rpx;
	color: white;
	font-weight: bold;
	min-width: auto;
	text-align: center;
}

.monthly-info, .local-info {
	margin-top: 16rpx;
	padding-top: 16rpx;
	border-top: 1rpx solid #e5e7eb;
}

/* 违规位置信息样式 */
.violation-location {
	background: linear-gradient(135deg, #f0fdf4 0%, #ecfccb 100%);
	border-radius: 16rpx;
	padding: 20rpx;
	margin-bottom: 16rpx;
	border: 1rpx solid #bbf7d0;
	box-shadow: 0 4rpx 12rpx rgba(34, 197, 94, 0.1);
	position: relative;
	overflow: hidden;
}

.violation-location::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	width: 4rpx;
	height: 100%;
	background: linear-gradient(to bottom, #22c55e, #16a34a);
}

.location-header {
	display: flex;
	align-items: center;
	margin-bottom: 12rpx;
	gap: 8rpx;
}

.location-icon {
	font-size: 28rpx;
	padding: 8rpx;
	background: rgba(34, 197, 94, 0.1);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	min-width: 44rpx;
	height: 44rpx;
}

.location-label {
	font-size: 26rpx;
	font-weight: 600;
	color: #15803d;
}

.location-content {
	display: flex;
	justify-content: space-between;
	align-items: center;
	flex-wrap: wrap;
	gap: 12rpx;
}

.location-value {
	font-size: 28rpx;
	color: #166534;
	font-weight: 700;
	padding: 8rpx 16rpx;
	background: rgba(255, 255, 255, 0.8);
	border-radius: 20rpx;
	border: 1rpx solid #bbf7d0;
	flex: 1;
	min-width: 200rpx;
}

.location-badge {
	background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
	color: white;
	padding: 6rpx 16rpx;
	border-radius: 20rpx;
	box-shadow: 0 2rpx 8rpx rgba(239, 68, 68, 0.3);
	animation: pulse 2s infinite;
}

.badge-text {
	font-size: 22rpx;
	font-weight: 600;
}

/* 停车状态和时长优化样式 */
.parking-status {
	background: linear-gradient(135deg, #fff1f0 0%, #ffe7e6 100%);
	border-radius: 16rpx;
	padding: 20rpx;
	margin-bottom: 16rpx;
	border: 1rpx solid #ffccc7;
	box-shadow: 0 4rpx 12rpx rgba(255, 77, 79, 0.1);
	display: flex;
	justify-content: space-between;
	align-items: center;
	flex-wrap: wrap;
	gap: 16rpx;
	position: relative;
	overflow: hidden;
}

.parking-status::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	width: 4rpx;
	height: 100%;
	background: linear-gradient(to bottom, #ff4d4f, #f5222d);
}

.status-section {
	display: flex;
	align-items: center;
	gap: 12rpx;
	background: rgba(255, 255, 255, 0.8);
	padding: 12rpx 20rpx;
	border-radius: 24rpx;
	border: 1rpx solid #ffa39e;
}

.status-icon {
	font-size: 24rpx;
	padding: 8rpx;
	background: rgba(255, 77, 79, 0.1);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	min-width: 40rpx;
	height: 40rpx;
}

.status-text {
	font-size: 26rpx;
	font-weight: 600;
	color: #ad4e4e;
}

.duration-section {
	display: flex;
	align-items: center;
	gap: 12rpx;
	background: rgba(255, 255, 255, 0.8);
	padding: 12rpx 20rpx;
	border-radius: 24rpx;
	border: 1rpx solid #ffa39e;
	flex: 1;
	min-width: 200rpx;
}

.duration-icon {
	font-size: 24rpx;
	padding: 8rpx;
	background: rgba(255, 149, 0, 0.1);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	min-width: 40rpx;
	height: 40rpx;
}

.duration-content {
	display: flex;
	flex-direction: column;
	gap: 4rpx;
	flex: 1;
}

.duration-label {
	font-size: 22rpx;
	color: #8c8c8c;
	font-weight: 500;
}

.duration-text {
	font-size: 28rpx;
	font-weight: 700;
	color: #ad4e4e;
	font-family: "DIN Alternate", monospace;
}

/* 违规照片样式 */
.violation-photos {
	background: linear-gradient(135deg, #fef7ff 0%, #f3e8ff 100%);
	border-radius: 16rpx;
	padding: 20rpx;
	margin-bottom: 16rpx;
	border: 1rpx solid #e9d5ff;
	box-shadow: 0 4rpx 12rpx rgba(124, 58, 237, 0.1);
	position: relative;
	overflow: hidden;
}

.violation-photos::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	width: 4rpx;
	height: 100%;
	background: linear-gradient(to bottom, #9333ea, #7c3aed);
}

.photos-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16rpx;
}

.photos-title-section {
	display: flex;
	align-items: center;
	gap: 10rpx;
}

.photos-icon {
	font-size: 28rpx;
	padding: 8rpx;
	background: rgba(147, 51, 234, 0.1);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	min-width: 44rpx;
	height: 44rpx;
}

.photos-label {
	font-size: 28rpx;
	font-weight: 700;
	color: #7c3aed;
}

.photos-title {
	font-size: 28rpx;
	font-weight: bold;
	color: #7c3aed;
}

.photos-count-badge {
	background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
	color: white;
	padding: 8rpx 16rpx;
	border-radius: 20rpx;
	box-shadow: 0 2rpx 8rpx rgba(168, 85, 247, 0.3);
}

.photos-count {
	font-size: 24rpx;
	font-weight: 600;
}

.photos-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
}

.photo-item {
	width: 140rpx;
	height: 140rpx;
	border-radius: 16rpx;
	overflow: hidden;
	border: 3rpx solid #e9d5ff;
	box-shadow: 0 4rpx 12rpx rgba(124, 58, 237, 0.15);
	position: relative;
	transition: all 0.3s ease;
	cursor: pointer;
}

.photo-item:hover {
	transform: scale(1.05);
	box-shadow: 0 8rpx 24rpx rgba(124, 58, 237, 0.25);
	border-color: #a855f7;
}

.photo-image {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.photo-overlay {
	position: absolute;
	top: 8rpx;
	right: 8rpx;
	background: rgba(0, 0, 0, 0.7);
	color: white;
	width: 32rpx;
	height: 32rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 20rpx;
	font-weight: 600;
	backdrop-filter: blur(4rpx);
}

.photo-index {
	font-size: 18rpx;
	font-weight: 700;
}

/* 违规详情样式 */
.description-row {
	display: flex;
	align-items: flex-start;
	gap: 12rpx;
	padding: 12rpx 16rpx; // 减少内边距
	background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
	border-radius: 12rpx;
	margin-top: 12rpx; // 减少顶部边距
	border-left: 4rpx solid #f59e0b;
}

.description-icon {
	font-size: 28rpx;
	color: #d97706;
	margin-top: 2rpx;
}

.description-label {
	font-size: 26rpx;
	color: #92400e;
	font-weight: 500;
	min-width: 80rpx;
}

.description-text {
	font-size: 26rpx;
	color: #78350f;
	line-height: 1.5;
	flex: 1;
}

/* =============== 日历样式 =============== */

/* 日期范围选择器包装器 */
.date-range-wrapper {
	margin-left: auto;
	display: flex;
	align-items: center;
}

/* 自定义日历触发器样式 */
.custom-calendar-trigger {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 12rpx 24rpx;
	background: #f0fdf4;
	border: 2rpx solid #10b981;
	border-radius: 16rpx;
	min-height: 64rpx;
	box-shadow: 0 2rpx 8rpx rgba(16, 185, 129, 0.1);
	transition: all 0.3s ease;
}

.custom-calendar-trigger:active {
	background: #dcfce7;
	transform: scale(0.98);
}

.calendar-text {
	margin-left: 8rpx;
	font-size: 26rpx;
	color: #10b981;
	font-weight: 500;
}

/* uni-datetime-picker 弹窗样式调整 */
/deep/ .uni-datetime-picker--x {
	z-index: 9999 !important;
	bottom: 0 !important; /* 重置底部位置 */
}

/deep/ .uni-datetime-picker .uni-calendar {
	z-index: 9999 !important;
	/* 移除之前的margin-bottom限制 */
}

/* 日历底部确认按钮区域 - 优化样式 */
/deep/ .uni-date-btn--ok {
	position: relative !important; /* 改为相对定位 */
	margin-bottom: 120rpx !important; /* 为底部导航栏留出空间 */
	padding: 20rpx 40rpx !important;
	background: #fff !important;
	border-top: 1px solid #f0f0f0 !important;
}

/* 日历底部按钮 */
/deep/ .uni-datetime-picker--btn {
	margin: 0 auto !important;
	width: 200rpx !important;
	text-align: center !important;
}

/* 确保弹窗容器完整显示 */
/deep/ .uni-datetime-picker__container {
	/* 移除高度限制，让日历完整显示 */
}

/* 日历弹窗遮罩 */
/deep/ .uni-popper__arrow, /deep/ .uni-popper {
	z-index: 9999 !important;
}

/* 实时违规记录的浅蓝色日历样式 */
.realtime-calendar .custom-calendar-trigger.realtime-trigger {
	background: #e3f2fd !important; /* 浅蓝色背景 */
	border: 2rpx solid #2196f3 !important; /* 蓝色边框 */
	box-shadow: 0 2rpx 8rpx rgba(33, 150, 243, 0.1) !important;
}

.realtime-calendar .custom-calendar-trigger.realtime-trigger:active {
	background: #bbdefb !important; /* 深一点的蓝色背景 */
}

.realtime-calendar .custom-calendar-trigger.realtime-trigger .calendar-text {
	color: #2196f3 !important; /* 蓝色文字 */
}

/* 进出场状态卡片选中样式 */
.stat-card {
	position: relative;
	cursor: pointer;
	transition: all 0.3s ease;
}

.stat-card:active {
	transform: scale(0.98);
}

.stat-card.selected {
	transform: scale(1.02);
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15) !important;
	border: 3rpx solid rgba(255, 255, 255, 0.8) !important;
}

.stat-card.in-progress.selected {
	box-shadow: 0 8rpx 24rpx rgba(33, 150, 243, 0.3) !important;
	border: 3rpx solid #2196f3 !important;
}

.stat-card.has-left.selected {
	box-shadow: 0 8rpx 24rpx rgba(76, 175, 80, 0.3) !important;
	border: 3rpx solid #4caf50 !important;
}

// 🔧 新增：拉黑卡片选中状态
.stat-card.blacklisted.selected {
	box-shadow: 0 8rpx 24rpx rgba(245, 34, 45, 0.3) !important;
	border: 3rpx solid #f5222d !important;
}

.stat-card.non-blacklisted.selected {
	box-shadow: 0 8rpx 24rpx rgba(19, 194, 194, 0.3) !important;
	border: 3rpx solid #13c2c2 !important;
}

/* 选中状态指示器 */
.selection-indicator {
	position: absolute;
	top: 16rpx;
	right: 16rpx;
	width: 36rpx;
	height: 36rpx;
	background: rgba(255, 255, 255, 0.95);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	animation: bounceIn 0.3s ease-out;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
}

/* 不同状态的指示器图标颜色 */
.stat-card.in-progress .selection-indicator .u-icon {
	color: #2196f3 !important;
}

.stat-card.has-left .selection-indicator .u-icon {
	color: #4caf50 !important;
}

// 🔧 新增：拉黑卡片选中指示器图标颜色
.stat-card.blacklisted .selection-indicator .u-icon {
	color: #f5222d !important;
}

.stat-card.non-blacklisted .selection-indicator .u-icon {
	color: #13c2c2 !important;
}

@keyframes bounceIn {
	0% {
		transform: scale(0);
		opacity: 0;
	}
	50% {
		transform: scale(1.2);
		opacity: 0.8;
	}
	100% {
		transform: scale(1);
		opacity: 1;
	}
}

/* =============== 动画效果 =============== */
@keyframes slideInUp {
	from {
		opacity: 0;
		transform: translateY(20rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

@keyframes fadeInScale {
	from {
		opacity: 0;
		transform: scale(0.95);
	}
	to {
		opacity: 1;
		transform: scale(1);
	}
}

@keyframes pulse {
	0%, 100% {
		transform: scale(1);
	}
	50% {
		transform: scale(1.05);
	}
}

@keyframes shake {
	0%, 100% {
		transform: translateX(0);
	}
	
	25% {
		transform: translateX(-2rpx);
	}
	
	75% {
		transform: translateX(2rpx);
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

@keyframes rotate {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}

// 🚫 黑名单脉冲动画
@keyframes pulse {
	0% {
		opacity: 1;
	}
	50% {
		opacity: 0.7;
	}
	100% {
		opacity: 1;
	}
}

// 新的违规记录详细信息样式 - 按用户要求的格式设计
.detail-content {
	// 顶部状态条
	.status-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 24rpx;
		background: linear-gradient(135deg, #4fc3f7 0%, #29b6f6 100%);
		border-radius: 16rpx 16rpx 0 0;
		margin: 0 -32rpx 0 -32rpx;

		.status-left, .status-right {
			.blacklist-status {
				color: #fff;
				font-size: 32rpx;
				font-weight: 800;
				text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.3);
				background: linear-gradient(135deg, #ff3300, #ff6600);
				padding: 8rpx 16rpx;
				border-radius: 16rpx;
				border: 2px solid #ff0000;
				box-shadow: 0 4rpx 12rpx rgba(255, 51, 0, 0.7);
				animation: pulse-danger 2s infinite;
			}
			
			.parking-status {
				color: #fff;
				font-size: 30rpx;
				font-weight: 700;
				text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
				background: linear-gradient(135deg, #ff6b35, #ff8c42);
				padding: 6rpx 14rpx;
				border-radius: 14rpx;
				border: 2px solid #e55a2b;
				box-shadow: 0 4rpx 12rpx rgba(255, 107, 53, 0.8);
				animation: pulse-warning 2s infinite;
			}
			
			// 未离场状态 - 浅橙色柔和（避免与红色拉黑状态冲突）
			.parking-status.status-not-left {
				background: linear-gradient(135deg, #ffcc80, #ffab91);
				border: 2px solid #ff8a65;
				box-shadow: 0 4rpx 16rpx rgba(255, 171, 145, 0.6);
				animation: pulse-warning-orange 2s infinite;
			}
			
			// 已离场状态 - 浅绿色柔和
			.parking-status.status-left {
				background: linear-gradient(135deg, #a5d6a7, #c8e6c9);
				border: 2px solid #81c784;
				box-shadow: 0 4rpx 16rpx rgba(200, 230, 201, 0.6);
				animation: pulse-success 2s infinite;
			}
			
			// 待进场状态 - 浅紫色柔和
			.parking-status.status-waiting {
				background: linear-gradient(135deg, #ce93d8, #e1bee7);
				border: 2px solid #ba68c8;
				box-shadow: 0 4rpx 16rpx rgba(225, 190, 231, 0.6);
				animation: pulse-info-purple 2s infinite;
			}
		}
	}

	// 分隔线
	.divider-line {
		text-align: center;
		padding: 16rpx 0;
		background: #fafbfc;
		margin: 0 -32rpx;

		.divider-text {
			color: #8c9db5;
			font-size: 20rpx;
			letter-spacing: 2rpx;
			opacity: 0.8;
		}
	}

	// 车主类型标识
	.owner-type-header {
		padding: 20rpx 24rpx 16rpx;
		background: #fafbfc;
		margin: 0 -32rpx;

		.type-label {
			color: #2c3e50;
			font-size: 32rpx;
			font-weight: 700;
			display: flex;
			align-items: center;
		}
	}

	// 信息段落通用样式
	.info-section {
		margin-bottom: 32rpx;
		background: #fff;
		border-radius: 16rpx;
		padding: 24rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
		border: 1px solid #f0f3f7;

		// 段落标题
		.section-title {
			margin-bottom: 20rpx;
			border-bottom: 2rpx solid #e8f4ff;
			padding-bottom: 12rpx;

			.title-text {
				color: #1a365d;
				font-size: 30rpx;
				font-weight: 600;
				letter-spacing: 1rpx;
			}
		}

		// 段落内容
		.section-content {
			.info-item {
				display: flex;
				align-items: flex-start;
				margin-bottom: 16rpx;
				line-height: 1.6;

				&:last-child {
					margin-bottom: 0;
				}

				.info-prefix {
					color: #4a6cf7;
					font-size: 26rpx;
					min-width: 140rpx;
					font-weight: 500;
				}

				.info-value {
					flex: 1;
					color: #2d3748;
					font-size: 26rpx;
					word-break: break-all;

					&.clickable {
						color: #4299e1;
						text-decoration: underline;
						cursor: pointer;
					}

					&.clickable-phone {
						color: #38a169;
						font-weight: 600;
						text-decoration: underline;
						cursor: pointer;
					}

					&.location-highlight {
						color: #c0392b;
						font-weight: 700;
						background: linear-gradient(120deg, #e74c3c 0%, #c0392b 100%);
						background-clip: text;
						-webkit-background-clip: text;
						-webkit-text-fill-color: transparent;
					}

					&.photo-count {
						color: #805ad5;
						font-weight: 600;
					}

					&.violation-reason {
						color: #e53e3e;
						font-weight: 600;
						background: #fed7d7;
						padding: 8rpx 16rpx;
						border-radius: 8rpx;
						display: inline-block;
					}
				}
			}
		}
	}

	// 停车时间轴特殊样式
	.timeline-container {
		background: linear-gradient(135deg, #f8faff 0%, #e8f4ff 100%);
		border-radius: 16rpx;
		padding: 24rpx;
		border: 2rpx solid #d6f0ff;

		.timeline-item {
			display: flex;
			align-items: center;
			margin-bottom: 12rpx;

			&:last-child {
				margin-bottom: 0;
			}

			.timeline-icon {
				font-size: 24rpx;
				margin-right: 16rpx;
				width: 40rpx;
				text-align: center;
			}

			.timeline-branch {
				color: #a0aec0;
				font-size: 24rpx;
				margin-right: 8rpx;
				font-family: monospace;
			}

			.timeline-label {
				color: #4a5568;
				font-size: 26rpx;
				font-weight: 500;
				min-width: 120rpx;
			}

			.timeline-value {
				color: #2d3748;
				font-size: 26rpx;
				font-weight: 600;

				&.duration-highlight {
					color: #d69e2e;
					background: #faf2cc;
					padding: 4rpx 12rpx;
					border-radius: 8rpx;
					font-weight: 700;
				}

				&.not-left {
					color: #e53e3e;
					font-weight: 700;
				}
			}
		}

		.timeline-connector {
			display: flex;
			justify-content: flex-start;
			padding-left: 20rpx;

			.connector-line {
				color: #a0aec0;
				font-size: 24rpx;
				font-family: monospace;
				margin-bottom: 4rpx;
			}
		}
	}

	// 照片相关样式
	.photos-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 12rpx;
		margin-top: 16rpx;

		.photo-item {
			width: 120rpx;
			height: 120rpx;
			border-radius: 12rpx;
			overflow: hidden;
			border: 2rpx solid #e2e8f0;
			box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);

			.photo-image {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}
		}
	}

	.photo-placeholder {
		margin-top: 16rpx;
		padding: 40rpx;
		background: #f7fafc;
		border: 2rpx dashed #cbd5e0;
		border-radius: 12rpx;
		text-align: center;

		.placeholder-text {
			color: #a0aec0;
			font-size: 28rpx;
			font-style: italic;
		}
	}
}

// ✨ 新增动画效果
@keyframes pulse-danger {
	0% {
		transform: scale(1);
		box-shadow: 0 4rpx 16rpx rgba(231, 76, 60, 0.6);
	}
	50% {
		transform: scale(1.05);
		box-shadow: 0 6rpx 24rpx rgba(231, 76, 60, 0.8);
	}
	100% {
		transform: scale(1);
		box-shadow: 0 4rpx 16rpx rgba(231, 76, 60, 0.6);
	}
}

@keyframes pulse-warning {
	0% {
		box-shadow: 0 4rpx 12rpx rgba(231, 76, 60, 0.4);
		transform: scale(1);
	}
	50% {
		box-shadow: 0 6rpx 20rpx rgba(231, 76, 60, 0.7);
		transform: scale(1.02);
	}
	100% {
		box-shadow: 0 4rpx 12rpx rgba(231, 76, 60, 0.4);
		transform: scale(1);
	}
}

@keyframes shake {
	0%, 100% { transform: translateX(0); }
	10%, 30%, 50%, 70%, 90% { transform: translateX(-2rpx); }
	20%, 40%, 60%, 80% { transform: translateX(2rpx); }
}

// ✨ 新增车辆进出场状态动画效果（浅色柔和版）
@keyframes pulse-warning-orange {
	0% {
		transform: scale(1);
		box-shadow: 0 4rpx 16rpx rgba(255, 171, 145, 0.4);
	}
	50% {
		transform: scale(1.05);
		box-shadow: 0 6rpx 24rpx rgba(255, 171, 145, 0.6);
	}
	100% {
		transform: scale(1);
		box-shadow: 0 4rpx 16rpx rgba(255, 171, 145, 0.4);
	}
}

@keyframes pulse-success {
	0% {
		transform: scale(1);
		box-shadow: 0 4rpx 16rpx rgba(200, 230, 201, 0.4);
	}
	50% {
		transform: scale(1.05);
		box-shadow: 0 6rpx 24rpx rgba(200, 230, 201, 0.6);
	}
	100% {
		transform: scale(1);
		box-shadow: 0 4rpx 16rpx rgba(200, 230, 201, 0.4);
	}
}

@keyframes pulse-info-purple {
	0% {
		transform: scale(1);
		box-shadow: 0 4rpx 16rpx rgba(225, 190, 231, 0.4);
	}
	50% {
		transform: scale(1.05);
		box-shadow: 0 6rpx 24rpx rgba(225, 190, 231, 0.6);
	}
	100% {
		transform: scale(1);
		box-shadow: 0 4rpx 16rpx rgba(225, 190, 231, 0.4);
	}
}

// 🏠 管家小区信息面板样式
.community-info-panel {
	margin: 20rpx 30rpx 0 30rpx;
	background: linear-gradient(135deg, #e8f5e8 0%, #f0f9ff 100%);
	border: 2rpx solid #d1fae5;
	border-radius: 16rpx;
	box-shadow: 0 4rpx 12rpx rgba(16, 185, 129, 0.1);
}

.community-info-content {
	display: flex;
	align-items: center;
	padding: 24rpx 30rpx;
	
	.icon-emoji {
		font-size: 32rpx;
		margin-right: 16rpx;
	}
	
	.community-name {
		flex: 1;
		font-size: 30rpx;
		font-weight: 600;
		color: #065f46;
		margin-right: 20rpx;
	}
	
	.info-tip {
		font-size: 24rpx;
		color: #059669;
		background: rgba(16, 185, 129, 0.1);
		padding: 8rpx 16rpx;
		border-radius: 20rpx;
		border: 1rpx solid rgba(16, 185, 129, 0.2);
	}
}


</style>																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																														