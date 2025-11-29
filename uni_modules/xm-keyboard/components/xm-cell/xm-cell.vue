<template>
	<view class="xm-cell" :class="{ 
		'xm-cell-clickable': clickable,
		'xm-cell-border': border,
	}" @click.stop="$emit('show', $event)">
		<view class="xm-cell-label">
			<view v-if="label">{{ label }}</view>
			<slot v-else name="label"></slot>
		</view>
		<view class="xm-cell-value">
			<view v-if="value" :class="{ 'xm-cell-special': special }">{{ valueFormat(value) }}</view>
			<slot v-else></slot>
		</view>
		<view v-if="arrow" class="xm-cell-arrow"></view>
	</view>
</template>

<script>
	export default {
		name: 'xm-cell',
		emits: ['show'],
		props: {
			label: {
				type: String,
				default: ''
			},
			value: {
				type: String,
				default: ''
			},
			// 是否显示右箭头
			arrow: {
				type: Boolean,
				default: true
			},
			// 是否显示点击效果
			clickable: {
				type: Boolean,
				default: true
			},
			border: {
				type: Boolean,
				default: true
			},
			special: {
				type: Boolean,
				default: false
			}
		},
		methods: {
			valueFormat(value){
				if(!value){
					return ''
				}
				if(!this.special){
					return value;
				}
				return [ value.substring(0, 2), value.substring(2) ].filter(x => x).join('·')
			}
		}
	}
</script>

<style lang="scss" scoped>
	.xm-cell {
		position: relative;
		flex: 1;
		width: 100%;
		display: flex;
		box-sizing: border-box;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		padding: 10px 22px 10px 16px;
		background-color: #FFF;
		font-size: 14px;
		height: 48px;

		&-label {
			color: #323233;
		}

		&-value {
			color: #969799;
		}

		&-arrow {
			height: 20px;
			width: 20px;
			border-width: 3px 3px 0 0;
			border-style: solid;
			transform: rotate(45deg) scale(0.5);
			border-radius: 2px;
			flex-shrink: 0;
			margin-left: auto;
			box-sizing: border-box;
			transform-origin: center center;
			margin-right: -3px;
			border-color: #969799;
			position: absolute;
			right: 10px;
		}

		&-clickable:active {
			background-color: rgba(0, 0, 0, 0.03) !important;
		}

		&-border::after {
			position: absolute;
			box-sizing: border-box;
			content: ' ';
			pointer-events: none;
			right: 16px;
			bottom: 0;
			left: 16px;
			border-bottom: 1px solid #ebedf0;
			-webkit-transform: scaleY(0.5);
			transform: scaleY(0.5);
		}

		&-special {
			font-family: '微软雅黑';
			display: inline-block;
			padding: 4px 6px;
			background-color: #0072C6;
			color: #FFFFFF;
			letter-spacing: 2px;
			text-align: center;
			border-radius: 2px;
		}
	}
</style>