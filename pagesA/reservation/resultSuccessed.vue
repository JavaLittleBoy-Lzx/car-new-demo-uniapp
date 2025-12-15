<template>
	<view class="u-page">
		<view class="view-image">
			<!-- <image src="/static/审核中 (3).png" style="height: 100px; width: 100px; margin-top: 55px; margin-left: 25px;"></image> -->
			<image src="/static/预约成功 (2).png"
				style="height: 200px; width: 200px; margin-top: 25px; margin-left: -25px;"></image>
			<!-- <view class="font-reson">审核中</view> -->
			<view class="font-reson">预约成功</view>
			<!-- <view class="reservation-name">感谢您的预约服务，请等待管家审核，注意查收审核结果，以免错过审核成功结果。</view> -->
			<view class="reservation-name">感谢您的预约服务,管家已审核完成,您已预约成功,请按时抵达现场</view>
			<!-- 已移除"我的预约"按钮，简化预约成功页面 -->
		</view>
		<!-- <view class="centre_vie2">
			<tui-section title="预约结果" is-line line-color="linear-gradient(to bottom,#fff,#19be6b)" :size="34"
				font-weight="bold" background="#d7e9fe" class="section-name" margin="30rpx 0"
				style="font-family: '楷体';"></tui-section>
			<view class="table">
				<view class="row" v-for="(item, index) in tableData" :key="index">
					<view class="cell">{{ item.column1 }}</view>
					<view class="cell" style="margin-left: -15px;">{{ item.column2 }}</view>
				</view>
			</view>
		</view> -->
	</view>
</template>

<script>
	export default {
		data() {
			return {
				tableData: [{
						column1: '预约地址：',
						column2: 'Row 1 Col 2'
					},
					{
						column1: 'Row 2 Col 1',
						column2: 'Row 2 Col 2'
					},
					{
						column1: 'Row 3 Col 1',
						column2: 'Row 3 Col 2'
					},
					// 添加更多行数据
				]
			}
		},
		methods: {
			resultPage() {
				uni.navigateTo({
					url: '/pagesA/reservation/searchResult/searchResult'
				})
			}
		}
	}
</script>

<style>
	.view-image {
		width: 200px;
		height: 40px;
		margin-top: 25px;
		margin-left: 95px;
	}

	.font-reson {
		margin-top: -10px;
		margin-left: 10px;
		font-family: "黑体";
		font-size: 30px;
		font-weight: 700;
	}

	.u-page {
		padding: 5px 15px 40px 15px;
		height: 500px;
	}

	.centre_vie {
		width: 350px;
		height: 90px;
		margin-top: 200px;

		box-shadow: 0 5upx 20upx 0upx rgba(0, 0, 150, .2);
		border-radius: 20rpx;
		padding-top: 15px;
		margin-bottom: 20rpx;
	}

	.centre_vie2 {
		width: 350px;
		height: 180px;
		margin-top: 5px;
		background-color: #d7e9fe;
		box-shadow: 0 5upx 20upx 0upx rgba(0, 0, 150, .2);
		border-radius: 20rpx;
		padding-top: 1px;
		margin-bottom: 20rpx;
	}

	.reservation-name {
		width: 370px;
		margin-top: 15px;
		margin-left: -100px;
		font-size: 15px;
		color: #bdbdbd;
	}

	.resaervation-info {
		margin-top: 5px;
		margin-left: 10px;
		font-size: 25px;
		color: #fff;
		font-family: "楷体";
	}

	.section-name {
		margin-top: -5px;
	}

	.table {
		margin-left: -15px;
		margin-top: -10px;
		display: flex;
		flex-direction: column;
	}

	.row {
		display: flex;
		width: 100%;
	}

	.cell {
		flex: 1;
		text-align: center;
		padding: 10px;
	}
</style>