<template>
	<view class="xm-square" :style="{ paddingBottom: height }">
		<view class="xm-square-box">
			<slot></slot>
		</view>
	</view>
</template>

<script>
	export default {
		props: {
			height: {
				type: String,
				default: '100%'
			},
		}
	}
</script>

<style scoped lang="scss">
	.xm-square {
		width: 100%;
		height: 0;
		position: relative;

		&-box {
			position: absolute;
			width: 100%;
			height: 100%;
		}
	}
</style>