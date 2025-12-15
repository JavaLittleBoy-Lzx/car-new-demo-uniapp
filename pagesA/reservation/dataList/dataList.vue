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
				<view class="navbar-title">查询结果</view>
			</view>
		</view>

		<view class="container" :style="{ paddingTop: (statusBarHeight + 88) + 'px' }">
			<!-- 功能界面 -->
			<view class="functional-section">
				<!-- 内容区域 -->
				<view class="function-header">
					<!-- 智能搜索区域 -->
					<view class="intelligent-search-section">
						<view class="search-header">
							<view class="search-header-left">
								<view class="back-button" @click="navigateBack">
									<text class="back-icon">←</text>
								</view>
								<text class="search-title">🔍 智能搜索</text>
							</view>
							<view class="search-stats">
								<text class="search-count">{{ (reservationList || []).length }} 条结果</text>
							</view>
						</view>

						<!-- 主搜索框 -->
						<view class="smart-search-container">
							<view class="search-input-wrapper">
								<input class="search-input" v-model="searchKeyword" placeholder="输入车牌号/姓名/手机号/地址..."
									@input="handleSearchInput" @focus="handleSearchFocus" @blur="handleSearchBlur"
									@confirm="handleSearchConfirm" :focus="searchInputFocus" adjust-position="true"
									cursor-spacing="10" hold-keyboard="true" confirm-type="search" />
								<view class="search-actions">
									<view class="voice-search" @click="startVoiceSearch" v-if="!searchKeyword">
										<text class="icon-emoji" style="color: #409EFF">🎤</text>
									</view>
									<view class="clear-search" @click="clearSearch" v-if="searchKeyword">
										<text class="icon-emoji" style="color: #C0C4CC">✕</text>
									</view>
									<view class="search-button" @click="handleSearchConfirm">
										<text class="icon-emoji" style="color: #FFFFFF">🔍</text>
									</view>
								</view>
							</view>

							<!-- 搜索建议下拉框 -->
							<view class="search-suggestions" v-if="showSuggestions"
								:style="{ transform: 'translateY(' + (keyboardHeight > 0 ? '-' + (keyboardHeight - 100) + 'px' : '0') + ')' }">
								<scroll-view scroll-y class="suggestions-scroll"
									v-if="searchSuggestions && searchSuggestions.length > 0"
									:scroll-top="suggestionScrollTop" :enable-back-to-top="false" :show-scrollbar="true"
									:enhanced="true" :bounces="true" :fast-deceleration="false">
									<view class="suggestion-item" v-for="(suggestion, index) in searchSuggestions"
										:key="index" @click="selectSuggestionByIndex(index)"
										@touchstart="handleTouchStart" @touchend="handleTouchEnd">
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
								<view class="no-suggestions"
									v-if="!searchSuggestions || searchSuggestions.length === 0">
									<view class="no-suggestions-content">
										<text class="icon-emoji" style="color: #909399; margin-right: 8rpx">🔍</text>
										<text class="no-suggestions-text">没有找到匹配的建议</text>
									</view>
									<view class="no-suggestions-tip">
										<text class="tip-text">可以尝试输入车牌号、姓名、手机号或地址</text>
									</view>
								</view>

								<view class="suggestions-footer"
									v-if="searchSuggestions && searchSuggestions.length > 0">
									<text class="footer-text">找到 {{ (searchSuggestions || []).length }} 个匹配项</text>
								</view>
							</view>

							<!-- 搜索历史 -->
							<view class="search-history"
								v-if="showSearchHistory && searchHistory && searchHistory.length > 0 && !searchKeyword">
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
											<text class="icon-emoji"
												style="color: #909399; margin-right: 6rpx">🗑️</text>
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
										<text class="history-text">{{ (item && item.keyword) ? item.keyword : '未知'
										}}</text>
										<view class="history-time">{{ formatHistoryTime(item && item.time ? item.time :
											Date.now()) }}</view>
										<view class="history-delete" @click.stop="removeSearchHistory(index)">
											<text class="icon-emoji" style="color: #999">✕</text>
										</view>
									</view>
								</view>
								<!-- 收起状态下的预览 -->
								<view class="history-preview" v-if="!searchHistoryExpanded && searchHistory.length > 0">
									<view class="preview-tags">
										<view class="preview-tag" v-for="(item, index) in previewSearchHistory"
											:key="index" @click="useHistorySearch(item)" v-if="item && item.keyword">
											<text>{{ item.keyword }}</text>
										</view>
										<view class="preview-more" v-if="searchHistory.length > 3">
											<text>...</text>
										</view>
									</view>
								</view>
							</view>
						</view>
					</view>


				</view>

				<!-- 可滚动内容区域 -->
				<scroll-view scroll-y class="function-content" :style="{ paddingBottom: '120rpx' }">
					<!-- 今日数据看板 -->
					<view class="today-dashboard">
						<view class="dashboard-header">
							<view class="dashboard-title">
								<text class="icon-emoji" style="color: #409EFF; margin-right: 12rpx">📊</text>
								<text>今日数据看板</text>
							</view>
							<view class="dashboard-toggle" @click="showDashboard = !showDashboard">
								<text class="icon-emoji" style="color: #909399">{{ showDashboard ? '⬆️' : '⬇️' }}</text>
							</view>
						</view>

						<view class="dashboard-content" v-if="showDashboard">
							<!-- 实时统计 -->
							<view class="stats-section">
								<view class="section-title">📊 实时统计</view>
								<view class="stats-grid">
									<view class="stat-item clickable-stat" @click="filterByToday"
										:class="{ 'active': currentStatFilter === 'today' }">
										<text class="stat-value">{{ getTodayCount() }}</text>
										<text class="stat-label">今日新增</text>
										<text class="stat-trend" v-if="getTodayTrend()"
											:class="(getTodayTrend() && getTodayTrend().startsWith('+')) ? 'trend-up' : ((getTodayTrend() && getTodayTrend().startsWith('-')) ? 'trend-down' : 'trend-stable')">
											{{ getTodayTrend() }}
										</text>
										<view class="click-indicator">
											<text class="icon-emoji">👆</text>
										</view>
									</view>
									<view class="stat-item clickable-stat" @click="filterByNotEntered"
										:class="{ 'active': currentStatFilter === 'notEntered' }">
										<text class="stat-value">{{ getNotEnteredCount() }}</text>
										<text class="stat-label">未入场</text>
										<text class="stat-urgent">{{ getTodayNotEnteredCount() }}个今日</text>
										<view class="click-indicator">
											<text class="icon-emoji">👆</text>
										</view>
									</view>
									<view class="stat-item clickable-stat" @click="filterByInParking"
										:class="{ 'active': currentStatFilter === 'inParking' }">
										<text class="stat-value">{{ getInParkingCount() }}</text>
										<text class="stat-label">在场</text>
										<text class="stat-vehicle">{{ getExitedTodayCount() }}辆今日离场</text>
										<view class="click-indicator">
											<text class="icon-emoji">👆</text>
										</view>
									</view>
								</view>
							</view>

							<!-- 处理效率 -->
							<view class="efficiency-section">
								<view class="section-title">📈 处理效率</view>
								<view class="efficiency-content">
									<view class="progress-item">
										<text class="progress-label">通过率</text>
										<view class="progress-bar">
											<view class="progress-fill" :style="{ width: getApprovalRate() + '%' }">
											</view>
										</view>
										<text class="progress-percent">{{ getApprovalRate() }}%</text>
									</view>
									<view class="efficiency-stats">
										<text class="efficiency-stat">入场率: {{ getEntryRate() }}%</text>
										<text class="efficiency-stat">在场车辆: {{ getInParkingCount() }}辆</text>
									</view>
								</view>
							</view>
						</view>
					</view>

					<!-- 智能筛选器 -->
					<view class="smart-filter">
						<view class="filter-header">
							<view class="filter-title">
								<text class="icon-emoji" style="color: #409EFF; margin-right: 12rpx">🔽</text>
								<text>智能筛选</text>
							</view>
							<view class="filter-toggle" @click="showSmartFilter = !showSmartFilter">
								<text class="icon-emoji" style="color: #909399">{{ showSmartFilter ? '⬆️' : '⬇️'
								}}</text>
							</view>
						</view>

						<view class="filter-content" v-if="showSmartFilter">
							<!-- 时间范围筛选 -->
							<view class="filter-section">
								<view class="filter-section-title">⏰ 时间范围</view>
								<view class="time-filter-tags">
									<view class="time-tag" v-for="(timeOption, index) in timeFilterOptions" :key="index"
										:class="{ 'active': selectedTimeFilter === timeOption.key }"
										:data-key="timeOption.key" @click="selectTimeFilter(timeOption.key)">
										<text class="tag-text">{{ timeOption.name }}</text>
										<text class="tag-count" v-if="timeOption.count !== undefined">{{
											timeOption.count }}</text>
									</view>
								</view>
							</view>

							<!-- 审批状态筛选 -->
							<view class="filter-section">
								<view class="filter-section-title">📋 审批状态</view>
								<view class="status-filter-tags">
									<view class="status-tag" v-for="(statusOption, index) in statusFilterOptions"
										:key="index" :class="{ 'active': selectedStatusFilter === statusOption.key }"
										:data-key="statusOption.key" @click="selectStatusFilter(statusOption.key)">
										<text class="tag-emoji">{{ statusOption.emoji }}</text>
										<text class="tag-text">{{ statusOption.name }}</text>
										<text class="tag-count">{{ statusOption.count }}</text>
									</view>
								</view>
							</view>

							<!-- 车辆状态筛选 -->
							<view class="filter-section">
								<view class="filter-section-title">🚗 车辆状态</view>
								<view class="vehicle-filter-tags">
									<view class="vehicle-tag" v-for="(vehicleOption, index) in vehicleFilterOptions"
										:key="index" :class="{ 'active': selectedVehicleFilter === vehicleOption.key }"
										:data-key="vehicleOption.key" @click="selectVehicleFilter(vehicleOption.key)">
										<text class="tag-emoji">{{ vehicleOption.emoji }}</text>
										<text class="tag-text">{{ vehicleOption.name }}</text>
										<text class="tag-count">{{ vehicleOption.count }}</text>
									</view>
								</view>
							</view>

							<!-- 筛选操作 -->
							<view class="filter-actions">
								<view class="reset-filter" @click="resetAllFilters">
									<text class="icon-emoji" style="color: #909399; margin-right: 8rpx">🔄</text>
									<text>重置筛选</text>
								</view>
								<view class="apply-filter" @click="applyFilters">
									<text class="icon-emoji" style="color: #FFFFFF; margin-right: 8rpx">✅</text>
									<text>应用筛选</text>
								</view>
							</view>
						</view>
					</view>

					<!-- 数据列表 -->
					<view class="data-list-container" v-if="reservationList && reservationList.length > 0">
						<!-- 列表控制区域 -->
						<view class="list-control-header">
							<view class="list-title">
								<text class="icon-emoji" style="color: #409EFF; margin-right: 12rpx">📋</text>
								<text>预约记录</text>
								<text class="list-count">({{ filteredReservationList.length }}条)</text>
							</view>
							<view class="list-actions">
								<view class="action-btn" @click="expandAllItems">
									<text class="icon-emoji" style="color: #67C23A; margin-right: 6rpx">📖</text>
									<text>全部展开</text>
								</view>
								<view class="action-btn" @click="collapseAllItems">
									<text class="icon-emoji" style="color: #909399; margin-right: 6rpx">📕</text>
									<text>全部收起</text>
								</view>
							</view>
						</view>

						<!-- 🆕 数据来源Tab切换 -->
						<view class="source-tabs">
							<view class="tab-item" :class="{ 'active': dataSourceTab === 'all' }"
								@click="switchDataSourceTab('all')">
								<text class="tab-text">全部</text>
								<text class="tab-count">({{ reservationList.length }})</text>
							</view>
							<view class="tab-item" :class="{ 'active': dataSourceTab === 'miniprogram' }"
								@click="switchDataSourceTab('miniprogram')">
								<text class="tab-icon">📱</text>
								<text class="tab-text">小程序</text>
								<text class="tab-count">({{ miniprogramCount }})</text>
							</view>
							<view class="tab-item" :class="{ 'active': dataSourceTab === 'backend' }"
								@click="switchDataSourceTab('backend')">
								<text class="tab-icon">🖥️</text>
								<text class="tab-text">后台录入</text>
								<text class="tab-count">({{ backendCount }})</text>
							</view>
						</view>

						<view class="list-item" v-for="(item, index) in filteredReservationList" :key="index">
							<u-card :border="false" margin="50rpx 0" :body-style="{ padding: '48rpx 32rpx' }"
								box-shadow="0 2rpx 8rpx rgba(0,0,0,0.06)"
								:custom-style="{ borderRadius: '12rpx', position: 'relative', overflow: 'hidden' }">
								<view class="card-body">
									<!-- 紧凑单行布局：时间 + 车牌 + 数据来源 + 车辆状态 + 操作按钮 -->
									<view class="compact-row">
										<!-- 车牌号码 -->
										<view class="plate-number"
											:class="item.plateNumber && item.plateNumber.length === 8 ? 'green-plate' : 'blue-plate'">
											<text class="plate-text">{{ item.plateNumber || '未知车牌' }}</text>
										</view>

										<!-- 数据来源标签 -->
										<view class="data-source-badge"
											v-if="item.dataSource === 'backend' || item.appointType === '后台录入'"
											:class="'source-backend'">
											<text class="source-icon">🖥️</text>
											<text class="source-text">后台</text>
										</view>
										<!-- 车辆状态 - 只显示车辆状态，不显示"已通过" -->
										<view class="vehicle-status-compact"
											v-if="item.status === '已通过' && item.vehicleStatus" :class="{
												'status-entered': item.vehicleStatus === '已进场' || item.vehicleStatus === '已入场',
												'status-exited': item.vehicleStatus === '已离场' || item.vehicleStatus === '已出场',
												'status-pending': item.vehicleStatus === '未进场' || item.vehicleStatus === '待进场' || item.vehicleStatus === '待入场' || item.vehicleStatus === '未入场',
												'status-blacklisted': item.vehicleStatus === '已拉黑',
												'status-expired': item.vehicleStatus === '已过期'
											}">
											<text class="status-text">{{ item.vehicleStatus || '待进场' }}</text>
										</view>

										<!-- 审核状态 - 非已通过状态显示 -->
										<view class="audit-status-compact" v-else :class="{
											'status-success': statusType(item.status) === 'success',
											'status-warning': statusType(item.status) === 'warning',
											'status-pending': statusType(item.status) === 'pending',
											'status-no-audit': statusType(item.status) === 'no-audit',
											'status-error': statusType(item.status) === 'error',
											'status-info': statusType(item.status) === 'info'
										}">
											<text class="status-text">{{ item.status }}</text>
										</view>

										<!-- 操作按钮 -->
										<view class="actions-compact">
											<view class="copy-btn" @click="copyPlateNumber(item.plateNumber)">
												<text class="action-icon copy-icon">📋</text>
											</view>
											<view class="collapse-btn" @click="toggleItemCollapse(index)">
												<text class="action-icon expand-icon">{{ isItemCollapsed(index) ? '⬇️' :
													'⬆️' }}</text>
											</view>
										</view>
									</view>

									<!-- 详细信息区域 - 可折叠 -->
									<view class="detail-info-section" v-if="!isItemCollapsed(index)">

										<!-- 🆕 后台录入数据专用显示模板 -->
										<view class="backend-detail-card"
											v-if="item.dataSource === 'backend' || item.appointType === '后台录入'">
											<!-- 进场时间/放行时间 -->
											<view class="info-row" v-if="item.entryTime">
												<view class="info-label">
													<text class="icon-emoji"
														style="color: #67C23A; margin-right: 8rpx">🚗</text>
													<text class="label-text" v-if="item.isManualRelease">放行时间：</text>
													<text class="label-text" v-else>进场时间：</text>
												</view>
												<text class="info-value" v-if="item.isManualRelease">{{ item.releaseTime
													|| '手动放行' }}</text>
												<text class="info-value" v-else>{{ item.entryTime }}</text>
											</view>

											<!-- 预约时间 -->
											<view class="info-row">
												<view class="info-label">
													<text class="icon-emoji"
														style="color: #409EFF; margin-right: 8rpx">⏰</text>
													<text class="label-text">预约时间：</text>
												</view>
												<text class="info-value">{{ formatTime(item.appointmentTime ||
													item.time) }}</text>
											</view>

											<!-- 通知人 -->
											<view class="info-row" v-if="item.notifierName">
												<view class="info-label">
													<text class="icon-emoji"
														style="color: #E6A23C; margin-right: 8rpx">👤</text>
													<text class="label-text">通知人：</text>
												</view>
												<text class="info-value">{{ item.notifierName }}</text>
											</view>

											<!-- 商户/业主名称 -->
											<view class="info-row" v-if="item.ownerName">
												<view class="info-label">
													<text class="icon-emoji"
														style="color: #909399; margin-right: 8rpx">🏢</text>
													<text class="label-text">商户名称：</text>
												</view>
												<text class="info-value">{{ item.ownerName }}</text>
											</view>

											<!-- 备注 -->
											<view class="info-row" v-if="item.remark">
												<view class="info-label">
													<text class="icon-emoji"
														style="color: #909399; margin-right: 8rpx">📝</text>
													<text class="label-text">备注：</text>
												</view>
												<text class="info-value remark-text">{{ item.remark }}</text>
											</view>

											<!-- 放行原因 -->
											<view class="info-row" v-if="item.visitReason">
												<view class="info-label">
													<text class="icon-emoji"
														style="color: #409EFF; margin-right: 8rpx">📋</text>
													<text class="label-text">放行原因：</text>
												</view>
												<text class="info-value">{{ item.visitReason }}</text>
											</view>
										</view>

										<!-- 小程序预约数据显示模板（原有模板） -->
										<template v-else>
											<!-- 等待时间显示 - 仅对待入场车辆显示在右上角 -->
											<view class="waiting-time-badge"
												v-if="item.status === '已通过' && (item.vehicleStatus === '未进场' || item.vehicleStatus === '待进场' || item.vehicleStatus === '待入场' || item.vehicleStatus === '未入场' || !item.vehicleStatus)">
												<text class="waiting-time-icon">⏳</text>
												<text class="waiting-time-text">{{ getWaitingTime(item.time) }}</text>
											</view>

											<!-- 预约时间信息卡片 -->
											<view class="appointment-time-card">
												<view class="info-row">
													<view class="info-label">
														<text class="icon-emoji"
															style="color: #409EFF; margin-right: 8rpx">⏰</text>
														<text class="label-text">预约时间：</text>
													</view>
													<text class="info-value appointment-time">{{ formatTime(item.time)
													}}</text>
												</view>
											</view>
											<!-- 停车位置信息 - 仅在已通过状态下显示 -->
											<view class="parking-info-card"
												v-if="item.status === '已通过' && item.parkingLocation">
												<view class="info-row">
													<view class="info-label">
														<text class="icon-emoji"
															style="color: #409EFF; margin-right: 8rpx">🅿️</text>
														<text class="label-text">停车位置：</text>
													</view>
													<text class="info-value">{{ item.parkingLocation }}</text>
												</view>
											</view>

											<!-- 停车信息卡片 - 仅在有时间数据时显示 -->
											<view class="parking-info-card"
												v-if="item.status === '已通过' && (item.entryTime || item.leaveTime)">
												<view class="parking-header">
													<text class="icon-emoji"
														style="color: #1890ff; margin-right: 12rpx">🅿️</text>
													<text class="parking-title">停车信息</text>
													<view class="parking-status-badge"
														v-if="item.entryTime && !item.leaveTime && (item.vehicleStatus === '已进场' || item.vehicleStatus === '已入场')">
														<text class="status-dot">🟢</text>
														<text class="status-text">在场</text>
													</view>
													<view class="parking-status-badge completed"
														v-else-if="item.entryTime && item.leaveTime">
														<text class="status-dot">✅</text>
														<text class="status-text">已完成</text>
													</view>
												</view>

												<view class="parking-details">
													<!-- 停车时长 -->
													<view class="detail-row primary" v-if="formatParkingDuration(item)">
														<view class="detail-label">
															<text class="detail-icon">⏱️</text>
															<text class="detail-text">停车时长</text>
														</view>
														<text class="detail-value primary-value" :class="{
															'in-parking': item.entryTime && !item.leaveTime && (item.vehicleStatus === '已进场' || item.vehicleStatus === '已入场'),
															'completed': item.entryTime && item.leaveTime
														}">{{ formatParkingDuration(item) }}</text>
													</view>

													<!-- 进场时间 -->
													<view class="detail-row" v-if="item.entryTime">
														<view class="detail-label">
															<text class="detail-icon">🚗</text>
															<text class="detail-text">进场时间</text>
														</view>
														<text class="detail-value">{{ formatTime(item.entryTime)
															}}</text>
													</view>

													<!-- 离场时间 -->
													<view class="detail-row" v-if="item.leaveTime">
														<view class="detail-label">
															<text class="detail-icon">🚙</text>
															<text class="detail-text">离场时间</text>
														</view>
														<text class="detail-value">{{ formatTime(item.leaveTime)
															}}</text>
													</view>
												</view>
											</view>

											<!-- 联系人信息卡片 -->
											<view class="contact-info-card">
												<view class="info-row">
													<view class="info-label">
														<text class="icon-emoji"
															style="color: #67C23A; margin-right: 8rpx">👤</text>
														<text class="label-text">访客微信昵称：</text>
													</view>
													<text class="info-value"
														:class="{ 'no-data': !item.visitorName || item.visitorName.trim() === '' }">
														{{ item.visitorName && item.visitorName.trim() !== '' ?
															item.visitorName : '暂无访客昵称' }}
													</text>
												</view>
												<view class="info-row">
													<view class="info-label">
														<text class="icon-emoji"
															style="color: #409EFF; margin-right: 8rpx">📱</text>
														<text class="label-text">访客手机号：</text>
													</view>
													<text class="info-value clickable phone-number"
														@click="makePhoneCall(item.phone)">
														{{ item.phone || '暂无手机号' }}
													</text>
												</view>
												<view class="info-row" v-if="item.ownerName">
													<view class="info-label">
														<text class="icon-emoji"
															style="color: #E6A23C; margin-right: 8rpx">🏠</text>
														<text class="label-text">业主姓名：</text>
													</view>
													<text class="info-value">{{ item.ownerName }}</text>
												</view>
												<view class="info-row" v-if="item.ownerPhone">
													<view class="info-label">
														<text class="icon-emoji"
															style="color: #F56C6C; margin-right: 8rpx">☎️</text>
														<text class="label-text">业主手机号：</text>
													</view>
													<text class="info-value clickable phone-number"
														@click="makePhoneCall(item.ownerPhone)">
														{{ item.ownerPhone }}
													</text>
												</view>
											</view>

											<!-- 预约详情卡片 -->
											<view class="appointment-detail-card">
												<view class="info-row" v-if="item.visitReason">
													<view class="info-label">
														<text class="icon-emoji">📝</text>
														<text class="label-text">预约原因</text>
													</view>
													<view class="info-value reason-text">{{ item.visitReason }}</view>
												</view>
												<view class="info-row" v-if="item.appointType">
													<view class="info-label">
														<text class="icon-emoji">🔖</text>
														<text class="label-text">预约方式</text>
													</view>
													<view class="info-value appoint-type">{{ item.appointType }}</view>
												</view>
											</view>

											<!-- 地址信息卡片 -->
											<view class="address-info-card">
												<view class="info-row">
													<view class="info-label">
														<text class="icon-emoji"
															style="color: #E6A23C; margin-right: 8rpx">📍</text>
														<text class="label-text">{{ currentUserRole === 'visitor' ?
															'访问地址：'
															: '住址信息：' }}</text>
													</view>
													<text class="info-value">{{ item.addressDetail }}</text>
													<view class="address-actions">
														<view class="address-action"
															@click="copyAddress(item.addressDetail)">
															<text class="icon-emoji"
																style="color: #E6A23C; margin-right: 6rpx">📋</text>
															<text>复制</text>
														</view>
													</view>
												</view>
											</view>
										</template>

										<!-- 拉黑信息卡片 - 仅当状态为"已拉黑"时显示 -->
										<view class="blacklist-info-card"
											v-if="item.vehicleStatus === '已拉黑' && item.refuseReason">
											<view class="info-row">
												<view class="info-label">
													<text class="icon-emoji"
														style="color: #F56C6C; margin-right: 8rpx">🚫</text>
													<text class="label-text">拉黑信息：</text>
												</view>
											</view>
											<view class="blacklist-content">
												<text class="blacklist-text">{{ item.refuseReason }}</text>
											</view>
											<view class="blacklist-tip">
												<text class="tip-icon">⚠️</text>
												<text class="tip-text">该预约关联的车辆已被加入黑名单</text>
											</view>
										</view>
									</view>
								</view>
							</u-card>
						</view>
					</view>

					<!-- 无数据提示 -->
					<view class="empty-result"
						v-if="(!reservationList || reservationList.length === 0) && (searchKeyword || isFiltering || currentStatFilter)">
						<view class="empty-icon">📋</view>
						<view class="empty-title">暂无数据</view>
						<view class="empty-desc">没有找到符合条件的预约记录</view>
						<view class="empty-tips">
							<view class="tip-item">💡 尝试修改搜索条件</view>
							<view class="tip-item">💡 清除筛选条件重新查询</view>
						</view>
						<view class="empty-actions">
							<view class="action-btn primary" @click="backToWelcome">
								<text class="btn-icon">🏠</text>
								<text class="btn-text">返回主页</text>
							</view>
							<view class="action-btn secondary" @click="resetAllFilters" v-if="isFiltering">
								<text class="btn-icon">🔄</text>
								<text class="btn-text">重置筛选</text>
							</view>
						</view>
					</view>
				</scroll-view>
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

export default {
	components: {
		CustomTabbar
	},
	data() {
		return {
			statusBarHeight: 44,
			currentUserRole: 'manager',
			currentUserPhone: '',
			currentManagerCommunity: '',

			// 从URL参数接收的数据
			searchKeyword: '',
			reservationList: [],
			originalList: [],

			// UI控制
			showSuggestions: false,
			searchSuggestions: [],
			showDashboard: true,
			showSmartFilter: false,
			searchInputFocus: false,
			keyboardHeight: 0,
			suggestionScrollTop: 0,

			// 筛选状态
			selectedTimeFilter: 'all',
			selectedStatusFilter: 'all',
			selectedVehicleFilter: 'all',
			currentStatFilter: null,
			isFiltering: false,
			hasPerformedSearch: false,

			// 🆕 数据来源Tab
			dataSourceTab: 'all', // 'all' | 'miniprogram' | 'backend'

			// 筛选选项
			timeFilterOptions: [
				{ key: 'all', name: '全部', count: undefined },
				{ key: 'today', name: '今日', count: 0 },
				{ key: 'yesterday', name: '昨日', count: 0 },
				{ key: 'recent3', name: '近3天', count: 0 },
				{ key: 'thisWeek', name: '本周', count: 0 }
			],
			statusFilterOptions: [
				{ key: 'all', name: '全部', emoji: '📋', count: 0 },
				{ key: 'pending', name: '待审批', emoji: '⏳', count: 0 },
				{ key: 'approved', name: '已通过', emoji: '✅', count: 0 },
				{ key: 'rejected', name: '已拒绝', emoji: '❌', count: 0 }
			],
			vehicleFilterOptions: [
				{ key: 'all', name: '全部', emoji: '🚗', count: 0 },
				{ key: 'entered', name: '已进场', emoji: '🟢', count: 0 },
				{ key: 'exited', name: '已离场', emoji: '🔴', count: 0 },
				{ key: 'notEntered', name: '未进场', emoji: '⚪', count: 0 }
			],

			// 折叠状态
			itemCollapseStates: {},

			// 加载状态
			isLoadingData: false,

			// 搜索历史
			searchHistory: [],
			showSearchHistory: false,
			searchHistoryExpanded: false,

			// 停车时长定时器
			parkingDurationTimer: null,
			initialFilter: '', //新增属性

			// 自动展开目标记录（从超时提醒跳转过来时使用）
			autoExpandEnterTime: null,
			autoExpand: false
		}
	},


	onLoad(options) {
		this.setStatusBarHeight()
		this.getUserRole()

		// 接收传递过来的参数
		if (options.keyword) {
			this.searchKeyword = decodeURIComponent(options.keyword.replace(/\+/g, ' '))
		}

		// 接收筛选参数
		if (options.filter) {
			this.initialFilter = options.filter
		}

		// 🆕 接收自动展开参数（从超时提醒跳转过来时使用）
		if (options.enterTime) {
			this.autoExpandEnterTime = decodeURIComponent(options.enterTime.replace(/\+/g, ' '))
			console.log('🔍 [onLoad] 接收到进场时间参数:', this.autoExpandEnterTime)
		}
		if (options.autoExpand === 'true') {
			this.autoExpand = true
			console.log('🔍 [onLoad] 自动展开标记已启用')
		}

		// 🆕 从服务器加载最新数据（而不是只从缓存加载）
		console.log('🔄 [onLoad] 开始从服务器加载最新数据')
		this.loadAppointmentData()
	},

	onShow() {
		this.hideSystemTabBar()
		this.$nextTick(() => {
			uni.$emit('updateTabBarIndex', 1)
		})
	},

	// 🆕 下拉刷新
	onPullDownRefresh() {
		console.log('🔄 [下拉刷新] 用户触发下拉刷新')
		uni.showToast({
			title: '刷新中...',
			icon: 'loading',
			duration: 1000
		})

		// 重新加载数据
		this.loadAppointmentData()

		// 延迟停止刷新动画，确保数据加载完成
		setTimeout(() => {
			uni.stopPullDownRefresh()
			uni.showToast({
				title: '刷新成功',
				icon: 'success',
				duration: 1000
			})
			console.log('✅ [下拉刷新] 刷新完成')
		}, 1500)
	},

	onUnload() {
		this.stopParkingDurationTimer()
		uni.$off('updateTabBarIndex')
	},

	mounted() {
		this.startParkingDurationTimer()

		// 加载搜索历史
		try {
			const history = uni.getStorageSync('search_history')
			if (history && Array.isArray(history)) {
				this.searchHistory = history.map(item => ({
					...item,
					count: item.count || 1
				}))
				this.showSearchHistory = history.length > 0
			} else {
				this.searchHistory = []
				this.showSearchHistory = false
			}
		} catch (error) {
			this.searchHistory = []
			this.showSearchHistory = false
		}
	},

	computed: {
		// 获取预览显示的搜索历史（最多3条）
		previewSearchHistory() {
			try {
				if (!this.searchHistory || !Array.isArray(this.searchHistory)) {
					return []
				}
				return this.searchHistory
					.filter(item => item && item.keyword && typeof item.keyword === 'string')
					.slice(0, 3)
			} catch (error) {
				return []
			}
		},

		// 最近搜索历史（限制显示数量）
		recentSearchHistory() {
			try {
				if (!this.searchHistory || !Array.isArray(this.searchHistory)) {
					return []
				}
				return this.searchHistory
					.filter(item => item && item.keyword && typeof item.keyword === 'string')
					.slice(0, 6)
			} catch (error) {
				return []
			}
		},

		// 🆕 根据数据来源Tab过滤后的列表
		filteredReservationList() {
			if (!this.reservationList || !Array.isArray(this.reservationList)) {
				return []
			}
			if (this.dataSourceTab === 'all') {
				return this.reservationList
			}
			if (this.dataSourceTab === 'miniprogram') {
				return this.reservationList.filter(item =>
					item.dataSource !== 'backend' && item.appointType !== '后台录入'
				)
			}
			if (this.dataSourceTab === 'backend') {
				return this.reservationList.filter(item =>
					item.dataSource === 'backend' || item.appointType === '后台录入'
				)
			}
			return this.reservationList
		},

		// 🆕 小程序预约数量
		miniprogramCount() {
			if (!this.reservationList || !Array.isArray(this.reservationList)) {
				return 0
			}
			return this.reservationList.filter(item =>
				item.dataSource !== 'backend' && item.appointType !== '后台录入'
			).length
		},

		// 🆕 后台录入数量
		backendCount() {
			if (!this.reservationList || !Array.isArray(this.reservationList)) {
				return 0
			}
			return this.reservationList.filter(item =>
				item.dataSource === 'backend' || item.appointType === '后台录入'
			).length
		}
	},

	methods: {
		// 🆕 切换数据来源Tab
		switchDataSourceTab(tab) {
			this.dataSourceTab = tab
			console.log('🔄 [Tab切换] 切换到:', tab, '数量:', this.filteredReservationList.length)
		},

		// 设置状态栏高度
		setStatusBarHeight() {
			try {
				const systemInfo = uni.getSystemInfoSync()
				this.statusBarHeight = systemInfo.statusBarHeight || 44
			} catch (error) {
				this.statusBarHeight = 44
			}
		},

		// 隐藏系统TabBar
		hideSystemTabBar() {
			uni.hideTabBar({
				animation: false
			})
		},

		// 获取用户角色
		getUserRole() {
			try {
				const userInfo = uni.getStorageSync('userInfo')
				if (userInfo && userInfo.role) {
					this.currentUserRole = userInfo.role
				}
				if (this.currentUserRole === 'manager') {
					const parkInfo = uni.getStorageSync('parkInfo')
					if (parkInfo && parkInfo.name) {
						this.currentManagerCommunity = parkInfo.name
					}
				}
			} catch (error) {
				this.currentUserRole = 'manager'
			}
		},

		// 从storage加载数据
		loadDataFromStorage() {
			try {
				const cachedData = uni.getStorageSync('searchResultData')
				if (cachedData && Array.isArray(cachedData)) {
					console.log('📦 [数据加载] 缓存数据总数:', cachedData.length)

					// 🔍 检查第一条数据是否有 visitorName 字段
					if (cachedData.length > 0) {
						console.log('📦 [数据加载] 第一条数据字段检查:', cachedData[0])
					}

					this.originalList = cachedData
					this.reservationList = [...cachedData]
					this.updateFilterCounts()

					// 🆕 应用初始筛选
					if (this.initialFilter === 'today') {
						// 今日预约：基于time字段
						this.filterByToday()
					} else if (this.initialFilter === 'todayVisit') {
						// 今日来访：基于entryTime字段
						this.filterByTodayVisit()
					} else if (this.searchKeyword) {
						// 如果有搜索关键词，执行搜索
						this.performSearch()
					} else {
						// 加载数据后按创建时间排序
						this.sortByLatestTime()
					}

					// 🆕 如果有自动展开标记，在数据加载完成后自动展开目标记录
					if (this.autoExpand && this.autoExpandEnterTime) {
						console.log('🔍 [数据加载] 准备自动展开目标记录')
						this.$nextTick(() => {
							setTimeout(() => {
								this.autoExpandTargetRecord()
							}, 500)
						})
					}
				}
			} catch (error) {
				console.error('加载数据失败:', error)
			}
		},

		// 返回上一页
		navigateBack() {
			this.searchKeyword = ''
			this.showSuggestions = false
			this.searchSuggestions = []
			
			// 通知 searchResult 页面清空搜索框
			uni.$emit('clearSearchKeyword')
			
			// 🔧 检查页面栈长度，智能处理返回逻辑
			const pages = getCurrentPages()
			console.log('📱 [navigateBack] 当前页面栈长度:', pages.length)
			
			if (pages.length <= 1) {
				// 页面栈只有当前页面（从模板消息直接跳转进来），需要跳转到对应角色的首页
				console.log('📱 [navigateBack] 页面栈只有1个，从模板消息跳转进来，跳转到角色首页')
				
				// 多级获取用户角色：userRole > userInfo.role > currentUserRole
				let userRole = uni.getStorageSync('userRole')
				if (!userRole) {
					const userInfo = uni.getStorageSync('userInfo')
					userRole = (userInfo && userInfo.role) || this.currentUserRole
				}
				console.log('📱 [navigateBack] 当前用户角色:', userRole)
				
				// 同步角色到存储，确保目标页面能正确获取
				try {
					const userInfo = uni.getStorageSync('userInfo') || {}
					userInfo.role = userRole
					uni.setStorageSync('userInfo', userInfo)
					uni.setStorageSync('userRole', userRole)
				} catch (e) {
					console.error('❌ [navigateBack] 同步角色到存储失败:', e)
				}
				
				if (userRole === 'patrol') {
					// 巡检员跳转到违规页面，携带刷新参数和角色参数
					uni.reLaunch({
						url: '/pagesE/violation/violation?fromDataList=true&needRefresh=true&role=patrol'
					})
				} else if (userRole === 'manager') {
					// 管家跳转到预约查询页面
					uni.reLaunch({
						url: '/pagesA/reservation/searchResult/searchResult?fromDataList=true&role=manager'
					})
				} else {
					// 其他角色跳转到预约页面
					uni.reLaunch({
						url: '/pagesA/reservation/form'
					})
				}
			} else {
				// 正常返回上一页
				uni.navigateBack({
					delta: 1
				})
			}
		},

		// 搜索相关方法
		handleSearchInput(e) {
			this.searchKeyword = e.detail.value
			if (this.searchKeyword) {
				this.generateSearchSuggestions()
				this.showSuggestions = true
			} else {
				this.showSuggestions = false
			}
		},

		handleSearchFocus() {
			this.searchInputFocus = true
			if (this.searchKeyword) {
				// 🐛 修复：获得焦点时重新生成搜索建议，确保建议内容与输入框内容匹配
				this.generateSearchSuggestions()
				this.showSuggestions = true
			}
		},

		handleSearchBlur() {
			setTimeout(() => {
				this.searchInputFocus = false
				this.showSuggestions = false
			}, 200)
		},

		handleSearchConfirm() {
			if (this.searchKeyword && this.searchKeyword.trim()) {
				this.performSearch()
				this.showSuggestions = false
				// 保存搜索历史
				this.saveSearchHistory(this.searchKeyword)
			}
		},

		clearSearch() {
			this.searchKeyword = ''
			this.showSuggestions = false
			this.reservationList = [...this.originalList]
			this.hasPerformedSearch = false
		},

		performSearch() {
			const keyword = this.searchKeyword.trim().toLowerCase()
			if (!keyword) {
				this.reservationList = [...this.originalList]
				return
			}

			this.reservationList = this.originalList.filter(item => {
				return (
					(item.plateNumber && item.plateNumber.toLowerCase().includes(keyword)) ||
					(item.name && item.name.toLowerCase().includes(keyword)) ||
					(item.phone && item.phone.includes(keyword)) ||
					(item.addressDetail && item.addressDetail.toLowerCase().includes(keyword))
				)
			})

			this.hasPerformedSearch = true
			this.isFiltering = true
		},

		generateSearchSuggestions() {
			const keyword = this.searchKeyword.toLowerCase()
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
					// 根据匹配的字段显示对应内容
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

			// 去重：使用 Map 保持第一次出现的建议
			const uniqueMap = new Map()
			suggestions.forEach(suggestion => {
				if (!uniqueMap.has(suggestion.text)) {
					uniqueMap.set(suggestion.text, suggestion)
				}
			})

			// 转换回数组并限制数量
			this.searchSuggestions = Array.from(uniqueMap.values()).slice(0, 5)
		},

		selectSuggestionByIndex(index) {
			if (this.searchSuggestions[index]) {
				this.searchKeyword = this.searchSuggestions[index].text
				this.performSearch()
				this.showSuggestions = false
			}
		},

		getSuggestionIcon(type) {
			const icons = {
				plate: '🚗',
				name: '👤',
				phone: '📱',
				default: '🔍'
			}
			return icons[type] || icons.default
		},

		getSuggestionIconColor(type) {
			const colors = {
				plate: '#409EFF',
				name: '#67C23A',
				phone: '#E6A23C',
				default: '#909399'
			}
			return colors[type] || colors.default
		},

		getSuggestionTypeText(type) {
			const texts = {
				plate: '车牌号',
				name: '姓名',
				phone: '手机号',
				default: '其他'
			}
			return texts[type] || texts.default
		},

		startVoiceSearch() {
			uni.showToast({
				title: '语音搜索功能开发中',
				icon: 'none'
			})
		},

		handleTouchStart() {
			// 标记用户正在交互
		},

		handleTouchEnd() {
			// 触摸结束
		},

		// 搜索历史相关方法
		saveSearchHistory(keyword) {
			if (!keyword || !keyword.trim()) return

			try {
				const trimmedKeyword = keyword.trim()
				let history = uni.getStorageSync('search_history') || []

				const existingIndex = history.findIndex(item => item.keyword === trimmedKeyword)

				if (existingIndex !== -1) {
					history[existingIndex].count = (history[existingIndex].count || 1) + 1
					history[existingIndex].time = Date.now()
					const item = history.splice(existingIndex, 1)[0]
					history.unshift(item)
				} else {
					history.unshift({
						keyword: trimmedKeyword,
						type: 'keyword',
						time: Date.now(),
						count: 1
					})
				}

				if (history.length > 20) {
					history = history.slice(0, 20)
				}

				uni.setStorageSync('search_history', history)
				this.searchHistory = history
				this.showSearchHistory = true
			} catch (error) {
				console.error('保存搜索历史失败:', error)
			}
		},

		clearSearchHistory() {
			uni.showModal({
				title: '清空历史',
				content: '确定要清空所有搜索历史吗？',
				success: (res) => {
					if (res.confirm) {
						try {
							uni.removeStorageSync('search_history')
							this.searchHistory = []
							this.showSearchHistory = false
							uni.showToast({
								title: '已清空',
								icon: 'success'
							})
						} catch (error) {
							console.error('清空搜索历史失败:', error)
						}
					}
				}
			})
		},

		useHistorySearch(item) {
			if (!item || !item.keyword) return
			this.searchKeyword = item.keyword
			this.handleSearchConfirm()
		},

		toggleSearchHistory() {
			this.searchHistoryExpanded = !this.searchHistoryExpanded
		},

		removeSearchHistory(index) {
			try {
				this.searchHistory.splice(index, 1)
				uni.setStorageSync('search_history', this.searchHistory)
				if (this.searchHistory.length === 0) {
					this.showSearchHistory = false
				}
			} catch (error) {
				console.error('删除搜索历史失败:', error)
			}
		},

		getHistoryIcon(type) {
			const icons = {
				keyword: '🔍',
				plate: '🚗',
				name: '👤',
				phone: '📱',
				address: '📍'
			}
			return icons[type] || icons.keyword
		},

		formatHistoryTime(timestamp) {
			if (!timestamp) return ''
			const now = Date.now()
			const diff = now - timestamp
			const minutes = Math.floor(diff / 60000)
			const hours = Math.floor(diff / 3600000)
			const days = Math.floor(diff / 86400000)

			if (minutes < 1) return '刚刚'
			if (minutes < 60) return `${minutes}分钟前`
			if (hours < 24) return `${hours}小时前`
			if (days < 7) return `${days}天前`
			return dayjs(timestamp).format('MM-DD')
		},

		// 统计方法 - 基于原始数据（不受筛选影响）
		getTodayCount() {
			if (!this.originalList || !Array.isArray(this.originalList)) return 0
			const today = new Date().toDateString()
			return this.originalList.filter(item => {
				if (!item || !item.time) return false
				return this.parseDate(item.time).toDateString() === today
			}).length
		},

		getTodayTrend() {
			const todayCount = this.getTodayCount()
			const yesterday = new Date()
			yesterday.setDate(yesterday.getDate() - 1)
			const yesterdayStr = yesterday.toDateString()

			const yesterdayCount = this.originalList.filter(item => {
				return this.parseDate(item.time).toDateString() === yesterdayStr
			}).length

			if (yesterdayCount === 0) return todayCount > 0 ? '+100%' : '0%'
			const percent = Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100)
			return percent > 0 ? `+${percent}%` : percent < 0 ? '' : '0%'
		},

		getNotEnteredCount() {
			if (!this.originalList) return 0
			return this.originalList.filter(item =>
				item.status === '已通过' &&
				(item.vehicleStatus === '未进场' || item.vehicleStatus === '待进场' ||
					item.vehicleStatus === '待入场' || item.vehicleStatus === '未入场' || !item.vehicleStatus)
			).length
		},

		getTodayNotEnteredCount() {
			if (!this.originalList) return 0
			const today = new Date().toDateString()
			return this.originalList.filter(item => {
				return this.parseDate(item.time).toDateString() === today &&
					item.status === '已通过' &&
					(item.vehicleStatus === '未进场' || item.vehicleStatus === '待进场' ||
						item.vehicleStatus === '待入场' || item.vehicleStatus === '未入场' || !item.vehicleStatus)
			}).length
		},

		getInParkingCount() {
			if (!this.originalList) return 0
			return this.originalList.filter(item =>
				item.status === '已通过' &&
				(item.vehicleStatus === '已进场' || item.vehicleStatus === '已入场')
			).length
		},

		getExitedTodayCount() {
			if (!this.originalList) return 0
			const today = new Date().toDateString()
			return this.originalList.filter(item => {
				return (item.vehicleStatus === '已离场' || item.vehicleStatus === '已出场')
			}).length
		},

		getApprovalRate() {
			if (!this.originalList || this.originalList.length === 0) return 0
			const approved = this.originalList.filter(item => item.status === '已通过').length
			return Math.round((approved / this.originalList.length) * 100)
		},

		getEntryRate() {
			const approvedList = this.originalList.filter(item => item.status === '已通过')
			if (approvedList.length === 0) return 0
			const entered = approvedList.filter(item =>
				item.vehicleStatus === '已进场' || item.vehicleStatus === '已入场' ||
				item.vehicleStatus === '已离场' || item.vehicleStatus === '已出场'
			).length
			return Math.round((entered / approvedList.length) * 100)
		},

		// 筛选方法
		filterByToday() {
			if (this.currentStatFilter === 'today') {
				this.currentStatFilter = null
				this.reservationList = [...this.originalList]
			} else {
				this.currentStatFilter = 'today'
				const today = new Date().toDateString()
				this.reservationList = this.originalList.filter(item => {
					return this.parseDate(item.time).toDateString() === today
				})
			}
			this.isFiltering = true
		},

		// 🆕 筛选今日来访数据（基于entryTime字段）
		filterByTodayVisit() {
			if (this.currentStatFilter === 'todayVisit') {
				this.currentStatFilter = null
				this.reservationList = [...this.originalList]
			} else {
				this.currentStatFilter = 'todayVisit'
				const today = new Date().toDateString()
				this.reservationList = this.originalList.filter(item => {
					if (!item || !item.entryTime) return false
					return this.parseDate(item.entryTime).toDateString() === today
				})
			}
			this.isFiltering = true
		},

		filterByNotEntered() {
			if (this.currentStatFilter === 'notEntered') {
				this.currentStatFilter = null
				this.reservationList = [...this.originalList]
			} else {
				this.currentStatFilter = 'notEntered'
				this.reservationList = this.originalList.filter(item =>
					item.status === '已通过' &&
					(item.vehicleStatus === '未进场' || item.vehicleStatus === '待进场' ||
						item.vehicleStatus === '待入场' || item.vehicleStatus === '未入场' || !item.vehicleStatus)
				)
			}
			this.isFiltering = true
		},

		filterByInParking() {
			if (this.currentStatFilter === 'inParking') {
				this.currentStatFilter = null
				this.reservationList = [...this.originalList]
			} else {
				this.currentStatFilter = 'inParking'
				this.reservationList = this.originalList.filter(item =>
					item.status === '已通过' &&
					(item.vehicleStatus === '已进场' || item.vehicleStatus === '已入场')
				)
			}
			this.isFiltering = true
		},

		selectTimeFilter(key) {
			this.selectedTimeFilter = key
		},

		selectStatusFilter(key) {
			this.selectedStatusFilter = key
		},

		selectVehicleFilter(key) {
			this.selectedVehicleFilter = key
		},

		resetAllFilters() {
			this.selectedTimeFilter = 'all'
			this.selectedStatusFilter = 'all'
			this.selectedVehicleFilter = 'all'
			this.currentStatFilter = null
			this.isFiltering = false
			this.reservationList = [...this.originalList]

			uni.showToast({
				title: '筛选已重置',
				icon: 'success'
			})
		},

		applyFilters() {
			let filteredData = [...this.originalList]

			if (this.selectedTimeFilter !== 'all') {
				filteredData = this.applyTimeFilter(filteredData, this.selectedTimeFilter)
			}

			if (this.selectedStatusFilter !== 'all') {
				filteredData = this.applyStatusFilter(filteredData, this.selectedStatusFilter)
			}

			filteredData = this.applyVehicleFilter(filteredData, this.selectedVehicleFilter)

			this.reservationList = filteredData
			this.isFiltering = true

			uni.showToast({
				title: `筛选出 ${filteredData.length} 条记录`,
				icon: 'success'
			})
		},

		applyTimeFilter(data, timeKey) {
			const now = new Date()
			return data.filter(item => {
				const itemDate = this.parseDate(item.time)
				switch (timeKey) {
					case 'today':
						return itemDate.toDateString() === now.toDateString()
					case 'yesterday':
						const yesterday = new Date(now)
						yesterday.setDate(yesterday.getDate() - 1)
						return itemDate.toDateString() === yesterday.toDateString()
					case 'recent3':
						const threeDaysAgo = new Date(now)
						threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
						return itemDate >= threeDaysAgo
					case 'thisWeek':
						const weekStart = new Date(now)
						weekStart.setDate(weekStart.getDate() - now.getDay())
						return itemDate >= weekStart
					default:
						return true
				}
			})
		},

		applyStatusFilter(data, statusKey) {
			return data.filter(item => {
				switch (statusKey) {
					case 'pending':
						return item.status === '待审核' || item.status === '待审批'
					case 'approved':
						return item.status === '已通过'
					case 'rejected':
						return item.status === '未通过' || item.status === '已拒绝'
					default:
						return false
				}
			})
		},

		applyVehicleFilter(data, vehicleKey) {
			return data.filter(item => {
				switch (vehicleKey) {
					case 'all':
						return true
					case 'entered':
						return item.status === '已通过' && (item.vehicleStatus === '已进场' || item.vehicleStatus === '已入场')
					case 'exited':
						return item.status === '已通过' && (item.vehicleStatus === '已离场' || item.vehicleStatus === '已出场')
					case 'notEntered':
						return item.status === '已通过' && (item.vehicleStatus === '未进场' || item.vehicleStatus === '待进场' || !item.vehicleStatus)
					default:
						return false
				}
			})
		},

		updateFilterCounts() {
			// 更新筛选器计数
			this.timeFilterOptions.forEach(option => {
				if (option.key !== 'all') {
					option.count = this.getTimeFilterCount(option.key)
				}
			})

			this.statusFilterOptions.forEach(option => {
				if (option.key === 'all') {
					option.count = this.originalList.length
				} else {
					option.count = this.getStatusFilterCount(option.key)
				}
			})

			this.vehicleFilterOptions.forEach(option => {
				if (option.key === 'all') {
					option.count = this.originalList.length
				} else {
					option.count = this.getVehicleFilterCount(option.key)
				}
			})
		},

		getTimeFilterCount(timeKey) {
			const now = new Date()
			return this.originalList.filter(item => {
				const itemDate = this.parseDate(item.time)
				switch (timeKey) {
					case 'today':
						return itemDate.toDateString() === now.toDateString()
					case 'yesterday':
						const yesterday = new Date(now)
						yesterday.setDate(yesterday.getDate() - 1)
						return itemDate.toDateString() === yesterday.toDateString()
					case 'recent3':
						const threeDaysAgo = new Date(now)
						threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
						return itemDate >= threeDaysAgo
					case 'thisWeek':
						const weekStart = new Date(now)
						weekStart.setDate(weekStart.getDate() - now.getDay())
						return itemDate >= weekStart
					default:
						return true
				}
			}).length
		},

		getStatusFilterCount(key) {
			return this.originalList.filter(item => {
				switch (key) {
					case 'pending':
						return item.status === '待审核' || item.status === '待审批'
					case 'approved':
						return item.status === '已通过'
					case 'rejected':
						return item.status === '未通过' || item.status === '已拒绝'
					default:
						return false
				}
			}).length
		},

		getVehicleFilterCount(key) {
			return this.originalList.filter(item => {
				switch (key) {
					case 'entered':
						return item.status === '已通过' && (item.vehicleStatus === '已进场' || item.vehicleStatus === '已入场')
					case 'exited':
						return item.status === '已通过' && (item.vehicleStatus === '已离场' || item.vehicleStatus === '已出场')
					case 'notEntered':
						return item.status === '已通过' && (item.vehicleStatus === '未进场' || item.vehicleStatus === '待进场' || !item.vehicleStatus)
					default:
						return false
				}
			}).length
		},

		expandAllItems() {
			this.reservationList.forEach((item, index) => {
				this.$set(this.itemCollapseStates, index, false)
			})
			uni.showToast({
				title: '已全部展开',
				icon: 'success'
			})
		},

		collapseAllItems() {
			this.reservationList.forEach((item, index) => {
				this.$set(this.itemCollapseStates, index, true)
			})
			uni.showToast({
				title: '已全部收起',
				icon: 'success'
			})
		},

		toggleItemCollapse(index) {
			this.$set(this.itemCollapseStates, index, !this.isItemCollapsed(index))
		},

		isItemCollapsed(index) {
			return this.itemCollapseStates[index] !== false
		},

		// 工具方法
		parseDate(dateString) {
			if (!dateString) return new Date()
			if (dateString instanceof Date) return dateString
			const normalizedDateString = dateString.replace(/-/g, '/')
			return new Date(normalizedDateString)
		},

		formatTime(timeStr) {
			if (!timeStr || timeStr === '' || timeStr === 'null' || timeStr === 'undefined') return ''
			const parsed = dayjs(timeStr)
			// 检查dayjs解析结果是否有效
			if (!parsed.isValid()) return ''
			return parsed.format('YYYY-MM-DD HH:mm:ss')
		},

		formatParkingDuration(item) {
			const durationMinutes = this.getParkingDurationInMinutes(item)
			if (durationMinutes === null) return ''

			const hours = Math.floor(durationMinutes / 60)
			const minutes = durationMinutes % 60

			if (item.entryTime && !item.leaveTime &&
				(item.vehicleStatus === '已进场' || item.vehicleStatus === '已入场')) {
				return `${hours}小时${minutes}分钟（进行中）`
			}

			return `${hours}小时${minutes}分钟`
		},

		getParkingDurationInMinutes(item) {
			// 验证进场时间是否有效
			const entryParsed = item.entryTime ? dayjs(item.entryTime) : null
			if (!entryParsed || !entryParsed.isValid()) return null

			if (item.entryTime && item.leaveTime) {
				const leaveParsed = dayjs(item.leaveTime)
				if (!leaveParsed.isValid()) return null
				return leaveParsed.diff(entryParsed, 'minute')
			}

			if (item.entryTime && !item.leaveTime &&
				(item.vehicleStatus === '已进场' || item.vehicleStatus === '已入场')) {
				return dayjs().diff(entryParsed, 'minute')
			}

			return null
		},

		getWaitingTime(time) {
			if (!time) return ''
			const now = dayjs()
			const appointTime = dayjs(time)
			const diffMinutes = now.diff(appointTime, 'minute')

			if (diffMinutes < 60) {
				return `等待${diffMinutes}分钟`
			} else {
				const hours = Math.floor(diffMinutes / 60)
				const minutes = diffMinutes % 60
				return `等待${hours}小时${minutes}分钟`
			}
		},

		statusType(status) {
			const typeMap = {
				'已通过': 'success',
				'待审核': 'warning',
				'待审批': 'pending',
				'不审核': 'no-audit',
				'未通过': 'error',
				'已拒绝': 'error'
			}
			return typeMap[status] || 'info'
		},

		copyPlateNumber(plateNumber) {
			uni.setClipboardData({
				data: plateNumber,
				success: () => {
					uni.showToast({
						title: '车牌号已复制',
						icon: 'success'
					})
				}
			})
		},

		makePhoneCall(phoneNumber) {
			uni.makePhoneCall({
				phoneNumber: phoneNumber
			})
		},

		copyAddress(address) {
			uni.setClipboardData({
				data: address,
				success: () => {
					uni.showToast({
						title: '地址已复制',
						icon: 'success'
					})
				}
			})
		},

		backToWelcome() {
			// 检查页面栈，如果是第一个页面则跳转到首页，否则返回上一页
			const pages = getCurrentPages()
			console.log('📄 [返回] 当前页面栈长度:', pages.length)

			uni.reLaunch({
				url: '/pagesA/reservation/searchResult/searchResult'
			})
		},

		// 时间判断方法
		isToday(dateString) {
			const today = new Date()
			const date = this.parseDate(dateString)
			return date.getDate() === today.getDate() &&
				date.getMonth() === today.getMonth() &&
				date.getFullYear() === today.getFullYear()
		},

		isYesterday(dateString) {
			const yesterday = new Date()
			yesterday.setDate(yesterday.getDate() - 1)
			const date = this.parseDate(dateString)
			return date.getDate() === yesterday.getDate() &&
				date.getMonth() === yesterday.getMonth() &&
				date.getFullYear() === yesterday.getFullYear()
		},

		isWithinDays(dateString, days) {
			const targetDate = this.parseDate(dateString)
			const now = new Date()
			const startDate = new Date()
			startDate.setDate(startDate.getDate() - days)
			startDate.setHours(0, 0, 0, 0)

			// 排除今天和昨天
			if (this.isToday(dateString) || this.isYesterday(dateString)) {
				return false
			}

			return targetDate >= startDate && targetDate <= now
		},

		getItemTimeClass(time) {
			if (this.isToday(time)) {
				return 'time-status-today'
			} else if (this.isYesterday(time)) {
				return 'time-status-yesterday'
			} else if (this.isWithinDays(time, 3)) {
				return 'time-status-three-days'
			} else if (this.isWithinDays(time, 5)) {
				return 'time-status-five-days'
			} else if (this.isWithinDays(time, 7)) {
				return 'time-status-week'
			}
			return ''
		},

		formatDisplayTime(timeStr) {
			if (!timeStr) return ''
			const date = this.parseDate(timeStr)

			if (this.isToday(timeStr)) {
				return ''
			} else if (this.isYesterday(timeStr)) {
				return '昨日'
			} else {
				return dayjs(timeStr).format('MM-DD')
			}
		},

		getTimeStatusText(timeStr) {
			if (this.isToday(timeStr)) {
				return '今日'
			} else if (this.isYesterday(timeStr)) {
				return '昨日'
			} else if (this.isWithinDays(timeStr, 3)) {
				return '近三天'
			} else if (this.isWithinDays(timeStr, 5)) {
				return '近五天'
			} else if (this.isWithinDays(timeStr, 7)) {
				return '近一周'
			}
			return ''
		},

		onTabChange(index) {
			// TabBar切换处理
		},

		// === 数据加载方法 ===
		// 加载预约数据（用于刷新）
		loadAppointmentData() {
			if (this.isLoadingData) {
				console.log('⏳ [数据加载] 正在加载中，跳过重复请求')
				return
			}

			console.log('🔍 [数据加载] 当前用户角色:', this.currentUserRole)

			this.isLoadingData = true
			uni.showLoading({
				title: '加载数据中...',
				mask: true
			})

			if (this.currentUserRole === 'visitor') {
				console.log('📱 [数据加载] 使用访客模式加载数据')
				this.loadAppointmentDataByPhone()
			} else if (this.currentUserRole === 'manager') {
				console.log('👨‍💼 [数据加载] 使用管家模式加载数据')
				this.loadAppointmentDataForManager()
			} else {
				console.log('⚠️ [数据加载] 角色未识别，默认使用访客模式')
				this.loadAppointmentDataByPhone()
			}
		},

		// 按手机号加载数据
		loadAppointmentDataByPhone() {
			try {
				const userInfo = uni.getStorageSync('userInfo')
				const phone = userInfo?.phone || userInfo?.userInfo?.phone

				if (!phone) {
					uni.hideLoading()
					uni.showToast({
						title: '未找到手机号',
						icon: 'none'
					})
					this.isLoadingData = false
					return
				}

				appointmentAPI.getListByPhone(phone).then(res => {
					console.log('📦 [数据加载] API完整响应:', res)

					// 尝试多种数据格式（参考 searchResult.vue 的处理方式）
					let dataList = []

					if (res && res.code === "0" && res.data) {
						// 格式1: res.data.data.data
						if (res.data.data && Array.isArray(res.data.data.data)) {
							dataList = res.data.data.data
							console.log('📋 [数据加载] 格式1 (res.data.data.data) - 数据列表长度:', dataList.length)
						}
						// 格式2: res.data.data
						else if (Array.isArray(res.data.data)) {
							dataList = res.data.data
							console.log('📋 [数据加载] 格式2 (res.data.data) - 数据列表长度:', dataList.length)
						}
						// 格式3: res.data
						else if (Array.isArray(res.data)) {
							dataList = res.data
							console.log('📋 [数据加载] 格式3 (res.data) - 数据列表长度:', dataList.length)
						}

						if (dataList.length > 0) {
							console.log('✅ [数据加载] 从服务器获取到最新数据:', dataList.length, '条')
							// 格式化数据，确保字段名匹配
							const formattedData = this.formatAppointmentData(dataList)
							console.log('📋 [数据格式化] 格式化后第一条数据:', formattedData.length > 0 ? formattedData[0] : null)
							this.originalList = formattedData
							this.reservationList = [...formattedData]

							// 保存到缓存
							uni.setStorageSync('searchResultData', formattedData)

							this.updateFilterCounts()

							// 应用初始筛选或搜索
							if (this.initialFilter === 'today') {
								this.filterByToday()
							} else if (this.initialFilter === 'todayVisit') {
								this.filterByTodayVisit()
							} else if (this.searchKeyword) {
								this.performSearch()
							} else {
								this.sortByLatestTime()
							}

							// 如果有自动展开标记，在数据加载完成后自动展开目标记录
							if (this.autoExpand && this.autoExpandEnterTime) {
								console.log('🔍 [数据加载] 准备自动展开目标记录')
								this.$nextTick(() => {
									setTimeout(() => {
										this.autoExpandTargetRecord()
									}, 500)
								})
							}
						} else {
							console.warn('⚠️ [数据加载] 没有找到数据')
							uni.showToast({
								title: '没有找到预约记录',
								icon: 'none'
							})
						}
					} else {
						console.error('❌ [数据加载] API响应格式异常:', res)
						uni.showToast({
							title: 'API返回数据格式异常',
							icon: 'none'
						})
					}

					uni.hideLoading()
					this.isLoadingData = false
				}).catch(error => {
					console.error('❌ [数据加载] 加载数据失败:', error)
					uni.hideLoading()
					this.isLoadingData = false
				})
			} catch (error) {
				console.error('❌ [数据加载] 加载数据异常:', error)
				uni.hideLoading()
				this.isLoadingData = false
			}
		},

		// 管家加载数据（与searchResult.vue保持一致）
		loadAppointmentDataForManager() {
			const userInfo = uni.getStorageSync('userInfo')
			let managerCommunity = ''

			if (userInfo) {
				if (userInfo.community) {
					managerCommunity = userInfo.community
				} else if (userInfo.userInfo && userInfo.userInfo.community) {
					managerCommunity = userInfo.userInfo.community
				} else if (userInfo.managerData && userInfo.managerData.community) {
					managerCommunity = userInfo.managerData.community
				} else if (userInfo.yardName) {
					managerCommunity = userInfo.yardName
				} else if (userInfo.userInfo && userInfo.userInfo.yardName) {
					managerCommunity = userInfo.userInfo.yardName
				}
			}

			this.currentManagerCommunity = managerCommunity
			console.log('👨‍💼 [管家模式] 管理小区:', managerCommunity)

			appointmentAPI.getList()
				.then(res => {
					console.log('📦 [数据加载] API完整响应:', res)

					if (res && (res.code === "0" || res.code === 0 || res.success === true)) {
						let dataArray = []

						// 多种数据格式兼容
						if (res.data && res.data.data && Array.isArray(res.data.data)) {
							dataArray = res.data.data.data
						} else if (res.data && Array.isArray(res.data)) {
							dataArray = res.data.data
						} else if (Array.isArray(res)) {
							dataArray = res
						} else {
							dataArray = res.data.data.data || []
						}

						console.log('📋 [数据加载] 原始数据长度:', dataArray.length)

						// 前端按小区筛选
						let filteredData = dataArray
						if (managerCommunity) {
							filteredData = dataArray.filter(item => {
								const itemCommunity = (item.community || '').trim()
								const targetCommunity = managerCommunity.trim()
								return itemCommunity === targetCommunity
							})
							console.log('🏘️ [数据加载] 筛选后数据长度:', filteredData.length)
						}

						if (filteredData.length > 0) {
							console.log('✅ [数据加载] 从服务器获取到最新数据:', filteredData.length, '条')
							// 格式化数据
							const formattedData = this.formatAppointmentData(filteredData)
							console.log('✨ [数据加载] 格式化后数据长度:', formattedData.length)
							this.originalList = formattedData
							this.reservationList = [...formattedData]

							// 保存到缓存（保存格式化后的数据）
							uni.setStorageSync('searchResultData', formattedData)

							this.updateFilterCounts()

							// 应用初始筛选或搜索
							if (this.initialFilter === 'today') {
								this.filterByToday()
							} else if (this.initialFilter === 'todayVisit') {
								this.filterByTodayVisit()
							} else if (this.searchKeyword) {
								this.performSearch()
							} else {
								this.sortByLatestTime()
							}

							// 如果有自动展开标记
							if (this.autoExpand && this.autoExpandEnterTime) {
								this.$nextTick(() => {
									setTimeout(() => {
										this.autoExpandTargetRecord()
									}, 500)
								})
							}
						} else {
							console.warn('⚠️ [数据加载] 没有找到数据')
							uni.showToast({
								title: '没有找到预约记录',
								icon: 'none',
								duration: 2000
							})
						}
					}

					uni.hideLoading()
					this.isLoadingData = false
				})
				.catch(err => {
					console.error('❌ [数据加载] 加载数据失败:', err)
					uni.hideLoading()
					this.isLoadingData = false
					uni.showToast({
						title: '加载数据失败，请重试',
						icon: 'none',
						duration: 2000
					})
				})
		},

		// === 排序方法 ===
		sortByLatestTime() {
			if (!this.reservationList || !Array.isArray(this.reservationList)) {
				return
			}
			this.reservationList.sort((a, b) => {
				const recordDateDiff = this.parseDate(b.recorddate || b.recordDate) - this.parseDate(a.recorddate || a.recordDate)
				return recordDateDiff
			})
		},

		// === 数据格式化方法 ===
		// 格式化API返回的预约数据
		formatAppointmentData(apiData) {
			if (!Array.isArray(apiData)) {
				return []
			}

			return apiData.map(item => {
				return {
					time: item.recorddate || item.visitdate || '',
					name: item.visitorname || '',
					phone: item.visitorphone || '',
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
					ownerPhone: item.ownerphone || '',
					visitorName: item.visitorname || '',
					ownerName: item.ownername || '',
					// 🆕 数据来源标识
					dataSource: item.dataSource || 'miniprogram',
					// 🆕 后台录入预约专用字段
					notifierName: item.notifiername || '',
					remark: item.remark || '',
					isManualRelease: item.isManualRelease || false,
					releaseTime: item.releaseTime || '',
					appointmentTime: item.visitdate || ''
				}
			})
		},

		// 将API状态映射为页面状态
		mapApiStatus(status) {
			if (!status) return '待审核'

			const statusMap = {
				'0': '待审核',
				'1': '已通过',
				'2': '未通过',
				'待审核': '待审核',
				'已通过': '已通过',
				'未通过': '未通过',
				'已审核': '已通过'
			}

			return statusMap[status] || status
		},

		// 格式化地址信息
		formatAddress(item) {
			if (item.addressDetail) return item.addressDetail
			if (item.address) return item.address
			if (item.address_detail) return item.address_detail

			let address = ''

			if (item.community) {
				address += item.community
			}

			if (item.building || item.buildingNo || item.building_no) {
				const building = item.building || item.buildingNo || item.building_no
				address += (address ? ' ' : '') + building + '栋'
			}

			if (item.units || item.unit) {
				const unit = item.units || item.unit
				address += unit + '单元'
			}

			if (item.floor) {
				address += item.floor + '层'
			}

			if (item.room || item.roomNo || item.room_no) {
				const room = item.room || item.roomNo || item.room_no
				address += room + '号'
			}

			return address.trim() || '未知地址'
		},

		// 获取车辆状态
		getVehicleStatus(item) {
			if (item.venuestatus) {
				return item.venuestatus
			}

			if (item.arrivedate && item.leavedate) {
				return '已离场'
			} else if (item.arrivedate) {
				return '已进场'
			} else {
				return '未进场'
			}
		},

		// === 搜索历史管理方法 ===
		saveSearchHistory(keyword, type = 'keyword') {
			try {
				if (!keyword || !keyword.trim()) return

				let history = uni.getStorageSync('search_history') || []
				const existingIndex = history.findIndex(item => item.keyword === keyword)

				if (existingIndex !== -1) {
					history[existingIndex].count = (history[existingIndex].count || 1) + 1
					history[existingIndex].time = Date.now()
				} else {
					history.unshift({
						keyword: keyword.trim(),
						type: type,
						time: Date.now(),
						count: 1
					})
				}

				if (history.length > 20) {
					history = history.slice(0, 20)
				}

				uni.setStorageSync('search_history', history)
			} catch (error) {
				console.error('保存搜索历史失败:', error)
			}
		},

		// 使用历史搜索
		useHistorySearch(item) {
			if (item && item.keyword) {
				this.searchKeyword = item.keyword
				this.performSearch()
				this.saveSearchHistory(item.keyword, item.type)
			}
		},

		// 清空搜索历史
		clearSearchHistory() {
			uni.showModal({
				title: '确认清空',
				content: '确定要清空所有搜索历史吗？',
				success: (res) => {
					if (res.confirm) {
						uni.removeStorageSync('search_history')
						this.searchHistory = []
						uni.showToast({
							title: '已清空',
							icon: 'success'
						})
					}
				}
			})
		},

		// 删除单条搜索历史
		removeSearchHistory(index) {
			this.searchHistory.splice(index, 1)
			uni.setStorageSync('search_history', this.searchHistory)
		},

		// 格式化历史时间
		formatHistoryTime(timestamp) {
			if (!timestamp) return ''
			const now = Date.now()
			const diff = now - timestamp

			if (diff < 60000) return '刚刚'
			if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
			if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
			return `${Math.floor(diff / 86400000)}天前`
		},

		// 获取历史图标
		getHistoryIcon(type) {
			const icons = {
				plate: '🚗',
				name: '👤',
				phone: '📱',
				address: '📍',
				keyword: '🔍'
			}
			return icons[type] || '🔍'
		},

		// 自动展开目标记录（从超时提醒跳转过来时使用）
		autoExpandTargetRecord() {
			if (!this.autoExpandEnterTime) {
				console.log('⏭️ [自动展开] 没有指定进场时间，跳过')
				return
			}

			console.log('🔍 [自动展开] 开始查找进场时间:', this.autoExpandEnterTime)
			console.log('🔍 [自动展开] 当前列表数据:', this.reservationList.length, '条')

			// 打印所有记录的进场时间，便于调试
			this.reservationList.forEach((item, index) => {
				console.log(`📋 [记录${index}] 车牌:${item.plateNumber}, 进场时间:${item.entryTime}`)
			})

			// 在搜索结果中查找匹配的记录
			const targetIndex = this.reservationList.findIndex(item => {
				const entryTime = item.entryTime || ''
				console.log(`🔍 [匹配] 比较 "${entryTime}" 与 "${this.autoExpandEnterTime}"`)
				
				// 跳过进场时间为空的记录
				if (!entryTime) {
					console.log('⏭️ [匹配] 记录进场时间为空，跳过')
					return false
				}
				
				// 精确匹配进场时间
				if (entryTime === this.autoExpandEnterTime) {
					console.log('✅ [匹配] 精确匹配成功')
					return true
				}
				// 模糊匹配（兼容不同格式）
				if (entryTime.includes(this.autoExpandEnterTime)) {
					console.log('✅ [匹配] 模糊匹配成功')
					return true
				}
				// 反向匹配（时间参数包含数据库时间）
				if (this.autoExpandEnterTime.includes(entryTime)) {
					console.log('✅ [匹配] 反向匹配成功')
					return true
				}
				return false
			})

			if (targetIndex !== -1) {
				console.log('✅ [自动展开] 找到目标记录，索引:', targetIndex)
				console.log('✅ [自动展开] 目标记录详情:', this.reservationList[targetIndex])

				// 展开该记录（false表示展开，true表示折叠）
				this.$set(this.itemCollapseStates, targetIndex, false)
				console.log('✅ [自动展开] 已设置展开状态:', this.itemCollapseStates[targetIndex])

				// 滚动到目标记录（延迟执行，确保DOM已更新）
				setTimeout(() => {
					// 使用页面滚动而不是选择器查询
					const scrollTop = targetIndex * 350  // 估算每个卡片的高度
					uni.pageScrollTo({
						scrollTop: scrollTop,
						duration: 300
					})
					console.log('📜 [自动展开] 已滚动到目标记录')
				}, 500)

				// 提示用户
				uni.showToast({
					title: '已定位到超时车辆',
					icon: 'success',
					duration: 2000
				})
			} else {
				console.log('⚠️ [自动展开] 未找到匹配的记录')
				console.log('⚠️ [自动展开] 搜索关键词:', this.searchKeyword)
				console.log('⚠️ [自动展开] 目标进场时间:', this.autoExpandEnterTime)
				uni.showToast({
					title: '未找到对应记录',
					icon: 'none',
					duration: 2000
				})
			}

			// 清除标记，避免重复执行
			this.autoExpandEnterTime = null
		},

		// 启动动态停车时长更新定时器
		startParkingDurationTimer() {
			this.stopParkingDurationTimer()

			this.parkingDurationTimer = setInterval(() => {
				this.updateDynamicParkingDuration()
			}, 60000)
		},

		// 停止动态停车时长更新定时器
		stopParkingDurationTimer() {
			if (this.parkingDurationTimer) {
				clearInterval(this.parkingDurationTimer)
				this.parkingDurationTimer = null
			}
		},

		// 更新动态停车时长
		updateDynamicParkingDuration() {
			if (this.reservationList && this.reservationList.length > 0) {
				const hasActiveParkingRecords = this.reservationList.some(item =>
					item.entryTime && !item.leaveTime &&
					(item.vehicleStatus === '已进场' || item.vehicleStatus === '已入场')
				)

				if (hasActiveParkingRecords) {
					this.sortByLatestTime()
				}
			}
		},

		// === 其他辅助方法 ===
		// 更新统计数据
		updateStatistics() {
			this.updateFilterCounts()
		},

		// 显示筛选结果提示
		showFilterResultToast() {
			const count = this.reservationList ? this.reservationList.length : 0
			uni.showToast({
				title: `筛选出 ${count} 条记录`,
				icon: count > 0 ? 'success' : 'none',
				duration: 1500
			})
		},

		// 触摸事件处理
		handleTouchStart() {
			this.userInteracting = true
		},

		handleTouchEnd() {
			this.userInteracting = false
		}
	}
}
</script>

<style lang="scss" scoped>
/* dataList 页面特定样式 */
.intelligent-search-section {
	background: #ffffff;
	border-radius: 20rpx;
	padding: 30rpx;
	padding-top: 30rpx;
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

		&:active {
			transform: scale(0.95);
			box-shadow: 0 1rpx 4rpx rgba(102, 126, 234, 0.4);
		}
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

/* 搜索容器样式 */
.smart-search-container {
	position: relative;
	width: 100%;
	margin-bottom: 16rpx;
}

.search-input-wrapper {
	position: relative;
	width: 100%;
	background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
	border-radius: 50rpx;
	padding: 8rpx 16rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
	border: 2rpx solid #E4E7ED;
	transition: all 0.3s ease;

	&:focus-within {
		border-color: #409EFF;
		box-shadow: 0 6rpx 16rpx rgba(64, 158, 255, 0.2);
	}
}

.search-input {
	width: 100%;
	height: 64rpx;
	font-size: 28rpx;
	color: #303133;
	background: transparent;
	border: none;
	padding: 0 160rpx 0 20rpx;
	box-sizing: border-box;
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

/* 搜索建议下拉框样式 */
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
	overflow: hidden;
	max-height: 50vh;

	.suggestions-scroll {
		max-height: 320rpx;
		overflow-y: auto;
		scrollbar-width: thin;
		scrollbar-color: rgba(64, 158, 255, 0.5) rgba(240, 240, 240, 0.3);

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
		}
	}

	.suggestion-item {
		display: flex;
		align-items: center;
		padding: 16rpx 20rpx;
		border-bottom: 1rpx solid #f8f9fa;
		transition: all 0.3s ease;

		&:last-child {
			border-bottom: none;
		}

		&:active {
			background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
			transform: scale(0.98);
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
				margin-bottom: 4rpx;
			}

			.suggestion-type {
				font-size: 22rpx;
				color: #909399;
			}
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

/* 搜索历史样式 */
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

/* 今日数据看板样式 */
.today-dashboard {
	background: linear-gradient(135deg, #ffffff 0%, #fcfcfd 100%);
	border-radius: 20rpx;
	margin: 8rpx 0 16rpx 0;
	box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.04);
	border: 1rpx solid rgba(64, 158, 255, 0.05);
	overflow: hidden;
	flex-shrink: 0;

	.dashboard-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 24rpx;
		background: #f8f9fa;
		color: #333333;
		border-bottom: 1rpx solid #e9ecef;

		.dashboard-title {
			display: flex;
			align-items: center;
			gap: 12rpx;

			text {
				font-size: 32rpx;
				font-weight: bold;
			}
		}
	}

	.dashboard-content {
		padding: 24rpx;

		.section-title {
			font-size: 28rpx;
			font-weight: bold;
			color: #333333;
			margin-bottom: 16rpx;
			padding-bottom: 8rpx;
			border-bottom: 2rpx solid #f0f0f0;
		}
	}

	.stats-section {
		margin-bottom: 24rpx;

		.stats-grid {
			display: flex;
			justify-content: space-between;
			gap: 16rpx;

			.stat-item {
				flex: 1;
				background: linear-gradient(135deg, #f8f9fa, #e9ecef);
				border-radius: 12rpx;
				padding: 20rpx;
				text-align: center;
				box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
				border: 1rpx solid #dee2e6;
				position: relative;

				&.clickable-stat {
					cursor: pointer;
					transition: all 0.3s ease;
					border: 2rpx solid #dee2e6;
					overflow: hidden;

					&:active {
						transform: translateY(-2rpx);
						box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.12);
					}

					&.active {
						background: linear-gradient(135deg, #409EFF, #67C23A);
						border-color: #409EFF;
						box-shadow: 0 8rpx 24rpx rgba(64, 158, 255, 0.4);
						transform: translateY(-4rpx);

						.stat-value,
						.stat-label,
						.stat-trend,
						.stat-urgent,
						.stat-vehicle {
							color: #ffffff;
						}

						.click-indicator {
							opacity: 0;
						}
					}

					.click-indicator {
						position: absolute;
						top: 8rpx;
						right: 8rpx;
						width: 24rpx;
						height: 24rpx;
						background: rgba(64, 158, 255, 0.2);
						border-radius: 50%;
						display: flex;
						align-items: center;
						justify-content: center;
						font-size: 12rpx;
						opacity: 0.7;
						transition: all 0.3s ease;

						.icon-emoji {
							font-size: 16rpx;
						}
					}
				}

				.stat-value {
					display: block;
					font-size: 36rpx;
					font-weight: bold;
					color: #409EFF;
					margin-bottom: 8rpx;
					transition: color 0.3s ease;
				}

				.stat-label {
					display: block;
					font-size: 24rpx;
					color: #606266;
					margin-bottom: 6rpx;
					transition: color 0.3s ease;
				}

				.stat-trend {
					font-size: 22rpx;
					font-weight: bold;
					transition: color 0.3s ease;

					&.trend-up {
						color: #67C23A;
					}

					&.trend-down {
						color: #F56C6C;
					}

					&.trend-stable {
						color: #909399;
					}
				}

				.stat-urgent {
					font-size: 20rpx;
					color: #E6A23C;
					font-weight: 600;
					transition: color 0.3s ease;
				}

				.stat-vehicle {
					font-size: 20rpx;
					color: #409EFF;
					font-weight: 600;
					transition: color 0.3s ease;
				}
			}
		}
	}

	.efficiency-section {
		.efficiency-content {
			.progress-item {
				display: flex;
				align-items: center;
				gap: 16rpx;
				margin-bottom: 16rpx;

				.progress-label {
					font-size: 24rpx;
					color: #606266;
					white-space: nowrap;
				}

				.progress-bar {
					flex: 1;
					height: 12rpx;
					background: #f0f0f0;
					border-radius: 6rpx;
					overflow: hidden;

					.progress-fill {
						height: 100%;
						background: linear-gradient(90deg, #409EFF 0%, #67C23A 100%);
						border-radius: 6rpx;
						transition: width 0.8s ease;
					}
				}

				.progress-percent {
					font-size: 24rpx;
					font-weight: bold;
					color: #409EFF;
					white-space: nowrap;
				}
			}

			.efficiency-stats {
				display: flex;
				justify-content: space-between;
				gap: 16rpx;

				.efficiency-stat {
					flex: 1;
					font-size: 22rpx;
					color: #909399;
					background: #f8f9fa;
					padding: 12rpx;
					border-radius: 8rpx;
					text-align: center;
				}
			}
		}
	}
}

/* 智能筛选器样式 */
.smart-filter {
	background: linear-gradient(135deg, #ffffff 0%, #fcfcfd 100%);
	border-radius: 20rpx;
	margin: 8rpx 0 16rpx 0;
	box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.04);
	overflow: hidden;
	flex-shrink: 0;

	.filter-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 24rpx;
		background: #f8f9fa;
		border-bottom: 1rpx solid #e9ecef;

		.filter-title {
			font-size: 32rpx;
			font-weight: bold;
		}
	}

	.filter-content {
		padding: 24rpx;
	}

	.filter-section {
		margin-bottom: 24rpx;

		&:last-child {
			margin-bottom: 0;
		}

		.filter-section-title {
			font-size: 26rpx;
			font-weight: bold;
			color: #333333;
			margin-bottom: 16rpx;
			display: flex;
			align-items: center;
			gap: 8rpx;
		}
	}

	.time-filter-tags,
	.status-filter-tags,
	.vehicle-filter-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 12rpx;
	}

	.time-tag,
	.status-tag,
	.vehicle-tag {
		padding: 14rpx 24rpx;
		border-radius: 28rpx;
		border: 3rpx solid #e9ecef;
		background: linear-gradient(135deg, #ffffff, #f8f9fa);
		transition: all 0.3s ease;
		cursor: pointer;

		&.active {
			color: #ffffff;
			background: linear-gradient(135deg, #409EFF, #67C23A);
			border-color: #409EFF;
		}

		.tag-text {
			font-size: 24rpx;
			font-weight: 600;
		}

		.tag-count {
			font-size: 22rpx;
			font-weight: bold;
			padding: 6rpx 12rpx;
			border-radius: 16rpx;
		}
	}

	.filter-actions {
		display: flex;
		justify-content: space-between;
		gap: 16rpx;
		margin-top: 32rpx;
		padding-top: 24rpx;
		border-top: 2rpx solid #f0f0f0;

		.reset-filter,
		.apply-filter {
			padding: 16rpx 32rpx;
			border-radius: 24rpx;
			font-size: 26rpx;
			font-weight: bold;
			transition: all 0.3s ease;

			&:active {
				transform: scale(0.98);
			}
		}

		.apply-filter {
			background: linear-gradient(135deg, #667eea, #764ba2);
			color: #ffffff;
		}
	}
}

/* 列表控制头部样式 */
.list-control-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 16rpx 20rpx;
	margin-bottom: 16rpx;
	background: linear-gradient(135deg, #f8fafc, #f1f5f9);
	border-radius: 12rpx;
	border: 1rpx solid rgba(148, 163, 184, 0.1);

	.list-title {
		display: flex;
		align-items: center;
		font-size: 28rpx;
		font-weight: 600;
		color: #334155;

		.list-count {
			margin-left: 8rpx;
			font-size: 24rpx;
			color: #64748b;
			font-weight: 400;
		}
	}

	.list-actions {
		display: flex;
		gap: 12rpx;

		.action-btn {
			display: flex;
			align-items: center;
			padding: 8rpx 12rpx;
			background: linear-gradient(135deg, #ffffff, #f8fafc);
			border-radius: 16rpx;
			border: 1rpx solid rgba(148, 163, 184, 0.2);
			font-size: 22rpx;
			color: #475569;
			transition: all 0.3s ease;
			cursor: pointer;

			&:active {
				transform: translateY(0);
				box-shadow: 0 2rpx 6rpx rgba(148, 163, 184, 0.3);
			}

			text {
				font-weight: 500;
			}
		}
	}
}

.detail-info-section {
	margin-top: 12rpx;
	animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
	from {
		opacity: 0;
		transform: translateY(-10rpx);
	}

	to {
		opacity: 1;
		transform: translateY(0);
	}
}

/* 🆕 后台录入数据专用卡片样式 */
.backend-detail-card {
	background: linear-gradient(135deg, #fefefe 0%, #f5f3ff 50%, #ede9fe 100%);
	border-radius: 20rpx;
	padding: 0;
	margin: 24rpx 16rpx;
	border: none;
	box-shadow: 0 8rpx 32rpx rgba(139, 92, 246, 0.15),
		0 4rpx 12rpx rgba(139, 92, 246, 0.1),
		inset 0 1rpx 0 rgba(255, 255, 255, 0.8);
	position: relative;
	overflow: hidden;

	/* 顶部渐变装饰条 */
	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 8rpx;
		background: linear-gradient(90deg, #7c3aed, #8b5cf6, #a78bfa, #c4b5fd);
		background-size: 200% 100%;
		animation: gradientMove 3s ease infinite;
	}

	/* 左侧装饰条 */
	&::after {
		content: '';
		position: absolute;
		left: 0;
		top: 8rpx;
		bottom: 0;
		width: 6rpx;
		background: linear-gradient(180deg, #8b5cf6, #a78bfa, #c4b5fd);
	}

	.info-row {
		display: flex;
		align-items: center;
		padding: 20rpx 24rpx 20rpx 32rpx;
		margin: 0;
		background: transparent;
		border-bottom: 1rpx solid rgba(139, 92, 246, 0.08);
		transition: all 0.25s ease;
		position: relative;

		&:last-child {
			border-bottom: none;
		}

		&:first-child {
			padding-top: 28rpx;
		}

		/* 悬停效果 */
		&:active {
			background: rgba(139, 92, 246, 0.06);
		}

		.info-label {
			display: flex;
			align-items: center;
			min-width: 180rpx;
			flex-shrink: 0;

			.icon-emoji {
				font-size: 36rpx;
				margin-right: 8rpx;
				filter: drop-shadow(0 2rpx 4rpx rgba(0, 0, 0, 0.1));
			}

			.label-text {
				font-size: 26rpx;
				color: #7c3aed;
				font-weight: 600;
				letter-spacing: 1rpx;
			}
		}

		.info-value {
			flex: 1;
			font-size: 28rpx;
			color: #1e1b4b;
			font-weight: 600;
			word-break: break-all;
			padding: 10rpx 16rpx;
			background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(245, 243, 255, 0.8));
			border-radius: 12rpx;
			border: 1rpx solid rgba(139, 92, 246, 0.12);
			box-shadow: 0 2rpx 8rpx rgba(139, 92, 246, 0.06);

			&.remark-text {
				color: #6b7280;
				font-weight: 500;
				font-size: 26rpx;
				background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(167, 139, 250, 0.06));
				padding: 12rpx 16rpx;
				font-style: italic;
				border: 1rpx dashed rgba(139, 92, 246, 0.2);
			}
		}
	}
}

/* 渐变动画 */
@keyframes gradientMove {
	0% {
		background-position: 0% 50%;
	}

	50% {
		background-position: 100% 50%;
	}

	100% {
		background-position: 0% 50%;
	}
}

/* 联系人信息卡片 */
.contact-info-card {
	background: linear-gradient(135deg, #f9fdfb, #f0fdf4);
	border-radius: 12rpx;
	padding: 12rpx 16rpx;
	margin: 8rpx 0;
	border: 1rpx solid rgba(34, 197, 94, 0.1);
	box-shadow: 0 2rpx 8rpx rgba(34, 197, 94, 0.06);

	.contact-header {
		display: flex;
		align-items: center;
		gap: 10rpx;
		margin-bottom: 16rpx;

		.contact-title {
			font-size: 26rpx;
			font-weight: 600;
			color: #166534;
		}
	}

	.contact-details {
		display: flex;
		flex-direction: column;
		gap: 12rpx;

		.contact-item {
			display: flex;
			justify-content: space-between;
			align-items: center;

			.contact-label {
				display: flex;
				align-items: center;
				gap: 8rpx;

				.label-text {
					font-size: 24rpx;
					color: #166534;
					font-weight: 500;
				}
			}

			.contact-value {
				font-size: 26rpx;
				color: #15803d;
				font-weight: 600;

				&.clickable {
					color: #2563eb;
					text-decoration: underline;
					cursor: pointer;
				}

				&.no-data {
					color: #999;
					font-style: italic;
					font-weight: 400;
				}
			}
		}
	}
}

/* 预约时间信息卡片 */
.appointment-time-card {
	background: linear-gradient(135deg, #f0f7ff, #e6f7ff);
	border-radius: 12rpx;
	padding: 12rpx 16rpx;
	margin: 8rpx 0;
	border: 1rpx solid rgba(37, 99, 235, 0.1);
	box-shadow: 0 2rpx 8rpx rgba(37, 99, 235, 0.06);
}

/* 停车信息卡片 */
.parking-info-card {
	background: linear-gradient(135deg, #fef3c7, #fde68a);
	border-radius: 16rpx;
	padding: 16rpx 20rpx;
	margin: 8rpx 0;
	border: 2rpx solid rgba(245, 158, 11, 0.15);
	box-shadow: 0 4rpx 12rpx rgba(245, 158, 11, 0.08);

	.parking-header {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		margin-bottom: 12rpx;
		gap: 12rpx;
		padding: 10rpx 14rpx;
		background: rgba(255, 255, 255, 0.5);
		border-radius: 12rpx;

		.icon-emoji {
			font-size: 36rpx;
		}

		.parking-title {
			font-size: 28rpx;
			font-weight: 600;
			color: #b45309;
			flex: 1;
		}

		.parking-status-badge {
			padding: 8rpx 16rpx;
			border-radius: 24rpx;
			font-size: 24rpx;
			font-weight: 600;
			background: rgba(34, 197, 94, 0.15);
			color: #16a34a;
			display: flex;
			align-items: center;
			gap: 6rpx;

			&.completed {
				background: rgba(34, 197, 94, 0.15);
				color: #16a34a;
			}

			.status-dot {
				font-size: 20rpx;
			}
		}
	}

	.parking-details {
		display: flex;
		flex-direction: column;
		gap: 8rpx;

		.detail-row {
			display: flex;
			align-items: center;
			gap: 8rpx;
			padding: 8rpx 12rpx;
			background: rgba(255, 255, 255, 0.6);
			border-radius: 8rpx;
			transition: all 0.3s ease;

			&:active {
				background: rgba(255, 255, 255, 0.9);
				transform: scale(0.98);
			}

			&.primary {
				background: rgba(245, 158, 11, 0.1);
				border: 2rpx solid rgba(245, 158, 11, 0.2);
			}

			.detail-icon {
				font-size: 28rpx;
				flex-shrink: 0;
			}

			.detail-label {
				display: flex;
				align-items: center;
				gap: 4rpx;
				min-width: 90rpx;
				flex-shrink: 0;

				.detail-text {
					font-size: 22rpx;
					color: #d97706;
					font-weight: 600;
				}
			}

			.detail-value {
				flex: 1;
				font-size: 26rpx;
				color: #92400e;
				font-weight: 600;
				text-align: right;

				&.primary-value {
					font-size: 28rpx;
					font-weight: 700;
					color: #d97706;

					&.in-parking {
						color: #16a34a;
						animation: pulse 2s infinite;
					}

					&.completed {
						color: #dc2626;
					}
				}
			}
		}
	}
}

@keyframes pulse {

	0%,
	100% {
		opacity: 1;
	}

	50% {
		opacity: 0.7;
	}
}

/* 车牌样式 */
.plate-number {
	display: inline-block;
	font-size: 30rpx;
	font-weight: bold;
	padding: 8rpx 20rpx;
	border-radius: 10rpx;
	font-family: "微软雅黑";
	letter-spacing: 2rpx;
	min-width: 180rpx;
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

/* 数据来源标签样式 */
.data-source-badge {
	display: inline-flex;
	align-items: center;
	padding: 6rpx 16rpx;
	border-radius: 8rpx;
	font-size: 22rpx;
	margin-left: 12rpx;

	&.source-backend {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #FFFFFF;
		border: 1px solid #667eea;
	}

	.source-icon {
		font-size: 24rpx;
		margin-right: 6rpx;
	}

	.source-text {
		font-weight: 500;
		line-height: 1;
	}
}

/* 🆕 数据来源Tab切换样式 */
.source-tabs {
	display: flex;
	background: #f5f7fa;
	border-radius: 12rpx;
	padding: 8rpx;
	margin: 20rpx 0;

	.tab-item {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16rpx 12rpx;
		border-radius: 10rpx;
		transition: all 0.3s ease;
		cursor: pointer;

		.tab-icon {
			font-size: 28rpx;
			margin-right: 6rpx;
		}

		.tab-text {
			font-size: 26rpx;
			color: #606266;
			font-weight: 500;
		}

		.tab-count {
			font-size: 22rpx;
			color: #909399;
			margin-left: 4rpx;
		}

		&.active {
			background: #ffffff;
			box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);

			.tab-text {
				color: #409EFF;
				font-weight: 600;
			}

			.tab-count {
				color: #409EFF;
			}
		}

		&:active {
			opacity: 0.8;
		}
	}
}

/* 自定义导航栏样式 */
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
}

.navbar-title {
	position: absolute;
	left: 50%;
	transform: translateX(-50%);
	font-size: 36rpx;
	font-weight: 600;
	color: white;
	text-align: center;
}

/* === 数据列表相关样式 === */
/* 容器样式 */
.container {
	padding: 24rpx;
	background: linear-gradient(135deg, #fafbfc 0%, #f5f6f7 100%);
	min-height: 100vh;
	display: flex;
	flex-direction: column;
}

.data-list {
	background: linear-gradient(135deg, #fbfcfd 0%, #f8fafb 100%);
	padding: 20rpx;
}

/* 状态标签样式 */
.status-row {
	/deep/ .u-tag {
		&--success {
			background-image: linear-gradient(to top, #0ba360 0%, #3cba92 100%);
			color: #fff !important;
		}

		&--warning {
			background: linear-gradient(to right, rgb(240, 0, 0), rgb(220, 40, 30));
			color: #fff !important;
		}

		&--info {
			background: linear-gradient(45deg, #2196F3, #42A5F5);
			color: #fff !important;
		}
	}
}

/* 时间信息样式 */
.time-info {
	.time-item {
		display: flex;
		align-items: center;
		margin: 12rpx 0;

		text {
			margin-left: 10rpx;
			color: #666;
			font-size: 14px;
		}

		.duration {
			color: #2196F3;
			margin-left: 15rpx;
			font-weight: bold;
		}
	}
}

/* 状态条样式 */
.status-bar {
	position: absolute;
	left: 0;
	top: 0;
	width: 8rpx;
	height: 100%;

	&.exited {
		background: #f56c6c;
	}

	&.entered {
		background: #67c23a;
	}

	&.pending {
		background: #909399;
	}
}

/* 时间线容器 */
.timeline-container {
	margin: 30rpx 0;

	.timeline-node {
		padding: 16rpx;
		border-radius: 8rpx;
		background: #f8f9fa;

		&.entry {
			border-left: 4rpx solid #67c23a;
		}

		&.exit {
			border-left: 4rpx solid #f56c6c;
		}

		.time-label {
			font-size: 24rpx;
			color: #909399;
		}

		.time-value {
			display: block;
			font-size: 28rpx;
			color: #333;
			margin-top: 8rpx;
		}

		.duration {
			color: #409eff;
			font-weight: bold;
		}
	}
}

/* 车牌和地址高亮 */
.highlight-plate {
	background-color: #f5f7ff;
	border-radius: 8rpx;
	padding: 12rpx;
	margin: 16rpx 0;
}

.address-row {
	border-left: 4rpx solid #FF5722;
	padding-left: 16rpx;
	margin-top: 20rpx;
}

/* 卡片样式 */
.card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	background: #fafbfc !important;
	border-bottom: 1px dashed rgba(200, 200, 200, 0.5);
}

.card-body {
	.info-row {
		display: flex;
		align-items: center;
		margin: 16rpx 0;

		&>view {
			margin-right: 30rpx;
		}
	}
}

/* 预约时间容器 */
.appointment-time-container {
	display: flex;
	align-items: center;
	background: linear-gradient(to right, #f0f7ff, #e6f7ff);
	border-radius: 8rpx;
	padding: 8rpx 16rpx;
	margin-right: 10rpx;
}

/* 筛选工具区域 */
.filter-tools {
	background: #fff;
	border-radius: 12rpx;
	margin-bottom: 12rpx;
	padding: 16rpx;
	overflow: hidden;
}

.filter-tools-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12rpx 0;
	border-bottom: 1px solid #f2f2f2;
}

.filter-tools-title {
	display: flex;
	align-items: center;

	text {
		font-size: 28rpx;
		font-weight: 600;
		color: #333;
		margin-left: 8rpx;
	}
}

.filter-tools-content {
	padding: 14rpx;
	transition: all 0.3s ease;
}

.filter-tools.compact {
	margin-bottom: 12rpx;
}

/* 时间筛选标签 */
.time-filter {
	background: #fff;
	border-radius: 16rpx;
	padding: 20rpx;
	margin-bottom: 24rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.time-filter-tags {
	margin-top: 16rpx;
	background: #ffffff;
	border-radius: 12rpx;
	padding: 16rpx;
	box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.03);
}

.time-tags-wrap {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
}

.time-tag {
	transition: all 0.2s ease;
}

.time-tag-active {
	background-color: #e8f4ff !important;
	color: #2979ff !important;
	border-color: #2979ff !important;
	font-weight: bold;
}

.status-tags {
	margin: 24rpx 0;
}

/* 折叠按钮 */
.collapse-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 64rpx;
	height: 64rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
	cursor: pointer;
	transition: all 0.3s ease;

	&:active {
		transform: scale(0.95);
	}

	.expand-icon {
		font-size: 24rpx;
		color: #64748b;
		transition: transform 0.3s ease;

		&.expanded {
			transform: rotate(180deg);
		}
	}
}

.copy-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 64rpx;
	height: 64rpx;
	border-radius: 50%;
	margin-right: 12rpx;
	background: linear-gradient(135deg, #e0f2fe, #bae6fd);
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
	cursor: pointer;
	transition: all 0.3s ease;

	&:active {
		transform: scale(0.95);
	}

	.copy-icon {
		font-size: 24rpx;
		color: #0284c7;
	}
}

/* 统计仪表盘 */
.statistics-dashboard {
	background: #fff;
	border-radius: 12rpx;
	padding: 16rpx;
	margin-bottom: 12rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.statistics-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12rpx;
	border-bottom: 1px solid #f2f2f2;
	padding-bottom: 10rpx;
}

.statistics-title {
	font-size: 30rpx;
	font-weight: bold;
	color: #333;
}

.refresh-button {
	display: flex;
	align-items: center;
	font-size: 24rpx;
	color: #909399;

	text {
		margin-left: 6rpx;
	}
}

.statistics-cards {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
	margin-bottom: 12rpx;
}

.stat-card {
	width: 31%;
	background: #f8f9fa;
	border-radius: 10rpx;
	padding: 12rpx;
	margin-bottom: 10rpx;
	position: relative;
	overflow: hidden;
	box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.05);

	&:active {
		opacity: 0.8;
	}
}

.stat-value {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 4rpx;
}

.stat-label {
	font-size: 24rpx;
	color: #606266;
}

.stat-indicator {
	position: absolute;
	top: 0;
	left: 0;
	width: 8rpx;
	height: 100%;

	&.total {
		background: linear-gradient(to bottom, #3F51B5, #303F9F);
	}

	&.pending {
		background: linear-gradient(to bottom, #FFC107, #FF9800);
	}

	&.approved {
		background: linear-gradient(to bottom, #4CAF50, #2E7D32);
	}

	&.rejected {
		background: linear-gradient(to bottom, #F44336, #C62828);
	}

	&.entered {
		background: linear-gradient(to bottom, #2196F3, #1565C0);
	}

	&.exited {
		background: linear-gradient(to bottom, #9C27B0, #6A1B9A);
	}
}

.today-summary {
	background: #f8f9fa;
	border-radius: 10rpx;
	padding: 12rpx;
}

.summary-header {
	display: flex;
	justify-content: space-between;
	font-size: 24rpx;
	color: #606266;
	margin-bottom: 8rpx;
}

.summary-date {
	color: #909399;
	font-size: 24rpx;
}

.summary-content {
	display: flex;
	align-items: center;
	justify-content: space-around;
}

.summary-item {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.summary-label {
	font-size: 22rpx;
	color: #909399;
	margin-bottom: 4rpx;
}

.summary-value {
	font-size: 28rpx;
	font-weight: bold;
	color: #2979ff;
}

.summary-divider {
	color: #e0e0e0;
	margin: 0 10rpx;
}

.summary-ratio {
	font-size: 20rpx;
	color: #909399;
	margin-top: 4rpx;
}

/* 用户统计视图 */
.user-statistics {
	background: #fff;
	border-radius: 12rpx;
	padding: 20rpx;
	margin: 20rpx 0;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.user-statistics-header {
	margin-bottom: 20rpx;
	border-bottom: 1px solid #f2f2f2;
	padding-bottom: 16rpx;
}

.user-status-chart {
	padding: 16rpx 0;
}

.status-progress {
	margin-bottom: 20rpx;
}

.status-segment {
	height: 100%;
	transition: all 0.3s ease;

	&.pending {
		background: #FFC107;
	}

	&.approved {
		background: #4CAF50;
	}

	&.rejected {
		background: #F44336;
	}
}

/* === 车牌号样式 === */
.plate-number {
	display: inline-block;
	font-size: 30rpx;
	font-weight: bold;
	padding: 8rpx 20rpx;
	border-radius: 10rpx;
	font-family: "微软雅黑";
	letter-spacing: 2rpx;
	min-width: 180rpx;
	text-align: center;
	flex-shrink: 0;
	white-space: nowrap;

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

	.plate-text {
		font-family: "微软雅黑";
		letter-spacing: 2rpx;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
}

.plate-actions-inline {
	display: flex;
	align-items: center;
	gap: 8rpx;
	flex: 1;
	justify-content: flex-end;
}

/* === 详细信息区域 === */
.detail-info-section {
	margin-top: 12rpx;
	animation: fadeIn 0.3s ease-in-out;
	border-top: 1px dashed #EEEEEE;
	padding-top: 16rpx;
	position: relative;
}

@keyframes fadeIn {
	from {
		opacity: 0;
		transform: translateY(-10rpx);
	}

	to {
		opacity: 1;
		transform: translateY(0);
	}
}

/* === 信息卡片样式 === */
/* 联系人信息卡片 */
.contact-info-card {
	background: linear-gradient(135deg, #f0fdf4, #dcfce7);
	border-radius: 12rpx;
	padding: 12rpx 16rpx;
	margin: 8rpx 0;
	border: 2rpx solid rgba(34, 197, 94, 0.15);
	box-shadow: 0 4rpx 12rpx rgba(34, 197, 94, 0.08);

	.info-row {
		display: flex;
		align-items: center;
		gap: 8rpx;
		margin-bottom: 8rpx;
		padding: 8rpx 12rpx;
		background: rgba(255, 255, 255, 0.6);
		border-radius: 8rpx;
		transition: all 0.3s ease;

		&:last-child {
			margin-bottom: 0;
		}

		&:active {
			background: rgba(255, 255, 255, 0.9);
			transform: scale(0.98);
		}

		.icon-emoji {
			font-size: 32rpx;
			flex-shrink: 0;
			line-height: 1;
		}

		.info-label {
			display: flex;
			align-items: center;
			gap: 4rpx;
			min-width: 110rpx;
			flex-shrink: 0;

			.label-text {
				font-size: 22rpx;
				color: #16a34a;
				font-weight: 600;
			}
		}

		.info-value {
			flex: 1;
			font-size: 26rpx;
			color: #1f2937;
			line-height: 1.4;
			font-weight: 500;
			word-wrap: break-word;

			&.clickable {
				color: #2563eb;
				text-decoration: underline;
				font-weight: 600;

				&:active {
					opacity: 0.7;
				}
			}

			&.no-data {
				color: #9ca3af;
				font-style: italic;
				font-weight: 400;
			}

			&.phone-number {
				font-family: 'Courier New', monospace;
				letter-spacing: 1rpx;
			}
		}
	}
}

/* 预约时间信息卡片 */
.appointment-time-card {
	background: linear-gradient(135deg, #eff6ff, #dbeafe);
	border-radius: 12rpx;
	padding: 12rpx 16rpx;
	margin: 8rpx 0;
	border: 2rpx solid rgba(59, 130, 246, 0.15);
	box-shadow: 0 4rpx 12rpx rgba(59, 130, 246, 0.08);

	.info-row {
		display: flex;
		align-items: center;
		gap: 8rpx;
		padding: 8rpx 12rpx;
		background: rgba(255, 255, 255, 0.6);
		border-radius: 8rpx;
		transition: all 0.3s ease;

		&:active {
			background: rgba(255, 255, 255, 0.9);
			transform: scale(0.98);
		}

		.icon-emoji {
			font-size: 32rpx;
			flex-shrink: 0;
			line-height: 1;
		}

		.info-label {
			display: flex;
			align-items: center;
			gap: 4rpx;
			min-width: 90rpx;
			flex-shrink: 0;

			.label-text {
				font-size: 22rpx;
				color: #3b82f6;
				font-weight: 600;
			}
		}

		.info-value {
			flex: 1;
			font-size: 26rpx;
			color: #1e40af;
			line-height: 1.4;
			font-weight: 600;
		}

		.appointment-time {
			font-weight: 600;
			color: #1e40af;
			font-size: 26rpx;
		}
	}
}

/* 预约详情卡片 */
.appointment-detail-card {
	background: linear-gradient(135deg, #fff5f7, #ffe4e6);
	border-radius: 12rpx;
	padding: 12rpx 16rpx;
	margin: 8rpx 0;
	border: 2rpx solid rgba(251, 113, 133, 0.15);
	box-shadow: 0 4rpx 12rpx rgba(251, 113, 133, 0.08);

	.info-row {
		display: flex;
		align-items: center;
		gap: 8rpx;
		margin-bottom: 8rpx;
		padding: 8rpx 12rpx;
		background: rgba(255, 255, 255, 0.6);
		border-radius: 8rpx;
		transition: all 0.3s ease;

		&:last-child {
			margin-bottom: 0;
		}

		&:active {
			background: rgba(255, 255, 255, 0.9);
			transform: scale(0.98);
		}

		.icon-emoji {
			font-size: 32rpx;
			flex-shrink: 0;
			line-height: 1;
		}

		.info-label {
			display: flex;
			align-items: center;
			gap: 4rpx;
			min-width: 90rpx;
			flex-shrink: 0;

			.label-text {
				font-size: 22rpx;
				color: #fb7185;
				font-weight: 600;
			}
		}

		.info-value {
			flex: 1;
			font-size: 26rpx;
			color: #1f2937;
			line-height: 1.4;
			font-weight: 500;
			word-wrap: break-word;

			&.reason-text {
				color: #374151;
				background: rgba(251, 113, 133, 0.05);
				padding: 8rpx 12rpx;
				border-radius: 6rpx;
				border-left: 3rpx solid #fb7185;
			}

			&.appoint-type {
				color: #059669;
				font-weight: 600;
				padding: 6rpx 12rpx;
				background: rgba(16, 185, 129, 0.1);
				border-radius: 20rpx;
				display: inline-block;
			}
		}
	}
}

/* 地址信息卡片 */
.address-info-card {
	background: linear-gradient(135deg, #fefcf3, #fef8e7);
	border-radius: 12rpx;
	padding: 12rpx 16rpx;
	margin: 8rpx 0;
	border: 2rpx solid rgba(245, 158, 11, 0.15);
	box-shadow: 0 4rpx 12rpx rgba(245, 158, 11, 0.08);

	.info-row {
		display: flex;
		align-items: center;
		gap: 8rpx;
		padding: 8rpx 12rpx;
		background: rgba(255, 255, 255, 0.6);
		border-radius: 8rpx;
		transition: all 0.3s ease;

		&:active {
			background: rgba(255, 255, 255, 0.9);
			transform: scale(0.98);
		}

		.icon-emoji {
			font-size: 32rpx;
			flex-shrink: 0;
			line-height: 1;
		}

		.info-label {
			display: flex;
			align-items: center;
			gap: 4rpx;
			min-width: 90rpx;
			flex-shrink: 0;

			.label-text {
				font-size: 22rpx;
				color: #d97706;
				font-weight: 600;
			}
		}

		.info-value {
			flex: 1;
			font-size: 26rpx;
			color: #92400e;
			font-weight: 500;
			line-height: 1.4;
			word-wrap: break-word;
		}

		.address-actions {
			display: flex;
			margin-left: auto;
			flex-shrink: 0;

			.address-action {
				display: flex;
				align-items: center;
				gap: 4rpx;
				padding: 6rpx 10rpx;
				background: rgba(255, 255, 255, 0.8);
				border-radius: 8rpx;
				font-size: 20rpx;
				color: #d97706;
				cursor: pointer;
				transition: all 0.3s ease;

				&:active {
					background: rgba(255, 255, 255, 0.9);
					transform: scale(0.95);
				}

				text {
					font-weight: 600;
				}
			}
		}
	}
}

/* 拉黑信息卡片 */
.blacklist-info-card {
	background: linear-gradient(135deg, #fef2f2, #fee2e2);
	border-radius: 12rpx;
	padding: 16rpx;
	margin: 8rpx 0;
	border: 1rpx solid rgba(245, 108, 108, 0.2);
	box-shadow: 0 2rpx 8rpx rgba(245, 108, 108, 0.1);

	.info-row {
		margin-bottom: 8rpx;

		.info-label {
			display: flex;
			align-items: center;

			.label-text {
				font-size: 26rpx;
				font-weight: 600;
				color: #991b1b;
			}
		}
	}

	.blacklist-content {
		background: rgba(255, 255, 255, 0.6);
		border-radius: 8rpx;
		padding: 12rpx;
		margin: 8rpx 0;

		.blacklist-text {
			font-size: 26rpx;
			color: #dc2626;
			line-height: 1.5;
			font-weight: 500;
		}
	}

	.blacklist-tip {
		display: flex;
		align-items: center;
		gap: 8rpx;
		padding: 8rpx 12rpx;
		background: rgba(254, 202, 202, 0.3);
		border-radius: 8rpx;

		.tip-icon {
			font-size: 24rpx;
		}

		.tip-text {
			font-size: 22rpx;
			color: #b91c1c;
		}
	}
}

/* === 状态徽章样式 === */
/* 车辆状态样式 */
.vehicle-status-compact {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 4rpx 12rpx;
	border-radius: 8rpx;
	font-size: 24rpx;
	font-weight: 600;
	white-space: nowrap;

	&.status-entered {
		background-color: rgba(103, 194, 58, 0.15) !important;
		color: #67C23A !important;
	}

	&.status-exited {
		background-color: rgba(144, 147, 153, 0.15) !important;
		color: #909399 !important;
	}

	&.status-pending {
		background-color: rgba(255, 152, 0, 0.15) !important;
		color: #FF9800 !important;
	}

	&.status-blacklisted {
		background-color: rgba(245, 108, 108, 0.15) !important;
		color: #F56C6C !important;
	}

	&.status-expired {
		background-color: rgba(144, 147, 153, 0.15) !important;
		color: #909399 !important;
	}
}

/* 审核状态样式 */
.audit-status-compact {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 4rpx 12rpx;
	border-radius: 8rpx;
	font-size: 24rpx;
	font-weight: 600;
	white-space: nowrap;

	&.status-success {
		background-color: rgba(76, 175, 80, 0.15);
		color: #4CAF50;
	}

	&.status-warning {
		background-color: rgba(255, 152, 0, 0.15);
		color: #FF9800;
	}

	&.status-error {
		background-color: rgba(244, 67, 54, 0.15);
		color: #F44336;
	}

	&.status-info {
		background-color: rgba(33, 150, 243, 0.15);
		color: #2196F3;
	}

	&.status-pending {
		background: linear-gradient(135deg, rgba(255, 152, 0, 0.2), rgba(255, 193, 7, 0.15));
		color: #FF6F00;
		border: 1px solid rgba(255, 152, 0, 0.3);
		box-shadow: 0 2rpx 8rpx rgba(255, 152, 0, 0.15);
		font-weight: 700;
	}

	&.status-no-audit {
		background: linear-gradient(135deg, rgba(33, 150, 243, 0.2), rgba(3, 169, 244, 0.15));
		color: #0277BD;
		border: 1px solid rgba(33, 150, 243, 0.3);
		box-shadow: 0 2rpx 8rpx rgba(33, 150, 243, 0.15);
		font-weight: 700;
	}
}

/* 等待时间徽章样式 */
.waiting-time-badge {
	position: absolute;
	top: -8rpx;
	right: 0;
	display: flex;
	align-items: center;
	gap: 6rpx;
	padding: 8rpx 16rpx;
	background: linear-gradient(135deg, #fff4e6, #ffecd1);
	border: 2rpx solid #ffb366;
	border-radius: 20rpx;
	box-shadow: 0 4rpx 12rpx rgba(255, 152, 0, 0.25);
	z-index: 10;

	.waiting-time-icon {
		font-size: 24rpx;
		color: #ff9800;
		line-height: 1;
	}

	.waiting-time-text {
		font-size: 24rpx;
		color: #e65100;
		font-weight: 600;
	}
}

/* === 车牌行布局 === */
.plate-row {
	display: flex;
	align-items: center;
	gap: 16rpx;
	padding: 8rpx 0;
}

/* === 等待时间徽章动画 === */
@keyframes pulseGlow {

	0%,
	100% {
		transform: scale(1);
		box-shadow: 0 4rpx 12rpx rgba(255, 152, 0, 0.25);
	}

	50% {
		transform: scale(1.05);
		box-shadow: 0 6rpx 16rpx rgba(255, 152, 0, 0.35);
	}
}

/* === 信息行样式 === */
.info-row {
	display: flex;
	align-items: center;
	margin-bottom: 12rpx;
	flex-wrap: wrap;
}

.info-label {
	display: flex;
	align-items: center;
	font-size: 26rpx;
	color: #606266;
	margin-right: 8rpx;
	white-space: nowrap;
}

.info-value {
	font-size: 26rpx;
	color: #303133;
	flex: 1;

	&.no-data {
		color: #909399;
		font-style: italic;
	}

	&.clickable {
		color: #409EFF;
		text-decoration: underline;
	}

	&.phone-number {
		font-family: 'Courier New', monospace;
		letter-spacing: 1rpx;
		word-break: keep-all;
		white-space: nowrap;
		overflow: visible;
		text-overflow: unset;
	}

	.duration-text {
		font-size: 24rpx;
		color: #909399;
		margin-left: 8rpx;
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

/* === 操作按钮样式 === */
.actions-compact {
	display: flex;
	align-items: center;
	gap: 12rpx;
	margin-left: auto;
	flex-shrink: 0;

	.copy-btn,
	.collapse-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 56rpx;
		height: 56rpx;
		border-radius: 12rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;
		border: 1rpx solid rgba(0, 0, 0, 0.05);

		&:active {
			transform: scale(0.9);
			box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.15);
		}

		.action-icon {
			font-size: 32rpx;
			line-height: 1;
		}
	}

	.copy-btn {
		background: linear-gradient(135deg, #ecf5ff, #d9ecff);

		.copy-icon {
			color: #409eff;
		}

		&:hover {
			background: linear-gradient(135deg, #d9ecff, #b3d8ff);
			transform: translateY(-1rpx);
		}
	}

	.collapse-btn {
		background: linear-gradient(135deg, #f0f9eb, #e1f3d8);
	}
}

/* === 空数据状态样式 === */
.empty-result {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 120rpx 40rpx;
	min-height: 60vh;

	.empty-icon {
		font-size: 120rpx;
		margin-bottom: 24rpx;
		opacity: 0.3;
		animation: float 3s ease-in-out infinite;
	}

	.empty-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #303133;
		margin-bottom: 16rpx;
	}

	.empty-desc {
		font-size: 26rpx;
		color: #909399;
		margin-bottom: 40rpx;
		text-align: center;
		line-height: 1.6;
	}

	.empty-tips {
		background: linear-gradient(135deg, #f0f9ff, #e6f7ff);
		border-radius: 16rpx;
		padding: 24rpx 32rpx;
		margin-bottom: 48rpx;
		border: 1rpx solid rgba(64, 158, 255, 0.1);

		.tip-item {
			font-size: 24rpx;
			color: #606266;
			line-height: 2;
			display: flex;
			align-items: center;
			gap: 8rpx;
		}
	}

	.empty-actions {
		display: flex;
		gap: 20rpx;

		.action-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8rpx;
			padding: 20rpx 40rpx;
			border-radius: 48rpx;
			font-size: 28rpx;
			font-weight: 500;
			transition: all 0.3s ease;
			box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);

			&:active {
				transform: scale(0.95);
			}

			.btn-icon {
				font-size: 32rpx;
			}

			&.primary {
				background: linear-gradient(135deg, #409EFF, #67C23A);
				color: #ffffff;

				&:active {
					box-shadow: 0 2rpx 8rpx rgba(64, 158, 255, 0.4);
				}
			}

			&.secondary {
				background: #ffffff;
				color: #606266;
				border: 2rpx solid #DCDFE6;

				&:active {
					background: #f5f7fa;
				}
			}
		}
	}
}

@keyframes float {

	0%,
	100% {
		transform: translateY(0);
	}

	50% {
		transform: translateY(-20rpx);
	}
}
</style>
