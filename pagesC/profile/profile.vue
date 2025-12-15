<template>
	<view class="page">
		<!-- <custom-tabbar :curr-page="4"></custom-tabbar> -->
		<!-- 顶部个人信息 -->
		<view class="flex padding profile">
			<view class="padding-lr-xs">
				<view class="cu-avatar lg round"
					style="background-image:url(https://avatar.dcloud.net.cn/uploads/avatar/001/24/46/45_avatar_max.jpg?ut=1713408062);">
				</view>
			</view>
			<view class="padding-xs text-xl text-black">
				<view style="color: #FFFFFF;">Feify</view>
				<view class="cu-tag round line-white sm">管家</view>
			</view>
		</view>
		<!-- 基本数据 -->
		<view style="background: linear-gradient(50deg, #0081ff, #1cbbb4)">
			<view style="border-radius: 15px 15px 0px 0px;s"
				class="cu-list grid col-3 no-border padding-lr-xs radius-lg-top ">
				<view class="cu-item " @tap="toPage('/pages/card/card')">
					<view class="text-black text-bold text-xxl">
						6
					</view>
					<text>洗车卡</text>
				</view>
				<!-- <view class="cu-item">
				<view class="text-black text-bold text-xxl">
					0
				</view>
				<text>权益卡</text>
			</view> -->
				<view class="cu-item " @tap="toPage('/pages/coupons/coupons')">
					<view class="text-black text-bold text-xxl">
						4
					</view>
					<text>优惠券</text>
				</view>
				<view class="cu-item" @tap="toPage('/pages/integral/integral')">
					<view class="text-black text-bold text-xxl">
						888
					</view>
					<text>积分</text>
				</view>
			</view>
		</view>
		<!-- 助力/推荐/邀请 -->
		<view class="padding-lr-xs">
			<view class="bg-brown light radius-lg shadow-blur">
				<view class="flex padding-tb-sm padding-lr-sm justify-between">
					<view class="padding-xs">
						<view>99.9元开通超级会员最高可省￥40</view>
					</view>
					<view class="" @tap="toPage('/pages/member/member')">
						<view class="cu-btn round bg-black">开通会员</view>
					</view>
				</view>
			</view>
		</view>
		<!-- 常用功能 -->
		<view class="cu-bar margin-lr-xs grid col-4 no-border bg-white radius-lg-top">
			<view class="action">
				<text class=" text-xl text-black">我的订单</text>
			</view>
			<view class="action" @tap="toPage('/pages/orders/orders')">
				<text class="text-lg">全部订单<text class="cuIcon-right"></text></text>
			</view>
		</view>
		<view class="cu-list grid col-4 no-border text-black margin-lr-xs padding-bottom radius-lg-bottom">
			<view class="cu-item" v-for="(item,index) in iconList" :key="index" :bindtap="item.bindtap">
				<view :class="['cuIcon-'+item.icon,'text-'+item.color,'text-shadow']" style="font-size: 56rpx;">
					<view class="cu-tag badge" v-if="item.badge!=0">
						<block v-if="item.badge!=1">{{item.badge>99?"99+":item.badge}}</block>
					</view>
				</view>
				<text>{{item.name}}</text>
			</view>
		</view>

		<view class="padding-lr-xs">
			<view class="bg-white light radius-lg shadow-blur">
				<view class="flex padding-tb-sm padding-lr-sm justify-between">
					<view class="padding-xs">
						<view class="text-xl text-black">惊喜连连·免单不断</view>
						<view class="padding-top-xs">到店清洗即刻<text class="text-red text-bold"> 6.6折优惠券 </text><text
								class="cuIcon-roundrightfill text-red"></text></view>
					</view>
					<view class="text-lg" @tap="handleCoupon">
						<view class="cu-btn round  margin-top-sm bg-gradual-blue text-bold">6.6折优惠</view>
					</view>
				</view>
			</view>
		</view>
		<!-- 其他功能 -->
		<view class="cu-bar margin-lr-xs grid col-4 no-border bg-white radius-lg-top">
			<view class="action">
				<text class="text-xl">其他功能</text>
			</view>
		</view>
		<view class="cu-list grid col-4 no-border text-black margin-lr-sm radius-lg-bottom">
			<view class="cu-item " v-for="(item,index) in iconOtherList" :key="index" @tap="onHandleBind(item)">
				<view v-if="item.bindtap!='contact'" :class="['cuIcon-'+item.icon,'text-'+item.color,'text-shadow']"
					style="font-size: 56rpx;">
					<view class="cu-tag badge" v-if="item.badge!=0">
						<block v-if="item.badge!=1">{{item.badge>99?"99+":item.badge}}</block>
					</view>
				</view>
				<button class="chat-btn"
					style="line-height: initial;width: auto; height: auto; background: none;border: none; font-size: 56rpx;"
					v-if="item.bindtap=='contact'" open-type="contact" send-message-title="来自个人中心页面的咨询消息"
					:class="['cuIcon-'+item.icon,'text-'+item.color,'text-shadow']">
				</button>
				<text>{{item.name}}</text>
			</view>
		</view>
		<!-- 其他功能 -->
		<!-- 		<view class="cu-bar margin-lr-xs margin-top grid col-4 no-border bg-white radius-lg-top">
			<view class="action">
				<text class="text-xl">后台管理</text>
			</view>
		</view> -->
		<!-- 		<view class="cu-list grid col-4 no-border text-black margin-lr-sm padding-bottom radius-lg-bottom">
			<view class="cu-item " v-for="(item,index) in managerList" :key="index" @tap="onHadleMananger(item)">

				<view :class="['cuIcon-'+item.icon,'text-'+item.color,'text-shadow']" style="font-size: 56rpx;">
					<view class="cu-tag badge" v-if="item.badge!=0">
						<block v-if="item.badge!=1">{{item.badge>99?"99+":item.badge}}</block>
					</view>
				</view>
				<text>{{item.name}}</text>
			</view>
		</view> -->

	</view>
</template>

<script>
	export default {
		data() {
			return {
				iconList: [{
					icon: 'moneybagfill',
					color: 'blue',
					badge: 0,
					name: '待接单'
				}, {
					icon: 'presentfill',
					color: 'red',
					badge: 0,
					name: '待上门',
					bindtap: "bindZan"
				}, {
					icon: 'formfill',
					color: 'purple',
					badge: 11,
					name: '待评价',
					bindtap: "showResource"
				}, {
					icon: 'shopfill',
					color: 'green',
					badge: 0,
					name: '返修/售后',
					bindtap: "bindPoint"
				}],
				iconOtherList: [{
						icon: 'taxi',
						color: 'blue',
						badge: 0,
						name: '我的车辆',
						bindtap: "/subCars/cars/cars"
					}, {
						icon: 'location',
						color: 'blue',
						badge: 0,
						name: '地址管理',
						bindtap: "/subPages/address/address"
					},
					// {
					// 	icon: 'service',
					// 	color: 'blue',
					// 	badge: 0,
					// 	name: '电话客服',
					// 	bindtap: "bindZan"
					// }, 
					{
						icon: 'mark',
						color: 'blue',
						badge: 0,
						name: '在线客服',
						bindtap: "contact",

					},
					// {
					// 	icon: 'mail',
					// 	color: 'blue',
					// 	badge: 0,
					// 	name: '投诉',
					// 	bindtap: "bindCollect"
					// },
					{
						icon: 'ticket',
						color: 'blue',
						badge: 0,
						name: '卡券管理',
						disabled: true,
						bindtap: "/subCars/manager/stores"
					}
				],
				managerList: [{
					icon: 'group',
					color: 'blue',
					badge: 0,
					name: '区域代理',
					disabled: true,
					bindtap: "/subCars/manager/stores"
				}, {
					icon: 'rank',
					color: 'blue',
					badge: 0,
					name: '营收面板',
					disabled: true,
					bindtap: "/subCars/manager/stores"
				}, {
					icon: 'list',
					color: 'blue',
					badge: 0,
					name: '订单管理',
					disabled: true,
					bindtap: "/subCars/manager/stores"
				}, {
					icon: 'shop',
					color: 'blue',
					badge: 0,
					name: '门店管理',
					disabled: true,
					bindtap: "/subCars/manager/stores"
				}, {
					icon: 'vip',
					color: 'blue',
					badge: 0,
					name: '会员管理',
					disabled: true,
					bindtap: "/subCars/manager/stores"
				}, {
					icon: 'apps',
					color: 'blue',
					badge: 0,
					name: '产品管理',
					disabled: true,
					bindtap: "/subCars/manager/stores"
				}]
			}
		},
		methods: {

			onHandleBind(item) {
				console.log(item, "item");
				uni.navigateTo({
					url: item.bindtap
				})
			},
			bindCars(item) {
				console.log(item, "item")
			},
			toPage(path) {

				uni.navigateTo({
					url: path
				})
			},
			onHadleMananger(item) {
				if (item.disabled != null && item.disabled) {
					uni.showLoading({
						title: "正在加载..."
					})

					setTimeout(function() {
						uni.showToast({
							"icon": "error",
							title: "暂无权限"
						})
					}, 500)
				}
			},
			handleCoupon() {
				uni.showLoading({
					title: "正在领取..."
				})
				setTimeout(function() {
					uni.showToast({
						title: "领取成功",
						icon: 'success',
						duration: 1000
					})
				}, 300)

			},
			toSwichPage(path) {
				console.log(path)
				uni.switchTab({
					url: path,
					events: {
						// 为指定事件添加一个监听器，获取被打开页面传送到当前页面的数据
						acceptDataFromOpenedPage: function(data) {
							console.log(data)
						},
						someEvent: function(data) {
							console.log(data)
						}
					},
					success: function(res) {
						// 通过eventChannel向被打开页面传送数据
						res.eventChannel.emit('acceptDataFromOpenerPage', {
							data: 'data from starter page'
						})
					}
				})
			}
		}
	}
</script>

<style scoped lang="scss">
	.page {
		width: 100vw;
	}

	.profile {
		// background: linear-gradient(to bottom, #333333 0%, #ffffff 70%);
		background: linear-gradient(50deg, #0081ff, #1cbbb4);
		padding-top: 90rpx;
		// background: #ffffff;
		// border-radius: 0px 0px 10px  10px;
	}

	.chat-btn::after {
		border: none;
	}
</style>