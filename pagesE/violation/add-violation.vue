<template>
	<view class="container">
		<!-- 自定义导航栏 -->
		<view class="custom-navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="navbar-content">
				<view class="navbar-left">
					<!-- 返回按钮 -->
					<view class="navbar-back" @click="goBack">
						<text class="back-icon">‹</text>
					</view>
				</view>
				<view class="navbar-center">
					<text class="navbar-title">新增违规记录</text>
				</view>
			</view>
		</view>
		<!-- 页面内容 -->
		<view class="page-content" :style="{ paddingTop: (statusBarHeight + 44) + 'px' }">
			<!-- 车牌信息区域 -->
			<view class="section-card">
				<view class="section-header">
					<view class="header-icon">
						<text class="icon-emoji">🚗</text>
					</view>
					<text class="section-title">车牌信息</text>
				</view>
				<view class="input-group">
					<!-- 车牌号输入区域 -->
					<view class="plate-input-section">
						<!-- 搜索框和识别按钮的容器 -->
						<view class="input-actions-container">
							<!-- 搜索框容器 -->
							<view class="plate-search-container">
								<view class="search-input-wrapper" @click="openPlateSearchModal"
									:class="{ focused: plateFocused, hasText: formData.plateNumber.length > 0 }">
									<view class="plate-display-input">
										<text class="plate-text" v-if="formData.plateNumber">{{ formData.plateNumber
										}}</text>
										<text class="placeholder-text" v-else>请输入车牌号码</text>
									</view>
									<view class="search-icon">
										<u-icon name="search" size="20" color="#999"></u-icon>
									</view>
									<view class="clear-btn" v-if="formData.plateNumber" @click.stop="clearPlateNumber">
										<u-icon name="close-circle-fill" size="22" color="#c8c9cc"></u-icon>
									</view>
								</view>
							</view>
							<!-- 车牌识别按钮 -->
							<view class="recognition-btn-container">
								<view class="plate-recognition-btn" :class="{ 'disabled': isRecognitionDisabled }"
									@click="openPlateRecognition">
									<u-icon name="camera" size="24"
										:color="isRecognitionDisabled ? '#c0c4cc' : '#2979ff'"></u-icon>
									<text class="btn-label">{{ recognitionButtonText }}</text>
								</view>
							</view>
						</view>
					</view>
					<!-- 车主信息显示（科技感卡片） -->
					<view class="owner-info" v-if="ownerInfo">
						<view class="owner-info-left">
							<view class="owner-avatar">
								<text class="owner-avatar-icon">👤</text>
							</view>
							<view class="owner-status-pills">
								<view class="status-pill" v-if="ownerInfo.isMonthlyTicket">
									<text class="status-pill-text">月票车</text>
								</view>
								<view class="status-pill status-pill-appointment" v-if="ownerInfo.isAppointment">
									<text class="status-pill-text">预约车</text>
								</view>
								<view class="status-pill status-pill-online" v-if="formData.enterTime">
									<text class="status-pill-text">在场</text>
								</view>
							</view>
						</view>

						<view class="owner-info-divider"></view>

						<view class="owner-info-right">
							<view class="info-item">
								<view class="info-row-icon">
									<text class="info-row-icon-text">👤</text>
								</view>
								<view class="info-row-main">
									<text class="info-label">车主</text>
									<text class="info-value">{{ ownerInfo.name || '未登记' }}</text>
								</view>
							</view>
							<view class="info-item">
								<view class="info-row-icon info-row-icon-phone">
									<text class="info-row-icon-text">📞</text>
								</view>
								<view class="info-row-main" @click="makePhoneCall(ownerInfo.phone)" v-if="ownerInfo.phone">
									<text class="info-label">电话</text>
									<text class="info-value info-value-phone">{{ ownerInfo.phone }}</text>
								</view>
								<view class="info-row-main" v-else>
									<text class="info-label">电话</text>
									<text class="info-value">{{ ownerInfo.phone || '未登记' }}</text>
								</view>
							</view>
							<view class="info-item" v-if="ownerInfo.ticketName">
								<view class="info-row-icon info-row-icon-ticket">
									<text class="info-row-icon-text">🎫</text>
								</view>
								<view class="info-row-main">
									<text class="info-label">月票</text>
									<text class="info-value">{{ ownerInfo.ticketName }}</text>
								</view>
							</view>
							<view class="info-item" v-if="ownerInfo.creditScore">
								<view class="info-row-icon info-row-icon-credit">
									<text class="info-row-icon-text">⭐</text>
								</view>
								<view class="info-row-main">
									<text class="info-label">信用分</text>
									<text class="info-value" :class="creditScoreClass">
										{{ ownerInfo.creditScore }}分
									</text>
								</view>
							</view>
							<!-- 🆕 显示进场时间 -->
							<view class="info-item" v-if="formData.enterTime">
								<view class="info-row-icon info-row-icon-time">
									<text class="info-row-icon-text">⏰</text>
								</view>
								<view class="info-row-main">
									<text class="info-label">进场时间</text>
									<text class="info-value enter-time">{{ formData.enterTime }}</text>
								</view>
							</view>
						</view>
					</view>
				</view>
			</view>



			<!-- 违规类型区域 -->
			<view class="section-card violation-type-section">
				<view class="section-header">
					<view class="header-icon">
						<text class="icon-emoji">⚠️</text>
					</view>
					<text class="section-title">违规类型</text>
				</view>
				<view class="violation-types">
					<!-- 已选择的类型显示 -->
					<view class="selected-type" v-if="selectedTypeInfo">
						<view class="selected-display">
							<text class="selected-icon">{{ selectedTypeInfo.icon }}</text>
							<text class="selected-name">{{ selectedTypeInfo.name }}</text>
							<text class="selected-check">✓</text>
						</view>
						<view class="divider"></view>
					</view>

					<!-- 搜索框 -->
					<view class="search-section" v-if="uiState.isSearching">
						<view class="search-container">
							<view class="search-box">
								<text class="search-icon">🔍</text>
								<input class="search-input" v-model="uiState.searchKeyword" placeholder="搜索违规类型..."
									@input="onSearchInput" focus />
								<text class="search-clear" v-if="uiState.searchKeyword" @click="clearSearch">×</text>
							</view>
							<view class="search-cancel" @click="cancelSearch">
								<text class="cancel-text">取消</text>
							</view>
						</view>
					</view>

					<!-- 搜索结果 -->
					<view class="search-results" v-if="uiState.isSearching && uiState.searchKeyword">
						<view class="section-label">搜索结果</view>
						<view class="type-tags" v-if="searchResults.length > 0">
							<view class="type-tag" v-for="(type, index) in searchResults" :key="index"
								@click="selectType(type)">
								<text class="tag-icon">{{ type.icon }}</text>
								<text class="tag-text">{{ type.name }}</text>
							</view>
						</view>
						<!-- 无搜索结果提示 -->
						<view class="no-results" v-if="searchResults.length === 0">
							<text class="no-results-icon">🔍</text>
							<text class="no-results-text">未找到匹配的违规类型</text>
							<text class="no-results-tip">试试其他关键词或选择下方常用类型</text>
						</view>
						<view class="divider" v-if="searchResults.length > 0"></view>
					</view>

					<!-- 常用类型 -->
					<view class="common-section">
						<view class="section-label">{{ selectedTypeInfo ? '其他常用类型' : '常用类型' }}</view>
						<view class="type-tags">
							<view class="type-tag" v-for="(type, index) in displayCommonTypes" :key="index"
								@click="selectType(type)">
								<text class="tag-icon">{{ type.icon }}</text>
								<text class="tag-text">{{ type.name }}</text>
							</view>
							<view class="type-tag more" @click="toggleMoreTypes">
								<text class="tag-text">{{ uiState.showMoreTypes ? '收起 ▲' : '更多类型 ▼' }}</text>
							</view>
						</view>
					</view>

					<!-- 其他类型（展开时显示） -->
					<view class="others-section" v-if="uiState.showMoreTypes">
						<view class="divider"></view>
						<view class="section-label">其他类型</view>
						<view class="type-tags">
							<view class="type-tag" v-for="(type, index) in violationConfig.others" :key="index"
								:class="{ selected: formData.violationType === type.value }" @click="selectType(type)">
								<text class="tag-icon">{{ type.icon }}</text>
								<text class="tag-text">{{ type.name }}</text>
							</view>
						</view>
					</view>

					<!-- 搜索入口 -->
					<view class="find-entry" v-if="!uiState.isSearching">
						<view class="divider"></view>
						<view class="find-trigger" @click="startSearch">
							<text class="find-icon">🔍</text>
							<text class="find-text">查找其他违规类型...</text>
						</view>
					</view>

					<!-- 自定义违规类型输入 -->
					<view class="custom-type-input" v-if="formData.violationType === 'other'">
						<input class="custom-input" v-model="formData.customType" placeholder="请输入自定义违规类型"
							maxlength="50" />
					</view>
				</view>
			</view>

			<!-- 违规位置区域 -->
			<view class="section-card">
				<view class="section-header">
					<view class="header-icon">
						<text class="icon-emoji">📍</text>
					</view>
					<text class="section-title">违规位置</text>
				</view>
				<view class="location-input-group">
					<view class="location-wrapper"
						:class="{ focused: locationFocused, hasText: formData.location.length > 0 }">
						<input class="location-input" v-model="formData.location" placeholder="请手动输入具体违规位置"
							@focus="locationFocused = true" @blur="locationFocused = false" />
						<view class="clear-location-btn" v-if="formData.location" @click="clearLocation">
							<u-icon name="close-circle-fill" size="22" color="#c8c9cc"></u-icon>
						</view>
					</view>
				</view>
			</view>

			<!-- 现场取证区域 -->
			<view class="section-card">
				<view class="section-header">
					<view class="header-icon">
						<text class="icon-emoji">📸</text>
					</view>
					<text class="section-title">现场取证</text>
				</view>
				<view class="evidence-section">
					<!-- 照片上传 -->
					<view class="photo-upload">
						<view class="upload-header">
							<text class="upload-title">拍照取证</text>
							<text class="photo-count">{{ formData.photos.length }}/6</text>
						</view>
						<view class="photo-grid">
							<view class="photo-item" v-for="(photo, index) in formData.photos" :key="index"
								@click="previewPhoto(index)">
								<image :src="photo" mode="aspectFill" class="photo-image"></image>
								<view class="photo-delete" @click.stop="deletePhoto(index)">
									<text class="icon-emoji">×</text>
								</view>
							</view>
							<view class="photo-add" v-if="formData.photos.length < 6" @click="takePhoto">
								<text class="icon-emoji add-icon">📷</text>
								<text class="add-text">拍照</text>
							</view>
						</view>
					</view>


				</view>
			</view>

			<!-- 违规描述区域 -->
			<view class="section-card">
				<view class="section-header">
					<view class="header-icon">
						<text class="icon-emoji">📝</text>
					</view>
					<text class="section-title">违规描述</text>
				</view>
				<view class="description-input">
					<textarea class="description-textarea" v-model="formData.description" placeholder="请详细描述违规情况..."
						maxlength="200" :show-word-limit="true" :auto-height="true"></textarea>

					<!-- 快速模板 -->
					<view class="description-templates" v-if="descriptionTemplates.length > 0">
						<text class="template-label">快速模板：</text>
						<view class="template-tags">
							<view class="template-tag" v-for="(template, index) in descriptionTemplates" :key="index"
								@click="useDescriptionTemplate(template)">
								<text class="template-text">{{ template }}</text>
							</view>
						</view>
					</view>
				</view>
			</view>

			<!-- 🆕 拉黑设置区域 -->

			<!-- 提交按钮 -->
			<view class="submit-section">
				<view class="submit-btn" :class="{ disabled: !canSubmit }" @click="submitViolation">
					<text>{{ submitting ? '提交中...' : '提交违规记录' }}</text>
				</view>
			</view>
		</view>

		<!-- 车牌识别弹窗 -->
		<view class="scan-modal" v-if="showScanModal" @click="closeScanModal">
			<view class="scan-content" @click.stop>
				<view class="scan-header">
					<text class="scan-title">车牌识别</text>
					<view class="scan-close" @click="closeScanModal">
						<text class="icon-emoji">×</text>
					</view>
				</view>

				<!-- 摄像头识别界面 -->
				<view class="camera-container" v-if="showCamera">
					<camera device-position="back" flash="off" @error="handleCameraError" class="camera-preview"
						ref="camera">
						<!-- 车牌框选区域 -->
						<view class="plate-frame">
							<view class="frame-corner tl"></view>
							<view class="frame-corner tr"></view>
							<view class="frame-corner bl"></view>
							<view class="frame-corner br"></view>
							<text class="frame-text">自动识别中，请保持稳定</text>
						</view>

						<!-- 自动识别状态指示器 -->
						<view class="auto-status">
							<view class="status-dot"></view>
							<text class="status-text">自动识别: {{ autoRecognizeCount }}次</text>
						</view>
					</camera>

					<!-- 摄像头控制按钮 -->
					<view class="camera-controls">
						<!-- 手动拍照按钮 -->
						<button @tap="capturePhoto" :disabled="isRecognizing" class="capture-btn">
							<text class="camera-icon">📷</text>
							{{ isRecognizing ? '识别中...' : '手动拍照' }}
						</button>

						<button @tap="closeCamera" class="close-btn">
							<text class="close-icon">❌</text>
							关闭摄像头
						</button>
					</view>

					<!-- 加载提示 -->
					<view class="loading-overlay" v-if="isRecognizing">
						<view class="loading-content">
							<text class="loading-text">正在识别车牌...</text>
						</view>
					</view>
				</view>

				<!-- 功能选择界面 -->
				<view class="function-buttons" v-if="!showCamera">
					<view class="scan-area">
						<view class="scan-frame">
							<view class="scan-line"></view>
						</view>
						<text class="scan-tip">选择识别方式</text>
					</view>

					<view class="scan-result" v-if="scanResult">
						<text class="result-label">识别结果：</text>
						<text class="result-text">{{ scanResult }}</text>
					</view>

					<view class="scan-actions">
						<view class="scan-action-btn primary" @click="startCamera">
							<text>📷 摄像头识别</text>
						</view>
						<view class="scan-action-btn" @click="chooseFromAlbum">
							<text>🖼️ 相册识别</text>
						</view>
						<view class="scan-action-btn primary" @click="useScanResult" v-if="scanResult">
							<text>使用结果</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 提交确认弹窗 -->
		<view class="confirm-modal" v-if="showConfirmModal" @click="closeConfirmModal">
			<view class="confirm-content" @click.stop>
				<view class="confirm-header">
					<text class="confirm-title">确认提交</text>
				</view>
				<view class="confirm-body">
					<text class="confirm-text">确认提交违规记录吗？</text>
					<view class="confirm-info">
						<text class="info-text">车牌：{{ formData.plateNumber }}</text>
						<text class="info-text">类型：{{ getViolationTypeName() }}</text>
						<text class="info-text">位置：{{ formData.location }}</text>
					</view>
				</view>
				<view class="confirm-actions">
					<view class="confirm-btn cancel" @click="closeConfirmModal">
						<text>取消</text>
					</view>
					<view class="confirm-btn primary" @click="confirmSubmit">
						<text>{{ submitting ? '提交中...' : '确认提交' }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 车牌识别弹窗 -->

		<!-- 车牌识别弹窗 - 全屏显示 -->
		<view class="plate-recognition-fullscreen" v-if="showPlateRecognitionModal" @click="closePlateRecognition">
			<!-- 摄像头识别界面 -->
			<view class="camera-container-fullscreen" v-if="showCamera" @click.stop>
				<camera device-position="back" flash="off" @error="handleCameraError" class="camera-preview"
					ref="camera">
					<!-- 车牌框选区域 -->
					<view class="plate-frame">
						<view class="frame-corner tl"></view>
						<view class="frame-corner tr"></view>
						<view class="frame-corner bl"></view>
						<view class="frame-corner br"></view>
						<text class="frame-text">请将车牌对准框内</text>
					</view>

					<!-- 自动识别状态指示器 -->
					<view class="auto-status" v-if="autoRecognize">
						<view class="status-dot"></view>
						<text class="status-text">自动识别: {{ autoRecognizeCount }}次</text>
					</view>

					<!-- 关闭摄像头按钮 -->
					<view class="control-btn close-btn" @click="closeCamera">
						<u-icon name="close" size="32" color="#fff"></u-icon>
					</view>
				</camera>

				<!-- 摄像头控制按钮 -->
				<view class="camera-controls">
					<!-- 手动拍照按钮 -->
					<view class="control-btn capture-btn" @click="capturePhoto" :class="{ disabled: isRecognizing }">
						<u-icon name="camera" size="24" color="#fff"></u-icon>
						<text>{{ isRecognizing ? '识别中...' : '拍照识别' }}</text>
					</view>

					<!-- 自动识别开关 -->
					<view class="control-btn auto-btn" @click="toggleAutoRecognize" :class="{ active: autoRecognize }">
						<u-icon name="play-circle" size="24" color="#fff" v-if="!autoRecognize"></u-icon>
						<u-icon name="pause-circle" size="24" color="#fff" v-if="autoRecognize"></u-icon>
						<text>{{ autoRecognize ? '停止自动' : '自动识别' }}</text>
					</view>
				</view>
			</view>

			<!-- 识别选择界面 -->
			<view class="recognition-options" v-if="!showCamera && !recognitionResult" @click.stop>
				<view class="option-item" @click="openCamera">
					<view class="option-icon">
						<u-icon name="camera" size="40" color="#2979ff"></u-icon>
					</view>
					<view class="option-content">
						<text class="option-title">摄像头识别</text>
						<text class="option-desc">实时扫描车牌号码</text>
					</view>
				</view>

				<view class="option-item" @click="chooseFromAlbum">
					<view class="option-icon">
						<u-icon name="photo" size="40" color="#19be6b"></u-icon>
					</view>
					<view class="option-content">
						<text class="option-title">相册选择</text>
						<text class="option-desc">从相册选择车牌图片</text>
					</view>
				</view>
			</view>

			<!-- 识别结果显示 -->
			<view class="recognition-result" v-if="recognitionResult" @click.stop>
				<view class="result-header">
					<u-icon name="checkmark-circle" size="40" color="#19be6b"></u-icon>
					<text class="result-title">识别成功</text>
				</view>

				<!-- 车牌号码显示 -->
				<view class="result-plate-container">
					<view class="preview-car-plate" :style="{
						background: recognitionResult.plateNumber && recognitionResult.plateNumber.length === 8
							? 'linear-gradient(to bottom, #d0f1e4, #6ad390)'
							: 'linear-gradient(to bottom, #216fef, #0c4fc5)',
						borderColor: recognitionResult.plateNumber && recognitionResult.plateNumber.length === 8 ? '#6ad390' : '#216fef'
					}">
						<view class="preview-plate-text"
							:style="{ color: recognitionResult.plateNumber && recognitionResult.plateNumber.length === 8 ? '#000' : '#fff' }">
							<text v-for="(char, index) in (recognitionResult.plateNumber || '').split('')" :key="index"
								class="plate-char"
								:style="{ color: recognitionResult.plateNumber && recognitionResult.plateNumber.length === 8 ? '#000' : '#fff' }">
								{{ char }}
							</text>
						</view>
					</view>
					<view class="plate-info">
						<text class="plate-color-text" v-if="recognitionResult.color">{{ recognitionResult.color
						}}</text>
						<text class="plate-confidence-text" v-if="recognitionResult.confidence">置信度 {{
							recognitionResult.confidence }}%</text>
						<text class="plate-type-text" v-if="recognitionResult.plateType">车牌类型：{{
							recognitionResult.plateType }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 🆕 车牌搜索弹窗（独立弹窗）-->
		<view class="plate-search-modal" v-if="showPlateSearchModal" @click="closePlateSearchModal">
			<view class="search-modal-container" @click.stop>
				<view class="search-modal-header">
					<text class="search-modal-title">搜索车牌号</text>
					<view class="search-modal-close" @click="closePlateSearchModal">
						<u-icon name="close" size="20" color="#666"></u-icon>
					</view>
				</view>
				<view class="search-modal-body">
					<view class="search-input-container">
						<input class="search-modal-input" v-model="plateSearchKeyword" placeholder="请输入车牌号码"
							@input="onPlateSearchInput" @confirm="searchPlates" :focus="plateFocused" />
						<view class="search-btn" @click="searchPlates">
							<u-icon name="search" size="18" color="#2979ff"></u-icon>
						</view>
					</view>
					<view class="search-results" v-if="groupedSuggestions.length > 0">
						<view class="result-header">
							<text class="result-count">找到 {{ totalPlateCount }} 个车牌，{{ groupedSuggestions.length }}
								个车主</text>
						</view>
						<scroll-view scroll-y class="results-scroll">
							<!-- 分组显示：按车主分组 -->
							<view class="owner-group" v-for="(group, groupIndex) in groupedSuggestions"
								:key="groupIndex">
								<!-- 车主信息外框 -->
								<view class="owner-frame">
									<!-- 车主基本信息 -->
									<view class="owner-header">
										<view class="owner-info">
											<view class="owner-name-row">
												<text class="owner-name">👤 车主：{{ group.ownerName || '未知车主' }}</text>
												<!-- 月票车标记 -->
												<view class="vehicle-tag monthly-tag" v-if="group.dataSource === '月票车'">
													<text class="tag-text">月票车</text>
												</view>
												<!-- 预约车标记 -->
												<view class="vehicle-tag appointment-tag"
													v-if="group.dataSource === '预约车'">
													<text class="tag-text">预约车</text>
												</view>
											</view>
											<view class="owner-details">
												<text class="owner-ticket" v-if="group.ticketName">🎫
													{{ group.ticketName }}</text>
												<text class="owner-credit" v-if="group.creditScore !== undefined">⭐
													信用{{ group.creditScore }}分</text>
												<text class="owner-phone clickable-phone" v-if="group.ownerPhone"
													@click="makePhoneCall(group.ownerPhone)">📱
													{{ group.ownerPhone }}</text>
												<!-- 车位信息显示 -->
												<view class="parking-spots" v-if="getParkingSpots(group).length > 0">
													<text class="spots-label">🅿️ 车位 </text>
													<text class="spot-item"
														v-for="(spot, index) in getParkingSpots(group)" :key="index">
														{{ spot }}{{ index < getParkingSpots(group).length - 1 ? '、'
															: '' }} </text>
												</view>
											</view>
										</view>
									</view>

									<!-- 分隔线 -->
									<view class="owner-divider"></view>

									<!-- 车牌列表 -->
									<view class="plates-container">
										<view class="plate-card" v-for="(plate, plateIndex) in group.plates"
											:key="plateIndex" @click="selectPlateFromGroup(plate, group)">
											<view class="plate-content">
												<view class="plate-number"
													:class="isNewEnergyPlate(plate.plateNumber) ? 'green-plate' : 'blue-plate'">
													{{ plate.plateNumber }}
												</view>
											</view>
										</view>
									</view>
								</view>
							</view>
						</scroll-view>
						<!-- 加载更多按钮 -->
						<view class="load-more-section" v-if="showLoadMoreBtn">
							<view class="load-more-btn" @click="loadMoreResults">
								<text class="load-more-text">加载更多结果</text>
							</view>
						</view>
					</view>
					<view class="search-empty" v-else-if="plateSearchKeyword && !isSearching">
						<text class="empty-text">未找到匹配的车牌号</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 自定义TabBar -->
		<custom-tabbar :user-role="currentUserRole"></custom-tabbar>

		<!-- 🆕 黑名单类型选择弹窗 -->
		<view class="blacklist-modal-overlay" v-if="showBlacklistTypeModal" @click="closeBlacklistModal">
			<view class="blacklist-modal" @click.stop="">
				<view class="modal-header">
					<text class="modal-title">选择黑名单类型</text>
					<view class="modal-close" @click="closeBlacklistModal">
						<text class="close-icon">×</text>
					</view>
				</view>

				<view class="modal-content">
					<!-- 加载状态 -->
					<view class="loading-container" v-if="loadingBlacklistTypes">
						<text class="loading-text">正在加载黑名单类型...</text>
					</view>

					<!-- 黑名单类型选择 -->
					<view class="blacklist-type-grid" v-else-if="blacklistTypes.length > 0">
						<view class="blacklist-type-item" v-for="(type, index) in blacklistTypes" :key="index"
							:class="{ selected: selectedBlacklistType && selectedBlacklistType.id === type.id }"
							@click="selectBlacklistType(type)">
							<text class="blacklist-type-icon">🚫</text>
							<text class="blacklist-type-name">{{ type.name }}</text>
						</view>
					</view>

					<!-- 无可用类型提示 -->
					<view class="no-types-container" v-else>
						<text class="no-types-text">暂无可用的黑名单类型</text>
						<view class="retry-btn" @click="loadBlacklistTypes">
							<text class="retry-text">重新加载</text>
						</view>
					</view>
				</view>

				<view class="modal-footer">
					<view class="footer-btn cancel-btn" @click="closeBlacklistModal">
						<text class="btn-text">取消</text>
					</view>
					<view class="footer-btn confirm-btn" :class="{ disabled: !selectedBlacklistType }"
						@click="confirmBlacklistType">
						<text class="btn-text">确认</text>
					</view>
				</view>
			</view>
		</view>

	</view>
</template>

<script>
// 导入违规API
import {
	violationApi,
	ownerApi
} from '@/api/violation-api.js';
// 导入预约API
import {
	appointmentAPI
} from '@/config/api.js';

export default {
	data() {
		return {
			statusBarHeight: 0, // 状态栏高度
			currentUserRole: 'patrol',
			currentPark: '', // 当前车场名称
			showDebugBtn: true, // 🔧 调试按钮显示状态
			// API测试相关
			isDevelopment: process.env.NODE_ENV === 'development', // 开发环境标识
			showApiTestModal: false, // API测试弹窗显示状态
			testParams: {
				keyword: '',
				parkName: ''
			},
			apiTestResults: [], // API测试结果
			formData: {
				plateNumber: '',
				violationType: '',
				customType: '',
				location: '',
				photos: [],
				description: '',
				shouldBlacklist: false,
				blacklistReason: '',
				blacklistDecisionMade: false, // 是否已明确做出拉黑决定
				enterTime: null, // 🆕 进场时间（用于在场车辆的违规记录）
				leaveTime: null, // 🔧 新增：离场时间（从预约表的leavedate获取）
				appointmentTime: null // 🔧 新增：预约时间（从预约表的visitdate获取）
			},
			// 车牌识别相关
			showPlateRecognitionModal: false, // 是否显示车牌识别弹窗
			showCamera: false, // 是否显示摄像头
			isRecognizing: false, // 是否正在识别
			recognitionResult: null, // 识别结果对象
			autoRecognize: false, // 自动识别开关
			autoRecognizeTimer: null, // 自动识别定时器
			autoRecognizeCount: 0, // 自动识别次数
			lastRecognizeTime: 0, // 上次识别时间
			failedRecognizeCount: 0, // 失败识别次数
			isRecognitionDisabled: false, // 是否禁用识别功能
			disabledUntilTime: 0, // 禁用到什么时间（时间戳）
			disabledCheckTimer: null, // 禁用状态检查定时器
			currentTime: Date.now(), // 当前时间（用于倒计时显示）
			ownerInfo: null,
			// 违规类型配置 - 基于真实数据和使用频率
			violationConfig: {
				// 常用类型（基于使用频率统计）
				common: [{
					name: '超时停车',
					value: 'overtime',
					icon: '🚗',
					usage: 45
				},
				{
					name: '未按位停车',
					value: 'wrong_position',
					icon: '🅿️',
					usage: 30
				},
				{
					name: '占用他人车位',
					value: 'occupy_space',
					icon: '🚫',
					usage: 15
				},
				{
					name: '遮挡车牌',
					value: 'block_plate',
					icon: '🚫',
					usage: 12
				},
				{
					name: '堵塞消防通道',
					value: 'block_passage',
					icon: '🚧',
					usage: 10
				},
				{
					name: '压线停车',
					value: 'cross_line',
					icon: '📏',
					usage: 8
				}
				],
				// 其他类型
				others: [{
					name: '未经授权停车',
					value: 'unauthorized',
					icon: '🔒',
					usage: 8
				},
				{
					name: '占用残疾人车位',
					value: 'disabled_space',
					icon: '♿',
					usage: 4
				},
				{
					name: '逆向停车',
					value: 'reverse_parking',
					icon: '🔄',
					usage: 3
				},
				{
					name: '跨车位停车',
					value: 'cross_parking',
					icon: '📐',
					usage: 3
				},
				{
					name: '占用VIP车位',
					value: 'vip_space',
					icon: '👑',
					usage: 2
				},
				{
					name: '未熄火停车',
					value: 'engine_on',
					icon: '🔥',
					usage: 2
				},
				{
					name: '占用卸货区',
					value: 'loading_zone',
					icon: '📦',
					usage: 2
				},
				{
					name: '超宽停车',
					value: 'oversized',
					icon: '📏',
					usage: 1
				},
				{
					name: '占用绿化带',
					value: 'green_belt',
					icon: '🌱',
					usage: 1
				},
				{
					name: '占用充电桩车位',
					value: 'charging_space',
					icon: '🔌',
					usage: 1
				},
				{
					name: '车辆损坏',
					value: 'vehicle_damage',
					icon: '🔧',
					usage: 1
				},
				{
					name: '其他',
					value: 'other',
					icon: '➕',
					usage: 1
				}
				]
			},



			// 界面状态
			uiState: {
				showMoreTypes: false, // 是否展开更多类型
				searchKeyword: '', // 搜索关键词
				isSearching: false // 是否在搜索状态
			},
			// 搜索相关
			searchTimer: null, // 搜索防抖定时器
			showScanModal: false,
			scanResult: '',
			scanning: false,
			showConfirmModal: false,
			submitting: false,
			// 车牌识别相关
			showCamera: false,
			isRecognizing: false,
			debugMode: false,
			// 自动识别相关变量
			autoRecognize: false, // 自动识别开关
			autoRecognizeTimer: null, // 自动识别定时器
			autoRecognizeCount: 0, // 自动识别次数计数
			autoRecognizeInterval: 2000, // 自动识别间隔（2秒）
			lastRecognizeTime: 0, // 上次识别时间（防抖用）
			lastResult: null, // 最新识别结果

			// 车牌搜索相关
			showPlateSuggestions: false, // 是否显示车牌搜索建议
			plateSuggestions: [], // 车牌搜索建议列表
			plateSearchTimer: null, // 车牌搜索防抖定时器
			plateFocused: false, // 车牌输入框是否聚焦
			showLoadMoreBtn: false, // 是否显示加载更多按钮
			usingSmartSearch: false, // 🆕 当前是否使用智能搜索
			currentSearchPage: 1, // 当前搜索页码
			totalSearchResults: 0, // 搜索结果总数

			// 弹窗相关
			showPlateSearchModal: false, // 是否显示车牌搜索弹窗
			plateSearchKeyword: '', // 车牌搜索关键词
			isSearching: false, // 是否正在搜索
			locationFocused: false, // 位置输入框是否聚焦

			// 车牌识别相关
			showPlateRecognitionModal: false, // 是否显示车牌识别弹窗
			showCamera: false, // 是否显示摄像头
			isRecognizing: false, // 是否正在识别
			recognitionResult: null, // 识别结果对象
			autoRecognize: false, // 自动识别开关
			autoRecognizeTimer: null, // 自动识别定时器
			autoRecognizeCount: 0, // 自动识别次数
			lastRecognizeTime: 0, // 上次识别时间
			recognitionFailedCount: 0, // 识别失败次数
			recognitionLocked: false, // 识别是否被锁定
			recognitionLockTime: null, // 锁定时间
			recognitionLockDuration: 60000, // 锁定时长（60秒）
			maxRecognitionFailures: 3, // 最大识别失败次数

			blacklistReasonTemplates: [
				'车辆损坏',
				'车主不文明行为',
				'多次违规停车',
				'占用残疾人车位',
				'占用VIP车位',
				'未熄火停车',
				'占用卸货区',
				'超宽停车',
				'占用绿化带',
				'占用充电桩车位',
				'其他'
			],

			// 🆕 黑名单相关
			blacklistTypes: [], // 黑名单类型列表
			selectedBlacklistType: null, // 选中的黑名单类型
			loadingBlacklistTypes: false, // 是否正在加载黑名单类型
			showBlacklistTypeModal: false, // 黑名单类型选择弹窗显示状态
			blacklistSubmitSuccess: false, // 黑名单是否添加成功

			// 🆕 预约记录相关
			selectedAppointmentId: null, // 当前选中的预约记录ID
			appointmentRecords: [], // 预约记录列表  
			violationSuggestions: [], // 违规建议列表
			showAppointmentModal: false // 是否显示预约记录选择弹窗
		}
	},

	// 添加组件销毁时的清理
	beforeDestroy() {
		this.stopAutoRecognize();
		// 清理搜索定时器
		if (this.searchTimer) {
			clearTimeout(this.searchTimer);
			this.searchTimer = null;
		}
		// 清理车牌搜索定时器
		if (this.plateSearchTimer) {
			clearTimeout(this.plateSearchTimer);
			this.plateSearchTimer = null;
		}

		// 清理自动识别定时器
		if (this.autoRecognizeTimer) {
			clearTimeout(this.autoRecognizeTimer);
			this.autoRecognizeTimer = null;
		}
	},

	// 🔔 微信通知发送功能已移到后端，由后端在创建违规记录时自动发送给对应的 visitorname

	computed: {
		canSubmit() {
			// 基本字段验证：车牌号、违规类型、违规位置
			const basicFieldsValid = this.formData.plateNumber &&
				this.formData.violationType &&
				this.formData.location &&
				(this.formData.violationType !== 'other' || this.formData.customType);

			return basicFieldsValid;
		},

		// 根据违规类型动态显示相关描述模板
		descriptionTemplates() {
			const baseTemplates = [
				'车辆停放超出白线范围',
				'占用他人预约车位',
				'停车时间超过预约时长',
				'车辆停放角度不正确',
				'未按规定方向停车',
				'车辆阻挡通道'
			];

			const typeSpecificTemplates = {
				'overtime': [
					'停车时间超过2小时',
					'超过预约时长30分钟',
					'夜间停车超时'
				],
				'wrong_position': [
					'车辆停放超出白线范围',
					'车辆停放角度不正确',
					'未按规定方向停车'
				],
				'occupy_space': [
					'占用他人预约车位',
					'占用访客车位',
					'占用业主专用车位'
				],
				'block_plate': [
					'车牌被遮挡无法识别',
					'故意遮挡车牌号码'
				],
				'block_passage': [
					'车辆阻挡消防通道',
					'车辆阻挡行车道',
					'车辆阻挡人行通道'
				]
			};

			// 如果选择了特定类型，返回对应模板，否则返回基础模板
			if (this.formData.violationType && typeSpecificTemplates[this.formData.violationType]) {
				return typeSpecificTemplates[this.formData.violationType];
			}
			return baseTemplates;
		},

		// 计算信用分样式类
		creditScoreClass() {
			if (!this.ownerInfo || !this.ownerInfo.creditScore) {
				return '';
			}
			const score = this.ownerInfo.creditScore;
			if (score >= 80) return 'credit-excellent';
			if (score >= 60) return 'credit-warning';
			return 'credit-danger';
		},

		// 当前显示的常用类型（排除已选择的）
		displayCommonTypes() {
			return this.violationConfig.common.filter(type =>
				type.value !== this.formData.violationType
			);
		},

		// 搜索结果
		searchResults() {
			if (!this.uiState.searchKeyword) return [];

			const keyword = this.uiState.searchKeyword.toLowerCase();
			const allTypes = [...this.violationConfig.common, ...this.violationConfig.others];

			return allTypes.filter(type =>
				type.name.toLowerCase().includes(keyword) ||
				type.value.toLowerCase().includes(keyword)
			);
		},

		// 已选择的类型信息
		selectedTypeInfo() {
			if (!this.formData.violationType) return null;

			const allTypes = [...this.violationConfig.common, ...this.violationConfig.others];
			return allTypes.find(type => type.value === this.formData.violationType);
		},



		// 🆕 按车主分组的搜索建议 - 修改为只显示搜索的车牌
		groupedSuggestions() {
			if (!this.plateSuggestions || this.plateSuggestions.length === 0) {
				return [];
			}

			// 按车主分组
			const groups = {};

			this.plateSuggestions.forEach(suggestion => {
				// 检查车牌号是否包含多个车牌（逗号分隔）
				const plateNumbers = suggestion.plateNumber ? suggestion.plateNumber.split(',').map(p => p
					.trim()) : [suggestion.plateNumber];

				const ownerKey = suggestion.ownerName || 'unknown';

				if (!groups[ownerKey]) {
					groups[ownerKey] = {
						ownerName: suggestion.ownerName,
						ownerPhone: suggestion.ownerPhone,
						ownerId: suggestion.ownerId,
						ticketName: suggestion.ticketName,
						creditScore: suggestion.creditScore,
						appointmentCount: suggestion.appointmentCount,
						// 🆕 添加车位信息
						remark: suggestion.remark,
						remark1: suggestion.remark1,
						remark2: suggestion.remark2,
						remark3: suggestion.remark3,
						// 🆕 添加地址信息
						address: suggestion.address,
						// 🆕 添加数据源字段
						dataSource: suggestion.dataSource,
						plates: []
					};
				}

				// 🆕 只添加匹配搜索关键词的车牌，并去重
				plateNumbers.forEach(plateNumber => {
					if (plateNumber && plateNumber.trim()) {
						// 检查车牌是否匹配搜索关键词
						const searchKeyword = (this.plateSearchKeyword || '').toUpperCase().trim();
						const currentPlate = plateNumber.trim().toUpperCase();

						// 只有当车牌包含搜索关键词时才添加
						if (!searchKeyword || currentPlate.includes(searchKeyword)) {
							// 🆕 检查是否已存在相同车牌，避免重复
							const plateExists = groups[ownerKey].plates.some(plate =>
								plate.plateNumber.toUpperCase() === currentPlate
							);

							if (!plateExists) {
								groups[ownerKey].plates.push({
									plateNumber: plateNumber.trim(),
									ownerName: suggestion.ownerName,
									ownerPhone: suggestion.ownerPhone,
									ownerId: suggestion.ownerId,
									ticketName: suggestion.ticketName,
									parkingSpot: suggestion.parkingSpot,
									validStatus: suggestion.validStatus,
									isFrozen: suggestion.isFrozen,
									isInPark: suggestion.isInPark,
									appointmentCount: suggestion.appointmentCount,
									violationCount: suggestion.violationCount,
									creditScore: suggestion.creditScore,
									// 🆕 添加车位信息
									remark: suggestion.remark,
									remark1: suggestion.remark1,
									remark2: suggestion.remark2,
									remark3: suggestion.remark3,
									address: suggestion.address,
									// 🆕 添加数据源字段
									dataSource: suggestion.dataSource
								});
							}
						}
					}
				});
			});

			// 过滤掉没有车牌的车主组，并对车牌进行全局去重
			const filteredGroups = Object.values(groups).filter(group => group.plates.length > 0);

			// 🆕 全局去重：确保整个结果中没有重复车牌
			const seenPlates = new Set();
			const deduplicatedGroups = [];

			filteredGroups.forEach(group => {
				const uniquePlates = group.plates.filter(plate => {
					const plateKey = plate.plateNumber.toUpperCase();
					if (seenPlates.has(plateKey)) {
						return false; // 已存在，跳过
					}
					seenPlates.add(plateKey);
					return true; // 不存在，保留
				});

				if (uniquePlates.length > 0) {
					deduplicatedGroups.push({
						...group,
						plates: uniquePlates
					});
				}
			});

			return deduplicatedGroups;
		},

		// 🆕 总车牌数量
		totalPlateCount() {
			return this.groupedSuggestions.reduce((total, group) => {
				return total + group.plates.length;
			}, 0);
		},

		// 获取车牌识别按钮的状态文本
		recognitionButtonText() {
			if (!this.isRecognitionDisabled) {
				return '识别';
			}

			// 使用响应式的 currentTime 而不是 Date.now()
			const remainingTime = this.disabledUntilTime - this.currentTime;

			if (remainingTime > 0) {
				const minutes = Math.floor(remainingTime / 60000);
				const seconds = Math.floor((remainingTime % 60000) / 1000);
				if (minutes > 0) {
					return `禁用 ${minutes}:${seconds.toString().padStart(2, '0')}`;
				} else {
					return `禁用 ${seconds}秒`;
				}
			}

			return '识别';
		},

	},

	// 页面生命周期
	onLoad() {
		this.initializePage();
	},

	methods: {

		// 启动禁用状态检查定时器
		startDisabledCheckTimer() {
			// 每秒检查一次禁用状态，用于更新按钮文本倒计时
			this.disabledCheckTimer = setInterval(() => {
				if (this.isRecognitionDisabled && this.disabledUntilTime > 0) {
					const now = Date.now();
					// 更新当前时间，触发计算属性重新计算
					this.currentTime = now;

					if (now >= this.disabledUntilTime) {
						// 冷却时间已过，自动解除禁用
						console.log('✅ 冷却时间已过，自动解除识别功能禁用');
						this.isRecognitionDisabled = false;
						this.disabledUntilTime = 0;
						this.failedRecognizeCount = 0;
					}
				}
			}, 1000);
		},

		// 打开车牌识别
		openPlateRecognition() {
			console.log(' [车牌识别] 打开车牌识别弹窗');

			// 检查是否已被禁用以及是否过了冷却时间
			if (this.isRecognitionDisabled) {
				const now = Date.now();
				const remainingTime = this.disabledUntilTime - now;

				if (remainingTime > 0) {
					// 还在冷却时间内
					const minutes = Math.ceil(remainingTime / 60000);
					const seconds = Math.ceil((remainingTime % 60000) / 1000);
					const timeStr = minutes > 0 ? `${minutes}分钟` : `${seconds}秒`;

					uni.showToast({
						title: `识别功能已禁用，请等待${timeStr}后再试`,
						icon: 'none',
						duration: 2500
					});
					return;
				} else {
					// 冷却时间已过，解除禁用
					console.log('✅ 冷却时间已过，解除识别功能禁用');
					this.isRecognitionDisabled = false;
					this.disabledUntilTime = 0;
					this.failedRecognizeCount = 0;
				}
			}

			this.showPlateRecognitionModal = true;
			this.showCamera = false;
			this.recognitionResult = null;
			this.isRecognizing = false;
			this.stopAutoRecognize();
			// 重置失败次数（仅在未禁用时）
			if (!this.isRecognitionDisabled) {
				this.failedRecognizeCount = 0;
			}
		},

		// 关闭车牌识别
		closePlateRecognition() {
			this.showPlateRecognitionModal = false;
			this.showCamera = false;
			this.recognitionResult = null;
			this.isRecognizing = false;
			this.stopAutoRecognize();
			// 只有在未被禁用时才重置失败次数
			if (!this.isRecognitionDisabled) {
				this.failedRecognizeCount = 0;
			}
		},

		// 打开摄像头
		openCamera() {
			this.showCamera = true;
			// 延迟启动自动识别，等待摄像头初始化
			setTimeout(() => {
				this.startAutoRecognize();
			}, 1000);
		},

		// 关闭摄像头
		closeCamera() {
			this.stopAutoRecognize();
			this.showCamera = false;
		},

		// 开启自动识别
		startAutoRecognize() {
			if (this.autoRecognize) return;

			this.autoRecognize = true;
			this.autoRecognizeCount = 0;
			console.log(' 开启自动识别模式');

			// 立即开始第一次识别
			this.performAutoRecognize();
		},

		// 停止自动识别
		stopAutoRecognize() {
			if (!this.autoRecognize) return;

			this.autoRecognize = false;
			if (this.autoRecognizeTimer) {
				clearTimeout(this.autoRecognizeTimer);
				this.autoRecognizeTimer = null;
			}
			console.log('⏹️ 停止自动识别模式');
		},

		// 切换自动识别
		toggleAutoRecognize() {
			if (this.autoRecognize) {
				this.stopAutoRecognize();
			} else {
				this.startAutoRecognize();
			}
		},

		// 自动填充识别到的车牌号码到虚拟键盘
		autoFillPlateNumber(plateNumber) {
			console.log(' 自动填充车牌号码:', plateNumber);

			//  修复：先清空之前的业主信息和表单数据
			this.ownerInfo = null;
			this.formData.enterTime = null;
			this.formData.leaveTime = null;
			this.formData.appointmentTime = null;
			this.selectedAppointmentId = null;
			this.showViolationRecords = false;

			// 只有8位车牌才切换到新能源模式，7位切换到普通模式
			if (plateNumber && plateNumber.length === 8) {
				// 8位车牌，切换到新能源模式
				this.isNewEnergyMode = true;
				this.plateColor = 'green';
				// 直接设置车牌颜色相关属性（不调用changeColor避免清空内容）
				this.carColor = 'linear-gradient(to bottom, #d0f1e4, #6ad390)';
				this.selectedColor = 'linear-gradient(to bottom, #d0f1e4, #6ad390)';
				this.carMax = false;
				this.maxCarLenght = 8;
				this.plateType = "newEnergy";
				this.borderBgColor = "#000";
				this.dynamicWidth = 22;
				this.textColor = '#000';
				// 初始化为8位数组
				this.plateChars = ['', '', '', '', '', '', '', ''];
				console.log(' 检测到8位车牌，切换到新能源模式');
			} else {
				//  修复：7位车牌，强制切换到蓝牌模式（默认油车）
				this.isNewEnergyMode = false;
				this.plateColor = 'blue';
				this.carColor = 'linear-gradient(to bottom, #216fef, #0c4fc5)';
				this.selectedColor = 'linear-gradient(to bottom, #216fef, #0c4fc5)';
				this.carMax = true;
				this.maxCarLenght = 7;
				this.plateType = "blue";
				this.borderBgColor = "#fff";
				this.dynamicWidth = 25;
				this.textColor = '#fff';
				// 初始化为7位数组
				this.plateChars = ['', '', '', '', '', '', ''];
				console.log(' 检测到7位车牌，切换到蓝牌模式');
			}

			this.currentIndex = 0;

			// 逐个填充字符
			if (plateNumber) {
				for (let i = 0; i < plateNumber.length && i < 8; i++) {
					this.$set(this.plateChars, i, plateNumber.charAt(i));
				}

				// 设置当前位置为最后一个字符的位置（如果车牌已填满）或下一个空位
				const maxLength = this.isNewEnergyMode ? 8 : 7;
				if (plateNumber.length >= maxLength) {
					// 车牌已填满，设置光标到最后一个字符位置
					this.currentIndex = maxLength - 1;
				} else {
					// 车牌未填满，设置光标到下一个空位
					this.currentIndex = plateNumber.length;
				}
			}

			// 更新表单数据
			this.updatePlateNumber();

			// 根据当前位置选择合适的键盘
			this.selectCharPosition(this.currentIndex);

			// 关闭车牌识别弹窗
			this.showRecognizeDialog = false;

			console.log('✅ 车牌号码填充完成:', this.formData.plateNumber);
		},

		// ========== 页面初始化 ==========
		async initializePage() {
			// 🔧 调试：检查所有可能的用户信息存储键
			console.log('🔍 [页面初始化] 开始检查用户信息存储...');

			// 检查所有可能的存储键
			const possibleKeys = ['userInfo', 'user', 'loginInfo', 'patrolInfo', 'ms_username', 'login_name'];
			const allStorageData = {};

			possibleKeys.forEach(key => {
				try {
					const value = uni.getStorageSync(key);
					if (value) {
						allStorageData[key] = value;
						console.log(`✅ [页面初始化] 找到存储键 "${key}":`, value);
					} else {
						console.log(`❌ [页面初始化] 存储键 "${key}" 为空或不存在`);
					}
				} catch (e) {
					console.log(`❌ [页面初始化] 读取存储键 "${key}" 失败:`, e.message);
				}
			});

			console.log('📋 [页面初始化] 所有存储数据:', allStorageData);

			// 获取用户信息和车场名称，如果为空则使用默认值
			const userInfo = uni.getStorageSync('userInfo');
			this.currentPark = userInfo?.yardName ||
				userInfo?.patrolData?.yardName ||
				userInfo?.patrolData?.community || // 巡查员负责的小区
				userInfo?.userInfo?.yardName ||
				userInfo?.userInfo?.community || // 巡查员负责的小区
				userInfo?.ownername ||
				userInfo?.realName ||
				userInfo?.community || // 直接的community字段
				'万象上东';
			console.log('🏢 [页面初始化] 当前车场名称:', this.currentPark);
			console.log('🔍 [页面初始化] 用户信息结构:', userInfo);

			// 🔧 如果userInfo为空，尝试从其他存储键获取
			if (!userInfo) {
				console.log('⚠️ [页面初始化] userInfo为空，尝试从其他存储键获取用户信息');
				this.tryGetUserInfoFromOtherSources();
			}

			// 🆕 检查并导入月票车数据
			await this.checkAndImportMonthTicketData();
		},

		// 🔧 尝试从其他来源获取用户信息
		tryGetUserInfoFromOtherSources() {
			console.log('🔍 [页面初始化] 尝试从其他来源获取用户信息...');

			// 尝试从localStorage获取（兼容web端）
			try {
				if (typeof localStorage !== 'undefined') {
					const localUserInfo = localStorage.getItem('userInfo') ||
						localStorage.getItem('user') ||
						localStorage.getItem('loginInfo');
					if (localUserInfo) {
						console.log('✅ [页面初始化] 从localStorage获取到用户信息:', localUserInfo);
						try {
							const parsedUserInfo = JSON.parse(localUserInfo);
							// 存储到uni.storage中
							uni.setStorageSync('userInfo', parsedUserInfo);
							console.log('✅ [页面初始化] 已将localStorage中的用户信息同步到uni.storage');
						} catch (e) {
							console.log('❌ [页面初始化] 解析localStorage用户信息失败:', e.message);
						}
					}
				}
			} catch (e) {
				console.log('❌ [页面初始化] 访问localStorage失败:', e.message);
			}
		},

		// 🔧 从所有可能的来源获取用户信息（增强版）
		getUserInfoFromAllSources() {
			console.log('🔍 [获取用户信息] 从所有可能的来源获取用户信息...');

			// 📋 扩展的存储键列表，包含我们新添加的键
			const allStorageKeys = [
				'userInfo', 'user', 'loginInfo', 'patrolInfo', 'managerInfo',
				'communityInfo', 'yardInfo', 'parkInfo', 'scannedAddressInfo'
			];

			// 1. 尝试从uni.storage获取所有可能的键
			for (const key of allStorageKeys) {
				try {
					const userInfo = uni.getStorageSync(key);
					if (userInfo && typeof userInfo === 'object') {
						console.log(`✅ [获取用户信息] 从uni.storage获取到${key}:`, userInfo);

						// 🏠 如果是管家信息，获取额外的小区信息
						if (key === 'managerInfo' || key === 'communityInfo' || key === 'yardInfo') {
							const mainUserInfo = uni.getStorageSync('userInfo') || {};
							const enhancedUserInfo = {
								...mainUserInfo,
								...userInfo,
								yardName: userInfo.community || userInfo.yardName || userInfo.communityName ||
									mainUserInfo.yardName || '四季上东',
								userName: userInfo.username || userInfo.butlerName || mainUserInfo.userName ||
									'用户',
								userInfo: {
									...mainUserInfo.userInfo,
									...userInfo,
									managerInfo: userInfo,
									community: userInfo.community || userInfo.yardName || userInfo.communityName ||
										'四季上东',
									yardName: userInfo.community || userInfo.yardName || userInfo.communityName ||
										'四季上东'
								}
							};
							console.log(`🏠 [获取用户信息] 增强的用户信息（包含${key}）:`, enhancedUserInfo);
							return enhancedUserInfo;
						}

						// 确保返回的用户信息包含必要的字段
						if (!userInfo.yardName && !userInfo.userName) {
							userInfo.yardName = userInfo.yardName || userInfo.community || userInfo.userInfo
								?.community || userInfo.userInfo?.yardName || '四季上东';
							userInfo.userName = userInfo.userName || userInfo.username || userInfo.userInfo
								?.username || userInfo.roleText || '用户';
						}

						return userInfo;
					}
				} catch (e) {
					console.log(`❌ [获取用户信息] 读取${key}失败:`, e.message);
				}
			}

			// 2. 尝试从localStorage获取（兼容web端）
			try {
				if (typeof localStorage !== 'undefined') {
					for (const key of allStorageKeys) {
						const localUserInfo = localStorage.getItem(key);
						if (localUserInfo) {
							console.log(`✅ [获取用户信息] 从localStorage获取到${key}:`, localUserInfo);
							try {
								const parsedUserInfo = JSON.parse(localUserInfo);
								// 存储到uni.storage中
								uni.setStorageSync('userInfo', parsedUserInfo);
								console.log('✅ [获取用户信息] 已将localStorage中的用户信息同步到uni.storage');
								return parsedUserInfo;
							} catch (e) {
								console.log('❌ [获取用户信息] 解析localStorage用户信息失败:', e.message);
							}
						}
					}
				}
			} catch (e) {
				console.log('❌ [获取用户信息] 访问localStorage失败:', e.message);
			}

			// 3. 🆕 尝试组合多个存储键的信息
			try {
				const userInfo = uni.getStorageSync('userInfo') || {};
				const managerInfo = uni.getStorageSync('managerInfo') || {};
				const communityInfo = uni.getStorageSync('communityInfo') || {};
				const scannedInfo = uni.getStorageSync('scannedAddressInfo') || {};

				if (Object.keys(userInfo).length > 0 || Object.keys(managerInfo).length > 0 ||
					Object.keys(communityInfo).length > 0 || Object.keys(scannedInfo).length > 0) {

					const combinedUserInfo = {
						...userInfo,
						yardName: userInfo.yardName || managerInfo.community || communityInfo.yardName ||
							scannedInfo.community || communityInfo.name || '四季上东',
						userName: userInfo.userName || managerInfo.username || managerInfo.butlerName ||
							scannedInfo.butlerName || userInfo.username || '用户',
						userInfo: {
							...userInfo.userInfo,
							managerInfo: managerInfo,
							community: managerInfo.community || communityInfo.yardName || scannedInfo.community ||
								'四季上东',
							yardName: managerInfo.community || communityInfo.yardName || scannedInfo.community ||
								'四季上东'
						}
					};

					console.log('🔧 [获取用户信息] 组合多个存储键的信息:', combinedUserInfo);
					return combinedUserInfo;
				}
			} catch (e) {
				console.log('❌ [获取用户信息] 组合存储信息失败:', e.message);
			}

			console.log('❌ [获取用户信息] 未找到任何用户信息');
			return null;
		},

		// 🆕 检查并导入月票车数据
		async checkAndImportMonthTicketData() {
			try {
				console.log('🔍 [月票车数据] 开始检查并导入月票车数据...');

				// 获取当前车场名称
				const parkName = this.currentPark;
				if (!parkName || parkName === '万象上东') {
					console.log('⚠️ [月票车数据] 车场名称为空或默认值，跳过导入');
					return;
				}

				console.log('🏢 [月票车数据] 当前车场:', parkName);

				// 检查车场数据是否已存在
				const existsResponse = await violationApi.checkParkDataExists(parkName);
				console.log('🔍 [月票车数据] 检查结果:', existsResponse);

				if (existsResponse && existsResponse.exists) {
					console.log('✅ [月票车数据] 车场数据已存在，无需导入');
					return;
				}

				console.log('📥 [月票车数据] 车场数据不存在，开始批量导入...');

				// 显示导入提示
				uni.showLoading({
					title: '正在导入月票车数据...',
					mask: true
				});

				// 执行批量导入
				const importResponse = await violationApi.batchImportParkData(parkName);
				console.log('📥 [月票车数据] 导入结果:', importResponse);

				uni.hideLoading();

				if (importResponse && importResponse.success) {
					const importCount = importResponse.importCount || 0;
					console.log(`✅ [月票车数据] 成功导入 ${importCount} 条月票车数据`);

					// 显示成功提示
					uni.showToast({
						title: `已导入${importCount}条月票车数据`,
						icon: 'success',
						duration: 2000
					});
				} else {
					console.log('⚠️ [月票车数据] 导入失败或无数据需要导入');

					// 显示提示
					uni.showToast({
						title: '月票车数据导入完成',
						icon: 'none',
						duration: 2000
					});
				}

			} catch (error) {
				console.error('❌ [月票车数据] 检查并导入数据失败:', error);

				uni.hideLoading();

				// 导入失败不影响页面正常使用，只记录错误
				console.log('⚠️ [月票车数据] 导入失败，但不影响页面功能');
			}
		},


		// 测试原有搜索接口
		async testOriginalSearchAPI() {
			this.addTestResult('开始测试原有搜索接口...', 'originalSearch', true);

			try {
				const startTime = Date.now();
				const response = await ownerApi.getPlateSuggestions(this.testParams.keyword, {
					page: 1,
					size: 20
				});
				const endTime = Date.now();

				this.addTestResult(
					`原有搜索成功！耗时: ${endTime - startTime}ms，找到 ${response.data ? response.data.length : 0} 条记录`,
					'originalSearch',
					true,
					response
				);

			} catch (error) {
				this.addTestResult(
					`原有搜索失败：${error.message || error}`,
					'originalSearch',
					false,
					error
				);
			}
		},

		// 测试车辆详情接口
		async testVehicleDetailsAPI() {
			if (!this.testParams.keyword) {
				this.addTestResult('请输入车牌号', 'vehicleDetails', false);
				return;
			}

			this.addTestResult('开始测试车辆详情接口...', 'vehicleDetails', true);

			try {
				const startTime = Date.now();
				const response = await violationApi.getVehicleDetails(this.testParams.keyword);
				const endTime = Date.now();

				this.addTestResult(
					`车辆详情获取成功！耗时: ${endTime - startTime}ms`,
					'vehicleDetails',
					true,
					response
				);

			} catch (error) {
				this.addTestResult(
					`车辆详情获取失败：${error.message || error}`,
					'vehicleDetails',
					false,
					error
				);
			}
		},

		// 添加测试结果
		addTestResult(message, apiName, success, data = null) {
			const result = {
				timestamp: new Date().toLocaleTimeString(),
				apiName: apiName,
				message: message,
				success: success,
				data: data
			};

			this.apiTestResults.unshift(result);

			// 限制结果数量
			if (this.apiTestResults.length > 10) {
				this.apiTestResults = this.apiTestResults.slice(0, 10);
			}
		},

		// 检查数据库状态
		async checkDatabaseStatus() {
			this.addTestResult('开始检查数据库状态...', 'databaseCheck', true);

			try {
				// 测试一些常见的车牌号前缀
				const testKeywords = ['京', '沪', '粤', '川', '鲁', '苏', '浙', '豫', '冀', '晋'];
				let totalRecords = 0;
				let successfulQueries = 0;

				for (const keyword of testKeywords) {
					try {
						const response = await violationApi.searchMonthTicketVehicles({
							keyword: keyword,
							parkName: '',
							onlyInPark: false,
							page: 1,
							size: 1
						});

						if (response && response.total > 0) {
							totalRecords += response.total;
							successfulQueries++;
						}
					} catch (error) {
						// 忽略单个查询错误
					}
				}

				this.addTestResult(
					`数据库检查完成！\n` +
					`- 测试了 ${testKeywords.length} 个常见车牌前缀\n` +
					`- 有数据的前缀: ${successfulQueries} 个\n` +
					`- 总记录数约: ${totalRecords} 条\n` +
					`${totalRecords === 0 ? '⚠️ 数据库中可能没有车辆数据，建议联系管理员添加测试数据' : '✅ 数据库中有车辆数据'}`,
					'databaseCheck',
					true, {
					totalRecords,
					successfulQueries,
					testKeywords: testKeywords.length
				}
				);

			} catch (error) {
				this.addTestResult(
					`数据库检查失败：${error.message || error}`,
					'databaseCheck',
					false,
					error
				);
			}
		},

		// 清空测试结果
		clearTestResults() {
			this.apiTestResults = [];
			this.addTestResult('测试结果已清空', 'system', true);
		},

		// 格式化测试数据
		formatTestData(data) {
			if (!data) return '';
			try {
				// 只显示关键信息，避免过长
				if (data.records && Array.isArray(data.records)) {
					return `找到 ${data.records.length} 条记录，总计 ${data.total || 0} 条`;
				} else if (data.data && Array.isArray(data.data)) {
					return `找到 ${data.data.length} 条记录`;
				} else if (typeof data === 'object') {
					return `数据类型: ${Object.keys(data).join(', ')}`;
				}
				return JSON.stringify(data).substring(0, 100) + '...';
			} catch (e) {
				return String(data).substring(0, 100);
			}
		},

		// ========== 原有方法 ==========

		// 返回上一页
		goBack() {
			// 检查是否有未保存的数据
			if (this.hasUnsavedData()) {
				uni.showModal({
					title: '提示',
					content: '您有未保存的数据，确定要离开吗？',
					success: (res) => {
						if (res.confirm) {
							this.navigateBack();
						}
					}
				});
			} else {
				this.navigateBack();
			}
		},

		// 安全的返回导航
		navigateBack() {
			const pages = getCurrentPages();
			if (pages.length > 1) {
				// 如果有上一页，正常返回
				uni.navigateBack();
			} else {
				// 如果是第一个页面，跳转到首页
				uni.reLaunch({
					url: '/pagesE/violation/violation'
				});
			}
		},

		// 检查是否有未保存的数据
		hasUnsavedData() {
			return this.formData.plateNumber ||
				this.formData.violationType ||
				this.formData.location ||
				this.formData.description ||
				this.formData.photos.length > 0 ||
				this.formData.shouldBlacklist ||
				this.formData.blacklistReason;
		},

		// ============ 搜索弹窗相关方法 ============
		// 打开车牌搜索弹窗
		openPlateSearchModal() {
			this.showPlateSearchModal = true;
			this.plateSearchKeyword = this.formData.plateNumber;
			this.plateFocused = true;
			// 如果已有关键词，立即搜索
			if (this.plateSearchKeyword) {
				this.searchPlates();
			}
		},

		// 关闭车牌搜索弹窗
		closePlateSearchModal() {
			this.showPlateSearchModal = false;
			this.plateSearchKeyword = '';
			this.plateSuggestions = [];
			this.plateFocused = false;
			this.showLoadMoreBtn = false;
			this.currentSearchPage = 1;
			this.totalSearchResults = 0;
		},



		// 车牌搜索输入（优化版本）
		onPlateSearchInput() {
			// 清除之前的定时器
			if (this.plateSearchTimer) {
				clearTimeout(this.plateSearchTimer);
			}

			// 设置新的搜索定时器（优化防抖延迟）
			this.plateSearchTimer = setTimeout(() => {
				this.searchPlates();
			}, 200);
		},



		// 🆕 执行车牌搜索 - 使用本地数据库接口（替代外部API）
		async searchPlates() {
			console.log('🔍 [本地数据搜索] 开始搜索车牌信息，关键词:', this.plateSearchKeyword);

			if (!this.plateSearchKeyword || this.plateSearchKeyword.trim().length === 0) {
				console.log('⚠️ [本地数据搜索] 搜索关键词为空，不执行搜索');
				this.showPlateSuggestions = false;
				this.plateSuggestions = [];
				return;
			}

			// 🔧 调试：检查用户信息和车场名称
			let userInfo = uni.getStorageSync('userInfo');

			// 🔧 如果userInfo为空，尝试从其他来源获取
			if (!userInfo) {
				console.log('⚠️ [本地数据搜索] userInfo为空，尝试从其他来源获取');
				userInfo = this.getUserInfoFromAllSources();
			}

			// 🔧 尝试多个可能的字段获取车场名称，优先使用巡查员相关信息
			const parkName = userInfo?.yardName ||
				userInfo?.patrolData?.yardName ||
				userInfo?.patrolData?.community || // 巡查员负责的小区
				userInfo?.userInfo?.yardName ||
				userInfo?.userInfo?.community || // 巡查员负责的小区
				userInfo?.parkName ||
				userInfo?.parkingLotName ||
				userInfo?.ownername ||
				userInfo?.realName ||
				userInfo?.community || // 直接的community字段
				this.currentPark; // 🆕 默认停车场，确保搜索功能正常工作
			this.performActualSearch(parkName);
		},

		// 🆕 实际执行搜索的方法
		async performActualSearch(parkName) {
			console.log('🏢 [智能搜索] 最终使用的车场名称:', parkName);
			await this.executeSearch(parkName);
		},

		// 🆕 提取搜索执行逻辑 - 改为使用本地数据库 + 预约数据
		async executeSearch(parkName) {
			this.isSearching = true;
			this.usingSmartSearch = false; // 🆕 重置搜索类型标识
			try {
				// 重置分页信息
				this.currentSearchPage = 1;
				this.showLoadMoreBtn = false;

				console.log('🚀 [综合搜索] 同时查询月票车和预约车数据...');

				// 🔧 临时测试：对比所有可用的搜索接口
				console.log('🧪 [测试对比] 开始对比所有搜索接口...');
				const testResults = {};

				try {
					// 1. 测试车主搜索接口 (owners.plateSuggestions)
					const ownerSearchTest = await ownerApi.getPlateSuggestions(this.plateSearchKeyword, {
						page: 1,
						size: 200
					}).catch(err => {
						console.warn('🧪 [测试1] 车主搜索接口失败:', err);
						return null;
					});

					testResults.ownerSearch = ownerSearchTest;
					console.log('🧪 [测试1] 车主搜索接口 (/parking/violations/owners/plate-suggestions)');
					console.log('🧪 [测试1] 结果:', JSON.stringify(ownerSearchTest, null, 2));
					// if (ownerSearchTest && ownerSearchTest.data) {
					// 	console.log(
					// 		`🧪 [测试1] 返回 ${Array.isArray(ownerSearchTest.data) ? ownerSearchTest.data.length : '非数组'} 条记录`
					// 	);
					// }

					// 2. 测试月票车获取车牌建议接口
					const monthTicketSuggestionsTest = await violationApi.getMonthTicketPlateSuggestions(this
						.plateSearchKeyword, parkName, 200).catch(err => {
							console.warn('🧪 [测试2] 月票车建议接口失败:', err);
							return null;
						});

					testResults.monthTicketSuggestions = monthTicketSuggestionsTest;
					console.log('🧪 [测试2] 月票车建议接口 (/parking/monthTicket/getPlateSuggestions)');
					console.log('🧪 [测试2] 结果:', JSON.stringify(monthTicketSuggestionsTest, null, 2));
					// if (monthTicketSuggestionsTest && monthTicketSuggestionsTest.data) {
					// 	console.log(
					// 		`🧪 [测试2] 返回 ${Array.isArray(monthTicketSuggestionsTest.data) ? monthTicketSuggestionsTest.data.length : '非数组'} 条记录`
					// 	);
					// }

					// 3. 测试本地车牌建议接口
					const localSuggestionsTest = await violationApi.getLocalPlateSuggestions(this
						.plateSearchKeyword, parkName, 200).catch(err => {
							console.warn('🧪 [测试3] 本地建议接口失败:', err);
							return null;
						});

					testResults.localSuggestions = localSuggestionsTest;
					console.log('🧪 [测试3] 数据data', localSuggestionsTest);
					// console.log('🧪 [测试3] 本地建议接口 (/parking/monthTicket/getLocalPlateSuggestions)');
					// console.log('🧪 [测试3] 结果:', JSON.stringify(localSuggestionsTest, null, 2));

					// 汇总测试结果
					console.log('🧪 [测试汇总] 所有接口测试完成');
					console.log('🧪 [测试汇总] 结果统计:');
					Object.keys(testResults).forEach(key => {
						const result = testResults[key];
						console.log('🧪 [测试汇总] ', result);
						if (result && result.data) {
							const count = Array.isArray(result.data) ? result.data.length :
								(result.data.records ? result.data.records.length : '未知格式');
							console.log(`   - ${key}: ${count} 条记录`);
						} else {
							console.log(`   - ${key}: 无数据或失败`);
						}
					});

				} catch (error) {
					console.error('🧪 [测试对比] 测试过程出错:', error);
				}

				// 🆕 同时查询月票车数据和预约数据
				const [monthTicketResponse, appointmentResponse] = await Promise.all([
					// 查询月票车数据
					violationApi.searchLocalData({
						keyword: this.plateSearchKeyword,
						parkName: parkName,
						page: 1,
						size: 1000
					}).catch(error => {
						console.warn('⚠️ [月票车搜索] 失败:', error);
						return null;
					}),
					// 查询预约车数据
					appointmentAPI.getAppointmentPlateNumber(this.plateSearchKeyword).catch(error => {
						console.warn('⚠️ [预约车搜索] 失败:', error);
						return null;
					})
				]);

				// console.log('📥 [月票车搜索] 响应:', JSON.stringify(monthTicketResponse, null, 2));
				// console.log('📥 [预约车搜索] 响应:', JSON.stringify(appointmentResponse, null, 2));

				// 🔧 详细分析月票车搜索响应
				if (monthTicketResponse) {
					if (monthTicketResponse) {
						console.log('🔍 [月票车搜索] data字段类型:', typeof monthTicketResponse);
						console.log('🔍 [月票车搜索] 是否有records字段:', !!monthTicketResponse.records);
						if (monthTicketResponse.records) {
							console.log('🔍 [月票车搜索] records类型:', typeof monthTicketResponse.records);
							console.log('🔍 [月票车搜索] 是否为数组:', Array.isArray(monthTicketResponse.records));
							console.log('🔍 [月票车搜索] records长度:', monthTicketResponse.records.length);
							if (monthTicketResponse.total !== undefined) {
								console.log('🔍 [月票车搜索] 总记录数(total):', monthTicketResponse.total);
							}
							if (monthTicketResponse.records.length > 0) {
								console.log('🔍 [月票车搜索] 第一条记录车牌:', monthTicketResponse.records[0]
									.plateNumber);
							}
						}
					}
					console.log('🔍 [月票车搜索] 响应分析结束');
				} else {
					console.log('⚠️ [月票车搜索] 响应为空或null');
				}

				// 合并搜索结果
				let allResults = [];

				// 处理月票车数据
				if (monthTicketResponse && monthTicketResponse.records && Array
					.isArray(monthTicketResponse.records)) {
					const monthTicketResults = monthTicketResponse.records.map(item => ({
						plateNumber: item.plateNumber,
						ownerName: item.ownerName,
						ownerPhone: item.ownerPhone,
						ownerId: item.ownerId || item.monthTicketId || null,
						ticketName: item.ticketName,
						parkingSpot: item.parkingSpot,
						validStatus: item.validStatus,
						isFrozen: item.isFrozen,
						isInPark: item.isInPark,
						appointmentCount: item.appointmentCount || 0,
						violationCount: item.violationCount || 0,
						creditScore: item.creditScore || 100,
						remark: item.remark,
						remark1: item.remark1,
						remark2: item.remark2,
						remark3: item.remark3,
						address: item.address,
						dataSource: '月票车' // 标记数据来源
					}));
					allResults = [...allResults, ...monthTicketResults];
					console.log(`✅ [月票车搜索] 找到 ${monthTicketResults.length} 条记录`);
				}

				// 处理预约车数据
				if (appointmentResponse && appointmentResponse.data) {
					// 处理嵌套的数据结构：appointmentResponse.data.data 或 appointmentResponse.data
					const appointmentData = appointmentResponse.data.data.data;
					if (Array.isArray(appointmentData)) {
						const appointmentResults = appointmentData
							.filter(item => {
								// 过滤掉已存在的车牌号（避免重复）
								const plateNumber = item.platenumber;
								return plateNumber && !allResults.some(existing => existing.plateNumber ===
									plateNumber);
							})
							.map(item => ({
								plateNumber: item.platenumber,
								ownerName: item.ownername || '',
								ownerPhone: item.ownerphone || '',
								// 🔧 修复：使用正确的车主ID字段名称，尝试多种可能的字段名
								ownerId: item.ownerid || item.owner_id || item.ownerId || item.visitorid ||
									item.visitor_id || null,
								// 🔧 修复：保存预约记录ID用于关联
								appointmentId: item.id || item.appointmentId || null,
								// ticketName: null, // 预约车不设置ticketName，这是月票车专用字段
								parkingSpot: `${item.building}栋${item.units}单元${item.room}室`,
								validStatus: item.status || '有效',
								isFrozen: false,
								isInPark: item.venuestatus === '已入场',
								appointmentCount: 1, // 预约车默认有1个预约
								violationCount: 0,
								creditScore: 100,
								remark: item.visitreason || '预约车辆',
								address: `${item.province}${item.city}${item.district}${item.community}`,
								dataSource: '预约车', // 标记数据来源
								// 🔧 修复：添加从预约表映射的时间字段，支持多种字段名变体
								enterTime: item.arrivedate || item.arrive_date || item.arriveDate || item
									.entertime || item.enter_time || null, // 进场时间对应arrivedate
								leaveTime: item.leavedate || item.leave_date || item.leaveDate || item
									.leavetime || item.leave_time || null, // 离场时间对应leavedate
								appointmentTime: item.recorddate || item.record_date || item.visitdate ||
									item.visit_date || null, // 预约时间
								// 预约相关信息
								visitorName: item.ownername,
								visitorPhone: item.visitorphone,
								appointmentType: item.appointtype,
								carType: item.cartype,
								auditStatus: item.auditstatus,
								auditDate: item.auditdate,
								recordDate: item.recorddate,
								venueStatus: item.venuestatus,
								orderNumber: item.ordernumber,
								refuseReason: item.refusereason,
								openid: item.openid,
								purpose: item.visitreason
							}));
						console.log('🔍 [预约车数据映射] 映射后的数据:', appointmentResults);
						allResults = [...allResults, ...appointmentResults];
						//输出allResults
						console.log('🔍 [预约车搜索] 找到的所有结果:', allResults);
						console.log(`✅ [预约车搜索] 找到 ${appointmentResults.length} 条记录`);
					}
				}

				// 设置合并后的搜索结果
				if (allResults.length > 0) {
					this.plateSuggestions = allResults;
					this.totalSearchResults = allResults.length;
					this.showLoadMoreBtn = false;
					this.showPlateSuggestions = true;
					this.usingSmartSearch = true;

					console.log(`✅ [综合搜索] 总共找到 ${allResults.length} 条记录`);
					console.log(`   - 月票车: ${allResults.filter(r => r.dataSource === '月票车').length} 条`);
					console.log(`   - 预约车: ${allResults.filter(r => r.dataSource === '预约车').length} 条`);

					// 如果结果较少，补充使用原有搜索接口
					if (allResults.length < 5) {
						console.log('🔄 [综合搜索] 结果较少，补充原有搜索');
						await this.supplementWithOwnerSearch();
					}
				} else {
					console.log('🔄 [综合搜索] 无结果，使用备用搜索');
					this.usingSmartSearch = false;
					await this.fallbackSearchInModal();
				}

			} catch (error) {
				console.error('❌ [综合搜索] 搜索失败，错误详情:', error);
				console.error('❌ [综合搜索] 错误类型:', error.name);
				console.error('❌ [综合搜索] 错误消息:', error.message);
				console.error('❌ [综合搜索] 错误状态:', error.status || error.statusCode);
				console.log('🔄 [综合搜索] 自动切换到备用搜索');
				this.usingSmartSearch = false;
				await this.fallbackSearchInModal();
			} finally {
				this.isSearching = false;
			}
		},

		// 🆕 补充使用原有搜索接口（当智能搜索结果较少时）
		async supplementWithOwnerSearch() {
			try {
				console.log('🔄 [补充搜索] 使用原有接口补充搜索结果');
				const response = await ownerApi.getPlateSuggestions(this.plateSearchKeyword, {
					page: 1,
					size: 20
				});

				if (response && response.data && Array.isArray(response.data)) {
					// 合并搜索结果，去重
					const existingPlates = this.plateSuggestions.map(item => item.plateNumber);
					const additionalSuggestions = response.data
						.filter(item => {
							const plateNumber = item.plateNumber || item.plate_number || item.plate;
							return !existingPlates.includes(plateNumber);
						})
						.map(item => ({
							plateNumber: item.plateNumber || item.plate_number || item.plate,
							ownerName: item.ownerName || item.owner_name || item.name,
							ownerId: item.ownerId || item.owner_id || item.id,
							appointmentCount: 0
						}));

					this.plateSuggestions = [...this.plateSuggestions, ...additionalSuggestions];
					console.log(`✅ [补充搜索] 补充了 ${additionalSuggestions.length} 个结果`);
				}
			} catch (error) {
				console.error('❌ [补充搜索] 失败:', error);
			}
		},

		// 🆕 备用搜索方法（当智能搜索无结果时）
		async fallbackSearchInModal() {
			try {
				console.log('🔄 [备用搜索] 使用原有搜索接口 ownerApi.getPlateSuggestions');
				console.log('🔄 [备用搜索] 搜索关键词:', this.plateSearchKeyword);
				const response = await ownerApi.getPlateSuggestions(this.plateSearchKeyword, {
					page: 1,
					size: 200
				});

				console.log('🔄 [备用搜索] 原有接口响应:', response);

				if (response && response.data && Array.isArray(response.data)) {
					this.plateSuggestions = response.data.map(item => {
						const plateNumber = item.plateNumber || item.plate_number || item.plate;
						return {
							plateNumber: plateNumber,
							ownerName: item.ownerName || item.owner_name || item.name,
							ownerId: item.ownerId || item.owner_id || item.id,
							appointmentCount: 0
						};
					});

					const totalCount = response.total || response.count || response.data.length;
					this.totalSearchResults = totalCount;
					this.showLoadMoreBtn = totalCount > response.data.length || response.data.length === 200;

					console.log(`✅ [备用搜索] 使用原有接口找到 ${this.plateSuggestions.length} 个结果，总计 ${totalCount} 条`);
					console.log(`⚠️ [备用搜索] 注意：这是备用搜索结果，不是智能搜索！`);

					// 异步获取预约记录条数
					this.loadAppointmentCountsAsync();
				} else {
					this.plateSuggestions = [];
					this.showLoadMoreBtn = false;
					console.log('⚠️ [备用搜索] 无结果');
				}
			} catch (error) {
				console.error('❌ [备用搜索] 失败:', error);
				this.plateSuggestions = [];
				this.showLoadMoreBtn = false;

				uni.showToast({
					title: '搜索失败，请重试',
					icon: 'none',
					duration: 2000
				});
			}
		},

		// 异步加载预约记录条数（已移除预约记录查询功能）
		async loadAppointmentCountsAsync() {
			// 已移除预约记录查询功能
			console.log('预约记录查询功能已移除');
		},



		// 选择车牌建议
		async selectPlateSuggestion(suggestion) {
			this.formData.plateNumber = suggestion.plateNumber;
			this.closePlateSearchModal();

			try {
				// 优先通过车牌查询完整的车主信息（包含 ownerId）
				const owner = await this.getOwnerInfo(this.formData.plateNumber);
				this.ownerInfo = owner || null;
			} catch (e) {
				// 兜底：保留最小信息，避免界面空白
				if (suggestion.ownerName) {
					this.ownerInfo = {
						name: suggestion.ownerName,
						phone: '138****8888',
						address: '某某小区某某号',
						creditScore: Math.floor(Math.random() * 40) + 60
					};
				} else {
					this.ownerInfo = null;
				}
			}

			// 🆕 执行车牌点击处理逻辑
			await this.handlePlateClickLogic(suggestion.plateNumber);
		},

		// 🆕 从分组中选择车牌
		async selectPlateFromGroup(plate, group) {
			this.formData.plateNumber = plate.plateNumber;
			this.closePlateSearchModal();

			try {
				// 优先通过车牌查询完整的车主信息
				const owner = await this.getOwnerInfo(this.formData.plateNumber);

				if (owner) {
					this.ownerInfo = owner;
				} else {
					// 预约车使用完整地址信息
					console.log('🔍 [预约车] 使用完整地址信息:', group);
					// 当API返回null或"车主信息不存在"时，使用分组中的车主信息
					// 🆕 特别处理月票车的车位信息和预约车的地址信息
					let addressInfo = group.address || '未登记';
					if (group.ticketName) {
						// 月票车使用车位信息作为地址
						const parkingSpots = this.getParkingSpots(group);
						if (parkingSpots.length > 0) {
							addressInfo = `车位：${parkingSpots.join('、')}`;
						}
					} else if (group.dataSource === '预约车' && group.address && group.address !== '未登记') {
						// 预约车拼接地址和车位信息
						addressInfo = group.address;
						if (plate.parkingSpot && plate.parkingSpot.trim()) {
							addressInfo += ` ${plate.parkingSpot}`;
						}
					}

					this.ownerInfo = {
						// 🔧 修复：正确设置车主ID，优先使用plate中的ownerId（来自预约数据），如果没有则使用group中的
						ownerId: plate.ownerId || group.ownerId || null,
						monthTicketId: group.ticketName ? (group.ownerId || plate.ownerId) : null, // 月票ID

						name: group.ownerName || '未知车主',
						phone: group.ownerPhone || '未登记',
						address: addressInfo,
						creditScore: group.creditScore || 100,

						// 🆕 月票相关信息
						isMonthlyTicket: !!group.ticketName, // 标记是否为月票车
						isAppointment: !group.ticketName && group.appointmentCount > 0, // 标记是否为预约车
						ticketName: group.ticketName || null,
						parkingSpots: group.ticketName ? this.getParkingSpots(group) : []
					};

					// 🔧 修复：如果是预约车，设置时间信息到表单数据
					if (group.dataSource === '预约车' || plate.dataSource === '预约车') {
						console.log('📅 [预约车时间] 检测到预约车，准备设置时间信息');
						console.log('📅 [预约车数据] plate数据:', plate);
						console.log('📅 [预约车数据] group数据:', group);
						console.log('📅 [预约车时间] 设置预约车时间信息:', {
							enterTime: plate.arrivedate,
							leaveTime: plate.leaveTime,
							appointmentTime: plate.appointmentTime,
							appointmentId: plate.appointmentId || plate.id, // 🆕 重新添加预约记录ID
							ownerId: plate.ownerId || group.ownerId
						});

						// 设置进场时间和离场时间
						if (plate.enterTime) {
							this.formData.enterTime = plate.enterTime;
							console.log('⏰ [预约车时间] 设置进场时间:', plate.enterTime);
						}
						if (plate.leaveTime) {
							this.formData.leaveTime = plate.leaveTime;
							console.log('⏰ [预约车时间] 设置离场时间:', plate.leaveTime);
						}
						if (plate.appointmentTime) {
							this.formData.appointmentTime = plate.appointmentTime;
							console.log('⏰ [预约车时间] 设置预约时间:', plate.appointmentTime);
						}

						// 🆕 保存预约记录ID用于关联
						if (plate.appointmentId || plate.id) {
							this.selectedAppointmentId = plate.appointmentId || plate.id;
							console.log('🔗 [预约记录] 设置预约记录ID:', this.selectedAppointmentId);
						}

						// 🔧 修复：确保预约车的车主ID正确设置
						if (plate.ownerId) {
							if (!this.ownerInfo) this.ownerInfo = {};
							this.ownerInfo.ownerId = plate.ownerId;
							console.log('👤 [预约车主ID] 设置车主ID:', plate.ownerId);
						}
					}
				}
			} catch (e) {
				console.log('🔄 API查询失败，使用分组中的车主信息:', e);
				// 兜底：使用分组中的车主信息
				let addressInfo = group.address || '未登记';
				if (group.ticketName) {
					// 月票车使用车位信息作为地址
					const parkingSpots = this.getParkingSpots(group);
					if (parkingSpots.length > 0) {
						addressInfo = `车位：${parkingSpots.join('、')}`;
					}
				} else if (group.dataSource === '预约车' && group.address && group.address !== '未登记') {
					// 预约车拼接地址和车位信息
					addressInfo = group.address;
					if (plate.parkingSpot && plate.parkingSpot.trim()) {
						addressInfo += ` ${plate.parkingSpot}`;
					}
				}

				this.ownerInfo = {
					// 🔧 修复：正确设置车主ID，优先使用plate中的ownerId（来自预约数据），如果没有则使用group中的
					ownerId: plate.ownerId || group.ownerId || null,
					monthTicketId: group.ticketName ? (group.ownerId || plate.ownerId) : null, // 月票ID

					name: group.ownerName || '未知车主',
					phone: group.ownerPhone || '未登记',
					address: addressInfo,
					creditScore: group.creditScore || 100,

					// 🆕 月票相关信息
					isMonthlyTicket: !!group.ticketName, // 标记是否为月票车
					isAppointment: !group.ticketName && group.appointmentCount > 0, // 标记是否为预约车
					ticketName: group.ticketName || null,
					parkingSpots: group.ticketName ? this.getParkingSpots(group) : []
				};

				// 🔧 修复：如果是预约车，设置时间信息到表单数据（兜底逻辑）
				if (group.dataSource === '预约车' || plate.dataSource === '预约车') {
					console.log('📅 [预约车时间-兜底] 检测到预约车，准备设置时间信息（兜底逻辑）');
					console.log('📅 [预约车数据-兜底] plate数据:', plate);
					console.log('📅 [预约车数据-兜底] group数据:', group);
					console.log('📅 [预约车时间-兜底] 设置预约车时间信息:', {
						enterTime: plate.enterTime,
						leaveTime: plate.leaveTime,
						appointmentTime: plate.appointmentTime,
						ownerId: plate.ownerId || group.ownerId
					});

					// 设置进场时间和离场时间
					if (plate.enterTime) {
						this.formData.enterTime = plate.enterTime;
						console.log('⏰ [预约车时间-兜底] 设置进场时间:', plate.enterTime);
					}
					if (plate.leaveTime) {
						this.formData.leaveTime = plate.leaveTime;
						console.log('⏰ [预约车时间-兜底] 设置离场时间:', plate.leaveTime);
					}
					if (plate.appointmentTime) {
						this.formData.appointmentTime = plate.appointmentTime;
						console.log('⏰ [预约车时间-兜底] 设置预约时间:', plate.appointmentTime);
					}

					// 🆕 保存预约记录ID用于关联（兜底逻辑）
					if (plate.appointmentId || plate.id) {
						this.selectedAppointmentId = plate.appointmentId || plate.id;
						console.log('🔗 [预约记录-兜底] 设置预约记录ID:', this.selectedAppointmentId);
					}

					// 🔧 修复：确保预约车的车主ID正确设置（兜底逻辑）
					if (plate.ownerId) {
						if (!this.ownerInfo) this.ownerInfo = {};
						this.ownerInfo.ownerId = plate.ownerId;
						console.log('👤 [预约车主ID-兜底] 设置车主ID:', plate.ownerId);
					}
				}
			}

			// 🆕 执行车牌点击处理逻辑
			await this.handlePlateClickLogic(plate.plateNumber);

			// 显示选择成功的提示
			const vehicleType = group.ticketName ? '月票车' : (group.appointmentCount > 0 ? '预约车' : '车辆');
			uni.showToast({
				title: `已选择 ${vehicleType} ${plate.plateNumber}`,
				icon: 'success',
				duration: 1500
			});
		},

		// 🆕 判断是否为新能源车牌
		isNewEnergyPlate(plateNumber) {
			if (!plateNumber) return false;
			// 新能源车牌通常为8位，普通车牌为7位
			// 或者以特定字母开头（如D、F等）
			return plateNumber.length === 8 ||
				plateNumber.includes('D') ||
				plateNumber.includes('F');
		},

		// 🆕 获取车牌卡片样式类
		getPlateCardClass(plateNumber) {
			return this.isNewEnergyPlate(plateNumber) ? 'green-energy-card' : 'blue-fuel-card';
		},

		// 🆕 获取车牌类型徽章样式类
		getPlateTypeBadgeClass(plateNumber) {
			return this.isNewEnergyPlate(plateNumber) ? 'green-energy-badge' : 'blue-fuel-badge';
		},

		// 🆕 获取车牌类型文本
		getPlateTypeText(plateNumber) {
			return this.isNewEnergyPlate(plateNumber) ? '新能源' : '燃油车';
		},

		// 🆕 获取车牌号码样式类
		getPlateNumberClass(plateNumber) {
			return this.isNewEnergyPlate(plateNumber) ? 'green-energy-number' : 'blue-fuel-number';
		},

		// 🆕 获取车位信息（从remark字段解析）
		getParkingSpots(group) {
			const spots = [];

			// 检查各种可能的remark字段
			const remarkFields = ['remark', 'remark1', 'remark2', 'remark3'];

			remarkFields.forEach(field => {
				const remarkValue = group[field];
				if (remarkValue && typeof remarkValue === 'string' && remarkValue.trim()) {
					// 去除空白字符并添加到车位列表
					const spot = remarkValue.trim();
					if (spot && !spots.includes(spot)) {
						spots.push(spot);
					}
				}
			});

			return spots;
		},


		// 车牌号输入变化
		async onPlateNumberChange() {
			if (this.formData.plateNumber && this.formData.plateNumber.length >= 7) {
				try {
					// 先查询车主信息
					const ownerInfoResult = await this.getOwnerInfo(this.formData.plateNumber);
					console.log('📋 [车牌号变化] 查询到车主信息:', ownerInfoResult);

					// 立即设置车主信息到页面（使用 $set 强制触发响应式更新）
					this.$set(this, 'ownerInfo', ownerInfoResult);
					console.log('✅ [车牌号变化] 已设置车主信息到 ownerInfo，准备等待100ms让页面渲染');
					
					// 等待一小段时间让 Vue 完成渲染
					await new Promise(resolve => setTimeout(resolve, 100));
					
					// 再次确认 ownerInfo 是否还在
					console.log('🔍 [车牌号变化] 100ms后检查，当前ownerInfo:', this.ownerInfo);

					// 执行车牌点击处理逻辑（当车牌号完整时）
					// 注意：保存车主信息，避免被后续逻辑覆盖
					const savedOwnerInfo = JSON.parse(JSON.stringify(ownerInfoResult)); // 深拷贝
					console.log('💾 [车牌号变化] 保存车主信息副本，准备执行handlePlateClickLogic');
					
					await this.handlePlateClickLogic(this.formData.plateNumber);
					
					console.log('🔍 [车牌号变化] handlePlateClickLogic执行完毕，当前ownerInfo:', this.ownerInfo);
					
					// 强制恢复车主信息（无论是否被清空都恢复）
					if (!this.ownerInfo || JSON.stringify(this.ownerInfo) !== JSON.stringify(savedOwnerInfo)) {
						this.$set(this, 'ownerInfo', savedOwnerInfo);
						this.$forceUpdate();
						console.log('🔄 [车牌号变化] 已强制恢复车主信息:', this.ownerInfo);
					} else {
						console.log('✅ [车牌号变化] ownerInfo正常，无需恢复');
					}
				} catch (error) {
					console.error('❌ [车牌号变化] 处理失败:', error);
					this.$set(this, 'ownerInfo', null);
				}
			} else {
				this.$set(this, 'ownerInfo', null);
			}
		},

		// 获取车主信息 - 调用真实后端API
		async getOwnerInfo(plateNumber) {
			try {
				console.log('🔍 正在查询车主信息:', plateNumber);

				// 调用真实的后端API接口
				const response = await ownerApi.getOwnerByPlate(plateNumber);

				console.log('✅ 车主信息API响应:', response);

				// 确保返回的数据格式符合预期
				if (response) {
					const ownerData = response;
					console.log('👤 原始车主数据:', ownerData);
					const ownerInfo = {
						ownerId: ownerData.ownerId || ownerData.id,
						name: ownerData.name || ownerData.ownerName,
						phone: ownerData.phone || ownerData.phoneNumber,
						address: ownerData.address || ownerData.homeAddress,
						creditScore: ownerData.creditScore || 0,
						ticketName: ownerData.monthTicketName || ownerData.ticket_name || null,
						isMonthlyTicket: !!(ownerData.monthTicketName || ownerData.ticket_name),
						isAppointment: false // 预约信息由 handlePlateClickLogic 填充
					};
					console.log('📋 格式化后的车主信息:', ownerInfo);
					return ownerInfo;
				}

				console.log('⚠️ 未查询到车主信息 - response或response.data为空');
			console.log('⚠️ response存在?', !!response);
				return null;
			} catch (error) {
				console.error('❌ 查询车主信息失败:', error);

				// 如果是网络错误或后端服务不可用，返回null而不是模拟数据
				// 这样可以让调用方知道查询失败了
				return null;
			}
		},

		// ================ 车牌搜索框相关方法 ================

		// 车牌号输入事件
		onPlateNumberInput(e) {
			const value = e.detail.value || e.target.value || '';
			this.formData.plateNumber = value.toUpperCase(); // 转换为大写

			// 清除之前的定时器
			if (this.plateSearchTimer) {
				clearTimeout(this.plateSearchTimer);
			}

			// 防抖搜索（优化延迟时间）
			this.plateSearchTimer = setTimeout(() => {
				this.generatePlateSuggestions(value);
				this.onPlateNumberChange(); // 查询车主信息
			}, 200);
		},

		// 车牌搜索框获得焦点
		onPlateSearchFocus() {
			this.plateFocused = true;
			if (this.formData.plateNumber) {
				this.generatePlateSuggestions(this.formData.plateNumber);
			}
		},

		// 车牌搜索框失去焦点
		onPlateSearchBlur() {
			this.plateFocused = false;
			// 延迟隐藏建议，以便用户可以点击建议项
			setTimeout(() => {
				this.showPlateSuggestions = false;
			}, 200);
		},

		// 清空车牌号
		clearPlateNumber() {
			console.log('清空车牌号被调用');
			this.formData.plateNumber = '';
			this.showPlateSuggestions = false;
			this.ownerInfo = null;

			// 显示清空成功提示
			uni.showToast({
				title: '已清空车牌',
				icon: 'success',
				duration: 1000
			});

			// 强制更新视图
			this.$forceUpdate();
		},

		// 清空位置
		clearLocation() {
			console.log('清空位置被调用');
			this.formData.location = '';

			// 显示清空成功提示
			uni.showToast({
				title: '已清空位置',
				icon: 'success',
				duration: 1000
			});

			// 强制更新视图
			this.$forceUpdate();
		},

		// 🆕 生成车牌搜索建议 - 使用本地数据库接口
		async generatePlateSuggestions(keyword) {
			if (!keyword || keyword.length < 1) {
				this.showPlateSuggestions = false;
				this.plateSuggestions = [];
				return;
			}

			try {
				console.log('🔍 [本地车牌搜索] 搜索关键词:', keyword);

				// 🆕 优先使用本地数据库搜索接口
				const response = await violationApi.getLocalPlateSuggestions(
					keyword,
					this.currentPark || '', // 传入当前车场
					10 // 限制返回数量
				);

				console.log('✅ [本地车牌搜索] 搜索结果:', response);

				// 🔧 修复数据格式处理：检查 response.data 而不是直接检查 response
				if (response && response.data && Array.isArray(response.data)) {
					// 处理本地数据库搜索结果
					const suggestions = response.data.map(item => ({
						plateNumber: item.plateNumber,
						ownerName: item.ownerName,
						ownerId: item.ownerId,
						ticketName: item.ticketName,
						parkingSpot: item.parkingSpot,
						validStatus: item.validStatus,
						isFrozen: item.isFrozen,
						appointmentCount: item.appointmentCount || 0,
						violationCount: item.violationCount || 0
					}));

					this.plateSuggestions = suggestions;
					this.showPlateSuggestions = suggestions.length > 0;

					console.log(`✅ [本地车牌搜索] 找到 ${suggestions.length} 个月票车建议`);
				} else {
					// 如果本地搜索没有结果，尝试使用原有的车主搜索接口
					console.log('🔄 [本地车牌搜索] 无结果，尝试车主搜索');
					await this.fallbackToOwnerSearch(keyword);
				}

			} catch (error) {
				console.error('❌ [本地车牌搜索] 搜索失败，尝试备用搜索:', error);
				// 发生错误时，尝试使用原有的搜索接口
				await this.fallbackToOwnerSearch(keyword);
			}
		},

		// 备用搜索方法（使用原有的车主搜索接口）
		async fallbackToOwnerSearch(keyword) {
			try {
				const response = await ownerApi.getPlateSuggestions(keyword, {
					page: 1,
					size: 200
				});

				if (response && response.data && Array.isArray(response.data)) {
					const suggestions = response.data.slice(0, 20).map(item => ({
						plateNumber: item.plateNumber || item.plate_number || item.plate,
						ownerName: item.ownerName || item.owner_name || item.name,
						ownerId: item.ownerId || item.owner_id || item.id
					}));

					this.plateSuggestions = suggestions;
					this.showPlateSuggestions = suggestions.length > 0;

					console.log(`✅ [备用搜索] 找到 ${suggestions.length} 个建议`);
				} else {
					this.plateSuggestions = [];
					this.showPlateSuggestions = false;
				}
			} catch (error) {
				console.error('❌ [备用搜索] 也失败了:', error);
				this.plateSuggestions = [];
				this.showPlateSuggestions = false;
			}
		},

		// 选择车牌建议
		selectPlateSuggestion(suggestion) {
			this.formData.plateNumber = suggestion.plateNumber;
			this.showPlateSuggestions = false;
			this.onPlateNumberChange(); // 查询车主信息
		},

		// ================ 车牌识别相关方法 ================


		// 关闭车牌识别
		closePlateRecognition() {
			this.showPlateRecognitionModal = false;
			this.showCamera = false;
			this.recognitionResult = null;
			this.isRecognizing = false;
			this.stopAutoRecognize();
		},

		// 打开摄像头
		openCamera() {
			this.showCamera = true;
			// 延迟启动自动识别，等待摄像头初始化
			setTimeout(() => {
				this.startAutoRecognize();
			}, 1000);
		},

		// 关闭摄像头
		closeCamera() {
			this.stopAutoRecognize();
			this.showCamera = false;
		},

		// 开启自动识别
		startAutoRecognize() {
			if (this.autoRecognize) return;

			this.autoRecognize = true;
			this.autoRecognizeCount = 0;
			console.log('🚀 开启自动识别模式');

			// 立即开始第一次识别
			this.performAutoRecognize();
		},

		// 停止自动识别
		stopAutoRecognize() {
			if (!this.autoRecognize) return;

			this.autoRecognize = false;
			if (this.autoRecognizeTimer) {
				clearTimeout(this.autoRecognizeTimer);
				this.autoRecognizeTimer = null;
			}
			console.log('⏹️ 停止自动识别模式');
		},

		// 切换自动识别
		toggleAutoRecognize() {
			if (this.autoRecognize) {
				this.stopAutoRecognize();
			} else {
				this.startAutoRecognize();
			}
		},

		// 执行自动识别
		async performAutoRecognize() {
			if (!this.autoRecognize || !this.showCamera) return;

			// 防抖：如果正在识别中，跳过此次
			if (this.isRecognizing) {
				console.log('⏭️ 跳过自动识别（正在识别中）');
				this.scheduleNextAutoRecognize();
				return;
			}

			// 防抖：检查距离上次识别的时间间隔
			const now = Date.now();
			if (now - this.lastRecognizeTime < 2000) {
				console.log('⏭️ 跳过自动识别（间隔太短）');
				this.scheduleNextAutoRecognize();
				return;
			}

			this.autoRecognizeCount++;
			console.log(`🔄 执行第${this.autoRecognizeCount}次自动识别`);

			try {
				await this.takePhotoAndRecognize(true); // true表示自动识别
			} catch (error) {
				console.error('自动识别失败:', error);
			}

			// 安排下次自动识别
			this.scheduleNextAutoRecognize();
		},

		// 安排下次自动识别
		scheduleNextAutoRecognize() {
			if (!this.autoRecognize) return;

			this.autoRecognizeTimer = setTimeout(() => {
				this.performAutoRecognize();
			}, 3000); // 3秒间隔
		},

		// 拍照并识别（自动）
		async takePhotoAndRecognize(isAutoRecognition = false) {
			// 检查识别锁定状态
			if (this.checkRecognitionLock()) {
				return Promise.reject('识别已锁定');
			}

			if (this.isRecognizing) return;

			this.isRecognizing = true;
			this.lastRecognizeTime = Date.now();

			return new Promise((resolve, reject) => {
				try {
					// 从camera组件获取照片
					const ctx = uni.createCameraContext('camera', this);
					ctx.takePhoto({
						quality: 'high',
						success: async (res) => {
							try {
								await this.recognizeFromImage(res.tempImagePath,
									isAutoRecognition);
								resolve();
							} catch (error) {
								reject(error);
							}
						},
						fail: (err) => {
							console.error('自动拍照失败:', err);
							this.isRecognizing = false;
							reject(err);
						}
					});
				} catch (error) {
					console.error('自动拍照异常:', error);
					this.isRecognizing = false;
					reject(error);
				}
			});
		},

		// 手动拍照识别
		async capturePhoto() {
			// 检查识别锁定状态
			if (this.checkRecognitionLock()) {
				return;
			}

			if (this.isRecognizing || this.autoRecognize) return;

			this.isRecognizing = true;
			try {
				// 从camera组件获取照片
				const ctx = uni.createCameraContext('camera', this);
				ctx.takePhoto({
					quality: 'high',
					success: (res) => {
						this.recognizeFromImage(res.tempImagePath, false); // false表示手动识别
					},
					fail: (err) => {
						console.error('拍照失败:', err);
						uni.showToast({
							title: '拍照失败',
							icon: 'none'
						});
						this.isRecognizing = false;
					}
				});
			} catch (error) {
				console.error('拍照异常:', error);
				this.isRecognizing = false;
				uni.showToast({
					title: '拍照失败',
					icon: 'none'
				});
			}
		},

		// 摄像头错误处理
		handleCameraError(error) {
			console.error('摄像头错误:', error);
			uni.showToast({
				title: '摄像头启动失败',
				icon: 'none'
			});
			this.showCamera = false;
		},
		// 检查识别锁定状态
		checkRecognitionLock() {
			if (this.recognitionLocked) {
				const now = Date.now();
				const elapsed = now - this.recognitionLockTime;
				if (elapsed >= this.recognitionLockDuration) {
					// 解锁
					this.recognitionLocked = false;
					this.recognitionFailedCount = 0;
					this.recognitionLockTime = null;
					return false;
				} else {
					const remainingSeconds = Math.ceil((this.recognitionLockDuration - elapsed) / 1000);
					uni.showToast({
						title: `识别已锁定，请等待${remainingSeconds}秒`,
						icon: 'none'
					});
					return true;
				}
			}
			return false;
		},

		// 识别失败处理
		handleRecognitionFailure() {
			this.recognitionFailedCount++;
			if (this.recognitionFailedCount >= this.maxRecognitionFailures) {
				this.recognitionLocked = true;
				this.recognitionLockTime = Date.now();
				uni.showModal({
					title: '识别已锁定',
					content: `识别错误${this.maxRecognitionFailures}次，已锁定${this.recognitionLockDuration / 1000}秒`,
					showCancel: false
				});
			}
		},

		// 识别成功处理
		handleRecognitionSuccess() {
			this.recognitionFailedCount = 0;
		},
		// 从图片识别车牌
		async recognizeFromImage(imagePath, isAutoRecognition = false) {
			if (!isAutoRecognition) {
				uni.showLoading({
					title: '识别中...'
				});
			}

			try {
				const base64 = await this.imageToBase64(imagePath);
				const result = await this.callRecognitionAPI(base64, isAutoRecognition);

				if (result && result.success) {
					// 识别成功，重置失败计数
					this.failedRecognizeCount = 0;

					this.recognitionResult = {
						plateNumber: result.plateNumber || 'Unknown',
						color: result.color || '未知',
						confidence: result.confidence || 0,
						recognizeTime: new Date().toISOString()
					};

					if (isAutoRecognition) {
						// 自动识别成功，暂停自动识别并显示确认对话框
						console.log(`✅ 自动识别成功: ${result.plateNumber}`);
						console.log('⏸️ 暂停自动识别，等待用户选择');

						// 先暂停自动识别
						this.stopAutoRecognize();

						uni.showModal({
							title: '车牌识别成功',
							content: `识别到车牌号码：${result.plateNumber}\n车牌颜色：${result.color}`,
							confirmText: '继续识别',
							cancelText: '使用',
							success: async (res) => {
								console.log('📋 用户选择:', res);
								if (res.cancel) {
									// 用户选择使用此车牌，关闭摄像头和弹窗并填充到搜索框
									this.showCamera = false;
									// 停止自动识别
									this.stopAutoRecognize();
									// 关闭车牌识别弹窗
									this.closePlateRecognition();
									// 填充车牌号码到搜索框
									this.formData.plateNumber = result.plateNumber;
									// 查询车主信息并等待完成
									await this.onPlateNumberChange();
									console.log('✅ [车牌识别] 使用识别结果，已填充到搜索框并查询车主信息:', result.plateNumber);
								} else if (res.confirm) {
									// 用户选择继续识别，重新启动自动识别
									console.log('🔄 用户选择继续识别，重新启动自动识别');
									this.startAutoRecognize();
								}
							},
							fail: (err) => {
								console.error('❌ showModal 失败:', err);
							}
						});
					} else {
						// 手动识别成功，关闭摄像头、弹窗并填充到搜索框
						this.showCamera = false;
						this.stopAutoRecognize();
						// 关闭车牌识别弹窗
						this.closePlateRecognition();
						// 填充车牌号码到搜索框
						this.formData.plateNumber = result.plateNumber;
						// 查询车主信息并等待完成
						await this.onPlateNumberChange();
						console.log(`✅ 手动识别成功: ${result.plateNumber}，已填充到搜索框并查询车主信息`);
					}
				} else {
					// 识别失败
					this.failedRecognizeCount++;
					console.log('❌ 识别失败:', result?.message || '未知错误', `失败次数: ${this.failedRecognizeCount}/7`);

					// 检查是否达到失败次数上限
					if (this.failedRecognizeCount >= 7) {
						this.isRecognitionDisabled = true;
						// 设置5分钟后解除禁用
						this.disabledUntilTime = Date.now() + 5 * 60 * 1000;
						this.stopAutoRecognize();
						this.closePlateRecognition();

						console.log('🚫 识别失败7次，禁用识别功能5分钟');
						uni.showModal({
							title: '识别失败次数过多',
							content: '车牌识别已失败7次，功能将禁用5分钟。\n\n请手动输入车牌号码或等待5分钟后重试。',
							showCancel: false,
							confirmText: '知道了'
						});
						return;
					}

					if (!isAutoRecognition) {
						uni.showToast({
							title: result?.message || `识别失败，请重试 (${this.failedRecognizeCount}/7)`,
							icon: 'none',
							duration: 2000
						});
					}
				}
			} catch (error) {
				console.error('识别异常:', error);
				this.failedRecognizeCount++;
				console.log(`识别异常，失败次数: ${this.failedRecognizeCount}/7`);

				// 检查是否达到失败次数上限
				if (this.failedRecognizeCount >= 7) {
					this.isRecognitionDisabled = true;
					// 设置5分钟后解除禁用
					this.disabledUntilTime = Date.now() + 5 * 60 * 1000;
					this.stopAutoRecognize();
					this.closePlateRecognition();

					console.log('🚫 识别失败7次，禁用识别功能5分钟');
					uni.showModal({
						title: '识别失败次数过多',
						content: '车牌识别已失败7次，功能将禁用5分钟。\n\n请手动输入车牌号码或等待5分钟后重试。',
						showCancel: false,
						confirmText: '知道了'
					});
					return;
				}

				if (!isAutoRecognition) {
					uni.showToast({
						title: `识别失败，请重试 (${this.failedRecognizeCount}/7)`,
						icon: 'none',
						duration: 2000
					});
				}
			} finally {
				if (!isAutoRecognition) {
					uni.hideLoading();
				}
				this.isRecognizing = false;
			}
		},

		// 调用识别API
		async callRecognitionAPI(base64Image, isAutoRecognition = false) {
			console.log(isAutoRecognition ? '🤖 自动识别API调用' : '👆 手动识别API调用');

			try {
				// 移除base64中的空白字符
				const cleanBase64 = base64Image.replace(/\s/g, '');

				const response = await uni.request({
					url: 'https://www.xuerparking.cn:8543/api/plate/recognize',
					method: 'POST',
					header: {
						'Content-Type': 'application/json'
					},
					data: {
						image: cleanBase64,
						multiDetect: false
					},
					timeout: isAutoRecognition ? 15000 : 30000 // 自动识别使用较短超时
				});

				console.log('API响应状态:', response.statusCode);

				if (response.statusCode === 200 && response.data) {
					const data = response.data;
					console.log('API响应数据:', data.data.data);

					if (data.data.data.success && data.data.data) {
						const plateData = data.data.data; // 取第一个识别结果
						return {
							success: true,
							plateNumber: plateData.plateNumber,
							color: plateData.color,
							confidence: Math.round(plateData.probability * 100)
						};
					} else {
						return {
							success: false,
							message: data.data.data.message || '未识别到车牌'
						};
					}
				} else {
					return {
						success: false,
						message: `API调用失败: ${response.statusCode}`
					};
				}
			} catch (error) {
				console.error('API调用异常:', error);
				return {
					success: false,
					message: '网络请求失败'
				};
			}
		},

		// 图片转base64
		imageToBase64(imagePath) {
			return new Promise((resolve, reject) => {
				uni.getFileSystemManager().readFile({
					filePath: imagePath,
					encoding: 'base64',
					success: (res) => {
						// 确保base64数据格式正确，移除可能的换行符和空格
						let base64Data = res.data;
						if (base64Data) {
							base64Data = base64Data.replace(/\s/g, ''); // 移除所有空白字符
							console.log('Base64 图片大小:', base64Data.length);
						}
						resolve(base64Data);
					},
					fail: (error) => {
						console.error('图片转base64失败:', error);
						reject(error);
					}
				});
			});
		},

		// 使用识别结果
		useRecognitionResult() {
			if (this.recognitionResult && this.recognitionResult.plateNumber) {
				this.formData.plateNumber = this.recognitionResult.plateNumber;
				this.closePlateRecognition();
				this.onPlateNumberChange(); // 查询车主信息

				uni.showToast({
					title: '已使用识别结果',
					icon: 'success'
				});
			}
		},

		// 重新识别
		retryRecognition() {
			this.recognitionResult = null;
			this.showCamera = false;
		},

		// 选择违规类型（新的统一方法）
		selectType(type) {
			this.formData.violationType = type.value;
			if (type.value !== 'other') {
				this.formData.customType = '';
			}

			// 选择后收起展开状态和搜索状态
			this.uiState.showMoreTypes = false;
			this.uiState.isSearching = false;
			this.uiState.searchKeyword = '';

			// 自动填充建议描述（如果当前描述为空）
			if (!this.formData.description) {
				this.autoFillDescription(type.value);
			}
		},

		// 自动填充描述
		autoFillDescription(violationType) {
			const autoDescriptions = {
				'overtime': '车辆停车时间超过规定时长',
				'wrong_position': '车辆未按规定位置停放',
				'occupy_space': '车辆占用他人预约车位',
				'block_plate': '车牌被遮挡，无法正常识别',
				'block_passage': '车辆阻挡消防通道或行车道',
				'unauthorized': '车辆未经授权在此区域停车',
				'disabled_space': '车辆占用残疾人专用车位',
				'cross_line': '车辆停放时压线或超出车位范围',
				'cross_parking': '车辆跨越多个车位停放',
				'vip_space': '车辆占用VIP专用车位',
				'engine_on': '车辆停车时未熄火',
				'loading_zone': '车辆占用货物装卸区域',
				'oversized': '车辆超出标准车位尺寸',
				'green_belt': '车辆占用绿化带区域',
				'charging_space': '车辆占用电动车充电专用车位',
				'vehicle_damage': '车辆存在损坏影响停车秩序'
			};

			if (autoDescriptions[violationType]) {
				this.formData.description = autoDescriptions[violationType];
			}
		},

		// 切换更多类型显示
		toggleMoreTypes() {
			this.uiState.showMoreTypes = !this.uiState.showMoreTypes;
			if (!this.uiState.showMoreTypes) {
				this.uiState.isSearching = false;
				this.uiState.searchKeyword = '';
			}
		},

		// 开始搜索
		startSearch() {
			this.uiState.isSearching = true;
			this.uiState.showMoreTypes = true;
		},

		// 搜索输入处理（带防抖）
		onSearchInput() {
			// 清除之前的定时器
			if (this.searchTimer) {
				clearTimeout(this.searchTimer);
			}

			// 设置新的防抖定时器
			this.searchTimer = setTimeout(() => {
				// 如果搜索关键词为空，显示提示
				if (!this.uiState.searchKeyword.trim()) {
					console.log('🔍 搜索关键词为空');
					return;
				}

				// 执行搜索逻辑
				console.log('🔍 搜索关键词:', this.uiState.searchKeyword);

				// 如果没有搜索结果，可以显示提示
				if (this.searchResults.length === 0) {
					console.log('🔍 没有找到匹配的违规类型');
				}
			}, 300); // 300ms 防抖延迟
		},

		// 清空搜索
		clearSearch() {
			this.uiState.searchKeyword = '';
			if (this.searchTimer) {
				clearTimeout(this.searchTimer);
				this.searchTimer = null;
			}
		},

		// 取消搜索
		cancelSearch() {
			this.clearSearch();
			this.uiState.isSearching = false;
		},

		// 拨打电话
		makePhoneCall(phone) {
			if (!phone) {
				uni.showToast({
					title: '暂无联系方式',
					icon: 'none'
				});
				return;
			}
			uni.makePhoneCall({
				phoneNumber: phone,
				fail: (err) => {
					console.error('拨打电话失败:', err);
					uni.showToast({
						title: '拨打失败',
						icon: 'none'
					});
				}
			});
		},

		// ================ 位置输入相关方法 ================



		// ================ 描述模板相关方法 ================

		// 使用描述模板
		useDescriptionTemplate(template) {
			if (this.formData.description) {
				// 如果已有描述，追加模板
				this.formData.description += (this.formData.description.endsWith('。') ? '' : '，') + template;
			} else {
				// 如果没有描述，直接使用模板
				this.formData.description = template;
			}
		},

		// 获取违规类型名称
		getViolationTypeName() {
			if (!this.formData.violationType) {
				return '未选择';
			}
			if (this.formData.violationType === 'other') {
				return this.formData.customType || '其他';
			}

			// 使用已有的selectedTypeInfo计算属性
			const selectedType = this.selectedTypeInfo;
			return selectedType ? selectedType.name : '未知类型';
		},

		// 已移除自动定位功能，改为手动输入
		// getCurrentLocation() 方法已删除，现在只支持手动输入位置

		// 拍照
		async takePhoto() {
			try {
				const res = await uni.chooseImage({
					count: 6 - this.formData.photos.length,
					sizeType: ['compressed'],
					sourceType: ['camera']
				});

				// 显示上传进度
				uni.showLoading({
					title: '上传中...',
					mask: true
				});

				// 上传每张照片到服务器
				for (let i = 0; i < res.tempFilePaths.length; i++) {
					const tempFilePath = res.tempFilePaths[i];
					try {
						const uploadUrl = this.buildUploadUrl(); // 构建上传URL
						console.log(`开始上传第${i + 1}张照片`, {
							uploadUrl,
							tempFilePath
						});

						const uploadRes = await uni.uploadFile({
							url: uploadUrl,
							filePath: tempFilePath,
							name: 'file',
							formData: {
								'type': 'violation',
								'userId': this.getCurrentUserId(),
								'timestamp': Date.now()
							}
						});

						console.log('上传响应:', uploadRes);

						// 解析上传结果
						const result = JSON.parse(uploadRes.data);
						console.log('解析后的响应数据:', result);

						// 修正成功判断逻辑 - 后端返回code为"0"表示成功
						if (result.code === "0" || result.code === 0 || result.success) {
							// 详细调试数据结构
							console.log('result.data:', result.data);
							console.log('result.data.data:', result.data.data);

							// 获取服务器返回的图片URL - 尝试多种可能的路径
							let imageUrl = result.data?.data?.url || // 双层嵌套
								result.data?.url || // 单层嵌套
								result.url; // 直接在根层

							console.log('提取的imageUrl:', imageUrl);

							if (imageUrl && imageUrl.startsWith('http://')) {
								imageUrl = imageUrl.replace('http://', 'https://');
								console.log('已将HTTP转换为HTTPS:', imageUrl);
							}

							if (imageUrl) {
								this.formData.photos.push(imageUrl);
								console.log(`第${i + 1}张照片上传成功:`, imageUrl);
								console.log('当前照片列表:', this.formData.photos);
							} else {
								console.error('上传响应中未找到图片URL:', result);
								console.error('尝试的路径都没有找到URL:');
								console.error('- result.data.data.url:', result.data?.data?.url);
								console.error('- result.data.url:', result.data?.url);
								console.error('- result.url:', result.url);
								throw new Error('服务器返回的数据中缺少图片URL');
							}
						} else {
							throw new Error(result.message || result.msg || '上传失败');
						}
					} catch (uploadError) {
						console.error('照片上传失败:', uploadError);
						console.error('错误详情:', {
							message: uploadError.message,
							statusCode: uploadError.statusCode,
							errMsg: uploadError.errMsg
						});

						uni.showToast({
							title: `第${i + 1}张照片上传失败: ${uploadError.message || '网络错误'}`,
							icon: 'error',
							duration: 3000
						});

						// 不要将临时路径添加到照片列表，避免HTTP协议错误
						// this.formData.photos.push(tempFilePath);
					}
				}

				uni.hideLoading();

			} catch (error) {
				uni.hideLoading();
				console.error('选择照片失败:', error);
				uni.showToast({
					title: '选择照片失败',
					icon: 'error'
				});
			}
		},

		// 构建照片上传URL
		buildUploadUrl() {
			// 使用配置文件中的API地址
			const {
				apiConfig,
				apiUrls
			} = require('@/config/api.js');
			return apiConfig.baseURL + apiUrls.upload.violationPhotos;
		},

		// 获取当前用户ID
		getCurrentUserId() {
			try {
				const userInfo = uni.getStorageSync('userInfo');
				return userInfo?.userId || userInfo?.id || 'anonymous';
			} catch (error) {
				return 'anonymous';
			}
		},

		// 预览照片
		previewPhoto(index) {
			uni.previewImage({
				urls: this.formData.photos,
				current: index
			});
		},

		// 删除照片
		deletePhoto(index) {
			this.formData.photos.splice(index, 1);
		},



		// 播放语音
		playVoice() {
			uni.showToast({
				title: '播放语音',
				icon: 'none'
			});
		},

		// 删除语音
		deleteVoice() {
			this.formData.voiceMemo = null;
			this.voiceDuration = 0;
		},

		// 打开车牌扫描
		openPlateScanner() {
			this.showScanModal = true;
			this.scanResult = '';
			this.showCamera = false;
		},

		// 关闭车牌扫描
		closeScanModal() {
			this.stopAutoRecognize();
			this.showScanModal = false;
			this.showCamera = false;
			this.scanning = false;
			this.scanResult = '';
		},

		// 启动摄像头
		startCamera() {
			this.showCamera = true;
			// 自动开始识别
			setTimeout(() => {
				this.startAutoRecognize();
			}, 1000);
		},

		// 关闭摄像头
		closeCamera() {
			this.stopAutoRecognize();
			this.showCamera = false;
		},

		// 开启自动识别
		startAutoRecognize() {
			if (this.autoRecognize) return;

			this.autoRecognize = true;
			this.autoRecognizeCount = 0;
			console.log('🚀 开启自动识别模式');

			// 立即开始第一次识别
			this.performAutoRecognize();
		},

		// 停止自动识别
		stopAutoRecognize() {
			if (!this.autoRecognize) return;

			this.autoRecognize = false;
			if (this.autoRecognizeTimer) {
				clearTimeout(this.autoRecognizeTimer);
				this.autoRecognizeTimer = null;
			}
			console.log('⏹️ 停止自动识别模式');
		},

		// 使用扫描结果
		useScanResult() {
			this.formData.plateNumber = this.scanResult;
			this.onPlateNumberChange();
			this.closeScanModal();
		},

		// 提交违规记录
		submitViolation() {
			// 额外验证违规类型
			if (!this.formData.violationType) {
				uni.showToast({
					title: '请选择违规类型',
					icon: 'none'
				});
				return;
			}

			if (!this.canSubmit) {
				uni.showToast({
					title: '请完善必填信息',
					icon: 'none'
				});
				return;
			}

			this.showConfirmModal = true;
		},

		// 关闭确认弹窗
		closeConfirmModal() {
			this.showConfirmModal = false;
		},

		// 确认提交
		async confirmSubmit() {
			this.submitting = true;
			try {
				const result = await this.submitToServer();

				// 🔔 微信通知已由后端在创建违规记录时自动发送，无需前端调用

				// 显示详细的成功信息
				uni.showModal({
					title: '提交成功',
					content: `违规记录已成功提交\n记录编号：${result.violationId}\n信用分影响：${this.calculateCreditImpact()}分\n创建者：${result.currentUser}`,
					showCancel: true,
					cancelText: '查看记录',
					confirmText: '继续添加',
					success: (res) => {
						if (res.confirm) {
							// 用户选择继续添加，重置表单
							this.resetForm();
						} else {
							// 用户选择查看记录，跳转到违规记录页面
							uni.navigateTo({
								url: '/pagesE/violation/violation'
							});
						}
					}
				});
			} catch (error) {
				uni.showModal({
					title: '提交失败',
					content: error.message || '网络错误，请检查网络连接后重试',
					showCancel: true,
					cancelText: '取消',
					confirmText: '重试',
					success: (res) => {
						if (res.confirm) {
							// 用户选择重试
							setTimeout(() => {
								this.confirmSubmit();
							}, 500);
						}
					}
				});
			} finally {
				this.submitting = false;
				this.closeConfirmModal();
			}
		},

		// 提交到服务器
		async submitToServer() {
			try {
				// 获取当前用户信息
				let userInfo = uni.getStorageSync('userInfo');

				// 🔧 如果userInfo为空，尝试从其他来源获取
				if (!userInfo) {
					console.log('⚠️ [提交违规] userInfo为空，尝试从其他来源获取');
					userInfo = this.getUserInfoFromAllSources();
				}
				const currentUserId = userInfo?.userId || userInfo?.id || 'patrol_' + Date.now();
				const userRole = userInfo?.role || 'patrol';
				const storedUsername = (() => {
					try {
						return (typeof localStorage !== 'undefined') ? (localStorage.getItem(
							'ms_username') || localStorage.getItem('login_name') || localStorage
								.getItem('ms_username')) : null;
					} catch (e) {
						return null;
					}
				})();
				// 根据不同角色获取用户姓名
				let currentUserName = 'anonymous';

				// 优先检查巡逻员身份
				if (userInfo?.patrolData?.username) {
					currentUserName = userInfo.patrolData.username;
					console.log('🚨 检测到巡逻员身份，姓名:', currentUserName);
				}
				// 检查管家身份 
				else if (userInfo?.userInfo?.username) {
					currentUserName = userInfo.userInfo.username;
					console.log('🏠 检测到管家身份，姓名:', currentUserName);
				}
				// 检查业主身份
				else if (userInfo?.userInfo?.ownername || userInfo?.ownername) {
					currentUserName = userInfo.userInfo?.ownername || userInfo.ownername;
					console.log('👨‍👩‍👧‍👦 检测到业主身份，姓名:', currentUserName);
				}
				// 通用用户信息字段
				else if (userInfo?.realName || userInfo?.userName || userInfo?.loginName || userInfo?.nickname ||
					userInfo?.name) {
					currentUserName = userInfo.realName || userInfo.userName || userInfo.loginName || userInfo
						.nickname || userInfo.name;
					console.log('👤 使用通用用户字段，姓名:', currentUserName);
				}
				// 从localStorage获取
				else if (storedUsername) {
					currentUserName = storedUsername;
					console.log('💾 从localStorage获取，姓名:', currentUserName);
				}

				console.log('✅ 最终确定的用户姓名:', currentUserName);

				// 处理ID类型转换：后端需要int类型的ID（范围：-2147483648 到 2147483647）
				const getNumericId = (id) => {
					const MAX_INT = 2147483647; // Java int 最大值
					const MIN_SAFE_ID = 1; // 最小安全ID
					const MAX_SAFE_ID = 999999999; // 最大安全ID（在int范围内）

					if (typeof id === 'number') {
						// 确保数字在安全范围内
						return Math.min(Math.max(id, MIN_SAFE_ID), MAX_SAFE_ID);
					}

					if (typeof id === 'string') {
						// 如果是数字字符串，直接转换
						const numId = parseInt(id);
						if (!isNaN(numId)) {
							// 如果数字太大，取后面几位或者生成新的安全ID
							if (numId > MAX_SAFE_ID) {
								// 取时间戳的后6位 + 随机3位，确保在安全范围内
								const timestamp = Date.now();
								const shortId = parseInt(timestamp.toString().slice(-6)) * 1000 + Math.floor(
									Math.random() * 1000);
								return Math.min(shortId, MAX_SAFE_ID);
							}
							return Math.max(numId, MIN_SAFE_ID);
						}

						// 如果是类似"patrol_1754620020831"的字符串，提取数字部分
						const match = id.match(/\d+/);
						if (match) {
							const extractedNum = parseInt(match[0]);
							if (extractedNum > MAX_SAFE_ID) {
								// 数字太大，生成一个安全的ID
								const timestamp = Date.now();
								const shortId = parseInt(timestamp.toString().slice(-6)) * 1000 + Math.floor(
									Math.random() * 1000);
								return Math.min(shortId, MAX_SAFE_ID);
							}
							return Math.max(extractedNum, MIN_SAFE_ID);
						}
					}

					// 默认返回一个安全范围内的随机数字ID
					return Math.floor(Math.random() * (MAX_SAFE_ID - MIN_SAFE_ID + 1)) + MIN_SAFE_ID;
				};

				// 🆕 获取月票信息的辅助函数
				const getMonthTicketInfo = () => {
					if (this.ownerInfo?.isMonthlyTicket && this.ownerInfo?.ticketName) {
						console.log('🎫 [月票信息] 检测到月票车:', {
							ticketName: this.ownerInfo.ticketName,
							monthTicketId: this.ownerInfo.monthTicketId || this.ownerInfo.ownerId,
							ownerId: this.ownerInfo.ownerId
						});

						return {
							monthTicketId: this.ownerInfo.monthTicketId || this.ownerInfo.ownerId,
							isMonthlyTicket: true,
							ticketName: this.ownerInfo.ticketName
						};
					}

					console.log('🚗 [车辆信息] 非月票车或无月票信息');
					return {
						monthTicketId: null,
						isMonthlyTicket: false,
						ticketName: null
					};
				};

				// 获取违规类型的中文名称
				const getViolationTypeName = (typeValue) => {
					if (!typeValue) return '';
					if (typeValue === 'other') {
						return this.formData.customType || '其他';
					}

					// 从配置中查找对应的中文名称
					const allTypes = [...this.violationConfig.common, ...this.violationConfig.others];
					const typeInfo = allTypes.find(type => type.value === typeValue);
					return typeInfo ? typeInfo.name : typeValue;
				};

				// 🆕 获取月票信息
				const monthTicketInfo = getMonthTicketInfo();
				console.log("测试数据", this.formData.enterTime)
				console.log("测试数据2", this.formData.arrivedate)
				// 构建符合后端实体类的提交数据（使用驼峰命名）
				const submitData = {
					plateNumber: this.formData.plateNumber,
					ownerId: this.ownerInfo?.ownerId ? getNumericId(this.ownerInfo.ownerId) :
						null, // 如果有业主信息则使用业主ID，否则设为null

					// 🆕 添加预约记录关联
					appointmentId: this.selectedAppointmentId ? getNumericId(this.selectedAppointmentId) :
						null, // 预约记录ID

					// 🆕 添加月票关联信息
					monthTicketId: monthTicketInfo.monthTicketId ? getNumericId(monthTicketInfo
						.monthTicketId) : null,
					isMonthlyTicket: monthTicketInfo.isMonthlyTicket,

					violationType: getViolationTypeName(this.formData.violationType), // 使用中文名称
					customType: this.formData.customType || null,
					location: this.formData.location,
					description: this.formData.description || '',
					createdAt: (() => {
						const now = new Date();
						const year = now.getFullYear();
						const month = String(now.getMonth() + 1).padStart(2, '0');
						const day = String(now.getDate()).padStart(2, '0');
						const hour = String(now.getHours()).padStart(2, '0');
						const minute = String(now.getMinutes()).padStart(2, '0');
						const second = String(now.getSeconds()).padStart(2, '0');
						return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
					})(), // 违规发生时间 - 格式：yyyy-MM-dd HH:mm:ss
					reporterId: getNumericId(currentUserId), // 举报人ID转换为数字
					status: 'pending', // 待处理
					severity: this.calculateSeverity(), // 计算严重程度
					createdBy: currentUserName, // 创建人姓名
					remark: this.formData.description || '', // 备注信息

					// 🚫 拉黑相关字段
					shouldBlacklist: this.formData.shouldBlacklist ? 1 : 0, // 是否拉黑 (转换为数字：true->1, false->0)
					blacklistReason: this.formData.shouldBlacklist ? this.formData.blacklistReason :
						null, // 拉黑原因
					// 以下字段暂时设为空，可以后续扩展
					handlerId: null, // 处理人ID（待分配）
					photos: this.formData.photos.length > 0 ? JSON.stringify(this.formData.photos) :
						"", // 照片信息（JSON字符串格式）
					voiceMemo: null, // 语音备忘（后续可以扩展）

					// 🔧 修复：正确映射时间字段到violations表
					enterTime: this.formData.enterTime, // 🆕 进场时间：来自预约表的arrivedate或在场接口查询结果
					leaveTime: this.formData.leaveTime, // 🔧 离场时间：从预约表leavedate获取
					appointmentTime: this.formData.appointmentTime // 🔧 预约时间：从预约表visitdate/recorddate获取
				};

				// 🆕 如果选择了拉黑，先添加到黑名单
				if (this.formData.shouldBlacklist) {
					console.log('🚫 需要拉黑，先添加到黑名单...');

					// 验证必要条件
					if (!this.selectedBlacklistType) {
						throw new Error('请选择黑名单类型');
					}

					// 添加到黑名单
					const blacklistSuccess = await this.addToBlacklist();
					if (!blacklistSuccess) {
						throw new Error('添加黑名单失败，无法继续提交违规记录');
					}

					console.log('✅ 黑名单添加成功，继续提交违规记录...');
				}

				// 调用真实API接口
				const result = await violationApi.createViolation(submitData);

				console.log('✅ 违规记录提交成功:', result);

				// 返回成功响应
				return {
					success: true,
					violationId: result.id || 'VIO_' + Date.now(),
					message: '违规记录已成功提交到数据库',
					currentUser: currentUserName,
					userRole: userRole,
					data: result
				};

			} catch (error) {
				console.error('❌ 提交违规记录失败:', error);

				// 抛出错误供调用者处理
				throw new Error(error.message || '提交失败，请检查网络连接后重试');
			}
		},

		// 计算违规严重程度
		calculateSeverity() {
			const severityMap = {
				// 严重违规 - 'severe'
				'block_passage': 'severe', // 堵塞消防通道 - 严重
				'disabled_space': 'severe', // 占用残疾人车位 - 严重
				'fire_lane': 'severe', // 占用消防通道 - 严重
				'green_belt': 'severe', // 占用绿化带 - 严重
				'loading_zone': 'severe', // 占用卸货区 - 严重

				// 中等违规 - 'moderate'
				'occupy_space': 'moderate', // 占用他人车位 - 中等
				'unauthorized': 'moderate', // 未经授权停车 - 中等
				'block_plate': 'moderate', // 遮挡车牌 - 中等
				'vip_space': 'moderate', // 占用VIP车位 - 中等
				'charging_space': 'moderate', // 占用充电桩车位 - 中等
				'reverse_parking': 'moderate', // 逆向停车 - 中等
				'cross_parking': 'moderate', // 跨车位停车 - 中等
				'vehicle_damage': 'moderate', // 车辆损坏 - 中等

				// 轻微违规 - 'mild'
				'overtime': 'mild', // 超时停车 - 轻微
				'wrong_position': 'mild', // 未按位停车 - 轻微
				'cross_line': 'mild', // 压线停车 - 轻微
				'engine_on': 'mild', // 未熄火停车 - 轻微
				'oversized': 'mild', // 超宽停车 - 轻微
				'other': 'mild' // 其他 - 轻微
			};
			return severityMap[this.formData.violationType] || 'mild';
		},

		// 计算信用分影响
		calculateCreditImpact() {
			const impactMap = {
				'severe': -10, // 严重违规扣10分
				'moderate': -5, // 中等违规扣5分
				'mild': -2 // 轻微违规扣2分
			};
			const severity = this.calculateSeverity();
			return impactMap[severity] || -2;
		},

		// 重置表单
		resetForm() {
			console.log('🔄 重置表单数据');
			// 重置表单数据
			this.formData = {
				plateNumber: '',
				violationType: '',
				customType: '',
				location: '',
				photos: [],
				description: '',
				shouldBlacklist: false,
				blacklistReason: '',
				blacklistDecisionMade: false, // 重置拉黑决定状态
				enterTime: null, // 🆕 重置进场时间
				leaveTime: null, // 🔧 重置离场时间
				appointmentTime: null // 🔧 重置预约时间
			};

			// 重置界面状态
			this.uiState = {
				showMoreTypes: false,
				searchKeyword: '',
				isSearching: false
			};

			// 重置其他状态
			this.ownerInfo = null;
			this.showPlateSuggestions = false;
			this.plateSuggestions = [];
			this.plateFocused = false;
			this.locationFocused = false;

			// 🆕 重置预约记录相关状态
			this.appointmentRecords = [];
			this.violationSuggestions = [];
			this.selectedAppointmentId = null;
			this.showAppointmentModal = false;

			// 显示成功提示
			uni.showToast({
				title: '已重置，可继续添加',
				icon: 'success',
				duration: 1500
			});
		},

		// 执行自动识别
		async performAutoRecognize() {
			if (!this.autoRecognize || !this.showCamera) return;

			// 防抖：如果正在识别中，跳过此次
			if (this.isRecognizing) {
				console.log('⏭️ 跳过自动识别（正在识别中）');
				this.scheduleNextAutoRecognize();
				return;
			}

			// 防抖：检查距离上次识别的时间间隔
			const now = Date.now();
			if (now - this.lastRecognizeTime < 2000) {
				console.log('⏭️ 跳过自动识别（间隔太短）');
				this.scheduleNextAutoRecognize();
				return;
			}

			this.autoRecognizeCount++;
			this.lastRecognizeTime = now;
			console.log(`🔍 执行第${this.autoRecognizeCount}次自动识别`);

			try {
				// 自动拍照
				await this.autoCapture();
			} catch (error) {
				console.error('自动识别失败:', error);
			}

			// 调度下次自动识别
			this.scheduleNextAutoRecognize();
		},

		// 调度下次自动识别
		scheduleNextAutoRecognize() {
			if (!this.autoRecognize) return;

			this.autoRecognizeTimer = setTimeout(() => {
				this.performAutoRecognize();
			}, this.autoRecognizeInterval);
		},

		// 自动拍照（用于自动识别）
		async autoCapture() {
			if (this.isRecognizing) return;

			this.isRecognizing = true;
			try {
				const ctx = uni.createCameraContext('camera', this);
				return new Promise((resolve, reject) => {
					ctx.takePhoto({
						quality: 'high',
						success: async (res) => {
							try {
								await this.recognizeFromImage(res.tempImagePath,
									true); // 传入true表示自动识别
								resolve();
							} catch (error) {
								reject(error);
							}
						},
						fail: (err) => {
							console.error('自动拍照失败:', err);
							this.isRecognizing = false;
							reject(err);
						}
					});
				});
			} catch (error) {
				console.error('自动拍照异常:', error);
				this.isRecognizing = false;
				throw error;
			}
		},

		// 拍照识别（手动）
		async capturePhoto() {
			if (this.isRecognizing || this.autoRecognize) return;

			this.isRecognizing = true;
			try {
				// 从camera组件获取照片
				const ctx = uni.createCameraContext('camera', this);
				ctx.takePhoto({
					quality: 'high',
					success: (res) => {
						this.recognizeFromImage(res.tempImagePath, false); // 传入false表示手动识别
					},
					fail: (err) => {
						console.error('拍照失败:', err);
						uni.showToast({
							title: '拍照失败',
							icon: 'none'
						});
						this.isRecognizing = false;
					}
				});
			} catch (error) {
				console.error('拍照异常:', error);
				this.isRecognizing = false;
				uni.showToast({
					title: '拍照失败',
					icon: 'none'
				});
			}
		},

		// 摄像头错误处理
		handleCameraError(error) {
			console.error('摄像头错误:', error);
			uni.showToast({
				title: '摄像头启动失败',
				icon: 'none'
			});
			this.showCamera = false;
		},

		// 从相册选择
		chooseFromAlbum() {
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album'],
				success: (res) => {
					this.recognizeFromImage(res.tempFilePaths[0]);
				}
			});
		},


		// ================ 车牌键盘相关方法 ================

		// 显示键盘并传递当前车牌号码
		showKeyboardWithCurrentValue() {
			// 获取当前输入的车牌号码
			const currentPlateNumber = this.getPlateNumber();
			console.log('🎹 显示键盘，当前车牌号码:', currentPlateNumber);
			this.toShow(currentPlateNumber);
		},

		// 获取当前车牌号码
		getPlateNumber() {
			return this.formData.plateNumber || '';
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
				this.formData.plateNumber = value;
				this.onPlateNumberChange();
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
			}

			// 更新车牌字符数组以保持同步
			this.$nextTick(() => {
				this.updateCurrentPlateChars();
			});
		},

		inputAdd(v) {
			console.log('➕ 执行添加操作:', v);
			this.$refs.keyboardInput.toAdd(v);
			this.$nextTick(() => {
				console.log('🔄 添加后更新车牌字符数组');
				this.updateCurrentPlateChars();
				// 触发计算属性更新
				this.plateUpdateTrigger++;
			});
		},

		inputDel() {
			console.log('🗑️ 执行删除操作');
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
			this.$refs.keyboardInput.toClear();
			this.clearCurrentPlateChars();
			// 触发计算属性更新
			this.plateUpdateTrigger++;
		},

		// 车牌颜色切换
		changeColor(color) {
			console.log('🎨 切换车牌类型，清除之前输入的车牌号码');

			// 先清除所有输入的车牌号码
			this.clearAllPlateInput();

			this.carColor = color;
			this.selectedColor = color;

			if (color == 'linear-gradient(to bottom, #d0f1e4, #6ad390)') {
				this.carMax = false;
				this.maxCarLenght = 8;
				this.plateType = "newEnergy";
				this.borderBgColor = "#000";
				this.dynamicWidth = 22;
				this.textColor = '#000';
			} else {
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

		// 清除所有车牌输入
		clearAllPlateInput() {
			this.formData.plateNumber = '';
			if (this.$refs.keyboardInput) {
				this.$refs.keyboardInput.toClear();
			}
			this.clearCurrentPlateChars();
		},

		// 调整车牌字符数组长度
		adjustPlateCharsLength() {
			const newLength = this.maxCarLenght;
			this.currentPlateChars = new Array(newLength).fill('');
		},

		// 更新当前车牌字符数组
		updateCurrentPlateChars() {
			if (this.$refs.keyboardInput && this.$refs.keyboardInput.values) {
				const values = this.$refs.keyboardInput.values;
				this.currentPlateChars = [...values];

				// 确保数组长度正确
				while (this.currentPlateChars.length < this.maxCarLenght) {
					this.currentPlateChars.push('');
				}
				// 更新表单数据
				this.formData.plateNumber = values.join('');
			}
		},

		// 清除当前车牌字符数组
		clearCurrentPlateChars() {
			this.currentPlateChars = new Array(this.maxCarLenght).fill('');
		},

		// ================ 🆕 预约记录相关方法 ================

		// 加载预约记录并分析违规情况
		async loadAppointmentRecords(plateNumber) {
			if (!plateNumber) {
				this.appointmentRecords = [];
				this.violationSuggestions = [];
				return;
			}

			try {
				console.log('🔍 查询预约记录:', plateNumber);

				// 使用封装好的API调用
				const response = await violationApi.getAppointmentRecords(plateNumber);

				if (response) {
					this.appointmentRecords = Array.isArray(response) ? response : (response.data || []);
					console.log('✅ 预约记录查询成功:', this.appointmentRecords);

					// 如果有预约记录，进行违规分析
					if (this.appointmentRecords.length > 0) {
						await this.analyzeViolations(plateNumber);

						// 显示成功提示，提醒用户选择预约记录
						uni.showToast({
							title: `找到${this.appointmentRecords.length}条预约记录，请选择`,
							icon: 'none',
							duration: 3000
						});

						// 可选：显示预约记录选择弹窗（如果用户喜欢弹窗方式）
						// this.showAppointmentSelectionModal();
					} else {
						uni.showToast({
							title: '未找到预约记录',
							icon: 'none',
							duration: 2000
						});
					}
				} else {
					console.warn('⚠️ 预约记录查询失败:', response);
					this.appointmentRecords = [];
				}
			} catch (error) {
				console.error('❌ 查询预约记录失败:', error);
				this.appointmentRecords = [];
			}
		},

		// 分析违规情况
		async analyzeViolations(plateNumber) {
			try {
				console.log('🔍 分析违规情况:', plateNumber);

				// 使用封装好的API调用
				const response = await violationApi.analyzeViolationByPlate(plateNumber);

				if (response) {
					const analysisData = response.data ? response.data : response;
					this.violationSuggestions = analysisData.violationSuggestions || [];
					console.log('✅ 违规分析成功:', this.violationSuggestions);
				} else {
					console.warn('⚠️ 违规分析失败:', response);
					this.violationSuggestions = [];
				}
			} catch (error) {
				console.error('❌ 违规分析失败:', error);
				this.violationSuggestions = [];
			}
		},

		// 显示预约记录选择弹窗
		showAppointmentSelectionModal() {
			if (this.appointmentRecords.length === 0) {
				return;
			}

			// 构建选择项
			const itemList = this.appointmentRecords.map((record, index) => {
				const statusText = this.getStatusText(record.parkingStatus);
				const timeInfo = this.formatTimeInfo(record);
				const suggestion = this.getViolationSuggestionForRecord(record.id);

				let title = `${record.recorddate} ${statusText}`;
				let content = `${record.community} ${record.building}栋${record.units}单元${record.room}室`;

				if (timeInfo) {
					content += `\n${timeInfo}`;
				}

				if (suggestion) {
					content +=
						`\n💡 建议：${suggestion.type} (${suggestion.severity === 'severe' ? '严重' : suggestion.severity === 'moderate' ? '中等' : '轻微'})`;
				}

				return {
					title,
					content,
					recordId: record.id,
					record: record,
					suggestion: suggestion
				};
			});

			uni.showActionSheet({
				itemList: itemList.map(item => item.title),
				success: (res) => {
					const selectedItem = itemList[res.tapIndex];
					this.selectAppointmentRecord(selectedItem.record, selectedItem.suggestion);
				}
			});
		},

		// 选择预约记录
		selectAppointmentRecord(record, suggestion) {
			this.selectedAppointmentId = record.id;

			// 自动填充位置信息
			const location = `${record.community} ${record.building}栋${record.units}单元${record.room}室`;
			this.formData.location = location;

			// 如果有违规建议，自动填充违规类型和描述
			if (suggestion) {
				// 根据建议类型匹配违规类型配置
				const matchedType = this.findMatchingViolationType(suggestion.type);
				if (matchedType) {
					this.formData.violationType = matchedType.value;
					this.formData.description = suggestion.description || '';
				}

				uni.showToast({
					title: `已选择预约记录并自动填充违规信息`,
					icon: 'success',
					duration: 2000
				});
			} else {
				uni.showToast({
					title: '已选择预约记录',
					icon: 'success',
					duration: 1500
				});
			}
		},

		// 获取状态文本
		getStatusText(status) {
			const statusMap = {
				'已离场': '✅',
				'在场中': '🚗',
				'未进场': '⏳'
			};
			return statusMap[status] || status;
		},

		// 格式化时间信息
		formatTimeInfo(record) {
			let timeInfo = '';

			if (record.arrivedate && record.leavedate) {
				const duration = this.calculateDuration(record.arrivedate, record.leavedate);
				timeInfo = `停车时长: ${duration}`;
			} else if (record.arrivedate) {
				timeInfo = `进场: ${record.arrivedate}`;
			} else if (record.leavedate) {
				timeInfo = `离场: ${record.leavedate}`;
			}

			return timeInfo;
		},

		// 计算停车时长
		calculateDuration(arriveTime, leaveTime) {
			try {
				const arrive = new Date(arriveTime);
				const leave = new Date(leaveTime);
				const diffMs = leave.getTime() - arrive.getTime();
				const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
				const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

				if (diffHours > 0) {
					return `${diffHours}小时${diffMinutes}分钟`;
				} else {
					return `${diffMinutes}分钟`;
				}
			} catch (error) {
				return '计算失败';
			}
		},

		// 获取指定预约记录的违规建议
		getViolationSuggestionForRecord(appointmentId) {
			return this.violationSuggestions.find(s => s.appointmentId === appointmentId);
		},

		// 根据建议类型匹配违规类型配置
		findMatchingViolationType(suggestionType) {
			const allTypes = [...this.violationConfig.common, ...this.violationConfig.others];

			// 精确匹配
			let matched = allTypes.find(type => type.name === suggestionType);
			if (matched) return matched;

			// 模糊匹配
			const fuzzyMatches = {
				'超时停车': 'overtime',
				'未按时离场': 'overtime',
				'占用他人车位': 'occupy_space',
				'未经授权停车': 'unauthorized',
				'压线停车': 'cross_line',
				'未按位停车': 'wrong_position'
			};

			const matchedValue = fuzzyMatches[suggestionType];
			if (matchedValue) {
				matched = allTypes.find(type => type.value === matchedValue);
			}

			return matched || null;
		},

		// 获取状态样式类
		getStatusClass(status) {
			const classMap = {
				'已离场': 'status-completed',
				'在场中': 'status-parking',
				'未进场': 'status-pending'
			};
			return classMap[status] || 'status-default';
		},

		// 获取建议样式类
		getSuggestionClass(severity) {
			const classMap = {
				'severe': 'suggestion-severe',
				'moderate': 'suggestion-moderate',
				'mild': 'suggestion-mild'
			};
			return classMap[severity] || 'suggestion-default';
		},

		// 获取严重程度文本
		getSeverityText(severity) {
			const textMap = {
				'severe': '严重',
				'moderate': '中等',
				'mild': '轻微'
			};
			return textMap[severity] || '未知';
		},

		// 判断是否为新能源车牌
		isNewEnergyPlate(plateNumber) {
			if (!plateNumber) return false;
			// 简化判断逻辑，只需要检查长度是否为8位
			return plateNumber.length === 8;
		},

		// 加载更多搜索结果
		async loadMoreResults() {
			if (!this.plateSearchKeyword.trim() || this.isSearching) {
				return;
			}

			this.currentSearchPage++;
			this.isSearching = true;

			try {
				console.log(`🔍 加载第${this.currentSearchPage}页搜索结果`);
				console.log(`🔍 使用${this.usingSmartSearch ? '本地数据搜索' : '原有搜索'}API`);

				let response;
				if (this.usingSmartSearch) {
					// 使用本地数据库搜索API
					const parkName = this.currentPark || '默认停车场';
					response = await violationApi.searchLocalData({
						keyword: this.plateSearchKeyword,
						parkName: parkName,
						page: this.currentSearchPage,
						size: 200
					});
				} else {
					// 使用原有搜索API
					response = await ownerApi.getPlateSuggestions(this.plateSearchKeyword, {
						page: this.currentSearchPage,
						size: 200
					});
				}

				// 处理本地数据搜索和原有搜索的不同响应格式
				let dataArray, totalCount, hasMore;

				if (this.usingSmartSearch) {
					// 本地数据搜索：处理records格式
					if (response && response.records && Array.isArray(response.records)) {
						dataArray = response.records;
						totalCount = response.total || 0;
						hasMore = response.hasMore || false;
					}
				} else {
					// 原有搜索：处理data格式
					if (response && response.data && Array.isArray(response.data)) {
						dataArray = response.data;
						totalCount = response.total || response.count || this.totalSearchResults;
						hasMore = dataArray.length >= 200;
					}
				}

				if (dataArray && dataArray.length > 0) {
					// 将新结果追加到现有结果中
					const newSuggestions = dataArray.map(item => {
						if (this.usingSmartSearch) {
							// 本地数据搜索结果格式
							return {
								plateNumber: item.plateNumber,
								ownerName: item.ownerName,
								ownerPhone: item.ownerPhone,
								ownerId: item.ownerId || item.monthTicketId || null,
								ticketName: item.ticketName,
								parkingSpot: item.parkingSpot,
								validStatus: item.validStatus,
								isFrozen: item.isFrozen,
								isInPark: item.isInPark,
								appointmentCount: item.appointmentCount || 0,
								violationCount: item.violationCount || 0,
								creditScore: item.creditScore || 100
							};
						} else {
							// 原有搜索结果格式
							const plateNumber = item.plateNumber || item.plate_number || item.plate;
							return {
								plateNumber: plateNumber,
								ownerName: item.ownerName || item.owner_name || item.name,
								ownerId: item.ownerId || item.owner_id || item.id,
								appointmentCount: 0
							};
						}
					});

					this.plateSuggestions.push(...newSuggestions);

					// 检查是否还有更多结果
					if (this.plateSuggestions.length >= totalCount || !hasMore || dataArray.length < 200) {
						this.showLoadMoreBtn = false;
						uni.showToast({
							title: '已加载全部结果',
							icon: 'success',
							duration: 2000
						});
					}

					console.log(`✅ 成功加载第${this.currentSearchPage}页，当前共${this.plateSuggestions.length}条结果`);
				} else {
					// 没有更多结果
					this.showLoadMoreBtn = false;
					uni.showToast({
						title: '没有更多结果',
						icon: 'none',
						duration: 2000
					});
				}
			} catch (error) {
				console.error('❌ 加载更多结果失败:', error);
				this.currentSearchPage--; // 回退页码

				uni.showToast({
					title: '加载失败，请重试',
					icon: 'none',
					duration: 2000
				});
			} finally {
				this.isSearching = false;
			}
		},
		onBlacklistSwitchChange(e) {
			this.formData.shouldBlacklist = e.detail.value;
			this.formData.blacklistDecisionMade = true; // 标记用户已做出决定

			// 🚫 如果关闭拉黑，清空相关字段
			if (!e.detail.value) {
				this.formData.blacklistReason = '';
				this.selectedBlacklistType = null;
				this.blacklistTypes = [];
			} else {
				// ✅ 如果开启拉黑，立即弹出黑名单类型选择弹窗
				this.showBlacklistTypeModal = true;
				this.loadBlacklistTypes();
			}

			console.log('🚫 拉黑开关状态:', this.formData.shouldBlacklist);
			console.log('✅ 用户已明确做出拉黑决定');
		},
		useBlacklistReasonTemplate(template) {
			this.formData.blacklistReason = template;
			// 🆕 填写拉黑原因后自动加载黑名单类型
			if (this.formData.shouldBlacklist && template) {
				this.loadBlacklistTypes();
			}
		},

		// 🆕 加载黑名单类型
		async loadBlacklistTypes() {
			console.log('🔍 开始加载黑名单类型...');
			this.loadingBlacklistTypes = true;

			try {
				// 获取当前巡逻员的车场信息
				const parkCode = await this.getCurrentParkCode();
				if (!parkCode) {
					throw new Error('无法获取当前车场信息');
				}

				console.log('🏢 当前车场编码:', parkCode);

				// 调用后端接口获取黑名单类型
				const response = await uni.request({
					url: 'https://www.xuerparking.cn:8543/parking/blackList/getSpecialCarTypeList',
					method: 'GET',
					data: {
						parkCodeList: parkCode
					}
				});

				console.log('📥 黑名单类型响应:', response);

				if (response.statusCode === 200 && response.data && response.data.data) {
					const data = response.data.data.data;
					if (data && data.recordList && Array.isArray(data.recordList)) {
						this.blacklistTypes = data.recordList.map(item => ({
							id: item.id,
							name: item.name,
							remark: item.remark || ''
						}));
						console.log('✅ 成功加载黑名单类型:', this.blacklistTypes);
					} else {
						console.warn('⚠️ 黑名单类型数据格式异常:', data);
						this.blacklistTypes = [];
					}
				} else {
					console.error('❌ 获取黑名单类型失败:', response);
					throw new Error('获取黑名单类型失败');
				}
			} catch (error) {
				console.error('❌ 加载黑名单类型失败:', error);
				uni.showToast({
					title: '加载黑名单类型失败',
					icon: 'none',
					duration: 2000
				});
				this.blacklistTypes = [];
			} finally {
				this.loadingBlacklistTypes = false;
			}
		},

		// 🆕 获取当前巡逻员的车场编码
		async getCurrentParkCode() {
			try {
				// 从用户信息中获取车场名称
				let userInfo = uni.getStorageSync('userInfo');
				if (!userInfo) {
					userInfo = this.getUserInfoFromAllSources();
				}

				const parkName = userInfo?.yardName ||
					userInfo?.patrolData?.yardName ||
					userInfo?.patrolData?.community ||
					userInfo?.userInfo?.yardName ||
					userInfo?.userInfo?.community ||
					userInfo?.community ||
					this.currentPark;

				console.log('🏢 当前车场名称:', parkName);

				if (!parkName) {
					console.warn('⚠️ 未找到车场名称');
					return '2KST9MNP'; // 默认值
				}

				// 🆕 调用后端接口获取车场编码
				const {
					apiConfig
				} = require('@/config/api.js');
				const response = await uni.request({
					url: apiConfig.baseURL + '/parking/yardInfo/yardCode',
					method: 'GET',
					data: {
						yardName: parkName
					},
					header: {
						'Content-Type': 'application/json',
						'Authorization': uni.getStorageSync('token')
					}
				});

				console.log('📡 查询车场编码接口响应:', response);

				if (response.statusCode === 200 && response.data.data && response.data.data.length > 0) {
					const parkCode = response.data.data[0]; // 接口返回 List<String>，取第一个
					console.log('✅ 获取到车场编码:', parkCode);
					return parkCode;
				} else {
					console.warn('⚠️ 未找到车场编码映射:', parkName);
					// 默认使用万象上东的编码
					return '2KST9MNP';
				}
			} catch (error) {
				console.error('❌ 获取车场编码失败:', error);
				// 出错时返回默认值
				return '2KST9MNP';
			}
		},

		// 🆕 选择黑名单类型
		selectBlacklistType(type) {
			this.selectedBlacklistType = type;
			console.log('✅ 选择黑名单类型:', type);
		},

		// 🆕 关闭黑名单类型选择弹窗
		closeBlacklistModal() {
			// 如果没有选择类型且开启了拉黑，需要关闭拉黑开关
			if (!this.selectedBlacklistType && this.formData.shouldBlacklist) {
				this.formData.shouldBlacklist = false;
				this.formData.blacklistReason = '';
				uni.showToast({
					title: '已取消拉黑',
					icon: 'none',
					duration: 1500
				});
			}
			this.showBlacklistTypeModal = false;
		},

		// 🆕 确认选择黑名单类型
		confirmBlacklistType() {
			if (!this.selectedBlacklistType) {
				uni.showToast({
					title: '请选择黑名单类型',
					icon: 'none',
					duration: 1500
				});
				return;
			}

			this.showBlacklistTypeModal = false;
			uni.showToast({
				title: `已选择: ${this.selectedBlacklistType.name}`,
				icon: 'success',
				duration: 1500
			});
		},

		// 🆕 添加车辆到黑名单
		async addToBlacklist() {
			console.log('🚫 开始添加车辆到黑名单...');

			try {
				// 获取车场编码
				const parkCode = await this.getCurrentParkCode();
				if (!parkCode) {
					throw new Error('无法获取当前车场信息');
				}

				// 获取车主姓名
				const carOwner = this.ownerInfo?.name || '未知车主';

				// 构建请求参数
				const params = {
					parkCode: parkCode,
					carCode: this.formData.plateNumber,
					carOwner: carOwner,
					isPermament: '1', // 默认永久拉黑
					timePeriod: '',
					reason: this.formData.blacklistReason,
					remark1: '违规拉黑',
					remark2: `违规类型: ${this.getViolationTypeName()}`,
					specialCarTypeId: this.selectedBlacklistType.id
				};

				console.log('📤 黑名单添加参数:', params);

				// 调用后端接口添加黑名单
				const response = await uni.request({
					url: 'https://www.xuerparking.cn:8543/parking/blackList/addBlackListCar',
					method: 'GET',
					data: params
				});

				console.log('📥 黑名单添加响应:', response);

				if (response.statusCode === 200 && response.data && response.data.data) {
					const result = response.data.data;
					if (result.message === '业务成功') {
						console.log('✅ 黑名单添加成功');
						this.blacklistSubmitSuccess = true;

						uni.showToast({
							title: '已成功加入黑名单',
							icon: 'success',
							duration: 2000
						});

						return true;
					} else {
						console.error('❌ 黑名单添加失败:', result.message);
						throw new Error(result.message || '添加黑名单失败');
					}
				} else {
					console.error('❌ 黑名单添加请求失败:', response);
					throw new Error('请求失败');
				}
			} catch (error) {
				console.error('❌ 添加黑名单异常:', error);
				this.blacklistSubmitSuccess = false;

				uni.showModal({
					title: '添加黑名单失败',
					content: error.message || '网络请求失败，请重试',
					showCancel: false,
					confirmText: '确定'
				});

				return false;
			}
		},

		// 🆕 车牌点击处理核心逻辑 - 实现用户需求
		async handlePlateClickLogic(plateNumber) {
			if (!plateNumber || plateNumber.length < 7) {
				return;
			}

			console.log('🎯 [车牌点击处理] 开始处理车牌:', plateNumber);

			// 显示加载提示
			uni.showLoading({
				title: '查询车辆信息...',
				mask: true
			});

			try {
				// 调用综合处理方法
				const result = await violationApi.handlePlateSelection(plateNumber);

				console.log('✅ [车牌点击处理] 处理结果:', result);

				// 隐藏加载提示
				uni.hideLoading();

				// 根据处理结果执行相应操作
				await this.processPlateClickResult(result, plateNumber);

			} catch (error) {
				console.error('❌ [车牌点击处理] 处理失败:', error);

				// 隐藏加载提示
				uni.hideLoading();

				// 显示错误信息
				uni.showModal({
					title: '查询失败',
					content: error.message || '网络错误，请稍后重试',
					showCancel: false,
					confirmText: '知道了'
				});
			}
		},

		// 🆕 处理车牌点击结果
		async processPlateClickResult(result, plateNumber) {
			switch (result.suggestedAction) {
				case 'use_appointment_data':
					// 有预约记录，根据预约记录填充信息
					await this.fillViolationFromAppointment(result, plateNumber);
					break;

				case 'use_onsite_data':
					// 车辆在场，根据在场信息填充违规记录
					await this.fillViolationFromOnSite(result, plateNumber);
					break;

				case 'show_not_onsite_warning':
					// 车辆未在场，显示警告
					this.showNotOnSiteWarning(plateNumber);
					break;

				case 'show_error':
					// 显示错误信息
					uni.showModal({
						title: '查询失败',
						content: result.message,
						showCancel: false,
						confirmText: '知道了'
					});
					break;

				default:
					console.warn('🤔 [车牌点击处理] 未知的处理动作:', result.suggestedAction);
			}
		},

		// 🆕 根据预约记录填充违规信息
		async fillViolationFromAppointment(result, plateNumber) {
			console.log('📋 [预约记录填充] 处理预约数据:', result.appointmentRecords);

			// 显示预约记录选择弹窗
			const appointmentOptions = result.appointmentRecords.map((record, index) => {
				const statusText = this.getAppointmentStatusText(record);
				const timeInfo = this.formatAppointmentTime(record);
				return `${record.recorddate || '未知日期'} ${statusText} ${timeInfo}`;
			});

			try {
				const selectedIndex = await this.showAppointmentSelection(appointmentOptions);
				const selectedRecord = result.appointmentRecords[selectedIndex];

				console.log('✅ [预约记录填充] 用户选择了预约记录:', selectedRecord);

				// 🔧 修复：设置预约车的时间信息到表单数据
				if (selectedRecord.arrivedate || selectedRecord.arrive_date || selectedRecord.arriveDate) {
					this.formData.enterTime = selectedRecord.arrivedate || selectedRecord.arrive_date ||
						selectedRecord.arriveDate;
					console.log('⏰ [预约记录填充] 设置进场时间:', this.formData.enterTime);
				}
				if (selectedRecord.leavedate || selectedRecord.leave_date || selectedRecord.leaveDate) {
					this.formData.leaveTime = selectedRecord.leavedate || selectedRecord.leave_date ||
						selectedRecord.leaveDate;
					console.log('⏰ [预约记录填充] 设置离场时间:', this.formData.leaveTime);
				}
				if (selectedRecord.recorddate || selectedRecord.visit_date || selectedRecord.recorddate) {
					this.formData.appointmentTime = selectedRecord.recorddate || selectedRecord.visit_date ||
						selectedRecord.recorddate;
					console.log('⏰ [预约记录填充] 设置预约时间:', this.formData.appointmentTime);
				}
				if (selectedRecord.id) {
					// 🔧 修复：保存预约记录ID用于关联
					this.selectedAppointmentId = selectedRecord.id;
					console.log('🔗 [预约记录填充] 设置预约记录ID:', this.selectedAppointmentId);
				}

				// 🔧 修复：设置车主ID到ownerInfo
				if (selectedRecord.ownerid || selectedRecord.owner_id || selectedRecord.ownerId) {
					const ownerId = selectedRecord.ownerid || selectedRecord.owner_id || selectedRecord.ownerId;
					if (this.ownerInfo) {
						this.ownerInfo.ownerId = ownerId;
						console.log('👤 [预约记录填充] 设置车主ID:', ownerId);
					}
				}

				// 自动填充位置信息
				if (selectedRecord.community && selectedRecord.building) {
					this.formData.location =
						`${selectedRecord.community} ${selectedRecord.building}栋${selectedRecord.units || ''}单元${selectedRecord.room || ''}室`;
				}

				// 根据预约状态建议违规类型
				this.suggestViolationTypeFromAppointment(selectedRecord);

				// 显示成功提示
				uni.showToast({
					title: '已根据预约记录填充信息',
					icon: 'success',
					duration: 2000
				});

			} catch (error) {
				console.log('ℹ️ [预约记录填充] 用户取消了选择');
			}
		},

		// 🆕 根据在场信息填充违规记录
		async fillViolationFromOnSite(result, plateNumber) {
			console.log('🚗 [在场信息填充] 处理在场数据:', result.onSiteData);

			// 🔧 修改：从recordList数组中获取进场时间并格式化
			let formattedEnterTime = null;
			let displayEnterTime = '未知';

			if (result.onSiteData && result.onSiteData.recordList && Array.isArray(result.onSiteData.recordList) &&
				result.onSiteData.recordList.length > 0) {
				console.log('✅ [在场信息填充] 检测到车辆在场，recordList有数据:', result.onSiteData.recordList);

				// 获取第一条记录的进场时间
				const firstRecord = result.onSiteData.recordList[0];
				const rawEnterTime = firstRecord.enterTime;

				console.log('📅 [在场信息填充] 原始进场时间:', rawEnterTime);

				if (rawEnterTime && typeof rawEnterTime === 'string') {
					// 将 yyyyMMddHHmmss 格式转换为 yyyy-mm-dd hh:mm:ss 格式
					formattedEnterTime = this.formatEnterTime(rawEnterTime);
					displayEnterTime = formattedEnterTime || rawEnterTime;

					console.log('✅ [在场信息填充] 格式化后的进场时间:', formattedEnterTime);
				}
			} else {
				console.log('⚠️ [在场信息填充] recordList为空或无数据，车辆可能不在场');
			}

			// 记录格式化后的进场时间到表单数据中
			if (formattedEnterTime) {
				this.formData.enterTime = formattedEnterTime;
				console.log('⏰ [在场信息填充] 记录格式化进场时间到表单:', formattedEnterTime);
			}

			// 不再显示弹窗提示，让车主信息卡片自然显示即可
			console.log('✅ [在场信息填充] 已完成信息填充，车辆在场，进场时间:', displayEnterTime);
		},

		// 🆕 格式化进场时间：yyyyMMddHHmmss -> yyyy-mm-dd hh:mm:ss
		formatEnterTime(rawTime) {
			try {
				if (!rawTime || typeof rawTime !== 'string' || rawTime.length !== 14) {
					console.warn('⚠️ [时间格式化] 无效的时间格式:', rawTime);
					return null;
				}

				// 解析 yyyyMMddHHmmss 格式
				const year = rawTime.substring(0, 4);
				const month = rawTime.substring(4, 6);
				const day = rawTime.substring(6, 8);
				const hour = rawTime.substring(8, 10);
				const minute = rawTime.substring(10, 12);
				const second = rawTime.substring(12, 14);

				// 格式化为 yyyy-mm-dd hh:mm:ss
				const formattedTime = `${year}-${month}-${day} ${hour}:${minute}:${second}`;

				console.log(`✅ [时间格式化] ${rawTime} -> ${formattedTime}`);
				return formattedTime;

			} catch (error) {
				console.error('❌ [时间格式化] 格式化失败:', error, '原始时间:', rawTime);
				return null;
			}
		},

		// 🆕 显示车辆未在场警告
		showNotOnSiteWarning(plateNumber) {
			uni.showModal({
				title: '车辆未在场',
				content: `车牌 ${plateNumber} 当前未在场，无法添加违规记录。\n\n只有在场车辆才能添加违规记录。`,
				showCancel: false,
				confirmText: '重新选择',
				success: (res) => {
					if (res.confirm) {
						// 用户选择重新选择车牌
						this.formData.plateNumber = '';
						this.ownerInfo = null;
					}
				}
			});
		},

		// 🆕 显示预约记录选择弹窗
		showAppointmentSelection(options) {
			return new Promise((resolve, reject) => {
				uni.showActionSheet({
					itemList: options,
					success: (res) => {
						resolve(res.tapIndex);
					},
					fail: () => {
						reject(new Error('用户取消选择'));
					}
				});
			});
		},

		// 🆕 获取预约状态文本
		getAppointmentStatusText(record) {
			switch (record.venuestatus) {
				case '已入场':
					return '🚗 在场';
				case '已离场':
					return '✅ 已离场';
				case '未入场':
					return '⏳ 未进场';
				default:
					return record.venuestatus || '未知状态';
			}
		},

		// 🆕 格式化预约时间信息
		formatAppointmentTime(record) {
			if (record.arrivedate && record.leavedate) {
				return `${record.arrivedate} ~ ${record.leavedate}`;
			} else if (record.arrivedate) {
				return `进场: ${record.arrivedate}`;
			} else if (record.recorddate) {
				return `预约: ${record.recorddate}`;
			}
			return '';
		},

		// 🆕 根据预约状态建议违规类型
		suggestViolationTypeFromAppointment(record) {
			// 根据预约状态建议违规类型
			if (record.venuestatus === '已入场' || record.venuestatus === '在场中') {
				// 如果车辆在场，可能是超时停车
				const violationType = this.violationConfig.common.find(type => type.value === 'overtime');
				if (violationType) {
					this.formData.violationType = violationType.value;
					this.formData.description = `车辆超过预约时间仍在停车场内`;
				}
			} else if (record.venuestatus === '已离场') {
				// 如果车辆已离场，可能是其他违规行为
				uni.showToast({
					title: '车辆已离场，请选择相应违规类型',
					icon: 'none',
					duration: 2000
				});
			} else if (record.venuestatus === '未入场') {
				// 如果车辆未进场但有预约，可能是占用车位等
				const violationType = this.violationConfig.common.find(type => type.value === 'occupy_space');
				if (violationType) {
					this.formData.violationType = violationType.value;
					this.formData.description = `车辆未按预约进场但占用停车位`;
				}
			}
		},

	},

	onLoad() {
		this.initializePage();

		// 初始化状态栏高度
		const systemInfo = uni.getSystemInfoSync();
		this.statusBarHeight = systemInfo.statusBarHeight || 0;

		// 启动禁用状态检查定时器
		this.startDisabledCheckTimer();

		// 获取用户角色
		try {
			let userInfo = uni.getStorageSync('userInfo');

			// 如果userInfo为空，尝试从其他来源获取
			if (!userInfo) {
				console.log('⚠️ [页面加载] userInfo为空，尝试从其他来源获取');
				userInfo = this.getUserInfoFromAllSources();
			}

			if (userInfo && userInfo.role) {
				this.currentUserRole = userInfo.role;
			}
		} catch (error) {
			console.error('获取用户角色失败:', error);
			// 默认设置为巡逻员，因为这是违规添加页面
			this.currentUserRole = 'patrol';
		}
	},

	// 处理返回按钮点击事件 - 禁止返回
	onBackPress() {
		// 显示提示信息，告知用户需要通过底部导航栏切换
		uni.showToast({
			title: '请使用底部导航栏切换页面',
			icon: 'none',
			duration: 2000
		});

		return true; // 阻止默认返回行为
	},

	components: {
		'custom-tabbar': () => import('@/components/custom-tabbar.vue')
	}
}
</script>

<style lang="scss" scoped>
.container {
	min-height: 100vh;
	background: #f5f6fa;
	width: 100%;
}



/* 页面内容 */
.page-content {
	padding-top: 12rpx;
	padding-bottom: 140rpx;
	/* 增加底部内边距，确保不被TabBar遮挡 */
	padding-left: 16rpx;
	padding-right: 16rpx;
}

/* 提交按钮区域 */
.submit-section {
	padding: 20rpx 16rpx;
	background: #ffffff;
	border-top: 1rpx solid #f0f0f0;
}

.submit-btn {
	width: 100%;
	height: 72rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #0081ff, #1890ff);
	border-radius: 8rpx;
	font-size: 28rpx;
	font-weight: 600;
	color: #ffffff;
	transition: all 0.3s ease;
	box-shadow: 0 2rpx 8rpx rgba(0, 129, 255, 0.3);
}

.submit-btn.disabled {
	opacity: 0.5;
	background: #cccccc;
}

.appointment-reminder {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	background: #fef0f0;
	border: 2rpx solid #f56c6c;
	border-radius: 12rpx;
	padding: 20rpx;
	margin-bottom: 20rpx;
	animation: shake 0.5s ease-in-out infinite alternate;
}

.reminder-icon {
	font-size: 32rpx;
}

.reminder-text {
	font-size: 26rpx;
	color: #f56c6c;
	font-weight: 600;
}

@keyframes shake {
	0% {
		transform: translateX(0);
	}

	100% {
		transform: translateX(4rpx);
	}
}

/* 卡片样式 */
.section-card {
	background: #ffffff;
	border-radius: 10rpx;
	margin-bottom: 12rpx;
	box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.08);
	overflow: visible;
}

/* 违规类型区域特殊样式 */
.violation-type-section {
	transition: margin-top 0.3s ease;
}

.section-header {
	display: flex;
	align-items: center;
	padding: 20rpx 20rpx 12rpx;
	border-bottom: 1rpx solid #f0f0f0;
}

.header-icon {
	width: 36rpx;
	height: 36rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 10rpx;
}

.header-icon .icon-emoji {
	font-size: 28rpx;
}

.section-title {
	font-size: 28rpx;
	font-weight: 600;
	color: #333333;
}

/* 车牌信息样式 */
.input-group {
	padding: 20rpx;
	position: relative;
	z-index: 1;
}

.input-wrapper {
	display: flex;
	align-items: center;
	background: #f8f9fa;
	border-radius: 8rpx;
	padding: 0 16rpx;
	margin-bottom: 12rpx;
}

.plate-input {
	flex: 1;
	height: 68rpx;
	font-size: 28rpx;
	color: #333333;
}

.scan-btn {
	display: flex;
	align-items: center;
	padding: 10rpx 16rpx;
	background: #0081ff;
	border-radius: 6rpx;
	margin-left: 10rpx;
}

.scan-btn .icon-emoji {
	font-size: 24rpx;
	margin-right: 8rpx;
}

.btn-text {
	font-size: 24rpx;
	color: #ffffff;
}

.owner-info {
	position: relative;
	display: flex;
	align-items: stretch;
	background: linear-gradient(135deg, rgba(25, 118, 210, 0.18), rgba(0, 230, 255, 0.16));
	border-radius: 18rpx;
	padding: 20rpx 24rpx;
	overflow: hidden;
	border: 1rpx solid rgba(33, 150, 243, 0.35);
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
	backdrop-filter: blur(10rpx);
}

.owner-info::before {
	content: '';
	position: absolute;
	right: -40rpx;
	top: -40rpx;
	width: 160rpx;
	height: 160rpx;
	background: radial-gradient(circle, rgba(0, 229, 255, 0.65), transparent 65%);
	opacity: 0.6;
}

.owner-info-left {
	width: 120rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: flex-start;
	padding-right: 12rpx;
}

.owner-avatar {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	background: radial-gradient(circle at 30% 20%, #ffffff, #4fc3f748);
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 6rpx 16rpx rgba(25, 118, 210, 0.45);
	margin-bottom: 12rpx;
}

.owner-avatar-icon {
	font-size: 40rpx;
}

.owner-status-pills {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
	width: 100%;
}

.status-pill {
	padding: 4rpx 10rpx;
	border-radius: 20rpx;
	background: linear-gradient(90deg, #4caf5088, #8bc34a88);
	border: 1rpx solid rgba(129, 199, 132, 0.9);
	box-shadow: 0 2rpx 6rpx rgba(76, 175, 80, 0.35);
}

.status-pill-appointment {
	background: linear-gradient(90deg, #ffb30099, #ff704399);
	border-color: rgba(255, 193, 7, 0.9);
	box-shadow: 0 2rpx 6rpx rgba(255, 152, 0, 0.35);
}

.status-pill-online {
	background: linear-gradient(90deg, #00e5ff99, #2979ff99);
	border-color: rgba(33, 150, 243, 0.9);
	box-shadow: 0 2rpx 6rpx rgba(33, 150, 243, 0.4);
}

.status-pill-text {
	font-size: 20rpx;
	color: #ffffff;
}

.owner-info-divider {
	width: 2rpx;
	background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.9), transparent);
	margin: 0 16rpx;
	opacity: 0.8;
}

.owner-info-right {
	flex: 1;
	display: flex;
	flex-direction: column;
}

.owner-info-right .info-item {
	display: flex;
	align-items: flex-start;
	margin-bottom: 10rpx;
	text-align: left;
	padding: 10rpx 14rpx;
	border-radius: 14rpx;
	background: rgba(0, 0, 0, 0.06);
	border: 1rpx solid rgba(255, 255, 255, 0.08);
}

.owner-info-right .info-item:last-child {
	margin-bottom: 0;
}

.info-label {
	font-size: 22rpx;
	color: #b0bec5;
	margin-bottom: 4rpx;
}

.info-value {
	font-size: 28rpx;
	color: #1976d2;
	font-weight: 500;
	text-align: left;
	flex: 1;
}

.info-value-phone {
	color: #ff0000;
	text-decoration: underline;
}

.info-row-icon {
	width: 56rpx;
	height: 56rpx;
	border-radius: 16rpx;
	background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(0, 0, 0, 0.1));
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 14rpx;
	box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.25);
}

.info-row-icon-text {
	font-size: 30rpx;
}

.info-row-main {
	flex: 1;
	display: flex;
	flex-direction: column;
}

.info-row-icon-phone {
	background: linear-gradient(135deg, #4caf50aa, #81c784aa);
}

.info-row-icon-address {
	background: linear-gradient(135deg, #ff9800aa, #ffc107aa);
}

.info-row-icon-ticket {
	background: linear-gradient(135deg, #42a5f5aa, #7e57c2aa);
}

.info-row-icon-credit {
	background: linear-gradient(135deg, #ffca28aa, #ff7043aa);
}

.info-row-icon-time {
	background: linear-gradient(135deg, #00e5ffaa, #2979ffaa);
}

/* 信用分样式 */
.credit-excellent {
	color: #52c41a !important;
	font-weight: 600;
}

.credit-warning {
	color: #faad14 !important;
	font-weight: 600;
}

.credit-danger {
	color: #ff4d4f !important;
	font-weight: 600;
}

/* 违规类型样式 */
.violation-types {
	padding: 20rpx;
	position: relative;
	z-index: 10;
}

/* 已选择类型显示 */
.selected-type {
	margin-bottom: 16rpx;
}

.selected-display {
	display: flex;
	align-items: center;
	padding: 12rpx 16rpx;
	background: #e3f2fd;
	border-radius: 8rpx;
	border: 1rpx solid #0081ff;
}

.selected-icon {
	font-size: 24rpx;
	margin-right: 12rpx;
}

.selected-name {
	flex: 1;
	font-size: 26rpx;
	color: #0081ff;
	font-weight: 600;
}

.selected-check {
	font-size: 20rpx;
	color: #0081ff;
	font-weight: bold;
}

/* 搜索区域 */
.search-section {
	margin-bottom: 16rpx;
}

.search-container {
	display: flex;
	align-items: center;
	gap: 16rpx;
}

.search-box {
	display: flex;
	align-items: center;
	background: #f8f9fa;
	border-radius: 8rpx;
	padding: 0 16rpx;
	border: 1rpx solid #e0e0e0;
	flex: 1;
}

.search-icon {
	font-size: 24rpx;
	color: #999999;
	margin-right: 12rpx;
}

.search-input {
	flex: 1;
	height: 64rpx;
	font-size: 26rpx;
	color: #333333;
}

.search-clear {
	padding: 8rpx;
	color: #999999;
	font-size: 28rpx;
	font-weight: bold;
}

.search-cancel {
	padding: 12rpx 16rpx;
}

.cancel-text {
	font-size: 26rpx;
	color: #666666;
}

/* 搜索结果 */
.search-results {
	margin-bottom: 16rpx;
}

/* 无搜索结果提示 */
.no-results {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 40rpx 20rpx;
	text-align: center;
}

.no-results-icon {
	font-size: 48rpx;
	color: #cccccc;
	margin-bottom: 16rpx;
}

.no-results-text {
	font-size: 28rpx;
	color: #666666;
	margin-bottom: 8rpx;
	font-weight: 500;
}

.no-results-tip {
	font-size: 24rpx;
	color: #999999;
	line-height: 1.4;
}

/* 区域标签 */
.section-label {
	font-size: 24rpx;
	color: #666666;
	margin-bottom: 12rpx;
	font-weight: 500;
}

/* 标签容器 */
.type-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 8rpx;
}

/* 类型标签 */
.type-tag {
	display: flex;
	align-items: center;
	padding: 8rpx 16rpx;
	background: #f0f9ff;
	border: 1rpx solid #0081ff;
	border-radius: 20rpx;
	font-size: 24rpx;
	color: #0081ff;
	transition: all 0.3s ease;
	min-height: 48rpx;
}

.type-tag.selected {
	background: #0081ff;
	color: #ffffff;
}

.type-tag.more {
	background: #f8f9fa;
	border-color: #cccccc;
	color: #666666;
}

.tag-icon {
	font-size: 20rpx;
	margin-right: 6rpx;
}

.tag-text {
	font-size: 22rpx;
	white-space: nowrap;
}

/* 分割线 */
.divider {
	height: 1rpx;
	background: #f0f0f0;
	margin: 16rpx 0;
}

/* 搜索入口 */
.search-entry {
	margin-top: 8rpx;
}

.search-trigger {
	display: flex;
	align-items: center;
	padding: 12rpx 16rpx;
	background: #f8f9fa;
	border-radius: 8rpx;
	border: 1rpx dashed #cccccc;
}

.search-trigger .search-icon {
	font-size: 24rpx;
	color: #999999;
	margin-right: 12rpx;
}

.search-text {
	font-size: 24rpx;
	color: #999999;
}

.custom-type-input {
	background: #f8f9fa;
	border-radius: 12rpx;
	padding: 0 24rpx;
}

.custom-input {
	width: 100%;
	height: 88rpx;
	font-size: 28rpx;
	color: #333333;
}

/* 位置输入样式 */
.location-input-group {
	padding: 20rpx;
	position: relative;
	z-index: 1000;
}

.location-wrapper {
	display: flex;
	align-items: center;
	background: #ffffff;
	border: 2rpx solid #e4e7ed;
	border-radius: 12rpx;
	padding: 0 16rpx;
	position: relative;
	transition: all 0.3s ease;
}

.location-wrapper.focused {
	border-color: #2979ff;
	box-shadow: 0 0 0 4rpx rgba(41, 121, 255, 0.1);
}

.location-wrapper.hasText {
	border-color: #2979ff;
}

.location-input {
	flex: 1;
	height: 88rpx;
	font-size: 32rpx;
	color: #303133;
	background: transparent;
	border: none;
	outline: none;
	padding-right: 10rpx;
	/* 为清空按钮留出空间 */
}

.location-input::placeholder {
	color: #c0c4cc;
	font-size: 30rpx;
}

/* 清空位置按钮 */
.clear-location-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 40rpx;
	height: 40rpx;
	border-radius: 50%;
	background: rgba(200, 201, 204, 0.1);
	transition: all 0.2s ease;
	margin-right: 10rpx;
	z-index: 10;
	cursor: pointer;
}

.clear-location-btn:active {
	background: rgba(200, 201, 204, 0.2);
	transform: scale(0.95);
}

/* 定位按钮样式已移除，改为手动输入模式 */

/* 位置建议下拉框样式 */
.location-suggestions {
	position: absolute;
	top: 100%;
	left: 0;
	right: 0;
	background: #ffffff;
	border-radius: 8rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.12);
	z-index: 1001;
	margin-top: 6rpx;
	border: 1rpx solid #e8e8e8;
	overflow: hidden;
}

.suggestions-scroll {
	max-height: 320rpx;
}

.location-suggestion-item {
	display: flex;
	align-items: center;
	padding: 12rpx 16rpx;
	border-bottom: 1rpx solid #f0f0f0;
	cursor: pointer;
	transition: all 0.3s ease;
}

.location-suggestion-item:last-child {
	border-bottom: none;
}

.location-suggestion-item:active {
	background: #f8f9ff;
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
}

.suggestion-icon .icon-emoji {
	font-size: 20rpx;
}

.suggestion-content {
	flex: 1;
}

.suggestion-text {
	font-size: 24rpx;
	color: #333;
	margin-bottom: 2rpx;
	display: block;
}

.suggestion-arrow {
	color: #ccc;
}

.suggestion-arrow .icon-emoji {
	font-size: 16rpx;
}

.suggestions-footer {
	padding: 8rpx 16rpx;
	background: #f8f9fa;
	border-top: 1rpx solid #e8e8e8;
}

.footer-text {
	font-size: 20rpx;
	color: #666;
}

/* 现场取证样式 */
.evidence-section {
	padding: 20rpx;
}

.photo-upload {
	margin-bottom: 20rpx;
}

.upload-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 16rpx;
}

.upload-title {
	font-size: 28rpx;
	color: #333333;
	font-weight: 500;
}

.photo-count {
	font-size: 24rpx;
	color: #999999;
}

.photo-grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 10rpx;
}

.photo-item {
	position: relative;
	width: 100%;
	height: 120rpx;
	border-radius: 6rpx;
	overflow: hidden;
}

.photo-image {
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

.photo-delete .icon-emoji {
	font-size: 20rpx;
	color: #ffffff;
}

.photo-add {
	width: 100%;
	height: 120rpx;
	border: 2rpx dashed #cccccc;
	border-radius: 6rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background: #fafafa;
}

.add-icon {
	font-size: 40rpx;
	color: #cccccc;
	margin-bottom: 8rpx;
}

.add-text {
	font-size: 24rpx;
	color: #999999;
}



.voice-player {
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	padding: 20rpx 24rpx;
	background: #e8f5e8;
	border-radius: 12rpx;
}

.voice-info {
	display: flex;
	align-items: center;
}

.voice-info .icon-emoji {
	font-size: 28rpx;
	margin-right: 12rpx;
	color: #19be6b;
}

.voice-duration {
	font-size: 28rpx;
	color: #19be6b;
	font-weight: 500;
}

.voice-actions {
	display: flex;
	gap: 16rpx;
}

.voice-action-btn {
	width: 48rpx;
	height: 48rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #19be6b;
	border-radius: 24rpx;
}

.voice-action-btn.delete {
	background: #ff4d4f;
}

.voice-action-btn .icon-emoji {
	font-size: 24rpx;
}

/* 描述输入样式 */
.description-input {
	padding: 20rpx;
}

.description-textarea {
	width: 100%;
	min-height: 120rpx;
	padding: 16rpx;
	background: #f8f9fa;
	border-radius: 8rpx;
	font-size: 26rpx;
	color: #333333;
	line-height: 1.4;
}

/* 描述模板样式 */
.description-templates {
	margin-top: 20rpx;
}

.template-label {
	font-size: 24rpx;
	color: #909399;
	margin-bottom: 12rpx;
	display: block;
}

.template-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
}

.template-tag {
	background: #f0f9ff;
	border: 2rpx solid #e1f5fe;
	border-radius: 20rpx;
	padding: 8rpx 16rpx;
	transition: all 0.2s ease;
}

.template-tag:active {
	background: #e3f2fd;
	border-color: #1976d2;
	transform: scale(0.95);
}

.template-text {
	font-size: 24rpx;
	color: #1976d2;
}

/* 车牌扫描弹窗样式 */
.scan-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.6);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 2000;
}

.scan-content {
	width: 90%;
	max-width: 700rpx;
	max-height: 90vh;
	background: #ffffff;
	border-radius: 16rpx;
	overflow: hidden;
}

.scan-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 32rpx;
	background: #f8f9fa;
	border-bottom: 1rpx solid #f0f0f0;
}

.scan-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #333333;
}

.scan-close {
	width: 48rpx;
	height: 48rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #f0f0f0;
	border-radius: 24rpx;
}

.scan-close .icon-emoji {
	font-size: 28rpx;
	color: #666666;
}

.scan-area {
	padding: 40rpx;
	text-align: center;
}

.scan-frame {
	width: 400rpx;
	height: 200rpx;
	border: 4rpx solid #0081ff;
	border-radius: 12rpx;
	margin: 0 auto 20rpx;
	position: relative;
	overflow: hidden;
}

.scan-line {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 4rpx;
	background: linear-gradient(90deg, transparent, #0081ff, transparent);
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
	font-size: 28rpx;
	color: #666666;
}

.scan-result {
	padding: 24rpx 40rpx;
	background: #f0f9ff;
	border-top: 1rpx solid #e6f7ff;
	text-align: center;
}

.result-label {
	font-size: 24rpx;
	color: #666666;
	margin-right: 12rpx;
}

.result-text {
	font-size: 32rpx;
	font-weight: 600;
	color: #0081ff;
}

.scan-actions {
	display: flex;
	padding: 32rpx;
	gap: 16rpx;
}

.scan-action-btn {
	flex: 1;
	height: 80rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 12rpx;
	font-size: 28rpx;
	font-weight: 500;
	background: #f8f9fa;
	color: #666666;
	transition: all 0.3s ease;
}

.scan-action-btn.primary {
	background: #0081ff;
	color: #ffffff;
}

.scan-action-btn.scanning {
	background: #ff9500;
	color: #ffffff;
}

/* 摄像头界面样式 */
.camera-container {
	position: relative;
	width: 100%;
	height: 800rpx;
	background: #000;
	border-radius: 12rpx;
	overflow: hidden;
}

.camera-preview {
	width: 100%;
	height: 100%;
	position: relative;
}

.plate-frame {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: 450rpx;
	height: 180rpx;
	border: 4rpx solid #00ff00;
	border-radius: 8rpx;
}

.frame-corner {
	position: absolute;
	width: 40rpx;
	height: 40rpx;
	border: 6rpx solid #00ff00;
}

.frame-corner.tl {
	top: -6rpx;
	left: -6rpx;
	border-right: none;
	border-bottom: none;
}

.frame-corner.tr {
	top: -6rpx;
	right: -6rpx;
	border-left: none;
	border-bottom: none;
}

.frame-corner.bl {
	bottom: -6rpx;
	left: -6rpx;
	border-right: none;
	border-top: none;
}

.frame-corner.br {
	bottom: -6rpx;
	right: -6rpx;
	border-left: none;
	border-top: none;
}

.frame-text {
	position: absolute;
	bottom: -60rpx;
	left: 50%;
	transform: translateX(-50%);
	color: #fff;
	font-size: 28rpx;
	white-space: nowrap;
	text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.8);
}

/* 自动识别状态指示器 */
.auto-status {
	position: absolute;
	top: 80rpx;
	right: 20rpx;
	display: flex;
	align-items: center;
	gap: 10rpx;
	background: rgba(0, 0, 0, 0.6);
	padding: 10rpx 20rpx;
	border-radius: 20rpx;
	backdrop-filter: blur(10rpx);
}

.status-dot {
	width: 20rpx;
	height: 20rpx;
	background: #00ff00;
	border-radius: 50%;
	animation: pulse 1.5s infinite;
}

@keyframes pulse {
	0% {
		opacity: 1;
		transform: scale(1);
	}

	50% {
		opacity: 0.7;
		transform: scale(1.2);
	}

	100% {
		opacity: 1;
		transform: scale(1);
	}
}

.status-text {
	color: #fff;
	font-size: 24rpx;
	font-weight: bold;
}

.camera-controls {
	display: flex;
	gap: 20rpx;
	padding: 20rpx;
	justify-content: center;
}

.capture-btn,
.close-btn {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 120rpx;
	height: 80rpx;
	border-radius: 12rpx;
	border: none;
	font-size: 24rpx;
	font-weight: bold;
	color: #fff;
	transition: all 0.3s ease;
}

.capture-btn {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.4);
}

.capture-btn:disabled {
	background: #999;
	box-shadow: none;
	opacity: 0.5;
}

.close-btn {
	background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
	box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.4);
}

.camera-icon,
.close-icon {
	font-size: 28rpx;
	margin-bottom: 8rpx;
}

.loading-overlay {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.7);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1002;
}

.loading-content {
	background: rgba(255, 255, 255, 0.9);
	padding: 40rpx 60rpx;
	border-radius: 20rpx;
	backdrop-filter: blur(10rpx);
}

.loading-text {
	font-size: 28rpx;
	color: #333;
	font-weight: bold;
}

/* 功能按钮样式 */
.function-buttons {
	padding: 20rpx;
}

/* ================ 车牌输入区域样式 ================ */

/* 车牌输入区域 */
.plate-input-section {
	margin-bottom: 20rpx;
}

/* 输入和操作按钮容器 */
.input-actions-container {
	display: flex;
	gap: 16rpx;
	align-items: flex-start;
}

/* 车牌搜索容器 */
.plate-search-container {
	position: relative;
	flex: 1;
	z-index: 1000;
}

/* 搜索输入框包装器 */
.search-input-wrapper {
	position: relative;
	display: flex;
	align-items: center;
	background: #ffffff;
	border: 2rpx solid #e4e7ed;
	border-radius: 12rpx;
	padding: 0 16rpx;
	transition: all 0.3s ease;
}

.search-input-wrapper.focused {
	border-color: #2979ff;
	box-shadow: 0 0 0 4rpx rgba(41, 121, 255, 0.1);
}

.search-input-wrapper.hasText {
	border-color: #2979ff;
}

/* 搜索输入框 */
.plate-search-input {
	flex: 1;
	height: 88rpx;
	font-size: 32rpx;
	color: #303133;
	background: transparent;
	border: none;
	outline: none;
	padding-right: 60rpx;
	/* 为清空按钮留出空间 */
}

.plate-search-input::placeholder {
	color: #c0c4cc;
	font-size: 30rpx;
}

/* 搜索图标 */
.search-icon {
	position: absolute;
	right: 16rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

/* 清空按钮 */
.clear-btn {
	position: absolute;
	right: 16rpx;
	top: 50%;
	transform: translateY(-50%);
	display: flex;
	align-items: center;
	justify-content: center;
	width: 40rpx;
	height: 40rpx;
	border-radius: 50%;
	background: rgba(200, 201, 204, 0.1);
	transition: all 0.2s ease;
	z-index: 10;
	cursor: pointer;
}

.clear-btn:active {
	background: rgba(200, 201, 204, 0.2);
	transform: scale(0.95);
}

/* 车牌识别按钮容器 */
.recognition-btn-container {
	flex-shrink: 0;
	position: relative;
	z-index: 1001;
}

/* 车牌识别按钮 */
.plate-recognition-btn {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 120rpx;
	height: 88rpx;
	background: #ffffff;
	border: 2rpx solid #2979ff;
	border-radius: 12rpx;
	transition: all 0.2s ease;
}

.plate-recognition-btn:active {
	background: #f0f7ff;
	transform: scale(0.98);
}

.plate-recognition-btn .btn-label {
	font-size: 24rpx;
	color: #2979ff;
	margin-top: 4rpx;
	font-weight: 500;
}

.plate-recognition-btn.disabled {
	background: #f5f7fa;
	border-color: #dcdfe6;
	opacity: 0.6;
	cursor: not-allowed;
}

.plate-recognition-btn.disabled:active {
	background: #f5f7fa;
	transform: none;
}

.plate-recognition-btn.disabled .btn-label {
	color: #909399;
}

/* ================ 搜索建议下拉框样式 ================ */

/* 搜索建议下拉框 */
.search-suggestions {
	position: absolute;
	top: 100%;
	left: 0;
	right: 0;
	background: #ffffff;
	border-radius: 8rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.12);
	z-index: 1001;
	margin-top: 6rpx;
	border: 1rpx solid #e8e8e8;
	overflow: hidden;
}

.suggestions-scroll {
	max-height: 320rpx;
}

/* 位置搜索建议下拉框样式已在上方定义，此处删除重复定义 */

/* 建议项样式 */
.suggestion-item {
	display: flex;
	align-items: center;
	padding: 12rpx 16rpx;
	border-bottom: 1rpx solid #f0f0f0;
	cursor: pointer;
	transition: all 0.3s ease;
}

.suggestion-item:last-child {
	border-bottom: none;
}

.suggestion-item:active {
	background: #f8f9ff;
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
}

.suggestion-icon .icon-emoji {
	font-size: 20rpx;
}

.suggestion-content {
	flex: 1;
}

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

.suggestion-arrow {
	color: #ccc;
}

.suggestion-arrow .icon-emoji {
	font-size: 16rpx;
}

/* 建议底部 */
.suggestions-footer {
	padding: 8rpx 16rpx;
	background: #f8f9fa;
	border-top: 1rpx solid #e8e8e8;
}

.footer-text {
	font-size: 20rpx;
	color: #666;
}

/* 位置建议项样式已在上方定义，此处删除重复 */

/* ================ 车牌识别弹窗样式 ================ */

/* 全屏识别弹窗 */
.plate-recognition-fullscreen {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 9999;
	background: rgba(0, 0, 0, 0.5);
}

/* 全屏摄像头容器 */
.camera-container-fullscreen {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	width: 100%;
	height: 100vh;
	overflow: hidden;
	background: #000000;
	z-index: 1;
}

.plate-recognition-modal {
	padding: 20rpx;
	text-align: center;
}

/* 摄像头容器 */
.camera-container {
	position: relative;
	width: 100%;
	height: 800rpx;
	border-radius: 12rpx;
	overflow: hidden;
	margin-bottom: 20rpx;
}

.camera-preview {
	width: 100%;
	height: 100%;
	border-radius: 12rpx;
}

/* 车牌框选区域 */
.plate-frame {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: 450rpx;
	height: 180rpx;
	border: 4rpx solid transparent;
}

.frame-corner {
	position: absolute;
	width: 40rpx;
	height: 40rpx;
	border: 4rpx solid #2979ff;
}

.frame-corner.tl {
	top: -4rpx;
	left: -4rpx;
	border-right: none;
	border-bottom: none;
}

.frame-corner.tr {
	top: -4rpx;
	right: -4rpx;
	border-left: none;
	border-bottom: none;
}

.frame-corner.bl {
	bottom: -4rpx;
	left: -4rpx;
	border-right: none;
	border-top: none;
}

.frame-corner.br {
	bottom: -4rpx;
	right: -4rpx;
	border-left: none;
	border-top: none;
}

.frame-text {
	position: absolute;
	bottom: -60rpx;
	left: 50%;
	transform: translateX(-50%);
	color: #2979ff;
	font-size: 24rpx;
	background: rgba(255, 255, 255, 0.9);
	padding: 8rpx 16rpx;
	border-radius: 20rpx;
}

/* 自动识别状态指示器 */
.auto-status {
	position: absolute;
	top: 80rpx;
	right: 20rpx;
	display: flex;
	align-items: center;
	background: rgba(0, 0, 0, 0.6);
	padding: 8rpx 16rpx;
	border-radius: 20rpx;
	z-index: 100;
}

.status-dot {
	width: 12rpx;
	height: 12rpx;
	background: #19be6b;
	border-radius: 50%;
	margin-right: 8rpx;
	animation: pulse 1.5s infinite;
}

@keyframes pulse {
	0% {
		opacity: 1;
	}

	50% {
		opacity: 0.5;
	}

	100% {
		opacity: 1;
	}
}

.auto-status .status-text {
	color: #ffffff;
	font-size: 24rpx;
}

/* 摄像头控制按钮 */
.camera-controls {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	display: flex;
	gap: 16rpx;
	justify-content: center;
	padding: 30rpx 20rpx;
	padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
	background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.6) 50%, rgba(0, 0, 0, 0) 100%);
	z-index: 100;
}

.control-btn {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 140rpx;
	height: 120rpx;
	border-radius: 16rpx;
	transition: all 0.2s ease;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.3);
}

.control-btn text {
	font-size: 22rpx;
	margin-top: 8rpx;
}

.capture-btn {
	background: #2979ff;
	color: #ffffff;
}

.capture-btn:active {
	background: #1e5bb8;
	transform: scale(0.95);
}

.capture-btn.disabled {
	background: #c0c4cc;
	pointer-events: none;
}

.auto-btn {
	background: #f5f7fa;
	color: #606266;
	border: 2rpx solid #e4e7ed;
}

.auto-btn.active {
	background: #19be6b;
	color: #ffffff;
	border-color: #19be6b;
}

.auto-btn:active {
	transform: scale(0.95);
}

.close-btn {
	position: absolute;
	top: 80rpx;
	left: 20rpx;
	width: 80rpx;
	height: 80rpx;
	background: rgba(245, 108, 108, 0.9);
	color: #ffffff;
	border-radius: 50%;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.3);
	z-index: 100;
}

.close-btn:active {
	background: #e85a5a;
	transform: scale(0.95);
}

/* 加载遮罩 */
.loading-overlay {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.6);
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 12rpx;
}

.loading-content {
	display: flex;
	flex-direction: column;
	align-items: center;
	color: #ffffff;
}

.loading-text {
	margin-top: 20rpx;
	font-size: 28rpx;
}

/* 识别选择界面 - 真正居中显示的弹窗 */
.recognition-options {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: 600rpx;
	display: flex;
	flex-direction: column;
	gap: 30rpx;
	padding: 80rpx 60rpx;
	border-radius: 24rpx;
	background: rgba(255, 255, 255, 0.98);
	box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.2);
	z-index: 1000;
}

.option-item {
	display: flex;
	align-items: center;
	padding: 36rpx 30rpx;
	background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
	border-radius: 16rpx;
	transition: all 0.3s ease;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
	border: 2rpx solid #e9ecef;
}

.option-item:last-child {
	margin-bottom: 0;
}

.option-item:active {
	transform: scale(0.96);
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.12);
	background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
}

.option-icon {
	margin-right: 24rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.option-content {
	flex: 1;
	text-align: left;
	display: flex;
	flex-direction: column;
	gap: 4rpx;
}

.option-title {
	font-size: 32rpx;
	color: #303133;
	font-weight: 600;
}

.option-desc {
	font-size: 24rpx;
	color: #909399;
}

/* 识别结果 - 真正居中显示的弹窗 */
.recognition-result {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: 620rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 50rpx 30rpx 40rpx;
	border-radius: 24rpx;
	background: rgba(255, 255, 255, 0.98);
	box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.2);
	z-index: 1000;
}

.recognition-result .result-header {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	margin-bottom: 30rpx;
}

.recognition-result .result-title {
	font-size: 32rpx;
	color: #19be6b;
	font-weight: 600;
}

/* 车牌号码容器 */
.result-plate-container {
	width: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: 30rpx;
}

/* 车牌预览样式 - 参考form.vue */
.recognition-result .preview-car-plate {
	width: 520rpx;
	height: 100rpx;
	margin: 0 auto 20rpx;
	border-radius: 12rpx;
	border: 3rpx solid;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
	position: relative;
	overflow: hidden;
}

.recognition-result .preview-plate-text {
	display: flex;
	justify-content: center;
	align-items: center;
	width: 95%;
	height: 100%;
	gap: 4rpx;
}

.recognition-result .plate-char {
	flex: 1;
	text-align: center;
	font-size: 40rpx;
	font-weight: bold;
	font-family: 'Arial Black', sans-serif;
	letter-spacing: 0;
	line-height: 1;
}

/* 车牌信息文字 */
.recognition-result .plate-info {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 20rpx;
	margin-top: 8rpx;
}

.recognition-result .plate-color-text {
	font-size: 26rpx;
	color: #666;
	background: #f5f5f5;
	padding: 4rpx 12rpx;
	border-radius: 8rpx;
}

.recognition-result .plate-confidence-text {
	font-size: 26rpx;
	color: #19be6b;
	font-weight: 500;
}

/* 操作按钮样式 */
.recognition-result .result-actions {
	display: flex;
	gap: 20rpx;
	margin-top: 10rpx;
	width: 100%;
	padding: 0 20rpx;
	box-sizing: border-box;
}

.recognition-result .action-btn {
	flex: 1;
	min-width: 0;
	height: 88rpx;
	border-radius: 12rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s ease;
	border: none;
	white-space: nowrap;
	overflow: hidden;
}

.recognition-result .use-btn {
	background: linear-gradient(135deg, #2979ff, #5599ff);
	color: #fff;
	box-shadow: 0 4rpx 12rpx rgba(41, 121, 255, 0.3);
}

.recognition-result .use-btn:active {
	transform: scale(0.98);
	opacity: 0.9;
}

.recognition-result .retry-btn {
	background: #fff;
	color: #666;
	border: 2rpx solid #e0e0e0;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.recognition-result .retry-btn:active {
	background: #f5f5f5;
	transform: scale(0.98);
}

.recognition-result .btn-text {
	font-size: 28rpx;
	font-weight: 500;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.status-icon {
	width: 48rpx;
	height: 48rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 12rpx;
}

.status-icon.success {
	background: linear-gradient(135deg, #52c41a, #73d13d);
}

.status-text {
	font-size: 32rpx;
	color: #52c41a;
	font-weight: 600;
}

/* 车牌显示卡片 */
.plate-card {
	background: #f8f9fa;
	border-radius: 16rpx;
	padding: 24rpx;
	margin-bottom: 20rpx;
	position: relative;
	overflow: hidden;
}

/* 燃油车卡片样式 */
.blue-fuel-card {
	background: linear-gradient(135deg, #e6f4ff, #f0f8ff);
	border: 2rpx solid #1890ff;
}

/* 新能源车卡片样式 */
.green-energy-card {
	background: linear-gradient(135deg, #f6ffed, #f0fff0);
	border: 2rpx solid #52c41a;
}

/* 车牌头部信息 */
.plate-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16rpx;
}

/* 车牌类型徽章 */
.plate-type-badge {
	padding: 6rpx 16rpx;
	border-radius: 20rpx;
	font-size: 24rpx;
	font-weight: 500;
}

.blue-fuel-badge {
	background: #1890ff;
	color: #fff;
}

.green-energy-badge {
	background: #52c41a;
	color: #fff;
}

.badge-text {
	font-size: 22rpx;
}

/* 置信度徽章 */
.confidence-badge {
	padding: 6rpx 12rpx;
	background: rgba(0, 0, 0, 0.1);
	border-radius: 16rpx;
}

.confidence-text {
	font-size: 22rpx;
	color: #666;
	font-weight: 500;
}

/* 车牌号码显示 */
.plate-number-display {
	text-align: center;
	margin: 20rpx 0;
}

.plate-number {
	font-size: 48rpx;
	font-weight: bold;
	letter-spacing: 6rpx;
	padding: 12rpx 24rpx;
	border-radius: 12rpx;
	display: inline-block;
	font-family: 'Monaco', 'Consolas', monospace;
}

/* 燃油车车牌号样式 */
.blue-fuel-number {
	background: #1890ff;
	color: #fff;
	box-shadow: 0 4rpx 12rpx rgba(24, 144, 255, 0.3);
}

/* 新能源车车牌号样式 */
.green-energy-number {
	background: #52c41a;
	color: #fff;
	box-shadow: 0 4rpx 12rpx rgba(82, 196, 26, 0.3);
}

/* 车牌信息 */
.plate-info {
	margin-top: 16rpx;
}

.info-item {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8rpx;
}

.info-text {
	font-size: 26rpx;
	color: #666;
}

/* 操作按钮 */
.result-actions {
	display: flex;
	gap: 16rpx;
	margin-top: 24rpx;
}

.action-btn {
	flex: 1;
	height: 88rpx;
	border-radius: 12rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8rpx;
	font-size: 28rpx;
	font-weight: 500;
	transition: all 0.3s ease;
	border: none;
}

.primary-btn {
	background: linear-gradient(135deg, #1890ff, #40a9ff);
	color: #fff;
	box-shadow: 0 4rpx 12rpx rgba(24, 144, 255, 0.3);
}

.primary-btn:active {
	transform: translateY(2rpx);
	box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.4);
}

.secondary-btn {
	background: #f5f5f5;
	color: #666;
	border: 2rpx solid #d9d9d9;
}

.secondary-btn:active {
	background: #e6e6e6;
	transform: translateY(2rpx);
}

.btn-text {
	font-size: 28rpx;
}

/* 识别操作按钮 */
.recognition-actions {
	margin-top: 40rpx;
}

.recognition-btn {
	width: 100%;
	height: 88rpx;
	background: #2979ff;
	color: #ffffff;
	border: none;
	border-radius: 12rpx;
	font-size: 32rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s ease;
}

.recognition-btn:active {
	background: #1e5bb8;
	transform: scale(0.98);
}

.recognition-btn.disabled {
	background: #c0c4cc;
	color: #ffffff;
	pointer-events: none;
}

.btn-text {
	margin-left: 12rpx;
}

/* ================ 车牌键盘样式 ================ */

/* 键盘输入容器 */
.keyboard-input-container {
	display: flex;
	align-items: center;
	background: #f8f9fa;
	border-radius: 8rpx;
	padding: 0 16rpx;
	margin-bottom: 12rpx;
}

.xm-keyboard-v2 {
	flex: 1;
	margin: 0;
}

.keyboard-input-wrapper {
	width: 100%;
	margin: 0;
}

/* 车牌类型选择器 */
.plate-type-selector {
	margin-top: 20rpx;
}

.color-car-button {
	display: flex;
	justify-content: space-between;
	gap: 10rpx;
	flex-wrap: wrap;
}

.blue-car,
.yellow-car,
.white-car,
.black-car,
.green-car {
	flex: 1;
	min-width: 100rpx;
	height: 60rpx;
	border-radius: 8rpx;
	border: 2rpx solid #e0e0e0;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #f8f9fa;
	transition: all 0.3s ease;
}

.blue-car-text,
.yellow-car-text,
.white-car-text,
.black-car-text,
.green-car-text {
	font-size: 24rpx;
	font-weight: bold;
	color: #666;
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

/* 确认弹窗样式 */
.confirm-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.6);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 2000;
}

.confirm-content {
	width: 80%;
	max-width: 500rpx;
	background: #ffffff;
	border-radius: 16rpx;
	overflow: hidden;
}

.confirm-header {
	padding: 32rpx 32rpx 24rpx;
	text-align: center;
	border-bottom: 1rpx solid #f0f0f0;
}

.confirm-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #333333;
}

.confirm-body {
	padding: 32rpx;
	text-align: center;
}

.confirm-text {
	font-size: 28rpx;
	color: #666666;
	margin-bottom: 24rpx;
}

.confirm-info {
	background: #f8f9fa;
	border-radius: 12rpx;
	padding: 24rpx;
	text-align: left;
}

.info-text {
	display: block;
	font-size: 26rpx;
	color: #333333;
	margin-bottom: 8rpx;
}

.info-text:last-child {
	margin-bottom: 0;
}

.confirm-actions {
	display: flex;
	border-top: 1rpx solid #f0f0f0;
}

.confirm-btn {
	flex: 1;
	height: 88rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 28rpx;
	font-weight: 500;
	transition: all 0.3s ease;
}

.confirm-btn.cancel {
	color: #666666;
	background: #f8f9fa;
	border-right: 1rpx solid #f0f0f0;
}

.confirm-btn.primary {
	color: #ffffff;
	background: #0081ff;
}

/* 自定义导航栏样式 */
.custom-navbar {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	background: #0081ff;
	z-index: 9999;
}

.navbar-content {
	height: 44px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 16px;
}

.navbar-left {
	width: 60px;
	display: flex;
	align-items: center;
}

.navbar-center {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: flex-start;
	padding-left: 60px;
}

.navbar-right {
	width: 60px;
	display: flex;
	align-items: center;
	justify-content: flex-end;
}

.debug-btn {
	width: 40px;
	height: 40px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.2);
	transition: background 0.3s ease;
	margin-left: 8px;
}

.debug-btn:active {
	background: rgba(255, 255, 255, 0.3);
}

.debug-icon {
	color: #ffffff;
	font-size: 18px;
}

.navbar-title {
	color: #ffffff;
	font-size: 18px;
	font-weight: 600;
}

.navbar-back {
	width: 40px;
	height: 40px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.2);
	transition: background 0.3s ease;
}

.navbar-back:active {
	background: rgba(255, 255, 255, 0.3);
}

.back-icon {
	color: #ffffff;
	font-size: 24px;
	font-weight: bold;
}

.navbar-back-disabled {
	width: 40px;
	height: 40px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	opacity: 0.3;
	/* 灰色显示，表示禁用状态 */
}

.back-icon-disabled {
	color: #ffffff;
	font-size: 24px;
	font-weight: bold;
}

/* 响应式适配 */
@media (max-width: 750rpx) {
	.type-grid {
		grid-template-columns: 1fr;
	}

	.photo-grid {
		grid-template-columns: repeat(2, 1fr);
	}
}

/* ================ 搜索弹窗样式 ================ */
.search-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9999;
}

.search-modal-content {
	width: 95%;
	max-width: 750rpx;
	background: #fff;
	border-radius: 20rpx;
	overflow: hidden;
	animation: modalShow 0.3s ease-out;
}

@keyframes modalShow {
	from {
		opacity: 0;
		transform: scale(0.8) translateY(100rpx);
	}

	to {
		opacity: 1;
		transform: scale(1) translateY(0);
	}
}

.search-modal-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 30rpx 40rpx 20rpx;
	border-bottom: 1rpx solid #f0f0f0;
}

.search-modal-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
}

.search-modal-close {
	padding: 10rpx;
	border-radius: 50%;
	background: #f8f9fa;
	cursor: pointer;
}

.search-modal-body {
	padding: 40rpx;
	max-height: 75vh;
	overflow: hidden;
}

.search-input-container {
	display: flex;
	align-items: center;
	background: #f8f9fa;
	border-radius: 16rpx;
	padding: 0 20rpx;
	margin-bottom: 30rpx;
}

.search-modal-input {
	flex: 1;
	height: 80rpx;
	font-size: 28rpx;
	color: #333;
	background: transparent;
	border: none;
}

.search-btn {
	padding: 15rpx;
	border-radius: 50%;
	background: #e3f2fd;
	margin-left: 15rpx;
}

.search-results {
	max-height: 65vh;
	overflow: hidden;
}

.result-header {
	margin-bottom: 20rpx;
}

.result-count {
	font-size: 24rpx;
	color: #666;
}

.results-scroll {
	max-height: 600rpx;
}

.result-item {
	display: flex;
	align-items: flex-start;
	padding: 24rpx 0;
	border-bottom: 1rpx solid #f0f0f0;
	cursor: pointer;
	transition: all 0.3s ease;
	border-radius: 8rpx;
	margin: 0 -16rpx;
	padding-left: 16rpx;
	padding-right: 16rpx;
}

.result-item:hover {
	background: #f8fbff;
	transform: translateY(-2rpx);
	box-shadow: 0 4rpx 12rpx rgba(33, 111, 239, 0.1);
}

.result-item:last-child {
	border-bottom: none;
}

.result-icon {
	width: 72rpx;
	height: 72rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #e3f2fd, #bbdefb);
	border-radius: 50%;
	margin-right: 24rpx;
	box-shadow: 0 2rpx 8rpx rgba(33, 150, 243, 0.15);
}

.result-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 12rpx;
}

.result-plate,
.result-location {
	font-size: 28rpx;
	color: #333;
	font-weight: 500;
	margin-bottom: 5rpx;
}

/* 🆕 车牌号码字符拆分显示样式 */
.result-plate-number {
	padding: 10rpx 16rpx;
	border-radius: 12rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 600;
	font-size: 26rpx;
	letter-spacing: 2rpx;
	box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
}

.result-plate-number.green-plate {
	background: linear-gradient(to bottom, #d0f1e4, #6ad390);
	border: 2rpx solid #6ad390;
}

.result-plate-number.blue-plate {
	background: linear-gradient(to bottom, #216fef, #0c4fc5);
	border: 2rpx solid #216fef;
}



.result-owner {
	font-size: 24rpx;
	color: #666;
	margin-bottom: 8rpx;
}

/* 🆕 月票车搜索结果样式 */

/* 车辆类型标签样式 */
.vehicle-tag,
.owner-vehicle-tag {
	display: inline-flex;
	align-items: center;
	padding: 4rpx 12rpx;
	border-radius: 20rpx;
	font-size: 20rpx;
	font-weight: 500;
	margin-left: 12rpx;
}

.monthly-tag {
	background: linear-gradient(135deg, #4CAF50, #45a049);
	color: white;
	box-shadow: 0 2rpx 4rpx rgba(76, 175, 80, 0.3);
}

.appointment-tag {
	background: linear-gradient(135deg, #FF9800, #f57c00);
	color: white;
	box-shadow: 0 2rpx 4rpx rgba(255, 152, 0, 0.3);
}

.in-site-tag {
	background: linear-gradient(135deg, #2196F3, #1976D2);
	color: white;
	box-shadow: 0 2rpx 4rpx rgba(33, 150, 243, 0.3);
}

.tag-text {
	font-size: 20rpx;
	font-weight: 500;
}

/* 车主姓名行样式 */
.owner-name-row {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	margin-bottom: 8rpx;
}

.owner-name {
	font-size: 32rpx;
	color: #1976d2;
	font-weight: 600;
}

/* 车位信息样式 */
.parking-spots {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	margin-top: 8rpx;
	padding: 8rpx 12rpx;
	background: #f8f9fa;
	border-radius: 8rpx;
	border-left: 4rpx solid #4CAF50;
}

.spots-label {
	font-size: 24rpx;
	color: #666;
	margin-right: 8rpx;
	font-weight: 500;
}

.spot-item {
	font-size: 24rpx;
	color: #4CAF50;
	font-weight: 500;
	background: #e8f5e8;
	padding: 4rpx 8rpx;
	border-radius: 4rpx;
	margin-right: 8rpx;
	margin-bottom: 4rpx;
}

/* 业主信息中的标签样式调整 */
.owner-info .info-item {
	align-items: flex-start;
	text-align: left;
}

.owner-vehicle-tag,
.vehicle-status-tag {
	margin-left: 16rpx;
	margin-top: 2rpx;
	flex-shrink: 0;
}

/* 进场时间样式 */
.enter-time {
	color: #2196F3;
	font-weight: 500;
}

/* 🆕 月票车搜索结果样式 */
.result-ticket {
	font-size: 24rpx;
	color: #2979ff;
	margin-bottom: 6rpx;
}

.result-parking-spot {
	font-size: 24rpx;
	color: #ff6b35;
	margin-bottom: 6rpx;
}

.result-status {
	display: flex;
	flex-wrap: wrap;
	gap: 8rpx;
	margin-bottom: 8rpx;
}

.status-tag {
	font-size: 22rpx;
	padding: 6rpx 12rpx;
	border-radius: 12rpx;
	color: white;
	font-weight: 600;
	text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.2);
	box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
}

.status-tag.valid {
	background: #4caf50;
}

.status-tag.expired {
	background: #ff9800;
}

.status-tag.frozen {
	background: #f44336;
}

.status-tag.in-park {
	background: #2196f3;
}

.result-stats {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
}

.stat-item {
	font-size: 22rpx;
	color: #555;
	background: linear-gradient(135deg, #f8f9fa, #e9ecef);
	padding: 6rpx 12rpx;
	border-radius: 10rpx;
	border: 1rpx solid #e0e0e0;
	font-weight: 500;
}

.result-arrow {
	width: 40rpx;
	height: 40rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.search-empty {
	text-align: center;
	padding: 80rpx 0;
	background: linear-gradient(135deg, #f8fbff, #f0f7ff);
	border-radius: 16rpx;
	margin: 20rpx 0;
}

.empty-text {
	font-size: 30rpx;
	color: #666;
	font-weight: 500;
}

/* 修改原有输入框样式以适配点击态 */
.plate-display-input {
	flex: 1;
	display: flex;
	align-items: center;
	height: 92rpx;
	padding-right: 60rpx;
	/* 为搜索图标和清空按钮留出空间 */
}

.plate-text {
	font-size: 34rpx;
	color: #303133;
	font-weight: 600;
	letter-spacing: 1rpx;
}

.placeholder-text {
	font-size: 32rpx;
	color: #bbb;
	font-style: italic;
}

/* 违规位置直接输入框样式 */
.location-input {
	flex: 1;
	height: 92rpx;
	font-size: 34rpx;
	color: #303133;
	background: transparent;
	border: none;
	outline: none;
	padding-right: 50rpx;
	/* 为清空按钮留出空间 */
	font-weight: 500;
}

.location-input::placeholder {
	color: #bbb;
	font-size: 32rpx;
	font-style: italic;
}

.search-input-wrapper .search-icon {
	position: absolute;
	right: 60rpx;
	/* 在清空按钮左侧 */
	top: 50%;
	transform: translateY(-50%);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 5;
}

/* ================ 🆕 预约记录区域样式 ================ */

.appointment-records-card {
	border: 2rpx solid #2979ff;
	box-shadow: 0 4rpx 12rpx rgba(41, 121, 255, 0.1);
}

.appointment-records-card .section-header {
	position: relative;
}

.selection-status {
	position: absolute;
	right: 20rpx;
	top: 50%;
	transform: translateY(-50%);
}

.selected-badge {
	background: linear-gradient(135deg, #67c23a, #85ce61);
	color: white;
	font-size: 24rpx;
	padding: 10rpx 20rpx;
	border-radius: 24rpx;
	font-weight: 700;
	text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.2);
	box-shadow: 0 2rpx 6rpx rgba(103, 194, 58, 0.3);
}

.appointment-records-section {
	padding: 32rpx;
}

.records-tip-container {
	margin-bottom: 20rpx;
}

.records-tip {
	display: block;
	font-size: 28rpx;
	color: #2979ff;
	background: linear-gradient(135deg, #f0f9ff, #e3f2fd);
	padding: 20rpx 24rpx;
	border-radius: 12rpx;
	border-left: 6rpx solid #2979ff;
	margin-bottom: 12rpx;
	line-height: 1.5;
	font-weight: 700;
	box-shadow: 0 2rpx 8rpx rgba(41, 121, 255, 0.1);
}

.records-tip-detail {
	display: block;
	font-size: 26rpx;
	color: #f56c6c;
	background: linear-gradient(135deg, #fef0f0, #fde2e2);
	padding: 16rpx 24rpx;
	border-radius: 12rpx;
	border-left: 6rpx solid #f56c6c;
	line-height: 1.5;
	animation: blink 2s infinite;
	font-weight: 600;
	box-shadow: 0 2rpx 8rpx rgba(245, 108, 108, 0.15);
}

@keyframes blink {

	0%,
	50% {
		opacity: 1;
	}

	51%,
	100% {
		opacity: 0.6;
	}
}

.records-list {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.record-item {
	background: #ffffff;
	border: 2rpx solid #e4e7ed;
	border-radius: 16rpx;
	padding: 24rpx;
	transition: all 0.3s ease;
	cursor: pointer;
	position: relative;
	box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.02);
}

.record-item:hover {
	border-color: #2979ff;
	box-shadow: 0 4rpx 16rpx rgba(41, 121, 255, 0.12);
	transform: translateY(-2rpx);
}

.record-item.selected {
	border-color: #2979ff;
	background: linear-gradient(135deg, #f0f9ff, #e3f2fd);
	box-shadow: 0 6rpx 20rpx rgba(41, 121, 255, 0.2);
	transform: translateY(-1rpx);
}

.record-selection-indicator {
	position: absolute;
	top: 16rpx;
	right: 16rpx;
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.selection-radio {
	width: 36rpx;
	height: 36rpx;
	border: 3rpx solid #dcdfe6;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s ease;
	background: #ffffff;
}

.selection-radio.checked {
	border-color: #2979ff;
	background: #2979ff;
}

.radio-icon {
	color: #ffffff;
	font-size: 20rpx;
	font-weight: bold;
}

.selection-text {
	font-size: 22rpx;
	color: #909399;
	font-weight: 500;
}

.record-item.selected .selection-text {
	color: #2979ff;
	font-weight: 600;
}

.record-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12rpx;
}

.record-date {
	font-size: 28rpx;
	font-weight: 600;
	color: #303133;
}

.record-status {
	padding: 6rpx 12rpx;
	border-radius: 20rpx;
	font-size: 22rpx;
}

.status-completed {
	background: #f0f9ff;
	color: #2979ff;
	border: 1rpx solid #2979ff;
}

.status-parking {
	background: #fff7e6;
	color: #fa8c16;
	border: 1rpx solid #fa8c16;
}

.status-pending {
	background: #f6f6f6;
	color: #666;
	border: 1rpx solid #d9d9d9;
}

.status-default {
	background: #f6f6f6;
	color: #666;
	border: 1rpx solid #d9d9d9;
}

.record-address {
	display: flex;
	align-items: center;
	margin-bottom: 8rpx;
}

.record-address .icon-emoji {
	font-size: 20rpx;
	margin-right: 8rpx;
	color: #52c41a;
}

.address-text {
	font-size: 24rpx;
	color: #666;
	line-height: 1.4;
}

.record-time {
	margin-bottom: 8rpx;
}

.time-info {
	font-size: 22rpx;
	color: #999;
	background: #f5f5f5;
	padding: 4rpx 8rpx;
	border-radius: 4rpx;
	display: inline-block;
}

.violation-suggestion {
	margin-top: 12rpx;
	padding-top: 12rpx;
	border-top: 1rpx dashed #e4e7ed;
}

.suggestion-content {
	display: flex;
	align-items: center;
	padding: 8rpx 12rpx;
	border-radius: 8rpx;
	font-size: 22rpx;
}

.suggestion-severe {
	background: #fff2f0;
	color: #ff4d4f;
	border: 1rpx solid #ffccc7;
}

.suggestion-moderate {
	background: #fff7e6;
	color: #fa8c16;
	border: 1rpx solid #ffd591;
}

.suggestion-mild {
	background: #f6ffed;
	color: #52c41a;
	border: 1rpx solid #b7eb8f;
}

.suggestion-default {
	background: #f0f0f0;
	color: #666;
	border: 1rpx solid #d9d9d9;
}

.suggestion-icon {
	margin-right: 8rpx;
	font-size: 20rpx;
}

.suggestion-text {
	flex: 1;
	font-weight: 500;
}

.suggestion-level {
	font-size: 20rpx;
	opacity: 0.8;
}

.result-plate-number {
	display: inline-block;
	font-size: 28rpx;
	font-weight: bold;
	padding: 8rpx 16rpx;
	border-radius: 8rpx;
	font-family: "微软雅黑";
	letter-spacing: 1rpx;
	min-width: 160rpx;
	text-align: center;
	position: relative;
	transition: all 0.3s ease;
	margin-bottom: 8rpx;

	&.blue-plate {
		background: linear-gradient(135deg, #0C4FC5, #216FEF);
		color: #FFFFFF;
		border: 1px solid #0C4FC5;
		box-shadow: 0 4rpx 12rpx rgba(12, 79, 197, 0.2);
	}

	&.green-plate {
		background: linear-gradient(180deg, #6AD390 0%, #D0F1E4 100%);
		color: #000000;
		border: 1px solid #6AD390;
		box-shadow: 0 4rpx 12rpx rgba(82, 196, 26, 0.2);

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

.result-details {
	display: flex;
	flex-direction: column;
	gap: 4rpx;
}

.result-owner {
	font-size: 24rpx;
	color: #606266;
}

.result-appointments {
	font-size: 22rpx;
	color: #1890ff;
	font-weight: 500;
}

/* 加载更多按钮样式 */
.load-more-section {
	padding: 20rpx 16rpx;
	border-top: 1rpx solid #f0f0f0;
}

.load-more-btn {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 24rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 12rpx;
	transition: all 0.3s ease;
}

.load-more-btn:active {
	transform: scale(0.98);
	opacity: 0.8;
}

.load-more-text {
	font-size: 28rpx;
	color: #ffffff;
	font-weight: 600;
	margin-bottom: 6rpx;
}

.load-more-tip {
	font-size: 22rpx;
	color: rgba(255, 255, 255, 0.8);
}

.result-tip {
	font-size: 20rpx;
	color: #999;
	margin-left: 10rpx;
	font-style: italic;
}

/* 🆕 车主分组样式 */
.owner-group {
	margin-bottom: 12rpx;
}

.owner-frame {
	border: 4rpx solid #2979ff;
	border-radius: 24rpx;
	background: #fff;
	overflow: hidden;
	box-shadow: 0 4rpx 24rpx rgba(41, 121, 255, 0.1);
}

.owner-header {
	padding: 40rpx;
	background: linear-gradient(135deg, #f8fbff, #e8f4ff);
}

.owner-info {
	width: 100%;
}

.owner-name {
	font-size: 32rpx;
	font-weight: 600;
	color: #2979ff;
	margin-bottom: 16rpx;
	display: block;
}

.owner-details {
	display: flex;
	flex-wrap: wrap;
	gap: 20rpx;
	align-items: center;
}

.owner-ticket,
.owner-credit,
.owner-phone {
	font-size: 26rpx;
	color: #666;
	background: rgba(41, 121, 255, 0.1);
	padding: 8rpx 16rpx;
	border-radius: 24rpx;
	font-weight: 500;
}

.clickable-phone {
	cursor: pointer;
	transition: all 0.3s ease;
	background: linear-gradient(135deg, rgba(46, 204, 113, 0.15), rgba(39, 174, 96, 0.15));
	color: #27ae60;
	border: 1rpx solid rgba(39, 174, 96, 0.3);
}

.clickable-phone:hover {
	background: linear-gradient(135deg, rgba(46, 204, 113, 0.25), rgba(39, 174, 96, 0.25));
	transform: scale(1.05);
	border-color: rgba(39, 174, 96, 0.5);
	box-shadow: 0 2rpx 8rpx rgba(39, 174, 96, 0.2);
}

.clickable-phone:active {
	transform: scale(0.95);
}

.owner-divider {
	height: 2rpx;
	background: linear-gradient(to right, transparent, #e0e0e0, transparent);
	margin: 0 30rpx;
}

.plates-container {
	padding: 30rpx 40rpx;
	padding-top: 20rpx;
}

.plate-card {
	background: #fff;
	border: 2rpx solid #e8e8e8;
	border-radius: 16rpx;
	margin-bottom: 8rpx;
	transition: all 0.2s ease;
	cursor: pointer;
}

.plate-card:last-child {
	margin-bottom: 0;
}

.plate-card:hover {
	border-color: #2979ff;
	box-shadow: 0 4rpx 16rpx rgba(41, 121, 255, 0.15);
	transform: translateY(-2rpx);
}

.plate-card:active {
	transform: translateY(0) scale(0.98);
}

.plate-content {
	display: flex;
	align-items: center;
	padding: 24rpx 40rpx;
}

.plate-icon {
	font-size: 36rpx;
	margin-right: 24rpx;
}

.plate-number {
	font-size: 36rpx;
	font-weight: 700;
	padding: 12rpx 18rpx;
	border-radius: 12rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	letter-spacing: 2rpx;
	text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.1);
}

.plate-number.blue-plate {
	background: linear-gradient(to bottom, #216fef, #0c4fc5);
	color: #fff;
	border: 2rpx solid #216fef;
}

.plate-number.green-plate {
	background: linear-gradient(to bottom, #d0f1e4, #6ad390);
	color: #000;
	border: 2rpx solid #6ad390;
}

.blacklist-section {
	margin-top: 20rpx;
}

.blacklist-content {
	padding: 20rpx;
}

.blacklist-switch-container {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 30rpx;
	padding: 20rpx;
	background: #f8f9fa;
	border-radius: 12rpx;
}

.blacklist-switch-container.required-field {
	border: 2rpx solid #ff4757;
	background: #fff5f5;
}

.switch-label {
	display: flex;
	flex-direction: column;
	flex: 1;
}

.label-text {
	font-size: 28rpx;
	color: #333;
	margin-bottom: 8rpx;
	font-weight: 500;
}

.label-required {
	color: #ff4757;
	font-size: 30rpx;
	font-weight: bold;
	margin-left: 8rpx;
}

.label-desc {
	font-size: 24rpx;
	color: #666;
	line-height: 1.4;
}

.switch-wrapper {
	display: flex;
	align-items: center;
}

.blacklist-switch {
	transform: scale(0.9);
}

.blacklist-reason-container {
	margin-top: 20rpx;
	padding: 20rpx;
	background: #fff5f5;
	border: 2rpx solid #ffebee;
	border-radius: 12rpx;
}

.reason-header {
	display: flex;
	align-items: center;
	margin-bottom: 16rpx;
}

.reason-label {
	font-size: 28rpx;
	color: #333;
	font-weight: 500;
}

.reason-required {
	font-size: 24rpx;
	color: #ff4757;
	margin-left: 4rpx;
}

.reason-textarea {
	width: 100%;
	min-height: 120rpx;
	padding: 16rpx;
	background: #fff;
	border: 2rpx solid #ffebee;
	border-radius: 8rpx;
	font-size: 26rpx;
	color: #333;
	line-height: 1.4;
	box-sizing: border-box;
}

.reason-textarea:focus {
	border-color: #ff4757;
	background: #fff;
}

.reason-templates {
	margin-top: 20rpx;
}

.template-label {
	font-size: 24rpx;
	color: #666;
	margin-bottom: 12rpx;
	display: block;
}

.template-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
}

.template-tag {
	background: #fff;
	border: 2rpx solid #ffebee;
	border-radius: 20rpx;
	padding: 8rpx 16rpx;
	transition: all 0.2s ease;
}

.template-tag:active {
	background: #ffebee;
	border-color: #ff4757;
	transform: scale(0.95);
}

.template-text {
	font-size: 24rpx;
	color: #ff4757;
}



/* ========== API测试工具样式 ========== */
.floating-debug-btn {
	position: fixed;
	bottom: 120rpx;
	right: 30rpx;
	width: 120rpx;
	height: 120rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 60rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 20rpx rgba(102, 126, 234, 0.4);
	z-index: 999;
	transition: all 0.3s ease;
}

.floating-debug-btn:active {
	transform: scale(0.95);
	box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.6);
}

.debug-icon {
	font-size: 40rpx;
	margin-bottom: 4rpx;
}

.debug-label {
	font-size: 20rpx;
	color: white;
	font-weight: bold;
	text-align: center;
}

.api-test-modal {
	background: white;
	border-radius: 20rpx 20rpx 0 0;
	max-height: 80vh;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 30rpx 40rpx;
	border-bottom: 1px solid #eee;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
}

.modal-title {
	font-size: 32rpx;
	font-weight: bold;
}

.close-btn {
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(255, 255, 255, 0.2);
	border-radius: 30rpx;
}

.close-icon {
	font-size: 28rpx;
	color: white;
}

.test-input-section {
	margin-bottom: 30rpx;
	padding: 0 40rpx;
}

.input-row {
	display: flex;
	align-items: center;
	margin-bottom: 20rpx;
}

.input-label {
	width: 200rpx;
	font-size: 28rpx;
	color: #333;
}

.test-input {
	flex: 1;
	height: 70rpx;
	padding: 0 20rpx;
	border: 2rpx solid #e0e0e0;
	border-radius: 8rpx;
	font-size: 26rpx;
}

.test-buttons {
	display: flex;
	flex-wrap: wrap;
	gap: 20rpx;
	margin-bottom: 30rpx;
	padding: 0 40rpx;
}

.api-test-btn {
	flex: 1;
	min-width: 200rpx;
	height: 70rpx;
	border: 1rpx solid #e0e0e0;
	border-radius: 8rpx;
	background: white;
	font-size: 24rpx;
	color: #666;
}

.api-test-btn.primary {
	background: #2979ff;
	color: white;
	border-color: #2979ff;
}

.api-test-btn.secondary {
	background: #FF9500;
	color: white;
	border-color: #FF9500;
}

/* 测试建议样式 */
.test-suggestions {
	margin-top: 20px;
	padding: 15px;
	background: #f8f9fa;
	border-radius: 8px;
	border-left: 4px solid #007AFF;
}

.suggestions-title {
	font-size: 14px;
	font-weight: bold;
	color: #333;
	margin-bottom: 10px;
	display: block;
}

.suggestion-buttons {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	margin-bottom: 10px;
}

.suggestion-btn {
	padding: 6px 12px;
	background: #e3f2fd;
	border: 1px solid #2196F3;
	border-radius: 16px;
	font-size: 12px;
	color: #2196F3;
	cursor: pointer;
}

.suggestion-btn:active {
	background: #2196F3;
	color: white;
}

.suggestions-note {
	font-size: 12px;
	color: #666;
	line-height: 1.4;
	display: block;
}

.test-results {
	flex: 1;
	display: flex;
	flex-direction: column;
	padding: 0 40rpx 40rpx 40rpx;
}

.results-title {
	font-size: 28rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 20rpx;
}

.results-scroll {
	flex: 1;
	border: 1rpx solid #e0e0e0;
	border-radius: 8rpx;
	padding: 20rpx;
	background: #f8f9fa;
}

.result-item {
	margin-bottom: 20rpx;
	padding: 15rpx;
	background: white;
	border-radius: 8rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.result-item:last-child {
	margin-bottom: 0;
}

.result-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 10rpx;
}

.result-time {
	font-size: 22rpx;
	color: #999;
}

.result-api {
	font-size: 22rpx;
	color: #666;
	background: #f0f0f0;
	padding: 4rpx 8rpx;
	border-radius: 4rpx;
}

.result-status {
	font-size: 24rpx;
}

.result-status.success {
	color: #4caf50;
}

.result-status.error {
	color: #f44336;
}

.result-message {
	font-size: 24rpx;
	color: #333;
	line-height: 1.4;
	margin-bottom: 10rpx;
}

.result-data {
	background: #f8f9fa;
	padding: 10rpx;
	border-radius: 4rpx;
	border-left: 3rpx solid #2979ff;
}

.data-text {
	font-size: 22rpx;
	color: #666;
	line-height: 1.3;
	word-break: break-all;
}

/* 🚫 黑名单相关样式 */
.blacklist-section {
	margin-top: 30rpx;
	padding: 30rpx;
	background: #fff5f5;
	border: 2rpx solid #ffebee;
	border-radius: 16rpx;
	border-left: 8rpx solid #f44336;
}

.blacklist-title {
	display: flex;
	align-items: center;
	font-size: 32rpx;
	font-weight: bold;
	color: #d32f2f;
	margin-bottom: 20rpx;
}

.blacklist-title .icon {
	margin-right: 12rpx;
	font-size: 36rpx;
}

.blacklist-toggle {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #ffcdd2;
	margin-bottom: 20rpx;
}

.blacklist-toggle-label {
	font-size: 28rpx;
	color: #333;
	font-weight: 500;
}

.blacklist-details {
	animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
	from {
		opacity: 0;
		transform: translateY(-10rpx);
	}

	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.blacklist-type-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 20rpx;
	margin-bottom: 30rpx;
}

.blacklist-type-item {
	padding: 30rpx 20rpx;
	background: white;
	border: 2rpx solid #e0e0e0;
	border-radius: 12rpx;
	text-align: center;
	transition: all 0.3s ease;
	cursor: pointer;
}

.blacklist-type-item.selected {
	border-color: #f44336;
	background: #ffebee;
	transform: translateY(-2rpx);
	box-shadow: 0 6rpx 16rpx rgba(244, 67, 54, 0.2);
}

.blacklist-type-icon {
	font-size: 48rpx;
	margin-bottom: 12rpx;
	display: block;
}

.blacklist-type-name {
	font-size: 26rpx;
	font-weight: 500;
	color: #333;
	margin-bottom: 8rpx;
}

.blacklist-type-desc {
	font-size: 22rpx;
	color: #666;
	line-height: 1.4;
}

.blacklist-reason-container {
	margin-top: 20rpx;
}

.blacklist-reason-label {
	font-size: 28rpx;
	color: #333;
	margin-bottom: 15rpx;
	font-weight: 500;
}

.blacklist-reason-input {
	width: 100%;
	min-height: 120rpx;
	padding: 20rpx;
	border: 2rpx solid #e0e0e0;
	border-radius: 12rpx;
	font-size: 26rpx;
	line-height: 1.5;
	resize: vertical;
	transition: border-color 0.3s ease;
}

.blacklist-reason-input:focus {
	border-color: #f44336;
	outline: none;
}

.blacklist-warning {
	background: #fff3e0;
	border: 1rpx solid #ffcc02;
	border-radius: 8rpx;
	padding: 20rpx;
	margin-top: 20rpx;
	display: flex;
	align-items: flex-start;
}

.blacklist-warning-icon {
	color: #ff9800;
	font-size: 32rpx;
	margin-right: 12rpx;
	margin-top: 2rpx;
}

.blacklist-warning-text {
	font-size: 24rpx;
	color: #e65100;
	line-height: 1.5;
	flex: 1;
}

/* 黑名单类型容器样式 */
.blacklist-type-container {
	margin-top: 20rpx;
}

.type-header {
	display: flex;
	align-items: center;
	margin-bottom: 20rpx;
}

.type-label {
	font-size: 28rpx;
	color: #333;
	font-weight: 500;
}

.type-required {
	color: #ff4757;
	font-size: 28rpx;
	margin-left: 8rpx;
}

.loading-container {
	padding: 40rpx;
	text-align: center;
	background: #f8f9fa;
	border-radius: 12rpx;
	border: 2rpx dashed #ddd;
}

.loading-text {
	font-size: 26rpx;
	color: #666;
}

.no-types-container {
	padding: 40rpx;
	text-align: center;
	background: #f8f9fa;
	border-radius: 12rpx;
	border: 2rpx dashed #ddd;
}

.no-types-text {
	font-size: 26rpx;
	color: #666;
	margin-bottom: 20rpx;
	display: block;
}

.retry-btn {
	display: inline-block;
	padding: 12rpx 24rpx;
	background: #2979ff;
	color: white;
	border-radius: 8rpx;
	font-size: 24rpx;
}

.retry-btn:active {
	background: #1565c0;
}

.retry-text {
	color: white;
}

/* 黑名单类型选择状态显示样式 */
.blacklist-type-display {
	margin-top: 20rpx;
}

.selected-type-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 15rpx;
}

.change-btn {
	padding: 8rpx 16rpx;
	background: #2979ff;
	border-radius: 6rpx;
}

.change-btn:active {
	background: #1565c0;
}

.change-text {
	color: white;
	font-size: 24rpx;
}

.selected-type-item {
	display: flex;
	align-items: center;
	padding: 20rpx;
	background: #f8f9fa;
	border: 2rpx solid #e53e3e;
	border-radius: 12rpx;
	box-shadow: 0 4rpx 12rpx rgba(229, 62, 62, 0.15);
}

.selected-type-icon {
	font-size: 32rpx;
	margin-right: 15rpx;
}

.selected-type-info {
	flex: 1;
}

.selected-type-name {
	font-size: 28rpx;
	font-weight: 500;
	color: #e53e3e;
	display: block;
	margin-bottom: 8rpx;
}

.selected-type-desc {
	font-size: 24rpx;
	color: #666;
	line-height: 1.4;
}

/* 车牌搜索弹窗样式 */
.plate-search-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	z-index: 9999;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 40rpx;
}

.search-modal-container {
	background: #ffffff;
	border-radius: 24rpx;
	max-width: 680rpx;
	width: 100%;
	max-height: 80vh;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.15);
}

.search-modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 32rpx 32rpx 24rpx;
	background: linear-gradient(135deg, #f8f9fa, #ffffff);
	border-bottom: 2rpx solid #e9ecef;
}

.search-modal-title {
	font-size: 34rpx;
	font-weight: 600;
	color: #2d3748;
}

.search-modal-close {
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	background: #f1f3f5;
	transition: all 0.3s;
}

.search-modal-close:active {
	background: #e9ecef;
	transform: scale(0.95);
}

.search-modal-body {
	flex: 1;
	overflow-y: auto;
	padding: 24rpx 32rpx 32rpx;
}

.search-input-container {
	display: flex;
	align-items: center;
	background: #f8f9fa;
	border-radius: 16rpx;
	padding: 0 24rpx;
	margin-bottom: 24rpx;
}

.search-modal-input {
	flex: 1;
	height: 88rpx;
	font-size: 28rpx;
	color: #2d3748;
}

.search-btn {
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

/* 黑名单类型选择弹窗样式 - 优雅浅色风格 */
.blacklist-modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: linear-gradient(135deg, rgba(74, 144, 226, 0.1), rgba(143, 130, 237, 0.1));
	backdrop-filter: blur(10rpx);
	z-index: 9999;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 40rpx;
	animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
	from {
		opacity: 0;
	}

	to {
		opacity: 1;
	}
}

@keyframes slideUp {
	from {
		opacity: 0;
		transform: translateY(100rpx) scale(0.9);
	}

	to {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}

.blacklist-modal {
	background: linear-gradient(135deg, #fafbfc 0%, #f8faff 50%, #f5f8ff 100%);
	border-radius: 24rpx;
	max-width: 640rpx;
	width: 100%;
	max-height: 80vh;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	box-shadow:
		0 20rpx 60rpx rgba(74, 144, 226, 0.15),
		0 8rpx 25rpx rgba(143, 130, 237, 0.08),
		0 0 0 2rpx rgba(255, 255, 255, 0.8);
	animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
	border: 2rpx solid rgba(74, 144, 226, 0.1);
}

.modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 40rpx 40rpx 30rpx 40rpx;
	background: linear-gradient(135deg, rgba(74, 144, 226, 0.03), rgba(143, 130, 237, 0.03));
	border-bottom: 2rpx solid rgba(74, 144, 226, 0.08);
	position: relative;
}

.modal-header::after {
	content: '';
	position: absolute;
	bottom: 0;
	left: 40rpx;
	right: 40rpx;
	height: 2rpx;
	background: linear-gradient(90deg,
			transparent,
			rgba(74, 144, 226, 0.2),
			rgba(143, 130, 237, 0.2),
			transparent);
}

.modal-title {
	font-size: 36rpx;
	font-weight: 600;
	color: #2d3748;
	background: linear-gradient(135deg, #4a90e2, #8f82ed);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
}

.modal-close {
	width: 72rpx;
	height: 72rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.8));
	border: 2rpx solid rgba(74, 144, 226, 0.1);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	box-shadow: 0 4rpx 12rpx rgba(74, 144, 226, 0.1);
}

.modal-close:active {
	transform: scale(0.95);
	background: linear-gradient(135deg, rgba(74, 144, 226, 0.1), rgba(143, 130, 237, 0.08));
	box-shadow: 0 2rpx 8rpx rgba(74, 144, 226, 0.15);
}

.close-icon {
	font-size: 32rpx;
	color: #64748b;
	line-height: 1;
	font-weight: 300;
}

.modal-content {
	padding: 40rpx;
	flex: 1;
	overflow-y: auto;
	background: rgba(255, 255, 255, 0.6);
}

/* 加载和网格样式优化 */
.loading-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 80rpx 0;
}

.loading-text {
	font-size: 28rpx;
	color: #64748b;
	margin-top: 20rpx;
}

.blacklist-type-grid {
	display: grid;
	grid-template-columns: 1fr;
	gap: 24rpx;
}

.blacklist-type-item {
	display: flex;
	align-items: center;
	padding: 32rpx 24rpx;
	background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.8));
	border: 2rpx solid rgba(74, 144, 226, 0.1);
	border-radius: 20rpx;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	cursor: pointer;
	position: relative;
	overflow: hidden;
	box-shadow: 0 4rpx 16rpx rgba(74, 144, 226, 0.08);
}

.blacklist-type-item::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: linear-gradient(135deg,
			rgba(74, 144, 226, 0.05),
			rgba(143, 130, 237, 0.03));
	opacity: 0;
	transition: opacity 0.3s ease;
}

.blacklist-type-item:hover::before {
	opacity: 1;
}

.blacklist-type-item.selected {
	border-color: rgba(74, 144, 226, 0.4);
	background: linear-gradient(135deg,
			rgba(74, 144, 226, 0.08),
			rgba(143, 130, 237, 0.06));
	box-shadow:
		0 8rpx 25rpx rgba(74, 144, 226, 0.2),
		0 0 0 4rpx rgba(74, 144, 226, 0.1);
	transform: translateY(-2rpx);
}

.blacklist-type-item:active {
	transform: scale(0.98);
}

.blacklist-type-icon {
	font-size: 40rpx;
	margin-right: 20rpx;
	filter: drop-shadow(0 2rpx 4rpx rgba(74, 144, 226, 0.1));
}

.blacklist-type-name {
	font-size: 30rpx;
	font-weight: 600;
	color: #2d3748;
	display: block;
	margin-bottom: 8rpx;
	line-height: 1.4;
}

.blacklist-type-desc {
	font-size: 24rpx;
	color: #64748b;
	line-height: 1.5;
	opacity: 0.8;
}

.no-types-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 80rpx 0;
}

.no-types-text {
	font-size: 28rpx;
	color: #64748b;
	margin-bottom: 30rpx;
}

.retry-btn {
	padding: 16rpx 32rpx;
	background: linear-gradient(135deg, #4a90e2, #8f82ed);
	border-radius: 12rpx;
	transition: all 0.3s ease;
	box-shadow: 0 4rpx 12rpx rgba(74, 144, 226, 0.3);
}

.retry-btn:active {
	transform: translateY(2rpx);
	box-shadow: 0 2rpx 8rpx rgba(74, 144, 226, 0.4);
}

.modal-footer {
	display: flex;
	padding: 30rpx 40rpx 40rpx 40rpx;
	background: linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(248, 250, 252, 0.6));
	border-top: 2rpx solid rgba(74, 144, 226, 0.08);
	gap: 24rpx;
}

.footer-btn {
	flex: 1;
	height: 88rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 16rpx;
	font-size: 30rpx;
	font-weight: 500;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	position: relative;
	overflow: hidden;
}

.cancel-btn {
	background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.8));
	color: #64748b;
	border: 2rpx solid rgba(74, 144, 226, 0.15);
	box-shadow: 0 2rpx 8rpx rgba(74, 144, 226, 0.08);
}

.cancel-btn:active {
	transform: scale(0.98);
	background: linear-gradient(135deg, rgba(248, 250, 252, 0.9), rgba(241, 245, 249, 0.8));
}

.confirm-btn {
	background: linear-gradient(135deg, #4a90e2, #8f82ed);
	color: white;
	box-shadow: 0 6rpx 20rpx rgba(74, 144, 226, 0.3);
	border: none;
}

.confirm-btn:active {
	transform: scale(0.98);
	box-shadow: 0 4rpx 15rpx rgba(74, 144, 226, 0.4);
}

.confirm-btn.disabled {
	background: linear-gradient(135deg, rgba(203, 213, 225, 0.8), rgba(226, 232, 240, 0.6));
	color: #94a3b8;
	box-shadow: none;
	cursor: not-allowed;
}

.btn-text {
	color: inherit;
	position: relative;
	z-index: 1;
}
</style>