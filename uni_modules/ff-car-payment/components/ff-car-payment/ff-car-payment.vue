<template>
	<view style="">

		<view style="height:560px;padding:20px 0px;background: #f3f3f3;border-radius: 10px;">
			<view style="text-align: center;padding-top: 20px;">
				<text>￥</text>
				<text style="font-size: 22px;font-weight: 600;">{{payAmt}}</text>
			</view>
			<view style="padding: 20px;text-align: center;">
				<text style="font-size: 16px;font-weight: 600;">{{product.name}}</text>
				<text style="font-size: 16px;padding:1px 5px;font-weight: 800;">1</text>
				<text style="font-size: 12px;">次</text>
			</view>
			<view style="display: flex;justify-content: space-around;background: #FFFFFF;
				margin: 10px;padding: 10px 5px;border-radius: 10px;">


				<view v-for="(cate,cindex) in product.category" @tap="selectCarCategory(cate,cindex)" style=""
					class="category" :class="{'selected':selectCategroyIndex==cindex}">
					<image :class="[cate.category,'car-icon']"></image>
					<view
						style="font-size: 12px;font-weight: 600;color: #888;display: flex;justify-content: space-around;">
						<view>{{cate.name}}</view>
						<view style="padding-left: 5px;font-size: 10px;">
							<text v-if="cate.price>0">￥{{cate.price}}</text>
						</view>
					</view>
				</view>

			</view>
			<view style=" margin: 10px;background: #FFFFFF;padding:10px;border-radius: 10px;">
				<view
					style="display: flex;justify-content: space-between;align-items: center;padding: 10px 0px;border-bottom: #ddd 1px solid;">
					<view style="font-weight: 700;">订单名称</view>
					<view style="font-size: 14px;;color: #888;">
						<text>{{selectedCategory.name}}-{{product.name}}</text>
					</view>
				</view>
				<view
					style="display: flex;justify-content: space-between;align-items: center;padding: 10px 0px;border-bottom: #ddd 1px solid;">
					<view style="font-weight: 700;">服务价格</view>
					<view style="font-size: 14px;;color: #888;">
						<text>￥</text> {{product.price}}
					</view>
				</view>
				<view style="display: flex;justify-content: space-between;align-items: center;padding: 10px 0px;">
					<view style="font-weight: 700;">券包优惠</view>
					<view style="font-size: 14px;;color: #888;display: flex;" @tap="toSelectCoupon">
						<picker mode="selector" @change="selectCoupons" :value="couponIndex" :range="coupons"
							range-key="name">
							<view>
								<text style="padding-right: 5px;">
									-&nbsp;{{preOrder.couponValue}}
								</text>
								<uni-icons type="right" size="18">

								</uni-icons>
							</view>
						</picker>

					</view>

				</view>
			</view>

		</view>

		<view @tap="createOrder" style=" width: 100%; text-align: center;padding:10px 10%;">
			<view style=" background: #55aaff;padding: 10px 20px;border-radius: 30px;color: #FFFFFF;font-weight: 700;">
				立即支付</view>
		</view>
		<!-- <u-action-sheet :actions="coupons" :closeOnClickOverlay="true" :closeOnClickAction="true" :title="'选择您的卡券'"
			:show="couponVisiable" @select="selectCoupons"></u-action-sheet> -->
	</view>


</template>
<script>
	export default {
		name: "ffCarSelect",
		props: {
			store: {
				type: Object,
				default: 0
			},
			product: {
				type: Object,
				default: 0
			},
			subTitle: {
				type: String,
				default: "提交"
			},

			bottom: {
				type: Number,
				default: 50
			},
			backgroud: {
				type: String,
				default: "#FFFFFF"
			},
			/**
			 * 是否显示
			 */
			show: {
				type: Boolean,
				default: false
			},

			/**
			 * 层级
			 */
			zIndex: {
				type: Number,
				default: 10
			},
			/**
			 * 动画时长，单位秒
			 */
			duration: {
				type: [String, Number],
				default: 0.3
			},
			/**
			 * 嵌入内容css类名
			 */
			contentStyle: {
				type: Object,
				default: () => {}
			},
		},
		data() {
			return {
				couponIndex: 0,
				indicatorStyle: {
					height: "50px"
				},
				preOrder: {
					"payAmt": 0.00,
					"couponValue": 0
				},
				coupons: [{
					"name": '不使用优惠券',
					"oldPrice": 0,
					"price": 0,
					"color": '#ffaa7f',
					"subname": "全店通用满100可用",
					"expireDate": "2028-09-09 23:59:59"
				}, {
					"name": '￥20  全平台可用优惠券减20全店通用',
					"oldPrice": 188,
					"price": 20,
					"color": '#ffaa7f',
					"tag": '超值推荐',
					"subname": "全店通用满100可用",
					"expireDate": "2028-09-09 23:59:59"
				}, {
					"name": '￥30  全平台可用优惠券减30',
					"oldPrice": 188,
					"price": 30,
					"color": '#ffaa7f',
					"tag": '超值推荐',
					"subname": "全店通用",
					"expireDate": "2028-09-09 23:59:59"
				}],
				couponVisiable: false,
				payAmt: 0,
				selectedProduct: {},
				selectCategroyIndex: 0,
				selectedCoupon: {
					price: 0.0
				},
				selectedCategory: {
					price: 0.0,
					name: "-"
				}
			}
		},
		created() {
			let _this = this;
			console.log("ffcarpyament created")
			setTimeout(function() {
				_this.selectedCategory = _this.product.category[0];
				_this.buildOrderPaymentAmout();
			}, 100)

		},
		activated() {

			console.log("ffcarpyament activated")
		},
		watch: {

		},
		filters: {
			categoryFilter(category) {
				return "../../static/car.png"
			},
			toFixed(v) {
				return parseFloat(v).toFixed(0);
			}
		},

		methods: {
			open() {
				this.$refs.payment.open();
			},
			buildOrderPaymentAmout() {
				this.payAmt = (parseFloat(this.product.price) + parseFloat(this.selectedCategory.price) -
					parseFloat(this.selectedCoupon.price)).toFixed(2)
			},
			selectCarCategory(category, index) {
				this.selectCategroyIndex = index;
				this.selectedCategory = category;
				this.buildOrderPaymentAmout();
			},
			toSelectCoupon() {
				this.couponVisiable = true;

			},
			selectCoupons(e) {
				this.selectedCoupon = this.coupons[e.detail.value];
				this.preOrder["couponValue"] = this.selectedCoupon.price;
				this.buildOrderPaymentAmout();
			},
			createOrder() {
				let _this = this;
				console.log(this.preOrder, "paiOrder");

				uni.showLoading({
					title: "正在支付...",

				})
				setTimeout(function() {
					uni.showToast({
						title: "支付成功",
						duration: 1000,
						success() {

						}
					})
					_this.$emit("success");
				}, 800)

			}
		}
	}
</script>
<style lang="scss" scoped>
	.category {
		border: #55aaff 1px dashed;
		padding: 5px;
		border-radius: 10px;
	}

	.selected {
		border: #55aaff 1px solid;
		padding: 5px;
		border-radius: 10px;
		// box-shadow: 2px 1px 1px 0px #55aaff;

		box-shadow: -1px 0 0 0 #55aaff,
			/* 左侧阴影 */
			1px 0 0 0 #55aaff,
			/* 右侧阴影 */
			0 -1px 0 0 #55aaff,
			/* 顶部阴影 */
			0 1px 0 0 #55aaff;

		/* 底部阴影 */
		image {
			transform: scaleX(-1);
			// transform: rotate(-0deg);
		}
	}

	.car-icon {
		// width: 80px;
		// height: 30px;
		width: 90px;
		height: 50px;
		// transform: scaleX(-1);
		background-size: 100% 100%;
		background-repeat: no-repeat;
	}

	.car {
		background-image: url("../../static/car.png");
	}

	.mpv {

		background-image: url("../../static/mpv.png");
	}

	.suv {
		background-image: url("../../static/suv.png");

	}
</style>