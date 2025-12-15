# cc-defineQRCode 

### 二维码小程序已上线，小程序扫码体验地址

![图片](https://i.postimg.cc/R01yVHSG/Wechat-IMG172.jpg)



##uniapp专属精品组件页面模板（由前端组件开发出品）精品组件页面模板

###●组件模板规划：
由前端组件开发出品的精品组件页面模板，将陆续发布，预计高达约几百种供您使用，是快速快发项目、创业的必备精品。

合集地址： uni-app模板合集地址：(https://ext.dcloud.net.cn/publisher?id=274945) 如查看全部页面模板，请前往上述uniapp插件市场合集地址；

###●组件模板效果图：
可下载项目后预览，效果图见右侧图片；

###●组件模板费用：
学习：免费下载，进行学习，无费用；

使用/商用：本页面地址赞赏10元后，可终身商用；

###●组件模板使用版权/商用：
本组件模板免费下载可供学习，如需使用及商用，请在本组件页面模板进行赞赏10元

（仅需10元获取精品页面模板代码-物有所值，1个组件页面市场价100元 ）

赞赏10元后（当前项目产生赞赏订单可追溯）即可终身商用当前本地址下载的页面模版代码，不同下载地址需进行不同的赞赏。（不赞赏就进行商用使用者，面临侵权！保留追究知识产权法律责任！后果自负！）

### 我的技术公众号(私信可加前端技术交流群)

群内气氛挺不错的，应该或许可能大概，算是为数不多的，专搞技术的前端群，偶尔聊天摸鱼

![图片](https://i.postimg.cc/RZ0sjnYP/front-End-Component.jpg)

#### 使用方法

```使用方法
 #引入js文件
import uQRCode from './common/uqrcode.js'

<view class="canvas">
<!-- 二维码插件 width height设置宽高 -->
<canvas canvas-id="qrcode" :style="{width: `${qrcodeSize}px`, height: `${qrcodeSize}px`}" />
</view>
```

#### HTML代码实现部分
```html
<template>
	<view class="content">

		<view class="canvas">
			<!-- 二维码插件 width height设置宽高 -->
			<canvas canvas-id="qrcode" :style="{width: `${qrcodeSize}px`, height: `${qrcodeSize}px`}" />
		</view>

		<text class="list-text">{{ '预约号码:' + ' ' + myFormatData.yyh}}
		</text>

		<text class="list-text"> {{ '预约窗口:' + '  ' + myFormatData.bsdmc}}
		</text>

		<text class="list-text"> {{ '业务类型:' + '  ' + myFormatData.Yylxmc}}
		</text>

		<text class="list-text"> {{ '预约日期:' + '  ' + myFormatData.yyrq}}
		</text>


	</view>
</template>

<script>
	import Vue from 'vue';
	import uQRCode from './common/uqrcode.js'



	export default {
		data() {
			return {
				// 二维码标识串
				qrcodeText: 'eoruw20230528',
				// 二维码尺寸
				qrcodeSize: 136,

				// 最终生成的二维码图片
				qrcodeSrc: '',


				myFormatData: {
					'yyh': 'eoruw20230528',
					'bsdmc': '窗口1',
					'Yylxmc': '租金缴纳',
					'yyrq': '预约日期'
				},
			}
		},
		onLoad(e) {

			this.make();
		},
		methods: {

			make() {
				uni.showLoading({
					title: '二维码生成中',
					mask: true
				})

				uQRCode.make({
					canvasId: 'qrcode',
					text: this.qrcodeText,
					size: this.qrcodeSize,
					margin: 10,
					success: res => {
						this.qrcodeSrc = res
						console.log('qrcodeSrc = ' + this.qrcodeSrc);
					},
					complete: () => {
						uni.hideLoading()
					}
				})
			},


		}
	}
</script>

<style>
	page {
		background-color: #FFFFFF;
	}

	.content {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		margin-top: var(--status-bar-height);
	}


	.text {
		display: flex;
		justify-content: center;
		margin-top: 46rpx;
		margin-bottom: 6rpx;
		font-size: 36rpx;
		height: 44rpx;
		color: #333333;
	}

	.canvas {
		margin-top: 50rpx;
		margin-bottom: 36rpx;
		text-align: center;
	}


	.list-text {
		display: flex;
		justify-content: center;
		width: 100%;
		line-height: 60rpx;
		font-size: 28rpx;
		color: #666666;
	}

	.button {
		width: 88%;
		margin-top: 52rpx;

	}
</style>






```