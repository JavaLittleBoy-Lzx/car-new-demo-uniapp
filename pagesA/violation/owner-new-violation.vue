<template>
	<view class="new-violation-container">

		<!-- 筛选器 -->
		<view class="filter-control-panel">
			<view class="filter-options-horizontal">
				<!-- 车辆选择�?-->
				<view class="filter-item-horizontal" @click="showVehicleModal = true">
					<view class="filter-content">
						<view class="filter-value">
							<text class="selected-plate"
								:class="isNewEnergyPlate(selectedVehicle) ? 'green-plate' : 'blue-plate'">
								{{ selectedVehicle }}
							</text>
							<u-icon name="arrow-down" size="16" color="#999"></u-icon>
						</view>
					</view>
				</view>

				<!-- 违规类型选择�?-->
				<view class="filter-item-horizontal" @click="showViolationTypeModal = true">
					<view class="filter-content">
						<text class="filter-label">违规类型</text>
						<view class="filter-value">
							<text class="selected-type">{{ selectedViolationType }}</text>
							<u-icon name="arrow-down" size="16" color="#999"></u-icon>
						</view>
					</view>
				</view>

				<!-- 状态筛选器 -->
				<view class="filter-item-horizontal" @click="showStatusModal = true">
					<view class="filter-content">
						<text class="filter-label">处理状态</text>
						<view class="filter-value">
							<text class="selected-status">{{ getStatusText(selectedFilter) }}</text>
							<u-icon name="arrow-down" size="16" color="#999"></u-icon>
						</view>
					</view>
				</view>
			</view>

			<!-- 车牌识别测试按钮 -->
			<view class="plate-scanner-button-container">
				<view class="plate-scanner-button" @click="openPlateScanner">
					<view class="scanner-icon">📷</view>
					<text class="scanner-text">车牌识别测试</text>
				</view>
			</view>
		</view>

		<!-- 高危车辆提醒 (单独一�? -->
		<view class="high-risk-vehicle-standalone" v-if="mostViolationCar.count > 0">
			<view class="warning-icon">⚠️</view>
			<view class="warning-content">
				<text class="warning-title">高频违规提醒</text>
				<text class="warning-plate clickable-plate"
					:class="isNewEnergyPlate(mostViolationCar.plateNumber) ? 'green-plate' : 'blue-plate'"
					@click="selectVehicleFromPlate(mostViolationCar.plateNumber)">
					{{ mostViolationCar.plateNumber }}
				</text>
				<text class="warning-count">本月已违规 {{ mostViolationCar.count }} 次</text>
			</view>
		</view>

		<!-- 信用分展示区�?+ 消息提示 -->
		<view class="credit-overview-section">
			<!-- 信用分展示区�?-->
			<view class="credit-score-section" :class="creditScoreClass">
				<view class="credit-inner">
					<view class="credit-score-ring">
						<text class="credit-num">{{ creditScore }}</text>
						<text class="credit-label">信用分</text>
					</view>
					<view class="credit-level">
						<text class="level-text">{{ creditLevel }}</text>
					</view>
				</view>

				<!-- 信用分消息提�?-->
				<view class="credit-message-integrated" :class="[
					'message-' + creditLevels.find(l => l.level === creditScoreClass.split('-')[1]).level,
					{ 'warning': creditScore < 80 }
				]">
					<view class="message-icon">
						<text class="message-emoji">{{ creditScore >= 80 ? '👍' : '⚠️' }}</text>
					</view>
					<text class="message-text">{{ creditMessage }}</text>
				</view>
			</view>
		</view>

		<!-- 车辆排行榜控制面�?(保留原位�? -->
		<view class="ranking-control-panel">
			<!-- 可折叠排行榜 -->
			<view class="ranking-toggle" @click="toggleRanking">
				<view class="toggle-title-group">
					<text class="toggle-text">违规排行</text>
					<text class="toggle-subtitle">按本月违规次数排序</text>
				</view>
				<u-icon :name="showRanking ? 'arrow-up' : 'arrow-down'" size="20" color="#666"></u-icon>
			</view>

			<view class="ranking-list" v-show="showRanking">
				<view v-for="(vehicle, index) in sortedVehicleList" :key="index" class="ranking-item"
					@click="selectVehicleFromRanking(vehicle.plateNumber, index + 1)">
					<view class="rank-number">{{ index + 1 }}</view>
					<text class="rank-plate"
						:class="isNewEnergyPlate(vehicle.plateNumber) ? 'green-plate' : 'blue-plate'">
						{{ vehicle.plateNumber }}
					</text>
					<view class="rank-info">
						<view class="rank-count">{{ vehicle.monthlyCount }}</view>
						<view class="rank-reason">{{ vehicle.mainReason }}</view>
					</view>
					<view class="violation-warning"></view>
				</view>
			</view>
		</view>

		<!-- Tab分析面板 -->
		<view class="analysis-panel">
			<!-- 统计说明提示 -->
			<view class="analysis-info-banner">
				<view class="info-icon">📊</view>
				<view class="info-content">
					<text class="info-title">数据统计说明</text>
					<text class="info-desc">
						以下统计数据基于�?
						<text class="selected-vehicle-info"
							:class="isNewEnergyPlate(selectedVehicle) && selectedVehicle !== '全部车辆' ? 'green-plate' : selectedVehicle !== '全部车辆' ? 'blue-plate' : 'all-vehicles'">
							{{ selectedVehicle }}
						</text>
						<template v-if="selectedViolationTypeValue !== 'all'">
							违规类型：{{ selectedViolationType }}
						</template>
						<template v-if="selectedFilter !== 'all'">
							处理状态：{{ getStatusText(selectedFilter) }}
						</template>
					</text>
				</view>
				<view class="info-count">
					<text class="count-number">{{ filteredRecords.length }}</text>
					<text class="count-label">条记录</text>
				</view>
			</view>

			<view class="tab-headers">
				<view v-for="(tab, index) in analysisTabs" :key="index" class="tab-header"
					:class="{ 'active': activeTabIndex === index }" @click="switchTab(index)">
					<text class="tab-title">{{ tab.title }}</text>
				</view>
			</view>

			<view class="tab-content">
				<!-- Tab1: 趋势图表 -->
				<view class="trend-analysis-tab" v-show="activeTabIndex === 0">
					<view class="chart-container">
						<view class="chart-header">
							<text class="chart-title">违规趋势分析</text>
							<view class="time-range-selector">
								<view v-for="(range, index) in timeRanges" :key="index" class="time-range-option"
									:class="{ 'active': selectedTimeRange === range.value }"
									@click="selectTimeRange(range.value)">
									{{ range.label }}
								</view>
							</view>
						</view>

						<!-- 面包屑导�?-->
						<view class="breadcrumb" v-if="breadcrumb.length > 0">
							<view v-for="(item, index) in breadcrumb" :key="index" class="breadcrumb-item"
								@click="onBreadcrumbClick(item)">
								<text v-if="index > 0" class="breadcrumb-arrow">></text>
								<text>{{ item.label }}</text>
							</view>
						</view>

						<view class="trend-chart">
							<view class="chart-bars">
								<view v-for="(item, index) in chartData" :key="index" class="chart-bar-group"
									@click="onChartItemClick(item)">
									<view class="bar-container">
										<view class="violation-bar" :style="{ height: item.height + 'rpx' }">
											<text class="bar-value" v-if="item.count > 0">{{ item.count }}</text>
										</view>
									</view>
									<text class="bar-label">{{ item.label }}</text>
									<text class="bar-sublabel" v-if="item.sublabel">{{ item.sublabel }}</text>
								</view>
							</view>
						</view>
					</view>
				</view>

				<!-- Tab2: 日历热力�?-->
				<view class="calendar-analysis-tab" v-show="activeTabIndex === 1">
					<view class="calendar-header">
						<view class="month-controls">
							<u-icon name="arrow-left" @click="previousMonth" color="#409EFF"></u-icon>
							<text class="current-month">{{ currentMonthText }}</text>
							<u-icon name="arrow-right" @click="nextMonth" color="#409EFF"></u-icon>
						</view>
					</view>

					<view class="calendar-grid">
						<view class="weekdays">
							<text class="weekday" v-for="day in weekdays" :key="day">{{ day }}</text>
						</view>
						<view class="dates">
							<view v-for="(date, index) in calendarDates" :key="index" class="date-cell" :class="[
								'intensity-' + date.intensity,
								{ 'today': date.isToday, 'selected': date.isSelected }
							]" @click="selectDate(date)">
								<text class="date-number">{{ date.day }}</text>
								<view class="violation-indicator" v-if="date.violationCount > 0">
									{{ date.violationCount }}
								</view>
							</view>
						</view>
					</view>
				</view>

				<!-- Tab3: 类型分析 -->
				<view class="type-analysis-tab" v-show="activeTabIndex === 2">
					<!-- 合并简化的标题�?-->
					<view class="analysis-header">
						<text class="header-title">类型分析</text>
						<text class="header-separator">·</text>
						<text class="header-total">共{{ totalViolations }}次违规</text>
						<text class="header-separator">·</text>
						<text class="header-types">{{ violationTypes.length }}种类型</text>
					</view>

					<view class="chart-container">

						<!-- 堆叠条形图-->
						<view class="stacked-bar-chart">
							<view class="stacked-bar">
								<view v-for="(type, index) in violationTypes" :key="index" class="bar-segment" :style="{
									backgroundColor: type.color,
									width: type.percentage + '%',
									animationDelay: (index * 0.15) + 's'
								}" @click="showTypeDetail(type)">
									<text class="segment-label" v-if="type.percentage > 8">{{ type.percentage }}%</text>
								</view>
							</view>
							<view class="chart-labels">
								<text class="label-start">0%</text>
								<text class="label-end">100%</text>
							</view>
						</view>
					</view>

					<!-- 图例 -->
					<view class="pie-legend">
						<view v-for="(type, index) in violationTypes" :key="index" class="legend-item"
							@click="showTypeDetail(type)">
							<view class="legend-indicator">
								<view class="legend-color" :style="{ backgroundColor: type.color }"></view>
								<view class="legend-icon">{{ type.icon }}</view>
							</view>
							<view class="legend-info">
								<text class="legend-name">{{ type.name }}</text>
								<view class="legend-stats">
									<text class="legend-count">{{ type.count }}次</text>
									<text class="legend-percentage">{{ type.percentage }}%</text>
								</view>
							</view>
						</view>
					</view>
				</view>

				<!-- Tab4: 对比分析 -->
				<view class="comparison-analysis-tab" v-show="activeTabIndex === 3">
					<!-- 空状�?- 智能对比分析介绍 -->
					<view class="comparison-empty" v-if="comparisonVehicles.length === 0">
						<view class="empty-hero">
							<!-- 背景装饰 -->
							<view class="hero-background">
								<view class="bg-shape shape-1"></view>
								<view class="bg-shape shape-2"></view>
								<view class="bg-shape shape-3"></view>
							</view>

							<!-- 主要图标 -->
							<view class="hero-icon-container">
								<view class="hero-icon">
									<view class="icon-chart">
										<view class="chart-bar bar-1"></view>
										<view class="chart-bar bar-2"></view>
										<view class="chart-bar bar-3"></view>
										<view class="chart-bar bar-4"></view>
									</view>
								</view>
								<view class="icon-sparkle sparkle-1"></view>
								<view class="icon-sparkle sparkle-2">💎</view>
								<view class="icon-sparkle sparkle-3"></view>
							</view>

							<!-- 内容区域 -->
							<view class="hero-content">
								<text class="hero-title">智能对比分析</text>
								<text class="hero-subtitle">选择车辆开始分析</text>
								<text class="hero-description">点击下方车辆卡片，最多可选择4辆车进行深度对比</text>

								<view class="hero-features">
									<view class="feature-badge">
										<view class="badge-icon">📊</view>
										<text class="badge-text">数据对比</text>
									</view>
									<view class="feature-badge">
										<view class="badge-icon">📈</view>
										<text class="badge-text">趋势分析</text>
									</view>
									<view class="feature-badge">
										<view class="badge-icon">🎯</view>
										<text class="badge-text">精准洞察</text>
									</view>
								</view>

								<view class="hero-action">
									<text class="action-text">👇 点击下方卡片开始选择</text>
								</view>
							</view>
						</view>
					</view>

					<view class="comparison-controls">
						<!-- 	<text class="comparison-title">多车辆对比分析</text> -->
						<view class="vehicle-selector-multi">
							<view v-for="(vehicle, index) in vehicleList" :key="index" class="vehicle-option"
								:class="{ 'selected': comparisonVehicles.includes(vehicle.plateNumber) }"
								@click="toggleComparisonVehicle(vehicle.plateNumber)">
								<view class="vehicle-card">
									<view class="card-header">
										<text class="option-plate"
											:class="isNewEnergyPlate(vehicle.plateNumber) ? 'green-plate' : 'blue-plate'">
											{{ vehicle.plateNumber }}
										</text>
										<view class="selection-indicator">
											<u-icon v-if="comparisonVehicles.includes(vehicle.plateNumber)"
												name="checkmark-circle-fill" size="20" color="#52C41A"></u-icon>
											<u-icon v-else name="plus-circle" size="20" color="#d9d9d9"></u-icon>
										</view>
									</view>
									<view class="card-stats">
										<view class="stat-item">
											<text class="stat-value">{{ vehicle.monthlyCount }}</text>
											<text class="stat-label">本月违规</text>
										</view>
										<view class="stat-divider"></view>
										<view class="stat-item">
											<text class="stat-value">{{ vehicle.totalCount }}</text>
											<text class="stat-label">累计违规</text>
										</view>
									</view>
									<view class="card-footer">
										<view class="status-dot" :class="vehicle.status"></view>
										<text class="status-text">{{ getStatusText(vehicle.status) }}</text>
									</view>
								</view>
							</view>
						</view>
					</view>

					<!-- 对比图表 -->
					<view class="comparison-chart" v-if="comparisonVehicles.length > 0">
						<view class="chart-header">
							<text class="chart-title">违规次数对比</text>
						</view>
						<view class="comparison-bars">
							<view v-for="(vehicle, index) in comparisonData" :key="index" class="comparison-bar-group"
								@click="showComparisonDetail(vehicle)">
								<text class="vehicle-label">{{ vehicle.plateNumber }}</text>
								<view class="comparison-bar"
									:style="{ height: vehicle.barHeight + 'rpx', background: vehicle.color }">
									<text class="bar-value">{{ vehicle.count }}</text>
								</view>
								<view class="vehicle-stats">
									<text class="monthly-count">本月{{ vehicle.monthlyCount }}次</text>
									<text class="total-count">总计{{ vehicle.totalCount }}次</text>
								</view>
							</view>
						</view>
					</view>

					<!-- 详细对比表格 -->
					<view class="comparison-table" v-if="comparisonVehicles.length > 0">
						<view class="table-header">
							<text class="table-title">详细数据对比</text>
						</view>
						<view class="table-content">
							<view class="table-row header-row">
								<text class="col-plate">车牌</text>
								<text class="col-monthly">本月违规</text>
								<text class="col-total">累计违规</text>
								<text class="col-status">状态</text>
							</view>
							<view v-for="(vehicle, index) in getComparisonTableData()" :key="index"
								class="table-row data-row" :class="vehicle.status">
								<text class="col-plate plate-text"
									:class="isNewEnergyPlate(vehicle.plateNumber) ? 'green-plate' : 'blue-plate'">
									{{ vehicle.plateNumber }}
								</text>
								<text class="col-monthly">{{ vehicle.monthlyCount }}次</text>
								<text class="col-total">{{ vehicle.totalCount }}次</text>
								<view class="col-status">
									<view class="status-indicator" :class="vehicle.status"></view>
									<text class="status-text">{{ getStatusText(vehicle.status) }}</text>
								</view>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 建议系统 -->
		<view class="suggestions-section">
			<view class="suggestion-header" @click="toggleSuggestions">
				<text class="suggestion-title">💡 智能建议</text>
				<text class="suggestion-subtitle">基于当前筛选条件生成</text>
				<u-icon :name="showSuggestions ? 'arrow-up' : 'arrow-down'" size="20" color="#666"></u-icon>
			</view>

			<view class="suggestions-list" v-show="showSuggestions">
				<view v-for="(suggestion, index) in suggestions" :key="index" class="suggestion-item"
					:class="suggestion.type">
					<view class="suggestion-icon">{{ suggestion.icon }}</view>
					<view class="suggestion-content">
						<text class="suggestion-text">{{ suggestion.text }}</text>
						<text class="suggestion-action" v-if="suggestion.action"
							@click="handleSuggestionAction(suggestion.actionType, suggestion.actionData)">
							{{ suggestion.action }}
						</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 详细记录列表 -->
		<view class="records-section">
			<view class="records-header">
				<view class="records-title-group">
					<text class="records-title">违规记录</text>
					<text class="records-subtitle">基于当前筛选条件显示</text>
				</view>
				<text class="records-count">共{{ filteredRecords.length }} 条记录</text>
			</view>

			<view class="records-list" v-if="filteredRecords.length > 0">
				<view v-for="(record, index) in filteredRecords" :key="index" class="record-item">
					<!-- 顶部信息-->
					<view class="record-header">
						<view class="header-left">
							<view class="plate-number"
								:class="isNewEnergyPlate(record.plateNumber) ? 'green-plate' : 'blue-plate'">
								{{ record.plateNumber }}
							</view>
							<view class="status-badge" :class="'status-' + record.status">
								<u-icon v-if="record.status === 'completed'" name="checkmark-circle" size="18"
									color="#ffffff"></u-icon>
								<u-icon v-else-if="record.status === 'processing'" name="reload" size="18"
									color="#ffffff"></u-icon>
								<u-icon v-else name="clock" size="18" color="#ffffff"></u-icon>
								<text class="status-text">{{ record.statusText }}</text>
							</view>
						</view>
					</view>

					<!-- 主要内容区域 -->
					<view class="record-main-content">
						<!-- 时间信息网格 -->
						<view class="time-info-grid">
							<!-- 预约时间-->
							<view class="time-block appointment-block">
								<view class="time-label">
									<text class="time-icon">📅</text>
									<text>预约时间</text>
								</view>
								<view class="time-value">{{ formatTime(record.appointmentTime) }}</view>
								<view class="time-date">{{ formatDate(record.appointmentTime) }}</view>
							</view>

							<!-- 进场时间-->
							<view class="time-block enter-block">
								<view class="time-label">
									<text class="time-icon">🚗</text>
									<text>进场时间</text>
								</view>
								<view class="time-value">{{ formatTime(record.enterTime) }}</view>
								<view class="time-date">{{ formatDate(record.enterTime) }}</view>
							</view>

							<!-- 停车时长和离场时间-->
							<view class="time-block leave-block">
								<view class="time-label">
									<text class="time-icon">🚀</text>
									<text>离场时间</text>
								</view>
								<view class="time-value">{{ formatTime(record.leaveTime) }}</view>
								<view class="time-date">{{ formatDate(record.leaveTime) }}</view>
							</view>

							<!-- 停车时长计算 -->
							<view class="time-block duration-block">
								<view class="time-label">
									<text class="time-icon">⏱️</text>
									<text>停车时长</text>
								</view>
								<view class="time-value">{{ calculateDuration(record.enterTime, record.leaveTime) }}
								</view>
								<view class="time-date">{{ getDurationStatus(record.enterTime, record.leaveTime) }}
								</view>
							</view>
						</view>
					</view>

					<!-- 违规原因 -->
					<view class="violation-reason">
						<view class="reason-icon">⚠️</view>
						<view class="reason-content">
							<text class="reason-text">{{ record.reason }}</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 无数据展示-->
			<view class="empty-state" v-else>
				<u-icon name="info-circle" size="60" color="#c8c9cc"></u-icon>
				<text class="empty-text">暂无违规记录</text>
			</view>
		</view>

		<!-- 车辆选择弹窗 -->
		<u-modal :show="showVehicleModal" title="选择车辆" :show-cancel-button="true" :show-confirm-button="false"
			@cancel="showVehicleModal = false">
			<view class="vehicle-modal">
				<view class="vehicle-modal-item" :class="{ 'selected': selectedVehicle === '全部车辆' }"
					@click="selectVehicleFromModal('全部车辆')">
					<text class="modal-plate all-vehicles">全部车辆</text>
					<view class="modal-info">
						<text class="modal-count">查看所有车辆</text>
					</view>
				</view>
				<view v-for="(vehicle, index) in dynamicVehicleList" :key="index" class="vehicle-modal-item"
					:class="{ 'selected': selectedVehicle === vehicle.plateNumber }"
					@click="selectVehicleFromModal(vehicle.plateNumber)">
					<text class="modal-plate"
						:class="isNewEnergyPlate(vehicle.plateNumber) ? 'green-plate' : 'blue-plate'">
						{{ vehicle.plateNumber }}
					</text>
					<view class="modal-info">
						<text class="modal-count">
							<template v-if="selectedViolationTypeValue !== 'all' || selectedFilter !== 'all'">
								筛选结果: {{ vehicle.filteredCount }}次
							</template>
							<template v-else>
								本月违规: {{ vehicle.monthlyCount }}次
							</template>
						</text>
						<text class="modal-status" :class="vehicle.status">{{ getStatusText(vehicle.status) }}</text>
					</view>
				</view>
			</view>
		</u-modal>

		<!-- 违规类型选择弹窗 -->
		<u-modal :show="showViolationTypeModal" title="选择违规类型" :show-cancel-button="true" :show-confirm-button="false"
			@cancel="showViolationTypeModal = false">
			<view class="type-modal">
				<view v-for="(type, index) in violationTypeOptions" :key="index" class="type-modal-item"
					:class="{ 'selected': selectedViolationType === type.label }"
					@click="selectViolationTypeFromModal(type.value, type.label)">
					<view class="type-icon">{{ type.icon }}</view>
					<text class="type-label">{{ type.label }}</text>
					<text class="type-count" v-if="type.count > 0">{{ type.count }}次</text>
				</view>
			</view>
		</u-modal>

		<!-- 状态选择弹窗 -->
		<u-modal :show="showStatusModal" title="选择处理状态" :show-cancel-button="true" :show-confirm-button="false"
			@cancel="showStatusModal = false">
			<view class="status-modal">
				<view v-for="(status, index) in statusOptions" :key="index" class="status-modal-item"
					:class="{ 'selected': selectedFilter === status.value }"
					@click="selectStatusFromModal(status.value)">
					<view class="status-icon" :class="'status-' + status.value">
						<u-icon v-if="status.value === 'completed'" name="checkmark-circle" size="24"
							color="#4caf50"></u-icon>
						<u-icon v-else-if="status.value === 'processing'" name="reload" size="24"
							color="#2196f3"></u-icon>
						<u-icon v-else-if="status.value === 'pending'" name="clock" size="24" color="#ff9800"></u-icon>
						<u-icon v-else name="list" size="24" color="#666"></u-icon>
					</view>
					<text class="status-label">{{ status.label }}</text>
					<text class="status-count" v-if="status.count > 0">{{ status.count }}次</text>
				</view>
			</view>
		</u-modal>

		<!-- 详情弹窗 -->
		<u-modal :show="showDetailModalFlag" :title="detailModalTitle" :show-cancel-button="true"
			:show-confirm-button="false" @cancel="showDetailModalFlag = false">
			<view class="detail-modal">
				<view class="detail-header">
					<text class="detail-date">{{ selectedDetailDate }}</text>
					<text class="detail-count">违规{{ selectedDetailCount }}次</text>
				</view>

				<view class="detail-list" v-if="selectedDetailRecords.length > 0">
					<view v-for="(record, index) in selectedDetailRecords" :key="index" class="detail-item">
						<view class="detail-plate">
							<text class="plate-text"
								:class="isNewEnergyPlate(record.plateNumber) ? 'green-plate' : 'blue-plate'">
								{{ record.plateNumber }}
							</text>
						</view>
						<view class="detail-info">
							<text class="detail-time">进场时间：{{ formatTime(record.enterTime) }}</text>
							<text class="detail-reason">违规原因：{{ record.reason }}</text>
						</view>
					</view>
				</view>

				<view class="no-detail" v-else>
					<text>该日期暂无违规记录</text>
				</view>
			</view>
		</u-modal>

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
				// 用户信用(动态计算)
				creditScore: 100,

				// 信用等级配置
				creditLevels: [{
					min: 80,
					level: 'excellent',
					color: '#00C851',
					text: '优秀',
					message: '太棒了！您的信用表现非常优秀，继续保持！👏',
					icon: 'checkmark-circle'
				}, {
					min: 60,
					level: 'normal',
					color: '#FF9800',
					text: '预警',
					message: '信用分偏低，建议改进停车习惯，避免进一步下降💡',
					icon: 'warning'
				}, {
					min: 0,
					level: 'bad',
					color: '#F44336',
					text: '警告',
					message: '信用分过低！请立即改善停车行为，遵守相关规定 ⚠️',
					icon: 'warning-fill'
				}],

				// 违规最多的车辆
				mostViolationCar: {
					plateNumber: '',
					count: 0
				},

				// 当月违规提醒
				monthlyViolationAlert: '',

				// 车辆列表数据
				vehicleList: [],

				// 当前选中的车辆
				selectedVehicle: '全部车辆',

				// 显示状态
				showRanking: false,
				showSuggestions: true,
				showVehicleModal: false,
				showViolationTypeModal: false,
				showStatusModal: false,
				showDetailModalFlag: false,

				// Tab相关
				activeTabIndex: 0,
				analysisTabs: [{
						title: '趋势图表',
						icon: '📈'
					},
					{
						title: '日历热力图',
						icon: '📅'
					},
					{
						title: '类型分析',
						icon: '📊'
					},
					{
						title: '对比分析',
						icon: '🔄'
					}
				],

				// 时间范围和层级钻取
				selectedTimeRange: 'year',
				currentTimeLevel: 'year', // year, month, week, day
				selectedYear: null, // 当前选择的年份（用于钻取）
				selectedMonth: null, // 当前选择的月份（用于钻取)
				selectedWeek: null, // 当前选择的周（用于钻取）
				currentWeekStart: null, // 当前选择周的开始日期
				currentWeekEnd: null, // 当前选择周的结束日期
				// 用于显示的年份范围
				yearRange: [2021, 2022, 2023, 2024, 2025],
				timeRanges: [{
						label: '年',
						value: 'year'
					},
					{
						label: '月',
						value: 'month'
					},
					{
						label: '周',
						value: 'week'
					},
					{
						label: '日',
						value: 'day'
					}
				],
				breadcrumb: [], // 面包屑导航
				selectedDate: null, // 选中的日期

				// 日历相关
				currentMonth: new Date(), // 日历用的Date对象，默认为当前日期
				weekdays: ['日', '一', '二', '三', '四', '五', '六'],

				// 对比分析
				comparisonVehicles: [],

				// 筛选选项
				selectedFilter: 'all',
				selectedViolationType: '全部类型',
				selectedViolationTypeValue: 'all',

				// 详情弹窗数据
				detailModalTitle: '',
				selectedDetailDate: '',
				selectedDetailCount: 0,
				selectedDetailRecords: [],

				// 违规记录数据 - 包含多年历史数据用于年级别钻取测试
				violationRecords: []
			}
		},

		computed: {
			// 获取信用等级样式
			creditScoreClass() {
				const level = this.creditLevels.find(l => this.creditScore >= l.min) || this.creditLevels[this.creditLevels
					.length - 1];
				return `credit-score-${level.level}`;
			},

			// 获取信用等级
			creditLevel() {
				const level = this.creditLevels.find(l => this.creditScore >= l.min) || this.creditLevels[this.creditLevels
					.length - 1];
				return level.text;
			},

			// 获取信用分对应的颜色
			creditColor() {
				const level = this.creditLevels.find(l => this.creditScore >= l.min) || this.creditLevels[this.creditLevels
					.length - 1];
				return level.color;
			},

			// 获取信用分对应的提示信息
			creditMessage() {
				const level = this.creditLevels.find(l => this.creditScore >= l.min) || this.creditLevels[this.creditLevels
					.length - 1];
				return level.message;
			},

			// 信用等级样式类（兼容性保持）
			creditLevelClass() {
				if (this.creditScore >= 80) return 'excellent';
				if (this.creditScore >= 60) return 'normal';
				return 'bad';
			},

			// 排序后的车辆列表
			sortedVehicleList() {
				return [...this.vehicleList].sort((a, b) => b.monthlyCount - a.monthlyCount);
			},

			// 是否显示预警
			shouldShowWarning() {
				return this.creditScore < 80 || this.getTotalMonthlyViolations() > 5;
			},

			// 图表数据
			chartData() {
				// 根据选择的时间范围和车辆生成图表数据
				return this.generateChartData();
			},

			// 日历日期数据
			calendarDates() {
				return this.generateCalendarDates();
			},

			// 当前月份文本
			currentMonthText() {
				return `${this.currentMonth.getFullYear()}-${this.currentMonth.getMonth() + 1}月`;
			},

			// 违规类型统计 - 基于当前筛选条件
			violationTypes() {
				return this.calculateViolationTypes();
			},

			// 总违规次数 - 基于当前筛选条件
			totalViolations() {
				let records = [...this.violationRecords];

				// 根据当前选择的车辆筛选
				if (this.selectedVehicle !== '全部车辆') {
					records = records.filter(record => record.plateNumber === this.selectedVehicle);
				}

				// 根据当前选择的违规类型筛选
				if (this.selectedViolationTypeValue !== 'all') {
					records = records.filter(record => record.reason === this.selectedViolationTypeValue);
				}

				// 根据当前选择的状态筛选
				if (this.selectedFilter !== 'all') {
					records = records.filter(record => record.status === this.selectedFilter);
				}

				return records.length;
			},

			// 对比数据
			comparisonData() {
				return this.generateComparisonData();
			},

			// 智能建议
			suggestions() {
				return this.generateSuggestions();
			},

			// 筛选后的记录
			filteredRecords() {
				return this.filterRecords();
			},

			// 违规类型选项 - 基于当前筛选条件
			violationTypeOptions() {
				let filteredRecords = [...this.violationRecords];

				// 根据当前选择的车辆筛选
				if (this.selectedVehicle !== '全部车辆') {
					filteredRecords = filteredRecords.filter(record => record.plateNumber === this.selectedVehicle);
				}

				// 根据当前选择的状态筛选
				if (this.selectedFilter !== 'all') {
					filteredRecords = filteredRecords.filter(record => record.status === this.selectedFilter);
				}

				const typeStats = {};
				filteredRecords.forEach(record => {
					if (typeStats[record.reason]) {
						typeStats[record.reason]++;
					} else {
						typeStats[record.reason] = 1;
					}
				});

				const options = [{
					label: '全部类型',
					value: 'all',
					icon: '📋',
					count: filteredRecords.length
				}];

				Object.entries(typeStats).forEach(([reason, count]) => {
					options.push({
						label: reason,
						value: reason,
						icon: this.getViolationIcon(reason),
						count: count
					});
				});

				return options;
			},

			// 状态选项 - 基于当前筛选条件
			statusOptions() {
				let filteredRecords = [...this.violationRecords];

				// 根据当前选择的车辆筛选
				if (this.selectedVehicle !== '全部车辆') {
					filteredRecords = filteredRecords.filter(record => record.plateNumber === this.selectedVehicle);
				}

				// 根据当前选择的违规类型筛选
				if (this.selectedViolationTypeValue !== 'all') {
					filteredRecords = filteredRecords.filter(record => record.reason === this.selectedViolationTypeValue);
				}

				const statusStats = {
					all: filteredRecords.length,
					pending: 0,
					processing: 0,
					completed: 0
				};

				filteredRecords.forEach(record => {
					statusStats[record.status]++;
				});

				return [{
						label: '全部状态',
						value: 'all',
						count: statusStats.all
					},
					{
						label: '待处理',
						value: 'pending',
						count: statusStats.pending
					},
					{
						label: '处理中',
						value: 'processing',
						count: statusStats.processing
					},
					{
						label: '已处理',
						value: 'completed',
						count: statusStats.completed
					}
				];
			},

			// 动态车辆选项 - 基于当前筛选条件
			dynamicVehicleList() {
				let filteredRecords = [...this.violationRecords];

				// 根据当前选择的违规类型筛选
				if (this.selectedViolationTypeValue !== 'all') {
					filteredRecords = filteredRecords.filter(record => record.reason === this.selectedViolationTypeValue);
				}

				// 根据当前选择的状态筛选
				if (this.selectedFilter !== 'all') {
					filteredRecords = filteredRecords.filter(record => record.status === this.selectedFilter);
				}

				// 统计每个车辆在当前筛选条件下的次数
				const vehicleStats = {};
				const currentMonth = new Date().getMonth() + 1;
				const currentYear = new Date().getFullYear();

				filteredRecords.forEach(record => {
					const plateNumber = record.plateNumber;
					if (!vehicleStats[plateNumber]) {
						vehicleStats[plateNumber] = {
							plateNumber: plateNumber,
							filteredCount: 0,
							monthlyCount: 0,
							totalCount: 0,
							status: 'excellent',
							lastViolation: '',
							mainReason: ''
						};
					}

					// 当前筛选条件下的违规次数
					vehicleStats[plateNumber].filteredCount++;

					// 计算该车辆的总违规次数（不受筛选影响）
					const vehicleTotalRecords = this.violationRecords.filter(r => r.plateNumber === plateNumber);
					vehicleStats[plateNumber].totalCount = vehicleTotalRecords.length;

					// 计算该车辆的月违规次数（不受筛选影响）
					const vehicleMonthlyRecords = vehicleTotalRecords.filter(r => {
						const [dateStr] = r.createdAt.split(' ');
						const [year, month] = dateStr.split('-').map(Number);
						return month === currentMonth && year === currentYear;
					});
					vehicleStats[plateNumber].monthlyCount = vehicleMonthlyRecords.length;

					// 更新最后违规日期
					if (!vehicleStats[plateNumber].lastViolation || record.createdAt > vehicleStats[
							plateNumber].lastViolation) {
						vehicleStats[plateNumber].lastViolation = record.createdAt.split(' ')[0];
					}

					// 确定状态
					if (vehicleStats[plateNumber].monthlyCount === 0) {
						vehicleStats[plateNumber].status = 'excellent';
					} else if (vehicleStats[plateNumber].monthlyCount <= 1) {
						vehicleStats[plateNumber].status = 'good';
					} else if (vehicleStats[plateNumber].monthlyCount <= 3) {
						vehicleStats[plateNumber].status = 'warning';
					} else {
						vehicleStats[plateNumber].status = 'danger';
					}
				});

				return Object.values(vehicleStats).sort((a, b) => b.filteredCount - a.filteredCount);
			},


		},

		mounted() {
			// 获取用户角色
			this.getUserRole();
			// 初始化数据
			this.initializeData();
			// 生成当前日期的测试数据
			this.generateCurrentMonthData();
			// 设置月违规提示
			this.setMonthlyViolationAlert();
			// 计算动态信用分
			this.calculateCreditScore();
			// 分析月份已在data中设置为6月，不需要重新设置
			// 初始化面包屑
			this.updateBreadcrumb();
		},
		onLoad() {
			// 监听TabBar状态更新事件
			uni.$on('updateTabBarIndex', (index) => {
				console.log('📨 [违规车辆页面] 收到TabBar状态更新', index);
			});
		},
		onShow() {
			// 页面显示时通知TabBar检查当前页面
			this.$nextTick(() => {
				console.log('📱 [业主违规页面] 页面显示');
				// 通知TabBar更新为当前页面对应的索引（违规车辆页面在所有角色中都是索引2）
				uni.$emit('updateTabBarIndex', 2);
			});
		},
		onUnload() {
			// 清理事件监听
			uni.$off('updateTabBarIndex');
		},

		methods: {
			// 打开车牌识别测试页面
			openPlateScanner() {
				uni.navigateTo({
					url: '/pagesC/demo/plate-scanner',
					success: function(res) {
						console.log('跳转到车牌识别页面成功');
					},
					fail: function(err) {
						console.error('跳转车牌识别页面失败:', err);
						uni.showToast({
							title: '跳转失败',
							icon: 'none'
						});
					}
				});
			},

			// 获取用户角色
			getUserRole() {
				try {
					const userInfo = uni.getStorageSync('userInfo');
					console.log('📱 [业主违规页面] 完整用户信息:', userInfo);

					if (userInfo && userInfo.role) {
						this.currentUserRole = userInfo.role;
						console.log('📱 [业主违规页面] 获取用户角色:', this.currentUserRole);
					} else if (userInfo && userInfo.userInfo && userInfo.userInfo.userkind) {
						// 检查是否使用了userkind字段（兼容处理）
						this.currentUserRole = userInfo.userInfo.userkind;
						console.log('📱 [业主违规页面] 从userkind获取用户角色:', this.currentUserRole);
					} else {
						console.warn('📱 [业主违规页面] 未找到用户角色信息，使用默认角色');
						this.currentUserRole = 'owner';
					}
				} catch (error) {
					console.error('📱 [业主违规页面] 获取用户角色失败:', error);
					this.currentUserRole = 'owner';
				}
			},

			// TabBar切换事件处理
			onTabChange(tabInfo) {
				console.log('📱 [业主违规页面] TabBar切换:', tabInfo);
			},

			// 初始化数据
			initializeData() {
				// 从违规记录中提取所有唯一的车辆，并统计其违规情况
				this.updateVehicleListFromRecords();
				// 计算最多违规车辆
				this.calculateMostViolationCar();
			},

			// 从违规记录中更新车辆列表
			updateVehicleListFromRecords() {
				const vehicleMap = {};
				const currentMonth = new Date().getMonth() + 1;
				const currentYear = new Date().getFullYear();

				// 遍历所有违规记录，统计每个车辆的情
				this.violationRecords.forEach(record => {
					const plateNumber = record.plateNumber;

					if (!vehicleMap[plateNumber]) {
						vehicleMap[plateNumber] = {
							plateNumber: plateNumber,
							monthlyCount: 0,
							totalCount: 0,
							status: 'excellent',
							lastViolation: '',
							mainReason: ''
						};
					}

					// 统计总违规次数
					vehicleMap[plateNumber].totalCount++;

					// 统计当月违规次数
					const [dateStr] = record.createdAt.split(' ');
					const [year, month] = dateStr.split('-').map(Number);
					if (month === currentMonth && year === currentYear) {
						vehicleMap[plateNumber].monthlyCount++;
					}

					// 更新最后违规日期
					if (!vehicleMap[plateNumber].lastViolation || record.createdAt > vehicleMap[plateNumber]
						.lastViolation) {
						vehicleMap[plateNumber].lastViolation = record.createdAt.split(' ')[0];
					}

					// 统计主要违规原因
					if (!vehicleMap[plateNumber].reasonCount) {
						vehicleMap[plateNumber].reasonCount = {};
					}
					const reason = record.reason;
					vehicleMap[plateNumber].reasonCount[reason] = (vehicleMap[plateNumber].reasonCount[reason] ||
						0) + 1;
				});

				// 确定每个车辆的主要违规原因和状态
				Object.values(vehicleMap).forEach(vehicle => {
					// 找出最常见的违规原因
					if (vehicle.reasonCount) {
						let maxCount = 0;
						let mainReason = '';
						Object.entries(vehicle.reasonCount).forEach(([reason, count]) => {
							if (count > maxCount) {
								maxCount = count;
								mainReason = reason;
							}
						});
						vehicle.mainReason = mainReason;
					}

					// 根据月违规次数确定状态
					if (vehicle.monthlyCount === 0) {
						vehicle.status = 'excellent';
					} else if (vehicle.monthlyCount <= 1) {
						vehicle.status = 'good';
					} else if (vehicle.monthlyCount <= 3) {
						vehicle.status = 'warning';
					} else {
						vehicle.status = 'danger';
					}
				});

				// 更新车辆列表
				this.vehicleList = Object.values(vehicleMap).sort((a, b) => b.monthlyCount - a.monthlyCount);

				// 标记违规最多的车辆（可能有并列）
				if (this.vehicleList.length > 0) {
					const maxViolations = this.vehicleList[0].monthlyCount;
					this.vehicleList.forEach(vehicle => {
						vehicle.isTopViolator = vehicle.monthlyCount > 0 && vehicle.monthlyCount === maxViolations;
					});
				}

				// 重新计算信用分
				this.calculateCreditScore();
			},

			// 生成当前月份的测试数据
			generateCurrentMonthData() {
				const now = new Date();
				const currentYear = now.getFullYear();
				const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');

				// 生成最近7天的数据
				const recentData = [];
				for (let i = 0; i < 7; i++) {
					const date = new Date();
					date.setDate(date.getDate() - i);
					const dateStr =
						`${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;

					// 随机生成一些违规记录
					if (Math.random() > 0.5) { // 50%概率有违规
						const violations = Math.floor(Math.random() * 3) + 1; // 1-3次违规
						for (let j = 0; j < violations; j++) {
							const hour = 8 + Math.floor(Math.random() * 12); // 8-19
							const minute = Math.floor(Math.random() * 60);
							const plateNumbers = ['黑A12345', '黑B67890', '黑AD98765', '黑AD12345', '黑EE1234'];
							const reasons = ['超时停车', '占用他人车位', '未按位停车', '未经授权停车'];
							const statuses = ['pending', 'processing', 'completed'];
							const statusTexts = ['待处理', '处理中', '已处理'];

							const plateNumber = plateNumbers[Math.floor(Math.random() * plateNumbers.length)];
							const reason = reasons[Math.floor(Math.random() * reasons.length)];
							const status = statuses[Math.floor(Math.random() * statuses.length)];
							const statusText = statusTexts[statuses.indexOf(status)];

							recentData.push({
								id: 9999 + recentData.length,
								plateNumber,
								createdAt: `${dateStr} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
								appointmentTime: `${dateStr} ${(hour - 1).toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
								reason,
								location: `A区${Math.floor(Math.random() * 30) + 1}号车位`,
								status,
								statusText,
								severity: 'moderate',
								enterTime: `${dateStr} ${(hour - 1).toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
								leaveTime: `${dateStr} ${(hour + 2).toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
							});
						}
					}
				}

				// 将新数据添加到现有记录前
				this.violationRecords = [...recentData, ...this.violationRecords];
			},

			// 设置月违规提示
			setMonthlyViolationAlert() {
				// 找出当月违规最多的车辆
				const currentMonth = new Date().getMonth() + 1; // getMonth()返回0-11，需要+1
				const currentYear = new Date().getFullYear();

				const monthlyStats = {};
				this.violationRecords.forEach(record => {
					// 解析违规时间字符串，格式为'2024-01-15 10:30'
					const [dateStr] = record.createdAt.split(' ');
					const [year, month] = dateStr.split('-').map(Number);

					if (month === currentMonth && year === currentYear) {
						if (!monthlyStats[record.plateNumber]) {
							monthlyStats[record.plateNumber] = 0;
						}
						monthlyStats[record.plateNumber]++;
					}
				});

				const sortedStats = Object.entries(monthlyStats).sort((a, b) => b[1] - a[1]);
				if (sortedStats.length > 0 && sortedStats[0][1] > 0) {
					this.monthlyViolationAlert = `${sortedStats[0][0]} 本月违规 ${sortedStats[0][1]} 次，为违规最多车辆`;
				}
			},

			// 判断是否是新能源车牌
			isNewEnergyPlate(plateNumber) {
				return plateNumber && plateNumber.length === 8;
			},

			// 获取违规等级（用于样式分级）
			getViolationLevel(count) {
				if (count === 0) return 'none';
				if (count <= 1) return 'low';
				if (count <= 3) return 'medium';
				return 'high';
			},



			// 选择车辆
			selectVehicle(plateNumber, showToast = true) {
				this.selectedVehicle = plateNumber;
				this.updateCreditInfo();

				// 获取车辆详细信息
				if (showToast) {
					const vehicleInfo = this.vehicleList.find(v => v.plateNumber === plateNumber);
					if (vehicleInfo) {
						const statusText = this.getStatusText(vehicleInfo.status);
						const isNewEnergy = this.isNewEnergyPlate(plateNumber);
						const vehicleType = isNewEnergy ? '新能源车' : '燃油车辆';

						uni.showToast({
							title: `已选择车辆${plateNumber}\n🚗 ${vehicleType}\n📊 本月 ${vehicleInfo.monthlyCount} 次| 累计 ${vehicleInfo.totalCount} 次\n🏷状态：${statusText}`,
							icon: 'none',
							duration: 2500
						});
					}
				}
			},

			// 更新信用信息
			updateCreditInfo() {
				// 信用分是用户整体的，不需要根据单个车辆重新计算
				// 只更新显示的月违规次数
			},

			// 切换排行榜显示
			toggleRanking() {
				this.showRanking = !this.showRanking;
			},

			// 切换建议显示
			toggleSuggestions() {
				this.showSuggestions = !this.showSuggestions;
			},

			// 切换Tab
			switchTab(index) {
				this.activeTabIndex = index;
			},



			// 获取预警消息
			getWarningMessage() {
				if (this.creditScore < 60) {
					return '信用分较低，请注意改善停车行为';
				}
				if (this.getTotalMonthlyViolations() > 5) {
					return '本月违规次数较多，建议谨慎停车';
				}
				return '信用分有所下降，请保持良好停车习惯';
			},

			// 获取总月违规次数
			getTotalMonthlyViolations() {
				return this.vehicleList.reduce((sum, vehicle) => sum + vehicle.monthlyCount, 0);
			},

			// 生成图表数据
			generateChartData() {
				switch (this.currentTimeLevel) {
					case 'year':
						return this.generateYearData();
					case 'month':
						return this.generateMonthData();
					case 'week':
						return this.generateWeekData();
					case 'day':
						return this.generateDayData();
					default:
						return this.generateYearData();
				}
			},

			// 生成年度数据（显示多个年份）
			generateYearData() {
				const data = [];
				const maxCount = Math.max(...this.yearRange.map(year => this.getViolationCountByYear(year)), 1);

				for (let year of this.yearRange) {
					const count = this.getViolationCountByYear(year);
					data.push({
						label: `${year}年`,
						count: count,
						height: Math.max((count / maxCount) * 160, 10), // 相对高度，最高160rpx
						period: `${year}`,
						type: 'year',
						year: year
					});
				}
				return data;
			},

			// 生成月度数据（显示选中年份的12个月）
			generateMonthData() {
				const data = [];
				if (!this.selectedYear) return data;

				// 计算该年各月的最大违规次数，用于相对高度计算
				const monthlyCounts = [];
				for (let month = 1; month <= 12; month++) {
					monthlyCounts.push(this.getViolationCountByMonth(this.selectedYear, month));
				}
				const maxCount = Math.max(...monthlyCounts, 1);

				for (let month = 1; month <= 12; month++) {
					const count = this.getViolationCountByMonth(this.selectedYear, month);
					data.push({
						label: `${month}月`,
						count: count,
						height: Math.max((count / maxCount) * 160, 10), // 相对高度，最高160rpx
						period: `${this.selectedYear}-${month.toString().padStart(2, '0')}`,
						type: 'month',
						year: this.selectedYear,
						month: month
					});
				}
				return data;
			},

			// 生成周数据（显示选中月份的1-5周）
			generateWeekData() {
				const data = [];
				if (!this.selectedYear || !this.selectedMonth) return data;

				const startOfMonth = new Date(this.selectedYear, this.selectedMonth - 1, 1);
				const endOfMonth = new Date(this.selectedYear, this.selectedMonth, 0);

				let weekStart = new Date(startOfMonth);
				weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // 周日开始

				// 先收集所有周的数据来计算最大次数
				const weeksData = [];
				let weekNum = 1;
				let tempWeekStart = new Date(weekStart);

				while (tempWeekStart <= endOfMonth) {
					const weekEnd = new Date(tempWeekStart);
					weekEnd.setDate(weekEnd.getDate() + 6);

					// 获取该周的违规记录
					let weekRecords = this.violationRecords.filter(record => {
						const recordDate = new Date(record.createdAt.split(' ')[0]);
						return recordDate >= tempWeekStart && recordDate <= weekEnd;
					});

					// 应用所有筛选条件
					if (this.selectedVehicle !== '全部车辆') {
						weekRecords = weekRecords.filter(record => record.plateNumber === this.selectedVehicle);
					}

					if (this.selectedViolationTypeValue !== 'all') {
						weekRecords = weekRecords.filter(record => record.reason === this.selectedViolationTypeValue);
					}

					if (this.selectedFilter !== 'all') {
						weekRecords = weekRecords.filter(record => record.status === this.selectedFilter);
					}

					weeksData.push({
						weekNum: weekNum,
						count: weekRecords.length,
						weekStart: new Date(tempWeekStart),
						weekEnd: new Date(weekEnd),
						records: weekRecords
					});

					tempWeekStart.setDate(tempWeekStart.getDate() + 7);
					weekNum++;
				}

				// 计算最大违规次数
				const maxCount = Math.max(...weeksData.map(week => week.count), 1);

				// 生成最终数据
				weeksData.forEach(week => {
					data.push({
						label: `${week.weekNum}周`,
						count: week.count,
						height: Math.max((week.count / maxCount) * 160, 10), // 相对高度，最高160rpx
						period: `${week.weekStart.getFullYear()}-${(week.weekStart.getMonth() + 1).toString().padStart(2, '0')}-W${week.weekNum}`,
						type: 'week',
						weekStart: week.weekStart,
						weekEnd: week.weekEnd,
						weekNum: week.weekNum,
						records: week.records
					});
				});

				return data;
			},

			// 生成日数据（显示选中周的7天）
			generateDayData() {
				const data = [];
				if (!this.currentWeekStart || !this.currentWeekEnd) return data;

				// 先收集所有天的数据来计算最大次数
				const daysData = [];
				const startDate = new Date(this.currentWeekStart);

				for (let i = 0; i < 7; i++) {
					const date = new Date(startDate);
					date.setDate(date.getDate() + i);
					const dateStr = date.toISOString().split('T')[0];

					let filteredRecords = this.violationRecords.filter(record => {
						const recordDate = record.createdAt.split(' ')[0];
						return recordDate === dateStr;
					});

					// 应用所有筛选条件
					if (this.selectedVehicle !== '全部车辆') {
						filteredRecords = filteredRecords.filter(record => record.plateNumber === this.selectedVehicle);
					}

					if (this.selectedViolationTypeValue !== 'all') {
						filteredRecords = filteredRecords.filter(record => record.reason === this
							.selectedViolationTypeValue);
					}

					if (this.selectedFilter !== 'all') {
						filteredRecords = filteredRecords.filter(record => record.status === this.selectedFilter);
					}

					const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

					daysData.push({
						date: date,
						dateStr: dateStr,
						count: filteredRecords.length,
						dayName: dayNames[date.getDay()],
						records: filteredRecords
					});
				}

				// 计算最大违规次数
				const maxCount = Math.max(...daysData.map(day => day.count), 1);

				// 生成最终数据
				daysData.forEach(day => {
					data.push({
						label: `${day.date.getMonth() + 1}-${day.date.getDate()}`,
						sublabel: day.dayName,
						count: day.count,
						height: Math.max((day.count / maxCount) * 160, 10), // 相对高度，最高160rpx
						date: day.dateStr,
						records: day.records,
						type: 'day'
					});
				});

				return data;
			},

			// 格式化时间
			formatTime(timeString) {
				if (!timeString) return '暂无';
				return timeString.split(' ')[1] || '暂无';
			},

			// 格式化日期
			formatDate(timeString) {
				if (!timeString) return '暂无';
				return timeString.split(' ')[0] || '暂无';
			},

			// 格式化日期时间
			formatDateTime(timeString) {
				if (!timeString) return '暂无';
				return timeString;
			},

			// 计算停车时长
			calculateDuration(enterTime, leaveTime) {
				if (!enterTime || !leaveTime) return '暂无';

				const enter = new Date(enterTime);
				const leave = new Date(leaveTime);
				const duration = leave - enter; // 毫秒

				if (duration <= 0) return '暂无';

				const hours = Math.floor(duration / (1000 * 60 * 60));
				const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

				if (hours > 0) {
					return `${hours}小时${minutes}分钟`;
				} else {
					return `${minutes}分钟`;
				}
			},

			// 获取停车时长状态
			getDurationStatus(enterTime, leaveTime) {
				if (!enterTime || !leaveTime) return '状态未定义';

				const enter = new Date(enterTime);
				const leave = new Date(leaveTime);
				const duration = leave - enter; // 毫秒
				const hours = duration / (1000 * 60 * 60);

				if (hours <= 0) return '时间异常';
				if (hours <= 2) return '正常停车';
				if (hours <= 4) return '时间较长';
				if (hours <= 8) return '超时停车';
				return '严重超时';
			},

			// 获取指定年份的违规次数 - 基于当前筛选条件
			getViolationCountByYear(year) {
				let records = this.violationRecords.filter(record => {
					const [dateStr] = record.createdAt.split(' ');
					const recordYear = parseInt(dateStr.split('-')[0]);
					return recordYear === year;
				});

				// 应用所有筛选条件
				if (this.selectedVehicle !== '全部车辆') {
					records = records.filter(record => record.plateNumber === this.selectedVehicle);
				}

				if (this.selectedViolationTypeValue !== 'all') {
					records = records.filter(record => record.reason === this.selectedViolationTypeValue);
				}

				if (this.selectedFilter !== 'all') {
					records = records.filter(record => record.status === this.selectedFilter);
				}

				return records.length;
			},

			// 获取指定月份的违规次数 - 基于当前筛选条件
			getViolationCountByMonth(year, month) {
				let records = this.violationRecords.filter(record => {
					const [dateStr] = record.createdAt.split(' ');
					const [recordYear, recordMonth] = dateStr.split('-').map(Number);
					return recordYear === year && recordMonth === month;
				});

				// 应用所有筛选条件
				if (this.selectedVehicle !== '全部车辆') {
					records = records.filter(record => record.plateNumber === this.selectedVehicle);
				}

				if (this.selectedViolationTypeValue !== 'all') {
					records = records.filter(record => record.reason === this.selectedViolationTypeValue);
				}

				if (this.selectedFilter !== 'all') {
					records = records.filter(record => record.status === this.selectedFilter);
				}

				return records.length;
			},

			// 获取指定周的违规次数 - 基于当前筛选条件
			getViolationCountByWeek(weekStart, weekEnd) {
				let records = this.violationRecords.filter(record => {
					const recordDate = new Date(record.createdAt.split(' ')[0]);
					return recordDate >= weekStart && recordDate <= weekEnd;
				});

				// 应用所有筛选条件
				if (this.selectedVehicle !== '全部车辆') {
					records = records.filter(record => record.plateNumber === this.selectedVehicle);
				}

				if (this.selectedViolationTypeValue !== 'all') {
					records = records.filter(record => record.reason === this.selectedViolationTypeValue);
				}

				if (this.selectedFilter !== 'all') {
					records = records.filter(record => record.status === this.selectedFilter);
				}

				return records.length;
			},

			// 时间范围选择
			selectTimeRange(range) {
				this.currentTimeLevel = range;
				this.selectedTimeRange = range;
				// 重置钻取状态
				if (range === 'year') {
					this.selectedYear = null;
					this.selectedMonth = null;
					this.selectedWeek = null;
					this.currentWeekStart = null;
					this.currentWeekEnd = null;
				}
				// 重置面包屑
				this.updateBreadcrumb();
			},

			// 更新面包屑
			updateBreadcrumb() {
				this.breadcrumb = [];
				if (this.currentTimeLevel === 'year') {
					// 年度视图：无面包屑
					this.breadcrumb = [];
				} else if (this.currentTimeLevel === 'month') {
					// 月度视图：显示选中年份
					if (this.selectedYear) {
						this.breadcrumb.push({
							label: `${this.selectedYear}年`,
							level: 'year',
							year: this.selectedYear
						});
					}
				} else if (this.currentTimeLevel === 'week') {
					// 周视图：显示年份和月份
					if (this.selectedYear) {
						this.breadcrumb.push({
							label: `${this.selectedYear}年`,
							level: 'year',
							year: this.selectedYear
						});
					}
					if (this.selectedMonth) {
						this.breadcrumb.push({
							label: `${this.selectedMonth}月`,
							level: 'month',
							year: this.selectedYear,
							month: this.selectedMonth
						});
					}
				} else if (this.currentTimeLevel === 'day') {
					// 日视图：显示完整面包屑
					if (this.selectedYear) {
						this.breadcrumb.push({
							label: `${this.selectedYear}年`,
							level: 'year',
							year: this.selectedYear
						});
					}
					if (this.selectedMonth) {
						this.breadcrumb.push({
							label: `${this.selectedMonth}月`,
							level: 'month',
							year: this.selectedYear,
							month: this.selectedMonth
						});
					}
					if (this.selectedWeek) {
						this.breadcrumb.push({
							label: `${this.selectedWeek}周`,
							level: 'week',
							year: this.selectedYear,
							month: this.selectedMonth,
							week: this.selectedWeek
						});
					}
				}
			},

			// 面包屑点击事件
			onBreadcrumbClick(item) {
				if (item.level === 'year') {
					// 返回年度视图
					this.currentTimeLevel = 'year';
					this.selectedTimeRange = 'year';
					this.selectedYear = null;
					this.selectedMonth = null;
					this.selectedWeek = null;
				} else if (item.level === 'month') {
					// 返回月度视图
					this.currentTimeLevel = 'month';
					this.selectedTimeRange = 'month';
					this.selectedYear = item.year;
					this.selectedMonth = null;
					this.selectedWeek = null;
				} else if (item.level === 'week') {
					// 返回周视图
					this.currentTimeLevel = 'week';
					this.selectedTimeRange = 'week';
					this.selectedYear = item.year;
					this.selectedMonth = item.month;
					this.selectedWeek = null;
				}
				this.updateBreadcrumb();
			},

			// 图表项点击事件（钻取）
			onChartItemClick(item) {
				if (item.type === 'year') {
					// 从年视图钻取到月视图（显示该年的12个月）
					this.selectedYear = item.year;
					this.currentTimeLevel = 'month';
					this.selectedTimeRange = 'month';
					this.updateBreadcrumb();
				} else if (item.type === 'month') {
					// 从月视图钻取到周视图（显示该月的4-5周）
					this.selectedMonth = item.month;
					this.currentTimeLevel = 'week';
					this.selectedTimeRange = 'week';
					this.updateBreadcrumb();
				} else if (item.type === 'week') {
					// 从周视图钻取到日视图（显示该周的7天）
					this.selectedWeek = item.weekNum;
					this.currentWeekStart = item.weekStart;
					this.currentWeekEnd = item.weekEnd;
					this.currentTimeLevel = 'day';
					this.selectedTimeRange = 'day';
					this.updateBreadcrumb();
				} else if (item.type === 'day') {
					// 点击天，显示该天的详情弹窗
					this.showDetailModal({
						label: `${item.label} 违规详情`,
						date: item.date,
						count: item.count,
						records: item.records || []
					});
					return;
				} else {
					// 显示详情弹窗
					this.showDetailModal(item);
					return;
				}
			},

			previousMonth() {
				this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1);
			},

			nextMonth() {
				this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1);
			},



			toggleComparisonVehicle(plateNumber) {
				const index = this.comparisonVehicles.indexOf(plateNumber);
				if (index > -1) {
					this.comparisonVehicles.splice(index, 1);
				} else {
					// 最多选择4辆车
					if (this.comparisonVehicles.length >= 4) {
						uni.showToast({
							title: '🚫 选择数量限制\n最多可选择 4 辆车对比\n请先取消其他车辆',
							icon: 'none',
							duration: 2000
						});
						return;
					}
					this.comparisonVehicles.push(plateNumber);
				}
			},

			// 显示对比详情
			showComparisonDetail(vehicle) {
				// 获取该车辆的详细违规记录
				const vehicleRecords = this.violationRecords.filter(record =>
					record.plateNumber === vehicle.plateNumber
				);

				// 显示详情弹窗
				this.detailModalTitle = `${vehicle.plateNumber} 违规详情`;
				this.selectedDetailRecords = vehicleRecords;
				this.selectedDetailDate = '全部';
				this.selectedDetailCount = vehicleRecords.length;

				this.$nextTick(() => {
					this.showDetailModalFlag = true;
				});
			},

			// 获取对比表格数据
			getComparisonTableData() {
				const currentMonth = new Date().getMonth() + 1;
				const currentYear = new Date().getFullYear();

				return this.comparisonVehicles.map(plateNumber => {
					// 直接从violationRecords计算数据，确保准确
					const totalCount = this.violationRecords.filter(record =>
						record.plateNumber === plateNumber
					).length;

					const monthlyCount = this.violationRecords.filter(record => {
						const [dateStr] = record.createdAt.split(' ');
						const [year, month] = dateStr.split('-').map(Number);
						return record.plateNumber === plateNumber &&
							month === currentMonth && year === currentYear;
					}).length;

					// 根据月违规次数确定状态
					let status = 'excellent';
					if (monthlyCount === 0) {
						status = 'excellent';
					} else if (monthlyCount <= 1) {
						status = 'good';
					} else if (monthlyCount <= 3) {
						status = 'normal';
					} else {
						status = 'poor';
					}

					return {
						plateNumber: plateNumber,
						monthlyCount: monthlyCount,
						totalCount: totalCount,
						status: status
					};
				});
			},

			selectVehicleFromModal(plateNumber) {
				this.selectVehicle(plateNumber, true); // 从弹窗选择时显示toast提示
				this.showVehicleModal = false;

				// 检查当前选择的违规类型和状态在新车辆下是否还有记录
				this.validateTypeAndStatusSelections();
			},

			// 从车牌号码点击选择车辆
			selectVehicleFromPlate(plateNumber) {
				// 获取车辆详细信息，在selectVehicle之前获取，因为selectVehicle会覆盖原有提示
				const vehicleInfo = this.vehicleList.find(v => v.plateNumber === plateNumber);

				// 判断是否为高频违规车辆，如果是则不显示toast，使用详细modal
				const isHighRiskVehicle = vehicleInfo && this.mostViolationCar.plateNumber === plateNumber;
				this.selectVehicle(plateNumber, !isHighRiskVehicle);

				// 检查当前选择的违规类型和状态在新车辆下是否还有记录
				this.validateTypeAndStatusSelections();

				// 显示高频违规车辆的特殊提示
				if (isHighRiskVehicle) {
					const statusText = this.getStatusText(vehicleInfo.status);
					const isNewEnergy = this.isNewEnergyPlate(plateNumber);
					const vehicleType = isNewEnergy ? '新能源车' : '燃油车辆';
					const warningLevel = vehicleInfo.monthlyCount >= 5 ? '严重警告' : vehicleInfo.monthlyCount >= 3 ? '高度警告' :
						'注意警告';

					// 计算该车辆最近一次违规时间
					const recentViolation = this.violationRecords
						.filter(record => record.plateNumber === plateNumber)
						.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

					const lastViolationTime = recentViolation ?
						this.formatDateTime(recentViolation.createdAt) : '暂无记录';

					uni.showModal({
						title: `⚠️ ${warningLevel}`,
						content: `🔥 高频违规车辆${plateNumber}
🚗 ${vehicleType}  |  本月已违${vehicleInfo.monthlyCount} 次

📊 违规统计
本月${vehicleInfo.monthlyCount} 次 |  累计${vehicleInfo.totalCount} 次
状态：${statusText}

🔍 详细信息
主要违规${vehicleInfo.mainReason}
最近违规：${lastViolationTime}

🚨 紧急提示
⚠️ 立即改善停车行为，避免进一步违规！`,
						showCancel: true,
						cancelText: '知道',
						confirmText: '查看详情',
						success: (res) => {
							if (res.confirm) {
								// 可以跳转到详细记录页面或显示更多信息
								this.showVehicleDetailModal(plateNumber);
							}
						}
					});
				}
			},

			// 验证当前违规类型和状态选择是否有效
			validateTypeAndStatusSelections() {
				if (this.selectedVehicle === '全部车辆') return;

				// 检查当前选择的违规类型在该车辆下是否有记录
				if (this.selectedViolationTypeValue !== 'all') {
					let hasTypeRecords = this.violationRecords.some(record => {
						let matches = record.plateNumber === this.selectedVehicle && record.reason === this
							.selectedViolationTypeValue;

						if (this.selectedFilter !== 'all') {
							matches = matches && record.status === this.selectedFilter;
						}

						return matches;
					});

					if (!hasTypeRecords) {
						this.selectedViolationTypeValue = 'all';
						this.selectedViolationType = '全部类型';
						uni.showToast({
							title: '🔄 筛选条件已调整\n该车辆无此类型违规记录\n已切换至"全部类型"',
							icon: 'none',
							duration: 2000
						});
					}
				}

				// 检查当前选择的状态在该车辆下是否有记�?
				if (this.selectedFilter !== 'all') {
					let hasStatusRecords = this.violationRecords.some(record => {
						let matches = record.plateNumber === this.selectedVehicle && record.status === this
							.selectedFilter;

						if (this.selectedViolationTypeValue !== 'all') {
							matches = matches && record.reason === this.selectedViolationTypeValue;
						}

						return matches;
					});

					if (!hasStatusRecords) {
						this.selectedFilter = 'all';
						uni.showToast({
							title: '🔄 筛选条件已调整\n该车辆无此状态记录\n已切换至"全部状态"',
							icon: 'none',
							duration: 2000
						});
					}
				}
			},

			// 从弹窗选择违规类型
			selectViolationTypeFromModal(value, label) {
				this.selectedViolationTypeValue = value;
				this.selectedViolationType = label;
				this.showViolationTypeModal = false;

				// 检查当前选择的车辆在新的筛选条件下是否还有记录
				this.validateCurrentSelections();
			},

			// 从弹窗选择状态
			selectStatusFromModal(value) {
				this.selectedFilter = value;
				this.showStatusModal = false;

				// 检查当前选择的车辆在新的筛选条件下是否还有记录
				this.validateCurrentSelections();
			},

			// 验证当前选择是否有效，如果无效则重置
			validateCurrentSelections() {
				// 检查当前选择的车辆在筛选条件下是否还有记录
				if (this.selectedVehicle !== '全部车辆') {
					let hasRecords = this.violationRecords.some(record => {
						let matches = record.plateNumber === this.selectedVehicle;

						if (this.selectedViolationTypeValue !== 'all') {
							matches = matches && record.reason === this.selectedViolationTypeValue;
						}

						if (this.selectedFilter !== 'all') {
							matches = matches && record.status === this.selectedFilter;
						}

						return matches;
					});

					if (!hasRecords) {
						this.selectedVehicle = '全部车辆';
						uni.showToast({
							title: '🔄 筛选条件已调整\n该筛选条件下无此车辆记录\n已切换至"全部车辆"',
							icon: 'none',
							duration: 2000
						});
					}
				}
			},

			getStatusText(status) {
				const statusMap = {
					all: '全部状态',
					pending: '待处理',
					processing: '处理中',
					completed: '已处理',
					excellent: '优秀',
					good: '良好',
					normal: '一般',
					poor: '较差',
					warning: '注意',
					danger: '警告'
				};
				return statusMap[status] || '未知';
			},

			showDetailModal(item) {
				// 显示详情弹窗，修复点击功能和闪屏问题
				this.detailModalTitle = `${item.label} 违规详情`;
				this.selectedDetailDate = item.date || item.period || '详情';
				this.selectedDetailCount = item.count;

				// 使用生成的records数据
				this.selectedDetailRecords = item.records || [];

				// 修复闪屏问题，确保数据设置完成后再显示弹窗
				this.$nextTick(() => {
					this.showDetailModalFlag = true;
				});
			},

			// 显示车辆详细信息弹窗
			showVehicleDetailModal(plateNumber) {
				const vehicleRecords = this.violationRecords.filter(record =>
					record.plateNumber === plateNumber
				);

				// 按时间倒序排列，显示最近的违规记录
				const sortedRecords = vehicleRecords.sort((a, b) =>
					new Date(b.createdAt) - new Date(a.createdAt)
				);

				this.detailModalTitle = `${plateNumber} 详细违规记录`;
				this.selectedDetailDate = '全部记录';
				this.selectedDetailCount = vehicleRecords.length;
				this.selectedDetailRecords = sortedRecords;

				this.$nextTick(() => {
					this.showDetailModalFlag = true;
				});
			},

			// 从排行榜选择车辆
			selectVehicleFromRanking(plateNumber, ranking) {
				// 获取车辆详细信息
				const vehicleInfo = this.vehicleList.find(v => v.plateNumber === plateNumber);

				// 先选择车辆（不显示基本的toast提示，使用详细的modal）
				this.selectVehicle(plateNumber, false);

				// 检查筛选条件
				this.validateTypeAndStatusSelections();

				if (vehicleInfo) {
					const statusText = this.getStatusText(vehicleInfo.status);
					const isNewEnergy = this.isNewEnergyPlate(plateNumber);
					const vehicleType = isNewEnergy ? '新能源车' : '燃油车辆';

					// 根据排名确定警告级别和图表
					let rankIcon = '';
					let rankText = '';
					let warningLevel = '';

					if (ranking === 1) {
						rankIcon = '👑';
						rankText = '违规榜首';
						warningLevel = '🚨 严重警告';
					} else if (ranking === 2) {
						rankIcon = '🥈';
						rankText = '违规第二';
						warningLevel = '⚠️ 高度警告';
					} else if (ranking === 3) {
						rankIcon = '🥉';
						rankText = '违规第三';
						warningLevel = '⚠️ 警告提醒';
					} else {
						rankIcon = '📊';
						rankText = `违规排名${ranking}`;
						warningLevel = '💡 注意提醒';
					}

					// 计算该车辆的违规趋势
					const currentMonth = new Date().getMonth() + 1;
					const currentYear = new Date().getFullYear();
					const currentMonthRecords = this.violationRecords.filter(record => {
						const [dateStr] = record.createdAt.split(' ');
						const [year, month] = dateStr.split('-').map(Number);
						return record.plateNumber === plateNumber &&
							month === currentMonth && year === currentYear;
					});

					const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
					const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
					const lastMonthRecords = this.violationRecords.filter(record => {
						const [dateStr] = record.createdAt.split(' ');
						const [year, month] = dateStr.split('-').map(Number);
						return record.plateNumber === plateNumber &&
							month === lastMonth && year === lastMonthYear;
					});

					const trend = currentMonthRecords.length > lastMonthRecords.length ? '📈 上升' :
						currentMonthRecords.length < lastMonthRecords.length ? '📉 下降' : '➡️ 平稳';

					// 最近违规时间
					const recentViolation = this.violationRecords
						.filter(record => record.plateNumber === plateNumber)
						.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

					const lastViolationTime = recentViolation ?
						this.formatDateTime(recentViolation.createdAt) : '暂无记录';

					uni.showModal({
						title: `${rankIcon} ${warningLevel}`,
						content: `🚗 ${vehicleType}${plateNumber}
🏆 ${rankText}（共${this.vehicleList.length}辆车）

📊 违规数据
本月违规${vehicleInfo.monthlyCount} 次 |  累计${vehicleInfo.totalCount} 次
违规趋势${trend}  |  状态：${statusText}

🔍 详细信息  
主要违规${vehicleInfo.mainReason}
最近违规：${lastViolationTime}

${ranking <= 3 ? '🚨' : '💡'} ${ranking <= 3 ? '紧急提示' : '友情提示'}
${ ranking <= 3 ? '⚠️ 立即整改停车行为，避免进一步处罚！' : '继续保持良好的停车习惯'}`,
						showCancel: true,
						cancelText: '知道',
						confirmText: '查看详情',
						success: (res) => {
							if (res.confirm) {
								this.showVehicleDetailModal(plateNumber);
							}
						}
					});
				}
			},

			// 生成日历数据
			generateCalendarDates() {
				const dates = [];
				const year = this.currentMonth.getFullYear();
				const month = this.currentMonth.getMonth();

				// 获取当月第一天是周几
				const firstDay = new Date(year, month, 1).getDay();
				// 获取当月有多少天
				const daysInMonth = new Date(year, month + 1, 0).getDate();
				// 获取上月有多少天
				const daysInPrevMonth = new Date(year, month, 0).getDate();

				const today = new Date();

				// 填充上月的日期
				for (let i = firstDay - 1; i >= 0; i--) {
					const day = daysInPrevMonth - i;
					const date = new Date(year, month - 1, day);
					dates.push({
						day,
						date: date.toISOString().split('T')[0],
						intensity: 0,
						violationCount: 0,
						isToday: false,
						isSelected: false,
						isCurrentMonth: false,
						records: []
					});
				}

				// 填充当月的日期
				for (let day = 1; day <= daysInMonth; day++) {
					const date = new Date(year, month, day);
					const dateStr = date.toISOString().split('T')[0];

					// 计算该日期的违规次数，修复日期匹配逻辑
					let violationsOnThisDate = this.violationRecords.filter(record => {
						const recordDate = record.createdAt.split(' ')[0]; // 取日期部分
						return recordDate === dateStr;
					});

					// 应用所有筛选条件
					if (this.selectedVehicle !== '全部车辆') {
						violationsOnThisDate = violationsOnThisDate.filter(record => record.plateNumber === this
							.selectedVehicle);
					}

					if (this.selectedViolationTypeValue !== 'all') {
						violationsOnThisDate = violationsOnThisDate.filter(record => record.reason === this
							.selectedViolationTypeValue);
					}

					if (this.selectedFilter !== 'all') {
						violationsOnThisDate = violationsOnThisDate.filter(record => record.status === this
							.selectedFilter);
					}

					const violationCount = violationsOnThisDate.length;

					// 根据违规次数设置强度 - 支持更多层级
					let intensity = 0;
					if (violationCount === 0) {
						intensity = 0;
					} else if (violationCount === 1) {
						intensity = 1;
					} else if (violationCount <= 3) {
						intensity = 2;
					} else if (violationCount <= 5) {
						intensity = 3;
					} else if (violationCount <= 8) {
						intensity = 4;
					} else if (violationCount <= 10) {
						intensity = 5;
					} else {
						intensity = 6; // 超过10次
					}

					dates.push({
						day,
						date: dateStr,
						intensity,
						violationCount: violationCount,
						isToday: date.toDateString() === today.toDateString(),
						isSelected: false,
						isCurrentMonth: true,
						records: violationsOnThisDate
					});
				}

				// 填充下月的日期以填满6周
				const remainingDays = 42 - dates.length;
				for (let day = 1; day <= remainingDays; day++) {
					const date = new Date(year, month + 1, day);
					dates.push({
						day,
						date: date.toISOString().split('T')[0],
						intensity: 0,
						violationCount: 0,
						isToday: false,
						isSelected: false,
						isCurrentMonth: false,
						records: []
					});
				}

				return dates;
			},

			// 选择日期 - 修复点击功能
			selectDate(date) {
				if (date.violationCount > 0) {
					// 获取该日期的所有违规记录
					const dateStr = date.date;
					let dayRecords = date.records || this.violationRecords.filter(record => {
						const recordDate = record.createdAt.split(' ')[0];
						return recordDate === dateStr;
					});

					// 应用所有筛选条件
					if (this.selectedVehicle !== '全部车辆') {
						dayRecords = dayRecords.filter(record => record.plateNumber === this.selectedVehicle);
					}

					if (this.selectedViolationTypeValue !== 'all') {
						dayRecords = dayRecords.filter(record => record.reason === this.selectedViolationTypeValue);
					}

					if (this.selectedFilter !== 'all') {
						dayRecords = dayRecords.filter(record => record.status === this.selectedFilter);
					}

					// 设置弹窗数据
					this.detailModalTitle = `${date.day}日违规详情`;
					this.selectedDetailDate = dateStr;
					this.selectedDetailCount = dayRecords.length;
					this.selectedDetailRecords = dayRecords;

					// 显示弹窗
					this.$nextTick(() => {
						this.showDetailModalFlag = true;
					});
				}
			},

			// 计算违规类型统计 - 基于当前筛选条件
			calculateViolationTypes() {
				const typeMap = {};
				let total = 0;
				const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA726', '#A78BFA'];

				// 基于所有筛选条件过滤记录
				let filteredRecords = [...this.violationRecords];

				// 根据当前选择的车辆筛选
				if (this.selectedVehicle !== '全部车辆') {
					filteredRecords = filteredRecords.filter(record => record.plateNumber === this.selectedVehicle);
				}

				// 根据当前选择的违规类型筛选
				if (this.selectedViolationTypeValue !== 'all') {
					filteredRecords = filteredRecords.filter(record => record.reason === this.selectedViolationTypeValue);
				}

				// 根据当前选择的状态筛选
				if (this.selectedFilter !== 'all') {
					filteredRecords = filteredRecords.filter(record => record.status === this.selectedFilter);
				}

				// 统计违规类型
				filteredRecords.forEach(record => {
					if (typeMap[record.reason]) {
						typeMap[record.reason].count++;
					} else {
						typeMap[record.reason] = {
							name: record.reason,
							count: 1,
							icon: this.getViolationIcon(record.reason)
						};
					}
					total++;
				});

				// 计算百分比、颜色和角度
				let currentAngle = 0;
				return Object.values(typeMap).map((type, index) => {
					const percentage = total > 0 ? Math.round((type.count / total) * 100) : 0;
					const angle = total > 0 ? (type.count / total) * 360 : 0;
					const startAngle = currentAngle;
					const endAngle = currentAngle + angle;
					currentAngle = endAngle;

					return {
						...type,
						percentage,
						color: colors[index % colors.length],
						startAngle,
						endAngle
					};
				}).sort((a, b) => b.count - a.count);
			},

			// 获取违规类型图标
			getViolationIcon(reason) {
				const iconMap = {
					'超时停车': '⏰',
					'占用他人车位': '🚫',
					'未按位停车': '📍',
					'未经授权停车': '🔒'
				};
				return iconMap[reason] || '⚠️';
			},

			// 显示类型详情
			showTypeDetail(type) {
				let relatedRecords = this.violationRecords.filter(record => record.reason === type.name);

				// 应用所有筛选条件
				if (this.selectedVehicle !== '全部车辆') {
					relatedRecords = relatedRecords.filter(record => record.plateNumber === this.selectedVehicle);
				}

				if (this.selectedFilter !== 'all') {
					relatedRecords = relatedRecords.filter(record => record.status === this.selectedFilter);
				}

				this.detailModalTitle = `${type.name} 详情`;
				this.selectedDetailDate = '按类型筛选';
				this.selectedDetailCount = type.count;
				this.selectedDetailRecords = relatedRecords;
				this.showDetailModalFlag = true;
			},

			// 生成对比数据
			generateComparisonData() {
				if (this.comparisonVehicles.length === 0) return [];

				const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C'];
				const currentMonth = new Date().getMonth() + 1;
				const currentYear = new Date().getFullYear();

				// 计算每个车辆的数量
				const vehicleData = this.comparisonVehicles.map(plateNumber => {
					// 总违规次数
					const totalCount = this.violationRecords.filter(record =>
						record.plateNumber === plateNumber
					).length;

					// 当月违规次数
					const monthlyCount = this.violationRecords.filter(record => {
						const [dateStr] = record.createdAt.split(' ');
						const [year, month] = dateStr.split('-').map(Number);
						return record.plateNumber === plateNumber &&
							month === currentMonth && year === currentYear;
					}).length;

					return {
						plateNumber,
						totalCount,
						monthlyCount
					};
				});

				const maxCount = Math.max(...vehicleData.map(v => v.totalCount)) || 1;

				return vehicleData.map((vehicle, index) => ({
					plateNumber: vehicle.plateNumber,
					count: vehicle.totalCount,
					monthlyCount: vehicle.monthlyCount,
					totalCount: vehicle.totalCount,
					barHeight: (vehicle.totalCount / maxCount) * 160,
					color: colors[index % colors.length]
				}));
			},

			// 生成建议 - 基于当前筛选条件
			generateSuggestions() {
				const suggestions = [];
				let records = [...this.violationRecords];

				// 应用所有筛选条件
				if (this.selectedVehicle !== '全部车辆') {
					records = records.filter(record => record.plateNumber === this.selectedVehicle);
				}

				if (this.selectedViolationTypeValue !== 'all') {
					records = records.filter(record => record.reason === this.selectedViolationTypeValue);
				}

				if (this.selectedFilter !== 'all') {
					records = records.filter(record => record.status === this.selectedFilter);
				}

				const currentMonth = new Date().getMonth() + 1; // getMonth()返回0-11，需+1
				const currentYear = new Date().getFullYear();
				const monthlyRecords = records.filter(record => {
					const [dateStr] = record.createdAt.split(' ');
					const [year, month] = dateStr.split('-').map(Number);
					return month === currentMonth && year === currentYear;
				});

				// 最常见违规类型建议
				const violationTypes = this.calculateViolationTypes();
				if (violationTypes.length > 0) {
					const mostCommon = violationTypes[0];
					const suggestionMap = {
						'超时停车': {
							icon: '⏰',
							text: `您最常违规类型是超时停车(${mostCommon.count}次，建议设置离场提醒或选择时间更充裕的停车位。`,
							action: '设置提醒',
							actionType: 'reminder',
							actionData: {
								type: '超时停车',
								count: mostCommon.count
							}
						},
						'占用他人车位': {
							icon: '🚫',
							text: `请严格按照预约车位停车，避免占用他人车位(已发${mostCommon.count}次。`,
							action: '查看车位指引',
							actionType: 'guide',
							actionData: {
								type: '车位指引'
							}
						},
						'未按位停车': {
							icon: '📍',
							text: `请按照标线规范停车，避免歪斜停放影响其他车辆(已发${mostCommon.count}次。`,
							action: '学习停车技巧',
							actionType: 'tutorial',
							actionData: {
								type: '停车技巧'
							}
						},
						'未经授权停车': {
							icon: '🔒',
							text: `请确保在预约时间内停车，避免无预约停车行�?已发${mostCommon.count}次。`,
							action: '了解预约规则',
							actionType: 'rules',
							actionData: {
								type: '预约规则'
							}
						}
					};

					if (suggestionMap[mostCommon.name]) {
						suggestions.push({
							type: 'warning',
							...suggestionMap[mostCommon.name]
						});
					}
				}

				// 本月表现建议
				if (monthlyRecords.length === 0) {
					suggestions.push({
						type: 'praise',
						icon: '🎉',
						text: '本月暂无违规记录，停车行为很规范！继续保持良好习惯',
						action: '查看停车攻略',
						actionType: 'guide',
						actionData: {
							type: '停车攻略'
						}
					});
				} else if (monthlyRecords.length <= 2) {
					suggestions.push({
						type: 'good',
						icon: '👍',
						text: `本月违规${monthlyRecords.length}次，表现不错！建议继续保持谨慎停车。`,
						action: '查看停车攻略',
						actionType: 'guide',
						actionData: {
							type: '停车攻略'
						}
					});
				}

				// 信用分建议
				if (this.creditScore < 70) {
					suggestions.push({
						type: 'improvement',
						icon: '📈',
						text: '信用分偏低，建议近期严格遵守停车规定，积极改善信用评级',
						action: '查看信用规则',
						actionType: 'credit',
						actionData: {
							currentScore: this.creditScore
						}
					});
				}

				// 时间段建议
				const timeAnalysis = this.analyzeViolationTimes(records);
				if (timeAnalysis.peakHour) {
					suggestions.push({
						type: 'tip',
						icon: '🕐',
						text: `您在${timeAnalysis.peakHour}时段违规较多，建议在此时段加强注意或避开高峰期停车。`,
						action: '查看停车攻略',
						actionType: 'guide',
						actionData: {
							type: '停车攻略',
							peakHour: timeAnalysis.peakHour
						}
					});
				}

				return suggestions.slice(0, 3); // 最多显示3个建议
			},

			// 分析违规时间模式
			analyzeViolationTimes(records) {
				const hourCounts = {};
				records.forEach(record => {
					const hour = new Date(record.createdAt).getHours();
					hourCounts[hour] = (hourCounts[hour] || 0) + 1;
				});

				let peakHour = null;
				let maxCount = 0;
				for (const [hour, count] of Object.entries(hourCounts)) {
					if (count > maxCount && count >= 2) {
						maxCount = count;
						peakHour = `${hour}:00-${parseInt(hour) + 1}:00`;
					}
				}

				return {
					peakHour
				};
			},

			// 计算最多违规的车辆
			calculateMostViolationCar() {
				const violationCount = {};
				const currentMonth = new Date().getMonth() + 1; // getMonth()返回0-11，需+1
				const currentYear = new Date().getFullYear();

				// 统计当前月份的违规次数
				this.violationRecords.forEach(violation => {
					const [dateStr] = violation.createdAt.split(' ');
					const [year, month] = dateStr.split('-').map(Number);

					if (month === currentMonth && year === currentYear) {
						if (!violationCount[violation.plateNumber]) {
							violationCount[violation.plateNumber] = 0;
						}
						violationCount[violation.plateNumber]++;
					}
				});

				let maxCount = 0;
				let maxPlateNumber = '';
				for (const [plateNumber, count] of Object.entries(violationCount)) {
					if (count > maxCount) {
						maxCount = count;
						maxPlateNumber = plateNumber;
					}
				}

				this.mostViolationCar = {
					plateNumber: maxPlateNumber,
					count: maxCount
				};
			},

			// 动态计算信用分
			calculateCreditScore() {
				const currentMonth = new Date().getMonth() + 1;
				const currentYear = new Date().getFullYear();
				const threeMonthsAgo = new Date();
				threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

				// 统计3个月的违规记录
				const recentViolations = this.violationRecords.filter(record => {
					const recordDate = new Date(record.createdAt);
					return recordDate >= threeMonthsAgo;
				});

				// 统计当月违规
				const currentMonthViolations = recentViolations.filter(record => {
					const [dateStr] = record.createdAt.split(' ');
					const [year, month] = dateStr.split('-').map(Number);
					return month === currentMonth && year === currentYear;
				});

				// 基础100分
				let score = 100;

				// 违规扣分规则
				recentViolations.forEach(record => {
					const recordDate = new Date(record.createdAt);
					const monthsAgo = Math.floor((new Date() - recordDate) / (1000 * 60 * 60 * 24 * 30));

					// 根据违规类型和时间远近进行扣分
					let deduction = 0;
					switch (record.reason) {
						case '未经授权停车':
							deduction = 8; // 最严重
							break;
						case '占用他人车位':
							deduction = 6;
							break;
						case '超时停车':
							deduction = 4;
							break;
						case '未按位停车':
							deduction = 3; // 最轻微
							break;
						default:
							deduction = 5;
					}

					// 时间权重：越近的违规扣分越重
					const timeWeight = Math.max(0.3, 1 - monthsAgo * 0.2);
					score -= deduction * timeWeight;

					// 处理状态影响：已处理的违规减少扣分
					if (record.status === 'completed') {
						score += deduction * 0.2; // 恢复20%的扣分
					}
				});

				// 当月违规次数额外惩罚
				if (currentMonthViolations.length > 0) {
					// 当月违规每次额外扣分
					score -= currentMonthViolations.length * 2;

					// 当月违规超过3次，额外重罚
					if (currentMonthViolations.length > 3) {
						score -= (currentMonthViolations.length - 3) * 3;
					}
				}

				// 连续违规惩罚：检查最近7天内是否有多次违规
				const sevenDaysAgo = new Date();
				sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
				const recentSevenDays = recentViolations.filter(record => {
					return new Date(record.createdAt) >= sevenDaysAgo;
				});
				if (recentSevenDays.length > 2) {
					score -= (recentSevenDays.length - 2) * 5; // 一周内超过2次违规，每次额外扣分
				}

				// 长期无违规奖励
				const thirtyDaysAgo = new Date();
				thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
				const lastMonthViolations = recentViolations.filter(record => {
					return new Date(record.createdAt) >= thirtyDaysAgo;
				});
				if (lastMonthViolations.length === 0 && score < 95) {
					score += 5; // 30天无违规，奖励5分
				}

				// 确保分数在0-100范围内
				this.creditScore = Math.max(0, Math.min(100, Math.round(score)));
			},

			// 筛选记录
			filterRecords() {
				let records = [...this.violationRecords];

				// 根据选择的车辆筛选
				if (this.selectedVehicle !== '全部车辆') {
					records = records.filter(record => record.plateNumber === this.selectedVehicle);
				}

				// 根据违规类型筛选
				if (this.selectedViolationTypeValue !== 'all') {
					records = records.filter(record => record.reason === this.selectedViolationTypeValue);
				}

				// 根据状态筛选
				if (this.selectedFilter !== 'all') {
					records = records.filter(record => record.status === this.selectedFilter);
				}

				// 按时间倒序排列
				records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

				// 限制显示数量以提高性能
				return records.slice(0, 50);
			},

			// 处理建议操作点击
			handleSuggestionAction(actionType, actionData) {
				switch (actionType) {
					case 'reminder':
						this.showReminderSettings(actionData);
						break;
					case 'guide':
						this.showGuideModal(actionData);
						break;
					case 'tutorial':
						this.showTutorialModal(actionData);
						break;
					case 'rules':
						this.showRulesModal(actionData);
						break;
					case 'credit':
						this.showCreditRulesModal(actionData);
						break;
					default:
						console.log('未知操作类型:', actionType);
				}
			},

			// 显示提醒设置
			showReminderSettings(data) {
				uni.showActionSheet({
					title: `🔔 针对"${data.type}"设置提醒（已发生${data.count}次）`,
					itemList: ['离场5分钟提醒', '离场10分钟提醒', '超时立即提醒', '自定义提醒时间'],
					success: (res) => {
						const options = ['15分钟', '5分钟', '超时', '自定义'];
						const selectedOption = options[res.tapIndex];

						if (res.tapIndex === 3) {
							// 自定义提醒时间
							uni.showModal({
								title: '自定义提醒时间',
								content: '请选择提前多少分钟提醒',
								editable: true,
								placeholderText: '请输入分钟数（如10）',
								success: (inputRes) => {
									if (inputRes.confirm && inputRes.content) {
										const minutes = parseInt(inputRes.content);
										if (minutes > 0 && minutes <= 60) {
											this.saveReminderSetting(data.type, `${minutes}分钟前`);
										} else {
											uni.showToast({
												title: '⚠️ 请输入1-60之间的数字',
												icon: 'none'
											});
										}
									}
								}
							});
						} else {
							this.saveReminderSetting(data.type, selectedOption);
						}
					}
				});
			},

			// 保存提醒设置
			saveReminderSetting(violationType, reminderTime) {
				try {
					// 获取现有设置
					let reminders = uni.getStorageSync('parking_reminders') || {};
					reminders[violationType] = {
						time: reminderTime,
						enabled: true,
						setDate: new Date().toISOString()
					};

					// 保存到本地存储
					uni.setStorageSync('parking_reminders', reminders);

					uni.showModal({
						title: '提醒设置成功',
						content: `已为"${violationType}"设置${reminderTime}提醒\n\n📱 提醒方式：系统通知\n生效时间：下次停车时\n\n您可以在设置中修改或关闭提醒。`,
						showCancel: true,
						cancelText: '知道',
						confirmText: '管理提醒',
						success: (res) => {
							if (res.confirm) {
								this.showReminderManagement();
							}
						}
					});
				} catch (e) {
					uni.showToast({
						title: '设置失败，请重试',
						icon: 'none'
					});
				}
			},

			// 提醒管理
			showReminderManagement() {
				try {
					const reminders = uni.getStorageSync('parking_reminders') || {};
					const reminderList = Object.entries(reminders).map(([type, setting]) =>
						`${type}${setting.time}${setting.enabled ? ' 已启用' : ' 已禁用'}`
					);

					if (reminderList.length === 0) {
						uni.showToast({
							title: '📝 暂无提醒设置',
							icon: 'none'
						});
						return;
					}

					uni.showModal({
						title: '🔧 提醒管理',
						content: `当前提醒设置：\n\n${reminderList.join('\n')}\n\n已启用 已禁用`,
						showCancel: true,
						cancelText: '返回',
						confirmText: '清空设置',
						success: (res) => {
							if (res.confirm) {
								uni.showModal({
									title: '⚠️ 确认清空',
									content: '确定要清空所有提醒设置吗',
									success: (confirmRes) => {
										if (confirmRes.confirm) {
											uni.removeStorageSync('parking_reminders');
											uni.showToast({
												title: '🗑️ 已清空所有提醒设置',
												icon: 'none'
											});
										}
									}
								});
							}
						}
					});
				} catch (e) {
					uni.showToast({
						title: '读取设置失败',
						icon: 'none'
					});
				}
			},

			// 显示指引模态框
			showGuideModal(data) {
				const guideContent = {
					'车位指引': {
						title: '🚗 车位指引',
						content: `🎯 正确停车步骤：\n\n1️⃣ 确认预约信息\n检查预约时间和车位号\n确认车位区域（A/B/C/D/E区）\n\n2️⃣ 寻找车位\n按照指示牌找到对应区域\n寻找标有车位号的位置\n注意区分新能源和普通车位\n\n3️⃣ 规范停车\n车辆完全停入白线内\n车头朝向统一方向\n保持与相邻车辆适当距离\n\n4️⃣ 离场检查\n确认个人物品已取走\n检查车门车窗已锁好\n按时离场避免超时`,
						actions: ['查看停车场地', '设置导航提醒', '了解车位类型']
					},
					'停车攻略': {
						title: '📋 停车攻略',
						content: `💡 停车小贴士：\n\n🎯 高效停车\n提前5-10分钟到达\n熟悉停车场布局\n选择较宽敞的车位\n\n时间管理\n预留充足的停车时间\n设置离场提醒\n避开高峰期（15:00-16:00）\n\n🚗 停车技巧\n倒车入库更规范\n观察相邻车辆情况\n保持车辆居中\n\n🔄 良好习惯\n遵守预约时间\n不占用他人车位\n定期检查违规记录`,
						actions: ['下载攻略PDF', '分享给朋友', '查看实用工具']
					}
				};

				const guide = guideContent[data.type] || {
					title: '📖 使用指引',
					content: '相关指引内容正在完善中，敬请期待',
					actions: ['反馈建议']
				};

				uni.showModal({
					title: guide.title,
					content: guide.content,
					showCancel: true,
					cancelText: '知道',
					// confirmText: '更多操作',
					// success: (res) => {
					// 	if (res.confirm) {
					// 		this.showGuideActions(data.type, guide.actions);
					// 	}
					// }
				});
			},

			// 显示指引操作选项
			showGuideActions(type, actions) {
				uni.showActionSheet({
					title: '选择操作',
					itemList: [...actions, '收藏这个指引'],
					success: (res) => {
						if (res.tapIndex === actions.length) {
							// 收藏功能
							this.saveGuideToFavorites(type);
						} else {
							// 其他操作
							this.handleGuideAction(type, actions[res.tapIndex]);
						}
					}
				});
			},

			// 处理指引操作
			handleGuideAction(type, action) {
				const actionHandlers = {
					'查看停车场地': () => {
						uni.showModal({
							title: '🗺️ 停车场地',
							content: `📍 停车场区域分布：\n\n🅰️ A区：主入口附近，方便快捷\n🅱️ B区：中央区域，车位充足\n🅲️ C区：后方区域，环境安静\n🅳️ D区：侧门附近，进出便利\n🅴️ E区：新能源专用区\n\n💡 建议：\n新手选择A区或B区车位较宽\n赶时间选择D区近侧门\n新能源车辆请选择E区`,
							showCancel: false,
							confirmText: '知道'
						});
					},
					'设置导航提醒': () => {
						uni.showModal({
							title: '🧭 导航提醒已设置',
							content: `已为您设置以下提醒：\n\n📍 到达停车场前500米提醒\n🅿️ 进入停车场时播报区域信息\n预约时间5分钟提醒\n🚗 找到车位时震动提醒\n\n下次停车时将自动启用这些提醒功能。`,
							showCancel: false,
							confirmText: '太棒了'
						});
					},
					'了解车位类型': () => {
						uni.showModal({
							title: '🚗 车位类型说明',
							content: `🔵 普通车位\n标准尺寸0.5m × 5.0m\n适用于燃油车\n蓝色标线\n\n🟢 新能源车位\n配备充电桩\n绿色标线标识\n仅限新能源车辆\n\n🟡 大型车位\n加长尺寸0.0m × 6.0m\n适用于SUV、商务车\n黄色标线\n\n🔴 无障碍车位\n靠近出入口\n预留轮椅通道\n需相关证件`,
							showCancel: false,
							confirmText: '明白'
						});
					},
					'下载攻略PDF': () => {
						uni.showLoading({
							title: '生成...'
						});
						setTimeout(() => {
							uni.hideLoading();
							uni.showModal({
								title: '📄 攻略下载',
								content: `攻略已生成并保存到相册\n\n📋 包含内容：\n停车技巧图解\n常见问题解答\n应急联系方式\n费用计算方法\n\n💾 文件大小0.3MB\n📅 更新时间${new Date().toLocaleDateString()}`,
								showCancel: false,
								confirmText: '查看文件'
							});
						}, 1500);
					},
					'分享给朋友': () => {
						uni.showModal({
							title: '📤 分享停车攻略',
							content: `选择分享方式：\n\n💬 微信好友\n👥 微信群聊\n📱 朋友圈\n📋 复制链接\n\n分享内容包括：停车技巧、注意事项、实用工具等`,
							showCancel: true,
							cancelText: '取消',
							confirmText: '立即分享',
							success: (res) => {
								if (res.confirm) {
									uni.showToast({
										title: '🎉 分享成功！\n帮助朋友一起规范停车',
										icon: 'none',
										duration: 2000
									});
								}
							}
						});
					},
					'查看实用工具': () => {
						uni.showActionSheet({
							title: '🛠️ 实用工具',
							itemList: [
								'停车费用计算',
								'停车时间提醒',
								'违规自查工具',
								'停车场导览',
								'在线客服咨询'
							],
							success: (toolRes) => {
								const tools = [
									'💰 费用计算器：根据停车时长自动计算费用',
									'时间提醒器：设置离场提醒，避免超时',
									'🔍 违规自查：检查车辆是否规范停车',
									'🧭 停车导航：最短路径找到空闲车位',
									'💬 在线客服4小时专业停车咨询'
								];
								uni.showModal({
									title: '🛠️ 工具说明',
									content: tools[toolRes.tapIndex],
									showCancel: false,
									confirmText: '使用工具'
								});
							}
						});
					},
					'反馈建议': () => {
						uni.showModal({
							title: '💭 反馈建议',
							content: '感谢您的反馈！请告诉我们',
							editable: true,
							placeholderText: '请输入您的建议或需要的指引内容...',
							success: (res) => {
								if (res.confirm && res.content) {
									uni.showToast({
										title: '📝 反馈已提交\n我们会尽快完善相关内容',
										icon: 'none',
										duration: 2000
									});
								}
							}
						});
					}
				};

				const handler = actionHandlers[action];
				if (handler) {
					handler();
				} else {
					uni.showToast({
						title: `🔧 ${action}功能即将上线`,
						icon: 'none'
					});
				}
			},

			// 保存指引到收藏夹
			saveGuideToFavorites(type) {
				try {
					let favorites = uni.getStorageSync('parking_guides_favorites') || [];

					if (favorites.includes(type)) {
						uni.showToast({
							title: '📚 已在收藏夹中',
							icon: 'none'
						});
						return;
					}

					favorites.push(type);
					uni.setStorageSync('parking_guides_favorites', favorites);

					uni.showModal({
						title: '收藏成功',
						content: `已将"${type}"添加到收藏夹\n\n📚 收藏夹功能：\n快速访问常用指引\n离线查看指引内容\n个性化推荐相关内容\n\n您可以在个人中心查看所有收藏的指引。`,
						showCancel: true,
						cancelText: '知道',
						confirmText: '查看收藏',
						success: (res) => {
							if (res.confirm) {
								this.showFavoriteGuides();
							}
						}
					});
				} catch (e) {
					uni.showToast({
						title: '收藏失败',
						icon: 'none'
					});
				}
			},

			// 显示收藏的指�?
			showFavoriteGuides() {
				try {
					const favorites = uni.getStorageSync('parking_guides_favorites') || [];

					if (favorites.length === 0) {
						uni.showToast({
							title: '📚 收藏夹为空\n快去收藏实用指引',
							icon: 'none'
						});
						return;
					}

					uni.showActionSheet({
						title: `📚 我的收藏${favorites.length}个）`,
						itemList: [...favorites, '清空收藏'],
						success: (res) => {
							if (res.tapIndex === favorites.length) {
								// 清空收藏
								uni.showModal({
									title: '⚠️ 确认清空',
									content: '确定要清空收藏夹吗？此操作不可恢复',
									success: (confirmRes) => {
										if (confirmRes.confirm) {
											uni.removeStorageSync('parking_guides_favorites');
											uni.showToast({
												title: '🗑️ 收藏夹已清空',
												icon: 'none'
											});
										}
									}
								});
							} else {
								// 查看收藏的指引
								const selectedGuide = favorites[res.tapIndex];
								this.showGuideModal({
									type: selectedGuide
								});
							}
						}
					});
				} catch (e) {
					uni.showToast({
						title: '读取收藏失败',
						icon: 'none'
					});
				}
			},

			// 显示停车技巧
			showTutorialModal(data) {
				uni.showModal({
					title: '🎓 停车技巧教学',
					content: `📐 规范停车要点：\n\n🎯 停车准备\n调整后视镜角度\n确认车位大小合适\n观察周围环境\n\n🚗 倒车入库步骤\n1️⃣ 车辆与车位成45度角\n2️⃣ 缓慢倒车至车尾入位\n3️⃣ 调整方向盘回正\n4️⃣ 继续倒车至合适位置\n\n📏 位置标准\n车身与标线平行\n前后留有适当距离\n左右居中不压线\n\n⚠️ 注意事项\n控制车速，缓慢操作\n多观察后视镜\n必要时下车查看`,
					showCancel: true,
					cancelText: '知道',
					// confirmText: '学习资源',
					// success: (res) => {
					// 	if (res.confirm) {
					// 		this.showParkingTutorialOptions();
					// 	}
					// }
				});
			},

			// 显示停车教学选项
			showParkingTutorialOptions() {
				uni.showActionSheet({
					title: '🎓 停车技巧学习',
					itemList: [
						'📹 观看教学视频',
						'📖 图文教程',
						'🎮 互动练习',
						'常见问题',
						'技能测试'
					],
					success: (res) => {
						switch (res.tapIndex) {
							case 0:
								this.showTutorialVideos();
								break;
							case 1:
								this.showTutorialGuides();
								break;
							case 2:
								this.showInteractivePractice();
								break;
							case 3:
								this.showParkingFAQ();
								break;
							case 4:
								this.showSkillTest();
								break;
						}
					}
				});
			},

			// 显示教学视频
			showTutorialVideos() {
				uni.showActionSheet({
					title: '📹 停车教学视频',
					itemList: [
						'🅰️ 基础篇：新手入门 (3分钟)',
						'🅱️ 技巧篇：倒车入库 (5分钟)',
						'🅲️ 进阶篇：侧方停车 (4分钟)',
						'🅳️ 实战篇：复杂环境 (6分钟)',
						'🎯 全集连播 (18分钟)'
					],
					success: (res) => {
						const videos = [{
								title: '新手入门',
								duration: '3:24',
								desc: '停车基础知识和准备工',
							},
							{
								title: '倒车入库',
								duration: '5:18',
								desc: '标准倒车入库技巧详',
							},
							{
								title: '侧方停车',
								duration: '4:32',
								desc: '侧方位停车步骤和要点'
							},
							{
								title: '复杂环境',
								duration: '6:45',
								desc: '狭窄空间和特殊情况处',
							},
							{
								title: '全集连播',
								duration: '18:59',
								desc: '完整停车技巧课',
							}
						];

						const video = videos[res.tapIndex];
						this.playTutorialVideo(video);
					}
				});
			},

			// 播放教学视频
			playTutorialVideo(video) {
				uni.showLoading({
					title: '加载...'
				});

				// 模拟视频加载
				setTimeout(() => {
					uni.hideLoading();

					uni.showModal({
						title: `📹 ${video.title}`,
						content: `▶️ 正在播放${video.title}`,
						success: (res) => {
							if (res.confirm) {
								uni.showToast({
									title: '🎓 恭喜完成学习！\n获得停车技能经验10',
									icon: 'none',
									duration: 2500
								});
							} else {
								this.playTutorialVideo(video);
							}
						}
					});
				}, 2000);
			},

			// 显示图文教程
			showTutorialGuides() {
				uni.showActionSheet({
					title: '📖 图文教程',
					itemList: [
						'📐 倒车入库步骤图解',
						'📏 车位判断方法',
						'🔍 后视镜使用技巧',
						'⚠️ 常见错误避免',
						'🚗 不同车型技巧'
					],
					success: (res) => {
						const guides = [{
								title: '倒车入库步骤图解',
								content: '📐 图解步骤：\n\n1️⃣ 准备阶段\n确认周围环境安全\n调整座椅和后视镜\n将车辆停在车位前1.5米\n\n2️⃣ 开始倒车\n挂倒档，缓慢倒车\n观察左后视镜中的引导线\n当后轮接近车位线时准备转向\n\n3️⃣ 转向入库\n快速向左打满方向盘\n继续倒车至车身与车位平行\n观察车身是否居中\n\n4️⃣ 调整停车\n回正方向盘\n继续倒车至合适位置\n挂P档，拉手刹完成停车'
							},
							{
								title: '车位判断方法',
								content: '📏 车位判断要点：\n\n🔍 长度判断：\n车位长度应大于车身1.5倍\n预留前后0.5米空间\n考虑开门需要的空间\n\n📐 宽度判断：\n车位宽度应大于车身0.8米\n两侧各预留0.4米空间\n确保能正常开关车门\n\n快速判断法：\n目测车位能容纳1.5个车身长度即可使用'
							},
							{
								title: '后视镜使用技巧',
								content: '🔍 后视镜调整与使用：\n\n🪟 左后视镜：\n能看到车身1/4\n地面占镜面下1/3\n观察左后轮与标线关系\n\n🪟 右后视镜：\n向下调整看到后轮\n观察右后轮入位情况\n监控与相邻车辆距离\n\n🪟 中央后视镜：\n观察后方车辆\n判断倒车安全距离\n确认后方无障碍物'
							}
						];

						if (res.tapIndex < guides.length) {
							const guide = guides[res.tapIndex];
							uni.showModal({
								title: '📖 ' + guide.title,
								content: guide.content,
								showCancel: false,
								confirmText: '已掌握'
							});
						} else {
							uni.showToast({
								title: '📖 教程正在制作中\n敬请期待',
								icon: 'none'
							});
						}
					}
				});
			},

			// 显示互动练习
			showInteractivePractice() {
				uni.showModal({
					title: '🎮 互动练习',
					content: '🎯 停车模拟练习场\n\n选择练习模式：\n\n🟦 初级模式\n宽敞车位，标准环境\n实时语音指导\n详细步骤提示\n\n🟨 中级模式\n普通车位，真实环境\n关键点提示\n错误操作纠正\n\n🟥 高级模式\n狭窄车位，困难环境\n无提示，自主操作\n专业评分系统',
					showCancel: true,
					cancelText: '稍后练习',
					confirmText: '开始练习',
					success: (res) => {
						if (res.confirm) {
							this.startParkingPractice();
						}
					}
				});
			},

			// 开始停车练习
			startParkingPractice() {
				let score = 0;
				let step = 1;

				const practiceStep = () => {
					const steps = [{
							title: '观察环境',
							desc: '请观察周围环境，确认安全',
							points: 20
						},
						{
							title: '调整角度',
							desc: '将车辆调整到45度角',
							points: 25
						},
						{
							title: '开始倒车',
							desc: '缓慢倒车，观察后视镜',
							points: 30
						},
						{
							title: '调整方向',
							desc: '适时调整方向盘，保持居中',
							points: 25
						}
					];

					if (step <= steps.length) {
						const currentStep = steps[step - 1];
						uni.showModal({
							title: '🎮 练习步骤 ' + step + '/4',
							content: currentStep.title + '\n\n' + currentStep.desc + '\n\n🎯 本步骤分值：' +
								currentStep.points + '分\n📊 当前总分：' + score + '分',
							showCancel: true,
							cancelText: '重新开始',
							confirmText: step < 4 ? '完成此步' : '完成练习',
							success: (res) => {
								if (res.confirm) {
									// 随机评分
									const stepScore = Math.floor(currentStep.points * (0.7 + Math
										.random() * 0.3));
									score += stepScore;
									step++;

									if (step <= 4) {
										practiceStep();
									} else {
										// 练习完成
										let level = '优秀';
										let emoji = '🏆';
										if (score < 60) {
											level = '需要改进';
											emoji = '📚';
										} else if (score < 80) {
											level = '良好';
											emoji = '👍';
										}

										uni.showModal({
											title: emoji + ' 练习完成',
											content: '🎉 恭喜完成停车练习！\n\n📊 最终得分：' + score +
												'/100分\n🏅 评价等级：' + level + '\n\n📈 能力分析：\n环境观察：' +
												steps[0].title + ' ✓\n角度控制：' + steps[1].title +
												' ✓\n倒车技巧：' + steps[2].title + ' ✓\n精准停车：' + steps[
													3].title + ' ✓\n\n' + (score >= 80 ?
													'🎖您已具备熟练的停车技能！' : '💪 继续练习，提升停车技巧！'),
											showCancel: true,
											cancelText: '再练一次',
											confirmText: '查看进度',
											success: (resultRes) => {
												if (resultRes.cancel) {
													this.startParkingPractice();
												} else {
													this.showLearningProgress();
												}
											}
										});
									}
								} else {
									// 重新开始
									score = 0;
									step = 1;
									practiceStep();
								}
							}
						});
					}
				};

				practiceStep();
			},

			// 显示学习进度
			showLearningProgress() {
				try {
					let progress = uni.getStorageSync('parking_learning_progress') || {
						totalPractices: 0,
						bestScore: 0,
						completedVideos: 0,
						skillLevel: '新手'
					};

					progress.totalPractices++;
					progress.completedVideos = Math.max(progress.completedVideos, 1);

					// 更新技能等级
					if (progress.totalPractices >= 10 && progress.bestScore >= 90) {
						progress.skillLevel = '专家';
					} else if (progress.totalPractices >= 5 && progress.bestScore >= 80) {
						progress.skillLevel = '熟练';
					} else if (progress.totalPractices >= 3 && progress.bestScore >= 70) {
						progress.skillLevel = '良好';
					}

					uni.setStorageSync('parking_learning_progress', progress);

					uni.showModal({
						title: '📊 学习进度',
						content: '🎓 您的停车技能进度：\n\n🏆 当前等级：' + progress.skillLevel + '\n🎯 练习次数：' + progress
							.totalPractices + '次\n📊 最佳成绩：' + progress.bestScore + '分\n📹 观看视频：' + progress
							.completedVideos +
							'个\n\n📈 升级条件：\n新手→良好：练习3次，成绩70+\n良好→熟练：练习5次，成绩80+\n熟练→专家：练习10次，成绩90+\n\n💪 继续努力，提升停车技能！',
						showCancel: false,
						confirmText: '继续学习'
					});
				} catch (e) {
					uni.showToast({
						title: '进度保存失败',
						icon: 'none'
					});
				}
			},

			// 显示常见问题
			showParkingFAQ() {
				uni.showActionSheet({
					title: '停车常见问题',
					itemList: [
						'倒车时看不清后方怎么办？',
						'车位太小怎么停？',
						'雨天停车注意什么？',
						'新能源车充电桩怎么用？',
						'停车费用怎么计算'
					],
					success: (res) => {
						const faqs = [{
								q: '倒车时看不清后方怎么办？',
								a: '解决方案：\n\n1️⃣ 正确调整后视镜\n左镜：看到车身1/4和地面\n右镜：向下调整看到后轮\n\n2️⃣ 使用倒车辅助\n倒车雷达提示距离\n倒车影像观察路况\n\n3️⃣ 必要时下车观察\n复杂环境建议下车查看\n请他人协助指挥\n\n4️⃣ 放慢速度\n控制车速在5km/h以下\n随时准备停车调整'
							},
							{
								q: '车位太小怎么停？',
								a: '应对策略：\n\n🔍 重新评估\n确认车位是否真的过小\n测量预留空间是否充足\n\n📐 调整策略\n选择最佳进入角度\n多次调整优化位置\n\n⚠️ 安全优先\n过于狭窄的车位建议放弃\n避免刮蹭风险\n\n🆘 寻求帮助\n请现场工作人员协助\n寻找其他合适车位'
							}
						];

						if (res.tapIndex < faqs.length) {
							const faq = faqs[res.tapIndex];
							uni.showModal({
								title: faq.q,
								content: faq.a,
								showCancel: false,
								confirmText: '明白'
							});
						} else {
							uni.showToast({
								title: '📝 更多FAQ正在整理\n如有疑问可联系客服',
								icon: 'none'
							});
						}
					}
				});
			},

			// 显示技能测试
			showSkillTest() {
				uni.showModal({
					title: '📊 停车技能测试',
					content: '🎯 测试您的停车理论知识\n\n📋 测试内容：\n停车安全知识 (25%)\n操作技巧理论 (25%)\n规则法规掌握 (25%)\n实际应用能力 (25%)\n\n⏰ 测试时间：5分钟\n📝 题目数量：10道选择题\n🏆 及格分数：80分\n\n💡 通过测试可获得：\n停车技能认证证书\n专属技能徽章\n经验值奖励',
					showCancel: true,
					cancelText: '稍后测试',
					confirmText: '开始测试',
					success: (res) => {
						if (res.confirm) {
							this.startSkillTest();
						}
					}
				});
			},

			// 开始技能测试
			startSkillTest() {
				const questions = [{
						q: '倒车入库时，最佳的观察方法是？',
						options: ['只看后视镜', '只看倒车影像', '后视镜和倒车影像结合', '完全凭感觉'],
						answer: 2
					},
					{
						q: '停车时与相邻车辆的安全距离应保持多少？',
						options: ['10cm', '30cm', '50cm', '80cm'],
						answer: 2
					},
					{
						q: '雨天停车最需要注意什么？',
						options: ['车速控制', '视线清晰', '地面湿滑', '以上都是'],
						answer: 3
					}
				];

				let currentQ = 0;
				let score = 0;

				const showQuestion = () => {
					if (currentQ < questions.length) {
						const q = questions[currentQ];
						uni.showActionSheet({
							title: '📝 ' + (currentQ + 1) + '/' + questions.length + '题\n\n' + q.q,
							itemList: q.options,
							success: (res) => {
								if (res.tapIndex === q.answer) {
									score += Math.floor(100 / questions.length);
									uni.showToast({
										title: '✅ 答对了！',
										icon: 'success',
										duration: 1000
									});
								} else {
									uni.showToast({
										title: '❌ 答错了',
										icon: 'error',
										duration: 1000
									});
								}

								currentQ++;
								setTimeout(() => {
									if (currentQ < questions.length) {
										showQuestion();
									} else {
										// 测试完成
										const passed = score >= 80;
										uni.showModal({
											title: passed ? '🎉 测试通过' : '📚 需要加强',
											content: '📊 测试结果：\n\n🎯 得分：' + score +
												'/100分\n📈 正确率：' + Math.floor(score) +
												'%\n🏆 评级：' + (passed ? '优秀' : '需提升') +
												'\n\n' + (passed ?
													'🎖恭喜获得停车技能认证！\n您已掌握基本停车知识和技巧' :
													'💪 建议继续学习停车技巧，\n观看教学视频和多加练习'),
											showCancel: true,
											cancelText: '重新测试',
											confirmText: '查看证书',
											success: (testRes) => {
												if (testRes.cancel) {
													this.startSkillTest();
												} else if (passed) {
													this.showCertificate(score);
												}
											}
										});
									}
								}, 1500);
							}
						});
					}
				};

				showQuestion();
			},

			// 显示技能证书
			showCertificate(score) {
				const date = new Date().toLocaleDateString();
				uni.showModal({
					title: '🏆 停车技能认证证书',
					content: '╔══════════════════╗\n║   停车技能认证证书   ║\n╠══════════════════╣\n║                  ║\n║ 🎓 技能等级：优秀    ║\n║ 📊 测试得分：' +
						score + '分  ║\n║ 📅 认证日期：' + date +
						' ║\n║ 🏅 证书编号：PK2024001 ║\n║                  ║\n║    恭喜您通过测试    ║\n║                  ║\n╚══════════════════╝\n\n🎉 您已获得停车技能认证！\n可在个人中心查看和分享证书。',
					showCancel: true,
					cancelText: '保存证书',
					confirmText: '分享成就',
					success: (res) => {
						if (res.confirm) {
							uni.showToast({
								title: '🎊 分享成功！\n让朋友看看您的停车技巧',
								icon: 'none',
								duration: 2000
							});
						} else {
							uni.showToast({
								title: '💾 证书已保存到相册',
								icon: 'none',
								duration: 2000
							});
						}
					}
				});
			},

			// 显示预约规则
			showRulesModal(data) {
				uni.showModal({
					title: '📋 预约停车规则',
					content: '🅿️ 预约时间规定：\n\n🎯 预约要求\n必须提前预约停车位\n预约时间精确到分钟\n最多可预约3天内的时间\n\n⏰ 时间限制\n提前到达：可提前15分钟\n准时到达：按预约时间\n迟到处理：超30分钟视为违规\n\n🚫 违规情况\n无预约直接停车\n超出预约时间停车\n停放非预约车位\n\n💰 处理规定\n首次违规：警告\n累计违规：扣除信用分\n严重违规：暂停预约权限',
					showCancel: true,
					cancelText: '知道了',
					confirmText: '立即预约',
					success: (res) => {
						if (res.confirm) {
							this.showParkingReservation();
						}
					}
				});
			},

			// 显示停车预约界面
			showParkingReservation() {
				uni.showActionSheet({
					title: '🅿️ 停车预约服务',
					itemList: [
						'🚗 预约今日停车',
						'📅 预约明日停车',
						'🔄 预约多日停车',
						'👀 查看我的预约',
						'⚙️ 预约设置'
					],
					success: (res) => {
						switch (res.tapIndex) {
							case 0:
								this.reserveToday();
								break;
							case 1:
								this.reserveTomorrow();
								break;
							case 2:
								this.reserveMultipleDays();
								break;
							case 3:
								this.viewMyReservations();
								break;
							case 4:
								this.showReservationSettings();
								break;
						}
					}
				});
			},

			// 预约今日停车
			reserveToday() {
				const now = new Date();
				const todayStr = now.toLocaleDateString();
				const currentHour = now.getHours();
				const timeSlots = [];

				// 生成今日剩余时间段
				for (let hour = Math.max(currentHour + 1, 8); hour <= 22; hour++) {
					timeSlots.push(hour.toString().padStart(2, '0') + ':00-' + (hour + 2).toString().padStart(2, '0') +
						':00');
				}

				if (timeSlots.length === 0) {
					uni.showToast({
						title: '今日预约时间已过\n请预约明日停车',
						icon: 'none',
						duration: 2000
					});
					return;
				}

				uni.showActionSheet({
					title: '📅 今日 ' + todayStr + ' 可预约时段',
					itemList: timeSlots,
					success: (res) => {
						const selectedTime = timeSlots[res.tapIndex];
						this.confirmReservation('今日', selectedTime);
					}
				});
			},

			// 预约明日停车
			reserveTomorrow() {
				const tomorrow = new Date();
				tomorrow.setDate(tomorrow.getDate() + 1);
				const tomorrowStr = tomorrow.toLocaleDateString();

				const timeSlots = [];
				for (let hour = 8; hour <= 22; hour += 2) {
					timeSlots.push(hour.toString().padStart(2, '0') + ':00-' + (hour + 2).toString().padStart(2, '0') +
						':00');
				}

				uni.showActionSheet({
					title: '📅 明日 ' + tomorrowStr + ' 可预约时段',
					itemList: timeSlots,
					success: (res) => {
						const selectedTime = timeSlots[res.tapIndex];
						this.confirmReservation('明日', selectedTime);
					}
				});
			},

			// 预约多日停车
			reserveMultipleDays() {
				uni.showModal({
					title: '📆 多日停车预约',
					content: '🔄 连续预约停车位\n\n📋 预约选项：\n工作日停车（周一至周五）\n周末停车（周六至周日）\n自定义日期范围\n\n💡 优势：\n固定车位保障\n批量预约折扣\n自动续约功能\n\n⏰ 时间：每日8:00-20:00\n💰 费用：按天计算，享受8.5折优惠',
					showCancel: true,
					cancelText: '稍后预约',
					confirmText: '配置预约',
					success: (res) => {
						if (res.confirm) {
							this.configureMultipleDaysReservation();
						}
					}
				});
			},

			// 配置多日预约
			configureMultipleDaysReservation() {
				uni.showActionSheet({
					title: '📅 选择预约模式',
					itemList: [
						'📝 工作日预约（周一至周五）',
						'🎯 周末预约（周六至周日）',
						'🗓 自定义日期（最多7天）',
						'🔄 定期预约（每周重复）'
					],
					success: (res) => {
						const modes = ['工作日', '周末', '自定义', '定期'];
						const selectedMode = modes[res.tapIndex];

						uni.showModal({
							title: selectedMode + '预约',
							content: '已选择' + selectedMode + '预约模式\n\n📋 预约详情：\n预约模式：' + selectedMode +
								'\n时间段：8:00-20:00\n车位类型：自动分配\n预计费用：¥15/天 × 8.5折\n\n🎁 多日预约优惠：\n连续3天：8.5折\n连续5天：8.0折\n连续7天：7.5折',
							showCancel: true,
							cancelText: '重新选择',
							confirmText: '确认预约',
							success: (confirmRes) => {
								if (confirmRes.confirm) {
									this.submitMultipleDaysReservation(selectedMode);
								} else {
									this.configureMultipleDaysReservation();
								}
							}
						});
					}
				});
			},

			// 提交多日预约
			submitMultipleDaysReservation(mode) {
				uni.showLoading({
					title: '预约中...'
				});

				setTimeout(() => {
					uni.hideLoading();

					const reservationId = 'RSV' + Date.now().toString().slice(-8);

					uni.showModal({
						title: '🎉 预约成功',
						content: mode + '停车预约已确认！\n\n📋 预约信息：\n🆔 预约编号：' + reservationId + '\n📅 预约模式：' +
							mode +
							'\n⏰ 时间：8:00-20:00\n🅿️ 车位：自动分配优质车位\n💰 费用：已享受多日优惠\n\n📱 重要提醒：\n系统将在预约时间前30分钟发送提醒\n请提前5分钟到达停车场\n如需变更请提前1小时操作',
						showCancel: true,
						cancelText: '保存到日历',
						confirmText: '查看详情',
						success: (res) => {
							if (res.confirm) {
								this.viewReservationDetail(reservationId, mode);
							} else {
								uni.showToast({
									title: '📅 预约已保存到系统日历\n可在我的预约中查看',
									icon: 'none',
									duration: 2500
								});
							}
						}
					});
				}, 2000);
			},

			// 查看预约详情
			viewReservationDetail(reservationId, mode) {
				uni.showModal({
					title: '📋 预约详情',
					content: `🆔 预约编号${reservationId}\n📅 预约模式：${mode}\n⏰ 时间：8:00-20:00\n🅿️ 车位：自动分配优质车位\n💰 费用：已享受多日优惠\n\n📱 重要提醒：\n系统将在预约时间前30分钟发送提醒\n请提前5分钟到达停车场\n如需变更请提前1小时操作`,
					showCancel: true,
					cancelText: '修改预约',
					confirmText: '分享预约',
					success: (res) => {
						if (res.confirm) {
							uni.showToast({
								title: '📤 分享成功！\n已将预约信息发送给联系人',
								icon: 'none',
								duration: 2000
							});
						} else {
							this.modifyReservation(reservationId);
						}
					}
				});
			},

			// 修改预约
			modifyReservation(reservationId) {
				uni.showActionSheet({
					title: `🔧 修改预约 ${reservationId}`,
					itemList: [
						'修改时间',
						'更换车位类型',
						'调整日期',
						'取消预约',
						'🔄 续约延期'
					],
					success: (res) => {
						const actions = ['修改时间', '更换车位', '调整日期', '取消预约', '续约延期'];
						const action = actions[res.tapIndex];

						if (action === '取消预约') {
							uni.showModal({
								title: '⚠️ 确认取消',
								content: `确定要取消预约${reservationId} 吗？\n\n💰 退款说明：\n提前24小时取消：全额退款\n提前2小时取消：扣20%手续费\n2小时内取消：扣除30%手续费\n\n当前时间距离预约时间充足，可全额退款。`,
								success: (confirmRes) => {
									if (confirmRes.confirm) {
										uni.showToast({
											title: '预约已取消\n退款将1-5个工作日到账',
											icon: 'none',
											duration: 2500
										});
									}
								}
							});
						} else {
							uni.showToast({
								title: `🔧 ${action}功能\n请联系客服：400-123-4567`,
								icon: 'none',
								duration: 2000
							});
						}
					}
				});
			},

			// 确认预约
			confirmReservation(day, timeSlot) {
				const areas = ['A区（近主入口）', 'B区（中央区域）', 'C区（安静区域）', 'D区（近侧门）', 'E区（新能源专用）'];

				uni.showActionSheet({
					title: `🅿️选择${day}停车区域\n${timeSlot}`,
					itemList: areas,
					success: (res) => {
						const selectedArea = areas[res.tapIndex];
						this.submitReservation(day, timeSlot, selectedArea);
					}
				});
			},

			// 提交预约
			submitReservation(day, timeSlot, area) {
				uni.showLoading({
					title: '预约...'
				});

				setTimeout(() => {
					uni.hideLoading();

					const reservationId = 'RSV' + Date.now().toString().slice(-6);
					const fee = area.includes('新能源') ? '¥25/小时' : '¥20/小时';

					uni.showModal({
						title: '🎉 预约成功',
						content: `停车预约已确认！\n\n📋 预约信息：\n🆔 预约编号${reservationId}\n📅 预约日期${day}\n预约时间${timeSlot}\n🅿️停车区域${area}\n💰 预计费用${fee}\n\n📱 温馨提示：\n请提前5分钟到达\n系统将发送到达提醒\n如需变更请提前1小时操作\n\n祝您停车愉快！`,
						showCancel: true,
						cancelText: '查看二维码',
						confirmText: '设置提醒',
						success: (res) => {
							if (res.confirm) {
								this.setReservationReminder(reservationId, timeSlot);
							} else {
								this.showReservationQRCode(reservationId);
							}
						}
					});
				}, 1500);
			},

			// 设置预约提醒
			setReservationReminder(reservationId, timeSlot) {
				uni.showActionSheet({
					title: `设置预约提醒\n${reservationId}`,
					itemList: [
						'📱 提前30分钟推送通知',
						'📲 提前15分钟短信提醒',
						'提前5分钟电话提醒',
						'🔄 全部提醒方式'
					],
					success: (res) => {
						const reminders = ['推送通知', '短信提醒', '电话提醒', '全部方式'];
						const selectedReminder = reminders[res.tapIndex];

						uni.showModal({
							title: '提醒设置成功',
							content: `已为预约 ${reservationId} 设置提醒\n\n提醒方式${selectedReminder}\n📅 预约时间${timeSlot}\n📱 提醒状态：已激活\n\n💡 提醒内容将包括：\n预约时间和地点\n停车区域和路线\n注意事项和联系方式\n\n您可以随时在"我的预约"中修改提醒设置。`,
							showCancel: false,
							confirmText: '完成设置'
						});
					}
				});
			},

			// 显示预约二维码
			showReservationQRCode(reservationId) {
				uni.showModal({
					title: '📱 预约凭证二维码',
					content: `┌─────────────────┐\n ██  ██  ██ │\n  ██  ██  ██ │\n  ██  ██  ██ │\n  ██  ██  ██ │\n ██  ██  ██ │\n└─────────────────┘\n\n🆔 预约编号${reservationId}\n\n📱 使用说明：\n到达停车场时出示此二维码\n工作人员将引导您到指定车位\n离场时同样需要出示二维码\n\n💾 建议保存到相册备用`,
					showCancel: true,
					cancelText: '保存二维码',
					confirmText: '发送到微信',
					success: (res) => {
						if (res.confirm) {
							uni.showToast({
								title: '📤 已发送到微信收藏\n方便您随时查看使用',
								icon: 'none',
								duration: 2000
							});
						} else {
							uni.showToast({
								title: '💾 二维码已保存到相册\n停车时请出示给工作人员',
								icon: 'none',
								duration: 2500
							});
						}
					}
				});
			},

			// 查看我的预约
			viewMyReservations() {
				const reservations = [{
						id: 'RSV001234',
						date: '今日',
						time: '14:00-16:00',
						area: 'A区',
						status: '已确认'
					},
					{
						id: 'RSV001235',
						date: '明日',
						time: '09:00-11:00',
						area: 'B区',
						status: '待到达'
					},
					{
						id: 'RSV001236',
						date: '后天',
						time: '15:00-17:00',
						area: 'E区',
						status: '待到达'
					}
				];

				if (reservations.length === 0) {
					uni.showToast({
						title: '📝 暂无预约记录\n快去预约停车位吧',
						icon: 'none',
						duration: 2000
					});
					return;
				}

				const reservationList = reservations.map(r =>
					`${r.date} ${r.time} | ${r.area} | ${r.status}`
				);

				uni.showActionSheet({
					title: `📋 我的预约${reservations.length}个）`,
					itemList: [...reservationList, '📅 预约日历视图'],
					success: (res) => {
						if (res.tapIndex === reservations.length) {
							this.showReservationCalendar();
						} else {
							const selectedReservation = reservations[res.tapIndex];
							this.viewReservationDetail(selectedReservation.id, selectedReservation.area);
						}
					}
				});
			},

			// 显示预约日历
			showReservationCalendar() {
				uni.showModal({
					title: '📅 预约日历',
					content: `📆 本月预约概览：\n\n🗓12月停车预约安排\n\n  一  二  三  四  五  六\n   1   2   3   4   5   6\n   7   8   9  10  11  12\n  13  14  15  16  17  18\n  19  20  21  22  23  24\n  25  26  27  28  29  30\n  31\n\n🅿️表示有预约\n📊 本月预约统计：\n总预约：3次\n已完成：0次\n待到达：3次\n\n💡 下个月可提前预约啦！`,
					showCancel: true,
					cancelText: '返回',
					confirmText: '下月预约',
					success: (res) => {
						if (res.confirm) {
							uni.showToast({
								title: '📅 下月预约功能\n将在月底开放',
								icon: 'none',
								duration: 2000
							});
						}
					}
				});
			},

			// 预约设置
			showReservationSettings() {
				uni.showActionSheet({
					title: '⚙️ 预约设置',
					itemList: [
						'🔔 提醒设置',
						'🅿️默认车位偏好',
						'💰 自动支付设置',
						'📱 快捷预约设置',
						'📧 邮件通知设置'
					],
					success: (res) => {
						const settings = [{
								title: '🔔 提醒设置',
								content: `当前提醒设置：\n\n📱 推送通知：已开启\n预约确认通知\n到达提醒（提前30分钟）\n离场提醒（剩余15分钟）\n\n📲 短信提醒：已开启\n重要预约变更\n系统维护通知\n\n📞 电话提醒：已关闭\n可在紧急情况下开启\n\n全部设置均可在个人中心修改。`
							},
							{
								title: '🅿️默认车位偏好',
								content: `🎯 您的车位偏好设置：\n\n📍 区域偏好：A区（近主入口）\n🚗 车位类型：标准车位\n🔌 充电需求：无需充电桩\n🏃 步行距离：优先近距离\n🌿 环境偏好：安静区域\n\n💡 系统将根据偏好为您推荐最合适的车位，您也可以在预约时手动选择其他区域。`
							}
						];

						if (res.tapIndex < settings.length) {
							const setting = settings[res.tapIndex];
							uni.showModal({
								title: setting.title,
								content: setting.content,
								showCancel: false,
								confirmText: '知道'
							});
						} else {
							uni.showToast({
								title: '⚙️ 更多设置选项\n正在开发中',
								icon: 'none',
								duration: 2000
							});
						}
					}
				});
			},

			// 显示信用规则
			showCreditRulesModal(data) {
				uni.showModal({
					title: '💳 信用分规则说明',
					content: `📊 当前信用分：${data.currentScore}分\n\n🎯 信用分等级\n优秀（100分）：绿色\n良好（79-99分）：黄色\n警告（59-78分）：红色\n\n扣分规则\n超时停车：-3分\n未按位停车：-2分\n占用他人车位：-5分\n未经授权停车：-8分\n\n加分规则\n连续30天无违规：+5分\n主动纠正违规：+2分\n协助管理：+3分\n\n🔄 恢复方式\n规范停车行为\n参与文明停车活动\n完成停车知识测试`,
					showCancel: true,
					cancelText: '知道',
					// confirmText: '提升信用',
					// success: (res) => {
					// 	if (res.confirm) {
					// 		this.showCreditImprovementOptions(data.currentScore);
					// 	}
					// }
				});
			},

			// 显示信用提升选项
			showCreditImprovementOptions(currentScore) {
				const improvementMethods = [
					'📚 学习停车知识',
					'🎯 完成挑战任务',
					'🤝 参与志愿服务',
					'📋 信用评估报告',
					'🎁 信用修复服务'
				];

				uni.showActionSheet({
					title: `📈 提升信用分（当前${currentScore}分）`,
					itemList: improvementMethods,
					success: (res) => {
						switch (res.tapIndex) {
							case 0:
								this.startCreditLearning();
								break;
							case 1:
								this.showCreditChallenges();
								break;
							case 2:
								this.showVolunteerService();
								break;
							case 3:
								this.showCreditReport(currentScore);
								break;
							case 4:
								this.showCreditRepairService(currentScore);
								break;
						}
					}
				});
			},

			// 开始信用学习
			startCreditLearning() {
				uni.showModal({
					title: '📚 信用知识学习',
					content: `🎓 信用提升学习计划\n\n📖 学习内容：\n停车文明规范 (必修)\n车位礼仪知识 (必修)\n交通安全法(选修)\n环保停车理念 (选修)\n\n学习方式：\n在线视频课程\n互动问答练习\n实践操作指导\n\n🎁 学习奖励：\n完成必修课程+5分\n完成选修课程+3分\n通过期末测试+2分`,
					showCancel: true,
					cancelText: '稍后学习',
					confirmText: '开始学习',
					success: (res) => {
						if (res.confirm) {
							this.startCreditCourses();
						}
					}
				});
			},

			// 开始信用课程
			startCreditCourses() {
				const courses = [{
						title: '停车文明规范',
						duration: '15分钟',
						reward: 5,
						required: true
					},
					{
						title: '车位礼仪知识',
						duration: '12分钟',
						reward: 5,
						required: true
					},
					{
						title: '交通安全法',
						duration: '20分钟',
						reward: 3,
						required: false
					},
					{
						title: '环保停车理念',
						duration: '10分钟',
						reward: 3,
						required: false
					}
				];

				const courseList = courses.map(c =>
					`${c.title} (${c.duration}) ${c.required ? '[必修]' : '[选修]'} +${c.reward}分`
				);

				uni.showActionSheet({
					title: '📚 选择学习课程',
					itemList: courseList,
					success: (res) => {
						const selectedCourse = courses[res.tapIndex];
						this.takeCourse(selectedCourse);
					}
				});
			},

			// 学习课程
			takeCourse(course) {
				uni.showLoading({
					title: '加载课程...'
				});

				setTimeout(() => {
					uni.hideLoading();

					uni.showModal({
						title: `📖 ${course.title}`,
						content: `🎥 正在学习${course.title}\n⏱️ 课程时长${course.duration}\n📚 课程类型${course.required ? '必修课程' : '选修课程'}\n\n📋 学习进度：\n1. 课程介绍\n2. 核心知识点\n3. 案例分析\n4. 实践应用\n5. 课程总结\n\n🎉 学习完成！\n\n💡 主要收获：\n掌握了规范停车的重要性\n学会了文明停车的具体方法\n提升了停车安全意识`,
						showCancel: true,
						cancelText: '重新学习',
						confirmText: '参加测试',
						success: (res) => {
							if (res.confirm) {
								this.takeCourseTest(course);
							} else {
								this.takeCourse(course);
							}
						}
					});
				}, 3000);
			},

			// 课程测试
			takeCourseTest(course) {
				const questions = [{
					q: `关于${course.title}，以下说法正确的是？`,
					options: ['按时停车最重要', '停车位置无所谓', '只要不违规就行', '要兼顾效率和文明'],
					answer: 3
				}];

				let score = 0;
				const question = questions[0];

				uni.showActionSheet({
					title: `📝 ${course.title}测试\n\n${question.q}`,
					itemList: question.options,
					success: (res) => {
						const isCorrect = res.tapIndex === question.answer;
						score = isCorrect ? 100 : 60;

						uni.showModal({
							title: isCorrect ? '🎉 测试通过' : '📚 继续努力',
							content: `📊 测试结果${score}分\n\n${isCorrect ? 
							`回答正确！\n🎁 获得信用分奖励：+${course.reward}分\n🏆 课程完成度：100%\n\n💡 您已掌握${course.title}的核心要点，继续保持！` : 
							`回答有误，正确答案是${question.options[question.answer]}\n📚 建议重新学习课程内容\n🎁 鼓励奖励${Math.floor(course.reward/2)}分`}`,
							showCancel: true,
							cancelText: '继续学习',
							confirmText: '查看证书',
							success: (testRes) => {
								if (testRes.confirm && isCorrect) {
									this.showCourseCertificate(course, score);
								} else {
									this.takeCourse(course);
								}
							}
						});
					}
				});
			},

			// 显示课程证书
			showCourseCertificate(course, score) {
				const date = new Date().toLocaleDateString();
				const certId = 'CRT' + Date.now().toString().slice(-6);

				uni.showModal({
					title: '🏆 课程完成证书',
					content: `╔════════════════════╗\n  停车文明学习证书   ║\n╠════════════════════╣\n                   ║\n📖 课程${course.title}\n📊 成绩${score}分\n📅 完成日期${date}\n🆔 证书编号${certId}\n🎁 信用奖励${course.reward}分\n                   ║\n   恭喜您完成学✨\n                   ║\n╚════════════════════╝\n\n🎉 您的信用分已提升！\n可在个人中心查看所有证书。`,
					showCancel: true,
					cancelText: '保存证书',
					confirmText: '继续学习',
					success: (res) => {
						if (res.confirm) {
							this.startCreditCourses();
						} else {
							// 保存证书到本地
							this.saveCertificate(certId, course.title, score);
						}
					}
				});
			},

			// 保存证书
			saveCertificate(certId, courseName, score) {
				try {
					let certificates = uni.getStorageSync('credit_certificates') || [];
					certificates.push({
						id: certId,
						course: courseName,
						score: score,
						date: new Date().toISOString(),
						type: 'learning'
					});
					uni.setStorageSync('credit_certificates', certificates);

					uni.showToast({
						title: '💾 证书已保存\n可在个人中心查看',
						icon: 'none',
						duration: 2000
					});
				} catch (e) {
					uni.showToast({
						title: '保存失败',
						icon: 'none'
					});
				}
			},

			// 显示信用挑战
			showCreditChallenges() {
				const challenges = [{
						title: '7天无违规挑战',
						reward: 8,
						difficulty: '简单',
						duration: '7天'
					},
					{
						title: '文明停车达人',
						reward: 15,
						difficulty: '中等',
						duration: '30天'
					},
					{
						title: '零违规月度冠军',
						reward: 25,
						difficulty: '困难',
						duration: '30天'
					},
					{
						title: '停车礼仪大使',
						reward: 20,
						difficulty: '中等',
						duration: '15天'
					}
				];

				const challengeList = challenges.map(c =>
					`${c.title} | ${c.difficulty} | ${c.duration} | +${c.reward}分`
				);

				uni.showActionSheet({
					title: '🎯 信用挑战任务',
					itemList: challengeList,
					success: (res) => {
						const selectedChallenge = challenges[res.tapIndex];
						this.startChallenge(selectedChallenge);
					}
				});
			},

			// 开始挑战
			startChallenge(challenge) {
				uni.showModal({
					title: `🎯 ${challenge.title}`,
					content: `🚀 准备开始挑战！\n\n📋 挑战详情：\n挑战名称${challenge.title}\n难度等级${challenge.difficulty}\n挑战周期${challenge.duration}\n信用奖励${challenge.reward}分\n\n🎯 挑战要求：\n严格遵守停车规范\n按时停车，按时离场\n保持良好停车习惯\n零违规记录\n\n⚠️ 注意事项：\n挑战期间任何违规都会导致挑战失败\n可以随时查看挑战进度\n完成挑战后立即获得奖励`,
					showCancel: true,
					cancelText: '稍后参加',
					confirmText: '接受挑战',
					success: (res) => {
						if (res.confirm) {
							this.acceptChallenge(challenge);
						}
					}
				});
			},

			// 接受挑战
			acceptChallenge(challenge) {
				try {
					const challengeId = 'CHL' + Date.now().toString().slice(-6);
					const startDate = new Date();
					const endDate = new Date();
					endDate.setDate(endDate.getDate() + parseInt(challenge.duration));

					const challengeData = {
						id: challengeId,
						title: challenge.title,
						reward: challenge.reward,
						difficulty: challenge.difficulty,
						duration: challenge.duration,
						startDate: startDate.toISOString(),
						endDate: endDate.toISOString(),
						status: 'active',
						progress: 0
					};

					// 保存挑战数据
					let activeChallenges = uni.getStorageSync('active_challenges') || [];
					activeChallenges.push(challengeData);
					uni.setStorageSync('active_challenges', activeChallenges);

					uni.showModal({
						title: '🎉 挑战已开始',
						content: `挑战"${challenge.title}"已开始！\n\n🆔 挑战编号${challengeId}\n📅 开始日期：${startDate.toLocaleDateString()}\n📅 结束日期${endDate.toLocaleDateString()}\n🎁 预期奖励${challenge.reward}分\n\n📊 挑战进度将实时更新\n🔔 系统会定期发送进度提醒\n💪 加油，相信您一定能成功！`,
						showCancel: true,
						cancelText: '查看进度',
						confirmText: '挑战列表',
						success: (res) => {
							if (res.cancel) {
								this.showChallengeProgress(challengeId);
							} else {
								this.showActiveChallenges();
							}
						}
					});
				} catch (e) {
					uni.showToast({
						title: '挑战开始失败',
						icon: 'none'
					});
				}
			},

			// 显示挑战进度
			showChallengeProgress(challengeId) {
				try {
					const activeChallenges = uni.getStorageSync('active_challenges') || [];
					const challenge = activeChallenges.find(c => c.id === challengeId);

					if (!challenge) {
						uni.showToast({
							title: '找不到挑战记录',
							icon: 'none'
						});
						return;
					}

					const now = new Date();
					const startDate = new Date(challenge.startDate);
					const endDate = new Date(challenge.endDate);
					const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
					const passedDays = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24));
					const progress = Math.min(Math.round((passedDays / totalDays) * 100), 100);

					uni.showModal({
						title: `📊 ${challenge.title}`,
						content: `🎯 挑战进度报告\n\n📈 完成进度${progress}%\n📅 已过天数${passedDays}/${totalDays}天\n剩余时间${Math.max(0, totalDays - passedDays)}天\n\n🎮 当前状态：${challenge.status === 'active' ? '进行💪' : '已完🎉'}\n🏆 违规记录✅\n📊 表现评级：优秀\n\n${progress >= 100 ? 
						'🎉 恭喜完成挑战！\n🎁 信用分奖励已发放' : 
						'💪 继续加油，保持良好记录！'}`,
						showCancel: false,
						confirmText: '继续努力'
					});
				} catch (e) {
					uni.showToast({
						title: '读取进度失败',
						icon: 'none'
					});
				}
			},

			// 显示活跃挑战
			showActiveChallenges() {
				try {
					const activeChallenges = uni.getStorageSync('active_challenges') || [];

					if (activeChallenges.length === 0) {
						uni.showToast({
							title: '📝 暂无进行中的挑战\n快去接受新挑战吧',
							icon: 'none',
							duration: 2000
						});
						return;
					}

					const challengeList = activeChallenges.map(c =>
						`${c.title} | ${c.difficulty} | ${c.status}`
					);

					uni.showActionSheet({
						title: `🎮 我的挑战${activeChallenges.length}个）`,
						itemList: challengeList,
						success: (res) => {
							const selectedChallenge = activeChallenges[res.tapIndex];
							this.showChallengeProgress(selectedChallenge.id);
						}
					});
				} catch (e) {
					uni.showToast({
						title: '读取挑战失败',
						icon: 'none'
					});
				}
			},

			// 显示志愿服务
			showVolunteerService() {
				uni.showModal({
					title: '🤝 停车志愿服务',
					content: `💝 参与社区停车管理志愿服务\n\n🎯 服务内容：\n协助新手停车指导\n维护停车场秩序\n宣传文明停车理念\n收集用户意见反馈\n\n服务时间：\n工作日：17:00-19:00\n周末9:00-11:00, 14:00-16:00\n\n🎁 志愿奖励：\n每小时服务：+3信用分\n月度优秀志愿者：+20信用分\n获得志愿服务证书\n专属志愿者徽章`,
					showCancel: true,
					cancelText: '了解更多',
					confirmText: '报名参加',
					success: (res) => {
						if (res.confirm) {
							this.registerVolunteer();
						} else {
							this.showVolunteerDetails();
						}
					}
				});
			},

			// 报名志愿
			registerVolunteer() {
				uni.showModal({
					title: '📝 志愿者报名',
					content: `感谢您的参与！请选择志愿服务时间：`,
					editable: true,
					placeholderText: '请输入您的手机号..',
					success: (res) => {
						if (res.confirm && res.content) {
							uni.showModal({
								title: '报名成功',
								content: `🎉 志愿者报名已提交！\n\n📱 联系方式${res.content}\n📅 审核时间-2个工作日\n🔔 审核结果将通过短信通知\n\n📋 后续流程：\n参加志愿者培训\n获得志愿者证件\n开始志愿服务\n获得信用分奖励\n\n谢谢您为文明停车贡献力量！`,
								showCancel: false,
								confirmText: '期待服务'
							});
						}
					}
				});
			},

			// 显示志愿者详情
			showVolunteerDetails() {
				uni.showModal({
					title: '🤝 志愿服务详情',
					content: `💡 为什么参与志愿服务？\n\n🌟 个人收益：\n提升个人信用分\n获得社区认可\n结识志同道合朋友\n提升沟通协调能力\n\n🏘社区价值：\n改善停车环境\n提升文明水平\n建设和谐社区\n传播正能量\n\n👥 加入我们的团队：\n目前已有158名志愿者\n累计服务时长3,240小时\n帮助新手停车1,680人次\n社区满意5%`,
					showCancel: false,
					confirmText: '我要参加'
				});
			},

			// 显示信用报告
			showCreditReport(currentScore) {
				const reportDate = new Date().toLocaleDateString();
				const level = currentScore >= 80 ? '优秀' : currentScore >= 60 ? '良好' : '需改进';
				const maxScore = 100;
				const percentile = Math.floor(Math.random() * 30) + 70; // 70-99百分比

				uni.showModal({
					title: '📋 个人信用评估报告',
					content: `📊 停车信用评估报告\n📅 报告日期${reportDate}\n\n💳 信用概况：\n当前信用分：${currentScore}/${maxScore}分\n信用等级${level}\n超越用户${percentile}%\n\n📈 历史趋势：\n30天变化：+5↗️\n最高信用分${Math.max(currentScore + 8, 95)}分\n最低信用分${Math.max(currentScore - 12, 45)}分\n\n🎯 改进建议：\n${currentScore >= 80 ? 
					'继续保持优秀表现\n可参与志愿服务获得额外加分' : 
					'学习停车知识课程\n参与信用挑战任务\n避免违规行为'}\n\n下次评估时间${new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString()}`,
					showCancel: true,
					cancelText: '下载报告',
					confirmText: '分享报告',
					success: (res) => {
						if (res.confirm) {
							uni.showToast({
								title: '📤 报告已分享\n让朋友看看您的信用表',
								icon: 'none',
								duration: 2000
							});
						} else {
							uni.showToast({
								title: '💾 报告已保存到相册\n可随时查看信用状',
								icon: 'none',
								duration: 2000
							});
						}
					}
				});
			},

			// 显示信用修复服务
			showCreditRepairService(currentScore) {
				if (currentScore >= 80) {
					uni.showModal({
						title: '🎉 信用状况良好',
						content: `您的信用分已经很优秀了！\n\n📊 当前信用分：${currentScore}分\n🏆 信用等级：优秀\n\n💡 维持建议：\n继续保持规范停车\n可参与志愿服务\n帮助他人提升信用\n\n🎁 优秀用户特权：\n优先车位分配\n费用优惠折扣\n绿色通道服务\n专属客服支持`,
						showCancel: false,
						confirmText: '继续保持'
					});
					return;
				}

				uni.showModal({
					title: '🔧 信用修复服务',
					content: `💊 专业信用修复方案\n\n📊 当前状况：\n信用分：${currentScore}分\n需要提升：${80 - currentScore}分\n预计时间：${Math.ceil((80 - currentScore) / 5)}周\n\n🛠️ 修复方案：\n个性化学习计划\n专属挑战任务\n一对一指导服务\n进度跟踪反馈\n\n💰 服务费用：\n基础方案：免费\n加速方案：¥29.9\n专享方案：¥99.9\n\n🎯 修复承诺：\n30天内提升至良好等级，否则全额退款！`,
					showCancel: true,
					cancelText: '免费方案',
					confirmText: '付费加速',
					success: (res) => {
						if (res.confirm) {
							this.showPaidRepairOptions(currentScore);
						} else {
							this.startFreeRepair(currentScore);
						}
					}
				});
			},

			// 显示付费修复选项
			showPaidRepairOptions(currentScore) {
				uni.showActionSheet({
					title: '💎 选择付费修复方案',
					itemList: [
						'⚡ 加速方案 ¥29.9 (15天达标)',
						'🚀 专享方案 ¥59.9 (7天达标)',
						'👑 VIP方案 ¥99.9 (3天达标)'
					],
					success: (res) => {
						const plans = [{
								name: '加速方案',
								price: '¥29.9',
								days: 15
							},
							{
								name: '专享方案',
								price: '¥59.9',
								days: 7
							},
							{
								name: 'VIP方案',
								price: '¥99.9',
								days: 3
							}
						];

						const selectedPlan = plans[res.tapIndex];

						uni.showModal({
							title: `💎 ${selectedPlan.name}`,
							content: `🎯 您选择了${selectedPlan.name}\n\n💰 费用：${selectedPlan.price}\n⏱️ 预计达标：${selectedPlan.days}天\n🎁 专享服务：\n专属学习课程\n24小时客服支持\n进度实时跟踪\n达标奖励双倍\n\n📋 服务保障：\n不满意全额退款\n达标时间承诺\n专业团队服务\n\n确认购买此方案吗？`,
							showCancel: true,
							cancelText: '重新选择',
							confirmText: '立即购买',
							success: (buyRes) => {
								if (buyRes.confirm) {
									this.purchaseRepairPlan(selectedPlan);
								} else {
									this.showPaidRepairOptions(currentScore);
								}
							}
						});
					}
				});
			},

			// 购买修复方案
			purchaseRepairPlan(plan) {
				uni.showLoading({
					title: '支付中...'
				});

				setTimeout(() => {
					uni.hideLoading();

					const orderId = 'ORD' + Date.now().toString().slice(-8);

					uni.showModal({
						title: '🎉 购买成功',
						content: `${plan.name}已激活！\n\n📋 订单信息：\n🆔 订单号：${orderId}\n💰 支付金额：${plan.price}\n⏱️ 服务期限：${plan.days}天\n📅 开始日期：${new Date().toLocaleDateString()}\n\n🎁 专享权益已开通：\nVIP学习通道\n专属客服服务\n双倍信用奖励\n进度实时监控\n\n💪 现在就开始您的信用提升之旅吧！`,
						showCancel: true,
						cancelText: '查看订单',
						confirmText: '开始修复',
						success: (res) => {
							if (res.confirm) {
								this.startPaidRepair(plan);
							} else {
								uni.showToast({
									title: '📋 订单已保存\n可在个人中心查看',
									icon: 'none',
									duration: 2000
								});
							}
						}
					});
				}, 2000);
			},

			// 开始付费修复
			startPaidRepair(plan) {
				uni.showModal({
					title: '🚀 VIP修复计划启动',
					content: `🎯 您的专属修复计划已启动\n\n📚 今日学习任务：\n观看VIP专享课程 (3个)\n完成高级挑战任务 (1个)\n参与模拟测试 (1次)\n\n🎁 双倍奖励加成：\n所有活动获得双倍信用分\nVIP专享课程额外+10分\n完美完成额外+5分\n\n📞 专属客服：\n微信：VIP-CS-001\n电话：400-VIP-123\n服务时间：7×24小时\n\n准备好开始了吗？`,
					showCancel: false,
					confirmText: '立即开始'
				});
			},

			// 开始免费修复
			startFreeRepair(currentScore) {
				uni.showModal({
					title: '📈 免费修复计划',
					content: `🎯 为您制定免费提升方案\n\n📚 推荐学习路径：\n完成停车知识课程 (+10分)\n参与7天无违规挑战 (+8分)\n观看教学视频 (+5分)\n通过知识测试 (+7分)\n\n⏰ 预计时间：2-3周\n🎯 目标分数：${Math.min(currentScore + 30, 100)}分\n\n💡 温馨提示：\n建议每天投入30分钟学习\n坚持规范停车行为\n可随时升级付费方案\n\n准备开始免费修复计划吗？`,
					showCancel: true,
					cancelText: '稍后开始',
					confirmText: '立即开始',
					success: (res) => {
						if (res.confirm) {
							this.startCreditLearning(); // 直接跳转到学习模式
						}
					}
				});
			}
		}
	}
</script>

<style lang="scss">
	/* 1. 容器和布局样式 */
	.new-violation-container {
		background: linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%);
		min-height: 100vh;
		padding-bottom: 40rpx;
	}

	/* 1.1. 筛选控制台样式 */
	.filter-control-panel {
		margin: 0 20rpx 16rpx;
		background: #ffffff;
		border-radius: 8rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
		overflow: hidden;

		.filter-options-horizontal {
			padding: 12rpx;
			display: flex;
			gap: 8rpx;

			.filter-item-horizontal {
				flex: 1;
				display: flex;
				align-items: center;
				padding: 12rpx 10rpx;
				background: #f8f9fa;
				border-radius: 6rpx;
				cursor: pointer;
				transition: all 0.3s ease;
				border: 1rpx solid #e9ecef;

				&:hover {
					background: #f0f0f0;
					border-color: #409EFF;
				}

				&:active {
					transform: translateY(1rpx);
				}

				.filter-content {
					flex: 1;
					display: flex;
					align-items: center;
					justify-content: space-between;
					width: 100%;

					.filter-label {
						font-size: 24rpx;
						color: #666;
						font-weight: 500;
						white-space: nowrap;
						margin-right: 6rpx;
					}

					.filter-value {
						display: flex;
						align-items: center;
						gap: 6rpx;
						flex: 1;
						justify-content: flex-end;

						.selected-plate {
							font-size: 28rpx;
							font-weight: 600;
							padding: 3rpx 10rpx;
							border-radius: 4rpx;
							max-width: 100rpx;
							overflow: hidden;
							text-overflow: ellipsis;
							white-space: nowrap;

							&.blue-plate {
								background: linear-gradient(180deg, #0C4FC5 0%, #216FEF 100%);
								color: #FFFFFF;
								border: 1rpx solid #0C4FC5;
							}

							&.green-plate {
								background: linear-gradient(180deg, #6AD390 0%, #D0F1E4 100%);
								color: #000000;
								border: 1rpx solid #6AD390;
							}
						}

						.selected-type,
						.selected-status {
							font-size: 24rpx;
							font-weight: 600;
							color: #333;
							text-align: right;
							max-width: 100rpx;
							overflow: hidden;
							text-overflow: ellipsis;
							white-space: nowrap;
						}
					}
				}
			}
		}

		/* 车牌识别测试按钮样式 */
		.plate-scanner-button-container {
			padding: 12rpx;
			border-top: 1rpx solid #e9ecef;

			.plate-scanner-button {
				width: 100%;
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 10rpx;
				padding: 16rpx 20rpx;
				background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
				color: #ffffff;
				border-radius: 8rpx;
				font-weight: 600;
				font-size: 28rpx;
				transition: all 0.3s ease;
				box-shadow: 0 2rpx 8rpx rgba(82, 196, 26, 0.2);
				cursor: pointer;

				&:hover {
					background: linear-gradient(135deg, #389e0d 0%, #52c41a 100%);
					box-shadow: 0 4rpx 12rpx rgba(82, 196, 26, 0.3);
					transform: translateY(-2rpx);
				}

				&:active {
					transform: translateY(0);
					box-shadow: 0 2rpx 6rpx rgba(82, 196, 26, 0.2);
				}

				.scanner-icon {
					font-size: 32rpx;
				}

				.scanner-text {
					color: #ffffff;
					font-weight: 600;
				}
			}
		}
	}

	/* 1.2. 单独的高危车辆提醒样�?*/
	.high-risk-vehicle-standalone {
		display: flex;
		align-items: center;
		padding: 20rpx 30rpx;
		margin: 0 20rpx 20rpx;
		background: linear-gradient(135deg, #ffebee, #ffcdd2);
		border-radius: 12rpx;
		box-shadow: 0 2rpx 12rpx rgba(244, 67, 54, 0.15);
		border: 1rpx solid #ffcdd2;
		animation: high-risk-breath 2s ease-in-out infinite;

		.warning-icon {
			font-size: 40rpx;
			margin-right: 20rpx;
			animation: warning-icon-shake 2s ease-in-out infinite;
		}

		.warning-content {
			flex: 1;
			display: flex;
			align-items: center;
			gap: 20rpx;

			.warning-title {
				font-size: 26rpx;
				color: #d32f2f;
				white-space: nowrap;
				font-weight: 600;
				animation: warning-text-pulse 2s ease-in-out infinite;
			}

			.warning-plate {
				padding: 6rpx 20rpx;
				border-radius: 6rpx;
				font-size: 32rpx;
				font-weight: bold;
				animation: warning-plate-pulse 2s ease-in-out infinite;

				&.blue-plate {
					background: linear-gradient(to bottom, #216fef, #0c4fc5) !important;
					color: #ffffff;
				}

				&.green-plate {
					background: linear-gradient(to bottom, #d0f1e4, #6ad390) !important;
					color: #000;
				}

				&.clickable-plate {
					cursor: pointer;
					transition: all 0.3s ease;
					position: relative;

					&::after {
						content: '👆';
						position: absolute;
						right: -30rpx;
						top: 50%;
						transform: translateY(-50%);
						font-size: 20rpx;
						opacity: 0.7;
						animation: tap-hint 2s ease-in-out infinite;
					}

					&:hover {
						transform: scale(1.05);
						box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
					}

					&:active {
						transform: scale(0.98);
					}
				}
			}

			.warning-count {
				font-size: 26rpx;
				color: #c62828;
				white-space: nowrap;
				font-weight: 600;
				animation: warning-text-pulse 2s ease-in-out infinite;
			}
		}
	}

	/* 1.3. 整合的信用分概览区域样式 */
	.credit-overview-section {
		margin: 0 20rpx 20rpx;

		.credit-score-section {
			padding: 40rpx 40rpx 20rpx;
			position: relative;

			.credit-message-integrated {
				margin-top: 30rpx;
				display: flex;
				align-items: center;
				gap: 12rpx;
				padding: 16rpx 24rpx;
				border-radius: 24rpx;
				backdrop-filter: blur(8px);
				box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
				border: 1px solid rgba(255, 255, 255, 0.3);
				justify-content: center;

				&.message-excellent {
					background: rgba(0, 200, 81, 0.15);
					border-color: rgba(0, 200, 81, 0.3);

					.message-text {
						background: linear-gradient(135deg, #00C851, #52DD8F);
						-webkit-background-clip: text;
						color: transparent;
						text-shadow: 0 2rpx 4rpx rgba(0, 200, 81, 0.1);
					}
				}



				&.message-normal {
					background: rgba(255, 152, 0, 0.15);
					border-color: rgba(255, 152, 0, 0.3);

					.message-text {
						background: linear-gradient(135deg, #FF9800, #FFB74D);
						-webkit-background-clip: text;
						color: transparent;
						text-shadow: 0 2rpx 4rpx rgba(255, 152, 0, 0.1);
					}

					.message-icon {
						animation: icon-shake 3s ease-in-out infinite;
					}
				}

				&.message-bad {
					background: rgba(244, 67, 54, 0.15);
					border-color: rgba(244, 67, 54, 0.3);

					.message-text {
						background: linear-gradient(135deg, #F44336, #E57373);
						-webkit-background-clip: text;
						color: transparent;
						text-shadow: 0 2rpx 4rpx rgba(244, 67, 54, 0.1);
					}

					.message-icon {
						animation: icon-shake 2s ease-in-out infinite;
					}
				}

				.message-icon {
					display: flex;
					align-items: center;
					justify-content: center;
					width: 32rpx;
					height: 32rpx;

					.message-emoji {
						font-size: 24rpx;
						filter: drop-shadow(0 2rpx 4rpx rgba(0, 0, 0, 0.1));
					}
				}

				.message-text {
					text-align: center;
					font-weight: 600;
					letter-spacing: 1px;
					line-height: 1.4;
					font-size: 24rpx;
					transition: all 0.3s ease;
				}
			}
		}
	}



	/* 2. 信用分展示区域样�?*/
	.credit-score-section {
		background: #fff;
		border-radius: 16rpx;
		padding: 40rpx;
		margin: 0 20rpx 20rpx;
		text-align: center;
		position: relative;
		transition: all 0.3s ease;
		overflow: hidden;

		&::before {
			content: '';
			position: absolute;
			left: 0;
			right: 0;
			bottom: 0;
			height: 40%;
			border-radius: 0 0 16rpx 16rpx;
			background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.8));
		}

		&.credit-score-excellent {
			background: linear-gradient(135deg, #00C851 0%, #52DD8F 50%, #7ED321 100%);
			box-shadow: 0 8rpx 32rpx rgba(0, 200, 81, 0.4);

			.credit-inner {
				.credit-score-ring {
					.credit-num {
						color: #ffffff;
						text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
					}

					.credit-label {
						color: rgba(255, 255, 255, 0.95);
					}
				}

				.credit-level {
					.level-text {
						color: rgba(255, 255, 255, 0.95);
					}
				}
			}
		}



		&.credit-score-normal {
			background: linear-gradient(135deg, #FF9800 0%, #FFB74D 50%, #FFC107 100%);
			box-shadow: 0 8rpx 32rpx rgba(255, 152, 0, 0.4);
			animation: warning-pulse 3s ease-in-out infinite;

			.credit-inner {
				.credit-score-ring {
					.credit-num {
						color: #ffffff;
						text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
					}

					.credit-label {
						color: rgba(255, 255, 255, 0.95);
					}
				}

				.credit-level {
					.level-text {
						color: rgba(255, 255, 255, 0.95);
					}
				}
			}
		}

		&.credit-score-bad {
			background: linear-gradient(135deg, #F44336 0%, #E57373 50%, #FF5252 100%);
			box-shadow: 0 8rpx 32rpx rgba(244, 67, 54, 0.5);
			animation: danger-pulse 2s ease-in-out infinite;

			.credit-inner {
				.credit-score-ring {
					animation: bad-score-ring-breath 2s ease-in-out infinite;

					.credit-num {
						color: #ffffff;
						text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
						animation: bad-score-text-breath 2s ease-in-out infinite;
					}

					.credit-label {
						color: rgba(255, 255, 255, 0.95);
					}
				}

				.credit-level {
					.level-text {
						color: rgba(255, 255, 255, 0.95);
					}
				}
			}
		}

		.credit-inner {
			position: relative;
			z-index: 1;

			.credit-score-ring {
				position: relative;
				width: 300rpx;
				height: 200rpx;
				margin: 0 auto;
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;

				&::before {
					content: '';
					position: absolute;
					top: -10rpx;
					left: 50%;
					transform: translateX(-50%);
					width: 240rpx;
					height: 120rpx;
					border-radius: 120rpx 120rpx 0 0;
					border: 6rpx solid rgba(255, 255, 255, 0.3);
					border-bottom: none;
				}

				&::after {
					content: '';
					position: absolute;
					top: -10rpx;
					left: 50%;
					transform: translateX(-50%);
					width: 240rpx;
					height: 120rpx;
					border-radius: 120rpx 120rpx 0 0;
					border: 6rpx solid #ffffff;
					border-bottom: none;
					clip-path: polygon(0 0, v-bind('(creditScore / 100 * 100) + "%"') 0, v-bind('(creditScore / 100 * 100) + "%"') 100%, 0 100%);
					transition: clip-path 0.3s ease;
				}

				.credit-num {
					font-size: 80rpx;
					font-weight: bold;
					line-height: 1;
					margin-bottom: 10rpx;
					text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
				}

				.credit-label {
					font-size: 28rpx;
					margin-bottom: 20rpx;
				}
			}

			.credit-level {
				margin-top: 20rpx;

				.level-text {
					font-size: 28rpx;
					font-weight: 600;
				}
			}
		}
	}



	/* 车辆违规提醒样式 */
	.monthly-warning {
		display: flex;
		align-items: center;
		gap: 20rpx;
		padding: 24rpx;
		background: linear-gradient(135deg, #fff3cd, #ffeaa7);
		border: 1rpx solid #ffc107;
		border-radius: 16rpx;
		box-shadow: 0 4rpx 12rpx rgba(255, 193, 7, 0.2);

		.alert-icon {
			font-size: 40rpx;
			animation: bounce 2s infinite;
		}

		.alert-content {
			flex: 1;

			.alert-title {
				font-size: 28rpx;
				font-weight: bold;
				color: #856404;
				margin-bottom: 8rpx;
				display: block;
			}

			.alert-desc {
				font-size: 24rpx;
				color: #856404;
				line-height: 1.4;
			}
		}
	}

	.ranking-section {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20rpx;
		background: #f8f9fa;
		border-radius: 12rpx;

		.ranking-title {
			font-size: 24rpx;
			color: #666;
		}

		.ranking-info {
			display: flex;
			align-items: baseline;
			gap: 4rpx;

			.ranking-number {
				font-size: 36rpx;
				font-weight: bold;
				color: #409EFF;
			}

			.ranking-total {
				font-size: 24rpx;
				color: #999;
			}
		}

		.ranking-desc {
			font-size: 20rpx;
			color: #52C41A;
			font-weight: 600;
		}
	}

	.warning-banner {
		display: flex;
		align-items: center;
		gap: 16rpx;
		padding: 16rpx 20rpx;
		background: linear-gradient(135deg, #fff2e8, #ffd591);
		border: 1rpx solid #ffab00;
		border-radius: 12rpx;
		animation: warning-pulse 2s ease-in-out infinite;

		.warning-icon {
			font-size: 32rpx;
		}

		.warning-text {
			font-size: 26rpx;
			color: #d46b08;
			font-weight: 600;
			flex: 1;
		}
	}

	/* 3. 排行榜控制面板样�?*/
	.ranking-control-panel {
		margin: 0 20rpx 20rpx;
		background: #ffffff;
		border-radius: 20rpx;
		box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.12);
		overflow: hidden;
		position: relative;
		border: 1rpx solid #f0f0f0;

		&::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			height: 4rpx;
			background: linear-gradient(90deg, #ff416c, #ff4b2b, #ff6b35, #f7931e);
		}

		.ranking-toggle {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 28rpx 30rpx;
			cursor: pointer;
			transition: all 0.3s ease;
			position: relative;
			background: linear-gradient(135deg, #fafafa, #f5f5f5);

			&:hover {
				background: linear-gradient(135deg, #f0f0f0, #e8e8e8);
			}

			.toggle-title-group {
				display: flex;
				flex-direction: column;
				gap: 4rpx;

				.toggle-text {
					font-size: 30rpx;
					color: #333333;
					font-weight: 700;
					text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.1);
					display: flex;
					align-items: center;
					gap: 12rpx;

					&::before {
						content: '⚠️';
						font-size: 28rpx;
						filter: drop-shadow(0 2rpx 4rpx rgba(255, 107, 107, 0.6));
					}
				}

				.toggle-subtitle {
					font-size: 20rpx;
					color: #6c757d;
					margin-left: 40rpx;
					/* 对齐emoji图标后面 */
				}
			}
		}

		.ranking-list {
			max-height: 400rpx;
			overflow-y: auto;
			padding: 0 20rpx 20rpx;
			background: #ffffff;

			.ranking-item {
				display: flex;
				align-items: center;
				padding: 20rpx 24rpx;
				margin-bottom: 16rpx;
				cursor: pointer;
				transition: all 0.4s ease;
				border-radius: 16rpx;
				position: relative;
				overflow: hidden;
				border: 1rpx solid #f0f0f0;

				&:hover {
					transform: translateY(-4rpx);
					box-shadow: 0 12rpx 32rpx rgba(0, 0, 0, 0.15);
				}

				// 第一�?- 最严重违规�?
				&:first-child {
					background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
					box-shadow: 0 8rpx 24rpx rgba(244, 67, 54, 0.25);
					animation: champion-glow 3s ease-in-out infinite;
					border: 2rpx solid #ff5252;

					&::before {
						content: '👑';
						position: absolute;
						top: -8rpx;
						right: 20rpx;
						font-size: 32rpx;
						animation: float 2s ease-in-out infinite;
						filter: drop-shadow(0 4rpx 8rpx rgba(255, 215, 0, 0.6));
					}

					.rank-number {
						background: linear-gradient(135deg, #ffd700, #ffed4e);
						color: #d84315;
						font-weight: 900;
						border: 3rpx solid #ff5252;
						box-shadow: 0 4rpx 12rpx rgba(255, 215, 0, 0.4);
						animation: pulse 2s ease-in-out infinite;
					}

					.rank-plate,
					.rank-info,
					.violation-warning {
						color: #d32f2f;
						text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.1);
					}
				}

				// 第二�?
				&:nth-child(2) {
					background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
					box-shadow: 0 6rpx 20rpx rgba(255, 152, 0, 0.2);
					border: 2rpx solid #ff9800;

					.rank-number {
						background: linear-gradient(135deg, #c0c0c0, #e8e8e8);
						color: #424242;
						font-weight: 800;
						border: 2rpx solid #ff9800;
					}

					.rank-plate,
					.rank-info,
					.violation-warning {
						color: #e65100;
						text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.1);
					}
				}

				// 第三�?
				&:nth-child(3) {
					background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
					box-shadow: 0 4rpx 16rpx rgba(255, 193, 7, 0.2);
					border: 2rpx solid #ffc107;

					.rank-number {
						background: linear-gradient(135deg, #cd7f32, #d2691e);
						color: #ffffff;
						font-weight: 800;
						border: 2rpx solid #ffc107;
					}

					.rank-plate,
					.rank-info,
					.violation-warning {
						color: #f57c00;
						text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.1);
					}
				}

				// 其他排名
				&:nth-child(n+4) {
					background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
					box-shadow: 0 3rpx 12rpx rgba(0, 0, 0, 0.08);
					border: 1rpx solid #dee2e6;

					.rank-number {
						background: linear-gradient(135deg, #6c757d, #495057);
						color: #ffffff;
						font-weight: 600;
						border: 1rpx solid #6c757d;
					}

					.rank-plate,
					.rank-info,
					.violation-warning {
						color: #495057;
						text-shadow: none;
					}
				}

				.rank-number {
					width: 44rpx;
					height: 44rpx;
					border-radius: 50%;
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 22rpx;
					font-weight: 700;
					margin-right: 20rpx;
					transition: transform 0.3s ease;
					position: relative;
					z-index: 2;

					&:hover {
						transform: scale(1.1);
					}
				}

				.rank-plate {
					font-size: 30rpx;
					font-weight: 700;
					padding: 8rpx 16rpx;
					border-radius: 8rpx;
					margin-right: 20rpx;
					flex-shrink: 0;
					position: relative;
					z-index: 2;

					&.blue-plate {
						background: linear-gradient(180deg, #0C4FC5 0%, #216FEF 100%);
						color: #FFFFFF;
						border: 1rpx solid #0C4FC5;
						box-shadow: 0 4rpx 12rpx rgba(12, 79, 197, 0.3);
					}

					&.green-plate {
						background: linear-gradient(180deg, #6AD390 0%, #D0F1E4 100%);
						color: #000000;
						border: 1rpx solid #6AD390;
						box-shadow: 0 4rpx 12rpx rgba(106, 211, 144, 0.3);
						font-weight: 800;
					}
				}

				.rank-info {
					flex: 1;
					margin-right: 20rpx;
					text-align: right;

					.rank-count {
						font-size: 32rpx;
						font-weight: 900;
						margin-bottom: 6rpx;
						display: flex;
						align-items: center;
						justify-content: flex-end;
						gap: 8rpx;

						&::after {
							content: '次';
							font-size: 20rpx;
							opacity: 0.8;
						}
					}

					.rank-reason {
						font-size: 20rpx;
						opacity: 0.9;
						line-height: 1.2;
						font-weight: 500;
					}
				}

				.violation-warning {
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					font-size: 28rpx;
					position: relative;
					z-index: 2;

					&::before {
						content: '⚠️';
						font-size: 24rpx;
						margin-bottom: 4rpx;
						filter: drop-shadow(0 2rpx 4rpx rgba(255, 152, 0, 0.8));
						animation: warning-shake 2s ease-in-out infinite;
					}
				}

				// 波纹效果
				&::after {
					content: '';
					position: absolute;
					top: 0;
					left: 0;
					right: 0;
					bottom: 0;
					background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.6), transparent);
					transform: translateX(-100%);
					transition: transform 0.6s ease;
				}

				&:hover::after {
					transform: translateX(100%);
				}
			}
		}

		// 滚动条样式
		.ranking-list::-webkit-scrollbar {
			width: 6rpx;
		}

		.ranking-list::-webkit-scrollbar-track {
			background: #f8f9fa;
			border-radius: 3rpx;
		}

		.ranking-list::-webkit-scrollbar-thumb {
			background: #dee2e6;
			border-radius: 3rpx;
		}

		.ranking-list::-webkit-scrollbar-thumb:hover {
			background: #adb5bd;
		}
	}

	/* 4. Tab分析面板样式 */
	.analysis-panel {
		margin: 0 20rpx 20rpx;
		background: white;
		border-radius: 16rpx;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
		overflow: hidden;

		/* 统计说明横幅样式 */
		.analysis-info-banner {
			display: flex;
			align-items: center;
			padding: 20rpx 30rpx;
			background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
			border-bottom: 1rpx solid #dee2e6;
			gap: 16rpx;

			.info-icon {
				font-size: 32rpx;
				filter: drop-shadow(0 2rpx 4rpx rgba(0, 0, 0, 0.1));
			}

			.info-content {
				flex: 1;
				display: flex;
				flex-direction: column;
				gap: 6rpx;

				.info-title {
					font-size: 24rpx;
					font-weight: 600;
					color: #495057;
					margin-bottom: 4rpx;
				}

				.info-desc {
					font-size: 22rpx;
					color: #6c757d;
					line-height: 1.4;
					display: flex;
					align-items: center;
					flex-wrap: wrap;
					gap: 4rpx;

					.selected-vehicle-info {
						font-weight: 600;
						padding: 3rpx 10rpx;
						border-radius: 4rpx;
						font-size: 26rpx;
						margin: 0 4rpx;

						&.blue-plate {
							background: linear-gradient(180deg, #0C4FC5 0%, #216FEF 100%);
							color: #FFFFFF;
							border: 1rpx solid #0C4FC5;
						}

						&.green-plate {
							background: linear-gradient(180deg, #6AD390 0%, #D0F1E4 100%);
							color: #000000;
							border: 1rpx solid #6AD390;
						}

						&.all-vehicles {
							background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
							color: #FFFFFF;
							border: 1rpx solid #667eea;
						}
					}
				}
			}

			.info-count {
				display: flex;
				flex-direction: column;
				align-items: center;
				padding: 12rpx 20rpx;
				background: #ffffff;
				border-radius: 12rpx;
				box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
				border: 1rpx solid #e9ecef;
				min-width: 80rpx;

				.count-number {
					font-size: 28rpx;
					font-weight: bold;
					color: #409EFF;
					line-height: 1;
				}

				.count-label {
					font-size: 20rpx;
					color: #6c757d;
					margin-top: 2rpx;
				}
			}
		}

		.tab-headers {
			display: flex;
			background: #f8f9fa;

			.tab-header {
				flex: 1;
				padding: 20rpx 16rpx;
				text-align: center;
				cursor: pointer;
				transition: all 0.3s ease;
				position: relative;

				&.active {
					background: white;
					color: #409EFF;

					&::after {
						content: '';
						position: absolute;
						bottom: 0;
						left: 0;
						right: 0;
						height: 4rpx;
						background: #409EFF;
						border-radius: 2rpx 2rpx 0 0;
					}
				}

				.tab-title {
					font-size: 24rpx;
					font-weight: 600;
				}
			}
		}

		.tab-content {
			padding: 30rpx;

			/* Tab1: 趋势图表 */
			.trend-analysis-tab {
				.chart-container {
					.chart-header {
						display: flex;
						justify-content: space-between;
						align-items: center;
						margin-bottom: 30rpx;

						.chart-title {
							font-size: 28rpx;
							font-weight: 600;
							color: #333;
						}

						.time-range-selector {
							display: flex;
							background: #f0f0f0;
							border-radius: 8rpx;
							padding: 4rpx;

							.time-range-option {
								padding: 8rpx 16rpx;
								border-radius: 6rpx;
								font-size: 22rpx;
								color: #666;
								cursor: pointer;
								transition: all 0.3s ease;

								&.active {
									background: #409EFF;
									color: white;
								}
							}
						}
					}

					.breadcrumb {
						display: flex;
						align-items: center;
						margin: 20rpx 0;
						padding: 16rpx 20rpx;
						background: #f8f9fa;
						border-radius: 12rpx;

						.breadcrumb-item {
							display: flex;
							align-items: center;
							font-size: 24rpx;
							color: #409EFF;
							cursor: pointer;
							transition: color 0.3s ease;

							&:hover {
								color: #66b3ff;
							}

							.breadcrumb-arrow {
								margin: 0 12rpx;
								color: #999;
								font-size: 20rpx;
							}
						}
					}

					.trend-chart {
						.chart-bars {
							display: flex;
							justify-content: space-between;
							align-items: flex-end;
							height: 240rpx;
							gap: 8rpx;
							padding: 20rpx 0;

							.chart-bar-group {
								flex: 1;
								display: flex;
								flex-direction: column;
								align-items: center;
								cursor: pointer;
								transition: transform 0.2s ease;

								&:hover {
									transform: translateY(-4rpx);
								}

								.bar-container {
									width: 30rpx;
									height: 180rpx;
									position: relative;
									display: flex;
									align-items: flex-end;

									.violation-bar {
										width: 100%;
										background: linear-gradient(180deg, #409EFF 0%, #79bbff 100%);
										border-radius: 6rpx 6rpx 0 0;
										transition: height 0.8s ease;
										position: relative;
										display: flex;
										align-items: flex-end;
										justify-content: center;
										min-height: 10rpx;

										.bar-value {
											position: absolute;
											top: -30rpx;
											left: 50%;
											transform: translateX(-50%);
											font-size: 20rpx;
											color: #333;
											font-weight: 600;
											background: rgba(255, 255, 255, 0.9);
											padding: 2rpx 6rpx;
											border-radius: 4rpx;
											white-space: nowrap;
										}
									}
								}

								.bar-label {
									font-size: 20rpx;
									color: #666;
									margin-top: 12rpx;
									text-align: center;
								}

								.bar-sublabel {
									font-size: 18rpx;
									color: #999;
									margin-top: 4rpx;
									text-align: center;
								}
							}
						}
					}
				}
			}

			/* Tab2: 日历热力�?*/
			.calendar-analysis-tab {
				.calendar-header {
					.month-controls {
						display: flex;
						align-items: center;
						justify-content: center;
						gap: 20rpx;
						margin-bottom: 30rpx;

						.current-month {
							font-size: 28rpx;
							font-weight: 600;
							color: #333;
							min-width: 160rpx;
							text-align: center;
						}
					}
				}

				.calendar-grid {
					.weekdays {
						display: grid;
						grid-template-columns: repeat(7, 1fr);
						gap: 8rpx;
						margin-bottom: 16rpx;

						.weekday {
							text-align: center;
							font-size: 22rpx;
							color: #666;
							padding: 8rpx 0;
						}
					}

					.dates {
						display: grid;
						grid-template-columns: repeat(7, 1fr);
						gap: 8rpx;

						.date-cell {
							aspect-ratio: 1;
							display: flex;
							flex-direction: column;
							align-items: center;
							justify-content: center;
							border-radius: 8rpx;
							position: relative;
							cursor: pointer;
							transition: all 0.3s ease;

							&.intensity-0 {
								background: #f0f0f0;
								color: #666;
							}

							&.intensity-1 {
								background: linear-gradient(135deg, #4CAF50, #66BB6A);
								color: #FFFFFF;
								box-shadow: 0 2rpx 6rpx rgba(76, 175, 80, 0.3);
								font-weight: 600;
							}

							&.intensity-2 {
								background: linear-gradient(135deg, #FF9800, #FFB74D);
								color: #FFFFFF;
								box-shadow: 0 3rpx 8rpx rgba(255, 152, 0, 0.4);
								font-weight: 600;
							}

							&.intensity-3 {
								background: linear-gradient(135deg, #FF5722, #FF7043);
								color: #FFFFFF;
								box-shadow: 0 4rpx 10rpx rgba(255, 87, 34, 0.5);
								font-weight: bold;
								animation: intensity-pulse 2s ease-in-out infinite;
							}

							&.intensity-4 {
								background: linear-gradient(135deg, #E91E63, #F06292);
								color: #FFFFFF;
								box-shadow: 0 4rpx 12rpx rgba(233, 30, 99, 0.6);
								font-weight: bold;
								animation: intensity-pulse 1.8s ease-in-out infinite;
							}

							&.intensity-5 {
								background: linear-gradient(135deg, #9C27B0, #BA68C8);
								color: #FFFFFF;
								box-shadow: 0 5rpx 14rpx rgba(156, 39, 176, 0.7);
								font-weight: bold;
								animation: intensity-pulse 1.5s ease-in-out infinite;
								border: 1rpx solid #E1BEE7;
							}

							&.intensity-6 {
								background: linear-gradient(135deg, #D32F2F, #F44336, #FF1744);
								color: #FFFFFF;
								box-shadow: 0 6rpx 16rpx rgba(211, 47, 47, 0.8);
								font-weight: bold;
								animation: high-intensity-pulse 1s ease-in-out infinite;
								border: 2rpx solid #FFCDD2;
								transform: scale(1.05);
							}

							&.today {
								border: 2rpx solid #409EFF;
								box-shadow: 0 0 0 2rpx rgba(64, 158, 255, 0.2);
							}

							&.selected {
								background: #409EFF !important;
								color: white;
							}

							&:hover {
								transform: scale(1.1);
								box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
							}

							.date-number {
								font-size: 20rpx;
								font-weight: 600;
							}

							.violation-indicator {
								position: absolute;
								top: 4rpx;
								right: 4rpx;
								background: #FF4D4F;
								color: white;
								border-radius: 50%;
								width: 18rpx;
								height: 18rpx;
								font-size: 14rpx;
								display: flex;
								align-items: center;
								justify-content: center;
							}
						}
					}
				}
			}

			/* Tab3: 类型分析 */
			.type-analysis-tab {
				.analysis-header {
					display: flex;
					align-items: center;
					justify-content: center;
					gap: 12rpx;
					padding: 24rpx 20rpx;
					margin-bottom: 20rpx;

					.header-title {
						font-size: 32rpx;
						font-weight: 700;
						color: #333;
					}

					.header-separator {
						font-size: 24rpx;
						color: #d9d9d9;
						font-weight: 400;
					}

					.header-total {
						font-size: 28rpx;
						font-weight: 600;
						color: #409EFF;
					}

					.header-types {
						font-size: 28rpx;
						font-weight: 500;
						color: #666;
					}
				}

				.chart-container {
					display: flex;
					flex-direction: column;
					gap: 20rpx;
					padding: 0 20rpx;

					.stacked-bar-chart {
						padding: 0 20rpx;

						.stacked-bar {
							display: flex;
							height: 80rpx;
							border-radius: 40rpx;
							overflow: hidden;
							box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
							background: #f5f5f5;
							position: relative;

							.bar-segment {
								height: 100%;
								display: flex;
								align-items: center;
								justify-content: center;
								position: relative;
								cursor: pointer;
								transition: all 0.3s ease;
								opacity: 0;
								animation: slideInWidth 0.8s ease-out forwards;

								&:hover {
									filter: brightness(1.1);
									transform: translateY(-2rpx);
									z-index: 2;
									box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
								}

								&:first-child {
									border-radius: 40rpx 0 0 40rpx;
								}

								&:last-child {
									border-radius: 0 40rpx 40rpx 0;
								}

								&:only-child {
									border-radius: 40rpx;
								}

								.segment-label {
									font-size: 22rpx;
									color: white;
									font-weight: 600;
									text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.3);
									white-space: nowrap;
								}
							}
						}

						.chart-labels {
							display: flex;
							justify-content: space-between;
							margin-top: 12rpx;
							padding: 0 8rpx;

							.label-start,
							.label-end {
								font-size: 20rpx;
								color: #999;
								font-weight: 500;
							}
						}
					}
				}

				.pie-legend {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(300rpx, 1fr));
					gap: 16rpx;
					padding: 0 20rpx 20rpx;

					.legend-item {
						display: flex;
						align-items: center;
						padding: 20rpx;
						background: #ffffff;
						border-radius: 12rpx;
						box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
						cursor: pointer;
						transition: all 0.3s ease;
						border: 1rpx solid #f0f0f0;

						&:hover {
							transform: translateY(-2rpx);
							box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
							border-color: #409EFF;
						}

						.legend-indicator {
							display: flex;
							align-items: center;
							justify-content: center;
							width: 60rpx;
							height: 60rpx;
							border-radius: 50%;
							margin-right: 16rpx;
							position: relative;
							box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);

							.legend-color {
								position: absolute;
								width: 100%;
								height: 100%;
								border-radius: 50%;
								opacity: 1;
							}

							.legend-icon {
								font-size: 28rpx;
								color: white;
								z-index: 1;
								text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.3);
								font-weight: bold;
							}
						}

						.legend-info {
							flex: 1;

							.legend-name {
								font-size: 26rpx;
								font-weight: 600;
								color: #333;
								margin-bottom: 6rpx;
								display: block;
							}

							.legend-stats {
								display: flex;
								align-items: center;
								gap: 12rpx;

								.legend-count {
									font-size: 22rpx;
									color: #666;
									font-weight: 500;
								}

								.legend-percentage {
									font-size: 20rpx;
									color: #409EFF;
									background: #f0f8ff;
									padding: 2rpx 8rpx;
									border-radius: 4rpx;
									font-weight: 600;
								}
							}
						}
					}
				}
			}
		}

		/* Tab4: 对比分析 */
		.comparison-analysis-tab {
			.comparison-controls {
				margin-bottom: 30rpx;

				.comparison-title {
					font-size: 32rpx;
					font-weight: 600;
					color: #333;
					margin-bottom: 8rpx;
					text-align: center;
				}

				.comparison-subtitle {
					font-size: 24rpx;
					color: #666;
					margin-bottom: 24rpx;
					text-align: center;
				}

				.vehicle-selector-multi {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(280rpx, 1fr));
					gap: 20rpx;
					margin-top: 20rpx;

					.vehicle-option {
						cursor: pointer;
						transition: all 0.3s ease;

						&:hover {
							transform: translateY(-4rpx);
						}

						&.selected .vehicle-card {
							border-color: #52C41A;
							background: linear-gradient(135deg, #f6ffed, #f0f9ff);
							box-shadow: 0 8rpx 24rpx rgba(82, 196, 26, 0.2);
						}

						.vehicle-card {
							background: #ffffff;
							border: 2rpx solid #e8e8e8;
							border-radius: 16rpx;
							padding: 20rpx;
							box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
							transition: all 0.3s ease;

							.card-header {
								display: flex;
								justify-content: space-between;
								align-items: center;
								margin-bottom: 16rpx;

								.option-plate {
									font-size: 28rpx;
									font-weight: 600;
									padding: 8rpx 16rpx;
									border-radius: 8rpx;

									&.blue-plate {
										background: linear-gradient(180deg, #0C4FC5 0%, #216FEF 100%);
										color: #FFFFFF;
										border: 1rpx solid #0C4FC5;
									}

									&.green-plate {
										background: linear-gradient(180deg, #6AD390 0%, #D0F1E4 100%);
										color: #000000;
										border: 1rpx solid #6AD390;
									}
								}

								.selection-indicator {
									transition: transform 0.2s ease;
								}
							}

							.card-stats {
								display: flex;
								align-items: center;
								justify-content: space-around;
								margin-bottom: 16rpx;
								padding: 12rpx 0;
								background: #fafbfc;
								border-radius: 12rpx;

								.stat-item {
									display: flex;
									flex-direction: column;
									align-items: center;
									flex: 1;

									.stat-value {
										font-size: 28rpx;
										font-weight: bold;
										color: #333;
										margin-bottom: 4rpx;
									}

									.stat-label {
										font-size: 20rpx;
										color: #666;
									}
								}

								.stat-divider {
									width: 1rpx;
									height: 40rpx;
									background: #e8e8e8;
								}
							}

							.card-footer {
								display: flex;
								align-items: center;
								justify-content: center;
								gap: 8rpx;

								.status-dot {
									width: 12rpx;
									height: 12rpx;
									border-radius: 50%;

									&.excellent {
										background: #52C41A;
									}

									&.good {
										background: #1890FF;
									}

									&.warning {
										background: #FAAD14;
									}

									&.danger {
										background: #FF4D4F;
									}
								}

								.status-text {
									font-size: 22rpx;
									color: #666;
									font-weight: 500;
								}
							}
						}
					}
				}
			}

			.comparison-chart {
				margin-bottom: 30rpx;

				.chart-header {
					text-align: center;
					margin-bottom: 20rpx;

					.chart-title {
						font-size: 28rpx;
						font-weight: 600;
						color: #333;
					}
				}

				.comparison-bars {
					display: flex;
					justify-content: space-around;
					align-items: flex-end;
					height: 300rpx;
					padding: 20rpx 0;
					border-radius: 16rpx;
					background: #fafbfc;

					.comparison-bar-group {
						display: flex;
						flex-direction: column;
						align-items: center;
						flex: 1;
						cursor: pointer;
						transition: all 0.3s ease;

						&:hover {
							transform: translateY(-4rpx);
						}

						.vehicle-label {
							font-size: 22rpx;
							color: #666;
							margin-bottom: 12rpx;
							text-align: center;
							font-weight: 600;
						}

						.comparison-bar {
							width: 80rpx;
							border-radius: 12rpx 12rpx 8rpx 8rpx;
							transition: all 0.8s ease;
							position: relative;
							display: flex;
							align-items: flex-end;
							justify-content: center;
							padding-bottom: 8rpx;
							box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);

							.bar-value {
								font-size: 22rpx;
								color: white;
								font-weight: bold;
								text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.3);
							}
						}

						.vehicle-stats {
							margin-top: 12rpx;
							text-align: center;

							.monthly-count {
								font-size: 20rpx;
								color: #ff5722;
								font-weight: 600;
								display: block;
							}

							.total-count {
								font-size: 18rpx;
								color: #999;
								display: block;
								margin-top: 4rpx;
							}
						}
					}
				}
			}

			.comparison-table {
				margin-bottom: 30rpx;
				border-radius: 16rpx;
				overflow: hidden;
				box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);

				.table-header {
					padding: 24rpx;
					background: linear-gradient(135deg, #409EFF, #36cfc9);

					.table-title {
						font-size: 28rpx;
						font-weight: 600;
						color: white;
						text-align: center;
					}
				}

				.table-content {
					background: white;

					.table-row {
						display: flex;
						align-items: center;
						padding: 20rpx 24rpx;
						border-bottom: 1rpx solid #f0f0f0;

						&.header-row {
							background: #f8f9fa;
							font-weight: 600;
							color: #333;
							font-size: 24rpx;
						}

						&.data-row {
							transition: background 0.3s ease;

							&:hover {
								background: #fafbfc;
							}

							&.excellent {
								border-left: 4rpx solid #52C41A;
							}

							&.good {
								border-left: 4rpx solid #1890FF;
							}

							&.normal {
								border-left: 4rpx solid #FAAD14;
							}

							&.poor {
								border-left: 4rpx solid #FF4D4F;
							}
						}

						&:last-child {
							border-bottom: none;
						}

						.col-plate {
							flex: 2;

							&.plate-text {
								font-size: 28rpx;
								font-weight: 600;
								padding: 6rpx 12rpx;
								border-radius: 6rpx;
								display: inline-block;

								&.blue-plate {
									background: linear-gradient(180deg, #0C4FC5 0%, #216FEF 100%);
									color: #FFFFFF;
									border: 1rpx solid #0C4FC5;
								}

								&.green-plate {
									background: linear-gradient(180deg, #6AD390 0%, #D0F1E4 100%);
									color: #000000;
									border: 1rpx solid #6AD390;
								}
							}
						}

						.col-monthly,
						.col-total {
							flex: 1;
							text-align: center;
							font-size: 24rpx;
							font-weight: 600;
						}

						.col-status {
							flex: 1.5;
							display: flex;
							align-items: center;
							justify-content: center;
							gap: 8rpx;

							.status-indicator {
								width: 16rpx;
								height: 16rpx;
								border-radius: 50%;

								&.excellent {
									background: #52C41A;
								}

								&.good {
									background: #1890FF;
								}

								&.normal {
									background: #FAAD14;
								}

								&.poor {
									background: #FF4D4F;
								}

								&.unknown {
									background: #d9d9d9;
								}
							}

							.status-text {
								font-size: 22rpx;
								font-weight: 600;
							}
						}
					}
				}
			}

			.comparison-empty {
				padding: 40rpx 20rpx;

				.empty-hero {
					position: relative;
					background: linear-gradient(145deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
					border-radius: 24rpx;
					padding: 60rpx 40rpx;
					overflow: hidden;
					text-align: center;
					color: white;
					min-height: 500rpx;
					display: flex;
					flex-direction: column;
					justify-content: center;
					align-items: center;

					// 背景装饰
					.hero-background {
						position: absolute;
						top: 0;
						left: 0;
						right: 0;
						bottom: 0;
						z-index: 1;

						.bg-shape {
							position: absolute;
							border-radius: 50%;
							opacity: 0.1;

							&.shape-1 {
								width: 200rpx;
								height: 200rpx;
								background: white;
								top: -100rpx;
								right: -100rpx;
								animation: float 6s ease-in-out infinite;
							}

							&.shape-2 {
								width: 150rpx;
								height: 150rpx;
								background: rgba(255, 255, 255, 0.8);
								bottom: -75rpx;
								left: -75rpx;
								animation: float 8s ease-in-out infinite reverse;
							}

							&.shape-3 {
								width: 100rpx;
								height: 100rpx;
								background: rgba(255, 255, 255, 0.6);
								top: 50%;
								left: -50rpx;
								animation: float 10s ease-in-out infinite;
							}
						}
					}

					// 主图标容�?
					.hero-icon-container {
						position: relative;
						z-index: 3;
						margin-bottom: 40rpx;

						.hero-icon {
							width: 140rpx;
							height: 140rpx;
							background: rgba(255, 255, 255, 0.2);
							border-radius: 50%;
							display: flex;
							align-items: center;
							justify-content: center;
							margin: 0 auto;
							backdrop-filter: blur(10rpx);
							border: 2rpx solid rgba(255, 255, 255, 0.3);
							animation: iconPulse 3s ease-in-out infinite;

							.icon-chart {
								display: flex;
								align-items: flex-end;
								gap: 6rpx;
								height: 40rpx;

								.chart-bar {
									width: 8rpx;
									border-radius: 4rpx 4rpx 0 0;
									background: white;
									opacity: 0;
									animation: barGrow 2s ease-out infinite;
									transform-origin: bottom;

									&.bar-1 {
										height: 15rpx;
										animation-delay: 0s;
									}

									&.bar-2 {
										height: 25rpx;
										animation-delay: 0.2s;
									}

									&.bar-3 {
										height: 35rpx;
										animation-delay: 0.4s;
									}

									&.bar-4 {
										height: 20rpx;
										animation-delay: 0.6s;
									}
								}
							}
						}

						// 装饰性图�?
						.icon-sparkle {
							position: absolute;
							font-size: 24rpx;
							animation: sparkle 3s ease-in-out infinite;

							&.sparkle-1 {
								top: 0;
								right: 20rpx;
								animation-delay: 0s;
							}

							&.sparkle-2 {
								bottom: 10rpx;
								left: 10rpx;
								animation-delay: 1s;
							}

							&.sparkle-3 {
								top: 30rpx;
								left: -10rpx;
								animation-delay: 2s;
							}
						}
					}

					// 内容区域
					.hero-content {
						position: relative;
						z-index: 3;

						.hero-title {
							font-size: 48rpx;
							font-weight: 800;
							margin-bottom: 12rpx;
							display: block;
							text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
							letter-spacing: 1rpx;
						}

						.hero-subtitle {
							font-size: 28rpx;
							font-weight: 600;
							opacity: 0.9;
							margin-bottom: 20rpx;
							display: block;
						}

						.hero-description {
							font-size: 26rpx;
							opacity: 0.8;
							line-height: 1.6;
							margin-bottom: 40rpx;
							display: block;
							max-width: 500rpx;
						}

						.hero-features {
							display: flex;
							gap: 16rpx;
							justify-content: center;
							flex-wrap: wrap;
							margin-bottom: 40rpx;

							.feature-badge {
								background: rgba(255, 255, 255, 0.2);
								border-radius: 20rpx;
								padding: 12rpx 20rpx;
								display: flex;
								align-items: center;
								gap: 8rpx;
								backdrop-filter: blur(10rpx);
								border: 1rpx solid rgba(255, 255, 255, 0.3);
								transition: all 0.3s ease;
								animation: fadeInUp 0.8s ease-out forwards;
								opacity: 0;

								&:nth-child(1) {
									animation-delay: 0.2s;
								}

								&:nth-child(2) {
									animation-delay: 0.4s;
								}

								&:nth-child(3) {
									animation-delay: 0.6s;
								}

								&:hover {
									transform: translateY(-4rpx);
									background: rgba(255, 255, 255, 0.3);
								}

								.badge-icon {
									font-size: 20rpx;
								}

								.badge-text {
									font-size: 22rpx;
									font-weight: 600;
								}
							}
						}

						.hero-action {
							.action-text {
								font-size: 24rpx;
								opacity: 0.7;
								background: rgba(255, 255, 255, 0.15);
								padding: 12rpx 24rpx;
								border-radius: 20rpx;
								backdrop-filter: blur(10rpx);
								border: 1rpx solid rgba(255, 255, 255, 0.2);
								animation: bounce 2s ease-in-out infinite;
							}
						}
					}
				}
			}
		}
	}

	/* 5. 建议卡片样式 */
	.suggestions-section {
		margin: 0 20rpx 20rpx;
		background: white;
		border-radius: 16rpx;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);

		.suggestion-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 24rpx;
			cursor: pointer;
			transition: background 0.3s ease;

			&:hover {
				background: #f8f9fa;
			}

			.suggestion-title {
				font-size: 28rpx;
				font-weight: 600;
				color: #333;
			}

			.suggestion-subtitle {
				font-size: 20rpx;
				color: #6c757d;
				margin-left: 12rpx;
				flex: 1;
			}
		}

		.suggestions-list {
			border-top: 1rpx solid #f0f0f0;
			max-height: 400rpx;
			overflow-y: auto;

			.suggestion-item {
				display: flex;
				align-items: flex-start;
				gap: 16rpx;
				padding: 20rpx 24rpx;
				border-bottom: 1rpx solid #f8f8f8;

				&:last-child {
					border-bottom: none;
				}

				.suggestion-icon {
					font-size: 28rpx;
					margin-top: 4rpx;
				}

				.suggestion-content {
					flex: 1;

					.suggestion-text {
						font-size: 26rpx;
						color: #333;
						line-height: 1.5;
						margin-bottom: 8rpx;
					}

					.suggestion-action {
						font-size: 22rpx;
						color: #409EFF;
						font-weight: 600;
						cursor: pointer;
						transition: all 0.3s ease;
						padding: 4rpx 8rpx;
						border-radius: 4rpx;
						margin-top: 8rpx;
						display: inline-block;
						border: 1rpx solid transparent;

						&:hover {
							color: #66b3ff;
							background: rgba(64, 158, 255, 0.1);
							border-color: rgba(64, 158, 255, 0.2);
							transform: translateY(-1rpx);
						}

						&:active {
							transform: translateY(0);
							background: rgba(64, 158, 255, 0.2);
						}
					}
				}
			}
		}
	}

	/* 6. 记录列表样式 */
	.records-section {
		margin: 0 20rpx 20rpx;
		background: white;
		border-radius: 16rpx;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);

		.records-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 24rpx;
			border-bottom: 1rpx solid #f0f0f0;

			.records-title-group {
				display: flex;
				flex-direction: column;
				gap: 4rpx;

				.records-title {
					font-size: 28rpx;
					font-weight: 600;
					color: #333;
				}

				.records-subtitle {
					font-size: 20rpx;
					color: #6c757d;
				}
			}

			.records-count {
				font-size: 24rpx;
				color: #666;
				background: #f0f8ff;
				padding: 6rpx 12rpx;
				border-radius: 12rpx;
				border: 1rpx solid #e6f4ff;
			}
		}

		.records-list {
			.record-item {
				margin: 12rpx 16rpx;
				border-radius: 16rpx;
				background: #ffffff;
				overflow: hidden;
				box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
				border: 1rpx solid #f0f2f5;
				transition: all 0.3s ease;

				&:hover {
					transform: translateY(-2rpx);
					box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
				}

				// 紧凑的卡片头�?- 包含车牌号、状态和时间信息
				.record-header {
					padding: 16rpx 20rpx;
					background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
					border-bottom: 1rpx solid #e9ecef;

					.header-left {
						display: flex;
						align-items: center;
						justify-content: space-between;
						width: 100%;

						.plate-number {
							font-size: 28rpx;
							font-weight: bold;
							padding: 6rpx 16rpx;
							border-radius: 8rpx;
							font-family: "微软雅黑";
							letter-spacing: 1rpx;
							flex-shrink: 0;

							&.blue-plate {
								background: linear-gradient(180deg, #0C4FC5 0%, #216FEF 100%);
								color: #FFFFFF;
								border: 1rpx solid #0C4FC5;
							}

							&.green-plate {
								background: linear-gradient(180deg, #6AD390 0%, #D0F1E4 100%);
								color: #000000;
								border: 1rpx solid #6AD390;
							}
						}

						.status-badge {
							display: flex;
							align-items: center;
							gap: 4rpx;
							padding: 4rpx 10rpx;
							border-radius: 12rpx;
							font-size: 18rpx;
							font-weight: 500;
							flex-shrink: 0;

							.status-text {
								color: #ffffff;
							}

							&.status-pending {
								background: #ff9800;
								box-shadow: 0 2rpx 6rpx rgba(255, 152, 0, 0.25);
							}

							&.status-processing {
								background: #2196f3;
								box-shadow: 0 2rpx 6rpx rgba(33, 150, 243, 0.25);
							}

							&.status-completed {
								background: #4caf50;
								box-shadow: 0 2rpx 6rpx rgba(76, 175, 80, 0.25);
							}
						}
					}
				}

				// 主要内容区域 - 使用网格布局
				.record-main-content {
					padding: 16rpx 20rpx;
					background: #ffffff;

					// 时间信息网格
					.time-info-grid {
						display: grid;
						grid-template-columns: 1fr 1fr;
						gap: 16rpx;
						margin-bottom: 16rpx;

						.time-block {
							background: #f8f9fa;
							border-radius: 12rpx;
							padding: 12rpx;
							border-left: 4rpx solid #e9ecef;
							transition: all 0.3s ease;

							&.appointment-block {
								border-left-color: #2979ff;

								&:hover {
									background: #f0f8ff;
									border-left-color: #1976d2;
								}
							}

							&.enter-block {
								border-left-color: #4caf50;

								&:hover {
									background: #f1f8e9;
									border-left-color: #388e3c;
								}
							}

							&.leave-block {
								border-left-color: #ff5722;

								&:hover {
									background: #fff3e0;
									border-left-color: #d84315;
								}
							}

							&.duration-block {
								border-left-color: #9c27b0;

								&:hover {
									background: #f3e5f5;
									border-left-color: #7b1fa2;
								}
							}

							.time-label {
								display: flex;
								align-items: center;
								gap: 6rpx;
								font-size: 20rpx;
								color: #666;
								margin-bottom: 4rpx;
								font-weight: 500;

								.time-icon {
									font-size: 16rpx;
								}
							}

							.time-value {
								font-size: 24rpx;
								font-weight: 600;
								color: #333;
								font-family: 'SF Pro Display', -apple-system, sans-serif;
							}

							.time-date {
								font-size: 18rpx;
								color: #999;
								margin-top: 2rpx;
							}
						}
					}
				}

				// 底部违规原因
				.violation-reason {
					display: flex;
					align-items: center;
					gap: 12rpx;
					padding: 14rpx 20rpx;
					background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
					border-top: 1rpx solid #ffd54f;

					.reason-icon {
						font-size: 24rpx;
						filter: drop-shadow(0 1rpx 2rpx rgba(0, 0, 0, 0.1));
						flex-shrink: 0;
					}

					.reason-content {
						flex: 1;

						.reason-text {
							font-size: 22rpx;
							color: #e65100;
							font-weight: 600;
							line-height: 1.3;
						}
					}
				}
			}
		}

		.empty-state {
			padding: 80rpx 0;
			text-align: center;

			.empty-text {
				margin-top: 30rpx;
				font-size: 28rpx;
				color: #909399;
				letter-spacing: 1rpx;
			}
		}
	}

	/* 7. 弹窗样式 */
	.vehicle-modal,
	.type-modal,
	.status-modal {
		padding: 20rpx 0;

		.vehicle-modal-item,
		.type-modal-item,
		.status-modal-item {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 20rpx 24rpx;
			cursor: pointer;
			transition: background 0.3s ease;

			&:hover {
				background: #f8f9fa;
			}

			&.selected {
				background: #f0f8ff;
				border-left: 4rpx solid #409EFF;
			}
		}
	}

	.vehicle-modal {
		.vehicle-modal-item {
			.modal-plate {
				font-size: 30rpx;
				font-weight: 600;
				padding: 6rpx 16rpx;
				border-radius: 6rpx;

				&.blue-plate {
					background: linear-gradient(180deg, #0C4FC5 0%, #216FEF 100%);
					color: #FFFFFF;
					border: 1rpx solid #0C4FC5;
				}

				&.green-plate {
					background: linear-gradient(180deg, #6AD390 0%, #D0F1E4 100%);
					color: #000000;
					border: 1rpx solid #6AD390;
				}

				&.all-vehicles {
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
					color: #FFFFFF;
					border: 1rpx solid #667eea;
				}
			}

			.modal-info {
				display: flex;
				flex-direction: column;
				align-items: flex-end;
				gap: 6rpx;

				.modal-count {
					font-size: 22rpx;
					color: #666;
				}

				.modal-status {
					font-size: 20rpx;
					font-weight: 600;

					&.excellent {
						color: #52C41A;
					}

					&.good {
						color: #1890FF;
					}

					&.warning {
						color: #FAAD14;
					}

					&.danger {
						color: #FF4D4F;
					}
				}
			}
		}
	}

	.type-modal {
		.type-modal-item {
			.type-icon {
				font-size: 32rpx;
				margin-right: 16rpx;
				width: 48rpx;
				text-align: center;
			}

			.type-label {
				flex: 1;
				font-size: 26rpx;
				font-weight: 600;
				color: #333;
			}

			.type-count {
				font-size: 22rpx;
				color: #666;
				background: #f0f8ff;
				padding: 4rpx 12rpx;
				border-radius: 12rpx;
				border: 1rpx solid #e6f4ff;
			}
		}
	}

	.status-modal {
		.status-modal-item {
			.status-icon {
				margin-right: 16rpx;
				width: 48rpx;
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.status-label {
				flex: 1;
				font-size: 26rpx;
				font-weight: 600;
				color: #333;
			}

			.status-count {
				font-size: 22rpx;
				color: #666;
				background: #f0f8ff;
				padding: 4rpx 12rpx;
				border-radius: 12rpx;
				border: 1rpx solid #e6f4ff;
			}
		}
	}

	.detail-modal {
		padding: 20rpx;

		.detail-header {
			text-align: center;
			margin-bottom: 30rpx;
			padding-bottom: 20rpx;
			border-bottom: 1rpx solid #eee;

			.detail-date {
				font-size: 32rpx;
				font-weight: 600;
				color: #333;
				display: block;
				margin-bottom: 10rpx;
			}

			.detail-count {
				font-size: 24rpx;
				color: #666;
			}
		}

		.detail-list {
			max-height: 400rpx;
			overflow-y: auto;

			.detail-item {
				display: flex;
				align-items: center;
				padding: 20rpx;
				margin-bottom: 15rpx;
				background: #f9f9f9;
				border-radius: 12rpx;
				border-left: 4rpx solid #2979ff;

				.detail-plate {
					margin-right: 20rpx;

					.plate-text {
						padding: 8rpx 16rpx;
						border-radius: 6rpx;
						font-size: 28rpx;
						font-weight: bold;

						&.blue-plate {
							background: linear-gradient(180deg, #0C4FC5 0%, #216FEF 100%);
							color: #FFFFFF;
						}

						&.green-plate {
							background: linear-gradient(180deg, #6AD390 0%, #D0F1E4 100%);
							color: #000000;
						}
					}
				}

				.detail-info {
					flex: 1;
					display: flex;
					flex-direction: column;
					gap: 8rpx;

					.detail-time {
						font-size: 26rpx;
						color: #333;
					}

					.detail-reason {
						font-size: 24rpx;
						color: #666;
					}
				}
			}
		}

		.no-detail {
			text-align: center;
			padding: 60rpx 20rpx;
			color: #999;
			font-size: 28rpx;
		}
	}

	/* 8. 动画效果 */
	@keyframes warning-pulse {

		0%,
		100% {
			transform: scale(1);
			box-shadow: 0 8rpx 32rpx rgba(255, 152, 0, 0.4);
		}

		50% {
			transform: scale(1.02);
			box-shadow: 0 12rpx 40rpx rgba(255, 152, 0, 0.6);
		}
	}

	@keyframes danger-pulse {

		0%,
		100% {
			transform: scale(1);
			box-shadow: 0 8rpx 32rpx rgba(244, 67, 54, 0.5);
		}

		50% {
			transform: scale(1.03);
			box-shadow: 0 16rpx 48rpx rgba(244, 67, 54, 0.7);
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
			transform: translateY(-10rpx);
		}

		60% {
			transform: translateY(-5rpx);
		}
	}

	@keyframes shimmer {
		0% {
			transform: translateX(-100%);
		}

		100% {
			transform: translateX(100%);
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

	@keyframes intensity-pulse {

		0%,
		100% {
			transform: scale(1);
			opacity: 1;
		}

		50% {
			transform: scale(1.05);
			opacity: 0.9;
		}
	}

	@keyframes high-intensity-pulse {

		0%,
		100% {
			transform: scale(1);
			box-shadow: 0 6rpx 16rpx rgba(211, 47, 47, 0.6);
		}

		50% {
			transform: scale(1.1);
			box-shadow: 0 8rpx 20rpx rgba(211, 47, 47, 0.8);
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

	@keyframes pulse {

		0%,
		100% {
			transform: scale(1);
			opacity: 0.6;
		}

		50% {
			transform: scale(1.2);
			opacity: 1;
		}
	}

	@keyframes fadeInSlide {
		0% {
			opacity: 0;
			transform: translateX(-20rpx);
		}

		100% {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@keyframes slideInWidth {
		0% {
			opacity: 0;
			width: 0;
		}

		100% {
			opacity: 1;
		}
	}

	@keyframes iconPulse {

		0%,
		100% {
			transform: scale(1);
			box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
		}

		50% {
			transform: scale(1.05);
			box-shadow: 0 0 0 20rpx rgba(255, 255, 255, 0);
		}
	}

	@keyframes barGrow {
		0% {
			opacity: 0;
			transform: scaleY(0);
		}

		50% {
			opacity: 1;
		}

		100% {
			opacity: 0.8;
			transform: scaleY(1);
		}
	}

	@keyframes sparkle {

		0%,
		100% {
			opacity: 0;
			transform: scale(0.5) rotate(0deg);
		}

		50% {
			opacity: 1;
			transform: scale(1) rotate(180deg);
		}
	}

	@keyframes fadeInUp {
		0% {
			opacity: 0;
			transform: translateY(20rpx);
		}

		100% {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes clickFeedback {
		0% {
			transform: scale(1);
		}

		50% {
			transform: scale(0.95);
		}

		100% {
			transform: scale(1);
		}
	}

	.suggestion-action:active {
		animation: clickFeedback 0.2s ease;
	}

	@keyframes champion-glow {

		0%,
		100% {
			box-shadow: 0 8rpx 24rpx rgba(244, 67, 54, 0.25);
		}

		50% {
			box-shadow: 0 12rpx 32rpx rgba(244, 67, 54, 0.4), 0 0 0 4rpx rgba(244, 67, 54, 0.15);
		}
	}

	@keyframes bad-score-breath {

		0%,
		100% {
			transform: scale(1);
			background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
			box-shadow: 0 4rpx 20rpx rgba(250, 53, 52, 0.2);
		}

		50% {
			transform: scale(1.02);
			background: linear-gradient(135deg, #ff5252, #f03e3e);
			box-shadow: 0 8rpx 30rpx rgba(250, 53, 52, 0.3);
		}
	}

	@keyframes bad-score-ring-breath {

		0%,
		100% {
			transform: scale(1);
		}

		50% {
			transform: scale(1.05);
		}
	}

	@keyframes bad-score-text-breath {

		0%,
		100% {
			transform: scale(1);
			text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
		}

		50% {
			transform: scale(1.1);
			text-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.3);
		}
	}

	@keyframes icon-shake {

		0%,
		100% {
			transform: rotate(0deg);
		}

		10%,
		30%,
		50%,
		70%,
		90% {
			transform: rotate(-8deg);
		}

		20%,
		40%,
		60%,
		80% {
			transform: rotate(8deg);
		}
	}

	@keyframes high-risk-breath {

		0%,
		100% {
			background: linear-gradient(135deg, #ffebee, #ffcdd2);
			box-shadow: 0 2rpx 12rpx rgba(244, 67, 54, 0.15);
			transform: scale(1);
		}

		50% {
			background: linear-gradient(135deg, #ffcdd2, #ffb3ba);
			box-shadow: 0 4rpx 20rpx rgba(244, 67, 54, 0.25);
			transform: scale(1.02);
		}
	}

	@keyframes warning-icon-shake {

		0%,
		100% {
			transform: rotate(0deg) scale(1);
		}

		10%,
		30%,
		50%,
		70%,
		90% {
			transform: rotate(-12deg) scale(1.1);
		}

		20%,
		40%,
		60%,
		80% {
			transform: rotate(12deg) scale(1.1);
		}
	}

	@keyframes warning-text-pulse {

		0%,
		100% {
			opacity: 1;
			transform: scale(1);
		}

		50% {
			opacity: 0.8;
			transform: scale(1.05);
		}
	}

	@keyframes warning-plate-pulse {

		0%,
		100% {
			transform: scale(1);
			box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
		}

		50% {
			transform: scale(1.05);
			box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.2);
		}
	}

	@keyframes tap-hint {

		0%,
		100% {
			opacity: 0.7;
			transform: translateY(-50%) scale(1);
		}

		50% {
			opacity: 1;
			transform: translateY(-50%) scale(1.2);
		}
	}

	@keyframes warning-shake {

		0%,
		100% {
			transform: rotate(0deg);
		}

		10%,
		30%,
		50%,
		70%,
		90% {
			transform: rotate(-10deg);
		}

		20%,
		40%,
		60%,
		80% {
			transform: rotate(10deg);
		}
	}

	/* 9. 响应式设�?*/
	@media (max-width: 750rpx) {

		/* 筛选控制台响应�?*/
		.filter-control-panel {
			.filter-options-horizontal {
				padding: 12rpx;
				flex-direction: column;
				gap: 8rpx;

				.filter-item-horizontal {
					padding: 12rpx;

					.filter-content {
						.filter-label {
							font-size: 22rpx;
						}

						.filter-value {
							.selected-plate {
								font-size: 26rpx;
								padding: 3rpx 10rpx;
								max-width: 180rpx;
							}

							.selected-type,
							.selected-status {
								font-size: 22rpx;
								max-width: 180rpx;
							}
						}
					}
				}
			}
		}

		/* 单独高危提醒响应�?*/
		.high-risk-vehicle-standalone {
			padding: 16rpx 20rpx;

			.warning-icon {
				font-size: 32rpx;
				margin-right: 12rpx;
			}

			.warning-content {
				gap: 12rpx;
				flex-wrap: wrap;

				.warning-title {
					font-size: 22rpx;
					white-space: normal;
				}

				.warning-plate {
					font-size: 28rpx;
					padding: 4rpx 16rpx;

					&.clickable-plate::after {
						right: -25rpx;
						font-size: 18rpx;
					}
				}

				.warning-count {
					font-size: 22rpx;
					white-space: normal;
				}
			}
		}

		/* 信用分概览响应式 */
		.credit-overview-section {
			.credit-score-section {
				padding: 30rpx 30rpx 20rpx;

				.credit-message-integrated {
					margin-top: 20rpx;

					.message-text {
						font-size: 22rpx;
					}
				}
			}
		}

		/* 排行榜响应式调整 */
		.ranking-control-panel .ranking-toggle {
			padding: 20rpx 24rpx;

			.toggle-title-group {
				.toggle-text {
					font-size: 26rpx;

					&::before {
						font-size: 24rpx;
					}
				}

				.toggle-subtitle {
					font-size: 18rpx;
					margin-left: 32rpx;
				}
			}
		}

		/* 建议系统响应式调�?*/
		.suggestions-section {
			.suggestion-header {
				padding: 20rpx;

				.suggestion-title {
					font-size: 24rpx;
				}

				.suggestion-subtitle {
					font-size: 18rpx;
					margin-left: 8rpx;
				}
			}

			.suggestions-list .suggestion-item .suggestion-content {
				.suggestion-text {
					font-size: 22rpx;
				}

				.suggestion-action {
					font-size: 20rpx;
					padding: 3rpx 6rpx;
					margin-top: 6rpx;
				}
			}
		}

		/* 记录列表响应式调�?*/
		.records-section .records-header {
			padding: 20rpx;

			.records-title-group {
				.records-title {
					font-size: 24rpx;
				}

				.records-subtitle {
					font-size: 18rpx;
				}
			}

			.records-count {
				font-size: 20rpx;
			}
		}

		/* 记录项响应式调整 */
		.records-section .records-list .record-item {
			margin: 10rpx 12rpx;

			.record-header {
				padding: 14rpx 16rpx;

				.header-left {
					.plate-number {
						font-size: 26rpx;
						padding: 5rpx 12rpx;
					}

					.status-badge {
						padding: 3rpx 8rpx;
						font-size: 16rpx;
					}
				}
			}

			.record-main-content {
				padding: 12rpx 16rpx;

				.time-info-grid {
					grid-template-columns: 1fr;
					gap: 12rpx;

					.time-block {
						padding: 10rpx;

						.time-label {
							font-size: 18rpx;
						}

						.time-value {
							font-size: 22rpx;
						}

						.time-date {
							font-size: 16rpx;
						}
					}
				}
			}

			.violation-reason {
				padding: 12rpx 16rpx;

				.reason-icon {
					font-size: 20rpx;
				}

				.reason-content .reason-text {
					font-size: 20rpx;
				}
			}
		}

		/* 其他响应式调�?*/
		.analysis-panel {

			/* 统计说明横幅响应�?*/
			.analysis-info-banner {
				padding: 16rpx 20rpx;
				gap: 12rpx;
				flex-wrap: wrap;

				.info-icon {
					font-size: 28rpx;
				}

				.info-content {
					min-width: 200rpx;

					.info-title {
						font-size: 22rpx;
					}

					.info-desc {
						font-size: 20rpx;
						flex-wrap: wrap;

						.selected-vehicle-info {
							font-size: 24rpx;
							padding: 2rpx 8rpx;
						}
					}
				}

				.info-count {
					padding: 10rpx 16rpx;
					min-width: 70rpx;

					.count-number {
						font-size: 24rpx;
					}

					.count-label {
						font-size: 18rpx;
					}
				}
			}

			.tab-headers .tab-header .tab-title {
				font-size: 20rpx;
			}
		}

		.comparison-empty .empty-hero {
			padding: 40rpx 20rpx;
			min-height: 400rpx;

			.hero-content {
				.hero-title {
					font-size: 40rpx;
				}

				.hero-subtitle {
					font-size: 24rpx;
				}

				.hero-description {
					font-size: 22rpx;
				}

				.hero-features {
					gap: 12rpx;

					.feature-badge {
						padding: 10rpx 16rpx;

						.badge-icon {
							font-size: 18rpx;
						}

						.badge-text {
							font-size: 20rpx;
						}
					}
				}
			}

			.hero-icon-container .hero-icon {
				width: 120rpx;
				height: 120rpx;
			}
		}
	}
</style>