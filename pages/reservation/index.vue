<template>
	<view class="container">
		<!-- 核心功能区块 -->
		<view class="main-content">
			<!-- Deepseek风格图标 -->
			<u-row justify="center">
				<u-col span="auto">
					<view class="icon-wrapper">
						<image src="/static/巡查驻点.png" style="width: 70px; height: 70px;"></image>
						<text class="main-title">快速查车</text>
						<!-- <text class="sub-title">智慧出行服务系统 V1.1</text> -->
					</view>
				</u-col>
			</u-row>
			<!-- 搜索区域 -->
			<view class="search-box">
				<u-search v-model="searchKey" placeholder="请输入车牌号或手机号码" :show-action="false" shape="square"
					bg-color="#ffffff" border-color="#e5e7eb" height="40" search-icon-color="#3b82f6"></u-search>
				<u-button type="primary" shape="circle" icon="search" color="#2563eb" text="搜索" @click="handleSearch"
					custom-style="margin-left: 20rpx; width: 160rpx; height: 80rpx;"></u-button>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				searchKey: ''
			};
		},
		methods: {
			handleSearch() {
				// 先查询是否有这台车的预约记录，有的话将此记录作为参数传递给下一页面
				if (this.searchKey && this.searchKey.trim()) {
					// 如果有搜索关键词，带参数跳转
					uni.navigateTo({
						url: `/pagesA/reservation/searchResult/searchResult?keyword=${encodeURIComponent(this.searchKey.trim())}`
					})
				} else {
					// 如果没有搜索关键词，直接跳转
					uni.navigateTo({
						url: '/pagesA/reservation/searchResult/searchResult'
					})
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	.container {
		height: 80vh;
		display: flex;
		justify-content: center;
		align-items: center;
		background: #f8fafc;
		.main-content {
			width: 90%;
			max-width: 800rpx;
			.icon-wrapper {
				text-align: center;
				margin-bottom: 60rpx;
				.main-title {
					display: block;
					font-size: 48rpx;
					font-weight: 600;
					color: #1e3a8a;
					letter-spacing: 2rpx;
					text-shadow: 0 4rpx 8rpx rgba(30, 58, 138, 0.1);
				}

				.sub-title {
					display: block;
					font-size: 28rpx;
					color: #64748b;
					margin: 16rpx 0;
					font-family: monospace;
				}

				.icon-label {
					display: block;
					margin-top: 20rpx;
					font-size: 32rpx;
					color: #1e293b;
					font-weight: 500;
				}
			}

			.search-box {
				height: 80px;
				display: flex;
				align-items: center;
				background: #ffffff;
				padding: 30rpx;
				border-radius: 16rpx;
				box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
			}
		}
	}
</style>