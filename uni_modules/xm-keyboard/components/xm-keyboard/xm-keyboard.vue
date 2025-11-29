<template>
	<view class="xm-keyboard">
		<view class="xm-content" v-if="show">
			<view class="xm-mask" v-if="mask" @tap="close"></view>
			<view class="xm-box" :class="anim?'xm-animation':''">
				<view class="xm-toolbar">
					<view class="xm-toolbar-left">
						<view class="keyboard-input" @tap.stop="changeCur()">
							<text v-for="(item, index) in input" :key="index" :class="cur === index ? 'cur abs':''" @tap.stop="changeCur(index)">{{ item }}</text>
							<text v-if="input.length === 0" class="cur"></text>
						</view>
						<view v-if="input.length" class="xm-tips">({{ input.length }}位)</view>
					</view>
					<view class="xm-toolbar-right">
						<view v-show="exchange" class="xm-toolbar-item" v-for="(item, index) in typeList" :key="index" @tap="changeType(item, index)">
							{{ item.name }}
						</view>
						<image class="xm-icon" @tap="close" style="margin-left: 20upx;" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAXNJREFUWEftlzEvBUEUhb/3R0SLp6IgUdC+QoWETqWTSESh8RQaEqFTiQYJhUZPp6Gk9Ac0/gE5L3NfxmbXu2uHjWSn3Myc883ZmTszLWpurZr9yQPoAgvAWGK4J+AWkH6/ZQE+EpsWyfV9Y4CdQHcPGG1KnmGgAywCu5ZEDPAITAAbwFFK50hrGbgAnoG2vscAFv8coBR+q5lPz7sBaBL4Fwnsh727BVyX2BpXwBAwlRlTehcchtognSUnhMxVcFTQJqsCaPw5sBKEBkGYuYqN+r6kAJDGKbA6ACI2nwdec35Z6V8Qa5wAawUQsfkM8F6wXioBSPMYWM9AxOa9Gv9Nqwwg7QNgM5g8ANPxAfMXAPLYA7aDmRaa9wKTJAGb5B0wAowDb84akRTA6fmlWwPQJFCYgF1KVW7PfrK6HGNmAe2c3EupXct15N4Alw7BMl1Gwwmph0nutVxitT5MbDZKQme5t7J5U3A9zbxiyfrV/jr+BLxqdyHzSmvBAAAAAElFTkSuQmCC" mode="widthFix"></image>
					</view>
				</view>
				<view class="xm-main" :class="['xm-mode-' + typeInfo.mode, ]" :style="{ paddingBottom: safeBottom + 'px' }">
					<view class="xm-main-left">
						<view class="xm-line" v-for="(lines, lineIndex) in list" :key="lineIndex">
							<view class="xm-btn" v-for="(item, index) in lines" :key="index" :class="disable.indexOf(item)!==-1?'disable':''" @tap="keyPress(item)"
								:style="{ 
									height: keyWidth * proportion + 'px',
									maxWidth: keyWidth + 'px',
									width: keyWidth + 'px',
									marginRight: minWidth + 'px'
								}">
								{{ item }}
								
								<view class="high-item" v-if="highItem == item">{{ item }}</view>
							</view>
						</view>
					</view>
					<view class="xm-main-right" :style="{ bottom: safeBottom + 'px' }">
						<view class="xm-line">
							<view class="xm-btn2" v-for="(bar,index) in bars" :key="index" @tap="toHandler(bar)"
								:style="{
									backgroundColor: bar.bgColor,
									color: bar.color,
									maxWidth: keyWidth * (typeInfo.mode == 1 ? 1.5:1) + 'px',
									width: keyWidth * (typeInfo.mode == 1 ? 1.5:1) + 'px',
									height: (typeInfo.mode == 1 ? (keyWidth * proportion + 'px') : '100%'),
									maxHeight: typeInfo.mode == 1 ? '':'unset',
									marginTop: typeInfo.mode == 1 ? '':((index != 0 ? 0 : 20) + 'upx')
								}"
							>
								<text v-if="bar.text">{{ bar.text }}</text>
								<image v-if="bar.img" :src="bar.img" mode="widthFix" class="xm-icon2"></image>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	/**
	 * show: 是否展示键盘
	 * mask: 是否展示遮罩
	 * anim: 是否开启弹出动画
	 * defaultValue: 键盘默认数据
	 * exchange: 是否展示切换工具栏
	 * mode: 键盘类型(0:车牌, 1:数字+字母, 2:数字, 3:字母)
	 * maxLength: 输入最大长度
	 * 
	 * @close: 键盘收起
	 * @change: 值变化
	 */
	export default {
		name: "xm-keyboard",
		props: {
			show: {
				required: true,
			},
			mask: {
				required: false,
				default: true
			},
			anim: {
				required: false,
				default: true
			},
			defaultValue: {
				required: false,
				default: () => '',
			},
			exchange: {
				required: false,
				default: true
			},
			mode: {
				required: false,
				default: 1,
			},
			maxLength: {
				required: false,
				default: -1,
			},
			disable: {
				required: false,
				default: () => ('IO')
			},
			maxAutoClose: {
				required: false,
				default: false,
			},
			safeSize: {
				required: false,
				default: 10,
			}
		},
		model: {
			prop: 'show',
			event: 'close'
		},
		watch: {
			show(n, o) {
				this.toShow(n, o);
			},
			mode(n, o){
				this.type = n;
			}
		},
		data() {
			
			const delPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAh5JREFUWEftl7+LU0EQx7/fQMS/QBCutBFEsL3uEAtByc6DiL84IxbKiaiFtpeUanMqihbK+eO0COxsYSloY60gWKugFjami6YYWX1P312Se3dJvGdxW73H7s73s7Ozs7NEyY0l62MTYE0eqNfrW3q93lGSewDsHmPbPpH8COCm9/5LtFMIkCTJlJndB7AvFX45KoCZTZHcAeA9gHOq+mxVgFqtNl2pVF4B+GZmrWq1utRut7+OChDnOef2A7hB8nu3250eCiAiOwG8i7RmJiGEN+MI5+eKyGEAT+OiBgIkSbLdzD7HlZM84L2PXphoE5HXv+yvtNpoNLZ2Op0PALYBOBj3aaLKqTHn3DzJZh+AiLwFsAvACVV9+C/E01joBxCR5wD2mtmFEML1InHnXCOEsDhoXJIkc97728Ns9HlARJ4AOGJmzRBCq0hcRI4BeAygraqHVgTZVQCXSJ4dBrEMQEQWAJwnueC9v1gknvU7566QvJyHEJE7AE4DuKaqsW9g+wMgIrMAHpBc9N6fXKt4DuIWybkIAeAHgOiZu6p6ZjVbeYAXcaCqzqxXPBsvIo8AHE//l1Q1+x5q8n8AaJKcZ4lb8Bsg+qikIPwLkEJkx7AVQmgWxcMEjuFygBRivYnoVAjh3oiJqB8ghdioVDwYYAMvo8EA0QulXse55FJeQZJBlFqSZRClFqUZRKlleVFCGre/8F0wrkDR/E2An6wZQ4Kdpz9AAAAAAElFTkSuQmCC'
			
			return {
				input: [],
				cur: 0,
				// 设备的宽度
				width: 0,
				// 设备的高度
				height: 0,
				// 按钮与空白的比例
				ratio: 7,
				// 当前键盘类型
				type: 0,
				typeList: [
					{ name: '地区', max: 10, list: [
						"京沪浙苏粤鲁晋冀豫川".split(''),
						"渝辽吉黑皖鄂津贵云桂".split(''),
						"琼青新藏蒙宁甘陕闽赣".split(''),
						"湘使领警学港澳".split(''),
					], mode: 1 },
					{ name: '英文', max: 10, list: [
						'1234567890'.split(''),
						'QWERTYUIOP'.split(''),
						'ASDFGHJKL'.split(''),
						'ZXCVBNM'.split(''),
					], mode: 1 },
					// { name: '数字', max: 3, list: [
					// 	"123",
					// 	"456",
					// 	"789",
					// 	".0x",
					// ], mode: 2 },
					// { name: '字母', max: 10, list: [
					// 	'QWERTYUIOP',
					// 	'ASDFGHJKL',
					// 	'ZXCVBNM',
					// ], mode: 1 },
				],
				bars: [
					{ fun: 'close', text: '完成', bgColor: '#f37b1d', color: '#ffffff' },
					{ fun: 'del', img: delPng },
				],
				// 安全底部距离
				safeBottom: 0,
				// 正在点击的键盘
				highItem: '',
			};
		},
		computed: {
			//按钮 高:宽 占比
			proportion(){
				return 4 / 3;
			},
			minWidth(){
				return this.width / ((this.max + this.typeInfo.mode - 1) * this.ratio + this.max + 1);
			},
			keyWidth() {
				return this.minWidth * this.ratio; 
			},
			typeInfo(){
				return this.typeList[this.type];
			},
			list(){
				return this.typeInfo.list;
			},
			max(){
				return this.typeInfo.max;
			}
		},
		methods: {
			toShow(n, o){
				if(n){
					this.input = this.defaultValue.split('')
					this.cur = this.input.length - 1;
					this.type = this.mode;
				}
			},
			close() {
				this.$emit('close', false)
				this.input.length = 0;
			},
			del(){
				this.downEvent()
				let v = this.input.splice(this.cur, 1);
				this.emitChange(v, false);
			},
			keyPress(v){
				if(this.maxLength > 0 && this.input.length >= this.maxLength){
					return ;
				}
				if(this.disable.indexOf(v) !== -1){
					return ;
				}
				
				this.downEvent(v)
				this.input.splice(this.cur + 1, 0, v);
				this.emitChange(v);
				
				if(this.maxLength > 0 && this.input.length >= this.maxLength){
					if(this.maxAutoClose != void 0 && this.maxAutoClose != false){
						this.close();
					}
				}
			},
			changeCur(index){
				this.cur = index || this.input.length - 1;
			},
			emitChange(v = '', add = true){
				if(add){
					this.cur ++;
				}else{
					this.cur --;
					if(this.cur < 0){
						this.cur = 0;
					}
				}
				this.$emit('change', { text: this.input.join(''), v, add })
			},
			changeType(item, index){
				this.type = index;
			},
			toHandler(bar){
				bar.fun && this[bar.fun] && this[bar.fun]();
			},
			downEvent(item = ''){
				uni.vibrateShort && uni.vibrateShort({});
				
				if(item){
					this.highItem = item;
					
					clearTimeout(this.highCid)
					this.highCid = setTimeout(() => {
						this.highItem = '';
					}, 200)
				}else{
					this.highItem = '';
				}
			}
		},
		mounted() {
			const { windowWidth, windowHeight, safeAreaInsets } = uni.getSystemInfoSync();
			this.width = windowWidth;
			this.height = windowHeight;
			this.safeBottom = safeAreaInsets.bottom || this.safeSize
			
			this.toShow(this.show);
			
		},

	}
</script>

<style lang="scss" scoped>
	.xm-keyboard {

		$xm-border-color: #D4D4D4;
		$xm-shadow-color: rgba(0, 0, 0, 0.1);
		$xm-mask-bg-color: rgba(0, 0, 0, 0.4);
		$xm-box-bg-color: #FFFFFF;
		font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Segoe UI, Arial, Roboto, 'PingFang SC', 'miui', 'Hiragino Sans GB', 'Microsoft Yahei', sans-serif;
		
		@keyframes xm-up {
		    0% { opacity: 0; transform: translateY(100%) }
		    100% { opacity: 1; transform: translateY(0) }
		}

		.xm-fixed-b {
			position: fixed;
			left: 0;
			right: 0;
			bottom: 0;
		}

		.xm-flex {
			display: flex;
			align-items: center;
		}

		.xm-icon {
			width: 32upx;
			height: 32upx;
		}
		
		.xm-icon2 {
			width: 48upx;
			height: 48upx;
		}
		
		.xm-animation{
			animation-duration: .2s;
			animation-timing-function: ease-out;
			animation-fill-mode: both;
			animation-name: xm-up;
		}

		.xm-content {
			
		}

		.xm-mask {
			@extend .xm-fixed-b;
			z-index: 992;
			top: 0;
			background-color: $xm-mask-bg-color;
		}

		.xm-box {
			@extend .xm-fixed-b;
			z-index: 993;
			min-height: 100px;
			width: 100%;
			background-color: $xm-box-bg-color;
			box-shadow: 0 0 10upx $xm-shadow-color;
			border-top: 2upx solid $xm-border-color;
			flex-direction: column;
		}

		.xm-toolbar {
			@extend .xm-flex;
			justify-content: space-between;
			padding: 10upx 20upx;
			border-bottom: 2upx solid #E0E1E2;

			&-left {
				@extend .xm-flex;
			}

			&-right {
				position: relative;
				@extend .xm-flex;

				&::before {
					content: '|';
					position: absolute;
					top: -4upx;
					bottom: 0;
					left: -30upx;
					color: #DEDEDE;
				}
			}
			
			&-item{
				margin-left: 20upx;
				font-size: 24upx;
				color: #999;
				border: 2upx solid $xm-border-color;
				padding: 4upx 8upx;
				border-radius: 4upx;
				
				&:first-child{
					margin-left: 0;
				}
			}
		}

		.xm-main {
			background-color: #D4D5DA;
			padding: 20upx 10upx;

			.xm-line {
				@extend .xm-flex;
				justify-content: center;
				padding-top: 20upx;
				&:first-child{
					padding-top: 0;
				}
			}
			
			.xm-common-btn{
				@extend .xm-flex;
				justify-content: center;
				box-shadow: 0 0 10upx rgba(0, 0, 0, 0.1);
				border-radius: 6upx;
				max-height: 120upx;
			}

			.xm-btn {
				@extend .xm-common-btn;
				background-color: #FCFFFF;
				position: relative;

				&:last-child {
					margin-right: 0 !important;
				}
				// &:active:not(.disable){
				// 	transform: scale(1.8, 1.8);
				// }
				&.disable{
					background-color: #BDBEC3;
				}
			}
			
			.high-item{
				position: absolute;
				width: 140%;
				height: 140%;
				top: calc(-140% - 10px);
				@extend .xm-common-btn;
				background-color: #FCFFFF;
				font-size: 18px;
				font-weight: bold;
				
				&::after{
					content: ' ';
					width: 0;
					height: 0;
					border-left: 10px solid transparent;
					border-right: 10px solid transparent;
					border-top: 10px solid #FCFFFF;
					position: absolute;
					bottom: -10px;
				}
			}
			
			.xm-btn2{
				@extend .xm-common-btn;
				background-color: #BDBEC3;
				&:active{
					transform: scale(1.2, 1.2);
				}
			}
		}
		
		.xm-mode-1{
			.xm-main-left{
				.xm-btn{
					z-index: 2;
				}
			}
			.xm-main-right{
				@extend .xm-fixed-b;
				left: 10upx;
				right: 10upx;
				bottom: 20upx;
				z-index: 1;
				
				.xm-line{
					justify-content: space-between;
				}
			}
		}
		
		.xm-mode-2{
			display: flex;
			justify-content: space-between;
			
			.xm-main-right{
				.xm-line{
					height: 100%;
					display: flex;
					flex-direction: column;
					justify-content: space-between;
					flex-flow: column-reverse;
				}
			}
		}
		
		
		.keyboard-input{
			display: inline-block;
			min-width: 200upx;
			border-bottom: 1px solid #CCC;
			padding: 0 6px;
			
			@keyframes blink{
				0%{ opacity: 0; }
				50%{ opacity: 1; }
				100%{ opacity: 0; }
			}
			.cur:after{
				&.abs{
					position: absolute;
				}
				color: #39B54A;
				content: '|';
				animation: blink 1s infinite;
			}
		}
		.xm-tips{
			display: inline-block; 
			margin-left: 20upx;
			color: #8799a3;
			font-size: 20upx;
		}

	}
</style>
