<template>
	<view>
		<view class="warp_user">
			<view class="top_user_box">
				<image src="/static/coolc/desk.jpg"></image>
				<view class="user_info">
					<view class="username">杨启超</view>
					<view class="mobile">159****9999</view>
				</view>
			</view>

			<view class="icon_boxs">
				<navigator url="/pages/site/facility" class="i" hover-class="none">
					<view class="icon_box">
						<u-icon name="grid-fill" color="#fff" size="32"></u-icon>
					</view>
					<text class="n">设备信息</text>
				</navigator>
				<navigator url="/pages/user/message" class="i" hover-class="none">
					<view class="icon_box">
						<u-icon name="email-fill" color="#fff" size="32"></u-icon>
					</view>
					<text class="n">消息中心</text>
				</navigator>
			</view>
		</view>
		
		<u-cell-group :border="false">
			<u-cell icon="checkmark-circle" style="margin: 10rpx 0;" @click="navi('/pages/site/facility');" :isLink="true" title="设备信息"></u-cell>
			<u-cell icon="email" style="margin: 10rpx 0;" @click="navi('/pages/user/message');" :isLink="true" title="消息中心"></u-cell>
			<u-cell icon="kefu-ermai" style="margin: 10rpx 0;" :isLink="true" title="联系客服"></u-cell>
			<u-cell icon="setting" style="margin: 10rpx 0;" @click="navi('/pages/user/set');" :isLink="true" title="个人设置"></u-cell>
			<u-cell icon="bell" style="margin: 10rpx 0;" :isLink="true" title="消息订阅"></u-cell>
		</u-cell-group>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				
			}
		},
		methods: {
			navi(url) {
				uni.navigateTo({
					url: url
				});
			}
		}
	}
</script>

<style lang="scss">
	.warp_user {
		width: 750rpx;
		padding: 30rpx;
		background: linear-gradient(180deg, rgba(61, 126, 255, 1) 0%, rgba(61, 126, 255, 1) 30%, rgba(255, 255, 255, 1) 90%);
	}
	
	.top_user_box {
		width: 100%;
		@include flex;
		justify-content: flex-start;
		align-items: center;
		padding-bottom: 30rpx;
		
		image {
			width: 100rpx;
			height: 100rpx;
			border-radius: 100rpx;
			border: 6rpx solid #fff;
		}
		.user_info {
			padding: 24rpx;
			
			.username {
				font-size: 34rpx;
				color: #fff;
				padding-bottom: 10rpx;
			}
			.mobile {
				font-size: 26rpx;
				color: #fff;
			}
		}
	}
	.icon_boxs {
		background: #fff;
		border-radius: 20rpx;
		padding: 60rpx 0 20rpx 0;
		@include flex;
		justify-content: space-between;
		align-items: center;
		
		.i {
			width: 50%;
			text-align: center;
			
			.icon_box {
				width: 86rpx;
				height: 86rpx;
				line-height: 86rpx;
				border-radius: 86rpx;
				background: #9ab6ff;
				@include flex;
				justify-content: center;
				align-items: center;
				margin: 0 auto;
			}
			
			.n {
				padding-top: 20rpx;
				font-size: 24rpx;
				color: #333;
			}
		}
	}
</style>
