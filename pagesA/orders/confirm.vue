<template>
	<view>
		<view style="padding:10px;">
			<u-swiper :list="goods.images" height="300"></u-swiper>
		</view>
		<view class="title">
			{{goods.title}}
		</view>
		<view class="flex-row align-center" style="padding: 10px;">
			<view>
				<text class="rmb">￥</text><text class="price">{{goods.price}}</text>
			</view>
			<view style="padding-left: 20px;color: #888888;">
				<text class="text-sm">会员尊享</text><text class="rmb">￥</text><text class="price"
					style="font-size: 15px;">{{goods.price}}</text>
			</view>
		</view>
		<view class="server flex align-center justify-between" style="">
			<view class=" flex-col" style="padding:10px 10px;">
				<view class="item">
					<text class="label">服务项目</text> <text class="name">{{goods.server.item}}</text>
				</view>

				<view style=" text-transform:uppercase;">
					<text class="label">适合车型</text> <text class="name">{{goods.server.type}}</text>
				</view>
			</view>
			<view>
				<text style="font-size: 10px;font-weight: bold;color: #888888;">已服务</text>
				<text style="font-size: 18px;font-weight: bold;padding-left: 2px;">{{goods.salesVolume}}</text>
				<text style="font-size: 10px;font-weight: bold;color: #888888;padding-left: 2px;">人</text>
			</view>
		</view>
		<view class="desc" style="color: #888888;padding: 20px 10px;">
			<view class="" style="font-weight: bold;padding-bottom: 5px;">
				使用说明
			</view>
			<view style="color: #888888;line-height: 1.5;font-size: 12px;padding: 5px;">
				<text>{{goods.description}}</text>
			</view>
		</view>
		<view class="flex-row footer justify-around text-center align-center"
			style="width: 100%; padding: 10px;position: fixed;bottom: 10px;">
			<view style="background: #00aa7f;padding: 10px;border-radius: 20px;">
				<uni-icons type="phone-filled" color="#FFFFFF" size="20px"></uni-icons>
			</view>
			<view class=" flex-row justify-between align-center"
				style="width: 75%;background: #FFFFFF;padding:5px 10px;border-radius: 10px;">
				<view>
					<text class="rmb">￥</text>
					<text class="price">{{goods.price}}</text>
				</view>
				<view style="" class="submit-btn" @tap="submitOrder">
					立即预约
				</view>
			</view>
		</view>
		<u-popup :closeable="true" :show="carVisiable" :round="10" mode="bottom" @close="closeCarSelectPop"
			:closeOnClickOverlay="true">
			<ff-cars-select :data="carList" @select="selectServiceCar" @callbackAdd="gogoAddCars"></ff-cars-select>
		</u-popup>

		<u-popup :closeable="true" :show="payVisiable" :round="10" mode="bottom" @close="closePaiOrderPop"
			:closeOnClickOverlay="true">
			<ff-payment :order="paiOrder" @success="paymentSuccess"></ff-payment>
		</u-popup>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				goods: {
					"images": [
						"https://img2.baidu.com/it/u=2676316800,1823245362&fm=253&fmt=auto&app=120&f=JPEG?w=890&h=500",
						"https://img0.baidu.com/it/u=4051884157,722545192&fm=253&fmt=auto&app=120&f=JPEG"
					],
					"title": "上门养车`整车豪华磨泥打蜡(含内外精洗绍)",
					"description": "整车全方位清理，清洗全车漆面、清洗玻璃、清洗轮胎、轮毂仪表板、脚垫、内饰吸尘。收干车身玻璃水渍，磨泥打蜡全车瞬间镀膜。",
					"image": "https://img0.baidu.com/it/u=1385090183,857915483&fm=253&fmt=auto&app=138&f=JPEG",
					"price": "168",
					"memberPrice": "99",
					"category": "车辆清洗",
					"server": {
						"type": "suv",
						"item": "车外部清洁",
					},
					"salesVolume": 10,
				},
				carVisiable: false,
				carPopStyle: {
					'borderRadius': "10px"
				},
				carList: [{
					userId: "1",
					plate: '豫A001A1',
					category: "suv",
					nickname: "雷军儿",
					mobile: "15501033589",
					color: "白色"
				}, {
					userId: "1",
					plate: '豫A001A2',
					category: "mpv",
					nickname: "雷军儿",
					mobile: "15501033589",
					color: "白色"
				}, {
					userId: "1",
					plate: '豫A001AA',
					category: "car",
					nickname: "雷军儿",
					mobile: "15501033589",
					color: "白色"
				}],
				payVisiable: false,
				paiOrder: {
					previewDate: null
				}
			}
		},
		computed: {
			swipers() {

			}
		},
		filters: {
			categoryFilter(category) {
				if (category == 'car') {
					return "小轿车";
				}
				return category;
			}
		},
		onLoad() {
			let curGoods = uni.getStorageSync("selectGoods");
			this.goods = Object.assign(this.goods,curGoods);
			this.goods.images = [this.goods.image];
			this.paiOrder = Object.assign(this.paiOrder, this.goods);
			this.paiOrder['previewDate'] = "";
		},
		methods: {
			submitOrder() {
				this.carVisiable = true;
			},
			closeCarSelectPop() {
				console.log("close");
				this.carVisiable = false;
			},
			gogoAddCars() {
				uni.navigateTo({
					url: "/subCars/cars/cars"
				})
			},
			selectServiceCar(car) {
				console.log(car);
				this.carVisiable = false;
				this.payVisiable = true;
				this.paiOrder = Object.assign(this.goods, this.paiOrder);
				this.paiOrder['cars'] = [car];
			},
			closePaiOrderPop() {
				this.payVisiable = false;
				console.log("closePaiOrderPop")
			},
			paymentSuccess() {
				this.payVisiable = false;
				console.log("closePaiOrderPop")
				uni.showModal({
					title: "下单成功",
					content: "您的订单已支付成功",
					success(res) {
						if (res.confirm) {
							
							uni.redirectTo({
								url: "/pages/orders/orders"
							})
							
						}
					}
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
	.title {
		font-size: 15px;
		font-weight: 600;
		padding: 10px;
	}

	.rmb {
		font-size: 12px;
		color: $uni-color-error;
	}

	.price {
		font-size: 20px;
		font-weight: 600;
		color: $uni-color-error;
	}

	.server {
		border: 2px solid #aaaaaa;
		padding: 0px 0px;
		border-radius: 10px;
		margin: 10px;
		padding: 10px;

		.item {
			padding: 5px 0px;

		}

		.label {
			font-size: 14px;
			color: #aaaaaa;
			font-weight: 600;
		}

		.name {
			padding-left: 10px;
			font-size: 14px;
			color: #505050;
			font-weight: 600;

		}


	}

	.submit-btn {
		border-radius: 30px;
		width: 100px;
		background: #55aaff;
		padding: 8px 15px;
		font-weight: 700;
		color: #FFFFFF;
	}
</style>