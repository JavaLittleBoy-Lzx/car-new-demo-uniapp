<template>
	<view class="container">
		<!-- 状态栏 -->
		<view class="status-card">
			<u-tag :text="detail.status" :type="statusMap[detail.status].type" size="medium" shape="circleRight"
				border-color="transparent" />
			<text class="title">{{ detail.title }}</text>
			<view class="meta-row">
				<u-icon name="account" size="28" color="#909399"></u-icon>
				<text class="label">申请人：{{ detail.applicant }}</text>
			</view>
		</view>

		<!-- 信息卡片 -->
		<u-card title="申请信息" title-color="#303133" :border="false">
			<view slot="body">
				<view class="info-item">
					<u-icon name="clock" size="28" color="#2979ff"></u-icon>
					<text class="label">申请时间：{{ formatTime(detail.createTime) }}</text>
				</view>
				<view class="info-item">
					<u-icon name="tags" size="28" color="#2979ff"></u-icon>
					<text class="label">审批类型：{{ detail.type }}</text>
				</view>
				<view class="info-item">
					<u-icon name="more-circle" size="28" color="#2979ff"></u-icon>
					<text class="label">审批事由：{{ detail.content }}</text>
				</view>
			</view>
		</u-card>
		<view class="card-item">
			<!-- 审批流程 -->
			<u-card title="审批进度" title-color="#303133" :border="false">
				<view slot="body">
					<u-steps :current="currentStep" direction="column">
						<u-steps-item v-for="(step, index) in processSteps" :key="index" :title="step.title"
							:desc="step.time">
							<u-icon slot="icon" :name="step.icon" :color="index == currentStep ? '#2979ff' : '#909399'"
								size="40"></u-icon>
						</u-steps-item>
					</u-steps>
				</view>
			</u-card>
		</view>
		<!-- 操作按钮 -->
		<view class="action-bar" v-if="detail.status === '待审核'">
			<u-button-group>
				<u-button type="primary" icon="checkmark" shape="circle" @click="handleApprove('pass')">
					通过
				</u-button>
				<u-button type="error" icon="close" shape="circle" @click="handleApprove('reject')">
					驳回
				</u-button>
				<u-button type="warning" icon="share" shape="circle" @click="handleTransfer">
					转交
				</u-button>
			</u-button-group>
		</view>
	</view>
</template>

<script>
import TimeUtils from '@/utils/timeUtils.js'

export default {
	data() {
		return {
			detail: {
				id: '20230316001',
				title: '车辆预约入场申请审批',
				status: '待审核',
				applicant: '张晓明',
				createTime: "2025-04-17",
				type: '预约申请',
				content: '回家',
				attachments: ['plan.pdf']
			},
			statusMap: {
				
				'待审核': {
					type: 'warning'
				},
				'已通过': {
					type: 'success'
				},
				'未通过': {
					type: 'error'
				}
			},
			urgencyMap: ['普通', '紧急', '特急'],
			processSteps: [{
				title: '提交申请',
				time: '2023-03-16 10:00',
				icon: 'edit-pen'
			},
			{
				title: '管家审批',
				time: '待处理',
				icon: 'account'
			}
			],
			currentStep: 1
		}
	},
	computed: {
		// ...mapState(['userInfo'])
	},
	onLoad(options) {
		// 自动更新时间数据
		this.updateTimes();
		// this.getDetail(options.id)
	},
	methods: {
		// 更新时间数据
		updateTimes() {
			console.log('🕒 更新审批详情时间...');
			try {
				TimeUtils.reset();

				// 更新创建时间
				this.detail.createTime = TimeUtils.getRecentTime(1, 'YYYY-MM-DD');

				// 更新流程步骤时间
				this.processSteps = this.processSteps.map((step, index) => {
					if (step.time !== '待处理') {
						step.time = TimeUtils.getRecentTime(index, 'YYYY-MM-DD HH:mm');
					}
					return step;
				});
				console.log('✅ 审批详情时间更新完成');
			} catch (error) {
				console.error('❌ 更新审批详情时间失败:', error);
			}
		},
		pad(num) {
			return num.toString().padStart(2, '0')
		},
		formatTime(timestamp) {
			const date = new Date(timestamp)
			return `${date.getFullYear()}-${this.pad(date.getMonth() + 1)}-${this.pad(date.getDate())}`
		},
		getDetail(id) {
			// getApproveDetail(id).then(res => {
			// 	this.detail = res.data
			// 	this.currentStep = this.detail.processSteps.length
			// 	this.processSteps = this.detail.processSteps.map(item => {
			// 		return {
			// 			title: item.title,
			// 			time: formatTime(item.time),
			// 			icon: this.statusMap[item.status].icon
			// 		}
			// 	})
			// })
		},
		handleApprove(type) {
			uni.showModal({
				title: '确认操作',
				content: type === 'pass' ? '确认通过该申请？' : '确认驳回该申请？',
				success: (res) => {
					if (res.confirm) {
						// 提交审批操作
					}
				}
			})
		},
		handleTransfer() {
			uni.navigateTo({
				url: '/pages/site/approve_transfer'
			})
		},
		previewFile() {
			uni.previewImage({
				current: 0,
				urls: this.detail.attachments.map(item => item.url)
			})
		}
	}
}
</script>

<style lang="scss" scoped>
.container {
	padding: 24rpx;
	background: #f8f8f8;
}

.status-card {
	background: #fff;
	border-radius: 16rpx;
	padding: 32rpx;
	margin-bottom: 24rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);

	.title {
		display: block;
		font-size: 36rpx;
		font-weight: 600;
		margin: 20rpx 0;
		color: #303133;
	}
}

.info-item {
	display: flex;
	align-items: center;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #eee;

	.label {
		margin-left: 16rpx;
		color: #606266;
	}
}

.attachment {
	margin-top: 24rpx;
	display: flex;
	align-items: center;

	.link {
		color: #2979ff;
		margin-left: 12rpx;
		text-decoration: underline;
	}
}

.action-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background: #fff;
	padding: 24rpx;
	box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06);

	/deep/ .u-button {
		flex: 1;
		margin: 0 12rpx;
	}
}

.card-item {
	margin-top: 15px;
}
</style>