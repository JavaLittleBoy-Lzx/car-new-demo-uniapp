<template>
	<view class="xm-keyboard-input">
		<view v-for="(item, index) in values" :key="index" class="xm-keyboard-input-item" :class="{ 
			'xm-cur': cur === index,
			'xm-show-pointer': showPointer
		}" :style="{
			marginLeft: (18 - max) + 'px',
			color: computedCursorColor,
			'--after-bg-color':computedCursorColor,
			width:  dynamicWidth + 'px'
		}" @click="changeCur(index)">
			<xm-square height="120%">
				<view class="xm-keyboard-input-cnt" :class="{
					'xm-cursor': cursor && cur === index && !item
				}">
					{{ item }}
				</view>
			</xm-square>
		</view>
	</view>
</template>



<script>
	export default {
		name: 'xm-keyboard-input',
		emits: ['change'],
		props: {
			initValue: {
				type: String,
				default: ''
			},
			cursor: {
				type: Boolean,
				default: false,
			},
			max: {
				type: Number,
				default: 7,
			},
			showPointer: {
				type: Boolean,
				default: true,
			},
			plateType: { // 新增 prop
				type: String,
				default: 'default'
			},
			dynamicWidth : { // 默认高度
				type: Number,
				default: 25
			}
		},
		data() {
			return {
				cur: 0,
				values: []
			}
		},
		computed: {
			computedCursorColor() {
				const colors = {
					default: '#fff',
					blue: '#fff',
					black: '#fff',
					yellow: 'black',
					white: 'black',
					newEnergy: 'black'
				};
				return colors[this.plateType] || colors.default;
			}
		},
		watch: {
			max(newVal, oldVal) {
				if (newVal !== oldVal) {
					console.log('🔄 车牌输入组件：max属性变化', { oldVal, newVal });
					this.initValues();
					this.cur = 0;
					this.toChange();
				}
			}
		},
		methods: {
			changeCur(index) {
				this.cur = index;
				this.toChange();
			},
			toChange() {
				this.$emit('change', this.cur)
			},
			toAdd(v) {
				this.values[this.cur] = v;
				// #ifdef VUE2
				this.$set(this.values, this.cur, v);
				// #endif
				if (this.cur < this.max - 1) {
					this.cur++;
					this.toChange()
				}
			},
			toDel() {
				// 找到最后一个有字符的位置
				let lastCharIndex = -1;
				for (let i = this.max - 1; i >= 0; i--) {
					if (this.values[i]) {
						lastCharIndex = i;
						break;
					}
				}

				// 如果没有字符，不执行删除
				if (lastCharIndex === -1) {
					return;
				}

				// 删除最后一个字符
				this.values[lastCharIndex] = '';
				// #ifdef VUE2
				this.$set(this.values, lastCharIndex, '');
				// #endif

				// 将光标移动到被删除字符的位置
				this.cur = lastCharIndex;
				this.toChange();
			},
			toClear() {
				this.cur = 0;
				this.initValues();
				this.toChange()
			},
			changeValue(v) {
				let max = Math.min(v.length, this.max);
				for (let i = 0; i < max; i++) {
					this.values[i] = v.charAt(i)
				}
				let cur = this.values.findIndex(x => !x)
				this.cur = cur === -1 ? this.max - 1 : cur;
				this.toChange()
			},
			initValues() {
				let vs = [];
				vs.length = this.max;
				vs.fill('');
				this.values = vs;
			}
		},
		mounted() {
			this.initValues();
			this.changeValue(this.initValue || '')
		}
	}
</script>

<style scoped lang="scss">
	.xm-keyboard-input {
		display: flex;

		$theme: #007AFF;
		$themeBackground: rgba(0, 73, 255, 0.03);

		@keyframes blink {
			0% {
				opacity: 0;
			}

			50% {
				opacity: 1;
			}

			100% {
				opacity: 0;
			}
		}

		&-item {
			width: 23px;
			height: 35px;
			box-sizing: border-box;
			border-radius: 2px;
			font-size: 25px;
			color: #fff;
			margin-top: 12px;

			&:first-child {
				margin-top: 10px;
			}

			&.xm-show-pointer:nth-child(2) {
				position: relative;
				margin-right: 5px;

				&::after {
					content: ' ';
					position: absolute;
					right: -12px;
					top: calc(50% - 3px);
					display: flex;
					align-items: center;
					width: 3px;
					height: 3px;
					background-color: var(--after-bg-color, #fff);
					border-radius: 100%;
					margin-top: -6px;
				}
			}

			&.xm-cur {
				// border-color: $theme;
				// background-color: $themeBackground;
				transition: 0.1s;
			}

			.xm-cursor {
				&::after {
					color: #fff;
					content: '|';
					animation: blink 1s infinite;
				}
			}
		}

		&-cnt {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 100%;
			height: 100%;
		}
	}
</style>