<template>
	<view class="container">
		<!-- 搜索栏 -->
		<view class="search-box">
			<u-search v-model="searchKeyword" placeholder="请输入管家姓名" :show-action="true" action-text="搜索"
				@search="handleSearch" @custom="handleSearch"></u-search>
		</view>

		<!-- 筛选条件 -->
		<view class="filter-bar">
			<u-tabs :list="tabList" :current="currentTab" @change="tabChange" bar-width="60"
				active-color="#2979ff"></u-tabs>
			<u-dropdown>
				<u-dropdown-item v-model="departmentValue" title="所属小区" :options="departmentOptions"></u-dropdown-item>
			</u-dropdown>
		</view>

		<!-- 人员列表 -->
		<u-list @scrolltolower="loadMore" class="user-list">
			<u-list-item v-for="(user, index) in filteredUsers" :key="user.id">
				<view class="user-card" @click="selectUser(user)">
					<u-avatar :src="user.avatar" size="60"></u-avatar>
					<view class="user-info">
						<text class="name">{{ user.name }}</text>
						<text class="department">{{ user.department }}</text>
						<view class="status-tag">
							<u-tag :text="user.status ? '在线' : '离线'" :type="user.status ? 'success' : 'info'"
								size="mini" />
						</view>
					</view>
					<u-icon name="checkbox-mark" :color="selectedUser === user.id ? '#2979ff' : '#dcdfe6'"
						size="24"></u-icon>
				</view>
			</u-list-item>
		</u-list>

		<!-- 底部操作栏 -->
		<view class="action-bar">
			<u-button type="primary" shape="circle" :disabled="!selectedUser" @click="handleTransfer">
				确认转交至 {{ selectedUserName }}
			</u-button>
		</view>

		<!-- 转交确认弹窗 -->
		<u-modal v-if="this.showConfirm == true" title="确认转交" :async-close="true" @confirm="submitTransfer">
			<view class="confirm-content">
				<text>将【{{ currentTask }}】转交给：</text>
				<text class="highlight">{{ selectedUserName }}</text>
			</view>
		</u-modal>
	</view>
</template>

<script>
export default {
	data() {
		return {
			searchKeyword: '',
			currentTab: 0,
			tabList: [{
				name: '全部人员'
			},
			{
				name: '同小区'
			},
			{
				name: '审批人'
			}
			],
			departmentValue: 0,
			departmentOptions: [{
				label: '保卫部',
				value: 0
			},
			{
				label: '市场部',
				value: 1
			},
			{
				label: '财务部',
				value: 2
			}
			],
			userList: [
				// 模拟数据
				{
					id: 1,
					name: '汪小菲',
					department: '保卫部·管家',
					avatar: 'https://cdn.uviewui.com/uview/faces/1.jpg',
					status: 1,
					workload: '空闲'
				},
				// 更多数据...
			],
			selectedUser: null,
			showConfirm: false,
			currentTask: '入场申请审批（ID:20230316001）'
		}
	},
	computed: {
		filteredUsers() {
			return this.userList.filter(user =>
				user.name.includes(this.searchKeyword) ||
				user.department.includes(this.searchKeyword)
			)
		},
		selectedUserName() {
			const user = this.userList.find(u => u.id === this.selectedUser)
			return user ? user.name : '请选择'
		}
	},
	methods: {
		handleSearch() {
			// 实际项目需加防抖处理
			console.log('执行搜索:', this.searchKeyword)
		},
		tabChange(index) {
			this.currentTab = index
		},
		selectUser(user) {
			this.selectedUser = user.id
		},
		handleTransfer() {
			// 调用转交接口
			uni.showLoading({
				title: '转交中'
			})
			setTimeout(() => {
				uni.hideLoading()
				uni.showToast({
					title: '转交成功',
					icon: 'success'
				})
				this.showConfirm = false
				uni.navigateBack()
			}, 1500)
			this.showConfirm = true
		},
		submitTransfer() {
			// 调用转交接口
			uni.showLoading({
				title: '转交中'
			})
			setTimeout(() => {
				uni.hideLoading()
				uni.showToast({
					title: '转交成功',
					icon: 'success'
				})
				this.showConfirm = false
				uni.navigateBack()
			}, 1500)
		},
		loadMore() {
			// 分页加载逻辑
		}
	}
}
</script>

<style lang="scss" scoped>
.container {
	padding: 24rpx;
	background: #f8f8f8;
	height: 100vh;
}

.search-box {
	background: #fff;
	padding: 20rpx;
	border-radius: 12rpx;
	margin-bottom: 24rpx;
}

.filter-bar {
	display: flex;
	align-items: center;
	margin-bottom: 24rpx;

	/deep/ .u-tabs {
		flex: 1;
	}
}

.user-list {
	height: calc(100vh - 400rpx);
}

.user-card {
	background: #fff;
	padding: 24rpx;
	margin: 16rpx 0;
	border-radius: 12rpx;
	display: flex;
	align-items: center;
	transition: all 0.3s;

	&:active {
		background: #f5f7fa;
	}

	.user-info {
		flex: 1;
		margin-left: 24rpx;

		.name {
			font-size: 32rpx;
			color: #303133;
			display: block;
		}

		.department {
			font-size: 26rpx;
			color: #909399;
		}
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
}

.confirm-content {
	padding: 32rpx;
	font-size: 30rpx;

	.highlight {
		color: #2979ff;
		font-weight: bold;
		display: block;
		margin-top: 16rpx;
	}
}
</style>