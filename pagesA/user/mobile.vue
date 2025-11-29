<template>
	<view class="warp">
		<u--form labelPosition="left" :model="userInfo" :rules="rules" ref="form1">
			<u-form-item prop="userInfo.mobile" borderBottom ref="item1" label="原手机号" labelWidth="150rpx">
				<u--input placeholder="请输入原始密码" v-model="userInfo.mobile" border="none"></u--input>
			</u-form-item>
			<u-form-item prop="userInfo.new_mobile" borderBottom ref="item1" label="新手机号" labelWidth="150rpx">
				<u--input placeholder="请输入新密码" v-model="userInfo.new_mobile" border="none"></u--input>
			</u-form-item>
		</u--form>
		<view class="buttonBox safe-area-inset-bottom">
			<view class="v">
				<u-button type="primary" text="确认修改"></u-button>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				userInfo: {
					mobile: '',
					new_mobile: ''
				}
			}
		},
		methods: {

		}
	}
</script>

<style lang="scss">
	.warp {
		width: 750rpx;
		padding: 30rpx 50rpx;
		background: #fff;
		border-top: 2rpx solid #eee;

		.u-form-item {
			padding-bottom: 50rpx;
		}
	}

	.buttonBox {
		width: 100%;
		background: #fff;
		position: fixed;
		left: 0rpx;
		bottom: 0rpx;
		right: 0rpx;
		box-shadow: 0 0 15rpx #ccc;

		.v {
			padding: 30rpx;

			.u-button {
				width: 100%;
			}
		}
	}
</style>