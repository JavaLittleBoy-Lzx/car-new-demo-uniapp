<template>
	<view class="xm-keyboard-box">
		<view class="xm-keyboard-box-line" v-for="(line, li) in lines[mode]" :key="li" :style="{
			marginLeft: diffSize(line.diff) + 'px',
			marginRight: diffSize(line.diff) / -1 + 'px',
		}">
			<view v-for="(item, index) in line.list" :key="index" class="xm-keyboard-box-item" :class="{
				'xm-keyboard-box-item-empty': item == '',
			}" :style="{
				width: btnWidth + 'px',
				height: btnHeight + 'px'
			}" @click="toClick(item)">
				{{ item }}
			</view>
		</view>
		<view class="xm-keyboard-box-line xm-keyboard-box-toolbar">
			<view v-if="showCancelBtn" class="xm-keyboard-box-item xm-keyboard-box-btn xm-keyboard-box-btn-cancel" :style="{
				marginRight: btnWidth / ratio + 'px',
				height: btnHeight + 'px'
			}" @click="toCancel()">取消</view>
			<view class="xm-keyboard-box-item xm-keyboard-box-btn xm-keyboard-box-btn-clear" :style="{
				marginRight: btnWidth / ratio + 'px',
				height: btnHeight + 'px'
			}" @click="toClear()">清空</view>
			<view class="xm-keyboard-box-item xm-keyboard-box-btn-over" :style="{
				marginRight: btnWidth / ratio + 'px',
				height: btnHeight + 'px'
			}" @click="toConfirm()">完成</view>
		</view>

		<view v-if="showChangeBtn" class="xm-keyboard-box-item xm-keyboard-box-btn xm-keyboard-box-btn-change" :style="{
			width: handlerWidth + 'px',
			height: btnHeight + 'px',
			bottom: 'calc(20px + '+btnHeight+'px)'
		}" @click="changeMode()">
			<i class="iconxmk2 icon-xm-k2-jianpan" style="font-size: 24px;"></i>
		</view>

		<view class="xm-keyboard-box-item xm-keyboard-box-btn xm-keyboard-box-btn-del" :style="{
			width: handlerWidth + 'px',
			height: btnHeight + 'px',
			bottom: 'calc(20px + '+btnHeight+'px)'
		}" @click="toDel()">
			<i class="iconxmk2 icon-xm-k2-backspace" style="font-size: 24px;"></i>
		</view>

	</view>
</template>

<script>
	export default {
		name: 'xm-keyboard-box',
		emits: ['add', 'del', 'confirm', 'cancel', 'clear'],
		props: {
			// 是否开启震动效果
			vibration: {
				type: Boolean,
				default: false
			},
			// 是否显示切换按钮
			showChangeBtn: {
				type: Boolean,
				default: true
			},
			// 是否显示取消按钮
			showCancelBtn: {
				type: Boolean,
				default: true
			}
		},
		data() {
			return {
				mode: 0,
				ratio: 7,
				max: 10,
				gutter: 10,
				btnWidth: 10,
				btnHeight: 10,
				handlerWidth: 10,
				lines: [
					[{
							list: ["京", "沪", "浙", "苏", "粤", "鲁", "晋", "冀", "豫", "川"],
							diff: 0,
						},
						{
							list: ["渝", "辽", "吉", "黑", "皖", "鄂", "津", "贵", "云", "桂"],
							diff: 0,
						},
						{
							list: ["琼", "青", "新", "藏", "蒙", "宁", "甘", "陕", "闽", "赣"],
							diff: 0,
						},
						{
							list: ["湘", "使", "领", "警", "学", "港", "澳", "", "", ""],
							diff: 3,
						},
					],
					[{
							list: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
							diff: 0,
						},
						{
							list: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
							diff: 0,
						},
						{
							list: ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ''],
							diff: 1,
						},
						{
							list: ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '', '', ''],
							diff: 3,
						},
					],
				],
			}
		},
		methods: {
			diffSize(pos) {
				if (pos == 0) {
					return 0
				}
				return (pos * this.btnWidth + pos * this.btnWidth / this.ratio) / 2
			},
			changeMode(v) {
				this.mode = v == void 0 ? (this.mode == 0 ? 1 : 0) : v
			},
			toClick(item) {
				if (item === '') {
					return;
				}
				this.toEmit('add', item);
			},
			toDel() {
				this.toEmit('del');
			},
			toCancel(){
				this.toEmit('cancel');
			},
			toConfirm() {
				this.toEmit('confirm')
			},
			toClear() {
				this.toEmit('clear')
			},
			toEmit(type, params){
				this.toVibration();
				this.$emit(type, params);
			},
			toVibration() {
				if (this.vibration && uni.vibrateShort) {
					uni.vibrateShort();
				}
			}
		},
		mounted() {
			const {
				windowWidth
			} = uni.getSystemInfoSync();
			let _width = (windowWidth - this.gutter * 2) * this.ratio / (this.max * this.ratio + this.max - 1)
			this.btnWidth = _width.toFixed(2)
			this.btnHeight = (_width / 3 * 4).toFixed(2)
			this.handlerWidth = (_width * 1.5 + _width / (this.ratio * 2)).toFixed(2)
		}
	}
</script>

<style lang="scss" scoped>
	@import url(../../styles/iconfont/iconfont.css);

	.xm-keyboard-box {
		$gutter: 10px;

		background-color: #d4d5d9;
		padding: $gutter;
		position: relative;

		.xm-flex {
			display: flex;
			align-items: center;
		}

		&-line {
			@extend .xm-flex;
			justify-content: space-between;
			margin-bottom: $gutter;

			&:last-child {
				margin-bottom: 0;
			}
		}

		&-item {
			background-color: #FCFFFF;
			@extend .xm-flex;
			justify-content: center;
			border-radius: 4px;
			box-shadow: 0px 2px 2px #999;
			position: relative;

			&:active {
				background-color: rgba(0, 0, 0, 0.1);
			}

			&-empty {
				background-color: unset;
				box-shadow: unset;

				&:active {
					background-color: unset;
				}
			}
		}

		&-btn {
			background-color: #b6bcc4;

			&:active {
				background-color: rgba(182, 188, 196, 0.8);
			}
		}

		&-btn-del {
			position: absolute;
			right: $gutter;
		}

		&-btn-change {
			position: absolute;
			left: $gutter;
		}

		&-btn-over {
			// position: absolute;
			background-color: #f37b1d;
			color: #fff;

			&:active {
				background-color: rgba(243, 123, 29, 0.8);
			}
		}

		&-toolbar {
			margin-bottom: 0;
			.xm-keyboard-box-item {
				width: 100%;

				&:last-child {
					margin-right: 0 !important;
				}
			}
		}
	}
</style>